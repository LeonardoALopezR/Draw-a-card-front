# Current session

**Started**: 2026-08-07
**Feature**: 014-continuous-integration
**State**: in_progress on branch `014-continuous-integration` (cut from main @ 96553ab)

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

## Next step

**Agent-side work on 014 is complete: 5 of 9 tasks done, each independently APPROVED.** Status
stays `in_progress` — NOT `done` — because the four remaining tasks all need the human and none
can be completed by an agent:

1. **T003** — commit 014's files, push the branch, open the PR against `main`, then observe on that
   PR: a real pass; a real fail from a deliberately broken commit, with the log correctly naming
   the broken stage; and a return to passing after reverting. This is the workflow's first real
   execution (FR-009). Requires explicit human authorization to push/open a PR.
2. **T004** — while that PR is open, confirm zero GitHub Actions secrets exist for the repo.
3. **T006** — after the PR merges, confirm the `push`-triggered run fired against the new `main`
   commit.
4. **T007** — HUMAN-ONLY: Settings → Branches → require status checks → select `CI / verify`.

When committing, stage 014's files explicitly — the tree also holds `specs/012-home-visual-alignment/`
and the 011/012/013 registrations in `feature_list.json`. Never `git add -A` on this branch.

Also still parked: **012-home-visual-alignment** remains `spec_ready` at its own approval gate,
untouched by this session.
