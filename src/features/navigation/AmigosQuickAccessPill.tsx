// T008 (specs/004-home-scan-shell): the Home/Scan screen's top-left "Amigos" quick-access
// pill. Per FR-008 and spec.md's Design note (confirmed by the human at the approval gate),
// this is a shortcut to the *same* Amigos destination as the shell's Amigos tab — not a second,
// competing destination — so its navigation target is looked up from `NAV_DESTINATIONS`
// (src/domain/navigation.ts, T001) rather than hardcoded as a second `"/amigos"` string literal
// that could drift from the tab's own route.
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { NAV_DESTINATIONS } from "@/domain/navigation";

export function AmigosQuickAccessPill() {
  const router = useRouter();

  const handlePress = () => {
    const amigosDestination = NAV_DESTINATIONS.find((destination) => destination.key === "amigos");
    if (amigosDestination) {
      router.push(amigosDestination.route);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Amigos"
      style={styles.pill}
      testID="amigos-quick-access-pill"
    >
      <Text style={styles.label}>Amigos</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
});
