// T015 (specs/010-registration-redesign): real rendered-output/behavior tests
// (docs/verification.md Level 2) for the `Usuario` tab's combined form. Covers FR-002 (every
// field in the design brief §3 order, validated as one usuarioCrearCuentaSchema unit), FR-013
// (birth date via DateField), FR-017/SC-002 (every required field's SPECIFIC inline error, never
// a raw framework default), and the design brief's Clarification 1/2 (a Contraseña field with no
// confirm-password input; CURP and RFC as two separate inputs).
//
// Driving DateField's native picker mirrors DateField.test.tsx's own established technique
// exactly (UNSAFE_getByType(DateTimePicker), a synthetic onChange call with a "set" event) —
// this is the vendor's own public DateTimePickerEvent contract, not an internal implementation
// detail. Driving Select mirrors Select.test.tsx's own technique (press the trigger, press an
// option by testID).
import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { UsuarioForm } from "./UsuarioForm";

const NATIONALITY_OPTIONS = [
  { value: "mx", label: "Mexicana" },
  { value: "us", label: "Estadounidense" },
];

function fillTextFields(getByLabelText: (label: string) => any) {
  fireEvent.changeText(getByLabelText("Nombre(s)"), "Juan");
  fireEvent.changeText(getByLabelText("Apellido paterno"), "Garcia");
  fireEvent.changeText(getByLabelText("Correo electrónico"), "juan@example.com");
  fireEvent.changeText(getByLabelText("Contraseña"), "supersecret1");
  fireEvent.changeText(getByLabelText("Usuario"), "juan_garcia");
  fireEvent.changeText(getByLabelText("Celular"), "+525512345678");
  fireEvent.changeText(getByLabelText("CURP"), "GARL900101HDFRCN04");
  fireEvent.changeText(getByLabelText("RFC"), "GARL900101AB1");
}

// T029 fix (DateField.tsx's Modal-sheet+confirm interaction — see that file's top comment):
// picking a date no longer auto-commits/closes on the first "set" event (spinner mode fires that
// continuously); the sheet's own "confirm" control is what actually commits it now.
function setBirthDate(getByTestId: (id: string) => any, UNSAFE_getByType: (type: any) => any) {
  fireEvent.press(getByTestId("usuario-birth-date-trigger"));
  const selected = new Date(1990, 0, 1);
  const picker = UNSAFE_getByType(DateTimePicker);
  act(() => {
    picker.props.onChange(
      { type: "set", nativeEvent: { timestamp: selected.getTime(), utcOffset: 0 } },
      selected
    );
  });
  fireEvent.press(getByTestId("usuario-birth-date-confirm"));
}

function selectNationality(getByTestId: (id: string) => any) {
  fireEvent.press(getByTestId("usuario-nationality-trigger"));
  fireEvent.press(getByTestId("usuario-nationality-option-mx"));
}

function acceptConsents(getByTestId: (id: string) => any) {
  fireEvent.press(getByTestId("usuario-tos-checkbox"));
  fireEvent.press(getByTestId("usuario-privacy-checkbox"));
}

