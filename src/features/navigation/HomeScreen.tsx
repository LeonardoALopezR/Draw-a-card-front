import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SCAN_ROUTE } from "@/domain/navigation";
import { ScanEntryCard } from "@/features/scanner/ScanEntryCard";

import { AmigosQuickAccessPill } from "./AmigosQuickAccessPill";
import { TopRightControls } from "./TopRightControls";

// T013 (specs/004-home-scan-shell): the Home/Scan screen itself — composes
// AmigosQuickAccessPill (T008, top-left), TopRightControls (T007, top-right vertical stack),
// and ScanEntryCard (T003, dead centre) per the wireframe's layout (FR-004, FR-006, FR-008).
// This component only renders those already-tested pieces (Constitution IV — no business logic
// here). T016 (User Story 2): ScanEntryCard's onPress now navigates to SCAN_ROUTE
// (src/domain/navigation.ts, the shared route table — not a hardcoded "/scan" literal, so this
// can never drift from app/scan.tsx's own route) via expo-router's useRouter().push, mirroring
// AmigosQuickAccessPill's own established push-from-shared-table pattern.
export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleScanEntryPress = () => {
    router.push(SCAN_ROUTE);
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
      <View
        testID="home-screen-top-row"
        style={[
          styles.topRow,
          // T020 fix: a real-device screenshot (iPhone 17 Pro Simulator, Dynamic Island) found
          // the top-left Amigos pill and the top-right controls rendering directly under the
          // system status bar/notch — a plain padding:16 (unchanged since before this fix) has
          // no notion of the device's safe area, since this screen has no header
          // (screenOptions={{ headerShown: false }} on the native <Tabs>) to reserve that space
          // itself. useSafeAreaInsets() (react-native-safe-area-context, already a project
          // dependency per plan.md — no new one added) is 0 on web, so this is a no-op there.
          { paddingTop: 16 + insets.top, paddingLeft: 16 + insets.left, paddingRight: 16 + insets.right },
        ]}
      >
        <View style={styles.topLeft} testID="home-screen-top-left">
          <AmigosQuickAccessPill />
        </View>
        <View style={styles.topRight} testID="home-screen-top-right">
          <TopRightControls />
        </View>
      </View>
      <View style={styles.centre} testID="home-screen-centre">
        <ScanEntryCard onPress={handleScanEntryPress} />
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
  },
  topLeft: {},
  topRight: {},
  centre: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
});
