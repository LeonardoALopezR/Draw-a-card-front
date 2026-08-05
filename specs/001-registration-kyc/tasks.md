# Tasks: Registration & KYC

**Input**: Design documents from `specs/001-registration-kyc/` (`spec.md`, `plan.md`)

**Tests**: Included. `docs/verification.md` mandates unit tests for every `src/domain`
export and component/screen tests for every new/changed screen once tooling exists — this
feature is the one that installs that tooling (T001, done), so tests are not optional here.

**Organization**: Tasks are grouped by user story from `spec.md`, in priority order
(P1 → P1 → P2), so the personal-registration MVP (US1) is completable and independently
testable before business registration (US2). US3 (session persistence) is also P1 and is
mostly verification of already-wired infrastructure (`src/lib/supabase-client.ts`), so it
sits directly after US1.

## Amendment note (2026-08-04 re-scope)

This file was amended after `task-implementer`'s backend cross-check found the originally-
approved spec/plan targeted a backend scope that no longer exists — see `spec.md`'s
Clarifications and `plan.md`'s Amendment note for the full findings and decisions.

**T001, T002, T003 are already `[X]` and their numbering is unchanged** — do not renumber
completed work. Everything from T004 onward has been rewritten/renumbered (nothing past T003
was implemented yet, so this carries no cost). Two follow-up tasks (new T004, T005) exist
specifically to bring T002's and T003's already-completed output in line with this re-scope —
see those tasks for exactly what changes and why.

The former T005, T006, T014, T015, T016, T017 (KYC document presign/upload/confirm, the
camera-upload adapter, the permission-explanation screen, and the two document-upload
screens) are **removed from this feature's active task list** and relocated verbatim to
"Deferred to feature 002" at the bottom of this file, for that feature's `spec-writer`/
`task-implementer` to reuse without re-deriving the task breakdown.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 (personal registration, P1), US2 (business registration, P2), US3
  (session persistence, P1)
- File paths are exact; see `plan.md`'s Project Structure for the full tree

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the test tooling this feature's tasks depend on. No feature code yet.

- [X] T001 Add `jest`, `jest-expo`, `@testing-library/react-native` as devDependencies in
  `package.json`; add `"test": "jest"` script; create `jest.config.js` using the `jest-expo`
  preset. **Done** — see `progress/impl_001-registration-kyc.md` Run 1 for the full report
  (including the accepted deviations: skipped `@testing-library/jest-native`, added
  `@types/jest`). Unaffected by the 2026-08-04 re-scope.

**Checkpoint**: `npm test` runs and passes; `./init.sh` shows Tests: OK.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared domain logic, types, and the routing gate that every user story either
produces data for or depends on. **No user story screen work starts before this phase is
done.**

- [X] T002 [P] Extend `src/domain/types.ts`: add `kycRejectionReason?: string | null` and
  `hasCompletedTutorial: boolean` to `User`; add an `IdentityDocument` interface. **Done** —
  see `progress/impl_001-registration-kyc.md` Run 2. **Superseded in part by the 2026-08-04
  re-scope — see new T004 below**, which removes `IdentityDocument` (moved to feature 002)
  and adds the backend-mirroring profile/verification fields this re-scope requires. T002
  itself is not reopened/un-checked; T004 is additive follow-up work, not a correction to
  T002's own literal instructions (which it fulfilled correctly at the time). *(FR-004,
  FR-007, FR-009)*
- [X] T003 [P] Create `src/domain/kyc-gate.ts` exporting a pure `resolveKycRoute(user, statusFetchFailed)`.
  **Done** — see `progress/impl_001-registration-kyc.md` Run 2 for the full branch matrix and
  its 7 tests. **Superseded in part by the 2026-08-04 re-scope — see new T005 below**, which
  widens the route union and branch logic per `plan.md`'s revised "KYC status gate" Research
  Decision (decision B: `pending` no longer routes to `kyc-status`; new `verify-phone`/
  `profile` routes added). T003 itself is not reopened/un-checked, for the same reason as
  T002 above. *(FR-007, FR-009, FR-010)*
- [X] T004 [P] **Follow-up to T002.** In `src/domain/types.ts`: **remove** the
  `IdentityDocument` interface entirely (decision: not kept as a forward declaration — it has
  no consumer today, its shape was already flagged as a discrepancy against the backend's own
  placeholder model in `progress/impl_001-registration-kyc.md` Run 2, and document handling is
  now fully out of this feature's scope; feature 002's `spec-writer` will reintroduce it from
  a real backend contract, not this placeholder — see `plan.md`'s Data Model section for the
  full reasoning). Extend `User` with `phoneVerifiedAt?: string | null`, `nombre?: string |
  null`, `apellidoPaterno?: string | null`, `apellidoMaterno?: string | null`,
  `birthDate?: string | null`, `nationality?: string | null`, `curp?: string | null`,
  `rfc?: string | null`, `tosAcceptedAt?: string | null`, `privacyAcceptedAt?: string | null`
  — mirroring the backend's `User` model field-for-field (`prisma/schema.prisma`). Leave
  `kycRejectionReason`/`hasCompletedTutorial` untouched. Type-only change; caught by `tsc`, no
  new test file. If any existing test constructs a full `User` fixture, confirm it still
  compiles (new fields are all optional, so this should be a no-op). *(FR-004, supports the
  amended FR-009)*
- [X] T005 [P] **Follow-up to T003.** Amend `src/domain/kyc-gate.ts`'s `resolveKycRoute()` per
  `plan.md`'s revised "KYC status gate" Research Decision:
  - Widen the return type to `"unauthenticated" | "verify-phone" | "profile" | "kyc-status" |
    "tutorial" | "main"`.
  - Widen the `user` parameter's `Pick<...>` to also include `phoneVerifiedAt`, `nombre`,
    `apellidoPaterno` (from T004).
  - New branch order: no user → `"unauthenticated"`; `statusFetchFailed: true` → `"kyc-status"`
    (unchanged — still checked before any `user` property, still fail-closed under
    uncertainty per FR-010); user present but `!phoneVerifiedAt` → `"verify-phone"`; phone
    verified but `!nombre || !apellidoPaterno` → `"profile"`; `kycStatus: "rejected"` →
    `"kyc-status"` (**the only `kycStatus` value that blocks now** — decision B); `kycStatus:
    "pending" | "verified"` → `"tutorial"` or `"main"` per `hasCompletedTutorial`, exactly as
    before, but now **also applying to `"pending"`**, not just `"verified"`.
  - Update `kyc-gate.test.ts`: change the existing `kycStatus: "pending"` test case's expected
    result from `"kyc-status"` to `"tutorial"`/`"main"` (per `hasCompletedTutorial`, add both
    variants); keep the `"rejected"` → `"kyc-status"` case; add cases for `!phoneVerifiedAt` →
    `"verify-phone"` and phone-verified-but-profile-incomplete → `"profile"`; keep the
    fail-safe-precedence test (statusFetchFailed wins even with a stale complete/verified
    user) but confirm it now also covers a stale `pending` user, not just `verified`.
  - Depends on: T004. *(FR-002, FR-004, FR-009, FR-010)*

**Checkpoint after T004/T005**: run `npm test` and `npx tsc --noEmit` — both must pass before
proceeding to T006. This is the point where the re-scope's most safety-critical change
(pending no longer blocks the main app) becomes independently verifiable.

