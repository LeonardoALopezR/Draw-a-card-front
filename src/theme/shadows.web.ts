// Web elevation tokens (spec.md FR-001/FR-005) — same two export names as shadows.ts (native),
// as `boxShadow` CSS-string equivalents (react-native-web passes `boxShadow` straight through
// to CSS `box-shadow`), per docs/design-brief-visual-identity.md §2.4.
export const shadowSurface = {
  boxShadow: "0px 2px 12px rgba(16,40,26,0.06)",
};

export const shadowRaised = {
  boxShadow: "0px 6px 20px rgba(16,40,26,0.12)",
};
