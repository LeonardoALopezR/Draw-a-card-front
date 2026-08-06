// T015 (specs/006-visual-identity): a status indicator, not a control — accent.pillBg fill,
// text.link label color, radius.pill, sized to content (not full-width). Used non-interactively
// for "Cámara disponible" on the scan screen (brief §5.2). Carries no accessibilityRole implying
// interactivity, so a screen reader doesn't announce it as a button (spec.md US3 AS4). Every
// value traces to src/theme's semantic tokens (FR-001).
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, space, typography } from "@/theme";

export interface StatusPillProps {
  label: string;
}

export function StatusPill({ label }: StatusPillProps) {
  return (
    <View style={styles.pill} testID="status-pill">
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent.pillBg,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    // brief §3 item 6 only specifies "small horizontal padding" — no vertical value is given,
    // so space.sm is the nearest token rather than an unsourced literal (FR-001).
    paddingVertical: space.sm,
  },
  label: {
    color: colors.text.link,
    fontSize: typography.body.link.fontSize,
    fontWeight: typography.body.link.fontWeight,
  },
});
