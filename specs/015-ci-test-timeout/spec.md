# Feature Specification: CI Test Timeout Fix

**Feature Branch**: `015-ci-test-timeout`

**Created**: 2026-08-07

**Status**: Draft (no open `[NEEDS CLARIFICATION]` markers). **Amended once already — see "Round 2
Amendment" immediately below** — real CI evidence on this feature's own PR #10 falsified Round 1's
root-cause premise (the `@expo/vector-icons`/`act()` fix, kept as a genuine but insufficient
improvement) and the human has since settled the actual fix (bound jest to `--runInBand` in CI,
FR-009/FR-010) and merge-order reality (`014` merged first, superseding FR-008/SC-005). Round 1's
original framing is preserved below for history where it doesn't conflict with Round 2.

**Input**: User description: discovered by `014-continuous-integration`'s first real CI run —
`src/features/identity/LoginScreen.test.tsx`'s first test fails on `ubuntu-latest` with jest's
default 5000ms per-test timeout, deterministically (2/2 real runs), while passing 630/630
locally. See `feature_list.json`'s `015-ci-test-timeout` entry for the full kickoff brief
(measured per-test durations, the ruled-out uniform-slowdown hypothesis, the `act()`-warning
lead, and the settled strategy) — treated as authoritative input here, re-verified below rather
than re-derived from scratch.

**Related backend spec**: None. Pure frontend test-infrastructure fix — no application behavior
changes, no `Draw-a-card` backend counterpart.

## Round 2 Amendment (2026-08-07) — root cause corrected by real CI evidence

**Read this section first if you already read Round 1 of this spec.** Everything below it in
this file has been updated to match; this section exists so the correction is not silently
buried in a diff.

**What happened since this spec first went `spec_ready`**: `jest.setup.ts` (the `expo-font`
mock — FR-001 as originally written) was implemented exactly as specified (tasks T002–T005),
pushed as this feature's own PR (**PR #10**), and its real `CI / verify` check ran on a real
`ubuntu-latest` runner (**run 31232122050**). **It still FAILED**, with the identical failure:
`Exceeded timeout of 5000 ms for a test` on `LoginScreen.test.tsx`'s first test. Measured deltas
were marginal, not decisive:

| | before | after the `expo-font` fix |
|---|---|---|
| `act()` warnings (local) | 44 | **0** |
| total local test time | 11208ms | **9363ms (−16%)** |
| `LoginScreen.test.tsx` suite (CI) | 11.06s | 10.58s |
| the failing test itself (local) | 311ms | 308ms (−1%) |
| the failing test itself (CI) | **>5000ms (FAIL)** | **>5000ms (FAIL)** |
| full jest suite (CI) | 1 failed / 629 passed | 1 failed / 629 passed |

**Conclusion, stated plainly: FR-001's original premise was wrong.** The `expo-font`/`act()` path
was a real, confirmed, repo-wide issue and a genuine improvement (kept — see FR-001 below, now
rewritten) — but it was never the cause of the timeout. Round 1's own "Re-verification" section
above already found the causal link "indirect at best," and this real CI run now confirms it was
not the cause at all.

**Two further candidate remedies were then tried on paper and eliminated by measurement — not
opinion — before the actual root cause was found:**

