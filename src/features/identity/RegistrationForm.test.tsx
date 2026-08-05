// Covers FR-001 (email/password/phone/username account creation fields), FR-005 (a
// server-reported username collision shown inline next to the username field), and SC-002
// (validation errors render inline, never an alert/full-screen replacement) for
// src/features/identity/RegistrationForm.tsx (T011).
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable } from "react-native";

import { RegistrationForm } from "./RegistrationForm";

describe("RegistrationForm", () => {
  // FR-001, SC-002: submitting with required fields missing shows the schema's inline error
  // text next to the relevant fields (personalRegistrationSchema, src/domain/schemas.ts), and
  // never calls onSubmit.
  it("shows inline validation-error text for missing fields and does not call onSubmit", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByText, getByRole } = render(<RegistrationForm onSubmit={onSubmit} />);

    fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
    fireEvent.changeText(getByLabelText("Username"), "ana_garcia");
    // Password and phone are left empty.

    fireEvent.press(getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(getByText("Password must be at least 8 characters")).toBeTruthy();
      expect(getByText("Enter a valid phone number")).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // T032 (found by T021's manual smoke check, Defect 1), FR-001, SC-002: submitting the fully
  // empty form must show a custom Username message, never Zod's raw internal default
  // ("String must contain at least 1 character(s)") — that was the exact defect the smoke check
  // found. Regression test for src/domain/schemas.ts's usernameSchema `.min(1, ...)` fix.
  it("shows a custom Username message, not Zod's raw default, on a fully empty submit", async () => {
    const onSubmit = jest.fn();
    const { getByText, queryByText, getByRole } = render(<RegistrationForm onSubmit={onSubmit} />);

    fireEvent.press(getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(getByText("Username is required")).toBeTruthy();
    });
    expect(queryByText("String must contain at least 1 character(s)")).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // FR-001: a fully valid submission calls onSubmit with the exact typed
  // PersonalRegistrationInput payload (plus the selected account type — "personal" by default,
  // see the T024 test below for the "business" case) — no transformation happens in the
  // component.
  it("calls onSubmit with the typed payload and the default 'personal' account type on a successful submit", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole } = render(<RegistrationForm onSubmit={onSubmit} />);

    fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
    fireEvent.changeText(getByLabelText("Password"), "supersecret1");
    fireEvent.changeText(getByLabelText("Phone"), "+525512345678");
    fireEvent.changeText(getByLabelText("Username"), "ana_garcia");

    fireEvent.press(getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          email: "ana@example.com",
          password: "supersecret1",
          phone: "+525512345678",
          username: "ana_garcia",
        },
        "personal"
      )
    );
  });

  // T024 (US2, FR-003): selecting the "Tienda (business) account" radio option and submitting
  // calls onSubmit with accountType "business" — this is the only thing the toggle changes; no
  // new fields appear on this screen (business fields move to the profile step, T026). Also
  // proves the toggle is exposed with an accessible "radio" role (Constitution VII), not a bare
  // unlabeled Pressable.
  it("calls onSubmit with accountType 'business' when the Tienda option is selected", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole } = render(<RegistrationForm onSubmit={onSubmit} />);

    fireEvent.changeText(getByLabelText("Email"), "tienda@example.com");
    fireEvent.changeText(getByLabelText("Password"), "supersecret1");
    fireEvent.changeText(getByLabelText("Phone"), "+525512345678");
    fireEvent.changeText(getByLabelText("Username"), "tienda_ana");

    fireEvent.press(getByRole("radio", { name: "Tienda (business) account" }));
    fireEvent.press(getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          email: "tienda@example.com",
          password: "supersecret1",
          phone: "+525512345678",
          username: "tienda_ana",
        },
        "business"
      )
    );
  });

  // T028 (Constitution VII, SC-002): regression test for the accessibility defect the
  // orchestrator's manual browser check found — the account-type radios rendered with
  // `accessibilityState={{ checked }}` only, which this repo's pinned react-native-web
  // (0.19.13) never forwards to the DOM (confirmed `aria-checked=null` on both radios, before
  // and after selection, in a real browser at 375px). Selection was conveyed only visually (a
  // background-color style), not to assistive tech.
  //
  // This asserts the fix at the *source* prop level (`UNSAFE_getAllByType(Pressable)`, reading
  // each Pressable's own received props) rather than via the rendered host node's
  // `accessibilityState` (as `getByRole`'s returned instance would): Jest/RNTL resolves
  // `Pressable` to React Native's *native* implementation (jest-expo's default haste platform is
  // "ios"), whose own Pressable.js merges a top-level `aria-checked` prop into
  // `accessibilityState.checked` before that ever reaches the host node — so the host node's
  // `accessibilityState.checked` would read correctly even without this fix (it was never the
  // broken part; only react-native-web's Pressable, which is structurally different and does NOT
  // do that merge, has the bug). Reading the literal `aria-checked` prop `RegistrationForm.tsx`
  // itself passes to `Pressable` is what actually distinguishes "fixed" from "the exact defect
  // found" — before this fix, this prop was undefined; after it, it explicitly tracks selection.
  it("exposes the selected account type via aria-checked, not just a visual style", () => {
    const onSubmit = jest.fn();
    const { UNSAFE_getAllByType, getByRole } = render(<RegistrationForm onSubmit={onSubmit} />);

    function ariaCheckedFor(label: string): boolean | undefined {
      const pressable = UNSAFE_getAllByType(Pressable).find((p) => p.props.accessibilityLabel === label);
      return pressable?.props["aria-checked"];
    }

    // Default state: personal selected.
    expect(ariaCheckedFor("Personal account")).toBe(true);
    expect(ariaCheckedFor("Tienda (business) account")).toBe(false);

    fireEvent.press(getByRole("radio", { name: "Tienda (business) account" }));

    expect(ariaCheckedFor("Personal account")).toBe(false);
    expect(ariaCheckedFor("Tienda (business) account")).toBe(true);
  });

  // FR-005: a server-reported field error (as produced by
  // src/domain/registration.ts's mapRegistrationError for a "UsernameTaken" ApiError) renders
  // inline next to the username field, not as a generic banner.
  it("renders a server-supplied field error inline next to the corresponding field", async () => {
    const onSubmit = jest.fn();
    const { getByText, rerender } = render(<RegistrationForm onSubmit={onSubmit} />);

    rerender(
      <RegistrationForm
        onSubmit={onSubmit}
        serverError={{ field: "username", message: "That username is already taken" }}
      />
    );

    await waitFor(() => expect(getByText("That username is already taken")).toBeTruthy());
  });

  // SC-002: a field-less server error (e.g. a network failure) renders inline at the top of the
  // form, never as an OS alert or a full-screen replacement.
  it("renders a field-less server error as an inline general error", async () => {
    const onSubmit = jest.fn();
    const { getByText, getByTestId, rerender } = render(<RegistrationForm onSubmit={onSubmit} />);

    rerender(
      <RegistrationForm onSubmit={onSubmit} serverError={{ message: "Something went wrong. Please try again." }} />
    );

    await waitFor(() => {
      expect(getByTestId("registration-form-error")).toBeTruthy();
      expect(getByText("Something went wrong. Please try again.")).toBeTruthy();
    });
  });
});
