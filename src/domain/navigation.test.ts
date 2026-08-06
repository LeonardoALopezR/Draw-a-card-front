// Covers FR-001 (five reachable shell destinations, unique routes, documented order) and
// FR-003 (web layout breakpoint decision, boundary-inclusive at BREAKPOINT_PX) per
// specs/004-home-scan-shell/tasks.md T001, extended to five destinations by
// specs/008-scan-experience/tasks.md T001.
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
  // FR-001 (008-scan-experience): exactly five destinations make up the shell.
  it("has exactly five entries", () => {
    expect(NAV_DESTINATIONS).toHaveLength(5);
  });

  // FR-001: each destination must be independently reachable — no duplicate key or route.
  it("has unique key and route values across all entries", () => {
    const keys = NAV_DESTINATIONS.map((d) => d.key);
    const routes = NAV_DESTINATIONS.map((d) => d.route);

    expect(new Set(keys).size).toBe(NAV_DESTINATIONS.length);
    expect(new Set(routes).size).toBe(NAV_DESTINATIONS.length);
  });

  // FR-001: documented order — Inicio, Escanear, Cartera, Trades, Perfil.
  it("orders the five destinations Inicio, Escanear, Cartera, Trades, Perfil", () => {
    expect(NAV_DESTINATIONS.map((d) => d.key)).toEqual([
      "inicio",
      "escanear",
      "cartera",
      "trades",
      "perfil",
    ]);
  });

  // FR-001: each destination's route matches the mockup's five-destination table. No `label`
  // field — destination names render only through navCopy (see navigation.ts's comment); this
  // table carries route/key data only, verified here so a `label` field can't silently return.
  it("has the exact route for each destination and carries no label field", () => {
    expect(NAV_DESTINATIONS).toEqual([
      { key: "inicio", route: "/" },
      { key: "escanear", route: "/escanear" },
      { key: "cartera", route: "/cartera" },
      { key: "trades", route: "/trades" },
      { key: "perfil", route: "/perfil" },
    ]);
    NAV_DESTINATIONS.forEach((destination) => {
      expect(destination).not.toHaveProperty("label");
    });
  });
});
