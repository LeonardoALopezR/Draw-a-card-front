// Pure TypeScript, no React/React Native imports (Constitution IV) — portable shell
// navigation data + the web layout breakpoint decision. See plan.md's "Shared destination/
// route table" and "Web navigation treatment" Research Decisions (specs/004-home-scan-shell)
// and tasks.md T001. Both `app/(app)/_layout.tsx` (native) and `app/(app)/_layout.web.tsx`
// (web) render from NAV_DESTINATIONS so the three destinations cannot drift between the two
// platform-specific renderers.

export type NavDestinationKey = "amigos" | "home" | "social";

export interface NavDestination {
  readonly key: NavDestinationKey;
  readonly route: string;
  readonly label: string;
}

// Single source of truth for the shell's three reachable destinations (FR-001).
export const NAV_DESTINATIONS: readonly NavDestination[] = [
  { key: "amigos", route: "/amigos", label: "Amigos" },
  { key: "home", route: "/", label: "Home" },
  { key: "social", route: "/social", label: "Social" },
];

// The scanner feature's not-yet-built entry route (FR-005) — this feature only owns the
// route boundary, not the destination screen's real content.
export const SCAN_ROUTE = "/scan";

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
