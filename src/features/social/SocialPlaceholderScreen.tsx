// T006 (specs/004-home-scan-shell): the Social destination's stub content only. FR-007
// explicitly forbids any real feed, post, or trading content of any kind in this feature —
// this screen must stay plain static copy identifying itself as Social, distinct from the
// Amigos placeholder (see the adjacent test file for the identifying-copy assertion).
import { StyleSheet, Text, View } from "react-native";

export function SocialPlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Social
      </Text>
      <Text style={styles.body}>
        Your social feed isn&apos;t available yet. This screen only reserves the Social
        destination for the future social feature — no feed, posts, or trading content here.
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
