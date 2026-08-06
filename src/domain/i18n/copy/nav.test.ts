// specs/008-scan-experience/tasks.md T003 (FR-011, FR-012, FR-017): navCopy's runtime
// key-parity guard — defense-in-depth beyond the `Record<keyof typeof es, string>` compile-time
// constraint already on `en` in nav.ts (mirrors copy/login.test.ts's/copy/scan.test.ts's
// established pattern exactly).
import { navCopy } from "./nav";

describe("navCopy (FR-011, FR-012, FR-017)", () => {
  it("has the exact same set of keys in both the es and en dictionaries", () => {
    expect(Object.keys(navCopy.es).sort()).toEqual(Object.keys(navCopy.en).sort());
  });

  it("has no empty-string values in either dictionary", () => {
    for (const [, dict] of Object.entries(navCopy)) {
      for (const value of Object.values(dict)) {
        expect(value).not.toBe("");
      }
    }
  });

  it("has the five destination labels in Spanish and their English equivalents (FR-001)", () => {
    expect(navCopy.es.navInicio).toBe("Inicio");
    expect(navCopy.es.navEscanear).toBe("Escanear");
    expect(navCopy.es.navCartera).toBe("Cartera");
    expect(navCopy.es.navTrades).toBe("Trades");
    expect(navCopy.es.navPerfil).toBe("Perfil");

    expect(navCopy.en.navInicio).toBe("Home");
    expect(navCopy.en.navEscanear).toBe("Scan");
    expect(navCopy.en.navCartera).toBe("Wallet");
    expect(navCopy.en.navTrades).toBe("Trades");
    expect(navCopy.en.navPerfil).toBe("Profile");
  });

  it("every icon control's accessibility label states it is not yet available (FR-011, FR-012)", () => {
    expect(navCopy.es.languageAccessibilityLabel).toContain("no disponible");
    expect(navCopy.es.currencyAccessibilityLabel).toContain("no disponible");
    expect(navCopy.es.notificationsAccessibilityLabel).toContain("no disponible");
    expect(navCopy.es.messagesAccessibilityLabel).toContain("no disponible");

    expect(navCopy.en.languageAccessibilityLabel).toContain("not yet available");
    expect(navCopy.en.currencyAccessibilityLabel).toContain("not yet available");
    expect(navCopy.en.notificationsAccessibilityLabel).toContain("not yet available");
    expect(navCopy.en.messagesAccessibilityLabel).toContain("not yet available");
  });
});
