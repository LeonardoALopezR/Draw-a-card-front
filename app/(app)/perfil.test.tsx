// specs/008-scan-experience/tasks.md T030 (US6, FR-015): confirms app/(app)/perfil.tsx
// renders PerfilPlaceholderScreen (src/features/identity/PerfilPlaceholderScreen.tsx, T029) —
// a reachable, distinctly-labelled placeholder, never an unmatched-route error.
import React from "react";
import { render, screen } from "@testing-library/react-native";

import PerfilRouteScreen from "./perfil";

describe("app/(app)/perfil.tsx", () => {
  // FR-015: the Perfil destination renders its own identifying placeholder content.
  it("renders the Perfil placeholder screen", () => {
    render(<PerfilRouteScreen />);

    expect(screen.getByRole("header", { name: "Perfil" })).toBeTruthy();
  });
});
