// T019 (FR-007): pure TypeScript, no React/React Native/expo-secure-store imports (Constitution
// Principle IV) — this file owns the one piece of "decision logic" the first-run-tutorial
// feature actually has: how a user's completion state is keyed for local storage. The storage
// I/O itself (expo-secure-store on native, an Expo-specific web-storage adapter) is Expo/RN-
// specific and lives in src/lib/tutorial-storage.ts, which imports this module to build its
// keys rather than hardcoding the format inline — see that file's own comment.
//
// Why local storage at all, and why keyed by the Supabase *auth* user id specifically (not the
// backend's own User.id): see specs/001-registration-kyc/spec.md's 2026-08-04 re-scope and this
// feature's tasks.md T019 — the Draw-a-card backend has no endpoint for tutorial completion at
// all (confirmed against the backend repo's src/modules/identity/routes.ts: the full route set
// is /ping, /register, /register/business, /phone/verify, /phone/resend, /password-reset,
// POST /me/profile, GET /me/kyc-status — nothing tutorial-related), so
// `User.hasCompletedTutorial` (src/domain/types.ts) cannot be persisted server-side today.
// Backend `GET /identity/me/kyc-status` also never returns a backend User.id, and the dev-only
// `X-User-Id` header (src/lib/api.ts) is in-memory-only by design (spec.md Assumptions, finding
// 5) — so on a genuine cold boot, the backend's own user id is not reliably available at all,
// even though the Supabase session (and therefore its `session.user.id`) persists across
// restarts via expo-secure-store (src/lib/supabase-client.ts). Keying local tutorial-completion
// storage by the Supabase auth user id is therefore the only identifier this feature can rely on
// being present whenever there is a session to gate at all — see
// src/features/identity/useKycGate.ts for where that id is read and this key is used.
export function tutorialStorageKey(supabaseUserId: string): string {
  // expo-secure-store keys are restricted to [A-Za-z0-9._-] (colons and other punctuation throw
  // at runtime) — a plain dash-joined prefix keeps this key valid there while staying equally
  // usable as a plain string key for the web localStorage adapter (src/lib/tutorial-storage.ts),
  // which has no such restriction of its own.
  return `tutorial-complete-${supabaseUserId}`;
}
