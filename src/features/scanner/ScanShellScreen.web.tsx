// T044 (specs/006-visual-identity, FR-007, spec.md US3 AS2/AS3): the scan screen's web-only
// visual shell — reads useWindowDimensions() and reuses src/domain/navigation.ts's existing
// BREAKPOINT_PX (004-home-scan-shell's own established 768px constant, NOT redefined here) to
// pick a two-column layout at/above the breakpoint or a one-column layout below it — the exact
// useWindowDimensions()-against-BREAKPOINT_PX pattern app/(app)/_layout.web.tsx already
// established for the same breakpoint (Constitution IV: the `.web.tsx` extension itself is the
// platform split, no inline `Platform.OS` branch anywhere in this file).
//
// >=768px: two columns — left: display.lg title "Escanear carta" beside a StatusPill "Cámara
// disponible" (T015), then Viewfinder/ScanSearchField/UploadDropzone/PrimaryButton stacked;
// right: EmptyResultsPanel (T041) above RecentScansList (T042). <768px: the two columns
// collapse to one — controls first, then the results panel/list below (brief §5.2's last
// sentence). The existing web sidebar (`app/(app)/_layout.web.tsx`) is unchanged by this file —
// per spec.md Clarifications' Recorded default 3, `/scan` stays outside the app shell, so this
// component renders only the main-area content, not a sidebar of its own.
//
// Same FR-007 placeholder note as ScanShellScreen.tsx: "Escanear carta" is a genuinely disabled,
// no-op PrimaryButton — pressing it does nothing in this feature (no real scan capability exists
// yet, 004-home-scan-shell FR-005 stands unchanged). Zero camera-module import anywhere in this
// file or any file it composes.
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { BREAKPOINT_PX } from "@/domain/navigation";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { PrimaryButton } from "@/features/ui/PrimaryButton";
import { StatusPill } from "@/features/ui/StatusPill";
import { colors, space, typography } from "@/theme";

import { EmptyResultsPanel } from "./EmptyResultsPanel";
import { RecentScansList } from "./RecentScansList";
import { ScanSearchField } from "./ScanSearchField";
import { UploadDropzone } from "./UploadDropzone";
import { Viewfinder } from "./Viewfinder";

export function ScanShellScreen() {
  const t = useTranslation(scanCopy);
  const { width } = useWindowDimensions();
  const isTwoColumn = width >= BREAKPOINT_PX;

  const controls = (
    <View style={styles.column} testID="scan-shell-controls-column">
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header">
          {t("titleWeb")}
        </Text>
        <StatusPill label={t("statusPillCameraAvailable")} />
      </View>
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
    </View>
  );

  const results = (
    <View style={styles.column} testID="scan-shell-results-column">
      <EmptyResultsPanel />
      <RecentScansList />
    </View>
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      // T050 (accessibility pass): same fix as ScanShellScreen.tsx (mobile) — see that file's
      // comment.
      keyboardShouldPersistTaps="handled"
      testID="scan-shell-screen"
    >
      <View style={isTwoColumn ? styles.rowLayout : styles.stackedLayout}>
        {controls}
        {results}
      </View>
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
    padding: space.xxl,
  },
  rowLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.xxl,
  },
  stackedLayout: {
    flexDirection: "column",
    gap: space.xxl,
  },
  column: {
    flex: 1,
    gap: space.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  title: {
    fontSize: typography.display.lg.fontSize,
    fontWeight: typography.display.lg.fontWeight,
    fontFamily: typography.display.lg.fontFamily,
    color: colors.text.primary,
  },
});
