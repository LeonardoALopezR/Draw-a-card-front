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

---

# Round 3 Re-Review (final gate before merge)

**Scope**: `git diff main...HEAD` plus the current working tree (one uncommitted file,
`feature_list.json` — see Finding R3-4). Commits reviewed beyond the prior round:
`b11059c` (workflow log dump `if: failure()` → `if: always()`), `5eb8d3b` (`--verbose` on the
CI-only jest invocation), `430b69e` (`jest.config.js` `cacheDirectory`, `.gitignore`,
`.github/workflows/ci.yml` `actions/cache` step, `init.sh` `--testTimeout=15000`), `6e48fda`
(progress bookkeeping). Also re-read `specs/015-ci-test-timeout/{spec,plan,tasks}.md`,
`progress/impl_015-ci-test-timeout.md`, `progress/current.md`, `feature_list.json`'s `015`/`014`
entries, `.specify/memory/constitution.md`, `docs/conventions.md`, `docs/verification.md`,
`CHECKPOINTS.md`.

## My earlier blocking finding — is it closed?

**Yes, substantively — the numbers are real, accurate, and independently reproducible from
GitHub's own logs, not merely asserted.** I did not trust the task brief's "established
measurements"; I pulled the actual run logs myself:

- `gh run view 31234302973 --log` (the cache-MISS run): `actions/cache@v4` reports
  `Cache not found for input keys: v1-jest-cache-Linux-...`; the dumped log (now visible because
  the dump step is `if: always()`, confirmed at `.github/workflows/ci.yml:60-61`) shows
  `✓ replaces SignInForm with the neutral 'Signing you in…' view... (3999 ms)`,
  `CrearCuentaScreen`'s first test `(1019 ms)`, `Test Suites: 85 passed, 85 total`,
  `Tests: 630 passed, 630 total`, `Time: 28.917 s`. Exact match to the task brief and to
  `feature_list.json`'s notes.
- `gh run view 31234419308 --log` (the cache-HIT run, produced by the deliberately
  key-inert bookkeeping commit `6e48fda`): `actions/cache@v4` reports
  `Cache hit for: v1-jest-cache-Linux-...` and `Cache restored successfully`; the dumped log shows
  the target test at `(311 ms)`, `CrearCuentaScreen` first test `(127 ms)`,
  `Test Suites: 85 passed, 85 total`, `Tests: 630 passed, 630 total`, `Time: 16.26 s`; job
  `startedAt`/`completedAt` (`gh run view --json jobs`) diff to exactly **134s**.
- Both runs: `RESULT: SUCCESS (10/10)` (`✅ [OK] Tests: all tests passed (--runInBand, CI=true)`
  appears twice per run — once from `init.sh`'s own summary, once from the dumped log — confirmed
  in both).

So: yes, the `if: failure()` → `if: always()` switch and `--verbose` genuinely made this
recoverable, and the specific MISS/HIT numbers quoted to me are exactly what's on the runner, not
a misread or a rounding-favorable retelling. **This part of the prior blocking finding is closed
on the merits.**

**However, a materially similar problem has re-appeared one layer up: the evidence is real, but
it is not yet durably and consistently recorded in this feature's own artifacts** — see Findings
R3-1 through R3-4 below. This is the same class of gap the prior review blocked on (real work,
undocumented/inconsistently documented), now smaller in scope but not zero.

## Answers to the six framing questions

**1. Is `--testTimeout=15000` legitimate and correctly scoped?**

