// T018 tests (FR-010): translate() is the sole string-resolution primitive every screen's copy
// lookup (login.ts, scan.ts — T019/T020) and the LocaleContext hook (T021) build on. Covers
// resolving a key for "es" and for "en" against a minimal, local test dictionary — not reading
// through login.ts/scan.ts, so this suite stays a pure, isolated unit test of the lookup function
// itself (docs/verification.md Level 1).
import { translate } from "./translate";

const testDictionary = {
  es: { greeting: "Hola", farewell: "Adiós" },
  en: { greeting: "Hello", farewell: "Goodbye" },
};

describe("translate (FR-010)", () => {
  it("resolves a key against the Spanish dictionary when locale is 'es'", () => {
    expect(translate(testDictionary, "es", "greeting")).toBe("Hola");
    expect(translate(testDictionary, "es", "farewell")).toBe("Adiós");
  });

  it("resolves a key against the English dictionary when locale is 'en'", () => {
    expect(translate(testDictionary, "en", "greeting")).toBe("Hello");
    expect(translate(testDictionary, "en", "farewell")).toBe("Goodbye");
  });

  // An invalid key (one not present in the dictionary's keyof T) is caught at the TypeScript
  // level — translate()'s `key: keyof T` parameter type makes `translate(testDictionary, "es",
  // "nonexistent")` a COMPILE-TIME error, not a runtime one. This can't be asserted as a runtime
  // test (there is no runtime failure to observe — the invalid call simply doesn't compile), so
  // this is documented here explicitly rather than silently omitted, per this task's own
  // instruction and docs/verification.md's traceability expectations for FR-010.
});
