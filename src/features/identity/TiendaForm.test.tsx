// T016 (specs/010-registration-redesign, FR-003): real rendered-output/behavior tests
// (docs/verification.md Level 2) for the `Tienda` tab's combined form. Covers the exact design
// brief §4 field set, missing-RFC inline validation, a successful submit, and — the
// non-negotiable check this task calls out explicitly — that NO personal-account field
// (nombre/birthDate/nationality/curp) or its label is EVER rendered, not hidden or filtered.
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { TiendaForm } from "./TiendaForm";

function fillValid(getByLabelText: (label: string) => any) {
  fireEvent.changeText(getByLabelText("Nombre comercial"), "Mi Tienda de Cartas");
  fireEvent.changeText(getByLabelText("Correo electrónico"), "tienda@example.com");
  fireEvent.changeText(getByLabelText("Contraseña"), "supersecret1");
  fireEvent.changeText(getByLabelText("Usuario"), "mi_tienda");
  fireEvent.changeText(getByLabelText("RFC"), "MTC900101AAA");
  fireEvent.changeText(getByLabelText("Celular"), "+525512345678");
  fireEvent.changeText(getByLabelText("Domicilio fiscal"), "Calle Falsa 123, CP 00000");
}

function acceptConsents(getByTestId: (id: string) => any) {
  fireEvent.press(getByTestId("tienda-tos-checkbox"));
  fireEvent.press(getByTestId("tienda-privacy-checkbox"));
}

describe("TiendaForm — FR-003", () => {
  // FR-003: exactly the design brief §4 field list — commercialName, email, password, username,
  // rfc, phone, fiscalAddress, consents. No `(PLD)` suffix on the RFC label (Clarification 3).
  it("renders exactly the Tienda tab's own field set (design brief §4)", () => {
    const { getByLabelText, getByText, queryByText } = render(<TiendaForm onSubmit={jest.fn()} />);

    expect(getByLabelText("Nombre comercial")).toBeTruthy();
    expect(getByLabelText("Correo electrónico")).toBeTruthy();
    expect(getByLabelText("Contraseña")).toBeTruthy();
    expect(getByLabelText("Usuario")).toBeTruthy();
    expect(getByLabelText("RFC")).toBeTruthy();
    expect(getByLabelText("Celular")).toBeTruthy();
    expect(getByLabelText("Domicilio fiscal")).toBeTruthy();
    expect(getByText("Acepto los Términos de Uso")).toBeTruthy();
    expect(getByText("Acepto la Política de Privacidad")).toBeTruthy();

    // Clarification 3: ordinary RFC, never the mockup's "(PLD)" marker.
    expect(queryByText("RFC (PLD)")).toBeNull();
  });

  // FR-003 (the non-negotiable check): no personal-account field or its label anywhere in this
  // file's rendered output, not hidden or filtered — asserted negatively, not just positively.
  it("never renders a personal-account field (no nombre, birth date, nationality, or CURP)", () => {
    const { queryByLabelText, queryByText, queryByTestId } = render(<TiendaForm onSubmit={jest.fn()} />);

    expect(queryByLabelText("Nombre(s)")).toBeNull();
    expect(queryByLabelText("Apellido paterno")).toBeNull();
    expect(queryByLabelText("Apellido materno")).toBeNull();
    expect(queryByLabelText("CURP")).toBeNull();
    expect(queryByText("Fecha de nacimiento")).toBeNull();
    expect(queryByText("Nacionalidad")).toBeNull();
    expect(queryByTestId("usuario-birth-date-trigger")).toBeNull();
    expect(queryByTestId("usuario-nationality-trigger")).toBeNull();
  });

  // FR-003 Acceptance Scenario 2: a missing RFC is rejected with a visible, specific inline
  // error identifying RFC as the missing field.
  it("shows a specific inline error when RFC is missing, and does not call onSubmit", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByTestId, getByText, getByRole } = render(<TiendaForm onSubmit={onSubmit} />);

    fireEvent.changeText(getByLabelText("Nombre comercial"), "Mi Tienda de Cartas");
    fireEvent.changeText(getByLabelText("Correo electrónico"), "tienda@example.com");
    fireEvent.changeText(getByLabelText("Contraseña"), "supersecret1");
    fireEvent.changeText(getByLabelText("Usuario"), "mi_tienda");
    fireEvent.changeText(getByLabelText("Celular"), "+525512345678");
    fireEvent.changeText(getByLabelText("Domicilio fiscal"), "Calle Falsa 123, CP 00000");
    acceptConsents(getByTestId);
    // RFC left empty.

    fireEvent.press(getByRole("button", { name: "Registrarse" }));

    await waitFor(() => expect(getByText("RFC is required")).toBeTruthy());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // FR-003: a fully valid submit calls onSubmit with the exact typed, combined payload.
  it("calls onSubmit with the full combined payload on a successful submit", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByTestId, getByRole } = render(<TiendaForm onSubmit={onSubmit} />);

    fillValid(getByLabelText);
    acceptConsents(getByTestId);

    fireEvent.press(getByRole("button", { name: "Registrarse" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        commercialName: "Mi Tienda de Cartas",
        email: "tienda@example.com",
        password: "supersecret1",
        username: "mi_tienda",
        rfc: "MTC900101AAA",
        phone: "+525512345678",
        fiscalAddress: "Calle Falsa 123, CP 00000",
        tosAccepted: true,
        privacyAccepted: true,
      })
    );
  });

  // mapRegistrationError: a server-reported field error renders inline next to the corresponding
  // field — this form is the one CrearCuentaScreen (T017) feeds that error into for the Tienda
  // tab.
  it("renders a server-supplied field error inline next to the corresponding field", async () => {
    const onSubmit = jest.fn();
    const { getByText, rerender } = render(<TiendaForm onSubmit={onSubmit} />);

    rerender(
      <TiendaForm onSubmit={onSubmit} serverError={{ field: "username", message: "That username is already taken" }} />
    );

    await waitFor(() => expect(getByText("That username is already taken")).toBeTruthy());
  });

  // FR-015 (T027): react-native-web only treats Space as a valid Pressable activation key for
  // accessibilityRole="button" (src/features/ui/webKeyActivation.ts's top comment) — role=
  // "checkbox" gets Enter for free but silently drops Space without this fix.
  it("toggles the consent checkboxes on a Space keydown, not just a press (FR-015)", () => {
    const { getByTestId } = render(<TiendaForm onSubmit={jest.fn()} />);

    // getByTestId resolves the rendered host node, on which native react-native's own Pressable
    // (what this Jest environment actually resolves "react-native" to) has already merged the
    // top-level `aria-checked` prop into `accessibilityState.checked` (see SegmentedControl.tsx's
    // top comment) — read that, not a since-consumed `aria-checked` prop.
    expect(getByTestId("tienda-tos-checkbox").props.accessibilityState.checked).toBe(false);
    fireEvent(getByTestId("tienda-tos-checkbox"), "keyDown", { key: " " });
    expect(getByTestId("tienda-tos-checkbox").props.accessibilityState.checked).toBe(true);

    expect(getByTestId("tienda-privacy-checkbox").props.accessibilityState.checked).toBe(false);
    fireEvent(getByTestId("tienda-privacy-checkbox"), "keyDown", { key: " " });
    expect(getByTestId("tienda-privacy-checkbox").props.accessibilityState.checked).toBe(true);
  });
});
