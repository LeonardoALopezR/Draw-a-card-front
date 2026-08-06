// T012 (specs/006-visual-identity): the app's primary call-to-action control (brief §3 item 2)
// — full-width, CONTROL_HEIGHT, radius.pill, brand.primary fill, brand.onPrimary bold centered
// label, shadow.raised. Disabled renders at 60% opacity and exposes
// accessibilityState.disabled, so a blocked action is visible to both sighted and screen-reader
// users (Constitution VII). Every value traces to src/theme's semantic tokens (FR-001) — no raw
// hex/magic-number literal here.
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, CONTROL_HEIGHT, radius, shadowRaised, typography } from "@/theme";

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  busy = false,
  testID,
  accessibilityLabel,
}: PrimaryButtonProps) {
  const isDisabled = disabled || busy;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
      style={[styles.button, shadowRaised, isDisabled && styles.disabled]}
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
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    color: colors.brand.onPrimary,
    fontSize: typography.button.label.fontSize,
    fontWeight: typography.button.label.fontWeight,
  },
});
