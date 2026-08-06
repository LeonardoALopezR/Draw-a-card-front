// T011 (001-registration-kyc): shared low-level composition primitive for every form field in
// this feature (and, per this task's brief, the pattern the next screens — ProfileForm
// (T016/T026), VerifyPhoneScreen (T015) — should copy rather than each re-inventing
// label/error layout). Pure UI, no react-hook-form/Zod knowledge of its own (Constitution IV) —
// the caller (RegistrationForm, etc.) owns the field's react-hook-form registration and passes
// rendered state in as props.
//
// T023 (006-visual-identity): restyled to the `Field` spec (docs/design-brief-visual-identity.md
// §3 item 4) — uppercase label.field above a bg.surface, radius.pill, CONTROL_HEIGHT container
// with 20px (space.xl) horizontal padding, borderless with shadow.surface on mobile/default (no
// borderWidth — see FormField.web.tsx for the bordered, no-shadow web counterpart, expressed via
// the .web.tsx convention per Constitution IV, not an inline Platform.OS branch here).
// FormFieldProps (label/error/children/testID) is unchanged so every existing call site
// (RegistrationForm, VerifyPhoneScreen, ProfileForm, SignInForm, RequestPasswordResetForm,
// ResetPasswordForm) keeps compiling with no prop change — this restyle changes appearance only.
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, CONTROL_HEIGHT, radius, shadowSurface, space, typography } from "@/theme";

export interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  testID?: string;
}

// Renders a visible label, the field itself, and — when present — an inline error message
// directly beneath the field (SC-002: validation errors are always inline, never an alert or a
// full-screen replacement). `accessibilityRole="alert"` on the error text is what makes
// VoiceOver/TalkBack announce it as soon as it appears, without requiring the user to
// re-discover the field (Constitution VII).
export function FormField({ label, error, children, testID }: FormFieldProps) {
  return (
    <View style={styles.field} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[styles.inputContainer, shadowSurface]}
        testID={testID ? `${testID}-input` : undefined}
      >
        {children}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: space.xs,
  },
  label: {
    ...typography.label.field,
  },
  inputContainer: {
    height: CONTROL_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.surface,
    paddingHorizontal: space.xl,
    justifyContent: "center",
  },
  // T050 follow-up (T023-T024a review nit): now sources colors.text.danger (src/theme/colors.ts)
  // instead of the raw "#dc2626" literal this restyle originally left in place — see colors.ts's
  // own comment for the computed 4.5:1-clearing rationale (contrast.test.ts regression-guards
  // it).
  error: {
    fontSize: 13,
    color: colors.text.danger,
  },
});
