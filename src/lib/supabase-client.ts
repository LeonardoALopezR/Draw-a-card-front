import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import WebSocketImpl from "ws";

import type {
  DiscardRecoverySession,
  UpdateRecoveryPassword,
  VerifyRecoveryCode,
} from "../domain/passwordReset";

// This file is intentionally Expo/RN-specific (unlike src/domain) — it's the adapter layer
// that would need a native (Kotlin/Swift) or web-specific equivalent during a future
// migration, per Constitution Principle IV. Keep this boundary clean: nothing outside
// src/lib should import expo-secure-store or react-native directly.

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Supabase JS's createClient() validates the URL synchronously and throws if it's empty
// ("supabaseUrl is required") — not a rejected Promise, an exception at module-import time.
// Until T010 (specs/001-registration-kyc), nothing reachable from app root actually imported
// this module, so an unset EXPO_PUBLIC_SUPABASE_URL/ANON_KEY (the shipped .env.example default)
// was harmless. T010 wires useKycGate() into app/_layout.tsx — the root layout, loaded on every
// route — which is also executed by `expo export`'s static-prerendering step (app.json's
// "web": { "output": "static" }), so an unset URL now crashes the ENTIRE app (and the build
// check) at import time, not just a missing-auth degradation. Falling back to a syntactically
// valid placeholder host keeps both cases working: prerendering succeeds (no real session
// exists yet anyway during a build), and a developer who hasn't configured a real Supabase
// project yet still sees the app shell instead of a hard crash — real auth calls against the
// placeholder host fail loudly with a network error (a clear, visible signal that env vars need
// setting), never silently "succeed".
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// createClient() unconditionally constructs a RealtimeClient (even though this feature never
// uses Supabase Realtime), which requires a WebSocket constructor. Real browsers and React
// Native both have one globally; the Node.js 20 process that runs `expo export`'s
// static-prerendering step (app.json's "web": { "output": "static" }) does not (Node adds a
// native WebSocket global at 22+, not 20 — see .nvmrc). `typeof window === "undefined"` is
// true only in that Node/prerender context, never in an actual browser or RN runtime, so this
// only ever supplies the "ws" package's constructor during prerendering, not to any real client.
const supabaseRealtimeOptions =
  typeof window === "undefined"
    ? { transport: WebSocketImpl as unknown as typeof WebSocket }
    : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // expo-secure-store isn't available on web; fall back to the SDK's default there.
    storage: Platform.OS === "web" ? undefined : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
  },
  realtime: supabaseRealtimeOptions,
});

// T034 (2026-08-04, found by manual iOS-simulator testing against a live local backend): the
// honest, distinct message surfaced when signInWithPassword's underlying network call itself
// fails (rejects) — as opposed to the SDK resolving normally with an auth-level rejection (bad
// credentials, unconfirmed email). Kept separate from the SDK's own `error.message` (which
// describes a credentials/policy problem the user can fix by re-entering something) because the
// user's actual recovery here is different: there is nothing wrong with their credentials, the
// sign-in service itself could not be reached (unreachable host, DNS failure, offline, timeout —
// verified concretely: EXPO_PUBLIC_SUPABASE_URL unset falls back to the unreachable
// https://placeholder.supabase.co placeholder host above, and curl against it returns HTTP 000).
export const NETWORK_SIGN_IN_ERROR_MESSAGE =
  "We couldn't reach the sign-in service. Check your connection and try again.";

