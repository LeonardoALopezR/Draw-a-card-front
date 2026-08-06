// T006 (specs/010-registration-redesign, FR-012, FR-015; plan.md Research Decision 3): the
// generic, dependency-free selection primitive the nationality field (and any future catalog-
// backed picker) needs — not a one-off built only for CrearCuentaScreen. Native/default variant:
// a Pressable trigger styled like FormField's input pill, opening a `Modal` containing a filter
// `TextInput` + a `FlatList` of options. The `.web.tsx` sibling (Select.web.tsx) swaps this for
// an absolutely-positioned dropdown panel with real keyboard handling — see that file's comment
// for why the platform split is genuine, not cosmetic (Constitution IV).
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, CONTROL_HEIGHT, radius, shadowSurface, space, typography } from "@/theme";

import type { SelectOption, SelectProps } from "./Select.types";

export type { SelectOption, SelectProps };

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
  closeAccessibilityLabel = "Close",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, filter]);

  const disabled = loading || Boolean(error);

  function openPicker() {
    if (disabled) return;
    setFilter("");
    setOpen(true);
  }

  function selectOption(option: SelectOption) {
    onChange(option.value);
    setOpen(false);
  }

  function closePicker() {
    setOpen(false);
  }

  return (
    <View style={styles.field} testID={testID}>
      <Text style={labelCase === "sentence" ? styles.labelSentence : styles.label}>{label}</Text>

      <Pressable
        onPress={openPicker}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, busy: loading }}
        style={[styles.trigger, shadowSurface, disabled ? styles.triggerDisabled : null]}
        testID={testID ? `${testID}-trigger` : undefined}
      >
        {loading ? (
          <ActivityIndicator
            color={colors.text.secondary}
            accessibilityLabel={loadingLabel}
            testID={testID ? `${testID}-loading` : undefined}
          />
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
          <TextInput
            style={styles.filterInput}
            value={filter}
            onChangeText={setFilter}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.text.placeholder}
            accessibilityLabel={filterAccessibilityLabel}
            autoFocus
            testID={testID ? `${testID}-filter` : undefined}
          />
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.value}
            testID={testID ? `${testID}-list` : undefined}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => selectOption(item)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={styles.option}
                testID={testID ? `${testID}-option-${item.value}` : undefined}
              >
                <Text style={styles.optionLabel}>{item.label}</Text>
              </Pressable>
            )}
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
    maxHeight: "70%",
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
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
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  optionLabel: {
    fontSize: typography.body.input.fontSize,
    color: colors.text.primary,
  },
});
