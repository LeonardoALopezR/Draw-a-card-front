// T003 (specs/004-home-scan-shell): the centre "+" card affordance only — this component does
// not wire navigation itself (that's T016/US2's job); it just accepts and calls the `onPress`
// prop it's handed, matching the read-this-data/call-this-handler convention (Constitution IV).
import { Pressable, StyleSheet, Text } from "react-native";

export interface ScanEntryCardProps {
  onPress: () => void;
  // T025 fix (specs/008-scan-experience, code review Round 7 Finding 1): an OPTIONAL label
  // override, added for Inicio's repurposed quick-action card (spec.md Clarifications' Recorded
  // default 1 — the card must "read" the localized "Escanear una carta"/"Scan a card" string,
  // not just carry it as an accessibility-only label). Left undefined, this component's
  // behavior is byte-for-byte unchanged from 004 (bare "+", hardcoded "Scan a card"
  // accessibility label, no visible text) — this is 004-era shared code and this prop must stay
  // optional so no other/future caller is disturbed. When provided, the "+" glyph is KEPT (not
  // replaced): spec.md's own Recorded default 1 rationale explicitly credits the "+" card's
  // "well-tested affordance" as a reason to reuse rather than redesign it, so the label renders
  // as an additional, visible line of text underneath the glyph, and doubles as the
  // accessibility label (so the screen reader announcement matches the visible text exactly).
  label?: string;
}

// Standard trading-card ratio (2.5in x 3.5in), width:height — spec.md FR-004 / Assumptions.
const CARD_ASPECT_RATIO = 2.5 / 3.5;
const CARD_WIDTH = 220;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

export function ScanEntryCard({ onPress, label }: ScanEntryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? "Scan a card"}
      style={styles.card}
      testID="scan-entry-card"
    >
      <Text style={styles.plus}>+</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
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
    gap: 8,
  },
  plus: {
    fontSize: 48,
    fontWeight: "600",
    color: "#111827",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
