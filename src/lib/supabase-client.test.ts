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
// T010 (specs/005-login), FR-007/FR-008: everything this mock needs is constructed ENTIRELY
// INSIDE the jest.mock() factory below, self-contained — not, as an earlier version of this file
// tried, split across module-level `const`s referenced from inside the factory. Confirmed by a
// throwaway diagnostic test (see this task's progress-report entry for the exact repro): with
// Babel/CommonJS module transforms, an `import` statement's underlying `require()` call executes
// BEFORE every other top-level statement in this file (even ones written textually earlier in
// the source) — so `src/lib/supabase-client.ts`'s own module-level `export const supabase =
// createClient(...)` (which invokes this mock's `createClient` immediately, synchronously)
// already runs before any `const mock... = jest.fn()` declared above the `import` below has been
// assigned. The ORIGINAL, pre-T010 version of this file never hit this because its factory only
// ever returned inline object literals whose NESTED closures captured `mockSignInWithPassword` by
// name for a LATER read (well after this whole module finishes evaluating) — it never read a
// module-level mock variable synchronously at factory-call time the way distinguishing
// "singleton vs. throwaway recovery client" by call order requires. Self-containing the state
// inside the factory sidesteps the ordering problem entirely; `jest.requireMock` below retrieves
// live references to that same state afterward, for use inside individual `it()` bodies (which
// run long after module evaluation finishes, so timing is no longer a concern there).
jest.mock("@supabase/supabase-js", () => {
  const mockSignInWithPassword = jest.fn();
  const mockResetPasswordForEmail = jest.fn();

  // Tracks the auth object handed back on every createClient() call AFTER the first (the
  // module-level `supabase` singleton) — i.e. every throwaway recovery-session client
  // createPasswordRecoverySession() (T010) builds — as a distinct object per call, so the
  // regression test below can assert genuine instance-level isolation ("the shared singleton's
  // mocks recorded zero calls") rather than merely asserting recovery functions exist.
  const recoveryAuthMocks: { verifyOtp: jest.Mock; updateUser: jest.Mock; signOut: jest.Mock }[] =
    [];

  // The FIRST createClient() call this whole test file ever sees is the module-level `supabase`
  // singleton (top of src/lib/supabase-client.ts), constructed exactly once, the moment this
  // mocked module is first required — never re-created, since Node/Jest caches the module after
  // that. Every call after that first one is a fresh throwaway recovery-session client. This flag
  // is a plain closure variable, deliberately NOT derived from `mockCreateClient.mock.calls.length`
  // — this file's own `afterEach(() => jest.clearAllMocks())` resets every jest.fn()'s call
  // history between tests, which would make a "the first call THIS TEST sees" heuristic
  // misidentify a recovery-session client as the singleton on the second and later tests. A plain
  // closure variable isn't touched by `clearAllMocks()`, so it correctly tracks the one real
  // event it needs to across the whole file's lifetime, not per-test.
  let singletonCreated = false;

  const mockCreateClient = jest.fn((..._args: unknown[]) => {
    if (!singletonCreated) {
      singletonCreated = true;
      return {
        auth: {
          signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
          resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
        },
      };
    }

    const authMock = { verifyOtp: jest.fn(), updateUser: jest.fn(), signOut: jest.fn() };
    recoveryAuthMocks.push(authMock);
    return { auth: authMock };
  });

  return {
    createClient: mockCreateClient,
    // Not part of the real "@supabase/supabase-js" module shape — a deliberate, test-only escape
    // hatch so this test file's own `it()` bodies (via `jest.requireMock` below) can reach the
    // same mock instances the factory above built, after module evaluation has fully finished.
    __supabaseMockState: {
      mockCreateClient,
      mockSignInWithPassword,
      mockResetPasswordForEmail,
      recoveryAuthMocks,
    },
  };
});

import {
  createPasswordRecoverySession,
  NETWORK_SIGN_IN_ERROR_MESSAGE,
  requestPasswordReset,
  signInWithPassword,
} from "./supabase-client";

const { mockCreateClient, mockSignInWithPassword, mockResetPasswordForEmail, recoveryAuthMocks } =
  (
    jest.requireMock("@supabase/supabase-js") as {
      __supabaseMockState: {
        mockCreateClient: jest.Mock;
        mockSignInWithPassword: jest.Mock;
        mockResetPasswordForEmail: jest.Mock;
        recoveryAuthMocks: { verifyOtp: jest.Mock; updateUser: jest.Mock; signOut: jest.Mock }[];
      };
    }
  ).__supabaseMockState;

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

