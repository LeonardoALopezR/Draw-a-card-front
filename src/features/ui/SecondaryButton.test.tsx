// FR-001 (semantic tokens only), FR-003 (SecondaryButton matches brief §3 item 3), FR-013
// (accessibility label + >=44x44 tap target). Mirrors PrimaryButton.test.tsx's cases minus the
// shadow/opacity-disabled specifics — brief §3.2/§3.3 doesn't specify a disabled-opacity rule
// for the secondary button, so this suite doesn't assert one that isn't there.
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { colors, CONTROL_HEIGHT, radius } from "@/theme";

import { SecondaryButton } from "./SecondaryButton";

describe("SecondaryButton", () => {
  it("renders the label and calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(<SecondaryButton label="Crear cuenta" onPress={onPress} />);

    fireEvent.press(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("blocks press and exposes accessibilityState.disabled when disabled", () => {
    const onPress = jest.fn();
    render(<SecondaryButton label="Crear cuenta" onPress={onPress} disabled />);

    const button = screen.getByRole("button", { name: "Crear cuenta" });
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  // FR-013: full-width, CONTROL_HEIGHT tall — comfortably clears the 44x44 tap-target floor.
  // No shadow (brief §3.2/§3.3 — secondary buttons are flat) — bg.surface fill + border.subtle.
  it("renders full-width at CONTROL_HEIGHT with radius.pill, bg.surface fill, border.subtle border, and no shadow", () => {
    render(<SecondaryButton label="Crear cuenta" onPress={jest.fn()} />);

    const button = screen.getByRole("button", { name: "Crear cuenta" });
    const style = StyleSheet.flatten(button.props.style);

    expect(style.height).toBe(CONTROL_HEIGHT);
    expect(CONTROL_HEIGHT).toBeGreaterThanOrEqual(44);
    expect(style.width).toBe("100%");
    expect(style.borderRadius).toBe(radius.pill);
    expect(style.backgroundColor).toBe(colors.bg.surface);
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe(colors.border.subtle);
    expect(style.shadowOpacity).toBeUndefined();
    expect(style.boxShadow).toBeUndefined();
  });

  it("defaults accessibilityLabel to label, or uses an explicit override", () => {
    render(
      <SecondaryButton label="Crear cuenta" onPress={jest.fn()} accessibilityLabel="Create account" />
    );

    expect(screen.getByRole("button", { name: "Create account" })).toBeTruthy();
  });
});
