// T020 tests (FR-010, spec.md US4 AS1/AS2): the scan copy dictionary's runtime key-parity guard
// — defense-in-depth beyond the `Record<keyof typeof es, string>` compile-time constraint already
// on `en` in scan.ts (mirrors copy/login.test.ts's pattern exactly).
//
// specs/008-scan-experience/tasks.md T006 (FR-008, FR-009, FR-017) extends this suite with
// coverage for the found-viewfinder heading, found-panel copy, and the five condition-chip
// labels added to scan.ts.
import { scanCopy } from "./scan";

describe("scanCopy (FR-010, spec.md US4 AS2)", () => {
  it("has the exact same set of keys in both the es and en dictionaries", () => {
    expect(Object.keys(scanCopy.es).sort()).toEqual(Object.keys(scanCopy.en).sort());
  });

  it("has no empty-string values in either dictionary", () => {
    for (const [, dict] of Object.entries(scanCopy)) {
      for (const value of Object.values(dict)) {
        expect(value).not.toBe("");
      }
    }
  });

  it("uses the brief's exact Spanish strings for the shared viewfinder/search/dropzone copy (§5)", () => {
    expect(scanCopy.es.viewfinderHint).toBe("Apunta la cámara a la carta");
    expect(scanCopy.es.searchPlaceholder).toBe("Buscar carta por nombre o código…");
    expect(scanCopy.es.uploadDropzone).toBe("Subir imagen de carta");
  });

  it("uses distinct mobile vs. web titles per §5 ('Escanear' vs. 'Escanear carta')", () => {
    expect(scanCopy.es.titleMobile).toBe("Escanear");
    expect(scanCopy.es.titleWeb).toBe("Escanear carta");
  });

  // Standalone follow-up fix (2026-08-05, progress/impl_008-scan-experience.md): backLabel/
  // backAccessibilityLabel became dead code once T019 removed app/scan.tsx's "Back" affordance
  // (their only consumer) — a regression guard so they don't silently reappear.
  it("no longer carries the retired backLabel/backAccessibilityLabel keys (T019 removed their only consumer)", () => {
    expect(scanCopy.es).not.toHaveProperty("backLabel");
    expect(scanCopy.es).not.toHaveProperty("backAccessibilityLabel");
    expect(scanCopy.en).not.toHaveProperty("backLabel");
    expect(scanCopy.en).not.toHaveProperty("backAccessibilityLabel");
  });

  // T021 (US4, FR-005): statusPillCameraAvailable became dead code once T021 removed the web-only
  // "Cámara disponible" StatusPill (its only consumer) from ScanShellScreen.web.tsx — a
  // regression guard so it can't silently reappear, mirroring the backLabel guard above.
  it("no longer carries the retired statusPillCameraAvailable key (T021 removed its only consumer)", () => {
    expect(scanCopy.es).not.toHaveProperty("statusPillCameraAvailable");
    expect(scanCopy.en).not.toHaveProperty("statusPillCameraAvailable");
  });

  // T006 (FR-008): the viewfinder's found-state heading.
  it("has the exact found-viewfinder heading '¡Carta encontrada!'", () => {
    expect(scanCopy.es.viewfinderFoundHeading).toBe("¡Carta encontrada!");
    expect(scanCopy.en.viewfinderFoundHeading).toBe("Card found!");
  });

  // T006 (FR-008, FR-009): the found-card panel's own copy.
  it("has the found-card panel's Gradeada/links/quantity/price/accept copy", () => {
    expect(scanCopy.es.gradedLabel).toBe("Gradeada");
    expect(scanCopy.es.gradeValuePlaceholder).toBe("—");
    expect(scanCopy.es.removeLink).toBe("Eliminar");
    expect(scanCopy.es.changeLink).toBe("Cambiar");
    expect(scanCopy.es.quantityLabel).toBe("Cantidad");
    expect(scanCopy.es.marketPriceLabel).toBe("Precio de mercado");
    expect(scanCopy.es.acceptButton).toBe("Aceptar");
    expect(scanCopy.es.acceptedConfirmation).toBe("Carta agregada");
  });

  // T006 (FR-008): the five condition-chip labels, one per ConditionOption
  // (src/domain/scanResults.ts).
  it("has the five condition-chip labels in both locales", () => {
    expect(scanCopy.es.conditionNearMint).toBe("Casi Nuevo");
    expect(scanCopy.es.conditionExcellent).toBe("Excelente");
    expect(scanCopy.es.conditionVeryGood).toBe("Muy Bueno");
    expect(scanCopy.es.conditionGood).toBe("Bueno");
    expect(scanCopy.es.conditionFair).toBe("Aceptable");

    expect(scanCopy.en.conditionNearMint).toBe("Near Mint");
    expect(scanCopy.en.conditionExcellent).toBe("Excellent");
    expect(scanCopy.en.conditionVeryGood).toBe("Very Good");
    expect(scanCopy.en.conditionGood).toBe("Good");
    expect(scanCopy.en.conditionFair).toBe("Fair");
  });
});
