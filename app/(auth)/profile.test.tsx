// Covers FR-004 (profile submission navigates to /tutorial on success), the acceptance-required
// validation (submission blocked without ToS/privacy acceptance — SC-002 inline, never a bare
// failure), the PhoneNotVerified redirect edge case (spec.md Edge Cases: "any direct-navigation
// attempt should redirect back to phone verification rather than surface the backend's
// rejection as a bare form error"), and FR-003 (T026, US2: reading `isBusiness` from the shared
// currentUserQueryKey cache and threading it through to ProfileForm/submitProfile) for
// app/(auth)/profile.tsx (T017/T026). Mirrors register.test.tsx's/verify-phone.test.tsx's
// mocking pattern exactly. Field-level error rendering itself is covered directly by
// src/features/identity/ProfileForm.test.tsx; this file covers the screen's own glue (calls the
// domain function, then navigates/redirects).
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockSubmitProfile = jest.fn();
jest.mock("@/domain/profile", () => {
  const actual = jest.requireActual("@/domain/profile");
  return {
    ...actual,
    submitProfile: (...args: unknown[]) => mockSubmitProfile(...args),
  };
});

// src/lib/api.ts pulls in supabase-client (React Native/Expo modules) purely to configure the
// real client — irrelevant here since submitProfile is mocked above and never actually invokes
// it.
jest.mock("@/lib/api", () => ({ api: {} }));
// @/features/identity/useKycGate (imported below, for currentUserQueryKey — T026) transitively
// imports src/lib/supabase-client.ts, which constructs a real Supabase client at module load
// time — mocked here (same pattern as register.test.tsx/tutorial.test.tsx) so that construction
// never actually happens; this screen never calls any of its methods (it only reads the
// already-mocked currentUserQueryKey constant), so an empty stub is enough.
jest.mock("@/lib/supabase-client", () => ({ supabase: {} }));

// currentUserQueryKey is a plain exported const — importing the real module here (not mocking
// useKycGate.ts itself) mirrors app/(onboarding)/tutorial.test.tsx's own choice, keeping this
// test asserting against the actual shared key useKycGate.ts/register.tsx read/write.
import { currentUserQueryKey } from "@/features/identity/useKycGate";
import ProfileScreen from "./profile";

function fillRequiredFields(getByLabelText: ReturnType<typeof render>["getByLabelText"]) {
  fireEvent.changeText(getByLabelText("Nombre"), "Ana");
  fireEvent.changeText(getByLabelText("Apellido paterno"), "Garcia");
  fireEvent.changeText(getByLabelText("Birth date"), "1990-01-01");
  fireEvent.changeText(getByLabelText("Nationality"), "MX");
  fireEvent.changeText(getByLabelText("CURP"), "GARA900101MDFXXX01");
  fireEvent.changeText(getByLabelText("RFC"), "GARA900101ABC");
}

function renderWithClient(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <ProfileScreen />
    </QueryClientProvider>
  );
}

function newTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } });
}

describe("ProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // FR-004: a fully valid submission (including both acceptances) calls submitProfile with the
  // api client, the typed input, and `{ isBusiness: false }` — no isBusiness cached (the default,
  // safe fallback per this file's top comment) — then navigates to /tutorial.
  it("calls submitProfile and navigates to /tutorial on a successful submit", async () => {
    mockSubmitProfile.mockResolvedValue({
      id: "user-1",
      email: "ana@example.com",
      username: "ana_garcia",
      isBusiness: false,
      kycStatus: "pending",
      hasCompletedTutorial: false,
      isPremium: false,
    });

    const { getByLabelText, getByRole } = renderWithClient(newTestQueryClient());

    fillRequiredFields(getByLabelText);
    fireEvent.press(getByRole("checkbox", { name: "I accept the Terms of Service" }));
    fireEvent.press(getByRole("checkbox", { name: "I accept the Privacy Policy" }));
    fireEvent.press(getByRole("button", { name: "Save profile" }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/tutorial"));
    expect(mockSubmitProfile).toHaveBeenCalledTimes(1);
    expect(mockSubmitProfile.mock.calls[0][0]).toEqual({});
    expect(mockSubmitProfile.mock.calls[0][2]).toEqual({ isBusiness: false });
  });

  // T026 (US2, FR-003): when currentUserQueryKey's cache already has `isBusiness: true`
  // (written by app/(auth)/register.tsx, T025, right after a successful business registration),
  // this screen renders ProfileForm's business fields and submits with `{ isBusiness: true }`.
  it("renders the business fields and submits with isBusiness: true when cached as a business account", async () => {
    mockSubmitProfile.mockResolvedValue({
      id: "user-1",
      email: "tienda@example.com",
      username: "tienda_ana",
      isBusiness: true,
      kycStatus: "pending",
      hasCompletedTutorial: false,
      isPremium: false,
    });
    const client = newTestQueryClient();
    client.setQueryData(currentUserQueryKey, { isBusiness: true });

    const { getByLabelText, getByRole } = renderWithClient(client);

    fillRequiredFields(getByLabelText);
    fireEvent.changeText(getByLabelText("Commercial name"), "Tienda Ana");
    fireEvent.changeText(getByLabelText("Fiscal address"), "Calle Falsa 123, CDMX");
    fireEvent.press(getByRole("checkbox", { name: "I accept the Terms of Service" }));
    fireEvent.press(getByRole("checkbox", { name: "I accept the Privacy Policy" }));
    fireEvent.press(getByRole("button", { name: "Save profile" }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/tutorial"));
    expect(mockSubmitProfile.mock.calls[0][2]).toEqual({ isBusiness: true });
    expect(mockSubmitProfile.mock.calls[0][1]).toMatchObject({
      commercialName: "Tienda Ana",
      fiscalAddress: "Calle Falsa 123, CDMX",
    });
  });

  // SC-002, FR-004: submitting without checking the ToS/privacy checkboxes never reaches
  // submitProfile or navigates — the form's own inline validation blocks it (asserted more fully
  // in ProfileForm.test.tsx; this test confirms the screen doesn't route around that gate).
  it("does not call submitProfile or navigate when ToS/privacy acceptance is missing", async () => {
    const { getByLabelText, getByRole, getByTestId } = renderWithClient(newTestQueryClient());

    fillRequiredFields(getByLabelText);
    // Acceptance checkboxes intentionally left unchecked.
    fireEvent.press(getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(getByTestId("profile-tos-error")).toBeTruthy();
      expect(getByTestId("profile-privacy-error")).toBeTruthy();
    });
    expect(mockSubmitProfile).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // FR-002, FR-004 (spec.md Edge Cases): a PhoneNotVerified rejection (e.g. stale client state or
  // direct navigation to /profile before the phone is verified) redirects to /verify-phone
  // instead of being rendered as a bare form error.
  it("redirects to /verify-phone on a PhoneNotVerified rejection instead of showing a form error", async () => {
    const { ApiError } = jest.requireActual("@/domain/api-client");
    mockSubmitProfile.mockRejectedValue(
      new ApiError(403, "PhoneNotVerified", "Verify your phone before submitting profile information")
    );

    const { getByLabelText, getByRole, queryByText } = renderWithClient(newTestQueryClient());

    fillRequiredFields(getByLabelText);
    fireEvent.press(getByRole("checkbox", { name: "I accept the Terms of Service" }));
    fireEvent.press(getByRole("checkbox", { name: "I accept the Privacy Policy" }));
    fireEvent.press(getByRole("button", { name: "Save profile" }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/verify-phone"));
    expect(queryByText("Verify your phone before submitting profile information")).toBeNull();
  });
});
