// Covers FR-001 (sign-in reuses the injected SignInWithPassword unchanged), FR-006 (a successful
// sign-in never itself decides/hardcodes a post-login destination), FR-007 (request a
// password-reset code by email, in place on /login), FR-008 (submit the emailed code + a new
// password without ever touching the shared/ambient sign-in path), and FR-009 (cooldown-limited
// resend, exercised via ResetPasswordForm) for src/features/identity/LoginScreen.tsx (T004/T013).
//
// Also covers spec.md's Edge Cases section ("What happens if the reset-code request itself fails
// at the network level ... A distinct, honest network-failure message, same treatment as User
// Story 1's Acceptance Scenario 5") via the T013/T014 review follow-up fix
// (progress/review_005-login.md, Finding 1): handleRequestReset must not advance to
// "reset-with-code" on a network-level failure.
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

// LoginScreen renders the real SignInForm (T003), which renders expo-router's <Link> — mocked
// the same way SignInForm.test.tsx mocks it (no router context available in a bare RNTL render).
// useRouter is also mocked here, as a regression guard: FR-006 requires this screen to call
// neither replace nor push on a successful sign-in, and asserting a mock was never called is
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

// NETWORK_SIGN_IN_ERROR_MESSAGE is a plain string constant, but importing the real
// src/lib/supabase-client.ts module also runs its module-level createClient(...) call, which
// constructs a RealtimeClient requiring a WebSocket constructor Node 20's test environment
// doesn't provide (see that file's own doc comment on this exact issue during `expo export`'s
// static-prerendering step) — mocked the same way src/lib/supabase-client.test.ts mocks
// "@supabase/supabase-js" so only the string constant is exercised here, not a real client.
jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { signInWithPassword: jest.fn() } }),
}));

import { LoginScreen, type RecoverySession } from "./LoginScreen";
import { NETWORK_SIGN_IN_ERROR_MESSAGE } from "@/lib/supabase-client";

function fillAndSubmitSignIn(getByLabelText: any, getByRole: any, email: string, password: string) {
  fireEvent.changeText(getByLabelText("Email"), email);
  fireEvent.changeText(getByLabelText("Password"), password);
  fireEvent.press(getByRole("button", { name: "Sign in" }));
}

