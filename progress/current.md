# Current session

**Started**: 2026-08-07
**Feature**: 014-continuous-integration
**State**: 014 MERGED (PR #9, commit `0589e03`) but still `blocked` on a green run. 015 `blocked`
per FR-006 — its fix is pushed (PR #10) and is a real win, but CI proved it does not clear the
timeout, and the two candidate remedies have now been empirically eliminated. Needs a human decision.

## What happened this session

- Bootstrap: `./init.sh --skip-build` RESULT: SUCCESS (8/8 stages). Only the two pre-existing
  non-blocking warnings the 014 notes already predicted: expo-doctor outdated dependencies, and
  native dependency alignment (expo-image-picker, react-native, react-native-safe-area-context,
  @types/react, typescript). Type-check clean, full jest suite green.
- Confirmed the starting facts in 014's notes still hold: `.github/` does not exist (no CI at
  all), `.nvmrc` reads exactly `20`, and `package.json` has no verification scripts beyond
  `"test": "jest"` (so `./init.sh` really is the only definition of "verified" in the repo).
- The human chose 014 over the parked 012. **012-home-visual-alignment is still `spec_ready`,
  untouched, waiting at the human-approval gate** — its spec dir is untracked on the
  `010-registration-redesign` branch. Nothing is `in_progress`, so starting 014's spec phase
  does not violate one-feature-at-a-time, but only one of 012/014 can go `in_progress` later.
- Asked the human the three decisions 014's notes deliberately left open, and recorded the
  answers into that feature's `notes` as SETTLED AT KICKOFF: (1) full `./init.sh` on every PR
  including all three bundle exports, no `--skip-build`, single job/single command, exports NOT
  split into parallel jobs; (2) branch protection in scope as documentation plus a task that
  stays unchecked until the human applies it in the GitHub UI; (3) npm caching via
  `actions/setup-node`'s `cache: 'npm'` keyed on `package-lock.json`, `~/.npm` only.
- Dispatched `spec-writer` for 014-continuous-integration. It wrote
  `specs/014-continuous-integration/` (spec.md, plan.md, tasks.md, checklists/requirements.md),
  found zero blocking `[NEEDS CLARIFICATION]` markers, and flipped feature_list.json status to
  `spec_ready` itself. 3 user stories (P1 PR check, P2 push-to-main trigger, P3 branch
  protection), 15 FRs, 6 success criteria, 9 tasks (T001-T009), 0 new runtime dependencies, 0
  files under `app/` or `src/`.
- Notable design decision spec-writer made that was NOT in the kickoff brief and is worth the
  human's attention: a new `--skip-install` flag on `init.sh` (T001). Rationale — the workflow
  runs `npm ci` in its own step so `actions/setup-node`'s cache actually applies, but `init.sh`
  stage 3 would then run `npm install` a second time and could rewrite the lockfile-derived tree.
  `--skip-install` makes stage 3 report OK/skipped instead. The default (unflagged) path is
  untouched, so local runs behave exactly as today.

- **Human approved at the gate** ('approved, start T001'). Flipped 014 to `in_progress`, set its
  `branch` field, and ran the `feature-branch` skill.
- **CORRECTION to a stale fact repeated in 012's and 014's notes**: they say 010-registration-redesign
  is unmerged with no open PR. It has since been merged — `origin/main` carries
  `96553ab Merge pull request #7 from LeonardoALopezR/010-registration-redesign`, and
  `git diff origin/main..010-registration-redesign` is empty. Local `main` was simply 2 commits
  stale. Anyone reading those notes should not act on the "unmerged" claim.
- Branch cut: stashed the mixed working tree with `-u`, fast-forwarded `main`
  `98c0b45 -> 96553ab`, cut `014-continuous-integration` from it, popped the stash with **zero
  conflicts** (the stash's base blob was identical to `origin/main`'s, so nothing three-way-merged).
  `./init.sh --skip-build` on the fresh branch: `RESULT: SUCCESS (8/8)`, same two pre-existing WARNs.
- **Working-tree hygiene note for whoever commits on this branch**: the tree also carries work
  belonging to OTHER features that must NOT be swept into a 014 commit — `specs/012-home-visual-alignment/`
  (untracked) and the `feature_list.json` registrations for 011/012/013. Stage 014's own files
  explicitly; never `git add -A` on this branch.

- **T001 done and APPROVED.** `task-implementer` added the additive `--skip-install` flag to
  `init.sh` (report: `progress/impl_014-continuous-integration.md`); `code-reviewer` independently
  re-ran both acceptance checks and APPROVED (verdict:
  `progress/review_014-continuous-integration.md`). Orchestrator also verified independently that
  `--skip-install` reports stage 3 OK/skipped and produces no npm-install log, and that the diff
  touches `init.sh` only with the default path reachable unchanged via `elif`.
- Two non-blocking review nits. Fixed one: the acceptance prose claimed a full unflagged
  `./init.sh` reports `SUCCESS (8/8)` — it actually reports **10/10**, because `init.sh` prints 8
  numbered stages but stage 8 records web/iOS/Android exports as three separate results. Corrected
  in `tasks.md` T001 and `plan.md`'s validation list. The `--skip-build` = 8/8 claims elsewhere are
  correct and were left alone. Not fixed (deliberately, reviewer called it optional per
  `docs/conventions.md`'s default-to-no-comments policy): an inline comment in `init.sh` explaining
  why `--skip-install` grades `OK` while the other four skip flags grade `WARN`.

- **T002 done and APPROVED**: `.github/workflows/ci.yml` created. `code-reviewer` walked each
  `init.sh` stage as it would run on `ubuntu-latest`, audited the dependency tree for
  Linux-hostile native binaries, and confirmed the exit-code plumbing cannot produce a false
  green. Orchestrator independently confirmed `init.sh` is mode `100755` in git's index (a
  `100644` would have failed on the runner with a permission error), and that `.env.example` is
  tracked while `.env` is gitignored — so a fresh CI clone self-provisions at stage 2 with no
  secrets, exactly as the kickoff brief claimed.
- **T005 + T008 + T009 done and APPROVED** (final agent-completable increment): `on.push.branches:
  [main]` added to the same `verify` job; `AGENTS.md` repo-map row; `docs/verification.md` `## CI`
  section that explicitly warns "CI exists" ≠ "CI is required" until T007 is done. The
  `concurrency` group was deliberately left as `ci-${{ github.ref }}` — `pull_request` yields
  `refs/pull/N/merge` and `push` yields `refs/heads/main`, so the two triggers cannot collide;
  reviewer confirmed the reasoning and that cancelling a superseded push-to-`main` run is the
  spec's own already-approved intent (FR-012), not a gap introduced here.
- **Closing gate: full unflagged `./init.sh` → `RESULT: SUCCESS (10/10 stages passed)`**, all three
  bundle exports green, in **18.6 seconds** wall-clock with a warm cache. This makes the kickoff
  brief's 8-15 minute estimate look pessimistic by a wide margin — `timeout-minutes: 20` has very
  large headroom. Recorded in 014's notes as a data point for anyone revisiting the timeout.
- Registered a separate follow-up task (not absorbed into this feature, per its own constitutional
  note) for the reviewer's out-of-scope finding: `init.sh` stage 7's test-script existence check
  parses `npm run` output, so npm prints a stray `npm error ... debug-0.log` line even on passing
  runs — harmless locally, actively misleading in a CI log, mildly against SC-004.

## Open questions / blockers

- No blocker in the code. The three scope questions were settled at kickoff.
- **The one honest gap**: the workflow has been verified by static review, YAML inspection, a
  Linux-hostile-native-binary audit of the dependency tree, exit-code plumbing analysis, and real
  local `./init.sh` runs — but it has **never actually executed on a GitHub runner**, because its
  first possible execution is its own introducing PR (FR-009). Both reviewers disclosed this
  explicitly rather than implying more confidence than the evidence supports. T003/T004 are what
  close it, and they need the human to authorize a push and a PR.

- **Committed, pushed, opened PR #9** at the human's explicit instruction. Two commits kept
  separate: `e309d45` (the workflow + `init.sh --skip-install` + docs) and `4e2ee8c` (bookkeeping:
  014's ledger entry, the 011/012/013 registrations, and 012's spec docs so the `spec_dir` the
  ledger points at exists on `main`). `jest.config.js` was deliberately EXCLUDED — it carries the
  sibling session's `modulePathIgnorePatterns` worktree fix, which is not 014's work and which CI
  does not need (no worktrees on a runner).
- **THE WORKFLOW WORKS, and it caught a real bug within minutes of existing.** Confirmed on the
  real runner, twice: check appears on the PR, all 10 stages run, both pre-existing warnings graded
  WARN without failing the build (SC-003 proven on real evidence), all three bundles exported on
  `ubuntu-latest` with no macOS runner and no Xcode/Android SDK, `.env` self-provisioned with zero
  secrets, total 2m30s against a 20-minute timeout.
- **The fail case was proven by a genuine bug, so no synthetic broken commit was needed.**
  `LoginScreen.test.tsx`'s first test throws `Exceeded timeout of 5000 ms for a test` on the runner
  while passing 630/630 locally. Could not be reproduced locally under `CI=true`, `TZ=UTC`, in
  isolation, or with `--maxWorkers=2`.
- **Diagnosis is more systemic than "one slow test"**, per measured per-test durations: the failing
  test is 311ms locally (>16x blowup in CI), while two tests that are SLOWER locally (449ms, 409ms)
  passed. The rest of its suite ran only ~5.5x slower. The distinguishing property is being the
  FIRST test in a heavy suite, absorbing one-time module-load/first-render cost against jest's 5s
  per-test clock. `CrearCuentaScreen.test.tsx` (11.98s in CI) is the likely next victim. Verified
  there is no jest setup file, no `@expo/vector-icons` mock, and no `testTimeout` anywhere.
- **Fixed one gap inside 014 — a strengthening, not the warned-against weakening**: `init.sh` tails
  only 5 log lines and writes full output to `/tmp`, which is unusable on a runner whose filesystem
  vanishes at job end. Added a failure-only workflow step dumping every `/tmp/init-sh-front-*.log`
  in `::group::` blocks. That step is what produced the diagnosis above, and it is what SC-004
  actually requires. `init.sh` itself was not touched; local behavior unchanged.
- Registered **015-ci-test-timeout** (`pending`) with the full verified findings, and set 014 to
  `blocked` with a `blocked_reason` naming the exact unblock sequence. Per the human's decision the
  fix ships in its own PR, merged before #9, targeting the `act()` cause rather than raising
  `testTimeout` — but 015's notes flag that the measurement gathered *after* that decision suggests
  an `act()` fix alone may not suffice, and say to put the remaining options back to the human
  rather than quietly adding a `testTimeout`.

- **015-ci-test-timeout spec/plan/tasks written** (`specs/015-ci-test-timeout/`), status flipped
  to `spec_ready`. Zero `[NEEDS CLARIFICATION]` markers — re-verified the kickoff findings live
  rather than trusting them (confirmed 630/630 local, no jest setup file, no `testTimeout`,
  `@expo/vector-icons` unmocked) and found one thing the kickoff brief didn't have: the
  `act()` warnings are real and repo-wide but do NOT occur inside `LoginScreen.test.tsx`'s own
  suite (its import tree has no `@expo/vector-icons` import) — so the causal link to that suite's
  specific timeout is indirect at best, reinforcing why the spec requires empirical CI proof
  rather than trusting the `act()` fix on reasoning alone. **The hard planning problem (how 015's
  own PR gets a real CI check before 014 has merged `.github/workflows/ci.yml` to `main`) is
  resolved in `plan.md`: recommends Option (c)** — cut 015 cleanly from `main`, gather real
  `ubuntu-latest` evidence via a disposable throwaway branch/PR that cherry-picks 014's two
  workflow commits, record the measured numbers, then close it unmerged — preserves both "real
  evidence" and the human's settled "015 merges before 014" order. Does NOT recommend (d)
  (merging 014 first); that's named as a fallback-only question for the human if (c) is declined,
  not assumed. Fix mechanism: a new `jest.setup.ts` mocking `expo-font`'s `isLoaded()` to always
  return `true` (read `@expo/vector-icons`' source directly — this short-circuits the async
  `setState` for every icon family with one small mock). `tasks.md`'s T008 is the load-bearing
  task: evaluate the real CI-measured duration against a 3000ms margin and **stop/escalate to the
  human, not add `testTimeout`**, if it isn't met (FR-006) — also measures
  `CrearCuentaScreen.test.tsx` (FR-007/SC-004) since the kickoff brief names it as the likely next
  victim. **Awaiting human approval at the `spec_ready` gate** — should specifically confirm the
  Option (c) throwaway-PR recommendation, since executing it needs real-time authorization
  regardless of this plan's recommendation.

- **Dispatched `spec-writer` for 015-ci-test-timeout** → `spec_ready`, zero
  `[NEEDS CLARIFICATION]` markers. `specs/015-ci-test-timeout/` (spec.md 328 lines, plan.md 317,
  tasks.md 241 + checklist): 8 FRs, 2 user stories, 13 tasks.
  - **Fix approach (T002/T003)**: a new root `jest.setup.ts` mocking `expo-font`'s `isLoaded` so
    `@expo/vector-icons` renders synchronously instead of `setState`-ing after an await, wired in
    via `jest.config.js`'s `setupFiles`. Central and repo-wide (FR-004), not a per-test patch.
  - **FR-006 encodes the escape hatch I asked for**: if real CI evidence shows the first test still
    exceeds the threshold, the feature goes back to the human rather than quietly adding a
    `testTimeout`. No `testTimeout` fallback is pre-authorized.
  - **FR-007** requires checking `CrearCuentaScreen.test.tsx` (the named next-victim suite) too, so
    the systemic risk is addressed rather than just this one test.
  - **CI-evidence mechanism: chose Option (c)** — a short-lived throwaway branch/PR that
    cherry-picks 014's workflow onto the fix purely to obtain a real `ubuntu-latest` run, then is
    closed unmerged and deleted, with the measured numbers copied into
    `progress/impl_015-ci-test-timeout.md` first so the evidence survives the branch. This keeps
    015's own diff clean AND preserves the human's settled merge order (015 before 014's #9).
    Options (a) and (b) were rejected (collapses the two features; requires history rewriting the
    `feature-branch` skill forbids). Option (d) — merge #9 first despite its red check — is
    correctly recorded as the fallback to ASK the human about, not to assume.
  - T006 (push + open throwaway PR) and T010 (close it) are explicitly marked as requiring human
    authorization at the time.

## Next step

**Round 3 shipped. Both PRs pushed; awaiting a cache-HIT measurement, then merge decisions.**

[PR #9](https://github.com/LeonardoALopezR/Draw-a-card-front/pull/9) merged (014's workflow is on
`main`). [PR #10](https://github.com/LeonardoALopezR/Draw-a-card-front/pull/10) is **green**.

### The three-round root-cause hunt, so nobody re-derives it

| Round | Hypothesis | Verdict |
|---|---|---|
| 1 | `@expo/vector-icons` async font load (`act()` warnings) | Real win (44 warnings → 0, −16% local) but **did not fix the timeout** (311→308ms) |
| 2 | jest worker oversubscription / CPU starvation | Real contributor (69ms @ 1 worker vs 308ms @ 13). `--runInBand` kept — but only got CI to 3885ms of 5000ms |
| 3 | **Cold jest transform cache** | **Dominant term.** Warm 147ms → `--clearCache` 1666ms (11x) → warm 146ms |

Eliminated by measurement, do not retry: module warming in a setup file (fails from `setupFiles`;
from `setupFilesAfterEnv` it doubles total test time and slows the target test), and a canary test
(imports evaluate at module load, outside any test's clock).

### Measured on real runners

| | value |
|---|---|
| Target test, CI cache MISS | **3999ms** (run 31234302973) — passes under the CI-only 15000ms ceiling |
| Target test, CI before Round 3 | 3885ms of a 5000ms limit — 22% headroom, SC-001 failed |
| `CrearCuentaScreen` first test | 1019ms |
| Suite total | 630/630, 85 suites, 28.9s |
| Job wall | 140–158s against a 20-minute timeout |

**A lesson worth keeping**: suite-level timing hid this. From `LoginScreen`'s 6.759s suite total the
orchestrator inferred the test was ~600ms; it was 3885ms — wrong by ~6x. Switching the workflow's
log dump to `if: always()` and adding `--verbose` to CI's jest call is what made it visible.

### Human sign-off on record

The `--testTimeout` is a documented, explicitly human-authorized exception to this feature's own
FR-006 (2026-08-07: the human chose (a) cache + (c) scoped timeout), NOT a bypass. It is scoped to
CI only — `jest.config.js` deliberately keeps jest's strict 5000ms default so a genuinely slow test
still fails fast in development.

### Resolved since

- **Cache HIT run obtained and measured** (run 31234419308): target test **311ms** warm vs **3999ms**
  on a miss (12.9x), `CrearCuentaScreen` first test 127ms vs 1019ms, jest total 16.26s vs 28.917s,
  630/630, `SUCCESS (10/10)`, job wall 134s. The cache step logged a miss then restored — it genuinely
  persists. **SC-001 is met at 311ms, under even the original 3000ms bar**; cold-miss runs carry 73%
  headroom under the 15000ms ceiling (vs 22% under 5000ms before).
- **Round 3 re-reviewed.** `code-reviewer` verified the mechanism independently — including pulling
  the GitHub Actions logs itself rather than trusting quoted numbers — and found the transform-cache
  key safe against false greens (jest keys cached entries by source content plus resolved transform
  options, so a `restore-keys` partial match is only a warm start, never blind trust), the
  `--testTimeout` correctly CI-scoped, and every hard constraint intact. It returned
  CHANGES_REQUESTED purely on traceability closure, all of which is now done: `spec.md`/`plan.md`
  carry a Round 3 Amendment (including a new FR-010 documenting the CI/local sensitivity asymmetry
  the reviewer wanted written down), `tasks.md`'s checkbox/prose mismatches are reconciled with
  outcome blocks (**0 unchecked tasks remain**), the real MISS/HIT numbers are appended to
  `progress/impl_015-ci-test-timeout.md`, `docs/verification.md` is updated (T012), and
  `feature_list.json` is committed rather than left uncommitted.

### Outstanding

1. **Merge decisions (human)**: whether to merge PR #10, and 014's remaining T007.
4. **T007 — HUMAN-ONLY branch protection.** Now much safer to enable than before: the check is
   green and the margin is no longer 22%. Still the human's action; an agent cannot do it.
5. 014's `tasks.md` boxes for T003/T004/T006 are satisfied in substance (green run observed; zero
   Actions secrets and variables confirmed via `gh secret list`/`gh variable list`; push-triggered
   run 31231468258 fired against `main`) but left unchecked to avoid a cross-feature edit from
   015's branch. Check them during 014's wrap-up.

Also still parked: **012-home-visual-alignment**, `spec_ready` at its own approval gate.
