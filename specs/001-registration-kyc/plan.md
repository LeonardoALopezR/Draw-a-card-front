# Implementation Plan: Registration & KYC

**Branch**: `001-registration-kyc` | **Date**: 2026-08-04 (amended 2026-08-04, re-scope) | **Spec**: `specs/001-registration-kyc/spec.md`

**Input**: Feature specification from `specs/001-registration-kyc/spec.md`

**Note**: This plan folds Phase 0 (research) and Phase 1 (data model / quickstart) into this
single file rather than separate `research.md`/`data-model.md`/`quickstart.md` documents —
this is the first feature in the repo and there is no interface-contract surface beyond the
backend's own REST API (already specified in the backend repo), so a `/contracts/` directory
would only duplicate that. Revisit this decision (split into separate files) once a feature
has a genuinely large research/data-model surface that makes one file unwieldy.

## Amendment note (2026-08-04 re-scope)

This plan was amended after `task-implementer`'s backend cross-check (during implementation of
T001–T003) found the originally-approved spec targeted a backend scope that no longer exists.
See `spec.md`'s Clarifications ("Session 2026-08-04 (re-scope...)") for the full findings and
decisions. This amendment:

- Replaces the "Presigned upload flow" Research Decision with a deferred note (moved to
  feature 002, reasoning preserved).
- Adds a "Profile step" Research Decision (new — resolves the rewritten FR-004).
- Revises the "KYC status gate" Research Decision per decision B (pending passes through;
  adds `verify-phone`/`profile` routing states to make the abandoned-mid-registration edge
  case resumable).
- Updates Project Structure: removes document-upload files, adds the profile-step screen +
  domain module.
- Updates Data Model: adds the backend-mirroring `User` fields; states `IdentityDocument` is
  **removed** from `src/domain/types.ts` (not kept as a forward declaration — see that
  section for why).

T001–T003 were already implemented and reviewed before this re-scope; this amendment does not
retroactively invalidate that work, but T002's `IdentityDocument` addition and T003's
`resolveKycRoute()` both need follow-up tasks (see `tasks.md`) to align with the decisions
above — those follow-ups are new tasks, not edits to T001–T003 themselves.

## Summary

Registration (email/password/phone/username) + phone verification + a typed profile-fields
step (name, birth date, nationality, CURP, RFC, ToS/privacy acceptance) + first-run tutorial,
for both personal and Tienda (business) accounts — plus a single deterministic routing gate
that sends a returning user to whichever step they haven't completed yet, and blocks the main
app only for `kycStatus: rejected` or a `kycStatus` fetch failure (not `pending` — see
`spec.md`'s 2026-08-04 re-scope, decision B). One Expo codebase, one set of expo-router
screens, with platform variance isolated via the `.ios.tsx`/`.android.tsx`/`.web.tsx`
convention only where the spec's Platform notes say behavior actually differs (SMS autofill;
document capture UI moved to feature 002, so it no longer applies here).

## Technical Context

**Language/Version**: TypeScript (strict mode), Node 20 (per `.nvmrc`)

**Primary Dependencies**: Expo SDK 51 + expo-router, React Query (TanStack Query) v5,
React Hook Form + Zod, `@supabase/supabase-js`, `expo-secure-store` — all already in
`package.json`. `expo-camera`/`expo-image-picker` remain installed (repo-wide dependency list)
but this feature no longer has any task that uses them — see feature 002. No new runtime
dependency is required for the registration/profile flow itself.

**Storage**: N/A directly (Constitution II) — all persistence is via the backend API; the
only client-side storage is the Supabase session (via `expo-secure-store` on native, SDK
default on web, already wired in `src/lib/supabase-client.ts`).

**Testing**: Jest + `jest-expo` + `@testing-library/react-native`, installed by this feature's
T001 (already `[X]`). `npm test` exists; `init.sh`'s Tests stage is at OK.

**Target Platform**: iOS, Android, and web (react-native-web) from the one Expo codebase
(Constitution I).

