// specs/008-scan-experience/tasks.md T019 (US3, FR-003): the Escanear destination's route
// file — renders ScanShellScreen (src/features/scanner/ScanShellScreen.tsx, mobile; Metro's
// `.web.tsx` platform-extension resolution picks ScanShellScreen.web.tsx on web automatically,
// the same mechanism the retired app/scan.tsx relied on) only, no business logic here
// (Constitution IV). Reached from the shell's Escanear tab like every other destination — this
// route sits INSIDE the app/(app) route group, so app/(app)/_layout.tsx's shared ShellHeader/
// tab bar/sidebar wraps it automatically; it renders no "Back" affordance of its own (reversing
// 006-visual-identity's Recorded default 3 — see plan.md's Research Decisions).
import { ScanShellScreen } from "@/features/scanner/ScanShellScreen";

export default function EscanearRouteScreen() {
  return <ScanShellScreen />;
}
