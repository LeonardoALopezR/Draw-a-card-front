// Covers FR-007 (inert scan visual shell) and FR-013 (accessible label) for
// src/features/scanner/ScanSearchField.tsx (T039), plus the same camera-import source-inspection
// guard every file under src/features/scanner/ carries in this feature (FR-007,
// 004-home-scan-shell FR-005).
import fs from "fs";
import path from "path";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";

import { ScanSearchField } from "./ScanSearchField";

describe("ScanSearchField", () => {
  it("does not import any camera-related module", () => {
    const source = fs.readFileSync(path.join(__dirname, "ScanSearchField.tsx"), "utf8");
    const importLines = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line) || /require\(/.test(line));

    expect(importLines.some((line) => /expo-camera/.test(line))).toBe(false);
    expect(importLines.some((line) => /expo-image-picker/.test(line))).toBe(false);
    expect(importLines.some((line) => /camera/i.test(line))).toBe(false);
  });

  // FR-007, FR-010: renders the search placeholder through the i18n mechanism, defaulting to
  // Spanish (DEFAULT_LOCALE) with no <LocaleProvider> wrapping the render.
  it("renders the search placeholder as an accessible label", () => {
    render(<ScanSearchField />);

    expect(screen.getByPlaceholderText(scanCopy.es.searchPlaceholder)).toBeTruthy();
    expect(screen.getByLabelText(scanCopy.es.searchPlaceholder)).toBeTruthy();
  });

  // FR-013 / spec.md Assumptions: typing is accepted (the field is a real, focusable text
  // input) but is documented as inert — this test only confirms it doesn't throw when typed
  // into, not that typing does anything, since nothing should happen yet.
  it("accepts typing without throwing", () => {
    render(<ScanSearchField />);

    const input = screen.getByPlaceholderText(scanCopy.es.searchPlaceholder);
    expect(() => fireEvent.changeText(input, "Charizard")).not.toThrow();
  });
});
