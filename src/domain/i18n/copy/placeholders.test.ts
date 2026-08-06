// specs/008-scan-experience/tasks.md T005 (FR-015, FR-017): placeholdersCopy's runtime
// key-parity guard — defense-in-depth beyond the `Record<keyof typeof es, string>` compile-time
// constraint already on `en` in placeholders.ts (mirrors copy/login.test.ts's/copy/scan.test.ts's
// established pattern exactly).
import { placeholdersCopy } from "./placeholders";

describe("placeholdersCopy (FR-015, FR-017)", () => {
  it("has the exact same set of keys in both the es and en dictionaries", () => {
    expect(Object.keys(placeholdersCopy.es).sort()).toEqual(Object.keys(placeholdersCopy.en).sort());
  });

  it("has no empty-string values in either dictionary", () => {
    for (const [, dict] of Object.entries(placeholdersCopy)) {
      for (const value of Object.values(dict)) {
        expect(value).not.toBe("");
      }
    }
  });

  it("has distinct titles for Cartera, Trades, and Perfil (FR-015)", () => {
    const titles = [
      placeholdersCopy.es.carteraTitle,
      placeholdersCopy.es.tradesTitle,
      placeholdersCopy.es.perfilTitle,
    ];
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("every body string explicitly states there is no content yet (FR-015)", () => {
    expect(placeholdersCopy.es.carteraBody).toContain("todavía no tiene contenido");
    expect(placeholdersCopy.es.tradesBody).toContain("todavía no tiene contenido");
    expect(placeholdersCopy.es.perfilBody).toContain("todavía no tiene contenido");

    expect(placeholdersCopy.en.carteraBody).toContain("no content yet");
    expect(placeholdersCopy.en.tradesBody).toContain("no content yet");
    expect(placeholdersCopy.en.perfilBody).toContain("no content yet");
  });
});
