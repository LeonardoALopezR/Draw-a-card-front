import { createApiClient } from "@/domain/api-client";
import { supabase } from "./supabase-client";

// STALE / NOW INERT (010-registration-redesign T014, plan.md Research Decision 7, corrected
// 2026-08-06) — kept as history, not as a current description of backend behavior. This header
// used to be how the backend's `/identity/me/*` and `/identity/phone/*` routes identified the
// caller in development/test (Draw-a-card backend repo, specs/001-user-registration-kyc/spec.md,
// "Known deviation: no authentication in this feature"; mirrored here in
// specs/001-registration-kyc/spec.md's Assumptions, finding 5). Backend `004-session-
// authentication` (`done`, merged 2026-08-06) **deleted that trust path entirely, in every
// NODE_ENV** — not just outside development/test as originally documented — and replaced it with
// real Bearer-JWT verification (`requireAuth`, the backend repo's src/shared/auth.ts). The real
// backend now identifies every caller from the `Authorization: Bearer <token>` header this same
// file already sends (see `getToken` below, unchanged) and simply ignores an `X-User-Id` header
// it no longer recognizes — sending it today is an inert no-op, not load-bearing and not a
// security hole.
//
// This module-level variable/the setCurrentUserId call sites/the "X-User-Id" header below are
// LEFT IN PLACE, unremoved, by this doc-correction task — auditing every call site and safely
// deleting the mechanism is a separable, small cleanup with zero user-visible effect against the
// real backend, out of scope for a screen-redesign feature (see plan.md Research Decision 7).
// Do not read this comment as an instruction that the mechanism still does anything; it does not.
let currentUserId: string | undefined;

export function setCurrentUserId(userId: string | undefined): void {
  currentUserId = userId;
}

export const api = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
  getToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  },
  getHeaders: () => (currentUserId ? { "X-User-Id": currentUserId } : undefined),
});
