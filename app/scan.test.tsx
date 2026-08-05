// T016 (specs/004-home-scan-shell): confirms app/scan.tsx renders the real
// ScanPlaceholderScreen (T004) stub — not camera UI, not a capture flow — and that its "Back to
// Home" affordance calls expo-router's router.back() (FR-005, spec.md US2 AS1/AS2). This is an
// ordinary screen route file (not a `_layout.*` file), so per docs/conventions.md's Tests
// section it stays colocated under app/ like every other screen test in this repo
// (app/(auth)/register.test.tsx, app/(app)/index.test.tsx, etc.) — it does not hit the
// `_layout.*`-specific dev-server route-conflict bug documented there.
//
// Honesty note (matching this feature's established pattern — see
// progress/impl_004-home-scan-shell.md's T014/T015 entries): this test imports and renders the
// route's default export directly, per this repo's existing convention for every other route
// test. It proves "this file renders the stub and calls router.back() on press" — it cannot
// prove, at the Jest/RNTL level, that popping the Stack actually re-renders an intact Home/Scan
// screen underneath, since this file renders /scan in isolation from the rest of the navigator.
// That half of US2 AS2 is confirmed instead via a real browser back-navigation check (Level 3),
// recorded in this feature's progress log.
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

import ScanRouteScreen from "./scan";

describe("app/scan.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // FR-005, spec.md US2 AS1: "/scan" renders the stub placeholder — not camera UI, not a
  // capture flow.
  it("renders the scanner stub screen, not camera UI", () => {
    render(<ScanRouteScreen />);

    expect(screen.getByRole("header")).toBeTruthy();
    expect(screen.getByText(/scanner coming soon/i)).toBeTruthy();
  });

  // spec.md US2 AS2: pressing the "Back to Home" affordance calls router.back() — the Stack
  // pop that returns the user to the Home/Scan screen with the shell intact. Located by
  // accessible role + name (not testID/icon), the same screen-reader-oriented query style T017
  // applies to ScanEntryCard.
  it('calls router.back() when "Back to Home" is pressed', () => {
    render(<ScanRouteScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Back to Home" }));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
