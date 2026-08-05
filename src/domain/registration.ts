// Pure TypeScript, no React/React Native imports (Constitution Principle IV) — thin wrappers
// around the real backend contract (Draw-a-card backend repo, specs/001-user-registration-kyc,
// src/modules/identity/routes.ts and service.ts, confirmed against that repo's source
// directly). See specs/001-registration-kyc/spec.md's 2026-08-04 re-scope Clarifications for
// why registration is three separate steps, not the originally-assumed two.
//
// Dependency injection, not a direct `src/lib/api.ts` import: every exported function here
// takes a configured `ApiClient` (see src/domain/api-client.ts) as its first argument, rather
// than importing the singleton `api` instance from src/lib/api.ts directly. Importing
// src/lib/api.ts would transitively pull react-native/expo-secure-store (via
// src/lib/supabase-client.ts) into this file's module graph, defeating Constitution Principle
// IV's "zero RN imports, portable to a future TypeScript/React web codebase" guarantee even
// though no line here literally writes `import ... from "react-native"`. Callers (a future
// src/features/identity hook, T009/T010 — out of this run's scope) pass `api` from
// src/lib/api.ts at the call site instead.
//
// Temporary auth note (specs/001-registration-kyc/spec.md Assumptions, finding 5): the
// backend's `/identity/phone/*` and `/identity/me/*` routes identify the caller via a dev-only
// `X-User-Id` header (see src/lib/api.ts's `setCurrentUserId`), not real session/token
// verification. Whoever wires these functions into a screen/hook MUST call
// `setCurrentUserId(user.id)` (src/lib/api.ts) once after a successful
// submitPersonalRegistration/submitBusinessRegistration call — otherwise verifyPhoneCode,
// resendVerificationCode, and profile.ts's submitProfile will fail the backend's
// Unauthenticated/HeaderAuthNotAllowedInProduction checks. This function layer does not do that
// wiring itself (it has no access to src/lib/api.ts — see above). T033 (2026-08-04, found by
// code-reviewer's second review, Finding 1 BLOCKING): that wiring is now actually done, exactly
// once, in app/(auth)/register.tsx, right after a successful registration response — see that
// file's own doc comment. NOTE (T031, 2026-08-04): this is a separate, already-tracked gap from
// the Supabase-session gap this file's `SignInWithPassword` DI seam below fixes — the backend's
// own `User.id` is distinct from the Supabase `authProviderId`/session established by `signIn`
// below, and deriving one from the other is explicitly out of this task's scope. Do not extend
// the `X-User-Id` mechanism to try to close that gap here.
//
// T031 (session establishment): the backend's `POST /identity/register(/business)` creates the
// Supabase Auth account server-side (`getAuthProvider().signUpWithPassword`, Draw-a-card backend
// repo, src/modules/identity/service.ts) but returns no token, and nothing in this file's own
// network calls ever calls a Supabase Auth primitive itself — until now, no code anywhere in
// this repo ever established a Supabase session, so `useKycGate` (keyed on
// `supabase.auth.getSession()`) always saw `hasSession: false` after a real registration. Per
// the human decision recorded in specs/001-registration-kyc/tasks.md's T031: after a successful
// registration, this file calls `supabase.auth.signInWithPassword({ email, password })` with the
// same credentials just registered — but it does so via an INJECTED `SignInWithPassword`
// function (below), never importing `src/lib/supabase-client.ts` directly, for the same
// Constitution IV "zero RN imports" reason the `ApiClient` itself is injected rather than
// imported (see this file's original DI note above). The real implementation
// (`src/lib/supabase-client.ts`'s `signInWithPassword`) is wired in at the screen call site
// (`app/(auth)/register.tsx`), mirroring exactly how `src/lib/api.ts`'s `api` singleton is
// wired in for the `ApiClient` parameter today.
import { ApiError, type ApiClient } from "./api-client";
import {
  businessRegistrationSchema,
  personalRegistrationSchema,
  verificationCodeSchema,
  type BusinessRegistrationInput,
  type PersonalRegistrationInput,
  type VerificationCodeInput,
} from "./schemas";
import type { KycStatus, User } from "./types";

