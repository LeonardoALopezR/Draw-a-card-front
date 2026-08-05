// 005-login FR-001: pure TypeScript, no React/React Native imports (Constitution Principle IV)
// — thin orchestration around the existing signInWithPassword() (src/lib/supabase-client.ts,
// unchanged, already exported by 001-registration-kyc and hardened by that feature's T034
// "MUST NEVER THROW" fix). This file introduces no second sign-in code path: it only parses
// signInSchema (schemas.ts) and forwards to the injected `signIn`, mirroring
// registration.ts's submitPersonalRegistration/retrySignIn DI shape exactly.
import { signInSchema, type SignInInput } from "./schemas";
import type { SignInWithPassword } from "./registration";

// Re-exported here so a caller of this file doesn't also need to import registration.ts just to
// name the DI type it's passing in — same type, same shape, 001-registration-kyc's existing
// seam, not redeclared.
export type { SignInWithPassword };

// FR-001: parses the sign-in form input against signInSchema, then calls the injected `signIn`
// with the parsed (not raw) email/password, returning its result unchanged. `signIn` itself
// never throws (see src/lib/supabase-client.ts's signInWithPassword doc comment) — this
// function does not add its own try/catch around it, since there is nothing here that could
// reject once `signInSchema.parse` has succeeded.
export async function submitSignIn(
  signIn: SignInWithPassword,
  input: SignInInput
): Promise<{ error: string | null }> {
  const parsed = signInSchema.parse(input);
  return signIn(parsed.email, parsed.password);
}
