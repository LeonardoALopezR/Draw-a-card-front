# Feature Specification: Registration & KYC

**Feature Branch**: `001-registration-kyc`

**Created**: 2026-08-02

**Status**: Clarified (re-scoped 2026-08-04, see Clarifications)

**Input**: User description: "Registration/KYC flow from the product wireframe: Draw a
Card entry screen, personal vs Tienda (business) registration forms, phone verification
code entry, KYC document upload, terms/privacy acceptance, first-run tutorial. One Expo
codebase targets iOS, Android, and web — platform differences are noted inline per screen
rather than as separate specs."

**Related backend spec**: `001-user-registration-kyc` in the `Draw-a-card` backend repo
(status `done` as of 2026-08-04). Field names, validation rules, and status values
(`kycStatus: pending | verified | rejected`) must stay consistent with that spec's Key
Entities section and `prisma/schema.prisma`. KYC *document* handling (official ID, proof of
life, presigned uploads, verification/rejection transitions) is out of that backend feature's
scope — it lives in the backend's `002-kyc-document-verification` (status `pending`,
unspec'd), which this frontend feature's own `002-kyc-document-verification` (also `pending`)
mirrors. Real session/token verification (replacing the backend's dev-only `X-User-Id` header
stand-in) is backend `003-session-authentication` (status `pending`) — see Assumptions below.

## Clarifications

### Session 2026-08-04

- Q: How does the UI distinguish `kycStatus: pending` from `rejected` when the user returns
  later? → A: Both are handled by a blocking status screen — a returning user in either state
  does not reach the main app. `pending` shows a "verification in review" screen with no
  access to the main app experience. `rejected` shows the rejection reason string provided by
  the backend (a generic fallback message when the backend returns no reason), plus a
  resubmit CTA that sends the user back to the KYC document upload step.

  **Superseded in part by the re-scope below** — see that entry for what changed and why.
  This entry is kept for the historical record of how the blocking-status-screen *pattern*
  (one screen, branching internally, rather than one route per status) was decided; that part
  of the decision still stands. What changed is *which* status values trigger it.

### Session 2026-08-04 (re-scope — backend scope mismatch found mid-implementation)

**Trigger**: `task-implementer`, while implementing this feature's already-approved spec,
cross-checked it against the `Draw-a-card` backend repo (a required step per this repo's
process for any feature with a backend counterpart) after completing T001–T003, and found
the approved spec targeted a backend scope that no longer exists. `sdd-orchestrator`
independently re-verified every point below directly against the backend's
`specs/001-user-registration-kyc/spec.md`, `prisma/schema.prisma`, and `feature_list.json`
before authorizing this amendment.

