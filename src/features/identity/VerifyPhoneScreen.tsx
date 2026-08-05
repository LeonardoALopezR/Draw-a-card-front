// T015 (FR-002, Edge Case: code expiry/resend): the 5-digit phone-verification screen. Follows
// RegistrationForm's (T011) established conventions exactly: React Hook Form + zodResolver
// (verificationCodeSchema, src/domain/schemas.ts) for the one `code` field, the shared FormField
// wrapper for label/inline-error layout, a `serverError` prop as the one channel a screen uses to
// feed a backend error back into the form, and `isSubmitting` owned by the screen
// (app/(auth)/verify-phone.tsx) and passed down rather than managed here. This component never
// calls the network, never imports src/lib/api.ts, and never interprets an ApiError itself
// (Constitution IV) — see src/domain/registration.ts's mapVerifyPhoneError/mapResendError for
// where that interpretation lives.
//
// Resend countdown: this is the one piece of state this component DOES own locally, because it's
// a pure UI affordance (disable the resend button for a while after it's pressed) with no
// backend-reported value to mirror — the backend's POST /identity/phone/resend response is
// `{ message: string }` only (no retryAfterSeconds/Retry-After-style field on either the success
// or the 429 PhoneResendRateLimited body — confirmed against the real backend source, see
// src/domain/registration.ts's resendVerificationCode doc comment and
// progress/impl_001-registration-kyc.md Run 4/Run 7). RESEND_COOLDOWN_SECONDS below is therefore
// a client-side-only UX choice, not a mirrored backend value — see its own comment for the
// reasoning. The countdown starts the instant "Resend code" is pressed (before the network call
// resolves), so a user cannot double-tap it into hitting the backend's real rate limit
// (3 resends / 15 minutes) any faster than one tap per cooldown window.
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { VerifyPhoneFieldError } from "@/domain/registration";
import { verificationCodeSchema, type VerificationCodeInput } from "@/domain/schemas";

import { CodeInput } from "./CodeInput";
import { FormField } from "./FormField";

export interface VerifyPhoneScreenProps {
  onSubmit: (input: VerificationCodeInput) => void | Promise<void>;
  onResend: () => void | Promise<void>;
  isSubmitting?: boolean;
  isResending?: boolean;
  // The backend-derived error for the in-flight verify submission, mapped upstream by
  // src/domain/registration.ts's mapVerifyPhoneError (see app/(auth)/verify-phone.tsx) — this
  // component only renders it.
  serverError?: VerifyPhoneFieldError;
  // A resend outcome message (success confirmation or a mapped error from mapResendError) — has
  // no associated form field, so it renders as a standalone banner near the resend button rather
  // than through react-hook-form's setError.
  resendMessage?: string;
}

// Client-side-only UX cooldown after pressing "Resend code" — NOT derived from any backend
// field (there is none to derive it from, see this file's top comment). 30 seconds is chosen as
// long enough to cover typical SMS delivery latency (so a user isn't tempted to immediately
// re-tap before the first code could plausibly have arrived) while staying short enough that a
// genuinely undelivered code doesn't leave the user stuck waiting; it is deliberately shorter
// than the backend's real 15-minute rate-limit window (Draw-a-card backend repo, service.ts's
// OTP_RESEND_WINDOW_SECONDS) since this cooldown's job is to prevent accidental rapid re-taps,
// not to model the backend's own limit — a resend attempted after this cooldown but still within
// the backend's 3-per-15-minute cap succeeds; one attempted after the backend's cap is reached
// surfaces mapResendError's PhoneResendRateLimited message via `resendMessage` regardless of this
// local timer's state.
export const RESEND_COOLDOWN_SECONDS = 30;

const DEFAULT_VALUES: VerificationCodeInput = { code: "" };

export function VerifyPhoneScreen({
  onSubmit,
  onResend,
  isSubmitting = false,
  isResending = false,
  serverError,
  resendMessage,
}: VerifyPhoneScreenProps) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VerificationCodeInput>({
    resolver: zodResolver(verificationCodeSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  // Feeds a backend-reported field error (e.g. PhoneCodeInvalid/PhoneCodeExpired, FR-002) into
  // the same inline-error slot a client-side validation failure would use — same pattern as
  // RegistrationForm.
  useEffect(() => {
    if (serverError?.field) {
      setError(serverError.field, { type: "server", message: serverError.message });
    }
  }, [serverError, setError]);

  const generalError = serverError && !serverError.field ? serverError.message : undefined;
  const submit = handleSubmit((data) => onSubmit(data));

  const canResend = !isResending && !isSubmitting && secondsRemaining === 0;

  function handleResendPress() {
    if (!canResend) {
      return;
    }
    setSecondsRemaining(RESEND_COOLDOWN_SECONDS);
    onResend();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Verify your phone
      </Text>
      <Text style={styles.subtitle}>Enter the 5-digit code we sent you by SMS.</Text>

      {generalError ? (
        <Text style={styles.generalError} accessibilityRole="alert" testID="verify-phone-form-error">
          {generalError}
        </Text>
      ) : null}

      {resendMessage ? (
        <Text style={styles.resendMessage} accessibilityRole="alert" testID="verify-phone-resend-message">
          {resendMessage}
        </Text>
      ) : null}

      <FormField label="Verification code" error={errors.code?.message} testID="verify-phone-code-field">
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <CodeInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              testID="verify-phone-code-input"
            />
          )}
        />
      </FormField>

      <Pressable
        style={[styles.button, isSubmitting ? styles.buttonDisabled : null]}
        onPress={submit}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Verify code"
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
        testID="verify-phone-submit-button"
      >
        <Text style={styles.buttonText}>{isSubmitting ? "Verifying…" : "Verify code"}</Text>
      </Pressable>

      <Pressable
        style={[styles.resendButton, !canResend ? styles.buttonDisabled : null]}
        onPress={handleResendPress}
        disabled={!canResend}
        accessibilityRole="button"
        accessibilityLabel="Resend code"
        accessibilityState={{ disabled: !canResend, busy: isResending }}
        testID="verify-phone-resend-button"
      >
        <Text style={styles.resendButtonText}>
          {secondsRemaining > 0 ? `Resend code (${secondsRemaining}s)` : "Resend code"}
        </Text>
      </Pressable>
    </View>
  );
}

// Minimum 44x44 tap targets (Constitution VII, SC-003) on every interactive element; single
// narrow column, unmodified at a 375px-wide web viewport through tablet/desktop widths — mirrors
// RegistrationForm's layout exactly.
const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 420,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: "#4b5563",
  },
  generalError: {
    fontSize: 14,
    color: "#dc2626",
  },
  resendMessage: {
    fontSize: 14,
    color: "#374151",
  },
  button: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  resendButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
});
