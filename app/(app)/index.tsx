// T014 (specs/004-home-scan-shell): the Home/Scan destination's route file — renders
// HomeScreen (src/features/navigation/HomeScreen.tsx, T013) only. This is what
// 001-registration-kyc's resolveKycRoute() "main" route lands on now that app/index.tsx (the
// repo-scaffold placeholder) is removed in this same change (FR-001, FR-009): "/" resolves
// through this (app) route group's own index route instead.
import { HomeScreen } from "@/features/navigation/HomeScreen";

export default function HomeRouteScreen() {
  return <HomeScreen />;
}
