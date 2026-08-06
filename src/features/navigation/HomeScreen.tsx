import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { homeCopy } from "@/domain/i18n/copy/home";
import { NAV_DESTINATIONS } from "@/domain/navigation";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { ScanEntryCard } from "@/features/scanner/ScanEntryCard";
import { BrandMark } from "@/features/ui/BrandMark";
import { colors, space, typography } from "@/theme";

// T025 (specs/008-scan-experience, FR-013, spec.md Clarifications' Recorded default 1 — Option
// A, confirmed by the human at the approval gate): Inicio's redesigned content. This is no
// longer the screen that owns AmigosQuickAccessPill (retired outright, US6) or TopRightControls
// (now rendered once, shell-wide, by ShellHeader — T008/US1) — this screen renders only its own
// content: a BrandMark + display.xl title + tagline (006-visual-identity's visual language,
// useTranslation(homeCopy), T004), above the existing centre ScanEntryCard (T003,
// 004-home-scan-shell) — reading homeCopy's localized "Escanear una carta"/"Scan a card" via
// ScanEntryCard's optional `label` prop (code review Round 7 Finding 1 fix), so the card's
// visible text and accessible name are both localized, not just the rest of the screen. No
// user-specific data (name, balance, recent activity) is rendered — none of that exists in this
// app yet (Recorded default 1).
export function HomeScreen() {
  const router = useRouter();
  const t = useTranslation(homeCopy);

  // FR-013/spec.md US5 AS2: navigates via NAV_DESTINATIONS' "escanear" entry — never a
  // hardcoded route string — mirroring the exact lookup pattern AmigosQuickAccessPill used for
  // "amigos" before this feature retired that component (US6, T031).
  const handleScanEntryPress = () => {
    const escanearDestination = NAV_DESTINATIONS.find((destination) => destination.key === "escanear");
    if (escanearDestination) {
      router.push(escanearDestination.route);
    }
  };

  return (
    // T020/T021 fix (specs/004-home-scan-shell): a plain `flex: 1` View clips its content
    // against the viewport with no way to recover it — Expo's web output sets `body {
    // overflow: hidden }`, so any content taller than the viewport (e.g. the fixed-height "+"
    // card on a short/narrow landscape-phone viewport, spec.md's Edge Cases) was unreachable,
    // not merely visually cramped. A ScrollView (RN's own internal-scroll primitive, not a new
    // dependency) lets the screen scroll independently instead — matching the edge case's own
    // wording ("the stack may scroll independently") — while `flexGrow: 1` on the content
    // container still centres everything exactly as before whenever it already fits.
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      testID="home-screen"
    >
      <View style={styles.brandBlock} testID="home-screen-brand-block">
        <BrandMark size={72} />
        <Text style={styles.title} accessibilityRole="header">
          {t("title")}
        </Text>
        <Text style={styles.tagline}>{t("tagline")}</Text>
      </View>
      <View style={styles.centre} testID="home-screen-centre">
        <ScanEntryCard onPress={handleScanEntryPress} label={t("scanQuickActionLabel")} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
  },
  brandBlock: {
    alignItems: "center",
    gap: space.sm,
    paddingTop: space.xxl,
    paddingHorizontal: space.lg,
  },
  title: {
    fontSize: typography.display.xl.fontSize,
    fontWeight: typography.display.xl.fontWeight,
    fontFamily: typography.display.xl.fontFamily,
    color: colors.text.primary,
    textAlign: "center",
  },
  tagline: {
    fontSize: typography.body.tagline.fontSize,
    fontWeight: typography.body.tagline.fontWeight,
    color: typography.body.tagline.color,
    textAlign: "center",
  },
  centre: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: space.xl,
  },
});