- [X] T006 [P] Create `src/domain/registration.ts`: `submitPersonalRegistration(input)` →
  `POST /identity/register` (email, password, phone, username **only**),
  `submitBusinessRegistration(input)` → `POST /identity/register/business` (same four fields
  plus `accountType: business` — business-specific fields are NOT sent here, see T008),
  `sendVerificationCode`, `resendVerificationCode` (respecting the 60s/5-per-hour Assumption
  in spec.md — surface a `retryAfterSeconds` from the backend response rather than
  hardcoding it client-side), `verifyPhoneCode(code)` → `POST /identity/phone/verify`,
  `markTutorialComplete()` (backs T019). Thin wrappers around `src/lib/api.ts`'s `api()`
  client, validating input with `personalRegistrationSchema`/`businessRegistrationSchema`/
  `verificationCodeSchema` (T007). Add `src/domain/registration.test.ts` covering one happy
  path and one validation-error path per function. *(FR-001, FR-002, FR-003, FR-005)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 4. **Deviations from this task's
  literal text, confirmed against the real backend source** (see that report for the full
  cross-check): no standalone `sendVerificationCode` export (registration itself triggers the
  SMS code server-side, there is no separate backend "send" action) or `accountType: business`
  field (account type is selected by which endpoint is called, `/register` vs.
  `/register/business` — the request body is identical); `resendVerificationCode` cannot
  surface a `retryAfterSeconds` because the backend's `POST /identity/phone/resend` response is
  `{ message }` only (and the real rate limit is 3 resends per 15-minute window, not 60s/5-per-
  hour); every exported function takes the `ApiClient` as an explicit first parameter
  (dependency injection) rather than importing `src/lib/api.ts`'s singleton directly, to keep
  this file free of transitive React Native imports; `markTutorialComplete()` is a documented
  no-op placeholder — no backend endpoint for tutorial completion exists anywhere in the
  backend repo.
- [X] T007 [P] Update `src/domain/schemas.ts`: trim `commercialName`/`rfc`/`fiscalAddress` out
  of `businessRegistrationSchema` (both `personalRegistrationSchema` and
  `businessRegistrationSchema` now collect only `email`/`password`/`phone`/`username` — those
  business fields move to the profile step); remove the document-shaped `kycFormSchema`
  (`curpRfc`/`officialIdUrl`/`proofOfLifeUrl`/`domicileAddress`) and replace it with
  `profileFormSchema`: `nombre` (required, min 1), `apellidoPaterno` (required, min 1),
  `apellidoMaterno` (optional), `birthDate` (string, ISO date), `nationality` (string),
  `curp` (string), `rfc` (string, personal — no uniqueness constraint at the schema level),
  `acceptedTerms`/`acceptedPrivacyPolicy` (`z.literal(true)`), and an optional business
  sub-shape (`commercialName`, `businessRfc`, `fiscalAddress`) used when `isBusiness: true`.
  Export `ProfileFormInput` type. Update any existing schema tests. *(FR-003, FR-004)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 4. **Deviations from this task's
  literal text, confirmed against the real backend source**: the acceptance fields are named
  `tosAccepted`/`privacyAccepted` (the backend's actual field names), not
  `acceptedTerms`/`acceptedPrivacyPolicy`; there is no separate `businessRfc` field — the
  backend's business profile schema reuses the same `rfc` field as personal accounts (a sole
  proprietor's fiscal and personal RFC are the same value in this product's domain); `rfc` is
  required for every account type, not personal-only as this task's text implied.
