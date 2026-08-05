// Covers FR-001 (email+password+phone+username registration), FR-002 (successful registration
// proceeds to phone verification), FR-003 (T025, US2: business registration calls the business
// endpoint), and FR-006 (T031: session establishment after registration) for
// app/(auth)/register.tsx (T012/T025/T031) — the happy-path submit -> navigate-to-verify-phone
// wiring, the registration-succeeded-but-sign-in-failed honest-failure UX, and the account-type
// branch. Field-level error mapping itself is covered directly by
// src/domain/registration.test.ts's mapRegistrationError suite and
// src/features/identity/RegistrationForm.test.tsx's server-error rendering test; this file only
// asserts the screen's own glue (calls the right domain function, then navigates or shows the
// session-issue retry UI).
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
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
// mocked above and never actually invoke it. T033: setCurrentUserId is mocked too (this screen
// now calls it directly — see register.tsx's own doc comment) — its real behavior is exercised
// for real, unmocked, in register.session-wiring.test.tsx and src/lib/api.test.ts.
const mockSetCurrentUserId = jest.fn();
jest.mock("@/lib/api", () => ({ api: {}, setCurrentUserId: (...args: unknown[]) => mockSetCurrentUserId(...args) }));
// src/lib/supabase-client.ts's signInWithPassword is the real implementation this screen wires
// into submitPersonalRegistration/submitBusinessRegistration/retrySignIn (T031) — mocked here to
// a stable identity so the tests below can assert *that it was passed through*, not what it does
// (that's src/domain/registration.test.ts's job).
jest.mock("@/lib/supabase-client", () => ({ signInWithPassword: "SIGN_IN_WITH_PASSWORD_FN" }));

// currentUserQueryKey is a plain exported const, mirroring app/(onboarding)/tutorial.test.tsx's
// own choice to import the real module for it rather than mock useKycGate.ts wholesale — keeps
// this test asserting against the actual shared key useKycGate.ts reads (T026's whole point).
import { currentUserQueryKey } from "@/features/identity/useKycGate";
import RegisterScreen from "./register";

const domainUserFixture = {
  id: "user-1",
  email: "ana@example.com",
  username: "ana_garcia",
  isBusiness: false,
  kycStatus: "pending",
  hasCompletedTutorial: false,
  isPremium: false,
};

