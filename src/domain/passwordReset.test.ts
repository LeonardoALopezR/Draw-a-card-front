// Covers 005-login FR-007 (request a password-reset code by email) and FR-008 (submit the
// emailed code + a new password, without ever establishing a session visible to the app's
// shared/ambient Supabase client) via src/domain/passwordReset.ts's requestPasswordReset() and
// submitNewPassword(). Exercised entirely through hand-rolled DI mocks (dependency injection —
// see passwordReset.ts's file-level comment for why this file never imports
// src/lib/supabase-client.ts directly), so no fetch/Supabase mocking is needed and the test
// stays pure Jest/TS, mirroring login.test.ts's pattern exactly.
import {
  requestPasswordReset,
  submitNewPassword,
  type DiscardRecoverySession,
  type RequestPasswordReset,
  type UpdateRecoveryPassword,
  type VerifyRecoveryCode,
} from "./passwordReset";

describe("requestPasswordReset", () => {
  const validInput = { email: "ana@example.com" };

  // FR-007: happy path — calls the injected `request` with the parsed email and returns its
  // result unchanged.
  it("calls request with the parsed email and returns its result unchanged", async () => {
    let receivedEmail = "";
    const request: RequestPasswordReset = async (email) => {
      receivedEmail = email;
      return { error: null };
    };

    const result = await requestPasswordReset(request, validInput);

    expect(receivedEmail).toBe(validInput.email);
    expect(result).toEqual({ error: null });
  });

  // FR-007: an invalid input (malformed email) is rejected by requestPasswordResetSchema before
  // `request` is ever called — no network/SDK call is made for input that can't possibly be
  // valid.
  it("rejects an invalid email before request is ever called", async () => {
    let requestCalled = false;
    const request: RequestPasswordReset = async () => {
      requestCalled = true;
      return { error: null };
    };

    await expect(
      requestPasswordReset(request, { email: "not-an-email" })
    ).rejects.toThrow();

    expect(requestCalled).toBe(false);
  });
});

describe("submitNewPassword", () => {
  const validInput = { email: "ana@example.com", code: "123456", password: "supersecret1" };

  // FR-008: the full happy path — verifyCode succeeds, updatePassword is called with the parsed
  // password, discard is called exactly once (in the always-runs cleanup step), and
  // updatePassword's own result is returned.
  it("verify -> update -> discard happy path returns updatePassword's result and calls discard exactly once", async () => {
    let verifyCalls = 0;
    let updateCalls = 0;
    let discardCalls = 0;
    let receivedPassword = "";

    const verifyCode: VerifyRecoveryCode = async () => {
      verifyCalls += 1;
      return { error: null };
    };
    const updatePassword: UpdateRecoveryPassword = async (newPassword) => {
      updateCalls += 1;
      receivedPassword = newPassword;
      return { error: null };
    };
    const discard: DiscardRecoverySession = async () => {
      discardCalls += 1;
    };

    const result = await submitNewPassword({ verifyCode, updatePassword, discard }, validInput);

    expect(verifyCalls).toBe(1);
    expect(updateCalls).toBe(1);
    expect(receivedPassword).toBe(validInput.password);
    expect(discardCalls).toBe(1);
    expect(result).toEqual({ error: null });
  });

  // FR-008: a verifyCode failure (wrong/expired code) must return that error WITHOUT ever
  // calling updatePassword, but discard must still run (cleanup happens regardless).
  it("on a verifyCode failure, never calls updatePassword but still calls discard", async () => {
    let updateCalls = 0;
    let discardCalls = 0;

    const verifyCode: VerifyRecoveryCode = async () => ({ error: "Invalid or expired code" });
    const updatePassword: UpdateRecoveryPassword = async () => {
      updateCalls += 1;
      return { error: null };
    };
    const discard: DiscardRecoverySession = async () => {
      discardCalls += 1;
    };

    const result = await submitNewPassword({ verifyCode, updatePassword, discard }, validInput);

    expect(updateCalls).toBe(0);
    expect(discardCalls).toBe(1);
    expect(result).toEqual({ error: "Invalid or expired code" });
  });

  // FR-008: an updatePassword failure AFTER a successful verifyCode must still run discard
  // (the throwaway session must never linger regardless of updatePassword's outcome), and the
  // returned result is updatePassword's own error.
  it("on an updatePassword failure after a successful verifyCode, still calls discard", async () => {
    let discardCalls = 0;

    const verifyCode: VerifyRecoveryCode = async () => ({ error: null });
    const updatePassword: UpdateRecoveryPassword = async () => ({
      error: "Could not update password",
    });
    const discard: DiscardRecoverySession = async () => {
      discardCalls += 1;
    };

    const result = await submitNewPassword({ verifyCode, updatePassword, discard }, validInput);

    expect(discardCalls).toBe(1);
    expect(result).toEqual({ error: "Could not update password" });
  });

  // FR-008: an invalid input (e.g. a malformed code) is rejected by resetPasswordWithCodeSchema
  // before verifyCode is ever called.
  it("rejects an invalid input (malformed code) before verifyCode is ever called", async () => {
    let verifyCalled = false;
    const verifyCode: VerifyRecoveryCode = async () => {
      verifyCalled = true;
      return { error: null };
    };
    const updatePassword: UpdateRecoveryPassword = async () => ({ error: null });
    const discard: DiscardRecoverySession = async () => {};

    await expect(
      submitNewPassword(
        { verifyCode, updatePassword, discard },
        { ...validInput, code: "not-digits" }
      )
    ).rejects.toThrow();

    expect(verifyCalled).toBe(false);
  });
});
