// Covers FR-008 (the "recent scans" rows are static local placeholder content — no
// src/domain import, no fetch call, no persistence — marked as placeholder-until-the-real-
// scanner-feature-ships) and FR-007 (inert scan visual shell, camera-import prohibition) for
// src/features/scanner/RecentScansList.tsx (T042).
import fs from "fs";
import path from "path";
import React from "react";
import { render, screen } from "@testing-library/react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";

import { RecentScansList } from "./RecentScansList";

describe("RecentScansList", () => {
  it("does not import any camera-related module", () => {
    const source = fs.readFileSync(path.join(__dirname, "RecentScansList.tsx"), "utf8");
    const importLines = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line) || /require\(/.test(line));

    expect(importLines.some((line) => /expo-camera/.test(line))).toBe(false);
    expect(importLines.some((line) => /expo-image-picker/.test(line))).toBe(false);
    expect(importLines.some((line) => /camera/i.test(line))).toBe(false);
  });

  // FR-008 (spec.md US3 AS6): the recent-scans rows are static local placeholder content — no
  // src/domain *fetch*, no API call, no persistence (FR-008's exact wording) — checked via
  // source inspection (not just current behavior, since an unused-but-present import could slip
  // past a behavior-only test). The only src/domain import this file may have is the static
  // i18n copy dictionary (`@/domain/i18n/copy/...`, required by FR-010 so the section heading
  // isn't hardcoded) — never `@/domain/api-client` or any other data-fetching module. The
  // placeholder nature is documented in an adjacent code comment.
  it("imports no data-fetching src/domain module and calls no fetch", () => {
    const source = fs.readFileSync(path.join(__dirname, "RecentScansList.tsx"), "utf8");
    const importLines = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line) || /require\(/.test(line));
    const domainImportLines = importLines.filter((line) => /from ["']@\/domain/.test(line));

    expect(domainImportLines.every((line) => /@\/domain\/i18n\//.test(line))).toBe(true);
    expect(importLines.some((line) => /api-client/.test(line))).toBe(false);
    expect(source).not.toMatch(/\bfetch\(/);
    expect(source).toMatch(/PLACEHOLDER-UNTIL-THE-REAL-SCANNER-FEATURE-SHIPS/);
  });

  // FR-007, FR-010: renders the section heading and every placeholder row's content through
  // real rendered output, defaulting to Spanish (DEFAULT_LOCALE) with no <LocaleProvider>
  // wrapping the render.
  it("renders the section heading and placeholder rows", () => {
    render(<RecentScansList />);

    expect(screen.getByText(scanCopy.es.recentScansHeading)).toBeTruthy();
    expect(screen.getByText("Charizard")).toBeTruthy();
    expect(screen.getByText("PSA 10 · GEN-001")).toBeTruthy();
    expect(screen.getByText("$450.00")).toBeTruthy();
  });
});
