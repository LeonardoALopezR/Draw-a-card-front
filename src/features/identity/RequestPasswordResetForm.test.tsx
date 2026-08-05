// Covers FR-007 (request a password-reset code by email, without revealing whether the email is
// registered) for src/features/identity/RequestPasswordResetForm.tsx (T011), and the Edge Cases
// section of spec.md ("What happens if the reset-code request itself fails at the network
// level ... A distinct, honest network-failure message") via the `serverError` prop added in the
// T013/T014 review follow-up fix (progress/review_005-login.md, Finding 1).
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import {
  REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE,
  RequestPasswordResetForm,
} from "./RequestPasswordResetForm";

describe("RequestPasswordResetForm", () => {
  // FR-007: a valid submission calls onSubmit with the parsed email, and — on a resolved `true`
  // (success), regardless of whether the email is actually registered — the form then renders the
  // generic, anti-enumeration confirmation copy (never a distinct "email not found" message).
  it("calls onSubmit with the parsed email then renders the generic confirmation on success", async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    const { getByLabelText, getByRole, getByTestId, getByText } = render(
      <RequestPasswordResetForm onSubmit={onSubmit} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
    fireEvent.press(getByRole("button", { name: "Send reset code" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ email: "ana@example.com" }));
    await waitFor(() => {
      expect(getByTestId("request-reset-confirmation")).toBeTruthy();
      expect(getByText(REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE)).toBeTruthy();
    });
  });

  // spec.md Edge Cases: a network-level failure (onSubmit resolves `false`) must NOT render the
  // generic confirmation — the caller (LoginScreen.tsx) is expected to keep this component
  // mounted and pass a `serverError` describing the failure instead, mirroring SignInForm's single
  // general-inline-error-banner pattern (progress/review_005-login.md's T013/T014 review, Finding
  // 1).
  it("renders a serverError banner instead of the confirmation when onSubmit resolves false", async () => {
    const onSubmit = jest.fn().mockResolvedValue(false);
    const { getByLabelText, getByRole, getByTestId, queryByTestId, getByText, rerender } = render(
      <RequestPasswordResetForm onSubmit={onSubmit} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
    fireEvent.press(getByRole("button", { name: "Send reset code" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ email: "ana@example.com" }));
    expect(queryByTestId("request-reset-confirmation")).toBeNull();

    rerender(
      <RequestPasswordResetForm
        onSubmit={onSubmit}
        onBack={jest.fn()}
        serverError="We couldn't reach the sign-in service. Check your connection and try again."
      />
    );

    await waitFor(() => {
      expect(getByTestId("request-reset-form-error")).toBeTruthy();
      expect(
        getByText("We couldn't reach the sign-in service. Check your connection and try again.")
      ).toBeTruthy();
    });
    expect(queryByTestId("request-reset-confirmation")).toBeNull();
  });

  // FR-007, SC-002: an invalid/missing email is caught client-side before onSubmit is ever
  // called.
  it("shows an inline validation error and does not call onSubmit for an invalid email", async () => {
    const onSubmit = jest.fn();
    const { getByRole, getByText } = render(<RequestPasswordResetForm onSubmit={onSubmit} onBack={jest.fn()} />);

    fireEvent.press(getByRole("button", { name: "Send reset code" }));

    await waitFor(() => expect(getByText("Enter a valid email address")).toBeTruthy());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // spec.md US2 AS5: "Back to sign in" is a local UI-state trigger, not a route change — pressing
  // it calls the injected onBack prop directly.
  it("calls onBack when 'Back to sign in' is pressed", () => {
    const onBack = jest.fn();
    const { getByRole } = render(<RequestPasswordResetForm onSubmit={jest.fn()} onBack={onBack} />);

    fireEvent.press(getByRole("button", { name: "Back to sign in" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
