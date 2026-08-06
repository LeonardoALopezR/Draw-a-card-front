// T008 (specs/008-scan-experience, FR-011): a thin, useSafeAreaInsets()-aware wrapper that
// positions TopRightControls (T007) top-right — the ONE shared header row consumed by all three
// shell entry points (app/(app)/_layout.tsx's native <Tabs> custom header, T009;
// WebSidebarNav.tsx's content column, T010; WebBottomBarNav.tsx's content column, T011), so the
// four icon controls render identically across all five destinations instead of being duplicated
// per-screen (FR-011's "not duplicated per-screen" requirement). Reuses the exact safe-area
// padding logic HomeScreen.tsx (004-home-scan-shell) applied to its own top row — 16 base +
// insets.top/insets.right — since this component is the direct successor to that top row's
// right-hand half now that the left-hand AmigosQuickAccessPill has been retired (US6) and
// TopRightControls itself moved out of Inicio-only placement (US1). No props — reads nothing but
// the safe-area/theme/i18n context already available anywhere it's mounted.
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TopRightControls } from "./TopRightControls";

export function ShellHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View
      testID="shell-header"
      style={[
        styles.row,
        // useSafeAreaInsets() (react-native-safe-area-context, already a project dependency) is
        // 0 on web, so this is a no-op there — same as HomeScreen.tsx's original top row.
        {
          paddingTop: 16 + insets.top,
          paddingLeft: 16 + insets.left,
          paddingRight: 16 + insets.right,
        },
      ]}
    >
      <TopRightControls />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    paddingBottom: 16,
  },
});
