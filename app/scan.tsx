// T016 (specs/004-home-scan-shell), updated by specs/006-visual-identity T045/T046/T047: the
// scanner's route boundary. Originally rendered the ScanPlaceholderScreen stub (T004); that file
// was retired by 006-visual-identity's T046 in favor of the real branded visual shell,
// ScanShellScreen (src/features/scanner/ScanShellScreen.tsx / .web.tsx, T043/T044). This still
// owns only the route boundary and shell content, never camera access, image capture, or card
// recognition (004-home-scan-shell FR-005, 006-visual-identity FR-007). Reached from
// HomeScreen's "+" card (T013/T016, SCAN_ROUTE = "/scan", src/domain/navigation.ts).
//
// This route sits outside the (app) shell group, so it has no persistent tab bar/sidebar of its
// own to return via — a small explicit "Back to Home" affordance (calling expo-router's
// router.back()) is added here so US2 AS2 ("navigate back... shell intact") has a discoverable,
// keyboard/screen-reader-reachable trigger, not just an undiscoverable native swipe gesture or
// browser back button. The Stack pop this triggers is what actually re-renders the intact
// Home/Scan screen and shell underneath — that part is confirmed via a real browser
// back-navigation check (see progress/impl_004-home-scan-shell.md), not by this file's own
// unit test, which can only observe /scan in isolation.
//
// T047 (006-visual-identity, FR-009): the "Back" affordance's *behavior* is unchanged (still
// `router.back()`, same accessibilityLabel/testID so T048's existing press assertion keeps
// passing unmodified) — only its visual styling now traces to src/theme's tokens (a `bg.surface`
// pill chip, `radius.pill`, `shadowSurface`, a chevron glyph) instead of hardcoded hex/px values.
//
// A note on the `docs/conventions.md`-sanctioned single-value `Platform.select` this task
// flagged as acceptable for "the icon/label color against the two different backgrounds": as
// built, `ScanShellScreen.tsx` (mobile) and `ScanShellScreen.web.tsx` (web) both fill with the
// *same* token, `colors.bg.page` — confirmed by reading both files — so there is no genuine
// mobile-vs-web background difference for this button's color to key off of today. A
// `Platform.select` with two identical branches would be dead code (and would contradict this
// same task's "don't over-engineer" instruction), so this file uses one shared
// `colors.text.primary` value for both platforms instead. The allowance remains available,
// unused, should a real divergence appear later (e.g. if `/scan` ever gains web-only chrome).
//
// T050 (specs/006-visual-identity, accessibility pass): the "Back"/"Back to Home" label and
// accessibilityLabel were hardcoded English literals here — FR-010 already reserved
// `scanCopy.{es,en}.backLabel`/`backAccessibilityLabel` for exactly this button (see
// src/domain/i18n/copy/scan.ts's own top comment) but this file never actually consumed them.
// Fixed to route through useTranslation(scanCopy) like every other string on this screen.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { ScanShellScreen } from "@/features/scanner/ScanShellScreen";
import { colors, radius, shadowSurface, space, typography } from "@/theme";

export default function ScanRouteScreen() {
  const router = useRouter();
  const t = useTranslation(scanCopy);

  return (
    <View style={styles.container} testID="scan-route-screen">
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t("backAccessibilityLabel")}
        style={styles.backButton}
        testID="scan-back-button"
      >
        <Ionicons name="chevron-back" size={18} color={colors.text.primary} />
        <Text style={styles.backLabel}>{t("backLabel")}</Text>
      </Pressable>
      <ScanShellScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: space.lg,
    left: space.lg,
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.surface,
    zIndex: 1,
    ...shadowSurface,
  },
  backLabel: {
    fontSize: typography.button.label.fontSize,
    fontWeight: typography.button.label.fontWeight,
    color: colors.text.primary,
  },
});
