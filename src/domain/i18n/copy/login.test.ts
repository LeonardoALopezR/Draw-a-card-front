// T019 tests (FR-010, spec.md US4 AS1/AS2): the login copy dictionary's runtime key-parity
// guard — defense-in-depth beyond the `Record<keyof typeof es, string>` compile-time constraint
// already on `en` in login.ts (a key present with an accidentally-empty string would still pass
// the type check but must still be caught here as a real key, present in both locales).
import { loginCopy } from "./login";

describe("loginCopy (FR-010, spec.md US4 AS2)", () => {
  it("has the exact same set of keys in both the es and en dictionaries", () => {
    expect(Object.keys(loginCopy.es).sort()).toEqual(Object.keys(loginCopy.en).sort());
  });

  it("has no empty-string values in either dictionary", () => {
    for (const [, dict] of Object.entries(loginCopy)) {
      for (const value of Object.values(dict)) {
        expect(value).not.toBe("");
      }
    }
  });

  it("uses correct Spanish orthography for the brief's explicitly called-out strings (§4)", () => {
    expect(loginCopy.es.passwordLabel).toBe("Contraseña");
    expect(loginCopy.es.forgotPassword).toBe("Olvidé mi contraseña");
    expect(loginCopy.es.termsLink).toBe("Términos de Uso");
    expect(loginCopy.es.privacyLink).toBe("Política de Privacidad");
  });
});