// Shape of "SafeUser" as returned by the backend (Draw-a-card repo,
// src/modules/identity/service.ts's toSafeUser()). Dates arrive as ISO strings over JSON —
// fetch's res.json() does not revive Date instances — so every backend Date field is typed as
// `string | null` here, matching what actually arrives on the wire.
export interface BackendUser {
  id: string;
  email: string;
  username: string;
  phone: string | null;
  isBusiness: boolean;
  kycStatus: string;
  phoneVerifiedAt: string | null;
  nombre: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  birthDate: string | null;
  nationality: string | null;
  curp: string | null;
  rfc: string | null;
  tosAcceptedAt: string | null;
  privacyAcceptedAt: string | null;
  createdAt: string;
}

// The backend's SafeUser has no equivalent of User.hasCompletedTutorial / User.isPremium /
// User.profileImageUrl / User.bio (src/domain/types.ts's own doc comments, from T002/T004,
// already flag hasCompletedTutorial and kycRejectionReason as not present on the backend's
// current User model). A freshly-returned user from any of this file's calls therefore defaults
// hasCompletedTutorial/isPremium to false and leaves kycRejectionReason at null — there is no
// backend value to read for any of the three, and false/null are the correct starting state for
// a user who just registered, verified their phone, or submitted their profile. This is a
// known, documented frontend/backend field gap, not a bug — see
// progress/impl_001-registration-kyc.md Run 4 for the full contract cross-check.
export function toDomainUser(raw: BackendUser): User {
  return {
    id: raw.id,
    email: raw.email,
    username: raw.username,
    phone: raw.phone ?? undefined,
    isBusiness: raw.isBusiness,
    kycStatus: raw.kycStatus as KycStatus,
    phoneVerifiedAt: raw.phoneVerifiedAt,
    nombre: raw.nombre,
    apellidoPaterno: raw.apellidoPaterno,
    apellidoMaterno: raw.apellidoMaterno,
    birthDate: raw.birthDate,
    nationality: raw.nationality,
    curp: raw.curp,
    rfc: raw.rfc,
    tosAcceptedAt: raw.tosAcceptedAt,
    privacyAcceptedAt: raw.privacyAcceptedAt,
    kycRejectionReason: null,
    hasCompletedTutorial: false,
    isPremium: false,
  };
}

// T031: the seam this file's registration functions use to establish a Supabase session after
// a successful backend registration, without importing src/lib/supabase-client.ts directly (see
// this file's DI note above). Deliberately shaped like the Supabase JS SDK's own
// `signInWithPassword` result (`{ error }`, not a thrown exception) rather than
// `{ session } | throw`, so a caller can distinguish "registration succeeded, sign-in failed"
// from a network-level throw without a try/catch just to read one field — the real
// implementation (src/lib/supabase-client.ts's `signInWithPassword`) adapts the SDK's actual
// `{ data, error }` shape to this narrower one.
export type SignInWithPassword = (
  email: string,
  password: string
) => Promise<{ error: string | null }>;

// T031: what submitPersonalRegistration/submitBusinessRegistration return now that a session-
// establishment attempt is part of the flow. `sessionError: null` means the Supabase session was
// established successfully (the common case). A non-null `sessionError` means the backend
// account was created (this call is NOT retried/undone) but signInWithPassword failed — e.g. the
// Supabase project requires email confirmation before password sign-in succeeds. The caller
// (app/(auth)/register.tsx) is responsible for surfacing that honestly rather than silently
// navigating on as if a session exists — see that screen for the exact UX.
export interface RegistrationResult {
  user: User;
  sessionError: string | null;
}

