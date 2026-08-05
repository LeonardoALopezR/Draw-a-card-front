// Covers FR-004 (typed profile fields — nombre/apellidoPaterno required, apellidoMaterno
// genuinely optional — plus ToS/privacy acceptance), FR-003 (T026, US2: conditional business
// fields — commercialName/fiscalAddress rendered and required only for business accounts, RFC
// required for every account type), and SC-002 (validation errors render inline, never an
// alert/full-screen replacement) for src/features/identity/ProfileForm.tsx (T016/T026).
import React from "react";
import { fireEvent, render, waitFor, type RenderAPI } from "@testing-library/react-native";
import { Pressable } from "react-native";

import { ProfileForm } from "./ProfileForm";

function fillRequiredFields(getByLabelText: RenderAPI["getByLabelText"]) {
  fireEvent.changeText(getByLabelText("Nombre"), "Ana");
  fireEvent.changeText(getByLabelText("Apellido paterno"), "Garcia");
  fireEvent.changeText(getByLabelText("Birth date"), "1990-01-01");
  fireEvent.changeText(getByLabelText("Nationality"), "MX");
  fireEvent.changeText(getByLabelText("CURP"), "GARA900101MDFXXX01");
  fireEvent.changeText(getByLabelText("RFC"), "GARA900101ABC");
}

