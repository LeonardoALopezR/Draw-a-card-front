// Covers FR-002 (phone-verification gate), FR-004 (profile-step gate/resumability), FR-007
// (first-run tutorial), FR-009 (routing gate — verify-phone/profile/tutorial/main/kyc-status,
// "pending" passes through per decision B), and FR-010 (retryable error state on a
// current-user-fetch failure, never a silent pass-through) as exercised through useKycGate()
// (T010), which wires the Supabase session + src/domain/registration.ts's fetchCurrentUser()
// to the already-tested pure resolveKycRoute() (src/domain/kyc-gate.ts, T005). Every branch
// here mirrors a case already covered directly in kyc-gate.test.ts; this file only asserts the
// *wiring* (session/query state → the same resolved route), not the branch logic itself.
import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { currentUserQueryKey, KYC_ROUTE_TARGETS, useKycGate } from "./useKycGate";

// T033 (found by code-reviewer's second review, Finding 1 BLOCKING): @/lib/api is intentionally
// NOT mocked in this file — its real setCurrentUserId/currentUserId mechanism is exactly what
// the clear-on-sign-out test below exercises. Only @/lib/supabase-client (mocked above) sits
// between it and a real network call.
import { api, setCurrentUserId } from "@/lib/api";

// Mock the Supabase session boundary — src/lib/supabase-client.ts pulls in expo-secure-store/
// react-native directly (by design, see that file's own comment), which this test has no need
// to exercise for real; only the auth.getSession()/onAuthStateChange() shape useKycGate reads.
const mockGetSession = jest.fn();
const mockUnsubscribe = jest.fn();
const mockOnAuthStateChange = jest.fn((_event: unknown, _session: unknown) => ({
  data: { subscription: { unsubscribe: mockUnsubscribe } },
}));

jest.mock("@/lib/supabase-client", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (event: unknown, session: unknown) =>
        mockOnAuthStateChange(event, session),
    },
  },
}));

// Mock the one real backend signal useKycGate has for a returning user (see
// registration.ts's fetchCurrentUser() doc comment — GET /identity/me/kyc-status is the only
// endpoint that exists). src/lib/api.ts's singleton is still imported by useKycGate.ts (so the
// module graph resolves), but since fetchCurrentUser itself is mocked here, it's never actually
// invoked with a real ApiClient.
const mockFetchCurrentUser = jest.fn();
jest.mock("@/domain/registration", () => ({
  fetchCurrentUser: (...args: unknown[]) => mockFetchCurrentUser(...args),
}));

// T019: the local tutorial-completion read (src/lib/tutorial-storage.ts) — mocked so these tests
// control it explicitly rather than exercising real expo-secure-store/localStorage. Defaults to
// `false` in beforeEach below (matching this hook's old hardcoded default), overridden per test
// where the scenario needs a completed tutorial.
const mockGetHasCompletedTutorial = jest.fn();
jest.mock("@/lib/tutorial-storage", () => ({
  getHasCompletedTutorial: (...args: unknown[]) => mockGetHasCompletedTutorial(...args),
}));

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

// gcTime: 0 avoids leaving React Query's cache-garbage-collection timers open past each test
// (otherwise Jest reports "did not exit... asynchronous operations" even though every test
// itself passes) — a test-only concern, not a change to useKycGate's own React Query usage.
function newTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } });
}

function noSession() {
  mockGetSession.mockResolvedValue({ data: { session: null } });
}

function withSession() {
  mockGetSession.mockResolvedValue({
    data: { session: { access_token: "token", user: { id: "auth-user-1" } } },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });
  mockGetHasCompletedTutorial.mockResolvedValue(false);
  // T033: @/lib/api's currentUserId is real module-level state in this file (see the top-of-file
  // import comment) — reset it so the clear-on-sign-out test below can't leak into, or be
  // affected by, any other test in this file.
  setCurrentUserId(undefined);
});

// FR-002 (005-login): a signed-out visitor's default landing route is "/login", not the old
// "/register" — regression coverage for the literal URL string itself (T006 changed
// KYC_ROUTE_TARGETS.unauthenticated but, by design, left this file's other tests, which only
// assert the abstract KycRoute value "unauthenticated", unable to catch a regression here).
describe("KYC_ROUTE_TARGETS", () => {
  it("maps the unauthenticated route to /login (FR-002)", () => {
    expect(KYC_ROUTE_TARGETS.unauthenticated).toBe("/login");
  });
});

