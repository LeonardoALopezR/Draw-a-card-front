# Implementation Progress: 014-continuous-integration

## Run 1 — T001 only (`--skip-install` flag on `init.sh`)

**Scope**: Phase 2 / T001 only, per explicit instruction. T002+ (the `.github/workflows/ci.yml`
workflow file) intentionally NOT started — it depends on T001 being reviewed first.

### Files changed

- `init.sh`
  - Header comment's `Usage:` line: added `[--skip-install]` to the documented flag list.
  - Flag-parsing loop (around line 47-67): added `SKIP_INSTALL=false` alongside the existing
    `SKIP_DOCTOR`/`SKIP_TESTS`/`SKIP_BUILD`/`SKIP_NATIVE` booleans, and a new
    `--skip-install) SKIP_INSTALL=true ;;` case, matching the existing pattern exactly.
  - `-h`/`--help` output: added `--skip-install` to the `Usage:` echo and a new description line
    explaining it's for callers (e.g. CI) that already installed dependencies (e.g. via `npm ci`).
  - Stage 3 ("Installing dependencies", ~line 128-135): now branches —
    `if [ "$SKIP_INSTALL" = true ]` calls
    `add_result "npm install" "OK" "skipped (--skip-install) — dependencies already installed by
    the caller"`, exactly the string specified in the task. The `elif npm install ... ; else ...
    FAIL ...` branch (the existing, unflagged behavior) is untouched — same commands, same log
    path, same FAIL message, byte-for-byte.
  - No other stage (1, 2, 4, 5, 6, 7, 8) was touched. `git diff init.sh` confirms the diff is
    scoped to exactly the four changes above.

- `specs/014-continuous-integration/tasks.md`: marked T001 `[X]`.

No files under `app/` or `src/` were touched (FR-015 compliance — trivially true for this task,
since it only touches `init.sh`).

### Verification run (a): `./init.sh` with NO flags — default path unregressed

Ran the full, unflagged script for real (not `--skip-build`), letting all three `expo export`
stages complete. Result:

```
==================== init.sh summary ====================
✅ [OK] Prerequisites: node v20.20.2, npm v10.8.2
✅ [OK] Env file: .env already exists, left untouched
✅ [OK] npm install: dependencies installed
✅ [OK] Type-check: no type errors
⚠️  [WARN] expo-doctor: issues found (non-blocking) — ... Found outdated dependencies ... 2 checks failed
⚠️  [WARN] Native deps: peers declared, but some package versions differ from the pinned SDK's
    expectations (non-blocking) — expo-image-picker@15.0.7, react-native@0.74.0,
    react-native-safe-area-context@4.10.1, @types/react@18.3.31, typescript@5.9.3
✅ [OK] Tests: all tests passed
✅ [OK] Build check (web): web bundle exported cleanly
✅ [OK] Build check (ios): ios bundle exported cleanly
✅ [OK] Build check (android): android bundle exported cleanly
===========================================================
RESULT: SUCCESS (10/10 stages passed)
```