// T010 (specs/005-login), FR-007: mirrors the signInWithPassword describe block above exactly —
// same three shapes (resolves-clean, resolves-with-auth-error, rejects-at-the-network-layer) —
// since requestPasswordReset (src/lib/supabase-client.ts) is built from the identical
// MUST-NEVER-THROW try/catch pattern around a different SDK call
// (supabase.auth.resetPasswordForEmail) on the SAME shared/ambient `supabase` singleton.
describe("requestPasswordReset", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // FR-007: the happy path — the SDK resolves with no error.
  it("returns a null error when the SDK resolves successfully", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const result = await requestPasswordReset("ana@example.com");

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("ana@example.com");
    expect(result).toEqual({ error: null });
  });

  // FR-007: an auth-level rejection still *resolves*, with `error` populated — same shape as
  // signInWithPassword's equivalent case.
  it("returns the SDK's own message when the SDK resolves with an auth-level error", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { message: "Unable to validate email address" },
    });

    const result = await requestPasswordReset("not-a-real-address");

    expect(result).toEqual({ error: "Unable to validate email address" });
  });

  // FR-007: a network-level failure (the underlying call REJECTS, not merely resolves with an
  // error) must not throw and must map to the same NETWORK_SIGN_IN_ERROR_MESSAGE
  // signInWithPassword reuses (per this task's explicit instruction — no second copy of the same
  // message).
  it("does not throw and resolves to NETWORK_SIGN_IN_ERROR_MESSAGE when the underlying call rejects", async () => {
    mockResetPasswordForEmail.mockRejectedValue(new TypeError("Network request failed"));

    await expect(requestPasswordReset("ana@example.com")).resolves.toEqual({
      error: NETWORK_SIGN_IN_ERROR_MESSAGE,
    });
  });
});

