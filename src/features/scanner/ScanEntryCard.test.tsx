// Covers FR-004, FR-005 (affordance only — no navigation wiring here, that's T016/US2), and
// SC-004 (minimum 44x44 tap target + non-empty accessibility label). docs/verification.md
// Level 2 — asserts rendered output/behavior, not implementation details.
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { ScanEntryCard } from "./ScanEntryCard";

describe("ScanEntryCard", () => {
  // FR-004, SC-004: renders as a vertically-oriented rounded rectangle at the ~2.5:3.5
  // (width:height) trading-card ratio, with a tap target of at least 44x44 logical pixels.
  it("renders at a vertically-oriented trading-card aspect ratio with a minimum 44x44 tap target", () => {
    const { getByTestId } = render(<ScanEntryCard onPress={jest.fn()} />);
    const style = StyleSheet.flatten(getByTestId("scan-entry-card").props.style);

    expect(style.width).toBeLessThan(style.height);
    expect(style.width / style.height).toBeCloseTo(2.5 / 3.5, 2);
    expect(style.width).toBeGreaterThanOrEqual(44);
    expect(style.height).toBeGreaterThanOrEqual(44);
  });

  // FR-005 (affordance only), spec.md US2 AS3: the accessible name is a clear, descriptive
  // label ("Scan a card"), never a bare "+" or "button".
  it('exposes the accessibility label "Scan a card"', () => {
    const { getByRole } = render(<ScanEntryCard onPress={jest.fn()} />);

    expect(getByRole("button", { name: "Scan a card" })).toBeTruthy();
  });

  // FR-005 (affordance only): this task only accepts and forwards the onPress prop it is
  // given — real navigation wiring to /scan is a later task (T016).
  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByRole } = render(<ScanEntryCard onPress={onPress} />);

    fireEvent.press(getByRole("button", { name: "Scan a card" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // FR-013 (specs/008-scan-experience, code review Round 7 Finding 1): the optional `label`
  // override, added for Inicio's repurposed quick-action card. Absent, this component's
  // behavior must stay byte-for-byte unchanged (004-era shared code, other/future callers must
  // not be disturbed) — no visible text, bare "Scan a card" accessibility label, same as above.
  it("renders no visible text and keeps the default accessibility label when the label prop is omitted", () => {
    const { getByTestId, queryByText, getByRole } = render(<ScanEntryCard onPress={jest.fn()} />);

    expect(queryByText("Escanear una carta")).toBeNull();
    expect(getByRole("button", { name: "Scan a card" })).toBeTruthy();
    expect(getByTestId("scan-entry-card")).toBeTruthy();
  });

  // FR-013: when a label is provided, it renders as visible text alongside the "+" glyph (the
  // card must "read" the label, per spec.md Clarifications' Recorded default 1 — not just carry
  // it as an accessibility-only string) and becomes the accessible name too, so the announced
  // name matches the visible text exactly.
  it("renders the provided label as visible text and uses it as the accessibility label", () => {
    const { getByText, getByRole } = render(
      <ScanEntryCard onPress={jest.fn()} label="Escanear una carta" />
    );

    expect(getByText("+")).toBeTruthy();
    expect(getByText("Escanear una carta")).toBeTruthy();
    expect(getByRole("button", { name: "Escanear una carta" })).toBeTruthy();
  });
});
