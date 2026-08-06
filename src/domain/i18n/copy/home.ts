// specs/008-scan-experience/tasks.md T004 (FR-013, FR-017): Inicio's redesigned copy — a
// title, a brief tagline, and the quick-action card's label ("Escanear una carta" /
// "Scan a card"), per spec.md Clarifications' Recorded default 1 (Option A). Consumed via
// useTranslation(homeCopy) once HomeScreen.tsx's own restyle task (T025) wires it in.
const es = {
  title: "Inicio",
  tagline: "Tu colección, siempre a la mano",
  scanQuickActionLabel: "Escanear una carta",
};

// `en`'s type is constrained to exactly `es`'s keys — a missing English translation is a
// compile-time error, not just a unit-test failure (copy/home.test.ts's runtime key-parity
// check below is defense-in-depth for the case of a key present with an accidentally-empty
// value) — mirrors copy/login.ts's/copy/scan.ts's established pattern.
const en: Record<keyof typeof es, string> = {
  title: "Home",
  tagline: "Your collection, always at hand",
  scanQuickActionLabel: "Scan a card",
};

export const homeCopy = { es, en };