describe("ProfileForm", () => {
  // FR-004, SC-002: submitting with required fields missing shows the schema's inline error
  // text next to nombre/apellidoPaterno (profileFormSchema, src/domain/schemas.ts), and never
  // calls onSubmit.
  it("shows inline validation-error text for missing required fields and does not call onSubmit", async () => {
    const onSubmit = jest.fn();
    const { getByText, getByRole } = render(<ProfileForm onSubmit={onSubmit} />);

    fireEvent.press(getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(getByText("Nombre is required")).toBeTruthy();
      expect(getByText("Apellido paterno is required")).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // FR-004: the accept-required validation — submission is blocked, and inline errors render,
  // when the ToS/privacy checkboxes are not both checked, even with every other field valid.
  it("blocks submission and shows inline errors when ToS/privacy acceptance is missing", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole, getByTestId } = render(<ProfileForm onSubmit={onSubmit} />);

    fillRequiredFields(getByLabelText);
    fireEvent.press(getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(getByTestId("profile-tos-error")).toBeTruthy();
      expect(getByTestId("profile-privacy-error")).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // FR-004: a fully valid submission (including checking both acceptance checkboxes) calls
  // onSubmit with the typed payload — no transformation happens in the component. Also confirms
  // apellidoMaterno being left blank does NOT block submission (it is genuinely optional).
  it("calls onSubmit with the typed payload once required fields and acceptances are provided", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole } = render(<ProfileForm onSubmit={onSubmit} />);

    fillRequiredFields(getByLabelText);
    // apellidoMaterno intentionally left blank.
    fireEvent.press(getByRole("checkbox", { name: "I accept the Terms of Service" }));
    fireEvent.press(getByRole("checkbox", { name: "I accept the Privacy Policy" }));

    fireEvent.press(getByRole("button", { name: "Save profile" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.nombre).toBe("Ana");
    expect(submitted.apellidoPaterno).toBe("Garcia");
    expect(submitted.apellidoMaterno).toBeUndefined();
    expect(submitted.tosAccepted).toBe(true);
    expect(submitted.privacyAccepted).toBe(true);
  });

  // FR-004: T032 (found by T021's manual smoke check) — apellidoMaterno must be genuinely
  // optional, not just "never touched". Typing a value and then clearing it back to "" (what
  // React Hook Form actually produces for a cleared controlled TextInput — never `undefined`,
  // unlike the never-touched case the test above already covers) must NOT block submission with
  // Zod's raw default message ("String must contain at least 1 character(s)"). Regression test
  // for src/domain/schemas.ts's optionalNonEmptyString fix.
  it("does not block submission when apellidoMaterno is typed into and then cleared", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole, queryByText } = render(<ProfileForm onSubmit={onSubmit} />);

    fillRequiredFields(getByLabelText);
    fireEvent.changeText(getByLabelText("Apellido materno"), "Lopez");
    fireEvent.changeText(getByLabelText("Apellido materno"), "");
    fireEvent.press(getByRole("checkbox", { name: "I accept the Terms of Service" }));
    fireEvent.press(getByRole("checkbox", { name: "I accept the Privacy Policy" }));

    fireEvent.press(getByRole("button", { name: "Save profile" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(queryByText("String must contain at least 1 character(s)")).toBeNull();
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.apellidoMaterno).toBeUndefined();
  });

  // T028 (Constitution VII, SC-002): regression test for the same accessibility defect class
  // found on RegistrationForm's account-type radios (see that file's test of the same name) —
  // these checkboxes also relied on `accessibilityState={{ checked }}` alone, which this repo's
  // pinned react-native-web (0.19.13) never forwards to the DOM, leaving the checked state
  // conveyed only visually (the checkboxChecked background-color style). Reads each Pressable's
  // own `aria-checked` prop directly (via `UNSAFE_getAllByType`), not the rendered host node's
  // `accessibilityState` — see RegistrationForm.test.tsx's equivalent test for why that
  // distinction is what actually catches this defect in this (native-Pressable-resolving)
  // Jest environment.
  it("exposes each acceptance checkbox's checked state via aria-checked, not just a visual style", () => {
    const onSubmit = jest.fn();
    const { UNSAFE_getAllByType, getByRole } = render(<ProfileForm onSubmit={onSubmit} />);

    function ariaCheckedFor(label: string): boolean | undefined {
      const pressable = UNSAFE_getAllByType(Pressable).find((p) => p.props.accessibilityLabel === label);
      return pressable?.props["aria-checked"];
    }

    expect(ariaCheckedFor("I accept the Terms of Service")).toBe(false);
    expect(ariaCheckedFor("I accept the Privacy Policy")).toBe(false);

    fireEvent.press(getByRole("checkbox", { name: "I accept the Terms of Service" }));
    expect(ariaCheckedFor("I accept the Terms of Service")).toBe(true);
    expect(ariaCheckedFor("I accept the Privacy Policy")).toBe(false);

    fireEvent.press(getByRole("checkbox", { name: "I accept the Privacy Policy" }));
    expect(ariaCheckedFor("I accept the Privacy Policy")).toBe(true);
  });

  // FR-003, FR-004: a server-reported field error (as produced by
  // src/domain/profile.ts's mapProfileError for an "RfcConflict" ApiError) renders inline next
  // to the rfc field, not as a generic banner — same pattern as RegistrationForm's equivalent
  // test.
  it("renders a server-supplied field error inline next to the corresponding field", async () => {
    const onSubmit = jest.fn();
    const { getByText, rerender } = render(<ProfileForm onSubmit={onSubmit} />);

    rerender(
      <ProfileForm onSubmit={onSubmit} serverError={{ field: "rfc", message: "That RFC is already registered" }} />
    );

    await waitFor(() => expect(getByText("That RFC is already registered")).toBeTruthy());
  });

  // T026 (US2, FR-003): commercialName/fiscalAddress are not rendered at all for a personal
  // account (isBusiness defaults to false) — this task's whole premise is that these fields are
  // conditional, not just conditionally required.
  it("does not render the business fields when isBusiness is false (default)", () => {
    const onSubmit = jest.fn();
    const { queryByLabelText } = render(<ProfileForm onSubmit={onSubmit} />);

    expect(queryByLabelText("Commercial name")).toBeNull();
    expect(queryByLabelText("Fiscal address")).toBeNull();
  });

  // T026 (US2, FR-003): the business fields render only when isBusiness is true.
  it("renders the business fields when isBusiness is true", () => {
    const onSubmit = jest.fn();
    const { getByLabelText } = render(<ProfileForm onSubmit={onSubmit} isBusiness />);

    expect(getByLabelText("Commercial name")).toBeTruthy();
    expect(getByLabelText("Fiscal address")).toBeTruthy();
  });

  // spec.md US2 Acceptance Scenario 2, T026 (FR-003, FR-004): a business submission missing RFC
  // is rejected with a visible inline validation error identifying the missing field, and never
  // reaches onSubmit — RFC is shared with the personal schema (already required there), but this
  // proves it's still enforced client-side in business mode specifically, per the acceptance
  // scenario's exact wording.
  it("shows an inline RFC error and does not call onSubmit when RFC is missing in business mode", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole, getByText } = render(<ProfileForm onSubmit={onSubmit} isBusiness />);

    fireEvent.changeText(getByLabelText("Nombre"), "Ana");
    fireEvent.changeText(getByLabelText("Apellido paterno"), "Garcia");
    fireEvent.changeText(getByLabelText("Birth date"), "1990-01-01");
    fireEvent.changeText(getByLabelText("Nationality"), "MX");
    fireEvent.changeText(getByLabelText("CURP"), "GARA900101MDFXXX01");
    // RFC intentionally left blank.
    fireEvent.changeText(getByLabelText("Commercial name"), "Tienda Ana");
    fireEvent.changeText(getByLabelText("Fiscal address"), "Calle Falsa 123, CDMX");
    fireEvent.press(getByRole("checkbox", { name: "I accept the Terms of Service" }));
    fireEvent.press(getByRole("checkbox", { name: "I accept the Privacy Policy" }));

    fireEvent.press(getByRole("button", { name: "Save profile" }));

    await waitFor(() => expect(getByText("RFC is required")).toBeTruthy());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // T026 (US2, FR-003): commercialName/fiscalAddress are required in business mode (unlike
  // personal mode, where they're genuinely optional/absent) — a business submission missing
  // either is rejected client-side with an inline error, no submission attempted.
  it("shows inline errors and does not call onSubmit when commercialName/fiscalAddress are missing in business mode", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole, getByText } = render(<ProfileForm onSubmit={onSubmit} isBusiness />);

    fillRequiredFields(getByLabelText);
    // Commercial name / fiscal address intentionally left blank.
    fireEvent.press(getByRole("checkbox", { name: "I accept the Terms of Service" }));
    fireEvent.press(getByRole("checkbox", { name: "I accept the Privacy Policy" }));

    fireEvent.press(getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(getByText("Commercial name is required")).toBeTruthy();
      expect(getByText("Fiscal address is required")).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // T026 (US2, FR-003, FR-004): a fully valid business submission calls onSubmit with the typed
  // payload, including the business-only fields — no transformation happens in the component.
  it("calls onSubmit with commercialName/fiscalAddress included for a valid business submission", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole } = render(<ProfileForm onSubmit={onSubmit} isBusiness />);

    fillRequiredFields(getByLabelText);
    fireEvent.changeText(getByLabelText("Commercial name"), "Tienda Ana");
    fireEvent.changeText(getByLabelText("Fiscal address"), "Calle Falsa 123, CDMX");
    fireEvent.press(getByRole("checkbox", { name: "I accept the Terms of Service" }));
    fireEvent.press(getByRole("checkbox", { name: "I accept the Privacy Policy" }));

    fireEvent.press(getByRole("button", { name: "Save profile" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.commercialName).toBe("Tienda Ana");
    expect(submitted.fiscalAddress).toBe("Calle Falsa 123, CDMX");
  });
});
