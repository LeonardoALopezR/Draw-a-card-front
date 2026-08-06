// specs/008-scan-experience/tasks.md T002 (FR-007, FR-008, FR-009, FR-010, spec.md Key
// Entities) — direct unit tests of the found-card pure transition functions, per
// docs/verification.md Level 1 ("business logic tested directly in src/domain, not only
// indirectly through a component render").
import { colors } from "@/theme/colors";

import {
  advanceToNextCard,
  decrementQuantity,
  formatDetailMeta,
  formatListMeta,
  incrementQuantity,
  MIN_QUANTITY,
  SAMPLE_CARDS,
  selectCondition,
  startFoundState,
  toggleGraded,
} from "./scanResults";

describe("SAMPLE_CARDS (FR-010)", () => {
  it("has exactly the three mockup-specified cards, in order", () => {
    expect(SAMPLE_CARDS.map((c) => c.name)).toEqual([
      "Dragón Eterno",
      "Fénix de Tormenta",
      "Serpiente del Vacío",
    ]);
  });

  it("seeds every card with defaultCondition nearMint and defaultGraded true", () => {
    for (const card of SAMPLE_CARDS) {
      expect(card.defaultCondition).toBe("nearMint");
      expect(card.defaultGraded).toBe(true);
    }
  });

  // Human-requested follow-up (2026-08-06): each card's thumbnail is a distinct gradient, not a
  // flat color, and every stop must reference an existing src/theme token — never a raw hex
  // literal at this call site.
  it("gives each card a two-stop thumbnailGradient sourced from src/theme/colors.ts's gradients tokens", () => {
    expect(SAMPLE_CARDS[0].thumbnailGradient).toBe(colors.gradients.cardPurple);
    expect(SAMPLE_CARDS[1].thumbnailGradient).toBe(colors.gradients.cardEmber);
    expect(SAMPLE_CARDS[2].thumbnailGradient).toBe(colors.gradients.cardTeal);

    for (const card of SAMPLE_CARDS) {
      expect(card.thumbnailGradient).toHaveLength(2);
      expect(card.thumbnailGradient[0]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(card.thumbnailGradient[1]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("gives each card a visually distinct gradient (no two cards share a thumbnailGradient)", () => {
    const serialized = SAMPLE_CARDS.map((card) => card.thumbnailGradient.join(","));
    expect(new Set(serialized).size).toBe(SAMPLE_CARDS.length);
  });
});

describe("startFoundState (FR-008)", () => {
  it("seeds condition/graded/quantity from the card's own defaults", () => {
    const state = startFoundState(SAMPLE_CARDS[0]);
    expect(state.card).toBe(SAMPLE_CARDS[0]);
    expect(state.condition).toBe(SAMPLE_CARDS[0].defaultCondition);
    expect(state.graded).toBe(SAMPLE_CARDS[0].defaultGraded);
    expect(state.quantity).toBe(MIN_QUANTITY);
  });
});

describe("selectCondition (FR-008)", () => {
  it("updates only the condition field", () => {
    const state = startFoundState(SAMPLE_CARDS[0]);
    const next = selectCondition(state, "fair");
    expect(next.condition).toBe("fair");
    expect(next.graded).toBe(state.graded);
    expect(next.quantity).toBe(state.quantity);
    expect(next.card).toBe(state.card);
  });
});

describe("toggleGraded (FR-008)", () => {
  it("flips the boolean only", () => {
    const state = startFoundState(SAMPLE_CARDS[0]);
    const toggledOff = toggleGraded(state);
    expect(toggledOff.graded).toBe(!state.graded);
    expect(toggledOff.condition).toBe(state.condition);
    expect(toggledOff.quantity).toBe(state.quantity);

    const toggledOn = toggleGraded(toggledOff);
    expect(toggledOn.graded).toBe(state.graded);
  });
});

describe("incrementQuantity / decrementQuantity (FR-008)", () => {
  it("increments by 1", () => {
    const state = startFoundState(SAMPLE_CARDS[0]);
    expect(incrementQuantity(state).quantity).toBe(state.quantity + 1);
  });

  it("never drops the quantity below MIN_QUANTITY", () => {
    const state = startFoundState(SAMPLE_CARDS[0]);
    expect(state.quantity).toBe(MIN_QUANTITY);
    expect(decrementQuantity(state).quantity).toBe(MIN_QUANTITY);
  });

  it("decrements by 1 above the floor", () => {
    const state = startFoundState(SAMPLE_CARDS[0]);
    const bumped = incrementQuantity(incrementQuantity(state));
    expect(bumped.quantity).toBe(MIN_QUANTITY + 2);
    expect(decrementQuantity(bumped).quantity).toBe(MIN_QUANTITY + 1);
  });
});

describe("advanceToNextCard (FR-009)", () => {
  it("cycles through all three cards and wraps back to the first", () => {
    let state = startFoundState(SAMPLE_CARDS[0]);
    expect(state.card).toBe(SAMPLE_CARDS[0]);

    state = advanceToNextCard(state);
    expect(state.card).toBe(SAMPLE_CARDS[1]);

    state = advanceToNextCard(state);
    expect(state.card).toBe(SAMPLE_CARDS[2]);

    state = advanceToNextCard(state);
    expect(state.card).toBe(SAMPLE_CARDS[0]);
  });

  it("resets condition/graded/quantity to the next card's own defaults, not the previous card's values", () => {
    let state = startFoundState(SAMPLE_CARDS[0]);
    state = selectCondition(state, "fair");
    state = toggleGraded(state);
    state = incrementQuantity(incrementQuantity(state));
    expect(state.condition).toBe("fair");
    expect(state.graded).toBe(false);
    expect(state.quantity).toBe(MIN_QUANTITY + 2);

    const next = advanceToNextCard(state);
    expect(next.card).toBe(SAMPLE_CARDS[1]);
    expect(next.condition).toBe(SAMPLE_CARDS[1].defaultCondition);
    expect(next.graded).toBe(SAMPLE_CARDS[1].defaultGraded);
    expect(next.quantity).toBe(MIN_QUANTITY);
  });
});

describe("formatListMeta / formatDetailMeta (FR-010)", () => {
  it("formats the exact documented strings for SAMPLE_CARDS[0]", () => {
    expect(formatListMeta(SAMPLE_CARDS[0])).toBe("PSA 10 · GEN-001");
    expect(formatDetailMeta(SAMPLE_CARDS[0])).toBe("Genesis · GEN-001");
  });
});
