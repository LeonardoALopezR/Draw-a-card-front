// Covers 005-login FR-001 (the sign-in screen reuses the real signInWithPassword() unchanged,
// via submitSignIn's schema-validated pass-through) and FR-006 (a successful sign-in never
// itself decides/hardcodes a post-login destination — this is the regression guard for the "let
// the existing gate handle it" design established by LoginScreen.tsx, T004: nothing in this
// screen's success path may call router.replace/router.push) for app/(auth)/login.tsx (T005).
//
// T014 additions: the same mode-sequence assertions as LoginScreen.test.tsx (T013), but at the
// real-implementation call boundary — mocking only the underlying "@supabase/supabase-js" module
// (mirroring src/lib/supabase-client.test.ts's own mock factory, T010, so a genuine second,
// throwaway createClient() call for createPasswordRecoverySession() is distinguishable from the
// first, module-level `supabase` singleton call), leaving src/lib/supabase-client.ts,
// src/domain/login.ts, src/domain/passwordReset.ts, and every src/features/identity/*.tsx
// component real and unmocked. This proves the FULL requestPasswordReset/
// createPasswordRecoverySession DI chain (app/(auth)/login.tsx -> src/domain/passwordReset.ts ->
// src/lib/supabase-client.ts -> the SDK) is actually wired, not merely stubbed at some
// intermediate layer.
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

// LoginScreen -> SignInForm renders expo-router's <Link> ("Create account") — mocked the same
// way LoginScreen.test.tsx mocks it (no router context in a bare RNTL render). useRouter's
// replace/push are also mocked here as the regression guard this file exists for: FR-006
// requires this screen's success path to call neither, and asserting a mock was never called is
// only meaningful if the mock exists to observe.
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => {
  const RN = require("react-native");
  return {
    Link: ({ href, children, accessibilityLabel, testID }: Record<string, unknown>) => (
      <RN.Text accessibilityRole="link" accessibilityLabel={accessibilityLabel} href={href} testID={testID}>
        {children as React.ReactNode}
      </RN.Text>
    ),
    useRouter: () => ({ replace: mockReplace, push: mockPush }),
  };
});

// Same self-contained jest.mock() factory pattern as src/lib/supabase-client.test.ts (T010) — see
// that file's own top-of-file comment for why this all has to live INSIDE the factory (Babel's
// import-hoisting makes a module-level `const` referenced from inside the factory read as
// `undefined` at the moment src/lib/supabase-client.ts's own module-level `createClient(...)`
// call runs). The FIRST createClient() call is always the shared `supabase` singleton; every call
// after that is a fresh, throwaway recovery-session client — tracked as distinct auth mock
// objects (recoveryAuthMocks) so the mode-sequence tests below can prove genuine call-target
// isolation, not merely that "some mock" was called.
jest.mock("@supabase/supabase-js", () => {
  const mockSignInWithPassword = jest.fn();
  const mockResetPasswordForEmail = jest.fn();
  const recoveryAuthMocks: { verifyOtp: jest.Mock; updateUser: jest.Mock; signOut: jest.Mock }[] = [];
  let singletonCreated = false;

  const mockCreateClient = jest.fn((..._args: unknown[]) => {
    if (!singletonCreated) {
      singletonCreated = true;
      return {
        auth: {
          signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
          resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
        },
      };
    }

    const authMock = { verifyOtp: jest.fn(), updateUser: jest.fn(), signOut: jest.fn() };
    recoveryAuthMocks.push(authMock);
    return { auth: authMock };
  });

  return {
    createClient: mockCreateClient,
    __supabaseMockState: {
      mockSignInWithPassword,
      mockResetPasswordForEmail,
      recoveryAuthMocks,
    },
  };
});

import LoginRoute from "./login";

const { mockSignInWithPassword, mockResetPasswordForEmail, recoveryAuthMocks } = (
  jest.requireMock("@supabase/supabase-js") as {
    __supabaseMockState: {
      mockSignInWithPassword: jest.Mock;
      mockResetPasswordForEmail: jest.Mock;
      recoveryAuthMocks: { verifyOtp: jest.Mock; updateUser: jest.Mock; signOut: jest.Mock }[];
    };
  }
).__supabaseMockState;

function fillAndSubmitSignIn(getByLabelText: any, getByRole: any, email: string, password: string) {
  fireEvent.changeText(getByLabelText("Email"), email);
  fireEvent.changeText(getByLabelText("Password"), password);
  fireEvent.press(getByRole("button", { name: "Sign in" }));
}

