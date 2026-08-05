// Covers FR-006 (four controls, top-to-bottom order, real accessibility labels, minimum
// 44x44 tap target), FR-010 (no backend calls / no real behavior — asserted implicitly by
// there being no mocked API/domain module for any of these controls to call), SC-004 (minimum
// tap target + non-empty accessibility label), and SC-005 (never a silent no-op — activating
// each control shows visible "not yet available" feedback). docs/verification.md Level 2 —
// asserts rendered output/behavior, not implementation details.
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { TopRightControls } from "./TopRightControls";

// spec.md US4 AS1's exact stated order: language, currency, notifications, messages.
const EXPECTED_ORDER = [
  "Language, English or Spanish — not yet available",
  "Currency, US Dollar or Mexican Peso — not yet available",
  "Notifications — not yet available",
  "Messages — not yet available",
];

describe("TopRightControls", () => {
  // FR-006, spec.md US4 AS1: exactly four controls render, top-to-bottom, in the stated order.
  it("renders exactly four controls, top-to-bottom, in the stated order", () => {
    render(<TopRightControls />);

    const buttons = screen.getAllByRole("button");

    expect(buttons).toHaveLength(4);
    expect(buttons.map((button) => button.props.accessibilityLabel)).toEqual(EXPECTED_ORDER);
  });

  // spec.md US4 AS3: each announces a distinct, real label, not a bare icon with no label.
  it("gives each control a distinct, non-empty accessibility label", () => {
    render(<TopRightControls />);

    const labels = screen.getAllByRole("button").map((button) => button.props.accessibilityLabel);

    expect(new Set(labels).size).toBe(labels.length);
    labels.forEach((label) => expect(label.length).toBeGreaterThan(0));
  });

  // SC-004: every control has a minimum 44x44 logical-pixel tap target.
  it("gives each control a minimum 44x44 tap target", () => {
    render(<TopRightControls />);

    screen.getAllByRole("button").forEach((button) => {
      const style = StyleSheet.flatten(button.props.style);
      expect(style.minWidth).toBeGreaterThanOrEqual(44);
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
    });
  });

  // FR-006, SC-005: activating each control individually shows visible "not yet available"
  // feedback — never a silent no-op — without performing any real behavior.
  describe.each(EXPECTED_ORDER)("the %s control", (accessibilityLabel) => {
    it('shows "Not yet available" feedback on activation, and nothing beforehand', () => {
      render(<TopRightControls />);

      expect(screen.queryByText(/not yet available/i)).toBeNull();

      fireEvent.press(screen.getByRole("button", { name: accessibilityLabel }));

      expect(screen.getByText(/not yet available/i)).toBeTruthy();
    });

    it("toggles the feedback back off when activated a second time", () => {
      render(<TopRightControls />);

      const control = screen.getByRole("button", { name: accessibilityLabel });
      fireEvent.press(control);
      expect(screen.getByText(/not yet available/i)).toBeTruthy();

      fireEvent.press(control);
      expect(screen.queryByText(/not yet available/i)).toBeNull();
    });
  });
});
