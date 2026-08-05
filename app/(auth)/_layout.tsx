import { Stack } from "expo-router";

// T009: route-group scaffolding only, no logic. Screens for the unauthenticated/
// registration-in-progress flow (register, verify-phone, profile, kyc-status) land here in
// later tasks (T011+) — see specs/001-registration-kyc/plan.md's Project Structure.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
