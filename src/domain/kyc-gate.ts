// Pure TypeScript, no React/React Native imports (Constitution IV) — portable routing
// decision for the KYC/session gate. See plan.md's "Research Decision: KYC status gate"
// (REVISED 2026-08-04, decision B — resolves FR-009/FR-010) and tasks.md T005 (follow-up to
// T003). The caller (useKycGate, T010) is responsible for exposing *why* the route landed on
// "kyc-status" (user.kycStatus vs. statusFetchFailed) so KycStatusScreen (T018) can render the
// right copy — this function only decides *where*, not *what copy*.
import type { User } from "./types";

export type KycRoute =
  | "unauthenticated"
  | "verify-phone"
  | "profile"
  | "kyc-status"
  | "tutorial"
  | "main";

/**
 * Resolves which route the app should redirect to on cold boot / gate re-evaluation.
 *
 * Fail-safe precedence (FR-010): `statusFetchFailed` is checked BEFORE any property of
 * `user` is inspected, and wins even when a stale `user` object is still present (e.g. a
 * cached React Query value from before a refetch failed). A stale user's `kycStatus` could
 * be a stale "verified"/"pending" read from before the account was rejected server-side —
 * trusting it during a fetch failure could let an unverified or rejected user slip into
 * `"tutorial"`/`"main"`. Routing to `"kyc-status"` whenever the fetch failed, regardless of
 * what `user` says, means the app never silently grants main-app access on ambiguous/stale
 * data — it only ever *narrows* access under uncertainty, never widens it. This mirrors
 * spec.md's Edge Cases: "never silently fall through to the main app." This precedence is
 * unchanged by the 2026-08-04 re-scope (decision B) below — decision B only changes what a
 * *successfully fetched* `pending` status does, never what a *failed* fetch does.
 *
 * Branch order (decision B, 2026-08-04 re-scope — see plan.md's revised "KYC status gate"
 * Research Decision):
 * 1. No `user` → `"unauthenticated"`.
 * 2. `statusFetchFailed` → `"kyc-status"` (fail-safe, see above — checked before any `user`
 *    property, including phone/profile completeness).
 * 3. `!phoneVerifiedAt` → `"verify-phone"` (FR-002).
 * 4. Phone verified but profile incomplete (`!nombre || !apellidoPaterno`) → `"profile"`
 *    (FR-004) — this is what makes the "abandoned after phone verification" edge case
 *    resumable (spec.md Edge Cases) rather than forcing a re-register.
 * 5. `kycStatus: "rejected"` → `"kyc-status"` — the **only** `kycStatus` value that blocks
 *    main-app access now (decision B; was previously `"pending" | "rejected"`). Unreachable
 *    against the current backend (no code path produces `rejected` yet — see spec.md's
 *    "Deferred to feature 002"); built and unit-tested via mocked fixtures on purpose, not
 *    dead code.
 * 6. `kycStatus: "pending" | "verified"` → `"tutorial"` or `"main"` per `hasCompletedTutorial`
 *    (FR-007). `"pending"` now behaves identically to `"verified"` here (decision B) — this
 *    feature has no money-path screens for the backend's FR-006 KYC gate to protect yet, so
 *    there is nothing for a blocking screen to guard against a merely-`pending` account.
 */
export function resolveKycRoute(
  user:
    | Pick<
        User,
        | "kycStatus"
        | "hasCompletedTutorial"
        | "phoneVerifiedAt"
        | "nombre"
        | "apellidoPaterno"
      >
    | undefined,
  statusFetchFailed: boolean
): KycRoute {
  if (!user) {
    return "unauthenticated";
  }

  if (statusFetchFailed) {
    return "kyc-status";
  }

  if (!user.phoneVerifiedAt) {
    return "verify-phone";
  }

  if (!user.nombre || !user.apellidoPaterno) {
    return "profile";
  }

  if (user.kycStatus === "rejected") {
    return "kyc-status";
  }

  // kycStatus === "pending" | "verified" (decision B: both behave identically here)
  return user.hasCompletedTutorial ? "main" : "tutorial";
}