// FR-001, FR-002, FR-005, FR-006: POST /identity/register — email, password, phone, username
// ONLY. Creates the User at kycStatus: "pending" and triggers the SMS verification code as a
// side effect (there is no separate backend "send code" endpoint — see the file-level note
// below on why this file has no standalone sendVerificationCode export). Known backend error
// codes (ApiError.code, see api-client.ts): "UsernameTaken" (409), "EmailTaken" (409),
// "ValidationError" (400, shouldn't normally occur since personalRegistrationSchema.parse below
// mirrors the backend's own schema, but the backend remains the final authority). T031: once the
// backend call succeeds, immediately calls the injected `signIn` with the same credentials to
// establish the Supabase session useKycGate depends on (see this file's T031 note above) — a
// signIn failure is surfaced via `sessionError`, not thrown, since the registration itself did
// succeed and must not be presented as failed.
export async function submitPersonalRegistration(
  client: ApiClient,
  signIn: SignInWithPassword,
  input: PersonalRegistrationInput
): Promise<RegistrationResult> {
  const parsed = personalRegistrationSchema.parse(input);
  const { user } = await client<{ user: BackendUser }>("/identity/register", {
    method: "POST",
    body: JSON.stringify(parsed),
  });
  const { error } = await signIn(parsed.email, parsed.password);
  return { user: toDomainUser(user), sessionError: error };
}

// FR-001, FR-002, FR-003, FR-005, FR-006: POST /identity/register/business — identical body
// shape to submitPersonalRegistration (email, password, phone, username only); business-specific
// fields (commercialName, RFC, fiscal address) are collected later, at the profile step
// (src/domain/profile.ts) — see Clarifications finding 4 in spec.md. Known backend error codes:
// "UsernameTaken" (409), "EmailTaken" (409), "ValidationError" (400). T031: same
// signIn-after-register behavior as submitPersonalRegistration above — see that function's doc
// comment.
export async function submitBusinessRegistration(
  client: ApiClient,
  signIn: SignInWithPassword,
  input: BusinessRegistrationInput
): Promise<RegistrationResult> {
  const parsed = businessRegistrationSchema.parse(input);
  const { user } = await client<{ user: BackendUser }>("/identity/register/business", {
    method: "POST",
    body: JSON.stringify(parsed),
  });
  const { error } = await signIn(parsed.email, parsed.password);
  return { user: toDomainUser(user), sessionError: error };
}

// T031: lets a screen retry ONLY the sign-in primitive after a registration-succeeded-but-
// sign-in-failed outcome (RegistrationResult.sessionError), using the same already-submitted
// credentials, without re-submitting registration itself — re-registering would hit the
// backend's EmailTaken/UsernameTaken (409) errors, since the account already exists. Trivial by
// design (mirrors this file's other thin wrappers): kept here rather than inlined in
// app/(auth)/register.tsx per Constitution IV (no API/SDK-primitive calls inside a component
// body), even though it does little beyond forward to the injected `signIn`.
export async function retrySignIn(
  signIn: SignInWithPassword,
  email: string,
  password: string
): Promise<{ error: string | null }> {
  return signIn(email, password);
}

// FR-002: POST /identity/phone/verify — the 5-digit code. Requires the backend to be able to
// identify the caller (X-User-Id, see the file-level auth note above); a call made without
// setCurrentUserId() having been set first surfaces the backend's "Unauthenticated" (401)
// ApiError. Known backend error codes: "PhoneCodeInvalid" (400, wrong code),
// "PhoneCodeExpired" (400, code TTL elapsed or never issued), "PhoneCodeAttemptsExceeded" (429,
// per-code guess cap reached — the code is invalidated outright, requiring a resend),
// "ValidationError" (400).
export async function verifyPhoneCode(
  client: ApiClient,
  input: VerificationCodeInput
): Promise<{ phoneVerifiedAt: string | null }> {
  const parsed = verificationCodeSchema.parse(input);
  return client<{ phoneVerifiedAt: string | null }>("/identity/phone/verify", {
    method: "POST",
    body: JSON.stringify(parsed),
  });
}

// FR-002 (Edge Cases: code expiry/resend): POST /identity/phone/resend. The backend rate-limits
// this to 3 resends within a 15-minute window (Draw-a-card repo,
// src/modules/identity/service.ts's OTP_MAX_RESENDS/OTP_RESEND_WINDOW_SECONDS) — NOT the
// 60-second/5-per-hour figures plan.md's Assumptions guessed before this contract check (see
// progress/impl_001-registration-kyc.md Run 4 for that correction). The backend's 200 response
// is `{ message: string }` only — it does NOT return a `retryAfterSeconds` field (or any
// Retry-After-style value) on either the success or the 429 PhoneResendRateLimited error body,
// so a resend countdown must be computed/tracked client-side (e.g. from the fixed 15-minute
// window and a locally-tracked "last resend" timestamp) by whatever screen/hook consumes this
// function — this function itself only surfaces the backend's message/error, it does not
// fabricate a retryAfterSeconds the backend never sent.
export async function resendVerificationCode(client: ApiClient): Promise<{ message: string }> {
  return client<{ message: string }>("/identity/phone/resend", { method: "POST" });
}