// T031 (specs/001-registration-kyc): the real implementation of src/domain/registration.ts's
// injected `SignInWithPassword` type. The backend's `POST /identity/register(/business)` calls
// `getAuthProvider().signUpWithPassword(email, password)` server-side (Draw-a-card backend repo,
// src/modules/identity/service.ts) — the Supabase Auth account already exists with these exact
// credentials by the time this runs — but returns no token, so nothing establishes the client-
// side session useKycGate depends on until this function is called. Lives here, not in
// src/domain, because it's the one adapter that touches the real `supabase` client (Constitution
// Principle IV — src/domain must stay free of this import); wired in at the screen call site
// (app/(auth)/register.tsx), the same DI pattern src/lib/api.ts's `api` singleton already
// follows for the `ApiClient` parameter. Adapts the SDK's own `{ data, error }` shape (where
// `error` is a rich `AuthError` object) to the narrower `{ error: string | null }` shape
// `SignInWithPassword` expects, so src/domain never needs to know the SDK's error type.
//
// T034 (2026-08-04, found by manual iOS-simulator testing against a live local backend,
// orchestrator-verified): MUST NEVER THROW. supabase-js's signInWithPassword only *resolves*
// with `{ data, error }` for auth-level failures (bad credentials, unconfirmed email) — it
// *rejects* when the underlying `fetch` itself fails (unreachable host, DNS failure, device
// offline, timeout). Before this fix, that rejection escaped this wrapper entirely and was caught
// by app/(auth)/register.tsx's *registration* try/catch — the same catch that handles genuine
// registration failures — so a successful `POST /identity/register` (real user created, HTTP 201)
// followed by a network-level sign-in failure was misrepresented to the user as "registration
// failed." Retrying then hit the backend's real EmailTaken (409), permanently locking the user out
// of an account that genuinely exists (exactly the trap T031's "Your account was created — we
// couldn't sign you in automatically" screen was built to prevent, defeated by this one unhandled
// path). Catching here routes a network failure through the same `{ error: string }` contract
// registration.ts's RegistrationResult.sessionError already expects, landing the user on the
// session-issue screen with an honest, distinct message instead.
export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  } catch {
    return { error: NETWORK_SIGN_IN_ERROR_MESSAGE };
  }
}

// T010 (specs/005-login), FR-007: the real implementation of src/domain/passwordReset.ts's
// injected `RequestPasswordReset` type. Runs on the shared/ambient `supabase` singleton above —
// deliberately, unlike createPasswordRecoverySession() below — because
// supabase.auth.resetPasswordForEmail() is fire-and-forget from the caller's point of view: it
// never establishes or mutates a session on the client that calls it, so there is nothing here
// for useKycGate() to react to. Mirrors signInWithPassword's exact MUST-NEVER-THROW try/catch
// shape and reuses the same NETWORK_SIGN_IN_ERROR_MESSAGE for a network-level (not
// credentials-level) failure, for the same reason T034's doc comment above explains.
export async function requestPasswordReset(email: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  } catch {
    return { error: NETWORK_SIGN_IN_ERROR_MESSAGE };
  }
}

// T010 (specs/005-login), FR-008, spec.md Clarifications' "Recorded default 2": the real
// implementation of src/domain/passwordReset.ts's injected VerifyRecoveryCode/
// UpdateRecoveryPassword/DiscardRecoverySession types. Unlike requestPasswordReset above,
// supabase.auth.verifyOtp({ type: "recovery" }) DOES establish a real (temporary) session as a
// side effect of a successful call — and app/_layout.tsx's KycGate re-evaluates and redirects
// the instant ANY session becomes visible on the shared `supabase` singleton (see spec.md
// Clarifications for the full trace of why). So this function builds and returns a SECOND,
// throwaway `createClient(...)` instance on every call — `persistSession: false,
// autoRefreshToken: false` — and binds all three returned functions to that instance only. This
// throwaway client is never assigned to the module-level `supabase` export above, and nothing in
// this function ever reads from or writes to that export. Each call produces its own fresh
// instance (LoginScreen.tsx, T013, creates exactly one per "Forgot password?" press via
// `useState(() => createPasswordRecoverySession())`), so state can't leak across separate
// recovery attempts either.
export function createPasswordRecoverySession(): {
  verifyCode: VerifyRecoveryCode;
  updatePassword: UpdateRecoveryPassword;
  discard: DiscardRecoverySession;
} {
  const recoveryClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const verifyCode: VerifyRecoveryCode = async (email, code) => {
    try {
      const { error } = await recoveryClient.auth.verifyOtp({
        email,
        token: code,
        type: "recovery",
      });
      return { error: error?.message ?? null };
    } catch {
      return { error: NETWORK_SIGN_IN_ERROR_MESSAGE };
    }
  };

  const updatePassword: UpdateRecoveryPassword = async (newPassword) => {
    try {
      const { error } = await recoveryClient.auth.updateUser({ password: newPassword });
      return { error: error?.message ?? null };
    } catch {
      return { error: NETWORK_SIGN_IN_ERROR_MESSAGE };
    }
  };

  // DiscardRecoverySession returns Promise<void> (src/domain/passwordReset.ts) — nothing to
  // report on either outcome, this is best-effort cleanup of a throwaway client instance, not an
  // operation a caller branches on. Still must not throw, per the same MUST-NEVER-THROW
  // convention as every other function in this file.
  const discard: DiscardRecoverySession = async () => {
    try {
      await recoveryClient.auth.signOut();
    } catch {
      // Intentionally swallowed — see comment above.
    }
  };

  return { verifyCode, updatePassword, discard };
}
