// Covers FR-007 (email carried forward, editable), FR-008 (submit code + new password), and
// FR-009 (cooldown-limited resend, mirroring VerifyPhoneScreen's pattern) for
// src/features/identity/ResetPasswordForm.tsx (T012), plus spec.md US2 AS2's "confirm a generic
// 'check your email' confirmation" requirement via the static RESET_CODE_SENT_MESSAGE added in the
// T013/T014 review follow-up fix (progress/review_005-login.md, Finding 2, option (b)).
import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import { RESEND_COOLDOWN_SECONDS, RESET_CODE_SENT_MESSAGE, ResetPasswordForm } from "./ResetPasswordForm";

describe("ResetPasswordForm", () => {
  // spec.md US2 AS2/Independent Test, Finding 2 (option (b)): a short, static, ALWAYS-shown
  // confirmation line — not gated on any prop or domain result — so a real user genuinely sees a
  // "we've sent a code" confirmation on the screen they actually land on, since LoginScreen.tsx's
  // mode transition unmounts RequestPasswordResetForm's own confirmation before it's ever visible.
  it("always shows the static 'we've sent a code' confirmation, regardless of props", () => {
    const { getByTestId, getByText } = render(
      <ResetPasswordForm onSubmit={jest.fn()} onResend={jest.fn()} onBack={jest.fn()} />
    );

    expect(getByTestId("reset-password-code-sent-message")).toBeTruthy();
    expect(getByText(RESET_CODE_SENT_MESSAGE)).toBeTruthy();
  });

  // FR-008: a fully valid submission calls onSubmit with the exact typed ResetWithCodeInput
  // payload — no transformation happens in the component.
  it("calls onSubmit with the parsed email/code/password on a successful submit", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole } = render(
      <ResetPasswordForm onSubmit={onSubmit} onResend={jest.fn()} onBack={jest.fn()} initialEmail="ana@example.com" />
    );

    fireEvent.changeText(getByLabelText("Reset code"), "123456");
    fireEvent.changeText(getByLabelText("New password"), "supersecret1");

    fireEvent.press(getByRole("button", { name: "Set new password" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        email: "ana@example.com",
        code: "123456",
        password: "supersecret1",
      })
    );
  });

  // spec.md US2 AS5: initialEmail pre-fills the email field as a convenience, but it stays fully
  // editable — not a read-only field.
  it("pre-fills the email field from initialEmail but allows editing it", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole } = render(
      <ResetPasswordForm onSubmit={onSubmit} onResend={jest.fn()} onBack={jest.fn()} initialEmail="ana@example.com" />
    );

    const emailInput = getByLabelText("Email");
    expect(emailInput.props.value).toBe("ana@example.com");

    fireEvent.changeText(emailInput, "corrected@example.com");
    fireEvent.changeText(getByLabelText("Reset code"), "123456");
    fireEvent.changeText(getByLabelText("New password"), "supersecret1");
    fireEvent.press(getByRole("button", { name: "Set new password" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        email: "corrected@example.com",
        code: "123456",
        password: "supersecret1",
      })
    );
  });

  // FR-008: an invalid/expired-code serverError (as returned by src/domain/passwordReset.ts's
  // submitNewPassword) renders inline next to the code field, not as a generic banner.
  it("renders an invalid/expired-code serverError inline on the code field", async () => {
    const onSubmit = jest.fn();
    const { getByText, rerender } = render(
      <ResetPasswordForm onSubmit={onSubmit} onResend={jest.fn()} onBack={jest.fn()} />
    );

    rerender(
      <ResetPasswordForm
        onSubmit={onSubmit}
        onResend={jest.fn()}
        onBack={jest.fn()}
        serverError={{ field: "code", message: "That reset code is invalid or has expired" }}
      />
    );

    await waitFor(() => expect(getByText("That reset code is invalid or has expired")).toBeTruthy());
  });

  // FR-009, Edge Case (spec.md — code expiry/resend): pressing "Resend code" calls onResend and
  // immediately disables the button for the cooldown window, so a second press before it elapses
  // does not call onResend again — identical mechanism to VerifyPhoneScreen's resend pattern.
  it("disables the resend button during the cooldown after pressing it, and re-enables once it elapses", () => {
    jest.useFakeTimers();
    try {
      const onResend = jest.fn();
      const { getByRole, getByText } = render(
        <ResetPasswordForm onSubmit={jest.fn()} onResend={onResend} onBack={jest.fn()} />
      );

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

  // spec.md US2 AS5: "Back to sign in" is a local UI-state trigger, not a route change — pressing
  // it calls the injected onBack prop directly.
  it("calls onBack when 'Back to sign in' is pressed", () => {
    const onBack = jest.fn();
    const { getByRole } = render(<ResetPasswordForm onSubmit={jest.fn()} onResend={jest.fn()} onBack={onBack} />);

    fireEvent.press(getByRole("button", { name: "Back to sign in" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
