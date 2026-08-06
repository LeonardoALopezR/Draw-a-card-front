// T014 (specs/006-visual-identity): a full-width hairline rule broken in the middle by a small
// centered lowercase "o" (brief §3 item 5), used between PrimaryButton "Entrar" and
// SecondaryButton "Crear cuenta" on the login screen. Purely decorative layout — not
// interactive, so it carries no accessibilityRole implying a control. Every value traces to
// src/theme's semantic tokens (FR-001).
import { StyleSheet, Text, View } from "react-native";

import { colors, space } from "@/theme";

export function OrDivider() {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>o</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  label: {
    marginHorizontal: space.md,
    color: colors.text.secondary,
    backgroundColor: colors.bg.page,
  },
});