describe("LoginRoute", () => {
  afterEach(() => {
    jest.clearAllMocks();
    recoveryAuthMocks.length = 0;
  });

  // FR-001, FR-006: a successful submission reaches the real signInWithPassword with the exact
  // submitted email/password (proving the full submitSignIn -> signInWithPassword DI chain is
  // wired, not stubbed out) and — the regression guard this task exists for — never calls
  // router.replace/router.push. The existing gate (useKycGate(), mounted elsewhere in the app,
  // not exercised by this screen-only render) is solely responsible for post-sign-in navigation.
  it("calls the real signInWithPassword with the exact submitted email/password and never navigates", async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });

    const { getByLabelText, getByRole, getByTestId } = render(<LoginRoute />);
    fillAndSubmitSignIn(getByLabelText, getByRole, "ana@example.com", "supersecret1");

    await waitFor(() => expect(getByTestId("login-signing-in")).toBeTruthy());
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "ana@example.com",
      password: "supersecret1",
    });
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  // FR-001, FR-004: an SDK-rejected submission (Supabase resolves with an auth-level error) is
  // mapped and surfaced inline on the sign-in form, not thrown/uncaught, and does not navigate.
  it("surfaces an SDK-rejected submission's mapped error inline", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {},
      error: { message: "Invalid login credentials" },
    });

    const { getByLabelText, getByRole, getByText, getByTestId } = render(<LoginRoute />);
    fillAndSubmitSignIn(getByLabelText, getByRole, "ana@example.com", "wrong-password");

    await waitFor(() => {
      expect(getByTestId("sign-in-form-error")).toBeTruthy();
      expect(getByText("Invalid login credentials")).toBeTruthy();
    });
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  // 005-login T014, FR-007/FR-008: the full "sign-in" -> "request-reset" -> "reset-with-code" ->
  // "sign-in" mode sequence at the real-implementation call boundary — proving
  // requestPasswordReset() and createPasswordRecoverySession() (src/lib/supabase-client.ts, T010)
  // are genuinely wired into LoginScreen's props via src/domain/passwordReset.ts, not stubbed.
  it("walks the full sign-in -> request-reset -> reset-with-code -> sign-in sequence via the real DI chain", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const { getByLabelText, getByRole, getByTestId, getByText, queryByTestId } = render(<LoginRoute />);

    fireEvent.press(getByRole("button", { name: "Forgot password?" }));
    await waitFor(() => expect(getByLabelText("Email")).toBeTruthy());

    fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
    fireEvent.press(getByRole("button", { name: "Send reset code" }));

    await waitFor(() => expect(mockResetPasswordForEmail).toHaveBeenCalledWith("ana@example.com"));
    await waitFor(() => expect(getByTestId("reset-password-code-field")).toBeTruthy());
    expect(getByLabelText("Email").props.value).toBe("ana@example.com");

    const recoveryAuthMock = recoveryAuthMocks[recoveryAuthMocks.length - 1];
    recoveryAuthMock.verifyOtp.mockResolvedValue({ data: {}, error: null });
    recoveryAuthMock.updateUser.mockResolvedValue({ data: {}, error: null });
    recoveryAuthMock.signOut.mockResolvedValue({ error: null });

    fireEvent.changeText(getByLabelText("Reset code"), "123456");
    fireEvent.changeText(getByLabelText("New password"), "supersecret2");
    fireEvent.press(getByRole("button", { name: "Set new password" }));

    await waitFor(() =>
      expect(recoveryAuthMock.verifyOtp).toHaveBeenCalledWith({
        email: "ana@example.com",
        token: "123456",
        type: "recovery",
      })
    );
    expect(recoveryAuthMock.updateUser).toHaveBeenCalledWith({ password: "supersecret2" });
    await waitFor(() => expect(recoveryAuthMock.signOut).toHaveBeenCalledTimes(1));

    await waitFor(() => expect(getByTestId("sign-in-confirmation-message")).toBeTruthy());
    expect(getByText("Your password has been updated. Sign in with your new password.")).toBeTruthy();
    expect(getByLabelText("Email").props.value).toBe("ana@example.com");
    expect(queryByTestId("reset-password-code-field")).toBeNull();
  });

  // spec.md Clarifications, Recorded default 2 — THE REGRESSION GUARD THIS TASK EXISTS FOR, at
  // the real-implementation call boundary: the reset-with-code step must never touch the shared
  // `supabase` singleton's own mocked auth methods (mockSignInWithPassword,
  // mockResetPasswordForEmail-beyond-the-initial-request), only the distinct, throwaway
  // recovery-session client's auth mock — proving the real createPasswordRecoverySession()
  // (T010) is what's actually driving this step, not the shared client useKycGate() observes.
  it("never touches the shared singleton's signInWithPassword mock during the reset-with-code step", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const { getByLabelText, getByRole, getByTestId } = render(<LoginRoute />);

    fireEvent.press(getByRole("button", { name: "Forgot password?" }));
    await waitFor(() => expect(getByLabelText("Email")).toBeTruthy());
    fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
    fireEvent.press(getByRole("button", { name: "Send reset code" }));

    await waitFor(() => expect(getByTestId("reset-password-code-field")).toBeTruthy());
    const recoveryAuthMock = recoveryAuthMocks[recoveryAuthMocks.length - 1];
    recoveryAuthMock.verifyOtp.mockResolvedValue({ data: {}, error: null });
    recoveryAuthMock.updateUser.mockResolvedValue({ data: {}, error: null });
    recoveryAuthMock.signOut.mockResolvedValue({ error: null });

    fireEvent.changeText(getByLabelText("Reset code"), "123456");
    fireEvent.changeText(getByLabelText("New password"), "supersecret2");
    fireEvent.press(getByRole("button", { name: "Set new password" }));

    await waitFor(() => expect(recoveryAuthMock.updateUser).toHaveBeenCalledWith({ password: "supersecret2" }));
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });
});
