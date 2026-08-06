// T043 (specs/006-visual-identity, FR-007, spec.md US3 AS1): the scan screen's mobile/default
// visual shell — a single column, 20px padding, composing the display.lg title "Escanear",
// Viewfinder (T038), ScanSearchField (T039), UploadDropzone (T040), and a "Escanear carta"
// PrimaryButton (T012).
//
// specs/008-scan-experience/tasks.md T018 (US3, FR-004, FR-007, FR-008): this screen now lives
// inside the persistent 5-destination shell (app/(app)/escanear.tsx, T019) instead of behind a
// standalone route, and wires `useScanSimulation()` (T013) end to end — the "Escanear carta"
// button is enabled, `ScanSearchField`'s `onSubmit` (T016) and `UploadDropzone`'s `onPress`
// (T017) both call `triggerScan()` (spec.md's Design note: every trigger fires the same local
// simulate-a-match action), `Viewfinder` (T015) switches to its found drawing whenever a result
// exists, and `FoundCardPanel` (T014) renders inline below the controls with that same hook's
// state/handlers when a card is found.
//
// FR-009 ("Aceptar" gives a VISIBLE confirmation, never a silent no-op): `FoundCardPanel` (T014)
// deliberately has no `confirming` prop (see this feature's Run 4 progress notes on T014) — that
// hook state is rendered here instead, one level up, as a small `alert`-role confirmation line
// (`t("acceptedConfirmation")`) below the panel while `useScanSimulation()`'s `confirming` flag
// is true.
//
// Zero camera-module import anywhere in this file or any file it composes (Viewfinder,
// ScanSearchField, UploadDropzone, FoundCardPanel, useScanSimulation) — the same FR-007/FR-016
// constraint every other file under src/features/scanner/ carries.
//
// ScanShellScreen.web.tsx (T044/T021) is this screen's web-only two/one-column variant, resolved
// purely via the `.web.tsx` file-extension convention (Constitution IV) — no inline
// `Platform.OS` branch exists in either file.
//
// A note on spec.md User Story 3 AS4 ("navigate away via the shell and back resets to idle"):
// this screen intentionally does NOT reset its own state on blur/focus — the fix lives one
// layer up, in `app/(app)/_layout.tsx`'s Escanear `<Tabs.Screen options={{ unmountOnBlur: true
// }}>` (T020a, orchestrator decision 2026-08-05, option (a); see
// progress/impl_008-scan-experience.md's AS4 follow-up entry). `@react-navigation/bottom-tabs`
// keeps inactive tab screens mounted by default (`unmountOnBlur` defaults to `false`), so
// without that option this screen's local `useScanSimulation()` state would survive a tab
// switch instead of resetting. A `useFocusEffect`-based reset here in the component itself was
// prototyped and rejected: it makes `useNavigation()` throw in every bare
// (`render(<ScanShellScreen />)`, no `<NavigationContainer>`) test this file and
// `app/(app)/escanear.test.tsx` use — the `unmountOnBlur` fix needs no such mock, since it is a
// navigator-level option never executed by this component.
import { ScrollView, StyleSheet, Text } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { PrimaryButton } from "@/features/ui/PrimaryButton";
import { colors, space, typography } from "@/theme";

import { FoundCardPanel } from "./FoundCardPanel";
import { ScanSearchField } from "./ScanSearchField";
import { UploadDropzone } from "./UploadDropzone";
import { useScanSimulation } from "./useScanSimulation";
import { Viewfinder } from "./Viewfinder";

export function ScanShellScreen() {
  const t = useTranslation(scanCopy);
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
      // on any other touchable here while that field's keyboard is open.
      keyboardShouldPersistTaps="handled"
      testID="scan-shell-screen"
    >
      <Text style={styles.title} accessibilityRole="header">
        {t("titleMobile")}
      </Text>
      <Viewfinder state={result ? "found" : "idle"} />
      <ScanSearchField onSubmit={triggerScan} />
      <UploadDropzone onPress={triggerScan} />
      <PrimaryButton
        label={t("scanButton")}
        onPress={triggerScan}
        testID="scan-shell-button"
      />
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
      ) : null}
      {confirming ? (
        // FR-009: a real, visible confirmation — `accessibilityRole="alert"` so screen readers
        // announce it proactively, matching this repo's other live-feedback precedent (e.g.
        // TopRightControls' "not yet available" inline text).
        <Text
          style={styles.confirmation}
          accessibilityRole="alert"
          testID="scan-shell-accepted-confirmation"
        >
          {t("acceptedConfirmation")}
        </Text>
      ) : null}
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
  confirmation: {
    fontSize: typography.body.link.fontSize,
    fontWeight: "700",
    color: colors.accent.priceGreen,
    textAlign: "center",
  },
});
