// T039 (specs/006-visual-identity, FR-007/FR-013): the scan screen's search field (brief §5 item
// 3) — a bg.surface pill row, radius.row, CONTROL_HEIGHT, a trailing magnifier glyph. Rendered
// as a genuinely uncontrolled TextInput (no `value`/`onChangeText` prop) — accepting focus and
// typing is fine to leave "live" since typing here triggers no search/filter logic anywhere in
// this feature (FR-007's visual-shell-only constraint, spec.md Assumptions). Wiring this to a
// real search call is a future scanner feature's job, not this restyle's — do not add
// onChangeText/state here without a corresponding spec update.
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, CONTROL_HEIGHT, radius, space, typography } from "@/theme";

export function ScanSearchField() {
  const t = useTranslation(scanCopy);
  const placeholder = t("searchPlaceholder");

  return (
    <View style={styles.row} testID="scan-search-field">
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.text.placeholder}
        accessibilityLabel={placeholder}
      />
      <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: CONTROL_HEIGHT,
    borderRadius: radius.row,
    backgroundColor: colors.bg.surface,
    paddingHorizontal: space.xl,
    gap: space.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.body.input.fontSize,
    fontWeight: typography.body.input.fontWeight,
    color: colors.text.primary,
  },
});
