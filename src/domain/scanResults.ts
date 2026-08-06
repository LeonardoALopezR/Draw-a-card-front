// Pure TypeScript, no React/React Native imports (Constitution IV) — the found-card sample
// pool and its portable transition functions, per specs/008-scan-experience/tasks.md T002
// (FR-007, FR-008, FR-009, FR-010, spec.md Key Entities). This is the one shared source of
// truth both `src/features/scanner/useScanSimulation.ts` (mobile/web trigger) and
// `RecentScansList.tsx` (the "ESCANEOS RECIENTES" list) read from — see plan.md's "Sample-card
// pool" Research Decision. Only `@/theme/colors` (itself zero-RN-import) is imported, so
// `thumbnailGradient` below always references a real theme token pair, never a raw hex literal.
//
// thumbnailGradient (follow-up to specs/008-scan-experience, human-requested, 2026-08-06):
// originally a single flat `thumbnailColorToken: string`, per the spec's Key Entities section —
// rendered as a flat swatch, not the gradient the supplied mockups actually show. Replaced with
// an ordered two-color-stop tuple read from `colors.gradients` (still plain data, no
// React/React Native import here — the gradient *rendering* lives in
// `src/features/scanner/CardThumbnail.tsx`, an `expo-linear-gradient` wrapper, since that
// package is already an installed, already-used dependency — see that file's own comment for the
// "why no new dependency" reasoning).
import { colors } from "@/theme/colors";

export type ConditionOption = "nearMint" | "excellent" | "veryGood" | "good" | "fair";

// Documented order — also the order FoundCardPanel's condition-chip row renders in (T014).
export const CONDITION_OPTIONS: readonly ConditionOption[] = [
  "nearMint",
  "excellent",
  "veryGood",
  "good",
  "fair",
];

export interface SampleCard {
  readonly id: string;
  readonly name: string;
  readonly setLabel: string;
  readonly code: string;
  readonly grade: string;
  readonly priceLabel: string;
  /** Ordered light-stop -> dark-stop color pair from `src/theme/colors.ts`'s `gradients`
   * namespace — never a raw hex literal at this call site or any consumer's. */
  readonly thumbnailGradient: readonly [string, string];
  readonly defaultCondition: ConditionOption;
  readonly defaultGraded: boolean;
}

// The three mockup-specified cards (spec.md Design note, "the sample-card pool") — single
// source of truth for both the found panel and the recent-scans list (FR-010). Card
// names/set labels/codes/grades are data, not UI chrome, and are deliberately NOT run through
// the i18n dictionary (FR-017, matching the precedent RecentScansList's own placeholder data
// already set).
export const SAMPLE_CARDS: readonly SampleCard[] = [
  {
    id: "dragon-eterno",
    name: "Dragón Eterno",
    setLabel: "Genesis",
    code: "GEN-001",
    grade: "PSA 10",
    priceLabel: "$45,000",
    thumbnailGradient: colors.gradients.cardPurple,
    defaultCondition: "nearMint",
    defaultGraded: true,
  },
  {
    id: "fenix-de-tormenta",
    name: "Fénix de Tormenta",
    setLabel: "Arcana",
    code: "ARC-047",
    grade: "BGS 9.5",
    priceLabel: "$12,500",
    thumbnailGradient: colors.gradients.cardEmber,
    defaultCondition: "nearMint",
    defaultGraded: true,
  },
  {
    id: "serpiente-del-vacio",
    name: "Serpiente del Vacío",
    setLabel: "Genesis",
    code: "GEN-022",
    grade: "PSA 9",
    priceLabel: "$8,900",
    thumbnailGradient: colors.gradients.cardTeal,
    defaultCondition: "nearMint",
    defaultGraded: true,
  },
];

export const MIN_QUANTITY = 1;

export interface FoundCardState {
  readonly card: SampleCard;
  readonly condition: ConditionOption;
  readonly graded: boolean;
  readonly quantity: number;
}

/** Seeds a fresh found-card state from a sample card's own defaults (FR-008). */
export function startFoundState(card: SampleCard): FoundCardState {
  return {
    card,
    condition: card.defaultCondition,
    graded: card.defaultGraded,
    quantity: MIN_QUANTITY,
  };
}

/** Selects a different condition chip — exactly one is ever selected (FR-008). */
export function selectCondition(state: FoundCardState, condition: ConditionOption): FoundCardState {
  return { ...state, condition };
}

/** Flips the "Gradeada" toggle only — never touches price/condition/quantity (FR-008). */
export function toggleGraded(state: FoundCardState): FoundCardState {
  return { ...state, graded: !state.graded };
}

/** Increases the quantity stepper by 1, no upper bound (FR-008). */
export function incrementQuantity(state: FoundCardState): FoundCardState {
  return { ...state, quantity: state.quantity + 1 };
}

/** Decreases the quantity stepper by 1, clamped at MIN_QUANTITY (FR-008). */
export function decrementQuantity(state: FoundCardState): FoundCardState {
  return { ...state, quantity: Math.max(MIN_QUANTITY, state.quantity - 1) };
}

/**
 * "Cambiar" — advances to the next card in SAMPLE_CARDS (cycling back to the first after the
 * last), re-seeding condition/graded/quantity to that card's own defaults rather than carrying
 * over the previous card's values (FR-009).
 */
export function advanceToNextCard(state: FoundCardState): FoundCardState {
  const currentIndex = SAMPLE_CARDS.findIndex((card) => card.id === state.card.id);
  const nextIndex = (currentIndex + 1) % SAMPLE_CARDS.length;
  return startFoundState(SAMPLE_CARDS[nextIndex]);
}

/** `"${grade} · ${code}"` — RecentScansList's per-row meta line (FR-010). */
export function formatListMeta(card: SampleCard): string {
  return `${card.grade} · ${card.code}`;
}

/** `"${setLabel} · ${code}"` — FoundCardPanel's detail meta line (FR-008). */
export function formatDetailMeta(card: SampleCard): string {
  return `${card.setLabel} · ${card.code}`;
}
