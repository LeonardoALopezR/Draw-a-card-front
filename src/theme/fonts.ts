// Pure TypeScript, no React/React Native imports (Constitution IV) — font-family name
// constant referenced by both the root layout's useFonts() call and typography.ts, so the two
// never drift (spec.md Clarifications, Recorded default 1).
//
// Verified directly against the installed package (not assumed) — see
// node_modules/@expo-google-fonts/playfair-display/index.js:
//   export const PlayfairDisplay_700Bold = require('./700Bold/PlayfairDisplay_700Bold.ttf');
// progress/impl_006-visual-identity.md's T001 entry records this same verification.
export const PLAYFAIR_DISPLAY_BOLD = "PlayfairDisplay_700Bold";
