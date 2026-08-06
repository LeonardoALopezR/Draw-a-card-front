// Covers FR-007 (email carried forward, editable), FR-008 (submit code + new password), and
// FR-009 (cooldown-limited resend, mirroring VerifyPhoneScreen's pattern) for
// src/features/identity/ResetPasswordForm.tsx (T012), plus spec.md US2 AS2's "confirm a generic
// 'check your email' confirmation" requirement via the static confirmation copy added in the
// T013/T014 review follow-up fix (progress/review_005-login.md, Finding 2, option (b)).
//
// T033 (006-visual-identity, spec.md Assumptions — "forgot-password sub-views inherit the
// vocabulary"): every query below now targets the default-locale (Spanish, FR-012) copy
// loginCopy.es exposes — ResetPasswordForm renders through useTranslation(loginCopy) as of T032,
// and useLocale() resolves to DEFAULT_LOCALE ("es") when no <LocaleProvider> wraps a render,
// exactly like every other bare-render test in this repo (src/features/i18n/LocaleContext.test.tsx's
// own "falls back to the default locale" test, SignInForm.test.tsx/RequestPasswordResetForm.test.tsx's
// precedent). Queries read the literal strings from loginCopy.es/loginCopy.en directly (never a
// duplicated hardcoded string) so this file can never silently drift from the real dictionary.
// Every pre-existing assertion (onSubmit's payload contract, initialEmail pre-fill/editability,
// the code-field serverError wiring, the RESEND_COOLDOWN_SECONDS timer, onBack) is kept, unmodified
// in behavior — only the query strings moved from hardcoded English to the real translated copy.
// The previously-exported RESET_CODE_SENT_MESSAGE string constant is retired in favor of
// loginCopy.{es,en}.resetCodeSentMessage (confirmed via repo-wide grep before removing it — nothing
// outside this file's own, now-rewritten test imported it). Adds a locale-switch rendering check
// (spec.md US4 AS1/US2 assumptions).
import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { loginCopy } from "@/domain/i18n/copy/login";
import { LocaleProvider, useLocale } from "@/features/i18n/LocaleContext";

import { RESEND_COOLDOWN_SECONDS, ResetPasswordForm } from "./ResetPasswordForm";

const es = loginCopy.es;
const en = loginCopy.en;

// Reuses the exact test-only "flip the locale" trigger pattern already established by
// src/features/i18n/LocaleContext.test.tsx, SignInForm.test.tsx, and
// RequestPasswordResetForm.test.tsx, so the "renders in English" test below exercises the real
// useLocale()/setLocale() seam rather than a second, parallel test-only mechanism.
function LocaleSwitchTrigger() {
  const { setLocale } = useLocale();
  return (
    <Pressable testID="switch-to-en" onPress={() => setLocale("en")} accessibilityRole="button">
      <Text>switch</Text>
    </Pressable>
  );
}

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
    expect(getByText(es.resetCodeSentMessage)).toBeTruthy();
  });

  // FR-008: a fully valid submission calls onSubmit with the exact typed ResetWithCodeInput
  // payload — no transformation happens in the component.
  it("calls onSubmit with the parsed email/code/password on a successful submit", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole } = render(
      <ResetPasswordForm onSubmit={onSubmit} onResend={jest.fn()} onBack={jest.fn()} initialEmail="ana@example.com" />
    );

    fireEvent.changeText(getByLabelText(es.resetCodeLabel), "123456");
    fireEvent.changeText(getByLabelText(es.newPasswordLabel), "supersecret1");

    fireEvent.press(getByRole("button", { name: es.setNewPassword }));

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

    const emailInput = getByLabelText(es.emailLabel);
    expect(emailInput.props.value).toBe("ana@example.com");

    fireEvent.changeText(emailInput, "corrected@example.com");
    fireEvent.changeText(getByLabelText(es.resetCodeLabel), "123456");
    fireEvent.changeText(getByLabelText(es.newPasswordLabel), "supersecret1");
    fireEvent.press(getByRole("button", { name: es.setNewPassword }));

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

      const resendButton = getByRole("button", { name: es.resendCode });
      expect(resendButton.props.accessibilityState.disabled).toBe(false);

      fireEvent.press(resendButton);
      expect(onResend).toHaveBeenCalledTimes(1);
      expect(resendButton.props.accessibilityState.disabled).toBe(true);
      expect(
        getByText(es.resendCodeWithSeconds.replace("{{seconds}}", String(RESEND_COOLDOWN_SECONDS)))
      ).toBeTruthy();

      // A second press while disabled must not call onResend again.
      fireEvent.press(resendButton);
      expect(onResend).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(
        getByText(es.resendCodeWithSeconds.replace("{{seconds}}", String(RESEND_COOLDOWN_SECONDS - 1)))
      ).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(RESEND_COOLDOWN_SECONDS * 1000);
      });
      expect(resendButton.props.accessibilityState.disabled).toBe(false);
      expect(getByText(es.resendCode)).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  // spec.md US2 AS5: "Back to sign in" is a local UI-state trigger, not a route change — pressing
  // it calls the injected onBack prop directly.
  it("calls onBack when 'Back to sign in' is pressed", () => {
    const onBack = jest.fn();
    const { getByRole } = render(<ResetPasswordForm onSubmit={jest.fn()} onResend={jest.fn()} onBack={onBack} />);

    fireEvent.press(getByRole("button", { name: es.backToSignIn }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  // spec.md US4 AS1/US2 assumptions ("forgot-password sub-views inherit the vocabulary"):
  // switching the locale context to "en" (the exact seam 007-localization's future picker calls)
  // re-renders this form's every string in English — zero copy hardcoded in this file, all of it
  // routed through useTranslation(loginCopy).
  it("renders the English equivalents when the locale context is set to 'en'", async () => {
    const { getByTestId, getByRole, queryByLabelText, getByLabelText, getByText } = render(
      <LocaleProvider>
        <LocaleSwitchTrigger />
        <ResetPasswordForm onSubmit={jest.fn()} onResend={jest.fn()} onBack={jest.fn()} initialEmail="ana@example.com" />
      </LocaleProvider>
    );

    // Sanity check: Spanish by default (FR-012), before the switch.
    expect(getByLabelText(es.emailLabel)).toBeTruthy();

    fireEvent.press(getByTestId("switch-to-en"));

    expect(queryByLabelText(es.emailLabel)).toBeNull();
    expect(getByLabelText(en.emailLabel)).toBeTruthy();
    expect(getByText(en.resetCodeTitle)).toBeTruthy();
    expect(getByText(en.resetCodeSentMessage)).toBeTruthy();
    expect(getByText(en.resetCodeSubtitle)).toBeTruthy();
    expect(getByLabelText(en.resetCodeLabel)).toBeTruthy();
    expect(getByLabelText(en.newPasswordLabel)).toBeTruthy();
    expect(getByRole("button", { name: en.setNewPassword })).toBeTruthy();
    expect(getByRole("button", { name: en.resendCode })).toBeTruthy();
    expect(getByRole("button", { name: en.backToSignIn })).toBeTruthy();
  });
});