**Note on the stage count — a discrepancy worth flagging honestly rather than silently
rounding to match the brief.** The kickoff brief for this task stated the unflagged run should
report `SUCCESS (8/8 stages passed)`. The actual unflagged run reports `SUCCESS (10/10 stages
passed)`. This is **not** a regression introduced by this change — it's how the script already
counted stages before T001, for a reason visible in the script itself: the `8/8` figure in
`log "N/8 ..."` labels refers to the 8 *phases* of the script, but stage 8 ("Bundle export smoke
checks") calls `add_result` once *per platform* (web, iOS, android) when not skipped, i.e. 3
separate result entries for one phase — so an unflagged run's actual `STEPS_TOTAL` is 7 (phases
1-7) + 3 (phase 8's three platforms) = 10, not 8. The `8/8` figure the brief cited matches
exactly what the brief's own "Context" section says about `./init.sh --skip-build` (where stage
8 collapses to a single `WARN "skipped (--skip-build)"` result, making the total 7 + 1 = 8) — it
appears the brief's expectation for the *unflagged* run was carried over from that `--skip-build`
number rather than independently re-derived. I did not alter stage 8's logic in any way (confirmed
via `git diff init.sh`, reproduced above under "Files changed" — the only lines touched are the
header comment, the flag-parsing loop, `--help` text, and stage 3's body), so this 10-vs-8 count
is pre-existing behavior, unrelated to and unaffected by this task's change. What matters for
"proving the change is additive and the default path is unregressed" holds: `RESULT: SUCCESS`,
zero `FAIL`, exactly the two pre-existing `WARN`s (expo-doctor, native dependency alignment)
described as expected in the brief, and stage 3 ("npm install: dependencies installed") behaves
identically to before this change — `npm install` genuinely ran (its log file
`/tmp/init-sh-front-npm-install.log` was created, see verification (b) below where its absence is
used as the negative-control signal).

### Verification run (b): `./init.sh --skip-install`, `node_modules` already present

First removed any stale `/tmp/init-sh-front-npm-install.log` from a prior run, then ran
`./init.sh --skip-install`:

```
[1/8] ✅ [OK] Prerequisites: node v20.20.2, npm v10.8.2
[2/8] ✅ [OK] Env file: .env already exists, left untouched
[3/8] ✅ [OK] npm install: skipped (--skip-install) — dependencies already installed by the caller
[4/8] ✅ [OK] Type-check: no type errors
[5/8] ⚠️  [WARN] expo-doctor: issues found (non-blocking) — ...
[6/8] ⚠️  [WARN] Native deps: peers declared, but some package versions differ ...
[7/8] ✅ [OK] Tests: all tests passed
[8/8] ✅ [OK] Build check (web/ios/android): bundle exported cleanly (all three)

RESULT: SUCCESS (10/10 stages passed)
```

Exit code of the `./init.sh --skip-install` invocation itself: `0` (confirmed separately with
`echo "init.sh exit code: $?"` immediately after the run, redirected to a log file to avoid a
later command's exit code masking it).

Confirmed `npm install` did NOT run: `ls /tmp/init-sh-front-npm-install.log` →
`No such file or directory` (that log file is only ever written by the `npm install ...` branch
of stage 3; its absence after the run is direct evidence the `elif npm install` branch never
executed). Stage 3's reported detail string is exactly
`"skipped (--skip-install) — dependencies already installed by the caller"`, matching the task's
required wording verbatim.

### Task status

- **T001: [X]** — both required local verifications passed for real (executed, not asserted from
  reading the diff). `specs/014-continuous-integration/tasks.md` updated accordingly.
- T002 and all later tasks: **not started**, as instructed — T002 (the workflow file) is left for
  a separate review pass now that T001 is done and verified.

### Deviations / items needing sign-off

- The `8/8` vs `10/10` stage-count discrepancy documented above under verification (a). No code
  behavior deviates from the plan/spec — FR-005's actual requirement (stage 3 marked `OK` with a
  "skipped" detail instead of running `npm install`, every other stage unmodified) is met exactly
  as specified. Flagging this only because the brief asserted a specific number (`8/8`) that
  the script was already not going to produce even before this change, and I did not want to
  silently gloss over a mismatch between an instruction's stated expectation and the actual
  observed output. No action needed unless the orchestrator wants `tasks.md`/`plan.md`'s own
  language about "8/8" corrected for accuracy in a later polish task — not done here since it's
  out of T001's scope and T001's own task text doesn't hardcode "8/8" (only the outer briefing
  message did).
- Working tree otherwise left untouched: `feature_list.json`, `progress/current.md` (both already
  modified before this session started), and `specs/012-home-visual-alignment/` (untracked,
  pre-existing) were not read, edited, or staged. Nothing was committed or pushed, per
  instructions.

---

## Run 2 — T002 only (`.github/workflows/ci.yml`)

