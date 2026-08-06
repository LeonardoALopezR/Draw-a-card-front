// T025 (006-visual-identity): mobile/default background chrome for /login — a soft pale-lime-
// to-bg.page vertical gradient wash sized to ~45% of viewport height, per docs/design-brief-
// visual-identity.md §4.1. Purely presentational passthrough: accepts `children` and renders
// them unchanged (see LoginScreenChrome.test.tsx's passthrough regression guard) — LoginScreen.
// tsx (a later task) owns what content actually goes inside it, and where the brand block ends
// vs. the form block begins; this component only supplies the background. The web counterpart
// (LoginScreenChrome.web.tsx, §4.2's card-over-radial-blooms treatment) is a separate file via
// the .web.tsx convention (Constitution IV/FR-005), not an inline Platform.OS branch here.
//
// T051 fix (responsive layout check, SC-006): `children` used to render inside a plain
// `flex: 1` View. On a short/narrow viewport (a 375px-wide phone with the on-screen keyboard
// up, a landscape phone, or simply the full sign-in form's real height — brand block + two
// fields + forgot-password link + primary button + divider + secondary button + legal line —
// exceeding the viewport) that clipped the bottom of the form with no way to reach it, since
// Expo's web output sets `body { overflow: hidden }` and RN's flexbox gives an overflowing
// flex:1 child no scroll affordance of its own. This is the exact same failure mode
// HomeScreen.tsx (004-home-scan-shell, T020/T021) and ScanShellScreen.tsx (006-visual-identity,
// T043) already fixed the identical way — a ScrollView with a `flexGrow: 1` content container
// scrolls independently on a short viewport while laying out identically (still centered by
// LoginScreen.tsx's own `screen` style) whenever everything already fits.
import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";

import { colors, withAlpha } from "@/theme";

// Pale-lime wash top color — derived from colors.brand.primary at the brief's specified 22%
// alpha (§4.1, src/theme/colorUtils.ts), not a bare rgba literal disconnected from the token.
const WASH_TOP_COLOR = withAlpha(colors.brand.primary, 0.22);

// "fading to bg.page by roughly 45% of the viewport height" (§4.1).
const WASH_HEIGHT_RATIO = 0.45;

export interface LoginScreenChromeProps {
  children: ReactNode;
}

export function LoginScreenChrome({ children }: LoginScreenChromeProps) {
  const { height } = useWindowDimensions();

  return (
    <View style={styles.page}>
      <LinearGradient
        colors={[WASH_TOP_COLOR, colors.bg.page]}
        style={[styles.wash, { height: height * WASH_HEIGHT_RATIO }]}
        pointerEvents="none"
        testID="login-chrome-wash"
      />
      {/* Rendered above the wash (later in paint order) so content flowing past the wash's
          height naturally lands on the flat bg.page beneath it, per §4.1. The wash itself is a
          sibling of this ScrollView (not inside it), so it stays pinned to the viewport instead
          of scrolling away with the form content. */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        // Without this, RN's default `keyboardShouldPersistTaps="never"` means the FIRST tap on
        // "Entrar"/"Olvidé mi contraseña"/"Crear cuenta" while the email/password field's
        // keyboard is still open only dismisses the keyboard — the press itself is swallowed,
        // requiring a second tap to actually submit/navigate. "handled" lets a tap on a real
        // touchable still fire while also dismissing the keyboard, avoiding a dead-tap
        // regression this ScrollView would otherwise introduce (T051 fix; this screen didn't
        // have this failure mode before it had a ScrollView at all).
        keyboardShouldPersistTaps="handled"
        testID="login-chrome-content"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg.page,
  },
  wash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});
