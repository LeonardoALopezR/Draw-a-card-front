// T011 (FR-007): the "request a reset code" view of the forgot-password sub-flow — one of the
// three local view-states LoginScreen (T004/T013) composes on the SAME /login screen (spec.md
// Clarifications, Recorded default 2), never a route of its own. Follows SignInForm's (T003)
// established conventions exactly: React Hook Form + zodResolver (requestPasswordResetSchema,
// src/domain/schemas.ts), the shared FormField wrapper, the same TextInput/Pressable/style-
// constant shapes.
//
// The confirmation copy shown after a successful submission is INTENTIONALLY the same no matter
// whether the submitted email is actually registered — src/domain/passwordReset.ts's
// requestPasswordReset() (T009) never distinguishes "email exists" from "email doesn't exist" in
// its own result, since Supabase's resetPasswordForEmail() is itself anti-enumeration by design
// (spec.md FR-007, Clarifications Recorded default 1). `onSubmit` DOES now report back whether the
// call succeeded (a genuine NETWORK-LEVEL outcome, e.g. the request never reached the sign-in
// service at all — never an "email exists" signal, see the caller's own doc comment,
// LoginScreen.tsx's handleRequestReset) via its resolved boolean, so this component knows whether
// to show its own local confirmation or leave the error-surfacing to the `serverError` prop below
// — this still can never leak an email-exists/doesn't-exist distinction, only a reachability one
// (spec.md Edge Cases: "the reset-code request itself fails at the network level").
//
// T030 (006-visual-identity, spec.md Assumptions — "forgot-password sub-views inherit the
// vocabulary, not a new mockup layout"): restyled to the same Field/PrimaryButton vocabulary
// SignInForm (T028) already established — no mockup exists for this view, so content order/field
// set is unchanged, only markup/styling and copy-routing. "Send reset code" is now a
// PrimaryButton; "Back to sign in" stays a plain, restyled Pressable (typography.body.link
// styling) rather than a SecondaryButton, since a full-width pill reads as a second competing
// call-to-action on a screen with exactly one real action — the same judgment SignInForm already
// applied to its own right-aligned "Olvidé mi contraseña" link. Every string now resolves through
// useTranslation(loginCopy) — zero hardcoded copy remains. `onSubmit`'s boolean-resolving
// contract, `onBack`, `isSubmitting`, and `serverError` are byte-for-byte unchanged; the
// anti-enumeration confirmation copy's LOGIC (always the same message regardless of whether the
// email is registered) is untouched — only its rendered text now comes from
// loginCopy.{es,en}.requestResetConfirmation instead of the retired
// REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE constant (nothing outside this file's own,
// now-rewritten test imported that constant — confirmed via repo-wide grep before removing it).
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { requestPasswordResetSchema, type RequestResetInput } from "@/domain/schemas";
import { loginCopy } from "@/domain/i18n/copy/login";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, space, typography } from "@/theme";
import { PrimaryButton } from "@/features/ui/PrimaryButton";

import { FormField } from "./FormField";

export interface RequestPasswordResetFormProps {
  // Resolves `true` on success (renders this component's own local confirmation) or `false` on a
  // network-level failure (the caller, LoginScreen.tsx, is expected to keep this component
  // mounted and pass a `serverError` describing what happened instead) — see this file's top
  // comment and spec.md's Edge Cases section.
  onSubmit: (input: RequestResetInput) => boolean | Promise<boolean>;
  // Local UI-state trigger only, mirroring SignInForm's onForgotPassword — never a route change
  // (spec.md Clarifications, Recorded default 2).
  onBack: () => void;
  isSubmitting?: boolean;
  // A single, general, non-field-specific inline error for a network-level failure to even reach
  // the reset-code request (spec.md Edge Cases, "same treatment as User Story 1's Acceptance
  // Scenario 5") — mirrors SignInForm.tsx's `serverError` prop exactly: one general banner, never
  // a per-field error, since there is no field to attribute a reachability failure to.
  serverError?: string;
}

const DEFAULT_VALUES: RequestResetInput = { email: "" };

export function RequestPasswordResetForm({
  onSubmit,
  onBack,
  isSubmitting = false,
  serverError,
}: RequestPasswordResetFormProps) {
  const t = useTranslation(loginCopy);
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const submit = handleSubmit(async (data) => {
    const succeeded = await onSubmit(data);
    if (succeeded) {
      setSubmitted(true);
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {t("requestResetTitle")}
      </Text>

      {submitted ? (
        <Text style={styles.confirmation} accessibilityRole="alert" testID="request-reset-confirmation">
          {t("requestResetConfirmation")}
        </Text>
      ) : (
        <>
          <Text style={styles.subtitle}>{t("requestResetSubtitle")}</Text>

          {serverError ? (
            <Text style={styles.generalError} accessibilityRole="alert" testID="request-reset-form-error">
              {serverError}
            </Text>
          ) : null}

          <FormField label={t("emailLabel")} error={errors.email?.message} testID="request-reset-email-field">
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
                  testID="request-reset-email-input"
                />
              )}
            />
          </FormField>

          <PrimaryButton
            label={isSubmitting ? t("sendingResetCode") : t("sendResetCode")}
            onPress={submit}
            busy={isSubmitting}
            testID="request-reset-submit-button"
          />
        </>
      )}

      <Pressable
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t("backToSignIn")}
        testID="request-reset-back-button"
      >
        <Text style={styles.backButtonText}>{t("backToSignIn")}</Text>
      </Pressable>
    </View>
  );
}

// Minimum 44x44 tap targets (Constitution VII, SC-003/FR-010) on every interactive element;
// single narrow column, unmodified at a 375px-wide web viewport through tablet/desktop widths —
// mirrors SignInForm's layout exactly (docs/conventions.md: no new visual language). Every color/
// size value traces to src/theme's semantic tokens (FR-001) except the title's heading size,
// which is kept as a pre-existing documented literal (no heading-size token exists in this
// feature's token module, and docs/design-brief-visual-identity.md has no mockup for this view
// to specify one from). The general-error banner now sources colors.text.danger (T050 follow-up
// — see FormField.tsx's and src/theme/colors.ts's comments) rather than a raw literal.
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
  generalError: {
    fontSize: 14,
    color: colors.text.danger,
  },
  confirmation: {
    fontSize: 14,
    color: colors.text.secondary,
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
