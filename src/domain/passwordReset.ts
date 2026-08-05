// 005-login FR-007, FR-008: pure TypeScript, no React/React Native imports (Constitution
// Principle IV) — thin orchestration around the four throwaway-Supabase-client-backed
// primitives (src/lib/supabase-client.ts's requestPasswordReset/createPasswordRecoverySession,
// T010, not yet wired here) via dependency injection, mirroring login.ts's submitSignIn/
// registration.ts's SignInWithPassword DI shape exactly. See spec.md Clarifications, Recorded
// default 2, for why the code-confirmation step (verifyCode/updatePassword/discard) is deliberately
// split across an isolated, non-shared/throwaway Supabase client instance rather than the app's
// shared singleton — this file has no awareness of which client instance backs the functions it
// is handed, that separation is entirely src/lib/supabase-client.ts's (T010) responsibility.
import {
  requestPasswordResetSchema,
  resetPasswordWithCodeSchema,
  type RequestResetInput,
  type ResetWithCodeInput,
} from "./schemas";

// FR-007: requests a reset code by email. Same `{ error: string | null }`-shaped, never-throw
// contract as registration.ts's SignInWithPassword — the real implementation
// (src/lib/supabase-client.ts's requestPasswordReset, T010) wraps
// supabase.auth.resetPasswordForEmail(email) with the same MUST-NEVER-THROW try/catch shape as
// signInWithPassword.
export type RequestPasswordReset = (email: string) => Promise<{ error: string | null }>;

// FR-008: verifies the emailed code against a specific email, on the throwaway recovery-session
// client (never the shared singleton — see this file's file-level comment). Same
// `{ error: string | null }` contract.
export type VerifyRecoveryCode = (email: string, code: string) => Promise<{ error: string | null }>;

// FR-008: sets a new password, valid only after VerifyRecoveryCode has succeeded on the same
// throwaway client instance. Same `{ error: string | null }` contract.
export type UpdateRecoveryPassword = (newPassword: string) => Promise<{ error: string | null }>;

// FR-008: discards the throwaway recovery-session client's in-memory session (a no-op on the
// shared singleton, since this client was never that one — see spec.md Clarifications, Recorded
// default 2). Nothing to report on either success or failure, unlike the other three DI types —
// this is cleanup, not an operation whose outcome a caller needs to branch on.
export type DiscardRecoverySession = () => Promise<void>;

// FR-007: parses the request-a-reset-code form input against requestPasswordResetSchema, then
// calls the injected `request` with the parsed (not raw) email, returning its result unchanged.
// Mirrors login.ts's submitSignIn exactly — no try/catch of its own, since `request` itself
// never throws (see RequestPasswordReset's doc comment) and there is nothing else here that
// could reject once requestPasswordResetSchema.parse has succeeded.
export async function requestPasswordReset(
  request: RequestPasswordReset,
  input: RequestResetInput
): Promise<{ error: string | null }> {
  const parsed = requestPasswordResetSchema.parse(input);
  return request(parsed.email);
}

// FR-008: parses the enter-code-and-new-password form input against resetPasswordWithCodeSchema,
// then runs the exact control flow spec.md/plan.md/tasks.md's T009 entry specifies:
//   1. verifyCode(email, code).
//   2. On error: discard() the throwaway session, then return that error WITHOUT ever calling
//      updatePassword — a wrong/expired code must not reach the "set a new password" step at
//      all.
//   3. On success: call updatePassword(password), then ALWAYS call discard() afterward
//      (regardless of updatePassword's own outcome, so the throwaway session never lingers —
//      see spec.md Clarifications, Recorded default 2), then return updatePassword's result.
export async function submitNewPassword(
  deps: {
    verifyCode: VerifyRecoveryCode;
    updatePassword: UpdateRecoveryPassword;
    discard: DiscardRecoverySession;
  },
  input: ResetWithCodeInput
): Promise<{ error: string | null }> {
  const parsed = resetPasswordWithCodeSchema.parse(input);
  const { verifyCode, updatePassword, discard } = deps;

  const verifyResult = await verifyCode(parsed.email, parsed.code);
  if (verifyResult.error) {
    await discard();
    return verifyResult;
  }

  try {
    return await updatePassword(parsed.password);
  } finally {
    await discard();
  }
}
