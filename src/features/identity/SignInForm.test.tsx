// Covers FR-001 (email+password sign-in fields, React Hook Form + zodResolver(signInSchema)),
// FR-003 ("Create account" link resolves to /register), FR-004 (a serverError renders as ONE
// general inline error, never a per-field one — Supabase never distinguishes wrong-password
// from unregistered-email), and FR-010 (every interactive element has a real accessibility
// label/role) for src/features/identity/SignInForm.tsx (T003).
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

// expo-router's real <Link> depends on router context (useExpoRouter()) that isn't present in a
// bare RNTL render — mocked the same way every app/(auth)/*.test.tsx already mocks expo-router's
// useRouter, rather than wrapping every test in a full NavigationContainer. Rendered as a real
// accessibility "link"-role Text (matching what the real <Link> resolves to, T031/plan.md's
// "First use of expo-router's <Link>" Research Decision) with the resolved `href` exposed as a
// prop, so the "Create account" test below can assert on it directly.
jest.mock("expo-router", () => {
  const RN = require("react-native");
  return {
    Link: ({ href, children, accessibilityLabel, testID }: Record<string, unknown>) => (
      <RN.Text accessibilityRole="link" accessibilityLabel={accessibilityLabel} href={href} testID={testID}>
        {children as React.ReactNode}
      </RN.Text>
    ),
  };
});

import { SignInForm } from "./SignInForm";

describe("SignInForm", () => {
  // FR-001: a fully valid submission calls onSubmit with the exact typed SignInInput payload —
  // no transformation happens in the component.
  it("calls onSubmit with the parsed email/password on a successful submit", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole } = render(
      <SignInForm onSubmit={onSubmit} onForgotPassword={jest.fn()} />
    );

    fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
    fireEvent.changeText(getByLabelText("Password"), "supersecret1");

    fireEvent.press(getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ email: "ana@example.com", password: "supersecret1" })
    );
  });

  // FR-001, SC-002: missing/invalid fields show signInSchema's inline error text and never call
  // onSubmit.
  it("shows inline validation-error text for missing fields and does not call onSubmit", async () => {
    const onSubmit = jest.fn();
    const { getByText, getByRole } = render(<SignInForm onSubmit={onSubmit} onForgotPassword={jest.fn()} />);

    fireEvent.press(getByRole("button", { name: "Sign in" }));

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
  it("calls onForgotPassword when 'Forgot password?' is pressed", () => {
    const onForgotPassword = jest.fn();
    const { getByRole } = render(<SignInForm onSubmit={jest.fn()} onForgotPassword={onForgotPassword} />);

    fireEvent.press(getByRole("button", { name: "Forgot password?" }));

    expect(onForgotPassword).toHaveBeenCalledTimes(1);
  });

  // FR-003: the "Create account" link's resolved href is exactly /register — the one deliberate
  // way a visitor without an account reaches 001-registration-kyc's existing registration form
  // from this new default landing screen.
  it("resolves the 'Create account' link's href to exactly /register", () => {
    const { getByRole } = render(<SignInForm onSubmit={jest.fn()} onForgotPassword={jest.fn()} />);

    const link = getByRole("link", { name: "Create account" });
    expect(link.props.href).toBe("/register");
  });

  // 005-login T013, spec.md US2 AS3: a confirmationMessage (carried forward by LoginScreen after
  // a successful password reset) renders distinctly from serverError, never both channels
  // conflated into one.
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

    const emailInput = getByLabelText("Email");
    expect(emailInput.props.value).toBe("ana@example.com");
    fireEvent.changeText(emailInput, "someone-else@example.com");
    expect(emailInput.props.value).toBe("someone-else@example.com");
  });
});
