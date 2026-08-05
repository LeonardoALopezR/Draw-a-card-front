// T018 (specs/004-home-scan-shell): confirms AmigosQuickAccessPill (T008, rendered inside
// HomeScreen, T013) and the shell's Amigos tab (app/(app)/amigos.tsx, T014, wired into the
// native tab bar by app/(app)/_layout.tsx, T009) resolve to the *identical* destination — not
// a lookalike duplicate — per FR-008 and spec.md US3 AS3.
//
// Two things are asserted, both grounded in NAV_DESTINATIONS (src/domain/navigation.ts, T001)
// so they cannot silently drift apart:
//
// 1. Route convergence: pressing the pill pushes to exactly NAV_DESTINATIONS' "amigos" entry's
//    `route` ("/amigos") — the same string app/(app)/_layout.tsx's native <Tabs.Screen> derives
//    its own Amigos tab's screen name from (screen name "amigos" <-> route segment "amigos" <->
//    the sibling file app/(app)/amigos.tsx, by expo-router's own file-based-routing convention).
//    If a future edit renamed the tab's screen name away from "amigos" without updating
//    NAV_DESTINATIONS (or vice versa), this test fails.
// 2. Screen convergence: app/(app)/amigos.tsx — the exact file expo-router mounts for the
//    "amigos" tab/route, whichever entry point navigated there — renders the same output as
//    AmigosPlaceholderScreen (src/features/social/AmigosPlaceholderScreen.tsx, T005) rendered
//    directly, proving the route file is a pure pass-through and not a second, diverging
//    placeholder.
//
// "The shell shows Amigos as active" (spec.md US3 AS3) itself is expo-router/react-navigation's
// own built-in current-route handling — neither the pill nor the tab bar implements any custom
// "active destination" logic of its own (see app/(app)/_layout.tsx, T009: no hand-rolled
// isFocused/active styling), so once both entry points are proven to navigate to the exact same
// route (assertion 1 below), the shell necessarily shows that one route's tab as active for
// both — there is no separate "active state" code path in this codebase to test.
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

// T020 (specs/004-home-scan-shell): HomeScreen now calls useSafeAreaInsets() (a real-device
// finding fixed this run — see progress/impl_004-home-scan-shell.md). Under react-test-renderer
// there is no real SafeAreaProvider measurement, so any render of HomeScreen needs the library's
// own official Jest mock (react-native-safe-area-context/jest/mock) or useSafeAreaInsets throws
// "No safe area value available."
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default
);

import { NAV_DESTINATIONS } from "@/domain/navigation";
import { AmigosPlaceholderScreen } from "@/features/social/AmigosPlaceholderScreen";

import AppTabsLayout from "../../../app/(app)/_layout";
import AmigosRouteScreen from "../../../app/(app)/amigos";
import { HomeScreen } from "./HomeScreen";

describe("Amigos pill vs. Amigos tab convergence (FR-008)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const amigosDestination = NAV_DESTINATIONS.find((destination) => destination.key === "amigos");

  it("has an Amigos entry in NAV_DESTINATIONS for both entry points to converge on", () => {
    expect(amigosDestination).toBeDefined();
  });

  // FR-008: pressing the top-left pill — inside the real HomeScreen composition, not an
  // isolated pill render — navigates to exactly NAV_DESTINATIONS' Amigos route.
  it("navigates the pill to exactly NAV_DESTINATIONS' Amigos route", () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Amigos" }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(amigosDestination?.route);
  });

  // Grounds the native shell's Amigos tab configuration (app/(app)/_layout.tsx, T009) in the
  // exact same NAV_DESTINATIONS route the pill uses: the tab's screen name is expo-router's
  // file-based-routing segment for that same route ("/amigos" <-> screen name "amigos" <->
  // sibling file app/(app)/amigos.tsx). A future rename on either side without the other fails
  // this test.
  it("configures the native Amigos tab's screen name from the same NAV_DESTINATIONS route the pill uses", () => {
    render(<AppTabsLayout />);

    const tabScreenNames = mockTabsScreen.mock.calls.map(([props]) => props.name);
    const amigosRouteSegment = amigosDestination?.route.replace(/^\//, "");

    expect(amigosRouteSegment).toBeTruthy();
    expect(tabScreenNames).toContain(amigosRouteSegment);
  });

  // Screen convergence: app/(app)/amigos.tsx — the literal file expo-router mounts for the
  // "amigos" route/tab regardless of entry point — renders the same content as
  // AmigosPlaceholderScreen rendered directly. Not a second, diverging placeholder screen.
  it("renders the identical Amigos placeholder content whether reached via the route file or the component directly", () => {
    const viaRoute = render(<AmigosRouteScreen />);
    const viaRouteChildren = viaRoute.getByRole("header", { name: "Amigos" }).props.children;
    viaRoute.unmount();

    const direct = render(<AmigosPlaceholderScreen />);
    const directChildren = direct.getByRole("header", { name: "Amigos" }).props.children;
    direct.unmount();

    expect(viaRouteChildren).toEqual(directChildren);
  });
});
