// Shared prop contract for CodeInput.tsx (T013, platform-neutral base — selected by Metro for
// web and any platform without a more specific variant), CodeInput.ios.tsx and
// CodeInput.android.tsx (T014, layer SMS-autofill hints on top of the exact same input). Defined
// once here, in a file with no `.ios`/`.android` extension so Metro's platform resolver never
// selects a *different* version of it per platform, and imported by all three implementations —
// this is what makes it impossible for the three files' public interfaces to drift apart from
// each other (Constitution IV's `.ios.tsx`/`.android.tsx` convention is only safe to use when the
// variants genuinely share one contract; a copy-pasted interface in each file would silently
// diverge the next time only one of them is edited).
export const CODE_INPUT_LENGTH = 5;

export interface CodeInputProps {
  value: string;
  onChangeText: (code: string) => void;
  onBlur?: () => void;
  // Defaults to CODE_INPUT_LENGTH (FR-002's 5-digit code) — exposed as a prop rather than
  // hardcoded so a future non-identity use of this component (unlikely, but not this file's call
  // to foreclose) isn't locked to exactly 5 digits.
  length?: number;
  editable?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}
