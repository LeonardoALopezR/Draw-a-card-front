// Pure TypeScript, no React/React Native imports (Constitution Principle IV). Same
// dependency-injection pattern as registration.ts — see that file's file-level comment for why
// this module accepts an `ApiClient` parameter rather than importing src/lib/api.ts directly,
// and for the temporary X-User-Id auth note (specs/001-registration-kyc/spec.md Assumptions,
// finding 5) that applies to this call exactly as it does to phone verification.
import { ApiError, type ApiClient } from "./api-client";
import { SESSION_LOST_MESSAGE, toDomainUser, type BackendUser } from "./registration";
import {
  businessProfileFormSchema,
  profileFormSchema,
  type BusinessProfileFormInput,
  type ProfileFormInput,
} from "./schemas";
import type { User } from "./types";

export interface SubmitProfileOptions {
  // Selects which schema to validate against (profileFormSchema vs.
  // businessProfileFormSchema, see schemas.ts) — required because commercialName/fiscalAddress
  // are only mandatory for business ("Tienda") accounts (FR-003). The caller (a future profile
  // screen, T017/T026 — out of this run's scope) knows this from the fetched User record
  // (`user.isBusiness`, per plan.md's "Profile step" Research Decision), not from a value
  // re-collected on this form.
  isBusiness: boolean;
}

// FR-003, FR-004, FR-007 (ToS/privacy piece): POST /identity/me/profile — nombre,
// apellidoPaterno (required), apellidoMaterno (optional), birth date, nationality, CURP, RFC,
// plus ToS/privacy acceptance; business accounts additionally submit commercialName and
// fiscalAddress (RFC is the SAME field for both account types — see schemas.ts's doc comment
// on profileFormSchema for why there is no separate "business RFC" field).
//
// This call is only reachable once phoneVerifiedAt is set — the routing gate
// (src/domain/kyc-gate.ts, T005) enforces that at the UI-navigation level. This function itself
// does NOT re-check phoneVerifiedAt; it relies on and surfaces the backend's own rejection
// (ApiError code "PhoneNotVerified", 403) if it is ever called out of order — e.g. via direct
// navigation or a stale client state — rather than duplicating that business rule client-side.
//
// Other known backend error codes (ApiError.code, see api-client.ts): "RfcConflict" (409 — the
// submitted RFC is already registered to another Tienda account, business accounts only),
// "ValidationError" (400), "UserNotFound" (404 — a stale/forged X-User-Id, see
// src/lib/api.ts's temporary auth note).
export async function submitProfile(
  client: ApiClient,
  input: ProfileFormInput | BusinessProfileFormInput,
  options: SubmitProfileOptions
): Promise<User> {
  const schema = options.isBusiness ? businessProfileFormSchema : profileFormSchema;
  const parsed = schema.parse(input);
  const { user } = await client<{ user: BackendUser }>("/identity/me/profile", {
    method: "POST",
    body: JSON.stringify(parsed),
  });
  return toDomainUser(user);
}

// T017: which of ProfileFormInput's fields a submitProfile error corresponds to, so
// app/(auth)/profile.tsx can hand it to ProfileForm and have the form highlight that specific
// field inline (SC-002) — same pattern as src/domain/registration.ts's mapRegistrationError/
// mapVerifyPhoneError. Kept in this domain file, not the component, per Constitution IV.
export type ProfileFormField = keyof ProfileFormInput;

export interface ProfileFieldError {
  field?: ProfileFormField;
  message: string;
}

const PROFILE_FORM_FIELDS: ProfileFormField[] = [
  "nombre",
  "apellidoPaterno",
  "apellidoMaterno",
  "birthDate",
  "nationality",
  "curp",
  "rfc",
  "tosAccepted",
  "privacyAccepted",
  "commercialName",
  "fiscalAddress",
];

// FR-002, FR-004: a submitProfile call made before the phone is verified (e.g. stale client
// state or direct navigation to /profile) surfaces the backend's own rejection as a
// discriminable ApiError code "PhoneNotVerified" (403) — see this file's submitProfile doc
// comment. That is NOT a form field error; the correct UI response (per spec.md's Edge Cases:
// "any direct-navigation attempt should redirect back to phone verification rather than surface
// the backend's rejection as a bare form error") is to redirect back to /verify-phone, not render
// an inline error. Exported separately so app/(auth)/profile.tsx can branch on it before falling
// back to mapProfileError for every other error shape.
export function isPhoneNotVerifiedError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "PhoneNotVerified";
}

// FR-003, FR-004: maps the backend error codes submitProfile is documented above to actually
// receive — "RfcConflict" (409, a business RFC already registered to another Tienda) and
// "ValidationError" (400, via its `issues[].path`) — to the specific form field they correspond
// to. Does not handle "PhoneNotVerified" (see isPhoneNotVerifiedError above — that is a routing
// decision, not a field error, and must be checked by the caller first). Anything else (a network
// failure, an unmapped ApiError code, a non-ApiError throw) falls back to a field-less message so
// the UI still has something inline-renderable rather than silently swallowing the error.
export function mapProfileError(error: unknown): ProfileFieldError {
  if (error instanceof ApiError) {
    // T033 (found by code-reviewer's second review, Finding 1 BLOCKING): should only ever be
    // reachable if the X-User-Id wiring (app/(auth)/register.tsx) regresses — see
    // registration.ts's SESSION_LOST_MESSAGE doc comment. Not a form field error, so no `field`.
    if (error.code === "Unauthenticated") {
      return { message: SESSION_LOST_MESSAGE };
    }
    if (error.code === "RfcConflict") {
      return { field: "rfc", message: error.message };
    }
    if (error.code === "ValidationError" && error.issues?.length) {
      const issue = error.issues.find((candidate) =>
        PROFILE_FORM_FIELDS.includes(candidate.path as ProfileFormField)
      );
      if (issue) {
        return { field: issue.path as ProfileFormField, message: issue.message };
      }
    }
    return { message: error.message };
  }
  return { message: "Something went wrong. Please try again." };
}
