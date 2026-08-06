// Covers FR-007 (inert scan visual shell) and FR-013 (accessible label) for
// src/features/scanner/ScanSearchField.tsx (T039), plus the same camera-import source-inspection
// guard every file under src/features/scanner/ carries in this feature (FR-007,
// 004-home-scan-shell FR-005).
//
// specs/008-scan-experience/tasks.md T016 (US3, FR-007): covers the optional `onSubmit` prop —
// submitting the field and pressing the magnifier both call it, and omitting it renders/behaves
// exactly as before (no crash).
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
  // Spanish (DEFAULT_LOCALE) with no <LocaleProvider> wrapping the render. T016: the input and
  // the (now-pressable) submit button both carry this text as their accessible name — scoped by
  // role/testID below rather than a single `getByLabelText`, since two elements now share it.
  it("renders the search placeholder as an accessible label", () => {
    render(<ScanSearchField />);

    expect(screen.getByPlaceholderText(scanCopy.es.searchPlaceholder)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: scanCopy.es.searchPlaceholder })
    ).toBeTruthy();
  });

  // FR-013 / spec.md Assumptions: typing is accepted (the field is a real, focusable text
  // input) but is documented as inert — this test only confirms it doesn't throw when typed
  // into, not that typing does anything, since nothing should happen yet.
  it("accepts typing without throwing", () => {
    render(<ScanSearchField />);

    const input = screen.getByPlaceholderText(scanCopy.es.searchPlaceholder);
    expect(() => fireEvent.changeText(input, "Charizard")).not.toThrow();
  });

  // T016 (FR-007): submitting the field (Enter/Return, RNTL's `submitEditing` event) calls
  // `onSubmit` — one of the three local "found" triggers (spec.md Design note).
  it("calls onSubmit when the field is submitted", () => {
    const onSubmit = jest.fn();
    render(<ScanSearchField onSubmit={onSubmit} />);

    fireEvent(screen.getByPlaceholderText(scanCopy.es.searchPlaceholder), "submitEditing");

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  // T016 (FR-007): pressing the trailing magnifier glyph also calls `onSubmit`, and it is now a
  // real, accessibly-labeled button (not decorative-only text).
  it("calls onSubmit when the magnifier button is pressed", () => {
    const onSubmit = jest.fn();
    render(<ScanSearchField onSubmit={onSubmit} />);

    fireEvent.press(screen.getByTestId("scan-search-submit"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  // T016 (FR-007): omitting `onSubmit` renders/behaves exactly as before — no crash on submit or
  // magnifier press.
  it("renders and behaves without throwing when onSubmit is omitted", () => {
    render(<ScanSearchField />);

    const input = screen.getByPlaceholderText(scanCopy.es.searchPlaceholder);
    expect(() => fireEvent(input, "submitEditing")).not.toThrow();
    expect(() => fireEvent.press(screen.getByTestId("scan-search-submit"))).not.toThrow();
  });
});
