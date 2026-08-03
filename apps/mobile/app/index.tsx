import { View, Text, StyleSheet } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Draw-a-card</Text>
      <Text style={styles.subtitle}>
        Scaffold ready. Implement screens per spec — see specs/ at the project root,
        starting with registration/KYC to match the shared 001 spec.
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
    fontSize: 24,
    fontWeight: "600",
  },
  subtitle: {
    color: "#6b7280",
    textAlign: "center",
  },
});
