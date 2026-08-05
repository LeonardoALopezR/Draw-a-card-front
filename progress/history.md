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

---

# Session 2026-08-05 — 004-home-scan-shell (closed, done)


**Started**: 2026-08-04
**Feature**: 004-home-scan-shell
**State**: implementation (spec approved by the human 2026-08-04)

## What happened this session

- Human requested a new feature from a hand-drawn wireframe of the authenticated
  home/scan screen: nav shell (Amigos / centre Scan / Social), a card-shaped `+`
  affordance that routes to the scanner, and four top-right placeholder controls
  (ENG/ESP, USD/MXN, Notifications, Messages).
- Registered `004-home-scan-shell` in `feature_list.json` as `pending` with the full
  wireframe description and scope boundaries in its `notes` (subagents can't see the
  image — the notes are the source of truth for what was drawn).
- Scope stated by the human up front: Amigos and Social get the *tabs* but no screen
  content; the scanner itself is a separate feature, this one only wires the route
  boundary; the four top-right controls are placeholders.
- Delegated to `spec-writer` to produce `specs/004-home-scan-shell/{spec,plan,tasks}.md`.

- `spec-writer` delivered spec.md / plan.md / tasks.md (22 tasks, 10 FRs, 4 user
  stories) + checklists/requirements.md, and flipped 004 to `spec_ready`.
- **Human approved at the `spec_ready` gate 2026-08-04**, confirming both recorded
  defaults: web nav = Option C (responsive sidebar ≥768px / bottom bar <768px), and the
  top-left Amigos pill = a shortcut to the same Amigos destination (FR-008 as written).
  Recorded at the top of spec.md's Clarifications section.
- Handed to `sdd-orchestrator` to cut the branch and drive the
  `task-implementer` → `code-reviewer` loop.
