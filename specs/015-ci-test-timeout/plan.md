# Implementation Plan: CI Test Timeout Fix

**Branch**: `015-ci-test-timeout` | **Date**: 2026-08-07 | **Spec**: `specs/015-ci-test-timeout/spec.md`

**Input**: Feature specification from `specs/015-ci-test-timeout/spec.md`

**Note**: Like `005-login` and `014-continuous-integration`, this folds Phase 0 (research) and
Phase 1 (data model / contracts / quickstart) into this single file rather than separate
`research.md`/`data-model.md`/`contracts/`/`quickstart.md` documents — this feature has no
persisted entity (spec.md's Key Entities is explicitly N/A) and its "interface contract" is a
jest configuration/setup-file shape, short enough to document inline below.

## Round 2 Amendment (2026-08-07) — read this before anything below

This plan's original Summary/Research Decisions (preserved below, marked where superseded) were
written before real CI evidence existed. Since then: T002–T005 (the `jest.setup.ts`/`expo-font`
mock) were implemented exactly as this plan specified, pushed as this feature's own PR (**PR
#10**), and its real `CI / verify` run (**31232122050**) still **failed** with the same
`LoginScreen.test.tsx` timeout. Two further candidate remedies (module/module-graph warming in a
setup file; a cheap canary test) were then evaluated and **eliminated by measurement** — see
spec.md's Round 2 Amendment for the full numbers, not repeated here. The actual, empirically
confirmed root cause is **CPU contention from jest's default worker-pool oversubscription**, not
the `act()` path. The human has settled the fix: **run jest with `--runInBand` in CI only**, via a
`CI`-conditional in `init.sh` stage 7 (spec.md FR-009/FR-010). Separately, the human merged
`014-continuous-integration`'s PR #9 to `main` **before** this feature (reversing this plan's
original "CI evidence mechanism" Research Decision, which is now superseded — see that section
below) — so `main`, and this feature's own branch/PR #10, already carry
`.github/workflows/ci.yml`; no throwaway branch/PR is needed. Every section below is updated to
match; superseded content is struck through and kept, not deleted, so the reasoning trail survives.

## Summary

**UPDATED 2026-08-07 (Round 2).** Two things ship, in sequence:

