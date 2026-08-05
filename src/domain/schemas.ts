import { z } from "zod";

// Plain TypeScript + Zod, no framework imports — portable to any future codebase. Field names,
// character-set rules, and required/optional splits are mirrored verbatim from the REAL
// backend contract (Draw-a-card backend repo, specs/001-user-registration-kyc,
// src/modules/identity/validation.ts), confirmed against that repo's source directly — not
// invented client-side. See specs/001-registration-kyc/spec.md's 2026-08-04 re-scope
// Clarifications for why the flow is three steps (credentials -> phone verification ->
// profile), not the originally-assumed two.

// FR-005: usernames may contain Latin letters (accented forms included, e.g. José, Muñoz),
// digits, underscore, dot, and hyphen. Greek, Cyrillic, CJK, and emoji are rejected. Mirrors
// the backend's USERNAME_PATTERN (src/modules/identity/validation.ts) exactly, including the
// NFC-preprocessing step, so a submission the backend would reject is caught client-side too
// instead of round-tripping to the server for an avoidable 400. Do not loosen this regex
// independently of the backend — see validation.ts's own comment for why the character set is
// deliberately restricted (Postgres `lower()` does not implement Unicode's context-sensitive
// casing rules for scripts outside this set).
const USERNAME_PATTERN = /^[A-Za-z0-9_.\-À-ÖØ-öø-ſ]+$/;

export const usernameSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.normalize("NFC") : value),
  z
    .string()
    .min(1, "Username is required")
    .max(30, "Username must be 30 characters or fewer")
    .regex(
      USERNAME_PATTERN,
      "Username may only contain Latin letters (accents allowed), digits, underscore, dot, and hyphen"
    )
);

// FR-005: the diacritic-stripped, lowercased form actual uniqueness is enforced against
// server-side (User.usernameNormalized) — mirrors the backend's normalizeUsername()
// (username.ts) exactly. This function does NOT itself enforce uniqueness (only the backend
// can, since it alone sees every existing account); it's exported so the UI can compute the
// same normalized form the backend will compare against — e.g. for an early "looks like it
// might be taken" hint — without silently drifting from the backend's own algorithm. Real
// enforcement is surfaced via ApiError's "UsernameTaken" code (see registration.ts).
const COMBINING_DIACRITICAL_MARKS = /[̀-ͯ]/g;
export function normalizeUsernameForComparison(username: string): string {
  return username.normalize("NFKD").replace(COMBINING_DIACRITICAL_MARKS, "").toLowerCase();
}

// 005-login FR-001: the minimum-length password rule, factored out of
// personalRegistrationSchema.password below so both registration and the forgot-password
// "set a new password" step (specs/005-login) share one definition rather than two
// independently-maintained 8-character rules silently drifting apart later (plan.md's "Shared
// schemas" Research Decision). Byte-for-byte identical to the rule this replaces — same
// message, same threshold.
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

// FR-001, FR-002, FR-003, FR-005: POST /identity/register and POST /identity/register/business
// share this identical shape (backend spec Clarifications, Session 2026-08-03,
// mid-implementation correction) — account type is determined by which endpoint is called, not
// by a field in the request body. No profile field or ToS/privacy acceptance is accepted at
// this step (see profileFormSchema below, FR-004).
export const personalRegistrationSchema = z.object({
  // "Enter a valid email address" replaces Zod's default "Invalid email" — deliberately chosen
  // (not left as the default) to match the "Enter a valid X" phrasing already used by `phone`
  // below, per docs/verification.md's user-facing-copy bar (no raw Zod default messages).
  email: z.string().email("Enter a valid email address"),
  password: passwordSchema,
  phone: z.string().min(1, "Enter a valid phone number"),
  username: usernameSchema,
});

// Identical field-for-field to personalRegistrationSchema (the backend's
// registerCredentialsSchema is shared verbatim by both endpoints) — kept as its own export
// rather than a bare alias so call sites read as "the business registration schema", and so a
// future backend addition of business-specific fields at THIS step (unlikely per the current
// contract, but not this file's call to rule out) only requires extending this schema, not
// renaming every call site.
export const businessRegistrationSchema = personalRegistrationSchema;

export type PersonalRegistrationInput = z.infer<typeof personalRegistrationSchema>;
export type BusinessRegistrationInput = z.infer<typeof businessRegistrationSchema>;

// FR-002: 5-digit numeric code — mirrors the backend's verifyPhoneSchema exactly (a regex, not
// just a length check: the backend rejects non-digit 5-character strings like "12a4b").
export const verificationCodeSchema = z.object({
  code: z.string().regex(/^\d{5}$/, "Enter the 5-digit code"),
});
export type VerificationCodeInput = z.infer<typeof verificationCodeSchema>;

// Genuinely-optional string field helper — `z.string().min(1).optional()` on its own does NOT
// make a field genuinely optional in practice: `.optional()` only accepts `undefined`, so an
// empty string (what React Hook Form actually produces when a user types into a field and then
// clears it, per the standard `value ?? ""` controlled-input pattern) still fails `.min(1)` and
// blocks submission with Zod's raw default message. This helper preprocesses an empty/
// whitespace-only string to `undefined` *before* validation, so the field is optional the way a
// caller actually experiences it, and the normalized `undefined` (not `""`) is what reaches
// `JSON.stringify` at the call site — so the backend receives the key omitted entirely rather
// than an empty string. Used by every `.min(1).optional()` field below (apellidoMaterno,
// commercialName, fiscalAddress on the base schema) — see this file's Defect-2 fix,
// specs/001-registration-kyc/tasks.md T032.
function optionalNonEmptyString(message: string) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
    z.string().min(1, message).optional()
  );
}

