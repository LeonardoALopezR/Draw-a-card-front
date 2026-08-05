# Session history

Append-only log. Each entry is the rolled-over content of `progress/current.md` at the point a
feature reached `done` (or a session ended with meaningful progress worth keeping), most recent
entry last. Owned by `sdd-orchestrator` — see `AGENTS.md` §5.

---


---

# Session 2026-08-04 — 001-registration-kyc (closed)

**Started**: 2026-08-04
**Feature**: 001-registration-kyc
**State**: spec_ready → awaiting human approval gate

## What happened this session

- Ran `./init.sh` → `RESULT: SUCCESS (7/7)`. Expected warnings only: expo-doctor outdated
  deps (non-blocking) and no `test` script yet.
- Read `feature_list.json` / `specs/001-registration-kyc/spec.md`: feature was `pending`,
  spec.md had 1 open `[NEEDS CLARIFICATION]`, no `plan.md` / `tasks.md`.
- Resolved the open clarification with the human (see below) so `spec-writer` wasn't blocked
  on it.
- Delegated clarify → plan → tasks to `spec-writer`, which:
  - Applied the clarification to `spec.md` (`## Clarifications` section, Edge Cases, new
    FR-009/FR-010, an SC, and Assumptions) — zero open `[NEEDS CLARIFICATION]` markers remain.
  - Wrote `specs/001-registration-kyc/plan.md`: resolves FR-004's presigned-URL mechanism
    (presign → PUT → confirm), designates this feature as the one that installs
    jest + jest-expo + @testing-library/react-native, and passes the Constitution Check gate.
  - Wrote `specs/001-registration-kyc/tasks.md`: 30 tasks, Setup → Foundational → US1 (P1,
    MVP) → US3 (P1) → US2 (P2) → Polish, with FR→task traceability.
  - Flipped `feature_list.json`'s status to `spec_ready`.

## Resolved clarifications

- **kycStatus `pending` vs `rejected` UI** (spec.md Edge Cases): **blocking status screen**
  for both. On reopen, `pending` → a "verificación en revisión" screen with no access to the
  main app; `rejected` → screen showing the **backend-provided rejection reason** (generic
  fallback if the backend returns none) plus a resubmit CTA that returns the user to the KYC
  upload step.

## Implementation log

- **2026-08-04 — human APPROVED at the `spec_ready` gate.** `feature_list.json` → `in_progress`.
- Confirmed the backend repo is present at `../Draw-a-card` with its
  `specs/001-user-registration-kyc/` — so T005 verifies the presign/confirm endpoint shape
  against it rather than relying on plan.md's placeholder.
- **T001 [X]** (test tooling) — jest 29.7 + jest-expo 51.0.4 + @testing-library/react-native
  13.3.3 + react-test-renderer 18.2 + @types/jest. `npm test` passes; `init.sh` Tests stage
  flipped WARN → OK; `RESULT: SUCCESS`. Independently re-verified by the orchestrator.
  Deviations (both accepted): skipped the deprecated `@testing-library/jest-native` (matchers
  ship in RNTL ≥12.4), added `@types/jest` so `tsc` accepts Jest globals in `.test.ts`.
  Report: `progress/impl_001-registration-kyc.md`.
- **Phase 2 (Foundational)** in progress, split into two reviewable batches:
  batch A = T002 + T003 (types + pure `kyc-gate`), batch B = T004 + T005 + T006 (API wrappers
  + upload adapter), then T007 + T008.

- **T002 + T003 [X]** — `User.kycRejectionReason` / `hasCompletedTutorial`, `IdentityDocument`,
  and the pure `resolveKycRoute()` gate + 7 branch tests. `npm test` green, `tsc` clean,
  `init.sh` SUCCESS. The implementer's mandated backend cross-check surfaced the blocker below.

## BLOCKER FOUND AND RESOLVED — backend scope mismatch (2026-08-04)

`task-implementer`'s cross-check against `../Draw-a-card` found that this feature's approved
spec targets a backend scope that no longer exists. **Orchestrator independently verified all
of it** against the backend's `spec.md`, `prisma/schema.prisma`, and `feature_list.json`:

1. Backend descoped **all KYC document handling** out of `001` on 2026-08-03 into
   `002-kyc-document-verification`, which is still `pending` and unspec'd. No presign
   endpoint, no object storage, no KYC provider exists. `IdentityDocument` is in the schema
   but "untouched and unused". → our FR-004 / T005, T006, T015, T016, T017 had no backend.
