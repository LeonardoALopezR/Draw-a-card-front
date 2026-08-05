// Covers FR-002 (5-digit phone verification, accessible), SC-002 (inline errors, never an
// alert/full-page reload), and the Edge Case: code expiry/resend for
// src/features/identity/VerifyPhoneScreen.tsx (T015). Mirrors RegistrationForm.test.tsx's
// structure (T011).
import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import { RESEND_COOLDOWN_SECONDS, VerifyPhoneScreen } from "./VerifyPhoneScreen";

describe("VerifyPhoneScreen", () => {
  // FR-002, SC-002: submitting a code that fails verificationCodeSchema (fewer than 5 digits)
  // shows the schema's inline error text and never calls onSubmit.
  it("shows an inline validation-error and does not call onSubmit for an incomplete code", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByText, getByRole } = render(
      <VerifyPhoneScreen onSubmit={onSubmit} onResend={jest.fn()} />
    );

    fireEvent.changeText(getByLabelText("Verification code"), "123");
    fireEvent.press(getByRole("button", { name: "Verify code" }));

    await waitFor(() => expect(getByText("Enter the 5-digit code")).toBeTruthy());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // FR-002: a correct, complete code calls onSubmit with the exact typed payload — no
  // transformation happens in the component.
  it("calls onSubmit with the typed payload for a correct-code submission", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole } = render(
      <VerifyPhoneScreen onSubmit={onSubmit} onResend={jest.fn()} />
    );

    fireEvent.changeText(getByLabelText("Verification code"), "12345");
    fireEvent.press(getByRole("button", { name: "Verify code" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ code: "12345" }));
  });

  // FR-002: a server-reported wrong/expired code (mapVerifyPhoneError's { field: "code", ... })
  // renders inline next to the code field, not as a generic banner.
  it("renders a server-supplied code error inline next to the code field", async () => {
    const onSubmit = jest.fn();
    const { getByText, rerender } = render(<VerifyPhoneScreen onSubmit={onSubmit} onResend={jest.fn()} />);

    rerender(
      <VerifyPhoneScreen
        onSubmit={onSubmit}
        onResend={jest.fn()}
        serverError={{ field: "code", message: "That verification code is incorrect" }}
      />
    );

    await waitFor(() => expect(getByText("That verification code is incorrect")).toBeTruthy());
  });

  // SC-002: a field-less server error (e.g. a network failure) renders inline as a general
  // error, never an OS alert or a full-screen replacement.
  it("renders a field-less server error as an inline general error", async () => {
    const onSubmit = jest.fn();
    const { getByText, getByTestId, rerender } = render(
      <VerifyPhoneScreen onSubmit={onSubmit} onResend={jest.fn()} />
    );

    rerender(
      <VerifyPhoneScreen
        onSubmit={onSubmit}
        onResend={jest.fn()}
        serverError={{ message: "Something went wrong. Please try again." }}
      />
    );

    await waitFor(() => {
      expect(getByTestId("verify-phone-form-error")).toBeTruthy();
      expect(getByText("Something went wrong. Please try again.")).toBeTruthy();
    });
  });

  // Edge Case (spec.md — code expiry/resend): pressing "Resend code" calls onResend and
  // immediately disables the button for the cooldown window, so a second press before it elapses
  // does not call onResend again.
  it("disables the resend button during the cooldown after pressing it, and re-enables once it elapses", () => {
    jest.useFakeTimers();
    try {
      const onResend = jest.fn();
      const { getByRole, getByText } = render(<VerifyPhoneScreen onSubmit={jest.fn()} onResend={onResend} />);

      const resendButton = getByRole("button", { name: "Resend code" });
      expect(resendButton.props.accessibilityState.disabled).toBe(false);

      fireEvent.press(resendButton);
      expect(onResend).toHaveBeenCalledTimes(1);
      expect(resendButton.props.accessibilityState.disabled).toBe(true);
      expect(getByText(`Resend code (${RESEND_COOLDOWN_SECONDS}s)`)).toBeTruthy();

      // A second press while disabled must not call onResend again.
      fireEvent.press(resendButton);
      expect(onResend).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(getByText(`Resend code (${RESEND_COOLDOWN_SECONDS - 1}s)`)).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(RESEND_COOLDOWN_SECONDS * 1000);
      });
      expect(resendButton.props.accessibilityState.disabled).toBe(false);
      expect(getByText("Resend code")).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  // Edge Case (spec.md — resend): a resend outcome message (success or mapped error) renders as
  // its own inline banner, not tied to any form field.
  it("renders a resend outcome message as an inline banner", async () => {
    const { getByTestId, getByText, rerender } = render(
      <VerifyPhoneScreen onSubmit={jest.fn()} onResend={jest.fn()} />
    );

    rerender(<VerifyPhoneScreen onSubmit={jest.fn()} onResend={jest.fn()} resendMessage="Verification code resent" />);

    await waitFor(() => {
      expect(getByTestId("verify-phone-resend-message")).toBeTruthy();
      expect(getByText("Verification code resent")).toBeTruthy();
    });
  });
});
