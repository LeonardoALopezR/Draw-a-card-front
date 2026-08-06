// T040 (specs/006-visual-identity, FR-007/FR-013): the scan screen's upload dropzone (brief §5
// item 4) — a dashed border.dashed panel with a leading upload glyph and centered copy.
//
// specs/008-scan-experience/tasks.md T017 (US3, FR-007): a DISCLOSED behavior change from
// 006-visual-identity's intentionally inert version above — this feature makes the dropzone a
// genuine local trigger (spec.md's Design note on the found-state triggers), so it is now a real
// `Pressable` with `accessibilityRole="button"`, a real `accessibilityLabel` (the existing
// `uploadDropzone` copy, already reviewed for this by T006), and an `onPress` prop. It still
// never calls `expo-image-picker` or opens any real file/capture surface — `onPress` only feeds
// `useScanSimulation().triggerScan()` (T018), never inspecting a real uploaded image (FR-016).
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, radius, space, typography } from "@/theme";

export interface UploadDropzoneProps {
  readonly onPress?: () => void;
}

export function UploadDropzone({ onPress }: UploadDropzoneProps) {
  const t = useTranslation(scanCopy);
  const label = t("uploadDropzone");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.dropzone}
      testID="upload-dropzone"
    >
      <Ionicons name="cloud-upload-outline" size={20} color={colors.text.secondary} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dropzone: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
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
