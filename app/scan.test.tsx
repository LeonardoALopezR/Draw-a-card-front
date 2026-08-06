// T016 (specs/004-home-scan-shell), updated by specs/006-visual-identity T045/T046: confirms
// app/scan.tsx renders the real scan visual shell (ScanShellScreen, T043/T044 — replacing the
// retired ScanPlaceholderScreen stub) — not camera UI, not a capture flow — and that its "Back to
// Home" affordance calls expo-router's router.back() (004-home-scan-shell FR-005,
// 006-visual-identity FR-007, spec.md US2 AS1/AS2). This is an ordinary screen route file (not a
// `_layout.*` file), so per docs/conventions.md's Tests section it stays colocated under app/
// like every other screen test in this repo (app/(auth)/register.test.tsx,
// app/(app)/index.test.tsx, etc.) — it does not hit the `_layout.*`-specific dev-server
// route-conflict bug documented there.
//
// Honesty note (matching this feature's established pattern — see
// progress/impl_004-home-scan-shell.md's T014/T015 entries): this test imports and renders the
// route's default export directly, per this repo's existing convention for every other route
// test. It proves "this file renders the shell and calls router.back() on press" — it cannot
// prove, at the Jest/RNTL level, that popping the Stack actually re-renders an intact Home/Scan
// screen underneath, since this file renders /scan in isolation from the rest of the navigator.
// That half of US2 AS2 is confirmed instead via a real browser back-navigation check (Level 3),
// recorded in this feature's progress log.
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

import ScanRouteScreen from "./scan";

describe("app/scan.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 006-visual-identity FR-007, spec.md US3 AS1: "/scan" renders the real branded visual shell
  // (title "Escanear", defaulting to Spanish/DEFAULT_LOCALE with no <LocaleProvider> wrapping
  // this render) — not camera UI, not a capture flow.
  it('renders the scan visual shell (title "Escanear"), not camera UI', () => {
    render(<ScanRouteScreen />);

    expect(screen.getByRole("header")).toBeTruthy();
    expect(screen.getByText(scanCopy.es.titleMobile)).toBeTruthy();
  });

  // spec.md US2 AS2: pressing the "Back to Home" affordance calls router.back() — the Stack
  // pop that returns the user to the Home/Scan screen with the shell intact. Located by
  // accessible role + name (not testID/icon), the same screen-reader-oriented query style T017
  // applies to ScanEntryCard.
  //
  // T050 fix: the accessible name now comes from scanCopy.es.backAccessibilityLabel (this
  // render has no <LocaleProvider>, so it resolves to DEFAULT_LOCALE/"es" — see LocaleContext's
  // documented outside-provider fallback) rather than the retired hardcoded "Back to Home"
  // literal.
  it('calls router.back() when the "Back" affordance is pressed', () => {
    render(<ScanRouteScreen />);

    fireEvent.press(screen.getByRole("button", { name: scanCopy.es.backAccessibilityLabel }));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
