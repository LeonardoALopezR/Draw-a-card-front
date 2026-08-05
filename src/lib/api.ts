import { createApiClient } from "@/domain/api-client";
import { supabase } from "./supabase-client";

// TEMPORARY — ripcord candidate once backend `003-session-authentication` ships. The backend's
// `/identity/me/*` and `/identity/phone/*` routes identify the caller via a dev-only X-User-Id
// request header stand-in, not real session/token verification (Draw-a-card backend repo,
// specs/001-user-registration-kyc/spec.md, "Known deviation: no authentication in this
// feature"; mirrored here in specs/001-registration-kyc/spec.md's Assumptions, finding 5). The
// backend trusts this header ONLY when its own NODE_ENV is exactly "development" or "test" —
// it fails closed (503 HeaderAuthNotAllowedInProduction) everywhere else, so sending it in a
// deployed environment is inert, not a security hole introduced by this file.
//
// This module-level variable is the ONLY place that tracks the backend's internal User.id
// (distinct from the Supabase session/access token above, which the backend does not verify at
// all yet for these routes). Callers must call setCurrentUserId(user.id) once after a
// successful registration/phone-verification/profile call (see src/domain/registration.ts's
// doc comments) and clear it (setCurrentUserId(undefined)) on sign-out.
//
// DELETE this entire mechanism — currentUserId, setCurrentUserId, and the "X-User-Id" header
// below — once backend 003-session-authentication ships and /identity/* routes read the caller
// from a verified session/token instead of a client-supplied header.
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
