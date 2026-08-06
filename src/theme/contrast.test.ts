// FR-004 / spec.md Clarifications "Recorded default 2" / SC-002 — regression-guards every
// text-on-background pairing that table lists, computed against the *real* colors.ts export
// (not hardcoded duplicate hex strings), so an accidental future edit to a token value that
// regresses below the WCAG 4.5:1 floor (Constitution VII) fails this test immediately.
import { colors } from "./colors";
import { contrastRatio } from "./contrast";

const AA_THRESHOLD = 4.5;

describe("contrastRatio", () => {
  // Sanity checks on the formula itself, independent of the token values.
  it("returns 1 for identical colors", () => {
    expect(contrastRatio("#123456", "#123456")).toBeCloseTo(1, 5);
  });

  it("returns 21 for black on white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
  });

  it("is order-independent (foreground/background swap yields the same ratio)", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(
      contrastRatio("#FFFFFF", "#000000"),
      10
    );
  });
});

describe("token contrast pairings clear WCAG AA 4.5:1 (FR-004, Recorded default 2)", () => {
  it("brand.onPrimary on brand.primary", () => {
    expect(contrastRatio(colors.brand.onPrimary, colors.brand.primary)).toBeGreaterThanOrEqual(
      AA_THRESHOLD
    );
  });

  it("text.secondary on bg.page, bg.surface, bg.surfaceMuted", () => {
    expect(contrastRatio(colors.text.secondary, colors.bg.page)).toBeGreaterThanOrEqual(
      AA_THRESHOLD
    );
    expect(contrastRatio(colors.text.secondary, colors.bg.surface)).toBeGreaterThanOrEqual(
      AA_THRESHOLD
    );
    expect(contrastRatio(colors.text.secondary, colors.bg.surfaceMuted)).toBeGreaterThanOrEqual(
      AA_THRESHOLD
    );
  });

  it("text.placeholder on bg.surface (input placeholders)", () => {
    expect(contrastRatio(colors.text.placeholder, colors.bg.surface)).toBeGreaterThanOrEqual(
      AA_THRESHOLD
    );
  });

  it("viewfinder.hintText on viewfinder.bg (a token distinct from text.placeholder)", () => {
    expect(
      contrastRatio(colors.viewfinder.hintText, colors.viewfinder.bg)
    ).toBeGreaterThanOrEqual(AA_THRESHOLD);
  });

  // Defect fix (specs/008-scan-experience, 2026-08-06, found on a real iPhone 17 Pro simulator):
  // Viewfinder.tsx's found-state "¡Carta encontrada!" heading (FR-004) used to render
  // `colors.text.primary` (near-black) on `colors.viewfinder.bg` (near-black) — ~1.23:1,
  // effectively invisible. `colors.brand.primary` (already used for the `checkmark-circle` icon
  // directly above the heading) is the fix — this pairing must stay green going forward.
  it("brand.primary on viewfinder.bg (the found-state heading, spec 008-scan-experience FR-004)", () => {
    expect(contrastRatio(colors.brand.primary, colors.viewfinder.bg)).toBeGreaterThanOrEqual(
      AA_THRESHOLD
    );
  });

  it("text.link on bg.page, bg.surface, bg.surfaceMuted, accent.pillBg", () => {
    expect(contrastRatio(colors.text.link, colors.bg.page)).toBeGreaterThanOrEqual(AA_THRESHOLD);
    expect(contrastRatio(colors.text.link, colors.bg.surface)).toBeGreaterThanOrEqual(
      AA_THRESHOLD
    );
    expect(contrastRatio(colors.text.link, colors.bg.surfaceMuted)).toBeGreaterThanOrEqual(
      AA_THRESHOLD
    );
    expect(contrastRatio(colors.text.link, colors.accent.pillBg)).toBeGreaterThanOrEqual(
      AA_THRESHOLD
    );
  });

  it("accent.priceGreen on bg.surface (recent-scans list prices)", () => {
    expect(contrastRatio(colors.accent.priceGreen, colors.bg.surface)).toBeGreaterThanOrEqual(
      AA_THRESHOLD
    );
  });

  // T050 follow-up (T023-T024a review nit): FormField.tsx/SignInForm.tsx/
  // RequestPasswordResetForm.tsx/ResetPasswordForm.tsx's inline validation-error text renders on
  // whichever background the login screen's current chrome/mode puts it over — bg.page (mobile),
  // bg.surfaceMuted (the web card), or bg.surface (FormField's own input-adjacent error line
  // sits directly beneath the bg.surface input container in some layouts) — so all three are
  // guarded, the same pattern already used for text.secondary/text.link above.
  it("text.danger on bg.page, bg.surface, bg.surfaceMuted (inline validation-error text)", () => {
    expect(contrastRatio(colors.text.danger, colors.bg.page)).toBeGreaterThanOrEqual(
      AA_THRESHOLD
    );
    expect(contrastRatio(colors.text.danger, colors.bg.surface)).toBeGreaterThanOrEqual(
      AA_THRESHOLD
    );
    expect(contrastRatio(colors.text.danger, colors.bg.surfaceMuted)).toBeGreaterThanOrEqual(
      AA_THRESHOLD
    );
  });
});
