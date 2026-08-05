// T014 (specs/004-home-scan-shell): confirms app/(app)/index.tsx — the file now reached at
// "/" via the (app) route group, once app/index.tsx (the repo-scaffold placeholder) is removed
// in this same change — renders the real HomeScreen (src/features/navigation/HomeScreen.tsx,
// T013) rather than the old scaffold placeholder. Covers FR-001 (Home/Scan is a reachable
// shell destination) and FR-009 (only what "main" renders changes; the gate itself is
// untouched). HomeScreen composes AmigosQuickAccessPill, which calls expo-router's useRouter
// directly, so it is mocked the same way HomeScreen.test.tsx (T013) does.
import React from "react";
import { render, screen } from "@testing-library/react-native";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// T020 (specs/004-home-scan-shell): HomeScreen (rendered via this route) now calls
// useSafeAreaInsets() (a real-device finding fixed this run — see
// progress/impl_004-home-scan-shell.md) — needs the library's own official Jest mock or
// useSafeAreaInsets throws "No safe area value available." under react-test-renderer.
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default
);

import HomeRouteScreen from "./index";

describe("app/(app)/index.tsx", () => {
  // FR-001, FR-009: "/" (via this route group) renders the real Home/Scan screen — the
  // wireframe's shell/landing content, not the removed app/index.tsx scaffold placeholder.
  it("renders the Home/Scan screen", () => {
    render(<HomeRouteScreen />);

    expect(screen.getByTestId("home-screen")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Scan a card" })).toBeTruthy();
  });
});
