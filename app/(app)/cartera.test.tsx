// specs/008-scan-experience/tasks.md T030 (US6, FR-015): confirms app/(app)/cartera.tsx
// renders CarteraPlaceholderScreen (src/features/portfolio/CarteraPlaceholderScreen.tsx, T027)
// — a reachable, distinctly-labelled placeholder, never an unmatched-route error.
import React from "react";
import { render, screen } from "@testing-library/react-native";

import CarteraRouteScreen from "./cartera";

describe("app/(app)/cartera.tsx", () => {
  // FR-015: the Cartera destination renders its own identifying placeholder content.
  it("renders the Cartera placeholder screen", () => {
    render(<CarteraRouteScreen />);

    expect(screen.getByRole("header", { name: "Cartera" })).toBeTruthy();
  });
});
