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
//
// gradients (follow-up to specs/008-scan-experience, human-requested, 2026-08-06): the sample
// card pool's thumbnails (src/domain/scanResults.ts's `thumbnailGradient`, rendered by
// src/features/scanner/CardThumbnail.tsx) read distinct two-stop gradients from here rather than
// a raw hex pair at the call site, mirroring every other token in this file. Purely decorative
// (never text-on-background), so these are not subject to contrast.test.ts's 4.5:1 WCAG pairing
// checks the way text/background tokens above are — three visually distinct hues per the
// human's explicit request (purple/warm red-orange/dark teal), each a standard two-stop
// Tailwind-shade ramp of the same hue (light stop -> dark stop) for a believable gradient rather
// than two arbitrary colors.
//
// segment.inactiveTrack (T002, specs/010-registration-redesign): the `Usuario`/`Tienda`
// segmented control's inactive-segment fill (docs/design-brief-registration-redesign.md §2 —
// "pale lavender-gray, ≈#EDEEF5; add a token, do not inline"). Computed, not eyeballed
// (Constitution VII): `contrastRatio(colors.text.secondary, "#EDEEF5")` = 4.634… (rounds to
// 4.63:1), clearing the 4.5:1 AA floor for the inactive segment's `text.secondary` label —
// contrast.test.ts regression-guards this exact pairing.
//
// overlay.backdrop (T006 review fix, specs/010-registration-redesign): the native `Select`
// picker's full-screen modal backdrop (previously an inline `"rgba(0,0,0,0.4)"` literal, flagged
// by code review as an FR-006 violation — "no new hex literals" per
// docs/design-brief-registration-redesign.md §1). A translucent black scrim behind a surface is
// purely decorative dimming, not a text-on-background color pairing, so it carries no
// contrast.test.ts case the way text/background tokens above do — there is no text rendered
// directly on this fill for a reader to parse.
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
  segment: {
    inactiveTrack: "#EDEEF5",
  },
  overlay: {
    backdrop: "rgba(0,0,0,0.4)",
  },
  // Two-stop decorative gradients for the sample-card pool's thumbnails
  // (src/domain/scanResults.ts's `thumbnailGradient`, rendered by
  // src/features/scanner/CardThumbnail.tsx) — never text-on-background, so not subject to
  // contrast.test.ts's 4.5:1 WCAG pairing checks the way the tokens above are. Three visually
  // distinct hues per the human's explicit request (purple / warm red-orange / dark teal), each
  // a standard same-hue light-stop -> dark-stop Tailwind ramp for a believable gradient rather
  // than two arbitrary colors.
  gradients: {
    cardPurple: ["#A78BFA", "#4C1D95"], // Dragón Eterno — violet-400 -> violet-900
    cardEmber: ["#FB923C", "#9A3412"], // Fénix de Tormenta — orange-400 -> orange-800
    cardTeal: ["#2DD4BF", "#134E4A"], // Serpiente del Vacío — teal-400 -> teal-900
  },
} as const;
