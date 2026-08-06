// T025 (specs/008-scan-experience): confirms HomeScreen's (Inicio) quick-action card and the
// shell's Escanear tab (app/(app)/escanear.tsx, T019, wired into the native tab bar by
// app/(app)/_layout.tsx, T009) resolve to the *identical* destination — not a lookalike
// duplicate — per FR-013 and spec.md US5 AS2. This replaces 004-home-scan-shell's original
// Amigos-pill-vs-Amigos-tab convergence test (the same shape, now applied to Inicio's
// repurposed centre card and Escanear, since AmigosQuickAccessPill is retired outright by US6,
// T031).
//
// Two things are asserted, both grounded in NAV_DESTINATIONS (src/domain/navigation.ts, T001)
// so they cannot silently drift apart:
//
// 1. Route convergence: pressing the quick-action card pushes to exactly NAV_DESTINATIONS'
//    "escanear" entry's `route` ("/escanear") — the same string app/(app)/_layout.tsx's native
//    <Tabs.Screen> derives its own Escanear tab's screen name from (screen name "escanear" <->
//    route segment "escanear" <-> the sibling file app/(app)/escanear.tsx, by expo-router's own
//    file-based-routing convention). If a future edit renamed the tab's screen name away from
//    "escanear" without updating NAV_DESTINATIONS (or vice versa), this test fails.
// 2. Screen convergence: app/(app)/escanear.tsx — the exact file expo-router mounts for the
//    "escanear" tab/route, whichever entry point navigated there — renders the same title as
//    ScanShellScreen (src/features/scanner/ScanShellScreen.tsx) rendered directly, proving the
//    route file is a pure pass-through and not a second, diverging screen.
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockTabsScreen = jest.fn().mockReturnValue(null);

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  Tabs: Object.assign(
    ({ children }: { children: React.ReactNode }) => children,
    { Screen: (props: { name: string }) => mockTabsScreen(props) },
  ),
}));

import { homeCopy } from "@/domain/i18n/copy/home";
import { NAV_DESTINATIONS } from "@/domain/navigation";
import { ScanShellScreen } from "@/features/scanner/ScanShellScreen";

import AppTabsLayout from "../../../app/(app)/_layout";
import EscanearRouteScreen from "../../../app/(app)/escanear";
import { HomeScreen } from "./HomeScreen";

describe("Inicio quick-action card vs. Escanear tab convergence (FR-013)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const escanearDestination = NAV_DESTINATIONS.find((destination) => destination.key === "escanear");

  it("has an Escanear entry in NAV_DESTINATIONS for both entry points to converge on", () => {
    expect(escanearDestination).toBeDefined();
  });

  // FR-013: pressing the quick-action card — inside the real HomeScreen composition, not an
  // isolated card render — navigates to exactly NAV_DESTINATIONS' Escanear route.
  it("navigates the quick-action card to exactly NAV_DESTINATIONS' Escanear route", () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByRole("button", { name: homeCopy.es.scanQuickActionLabel }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(escanearDestination?.route);
  });

  // Grounds the native shell's Escanear tab configuration (app/(app)/_layout.tsx, T009) in the
  // exact same NAV_DESTINATIONS route the quick-action card uses: the tab's screen name is
  // expo-router's file-based-routing segment for that same route ("/escanear" <-> screen name
  // "escanear" <-> sibling file app/(app)/escanear.tsx). A future rename on either side without
  // the other fails this test.
  it("configures the native Escanear tab's screen name from the same NAV_DESTINATIONS route the quick-action card uses", () => {
    render(<AppTabsLayout />);

    const tabScreenNames = mockTabsScreen.mock.calls.map(([props]) => props.name);
    const escanearRouteSegment = escanearDestination?.route.replace(/^\//, "");

    expect(escanearRouteSegment).toBeTruthy();
    expect(tabScreenNames).toContain(escanearRouteSegment);
  });

  // Screen convergence: app/(app)/escanear.tsx — the literal file expo-router mounts for the
  // "escanear" route/tab regardless of entry point — renders the same title as ScanShellScreen
  // rendered directly. Not a second, diverging screen.
  it("renders the identical Escanear screen title whether reached via the route file or the component directly", () => {
    const viaRoute = render(<EscanearRouteScreen />);
    const viaRouteHeader = viaRoute.getByRole("header").props.children;
    viaRoute.unmount();

    const direct = render(<ScanShellScreen />);
    const directHeader = direct.getByRole("header").props.children;
    direct.unmount();

    expect(viaRouteHeader).toEqual(directHeader);
  });
});
