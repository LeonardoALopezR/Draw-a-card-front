import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { NAV_DESTINATIONS, type NavDestinationKey } from "@/domain/navigation";

// T009 (specs/004-home-scan-shell): the native (iOS/Android) shell — expo-router's <Tabs>,
// one <Tabs.Screen> per NAV_DESTINATIONS entry (src/domain/navigation.ts, T001), which stays
// the single source of truth for the three destinations/routes/labels shared with the web
// layout (app/(app)/_layout.web.tsx, a later task) — no duplicate destination list here
// (FR-001, FR-002). Each screen name below is the file this <Tabs.Screen> resolves to inside
// this route group (app/(app)/index.tsx, amigos.tsx, social.tsx — wired in a later task); the
// mapping itself is presentation wiring, not business logic, so it stays local to this layout
// file rather than in src/domain.
const TAB_SCREEN_NAMES: Record<NavDestinationKey, string> = {
  amigos: "amigos",
  home: "index",
  social: "social",
};

const TAB_ICONS: Record<NavDestinationKey, keyof typeof Ionicons.glyphMap> = {
  amigos: "people",
  home: "home",
  social: "chatbubbles",
};

export default function AppTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {NAV_DESTINATIONS.map((destination) => (
        <Tabs.Screen
          key={destination.key}
          name={TAB_SCREEN_NAMES[destination.key]}
          options={{
            title: destination.label,
            // Explicit label, not left to icon-only defaults (spec.md FR-001/FR-002 —
            // required for VoiceOver/TalkBack, SC-002).
            tabBarAccessibilityLabel: destination.label,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICONS[destination.key]} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
