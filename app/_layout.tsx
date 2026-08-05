import { Redirect, Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { View } from "react-native";

import { KYC_ROUTE_TARGETS, useKycGate } from "@/features/identity/useKycGate";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <KycGate />
    </QueryClientProvider>
  );
}

// T010: redirects a resolved, non-"main" route to its screen (T011+ — several of those screens
// don't exist yet; navigating to one that doesn't degrades to expo-router's own "Unmatched
// route" screen rather than looping, since `route` itself only changes when the underlying
// session/query state changes, not on every render). "main" renders the Stack as-is (currently
// just app/index.tsx) with no redirect, so a fully-resolved user never bounces anywhere.
//
// Constraint (see progress/impl_001-registration-kyc.md Run 5): a bare `null` here, not a fully
// designed loading screen, is intentional — T022 owns building the real neutral loading view and
// its own test; this is only the minimal placeholder needed so cold boot never flashes
// register/main before the session + current-user check resolves. Rendering `null` instead of
// `<Stack>` while loading is what actually prevents that flash (rendering `<Stack>` would show
// whatever screen the last known route was, e.g. app/index.tsx, for a beat before the redirect
// fires) — T022 only needs to replace this `null` with real UI, not restructure this gating.
function KycGate() {
  const { route, isLoading } = useKycGate();

  if (isLoading) {
    return <View testID="kyc-gate-loading" style={{ flex: 1 }} />;
  }

  return (
    <>
      {route && route !== "main" ? <Redirect href={KYC_ROUTE_TARGETS[route]} /> : null}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
