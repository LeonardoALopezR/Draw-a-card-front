// T011 (specs/008-scan-experience): the <768px web navigation treatment (plan.md's "Web
// navigation treatment" Research Decision, unchanged from 004-home-scan-shell) — a bottom bar
// visually/behaviorally equivalent to the native tab bar (app/(app)/_layout.tsx, T009), rendering
// NAV_DESTINATIONS (src/domain/navigation.ts, T001) as accessible, keyboard-focusable links, now
// five entries with the same icon set as T009/T010, and ShellHeader (T008) rendered above the
// existing expo-router <Slot /> so the four icon controls appear here too (FR-011). Uses
// expo-router's <Link>, which react-native-web renders as a real <a> element on web — reachable
// via Tab/Shift+Tab with the browser's default focus outline left untouched, same as
// WebSidebarNav.tsx.
//
// Layout-bug fix (found by a live browser render after commit 39c3f02, not by this file's own
// test suite — see progress/impl_008-scan-experience.md's dedicated fix entry): react-native-web
// renders <Link> as an inline <a> (its base style is `display: inline`, same as its underlying
// Text primitive), so flex properties applied directly to it — `gap`, `alignItems`,
// `justifyContent` — are silently ignored by the browser even though they're genuinely present in
// the flattened style object. The icon and label rendered flush against each other with zero
// separation. Fix: `styles.link` (on <Link> itself) now sets `display: "flex"` explicitly so the
// anchor becomes a real flex container — this is also what makes `minWidth`/`minHeight` (the
// 44x44 tap target, T033) actually take effect on the anchor element, since CSS min-width/
// min-height are likewise ignored on non-replaced inline elements; and the icon+label's own
// gap/alignItems now live on a nested `<View>` (`styles.linkContent`) rather than on the Link,
// since a real View is guaranteed to be a flex container on every platform without needing an
// explicit `display` override (unlike Link/Text, whose default is web-only `inline`) — so this
// layout can't silently regress again if a future edit touches `styles.link`.
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
            <View style={styles.linkContent}>
              <Ionicons
                name={DESTINATION_ICONS[destination.key]}
                size={18}
                color={colors.text.primary}
              />
              <Text style={styles.linkLabel}>{DESTINATION_LABELS[destination.key]}</Text>
            </View>
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
    // `display: "flex"` is load-bearing, not decorative — see this file's header comment. Without
    // it, react-native-web's default `display: inline` for <Link>/<Text> silently drops every
    // flex-dependent property below, including the 44x44 tap target.
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  // The real icon+label layout — a genuine flex container on every platform without needing the
  // `display` override `styles.link` above needs (see this file's header comment).
  linkContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
  },
});
