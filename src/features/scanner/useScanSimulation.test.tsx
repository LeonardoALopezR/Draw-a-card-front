// specs/008-scan-experience/tasks.md T013 (US2, FR-007, FR-009): a minimal RNTL test-harness
// component renders `useScanSimulation()`'s returned state/handlers as plain Text/Pressable
// elements — docs/verification.md Level 2 ("assert on rendered output/behavior", not internal
// hook state) — since a hook has no rendered output of its own to assert against directly.
import { act, fireEvent, render } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";

import { SAMPLE_CARDS } from "@/domain/scanResults";

import { useScanSimulation } from "./useScanSimulation";

function ScanSimulationHarness() {
  const {
    result,
    confirming,
    triggerScan,
    changeCard,
    removeCard,
    acceptCard,
    selectCondition,
    toggleGraded,
    incrementQuantity,
    decrementQuantity,
  } = useScanSimulation();

  return (
    <View>
      <Text testID="result-card-id">{result ? result.card.id : "idle"}</Text>
      <Text testID="result-condition">{result ? result.condition : "none"}</Text>
      <Text testID="result-graded">{result ? String(result.graded) : "none"}</Text>
      <Text testID="result-quantity">{result ? String(result.quantity) : "none"}</Text>
      <Text testID="confirming">{String(confirming)}</Text>

      <Pressable testID="trigger" onPress={triggerScan}>
        <Text>trigger</Text>
      </Pressable>
      <Pressable testID="change" onPress={changeCard}>
        <Text>change</Text>
      </Pressable>
      <Pressable testID="remove" onPress={removeCard}>
        <Text>remove</Text>
      </Pressable>
      <Pressable testID="accept" onPress={acceptCard}>
        <Text>accept</Text>
      </Pressable>
      <Pressable testID="select-fair" onPress={() => selectCondition("fair")}>
        <Text>select-fair</Text>
      </Pressable>
      <Pressable testID="toggle-graded" onPress={toggleGraded}>
        <Text>toggle-graded</Text>
      </Pressable>
      <Pressable testID="increment" onPress={incrementQuantity}>
        <Text>increment</Text>
      </Pressable>
      <Pressable testID="decrement" onPress={decrementQuantity}>
        <Text>decrement</Text>
      </Pressable>
    </View>
  );
}

describe("useScanSimulation (FR-007, FR-009)", () => {
  // FR-007: idle at rest — no result until triggerScan() is called.
  it("starts idle (result null)", () => {
    const { getByTestId } = render(<ScanSimulationHarness />);
    expect(getByTestId("result-card-id").props.children).toBe("idle");
  });

  // FR-007, FR-009: triggerScan() -> changeCard() -> removeCard() walks through the expected
  // states, exactly as spec.md User Story 2's Independent Test describes.
  it("walks triggerScan() -> changeCard() -> removeCard() through the expected states", () => {
    const { getByTestId } = render(<ScanSimulationHarness />);

    fireEvent.press(getByTestId("trigger"));
    expect(getByTestId("result-card-id").props.children).toBe(SAMPLE_CARDS[0].id);
    expect(getByTestId("result-condition").props.children).toBe(SAMPLE_CARDS[0].defaultCondition);
    expect(getByTestId("result-quantity").props.children).toBe("1");

    fireEvent.press(getByTestId("change"));
    expect(getByTestId("result-card-id").props.children).toBe(SAMPLE_CARDS[1].id);

    fireEvent.press(getByTestId("remove"));
    expect(getByTestId("result-card-id").props.children).toBe("idle");
  });

  // FR-009: "Cambiar" re-seeds condition/graded/quantity to the next card's own defaults, not
  // the previous card's edited values.
  it("changeCard() resets condition/graded/quantity to the next card's own defaults", () => {
    const { getByTestId } = render(<ScanSimulationHarness />);

    fireEvent.press(getByTestId("trigger"));
    fireEvent.press(getByTestId("select-fair"));
    fireEvent.press(getByTestId("toggle-graded"));
    fireEvent.press(getByTestId("increment"));
    expect(getByTestId("result-condition").props.children).toBe("fair");
    expect(getByTestId("result-graded").props.children).toBe("false");
    expect(getByTestId("result-quantity").props.children).toBe("2");

    fireEvent.press(getByTestId("change"));
    expect(getByTestId("result-card-id").props.children).toBe(SAMPLE_CARDS[1].id);
    expect(getByTestId("result-condition").props.children).toBe(SAMPLE_CARDS[1].defaultCondition);
    expect(getByTestId("result-graded").props.children).toBe(String(SAMPLE_CARDS[1].defaultGraded));
    expect(getByTestId("result-quantity").props.children).toBe("1");
  });

  // FR-008: decrementQuantity is clamped at MIN_QUANTITY (1), never below.
  it("never drops quantity below MIN_QUANTITY via decrement", () => {
    const { getByTestId } = render(<ScanSimulationHarness />);
    fireEvent.press(getByTestId("trigger"));
    expect(getByTestId("result-quantity").props.children).toBe("1");

    fireEvent.press(getByTestId("decrement"));
    expect(getByTestId("result-quantity").props.children).toBe("1");
  });

  // FR-009: acceptCard() briefly shows a confirming state, then returns to idle — no network
  // call, no storage write (nothing here calls src/domain/api-client or any storage API).
  it("acceptCard() briefly shows a confirming state then returns to idle", () => {
    jest.useFakeTimers();
    try {
      const { getByTestId } = render(<ScanSimulationHarness />);

      fireEvent.press(getByTestId("trigger"));
      expect(getByTestId("confirming").props.children).toBe("false");

      fireEvent.press(getByTestId("accept"));
      expect(getByTestId("confirming").props.children).toBe("true");
      // Still showing the found card while confirming — the confirmation isn't a silent no-op.
      expect(getByTestId("result-card-id").props.children).toBe(SAMPLE_CARDS[0].id);

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(getByTestId("confirming").props.children).toBe("false");
      expect(getByTestId("result-card-id").props.children).toBe("idle");
    } finally {
      jest.useRealTimers();
    }
  });

  // FR-009: pressing "Eliminar" while a confirmation is pending must not leave a stray timer
  // that later clears state out from under a *new* found card the user re-triggered afterward.
  it("removeCard() cancels a pending acceptCard() confirmation timer", () => {
    jest.useFakeTimers();
    try {
      const { getByTestId } = render(<ScanSimulationHarness />);

      fireEvent.press(getByTestId("trigger"));
      fireEvent.press(getByTestId("accept"));
      fireEvent.press(getByTestId("remove"));
      expect(getByTestId("result-card-id").props.children).toBe("idle");

      fireEvent.press(getByTestId("trigger"));
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      // The cancelled timer must not have fired and cleared this second, unrelated found state.
      expect(getByTestId("result-card-id").props.children).toBe(SAMPLE_CARDS[0].id);
    } finally {
      jest.useRealTimers();
    }
  });
});
