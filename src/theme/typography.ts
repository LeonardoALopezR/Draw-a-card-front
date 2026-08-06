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
  // 010-registration-redesign Run 6 (FR-006, carried-over Run 5 review nit): a mid-size,
  // sans-serif heading — distinct from `display` above, which is reserved for this app's large
  // serif hero titles (`Crear cuenta`, `/login`'s own title) and is visibly too big/too
  // decorative for a secondary in-flow heading like the registration `sessionIssue` recovery
  // view's "Tu cuenta fue creada"/"Your account was created" title. No existing token matched
  // this pairing (`display.lg` is 28/700 with `PLAYFAIR_DISPLAY_BOLD`, wrong family entirely),
  // so this is a new sibling category, not a color change — no new `contrast.test.ts` case is
  // needed (this token carries no `color`; callers already source `color` from `colors.text.*`
  // directly, exactly as `CrearCuentaScreen.tsx`/`.web.tsx` already do).
  heading: {
    sm: {
      fontSize: 22,
      fontWeight: "600",
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
    // T003 (specs/010-registration-redesign, FR-006): a sibling of `field` above, not an edit to
    // it — docs/design-brief-registration-redesign.md §2 wants sentence-case field labels
    // ("Nombre completo", not uppercase) for this feature's screens, but `field` is already
    // consumed uppercase by every other screen in the app (SignInForm, RequestPasswordResetForm,
    // ResetPasswordForm, VerifyPhoneScreen, the pre-redesign RegistrationForm/ProfileForm).
    // Changing `field` itself would silently re-style all of those. Same fontSize/fontWeight/
    // color as `field` (no color change, so no new contrast.test.ts case is needed — inherits
    // text.secondary, already covered), just no textTransform/letterSpacing.
    fieldSentence: {
      fontSize: 12,
      fontWeight: "500",
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
