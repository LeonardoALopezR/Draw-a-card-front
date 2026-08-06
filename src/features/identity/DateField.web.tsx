// T007 (specs/010-registration-redesign, FR-013, spec.md Clarification 4): web counterpart of
// DateField.tsx — same DateFieldProps contract (DateField.types.ts, imported not redeclared).
//
// A genuine platform-mechanism split (Constitution IV), not a cosmetic one: DateField.tsx wraps
// each OS's own native date picker; this file wraps the browser's own native `<input
// type="date">` — there is no react-native-web component that renders one. This was verified,
// not assumed (mirroring this feature's own "compute the contrast ratio, don't trust the
// number" bar, T002): react-native-web's `TextInput` (v0.19.13, this repo's pin) does *not* pass
// an arbitrary `type` prop through to the DOM the way its `style` object forwards unrecognized
// CSS properties (the mechanism LoginScreenChrome.web.tsx's `backgroundImage` relies on) — its
// `type` attribute is always internally recomputed from `keyboardType`/`inputMode`/
// `secureTextEntry` and unconditionally overwrites whatever `type` prop was passed
// (node_modules/react-native-web/dist/cjs/exports/TextInput/index.js:
// `supportedProps.type = multiline ? undefined : type;`, and none of that local `type`'s cases
// produce `"date"`). A real, plain DOM `<input>` element, created directly via
// `React.createElement` (not the `TextInput` component) rather than reached for a `.web`-only
// npm package, is what actually gets the browser's native date-picker affordance (calendar icon,
// typed/parsed value, keyboard operability) FR-013/the design brief call for — confirmed
// (scratch-tested, 2026-08-06) to render correctly under this repo's Jest setup
// (`@testing-library/react-native`'s `react-test-renderer` accepts any host tag string, native or
// DOM, with no RN-specific ViewConfig requirement) and `fireEvent` invokes its `onChange` exactly
// like any other host node's prop handler — no real browser needed to unit-test this file.
import * as React from "react";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, CONTROL_HEIGHT, radius, space, typography } from "@/theme";

import type { DateFieldProps } from "./DateField.types";

export type { DateFieldProps };

// A plain DOM element, not a react-native-web component — its own `aria-label`/`style` props are
// real HTML attributes (`style` a literal CSS-in-JS object, not an RN StyleSheet ID), which is why
// this small interface exists instead of reusing React's `InputHTMLAttributes` (that type has no
// `testID` member — RN's own convention, not a DOM one). `testID` itself is kept as the public
// prop name (matching every other component in this codebase) but is never forwarded to
// `React.createElement` as-is — React only recognizes real DOM attributes, and warns at
// error-level on every render otherwise ("React does not recognize the `testID` prop on a DOM
// element"). react-native-web's own host components avoid this by renaming `testID` to
// `data-testid` before it reaches the DOM (node_modules/react-native-web/dist/cjs/modules/
// createDOMProps/index.js: `domProps['data-testid'] = testID`) — this raw `<input>` isn't one of
// those components, so it has to do that same rename itself.
interface RawDateInputProps {
  type: "date";
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: React.CSSProperties;
  "aria-label"?: string;
  testID?: string;
}

function RawDateInput({ testID, ...props }: RawDateInputProps) {
  return React.createElement("input", { ...props, "data-testid": testID });
}

// The DOM's own `<input type="date">` value format is always ISO `YYYY-MM-DD`, regardless of
// locale — converting to/from a `Date` here, not doing date arithmetic in the caller.
function toInputValue(date?: Date): string {
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromInputValue(text: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return undefined;
  const [, yearText, monthText, dayText] = match;
  const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function DateField({
  label,
  value,
  onChange,
  error,
  testID,
  labelCase = "uppercase",
}: DateFieldProps) {
  // T029 review fix (Constitution VII/FR-015): `rawInputStyle` used to set `outline: "none"`
  // unconditionally, removing this control's only visible keyboard-focus indicator — every other
  // control on this screen keeps one. A plain CSS-in-JS object (this file's whole point — see the
  // comment above `rawInputStyle`) has no `:focus` pseudo-class to hook, so `focused` tracks it
  // via the real DOM `focus`/`blur` events instead, and the ring itself is `colors.brand.primary`
  // (an existing src/theme token, not a new one) rather than a raw literal.
  const [focused, setFocused] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const parsed = fromInputValue(event.target.value);
    if (parsed) onChange(parsed);
  }

  return (
    <View style={styles.field} testID={testID}>
      <Text style={labelCase === "sentence" ? styles.labelSentence : styles.label}>{label}</Text>

      <View style={styles.trigger}>
        <RawDateInput
          type="date"
          value={toInputValue(value)}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={focused ? rawInputFocusedStyle : rawInputStyle}
          aria-label={label}
          testID={testID ? `${testID}-input` : undefined}
        />
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// A literal CSS-in-JS object for the raw DOM <input> — deliberately *not* StyleSheet.create'd
// (an RN StyleSheet's output is a resolved style ID meant for react-native-web's own components
// to flatten, not a plain object a bare DOM element's `style` prop can consume directly).
const rawInputStyle: React.CSSProperties = {
  fontSize: typography.body.input.fontSize,
  fontWeight: typography.body.input.fontWeight,
  color: colors.text.primary,
  border: "none",
  outline: "none",
  background: "transparent",
  width: "100%",
  fontFamily: "inherit",
};

// T029 review fix: a real, visible focus indicator, shown only while the input is actually
// focused (see `focused` above) — an unconditional outline would render even when the control
// isn't focused, which is not what a focus indicator means.
const rawInputFocusedStyle: React.CSSProperties = {
  ...rawInputStyle,
  outline: `2px solid ${colors.brand.primary}`,
  outlineOffset: 2,
};

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
    borderWidth: 1,
    borderColor: colors.border.input,
    paddingHorizontal: space.xl,
    justifyContent: "center",
  },
  error: {
    fontSize: 13,
    color: colors.text.danger,
  },
});
