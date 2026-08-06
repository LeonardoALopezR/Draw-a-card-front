// T007 (specs/010-registration-redesign, FR-013, spec.md Clarification 4): the `Fecha de
// nacimiento` real date-picker control, native/default variant (iOS/Android) — wraps
// `@react-native-community/datetimepicker` (T001) via the package's own recommended declarative
// "component usage" pattern (its README's "Component usage on iOS / Android / Windows" example).
// See DateField.web.tsx for the `.web.tsx` counterpart (a plain `<input type="date">`) — two
// genuinely different platform mechanisms for the same semantic control, not a cosmetic
// difference (plan.md Research Decision 3's rationale for Select applies identically here).
//
// T029 fix (real iOS Simulator pass, defect 2 of 2 — see progress/impl_010-registration-
// redesign.md, "Run 11"): mounting `<DateTimePicker mode="date" onChange=.../>` with no explicit
// `display` let iOS pick its own default, which on iOS 14+ resolves to "compact" — a small,
// intrinsically-sized chip showing the picker's *current* value (defaulting to today's date,
// which is exactly the "6 Aug 2026" chip the device pass observed) rendered as a new sibling row
// underneath the styled pill, not anchored to it. Tapping that chip opens a second, real popover
// anchored to the chip's own on-screen position ("below and to the right" of the pill), and the
// styled pill itself never re-renders as "filled" until a value is actually committed — two
// visible controls, one of them looking permanently empty. Fixed by presenting the picker inside
// this component's own `Modal` sheet (same primitive Select.tsx already uses for its native
// picker, so this is a proven pattern, not a new one) with `display="spinner"`, which is a
// self-contained wheel supported identically on iOS and Android (no `Platform.OS` branch needed
// — Constitution IV/FR-014) and renders inline within the sheet rather than as a chip+popover.
// Spinner mode's `onChange` fires on every wheel tick, not just on a final choice, so committing
// the value immediately (the old behavior) would slam the sheet shut after the very first tick —
// the value is now held as a `draft` until the sheet's own "confirm" button is pressed, mirroring
// how a user expects a spinner-style date picker (e.g. iOS's own Photos/Reminders apps) to work.
import { useState } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/features/ui/PrimaryButton";
import { colors, CONTROL_HEIGHT, radius, shadowSurface, space, typography } from "@/theme";

import type { DateFieldProps } from "./DateField.types";

export type { DateFieldProps };

// dd/mm/aaaa (Spanish, matching the design brief's `dd/mm/yyyy` placeholder) — not
// `toLocaleDateString()`, which would vary by device locale/timezone and could silently mis-
// render the day/month order this app's copy always shows.
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

export function DateField({
  label,
  value,
  onChange,
  error,
  placeholder = "dd/mm/aaaa",
  testID,
  labelCase = "uppercase",
  confirmLabel = "Done",
  closeAccessibilityLabel = "Close",
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  // Held separately from `value` (the field's committed value) so spinner mode's continuous
  // `onChange` never commits — only pressing "confirm" below does. See this file's top comment.
  const [draft, setDraft] = useState<Date>(value ?? new Date());

  function openPicker() {
    setDraft(value ?? new Date());
    setOpen(true);
  }

  function closePicker() {
    setOpen(false);
  }

  function handlePickerChange(event: DateTimePickerEvent, selected?: Date) {
    // Android's dialog can still report "dismissed" (no selection made); only "set" carries a
    // real user-chosen value. Unlike the pre-T029 behavior, this never closes the sheet or calls
    // the field's own `onChange` — it only updates the in-progress draft (see top comment).
    if (event.type === "set" && selected) {
      setDraft(selected);
    }
  }

  function confirmSelection() {
    onChange(draft);
    setOpen(false);
  }

  return (
    <View style={styles.field} testID={testID}>
      <Text style={labelCase === "sentence" ? styles.labelSentence : styles.label}>{label}</Text>

      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.trigger, shadowSurface]}
        testID={testID ? `${testID}-trigger` : undefined}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </Pressable>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {/* Presented as part of this field (Modal, not a bare sibling render) — the same primitive
          Select.tsx already uses for its own native picker, so the value stays visibly anchored
          to the field it belongs to instead of appearing as a second, detached control. */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
        testID={testID ? `${testID}-modal` : undefined}
      >
        <Pressable
          style={styles.backdrop}
          onPress={closePicker}
          accessibilityRole="button"
          accessibilityLabel={closeAccessibilityLabel}
          testID={testID ? `${testID}-backdrop` : undefined}
        />
        <View style={styles.panel}>
          <DateTimePicker
            testID={testID ? `${testID}-picker` : undefined}
            value={draft}
            mode="date"
            display="spinner"
            onChange={handlePickerChange}
          />
          <PrimaryButton
            label={confirmLabel}
            onPress={confirmSelection}
            testID={testID ? `${testID}-confirm` : undefined}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: space.xs,
  },
  label: {
    ...typography.label.field,
  },
  labelSentence: {
    ...typography.label.fieldSentence,
  },
  trigger: {
    height: CONTROL_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.surface,
    paddingHorizontal: space.xl,
    justifyContent: "center",
  },
  value: {
    fontSize: typography.body.input.fontSize,
    fontWeight: typography.body.input.fontWeight,
    color: colors.text.primary,
  },
  placeholder: {
    fontSize: typography.body.input.fontSize,
    fontWeight: typography.body.input.fontWeight,
    color: colors.text.placeholder,
  },
  error: {
    fontSize: 13,
    color: colors.text.danger,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay.backdrop,
  },
  panel: {
    marginTop: "auto",
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: space.lg,
    gap: space.lg,
  },
});
