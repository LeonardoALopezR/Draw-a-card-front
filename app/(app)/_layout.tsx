import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { NAV_DESTINATIONS, type NavDestinationKey } from "@/domain/navigation";
import { navCopy } from "@/domain/i18n/copy/nav";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { ShellHeader } from "@/features/navigation/ShellHeader";
import { colors } from "@/theme";

// T009 (specs/008-scan-experience): the native (iOS/Android) shell — expo-router's <Tabs>,
// one <Tabs.Screen> per NAV_DESTINATIONS entry (src/domain/navigation.ts, T001), which stays
// the single source of truth for the five destinations/routes/labels shared with the web
// layout (app/(app)/_layout.web.tsx) — no duplicate destination list here (FR-001, FR-002).
// Each screen name below is the file this <Tabs.Screen> resolves to inside this route group
// (app/(app)/index.tsx, escanear.tsx, cartera.tsx, trades.tsx, perfil.tsx — escanear.tsx wired
// by T019, the other three by T030); the mapping itself is presentation wiring, not business
// logic, so it stays local to this layout file rather than in src/domain.
const TAB_SCREEN_NAMES: Record<NavDestinationKey, string> = {
  inicio: "index",
  escanear: "escanear",
  cartera: "cartera",
  trades: "trades",
  perfil: "perfil",
};

const TAB_ICONS: Record<NavDestinationKey, keyof typeof Ionicons.glyphMap> = {
  inicio: "home",
  escanear: "scan-outline",
  cartera: "briefcase-outline",
  trades: "swap-horizontal-outline",
  perfil: "person-outline",
};

// FR-011: ShellHeader (T008) replaces the previous headerShown: false — a single shared header
// renders above every one of the five tab screens, none of which renders it itself (no per-screen
// duplication).
export default function AppTabsLayout() {
  const t = useTranslation(navCopy);

  // FR-017/SC-006 fix (Round 2 review Finding 1): tab title/accessibility label MUST localize —
  // build them from navCopy instead of NAV_DESTINATIONS' (now-removed) `label` field, the same
  // local-lookup pattern TAB_ICONS already uses above.
  const TAB_LABELS: Record<NavDestinationKey, string> = {
    inicio: t("navInicio"),
    escanear: t("navEscanear"),
    cartera: t("navCartera"),
    trades: t("navTrades"),
    perfil: t("navPerfil"),
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <ShellHeader />,
        // Defect fix (2026-08-06, found on a real iPhone 17 Pro simulator): no explicit tint colors
        // meant iOS fell back to its system-default blue for the active tab — disagreeing with the
        // mockups (active destination in brand lime) and with the web nav's dark-on-light links.
        // `colors.brand.primary` (the lime) was tried first and rejected: against this tab bar's
        // light default background it measures ~1.29:1 with `contrastRatio` (src/theme/contrast.ts)
        // against `colors.bg.surface`, far below the WCAG AA 4.5:1 floor (Constitution VII) — using
        // it here would trade an invisible-on-black bug (see Viewfinder.tsx's foundHeading fix) for
        // an invisible-on-white one. `colors.text.link` is the token this repo already uses
        // everywhere else a mockup calls for an actionable/"brand accent" green (e.g.
        // FoundCardPanel.tsx's "Cambiar" link) and clears AA against both plausible tab-bar
        // background tokens: ~5.28:1 against `bg.surface` (iOS's near-white default) and ~4.51:1
        // against `bg.page` (a plausible Android fallback) — see
        // src/features/navigation/AppNativeLayout.test.tsx's regression guard, which computes both
        // ratios via the same `contrastRatio` helper rather than eyeballing them.
        tabBarActiveTintColor: colors.text.link,
        tabBarInactiveTintColor: colors.text.secondary,
      }}
    >
      {NAV_DESTINATIONS.map((destination) => (
        <Tabs.Screen
          key={destination.key}
          name={TAB_SCREEN_NAMES[destination.key]}
          options={{
            title: TAB_LABELS[destination.key],
            // Explicit label, not left to icon-only defaults (spec.md FR-001/FR-002 —
            // required for VoiceOver/TalkBack, SC-002).
            tabBarAccessibilityLabel: TAB_LABELS[destination.key],
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICONS[destination.key]} color={color} size={size} />
            ),
            // AS4 fix (spec.md User Story 3, "navigate away via the shell and back... resets to
            // idle"), orchestrator decision 2026-08-05, option (a) — see
            // progress/impl_008-scan-experience.md's AS4 follow-up entry and
            // progress/review_008-scan-experience.md's Round 5 §1. @react-navigation/bottom-tabs
            // defaults `unmountOnBlur` to `false`, so without this, ScanShellScreen.tsx's
            // useScanSimulation() local state survives a tab switch instead of resetting.
            // Scoped to Escanear ONLY — the other four destinations keep the default
            // (`unmountOnBlur: false`) intentionally. KNOWN, ACCEPTED SIDE EFFECT: this remounts
            // Escanear's whole subtree (not just the found-state) on every tab-away/back, so
            // scroll position also resets, and any FUTURE local state added to this screen will
            // reset too — within spec.md's already-accepted no-persistence precedent, but do not
            // "clean this up" without re-reading the linked review first.
            ...(destination.key === "escanear" ? { unmountOnBlur: true } : {}),
          }}
        />
      ))}
    </Tabs>
  );
}
