// T012 (FR-007, FR-008, FR-009): the "enter code + new password" view of the forgot-password
// sub-flow — the second of the three local view-states LoginScreen (T004/T013) composes on the
// SAME /login screen (spec.md Clarifications, Recorded default 2), never a route of its own.
// Follows VerifyPhoneScreen's (T015) established conventions for the code-entry/resend-cooldown
// mechanism exactly (same RESEND_COOLDOWN_SECONDS value and timer useEffect shape — read that
// file first, this is not a re-invented mechanism, just a second screen using the identical
// pattern), and SignInForm/RegistrationForm's conventions for the email/password
// TextInput/FormField/Pressable shapes.
//
// The email field is pre-filled from `initialEmail` (carried forward from
// RequestPasswordResetForm's submission, via LoginScreen, T013) but stays fully editable — spec.md
// US2 AS5 allows pre-filling as a convenience without forcing it (e.g. the user may have fat-
// fingered the email on the previous step and wants to correct it here rather than starting the
// whole flow over).
//
// This component reuses CodeInput (src/features/identity/CodeInput.tsx) rather than a new
// low-level primitive (plan.md's "Shared UI" Research Decision), and never talks to Supabase or
// any client directly (Constitution IV) — verifyCode/updatePassword/discard are entirely
// LoginScreen's (T013) and app/(auth)/login.tsx's (T014) responsibility to wire up.
//
// RESET_CODE_SENT_MESSAGE (progress/review_005-login.md's T013/T014 review, Finding 2): a static,
// ALWAYS-shown confirmation line, not gated on any prop/domain result. Design choice made at the
// follow-up fix pass, not unilaterally: because LoginScreen.tsx's handleRequestReset transitions
// straight from "request-reset" to "reset-with-code" the moment requestPasswordReset resolves,
// RequestPasswordResetForm's own "submitted" confirmation view (T011) is mounted and unmounted in
// the same tick — never actually visible to a real user. Rather than adding a new timing-dependent
// interaction step (a delay, toast, or explicit "Continue" button) to make that confirmation
// visible before the transition, the chosen fix moves an equivalent, always-accurate confirmation
// line onto THIS screen instead (the one the user actually lands on and reads). It's safe to show
// unconditionally, with no anti-enumeration regression, because requestPasswordReset (T009/T010)
// never distinguishes "email exists" from "email doesn't exist" in the first place (Clarifications,
// Recorded default 1) — this copy is equally true regardless of whether the submitted email was
// actually registered. RequestPasswordResetForm's own "submitted" state is left intact as
// defense-in-depth for the (currently unreachable) case where the transition doesn't fire, but is
// no longer the primary mechanism a real user relies on to see this confirmation.
//
// T032 (006-visual-identity, spec.md Assumptions — "forgot-password sub-views inherit the
// vocabulary, not a new mockup layout"): restyled to the same Field/PrimaryButton vocabulary
// SignInForm (T028)/RequestPasswordResetForm (T030) already established — no mockup exists for
// this view, so content order/field set is unchanged, only markup/styling and copy-routing. Every
// rendered string now resolves through useTranslation(loginCopy) — the previously-exported
// RESET_CODE_SENT_MESSAGE string constant is retired in favor of loginCopy.{es,en}.resetCodeSentMessage
// (confirmed via repo-wide grep before removing it — nothing outside this file's own, now-rewritten
// test imported it). "Set new password" is now a PrimaryButton. "Resend code" becomes a
// SecondaryButton (T013) — unlike "Back to sign in" (kept a plain restyled Pressable, matching
// RequestPasswordResetForm's judgment call that a full-width pill would compete with the primary
// action), the resend control was ALREADY a bordered, button-shaped secondary action before this
// restyle (not a plain link), so SecondaryButton's exact geometry/border vocabulary is a direct,
// non-inventive fit — its countdown-driven `disabled` state (`!canResend`, unchanged logic) is
// passed straight through. `CodeInput` itself is untouched — only wrapped in the restyled `Field`
// label treatment, exactly as it already was. `RESEND_COOLDOWN_SECONDS`'s value/timer `useEffect`
// and the `serverError.field === "code"` inline-error `useEffect` are byte-for-byte unchanged.
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  PASSWORD_RESET_CODE_LENGTH,
  resetPasswordWithCodeSchema,
  type ResetWithCodeInput,
} from "@/domain/schemas";
import { loginCopy } from "@/domain/i18n/copy/login";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, space, typography } from "@/theme";
import { PrimaryButton } from "@/features/ui/PrimaryButton";
import { SecondaryButton } from "@/features/ui/SecondaryButton";

import { CodeInput } from "./CodeInput";
import { FormField } from "./FormField";

// Which of ResetWithCodeInput's fields a submitted-code rejection (wrong/expired code) maps to —
// mirrors registration.ts's VerifyPhoneFieldError shape exactly, kept local to this component
// since src/domain/passwordReset.ts's submitNewPassword (T009) returns a plain
// `{ error: string | null }` with no field attribution of its own; the caller (LoginScreen, T013)
// is the one that knows a code-verification failure specifically belongs on the "code" field.
export interface ResetPasswordFieldError {
  field?: "code";
  message: string;
}

