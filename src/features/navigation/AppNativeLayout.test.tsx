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

import { colors, contrastRatio } from "@/theme";

import AppTabsLayout from "../../../app/(app)/_layout";

interface TabsScreenLike {
  props: {
    name: string;
    options: { unmountOnBlur?: boolean };
  };
}

interface TabsLike {
  props: {
    screenOptions: {
      tabBarActiveTintColor?: string;
      tabBarInactiveTintColor?: string;
    };
    children: TabsScreenLike[];
  };
}

function renderTabs(): TabsLike {
  const renderer = new ShallowRenderer();
  return renderer.render(<AppTabsLayout />) as unknown as TabsLike;
}

function renderScreens(): TabsScreenLike[] {
  return renderTabs().props.children;
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

// Defect fix (specs/008-scan-experience, 2026-08-06, found on a real iPhone 17 Pro simulator,
// FR-001): no `tabBarActiveTintColor`/`tabBarInactiveTintColor` were set at all, so iOS fell back
// to its system-default blue for the active tab instead of a brand token — 491/491 tests passed
// with the bug present because nothing ever asserted on `screenOptions`.
describe("app/(app)/_layout.tsx — native <Tabs> active/inactive tint colors (FR-001, Constitution VII)", () => {
  it("sets tabBarActiveTintColor/tabBarInactiveTintColor from theme tokens, not left to the system default", () => {
    const { screenOptions } = renderTabs().props;

    expect(screenOptions.tabBarActiveTintColor).toBe(colors.text.link);
    expect(screenOptions.tabBarInactiveTintColor).toBe(colors.text.secondary);
  });

  // `colors.brand.primary` (the lime) was the first instinct per the mockups, but it fails WCAG
  // AA against a light tab-bar background (~1.29:1) — this guards that whichever token is chosen
  // for the active tint actually clears AA against both plausible tab-bar backgrounds, rather than
  // relying on eyeballing it (the same class of bug this whole defect batch was about).
  it("the chosen active tint clears WCAG AA 4.5:1 against bg.surface and bg.page", () => {
    const { screenOptions } = renderTabs().props;
    const activeTint = screenOptions.tabBarActiveTintColor as string;

    expect(contrastRatio(activeTint, colors.bg.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(activeTint, colors.bg.page)).toBeGreaterThanOrEqual(4.5);
  });
});
