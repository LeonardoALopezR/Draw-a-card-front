// T034 (2026-08-04, found by manual iOS-simulator testing against a live local backend,
// orchestrator-verified): this is the regression test that would actually have caught the
// original defect. Every other test of this screen mocks the sign-in boundary at a level that
// already assumes the resolve-with-error shape — register.test.tsx mocks '@/domain/registration'
// and '@/lib/supabase-client' wholesale (signInWithPassword is a plain identity-preserving
// string, never invoked); register.session-wiring.test.tsx mocks '@/lib/supabase-client' itself,
// with `signInWithPassword` a jest.fn() that only ever resolves. Neither exercises the real
// src/lib/supabase-client.ts code, so neither could have caught a rejection escaping it.
//
// This file mocks only the TRUE I/O boundary underneath everything — global fetch (the backend)
// and @supabase/supabase-js's own createClient() — so app/(auth)/register.tsx,
// src/domain/registration.ts, and src/lib/supabase-client.ts all run for real. The mocked SDK's
// auth.signInWithPassword REJECTS (a network-level failure — unreachable host, DNS failure,
// offline, timeout), not merely resolves with an { error } field, reproducing exactly the
// verified iOS-simulator failure (EXPO_PUBLIC_SUPABASE_URL unset -> unreachable
// https://placeholder.supabase.co).
//
// Confirmed to FAIL before the fix: with src/lib/supabase-client.ts's try/catch removed, the
// rejection escapes signInWithPassword and is caught by this screen's *registration* try/catch
// instead of being surfaced as a sessionError — "registration-session-issue" never renders and
// "registration-form-error" renders instead, which is precisely the bug this task reports (a
// successful registration misrepresented as a failed one, driving the user toward a 409
// EmailTaken retry lockout). Feeds FR-001 (account creation) and FR-006 (session establishment).
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
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
    email: "ana@example.com",
    username: "ana_garcia",
    phone: "+525512345678",
    isBusiness: false,
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
    const { getByLabelText, getByRole, findByTestId, queryByTestId } = render(
      <QueryClientProvider client={client}>
        <RegisterScreen />
      </QueryClientProvider>
    );

    fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
    fireEvent.changeText(getByLabelText("Password"), "supersecret1");
    fireEvent.changeText(getByLabelText("Phone"), "+525512345678");
    fireEvent.changeText(getByLabelText("Username"), "ana_garcia");
    fireEvent.press(getByRole("button", { name: "Create account" }));

    expect(await findByTestId("registration-session-issue")).toBeTruthy();
    expect(queryByTestId("registration-form-error")).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