// A controllable stand-in for src/lib/supabase-client.ts's createPasswordRecoverySession()
// (T010) — each call produces functions with jest-mock-recorded calls, so the "reset-with-code"
// tests below can assert exactly what was called with what, and the regression-guard test can
// assert the SHARED `signIn` mock recorded none of it.
function makeRecoverySession(overrides: Partial<RecoverySession> = {}): RecoverySession {
  return {
    verifyCode: jest.fn().mockResolvedValue({ error: null }),
    updatePassword: jest.fn().mockResolvedValue({ error: null }),
    discard: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderLoginScreen(overrides: {
  signIn?: jest.Mock;
  requestPasswordReset?: jest.Mock;
  createPasswordRecoverySession?: jest.Mock;
} = {}) {
  const signIn = overrides.signIn ?? jest.fn().mockResolvedValue({ error: null });
  const requestPasswordReset = overrides.requestPasswordReset ?? jest.fn().mockResolvedValue({ error: null });
  const createPasswordRecoverySession =
    overrides.createPasswordRecoverySession ?? jest.fn(() => makeRecoverySession());

  const utils = render(
    <LoginScreen
      signIn={signIn}
      requestPasswordReset={requestPasswordReset}
      createPasswordRecoverySession={createPasswordRecoverySession}
    />
  );

  return { ...utils, signIn, requestPasswordReset, createPasswordRecoverySession };
}

describe("LoginScreen", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // FR-006: a successful sign-in ({ error: null }) replaces SignInForm with the neutral
  // "Signing you in…" view, and calls no navigation function — the existing gate decides where
  // the now-signed-in user goes next, not this screen.
  it("replaces SignInForm with the neutral 'Signing you in…' view on a successful sign-in and navigates nowhere", async () => {
    const { getByLabelText, getByRole, getByTestId, queryByRole, signIn } = renderLoginScreen();

    fillAndSubmitSignIn(getByLabelText, getByRole, "ana@example.com", "supersecret1");

    await waitFor(() => expect(getByTestId("login-signing-in")).toBeTruthy());
    expect(signIn).toHaveBeenCalledWith("ana@example.com", "supersecret1");
    expect(queryByRole("button", { name: "Sign in" })).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  // T017 (Constitution VII, FR-010): the "Signing you in…" view must be announced to assistive
  // tech on its own — it replaces SignInForm's whole view tree with no user-initiated focus
  // change, so it needs accessibilityRole="alert" (a live-region announcement), not a plain,
  // silent "text" role.
  it("exposes the 'Signing you in…' view as an alert so assistive tech announces it", async () => {
    const { getByLabelText, getByRole } = renderLoginScreen();

    fillAndSubmitSignIn(getByLabelText, getByRole, "ana@example.com", "supersecret1");

    await waitFor(() => expect(getByRole("alert", { name: "Signing you in…" })).toBeTruthy());
  });

  // FR-001, FR-004: a credentials rejection (Supabase resolves with a generic error) keeps
  // SignInForm visible with that error rendered inline — the user can correct and retry without
  // losing their place.
  it("keeps SignInForm visible with the serverError rendered on a credentials rejection", async () => {
    const signIn = jest.fn().mockResolvedValue({ error: "Invalid login credentials" });
    const { getByLabelText, getByRole, getByText, getByTestId } = renderLoginScreen({ signIn });

    fillAndSubmitSignIn(getByLabelText, getByRole, "ana@example.com", "wrong-password");

    await waitFor(() => {
      expect(getByTestId("sign-in-form-error")).toBeTruthy();
      expect(getByText("Invalid login credentials")).toBeTruthy();
    });
    expect(getByRole("button", { name: "Sign in" })).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // FR-005: a network-level failure to reach the sign-in service (Supabase's call itself
  // rejected, reused here as NETWORK_SIGN_IN_ERROR_MESSAGE from src/lib/supabase-client.ts) is
  // shown as distinct copy from a credentials rejection, so the user understands the difference
  // between "try again later" and "re-enter your password".
  it("renders a network-failure error distinctly from a credentials error", async () => {
    const signIn = jest.fn().mockResolvedValue({ error: NETWORK_SIGN_IN_ERROR_MESSAGE });
    const { getByLabelText, getByRole, getByText, getByTestId } = renderLoginScreen({ signIn });

    fillAndSubmitSignIn(getByLabelText, getByRole, "ana@example.com", "supersecret1");

    await waitFor(() => {
      expect(getByTestId("sign-in-form-error")).toBeTruthy();
      expect(getByText(NETWORK_SIGN_IN_ERROR_MESSAGE)).toBeTruthy();
    });
    expect(NETWORK_SIGN_IN_ERROR_MESSAGE).not.toBe("Invalid login credentials");
  });

  // tasks.md T013: createPasswordRecoverySession is a FACTORY prop, and must not be called
  // eagerly on mount — only the first time the user presses "Forgot password?". A throwaway
  // Supabase client would be wasted work (and, worse, a signal of the wrong design) if built on
  // every /login mount regardless of whether the user ever uses the forgot-password flow.
  it("does not create a recovery session until 'Forgot password?' is pressed, and creates only one for repeated presses", async () => {
    const { getByRole, createPasswordRecoverySession } = renderLoginScreen();

    expect(createPasswordRecoverySession).not.toHaveBeenCalled();

    fireEvent.press(getByRole("button", { name: "Forgot password?" }));
    await waitFor(() => expect(getByRole("button", { name: "Send reset code" })).toBeTruthy());
    expect(createPasswordRecoverySession).toHaveBeenCalledTimes(1);

    // Backing out and pressing "Forgot password?" again from a fresh sign-in view creates a
    // second, independent recovery session — see the "Back to sign in" test below for the
    // corresponding cleanup assertion this depends on.
    fireEvent.press(getByRole("button", { name: "Back to sign in" }));
    await waitFor(() => expect(getByRole("button", { name: "Forgot password?" })).toBeTruthy());
    fireEvent.press(getByRole("button", { name: "Forgot password?" }));
    await waitFor(() => expect(getByRole("button", { name: "Send reset code" })).toBeTruthy());
    expect(createPasswordRecoverySession).toHaveBeenCalledTimes(2);
  });

  // spec.md US2, full mode sequence: "sign-in" -> "request-reset" -> "reset-with-code" ->
  // "sign-in", carrying the submitted email forward at each step, ending on a confirmation
  // banner with the email pre-filled (spec.md US2 AS3, AS5).
  it("walks the full sign-in -> request-reset -> reset-with-code -> sign-in mode sequence", async () => {
    const recoverySession = makeRecoverySession();
    const createPasswordRecoverySession = jest.fn(() => recoverySession);
    const requestPasswordReset = jest.fn().mockResolvedValue({ error: null });
    const { getByLabelText, getByRole, getByTestId, getByText, queryByTestId } = renderLoginScreen({
      requestPasswordReset,
      createPasswordRecoverySession,
    });

    // "sign-in" -> "request-reset"
    fireEvent.press(getByRole("button", { name: "Forgot password?" }));
    await waitFor(() => expect(getByLabelText("Email")).toBeTruthy());

    // "request-reset" -> "reset-with-code"
    fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
    fireEvent.press(getByRole("button", { name: "Send reset code" }));

    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledWith("ana@example.com"));
    await waitFor(() => expect(getByTestId("reset-password-code-field")).toBeTruthy());
    // The submitted email carried forward as ResetPasswordForm's initialEmail.
    expect(getByLabelText("Email").props.value).toBe("ana@example.com");

    // "reset-with-code" -> "sign-in"
    fireEvent.changeText(getByLabelText("Reset code"), "123456");
    fireEvent.changeText(getByLabelText("New password"), "supersecret2");
    fireEvent.press(getByRole("button", { name: "Set new password" }));

    await waitFor(() => expect(recoverySession.verifyCode).toHaveBeenCalledWith("ana@example.com", "123456"));
    expect(recoverySession.updatePassword).toHaveBeenCalledWith("supersecret2");
    expect(recoverySession.discard).toHaveBeenCalledTimes(1);

    // Back on plain "sign-in", with the confirmation banner and the email pre-filled.
    await waitFor(() => expect(getByTestId("sign-in-confirmation-message")).toBeTruthy());
    expect(getByText("Your password has been updated. Sign in with your new password.")).toBeTruthy();
    expect(getByLabelText("Email").props.value).toBe("ana@example.com");
    expect(queryByTestId("reset-password-code-field")).toBeNull();
  });

  // spec.md Clarifications, Recorded default 2 — THE REGRESSION GUARD THIS TASK EXISTS FOR: the
  // "reset-with-code" step must NEVER touch the shared/ambient `signIn` prop (the one backed, at
  // the real call site app/(auth)/login.tsx, by the shared Supabase client singleton
  // useKycGate() observes). It exercises the exact same sequence as the mode-sequence test above,
  // but the assertion that matters here is that `signIn` recorded zero calls at any point —
  // proving the code-confirmation step genuinely never establishes or touches a session on the
  // shared client, only on the isolated, throwaway `recoverySession` instance.
  it("never calls the shared signIn prop during the reset-with-code submission", async () => {
    const recoverySession = makeRecoverySession();
    const signIn = jest.fn().mockResolvedValue({ error: null });
    const { getByLabelText, getByRole, getByTestId } = renderLoginScreen({
      signIn,
      createPasswordRecoverySession: jest.fn(() => recoverySession),
    });

    fireEvent.press(getByRole("button", { name: "Forgot password?" }));
    await waitFor(() => expect(getByLabelText("Email")).toBeTruthy());
    fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
    fireEvent.press(getByRole("button", { name: "Send reset code" }));

    await waitFor(() => expect(getByTestId("reset-password-code-field")).toBeTruthy());
    fireEvent.changeText(getByLabelText("Reset code"), "123456");
    fireEvent.changeText(getByLabelText("New password"), "supersecret2");
    fireEvent.press(getByRole("button", { name: "Set new password" }));

    await waitFor(() => expect(recoverySession.updatePassword).toHaveBeenCalledWith("supersecret2"));
    expect(signIn).not.toHaveBeenCalled();
  });

  // spec.md Edge Cases (THE FIX THIS TEST GUARDS — progress/review_005-login.md's T013/T014
  // review, Finding 1): when requestPasswordReset resolves with a network-level error, the screen
  // must NOT advance to "reset-with-code" — it must stay on "request-reset" with that error shown
  // inline via RequestPasswordResetForm's serverError prop, exactly the same treatment as User
  // Story 1's Acceptance Scenario 5 (a credentials/network distinction, not an anti-enumeration
  // concern — this never reveals whether the email is registered, only that the request itself
  // never reached the service).
  it("stays on 'request-reset' and shows the error inline when requestPasswordReset resolves with a network-level error", async () => {
    const requestPasswordReset = jest.fn().mockResolvedValue({ error: NETWORK_SIGN_IN_ERROR_MESSAGE });
    const { getByLabelText, getByRole, getByTestId, getByText, queryByTestId } = renderLoginScreen({
      requestPasswordReset,
    });

    fireEvent.press(getByRole("button", { name: "Forgot password?" }));
    await waitFor(() => expect(getByLabelText("Email")).toBeTruthy());
    fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
    fireEvent.press(getByRole("button", { name: "Send reset code" }));

    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledWith("ana@example.com"));
    await waitFor(() => {
      expect(getByTestId("request-reset-form-error")).toBeTruthy();
      expect(getByText(NETWORK_SIGN_IN_ERROR_MESSAGE)).toBeTruthy();
    });
    // Still on "request-reset" — never advanced to "reset-with-code".
    expect(getByRole("button", { name: "Send reset code" })).toBeTruthy();
    expect(queryByTestId("reset-password-code-field")).toBeNull();
    expect(queryByTestId("request-reset-confirmation")).toBeNull();
  });

  // spec.md US2 AS5: "Back to sign in" from the "reset-with-code" view returns to plain sign-in
  // with NO residual reset-flow state — no confirmation banner (none was ever earned, since the
  // user backed out instead of completing the reset) and no stale email pre-filled from the
  // abandoned attempt.
  it("returns to plain sign-in with no residual reset-flow state when 'Back to sign in' is pressed mid-flow", async () => {
    const recoverySession = makeRecoverySession();
    const { getByLabelText, getByRole, getByTestId, queryByTestId } = renderLoginScreen({
      createPasswordRecoverySession: jest.fn(() => recoverySession),
    });

    fireEvent.press(getByRole("button", { name: "Forgot password?" }));
    await waitFor(() => expect(getByLabelText("Email")).toBeTruthy());
    fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
    fireEvent.press(getByRole("button", { name: "Send reset code" }));

    await waitFor(() => expect(getByTestId("reset-password-code-field")).toBeTruthy());
    fireEvent.press(getByRole("button", { name: "Back to sign in" }));

    await waitFor(() => expect(getByRole("button", { name: "Sign in" })).toBeTruthy());
    expect(queryByTestId("sign-in-confirmation-message")).toBeNull();
    expect(getByLabelText("Email").props.value).toBe("");
    expect(recoverySession.discard).toHaveBeenCalledTimes(1);
  });
});
