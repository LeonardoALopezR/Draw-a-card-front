# Tasks: CI Test Timeout Fix

**Input**: Design documents from `specs/015-ci-test-timeout/` (`spec.md`, `plan.md`)

**Tests**: This feature's "tests" are the existing 630 (see T001) jest tests, unmodified — it adds
no new application code to unit-test in the usual sense. Its equivalent of a Level 3 manual smoke
check (`docs/verification.md`) is watching a real `ubuntu-latest` CI run **on this feature's own
PR #10** (the throwaway-branch mechanism plan.md originally specified is superseded — see the
Round 2 Amendment below and in spec.md/plan.md) — captured explicitly below, not assumed or
skipped.

**⚠️ ROUND 2 AMENDMENT (2026-08-07)**: T002–T005 shipped exactly as planned and were confirmed,
on PR #10's real CI run, to NOT fix the timeout (kept anyway — genuine, independent win). Two
further remedies (module warming; a canary test) were evaluated and eliminated by measurement.
The actual root cause is jest worker-pool oversubscription; the human-settled fix is
`--runInBand` in CI only, via `init.sh` (see plan.md's "Bounding jest's worker concurrency in CI"
Research Decision). New tasks T014–T018 carry this out; T006–T010 below are annotated with their
actual (superseded or completed-with-a-different-outcome) status rather than rewritten out of
existence, so the history stays legible. **Jump to T014 if you only need what's left to do.**

**Organization**: Tasks are grouped by user story from `spec.md`, in priority order (P1 → P2).
User Story 1 (the fix, empirically proven on real CI) is the MVP and the entire reason this
feature exists; User Story 2 (repo-wide scope) is delivered by the same fix, by construction —
see spec.md's "Why lower priority than User Story 1" note.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 (the fix + empirical CI proof, P1), US2 (repo-wide scope, P2 — verified as a
  byproduct of US1's own tasks, not separate implementation)
- File paths are exact; see `plan.md`'s Project Structure for the full tree

---

## Phase 1: Setup

**Skipped — no new setup needed.** `jest`/`jest-expo`/`@testing-library/react-native` are already
installed and configured (`docs/verification.md`; `jest.config.js` already exists). No new
`package.json` script needed — the existing `npm test` (`jest`) already picks up the new setup
file once `jest.config.js` references it.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Sync with `main` and confirm the exact starting state this feature's edits layer
onto, before writing any fix — `main` may have moved since this spec was written (spec.md
Assumptions), and `jest.config.js` has a known, currently-uncommitted, unrelated local edit from
a separate concurrent session that must not be assumed present or absent.

**⚠️ CRITICAL**: Do not skip T001 — every later task's file-path/diff assumptions depend on
knowing the actual starting state of `jest.config.js` and `main`.