**Scope**: Phase 3 / T002 only, per explicit instruction. T003 and T004 (pushing the branch,
opening the PR, and observing real pass/fail runs — both require a human-authorized push/PR)
and T005 (adding `on.push`) intentionally NOT started. `permissions: contents: read` and no
`on.push` are deliberate per the task brief, not oversights.

### Files changed

- **`.github/workflows/ci.yml`** (NEW — the only new file this task adds):

  ```yaml
  name: CI

  on:
    pull_request:
      branches: [main]

  permissions:
    contents: read

  concurrency:
    group: ci-${{ github.ref }}
    cancel-in-progress: true

  jobs:
    verify:
      runs-on: ubuntu-latest
      timeout-minutes: 20
      steps:
        - uses: actions/checkout@v4

        - uses: actions/setup-node@v4
          with:
            node-version-file: '.nvmrc'
            cache: 'npm'
            cache-dependency-path: package-lock.json

        - run: npm ci

        - run: ./init.sh --skip-install
  ```

  Matches `tasks.md` T002's text and `plan.md`'s Project Structure/Interface Contracts section
  field-for-field: `name: CI`; `on.pull_request.branches: [main]` only, default activity types
  (no explicit `types:` list — `opened`/`synchronize`/`reopened` apply by default); no `on.push`
  (that's T005, explicitly deferred); `permissions: contents: read` at workflow level; the exact
  `concurrency` block from FR-012/Clarifications; one job named `verify` (so the check surfaces
  as `CI / verify`, matching plan.md's Interface Contracts and what T007's branch-protection
  instruction will need to select) on `ubuntu-latest` with `timeout-minutes: 20`; the four steps
  in the exact specified order, `actions/setup-node@v4` pinned from `.nvmrc` only (no hardcoded
  version string anywhere), `npm ci` as its own explicit step (never `npm install` in the
  workflow), and `./init.sh --skip-install` with no other flags so PR runs execute the full
  8-stage `init.sh`, including all three `expo export` bundle checks.

- **`specs/014-continuous-integration/tasks.md`**: marked T002 `[X]`. T003, T004, T005 left
  unchecked, as instructed.

No files under `app/` or `src/` were touched (FR-015). No repository secret referenced anywhere
in the workflow (FR-008) — no `env:` block at all, at any level; `init.sh` self-provisions `.env`
from `.env.example` in its own stage 2, which the workflow relies on implicitly by doing nothing.

### Pre-flight checks performed before/while writing the file

- **`init.sh` executable bit**: `git ls-files -s init.sh` → `100755 10042ac06806fb550e73c16bc9424cfe0610b3fe 0	init.sh`. Mode `100755` confirmed — `run: ./init.sh` will not hit a
  runner permission error.
- **`.nvmrc`**: exists at repo root, contents `20` (single line, no `v` prefix, matches
  `node-version-file` expectations for `actions/setup-node@v4`).
- **`package-lock.json`**: tracked (`git ls-files package-lock.json` → `package-lock.json`),
  confirming `npm ci` and the cache's `cache-dependency-path` both have a real target.
- **`.github/` did not exist before this task**: confirmed (`ls .github` → "No such file or
  directory") before creating `.github/workflows/ci.yml` — this is genuinely the first CI file in
  the repo, one new file added, nothing else under `.github/`.

### Verification performed

**(a) YAML parses correctly and `on` was not silently coerced to boolean `true`.** `pyyaml` is
not installed in this environment and the task explicitly forbids adding any new dependency, so
I used `node_modules/.bin/js-yaml` (already present in this repo's own `node_modules`, added by
some existing devDependency — not a new dependency introduced by this task) instead of installing
`pyyaml`:

```
$ ./node_modules/.bin/js-yaml .github/workflows/ci.yml
{
  "name": "CI",
  "on": {
    "pull_request": {
      "branches": [
        "main"
      ]
    }
  },
  "permissions": { "contents": "read" },
  "concurrency": {
    "group": "ci-${{ github.ref }}",
    "cancel-in-progress": true
  },
  "jobs": {
    "verify": {
      "runs-on": "ubuntu-latest",
      "timeout-minutes": 20,
      "steps": [
        { "uses": "actions/checkout@v4" },
        {
          "uses": "actions/setup-node@v4",
          "with": {
            "node-version-file": ".nvmrc",
            "cache": "npm",
            "cache-dependency-path": "package-lock.json"
          }
        },
        { "run": "npm ci" },
        { "run": "./init.sh --skip-install" }
      ]
    }
  }
}
```

`on` parsed as the literal string key `"on"` with the intended `pull_request` sub-object — it did
**not** become the boolean `true` here (unlike classic YAML 1.1 parsers such as PyYAML's default
loader, which resolve the bareword `on` as boolean when unquoted; `js-yaml`'s `safeLoad` in the
version bundled here follows a schema that does not do this coercion for top-level mapping keys
in this position). Regardless of what any given parser's JSON representation shows, the *raw file
text* (`on:` at the top level, standard GitHub Actions syntax) is unambiguously correct — GitHub's
own workflow parser is not a generic YAML-1.1 boolean-coercing parser for this specific key
position, and every workflow file on GitHub uses exactly this `on:` syntax. I did not "fix"
anything based on the parser's JSON output; I used it only to confirm the *structure* (keys,
nesting, list values) matched intent, which it does exactly.

**(b) `.nvmrc` and `package-lock.json` presence** — confirmed above under "Pre-flight checks."

**(c) Re-ran `./init.sh --skip-install --skip-build` after adding the file**, to confirm the repo
is still green and the new `.github/` directory doesn't affect anything (it isn't part of any
type-check/build/test glob):

