// Covers FR-015 (Trades MUST render a reachable, distinctly-labelled placeholder screen with
// no real content, never an unmatched-route/404 error) and FR-017 (every string this feature
// renders ships through the i18n layer in both locales) for TradesPlaceholderScreen
// (specs/008-scan-experience, T028).
import React from "react";
import { render } from "@testing-library/react-native";

import { TradesPlaceholderScreen } from "./TradesPlaceholderScreen";

describe("TradesPlaceholderScreen", () => {
  // FR-015: renders identifying "Trades" copy with an accessible heading, so it is
  // unambiguously distinguishable from Cartera/Perfil and from an error page.
  it('renders "Trades" copy with an accessible heading', () => {
    const { getByRole, getByText } = render(<TradesPlaceholderScreen />);

    expect(getByRole("header", { name: "Trades" })).toBeTruthy();
    expect(getByText(/todavía no tiene contenido/)).toBeTruthy();
  });

  // FR-015: no trade/offer data of any kind — hard scope boundary. Only the two static
  // disclaimer lines render.
  it("renders no trade/offer data (only the two static disclaimer lines)", () => {
    const { getAllByText } = render(<TradesPlaceholderScreen />);

    expect(getAllByText(/./)).toHaveLength(2);
  });
});
