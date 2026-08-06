// Covers FR-007 (inert scan visual shell) and spec.md US3 AS4 (no bare button role on an inert
// control) for src/features/scanner/UploadDropzone.tsx (T040), plus the same camera-import
// source-inspection guard every file under src/features/scanner/ carries in this feature (FR-007,
// 004-home-scan-shell FR-005).
//
// specs/008-scan-experience/tasks.md T017 (US3, FR-007) updates this file: the dropzone is now a
// real Pressable with a real accessibility role/label and an `onPress` — this REPLACES the old
// "does not expose a button role" assertion below, since that's now the exact opposite of the
// intended behavior (the component-level comment on UploadDropzone.tsx explains the disclosed
// reversal in full).
import fs from "fs";
import path from "path";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

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

  // T017 (FR-007): now a genuine local trigger — exposed as a real, accessibly-labeled button
  // (the disclosed reversal of the old "must not present as a button" assertion this test used
  // to carry, see this file's top comment and UploadDropzone.tsx's own).
  it("exposes an accessible button role/label", () => {
    render(<UploadDropzone />);

    expect(
      screen.getByRole("button", { name: scanCopy.es.uploadDropzone })
    ).toBeTruthy();
  });

  // T017 (FR-007): pressing the dropzone calls `onPress` — one of the three local "found"
  // triggers (spec.md Design note); it never inspects a real uploaded image (FR-016).
  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(<UploadDropzone onPress={onPress} />);

    fireEvent.press(screen.getByTestId("upload-dropzone"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // T017: omitting `onPress` renders/behaves without throwing (no consumer has wired it yet on
  // web — Phase 4's job — so this must stay a safe no-op).
  it("renders and behaves without throwing when onPress is omitted", () => {
    render(<UploadDropzone />);

    expect(() => fireEvent.press(screen.getByTestId("upload-dropzone"))).not.toThrow();
  });
});
