// Covers FR-002 (5-digit verification code entry, accessible) for
// src/features/identity/CodeInput.tsx (T013). A bare "./CodeInput" import here resolves to this
// platform-neutral base file — not CodeInput.ios.tsx (T014) — because jest.config.js overrides
// Jest's Haste default platform from "ios" (react-native/jest-preset.js's own default, which
// would otherwise silently pick the iOS variant for every bare `.ios.tsx`/`.android.tsx`-adjacent
// import) to "web"; see that file's comment for the full explanation. CodeInput.ios.tsx/
// .android.tsx are intentionally NOT unit-tested here (or anywhere) — see their own file comments
// and tasks.md's T014 for why (SMS autofill isn't meaningfully unit-testable; manual smoke check
// only).
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { CodeInput } from "./CodeInput";

describe("CodeInput", () => {
  // FR-002, Constitution VII: the field is reachable by its accessible name, matching how
  // VoiceOver/TalkBack would locate it.
  it("is reachable by its accessibility label", () => {
    const { getByLabelText } = render(<CodeInput value="" onChangeText={jest.fn()} />);
    expect(getByLabelText("Verification code")).toBeTruthy();
  });

  it("accepts a custom accessibility label", () => {
    const { getByLabelText } = render(
      <CodeInput value="" onChangeText={jest.fn()} accessibilityLabel="5-digit code" />
    );
    expect(getByLabelText("5-digit code")).toBeTruthy();
  });

  // FR-002: only digits are accepted, and the value is capped at 5 characters — the same
  // constraint verificationCodeSchema (src/domain/schemas.ts) enforces authoritatively, mirrored
  // here only as input masking, not a second validation path.
  it("strips non-digit characters and caps the value at 5 digits", () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = render(<CodeInput value="" onChangeText={onChangeText} />);

    fireEvent.changeText(getByLabelText("Verification code"), "1a2b3c4d5e6f");

    expect(onChangeText).toHaveBeenCalledWith("12345");
  });

  it("respects a custom length", () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = render(
      <CodeInput value="" onChangeText={onChangeText} length={4} />
    );

    fireEvent.changeText(getByLabelText("Verification code"), "123456");

    expect(onChangeText).toHaveBeenCalledWith("1234");
  });

  // Disabled/submitting state, mirroring RegistrationForm's `editable={!isSubmitting}` pattern.
  it("is not editable when editable is false", () => {
    const { getByLabelText } = render(
      <CodeInput value="1234" onChangeText={jest.fn()} editable={false} />
    );
    expect(getByLabelText("Verification code").props.editable).toBe(false);
  });
});
