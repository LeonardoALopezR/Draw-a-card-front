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
> scaffold), the Amigos/Social placeholders live in `src/features/social/` (existing
> scaffold, per spec.md's Assumptions).

This module owns only the shell chrome — the persistent Amigos / Home-Scan / Social
navigation surface (native bottom tab bar on iOS/Android, sidebar-or-bottom-bar on web), the
Home/Scan composition screen, its top-right placeholder controls, and the top-left Amigos
quick-access pill. It does not own any domain content: Amigos/Social placeholder screens live
under `src/features/social/`, and the scanner entry affordance/stub screen live under
`src/features/scanner/`. Built on top of `src/domain/navigation.ts` (portable
destination table + breakpoint logic). See `specs/004-home-scan-shell/` for the spec defining
what belongs here.
