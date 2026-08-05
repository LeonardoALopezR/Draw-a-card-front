import { Stack } from "expo-router";

// T009: route-group scaffolding only, no logic. The first-run tutorial screen (FR-007) lands
// here in a later task (T019) — see specs/001-registration-kyc/plan.md's Project Structure.
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
