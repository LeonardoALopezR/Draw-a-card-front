// Covers FR-015 (Cartera MUST render a reachable, distinctly-labelled placeholder screen with
// no real content, never an unmatched-route/404 error) and FR-017 (every string this feature
// renders ships through the i18n layer in both locales) for CarteraPlaceholderScreen
// (specs/008-scan-experience, T027).
import React from "react";
import { render } from "@testing-library/react-native";

import { CarteraPlaceholderScreen } from "./CarteraPlaceholderScreen";

describe("CarteraPlaceholderScreen", () => {
  // FR-015: renders identifying "Cartera" copy with an accessible heading, so it is
  // unambiguously distinguishable from Trades/Perfil and from an error page.
  it('renders "Cartera" copy with an accessible heading', () => {
    const { getByRole, getByText } = render(<CarteraPlaceholderScreen />);

    expect(getByRole("header", { name: "Cartera" })).toBeTruthy();
    expect(getByText(/todavía no tiene contenido/)).toBeTruthy();
  });

  // FR-015: no portfolio/inventory data of any kind — hard scope boundary. Only the two static
  // disclaimer lines render.
  it("renders no portfolio/inventory data (only the two static disclaimer lines)", () => {
    const { getAllByText } = render(<CarteraPlaceholderScreen />);

    expect(getAllByText(/./)).toHaveLength(2);
  });
});
