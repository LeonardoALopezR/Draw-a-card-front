// FR-001 (semantic tokens only), FR-003 (StatusPill matches brief §3 item 6), spec.md US3 AS4
// (an inert status indicator must not present as a button to a screen reader).
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { colors, radius } from "@/theme";

import { StatusPill } from "./StatusPill";

describe("StatusPill", () => {
  it("renders the label", () => {
    render(<StatusPill label="Cámara disponible" />);

    expect(screen.getByText("Cámara disponible")).toBeTruthy();
  });

  // brief §3 item 6: accent.pillBg fill, text.link label color, radius.pill, sized to content.
  it("applies accent.pillBg fill, text.link label color, and radius.pill, sized to content not full-width", () => {
    render(<StatusPill label="Cámara disponible" />);

    const label = screen.getByText("Cámara disponible");
    const labelStyle = StyleSheet.flatten(label.props.style);
    expect(labelStyle.color).toBe(colors.text.link);

    const pill = screen.getByTestId("status-pill");
    const pillStyle = StyleSheet.flatten(pill.props.style);
    expect(pillStyle.backgroundColor).toBe(colors.accent.pillBg);
    expect(pillStyle.borderRadius).toBe(radius.pill);
    expect(pillStyle.width).toBeUndefined();
    expect(pillStyle.alignSelf).toBe("flex-start");
  });

  // spec.md US3 AS4: StatusPill is a status indicator, not a control — brief §5.2 uses it
  // non-interactively for "Cámara disponible", so it must not carry accessibilityRole="button".
  it("does not carry accessibilityRole='button' by default", () => {
    render(<StatusPill label="Cámara disponible" />);

    expect(() => screen.getByRole("button")).toThrow();
  });
});
