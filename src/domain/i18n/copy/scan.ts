// T020 (FR-010): the scan screen's complete Spanish/English copy dictionary — every string
// docs/design-brief-visual-identity.md §5 specifies for the visual shell (mobile and web).
// Consumed via useTranslation(scanCopy) once the scan visual-shell tasks (T038+) wire it in —
// this task only builds and tests the dictionary itself.
//
// specs/008-scan-experience/tasks.md T006 (FR-008, FR-009, FR-017) extends this dictionary with
// the found-viewfinder heading, the found-card panel's own copy, and the five condition-chip
// labels — consumed by Viewfinder.tsx (T015) and FoundCardPanel.tsx (T014). Condition-chip keys
// are named `condition<Option>`, one per src/domain/scanResults.ts's ConditionOption value
// (nearMint/excellent/veryGood/good/fair), keeping this dictionary's established flat
// `Record<keyof typeof es, string>` shape rather than nesting a sub-object.
//
// `backLabel`/`backAccessibilityLabel` (the "Back"/"Back to Home" affordance app/scan.tsx,
// 004-home-scan-shell, used to render) were removed here as a standalone follow-up fix once
// T019 (specs/008-scan-experience) retired app/scan.tsx and its "Back" affordance in favor of
// the persistent shell's own navigation (FR-003) — those two keys had no remaining consumer
// (grep-confirmed before removal). See progress/impl_008-scan-experience.md's dedicated
// follow-up entry.
//
// `statusPillCameraAvailable` was removed here for the same reason, in the same run that
// implemented T021 (US4, FR-005): T021 removed the web-only "Cámara disponible" `StatusPill` —
// the badge this key's copy described — from `ScanShellScreen.web.tsx` (the badge's only-ever
// consumer; the mobile shell never rendered it). Grep-confirmed zero remaining consumers before
// removal.
//
// `uploadDropzone`'s existing key (below) was reviewed for T006: its phrasing already reads as
// an actionable command ("Subir imagen de carta" / "Upload a card image"), which is exactly what
// an accessibilityLabel on a real Pressable (T017) needs — no change was necessary now that the
// dropzone becomes interactive.
//
// `label.section` (src/theme/typography.ts) already applies `textTransform: "uppercase"` at
// render time, so `recentScansHeading` is stored in natural case ("Escaneos recientes") — the
// brief's all-caps "ESCANEOS RECIENTES" rendering comes from that shared style.
//
// The recent-scans list's actual ROW content (thumbnail/name/meta/price) is static local
// placeholder DATA per spec.md FR-008 — not translated copy, and deliberately not represented
// here (a future scanner feature replaces that data entirely; it was never meant to carry brand
// voice). Only the section's own static heading is real copy, included below.
const es = {
  titleMobile: "Escanear",
  titleWeb: "Escanear carta",
  viewfinderHint: "Apunta la cámara a la carta",
  searchPlaceholder: "Buscar carta por nombre o código…",
  uploadDropzone: "Subir imagen de carta",
  scanButton: "Escanear carta",
  emptyResultsLine1: "Escanea una carta para ver sus detalles aquí",
  emptyResultsLine2: "Los resultados aparecerán automáticamente",
  recentScansHeading: "Escaneos recientes",

  // --- Found viewfinder state (T006, FR-008) ---
  viewfinderFoundHeading: "¡Carta encontrada!",

  // --- Found-card panel (T006, FR-008, FR-009) ---
  gradedLabel: "Gradeada",
  gradeValuePlaceholder: "—",
  removeLink: "Eliminar",
  changeLink: "Cambiar",
  quantityLabel: "Cantidad",
  marketPriceLabel: "Precio de mercado",
  acceptButton: "Aceptar",
  acceptedConfirmation: "Carta agregada",

  // --- Condition-chip labels, one per ConditionOption (src/domain/scanResults.ts, T006) ---
  conditionNearMint: "Casi Nuevo",
  conditionExcellent: "Excelente",
  conditionVeryGood: "Muy Bueno",
  conditionGood: "Bueno",
  conditionFair: "Aceptable",
};

// `en`'s type is constrained to exactly `es`'s keys — a missing English translation is a
// compile-time error, not just a unit-test failure (copy/scan.test.ts's runtime key-parity check
// below is defense-in-depth for the case of a key present with an accidentally-empty value).
const en: Record<keyof typeof es, string> = {
  titleMobile: "Scan",
  titleWeb: "Scan a card",
  viewfinderHint: "Point the camera at the card",
  searchPlaceholder: "Search for a card by name or code…",
  uploadDropzone: "Upload a card image",
  scanButton: "Scan card",
  emptyResultsLine1: "Scan a card to see its details here",
  emptyResultsLine2: "Results will appear automatically",
  recentScansHeading: "Recent scans",

  viewfinderFoundHeading: "Card found!",

  gradedLabel: "Graded",
  gradeValuePlaceholder: "—",
  removeLink: "Remove",
  changeLink: "Change",
  quantityLabel: "Quantity",
  marketPriceLabel: "Market price",
  acceptButton: "Accept",
  acceptedConfirmation: "Card added",

  conditionNearMint: "Near Mint",
  conditionExcellent: "Excellent",
  conditionVeryGood: "Very Good",
  conditionGood: "Good",
  conditionFair: "Fair",
};

export const scanCopy = { es, en };
