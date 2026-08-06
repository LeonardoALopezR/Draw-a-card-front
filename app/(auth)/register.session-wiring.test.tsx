// T033 (found by code-reviewer's second review of 001-registration-kyc, Finding 1 BLOCKING),
// updated for 010-registration-redesign T018: unlike register.test.tsx, this file does NOT mock
// @/domain/registration or @/lib/api — it renders the real RegisterScreen (now CrearCuentaScreen,
// via register.tsx's T018 rewrite), wired to the real submitBusinessRegistration
// (src/domain/registration.ts) and the real `api` singleton (src/lib/api.ts), stubbing only the
// true I/O boundary: global fetch and @/lib/supabase-client (the Supabase SDK adapter). This is
// the exact class of test the review found missing across the whole feature — every mock-based
// test mocks either the ApiClient or the domain module, which is why neither this defect nor the
// structurally identical T031 defect was caught. This test WOULD FAIL if useCrearCuentaSubmit.ts
// stopped calling setCurrentUserId(user.id) after a successful registration: the second `api()`
// call below (standing in for the very next authenticated request the app makes —
// verify-phone.tsx's verifyPhoneCode, profile.tsx's submitProfile, or useKycGate.ts's
// fetchCurrentUser, all of which go through this same singleton) would then omit the X-User-Id
// header the backend's requireUserId() requires, exactly reproducing the real 401 this review
// found. Feeds FR-001 (registration), FR-002/FR-004/FR-009/FR-010 (every downstream call this
// header authenticates).
//
// Exercises the Tienda tab, not Usuario — see register.test.tsx's top comment for why (no
// nationality catalog wired at this composed-screen level, T020, out of this batch); this
// test's own point (the setCurrentUserId/X-User-Id wiring) is identical regardless of which tab
// produced the registration call, since completeRegistration() in useCrearCuentaSubmit.ts does
// not branch on account type for that part of the flow.
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// T029 fix (FR-016, safe-area insets) — see register.test.tsx's identical mock for the full
// rationale (CrearCuentaScreen now calls useSafeAreaInsets(), which throws with no
// <SafeAreaProvider> in the tree).
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockSignInWithPassword = jest.fn();
jest.mock("@/lib/supabase-client", () => ({
  supabase: {
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) },
  },
  signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
}));

import { api, setCurrentUserId } from "@/lib/api";
import RegisterScreen from "./register";

const BACKEND_USER_ID = "backend-user-abc123";

function backendUserFixture() {
  return {
    id: BACKEND_USER_ID,
    email: "tienda@example.com",
    username: "mi_tienda",
    phone: "+525512345678",
    isBusiness: true,
    kycStatus: "pending",
    phoneVerifiedAt: null,
    nombre: null,
    apellidoPaterno: null,
    apellidoMaterno: null,
    birthDate: null,
    nationality: null,
    curp: null,
    rfc: null,
    tosAcceptedAt: null,
    privacyAcceptedAt: null,
    createdAt: "2026-08-04T00:00:00.000Z",
  };
}

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

describe("RegisterScreen -> src/lib/api.ts real integration (T033 regression guard)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInWithPassword.mockResolvedValue({ error: null });
    setCurrentUserId(undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    setCurrentUserId(undefined);
  });

  it("attaches the real X-User-Id header, carrying the backend User.id, on the next authenticated request after a successful registration", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: backendUserFixture() }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const { getByLabelText, getByTestId } = render(
      <QueryClientProvider client={client}>
        <RegisterScreen />
      </QueryClientProvider>
    );

    fillTienda(getByLabelText, getByTestId);
    fireEvent.press(getByTestId("tienda-submit-button"));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/verify-phone"));

    // Simulate the very next authenticated call verify-phone.tsx would make
    // (verifyPhoneCode -> POST /identity/phone/verify) through the SAME `api` singleton
    // register.tsx just used — this is the real header-building path, not a mock of it.
    mockFetch.mockClear();
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ phoneVerifiedAt: null }) });
    await api("/identity/phone/verify", {
      method: "POST",
      body: JSON.stringify({ code: "12345" }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/identity/phone/verify"),
      expect.objectContaining({
        headers: expect.objectContaining({ "X-User-Id": BACKEND_USER_ID }),
      })
    );
  });
});
