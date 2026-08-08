# Code Review: 015-ci-test-timeout

**Reviewed**: `git diff main...HEAD` on branch `015-ci-test-timeout` (commits `3beabfe`,
`6c32285`). Scope: `jest.setup.ts` (new), `jest.config.js` (`setupFiles` addition), `init.sh`
stage 7 (`CI`-conditional `--runInBand` branch), plus `specs/015-ci-test-timeout/*` and
`progress/*`.

Verified independently (not trusted from `progress/impl_015-ci-test-timeout.md`):

- `node_modules/.bin/tsc --noEmit` → clean, exit 0.
- `npx jest` (local, no `CI`) → `Test Suites: 85 passed, 85 total`, `Tests: 630 passed, 630
  total`.
- `npx jest --verbose | grep -c "not wrapped in act"` → ran twice; one run `0`, one run `2` (both
  occurrences were the pre-existing, unrelated `HookContainer`/`@tanstack/query-core` timer race
  in `useKycGate.test.ts`, not `@expo/vector-icons`/`Icon` — matches the report's own honest
  finding of an intermittent, pre-existing, out-of-scope flake).
- `git diff main...HEAD -- src/features/identity/LoginScreen.test.tsx` → empty (byte-for-byte
  unchanged).
- `git diff main...HEAD --name-only | grep -E '^(app/|src/)'` → no output (zero application-code
  changes).
- `grep -rn "testTimeout" jest.config.js jest.setup.ts init.sh` (repeated independently) → no
  hits; `jest.setTimeout` also absent anywhere in the diff.
- `./init.sh` (no skip flags, `--skip-install` only) → `RESULT: SUCCESS (10/10 stages passed)`,
  all three bundle exports green, only the two pre-existing documented WARNs (expo-doctor,
  native-dep drift).
- `./init.sh --skip-install --skip-build --skip-doctor --skip-native` with **no** `CI` set →
  `Tests: all tests passed` (unflagged branch, byte-for-byte prior behavior).
- Same, with `CI=true` → `Tests: all tests passed (--runInBand, --runInBand, CI=true)` branch
  taken; log shows jest ran `Time: 9.7s` in-band vs ~2.2s parallel, consistent with the spec's
  own measurements.
- Same, with `CI=true SKIP_TESTS=true` → `SKIP_TESTS` branch still wins over the new `CI` branch
  (correct `elif` precedence).
- **Injected a genuine failing test** (`expect(1).toBe(2)`) into `jest.setup.ts`, ran `CI=true
  ./init.sh --skip-install --skip-build --skip-doctor --skip-native` → `❌ [FAIL] Tests: ...`,
  `RESULT: FAILED (1/8 stages failed)`, and `init.sh`'s own exit code was **1** (confirmed via
  `$?` after a non-piped invocation). Reverted the injected failure immediately;
  `git diff --stat -- jest.setup.ts` is empty again. This answers reviewer question 2 directly:
  the new `CI` branch's duplicated OK/FAIL logic is not broken — a genuine failure still produces
  `FAIL` and a non-zero `init.sh` exit.

## 1. Is the `init.sh` change genuinely additive for developers?

**Yes, confirmed.** The new branch is inserted as a third `elif` between the existing
`SKIP_TESTS`/no-test-script checks and the final unflagged `npm test` fallback
(`init.sh:215-229`):

```
if [ "$SKIP_TESTS" = true ]; then ...
elif ! node -e '...scripts?.test...'; then ...
elif [ "${CI:-}" = "true" ]; then          # NEW
  ...npm test -- --runInBand...
elif npm test >... 2>&1; then ...          # unchanged, now only reached when CI is unset/not "true"
else ...
fi
```

