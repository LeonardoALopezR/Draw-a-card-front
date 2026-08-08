# Implementation Report: 015-ci-test-timeout

## Run 1 — 2026-08-07 (T002–T005)

Scope for this run: **T002, T003, T004, T005 only**, per explicit instruction. T006 onward
(pushing the branch / opening this feature's own PR) was **not** attempted — it requires
explicit human authorization not given in this session. `tasks.md` has T002–T005 marked `[X]`;
T006 onward remain `[ ]`.

Branch state used (per the orchestrator's pre-verified starting point, not re-derived): HEAD
`015-ci-test-timeout`, cut from `main` @ `0589e03`. `main` already carries
`.github/workflows/ci.yml` (from 014) and `f02abb1` (init.sh `npm run` parsing fix +
`jest.config.js`'s `modulePathIgnorePatterns` entry) — both untouched by this run, confirmed via
`git diff` on `jest.config.js` showing only my additive `setupFiles` block.

T001's baseline (already measured by the orchestrator, used as-is, not re-measured):
`npx jest` → **630 passed / 630 total, 85 suites**. `npx jest --verbose 2>&1 | grep -c "not
wrapped in act"` → **44**.

### Files changed

- **`jest.setup.ts`** (new) — mocks `expo-font`'s `isLoaded` export to always return `true`,
  spreading the real module's other exports via `jest.requireActual("expo-font")`. Comment cites
  the actual code read from `node_modules/@expo/vector-icons/build/createIconSet.js`: each `Icon`
  instance's initial state is `{ fontIsLoaded: Font.isLoaded(fontName) }`; when `false` (always,
  under jest, since no real font asset loads in a test env), `componentDidMount` `await`s
  `Font.loadAsync(font)` then calls `this.setState({ fontIsLoaded: true })` — a state update
  landing after RTL's `render()` has already returned, unwrapped in `act()`. Forcing `isLoaded`
  to always report `true` means `Icon`'s constructor-time state is already `fontIsLoaded: true`,
  so that branch of `componentDidMount` never runs, for every icon family, with one mock of one
  function.

- **`jest.config.js`** — purely additive: added `setupFiles: ["<rootDir>/jest.setup.ts"]` plus an
  explanatory comment. Every pre-existing key (`preset`, `moduleNameMapper`,
  `modulePathIgnorePatterns`) is untouched — confirmed via `git diff -- jest.config.js` (diff
  below shows only the new block appended).

- **`specs/015-ci-test-timeout/tasks.md`** — T002, T003, T004, T005 marked `[X]`. T006 onward
  left `[ ]`.

No changes anywhere under `app/` or `src/` — nothing in this fix touches application runtime
behavior (FR-003). `src/features/identity/LoginScreen.test.tsx` is byte-for-byte unchanged.

### T003 — which jest hook was used, and how it was empirically determined

Per the task's instruction to determine `setupFiles` vs. `setupFilesAfterEnv` empirically rather
than by reasoning alone (note: jest has no `setupFilesAfterEach` config key — confirmed by
grepping `node_modules/jest-config/build/Defaults.js`, whose real keys are `setupFiles` and
`setupFilesAfterEnv`; `tasks.md`/`plan.md`'s "`setupFilesAfterEach`" wording appears to be a
typo for `setupFilesAfterEnv`, which is what I actually tested against):

1. Wired via `setupFiles` first, ran `npx jest --verbose | grep -c "not wrapped in act"` → `0`.
2. To test whether `setupFiles` was actually load-bearing (not just sufficient), I temporarily
   switched the same line to `setupFilesAfterEnv` and re-ran both a single icon-rendering suite
   (`Viewfinder.test.tsx`) and the full suite with `--verbose`. **Both also produced `0`.**
3. Conclusion, recorded honestly rather than the originally-assumed asymmetry: for this specific
   mock, both hooks work equally — each runs once per test file, before that file's own imports
   resolve, in the same fresh module registry, so `jest.mock("expo-font", ...)` is registered in
   time either way. I kept **`setupFiles`** in the final config because `jest.setup.ts` needs no
   test-framework globals (`expect` matchers, RTL setup) — it's a pure module-registry mock,
   which is exactly what `setupFiles` (the pre-test-framework hook) is documented for — not
   because `setupFilesAfterEnv` was empirically shown to fail. `jest.config.js`'s comment states
   this accurately (I corrected an earlier draft of the comment that had overstated the
   difference before I'd actually run the `setupFilesAfterEnv` variant).

### T004 — act()-warning count, before/after, and an honest remaining finding

- **Before (T001 baseline, not re-measured, per instruction):** 44.
- **After (T002/T003's fix in place):** Ran `npx jest --verbose 2>&1 | grep -c "not wrapped in
  act"` **6 times** total across this session (not just once, since the count turned out to vary
  run-to-run — see below). Results: `0, 0, 0, 2, 0, 0`.
- **Every single occurrence across every run inspected is `"An update to HookContainer inside a
  test was not wrapped in act(...)"` — zero occurrences of `"An update to Icon inside a test was
  not wrapped in act(...)"` in any run** (confirmed separately via `grep -c "update to Icon
  inside a test was not wrapped"` → `0` on a fresh run). So: the `@expo/vector-icons`/`expo-font`
  warning this feature targets (FR-001/FR-004) is fully and consistently eliminated, 44 → 0,
  every time, with no exception observed.
- **The intermittent non-zero count (2/6 runs I directly observed produced 2, i.e. ~1/3) traces
  to a different, pre-existing, unrelated cause**: `src/features/identity/useKycGate.test.ts:60`
  (`QueryClientProvider` inside `@testing-library/react-native`'s `renderHook`) — the stack trace
  points at `@tanstack/query-core`'s `notifyManager.ts`, whose batched notifications are
  scheduled via a real `Timeout._onTimeout`, i.e. a genuine timer race, not anything to do with
  `expo-font`/`Icon`. I confirmed this is **pre-existing and not introduced by this fix**: with
  `jest.setup.ts` temporarily removed and `jest.config.js` reverted to `main`'s exact committed
  content (`git show HEAD:jest.config.js`), running `useKycGate.test.ts` in isolation 5 times
  produced `0, 0, 0, 0, 0` — i.e. it didn't reproduce in that small sample either way, consistent
  with it being a low-probability timing race independent of this fix (I also saw `0, 0, 0, 0,
  0` on 5 more isolated runs of that same file *with* the fix in place, and only saw the `2`
  inside full-suite runs, suggesting worker/CPU contention from the rest of the suite affects
  the race's odds — exactly the kind of cross-suite resource-contention effect spec.md's
  Re-verification section already flagged as plausible, just for a different hook than the one
  the kickoff brief focused on).
- **I did not touch this.** It is out of FR-001/FR-004's scope (which target `@expo/vector-icons`
  specifically), it is not caused by `jest.setup.ts`, and per this task's explicit instruction I
  did not add a blanket console-warning suppressor or touch any assertion to make it disappear.
  Recording it honestly here as an unresolved, separate, flaky, pre-existing issue for a human
  or a future feature to decide whether it's worth its own investigation — it is not blocking
  T002–T005 (which only target the `@expo/vector-icons`/`expo-font` warning) and full runs still
  reported 630/630 regardless of whether it fired.
- All suite-runs (including the ones that hit the `HookContainer` warning) still reported `85
  passed, 85 total` / `630 passed, 630 total` — the flaky warning is a `console.error` emission,
  not a test failure.
- Spot-checked several additional icon-rendering suites individually with `--verbose` (repo-wide
  scope, relevant to US2/T011 though T011 itself is not in this run's assigned scope):
  `Viewfinder.test.tsx`, `TopRightControls.test.tsx`, `WebSidebarNav.test.tsx`,
  `WebBottomBarNav.test.tsx`, `EmptyResultsPanel.test.tsx`, `UploadDropzone.test.tsx` — all `0`.

### T005 — LoginScreen.test.tsx unchanged, full suite unchanged

- `git diff --stat -- src/features/identity/LoginScreen.test.tsx` → empty (zero lines changed).
- `npx jest src/features/identity/LoginScreen.test.tsx --verbose` → **11 passed, 11 total**,
  including the regression-guard test ("replaces SignInForm with the neutral 'Signing you in…'
  view on a successful sign-in and navigates nowhere") at **149ms** locally — same assertions as
  before (alert-role `login-signing-in` testID, `signIn` called with submitted credentials,
  `mockReplace`/`mockPush` never called), unchanged.
- Full suite: `npx jest` → **85 passed, 85 total suites / 630 passed, 630 total tests** — matches
  T001's baseline exactly. Zero new failures, zero assertions altered anywhere.
- `./init.sh --skip-install --skip-build`: **RESULT: SUCCESS (8/8 stages passed)** — type-check
  clean, tests all green, only the two known pre-existing WARNs (`expo-doctor` outdated deps,
  native dependency version drift), same as `docs/verification.md` documents as expected and
  non-blocking. `--skip-build` used per this session's instruction (fast path); full build
  export was not re-run in this session since neither `app/` nor `src/` nor bundler config was
  touched.

### What this run does and does not prove

Per this feature's own framing (spec.md Assumptions, restated in this session's brief): **a
green local run proves nothing about whether the CI timeout bug is fixed** — the bug is already
630/630 green locally today, before any of this session's changes. What this run establishes is
narrower and is stated as such, not oversold:

- The fix (`jest.setup.ts` + `jest.config.js`'s `setupFiles`) eliminates every observed
  `@expo/vector-icons`/`Icon` `act()` warning, consistently, across many runs (SC-003's local
  half).
- The fix introduces **zero** regressions: `LoginScreen.test.tsx` is byte-for-byte unchanged, all
  630 tests still pass, `./init.sh` is green.
- Whether this fix is *sufficient* to bring `LoginScreen.test.tsx`'s first test under 5000ms (or
  the 3000ms SC-001 margin) on a real, 2-core `ubuntu-latest` runner is **not established by
  anything in this run** and is not claimed here. That is T006/T007's job (this feature's own PR,
  watched to completion on real CI) — gated on explicit human authorization, not attempted in
  this session.

### Requirement traceability (this run's scope)

| FR / SC | Covered by |
|---|---|
| FR-001 (target the confirmed root cause, not `testTimeout`) | `jest.setup.ts`'s `expo-font` mock; no `testTimeout` added anywhere (confirmed: `grep -rn "testTimeout" jest.config.js jest.setup.ts` → no hits) |
| FR-002 (no assertion weakened) | T005 — zero diff to `LoginScreen.test.tsx`, all 11 assertions unchanged, all pass |
| FR-003 (no app runtime change) | Zero changes under `app/`/`src/` this run |
| FR-004 (repo-wide scope, single central mechanism) | `jest.setup.ts` is one file, wired globally via `jest.config.js`'s `setupFiles` — not per-suite; spot-checked across 7 distinct icon-rendering suites, all `0` |
| SC-002 (630/630, zero new failures) | T005 full-suite run: 85/85 suites, 630/630 tests |
| SC-003 (zero `act()` warnings from `@expo/vector-icons` after fix, local) | T004: zero `Icon`-specific warnings observed in any of 6+ runs; the only warnings observed are a separate, pre-existing, unrelated `HookContainer`/react-query timing race, explicitly not conflated with this feature's target |

### Deviations from plan.md / tasks.md worth flagging (none require sign-off, recorded for
completeness)

- `tasks.md`/`plan.md` use the name "`setupFilesAfterEach`" for the alternative hook; jest has no
  such config key. I tested the real alternative, `setupFilesAfterEnv`, and reported that instead
  — a factual correction, not a scope change.
- T004's original phrasing anticipated either "confirm 0" or "identify which suite(s) still warn
  and whether the cause is the same `expo-font`/`Icon` path or a different async `setState`." The
  actual result was a hybrid: the target warning is reliably 0, but an unrelated, flaky,
  pre-existing warning (react-query's `notifyManager`, in `useKycGate.test.ts`) surfaces
  intermittently (~1/3 of full-suite runs observed). Reported both facts explicitly per the
  task's own instruction not to paper over a partial result.

### Task status

- [X] T002
- [X] T003
- [X] T004
- [X] T005
- T006 onward: **not started**, left `[ ]` in `tasks.md` — requires explicit human
  authorization to push `015-ci-test-timeout` and open its own PR (per this feature's own
  Plan Amendment 2026-08-07, T006 no longer needs the throwaway-branch mechanism, but still
  needs authorization to push/open a PR at all).

## Run 2 — 2026-08-07 (T014–T015 only)

Scope for this run: **T014 and T015 only**, per explicit instruction. T016 (the push + real
CI run) was **not** attempted — that's the orchestrator's own job, not mine. T006–T013's
real-CI evidence (PR #10, run 31232122050; the `blocked` status; the two eliminated candidate
remedies) was already recorded in `tasks.md`/`spec.md`/`plan.md`/`feature_list.json` by a
prior session before this run started — I did not re-derive or re-litigate any of it, per
this run's own brief. `tasks.md` had T006, T007, T008 already marked `[X]` (with T009/T010
correctly left `[ ]` and annotated superseded/obsolete) on disk before I touched anything.

Read first, as instructed: `tasks.md`'s amended header, T014/T015 in full, plan.md's
"Bounding jest's worker concurrency in CI" Research Decision, spec.md's amended FR-001/FR-006
and measurement tables, `.specify/memory/constitution.md`, `docs/conventions.md`,
`docs/verification.md`. The root cause (jest worker-pool oversubscription, `--runInBand`
human-settled as the fix) was treated as settled, not re-derived.

### Files changed

- **`init.sh`** — additive-only edit to stage 7 ("Running test suite"). Added a `CI`-
  conditional: when `[ "${CI:-}" = "true" ]`, run `npm test -- --runInBand` instead of the
  existing unflagged `npm test`; everything else (the `SKIP_TESTS` branch, the no-`test`-
  script branch, the log file path `/tmp/init-sh-front-tests.log`, every `add_result` call)
  is byte-for-byte unchanged. Added a short comment above the block citing the actual
  measured numbers (69ms @ `--maxWorkers=1` vs 308ms @ jest's local default of 13 workers)
  and why the CI-only conditional lives here rather than in `jest.config.js` — per
  `docs/conventions.md`'s "only comment non-obvious why" convention.

  **One deviation from the task's literal wording, made for correctness, not scope creep**:
  T014's own text says `when [ "$CI" = "true" ]`. `init.sh` runs under `set -uo pipefail`
  (line 34) — referencing an unset `$CI` directly under `set -u` is a **fatal, immediate
  script-abort** in bash (confirmed: `bash -uo pipefail -c 'unset CI; [ "$CI" = "true" ]'` →
  `bash: CI: unbound variable`, exit 127), which would have broken every developer's local
  `./init.sh` run the moment they don't have a `CI` env var set (the overwhelming common
  case). Used `[ "${CI:-}" = "true" ]` instead — same conditional, safe under `set -u`,
  verified locally (see below) to produce byte-for-byte the same local behavior T014/FR-009
  actually require. Flagging this explicitly since it's a literal deviation from the task's
  exact quoted syntax, even though the resulting behavior is exactly what FR-009/FR-010 ask
  for.

- **`specs/015-ci-test-timeout/tasks.md`** — T014 and T015 marked `[X]`. T016–T018 left `[ ]`
  (not attempted — pushing/watching CI is the orchestrator's job per this run's brief).

No changes to `jest.config.js`, `jest.setup.ts`, `package.json`, or anything under `app/`/
`src/` (confirmed via `git diff` — empty for all four). `src/features/identity/
LoginScreen.test.tsx` is byte-for-byte unchanged (`git diff` empty).

### T015 — local verification, twice, with real numbers

**(a) No `CI` env var set — confirms the parallel path is unchanged (FR-009's local-
invisibility requirement):**

```
$ unset CI; npm test
Test Suites: 85 passed, 85 total
Tests:       630 passed, 630 total
Time:        2.266 s
```
(`726% cpu` per the shell's own `time` output — confirms multiple jest workers actually ran,
not accidentally serialized by something else.) This matches Run 1's T005 baseline (`./init.sh
--skip-install --skip-build`: SUCCESS 8/8, full suite green) and plan.md's own "~2.4s at jest's
default" local measurement almost exactly — the unflagged path is provably untouched by this
change.

**(b) `CI=true` — confirms the conditional actually activates and forwards `--runInBand`:**

1. Flag-forwarding re-confirmed generically first: `CI=true npm test -- --listTests` and
   `CI=true npm test -- --runInBand --listTests` both work, listing all 85 suite files —
   `npm test -- <flags>` correctly passes flags through to the underlying `jest` invocation
   (re-confirming plan.md's already-verified `--maxWorkers=2` finding, this time with
   `--runInBand` specifically).
2. Sanity check that jest itself doesn't silently change worker count just because `CI=true`
   is set (it doesn't — jest has no such auto-behavior for worker count): `CI=true npm test`
   (no explicit `--runInBand`) → `630 passed, 630 total`, **Time: 2.212 s**, `775% cpu` —
   statistically identical to the no-`CI` run. This confirms the speed difference measured
   next is attributable specifically to `init.sh`'s own `--runInBand` forwarding, not to jest
   reacting to the `CI` env var on its own.
3. **The actual `init.sh` conditional itself**, run for real:
   ```
   $ CI=true ./init.sh --skip-install --skip-build --skip-doctor --skip-native
   ▶ 7/8 Running test suite
   ✅ [OK] Tests: all tests passed (--runInBand, CI=true)
   RESULT: SUCCESS (8/8 stages passed)
   ```
   `/tmp/init-sh-front-tests.log` (the actual jest output from that run):
   ```
   Test Suites: 85 passed, 85 total
   Tests:       630 passed, 630 total
   Time:        9.7 s, estimated 25 s
   ```
   9.7s in-band vs 2.266s parallel — matches plan.md's predicted "~2.4s → ~9.8s" almost
   exactly. All 630 tests still pass; zero new failures.
4. **The target test's duration, specifically, under the real CI-only code path**:
   ```
   $ CI=true npx jest src/features/identity/LoginScreen.test.tsx --runInBand --verbose
   ✓ replaces SignInForm with the neutral 'Signing you in…' view on a successful
     sign-in and navigates nowhere (145 ms)
   Tests: 11 passed, 11 total
   ```
   145ms — consistent with plan.md/spec.md's own local `--runInBand` isolation measurements
   (69–147ms range), a comfortable local margin under both the 5000ms hard limit and the
   3000ms SC-001 target. **This is a local number only** — per FR-005/spec.md's Assumptions,
   it does not by itself prove SC-001 on the real `ubuntu-latest` runner; that proof is T016–
   T018, explicitly out of this run's scope.
5. `git diff -- src/features/identity/LoginScreen.test.tsx` → empty (zero lines changed),
   confirmed again for this second remedy exactly as T005 confirmed it for the first.

### Incidental observations (not assumed to matter, reported per this run's brief)

- `CI=true` alone (no explicit jest flag) does not change jest's own reported worker count or
  wall-clock time in this repo's setup — confirmed above (2.212s vs 2.266s). It's `init.sh`'s
  explicit `-- --runInBand` forwarding doing all the work, not any jest-internal `CI` auto-
  detection.
- No other output-format differences were observed between `CI=true` and unset runs (same
  `PASS`/`Test Suites`/`Tests`/`Time` lines, same summary shape) in this repo's jest config —
  nothing else appeared to need reporting.

### What this run does and does not prove

Per FR-005/spec.md's Assumptions (restated in this run's own brief): a green local run,
including a green local `--runInBand` run, does **not** prove the CI timeout is fixed — the
whole premise of Round 2 is that local numbers already once looked sufficient (the `act()`
fix) and were not. What this run establishes, precisely:

- The `CI`-conditional in `init.sh` is implemented correctly, is additive-only, and is
  provably a no-op for a developer's local, unflagged run (FR-009) — same wall-clock ballpark,
  same pass count, same `add_result` shape as before this change.
- The conditional genuinely activates under `CI=true` and correctly forwards `--runInBand` to
  jest (verified both generically via `--listTests` and concretely via the real `init.sh`
  stage-7 code path and its log output).
- Locally, under the real CI-only code path, the target test (145ms) and the full suite
  (630/630, 9.7s) show numbers consistent with plan.md's predictions and with a comfortable
  margin under jest's 5000ms timeout and SC-001's 3000ms target.
- **What it cannot establish**: whether this actually clears the timeout on a real, CPU-
  constrained `ubuntu-latest` runner. That requires T016 (push, with human authorization) and
  T017/T018 (record and evaluate the real run's measured numbers) — explicitly the
  orchestrator's job per this run's brief, not attempted here.

### Requirement traceability (this run's scope)

| FR / SC | Covered by |
|---|---|
| FR-009 (CI-only bound; local run stays unbounded/unaffected) | T015(a) — no-`CI` local run: 630/630, 2.266s, matching the pre-existing baseline exactly |
| FR-010 (mechanism lives in `init.sh` only, not `jest.config.js`/a new `package.json` script) | `git diff` confirms zero changes to `jest.config.js`/`package.json`; `init.sh` stage 7 is the sole edit |
| FR-002 (no assertion weakened) | `git diff -- src/features/identity/LoginScreen.test.tsx` → empty, confirmed again for this remedy |
| FR-003 (no app runtime change) | Zero changes under `app/`/`src/` this run |
| SC-002 (630/630, zero new failures) | Both T015(a) and T015(b) runs: 85/85 suites, 630/630 tests |

### Verification performed

- `bash -n init.sh` → syntax OK.
- `node_modules/.bin/tsc --noEmit` → clean, no type errors.
- `npm test` (no `CI`) → 630/630, 2.266s. `CI=true ./init.sh --skip-install --skip-build
  --skip-doctor --skip-native` → `RESULT: SUCCESS (8/8 stages passed)`, Tests stage reads
  "all tests passed (--runInBand, CI=true)".
- `grep -rn "testTimeout" jest.config.js jest.setup.ts init.sh` → no hits — the hard
  constraint (no `testTimeout` anywhere) holds.
- Full `./init.sh` (all 8 stages, no skip flags, no `CI` set) was **not** re-run in this
  session — only the local/no-CI and `CI=true` paths relevant to T015 were exercised, per
  this run's own instruction to verify those two specifically; `--skip-build`/`--skip-doctor`/
  `--skip-native` were used for speed on repeated `CI=true` runs since neither bundling nor
  `expo-doctor` output is affected by this change.

### Task status

- [X] T014
- [X] T015
- T016–T018: **not started** — requires explicit, real-time human authorization to push to
  PR #10's branch and watch its real `CI / verify` run; per this run's own brief, that's the
  orchestrator's job, not this run's.

## Run 3 — 2026-08-07 (T019, T020, T021, T022's LOCAL half only)

Scope for this run: **T019, T020, T021, and T022's local verification half only**, per explicit
instruction. T022's CI half (push to PR #10's branch, read the real run) is the orchestrator's
job, not attempted here — no `gh` command that creates/modifies anything on GitHub was run.
T016–T018's real-CI outcome (CI green, `RESULT: SUCCESS (10/10)`, 630/630, job 140s; T018 fired
FR-006 a second time — the target test measured 3885ms against jest's 5000ms limit, 22%
headroom, failing SC-001; `CrearCuentaScreen`'s first test measured 936ms, passing SC-004) and
the human's sign-off on options (a)+(c) were already recorded in `tasks.md`'s Phase 3c section
before this run started — treated as settled context per this run's own brief, not re-derived.

Read first, as instructed: `tasks.md`'s Phase 3c (T019–T022) in full including its context
block, `spec.md`'s FR-002/FR-003/FR-005/FR-006/FR-007 and SC-001/SC-004/SC-006, `plan.md`,
`.specify/memory/constitution.md`, `docs/conventions.md`.

### Files changed

- **`jest.config.js`** — additive-only: added `cacheDirectory: "<rootDir>/.jest-cache"` (T019)
  with a comment stating the design rationale (single source of truth for the cache-directory
  path, read by `.github/workflows/ci.yml`'s `actions/cache` step rather than duplicated),
  the measured warm-vs-cold numbers from `tasks.md`'s context block (147ms → 1666ms, 11x), the
  benign one-time local side effect (a developer's next run after pulling this change rebuilds
  the cache once, since it moves off jest's default OS-tmpdir location), and confirmation this
  is a plain non-test data directory, not a haste-map/test root (it holds no `*.test.ts(x)`
  files or `__tests__` directories, so jest's own `testMatch` defaults already exclude it — no
  extra `testPathIgnorePatterns` needed). Every pre-existing key (`preset`, `moduleNameMapper`,
  `modulePathIgnorePatterns`, `setupFiles`) is untouched.

- **`.gitignore`** — added a `.jest-cache/` entry (T019) with a short comment explaining it's a
  local build artifact never committed; CI persists its own copy via `actions/cache` instead.
  This is the file's first cache-related entry, as the task noted.

- **`.github/workflows/ci.yml`** — added one `actions/cache@v4` step (T020), placed between the
  existing `npm ci` step and the `./init.sh --skip-install` step (per the task's placement
  requirement — "before the `./init.sh --skip-install` step"). Caches `.jest-cache` (matching
  `jest.config.js`'s new `cacheDirectory`, no duplicated path string beyond this one `path:`
  value, which necessarily has to name the directory once on the workflow side too). Key:
  `v1-jest-cache-${{ runner.os }}-${{ hashFiles('package-lock.json', 'babel.config.js',
  'jest.config.js') }}` — a hand-rotatable `v1` prefix plus the three files whose changes
  actually invalidate a babel transform (lockfile = dependency versions, babel/jest config =
  transform rules). `restore-keys: v1-jest-cache-${{ runner.os }}-` as a fallback so a lockfile
  bump still gets a partial-match restore rather than a fully cold cache. The comment states
  plainly, as required, that a cache MISS (first run, or any run after one of the keyed files
  changes) still pays the full cold-cache cost — this step improves the common case, it does
  not remove the worst case, which is why T021 exists too.

- **`init.sh`** — additive-only edit to stage 7's `CI=true` branch (T021): added
  `--testTimeout=15000` alongside the existing `--runInBand --verbose`, so the CI-only jest
  invocation is now `npm test -- --runInBand --verbose --testTimeout=15000`. Added a comment
  block explaining why (absorbing the measured 3885ms cold-cache worst case with real margin —
  15000ms is ~3.9x that measurement), citing the human's 2026-08-07 sign-off on options (a)+(c)
  explicitly and by name (not just "a decision was made" — the comment names the two chosen
  options and cross-references `.github/workflows/ci.yml` for option (a)), and stating plainly
  that this is a deliberate, authorized exception to this feature's own FR-006, not a bypass,
  and not license for a genuinely slow test to hide — `jest.config.js` deliberately does NOT
  get this override, so a developer's local run keeps jest's strict 5000ms default. No per-file
  `jest.setTimeout` was added anywhere — `git diff --stat -- src/features/identity/
  LoginScreen.test.tsx` is empty (confirmed below), satisfying the task's explicit prohibition
  on touching that file. Every other part of stage 7 (the `SKIP_TESTS`/no-test-script branches,
  the unflagged local `npm test` path, the log file path, every `add_result` call) is
  byte-for-byte unchanged from Run 2.

- **`specs/015-ci-test-timeout/tasks.md`** — T019, T020, T021 marked `[X]`. T022 marked `[X]`
  with an explicit inline annotation ("LOCAL HALF DONE, CI HALF OUTSTANDING (owned by the
  orchestrator)") plus a trailing note that the push + real CI evidence step was not performed
  in this run — per this run's own instruction to mark T022 done only for its local half and
  say explicitly the CI half is outstanding.

No changes anywhere under `app/` or `src/`. `feature_list.json` and `progress/current.md` were
not touched (orchestrator's bookkeeping, not mine to edit per this run's brief). No `git add`,
commit, or push was performed — confirmed via `git status --porcelain` showing only working-tree
modifications, no staged changes, and via not having run any `git commit`/`git push`/`gh` command
in this session.

### T019 — cacheDirectory, verified

- `jest.config.js`'s `cacheDirectory` is `"<rootDir>/.jest-cache"`, the single place the path is
  defined — `.github/workflows/ci.yml`'s `actions/cache` step reads/writes the same literal
  directory name (`.jest-cache`, relative to the repo root, which is also `<rootDir>` since
  `init.sh`/CI both invoke jest from the repo root) rather than re-deriving or hardcoding a
  second copy of jest's own `<rootDir>`-relative resolution.
- Confirmed jest actually uses the new location: after the config change, running `npm test`
  created `/Users/leo/Desktop/DrawACard/Draw-a-card-front/.jest-cache/` (21M, containing a
  `haste-map-*` file and a `jest-transform-cache-*` directory) rather than anything under the
  OS temp directory. `npx jest --clearCache` reported `Cleared
  /Users/leo/Desktop/DrawACard/Draw-a-card-front/.jest-cache` — jest itself confirms this is
  now its cache location.
- Confirmed jest does not treat `.jest-cache` as a test root or haste-map input: the full local
  suite still reports exactly `85 passed, 85 total` / `630 passed, 630 total` (no phantom suites
  picked up from the cache directory's own contents), and no new "Haste module naming collision"
  or similar warning appeared in any run this session.
- The one local side effect the task requires stating plainly: a developer pulling this change
  moves their jest cache off its previous (OS-tmpdir-based) default location, so their very next
  local run rebuilds the cache once — the same one-time cost as any brand-new checkout's first
  run, and not observed to cause any failure, just a one-time slower run.

### T020 — actions/cache step, verified for YAML validity

- `pyyaml` is not installed (per this run's explicit constraint, not attempted). Verified the
  workflow YAML is valid a different way: `node_modules` already has `js-yaml` installed
  transitively, so `node -e "yaml.load(fs.readFileSync('.github/workflows/ci.yml'))"` was run
  and it parsed the entire file cleanly, printing the fully-structured JSON equivalent (the new
  `actions/cache@v4` step appears correctly nested as the 4th step, with `path`, `key`, and
  `restore-keys` all present and correctly typed as strings) — no YAML syntax error anywhere in
  the file after this edit.
- Also manually re-read the resulting file end-to-end (see the diff in this report) to confirm
  indentation, comment placement, and step ordering (`npm ci` → new cache step → `./init.sh
  --skip-install` → dump-logs step) match the task's placement requirement exactly.
- **What this run cannot verify**: whether the cache actually persists and produces a real HIT
  on a second CI run — only real, paired CI runs (a MISS then a HIT) can confirm that, and that
  is squarely the orchestrator's step (T022's CI half), not derivable from local YAML validation
  or from any local jest run.

### T021 — CI-only `--testTimeout=15000`, verified

- `git diff -- init.sh` (see Files changed above) shows the CI-only jest invocation is now
  `npm test -- --runInBand --verbose --testTimeout=15000`; the local, unflagged `npm test`
  invocation two branches below it is completely untouched.
- `grep -rn "testTimeout" jest.config.js jest.setup.ts init.sh package.json` → the only hits are
  (a) a comment in `jest.config.js` referencing `--testTimeout` by name (not a config key — no
  `testTimeout:` key exists anywhere in `jest.config.js`) and (b) the one CI-only flag in
  `init.sh`. `package.json` has zero hits. Confirms `jest.config.js` was NOT given a
  `testTimeout` key, satisfying the task's explicit "do NOT put `testTimeout` in `jest.config.js`"
  constraint — a developer's local run keeps jest's strict 5000ms default.
- `git diff --stat -- src/features/identity/LoginScreen.test.tsx` → empty. No per-file
  `jest.setTimeout` was added to that or any other test file.

### T022 — LOCAL half only (CI half is the orchestrator's, explicitly not attempted here)

**(a) No `CI` env var — parallel path, no `--verbose`, default (5000ms) timeout, still green:**

```
$ unset CI; time npm test
Test Suites: 85 passed, 85 total
Tests:       630 passed, 630 total
Time:        6.4 s
npm test  60.69s user 9.25s system 935% cpu 7.476 total
```

935% cpu confirms multiple workers ran (the parallel path, unaffected by T021's CI-only flag).
Output shows only `PASS <file>` lines per suite — no individual `✓ <test name> (N ms)` lines,
confirming `--verbose` is NOT active on this path. No `--testTimeout` flag is present (jest's
own default, 5000ms, governs) — consistent with `--testTimeout=15000` living only inside the
`[ "${CI:-}" = "true" ]` branch T021 added.

**(b) `CI=true` — reports `--runInBand`, passes:**

```
$ CI=true ./init.sh --skip-install --skip-build --skip-doctor --skip-native
▶ 7/8 Running test suite
✅ [OK] Tests: all tests passed (--runInBand, CI=true)
RESULT: SUCCESS (8/8 stages passed)
```

`/tmp/init-sh-front-tests.log`'s own first line: `> jest --runInBand --verbose
--testTimeout=15000` — confirms all three flags (including T021's new one) actually reached
jest, not just `init.sh`'s own summary line. `grep -c "✓" /tmp/init-sh-front-tests.log` → `630`
(every test's own `--verbose` line present). Tail: `Test Suites: 85 passed, 85 total / Tests:
630 passed, 630 total / Time: 9.789 s`.

**Also useful and cheap (explicitly called out as worth doing in this run's brief): target
test's duration on a cleared cache vs. warm, to confirm the cache-directory move (T019) didn't
break caching:**

```
$ CI=true npx jest src/features/identity/LoginScreen.test.tsx --runInBand --verbose   # warm
✓ replaces SignInForm with the neutral 'Signing you in…' view... (158 ms)   Time: 1.035 s

$ npx jest --clearCache
Cleared /Users/leo/Desktop/DrawACard/Draw-a-card-front/.jest-cache

$ CI=true npx jest src/features/identity/LoginScreen.test.tsx --runInBand --verbose   # cold
✓ replaces SignInForm with the neutral 'Signing you in…' view... (1593 ms)   Time: 3.295 s

$ CI=true npx jest src/features/identity/LoginScreen.test.tsx --runInBand --verbose   # re-warmed
✓ replaces SignInForm with the neutral 'Signing you in…' view... (145 ms)   Time: 1.03 s
```

158ms warm → 1593ms cold (~10x) → 145ms re-warmed — closely matches the context block's own
147ms/1666ms(11x)/146ms measurements, confirming the cache-directory move (default OS-tmpdir
location → `<rootDir>/.jest-cache`) did not change the underlying warm/cold behavior, only its
location. This is a **local** measurement only, using local wall-clock/CPU characteristics —
it does not by itself establish the real CI numbers (3885ms cold on `ubuntu-latest` per T018,
already recorded above); it only confirms the cache mechanism itself still functions correctly
after T019's relocation.

**`git diff --stat -- src/features/identity/LoginScreen.test.tsx`** → empty (reconfirmed a
third time across this feature's three rounds of remedies, none of which have ever touched this
file).

**What this run does NOT and cannot establish** (stated plainly, per this run's own
instruction): no local verification can confirm the CI cache (T020's `actions/cache` step)
actually persists and produces a real HIT between two separate CI runs — that requires an
actual pair of runs on `ubuntu-latest` (a MISS on the first run after this change merges/pushes,
then a HIT on the next run that doesn't touch the keyed files), which only the orchestrator's
push-and-watch step (T022's CI half) can produce. Likewise, whether the CI-only `--testTimeout`
(T021) and the transform-cache HIT (T020) together bring `LoginScreen.test.tsx`'s first test
under SC-001's margin, or merely under jest's ceiling without regressing SC-006's job-duration
budget, is a real-CI question this run does not and cannot answer from local numbers alone — the
whole premise of this feature's Round 2 (a locally-promising fix that failed on real CI) is the
reason this is stated as a genuine open question, not assumed favorable.

### Requirement traceability (this run's scope)

| FR / SC | Covered by |
|---|---|
| FR-005 (fix's effectiveness confirmed empirically on real CI, not just reasoned locally) | T019/T020 implemented and locally sanity-checked (cache mechanism functions, YAML valid); the actual empirical confirmation is explicitly deferred to the orchestrator's T022 CI half, stated as such throughout this report |
| FR-006 (no silent `testTimeout`; human sign-off required and present) | `init.sh`'s new comment cites the human's 2026-08-07 sign-off on options (a)+(c) by name; `jest.config.js` deliberately has no `testTimeout` key — only the CI-only `init.sh` flag exists |
| FR-007 (`CrearCuentaScreen.test.tsx`'s duration also recorded) | Already recorded in T018 (936ms, SC-004 pass) per the context block; this run's own local checks focused on `LoginScreen.test.tsx` per T022's own text, `CrearCuentaScreen`'s real-CI re-measurement (if any, on the cache/timeout-affected run) is part of the orchestrator's outstanding CI half |
| SC-001 (LoginScreen.test.tsx under 3000ms on real CI) | NOT established by this run — real CI evidence outstanding (orchestrator's step) |
| SC-004 (CrearCuentaScreen.test.tsx under 3000ms on real CI) | NOT re-established by this run for the cache/timeout change specifically — outstanding |
| SC-006 (total job duration comfortably within 20 minutes) | NOT re-established by this run — outstanding, though T017's prior measurement (job 140s) leaves very large headroom before this small, additive change |

### Verification performed

- `bash -n init.sh` → syntax OK.
- `node_modules/.bin/tsc --noEmit` → clean, no type errors.
- `node -e "require('js-yaml').load(fs.readFileSync('.github/workflows/ci.yml'))"` → parsed
  cleanly, full structure printed, no syntax error.
- `unset CI; npm test` → 630/630, 6.4s, 935% cpu (parallel, unaffected).
- `CI=true ./init.sh --skip-install --skip-build --skip-doctor --skip-native` → `RESULT: SUCCESS
  (8/8 stages passed)`; `/tmp/init-sh-front-tests.log` confirms `jest --runInBand --verbose
  --testTimeout=15000` actually ran, 630/630.
- `CI=true npx jest src/features/identity/LoginScreen.test.tsx --runInBand --verbose`, run warm,
  then after `npx jest --clearCache`, then re-warmed: 158ms / 1593ms / 145ms — cache mechanism
  confirmed still functioning after the T019 relocation.
- `git diff --stat -- src/features/identity/LoginScreen.test.tsx` → empty.
- `grep -rn "testTimeout" jest.config.js jest.setup.ts init.sh package.json` → only the intended
  comment (jest.config.js) and the one CI-only flag (init.sh); no `testTimeout:` config key
  anywhere, no per-file `jest.setTimeout`.
- `git status --porcelain` reviewed before finishing — confirmed only the intended files
  (`jest.config.js`, `.gitignore`, `.github/workflows/ci.yml`, `init.sh`,
  `specs/015-ci-test-timeout/tasks.md`) plus pre-existing, not-mine changes
  (`feature_list.json`, `progress/current.md` untouched by me;
  `progress/review_015-ci-test-timeout.md` untracked and not created by me) are present. No
  `git add`, `git commit`, `git push`, or any `gh` command was run.

### Task status

- [X] T019
- [X] T020
- [X] T021
- [X] T022 — **local half only.** The CI half (push to PR #10's branch, read the real run's
  cache-hit/miss status and measured durations, evaluate against SC-001/SC-004/SC-006) is
  **outstanding** and is explicitly the orchestrator's step, not performed in this run — see
  "What this run does NOT and cannot establish" above.
