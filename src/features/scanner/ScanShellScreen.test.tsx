// T045 (specs/006-visual-identity, FR-007, spec.md US3 Independent Test/AS1-AS3, SC-004):
// renders ScanShellScreen.tsx (mobile) and confirms the title, viewfinder hint text, search
// placeholder, dropzone copy, and primary button it composes; renders ScanShellScreen.web.tsx
// and confirms its two-column-vs-one-column collapse at the 768px breakpoint by mocking
// "react-native/Libraries/Utilities/useWindowDimensions" — the exact technique
// src/features/navigation/AppWebLayout.test.tsx already uses for this repo's identical
// BREAKPOINT_PX (src/domain/navigation.ts).
//
// specs/008-scan-experience/tasks.md T018 (US3, FR-004, FR-007, FR-008, spec.md User Story 3
// AS1-AS3) extends the "ScanShellScreen (mobile)" describe block below: idle renders an ENABLED
// "Escanear carta" button (no longer disabled/no-op); pressing it, submitting the search field,
// or tapping the upload dropzone each trigger the local found state and show `FoundCardPanel`
// inline with `SAMPLE_CARDS[0]`'s (Dragón Eterno) data. ScanShellScreen.web.tsx is untouched by
// this batch (Phase 4's job) — the web describe block below stays exactly as 006 left it.
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
//
// specs/008-scan-experience/tasks.md T023 (US4, FR-005, FR-016, SC-003, SC-005): the guard is
// extended (not narrowed) to every file this feature (008-scan-experience) added or changed under
// src/features/scanner/ — FoundCardPanel.tsx and useScanSimulation.ts join the six files above.
// This describe block also gains rendered-output assertions, on the real (unmocked)
// ScanShellScreen.web component: at >=768px and below it, no Viewfinder, no "Escanear carta"
// button, and no "Cámara disponible" badge exist anywhere in the tree — the structural absence
// spec.md's settled decision 2 requires (web genuinely never renders a camera scanner).
import fs from "fs";
import path from "path";

jest.mock("react-native/Libraries/Utilities/useWindowDimensions");

import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { StyleSheet, useWindowDimensions } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { SAMPLE_CARDS } from "@/domain/scanResults";

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

// This literal replaces `scanCopy.es.statusPillCameraAvailable` — that copy key was retired
// (src/domain/i18n/copy/scan.ts, same run as T021) once its only consumer, the web "Cámara
// disponible" StatusPill, was removed. Kept here as a literal specifically so these absence
// assertions can still confirm the text never renders, without resurrecting the dead copy key
// itself.
const RETIRED_STATUS_PILL_TEXT = "Cámara disponible";

