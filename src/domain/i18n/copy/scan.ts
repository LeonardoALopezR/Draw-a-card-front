// T020 (FR-010): the scan screen's complete Spanish/English copy dictionary — every string
// docs/design-brief-visual-identity.md §5 specifies for the visual shell (mobile and web), plus
// the existing "Back"/"Back to Home" affordance already present in app/scan.tsx
// (004-home-scan-shell), which this feature restyles but does not remove (FR-009). Consumed via
// useTranslation(scanCopy) once the scan visual-shell tasks (T038+) wire it in — this task only
// builds and tests the dictionary itself.
//
// `label.section` (src/theme/typography.ts) already applies `textTransform: "uppercase"` at
// render time, so `recentScansHeading` is stored in natural case ("Escaneos recientes") — the
// brief's all-caps "ESCANEOS RECIENTES" rendering comes from that shared style.
//
// The recent-scans list's actual ROW content (thumbnail/name/meta/price) is static local
// placeholder DATA per spec.md FR-008 — not translated copy, and deliberately not represented
// here (a future scanner feature replaces that data entirely; it was never meant to carry brand
// voice). Only the section's own static heading is real copy, included below.
const es = {
  titleMobile: "Escanear",
  titleWeb: "Escanear carta",
  viewfinderHint: "Apunta la cámara a la carta",
  searchPlaceholder: "Buscar carta por nombre o código…",
  uploadDropzone: "Subir imagen de carta",
  scanButton: "Escanear carta",
  statusPillCameraAvailable: "Cámara disponible",
  emptyResultsLine1: "Escanea una carta para ver sus detalles aquí",
  emptyResultsLine2: "Los resultados aparecerán automáticamente",
  recentScansHeading: "Escaneos recientes",
  backLabel: "Atrás",
  backAccessibilityLabel: "Volver al inicio",
};

// `en`'s type is constrained to exactly `es`'s keys — a missing English translation is a
// compile-time error, not just a unit-test failure (copy/scan.test.ts's runtime key-parity check
// below is defense-in-depth for the case of a key present with an accidentally-empty value).
const en: Record<keyof typeof es, string> = {
  titleMobile: "Scan",
  titleWeb: "Scan a card",
  viewfinderHint: "Point the camera at the card",
  searchPlaceholder: "Search for a card by name or code…",
  uploadDropzone: "Upload a card image",
  scanButton: "Scan card",
  statusPillCameraAvailable: "Camera available",
  emptyResultsLine1: "Scan a card to see its details here",
  emptyResultsLine2: "Results will appear automatically",
  recentScansHeading: "Recent scans",
  backLabel: "Back",
  backAccessibilityLabel: "Back to Home",
};

export const scanCopy = { es, en };
