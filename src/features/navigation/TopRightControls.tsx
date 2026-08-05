// T007 (specs/004-home-scan-shell): the Home/Scan screen's four top-right placeholder
// controls (language, currency, notifications, messages). Per FR-010 none of these performs
// any real language switching, currency conversion, notification delivery, or messaging — they
// are pure inert UI stubs with zero backend calls. Per plan.md's "Placeholder-control feedback
// mechanism" Research Decision, activation feedback is plain local component state (an inline
// "Not yet available" text row), not Alert.alert (inconsistent/absent on web) or a toast
// library (unjustified new dependency for four inert buttons) — this is what satisfies SC-005
// ("never a silent no-op") without either.
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface ControlConfig {
  readonly key: string;
  readonly visibleLabel: string;
  readonly accessibilityLabel: string;
}

// Order matters: this is exactly the top-to-bottom sequence spec.md US4 AS1 requires —
// language, currency, notifications, messages. Each accessibilityLabel is a real, distinct
// description (spec.md US4 AS3 forbids a bare icon with no label), and each already states
// "not yet available" so a screen-reader user gets the inert-ness up front, not only after
// activating the control.
const CONTROLS: readonly ControlConfig[] = [
  {
    key: "language",
    visibleLabel: "ENG/ESP",
    accessibilityLabel: "Language, English or Spanish — not yet available",
  },
  {
    key: "currency",
    visibleLabel: "USD/MXN",
    accessibilityLabel: "Currency, US Dollar or Mexican Peso — not yet available",
  },
  {
    key: "notifications",
    visibleLabel: "Notifications",
    accessibilityLabel: "Notifications — not yet available",
  },
  {
    key: "messages",
    visibleLabel: "Messages",
    accessibilityLabel: "Messages — not yet available",
  },
];

function PlaceholderControl({ visibleLabel, accessibilityLabel }: Omit<ControlConfig, "key">) {
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  return (
    <View style={styles.controlRow}>
      <Pressable
        onPress={() => setFeedbackVisible((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={styles.control}
      >
        <Text style={styles.controlLabel}>{visibleLabel}</Text>
      </Pressable>
      {feedbackVisible ? <Text style={styles.feedback}>Not yet available</Text> : null}
    </View>
  );
}

export function TopRightControls() {
  return (
    <View style={styles.stack} testID="top-right-controls">
      {CONTROLS.map((control) => (
        <PlaceholderControl
          key={control.key}
          visibleLabel={control.visibleLabel}
          accessibilityLabel={control.accessibilityLabel}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
  },
  controlRow: {
    alignItems: "flex-end",
  },
  control: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#9ca3af",
    alignItems: "center",
    justifyContent: "center",
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  feedback: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
});
