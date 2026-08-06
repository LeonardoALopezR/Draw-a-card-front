// Covers FR-010 (the "recent scans" rows read from SAMPLE_CARDS, src/domain/scanResults.ts —
// the same shared, static, hardcoded sample pool the found-card panel reads from, not a second
// independently-typed list) and FR-007/FR-016 (inert scan visual shell, camera-import
// prohibition, no fetch/API call) for src/features/scanner/RecentScansList.tsx
// (006-visual-identity's T042, extended by specs/008-scan-experience/tasks.md's T022).
import fs from "fs";
import path from "path";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { render, screen } from "@testing-library/react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { formatListMeta, SAMPLE_CARDS } from "@/domain/scanResults";

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

  // FR-016: this file's rows are static, compiled-in fixture data (SAMPLE_CARDS,
  // src/domain/scanResults.ts) — no src/domain *fetch*, no API call, no persistence — checked via
  // source inspection (not just current behavior, since an unused-but-present import could slip
  // past a behavior-only test). The only src/domain imports this file may have are the static
  // i18n copy dictionary (`@/domain/i18n/...`, FR-017) and the static sample-card module
  // (`@/domain/scanResults`, FR-010) — never `@/domain/api-client` or any other data-fetching
  // module.
  it("imports no data-fetching src/domain module and calls no fetch", () => {
    const source = fs.readFileSync(path.join(__dirname, "RecentScansList.tsx"), "utf8");
    const importLines = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line) || /require\(/.test(line));
    const domainImportLines = importLines.filter((line) => /from ["']@\/domain/.test(line));

    expect(
      domainImportLines.every(
        (line) => /@\/domain\/i18n\//.test(line) || /@\/domain\/scanResults/.test(line)
      )
    ).toBe(true);
    expect(importLines.some((line) => /api-client/.test(line))).toBe(false);
    expect(source).not.toMatch(/\bfetch\(/);
  });

  // FR-010 (spec.md's Design note, "the sample-card pool"): renders the section heading and every
  // one of the three shared SAMPLE_CARDS rows — Dragón Eterno, Fénix de Tormenta, Serpiente del
  // Vacío — with their real formatListMeta(card) strings and priceLabels, defaulting to Spanish
  // (DEFAULT_LOCALE) with no <LocaleProvider> wrapping the render.
  it("renders the section heading and all three SAMPLE_CARDS rows with their formatListMeta/priceLabel", () => {
    render(<RecentScansList />);

    expect(screen.getByText(scanCopy.es.recentScansHeading)).toBeTruthy();
    expect(SAMPLE_CARDS.length).toBe(3);

    for (const card of SAMPLE_CARDS) {
      expect(screen.getByTestId(`recent-scan-row-${card.id}`)).toBeTruthy();
      expect(screen.getByText(card.name)).toBeTruthy();
      expect(screen.getByText(formatListMeta(card))).toBeTruthy();
      expect(screen.getByText(card.priceLabel)).toBeTruthy();
    }
  });

  // FR-010: the old 006-visual-identity placeholder rows (unrelated to this feature's mockups)
  // no longer render.
  it("no longer renders 006-visual-identity's old Charizard/Blastoise/Venusaur placeholder rows", () => {
    render(<RecentScansList />);

    expect(screen.queryByText("Charizard")).toBeNull();
    expect(screen.queryByText("Blastoise")).toBeNull();
    expect(screen.queryByText("Venusaur")).toBeNull();
  });

  // Human-requested follow-up (2026-08-06): each row renders a gradient thumbnail
  // (card.thumbnailGradient via CardThumbnail.tsx), not a flat color swatch — one LinearGradient
  // per SAMPLE_CARDS row, each with that card's own distinct two-stop gradient.
  it("renders a distinct gradient thumbnail per row, matching each card's own thumbnailGradient", () => {
    render(<RecentScansList />);

    const gradients = screen.UNSAFE_getAllByType(LinearGradient);
    expect(gradients).toHaveLength(SAMPLE_CARDS.length);

    gradients.forEach((gradient, index) => {
      expect(gradient.props.colors).toEqual(SAMPLE_CARDS[index].thumbnailGradient);
    });

    const serialized = SAMPLE_CARDS.map((card) => card.thumbnailGradient.join(","));
    expect(new Set(serialized).size).toBe(SAMPLE_CARDS.length);
  });
});
