// T033 (found by code-reviewer's second review of 001-registration-kyc, Finding 1 BLOCKING):
// exercises the REAL src/lib/api.ts header-building path (createApiClient's getHeaders callback
// wired to setCurrentUserId/currentUserId), not a mock of it — this is exactly the class of test
// the review found missing. Every other test in this feature either mocks `ApiClient` entirely
// (src/domain/*.test.ts) or mocks `@/lib/api` wholesale (most app/**/*.test.tsx), which is why
// neither this defect nor the structurally identical T031 defect was caught by the existing 166
// tests. This file only mocks the true I/O boundary — global fetch and the Supabase client
// src/lib/supabase-client.ts wraps (its only role here is to have `auth.getSession()` resolve to
// "no session", which is irrelevant to the X-User-Id header this file actually tests). Feeds
// FR-002 (POST /identity/phone/verify), FR-004 (POST /identity/me/profile), FR-009/FR-010 (GET
// /identity/me/kyc-status) — every one of the backend's `requireUserId()`-gated routes this
// header is the only thing that authenticates against today (see this file's own doc comment).
jest.mock("./supabase-client", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

import { api, setCurrentUserId } from "./api";

function mockJsonFetch(body: unknown = {}) {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  });
}

describe("src/lib/api.ts — X-User-Id header wiring (T033)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    // Module-level state (currentUserId) would otherwise leak across tests in this file.
    setCurrentUserId(undefined);
  });

  // FR-002, FR-004, FR-009, FR-010: this is the header the backend's requireUserId()
  // (Draw-a-card backend repo, src/modules/identity/routes.ts) requires on every
  // /identity/phone/* and /identity/me/* route. If a future change stops calling
  // setCurrentUserId (the original T033 defect), this test fails because the real request the
  // real `api` client builds would no longer carry the header — this is not asserting against a
  // mock of the header-building logic, it IS the header-building logic.
  it("attaches X-User-Id with the id passed to setCurrentUserId on every subsequent request", async () => {
    const mockFetch = mockJsonFetch();
    global.fetch = mockFetch as unknown as typeof fetch;

    setCurrentUserId("backend-user-abc123");
    await api("/identity/me/kyc-status", { method: "GET" });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/identity/me/kyc-status"),
      expect.objectContaining({
        headers: expect.objectContaining({ "X-User-Id": "backend-user-abc123" }),
      })
    );
  });

  // The regression guard for the ORIGINAL defect this review found: before T033, nothing ever
  // called setCurrentUserId, so currentUserId stayed undefined for the app's entire lifetime and
  // every authenticated request silently omitted the header. This proves that state — no prior
  // setCurrentUserId call — really does omit the header (not just default to an empty string or
  // similar), matching exactly what a live 401 against the real backend would look like.
  it("omits X-User-Id entirely when setCurrentUserId has never been called", async () => {
    const mockFetch = mockJsonFetch();
    global.fetch = mockFetch as unknown as typeof fetch;

    await api("/identity/me/kyc-status", { method: "GET" });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.headers).not.toHaveProperty("X-User-Id");
  });

  // setCurrentUserId(undefined) (useKycGate.ts's sign-out clear, T033) must genuinely stop the
  // header from being sent on the NEXT request, not just leave a stale id in place.
  it("stops attaching X-User-Id once cleared via setCurrentUserId(undefined)", async () => {
    const mockFetch = mockJsonFetch();
    global.fetch = mockFetch as unknown as typeof fetch;

    setCurrentUserId("backend-user-abc123");
    setCurrentUserId(undefined);
    await api("/identity/me/kyc-status", { method: "GET" });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.headers).not.toHaveProperty("X-User-Id");
  });
});
