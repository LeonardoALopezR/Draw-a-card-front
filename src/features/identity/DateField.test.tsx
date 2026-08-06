// T007 (specs/010-registration-redesign, FR-013, spec.md Clarification 4): real rendered-
// output/behavior tests (docs/verification.md Level 2) for the native/default DateField —
// rendering the placeholder/formatted value, opening the native picker on press, and emitting a
// real `Date` on confirm (matching profileFormSchema's `birthDate: z.coerce.date()`, no schema
// change). The library's own internal event-translation (`DateTimePickerEvent`'s `type` field
// synthesis, iOS/Android's differing native-dialog chrome) is the vendor's own concern, not
// DateField.tsx's — this drives the `onChange` prop DateField.tsx itself passes to
// `<DateTimePicker>` directly (found via `UNSAFE_getByType`), with event shapes matching the
// package's own public `DateTimePickerEvent` contract, rather than routing a synthetic
// `fireEvent` through the vendor's real internal native-host-component wiring (which jest-expo's
// fixed "ios" haste platform would only exercise the iOS variant of regardless — the vendor's own
// iOS implementation always synthesizes `type: "set"`, never `"dismissed"`, so Android's cancel
// path genuinely cannot be driven through the real component in this test environment; testing
// DateField.tsx's own `handlePickerChange` logic directly, as this file does, is what makes that
// branch testable at all).
//
// T029 fix (FR-013, FR-015 — real iOS Simulator pass, defect 2 of 2, see progress/impl_010-
// registration-redesign.md "Run 11"): this suite was rewritten for the new Modal-sheet+confirm
// interaction (DateField.tsx's top comment has the full defect writeup). What this suite CAN
// prove: the picker is rendered inside the field's own subtree (queried via `testID`s that are
// all suffixes of the field's own `testID` prop, never a floating/detached element), and a
// value is never committed to the field until "confirm" is pressed. What it CANNOT prove: the
// real on-device visual position of the sheet, or that iOS's actual "spinner" chrome (as opposed
// to this test's synthetic `onChange` events driven straight into the component) renders where
// expected — that is exactly the class of defect only a real simulator/device pass (T029) can
// catch, restated plainly rather than implied away by a green suite.
import { act, render, screen, fireEvent, within } from "@testing-library/react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { DateField } from "./DateField";

describe("DateField (native/default) — FR-013", () => {
  it("renders the label and a placeholder when no value is set", () => {
    render(<DateField label="Fecha de nacimiento" onChange={jest.fn()} testID="birth-date" />);

    expect(screen.getByText("Fecha de nacimiento")).toBeTruthy();
    expect(screen.getByText("dd/mm/aaaa")).toBeTruthy();
  });

  it("renders a dd/mm/yyyy-formatted value when one is set", () => {
    render(
      <DateField
        label="Fecha de nacimiento"
        value={new Date(2001, 0, 15)}
        onChange={jest.fn()}
        testID="birth-date"
      />,
    );

    expect(screen.getByText("15/01/2001")).toBeTruthy();
  });

  it("does not render the native picker until the trigger is pressed", () => {
    render(<DateField label="Fecha de nacimiento" onChange={jest.fn()} testID="birth-date" />);

    expect(screen.queryByTestId("birth-date-picker")).toBeNull();

    fireEvent.press(screen.getByTestId("birth-date-trigger"));

    expect(screen.getByTestId("birth-date-picker")).toBeTruthy();
  });

  // T029 fix regression guard: the previous defect was the picker rendering as a detached
  // sibling with no relationship to the field's own subtree — asserting the picker/confirm
  // controls are found *within* the field's own root node (queried by the field's own `testID`)
  // is a structural proxy for "presented as part of its own field", not proof of on-screen
  // position (see this file's top comment).
  it("renders the open picker and its confirm control within the field's own subtree", () => {
    render(<DateField label="Fecha de nacimiento" onChange={jest.fn()} testID="birth-date" />);

    fireEvent.press(screen.getByTestId("birth-date-trigger"));

    const field = screen.getByTestId("birth-date");
    expect(within(field).getByTestId("birth-date-picker")).toBeTruthy();
    expect(within(field).getByTestId("birth-date-confirm")).toBeTruthy();
  });

  it("does not commit a value while the wheel is scrolled — only 'set' events update the draft", () => {
    const onChange = jest.fn();
    const { UNSAFE_getByType } = render(
      <DateField label="Fecha de nacimiento" onChange={onChange} testID="birth-date" />,
    );

    fireEvent.press(screen.getByTestId("birth-date-trigger"));
    const selected = new Date(1990, 0, 1);
    const picker = UNSAFE_getByType(DateTimePicker);
    act(() => {
      picker.props.onChange(
        { type: "set", nativeEvent: { timestamp: selected.getTime(), utcOffset: 0 } },
        selected,
      );
    });

    // Spinner mode fires "set" on every tick — this must NOT close the sheet or call the field's
    // own onChange yet (the pre-T029 defect: a single tick used to commit and close instantly).
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId("birth-date-picker")).toBeTruthy();
  });

  it("emits a real Date and closes the sheet only when 'confirm' is pressed", () => {
    const onChange = jest.fn();
    const { UNSAFE_getByType } = render(
      <DateField label="Fecha de nacimiento" onChange={onChange} testID="birth-date" />,
    );

    fireEvent.press(screen.getByTestId("birth-date-trigger"));
    const selected = new Date(1990, 0, 1);
    const picker = UNSAFE_getByType(DateTimePicker);
    act(() => {
      picker.props.onChange(
        { type: "set", nativeEvent: { timestamp: selected.getTime(), utcOffset: 0 } },
        selected,
      );
    });
    fireEvent.press(screen.getByTestId("birth-date-confirm"));

    expect(onChange).toHaveBeenCalledTimes(1);
    const emitted = onChange.mock.calls[0][0];
    expect(emitted).toBeInstanceOf(Date);
    expect(emitted.getTime()).toBe(selected.getTime());
    expect(screen.queryByTestId("birth-date-picker")).toBeNull();
  });

  it("does not update the draft on a 'dismissed' event (Android cancel), and confirm re-commits the field's existing value", () => {
    const onChange = jest.fn();
    const { UNSAFE_getByType } = render(
      <DateField label="Fecha de nacimiento" onChange={onChange} testID="birth-date" />,
    );

    fireEvent.press(screen.getByTestId("birth-date-trigger"));
    const picker = UNSAFE_getByType(DateTimePicker);
    act(() => {
      picker.props.onChange({ type: "dismissed", nativeEvent: { timestamp: 0, utcOffset: 0 } }, undefined);
    });
    fireEvent.press(screen.getByTestId("birth-date-backdrop"));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId("birth-date-picker")).toBeNull();
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