```
==================== init.sh summary ====================
✅ [OK] Prerequisites: node v20.20.2, npm v10.8.2
✅ [OK] Env file: .env already exists, left untouched
✅ [OK] npm install: skipped (--skip-install) — dependencies already installed by the caller
✅ [OK] Type-check: no type errors
⚠️  [WARN] expo-doctor: issues found (non-blocking) — 2 checks failed (pre-existing, expected)
⚠️  [WARN] Native deps: peers declared, but some package versions differ (non-blocking, pre-existing)
✅ [OK] Tests: all tests passed
⚠️  [WARN] Build check: skipped (--skip-build)
===========================================================
RESULT: SUCCESS (8/8 stages passed)
```

Unchanged from the state after T001 — the two expected `WARN`s, zero `FAIL`, `RESULT: SUCCESS`.
Confirms adding `.github/workflows/ci.yml` has zero effect on the app itself, as expected (FR-015:
no application code touched, no app behavior changed).

**(d) `git status`** after the change, confirming only the intended file was added and no
unrelated in-flight work was disturbed:

```
Changes not staged for commit:
	modified:   feature_list.json          (pre-existing, from before this session — untouched by me)
	modified:   init.sh                    (from T001, already committed-pending from Run 1)
	modified:   progress/current.md        (pre-existing, from before this session — untouched by me)

Untracked files:
	.github/                                        (NEW — this task's deliverable)
	progress/impl_014-continuous-integration.md     (this report)
	progress/review_014-continuous-integration.md   (pre-existing review artifact)
	specs/012-home-visual-alignment/                (pre-existing, unrelated in-flight feature — untouched)
	specs/014-continuous-integration/               (this feature's own spec dir, tasks.md edited for T002)
```

Nothing was staged, committed, or pushed. `specs/012-home-visual-alignment/` and the pre-existing
modifications to `feature_list.json`/`progress/current.md` were left exactly as found, per
instructions.

**Not done, per instructions**: no `gh` command was run; no branch was pushed; no PR was opened;
no `act`/`actionlint` install attempted; the workflow's real execution was not (and cannot be)
observed locally.

### Task status