function fillAndSubmit(getByLabelText: any, getByRole: any) {
  fireEvent.changeText(getByLabelText("Email"), "ana@example.com");
  fireEvent.changeText(getByLabelText("Password"), "supersecret1");
  fireEvent.changeText(getByLabelText("Phone"), "+525512345678");
  fireEvent.changeText(getByLabelText("Username"), "ana_garcia");
  fireEvent.press(getByRole("button", { name: "Create account" }));
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

  // FR-001, FR-002, FR-006: a successful submit (registration + session establishment both
  // succeed) calls submitPersonalRegistration with the api client, the real signInWithPassword
  // primitive, and the typed input, then navigates to /verify-phone.
  it("calls submitPersonalRegistration with the signIn primitive and navigates to verify-phone when session establishment succeeds", async () => {
    mockSubmitPersonalRegistration.mockResolvedValue({
      user: domainUserFixture,
      sessionError: null,
    });

    const { getByLabelText, getByRole } = renderWithClient(newTestQueryClient());
    fillAndSubmit(getByLabelText, getByRole);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/verify-phone"));
    expect(mockSubmitPersonalRegistration).toHaveBeenCalledWith(
      {},
      "SIGN_IN_WITH_PASSWORD_FN",
      {
        email: "ana@example.com",
        password: "supersecret1",
        phone: "+525512345678",
        username: "ana_garcia",
      }
    );
    expect(mockSubmitBusinessRegistration).not.toHaveBeenCalled();
    // T033: this screen calls setCurrentUserId with the backend's own User.id (domainUserFixture
    // .id), not the Supabase authProviderId — the real header-attaching effect of this call is
    // exercised without mocking in register.session-wiring.test.tsx.
    expect(mockSetCurrentUserId).toHaveBeenCalledWith(domainUserFixture.id);
  });

  // T025 (US2, FR-003): selecting the "Tienda" account type calls submitBusinessRegistration —
  // NOT submitPersonalRegistration — with the identical credentials-only payload; this screen's
  // only job is picking which endpoint to call, per RegistrationForm's (T024) toggle.
  it("calls submitBusinessRegistration when the Tienda account type is selected, and navigates to verify-phone on success", async () => {
    const businessUserFixture = { ...domainUserFixture, isBusiness: true };
    mockSubmitBusinessRegistration.mockResolvedValue({
      user: businessUserFixture,
      sessionError: null,
    });

    const { getByLabelText, getByRole } = renderWithClient(newTestQueryClient());
    fireEvent.press(getByRole("radio", { name: "Tienda (business) account" }));
    fillAndSubmit(getByLabelText, getByRole);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/verify-phone"));
    expect(mockSubmitBusinessRegistration).toHaveBeenCalledWith(
      {},
      "SIGN_IN_WITH_PASSWORD_FN",
      {
        email: "ana@example.com",
        password: "supersecret1",
        phone: "+525512345678",
        username: "ana_garcia",
      }
    );
    expect(mockSubmitPersonalRegistration).not.toHaveBeenCalled();
  });

  // T026 (US2): a successful registration caches the returned isBusiness flag under the same
  // React Query key useKycGate.ts (T010) reads/writes — this is the "cleanest source" ProfileForm/
  // profile.tsx (T026) later reads it from, per that task's instruction not to pass it through
  // navigation params.
  it("caches the returned isBusiness flag under currentUserQueryKey on a successful submit", async () => {
    const businessUserFixture = { ...domainUserFixture, isBusiness: true };
    mockSubmitBusinessRegistration.mockResolvedValue({
      user: businessUserFixture,
      sessionError: null,
    });
    // gcTime: Infinity, unlike this file's other tests — an inactive query (nothing here ever
    // renders a `useQuery` against currentUserQueryKey) with gcTime: 0 is garbage collected
    // almost immediately, which would make this assertion flaky/false-negative regardless of
    // whether the cache write itself happened. Infinity (rather than a finite non-zero value)
    // also means React Query never schedules a GC timer at all, so this doesn't leave an open
    // handle for Jest to warn about the way a finite gcTime would.
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

    const { getByLabelText, getByRole } = renderWithClient(client);
    fireEvent.press(getByRole("radio", { name: "Tienda (business) account" }));
    fillAndSubmit(getByLabelText, getByRole);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/verify-phone"));
    expect(client.getQueryData(currentUserQueryKey)).toMatchObject({ isBusiness: true });
  });

  // T031 (FR-001, FR-006): the honest-failure-mode UX — registration succeeds but the injected
  // signIn fails (e.g. email confirmation required). The screen must NOT navigate on as if a
  // session exists; it must show an explicit, actionable message instead of a silent dead end.
  it("shows an actionable session-issue message and does not navigate when registration succeeds but sign-in fails", async () => {
    mockSubmitPersonalRegistration.mockResolvedValue({
      user: domainUserFixture,
      sessionError: "Email not confirmed",
    });

    const { getByLabelText, getByRole, findByText, findByRole } = renderWithClient(newTestQueryClient());
    fillAndSubmit(getByLabelText, getByRole);

    await findByText(/Your account was created/);
    expect(await findByText(/Email not confirmed/)).toBeTruthy();
    expect(await findByRole("button", { name: "Retry sign-in" })).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // T031: the retry action calls retrySignIn (not submitPersonalRegistration again — the
  // account already exists) with the originally-submitted credentials, and navigates on success.
  it("retries only the sign-in primitive on Retry, and navigates once it succeeds", async () => {
    mockSubmitPersonalRegistration.mockResolvedValue({
      user: domainUserFixture,
      sessionError: "Email not confirmed",
    });
    mockRetrySignIn.mockResolvedValue({ error: null });

    const { getByLabelText, getByRole, findByRole } = renderWithClient(newTestQueryClient());
    fillAndSubmit(getByLabelText, getByRole);

    const retryButton = await findByRole("button", { name: "Retry sign-in" });
    fireEvent.press(retryButton);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/verify-phone"));
    expect(mockRetrySignIn).toHaveBeenCalledWith(
      "SIGN_IN_WITH_PASSWORD_FN",
      "ana@example.com",
      "supersecret1"
    );
    expect(mockSubmitPersonalRegistration).toHaveBeenCalledTimes(1);
    // T033: setCurrentUserId was already called once, right after the original registration
    // response (before the sessionError branch) — retrySignIn never re-calls
    // submitPersonalRegistration, so it must NOT be called again here. This is what makes the
    // retry-sign-in path "equally authenticated" without a second call site (tasks.md's explicit
    // "do not spread this" constraint).
    expect(mockSetCurrentUserId).toHaveBeenCalledTimes(1);
    expect(mockSetCurrentUserId).toHaveBeenCalledWith(domainUserFixture.id);
  });
});
