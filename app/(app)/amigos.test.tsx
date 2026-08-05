// T014 (specs/004-home-scan-shell): confirms app/(app)/amigos.tsx renders
// AmigosPlaceholderScreen (src/features/social/AmigosPlaceholderScreen.tsx, T005) — a reachable,
// distinctly-labelled placeholder, never an unmatched-route error (FR-007).
import React from "react";
import { render, screen } from "@testing-library/react-native";

import AmigosRouteScreen from "./amigos";

describe("app/(app)/amigos.tsx", () => {
  // FR-007: the Amigos destination renders its own identifying placeholder content.
  it("renders the Amigos placeholder screen", () => {
    render(<AmigosRouteScreen />);

    expect(screen.getByRole("header", { name: "Amigos" })).toBeTruthy();
  });
});
