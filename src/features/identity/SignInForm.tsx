// T003 (FR-001, FR-003, FR-004, FR-010): the returning-user sign-in form. Follows
// RegistrationForm's (001-registration-kyc, T011) established conventions exactly: React Hook
// Form + zodResolver (signInSchema, src/domain/schemas.ts) for email/password, the shared
// FormField wrapper for label/inline-error layout, a `serverError` prop as the one channel a
// screen uses to feed a backend error back into the form. Unlike RegistrationForm's serverError
// (which can carry a specific field, e.g. "UsernameTaken"), this form's serverError is always
// general (FR-004): Supabase's own sign-in rejection never distinguishes "wrong password" from
// "unregistered email", so there is no field to attribute it to — rendered as one inline banner
// near the top of the form, never routed through react-hook-form's setError for a specific field.
//
// "Forgot password?" is a local UI-state trigger (onForgotPassword), NOT a route change — the
// whole forgot-password flow stays on this same /login screen as extra LoginScreen (T004/T013)
// view-state (spec.md Clarifications, Recorded default 2). "Create account" is this repo's first
// use of expo-router's <Link> for a pure navigation affordance with no side effect (plan.md's
// "First use of expo-router's <Link>" Research Decision) — <Pressable> + router.push is
// deliberately not used here, since <Link> renders a real <a href> on web with no functional
// difference on native.
//
// T028 (006-visual-identity, FR-006, spec.md US2 AS3/AS6): restyled to docs/design-brief-visual-
// identity.md §4's items 4-10 — this file owns the email/password Field pair, the right-aligned
// "Olvidé mi contraseña" link, the "Entrar" PrimaryButton, the OrDivider, the "Crear cuenta"
// SecondaryButton-styled Link, and the legal line. Items 1-3 (BrandMark/title/tagline) are
// LoginScreen.tsx's responsibility (T034), not this file's. Every rendered string now resolves
// through useTranslation(loginCopy) — zero hardcoded copy remains. Every existing prop
// (onSubmit/onForgotPassword/isSubmitting/serverError/confirmationMessage/initialEmail) and the
// react-hook-form + zodResolver(signInSchema) wiring are byte-for-byte unchanged — this restyle
// touches only the returned JSX/styles.
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { signInSchema, type SignInInput } from "@/domain/schemas";
import { loginCopy } from "@/domain/i18n/copy/login";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, CONTROL_HEIGHT, radius, space, typography } from "@/theme";
import { OrDivider } from "@/features/ui/OrDivider";
import { PrimaryButton } from "@/features/ui/PrimaryButton";

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
  const t = useTranslation(loginCopy);
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

      <FormField label={t("emailLabel")} error={errors.email?.message} testID="sign-in-email-field">
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
              testID="sign-in-email-input"
            />
          )}
        />
      </FormField>

      <FormField label={t("passwordLabel")} error={errors.password?.message} testID="sign-in-password-field">
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
              accessibilityLabel={t("passwordLabel")}
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

      {/* Brief §4 item 6: right-aligned body.link, still the same local onForgotPassword
          UI-state trigger — never a route change (FR-006). */}
      <Pressable
        style={styles.forgotPasswordButton}
        onPress={onForgotPassword}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={t("forgotPassword")}
        accessibilityState={{ disabled: isSubmitting }}
        testID="sign-in-forgot-password-button"
      >
        <Text style={styles.forgotPasswordText}>{t("forgotPassword")}</Text>
      </Pressable>

      {/* Brief §4 item 7. */}
      <PrimaryButton
        label={isSubmitting ? t("signingIn") : t("signInButton")}
        onPress={submit}
        busy={isSubmitting}
        testID="sign-in-submit-button"
      />

      {/* Brief §4 item 8. */}
      <OrDivider />

      {/* Brief §4 item 9: SecondaryButton's visual vocabulary applied directly to the existing
          <Link href="/register"> — expo-router's <Link> renders as a Text-backed navigation
          element, not a Pressable, so it can't literally host the SecondaryButton component
          (which takes onPress, not href); the navigation behavior itself is unchanged. */}
      <Link
        href="/register"
        style={styles.createAccountLink}
        accessibilityLabel={t("createAccount")}
        testID="sign-in-create-account-link"
      >
        {t("createAccount")}
      </Link>

      {/* Brief §4 item 10: both link phrases nested as separate <Text> children so they can
          carry text.link's color independently while inheriting body.legal's other properties
          (typography.ts's documented convention). */}
      <Text style={styles.legal}>
        {t("legalPrefix")}{" "}
        <Text style={styles.legalLink}>{t("termsLink")}</Text>
        {" "}
        {t("legalMiddle")}{" "}
        <Text style={styles.legalLink}>{t("privacyLink")}</Text>
      </Text>
    </View>
  );
}

// Minimum 44x44 tap targets (Constitution VII, FR-013) on every interactive element;
// single narrow column, unmodified at a 375px-wide web viewport through tablet/desktop widths.
const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 420,
    gap: space.lg,
  },
  // T050 follow-up (T023-T024a review nit): sources colors.text.danger instead of the raw
  // "#dc2626" literal — see FormField.tsx's and src/theme/colors.ts's comments.
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
  forgotPasswordButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    fontSize: typography.body.link.fontSize,
    fontWeight: typography.body.link.fontWeight,
    color: typography.body.link.color,
  },
  createAccountLink: {
    width: "100%",
    height: CONTROL_HEIGHT,
    lineHeight: CONTROL_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    color: colors.text.primary,
    fontSize: typography.button.label.fontSize,
    fontWeight: typography.button.label.fontWeight,
    textAlign: "center",
    // Android-only; iOS/web center via the matching lineHeight above instead.
    textAlignVertical: "center",
  },
  legal: {
    fontSize: typography.body.legal.fontSize,
    fontWeight: typography.body.legal.fontWeight,
    textAlign: typography.body.legal.textAlign,
    color: typography.body.legal.color,
  },
  legalLink: {
    color: colors.text.link,
  },
});
