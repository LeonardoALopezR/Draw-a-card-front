// T006 (specs/010-registration-redesign, FR-012, FR-015): real rendered-output/behavior tests
// (docs/verification.md Level 2) for the native/default Select — opening/closing the Modal
// picker, selecting an option, and the loading/error+onRetry states rendering distinctly. The
// web keyboard-interaction sequence is covered separately in Select.web.test.tsx, since only that
// variant implements it (plan.md Research Decision 3).
import { render, screen, fireEvent } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { colors } from "@/theme";

import { Select } from "./Select";

const OPTIONS = [
  { value: "mx", label: "Mexicana" },
  { value: "us", label: "Estadounidense" },
  { value: "ca", label: "Canadiense" },
];

describe("Select (native/default) — FR-012, FR-015", () => {
  it("renders the label and a placeholder when nothing is selected", () => {
    render(
      <Select
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        label="Nacionalidad"
        placeholder="Selecciona"
        testID="nationality"
      />,
    );

    expect(screen.getByText("Nacionalidad")).toBeTruthy();
    expect(screen.getByText("Selecciona")).toBeTruthy();
  });

  it("renders the selected option's label when a value is set", () => {
    render(
      <Select options={OPTIONS} value="mx" onChange={jest.fn()} label="Nacionalidad" testID="nationality" />,
    );

    expect(screen.getByText("Mexicana")).toBeTruthy();
  });

  it("opens the picker on trigger press and closes it again on backdrop press (opening/closing)", () => {
    render(
      <Select options={OPTIONS} value="" onChange={jest.fn()} label="Nacionalidad" testID="nationality" />,
    );

    expect(screen.queryByTestId("nationality-list")).toBeNull();

    fireEvent.press(screen.getByTestId("nationality-trigger"));
    expect(screen.getByTestId("nationality-list")).toBeTruthy();

    fireEvent.press(screen.getByTestId("nationality-backdrop"));
    expect(screen.queryByTestId("nationality-list")).toBeNull();
  });

  it("selecting an option calls onChange with its value and closes the picker", () => {
    const onChange = jest.fn();
    render(
      <Select options={OPTIONS} value="" onChange={onChange} label="Nacionalidad" testID="nationality" />,
    );

    fireEvent.press(screen.getByTestId("nationality-trigger"));
    fireEvent.press(screen.getByTestId("nationality-option-us"));

    expect(onChange).toHaveBeenCalledWith("us");
    expect(screen.queryByTestId("nationality-list")).toBeNull();
  });

  it("filters the option list by the typed text", () => {
    render(
      <Select options={OPTIONS} value="" onChange={jest.fn()} label="Nacionalidad" testID="nationality" />,
    );

    fireEvent.press(screen.getByTestId("nationality-trigger"));
    fireEvent.changeText(screen.getByTestId("nationality-filter"), "mex");

    expect(screen.getByTestId("nationality-option-mx")).toBeTruthy();
    expect(screen.queryByTestId("nationality-option-us")).toBeNull();
  });

  it("renders a loading state distinctly and disables the trigger", () => {
    render(
      <Select options={OPTIONS} value="" onChange={jest.fn()} label="Nacionalidad" loading testID="nationality" />,
    );

    expect(screen.getByTestId("nationality-loading")).toBeTruthy();
    expect(screen.getByTestId("nationality-trigger").props.accessibilityState.disabled).toBe(true);
  });

  it("renders an error state with a retry action distinctly from the loading state", () => {
    const onRetry = jest.fn();
    render(
      <Select
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        label="Nacionalidad"
        error="No se pudo cargar el catálogo"
        onRetry={onRetry}
        testID="nationality"
      />,
    );

    expect(screen.queryByTestId("nationality-loading")).toBeNull();
    expect(screen.getByText("No se pudo cargar el catálogo")).toBeTruthy();

    fireEvent.press(screen.getByTestId("nationality-retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not open the picker while disabled by loading or error", () => {
    render(
      <Select options={OPTIONS} value="" onChange={jest.fn()} label="Nacionalidad" loading testID="nationality" />,
    );

    fireEvent.press(screen.getByTestId("nationality-trigger"));
    expect(screen.queryByTestId("nationality-list")).toBeNull();
  });

  // Review fix (T006, FR-007): caller-supplied copy props must actually reach the rendered
  // output — a Spanish-speaking caller (T015/T020, once wired) needs these to genuinely localize
  // the retry action, the filter placeholder/accessibility label, the backdrop's close label, and
  // the loading indicator's accessibility label, not just have the props accepted and ignored.
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

  it("renders caller-supplied searchPlaceholder/filterAccessibilityLabel/closeAccessibilityLabel on the open picker (FR-007)", () => {
    render(
      <Select
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        label="Nacionalidad"
        searchPlaceholder="Buscar"
        filterAccessibilityLabel="Filtrar opciones"
        closeAccessibilityLabel="Cerrar"
        testID="nationality"
      />,
    );

    fireEvent.press(screen.getByTestId("nationality-trigger"));

    expect(screen.getByTestId("nationality-filter").props.placeholder).toBe("Buscar");
    expect(screen.getByTestId("nationality-filter").props.accessibilityLabel).toBe(
      "Filtrar opciones",
    );
    expect(screen.getByTestId("nationality-backdrop").props.accessibilityLabel).toBe("Cerrar");
  });

  it("defaults every copy prop to the original English strings when the caller passes none (backward compatibility)", () => {
    render(
      <Select
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        label="Nacionalidad"
        loading
        testID="nationality"
      />,
    );

    expect(screen.getByTestId("nationality-loading").props.accessibilityLabel).toBe("Loading…");
  });

  it("sources the native modal backdrop's fill from the src/theme overlay token, not an inline literal (FR-006)", () => {
    render(
      <Select options={OPTIONS} value="" onChange={jest.fn()} label="Nacionalidad" testID="nationality" />,
    );

    fireEvent.press(screen.getByTestId("nationality-trigger"));
    const backdrop = screen.getByTestId("nationality-backdrop");
    const style = StyleSheet.flatten(backdrop.props.style);

    expect(style.backgroundColor).toBe(colors.overlay.backdrop);
  });
});
