// specs/008-scan-experience/tasks.md T004 (FR-013, FR-017): homeCopy's runtime key-parity
// guard — defense-in-depth beyond the `Record<keyof typeof es, string>` compile-time constraint
// already on `en` in home.ts (mirrors copy/login.test.ts's/copy/scan.test.ts's established
// pattern exactly).
import { homeCopy } from "./home";

describe("homeCopy (FR-013, FR-017)", () => {
  it("has the exact same set of keys in both the es and en dictionaries", () => {
    expect(Object.keys(homeCopy.es).sort()).toEqual(Object.keys(homeCopy.en).sort());
  });

  it("has no empty-string values in either dictionary", () => {
    for (const [, dict] of Object.entries(homeCopy)) {
      for (const value of Object.values(dict)) {
        expect(value).not.toBe("");
      }
    }
  });

  it("has the quick-action card label 'Escanear una carta' / 'Scan a card' (FR-013)", () => {
    expect(homeCopy.es.scanQuickActionLabel).toBe("Escanear una carta");
    expect(homeCopy.en.scanQuickActionLabel).toBe("Scan a card");
  });
});
