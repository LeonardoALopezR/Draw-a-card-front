// T003 (FR-001, FR-003, FR-004, FR-010): the returning-user sign-in form. Follows
// RegistrationForm's (001-registration-kyc, T011) established conventions exactly: React Hook
// Form + zodResolver (signInSchema, src/domain/schemas.ts) for email/password, the shared
// FormField wrapper for label/inline-error layout, the same TextInput/Pressable/style-constant
// shapes, and a `serverError` prop as the one channel a screen uses to feed a backend error back
// into the form. Unlike RegistrationForm's serverError (which can carry a specific field, e.g.
// "UsernameTaken"), this form's serverError is always general (FR-004): Supabase's own sign-in
// rejection never distinguishes "wrong password" from "unregistered email", so there is no field
// to attribute it to — rendered as one inline banner near the top of the form, never routed
// through react-hook-form's setError for a specific field.
//
// "Forgot password?" is a local UI-state trigger (onForgotPassword), NOT a route change — the
// whole forgot-password flow stays on this same /login screen as extra LoginScreen (T004/T013)
// view-state (spec.md Clarifications, Recorded default 2). "Create account" is this repo's first
// use of expo-router's <Link> for a pure navigation affordance with no side effect (plan.md's
// "First use of expo-router's <Link>" Research Decision) — <Pressable> + router.push is
// deliberately not used here, since <Link> renders a real <a href> on web with no functional
// difference on native.
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { signInSchema, type SignInInput } from "@/domain/schemas";

import { FormField } from "./FormField";

export interface SignInFormProps {
  onSubmit: (input: SignInInput) => void | Promise<void>;
  // Local UI-state trigger only — see this file's top comment. Never a route change.
  onForgotPassword: () => void;
  isSubmitting?: boolean;
  // FR-004: a single, general, non-field-specific inline error for a credentials rejection
  // (wrong password or unregistered email) — mapped upstream by whatever calls signIn (T004's
  // LoginScreen), this component only renders it.
  serverError?: string;
  // 005-login T013: a one-time confirmation banner LoginScreen carries forward when a successful
  // password reset (ResetPasswordForm's submitNewPassword) switches mode back to "sign-in"
  // (spec.md US2 AS3) — rendered distinctly from serverError (neutral copy, not a red error), and
  // never set by this component itself.
  confirmationMessage?: string;
  // 005-login T013: pre-fills the email field after a successful password reset (spec.md US2
  // AS5 — pre-filling the just-submitted email as a convenience is acceptable) — remains fully
  // editable, never read-only. Applied only at mount (this form always remounts fresh when
  // LoginScreen switches back to "sign-in" mode, since it's a different view tree in between).
  initialEmail?: string;
}

export function SignInForm({
  onSubmit,
  onForgotPassword,
  isSubmitting = false,
  serverError,
  confirmationMessage,
  initialEmail,
}: SignInFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: initialEmail ?? "", password: "" },
  });

  const submit = handleSubmit((data) => onSubmit(data));

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Sign in
      </Text>

      {confirmationMessage ? (
        <Text style={styles.confirmation} accessibilityRole="alert" testID="sign-in-confirmation-message">
          {confirmationMessage}
        </Text>
      ) : null}

      {serverError ? (
        <Text style={styles.generalError} accessibilityRole="alert" testID="sign-in-form-error">
          {serverError}
        </Text>
      ) : null}

      <FormField label="Email" error={errors.email?.message} testID="sign-in-email-field">
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
              testID="sign-in-email-input"
            />
          )}
        />
      </FormField>

      <FormField label="Password" error={errors.password?.message} testID="sign-in-password-field">
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
              accessibilityLabel="Password"
              // A returning user's password already exists — "password" (not "password-new",
              // RegistrationForm's hint), matching spec.md's Platform notes ("the standard
              // autoComplete=\"password\"/textContentType hints already used elsewhere").
              autoComplete="password"
              textContentType="password"
              secureTextEntry
              testID="sign-in-password-input"
            />
          )}
        />
      </FormField>

      <Pressable
        style={styles.forgotPasswordButton}
        onPress={onForgotPassword}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Forgot password?"
        accessibilityState={{ disabled: isSubmitting }}
        testID="sign-in-forgot-password-button"
      >
        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
      </Pressable>

      <Pressable
        style={[styles.button, isSubmitting ? styles.buttonDisabled : null]}
        onPress={submit}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
        testID="sign-in-submit-button"
      >
        <Text style={styles.buttonText}>{isSubmitting ? "Signing in…" : "Sign in"}</Text>
      </Pressable>

      <Link
        href="/register"
        style={styles.createAccountLink}
        accessibilityLabel="Create account"
        testID="sign-in-create-account-link"
      >
        Create account
      </Link>
    </View>
  );
}

// Minimum 44x44 tap targets (Constitution VII, SC-003/FR-010) on every interactive element;
// single narrow column, unmodified at a 375px-wide web viewport through tablet/desktop widths —
// mirrors RegistrationForm's layout exactly (docs/conventions.md: no new visual language).
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
  forgotPasswordButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
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
  createAccountLink: {
    minHeight: 44,
    minWidth: 44,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    textAlignVertical: "center",
  },
});
