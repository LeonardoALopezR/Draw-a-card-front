// Pure TypeScript, no React/React Native imports (Constitution IV) — the app's first shared
// design-token color layer (spec.md FR-001/FR-002). Every screen/primitive this feature
// touches consumes these semantic names exclusively, never a raw hex value (FR-001).
//
// Four values below are adjusted from docs/design-brief-visual-identity.md §2.1's originally
// eyeballed values to clear the 4.5:1 WCAG contrast floor (Constitution VII) — see spec.md's
// Clarifications, "Recorded default 2" for the computed-ratio table backing each adjustment:
// text.secondary, text.placeholder, text.link, accent.priceGreen. viewfinder.hintText is a new
// token (split out of the brief's single text.placeholder, which could not clear 4.5:1 against
// both a near-white and a near-black background at once) — it keeps the brief's original
// #9CA3AF, which already clears 4.5:1 against viewfinder.bg. src/theme/contrast.test.ts
// (FR-004) regression-guards every pairing in that table against these exact values.
//
// text.danger (T050, follow-up from the T023-T024a review): the design brief has no error/
// danger color of its own (docs/design-brief-visual-identity.md §2.1 doesn't specify one), so
// FormField.tsx/FormField.web.tsx/SignInForm.tsx/RequestPasswordResetForm.tsx/
// ResetPasswordForm.tsx each carried the same undocumented raw literal, `#dc2626` (a Tailwind
// red, pre-dating this feature's token module). That literal itself fails the 4.5:1 floor
// against bg.page (4.12:1, computed) — the exact "eyeballed, not measured" failure mode
// Clarifications' Recorded default 2 already fixed for four other tokens. `#b91c1c` (Tailwind's
// red-700 — a darker shade of the same hue, mirroring Recorded default 2's own adjustment
// method exactly) clears 4.5:1 against every background this feature's error text actually
// renders on (bg.page 5.52:1, bg.surface 6.47:1, bg.surfaceMuted 6.08:1 — see
// contrast.test.ts).
export const colors = {
  brand: {
    primary: "#C7F24C",
    onPrimary: "#10281A",
  },
  text: {
    primary: "#10281A",
    secondary: "#646B78",
    placeholder: "#6D7787",
    link: "#247B3D",
    danger: "#B91C1C",
  },
  viewfinder: {
    bg: "#0B0F0C",
    grid: "rgba(199,242,76,0.10)",
    hintText: "#9CA3AF",
  },
  bg: {
    page: "#ECEDEE",
    surface: "#FFFFFF",
    surfaceMuted: "#F7F8F8",
  },
  border: {
    subtle: "#E3E5E6",
    input: "#DDE0E1",
    dashed: "#C9CDCE",
  },
  accent: {
    priceGreen: "#1C844A",
    pillBg: "#E4F5E7",
  },
} as const;
