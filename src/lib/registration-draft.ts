// 010-registration-redesign T009 (FR-009, Constitution Principle III, plan.md Research
// Decision 1) — WHY THIS IS DELIBERATELY VOLATILE, NOT AN OVERSIGHT:
//
// `CrearCuentaScreen` collects every profile-step field (name, birth date, nationality, CURP,
// RFC, or the Tienda business fields) on the SAME screen as registration, but the real backend
// contract still only accepts email/password/phone/username at the registration call itself —
// the rest has to be submitted later, after the phone-verification interruption
// (`app/(auth)/verify-phone.tsx`). This module is where those already-entered values live while
// that interruption is in progress.
//
// Constitution Principle III requires that CURP/RFC (and the other profile fields alongside
// them) are NEVER persisted anywhere beyond the active registration attempt's own lifetime. A
// plain module-level variable — living only on the JS heap for as long as this process is
// alive — is the most literal way to satisfy that: there is nothing to leak from disk, nothing
// to expire, nothing for a device-forensics or backup-extraction scenario to find. This is why
// a failed profile submission (FR-010) makes the user re-enter these fields on the existing
// `/profile` recovery screen rather than silently retrying from a cached copy — losing the
// draft on a killed app/closed tab is the intended, honest tradeoff this design makes, not a
// bug to "fix" by reaching for `expo-secure-store`, AsyncStorage, web `localStorage`, a router
// param, or any other durable/serializable storage mechanism. Do NOT add persistence here.
//
// Mirrors `src/lib/api.ts`'s existing `currentUserId` module-level-variable pattern — the same
// precedent, not a new mechanism. Plain TypeScript, no React/React Native imports (Constitution
// Principle IV) — this file is portable the same way `src/domain` modules are, even though it
// lives under `src/lib` (there is no Expo/RN dependency to isolate here).
//
// No `console.*` anywhere in this file, ever — logging a draft would defeat the entire point of
// keeping it out of anything durable.
//
// `email` (T019, specs/010-registration-redesign, carried over from Run 5's code review, Finding
// 2): every variant also carries the email the registration/sign-in call it followed used. This
// is NOT a new profile field being collected — it is the scoping key `verify-phone.tsx`'s
// consumer uses to refuse to auto-submit a draft that was not written for whichever account is
// actually completing phone verification right now. Concrete leak this closes: registration
// succeeds but Supabase sign-in fails (the `sessionIssue` recovery view) — no session exists for
// that account yet, so the KYC gate does not block the user from reaching `/login` via ordinary
// client-side navigation (no full reload, module state survives) and signing in as a completely
// different, already-registered account whose phone also isn't verified. Without this key,
// that second, unrelated account's `/verify-phone` visit would silently consume and submit the
// FIRST account's still-unconsumed draft (name/CURP/RFC/etc.) as its own profile — a genuine
// cross-account PII leak, not a cosmetic bug. Comparing against the session actually driving the
// `/verify-phone` call at consume time (see that file) closes it.
export type RegistrationDraft =
  | {
      kind: "personal";
      email: string;
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno?: string;
      birthDate: Date;
      nationality: string;
      curp: string;
      rfc: string;
      tosAccepted: true;
      privacyAccepted: true;
    }
  | {
      kind: "business";
      email: string;
      commercialName: string;
      rfc: string;
      fiscalAddress: string;
      tosAccepted: true;
      privacyAccepted: true;
    };

let draft: RegistrationDraft | undefined;

export function setRegistrationDraft(next: RegistrationDraft): void {
  draft = next;
}

// Reads AND clears in the same call — the atomicity is the point (see this file's doc comment
// above), not an implementation detail. A draft can therefore never be read twice or
// accidentally replayed: `verify-phone.tsx`'s failure path (FR-010) is a genuine "please
// re-enter your profile information" recovery, not a silent retry with cached sensitive values.
export function consumeRegistrationDraft(): RegistrationDraft | undefined {
  const current = draft;
  draft = undefined;
  return current;
}

export function clearRegistrationDraft(): void {
  draft = undefined;
}

// T019: whether `draft` was written for the account identified by `email` — the pure comparison
// half of this file's top `email` doc comment (src/lib/supabase-client.ts's
// getCurrentSessionEmail() is the RN/Expo-dependent half that fetches the value to compare
// against, kept out of this file per Constitution IV). `null`/`undefined` (no confirmed session
// email — e.g. getCurrentSessionEmail() failed closed) never matches anything, matching this
// file's own "never widen access under uncertainty" posture. Case/whitespace-insensitive:
// Supabase normalizes stored email casing, so a byte-for-byte comparison against what the user
// originally typed would produce false negatives on a legitimate match, not just true negatives
// on a genuine mismatch.
export function draftMatchesEmail(draft: RegistrationDraft, email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return draft.email.trim().toLowerCase() === email.trim().toLowerCase();
}