- **T002: [X]** — the workflow file exists, matches `tasks.md`'s spec field-for-field, parses as
  valid YAML with the intended structure, references no secret, uses `npm ci` (never `npm
  install`) as its own step, pins Node only from `.nvmrc`, and the repo remains green locally
  after adding it.
- T003, T004, T005: **not started**, as instructed — T003/T004 require pushing this feature's
  branch and opening a PR (human authorization required, not given); T005 is a separate,
  individually-reviewable increment (`on.push`) per the task brief.

### Deviations / items needing sign-off

None. The file matches the task text and the FRs it cites (FR-001, FR-003, FR-004, FR-005,
FR-006, FR-008, FR-010, FR-011, FR-012, FR-013) exactly as specified, with no judgment calls
requiring separate sign-off. One thing worth flagging transparently rather than silently
substituting: `pyyaml` was not available in this environment and installing it was explicitly
disallowed by the task brief, so I used the `js-yaml` CLI already vendored in this repo's
`node_modules` (via an existing devDependency, not something I added) to perform the equivalent
YAML-structure check instead of the `python3 -c "import yaml..."` command literally suggested in
the task brief. The check's *purpose* (confirm structure, confirm `on` wasn't misrepresented) was
fully satisfied; only the specific tool differed, and no new dependency was installed to do it.

---

## Run 3 — T005, T008, T009 (the last three agent-completable tasks)

**Scope**: Per explicit instruction, only T005 (Phase 4/US2), T008, and T009 (Phase 6/Polish).
T003, T004 (require pushing the branch and opening a PR — not authorized), T006 (can only be
confirmed after this feature's own PR merges — doesn't exist yet), and T007 (human-only GitHub
repo-settings action) were explicitly NOT touched.

### Files changed

- **`.github/workflows/ci.yml`** (T005): added
  ```yaml
  on:
    pull_request:
      branches: [main]
    push:
      branches: [main]
  ```
  i.e. one new `push.branches: [main]` trigger block added alongside the existing
  `pull_request.branches: [main]` block. No new job, no duplicated or diverging steps, no second
  workflow file — the single `verify` job (checkout → setup-node from `.nvmrc` → `npm ci` →
  `./init.sh --skip-install`) is now triggered by both events, unchanged itself. Everything else
  in the file (name, `permissions: contents: read`, `concurrency`, `timeout-minutes: 20`, all four
  steps) is byte-for-byte unchanged from T002.

- **`AGENTS.md`** (T008): added one row to the §2 Repo map table, immediately after the existing
  `init.sh` row:
  ```
  | `.github/workflows/ci.yml` | The `CI` workflow: runs the full `./init.sh` on every pull
  request targeting `main` and on every push to `main` | Before changing what "verified" means,
  or before changing `init.sh`'s flags |
  ```
  Matches the table's existing column style (backtick-quoted path, terse "what it holds"
  description, "when to read it" phrased as a trigger condition) exactly — modeled directly on the
  neighboring `init.sh` and `docs/verification.md` rows.

- **`docs/verification.md`** (T009): added a new `## CI` section, placed right after the existing
  "Test tooling isn't installed yet" section and before "## Levels of verification" — does not
  rewrite or renumber the existing Levels 1–5. States: (a) `.github/workflows/ci.yml` (the `CI`
  workflow, job `verify`) now runs the full, unflagged `./init.sh` on every PR targeting `main`
  and every push to `main`; (b) the two pre-existing `WARN`-graded issues (expo-doctor outdated
  deps; native dependency version drift) are expected there too and do not fail the build,
  matching `init.sh`'s own WARN-is-not-FAIL grading; (c) branch protection requiring this check
  (`specs/014-continuous-integration/tasks.md` T007) is a separate, human-only action that is
  **not yet enabled**, so "CI exists" must not be read as "CI is required."

- **`specs/014-continuous-integration/tasks.md`**: marked T005, T008, T009 `[X]`. T003, T004,
  T006, T007 left unchecked, as instructed.

