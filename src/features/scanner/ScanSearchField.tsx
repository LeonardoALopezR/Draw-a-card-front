// T039 (specs/006-visual-identity, FR-007/FR-013): the scan screen's search field (brief §5 item
// 3) — a bg.surface pill row, radius.row, CONTROL_HEIGHT, a trailing magnifier glyph. Rendered
// as a genuinely uncontrolled TextInput (no `value`/`onChangeText` prop) — accepting focus and
// typing is fine to leave "live" since typing here triggers no search/filter logic anywhere in
// this feature (FR-007's visual-shell-only constraint, spec.md Assumptions). Wiring this to a
// real search call is a future scanner feature's job, not this restyle's — do not add
// onChangeText/state here without a corresponding spec update.
//
// specs/008-scan-experience/tasks.md T016 (US3, FR-007): an optional `onSubmit` prop, wired to
// the TextInput's `onSubmitEditing` (Enter/Return) and the now-pressable trailing magnifier
// glyph — one of the three local "found" triggers spec.md's Design note documents (the other two
// are ScanShellScreen's "Escanear carta" button and UploadDropzone's onPress, T017/T018).
// `onSubmit` never inspects what was typed (FR-016 — this is a local simulate-a-match trigger,
// not a real search), and omitting the prop renders/behaves exactly as before (no crash) so this
// stays a safe, backward-compatible change for any consumer that doesn't wire it yet.
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, CONTROL_HEIGHT, radius, space, typography } from "@/theme";

export interface ScanSearchFieldProps {
  readonly onSubmit?: () => void;
}

export function ScanSearchField({ onSubmit }: ScanSearchFieldProps) {
  const t = useTranslation(scanCopy);
  const placeholder = t("searchPlaceholder");

  return (
    <View style={styles.row} testID="scan-search-field">
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.text.placeholder}
        accessibilityLabel={placeholder}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      <Pressable
        onPress={onSubmit}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        style={styles.submitButton}
        testID="scan-search-submit"
      >
        <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
      </Pressable>
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
  // ≥44x44 tap target (Constitution VII) for the now-pressable magnifier glyph, without growing
  // the visible 20px icon itself — same centered-padding technique FoundCardPanel's toggle track
  // already uses.
  submitButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