`SKIP_TESTS=true` and the missing-`scripts.test` case are evaluated *before* the new `CI`
branch, so they still take unconditional precedence (verified above:
`CI=true SKIP_TESTS=true` still reports "skipped (--skip-tests)"-equivalent priority — the
`SKIP_TESTS` branch wins). A local run with no `CI` env var is byte-for-byte the same code path
as before this change (`elif npm test ...`), and was verified to behave identically. The
`${CI:-}` guard (rather than a bare `$CI`) is correctly reasoned given `set -uo pipefail` at
`init.sh:34` — a bare `$CI` would abort every local run under `set -u`; this was independently
confirmed (`bash -uo pipefail -c 'unset CI; [ "$CI" = "true" ]'` aborts with "unbound variable").
**Sound, no issues.**

## 2. Could the CI branch mask a real failure?

**No — confirmed empirically, not just by reading the code** (see the injected-failure test
above). The new branch's `if npm test -- --runInBand >log 2>&1; then OK; else FAIL; fi` mirrors
the pre-existing `elif npm test >log 2>&1; then OK; else FAIL; fi` shape exactly, and produces
the correct `FAIL` grade and non-zero script exit on a genuine failure.

**Duplication is real and is a legitimate, if minor, maintenance-risk nit**: the OK/FAIL
`add_result` calls and log-tail formatting are copy-pasted between the two branches
(`init.sh:220-224` vs `226-229`) rather than factored into a shared helper (e.g. a
`run_tests "$@"` function parameterized by the extra jest flag). If a future edit changes the
FAIL message format, the log path, or adds a new flag, it would need to be applied in both
places — nothing enforces that today. Not blocking (both branches are currently identical in
shape and correctly tested), but worth a follow-up refactor if `init.sh` grows more such
CI-only variants.

## 3. Is `jest.setup.ts`'s `expo-font` mock sound?

**Yes.** Read `node_modules/@expo/vector-icons/build/createIconSet.js` directly to confirm the
claimed code path: `Icon`'s constructor sets `state.fontIsLoaded = Font.isLoaded(fontName)`, and
`componentDidMount` only `await`s `Font.loadAsync` + `setState` when that's `false`. Forcing
`isLoaded` to always return `true` short-circuits the branch entirely — no async work, no
post-render `setState`, for every icon family, via one function of one already-transitive
dependency. `jest.requireActual` spreads every other real export, so nothing else `expo-font`
provides is touched.

On the "less truthful" question: in production, icon fonts are typically already resolved by
the time a screen renders (loaded once at app startup, not per-screen), so forcing `isLoaded`
true in tests is arguably *closer* to steady-state production behavior than the default
jest/RN-testing-environment state (`isLoaded` always `false`, which no real user ever
experiences either). No test in the suite asserts on an icon's "still loading" state — the mock
doesn't weaken or contradict any existing assertion; it only removes noise from a code path no
test exercises meaningfully. Confirmed via `git diff` that no `.test.tsx` assertions changed.
**Sound, no truthfulness regression.**

## 4. Hard constraints

All confirmed independently, not merely trusted:

- No `testTimeout` anywhere (config, per-file, or `jest.setTimeout`) — `grep` clean.
- `src/features/identity/LoginScreen.test.tsx` byte-for-byte unchanged — `git diff` empty.
- No assertion weakened/removed/altered anywhere — `git diff main...HEAD --name-only` shows only
  `jest.setup.ts` (new), `jest.config.js`, `init.sh`, and `specs/`/`progress/` files; zero
  `.test.*` files touched.
- Nothing under `app/`/`src/` changed — confirmed via `git diff --name-only | grep '^(app/|src/)'`.

## 5. The observability gap — this is a real, unresolved gap, not merely acceptable noise

This is the review's most significant finding. `spec.md`'s own SC-001/SC-004 are explicit and
repeated that a bare pass/fail signal is **not** sufficient evidence:

> "not merely 'did not time out this one time'" (SC-001)
> "If the measured value is between 3000ms and 5000ms, FR-006's escalation path applies rather
> than treating a narrow pass as sufficient." (SC-001)
> "local `--runInBand` measurements ... suggest this margin should be met with room to spare,
> but per FR-005 this MUST still be confirmed on the real runner, not assumed from the local
> number." (SC-001, Round 2)

