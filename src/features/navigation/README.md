# Navigation feature module

**No backend counterpart to mirror.** Unlike every other `src/features/*` module (identity,
catalog, portfolio, social, trading, scanner), this one does not correspond to a backend
bounded context — there is no `navigation` domain in the backend to mirror. This is a
deliberate, narrow, documented exception to Constitution Principle V (`Screen/Component
Structure Mirrors Product Domains`), recorded in
`specs/004-home-scan-shell/plan.md`'s Constitution Check:

> the shell itself (`src/features/navigation/`) has no backend bounded context to mirror —
> it is the cross-cutting chrome *between* domains, analogous to `app/_layout.tsx` itself
> (which already lives outside any feature folder). The screen *content* it hosts stays
> domain-aligned: the scanner-entry card lives in `src/features/scanner/` (existing
> scaffold).

This module owns only the shell chrome — a **five-destination** persistent navigation surface
(`specs/008-scan-experience`, superseding `004-home-scan-shell`'s original three-destination
Amigos/Home-Scan/Social shell): Inicio, Escanear, Cartera, Trades, Perfil, keyed by
`src/domain/navigation.ts`'s `NAV_DESTINATIONS`/`NavDestinationKey`. Amigos and Social were
retired outright (spec.md's Recorded default 2) — there is no Amigos quick-access pill and no
Amigos/Social tab anymore; `AmigosQuickAccessPill.tsx` was deleted, and `src/features/social/`
now holds nothing but its own README.

What lives here:
- **`ShellHeader.tsx`** — the single shared header (native `<Tabs>`'s custom `header`, and the
  top of both web layouts) hosting `TopRightControls.tsx`'s four icon-only controls
  (language/currency/notifications/messages — all inert placeholders, per FR-011/FR-012).
  Rendered exactly once per screen; individual screens never render it themselves.
- **`WebSidebarNav.tsx`** / **`WebBottomBarNav.tsx`** — the two web nav layouts (sidebar above
  the `768px` breakpoint, bottom bar below it — `src/domain/navigation.ts`'s
  `resolveWebNavLayout`), each rendering all five destinations as real keyboard-reachable
  `<Link>`s with localized labels (`useTranslation(navCopy)` — never a hardcoded string).
- **`HomeScreen.tsx`** — Inicio's own content (a `BrandMark` + title + tagline +
  `ScanEntryCard`'s repurposed quick-action shortcut to Escanear), not the shell chrome itself.

Domain content beyond Inicio does not live here: the scanner entry affordance/screen lives
under `src/features/scanner/`, the Cartera/Trades/Perfil placeholders live under
`src/features/portfolio/`, `src/features/trading/`, and `src/features/identity/` respectively.
Built on top of `src/domain/navigation.ts` (portable destination table + breakpoint logic) and
`src/domain/i18n/copy/nav.ts` (destination labels + control accessibility strings). See
`specs/004-home-scan-shell/` and `specs/008-scan-experience/` for the specs defining what
belongs here.
