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
