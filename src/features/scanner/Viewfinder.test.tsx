// Covers FR-007 (the scan visual shell renders inert presentation only) and the FR-007/
// 004-home-scan-shell FR-005 camera-import prohibition, which this file specifically guards via
// source inspection — mirroring the exact technique the retired
// src/features/scanner/ScanPlaceholderScreen.test.tsx used (read the file from disk, assert no
// import/require line matches expo-camera/expo-image-picker/camera).
import fs from "fs";
import path from "path";
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { colors, contrastRatio } from "@/theme";

import { Viewfinder } from "./Viewfinder";

describe("Viewfinder", () => {
  // FR-007 / 004-home-scan-shell FR-005: no camera-related module is imported by this file —
  // checked via source inspection of the import/require statements specifically (not prose or
  // icon-name strings mentioning "camera" elsewhere in the file), since a behavior-only test
  // could not catch an unused-but-present camera import.
  it("does not import any camera-related module", () => {
    const source = fs.readFileSync(path.join(__dirname, "Viewfinder.tsx"), "utf8");
    const importLines = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line) || /require\(/.test(line));

    expect(importLines.some((line) => /expo-camera/.test(line))).toBe(false);
    expect(importLines.some((line) => /expo-image-picker/.test(line))).toBe(false);
    expect(importLines.some((line) => /camera/i.test(line))).toBe(false);
  });

  // spec.md US3 AS1/AS7 (FR-007, FR-010): renders the viewfinder hint copy through the i18n
  // mechanism, defaulting to the Spanish dictionary (DEFAULT_LOCALE) when no <LocaleProvider>
  // wraps the render, exactly like every other bare-render test in this repo.
  it("renders the viewfinder hint text", () => {
    render(<Viewfinder />);

    expect(screen.getByText(scanCopy.es.viewfinderHint)).toBeTruthy();
  });

  // specs/008-scan-experience/tasks.md T015 (FR-004, spec.md User Story 3 AS2): omitting
  // `state` (or passing "idle" explicitly) renders the existing grid/brackets/hint — never the
  // found-state heading.
  it('defaults to "idle" and does not render the found-state heading', () => {
    render(<Viewfinder />);

    expect(screen.queryByText(scanCopy.es.viewfinderFoundHeading)).toBeNull();
  });

  // specs/008-scan-experience/tasks.md T015 (FR-004, spec.md User Story 3 AS2): "found" replaces
  // the grid/brackets/camera-glyph/hint with the check glyph + "¡Carta encontrada!" heading.
  it('state="found" renders the check glyph heading and not the idle hint', () => {
    render(<Viewfinder state="found" />);

    expect(screen.getByText(scanCopy.es.viewfinderFoundHeading)).toBeTruthy();
    expect(screen.queryByText(scanCopy.es.viewfinderHint)).toBeNull();
  });

  // spec.md US3 AS4: the settings-gear chip does nothing in this feature, so it must not be
  // exposed to a screen reader as an actionable control — nor should any other element in the
  // viewfinder (the whole component is inert presentation).
  it("does not expose the gear chip (or anything else) as a button role", () => {
    render(<Viewfinder />);

    expect(() => screen.getByRole("button")).toThrow();
  });

  // T050 (Constitution VII accessibility pass): the gear chip must be genuinely hidden from the
  // accessibility tree on every target, not merely un-roled — `aria-hidden` is the one prop that
  // both react-native (native) and react-native-web (web) honor for this (see this file's inline
  // comment on the gear chip); `accessibilityElementsHidden`/`importantForAccessibility` alone
  // are silently dropped by react-native-web. `includeHiddenElements: true` is required here
  // because @testing-library/react-native's queries now exclude `aria-hidden` elements by
  // default (the library's own `isHiddenFromAccessibility` check) — itself a second, independent
  // confirmation the fix works, since the same default-hidden query already fails to find this
  // element without the option.
  it("hides the gear chip from the accessibility tree via aria-hidden (web-reachable, not just role-less)", () => {
    render(<Viewfinder />);

    const gearChip = screen.getByTestId("viewfinder-gear-chip", { includeHiddenElements: true });
    expect(gearChip.props["aria-hidden"]).toBe(true);
  });

  // Defect fix (specs/008-scan-experience, 2026-08-06, found on a real iPhone 17 Pro simulator,
  // FR-004): the found-state heading used to render `colors.text.primary` (near-black) on
  // `colors.viewfinder.bg` (near-black), effectively invisible on device — 491/491 tests passed
  // with the bug present because no test asserted the heading's actual rendered color or computed
  // its contrast. This test does both: it fails if the heading ever reverts to `text.primary` (or
  // any other sub-4.5:1 color) against the viewfinder background.
  it("renders the found-state heading in a color that clears WCAG AA against the viewfinder background", () => {
    render(<Viewfinder state="found" />);

    const heading = screen.getByText(scanCopy.es.viewfinderFoundHeading);
    const style = StyleSheet.flatten(heading.props.style);

    expect(style.color).toBe(colors.brand.primary);
    expect(contrastRatio(style.color, colors.viewfinder.bg)).toBeGreaterThanOrEqual(4.5);
  });
});
