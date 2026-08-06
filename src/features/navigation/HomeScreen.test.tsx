// Covers FR-013 (Inicio's redesigned content — BrandMark, display.xl title, tagline, and the
// repurposed quick-action card, spec.md Clarifications' Recorded default 1) for HomeScreen
// (specs/008-scan-experience, T025) — asserts the new brand block renders, that
// AmigosQuickAccessPill/TopRightControls no longer render from this file (both retired/moved
// elsewhere per US1/US6), and that pressing the quick-action card navigates to exactly
// NAV_DESTINATIONS' "escanear" route (spec.md US5 AS2), not a hardcoded route string. Mocks
// expo-router's `useRouter` with a single shared, resettable `mockPush`, mirroring
// AmigosQuickAccessPill.test.tsx's established pattern (HomeScreen itself now owns the
// escanear-lookup-and-push logic previously exercised only by that retired component).
//
// FR-017 / code review Round 7 Finding 1: also covers the quick-action card's own localized
// label ("Escanear una carta" / "Scan a card") in both locales, mirroring
// TopRightControls.test.tsx's established LocaleProvider + LocaleSwitchTrigger pattern — this is
// the exact test that would have caught the card shipping with a hardcoded English label.
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { Pressable, ScrollView, Text } from "react-native";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { homeCopy } from "@/domain/i18n/copy/home";
import { NAV_DESTINATIONS } from "@/domain/navigation";
import { LocaleProvider, useLocale } from "@/features/i18n/LocaleContext";

import { HomeScreen } from "./HomeScreen";

// Reuses the exact test-only "flip the locale" trigger pattern already established by
// TopRightControls.test.tsx / src/features/i18n/LocaleContext.test.tsx.
function LocaleSwitchTrigger() {
  const { setLocale } = useLocale();
  return (
    <Pressable testID="switch-to-en" onPress={() => setLocale("en")} accessibilityRole="button">
      <Text>switch</Text>
    </Pressable>
  );
}

describe("HomeScreen (Inicio)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // FR-013: the BrandMark + display.xl title + tagline render inside the brand block, per
  // spec.md Clarifications' Recorded default 1 (Option A).
  it("renders the BrandMark, title, and tagline in the brand block", () => {
    render(<HomeScreen />);

    const brandBlock = within(screen.getByTestId("home-screen-brand-block"));
    expect(brandBlock.getByLabelText("Draw a Card")).toBeTruthy();
    expect(brandBlock.getByRole("header", { name: "Inicio" })).toBeTruthy();
    expect(brandBlock.getByText("Tu colección, siempre a la mano")).toBeTruthy();
  });

  // FR-013/US1: AmigosQuickAccessPill and TopRightControls are both retired from this file —
  // AmigosQuickAccessPill outright (US6), TopRightControls moved to the shared ShellHeader
  // (US1) — so HomeScreen itself now renders exactly one button (the quick-action card).
  it("no longer renders the Amigos pill or the top-right controls from this file", () => {
    render(<HomeScreen />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Amigos" })).toBeNull();
  });

  // FR-004/FR-013 (code review Round 7 Finding 1 fix): the centre "+" scan card still renders
  // inside the centre region, and now both shows its localized text ("Escanear una carta",
  // homeCopy.es.scanQuickActionLabel — Recorded default 1's exact wording) and exposes that same
  // string as its accessible name, defaulting to Spanish (DEFAULT_LOCALE) with no
  // <LocaleProvider> wrapping the render — the same bare-render-defaults-to-es convention every
  // other i18n'd component test in this repo uses.
  it("renders the scan entry card dead centre with its localized visible text and accessibility label", () => {
    render(<HomeScreen />);

    const centre = within(screen.getByTestId("home-screen-centre"));
    expect(centre.getByText(homeCopy.es.scanQuickActionLabel)).toBeTruthy();
    expect(centre.getByRole("button", { name: homeCopy.es.scanQuickActionLabel })).toBeTruthy();
  });

  // FR-017 / code review Round 7 Finding 1: switching the locale context to "en" (the exact
  // seam 007-localization's future picker calls) re-renders the quick-action card's visible text
  // and accessibility label in English — this is the test that would have caught the card
  // shipping with a hardcoded "Scan a card" regardless of locale.
  it("renders the quick-action card's English label when the locale context is set to 'en'", () => {
    render(
      <LocaleProvider>
        <LocaleSwitchTrigger />
        <HomeScreen />
      </LocaleProvider>
    );

    // Sanity check: Spanish by default, before the switch.
    expect(screen.getByText(homeCopy.es.scanQuickActionLabel)).toBeTruthy();

    fireEvent.press(screen.getByTestId("switch-to-en"));

    expect(screen.getByText(homeCopy.en.scanQuickActionLabel)).toBeTruthy();
    expect(screen.getByRole("button", { name: homeCopy.en.scanQuickActionLabel })).toBeTruthy();
    expect(screen.queryByText(homeCopy.es.scanQuickActionLabel)).toBeNull();
  });

  // T020/T021 regression guard (unchanged from 004-home-scan-shell): the screen must stay
  // scrollable, not clipped, on a short viewport.
  it("wraps its content in a ScrollView so the screen can scroll independently on a short viewport", () => {
    render(<HomeScreen />);

    const scrollView = screen.UNSAFE_getByType(ScrollView);
    expect(scrollView.props.testID).toBe("home-screen");
  });

  // FR-013, spec.md US5 AS2: pressing the quick-action card navigates to exactly
  // NAV_DESTINATIONS' "escanear" route — not a hardcoded "/escanear" literal in either this
  // component or this test.
  it("navigates to exactly NAV_DESTINATIONS' escanear route when the quick-action card is pressed", () => {
    render(<HomeScreen />);

    const escanearDestination = NAV_DESTINATIONS.find((destination) => destination.key === "escanear");
    expect(escanearDestination).toBeDefined();

    fireEvent.press(screen.getByRole("button", { name: homeCopy.es.scanQuickActionLabel }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(escanearDestination?.route);
  });
});
