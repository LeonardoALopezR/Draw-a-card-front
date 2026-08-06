import { Redirect, Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
import { useFonts } from "expo-font";
import { useState } from "react";
import { View } from "react-native";

import { KYC_ROUTE_TARGETS, useKycGate } from "@/features/identity/useKycGate";
import { LocaleProvider } from "@/features/i18n/LocaleContext";
import { PLAYFAIR_DISPLAY_BOLD } from "@/theme/fonts";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  // T010 (spec.md Clarifications, Recorded default 1; FR-011; plan.md's "Font loading"
  // Research Decision): gates the entire QueryClientProvider/KycGate tree behind Playfair
  // Display loading, so no screen using typography.display.fontFamily can flash the fallback
  // system font. The key passed to useFonts() reuses PLAYFAIR_DISPLAY_BOLD (src/theme/fonts.ts)
  // rather than a second hardcoded "PlayfairDisplay_700Bold" literal, so this call and
  // typography.ts's fontFamily reference can never drift apart.
  const [fontsLoaded] = useFonts({ [PLAYFAIR_DISPLAY_BOLD]: PlayfairDisplay_700Bold });

  // Mirrors KycGate's own "render nothing until ready" <View style={{ flex: 1 }} /> placeholder
  // below — deliberately the exact same minimal shape, not a second, differently-styled loading
  // view (plan.md's "Font loading" Research Decision).
  if (!fontsLoaded) {
    return <View testID="fonts-loading" style={{ flex: 1 }} />;
  }

  return (
    <LocaleProvider>
      <QueryClientProvider client={queryClient}>
        <KycGate />
      </QueryClientProvider>
    </LocaleProvider>
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
