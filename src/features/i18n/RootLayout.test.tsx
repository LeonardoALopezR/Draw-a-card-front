// T010 (spec.md Clarifications Recorded default 1, FR-011; plan.md's "Font loading" Research
// Decision) — covers app/_layout.tsx: gates the whole tree behind Playfair Display loading
// (mirroring KycGate's own "render nothing until ready" <View style={{ flex: 1 }} /> placeholder
// — deliberately the same minimal shape, never a second, differently-styled loading view) and
// wraps the existing QueryClientProvider/KycGate tree in <LocaleProvider>
// (src/features/i18n/LocaleContext.tsx, T021) so every screen underneath can call
// useTranslation()/useLocale() without any further restructuring. This test does NOT re-test
// useKycGate()/resolveKycRoute() (src/domain/kyc-gate.ts) themselves — those are mocked here
// exactly as before this task, since T010 is additive scaffolding around the existing tree,
// never a change to the gate's own logic (005-login's FR-006 and every prior feature's routing
// behavior depend on that staying untouched).
//
// NOT colocated as "app/_layout.test.tsx" — deliberately, per docs/conventions.md's documented
// "_layout.*" test-placement exception: expo-router's dev-server route-manifest scan
// (@expo/cli's getRoutePaths -> expo-router's getDirectoryTree, used only by `expo start`/
// `npm run web`) globs every *.ts(x) file directly under app/ from disk, and its layout-conflict
// check is keyed on "same directory + same platform-specificity", not filename — a
// "_layout.test.tsx" file's ".test" segment would be silently dropped by expo-router's own
// filename parsing and read as a second "_layout.tsx" in the same directory, crashing
// `expo start --web` with "the layouts ... conflict". See
// src/features/navigation/AppWebLayout.test.tsx's file-level comment for the fuller mechanism,
// and progress/impl_004-home-scan-shell.md's "dev-server crash fix" entry for the original
// investigation. This file lives beside src/features/i18n/LocaleContext.tsx (the module this
// task wires into the root) rather than under src/features/identity/ (KycGate's own owning
// module), since this test's whole purpose is confirming the LocaleProvider wrap + font gate,
// not KycGate's own behavior.
import React from "react";
import { render, screen } from "@testing-library/react-native";

jest.mock("@expo-google-fonts/playfair-display", () => ({
  PlayfairDisplay_700Bold: "mock-playfair-display-bold-asset",
}));

jest.mock("expo-font", () => ({
  useFonts: jest.fn(),
}));

jest.mock("@/features/identity/useKycGate", () => ({
  KYC_ROUTE_TARGETS: {},
  useKycGate: jest.fn(),
}));

// Stands in for the real <Stack> — reads the REAL useLocale() (not mocked) so this test can
// prove RootLayout's tree is actually wrapped in <LocaleProvider>, not merely that it renders.
jest.mock("expo-router", () => {
  const { Text } = require("react-native");
  const { useLocale } = require("@/features/i18n/LocaleContext");
  return {
    Redirect: () => null,
    Stack: () => {
      const { locale } = useLocale();
      return <Text testID="stack-placeholder">{locale}</Text>;
    },
  };
});

import { useFonts } from "expo-font";
import { useKycGate, type UseKycGateResult } from "@/features/identity/useKycGate";

import RootLayout from "../../../app/_layout";

const mockUseFonts = useFonts as jest.MockedFunction<typeof useFonts>;
const mockUseKycGate = useKycGate as jest.MockedFunction<typeof useKycGate>;

function kycGateResult(overrides: Partial<UseKycGateResult>): UseKycGateResult {
  return {
    route: "main",
    isLoading: false,
    kycStatus: undefined,
    statusFetchFailed: false,
    kycRejectionReason: undefined,
    refetchStatus: jest.fn(),
    isRefetching: false,
    ...overrides,
  };
}

describe("app/_layout.tsx", () => {
  afterEach(() => {
    mockUseFonts.mockReset();
    mockUseKycGate.mockReset();
  });

  // FR-011, plan.md's "Font loading" Research Decision: fonts-not-yet-loaded renders the same
  // minimal flex:1 placeholder KycGate's own isLoading branch renders — never the app tree
  // (QueryClientProvider/LocaleProvider/KycGate content) — so no display.xl/display.lg text can
  // flash in a fallback system font.
  it("renders the flex:1 placeholder while fonts are loading, not the app tree", () => {
    mockUseFonts.mockReturnValue([false, null]);
    mockUseKycGate.mockReturnValue(kycGateResult({}));

    render(<RootLayout />);

    expect(screen.getByTestId("fonts-loading")).toBeTruthy();
    expect(screen.queryByTestId("stack-placeholder")).toBeNull();
    // The font gate sits above the QueryClientProvider/KycGate tree entirely — KycGate (and
    // therefore useKycGate()) is never even mounted while fonts are still loading.
    expect(mockUseKycGate).not.toHaveBeenCalled();
  });

  // FR-011: once fonts resolve, the existing QueryClientProvider/KycGate tree renders, wrapped
  // in <LocaleProvider> — proven by the mocked <Stack> stand-in reading the REAL useLocale() and
  // resolving the documented default locale ("es", src/domain/i18n/locale.ts's DEFAULT_LOCALE)
  // rather than useLocale()'s own no-provider fallback value.
  it("renders the existing tree wrapped in the locale provider once fonts are loaded", () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockUseKycGate.mockReturnValue(kycGateResult({}));

    render(<RootLayout />);

    expect(screen.queryByTestId("fonts-loading")).toBeNull();
    expect(screen.getByTestId("stack-placeholder").props.children).toBe("es");
  });

  // FR-011: KycGate's own isLoading placeholder is completely unaffected by this task — it
  // still renders its own <View testID="kyc-gate-loading" style={{ flex: 1 }} /> once the font
  // gate has passed, proving T010 only adds scaffolding around KycGate and never touches its
  // own useKycGate()/resolveKycRoute() logic.
  it("does not alter KycGate's own isLoading placeholder once fonts are loaded", () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockUseKycGate.mockReturnValue(kycGateResult({ route: undefined, isLoading: true }));

    render(<RootLayout />);

    expect(screen.getByTestId("kyc-gate-loading")).toBeTruthy();
    expect(screen.queryByTestId("stack-placeholder")).toBeNull();
  });
});
