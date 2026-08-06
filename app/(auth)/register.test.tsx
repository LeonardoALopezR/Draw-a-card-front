// 010-registration-redesign T018 (FR-001, FR-008): register.tsx is now thin glue only — it
// renders CrearCuentaScreen (src/features/identity/CrearCuentaScreen.tsx) with no props/local
// state of its own, so this file's remaining job is a real regression guard that the route
// actually wires that screen (and, through it, useCrearCuentaSubmit.ts's registration/session
// orchestration) correctly, not a re-test of CrearCuentaScreen's own already-covered behavior
// (CrearCuentaScreen.test.tsx, T017, owns tab-switching/field-set/draft-content coverage in
// depth). Mirrors CrearCuentaScreen.test.tsx's own mocking pattern exactly.
//
// Deliberately exercises the Tienda tab, not the Usuario tab (default-selected tab) — the SAME
// reason CrearCuentaScreen.test.tsx's own top comment already documents: this route doesn't wire
// useNationalities() (T020, out of this batch), so production renders the Usuario tab's
// Nacionalidad picker with an empty options array, making a full Usuario-tab submit
// unreachable at this composed-screen level. The Tienda tab needs no catalog at all and exercises
// the exact same shared useCrearCuentaSubmit.ts orchestration a Usuario submission would (the
// registration-call/setCurrentUserId/draft-write/sessionIssue mechanism does not branch on which
// tab produced it).
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// T029 fix (FR-016, safe-area insets): CrearCuentaScreen (rendered by this route) now calls
// useSafeAreaInsets() — mirrors CrearCuentaScreen.test.tsx's own identical mocking approach,
// since this repo's jest config doesn't auto-wire react-native-safe-area-context's own
// jest/mock.tsx, and the real hook throws with no <SafeAreaProvider> in the tree.
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockSubmitPersonalRegistration = jest.fn();
const mockSubmitBusinessRegistration = jest.fn();
const mockRetrySignIn = jest.fn();
jest.mock("@/domain/registration", () => {
  const actual = jest.requireActual("@/domain/registration");
  return {
    ...actual,
    submitPersonalRegistration: (...args: unknown[]) => mockSubmitPersonalRegistration(...args),
    submitBusinessRegistration: (...args: unknown[]) => mockSubmitBusinessRegistration(...args),
    retrySignIn: (...args: unknown[]) => mockRetrySignIn(...args),
  };
});

// src/lib/api.ts pulls in supabase-client (React Native/Expo modules) purely to configure the
// real client — irrelevant here since submitPersonalRegistration/submitBusinessRegistration are
// mocked above and never actually invoke it. setCurrentUserId is mocked too (this route, via
// useCrearCuentaSubmit, calls it directly) — its real behavior is exercised for real, unmocked,
// in register.session-wiring.test.tsx and src/lib/api.test.ts.
const mockSetCurrentUserId = jest.fn();
jest.mock("@/lib/api", () => ({ api: {}, setCurrentUserId: (...args: unknown[]) => mockSetCurrentUserId(...args) }));
// src/lib/supabase-client.ts's signInWithPassword is the real implementation this route wires
// into submitPersonalRegistration/submitBusinessRegistration/retrySignIn — mocked here to a
// stable identity so the tests below can assert *that it was passed through*, not what it does
// (that's src/domain/registration.test.ts's job).
jest.mock("@/lib/supabase-client", () => ({ signInWithPassword: "SIGN_IN_WITH_PASSWORD_FN" }));

import { currentUserQueryKey } from "@/features/identity/useKycGate";
import RegisterScreen from "./register";

const businessUserFixture = {
  id: "user-1",
  email: "tienda@example.com",
  username: "mi_tienda",
  isBusiness: true,
  kycStatus: "pending",
  hasCompletedTutorial: false,
  isPremium: false,
};

function fillTienda(getByLabelText: any, getByTestId: any) {
  fireEvent.press(getByTestId("crear-cuenta-tabs-option-tienda"));
  fireEvent.changeText(getByLabelText("Nombre comercial"), "Mi Tienda de Cartas");
  fireEvent.changeText(getByLabelText("Correo electrónico"), "tienda@example.com");
  fireEvent.changeText(getByLabelText("Contraseña"), "supersecret1");
  fireEvent.changeText(getByTestId("tienda-username-input"), "mi_tienda");
  fireEvent.changeText(getByLabelText("RFC"), "MTC900101AAA");
  fireEvent.changeText(getByLabelText("Celular"), "+525512345678");
  fireEvent.changeText(getByLabelText("Domicilio fiscal"), "Calle Falsa 123, CP 00000");
  fireEvent.press(getByTestId("tienda-tos-checkbox"));
  fireEvent.press(getByTestId("tienda-privacy-checkbox"));
}