1. **Module/module-graph warming in a jest setup file** (floated in Round 1's plan.md and by the
   human's own escalation note as a next idea): **dead.** From `setupFiles`, it cannot even load —
   `ReferenceError: expect is not defined`, because `@testing-library/react-native` needs
   `expect` (a test-framework global) at import time, and `setupFiles` runs *before* the test
   framework is installed. From `setupFilesAfterEnv` (the hook that does have `expect` available)
   it runs, but is actively harmful: the target test got **slower** (308ms → 432ms) and total
   local test time **more than doubled** (9363ms → 20173ms, **+115%**), because a setup file
   under either hook executes once **per test file**, against a fresh module registry each time —
   "warming" one file's registry does nothing for the next file's own fresh one.
2. **A cheap canary test absorbing the one-time first-test cost** (recorded in Round 1's
   Clarifications as a possible fallback option): also dead, and for a reason that invalidates the
   premise entirely — top-level `import` statements evaluate at **module load**, which happens
   outside and before any individual test's 5000ms clock starts. The ~240ms Round 1 attributed to
   "first render/module-load cost" was never being charged to test #1's clock in the first place,
   so a canary test could only "absorb" it by itself calling `render()` — which just makes the
   canary the new thing that risks timing out, not a fix.

**The actual, empirically confirmed root cause: CPU contention from jest's default worker-pool
oversubscription**, not intrinsic per-test work. Measured on a 14-core development machine, same
code, only `jest --maxWorkers` varied:

| jest `--maxWorkers` | failing test's duration | sum of all test durations | wall-clock | failures |
|---|---|---|---|---|
| `1` (`--runInBand`) | **69ms** | 6472ms | 9.8s | 0 |
| `2` | 146ms | 6435ms | 5.2s | 0 |
| `4` | 154ms | 6787ms | 3.1s | 0 |
| default (13, one per core minus one) | **308ms** | 9363ms | ~2.4s | 0 |

Supporting isolation measurements: the same test runs in **147ms** alone in its own dedicated
jest process, and **145ms** when its own file runs alone (its ten siblings in that same file run
56–111ms). At `--maxWorkers=1` its duration (69ms) is **indistinguishable from its siblings** —
the "first test in a heavy suite pays a one-time cost" pattern Round 1 (and the original kickoff
brief) identified is an **artifact of worker contention, not intrinsic work** — it disappears
entirely once there is no contention to be subject to. Under jest's default oversubscription the
test inflates roughly 4.5x locally; on a real, CPU-constrained `ubuntu-latest` runner (2–4 vCPUs)
the same contention effect inflates it past the 5000ms limit — a >34x blowup versus its 147ms
solo-process time.

**Settled fix (human decision, not a plan-time judgment call — see FR-009/FR-010 below): run
jest with `--runInBand` (a single worker, no worker pool, no cross-test/cross-suite contention
possible) specifically in CI, leaving a developer's local run fully parallel and unaffected.**
`--maxWorkers=2` was considered and explicitly rejected: extrapolating the measured CI slowdown,
`--maxWorkers=2` would likely land the target test somewhere near 4–5s against the 5000ms limit —
close enough to the boundary that it would not be a fix, it would be a future flake waiting to
reappear the moment the suite grows slightly or a runner has a slightly busier neighbor.
`--runInBand`'s 69ms local measurement, by contrast, is indistinguishable from ordinary sibling
tests — the only setting of the four measured that gives a genuinely wide, deterministic margin
rather than a load-dependent one. The wall-clock cost is understood and accepted: locally the
full suite's total test time goes from ~2.4s (default, oversubscribed) to ~9.8s
(`--runInBand`) — call it a several-fold increase — but CI's whole job (all 8 `init.sh` stages,
including all three `expo export` bundle checks) currently completes in **~2m30s** against a
**20-minute** job timeout (per `014-continuous-integration`'s own closing measurement), so even a
several-fold increase in only the jest stage is comfortably absorbed with enormous headroom to
spare.

**One further real-world event, unrelated to the fix mechanism but relevant to how this feature
gets verified**: the human chose to merge `014-continuous-integration`'s PR #9 (commit `0589e03`)
**before** this feature, reversing Round 1's FR-008/Clarifications-recorded default (which
recommended cutting this feature's branch cleanly from `main` and using a disposable throwaway
PR purely to obtain CI evidence, specifically to avoid needing that reversal). That is squarely
"the human's call, not [the spec-writer's]" per Round 1's own framing, and it has already
happened: `main` now carries `.github/workflows/ci.yml` directly, so this feature's own branch
(cut from `main` @ `0589e03`) gets a real `CI / verify` check on its own, real, eventually-mergeable
pull request (**PR #10**) — no throwaway branch/PR is needed or should be created. FR-008 below
is marked superseded rather than deleted, so this history is not lost. See plan.md's "CI evidence
mechanism" Research Decision, now marked superseded, for the full before/after.

## Re-verification (2026-08-07, before writing this spec)

Everything below was independently re-checked against the live repo rather than taken only from
the kickoff brief, per this feature's own instruction not to re-derive the problem but to
re-verify anything turned into a requirement:

- `LoginScreen.test.tsx` run in isolation locally: 630/630 → 11/11 tests in that file pass;
  first test ("replaces SignInForm with the neutral 'Signing you in…' view…") took **166ms**,
  the slowest of the 11 (others range 54–110ms, one outlier at 12ms) — confirms the "first test
  in the file pays a one-time cost" pattern locally too, just nowhere near jest's 5000ms default.
- No `jest.setup.*` file exists anywhere in the repo (confirmed via `find`/`ls`). `jest.config.js`
  sets no `testTimeout`. `@expo/vector-icons` is not mocked anywhere (`grep`, zero hits).
- `@expo/vector-icons`' `createIconSet.js` (read directly, `node_modules/@expo/vector-icons/
  build/createIconSet.js`): each `Icon` instance's `state.fontIsLoaded` starts as
  `Font.isLoaded(fontName)`; if `false`, `componentDidMount` `await`s `Font.loadAsync(font)` and
  then calls `this.setState(...)` — an async state update with no surrounding `act()` in a test
  render, exactly the class of warning React Testing Library flags.
- **The `act()` warnings are real, but they are a repo-wide issue in suites that render an icon
  component — not something that occurs inside `LoginScreen.test.tsx`'s own suite.**
  `LoginScreen.tsx`'s import tree contains no `@expo/vector-icons` import (verified: `BrandMark`,
  `SignInForm`, `RequestPasswordResetForm`, `ResetPasswordForm`, `LoginScreenChrome` — none import
  it). Running `LoginScreen.test.tsx` alone produces **zero** `act()` warnings. Running a suite
  that does render an icon (`Viewfinder.test.tsx`, which mounts a component using
  `@expo/vector-icons`'s `Ionicons`) **does** produce the warning. Running the full local suite
  (all 85 files, one `jest` invocation) also produces **zero** — jest's default `--silent`-less
  run only surfaces per-suite console output when a suite fails or `--verbose` is passed, which
  is almost certainly why local runs "look clean" even though the underlying warning-producing
  code path exists and fires whenever an icon-rendering suite executes.
  **This means any causal link between the `act()` warnings and `LoginScreen.test.tsx`'s specific
  timeout is indirect at best** (e.g. cross-worker CPU/timer contention on a constrained runner
  from *other* suites' unresolved async work, not something inside `LoginScreen.test.tsx` itself)
  — reinforcing, with fresh evidence, the kickoff brief's own instruction that this must be
  empirically confirmed, not assumed.
- `.github/workflows/ci.yml` exists **only** on the (open, unmerged) `014-continuous-integration`
  branch — confirmed absent from `origin/main` (`git show origin/main -- .github/workflows/
  ci.yml` returns nothing). `main` (local and `origin/main`) has advanced one merge past what
  `014`'s branch notes describe (PR #8, `f02abb1`, the stray `npm error` log-line fix already
  flagged as separate follow-up work) — irrelevant to this feature's own diff, but relevant to
  cutting this feature's branch from an up-to-date `main` per the standard `feature-branch` skill
  step.
- `jest.config.js` has an uncommitted local change (adds `modulePathIgnorePatterns:
  ["<rootDir>/.claude/worktrees/"]`) from a separate, concurrent session — confirmed present in
  the working tree and already committed on `origin/main`, but **not yet committed on the
  branch currently checked out**. This feature's own jest-config edits must be layered on top of
  whatever `jest.config.js` looks like on `main` at the time this feature's branch is actually
  cut (after the standard `feature-branch` sync step), not assumed to already include or exclude
  that entry.

## Clarifications

No `/speckit-clarify` session was needed — the two decisions with the highest impact (whether to
raise `testTimeout`, and the order this merges relative to `014`) were pre-settled at kickoff and
are restated as functional requirements below, not re-litigated. Two secondary items the kickoff
brief explicitly left open ("resolve at spec/plan time") are resolved here as recorded
recommendations, per this repo's `014-continuous-integration` precedent of resolving low-to-
medium-stakes open items with a stated default rather than a blocking marker:

- **CI evidence mechanism — SUPERSEDED 2026-08-07, recorded for history, do not act on the
  original recommendation below.** Round 1 recommended Option (c) (a disposable throwaway
  branch/PR, cherry-picking `014`'s workflow, closed unmerged) specifically so this feature's own
  PR could get real CI evidence *without* needing `014` to merge first. **The human instead chose
  Option (d)** — merged `014`'s PR #9 to `main` first (commit `0589e03`), which the Round 1 text
  below explicitly flagged as "the human's call, not yours" if it ever happened. It has happened.
  Consequently: `main` now carries `.github/workflows/ci.yml` directly, this feature's branch
  (cut from that `main`) already gets a real check on its own PR (**PR #10**, open), and the
  throwaway-branch mechanism described below is now moot — it must **not** be created. The
  original Round 1 reasoning is preserved verbatim beneath this note only so a future reader can
  see what was recommended and why the human diverged from it, not because it is still
  actionable: ~~cut this feature's branch from `main` (clean diff, no `014` commits in it,
  preserving the human's settled "015 merges before 014" order), and separately gather real CI
  evidence via a short-lived, throwaway branch/PR that combines `014`'s workflow commit with this
  feature's fix, watched run to completion, then closed unmerged once the evidence is recorded.
  This is genuinely an extra PR and needs explicit human authorization to open (this repo's
  standing rule: no push/PR/merge without authorization at the time), but it is the only option
  among the four the human already analyzed that satisfies both hard constraints simultaneously —
  a real, non-fabricated CI run on a 2-core `ubuntu-latest` runner, and an unmodified merge order
  (`015` merges to `main` on its own, before `014`). The three alternatives were each rejected by
  the human already (see `feature_list.json`): (a) cutting from `014`'s branch collapses the two
  features into one merge; (b) cherry-picking then removing history requires rewriting the
  branch's own history, forbidden by the `feature-branch` skill; (d) merging `014` first reverses
  the settled order and is explicitly called out as "the human's call, not yours" if recommended.~~
  See the Round 2 Amendment section above and plan.md's "CI evidence mechanism" Research Decision
  (now marked superseded) for the full before/after.
- **What happens if the empirical check shows the `act()` fix is insufficient — UPDATED 2026-08-07,
  this already happened once, for real.** Per the kickoff brief's explicit instruction, this spec
  does **not** pre-authorize falling back to raising `testTimeout`. FR-006 below requires stopping
  and reporting back to the human with the measured numbers and the remaining options rather than
  silently choosing one — which is exactly what happened: the real CI run on PR #10 showed the
  `act()` fix alone was insufficient (see Round 2 Amendment above), and **two** further candidate
  remedies (module/module-graph warming in a jest setup file; a cheap canary test absorbing the
  one-time cost) were then tried and **eliminated by measurement**, not merely considered as
  untested options — see Round 2 Amendment for the exact numbers. The human then made the next
  decision (Round 2 Amendment: `--runInBand` in CI, recorded as FR-009/FR-010 below), still
  without authorizing `testTimeout`. If *that* remedy's own real CI evidence (still required —
  FR-005) also proves insufficient, the same rule applies again: stop, do not add `testTimeout`,
  report back to the human with the numbers.

## User Scenarios & Testing *(mandatory)*

<!--
  This feature has no end-user-facing UI. Its "users" are contributors and the repository
  maintainer, per the same framing `014-continuous-integration`'s spec.md uses for a repo-tooling
  feature with no application-facing behavior.
-->

### User Story 1 - A pull request's CI check reliably reflects local test results (Priority: P1)

A contributor's change passes locally (`./init.sh`, 630/630 tests green) and, when the same
commit is checked by the `CI / verify` workflow on `ubuntu-latest`, the check also passes —
specifically, `LoginScreen.test.tsx`'s first test (and, by the same underlying mechanism, every
other suite's first test) no longer intermittently or deterministically exceeds jest's per-test
timeout purely because it happens to run first in a comparatively heavy suite on a slower,
2-core runner.

**Why this priority**: This is the entire reason this feature exists and the sole blocker on
`014-continuous-integration`'s PR #9 going green. Without it, `014`'s CI either can never be
trusted (a real, deterministic failure that has nothing to do with the change under review) or —
worse — someone "fixes" it by raising `testTimeout`, which the human has already explicitly
declined because it would hide genuinely slow tests and let slowness accumulate silently across
the growing suite (the kickoff brief names `CrearCuentaScreen.test.tsx`, at 11.98s in CI, as the
likely next victim).

**Independent Test**: Open a pull request carrying only this feature's changes against `main`
via the CI-evidence mechanism described in plan.md, observe a real `ubuntu-latest` run of the
full jest suite, and confirm `LoginScreen.test.tsx`'s first test completes with comfortable
margin under 5000ms (see SC-001) with no other suite regressed.

**Acceptance Scenarios**:

1. **Given** the fixed suite runs on a real `ubuntu-latest`, 2-core GitHub Actions runner,
   **When** `LoginScreen.test.tsx`'s first test ("replaces SignInForm with the neutral 'Signing
   you in…' view on a successful sign-in and navigates nowhere") executes, **Then** it completes
   in under 5000ms with a measured, recorded safety margin (target: under 3000ms — see SC-001),
   not merely "did not time out this one time."
2. **Given** the same real CI run, **When** every other jest suite in the repo executes,
   **Then** all 630 (or however many then exist) tests still pass — this fix introduces zero new
   failures and weakens zero existing assertion.
3. **Given** the regression guard this specific test exists for (FR-006 of `005-login`'s spec: a
   successful sign-in swaps `SignInForm` for the neutral "Signing you in…" alert view and
   navigates nowhere), **When** this feature's fix is applied, **Then** that test's assertions
   (the `login-signing-in` testID appearing, the `alert`-role announcement, `signIn` called with
   the submitted credentials, `mockReplace`/`mockPush` never called) are **unchanged** — only
   *how fast* the test environment gets there changes, never *what* is asserted.
4. **Given** the local developer experience, **When** `./init.sh` (or `npm test`) is run
   unmodified after this fix, **Then** all 630 tests still pass locally exactly as before (this
   fix is invisible to a developer who never runs on the constrained CI runner) and no new
   `console.warn`/`act()` noise is introduced by this feature's own changes.

---

### User Story 2 - The systemic "first test in a heavy suite" risk is reduced, not just patched for one test (Priority: P2)

Beyond unblocking `LoginScreen.test.tsx` specifically, the underlying condition that makes *any*
suite's first test vulnerable — unmocked async font-loading state updates from
`@expo/vector-icons`, firing an `act()`-uncontrolled `setState` in every icon-rendering suite —
is addressed repo-wide (via a jest setup file, per the kickoff brief's own "the conventional
remedy" framing), not only in the one file CI happened to catch first.

**Why this priority**: The kickoff brief is explicit that this is "a SYSTEMIC risk, not a single
bad test" and names `CrearCuentaScreen.test.tsx` (11.98s in CI) as the next likely failure if
only the LoginScreen suite is touched. A fix scoped to one file would very likely just move the
next CI-only failure to a different PR, days or weeks later, re-litigating the same
investigation from scratch.

**Why lower priority than User Story 1**: User Story 1's empirical CI evidence is what proves
whether this repo-wide fix is *sufficient* at all — US2 is the mechanism, US1 is the proof. If
the evidence gathered for US1 shows the repo-wide fix does bring `LoginScreen.test.tsx` under a
safe margin, that same fix is already in place for every other suite by construction (it is not
file-specific), so there is no separate "US2 implementation" distinct from US1's fix — US2 exists
in this spec to make explicit that the fix's *scope* is repo-wide by requirement, not to describe
separate work.

**Independent Test**: After the fix, run any icon-rendering suite (e.g. `Viewfinder.test.tsx`,
`TopRightControls.test.tsx`, `WebSidebarNav.test.tsx`) with `--verbose` and confirm the "An
update to Icon inside a test was not wrapped in act(...)" warning no longer appears.

**Acceptance Scenarios**:

1. **Given** any test file that renders a component importing `@expo/vector-icons`, **When**
   that suite runs (locally or in CI), **Then** no "not wrapped in act(...)" warning attributable
   to `@expo/vector-icons`'s `Icon` component appears in its output.
2. **Given** the fix is a shared jest setup file (or equivalent global mock), **When** any new
   feature in the future imports and renders `@expo/vector-icons`, **Then** that new suite is
   automatically covered by the same fix with no per-file opt-in required.

---

### Edge Cases

- **The empirical CI evidence shows the `act()` fix alone is not enough — THIS HAPPENED, see
  Round 2 Amendment.** Handled exactly as FR-006 specified: stopped, reported the measured numbers
  and two further eliminated remedies to the human, did not silently add `testTimeout`. The human
  then settled the next remedy (FR-009/FR-010, `--runInBand`) — itself still subject to the same
  FR-006 rule if its own real CI evidence also proves insufficient.
- **A future suite becomes the next "first test in a heavy suite" victim even after this fix**
  (e.g. a suite heavier than `LoginScreen.test.tsx` that pays a different one-time cost this
  fix's icon-mock doesn't address): out of scope for this feature to pre-empt exhaustively — this
  feature closes the specific, confirmed cause (unmocked `@expo/vector-icons` async font
  loading), not every conceivable future first-test cost. If SC-001's margin on
  `CrearCuentaScreen.test.tsx` (the kickoff brief's named "most likely next victim," also checked
  per FR-007) is not comfortable, that is itself evidence for FR-006's escalation path.
- **RESOLVED 2026-08-07 (Round 2) — no longer an open edge case, kept for history**: the
  throwaway CI-evidence PR/branch question above resolved itself in practice — the human chose
  Option (d) (merge `014` first) rather than declining Option (c), so the throwaway mechanism was
  never built and is now moot (see Round 2 Amendment, FR-005, FR-008).
- **`jest.config.js`'s uncommitted `modulePathIgnorePatterns` edit** (from a separate concurrent
  session, see Re-verification): this feature's own `jest.config.js` edits (a new
  `setupFilesAfterEach`/`setupFiles` entry) must be additive to whatever `jest.config.js` looks
  like on `main` when this feature's branch is actually cut — not assumed to include or exclude
  that unrelated entry, and not a reason to delay this feature (it is independent, orthogonal
  config).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: **AMENDED 2026-08-07 (Round 2) — original premise falsified by real CI evidence, see
  Round 2 Amendment.** The `jest.setup.ts` mock of `@expo/vector-icons`' unmocked,
  `act()`-uncontrolled async font-loading state update MUST be implemented and kept — it is a
  real, confirmed, repo-wide issue (SC-003) and a genuine, independently valuable improvement
  (44 → 0 `act()` warnings, −16% local test time) — but it is NOT, by itself, sufficient to fix
  the CI timeout this feature exists to close (proven insufficient on a real CI run, PR #10, run
  31232122050). The actual, empirically confirmed root cause is CPU contention from jest's
  default worker-pool oversubscription (see FR-009). Raising `testTimeout` (globally, per-file, or
  per-test) remains explicitly OUT OF SCOPE for this feature unless FR-006's escalation path is
  followed and the human explicitly authorizes it as a documented last resort — this constraint is
  unchanged by the Round 2 correction.
- **FR-002**: The fix MUST NOT weaken, remove, or alter any existing test assertion in
  `LoginScreen.test.tsx` (or any other file) to make it pass faster or to sidestep the timeout.
  In particular, the regression guard this feature exists to unblock — `005-login`'s FR-006 (a
  successful sign-in swaps `SignInForm` for the neutral "Signing you in…" alert view and
  navigates nowhere), covered by `LoginScreen.test.tsx`'s first test — MUST remain intact,
  asserting exactly what it asserts today.
- **FR-003**: The fix MUST NOT change any application (`app/`, `src/`) runtime behavior. Its
  footprint is test infrastructure only — most likely a new jest setup file (e.g.
  `jest.setup.ts`) wired via `jest.config.js`'s `setupFiles`/`setupFilesAfterEach`, and/or a
  scoped mock of `@expo/vector-icons` or `expo-font`. Any component-level change (if one proves
  necessary) MUST be additive/defensive (e.g. guarding a `setState` after unmount) and MUST NOT
  alter what a real user sees or how a real screen behaves.
- **FR-004**: The fix's scope MUST be repo-wide (User Story 2) — implemented once, centrally
  (a jest setup file or equivalent global mock), not duplicated per test file, so every current
  and future suite that renders an `@expo/vector-icons` component is covered automatically.
- **FR-005**: The fix's effectiveness MUST be confirmed empirically on a real `ubuntu-latest`
  GitHub Actions runner (not merely reasoned about, and not merely re-confirmed as "still green
  locally," since the bug is already green locally 630/630 — see Re-verification). **UPDATED
  2026-08-07 (Round 2)**: `.github/workflows/ci.yml` now exists on `main` (`014` merged first —
  see Round 2 Amendment), so this feature's own pull request (**PR #10**) already carries a real
  `CI / verify` check; the throwaway-branch mechanism plan.md originally specified is superseded
  and MUST NOT be used. Each remedy attempted for this feature (the `expo-font` mock; now
  `--runInBand`, FR-009) MUST be verified this way — pushed to PR #10 (with explicit, real-time
  human authorization to push, per this repo's standing rule) and evaluated from that PR's real
  run's logs — before this feature can be considered done.
- **FR-006**: **UPDATED 2026-08-07 (Round 2) — this already fired once, for real, not
  hypothetically.** If the empirical evidence (FR-005) for whichever remedy is currently being
  attempted shows `LoginScreen.test.tsx`'s first test still exceeds, or comes uncomfortably close
  to (see SC-001's margin), the 5000ms default timeout, the feature MUST NOT proceed to silently
  add a `testTimeout` override. Instead, work MUST stop, the feature's `feature_list.json` status
  MUST be set to `blocked`, and the measured numbers plus the remaining options MUST be written to
  `spec.md`/`progress/current.md` for the human to decide, exactly as this repo's `spec_ready`
  clarification-blocking convention already works for other kinds of open questions. **Precedent,
  not hypothetical**: this rule already governed one real cycle — the `act()` fix (original
  FR-001) passed local verification but failed on real CI (PR #10), and rather than silently
  reaching for `testTimeout`, two further candidate remedies (module warming; a canary test) were
  evaluated and eliminated by measurement (see Round 2 Amendment), and only then did the human
  decide the next remedy (FR-009/FR-010). If FR-009/FR-010's `--runInBand` fix also fails its own
  real CI evidence, this same rule applies again, unchanged.
- **FR-007**: Because the kickoff brief names `CrearCuentaScreen.test.tsx` (11.98s in CI) as the
  most likely next victim of the same systemic pattern, the empirical CI evidence gathered for
  FR-005 MUST also record that suite's first-test duration on the same real run, not only
  `LoginScreen.test.tsx`'s — confirming (or disconfirming) that the repo-wide fix (FR-004) also
  protects the next-most-at-risk suite, not only the one CI happened to catch first.
- **FR-008**: **SUPERSEDED 2026-08-07 (Round 2) — kept for history, no longer binding.**
  Originally: this feature's own pull request MUST merge to `main` before `014-continuous-
  integration`'s PR #9 does. The human instead merged `014`'s PR #9 first (commit `0589e03`,
  Round 2 Amendment) — a real-world decision this spec does not re-litigate. This requirement is
  recorded as superseded rather than deleted so the original settled order (and the fact that it
  was deliberately reversed by the human, not silently violated) is not lost to history.
- **FR-009**: **NEW 2026-08-07 (Round 2), settled by the human — not a plan-time judgment call.**
  Jest test runs executed in CI MUST run with concurrency bounded to a single worker
  (`--runInBand`) to eliminate the empirically confirmed root cause — cross-test/cross-suite CPU
  contention from jest's default worker-pool oversubscription (see Round 2 Amendment's measurement
  table). `--maxWorkers=2` was considered and explicitly rejected: extrapolating the measured CI
  slowdown, it would likely land the target test near 4–5s against the 5000ms limit — too close to
  the boundary to be a real fix rather than a future flake. This bound applies only in CI; a
  developer's local run MUST remain fully parallel (unbounded `--maxWorkers`, i.e. today's default
  behavior) — this fix must be invisible to local development, same requirement Round 1's
  Acceptance Scenario 4 already stated for the `expo-font` mock.
- **FR-010**: The CI-only concurrency bound (FR-009) MUST be applied via a mechanism that
  activates automatically in CI and is a no-op for a developer's local run, without requiring any
  new flag a developer would need to remember. Specifically: a `CI`-conditional inside `init.sh`
  stage 7 (the single place `npm test` is invoked, per `init.sh`'s own existing structure) that
  passes `-- --runInBand` to `npm test` when the standard `CI` environment variable is `"true"`
  (already set automatically by GitHub Actions for every workflow step — `.github/workflows/
  ci.yml` needs no edit to set it) — consistent with `014-continuous-integration`'s own precedent
  of extending `init.sh` additively (its `--skip-install` flag) rather than adding a second,
  parallel definition of "how tests run" outside the one script this repo treats as the source of
  truth for verification. `jest.config.js` MUST NOT gain a `maxWorkers`/`runInBand` setting of its
  own — that would bound every local run too, contradicting FR-009's local-invisibility
  requirement. A separate `package.json` `test:ci` script MUST NOT be added either, for the same
  "one source of truth, no parallel definition" reason `014`'s own plan.md already established for
  this repo (its "Does this need a new `package.json` script?" Research Decision).

### Key Entities

*(Not applicable — this feature introduces no data entity, persisted or otherwise. It is test
infrastructure only.)*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a real `ubuntu-latest` GitHub Actions run — this feature's own PR #10, per FR-005
  — `LoginScreen.test.tsx`'s first test completes in under 3000ms — a margin of at least 40%
  below jest's 5000ms default timeout, not just "did not time out this one time." (If the
  measured value is between 3000ms and 5000ms, FR-006's escalation path applies rather than
  treating a narrow pass as sufficient — this is not hypothetical caution: the `act()`-only fix
  already showed how easily a change can look promising locally and still fail for real on CI.
  **UPDATED 2026-08-07 (Round 2)**: local `--runInBand` measurements (69ms, indistinguishable from
  sibling tests) suggest this margin should be met with room to spare, but per FR-005 this MUST
  still be confirmed on the real runner, not assumed from the local number.)
- **SC-002**: The full jest suite (currently 630 tests across 85 files) passes on that same real
  CI run with zero failures and zero new suite added or removed by this feature.
- **SC-003**: Zero "not wrapped in act(...)" warnings attributable to `@expo/vector-icons`
  appear in the full local suite run with `--verbose` after the fix (currently present whenever
  an icon-rendering suite runs, confirmed in this spec's Re-verification section).
- **SC-004**: `CrearCuentaScreen.test.tsx`'s first test — the kickoff brief's named
  most-likely-next-victim — also completes with the same SC-001 margin on the same real CI run.
- **SC-005**: **SUPERSEDED 2026-08-07 (Round 2) — kept for history, see FR-008.** Originally: this
  feature's PR merges to `main` before `014-continuous-integration`'s PR #9 does. `014`'s PR #9
  has already merged (commit `0589e03`), before this feature — the reverse of what this criterion
  specified. The outcome this feature exists to enable (`014`'s `main`-tracking runs, and this
  feature's own PR, both showing a genuinely green `CI / verify` check) is unchanged in substance;
  only the merge order is different from what was originally planned.
- **SC-006**: **NEW 2026-08-07 (Round 2).** With `--runInBand` applied in CI (FR-009/FR-010), the
  full CI job (all 8 `init.sh` stages, including all three `expo export` bundle checks) still
  completes comfortably within the workflow's 20-minute job timeout. Basis: the whole job
  currently completes in ~2m30s (per `014-continuous-integration`'s own closing measurement); even
  a several-fold increase in only the jest stage's wall-clock time (locally, `--runInBand` took
  the full suite from ~2.4s to ~9.8s) leaves very large headroom against 20 minutes. This MUST
  still be confirmed from the real run's total job duration (FR-005), not assumed from the local
  multiplier alone.

## Assumptions

- **UPDATED 2026-08-07 (Round 2) — the `act()`-warning lead's causal link is now confirmed
  NEGATIVE, not just "not yet confirmed."** Round 1 correctly flagged the link as unproven; PR
  #10's real CI run has since proven it was not the cause at all (see Round 2 Amendment). The
  actual confirmed cause is jest worker-pool oversubscription (FR-009). This spec still requires
  empirical proof for whichever remedy is current (FR-005/FR-006), not just "the warnings are gone
  locally" or "the local `--runInBand` number looks good" — before declaring success.
- **A green local run is not evidence for this feature.** The bug this feature fixes is already
  630/630 green locally today — this is stated explicitly so a future reader (or a
  code-reviewer) does not mistake "still green locally after the fix" for meaningful
  verification. The only meaningful verification is a real `ubuntu-latest` run (this feature's own
  PR #10, per FR-005 as amended in Round 2) — this was not a hypothetical caution, it is exactly
  what caught FR-001's original premise being wrong.
- **UPDATED 2026-08-07 (Round 2), superseded**: Round 1 assumed this feature's branch would be
  cut from `main` without `.github/workflows/ci.yml`, requiring a separate throwaway-PR mechanism
  to get real CI evidence (plan.md). In practice, `014` merged to `main` first (Round 2
  Amendment), so this feature's branch already includes `.github/workflows/ci.yml` and its own PR
  (#10) already has a real check — no separate evidence-gathering artifact exists or is needed.
- **No new test tooling needs to be installed** — `jest`, `jest-expo`, and
  `@testing-library/react-native` are already set up (per `docs/verification.md`); this feature
  only adds a jest setup file wired into the existing `jest.config.js`, which is within the
  already-installed toolchain's normal configuration surface.
- **`main`'s state at the time this feature's branch is actually cut** may include unrelated
  commits beyond what was observed during spec-writing (e.g. `jest.config.js`'s currently-
  uncommitted `modulePathIgnorePatterns` entry becoming committed by its owning session before
  this feature starts) — the standard `feature-branch` skill's "sync `main` first" step handles
  this; this spec does not assume a specific `jest.config.js` starting state beyond "whatever is
  on `main` at branch-cut time."


---

## Round 3 Amendment (2026-08-07) — cold jest transform cache, and the human-authorized ceiling

**Supersedes Round 1's and Round 2's root-cause claims.** Both were real contributors, both are
kept, neither was the dominant term.

| Round | Hypothesis | Outcome |
|---|---|---|
| 1 | `@expo/vector-icons` async font load driving un-`act()`ed `setState` | Real win — 44 `act()` warnings → 0, −16% local test time — but **did not fix the timeout** (311ms → 308ms locally). FR-001's original premise was falsified by CI. |
| 2 | jest worker-pool oversubscription / CPU starvation | Real contributor (69ms @ 1 worker vs 308ms @ 13 locally). `--runInBand` kept. Got CI to 3885ms of 5000ms — **22% headroom, SC-001 failed**, triggering FR-006 escalation #2. |
| 3 | **Cold jest transform cache** | **Dominant term.** Local, same test, `--runInBand` throughout, only cache state varying: warm **147ms** → `npx jest --clearCache` → **1666ms** (11x) → warm **146ms**. |

**Eliminated by measurement — do not retry.** Warming the module graph in a setup file: impossible
from `setupFiles` (`ReferenceError: expect is not defined`, since `@testing-library/react-native`
needs `expect` at import time); from `setupFilesAfterEnv` it *doubled* total local test time
(9363ms → 20173ms) and *slowed* the target test (308ms → 432ms), because setup runs once per test
file against a fresh module registry. A cheap canary test: top-level `import`s evaluate at module
load, outside any test's 5000ms clock, so there was never import cost for a canary to absorb — a
canary could only absorb it by rendering, making the canary the thing that times out.

### FR-006 status: satisfied by explicit sign-off, not bypassed

FR-006 forbade a `testTimeout` as a *silent* fallback and required escalation instead. It escalated
**twice** (T008, T018) and the human was handed measured numbers both times. On 2026-08-07 the human
chose **(a) cache the transform output + (c) a scoped `testTimeout`**. That sign-off is the
authorization FR-006 demanded; the flag is dated, named, and justified in `init.sh`'s comment, in
`tasks.md`'s Phase 3c header, and in `feature_list.json`'s notes.

### SC-001 / SC-004: met, with both cache states measured

| | cache MISS (run 31234302973) | cache HIT (run 31234419308) |
|---|---|---|
| target test | **3999ms** | **311ms** |
| `CrearCuentaScreen` first test | 1019ms | 127ms |
| jest total | 28.917s | 16.26s |

SC-001 is met on warm runs at 311ms — under even the original 3000ms bar. Cold-miss runs sit at
3999ms with 73% headroom under the 15000ms CI ceiling (vs. 22% under 5000ms before). SC-006 holds
easily: job wall 134–158s against a 20-minute timeout.

### FR-010 (new) — the CI/local sensitivity asymmetry, stated rather than left implicit

`--testTimeout` is a jest CLI flag, not a per-file setting, so the CI ceiling necessarily applies to
**all 630 tests**, not only the two "first test in a heavy suite" victims. A per-file
`jest.setTimeout` was not available: it would require editing
`src/features/identity/LoginScreen.test.tsx`, which FR-002 forbids.

The accepted, bounded consequence: **CI is now less sensitive than local development to a moderate
performance regression.** A test that regressed from ~150ms to ~4500ms would pass CI (far under
15000ms) while a developer would see it near jest's local 5000ms limit. This is accepted because the
ceiling is anchored to the measured cold worst case (3999ms → 15000ms, ~3.75x) rather than picked
arbitrarily large, and because local runs deliberately keep the strict 5000ms default precisely so
that development remains the tighter gate. Anyone raising this ceiling further should re-measure
first and record why.

### Method note worth keeping

Suite-level timing actively hid this bug. From `LoginScreen.test.tsx`'s 6.759s suite total the
target test was inferred at ~600–700ms; it was 3885ms — wrong by ~6x — and that inference would
have shipped a 22%-margin check as "fixed". What exposed it: moving the workflow's log dump to
`if: always()` and adding `--verbose` to CI's jest call. Both stay, and both remain useful for any
future CI timing regression.
