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
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { requestPasswordResetSchema, type RequestResetInput } from "@/domain/schemas";

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

// FR-007: deliberately identical wording regardless of whether the submitted email is actually
// registered — see this file's top comment.
export const REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE = "If that email is registered, we've sent a code";

const DEFAULT_VALUES: RequestResetInput = { email: "" };

export function RequestPasswordResetForm({
  onSubmit,
  onBack,
  isSubmitting = false,
  serverError,
}: RequestPasswordResetFormProps) {
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
        Reset your password
      </Text>

      {submitted ? (
        <Text style={styles.confirmation} accessibilityRole="alert" testID="request-reset-confirmation">
          {REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE}
        </Text>
      ) : (
        <>
          <Text style={styles.subtitle}>Enter your email and we'll send you a code to reset your password.</Text>

          {serverError ? (
            <Text style={styles.generalError} accessibilityRole="alert" testID="request-reset-form-error">
              {serverError}
            </Text>
          ) : null}

          <FormField label="Email" error={errors.email?.message} testID="request-reset-email-field">
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
                  accessibilityLabel="Email"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  testID="request-reset-email-input"
                />
              )}
            />
          </FormField>

          <Pressable
            style={[styles.button, isSubmitting ? styles.buttonDisabled : null]}
            onPress={submit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Send reset code"
            accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
            testID="request-reset-submit-button"
          >
            <Text style={styles.buttonText}>{isSubmitting ? "Sending…" : "Send reset code"}</Text>
          </Pressable>
        </>
      )}

      <Pressable
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back to sign in"
        testID="request-reset-back-button"
      >
        <Text style={styles.backButtonText}>Back to sign in</Text>
      </Pressable>
    </View>
  );
}

// Minimum 44x44 tap targets (Constitution VII, SC-003/FR-010) on every interactive element;
// single narrow column, unmodified at a 375px-wide web viewport through tablet/desktop widths —
// mirrors SignInForm's layout exactly (docs/conventions.md: no new visual language).
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
  confirmation: {
    fontSize: 14,
    color: "#374151",
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
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
  backButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
});
