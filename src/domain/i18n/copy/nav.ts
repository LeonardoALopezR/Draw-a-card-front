// specs/008-scan-experience/tasks.md T003 (FR-011, FR-012, FR-017): the shell's own copy —
// the five destination labels (Inicio/Escanear/Cartera/Trades/Perfil), the four top-right icon
// controls' accessibility labels + shared "not yet available" inline feedback text (same
// sentence shape 004-home-scan-shell's TopRightControls.tsx already established, now routed
// through i18n instead of hardcoded English), and the web sidebar's brand wordmark/tagline.
// Consumed via useTranslation(navCopy) by TopRightControls.tsx (T007), WebSidebarNav.tsx
// (T010), WebBottomBarNav.tsx (T011), and app/(app)/_layout.tsx's tab labels (T009).
const es = {
  // --- Five shell destination labels (FR-001, FR-011) ---
  navInicio: "Inicio",
  navEscanear: "Escanear",
  navCartera: "Cartera",
  navTrades: "Trades",
  navPerfil: "Perfil",

  // --- Icon control accessibility labels — same sentence shape 004 established, now i18n'd
  // (FR-011, FR-012) ---
  languageAccessibilityLabel: "Idioma, español o inglés — aún no disponible",
  currencyAccessibilityLabel: "Moneda, dólar estadounidense o peso mexicano — aún no disponible",
  notificationsAccessibilityLabel: "Notificaciones — aún no disponible",
  messagesAccessibilityLabel: "Mensajes — aún no disponible",

  // --- Shared inline "not yet available" feedback text shown after activating any of the
  // four icon controls (FR-011, matching SC-005's "never a silent no-op") ---
  notYetAvailableFeedback: "Aún no disponible",

  // --- Web sidebar brand block (spec.md Assumptions — compact BrandMark + wordmark, no
  // user-profile block) ---
  sidebarWordmark: "Draw a Card",
  sidebarTagline: "Tu plataforma de cartas coleccionables",
};

// `en`'s type is constrained to exactly `es`'s keys — a missing English translation is a
// compile-time error, not just a unit-test failure (copy/nav.test.ts's runtime key-parity
// check below is defense-in-depth for the case of a key present with an accidentally-empty
// value) — mirrors copy/login.ts's/copy/scan.ts's established pattern.
const en: Record<keyof typeof es, string> = {
  navInicio: "Home",
  navEscanear: "Scan",
  navCartera: "Wallet",
  navTrades: "Trades",
  navPerfil: "Profile",

  languageAccessibilityLabel: "Language, Spanish or English — not yet available",
  currencyAccessibilityLabel: "Currency, US Dollar or Mexican Peso — not yet available",
  notificationsAccessibilityLabel: "Notifications — not yet available",
  messagesAccessibilityLabel: "Messages — not yet available",

  notYetAvailableFeedback: "Not yet available",

  sidebarWordmark: "Draw a Card",
  sidebarTagline: "Your collectible card platform",
};

export const navCopy = { es, en };
