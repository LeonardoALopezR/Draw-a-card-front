// specs/008-scan-experience/tasks.md T005 (FR-015, FR-017): title + body copy for the three
// new contentless placeholder destinations — Cartera, Trades, Perfil — each explicitly stating
// "no content yet" in both locales, mirroring 004-home-scan-shell's AmigosPlaceholderScreen.tsx/
// SocialPlaceholderScreen.tsx wording but, unlike those (hardcoded English, predating this app's
// i18n layer), routed through src/domain/i18n. Consumed via useTranslation(placeholdersCopy) by
// CarteraPlaceholderScreen.tsx/TradesPlaceholderScreen.tsx/PerfilPlaceholderScreen.tsx (T027-T029).
const es = {
  carteraTitle: "Cartera",
  carteraBody:
    "Tu cartera todavía no tiene contenido. Aquí verás tu colección de cartas cuando esté disponible.",
  tradesTitle: "Trades",
  tradesBody:
    "Trades todavía no tiene contenido. Aquí verás tus intercambios cuando estén disponibles.",
  perfilTitle: "Perfil",
  perfilBody: "Tu perfil todavía no tiene contenido. Esta información estará disponible pronto.",
};

// `en`'s type is constrained to exactly `es`'s keys — a missing English translation is a
// compile-time error, not just a unit-test failure (copy/placeholders.test.ts's runtime
// key-parity check below is defense-in-depth for the case of a key present with an
// accidentally-empty value) — mirrors copy/login.ts's/copy/scan.ts's established pattern.
const en: Record<keyof typeof es, string> = {
  carteraTitle: "Wallet",
  carteraBody: "Your wallet has no content yet. You'll see your card collection here once it's available.",
  tradesTitle: "Trades",
  tradesBody: "Trades has no content yet. You'll see your trades here once they're available.",
  perfilTitle: "Profile",
  perfilBody: "Your profile has no content yet. This information will be available soon.",
};

export const placeholdersCopy = { es, en };
