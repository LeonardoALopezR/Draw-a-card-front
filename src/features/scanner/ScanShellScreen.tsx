// T043 (specs/006-visual-identity, FR-007, spec.md US3 AS1): the scan screen's mobile/default
// visual shell — a single column, 20px padding, composing the display.lg title "Escanear",
// Viewfinder (T038), ScanSearchField (T039), UploadDropzone (T040), and a "Escanear carta"
// PrimaryButton (T012). This is User Story 3's "visual shell only" screen — every element here
// is inert presentation, and `app/scan.tsx` (a later task) keeps rendering this screen's own
// restyled "Back" affordance around it, unchanged in behavior.
//
// The "Escanear carta" PrimaryButton below is genuinely disabled/no-op: pressing it does
// nothing in this feature (FR-007 — real scan capability, camera capture, and recognition don't
// exist yet, 004-home-scan-shell FR-005 stands unchanged). This is an intentional placeholder,
// not a bug — a future scanner feature is what wires a real `onPress`/enabled state here.
//
// Zero camera-module import anywhere in this file or any file it composes (Viewfinder,
// ScanSearchField, UploadDropzone) — the same FR-007 constraint every other file under
// src/features/scanner/ carries.
//
// ScanShellScreen.web.tsx (T044) is this screen's web-only two/one-column variant, resolved
// purely via the `.web.tsx` file-extension convention (Constitution IV) — no inline
// `Platform.OS` branch exists in either file.
import { ScrollView, StyleSheet, Text } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { PrimaryButton } from "@/features/ui/PrimaryButton";
import { colors, space, typography } from "@/theme";

import { ScanSearchField } from "./ScanSearchField";
import { UploadDropzone } from "./UploadDropzone";
import { Viewfinder } from "./Viewfinder";

export function ScanShellScreen() {
  const t = useTranslation(scanCopy);

  return (
    // A plain flex:1 View would clip taller content against a short viewport with no way to
    // recover it (the same fix HomeScreen.tsx already applies for the same reason) — a
    // ScrollView with a flexGrow:1 content container scrolls independently on a short/narrow
    // viewport while still laying out exactly the same whenever everything already fits.
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      // T050 (accessibility pass): ScanSearchField's TextInput sits inside this ScrollView —
      // without this, RN's default keyboardShouldPersistTaps="never" would swallow the first tap
      // on any other touchable here while that field's keyboard is open (a dead-tap gotcha with
      // no practical effect today since every other control here is disabled/no-op per FR-007,
      // but set defensively/consistently with LoginScreenChrome's identical fix so it doesn't
      // silently resurface once a real scanner feature enables these controls).
      keyboardShouldPersistTaps="handled"
      testID="scan-shell-screen"
    >
      <Text style={styles.title} accessibilityRole="header">
        {t("titleMobile")}
      </Text>
      <Viewfinder />
      <ScanSearchField />
      <UploadDropzone />
      <PrimaryButton
        label={t("scanButton")}
        // FR-007: `disabled` already blocks PrimaryButton's onPress from ever firing (see
        // PrimaryButton.tsx's isDisabled guard) — this no-op is supplied only to satisfy the
        // required prop shape, not because it's ever reachable. Intentional placeholder, not a
        // bug: a future scanner feature replaces both `disabled` and `onPress` once a real scan
        // action exists.
        onPress={() => {}}
        disabled
        testID="scan-shell-button"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.bg.page,
  },
  container: {
    flexGrow: 1,
    padding: space.xl,
    gap: space.lg,
  },
  title: {
    fontSize: typography.display.lg.fontSize,
    fontWeight: typography.display.lg.fontWeight,
    fontFamily: typography.display.lg.fontFamily,
    color: colors.text.primary,
  },
});
