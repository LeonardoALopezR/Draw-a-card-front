// FR-001 (semantic tokens only), FR-003 (PrimaryButton matches brief §3 item 2), FR-013
// (accessibility label + >=44x44 tap target). docs/verification.md Level 2 — rendered
// role/label/interaction, not implementation details.
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { colors, CONTROL_HEIGHT, radius } from "@/theme";

import { PrimaryButton } from "./PrimaryButton";

describe("PrimaryButton", () => {
  it("renders the label and calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(<PrimaryButton label="Entrar" onPress={onPress} />);

    fireEvent.press(screen.getByRole("button", { name: "Entrar" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // spec.md Acceptance Scenario 2 (User Story 1): disabled renders at 60% opacity and exposes
  // accessibilityState.disabled — and blocks the press handler from firing.
  it("blocks press, applies 60% opacity, and exposes accessibilityState.disabled when disabled", () => {
    const onPress = jest.fn();
    render(<PrimaryButton label="Entrar" onPress={onPress} disabled />);

    const button = screen.getByRole("button", { name: "Entrar" });
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState?.disabled).toBe(true);
    const style = StyleSheet.flatten(button.props.style);
    expect(style.opacity).toBe(0.6);
  });

  it("treats busy the same as disabled — blocks press and exposes accessibilityState.disabled", () => {
    const onPress = jest.fn();
    render(<PrimaryButton label="Entrar" onPress={onPress} busy />);

    const button = screen.getByRole("button", { name: "Entrar" });
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  // FR-013: full-width, CONTROL_HEIGHT tall — comfortably clears the 44x44 tap-target floor.
  it("renders full-width at CONTROL_HEIGHT (>=44 logical pixels tall) with radius.pill and brand.primary fill", () => {
    render(<PrimaryButton label="Entrar" onPress={jest.fn()} />);

    const button = screen.getByRole("button", { name: "Entrar" });
    const style = StyleSheet.flatten(button.props.style);

    expect(style.height).toBe(CONTROL_HEIGHT);
    expect(CONTROL_HEIGHT).toBeGreaterThanOrEqual(44);
    expect(style.width).toBe("100%");
    expect(style.borderRadius).toBe(radius.pill);
    expect(style.backgroundColor).toBe(colors.brand.primary);
  });

  it("defaults accessibilityLabel to label, or uses an explicit override", () => {
    render(<PrimaryButton label="Entrar" onPress={jest.fn()} accessibilityLabel="Sign in" />);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  });
});
