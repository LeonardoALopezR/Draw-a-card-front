// T024a (006-visual-identity): tests the `Field` restyle (docs/design-brief-visual-identity.md
// §3 item 4; FR-001, FR-003, FR-005) — confirms the label renders with the uppercase
// typography.label.field treatment, the mobile/default variant (FormField.tsx) renders its input
// container borderless with a shadow.surface-shaped style, and the web variant (FormField.web.tsx,
// imported directly by relative path — mirroring how this repo already tests other .web.tsx
// files directly, e.g. src/features/navigation/AppWebLayout.test.tsx, per docs/conventions.md)
// renders bordered with no shadow instead. Also confirms the pre-existing (001-registration-kyc)
// error-text `accessibilityRole="alert"` behavior still holds — a regression guard, since
// FormField is also consumed, unmodified in prop shape, by RegistrationForm/VerifyPhoneScreen/
// ProfileForm outside this feature's scope.
import { render, screen } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import { colors, radius, typography } from "@/theme";

import { FormField } from "./FormField";
import { FormField as WebFormField } from "./FormField.web";

describe("FormField (mobile/default)", () => {
  it("renders the label uppercase via typography.label.field", () => {
    render(
      <FormField label="Correo">
        <Text>input</Text>
      </FormField>,
    );

    const label = screen.getByText("Correo");
    const style = StyleSheet.flatten(label.props.style);

    expect(style.textTransform).toBe("uppercase");
    expect(style.fontSize).toBe(typography.label.field.fontSize);
    expect(style.letterSpacing).toBe(typography.label.field.letterSpacing);
    expect(style.color).toBe(typography.label.field.color);
  });

  it("renders the input container borderless with a shadow.surface style, bg.surface, and radius.pill", () => {
    render(
      <FormField label="Correo" testID="field">
        <Text>input</Text>
      </FormField>,
    );

    const inputContainer = screen.getByTestId("field-input");
    const style = StyleSheet.flatten(inputContainer.props.style);

    expect(style.backgroundColor).toBe(colors.bg.surface);
    expect(style.borderRadius).toBe(radius.pill);
    expect(style.borderWidth).toBeUndefined();
    // shadow.surface's native shape (src/theme/shadows.ts) — present since this is the
    // mobile/default (non-.web) variant.
    expect(style.shadowColor).toBe("#10281A");
    expect(style.shadowOpacity).toBeGreaterThan(0);
  });

  // Pre-existing behavior (001-registration-kyc) — must not regress.
  it("renders the error text with accessibilityRole=alert when an error is present", () => {
    render(
      <FormField label="Correo" error="Campo requerido">
        <Text>input</Text>
      </FormField>,
    );

    const error = screen.getByRole("alert");
    expect(error.props.children).toBe("Campo requerido");
  });

  it("renders no error text when no error is provided", () => {
    render(
      <FormField label="Correo">
        <Text>input</Text>
      </FormField>,
    );

    expect(screen.queryByRole("alert")).toBeNull();
  });

  // T004 (specs/010-registration-redesign, FR-006): labelCase="sentence" applies
  // typography.label.fieldSentence (no textTransform/letterSpacing) instead of the default
  // uppercase label.field treatment — and the default (no labelCase prop at all) still renders
  // uppercase, the backward-compatibility guarantee every existing call site relies on.
  it('renders label.fieldSentence with no textTransform when labelCase="sentence"', () => {
    render(
      <FormField label="Nombre completo" labelCase="sentence">
        <Text>input</Text>
      </FormField>,
    );

    const label = screen.getByText("Nombre completo");
    const style = StyleSheet.flatten(label.props.style);

    expect(style.textTransform).toBeUndefined();
    expect(style.letterSpacing).toBeUndefined();
    expect(style.fontSize).toBe(typography.label.fieldSentence.fontSize);
    expect(style.fontWeight).toBe(typography.label.fieldSentence.fontWeight);
    expect(style.color).toBe(typography.label.fieldSentence.color);
  });

  it("still renders uppercase label.field when labelCase is omitted (backward compatibility)", () => {
    render(
      <FormField label="Correo">
        <Text>input</Text>
      </FormField>,
    );

    const label = screen.getByText("Correo");
    const style = StyleSheet.flatten(label.props.style);

    expect(style.textTransform).toBe("uppercase");
  });
});

describe("FormField.web", () => {
  it("renders the input container bordered (border.input) with no shadow", () => {
    render(
      <WebFormField label="Correo" testID="field">
        <Text>input</Text>
      </WebFormField>,
    );

    const inputContainer = screen.getByTestId("field-input");
    const style = StyleSheet.flatten(inputContainer.props.style);

    expect(style.backgroundColor).toBe(colors.bg.surface);
    expect(style.borderRadius).toBe(radius.pill);
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe(colors.border.input);
    expect(style.shadowColor).toBeUndefined();
    expect(style.boxShadow).toBeUndefined();
  });

  it("renders the label uppercase via typography.label.field", () => {
    render(
      <WebFormField label="Contraseña">
        <Text>input</Text>
      </WebFormField>,
    );

    const label = screen.getByText("Contraseña");
    const style = StyleSheet.flatten(label.props.style);

    expect(style.textTransform).toBe("uppercase");
  });

  // Pre-existing behavior (001-registration-kyc) — must not regress on the web variant either.
  it("still renders the error text with accessibilityRole=alert", () => {
    render(
      <WebFormField label="Correo" error="Campo requerido">
        <Text>input</Text>
      </WebFormField>,
    );

    expect(screen.getByRole("alert")).toBeTruthy();
  });

  // T004 (specs/010-registration-redesign, FR-006): same labelCase="sentence" regression as the
  // mobile/default variant above.
  it('renders label.fieldSentence with no textTransform when labelCase="sentence"', () => {
    render(
      <WebFormField label="Nombre completo" labelCase="sentence">
        <Text>input</Text>
      </WebFormField>,
    );

    const label = screen.getByText("Nombre completo");
    const style = StyleSheet.flatten(label.props.style);

    expect(style.textTransform).toBeUndefined();
    expect(style.fontSize).toBe(typography.label.fieldSentence.fontSize);
    expect(style.color).toBe(typography.label.fieldSentence.color);
  });
});
