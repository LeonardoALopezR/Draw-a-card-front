// T011 (specs/004-home-scan-shell): the <768px web navigation treatment (plan.md's "Web
// navigation treatment" Research Decision) — a bottom bar visually/behaviorally equivalent to
// the native tab bar (app/(app)/_layout.tsx, T009), rendering NAV_DESTINATIONS
// (src/domain/navigation.ts, T001) as accessible, keyboard-focusable links, wrapping an
// expo-router <Slot /> for the active screen (FR-001, FR-003, SC-002, SC-003). Uses
// expo-router's <Link>, which react-native-web renders as a real <a> element on web —
// reachable via Tab/Shift+Tab with the browser's default focus outline left untouched, same
// as WebSidebarNav.tsx.
import { Link, Slot } from "expo-router";
import { StyleSheet, View } from "react-native";

import { NAV_DESTINATIONS } from "@/domain/navigation";

export function WebBottomBarNav() {
  return (
    <View style={styles.container} testID="web-bottom-bar-nav">
      <View style={styles.content}>
        <Slot />
      </View>
      <View style={styles.bar} role="navigation" testID="web-bottom-bar-nav-list">
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    minHeight: 56,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 8,
  },
  link: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
});
