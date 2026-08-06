import type { ViewStyle } from "react-native";

// Native (iOS/Android) elevation tokens (spec.md FR-001/FR-005) — the shadow.web.ts sibling
// file exports the same two names as CSS boxShadow strings; Metro's platform-extension
// resolution (src/theme/index.ts) picks whichever this file's platform needs, per
// docs/design-brief-visual-identity.md §2.4.
// shadowColor is the opaque RGB channel of the brief's rgba(16,40,26,X) values (16,40,26 =
// #10281A, coincidentally == colors.brand.onPrimary) — native's shadowOpacity is what applies
// the alpha (X) on top of it. Passing the rgba() string itself as shadowColor would double-
// apply the alpha (shadowColor's own alpha multiplied by shadowOpacity again), rendering the
// shadow far fainter than the brief intends.
export const shadowSurface: ViewStyle = {
  shadowColor: "#10281A",
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 12,
  shadowOpacity: 0.06,
  elevation: 2,
};

export const shadowRaised: ViewStyle = {
  shadowColor: "#10281A",
  shadowOffset: { width: 0, height: 6 },
  shadowRadius: 20,
  shadowOpacity: 0.12,
  elevation: 6,
};
