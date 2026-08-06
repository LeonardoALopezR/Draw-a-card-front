// T011 (specs/006-visual-identity): the app's logo tile — a rounded square, brand.primary
// fill, radius.tile, shadow.raised, with a centered serif "D" glyph (brief §3.1). 112px by
// default (the login screen's usage, brief §3 item 1), with a `size` prop so a future screen
// can reuse it at a different scale. Every value traces to src/theme's semantic tokens
// (FR-001) — no raw hex/magic-number literal here.
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, shadowRaised, typography } from "@/theme";

export interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 112 }: BrandMarkProps) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Draw a Card"
      style={[
        styles.tile,
        shadowRaised,
        {
          width: size,
          height: size,
          borderRadius: radius.tile,
        },
      ]}
    >
      <Text style={[styles.glyph, { fontSize: size * 0.4 }]}>D</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: {
    color: colors.brand.onPrimary,
    fontWeight: typography.display.lg.fontWeight,
    fontFamily: typography.display.lg.fontFamily,
  },
});