2. Backend has **no code path leaving `kycStatus: pending`** ("the correct, intentional
   terminal state for this iteration"). Combined with FR-009's blocking screen, **every user
   would have been permanently locked out of the app.** Backend's settled decision (its
   FR-006) is that KYC gates *money paths only* — sale/withdrawal, not card-for-card trades.
3. Our flow was **missing a whole step**: backend is `POST /identity/register` (email,
   password, phone, username only) → `POST /identity/phone/verify` → `POST /identity/me/profile`
   (nombre, apellidoPaterno, apellidoMaterno?, birth date, nationality, CURP, RFC + ToS/privacy).
   CURP/RFC are **typed fields**, not documents.
4. Business fields (commercialName/RFC/fiscalAddress) belong at that **profile step**, not on
   the register screen.
5. Context: backend `/identity/me/*` + `/identity/phone/*` identify the caller from an
   `X-User-Id` header, fail-closed outside dev/test. Real auth is backend
   `003-session-authentication` (`pending`), so US3 has no token-based auth to persist yet.

**Human decisions (2026-08-04, second gate):**
- **Re-scope 001 to match the backend that exists today** — move document upload out to a new
  frontend feature `002`, add the missing profile step, move business fields onto it.
- **`pending` passes through to the main app.** `resolveKycRoute`/`KycStatusScreen` stay built
  but only route on `rejected`, once backend 002 can actually produce it.

## Post-re-scope progress

- `spec-writer` amended `spec.md`/`plan.md`/`tasks.md` and registered frontend feature
  `002-kyc-document-verification` (`pending`). T001–T003 kept `[X]` with numbering intact;
  document-upload tasks preserved verbatim under "Deferred to feature 002".
- **T004 + T005 [X]** — removed `IdentityDocument` (moved to 002), added the backend-mirroring
  `User` fields, widened `resolveKycRoute` to
  `unauthenticated | verify-phone | profile | kyc-status | tutorial | main`. `pending` now
  passes through; only `rejected` (and fetch-failure) blocks. Fail-safe precedence preserved.
- **T006 + T007 + T008 [X]** — `src/domain/registration.ts`, `schemas.ts` (rewritten),
  `profile.ts`, plus `ApiError`/`ApiClient` in `api-client.ts` and the temporary `X-User-Id`
  boundary in `src/lib/api.ts`. Contract verified against the backend's actual source
  (`src/modules/identity/{routes,service,validation,errors,username}.ts`), not just its spec.
- **`code-reviewer`: APPROVED** over T001–T008 → `progress/review_001-registration-kyc.md`.
  No blocking findings. 63 tests passing, `tsc` clean, `init.sh` SUCCESS.

## Backend contract deviations found (all reconciled in code)

- No separate `businessRfc` field; `tosAccepted`/`privacyAccepted`, not
  `acceptedTerms`/`acceptedPrivacyPolicy`.
- No `sendVerificationCode` or `accountType` concept backend-side; no `retryAfterSeconds` in
  the resend response.
- **No backend endpoint for tutorial completion at all** → `hasCompletedTutorial` is hardcoded
  `false` in `toDomainUser()` for now. **T019 must decide** local storage vs. a backend field.

## Open questions / blockers

- None blocking. One carried-forward decision: T019's tutorial-completion data source.

## T009 + T010 [X] — and a second backend gap

- `app/(auth)/_layout.tsx`, `app/(onboarding)/_layout.tsx`, `src/features/identity/useKycGate.ts`
  (+ tests), wired into `app/_layout.tsx` with the loading gate built now (not deferred to T022).
  73 tests passing, `tsc` clean, `init.sh` SUCCESS. Reviewer's `setCurrentUserId` constraint honored.
- **Correctness bug found and fixed en route**: a user with a live session whose status fetch
  failed resolved to `"unauthenticated"` (→ registration screen) instead of `"kyc-status"`
  (→ retry screen), because `resolveKycRoute` checks `!user` before `statusFetchFailed`. Fixed
  with an `UNKNOWN_GATE_USER` placeholder at the hook boundary — zero changes to the pure
  `resolveKycRoute`, so Constitution IV holds.