**Findings** (see the backend spec's "Deferred to Follow-up" and "Known deviation" sections
for the backend's own framing of the same facts):

1. The backend descoped **all KYC document handling** out of its `001` on 2026-08-03, into
   `002-kyc-document-verification` (`pending`, unspec'd, "should ship alongside Trading").
   There is no presign endpoint, no object storage (S3/MinIO), and no KYC provider today.
   `IdentityDocument` exists in `prisma/schema.prisma` but the backend spec states it is
   "untouched and unused" by the backend's current feature.
2. The backend has **no code path that transitions `kycStatus` away from `pending`** —
   its spec calls that "the correct, intentional terminal state for this iteration." Its
   FR-006 records the settled product decision that KYC gates **money paths only** (sale and
   withdrawal); card-for-card trades are explicitly not gated, and this frontend feature
   currently has no money-path screens at all for that gate to protect.
3. The real backend registration flow is **three steps**, not two:
   - `POST /identity/register` (personal) / `POST /identity/register/business` — accepts
     **only** email, password, phone, username. Creates the `User` at `kycStatus: pending`
     and triggers the SMS code. Rejects profile fields and ToS acceptance at this step.
   - `POST /identity/phone/verify` — the 5-digit code.
   - `POST /identity/me/profile` — `nombre` (required), `apellidoPaterno` (required),
     `apellidoMaterno` (optional), birth date, nationality, CURP, RFC, **as typed string
     fields**, plus ToS + privacy acceptance. Reachable only once the phone is verified; a
     phone-unverified caller is rejected outright.
4. Business accounts submit `commercialName`/RFC/fiscal address at that **profile step**, not
   at initial registration. `BusinessProfile.rfc` is `@unique` (database-enforced, globally
   unique across the platform) and uppercase-normalized server-side — distinct from the
   personal `User.rfc`, which has no uniqueness requirement.
5. Backend `/identity/me/*` and `/identity/phone/*` identify the caller from a dev-only
   `X-User-Id` request header and fail closed outside `NODE_ENV` development/test — there is
   no real session/token verification yet. Real auth is backend `003-session-authentication`
   (`pending`). See Assumptions below for how this affects User Story 3 and every
   authenticated call this feature makes; this spec does not attempt to solve it.

**Decisions** (human, 2026-08-04, recorded here — not re-opened by future work on this spec):

- **A. Re-scope 001 to the backend that exists today.** KYC *document* upload (official ID +
  proof of life, presign→PUT→confirm, camera/library capture, the pre-permission screen) moves
  OUT of 001 into a new frontend feature `002-kyc-document-verification`
  (`feature_list.json`, `status: "pending"`), mirroring the backend's own `002`. That feature
  is registered but not spec'd yet — it is blocked on the backend's `002` being spec'd first.
- **B. `pending` passes through to the main app.** A `pending` user reaches the app normally
  (see revised FR-009). `resolveKycRoute()` and `KycStatusScreen` stay in this feature, but
  the blocking status screen is only reached on `rejected` (and on the FR-010 fetch-failure
  case). `rejected` is unreachable against the current backend — no code path produces it —
  so that branch is **built and unit-tested but not yet exercisable end-to-end**. This is
  intentional forward-compatibility with backend `002`, not dead code, and should not be
  removed just because it can't be exercised against today's backend.
- **C. Add the missing profile step.** A new screen collects the FR-004 typed fields (nombre,
  apellidoPaterno, apellidoMaterno, birth date, nationality, CURP, RFC) plus ToS/privacy
  acceptance, reachable only once the phone is verified.

**What this changed in this document**: FR-004 is rewritten (was: document collection; now:
typed profile fields). FR-009 is rewritten (routing matrix, decision B). The original
document-upload requirements, acceptance scenario, platform notes, and edge cases are
preserved verbatim under "Deferred to feature 002" rather than deleted, so that feature's
spec-writer can reuse them without re-deriving the reasoning — mirroring how the backend's own
spec preserved its deferred scope. User Story 1 and 2's acceptance scenarios are updated to
the three-step flow. Assumptions gains the `X-User-Id` note (finding 5).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Personal account registration (Priority: P1)

A new user signs up with email, password, phone, and username; verifies their phone via a
5-digit SMS code; and then, in a separate step reachable only once the phone is verified,
provides their core profile information — name, birth date, nationality, CURP, RFC — plus
terms-of-service and privacy-policy acceptance. Identical flow across iOS, Android, and web.
Mirrors the backend's own three-step flow exactly (see backend spec's Clarifications, Session
2026-08-03 mid-implementation correction).

**Why this priority**: Entry point for the entire product; nothing else is reachable
without it.

**Independent Test**: Register a new personal account end-to-end on each target (start with
web via `expo start --web`, since it's fastest to iterate on) and confirm the user lands in
the tutorial (or main app, if the tutorial was already completed) with `kycStatus: pending`
— the correct terminal state for this feature (see Deferred to feature 002).

**Acceptance Scenarios**:

1. **Given** a new visitor, **When** they submit email + password + phone + username, **Then**
   a verification code is sent to their phone and the account is created with `kycStatus:
   pending`. No profile field (name, birth date, nationality, CURP, RFC) or ToS/privacy
   acceptance is accepted or required at this step.
2. **Given** an unverified account, **When** they submit the correct 5-digit code within
   the expiry window, **Then** their phone is marked verified and they proceed to the profile
   step.
3. **Given** a phone-verified account, **When** they submit `nombre`, `apellidoPaterno`
   (required), `apellidoMaterno` (optional), birth date, nationality, CURP, and RFC, and
   accept the terms of service and privacy policy, **Then** the profile is saved, the
   acceptances are timestamped, and registration completes with `kycStatus: pending` — this
   step is rejected if the phone has not yet been verified.
4. **Given** a returning user whose account has `kycStatus: pending`, **When** they open the
   app, **Then** they reach the main app experience normally (decision B, 2026-08-04
   re-scope) — `pending` no longer blocks access, since this feature has no money-path
   screens for the backend's FR-006 gate to protect yet.
5. **Given** a returning user whose account has `kycStatus: rejected`, **When** they open the
   app, **Then** they see a blocking screen showing the backend-provided rejection reason (a
   generic fallback message if the backend returns none), with a "Resubmit documents" CTA.
   **Note**: this scenario cannot be exercised against the current backend — no code path
   produces `kycStatus: rejected` yet (see Deferred to feature 002) — so it is verified via a
   mocked-fixture test, not an end-to-end run, until backend `002` ships.

**Platform notes**:
- *iOS/Android*: the verification code input should support SMS autofill where the OS
  provides it, so the code populates automatically when the SMS arrives.
- Document-capture platform notes (camera vs. file input, permission pre-explanation screen)
  are deferred — see "Deferred to feature 002" below.

---

### User Story 2 - Business ("Tienda") registration (Priority: P2)

A visitor registers a "Tienda" account: the initial registration call (email, password,
phone, username, `accountType: business`) is identical to User Story 1's, and after phone
verification, the profile step additionally collects commercial name, RFC, and fiscal
address alongside the standard personal profile fields. Identical across all three
platforms — no platform-specific behavior here.

**Why this priority**: Required for the marketplace/shop side, ships after the core
personal flow.

**Independent Test**: Register with `accountType: business`, verify the phone, submit the
profile step including commercial name/RFC/fiscal address, confirm a linked
`BusinessProfile` is created, and confirm the profile step rejects submission without RFC.

**Acceptance Scenarios**:

1. **Given** a new visitor selects "Tienda" at registration, **When** they submit
   email/password/phone/username, verify their phone, and then submit personal profile
   fields plus commercial name, RFC, and fiscal address at the profile step, **Then** a
   business account with a linked `BusinessProfile` is created.
2. **Given** a phone-verified business account submitting its profile step, **When** RFC is
   missing, **Then** the request is rejected with a validation error identifying the missing
   field — at the profile step, not at initial registration (business fields are not
   collected there — see finding 4 in Clarifications).

---

### User Story 3 - Session persistence (Priority: P1)

A logged-in user reopens the app (mobile) or returns to the tab (web) and remains logged in
without re-entering credentials, unless the session has genuinely expired.

**Why this priority**: High-friction cost if missing, especially on mobile where a full app
restart is common.

**Independent Test**: Log in, fully kill and reopen the app (mobile) or close and reopen the
browser tab (web), confirm the user is still authenticated.

**Platform notes**:
- *iOS/Android*: session persists via `expo-secure-store`, not in-memory-only state.
- *Web*: session persists via the Supabase SDK's default web storage mechanism.

**Constraint (see Assumptions, finding 5)**: this story validates that the *client-side*
Supabase session survives a restart — it does not validate that the *backend* correctly
enforces "this session belongs to this user," since the backend does not yet do real
session/token verification for the identity endpoints this feature calls (dev-only
`X-User-Id` header stand-in until backend `003-session-authentication` ships).

---

### Edge Cases

- What happens when the verification code expires before submission? → Allow resend,
  rate-limited to prevent SMS abuse.
- What happens if a user abandons registration mid-flow (completes phone verification but
  never submits the profile step) and returns later? → Progress must be resumable: the
  returning user is routed directly to the profile step (FR-009), not forced back through
  registration or phone verification. This is a normal, directly reachable state through
  ordinary use of the real API — mirrors the backend spec's own resumability edge case
  (Session 2026-08-03, mid-implementation correction).
- What happens when a username is unique-but-differs only by case or diacritics (per the
  wireframe's "Usuario (único y detergente)" note)? → Uniqueness check must be
  case-insensitive and accent-insensitive.
- What happens if the profile step is attempted before the phone is verified? → The backend
  rejects the call outright (backend FR-002); the app must not present the profile step as
  reachable in that state (enforced by the gate, FR-009), and any direct-navigation attempt
  should redirect back to phone verification rather than surface the backend's rejection as a
  bare form error.
- How does the UI distinguish `kycStatus: pending` from `rejected` when the user returns
  later? → **Revised by the 2026-08-04 re-scope (decision B)**: `pending` is no longer
  blocking — the user reaches the main app normally. Only `rejected` is a blocking screen
  (backend-provided rejection reason, generic fallback if none, plus a resubmit CTA) — see
  FR-009. `rejected` is currently unreachable (see Deferred to feature 002).
- What happens when the backend has not yet returned a decision at all (e.g. request
  timeout/error while fetching current `kycStatus` on app open)? → Treat as a retryable error
  state (not `pending`): show a "couldn't load your verification status" screen with a retry
  action, never silently fall through to the main app.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: App MUST allow account creation via email + password + phone + username,
  delegated to the external auth provider for password handling (Constitution: never
  hand-roll password hashing). This call accepts only those four fields — no profile fields
  or ToS/privacy acceptance (see FR-004).
- **FR-002**: App MUST send a 5-digit verification code to the user's phone and validate it
  (via a separate step from FR-001) before allowing progression to the profile step (FR-004),
  with SMS autofill support on iOS/Android. A phone-unverified user MUST NOT be able to reach
  or submit the profile step.
- **FR-003**: App MUST support both `personal` and `business` account types, selected at the
  initial registration call (FR-001); business-specific fields (commercial name, RFC, fiscal
  address) are collected at the profile step (FR-004), not at initial registration — see
  Clarifications finding 4.
- **FR-004** *(rewritten 2026-08-04 — was document collection, see Deferred to feature 002 for
  that original text)*: App MUST collect core profile fields — `nombre` (given name(s),
  required), `apellidoPaterno` (paternal surname, required), `apellidoMaterno` (maternal
  surname, optional), birth date, nationality, CURP, and RFC — as typed form fields, plus
  terms-of-service and privacy-policy acceptance (each timestamped), submitted via a
  dedicated profile step reachable only once the phone is verified (FR-002). For business
  accounts, this same step additionally collects commercial name, RFC (business — globally
  unique, distinct from the personal RFC field), and fiscal address (FR-003). Mirrors the
  backend's `POST /identity/me/profile`; field names and the required/optional split for
  `apellidoMaterno` match the backend spec's Clarifications (Session 2026-08-03,
  mid-implementation correction) verbatim.
- **FR-005**: App MUST enforce case-insensitive, accent-insensitive username uniqueness
  (validated by the backend; surfaced clearly in the UI).
- **FR-006**: App MUST persist sessions securely across restarts on all three platforms.
- **FR-007**: App MUST show the first-run tutorial only once per user, per the wireframe's
  "Solo 1° vez" branching logic.
- **FR-008** *(deferred 2026-08-04 — see Deferred to feature 002)*: ~~App MUST require
  camera/photo-library permission with a pre-permission explanation screen on mobile before
  triggering the native OS prompt.~~ Moved to feature 002 in full; preserved there verbatim.
- **FR-009** *(rewritten 2026-08-04, decision B)*: App MUST route a returning user (valid
  session) to the correct screen via a single deterministic gate function
  (`resolveKycRoute()`), based on registration progress and `kycStatus`:
  - Phone not yet verified → the phone-verification step (FR-002).
  - Phone verified, profile not yet submitted → the profile step (FR-004) — this is what
    makes the "abandoned after phone verification" edge case resumable rather than forcing a
    re-register.
  - `kycStatus: pending` or `verified`, first-run tutorial not yet completed → the tutorial
    (FR-007).
  - `kycStatus: pending` or `verified`, tutorial completed → the main app. **`pending` no
    longer blocks main-app access** (decision B) — this feature implements no money-path
    screens for the backend's FR-006 KYC gate to protect, so there is nothing for a blocking
    screen to guard yet.
  - `kycStatus: rejected` → a blocking status screen showing the backend-provided rejection
    reason (or a generic fallback message when the backend returns none), plus a "Resubmit
    documents" CTA. **Unreachable against the current backend** — no code path produces
    `rejected` (see Deferred to feature 002) — so this branch is built and unit-tested via
    mocked fixtures, not exercised end-to-end, until backend `002` ships. The CTA's navigation
    target is a named placeholder pointing at feature 002's future document-resubmission
    entry point (which does not exist yet), not a fabricated real route.
- **FR-010**: App MUST treat a failure to fetch the current `kycStatus`/registration-progress
  state on app open as a distinct retryable error state, never silently granting or denying
  main-app access.

### Key Entities *(include if feature involves data)*

Mirrors the backend spec's **User** and **BusinessProfile** entities (`prisma/schema.prisma`).
See `src/domain/types.ts` for the frontend-side TypeScript shapes and `plan.md`'s Data Model
section for the exact field list added by this re-scope.

- **User.phoneVerifiedAt**, **User.nombre**, **User.apellidoPaterno**,
  **User.apellidoMaterno**, **User.birthDate**, **User.nationality**, **User.curp**,
  **User.rfc**, **User.tosAcceptedAt**, **User.privacyAcceptedAt**: mirror the backend `User`
  model field-for-field (see backend `prisma/schema.prisma`). All nullable until submitted
  via the relevant step.
- **User.kycRejectionReason** (string, nullable): populated by the backend only when
  `kycStatus: rejected`. **Not present on the backend's `User` model today** — the backend
  feature that implements 001 has no path off `kycStatus: pending` at all, so this field name
  has no backend contract to confirm against yet. Carried over from this spec's own
  pre-re-scope Key Entities section in anticipation of backend `002`; confirm the exact field
  name against that backend feature's spec once it exists, before this frontend feature's own
  `002` implements anything that reads it in production.
- **BusinessProfile**: `commercialName`, `rfc` (globally unique, database-enforced,
  uppercase-normalized server-side — distinct from the personal `User.rfc`), `fiscalAddress`
  — now submitted at the profile step (FR-004), not at initial registration.
- **IdentityDocument**: out of this feature's scope entirely — see Deferred to feature 002.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user completes registration → verification → profile step in under 5
  minutes of active interaction, on any of the three targets.
- **SC-002**: All form validation errors show inline; zero full-page/screen reloads during
  the flow.
- **SC-003**: The flow is fully usable at a 375px-wide mobile viewport on web, and on both
  phone and tablet form factors on iOS/Android.
- **SC-004** *(deferred 2026-08-04 — see Deferred to feature 002)*: ~~KYC document capture via
  camera completes in 3 taps or fewer from the KYC step screen.~~ Moved to feature 002 in
  full.
- **SC-005** *(revised 2026-08-04, decision B)*: A returning user is routed to the correct
  screen (verify-phone, profile, tutorial, main, or the `rejected`/error blocking screen) on
  every app open, per FR-009 — zero cases of a phone-unverified or profile-incomplete user
  reaching the main app, and zero cases of a `rejected` or fetch-error user reaching the main
  app. (`pending` reaching the main app is now the *correct* outcome, not a failure — see
  FR-009.)

## Assumptions

- The backend's `001-user-registration-kyc` feature is implemented — confirmed `done` as of
  2026-08-04 (117 backend tests passing). This feature's `/speckit-implement` phase targets
  that real, shipped backend contract, not a stub.
- Expo's managed workflow (not bare React Native) is used, so `expo-camera` and
  `expo-image-picker` work without native module linking (relevant to feature 002, not this
  feature's own screens, but the managed-workflow assumption is repo-wide).
- Verification code resend (Edge Cases) is rate-limited to 1 request per 60 seconds and 5
  requests per hour per phone number; the backend enforces the limit, the frontend disables
  the resend action and shows a countdown accordingly. Exact numbers can be revisited once
  the backend spec exposes them explicitly.
- **(Finding 5, 2026-08-04 re-scope) No real session/token verification on the backend's
  identity endpoints yet.** The backend's `/identity/me/*` and `/identity/phone/*` routes
  identify the caller from a dev-only `X-User-Id` request header (backend spec's "Known
  deviation: no authentication in this feature" section) and fail closed outside `NODE_ENV`
  development/test. Real session/token verification against the external auth provider is
  backend `003-session-authentication` (`pending`). This affects every authenticated call
  this feature makes (phone verification, profile submission) and User Story 3 specifically
  (see that story's Constraint note): the frontend's own Supabase session persistence is real
  and independently testable, but the backend's enforcement that a given session genuinely
  belongs to the calling user is not yet real. **This spec does not attempt to solve that** —
  it is recorded here as a known, cross-cutting constraint so it isn't mistaken for a
  frontend defect, and so whoever eventually wires the frontend's outgoing `X-User-Id` header
  (or removes it once backend `003` ships) has the context for why it's there.
- The rejected-status screen's resubmit CTA's real destination depends on feature 002's
  document-upload entry point, which doesn't exist yet — see FR-009.

## Deferred to feature 002

**Scope decision (2026-08-04)**: everything below was originally part of this feature's
approved spec and is preserved here verbatim (not deleted) so frontend feature
`002-kyc-document-verification`'s `spec-writer` can reuse it directly, without re-deriving the
reasoning — mirroring how the backend's own spec preserved its deferred scope. None of this is
implemented by this feature's `tasks.md`.

### Original FR-004 (KYC document collection)

> App MUST collect KYC documents via camera capture or library selection on mobile, and file
> input on web, uploading to the backend's presigned-URL flow (exact mechanism resolved in
> `/speckit-plan`).

### Original FR-008 (pre-permission explanation screen)

> App MUST require camera/photo-library permission with a pre-permission explanation screen
> on mobile before triggering the native OS prompt.

### Original SC-004

> KYC document capture via camera completes in 3 taps or fewer from the KYC step screen
> (choose method → capture/select → confirm) on mobile.

### Original User Story 1, Acceptance Scenario 3 (superseded by the new profile-step AS3)

> **Given** a verified-phone account, **When** they submit official ID + proof of life +
> CURP/RFC, **Then** the documents are uploaded and KYC status moves to `pending review` (or
> `verified` if the KYC provider auto-verifies).

### Original User Story 1 Platform notes (document capture)

- *Web*: document upload uses a standard file input.
- *iOS/Android*: document upload offers a choice between native camera capture
  (`expo-camera`) and photo library (`expo-image-picker`) — most users will photograph their
  physical ID in the moment rather than have an existing scan. Camera permission requires a
  pre-permission explanation screen before the OS prompt (store review guidelines expect
  context, not a bare prompt).

### Original Edge Cases (document-specific)

- What happens when KYC document upload fails on poor/offline mobile connectivity? → Queue
  and retry automatically rather than failing silently.
- What happens if camera permission is permanently denied on mobile? → Fall back to library
  picker, with a message and a deep link to the OS settings screen.

### Original Assumptions (document-specific)

- File uploads use the same backend endpoint regardless of source platform — no
  platform-specific backend changes are assumed.
- KYC document upload retry-on-poor-connectivity (Edge Cases) is scoped to retrying within
  the current app session (React Query mutation retry/backoff); it does not require a
  durable, restart-surviving upload queue for this feature. If the product later needs
  uploads to survive an app kill mid-upload, that's a follow-up feature, not part of this
  spec's scope.
- The rejected-status screen's resubmit CTA re-enters the KYC document upload step rather than
  the full registration flow; the user's already-verified phone/email and account fields are
  not re-collected. (Still true in principle for feature 002 — the "re-enters" target is just
  feature 002's own document step, not anything in this feature.)

### Backend context for feature 002 (not this feature's job, recorded for continuity)

Also deferred on the *backend* side, per its spec's own "Deferred to Follow-up" section (read
before spec'ing this feature's `002`): document collection/review in its entirety, the
`IdentityDocumentAccessLog` audit-log model, object storage integration (S3/MinIO), the KYC
provider interface, and enforcement of the money-path KYC gate (FR-006) on sale/withdrawal.
The backend's `IdentityDocument` Prisma model exists but is explicitly "untouched and unused"
by backend `001` — treat its current shape as a placeholder, not a confirmed contract, when
spec'ing this frontend feature's `002`.
