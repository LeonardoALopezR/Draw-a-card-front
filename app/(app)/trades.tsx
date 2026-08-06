// specs/008-scan-experience/tasks.md T030 (US6, FR-015): the Trades destination's route
// file — renders TradesPlaceholderScreen (src/features/trading/TradesPlaceholderScreen.tsx,
// T028) only, no business logic here (Constitution IV). Reached from the shell's Trades tab
// like every other destination — this route sits INSIDE the app/(app) route group, so
// app/(app)/_layout.tsx's shared ShellHeader/tab bar/sidebar wraps it automatically.
import { TradesPlaceholderScreen } from "@/features/trading/TradesPlaceholderScreen";

export default function TradesRouteScreen() {
  return <TradesPlaceholderScreen />;
}
