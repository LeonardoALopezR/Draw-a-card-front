// T005 (specs/004-home-scan-shell): the Amigos destination's stub content only. FR-007
// explicitly forbids any real friend list, friend request, or social data of any kind in this
// feature — this screen must stay plain static copy identifying itself as Amigos, distinct
// from the Social placeholder (see the adjacent test file for the identifying-copy assertion).
import { StyleSheet, Text, View } from "react-native";

export function AmigosPlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Amigos
      </Text>
      <Text style={styles.body}>
        Your friends list isn&apos;t available yet. This screen only reserves the Amigos
        destination for the future social feature — no friend list, friend requests, or social
        data here.
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