- **Scope creep, justified, each verified by reproducing the failure first**: `@opentelemetry/api`
  (Metro can't resolve Supabase's optional dynamic import without it) and `ws` + a placeholder
  Supabase URL (`expo export` static-prerenders in Node 20, which has no global WebSocket, and
  `createClient("")` throws synchronously). **Tidy-up owed**: `ws` landed in `dependencies`, not
  `devDependencies` — a Node-only lib now in the client bundle. Works, but should move.

### BACKEND GAP 2 — US3 cannot be delivered (orchestrator-verified)

The backend's only GET is `/me/kyc-status`, returning `{ kycStatus }` alone. Verified directly
against `../Draw-a-card/src/modules/identity/routes.ts` — the full route set is `/ping`,
`/register`, `/register/business`, `/phone/verify`, `/phone/resend`, `/password-reset`,
`/me/profile` (POST), `/me/kyc-status` (GET).

There is **no endpoint returning `phoneVerifiedAt` / `nombre` / `apellidoPaterno`**, which
`resolveKycRoute` needs to route a returning user. With `X-User-Id` in-memory only, every cold
boot fails the fetch and lands on FR-010's retry screen. Root cause: backend
`003-session-authentication` is still `pending`.

**Human decision (2026-08-04, third gate): build US1 screens, defer US3.** T022/T023 are
blocked on backend 003 and are OUT of this feature's closing criteria — 001 does not wait on them.

## Phase 3 / US1 — T011–T020 all [X]

- **T011+T012** — `RegistrationForm.tsx`, `FormField.tsx`, `app/(auth)/register.tsx`. First UI
  in the repo; set the conventions the rest follow. Added `metro.config.js` (justified
  deviation): expo-router turns every `.tsx` under `app/` into a route, so a colocated
  `register.test.tsx` shipped as route `/register.test` and pulled a devDependency into the
  production bundle. Block-listing test files from Metro preserves the colocation convention.
- **T013+T014+T015** — `CodeInput.tsx` + `.ios`/`.android` SMS-autofill variants sharing one
  explicit interface (`CodeInput.types.ts`), `VerifyPhoneScreen.tsx`, `app/(auth)/verify-phone.tsx`.
  Countdown driven by a client-side constant (backend returns no `retryAfterSeconds`).
  Orchestrator **reverted** the run's `tsconfig.json` `allowImportingTsExtensions` addition —
  verified unnecessary (nothing imports with a `.tsx` extension; `jest.config.js`'s
  `haste.defaultPlatform` override is the actual fix). All tests still pass without it.
- **T016+T017** — `ProfileForm.tsx`, `app/(auth)/profile.tsx`. Correct backend field names
  (`tosAccepted`/`privacyAccepted`), `apellidoMaterno` genuinely optional. CURP/RFC confirmed
  not logged, not in URLs, not persisted beyond form state (Constitution III).
- **T018+T019** — `KycStatusScreen.tsx` (rejected + error variants; the `pending` branch was
  **dropped as unreachable** rather than tested as fiction, since `resolveKycRoute` never routes
  a fetched `pending` here), `app/(auth)/kyc-status.tsx`, `TutorialScreen.tsx`,
  `app/(onboarding)/tutorial.tsx`. Resubmit CTA is a visibly **disabled placeholder** — feature
  002 doesn't exist, and routing to a nonexistent path would hit expo-router's "Unmatched Route"
  screen and read as a bug. `hasCompletedTutorial` persisted **locally** (no backend endpoint).
- **T020** — wiring verified across the full transition matrix; no loop, no dangling route, local
  tutorial flag genuinely on the gate's path. 138 tests. It also found BACKEND GAP 3 below.

### BACKEND GAP 3 — no session was ever established (orchestrator-verified, RESOLVED by decision)

`useKycGate` keys the entire gate on `supabase.auth.getSession()`, but **nothing in the repo ever
creates a session**: no `signInWithPassword`, no `signUp`, no `setSession` (grep-verified — the
only session references are reads). The backend's `POST /identity/register` returns
`res.status(201).json({ user })` — no token. So every user resolved `"unauthenticated"` → `/register`
forever, regardless of real backend progress. Every existing test missed it because they all mock
the session.

Verified the fix is available client-side: the backend calls
`getAuthProvider().signUpWithPassword(email, password)` (`service.ts:143`), so the Supabase auth
account already exists with the user's own credentials.

