// T015 (FR-002): thin glue only — renders VerifyPhoneScreen, calls verifyPhoneCode
// (src/domain/registration.ts, T006) on a valid submit and navigates to /profile on success (was
// /kyc before the 2026-08-04 re-scope — see spec.md's Clarifications), and calls
// resendVerificationCode (T006) on a resend press. All validation/request-building/error-
// interpretation logic lives in src/domain (Constitution IV); this screen only wires it to the
// router. Does NOT itself call setCurrentUserId (src/lib/api.ts) — T033 (2026-08-04) wires that
// exactly once, in app/(auth)/register.tsx, right after a successful registration; by the time a
// user reaches this screen in the same JS session, the backend User.id is already set for the
// rest of the session, so verifyPhoneCode/resendVerificationCode's requests carry the X-User-Id
// header the backend requires without this screen needing to know about the mechanism at all.
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
import type { VerificationCodeInput } from "@/domain/schemas";
import { VerifyPhoneScreen } from "@/features/identity/VerifyPhoneScreen";
import { api } from "@/lib/api";

export default function VerifyPhoneRouteScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [serverError, setServerError] = useState<VerifyPhoneFieldError | undefined>();
  const [resendMessage, setResendMessage] = useState<string | undefined>();

  async function handleSubmit(input: VerificationCodeInput) {
    setServerError(undefined);
    setIsSubmitting(true);
    try {
      await verifyPhoneCode(api, input);
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