// FR-009, FR-010: GET /identity/me/kyc-status — the ONLY backend endpoint today that reports
// anything at all about an already-identified, returning user (confirmed by reading every route
// in the Draw-a-card backend repo's src/modules/identity/routes.ts directly — there is no
// GET /identity/me returning the full profile). It also requires the backend's dev-only
// X-User-Id header (src/lib/api.ts's setCurrentUserId), which is only set in-memory by a
// same-JS-session registration/verification/profile call and is deliberately NOT persisted
// across app restarts (specs/001-registration-kyc/spec.md Assumptions, finding 5 — this feature
// does not make the header mechanism more automatic/pervasive than necessary). On a genuine cold
// boot (fresh JS process, no prior in-session registration call) this call is therefore expected
// to fail — Unauthenticated (401) or HeaderAuthNotAllowedInProduction (503) — even though the
// Supabase session itself may still be valid; see
// src/features/identity/useKycGate.ts (T010) for how that expected failure is surfaced as
// FR-010's retryable statusFetchFailed state rather than a silent pass-through or a false
// "unauthenticated".
export async function fetchCurrentUser(client: ApiClient): Promise<{ kycStatus: KycStatus }> {
  return client<{ kycStatus: KycStatus }>("/identity/me/kyc-status", { method: "GET" });
}

// FR-007: no backend endpoint exists for this — confirmed by inspecting the entire Draw-a-card
// backend repo (routes.ts, service.ts, prisma/schema.prisma): there is no route, service
// function, or column mentioning "tutorial" anywhere. `User.hasCompletedTutorial`
// (src/domain/types.ts) is a frontend-only concept today, with an explicitly open question
// (types.ts's own doc comment, T002/T004) of whether it becomes a local-storage value
// (expo-secure-store on native / web storage, which would have to be wired at the src/lib
// layer, since src/domain must stay RN-free — see this file's own DI note above) or a future
// backend field/endpoint. This is a deliberate, documented placeholder — not a real network
// call — so T006 has something for T019 (the tutorial screen, out of this run's scope) to call
// without inventing a backend endpoint that does not exist (explicitly disallowed by this run's
// instructions). Always resolves; there is no failure path to test.
export function markTutorialComplete(): Promise<void> {
  return Promise.resolve();
}

// T011/T012: which of PersonalRegistrationInput's four fields a registration error corresponds
// to, so app/(auth)/register.tsx can hand it to RegistrationForm and have the form highlight
// that specific field inline (SC-002: errors shown inline, never a bare banner/alert) instead
// of a generic "something went wrong". Kept in this domain file, not the component, per
// Constitution IV — deciding what an ApiError.code *means* is business logic, not rendering.
export type RegistrationFormField = keyof PersonalRegistrationInput;

export interface RegistrationFieldError {
  field?: RegistrationFormField;
  message: string;
}

const REGISTRATION_FORM_FIELDS: RegistrationFormField[] = ["email", "password", "phone", "username"];

// FR-001, FR-005: maps the backend error codes submitPersonalRegistration/
// submitBusinessRegistration are documented above to actually receive — "EmailTaken" (409),
// "UsernameTaken" (409), "ValidationError" (400, via its `issues[].path`) — to the specific
// form field they correspond to. Only interprets codes this file's own callers can genuinely
// get back from the real backend contract (see this file's own submit* doc comments); does not
// invent a code the backend doesn't send. Anything else (a network failure, an ApiError code
// with no field correspondence, a non-ApiError throw) falls back to a field-less message so the
// UI still has something inline-renderable rather than silently swallowing the error.
export function mapRegistrationError(error: unknown): RegistrationFieldError {
  if (error instanceof ApiError) {
    if (error.code === "EmailTaken") {
      return { field: "email", message: error.message };
    }
    if (error.code === "UsernameTaken") {
      return { field: "username", message: error.message };
    }
    if (error.code === "ValidationError" && error.issues?.length) {
      const issue = error.issues.find((candidate) =>
        REGISTRATION_FORM_FIELDS.includes(candidate.path as RegistrationFormField)
      );
      if (issue) {
        return { field: issue.path as RegistrationFormField, message: issue.message };
      }
    }
    return { message: error.message };
  }
  return { message: "Something went wrong. Please try again." };
}

