# Tasks: Continuous Integration

**Input**: Design documents from `specs/014-continuous-integration/` (`spec.md`, `plan.md`)

**Tests**: This feature has no application code and no `src/`/`app/` files, so `docs/
verification.md`'s Levels 1–2 (unit/component tests) do not apply. Its equivalent of "test
tooling" is the workflow itself, and its equivalent of a Level 3 manual smoke check is watching
that workflow run for real against its own introducing pull request (spec.md FR-009,
plan.md's "Verifying the workflow itself" Research Decision) — captured explicitly as Phase 3
tasks below, not assumed or skipped.

**Organization**: Tasks are grouped by user story from `spec.md`, in priority order (P1 → P2 →
P3). User Story 1 (the workflow exists and checks every PR) is the MVP and the entire reason
this feature exists.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 (PR check, P1), US2 (push-to-main trigger, P2), US3 (branch protection, P3)
- File paths are exact; see `plan.md`'s Project Structure for the full tree

---

## Phase 1: Setup

**Skipped — no new setup needed.** No new runtime dependency, no new test runner, no new
`package.json` script (`plan.md`'s "Does this need a new `package.json` script?" Research
Decision: no). The one prerequisite this feature depends on — `init.sh`'s existing 8-stage
behavior — already exists and is already green locally (`./init.sh --skip-build` returns
`SUCCESS (8/8)` today, per the kickoff brief).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The one shared building block every user story below depends on — `init.sh`'s new
`--skip-install` flag — must exist before the workflow file that calls it can be meaningfully
tested.

**⚠️ CRITICAL**: T002 (the workflow file) depends on T001 being correct; verify T001 locally
before writing/pushing the workflow that relies on it.

- [X] T001 Add a `--skip-install` flag to `init.sh`: extend the existing flag-parsing loop
  (alongside `--skip-doctor`/`--skip-tests`/`--skip-build`/`--skip-native`) with a new
  `SKIP_INSTALL` boolean; in stage 3 ("Installing dependencies"), when `SKIP_INSTALL=true`, call
  `add_result "npm install" "OK" "skipped (--skip-install) — dependencies already installed by
  the caller"` instead of running `npm install`; leave the existing (unflagged) branch's `npm
  install` logic completely unchanged. Update the `--help`/usage output and the script's header
  comment's `Usage:` line to document the new flag. Verify locally: (a) `./init.sh` (no flags)
  still reports `RESULT: SUCCESS (10/10 stages passed)` exactly as it does today — note 10, not
  8: `init.sh` prints 8 numbered stages, but stage 8 records the web/iOS/Android bundle exports as
  three separate results, so a full unflagged run summarizes 10. (`--skip-build` is the run that
  reports 8/8.) Confirms the
  change is additive, not a regression to the default path; (b) `./init.sh --skip-install`, run
  with `node_modules` already present from a prior install, reports stage 3 as `OK` with the
  "skipped" detail and does not invoke `npm install`. *(FR-005, plan.md's "Reconciling
  `init.sh`'s `npm install` stage" Research Decision)*

**Checkpoint**: `init.sh --skip-install` exists and is confirmed correct locally — the workflow
file can now be written to depend on it.

---

## Phase 3: User Story 1 - A contributor's pull request is checked automatically (Priority: P1) 🎯 MVP

**Goal**: Every pull request targeting `main` automatically runs the full `./init.sh` (all 8
stages, no skipped stages) with zero repository secrets, reporting pass/fail as a check on the
PR.

**Independent Test**: Per spec.md — open a PR against `main` with a deliberately broken commit,
confirm the check appears, runs, and fails with the broken stage identifiable from its log; push
a fix and confirm it re-runs and passes.

### Implementation for User Story 1

- [X] T002 [US1] Create `.github/workflows/ci.yml`: `name: CI`; `on.pull_request.branches:
  [main]` (default activity types); `permissions: contents: read` at the workflow level;
  `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`; one job `verify`
  with `runs-on: ubuntu-latest` and `timeout-minutes: 20`; steps: `actions/checkout@v4`, then
  `actions/setup-node@v4` with `node-version-file: '.nvmrc'`, `cache: 'npm'`,
  `cache-dependency-path: package-lock.json`, then a `run: npm ci` step, then a
  `run: ./init.sh --skip-install` step with no other flags. Do not add `on.push` yet — that is
  T004 (User Story 2), kept as its own reviewable task even though it lands in the same file, so
  each story's diff is individually traceable. *(FR-001, FR-003, FR-004, FR-005, FR-006, FR-008,
  FR-010, FR-011, FR-012, FR-013)*
- [X] T003 [US1] Push this feature's branch and open the pull request against `main` that
  introduces T002. Confirm in the PR's checks list: the `CI / verify` check appears and starts
  running; once complete, confirm it reports success, its log shows all 8 of `init.sh`'s stages
  (including all three `expo export --platform ...` bundle checks) having run, and the two
  pre-existing `WARN`-graded issues (expo-doctor, native dependency alignment) are present in the
  log but did not cause the overall conclusion to be failure. Then push one additional,
  deliberately broken commit to the same PR branch (e.g. a trivial, obvious type error) and
  confirm: the previous in-flight/completed run's relevance is superseded and a new run starts
  (concurrency cancellation, if the earlier run was still in progress), the new run fails, and
  its log clearly identifies the broken stage (type-check). Revert that commit and confirm the
  check re-runs and passes again. Record all of these observations — pass case, fail case with
  the stage it correctly identified, and the return to passing — in
  `progress/impl_014-continuous-integration.md`. *(FR-009, spec.md User Story 1's Independent
  Test and Acceptance Scenarios 1–5, SC-001, SC-002, SC-003, SC-004)*
- [X] T004 [US1] While the PR from T003 is open, confirm no GitHub Actions secret exists for the
  repository (Settings → Secrets and variables → Actions) and that the workflow run's log
  contains no reference to `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`/
  `EXPO_PUBLIC_API_URL` having been set from a secret — only `init.sh`'s own
  self-provisioned-from-`.env.example` behavior. Record this confirmation in
  `progress/impl_014-continuous-integration.md`. *(FR-008, SC-006)*

**Checkpoint**: A pull request targeting `main` is now mechanically checked end-to-end, proven
by real evidence (a real pass and a real, correctly-attributed fail) rather than by reading the
YAML alone.

---

## Phase 4: User Story 2 - `main` itself stays verified after every push (Priority: P2)

**Goal**: The identical `verify` job also runs on every push to `main` (merges and direct
pushes), using the same command and same runner — not a second, diverging job.

**Independent Test**: Per spec.md — push a commit directly to `main` (or merge a PR) and confirm
the same workflow runs against that commit, visible in the Actions tab and as a commit status.

### Implementation for User Story 2

- [X] T005 [US2] Extend `.github/workflows/ci.yml` (from T002) to add `on.push.branches:
  [main]`, triggering the exact same `verify` job already defined — no new job, no duplicated or
  diverging steps. *(FR-002, FR-007)*
- [X] T006 [US2] After this feature's PR (T003) merges to `main`, confirm in the repository's
  Actions tab that the `push`-triggered run of `CI / verify` fired against the resulting `main`
  commit and completed (pass or fail, whichever is true of that commit) — record the observed
  run URL/result in `progress/impl_014-continuous-integration.md`. This task can only be
  completed after merge; note it as such rather than marking it done prematurely. *(FR-002,
  spec.md User Story 2's Independent Test and Acceptance Scenario 1)*

**Checkpoint**: Both triggers (`pull_request` and `push` to `main`) are live and independently
confirmed working.

---

## Phase 5: User Story 3 - `main` is actually protected by this check (Priority: P3)

**Goal**: Branch protection on `main` requires the `CI / verify` check to pass before a pull
request can be merged. This is a human-only action — no task in this phase can be completed by
an agent; it is written as an explicit, precisely-named action for a human with repository admin
access to perform, and stays unchecked until they confirm it's done.

**Independent Test**: Per spec.md — after the workflow has run at least once (Phase 3/4), a
maintainer opens `main`'s branch protection settings, confirms `CI / verify` is selectable as a
required status check, enables it, and confirms afterward that a pull request cannot be merged
while the check is failing or still running.

### Human action for User Story 3

- [ ] T007 [US3] **HUMAN ACTION — not completable by an agent.** In the repository's Settings →
  Branches, add or edit a branch protection rule for `main`, enable "Require status checks to
  pass before merging," and select `CI / verify` under "Status checks that are required" (exact
  setting documented in `plan.md`'s Interface Contracts section). Leave this task unchecked in
  this file until a human confirms it has been applied — do not mark it `[X]` on the human's
  behalf, and do not let this feature's other tasks being complete be mistaken for this one also
  being done. *(FR-014, spec.md User Story 3 and Assumptions)*

**T003/T004/T006 OUTCOMES (2026-08-07/08, real evidence):** T003 — the check appeared and ran on
PR #9; a real pass and a real, correctly-attributed FAIL were both observed, and the fail was a
GENUINE pre-existing defect (`LoginScreen.test.tsx` exceeding jest's 5000ms timeout) rather than a
synthetic broken commit, so no deliberate breakage was needed. A green run followed on PR #10 and
then on `main` itself (run 31235303720, `RESULT: SUCCESS (10/10)`). T004 — zero GitHub Actions
secrets and zero variables exist for the repository (`gh secret list` and `gh variable list` both
empty), confirming FR-008/SC-006. T006 — the `push` trigger fired automatically against `main` after
#9 merged (run 31231468258) and again after #10 (run 31235303720), proving FR-002/FR-007.

**T007 REMAINS THE ONLY OPEN ITEM AND IS DELIBERATELY UNCHECKED.** It is a repo setting no agent can
apply. `main` is green now, so enabling it is finally safe — before #10 merged it would have blocked
every merge. `docs/verification.md` states that CI existing is not CI being required until this is
done, so the docs do not overclaim in the meantime.

**Checkpoint**: Once T007 is applied (by a human, out of band), `main` is genuinely protected by
this feature's check — not merely checked.

---

## Phase 6: Polish & Documentation

**Purpose**: Keep the repo's own map of itself accurate now that CI exists, per this repo's
existing convention of updating `AGENTS.md`/`docs/` alongside the feature that changes what they
describe.

- [X] T008 [P] Update `AGENTS.md`'s Repo map table (§2) to add a row for
  `.github/workflows/ci.yml` — what it holds (the `CI` workflow: full `./init.sh` on every PR
  and push to `main`) and when to read it (before changing what "verified" means, or before
  changing `init.sh`'s flags). *(supports spec.md's overall goal of the repo map staying
  accurate — no specific FR, general repo hygiene)*
- [X] T009 [P] Update `docs/verification.md` with a short addition (near the top or in a new
  short section, not rewriting the existing Levels 1–5) noting: CI now runs the full `./init.sh`
  on every pull request and push to `main` (link to `.github/workflows/ci.yml`); the two
  pre-existing `WARN`-graded issues are expected there too and do not fail the build; and branch
  protection requiring this check is tracked as a separate, human-only action
  (`specs/014-continuous-integration/tasks.md` T007) not yet guaranteed to be enabled — so a
  reader doesn't assume "CI exists" automatically means "CI is required," until T007 is actually
  done. *(FR-014, spec.md Assumptions)*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped — no dependency.
- **Foundational (Phase 2)**: No dependency on Setup (skipped) — BLOCKS User Story 1 (T002
  depends on T001 existing and verified).
- **User Story 1 (Phase 3)**: Depends on Phase 2 (T001). T003/T004 depend on T002 (the PR must
  exist and contain the workflow file before its check can be observed).
- **User Story 2 (Phase 4)**: Depends on T002 existing (extends the same file) — can be authored
  together with or immediately after Phase 3's T002, but T006 specifically depends on T003's PR
  having merged to `main` first.
- **User Story 3 (Phase 5)**: Depends on Phase 3 and Phase 4 having actually run at least once
  (GitHub can only offer `CI / verify` as a required-check option after it has appeared) — in
  practice, after this feature's own PR has merged and the `push` trigger has fired at least
  once (T006).
- **Polish (Phase 6)**: Can happen any time after Phase 3 (T008/T009 describe the shipped
  workflow, so should follow T002 at minimum); independent of Phase 4/5's completion.

### Parallel Opportunities

- T008 and T009 (Phase 6, different files) can run in parallel with each other, and either can
  be done alongside Phase 4/5 once Phase 3 is complete.
- T002 and T005 touch the same file (`.github/workflows/ci.yml`) sequentially, not in parallel —
  T005 is written as a small addition on top of T002, not a separate parallel edit.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2 (T001 — `init.sh --skip-install`, verified locally).
2. Complete Phase 3 (T002–T004 — the workflow file, opened as this feature's own PR, proven to
   both pass and correctly fail).
3. **STOP and VALIDATE**: At this point, every future pull request against `main` is
   automatically checked — the entire reason this feature exists is already delivered.

### Incremental Delivery

1. Phase 2 → Phase 3 (MVP: PRs are checked).
2. Add Phase 4 (push-to-`main` trigger, same file, small addition) → merge → confirm the `push`
   run fires.
3. Add Phase 6 (docs) alongside or right after Phase 4.
4. Phase 5 (T007) happens out-of-band, by a human, whenever they're ready — it does not block
   this feature's other phases from being considered complete on the agent side, but the feature
   as a whole is not fully realized (branch protection not yet enforcing anything) until it's
   done. Reflect this honestly in `feature_list.json`'s notes rather than implying branch
   protection is already active.

---

## Notes

- [P] tasks = different files, no dependency on an incomplete task.
- [Story] label maps task to specific user story for traceability back to spec.md.
- T007 is intentionally the only task in this file that cannot be checked off by an agent —
  leave it `[ ]` regardless of how much of the rest of this feature is done.
- Every task above states which `spec.md` FR(s)/Acceptance Scenario(s)/SC(s) it serves, per this
  repo's traceability convention (`docs/verification.md` Level 5, adapted here since this
  feature has no test suite of its own to carry that traceability instead).
