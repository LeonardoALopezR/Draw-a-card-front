// specs/008-scan-experience/tasks.md T030 (US6, FR-015): confirms app/(app)/trades.tsx
// renders TradesPlaceholderScreen (src/features/trading/TradesPlaceholderScreen.tsx, T028) —
// a reachable, distinctly-labelled placeholder, never an unmatched-route error.
import React from "react";
import { render, screen } from "@testing-library/react-native";

import TradesRouteScreen from "./trades";

describe("app/(app)/trades.tsx", () => {
  // FR-015: the Trades destination renders its own identifying placeholder content.
  it("renders the Trades placeholder screen", () => {
    render(<TradesRouteScreen />);

    expect(screen.getByRole("header", { name: "Trades" })).toBeTruthy();
  });
});
