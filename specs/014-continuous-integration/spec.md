# Feature Specification: Continuous Integration

**Feature Branch**: `014-continuous-integration`

**Created**: 2026-08-07

**Status**: Draft (no open `[NEEDS CLARIFICATION]` markers — all scope decisions were settled
at kickoff by the human, recorded in `feature_list.json`'s entry for this feature; a handful of
secondary decisions the kickoff left open are resolved below with a stated default, per this
repo's own precedent of resolving-with-a-recorded-default rather than blocking on
low-stakes items)

**Input**: User description: "This repo has no CI at all — `.github/` does not exist. Add a
GitHub Actions workflow that runs this project's own `./init.sh` (the same verification a
developer runs locally) automatically on every pull request targeting `main`, so a change is
mechanically checked before it can be merged, rather than relying on local runs and reviewer
trust alone." See `feature_list.json`'s `014-continuous-integration` entry for the full kickoff
brief, including the three settled decisions (full `./init.sh` on every PR with no
`--skip-build`; branch protection is documentation + a human task; npm caching via
`actions/setup-node`'s built-in cache) that this spec treats as authoritative input, not
re-litigated here.

**Related backend spec**: None. This feature has no counterpart in the `Draw-a-card` backend
repo — it is pure repository tooling for this frontend repo only (`.github/workflows/`,
possibly `package.json` scripts and `init.sh`). It adds no application code under `app/` or
`src/` and changes no app behavior.

## Clarifications

No `/speckit-clarify` session was needed. The kickoff brief in `feature_list.json` explicitly
pre-settled the three decisions with the highest scope/architecture impact (full-`init.sh`-on-PR
vs. a faster subset; branch protection as documentation-plus-task vs. attempting to change repo
settings directly; npm-cache strategy), which is exactly the kind of decision `/speckit-clarify`
would otherwise have surfaced as a blocking question. The remaining open items the kickoff
listed ("worth considering, none pre-decided") are secondary — none of them change this
feature's scope or user-facing behavior, each has an unambiguous industry-standard default for
a project already fully specified elsewhere in this repo (Node 20 via `.nvmrc`, no macOS-only
native build, a small single-workflow file), and the kickoff brief itself frames them as
implementation decisions ("decide at plan time" / "decide and state") rather than open
questions for a human. They are resolved below as recorded defaults instead of
`[NEEDS CLARIFICATION]` markers:

- **Workflow display name**: `CI`. Short, and reads legibly as a single required-check name in
  the PR UI's checks list and in a future branch-protection required-checks picker.
- **`push` to `main` trigger**: Yes — already settled at kickoff ("SETTLED AT KICKOFF... (1) PR
  SCOPE... push and pull_request"; brief's Scope paragraph: "Trigger on pull_request targeting
  main and on push to main"). Restated here as FR-002, not re-decided.
- **Concurrency / cancel-in-progress**: One concurrency group per workflow + ref
  (`ci-${{ github.ref }}`), `cancel-in-progress: true`, for both triggers. For a PR, this
  cancels an in-flight run for an earlier push to the same PR branch the moment a newer push
  arrives — the earlier commit's result is moot once it's superseded, and letting it keep
  burning runner minutes provides no value. For `main`, the same logic applies (only the latest
  pushed commit's state matters); if two pushes to `main` land in quick succession, the older
  run is cancelled in favor of verifying the newer, current commit.
- **Timeout**: 20 minutes for the one job. `init.sh --skip-build` alone reports success in well
  under that; the full run including all three `expo export` stages is estimated at roughly
  8–15 minutes per the kickoff brief, leaving headroom for normal variance while still bounding
  a hung export (the single slowest, most failure-prone stage) to a fixed, small worst case
  rather than the platform default of 6 hours.
- **Runner OS**: `ubuntu-latest`. The kickoff brief notes the iOS bundle *export* does not need
  macOS (only a real Xcode **build** would, and this repo does no native build in CI) — Linux
  runners are materially cheaper and faster to schedule, and every stage `./init.sh` runs
  (install, type-check, expo-doctor, native dependency alignment, jest, and all three `expo
  export --platform ...` bundle smoke checks) is plain Node.js tooling with no native
  compilation step.
- **Node version matrix**: No matrix — one Node version, pinned from `.nvmrc` (FR-003). The
  kickoff brief explicitly flags this as "probably not" needed since `.nvmrc` pins exactly one
  version repo-wide; a matrix would test versions nobody actually runs.
- **How the workflow itself gets verified before it can be trusted**: addressed as its own
  concern below (FR-009) rather than left implicit, since the kickoff brief explicitly calls
  this out as something to address.

## User Scenarios & Testing *(mandatory)*

<!--
  This feature has no end-user-facing UI — its "users" are the people who write and review
  code in this repository (contributors opening pull requests, and the repo maintainer). User
  stories are framed around those actors' journeys, per Constitution-adjacent practice: a
  feature's user scenarios describe who is served and why, even when that "who" is a developer
  rather than an app user.
-->

### User Story 1 - A contributor's pull request is checked automatically (Priority: P1)

A contributor opens (or pushes a new commit to) a pull request targeting `main`. Without them
running anything locally, a check appears on the pull request that executes the exact same
verification a developer would run on their own machine (`./init.sh`, full run — type-check,
expo-doctor, native dependency alignment, the test suite, and bundle-export smoke checks for
web, iOS, and Android) and reports pass or fail. No repository secret is required for any of
this to run to completion.

**Why this priority**: This is the entire point of the feature — until this exists, nothing
mechanically verifies a change before it reaches `main`; every merged PR so far has landed on
local runs and reviewer trust alone (per the kickoff brief). Everything else in this feature
(the `push`-to-`main` trigger, branch protection, caching) is secondary to this one capability
existing at all.

**Independent Test**: Open a pull request against `main` from a branch with a deliberately
broken change (e.g. a type error) and confirm the check appears, runs, and reports failure with
enough detail in its logs to identify the broken stage; then push a fix to the same PR and
confirm the check re-runs and reports success. This feature's own introducing pull request is
the first real exercise of this scenario (see FR-009).

**Acceptance Scenarios**:

1. **Given** a pull request opened against `main`, **When** the workflow runs, **Then** it
   executes `./init.sh` with no flags that skip any stage (no `--skip-build`, no
   `--skip-native`, no `--skip-doctor`, no `--skip-tests`) — the full 8-stage run, including all
   three `npx expo export` bundle smoke checks.
2. **Given** the two pre-existing, non-blocking issues `./init.sh` already reports as `WARN`
   (expo-doctor's 2 failed checks; native dependency alignment's version-drift warnings), **When**
   the workflow runs against an otherwise-unmodified `main`, **Then** the workflow's overall
   conclusion is still success — matching `init.sh`'s own WARN-is-not-FAIL grading exactly, not
   a stricter grading invented for CI.
3. **Given** a change that actually breaks type-checking, the test suite, or any one of the
   three platform bundle exports, **When** the workflow runs, **Then** the check reports failure,
   and the failure is attributable to the specific stage that broke (per `init.sh`'s existing
   per-stage summary output, not a single opaque pass/fail line).
4. **Given** no `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`/`EXPO_PUBLIC_API_URL`
   are configured anywhere in the repository (no GitHub Actions secrets of any kind exist for
   this workflow), **When** the workflow runs, **Then** every stage still completes — `init.sh`
   self-provisions `.env` from `.env.example`, and `src/lib/supabase-client.ts`'s placeholder-host
   fallback keeps the type-check, tests, and all three exports from crashing at import time.
5. **Given** a pull request with a stale or inconsistent `package-lock.json` relative to
   `package.json`, **When** the workflow installs dependencies, **Then** the install step fails
   loudly (a lockfile that cannot reproduce the exact tree `npm ci` expects is itself a real,
   worth-surfacing problem — see FR-004).

---

### User Story 2 - `main` itself stays verified after every push (Priority: P2)

Whenever a commit lands on `main` — most commonly a PR merge, but also a direct push or an
admin merge that bypasses required-check gating — the same full verification runs again
against the resulting `main` commit, so `main`'s actual state is checked, not only the diff a
PR presented.

**Why this priority**: Complements User Story 1 rather than duplicating it. A merge can combine
two individually-green PRs into a `main` state that is not itself green (a rare but real class
of integration bug), and until branch protection is actually enabled (User Story 3, which needs
a human), nothing stops a direct push to `main` from skipping PR review entirely — this trigger
is the only mechanical check such a push would ever get.

**Independent Test**: Push a commit directly to `main` (or merge any PR) and confirm the same
workflow runs against that commit and reports a result visible in the repository's Actions tab
and as a commit status.

**Acceptance Scenarios**:

1. **Given** a push event to `main` (merge or direct push), **When** the workflow runs, **Then**
   it executes the identical job — same command (`./init.sh`, full run), same runner
   configuration — as the pull-request trigger; the workflow file defines one job used by both
   triggers, not two diverging job definitions.

---

### User Story 3 - `main` is actually protected by this check (Priority: P3)

Once the workflow exists and has been observed passing, the repository maintainer configures
GitHub branch protection on `main` so that a pull request cannot be merged unless this
workflow's check has passed — closing the gap between "a check exists" and "a check is actually
enforced."

**Why this priority**: Lowest priority because it is entirely dependent on User Stories 1 and 2
already existing and having run at least once (GitHub can only offer a check as a
required-status-check option after it has appeared at least once), and because it is a
repository-settings action only a human with admin access can perform — no agent in this repo
can complete it (Constitution scope: this repo's agents write code and specs, not GitHub
repository configuration).

**Independent Test**: After this workflow has run successfully at least once, a maintainer with
repository admin access visits Settings → Branches → branch protection rule for `main`, enables
"Require status checks to pass before merging," and selects this workflow's check (`CI`) from
the list. Confirm afterward that a pull request cannot be merged while the check is red or still
running.

**Acceptance Scenarios**:

1. **Given** this workflow has run at least once against a PR or `main` (so GitHub has a check
   name to offer), **When** a maintainer opens `main`'s branch protection settings, **Then** the
   `CI` check is selectable under "Require status checks to pass before merging."
2. **Given** branch protection is enabled with this check required, **When** a pull request's
   check is failing or still in progress, **Then** GitHub's merge button is disabled for that
   pull request regardless of review approval state.

---

### Edge Cases

- **A pull request from a fork** (if this repository ever accepts external contributions): the
  workflow needs no repository secret (FR-006) and requests no elevated `GITHUB_TOKEN`
  permission (FR-008), so it runs identically for a fork PR under GitHub's default
  read-only-token restriction for fork-originated `pull_request` events — no special-casing
  needed.
- **A hung `expo export` stage** (e.g. a dependency resolution hang): the job-level timeout
  (20 minutes, see Clarifications) fails the run explicitly rather than consuming a runner's
  full default budget silently.
- **Two pushes to the same PR branch in quick succession**: concurrency cancellation (see
  Clarifications) cancels the now-superseded run rather than letting both complete and race to
  report a result.
- **The very first run of this workflow is on the pull request that introduces it**: addressed
  explicitly as FR-009, not left as an unstated gap — a newly added workflow file that declares
  a `pull_request` trigger targeting `main` **does** run against the pull request that adds it
  (GitHub evaluates a `pull_request`-triggered workflow using the version of the workflow file
  committed to the PR's own head branch, for a same-repository PR), so this feature's own
  introducing PR is real, live proof the workflow works — not something that has to be taken on
  faith until a later PR.
- **The two pre-existing `WARN`-graded issues** (outdated `expo-doctor` findings; native
  dependency version drift): must not cause the workflow to report failure (User Story 1,
  Acceptance Scenario 2) — and upgrading the underlying packages is explicitly out of scope for
  this feature (see Assumptions).
- **`init.sh`'s own dependency-install stage runs `npm install`, not `npm ci`**: this feature's
  hard constraint is that installation in CI happens via `npm ci` against the committed
  lockfile, never `npm install` (FR-004). Resolved via FR-005 — see there for the exact
  mechanism, so `init.sh`'s remaining seven stages can still be reused unmodified in spirit
  while the workflow's actual, CI-enforced install step is genuinely `npm ci`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The workflow MUST trigger on every `pull_request` event targeting the `main`
  branch (the default `pull_request` activity types — opened, synchronize, reopened — are
  sufficient; no narrower or wider type list is needed).
- **FR-002**: The workflow MUST also trigger on every `push` event to the `main` branch (User
  Story 2).
- **FR-003**: The workflow MUST pin its Node.js version by reading `.nvmrc` via
  `actions/setup-node`'s `node-version-file` input — never a second, independently-hardcoded
  version string that could silently drift out of sync with `.nvmrc`.
- **FR-004**: The workflow MUST install dependencies with `npm ci` against the committed
  `package-lock.json` — never `npm install` — so a lockfile that cannot reproduce the exact
  dependency tree fails the run loudly rather than silently drifting.
- **FR-005**: The workflow MUST run this project's own `./init.sh` as the single source of
  truth for what "verified" means, rather than re-implementing its stages by hand in the
  workflow file (which would drift from what a developer runs locally). Because FR-004 requires
  the actual install step to be `npm ci` (run once, by the workflow, before invoking
  `init.sh`) while `init.sh`'s own "Installing dependencies" stage currently always runs `npm
  install`, `init.sh` MUST gain a new flag (e.g. `--skip-install`) that marks that one stage `OK`
  with a note that installation was already performed by the caller, instead of re-running `npm
  install` — every other stage (type-check, expo-doctor, native dependency alignment, jest, all
  three bundle exports) runs exactly as it does today, unmodified, for both the workflow and any
  developer's local, unflagged run.
- **FR-006**: Pull-request runs (FR-001) MUST invoke `./init.sh` with no stage-skipping flags —
  the full 8-stage run, including all three `npx expo export --platform ...` bundle smoke
  checks — as one job invoking one command, so CI and what a developer runs locally cannot
  drift apart. Parallel per-platform export jobs MUST NOT be used (considered and explicitly
  declined at kickoff, for the same drift-avoidance reason).
- **FR-007**: Push-to-`main` runs (FR-002) MUST invoke the identical job as pull-request runs —
  the same command, same runner, same flags — not a separate, differently-scoped job definition.
- **FR-008**: The workflow MUST require no repository secret of any kind. It MUST NOT reference
  `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`, or any
  other credential — `init.sh`'s self-provisioned `.env` (from `.env.example`) and
  `src/lib/supabase-client.ts`'s placeholder-host fallback are what make every stage runnable
  with zero configuration.
- **FR-009**: The workflow's own correctness MUST be demonstrated by the pull request that
  introduces it, not asserted without evidence — because a `pull_request`-triggered workflow
  added in a same-repository PR runs using the workflow file version from that PR's own head
  branch, opening this feature's introducing PR against `main` and observing the resulting
  check run to completion (both a passing case and, before merge, at least one deliberately
  broken commit to confirm the check can actually fail — see User Story 1's Independent Test)
  IS that workflow's own first real-world verification. This MUST be recorded as evidence
  (e.g. in the PR description or `progress/impl_014-continuous-integration.md`), not just
  asserted.
- **FR-010**: The workflow SHOULD cache `~/.npm` (never `node_modules`) via
  `actions/setup-node`'s built-in `cache: 'npm'` input, keyed on `package-lock.json`, so `npm
  ci` (FR-004) still always installs from a verified-fresh `node_modules` on every run (caching
  only the npm download cache, not the installed tree, keeps `npm ci` honest rather than
  papering over a broken lockfile with a stale `node_modules`).
- **FR-011**: The workflow MUST use a bounded job timeout (20 minutes, see Clarifications)
  rather than the platform default, so a hung stage (most plausibly a stuck `expo export`)
  cannot silently consume a full runner budget.
- **FR-012**: Concurrent runs for the same ref MUST be deduplicated — a newer push to the same
  branch (PR branch or `main`) cancels that branch's in-flight run rather than letting a
  now-superseded commit's result race a newer one to completion (see Clarifications).
- **FR-013**: The workflow's `GITHUB_TOKEN` permissions MUST be scoped to the minimum needed
  (read-only `contents: read`) — the workflow only checks out code and runs local verification;
  it writes nothing back to the repository, comments on nothing, and needs no elevated
  permission.
- **FR-014**: Enabling GitHub branch protection on `main` to require this workflow's check
  before merge is IN SCOPE as a documented, named, exact repository setting (see plan.md), and
  as a task that remains open/unchecked in `tasks.md` until a human with repository admin
  access applies it — no agent in this repository is able to change GitHub repository settings,
  so this requirement is satisfied by clear documentation plus an explicitly-not-self-closing
  task, not by any code change.
- **FR-015**: This feature MUST add no application code under `app/` or `src/`, and MUST NOT
  change any existing app behavior. Its footprint is limited to `.github/`, and, if genuinely
  needed to satisfy FR-005, `init.sh` and/or `package.json`'s `scripts` (an additive `ci` or
  `verify` script alias is permitted if it improves clarity of what the workflow runs — it MUST
  still ultimately invoke the same `./init.sh` script, not a divergent second implementation).

### Key Entities

*(Not applicable — this feature introduces no data entity, persisted or otherwise. It is
repository tooling only.)*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of pull requests opened against `main` after this feature merges receive an
  automatic check reporting pass or fail, with zero manual steps required from the PR author.
- **SC-002**: A genuinely broken change (type error, failing test, or a broken bundle export on
  any of the three platforms) is caught by the check before merge in every case — zero false
  "success" reports for a stage `init.sh` itself would report as `FAIL` when run locally against
  the same commit.
- **SC-003**: The two pre-existing, non-blocking `WARN`-graded issues never cause a false
  "failure" report — zero false negatives against `init.sh`'s own local grading, on an
  otherwise-unmodified `main`.
- **SC-004**: A contributor can identify which specific stage broke from the check's own output
  alone (the Actions run log), without needing to reproduce the failure locally first to find
  out.
- **SC-005**: The workflow completes (pass or fail) within the 20-minute timeout under normal
  conditions — no run is left indefinitely "in progress" consuming runner budget.
- **SC-006**: Zero GitHub Actions secrets exist for this workflow, verified by inspecting the
  repository's configured secrets after this feature ships.

## Assumptions

- **No live backend or Supabase project is reachable from CI, and none is needed.** Every stage
  `./init.sh` runs (type-check, expo-doctor, native dependency alignment, jest, and all three
  bundle exports) is provably runnable with zero external services, per the kickoff brief's own
  verified finding that `./init.sh --skip-build` already returns `SUCCESS (8/8)` locally with no
  backend and no real Supabase credentials configured.
- **The two pre-existing `WARN` findings (outdated `expo-doctor` checks; native dependency
  version drift on `expo-image-picker`, `react-native`, `react-native-safe-area-context`,
  `@types/react`, `typescript`) predate this feature and are out of its scope to fix.** This
  spec's job is to preserve `init.sh`'s own WARN-not-FAIL grading of them in CI (User Story 1,
  Acceptance Scenario 2), not to resolve them. If the eventual `spec.md` review or a future
  session decides those upgrades should happen, that is genuinely separate work and belongs in
  its own `feature_list.json` entry — not absorbed into this one.
- **This repository's default branch is `main`**, and its remote is
  `github.com/LeonardoALopezR/Draw-a-card-front` (verified in the kickoff brief) — the workflow
  targets that branch name literally, not a configurable input.
- **Branch protection (User Story 3, FR-014) is a one-time, out-of-repo manual configuration
  step**, exactly like `005-login`'s Supabase dashboard "Reset Password" email-template
  reminder — documented here and in `plan.md`/`tasks.md`, not a blocker for this feature's own
  `spec_ready`/implementation status, but genuinely incomplete (branch protection literally not
  yet enforcing anything) until a human performs it.
- **This feature's own branch/PR is the first real exercise of the workflow it adds** (FR-009).
  Unlike every prior `"sdd": true` feature in this repo, there is no way to "manually smoke
  test" a GitHub Actions workflow via `npm run web` or a simulator per `docs/verification.md`'s
  existing Level 3 — the equivalent verification step for this feature specifically is watching
  its own introducing pull request's check run (and, before merge, confirming it can actually
  go red on a deliberately broken commit, then confirming it goes green again once reverted).
  `tasks.md` must include this as an explicit task, not assume it as a prerequisite already
  covered by `init.sh` running locally.
