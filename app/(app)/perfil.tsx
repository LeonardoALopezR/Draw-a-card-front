// specs/008-scan-experience/tasks.md T030 (US6, FR-015): the Perfil destination's route
// file — renders PerfilPlaceholderScreen (src/features/identity/PerfilPlaceholderScreen.tsx,
// T029) only, no business logic here (Constitution IV). Reached from the shell's Perfil tab
// like every other destination — this route sits INSIDE the app/(app) route group, so
// app/(app)/_layout.tsx's shared ShellHeader/tab bar/sidebar wraps it automatically.
import { PerfilPlaceholderScreen } from "@/features/identity/PerfilPlaceholderScreen";

export default function PerfilRouteScreen() {
  return <PerfilPlaceholderScreen />;
}
