// T015 (FR-002): thin glue only — renders VerifyPhoneScreen, calls verifyPhoneCode
// (src/domain/registration.ts, T006) on a valid submit, and calls resendVerificationCode (T006)
// on a resend press. All validation/request-building/error-interpretation logic lives in
// src/domain (Constitution IV); this screen only wires it to the router. Does NOT itself call
// setCurrentUserId (src/lib/api.ts) — T033 (2026-08-04) wires that exactly once, in
// useCrearCuentaSubmit.ts (src/features/identity/), right after a successful registration; by the
// time a user reaches this screen in the same JS session, the backend User.id is already set for
// the rest of the session, so verifyPhoneCode/resendVerificationCode's requests carry the
// X-User-Id header the backend requires without this screen needing to know about the mechanism
// at all.
//
// 010-registration-redesign T019 (FR-008, FR-009, FR-010, plan.md Research Decision 1): a
// correct code used to navigate straight to /profile unconditionally — it now first calls
// consumeRegistrationDraft() (src/lib/registration-draft.ts, T009) to see whether
// CrearCuentaScreen (T017) already collected the rest of this account's profile fields on the
// same screen as registration:
//   - Draft present AND it was written for the account actually completing verification right
//     now (draftMatchesEmail(), see registration-draft.ts's/supabase-client.ts's own doc
//     comments for the stale-draft-leak this guards against, Run 5 review Finding 2): submit it
//     immediately via submitProfile (src/domain/profile.ts, unchanged) — no second, user-visible
//     form. Success -> /tutorial (the same destination profile.tsx already routes to on its own
//     successful submit). Failure -> /profile (FR-010) — consumeRegistrationDraft() already
//     cleared the in-memory values (Constitution III), so this is a genuine "please re-enter your
//     profile information" recovery, never a silent retry with cached sensitive values.
//   - Draft absent, or present but not confirmed for this session (a stale/mismatched draft is
//     treated exactly like "absent" — never auto-submitted under someone else's session): fall
//     through to exactly today's original behavior, an unconditional /profile redirect.
import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import {
  mapResendError,
  mapVerifyPhoneError,
  resendVerificationCode,
  verifyPhoneCode,
  type VerifyPhoneFieldError,
} from "@/domain/registration";
import { submitProfile } from "@/domain/profile";
import type { BusinessProfileFormInput, VerificationCodeInput } from "@/domain/schemas";
import { VerifyPhoneScreen } from "@/features/identity/VerifyPhoneScreen";
import { api } from "@/lib/api";
import { consumeRegistrationDraft, draftMatchesEmail, type RegistrationDraft } from "@/lib/registration-draft";
import { getCurrentSessionEmail } from "@/lib/supabase-client";

export default function VerifyPhoneRouteScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [serverError, setServerError] = useState<VerifyPhoneFieldError | undefined>();
  const [resendMessage, setResendMessage] = useState<string | undefined>();

  // T019: draft.kind === "business" only matches tiendaProfileFormSchema's shape
  // (src/domain/schemas.ts) — narrower than submitProfile's declared BusinessProfileFormInput
  // parameter, which still requires the personal fields the Tienda tab never collects (pending
  // backend 015-registration-profile-support's User Story 2, see spec.md's User Story 2
  // Dependency note). This cast is that documented, deliberate, currently-expected gap, not an
  // accidental widening — the client-side schema.parse()/backend rejection it produces today is
  // the correct, disclosed outcome, and it is exactly what routes to the /profile recovery branch
  // below until backend 015 ships.
  async function completeProfileFromDraft(draft: RegistrationDraft) {
    try {
      if (draft.kind === "personal") {
        const { kind: _kind, email: _email, ...profile } = draft;
        await submitProfile(api, profile, { isBusiness: false });
      } else {
        const { kind: _kind, email: _email, ...profile } = draft;
        await submitProfile(api, profile as unknown as BusinessProfileFormInput, { isBusiness: true });
      }
      router.replace("/tutorial");
    } catch {
      router.replace("/profile");
    }
  }

  async function handleSubmit(input: VerificationCodeInput) {
    setServerError(undefined);
    setIsSubmitting(true);
    try {
      await verifyPhoneCode(api, input);
      const draft = consumeRegistrationDraft();
      if (draft) {
        const sessionEmail = await getCurrentSessionEmail();
        if (draftMatchesEmail(draft, sessionEmail)) {
          await completeProfileFromDraft(draft);
          return;
        }
      }
      router.replace("/profile");
    } catch (error) {
      setServerError(mapVerifyPhoneError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setResendMessage(undefined);
    setIsResending(true);
    try {
      const { message } = await resendVerificationCode(api);
      setResendMessage(message);
    } catch (error) {
      setResendMessage(mapResendError(error));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <View style={styles.screen}>
      <VerifyPhoneScreen
        onSubmit={handleSubmit}
        onResend={handleResend}
        isSubmitting={isSubmitting}
        isResending={isResending}
        serverError={serverError}
        resendMessage={resendMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
});
