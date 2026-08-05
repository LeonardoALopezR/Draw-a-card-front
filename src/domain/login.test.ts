// Covers 005-login FR-001 (email + password sign-in reusing signInWithPassword() unchanged) via
// src/domain/login.ts's submitSignIn(). Exercised through a hand-rolled SignInWithPassword mock
// (dependency injection — see login.ts's file-level comment for why this file never imports
// src/lib/supabase-client.ts directly), so no fetch/Supabase mocking is needed and the test
// stays pure Jest/TS.
import { submitSignIn, type SignInWithPassword } from "./login";

const validInput = { email: "ana@example.com", password: "any-password-at-all" };

describe("submitSignIn", () => {
  // FR-001: happy path — calls the injected signIn with the parsed email/password and returns
  // its `{ error: null }` result unchanged.
  it("calls signIn with the parsed email/password and returns its result unchanged (success)", async () => {
    let receivedEmail = "";
    let receivedPassword = "";
    const signIn: SignInWithPassword = async (email, password) => {
      receivedEmail = email;
      receivedPassword = password;
      return { error: null };
    };

    const result = await submitSignIn(signIn, validInput);

    expect(receivedEmail).toBe(validInput.email);
    expect(receivedPassword).toBe(validInput.password);
    expect(result).toEqual({ error: null });
  });

  // FR-001: signIn's error result (e.g. Supabase's own credentials-rejection message, or
  // NETWORK_SIGN_IN_ERROR_MESSAGE for a network-level failure) is returned unchanged, not
  // reinterpreted or wrapped.
  it("returns signIn's error result unchanged (failure)", async () => {
    const signIn: SignInWithPassword = async () => ({ error: "Invalid login credentials" });

    const result = await submitSignIn(signIn, validInput);

    expect(result).toEqual({ error: "Invalid login credentials" });
  });

  // FR-001: an invalid input (malformed email) is rejected by signInSchema before signIn is
  // ever called — no network/SDK call is made for input that can't possibly be valid.
  it("rejects an invalid input (bad email) before signIn is ever called", async () => {
    let signInCalled = false;
    const signIn: SignInWithPassword = async () => {
      signInCalled = true;
      return { error: null };
    };

    await expect(
      submitSignIn(signIn, { ...validInput, email: "not-an-email" })
    ).rejects.toThrow();

    expect(signInCalled).toBe(false);
  });
});
