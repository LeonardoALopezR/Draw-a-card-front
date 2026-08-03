import { View, Text, StyleSheet } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Draw-a-card</Text>
      <Text style={styles.subtitle}>
        One codebase, three targets (iOS, Android, web). Implement screens per spec — see
        specs/001-registration-kyc for the first one.
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
    maxWidth: 480,
    marginHorizontal: "auto", // works on web via react-native-web; harmless no-op on native
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
  },
  subtitle: {
    color: "#6b7280",
    textAlign: "center",
  },
});
