// T006 (specs/010-registration-redesign, FR-012, FR-015; plan.md Research Decision 3): web
// counterpart of Select.tsx — same SelectOption/SelectProps contract (Select.types.ts, imported
// not redeclared), swapping the native variant's full-screen `Modal` for an absolutely-
// positioned dropdown panel (how web dropdowns conventionally behave — no full-screen takeover)
// with real keyboard handling: `ArrowDown`/`ArrowUp` move the highlighted option, `Enter` chooses
// it, `Escape` closes the panel and restores focus to the trigger. The platform split is
// expressed entirely via this file's `.web.tsx` extension (Constitution IV), not an inline
// Platform.OS branch — this is two genuinely different interaction models for the same semantic
// control (a full-screen native picker vs. a keyboard-driven web dropdown), not a cosmetic
// difference (plan.md Research Decision 3).
//
// Keyboard mechanism: TextInput's `onKeyPress` on react-native-web fires for *every* keydown (not
// just Enter/Backspace, unlike native RN) — confirmed by reading
// node_modules/react-native-web/dist/cjs/exports/TextInput/index.js's `handleKeyDown`, which
// calls `onKeyPress(e)` unconditionally before its own Enter-specific handling, and populates
// `e.nativeEvent.key` with the real DOM key name (`TextInputKeyPressEventData`, react-native's own
// type). The filter input is therefore where the four keys above are read from. Restoring focus on
// Escape/selection uses each host component's own `.focus()` method (react-native-web's
// `usePlatformMethods` exposes this on every host node) rather than reaching for
// `document`/`window` directly.
import { useMemo, useRef, useState } from "react";
import type { ElementRef } from "react";
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, CONTROL_HEIGHT, radius, shadowSurface, space, typography } from "@/theme";

import type { SelectOption, SelectProps } from "./Select.types";
import { spaceKeyActivation } from "./webKeyActivation";

export type { SelectOption, SelectProps };

type FilterKeyPressEvent = NativeSyntheticEvent<TextInputKeyPressEventData>;

export function Select({
  options,
  value,
  onChange,
  label,
  placeholder,
  loading = false,
  error,
  onRetry,
  testID,
  labelCase = "uppercase",
  retryLabel = "Retry",
  searchPlaceholder = "Search",
  loadingLabel = "Loading…",
  filterAccessibilityLabel = "Filter options",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const triggerRef = useRef<ElementRef<typeof Pressable> | null>(null);

  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, filter]);

  const disabled = loading || Boolean(error);

  function focusTrigger() {
    // See this file's top comment — react-native-web host nodes expose `.focus()` directly.
    (triggerRef.current as unknown as { focus?: () => void } | null)?.focus?.();
  }

  function openPicker() {
    if (disabled) return;
    setFilter("");
    setHighlightedIndex(0);
    setOpen(true);
  }

  function closePicker(restoreFocus: boolean) {
    setOpen(false);
    if (restoreFocus) focusTrigger();
  }

  function selectOption(option: SelectOption) {
    onChange(option.value);
    closePicker(true);
  }

  function handleFilterKeyPress(event: FilterKeyPressEvent) {
    const key = event.nativeEvent.key;
    if (key === "ArrowDown") {
      setHighlightedIndex((index) => Math.min(index + 1, Math.max(filteredOptions.length - 1, 0)));
    } else if (key === "ArrowUp") {
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (key === "Enter") {
      const option = filteredOptions[highlightedIndex];
      if (option) selectOption(option);
    } else if (key === "Escape") {
      closePicker(true);
    }
  }

  return (
    <View style={styles.field} testID={testID}>
      <Text style={labelCase === "sentence" ? styles.labelSentence : styles.label}>{label}</Text>

      <Pressable
        ref={triggerRef}
        onPress={() => (open ? closePicker(false) : openPicker())}
        disabled={disabled}
        accessibilityRole="combobox"
        accessibilityLabel={label}
        aria-expanded={open}
        accessibilityState={{ disabled, expanded: open, busy: loading }}
        // FR-015: react-native-web only treats Space as a valid activation key for
        // accessibilityRole="button" (see webKeyActivation.ts's top comment) — role="combobox"
        // gets Enter for free (already opens/closes the panel) but silently drops Space, even
        // though the WAI-ARIA select-only-combobox pattern conventionally supports both.
        {...spaceKeyActivation(() => (open ? closePicker(false) : openPicker()), disabled)}
        style={[styles.trigger, shadowSurface, disabled ? styles.triggerDisabled : null]}
        testID={testID ? `${testID}-trigger` : undefined}
      >
        {loading ? (
          <Text style={styles.placeholder} testID={testID ? `${testID}-loading` : undefined}>
            {loadingLabel}
          </Text>
        ) : (
          <Text style={selected ? styles.value : styles.placeholder}>
            {selected ? selected.label : (placeholder ?? "")}
          </Text>
        )}
      </Pressable>

      {error ? (
        <View style={styles.errorRow}>
          <Text
            style={styles.error}
            accessibilityRole="alert"
            testID={testID ? `${testID}-error` : undefined}
          >
            {error}
          </Text>
          {onRetry ? (
            <Pressable
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel={retryLabel}
              style={styles.retryButton}
              testID={testID ? `${testID}-retry` : undefined}
            >
              <Text style={styles.retryLabel}>{retryLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {open ? (
        <View style={styles.panel} testID={testID ? `${testID}-panel` : undefined}>
          <TextInput
            style={styles.filterInput}
            value={filter}
            onChangeText={(text) => {
              setFilter(text);
              setHighlightedIndex(0);
            }}
            onKeyPress={handleFilterKeyPress}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.text.placeholder}
            accessibilityLabel={filterAccessibilityLabel}
            autoFocus
            testID={testID ? `${testID}-filter` : undefined}
          />
          <View accessibilityRole="menu" testID={testID ? `${testID}-list` : undefined}>
            {filteredOptions.map((option, index) => (
              <Pressable
                key={option.value}
                onPress={() => selectOption(option)}
                accessibilityRole="menuitem"
                aria-selected={option.value === value}
                accessibilityLabel={option.label}
                style={[styles.option, index === highlightedIndex ? styles.optionHighlighted : null]}
                testID={testID ? `${testID}-option-${option.value}` : undefined}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: space.xs,
    position: "relative",
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
    borderWidth: 1,
    borderColor: colors.border.input,
    paddingHorizontal: space.xl,
    justifyContent: "center",
  },
  triggerDisabled: {
    opacity: 0.6,
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
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  error: {
    fontSize: 13,
    color: colors.text.danger,
    flexShrink: 1,
  },
  retryButton: {
    minHeight: 44,
    justifyContent: "center",
  },
  retryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.link,
  },
  // Absolutely positioned relative to `field` above (position: "relative") — no full-screen
  // takeover, matching how web dropdowns conventionally behave (plan.md Research Decision 3).
  panel: {
    position: "absolute",
    top: CONTROL_HEIGHT + space.xxl,
    left: 0,
    right: 0,
    zIndex: 10,
    maxHeight: 280,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.border.input,
    padding: space.sm,
    gap: space.xs,
  },
  filterInput: {
    height: CONTROL_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.surfaceMuted,
    paddingHorizontal: space.xl,
    fontSize: typography.body.input.fontSize,
    color: colors.text.primary,
  },
  option: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: radius.row,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  optionHighlighted: {
    backgroundColor: colors.bg.surfaceMuted,
  },
  optionLabel: {
    fontSize: typography.body.input.fontSize,
    color: colors.text.primary,
  },
});