**Human decision (2026-08-04, fourth gate): the client calls
`supabase.auth.signInWithPassword({ email, password })` after a successful registration.** No
backend change; satisfies Constitution III (auth through the provider SDK); `persistSession: true`
is already configured. Caveat to watch: a Supabase project requiring email confirmation before
sign-in would block this.

## T031 [X] — session establishment (BACKEND GAP 3 fix)

`src/lib/supabase-client.ts` now exports `signInWithPassword`, **dependency-injected** into
`submitPersonalRegistration` at the screen call site so `src/domain` still imports nothing from
`src/lib` (Constitution IV holds). Registration → sign-in → live session → gate routes onward.

Failure UX (registration succeeds, sign-in fails — e.g. Supabase requires email confirmation):
a dedicated "Your account was created" screen explaining the cause, with a **Retry** that retries
only the sign-in — never re-posts registration, which would hit `409 EmailTaken`. Credentials are
held in component state in that branch only, same lifetime as the form state; not persisted.

## T021 [X] — manual smoke check, run by the orchestrator in a real browser

`expo start --web` + browser, at a 375px viewport. **Verified working**: app boots; gate redirects
to `/register`; form renders exactly the four backend-contract fields (no business fields —
re-scope confirmed live); inline validation fires (SC-002); layout clean at 375px with no
horizontal scroll (SC-003).

**Found two defects the 145 passing tests did not catch** — fixed as T032:
1. Raw Zod defaults leaking as user copy: Username showed
   `String must contain at least 1 character(s)`. Audited all of `schemas.ts`; every
   user-reachable validator now has real copy. Re-verified live: "Username is required",
   "Enter a valid email address", and an actionable regex message naming the allowed characters.
2. **`apellidoMaterno` was not genuinely optional.** `z.string().min(1).optional()` accepts
   `undefined` but rejects `""`. `ProfileForm` defaulted it to `undefined` to dodge this, and the
   test only covered the never-touched case — so **type-a-value-then-clear-it** set `""` and
   blocked submission with the raw message from defect 1. Schema fixed to accept and normalize
   empty, regression test added for the type-then-clear path, same latent bug fixed in
   `commercialName`/`fiscalAddress`.

**Not verifiable in this environment, still owed**: screens past `/register` (needs the backend
running), and SMS autofill on iOS/Android (needs simulators). Recorded, not silently skipped.

## State at pause

- **T001–T021, T031, T032 all `[X]`.** 155 tests, `tsc` clean, `init.sh` `RESULT: SUCCESS`.
- US1 (the P1 MVP) is functionally complete and browser-verified at the register screen.
- Nothing committed — working tree uncommitted, matching how the backend repo was left.

## US2 + Polish [X] — T024–T030

