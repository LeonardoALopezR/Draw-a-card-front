// T017 (FR-012): the two locales this feature ships copy for. Spanish is the DEFAULT_LOCALE — a
// documented, intentional PLACEHOLDER (spec.md Assumptions: "Default locale is a hardcoded
// placeholder, not a real decision"), matching docs/design-brief-visual-identity.md's
// Spanish-first copy and the human's own scoping language, NOT a real device-locale detection or
// persistence decision — 007-localization owns building that. Zero React Native import: this is
// pure, portable TypeScript data (Constitution IV).
export type Locale = "es" | "en";

export const DEFAULT_LOCALE: Locale = "es";
