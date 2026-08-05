// T004 (specs/004-home-scan-shell): /scan's stub destination content only. FR-005 explicitly
// forbids camera access, image capture, or card recognition in this feature — this screen must
// stay plain static copy with no camera-related import of any kind (see the adjacent test file,
// which asserts that via source inspection, not just current behavior).
import { StyleSheet, Text, View } from "react-native";

export function ScanPlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Scanner coming soon
      </Text>
      <Text style={styles.body}>
        Card scanning isn&apos;t available yet. This screen only reserves the /scan route for
        the future scanner feature — no camera, capture, or recognition here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  body: {
    fontSize: 15,
    color: "#374151",
    textAlign: "center",
    maxWidth: 320,
  },
});
