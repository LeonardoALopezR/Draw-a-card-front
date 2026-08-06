// T020 tests (FR-010, spec.md US4 AS1/AS2): the scan copy dictionary's runtime key-parity guard
// — defense-in-depth beyond the `Record<keyof typeof es, string>` compile-time constraint already
// on `en` in scan.ts (mirrors copy/login.test.ts's pattern exactly).
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

  it("uses the brief's exact Spanish strings for the shared viewfinder/search/dropzone/status copy (§5)", () => {
    expect(scanCopy.es.viewfinderHint).toBe("Apunta la cámara a la carta");
    expect(scanCopy.es.searchPlaceholder).toBe("Buscar carta por nombre o código…");
    expect(scanCopy.es.uploadDropzone).toBe("Subir imagen de carta");
    expect(scanCopy.es.statusPillCameraAvailable).toBe("Cámara disponible");
  });

  it("uses distinct mobile vs. web titles per §5 ('Escanear' vs. 'Escanear carta')", () => {
    expect(scanCopy.es.titleMobile).toBe("Escanear");
    expect(scanCopy.es.titleWeb).toBe("Escanear carta");
  });
});
