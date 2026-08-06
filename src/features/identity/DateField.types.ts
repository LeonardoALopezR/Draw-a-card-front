// Shared prop contract for DateField.tsx (native — iOS/Android, T007) and DateField.web.tsx.
// Defined once here (no `.web` extension, so Metro's platform resolver never picks a different
// version of it per platform) and imported by both — same pattern as Select.types.ts/
// CodeInput.types.ts, so the two variants' public interfaces cannot drift apart.
//
// Both variants emit a real `Date` on change — matching profileFormSchema's existing
// `birthDate: z.coerce.date()` field (src/domain/schemas.ts) verbatim. No schema change (spec.md
// Clarification 4).
//
// `confirmLabel`/`closeAccessibilityLabel` (T029 device-defect fix, native variant only — see
// DateField.tsx's top comment): the native picker now opens inside its own Modal sheet with an
// explicit confirm step, mirroring Select.tsx's copy-override convention (default English,
// caller supplies localized copy — DateField.web.tsx's plain `<input type="date">` has no
// equivalent affordance and simply ignores both, same as it already ignores `placeholder`'s
// native-only sibling behavior would if it existed).
export interface DateFieldProps {
  label: string;
  value?: Date;
  onChange: (date: Date) => void;
  error?: string;
  placeholder?: string;
  testID?: string;
  labelCase?: "uppercase" | "sentence";
  confirmLabel?: string;
  closeAccessibilityLabel?: string;
}
