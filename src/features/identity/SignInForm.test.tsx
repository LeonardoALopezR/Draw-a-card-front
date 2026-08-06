// Covers FR-001 (email+password sign-in fields, React Hook Form + zodResolver(signInSchema)),
// FR-003 ("Create account" link resolves to /register), FR-004 (a serverError renders as ONE
// general inline error, never a per-field one — Supabase never distinguishes wrong-password
// from unregistered-email), and FR-010 (every interactive element has a real accessibility
// label/role) for src/features/identity/SignInForm.tsx (T003).
//
// T029 (006-visual-identity, FR-010, spec.md US2 AS3/AS6): every query below now targets the
// default-locale (Spanish, FR-012) copy loginCopy.es exposes — SignInForm renders through
// useTranslation(loginCopy) as of T028, and useLocale() resolves to DEFAULT_LOCALE ("es") when
// no <LocaleProvider> wraps a render, exactly like every other bare-render test in this repo
// (src/features/i18n/LocaleContext.test.tsx's own "falls back to the default locale" test).
// Queries read the literal strings from loginCopy.es/loginCopy.en directly (never a duplicated
// hardcoded string) so this file can never silently drift from the real dictionary. Adds:
// legal-line rendering (FR-010, spec.md US2 AS1/AS3), the right-aligned forgot-password link's
// documented body.link role, and an English-locale rendering pass (spec.md US4 AS1/US2 AS3).
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { loginCopy } from "@/domain/i18n/copy/login";
import { LocaleProvider, useLocale } from "@/features/i18n/LocaleContext";
import { colors } from "@/theme";

// expo-router's real <Link> depends on router context (useExpoRouter()) that isn't present in a
// bare RNTL render — mocked the same way every app/(auth)/*.test.tsx already mocks expo-router's
// useRouter, rather than wrapping every test in a full NavigationContainer. Rendered as a real
// accessibility "link"-role Text (matching what the real <Link> resolves to, T031/plan.md's
// "First use of expo-router's <Link>" Research Decision) with the resolved `href` exposed as a
// prop, so the "Create account" test below can assert on it directly.
jest.mock("expo-router", () => {
  const RN = require("react-native");
  return {
    Link: ({ href, children, accessibilityLabel, testID, style }: Record<string, unknown>) => (
      <RN.Text
        accessibilityRole="link"
        accessibilityLabel={accessibilityLabel}
        href={href}
        testID={testID}
        style={style}
      >
        {children as React.ReactNode}
      </RN.Text>
    ),
  };
});

import { SignInForm } from "./SignInForm";

const es = loginCopy.es;
const en = loginCopy.en;

// Reuses the exact test-only "flip the locale" trigger pattern already established by
// src/features/i18n/LocaleContext.test.tsx, so the "renders in English" test below exercises the
// real useLocale()/setLocale() seam rather than a second, parallel test-only mechanism.
function LocaleSwitchTrigger() {
  const { setLocale } = useLocale();
  return (
    <Pressable testID="switch-to-en" onPress={() => setLocale("en")} accessibilityRole="button">
      <Text>switch</Text>
    </Pressable>
  );
}

