// T010: wires the Supabase session + the backend's current-status signal to the pure
// resolveKycRoute() gate (src/domain/kyc-gate.ts, T005). All *routing logic* stays in that
// already-tested pure function (Constitution Principle IV) — this hook only fetches the data
// resolveKycRoute() needs and hands it over; it must not re-implement or duplicate any branch
// decision itself.
//
// Known, real backend limitation (see src/domain/registration.ts's fetchCurrentUser() doc
// comment and specs/001-registration-kyc/spec.md's Assumptions, finding 5): the backend has no
// GET /identity/me endpoint returning the full profile (phoneVerifiedAt, nombre,
// apellidoPaterno, etc.) — only GET /identity/me/kyc-status (kycStatus only), gated behind the
// dev-only X-User-Id header that is never persisted across app restarts by design (constraint:
// do not make that header mechanism more automatic/pervasive than necessary — this hook never
// calls setCurrentUserId itself). Concretely this means:
//   - On a genuine cold boot (fresh JS process, no prior in-session registration/verification/
//     profile call), the current-user fetch is expected to fail even though the Supabase session
//     itself is still valid. That failure is surfaced as `statusFetchFailed: true` (FR-010's
//     retryable error state — "couldn't load your verification status", never a silent
//     pass-through), not as `unauthenticated` and not as a fabricated "verified"/"pending" guess.
//   - Within the same JS session (e.g. right after registering), the fetch succeeds and its
//     fresh `kycStatus` is layered on top of whatever fuller profile is already cached under
//     `currentUserQueryKey` by that registration/verification/profile call (T011+ — out of this
//     task's scope to wire the write side of, but this hook's read side is forward-compatible
//     with it via the shared query key).
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

import { fetchCurrentUser } from "@/domain/registration";
import { resolveKycRoute, type KycRoute } from "@/domain/kyc-gate";
import type { KycStatus, User } from "@/domain/types";
import { api, setCurrentUserId } from "@/lib/api";
import { supabase } from "@/lib/supabase-client";
import { getHasCompletedTutorial } from "@/lib/tutorial-storage";

// Shared across this hook and, later, whichever screens/mutations populate the fuller profile
// (T011+) — keep this the single source of truth for the cache key rather than hardcoding the
// string array at each call site.
export const currentUserQueryKey = ["identity", "currentUser"] as const;

// T018 adds "kycRejectionReason" — KycStatusScreen's "rejected" branch reads it (see this
// hook's return value below). No backend field exists to populate it from yet (see
// src/domain/types.ts's own doc comment on User.kycRejectionReason — the backend's current
// 001-user-registration-kyc feature has no "rejected" path at all), so this will always resolve
// to `null` against the real backend today; it's read here, not fabricated, so the wiring is
// forward-compatible with backend 002 the moment that field exists.
type GateUser = Pick<
  User,
  | "kycStatus"
  | "hasCompletedTutorial"
  | "phoneVerifiedAt"
  | "nombre"
  | "apellidoPaterno"
  | "kycRejectionReason"
>;

// Fed to resolveKycRoute() only when a session exists but the current-user query has errored
// (or hasn't resolved any real data yet) — its field values are never actually read in that
// case, because resolveKycRoute()'s fail-safe precedence (src/domain/kyc-gate.ts) checks
// `statusFetchFailed` immediately after the `!user` check, before any other property. This
// placeholder exists only so a *known-logged-in* caller (a real Supabase session) takes the
// "we have a user but don't know their status" (`kyc-status`) branch instead of the
// no-session-at-all (`unauthenticated`) branch, which `resolveKycRoute` would otherwise select
// for `undefined` regardless of `statusFetchFailed`.
const UNKNOWN_GATE_USER: GateUser = {
  kycStatus: "pending",
  hasCompletedTutorial: false,
  phoneVerifiedAt: null,
  nombre: null,
  apellidoPaterno: null,
  kycRejectionReason: null,
};

// Where app/_layout.tsx should <Redirect> a resolved, non-"main" route to. Route groups
// ((auth), (onboarding)) are transparent to the URL in expo-router, so no group prefix here —
// see plan.md's Project Structure for the underlying file paths.
export const KYC_ROUTE_TARGETS: Record<Exclude<KycRoute, "main">, string> = {
  unauthenticated: "/login",
  "verify-phone": "/verify-phone",
  profile: "/profile",
  "kyc-status": "/kyc-status",
  tutorial: "/tutorial",
};

export interface UseKycGateResult {
  route: KycRoute | undefined;
  isLoading: boolean;
  kycStatus: KycStatus | undefined;
  statusFetchFailed: boolean;
  // T018: read by KycStatusScreen's "rejected" branch — see GateUser's doc comment above for why
  // this is always `null` against the real backend today.
  kycRejectionReason: string | null | undefined;
  // T018: re-triggers the current-user query (FR-010's "couldn't load your verification status"
  // retry action) — a thin pass-through to React Query's own refetch, not a new fetch mechanism.
  // Exposed here (rather than having KycStatusScreen/kyc-status.tsx reach into React Query
  // directly) so this hook stays the single place that owns the query's lifecycle.
  refetchStatus: () => void;
  isRefetching: boolean;
}