- `sdd-orchestrator` flipped status to `in_progress`, ran `feature-branch` skill: synced
  `main` (fast-forwarded 2 commits, `001-registration-kyc`'s full merge), cut
  `004-home-scan-shell` fresh off updated `main` (commit `a461fc4`), restored stashed
  spec/plan/tasks + feature_list.json/progress edits with no conflicts. `./init.sh` green
  (10/10, only pre-existing expo-doctor/native-dep-alignment warnings). Starting
  `task-implementer` loop at Phase 2 (Foundational): T001–T008, all `[P]`.
- Batch 1 (T001 `src/domain/navigation.ts`+test, T002 `src/features/navigation/README.md`):
  `task-implementer` → done. `code-reviewer` → APPROVED, no findings. Both `[X]` in
  `tasks.md`.
- Batch 2 (T003 `ScanEntryCard.tsx`+test, T004 `ScanPlaceholderScreen.tsx`+test):
  `task-implementer` → done. `code-reviewer` → APPROVED, no findings. Both `[X]` in
  `tasks.md`.
- Batch 3 (T005 `AmigosPlaceholderScreen.tsx`+test, T006 `SocialPlaceholderScreen.tsx`+test):
  `task-implementer` → done. `code-reviewer` → APPROVED, confirmed no real social/feed
  content leaked in. Both `[X]` in `tasks.md`.
- Batch 4 (T007 `TopRightControls.tsx`+test, T008 `AmigosQuickAccessPill.tsx`+test):
  `task-implementer` → done. `code-reviewer` → APPROVED, confirmed zero backend calls, no
  toast lib, pill's route derived from `NAV_DESTINATIONS` not hardcoded. Both `[X]` in
  `tasks.md`. **Phase 2 (Foundational) complete — all of T001-T008 `[X]` and reviewed.**
  Starting Phase 3 (US1 route wiring).
- Batch 5 (T009 `app/(app)/_layout.tsx` native tabs, T010 `WebSidebarNav.tsx`+test, T011
  `WebBottomBarNav.tsx`+test): `task-implementer` → done. `code-reviewer` → APPROVED, all
  three derive from `NAV_DESTINATIONS`, no drift risk, no premature Platform.OS branching.
  All three `[X]` in `tasks.md`.
- Batch 6 (T012 `app/(app)/_layout.web.tsx`+test, T013 `HomeScreen.tsx`+test):
  `task-implementer` → done. `code-reviewer` → APPROVED, confirmed no inline `Platform.OS`
  in `_layout.web.tsx`, breakpoint delegates to `resolveWebNavLayout`, live-resize test is
  real, `HomeScreen`'s scan-card `onPress` is still an inert placeholder (T016 wires it).
  Both `[X]` in `tasks.md`. Next: T014 (atomic route wiring — remove `app/index.tsx`, add
  `app/(app)/index.tsx`+`amigos.tsx`+`social.tsx`), the highest-risk task in this feature.
- T014: `task-implementer` → done, `app/index.tsx` removed atomically with the three new
  `(app)/` routes added, FR-009 respected (gate files untouched). Manual verification done
  via headless Chrome DOM dumps against a real `expo start --web` server (no GUI browser
  tool available), with a temporary revert-before-done monkeypatch to force the gate to
  `"main"` — reverted, confirmed clean. **Surfaced a real, pre-existing bug** (from T012, not
  T014's own diff): `expo start --web` crashes on startup — `_layout.web.tsx` and
  `_layout.web.test.tsx` "conflict" per expo-router's dev-server route-manifest scan (a
  different code path from `expo export`, which stays green — `metro.config.js`'s
  `blockList` doesn't reach it). `code-reviewer` independently reproduced this
  (`CHANGES_REQUESTED`) — confirmed real, confirmed not T014's fault, confirmed it blocks
  T015/T019/T021 (all require `npm run web`). T014's own files need no changes; routing a
  separate, narrowly-scoped fix task to `task-implementer` before resuming T015.
- **Dev-server crash fix** (not a numbered task): `task-implementer` found root cause via
  the actual `expo-router` source — `_layout.*` files hit a dev-server-only
  route-manifest-scan conflict that ordinary colocated route tests don't; relocated
  `app/(app)/_layout.web.test.tsx`'s coverage out of `app/`'s route-discovery path (no test
  coverage lost), documented the new `_layout.*`-test-placement rule in
  `docs/conventions.md` so T009/T016 don't hit the same landmine. `code-reviewer` →
  APPROVED, independently reproduced `npm run web` now booting clean with real `200`s at
  `/`, `/amigos`, `/social`. T014 (and this fix) now fully closed; T015 unblocked.
- T015 (US1 manual smoke check): `task-implementer` → done. **CORRECTION to my own earlier
  summary of this task** (caught while resolving a coordinator query later in the session —
  my original bullet here understated what actually happened; the real report is stronger):
  confirmed via a real running `npm run web` + headless Chrome driven over raw CDP (temporary
  gate monkeypatch, fully reverted) that the Home/Scan screen renders with the shell visible,
  no scaffold flash, no unmatched-route error (SC-001); AS6 (live-resize across 768px) was
  confirmed via a genuine OS-level browser window resize (CDP `Browser.setWindowBounds`) with
  a JS global marker proving no reload occurred in either direction — not merely inferred from
  T012's unit test. **A real iOS Simulator (iPhone 17 Pro) WAS booted and used** — real Expo
  Go, real device screenshots — confirming the native bottom tab bar and safe-area composition
  on native. One honest, unresolved gap from this task: reaching Amigos/Social *on native* used
  Expo Go's cold deep-link mechanism as a substitute for a real tap (no Accessibility/UI-
  automation permission was available in the sandbox to simulate an actual tap), and one
  resulting screenshot showed the native tab bar not visible on the Amigos screen reached that
  way — flagged explicitly as unresolved (not attributed to either a real bug or a deep-link
  artifact), recommended for a human with real device access to check by *tapping* the Amigos
  tab from a warm Home screen. Android: genuinely unavailable in this environment (no
  emulator/SDK), not performed, disclosed honestly. `code-reviewer` → APPROVED, independently
  reproduced the core SC-001 claim itself, confirmed `app/_layout.tsx` diff is clean. T015
  `[X]`. **Phase 3 / User Story 1 (MVP) complete.** Starting Phase 4 (US2: "+" card →
  `/scan` navigation, T016-T017).
- Batch (T016 `app/scan.tsx`+wire `HomeScreen`'s "+"card navigation, T017 a11y confirmation
  pass): `task-implementer` → done, navigation uses `SCAN_ROUTE` (no hardcoded string),
  manually confirmed via `npm run web` that press → `/scan` stub → back → intact shell.
  `code-reviewer` → APPROVED, independently reproduced the navigation round-trip, confirmed
  role/name-based a11y query resolves to "Scan a card". Both `[X]` in `tasks.md`. **Phase 4
  / User Story 2 complete.** Starting Phase 5 (US3: T018) + Phase 6 (US4: T019).
- Batch (T018 pill/tab convergence test, T019 `TopRightControls` manual a11y pass):
  `task-implementer` → done, T018's test derives its expectation from `NAV_DESTINATIONS`
  directly (not two independently-drifting assertions); T019 performed a real headless-
  Chrome DOM/keyboard pass against a live `npm run web` server (real Tab/Enter/Space
  dispatch, real `getComputedStyle`/`getBoundingClientRect()` reads) and found nothing
  needing a fix in `TopRightControls.tsx` — flagged one honest gap (no real iOS/TalkBack or
  Android/VoiceOver simulator session this batch; environment constraint, not a skipped
  check). `code-reviewer` → APPROVED. Both `[X]` in `tasks.md`. **All four user stories
  (US1-US4) now implemented and reviewed.** Starting
  Phase 7 (Polish: T020-T022).
- Batch (T020 full-screen a11y/tab-order pass, T021 responsive layout check):
  `task-implementer` → done, found and fixed two real bugs via live-dev-server reproduction:
  (a) the "+" card became clipped/unreachable at short landscape-phone viewports — fixed by
  making `HomeScreen`'s root a `ScrollView` (was a plain `View`); (b) iOS status-bar/Dynamic-
  Island overlap — fixed via `useSafeAreaInsets()`. Both fixes are presentation-only
  (Constitution IV), backed by new regression tests. `code-reviewer` → **APPROVE WITH
  NITS**: (1) flagged that the `ScrollView` fix makes the *whole* screen scroll rather than
  only the top-right controls stack, as spec.md's Edge Cases section illustratively suggested
  — reviewer confirmed this does NOT violate the edge case's binding MUST (no overlap at any
  tested viewport) and was the only fix that actually addressed the reproduced bug (the card,
  not the stack, was what overflowed), but explicitly recommended human sign-off on this
  disclosed deviation before closing; (2) a factual overclaim in the impl report about full
  card visibility at 667x300 — corrected in `progress/impl_004-home-scan-shell.md` directly
  (documentation-only, no code change). Both `[X]` in `tasks.md`. **Surfaced (1) to the
  human before proceeding to T022/close**, per this session's instruction to pause on
  anything touching a spec deviation rather than guess.
