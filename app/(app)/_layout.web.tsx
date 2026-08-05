import { useWindowDimensions } from "react-native";

import { resolveWebNavLayout } from "@/domain/navigation";
import { WebBottomBarNav } from "@/features/navigation/WebBottomBarNav";
import { WebSidebarNav } from "@/features/navigation/WebSidebarNav";

// T012 (specs/004-home-scan-shell): the web-only shell layout — reads useWindowDimensions()
// and calls resolveWebNavLayout(width) (src/domain/navigation.ts, T001) to pick WebSidebarNav
// (>=768px, T010) or WebBottomBarNav (<768px, T011). No inline Platform.OS branch anywhere in
// this file — the ".web.tsx" extension itself is the platform split (Constitution IV, FR-003).
// This file resolves only on web; app/(app)/_layout.tsx (no platform suffix, T009) is what
// resolves on iOS/Android.
export default function AppWebLayout() {
  const { width } = useWindowDimensions();
  const layout = resolveWebNavLayout(width);

  return layout === "sidebar" ? <WebSidebarNav /> : <WebBottomBarNav />;
}
