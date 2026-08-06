// T038 (specs/006-visual-identity, FR-007): the scan screen's drawn viewfinder (brief §5 item 2)
// — a purely presentational panel: viewfinder.bg fill, a faint 4x4 grid, four lime L-shaped
// corner brackets, a centered camera glyph + hint copy, and a non-interactive settings-gear
// chip. Zero camera-module import — nothing here talks to a real camera or opens any capture
// surface, this is plain View/Text/Icon drawing (004-home-scan-shell's FR-005 constraint,
// restated here since this is the component most at risk of accidentally reaching for
// expo-camera). The camera glyph below is a static icon from @expo/vector-icons, not a live
// preview of any kind.
//
// specs/008-scan-experience/tasks.md T015 (US3, FR-004): a `state: "idle" | "found"` prop
// (default "idle"). "found" swaps the grid/brackets/camera-glyph/hint for a glowing horizontal
// brand.primary scan line, a check glyph, and the "¡Carta encontrada!" heading — the gear chip
// is unchanged in both states. The found-state visuals are still plain View/Text/Icon drawing —
// zero camera-module import, same as idle (this state is reachable only via
// useScanSimulation()'s local trigger, never a real camera/recognition pipeline, FR-016).
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, radius, space } from "@/theme";

// 4x4 grid = 3 evenly-spaced internal dividers in each direction (brief §5 item 2).
const GRID_DIVIDER_FRACTIONS = [0.25, 0.5, 0.75];

// Corner brackets: ~16px inset, ~36px long, 3px thick, brand.primary (brief §5 item 2). Each
// corner is two bars (one horizontal, one vertical) forming an "L" — listed as flat absolute-
// position style objects rather than a nested per-corner component, since every bar shares the
// same fill/positioning technique.
const BRACKET_INSET = 16;
const BRACKET_LENGTH = 36;
const BRACKET_THICKNESS = 3;

const CORNER_BRACKET_BARS: ViewStyle[] = [
  // top-left
  { top: BRACKET_INSET, left: BRACKET_INSET, width: BRACKET_LENGTH, height: BRACKET_THICKNESS },
  { top: BRACKET_INSET, left: BRACKET_INSET, width: BRACKET_THICKNESS, height: BRACKET_LENGTH },
  // top-right
  { top: BRACKET_INSET, right: BRACKET_INSET, width: BRACKET_LENGTH, height: BRACKET_THICKNESS },
  { top: BRACKET_INSET, right: BRACKET_INSET, width: BRACKET_THICKNESS, height: BRACKET_LENGTH },
  // bottom-left
  {
    bottom: BRACKET_INSET,
    left: BRACKET_INSET,
    width: BRACKET_LENGTH,
    height: BRACKET_THICKNESS,
  },
  {
    bottom: BRACKET_INSET,
    left: BRACKET_INSET,
    width: BRACKET_THICKNESS,
    height: BRACKET_LENGTH,
  },
  // bottom-right
  {
    bottom: BRACKET_INSET,
    right: BRACKET_INSET,
    width: BRACKET_LENGTH,
    height: BRACKET_THICKNESS,
  },
  {
    bottom: BRACKET_INSET,
    right: BRACKET_INSET,
    width: BRACKET_THICKNESS,
    height: BRACKET_LENGTH,
  },
];

export interface ViewfinderProps {
  readonly state?: "idle" | "found";
}

export function Viewfinder({ state = "idle" }: ViewfinderProps) {
  const t = useTranslation(scanCopy);
  const isFound = state === "found";

  return (
    <View style={styles.frame} testID="viewfinder">
      {isFound ? (
        <View style={styles.center} pointerEvents="none" testID="viewfinder-found">
          {/* Glowing horizontal scan line (spec.md User Story 3 AS2) — brand.primary fill with a
              matching shadow to read as "glowing" without a new asset/animation dependency. */}
          <View style={styles.scanLine} />
          <Ionicons name="checkmark-circle" size={40} color={colors.brand.primary} />
          <Text style={styles.foundHeading}>{t("viewfinderFoundHeading")}</Text>
        </View>
      ) : (
        <>
          {GRID_DIVIDER_FRACTIONS.map((fraction) => (
            <View
              key={`grid-v-${fraction}`}
              style={[styles.gridLineVertical, { left: `${fraction * 100}%` }]}
            />
          ))}
          {GRID_DIVIDER_FRACTIONS.map((fraction) => (
            <View
              key={`grid-h-${fraction}`}
              style={[styles.gridLineHorizontal, { top: `${fraction * 100}%` }]}
            />
          ))}

          {CORNER_BRACKET_BARS.map((barStyle, index) => (
            // eslint-disable-next-line react/no-array-index-key -- static, never reordered
            <View key={index} style={[styles.absolute, styles.bracketBar, barStyle]} />
          ))}

          <View style={styles.center} pointerEvents="none">
            <Ionicons name="camera-outline" size={40} color={colors.viewfinder.hintText} />
            <Text style={styles.hint}>{t("viewfinderHint")}</Text>
          </View>
        </>
      )}

      {/* Decorative-only — pressing it does nothing in this feature (spec.md US3 AS4), so it's
          hidden from the accessibility tree entirely rather than exposed with a role it can't
          back up with real behavior.
          T050 fix: `accessibilityElementsHidden`/`importantForAccessibility` are iOS/Android-only
          — react-native-web doesn't forward either prop to the DOM (confirmed against the
          installed react-native-web's forwardedProps list), so on web this chip was still
          reachable by a screen reader despite carrying no role/label. `aria-hidden` (a first-class
          View prop since RN 0.74, this repo's installed version) is what React Native itself maps
          internally to the exact same accessibilityElementsHidden/importantForAccessibility pair
          on native (see react-native/Libraries/Components/View/View.js), AND is one of the props
          react-native-web forwards straight through to the DOM's real `aria-hidden` attribute —
          one prop, correct on all three targets. */}
      <View style={styles.gearChip} aria-hidden testID="viewfinder-gear-chip">
        <Ionicons name="settings-outline" size={14} color={colors.brand.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: colors.viewfinder.bg,
    borderRadius: radius.panel,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  absolute: {
    position: "absolute",
  },
  gridLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.viewfinder.grid,
  },
  gridLineHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.viewfinder.grid,
  },
  bracketBar: {
    backgroundColor: colors.brand.primary,
  },
  center: {
    alignItems: "center",
    gap: space.sm,
  },
  hint: {
    color: colors.viewfinder.hintText,
    fontSize: 14,
    textAlign: "center",
  },
  // T015 (found state): a wide, thin brand.primary bar with a colored shadow to read as
  // "glowing" — same shadowRaised-style technique (colored shadow, no blur library) this repo
  // already uses elsewhere rather than reaching for a new animation/glow dependency.
  scanLine: {
    position: "absolute",
    top: "45%",
    left: "10%",
    right: "10%",
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  foundHeading: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  gearChip: {
    position: "absolute",
    top: space.sm,
    right: space.sm,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.viewfinder.grid,
    alignItems: "center",
    justifyContent: "center",
  },
});
