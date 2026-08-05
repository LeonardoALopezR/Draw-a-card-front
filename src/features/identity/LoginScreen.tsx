// T004/T013 (FR-001, FR-006, FR-007, FR-008, FR-009): composes SignInForm (T003),
// RequestPasswordResetForm (T011), and ResetPasswordForm (T012) into the /login screen's real
// behavior via a local `mode` state ("sign-in" | "request-reset" | "reset-with-code") — the
// entire forgot-password sub-flow stays on THIS screen as local view-state, never a route change
// (spec.md Clarifications, Recorded default 2).
//
// Critical constraint (spec.md FR-006, plan.md's "Post-sign-in navigation" Research Decision):
// this component NEVER calls useRouter()/navigates on a successful sign-in. It only sets a local
// `signInSucceeded` flag and renders a neutral "Signing you in…" view in place of SignInForm —
// the existing, unmodified useKycGate()/resolveKycRoute() mechanism (mounted at the root layout,
// app/_layout.tsx) independently observes the new Supabase session and takes over navigation on
// its own. Hardcoding a destination here would duplicate a decision that already belongs
// entirely to resolveKycRoute(), risking drift from the gate's own logic.
//
// T013's other critical constraint (spec.md Clarifications, Recorded default 2 — the REGRESSION
// GUARD this task exists for): the "reset-with-code" step must NEVER touch the shared/ambient
// `signIn` prop (or, transitively, the shared Supabase client it's backed by at the real call
// site, app/(auth)/login.tsx, T014) — see submitNewPassword's DI shape below (only
// verifyCode/updatePassword/discard, obtained from the LAZILY created `recoverySession`, ever
// participate in that step). LoginScreen.test.tsx asserts this explicitly.
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { SignInWithPassword } from "@/domain/login";
import type {
  DiscardRecoverySession,
  RequestPasswordReset,
  UpdateRecoveryPassword,
  VerifyRecoveryCode,
} from "@/domain/passwordReset";
import { submitNewPassword } from "@/domain/passwordReset";
import type { RequestResetInput, ResetWithCodeInput, SignInInput } from "@/domain/schemas";

import { RequestPasswordResetForm } from "./RequestPasswordResetForm";
import { ResetPasswordForm, type ResetPasswordFieldError } from "./ResetPasswordForm";
import { SignInForm } from "./SignInForm";

export type LoginScreenMode = "sign-in" | "request-reset" | "reset-with-code";

// The bundle of throwaway-Supabase-client-backed functions createPasswordRecoverySession()
// (src/lib/supabase-client.ts, T010) returns — named here so this file, app/(auth)/login.tsx
// (T014), and their tests all reference the same shape rather than an inline object type repeated
// in three places.
export interface RecoverySession {
  verifyCode: VerifyRecoveryCode;
  updatePassword: UpdateRecoveryPassword;
  discard: DiscardRecoverySession;
}

// spec.md US2 AS3: shown once on the plain sign-in view immediately after a successful password
// reset, via SignInForm's confirmationMessage prop.
export const PASSWORD_RESET_SUCCESS_MESSAGE = "Your password has been updated. Sign in with your new password.";

export interface LoginScreenProps {
  // The real implementations (src/lib/supabase-client.ts's signInWithPassword/
  // requestPasswordReset/createPasswordRecoverySession) are wired in at the screen call site
  // (app/(auth)/login.tsx, T005/T014) — this component only calls whatever it's given, mirroring
  // RegistrationForm's/register.tsx's existing SignInWithPassword DI seam.
  signIn: SignInWithPassword;
  // FR-007: requests a reset code by email — the raw, injected primitive (same shape as `signIn`
  // above), NOT src/domain/passwordReset.ts's requestPasswordReset() orchestration function
  // directly; that schema-validation wrapping is embedded in this prop's real implementation at
  // the screen call site (T014), exactly mirroring how `signIn` above already embeds
  // src/domain/login.ts's submitSignIn.
  requestPasswordReset: RequestPasswordReset;
  // FR-008: a FACTORY, not a value — called at most once per "Forgot password?" press (see
  // handleForgotPassword below), never eagerly on mount. The real implementation
  // (src/lib/supabase-client.ts's createPasswordRecoverySession, T010) builds a fresh, throwaway,
  // non-shared Supabase client instance each time it's called — the whole reason this is a
  // factory prop, not the three functions passed down directly.
  createPasswordRecoverySession: () => RecoverySession;
}

