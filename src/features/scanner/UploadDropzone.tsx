// T040 (specs/006-visual-identity, FR-007/FR-013): the scan screen's upload dropzone (brief §5
// item 4) — a dashed border.dashed panel with a leading upload glyph and centered copy.
// Non-interactive in this feature: no expo-image-picker call, no press handler. A future
// scanner feature is what turns this into an actual file-picker trigger; until then it's
// rendered as static informational content (no accessibilityRole implying a control), so a
// screen reader never announces it as a button it doesn't back up with behavior (spec.md US3
// AS4).
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, radius, space, typography } from "@/theme";

export function UploadDropzone() {
  const t = useTranslation(scanCopy);

  return (
    <View style={styles.dropzone} testID="upload-dropzone">
      <Ionicons name="cloud-upload-outline" size={20} color={colors.text.secondary} />
      <Text style={styles.label}>{t("uploadDropzone")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dropzone: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border.dashed,
    borderRadius: radius.row,
    paddingVertical: space.lg,
    gap: space.sm,
  },
  label: {
    ...typography.body.tagline,
    color: colors.text.secondary,
  },
});
