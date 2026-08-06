// Only a type-only `TextStyle` import — erased at compile time, not a runtime React Native
// dependency (Constitution IV, plan.md's Research Decisions). No other RN import.
import type { TextStyle } from "react-native";

import { colors } from "./colors";
import { PLAYFAIR_DISPLAY_BOLD } from "./fonts";

// Shared type/typography scale (spec.md FR-001), per docs/design-brief-visual-identity.md
// §2.2's table exactly.
//
// Convention for `body.legal`'s embedded link spans: the legal line's two phrases ("Términos
// de Uso", "Política de Privacidad") are rendered as separate nested <Text> children colored
// with `colors.text.link`, inheriting every other property (fontSize/fontWeight/textAlign)
// from the surrounding `body.legal` <Text> — never a second, separate style object duplicating
// body.legal's non-color properties.
export const typography = {
  display: {
    xl: {
      fontSize: 40,
      fontWeight: "700",
      fontFamily: PLAYFAIR_DISPLAY_BOLD,
    } satisfies TextStyle,
    lg: {
      fontSize: 28,
      fontWeight: "700",
      fontFamily: PLAYFAIR_DISPLAY_BOLD,
    } satisfies TextStyle,
  },
  body: {
    tagline: {
      fontSize: 15,
      fontWeight: "400",
      color: colors.text.secondary,
    } satisfies TextStyle,
    // Never below 16 — smaller triggers iOS zoom-on-focus (brief §2.2).
    input: {
      fontSize: 16,
      fontWeight: "400",
    } satisfies TextStyle,
    link: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text.link,
    } satisfies TextStyle,
    legal: {
      fontSize: 12,
      fontWeight: "400",
      textAlign: "center",
      color: colors.text.secondary,
    } satisfies TextStyle,
  },
  label: {
    field: {
      fontSize: 12,
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: 0.08 * 12,
      color: colors.text.secondary,
    } satisfies TextStyle,
    section: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.08 * 12,
      color: colors.text.secondary,
    } satisfies TextStyle,
  },
  button: {
    label: {
      fontSize: 16,
      fontWeight: "700",
    } satisfies TextStyle,
  },
} as const;
