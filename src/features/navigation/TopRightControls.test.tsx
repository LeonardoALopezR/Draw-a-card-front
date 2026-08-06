// Covers FR-011 (four icon controls, stated order, real accessibility labels, minimum
// 44x44 tap target, both locales), FR-012 (the language control renders a Mexico/USA flag-style
// visual, not a text label), SC-004 (minimum tap target + non-empty accessibility label), SC-005
// (never a silent no-op — activating each control shows visible "not yet available" feedback),
// and SC-006 (every string renders correctly in both Spanish and English) per tasks.md T007
// (specs/008-scan-experience). docs/verification.md Level 2 — asserts rendered output/behavior,
// not implementation details.
//
// Layout-fix regression coverage (2026-08-06, found by a live browser render — see
// TopRightControls.tsx's top-of-file comment): the "renders horizontally as a compact row"/
// "feedback bubble is out of flow" tests below assert real structural properties that actually
// drive RN's Yoga layout on every platform — unlike the WebSidebarNav/WebBottomBarNav bug fixed
// in commit `39c3f02`, where a `flexDirection` style was silently ignored because it sat on a
// web-`inline` element, `View` (used throughout this file) is a real flex container by default
// on every target, so `flexDirection`/`position` assertions here are a genuine proxy for what a
// browser will render, not just "the style key exists."
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { navCopy } from "@/domain/i18n/copy/nav";
import { LocaleProvider, useLocale } from "@/features/i18n/LocaleContext";

import { TopRightControls } from "./TopRightControls";

// spec.md FR-011's exact stated order: language, currency, notifications, messages — rendered
// left to right now that the controls lay out as a horizontal row (2026-08-06 layout fix)
// rather than top to bottom as a column.
const EXPECTED_ORDER_ES = [
  navCopy.es.languageAccessibilityLabel,
  navCopy.es.currencyAccessibilityLabel,
  navCopy.es.notificationsAccessibilityLabel,
  navCopy.es.messagesAccessibilityLabel,
];

const EXPECTED_ORDER_EN = [
  navCopy.en.languageAccessibilityLabel,
  navCopy.en.currencyAccessibilityLabel,
  navCopy.en.notificationsAccessibilityLabel,
  navCopy.en.messagesAccessibilityLabel,
];

// The old, retired text labels 004 rendered as visible copy — none of these must appear as
// visible text anymore now that every control is icon-only (this task's whole point).
const RETIRED_TEXT_LABELS = ["ENG/ESP", "USD/MXN", "Notifications", "Messages"];

// Reuses the exact test-only "flip the locale" trigger pattern already established by
// src/features/identity/SignInForm.test.tsx / src/features/i18n/LocaleContext.test.tsx.
function LocaleSwitchTrigger() {
  const { setLocale } = useLocale();
  return (
    <Pressable testID="switch-to-en" onPress={() => setLocale("en")} accessibilityRole="button">
      <Text>switch</Text>
    </Pressable>
  );
}

