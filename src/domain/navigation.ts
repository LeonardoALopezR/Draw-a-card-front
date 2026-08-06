// Pure TypeScript, no React/React Native imports (Constitution IV) — portable shell
// navigation data + the web layout breakpoint decision. See plan.md's "Shared destination/
// route table" and "Web navigation treatment" Research Decisions (specs/004-home-scan-shell)
// and, for the move from three to five destinations, specs/008-scan-experience/tasks.md T001
// (FR-001, spec.md Clarifications Recorded default 2). Both `app/(app)/_layout.tsx` (native)
// and `app/(app)/_layout.web.tsx` (web) render from NAV_DESTINATIONS so the five destinations
// cannot drift between the two platform-specific renderers.

export type NavDestinationKey = "inicio" | "escanear" | "cartera" | "trades" | "perfil";

// No `label` field: destination names are user-facing copy and MUST render through
// useTranslation(navCopy) (src/domain/i18n/copy/nav.ts's navInicio/navEscanear/navCartera/
// navTrades/navPerfil keys), never a hardcoded string sitting on this table — a Spanish-only
// `label` field here previously went unrendered as anything but raw Spanish text, silently
// breaking FR-017/SC-006's English locale (Round 2 review finding, specs/008-scan-experience).
// Every consumption point (WebSidebarNav.tsx, WebBottomBarNav.tsx, app/(app)/_layout.tsx) builds
// its own `Record<NavDestinationKey, string>` from navCopy, the same pattern already used there
// for icon lookups.
export interface NavDestination {
  readonly key: NavDestinationKey;
  readonly route: string;
}

// Single source of truth for the shell's five reachable destinations (FR-001). Escanear is
// looked up from here like every other destination — there is no separate SCAN_ROUTE constant
// (008-scan-experience moves Escanear inside the persistent shell, reversing
// 006-visual-identity's Recorded default 3; see plan.md's Research Decisions).
export const NAV_DESTINATIONS: readonly NavDestination[] = [
  { key: "inicio", route: "/" },
  { key: "escanear", route: "/escanear" },
  { key: "cartera", route: "/cartera" },
  { key: "trades", route: "/trades" },
  { key: "perfil", route: "/perfil" },
];

// Web layout breakpoint (logical px) — Clarifications' Option C (specs/004-home-scan-shell).
export const BREAKPOINT_PX = 768;

export type WebNavLayout = "sidebar" | "bottomBar";

/**
 * Decides which web navigation treatment applies at a given viewport width (FR-003).
 * Boundary-inclusive: exactly `BREAKPOINT_PX` resolves to `"sidebar"`.
 */
export function resolveWebNavLayout(width: number): WebNavLayout {
  return width >= BREAKPOINT_PX ? "sidebar" : "bottomBar";
}
