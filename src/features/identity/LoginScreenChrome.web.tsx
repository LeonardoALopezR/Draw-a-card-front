// T026 (006-visual-identity): web background chrome for /login — bg.page carrying two large,
// low-opacity radial-gradient "blooms" (top-right, bottom-left), with `children` rendered inside
// a centered card, per docs/design-brief-visual-identity.md §4.2. Purely presentational
// passthrough: accepts `children` and renders them unchanged (see LoginScreenChrome.test.tsx's
// passthrough regression guard) — LoginScreen.tsx (a later task) owns what content actually goes
// inside the card. The platform split from LoginScreenChrome.tsx (mobile's gradient-wash
// treatment) is expressed entirely via this file's `.web.tsx` extension (Constitution IV/
// FR-005), not an inline Platform.OS branch.
//
// react-native-web passes unrecognized style properties straight through to the underlying DOM
// node's CSS (the same mechanism src/theme/shadows.web.ts's `boxShadow` already relies on) — a
// soft radial-gradient with a fully-transparent outer stop reads as "heavily blurred" with no
// blur filter/library needed (plan.md's Research Decision). RN's own `ViewStyle` type has no
// `backgroundImage` member (it's a web-only CSS property react-native-web forwards as-is), so
// the bloom-style object below is typed as `ViewStyle` extended with that one web-only field,
// rather than reaching for `any` to route around the gap.
//
// T051 fix (responsive layout check, SC-006): the outer `page` View used to be a plain
// `flex: 1`/`justifyContent: "center"` container with no scroll affordance — on a short desktop
// window or a narrow/short web viewport, a card taller than the viewport (the full sign-in
// form's real height) was clipped with no way to reach the rest of it, since Expo's web output
// sets `body { overflow: hidden }`. Same fix as LoginScreenChrome.tsx's mobile variant and
// HomeScreen.tsx/ScanShellScreen.web.tsx's identical "flex:1 clips against a short viewport"
// fix: a ScrollView whose content container still centers the card (via `justifyContent` on the
// content container itself) whenever it already fits, and scrolls once it doesn't.
//
// 010-registration-redesign T012 (FR-016, plan.md Research Decision 6): CARD_MAX_WIDTH below is
// now sourced from the shared AUTH_CARD_MAX_WIDTH constant (authCardLayout.ts) instead of a
// locally-owned literal, so this screen's web auth-card width and the new CrearCuentaScreen.web
// one can never silently drift apart — same value (660) as before this change, just with one
// shared source of truth.
import type { ReactNode } from "react";
import type { ViewStyle } from "react-native";
import { ScrollView, StyleSheet, View } from "react-native";

import { colors, radius, shadowSurface, withAlpha } from "@/theme";

import { AUTH_CARD_MAX_WIDTH } from "./authCardLayout";

type WebOnlyViewStyle = ViewStyle & { backgroundImage?: string };

// Radial-bloom color — derived from colors.brand.primary at the brief's specified 18% alpha
// (§4.2, src/theme/colorUtils.ts), not a bare rgba literal disconnected from the token.
const BLOOM_COLOR = withAlpha(colors.brand.primary, 0.18);

// Two blooms (top-right, bottom-left), each soft-edged via a fully-transparent outer stop.
const bloomBackgroundStyle: WebOnlyViewStyle = {
  backgroundImage: [
    `radial-gradient(circle at 100% 0%, ${BLOOM_COLOR} 0%, transparent 60%)`,
    `radial-gradient(circle at 0% 100%, ${BLOOM_COLOR} 0%, transparent 60%)`,
  ].join(", "),
};

const CARD_MAX_WIDTH = AUTH_CARD_MAX_WIDTH;
const CARD_PADDING = 48;

export interface LoginScreenChromeProps {
  children: ReactNode;
}

export function LoginScreenChrome({ children }: LoginScreenChromeProps) {
  return (
    <ScrollView
      style={[styles.page, bloomBackgroundStyle]}
      contentContainerStyle={styles.pageContent}
      // Same fix as LoginScreenChrome.tsx's mobile variant — without it, the first tap on
      // "Entrar"/"Olvidé mi contraseña"/"Crear cuenta" on a mobile browser (Safari iOS, Chrome
      // Android — both real, supported web targets, Constitution I) while the on-screen keyboard
      // is still open only dismisses the keyboard instead of registering the press.
      keyboardShouldPersistTaps="handled"
      testID="login-chrome-content"
    >
      <View style={[styles.card, shadowSurface]} testID="login-chrome-card">
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg.page,
  },
  pageContent: {
    flexGrow: 1,
    minHeight: "100vh" as unknown as number,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: CARD_MAX_WIDTH,
    borderRadius: radius.card,
    backgroundColor: colors.bg.surfaceMuted,
    padding: CARD_PADDING,
  },
});
