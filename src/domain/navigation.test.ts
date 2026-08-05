// Covers FR-001 (three reachable shell destinations, unique routes) and FR-003 (web layout
// breakpoint decision, boundary-inclusive at BREAKPOINT_PX) per tasks.md T001
// (specs/004-home-scan-shell).
import { BREAKPOINT_PX, NAV_DESTINATIONS, resolveWebNavLayout } from "./navigation";

describe("resolveWebNavLayout", () => {
  // FR-003: below the breakpoint renders the bottom-bar treatment.
  it("resolves to bottomBar just below the breakpoint (767px)", () => {
    expect(resolveWebNavLayout(767)).toBe("bottomBar");
  });

  // FR-003: the breakpoint itself is inclusive of the sidebar treatment.
  it("resolves to sidebar exactly at the breakpoint (768px, boundary-inclusive)", () => {
    expect(resolveWebNavLayout(BREAKPOINT_PX)).toBe("sidebar");
  });

  // FR-003: a wide desktop viewport also resolves to sidebar.
  it("resolves to sidebar at a wide viewport width", () => {
    expect(resolveWebNavLayout(1440)).toBe("sidebar");
  });
});

describe("NAV_DESTINATIONS", () => {
  // FR-001: exactly three destinations make up the shell.
  it("has exactly three entries", () => {
    expect(NAV_DESTINATIONS).toHaveLength(3);
  });

  // FR-001: each destination must be independently reachable — no duplicate key or route.
  it("has unique key and route values across all entries", () => {
    const keys = NAV_DESTINATIONS.map((d) => d.key);
    const routes = NAV_DESTINATIONS.map((d) => d.route);

    expect(new Set(keys).size).toBe(NAV_DESTINATIONS.length);
    expect(new Set(routes).size).toBe(NAV_DESTINATIONS.length);
  });
});
