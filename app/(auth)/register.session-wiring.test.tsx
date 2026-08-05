// T033 (found by code-reviewer's second review of 001-registration-kyc, Finding 1 BLOCKING):
// unlike every other test for this screen (register.test.tsx), this file does NOT mock
// @/domain/registration or @/lib/api — it renders the real RegisterScreen wired to the real
// submitPersonalRegistration (src/domain/registration.ts) and the real `api` singleton
// (src/lib/api.ts), stubbing only the true I/O boundary: global fetch and
// @/lib/supabase-client (the Supabase SDK adapter). This is the exact class of test the review
// found missing across the whole feature — every existing test mocks either the ApiClient or the
// domain module, which is why neither this defect nor the structurally identical T031 defect was
// caught. This test WOULD FAIL if app/(auth)/register.tsx stopped calling
// setCurrentUserId(user.id) after a successful registration: the second `api()` call below
// (standing in for the very next authenticated request the app makes — verify-phone.tsx's
// verifyPhoneCode, profile.tsx's submitProfile, or useKycGate.ts's fetchCurrentUser, all of which
// go through this same singleton) would then omit the X-User-Id header the backend's
// requireUserId() requires, exactly reproducing the real 401 this review found. Feeds FR-001
// (registration), FR-002/FR-004/FR-009/FR-010 (every downstream call this header authenticates).
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
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
    const { getByLabelText, getByRole } = render(
      <QueryClientProvider client={client}>
        <RegisterScreen />
      </QueryClientProvider>
    );

    fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
    fireEvent.changeText(getByLabelText("Password"), "supersecret1");
    fireEvent.changeText(getByLabelText("Phone"), "+525512345678");
    fireEvent.changeText(getByLabelText("Username"), "ana_garcia");
    fireEvent.press(getByRole("button", { name: "Create account" }));

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
