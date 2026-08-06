// Covers FR-007 (inert scan visual shell, web-only empty-results panel per spec.md US3 AS2) for
// src/features/scanner/EmptyResultsPanel.tsx (T041), plus the same camera-import
// source-inspection guard every file under src/features/scanner/ carries in this feature (FR-007,
// 004-home-scan-shell FR-005).
import fs from "fs";
import path from "path";
import React from "react";
import { render, screen } from "@testing-library/react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";

import { EmptyResultsPanel } from "./EmptyResultsPanel";

describe("EmptyResultsPanel", () => {
  it("does not import any camera-related module", () => {
    const source = fs.readFileSync(path.join(__dirname, "EmptyResultsPanel.tsx"), "utf8");
    const importLines = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line) || /require\(/.test(line));

    expect(importLines.some((line) => /expo-camera/.test(line))).toBe(false);
    expect(importLines.some((line) => /expo-image-picker/.test(line))).toBe(false);
    expect(importLines.some((line) => /camera/i.test(line))).toBe(false);
  });

  // FR-007, FR-010, spec.md US3 AS2: renders both lines of copy through the i18n mechanism,
  // defaulting to Spanish (DEFAULT_LOCALE) with no <LocaleProvider> wrapping the render.
  it("renders both lines of empty-results copy", () => {
    render(<EmptyResultsPanel />);

    expect(screen.getByText(scanCopy.es.emptyResultsLine1)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.emptyResultsLine2)).toBeTruthy();
  });

  // spec.md US3 AS4: purely presentational, no button role.
  it("does not expose a button role", () => {
    render(<EmptyResultsPanel />);

    expect(() => screen.getByRole("button")).toThrow();
  });
});
