// Pure TypeScript, no React/React Native imports (Constitution IV) — derives a translucent
// (rgba) variant of an opaque `#rrggbb` token value. FR-001 forbids a raw hex/magic-literal
// duplicating a token's value at a call site; this extends that spirit to *alpha variants* of an
// existing token (e.g. the login screen's gradient wash / radial-gradient bloom colors,
// docs/design-brief-visual-identity.md §4.1/§4.2, both derived from `colors.brand.primary`
// rather than typed as a second, disconnected `rgba(199,242,76,...)` literal).
function hexToRgbChannels(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
}

/** Returns `rgba(r,g,b,alpha)` for an opaque `#rrggbb` token value — e.g.
 * `withAlpha(colors.brand.primary, 0.22)` for a pale-lime wash derived from `brand.primary`. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgbChannels(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
