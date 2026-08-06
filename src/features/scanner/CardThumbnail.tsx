// Human-requested follow-up (2026-08-06) to specs/008-scan-experience: a shared, decorative
// gradient thumbnail — replaces the flat `backgroundColor: card.thumbnailColorToken` swatch
// `RecentScansList.tsx` and `FoundCardPanel.tsx` each rendered independently, per the supplied
// mockups (a rounded *gradient* thumbnail per card, Dragón Eterno's specifically a purple
// gradient). One shared component instead of two independently-styled `LinearGradient`s, per
// docs/conventions.md's "extreme consistency" principle.
//
// Dependency note: `expo-linear-gradient` is NOT a new dependency for this feature — it is
// already declared in package.json (~13.0.2) and already imported by
// src/features/identity/LoginScreenChrome.tsx (006-visual-identity), including a genuine
// `NativeLinearGradient.web.tsx` variant (CSS gradient under the hood) — so this gets a real
// gradient on iOS, Android, AND web with zero new runtime dependency, unlike a hand-layered-View
// approximation (which cannot produce a true multi-stop blend) or a CSS-only approach (which
// would not work on native). See progress/impl_008-scan-experience.md's dependency-decision
// entry for the full reasoning trail.
//
// Purely decorative (Constitution VII) — never focusable, never announced to assistive tech.
// Matches the plain flat-color `View` it replaces exactly: no `accessibilityRole`, no `onPress`,
// nothing that makes it an accessibility element in the first place — the card row/panel around
// it already carries the real accessible name (card name/meta/price). Deliberately does NOT set
// `accessible={false}`/`importantForAccessibility="no-hide-descendants"`: on this repo's pinned
// `@testing-library/react-native`, those props also remove the node from *default* test queries
// (`getByTestId` etc. skip elements hidden from the accessibility tree unless a caller opts in
// with `{ includeHiddenElements: true }`), which would silently break every existing
// `getByTestId("found-card-thumbnail")`/`getByTestId("recent-scan-row-...")`-style assertion this
// component is nested inside — not worth it when omitting a role/press-handler already achieves
// the same "not focusable, not announced" outcome.
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

import { radius } from "@/theme";

export interface CardThumbnailProps {
  /** Ordered light-stop -> dark-stop pair — always a `src/theme/colors.ts` `gradients` token,
   * never a raw hex literal at the call site (src/domain/scanResults.ts's `thumbnailGradient`). */
  readonly gradient: readonly [string, string];
  readonly size: number;
  readonly testID?: string;
}

export function CardThumbnail({ gradient, size, testID }: CardThumbnailProps) {
  return (
    <LinearGradient
      colors={gradient}
      style={[styles.base, { width: size, height: size }]}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.row,
  },
});
