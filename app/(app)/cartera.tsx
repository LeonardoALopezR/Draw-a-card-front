// specs/008-scan-experience/tasks.md T030 (US6, FR-015): the Cartera destination's route
// file — renders CarteraPlaceholderScreen (src/features/portfolio/CarteraPlaceholderScreen.tsx,
// T027) only, no business logic here (Constitution IV). Reached from the shell's Cartera tab
// like every other destination — this route sits INSIDE the app/(app) route group, so
// app/(app)/_layout.tsx's shared ShellHeader/tab bar/sidebar wraps it automatically.
import { CarteraPlaceholderScreen } from "@/features/portfolio/CarteraPlaceholderScreen";

export default function CarteraRouteScreen() {
  return <CarteraPlaceholderScreen />;
}
