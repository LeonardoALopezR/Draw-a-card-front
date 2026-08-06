// T011 (specs/008-scan-experience): the <768px web navigation treatment (plan.md's "Web
// navigation treatment" Research Decision, unchanged from 004-home-scan-shell) — a bottom bar
// visually/behaviorally equivalent to the native tab bar (app/(app)/_layout.tsx, T009), rendering
// NAV_DESTINATIONS (src/domain/navigation.ts, T001) as accessible, keyboard-focusable links, now
// five entries with the same icon set as T009/T010, and ShellHeader (T008) rendered above the
// existing expo-router <Slot /> so the four icon controls appear here too (FR-011). Uses
// expo-router's <Link>, which react-native-web renders as a real <a> element on web — reachable
// via Tab/Shift+Tab with the browser's default focus outline left untouched, same as
// WebSidebarNav.tsx.
import { Ionicons } from "@expo/vector-icons";
import { Link, Slot } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { NAV_DESTINATIONS, type NavDestinationKey } from "@/domain/navigation";
import { navCopy } from "@/domain/i18n/copy/nav";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, space } from "@/theme";

import { ShellHeader } from "./ShellHeader";

// Same icon set app/(app)/_layout.tsx's native tab bar / WebSidebarNav.tsx use (T009/T010).
const DESTINATION_ICONS: Record<NavDestinationKey, keyof typeof Ionicons.glyphMap> = {
  inicio: "home",
  escanear: "scan-outline",
  cartera: "briefcase-outline",
  trades: "swap-horizontal-outline",
  perfil: "person-outline",
};

export function WebBottomBarNav() {
  const t = useTranslation(navCopy);

  // FR-017/SC-006 fix (Round 2 review Finding 1): destination labels MUST localize — build the
  // rendered label from navCopy instead of reading NAV_DESTINATIONS' (now-removed) `label`
  // field, the same local-lookup pattern DESTINATION_ICONS already uses above.
  const DESTINATION_LABELS: Record<NavDestinationKey, string> = {
    inicio: t("navInicio"),
    escanear: t("navEscanear"),
    cartera: t("navCartera"),
    trades: t("navTrades"),
    perfil: t("navPerfil"),
  };

  return (
    <View style={styles.container} testID="web-bottom-bar-nav">
      <View style={styles.content}>
        <ShellHeader />
        <Slot />
      </View>
      <View style={styles.bar} role="navigation" testID="web-bottom-bar-nav-list">
        {NAV_DESTINATIONS.map((destination) => (
          <Link
            key={destination.key}
            href={destination.route}
            accessibilityRole="link"
            accessibilityLabel={DESTINATION_LABELS[destination.key]}
            style={styles.link}
          >
            <Ionicons
              name={DESTINATION_ICONS[destination.key]}
              size={18}
              color={colors.text.primary}
            />
            <Text style={styles.linkLabel}>{DESTINATION_LABELS[destination.key]}</Text>
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
    borderTopColor: colors.border.subtle,
    paddingVertical: space.sm,
  },
  link: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
  },
});
