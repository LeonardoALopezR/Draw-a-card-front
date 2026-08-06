// T006 (specs/010-registration-redesign, FR-012, FR-015; plan.md Research Decision 3): the web
// variant's real keyboard-interaction sequence — ArrowDown/ArrowUp move the highlighted option,
// Enter chooses it, Escape closes and restores focus to the trigger — tested by actually firing
// the keydown-equivalent events and asserting on the resulting state changes (which option is
// selected, whether the panel is open, whether the trigger's own `.focus()` was called), not
// merely that a handler prop is wired (docs/verification.md Level 2, "not just that handlers are
// wired"). Imported by relative path, mirroring how this repo already tests other .web.tsx files
// directly (docs/conventions.md, e.g. FormField.test.tsx importing FormField.web).
import { render, screen, fireEvent } from "@testing-library/react-native";
import { View } from "react-native";

import { Select } from "./Select.web";

const OPTIONS = [
  { value: "mx", label: "Mexicana" },
  { value: "us", label: "Estadounidense" },
  { value: "ca", label: "Canadiense" },
];

function press(element: unknown, key: string) {
  fireEvent(element as never, "keyPress", { nativeEvent: { key } });
}

describe("Select.web — keyboard interaction (FR-012, FR-015)", () => {
  it("opens the dropdown panel on trigger press and closes it on a second press", () => {
    render(
      <Select options={OPTIONS} value="" onChange={jest.fn()} label="Nacionalidad" testID="nationality" />,
    );

    expect(screen.queryByTestId("nationality-panel")).toBeNull();

    fireEvent.press(screen.getByTestId("nationality-trigger"));
    expect(screen.getByTestId("nationality-panel")).toBeTruthy();

    fireEvent.press(screen.getByTestId("nationality-trigger"));
    expect(screen.queryByTestId("nationality-panel")).toBeNull();
  });

  it("ArrowDown/ArrowUp move the highlighted option, and Enter chooses the highlighted one", () => {
    const onChange = jest.fn();
    render(
      <Select options={OPTIONS} value="" onChange={onChange} label="Nacionalidad" testID="nationality" />,
    );

    fireEvent.press(screen.getByTestId("nationality-trigger"));
    const filterInput = screen.getByTestId("nationality-filter");

    // Starts highlighted at index 0 ("Mexicana"); ArrowDown twice moves to index 2 ("Canadiense").
    press(filterInput, "ArrowDown");
    press(filterInput, "ArrowDown");
    press(filterInput, "Enter");

    expect(onChange).toHaveBeenCalledWith("ca");
    // Selecting via Enter closes the panel (same as a mouse selection).
    expect(screen.queryByTestId("nationality-panel")).toBeNull();
  });

  it("ArrowUp does not move the highlight above the first option", () => {
    const onChange = jest.fn();
    render(
      <Select options={OPTIONS} value="" onChange={onChange} label="Nacionalidad" testID="nationality" />,
    );

    fireEvent.press(screen.getByTestId("nationality-trigger"));
    const filterInput = screen.getByTestId("nationality-filter");

    press(filterInput, "ArrowUp");
    press(filterInput, "ArrowUp");
    press(filterInput, "Enter");

    // Still highlighted at index 0 ("Mexicana") — clamped, never negative.
    expect(onChange).toHaveBeenCalledWith("mx");
  });

  it("Escape closes the panel and restores focus to the trigger", () => {
    // The trigger Pressable forwards its ref to the underlying `View` class-component instance
    // (confirmed: `ref.current.constructor === View` in this test environment), which is where
    // react-native-web's `usePlatformMethods` attaches the real `.focus()`/`.blur()` methods —
    // spying on the shared prototype method (rather than the ReactTestInstance getByTestId
    // returns, which is a distinct fiber-backed wrapper with no `.focus` of its own) is what
    // actually asserts the component called `.focus()` on its trigger ref, not just that the
    // panel closed.
    const focusSpy = jest.spyOn(View.prototype as unknown as { focus: () => void }, "focus");

    render(
      <Select options={OPTIONS} value="" onChange={jest.fn()} label="Nacionalidad" testID="nationality" />,
    );

    fireEvent.press(screen.getByTestId("nationality-trigger"));
    const filterInput = screen.getByTestId("nationality-filter");
    const callsBeforeEscape = focusSpy.mock.calls.length;
    press(filterInput, "Escape");

    expect(screen.queryByTestId("nationality-panel")).toBeNull();
    expect(focusSpy.mock.calls.length).toBeGreaterThan(callsBeforeEscape);

    focusSpy.mockRestore();
  });

  it("does not react to unrelated keys", () => {
    const onChange = jest.fn();
    render(
      <Select options={OPTIONS} value="" onChange={onChange} label="Nacionalidad" testID="nationality" />,
    );

    fireEvent.press(screen.getByTestId("nationality-trigger"));
    press(screen.getByTestId("nationality-filter"), "a");

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("nationality-panel")).toBeTruthy();
  });

  // Review fix (T006, FR-007): the web variant's copy-override props must reach its rendered
  // output too — same defect/fix as the native variant, kept in an identical prop surface (both
  // import SelectProps from the same Select.types.ts).
  it("renders a caller-supplied retryLabel instead of the built-in English default (FR-007)", () => {
    render(
      <Select
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        label="Nacionalidad"
        error="No se pudo cargar el catálogo"
        onRetry={jest.fn()}
        retryLabel="Reintentar"
        testID="nationality"
      />,
    );

    expect(screen.getByText("Reintentar")).toBeTruthy();
    expect(screen.queryByText("Retry")).toBeNull();
  });

  it("renders caller-supplied searchPlaceholder/filterAccessibilityLabel on the open panel (FR-007)", () => {
    render(
      <Select
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        label="Nacionalidad"
        searchPlaceholder="Buscar"
        filterAccessibilityLabel="Filtrar opciones"
        testID="nationality"
      />,
    );

    fireEvent.press(screen.getByTestId("nationality-trigger"));

    expect(screen.getByTestId("nationality-filter").props.placeholder).toBe("Buscar");
    expect(screen.getByTestId("nationality-filter").props.accessibilityLabel).toBe(
      "Filtrar opciones",
    );
  });

  // FR-015 (T027): react-native-web only treats Space as a valid Pressable activation key for
  // accessibilityRole="button" (webKeyActivation.ts's top comment) — role="combobox" gets Enter
  // for free (already covered above) but silently drops Space without this fix, even though the
  // WAI-ARIA select-only-combobox pattern conventionally supports both.
  it("opens the dropdown panel on a Space keydown on the trigger, not just a press (FR-015)", () => {
    render(
      <Select options={OPTIONS} value="" onChange={jest.fn()} label="Nacionalidad" testID="nationality" />,
    );

    expect(screen.queryByTestId("nationality-panel")).toBeNull();

    fireEvent(screen.getByTestId("nationality-trigger"), "keyDown", { key: " " });
    expect(screen.getByTestId("nationality-panel")).toBeTruthy();

    fireEvent(screen.getByTestId("nationality-trigger"), "keyDown", { key: " " });
    expect(screen.queryByTestId("nationality-panel")).toBeNull();
  });

  it("does not open on a Space keydown while the trigger is disabled by a catalog error (FR-015)", () => {
    render(
      <Select
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        label="Nacionalidad"
        error="No se pudo cargar el catálogo"
        onRetry={jest.fn()}
        testID="nationality"
      />,
    );

    fireEvent(screen.getByTestId("nationality-trigger"), "keyDown", { key: " " });

    expect(screen.queryByTestId("nationality-panel")).toBeNull();
  });

  it("renders a caller-supplied loadingLabel instead of the built-in English default (FR-007)", () => {
    render(
      <Select
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        label="Nacionalidad"
        loading
        loadingLabel="Cargando…"
        testID="nationality"
      />,
    );

    expect(screen.getByText("Cargando…")).toBeTruthy();
    expect(screen.queryByText("Loading…")).toBeNull();
  });
});
