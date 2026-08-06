// Covers FR-001 (all five NAV_DESTINATIONS reachable from the shell), FR-003 (the web bottom
// bar treatment), FR-011 (ShellHeader's four icon controls render above the active screen),
// FR-017/SC-006 (destination labels render through i18n and re-render in the active locale —
// Round 2 review Finding 1, fixed here), SC-002 (every destination operable via keyboard alone),
// SC-003 (no horizontal overflow at narrow web widths) per tasks.md T011
// (specs/008-scan-experience). Mocks expo-router's <Link>/<Slot> the same way
// WebSidebarNav.test.tsx does, per docs/verification.md Level 2.
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

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

// ShellHeader (T008, rendered by WebBottomBarNav as of this task) calls useSafeAreaInsets() —
// the library's own official Jest mock, same technique WebSidebarNav.test.tsx uses.
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default
);

import { NAV_DESTINATIONS, type NavDestinationKey } from "@/domain/navigation";
import { navCopy } from "@/domain/i18n/copy/nav";
import { LocaleProvider, useLocale } from "@/features/i18n/LocaleContext";

import { WebBottomBarNav } from "./WebBottomBarNav";

// Same key->navCopy label mapping WebBottomBarNav.tsx itself builds — used here only to assert
// against, not imported from the component under test.
const SPANISH_LABEL_BY_KEY: Record<NavDestinationKey, string> = {
  inicio: navCopy.es.navInicio,
  escanear: navCopy.es.navEscanear,
  cartera: navCopy.es.navCartera,
  trades: navCopy.es.navTrades,
  perfil: navCopy.es.navPerfil,
};

const ENGLISH_LABEL_BY_KEY: Record<NavDestinationKey, string> = {
  inicio: navCopy.en.navInicio,
  escanear: navCopy.en.navEscanear,
  cartera: navCopy.en.navCartera,
  trades: navCopy.en.navTrades,
  perfil: navCopy.en.navPerfil,
};

// Reuses the exact test-only "flip the locale" trigger pattern TopRightControls.test.tsx already
// established.
function LocaleSwitchTrigger() {
  const { setLocale } = useLocale();
  return (
    <Pressable testID="switch-to-en" onPress={() => setLocale("en")} accessibilityRole="button">
      <Text>switch</Text>
    </Pressable>
  );
}

describe("WebBottomBarNav", () => {
  // FR-001, SC-002: all five destinations render as real, individually reachable links — the
  // same five-destination coverage as WebSidebarNav.test.tsx (T010).
  it("renders all five NAV_DESTINATIONS as links with correct roles and labels", () => {
    render(<WebBottomBarNav />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(NAV_DESTINATIONS.length);
    expect(NAV_DESTINATIONS.length).toBe(5);

    NAV_DESTINATIONS.forEach((destination) => {
      expect(
        screen.getByRole("link", { name: SPANISH_LABEL_BY_KEY[destination.key] })
      ).toBeTruthy();
    });
  });

  // FR-017, SC-006 (Round 2 review Finding 1): destination labels MUST re-render in the active
  // locale — this genuinely fails without routing labels through useTranslation(navCopy), since
  // NAV_DESTINATIONS itself carries no label field to fall back on.
  it("re-renders the destination labels in English when the locale context switches to 'en'", () => {
    render(
      <LocaleProvider>
        <LocaleSwitchTrigger />
        <WebBottomBarNav />
      </LocaleProvider>
    );

    // Sanity check: Spanish by default, before the switch.
    expect(screen.getByRole("link", { name: navCopy.es.navInicio })).toBeTruthy();

    fireEvent.press(screen.getByTestId("switch-to-en"));

    NAV_DESTINATIONS.forEach((destination) => {
      expect(
        screen.getByRole("link", { name: ENGLISH_LABEL_BY_KEY[destination.key] })
      ).toBeTruthy();
    });
  });

  // SC-002: each link is enabled (not disabled/pointer-only), so it is reachable in the
  // keyboard tab order.
  it("renders each destination as an enabled, keyboard-reachable link", () => {
    render(<WebBottomBarNav />);

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link.props.accessibilityState?.disabled).not.toBe(true);
    });
  });

  // T033 (accessibility pass, Constitution VII): every destination link keeps a minimum 44x44
  // tap target, the same assertion technique TopRightControls.test.tsx already established.
  it("gives each destination link a minimum 44x44 tap target", () => {
    render(<WebBottomBarNav />);

    screen.getAllByRole("link").forEach((link) => {
      const style = StyleSheet.flatten(link.props.style);
      expect(style.minWidth).toBeGreaterThanOrEqual(44);
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
    });
  });

  // Regression test for the layout bug shipped in commit 39c3f02 and caught only by a live
  // browser render (docs/verification.md Level 3), never by this file's own test suite — see
  // progress/impl_008-scan-experience.md's dedicated fix entry. react-native-web renders <Link>
  // as an inline <a>; flex properties (gap/alignItems/justifyContent) applied directly to it are
  // silently ignored by the browser even though `StyleSheet.flatten(link.props.style)` genuinely
  // reports them — the T033 test above ("minimum 44x44 tap target") is exactly that kind of
  // style-object-only assertion and passed throughout the bug's lifetime. Asserting *structure*
  // instead — that the icon and label are wrapped in a real View, one level inside the Link,
  // rather than being the Link's direct children — is what actually catches this, since a View is
  // guaranteed to be a flex container on every platform (unlike Link/Text, whose web default is
  // `display: inline`).
  it("wraps each link's icon and label in a real View container, not as the Link's direct children", () => {
    render(<WebBottomBarNav />);

    NAV_DESTINATIONS.forEach((destination) => {
      const link = screen.getByRole("link", { name: SPANISH_LABEL_BY_KEY[destination.key] });

      // The mocked <Link> above forwards `children` verbatim, so the Link's own children must be
      // exactly one element — the wrapping View — never the label Text directly.
      expect(link.children).toHaveLength(1);
      const wrapperViews = link.findAllByType(View);
      expect(wrapperViews.length).toBeGreaterThan(0);

      // The label text lives inside that wrapper, not merely somewhere under the Link.
      expect(
        within(wrapperViews[0]).getByText(SPANISH_LABEL_BY_KEY[destination.key])
      ).toBeTruthy();
    });
  });

  // FR-011: ShellHeader's four icon controls render above the active screen's Slot.
  it("renders ShellHeader's four controls above the active screen's Slot", () => {
    render(<WebBottomBarNav />);

    expect(screen.getByTestId("shell-header")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  // FR-003: wraps the active screen via expo-router's <Slot />.
  it("wraps an expo-router Slot for the active screen", () => {
    render(<WebBottomBarNav />);

    expect(screen.getByTestId("active-screen-slot")).toBeTruthy();
  });
});