`014`'s workflow dumps `/tmp/init-sh-front-*.log` (which would contain jest's own per-test
timing) **only `if: failure()`**. On the green run cited (`31233192999`), that means
`LoginScreen.test.tsx`'s and `CrearCuentaScreen.test.tsx`'s actual per-test durations (FR-007,
SC-004) are **not recoverable from that run at all** — only "the whole job passed, so no test
exceeded 5000ms" is known. This is weaker than what FR-005/SC-001/SC-004 explicitly require
("confirmed... not assumed"), and it is weaker than what this same feature already insisted on
once before (Round 1's `act()` fix "looked good locally and still failed for real on CI" is the
spec's own stated reason for distrusting anything short of a directly-read measurement).

This is not merely a documentation nice-to-have: **`tasks.md` T017 and T018 are still
unchecked**, `feature_list.json`'s `015-ci-test-timeout` status is still `"in_progress"` (not
`"done"` or explicitly re-`"blocked"` with fresh numbers), and neither
`progress/impl_015-ci-test-timeout.md` (only has Run 1/Run 2, both dated before the push) nor
`progress/current.md`'s "Next step" section (still describes the pre-push, "blocked on a human
decision" state, mentions neither the `--runInBand` push nor its outcome) reflect that a real
CI run happened, went green, or what its actual measured margin was. This is a genuine gap
between what the task prompt's "established facts" describe (CI green, job 158s) and what the
feature's own required artifacts (`tasks.md`, `progress/impl_*.md`, `progress/current.md`,
`feature_list.json`) currently say — the repo's own paper trail does not yet reflect that this
happened.