function renderWithClient(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <RegisterScreen />
    </QueryClientProvider>
  );
}

function newTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } });
}

describe("RegisterScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // FR-001, FR-008: a successful submit calls the real registration domain function with only
  // the four credential fields, and navigates to /verify-phone.
  it("submits with the four credential fields and navigates to verify-phone when session establishment succeeds", async () => {
    mockSubmitBusinessRegistration.mockResolvedValue({ user: businessUserFixture, sessionError: null });

    const { getByLabelText, getByTestId } = renderWithClient(newTestQueryClient());
    fillTienda(getByLabelText, getByTestId);
    fireEvent.press(getByTestId("tienda-submit-button"));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/verify-phone"));
    expect(mockSubmitBusinessRegistration).toHaveBeenCalledWith(
      {},
      "SIGN_IN_WITH_PASSWORD_FN",
      {
        email: "tienda@example.com",
        password: "supersecret1",
        phone: "+525512345678",
        username: "mi_tienda",
      }
    );
    // T033 (001-registration-kyc), carried forward: the backend User.id is genuinely confirmed
    // the moment this call resolves.
    expect(mockSetCurrentUserId).toHaveBeenCalledWith(businessUserFixture.id);
  });

  // T026 (001-registration-kyc), carried forward: the returned isBusiness flag is cached under
  // the shared currentUserQueryKey.
  it("caches the returned isBusiness flag under currentUserQueryKey on a successful submit", async () => {
    mockSubmitBusinessRegistration.mockResolvedValue({ user: businessUserFixture, sessionError: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

    const { getByLabelText, getByTestId } = renderWithClient(client);
    fillTienda(getByLabelText, getByTestId);
    fireEvent.press(getByTestId("tienda-submit-button"));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/verify-phone"));
    expect(client.getQueryData(currentUserQueryKey)).toMatchObject({ isBusiness: true });
  });

  // T031 (001-registration-kyc), carried forward: the honest-failure-mode UX — registration
  // succeeds but the injected signIn fails (e.g. email confirmation required). The screen must
  // NOT navigate on as if a session exists; it must show an explicit, actionable message instead
  // of a silent dead end.
  it("shows an actionable session-issue message and does not navigate when registration succeeds but sign-in fails", async () => {
    mockSubmitBusinessRegistration.mockResolvedValue({
      user: businessUserFixture,
      sessionError: "Email not confirmed",
    });

    const { getByLabelText, getByTestId, findByText, findByRole } = renderWithClient(newTestQueryClient());
    fillTienda(getByLabelText, getByTestId);
    fireEvent.press(getByTestId("tienda-submit-button"));

    await findByText("Tu cuenta fue creada");
    expect(await findByText(/Email not confirmed/)).toBeTruthy();
    expect(await findByRole("button", { name: "Reintentar inicio de sesión" })).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
    // The account was already created either way — setCurrentUserId is set before the
    // sessionError branch, same precedent as 001-registration-kyc's original register.tsx.
    expect(mockSetCurrentUserId).toHaveBeenCalledWith(businessUserFixture.id);
  });

  // T031 (001-registration-kyc), carried forward: the retry action calls retrySignIn (not
  // submitBusinessRegistration again — the account already exists) with the originally-submitted
  // credentials, and navigates on success.
  it("retries only the sign-in primitive on Retry, and navigates once it succeeds", async () => {
    mockSubmitBusinessRegistration.mockResolvedValue({
      user: businessUserFixture,
      sessionError: "Email not confirmed",
    });
    mockRetrySignIn.mockResolvedValue({ error: null });

    const { getByLabelText, getByTestId, findByRole } = renderWithClient(newTestQueryClient());
    fillTienda(getByLabelText, getByTestId);
    fireEvent.press(getByTestId("tienda-submit-button"));

    const retryButton = await findByRole("button", { name: "Reintentar inicio de sesión" });
    fireEvent.press(retryButton);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/verify-phone"));
    expect(mockRetrySignIn).toHaveBeenCalledWith(
      "SIGN_IN_WITH_PASSWORD_FN",
      "tienda@example.com",
      "supersecret1"
    );
    expect(mockSubmitBusinessRegistration).toHaveBeenCalledTimes(1);
    expect(mockSetCurrentUserId).toHaveBeenCalledTimes(1);
  });
});