// Every scanner file either feature (006-visual-identity's T038-T044, or 008-scan-experience's
// T013-T023) added or changed under src/features/scanner/ — listed explicitly so a future file
// added to this directory is a deliberate, visible addition to this guard, never silently
// unchecked. FoundCardPanel.tsx/useScanSimulation.ts (T014/T013) join the list per T023's
// explicit instruction to extend, not narrow, this guard.
const SCANNER_SOURCE_FILES = [
  "ScanShellScreen.tsx",
  "ScanShellScreen.web.tsx",
  "Viewfinder.tsx",
  "ScanSearchField.tsx",
  "UploadDropzone.tsx",
  "EmptyResultsPanel.tsx",
  "RecentScansList.tsx",
  "FoundCardPanel.tsx",
  "useScanSimulation.ts",
  // Human-requested follow-up (2026-08-06): the shared gradient-thumbnail component added when
  // this feature's flat sample-card thumbnails became gradients — extends, not narrows, this
  // guard, per T023's own explicit instruction.
  "CardThumbnail.tsx",
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

  // T018 (FR-004, FR-007): the "Escanear carta" button is enabled at idle, no found panel
  // renders, and the viewfinder shows its idle drawing — reversing 006's disabled-button
  // placeholder.
  it("renders an enabled scan button and no found panel at idle", () => {
    render(<ScanShellScreen />);

    const button = screen.getByTestId("scan-shell-button");
    expect(button.props.accessibilityState?.disabled).not.toBe(true);
    expect(screen.queryByTestId("found-card-panel")).toBeNull();
    expect(screen.queryByText(scanCopy.es.viewfinderFoundHeading)).toBeNull();
  });

  // T018 (FR-004, FR-007, FR-008, spec.md User Story 3 AS1-AS2): pressing "Escanear carta"
  // triggers the local found state — the viewfinder switches to its found drawing and
  // FoundCardPanel appears inline with SAMPLE_CARDS[0]'s (Dragón Eterno) data.
  it('pressing "Escanear carta" shows the found panel with Dragón Eterno\'s data', () => {
    render(<ScanShellScreen />);

    fireEvent.press(screen.getByTestId("scan-shell-button"));

    expect(screen.getByText(scanCopy.es.viewfinderFoundHeading)).toBeTruthy();
    const panel = screen.getByTestId("found-card-panel");
    expect(panel).toBeTruthy();
    expect(screen.getByText(SAMPLE_CARDS[0].name)).toBeTruthy();
  });

  // T018 (FR-007, spec.md Design note): submitting the search field is an equally valid trigger.
  it("submitting the search field shows the found panel", () => {
    render(<ScanShellScreen />);

    fireEvent(screen.getByPlaceholderText(scanCopy.es.searchPlaceholder), "submitEditing");

    expect(screen.getByTestId("found-card-panel")).toBeTruthy();
    expect(screen.getByText(SAMPLE_CARDS[0].name)).toBeTruthy();
  });

  // T018 (FR-007, spec.md Design note): tapping the upload dropzone is an equally valid trigger.
  it("tapping the upload dropzone shows the found panel", () => {
    render(<ScanShellScreen />);

    fireEvent.press(screen.getByTestId("upload-dropzone"));

    expect(screen.getByTestId("found-card-panel")).toBeTruthy();
    expect(screen.getByText(SAMPLE_CARDS[0].name)).toBeTruthy();
  });

  // T018 (spec.md User Story 2 AS5): "Cambiar" advances to the next sample card inline.
  it('pressing "Cambiar" advances the found panel to the next sample card', () => {
    render(<ScanShellScreen />);

    fireEvent.press(screen.getByTestId("scan-shell-button"));
    fireEvent.press(screen.getByTestId("found-card-change-link"));

    expect(screen.getByText(SAMPLE_CARDS[1].name)).toBeTruthy();
  });

  // T018 (spec.md User Story 2 AS6): "Eliminar" returns to idle — no found panel, idle
  // viewfinder.
  it('pressing "Eliminar" returns to idle (no found panel, idle viewfinder)', () => {
    render(<ScanShellScreen />);

    fireEvent.press(screen.getByTestId("scan-shell-button"));
    fireEvent.press(screen.getByTestId("found-card-remove-link"));

    expect(screen.queryByTestId("found-card-panel")).toBeNull();
    expect(screen.getByText(scanCopy.es.viewfinderHint)).toBeTruthy();
  });

  // T018 (FR-009, spec.md User Story 2 AS7): "Aceptar" gives a real, visible confirmation (not a
  // silent no-op) — rendered here, one level above FoundCardPanel (which deliberately has no
  // `confirming` prop, see this file's top comment) — then returns to idle.
  it('pressing "Aceptar" shows a visible confirmation, then returns to idle', () => {
    jest.useFakeTimers();
    try {
      render(<ScanShellScreen />);

      fireEvent.press(screen.getByTestId("scan-shell-button"));
      fireEvent.press(screen.getByTestId("found-card-accept-button"));

      expect(screen.getByText(scanCopy.es.acceptedConfirmation)).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.queryByText(scanCopy.es.acceptedConfirmation)).toBeNull();
      expect(screen.queryByTestId("found-card-panel")).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("ScanShellScreen.web — two-column-vs-one-column collapse at the 768px breakpoint", () => {
  afterEach(() => {
    mockUseWindowDimensions.mockReset();
  });

  // spec.md US3 AS2 (layout mechanics unchanged by 008-scan-experience's T021): at/above the
  // 768px breakpoint, the controls and results columns lay out side by side (flexDirection:
  // "row").
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

  // spec.md US3 AS3 / User Story 4 AS3: below the 768px breakpoint, the same two columns stack
  // (flexDirection: "column") with the results panel below the controls.
  it("collapses to a single (column) layout below 768px", () => {
    mockWidth(767);
    render(<ScanShellScreenWeb />);

    const controlsColumn = screen.getByTestId("scan-shell-controls-column");
    const rowContainer = controlsColumn.parent!.parent;
    const style = StyleSheet.flatten(rowContainer!.props.style);

    expect(style.flexDirection).toBe("column");
  });

  // T021 (US4, FR-005, FR-006, spec.md User Story 4 AS1): idle web content — left column has
  // only the title/search/dropzone, right column shows the empty-results panel above the
  // recent-scans list.
  it("renders the idle web shell content (title, search, dropzone, empty-results panel, recent scans)", () => {
    mockWidth(800);
    render(<ScanShellScreenWeb />);

    expect(screen.getByText(scanCopy.es.titleWeb)).toBeTruthy();
    expect(screen.getByPlaceholderText(scanCopy.es.searchPlaceholder)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.uploadDropzone)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.emptyResultsLine1)).toBeTruthy();
    expect(screen.queryByTestId("found-card-panel")).toBeNull();
    expect(screen.getByText(scanCopy.es.recentScansHeading)).toBeTruthy();
  });

  // T021 (US4, FR-007, spec.md User Story 4 AS2): submitting the search field is one of web's
  // only two triggers — the right column's empty-results panel is replaced by FoundCardPanel with
  // SAMPLE_CARDS[0]'s (Dragón Eterno) data, and RecentScansList stays visible below it.
  it('submitting the search field swaps the right column to FoundCardPanel, keeping RecentScansList visible', () => {
    mockWidth(800);
    render(<ScanShellScreenWeb />);

    fireEvent(screen.getByPlaceholderText(scanCopy.es.searchPlaceholder), "submitEditing");

    expect(screen.queryByText(scanCopy.es.emptyResultsLine1)).toBeNull();
    const panel = screen.getByTestId("found-card-panel");
    expect(panel).toBeTruthy();
    // SAMPLE_CARDS[0]'s name also legitimately appears in RecentScansList's own first row below —
    // scope the query to the found panel itself so this asserts the panel's own content, not
    // merely that the name exists somewhere on the page.
    expect(within(panel).getByText(SAMPLE_CARDS[0].name)).toBeTruthy();
    expect(screen.getByTestId("recent-scans-list")).toBeTruthy();
  });

  // T021 (US4, FR-007, spec.md User Story 4 AS2): tapping the upload dropzone is web's other
  // trigger — same swap as the search-submit case above.
  it("tapping the upload dropzone swaps the right column to FoundCardPanel", () => {
    mockWidth(800);
    render(<ScanShellScreenWeb />);

    fireEvent.press(screen.getByTestId("upload-dropzone"));

    const panel = screen.getByTestId("found-card-panel");
    expect(panel).toBeTruthy();
    // Same scoping reason as the search-submit test above — SAMPLE_CARDS[0]'s name also appears
    // in RecentScansList's own first row.
    expect(within(panel).getByText(SAMPLE_CARDS[0].name)).toBeTruthy();
    expect(screen.getByTestId("recent-scans-list")).toBeTruthy();
  });

  // T023 (US4, FR-005, FR-016, SC-003, SC-005, spec.md User Story 4 AS1/AS4): at/above 768px, no
  // Viewfinder, no "Escanear carta" button, and no "Cámara disponible" badge exist anywhere in
  // the rendered tree — checked by testID/role, not just visible text, since "Escanear carta" is
  // also (legitimately) the web title's own copy.
  it("renders no Viewfinder / no \"Escanear carta\" button / no \"Cámara disponible\" badge at >=768px", () => {
    mockWidth(800);
    render(<ScanShellScreenWeb />);

    expect(screen.queryByTestId("scan-shell-button")).toBeNull();
    expect(
      screen.queryByRole("button", { name: scanCopy.es.scanButton })
    ).toBeNull();
    expect(screen.queryByText(RETIRED_STATUS_PILL_TEXT)).toBeNull();
    expect(screen.queryByText(scanCopy.es.viewfinderHint)).toBeNull();
    expect(screen.queryByText(scanCopy.es.viewfinderFoundHeading)).toBeNull();
  });

  // T023: the same absence holds below the breakpoint — this is web, not native, regardless of
  // width (spec.md User Story 4 AS3).
  it("renders no Viewfinder / no \"Escanear carta\" button / no \"Cámara disponible\" badge below 768px", () => {
    mockWidth(767);
    render(<ScanShellScreenWeb />);

    expect(screen.queryByTestId("scan-shell-button")).toBeNull();
    expect(
      screen.queryByRole("button", { name: scanCopy.es.scanButton })
    ).toBeNull();
    expect(screen.queryByText(RETIRED_STATUS_PILL_TEXT)).toBeNull();
    expect(screen.queryByText(scanCopy.es.viewfinderHint)).toBeNull();
    expect(screen.queryByText(scanCopy.es.viewfinderFoundHeading)).toBeNull();
  });

  // T051 (responsive layout check, spec.md SC-006's literal figures): a real browser/simulator
  // wasn't available in this pass (same disclosed sandbox limitation as prior runs' Level 3
  // checks) — this is the strongest available substitute: rendering at exactly SC-006's stated
  // 375px-wide viewport and a typical desktop width (1440px) and confirming every element still
  // renders (no crash from a width-driven layout branch) and collapses to the correct column
  // count at each, with the camera-scanner absence still holding at both widths.
  it("renders correctly at a 375px-wide viewport (single column, SC-006, no camera UI)", () => {
    mockWidth(375);
    render(<ScanShellScreenWeb />);

    const controlsColumn = screen.getByTestId("scan-shell-controls-column");
    const rowContainer = controlsColumn.parent!.parent;
    const style = StyleSheet.flatten(rowContainer!.props.style);

    expect(style.flexDirection).toBe("column");
    expect(screen.getByText(scanCopy.es.titleWeb)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.recentScansHeading)).toBeTruthy();
    expect(screen.queryByTestId("scan-shell-button")).toBeNull();
    expect(screen.queryByText(RETIRED_STATUS_PILL_TEXT)).toBeNull();
  });

  it("renders correctly at a typical desktop width (1440px, two columns, SC-006, no camera UI)", () => {
    mockWidth(1440);
    render(<ScanShellScreenWeb />);

    const controlsColumn = screen.getByTestId("scan-shell-controls-column");
    const rowContainer = controlsColumn.parent!.parent;
    const style = StyleSheet.flatten(rowContainer!.props.style);

    expect(style.flexDirection).toBe("row");
    expect(screen.getByText(scanCopy.es.titleWeb)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.recentScansHeading)).toBeTruthy();
    expect(screen.queryByTestId("scan-shell-button")).toBeNull();
    expect(screen.queryByText(RETIRED_STATUS_PILL_TEXT)).toBeNull();
  });
});
