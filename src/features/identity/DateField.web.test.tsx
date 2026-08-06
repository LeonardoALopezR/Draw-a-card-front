// T007 (specs/010-registration-redesign, FR-013, spec.md Clarification 4): real rendered-
// output/behavior tests (docs/verification.md Level 2) for the web variant — the real DOM
// `<input type="date">`'s value formatting (ISO `YYYY-MM-DD`, converted to/from a `Date`) and its
// `onChange` emitting a real `Date` matching profileFormSchema's `birthDate: z.coerce.date()`.
// Imported by relative path, mirroring how this repo already tests other .web.tsx files directly
// (docs/conventions.md, e.g. FormField.test.tsx importing FormField.web).
import { render, screen, fireEvent } from "@testing-library/react-native";

import { colors } from "@/theme";

import { DateField } from "./DateField.web";

// Queried by accessible label, not testID: this file's `<input>` is a raw DOM node, so `testID`
// is renamed to `data-testid` on its way out (see DateField.web.tsx's RawDateInput — React logs an
// error-level warning for an unrecognized `testID` DOM attribute, caught by T023's live browser
// smoke check). RNTL's getByTestId matches the `testID` prop, which by design no longer reaches
// this node; the input already carries `aria-label={label}`, so getByLabelText resolves the same
// element and additionally asserts the field is reachable the way a screen-reader user reaches it.

describe("DateField.web — FR-013", () => {
  it("renders the label and a real <input type=date> with an empty value when unset", () => {
    render(<DateField label="Fecha de nacimiento" onChange={jest.fn()} testID="birth-date" />);

    expect(screen.getByText("Fecha de nacimiento")).toBeTruthy();
    const input = screen.getByLabelText("Fecha de nacimiento");
    expect(input.props.type).toBe("date");
    expect(input.props.value).toBe("");
  });

  it("renders the DOM input's value as ISO YYYY-MM-DD when a Date is set", () => {
    render(
      <DateField
        label="Fecha de nacimiento"
        value={new Date(2001, 0, 15)}
        onChange={jest.fn()}
        testID="birth-date"
      />,
    );

    expect(screen.getByLabelText("Fecha de nacimiento").props.value).toBe("2001-01-15");
  });

  it("emits a real Date matching the typed/picked ISO value on change", () => {
    const onChange = jest.fn();
    render(<DateField label="Fecha de nacimiento" onChange={onChange} testID="birth-date" />);

    fireEvent(screen.getByLabelText("Fecha de nacimiento"), "change", { target: { value: "1990-01-01" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const emitted = onChange.mock.calls[0][0];
    expect(emitted).toBeInstanceOf(Date);
    expect(emitted.getFullYear()).toBe(1990);
    expect(emitted.getMonth()).toBe(0);
    expect(emitted.getDate()).toBe(1);
  });

  it("does not call onChange for an incomplete/invalid typed value", () => {
    const onChange = jest.fn();
    render(<DateField label="Fecha de nacimiento" onChange={onChange} testID="birth-date" />);

    fireEvent(screen.getByLabelText("Fecha de nacimiento"), "change", { target: { value: "1990-01" } });

    expect(onChange).not.toHaveBeenCalled();
  });

  // Regression guard for the defect T023's live browser smoke check found (and that this whole
  // suite passed straight through): the raw DOM <input> was receiving React Native's `testID` prop
  // verbatim, which React does not recognize as a DOM attribute and reports at error level on
  // every render of the Usuario tab. Asserting BOTH directions — `data-testid` present, `testID`
  // absent — because only checking the former would still pass if `testID` were forwarded too.
  it("passes the test id to the DOM as `data-testid` and never as React Native's `testID`", () => {
    render(<DateField label="Fecha de nacimiento" onChange={jest.fn()} testID="birth-date" />);

    const input = screen.getByLabelText("Fecha de nacimiento");
    expect(input.props["data-testid"]).toBe("birth-date-input");
    expect(input.props.testID).toBeUndefined();
  });

  // T029 review fix regression guard (Constitution VII/FR-015): `outline: "none"` used to be
  // unconditional, removing this control's only visible keyboard-focus indicator. This is a
  // genuine, real proof for this specific defect (unlike the native DateField's device-only
  // defects) — the fix is a pure style computation, fully exercisable without a real browser.
  it("shows no outline at rest, and a real colors.brand.primary-based focus ring while focused (FR-015)", () => {
    render(<DateField label="Fecha de nacimiento" onChange={jest.fn()} testID="birth-date" />);

    const input = screen.getByLabelText("Fecha de nacimiento");
    expect(input.props.style.outline).toBe("none");

    fireEvent(input, "focus");
    expect(screen.getByLabelText("Fecha de nacimiento").props.style.outline).toBe(
      `2px solid ${colors.brand.primary}`,
    );

    fireEvent(input, "blur");
    expect(screen.getByLabelText("Fecha de nacimiento").props.style.outline).toBe("none");
  });

  it("renders an inline error when provided", () => {
    render(
      <DateField
        label="Fecha de nacimiento"
        onChange={jest.fn()}
        error="Ingresa una fecha de nacimiento válida"
        testID="birth-date"
      />,
    );

    expect(screen.getByRole("alert").props.children).toBe("Ingresa una fecha de nacimiento válida");
  });
});