1. A jest setup file (`jest.setup.ts`, wired via `jest.config.js`'s `setupFiles`) that neutralizes
   `@expo/vector-icons`' unmocked async font-loading `setState` (the confirmed source of the "Icon
   inside a test was not wrapped in act(...)" warnings) repo-wide, with **zero** application code
   or assertion changes. **Implemented, real, and kept — but confirmed by real CI evidence (PR
   #10, run 31232122050) to NOT by itself fix the timeout this feature exists to close.**
2. A `CI`-conditional in `init.sh` stage 7 that runs jest with `--runInBand` when the standard
   `CI` environment variable is `"true"` (GitHub Actions sets this automatically; no workflow-file
   edit needed) — eliminating the actual, empirically confirmed root cause, cross-test/cross-suite
   CPU contention from jest's default worker-pool oversubscription, while leaving a developer's
   local run fully parallel and unaffected (spec.md FR-009/FR-010).

Obtaining a real, empirical measurement of `LoginScreen.test.tsx`'s first test on an actual
`ubuntu-latest` GitHub Actions runner remains the load-bearing part of this plan — a green local
run proves nothing here (the bug is already 630/630 green locally today, and the first remedy
attempted looked good locally too and still failed for real). ~~Since `.github/workflows/ci.yml`
exists only on the unmerged `014-continuous-integration` branch, this plan resolves how this
feature's own PR — which must merge to `main` *before* `014`'s PR #9 (FR-008) — gets that real
measurement without collapsing the two features' merges together.~~ **Superseded**: `014` merged
first (human decision), so this feature's own PR (#10) already has a real check — see "CI
evidence mechanism" below. If the `--runInBand` measurement shows the fix is sufficient
(SC-001/SC-004/SC-006's margins), this feature is done. If not, FR-006 requires stopping and
escalating to the human rather than adding `testTimeout` — exactly as it already did once for the
`act()` fix.

## Technical Context

**Language/Version**: TypeScript (jest setup file), matching the rest of the repo's test
tooling. Node 20 (`.nvmrc`), unchanged.

**Primary Dependencies**: No new npm package. `@expo/vector-icons` and `expo-font` are already
transitive dependencies (ship with `expo`); `jest`/`jest-expo`/`@testing-library/react-native`
are already installed and configured (`jest.config.js`, `package.json`'s `test` script).

**Storage**: N/A.

**Testing**: This feature's own verification is unusually self-referential — it is a fix *to*
the test suite, verified *by* the test suite (locally, as a sanity check that nothing broke) and,
more importantly, by a real run of that same suite on the actual CI runner class that exposed the
bug (see "CI evidence mechanism" below). `docs/verification.md`'s Level 1/2 (unit/component
tests) do not directly apply — this feature adds no new application code to unit-test: its
"passing tests" ARE the existing 630 tests, unmodified, now also passing on a real 2-core runner.

**Target Platform**: The fix itself runs everywhere jest runs (local dev machines, CI). The
*verification* target is specifically `ubuntu-latest` (2-core GitHub Actions runner) — the exact
platform that reproduced the failure and the only one that has, so far.

**Project Type**: Single Expo (React Native) app, unchanged. This feature adds one new file
(`jest.setup.ts`), a small `jest.config.js` edit, and no `app/`/`src/` runtime changes (FR-003).

**Performance Goals**: `LoginScreen.test.tsx`'s first test completes in under 3000ms on a real
`ubuntu-latest` runner (SC-001); `CrearCuentaScreen.test.tsx`'s first test likewise (SC-004).
**UPDATED (Round 2)**: also, the full CI job stays comfortably within its 20-minute timeout even
with `--runInBand`'s several-fold local wall-clock increase applied to the jest stage (SC-006) —
not a speed feature beyond that; no tighter target for the full suite's total wall-clock time.

**Constraints**: Zero application behavior change (FR-003). Zero assertion weakening (FR-002).
No `testTimeout` change without an explicit human-authorized escalation (FR-001/FR-006) — this
already held once, for real, when the `act()` fix proved insufficient. ~~Must merge before `014`'s
PR #9 (FR-008).~~ **Superseded (Round 2)**: `014` merged first, by human decision — see Round 2
Amendment. **NEW (Round 2)**: the CI-only concurrency bound (`--runInBand`) MUST NOT affect a
developer's local run (FR-009) and MUST be applied via `init.sh`, not `jest.config.js` or a new
`package.json` script (FR-010). No history-rewriting on this feature's own branch (repo's
`feature-branch` skill) — still applies, though the throwaway-branch mechanism this originally
protected against is now moot.

**Scale/Scope**: One new file (`jest.setup.ts`, ~23 lines, **implemented** — see
`progress/impl_015-ci-test-timeout.md`), a small addition to `jest.config.js` (`setupFiles`,
**implemented**). **NEW (Round 2)**: a small, additive change to `init.sh` stage 7 (a `CI`-
conditional around the existing `npm test` invocation, following the same additive-flag pattern
`014-continuous-integration` established for `--skip-install`) — no new file, no new
`package.json` script, no `jest.config.js` change for this second remedy. ~~Plus the throwaway
CI-evidence artifact described below, which is explicitly NOT part of this feature's shipped
diff.~~ **Superseded (Round 2)**: no throwaway artifact exists or is needed — see "CI evidence
mechanism" below.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. One Codebase, Three Targets | The fix is test-infrastructure only, applies identically regardless of which platform a given suite is testing (`jest-expo` already abstracts that) — no per-platform divergence introduced. | PASS |
| II. Backend Is the Source of Truth | No backend call of any kind — this feature has no `Draw-a-card` backend counterpart. | PASS |
| III. Auth Goes Through the Provider SDK, Not the Backend | Not applicable — no auth code touched; `LoginScreen.test.tsx`'s existing Supabase mocking is untouched (FR-002/FR-003). | PASS |
| IV. Business Logic Stays Portable | Not applicable to the jest setup file itself (test infrastructure, not business logic). If a defensive component-level change proves necessary (Scale/Scope), it must still respect this principle — e.g. it cannot introduce inline platform conditionals; N/A is the expected outcome, re-checked at Phase 1. | PASS |
| V. Screen/Component Structure Mirrors Product Domains | Not applicable — no screen or component added; the fix is cross-cutting test tooling, same category as `jest.config.js` itself. | PASS |
| VI. Spec Before Code, One Spec Per Feature | This one `spec.md`; no platform-specific spec needed — the "platform note" here is which CI runner class matters, captured inline in spec.md's Re-verification/Success Criteria rather than as a separate document. | PASS |
| VII. Accessible and Responsive by Default | Not applicable — no UI changed. The one test this feature is anchored on (`LoginScreen.test.tsx`'s alert-role regression guard, spec.md Acceptance Scenario 3) is explicitly required to keep asserting the same accessibility behavior it already asserts (FR-002). | PASS |
| VIII. Local-First Development | Directly relevant and explicitly reasoned about: this feature's whole premise is that "works locally" is *not* sufficient evidence here (spec.md Assumptions) — the fix must be locally invisible (Acceptance Scenario 4) while being proven on CI, not the other way around. | PASS |

No violations requiring a Complexity Tracking entry.

## Research Decisions

### The actual jest-setup-file mechanism: mock `expo-font`, not every `@expo/vector-icons` icon family

- **Decision**: Rather than mocking `@expo/vector-icons` itself (which would require stubbing
  every icon family the repo imports — `Ionicons`, `MaterialCommunityIcons`, and any future
  addition — with a matching component shape), mock `expo-font`'s `isLoaded` to always return
  `true` in the new `jest.setup.ts`. Read directly (`node_modules/@expo/vector-icons/build/
  createIconSet.js`): each `Icon` instance's initial state is `{ fontIsLoaded:
  Font.isLoaded(fontName) }`, and `componentDidMount` only `await`s `Font.loadAsync(...)` then
  `setState(...)` when `!this.state.fontIsLoaded`. If `Font.isLoaded` always reports `true`, that
  branch never executes — no async work, no post-render `setState`, no `act()` warning — for
  every icon family, automatically, with one small mock of one function from one already-
  transitive-dependency module.
- **Rationale**: Smaller, more targeted surface than mocking the whole `@expo/vector-icons`
  package (which the kickoff brief itself only offered as "the conventional remedy," not a
  mandated shape). Mocking `expo-font` directly addresses the exact code path that produces the
  warning (confirmed by reading the source, not assumed), needs no per-icon-family maintenance as
  new icons are added, and does not require guessing at every prop shape a stub `Icon` component
  would need to remain a faithful enough replacement for RNTL queries (`getByRole`,
  `getByLabelText` etc. some suites may use against rendered icons).
- **Alternatives considered**: (a) `jest.mock("@expo/vector-icons", () => ...)` with a hand-built
  stub for each family — rejected as more code, more maintenance, and no more effective than the
  `expo-font` mock at the actual root cause. (b) A global `jest.setup.ts` addition that wraps
  every `render()` call in `act()` automatically (e.g. via a custom test wrapper) — rejected:
  RNTL's `render()` already wraps synchronous updates in `act()`; the problem here is
  specifically an *asynchronous*, post-render `setState` from an `await` inside
  `componentDidMount`, which no synchronous `act()` wrapper around `render()` itself can capture
  — the fix has to prevent the async update from happening at all (or genuinely await it), not
  paper over the warning.
- **To be confirmed during implementation, not pre-decided here**: whether mocking `expo-font`
  alone is sufficient to silence every instance of the warning (SC-003), or whether some suite
  also needs `@testing-library/react-native`'s `waitFor`/an explicit `await act(async () => {})`
  added at its own render call if a component's *own* async work (not just the icon's) is also
  unwrapped. `task-implementer` should re-run the full suite with `--verbose` after the
  `expo-font` mock and grep for the warning as the concrete check (spec.md SC-003), not assume
  one mock is enough without checking.
- **CONFIRMED BY IMPLEMENTATION (Round 2), two real findings worth recording so nobody re-derives
  them**: (1) `setupFiles` and `setupFilesAfterEnv` (this plan's original text called the latter
  `setupFilesAfterEach`, which does not exist as a jest config key — a factual typo, corrected
  here) were BOTH empirically tested and both fully silence the target warning; `setupFiles` was
  kept because this specific mock needs no test-framework globals, matching what the hook is
  documented for — not because the alternative failed. (2) The fix eliminates every
  `@expo/vector-icons`/`Icon` warning, consistently (44 → 0 across 6+ runs), but does NOT touch a
  separate, pre-existing, unrelated, low-probability warning from `useKycGate.test.ts`
  (`@tanstack/query-core`'s `notifyManager`, a real timer race, ~1/3 of full-suite runs) —
  correctly left alone as out of this feature's scope (FR-001/FR-004 target `@expo/vector-icons`
  specifically). **Most importantly**: this fix's own real CI evidence (PR #10, run 31232122050)
  proved it does NOT fix the timeout — see spec.md's Round 2 Amendment. Kept anyway; it is a real,
  independently valuable improvement, just not the answer to this feature's actual question.

### Bounding jest's worker concurrency in CI — NEW (Round 2), the actual fix

Real CI evidence (PR #10) falsified this plan's original premise that the `expo-font`/`act()`
path was the timeout's cause. Two further candidate remedies were evaluated and eliminated by
measurement before the real cause was found — recorded here for completeness, not repeated from
spec.md's fuller numbers:

- **Module/module-graph warming in a jest setup file**: dead. `setupFiles` cannot use `expect`
  (`ReferenceError: expect is not defined` — that global doesn't exist until the test framework
  itself is installed, which happens after `setupFiles` runs); from `setupFilesAfterEnv` it loads,
  but more than doubles total local test time (9363ms → 20173ms) and makes the target test
  *slower* (308ms → 432ms), because a setup file runs once per test **file**, against that file's
  own fresh module registry — warming one file's registry is invisible to the next file's.
- **A cheap canary test**: dead on the premise itself — top-level `import` statements evaluate at
  module load, before any individual test's 5000ms clock starts, so the "first-test cost" was
  never being charged to a canary's own clock either; a canary could only "absorb" cost by
  rendering, which just relocates the risk of timing out onto the canary.

**The real, measured root cause**: CPU contention from jest's default worker-pool
oversubscription. On a 14-core dev machine, the SAME failing test measured **69ms** at
`--maxWorkers=1`, **146ms** at `--maxWorkers=2`, **154ms** at `--maxWorkers=4`, and **308ms** at
jest's default (13 workers) — a ~4.5x local inflation from contention alone, with no code change
between rows. In isolation (own file, own process) the same test is 145–147ms; at
`--maxWorkers=1` it is statistically indistinguishable from its own siblings (56–111ms) in the
same file. This explains the "first test in a heavy suite" pattern Round 1 (and the original
kickoff brief) observed: it is an artifact of scheduling contention among concurrently-running
workers, not intrinsic per-test work — it vanishes entirely once there is no contention.

- **Decision (human-settled, not a plan-time judgment call): `--runInBand` in CI.** Single jest
  worker process, zero cross-test/cross-suite contention possible, by construction — not merely
  reduced. Applied ONLY when `CI` (the standard, GitHub-Actions-set environment variable) is
  `"true"`.
- **Rationale**: `--maxWorkers=2` was explicitly considered and rejected — extrapolating the
  measured CI slowdown pattern, it would likely land the target test somewhere near 4–5s against
  the 5000ms limit, which is not a real fix, it is a future flake waiting on the next slightly
  heavier commit or a slightly busier neighbor on a shared runner. `--runInBand`'s local
  measurement (69ms, indistinguishable from ordinary sibling tests) is the only one of the four
  measured settings that gives a genuinely wide margin rather than a load-dependent one — and
  after one insufficient remedy already shipped and failed on real CI, "clear margin" is the
  correct bar, not "passes by some amount."
- **Wall-clock tradeoff, stated plainly rather than hidden**: fewer workers RAISES total suite
  wall time (locally: ~2.4s at jest's default → ~9.8s at `--runInBand`) while LOWERING per-test
  latency — the opposite of what "faster is better" intuition suggests, and correct here because
  the 5000ms **per-test** timeout is the actual binding constraint, not the CI job's 20-minute
  **total** budget, which the whole job (all 8 `init.sh` stages) currently uses only ~2m30s of
  (per `014-continuous-integration`'s own closing measurement) — enormous headroom even after a
  several-fold increase in only the jest stage (SC-006).
- **Where the setting lives, and why (FR-010)**: a `CI`-conditional inside `init.sh` stage 7 (the
  single place `npm test` is invoked — confirmed directly: stage 7 is guarded by `SKIP_TESTS`,
  then a `node -e` check that `package.json` has a `scripts.test`, then plainly `npm test
  >/tmp/init-sh-front-tests.log 2>&1`). Flags pass through correctly: `npm test -- --runInBand`
  (verified: `npm test -- --maxWorkers=2 --listTests` correctly forwards flags to the underlying
  `jest` invocation). GitHub Actions sets `CI=true` automatically for every step of every
  workflow — `.github/workflows/ci.yml` needs no edit to provide it. Concretely, stage 7 becomes:
  when `SKIP_TESTS` is unset/false and a `test` script exists, run `npm test -- --runInBand` if
  `[ "$CI" = "true" ]`, else the existing unflagged `npm test` — everything else about the stage
  (the `SKIP_TESTS`/no-test-script branches, the log file, the `add_result` calls) is unchanged.
- **Alternatives considered and rejected, per the human's explicit instruction not to leave this
  as an open choice**: (a) `jest.config.js`'s `maxWorkers`/`runInBand` — rejected, this would slow
  every LOCAL run too (jest.config.js has no notion of "only when CI"), directly contradicting
  FR-009's local-invisibility requirement; the whole point is a developer's fast, fully-parallel
  local loop is untouched. (b) A new `package.json` `test:ci` script (e.g. `"test:ci": "jest
  --runInBand"`) invoked instead of `npm test` when in CI — rejected for the same reason
  `014-continuous-integration`'s own plan.md rejected an analogous `"ci"`/`"verify"` script: it
  would add a second place "how tests run" is defined, which could drift from what `init.sh`
  itself considers canonical, and `init.sh` is already this repo's single source of truth for
  verification (per `docs/verification.md`/`AGENTS.md`). (c) Passing `--maxWorkers=2` instead of
  `--runInBand` — rejected per the human's explicit decision above (too close to the 5000ms
  boundary based on extrapolated CI numbers, not a real fix).

### CI evidence mechanism — SUPERSEDED (Round 2), kept for history only

**Do not act on the "Decision" below — it is superseded.** The human chose Option (d) (merge
`014`'s PR #9 to `main` first, commit `0589e03`) rather than this plan's Option (c) recommendation.
`main`, and this feature's own branch (cut from that `main`) and its own PR (**#10**), already
carry `.github/workflows/ci.yml` — there is no need for, and no throwaway branch/PR exists or
should be created. Every "empirically confirmed" measurement in this feature (the `act()` fix's
insufficiency; the upcoming `--runInBand` fix) is obtained directly from PR #10's own real CI
runs. The text below is preserved verbatim only so a future reader can see what was originally
planned and why the human diverged, per this feature's own instruction to record such reversals
rather than silently drop them.

This is the hard planning problem named explicitly in this feature's kickoff brief. Restating the
constraint precisely: `.github/workflows/ci.yml` exists only on the unmerged
`014-continuous-integration` branch (its PR #9 is open, red only because of the bug this feature
fixes). A branch cut cleanly from `main` has no workflow, so its own PR would get no check — but
this feature's entire point is to prove the fix works on a *real* CI runner, and spec.md's
Re-verification section already shows local evidence alone is not meaningful here.

- **Decision: Option (c)** — cut this feature's branch (`015-ci-test-timeout`) from an
  up-to-date `main` (clean diff: `jest.setup.ts` + `jest.config.js` edit only, zero `014`
  commits). Separately, once the fix is implemented and passing locally, obtain real CI evidence
  via a **short-lived, throwaway branch/PR**: cherry-pick (not rebase, not merge — a plain
  `git cherry-pick`, which does not rewrite `015`'s own branch history, only creates new commits
  on a disposable third branch) `014`'s two workflow commits (`e309d45`, `7b69138`) onto a new
  branch created from `015-ci-test-timeout`'s tip, push it, open a PR against `main` **purely to
  get a real `CI / verify` run**, watch it to completion, record the measured numbers (spec.md
  FR-005/FR-007), and then **close that PR without merging it** and delete its throwaway branch.
  `015-ci-test-timeout`'s own branch and PR are never touched by this — the throwaway branch is a
  disposable side artifact, not part of this feature's real diff or history.
- **Rationale — why (c) over the other three options the human already analyzed**:
  - **(a) Cut `015` from `014`'s branch** — rejected (also rejected by the human at kickoff):
    would make `015`'s "own PR" actually contain `014`'s entire diff too, so merging it would
    also merge `014`, collapsing the two into one merge and directly contradicting FR-008 ("015
    merges before 014" only makes sense if they are separate merges).
  - **(b) Cherry-pick the workflow onto `015`'s own branch, then remove it before merge** —
    rejected (also rejected by the human at kickoff): this would require rewriting `015`'s own
    branch history (add the workflow, get evidence, then `git revert`/`reset` it back out before
    merge) — reverting is fine, but doing so in a way that leaves `015`'s branch history clean
    enough to not confuse a reviewer either means force-pushing after a `reset --hard` (explicitly
    forbidden without authorization, and against this repo's `feature-branch` skill) or leaving a
    "add workflow" + "remove workflow" commit pair in `015`'s real history (noisy, and makes
    `015`'s shipped diff *not* actually clean, since `git diff main...015-ci-test-timeout` would
    show zero net workflow change but the commit log would carry two confusing commits about a
    file `015` never actually ships).
  - **(d) Ask the human to merge `014`'s PR #9 first** despite its currently-red check — rejected
    for this plan's own recommendation (not because it wouldn't work mechanically — nothing is
    branch-protected yet, so a red check on `main` would merge fine) but because it **directly
    reverses FR-008**, a requirement this spec restates from the human's own settled kickoff
    decision. Per this feature's own instruction ("if your recommendation is (d)... surface it as
    an explicit question for the approval gate rather than assuming it"), this plan does **not**
    recommend it — but names it here as the one fallback to explicitly ask the human about if (c)
    proves impractical at implementation time (see "If (c) is declined" below), rather than
    silently substituting it.
  - **(c) wins** because it is the only option that gets a *real* `ubuntu-latest` CI run (unlike
    doing nothing and trusting local results, which spec.md's Re-verification section already
    shows is not meaningful for this specific bug) while leaving both `015`'s shipped diff/history
    genuinely clean **and** the human's settled merge order (FR-008) completely intact. Its one
    real cost — an extra, throwaway PR, and the corresponding human authorization to open and
    close it — is explicitly accepted by the human's own framing of this option in the kickoff
    brief ("costs an extra PR, and needs human authorization to open it").
- **Execution constraint, restated from this feature's kickoff instructions**: opening the
  throwaway PR (and pushing `015-ci-test-timeout` itself) requires explicit human authorization
  at the time — `task-implementer` must not treat this plan's *recommendation* of Option (c) as
  standing authorization to actually push/open anything; that authorization happens at
  implementation time, per this repo's normal push/PR/merge gating. `tasks.md` reflects this by
  marking the relevant task as needing that go-ahead explicitly, not assuming it.
- **If (c) is declined or turns out to be impractical** (e.g. the human prefers not to open a
  throwaway PR at all): the fallback is to ask the human directly whether to proceed with Option
  (d) instead (merge `014`'s PR #9 first, reversing FR-008's stated order) — this is a genuine,
  human-only decision this plan does not make on its own, consistent with this feature's kickoff
  instruction.
- **What "close unmerged" means for evidence retention**: before closing the throwaway PR, the
  measured numbers (SC-001/SC-004's actual millisecond values, the full pass/fail summary, and a
  link/reference to the throwaway run) MUST be copied into
  `progress/impl_015-ci-test-timeout.md` — the throwaway PR/branch disappearing afterward must
  not mean the evidence disappears too.

### What "empirically confirmed" means, precisely (FR-005/FR-006/SC-001)

**UPDATED (Round 2)**: "the real `ubuntu-latest` run" below now unambiguously means **this
feature's own PR #10's** `CI / verify` run (no throwaway run — see "CI evidence mechanism" above)
— and this section's own warning about not trusting a bare pass is not hypothetical: it is
exactly what this feature's first remedy needed and didn't get (the `act()` fix reasoned
correctly locally and still failed for real on CI).

- **Decision**: "Confirmed" means reading the actual per-test duration for
  `LoginScreen.test.tsx`'s first test (and `CrearCuentaScreen.test.tsx`'s, per FR-007) directly
  from the real `ubuntu-latest` run's logs (jest's own per-test timing output, or `--json` output
  captured as a workflow artifact if more precise numbers are wanted) — not inferring "it must be
  fine because the check went green," since a bare pass close to 5000ms is exactly the kind of
  fragile margin SC-001 is designed to catch (the kickoff brief's own measured >16x local-to-CI
  blowup on this exact test shows how easily a bare pass could regress again on the next slightly
  heavier commit).
