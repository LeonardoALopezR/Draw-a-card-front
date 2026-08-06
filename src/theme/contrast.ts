// Pure TypeScript, no React/React Native imports (Constitution IV) — the real WCAG 2.x
// relative-luminance contrast formula (the same one browsers/axe/Lighthouse use), not an
// approximation. Backs the FR-004 / Constitution VII 4.5:1 floor as an executable regression
// guard (contrast.test.ts), per spec.md Clarifications, "Recorded default 2".

/** Parses a `#rgb`/`#rrggbb` hex color string into 0-255 sRGB channel values. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const int = parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

/** Converts one sRGB 0-255 channel value to its linear-light equivalent (WCAG's formula). */
function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance (0 = black, 1 = white) for a `#rrggbb` hex color. */
function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const rLin = channelToLinear(r);
  const gLin = channelToLinear(g);
  const bLin = channelToLinear(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Computes the WCAG contrast ratio between two `#rrggbb` hex colors — order-independent, the
 * lighter of the two always sits on top of `(L1 + 0.05) / (L2 + 0.05)` per the spec formula.
 * Returns a value between 1 (identical) and 21 (black on white).
 */
export function contrastRatio(fg: string, bg: string): number {
  const fgLuminance = relativeLuminance(fg);
  const bgLuminance = relativeLuminance(bg);
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}
