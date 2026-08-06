// T013 (specs/006-visual-identity): the app's secondary action control (brief §3 item 3) —
// same geometry as PrimaryButton (full-width, CONTROL_HEIGHT, radius.pill), bg.surface fill,
// border.subtle 1px, text.primary bold centered label. Flat, no shadow — the brief (§3.2/§3.3)
// only calls out shadow.raised for the primary button, and no disabled-opacity rule for the
// secondary one, so neither is invented here. Same prop shape as PrimaryButton so the two are
// interchangeable at call sites. Every value traces to src/theme's semantic tokens (FR-001).
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, CONTROL_HEIGHT, radius, typography } from "@/theme";

export interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  busy = false,
  testID,
  accessibilityLabel,
}: SecondaryButtonProps) {
  const isDisabled = disabled || busy;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
      style={styles.button}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: CONTROL_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.text.primary,
    fontSize: typography.button.label.fontSize,
    fontWeight: typography.button.label.fontWeight,
  },
});