- **Rationale**: A red/green check alone answers "did it happen to pass this one time," not "is
  there real margin." Given this repo's own repeated "green tests, broken app"/"green CI, fragile
  margin" lesson (named explicitly in `013`'s and `014`'s own `feature_list.json` entries), this
  feature should not repeat that pattern by treating a bare pass as sufficient.
- **Alternatives considered**: Trusting the check's pass/fail alone — rejected for the reason
  above. Adding a jest reporter that fails the whole suite if any test exceeds e.g. 3000ms —
  considered as a *possible future* hardening (worth floating to the human as a follow-up, not
  in this feature's scope, since it would itself need careful calibration against every existing
  suite to avoid false positives) but not adopted here, since this feature's job is fixing the
  one confirmed cause, not building a new enforcement mechanism.

## Project Structure

### Documentation (this feature)

```text
specs/015-ci-test-timeout/
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
jest.setup.ts                      # NEW, IMPLEMENTED (T002) — mocks expo-font's isLoaded() to
                                    # always return true (see "actual jest-setup-file mechanism"
                                    # Research Decision above), preventing @expo/vector-icons'
                                    # Icon component from ever entering its async
                                    # componentDidMount branch during tests. No application code
                                    # touched. Referenced by jest.config.js's setupFiles. KEEP —
                                    # real, valuable, independent of whether it alone fixes the
                                    # timeout (it doesn't).

jest.config.js                     # MODIFIED, IMPLEMENTED (T003) — additive only: setupFiles:
                                    # ["<rootDir>/jest.setup.ts"]. Every other existing key
                                    # (preset, moduleNameMapper, modulePathIgnorePatterns)
                                    # untouched.

init.sh                            # NEW (Round 2) — stage 7 ("Running test suite") gains a
                                    # `CI`-conditional: when `[ "$CI" = "true" ]`, run `npm test
                                    # -- --runInBand` instead of the existing unflagged `npm
                                    # test`. Everything else about the stage (SKIP_TESTS branch,
                                    # no-test-script branch, log file path, add_result calls)
                                    # unchanged. A developer's local, unflagged (no CI env var)
                                    # run is byte-for-byte unaffected — same additive pattern
                                    # `014-continuous-integration` established for
                                    # `--skip-install`.

