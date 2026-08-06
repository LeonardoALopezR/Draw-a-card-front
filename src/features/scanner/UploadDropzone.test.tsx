// Covers FR-007 (inert scan visual shell) and spec.md US3 AS4 (no bare button role on an inert
// control) for src/features/scanner/UploadDropzone.tsx (T040), plus the same camera-import
// source-inspection guard every file under src/features/scanner/ carries in this feature (FR-007,
// 004-home-scan-shell FR-005).
import fs from "fs";
import path from "path";
import React from "react";
import { render, screen } from "@testing-library/react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";

import { UploadDropzone } from "./UploadDropzone";

describe("UploadDropzone", () => {
  it("does not import any camera-related module", () => {
    const source = fs.readFileSync(path.join(__dirname, "UploadDropzone.tsx"), "utf8");
    const importLines = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line) || /require\(/.test(line));

    expect(importLines.some((line) => /expo-camera/.test(line))).toBe(false);
    expect(importLines.some((line) => /expo-image-picker/.test(line))).toBe(false);
    expect(importLines.some((line) => /camera/i.test(line))).toBe(false);
  });

  // FR-007, FR-010: renders the dropzone copy through the i18n mechanism, defaulting to Spanish
  // (DEFAULT_LOCALE) with no <LocaleProvider> wrapping the render.
  it("renders the upload dropzone copy", () => {
    render(<UploadDropzone />);

    expect(screen.getByText(scanCopy.es.uploadDropzone)).toBeTruthy();
  });

  // spec.md US3 AS4: not wired to any picker in this feature, so it must not present as an
  // actionable button to a screen reader.
  it("does not expose a button role", () => {
    render(<UploadDropzone />);

    expect(() => screen.getByRole("button")).toThrow();
  });
});