Legitimate: yes. FR-006's sign-off requirement is honestly satisfied, not bypassed — the human's
2026-08-07 choice of "(a) cache + (c) scoped timeout" is recorded by name in three places
(`init.sh:221-223`, `tasks.md`'s Phase 3c header, `feature_list.json`'s notes), and the code
comment explicitly states this is "NOT a bypass, and NOT a license to let a genuinely slow test
hide" (`init.sh:223`). This is the correct way to spend an escape hatch: named, dated, and
justified with the specific eliminated alternatives that made it necessary (Round 1's `act()` fix
and Round 2's `--runInBand`, both real but insufficient, both kept anyway).

Scoping: CI-only is correct and independently verified — `jest.config.js` has no `testTimeout`
key (only a comment referencing the flag by name), no test file has `jest.setTimeout`, and I
confirmed locally that an unset-`CI` run keeps jest's 5000ms default with no `--verbose`
(`unset CI; npm test` → plain `PASS <file>` lines, no per-test timings, `Time: 2.367s`).

On the asymmetry question (CI tolerates up to 15s per test, local dev still enforces 5s) — I land
on **sound, with one caveat worth naming explicitly in the docs (it currently isn't, anywhere)**:
`--testTimeout` is a jest CLI flag, not a per-file setting, so it necessarily raises the ceiling
for **all 630 tests in CI**, not just the two identified "first test in a heavy suite" victims —
this was the only implementation path available without violating FR-002 (no test-file edits,
which a per-file `jest.setTimeout` would require) or FR-003 (no app change). Given that, yes,
there is a real, bounded gap: a hypothetical regression that pushes a test from ~150ms to, say,
~4500ms would still pass in CI (under the 15000ms ceiling, nowhere near it) while it would be
flagged locally as flaky/near-limit (under jest's 5000ms default) far sooner. The ceiling is
tightly anchored to the measured cold-cache worst case (3999ms measured → 15000ms, ~3.75x
margin) rather than picked arbitrarily large, which keeps this bounded rather than a blank
check — but the tradeoff itself (CI is now measurably less sensitive than local dev to a
moderate performance regression in these two screens specifically) is not written down anywhere
in `spec.md`/`plan.md`, only reasoned about here. Worth a one-paragraph addition wherever Round
3 gets its proper spec/plan amendment (see Finding R3-1).

**2. Is the cache key correct and safe?**

Yes, and this holds up under adversarial scrutiny. The primary key
(`v1-jest-cache-${{ runner.os }}-${{ hashFiles('package-lock.json', 'babel.config.js',
'jest.config.js') }}`) captures every input that can actually change a babel transform's output
in this repo: `package-lock.json` pins every dependency version (including `babel-preset-expo`,
the sole preset `babel.config.js` references — confirmed there is no `.babelrc`/`.babelrc.js`
anywhere else in the repo), `babel.config.js` itself, and `jest.config.js` (which now also holds
`cacheDirectory`, `setupFiles`, `moduleNameMapper`). Because CI always runs `npm ci` against the
committed lockfile (never `npm install`), there is no way for `node_modules`' actual content to
drift from what `package-lock.json` says, so keying on the lockfile is sufficient, not just
convenient.

On the `restore-keys` fallback specifically — could a stale, wrong-generation cache ever be
silently served as if valid? No: jest's own transformer computes each cached entry's key from
the *content* of the source file plus the *actual* babel/transform options at read time (this is
why `npx jest --clearCache` and re-running consistently reproduces the same warm/cold numbers
regardless of directory location — I reconfirmed this myself: `ls .jest-cache` shows
content-hash-named files like `jest-transform-cache-<hash>-...`, and a full local suite run
against the restored real HIT-run cache reported no phantom/incorrect results). A `restore-keys`
partial match just gives jest a *warm start point*; if a given file's content or the resolved
babel config for it doesn't match what's on disk in the cache, jest recomputes and writes a new
entry — it does not trust "the directory exists" as proof of validity. This is why the mechanism
is safe even in the one scenario I was asked to stress-test (a babel plugin resolved from
`node_modules` version drift not reflected in the three keyed files) — that scenario cannot
happen here because `npm ci` is deterministic from the lockfile, which *is* keyed.

**3. Does `cacheDirectory` inside the repo cause any problem?**

No, and I verified this rather than took the implementer's word: `CI=true npm test -- --runInBand`
run against a populated `.jest-cache` produced zero Haste/collision warnings and the same
85/85 · 630/630 result as before. `.jest-cache`'s contents (`haste-map-*`, `jest-transform-cache-*`,
`perf-cache-*`) carry no `.test.ts(x)` extension and no `__tests__` directory, so jest's own
default `testMatch` never picks them up — no `testPathIgnorePatterns` addition was needed, and
none was added. `.gitignore` excludes it (confirmed), so a fresh checkout or `expo export` never
sees it (export bundles via the module graph from an entry point, not a directory crawl, so an
extra root-level directory is inert to it regardless). `modulePathIgnorePatterns`'s existing
`.claude/worktrees/` entry is unrelated (that problem is full nested repos with their own
`node_modules`, not a flat cache directory) and does not need a sibling entry for `.jest-cache`.

**4. Hard constraints — all reconfirmed independently:**

- `node_modules/.bin/tsc --noEmit` → clean, exit 0 (ran fresh for this round).
- `grep -rn testTimeout jest.config.js jest.setup.ts package.json` → only a comment in
  `jest.config.js`; no `testTimeout:` key anywhere; `init.sh:235` is the only place the flag is
  actually passed to jest, and only inside the `CI=true` branch.
- `git diff main...HEAD -- src/features/identity/LoginScreen.test.tsx` → empty (0 lines).
- `git diff main...HEAD --name-only | grep -E '^(app/|src/)'` → no output.
- `unset CI; npm test` → parallel path, plain `PASS <file>` summary lines (no `--verbose`),
  `630 passed, 630 total`, `Time: 2.367s`, `771% cpu` (confirms multi-worker, unaffected by
  `--runInBand`/`--testTimeout`).

All four constraints hold exactly as claimed.

## 5. Internal consistency after three rounds — this is where the review lands on REQUEST CHANGES

Round 1 and Round 2's falsified premises remain correctly, honestly marked wherever they appear
(re-confirmed this round too — nothing regressed there). **Round 3 itself is a different story: it
was implemented, measured, and human-authorized correctly, but it was not written into this
feature's own source-of-truth documents the way Round 1 and Round 2 were.**

- **`spec.md` and `plan.md` have no "Round 3 Amendment" section at all.** `grep -n "Round 3"` on
  both files returns nothing. `spec.md:346-347` still reads "Raising `testTimeout` ... remains
  explicitly OUT OF SCOPE for this feature unless FR-006's escalation path is [triggered]" and
  `spec.md`'s FR-006 (line 375 onward) and SC-001 (line 434 onward) are still written entirely in
  Round 2's terms — under jest's unmodified 5000ms ceiling, with the escalation path as the only
  sanctioned outcome. As **literally written today**, `spec.md` does not reflect that the
  escalation path *was* invoked a second time and *did* result in an authorized `testTimeout`,
  nor does it redefine SC-001/SC-004's bar in light of the new 15000ms CI-only ceiling. A reader
  who trusts `spec.md` alone (this review's own instructions call it "the source of truth for
  intended behavior, not any description passed to you") would conclude this feature still
  forbids `testTimeout` outright and that the measured 3999ms MISS result (squarely inside
  Round 2's own "3000-5000ms triggers escalation" band) should have stopped the feature a third
  time — not shipped. Only `tasks.md`'s Phase 3c section and `feature_list.json`'s notes actually
  contain Round 3's reasoning, and `plan.md:91`'s "No `testTimeout` change without an explicit
  human-authorized escalation" line was never annotated to say that escalation happened. This
  breaks a pattern this same feature established twice already (Round 1 and Round 2 both got
  matching amendments across `spec.md` + `plan.md` + `tasks.md`), and it means the two documents
  this review is told to treat as authoritative are now stale on the single most consequential
  decision in the feature's history.

- **`tasks.md` itself has checkbox/prose contradictions in both directions:**
  - `T001` (Foundational — sync `main`, cut the branch, record the baseline) is still `[ ]`
    despite being self-evidently done (we are on the branch; `progress/impl_015-ci-test-timeout.md`
    Run 1 records the baseline `jest.config.js` state and the `main` commit).
  - `T016`/`T017` are `[ ]` even though the very next paragraph in the same file (line 230) states
    in bold: **"T016 and T017 are DONE"** with the real run's numbers quoted immediately after.
  - `T018` is `[ ]` even though the same paragraph says **"T018 FIRED FR-006 a second time"**
    (i.e., it was evaluated) and its outcome is stated in full.
  - `T022` is checked `[X]` but its own body text says **"LOCAL HALF DONE, CI HALF OUTSTANDING
    (owned by the orchestrator)... Push + real CI evidence is the orchestrator's step, not
    performed in this run"** — and the orchestrator's own follow-through (the `6e48fda` bookkeeping
    push, the resulting HIT run, the final numbers) was never written back into T022's text or
    into a new task/checkpoint marking it truly complete.

  A reader relying on checkbox state alone (which is exactly what `CHECKPOINTS.md` C6 and this
  review's own traceability table are supposed to do) gets the wrong picture in four separate
  places in the same file.

- **`progress/impl_015-ci-test-timeout.md` stops at "Run 3," whose own final line says the CI
  half of T022 is "outstanding."** There is no "Run 4" (or an addendum to Run 3) recording the
  actual push, the MISS run, the HIT run, or the final MISS/HIT numbers — even though those
  numbers plainly exist (I pulled them straight from `gh run view`) and are already summarized in
  `feature_list.json`'s notes. This is the same document format this feature has used
  successfully for three rounds; Round 3's real outcome was never appended to it.

- **`progress/current.md`'s "Outstanding" section (committed at `6e48fda`) is now wrong**: item 1
  reads "**A cache-HIT CI run** to prove the transform cache actually persists... Run A was
  necessarily a MISS" — phrased as still-needed future work. That work is done (run
  `31234419308`, confirmed above); this section was never updated after that run completed.
  `progress/current.md`'s "Next step" header ("Round 3 shipped... **awaiting a cache-HIT
  measurement**") is stale for the same reason.

- **The one document that *does* contain the accurate, final Round 3 story — `feature_list.json`'s
  `015-ci-test-timeout` entry (status flipped `blocked` → `in_progress`, `blocked_reason` cleared,
  notes updated with the real MISS/HIT numbers and the "SC-001 AND SC-004 ARE NOW GENUINELY MET"
  verdict) — is currently an *uncommitted* working-tree edit** (`git status` shows only
  `M feature_list.json`, nothing staged, nothing committed on top of `6e48fda`). If this branch
  were merged today as committed, `main` would carry the stale `blocked` status and the stale
  `blocked_reason` claiming "SC-001 ... NOT met: measured 3885ms ... only 22% headroom," which is
  now false — the Round 3 fix supersedes exactly that number. This is not a hypothetical risk;
  it is the literal current state of the repo I reviewed.

None of this calls the underlying fix into question — I independently re-derived and confirmed
every number in it. But per this review's own mandate ("Confirm the evidence is now genuinely
recorded in the repo's artifacts, not just asserted"), the honest answer is: **it is recorded,
accurately, in exactly one place, and that place is not committed; the three other places this
feature has consistently used for exactly this purpose across two prior rounds were not updated,
and one of them (`tasks.md`) now actively contradicts itself.**

## 6. Should any of this have been 014's, not 015's?

Partially yes, worth recording explicitly (not blocking on its own). `.github/workflows/ci.yml`
is 014's artifact — created by 014, and 014's own `blocked_reason` names it as the thing 015 must
unblock. 015 has now modified it twice: `b11059c` (`if: failure()` → `if: always()`) and
`430b69e` (the `actions/cache` step). Both changes are well-justified *for 015's own purposes*
(making SC-001/SC-004 evidence recoverable; making cold-start cost survivable), and 014 is
currently `blocked` specifically waiting on 015, so there was no clean way to route these through
014 without further stalling 015. But 014's own tasks (`T003`'s "green run" observation, `T007`'s
branch-protection sign-off) will now be evaluated against a workflow file whose final shape 014's
own spec/tasks never described — 014's `notes` field (last touched before these two commits) does
not mention either the always-dump change or the cache step. Recommend: when 014 is unblocked and
resumes its own wrap-up, its `feature_list.json` notes should cross-reference these two commits
(`b11059c`, `430b69e`) as the actual final state of `ci.yml`, so a future reader of 014's history
isn't misled into thinking it matches 014's own PR #9 diff. Not blocking this review — 014 is a
separate, already-`blocked` feature — but worth the human's attention before 014's T007 sign-off.

## Traceability (FR-00x → verification), Round 3 additions

| FR/SC | Status | Evidence |
|---|---|---|
| FR-005 (empirical CI evidence, read from logs, not assumed) | **Met, verified independently** | `gh run view` on both 31234302973 (MISS) and 31234419308 (HIT) match every number claimed, byte for byte |
| FR-006 (no silent `testTimeout`; escalation + explicit sign-off) | **Met** | escalated twice for real (T008, T018 outcome recorded in tasks.md prose), sign-off named in 3 places; but the sign-off is not reflected in `spec.md`'s own FR-006 text (Finding R3-1) |
| FR-007 (`CrearCuentaScreen.test.tsx` duration on the same run) | **Met** | 1019ms (MISS) / 127ms (HIT), both confirmed against real logs |
| SC-001/SC-004 (<3000ms target, or documented escalation) | **Met under the Round-3-amended ceiling, but `spec.md`'s literal unamended text still says otherwise** | HIT run comfortably clears the *original* 3000ms bar (311ms/127ms); MISS run (3999ms) clears the *new* 15000ms CI ceiling with 73% margin, but is NOT under `spec.md`'s still-current literal 3000-5000ms escalation band's "pass" case |
| SC-006 (job within 20-minute timeout) | Met | 134s (HIT) / ~140-158s (MISS runs), both ≪ 20 min |
| SC-002 (630/630, zero regressions) | Met | reconfirmed this round, both CI runs and local |

## `tasks.md` checklist status (as found on disk, this round)

T002–T005: `[X]`. T006–T008: `[X]` (correctly annotated with real outcomes). T009/T010: `[ ]`,
correctly annotated superseded/obsolete. T014/T015: `[X]`. **T001, T016, T017, T018: `[ ]` despite
being described as done/evaluated in the surrounding prose (Finding R3-2).** T019/T020/T021:
`[X]`. **T022: `[X]` despite its own text saying the CI half is outstanding (Finding R3-2).**
T011/T012/T013 (Phase 4/5): `[ ]` — T011's substance was actually already covered in Run 1
(7 icon-rendering suites spot-checked, all 0 warnings) but the checkbox was never flipped; T012
(docs/verification.md update) is genuinely not started — confirmed via `git log -- docs/verification.md`
and `grep` for any 015-related content, both empty; T013 (final `feature_list.json` wrap) is
partially done but uncommitted (Finding R3-4).

## CHECKPOINTS.md walkthrough (this round)

**C1** — [x] all four sub-items (harness files exist; `./init.sh` exits 0 — reran, `RESULT:
SUCCESS`, only the two documented pre-existing WARNs).

**C2** — [x] at most one `in_progress` (`015`; `014` is `blocked`, confirmed via
`feature_list.json` — though this relies on the currently-uncommitted status flip, see R3-4).
[x] done features unaffected. [ ] `progress/current.md` describes only the active session —
**fails again**, same category as the prior review's finding but now for Round 3: its "Outstanding"
list and "Next step" header describe the pre-HIT-run state as current (Finding R3-3).

**C3** — [x] all sub-items: no `src/domain`/component/platform/DB changes in this diff; no new
global state; no stray `console.log`/context-free `TODO` introduced.

**C4** — [x] `./init.sh`'s three build-target exports pass (verified: full unflagged
`./init.sh` this round — see below); Native dependency alignment WARN-only, unchanged from
baseline.

**C5** — [x] no suspicious untracked files. [ ] `progress/history.md` — not part of this diff's
file list, same as last round, not blocking. [ ] "last feature reflected accurately in
`feature_list.json`" — **fails**: the accurate reflection exists only uncommitted (Finding R3-4).

**C6** — [x] `spec.md`+`plan.md`+`tasks.md` all exist. [x] no open `[NEEDS CLARIFICATION]`
markers. [ ] N/A (feature not `done` yet). [ ] FR-00x traceability — **the one gap**: FR-006/SC-001
as literally written in `spec.md` are not amended to match what was actually authorized and
shipped (Finding R3-1) — every other FR is correctly traceable.

Ran the full unflagged `./init.sh` (all 8 stages, no `CI` set) fresh for this round:
`RESULT: SUCCESS (10/10 stages passed)`, all three bundle exports green, only the two documented
pre-existing WARNs (expo-doctor, native dependency drift).

## Findings summary (Round 3)

1. **(Blocking) `spec.md`/`plan.md` were never amended for Round 3.** `FR-006` and `SC-001`/
   `SC-004` in `spec.md` still read as if `testTimeout` remains categorically out of scope and as
   if the 5000ms ceiling (not the new CI-only 15000ms one) is the relevant bound — both now false.
   `plan.md:91`'s "No `testTimeout` change without explicit human-authorized escalation" line was
   never annotated to record that this fired and was authorized. Fix: add a "Round 3 Amendment"
   section to both files (matching the precedent set by Round 1 and Round 2) recording the cache
   mechanism, the human's (a)+(c) sign-off, and the redefined SC-001/SC-004 bar (ideally: target
   test under 3000ms in the common/warm case — met, 311ms/127ms — with the 15000ms CI-only
   ceiling as the documented, authorized fallback for the cold-cache worst case — also met,
   3999ms/1019ms).
