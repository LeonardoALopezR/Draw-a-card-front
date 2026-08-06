// T044 (specs/006-visual-identity, FR-007, spec.md US3 AS2/AS3): the scan screen's web-only
// visual shell — reads useWindowDimensions() and reuses src/domain/navigation.ts's existing
// BREAKPOINT_PX (004-home-scan-shell's own established 768px constant, NOT redefined here) to
// pick a two-column layout at/above the breakpoint or a one-column layout below it — the exact
// useWindowDimensions()-against-BREAKPOINT_PX pattern app/(app)/_layout.web.tsx already
// established for the same breakpoint (Constitution IV: the `.web.tsx` extension itself is the
// platform split, no inline `Platform.OS` branch anywhere in this file).
//
// specs/008-scan-experience/tasks.md T021 (US4, FR-005, FR-006, spec.md User Story 4 AS1-AS3):
// `Viewfinder`, the "Escanear carta" `PrimaryButton`, and the `StatusPill` "Cámara disponible"
// badge are removed from this file ENTIRELY — this is decision 2's structural, not conditional,
// deviation from the supplied web mockup (spec.md Clarifications' settled decision 2 and its
// Design-note extension): web genuinely has no camera scanner, so there is no `Viewfinder` import
// anywhere in this file for any future prop change to resurrect. The left ("controls") column now
// holds only the title, `ScanSearchField`, and `UploadDropzone`. `useScanSimulation()` (T013) is
// called here directly; `ScanSearchField`'s `onSubmit` and `UploadDropzone`'s `onPress` are both
// wired to `triggerScan()` — the only two triggers that exist on web (spec.md's Design note: no
// viewfinder/button exists on web to trigger from). The right ("results") column renders
// `EmptyResultsPanel` at idle or the shared `FoundCardPanel` (T014, used unmodified — same
// props-driven component `ScanShellScreen.tsx`, mobile, already reuses) once a card is found,
// always followed by `RecentScansList` (T022), which keeps rendering regardless of idle/found
// state (spec.md User Story 4 AS2).
//
// FR-009's "Aceptar gives a visible confirmation, never a silent no-op" is handled the same way
// `ScanShellScreen.tsx` (mobile, T018) handles it: `FoundCardPanel` deliberately has no
// `confirming` prop (see FoundCardPanel.tsx's own T014 notes), so the brief confirmation line is
// rendered here, one level up, using `useScanSimulation()`'s own `confirming` flag directly.
//
// Zero camera-module import anywhere in this file or any file it composes (ScanSearchField,
// UploadDropzone, FoundCardPanel, EmptyResultsPanel, RecentScansList, useScanSimulation) — the
// same FR-007/FR-016 constraint every other file under src/features/scanner/ carries, regression-
// guarded by ScanShellScreen.test.tsx's camera-import source-inspection guard (T023).
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { BREAKPOINT_PX } from "@/domain/navigation";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, space, typography } from "@/theme";

import { EmptyResultsPanel } from "./EmptyResultsPanel";
import { FoundCardPanel } from "./FoundCardPanel";
import { RecentScansList } from "./RecentScansList";
import { ScanSearchField } from "./ScanSearchField";
import { UploadDropzone } from "./UploadDropzone";
import { useScanSimulation } from "./useScanSimulation";

export function ScanShellScreen() {
  const t = useTranslation(scanCopy);
  const { width } = useWindowDimensions();
  const isTwoColumn = width >= BREAKPOINT_PX;
  const {
    result,
    confirming,
    triggerScan,
    changeCard,
    removeCard,
    acceptCard,
    selectCondition,
    toggleGraded,
    incrementQuantity,
    decrementQuantity,
  } = useScanSimulation();

  const controls = (
    <View style={styles.column} testID="scan-shell-controls-column">
      <Text style={styles.title} accessibilityRole="header">
        {t("titleWeb")}
      </Text>
      <ScanSearchField onSubmit={triggerScan} />
      <UploadDropzone onPress={triggerScan} />
    </View>
  );

  const results = (
    <View style={styles.column} testID="scan-shell-results-column">
      {result ? (
        <FoundCardPanel
          state={result}
          onSelectCondition={selectCondition}
          onToggleGraded={toggleGraded}
          onIncrement={incrementQuantity}
          onDecrement={decrementQuantity}
          onChange={changeCard}
          onRemove={removeCard}
          onAccept={acceptCard}
        />
      ) : (
        <EmptyResultsPanel />
      )}
      {confirming ? (
        // FR-009: same real, visible, accessibilityRole="alert" confirmation ScanShellScreen.tsx
        // (mobile) renders — see that file's own comment for the full reasoning.
        <Text
          style={styles.confirmation}
          accessibilityRole="alert"
          testID="scan-shell-accepted-confirmation"
        >
          {t("acceptedConfirmation")}
        </Text>
      ) : null}
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
  title: {
    fontSize: typography.display.lg.fontSize,
    fontWeight: typography.display.lg.fontWeight,
    fontFamily: typography.display.lg.fontFamily,
    color: colors.text.primary,
  },
  confirmation: {
    fontSize: typography.body.link.fontSize,
    fontWeight: "700",
    color: colors.accent.priceGreen,
    textAlign: "center",
  },
});
