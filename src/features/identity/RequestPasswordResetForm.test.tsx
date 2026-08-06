// Covers FR-007 (request a password-reset code by email, without revealing whether the email is
// registered) for src/features/identity/RequestPasswordResetForm.tsx (T011), and the Edge Cases
// section of spec.md ("What happens if the reset-code request itself fails at the network
// level ... A distinct, honest network-failure message") via the `serverError` prop added in the
// T013/T014 review follow-up fix (progress/review_005-login.md, Finding 1).
//
// T031 (006-visual-identity, spec.md Assumptions — "forgot-password sub-views inherit the
// vocabulary"): every query below now targets the default-locale (Spanish, FR-012) copy
// loginCopy.es exposes — RequestPasswordResetForm renders through useTranslation(loginCopy) as of
// T030, and useLocale() resolves to DEFAULT_LOCALE ("es") when no <LocaleProvider> wraps a render,
// exactly like every other bare-render test in this repo (src/features/i18n/LocaleContext.test.tsx's
// own "falls back to the default locale" test, SignInForm.test.tsx's T029 precedent). Queries read
// the literal strings from loginCopy.es/loginCopy.en directly (never a duplicated hardcoded
// string) so this file can never silently drift from the real dictionary. Every pre-existing
// assertion (onSubmit's boolean-resolving contract, the serverError-vs-confirmation exclusivity,
// client-side validation, onBack) is kept, unmodified in behavior — only the query strings moved
// from hardcoded English to the real translated copy. Adds a locale-switch rendering check
// (spec.md US4 AS1/US2 assumptions).
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { loginCopy } from "@/domain/i18n/copy/login";
import { LocaleProvider, useLocale } from "@/features/i18n/LocaleContext";

import { RequestPasswordResetForm } from "./RequestPasswordResetForm";

const es = loginCopy.es;
const en = loginCopy.en;

// Reuses the exact test-only "flip the locale" trigger pattern already established by
// src/features/i18n/LocaleContext.test.tsx and SignInForm.test.tsx, so the "renders in English"
// test below exercises the real useLocale()/setLocale() seam rather than a second, parallel
// test-only mechanism.
function LocaleSwitchTrigger() {
  const { setLocale } = useLocale();
  return (
    <Pressable testID="switch-to-en" onPress={() => setLocale("en")} accessibilityRole="button">
      <Text>switch</Text>
    </Pressable>
  );
}

describe("RequestPasswordResetForm", () => {
  // FR-007: a valid submission calls onSubmit with the parsed email, and — on a resolved `true`
  // (success), regardless of whether the email is actually registered — the form then renders the
  // generic, anti-enumeration confirmation copy (never a distinct "email not found" message).
  it("calls onSubmit with the parsed email then renders the generic confirmation on success", async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    const { getByLabelText, getByRole, getByTestId, getByText } = render(
      <RequestPasswordResetForm onSubmit={onSubmit} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByLabelText(es.emailLabel), "ana@example.com");
    fireEvent.press(getByRole("button", { name: es.sendResetCode }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ email: "ana@example.com" }));
    await waitFor(() => {
      expect(getByTestId("request-reset-confirmation")).toBeTruthy();
      expect(getByText(es.requestResetConfirmation)).toBeTruthy();
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

    fireEvent.changeText(getByLabelText(es.emailLabel), "ana@example.com");
    fireEvent.press(getByRole("button", { name: es.sendResetCode }));

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
  // called. signInSchema/requestPasswordResetSchema's own error copy is untouched by this
  // restyle (it lives in src/domain/schemas.ts, out of this task's scope) — still English
  // regardless of locale, same precedent as SignInForm.test.tsx's own validation-error test.
  it("shows an inline validation error and does not call onSubmit for an invalid email", async () => {
    const onSubmit = jest.fn();
    const { getByRole, getByText } = render(<RequestPasswordResetForm onSubmit={onSubmit} onBack={jest.fn()} />);

    fireEvent.press(getByRole("button", { name: es.sendResetCode }));

    await waitFor(() => expect(getByText("Enter a valid email address")).toBeTruthy());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // spec.md US2 AS5: "Back to sign in" is a local UI-state trigger, not a route change — pressing
  // it calls the injected onBack prop directly.
  it("calls onBack when 'Back to sign in' is pressed", () => {
    const onBack = jest.fn();
    const { getByRole } = render(<RequestPasswordResetForm onSubmit={jest.fn()} onBack={onBack} />);

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
        <RequestPasswordResetForm onSubmit={jest.fn()} onBack={jest.fn()} />
      </LocaleProvider>
    );

    // Sanity check: Spanish by default (FR-012), before the switch.
    expect(getByLabelText(es.emailLabel)).toBeTruthy();

    fireEvent.press(getByTestId("switch-to-en"));

    expect(queryByLabelText(es.emailLabel)).toBeNull();
    expect(getByLabelText(en.emailLabel)).toBeTruthy();
    expect(getByText(en.requestResetTitle)).toBeTruthy();
    expect(getByText(en.requestResetSubtitle)).toBeTruthy();
    expect(getByRole("button", { name: en.sendResetCode })).toBeTruthy();
    expect(getByRole("button", { name: en.backToSignIn })).toBeTruthy();
  });
});