- **Human confirmed at the escalation gate**: keep the whole-screen `ScrollView` fix as-is,
  do not narrow it to a stack-only scroll — matches `code-reviewer`'s own reasoning (fixes
  the bug actually reproduced, satisfies the edge case's binding no-overlap MUST,
  presentation-only with regression tests). The human independently amended `spec.md`'s Edge
  Cases section to restate the requirement as the outcome, with an `AMENDED 2026-08-04` note
  — not re-edited by the orchestrator, per instruction. Also instructed: run T022, flip to
  `done`, move this log to history, and commit the branch (no push/PR/merge).
- While preparing the final report, caught and corrected an error in my own T015 log entry
  above (see the T015 bullet's inline correction) — it had understated real verification that
  actually happened (a real iOS Simulator was booted for T015; AS6 was CDP-verified, not just
  inferred from a unit test).
- T022 (final `./init.sh` gate): `task-implementer` → done, full unabridged `./init.sh` run
  → `RESULT: SUCCESS` (10/10), only the pre-existing expo-doctor/native-dep-alignment
  warnings that predate this feature. Confirmed `app/_layout.tsx`/`kyc-gate.ts`/
  `useKycGate.ts` zero diff (FR-009), no stray files. `code-reviewer` → **APPROVE WITH
  NITS** (final, holistic verdict on all 22 tasks): confirmed feature genuinely ready for
  `done` — every FR traced to a real test, zero backend calls, `init.sh` green, all tasks
  `[X]`. Two of three carried-forward nits closed (ScrollView deviation: human-confirmed and
  spec.md amended; 667×300 overclaim: corrected in the impl report). One nit still open,
  explicitly re-flagged for acknowledgment rather than silently dropped a fourth time:
  `WebSidebarNav`/`WebBottomBarNav` (T010/T011) each wrap their own independent
  `expo-router` `<Slot/>`, so the web sidebar↔bottom-bar switch on a breakpoint crossing
  unmounts/remounts the active screen subtree, resetting local component state (e.g.
  `TopRightControls`' toggle) — does NOT violate spec.md's binding AS6 (the active *route*
  survives above this layout), only ephemeral UI feedback state resets. Orchestrator
  acknowledges this explicitly here (recorded in `feature_list.json`'s closing notes too) as
  a known, accepted, non-blocking limitation — candidate for a future follow-up (hoist a
  shared `<Slot/>` above the layout ternary), not fixed in this feature.
- T022 `[X]`. All 22/22 tasks `[X]` and reviewed. `feature_list.json` flipped
  `004-home-scan-shell` to `done`.

## Open questions / blockers

- None blocking. One acknowledged, non-blocking loose end carried into `feature_list.json`'s
  closing notes: the web breakpoint switch resets ephemeral top-right-control feedback state
  (ScrollView/Slot nit above) — candidate for a future small follow-up, not spec-violating.
- One unresolved, disclosed gap from manual native verification (T015): reaching Amigos/
  Social on native during testing used a cold Expo-Go deep link (no real-tap capability in
  the sandbox); one resulting screenshot showed the native tab bar not visible on that screen
  — never reproduced via a real tap, never attributed conclusively to a real bug vs. a
  deep-link artifact. Recommend a human with real device access check: does *tapping* the
  Amigos tab from a warm Home screen keep the tab bar visible?
- Android was never available in this environment at any point in this feature — zero
  Android-specific manual verification was ever performed (inferred-safe, not checked).

## Next step

- Feature is `done`. No next step for `004-home-scan-shell` itself. Follow-ups worth a human
  decision, not auto-spawned: (a) the native tab-bar-on-deep-link anomaly above, (b) whether
  the `<Slot/>` state-reset nit is worth a small fix, (c) a real Android verification pass
  once an emulator/SDK is available.