export function useKycGate(): UseKycGateResult {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  // T034 (2026-08-04, found by manual iOS-simulator testing against a live local backend):
  // supabase.auth.getSession() below only *resolves* with { data: { session } } in the common
  // case, but — like signInWithPassword (src/lib/supabase-client.ts's sibling T034 fix) — it can
  // *reject* on a network-level failure while refreshing an expired token (unreachable host,
  // offline, timeout). Before this fix, the getSession().then(...) call below had no .catch,
  // so a rejection here silently discarded the promise: setSessionResolved(true) never ran,
  // isLoading (below) stayed true forever, and the app was left on an infinite loading spinner
  // on cold boot rather than crashing OR routing anywhere. This flag lets that failure resolve
  // instead of wedging — see hasSession/statusFetchFailed below for how it fails closed to the
  // same retryable "kyc-status" state FR-010 already defines for a current-user-fetch failure,
  // rather than a false "unauthenticated" that would strand a genuinely logged-in user.
  const [sessionCheckFailed, setSessionCheckFailed] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setSessionResolved(true);
      })
      .catch(() => {
        if (!active) return;
        setSessionCheckFailed(true);
        setSessionResolved(true);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      setSessionResolved(true);
      // A real auth-state event is an authoritative, non-network-call signal (Supabase's local
      // event emitter, not a fetch) — clear any earlier session-check failure so a transient
      // network blip on cold boot doesn't keep forcing the fail-closed path once we genuinely
      // know the session state.
      setSessionCheckFailed(false);
      // T033 (2026-08-04, found by code-reviewer's second review, Finding 1 BLOCKING): this hook
      // is mounted once at the root layout and is the one place in this app that observes every
      // Supabase auth state transition, which makes it the correct single place to clear the
      // backend's dev-only X-User-Id identifier (src/lib/api.ts's setCurrentUserId) whenever a
      // session is lost — covers an explicit sign-out as well as any other transition that
      // leaves no session, so a stale backend user id can never leak into a request made by
      // whichever user's session comes next in this same JS process. Deliberately does NOT set
      // it on a *found* session here — a Supabase session alone only carries the
      // authProviderId, not the backend's own User.id; the one place that id is genuinely
      // confirmed is a successful registration response (app/(auth)/register.tsx), not a bare
      // session read. This keeps the mechanism to exactly "one set, one clear" per tasks.md's
      // explicit constraint, rather than making it more pervasive.
      if (!newSession) {
        setCurrentUserId(undefined);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // T034: sessionCheckFailed forces hasSession true even though `session` itself is still null —
  // we genuinely don't know whether a session exists (the check that would tell us failed at the
  // network level), and per FR-010's existing fail-closed precedent (see UNKNOWN_GATE_USER below)
  // "unknown" must never resolve to the same route as "confirmed no session".
  const hasSession = sessionResolved && (session !== null || sessionCheckFailed);
  // T019: the Supabase *auth* user id — the only identifier reliably present on a cold boot (see
  // src/domain/tutorial.ts's doc comment for why the backend's own User.id is not). Read here,
  // not inside a domain module, since resolving it requires the Supabase session, which
  // src/domain must never import (Constitution IV).
  const supabaseUserId = session?.user.id;

  const userQuery = useQuery<GateUser>({
    queryKey: currentUserQueryKey,
    queryFn: async () => {
      const { kycStatus } = await fetchCurrentUser(api);
      const cached = queryClient.getQueryData<GateUser>(currentUserQueryKey);
      // T019 (FR-007): layers the locally-persisted tutorial-completion flag (src/lib/
      // tutorial-storage.ts) on top of whatever's cached, since neither this backend endpoint
      // nor toDomainUser() (src/domain/registration.ts) has a real value for it — see this
      // hook's file-level comment and progress/impl_001-registration-kyc.md Run 9 for exactly
      // where this read happens and why it's here rather than in toDomainUser itself (a pure
      // src/domain function that cannot import expo-secure-store). TutorialScreen's completion
      // handler (src/features/identity/TutorialScreen.tsx) writes the flag this reads and then
      // invalidates currentUserQueryKey so this queryFn re-runs and picks it up.
      const hasCompletedTutorial = supabaseUserId
        ? await getHasCompletedTutorial(supabaseUserId)
        : (cached?.hasCompletedTutorial ?? false);
      return { ...(cached ?? {}), kycStatus, hasCompletedTutorial };
    },
    enabled: hasSession,
    retry: false,
  });

  // Loading until the session check itself resolves, and — only when a session exists — until
  // the current-user query has settled (success or error) at least once. A session-less caller
  // never waits on the query at all, so "unauthenticated" resolves as soon as the session check
  // completes, not after an irrelevant fetch.
  const isLoading = !sessionResolved || (hasSession && userQuery.isLoading);
  // T034: sessionCheckFailed always forces this true (once hasSession is also forced true above)
  // regardless of userQuery's own outcome — a session check that failed at the network level is
  // itself a "couldn't determine your status" condition, independent of whether the current-user
  // fetch that follows happens to succeed or fail on its own.
  const statusFetchFailed = hasSession && (sessionCheckFailed || userQuery.isError);
  // See UNKNOWN_GATE_USER's doc comment: a session that exists but hasn't yet produced real
  // user data (still fetching, or the fetch errored) must still be treated as "a user exists"
  // by resolveKycRoute, not as "no user at all" — otherwise a genuinely logged-in caller whose
  // status fetch merely failed would be misrouted to "unauthenticated" instead of FR-010's
  // retryable "kyc-status" error state.
  const user = hasSession ? (userQuery.data ?? UNKNOWN_GATE_USER) : undefined;
  const route = isLoading ? undefined : resolveKycRoute(user, statusFetchFailed);

  return {
    route,
    isLoading,
    kycStatus: userQuery.data?.kycStatus,
    statusFetchFailed,
    kycRejectionReason: userQuery.data?.kycRejectionReason,
    refetchStatus: () => {
      void userQuery.refetch();
    },
    isRefetching: userQuery.isRefetching,
  };
}
