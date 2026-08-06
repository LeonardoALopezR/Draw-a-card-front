// T029 (specs/008-scan-experience, FR-015): the Perfil destination's stub content only —
// mirrors CarteraPlaceholderScreen.tsx's/TradesPlaceholderScreen.tsx's shape (T027/T028), with
// copy routed through useTranslation(placeholdersCopy) (src/domain/i18n/copy/placeholders.ts,
// T005) in both locales, per spec.md FR-017. No real profile data of any kind (spec.md User
// Story 6 AS3) — this screen only reserves the Perfil destination for a future profile-view
// feature, and is explicitly a DIFFERENT component from ProfileForm.tsx (the registration
// flow's form for collecting/submitting profile data during KYC onboarding, a wholly separate
// purpose from this contentless shell placeholder — they share no code and are never rendered
// interchangeably).
import { StyleSheet, Text, View } from "react-native";

import { placeholdersCopy } from "@/domain/i18n/copy/placeholders";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, space } from "@/theme";

export function PerfilPlaceholderScreen() {
  const t = useTranslation(placeholdersCopy);

  return (
    <View style={styles.container} testID="perfil-placeholder-screen">
      <Text style={styles.title} accessibilityRole="header">
        {t("perfilTitle")}
      </Text>
      <Text style={styles.body}>{t("perfilBody")}</Text>
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