describe("TopRightControls", () => {
  // FR-011: exactly four controls render, left-to-right, in the stated order, defaulting to
  // Spanish (DEFAULT_LOCALE) with no <LocaleProvider> wrapping the render — the same bare-render-
  // defaults-to-es convention every other i18n'd component test in this repo uses.
  it("renders exactly four controls, left-to-right, in the stated order", () => {
    render(<TopRightControls />);

    const buttons = screen.getAllByRole("button");

    expect(buttons).toHaveLength(4);
    expect(buttons.map((button) => button.props.accessibilityLabel)).toEqual(EXPECTED_ORDER_ES);
  });

  // Layout fix (2026-08-06): the four controls must lay out as a horizontal row, not 004's
  // original vertical column — a column reserved the whole stack's height as empty space above
  // every one of the shell's five destinations once ShellHeader (T008) made this shell-wide
  // chrome (~285px on desktop, ~450px of an 812px mobile viewport, measured in a real browser
  // before this fix). `View` is a real flex container on every platform by default (unlike the
  // `Link`/`Text` `display: inline` trap fixed for WebSidebarNav/WebBottomBarNav in `39c3f02`),
  // so asserting `flexDirection` here is a genuine proxy for real rendered layout, not merely a
  // style-object round-trip.
  it("lays the four controls out horizontally as a row, not stacked as a column", () => {
    render(<TopRightControls />);

    const stack = screen.getByTestId("top-right-controls");
    const style = StyleSheet.flatten(stack.props.style);

    expect(style.flexDirection).toBe("row");
  });

  // This task's core requirement: icon-only rendering — none of 004's old visible text labels
  // remain anywhere in the tree.
  it("renders icon-only controls, with none of the old visible text labels", () => {
    render(<TopRightControls />);

    RETIRED_TEXT_LABELS.forEach((label) => {
      expect(screen.queryByText(label)).toBeNull();
    });
  });

  // FR-012: the language control renders a hand-drawn Mexico/USA flag-style visual (not a text
  // label) — both badges present, and genuinely flag-shaped, not merely a placeholder testID
  // (the human explicitly asked for something that reads as a flag, 2026-08-05, superseding the
  // earlier two-letter "MX"/"US" text chip this control originally shipped with).
  it("renders the language control as a Mexico/USA FlagBadge pair, not a text label", () => {
    render(<TopRightControls />);

    expect(screen.getByTestId("flag-badge-mx", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId("flag-badge-us", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText("MX")).toBeNull();
    expect(screen.queryByText("US")).toBeNull();
  });

  // FR-012: verifies the Mexico badge's actual drawn structure — three equal vertical bands in
  // the real flag's green/white/red, left to right, built from nested Views (not text, not an
  // emoji, not an image asset).
  it("draws the Mexico flag as three vertical green/white/red bands", () => {
    render(<TopRightControls />);

    // includeHiddenElements: the flag badges are intentionally aria-hidden (decorative, see
    // TopRightControls.tsx's FlagBadge comment) — RNTL's default queries exclude accessibility-
    // hidden elements, so this option is required to reach into the shape being tested here.
    const mexicoFlag = screen.getByTestId("flag-badge-mx", { includeHiddenElements: true });
    const bandColors = mexicoFlag
      .findAllByType(View)
      .map((node: { props: { style: StyleProp<ViewStyle> } }) => StyleSheet.flatten(node.props.style).backgroundColor)
      .filter(Boolean);

    expect(bandColors).toEqual(["#006847", "#FFFFFF", "#CE1126"]);
  });

  // FR-012: verifies the USA badge's actual drawn structure — five alternating red/white
  // horizontal stripes (top and bottom both red, mirroring the real flag) plus a blue canton in
  // the upper-left, built from nested Views.
  it("draws the USA flag as red/white stripes with a blue canton in the upper-left", () => {
    render(<TopRightControls />);

    const usaFlag = screen.getByTestId("flag-badge-us", { includeHiddenElements: true });
    const drawnColors = usaFlag
      .findAllByType(View)
      .map((node: { props: { style: StyleProp<ViewStyle> } }) => StyleSheet.flatten(node.props.style).backgroundColor)
      .filter(Boolean);

    expect(drawnColors).toEqual([
      "#B22234",
      "#FFFFFF",
      "#B22234",
      "#FFFFFF",
      "#B22234",
      "#3C3B6E",
    ]);
  });

  // spec.md FR-011/Constitution VII: each control announces a distinct, real, non-empty label —
  // never a bare icon with no accessible name.
  it("gives each control a distinct, non-empty accessibility label", () => {
    render(<TopRightControls />);

    const labels = screen.getAllByRole("button").map((button) => button.props.accessibilityLabel);

    expect(new Set(labels).size).toBe(labels.length);
    labels.forEach((label: string) => expect(label.length).toBeGreaterThan(0));
  });

  // SC-004: every control keeps a minimum 44x44 logical-pixel tap target even as an icon button.
  it("gives each control a minimum 44x44 tap target", () => {
    render(<TopRightControls />);

    screen.getAllByRole("button").forEach((button) => {
      const style = StyleSheet.flatten(button.props.style);
      expect(style.minWidth).toBeGreaterThanOrEqual(44);
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
    });
  });

  // FR-011, SC-005: activating each control individually shows visible "not yet available"
  // feedback — never a silent no-op — without performing any real behavior. Same mechanism 004
  // established, now driven by navCopy.es.notYetAvailableFeedback.
  describe.each(EXPECTED_ORDER_ES)("the %s control", (accessibilityLabel) => {
    it('shows the "not yet available" feedback on activation, and nothing beforehand', () => {
      render(<TopRightControls />);

      expect(screen.queryByText(navCopy.es.notYetAvailableFeedback)).toBeNull();

      fireEvent.press(screen.getByRole("button", { name: accessibilityLabel }));

      expect(screen.getByText(navCopy.es.notYetAvailableFeedback)).toBeTruthy();
    });

    it("toggles the feedback back off when activated a second time", () => {
      render(<TopRightControls />);

      const control = screen.getByRole("button", { name: accessibilityLabel });
      fireEvent.press(control);
      expect(screen.getByText(navCopy.es.notYetAvailableFeedback)).toBeTruthy();

      fireEvent.press(control);
      expect(screen.queryByText(navCopy.es.notYetAvailableFeedback)).toBeNull();
    });
  });

  // Layout fix (2026-08-06): in the old column layout, feedback text sat in-flow below its
  // control with nothing beside it to disturb. In the new row layout, in-flow feedback would
  // widen that control's flex item and visibly shove the other three controls sideways every
  // time it toggled on. Regression-guards the fix (`position: "absolute"` takes the bubble out
  // of flow) two ways: the style itself, and the real-world consequence — the other three
  // controls' order, count, and accessible names are unchanged before and after the bubble
  // appears.
  it("shows feedback as an out-of-flow bubble that does not shift the other three controls", () => {
    render(<TopRightControls />);

    const beforeOrder = screen
      .getAllByRole("button")
      .map((button) => button.props.accessibilityLabel);

    fireEvent.press(screen.getByRole("button", { name: EXPECTED_ORDER_ES[0] }));

    const feedbackBubble = screen.getByText(navCopy.es.notYetAvailableFeedback);
    expect(StyleSheet.flatten(feedbackBubble.props.style).position).toBe("absolute");

    const afterOrder = screen
      .getAllByRole("button")
      .map((button) => button.props.accessibilityLabel);
    expect(afterOrder).toEqual(beforeOrder);
  });

  // SC-006: switching the locale context to "en" (the exact seam 007-localization's future
  // picker calls) re-renders every accessibility label and the feedback text in English — zero
  // copy hardcoded in TopRightControls.tsx, all of it routed through useTranslation(navCopy).
  it("renders the English equivalents when the locale context is set to 'en'", () => {
    render(
      <LocaleProvider>
        <LocaleSwitchTrigger />
        <TopRightControls />
      </LocaleProvider>
    );

    // Sanity check: Spanish by default, before the switch.
    expect(screen.getByRole("button", { name: EXPECTED_ORDER_ES[0] })).toBeTruthy();

    fireEvent.press(screen.getByTestId("switch-to-en"));

    const buttons = screen.getAllByRole("button").filter((button) => button.props.accessibilityLabel);
    expect(buttons.map((button) => button.props.accessibilityLabel)).toEqual(EXPECTED_ORDER_EN);

    fireEvent.press(screen.getByRole("button", { name: EXPECTED_ORDER_EN[0] }));
    expect(screen.getByText(navCopy.en.notYetAvailableFeedback)).toBeTruthy();
  });
});
