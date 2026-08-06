// T024 (006-visual-identity): web counterpart of FormField.tsx (T023) — same props/structure
// (FormFieldProps unchanged), web treatment per docs/design-brief-visual-identity.md §3 item 4:
// 1px border.input, no shadow (mobile/default gets shadow.surface and no border instead — see
// FormField.tsx). The platform split is expressed entirely via this file's `.web.tsx` extension
// (Constitution IV/FR-005), not an inline Platform.OS branch inside a shared component body.
//
// T004 (specs/010-registration-redesign, FR-006): adds the same optional `labelCase` prop as
// FormField.tsx, defaulting to "uppercase" for the identical backward-compatibility reason — see
// that file's comment.
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, CONTROL_HEIGHT, radius, space, typography } from "@/theme";

export interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  testID?: string;
  labelCase?: "uppercase" | "sentence";
}

export function FormField({ label, error, children, testID, labelCase = "uppercase" }: FormFieldProps) {
  return (
    <View style={styles.field} testID={testID}>
      <Text style={labelCase === "sentence" ? styles.labelSentence : styles.label}>{label}</Text>
      <View style={styles.inputContainer} testID={testID ? `${testID}-input` : undefined}>
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
  labelSentence: {
    ...typography.label.fieldSentence,
  },
  inputContainer: {
    height: CONTROL_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.surface,
    paddingHorizontal: space.xl,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.input,
  },
  // T050 follow-up (T023-T024a review nit): kept identical to FormField.tsx's fix — see that
  // file's comment and src/theme/colors.ts's own comment on colors.text.danger.
  error: {
    fontSize: 13,
    color: colors.text.danger,
  },
});
