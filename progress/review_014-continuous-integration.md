# Review: 014-continuous-integration — T001 increment

**Scope reviewed**: `git diff init.sh` only (T001 — the `--skip-install` flag). HEAD is branch
`014-continuous-integration`, uncommitted working tree, cut from `main` @ `96553ab`. T002+ (the
GitHub Actions workflow file) is explicitly NOT in scope — not yet started.

## What changed (verified by reading `git diff init.sh` directly, not from the report)

- Header comment `Usage:` line: `[--skip-install]` appended.
- New `SKIP_INSTALL=false` var, `--skip-install) SKIP_INSTALL=true ;;` case, matching the
  existing four-flag pattern exactly.
- `--help` output: usage line updated; new two-line description added, column-aligned with the
  existing `--skip-native` line (verified programmatically — both option columns and the
  continuation line's indent land on column 18).
- Stage 3 ("Installing dependencies"): `if SKIP_INSTALL: add_result "npm install" "OK" "skipped
  (--skip-install) — dependencies already installed by the caller"`, else the original
  `npm install` branch, byte-for-byte unchanged.
- Diffed `init.sh` directly against `main`'s copy (`git show main:init.sh`) to confirm no other
  line anywhere in the file differs — confirms the change is genuinely scoped to exactly these
  four spots, nothing else touched.

## Independent verification (not trusting the implementer's report)

**(a) `./init.sh` with no flags — full run, no `--skip-build`, allowed to run all three real
`expo export` stages (~15s wall on this machine, cached exports):**

```
✅ [OK] Prerequisites: node v20.20.2, npm v10.8.2
✅ [OK] Env file: .env already exists, left untouched
✅ [OK] npm install: dependencies installed
✅ [OK] Type-check: no type errors
⚠️  [WARN] expo-doctor: issues found (non-blocking) — Found outdated dependencies ... 2 checks failed
⚠️  [WARN] Native deps: peers declared, but some package versions differ ... expo-image-picker@15.0.7,
    react-native@0.74.0, react-native-safe-area-context@4.10.1, @types/react@18.3.31, typescript@5.9.3
✅ [OK] Tests: all tests passed
✅ [OK] Build check (web): web bundle exported cleanly
✅ [OK] Build check (ios): ios bundle exported cleanly
✅ [OK] Build check (android): android bundle exported cleanly
RESULT: SUCCESS (10/10 stages passed)
```

**Discrepancy vs. the acceptance bar's literal "(8/8 stages passed)" wording**: the actual count
is 10/10, not 8/8. I independently confirmed this is **pre-existing and not caused by this
diff**: `git show main:init.sh` (unmodified `main`) has the identical stage-8 logic that calls
`add_result` once per platform (web/iOS/Android) when not skipped — 7 phases + 3 per-platform
results = 10 `add_result` calls, regardless of this feature. The two WARN stages are exactly the
two pre-existing, expected ones, unaltered in grading. Not a defect in this diff; the "8/8"
figure in the acceptance bar / spec.md's prose appears to be carried over from `init.sh
--skip-build`'s count (where stage 8 collapses to one WARN result, 7+1=8), not the unflagged
run's actual count. Flagging for the record, not blocking T001.

**(b) `./init.sh --skip-install`, run with `node_modules` already present:**

- Stage 3 reported `✅ [OK] npm install: skipped (--skip-install) — dependencies already
  installed by the caller` — exact wording match to spec/task text.
- `rm -f /tmp/init-sh-front-npm-install.log` before the run, confirmed absent after — direct
  proof `npm install` never executed.
- Exit code of the `init.sh --skip-install` invocation itself: `0`.
- Stage grading otherwise identical to run (a): same two WARNs, same OK/PASS everywhere else,
  `RESULT: SUCCESS (10/10 stages passed)`.

**Type-check and test suite, run standalone (not just via `init.sh`)**:
- `node_modules/.bin/tsc --noEmit` → exit 0, no output.
- `npm test` → `Test Suites: 85 passed, 85 total`, `Tests: 630 passed, 630 total`.

Both match `init.sh`'s own stage 4/7 results — no reason to doubt the script's grading.

## Evaluation against review's specific attention points

1. **Genuinely additive / default path byte-for-byte unchanged?** Yes. The unflagged run's
   stage-3 branch (`elif npm install ...; else ... FAIL ...`) is character-identical to `main`'s.
   Confirmed by direct diff against `main:init.sh`, not just by re-running the script.

2. **`--skip-install` grading `OK` vs. the other four flags' `WARN` — inconsistency or
   justified?** Justified, and I checked the reasoning rather than taking it on faith:
   `--skip-doctor`/`--skip-tests`/`--skip-build`/`--skip-native` each genuinely *omit* a category
   of verification with nothing else in the script covering what was skipped — `WARN` correctly
   signals "this run's coverage is reduced." `--skip-install` is categorically different:
   dependency installation still happened, just performed by the caller (`npm ci`, stricter than
   `init.sh`'s own `npm install`) rather than by this script — no verification is actually
   omitted. And critically, if `node_modules` were genuinely missing or broken despite the flag,
   stage 4 (type-check) independently fails with `"node_modules/.bin/tsc not found after
   install"` — so a real problem does not get masked by stage 3's `OK`, it just gets caught one
   stage later with an equally explicit message. `OK` is the more accurate grading here, not a
   sloppy inconsistency.

3. **Could this let a real dependency-install failure pass silently in CI?** Not within T001's
   own scope — the flag only changes what stage 3 *reports*; it never runs `npm install` itself
   when set, and downstream stages still depend on a real, working `node_modules`. The actual
   safety net for a real install failure in CI depends on T002 (not yet written) treating the
   workflow's own `npm ci` step as fail-fast (a step failure fails the job before `init.sh` is
   even invoked) — correctly deferred to that not-yet-reviewed task, and plan.md documents this
   intent explicitly. Nothing in T001 itself introduces a silent-pass risk.

