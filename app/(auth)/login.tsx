// T005/T014 (FR-001, FR-006, FR-007, FR-008): thin screen glue only (Constitution IV) — wires the
// real signInWithPassword (src/lib/supabase-client.ts, T034's unchanged export) into LoginScreen's
// (T004) `signIn` prop via submitSignIn (src/domain/login.ts, T002), which re-validates against
// signInSchema before forwarding to the real primitive — the same DI pattern
// app/(auth)/register.tsx already establishes for signInWithPassword. This screen owns no
// business logic and, per FR-006/LoginScreen's own file-level comment, never calls useRouter()
// itself: a successful sign-in is left entirely to the existing useKycGate()/resolveKycRoute()
// mechanism mounted at the root layout.
//
// T014 additions: wires the real requestPasswordReset and createPasswordRecoverySession exports
// (src/lib/supabase-client.ts, T010) into LoginScreen's new props — requestPasswordReset via
// src/domain/passwordReset.ts's requestPasswordReset() orchestration (same "re-validate then
// forward" pattern as submitSignIn above), and createPasswordRecoverySession passed straight
// through unchanged (it is itself a factory that LoginScreen calls lazily, T013 — this screen
// does not call it, only hands it down).
import { submitSignIn } from "@/domain/login";
import { requestPasswordReset as submitPasswordResetRequest } from "@/domain/passwordReset";
import { LoginScreen } from "@/features/identity/LoginScreen";
import {
  createPasswordRecoverySession,
  requestPasswordReset,
  signInWithPassword,
} from "@/lib/supabase-client";

export default function LoginRoute() {
  return (
    <LoginScreen
      signIn={(email, password) => submitSignIn(signInWithPassword, { email, password })}
      requestPasswordReset={(email) => submitPasswordResetRequest(requestPasswordReset, { email })}
      createPasswordRecoverySession={createPasswordRecoverySession}
    />
  );
}
