# Implementation Plan: CI Test Timeout Fix

**Branch**: `015-ci-test-timeout` | **Date**: 2026-08-07 | **Spec**: `specs/015-ci-test-timeout/spec.md`

**Input**: Feature specification from `specs/015-ci-test-timeout/spec.md`

**Note**: Like `005-login` and `014-continuous-integration`, this folds Phase 0 (research) and
Phase 1 (data model / contracts / quickstart) into this single file rather than separate
`research.md`/`data-model.md`/`contracts/`/`quickstart.md` documents — this feature has no
persisted entity (spec.md's Key Entities is explicitly N/A) and its "interface contract" is a
jest configuration/setup-file shape, short enough to document inline below.

## Summary

Add a jest setup file (`jest.setup.ts`, wired via `jest.config.js`'s `setupFiles`) that neutralizes
`@expo/vector-icons`' unmocked async font-loading `setState` (the confirmed source of the
"Icon inside a test was not wrapped in act(...)" warnings) repo-wide, with **zero** application
code or assertion changes. Then — this is the load-bearing part of this plan, not an
afterthought — obtain a real, empirical measurement of `LoginScreen.test.tsx`'s first test on an
actual `ubuntu-latest`, 2-core GitHub Actions runner, because a green local run proves nothing
here (the bug is already 630/630 green locally today). Since `.github/workflows/ci.yml` exists
only on the unmerged `014-continuous-integration` branch, this plan resolves how this feature's
own PR — which must merge to `main` *before* `014`'s PR #9 (FR-008) — gets that real measurement
without collapsing the two features' merges together. If the measurement shows the fix is
sufficient (SC-001/SC-004's margins), this feature is done. If not, FR-006 requires stopping and
escalating to the human rather than adding `testTimeout`.

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
`ubuntu-latest` runner (SC-001); `CrearCuentaScreen.test.tsx`'s first test likewise (SC-004). Not
a speed feature otherwise — no target for the full suite's total wall-clock time.

**Constraints**: Zero application behavior change (FR-003). Zero assertion weakening (FR-002).
No `testTimeout` change without an explicit human-authorized escalation (FR-001/FR-006). Must
merge before `014`'s PR #9 (FR-008). No history-rewriting on this feature's own branch (repo's
`feature-branch` skill).

**Scale/Scope**: One new file (`jest.setup.ts`, likely 20–40 lines), a 1–3 line addition to
`jest.config.js` (`setupFiles: ["<rootDir>/jest.setup.ts"]` or similar), and — only if the
mock-based approach alone proves insufficient once measured — a small, additive, defensive
change to how `Icon`-rendering components behave under test (still zero visible-behavior change).
Plus the throwaway CI-evidence artifact described below, which is explicitly NOT part of this
feature's shipped diff.

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

### CI evidence mechanism — how this feature's own PR gets a real CI check before `014` merges

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
jest.setup.ts                      # NEW — mocks expo-font's isLoaded() to always return true
                                    # (see "actual jest-setup-file mechanism" Research Decision
                                    # above), preventing @expo/vector-icons' Icon component from
                                    # ever entering its async componentDidMount branch during
                                    # tests. No application code touched. Referenced by
                                    # jest.config.js's setupFiles.

jest.config.js                     # MODIFIED — additive only: a new setupFiles (or
                                    # setupFilesAfterEach, whichever Phase 1/implementation
                                    # confirms is the correct hook for a mock that must be in
                                    # place before any module under test imports expo-font)
                                    # entry pointing at jest.setup.ts. Every other existing key
                                    # (preset, moduleNameMapper, modulePathIgnorePatterns —
                                    # whatever state that key is actually in on main when this
                                    # feature's branch is cut, see spec.md Assumptions)
                                    # untouched.

src/features/identity/LoginScreen.test.tsx   # UNCHANGED — zero assertion edits (FR-002). Only
                                              # touched if, after measurement, a specific
                                              # component-level defensive fix (not this file's
                                              # test code) is needed and that fix's own new
                                              # behavior needs a new, additive test — decided
                                              # only if research proves insufficient, not
                                              # pre-planned.

progress/impl_015-ci-test-timeout.md         # NEW (once implementation starts) — records the
                                              # real CI evidence (SC-001/SC-004's measured
                                              # numbers) per the "CI evidence mechanism" Research
                                              # Decision's retention requirement.
```

Nothing under `.github/` is part of this feature's shipped diff — the workflow file used to
gather CI evidence lives only on the temporary, throwaway branch described above, never merged.

**Structure Decision**: Single Expo project, unchanged (Constitution I). This feature's shipped
footprint is exactly two files (`jest.setup.ts` new, `jest.config.js` modified), plus the
progress report — the smallest footprint of any `"sdd": true` feature in this repo to date,
consistent with it being a targeted infrastructure fix, not a UI feature (spec.md FR-003).

## Data Model

None. See spec.md's Key Entities section (N/A).

## Interface Contracts

This feature's only "interface" is the jest setup/config contract between `jest.config.js` and
the new `jest.setup.ts` — not an HTTP endpoint or SDK call:

| Hook | File | Behavior |
|---|---|---|
| `setupFiles` (or `setupFilesAfterEach` — confirm at implementation time which jest lifecycle hook runs early enough to mock `expo-font` before any test file's own imports resolve it) | `jest.setup.ts` | `jest.mock("expo-font", () => ({ ...jest.requireActual("expo-font"), isLoaded: () => true }))` (exact shape to be finalized in implementation — spreading the real module's other exports keeps anything else `expo-font` provides working unchanged, only `isLoaded` is overridden) |

**CI-evidence-only artifact** (never merged, not part of this feature's real interface, listed
here only so `task-implementer` knows exactly what the throwaway branch needs): `014`'s
`.github/workflows/ci.yml` as of commits `e309d45`+`7b69138`, cherry-picked verbatim onto a
disposable branch created from `015-ci-test-timeout`'s tip.

## Quickstart Validation

Once `tasks.md` is implemented, validate:

1. Run `npx jest src/features/identity/LoginScreen.test.tsx --verbose` locally and confirm all 11
   tests still pass, with the same assertions as before (spot-check the first test's output
   against spec.md's Acceptance Scenario 3 list).
2. Run the full suite locally (`npx jest` or `./init.sh`) and confirm `630/630` still pass (the
   count may have grown if other work has landed since this spec was written — confirm it matches
   whatever `main` reports at implementation time, not a hardcoded 630).
3. Run `npx jest --verbose 2>&1 | grep -c "not wrapped in act"` (or equivalent) and confirm `0`
   (SC-003) — currently non-zero whenever an icon-rendering suite runs (confirmed in this feature's
   Re-verification section, e.g. `Viewfinder.test.tsx`).
4. Follow the "CI evidence mechanism" Research Decision above: cherry-pick `014`'s workflow onto a
   throwaway branch, open a throwaway PR against `main` (human authorization required), observe
   the real `ubuntu-latest` run, and record `LoginScreen.test.tsx`'s and
   `CrearCuentaScreen.test.tsx`'s first-test durations from that run's logs.
5. Compare those durations against SC-001/SC-004 (under 3000ms). If both pass with margin, close
   the throwaway PR unmerged, delete its branch, and record the evidence in
   `progress/impl_015-ci-test-timeout.md`. This feature is now ready for its own (real, `015`-only)
   PR against `main`.
6. If either duration fails SC-001/SC-004's margin, do not proceed to open `015`'s real PR — set
   `feature_list.json`'s `015-ci-test-timeout` status to `blocked`, record the measured numbers
   and remaining options (spec.md Clarifications' second bullet / FR-006) in
   `progress/current.md`, and stop for the human.

## Complexity Tracking

*No Constitution Check violations — table intentionally empty.*
