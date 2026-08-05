// Covers FR-008: the top-left Amigos pill navigates to exactly the same route as
// NAV_DESTINATIONS' Amigos entry (src/domain/navigation.ts, T001) — derived from the shared
// table, not a hardcoded duplicate string, so it can never drift from the shell's own Amigos
// tab route. docs/verification.md Level 2 — asserts rendered output/behavior via a mocked
// expo-router, not implementation details, mirroring app/(auth)/verify-phone.test.tsx's
// established expo-router mocking pattern.
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { NAV_DESTINATIONS } from "@/domain/navigation";

import { AmigosQuickAccessPill } from "./AmigosQuickAccessPill";

describe("AmigosQuickAccessPill", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // FR-008: the navigation call target equals exactly
  // NAV_DESTINATIONS.find(d => d.key === "amigos").route.
  it("navigates to exactly NAV_DESTINATIONS' Amigos route when pressed", () => {
    render(<AmigosQuickAccessPill />);

    fireEvent.press(screen.getByRole("button", { name: "Amigos" }));

    const amigosDestination = NAV_DESTINATIONS.find((destination) => destination.key === "amigos");
    expect(amigosDestination).toBeDefined();
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(amigosDestination?.route);
  });

  // SC-004: a non-empty accessibility label and a minimum 44x44 tap target.
  it("has a non-empty accessibility label and a minimum 44x44 tap target", () => {
    render(<AmigosQuickAccessPill />);

    const pill = screen.getByTestId("amigos-quick-access-pill");
    const style = StyleSheet.flatten(pill.props.style);

    expect(pill.props.accessibilityLabel).toBe("Amigos");
    expect(style.minWidth).toBeGreaterThanOrEqual(44);
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
  });
});
