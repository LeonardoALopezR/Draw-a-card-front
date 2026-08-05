// T014 (specs/004-home-scan-shell): confirms app/(app)/social.tsx renders
// SocialPlaceholderScreen (src/features/social/SocialPlaceholderScreen.tsx, T006) — a
// reachable, distinctly-labelled placeholder, never an unmatched-route error (FR-007).
import React from "react";
import { render, screen } from "@testing-library/react-native";

import SocialRouteScreen from "./social";

describe("app/(app)/social.tsx", () => {
  // FR-007: the Social destination renders its own identifying placeholder content, distinct
  // from Amigos.
  it("renders the Social placeholder screen", () => {
    render(<SocialRouteScreen />);

    expect(screen.getByRole("header", { name: "Social" })).toBeTruthy();
  });
});
