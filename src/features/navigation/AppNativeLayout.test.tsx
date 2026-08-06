// Covers spec.md User Story 3, Acceptance Scenario 4 ("navigate away via the shell and back...
// resets to idle") for app/(app)/_layout.tsx's native <Tabs> wiring — specifically the AS4
// follow-up fix (T020a, specs/008-scan-experience/tasks.md; orchestrator decision 2026-08-05,
// option (a); see progress/review_008-scan-experience.md's Round 5 §1 and
// progress/impl_008-scan-experience.md's AS4 follow-up entry).
//
// `@react-navigation/bottom-tabs` v6.5.20's `unmountOnBlur` is a genuine, documented per-screen
// `<Tabs.Screen options>` field read by the navigator itself — it is never executed by
// `AppTabsLayout` (this file's default export) or by `ScanShellScreen.tsx`, so no amount of
// `fireEvent`-driven interaction with either component under React Testing Library can actually
// exercise "does a real tab blur/focus reset this screen." Faking that with a manual
// mount/unmount cycle would just prove React's own well-known unmount behavior, not that this
// screen is wired to opt into it. The only honest thing a test at this level can assert is that
// the *option itself* is set on the Escanear <Tabs.Screen>'s config — which is what's below.
//
// This uses React's shallow renderer (react-test-renderer/shallow, a transitive dependency of
// react-test-renderer, already installed) rather than
// @testing-library/react-native's `render()`, deliberately: `<Tabs>` is a real
// `@react-navigation/bottom-tabs` navigator that needs a `<NavigationContainer>` (normally
// supplied by expo-router's own root, not present when a screen file is rendered standalone in
// a test — the same constraint that sank this file's earlier `useFocusEffect` prototype, per
// progress/impl_008-scan-experience.md's "reverted attempt" section). Shallow-rendering
// `<AppTabsLayout />` calls the component function (running its hooks, including
// `useTranslation`) but does NOT recurse into `<Tabs>` itself, so no `NavigationContainer` is
// needed — it returns the raw `<Tabs>` React element with its `children` array of unexecuted
// `<Tabs.Screen>` elements, each still carrying its real `options` object/prop as plain data.
//
// NOT colocated as "app/(app)/_layout.test.tsx" — deliberately, per the dev-server-crash fix
// documented for `_layout.*` files in docs/conventions.md's "Tests" section (same reasoning as
// AppWebLayout.test.tsx, colocated here for the same rationale).
import ShallowRenderer from "react-test-renderer/shallow";
import type { ReactElement } from "react";

import AppTabsLayout from "../../../app/(app)/_layout";

interface TabsScreenLike {
  props: {
    name: string;
    options: { unmountOnBlur?: boolean };
  };
}

function renderScreens(): TabsScreenLike[] {
  const renderer = new ShallowRenderer();
  const output = renderer.render(<AppTabsLayout />) as ReactElement<{
    children: TabsScreenLike[];
  }>;
  return output.props.children;
}

describe("app/(app)/_layout.tsx — native <Tabs> per-screen options (T020a, AS4)", () => {
  it("sets unmountOnBlur: true on the Escanear <Tabs.Screen> only, so its local found-state resets on every tab-away/back", () => {
    const screens = renderScreens();

    const byName = Object.fromEntries(screens.map((screen) => [screen.props.name, screen]));

    expect(byName.escanear.props.options.unmountOnBlur).toBe(true);

    // The other four destinations keep the navigator's own default (unset here, not explicitly
    // false) — this is a scoped fix, not a blanket change to every screen's behavior.
    expect(byName.index.props.options.unmountOnBlur).toBeUndefined();
    expect(byName.cartera.props.options.unmountOnBlur).toBeUndefined();
    expect(byName.trades.props.options.unmountOnBlur).toBeUndefined();
    expect(byName.perfil.props.options.unmountOnBlur).toBeUndefined();
  });
});