export interface ResetPasswordFormProps {
  onSubmit: (input: ResetWithCodeInput) => void | Promise<void>;
  onResend: () => void | Promise<void>;
  // Local UI-state trigger only, mirroring SignInForm/RequestPasswordResetForm's onBack — never a
  // route change (spec.md Clarifications, Recorded default 2).
  onBack: () => void;
  // Carried forward from the "request a reset code" step (RequestPasswordResetForm), pre-fills
  // but never locks the email field — spec.md US2 AS5.
  initialEmail?: string;
  isSubmitting?: boolean;
  isResending?: boolean;
  serverError?: ResetPasswordFieldError;
}

// Client-side-only UX cooldown after pressing "Resend code" — identical value and rationale to
// VerifyPhoneScreen.tsx's RESEND_COOLDOWN_SECONDS (see that file's top comment for the full
// reasoning: long enough to cover typical email delivery latency, shorter than any backend rate
// limit). Not imported from VerifyPhoneScreen.tsx — each screen owns its own cooldown constant,
// exactly as VerifyPhoneScreen itself does not import one from anywhere else — but the VALUE is
// deliberately identical (mirror it exactly, per this task's brief, not a re-invented number).
export const RESEND_COOLDOWN_SECONDS = 30;

export function ResetPasswordForm({
  onSubmit,
  onResend,
  onBack,
  initialEmail,
  isSubmitting = false,
  isResending = false,
  serverError,
}: ResetPasswordFormProps) {
  const t = useTranslation(loginCopy);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetWithCodeInput>({
    resolver: zodResolver(resetPasswordWithCodeSchema),
    defaultValues: { email: initialEmail ?? "", code: "", password: "" },
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

  // Feeds a backend/Supabase-reported code rejection into the same inline-error slot a
  // client-side validation failure would use — same pattern as VerifyPhoneScreen.
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

  const resendLabel =
    secondsRemaining > 0
      ? t("resendCodeWithSeconds").replace("{{seconds}}", String(secondsRemaining))
      : t("resendCode");

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {t("resetCodeTitle")}
      </Text>
      <Text style={styles.confirmation} accessibilityRole="text" testID="reset-password-code-sent-message">
        {t("resetCodeSentMessage")}
      </Text>
      <Text style={styles.subtitle}>{t("resetCodeSubtitle")}</Text>

      {generalError ? (
        <Text style={styles.generalError} accessibilityRole="alert" testID="reset-password-form-error">
          {generalError}
        </Text>
      ) : null}

      <FormField label={t("emailLabel")} error={errors.email?.message} testID="reset-password-email-field">
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel={t("emailLabel")}
              placeholder={t("emailPlaceholder")}
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              testID="reset-password-email-input"
            />
          )}
        />
      </FormField>

      <FormField label={t("resetCodeLabel")} error={errors.code?.message} testID="reset-password-code-field">
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <CodeInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              length={PASSWORD_RESET_CODE_LENGTH}
              editable={!isSubmitting}
              accessibilityLabel={t("resetCodeLabel")}
              testID="reset-password-code-input"
            />
          )}
        />
      </FormField>

      <FormField label={t("newPasswordLabel")} error={errors.password?.message} testID="reset-password-password-field">
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel={t("newPasswordLabel")}
              autoComplete="password-new"
              secureTextEntry
              testID="reset-password-password-input"
            />
          )}
        />
      </FormField>

      <PrimaryButton
        label={isSubmitting ? t("settingPassword") : t("setNewPassword")}
        onPress={submit}
        busy={isSubmitting}
        testID="reset-password-submit-button"
      />

      <SecondaryButton
        label={resendLabel}
        onPress={handleResendPress}
        disabled={!canResend}
        testID="reset-password-resend-button"
      />

      <Pressable
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t("backToSignIn")}
        testID="reset-password-back-button"
      >
        <Text style={styles.backButtonText}>{t("backToSignIn")}</Text>
      </Pressable>
    </View>
  );
}

// Minimum 44x44 tap targets (Constitution VII, SC-003/FR-010) on every interactive element;
// single narrow column, unmodified at a 375px-wide web viewport through tablet/desktop widths —
// mirrors VerifyPhoneScreen's/SignInForm's layout exactly (docs/conventions.md: no new visual
// language). Every color/size value traces to src/theme's semantic tokens (FR-001) except the
// title's heading size, which is kept as a pre-existing documented literal (no heading-size
// token exists in this feature's token module, and docs/design-brief-visual-identity.md has no
// mockup for this view to specify one from). The general-error banner now sources
// colors.text.danger (T050 follow-up — see FormField.tsx's and src/theme/colors.ts's comments)
// rather than a raw literal.
const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 420,
    gap: space.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  confirmation: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  generalError: {
    fontSize: 14,
    color: colors.text.danger,
  },
  input: {
    fontSize: typography.body.input.fontSize,
    fontWeight: typography.body.input.fontWeight,
    color: colors.text.primary,
    padding: 0,
  },
  backButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: typography.body.link.fontSize,
    fontWeight: typography.body.link.fontWeight,
    color: typography.body.link.color,
  },
});
