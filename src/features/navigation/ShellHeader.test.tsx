// Covers FR-011 (a single shared header row rendering TopRightControls' four icon controls,
// consumed identically by all three shell entry points — app/(app)/_layout.tsx's native <Tabs>
// header, WebSidebarNav.tsx, WebBottomBarNav.tsx) per tasks.md T008 (specs/008-scan-experience).
// docs/verification.md Level 2 — asserts rendered output/behavior, not implementation details.
//
// Layout-fix regression coverage (2026-08-06, found by a live browser render — see
// TopRightControls.tsx's top-of-file comment): as shell-wide chrome above all five destinations,
// TopRightControls' old vertical-column layout reserved the whole stack's height as empty space
// on every page before any page content (~285px desktop, ~450px of an 812px mobile viewport).
// The "renders TopRightControls as a horizontal row" test below asserts the header this
// component assembles is actually a compact bar, not just that TopRightControls' own unit test
// passes in isolation.
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { navCopy } from "@/domain/i18n/copy/nav";

import { ShellHeader } from "./ShellHeader";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(),
}));

const mockUseSafeAreaInsets = useSafeAreaInsets as jest.MockedFunction<typeof useSafeAreaInsets>;

describe("ShellHeader", () => {
  beforeEach(() => {
    mockUseSafeAreaInsets.mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 });
  });

  // T008: renders TopRightControls' four controls (T007) — the exact four accessibility labels,
  // defaulting to Spanish (DEFAULT_LOCALE) with no <LocaleProvider> wrapping the render, same
  // bare-render-defaults-to-es convention every other i18n'd component test in this repo uses.
  it("renders TopRightControls' four controls", () => {
    render(<ShellHeader />);

    expect(screen.getByTestId("top-right-controls")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: navCopy.es.languageAccessibilityLabel })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: navCopy.es.currencyAccessibilityLabel })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: navCopy.es.notificationsAccessibilityLabel })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: navCopy.es.messagesAccessibilityLabel })
    ).toBeTruthy();
  });

  // Layout fix (2026-08-06): the header this component assembles must actually be a compact
  // horizontal bar, not the tall column TopRightControls originally shipped with (004) — that
  // column, applied shell-wide by this component, was the ~285px/~450px empty-band bug a live
  // browser render caught. Asserts the real child TopRightControls renders inside ShellHeader,
  // not a re-derived assumption from TopRightControls.test.tsx alone.
  it("renders TopRightControls as a horizontal row, keeping the header a compact bar", () => {
    render(<ShellHeader />);

    const controls = screen.getByTestId("top-right-controls");
    const style = StyleSheet.flatten(controls.props.style);

    expect(style.flexDirection).toBe("row");
  });

  // T008: padding reflects insets.top/insets.right when the device reports non-zero safe-area
  // insets (e.g. a notch/Dynamic Island) — the same real-device fix HomeScreen.tsx's original top
  // row already carried in 004, reused here rather than re-derived.
  it("pads the header by 16 plus the current safe-area insets.top and insets.right", () => {
    mockUseSafeAreaInsets.mockReturnValue({ top: 44, bottom: 0, left: 0, right: 20 });

    render(<ShellHeader />);

    const header = screen.getByTestId("shell-header");
    const style = StyleSheet.flatten(header.props.style);

    expect(style.paddingTop).toBe(16 + 44);
    expect(style.paddingRight).toBe(16 + 20);
  });

  // T008: with zero insets (e.g. web, where useSafeAreaInsets() always resolves to 0), the
  // padding falls back to the plain 16px base — no NaN/undefined leaking through.
  it("falls back to the plain 16px base padding when insets are zero", () => {
    render(<ShellHeader />);

    const header = screen.getByTestId("shell-header");
    const style = StyleSheet.flatten(header.props.style);

    expect(style.paddingTop).toBe(16);
    expect(style.paddingRight).toBe(16);
  });
});
