// T016 (specs/004-home-scan-shell): the scanner's route boundary. Renders the stub
// ScanPlaceholderScreen (src/features/scanner/ScanPlaceholderScreen.tsx, T004) only — this
// feature owns the route boundary and stub content, never camera access, image capture, or
// card recognition (FR-005). Reached from HomeScreen's "+" card (T013/T016,
// SCAN_ROUTE = "/scan", src/domain/navigation.ts).
//
// This route sits outside the (app) shell group, so it has no persistent tab bar/sidebar of its
// own to return via — a small explicit "Back to Home" affordance (calling expo-router's
// router.back()) is added here so US2 AS2 ("navigate back... shell intact") has a discoverable,
// keyboard/screen-reader-reachable trigger, not just an undiscoverable native swipe gesture or
// browser back button. The Stack pop this triggers is what actually re-renders the intact
// Home/Scan screen and shell underneath — that part is confirmed via a real browser
// back-navigation check (see progress/impl_004-home-scan-shell.md), not by this file's own
// unit test, which can only observe /scan in isolation.
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScanPlaceholderScreen } from "@/features/scanner/ScanPlaceholderScreen";

export default function ScanRouteScreen() {
  const router = useRouter();

  return (
    <View style={styles.container} testID="scan-route-screen">
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back to Home"
        style={styles.backButton}
        testID="scan-back-button"
      >
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>
      <ScanPlaceholderScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
});