2. **(Blocking) `tasks.md` checkbox/prose contradictions in four places**: `T001`, `T016`, `T017`,
   `T018` are unchecked despite being described as done/evaluated in the same file's prose;
   `T022` is checked despite its own text stating the CI half is outstanding. Fix: reconcile all
   five against what actually happened (T001/T016/T017/T018 → `[X]`; T022's text updated to
   record the actual push/HIT-run outcome, or split into T022a/T022b if the local/CI halves are
   worth tracking separately).
3. **(Blocking) `progress/impl_015-ci-test-timeout.md` and `progress/current.md` are stale
   relative to the real, already-obtained CI evidence.** Neither file records the MISS run's full
   numbers in one place with the HIT run's, nor the fact that the HIT run happened at all —
   `progress/current.md`'s "Outstanding"/"Next step" sections still present the HIT run as future
   work. Fix: append a "Run 4" (or amend Run 3) to `progress/impl_015-ci-test-timeout.md` with the
   real MISS/HIT numbers (I've independently confirmed both — see above), and update
   `progress/current.md`'s "Outstanding"/"Next step" to match.
4. **(Blocking) The only artifact with the accurate final Round 3 story
   (`feature_list.json`'s `015` entry — status, cleared `blocked_reason`, full notes) is an
   uncommitted working-tree change.** If merged as currently committed, `main` would carry a
   stale, now-false `blocked` status/reason. Fix: commit this change (as its own bookkeeping
   commit, matching this feature's own established pattern) before merge.
5. **(Non-blocking, recorded per the task brief's own question 6)** `.github/workflows/ci.yml` —
   014's artifact — was modified twice by 015 (`b11059c`, `430b69e`) without a corresponding note
   in 014's own `feature_list.json` entry. Recommend 014's notes cross-reference these commits
   during its own wrap-up so its history isn't misleading about the workflow's actual final shape.
6. **(Non-blocking observation, not a defect)** `--testTimeout=15000` necessarily raises the
   ceiling for all 630 CI tests, not just the two identified victims, since jest's `--testTimeout`
   is a whole-run CLI flag and a per-file override was correctly ruled out (would touch
   `LoginScreen.test.tsx`, forbidden by FR-002). This is the right tradeoff given the constraints,
   but it is not written down anywhere — worth one sentence in whichever document picks up
   Finding R3-1's amendment.

Everything substantive — the cache key's safety, the `cacheDirectory` relocation's safety, the
`--testTimeout` scoping and sign-off, the CI evidence itself, zero app/src changes, zero
assertion changes, type-check, and the local test suite — checks out cleanly on independent,
from-scratch verification (including pulling the actual GitHub Actions logs myself rather than
trusting the numbers quoted to me).

## Verdict

**REQUEST CHANGES** — not because the shipped mechanism (transform-cache persistence +
CI-scoped, human-authorized `--testTimeout=15000`) is wrong; independent verification (including
reading the actual `gh run view` logs for both the MISS and HIT runs, not just the numbers as
reported) shows it is correct, safe, honestly scoped, and genuinely resolves the fragility that
blocked this feature twice before. The block is entirely a documentation/traceability-closure
gap, the same category of issue the previous round was blocked on, now smaller but still real:
`spec.md`/`plan.md` were never amended for Round 3 and are stale/self-contradicting on FR-006 and
SC-001/SC-004 specifically; `tasks.md` has five checkbox/prose mismatches; `progress/impl_015-*.md`
and `progress/current.md` don't yet reflect the real, already-obtained CI evidence; and the one
place that *does* have the accurate final story (`feature_list.json`) is uncommitted. Before
asking the human to merge: (1) add Round 3 amendments to `spec.md` and `plan.md`; (2) fix the five
`tasks.md` checkbox/prose mismatches (T001, T016, T017, T018, T022); (3) append the real MISS/HIT
numbers to `progress/impl_015-ci-test-timeout.md` and update `progress/current.md`'s
"Outstanding"/"Next step"; (4) commit the `feature_list.json` change. None of these require new
measurements or re-running CI — the numbers already exist and are correct; they need to be
written into the feature's own permanent record, committed, in the places this feature's own
prior two rounds already established as canonical.