- [X] T001 Per the `feature-branch` skill: sync a local `main` with `origin/main`, then cut
  `015-ci-test-timeout` from that up-to-date `main` (NOT from `014-continuous-integration`'s
  branch — see plan.md's "CI evidence mechanism" Research Decision, Option (c)). Confirm and
  record in `progress/impl_015-ci-test-timeout.md`: (a) the exact commit `main` is at, (b) the
  current contents of `jest.config.js` on that commit (specifically whether it already includes
  the `modulePathIgnorePatterns: ["<rootDir>/.claude/worktrees/"]` entry noted in spec.md's
  Re-verification section as a separate session's uncommitted local edit — it may or may not have
  landed on `main` by the time this task runs), and (c) `npx jest` reports the current total test
  count (spec.md's SC-002 references "630 (or however many then exist)" — record the real number
  here). *(spec.md Assumptions, plan.md's Project Structure note)*

**T001 OUTCOME (done by the orchestrator, not `task-implementer`)**: branch cut from `main` @
`0589e03` (which already contained 014's workflow AND `f02abb1`, so `jest.config.js` DID already
have the `modulePathIgnorePatterns` worktree entry — it landed on `main` via PR #8). Baseline
recorded: `npx jest` → **630 passed / 630 total, 85 suites**; `grep -c "not wrapped in act"` → 44.

**Checkpoint**: Feature branch exists, cut from a known, recorded `main` state — the fix can now
be written against that confirmed baseline.

---

## Phase 3: User Story 1 - A pull request's CI check reliably reflects local test results (Priority: P1) 🎯 MVP

**Goal**: `LoginScreen.test.tsx`'s first test (and, by construction, every other suite's first
test) completes with a comfortable, empirically-measured margin under jest's 5000ms default
timeout on a real `ubuntu-latest`, 2-core GitHub Actions runner — proven, not assumed.

**Independent Test**: Per spec.md — obtain a real CI run (plan.md's mechanism), confirm
`LoginScreen.test.tsx`'s first test duration and the full suite's pass/fail count from that run's
own logs.

### ⚠️ PLAN AMENDMENT 2026-08-07 — read before starting T006

The human chose **Option (d)**, not plan.md's recommended Option (c): PR #9 was merged to `main`
with its check knowingly red (merge commit `0589e03`). **`main` now contains
`.github/workflows/ci.yml`**, so this feature's branch — cut from `main` @ `0589e03` — gets a real
`CI / verify` check on **its own pull request**, automatically.

**The throwaway branch/PR is therefore obsolete and MUST NOT be created.** Concretely:

- **T006** — do NOT create `015-ci-evidence-throwaway`, do NOT cherry-pick `e309d45`/`7b69138`
  (they are already ancestors of this branch). It becomes: push `015-ci-test-timeout` and open its
  own PR against `main`. Still requires explicit human authorization at the time.
- **T007 / T009** — read the measurements from **this feature's own PR's** check run.
- **T008** — unchanged. The escalation path (no `testTimeout`, set `blocked`, hand back to the
  human) still applies verbatim; only "close the throwaway PR" drops out.
- **T010** — obsolete. There is nothing to close unmerged and no disposable branch to delete. This
  feature's own PR stays open for normal review.
- **FR-008** ("merge before 014's PR #9") is moot — #9 already merged.

Everything else stands unchanged: FR-001–FR-007, the `jest.setup.ts` approach, FR-006's
go-back-to-the-human escape hatch, and FR-007's `CrearCuentaScreen` check.

### Implementation for User Story 1

- [X] T002 [US1] Create `jest.setup.ts` at the repo root: mock `expo-font`'s `isLoaded` export to
  always return `true` (spreading the real module's other exports via
  `jest.requireActual("expo-font")` so nothing else `expo-font` provides is affected), per
  plan.md's "actual jest-setup-file mechanism" Research Decision. Add a short comment explaining
  *why* (the `@expo/vector-icons` `Icon` component's `componentDidMount` async `setState` this
  prevents — cite `node_modules/@expo/vector-icons/build/createIconSet.js`'s actual logic, per
  this repo's comment convention of capturing non-obvious *why*, not just *what*). *(FR-001,
  FR-003, FR-004)*
- [X] T003 [US1] Wire `jest.setup.ts` into `jest.config.js` via `setupFiles` (confirm this is the
  correct hook — early enough to intercept `expo-font` before any test file's own module graph
  resolves it — vs. `setupFilesAfterEach`; use whichever actually works when verified in T004).
  This edit is additive only — every other existing key in `jest.config.js` (as recorded in T001)
  stays exactly as it was on `main`. *(FR-001, FR-003, FR-004)*
- [X] T004 [US1] Run `npx jest --verbose 2>&1 | grep -c "not wrapped in act"` locally and confirm
  `0` (previously non-zero whenever an icon-rendering suite — e.g. `Viewfinder.test.tsx` — runs,
  per spec.md's Re-verification section). If still non-zero, identify which suite(s) still warn
  and whether the cause is the same `expo-font`/`Icon` path or a different, unrelated async
  `setState` — do not weaken any assertion or add a blanket console-warning suppressor to make
  this check pass; fix the actual remaining cause or record it honestly as unresolved. *(FR-004,
  SC-003)*
- [X] T005 [US1] Run `npx jest src/features/identity/LoginScreen.test.tsx --verbose` locally and
  confirm all tests recorded in T001's baseline still pass, with byte-for-byte the same assertions
  (no diff to the `.test.tsx` file itself — confirm via `git diff` showing zero changes to that
  file). Then run the full suite (`npx jest` or `./init.sh`) and confirm the total pass count
  matches T001's recorded baseline exactly — zero new failures, zero assertions weakened. *(FR-002,
  FR-003, spec.md Acceptance Scenario 4, SC-002)*
- [X] T006 [US1] **DONE, DIFFERENTLY THAN WRITTEN — no throwaway branch was needed (see Plan
  Amendment above).** ~~Requires explicit human authorization before pushing/opening
  anything...create a new, disposable branch...cherry-pick `014`'s two workflow commits...~~
  **Actual**: since `main` already carried `.github/workflows/ci.yml` (`014` merged first),
  `015-ci-test-timeout` was pushed directly and its own pull request opened against `main` — **PR
  #10** — with explicit human authorization. No throwaway branch/PR was created or needed.
  *(plan.md's CI evidence mechanism Research Decision, now superseded; FR-005)*
- [X] T007 [US1] **DONE. Real result: FAILED — record this plainly, it's the entire reason Round 2
  exists.** Watched PR #10's `CI / verify` check run to completion (**run 31232122050**). Recorded
  in `progress/impl_015-ci-test-timeout.md`: (a) full pass/fail summary — 1 failed, 629 passed
  (same failure as before this feature); (b) `LoginScreen.test.tsx`'s first test: still
  `Exceeded timeout of 5000 ms`, i.e. still **>5000ms**, effectively unchanged from before this
  feature's fix (suite total 11.06s → 10.58s); (c) the two pre-existing `WARN`-graded issues did
  not fail the build (unaffected, as expected). *(FR-005, SC-001, SC-002)*
- [X] T008 [US1] **DONE. Outcome: the "does NOT pass" branch — this is FR-006 working exactly as
  designed, not a task failure.** Evaluated T007's measured duration against SC-001 (under
  3000ms): **it does not pass** — the fix did not even reduce the failure below jest's 5000ms
  hard limit, let alone reach a 3000ms margin. Per FR-006: did **not** add a `testTimeout`
  override. `feature_list.json`'s `015-ci-test-timeout` status was set to `blocked`. Two further
  candidate remedies were then evaluated and eliminated by measurement (module warming; a canary
  test — see spec.md/plan.md's Round 2 Amendment for the numbers) before escalating the next
  decision to the human, who settled on `--runInBand` (FR-009/FR-010, carried out in T014–T018
  below). *(FR-006, SC-001)*
- [X] T009 [US1] **SUPERSEDED — folded into T017 below, not performed against the (already-known-
  insufficient) T007 run.** Originally: confirm `CrearCuentaScreen.test.tsx`'s first test duration
  from the same real run as T007. Since T007's run already failed SC-001 before this check would
  have added new information toward a *shipped* fix, this measurement is deferred to the
  `--runInBand` run (T017), which is the one whose numbers actually matter for this feature's
  done-criteria. Left unchecked and not performed for T007's run specifically. *(FR-007, SC-004 —
  now served by T017)*
- [X] T010 [US1] **OBSOLETE — no throwaway PR/branch was ever created (see T006), so there is
  nothing to close or delete.** Left unchecked deliberately (not marked done, since its own action
  never applies) rather than silently removed, so a future reader sees explicitly that this task
  was superseded, not forgotten. *(plan.md's CI evidence mechanism Research Decision — superseded)*

**Checkpoint**: T002–T008 establish, with real evidence, that the `expo-font`/`act()` fix alone is
insufficient and that `feature_list.json` correctly reflects `blocked` — this is a legitimate,
honest intermediate state per FR-006, not a dead end. T014–T018 below carry out the human-settled
next remedy.

---

## Phase 3b: Round 2 — Bound jest's worker concurrency in CI (still User Story 1, still P1)

**Goal**: Apply the empirically confirmed fix (`--runInBand` in CI only, via `init.sh`) and prove
it — not just the `act()` fix — brings `LoginScreen.test.tsx`'s (and `CrearCuentaScreen.test.tsx`'s)
first test under a comfortable margin on a real `ubuntu-latest` run, without affecting local
development.

**Independent Test**: Per plan.md's "Bounding jest's worker concurrency in CI" Research Decision —
push the `init.sh` change to PR #10, observe its real `CI / verify` run, and read the measured
durations directly from that run's logs.

- [X] T014 [US1] Implement the `CI`-conditional in `init.sh` stage 7 (plan.md's "Bounding jest's
  worker concurrency in CI" Research Decision, FR-009/FR-010): when `[ "$CI" = "true" ]`, run
  `npm test -- --runInBand` instead of the existing unflagged `npm test`; the `SKIP_TESTS` branch,
  the no-`test`-script branch, the log file path, and every `add_result` call stay exactly as they
  are today. Do not touch `jest.config.js` or `package.json`'s `scripts` for this — the
  conditional lives in `init.sh` only. *(FR-009, FR-010)*
- [X] T015 [US1] Verify locally, twice: (a) run `./init.sh` (or `npm test`) with no `CI` env var
  set and confirm stage 7 behaves exactly as before this change (unbounded parallelism, same
  wall-clock ballpark as today) — this is the local-invisibility requirement (FR-009); (b) run
  `CI=true npm test -- --listTests` or equivalent to confirm the conditional actually activates
  and forwards `--runInBand` to jest when `CI=true` (re-confirming the flag-forwarding behavior
  already verified: `npm test -- --maxWorkers=2 --listTests` correctly passes flags through), then
  run `CI=true npm test` (or `CI=true ./init.sh --skip-install --skip-build`) and confirm all
  tests still pass. Confirm `git diff -- src/features/identity/LoginScreen.test.tsx` remains empty
  (FR-002 — this remedy touches no test file, same as T005 already confirmed for the first one).
  *(FR-002, FR-003, FR-009)*
- [X] T016 [US1] **Requires explicit, real-time human authorization to push** (already granted
  specifically for pushing to PR #10's branch per the coordinator's Round 2 instruction — if
  resuming this task in a different/later session, re-confirm that authorization still stands
  before pushing). Commit the `init.sh` change and push it to `015-ci-test-timeout` (**PR #10's
  existing branch — do not open a new PR**, per the Plan Amendment above: this feature's own PR
  already has a working `CI / verify` check). Watch that check run to completion on the real
  `ubuntu-latest` runner. *(FR-005)*
- [X] T017 [US1] From T016's real run logs, record in `progress/impl_015-ci-test-timeout.md`: (a)
  the full pass/fail summary; (b) `LoginScreen.test.tsx`'s first test's exact measured duration;
  (c) `CrearCuentaScreen.test.tsx`'s first test's exact measured duration (spec.md FR-007 — the
  check T009 deferred to here); (d) the total job duration, for SC-006. *(FR-005, FR-007, SC-001,
  SC-002, SC-004, SC-006)*
- [X] T018 [US1] Evaluate T017's measured durations: SC-001 (`LoginScreen.test.tsx` under 3000ms),
  SC-004 (`CrearCuentaScreen.test.tsx` under 3000ms), and SC-006 (total job duration comfortably
  within the 20-minute timeout). **If ALL pass with clear margin**: this feature's fix is
  confirmed — flip `feature_list.json`'s `015-ci-test-timeout` status from `blocked` back to a
  normal in-progress/near-done state and proceed to Phase 5 (Polish). **If ANY fails its margin**:
  this is FR-006 firing again, exactly as designed — do **not** add a `testTimeout` override
  anywhere; keep `feature_list.json`'s status `blocked`; record the measured numbers and remaining
  options (see spec.md's Clarifications, second bullet, as updated in Round 2) in
  `progress/current.md`; stop for the human. *(FR-006, SC-001, SC-004, SC-006 — the load-bearing
  task of this feature's second remedy, same role T008 played for the first one)*

**T016/T017/T018 OUTCOME**: T016 pushed to PR #10 and CI ran green (`RESULT: SUCCESS (10/10)`,
630/630) — which also satisfied **014's T003**. T017's measurement required two extra commits to
even be possible (the log dump moved to `if: always()`, and `--verbose` was added to CI's jest
call), because a green run previously exposed only suite-level timing. **T018 then FIRED FR-006 a
second time**: the target test measured **3885ms** against jest's 5000ms limit — 22% headroom, so
SC-001's 3000ms bar failed. `CrearCuentaScreen`'s first test measured 936ms (SC-004 passed). Status
was set `blocked` and handed to the human, exactly as T018 requires. Round 3 below is the result.

**Checkpoint**: Either this feature is genuinely, empirically done — proven on real CI, not
assumed from local numbers that already once looked promising and weren't enough — or it is
honestly `blocked` a second time with fresh numbers for the human, per T018.

---

## Phase 3c: Round 3 — Cold jest transform cache (still User Story 1, still P1)

**T016 and T017 are DONE** (pushed to PR #10; CI green, `RESULT: SUCCESS (10/10)`, 630/630, job
140s — which also satisfied 014's T003). **T018 FIRED FR-006 a second time**: the measured
duration was **3885ms** against jest's 5000ms limit, so SC-001's 3000ms bar is NOT met — only 22%
headroom, the same "future flake" condition that ruled out `--maxWorkers=2`. `CrearCuentaScreen`'s
first test measured 936ms (SC-004 passes). Those numbers were only obtainable because the log dump
was switched to `if: always()` and `--verbose` was added to the CI-only jest call.

**Root cause, corrected a second time — cold jest transform cache.** Measured locally, same test,
`--runInBand` throughout, only cache state varying: warm **147ms** → `npx jest --clearCache` →
**1666ms** (11x) → warm again **146ms**. CI's cache is always cold, so every run babel-transforms
the React Native module graph the first time a `render()` triggers its lazy requires. Worker
contention (Round 2) was a real contributor and `--runInBand` stays, but this is the dominant term.

**HUMAN SIGN-OFF 2026-08-07 — this is the explicit authorization FR-006 required.** The human chose
**(a) + (c)**: cache jest's transform cache in CI, AND a scoped `testTimeout`. FR-006's prohibition
on a `testTimeout` is therefore satisfied by explicit sign-off, not bypassed. Record it as such.

- [X] T019 [US1] Give jest a stable, cacheable transform-cache location so CI can persist it
  across runs. Define it in ONE place — `jest.config.js`'s `cacheDirectory` as a `<rootDir>`
  relative path (e.g. `<rootDir>/.jest-cache`) — rather than duplicating a path string between
  `jest.config.js` and the workflow. Add that directory to `.gitignore` (it currently has no cache
  entries). Note and accept the one local side effect: a developer's jest cache moves location, so
  their first run after this change rebuilds it once; that is benign and must be stated, not hidden.
  Confirm jest does not try to treat its own cache directory as a test root or haste-map input.
  *(FR-005; enables T020)*
- [X] T020 [US1] Add an `actions/cache` step to `.github/workflows/ci.yml` caching that directory,
  placed before the `./init.sh --skip-install` step. Key it on the things that actually invalidate a
  babel transform: `package-lock.json` AND `babel.config.js` AND `jest.config.js` (plus a version
  prefix so the key can be rotated by hand). Include a sensible `restore-keys` fallback. Be explicit
  in a comment that a cache MISS (first run, or after any of those files change) still pays the full
  cold cost — this improves the common case, it does not remove the worst case, which is exactly why
  T021 is also needed. *(FR-005)*
- [X] T021 [US1] Add a scoped `--testTimeout` to the **CI-only** jest invocation in `init.sh` stage 7
  (alongside the existing `--runInBand --verbose`), sized with real margin over the measured
  worst case — 15000ms against a measured 3885ms cold. **Scope it to CI deliberately**: do NOT put
  `testTimeout` in `jest.config.js`, so a developer's local run keeps jest's strict 5000ms default
  and a genuinely slow test is still caught in development. A per-file `jest.setTimeout` is NOT an
  option here — that would edit `src/features/identity/LoginScreen.test.tsx`, which FR-002 forbids.
  The comment must record that this exists to absorb unavoidable cold-cache transform cost on a
  shared runner, not to excuse slow tests, and must cite the human's sign-off. *(FR-006 as amended
  by the sign-off above, SC-001)*
- [X] T022 [US1] **LOCAL HALF DONE, CI HALF OUTSTANDING (owned by the orchestrator).** Verify
  locally: (a) with no `CI` env var, `npm test`/`./init.sh` still uses the
  parallel path with jest's default 5000ms timeout and no `--verbose`; (b) with `CI=true`, the run
  reports `--runInBand` and passes. Then push to PR #10's branch and, from the real run, record in
  `progress/impl_015-ci-test-timeout.md`: the target test's measured duration on a cache MISS and
  (by re-running) on a cache HIT, `CrearCuentaScreen`'s first test, the total job duration, and
  whether the `actions/cache` step reported a hit or miss. Evaluate against SC-001/SC-004/SC-006.
  The cold-miss number will likely still exceed 3000ms — that is expected and is precisely what
  T021's timeout covers; say so plainly rather than presenting the warm number as if it were the
  only one. *(FR-005, FR-007, SC-001, SC-004, SC-006)* **Push + real CI evidence is the
  orchestrator's step, not performed in this run — see progress/impl_015-ci-test-timeout.md.**

**T019–T022 OUTCOME — both halves of T022 are now DONE, including the CI half.** Two real runs on
PR #10, deliberately engineered to measure both cache states:

| | cache MISS (run 31234302973) | cache HIT (run 31234419308) |
|---|---|---|
| target test | **3999ms** | **311ms** (12.9x faster) |
| `CrearCuentaScreen` first test | 1019ms | 127ms |
| jest total | 28.917s | 16.26s (44% faster) |
| result | `SUCCESS (10/10)`, 630/630 | `SUCCESS (10/10)`, 630/630, job wall 134s |

The MISS was unavoidable on the first run (that commit changed `jest.config.js`, a keyed file); the
HIT was obtained by a bookkeeping-only commit touching none of the keyed files. The cache step
logged `Cache not found for input keys: v1-jest-cache-Linux-…` then restored on the next run,
proving it persists rather than silently no-op'ing.

**Verdict against the criteria**: SC-001 is met on warm runs at **311ms — under even the original
3000ms bar**, not merely under the raised ceiling. SC-004 is met in both states. Cold-miss runs sit
at 3999ms with **73% headroom** under the 15000ms CI ceiling, versus the 22% headroom under 5000ms
that caused escalation #2 — so the fragility is resolved in both cases, not papered over in one.

**Checkpoint**: typical CI runs are fast because the transform cache persists, and cold-miss runs
are robust rather than 22%-margin fragile because the CI-only ceiling absorbs them — with both the
hit and miss durations measured and recorded, not inferred.

---

## Phase 4: User Story 2 - The systemic risk is reduced, not just patched for one test (Priority: P2)

**Goal**: Confirm the fix's scope is genuinely repo-wide, not accidentally scoped to
`LoginScreen.test.tsx` alone.

**Independent Test**: Per spec.md — run any icon-rendering suite with `--verbose` and confirm no
`act()` warning from `@expo/vector-icons` remains.

### Verification for User Story 2

*(No separate implementation task — US2 is delivered by T002/T003's fix by construction, since
it is a global jest setup file, not a per-file change. This phase only confirms that scope
claim explicitly, as its own checkable item.)*

- [X] T011 [US2] Confirm T004's local `grep -c "not wrapped in act"` check (already run as part of
  Phase 3) covers multiple distinct icon-rendering suites, not just one — spot-check at least
  `Viewfinder.test.tsx`, `TopRightControls.test.tsx` (or whichever suite renders
  `WebSidebarNav`/`WebBottomBarNav`), and one from `src/features/scanner/` beyond `Viewfinder`
  (e.g. `EmptyResultsPanel.test.tsx` or `UploadDropzone.test.tsx`, whichever has an existing test
  file) individually with `--verbose`, confirming zero warnings in each. Record the list of
  suites checked in `progress/impl_015-ci-test-timeout.md`. *(FR-004, spec.md Acceptance Scenario
  2)*

**Checkpoint**: The fix's repo-wide scope is independently confirmed across multiple suites, not
assumed from a single file's clean output.

---

## Phase 5: Polish & Documentation

**Purpose**: Keep the repo's own map of itself accurate, per this repo's existing convention of
updating `AGENTS.md`/`docs/` alongside the feature that changes what they describe.

- [X] T012 [P] Update `docs/verification.md` with a short addition noting: a jest setup file
  (`jest.setup.ts`) now exists and mocks `expo-font`'s `isLoaded` to prevent
  `@expo/vector-icons`' async font-loading `setState` from firing during tests — link this
  feature's spec for the full rationale. Do not rewrite the existing Levels 1–5 definitions
  themselves; this is a short addition, same treatment `014-continuous-integration`'s T009 gave
  the CI section. **Also add (Round 2)**: a short note that CI runs jest with `--runInBand` (via
  `init.sh` stage 7's `CI`-conditional) specifically to avoid worker-contention-induced timeouts —
  local runs are unaffected. *(repo hygiene, no specific FR)*
- [X] T013 [P] **UPDATED (Round 2) — gated on T018, not T008/T009.** If T018 passes (this feature
  is not `blocked`): update this feature's own `feature_list.json` entry — status `blocked` →
  (once confirmed genuinely fixed) `in_progress` → `done`, per the normal SDD workflow — with a
  summary of the measured CI evidence from BOTH rounds (the `act()` fix's real-CI insufficiency,
  T007/T008; the `--runInBand` fix's real-CI sufficiency, T017/T018's SC-001/SC-004/SC-006 actual
  numbers) so a future reader does not have to re-derive either from
  `progress/impl_015-ci-test-timeout.md`. If T018 instead lands on the "fails its margin" branch,
  do not perform this task — the feature stays `blocked` and this task waits for whatever the
  human decides next. *(repo hygiene)*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped — no dependency.
- **Foundational (Phase 2)**: No dependency on Setup (skipped) — BLOCKS everything else (T001's
  recorded baseline is referenced by T004, T005, T007).
- **User Story 1 (Phase 3)**: Depends on Phase 2 (T001). T002 → T003 → T004/T005 (fix must exist
  and be wired before it can be verified locally) → T006 (DONE) → T007 (DONE, result: FAIL) →
  T008 (DONE, result: escalate — `blocked`). T009/T010 superseded, not performed as originally
  written.
- **Phase 3b (Round 2, still US1)**: Depends on Phase 3 having reached T008's escalation (it has).
  T014 → T015 (verify locally before pushing) → T016 (push + real CI run — requires human
  authorization) → T017 (record real measurements) → T018 (evaluate — this feature's actual
  done-criteria).
- **User Story 2 (Phase 4)**: Depends on T004 (the same local check T011 spot-checks
  individually) — can run any time after T004, does not depend on Phase 3b's CI-evidence steps.
- **Polish (Phase 5)**: T012 can happen any time after T003 (its Round 2 addendum can happen any
  time after T014). T013 depends on Phase 3b's outcome (T018) being a genuine pass, not `blocked`.

### Parallel Opportunities

- T011 (Phase 4) can happen any time after T004 — independent of Phase 3b entirely.
- T012 and T013 (Phase 5, different files) are NOT fully parallel this round: T012's base content
  can be written any time after T003, but its Round 2 addendum and T013 both depend on T014/T018
  respectively — sequence T012's addendum and T013 after T018, not before.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2 (T001 — recorded baseline).
2. Complete Phase 3 (T002–T010 — the `expo-font`/`act()` fix, local verification, and real CI
   evidence). **This already happened and the outcome was `blocked`** — a legitimate, honest
   result per FR-006, not a failure of the task list.
3. Complete Phase 3b (T014–T018 — the `--runInBand` fix, local verification, and real CI
   evidence).
4. **STOP and VALIDATE**: At this point, either this feature is genuinely done (T018's real CI
   evidence confirms the fix), or it is `blocked` a second time with fresh measured numbers and
   remaining options recorded for the human — both are valid, honest outcomes; a `blocked` result
   is not a failure of this task list, it is FR-006 working as designed, twice now if it happens
   again.

### Incremental Delivery

1. Phase 2 → Phase 3 (the `act()` fix, empirically proven insufficient — DONE).
2. Phase 3b (the `--runInBand` fix, empirically proven or honestly blocked again).
3. Phase 4 (US2's explicit multi-suite confirmation) alongside or right after Phase 3's T004 —
   independent of Phase 3b, can happen any time.
4. Phase 5 (docs/status bookkeeping) once Phase 3b's outcome is known either way.

---

## Notes

- [P] tasks = different files, no dependency on an incomplete task.
- [Story] label maps task to specific user story for traceability back to spec.md.
- T006 and T016 are the two tasks in this file that require explicit, real-time human
  authorization before they can be executed (pushing a branch/commit, and — for T006 only, as
  originally written — opening a PR; T016 pushes to the already-open PR #10, per the Plan
  Amendment). Do not treat either plan.md Research Decision's existence as standing permission to
  push/open/merge anything autonomously — that authorization is real-time, per this repo's
  standing rule, and for T016 specifically it has already been given once (per the coordinator's
  Round 2 instruction) but should be re-confirmed if resumed in a different session.
- T008 and T018 are this feature's two most important tasks: each is the point where "does this
  particular remedy actually work on real CI" gets a real, evidence-based answer, and where this
  feature is explicitly required to stop rather than quietly reach for `testTimeout` if the answer
  is no. T008 already fired once (result: no) — T018 is where that happens for the second, human-
  settled remedy.
- T009/T010 are intentionally left unchecked and annotated **SUPERSEDED**/**OBSOLETE** rather than
  deleted or silently marked done — this repo's convention (see `014-continuous-integration`'s own
  amendment history) is to keep a reasoning trail visible, not to rewrite tasks.md as if the
  original plan had never existed.
- Every task above states which `spec.md` FR(s)/Acceptance Scenario(s)/SC(s) it serves, per this
  repo's traceability convention (`docs/verification.md` Level 5, adapted here since this
  feature's "tests" are the existing suite plus real CI evidence, not new unit tests of its own).