**Verdict on whether this is acceptable**: SC-006 (job stays within the 20-minute timeout) is
trivially satisfiable from total job duration alone (158s ≪ 20 min) and could be recorded today.
SC-001/SC-004 (the specific <3000ms per-test margin) genuinely cannot be recovered from this
particular green run under the current workflow — that is a real evidence gap, not a
nitpick, given how emphatically this feature's own spec argues against trusting a bare pass.
This does not mean the fix is wrong (the local `--runInBand` numbers, the mechanism's
by-construction elimination of contention, and the green run together are strong circumstantial
evidence), but the feature's **own self-imposed bar for "done"** has not actually been met in
the repo's artifacts, and nothing currently plans to close that gap (e.g., a follow-up to make
`014`'s workflow always dump timing, or an explicit, recorded human sign-off to accept the total
job-duration proxy in place of the literal per-test number for this one round). This should be
resolved — either by extending the CI workflow to capture per-test timing unconditionally (a
`014` follow-up, out of this feature's own diff) and re-measuring, or by an explicit, written
decision that the total-job-duration proxy is accepted as sufficient for SC-001/SC-004 this
round — before `tasks.md`/`feature_list.json` claim T017/T018 are satisfied.

## 6. Internal consistency of the amended spec/plan/tasks

Read fresh. The Round 2 Amendment sections in `spec.md`, `plan.md`, and `tasks.md`'s header are
internally consistent with each other and with the diff: FR-001 is explicitly marked "AMENDED...
original premise falsified," FR-008/SC-005 are marked "SUPERSEDED," T006/T009/T010 are annotated
with their actual (differently-executed or obsolete) outcomes rather than silently rewritten,
and `plan.md`'s "CI evidence mechanism" Research Decision is struck through and marked
superseded while being kept for history. No falsified claim (e.g., "the `act()`/`expo-font` fix
is what closes the CI timeout") survives unmarked anywhere in the three documents — every place
Round 1's premise appears, it carries a Round 2 correction inline. This part of the
documentation is genuinely well-maintained.

The one place consistency breaks down is **downstream of the spec/plan/tasks trio**: `tasks.md`
itself (T016–T018 unchecked) is consistent with `progress/current.md` and
`progress/impl_015-ci-test-timeout.md` (which also stop before the real push/CI-run outcome) —
but all three are now stale relative to what actually happened (the push, and the green run
cited in this review's brief). That staleness is the same gap as finding 5 above, not a new one.

## Traceability (FR-00x → verification)

| FR/SC | Status | Evidence |
|---|---|---|
| FR-001 (act() fix kept, not sufficient alone; no `testTimeout`) | Met | `jest.setup.ts` present; `grep testTimeout` clean |
| FR-002 (no assertion weakened) | Met | `git diff -- LoginScreen.test.tsx` empty; no `.test.*` touched |
| FR-003 (no app runtime change) | Met | zero `app/`/`src/` diff |
| FR-004 (repo-wide, central mechanism) | Met | one `jest.setup.ts` via `setupFiles`, not per-file |
| FR-005 (empirically confirmed on real CI, read from logs) | **Partially unmet** | run went green (per task brief) but per-test durations are not recoverable from that run's logs (finding 5) |
| FR-006 (no silent `testTimeout` fallback if insufficient) | Met | none added; escalation pattern used correctly twice already (T008) |
| FR-007 (`CrearCuentaScreen.test.tsx` duration recorded on same run) | **Unmet** | not recorded anywhere (T017 unchecked) |
| FR-009 (CI-only bound, local unaffected) | Met | verified: no-`CI` run unchanged, `CI=true` run activates `--runInBand` |
| FR-010 (mechanism in `init.sh` only) | Met | no `jest.config.js`/`package.json` changes for this remedy |
| SC-001/SC-004 (<3000ms margin, recorded) | **Unconfirmed** | see finding 5 |
| SC-002 (630/630, zero regressions) | Met | confirmed locally, multiple runs |
| SC-003 (zero `@expo/vector-icons` act() warnings) | Met | confirmed (intermittent unrelated `HookContainer` warning correctly identified as out of scope) |
| SC-006 (job within 20-min timeout) | Met (recordable) | 158s per task brief, trivially within budget, but not yet written into `progress/impl_*.md` |

## `tasks.md` checklist status (as found on disk)

T001–T008: `[X]`. T009/T010: `[ ]`, correctly annotated superseded/obsolete. T011–T013: `[ ]`
(Phase 4/5, expected — gated on Phase 3b). T014/T015: `[X]`. **T016/T017/T018: `[ ]`** — per
tasks.md's own dependency chain, T018 is "this feature's actual done-criteria"; it has not been
executed/recorded in the repo.

## CHECKPOINTS.md walkthrough

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md` and `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 (verified: `RESULT: SUCCESS (10/10 stages passed)`, only the two
  documented pre-existing WARNs).

**C2 — state coherent**
- [x] At most one feature `in_progress` (`015-ci-test-timeout`; `014` is `blocked`, everything
  else `done`/`pending`/`spec_ready`).
- [x] Every `done` feature has passing tests/documented manual verification (not affected by
  this diff).
- [ ] `progress/current.md` describes only the active session — **fails**: its "Next step"
  section still describes the pre-push, "blocked on a human decision" state and does not mention
  the `--runInBand` fix being implemented, pushed, or its CI outcome (finding 5/6 above).

**C3 — architecture respected**
- [x] `src/domain` unaffected (no changes).
- [x] No component embeds fetch/validation/business rules (no components touched).
- [x] No inline platform conditionals introduced (no UI code touched).
- [x] No direct DB/storage access introduced.
- [x] No new global state library.
- [x] No stray `console.log`/context-free `TODO` introduced in the diff.

**C4 — verification real**
- [x] `src/domain` functions still covered (unaffected).
- [x] No new/changed screens (N/A — infra-only feature).
- [x] `./init.sh`'s three build-target exports pass (verified above, all green), Native
  dependency alignment stage not FAILing (WARN only, pre-existing and documented).

**C5 — session closed well**
- [x] No suspicious untracked files observed in this diff's scope.
- [ ] `progress/history.md` — not checked as part of this diff (out of this feature's own file
  list; not blocking this review, but note it wasn't part of the reviewed diff either).
- [ ] "The last feature worked on is reflected accurately in `feature_list.json`" — **fails** for
  the same reason as C2: status/notes do not reflect the actual latest state (push + green CI
  run) described in this review's brief.

**C6 — SDD**
- [x] `specs/015-ci-test-timeout/` has `spec.md` + `plan.md` + `tasks.md`.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers.
- [ ] N/A — feature not yet `done`, so "every `done` feature has all tasks `[X]`" doesn't
  literally apply, but note T016–T018 remain open precisely because the feature's own
  done-criteria (FR-005/FR-007/SC-001/SC-004) are not yet satisfied in the repo's artifacts.
- [x] FR-00x traceability: every FR is referenced by a plan.md/tasks.md item or verified by an
  explicit local check; the one exception (FR-005/FR-007's real-CI numeric evidence) is the
  central finding of this review, not a silently-skipped requirement — it's visibly still open.

## Findings summary

1. **(Blocking) FR-005/FR-007/SC-001/SC-004 evidence gap**: the real-CI per-test durations for
   `LoginScreen.test.tsx` and `CrearCuentaScreen.test.tsx` this feature's own spec requires as
   its done-criteria are not recoverable from the cited green run (014's workflow dumps
   `/tmp/init-sh-front-*.log` only `if: failure()`) and are not recorded anywhere in
   `tasks.md`/`progress/impl_015-ci-test-timeout.md`/`feature_list.json`. `tasks.md` T016–T018
   remain unchecked. Fix: either (a) record what *is* knowable now (pass/fail, total job
   duration for SC-006) and explicitly, in writing, decide/record whether that's accepted as
   sufficient given the mechanism's by-construction contention elimination, or (b) extend the CI
   workflow to unconditionally capture jest's per-test timing (a `014` follow-up) and re-measure
   before flipping `feature_list.json` to `done`. Either path is fine — leaving it silently open
   with stale progress files is not.
2. **(Non-blocking, process hygiene) Stale progress artifacts**: `progress/current.md`'s "Next
   step" section and `progress/impl_015-ci-test-timeout.md` (Run 1/Run 2 only) both predate the
   `init.sh` change being pushed and its CI outcome, so a reader of just those files would not
   know the `--runInBand` fix was ever pushed. Should be updated alongside closing finding 1.
3. **(Non-blocking nit) `init.sh` OK/FAIL duplication**: the new `CI` branch (`init.sh:219-224`)
   duplicates the existing branch's `add_result` shape (`init.sh:225-229`) rather than sharing a
   helper. Verified correct today (genuine failure → FAIL, non-zero exit) but is a drift risk if
   either branch is edited independently in the future.

Everything else — the `expo-font` mock's soundness, the `init.sh` branch ordering/precedence,
the CI-only scoping, zero app/src changes, zero assertion changes, type-check, and the local
test suite — checks out cleanly on independent verification.

## Verdict

**REQUEST CHANGES** — not because the shipped mechanism is wrong (independent verification
shows it is correctly implemented, additive, locally invisible, and produces a genuine FAIL on a
real failure), but because this feature's own explicit done-criteria (FR-005/FR-007,
SC-001/SC-004 — real, per-test-measured CI evidence, not an inferred pass) have not actually
been satisfied in the repo's artifacts, `tasks.md` T016–T018 are open, and `progress/current.md`
/ `progress/impl_015-ci-test-timeout.md` / `feature_list.json` are stale relative to what has
apparently already happened. `task-implementer` should: (1) record the real CI run's actual
evidence (pass/fail, job duration, and per-test durations if recoverable — flag explicitly if
not) in `progress/impl_015-ci-test-timeout.md`; (2) run T018's evaluation against SC-001/SC-004/
SC-006 explicitly, including an honest statement if the per-test margin genuinely cannot be
confirmed from this workflow's logs; (3) update `tasks.md`'s checkboxes and
`feature_list.json`'s status/notes and `progress/current.md`'s "Next step" to match; (4) if the
per-test-duration gap is accepted as a known limitation rather than closed, get that accepted
explicitly (human sign-off) and record it, rather than leaving `tasks.md` silently incomplete.
