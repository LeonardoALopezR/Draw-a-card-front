// Covers FR-001 (all three NAV_DESTINATIONS reachable from the shell), FR-003 (the web
// sidebar treatment), SC-002 (every destination operable via keyboard alone, zero
// pointer-only elements) per tasks.md T010 (specs/004-home-scan-shell). Mocks expo-router's
// <Link>/<Slot> to a plain accessible <Text> the same way
// AmigosQuickAccessPill.test.tsx mocks useRouter — this asserts the real props/roles
// WebSidebarNav renders, not expo-router's own internal navigation wiring (already covered by
// expo-router itself), per docs/verification.md Level 2.
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

import { WebSidebarNav } from "./WebSidebarNav";

describe("WebSidebarNav", () => {
  // FR-001, SC-002: all three destinations render as real, individually reachable links —
  // not icon-only, not pointer-only.
  it("renders all three NAV_DESTINATIONS as links with correct roles and labels", () => {
    render(<WebSidebarNav />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(NAV_DESTINATIONS.length);

    NAV_DESTINATIONS.forEach((destination) => {
      expect(screen.getByRole("link", { name: destination.label })).toBeTruthy();
    });
  });

  // SC-002: each link is enabled (not disabled/pointer-only), so it is reachable in the
  // keyboard tab order.
  it("renders each destination as an enabled, keyboard-reachable link", () => {
    render(<WebSidebarNav />);

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link.props.accessibilityState?.disabled).not.toBe(true);
    });
  });

  // FR-003: wraps the active screen via expo-router's <Slot />.
  it("wraps an expo-router Slot for the active screen", () => {
    render(<WebSidebarNav />);

    expect(screen.getByTestId("active-screen-slot")).toBeTruthy();
  });
});
