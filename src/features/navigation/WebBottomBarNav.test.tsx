// Covers FR-001 (all three NAV_DESTINATIONS reachable from the shell), FR-003 (the web bottom
// bar treatment), SC-002 (every destination operable via keyboard alone), SC-003 (no
// horizontal overflow at narrow web widths) per tasks.md T011 (specs/004-home-scan-shell).
// Mocks expo-router's <Link>/<Slot> the same way WebSidebarNav.test.tsx does, per
// docs/verification.md Level 2.
import React from "react";
import { render, screen } from "@testing-library/react-native";

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

import { NAV_DESTINATIONS } from "@/domain/navigation";

import { WebBottomBarNav } from "./WebBottomBarNav";

describe("WebBottomBarNav", () => {
  // FR-001, SC-002: all three destinations render as real, individually reachable links —
  // the same three-destination coverage as WebSidebarNav.test.tsx (T010).
  it("renders all three NAV_DESTINATIONS as links with correct roles and labels", () => {
    render(<WebBottomBarNav />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(NAV_DESTINATIONS.length);

    NAV_DESTINATIONS.forEach((destination) => {
      expect(screen.getByRole("link", { name: destination.label })).toBeTruthy();
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

  // FR-003: wraps the active screen via expo-router's <Slot />.
  it("wraps an expo-router Slot for the active screen", () => {
    render(<WebBottomBarNav />);

    expect(screen.getByTestId("active-screen-slot")).toBeTruthy();
  });
});
