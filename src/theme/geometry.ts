// Pure TypeScript, no React/React Native imports (Constitution IV) — shared spacing/radius/
// control-height tokens (spec.md FR-001), per docs/design-brief-visual-identity.md §2.3.

export const radius = {
  pill: 999,
  card: 28,
  panel: 20,
  tile: 26,
  row: 16,
} as const;

// 4-based spacing scale (brief §2.3).
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 48,
} as const;

// Shared control height (buttons/inputs) — comfortably exceeds the 44pt tap-target floor
// (Constitution VII).
export const CONTROL_HEIGHT = 56;
