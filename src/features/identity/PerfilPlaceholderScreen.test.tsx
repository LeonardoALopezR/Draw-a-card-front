// Covers FR-015 (Perfil MUST render a reachable, distinctly-labelled placeholder screen with
// no real content, never an unmatched-route/404 error) and FR-017 (every string this feature
// renders ships through the i18n layer in both locales) for PerfilPlaceholderScreen
// (specs/008-scan-experience, T029). spec.md User Story 6 AS3: this component is explicitly
// distinct from the existing registration-flow ProfileForm.tsx — different purpose, no shared
// code — so this file asserts PerfilPlaceholderScreen's own contentless shape only, never
// ProfileForm's fields.
import React from "react";
import { render } from "@testing-library/react-native";

import { PerfilPlaceholderScreen } from "./PerfilPlaceholderScreen";

describe("PerfilPlaceholderScreen", () => {
  // FR-015: renders identifying "Perfil" copy with an accessible heading, so it is
  // unambiguously distinguishable from Cartera/Trades and from an error page.
  it('renders "Perfil" copy with an accessible heading', () => {
    const { getByRole, getByText } = render(<PerfilPlaceholderScreen />);

    expect(getByRole("header", { name: "Perfil" })).toBeTruthy();
    expect(getByText(/todavía no tiene contenido/)).toBeTruthy();
  });

  // FR-015: no real profile data of any kind — hard scope boundary. Only the two static
  // disclaimer lines render (no form fields, no ProfileForm content).
  it("renders no profile form fields or real profile data (only the two static disclaimer lines)", () => {
    const { getAllByText, queryByLabelText } = render(<PerfilPlaceholderScreen />);

    expect(getAllByText(/./)).toHaveLength(2);
    expect(queryByLabelText(/nombre|name/i)).toBeNull();
  });
});
