// Covers FR-007 — Amigos MUST render a reachable, distinctly-labelled placeholder screen with
// no real content (no friend list, friend request, or social data of any kind), never an
// unmatched-route/404 error.
import React from "react";
import { render } from "@testing-library/react-native";

import { AmigosPlaceholderScreen } from "./AmigosPlaceholderScreen";

describe("AmigosPlaceholderScreen", () => {
  // FR-007: renders identifying "Amigos" copy with an accessible heading, so it is
  // unambiguously distinguishable from the Social placeholder and from an error page.
  it('renders "Amigos" copy with an accessible heading', () => {
    const { getByRole, getByText } = render(<AmigosPlaceholderScreen />);

    expect(getByRole("header")).toBeTruthy();
    expect(getByText("Amigos")).toBeTruthy();
    expect(getByText(/friends list isn't available yet/i)).toBeTruthy();
  });

  // FR-007: no friend list, friend request, or social data of any kind — hard scope boundary.
  // Only the two static disclaimer lines above render; nothing resembling a list of friends
  // (e.g. a rendered name/username) is present.
  it("renders no friend list or friend-request UI (only the two static disclaimer lines)", () => {
    const { getAllByText } = render(<AmigosPlaceholderScreen />);

    expect(getAllByText(/./)).toHaveLength(2);
  });
});
