// T010 (specs/008-scan-experience): the >=768px web navigation treatment (plan.md's "Web
// navigation treatment" Research Decision, unchanged from 004-home-scan-shell) — a persistent
// left sidebar rendering NAV_DESTINATIONS (src/domain/navigation.ts, T001) as accessible,
// keyboard-focusable links, now five entries with per-destination icons matching T009's set, a
// compact brand block (BrandMark + serif wordmark/tagline, T003's navCopy) at the top — no
// user-profile/account-tier block (spec.md Assumptions) — and ShellHeader (T008) rendered above
// the existing expo-router <Slot /> in the content column, so the four icon controls appear here
// too instead of only on native (FR-011). Uses expo-router's <Link>, which react-native-web
// renders as a real <a> element on web — reachable via Tab/Shift+Tab with the browser's default
// focus outline left untouched (Constitution VII, SC-002).
import { Ionicons } from "@expo/vector-icons";
import { Link, Slot } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { NAV_DESTINATIONS, type NavDestinationKey } from "@/domain/navigation";
import { navCopy } from "@/domain/i18n/copy/nav";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { BrandMark } from "@/features/ui/BrandMark";
import { colors, space, typography } from "@/theme";

import { ShellHeader } from "./ShellHeader";

// Same icon set app/(app)/_layout.tsx's native tab bar uses (T009) — kept local rather than a
// shared constant since this mapping is presentation wiring, not business logic (matches T009's
// own comment on why TAB_ICONS stays local to its layout file).
const DESTINATION_ICONS: Record<NavDestinationKey, keyof typeof Ionicons.glyphMap> = {
  inicio: "home",
  escanear: "scan-outline",
  cartera: "briefcase-outline",
  trades: "swap-horizontal-outline",
  perfil: "person-outline",
};

export function WebSidebarNav() {
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
    <View style={styles.container} testID="web-sidebar-nav">
      <View style={styles.sidebar} role="navigation" testID="web-sidebar-nav-list">
        <View style={styles.brandBlock} testID="web-sidebar-brand-block">
          <BrandMark size={40} />
          <View>
            <Text style={styles.wordmark}>{t("sidebarWordmark")}</Text>
            <Text style={styles.tagline}>{t("sidebarTagline")}</Text>
          </View>
        </View>
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
              size={20}
              color={colors.text.primary}
            />
            <Text style={styles.linkLabel}>{DESTINATION_LABELS[destination.key]}</Text>
          </Link>
        ))}
      </View>
      <View style={styles.content}>
        <ShellHeader />
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
    borderRightColor: colors.border.subtle,
    paddingVertical: space.xxl,
    paddingHorizontal: space.lg,
    gap: space.sm,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginBottom: space.xl,
  },
  wordmark: {
    fontSize: typography.display.lg.fontSize * 0.4,
    fontWeight: typography.display.lg.fontWeight,
    fontFamily: typography.display.lg.fontFamily,
    color: colors.text.primary,
  },
  tagline: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    // T033 (accessibility pass, Constitution VII): explicit minWidth, not just minHeight — the
    // sidebar's icon+text content already exceeds 44px in practice, but WebBottomBarNav.tsx's
    // equivalent link style states both floors explicitly, so this one now matches instead of
    // relying on incidental content width.
    minWidth: 44,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  linkLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
});
