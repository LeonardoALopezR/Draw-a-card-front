// T014 (specs/004-home-scan-shell): the Amigos destination's route file — renders
// AmigosPlaceholderScreen (src/features/social/AmigosPlaceholderScreen.tsx, T005) only, no
// business logic here (Constitution IV). Reached both from the shell's Amigos tab and from
// HomeScreen's top-left AmigosQuickAccessPill (T008) — same route, same screen (FR-008).
import { AmigosPlaceholderScreen } from "@/features/social/AmigosPlaceholderScreen";

export default function AmigosRouteScreen() {
  return <AmigosPlaceholderScreen />;
}
