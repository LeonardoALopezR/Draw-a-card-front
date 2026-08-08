# Feature Specification: CI Test Timeout Fix

**Feature Branch**: `015-ci-test-timeout`

**Created**: 2026-08-07

**Status**: Draft (no open `[NEEDS CLARIFICATION]` markers — the human already settled the
strategy at kickoff: fix in its own PR, merged before 014's PR #9; investigate and fix the
`act()` warnings rather than raise jest's `testTimeout`. What remains genuinely open — whether
that fix is *sufficient* to bring the failing test under 5s on a real CI runner, and what
mechanism gets this feature's own PR a real CI check before 014 has merged — is resolved below
with recorded defaults/recommendations per this repo's own precedent (`014-continuous-
integration`'s spec.md), not left as blocking questions, because a reasonable default/
recommendation exists for each and the genuinely irreversible one (see "CI evidence mechanism"
below) does not require overriding the human's settled merge order.)

**Input**: User description: discovered by `014-continuous-integration`'s first real CI run —
`src/features/identity/LoginScreen.test.tsx`'s first test fails on `ubuntu-latest` with jest's
default 5000ms per-test timeout, deterministically (2/2 real runs), while passing 630/630
locally. See `feature_list.json`'s `015-ci-test-timeout` entry for the full kickoff brief
(measured per-test durations, the ruled-out uniform-slowdown hypothesis, the `act()`-warning
lead, and the settled strategy) — treated as authoritative input here, re-verified below rather
than re-derived from scratch.

**Related backend spec**: None. Pure frontend test-infrastructure fix — no application behavior
changes, no `Draw-a-card` backend counterpart.

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

- **CI evidence mechanism** (how this feature's own PR gets a real CI check before `014` has
  merged `.github/workflows/ci.yml` to `main`): **Recommended: Option (c)** — cut this feature's
  branch from `main` (clean diff, no `014` commits in it, preserving the human's settled "015
  merges before 014" order), and separately gather real CI evidence via a **short-lived,
  throwaway branch/PR** that combines `014`'s workflow commit with this feature's fix, watched
  run to completion, then closed unmerged once the evidence is recorded. This is genuinely an
  extra PR and needs explicit human authorization to open (this repo's standing rule: no
  push/PR/merge without authorization at the time), but it is the only option among the four the
  human already analyzed that satisfies **both** hard constraints simultaneously — a real,
  non-fabricated CI run on a 2-core `ubuntu-latest` runner, *and* an unmodified merge order
  (`015` merges to `main` on its own, before `014`). The three alternatives were each rejected by
  the human already (see `feature_list.json`): (a) cutting from `014`'s branch collapses the two
  features into one merge; (b) cherry-picking then removing history requires rewriting the
  branch's own history, forbidden by the `feature-branch` skill; (d) merging `014` first reverses
  the settled order and is explicitly called out as "the human's call, not yours" if recommended
  — since this spec does **not** recommend (d), it is not raised as a blocking question here, but
  is recorded in plan.md as the one alternative that would need a separate, explicit go-ahead if
  (c) turns out to be impractical at implementation time (e.g. if opening a throwaway PR is
  declined). See plan.md's "CI evidence mechanism" Research Decision for the full mechanics.
- **What happens if the empirical check shows the `act()` fix is insufficient**: per the kickoff
  brief's explicit instruction, this spec does **not** pre-authorize falling back to raising
  `testTimeout`. FR-006 below requires stopping and reporting back to the human with the measured
  numbers and the remaining options (further reducing first-render cost, e.g. deferring icon-font
  loading; splitting the heavy suite so the expensive first-render cost is paid by a cheap
  canary test rather than a real assertion; or, as a last resort with the human's explicit
  sign-off, raising `testTimeout` for that one file only) rather than silently choosing one.

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

- **The empirical CI evidence shows the `act()` fix alone is not enough** (explicitly flagged by
  the human as plausible, given the "first test in suite, not slowest test" measured pattern):
  handled by FR-006 — stop, report the measured numbers and remaining options to the human, do
  not silently add `testTimeout`.
- **A future suite becomes the next "first test in a heavy suite" victim even after this fix**
  (e.g. a suite heavier than `LoginScreen.test.tsx` that pays a different one-time cost this
  fix's icon-mock doesn't address): out of scope for this feature to pre-empt exhaustively — this
  feature closes the specific, confirmed cause (unmocked `@expo/vector-icons` async font
  loading), not every conceivable future first-test cost. If SC-001's margin on
  `CrearCuentaScreen.test.tsx` (the kickoff brief's named "most likely next victim," also checked
  per FR-007) is not comfortable, that is itself evidence for FR-006's escalation path.
- **The throwaway CI-evidence PR/branch (see Clarifications) is declined by the human** at
  implementation time: plan.md's Research Decision names the fallback (ask the human directly
  whether to proceed with Option (d) instead, reversing the settled merge order) rather than
  silently proceeding with only local evidence, which this spec's own re-verification section
  demonstrates is not sufficient (local runs already show zero relevant warnings surfaced by
  default and the bug is already green locally 630/630).
- **`jest.config.js`'s uncommitted `modulePathIgnorePatterns` edit** (from a separate concurrent
  session, see Re-verification): this feature's own `jest.config.js` edits (a new
  `setupFilesAfterEach`/`setupFiles` entry) must be additive to whatever `jest.config.js` looks
  like on `main` when this feature's branch is actually cut — not assumed to include or exclude
  that unrelated entry, and not a reason to delay this feature (it is independent, orthogonal
  config).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The fix MUST target the confirmed root-cause candidate — `@expo/vector-icons`'
  unmocked, `act()`-uncontrolled async font-loading state update — rather than raising jest's
  `testTimeout`. Raising `testTimeout` (globally, per-file, or per-test) is explicitly
  OUT OF SCOPE for this feature unless FR-006's escalation path is followed and the human
  explicitly authorizes it as a documented last resort.
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
- **FR-005**: The fix's effectiveness MUST be confirmed empirically on a real `ubuntu-latest`,
  2-core GitHub Actions runner (not merely reasoned about, and not merely re-confirmed as
  "still green locally," since the bug is already green locally 630/630 — see Re-verification).
  The mechanism for obtaining that real run, given `.github/workflows/ci.yml` does not yet exist
  on `main`, is specified in plan.md's "CI evidence mechanism" Research Decision and MUST be
  followed (or an explicitly human-authorized alternative substituted) before this feature can be
  considered done.
- **FR-006**: If the empirical evidence (FR-005) shows `LoginScreen.test.tsx`'s first test still
  exceeds, or comes uncomfortably close to (see SC-001's margin), the 5000ms default timeout
  after the `act()`-focused fix is applied, the feature MUST NOT proceed to silently add a
  `testTimeout` override. Instead, work MUST stop, the feature's `feature_list.json` status MUST
  be set to `blocked`, and the measured numbers plus the remaining options (see Clarifications'
  second bullet) MUST be written to `spec.md`/`progress/current.md` for the human to decide,
  exactly as this repo's `spec_ready` clarification-blocking convention already works for other
  kinds of open questions.
- **FR-007**: Because the kickoff brief names `CrearCuentaScreen.test.tsx` (11.98s in CI) as the
  most likely next victim of the same systemic pattern, the empirical CI evidence gathered for
  FR-005 MUST also record that suite's first-test duration on the same real run, not only
  `LoginScreen.test.tsx`'s — confirming (or disconfirming) that the repo-wide fix (FR-004) also
  protects the next-most-at-risk suite, not only the one CI happened to catch first.
- **FR-008**: This feature's own pull request MUST merge to `main` before `014-continuous-
  integration`'s PR #9 does (the human's settled sequencing decision, restated here as a hard
  requirement, not re-litigated) — see Clarifications' "CI evidence mechanism" for how this
  feature's own PR still gets a real CI check under that constraint.

### Key Entities

*(Not applicable — this feature introduces no data entity, persisted or otherwise. It is test
infrastructure only.)*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a real `ubuntu-latest` GitHub Actions run (the CI-evidence mechanism in
  plan.md), `LoginScreen.test.tsx`'s first test completes in under 3000ms — a margin of at least
  40% below jest's 5000ms default timeout, not just "did not time out this one time." (If the
  measured value is between 3000ms and 5000ms, FR-006's escalation path applies rather than
  treating a narrow pass as sufficient, since the kickoff brief's own measured >16x local-to-CI
  blowup on this exact test shows how little margin a bare pass would actually represent.)
- **SC-002**: The full jest suite (currently 630 tests across 85 files) passes on that same real
  CI run with zero failures and zero new suite added or removed by this feature.
- **SC-003**: Zero "not wrapped in act(...)" warnings attributable to `@expo/vector-icons`
  appear in the full local suite run with `--verbose` after the fix (currently present whenever
  an icon-rendering suite runs, confirmed in this spec's Re-verification section).
- **SC-004**: `CrearCuentaScreen.test.tsx`'s first test — the kickoff brief's named
  most-likely-next-victim — also completes with the same SC-001 margin on the same real CI run.
- **SC-005**: This feature's PR merges to `main` before `014-continuous-integration`'s PR #9
  does, and `014`'s PR #9 subsequently shows a green `CI / verify` check once rebased onto the
  resulting `main` (external confirmation, tracked in `014`'s own `tasks.md`/`feature_list.json`,
  not this feature's own done-criteria, but the outcome this feature exists to enable).

## Assumptions

- **The `act()`-warning lead is a real, confirmed, repo-wide condition** (re-verified above), but
  its causal link to `LoginScreen.test.tsx`'s specific timeout is **not yet confirmed** — only
  plausible (indirect cross-worker resource contention on a constrained runner). This spec
  therefore requires empirical proof (FR-005/FR-006), not just "the warnings are gone locally,"
  before declaring success.
- **A green local run is not evidence for this feature.** The bug this feature fixes is already
  630/630 green locally today — this is stated explicitly so a future reader (or a
  code-reviewer) does not mistake "still green locally after the fix" for meaningful
  verification. The only meaningful verification is a real `ubuntu-latest` run (see plan.md).
- **This feature's own branch is cut from `main`, not from `014-continuous-integration`'s
  branch** (Clarifications) — its own diff therefore does not, by itself, include
  `.github/workflows/ci.yml`. The CI-evidence mechanism (plan.md) is a separate, temporary
  artifact used only to gather proof, not part of this feature's shipped diff.
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