- **T024–T026** — account-type toggle (`radiogroup`/`radio`, browser-verified), `register.tsx`
  branches to `submitBusinessRegistration` (which goes through the **same T031 sign-in path**, so
  business users don't hit the dead end), business fields conditionally rendered on `ProfileForm`
  per the re-scope. Browser-verified live: selecting "Tienda" correctly does NOT reveal business
  fields on the register screen.
- **T027–T030** — accessibility, responsive, and final-gate pass.
  - Orchestrator measured the register screen in-browser: **all tap targets exactly 44px**
    (compliant), 375px layout clean, no horizontal scroll.
  - **Accessibility defect found by the orchestrator, fixed**: the account-type radios emitted
    **no `aria-checked` at all** — selection was conveyed only by a background-color class, so a
    screen-reader user could not tell which type was selected. Re-verified live after the fix:
    `Personal=false, Tienda=true` on selecting Tienda. Regression test added.

## code-reviewer, second pass (T009–T032): CHANGES_REQUESTED → fixed as T033

**BLOCKING finding, orchestrator-verified**: `setCurrentUserId()` was **never called anywhere**.
Only its definition (`src/lib/api.ts:24`) and comments existed — every screen carried a comment
saying the wiring was "intentionally left for a later task," and no later task ever added it.

The backend's `requireUserId()` has **no bearer-token fallback**, so `POST /identity/phone/verify`,
`/phone/resend`, `/me/profile`, and `GET /me/kyc-status` **all 401, always**. A user would type the
correct SMS code and be permanently stuck on verify-phone with "Something went wrong."

Cause is partly an orchestrator instruction: repeated guidance not to make `X-User-Id` "more
pervasive" was read as "never call it." The correct reading was: call it exactly once, where a
real user id is confirmed.

**T033 [X]** — `setCurrentUserId(user.id)` after successful registration (incl. the `retrySignIn`
recovery path), cleared on session loss via `useKycGate`'s `onAuthStateChange`, `Unauthenticated`
branches added to all three error mappers, stale comments corrected. Verified against the **live
local backend with curl** (401 without the header, authenticated with it) **and by reverting each
fix to prove the new tests actually fail**. 174 tests, `tsc` clean, `init.sh` SUCCESS.

## BACKEND GAP 4 — no CORS: the web target cannot reach the local backend (UNRESOLVED)

Brought up the real backend (docker compose: postgres/redis/minio; API on :3000, `/identity/ping`
→ 200) and drove a real registration from the browser. Result:

```
Access to fetch at 'http://localhost:3000/identity/register' from origin
'http://localhost:8081' has been blocked by CORS policy: No 'Access-Control-Allow-Origin'
header is present on the requested resource.
```

Preflight `OPTIONS` returns 200 but carries no CORS headers. Confirmed the backend has **zero CORS
handling** — no `cors` dependency, no `Access-Control` header anywhere in its `src/`.

This breaks Constitution I (web is a first-class target) and VIII (local-first development). **The
fix belongs in the backend repo**, which has its own SDD process and its `001` marked `done` — not
changed unilaterally from here. **Escalated to the human; not fixed.**

Also blocking a genuine end-to-end run: `.env` has `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY` **empty**, so the placeholder fallback applies and
`signInWithPassword` cannot reach a real project. The backend can run fully mocked
(`AUTH_PROVIDER_MODE=mock`), but the frontend gate needs a real Supabase session — worth noting as
local-first friction: the frontend cannot be exercised locally without cloud credentials.

## State at pause

- **T001–T021, T024–T033 all `[X]`.** 174 tests, `tsc` clean, `init.sh` `RESULT: SUCCESS`.
- T022/T023 (US3) deferred to backend `003` by the 2026-08-04 decision.
- Nothing committed; working tree uncommitted.

## Manual iOS testing (by the human) — two more real bugs, neither catchable by tests

1. **`Cannot find native module 'ExpoLinking'`** — app crashed on launch on iOS.
   Root cause: `expo-router@3.5.24` declares `expo-linking`/`expo-constants` as
   **peerDependencies with a wildcard `"*"` range**. Neither was declared in `package.json`, so
   npm auto-installed them at the newest major — **57.x, built for SDK 54+** — against this
   project's **SDK 51** runtime. JS resolved; the native module didn't exist. Fixed with
   `npx expo install expo-linking expo-constants` → `~6.3.1` / `~16.0.2`, now explicitly declared.
   Left `typescript`/`@types/react` alone: SDK 51 wants *downgrades* (5.9.3 → ~5.3.3) that would
   likely break the type-check and 174 tests for no native-runtime benefit.
2. **T034 — unhandled rejection in `signInWithPassword`.** The wrapper assumed supabase-js always
   resolves to `{ error }`. On a *network-level* failure (unreachable host, DNS, offline,
   timeout) it **rejects**. That throw escaped into `register.tsx`'s registration `catch`, so a
   user whose account **was** created (backend returned 201) saw a generic registration error,
   retried, and hit `409 EmailTaken` — permanently locked out. Exactly the trap T031's failure
   screen exists to prevent. Fixed; the audit found the same class in `useKycGate`'s
   `getSession()` (would have wedged the loading state on cold boot) and `tutorial.tsx`.
   `src/lib/api.ts` audited and already safe. **181 tests.**

Diagnosis was done against the live backend: `POST /identity/register` → `HTTP 201` with a real
user; `placeholder.supabase.co` → `000` (unreachable, because both Supabase env vars are empty).

## init.sh — now verifies all three targets (human-requested)

Stages went 6 → 8. Verified both paths: full run `RESULT: SUCCESS (10/10)`, and the `Stop` hook's
`--skip-build` fast path `SUCCESS (8/8)` (unchanged in speed — it already skipped exports).

- **New stage 6, "Native dependency alignment"** — the one that actually guards the ExpoLinking
  bug class. **FAILs** when an `expo-router` peer is installed but undeclared in `package.json`;
  WARNs when installed versions drift from the SDK. **Proven non-vacuous**: temporarily
  undeclaring `expo-linking` made it report `DETECTED: [expo-linking]`; clean when restored.
- **Stage 8 now exports web + iOS + Android**, each its own stage so the summary names the
  failing platform. Previously web-only — which is precisely how a completely broken native app
  passed every gate for an entire feature.
- New `--skip-native` flag for a fast inner loop.
- **Honest limitation, documented in the script and `docs/verification.md`**: these exports
  bundle JS, they do not compile a native binary, so they could NOT have caught the ExpoLinking
  runtime mismatch on their own — stage 6 is what covers that. A real native compile needs
  `expo prebuild`, which writes `ios/`/`android/` into this managed-workflow repo; deliberately
  not added.
- Docs updated to match: `AGENTS.md`, `README.md`, `docs/verification.md` (Level 4 rewritten),
  `CHECKPOINTS.md`.

## Backend coordination (2026-08-04, end of session)

**CORS registered as backend feature `006-web-cors`** (`pending`) in `../Draw-a-card/feature_list.json`,
per human instruction to register rather than implement. Entry records the full evidence (no `cors`
dep, zero `Access-Control` matches in `src/`, `index.ts` registers only `express.json()`; live repro
of the blocked preflight), that impact is **browser-only** (native confirmed working, HTTP 201), and
that the fix must be an **origin allowlist, never `*`** — `/identity/me/*` carries curp/rfc under
their Principle III. Queued behind their `005-card-catalog`, which is `in_progress`. JSON validated;
`one_feature_at_a_time` still holds (1 in_progress).

### Two discoveries while reading their feature_list — both affect us

1. **Their `002-onboarding-tutorial-state` shipped TODAY and is `done`.** It adds
   `GET /identity/me/tutorials` and `POST /identity/me/tutorials/complete` — verified present in
   `src/modules/identity/routes.ts`. **This supersedes our T019 decision.** We persisted
   `hasCompletedTutorial` locally in secure-store *specifically because* no backend endpoint
   existed; that premise is now false. `toDomainUser()` still hardcodes `hasCompletedTutorial:
   false`. Worth a follow-up task to move to the real endpoint — local state won't survive a
   reinstall or follow the user across devices. **Not actioned**, flagged.
2. **Their feature numbering shifted.** The KYC-document feature is now their `003`, not `002`
   (tutorial-state was inserted ahead of it), and session-auth is their `004`, not `003`. Every
   "backend 002/003" reference written earlier in this repo is off by one. Corrected the
   `002-kyc-document-verification` note in our `feature_list.json`; **older references inside
   `specs/001-registration-kyc/` and earlier entries in this file are still stale** and should be
   read with this in mind.

**T035 added (open, not implemented)** — moves tutorial completion off local-only storage onto the
now-existing `GET /identity/me/tutorials` + `POST /identity/me/tutorials/complete`. Records why it
matters (local-only means the tutorial replays after a reinstall or on a second device, so FR-007's
"once per *user*" is not actually met — only "once per install"), the exact scope, the backend's
response contract, the open decision on whether `src/lib/tutorial-storage.ts` is deleted or kept as
an offline cache, and that T033's `setCurrentUserId` wiring is a prerequisite. FR-007 traceability
row updated to distinguish what T019 vs T035 each satisfy.

## Open tasks in 001 (4 of 35)

- **T021** — manual smoke, web portion blocked on backend `006-web-cors`; iOS partially done
  (register verified; the rest needs Supabase credentials).
- **T035** — real tutorial endpoints (just added, above).
- **T022 / T023** — US3 session persistence, deferred by decision to backend `004-session-authentication`.

## Next step

1. **Backend CORS** is now tracked as their `006-web-cors` — web end-to-end stays blocked until it
   ships.
2. Real Supabase credentials in `.env` for a true happy-path walkthrough.
3. Then re-run T021/T027 manual smoke properly, re-review, and `feature_list.json` → `done`.
   **001 should NOT be marked `done` until the flow is verified against the real backend** — three
   separate "green tests, broken app" bugs (T031, T033, CORS) were found precisely where mocks
   stopped and reality began.
