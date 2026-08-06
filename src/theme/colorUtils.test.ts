import { colors } from "./colors";
import { withAlpha } from "./colorUtils";

// Regression-guards that the login screen's gradient-wash/radial-bloom colors (T025/T026,
// docs/design-brief-visual-identity.md §4.1/§4.2) are actually derived from `colors.brand.
// primary`, not independently typed rgba literals that could drift from the token.
describe("withAlpha", () => {
  it("derives the mobile gradient-wash top color from colors.brand.primary at 22% alpha (design brief §4.1)", () => {
    expect(withAlpha(colors.brand.primary, 0.22)).toBe("rgba(199,242,76,0.22)");
  });

  it("derives the web radial-bloom color from colors.brand.primary at 18% alpha (design brief §4.2)", () => {
    expect(withAlpha(colors.brand.primary, 0.18)).toBe("rgba(199,242,76,0.18)");
  });

  it("round-trips brand.onPrimary (a different hex token) at full opacity", () => {
    expect(withAlpha(colors.brand.onPrimary, 1)).toBe("rgba(16,40,26,1)");
  });
});