src/features/identity/LoginScreen.test.tsx   # UNCHANGED — zero assertion edits (FR-002),
                                              # confirmed via git diff at T005. Stays unchanged
                                              # for the Round 2 fix too — --runInBand needs no
                                              # test-file change of any kind.

progress/impl_015-ci-test-timeout.md         # EXISTS, being appended to across runs — records
                                              # real CI evidence (SC-001/SC-004/SC-006's measured
                                              # numbers) from this feature's own PR #10.
```

`.github/` is NOT part of this feature's shipped diff — `.github/workflows/ci.yml` already exists
on `main` (via `014`, merged first) and is not modified by this feature.

**Structure Decision**: Single Expo project, unchanged (Constitution I). This feature's shipped
footprint is `jest.setup.ts` (new), `jest.config.js` (modified), and `init.sh` (modified,
additive) — still the smallest footprint of any `"sdd": true` feature in this repo to date,
consistent with it being a targeted infrastructure fix, not a UI feature (spec.md FR-003).

## Data Model

None. See spec.md's Key Entities section (N/A).

## Interface Contracts

This feature's interfaces are both internal, plain-file contracts — not an HTTP endpoint or SDK
call:

| Hook | File | Behavior |
|---|---|---|
| `setupFiles` | `jest.setup.ts` | `jest.mock("expo-font", () => ({ ...jest.requireActual("expo-font"), isLoaded: () => true }))` — implemented, spreading the real module's other exports so nothing else `expo-font` provides is affected. |
| `init.sh` stage 7, `CI`-conditional | `init.sh` | When `[ "$CI" = "true" ]`: `npm test -- --runInBand`. Otherwise (default, local): the existing, unmodified `npm test`. `CI=true` is set automatically by GitHub Actions for every workflow step — no `.github/workflows/ci.yml` edit needed to provide it. |

~~**CI-evidence-only artifact**...~~ **Superseded (Round 2)** — no throwaway artifact; see "CI
evidence mechanism" above.

## Quickstart Validation

**UPDATED (Round 2).** T002–T005 (the `jest.setup.ts` fix) are already implemented and locally
verified — see `progress/impl_015-ci-test-timeout.md`'s Run 1. What remains:

1. Implement the `init.sh` stage 7 `CI`-conditional (Round 2's "Bounding jest's worker
   concurrency in CI" Research Decision). Verify locally, twice: (a) run `./init.sh` (or `npm
   test`) with no `CI` env var set — confirm stage 7 behaves exactly as before this change (full
   parallel run, same wall-clock ballpark as today); (b) run `CI=true ./init.sh --skip-install
   --skip-build` (or `CI=true npm test -- --runInBand` directly) — confirm stage 7's log shows
   jest actually ran with `--runInBand` (e.g. jest's own startup log naming a single worker, or
   the ~4x local wall-clock increase Round 2's measurement table predicts) and that all tests
   still pass.
2. Confirm `git diff -- src/features/identity/LoginScreen.test.tsx` is empty (FR-002 — still
   true, this remedy touches no test file).
3. **Requires explicit, real human authorization to push** (already given for PR #10 specifically,
   per the coordinator's Round 2 instruction — re-confirm at execution time if resuming from a
   different session): push the `init.sh` change to `015-ci-test-timeout` (PR #10's branch).
   Watch its `CI / verify` check run to completion on the real `ubuntu-latest` runner.
4. From that run's logs, record in `progress/impl_015-ci-test-timeout.md`: (a) the full pass/fail
   summary; (b) `LoginScreen.test.tsx`'s first test's exact measured duration; (c)
   `CrearCuentaScreen.test.tsx`'s first test's duration (FR-007); (d) the total job duration
   (SC-006).
5. Compare against SC-001/SC-004 (under 3000ms) and SC-006 (comfortably within the 20-minute job
   timeout). If all pass with clear margin: this feature is done — proceed to close it out
   (`feature_list.json` status, `docs/verification.md` update, etc., per `tasks.md`'s Polish
   phase).
6. If any duration fails its margin — this is the SAME escalation FR-006 already required once:
   do NOT add `testTimeout`. Set `feature_list.json`'s `015-ci-test-timeout` status to `blocked`,
   record the measured numbers and remaining options in `progress/current.md`, and stop for the
   human.

## Complexity Tracking

*No Constitution Check violations — table intentionally empty.*


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
