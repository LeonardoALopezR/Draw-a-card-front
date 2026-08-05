// T003 (specs/004-home-scan-shell): the centre "+" card affordance only — this component does
// not wire navigation itself (that's T016/US2's job); it just accepts and calls the `onPress`
// prop it's handed, matching the read-this-data/call-this-handler convention (Constitution IV).
import { Pressable, StyleSheet, Text } from "react-native";

export interface ScanEntryCardProps {
  onPress: () => void;
}

// Standard trading-card ratio (2.5in x 3.5in), width:height — spec.md FR-004 / Assumptions.
const CARD_ASPECT_RATIO = 2.5 / 3.5;
const CARD_WIDTH = 220;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

export function ScanEntryCard({ onPress }: ScanEntryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Scan a card"
      style={styles.card}
      testID="scan-entry-card"
    >
      <Text style={styles.plus}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  plus: {
    fontSize: 48,
    fontWeight: "600",
    color: "#111827",
  },
});
