// specs/008-scan-experience/tasks.md T014 (US2, FR-008, FR-009, spec.md User Story 2 AS1–AS4).
// docs/verification.md Level 2 — real rendered output/behavior, not internal state. Renders
// FoundCardPanel purely from props (no useScanSimulation() call anywhere in this file), matching
// the component's own props-driven contract (Constitution IV).
import fs from "fs";
import path from "path";
import { LinearGradient } from "expo-linear-gradient";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import {
  SAMPLE_CARDS,
  selectCondition,
  startFoundState,
  toggleGraded,
  type FoundCardState,
} from "@/domain/scanResults";

import { FoundCardPanel, type FoundCardPanelProps } from "./FoundCardPanel";

function renderPanel(overrides: Partial<FoundCardPanelProps> = {}) {
  const props: FoundCardPanelProps = {
    state: startFoundState(SAMPLE_CARDS[0]),
    onSelectCondition: jest.fn(),
    onToggleGraded: jest.fn(),
    onIncrement: jest.fn(),
    onDecrement: jest.fn(),
    onChange: jest.fn(),
    onRemove: jest.fn(),
    onAccept: jest.fn(),
    ...overrides,
  };
  const view = render(<FoundCardPanel {...props} />);
  return { ...view, props };
}

describe("FoundCardPanel", () => {
  // FR-016: same camera-import source-inspection guard every file under src/features/scanner/
  // carries — this is a new file this feature adds there.
  it("does not import any camera-related module", () => {
    const source = fs.readFileSync(path.join(__dirname, "FoundCardPanel.tsx"), "utf8");
    const importLines = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line) || /require\(/.test(line));

    expect(importLines.some((line) => /expo-camera/.test(line))).toBe(false);
    expect(importLines.some((line) => /expo-image-picker/.test(line))).toBe(false);
    expect(importLines.some((line) => /camera/i.test(line))).toBe(false);
  });

  // spec.md User Story 2 AS1: renders the documented fields for SAMPLE_CARDS[0] — thumbnail,
  // "Dragón Eterno", "Genesis · GEN-001", a solid "PSA 10" pill, a green "$45,000" pill,
  // "Eliminar"/"Cambiar" links, "Gradeada" + grade-value fields, a condition-chip row with
  // "Near Mint" selected, a quantity stepper reading 1, and an "Aceptar" button.
  it("renders the documented fields for SAMPLE_CARDS[0]", () => {
    renderPanel();

    expect(screen.getByTestId("found-card-thumbnail")).toBeTruthy();
    // Human-requested follow-up (2026-08-06): the thumbnail is a real gradient (the mockups'
    // "purple gradient" for Dragón Eterno), not a flat color — asserted via the underlying
    // LinearGradient's `colors` prop, matching SAMPLE_CARDS[0]'s own thumbnailGradient.
    expect(screen.UNSAFE_getByType(LinearGradient).props.colors).toEqual(
      SAMPLE_CARDS[0].thumbnailGradient
    );
    expect(screen.getByText("Dragón Eterno")).toBeTruthy();
    expect(screen.getByText("Genesis · GEN-001")).toBeTruthy();
    expect(screen.getByTestId("found-card-grade-pill")).toHaveTextContent("PSA 10");
    expect(screen.getByTestId("found-card-price-pill")).toHaveTextContent("$45,000");
    expect(screen.getByText(scanCopy.es.removeLink)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.changeLink)).toBeTruthy();
    expect(screen.getByText(scanCopy.es.gradedLabel)).toBeTruthy();

    const nearMintChip = screen.getByRole("radio", { name: scanCopy.es.conditionNearMint });
    expect(nearMintChip.props.accessibilityState.checked).toBe(true);

    expect(screen.getByTestId("found-card-quantity-value").props.children).toBe(1);
    expect(screen.getByRole("button", { name: scanCopy.es.acceptButton })).toBeTruthy();
  });

  // spec.md User Story 2 AS2: exactly one chip is ever selected, and selecting a different one
  // calls onSelectCondition with that option.
  it("selecting a different condition chip calls onSelectCondition, and exactly one chip is ever selected", () => {
    const onSelectCondition = jest.fn();
    renderPanel({ onSelectCondition });

    const fairChip = screen.getByRole("radio", { name: scanCopy.es.conditionFair });
    fireEvent.press(fairChip);
    expect(onSelectCondition).toHaveBeenCalledWith("fair");

    // Still reflects the (unchanged, props-driven) state — only nearMint is checked until the
    // parent re-renders with a new `state` prop.
    const allChips = screen.getAllByRole("radio");
    const checkedCount = allChips.filter((chip) => chip.props.accessibilityState.checked).length;
    expect(checkedCount).toBe(1);
  });

  // spec.md User Story 2 AS2 continued: re-rendering with a different `condition` moves the
  // checked state to that chip, and only that chip.
  it("shows exactly one chip selected after the state prop changes", () => {
    const initial = startFoundState(SAMPLE_CARDS[0]);
    const { rerender } = renderPanel({ state: initial });

    const next = selectCondition(initial, "good");
    rerender(
      <FoundCardPanel
        state={next}
        onSelectCondition={jest.fn()}
        onToggleGraded={jest.fn()}
        onIncrement={jest.fn()}
        onDecrement={jest.fn()}
        onChange={jest.fn()}
        onRemove={jest.fn()}
        onAccept={jest.fn()}
      />
    );

    expect(screen.getByRole("radio", { name: scanCopy.es.conditionGood }).props.accessibilityState.checked).toBe(
      true
    );
    expect(
      screen.getByRole("radio", { name: scanCopy.es.conditionNearMint }).props.accessibilityState.checked
    ).toBe(false);
  });

  // spec.md User Story 2 AS3: the stepper's "−" is disabled at MIN_QUANTITY (1, SAMPLE_CARDS[0]'s
  // seeded quantity) — genuinely disabled, not merely visually dimmed, and does not call
  // onDecrement when pressed.
  it('disables the stepper\'s "−" at MIN_QUANTITY and does not call onDecrement when pressed', () => {
    const onDecrement = jest.fn();
    renderPanel({ onDecrement });

    const decrementButton = screen.getByTestId("found-card-quantity-decrement");
    expect(decrementButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(decrementButton);
    expect(onDecrement).not.toHaveBeenCalled();
  });

  it('calls onIncrement when "+" is pressed', () => {
    const onIncrement = jest.fn();
    renderPanel({ onIncrement });

    fireEvent.press(screen.getByTestId("found-card-quantity-increment"));
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });

  // spec.md User Story 2 AS4: toggling "Gradeada" calls onToggleGraded, and the grade-value
  // field's visible text follows the `graded` prop (grade text when on, dash placeholder when
  // off).
  it('toggling "Gradeada" calls onToggleGraded, and the grade-value field follows the graded prop', () => {
    const onToggleGraded = jest.fn();
    const gradedState = startFoundState(SAMPLE_CARDS[0]);
    const { rerender } = renderPanel({ state: gradedState, onToggleGraded });

    expect(screen.getByTestId("found-card-grade-value")).toHaveTextContent("PSA 10");

    fireEvent.press(screen.getByTestId("found-card-graded-toggle"));
    expect(onToggleGraded).toHaveBeenCalledTimes(1);

    const ungraded = toggleGraded(gradedState);
    rerender(
      <FoundCardPanel
        state={ungraded}
        onSelectCondition={jest.fn()}
        onToggleGraded={jest.fn()}
        onIncrement={jest.fn()}
        onDecrement={jest.fn()}
        onChange={jest.fn()}
        onRemove={jest.fn()}
        onAccept={jest.fn()}
      />
    );
    expect(screen.getByTestId("found-card-grade-value")).toHaveTextContent(
      scanCopy.es.gradeValuePlaceholder
    );
    const toggle = screen.getByTestId("found-card-graded-toggle");
    expect(toggle.props.accessibilityState.checked).toBe(false);
  });

  // spec.md User Story 2 AS5/AS6/AS7: "Cambiar"/"Eliminar"/"Aceptar" call their respective
  // handlers.
  it('"Cambiar", "Eliminar", and "Aceptar" call their respective handlers', () => {
    const onChange = jest.fn();
    const onRemove = jest.fn();
    const onAccept = jest.fn();
    renderPanel({ onChange, onRemove, onAccept });

    fireEvent.press(screen.getByText(scanCopy.es.changeLink));
    expect(onChange).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText(scanCopy.es.removeLink));
    expect(onRemove).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByRole("button", { name: scanCopy.es.acceptButton }));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  // spec.md User Story 3 AS3: the condition-chip row wraps onto a second row when it doesn't
  // fit on one line (the mobile mockup shows four chips, then "Fair" alone on a second row).
  it("the condition-chip row is styled to wrap onto a second row", () => {
    renderPanel();

    const row = screen.getByTestId("found-card-condition-row");
    const style = StyleSheet.flatten(row.props.style);
    expect(style.flexWrap).toBe("wrap");
  });

  // Every interactive element (chips, stepper buttons, toggle, links, Aceptar) keeps a real
  // ≥44x44 tap target (Constitution VII).
  it("keeps every interactive element at a minimum 44x44 tap target", () => {
    renderPanel();

    const targets = [
      screen.getByRole("button", { name: scanCopy.es.removeLink }),
      screen.getByRole("button", { name: scanCopy.es.changeLink }),
      screen.getByTestId("found-card-graded-toggle"),
      screen.getByRole("radio", { name: scanCopy.es.conditionNearMint }),
      screen.getByTestId("found-card-quantity-decrement"),
      screen.getByTestId("found-card-quantity-increment"),
    ];

    for (const target of targets) {
      const style = StyleSheet.flatten(target.props.style);
      expect(style.minHeight ?? style.height).toBeGreaterThanOrEqual(44);
      expect(style.minWidth ?? style.width).toBeGreaterThanOrEqual(44);
    }

    const acceptButtonStyle = StyleSheet.flatten(
      screen.getByRole("button", { name: scanCopy.es.acceptButton }).props.style
    );
    expect(acceptButtonStyle.height).toBeGreaterThanOrEqual(44);
  });
});
