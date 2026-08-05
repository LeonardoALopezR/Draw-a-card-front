// T013 (FR-002): platform-neutral 5-digit verification-code input. Selected by Metro on web and
// on any platform without a more specific variant (see CodeInput.ios.tsx / CodeInput.android.tsx,
// T014, which add SMS-autofill hints on top of this exact same input).
//
// A single accessible TextInput (not five separate digit boxes) is deliberate: it's what makes
// SMS autofill possible at all — both iOS's `textContentType="oneTimeCode"` keyboard hint and
// Android's `autoComplete="sms-otp"` expect one text field to receive the whole code, not five
// independently-focused boxes that would need to be reassembled from one autofilled string. A
// five-box UI is also materially harder to keep genuinely accessible (VoiceOver/TalkBack would
// have to announce five separate fields with no visible individual meaning).
//
// Restricting typed characters to digits and to `length` here is input *masking* (the same
// category as RegistrationForm's `keyboardType` prop), not validation — `verificationCodeSchema`
// (src/domain/schemas.ts) remains the sole source of truth for whether a submitted code is
// well-formed (Constitution IV); this component only prevents obviously-wrong keystrokes from
// being typed in the first place.
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
      testID={testID}
    />
  );
}

// Minimum 44x44 tap target (Constitution VII, SC-003), same as RegistrationForm's inputs; wider
// letter-spacing/font-size than a normal text field so the 5 digits read clearly at a glance.
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
