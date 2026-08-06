// T005 (specs/010-registration-redesign, FR-001, FR-006, FR-015): real rendered-output/behavior
// tests, not smoke tests (docs/verification.md Level 2) — covers the two-segment render, the
// selected/unselected visual treatment (colors.brand.primary vs colors.segment.inactiveTrack,
// per FR-006's token-only requirement), onChange firing on press, and the aria-checked
// accessibility fix RegistrationForm.tsx's account-type toggle already established (FR-015),
// generalized here rather than reinvented.
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "@/theme";

import { SegmentedControl } from "./SegmentedControl";

const OPTIONS = [
  { label: "Usuario", value: "usuario" },
  { label: "Tienda", value: "tienda" },
];

describe("SegmentedControl (FR-001, FR-006, FR-015)", () => {
  it("renders both segment labels", () => {
    render(
      <SegmentedControl options={OPTIONS} value="usuario" onChange={jest.fn()} testID="account-type" />,
    );

    expect(screen.getByText("Usuario")).toBeTruthy();
    expect(screen.getByText("Tienda")).toBeTruthy();
  });

  it("renders the active segment with brand.primary fill and the inactive one with segment.inactiveTrack (FR-006)", () => {
    render(
      <SegmentedControl options={OPTIONS} value="usuario" onChange={jest.fn()} testID="account-type" />,
    );

    const activeSegment = screen.getByTestId("account-type-option-usuario");
    const inactiveSegment = screen.getByTestId("account-type-option-tienda");

    expect(StyleSheet.flatten(activeSegment.props.style).backgroundColor).toBe(colors.brand.primary);
    expect(StyleSheet.flatten(inactiveSegment.props.style).backgroundColor).toBe("transparent");

    const track = screen.getByTestId("account-type");
    expect(StyleSheet.flatten(track.props.style).backgroundColor).toBe(colors.segment.inactiveTrack);
  });

  it("calls onChange with the pressed option's value", () => {
    const onChange = jest.fn();
    render(<SegmentedControl options={OPTIONS} value="usuario" onChange={onChange} testID="account-type" />);

    fireEvent.press(screen.getByTestId("account-type-option-tienda"));

    expect(onChange).toHaveBeenCalledWith("tienda");
  });

  // FR-015 / mirrors RegistrationForm.test.tsx's account-type toggle regression: aria-checked
  // must be set as a top-level Pressable prop (not just accessibilityState), since this repo's
  // pinned react-native-web (0.19.13) never forwards accessibilityState to the DOM.
  it("exposes the selected segment via aria-checked, not just a visual style (FR-015)", () => {
    const { UNSAFE_getAllByType, rerender } = render(
      <SegmentedControl options={OPTIONS} value="usuario" onChange={jest.fn()} testID="account-type" />,
    );

    function ariaCheckedFor(label: string): boolean | undefined {
      const pressable = UNSAFE_getAllByType(Pressable).find((p) => p.props.accessibilityLabel === label);
      return pressable?.props["aria-checked"];
    }

    expect(ariaCheckedFor("Usuario")).toBe(true);
    expect(ariaCheckedFor("Tienda")).toBe(false);

    rerender(<SegmentedControl options={OPTIONS} value="tienda" onChange={jest.fn()} testID="account-type" />);

    expect(ariaCheckedFor("Usuario")).toBe(false);
    expect(ariaCheckedFor("Tienda")).toBe(true);
  });

  it("exposes an accessible radiogroup/radio role structure", () => {
    render(
      <SegmentedControl options={OPTIONS} value="usuario" onChange={jest.fn()} testID="account-type" />,
    );

    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  // FR-015 (T027): react-native-web only treats Space as a valid Pressable activation key for
  // accessibilityRole="button" (webKeyActivation.ts's top comment) — role="radio" gets Enter for
  // free but silently drops Space without this fix.
  it("activates a segment on a Space keydown, not just a press (FR-015)", () => {
    const onChange = jest.fn();
    render(<SegmentedControl options={OPTIONS} value="usuario" onChange={onChange} testID="account-type" />);

    fireEvent(screen.getByTestId("account-type-option-tienda"), "keyDown", { key: " " });

    expect(onChange).toHaveBeenCalledWith("tienda");
  });
});
