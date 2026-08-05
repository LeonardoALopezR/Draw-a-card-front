// T034 (2026-08-04, found by manual iOS-simulator testing against a live local backend): covers
// FR-001 (account creation, which this sign-in step establishes the session for) and FR-006
// (secure session persistence — signInWithPassword is what actually establishes the session
// persistSession: true then persists, see this file's own T031/T034 doc comments) for
// src/lib/supabase-client.ts's signInWithPassword wrapper.
//
// The regression-forcing test in this file is the LAST one below: it mocks the underlying SDK
// call to *reject* (a network-level failure — unreachable host, DNS failure, offline, timeout),
// not merely resolve with an auth-level error. Every other existing test of this feature's
// sign-in path (app/(auth)/register.test.tsx, app/(auth)/register.session-wiring.test.tsx) only
// ever mocks the resolve-with-error shape (`mockSignInWithPassword.mockResolvedValue({ error:
// ... })` / `{ error: null }`) — which is exactly why the real defect (an unhandled rejection
// escaping this wrapper and being caught by the registration try/catch instead) was missed until
// a real iOS simulator run against a real, unreachable Supabase host reproduced it. Verified by
// temporarily reverting the try/catch below (removing it entirely, letting the underlying
// rejection propagate): the "does not throw" assertion below fails with the raw rejection instead
// of resolving to `{ error: NETWORK_SIGN_IN_ERROR_MESSAGE }` — see this file's own commit for
// that revert-and-confirm step.
const mockSignInWithPassword = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
    },
  }),
}));

import { NETWORK_SIGN_IN_ERROR_MESSAGE, signInWithPassword } from "./supabase-client";

describe("signInWithPassword", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // FR-006: the common/happy path — the SDK resolves with no error, meaning the session was
  // established.
  it("returns a null error when the SDK resolves successfully", async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });

    const result = await signInWithPassword("ana@example.com", "supersecret1");

    expect(result).toEqual({ error: null });
  });

  // FR-001, FR-006: the SDK's own documented failure shape — an auth-level rejection (bad
  // credentials, unconfirmed email) still *resolves*, with `error` populated. This is the shape
  // every pre-existing test in this feature already mocked, and it was never broken.
  it("returns the SDK's own message when the SDK resolves with an auth-level error", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {},
      error: { message: "Invalid login credentials" },
    });

    const result = await signInWithPassword("ana@example.com", "wrong-password");

    expect(result).toEqual({ error: "Invalid login credentials" });
  });

  // T034 (FR-001, FR-006) — THE REGRESSION TEST FOR THIS DEFECT: the underlying SDK call REJECTS
  // (a network-level failure), not merely resolves-with-error. Before this fix, this rejection
  // escaped signInWithPassword entirely, was never caught by app/(auth)/register.tsx's sign-in
  // handling (only its *registration* try/catch caught it, mischaracterizing a successful
  // registration as a failed one), and — reproduced concretely on the iOS simulator against a
  // live backend — permanently locked a genuinely-created account behind a 409 EmailTaken retry
  // loop. This must resolve, not throw, and the message must be distinct from a credentials
  // rejection so the caller (registration.ts's RegistrationResult.sessionError, surfaced by
  // register.tsx's session-issue screen) can be honest about what actually went wrong.
  it("does not throw and resolves to a distinct network-failure message when the underlying call rejects", async () => {
    mockSignInWithPassword.mockRejectedValue(new TypeError("Network request failed"));

    await expect(signInWithPassword("ana@example.com", "supersecret1")).resolves.toEqual({
      error: NETWORK_SIGN_IN_ERROR_MESSAGE,
    });
  });

  // The network-failure message must not be confusable with an actual "your credentials were
  // wrong" message — the user's correct recovery differs (retry/check connection vs. re-enter
  // credentials), per this task's explicit requirement.
  it("gives the network-failure message distinct, honest copy from a credentials rejection", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {},
      error: { message: "Invalid login credentials" },
    });
    const credentialsResult = await signInWithPassword("ana@example.com", "wrong-password");

    mockSignInWithPassword.mockRejectedValue(new Error("fetch failed"));
    const networkResult = await signInWithPassword("ana@example.com", "supersecret1");

    expect(networkResult.error).not.toBe(credentialsResult.error);
  });
});
