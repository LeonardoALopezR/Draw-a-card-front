# Tasks: CI Test Timeout Fix

**Input**: Design documents from `specs/015-ci-test-timeout/` (`spec.md`, `plan.md`)

**Tests**: This feature's "tests" are the existing 630 jest tests, unmodified — it adds no new
application code to unit-test in the usual sense. Its equivalent of a Level 3 manual smoke check
(`docs/verification.md`) is watching a real `ubuntu-latest` CI run, per plan.md's "CI evidence
mechanism" — captured explicitly below, not assumed or skipped.

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

- [ ] T001 Per the `feature-branch` skill: sync a local `main` with `origin/main`, then cut
  `015-ci-test-timeout` from that up-to-date `main` (NOT from `014-continuous-integration`'s
  branch — see plan.md's "CI evidence mechanism" Research Decision, Option (c)). Confirm and
  record in `progress/impl_015-ci-test-timeout.md`: (a) the exact commit `main` is at, (b) the
  current contents of `jest.config.js` on that commit (specifically whether it already includes
  the `modulePathIgnorePatterns: ["<rootDir>/.claude/worktrees/"]` entry noted in spec.md's
  Re-verification section as a separate session's uncommitted local edit — it may or may not have
  landed on `main` by the time this task runs), and (c) `npx jest` reports the current total test
  count (spec.md's SC-002 references "630 (or however many then exist)" — record the real number
  here). *(spec.md Assumptions, plan.md's Project Structure note)*

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
- [ ] T006 [US1] **Requires explicit human authorization before pushing/opening anything** (this
  feature's own instruction: no push/PR/merge without authorization at the time). Per plan.md's
  "CI evidence mechanism" Research Decision: create a new, disposable branch from
  `015-ci-test-timeout`'s current tip (e.g. `015-ci-evidence-throwaway`), cherry-pick `014`'s two
  workflow commits (`e309d45`, `7b69138`) onto it, push it, and open a pull request against `main`
  from that throwaway branch — its **sole purpose** is to obtain one real `CI / verify` run; it is
  never intended to be merged. *(plan.md's CI evidence mechanism Research Decision, FR-005)*
- [ ] T007 [US1] Watch the throwaway PR's `CI / verify` check run to completion. From its logs,
  record in `progress/impl_015-ci-test-timeout.md`: (a) the full pass/fail summary (expect it to
  match T001/T005's baseline count, all passing); (b) `LoginScreen.test.tsx`'s first test's exact
  measured duration; (c) confirmation that the two pre-existing `WARN`-graded issues
  (expo-doctor, native dependency alignment) still don't fail the build, unrelated to this
  feature but worth confirming nothing regressed. *(FR-005, SC-001, SC-002)*
- [ ] T008 [US1] Evaluate T007's measured `LoginScreen.test.tsx` duration against SC-001 (must be
  under 3000ms for a comfortable margin below the 5000ms default). If it passes: proceed to T010.
  If it does NOT pass (at or above 3000ms, or still exceeding 5000ms outright): STOP here. Do
  **not** add a `testTimeout` override anywhere. Set `feature_list.json`'s `015-ci-test-timeout`
  status to `blocked`, write the measured numbers and the remaining options (spec.md
  Clarifications' second bullet: reduce first-render cost further, split the heavy suite so a
  cheap canary absorbs the one-time cost, or — only with explicit human sign-off — a scoped
  `testTimeout` for that one file) to `progress/current.md`, close the throwaway PR unmerged, and
  end this session for human review. *(FR-006, SC-001 — this is the escalation path spec.md's
  Clarifications section requires, not optional)*
- [ ] T009 [US1] [P] While T007's throwaway PR is still open (or from the same run's logs),
  independently confirm `CrearCuentaScreen.test.tsx`'s first test duration from the same real run
  (spec.md FR-007 — the kickoff brief's named most-likely-next-victim). Record it in
  `progress/impl_015-ci-test-timeout.md` alongside T007's numbers. Evaluate against SC-004 (under
  3000ms) the same way T008 evaluates SC-001 — if it fails, this is additional evidence for T008's
  escalation path, not a separate blocker to resolve independently. *(FR-007, SC-004)*
- [ ] T010 [US1] Once T008 (and T009) pass: close the throwaway PR from T006 **without merging
  it**, and delete its disposable branch (`015-ci-evidence-throwaway`) both locally and on the
  remote. Confirm `015-ci-test-timeout`'s own branch/diff was never touched by the throwaway
  branch's existence (`git log 015-ci-test-timeout` shows only this feature's own commits — no
  `014` commits). *(plan.md's CI evidence mechanism Research Decision — "close unmerged" step)*

**Checkpoint**: The fix is implemented, locally verified as behavior-preserving, and empirically
proven on a real 2-core `ubuntu-latest` runner with a recorded, comfortable safety margin — or the
feature is honestly `blocked` pending human input, per T008.

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

- [ ] T011 [US2] Confirm T004's local `grep -c "not wrapped in act"` check (already run as part of
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

- [ ] T012 [P] Update `docs/verification.md` with a short addition noting: a jest setup file
  (`jest.setup.ts`) now exists and mocks `expo-font`'s `isLoaded` to prevent
  `@expo/vector-icons`' async font-loading `setState` from firing during tests — link this
  feature's spec for the full rationale. Do not rewrite the existing Levels 1–5 definitions
  themselves; this is a short addition, same treatment `014-continuous-integration`'s T009 gave
  the CI section. *(repo hygiene, no specific FR)*
- [ ] T013 [P] If T008/T009 both pass (this feature is not `blocked`): update this feature's own
  `feature_list.json` entry — status `spec_ready` → (after human approval and the branch is cut)
  `in_progress` → `done`, per the normal SDD workflow — with a summary of the measured CI evidence
  (SC-001/SC-004's actual numbers) so a future reader does not have to re-derive it from
  `progress/impl_015-ci-test-timeout.md`. *(repo hygiene)*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped — no dependency.
- **Foundational (Phase 2)**: No dependency on Setup (skipped) — BLOCKS everything else (T001's
  recorded baseline is referenced by T004, T005, T007, T009).
- **User Story 1 (Phase 3)**: Depends on Phase 2 (T001). T002 → T003 → T004/T005 (fix must exist
  and be wired before it can be verified locally) → T006 → T007 → T008/T009 (evaluation depends
  on T007's real measurements) → T010 (cleanup depends on T008/T009 having passed).
- **User Story 2 (Phase 4)**: Depends on T004 (the same local check T011 spot-checks
  individually) — can run any time after T004, does not depend on T006–T010's CI-evidence steps.
- **Polish (Phase 5)**: T012 can happen any time after T003. T013 depends on Phase 3's outcome
  (T008/T009) being a genuine pass, not `blocked`.

### Parallel Opportunities

- T009 (Phase 3) and T011 (Phase 4) can both happen once T007's real CI run and T004's local
  check exist, respectively — different concerns, different files, no shared dependency between
  them.
- T012 and T013 (Phase 5, different files) can run in parallel with each other.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2 (T001 — recorded baseline).
2. Complete Phase 3 (T002–T010 — the fix, local verification, real CI evidence, and either a
   confirmed pass or an honest `blocked` status).
3. **STOP and VALIDATE**: At this point, either this feature is genuinely done (real CI evidence
   confirms the fix), or it is `blocked` with the measured numbers and remaining options recorded
   for the human — both are valid, honest outcomes of this phase; a `blocked` result is not a
   failure of this task list, it is FR-006 working as designed.

### Incremental Delivery

1. Phase 2 → Phase 3 (MVP: the fix, empirically proven or honestly blocked).
2. Phase 4 (US2's explicit multi-suite confirmation) alongside or right after Phase 3's T004.
3. Phase 5 (docs/status bookkeeping) once Phase 3's outcome is known either way.

---

## Notes

- [P] tasks = different files, no dependency on an incomplete task.
- [Story] label maps task to specific user story for traceability back to spec.md.
- T006 is the one task in this file that requires explicit, real-time human authorization before
  it can be executed (pushing a branch, opening a PR) — do not treat this plan's recommendation
  of Option (c) as standing permission to do so autonomously.
- T008 is this feature's most important task: it is the point where "does the fix actually work
  on real CI" gets a real, evidence-based answer, and where this feature is explicitly required
  to stop rather than quietly reach for `testTimeout` if the answer is no.
- Every task above states which `spec.md` FR(s)/Acceptance Scenario(s)/SC(s) it serves, per this
  repo's traceability convention (`docs/verification.md` Level 5, adapted here since this
  feature's "tests" are the existing suite plus real CI evidence, not new unit tests of its own).