No files under `app/` or `src/` were touched (FR-015 compliance).

### The concurrency-group decision (T005's flagged review point)

Question: with `push` to `main` now a trigger, could a `push`-to-`main` run be cancelled by a
subsequent merge to `main` while its result is still wanted — and does the existing
`concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }` need `github.workflow`
or the event name folded into the key to prevent that?

**Decision: left the group key unchanged (`ci-${{ github.ref }}`), deliberately, for two
independent reasons:**

1. **No cross-trigger collision is possible with this key.** GitHub Actions sets `github.ref` to
   `refs/heads/main` for a `push` event and to `refs/pull/<number>/merge` for a `pull_request`
   event. A PR's `pull_request`-triggered runs and `main`'s `push`-triggered runs therefore always
   land in different concurrency groups (`ci-refs/pull/123/merge` vs. `ci-refs/heads/main`) — a PR
   run can never cancel, or be cancelled by, a push-to-`main` run. The only thing that *can*
   collide is two `push`-to-`main` runs with each other, or two `pull_request` runs on the same PR
   with each other.
2. **A `push`-to-`main` run being cancelled by a subsequent `push`-to-`main` run is exactly the
   behavior spec.md already specifies, not a gap.** spec.md's Clarifications section, under
   "Concurrency / cancel-in-progress," states explicitly: "For `main`, the same logic applies
   (only the latest pushed commit's state matters); if two pushes to `main` land in quick
   succession, the older run is cancelled in favor of verifying the newer, current commit." FR-012
   restates this as a MUST ("Concurrent runs for the same ref MUST be deduplicated"). So the
   scenario the review flagged — an older push-to-`main` run's result becoming moot because a
   newer commit has already landed on `main` — is the intended, spec'd outcome: only the state of
   the *current* `main` HEAD is meaningful for User Story 2's purpose ("main itself stays
   verified"), and a stale in-flight run against a commit `main` has already moved past provides
   no value that verifying the newer commit doesn't already supersede.

Folding `github.workflow`/the event name into the group key would only matter if this were a
*multi-workflow* repo where a differently-named workflow's ref-scoped run could collide with this
one's — not the case here (this is the only workflow file in the repo), and it would not change
the "two pushes to `main` in quick succession" scenario at all (both are still `push` events on
`refs/heads/main`, so they'd still share a group and the older would still be cancelled — adding
the event name to the key doesn't separate consecutive pushes from each other, since they're the
same event type on the same ref). Changing the key would add complexity with no behavior change
for the concern actually raised, and would contradict the explicit, already-approved spec
language above. **No change made — key confirmed correct as-is.**

### Verification performed

**(a) YAML structure**, using `node_modules/.bin/js-yaml` (same tool used in Run 2 for T002,
`pyyaml` still not installed and still not added per instructions):

```
$ ./node_modules/.bin/js-yaml .github/workflows/ci.yml
{
  "name": "CI",
  "on": {
    "pull_request": { "branches": ["main"] },
    "push": { "branches": ["main"] }
  },
  "permissions": { "contents": "read" },
  "concurrency": { "group": "ci-${{ github.ref }}", "cancel-in-progress": true },
  "jobs": {
    "verify": {
      "runs-on": "ubuntu-latest",
      "timeout-minutes": 20,
      "steps": [
        { "uses": "actions/checkout@v4" },
        { "uses": "actions/setup-node@v4", "with": { "node-version-file": ".nvmrc", "cache": "npm", "cache-dependency-path": "package-lock.json" } },
        { "run": "npm ci" },
        { "run": "./init.sh --skip-install" }
      ]
    }
  }
}
```

Confirms: both `pull_request.branches: [main]` and `push.branches: [main]` are present under the
same `on:` key; exactly one job (`verify`); its steps are unchanged from T002 (still four steps,
same order, same commands) — no duplication, no second job, no second workflow file.

**(b) `./init.sh --skip-install --skip-build`** re-run after the doc/workflow edits, to confirm
the repo is still green (docs and workflow YAML are not part of any type-check/test/build glob,
so no behavior change expected, confirmed rather than assumed):

```
==================== init.sh summary ====================
✅ [OK] Prerequisites: node v20.20.2, npm v10.8.2
✅ [OK] Env file: .env already exists, left untouched
✅ [OK] npm install: skipped (--skip-install) — dependencies already installed by the caller
✅ [OK] Type-check: no type errors
⚠️  [WARN] expo-doctor: issues found (non-blocking) — 2 checks failed (pre-existing, expected)
⚠️  [WARN] Native deps: peers declared, but some package versions differ (non-blocking, pre-existing)
✅ [OK] Tests: all tests passed
⚠️  [WARN] Build check: skipped (--skip-build)
===========================================================
RESULT: SUCCESS (8/8 stages passed)
```

`RESULT: SUCCESS (8/8 stages passed)` is the correct count for this specific invocation
(`--skip-install --skip-build`) — stage 8 collapses to one `WARN "skipped (--skip-build)"` result
instead of three separate per-platform results, making the total 7 + 1 = 8. This is distinct from
a full, unflagged `./init.sh` run, which reports `RESULT: SUCCESS (10/10 stages passed)` (7 phases
+ 3 separate per-platform bundle-export results for phase 8) — see Run 1's note above for the full
explanation of why 8 vs. 10 depends on which flags are passed, not a regression either way.

**(c) `git status`** after the change, confirming only the intended files were modified and every
pre-existing unrelated in-flight item was left exactly as found:

```
Changes not staged for commit:
	modified:   AGENTS.md                     (this task — T008)
	modified:   docs/verification.md          (this task — T009)
	modified:   feature_list.json             (pre-existing, from before this session — untouched by me)
	modified:   init.sh                       (from T001, already pending from Run 1)
	modified:   progress/current.md           (pre-existing, from before this session — untouched by me)

Untracked files:
	.github/                                        (from T002/T005 — ci.yml modified in place for T005)
	progress/impl_014-continuous-integration.md     (this report)
	progress/review_014-continuous-integration.md   (pre-existing review artifact)
	specs/012-home-visual-alignment/                (pre-existing, unrelated in-flight feature — untouched)
	specs/014-continuous-integration/               (this feature's own spec dir, tasks.md edited for T005/T008/T009)
```

Nothing was staged, committed, or pushed. No `gh` command was run. `specs/012-home-visual-alignment/`
and the pre-existing modifications to `feature_list.json`/`progress/current.md` were left exactly
as found, per instructions.

### Task status

- **T005: [X]** — `on.push.branches: [main]` added, same job, no duplication, YAML structure
  verified, repo confirmed green afterward.
- **T008: [X]** — `AGENTS.md`'s Repo map table has a new row for `.github/workflows/ci.yml`,
  matching the table's existing tone and column style.
- **T009: [X]** — `docs/verification.md` has a new, short `## CI` section; Levels 1–5 untouched.
- **T003, T004, T006, T007: left `[ ]`**, as instructed. T003/T004 require a human-authorized
  push/PR that was not given. T006 requires this feature's PR to have already merged to `main`,
  which has not happened. T007 is a human-only GitHub Settings action.

### Deviations / items needing sign-off

None. All three tasks match `tasks.md`'s text and the FRs they cite (T005: FR-002, FR-007; T008:
repo-map hygiene, no specific FR; T009: FR-014, spec.md Assumptions) exactly, with no judgment
calls beyond the concurrency-group reasoning documented above (which concludes "no change," not a
deviation from the shipped T002 file). Accuracy note per the task brief: this report states
`10/10` only for a full, unflagged `./init.sh` run and `8/8` only for `--skip-build` runs — never
conflating the two — consistent with the correction already recorded in Run 1/Run 2 above.
