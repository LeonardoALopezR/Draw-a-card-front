// Covers FR-004 (centre "+" card), FR-005 (T016 — "+" card navigates to exactly SCAN_ROUTE),
// FR-006 (top-right four-control stack), and FR-008 (top-left Amigos pill) for HomeScreen
// (specs/004-home-scan-shell, T013/T016) — asserts all three composed pieces render with their
// expected roles/labels, that the composition is structurally correct per the wireframe
// (top-left Amigos pill, top-right controls stack, centre scan card), and that pressing the
// scan card navigates to exactly SCAN_ROUTE (US2 AS1). Exact pixel-position assertion isn't
// meaningful in RNTL (docs/verification.md), so this checks containment (`within` each named
// container) and overall render order in the tree instead. Mocks expo-router's `useRouter` with
// a single shared, resettable `mockPush`, mirroring AmigosQuickAccessPill.test.tsx (T008)'s
// established pattern, since both AmigosQuickAccessPill and (as of T016) HomeScreen itself call
// `useRouter().push` directly.
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// T020 (specs/004-home-scan-shell): HomeScreen now calls useSafeAreaInsets() (a real-device
// finding fixed this run — see progress/impl_004-home-scan-shell.md). Under react-test-renderer
// there is no real SafeAreaProvider measurement, so any render of HomeScreen needs the library's
// own official Jest mock (react-native-safe-area-context/jest/mock) or useSafeAreaInsets throws
// "No safe area value available." — its mocked SafeAreaProvider still honours `initialMetrics`
// (used below), and its mocked useSafeAreaInsets falls back to zero insets for every render that
// doesn't wrap in one.
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default
);

import { SCAN_ROUTE } from "@/domain/navigation";

import { HomeScreen } from "./HomeScreen";

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // FR-008: the Amigos quick-access pill renders inside the top-left region.
  it("renders the Amigos quick-access pill top-left", () => {
    render(<HomeScreen />);

    const topLeft = within(screen.getByTestId("home-screen-top-left"));
    expect(topLeft.getByRole("button", { name: "Amigos" })).toBeTruthy();
  });

  // FR-006: all four top-right placeholder controls render inside the top-right region.
  it("renders the four top-right placeholder controls top-right", () => {
    render(<HomeScreen />);

    const topRight = within(screen.getByTestId("home-screen-top-right"));
    expect(topRight.getAllByRole("button")).toHaveLength(4);
  });

  // FR-004: the centre "+" scan card renders inside the centre region, with its real
  // accessibility label (not a bare "+"/"button").
  it("renders the scan entry card dead centre", () => {
    render(<HomeScreen />);

    const centre = within(screen.getByTestId("home-screen-centre"));
    expect(centre.getByRole("button", { name: "Scan a card" })).toBeTruthy();
  });

  // Structural check (not pixel-perfect): the Amigos pill, the four top-right controls, and
  // the scan card appear in that render order in the tree — matching the wireframe's top-left /
  // top-right / centre layout, since the top row (containing top-left then top-right) renders
  // before the centre row in HomeScreen's JSX.
  it("renders the Amigos pill, then the top-right controls, then the scan card, in that order", () => {
    render(<HomeScreen />);

    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((button) => button.props.accessibilityLabel);

    expect(labels).toEqual([
      "Amigos",
      "Language, English or Spanish — not yet available",
      "Currency, US Dollar or Mexican Peso — not yet available",
      "Notifications — not yet available",
      "Messages — not yet available",
      "Scan a card",
    ]);
  });

  // T020/T021 regression guard, spec.md Edge Cases ("the [top-right] stack may scroll
  // independently... it must never overlap or obscure the centre '+' card affordance"): real-
  // browser verification (progress/impl_004-home-scan-shell.md) found that a plain `flex: 1`
  // View clipped the fixed-height scan card against the viewport with no way to recover it on
  // a short/narrow landscape-phone viewport, since Expo's web output sets `body { overflow:
  // hidden }`. HomeScreen's root must stay a ScrollView (not a plain View) so the whole screen
  // — not just the top-right stack — can scroll independently instead of permanently clipping
  // the centre card when it doesn't fit.
  it("wraps its content in a ScrollView so the screen can scroll independently on a short viewport", () => {
    render(<HomeScreen />);

    const scrollView = screen.UNSAFE_getByType(ScrollView);
    expect(scrollView.props.testID).toBe("home-screen");
  });

  // T020 regression guard: a real-device screenshot (iPhone 17 Pro Simulator, Dynamic Island —
  // see progress/impl_004-home-scan-shell.md) found the top-left Amigos pill and top-right
  // controls rendering directly underneath the system status bar/notch, since this screen has
  // no header (native <Tabs> uses screenOptions={{ headerShown: false }}) to reserve that space
  // itself. Renders inside a SafeAreaProvider with a non-zero top/left/right inset (the mocked
  // SafeAreaProvider above honours `initialMetrics` for exactly this) and asserts the top row's
  // flattened padding actually incorporates each inset, not just the original hardcoded 16.
  it("pads the top row by the device's safe-area insets, not just a fixed 16px", () => {
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 400, height: 800 },
          insets: { top: 47, left: 10, right: 12, bottom: 0 },
        }}
      >
        <HomeScreen />
      </SafeAreaProvider>
    );

    const topRow = screen.getByTestId("home-screen-top-row");
    const flatStyle = StyleSheet.flatten(topRow.props.style);

    expect(flatStyle.paddingTop).toBe(16 + 47);
    expect(flatStyle.paddingLeft).toBe(16 + 10);
    expect(flatStyle.paddingRight).toBe(16 + 12);
  });

  // T016, FR-005, spec.md US2 AS1: pressing the "+" card navigates to exactly SCAN_ROUTE
  // (src/domain/navigation.ts) — not a hardcoded "/scan" literal in either this component or
  // this test. Located the same way a screen reader would (T017, SC-002/SC-004): by accessible
  // role + name, not by icon or testID.
  it("navigates to exactly SCAN_ROUTE when the scan card is pressed", () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Scan a card" }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(SCAN_ROUTE);
  });
});
