// T028 (specs/008-scan-experience, FR-015): the Trades destination's stub content only —
// mirrors CarteraPlaceholderScreen.tsx's shape (T027, itself mirroring 004-home-scan-shell's
// AmigosPlaceholderScreen.tsx pattern), with copy routed through
// useTranslation(placeholdersCopy) (src/domain/i18n/copy/placeholders.ts, T005) in both
// locales, per spec.md FR-017. No trade/offer data of any kind (spec.md User Story 6 AS2) —
// this screen only reserves the Trades destination for a future trading feature.
import { StyleSheet, Text, View } from "react-native";

import { placeholdersCopy } from "@/domain/i18n/copy/placeholders";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, space } from "@/theme";

export function TradesPlaceholderScreen() {
  const t = useTranslation(placeholdersCopy);

  return (
    <View style={styles.container} testID="trades-placeholder-screen">
      <Text style={styles.title} accessibilityRole="header">
        {t("tradesTitle")}
      </Text>
      <Text style={styles.body}>{t("tradesBody")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xxl,
    gap: space.md,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text.primary,
  },
  body: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 320,
  },
});
