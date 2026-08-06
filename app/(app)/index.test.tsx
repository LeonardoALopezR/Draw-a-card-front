// T014 (specs/004-home-scan-shell): confirms app/(app)/index.tsx — the file now reached at
// "/" via the (app) route group, once app/index.tsx (the repo-scaffold placeholder) is removed
// in this same change — renders the real HomeScreen (src/features/navigation/HomeScreen.tsx,
// T013) rather than the old scaffold placeholder. Covers FR-001 (Home/Scan is a reachable
// shell destination) and FR-009 (only what "main" renders changes; the gate itself is
// untouched). specs/008-scan-experience/tasks.md T025: HomeScreen (Inicio) now calls
// expo-router's useRouter directly (repointing its quick-action card's onPress to
// NAV_DESTINATIONS' "escanear" entry, since AmigosQuickAccessPill — the original caller — was
// retired outright by T031), so useRouter is still mocked here, same mechanism as before.
import React from "react";
import { render, screen } from "@testing-library/react-native";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import { homeCopy } from "@/domain/i18n/copy/home";

import HomeRouteScreen from "./index";

describe("app/(app)/index.tsx", () => {
  // FR-001, FR-009: "/" (via this route group) renders the real Home/Scan screen — the
  // wireframe's shell/landing content, not the removed app/index.tsx scaffold placeholder.
  it("renders the Home/Scan screen", () => {
    render(<HomeRouteScreen />);

    expect(screen.getByTestId("home-screen")).toBeTruthy();
    expect(screen.getByRole("button", { name: homeCopy.es.scanQuickActionLabel })).toBeTruthy();
  });
});
