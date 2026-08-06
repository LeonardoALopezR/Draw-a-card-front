// T027 (specs/008-scan-experience, FR-015): the Cartera destination's stub content only —
// mirrors 004-home-scan-shell's AmigosPlaceholderScreen.tsx shape (a header-role title + a body
// paragraph explaining "no content yet"), but — unlike that original, hardcoded-English
// placeholder, which predates this app's i18n layer — copy routes through
// useTranslation(placeholdersCopy) (src/domain/i18n/copy/placeholders.ts, T005) in both
// locales, per spec.md FR-017. No portfolio/inventory data of any kind (spec.md User Story 6
// AS1) — this screen only reserves the Cartera destination for a future portfolio feature.
import { StyleSheet, Text, View } from "react-native";

import { placeholdersCopy } from "@/domain/i18n/copy/placeholders";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, space } from "@/theme";

export function CarteraPlaceholderScreen() {
  const t = useTranslation(placeholdersCopy);

  return (
    <View style={styles.container} testID="cartera-placeholder-screen">
      <Text style={styles.title} accessibilityRole="header">
        {t("carteraTitle")}
      </Text>
      <Text style={styles.body}>{t("carteraBody")}</Text>
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
