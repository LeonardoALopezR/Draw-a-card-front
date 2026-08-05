# Code Review: 001-registration-kyc — T001–T008 (Setup + Foundational)

**Reviewer**: code-reviewer (independent pass)
**Scope**: T001–T008 only. T009/T010 (not implemented) are explicitly out of scope and not
faulted for their absence.
**Re-scope context accounted for**: spec.md's 2026-08-04 re-scope (Clarifications, "Session
2026-08-04 (re-scope...)") was read fresh from disk and used as the source of truth throughout
— `kycStatus: pending` correctly passes through to the main app, only `rejected` blocks, KYC
document upload is correctly absent (moved to feature 002), and the new `POST
/identity/me/profile` step is correctly present.

## Verification performed independently

- `npm test` → **4 suites, 63 tests, all passing** (matches implementer's claim; re-ran myself,
  did not trust the report).
- `npx tsc --noEmit` → **clean, no errors**.
- `./init.sh` (full run, no skip flags) → **RESULT: SUCCESS (7/7 stages)**. Only WARN is the
  pre-existing `expo-doctor` outdated-dependency advisory (non-blocking per
  `docs/verification.md`, unrelated to this diff).
- Read the actual backend source directly (not the implementer's report) at
  `/Users/leo/Desktop/DrawACard/Draw-a-card/src/modules/identity/{routes,service,validation,
  errors,username}.ts` and cross-checked every field name, endpoint path, response envelope,
  and error code cited in `src/domain/registration.ts`, `profile.ts`, and `schemas.ts` against
  it line-by-line.

## 1. Backend contract fidelity — VERIFIED, no discrepancies found

Every claim the implementer made about the backend contract checks out against the real
source, independently re-derived (not trusted from the report):

- `POST /identity/register` / `POST /identity/register/business` — both accept exactly
  `{ email, password, phone, username }` (backend `registerCredentialsSchema`,
  `validation.ts:44-49`), identical to frontend `personalRegistrationSchema`/
  `businessRegistrationSchema` (`schemas.ts:50-63`). Response envelope `{ user: SafeUser }`
  matches `routes.ts:82-96` and frontend `BackendUser` (`registration.ts:41-59`) field-for-field.
- `POST /identity/phone/verify` response `{ phoneVerifiedAt }` matches `routes.ts:100-107`.
- `POST /identity/phone/resend` response `{ message }` only, **no `retryAfterSeconds`** —
  confirmed absent from `routes.ts:110-117` and `service.ts`; the implementer correctly did not
  invent one, and correctly corrected the resend rate limit to 3/15min
  (`service.ts:30-31`, `OTP_MAX_RESENDS`/`OTP_RESEND_WINDOW_SECONDS`) instead of the
  spec-assumed 60s/5-per-hour figure — this is a legitimate, documented, non-scope-changing
  correction.
- `POST /identity/me/profile` field names: backend `profilePersonalSchema`
  (`validation.ts:60-70`) uses **`tosAccepted`/`privacyAccepted`**, not
  `acceptedTerms`/`acceptedPrivacyPolicy` as `plan.md`'s pre-cross-check Research Decision
  assumed — frontend `profileFormSchema` (`schemas.ts:88-105`) correctly uses the real names.
  `nombre`/`apellidoPaterno` required, `apellidoMaterno` optional, `birthDate`/`nationality`/
  `curp`/`rfc` required — matches `service.ts:315-399`'s `submitProfile()` exactly, including
  that **`rfc` is required for every account type** (not personal-only as `tasks.md`'s literal
  T007 text implied) and there is **no separate `businessRfc` field** — the backend's
  `profileBusinessSchema` reuses the same `rfc` (`validation.ts:78-81`,
  `service.ts:290-292`'s `normalizeRfc()` comment). Both deviations are correctly implemented
  and correctly documented as deviations from the pre-cross-check plan, not silently dropped.
- Error codes: every `ApiError.code` string referenced in `registration.ts`/`profile.ts`
  doc comments and tests (`UsernameTaken`, `EmailTaken`, `PhoneNotVerified`,
  `PhoneCodeInvalid`, `PhoneCodeExpired`, `PhoneCodeAttemptsExceeded`, `PhoneResendRateLimited`,
  `RfcConflict`, `UserNotFound`) matches `errors.ts` and `routes.ts`'s error mapper
  (`routes.ts:167-243`) exactly, including HTTP status codes.
- `requireUserId()`'s `NODE_ENV`-allowlist fail-closed behavior (`routes.ts:56-67`) matches
  the frontend's `X-User-Id` doc comments in `src/lib/api.ts` verbatim.

No silent mismatch found anywhere in this contract. This is a materially higher bar of
diligence than "claims to have checked" — I independently re-derived every claim against the
real backend files.

## 2. Constitution Principle IV boundary — VERIFIED

`grep -rn "import" src/domain/*.ts` (excluding `.test.ts`) shows zero React/React Native
imports; the only hits for "react"/"expo"/"react-native" strings in `src/domain` are prose in
doc comments explaining *why* DI is used to avoid a transitive RN import, not actual imports.
`src/domain/registration.ts` and `src/domain/profile.ts` both take `ApiClient` as an injected
first parameter rather than importing `src/lib/api.ts`'s singleton — this is a stricter
interpretation of Constitution IV than `plan.md`'s literal Project Structure text ("thin
wrappers around `src/lib/api.ts`'s `api()` client") implied, and it's the *correct* one: a
direct import would have transitively pulled `expo-secure-store`/`react-native` into
`src/domain`'s module graph via `src/lib/supabase-client.ts`. Confirmed by reading
`api-client.ts` and `src/lib/api.ts` directly — no framework imports leak in either direction.

## 3. Constitution Principles II/III — VERIFIED

No direct Postgres/Redis/S3/Supabase-table access anywhere in the diff. The only Supabase call
is `supabase.auth.getSession()` in `src/lib/api.ts` (session token retrieval via the auth SDK,
exactly Principle III's sanctioned exception). All other reads/writes go through
`src/domain/api-client.ts`'s `fetch`-based client against the backend REST API.

## 4. The temporary `X-User-Id` header (`src/lib/api.ts`) — highest-risk item, scrutinized

- **Backend-side safety, confirmed independently**: `routes.ts`'s `requireUserId()` only trusts
  the header when `NODE_ENV` is exactly `"development"` or `"test"` (`Set` membership, not a
  substring/loose check); every other value — unset, `"production"`, whitespace-padded,
  wrong-case — throws `HeaderAuthNotAllowedInProduction` (503). An unset `NODE_ENV` (the most
  common misconfiguration) fails closed, not open. This is a real, independently-verified
  backend guarantee, not just a frontend-side comment's claim.
- **Frontend-side scoping**: the header is only ever attached
  (`getHeaders: () => (currentUserId ? { "X-User-Id": currentUserId } : undefined)`) when
  `setCurrentUserId()` has been called — and in this diff's current state, **nothing calls
  `setCurrentUserId()` anywhere** (confirmed by grep; the only reference is the function
  definition itself and its doc comment). The mechanism is inert in the code as it stands
  today. This is correct given T009/T010 (the screens/hooks that would call it) are explicitly
  out of scope for this review.
- **Clearly marked**: the comment block is explicit — "TEMPORARY — ripcord candidate,"
  "DELETE this entire mechanism... once backend 003-session-authentication ships," with the
  exact removal trigger named. This satisfies "clearly marked."
- **Residual, correctly-flagged risk for T009/T010 (not a defect in *this* diff)**: once wired
  in, `EXPO_PUBLIC_API_URL`-style env vars are inlined into the client bundle at Expo build
  time, and this file has no client-side environment gate of its own on whether to *attempt*
  sending the header — the only thing preventing it from being sent in a deployed build is the
  *backend's* `NODE_ENV` check. That is a reasonable design given the spec's Assumptions
  (finding 5) explicitly punts real auth to backend `003` and frames this as a known,
  signed-off, cross-repo constraint this feature does not solve — but it is worth flagging
  forward (not as a blocker on this review) that whoever implements T009/T010 should not add
  any *additional* frontend logic that makes sending this header more automatic/pervasive than
  necessary (e.g. don't call `setCurrentUserId` speculatively before a session is confirmed).

**Verdict on this item**: safely scoped as merged, correctly and prominently marked, cannot
leak into a production build any more than the backend's own already-signed-off deviation
already allows, and is inert (uncalled) in the current diff. Not a blocking finding.

## 5. Test quality — meaningful, not tautological

Spot-checked all four test files line-by-line, not just counted assertions:

- `registration.test.ts` / `profile.test.ts`: use a hand-rolled mock `ApiClient` that captures
  the actual `path` and `JSON.parse(options.body)` sent, then asserts on the *real* request
  shape (e.g. asserts `receivedBody` equals the credentials object, asserts
  `receivedBody.tosAccepted === true`, asserts a personal submission's body has no
  `commercialName` key at all). These would genuinely fail if `registration.ts`/`profile.ts`
  sent the wrong path, wrong field names, or leaked business-only fields into a personal
  submission — not tautological.
- Error-path tests throw a real `ApiError` from the mock client and assert
  `.rejects.toMatchObject({ code, status })` — this exercises `ApiError` construction/
  propagation, not just that a promise rejects.
- `kyc-gate.test.ts`: 13 cases covering every branch of `resolveKycRoute()`, including three
  distinct fail-safe-precedence tests (stale verified, stale pending, and unverified-phone —
  all with `statusFetchFailed: true`) that would catch a regression where the branch order got
  reordered to check `user` properties before `statusFetchFailed`. Not over-mocked — the
  function under test is pure, so there's nothing to mock.
- `schemas.test.ts`: exercises real Unicode edge cases (NFD-decomposed "José", Greek/Cyrillic/
  CJK/emoji rejection, José/jose collision under `normalizeUsernameForComparison`) — these are
  genuine assertions on the actual regex/normalization behavior, not smoke tests.

No test found that only asserts "didn't throw" or mocks the exact behavior it claims to verify.

## 6. `resolveKycRoute`'s fail-safe precedence — VERIFIED narrows-only, never widens

Read `kyc-gate.ts:64-86` directly. Branch order is: `!user` → `unauthenticated`;
`statusFetchFailed` → `kyc-status` (checked unconditionally, before any `user` property is
read); then, only once both of those are false, `!phoneVerifiedAt` → `verify-phone`; incomplete
profile → `profile`; `rejected` → `kyc-status`; else `tutorial`/`main`. There is no reachable
input where `statusFetchFailed: true` produces anything other than `"kyc-status"` — the
`if (statusFetchFailed) return "kyc-status"` is unconditional and appears before every other
`user`-inspecting branch, so no combination of `user` fields can escape it. Confirmed by the
three dedicated fail-safe tests (stale verified+complete, stale pending+complete, and even a
fully-incomplete/unverified stale user) all correctly asserting `"kyc-status"` under
`statusFetchFailed: true`.

## 7. FR → task traceability — honest

Cross-checked `tasks.md`'s Requirement Traceability table and each task's inline "Done" notes
against the actual diff and `npm test` output. All `[X]` marks for T001–T008 correspond to real,
tested, `tsc`-clean code — nothing is marked complete that isn't. The implementer's reported
"deviations from task text" (ToS/privacy field names, no separate business RFC, no standalone
`sendVerificationCode`, no `accountType` field, no `retryAfterSeconds`, `markTutorialComplete()`
as a documented no-op) are all real, all independently confirmed against backend source in
section 1 above, and are recorded both in `tasks.md` and in source comments, not just in the
implementer's own report — so a future reader hits them at the point of confusion.

## `tasks.md` checklist status (T001–T008 only, per review scope)

- [x] T001 — test tooling. Confirmed: `package.json`, `jest.config.js` present and working.
- [x] T002 — superseded in part by T004 (not reopened, correctly).
- [x] T003 — superseded in part by T005 (not reopened, correctly).
- [x] T004 — `IdentityDocument` removed, backend-mirroring `User` fields added. Confirmed in
      `types.ts`.
- [x] T005 — `resolveKycRoute()` widened per decision B. Confirmed in `kyc-gate.ts` and
      `kyc-gate.test.ts`.
- [x] T006 — `registration.ts` created, matches real backend contract, tested.
- [x] T007 — `schemas.ts` updated, matches real backend contract, tested.
- [x] T008 — `profile.ts` created, matches real backend contract, tested.
- [ ] T009, T010 — not implemented. **Correctly out of scope for this review; not faulted.**

## CHECKPOINTS.md walkthrough

### C1 — The harness is complete
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md` and `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 (re-ran independently — `RESULT: SUCCESS (7/7)`).

### C2 — State is coherent
- [x] At most one feature `in_progress` (`001-registration-kyc`; `002` is `pending`).
- [x] `done` features have passing tests — N/A, no feature is `done` yet.
- [ ] `progress/current.md` describes only the active session — **partially stale**: its
      "Open questions / blockers" and "Next step" sections still say "Awaiting the re-scoped
      spec... resume Phase 2 at T004," but T004–T008 are already implemented and `[X]` per
      `tasks.md` and `progress/impl_001-registration-kyc.md` Runs 3–4. This is a documentation
      lag, not a code defect — flagged for whoever closes this session to update before the
      next session starts, not a blocker on the T001–T008 code itself.

### C3 — Code respects the architecture
- [x] `src/domain` has zero React Native / Expo imports.
- [x] N/A — no UI components exist yet in this diff (T009+ not started) to check for embedded
      business logic.
- [x] N/A — no platform-specific files exist yet in this diff.
- [x] No direct Postgres/Redis/S3/Supabase-table access; auth via `supabase.auth.getSession()`
      only.
- [x] No new global state library added.
- [x] No stray `console.log`/context-free `TODO`s (grepped, none found).

### C4 — Verification is real
- [x] Every exported `src/domain` function with logic has a covering unit test (verified by
      reading each test file against each export).
- [x] N/A — no new/changed screens in this diff yet.
- [x] `./init.sh`'s build check (`expo export --platform web`) passes (re-ran independently).

### C5 — The session closed well
- [x] No suspicious untracked files — clean `git status --porcelain` output, only the expected
      new domain/test files and `jest.config.js`.
- [ ] N/A for this partial review — this session/feature has not reached `done` yet, so
      `progress/history.md` having no new entry is expected, not a defect (per that file's own
      "at the point a feature reached done" scoping).
- [x] `feature_list.json` accurately reflects `001-registration-kyc` as `in_progress`.

### C6 — Spec Driven Development
- [x] `spec.md` + `plan.md` + `tasks.md` all exist for `001-registration-kyc`.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers (`grep` confirmed zero matches).
- [ ] N/A — feature is not `done` yet, so "every `tasks.md` item marked `[X]`" doesn't apply
      (T009/T010+ correctly still open).
- [x] Every `FR-00x` touched by T001–T008 (FR-001 through FR-005, FR-007, FR-009, FR-010) is
      covered by at least one test referencing it by comment — confirmed by reading each test
      file's FR-tagged comments against `tasks.md`'s traceability table. FR-006 and FR-008 are
      correctly not yet covered (FR-006 is T010/T022/T023's job; FR-008 is deferred to feature
      002 entirely).

No C1–C6 box relevant to this review's scope (T001–T008) is empty in a way that blocks
approval. The one partially-stale item (`progress/current.md`) is a documentation-hygiene nit,
not a code or test defect.

## Findings

No blocking findings.

**Nits (non-blocking, worth fixing before this session closes)**:
1. `progress/current.md`'s "Open questions / blockers" and "Next step" sections are stale —
   they describe the state as of the re-scope decision, before T004–T008 were implemented.
   Should be updated to reflect that Phase 2 (Foundational) is now complete through T008 and
   the next step is T009/T010, so a future session (or `sdd-orchestrator`) doesn't start from
   a false "resume at T004" premise.
2. `toDomainUser()` (`registration.ts:70-92`) hardcodes `hasCompletedTutorial: false` on every
   mapped user, including one freshly returned from `submitProfile()`. This is correctly
   documented as the intended default for now and is explicitly flagged as an open question for
   whoever implements T019 (local-storage vs. backend field) — not a defect in this diff, just
   confirming the flag is accurate and the caveat should carry forward.

## Verdict

**APPROVE WITH NITS** — T001–T008 are correctly implemented, the backend contract fidelity is
excellent and independently verified line-by-line against the real backend source (not just
the implementer's report), the Constitution IV/II/III boundaries are respected, the
`X-User-Id` mechanism is safely scoped and inert in this diff, `resolveKycRoute`'s fail-safe
precedence is correctly implemented and thoroughly tested, and all 63 tests are meaningful,
not tautological. `npm test`, `npx tsc --noEmit`, and `./init.sh` all pass when re-run
independently. The only issues found are the two non-blocking nits above (stale
`progress/current.md`, a documented-and-flagged-forward `hasCompletedTutorial` default) —
neither touches T001–T008's actual correctness. Proceed to T009/T010.

---

# Code Review: 001-registration-kyc — T009–T021, T024–T032 (UI layer)

**Reviewer**: code-reviewer (independent pass)
**Scope**: everything since the T001–T008 review above — the entire UI layer: `app/**`,
`src/features/identity/**`, plus changes since the last pass to `src/domain/registration.ts`,
`src/domain/profile.ts`, `src/domain/schemas.ts`, `src/lib/supabase-client.ts`, `src/lib/api.ts`,
and `jest.config.js`/`metro.config.js`/`tsconfig.json`/`package.json`. T022/T023 (US3) are
deliberately deferred to backend `003-session-authentication` by human decision and are not
faulted for being incomplete. `progress/impl_001-registration-kyc.md`'s claims were **not**
taken at face value — every claim below was independently re-derived from the code, the real
backend source (`/Users/leo/Desktop/DrawACard/Draw-a-card/src/modules/identity/routes.ts`), and
fresh runs of `npm test` / `npx tsc --noEmit` / `./init.sh`.

## Verification performed independently

- `npx tsc --noEmit` → clean, no errors.
- `npm test` → **17 suites, 166 tests, all passing** (matches the implementer's claim). One
  benign React `act(...)` console warning in `useKycGate.test.ts` (React Query's internal
  notifyManager timer firing outside `act`) — cosmetic, not a failure, does not affect the
  assertions.
- `./init.sh` (full run, no skip flags) → **RESULT: SUCCESS (7/7 stages)**. Only WARN is the
  pre-existing `expo-doctor` outdated-dependency advisory (non-blocking, unrelated to this diff).
- Read the real backend source directly (`Draw-a-card/src/modules/identity/routes.ts`,
  `service.ts`) to re-derive the `requireUserId()` contract myself rather than trust prior
  reports — this is what surfaced Finding 1 below.

## Finding 1 (BLOCKING) — `setCurrentUserId()` is never called anywhere; the real backend
integration is broken from the phone-verification step onward

`src/lib/api.ts`'s `X-User-Id` mechanism only attaches the header when `currentUserId` has been
set via `setCurrentUserId(userId)`. I grepped the entire non-test source tree for actual
invocations (not just the definition/doc comments):

```
grep -rn "setCurrentUserId(" --include="*.ts*" . --exclude-dir=node_modules --exclude-dir=dist
```

The only hits are the function's own definition (`src/lib/api.ts:24`) and doc-comment prose
referencing it (`src/domain/registration.ts:21,203,238`). **No screen, hook, or domain call site
anywhere in `app/` or `src/features` ever calls it with a real argument.** Every one of
`register.tsx`, `verify-phone.tsx`, `profile.tsx`, and `useKycGate.ts` carries an explicit
comment saying this wiring is "intentionally left for a later task" — but no later task in
`tasks.md` (T009 through T032) ever adds that call. It is not in the "Deferred to feature 002"
section either; it's simply dropped.

I independently confirmed against the real backend source
(`Draw-a-card/src/modules/identity/routes.ts:50-60`) that `requireUserId()` has **no fallback**:

```ts
function requireUserId(req: Request): string {
  if (!HEADER_AUTH_ALLOWED_ENVS.has(process.env.NODE_ENV ?? "")) {
    throw new HeaderAuthNotAllowedInProduction();
  }
  const userId = req.header("x-user-id");
  if (!userId) {
    throw new Unauthenticated();
  }
  return userId;
}
```

`POST /identity/phone/verify`, `POST /identity/phone/resend`, `POST /identity/me/profile`, and
`GET /identity/me/kyc-status` all call `requireUserId()`. There is no Authorization/bearer-token
fallback for these routes on the backend (confirmed: no `Authorization`/`Bearer` handling
anywhere in `src/modules/identity/*.ts` other than the outbound calls the backend itself makes
to its own upstream providers). Since `currentUserId` is a module-level `let` that starts
`undefined` and is never assigned, **every one of these four calls will 401
(`Unauthenticated`) against the real local backend, in every environment, forever** — not just
on a "genuine cold boot" (which is the only case the code's own comments acknowledge and treat
as expected/FR-010-covered).

**Concrete failure scenario**: a user fills out the registration form, it succeeds, `signIn`
establishes a Supabase session (T031's fix works correctly), and the app navigates to
`/verify-phone`. The user receives the SMS code, types it in, and presses "Verify code."
`verifyPhoneCode(api, input)` fires `POST /identity/phone/verify` with no `X-User-Id` header
(because nothing ever called `setCurrentUserId`). The backend throws `Unauthenticated` (401).
`mapVerifyPhoneError` has no branch for `Unauthenticated`, so it falls back to "Something went
wrong. Please try again." The user is now permanently stuck on the verify-phone screen — there
is no way to proceed, regardless of how many times they re-enter the correct code, because the
request never authenticates. This breaks User Story 1 (P1, the MVP) Acceptance Scenario 2
outright, and transitively Acceptance Scenario 3 (profile submission) and every returning-user
`GET /identity/me/kyc-status` call FR-009/FR-010 depend on.

**Why this was not caught**: every automated test in this diff mocks either the `ApiClient`
(domain-layer tests) or the domain module itself (screen tests), so none of them make a real
HTTP call and none would ever observe a 401. The one verification step that would have caught
this — **T021's manual smoke check, run against the real local backend** — is explicitly
**unchecked (`[ ]`) in `tasks.md`**, and `progress/current.md`'s own log confirms only the
`/register` screen was exercised in-browser; it explicitly lists "screens past `/register`
... needs the backend running" as "**Not verifiable in this environment, still owed**." T027's
report repeats the same "no backend running in this environment" caveat for the business flow.
So the one check designed to catch exactly this class of bug was never run, and the gap was
never escalated to a dedicated fix task the way the equally-real T031 (Supabase session) gap
was — it was mentioned in nearly every run's report (Runs 6 through 13) but silently dropped
from Run 14's (T027–T030, the final gate) "Deviations / items for sign-off" section, where
T022/T023 *is* still listed as an open item but this is not.

**Why this is distinct from, and not fixed by, T031**: T031 fixed *"nothing ever establishes a
Supabase session, so the gate is stuck at `/register` forever."* That fix is real and verified
(see Finding 2 below). This is a *second*, independent gap: even with a valid Supabase session,
the backend's own dev-only identification mechanism (`X-User-Id`) is never populated, so every
authenticated backend call *past* registration still fails. Both gaps needed fixing for the
MVP to actually work end-to-end; only one was.

**What would fix it**: the natural, minimal fix (consistent with how T031 wired `signIn`) is for
`app/(auth)/register.tsx` to call `setCurrentUserId(user.id)` once, right after a successful
registration (and `retrySignIn`'s success path), since `currentUserId` is a module-level
variable that then stays valid for every subsequent call in that JS session
(`verify-phone.tsx`, `profile.tsx`, `useKycGate.ts`'s `fetchCurrentUser`). This is exactly the
"small, explicitly-scoped addition to `src/lib/api.ts`[-adjacent call site]" `tasks.md`'s own
Notes section anticipated might be needed — it just never got made. This is a **blocking**
finding: `task-implementer` must add this wiring (or an equivalent fix) and then actually run
T021's manual smoke check against a live local backend before this feature can be considered
functionally complete, per Constitution Principle VIII (Local-First Development) and
`docs/verification.md` Level 3.

## Finding 2 — T031's session establishment: real, correctly wired, well-tested

Scrutinized this hardest per instructions. Read `src/domain/registration.ts`,
`app/(auth)/register.tsx`, `src/lib/supabase-client.ts`, `src/domain/registration.test.ts`, and
`app/(auth)/register.test.tsx` line-by-line.

- **Both paths wired**: `register.tsx`'s `handleSubmit` selects `submitBusinessRegistration` or
  `submitPersonalRegistration` based on `accountType`, and **both** functions
  (`registration.ts:151-184`) call the injected `signIn(parsed.email, parsed.password)`
  immediately after the backend call succeeds — not just the personal path. Confirmed via
  `app/(auth)/register.test.tsx`'s two "calls submit*Registration with the signIn primitive"
  tests, one per account type.
- **Domain layer stays import-free**: `signIn` is injected as a `SignInWithPassword` parameter
  (mirroring the existing `ApiClient` DI pattern), not imported from `src/lib`. Confirmed no
  `src/lib`/`react-native`/`expo-*` import anywhere in `src/domain/registration.ts` — only
  `./api-client`, `./schemas`, `./types`. The real implementation
  (`src/lib/supabase-client.ts`'s `signInWithPassword`) is wired in only at the screen call site
  (`register.tsx`), exactly like `api` is for `ApiClient`.
- **Registration-succeeds-sign-in-fails cannot strand a user or duplicate-register**: a non-null
  `sessionError` is surfaced as an explicit "Your account was created, but..." screen
  (`register.tsx:113-139`) with a "Retry sign-in" action. `retrySignIn` calls only the injected
  `signIn` primitive again — it never re-calls `submitPersonalRegistration`/
  `submitBusinessRegistration`, so it cannot hit the backend's `EmailTaken`/`UsernameTaken` 409
  from a duplicate registration attempt. Verified both in the domain test
  (`registration.test.ts`: "returns the registered user with a sessionError, and does not
  throw...") and the screen test (`register.test.tsx`: "retries only the sign-in primitive on
  Retry... `expect(mockSubmitPersonalRegistration).toHaveBeenCalledTimes(1)`").
- **Would the tests actually catch a regression of the original bug?** Yes. Unlike the
  pre-T031 state (every test across the repo mocked a session into existence, so nothing
  observed whether a sign-in primitive was ever invoked), `registration.test.ts` has a test
  explicitly named for this — *"calls the injected signIn primitive with the just-registered
  email/password after a successful POST /identity/register"* — which captures
  `signInCalledWith` from the injected double and asserts it was actually called with the right
  credentials. If `submitPersonalRegistration` were changed to never call `signIn` at all (the
  original defect), this test would fail with `signInCalledWith` being `undefined`, not pass
  vacuously. Same for the business path and for `register.test.tsx`'s assertion that
  `submitPersonalRegistration` is invoked with `"SIGN_IN_WITH_PASSWORD_FN"` (the real function
  reference) as its second argument, not a null/undefined placeholder. This is a genuine
  regression test, not a tautology.

**Verdict on Finding 2**: real fix, correctly scoped, Constitution IV boundary intact, tests
would catch a regression. No issue found here.

## Finding 3 — `metro.config.js`'s `blockList` — verified NOT a bug

`config.resolver.blockList = exclusionList([/\.test\.[jt]sx?$/])` looks like it overwrites
rather than extends Expo's default `resolver.blockList`. I checked empirically rather than
assuming:

```
$ node -e "const {getDefaultConfig}=require('expo/metro-config'); console.log(getDefaultConfig(__dirname).resolver.blockList)"
/(\/__tests__\/.*)$/
```

Expo's own default `resolver.blockList` is itself produced by `metro-config`'s
`exclusionList()` helper (`node_modules/metro-config/src/defaults/exclusionList.js`), whose
implementation **always concatenates its own built-in `list` (`[/\/__tests__\/.*/]`)** onto
whatever additional patterns are passed in — it is not possible to call `exclusionList([...])`
and *not* get the `__tests__` exclusion:

```
$ node -e "console.log(require('metro-config/src/defaults/exclusionList')([/\.test\.[jt]sx?\$/]))"
/(\.test\.[jt]sx?$|\/__tests__\/.*)$/
```

So `metro.config.js`'s blockList is `/(\.test\.[jt]sx?$|\/__tests__\/.*)$/` — a strict superset
of Expo's default. Nothing is discarded. Not a defect.

## Finding 4 — the `X-User-Id` mechanism did not become more pervasive; not called speculatively

Confirmed `setCurrentUserId` is called nowhere (see Finding 1) — including not speculatively
before a confirmed session. The mechanism's actual defect is the opposite of what was flagged
as the risk to scrutinize (called too early/too broadly); instead it is never called at all,
which is Finding 1's blocking issue, not a scope-creep issue. The `getHeaders` callback itself
(`src/lib/api.ts:34`) is unchanged from the T001–T008 review and still only attaches the header
when `currentUserId` is truthy.

## Finding 5 — `ws` dependency and the placeholder Supabase URL — verified safe in practice

- **`ws` reaching the client bundle**: confirmed via a real `expo export --platform web` run
  (`./init.sh`'s build stage, and a manual re-run) that `ws` resolves to its `browser.js` stub
  (`module.exports = function () { throw new Error('ws does not work in the browser...') }`) in
  the web bundle — grepped the exported bundle
  (`dist/_expo/static/js/web/entry-*.js`) directly and found the literal string "ws does not
  work in the browser", confirming Metro picked the `"browser"` field, not the real Node `ws`
  implementation with its `net`/`tls`/`zlib` requires (none of those strings appear in the
  bundle). That stub is only ever *constructed* when `typeof window === "undefined"`
  (`supabase-client.ts:41`), which is never true in an actual browser (or in React Native, where
  `global.window` is set) — only true during Node-based static prerendering. So the throwing
  stub is dead code in every real runtime this app ships to; it only "helps" during `expo
  export`'s prerendering step, which is exactly what the file's own comment claims. Verified,
  not just trusted.
- **Placeholder URL fallback**: `supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://placeholder.supabase.co"` prevents `createClient()`'s synchronous throw from
  crashing the entire app (and the static-export build) when the env var is unset. A real
  misconfiguration (unset var in a deployed build) degrades to every Supabase Auth call failing
  with a network/DNS error at call time, not a silent false-success — consistent with the file's
  own claim. This is a reasonable, narrowly-scoped tradeoff for keeping the build/dev-shell
  working; not a masking-a-real-defect concern for this review's scope. Minor nit: there is no
  `console.warn` at startup calling out that the placeholder is in use, so a developer who
  forgot to set the env var only discovers it via failed network calls rather than an upfront
  signal — worth a follow-up, not blocking.

## Finding 6 — Constitution IV across every screen — clean, with one minor duplication nit

Grepped every screen/component under `app/` and `src/features/identity` for `fetch(`,
`JSON.parse`/`JSON.stringify`, `new ApiError`, and direct `supabase.*` calls. All request
construction, validation, and error-code interpretation is correctly confined to
`src/domain/registration.ts`/`profile.ts`/`schemas.ts` (`mapRegistrationError`,
`mapVerifyPhoneError`, `mapResendError`, `mapProfileError`, `isPhoneNotVerifiedError`) — every
screen only renders and calls into those. Spot-checked `RegistrationForm.tsx`, `ProfileForm.tsx`,
`VerifyPhoneScreen.tsx`, `KycStatusScreen.tsx`, `register.tsx`, `verify-phone.tsx`,
`profile.tsx` in full.

**Nit**: `app/(onboarding)/tutorial.tsx:33` calls `supabase.auth.getSession()` directly inside
the screen component to obtain the Supabase user id for the local tutorial-storage key, rather
than reusing/extracting the same read `src/features/identity/useKycGate.ts` already performs.
This isn't validation/request-construction logic (Constitution III explicitly sanctions direct
auth-SDK calls), so it's not a Constitution IV violation, but it is a small duplication of the
"read the Supabase session" pattern that could drift from `useKycGate.ts`'s version over time.
Non-blocking.

## Finding 7 — Test quality

Test files reviewed in full: `registration.test.ts`, `register.test.tsx`, `useKycGate.test.ts`,
plus spot checks of `profile.test.ts`, `ProfileForm.test.tsx`, `RegistrationForm.test.tsx`,
`KycStatusScreen.tsx`'s test, `VerifyPhoneScreen.tsx`'s behavior against its test file. All
assert real rendered output/request shapes/state transitions (hand-rolled `ApiClient`/`signIn`
doubles capturing what was actually sent/called, `getByRole`/`findByText` against rendered
copy, `aria-checked`/`accessibilityState` assertions with a documented before/after regression
proof for the T028 fix) — none found that only check "didn't throw" or that mock the exact
behavior they claim to verify. The `useKycGate.test.ts` suite in particular mocks only at the
true I/O boundary (`supabase.auth.*`, `fetchCurrentUser`, `getHasCompletedTutorial`) and lets
the real `resolveKycRoute()` and React Query wiring run, so it would catch a real wiring
regression, not just echo a stub.

## Finding 8 — `tasks.md` honesty

- Every `[X]` task I spot-checked (T009–T020, T024–T032) corresponds to real, working,
  `tsc`-clean, tested code that matches its own literal scope — I did not find a task marked
  done that isn't done *for what that task's own text asked for*.
  **T021 is correctly left `[ ]`** — and, per Finding 1, it must stay open (or be explicitly
  re-run and fail) until the `setCurrentUserId` gap is fixed, because running it for real
  against a live backend today would immediately surface Finding 1.
- The FR traceability table is not dishonest — it lists which tasks *built* the FR-002/FR-004/
  FR-009 logic and UI, and does not itself claim "verified end-to-end against a live backend"
  (that claim is scoped separately to T021, which is honestly left unchecked). But the practical
  effect is that FR-002's and FR-004's acceptance scenarios (a real phone-verify/profile-submit
  round trip completing) are not achievable against the real backend today, which is a
  correctness issue this review treats as blocking regardless of how the checklist itself is
  worded.
- `progress/current.md` remains stale (still flagged in the T001–T008 review) — its header still
  reads "State: spec_ready → awaiting human approval gate" and its "Next step" section describes
  US2/Polish as not yet started, even though T024–T032 are now `[X]`. Same non-blocking
  documentation-hygiene nit as before, now more out of date.

## `tasks.md` checklist status (T009–T032, this review's scope)

- [x] T009 — route-group scaffolding, no logic.
- [x] T010 — `useKycGate` hook; correctly delegates routing to `resolveKycRoute`; real,
      non-tautological tests.
- [x] T011 — `RegistrationForm`, inline validation, accessible.
- [x] T012 — `register.tsx`, thin glue, correct wiring.
- [x] T013 — `CodeInput`, platform-neutral, tested.
- [x] T014 — `CodeInput.ios.tsx`/`.android.tsx`; SMS autofill markup present; simulator smoke
      check honestly deferred/not claimed.
- [x] T015 — `VerifyPhoneScreen` + `verify-phone.tsx`; resend cooldown honestly documented as
      client-only.
- [x] T016 — `ProfileForm`, personal fields, inline validation.
- [x] T017 — `profile.tsx`, `PhoneNotVerified` redirect handled correctly.
- [x] T018 — `KycStatusScreen`, rejected/error only, placeholder CTA honestly non-navigating.
- [x] T019 — `TutorialScreen` + `tutorial.tsx`, local persistence correctly keyed by Supabase
      auth user id, with the minor Finding 6 duplication nit.
- [x] T020 — wiring check; correctly found and escalated the T031 gap; **did not find/escalate
      the Finding 1 gap** (out of this task's own stated scope, which was the gate's routing
      logic, not the X-User-Id mechanism) — the gap that made it through undetected.
- [ ] T021 — **correctly left unchecked**; per Finding 1, running it today would fail past
      `/register`. Must be re-attempted after Finding 1 is fixed.
- [ ] T022, T023 — deliberately deferred to backend `003-session-authentication` (human
      decision) — not faulted.
- [x] T024, T025, T026 — business account-type toggle, endpoint branching, conditional business
      fields at the profile step — all correctly scoped to the re-scope's "business fields at
      profile step, not registration" decision.
- [x] T027 — honestly scoped (no live backend available; client-side gate verified via existing
      Level 2 tests, live `BusinessProfile` creation explicitly not claimed).
- [x] T028 — real accessibility defect found and fixed (`aria-checked` on react-native-web),
      with a proven-to-fail-before/pass-after regression test.
- [x] T029 — honestly scoped as a structural/code-review claim, not a rendered-pixel claim (no
      browser-automation tooling available in this environment either, confirmed).
- [x] T030 — `./init.sh` green, re-verified independently.
- [x] T031 — see Finding 2. Real, correctly wired, well-tested.
- [x] T032 — raw-Zod-default-message and `apellidoMaterno`-optional-field-empty-string defects;
      both real, both fixed with a genuine `optionalNonEmptyString()` helper and regression
      tests; verified by reading `schemas.ts`/`ProfileForm.tsx` directly.

## CHECKPOINTS.md walkthrough (this review's scope)

### C1 — The harness is complete
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`/`docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 (re-ran independently — SUCCESS 7/7).

### C2 — State is coherent
- [x] At most one feature `in_progress` (`001-registration-kyc`; `002` is `pending`).
- [ ] N/A — no `done` feature yet to check for passing tests.
- [ ] `progress/current.md` describes only the active session — **still stale** (Finding 8);
      documentation-hygiene issue, not a code defect, but now more out of date than at the last
      review.

### C3 — Code respects the architecture
- [x] `src/domain` has zero React Native/Expo imports — reconfirmed for
      `registration.ts`/`profile.ts`/`schemas.ts`/`kyc-gate.ts`/`tutorial.ts`.
- [x] UI components call into `src/domain`/`src/lib` rather than embedding fetch/validation/
      business rules — confirmed (Finding 6), one minor duplication nit only.
- [x] Platform-specific code uses `.ios.tsx`/`.android.tsx` (`CodeInput`) — no scattered inline
      `Platform.OS` conditionals found anywhere in this feature's screens.
- [x] No direct Postgres/Redis/S3/Supabase-table access — all data through the backend API or
      `supabase.auth.*` (the sanctioned exception).
- [x] No new global state library added.
- [x] No stray `console.log`/context-free `TODO`s (grepped, none found).

### C4 — Verification is real
- [x] Every exported `src/domain` function with logic has a covering unit test.
- [x] New/changed screens have RNTL component tests asserting rendered output.
- [x] `./init.sh`'s build check passes (re-ran independently, and additionally inspected the
      exported web bundle directly for Finding 5).

### C5 — The session closed well
- [x] No suspicious untracked files beyond the expected new feature files (one pre-existing,
      unrelated `.claude/launch.json` noted by the implementer, not touched — fine).
- [ ] N/A — feature not `done` yet, no `progress/history.md` entry expected.
- [x] `feature_list.json` still accurately shows `001-registration-kyc` as `in_progress`.

### C6 — Spec Driven Development
- [x] `spec.md` + `plan.md` + `tasks.md` all exist.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers.
- [ ] N/A — feature not `done`, so "all `tasks.md` items `[X]`" doesn't apply (T021/T022/T023
      correctly still open).
- [x] Every `FR-00x` touched by this scope is referenced by at least one test by comment —
      confirmed (FR-002, FR-004, FR-007, FR-009, FR-010 all have tagged tests in
      `kyc-gate.test.ts`/`useKycGate.test.ts`/`registration.test.ts`/`profile.test.ts`/screen
      tests). This does not change the fact that the underlying real-backend behavior those
      tests describe is currently broken (Finding 1) — the tests correctly describe the
      *intended* behavior of code that is unit-testable in isolation; the gap is an integration
      gap no unit/component test in this repo's current tooling would surface.

No C1–C6 box is empty in a way not already accounted for above; the stale `progress/current.md`
(C2) is a hygiene nit, not a blocker on its own, but Finding 1 is.

## Verdict

**REQUEST CHANGES.**

Finding 1 is a blocking, correctness-vs-spec defect: the app cannot complete User Story 1's
(P1, MVP) Acceptance Scenarios 2 and 3 against the real local backend, because
`setCurrentUserId()` — the mechanism every authenticated call past registration depends on — is
never invoked anywhere in the codebase. This is not a documented, signed-off deferral like the
KYC-document-upload scope move to feature 002; it was repeatedly flagged in implementation
report prose across multiple runs but never closed by a dedicated task (unlike the structurally
identical T031 session-establishment gap, which *was* escalated and fixed), and it silently
dropped out of the final run's own "items for sign-off" list. T021, the manual smoke check that
would have caught this by simply trying to verify a phone number against the real backend,
remains unchecked — correctly so, since running it today would fail immediately after
`/register`.

**Required before re-review**:
1. Wire `setCurrentUserId(user.id)` (or an equivalent fix) so `verifyPhoneCode`,
   `resendVerificationCode`, `submitProfile`, and `fetchCurrentUser` can actually authenticate
   against the real backend within a registration session — the natural place is
   `app/(auth)/register.tsx`, right after a successful registration/sign-in (and on
   `retrySignIn`'s success path), mirroring how T031 wired `signIn`.
2. Actually run T021's manual smoke check against a live local backend (`docker compose up` in
   the `Draw-a-card` backend repo) and record the result, per `docs/verification.md` Level 3 —
   this is the check that would have caught Finding 1 and must now confirm the fix.
3. Add a regression test at the domain layer (mirroring T031's own regression-test pattern) that
   would fail if a future change stops sending `X-User-Id`, so this class of gap can't silently
   regress again once fixed.

Everything else reviewed in this pass — T031's session establishment, the `metro.config.js`
blockList, the `ws`/placeholder-URL handling, Constitution IV boundaries, and test quality — is
sound and independently verified, not just trusted from the implementation report.
