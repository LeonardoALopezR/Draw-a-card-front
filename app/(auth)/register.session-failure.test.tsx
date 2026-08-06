// T034 (2026-08-04, found by manual iOS-simulator testing against a live local backend,
// orchestrator-verified), updated for 010-registration-redesign T018: this is the regression test
// that would actually have caught the original defect. Every other test of this screen mocks the
// sign-in boundary at a level that already assumes the resolve-with-error shape —
// register.test.tsx mocks '@/domain/registration' and '@/lib/supabase-client' wholesale
// (signInWithPassword is a plain identity-preserving string, never invoked);
// register.session-wiring.test.tsx mocks '@/lib/supabase-client' itself, with
// `signInWithPassword` a jest.fn() that only ever resolves. Neither exercises the real
// src/lib/supabase-client.ts code, so neither could have caught a rejection escaping it.
//
// This file mocks only the TRUE I/O boundary underneath everything — global fetch (the backend)
// and @supabase/supabase-js's own createClient() — so app/(auth)/register.tsx (now thin glue over
// CrearCuentaScreen, T018), src/features/identity/useCrearCuentaSubmit.ts,
// src/domain/registration.ts, and src/lib/supabase-client.ts all run for real. The mocked SDK's
// auth.signInWithPassword REJECTS (a network-level failure — unreachable host, DNS failure,
// offline, timeout), not merely resolves with an { error } field, reproducing exactly the
// verified iOS-simulator failure (EXPO_PUBLIC_SUPABASE_URL unset -> unreachable
// https://placeholder.supabase.co).
//
// Exercises the Tienda tab, not Usuario — see register.test.tsx's top comment for why (no
// nationality catalog wired at this composed-screen level, T020, out of this batch); this test's
// own point (the session-issue UX, not the generic registration-error path) does not depend on
// which tab produced the registration call.
//
// Confirmed to FAIL before the original fix: with src/lib/supabase-client.ts's try/catch removed,
// the rejection escapes signInWithPassword and is caught by this screen's *registration*
// try/catch instead of being surfaced as a sessionError — "crear-cuenta-session-issue" never
// renders and the form's own general-error slot renders instead, which is precisely the bug this
// task reports (a successful registration misrepresented as a failed one, driving the user toward
// a 409 EmailTaken/RfcConflict retry lockout). Feeds FR-001 (account creation) and FR-006
// (session establishment).
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
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

const mockSdkSignInWithPassword = jest.fn();
const mockSdkGetSession = jest.fn();
jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSdkSignInWithPassword(...args),
      getSession: (...args: unknown[]) => mockSdkGetSession(...args),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
  }),
}));

import RegisterScreen from "./register";

function backendUserFixture() {
  return {
    id: "backend-user-abc123",
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

describe("RegisterScreen -> real signInWithPassword rejection (T034 regression guard)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSdkGetSession.mockResolvedValue({ data: { session: null } });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("lands on the session-issue screen, not the generic registration-error path, when the underlying sign-in call rejects at the network level (FR-001, FR-006)", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: backendUserFixture() }),
    }) as unknown as typeof fetch;
    mockSdkSignInWithPassword.mockRejectedValue(new TypeError("Network request failed"));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const { getByLabelText, getByTestId, findByTestId, queryByTestId } = render(
      <QueryClientProvider client={client}>
        <RegisterScreen />
      </QueryClientProvider>
    );

    fillTienda(getByLabelText, getByTestId);
    fireEvent.press(getByTestId("tienda-submit-button"));

    expect(await findByTestId("crear-cuenta-session-issue")).toBeTruthy();
    expect(queryByTestId("tienda-form-error")).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