// T010 (specs/005-login), FR-008, spec.md Clarifications' "Recorded default 2": covers
// createPasswordRecoverySession()'s three returned functions, AND — the single most important
// test in this task — proves the throwaway recovery-session client it builds is genuinely
// isolated from the module-level `supabase` singleton, not merely assumed to be. See this file's
// top-of-file comments (mockCreateClient/singletonClientCreated/recoveryAuthMocks) for how the
// mock factory makes that isolation provable: the singleton is identified once, at module-import
// time, and every createClient() call after that produces a fresh, distinct auth mock object
// pushed onto recoveryAuthMocks — so "the shared singleton's mocks were never touched" is a
// literal, per-mock-object call-count assertion below, not an inference.
describe("createPasswordRecoverySession", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("verifyCode: returns a null error when the SDK resolves successfully", async () => {
    const session = createPasswordRecoverySession();
    const authMock = recoveryAuthMocks[recoveryAuthMocks.length - 1];
    authMock.verifyOtp.mockResolvedValue({ data: {}, error: null });

    const result = await session.verifyCode("ana@example.com", "123456");

    expect(authMock.verifyOtp).toHaveBeenCalledWith({
      email: "ana@example.com",
      token: "123456",
      type: "recovery",
    });
    expect(result).toEqual({ error: null });
  });

  it("verifyCode: returns the SDK's own message when the SDK resolves with an auth-level error", async () => {
    const session = createPasswordRecoverySession();
    const authMock = recoveryAuthMocks[recoveryAuthMocks.length - 1];
    authMock.verifyOtp.mockResolvedValue({
      data: {},
      error: { message: "Token has expired or is invalid" },
    });

    const result = await session.verifyCode("ana@example.com", "000000");

    expect(result).toEqual({ error: "Token has expired or is invalid" });
  });

  it("verifyCode: does not throw and resolves to NETWORK_SIGN_IN_ERROR_MESSAGE when the underlying call rejects", async () => {
    const session = createPasswordRecoverySession();
    const authMock = recoveryAuthMocks[recoveryAuthMocks.length - 1];
    authMock.verifyOtp.mockRejectedValue(new TypeError("Network request failed"));

    await expect(session.verifyCode("ana@example.com", "123456")).resolves.toEqual({
      error: NETWORK_SIGN_IN_ERROR_MESSAGE,
    });
  });

  it("updatePassword: returns a null error when the SDK resolves successfully", async () => {
    const session = createPasswordRecoverySession();
    const authMock = recoveryAuthMocks[recoveryAuthMocks.length - 1];
    authMock.updateUser.mockResolvedValue({ data: {}, error: null });

    const result = await session.updatePassword("newsupersecret1");

    expect(authMock.updateUser).toHaveBeenCalledWith({ password: "newsupersecret1" });
    expect(result).toEqual({ error: null });
  });

  it("updatePassword: returns the SDK's own message when the SDK resolves with an auth-level error", async () => {
    const session = createPasswordRecoverySession();
    const authMock = recoveryAuthMocks[recoveryAuthMocks.length - 1];
    authMock.updateUser.mockResolvedValue({
      data: {},
      error: { message: "Password should be at least 6 characters" },
    });

    const result = await session.updatePassword("short");

    expect(result).toEqual({ error: "Password should be at least 6 characters" });
  });

  it("updatePassword: does not throw and resolves to NETWORK_SIGN_IN_ERROR_MESSAGE when the underlying call rejects", async () => {
    const session = createPasswordRecoverySession();
    const authMock = recoveryAuthMocks[recoveryAuthMocks.length - 1];
    authMock.updateUser.mockRejectedValue(new TypeError("Network request failed"));

    await expect(session.updatePassword("newsupersecret1")).resolves.toEqual({
      error: NETWORK_SIGN_IN_ERROR_MESSAGE,
    });
  });

  it("discard: resolves (void) when the SDK resolves successfully", async () => {
    const session = createPasswordRecoverySession();
    const authMock = recoveryAuthMocks[recoveryAuthMocks.length - 1];
    authMock.signOut.mockResolvedValue({ error: null });

    await expect(session.discard()).resolves.toBeUndefined();
    expect(authMock.signOut).toHaveBeenCalledTimes(1);
  });

  it("discard: does not throw even when the underlying call rejects", async () => {
    const session = createPasswordRecoverySession();
    const authMock = recoveryAuthMocks[recoveryAuthMocks.length - 1];
    authMock.signOut.mockRejectedValue(new TypeError("Network request failed"));

    await expect(session.discard()).resolves.toBeUndefined();
  });

  // THE REGRESSION GUARD THIS TASK EXISTS FOR (spec.md Clarifications, Recorded default 2): every
  // recovery-session operation — verifyCode, updatePassword, and discard — must run entirely on
  // the throwaway client, never on the module-level `supabase` singleton useKycGate() observes.
  // Proven here by asserting the shared singleton's own mocks (mockSignInWithPassword,
  // mockResetPasswordForEmail — the only two auth methods the shared client's mock object
  // exposes) recorded ZERO calls as a result of a full verify -> update -> discard sequence, AND
  // that the operation instead landed on a distinct auth mock object
  // (recoveryAuthMocks[...]) that is not === either of the shared singleton's backing mocks. If a
  // future change accidentally wired these functions to the shared `supabase` export instead of
  // the throwaway `recoveryClient`, this test would fail: the SDK calls would land on
  // mockSignInWithPassword/mockResetPasswordForEmail's shared auth object (which has no
  // verifyOtp/updateUser/signOut of its own), not on a fresh recoveryAuthMocks entry.
  it("never touches the module-level supabase singleton's mocked auth object", async () => {
    const singletonCallCountBefore = mockCreateClient.mock.calls.length;

    const session = createPasswordRecoverySession();

    // createPasswordRecoverySession() must have built a NEW client instance — a new
    // createClient() call beyond whatever already happened for the shared singleton.
    expect(mockCreateClient.mock.calls.length).toBe(singletonCallCountBefore + 1);

    const authMock = recoveryAuthMocks[recoveryAuthMocks.length - 1];
    authMock.verifyOtp.mockResolvedValue({ data: {}, error: null });
    authMock.updateUser.mockResolvedValue({ data: {}, error: null });
    authMock.signOut.mockResolvedValue({ error: null });

    await session.verifyCode("ana@example.com", "123456");
    await session.updatePassword("newsupersecret1");
    await session.discard();

    // The regression guard: the shared singleton's own auth mocks must record zero calls.
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();

    // And the operations did land on the distinct, throwaway instance, not merely "nowhere".
    expect(authMock.verifyOtp).toHaveBeenCalledTimes(1);
    expect(authMock.updateUser).toHaveBeenCalledTimes(1);
    expect(authMock.signOut).toHaveBeenCalledTimes(1);
  });

  // Each call to createPasswordRecoverySession() must produce its OWN fresh client instance —
  // no shared state between two separate "Forgot password?" attempts either.
  it("produces a fresh client instance on every call", () => {
    const before = recoveryAuthMocks.length;

    createPasswordRecoverySession();
    createPasswordRecoverySession();

    expect(recoveryAuthMocks.length).toBe(before + 2);
    expect(recoveryAuthMocks[before]).not.toBe(recoveryAuthMocks[before + 1]);
  });
});
