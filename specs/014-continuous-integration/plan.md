# Implementation Plan: Continuous Integration

**Branch**: `014-continuous-integration` | **Date**: 2026-08-07 | **Spec**: `specs/014-continuous-integration/spec.md`

**Input**: Feature specification from `specs/014-continuous-integration/spec.md`

**Note**: Like `005-login`, this folds Phase 0 (research) and Phase 1 (data model / contracts /
quickstart) into this single file rather than separate `research.md`/`data-model.md`/
`contracts/`/`quickstart.md` documents — this feature has no persisted entity (spec.md's Key
Entities is explicitly N/A) and its one "interface contract" is the GitHub Actions workflow
file's own trigger/job shape, short enough to document inline below rather than in its own
`contracts/` directory.

## Summary

Add `.github/workflows/ci.yml`, a single workflow named `CI` with one job (`verify`) that
triggers on `pull_request` (targeting `main`) and `push` (to `main`), checks out the repo, pins
Node from `.nvmrc` via `actions/setup-node`'s `node-version-file` input with `cache: 'npm'`
keyed on `package-lock.json`, runs `npm ci`, and then runs `./init.sh --skip-install` — the
project's existing, full 8-stage verification script, unmodified in behavior except for one new
flag that lets it skip its own redundant install step since the workflow already ran `npm ci`.
No flags skip any of `init.sh`'s other stages on either trigger — one job, one command, for
both. `init.sh` gains that one new `--skip-install` flag (additive, backward compatible — a
developer's local unflagged `./init.sh` run is byte-for-byte unchanged). No application code
under `app/` or `src/` is touched.

## Technical Context

**Language/Version**: The workflow's own logic is YAML (GitHub Actions workflow syntax); the
one script change (`init.sh`) is bash, matching the existing script's own "written for bash 3.2"
constraint noted in its header. Node 20 (per `.nvmrc`) is what's pinned for the app's own
tooling — unchanged from every other feature in this repo.

**Primary Dependencies**: `actions/checkout@v4`, `actions/setup-node@v4` (both first-party
GitHub Actions, no third-party marketplace action needed for anything this workflow does — no
new dependency to vet or pin-by-SHA beyond GitHub's own actions). No new npm package.

**Storage**: N/A.

**Testing**: This feature's own "test" is the workflow running against its own introducing pull
request (spec.md FR-009) — there is no unit-test framework for a GitHub Actions workflow file
itself in this repo, and installing one (e.g. `act`, a local GitHub-Actions-in-Docker runner)
would be new tooling this feature doesn't need: the workflow's only job is "run `./init.sh`,"
which is already independently verifiable by running that script directly, and the workflow
*shape* (triggers, permissions, timeout, concurrency, caching) is small enough to review by
reading the YAML plus watching it execute for real on GitHub.

**Target Platform**: `ubuntu-latest` GitHub-hosted runner (see spec.md Clarifications for why —
no native compile happens in CI, only bundling, so no macOS runner is needed despite the app
itself targeting iOS/Android/web).

**Project Type**: Single Expo (React Native) app, unchanged — this feature adds only repo
tooling (`.github/workflows/`) and one additive flag to `init.sh`.

**Performance Goals**: Full run completes within the 20-minute job timeout (spec.md FR-011);
kickoff brief estimates 8–15 minutes for the full `./init.sh` run including all three `expo
export` stages — no numeric target tighter than that is set, since the entire point of this
feature is correctness-gating, not build speed.

**Constraints**: Zero repository secrets (FR-008). `npm ci`, never `npm install`, as the actual
install mechanism (FR-004). No parallel per-platform export jobs (FR-006 — explicitly declined
at kickoff). One job definition shared by both triggers (FR-007) — not two workflow files, not
two jobs with diverging steps.

**Scale/Scope**: One new file (`.github/workflows/ci.yml`, ~40–60 lines of YAML). One additive
flag in `init.sh` (~10 lines touching stage 3's conditional and the `--help`/usage text). No
new `package.json` script is strictly required — see Research Decisions "Does this need a new
`package.json` script?" below for why none is added.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. One Codebase, Three Targets | Workflow verifies the same one codebase on all three targets via the same `expo export` stages `init.sh` already runs locally — no new per-platform divergence introduced. | PASS |
| II. Backend Is the Source of Truth | No backend call of any kind — this feature has no `Draw-a-card` backend counterpart (spec.md "Related backend spec": None) and CI runs with zero live services (spec.md Assumptions). | PASS |
| III. Auth Goes Through the Provider SDK, Not the Backend | Not applicable — no auth code touched. Zero Supabase credentials in CI (FR-008), by design (placeholder-host fallback already exists for exactly this reason). | PASS |
| IV. Business Logic Stays Portable | Not applicable — no business logic, UI, or domain code added. The one code change (`init.sh`'s new flag) is repo tooling, not application logic, and lives in the one script that already owns "what counts as verified" for this repo. | PASS |
| V. Screen/Component Structure Mirrors Product Domains | Not applicable — no screen or component added. | PASS |
| VI. Spec Before Code, One Spec Per Feature | This one `spec.md`; no platform-specific spec needed since "platform notes" here just is which runner OS to use, captured inline in spec.md Clarifications rather than as a separate document. | PASS |
| VII. Accessible and Responsive by Default | Not applicable — no UI. | PASS |
| VIII. Local-First Development | Directly reinforced, not just respected: this feature's whole point is that CI runs the identical `./init.sh` a developer already runs locally with no live backend — nothing new to develop against. | PASS |

No violations requiring a Complexity Tracking entry.

## Research Decisions

### Reuse `./init.sh` as the one verification command, rather than hand-writing workflow steps

- **Decision**: The workflow's only substantive step (beyond checkout/Node setup/`npm ci`) is
  `./init.sh --skip-install`. It does not re-list `init.sh`'s 8 stages as separate workflow
  steps.
- **Rationale**: `init.sh` already *is* this project's definition of "verified" (its own header
  comment, `docs/verification.md`, and AGENTS.md all point to it as the one command). A workflow
  that re-implements those stages as individual `run:` steps would inevitably drift from what a
  developer runs locally — exactly the failure mode the kickoff brief calls out explicitly
  ("A workflow that re-lists those stages by hand will drift from the script developers run
  locally, which defeats the point"). Keeping it to one script invocation also means any future
  change to what "verified" means (a new stage, a changed flag) only has to be made in one
  place.
- **Alternatives considered**: Splitting `init.sh`'s stages into separate workflow steps (one
  `run:` per stage) for prettier per-stage annotations in the GitHub Actions UI — rejected: it
  would require either duplicating each stage's shell logic into the workflow file (drift risk)
  or refactoring `init.sh` into stage-callable subcommands (a much larger, riskier change to a
  script every developer already depends on, for a cosmetic UI benefit not requested by the
  kickoff brief). `init.sh`'s own `add_result`/summary output already names the specific stage
  that failed (spec.md SC-004), which is sufficient.

### Reconciling `init.sh`'s `npm install` stage with the FR-004 `npm ci`-only constraint

- **Decision**: Add a new `--skip-install` flag to `init.sh`. When set, stage 3 ("Installing
  dependencies") is marked `OK` with the detail `"skipped (--skip-install) — dependencies
  already installed by the caller"`, instead of running `npm install`. The workflow runs `npm
  ci` itself (a separate, explicit step, before invoking `init.sh`) and then calls `./init.sh
  --skip-install`. A developer's local, unflagged `./init.sh` run is completely unaffected —
  stage 3 still runs `npm install` exactly as it does today.
- **Rationale**: The kickoff brief states two things that would otherwise conflict: "REUSE
  ./init.sh RATHER THAN RE-IMPLEMENTING ITS STAGES" and, separately, "Install with `npm ci`
  against the committed `package-lock.json`. Never `npm install`." `init.sh`'s stage 3 hardcodes
  `npm install`. The `--skip-install` flag resolves this without weakening either constraint:
  the workflow's actual, CI-enforced install step genuinely is `npm ci` (so a lockfile that
  can't reproduce the exact tree fails loudly, per FR-004's intent), while every other stage of
  `init.sh` still runs completely unmodified and in the same order for both CI and local use —
  reuse is preserved for 7 of 8 stages, and stage 3 itself still exists and still reports a
  result, it just doesn't redundantly re-run an install that already happened.
- **Alternatives considered**: (a) Let the workflow run `npm ci` and then let `init.sh`'s stage
  3 run `npm install` again afterward, unmodified — rejected: it's not wrong exactly (a second
  `npm install` against an already-lockfile-consistent `node_modules` is a no-op in practice),
  but it means the *literal* install step CI depends on for "did this pass" is ultimately
  whatever `npm install` decides to do, not `npm ci`'s stricter contract, which doesn't actually
  satisfy the spirit of FR-004 even if it's harmless in practice. (b) Have the workflow set an
  environment variable (`INIT_SH_SKIP_INSTALL=1`) instead of a CLI flag — rejected only for
  consistency: `init.sh` already has four CLI flags (`--skip-doctor`/`--skip-tests`/
  `--skip-build`/`--skip-native`) and no precedent for env-var-driven behavior; a fifth flag
  matches the existing pattern exactly and needs no new documentation convention.

### Does this need a new `package.json` script?

- **Decision**: No. The workflow calls `./init.sh --skip-install` directly, exactly like a
  developer would call `./init.sh` directly — `AGENTS.md` and `docs/verification.md` both
  already document `./init.sh` as the canonical entry point, not an npm script wrapping it.
- **Rationale**: Adding e.g. `"ci": "./init.sh --skip-install"` to `package.json`'s `scripts`
  would be one more place the exact invocation could drift from what the workflow actually runs
  (the workflow would need to stay in sync with whatever that script says, rather than being the
  literal source of truth itself). Calling the script directly is simpler and matches how
  `init.sh` is invoked everywhere else in this repo (the `.claude/settings.json` Stop hook calls
  it directly too, not via an npm script).
- **Alternatives considered**: A `"verify"` npm script — rejected for the same reason; would add
  a layer of indirection with no benefit, since nothing in this repo currently expects
  verification to be reachable via `npm run <x>`.

### npm dependency caching

- **Decision**: `actions/setup-node@v4`'s built-in `cache: 'npm'` input, with
  `cache-dependency-path: package-lock.json` (the default when a root-level lockfile exists, but
  stated explicitly in the workflow for clarity). This caches `~/.npm` (npm's download cache),
  never `node_modules`.
- **Rationale**: Already settled at kickoff (spec.md FR-010, `feature_list.json`'s "SETTLED AT
  KICKOFF" item 3). Caching only the download cache — not the installed tree — means `npm ci`
  still always produces a verified-fresh `node_modules` from the lockfile on every run; a cache
  hit only saves re-downloading packages already fetched by a previous run keyed on the same
  `package-lock.json` hash, it never substitutes for actually running `npm ci`.
- **Alternatives considered**: Caching `node_modules` directly, keyed on the lockfile hash —
  explicitly rejected at kickoff ("Cache ~/.npm only, never node_modules, so npm ci stays
  honest"), since restoring a cached `node_modules` instead of running `npm ci` against it would
  mean a workflow run could pass using packages that no longer match a since-edited
  `package-lock.json`, undermining FR-004's entire point.

### Verifying the workflow itself before it can be trusted

- **Decision**: This feature's own introducing pull request is treated as the workflow's first
  real test (spec.md FR-009). `tasks.md` includes an explicit task to (a) open the PR, confirm
  the `CI` check appears and runs to completion successfully, then (b) push one additional,
  deliberately broken commit (e.g. a trivial type error) to the same PR branch, confirm the
  check goes red and clearly names the broken stage, then (c) revert that commit and confirm the
  check goes green again — recording all three observations in
  `progress/impl_014-continuous-integration.md` before this feature can be considered verified,
  per `docs/verification.md`'s "an agent doesn't say 'this works,' it demonstrates it."
- **Rationale**: GitHub evaluates a `pull_request`-triggered workflow using the workflow file's
  contents on the PR's own head branch for a same-repository PR (not the version on the base
  branch) — so a workflow file added in a PR genuinely does run against that same PR, this is
  standard, well-documented GitHub Actions behavior, not a chicken-and-egg problem that needs a
  separate bootstrapping PR. Demonstrating both a pass and a fail (not just a pass) is what
  proves the check can actually catch something, addressing spec.md SC-002's "zero false
  successes" claim with real evidence rather than an assumption.
- **Alternatives considered**: Merging the workflow file first with no PR-trigger verification,
  trusting the YAML alone — rejected, directly contradicts this repo's verification philosophy
  (`docs/verification.md`'s golden rule) and the explicit kickoff instruction to "address how the
  workflow itself gets verified before merge."

### Job permissions

- **Decision**: `permissions: contents: read` at the workflow level (the default `GITHUB_TOKEN`
  permission set is broader; this narrows it explicitly).
- **Rationale**: The job only checks out code and runs local verification — it never pushes a
  commit, comments on a PR, or touches any other GitHub API surface, so it needs no write
  permission of any kind. Explicit narrowing is a small, free hardening step and self-documents
  the job's actual footprint for a future reader.
- **Alternatives considered**: Leaving permissions at the (broader) default — rejected, no
  functional difference today, but an unnecessary standing permission with no corresponding
  need.

## Project Structure

### Documentation (this feature)

```text
specs/014-continuous-integration/
├── spec.md                 # Feature spec — zero [NEEDS CLARIFICATION] markers
├── plan.md                 # This file — includes research decisions inline
├── tasks.md                # Phase 2 output (/speckit-tasks)
└── checklists/
    └── requirements.md     # Spec quality checklist
```

No separate `research.md`, `data-model.md`, `contracts/`, or `quickstart.md` — see the note at
the top of this file.

### Source Code (repository root)

```text
.github/
└── workflows/
    └── ci.yml                     # NEW — the entire feature's functional deliverable.
                                    # name: CI
                                    # on: pull_request (branches: [main]), push (branches: [main])
                                    # concurrency: group: ci-${{ github.ref }}, cancel-in-progress: true
                                    # permissions: contents: read
                                    # jobs.verify:
                                    #   runs-on: ubuntu-latest
                                    #   timeout-minutes: 20
                                    #   steps:
                                    #     - actions/checkout@v4
                                    #     - actions/setup-node@v4
                                    #         with: node-version-file: '.nvmrc', cache: 'npm',
                                    #               cache-dependency-path: package-lock.json
                                    #     - run: npm ci
                                    #     - run: ./init.sh --skip-install
                                    #         (no other flags — full run, both triggers)

init.sh                            # MODIFIED — additive only:
                                    #  - new --skip-install flag, parsed alongside the existing
                                    #    four flags
                                    #  - stage 3 ("Installing dependencies") branches: if
                                    #    SKIP_INSTALL, add_result "npm install" "OK" "skipped
                                    #    (--skip-install) — dependencies already installed by the
                                    #    caller"; else unchanged existing `npm install` logic
                                    #  - --help/usage text gains the new flag
                                    #  - header comment's Usage line updated
                                    # Every other stage (1,2,4,5,6,7,8) byte-for-byte unchanged.
                                    # A developer's local, unflagged ./init.sh run behaves
                                    # identically to before this feature.

AGENTS.md                          # MODIFIED — Repo map table gains a row for
                                    # `.github/workflows/ci.yml` (what it holds / when to read
                                    # it), so the map stays accurate now that CI exists.

docs/verification.md               # MODIFIED — one short addition noting CI now runs the full
                                    # ./init.sh on every PR/push to main (so "verified" isn't
                                    # only a local claim going forward), and that branch
                                    # protection is a separate, human-only step tracked in this
                                    # feature's tasks.md until applied. No change to the existing
                                    # Levels 1-5 definitions themselves.
```

**Structure Decision**: Single Expo project, unchanged (Constitution I) — this feature's entire
footprint is `.github/workflows/ci.yml` (new), `init.sh` (one additive flag), and two short doc
updates (`AGENTS.md`, `docs/verification.md`). Zero files under `app/` or `src/` (spec.md
FR-015).

## Data Model

None. See spec.md's Key Entities section (N/A).

## Interface Contracts

This feature's only "interface" is the GitHub Actions workflow itself — not an HTTP endpoint or
SDK call. Documented as a trigger/job contract rather than a request/response shape:

| Trigger | Condition | Job run | Required for merge? |
|---|---|---|---|
| `pull_request` | `branches: [main]`, default activity types (opened/synchronize/reopened) | `verify` job, full `./init.sh --skip-install` (no skip flags) | Not yet — only after User Story 3's branch-protection setting is applied by a human (FR-014); the check exists and reports before that, it just isn't yet *required* |
| `push` | `branches: [main]` | Identical `verify` job | N/A — runs after the fact, cannot block a merge that already happened |

**Check name surfaced to GitHub** (what a future branch-protection rule selects): `CI / verify`
(workflow name `CI`, job name `verify` — GitHub Actions' standard `<workflow name> / <job name>`
check-name format).

**Exact branch-protection setting for FR-014/User Story 3** (for the human task in `tasks.md`,
stated precisely so it isn't ambiguous which checkbox to click): Repository Settings → Branches
→ add/edit a branch protection rule for `main` → enable **"Require status checks to pass before
merging"** → under "Status checks that are required," search for and select **`CI / verify`**.
(Optionally also enable "Require branches to be up to date before merging" for stricter
integration-safety, but that is a judgment call left to the human, not required by this
feature's own scope.)

## Quickstart Validation

Once `tasks.md` is implemented, validate per `docs/verification.md`'s spirit (adapted — this
feature has no UI to smoke-test, so its "Level 3" equivalent is watching the workflow run for
real, not `npm run web`):

1. Run `./init.sh` locally (no flags) and confirm it is unaffected — `RESULT: SUCCESS (10/10
   stages passed)`, same as before this feature (proves the new `--skip-install` flag is genuinely
   additive, not a behavior change to the default path). The count is 10, not 8: `init.sh` prints
   8 numbered stages, but stage 8 records the web/iOS/Android bundle exports as three separate
   results. A `--skip-build` run is the one that summarizes 8/8.
2. Run `./init.sh --skip-install` locally *without* having run `npm ci` first, on a machine
   where `node_modules` already exists from a prior install, and confirm stage 3 reports `OK`
   with the "skipped" detail rather than attempting an install.
3. Push this feature's branch and open a pull request against `main`. Confirm the `CI` check
   appears in the PR's checks list and begins running within a few seconds.
4. Confirm the check completes successfully, and that its log shows all 8 of `init.sh`'s stages,
   including all three `expo export` platforms, with the two pre-existing issues reported as
   `WARN` (not `FAIL`) and the overall conclusion green.
5. Push one additional commit to the same PR branch containing a deliberate, trivial break (e.g.
   an obvious type error in a file already touched by this feature, or a temporary throwaway
   file). Confirm the check re-runs (the prior run is cancelled per the concurrency setting, not
   left dangling), goes red, and its log identifies the specific broken stage.
6. Revert that commit. Confirm the check re-runs and goes green again.
7. Confirm zero GitHub Actions secrets exist for the repository afterward (Settings → Secrets
   and variables → Actions) — nothing this feature added should have created one.
8. Record steps 3–7's actual observed results in `progress/impl_014-continuous-integration.md`
   (FR-009) before considering this feature done.
9. Separately, once this feature's PR is merged and the workflow has run at least once against
   `main` via the `push` trigger, a human applies the exact branch-protection setting documented
   above (User Story 3) — this step is intentionally NOT part of steps 1–8 above, since no agent
   can perform it; `tasks.md`'s corresponding task stays unchecked until a human confirms it was
   done.

## Complexity Tracking

*No Constitution Check violations — table intentionally empty.*
