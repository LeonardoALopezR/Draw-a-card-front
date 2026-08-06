// Pure TypeScript, no React/React Native imports (Constitution Principle IV) — same
// dependency-injection pattern as registration.ts/profile.ts: every exported function here takes
// a configured `ApiClient` (src/domain/api-client.ts) rather than importing src/lib/api.ts
// directly, keeping this module portable to any future TypeScript/React web codebase.
//
// PLANNING ASSUMPTION, NOT A CONFIRMED CONTRACT (010-registration-redesign plan.md Research
// Decision 5, spec.md Assumptions/Key Entities): backend `015-registration-profile-support`
// (which owns the nationality catalog, its User Story 1) has no spec of its own yet as of this
// writing. The endpoint path and response shape below are this feature's best planning guess at
// where that catalog will live — confirmed against no real backend source, unlike every call in
// registration.ts/profile.ts, which are cross-checked against the backend repo directly. MUST be
// reconciled once `015` has a real spec. Until then, this function's real-network behavior is
// explicitly [BLOCKED-ON-015] (see specs/010-registration-redesign/tasks.md T010) — it is fully
// buildable and unit-testable today against a mocked ApiClient, which is all this task covers.
import type { ApiClient } from "./api-client";

export interface NationalityOption {
  value: string;
  label: string;
}

// spec.md FR-012: never a static, hardcoded list baked into the app — always the backend
// catalog, so it stays a single, server-editable source of truth. See this file's top comment
// for why the exact path below is provisional.
export async function fetchNationalities(client: ApiClient): Promise<NationalityOption[]> {
  return client<NationalityOption[]>("/identity/nationalities", { method: "GET" });
}