// FR-003, FR-004, FR-007: POST /identity/me/profile, reachable only once the phone is verified
// (enforced by the backend's PhoneNotVerified error — surfaced by profile.ts, not re-checked
// here). Mirrors the backend's profilePersonalSchema (validation.ts) field-for-field: `nombre`
// and `apellidoPaterno` required, `apellidoMaterno` optional, and the acceptance fields are
// named `tosAccepted`/`privacyAccepted` (NOT "acceptedTerms"/"acceptedPrivacyPolicy" as
// plan.md's Research Decision assumed before this contract check — see
// progress/impl_001-registration-kyc.md Run 4 for that correction). `commercialName` and
// `fiscalAddress` are present only for business accounts — see businessProfileFormSchema below,
// which makes them required. There is deliberately no separate "business RFC" field: the
// backend's profileBusinessSchema extends profilePersonalSchema and reuses the SAME `rfc` field
// for both account types (a sole proprietor's fiscal RFC and personal RFC are the same value in
// this product's domain — persona física con actividad empresarial — per validation.ts's own
// comment), unlike plan.md's Research Decision, which assumed a distinct `businessRfc` field.
export const profileFormSchema = z.object({
  nombre: z.string().min(1, "Nombre is required"),
  apellidoPaterno: z.string().min(1, "Apellido paterno is required"),
  // Genuinely optional (see optionalNonEmptyString above) — a typed-then-cleared field (RHF
  // produces "", not undefined, when a controlled TextInput is cleared) must not block
  // submission with a raw Zod default message.
  apellidoMaterno: optionalNonEmptyString("Apellido materno must not be empty"),
  birthDate: z.coerce.date({
    errorMap: () => ({ message: "Enter a valid birth date (YYYY-MM-DD)" }),
  }),
  nationality: z.string().min(1, "Nationality is required"),
  curp: z.string().min(1, "CURP is required"),
  rfc: z.string().min(1, "RFC is required"),
  tosAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms of Service" }),
  }),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Privacy Policy" }),
  }),
  // Present only for business ("Tienda") accounts (FR-003) — the profile screen conditionally
  // renders these fields based on the fetched user's isBusiness flag (src/domain/types.ts), not
  // a value re-collected from the registration step. Optional at this base schema so a personal
  // submission (which omits them entirely) still validates; businessProfileFormSchema below
  // makes them required for business submissions. Same genuinely-optional treatment as
  // apellidoMaterno above (identical latent bug, same fix).
  commercialName: optionalNonEmptyString("Commercial name must not be empty"),
  fiscalAddress: optionalNonEmptyString("Fiscal address must not be empty"),
});
export type ProfileFormInput = z.infer<typeof profileFormSchema>;

// FR-003, FR-004: business accounts additionally require commercialName + fiscalAddress at the
// profile step (rfc is already required for every account type by profileFormSchema above —
// see that schema's doc comment for why there is no separate business-RFC field). Used by
// profile.ts's submitProfile() to reject an incomplete business submission client-side before
// it ever reaches the network, mirroring the backend's profileBusinessSchema requiring both as
// non-optional (and the RfcConflict/409 the backend returns when the RFC itself collides with
// another Tienda's, which this schema cannot catch — that's a server-side uniqueness check,
// surfaced via ApiError, not a shape check).
export const businessProfileFormSchema = profileFormSchema.extend({
  commercialName: z.string().min(1, "Commercial name is required"),
  fiscalAddress: z.string().min(1, "Fiscal address is required"),
});
export type BusinessProfileFormInput = z.infer<typeof businessProfileFormSchema>;

// 005-login FR-001: POST-free — sign-in goes through the Supabase Auth SDK directly
// (src/lib/supabase-client.ts's signInWithPassword, reused unchanged from
// 001-registration-kyc), not a backend endpoint, so there is no backend contract to mirror
// here the way personalRegistrationSchema mirrors the backend's registerCredentialsSchema.
// Deliberately does NOT reuse passwordSchema for `password`: a sign-in form must not
// re-enforce a strength rule against a password that may predate any given rule change — only
// presence is checked client-side, Supabase is the sole authority on whether it's correct
// (plan.md's "Sign-in mechanism" Research Decision).
export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
export type SignInInput = z.infer<typeof signInSchema>;

// 005-login spec.md Assumptions: the emailed reset code's exact length is ASSUMED to be 6
// digits (Supabase Auth's documented default for email OTPs), distinct from
// verificationCodeSchema's existing 5-digit SMS phone-verification code above. A one-constant
// adjustment (not a structural risk) if the live Supabase project's configured OTP length turns
// out to differ — CodeInput (src/features/identity/CodeInput.tsx) already accepts a
// configurable length prop.
export const PASSWORD_RESET_CODE_LENGTH = 6;

// 005-login FR-007: "request a reset code" step — email only, same validation rule as
// signInSchema's email field (a plain well-formedness check; Supabase's own SDK call is the
// anti-enumeration boundary, this schema does not attempt to duplicate that).
export const requestPasswordResetSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
export type RequestResetInput = z.infer<typeof requestPasswordResetSchema>;

// 005-login FR-008: "enter code + new password" step — email (carried forward from the request
// step, editable), the emailed code (PASSWORD_RESET_CODE_LENGTH digits, mirroring
// verificationCodeSchema's regex-not-just-length-check approach above), and the new password
// (reuses the shared passwordSchema, T001 — same minimum-length rule as registration, no
// separate/duplicated rule).
export const resetPasswordWithCodeSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  code: z.string().regex(new RegExp(`^\\d{${PASSWORD_RESET_CODE_LENGTH}}$`), "Enter the 6-digit code"),
  password: passwordSchema,
});
export type ResetWithCodeInput = z.infer<typeof resetPasswordWithCodeSchema>;