describe("useKycGate", () => {
  // FR-009: no Supabase session at all → "unauthenticated", and the current-user fetch is never
  // attempted (no session means nothing to identify a caller by).
  it("routes to unauthenticated when there is no session, without calling fetchCurrentUser", async () => {
    noSession();
    const client = newTestQueryClient();

    const { result } = renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.route).toBe("unauthenticated");
    expect(result.current.statusFetchFailed).toBe(false);
    expect(mockFetchCurrentUser).not.toHaveBeenCalled();
  });

  // FR-010: a session exists, but the current-user fetch fails (the expected outcome on a
  // genuine cold boot — see registration.ts's fetchCurrentUser() doc comment) → a retryable
  // "kyc-status" route, not a silent "unauthenticated" and not a fall-through to "main".
  it("routes to kyc-status with statusFetchFailed when the current-user fetch fails", async () => {
    withSession();
    mockFetchCurrentUser.mockRejectedValue(new Error("Unauthenticated"));
    const client = newTestQueryClient();

    const { result } = renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.route).toBe("kyc-status");
    expect(result.current.statusFetchFailed).toBe(true);
  });

  // FR-002: a session exists and the fetch succeeds, but nothing is cached yet about this
  // user's registration progress (no phoneVerifiedAt known) → "verify-phone", the safe default
  // for "we don't yet know this user completed phone verification".
  it("routes to verify-phone when the session is valid but no profile progress is cached", async () => {
    withSession();
    mockFetchCurrentUser.mockResolvedValue({ kycStatus: "pending" });
    const client = newTestQueryClient();

    const { result } = renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.route).toBe("verify-phone");
    expect(result.current.statusFetchFailed).toBe(false);
    expect(result.current.kycStatus).toBe("pending");
  });

  // FR-004/Edge Cases: phone verified but the profile step wasn't finished (resumability) —
  // simulated by pre-seeding the query cache the way a real T012/T015 mutation would.
  it("routes to profile when phone is verified but nombre/apellidoPaterno are cached as missing", async () => {
    withSession();
    mockFetchCurrentUser.mockResolvedValue({ kycStatus: "pending" });
    const client = newTestQueryClient();
    client.setQueryData(currentUserQueryKey, {
      kycStatus: "pending",
      hasCompletedTutorial: false,
      phoneVerifiedAt: "2026-08-01T00:00:00.000Z",
      nombre: null,
      apellidoPaterno: null,
    });

    const { result } = renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.route).toBe("profile");
  });

  // FR-009 (decision B): kycStatus "pending" with a complete profile and an incomplete tutorial
  // routes to "tutorial", not a blocking status screen — pending no longer blocks.
  it("routes to tutorial when kycStatus is pending, profile is complete, and the tutorial isn't", async () => {
    withSession();
    mockFetchCurrentUser.mockResolvedValue({ kycStatus: "pending" });
    const client = newTestQueryClient();
    client.setQueryData(currentUserQueryKey, {
      kycStatus: "pending",
      hasCompletedTutorial: false,
      phoneVerifiedAt: "2026-08-01T00:00:00.000Z",
      nombre: "Ana",
      apellidoPaterno: "Garcia",
    });

    const { result } = renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.route).toBe("tutorial");
  });

  // FR-007/FR-009 (decision B): kycStatus "pending", complete profile, tutorial complete →
  // "main" — the case this feature's re-scope exists to make correct (pending must not block).
  // hasCompletedTutorial is seeded as `false` in the cache but `true` in local storage
  // (src/lib/tutorial-storage.ts, T019) — the local read wins, proving it's the actual source
  // of truth this hook uses (see useKycGate.ts's queryFn doc comment), not a stale cached value.
  it("routes to main when kycStatus is pending, profile is complete, and the local tutorial flag is complete", async () => {
    withSession();
    mockFetchCurrentUser.mockResolvedValue({ kycStatus: "pending" });
    mockGetHasCompletedTutorial.mockResolvedValue(true);
    const client = newTestQueryClient();
    client.setQueryData(currentUserQueryKey, {
      kycStatus: "pending",
      hasCompletedTutorial: false,
      phoneVerifiedAt: "2026-08-01T00:00:00.000Z",
      nombre: "Ana",
      apellidoPaterno: "Garcia",
    });

    const { result } = renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.route).toBe("main"));
    expect(mockGetHasCompletedTutorial).toHaveBeenCalledWith("auth-user-1");
  });

  // T020/FR-007/FR-009: kycStatus "verified" behaves identically to "pending" once profile is
  // complete and the tutorial is done — decision B's routing matrix explicitly names both
  // "pending" *and* "verified" as passing through to "main" (kyc-gate.test.ts already covers
  // this at the pure resolveKycRoute() level; this proves the wiring carries a real "verified"
  // kycStatus value through unchanged, not just "pending").
  it("routes to main when kycStatus is verified, profile is complete, and the tutorial is complete", async () => {
    withSession();
    mockFetchCurrentUser.mockResolvedValue({ kycStatus: "verified" });
    mockGetHasCompletedTutorial.mockResolvedValue(true);
    const client = newTestQueryClient();
    client.setQueryData(currentUserQueryKey, {
      kycStatus: "verified",
      hasCompletedTutorial: false,
      phoneVerifiedAt: "2026-08-01T00:00:00.000Z",
      nombre: "Ana",
      apellidoPaterno: "Garcia",
    });

    const { result } = renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.route).toBe("main"));
    expect(result.current.kycStatus).toBe("verified");
  });

  // FR-009 (decision B): "rejected" is the only kycStatus that blocks — unreachable against the
  // real backend today (see spec.md's "Deferred to feature 002"), verified here via this mocked
  // fixture, per this task's explicit instruction.
  it("routes to kyc-status when kycStatus is rejected, even with a complete profile", async () => {
    withSession();
    mockFetchCurrentUser.mockResolvedValue({ kycStatus: "rejected" });
    const client = newTestQueryClient();
    client.setQueryData(currentUserQueryKey, {
      kycStatus: "pending",
      hasCompletedTutorial: true,
      phoneVerifiedAt: "2026-08-01T00:00:00.000Z",
      nombre: "Ana",
      apellidoPaterno: "Garcia",
    });

    const { result } = renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.route).toBe("kyc-status");
    expect(result.current.statusFetchFailed).toBe(false);
    expect(result.current.kycStatus).toBe("rejected");
  });

  // T018 (FR-009): kycRejectionReason is read straight from the query cache and exposed
  // alongside the resolved route, for KycStatusScreen's "rejected" branch to render.
  it("exposes kycRejectionReason for a rejected user", async () => {
    withSession();
    mockFetchCurrentUser.mockResolvedValue({ kycStatus: "rejected" });
    const client = newTestQueryClient();
    client.setQueryData(currentUserQueryKey, {
      kycStatus: "rejected",
      hasCompletedTutorial: true,
      phoneVerifiedAt: "2026-08-01T00:00:00.000Z",
      nombre: "Ana",
      apellidoPaterno: "Garcia",
      kycRejectionReason: "Document image was blurry",
    });

    const { result } = renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.route).toBe("kyc-status"));
    expect(result.current.kycRejectionReason).toBe("Document image was blurry");
  });

  // T018 (FR-010): refetchStatus is a real, working retry — it re-invokes fetchCurrentUser, not
  // a no-op button.
  it("re-fetches via refetchStatus", async () => {
    withSession();
    mockFetchCurrentUser.mockRejectedValue(new Error("Unauthenticated"));
    const client = newTestQueryClient();

    const { result } = renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockFetchCurrentUser).toHaveBeenCalledTimes(1);

    result.current.refetchStatus();

    await waitFor(() => expect(mockFetchCurrentUser).toHaveBeenCalledTimes(2));
  });

  // T034 (2026-08-04, found by manual iOS-simulator testing against a live local backend): the
  // getSession() rejection case — a network-level failure (unreachable host, offline, timeout),
  // not the resolved "no session" shape every other test in this file mocks. Before this fix,
  // this rejected the getSession().then(...) promise with no .catch attached, so
  // setSessionResolved(true) never ran and isLoading stayed true forever (an infinite loading
  // spinner, not a route) — confirmed by reverting the .catch() in useKycGate.ts, which makes
  // this test time out waiting for isLoading to become false. Must fail closed to the same
  // retryable "kyc-status" state FR-010 already defines, not wedge and not a false
  // "unauthenticated".
  it("fails closed to a retryable kyc-status route (never wedges isLoading) when the session check itself rejects", async () => {
    mockGetSession.mockRejectedValue(new TypeError("Network request failed"));
    mockFetchCurrentUser.mockRejectedValue(new Error("Unauthenticated"));
    const client = newTestQueryClient();

    const { result } = renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.route).toBe("kyc-status");
    expect(result.current.statusFetchFailed).toBe(true);
  });

  // Loading-gate contract (feeds T022): route is undefined (no <Redirect> should fire) until
  // the session check has actually resolved — this is what prevents app/_layout.tsx from
  // flashing register/main before we know anything.
  it("reports isLoading and no route until the session check resolves", async () => {
    let resolveSession: (value: { data: { session: null } }) => void = () => {};
    mockGetSession.mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve;
      })
    );
    const client = newTestQueryClient();

    const { result } = renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.route).toBeUndefined();

    resolveSession({ data: { session: null } });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.route).toBe("unauthenticated");
  });

  // T020: the no-flash contract also has to hold for a *session-present* cold boot, not just
  // the no-session case above — a session exists (so hasSession is true) but the current-user
  // query hasn't settled yet. If isLoading flipped to false (or route resolved to something
  // other than undefined) before the query settles, app/_layout.tsx's <Redirect> could fire on
  // stale/absent data and flash the wrong screen (e.g. "unauthenticated" → /register) for a
  // beat before the real "kyc-status"/"verify-phone"/etc. route is known. This is the case that
  // actually matters for a real user with a persisted session reopening the app.
  it("keeps isLoading true and route undefined while a valid session's current-user query is still in flight", async () => {
    withSession();
    let resolveFetch: (value: { kycStatus: "pending" }) => void = () => {};
    mockFetchCurrentUser.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );
    const client = newTestQueryClient();

    const { result } = renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    // The session check itself resolves quickly (mocked as already-resolved), but the
    // current-user fetch is still pending — isLoading must still be true and no route decided.
    await waitFor(() => expect(mockFetchCurrentUser).toHaveBeenCalledTimes(1));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.route).toBeUndefined();

    resolveFetch({ kycStatus: "pending" });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Nothing was ever cached about phone/profile progress, so this resolves to "verify-phone"
    // — the point of this test is only that isLoading/route didn't resolve prematurely while
    // the fetch was still in flight.
    expect(result.current.route).toBe("verify-phone");
  });

  // T033 (found by code-reviewer's second review, Finding 1 BLOCKING; FR-006): this hook is the
  // one place that observes every Supabase auth state transition, so it must clear the backend's
  // dev-only X-User-Id identifier (src/lib/api.ts's setCurrentUserId) whenever a session is lost
  // — otherwise a stale backend user id could leak into a request made after a genuine sign-out.
  // Exercises the REAL @/lib/api module (not mocked in this file, see the top-of-file comment):
  // manually invokes the callback this hook actually registered with
  // supabase.auth.onAuthStateChange (captured from the mock below) to simulate a real "SIGNED_OUT"
  // event, then proves the clear took effect by making a real `api()` call and asserting the
  // X-User-Id header is genuinely absent — not asserting a mock was called with the right args,
  // asserting the real downstream effect.
  it("clears the X-User-Id session identifier when the auth state changes to no session", async () => {
    withSession();
    mockFetchCurrentUser.mockResolvedValue({ kycStatus: "pending" });
    const client = newTestQueryClient();

    renderHook(() => useKycGate(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled());
    const registeredCallback = mockOnAuthStateChange.mock.calls[0][0] as (
      event: string,
      session: unknown
    ) => void;

    setCurrentUserId("backend-user-abc123");
    act(() => {
      registeredCallback("SIGNED_OUT", null);
    });

    const mockFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    const originalFetch = global.fetch;
    global.fetch = mockFetch as unknown as typeof fetch;
    try {
      await api("/identity/me/kyc-status", { method: "GET" });
    } finally {
      global.fetch = originalFetch;
    }

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.headers).not.toHaveProperty("X-User-Id");
  });
});