export function LoginScreen({ signIn, requestPasswordReset, createPasswordRecoverySession }: LoginScreenProps) {
  const [mode, setMode] = useState<LoginScreenMode>("sign-in");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>();
  const [signInSucceeded, setSignInSucceeded] = useState(false);

  // Carried forward across a successful password reset (spec.md US2 AS3) — cleared the moment a
  // fresh "Forgot password?" attempt starts (handleForgotPassword below), so a stale confirmation
  // from an earlier, unrelated reset never bleeds into a later sign-in attempt.
  const [signInConfirmationMessage, setSignInConfirmationMessage] = useState<string | undefined>();
  const [prefillEmail, setPrefillEmail] = useState<string | undefined>();

  const [isRequestingReset, setIsRequestingReset] = useState(false);
  // A network-level failure to even reach the reset-code request (spec.md Edge Cases: "the
  // reset-code request itself fails at the network level"). Deliberately distinct from
  // resetServerError below (which belongs to the LATER "reset-with-code" step's code-rejection
  // case) — this one keeps `mode === "request-reset"` and is rendered by
  // RequestPasswordResetForm's own `serverError` prop instead of transitioning to
  // "reset-with-code" (the bug this state exists to fix — see handleRequestReset below).
  const [resetRequestServerError, setResetRequestServerError] = useState<string | undefined>();

  // "reset-with-code" view state. recoverySession is created LAZILY — via the functional updater
  // in handleForgotPassword below (`current ?? createPasswordRecoverySession()`), the first time
  // the user presses "Forgot password?" — never eagerly on every /login mount (tasks.md T013).
  // Reset to null by resetFlowState() below on every "Back to sign in" press AND on a successful
  // completion, so a later attempt always gets a genuinely fresh throwaway client instance rather
  // than reusing state from a prior attempt.
  const [recoverySession, setRecoverySession] = useState<RecoverySession | null>(null);
  const [resetEmail, setResetEmail] = useState<string | undefined>();
  const [resetServerError, setResetServerError] = useState<ResetPasswordFieldError | undefined>();
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleSubmit(input: SignInInput) {
    setServerError(undefined);
    setIsSubmitting(true);
    try {
      const { error } = await signIn(input.email, input.password);
      if (error) {
        setServerError(error);
        return;
      }
      // FR-006: see this file's top comment — no navigation call anywhere in this branch.
      setSignInSucceeded(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  // spec.md Clarifications, Recorded default 2: builds the throwaway recovery-session client
  // lazily, exactly once per attempt — a second press while one already exists (e.g. the user
  // backed out and pressed "Forgot password?" again, or double-taps) reuses the existing instance
  // rather than leaking a second one, since setRecoverySession's functional updater only creates a
  // new one when the current value is null (which resetFlowState() guarantees after any exit from
  // this sub-flow).
  function handleForgotPassword() {
    setServerError(undefined);
    setSignInConfirmationMessage(undefined);
    setResetRequestServerError(undefined);
    setRecoverySession((current) => current ?? createPasswordRecoverySession());
    setMode("request-reset");
  }

  // FR-007, spec.md Edge Cases: requests a reset code, then switches to "reset-with-code",
  // carrying the submitted email forward as ResetPasswordForm's initialEmail — but ONLY on
  // success. Anti-enumeration (FR-007) is still fully preserved: requestPasswordReset (T009/T010)
  // never distinguishes "email exists" from "email doesn't exist" in its own resolved value —
  // Supabase's resetPasswordForEmail() always succeeds from the caller's point of view regardless
  // of registration status (Clarifications, Recorded default 1). The branch below reacts only to a
  // genuine NETWORK-LEVEL failure (src/lib/supabase-client.ts's MUST-NEVER-THROW wrapper catching
  // an unreachable-host/timeout, never an "unregistered email" case) — spec.md's Edge Cases section
  // explicitly requires this be surfaced as "a distinct, honest network-failure message, same
  // treatment as User Story 1's Acceptance Scenario 5" rather than silently advancing to
  // "reset-with-code" as if a code had actually been sent (the bug this branch fixes — see
  // progress/review_005-login.md's T013/T014 review, Finding 1). Returns a boolean so
  // RequestPasswordResetForm (T011) knows whether to show its own local confirmation.
  async function handleRequestReset(input: RequestResetInput): Promise<boolean> {
    setResetRequestServerError(undefined);
    setIsRequestingReset(true);
    try {
      const { error } = await requestPasswordReset(input.email);
      if (error) {
        setResetRequestServerError(error);
        return false;
      }
      setResetEmail(input.email);
      setMode("reset-with-code");
      return true;
    } finally {
      setIsRequestingReset(false);
    }
  }

  // FR-009: cooldown-limited resend, mirroring VerifyPhoneScreen's resend pattern — re-issues a
  // reset-code request for the same email already carried into this step.
  async function handleResend() {
    if (!resetEmail) {
      return;
    }
    setIsResending(true);
    try {
      await requestPasswordReset(resetEmail);
    } finally {
      setIsResending(false);
    }
  }

  // FR-008: the REGRESSION-GUARD-RELEVANT step — orchestrates verifyCode/updatePassword/discard
  // via src/domain/passwordReset.ts's submitNewPassword, using ONLY the lazily created
  // `recoverySession`'s three functions (bound to the throwaway, non-shared Supabase client
  // instance, src/lib/supabase-client.ts's createPasswordRecoverySession, T010). Nothing in this
  // function ever calls `signIn` or any shared/ambient-client-backed prop — see this file's top
  // comment and LoginScreen.test.tsx's regression-guard assertion.
  async function handleResetSubmit(input: ResetWithCodeInput) {
    if (!recoverySession) {
      // Unreachable in practice: "reset-with-code" mode is only entered via handleRequestReset,
      // which is only reachable after handleForgotPassword has already populated recoverySession.
      // Guarded defensively rather than asserted, since a null check costs nothing here.
      return;
    }
    setResetServerError(undefined);
    setIsResetSubmitting(true);
    try {
      const { error } = await submitNewPassword(recoverySession, input);
      if (error) {
        // T012's own doc comment: submitNewPassword returns a plain { error } with no field
        // attribution of its own; LoginScreen is the caller that knows a rejection at this step
        // belongs on the "code" field (a client-side-invalid password never reaches this call at
        // all, since ResetPasswordForm already validates it via resetPasswordWithCodeSchema
        // before onSubmit fires).
        setResetServerError({ field: "code", message: error });
        return;
      }
      setPrefillEmail(input.email);
      setSignInConfirmationMessage(PASSWORD_RESET_SUCCESS_MESSAGE);
      resetFlowState();
      setMode("sign-in");
    } finally {
      setIsResetSubmitting(false);
    }
  }

  // spec.md US2 AS5: every "Back to sign in" press (from either forgot-password view) returns to
  // plain sign-in with NO residual reset-flow state — not just the visible `mode`, but the lazily
  // created recovery-session functions/state too, so a later "Forgot password?" press always
  // starts a genuinely fresh attempt rather than resuming a stale, possibly-abandoned one.
  // discard() (src/lib/supabase-client.ts, T010) is MUST-NEVER-THROW and already swallows its own
  // errors internally — calling it unconditionally here is safe cleanup hygiene even when no
  // verifyCode call ever succeeded on this session (a no-op signOut() in that case).
  function handleBackToSignIn() {
    void recoverySession?.discard();
    resetFlowState();
    setMode("sign-in");
  }

  // Shared by both exit paths from the forgot-password sub-flow (a cancel via "Back to sign in"
  // AND a successful completion) — see both call sites' comments above for why each needs this.
  function resetFlowState() {
    setRecoverySession(null);
    setResetEmail(undefined);
    setResetServerError(undefined);
    setResetRequestServerError(undefined);
    setIsResetSubmitting(false);
    setIsResending(false);
    setIsRequestingReset(false);
  }

  if (signInSucceeded) {
    return (
      <View style={styles.screen}>
        {/* T017 (Constitution VII): accessibilityRole="alert" (not "text") so VoiceOver/TalkBack
            and web screen readers announce this transition on their own — this view mounts in
            place of SignInForm with no user-initiated focus change, mirroring the same
            role="alert" convention this feature already uses for its other transitional
            confirmation banners (SignInForm's confirmationMessage/serverError). */}
        <Text style={styles.signingInText} accessibilityRole="alert" testID="login-signing-in">
          Signing you in…
        </Text>
      </View>
    );
  }

  if (mode === "request-reset") {
    return (
      <View style={styles.screen}>
        <RequestPasswordResetForm
          onSubmit={handleRequestReset}
          onBack={handleBackToSignIn}
          isSubmitting={isRequestingReset}
          serverError={resetRequestServerError}
        />
      </View>
    );
  }

  if (mode === "reset-with-code") {
    return (
      <View style={styles.screen}>
        <ResetPasswordForm
          onSubmit={handleResetSubmit}
          onResend={handleResend}
          onBack={handleBackToSignIn}
          initialEmail={resetEmail}
          isSubmitting={isResetSubmitting}
          isResending={isResending}
          serverError={resetServerError}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SignInForm
        onSubmit={handleSubmit}
        onForgotPassword={handleForgotPassword}
        isSubmitting={isSubmitting}
        serverError={serverError}
        confirmationMessage={signInConfirmationMessage}
        initialEmail={prefillEmail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  signingInText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
});
