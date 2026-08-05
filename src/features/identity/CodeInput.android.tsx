// T014 (FR-002, Platform notes): Android variant of CodeInput — identical to CodeInput.tsx
// (T013) except for `autoComplete="sms-otp"`, which opts this field into Android's SMS Retriever-
// backed autofill suggestion (surfaced via the system's autofill UI) when a one-time code arrives
// by SMS while this field is focused. Implements the exact same CodeInputProps contract imported
// from CodeInput.types.ts (not redeclared here) so this file cannot drift from CodeInput.tsx/
// CodeInput.ios.tsx's public interface — see CodeInput.ios.tsx's doc comment for the same note in
// full.
//
// Manual smoke check only (Level 3, docs/verification.md) — SMS autofill isn't meaningfully
// unit-testable — see progress/impl_001-registration-kyc.md Run 7 for exactly what was, and was
// not, verified for this file.
import { StyleSheet, TextInput } from "react-native";

import { CODE_INPUT_LENGTH, type CodeInputProps } from "./CodeInput.types";

export function CodeInput({
  value,
  onChangeText,
  onBlur,
  length = CODE_INPUT_LENGTH,
  editable = true,
  accessibilityLabel = "Verification code",
  testID,
}: CodeInputProps) {
  function handleChangeText(text: string) {
    onChangeText(text.replace(/\D/g, "").slice(0, length));
  }

  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={handleChangeText}
      onBlur={onBlur}
      editable={editable}
      accessibilityLabel={accessibilityLabel}
      keyboardType="number-pad"
      maxLength={length}
      autoComplete="sms-otp"
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 44,
    minWidth: 44,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
  },
});
