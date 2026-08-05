// Covers FR-005 — this feature must not implement camera access, image capture, or card
// recognition. The source-inspection test below guards against that at the import-graph
// level, not just current rendered behavior, since a camera import could be added without
// ever being invoked in a way behavior-only tests would catch.
import fs from "fs";
import path from "path";
import React from "react";
import { render } from "@testing-library/react-native";

import { ScanPlaceholderScreen } from "./ScanPlaceholderScreen";

describe("ScanPlaceholderScreen", () => {
  // FR-005: no camera-related module (expo-camera, expo-image-picker, etc.) is imported by
  // this file — checked via source inspection (the import/require statements specifically,
  // not prose mentioning "camera" in copy/comments), since a behavior-only test could not
  // catch an unused-but-present camera import.
  it("does not import any camera-related module", () => {
    const source = fs.readFileSync(path.join(__dirname, "ScanPlaceholderScreen.tsx"), "utf8");
    const importLines = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line) || /require\(/.test(line));

    expect(importLines.some((line) => /expo-camera/.test(line))).toBe(false);
    expect(importLines.some((line) => /expo-image-picker/.test(line))).toBe(false);
    expect(importLines.some((line) => /camera/i.test(line))).toBe(false);
  });

  // FR-005: renders clear "Scanner coming soon" (or equivalent) stub copy with an accessible
  // heading — explicitly not camera UI or a capture flow.
  it('renders "Scanner coming soon" copy with an accessible heading', () => {
    const { getByRole, getByText } = render(<ScanPlaceholderScreen />);

    expect(getByRole("header")).toBeTruthy();
    expect(getByText(/scanner coming soon/i)).toBeTruthy();
  });
});
