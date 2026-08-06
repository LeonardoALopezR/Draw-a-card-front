// T007 (specs/008-scan-experience, FR-011, FR-012, SC-004, SC-005, SC-006): rewrites 004's four
// bordered TEXT-label buttons ("ENG/ESP", "USD/MXN", "Notifications", "Messages") into four ICON
// buttons — language renders a hand-drawn `FlagBadge` pair (small flag-shaped rectangles built
// from plain nested `View`s using each country's real flag colors, no flag emoji, no image
// asset, and no new icon/asset dependency — see spec.md's Design note on the Android flag-emoji
// rendering gap and plan.md's Research Decisions; the human explicitly asked for something that
// reads as a flag rather than a lettered chip, 2026-08-05, superseding the two-letter "MX"/"US"
// text this control originally shipped with), the other three use @expo/vector-icons glyphs
// already installed in this repo (cash-outline/notifications-outline/chatbubble-outline). Mirrors
// 004's original single-control-shows-both-options shape (the old "ENG/ESP" button showed both
// language options in one control, not a toggle) rather than inventing a new interaction model.
// The existing "press -> inline 'not yet available' text" local-state feedback mechanism (004's
// established, tested pattern) is unchanged — only the visible control surface moves from a text
// label to an icon/flag-badge. Every accessibilityLabel and the shared feedback text now read
// from useTranslation(navCopy) (T003) instead of 004's hardcoded English literals.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { navCopy } from "@/domain/i18n/copy/nav";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, radius, space } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;
type ControlKey = "language" | "currency" | "notifications" | "messages";

// Real national flag colors — not `src/theme` design tokens, deliberately: these are fixed,
// literal colors a real Mexican/US flag is printed in, not brand palette choices this app could
// ever restyle, so they don't belong in src/theme's semantic color vocabulary (unlike every other
// color in this file, which does route through src/theme/colors.ts).
const FLAG_COLORS = {
  mexicoGreen: "#006847",
  mexicoWhite: "#FFFFFF",
  mexicoRed: "#CE1126",
  usaRed: "#B22234",
  usaWhite: "#FFFFFF",
  usaBlue: "#3C3B6E",
} as const;

const FLAG_WIDTH = 20;
const FLAG_HEIGHT = 14;
// Odd count so the top and bottom stripes are both red, like the real flag's 7 red/6 white
// stripes — simplified from 13 to 5 since individual stripes would be sub-pixel at this size.
const USA_STRIPE_COLORS = [
  FLAG_COLORS.usaRed,
  FLAG_COLORS.usaWhite,
  FLAG_COLORS.usaRed,
  FLAG_COLORS.usaWhite,
  FLAG_COLORS.usaRed,
] as const;

interface FlagBadgeProps {
  readonly code: "MX" | "US";
}

// A small flag-shaped rectangle hand-drawn from nested Views using each country's real flag
// colors (FR-012) — Mexico: three equal vertical bands (green/white/red); USA: red/white
// horizontal stripes with a blue canton in the upper-left. Not an emoji, not an image asset, not
// a new icon package. Purely decorative: hidden from the accessibility tree via `aria-hidden`
// since the ancestor Pressable already carries the real accessible name
// (languageAccessibilityLabel) — the flag shapes must never surface as their own, separate,
// unlabeled accessibility elements. `aria-hidden` (not accessibilityElementsHidden/
// importantForAccessibility) is deliberate: React Native itself maps `aria-hidden` internally to
// that exact same iOS/Android pair, AND react-native-web forwards it straight through to the
// DOM's real `aria-hidden` — one prop correct on all three targets, same fix already applied to
// Viewfinder.tsx's decorative gear chip (see that file's comment for the fuller investigation).
// Both options render together inside the language control (see CONTROLS below), since the
// control stays fully inert (no real language switch — that's 007-localization's job).
function FlagBadge({ code }: FlagBadgeProps) {
  return (
    <View style={styles.flagBadge} testID={`flag-badge-${code.toLowerCase()}`} aria-hidden>
      {code === "MX" ? (
        <View style={styles.flagBandsRow}>
          <View style={[styles.flagBand, { backgroundColor: FLAG_COLORS.mexicoGreen }]} />
          <View style={[styles.flagBand, { backgroundColor: FLAG_COLORS.mexicoWhite }]} />
          <View style={[styles.flagBand, { backgroundColor: FLAG_COLORS.mexicoRed }]} />
        </View>
      ) : (
        <View style={styles.flagStripesColumn}>
          {USA_STRIPE_COLORS.map((stripeColor, index) => (
            <View key={index} style={[styles.flagStripe, { backgroundColor: stripeColor }]} />
          ))}
          <View style={styles.flagCanton} />
        </View>
      )}
    </View>
  );
}