describe("UsuarioForm — FR-002, FR-013, FR-014, FR-017", () => {
  // FR-017, SC-002: every required field's own specific message, never a raw Zod default —
  // mirrors RegistrationForm.test.tsx's identical regression bar (001-registration-kyc T032).
  it("shows every required field's specific inline error and does not call onSubmit on an empty submit", async () => {
    const onSubmit = jest.fn();
    const { getByText, getByRole } = render(
      <UsuarioForm onSubmit={onSubmit} nationalityOptions={NATIONALITY_OPTIONS} />
    );

    fireEvent.press(getByRole("button", { name: "Registrarse" }));

    await waitFor(() => {
      expect(getByText("Nombre is required")).toBeTruthy();
      expect(getByText("Apellido paterno is required")).toBeTruthy();
      expect(getByText("Enter a valid email address")).toBeTruthy();
      expect(getByText("Password must be at least 8 characters")).toBeTruthy();
      expect(getByText("Username is required")).toBeTruthy();
      expect(getByText("Enter a valid birth date (YYYY-MM-DD)")).toBeTruthy();
      expect(getByText("Enter a valid phone number")).toBeTruthy();
      expect(getByText("Nationality is required")).toBeTruthy();
      expect(getByText("CURP is required")).toBeTruthy();
      expect(getByText("RFC is required")).toBeTruthy();
      expect(getByText("You must accept the Terms of Service")).toBeTruthy();
      expect(getByText("You must accept the Privacy Policy")).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // FR-002: apellidoMaterno is genuinely optional (mirrors the backend's own apellidoMaterno
  // column and profileFormSchema's optionalNonEmptyString handling) — a submit with it left
  // blank succeeds, and the resolved payload carries `undefined`, not an empty string that would
  // reach the network as a real (wrong) value.
  it("submits successfully with apellidoMaterno left blank (genuine optionality)", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByTestId, UNSAFE_getByType, getByRole } = render(
      <UsuarioForm onSubmit={onSubmit} nationalityOptions={NATIONALITY_OPTIONS} />
    );

    fillTextFields(getByLabelText);
    setBirthDate(getByTestId, UNSAFE_getByType);
    selectNationality(getByTestId);
    acceptConsents(getByTestId);

    fireEvent.press(getByRole("button", { name: "Registrarse" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.apellidoMaterno).toBeUndefined();
    expect(submitted.nombre).toBe("Juan");
  });

  // FR-002: a fully valid submit calls onSubmit with the exact typed, combined payload — no
  // transformation happens in the component (Constitution IV).
  it("calls onSubmit with the full combined payload on a successful submit", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByTestId, UNSAFE_getByType, getByRole } = render(
      <UsuarioForm onSubmit={onSubmit} nationalityOptions={NATIONALITY_OPTIONS} />
    );

    fillTextFields(getByLabelText);
    fireEvent.changeText(getByLabelText("Apellido materno"), "Lopez");
    setBirthDate(getByTestId, UNSAFE_getByType);
    selectNationality(getByTestId);
    acceptConsents(getByTestId);

    fireEvent.press(getByRole("button", { name: "Registrarse" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        nombre: "Juan",
        apellidoPaterno: "Garcia",
        apellidoMaterno: "Lopez",
        email: "juan@example.com",
        password: "supersecret1",
        username: "juan_garcia",
        birthDate: new Date(1990, 0, 1),
        phone: "+525512345678",
        nationality: "mx",
        curp: "GARL900101HDFRCN04",
        rfc: "GARL900101AB1",
        tosAccepted: true,
        privacyAccepted: true,
      })
    );
  });

  // FR-005/mapRegistrationError: a server-reported field error (e.g. "UsernameTaken") renders
  // inline next to the corresponding field, mirroring RegistrationForm.tsx's identical pattern —
  // this form is the one CrearCuentaScreen (T017) feeds that error into for the Usuario tab.
  it("renders a server-supplied field error inline next to the corresponding field", async () => {
    const onSubmit = jest.fn();
    const { getByText, rerender } = render(
      <UsuarioForm onSubmit={onSubmit} nationalityOptions={NATIONALITY_OPTIONS} />
    );

    rerender(
      <UsuarioForm
        onSubmit={onSubmit}
        nationalityOptions={NATIONALITY_OPTIONS}
        serverError={{ field: "username", message: "That username is already taken" }}
      />
    );

    await waitFor(() => expect(getByText("That username is already taken")).toBeTruthy());
  });

  // Review-note regression guard (T015): a schema validation error on Nationality must NOT be
  // fed into Select's own `error` prop (which also disables its trigger) — that would lock the
  // user out of ever opening the picker to fix it. It renders through a separate inline Text
  // instead, and the picker stays fully operable.
  it("keeps the Nacionalidad picker operable when only a validation error (not a catalog error) is present", async () => {
    const onSubmit = jest.fn();
    const { getByRole, getByTestId, getByText } = render(
      <UsuarioForm onSubmit={onSubmit} nationalityOptions={NATIONALITY_OPTIONS} />
    );

    fireEvent.press(getByRole("button", { name: "Registrarse" }));
    await waitFor(() => expect(getByText("Nationality is required")).toBeTruthy());

    expect(getByTestId("usuario-nationality-trigger").props.accessibilityState.disabled).toBe(false);
    fireEvent.press(getByTestId("usuario-nationality-trigger"));
    expect(getByTestId("usuario-nationality-option-mx")).toBeTruthy();
  });

  // FR-012, Edge Cases (spec.md): a genuine catalog-loading error DOES disable the trigger (there
  // is nothing to pick from) and surfaces a retry action — the caller-supplied
  // nationalityError/onRetryNationality props (T020's future wiring seam) reach Select unchanged.
  it("disables the Nacionalidad trigger and offers retry when a catalog error is supplied", async () => {
    const onRetryNationality = jest.fn();
    const { getByRole, getByTestId, getByText, queryByText } = render(
      <UsuarioForm
        onSubmit={jest.fn()}
        nationalityOptions={[]}
        nationalityError="No se pudo cargar el catálogo"
        onRetryNationality={onRetryNationality}
      />
    );

    expect(getByTestId("usuario-nationality-trigger").props.accessibilityState.disabled).toBe(true);

    // Attempting a submit also leaves errors.nationality populated — the catalog error must win
    // that one rendering slot, not double up with the manual validation-error Text.
    fireEvent.press(getByRole("button", { name: "Registrarse" }));
    await waitFor(() => expect(getByText("No se pudo cargar el catálogo")).toBeTruthy());
    expect(queryByText("Nationality is required")).toBeNull();

    fireEvent.press(getByTestId("usuario-nationality-retry"));
    expect(onRetryNationality).toHaveBeenCalledTimes(1);
  });

  // T020 (FR-012, spec.md Edge Cases): the catalog-loading state (reachable today since backend
  // 015 hasn't shipped, per T020's own brief) disables the trigger and shows the caller-supplied
  // loading copy — the same real, wired-through state Select.tsx/Select.web.tsx already render,
  // now proven reachable through UsuarioForm's own props, not just Select's own isolated tests.
  it("disables the Nacionalidad trigger and shows the loading state while the catalog is loading", () => {
    const { getByTestId } = render(
      <UsuarioForm onSubmit={jest.fn()} nationalityOptions={[]} nationalityLoading />
    );

    expect(getByTestId("usuario-nationality-trigger").props.accessibilityState.disabled).toBe(true);
    expect(getByTestId("usuario-nationality-trigger").props.accessibilityState.busy).toBe(true);
    // "Cargando…" is UsuarioForm's own hardcoded loadingLabel override (t("selectLoadingLabel"),
    // registrationCopy's Spanish default) reaching Select's rendered ActivityIndicator for real,
    // not the primitive's own English "Loading…" default.
    expect(getByTestId("usuario-nationality-loading").props.accessibilityLabel).toBe("Cargando…");
  });

  // FR-015 (T027): react-native-web only treats Space as a valid Pressable activation key for
  // accessibilityRole="button" (src/features/ui/webKeyActivation.ts's top comment) — role=
  // "checkbox" gets Enter for free but silently drops Space without this fix.
  it("toggles the consent checkboxes on a Space keydown, not just a press (FR-015)", () => {
    const { getByTestId } = render(
      <UsuarioForm onSubmit={jest.fn()} nationalityOptions={NATIONALITY_OPTIONS} />
    );

    // getByTestId resolves the rendered host node, on which native react-native's own Pressable
    // (what this Jest environment actually resolves "react-native" to) has already merged the
    // top-level `aria-checked` prop into `accessibilityState.checked` (see SegmentedControl.tsx's
    // top comment) — read that, not a since-consumed `aria-checked` prop.
    expect(getByTestId("usuario-tos-checkbox").props.accessibilityState.checked).toBe(false);
    fireEvent(getByTestId("usuario-tos-checkbox"), "keyDown", { key: " " });
    expect(getByTestId("usuario-tos-checkbox").props.accessibilityState.checked).toBe(true);

    expect(getByTestId("usuario-privacy-checkbox").props.accessibilityState.checked).toBe(false);
    fireEvent(getByTestId("usuario-privacy-checkbox"), "keyDown", { key: " " });
    expect(getByTestId("usuario-privacy-checkbox").props.accessibilityState.checked).toBe(true);
  });
});
