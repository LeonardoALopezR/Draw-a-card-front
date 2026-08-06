// Covers FR-003 and spec.md US1 AS4-AS6 (specs/004-home-scan-shell, T012) for
// app/(app)/_layout.web.tsx: picks WebSidebarNav (>=768px, T010) or WebBottomBarNav (<768px,
// T011) via resolveWebNavLayout (src/domain/navigation.ts, T001) — no inline Platform.OS
// branch, the ".web.tsx" extension itself is the platform split (Constitution IV). Mocks
// "react-native/Libraries/Utilities/useWindowDimensions" directly (the module RN's own
// `useWindowDimensions` re-export resolves to at runtime) so the width can be controlled per
// test, and mocks "expo-router" the same way WebSidebarNav.test.tsx/WebBottomBarNav.test.tsx
// (T010/T011) do, since both nav components render expo-router's <Link>/<Slot>.
//
// NOT colocated as "app/(app)/_layout.web.test.tsx" — deliberately, per the dev-server-crash
// fix documented in progress/impl_004-home-scan-shell.md's "dev-server crash fix" entry.
// expo-router's dev-server route-manifest scan (@expo/cli's getRoutePaths -> expo-router's
// getDirectoryTree, used only by `expo start`/`npm run web`, not `expo export`) globs every
// *.ts(x) file directly under app/ from disk and is NOT filtered by metro.config.js's
// resolver.blockList (that blockList only reaches Metro's own bundling/module-resolution
// graph, a different code path). For layout files specifically, getDirectoryTree's conflict
// check keys purely on "same directory + same platform-specificity", not on filename — and
// _layout.web.test.tsx's ".test" segment is silently discarded by expo-router's
// name.split(".") filename parsing (only the first two dot-segments are examined), so
// "_layout.web.test.tsx" is indistinguishable from a second "_layout.web.tsx" in the same
// directory at the same specificity, and expo-router throws "the layouts ... conflict" and
// refuses to start. Ordinary (non-layout) colocated screen tests, e.g.
// app/(auth)/register.test.tsx, do NOT hit this: screen-route conflicts are keyed by the full
// route *name*, and appending ".test" always yields a distinct route name for a screen file
// (see docs/conventions.md's "Tests" section for the fuller explanation) — so this relocation
// is specific to `_layout.*` files, not a general retreat from this repo's colocated-test
// convention.
import React from "react";
import { render, screen } from "@testing-library/react-native";

jest.mock("react-native/Libraries/Utilities/useWindowDimensions");

jest.mock("expo-router", () => {
  const { Text } = require("react-native");
  return {
    Link: ({ children, href, ...rest }: any) => <Text {...rest}>{children}</Text>,
    Slot: () => {
      const { Text: SlotText } = require("react-native");
      return <SlotText testID="active-screen-slot">active screen</SlotText>;
    },
  };
});

// T012 (specs/008-scan-experience): both WebSidebarNav and WebBottomBarNav now render
// ShellHeader (T008) above their <Slot />, which calls useSafeAreaInsets() — the library's own
// official Jest mock, same technique WebSidebarNav.test.tsx/WebBottomBarNav.test.tsx use.
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default
);

import { useWindowDimensions } from "react-native";

import AppWebLayout from "../../../app/(app)/_layout.web";

const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<
  typeof useWindowDimensions
>;

function mockWidth(width: number) {
  mockUseWindowDimensions.mockReturnValue({
    width,
    height: 800,
    scale: 1,
    fontScale: 1,
  });
}

describe("app/(app)/_layout.web.tsx", () => {
  afterEach(() => {
    mockUseWindowDimensions.mockReset();
  });

  // FR-003, US1 AS4: below the 768px breakpoint renders the bottom-bar treatment.
  it("renders WebBottomBarNav at 767px width", () => {
    mockWidth(767);
    render(<AppWebLayout />);

    expect(screen.getByTestId("web-bottom-bar-nav")).toBeTruthy();
    expect(screen.queryByTestId("web-sidebar-nav")).toBeNull();
  });

  // FR-003, US1 AS5: at/above the 768px breakpoint renders the sidebar treatment.
  it("renders WebSidebarNav at 800px width", () => {
    mockWidth(800);
    render(<AppWebLayout />);

    expect(screen.getByTestId("web-sidebar-nav")).toBeTruthy();
    expect(screen.queryByTestId("web-bottom-bar-nav")).toBeNull();
  });

  // US1 AS6: a live resize across the breakpoint re-renders the correct treatment without a
  // reload. Simulated as a width-mock change followed by `rerender()` on the same render
  // result — see the file-level comment above for exactly what this does and does not prove.
  it("live-switches from the bottom bar to the sidebar on resize without a full remount", () => {
    mockWidth(767);
    const utils = render(<AppWebLayout />);
    expect(screen.getByTestId("web-bottom-bar-nav")).toBeTruthy();

    mockWidth(800);
    utils.rerender(<AppWebLayout />);

    expect(screen.getByTestId("web-sidebar-nav")).toBeTruthy();
    expect(screen.queryByTestId("web-bottom-bar-nav")).toBeNull();
    // Still showing the active screen's Slot content immediately after the switch — a live
    // re-render of the same mounted root, not a blank/error state mid-reload.
    expect(screen.getByTestId("active-screen-slot")).toBeTruthy();
  });
});
