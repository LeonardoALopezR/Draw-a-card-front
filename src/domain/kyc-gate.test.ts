// Covers FR-002 (phone verification gating the profile step), FR-004 (profile step
// resumability), FR-007 (first-run tutorial shown only once), FR-009 (routing gate —
// verify-phone/profile/tutorial/main/kyc-status, "pending" passes through per decision B,
// "rejected" blocks), and FR-010 (retryable error state on kycStatus fetch failure never
// silently granting/denying main-app access) via resolveKycRoute()'s branch matrix, per
// plan.md's "Research Decision: KYC status gate" (REVISED 2026-08-04, decision B) and
// tasks.md T005 (follow-up to T003).
import { resolveKycRoute } from "./kyc-gate";

// A fully-complete user (phone verified, profile complete) used as a base for tests that only
// care about kycStatus/hasCompletedTutorial — avoids repeating every field in each case.
const completeUser = {
  phoneVerifiedAt: "2026-08-01T00:00:00.000Z",
  nombre: "Ana",
  apellidoPaterno: "Garcia",
};

describe("resolveKycRoute", () => {
  // FR-009/FR-010: no session at all routes to the unauthenticated flow, not a status screen.
  it("routes to unauthenticated when there is no user", () => {
    expect(resolveKycRoute(undefined, false)).toBe("unauthenticated");
  });

  // FR-002: a returning user who hasn't verified their phone yet is routed to verify-phone,
  // not straight through to profile/tutorial/main.
  it("routes to verify-phone when phoneVerifiedAt is not set", () => {
    expect(
      resolveKycRoute(
        {
          ...completeUser,
          phoneVerifiedAt: null,
          kycStatus: "pending",
          hasCompletedTutorial: false,
        },
        false
      )
    ).toBe("verify-phone");
  });

  // FR-004/Edge Cases: a user who verified their phone but abandoned registration before
  // submitting the profile step is resumed directly at "profile" on return, not forced back
  // through registration or phone verification.
  it("routes to profile when phone is verified but nombre/apellidoPaterno are missing", () => {
    expect(
      resolveKycRoute(
        {
          phoneVerifiedAt: "2026-08-01T00:00:00.000Z",
          nombre: null,
          apellidoPaterno: null,
          kycStatus: "pending",
          hasCompletedTutorial: false,
        },
        false
      )
    ).toBe("profile");
  });

  it("routes to profile when nombre is present but apellidoPaterno is still missing", () => {
    expect(
      resolveKycRoute(
        {
          phoneVerifiedAt: "2026-08-01T00:00:00.000Z",
          nombre: "Ana",
          apellidoPaterno: null,
          kycStatus: "pending",
          hasCompletedTutorial: false,
        },
        false
      )
    ).toBe("profile");
  });

  // Decision B (2026-08-04 re-scope): kycStatus "pending" now passes through to the
  // tutorial/main app instead of blocking on kyc-status — this feature has no money-path
  // screens for the backend's FR-006 KYC gate to protect yet.
  it("routes to tutorial when kycStatus is pending, phone/profile complete, and the tutorial is not complete", () => {
    expect(
      resolveKycRoute(
        { ...completeUser, kycStatus: "pending", hasCompletedTutorial: false },
        false
      )
    ).toBe("tutorial");
  });

  it("routes to main when kycStatus is pending, phone/profile complete, and the tutorial is complete", () => {
    expect(
      resolveKycRoute(
        { ...completeUser, kycStatus: "pending", hasCompletedTutorial: true },
        false
      )
    ).toBe("main");
  });

  // FR-007: a verified user who hasn't completed the first-run tutorial is routed there
  // instead of straight to the main app.
  it("routes to tutorial when kycStatus is verified and the tutorial is not complete", () => {
    expect(
      resolveKycRoute(
        { ...completeUser, kycStatus: "verified", hasCompletedTutorial: false },
        false
      )
    ).toBe("tutorial");
  });

  // FR-007: once verified and the tutorial is complete, the main app is reachable.
  it("routes to main when kycStatus is verified and the tutorial is complete", () => {
    expect(
      resolveKycRoute(
        { ...completeUser, kycStatus: "verified", hasCompletedTutorial: true },
        false
      )
    ).toBe("main");
  });

  // FR-009 (decision B): "rejected" is now the *only* kycStatus value that blocks main-app
  // access. Unreachable against the current backend (no code path produces "rejected" yet —
  // see spec.md's "Deferred to feature 002"); this is a deliberate mocked-fixture test for
  // forward compatibility with backend 002, not dead code.
  it("routes to kyc-status when kycStatus is rejected, even with phone/profile complete", () => {
    expect(
      resolveKycRoute(
        { ...completeUser, kycStatus: "rejected", hasCompletedTutorial: true },
        false
      )
    ).toBe("kyc-status");
  });

  // FR-010: a failed status fetch is a distinct retryable error state, routed through the
  // same "kyc-status" screen (which branches on the error case internally, per plan.md).
  it("routes to kyc-status when the status fetch failed, even with a verified+tutorial-complete user", () => {
    expect(
      resolveKycRoute(
        { ...completeUser, kycStatus: "verified", hasCompletedTutorial: true },
        true
      )
    ).toBe("kyc-status");
  });

  // Fail-safe precedence (see kyc-gate.ts's doc comment): a stale cached user must not leak
  // into "tutorial"/"main" just because a fetch failure raced with an out-of-date cache
  // value — statusFetchFailed always wins over any property of `user`, including a stale
  // "pending" status (decision B changes what a *successful* pending fetch does, never what
  // a *failed* fetch does). The gate may only ever narrow access under uncertainty, never
  // widen it.
  it("prefers the fail-safe kyc-status route over a stale verified+tutorial-complete user when the fetch fails", () => {
    const staleVerifiedUser = {
      ...completeUser,
      kycStatus: "verified" as const,
      hasCompletedTutorial: true,
    };
    expect(resolveKycRoute(staleVerifiedUser, true)).toBe("kyc-status");
  });

  it("prefers the fail-safe kyc-status route over a stale pending user, not just a stale verified one", () => {
    const stalePendingUser = {
      ...completeUser,
      kycStatus: "pending" as const,
      hasCompletedTutorial: true,
    };
    expect(resolveKycRoute(stalePendingUser, true)).toBe("kyc-status");
  });

  // Fail-safe precedence also holds before phone/profile completeness is even checked — an
  // incomplete, unverified stale user must not somehow be treated as verify-phone/profile
  // when the fetch itself failed.
  it("prefers the fail-safe kyc-status route even when phone is not verified", () => {
    expect(
      resolveKycRoute(
        {
          phoneVerifiedAt: null,
          nombre: null,
          apellidoPaterno: null,
          kycStatus: "pending",
          hasCompletedTutorial: false,
        },
        true
      )
    ).toBe("kyc-status");
  });
});
