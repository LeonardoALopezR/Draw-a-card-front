// Covers FR-001 (email+password+phone+username account creation), FR-002 (5-digit phone
// verification + resend), FR-003 (personal vs business account type via which endpoint is
// called), and FR-005 (case-/accent-insensitive username uniqueness — enforced server-side,
// surfaced here as the backend's "UsernameTaken" ApiError code) via
// src/domain/registration.ts's thin wrappers around the real backend contract (Draw-a-card
// backend repo, specs/001-user-registration-kyc). Every network call is exercised through a
// hand-rolled mock ApiClient (dependency injection — see registration.ts's file-level comment
// for why this file never imports src/lib/api.ts directly), so these tests need no fetch
// mocking and stay pure Jest/TS.
import { ApiError, type ApiClient } from "./api-client";
import {
  fetchCurrentUser,
  mapRegistrationError,
  mapResendError,
  mapVerifyPhoneError,
  markTutorialComplete,
  resendVerificationCode,
  retrySignIn,
  SESSION_LOST_MESSAGE,
  submitBusinessRegistration,
  submitPersonalRegistration,
  toDomainUser,
  verifyPhoneCode,
  type BackendUser,
  type SignInWithPassword,
} from "./registration";

const backendUserFixture: BackendUser = {
  id: "user-1",
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

const validCredentials = {
  email: "ana@example.com",
  password: "supersecret1",
  phone: "+525512345678",
  username: "ana_garcia",
};

// Minimal mock matching the ApiClient signature (`<T>(path, options?) => Promise<T>`) — no
// real fetch involved, per the file-level comment above.
function mockClient<T>(implementation: (path: string, options?: RequestInit) => Promise<T>) {
  return implementation as unknown as ApiClient;
}

// T031: a SignInWithPassword double that always "succeeds" (error: null) — used by every test
// below that isn't specifically exercising the session-establishment behavior itself, so those
// tests aren't coupled to it.
const alwaysSucceedsSignIn: SignInWithPassword = async () => ({ error: null });

describe("submitPersonalRegistration", () => {
  // FR-001: happy path — POST /identity/register with only the four credential fields, mapped
  // back to the domain User shape.
  it("calls POST /identity/register with only email/password/phone/username and returns a domain User", async () => {
    let receivedPath = "";
    let receivedBody: unknown;
    const client = mockClient(async (path, options) => {
      receivedPath = path;
      receivedBody = JSON.parse((options?.body as string) ?? "{}");
      return { user: backendUserFixture };
    });

    const result = await submitPersonalRegistration(client, alwaysSucceedsSignIn, validCredentials);

    expect(receivedPath).toBe("/identity/register");
    expect(receivedBody).toEqual(validCredentials);
    expect(result.user).toEqual(toDomainUser(backendUserFixture));
    expect(result.user.kycStatus).toBe("pending");
  });

  // FR-001: validation-error path — invalid email is rejected client-side (ZodError), before
  // the network is ever touched.
  it("throws a validation error and never calls the network for an invalid email", async () => {
    let called = false;
    const client = mockClient(async () => {
      called = true;
      return { user: backendUserFixture };
    });

    await expect(
      submitPersonalRegistration(client, alwaysSucceedsSignIn, { ...validCredentials, email: "not-an-email" })
    ).rejects.toThrow();
    expect(called).toBe(false);
  });

  // FR-010 (backend spec): duplicate email surfaces as a typed, discriminable ApiError with
  // code "EmailTaken" (409) — not a generic thrown string.
  it("surfaces the backend's EmailTaken (409) error as a discriminable ApiError", async () => {
    const client = mockClient(async () => {
      throw new ApiError(409, "EmailTaken", "That email is already registered");
    });

    await expect(
      submitPersonalRegistration(client, alwaysSucceedsSignIn, validCredentials)
    ).rejects.toMatchObject({
      code: "EmailTaken",
      status: 409,
    });
  });

  // FR-005: duplicate username (case-/accent-insensitive collision, enforced server-side)
  // surfaces as a discriminable ApiError with code "UsernameTaken" (409).
  it("surfaces the backend's UsernameTaken (409) error as a discriminable ApiError", async () => {
    const client = mockClient(async () => {
      throw new ApiError(409, "UsernameTaken", "That username is already taken");
    });

    await expect(
      submitPersonalRegistration(client, alwaysSucceedsSignIn, validCredentials)
    ).rejects.toMatchObject({
      code: "UsernameTaken",
      status: 409,
    });
  });

  // T031 (FR-001, FR-006): THE regression test for the defect T020 found. Every other test in
  // this file uses a signIn double that just returns success without recording anything — this
  // one is the one that would have caught the original bug, because that bug was never "the
  // session mock returns the wrong thing", it was "nothing ever calls the sign-in primitive at
  // all". A test that mocks a session into existence (as every pre-T031 test across this repo
  // did, per T020's finding) cannot catch that; only asserting the primitive was actually
  // invoked, with the right credentials, can.
  it("calls the injected signIn primitive with the just-registered email/password after a successful POST /identity/register", async () => {
    const client = mockClient(async () => ({ user: backendUserFixture }));
    let signInCalledWith: [string, string] | undefined;
    const signIn: SignInWithPassword = async (email, password) => {
      signInCalledWith = [email, password];
      return { error: null };
    };

    const result = await submitPersonalRegistration(client, signIn, validCredentials);

    expect(signInCalledWith).toEqual([validCredentials.email, validCredentials.password]);
    expect(result.sessionError).toBeNull();
  });

  // T031 (FR-001, FR-006): the honest-failure-mode case — registration succeeds against the
  // backend (the account exists, this call does not retry/undo it) but the Supabase sign-in
  // fails (e.g. the project requires email confirmation before password sign-in). This must
  // surface as a typed `sessionError`, not throw and not silently pretend a session exists.
  it("returns the registered user with a sessionError, and does not throw, when the injected signIn primitive fails", async () => {
    const client = mockClient(async () => ({ user: backendUserFixture }));
    const signIn: SignInWithPassword = async () => ({ error: "Email not confirmed" });

    const result = await submitPersonalRegistration(client, signIn, validCredentials);

    expect(result.sessionError).toBe("Email not confirmed");
    expect(result.user).toEqual(toDomainUser(backendUserFixture));
  });
});

describe("submitBusinessRegistration", () => {
  const businessUserFixture: BackendUser = { ...backendUserFixture, isBusiness: true };

  // FR-003: happy path — POST /identity/register/business, same body shape as personal, no
  // business-specific fields sent at this step.
  it("calls POST /identity/register/business with the credentials-only shape and returns isBusiness: true", async () => {
    let receivedPath = "";
    const client = mockClient(async (path) => {
      receivedPath = path;
      return { user: businessUserFixture };
    });

    const result = await submitBusinessRegistration(client, alwaysSucceedsSignIn, validCredentials);

    expect(receivedPath).toBe("/identity/register/business");
    expect(result.user.isBusiness).toBe(true);
  });

  // FR-001/FR-003: validation-error path — password too short is rejected client-side.
  it("throws a validation error and never calls the network for a short password", async () => {
    let called = false;
    const client = mockClient(async () => {
      called = true;
      return { user: businessUserFixture };
    });

    await expect(
      submitBusinessRegistration(client, alwaysSucceedsSignIn, { ...validCredentials, password: "short" })
    ).rejects.toThrow();
    expect(called).toBe(false);
  });

  // FR-010: EmailTaken applies identically to business registration.
  it("surfaces the backend's EmailTaken (409) error as a discriminable ApiError", async () => {
    const client = mockClient(async () => {
      throw new ApiError(409, "EmailTaken", "That email is already registered");
    });

    await expect(
      submitBusinessRegistration(client, alwaysSucceedsSignIn, validCredentials)
    ).rejects.toMatchObject({
      code: "EmailTaken",
    });
  });

  // T031 (FR-001, FR-006): same regression coverage as submitPersonalRegistration's own test
  // above, for the business registration path — the sign-in primitive must actually be invoked.
  it("calls the injected signIn primitive with the just-registered email/password after a successful POST /identity/register/business", async () => {
    const client = mockClient(async () => ({ user: businessUserFixture }));
    let signInCalledWith: [string, string] | undefined;
    const signIn: SignInWithPassword = async (email, password) => {
      signInCalledWith = [email, password];
      return { error: null };
    };

    const result = await submitBusinessRegistration(client, signIn, validCredentials);

    expect(signInCalledWith).toEqual([validCredentials.email, validCredentials.password]);
    expect(result.sessionError).toBeNull();
  });
});

describe("retrySignIn", () => {
  // T031 (FR-001, FR-006): lets a screen retry only the sign-in primitive (no re-registration)
  // after a registration-succeeded-but-sign-in-failed outcome — happy path.
  it("calls the injected signIn primitive with the given credentials and returns its result", async () => {
    let signInCalledWith: [string, string] | undefined;
    const signIn: SignInWithPassword = async (email, password) => {
      signInCalledWith = [email, password];
      return { error: null };
    };

    const result = await retrySignIn(signIn, "ana@example.com", "supersecret1");

    expect(signInCalledWith).toEqual(["ana@example.com", "supersecret1"]);
    expect(result.error).toBeNull();
  });

  // T031: surfaces a repeated sign-in failure rather than throwing.
  it("surfaces a repeated sign-in failure without throwing", async () => {
    const signIn: SignInWithPassword = async () => ({ error: "Email not confirmed" });

    const result = await retrySignIn(signIn, "ana@example.com", "supersecret1");

    expect(result.error).toBe("Email not confirmed");
  });
});

describe("verifyPhoneCode", () => {
  // FR-002: happy path.
  it("calls POST /identity/phone/verify with the code and returns phoneVerifiedAt", async () => {
    let receivedBody: unknown;
    const client = mockClient(async (_path, options) => {
      receivedBody = JSON.parse((options?.body as string) ?? "{}");
      return { phoneVerifiedAt: "2026-08-04T00:00:00.000Z" };
    });

    const result = await verifyPhoneCode(client, { code: "12345" });

    expect(receivedBody).toEqual({ code: "12345" });
    expect(result.phoneVerifiedAt).toBe("2026-08-04T00:00:00.000Z");
  });

  // FR-002: validation-error path — a non-digit code is rejected client-side.
  it("throws a validation error and never calls the network for a malformed code", async () => {
    let called = false;
    const client = mockClient(async () => {
      called = true;
      return { phoneVerifiedAt: null };
    });

    await expect(verifyPhoneCode(client, { code: "12a4b" })).rejects.toThrow();
    expect(called).toBe(false);
  });

  // FR-002: an incorrect code surfaces as ApiError code "PhoneCodeInvalid" (400).
  it("surfaces the backend's PhoneCodeInvalid (400) error as a discriminable ApiError", async () => {
    const client = mockClient(async () => {
      throw new ApiError(400, "PhoneCodeInvalid", "That verification code is incorrect");
    });

    await expect(verifyPhoneCode(client, { code: "99999" })).rejects.toMatchObject({
      code: "PhoneCodeInvalid",
      status: 400,
    });
  });

  // Edge Cases (spec.md): an expired code surfaces as ApiError code "PhoneCodeExpired" (400),
  // distinct from an incorrect one, so the UI can offer a resend rather than "try again".
  it("surfaces the backend's PhoneCodeExpired (400) error as a discriminable ApiError", async () => {
    const client = mockClient(async () => {
      throw new ApiError(400, "PhoneCodeExpired", "That verification code has expired or was not found");
    });

    await expect(verifyPhoneCode(client, { code: "12345" })).rejects.toMatchObject({
      code: "PhoneCodeExpired",
    });
  });

  // FR-002: once the per-code guess cap is reached, the backend invalidates the code outright —
  // surfaced as ApiError code "PhoneCodeAttemptsExceeded" (429), requiring a resend.
  it("surfaces the backend's PhoneCodeAttemptsExceeded (429) error as a discriminable ApiError", async () => {
    const client = mockClient(async () => {
      throw new ApiError(429, "PhoneCodeAttemptsExceeded", "Too many incorrect attempts — request a new code");
    });

    await expect(verifyPhoneCode(client, { code: "12345" })).rejects.toMatchObject({
      code: "PhoneCodeAttemptsExceeded",
      status: 429,
    });
  });
});

describe("resendVerificationCode", () => {
  // Edge Cases (spec.md — allow resend): happy path.
  it("calls POST /identity/phone/resend and returns the backend's message", async () => {
    let receivedPath = "";
    const client = mockClient(async (path) => {
      receivedPath = path;
      return { message: "Verification code resent" };
    });

    const result = await resendVerificationCode(client);

    expect(receivedPath).toBe("/identity/phone/resend");
    expect(result.message).toBe("Verification code resent");
  });

  // Edge Cases (spec.md — rate-limited resend): surfaces as ApiError code
  // "PhoneResendRateLimited" (429) rather than a generic error, so the UI can show a
  // rate-limit-specific message.
  it("surfaces the backend's PhoneResendRateLimited (429) error as a discriminable ApiError", async () => {
    const client = mockClient(async () => {
      throw new ApiError(429, "PhoneResendRateLimited", "Too many resend attempts — try again later");
    });

    await expect(resendVerificationCode(client)).rejects.toMatchObject({
      code: "PhoneResendRateLimited",
      status: 429,
    });
  });
});

describe("fetchCurrentUser", () => {
  // FR-009: happy path — GET /identity/me/kyc-status, the only backend signal available for an
  // already-identified returning user (see registration.ts's doc comment on this function).
  it("calls GET /identity/me/kyc-status and returns the reported kycStatus", async () => {
    let receivedPath = "";
    let receivedMethod = "";
    const client = mockClient(async (path, options) => {
      receivedPath = path;
      receivedMethod = options?.method ?? "GET";
      return { kycStatus: "pending" };
    });

    const result = await fetchCurrentUser(client);

    expect(receivedPath).toBe("/identity/me/kyc-status");
    expect(receivedMethod).toBe("GET");
    expect(result).toEqual({ kycStatus: "pending" });
  });

  // FR-010: an unidentified caller (no X-User-Id known yet, e.g. a genuine cold boot per this
  // function's doc comment) surfaces the backend's Unauthenticated (401) as a discriminable
  // ApiError, not a silent pass-through — this is what useKycGate (T010) turns into
  // statusFetchFailed.
  it("surfaces the backend's Unauthenticated (401) error as a discriminable ApiError", async () => {
    const client = mockClient(async () => {
      throw new ApiError(401, "Unauthenticated", "Authentication required");
    });

    await expect(fetchCurrentUser(client)).rejects.toMatchObject({
      code: "Unauthenticated",
      status: 401,
    });
  });
});

describe("mapRegistrationError", () => {
  // FR-001: EmailTaken maps to the email field, so the UI highlights that field inline
  // (SC-002) rather than showing a generic banner.
  it("maps EmailTaken to the email field", () => {
    const error = new ApiError(409, "EmailTaken", "That email is already registered");
    expect(mapRegistrationError(error)).toEqual({
      field: "email",
      message: "That email is already registered",
    });
  });

  // FR-005: UsernameTaken maps to the username field.
  it("maps UsernameTaken to the username field", () => {
    const error = new ApiError(409, "UsernameTaken", "That username is already taken");
    expect(mapRegistrationError(error)).toEqual({
      field: "username",
      message: "That username is already taken",
    });
  });

  // FR-001: a ValidationError with issues maps to the first issue whose path matches a known
  // registration field.
  it("maps a ValidationError's matching issue to its field", () => {
    const error = new ApiError(400, "ValidationError", "Invalid input", [
      { path: "phone", message: "Enter a valid phone number" },
    ]);
    expect(mapRegistrationError(error)).toEqual({
      field: "phone",
      message: "Enter a valid phone number",
    });
  });

  // Falls back to a field-less message for an ApiError code with no field correspondence
  // (e.g. a rate limit or an unmapped backend error) — never invents a field.
  it("falls back to a field-less message for an unmapped ApiError code", () => {
    const error = new ApiError(500, "InternalError", "Something broke");
    expect(mapRegistrationError(error)).toEqual({ message: "Something broke" });
  });

  // Falls back to a generic field-less message for a non-ApiError throw (e.g. a network
  // failure), so the UI still has something inline-renderable.
  it("falls back to a generic message for a non-ApiError throw", () => {
    expect(mapRegistrationError(new Error("network down"))).toEqual({
      message: "Something went wrong. Please try again.",
    });
  });
});

describe("mapVerifyPhoneError", () => {
  // FR-002: an incorrect code maps to the code field, so VerifyPhoneScreen highlights it inline
  // (SC-002) rather than showing a generic banner.
  it("maps PhoneCodeInvalid to the code field", () => {
    const error = new ApiError(400, "PhoneCodeInvalid", "That verification code is incorrect");
    expect(mapVerifyPhoneError(error)).toEqual({
      field: "code",
      message: "That verification code is incorrect",
    });
  });

  // Edge Cases (spec.md): an expired code also maps to the code field.
  it("maps PhoneCodeExpired to the code field", () => {
    const error = new ApiError(400, "PhoneCodeExpired", "That verification code has expired");
    expect(mapVerifyPhoneError(error)).toEqual({
      field: "code",
      message: "That verification code has expired",
    });
  });

  // FR-002: the per-code attempt cap also maps to the code field — the code itself is dead and
  // needs a resend, but the message is still about what the user typed.
  it("maps PhoneCodeAttemptsExceeded to the code field", () => {
    const error = new ApiError(429, "PhoneCodeAttemptsExceeded", "Too many incorrect attempts");
    expect(mapVerifyPhoneError(error)).toEqual({
      field: "code",
      message: "Too many incorrect attempts",
    });
  });

  // FR-002: a ValidationError naming the "code" field maps to it directly.
  it("maps a ValidationError's code issue to the code field", () => {
    const error = new ApiError(400, "ValidationError", "Invalid input", [
      { path: "code", message: "Enter the 5-digit code" },
    ]);
    expect(mapVerifyPhoneError(error)).toEqual({
      field: "code",
      message: "Enter the 5-digit code",
    });
  });

  // Falls back to a field-less message for an ApiError code with no field correspondence.
  it("falls back to a field-less message for an unmapped ApiError code", () => {
    const error = new ApiError(500, "InternalError", "Something broke");
    expect(mapVerifyPhoneError(error)).toEqual({ message: "Something broke" });
  });

  // Falls back to a generic field-less message for a non-ApiError throw.
  it("falls back to a generic message for a non-ApiError throw", () => {
    expect(mapVerifyPhoneError(new Error("network down"))).toEqual({
      message: "Something went wrong. Please try again.",
    });
  });

  // T033 (found by code-reviewer's second review, Finding 1 BLOCKING): if the X-User-Id wiring
  // (app/(auth)/register.tsx's setCurrentUserId call) ever regresses, the backend's
  // Unauthenticated (401) must surface as this honest, actionable session-lost message — not the
  // generic "Something went wrong" fallback a stuck user could never act on.
  it("maps Unauthenticated to the actionable session-lost message, not a generic fallback", () => {
    const error = new ApiError(401, "Unauthenticated", "Authentication required");
    expect(mapVerifyPhoneError(error)).toEqual({ message: SESSION_LOST_MESSAGE });
  });
});

describe("mapResendError", () => {
  // Edge Cases (spec.md — rate-limited resend): surfaces the backend's own
  // PhoneResendRateLimited message verbatim, so the UI shows the real rate-limit copy.
  it("surfaces the backend's message for PhoneResendRateLimited", () => {
    const error = new ApiError(429, "PhoneResendRateLimited", "Too many resend attempts — try again later");
    expect(mapResendError(error)).toBe("Too many resend attempts — try again later");
  });

  // Falls back to a generic message for a non-ApiError throw.
  it("falls back to a generic message for a non-ApiError throw", () => {
    expect(mapResendError(new Error("network down"))).toBe("Something went wrong. Please try again.");
  });

  // T033: same reasoning as mapVerifyPhoneError's Unauthenticated test above.
  it("maps Unauthenticated to the actionable session-lost message, not the backend's raw message", () => {
    const error = new ApiError(401, "Unauthenticated", "Authentication required");
    expect(mapResendError(error)).toBe(SESSION_LOST_MESSAGE);
  });
});

describe("markTutorialComplete", () => {
  // FR-007: no backend endpoint exists for this (see registration.ts's doc comment) — the only
  // meaningful test is that the documented placeholder resolves without throwing. There is no
  // validation-error or backend-error path to cover since this function makes no network call.
  it("resolves without throwing (documented placeholder — no backend endpoint exists yet)", async () => {
    await expect(markTutorialComplete()).resolves.toBeUndefined();
  });
});