describe("SignInForm", () => {
  // FR-001: a fully valid submission calls onSubmit with the exact typed SignInInput payload —
  // no transformation happens in the component.
  it("calls onSubmit with the parsed email/password on a successful submit", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole } = render(
      <SignInForm onSubmit={onSubmit} onForgotPassword={jest.fn()} />
    );

    fireEvent.changeText(getByLabelText(es.emailLabel), "ana@example.com");
    fireEvent.changeText(getByLabelText(es.passwordLabel), "supersecret1");

    fireEvent.press(getByRole("button", { name: es.signInButton }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ email: "ana@example.com", password: "supersecret1" })
    );
  });

  // FR-001, SC-002: missing/invalid fields show signInSchema's inline error text and never call
  // onSubmit. signInSchema's own error copy is untouched by this restyle (it lives in
  // src/domain/schemas.ts, out of this task's scope) — still English regardless of locale.
  it("shows inline validation-error text for missing fields and does not call onSubmit", async () => {
    const onSubmit = jest.fn();
    const { getByText, getByRole } = render(<SignInForm onSubmit={onSubmit} onForgotPassword={jest.fn()} />);

    fireEvent.press(getByRole("button", { name: es.signInButton }));

    await waitFor(() => {
      expect(getByText("Enter a valid email address")).toBeTruthy();
      expect(getByText("Enter your password")).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // FR-004: a serverError (as produced by a Supabase credentials rejection) renders as ONE
  // general inline error banner — never attributed to the email or password field individually,
  // unlike RegistrationForm's field-specific EmailTaken/UsernameTaken case.
  it("renders a serverError as a general inline error, not a per-field one", async () => {
    const onSubmit = jest.fn();
    const { getByTestId, getByText, queryByTestId } = render(
      <SignInForm onSubmit={onSubmit} onForgotPassword={jest.fn()} serverError="Invalid email or password" />
    );

    await waitFor(() => {
      expect(getByTestId("sign-in-form-error")).toBeTruthy();
      expect(getByText("Invalid email or password")).toBeTruthy();
    });
    // No client-side field error text was ever triggered (the form was never submitted here),
    // confirming the message rendered through the general-error slot, not react-hook-form's
    // per-field setError path.
    expect(queryByTestId("sign-in-email-field")).not.toHaveTextContent("Invalid email or password");
    expect(queryByTestId("sign-in-password-field")).not.toHaveTextContent("Invalid email or password");
  });

  // spec.md Clarifications, Recorded default 2: "Forgot password?" is a local UI-state trigger,
  // not a route change — pressing it calls the injected onForgotPassword prop directly.
  it("calls onForgotPassword when the forgot-password link is pressed", () => {
    const onForgotPassword = jest.fn();
    const { getByRole } = render(<SignInForm onSubmit={jest.fn()} onForgotPassword={onForgotPassword} />);

    fireEvent.press(getByRole("button", { name: es.forgotPassword }));

    expect(onForgotPassword).toHaveBeenCalledTimes(1);
  });

  // spec.md US2 AS1/brief §4 item 6: the forgot-password link carries typography.body.link's
  // documented role (color/size) and sits right-aligned (alignSelf: "flex-end"), not the
  // left-aligned treatment 005-login originally shipped.
  it("renders the forgot-password link right-aligned with the documented body.link styling", () => {
    const { getByTestId } = render(<SignInForm onSubmit={jest.fn()} onForgotPassword={jest.fn()} />);

    const button = getByTestId("sign-in-forgot-password-button");
    const flattenedButtonStyle = Object.assign({}, ...[button.props.style].flat());
    expect(flattenedButtonStyle.alignSelf).toBe("flex-end");

    const label = button.findByType(Text);
    const flattenedLabelStyle = Object.assign({}, ...[label.props.style].flat());
    expect(flattenedLabelStyle.color).toBe(colors.text.link);
  });

  // FR-003: the "Create account" link's resolved href is exactly /register — the one deliberate
  // way a visitor without an account reaches 001-registration-kyc's existing registration form
  // from this new default landing screen.
  it("resolves the 'Create account' link's href to exactly /register", () => {
    const { getByRole } = render(<SignInForm onSubmit={jest.fn()} onForgotPassword={jest.fn()} />);

    const link = getByRole("link", { name: es.createAccount });
    expect(link.props.href).toBe("/register");
  });

  // spec.md US2 AS1, brief §4 item 10: the legal line renders both link phrases as distinct,
  // separately-colored spans (typography.ts's documented nested-<Text> convention), never as one
  // flat, unstyled sentence.
  it("renders the legal line with both link phrases in text.link color", () => {
    const { getByText } = render(<SignInForm onSubmit={jest.fn()} onForgotPassword={jest.fn()} />);

    const termsLink = getByText(es.termsLink);
    const privacyLink = getByText(es.privacyLink);

    const flattenedTermsStyle = Object.assign({}, ...[termsLink.props.style].flat());
    const flattenedPrivacyStyle = Object.assign({}, ...[privacyLink.props.style].flat());
    expect(flattenedTermsStyle.color).toBe(colors.text.link);
    expect(flattenedPrivacyStyle.color).toBe(colors.text.link);
  });

  // 005-login T013, spec.md US2 AS3: a confirmationMessage (carried forward by LoginScreen after
  // a successful password reset) renders distinctly from serverError, never both channels
  // conflated into one. This is a plain pass-through prop, never translated by this component.
  it("renders a confirmationMessage as a distinct banner from serverError", () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <SignInForm
        onSubmit={jest.fn()}
        onForgotPassword={jest.fn()}
        confirmationMessage="Your password has been updated. Sign in with your new password."
      />
    );

    expect(getByTestId("sign-in-confirmation-message")).toBeTruthy();
    expect(getByText("Your password has been updated. Sign in with your new password.")).toBeTruthy();
    expect(queryByTestId("sign-in-form-error")).toBeNull();
  });

  // 005-login T013, spec.md US2 AS5: initialEmail pre-fills the email field as a convenience
  // (carried forward from a just-completed password reset) without locking it — the field
  // remains editable.
  it("pre-fills the email field from initialEmail without locking it", () => {
    const { getByLabelText } = render(
      <SignInForm onSubmit={jest.fn()} onForgotPassword={jest.fn()} initialEmail="ana@example.com" />
    );

    const emailInput = getByLabelText(es.emailLabel);
    expect(emailInput.props.value).toBe("ana@example.com");
    fireEvent.changeText(emailInput, "someone-else@example.com");
    expect(emailInput.props.value).toBe("someone-else@example.com");
  });

  // spec.md US4 AS1/US2 AS3: switching the locale context to "en" (the exact seam
  // 007-localization's future picker calls) re-renders this form's every string in English —
  // zero copy hardcoded in this file, all of it routed through useTranslation(loginCopy).
  it("renders the English equivalents when the locale context is set to 'en'", async () => {
    const { getByTestId, getByRole, queryByLabelText, getByLabelText, getByText } = render(
      <LocaleProvider>
        <LocaleSwitchTrigger />
        <SignInForm onSubmit={jest.fn()} onForgotPassword={jest.fn()} />
      </LocaleProvider>
    );

    // Sanity check: Spanish by default (FR-012), before the switch.
    expect(getByLabelText(es.emailLabel)).toBeTruthy();

    fireEvent.press(getByTestId("switch-to-en"));

    expect(queryByLabelText(es.emailLabel)).toBeNull();
    expect(getByLabelText(en.emailLabel)).toBeTruthy();
    expect(getByLabelText(en.passwordLabel)).toBeTruthy();
    expect(getByRole("button", { name: en.forgotPassword })).toBeTruthy();
    expect(getByRole("button", { name: en.signInButton })).toBeTruthy();
    expect(getByRole("link", { name: en.createAccount })).toBeTruthy();
    expect(getByText(en.termsLink)).toBeTruthy();
    expect(getByText(en.privacyLink)).toBeTruthy();
  });
});
