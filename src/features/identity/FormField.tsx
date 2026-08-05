// T011: shared low-level composition primitive for every form field in this feature (and, per
// this task's brief, the pattern the next screens — ProfileForm (T016/T026), VerifyPhoneScreen
// (T015) — should copy rather than each re-inventing label/error layout). Pure UI, no
// react-hook-form/Zod knowledge of its own (Constitution IV) — the caller (RegistrationForm,
// etc.) owns the field's react-hook-form registration and passes rendered state in as props.
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

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
      {children}
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
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  error: {
    fontSize: 13,
    color: "#dc2626",
  },
});