// T033 (found by code-reviewer's second review, Finding 1 BLOCKING): shared, actionable copy for
// the backend's Unauthenticated (401) rejection on any X-User-Id-gated call (verifyPhoneCode,
// resendVerificationCode, and profile.ts's submitProfile all hit this if setCurrentUserId's
// wiring — app/(auth)/register.tsx — ever regresses). There is no user-facing re-authentication
// flow in this feature (per tasks.md's Notes: a fresh login screen for an expired session is out
// of scope), so the only honest, actionable instruction available is to restart the flow, which
// re-establishes both the Supabase session and this dev-only identifier. Exported so
// src/domain/profile.ts's mapProfileError can reuse the identical copy rather than drifting.
export const SESSION_LOST_MESSAGE =
  "We couldn't verify your session. Please close and reopen the app, then start again from registration.";

// T015: which of VerificationCodeInput's fields (only "code" — see schemas.ts's
// verificationCodeSchema) a verifyPhoneCode error corresponds to, so
// app/(auth)/verify-phone.tsx can hand it to VerifyPhoneScreen and have the form highlight the
// code field inline (SC-002), mirroring mapRegistrationError's same pattern above. Kept in this
// domain file, not the component, per Constitution IV.
export type VerifyPhoneFormField = "code";

export interface VerifyPhoneFieldError {
  field?: VerifyPhoneFormField;
  message: string;
}

// FR-002: maps the backend error codes verifyPhoneCode is documented above to actually receive —
// "PhoneCodeInvalid" (wrong code), "PhoneCodeExpired" (code TTL elapsed or never issued),
// "PhoneCodeAttemptsExceeded" (per-code guess cap reached, code invalidated outright), and a
// "ValidationError" whose issues name the "code" field — to that one field's inline-error slot.
// Anything else (a network failure, an unmapped ApiError code) falls back to a field-less message
// so the UI still has something inline-renderable rather than silently swallowing the error.
export function mapVerifyPhoneError(error: unknown): VerifyPhoneFieldError {
  if (error instanceof ApiError) {
    // T033: should only ever be reachable if the X-User-Id wiring (app/(auth)/register.tsx)
    // regresses — see SESSION_LOST_MESSAGE's doc comment above. Checked before every other
    // branch so a stale-session 401 is never mistaken for a wrong/expired code.
    if (error.code === "Unauthenticated") {
      return { message: SESSION_LOST_MESSAGE };
    }
    if (
      error.code === "PhoneCodeInvalid" ||
      error.code === "PhoneCodeExpired" ||
      error.code === "PhoneCodeAttemptsExceeded"
    ) {
      return { field: "code", message: error.message };
    }
    if (error.code === "ValidationError" && error.issues?.length) {
      const issue = error.issues.find((candidate) => candidate.path === "code");
      if (issue) {
        return { field: "code", message: issue.message };
      }
    }
    return { message: error.message };
  }
  return { message: "Something went wrong. Please try again." };
}

// FR-002 (Edge Cases: code expiry/resend): maps resendVerificationCode's failure modes to a
// plain message — there is no per-field concept for a resend action (VerifyPhoneScreen renders
// this as a standalone resend banner, not an inline field error). "PhoneResendRateLimited" (429,
// the backend's real 3-per-15-minute window — see resendVerificationCode's doc comment) surfaces
// the backend's own message verbatim; anything else falls back to a generic message.
export function mapResendError(error: unknown): string {
  if (error instanceof ApiError) {
    // T033: same reasoning as mapVerifyPhoneError's Unauthenticated branch above — only
    // reachable if the X-User-Id wiring regresses.
    if (error.code === "Unauthenticated") {
      return SESSION_LOST_MESSAGE;
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