**Project Type**: Single Expo (React Native) app — `app/` (expo-router screens),
`src/domain` (portable logic), `src/lib` (Expo/RN adapters), `src/features/identity` (UI).

**Performance Goals**: No numeric latency target beyond SC-001 (end-to-end flow under 5
active minutes). Standard React Query defaults (no custom staleTime tuning needed for this
feature).

**Constraints**: Backend `/identity/me/*`/`/identity/phone/*` authenticate via a dev-only
`X-User-Id` header stand-in (no real session/token verification) until backend
`003-session-authentication` ships — see `spec.md`'s Assumptions, finding 5. This feature does
not attempt to solve that; it is a recorded constraint on every authenticated call this
feature's `src/domain` modules make.

**Scale/Scope**: 3 user stories (personal registration, business registration, session
persistence) plus the routing gate (FR-009/FR-010) that applies across all of them; ~8
screens total (see Project Structure below) — one fewer document-upload-related screen than
before the re-scope, one more profile-step screen.

## Constitution Check

*GATE: Must pass before task breakdown. Re-checked after Phase 1 design below.*

| Principle | Check | Status |
|---|---|---|
| I. One Codebase, Three Targets | All screens live under one `app/` tree; web/iOS/Android differences are file-extension variants of the same route, not separate apps | PASS |
| II. Backend Is the Source of Truth | All reads/writes (account creation, phone verification, profile submission) go through the backend API via `src/domain/api-client.ts` / `src/lib/api.ts`. **Simplified by the re-scope**: this feature no longer has a presigned-URL/object-storage exception to justify at all — that concern moved entirely to feature 002, which will need its own justification when it's spec'd. | PASS (no exception needed) |
| III. Auth Goes Through the Provider SDK | Email/password create + session handled by `supabase.auth.*` in `src/lib/supabase-client.ts`; the app never implements password hashing or session logic itself. Phone verification code and profile submission are KYC-domain concepts (backend-issued/collected, not Supabase Auth primitives), so they go through the backend API, not the auth SDK — intentional, does not violate Principle III, which scopes to login/registration/session/password-reset primitives specifically. | PASS |
| IV. Business Logic Stays Portable | Validation (Zod schemas), API calls, and the routing decision (`resolveKycRoute`) all live in `src/domain`/`src/lib`; screens under `app/` and components under `src/features/identity` only render and call into those. Platform variance (SMS autofill) isolated via `.ios.tsx`/`.android.tsx`. | PASS |
| V. Screen/Component Structure Mirrors Product Domains | All new UI lives under `src/features/identity/`, matching the backend's `identity` module. | PASS |
| VI. Spec Before Code, One Spec Per Feature | Single `spec.md` covers personal + business + platform notes inline, with the deferred document-handling scope clearly marked as belonging to feature 002 rather than spread across two half-specs. | PASS |
| VII. Accessible and Responsive by Default | Forms/screens use RN accessibility props (labels, roles, min 44x44 tap targets) and are laid out to work at 375px web width through tablet/desktop — captured as explicit tasks, not left implicit. | PASS (verified at task level) |
| VIII. Local-First Development | Flow is built against the local backend (`docker compose up` in the `Draw-a-card` backend repo), which now genuinely implements the endpoints this feature calls (backend `001` is `done`, 117 tests passing) — no mocking needed at the domain boundary for this feature's own calls. | PASS |

No violations requiring a Complexity Tracking entry.

## Research Decisions

### Presigned upload flow — DEFERRED to feature 002 (2026-08-04)

