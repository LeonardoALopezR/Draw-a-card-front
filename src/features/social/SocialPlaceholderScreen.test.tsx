// Covers FR-007 — Social MUST render a reachable, distinctly-labelled placeholder screen with
// no real content (no feed, post, or trading content of any kind), never an unmatched-route/
// 404 error.
import React from "react";
import { render } from "@testing-library/react-native";

import { SocialPlaceholderScreen } from "./SocialPlaceholderScreen";

describe("SocialPlaceholderScreen", () => {
  // FR-007: renders identifying "Social" copy with an accessible heading, so it is
  // unambiguously distinguishable from the Amigos placeholder and from an error page.
  it('renders "Social" copy with an accessible heading', () => {
    const { getByRole, getByText } = render(<SocialPlaceholderScreen />);

    expect(getByRole("header")).toBeTruthy();
    expect(getByText("Social")).toBeTruthy();
    expect(getByText(/social feed isn't available yet/i)).toBeTruthy();
  });

  // FR-007: no feed, post, or trading content of any kind — hard scope boundary. Only the two
  // static disclaimer lines above render; nothing resembling a feed/post list is present.
  it("renders no feed or post content (only the two static disclaimer lines)", () => {
    const { getAllByText } = render(<SocialPlaceholderScreen />);

    expect(getAllByText(/./)).toHaveLength(2);
  });
});
