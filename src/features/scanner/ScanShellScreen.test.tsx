// T045 (specs/006-visual-identity, FR-007, spec.md US3 Independent Test/AS1-AS3, SC-004):
// renders ScanShellScreen.tsx (mobile) and confirms the title, viewfinder hint text, search
// placeholder, dropzone copy, and primary button it composes; renders ScanShellScreen.web.tsx
// and confirms its two-column-vs-one-column collapse at the 768px breakpoint by mocking
// "react-native/Libraries/Utilities/useWindowDimensions" — the exact technique
// src/features/navigation/AppWebLayout.test.tsx already uses for this repo's identical
// BREAKPOINT_PX (src/domain/navigation.ts).
//
// This file also carries the MIGRATED camera-import source-inspection guard (FR-007, spec.md
// US3 Independent Test, SC-004): the retired src/features/scanner/ScanPlaceholderScreen.test.tsx
// used exactly this technique (read a file's source from disk, filter to only its import/require
// lines, assert none matches expo-camera/expo-image-picker/a bare "camera" pattern) against that
// one stub file. Here the same technique runs against every file this feature (006-visual-
// identity) added under src/features/scanner/ (T038-T044) — not weakened, not narrowed to only
// the two shell files. T046 (the next task) removes ScanPlaceholderScreen.tsx/.test.tsx only
// once this guard is green here, so src/features/scanner/ is never left without an active
// camera-import guard, even mid-task.
import fs from "fs";
import path from "path";

jest.mock("react-native/Libraries/Utilities/useWindowDimensions");

import React from "react";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet, useWindowDimensions } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";

import { ScanShellScreen } from "./ScanShellScreen";
import { ScanShellScreen as ScanShellScreenWeb } from "./ScanShellScreen.web";

const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<
  typeof useWindowDimensions
>;

function mockWidth(width: number) {
  mockUseWindowDimensions.mockReturnValue({
    width,
    height: 800,
    scale: 1,
    fontScale: 1,
  });
}

// Every scanner file this feature (006-visual-identity) added under src/features/scanner/ —
// T038-T044 — listed explicitly so a future file added to this directory is a deliberate,
// visible addition to this guard, never silently unchecked.
const SCANNER_SOURCE_FILES = [
  "ScanShellScreen.tsx",
  "ScanShellScreen.web.tsx",
  "Viewfinder.tsx",
  "ScanSearchField.tsx",
  "UploadDropzone.tsx",
  "EmptyResultsPanel.tsx",
  "RecentScansList.tsx",
];

describe("scan visual-shell source files — camera-import guard (FR-007, SC-004)", () => {
  it.each(SCANNER_SOURCE_FILES)("%s does not import any camera-related module", (fileName) => {
    const source = fs.readFileSync(path.join(__dirname, fileName), "utf8");
    const importLines = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line) || /require\(/.test(line));

    expect(importLines.some((line) => /expo-camera/.test(line))).toBe(false);
    expect(importLines.some((line) => /expo-image-picker/.test(line))).toBe(false);
    expect(importLines.some((line) => /camera/i.test(line))).toBe(false);
  });
});

describe("ScanShellScreen (mobile)", () => {
  // spec.md US3 AS1: title, viewfinder hint, search placeholder, dropzone copy, and the primary
  // button all render, defaulting to Spanish (DEFAULT_LOCALE) with no <LocaleProvider> wrapping
  // the render — the same bare-render-defaults-to-es convention every other scanner test uses.
  it("renders the title, viewfinder hint text, search placeholder, dropzone copy, and primary button", () => {
    render(<ScanShellScreen />);

    expect(screen.getByText(scanCopy.es.titleMobile)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.viewfinderHint)).toBeTruthy();
    expect(screen.getByPlaceholderText(scanCopy.es.searchPlaceholder)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.uploadDropzone)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.scanButton)).toBeTruthy();
  });
});

describe("ScanShellScreen.web — two-column-vs-one-column collapse at the 768px breakpoint", () => {
  afterEach(() => {
    mockUseWindowDimensions.mockReset();
  });

  // spec.md US3 AS2: at/above the 768px breakpoint, the controls and results columns lay out
  // side by side (flexDirection: "row").
  it("renders the two-column (row) layout at/above 768px", () => {
    mockWidth(800);
    render(<ScanShellScreenWeb />);

    const controlsColumn = screen.getByTestId("scan-shell-controls-column");
    // `.parent` is the composite View wrapper for the controls column itself; `.parent.parent`
    // is its actual layout parent — the row-vs-stacked container this test cares about.
    const rowContainer = controlsColumn.parent!.parent;
    const style = StyleSheet.flatten(rowContainer!.props.style);

    expect(style.flexDirection).toBe("row");
    expect(screen.getByTestId("scan-shell-results-column")).toBeTruthy();
  });

  // spec.md US3 AS3: below the 768px breakpoint, the same two columns stack (flexDirection:
  // "column") with the results panel below the controls.
  it("collapses to a single (column) layout below 768px", () => {
    mockWidth(767);
    render(<ScanShellScreenWeb />);

    const controlsColumn = screen.getByTestId("scan-shell-controls-column");
    const rowContainer = controlsColumn.parent!.parent;
    const style = StyleSheet.flatten(rowContainer!.props.style);

    expect(style.flexDirection).toBe("column");
  });

  // spec.md US3 AS2: the web variant's full content (title, status pill, results panel, recent
  // scans) is present regardless of which side of the breakpoint the width falls on. "Escanear
  // carta" is intentionally both the titleWeb copy AND the (disabled) primary button's label
  // (brief §5.2), so it's asserted via getAllByText rather than getByText.
  it("renders the full web shell content (title, status pill, results panel, recent scans)", () => {
    mockWidth(800);
    render(<ScanShellScreenWeb />);

    expect(screen.getAllByText(scanCopy.es.titleWeb).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(scanCopy.es.statusPillCameraAvailable)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.emptyResultsLine1)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.recentScansHeading)).toBeTruthy();
  });

  // T051 (responsive layout check, spec.md SC-006's literal figures): a real browser/simulator
  // wasn't available in this pass (same disclosed sandbox limitation as prior runs' Level 3
  // checks) — this is the strongest available substitute: rendering at exactly SC-006's stated
  // 375px-wide viewport and a typical desktop width (1440px) and confirming every element still
  // renders (no crash from a width-driven layout branch) and collapses to the correct column
  // count at each.
  it("renders correctly at a 375px-wide viewport (single column, SC-006)", () => {
    mockWidth(375);
    render(<ScanShellScreenWeb />);

    const controlsColumn = screen.getByTestId("scan-shell-controls-column");
    const rowContainer = controlsColumn.parent!.parent;
    const style = StyleSheet.flatten(rowContainer!.props.style);

    expect(style.flexDirection).toBe("column");
    expect(screen.getByText(scanCopy.es.viewfinderHint)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.recentScansHeading)).toBeTruthy();
  });

  it("renders correctly at a typical desktop width (1440px, two columns, SC-006)", () => {
    mockWidth(1440);
    render(<ScanShellScreenWeb />);

    const controlsColumn = screen.getByTestId("scan-shell-controls-column");
    const rowContainer = controlsColumn.parent!.parent;
    const style = StyleSheet.flatten(rowContainer!.props.style);

    expect(style.flexDirection).toBe("row");
    expect(screen.getByText(scanCopy.es.viewfinderHint)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.recentScansHeading)).toBeTruthy();
  });
});
