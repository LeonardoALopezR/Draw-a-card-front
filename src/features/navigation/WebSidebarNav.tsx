// T010 (specs/004-home-scan-shell): the ≥768px web navigation treatment (plan.md's "Web
// navigation treatment" Research Decision) — a persistent left sidebar rendering
// NAV_DESTINATIONS (src/domain/navigation.ts, T001) as accessible, keyboard-focusable links,
// wrapping an expo-router <Slot /> for the active screen (FR-001, FR-003, SC-002). Uses
// expo-router's <Link>, which react-native-web renders as a real <a> element on web —
// reachable via Tab/Shift+Tab with the browser's default focus outline left untouched (no
// `outlineWidth`/`outlineStyle` override here), which is what satisfies Constitution
// Principle VII's "visible focus indicator" without any extra styling code.
import { Link, Slot } from "expo-router";
import { StyleSheet, View } from "react-native";

import { NAV_DESTINATIONS } from "@/domain/navigation";

export function WebSidebarNav() {
  return (
    <View style={styles.container} testID="web-sidebar-nav">
      <View style={styles.sidebar} role="navigation" testID="web-sidebar-nav-list">
        {NAV_DESTINATIONS.map((destination) => (
          <Link
            key={destination.key}
            href={destination.route}
            accessibilityRole="link"
            accessibilityLabel={destination.label}
            style={styles.link}
          >
            {destination.label}
          </Link>
        ))}
      </View>
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 220,
    minWidth: 220,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  link: {
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  content: {
    flex: 1,
  },
});
