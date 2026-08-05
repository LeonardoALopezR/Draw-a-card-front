// T017 (FR-004): thin glue only — renders ProfileForm (T016), calls submitProfile
// (src/domain/profile.ts, T008) on a valid submit, and navigates to /tutorial on success (the
// gate itself, useKycGate/resolveKycRoute, re-routes to /main instead if the tutorial is already
// complete — this screen does not need to duplicate that decision). All validation/request-
// building/error-interpretation logic lives in src/domain (Constitution IV); this screen only
// wires it to the router.
//
// PhoneNotVerified handling: per spec.md's Edge Cases ("What happens if the profile step is
// attempted before the phone is verified? ... any direct-navigation attempt should redirect back
// to phone verification rather than surface the backend's rejection as a bare form error"), a
// PhoneNotVerified rejection (src/domain/profile.ts's isPhoneNotVerifiedError) redirects to
// /verify-phone instead of being rendered as a ProfileForm field/general error.
//
// T026 (US2, FR-003): `isBusiness` now comes from the same React Query cache entry
// (currentUserQueryKey, src/features/identity/useKycGate.ts) app/(auth)/register.tsx (T025)
// writes the fetched User's `isBusiness` flag into right after a successful registration — see
// that file's own top comment for why this shared query key (not a navigation param) is the
// "cleanest source", per this task's instruction. Read via `queryClient.getQueryData` rather
// than `useQuery` because this screen doesn't want to trigger its own fetch/subscribe to that
// key — useKycGate.ts (mounted once, at the root layout) already owns that query's lifecycle;
// this is a one-shot read of whatever it's already populated. KNOWN LIMITATION (documented, not
// silently assumed away): this only has a real value within the same JS session a registration
// call populated it in — the backend's only "returning user" endpoint (GET
// /identity/me/kyc-status) does not report isBusiness, so a genuine cold-boot resumability case
// (the gate routing a returning user directly to /profile after an app restart, per FR-009) has
// nothing to read here and falls back to `false` (the personal schema) below. This mirrors this
// feature's other already-documented X-User-Id/cold-boot backend-contract gaps (see
// src/domain/registration.ts's fetchCurrentUser doc comment) rather than inventing a new one —
// closing it for real requires the backend to expose isBusiness on a returning-user endpoint,
// which is out of this task's scope.
//
// Does NOT itself call setCurrentUserId (src/lib/api.ts) — T033 (2026-08-04) wires that exactly
// once, in app/(auth)/register.tsx, right after a successful registration; the same reasoning as
// verify-phone.tsx's (T015) identical note applies here.
import { useState } from "react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";

import { isPhoneNotVerifiedError, mapProfileError, submitProfile, type ProfileFieldError } from "@/domain/profile";
import type { ProfileFormInput } from "@/domain/schemas";
import { ProfileForm } from "@/features/identity/ProfileForm";
import { currentUserQueryKey } from "@/features/identity/useKycGate";
import { api } from "@/lib/api";

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<ProfileFieldError | undefined>();

  const cachedUser = queryClient.getQueryData<Record<string, unknown>>(currentUserQueryKey);
  const isBusiness = cachedUser?.isBusiness === true;

  async function handleSubmit(input: ProfileFormInput) {
    setServerError(undefined);
    setIsSubmitting(true);
    try {
      await submitProfile(api, input, { isBusiness });
      router.replace("/tutorial");
    } catch (error) {
      if (isPhoneNotVerifiedError(error)) {
        router.replace("/verify-phone");
        return;
      }
      setServerError(mapProfileError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ProfileForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isBusiness={isBusiness}
        serverError={serverError}
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