- [X] T008 [P] Create `src/domain/profile.ts`: `submitProfile(input: ProfileFormInput)` →
  `POST /identity/me/profile`, thin wrapper around `api()`, validated by `profileFormSchema`
  (T007). Doc comment noting this call is only reachable once `phoneVerifiedAt` is set — the
  gate (T005) enforces that at the routing level; this function itself does not re-check it,
  it relies on and surfaces the backend's own rejection if called out of order. Add
  `src/domain/profile.test.ts` covering: happy path (personal), happy path (business fields
  present), missing-RFC validation-error path (mirrors backend FR-009's business-RFC-required
  rule). Depends on: T006, T007. *(FR-003, FR-004, FR-007 [ToS/privacy piece])*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 4. Takes the `ApiClient` as an
  explicit parameter (same DI pattern as T006) plus an `{ isBusiness }` option to select which
  schema to validate against (the backend does not send `isBusiness` back to this call — it's
  known from the already-fetched `User` record, per plan.md). The "missing-RFC" test covers RFC
  as a universally-required field (not business-only, per T007's deviation note above), with a
  separate business-only test for missing `commercialName`.
- [X] T009 Create `app/(auth)/_layout.tsx` (bare `<Stack>` for the unauthenticated flow) and
  `app/(onboarding)/_layout.tsx` (bare `<Stack>` for the tutorial group) — route-group
  scaffolding only, no logic. *(Supports FR-001–FR-010, no single FR.)* **Done** — see
  `progress/impl_001-registration-kyc.md` Run 5.
- [X] T010 Create `src/features/identity/useKycGate.ts`: a hook that reads the Supabase
  session (`supabase.auth.getSession()` / `onAuthStateChange`), fetches the current user via
  React Query when a session exists, calls `resolveKycRoute()` from T005, and returns
  `{ route, isLoading, kycStatus, statusFetchFailed }` — `KycStatusScreen` (T018) reads
  `kycStatus`/`statusFetchFailed` to pick its `rejected`/`error` copy when `route` is
  `"kyc-status"` (the `pending` case is gone — decision B). Wire it into `app/_layout.tsx`
  (existing root layout) so it renders an `expo-router` `<Redirect>` to
  `app/(auth)/verify-phone.tsx`, `app/(auth)/profile.tsx`, `app/(auth)/kyc-status.tsx`,
  `app/(onboarding)/tutorial.tsx`, or the main app, per the resolved route — this is what
  makes the resumable-registration edge case work (a phone-verified, profile-incomplete
  returning user lands directly on `profile.tsx`, not back at `register.tsx`). Add
  `src/features/identity/useKycGate.test.ts` (React Query + RNTL `renderHook`) covering each
  branch from T005's updated test matrix. Depends on: T004, T005. *(FR-002, FR-004, FR-007,
  FR-009, FR-010)* **Done** — see `progress/impl_001-registration-kyc.md` Run 5. **Real backend
  contract gap found and worked around, not papered over**: the backend has no `GET
  /identity/me` endpoint returning the full profile — only `GET /identity/me/kyc-status`
  (`{ kycStatus }`), gated behind the dev-only `X-User-Id` header that is never persisted
  across app restarts by design. `fetchCurrentUser()` (new, `src/domain/registration.ts`) wraps
  that real endpoint; on a genuine cold boot the call is expected to fail, which
  `useKycGate` correctly surfaces as `statusFetchFailed: true` (FR-010's retryable state) rather
  than misrouting to `"unauthenticated"` or fabricating profile data — see Run 5 for the full
  writeup and the `UNKNOWN_GATE_USER` fail-safe-precedence fix this required. Two more
  previously-latent, now-exposed bugs were fixed as a direct, necessary consequence of this
  task's required root-layout wiring (see Run 5): `src/lib/supabase-client.ts` crashed on an
  empty `EXPO_PUBLIC_SUPABASE_URL` (this repo's own shipped `.env`/`.env.example` default) and
  Supabase's Realtime client construction crashed under Node 20's static web prerendering
  (no native `WebSocket` global) — both are now guarded, with `@opentelemetry/api` and `ws`
  added as dependencies (the former a required phantom dependency for Metro to bundle
  `@supabase/supabase-js` at all).

**Checkpoint**: Domain logic, types, and the routing gate exist and are unit-tested; no
screens are user-visible yet. All user stories can now start.

---

## Phase 3: User Story 1 - Personal account registration (Priority: P1) 🎯 MVP

**Goal**: A new user can register a personal account, verify their phone, submit their
profile, reach the tutorial, and — on a later return — see the correct screen for wherever
they left off, including the main app if `kycStatus: pending` (decision B) or the blocking
status screen if `kycStatus: rejected`.

**Independent Test**: Per spec.md — register a new personal account end-to-end on web
(`expo start --web`), confirm the user lands in the tutorial (or main app) with `kycStatus:
pending`; then, using a mocked fixture (the real backend can't produce it), confirm a
`rejected` account shows the blocking status screen.

### Implementation for User Story 1

- [X] T011 [P] [US1] Create `src/features/identity/RegistrationForm.tsx` — personal fields
  only (email, password, phone, username) via React Hook Form + `personalRegistrationSchema`,
  inline validation errors (SC-002), accessible labels/roles (Constitution VII). Add
  `src/features/identity/RegistrationForm.test.tsx` (RNTL) asserting rendered
  validation-error text and a successful-submit call. *(FR-001, FR-003, FR-005)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 6. Also adds
  `src/features/identity/FormField.tsx` (shared label/inline-error primitive, the pattern
  ProfileForm/VerifyPhoneScreen should copy) and a new `mapRegistrationError()` export in
  `src/domain/registration.ts` (with its own tests in `registration.test.ts`) so a backend
  `EmailTaken`/`UsernameTaken`/`ValidationError` maps to the specific field it corresponds to,
  per this task's "surface the backend's real errors" instruction, without putting that
  interpretation inside the component (Constitution IV).
- [X] T012 [US1] Create `app/(auth)/register.tsx` rendering `RegistrationForm`, calling
  `submitPersonalRegistration` (T006) on submit, navigating to `verify-phone` on success. Add
  a screen test asserting the happy-path navigation call. Depends on: T006, T011. *(FR-001,
  FR-003)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 6. Does not call
  `setCurrentUserId` (deliberately, per this run's explicit instruction — same open item T010
  left, see that task's report). **New file added, not in `plan.md`'s tree**: `metro.config.js`
  — required because expo-router's route discovery treats every `.tsx` file under `app/`
  (including a colocated `register.test.tsx`) as a route, which broke the real web bundle
  (pulled `@testing-library/react-native` into production and crashed Metro's dev server); see
  Run 6 for the full writeup.
- [X] T013 [P] [US1] Create `src/features/identity/CodeInput.tsx` — platform-neutral 5-digit
  code input, accessible, with `src/features/identity/CodeInput.test.tsx`. *(FR-002)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 7. Adds
  `src/features/identity/CodeInput.types.ts` (shared `CodeInputProps` interface, imported by
  T013/T014's three files so they cannot drift). **Deviation requiring visibility**: enabled
  `allowImportingTsExtensions` in `tsconfig.json` so `CodeInput.test.tsx` can import the base
  file by its literal `.tsx` name (`./CodeInput.tsx`) — needed because a bare `./CodeInput`
  import in any Jest test resolves to `CodeInput.ios.tsx` by default
  (`react-native/jest-preset.js`'s `haste.defaultPlatform: "ios"`), which would otherwise
  silently defeat a "platform-neutral" test the moment T014's `.ios.tsx` file exists. See Run 7
  for the alternatives considered (a global `jest.config.js` haste override was tried first and
  reverted — it broke React Native's own internal module resolution).
- [X] T014 [P] [US1] Create `src/features/identity/CodeInput.ios.tsx` and
  `CodeInput.android.tsx` — same interface as T013 plus SMS-autofill
  (`textContentType="oneTimeCode"` on iOS, SMS Retriever/`autoComplete="sms-otp"` on
  Android). Manual smoke check only (Level 3 — SMS autofill isn't meaningfully
  unit-testable); note the check in the task's completion report per `docs/verification.md`.
  *(FR-002, Platform notes)* **Done** — see `progress/impl_001-registration-kyc.md` Run 7.
  **No iOS/Android simulator was available in this environment** — SMS autofill itself was NOT
  verified on-device; only that both files type-check, share `CodeInput.types.ts`'s interface,
  and (for `.ios.tsx`, transitively via Jest's default `haste.defaultPlatform: "ios"`) render
  correctly with `textContentType="oneTimeCode"` set. This is explicitly left for T021's later
  simulator pass, per this run's instructions — not claimed as done here.
- [X] T015 [US1] Create `src/features/identity/VerifyPhoneScreen.tsx` (uses `CodeInput`, shows
  resend button with a countdown driven by `retryAfterSeconds` from T006, calls
  `verifyPhoneCode`/`resendVerificationCode`) and `app/(auth)/verify-phone.tsx` wiring it up,
  navigating to `profile` on success (was `kyc` before the re-scope). Add a screen test
  covering: correct-code success path, wrong-code inline error, resend-disabled-during-
  countdown. Depends on: T006, T013. *(FR-002, Edge Case: code expiry/resend)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 7. **Deviation from this task's
  literal text**: there is no `retryAfterSeconds` to drive the countdown from — T006's own Run 4
  report already established the backend's resend response is `{ message }` only. The countdown
  is instead a client-side-only constant, `RESEND_COOLDOWN_SECONDS = 30`
  (`VerifyPhoneScreen.tsx`), started the instant "Resend code" is pressed — see that file's doc
  comment for the full reasoning. Does not call `setCurrentUserId`, per this run's explicit
  instruction. Also adds `mapVerifyPhoneError`/`mapResendError` to `src/domain/registration.ts`
  (same pattern as T011/T012's `mapRegistrationError`).
- [X] T016 [P] [US1] Create `src/features/identity/ProfileForm.tsx` — personal fields only for
  this task (`nombre`, `apellidoPaterno`, `apellidoMaterno`, birth date, nationality, CURP,
  RFC) plus `acceptedTerms`/`acceptedPrivacyPolicy` checkboxes, via React Hook Form +
  `profileFormSchema` (T007), inline validation errors, accessible labels/roles. Business
  fields are added by T024 (US2) as a conditional extension, not built here — keeps this
  task's scope matched to US1's P1 priority. Add `src/features/identity/ProfileForm.test.tsx`
  asserting required-field validation errors (missing `nombre`/`apellidoPaterno`), the
  accept-required validation (T&Cs/privacy), and a successful-submit call. *(FR-004)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 8. **Deviation from this task's
  literal text, confirmed against T007's already-established schema**: the acceptance fields
  are `tosAccepted`/`privacyAccepted` (not `acceptedTerms`/`acceptedPrivacyPolicy` — T007
  already corrected this naming, this task's text simply hadn't been updated to match). Also
  adds `mapProfileError`/`isPhoneNotVerifiedError` exports to `src/domain/profile.ts` (with
  their own tests in `profile.test.ts`), mirroring T011's `mapRegistrationError` pattern, so
  the profile screen (T017) can surface backend errors meaningfully instead of a generic
  failure. No native-only date/nationality picker was added — see `ProfileForm.tsx`'s top
  comment for why a plain accessible `TextInput` was used instead (no new dependency
  authorized by `plan.md`).
- [X] T017 [US1] Create `app/(auth)/profile.tsx` rendering `ProfileForm`, calling
  `submitProfile` (T008) on submit, navigating to `tutorial` (or letting the gate re-route to
  `main` if the tutorial is already complete) on success. Add a screen test covering the
  happy path. Depends on: T008, T016. *(FR-004)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 8. Also covers the
  acceptance-required-validation and PhoneNotVerified-redirect screen tests per this run's
  brief. Does not call `setCurrentUserId`, per the same deferred-wiring pattern as T012/T015.
  Submits with `{ isBusiness: false }` — business-field wiring is T026's job.
- [X] T018 [US1] Create `src/features/identity/KycStatusScreen.tsx` — branches on
  `rejected | error` **only** (the `pending` branch from the pre-re-scope task text is
  removed — decision B means the gate never routes here for `pending`, so a `pending` branch
  would be dead/misleading code, not defensive code): `rejected` renders
  `user.kycRejectionReason` or the generic fallback copy plus a "Resubmit documents" CTA that
  navigates to a named placeholder route constant (`KYC_RESUBMIT_PLACEHOLDER_ROUTE`, exported
  with a comment pointing at feature 002 — there is no real destination yet, and fabricating
  one would be worse than an explicit placeholder); `error` renders a "couldn't load your
  verification status" message with a retry action. Create `app/(auth)/kyc-status.tsx`
  wiring it to `useKycGate`'s resolved state. Add
  `src/features/identity/KycStatusScreen.test.tsx` covering both branches, including both the
  with-reason and fallback-copy cases for `rejected`, and asserting the resubmit CTA
  navigates to the placeholder route constant (this test doubles as a forcing function — it
  will need a deliberate update once feature 002 defines a real destination). Depends on:
  T010. *(FR-009, FR-010)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 9. **Deviation from this task's
  literal "navigates to a named placeholder route constant" text, per this run's explicit
  instruction ("Do not invent a route... make it an explicit, visible placeholder")**: the
  "Resubmit documents" CTA does NOT call `router.push`/`router.replace` at all — there is no
  `KYC_RESUBMIT_PLACEHOLDER_ROUTE`. Instead it renders as a disabled `Pressable` with adjacent
  `KYC_RESUBMIT_PLACEHOLDER_COPY` text ("Document resubmission isn't available yet. Check back
  soon.") stating plainly that it isn't wired yet — navigating to a nonexistent path would have
  hit expo-router's generic "Unmatched Route" screen, which looks like a bug rather than an
  intentional placeholder. See Run 9 for the full reasoning.
- [X] T019 [US1] Create `src/features/identity/TutorialScreen.tsx` and
  `app/(onboarding)/tutorial.tsx`; on completion, call `markTutorialComplete()` (T006) and
  invalidate the React Query user cache so `useKycGate` re-routes to `main` on next
  evaluation. Add a screen test asserting the completion call and the resulting cache
  invalidation. Depends on: T006, T010. *(FR-007)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 9. Adds `src/domain/tutorial.ts`
  (pure `tutorialStorageKey()`) and `src/lib/tutorial-storage.ts` (the Expo-specific
  expo-secure-store/web-localStorage adapter T019 calls for) — `markTutorialComplete()` (T006)
  itself stays a documented no-op (no backend endpoint exists); the actual "shown only once"
  persistence is entirely local, keyed by the **Supabase auth user id** (`session.user.id`),
  not the backend's own `User.id` — see `tutorial.ts`'s doc comment for why (the backend's own
  id is not reliably available on a cold boot at all). Also extends `useKycGate.ts`'s `queryFn`
  to read that local flag on every fetch (this is "exactly where that read happens" per this
  run's instruction — `toDomainUser()` itself is untouched and still hardcodes `false`, which
  is correct for its own callers, brand-new registrations; see Run 9 for the full writeup) and
  adds `refetchStatus`/`isRefetching`/`kycRejectionReason` to `useKycGate`'s return value (used
  by T018's `kyc-status.tsx`).
- [X] T020 [US1] End-to-end wiring check: confirm `useKycGate` (T010) correctly redirects
  through every state reachable by this story — unauthenticated → `register`; session,
  `!phoneVerifiedAt` → `verify-phone`; phone verified, profile incomplete → `profile`
  (**including the resumability case**: reopening the app in this state lands directly on
  `profile`, not `register`); profile complete, `kycStatus: pending`, tutorial incomplete →
  `tutorial`; profile complete, `kycStatus: pending`, tutorial complete → **`main`**
  (decision B — this is the case most likely to silently regress to the pre-re-scope
  behavior); `kycStatus: rejected` → `kyc-status` (rejection copy) — assert this via a mocked
  fixture and note in the test/report that it cannot be exercised against the real backend
  today (see spec.md). Add an integration-style test in `src/features/identity/
  useKycGate.test.ts` (extends T010's test) exercising each transition via a mocked React
  Query cache. Depends on: T012, T015, T017, T018, T019. *(FR-001, FR-002, FR-004, FR-007,
  FR-009, FR-010)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 10 for the full writeup.
  `resolveKycRoute()`/`useKycGate()`'s own wiring is verified correct for every state in the
  matrix above (2 new tests added: `kycStatus: "verified"` → `main` alongside `"pending"`, and
  a no-flash proof for a session-present cold boot, not just the no-session case T010 already
  covered) — no defect found in the gate itself, and no dead/looping route target.
  **CRITICAL FINDING, not fixed here (requires a design decision, out of this task's scope
  — see Run 10)**: no code anywhere in this repo (`register.tsx`, `registration.ts`,
  `verify-phone.tsx`, `profile.tsx`, or the backend's own `POST /identity/register` response)
  ever establishes a Supabase Auth session. `useKycGate`'s gate is keyed entirely on
  `supabase.auth.getSession()`, so a real user who has genuinely registered/verified/submitted
  their profile against the backend is *still* routed to `"unauthenticated"` → `/register` on
  every render, because `hasSession` never becomes true — this is not one of the matrix states
  above malfunctioning, it's that the precondition ("a session exists") for every other state
  is never reached in practice today. This blocks T021's manual smoke check from getting past
  the register step and blocks T023's session-persistence check equally. Flagged for
  spec-writer/human, not fixed here — see Run 10 for why this needs a design decision (client
  `signInWithPassword` after registration vs. a backend-returned token vs. gating on the
  dev-only `X-User-Id` instead of Supabase session) rather than a narrow technical fix.
- [X] T031 [US1] **Discovered by T020.** Fix the session-establishment gap T020's end-to-end
  wiring check found: nothing in this repo ever called a Supabase Auth primitive that
  establishes a session, so `useKycGate` (keyed on `supabase.auth.getSession()`) always resolved
  `"unauthenticated"` for a real user, no matter how far they'd actually registered against the
  backend. Per the human decision recorded 2026-08-04: after a successful `POST
  /identity/register`/`/identity/register/business`, call `supabase.auth.signInWithPassword`
  with the same credentials just registered (the backend already creates that Supabase Auth
  account server-side via `signUpWithPassword`, confirmed against `Draw-a-card`'s
  `src/modules/identity/service.ts:143`). Implemented as a `SignInWithPassword` DI seam in
  `src/domain/registration.ts` (mirroring the existing `ApiClient` DI pattern) wired to the real
  `supabase.auth.signInWithPassword` in a new `src/lib/supabase-client.ts` export
  (`signInWithPassword`), called from `app/(auth)/register.tsx`. `submitPersonalRegistration`/
  `submitBusinessRegistration` now return `{ user, sessionError }` instead of a bare `User`;
  a non-null `sessionError` (registration succeeded, sign-in failed — e.g. email confirmation
  required) is surfaced by `register.tsx` as an explicit "your account was created, but..."
  message with a "Retry sign-in" action (`retrySignIn`, new in `registration.ts`) that retries
  only the sign-in primitive with the in-memory-only credentials, never re-registering. Depends
  on: T020. *(FR-001, FR-006)* **Done** — see `progress/impl_001-registration-kyc.md` Run 11 for
  the full writeup, including the regression test that specifically asserts the sign-in
  primitive is invoked (the kind of test that would have caught the original defect), the exact
  UX for the sign-in-fails case, and a report on whether the same gap exists elsewhere (it does
  not — every other session read in this repo, `useKycGate`/`src/lib/api.ts`/
  `app/(onboarding)/tutorial.tsx`, is downstream of this one now-fixed establishment point).
- [X] T032 [US1] **Discovered by T021's manual web smoke check** (register/verify-phone/profile
  screens exercised directly in a browser at a 375px viewport). Two defects found:
  - **Defect 1** — raw Zod default validator messages leak to users (e.g. submitting the empty
    register form showed "String must contain at least 1 character(s)" for Username instead of
    real copy). Audit all of `src/domain/schemas.ts` for any validator missing a custom
    `message`/`errorMap` and add real, specific copy (username `.min(1)`/`.max(30)`,
    `apellidoMaterno`, `commercialName`/`fiscalAddress`, `email`, `birthDate`'s
    `z.coerce.date()`, and the `tosAccepted`/`privacyAccepted` `z.literal(true)` fields, found
    during the audit and carrying the identical raw-default-leak bug).
  - **Defect 2** — `apellidoMaterno` (and the identical latent bug in the base
    `profileFormSchema`'s `commercialName`/`fiscalAddress`) was not genuinely optional:
    `.min(1).optional()` accepts `undefined` but not `""`, and React Hook Form produces `""`
    (not `undefined`) for a cleared controlled `TextInput` — so the real type-then-clear path
    blocked submission with defect 1's raw message. Fixed by a new
    `optionalNonEmptyString()` helper (`src/domain/schemas.ts`) that preprocesses an
    empty/whitespace-only string to `undefined` before validation, so the wire payload omits the
    key (via `JSON.stringify` dropping `undefined`-valued properties) rather than sending `""`.
    `ProfileForm.tsx`'s `undefined`-default workaround (`DEFAULT_VALUES.apellidoMaterno` +
    custom `onChangeText`) became unnecessary once the schema normalizes it itself, and was
    simplified to match every other text field. *(FR-004, SC-002)* **Done** — see
    `progress/impl_001-registration-kyc.md` Run 12 for the full writeup, including the new
    regression tests for the type-then-clear path (`ProfileForm.test.tsx`,
    `src/domain/schemas.test.ts`, `src/domain/profile.test.ts`) and the empty-register-form
    Username-message regression test (`RegistrationForm.test.tsx`).
- [X] T033 [US1] **Discovered by `code-reviewer`'s second review of this feature (Finding 1,
  BLOCKING)** — `setCurrentUserId()` (`src/lib/api.ts`) was never called anywhere in the app.
  Every one of `register.tsx`, `verify-phone.tsx`, `profile.tsx`, and `useKycGate.ts` carried a
  comment saying that wiring was "intentionally left for a later task," but no task ever added
  it, so `POST /identity/phone/verify`, `POST /identity/phone/resend`, `POST
  /identity/me/profile`, and `GET /identity/me/kyc-status` all 401'd (`Unauthenticated`) against
  the real backend, permanently stranding a user on the verify-phone screen after a correct
  registration — breaking US1's Acceptance Scenario 2 (and transitively 3) and the FR-009/FR-010
  returning-user path. Fixed by calling `setCurrentUserId(user.id)` — the backend's own
  `User.id`, not the Supabase `authProviderId` — exactly once, in `app/(auth)/register.tsx`,
  right after a successful registration response and before the `sessionError` branch, so it
  also covers the T031 sign-in-retry path (`retrySignIn` never re-registers, so the id set on
  the original call is still in place). Cleared (`setCurrentUserId(undefined)`) in
  `useKycGate.ts`'s existing `onAuthStateChange` subscription whenever the Supabase session is
  lost — the one place in the app that observes every auth-state transition, so a stale backend
  user id can never leak into a request made by whichever user's session comes next in the same
  JS process. Added an `Unauthenticated` (401) branch to `mapVerifyPhoneError`,
  `mapResendError`, and `mapProfileError` (a shared, actionable `SESSION_LOST_MESSAGE` export in
  `src/domain/registration.ts`) so a regression of this mechanism surfaces an honest, actionable
  message instead of the generic fallback. Updated the now-stale "intentionally left for a later
  task" comments in `register.tsx`, `verify-phone.tsx`, `profile.tsx`, and `useKycGate.ts`.
  *(FR-001, FR-002, FR-004, FR-009, FR-010)* **Done** — see
  `progress/impl_001-registration-kyc.md` Run 15 for the full writeup, including: a real-backend
  curl reproduction (401 without the header, correctly authenticated with it, against the live
  local backend from `docker compose up`) proving the fix against the actual API, not just
  mocks; a new `src/lib/api.test.ts` exercising the real (unmocked) header-building path in
  `src/lib/api.ts`; a new `app/(auth)/register.session-wiring.test.tsx` that renders the real,
  unmocked `RegisterScreen` + `submitPersonalRegistration` + `api` singleton and asserts the
  X-User-Id header is genuinely present on the next authenticated call — proven, by temporarily
  reverting the fix, to fail exactly as the original defect would have; and a new
  `useKycGate.test.ts` case proving the sign-out clear via the same real, unmocked mechanism
  (also proven to fail when reverted). Depends on: T012, T015, T017, T031.

- [X] T034 [US1] **Discovered by manual iOS-simulator testing against a live local backend**
  (orchestrator-verified: `POST /identity/register` confirmed via curl to return HTTP 201 with a
  real created user, `EXPO_PUBLIC_SUPABASE_URL` confirmed unset so the Supabase client falls back
  to the unreachable `https://placeholder.supabase.co` placeholder host, curl against that host
  confirmed to return `000`). `src/lib/supabase-client.ts`'s `signInWithPassword` wrapper had no
  try/catch: it assumed `supabase.auth.signInWithPassword` always *resolves* to `{ data, error }`,
  which holds for auth-level failures (bad credentials, unconfirmed email) but not for
  network-level failures (unreachable host, DNS failure, offline, timeout), where the underlying
  `fetch` *rejects*. The escaped throw was caught by `app/(auth)/register.tsx`'s *registration*
  try/catch — the same catch that handles genuine registration failures — misrepresenting a
  successful registration (real user already created server-side) as a failed one; retrying then
  hit the backend's real `EmailTaken` (409), permanently locking the user out of an account that
  genuinely exists. This is precisely the trap T031's "Your account was created — we couldn't sign
  you in automatically" screen was built to prevent, defeated by this one unhandled path. Fixed by
  wrapping `signInWithPassword` in try/catch, returning a new, distinct
  `NETWORK_SIGN_IN_ERROR_MESSAGE` ("We couldn't reach the sign-in service...") instead of throwing,
  so a network failure is now routed through the same `{ error: string }` contract
  `registration.ts`'s `RegistrationResult.sessionError` already expects — landing on the
  session-issue screen with an honest, distinct message from a credentials rejection, never the
  generic registration-error path. `retrySignIn` needed no separate fix — it forwards to the same
  now-fixed `signIn` primitive. **Audit of every other `supabase.auth.getSession()`/`{ data, error
  }`-shaped call for the same bug class, per this task's brief**: found and fixed two more, both
  genuinely reachable, neither previously guarded: (1) `useKycGate.ts`'s session-check
  `useEffect` called `supabase.auth.getSession().then(...)` with no `.catch` — a rejection there
  silently discarded the promise, `setSessionResolved(true)` never ran, and `isLoading` stayed
  `true` forever (an infinite loading spinner on cold boot, not a crash and not a route); fixed by
  adding a new `sessionCheckFailed` state, set on rejection, that fails closed to the same
  retryable `"kyc-status"`/`statusFetchFailed: true` state FR-010 already defines for a
  current-user-fetch failure (never a false `"unauthenticated"`), and cleared on any subsequent
  authoritative `onAuthStateChange` event. (2) `app/(onboarding)/tutorial.tsx`'s
  `handleComplete` called `supabase.auth.getSession()` directly, unguarded — a rejection there
  would skip the cache invalidation entirely, silently stranding the user on the tutorial screen
  after pressing "Get started" with no error and no progress; fixed with a local try/catch that
  degrades the same way `src/lib/tutorial-storage.ts`'s own catch blocks already do (the local
  completion flag may not persist, a UX annoyance, not a data-integrity problem), while always
  still running the cache invalidation. **`src/lib/api.ts`'s fetch path audited, confirmed
  already safe, not changed**: `getToken`'s own `supabase.auth.getSession()` call is `await`-ed
  inside `createApiClient`'s async function body, so a rejection there propagates as a normal
  promise rejection through every call site — all of which are already wrapped in either a
  component-level try/catch (`register.tsx`, `verify-phone.tsx`, `profile.tsx`) or React Query's
  own error handling (`useKycGate.ts`'s `userQuery`) — landing on `mapRegistrationError`/
  `mapVerifyPhoneError`/`mapProfileError`'s generic-fallback branch (a mapped, user-visible error)
  rather than an unhandled rejection; no call site found that awaits `api()` outside such a
  boundary. New tests: `src/lib/supabase-client.test.ts` (new file — the regression test mocks
  the underlying SDK call to *reject*, not resolve-with-error, the shape every pre-existing mock
  in this feature used and exactly why this was missed; confirmed to fail with the fix reverted),
  a new `app/(auth)/register.session-failure.test.tsx` (mocks only `@supabase/supabase-js` itself,
  running the real `register.tsx` + `registration.ts` + `supabase-client.ts`, confirmed to fail
  with the fix reverted — asserts the session-issue screen renders and the generic
  `registration-form-error` banner does not), plus one new rejection-case test each in
  `useKycGate.test.ts` and `app/(onboarding)/tutorial.test.tsx` (both confirmed to fail with their
  respective fixes reverted). *(FR-001, FR-006)* **Done** — see
  `progress/impl_001-registration-kyc.md` Run 16 for the full writeup.
**Checkpoint**: User Story 1 (MVP) is fully functional and independently testable — a
personal account can register end-to-end, reaches the main app at `kycStatus: pending`, and
the routing gate correctly resumes an abandoned registration and blocks `rejected` accounts
(verified via mocked fixture).

---

## Phase 4: User Story 3 - Session persistence (Priority: P1)

**Goal**: A logged-in user stays logged in across a full app restart (mobile) or tab
reopen (web), with no re-authentication flash of the wrong screen.

**Independent Test**: Per spec.md — log in, fully kill and reopen the app (mobile) or
close/reopen the tab (web), confirm still authenticated.

**Note**: `src/lib/supabase-client.ts` already configures `persistSession: true` with
`expo-secure-store` on native and the SDK's web default — this story is primarily about the
gate correctly *using* that persisted session on cold boot, not new persistence code. See
`spec.md`'s Assumptions (finding 5) for the constraint this story does **not** attempt to
solve: the backend's identity endpoints authenticate via a dev-only `X-User-Id` header stand-
in, not real session/token verification, until backend `003-session-authentication` ships —
this story validates that the frontend's own Supabase session survives a restart, not that
the backend genuinely verifies it belongs to the calling user.

### Implementation for User Story 3

**Checkpoint**: User Stories 1 and 3 (both P1) are complete and independently verified.

---

## Phase 5: User Story 2 - Business ("Tienda") registration (Priority: P2)

**Goal**: A visitor can register a Tienda account (personal fields at registration, business
fields — commercial name, RFC, fiscal address — at the profile step), producing a linked
`BusinessProfile`.

**Independent Test**: Per spec.md — register with `accountType: business`, verify phone,
submit the profile step including commercial name/RFC/fiscal address, confirm a linked
`BusinessProfile` is created, and confirm the profile step rejects submission without RFC.

### Implementation for User Story 2

- [X] T024 [US2] Extend `src/features/identity/RegistrationForm.tsx` (T011) with an
  account-type toggle (`personal` / `business`) — this only changes which registration
  endpoint T012 calls (T006's `submitPersonalRegistration` vs.
  `submitBusinessRegistration`); no new fields appear at this screen (business fields moved
  to the profile step, per finding 4 in spec.md's Clarifications). Extend
  `RegistrationForm.test.tsx` with a case asserting the correct submit function is called per
  selected type. Depends on: T011. *(FR-003)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 13. Toggle is plain local React
  state (`AccountType`, new export), not React Hook Form/Zod, since the backend has no request-
  body field for it — it's encoded entirely by which endpoint is called (T025). Rendered as an
  accessible `radiogroup`/`radio` pair with 44x44 targets, keyboard-operable via the same
  Pressable pattern already used elsewhere in this form.
- [X] T025 [US2] Update `app/(auth)/register.tsx` (T012) to branch on the selected account
  type and call `submitPersonalRegistration` or `submitBusinessRegistration` (T006)
  accordingly. Extend the screen test to cover the business path. Depends on: T012, T024.
  *(FR-003)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 13. `submitBusinessRegistration`
  already existed in `src/domain/registration.ts` with full T031 sign-in wiring (added alongside
  `submitPersonalRegistration` back in T006/Run 4) — no domain-layer changes were needed, only
  this screen's branch. Also caches the returned `isBusiness` flag into `useKycGate.ts`'s shared
  `currentUserQueryKey` React Query cache entry, which is what T026's `profile.tsx` reads it
  from.
- [X] T026 [US2] Extend `src/features/identity/ProfileForm.tsx` (T016) with a conditional
  business-fields block (`commercialName`, business `rfc`, `fiscalAddress`, per
  `profileFormSchema`'s business sub-shape, T007) shown when the account is business —
  `isBusiness` is known from the registration step (T024/T025) and carried forward via the
  fetched `User` record (`user.isBusiness`) rather than re-collected. Extend `submitProfile`
  (T008) call site in `app/(auth)/profile.tsx` (T017) to include business fields when
  present. Extend `ProfileForm.test.tsx` with a case for missing RFC producing an inline
  validation error (no submission) when in business mode. Depends on: T008, T016, T017.
  *(FR-003, FR-004)*
  **Done** — see `progress/impl_001-registration-kyc.md` Run 13. `isBusiness` source: the same
  `currentUserQueryKey` React Query cache entry `useKycGate.ts` already owns (not a navigation
  param, per this task's explicit instruction) — `register.tsx` (T025) writes it right after a
  successful registration, `profile.tsx` reads it with a one-shot `queryClient.getQueryData`
  (no new `useQuery` subscription). **Documented known limitation**: this only has a real value
  within the same JS session a registration call populated it in, since the backend's only
  "returning user" endpoint (`GET /identity/me/kyc-status`) doesn't report `isBusiness` — a
  genuine cold-boot resumability case falls back to `false` (personal schema). Consistent with
  this feature's other already-documented backend-contract gaps (X-User-Id, cold-boot
  `fetchCurrentUser`), not a new one.
- [X] T027 [US2] Manual smoke check (Level 3): complete a Tienda registration end-to-end on
  web (register → verify phone → profile with business fields), confirm the linked
  `BusinessProfile` (via API response or test fixture inspection) and that omitting RFC at
  the profile step blocks submission with a visible error. Record in
  `progress/impl_001-registration-kyc.md`. Depends on: T026.
  **Done, partially — see Run 14 for the full honest breakdown.** The orchestrator verified
  in-browser that the account-type toggle renders, is keyboard/AT-reachable, and that selecting
  "Tienda" correctly does not reveal business fields on the register screen (they're at the
  profile step, per the re-scope). **Not verifiable in this environment** (no running backend):
  the full Tienda registration round-trip, the linked `BusinessProfile`, and the missing-RFC
  block against a real server. What **is** verified for those: `ProfileForm.test.tsx`'s existing
  Level 2 tests (business fields present when `isBusiness`, missing-RFC/commercialName/
  fiscalAddress inline errors, no `onSubmit` call) exercise the exact same client-side gate a
  live run would hit before ever reaching the network — this is real, but it is not an
  end-to-end run against a live `BusinessProfile`-creating backend, and is not claimed as one.
- [X] T028 [P] Accessibility pass across every screen/component built in this feature —
  labels, roles, minimum 44x44 tap targets, web keyboard navigation (tab order, focus
  states). Fix findings in place; no new files. *(Constitution VII, SC-002)*
  **Done — see Run 14.** Fixed the one real defect found (account-type radios and the two
  ProfileForm acceptance checkboxes conveyed their checked state only visually — this repo's
  pinned react-native-web 0.19.13 never forwards `accessibilityState` to the DOM at all, so
  `accessibilityState={{ checked }}` alone produced no `aria-checked`) by adding an explicit
  top-level `aria-checked` prop (forwarded verbatim on web; merged into native
  `accessibilityState.checked` by React Native's own `Pressable` on iOS/Android), plus a
  regression test per control (`RegistrationForm.test.tsx`, `ProfileForm.test.tsx`) proven to
  fail before the fix and pass after. Audited every other screen (`verify-phone`, `profile`,
  `kyc-status`, `tutorial`) for the same bug class — no other custom control conveys state only
  visually; every other `accessibilityState` usage is `disabled`/`busy`, and `disabled` is
  already forwarded correctly on web regardless (react-native-web's `Pressable` sets
  `aria-disabled` directly from its own `disabled` prop, not from `accessibilityState`).
- [X] T029 [P] Responsive layout check at a 375px-wide web viewport, and phone + tablet form
  factors on iOS/Android simulators, across every new screen. Fix findings in place. *(SC-003)*
  **Done, scoped honestly — see Run 14.** No browser-automation or iOS/Android simulator tool
  was available in this environment (confirmed: no Playwright/Puppeteer in `node_modules`, no
  simulator tooling) — no live-render check at 375px/phone/tablet was performed for any screen
  beyond what the orchestrator already verified for `register` (given in the task brief).
  What was verified for every other screen (`verify-phone`, `profile`, `kyc-status`, `tutorial`,
  plus `register`'s own session-issue view): a full static review of every `StyleSheet` in this
  feature's screens/components confirms 100% adherence to the exact layout pattern already
  empirically verified clean on `register` — `screen: { flex: 1, alignItems: "center", padding:
  24 }` wrapping a `container: { width: "100%", maxWidth: 420, gap: 16 }`, no fixed pixel widths
  exceeding 375px, no absolute positioning, no `ScrollView`/horizontal-scroll constructs, and the
  two `flexDirection: "row"` usages (RegistrationForm's account-type pills, ProfileForm's
  checkbox rows) both fit comfortably within a 327px content width (the exact width the
  orchestrator measured for `register`'s inputs) with no wrapping/overflow risk. No findings to
  fix. This is a structural/code-review claim, not a rendered-pixel claim — flagged as such.
- [X] T030 Run `./init.sh` end to end (all six stages, no `--skip-*` flags) and confirm
  `RESULT: SUCCESS` with the "Tests" stage at OK. Fix any regressions found. Depends on: all
  prior tasks.
  **Done — see Run 14.** `RESULT: SUCCESS (7/7 stages passed)`, Tests stage: OK (166/166, up from
  164 — the 2 new T028 regression tests). Type-check: OK. Web build check: OK (13 clean routes
  exported, no test routes leaked). `expo-doctor`'s outdated-dependency WARN is the same
  pre-existing, non-blocking advisory every prior run has reported — not touched, per this task's
  explicit instruction not to attempt a dependency upgrade. `CHECKPOINTS.md` walked: no stray
  `console.*` debug calls, no context-free `TODO`/`FIXME`/`XXX` in this feature's own code, no
  temp files, no dead code left by the re-scope (confirmed against `plan.md`'s "REMOVED"/
  "Deferred to feature 002" notes — nothing document-upload-shaped remains in `src/`/`app/`).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Done (T001).
- **Foundational (Phase 2)**: T002/T003 done; T004/T005 (their re-scope follow-ups) block
  T006 onward — BLOCKS all user stories.
- **User Story 1 (Phase 3, P1)**: Depends on Foundational only.
- **User Story 3 (Phase 4, P1)**: Depends on Foundational (T010) only — independently
  implementable in parallel with US1 by a second contributor, though it's listed after US1
  here since it reuses US1's `register`/`kyc-status` screens for its manual smoke check.
- **User Story 2 (Phase 5, P2)**: Depends on US1's `RegistrationForm`/`register.tsx`/
  `ProfileForm.tsx`/`profile.tsx` (T011, T012, T016, T017) existing to extend, per this
  feature's explicit P1-before-P2 ordering requirement.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- T004 and T005 are sequential (T005 depends on T004's new `User` fields), not parallel,
  despite both being marked `[P]` relative to other Phase 2 work.
- Within Phase 2 (Foundational), after T004/T005: T006, T007 touch disjoint files and can
  run in parallel; T008 depends on T006+T007; T009 has no dependency; T010 depends on
  T004+T005.
- Within Phase 3 (US1): T011, T013, T016 touch disjoint files and can run in parallel once
  Phase 2 is done; T012/T014/T015/T017/T018/T019/T020 have the listed dependencies.
- Within Phase 6: T028 and T029 can run in parallel; T030 must run last.

---

## Parallel Example: Phase 2 (Foundational, after T004/T005 land)

```bash
Task: "Create src/domain/registration.ts + registration.test.ts"
Task: "Update src/domain/schemas.ts (trim business fields, add profileFormSchema)"
Task: "Create app/(auth)/_layout.tsx + app/(onboarding)/_layout.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup, done) and Phase 2 (Foundational, including the T004/T005
   re-scope follow-ups).
2. Complete Phase 3 (User Story 1).
3. **STOP and VALIDATE**: run T021's manual smoke check across web/iOS/Android, paying
   particular attention to the `pending`-reaches-main-app behavior (decision B).
4. That's a demoable MVP — personal registration + the routing gate end to end.

### Incremental Delivery

1. Setup + Foundational (incl. re-scope follow-ups) → foundation ready.
2. Add US1 → validate independently → MVP.
3. Add US3 → validate independently (mostly verification, low net-new code).
4. Add US2 → validate independently → full feature complete.
5. Polish (Phase 6) → `./init.sh` green with tests at OK, feature ready for `code-reviewer`.

---

## Requirement Traceability (FR → Tasks)

| Requirement | Covering Tasks |
|---|---|
| FR-001 (email+password+phone+username account creation via auth provider) | T006, T011, T012, T020, T031, T033, T034 |
| FR-002 (5-digit SMS code, SMS autofill on iOS/Android) | T005, T006, T013, T014, T015, T020, T033 |
| FR-003 (personal + business account types; business fields at profile step) | T006, T007, T008, T011, T012, T020, T024, T025, T026 |
| FR-004 (typed profile fields + ToS/privacy, gated behind phone verification) | T004, T005, T007, T008, T016, T017, T020, T032, T033 |
| FR-005 (case/accent-insensitive username uniqueness, surfaced in UI) | T006, T011 |
| FR-006 (secure session persistence across restarts, all platforms) | T010, T022, T023, T031, T034 (T031 is what actually establishes the session `src/lib/supabase-client.ts`'s `persistSession: true` then persists; T034 is what stops a network-level failure from being misrepresented as a registration failure or wedging the gate — see those tasks for the full reasoning) |
| FR-007 (first-run tutorial shown only once) | T002, T003, T005, T010, T019, T020, T035 (T019 satisfies "once per install" via local storage — the only option when the backend had no endpoint; **T035 is what actually satisfies "once per *user*"**, now that the backend's `002-onboarding-tutorial-state` shipped `GET`/`POST /identity/me/tutorials*`) |
| FR-008 (deferred to feature 002) | — (see Deferred to feature 002 below) |
| FR-009 (routing gate: verify-phone/profile/tutorial/main/kyc-status, pending passes through, rejected blocks) | T004, T005, T010, T018, T020, T033 |
| FR-010 (retryable error state on fetch failure) | T005, T010, T018, T020, T033 |

---

## Notes

- [P] tasks touch different files with no dependency on an incomplete task, except where
  explicitly noted (T004/T005 are sequential despite both being foundational).
- Login for a user whose session has genuinely expired (re-entering credentials) is out of
  scope for this spec — it is not one of spec.md's user stories/requirements. Session
  persistence (US3) is about *not losing* a valid session, not about building a fresh login
  screen; that belongs to a future feature if/when it's needed.
- Every task that touches `src/domain` or a screen carries its own test per
  `docs/verification.md` Levels 1–2 — none of that is deferred to a separate "add tests"
  task.
- Commit after each task or logical group; stop at each checkpoint to validate a story
  independently before moving to the next.
- Per `spec.md`'s Assumptions (finding 5): none of this feature's tasks build real backend
  session/token verification (that's backend `003-session-authentication`, `pending`). If any
  task here needs to send an `X-User-Id` header to satisfy the backend's dev-only stand-in in
  a local/dev environment, that's a small, explicitly-scoped addition to `src/lib/api.ts`
  (not a new architectural concept) — flagged here so it isn't missed silently if a task
  author hits a 401/403 from the backend during T006/T008 implementation and needs to
  investigate why.

---

## Deferred to feature 002

Preserved verbatim from the pre-2026-08-04 task list (this feature's original T005, T006,
T014, T015, T016, T017) so feature `002-kyc-document-verification`'s `spec-writer`/
`task-implementer` can reuse this breakdown directly. Task IDs below are as they existed in
this file before the re-scope — they are historical references only, not part of this
feature's active numbering, and must not be reused for new 001 tasks.

> **Formerly T005** [P] [US1] Create `src/domain/kyc.ts`: `presignDocumentUpload(documentType,
> contentType, fileSizeBytes)`, `confirmDocumentUpload(documentId)`, `submitKycForm(input:
> KycFormInput)` wrapping `api()`. Before implementing, check the backend repo's KYC-document
> feature spec for the exact presign/confirm endpoint paths and payload field names. Add
> `src/domain/kyc.test.ts` covering happy path + one failure path per function. *(Original
> FR-004)*
>
> **Formerly T006** [P] [US1] Create `src/lib/camera-upload.ts`: `uploadFileToPresignedUrl(uri,
> uploadUrl, headers)` — Expo-specific adapter (reads the local file via `expo-file-system` or
> the native `Blob`/`FormData` path appropriate to RN's `fetch`, then does the raw `PUT`). No
> React Native import leaks into `src/domain` (Constitution IV boundary). A unit test here is
> limited to mocking `fetch` and asserting the request shape. *(Original FR-004)*
>
> **Formerly T014** [P] [US1] Create `src/features/identity/PermissionExplanationScreen.tsx`
> — shown before the native camera-permission OS prompt, with a test asserting its copy/CTA
> render. *(Original FR-008)*
>
> **Formerly T015** [P] [US1] Create `src/features/identity/KycDocumentUpload.web.tsx` —
> standard `<input type="file">`-based picker for official ID + proof of life, calling
> `presignDocumentUpload`/`confirmDocumentUpload` on selection. Add a screen test. *(Original
> FR-004, Platform notes: web)*
>
> **Formerly T016** [P] [US1] Create `src/features/identity/KycDocumentUpload.native.tsx` —
> shared iOS+Android chooser (camera via `expo-camera` vs. library via `expo-image-picker`),
> routes through `PermissionExplanationScreen` before the OS prompt, falls back to the
> library picker with a settings deep link when permission is permanently denied, uses
> `uploadFileToPresignedUrl` + `presignDocumentUpload`/`confirmDocumentUpload` with React
> Query mutation retry/backoff for poor connectivity. Add a screen test (mocking
> camera/picker modules) covering the permission-denied fallback path. *(Original FR-004,
> FR-008, Edge Cases: camera denied, offline retry)*
>
> **Formerly T017** [US1] Create a document-upload screen combining the above with a
> terms/privacy acceptance step and a final KYC-form-submit call, navigating onward once
> accepted. **Note for feature 002's spec-writer**: the terms/privacy acceptance piece of
> this original task is now handled by feature 001's `app/(auth)/profile.tsx` (T017 in this
> file's active numbering) — feature 002's version of this screen should NOT re-collect
> ToS/privacy acceptance, only handle document upload/review. Add a screen test covering
> whatever validation feature 002's spec ends up requiring. *(Original FR-004)*

---

## Moved to feature `003-registration-kyc-completion` (2026-08-04)

These four tasks were still open when `001-registration-kyc` was closed at the human's
direction. They are **carried over, not dropped** — `003-registration-kyc-completion` owns them
and this section is the source of truth for their scope. Each is reproduced verbatim below,
including its original task id, so nothing has to be re-derived.

Status at the time of the move:

| Task | Blocked on |
|---|---|
| T035 (real tutorial endpoints) | **Nothing — start here.** Backend shipped `GET`/`POST /identity/me/tutorials*` on 2026-08-04. |
| T022 / T023 (US3 session persistence) | Backend `004-session-authentication` (no full-profile GET; `X-User-Id` is in-memory only). |
| T021 (manual smoke) | Web: backend `006-web-cors`. iOS: real Supabase credentials + backend off `AUTH_PROVIDER_MODE=mock`. Android: never exercised, no Android SDK on the dev machine. |

Also worth folding into 003: a `code-reviewer` pass over 001's **T033 and T034**, which landed
after the last review and were never re-reviewed.

- [MOVED] T021 [US1] Manual smoke check (`docs/verification.md` Level 3): run `npm run web` and
  complete the full personal-registration flow (register → verify phone → profile →
  tutorial); confirm a `pending` account reaches the main app after the tutorial, not a
  blocking screen. Then check the iOS and Android simulators specifically for the
  platform-only path — SMS autofill (T014). Record the check (what was exercised, on which
  platform/simulator) in `progress/impl_001-registration-kyc.md` per AGENTS.md. Depends on:
  T020, T031.

- [MOVED] T035 [US1] **Discovered 2026-08-04 by the orchestrator while registering the backend's
  CORS feature.** Move tutorial completion off local-only storage and onto the **real backend
  endpoints, which now exist**. T019 persisted `hasCompletedTutorial` in
  `src/lib/tutorial-storage.ts` (`expo-secure-store` on native, web equivalent on web, keyed by
  user id) for one stated reason: the backend had no tutorial-completion endpoint. That was
  verified true at the time. **It is now false** — the backend's `002-onboarding-tutorial-state`
  feature shipped and is `done` as of 2026-08-04, adding `GET /identity/me/tutorials` and
  `POST /identity/me/tutorials/complete` (orchestrator-verified present in
  `../Draw-a-card/src/modules/identity/routes.ts`; the full route set is now `/ping`, `/register`,
  `/register/business`, `/phone/verify`, `/phone/resend`, `/password-reset`, `POST /me/profile`,
  `GET /me/kyc-status`, `GET /me/tutorials`, `POST /me/tutorials/complete`).
  **Why it matters**: local-only completion does not survive a reinstall, does not follow the user
  to a second device, and is lost whenever secure-store is cleared — so the first-run tutorial
  replays for a user who has already seen it, violating FR-007's "only once per user" (the
  requirement is per *user*, not per *install*).
  **Scope**: add the two calls to `src/domain/profile.ts` or a new `src/domain/tutorials.ts`
  (decide which; keep API calls in `src/domain` per Constitution IV, following the existing
  `ApiClient` DI seam); read tutorial state from `GET /me/tutorials` so `toDomainUser()` stops
  hardcoding `hasCompletedTutorial: false` (`src/domain/registration.ts` — that hardcode is the
  reason the gate cannot currently see completion at all); call `POST /me/tutorials/complete` from
  `app/(onboarding)/tutorial.tsx`'s `handleComplete` alongside the existing React Query cache
  invalidation. **Read the backend's contract first** — per its own feature notes, `GET
  /me/tutorials` returns *only* `{ tutorials: { onboarding: <ISO>|null } }` (deliberately never a
  full `SafeUser`/curp/rfc payload — their Non-Goal NG-005), and `POST .../complete` is idempotent
  and returns 400 on an unrecognized `tutorialKey`. Do not invent the key name; confirm
  `TUTORIAL_KEYS` in their source.
  **Decide and state explicitly**: whether `src/lib/tutorial-storage.ts` is deleted outright or
  kept as an offline-tolerant cache in front of the backend. Both are defensible; if kept, the
  backend must be the source of truth on conflict, and say so in the code. Note these endpoints
  sit behind the same dev-only `X-User-Id` stand-in as the rest of `/identity/me/*` until the
  backend's `004-session-authentication` ships, so T033's `setCurrentUserId` wiring is a
  prerequisite for them working at all.
  Tests: cover the endpoint calls, the `toDomainUser()` change, and the FR-007 regression this
  fixes — a user who completed the tutorial on one install must not be re-shown it when local
  storage is empty but the backend reports a completion timestamp. Depends on: T019, T033.
  *(FR-007)*

- [MOVED] T022 [US3] Add a loading state to `app/_layout.tsx`/`useKycGate` (T010) so cold boot
  shows a neutral loading view (not a flash of `register.tsx` or the main app) while
  `supabase.auth.getSession()` resolves. Add a test asserting the loading state renders
  before `isLoading` flips to `false`. Depends on: T010. *(US3, Constitution III)*

- [MOVED] T023 [US3] Manual smoke check: log in on web, close and reopen the browser tab, confirm
  still authenticated and routed correctly by the gate; repeat on iOS and Android simulators
  with a full kill-and-reopen (not just backgrounding). Record results in
  `progress/impl_001-registration-kyc.md`. Depends on: T022.