interface ControlConfig {
  readonly key: ControlKey;
  readonly icon: IconName | null;
}

// Order matters: spec.md FR-011's exact stated top-to-bottom sequence — language, currency,
// notifications, messages (unchanged from 004). `icon: null` marks the language control, which
// renders the hand-drawn FlagBadge pair instead of an Ionicons glyph.
const CONTROLS: readonly ControlConfig[] = [
  { key: "language", icon: null },
  { key: "currency", icon: "cash-outline" },
  { key: "notifications", icon: "notifications-outline" },
  { key: "messages", icon: "chatbubble-outline" },
];

interface PlaceholderControlProps {
  readonly icon: IconName | null;
  readonly accessibilityLabel: string;
  readonly feedbackText: string;
}

function PlaceholderControl({ icon, accessibilityLabel, feedbackText }: PlaceholderControlProps) {
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  return (
    <View style={styles.controlRow}>
      <Pressable
        onPress={() => setFeedbackVisible((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={styles.control}
      >
        {icon ? (
          <Ionicons name={icon} size={22} color={colors.text.primary} />
        ) : (
          <View style={styles.flagPair}>
            <FlagBadge code="MX" />
            <FlagBadge code="US" />
          </View>
        )}
      </Pressable>
      {feedbackVisible ? <Text style={styles.feedback}>{feedbackText}</Text> : null}
    </View>
  );
}

export function TopRightControls() {
  const t = useTranslation(navCopy);

  // Accessibility labels carry strictly more information than the visible icon alone — a full
  // sentence stating what the control is AND that it isn't yet functional (FR-011/FR-012,
  // Constitution VII) — exactly the same sentence shape 004 established, now bilingual.
  const accessibilityLabelByKey: Record<ControlKey, string> = {
    language: t("languageAccessibilityLabel"),
    currency: t("currencyAccessibilityLabel"),
    notifications: t("notificationsAccessibilityLabel"),
    messages: t("messagesAccessibilityLabel"),
  };

  return (
    <View style={styles.stack} testID="top-right-controls">
      {CONTROLS.map((control) => (
        <PlaceholderControl
          key={control.key}
          icon={control.icon}
          accessibilityLabel={accessibilityLabelByKey[control.key]}
          feedbackText={t("notYetAvailableFeedback")}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: space.sm,
  },
  controlRow: {
    alignItems: "flex-end",
  },
  control: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  flagPair: {
    flexDirection: "row",
    gap: 4,
  },
  // The flag-shaped rectangle itself — a subtle hairline border keeps the white
  // band/stripes legible against both light and dark backgrounds, since the badge sits inside
  // an otherwise-borderless Pressable.
  flagBadge: {
    width: FLAG_WIDTH,
    height: FLAG_HEIGHT,
    borderRadius: 2,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
  },
  flagBandsRow: {
    flex: 1,
    flexDirection: "row",
  },
  flagBand: {
    flex: 1,
  },
  flagStripesColumn: {
    flex: 1,
    flexDirection: "column",
    position: "relative",
  },
  flagStripe: {
    flex: 1,
  },
  flagCanton: {
    position: "absolute",
    top: 0,
    left: 0,
    // Real-flag proportions, simplified for the 5-stripe approximation above: the canton
    // covers the fly-side 42% of width and the top three of five stripes' height (60%).
    width: FLAG_WIDTH * 0.42,
    height: FLAG_HEIGHT * 0.6,
    backgroundColor: FLAG_COLORS.usaBlue,
  },
  feedback: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
