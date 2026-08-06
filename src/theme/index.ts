// Barrel export for the app's shared design-token module (FR-001/FR-002). `shadowSurface`/
// `shadowRaised` are imported from the platform-suffixed files by their unsuffixed base name
// ("./shadows") so Metro's own platform-extension resolution picks shadows.web.ts on web and
// shadows.ts on native — the exact mechanism app/(app)/_layout.web.tsx already relies on for
// its own .web.tsx resolution (plan.md's Research Decisions).
export { colors } from "./colors";
export { typography } from "./typography";
export { radius, space, CONTROL_HEIGHT } from "./geometry";
export { PLAYFAIR_DISPLAY_BOLD } from "./fonts";
export { shadowSurface, shadowRaised } from "./shadows";
export { contrastRatio } from "./contrast";
export { withAlpha } from "./colorUtils";

import { colors } from "./colors";
import { typography } from "./typography";
import { radius, space, CONTROL_HEIGHT } from "./geometry";
import { shadowSurface, shadowRaised } from "./shadows";

/** Combined namespace object — a consumer may write `theme.colors.brand.primary` instead of a
 * named import, whichever reads better at the call site. */
export const theme = {
  colors,
  typography,
  radius,
  space,
  CONTROL_HEIGHT,
  shadowSurface,
  shadowRaised,
} as const;
