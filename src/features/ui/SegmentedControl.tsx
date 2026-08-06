// T005 (specs/010-registration-redesign, FR-001, FR-006, FR-015): the `Usuario`/`Tienda`
// account-type switch (docs/design-brief-registration-redesign.md §2) — a generic, full-width,
// two-(or-more)-segment pill control, not a one-off built only for CrearCuentaScreen. Reuses the
// exact accessible `radiogroup`/`radio` + top-level `aria-checked` pattern already established
// and reviewed in RegistrationForm.tsx's account-type toggle (001-registration-kyc T024) rather
// than reinventing it — see that file's comment for the full explanation of why `aria-checked`
// is set as a top-level prop *and* mirrored into `accessibilityState.checked`: this repo's
// pinned react-native-web (0.19.13) never forwards `accessibilityState` to the DOM
// (`accessibilityState` is absent from `forwardedProps`'s allowlist), so `aria-checked` alone is
// what a screen-reader user on web actually gets; native RN's own Pressable merges a top-level
// `aria-checked` prop into `accessibilityState.checked` for iOS/Android, and the test environment
// (Jest/RNTL) reads `accessibilityState` directly, so both are kept.
//
// No platform split needed (plan.md's Research Decision 3) — identical, dependency-free
// Pressables render correctly on all three targets.
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, CONTROL_HEIGHT, radius, typography } from "@/theme";

import { spaceKeyActivation } from "./webKeyActivation";

export interface SegmentedControlOption {
  label: string;
  value: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  testID?: string;
}

export function SegmentedControl({ options, value, onChange, testID }: SegmentedControlProps) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup" testID={testID}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            // See this file's top comment — aria-checked as a top-level prop is load-bearing on
            // web; accessibilityState.checked is kept alongside it for the test environment and
            // native platforms.
            aria-checked={selected}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            // FR-015: react-native-web only treats Space as a valid activation key for
            // accessibilityRole="button" (see webKeyActivation.ts's top comment) — role="radio"
            // gets Enter for free but silently drops Space without this.
            {...spaceKeyActivation(() => onChange(option.value))}
            style={[styles.segment, selected ? styles.segmentSelected : styles.segmentUnselected]}
            testID={testID ? `${testID}-option-${option.value}` : undefined}
          >
            <Text style={selected ? styles.labelSelected : styles.labelUnselected}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    width: "100%",
    height: CONTROL_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.segment.inactiveTrack,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  segmentSelected: {
    backgroundColor: colors.brand.primary,
  },
  segmentUnselected: {
    backgroundColor: "transparent",
  },
  labelSelected: {
    fontSize: typography.button.label.fontSize,
    fontWeight: typography.button.label.fontWeight,
    color: colors.brand.onPrimary,
  },
  labelUnselected: {
    fontSize: typography.button.label.fontSize,
    fontWeight: "500",
    color: colors.text.secondary,
  },
});