**This decision no longer applies to this feature.** Preserved verbatim below (not deleted)
so feature 002's `spec-writer`/`plan.md` author can reuse the reasoning without re-deriving
it — the backend genuinely has no presign endpoint, no object storage, and no KYC provider
today (see `spec.md`'s 2026-08-04 re-scope finding 1); this decision was written before that
was known.

> - **Decision**: Three backend calls per document, all through `src/domain/api-client.ts`:
>   1. `POST /kyc/documents/presign` with `{ documentType, contentType, fileSizeBytes }` →
>      returns `{ documentId, uploadUrl, uploadMethod: "PUT", uploadHeaders, expiresAt }`.
>   2. Client performs the raw `PUT uploadUrl` with the file bytes and `uploadHeaders`
>      directly (not through `apiClient`, since this call is unauthenticated-by-design — the
>      presigned URL itself is the credential, and it must not carry the app's bearer token).
>   3. `POST /kyc/documents/{documentId}/complete` (no body, or `{ success: true }`) so the
>      backend marks the document received and (per its own spec) kicks off the KYC review
>      pipeline.
> - **Rationale**: Keeps the backend as the sole issuer/gatekeeper of storage access
>   (Constitution II) while avoiding routing multi-megabyte binary uploads through the app's
>   own API server.
> - **Alternatives considered**: Proxying the upload through the backend (app → backend →
>   storage) — rejected, adds backend load and latency for no benefit when presigned URLs are
>   already the stated design; direct client SDK to a storage provider — rejected outright,
>   violates Constitution II (no direct S3 access).

### Profile step (resolves the rewritten FR-004) — NEW, 2026-08-04

- **Decision**: A single backend call, `POST /identity/me/profile`, wrapped by a new
  `src/domain/profile.ts::submitProfile(input: ProfileFormInput)`. `ProfileFormInput` (new
  Zod schema, `src/domain/schemas.ts`) covers `nombre`/`apellidoPaterno` (required),
  `apellidoMaterno`/birth date/nationality/CURP/RFC (optional at the schema level except
  where the backend requires them), `acceptedTerms`/`acceptedPrivacyPolicy`
  (`z.literal(true)`), plus, conditionally, `commercialName`/`fiscalAddress`/a business `rfc`
  for Tienda accounts (FR-003). One screen, `app/(auth)/profile.tsx`, renders
  `src/features/identity/ProfileForm.tsx`, reachable only when the routing gate (below)
  resolves to `"profile"` — i.e., only once `phoneVerifiedAt` is set.
- **Rationale**: Matches the backend's real, already-implemented multi-step contract exactly
  (backend spec Clarifications, Session 2026-08-03 mid-implementation correction) rather than
  this feature's originally-assumed atomic two-step flow.
- **Alternatives considered**: Collecting profile fields at the same screen as initial
  registration (atomic call) — rejected outright, the backend rejects profile fields at
  `POST /identity/register` (backend FR-001); folding profile fields into the phone-
  verification screen — rejected, conflates two independently-gated backend calls into one
  screen for no benefit and complicates the resumability edge case (a user who verified their
  phone but didn't finish the profile step needs a distinct, directly-navigable screen to
  resume at).

### KYC status gate (resolves FR-009/FR-010) — REVISED 2026-08-04 (decision B)

- **Decision**: `src/domain/kyc-gate.ts`'s `resolveKycRoute()` (already implemented, T003) is
  amended (new task, see `tasks.md`) to:
  - Widen its route union from `"unauthenticated" | "kyc-status" | "tutorial" | "main"` to
    `"unauthenticated" | "verify-phone" | "profile" | "kyc-status" | "tutorial" | "main"`.
  - Widen its `user` input to also read `phoneVerifiedAt`, `nombre`, `apellidoPaterno` (a
    profile is "complete" when both `nombre` and `apellidoPaterno` are present, mirroring the
    backend's two required profile fields).
  - Change branch order: no user → `unauthenticated`; `statusFetchFailed` → `kyc-status`
    (unchanged — still fail-closed under uncertainty, per FR-010, regardless of any other
    field); user present but `!phoneVerifiedAt` → `verify-phone`; phone verified but profile
    incomplete → `profile`; `kycStatus: "rejected"` → `kyc-status` (the **only** `kycStatus`
    value that blocks, per decision B — was previously `"pending" | "rejected"`); `kycStatus:
    "pending" | "verified"` → `tutorial`/`main` per `hasCompletedTutorial` (decision B:
    `pending` now behaves identically to `verified` for routing purposes, since this feature
    has no money-path screens for the backend's FR-006 gate to protect).
  - `useKycGate()` (`src/features/identity/useKycGate.ts`) issues an `expo-router`
    `<Redirect>` to whichever of `app/(auth)/verify-phone.tsx`, `app/(auth)/profile.tsx`,
    `app/(auth)/kyc-status.tsx`, `app/(onboarding)/tutorial.tsx`, or the main app the gate
    resolves to. `KycStatusScreen` now branches on `rejected | error` only (the `pending`
    branch is removed — decision B means the gate never produces it, so keeping it would be
    a misleading dead branch, not defensive code).
- **Rationale**: Keeps the branching decision as pure, testable domain logic per Constitution
  IV, and makes the resumability edge case (phone verified, profile abandoned, user returns
  later) a property of the same single gate function that already handles `kycStatus`
  routing, rather than a second, separate mechanism.
- **Alternatives considered**: A route per status/step (`verify-phone.tsx` reachable only via
  forward navigation from `register.tsx`, with no gate-level redirect to it) — rejected,
  because it reintroduces the exact bug this re-scope is fixing for `kycStatus` (a returning
  user silently landing somewhere wrong) for the *registration-progress* dimension instead;
  keeping `pending` as a blocking state and adding a separate "nothing to gate yet" flag —
  rejected as needless indirection when the gate can simply not route there.

### Test tooling setup — unchanged

- Already resolved by T001 (`[X]`); no changes from this re-scope. See prior plan text for
  the original reasoning (jest + jest-expo + @testing-library/react-native, `docs/verification.md`).

## Project Structure

### Documentation (this feature)

```text
specs/001-registration-kyc/
├── spec.md               # Feature spec (re-scoped 2026-08-04, no open markers)
├── plan.md               # This file — includes research decisions & data model inline
└── tasks.md              # Phase 2 output (/speckit-tasks), amended 2026-08-04
```

No separate `research.md`, `data-model.md`, `contracts/`, or `quickstart.md` — see the note
at the top of this file for why.

### Source Code (repository root)

```text
app/
├── _layout.tsx                       # existing root layout (QueryClientProvider) — extend
│                                      # with the routing gate (see useKycGate below)
├── index.tsx                         # existing placeholder home — becomes the post-gate
│                                      # landing screen once main-app routes exist elsewhere
├── (auth)/
│   ├── _layout.tsx                   # unauthenticated-flow stack layout [NEW]
│   ├── register.tsx                  # account type + email/password/phone/username [NEW]
│   ├── verify-phone.tsx              # 5-digit code entry [NEW]
│   ├── verify-phone.ios.tsx          # SMS-autofill variant [NEW]
│   ├── verify-phone.android.tsx      # SMS-autofill variant [NEW]
│   ├── profile.tsx                   # NEW — profile fields + ToS/privacy acceptance,
│   │                                  # personal + business fields (replaces the removed
│   │                                  # kyc.tsx document-upload screen) [NEW]
│   └── kyc-status.tsx                # blocking rejected/error status screen — pending
│                                      # branch removed, decision B [NEW]
└── (onboarding)/
    └── tutorial.tsx                  # first-run tutorial (FR-007) [NEW]

src/domain/
├── types.ts                          # existing — add backend-mirroring profile/verification
│                                      # fields to User; REMOVE IdentityDocument (moved to
│                                      # feature 002, see Data Model below) [EXTEND]
├── schemas.ts                        # existing — trim business fields out of
│                                      # businessRegistrationSchema; replace kycFormSchema
│                                      # with profileFormSchema [EXTEND]
├── api-client.ts                     # existing generic client — unchanged
├── registration.ts                   # submitPersonalRegistration, submitBusinessRegistration,
│                                      # sendVerificationCode, resendVerificationCode,
│                                      # verifyPhoneCode, markTutorialComplete [NEW]
├── profile.ts                        # NEW — submitProfile() [NEW]
└── kyc-gate.ts                       # resolveKycRoute() — AMENDED per Research Decision
                                       # above (already exists from T003, gets a follow-up
                                       # task, not a new file)

src/lib/
├── api.ts                            # existing configured apiClient instance — unchanged
└── supabase-client.ts                # existing — unchanged
                                       # (camera-upload.ts REMOVED — moved to feature 002)

src/features/identity/
├── README.md                         # existing
├── RegistrationForm.tsx              # personal + business account-type toggle; only
│                                      # email/password/phone/username fields (business fields
│                                      # moved to ProfileForm) [NEW]
├── VerifyPhoneScreen.tsx             # shared UI shell around the code input [NEW]
├── CodeInput.tsx                     # platform-neutral 5-digit input [NEW]
├── CodeInput.ios.tsx                 # SMS-autofill variant (OTP hint) [NEW]
├── CodeInput.android.tsx             # SMS-autofill variant (SMS Retriever) [NEW]
├── ProfileForm.tsx                   # NEW — nombre/apellidoPaterno/apellidoMaterno/
│                                      # birthDate/nationality/curp/rfc + ToS/privacy
│                                      # checkboxes; conditional business fields [NEW]
├── KycStatusScreen.tsx               # branches rejected/error only (pending branch removed,
│                                      # decision B) [NEW]
├── TutorialScreen.tsx                # first-run tutorial content [NEW]
└── useKycGate.ts                     # hook: fetches current user, calls resolveKycRoute() —
                                       # widened per Research Decision above [NEW]

                                       # REMOVED from this feature's scope (moved to 002):
                                       # KycDocumentUpload.web.tsx, KycDocumentUpload.native.tsx,
                                       # PermissionExplanationScreen.tsx
```

**Structure Decision**: Single Expo project (Constitution I) — no `backend/`/`frontend/`
split, no per-platform app. New screens live under `app/(auth)/` and `app/(onboarding)/`
route groups; all their supporting UI lives under `src/features/identity/`; all portable
logic lives under `src/domain/`. Platform variance uses the `.ios.tsx`/`.android.tsx`
convention (only needed for `CodeInput`/`verify-phone` now — document-capture's `.web.tsx`/
`.native.tsx` variance moved to feature 002) rather than inline `Platform.OS` branches, per
Constitution IV and `docs/conventions.md`.

## Data Model (extends `src/domain/types.ts`)

- **User** (existing type, extend):
  - `+ phoneVerifiedAt?: string | null` — mirrors backend `User.phoneVerifiedAt`; also the
    "resumable registration" progress marker (see spec.md Edge Cases), read by
    `resolveKycRoute()`'s new `verify-phone` branch.
  - `+ nombre?: string | null`, `+ apellidoPaterno?: string | null`,
    `+ apellidoMaterno?: string | null`, `+ birthDate?: string | null`,
    `+ nationality?: string | null`, `+ curp?: string | null`, `+ rfc?: string | null` —
    mirror backend `User` columns field-for-field (`prisma/schema.prisma`). `nombre` and
    `apellidoPaterno` together are what `resolveKycRoute()`'s new `profile` branch checks for
    completeness.
  - `+ tosAcceptedAt?: string | null`, `+ privacyAcceptedAt?: string | null` — mirror backend
    `User.tosAcceptedAt`/`privacyAcceptedAt` (FR-004's ToS/privacy acceptance).
  - `kycRejectionReason?: string | null` (existing, from T002) — **kept as-is**. Still no
    backend field to confirm against (backend `001` has no `rejected` path); doc comment
    should be updated to note it now also depends on feature 002, not just a future backend
    feature in the abstract.
  - `hasCompletedTutorial: boolean` (existing, from T002) — **kept as-is**, unaffected by this
    re-scope. Still no backend field; local-storage fallback decision is still open for
    whoever implements the tutorial-completion task.
- **BusinessProfile** (existing type, unchanged): `commercialName`, `rfc`, `fiscalAddress` —
  now submitted via `submitProfile()` (T008 in `tasks.md`), not at registration.
- **IdentityDocument** (existing type, from T002) — **REMOVED**, not kept as a forward
  declaration. Decision: this type is currently unused by any other code in the repo (a type
  declaration with no consumer), its shape was already flagged by `task-implementer`'s Run 2
  report as a discrepancy against the backend's own placeholder `IdentityDocument` model, and
  document handling is now fully out of this feature's scope (moved to 002). Leaving an
  unused, already-known-to-be-wrong-shaped type in `src/domain/types.ts` would be dead code
  that could mislead a future reader into thinking this feature has a document contract it
  doesn't. Feature 002's `spec-writer` should reintroduce `IdentityDocument` from scratch once
  it has a real backend contract to mirror, rather than inheriting this feature's placeholder
  shape. See `tasks.md`'s new T004 for the removal task.
- **VerificationCode** (transient, not persisted client-side beyond form state): 5-digit
  string, validated by `verificationCodeSchema` (already in `src/domain/schemas.ts`,
  unchanged).
- **ProfileFormInput** (new, `src/domain/schemas.ts`): `nombre` (required), `apellidoPaterno`
  (required), `apellidoMaterno` (optional), `birthDate`, `nationality`, `curp`, `rfc`,
  `acceptedTerms`/`acceptedPrivacyPolicy` (`z.literal(true)`), plus conditional
  `commercialName`/`fiscalAddress`/business `rfc` for Tienda accounts.

State transitions (routing gate, per FR-009/FR-010 — REVISED 2026-08-04):

```
(no session) --register (email/password/phone/username)--> session created,
    kycStatus: pending, phoneVerifiedAt: null
session, !phoneVerifiedAt --submit correct code--> phoneVerifiedAt set
phoneVerifiedAt set, profile incomplete (missing nombre or apellidoPaterno)
    --submit profile (+ ToS/privacy)--> profile complete; kycStatus stays "pending"
    (backend has no path off pending yet — see Deferred to feature 002)
profile complete, kycStatus: pending | verified, !hasCompletedTutorial --> tutorial
profile complete, kycStatus: pending | verified, hasCompletedTutorial --> main app
    (decision B: "pending" now behaves like "verified" here)
kycStatus: rejected --> blocking kyc-status screen (rejection reason + resubmit CTA to a
    feature-002 placeholder route) — NOT PRODUCIBLE by the current backend; mocked-fixture-
    only until backend 002 ships
(fetch error at gate, any point) --> transient "couldn't load status" retry screen (FR-010),
    unchanged by this re-scope
```

## Quickstart Validation

Once tasks are implemented, validate manually per `docs/verification.md` Level 3
(`npm run web`) plus the relevant simulator for platform-specific paths:

1. Register a new personal account (web) → confirm phone code sent → enter code → confirm the
   profile step is reached → submit profile fields + ToS/privacy → confirm the tutorial (or
   main app, if already completed) is reached with `kycStatus: pending`.
2. Register a new Tienda account, verify phone, omit RFC at the profile step → confirm inline
   validation error, no submission.
3. Kill and reopen the app (iOS/Android simulator) after login → confirm still authenticated
   (US3) and routed correctly by `useKycGate`.
4. Register, verify phone, then quit before submitting the profile step; reopen the app →
   confirm the gate resumes directly at `app/(auth)/profile.tsx` (the resumability edge case),
   not back at `register.tsx` or `verify-phone.tsx`.
5. Confirm a test account with `kycStatus: pending` (the only state the real backend can
   currently produce) reaches the main app normally after completing the tutorial — **not** a
   blocking screen (decision B; this is the step most likely to regress back to pre-re-scope
   behavior if `resolveKycRoute()`'s follow-up task is done carelessly).
6. Using a mocked fixture (not the real backend, since it cannot produce this state), set
   `kycStatus: rejected` with a rejection reason → confirm the reason is shown, and with no
   reason → confirm the generic fallback copy is shown; confirm the "Resubmit documents" CTA
   is present and points at the feature-002 placeholder route (not a broken/real navigation).
7. Simulate a `kycStatus`/registration-progress fetch failure (e.g. kill backend mid-request)
   → confirm the FR-010 retry screen appears, not a silent pass-through to the main app.

Step 7 (formerly step 6, camera-permission-denied) from the pre-re-scope plan is removed —
see feature 002.

## Complexity Tracking

*No Constitution Check violations — table intentionally empty.*
