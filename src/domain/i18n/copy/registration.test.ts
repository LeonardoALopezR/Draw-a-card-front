// 010-registration-redesign T013 (FR-007): the registration copy dictionary's runtime key-parity
// guard — defense-in-depth beyond the `Record<keyof typeof es, string>` compile-time constraint
// already on `en` in registration.ts (a key present with an accidentally-empty string would still
// pass the type check but must still be caught here as a real key, present in both locales).
// Mirrors login.test.ts's coverage pattern exactly.
import { registrationCopy } from "./registration";

describe("registrationCopy (FR-007)", () => {
  it("has the exact same set of keys in both the es and en dictionaries", () => {
    expect(Object.keys(registrationCopy.es).sort()).toEqual(Object.keys(registrationCopy.en).sort());
  });

  it("has no empty-string values in either dictionary", () => {
    for (const [, dict] of Object.entries(registrationCopy)) {
      for (const value of Object.values(dict)) {
        expect(value).not.toBe("");
      }
    }
  });

  it("uses correct Spanish orthography for every accented string this screen needs (design brief §2-§4)", () => {
    expect(registrationCopy.es.emailLabel).toBe("Correo electrónico");
    expect(registrationCopy.es.passwordLabel).toBe("Contraseña");
    expect(registrationCopy.es.apellidoPaternoLabel).toBe("Apellido paterno");
    expect(registrationCopy.es.apellidoMaternoLabel).toBe("Apellido materno");
    expect(registrationCopy.es.birthDateLabel).toBe("Fecha de nacimiento");
    expect(registrationCopy.es.nationalityLabel).toBe("Nacionalidad");
    expect(registrationCopy.es.commercialNameLabel).toBe("Nombre comercial");
    expect(registrationCopy.es.fiscalAddressLabel).toBe("Domicilio fiscal");
    expect(registrationCopy.es.tosConsentLabel).toBe("Acepto los Términos de Uso");
    expect(registrationCopy.es.privacyConsentLabel).toBe("Acepto la Política de Privacidad");
  });

  it("does not carry the mockup tool's unaccented artifacts (design brief §2, explicit)", () => {
    expect(registrationCopy.es.emailLabel).not.toBe("Correo electronico");
    expect(registrationCopy.es.privacyConsentLabel).not.toContain("Politica");
    expect(registrationCopy.es.tosConsentLabel).not.toContain("Terminos");
  });

  it("gives the Usuario and Tienda tabs distinct @-handle placeholders (design brief §3-§4)", () => {
    expect(registrationCopy.es.usuarioUsernamePlaceholder).toBe("@miusuario");
    expect(registrationCopy.es.tiendaUsernamePlaceholder).toBe("@mitienda");
  });

  it("carries Spanish default copy for every Select primitive override (FR-012, Select.types.ts)", () => {
    expect(registrationCopy.es.selectRetryLabel).toBe("Reintentar");
    expect(registrationCopy.es.selectSearchPlaceholder).toBe("Buscar…");
    expect(registrationCopy.es.selectLoadingLabel).toBe("Cargando…");
    expect(registrationCopy.es.selectFilterAccessibilityLabel).toBe("Filtrar opciones");
    expect(registrationCopy.es.selectCloseAccessibilityLabel).toBe("Cerrar");
  });

  it("carries the submit button's idle and busy copy (FR-002/FR-003)", () => {
    expect(registrationCopy.es.submitLabel).toBe("Registrarse");
    expect(registrationCopy.es.submitBusyLabel).toBe("Creando cuenta…");
  });
});