4. **Usage/help text and header comment accurate and consistent?** Yes — verified the `--help`
   output's new two lines are column-aligned with the pre-existing `--skip-native` line (both
   option-name columns and the wrapped continuation line land on the same column), and the header
   comment's `Usage:` line matches the flag-parsing loop exactly.

## Traceability

| FR / Task | Requirement | Where verified |
|---|---|---|
| FR-005 (spec.md), T001 (tasks.md) | `init.sh` gains additive `--skip-install`; stage 3 reports OK-with-detail instead of running `npm install`; every other stage unmodified | `init.sh` diff (4 scoped hunks) + runs (a) and (b) above, independently reproduced |

No `src/domain`/`src/lib` code, no screens, no component tests apply to this task (pure bash
tooling) — Level 1/2 of `docs/verification.md` are N/A here, consistent with `tasks.md`'s own
framing ("no application code... Levels 1–2 do not apply").

## CHECKPOINTS.md walkthrough (C1–C6)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 (confirmed independently twice, flagged and unflagged; the two
      pre-existing WARNs are the documented exception).

**C2 — state is coherent**
- [x] At most one feature `in_progress` (`feature_list.json`: only `014-continuous-integration`).
- [x] Every `done` feature has passing tests/manual verification (unaffected by this diff; not
      re-audited here — out of this review's scope).
- [x] `progress/current.md` describes only the active session (014), no stale leftover content.

**C3 — architecture respected**
- [x] N/A — no `src/` or `app/` files touched (confirmed via full working-tree diff/status; only
      `init.sh`, `feature_list.json`, `progress/current.md` modified, plus untracked spec/progress
      files for 014 and unrelated 012 in-flight work).
- [x] No business logic embedded anywhere relevant — this is repo tooling, not application code.
- [x] Platform-specific-code convention N/A (no UI).
- [x] No direct DB/storage/backend access — N/A, script only shells out to `npm`/`node`/`npx`.
- [x] No new global state library.
- [x] No stray `console.log`/context-free `TODO`.

**C4 — verification is real**
- [x] N/A `src/domain` — none touched.
- [x] N/A screens — none touched.
- [x] `./init.sh`'s build checks pass for all three targets, Native dependency alignment stage is
      WARN (pre-existing), not FAIL — confirmed by direct re-run, not by trusting the report.

**C5 — session closed well**
- [~] Not yet applicable — this is a mid-feature increment review, not an end-of-session close.
      No suspicious untracked files beyond the explicitly out-of-scope items named in the task
      brief (`specs/012-home-visual-alignment/`, `progress/impl_014-continuous-integration.md`).
      `progress/history.md` has no 014 entry yet — expected, since the session hasn't closed.

**C6 — Spec Driven Development**
- [x] `014-continuous-integration` (`sdd: true`, `in_progress`) has `spec.md` + `plan.md` +
      `tasks.md` under `specs/014-continuous-integration/`.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers (states this explicitly in its own
      Status line; independently confirmed by reading the full document — none present).
- [~] N/A — feature not yet `done`, so "every done feature's tasks.md fully `[X]`" doesn't apply
      yet. `tasks.md` correctly shows only T001 as `[X]`, all others `[ ]`.
- [x] FR traceability: T001 cites FR-005 and the specific plan.md Research Decision it
      implements; the only testable artifact for this task (`init.sh`'s own behavior) was
      independently re-verified above rather than taken from the report.

No empty/blocking box in C1–C6 for the T001 increment specifically.

## Findings

None blocking. One non-blocking observation:

- **Nit**: the `8/8` vs actual `10/10` stage-count figure appears in this feature's own kickoff
  brief/acceptance framing (not in `init.sh` or in this diff) and is pre-existing, unrelated to
  T001. Worth a one-line correction in `plan.md`/`spec.md`'s prose in a later polish pass so a
  future reader isn't confused by the mismatch, but it is not this task's defect and not worth
  blocking on.
- **Nit**: the reasoning for why `--skip-install` grades `OK` rather than `WARN` (distinct in
  kind from the other four skip flags — install genuinely happened, just elsewhere) currently
  lives only in `plan.md`/the implementer's progress report, not as an inline comment in
  `init.sh` itself next to the `SKIP_INSTALL` branch. A short comment there would help a future
  reader who only has the script open, though `init.sh`'s existing convention of not commenting
  every branch makes this optional per `docs/conventions.md`'s "default to none" comment policy.

## Verdict

**APPROVE**

T001 is exactly what it claims to be: a small, genuinely additive change, independently
re-verified (not taken on the implementer's word) to leave the default `./init.sh` path
byte-for-byte behaviorally unchanged, and to make `--skip-install` do precisely what FR-005 and
the T001 task text specify, with accurate help/usage text. No constitution, convention, or
CHECKPOINTS violation found in the T001 diff itself. T002 onward (the actual workflow file)
remains correctly unstarted and is not covered by this review.

---

# Review: 014-continuous-integration — T002 increment

**Scope reviewed**: the new file `.github/workflows/ci.yml` only (T002). T001 (`init.sh
--skip-install`) was reviewed and APPROVED in the prior increment above; re-diffed here
(`git diff main -- init.sh`) to confirm it is byte-for-byte identical to what was already
approved — it is (only the header comment, flag-parsing loop, `--help` text, and stage 3's
branch differ from `main`, exactly as before). T003–T009 are correctly not started (T003/T004
need a human-authorized push/PR; T005 is a separate, individually-reviewable increment; T006/T007
depend on merge; T008/T009 are polish docs, not yet touched — `grep -n "ci.yml\|.github"
AGENTS.md docs/verification.md` returns nothing, confirming T008/T009 genuinely not started).

## What changed

One new file, `.github/workflows/ci.yml` (20 lines). Nothing else in the working tree differs
from the T001-approved state except `specs/014-continuous-integration/tasks.md` (T002 checked)
and the progress files. No `app/`/`src/` files touched (FR-015).

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

Independently re-parsed with `node -e "require('js-yaml').load(...)"` (not trusting the
implementer's report's own parse) — structure matches exactly, `on` resolves to the intended
`pull_request` mapping, not a stray boolean coercion.

## Independent verification performed (not trusting the implementer's claims)

- `node_modules/.bin/tsc --noEmit` → exit 0, no output.
- `npm test` → `Test Suites: 85 passed, 85 total`, `Tests: 630 passed, 630 total`.
- `time npm ci` (real, from a warm `~/.npm` cache on this machine) → 11.6s wall, 1508 packages,
  0 failures.
- `time ./init.sh --skip-install` (full run, unflagged apart from `--skip-install`, all three
  real `expo export` stages) → 17.1s wall on this machine, `RESULT: SUCCESS (10/10 stages
  passed)`, the same two pre-existing `WARN`s (expo-doctor, native dependency alignment), zero
  `FAIL`.
- `git ls-files -s init.sh .nvmrc package-lock.json .env.example` → confirms `init.sh` is mode
  `100755`, and all three supporting files are tracked (re-verifying the orchestrator's stated
  facts rather than taking them on faith).
- `git check-ignore -v .env` → confirmed `.gitignore` ignores `.env`, consistent with
  `init.sh` stage 2 self-provisioning it from the tracked `.env.example`.
- Read `src/lib/supabase-client.ts` directly — confirmed the placeholder-host fallback
  (`https://placeholder.supabase.co` / `"placeholder-anon-key"`) is real code, not asserted.
- Checked for a native-binary dependency (`sharp`) that could behave differently on a Linux
  runner during `expo export`'s asset processing: absent from `package.json`,
  `package-lock.json` (`grep -c sharp` → 0), and `node_modules`; `@expo/image-utils` (the
  package `expo export` actually uses for image work) depends on `jimp-compact`, a pure-JS
  library — no native binary in the export path this project actually exercises.
- Re-diffed `init.sh` against `main` — identical to the already-approved T001 diff, nothing new.

## Evaluation against the review's six specific attention points

**1. Will this pass on a fresh `ubuntu-latest` runner?**

Yes, with high confidence, reasoning through each of `init.sh`'s 8 stages as they'd run there:

- Stage 1 (prerequisites) — `node`/`npm` on PATH: guaranteed by `actions/setup-node` running
  before `init.sh` in the workflow.
- Stage 1's Node-major check (`REQUIRED_NODE_MAJOR=20`) — satisfied because `setup-node` reads
  `node-version-file: '.nvmrc'` (contents: `20`), so `node -v` will already report a v20.x
  runtime by the time `init.sh` runs; `init.sh`'s own nvm-sourcing block
  (`${NVM_DIR:-$HOME/.nvm}/nvm.sh`) is a no-op on a GitHub runner (no `nvm.sh` present, the
  `-s` test simply fails), which is harmless — it's belt-and-suspenders for local machines, not
  something CI depends on.
- Stage 2 (env file) — `.env.example` is tracked, so `cp .env.example .env` succeeds on a
  fresh clone with no prior state.
- Stage 3 — skipped via `--skip-install`, correctly reported `OK` (verified above).
- Stage 4 (tsc) — plain TypeScript, no native step; independently re-ran and it's clean.
- Stage 5/6 (expo-doctor, native dependency alignment) — both `npx --yes` invocations of
  pure-JS Expo CLI tooling; on a cold runner `npx` will download the package once (adds time,
  not risk of failure) since these packages aren't declared as `devDependencies` — this is
  expected, already true today for any local run without an `npx` cache.
- Stage 7 (jest) — plain Node/Jest, independently re-ran, 630/630 pass.
- Stage 8 (`expo export --platform web|ios|android`) — this is the one the review brief singled
  out. `expo export` bundles the JS module graph via Metro; it does not invoke Xcode or the
  Android SDK for a `--platform ios`/`--platform android` **export** (only a real native
  *build*, e.g. `expo prebuild` + Xcode/Gradle, would need those, and this repo does neither in
  CI or in `init.sh` — confirmed by reading `init.sh`'s own header comment, which states this
  explicitly and unprompted). The one plausible Linux-specific risk for this class of tooling —
  a native image-processing binary (`sharp`) needing a Linux-specific prebuilt binary — does not
  apply here: this project's asset-processing dependency chain (`@expo/image-utils`) uses the
  pure-JS `jimp-compact`, confirmed absent of `sharp` anywhere in the dependency tree (see
  Independent verification above). No other stage touches anything platform-native.
- Nothing in the run depends on developer-machine-only state: no reliance on a global npm
  cache, no assumption of pre-existing `node_modules` (the workflow's own `npm ci` step creates
  it fresh), no reliance on Watchman or any tool `init.sh`'s stage 1 doesn't itself check for.

**2. Is `timeout-minutes: 20` adequate?**

On this machine, with a warm `~/.npm` cache, `npm ci` took 11.6s and the full `--skip-install`
run (type-check, doctor, native-dep-check, 630 jest tests, and all three real `expo export`
stages) took 17.1s — total ~29s. That number is not directly transferable to a cold
`ubuntu-latest` runner (slower CPU, cold Metro bundler cache per platform, no `~/.npm` cache on
the very first run before `setup-node`'s cache is populated, `npx`-downloaded `expo-doctor`),
but it corroborates the plausibility of the kickoff brief's independent 8–15 minute estimate for
the full run — this is a small-to-medium Expo SDK 51 app (34 npm dependencies, 85 test files),
not a large monorepo, so multi-minute-per-`expo export`-platform numbers on a shared GitHub
runner are the expected order of magnitude, not tens of minutes. 20 minutes against an 8–15
minute estimate leaves roughly 33–150% headroom, which is a legitimate margin, not a hair-trigger
bound — the concern the review brief specifically wanted guarded against (a legitimately-passing
run getting cut off, inviting a subsequent weakening of the workflow) does not look justified by
either this machine's numbers or the estimate on record. I cannot verify actual `ubuntu-latest`
wall-clock time without a real run (which is explicitly T003's job, requiring human-authorized
push/PR, out of scope here) — this is a real limitation of a local-only review, disclosed rather
than papered over, but nothing found here suggests 20 minutes is too tight.

**3. Does the concurrency group behave correctly for both triggers?**

For the currently-live `pull_request` trigger (the only one T002 adds — `push` is deliberately
deferred to T005): `github.ref` for a `pull_request` event resolves to
`refs/pull/<PR-number>/merge`, which stays constant across every `synchronize` push to that PR's
head branch — so `ci-${{ github.ref }}` correctly groups all runs for the *same PR* together,
and `cancel-in-progress: true` correctly cancels a now-superseded run when a newer commit is
pushed to that same PR, exactly per FR-012 and spec.md's Clarifications. This is genuinely
correct for what T002 alone enables today.

For the future `push`-to-`main` trigger (T005, not yet added): `github.ref` for a `push` event
is `refs/heads/main` — constant for every push to `main`, so two pushes landing close together
would share a concurrency group, and the earlier run would be cancelled by
`cancel-in-progress: true`. This means a "push-to-main run being cancelled by a subsequent
merge" genuinely can happen once T005 lands. This is **not a defect introduced by T002** — it is
the literal, explicitly-settled design recorded in spec.md's own Clarifications ("For `main`, the
same logic applies... if two pushes to `main` land in quick succession, the older run is
cancelled in favor of verifying the newer, current commit") and in `feature_list.json`'s kickoff
notes. Restating it here because the review brief asked for it explicitly, not because it's an
unreviewed risk — a human already made this tradeoff deliberately, and T002's `concurrency:`
block (written once, ahead of T005, matching plan.md's Project Structure) is consistent with
that decision, not in conflict with it.

**4. Could this workflow report a false green?**

No mechanism found that would let a genuine failure surface as a pass:

- `npm ci` is its own workflow step, separate from `init.sh`. If it fails (e.g. a
  lockfile/`package.json` mismatch), the GitHub Actions step fails and the job fails
  immediately — `init.sh` is never reached, so `--skip-install` cannot mask an install failure
  (this addresses the review brief's specific worry about the `--skip-install`
  interaction directly: the *actual* dependency-install step CI depends on is `npm ci`, run
  before and independently of `init.sh`, not something `init.sh`'s stage 3 could paper over).
- `init.sh` itself uses `set -uo pipefail` (no `-e`, unchanged from the already-approved T001
  baseline) but every stage that can fail is guarded by an explicit `if cmd; then OK; else
  FAIL/WARN; fi` pattern that correctly captures the command's real exit status — verified by
  reading every stage in the file, not just the ones the task text called out. `print_summary_and_exit`
  correctly `exit 1`s if `STEPS_FAIL > 0`, and that exit code is the last thing the
  `./init.sh --skip-install` step runs, so GitHub Actions sees the real pass/fail signal.
  Independently re-confirmed the exit-code plumbing by re-running the script and inspecting its
  actual `RESULT:` line and stage-by-stage `[OK]/[WARN]/[FAIL]` output above, not by reading the
  code alone.
  - **Real behavioral bug found in this trace (see Findings), but not a new one introduced by
    T002**: the "Running test suite" stage's `npm run | grep -q '^  test$'` check can print an
    `npm error` line to stdout/stderr (observed live above: `npm error A complete log of this
    run can be found in: ...`) while still correctly reporting `[OK] Tests: all tests passed`
    afterward — cosmetic noise in the log, not a false-green, but worth naming since a CI log
    reader could mistake it for a real failure signal (SC-004 wants a reader to identify the
    broken stage from the log alone, and stray `npm error` text not attached to any actual
    failure works against that). This is inherited from `init.sh`'s stage 7, already
    present/approved in T001, and does not originate in T002's diff — noted for completeness, not
    attributed to this file.
- The WARN-vs-FAIL grading in `init.sh` (expo-doctor, native dependency alignment both graded
  `WARN`) is exactly what spec.md Acceptance Scenario 2 and SC-003 require CI to preserve, not a
  weakening invented for CI — the workflow does nothing to alter that grading (it just calls
  `init.sh` unmodified apart from `--skip-install`), so it's correct for CI's purposes by
  construction.

**5. Is `CI / verify` genuinely the check name T007 will find?**

Yes. `name: CI` at the workflow level and no `name:` override on the `verify` job (so its
display name defaults to its job id, `verify`) produces GitHub's standard
`<workflow name> / <job name>` check-name format: `CI / verify`, matching plan.md's Interface
Contracts section and what `tasks.md` T007 tells the human to search for. Confirmed by reading
the YAML directly (`jobs.verify` has no `name:` key) rather than assuming plan.md's claim is
correct.

**6. Anything pinned loosely enough to drift or break silently?**

- `actions/checkout@v4` and `actions/setup-node@v4` are pinned to major-version tags, not a
  commit SHA. This is standard, widely-used GitHub Actions practice for first-party actions (not
  a third-party marketplace action needing SHA-pinning per typical supply-chain guidance), and
  plan.md's Research Decisions explicitly considered and accepted this ("no third-party
  marketplace action needed... no new dependency to vet or pin-by-SHA beyond GitHub's own
  actions"). A minor version bump within `v4` could in principle change behavior under this repo
  without a visible diff — worth naming as a nit, not a blocker, since it's an explicit,
  documented choice rather than an oversight.
- `runs-on: ubuntu-latest` — GitHub periodically rolls the underlying image; a low-risk, industry
  -standard drift vector shared by virtually every GitHub Actions workflow, not specific to this
  one. Nit only.
- Node version is **not** independently hardcoded anywhere in the workflow — it comes solely from
  `.nvmrc` via `node-version-file`, so there is no second version string to drift out of sync
  (this is exactly what FR-003 requires, and it's satisfied cleanly).

## Traceability

| FR (spec.md) | Requirement | Satisfied by | Independently checked |
|---|---|---|---|
| FR-001 | trigger on `pull_request` targeting `main`, default activity types | `on.pull_request.branches: [main]` | Yes — read YAML directly, re-parsed with `js-yaml` |
| FR-003 | pin Node from `.nvmrc`, no hardcoded second version | `setup-node` `node-version-file: '.nvmrc'` | Yes — confirmed no other Node version string in the file; `.nvmrc` contents `20` |
| FR-004 | install via `npm ci`, never `npm install` | dedicated `run: npm ci` step | Yes — re-ran `npm ci` for real, 11.6s, 0 failures |
| FR-005 | reuse `./init.sh` via new `--skip-install` flag | `run: ./init.sh --skip-install` | Yes — re-ran for real, stage 3 reports `OK`/"skipped" |
| FR-006 | full 8-stage run on PRs, no other skip flags, one job/one command | only `--skip-install` passed | Yes — confirmed no `--skip-build`/`--skip-native`/`--skip-doctor`/`--skip-tests` present |
| FR-008 | zero repository secrets referenced | no `env:` block anywhere in the file | Yes — grepped the file, confirmed absent; read `supabase-client.ts`'s placeholder fallback directly |
| FR-010 | cache `~/.npm` via `setup-node`'s built-in cache, keyed on lockfile | `cache: 'npm'`, `cache-dependency-path: package-lock.json` | Yes — read YAML directly |
| FR-011 | bounded job timeout | `timeout-minutes: 20` | Yes — reasoned about adequacy above (point 2) |
| FR-012 | concurrent runs for the same ref deduplicated | `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }` | Yes — reasoned through `github.ref` semantics for both trigger types above (point 3) |
| FR-013 | `GITHUB_TOKEN` scoped to minimum (`contents: read`) | `permissions: contents: read` at workflow level | Yes — read YAML directly, no per-job override |
| FR-015 | no `app/`/`src/` code, no app behavior change | one new file under `.github/` only | Yes — `git status`/`git diff --stat` confirm no `app/`/`src/` files touched |

FR-002/FR-007 (push trigger) and FR-009 (PR-as-first-real-test) are correctly **not** claimed by
T002 — they belong to T005 and T003 respectively, both still open in `tasks.md`, consistent with
the task's own scope statement ("Do not add `on.push` yet — that is T005").

## `tasks.md` checklist status (re-read directly, not from the report)

- [X] T001 — `init.sh --skip-install` (previously reviewed/approved; re-confirmed unchanged).
- [X] T002 — `.github/workflows/ci.yml` created, matches the task text field-for-field.
- [ ] T003 — open PR, observe real pass + real correctly-attributed fail + revert-to-pass; blocked
  on human-authorized push, correctly not started.
- [ ] T004 — confirm zero repo secrets on GitHub's side; depends on T003's PR existing.
- [ ] T005 — add `on.push`; correctly deferred, its own reviewable increment.
- [ ] T006, T007, T008, T009 — all correctly open/unstarted, consistent with their stated
  dependencies (merge, human action, polish-after-T002).

## CHECKPOINTS.md walkthrough (C1–C6), for the T002 increment specifically

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 (re-run independently above; the two pre-existing WARNs are the
      documented exception).

**C2 — state is coherent**
- [x] At most one feature `in_progress` (`014-continuous-integration` only).
- [x] Every `done` feature has passing tests/manual verification — unaffected by this diff.
- [x] `progress/current.md` describes only the active session.

**C3 — architecture respected**
- [x] N/A `src/domain` — untouched.
- [x] N/A component/business-logic placement — no UI or business logic in this diff, pure CI
      config plus (already-approved) shell script tooling.
- [x] Platform-specific-code convention — N/A, no UI.
- [x] No direct DB/storage/backend access — the workflow calls no backend, no Supabase table;
      confirmed no `env:` secrets and no API calls anywhere in the file.
- [x] No new global state library.
- [x] No stray `console.log`/context-free `TODO` in the new file.

**C4 — verification is real**
- [x] N/A `src/domain` unit tests — none touched.
- [x] N/A component tests — no screen touched.
- [x] `./init.sh`'s build checks pass for all three targets, Native dependency alignment stage is
      WARN (pre-existing), not FAIL — re-confirmed by direct re-run above, not trusted from the
      report.

**C5 — session closed well**
- [~] Not yet applicable — mid-feature increment, not a session close. No suspicious untracked
      files beyond the explicitly out-of-scope items named in the task brief.

**C6 — Spec Driven Development**
- [x] `014-continuous-integration` (`sdd: true`, `in_progress`) has `spec.md` + `plan.md` +
      `tasks.md`.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers (independently re-read in full).
- [~] N/A — feature not `done` yet; `tasks.md` correctly shows only T001/T002 `[X]`.
- [x] FR traceability — T002's task text cites the exact FRs the YAML actually satisfies (see
      Traceability table above); no FR claimed that isn't genuinely met, and FR-002/007/009 are
      correctly *not* claimed since they aren't yet implemented.

No empty/blocking box in C1–C6 for the T002 increment specifically.

## Findings

None blocking.

- **Nit** (pre-existing, inherited from the already-approved T001 baseline, not introduced by
  T002): the "Running test suite" stage's `npm run | grep -q '^  test$'` existence check can
  make `npm` print a stray `npm error ... debug-0.log` line to the console even on a run that
  ultimately reports `[OK] Tests: all tests passed` (observed live in this review's own run
  above). It's cosmetic (doesn't affect grading or exit code) but works slightly against SC-004's
  "identify the broken stage from the log alone" goal, since a reader skimming a CI log could
  momentarily mistake it for a real error. Worth a follow-up cleanup in `init.sh` (e.g. checking
  `package.json`'s `scripts.test` directly with `node -e` instead of parsing `npm run`'s human
  -oriented listing output) — not this feature's scope to fix, and not a reason to block T002.
- **Nit**: `actions/checkout@v4`/`actions/setup-node@v4` are pinned to major-version tags, not a
  commit SHA — a deliberate, documented choice per plan.md, standard practice for first-party
  GitHub Actions, but worth a one-line note if this repo ever tightens its supply-chain posture.
- **Disclosed limitation, not a defect**: this review cannot observe real `ubuntu-latest`
  wall-clock timing or confirm the Linux `expo export` path executes cleanly end-to-end without
  T003's actual PR run — by design, T003 is the task that produces that evidence, and it requires
  human-authorized push/PR access this review does not have. Everything checkable without that
  access (dependency-tree native-binary audit, YAML structure, exit-code plumbing, FR-by-FR
  literal correctness, local timing as a lower bound) was checked and found sound.

## Verdict

**APPROVE**

T002 is exactly what `tasks.md` specifies and what `plan.md`'s Project Structure/Interface
Contracts documented in advance: a minimal, correctly-scoped `.github/workflows/ci.yml` that
triggers only on `pull_request` (leaving `push` to T005 as its own increment), pins Node from
`.nvmrc`, installs via `npm ci` as a step separate from `init.sh`, reuses `./init.sh
--skip-install` as the single source of truth for "verified," caches only `~/.npm`, bounds the
job to 20 minutes, deduplicates concurrent runs correctly for the trigger it actually adds,
scopes `GITHUB_TOKEN` to read-only, and references zero secrets. Independently re-verified
(`tsc`, `npm test`, a real `npm ci`, a real full `./init.sh --skip-install` run, a dependency
-tree audit for Linux-hostile native binaries, and a fresh YAML re-parse) rather than taken on
the implementer's word. No constitution, convention, or CHECKPOINTS violation found. The one
real open question — actual runner wall-clock time and a genuine red/green cycle — is correctly
deferred to T003, which needs human authorization this review does not have and should not
grant itself.

---

# Increment review: T005 + T008 + T009 (final agent-completable increment)

**Scope reviewed**: `.github/workflows/ci.yml` (T005 — `on.push.branches: [main]` added),
`AGENTS.md` (T008 — one repo-map row), `docs/verification.md` (T009 — new `## CI` section), and
the T005/T008/T009 checkbox flips in `specs/014-continuous-integration/tasks.md`. T001/T002
re-confirmed unchanged/unregressed, not re-reviewed from scratch. T003/T004/T006/T007 correctly
left unchecked (human-only or merge-dependent) — not evaluated for completeness, per instruction.

## What changed (verified directly, not from the implementer's report)

- `.github/workflows/ci.yml`: `on:` now has both `pull_request.branches: [main]` and
  `push.branches: [main]` under the one job `verify`. `name`, `permissions: contents: read`,
  `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`, `runs-on:
  ubuntu-latest`, `timeout-minutes: 20`, and all four steps are byte-for-byte identical to the
  already-approved T002 file (confirmed by inspection — nothing beyond the `push:` block moved or
  changed). Re-parsed with `./node_modules/.bin/js-yaml` — valid, one job, four steps, matches
  `plan.md`'s Project Structure exactly.
- `AGENTS.md`: one new row in the §2 repo-map table, directly under `init.sh`'s row, same
  three-column `Path | What it holds | Read it when` shape and terse tone as every neighboring row.
- `docs/verification.md`: a new `## CI` section (2 short paragraphs, ~12 lines) inserted between
  "Test tooling isn't installed yet" and "## Levels of verification". Levels 1–5 are untouched
  (diffed directly — the section boundary is clean, no renumbering).
- `specs/014-continuous-integration/tasks.md`: T005, T008, T009 flipped to `[X]`. T003, T004,
  T006, T007 remain `[ ]`.

## 1. The concurrency decision — assessed independently

`github.ref` for a `push` event is `refs/heads/main`; for a `pull_request` event it is
`refs/pull/<N>/merge`. These are categorically different strings for any PR against `main`, so
`concurrency.group: ci-${{ github.ref }}` genuinely never lets a `pull_request` run collide with,
or cancel, a `push`-to-`main` run — the implementer's claim is correct, confirmed independently
against documented GitHub Actions `github.ref` semantics, not taken on their word.

The remaining case — two `push`-to-`main` events landing close together, where the first run gets
cancelled before completion — is real, and the implementer's own report calls it out rather than
hiding it. Checked this against spec.md directly (fresh read, not the implementer's paraphrase):
the Clarifications section states verbatim, "if two pushes to `main` land in quick succession, the
older run is cancelled in favor of verifying the newer, current commit," and FR-012 restates this
as a MUST ("Concurrent runs for the same ref MUST be deduplicated"). This is not a gap the
implementer introduced or a corner the spec failed to consider — it is the literal, explicitly
authored design of the spec (already-approved prior to T005; T005 only added the `push` trigger
that makes this codepath reachable at all, it did not touch the concurrency block). It is also
consistent with FR-002/FR-007: those requirements govern that the *identical* job runs on `push`,
not that every individual `push` commit gets a guaranteed completed run — User Story 2's own
stated purpose is "main's actual state is checked," i.e. the state of `main`'s current HEAD, which
the newer of two rapid pushes already supersedes. The consequence (an intermediate `main` commit,
if such a push sequence occurs, never gets its own completed check) is a real, disclosed
trade-off, not a silent one — and it is squarely a spec-level trade-off already litigated and
signed off at spec_ready, not something T005 could unilaterally fix without deviating from an
already-approved requirement. No finding here; correctly implemented per spec, and correctly
flagged as a considered decision rather than an oversight in the implementer's own report.

## 2. Factual accuracy of T008/T009 prose

Independently re-ran to check every claim rather than trusting the report:

- `tsc --noEmit`: clean, no errors.
- `npm test`: 85 suites / 630 tests, all passing.
- `./init.sh --skip-install --skip-build`: `RESULT: SUCCESS (8/8 stages passed)`, exit code `0`,
  both pre-existing issues (expo-doctor, native dependency alignment) reported as `WARN`, not
  `FAIL` — confirms the WARN-not-FAIL claim in the new `## CI` section is accurate, not aspirational.
- Neither `AGENTS.md`'s new row nor `docs/verification.md`'s new `## CI` section states a stage
  count anywhere (unlike an earlier increment's doc text, which had stated `8/8` for the
  unflagged run and had to be corrected) — this increment sidesteps that failure mode entirely by
  not repeating a number that depends on which flags are passed.
- Check name `CI / verify`: matches the workflow file's `name: CI` + job id `verify`, and matches
  `plan.md`'s Interface Contracts, which documents GitHub's `<workflow name> / <job name>` format
  correctly.
- Trigger description ("every pull request targeting `main` and every push to `main`"): matches
  the actual `on:` block verified above.
- T007/branch-protection status: `docs/verification.md`'s new section explicitly states
  `CI / verify` is "**not yet enabled**" as a required check and warns the reader not to conflate
  "CI exists" with "CI is required" — this is accurate (T007 is genuinely unchecked and unapplied)
  and is the one place a careless reader could otherwise wrongly conclude `main` is protected; the
  new text actively guards against that misreading rather than being silent about it. No
  overstatement found anywhere in either file.

## 3. Placement/structure and tone

- `docs/verification.md`: the new `## CI` section sits between the existing "Test tooling isn't
  installed yet" section and `## Levels of verification`, at the same `##` heading level as its
  neighbors. Levels 1–5 are untouched (diff confirms no lines changed inside them, no
  renumbering). Length (~12 lines, 2 paragraphs) matches the file's existing terse style and
  `plan.md`'s stated intent ("one short addition... not rewriting the existing Levels 1-5").
- `AGENTS.md`: the new row uses the same `Path | What it holds | Read it when` column shape,
  backtick-quoted path, and imperative "when to read it" phrasing as every other row in the table
  (compared directly against the `init.sh` and `docs/verification.md` rows it sits beside). No
  tone mismatch.

## 4. FR-015 (no `app/`/`src/` changes, no app-behavior change) across the whole branch

`git diff main...HEAD --stat -- app/ src/` returns empty — zero files under `app/` or `src/`
touched anywhere on this branch (the one prior `init.sh` change from T001 is repo tooling, not
`app/`/`src/`, and was already reviewed/approved). Confirmed directly from git, not from the
report's assertion. FR-015 holds for the feature as a whole, including this increment (T005/T008/
T009 touch only `.github/workflows/ci.yml`, `AGENTS.md`, `docs/verification.md`,
`specs/014-continuous-integration/tasks.md`).

## Traceability (this increment)

| Task | FR(s) claimed | Verified |
|---|---|---|
| T005 | FR-002 (push trigger), FR-007 (identical job) | Yes — `on.push.branches: [main]` added, same `verify` job, no duplication (YAML re-parsed) |
| T008 | repo-map hygiene, no specific FR | Yes — row added, matches table format |
| T009 | FR-014, spec.md Assumptions | Yes — CI-vs-required distinction stated accurately, Levels 1–5 untouched |

## `tasks.md` checklist status (full file, re-confirmed)

`[X]` T001, T002, T005, T008, T009. `[ ]` T003, T004, T006, T007 (all four are out of this
increment's and this review's scope per the task brief — not evaluated, not flagged).

## CHECKPOINTS.md C1–C6 walkthrough (this increment)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 (re-run directly above, `--skip-install --skip-build`, WARNs only).

**C2 — state coherent**
- [x] Exactly one feature `in_progress` (`014-continuous-integration`) in `feature_list.json`.
- [~] N/A — feature not `done` yet.
- [x] `progress/current.md` not part of this increment's scope (pre-existing modification, left
      untouched per instruction) — not evaluated further.

**C3 — architecture respected**
- [x] No `src/domain` changes at all this increment.
- [x] No UI component changes.
- [x] No platform-conditional code added.
- [x] No direct DB/storage access — N/A, no app code touched.
- [x] No new global state library.
- [x] No stray `console.log`/context-free `TODO` introduced (YAML and Markdown only).

**C4 — verification real**
- [x] N/A unit tests — no `src/domain` change.
- [x] N/A component tests — no screen touched.
- [x] `./init.sh`'s build checks: re-run directly (`--skip-build` variant), `SUCCESS`, WARNs only,
      no FAIL. (Full unflagged run and Linux-runner-specific behavior already exercised/approved
      in the T001/T002 increments; this increment made no change that would affect them.)

**C5 — session closed well**
- [~] Not applicable — mid-feature increment, not a session close. No new suspicious untracked
      files introduced by this increment beyond the ones already named out-of-scope in the task
      brief (`specs/012-home-visual-alignment/`, `feature_list.json`, `progress/current.md`).

**C6 — Spec Driven Development**
- [x] `spec.md` + `plan.md` + `tasks.md` all exist for this `sdd: true` feature.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers (fresh re-read).
- [~] N/A — feature not `done` yet; `tasks.md` correctly shows T003/T004/T006/T007 still `[ ]`.
- [x] FR traceability for T005/T008/T009 — see table above; no FR over-claimed.

No empty/blocking box in C1–C6 for this increment.

## Findings

None blocking.

- **Nit**: `docs/verification.md`'s new `## CI` section and `AGENTS.md`'s new row both correctly
  avoid restating a stage count — a deliberate, good choice given this exact class of number
  (`8/8` vs `10/10`, flag-dependent) was the source of a real correction earlier in this feature.
  No action needed; noted as a positive rather than a defect.
- **Disclosed limitation, not a defect**: as with the T002 increment, this review cannot observe
  a real GitHub-hosted `push`-triggered run firing against an actual `main` commit — that is T006,
  gated on T003's PR having merged, which requires human-authorized push/PR access this review
  does not have and should not grant itself. Everything checkable without that access (YAML
  structure and diff-scoping, concurrency-group semantics, `tsc`, `npm test`, a real local
  `./init.sh` run, a full-branch `app/`/`src/` diff for FR-015) was checked directly.

## Verdict

**APPROVE**

T005 is a minimal, correctly-scoped addition (`on.push.branches: [main]`) that changes nothing
else in the already-approved T002 workflow file — verified by direct YAML re-parse and inspection,
not by trusting the diff description. The concurrency-group reasoning for why `push` and
`pull_request` runs cannot collide is technically correct (different `github.ref` values by
GitHub's own documented semantics), and the accepted consequence — a superseded `push`-to-`main`
run being cancelled — is the spec's own explicit, already-approved design (spec.md Clarifications
+ FR-012), not a gap this increment introduced or should have closed unilaterally. T008 and T009
are both factually accurate against a fresh, independent re-run of `./init.sh` and `tsc`/`npm
test`, correctly avoid restating the earlier stage-count mistake, do not overstate branch-
protection status (the opposite, in fact — the new text actively warns against that
misreading), and respect `docs/verification.md`'s and `AGENTS.md`'s existing structure and tone.
FR-015 holds across the entire branch, confirmed by a `main...HEAD` diff over `app/`/`src/`, not
just this increment's file list. This is the feature's final agent-completable increment; the
agent-side work is complete and correct. T003/T004/T006/T007 remain the only open items, and all
four are correctly and honestly left unchecked pending human action.
