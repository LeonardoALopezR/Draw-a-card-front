// T041 (specs/006-visual-identity, FR-007): the scan screen's empty-results panel (brief §5.2,
// right column). Web-only in practice — it's rendered exclusively from ScanShellScreen.web.tsx's
// two/one-column composition (a later task) — but this file itself carries no platform branch of
// its own, since the panel's markup doesn't differ by platform; it's simply unused on the mobile
// composition. Purely presentational: a dashed panel, a centered playing-card glyph, and two
// lines of static copy.
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, radius, space, typography } from "@/theme";

export function EmptyResultsPanel() {
  const t = useTranslation(scanCopy);

  return (
    <View style={styles.panel} testID="empty-results-panel">
      <MaterialCommunityIcons name="cards-outline" size={40} color={colors.text.secondary} />
      <Text style={styles.primaryLine}>{t("emptyResultsLine1")}</Text>
      <Text style={styles.secondaryLine}>{t("emptyResultsLine2")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border.dashed,
    borderRadius: radius.panel,
    paddingHorizontal: space.xxl,
    gap: space.sm,
  },
  primaryLine: {
    ...typography.body.tagline,
    textAlign: "center",
  },
  secondaryLine: {
    ...typography.body.legal,
    color: colors.text.placeholder,
  },
});
