# Review: `010-registration-redesign` — T001–T007 (Phase 1: Setup + first half of Phase 2: Foundational)

Reviewed against `specs/010-registration-redesign/{spec.md,plan.md,tasks.md}`,
`docs/design-brief-registration-redesign.md`, `.specify/memory/constitution.md`,
`docs/conventions.md`, `docs/verification.md`, `CHECKPOINTS.md`, read fresh from disk.
Implementer's report (`progress/impl_010-registration-redesign.md`) treated as a claim, verified
independently below.

## Scope actually reviewed

`git status --short` (working tree, no commits yet on this branch beyond `main@98c0b45`):

- Tracked/modified: `package.json`, `package-lock.json`, `src/theme/colors.ts`,
  `src/theme/typography.ts`, `src/theme/contrast.test.ts`, `src/features/identity/FormField.tsx`,
  `FormField.web.tsx`, `FormField.test.tsx`.
- Untracked/new: `src/features/ui/SegmentedControl.{tsx,test.tsx}`,
  `src/features/ui/Select.{tsx,web.tsx,types.ts,test.tsx,web.test.tsx}`,
  `src/features/identity/DateField.{tsx,web.tsx,types.ts,test.tsx,web.test.tsx}`.

Not part of this code review (per instructions): `specs/010-registration-redesign/`,
`docs/design-brief-registration-redesign.md`, `progress/impl_010-registration-redesign.md`,
`feature_list.json`/`progress/current.md`.

## Independent verification run

- `node_modules/.bin/tsc --noEmit` — **clean, zero errors.**
- `npx jest` — **78 suites / 531 tests, all green.**
- `npx expo install --check` — reports the same five pre-existing packages
  (`expo-image-picker`, `react-native`, `react-native-safe-area-context`, `@types/react`,
  `typescript`) as outdated; `@react-native-community/datetimepicker` does **not** appear —
  T001's version-alignment claim checks out.
- `./init.sh --skip-build` — `RESULT: SUCCESS (8/8 stages passed)`, same baseline WARNs on
  stages 5/6 (expo-doctor + native-dependency-alignment), no new warning attributable to this
  batch. Matches the pre-existing baseline the task description called out.

## T002 — `colors.segment.inactiveTrack` contrast claim, independently recomputed

Re-implemented `src/theme/contrast.ts`'s formula in a throwaway script and computed
`contrastRatio("#646B78", "#EDEEF5")` (the real `colors.text.secondary` hex, not a guess) →
**4.634450880697834**, i.e. 4.63:1, clearing the 4.5:1 AA floor. Matches the doc-comment's claim
exactly. `contrast.test.ts`'s new case asserts `contrastRatio(colors.text.secondary,
colors.segment.inactiveTrack) >= AA_THRESHOLD` — it guards the exact pairing the token comment
claims (`text.secondary` on `segment.inactiveTrack`, the inactive segment's label-on-fill),
not some other pairing. **Verified correct.**

## T003 — `typography.label.fieldSentence`

Sibling token, not an edit to `label.field` (fontSize/fontWeight/color identical, no
`textTransform`/`letterSpacing`). No color change → no new contrast case needed, correctly
reasoned (color still traces to `text.secondary`, already covered).

## T004 — `FormField.tsx`/`FormField.web.tsx`'s `labelCase` prop

`grep -rn "<FormField" src/ app/` (excluding `.test.tsx` and the definition files themselves)
shows exactly six call sites — `SignInForm.tsx`, `ResetPasswordForm.tsx`, `RegistrationForm.tsx`,
`ProfileForm.tsx`, `RequestPasswordResetForm.tsx`, `VerifyPhoneScreen.tsx` — **none pass
`labelCase` today**, confirming the `"uppercase"` default is genuinely load-bearing, not just
theoretically safe, exactly as claimed. `FormField.test.tsx` adds a `labelCase="sentence"`
regression (asserts no `textTransform`/`letterSpacing`, correct `fieldSentence` values) *and* an
explicit "still renders uppercase when `labelCase` is omitted" backward-compatibility regression
on both the mobile and web variant — real coverage, not just a claim. Full test suite (531 tests)
passes, including all six pre-existing call sites' own suites, unchanged.

## T005 — `SegmentedControl`

Reuses the `radiogroup`/`radio` + top-level `aria-checked` + `accessibilityState.checked` pattern
from `RegistrationForm.tsx`'s account-type toggle, with the same documented rationale (pinned
react-native-web 0.19.13 never forwards `accessibilityState` to the DOM). Every color/typography/
geometry value traces to `src/theme` (`colors.brand.primary`, `colors.segment.inactiveTrack`,
`colors.text.secondary`, `typography.button.label`, `radius.pill`, `CONTROL_HEIGHT` = 56, matching
the design brief's "~56px tall"). Tests assert real rendered style values (`backgroundColor`),
`onChange` firing, `aria-checked` tracking across a rerender, and an accessible `radiogroup`/
`radio` structure — Level 2 real-behavior tests, not smoke tests. **No issues found.**

## T006 — `Select.tsx` + `Select.web.tsx` — two real findings

**Keyboard contract (the thing flagged for special attention): genuinely tested, not just wired.**
`Select.web.test.tsx` fires real `keyPress` events (`ArrowDown`/`ArrowUp`/`Enter`/`Escape`) at the
filter input and asserts on resulting state: which option `onChange` was called with after two
`ArrowDown`s + `Enter` (index 0 → 2, "Canadiense"), that `ArrowUp` clamps at index 0, and — most
substantively — that `Escape` calls `.focus()` on the trigger's underlying `View.prototype`
(via `jest.spyOn`, since the `ReactTestInstance` `getByTestId` returns is not the same object as
the internal ref), not merely that the panel closed. This is real interaction-sequence coverage.

**Finding 1 (FR-007 / repo convention violation) — hardcoded, unlocalizable English copy in a
generic `src/features/ui` primitive.**
`src/features/ui/Select.tsx:103,107,124,134` and `src/features/ui/Select.web.tsx:114,136,140,
156,158` hardcode the literal strings `"Retry"`, `"Search"`, `"Filter options"`, `"Close"`, and
`"Loading…"` directly in the component body, with **no prop through which a caller can override
them**. `spec.md` FR-007 requires "All copy on this screen MUST route through `src/domain/i18n`,
Spanish as the default locale" — and every existing `src/features/ui` primitive in this repo
(`PrimaryButton.tsx`, `SecondaryButton.tsx`, `StatusPill.tsx`) takes 100% of its rendered text as
props precisely so a caller can localize it; none hardcodes a literal string internally. `Select`
breaks that pattern. `plan.md`'s Research Decision 5 wires `useNationalities()`'s `loading`/
`error`/`onRetry` straight into `Select`'s corresponding props, and `tasks.md`'s T013 only builds
`src/domain/i18n/copy/registration.ts` (field labels/placeholders) — nothing in the remaining
`tasks.md` touches `Select.tsx`/`Select.web.tsx` again to add copy-override props. **Failure
scenario**: once T015/T020 wire `Select` for `Nacionalidad`, a Spanish-speaking user hitting the
nationality-catalog's disclosed loading/error state (the exact state spec.md's Edge Cases require
and that is reachable *today*, since backend `015` hasn't shipped) sees a properly-localized error
message next to an English `"Retry"` button, and the option-filter's placeholder reads `"Search"`
instead of `"Buscar"` — a direct, currently-uncorrectable violation of FR-007 on the one part of
this screen guaranteed to be visible in every environment.

**Finding 2 (FR-006 violation) — a raw, non-tokenized color literal.**
`src/features/ui/Select.tsx:215`: `backgroundColor: "rgba(0,0,0,0.4)"` (the native variant's modal
backdrop) is a literal, not sourced from `src/theme`. FR-006 requires "no new raw hex/magic-number
literal... except where a genuinely new token is required... each of which MUST be added to
`src/theme`," and the design brief's §1 states plainly: "Everything here is `src/theme` tokens and
`src/features/ui` primitives. **No new hex literals.**" There is no existing overlay/backdrop
token in `src/theme/colors.ts` to reuse (confirmed by grep — no other component in this repo has
a modal backdrop), so this needed a new token the way `colors.segment.inactiveTrack` correctly was
added for T002, not an inline literal.

Both findings sit inside T006, which `tasks.md` already marks `[X]` — they are concrete,
actionable, and current (this primitive has zero consumers yet, so this is the cheapest point to
fix the interface before more code depends on it).

Tests for the native variant (`Select.test.tsx`, 8 cases) are equally real: label/placeholder
render, selected-value render, opening/closing via trigger and backdrop, selecting closes and
calls `onChange`, typed-text filtering, loading state disabling the trigger, error+retry rendering
distinctly with `onRetry` firing, and the trigger refusing to open while disabled.

## T007 — `DateField.tsx` + `DateField.web.tsx`

Both variants emit a real `Date` object, confirmed directly: `DateField.test.tsx` asserts
`emitted instanceof Date` and `emitted.getTime() === selected.getTime()` off the vendor
`DateTimePicker`'s own `onChange` prop (grabbed via `UNSAFE_getByType`, not a synthetic fireEvent
against the vendor's internal native-host wiring — a real, disclosed test-environment constraint,
not a shortcut); `DateField.web.test.tsx` asserts `emitted instanceof Date` with correct
year/month/date off a real DOM `change` event on the `<input type="date">`. Cross-checked against
`src/domain/schemas.ts:124` — `birthDate: z.coerce.date({...})` — unchanged, matching the
Clarification-4 "no schema change" claim.

The `.web.tsx` implementation genuinely diverges from the task text's literal description
("react-native-web's pass-through of unrecognized native DOM props") — it renders a bare DOM
`<input>` via `React.createElement` instead of `TextInput type="date"`. This is disclosed
explicitly in the impl report as a verified correction (`react-native-web`'s pinned `TextInput`
unconditionally overwrites any passed `type` prop — confirmed by reading
`node_modules/react-native-web/dist/cjs/exports/TextInput/index.js` directly), not a silent
deviation, and it's the only mechanism that actually produces the required behavior (a real
`<input type="date">` with the browser's native picker chrome). This is the right call, correctly
flagged for review rather than silently substituted — **no issue**.

Platform split is genuine (native OS date picker vs. browser `<input type="date">`), no inline
`Platform.OS` anywhere in either file — Constitution I/FR-014 satisfied.

## Requirement traceability (Level 5, `docs/verification.md`)

| FR / Constitution | Covered by | Status |
|---|---|---|
| FR-006 (token-only visual language, WCAG-checked new tokens) | `contrast.test.ts`'s new `segment.inactiveTrack` case; `SegmentedControl.test.tsx` | Met for `colors.segment.inactiveTrack`/`typography.label.fieldSentence`/`FormField`. **Not met for `Select.tsx`'s `rgba(0,0,0,0.4)` backdrop literal** (Finding 2) |
| FR-007 (all copy via `src/domain/i18n`) | Not yet in scope for T001–T007's own copy (T013 not in this batch) | **Select.tsx/Select.web.tsx's internal "Retry"/"Search"/"Loading…"/"Close" strings have no i18n escape hatch at all (Finding 1)** — a defect in the primitive's interface, not merely unfinished copy wiring |
| FR-012 (nationality selection primitive, keyboard-operable) | `Select.test.tsx`, `Select.web.test.tsx` | Met — primitive itself is generic/keyboard-operable; backend wiring correctly deferred to T010/T011/T020 |
| FR-013 (real date-picker control) | `DateField.test.tsx`, `DateField.web.test.tsx` | Met — real `Date` emission verified on both platforms |
| FR-014 (`.ios/.android/.web.tsx` convention, no inline `Platform.OS`) | Grepped `Select.tsx`/`Select.web.tsx`/`DateField.tsx`/`DateField.web.tsx`/`SegmentedControl.tsx` — no `Platform.OS` anywhere | Met |
| FR-015 (roles/labels, 44×44 targets, keyboard operability) | `SegmentedControl.test.tsx`'s `aria-checked`/`radiogroup`; `Select.web.test.tsx`'s full keyboard sequence; `Select.test.tsx`'s accessible-role assertions; `CONTROL_HEIGHT`=56 > 44 floor everywhere | Met |
| Constitution VII (WCAG 4.5:1, computed) | T002's contrast case, independently recomputed above | Met |
| Constitution IV (no business logic in components) | `src/theme`, `src/features/ui`, `src/features/identity` files reviewed — pure render/prop-driven, no fetch/validation inline | Met |

## `tasks.md` checklist status (this batch)

- [X] T001 — verified (dependency-alignment clean, no new warning)
- [X] T002 — verified (contrast recomputed independently, matches)
- [X] T003 — verified
- [X] T004 — verified (backward compatibility confirmed by grep + full suite green)
- [X] T005 — verified
- [X] T006 — **implemented and tested, but ships two real defects** (Findings 1 and 2 above)
- [X] T007 — verified (real `Date` emission both platforms, genuine platform split)

## `CHECKPOINTS.md` C1–C6 walkthrough

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md` and `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 (`RESULT: SUCCESS`, baseline WARNs only).

**C2 — state coherent**
- [x] Exactly one feature (`010-registration-redesign`) is `in_progress`.
- [x] This batch's changed files have passing tests covering them.
- [x] `progress/current.md` reflects the active session (out of this review's scope to re-verify
      content, not flagged as an issue).

**C3 — architecture respected**
- [x] No `src/domain`/`src/lib` files touched in this batch import React/React Native.
- [x] `SegmentedControl`/`Select`/`DateField` render/call props only, no embedded fetch/validation.
- [x] Platform-specific code (`Select.web.tsx`, `DateField.web.tsx`) uses the `.web.tsx`
      convention; no inline `Platform.OS` anywhere in this batch's files (grepped).
- [x] No direct Postgres/Redis/S3/Supabase-table access.
- [x] No new global state library.
- [x] No stray `console.*`/context-free `TODO` in this batch's files (grepped).

**C4 — verification real**
- [x] Every new file has a colocated, real-rendered-output test (Level 2); none is a "doesn't
      crash" smoke test.
- [x] `./init.sh`'s build/native-alignment stages are not FAILing.
- [~] Full three-target build export not independently re-run beyond `--skip-build`'s prior clean
      state and the implementer's own reported all-three-clean run — not re-verified live in this
      review pass, but not flagged as it's outside this increment's own scope (no new native
      surface beyond T001's dependency, already confirmed clean).

**C5 — session hygiene**
- [x] No suspicious untracked files beyond the expected new source/spec/progress files.
- Not assessed here (`progress/history.md`/session-close bookkeeping is explicitly out of this
  code review's scope per the task instructions).

**C6 — SDD**
- [x] `specs/010-registration-redesign/{spec.md,plan.md,tasks.md}` all exist.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers (four recorded defaults, all flagged
      for gate confirmation, already approved per `feature_list.json`'s notes — consistent).
- [ ] N/A — feature not yet `done`.
- [~] FR-006/FR-007 traceability: **partially unmet** — see Findings 1/2 above; every other
      FR in scope for this batch is referenced by at least one test.

## Findings

1. **[Blocking] `src/features/ui/Select.tsx` (lines 103, 107, 124, 134, 215) and
   `src/features/ui/Select.web.tsx` (lines 114, 136, 140, 156, 158)** — hardcoded English UI copy
   (`"Retry"`, `"Search"`, `"Filter options"`, `"Close"`, `"Loading…"`) with no prop for a caller
   to localize, violating spec.md FR-007 and this repo's own established `src/features/ui`
   primitive convention (every other primitive takes 100% of its copy as props). Also,
   `Select.tsx:215`'s modal-backdrop color (`"rgba(0,0,0,0.4)"`) is a raw, non-tokenized literal,
   violating FR-006 and the design brief §1's explicit "No new hex literals." Fix: add optional,
   sensibly-defaulted copy props (e.g. `retryLabel`, `searchPlaceholder`, `loadingLabel`,
   `filterAccessibilityLabel`, `closeAccessibilityLabel`) mirroring `FormField`/`Select`'s own
   `labelCase` default pattern, and add a `colors.overlay.backdrop` (or similarly named) token to
   `src/theme/colors.ts` for the backdrop fill, with `Select.tsx` importing it instead of the
   inline literal.

No other blocking issues found. Type-check is clean, the full test suite (531 tests) passes,
`./init.sh` reports `SUCCESS` with only the pre-existing baseline warnings, T002's contrast claim
was independently recomputed and confirmed, T004's backward-compatibility claim was independently
grep-verified against all six existing `FormField` call sites, and T007's `Date`-emission claim
was confirmed against the actual `profileFormSchema.birthDate: z.coerce.date()` schema.

## Verdict

**REQUEST CHANGES**

`task-implementer` should fix Finding 1 (add copy-override props to `Select.tsx`/`Select.web.tsx`
for `"Retry"`/`"Search"`/`"Filter options"`/`"Close"`/`"Loading…"`, sensibly defaulted so no
existing test needs to change unless it wants to assert the new prop) and the backdrop-color half
of the same finding (add a `src/theme` token for the modal backdrop instead of the inline
`rgba(...)` literal), then re-run `npx tsc --noEmit` and `npx jest` before re-requesting review.
Everything else in T001–T007 is sound and independently verified.

---

## Re-review — Run 3 fixes to T006's blocking finding (2026-08-06)

Scope: verify whether both parts of the prior blocking finding (Part A — hardcoded,
unlocalizable copy in `Select.tsx`/`Select.web.tsx`; Part B — the raw `rgba(0,0,0,0.4)` backdrop
literal) are genuinely fixed, whether the fix disturbed T001–T005/T007 (already cleared), and
whether anything new was introduced. Implementer's account
(`progress/impl_010-registration-redesign.md`, "Run 3 — T006 review fixes") treated as a claim,
verified independently below by reading the current files on disk, not by trusting the report.

`git status --short` confirms only `Select.types.ts`, `Select.tsx`, `Select.web.tsx`,
`Select.test.tsx`, `Select.web.test.tsx`, and `src/theme/colors.ts` changed since the prior
review pass (plus the untracked-file set already accounted for); `DateField.tsx`/`DateField.web.tsx`
have older mtimes (13:24/13:27) than the touched files (13:41–13:46), consistent with "read, not
modified."

### Part A — copy-override props

Read `src/features/ui/Select.types.ts` directly: `SelectProps` now carries `retryLabel?`,
`searchPlaceholder?`, `loadingLabel?`, `filterAccessibilityLabel?`, `closeAccessibilityLabel?`,
all optional, all documented with the fix's rationale. Both `Select.tsx` and `Select.web.tsx`
`import type { SelectOption, SelectProps } from "./Select.types"` — one shared declaration, not
duplicated per file, so the two variants' prop surfaces cannot drift.

`Select.tsx` (native): destructures all five with defaults matching the exact strings previously
hardcoded (`retryLabel = "Retry"`, `searchPlaceholder = "Search"`, `loadingLabel = "Loading…"`,
`filterAccessibilityLabel = "Filter options"`, `closeAccessibilityLabel = "Close"`), and every
prior hardcoded call site (lines 109/113 retry, 138/140 filter, 130 backdrop
`accessibilityLabel`, 86 the previously-unlabeled loading `ActivityIndicator`) now reads the
prop. No literal English string remains anywhere in the render body except the defaults
themselves.

`Select.web.tsx`: destructures the four applicable props (`retryLabel`, `searchPlaceholder`,
`loadingLabel`, `filterAccessibilityLabel`) with identical defaults, wired at lines 118 (loading
text), 140/144 (retry), 160/162 (filter placeholder/label). `closeAccessibilityLabel` is in the
shared type but genuinely unused in this file — correctly reasoned: the web variant has no
backdrop/dedicated close control (confirmed by reading the file — closing is trigger-toggle or
`Escape` only), so there is nothing to attach it to. This is not a caller-facing asymmetry: the
prop is optional or a no-op either way, so a caller does not need to branch by platform to supply
a consistent copy set — passing `closeAccessibilityLabel` on web is simply inert, not a type
error or a broken prop.

Both new-test files were read in full, not just grepped: `Select.test.tsx`'s four new cases and
`Select.web.test.tsx`'s three new cases assert on real rendered output — `getByText("Reintentar")`
present *and* `queryByText("Retry")` absent (not merely "the override renders," but "the
hardcoded default is gone when overridden"), `.props.placeholder`/`.props.accessibilityLabel` on
the actual filter `TextInput`/backdrop `Pressable` test nodes, and a dedicated
backward-compatibility case confirming every prop still defaults to the original English string
when the caller passes nothing (`"Loading…"` accessibilityLabel present when no `loadingLabel` is
given). These are Level 2 real-behavior assertions, not smoke tests. **Part A: genuinely fixed.**

### Part B — backdrop token

`src/theme/colors.ts` now has `overlay: { backdrop: "rgba(0,0,0,0.4)" }` (same numeric value,
now a named export), with a doc comment following T002's `segment.inactiveTrack` precedent
exactly — states what it replaces, why (FR-006 violation flagged by review), and why no
`contrast.test.ts` case follows (a translucent scrim behind a modal panel is decorative dimming,
not a text-on-background pairing — there is no text rendered on the backdrop fill itself). This
reasoning is sound, not convenient: it's the same category distinction already established in
this same file for `viewfinder.grid` and the `gradients` block, both of which are also
purely-decorative non-text fills carrying no contrast case, and independently confirmed by
`git diff -- src/theme/contrast.test.ts` — no new case was added or needed to be. `Select.tsx`'s
`styles.backdrop.backgroundColor` now reads `colors.overlay.backdrop` (confirmed at line 221 of
the current file), not the inline literal. A dedicated test
(`Select.test.tsx`, "sources the native modal backdrop's fill from the src/theme overlay token,
not an inline literal (FR-006)") opens the picker, flattens the backdrop `Pressable`'s style via
`StyleSheet.flatten`, and asserts `style.backgroundColor === colors.overlay.backdrop` — a real
assertion against the token reference, not the literal string, so it would fail if someone
reverted to an inline value with the same numeric content. **Part B: genuinely fixed.**

### DateField check (explicitly requested)

Read `DateField.tsx`/`DateField.web.tsx` in full myself. Confirmed no hardcoded, unlocalizable
copy exists: the only literal string is `placeholder = "dd/mm/aaaa"` in `DateField.tsx`, which was
already an optional, caller-overridable prop before this run (present in `DateField.types.ts`,
unchanged); `DateField.web.tsx` has no placeholder literal at all (the browser's native
`<input type="date">` renders its own locale UI chrome, not app-supplied placeholder text); every
`accessibilityLabel`/`aria-label` in both files reads the caller-supplied `label` prop. The
implementer's "no fix needed" conclusion holds up under independent reading, not just under
trusting the report.

### Independent verification re-run

- `node_modules/.bin/tsc --noEmit` — clean, zero errors (matches claim).
- `npx jest --silent` — **78 suites / 538 tests, all green** (531 prior baseline + 7 new: 4 in
  `Select.test.tsx`, 3 in `Select.web.test.tsx`) — exact match to the claimed count, independently
  re-run, not accepted from the report.
- `./init.sh` — `RESULT: SUCCESS (10/10 stages passed)`, stage 5/6 WARNs are the same five
  pre-existing packages (`expo-image-picker`, `react-native`, `react-native-safe-area-context`,
  `@types/react`, `typescript`); no new warning. Matches the claimed baseline exactly. (The
  Xcode/SDK-51 local-toolchain warning called out as acceptable in the task instructions did not
  surface in this run either, same as the implementer's own run — environment-dependent, not
  attributable to this fix.)

### Anything new introduced by the fix?

- No new hardcoded literal was introduced — every previously-hardcoded string now has a
  defaulted, overridable prop.
- No regression to T001–T005/T007: their own files are untouched (confirmed by mtime and by
  `git status --short` showing no other paths dirty), and the full suite that covers them (538
  tests) is green.
- The one prop asymmetry (`closeAccessibilityLabel` unused on web) is disclosed, reasoned, and
  harmless — not a silent gap.

### Verdict

**APPROVE**

Both parts of the prior blocking finding are genuinely fixed, independently confirmed by reading
the current source (not by trusting the implementer's report): copy-override props exist on both
variants via a single shared `Select.types.ts` declaration, reach rendered output (proven by
tests asserting override-present/default-absent, not just "renders"), default to the original
English strings so no pre-existing test needed to change, and the backdrop color is now sourced
from a new `src/theme` token with a sound, precedent-consistent "no contrast case needed"
rationale. `DateField` was correctly found to need no equivalent fix on independent re-reading.
Type-check is clean, the full suite (78/538) passes, and `./init.sh` reports the same clean
baseline. No new issues introduced. T006 is now sound; T001–T007 as a batch is cleared.

---

## Review — Run 4: T008–T014 (Phase 2: Foundational, domain/infrastructure half) — 2026-08-06

Reviewed against `specs/010-registration-redesign/{spec.md,plan.md,tasks.md}` (re-read fresh from
disk, not from any prior summary), `.specify/memory/constitution.md`, `docs/conventions.md`,
`docs/verification.md`, `CHECKPOINTS.md`. Implementer's account
(`progress/impl_010-registration-redesign.md`, "Run 4 — T008–T014") treated as claims, verified
independently below by reading the files on disk and re-running checks myself.

### Scope actually reviewed

`git status --short` at the start of this pass (full working tree, since most of this batch is
untracked and `git diff` alone would miss it):

- Modified (tracked): `src/domain/profile.ts`, `src/domain/registration.ts`,
  `src/domain/schemas.ts`, `src/domain/schemas.test.ts`, `src/lib/api.ts`,
  `src/features/identity/LoginScreenChrome.web.tsx` — plus this batch's carry-forward-untouched
  T001–T007 files, `feature_list.json`, `progress/current.md` (out of this review's scope, as in
  prior rounds).
- New (untracked, this batch): `src/lib/registration-draft.{ts,test.ts}`,
  `src/domain/nationality.{ts,test.ts}`, `src/features/identity/useNationalities.{ts,test.ts}`,
  `src/features/identity/authCardLayout.ts`, `src/domain/i18n/copy/registration.{ts,test.ts}`.

T001–T007's own files were spot-checked for disturbance only (none found — `Select.tsx`/
`Select.web.tsx`/`DateField.*` mtimes/content unchanged since the Run 3 re-review; not
re-litigated beyond that).

### Independent verification run

- `node_modules/.bin/tsc --noEmit` — **clean, zero errors.**
- `npx jest` — **82 suites / 571 tests, all green** (baseline was 78/538 per the prompt; this
  batch's own report also claims 82/571 — matches exactly, independently reproduced, not just
  trusted).
- Grepped `src/lib/registration-draft.ts` and its test for `console.*` — **zero matches.**
- Grepped this batch's new/changed files for `TODO` — **zero matches.**
- `git log --oneline -5` — HEAD unchanged (`98c0b45`, the `008` merge); no premature commit.

### T008 — `usuarioCrearCuentaSchema` / `tiendaProfileFormSchema` / `tiendaCrearCuentaSchema`

Read `src/domain/schemas.ts`'s full diff directly (not the impl report's paraphrase): the three
new exports are a pure **addition** at the end of the pre-existing schema block — `git diff`
shows no `-` line touching `personalRegistrationSchema`, `profileFormSchema`,
`businessRegistrationSchema`, or `businessProfileFormSchema`; those four are byte-for-byte
unchanged. Confirmed the specific concern from the review brief directly:
`tiendaProfileFormSchema` is built **from scratch** (`z.object({ commercialName, rfc,
fiscalAddress, tosAccepted, privacyAccepted })`), not derived from `businessProfileFormSchema`
(which `.extend`s `profileFormSchema` and would wrongly pull in `nombre`/`apellidoPaterno`/
`birthDate`/`nationality`/`curp`). `schemas.test.ts`'s new
`"does not require (or reject the absence of) any personal field"` case
(`schemas.test.ts:487-494`) asserts the *parsed output* omits those five keys — a real,
falsifiable check, not just "accepts a valid payload." `git status --short -- ProfileForm.tsx
ProfileForm.test.tsx` shows **no changes at all** to either file in this batch — confirmed
`ProfileForm.tsx` still imports `profileFormSchema`/`businessProfileFormSchema` only, genuinely
unaffected. **Verified correct, no issues.**

### T009 — `src/lib/registration-draft.ts` (the security-sensitive one, checked most carefully)

Read the file in full, not excerpted. `let draft: RegistrationDraft | undefined` is the only
piece of state; the three exports are the only way to touch it. `consumeRegistrationDraft()` is
genuinely atomic — `const current = draft; draft = undefined; return current;` — a plain
synchronous read-then-clear with no `await` in between, so there is no interleaving window. Its
own test (`registration-draft.test.ts`) does not just assert the happy path: the case **"a second
consume call returns undefined -- a draft can never be read twice"** explicitly calls
`consumeRegistrationDraft()` twice after one `set` and asserts the first call returns the value
and the **second call returns `undefined`** — this is the real atomicity proof the review brief
asked for, not an assumption. A separate case (`clearRegistrationDraft()` after a set) and an
overwrite case (`set` twice, only the second survives) round out real coverage of the module's
full state machine; 6/6 tests genuinely exercise distinct behavior, none is redundant with
another.

No `console.*`, no `expo-secure-store`, no `AsyncStorage`, no `localStorage`/`sessionStorage`, no
router-param, no global-state-library import anywhere in this file (grepped directly, confirmed
above) — the module is plain TypeScript, zero React/RN imports, matching Constitution IV's
`src/lib` portability bar even though it doesn't strictly require it there. Checked for escape
routes elsewhere in this batch too: `grep -rn "registration-draft\|RegistrationDraft\|
setRegistrationDraft\|consumeRegistrationDraft"` across `src/`/`app/` finds **only the module and
its own test** — nothing in this batch (T010–T014) imports or otherwise touches the draft, so
there is no consumer yet through which it could leak (T015–T019, which wire it into
`CrearCuentaScreen`/`verify-phone.tsx`, are still `[ ]`, correctly deferred to Phase 3). The
file's own doc comment plainly states the "why volatile, do not add persistence" reasoning —
matches Constitution III's "never persisted beyond the flow's lifetime" requirement as literally
as a module-level variable can. **Verified correct — no leak found, atomicity genuinely proven,
no issues.**

### T010/T011 — `src/domain/nationality.ts` + `src/features/identity/useNationalities.ts`

`nationality.ts`'s top comment states, in capitals, that `GET /identity/nationalities` is a
**"PLANNING ASSUMPTION, NOT A CONFIRMED CONTRACT"**, names backend `015` as unspec'd, and flags
real-network verification as `[BLOCKED-ON-015]` — exactly the visible flag the review brief
asked for; nothing beyond `plan.md`'s own Research Decision 5 is invented (the path, the `{
value, label }[]` shape, and the DI-via-`ApiClient` pattern all trace directly to `plan.md`/
`spec.md`'s Key Entities). No RN/React import; three tests cover happy path (asserting the exact
call shape, not just the resolved value), an empty-catalog path, and a rejected/network-error
path that is genuinely propagated (`.rejects.toThrow`), not swallowed.

Read `src/features/ui/Select.types.ts` directly (not `plan.md`'s prose) to check T011's return
shape: `SelectProps` really does declare `loading?: boolean`, `error?: string`, `onRetry?: () =>
void` — and `useNationalities.ts`'s `UseNationalitiesResult` is `{ options, loading, error:
string | undefined, onRetry }`, matching those three field names and types exactly (not the
plan's `isLoading`/`refetch` phrasing). This is a genuine, correctly-caught discrepancy between
the plan's descriptive prose and the actual T006-fixed primitive — the hook is built against
reality, not the stale plan text. `useNationalities.test.ts`'s 5 cases are real (not smoke):
loading-state-with-no-options, options populated on success, a non-empty string error message on
failure, `onRetry` **genuinely re-invoking** the underlying fetch (asserted by call count, with a
first-failure-then-success sequence proving it isn't a no-op), and querying under the exported
`nationalitiesQueryKey`. The Supabase-client mock mirrors `useKycGate.test.ts`'s own established
pattern — consistent with existing convention, not a one-off. **Verified correct, no issues.**

### T012 — `authCardLayout.ts` + `LoginScreenChrome.web.tsx`

`authCardLayout.ts` is a single `export const AUTH_CARD_MAX_WIDTH = 660;`, no React import.
`LoginScreenChrome.web.tsx`'s diff is a pure substitution — `const CARD_MAX_WIDTH =
AUTH_CARD_MAX_WIDTH;` replacing the local literal, one new import line, one new doc-comment block
— no other line touched. `LoginScreenChrome.test.tsx` was not edited (confirmed via `git status`)
and its existing `maxWidth === 660` assertion still passes in the full suite run above — a true
no-op refactor for that screen, exactly as claimed. **Verified correct, no issues.**

### T013 — `src/domain/i18n/copy/registration.ts`

Spanish carries correct diacritics throughout the dictionary as read directly (`Correo
electrónico`, `Contraseña`, `Nacionalidad`, `Política de Privacidad`, `Términos de Uso`,
`Domicilio fiscal`, `Nombre comercial` — spot-checked every string in the file, not just the
test's sample). English is at genuine key parity, enforced **twice**: (1) at compile time —
`const en: Record<keyof typeof es, string> = {...}` means a missing English key is a `tsc` error,
confirmed by the clean `tsc --noEmit` run above; (2) at runtime —
`registration.test.ts`'s first case, `expect(Object.keys(registrationCopy.es).sort()).toEqual(
Object.keys(registrationCopy.en).sort())`, is a real, falsifiable comparison of the two key sets.
**Checked that this test would actually fail on a real gap, not pass vacuously**: temporarily
deleted one key (`fiscalAddressLabel`) from a scratch copy of `en` and confirmed the key-parity
`toEqual` assertion fails as expected (`Object.keys` diverges) — reverted immediately, no
committed change. This is a genuine parity guard, not a same-object tautology. A separate test
explicitly checks the dictionary does **not** contain the mockup tool's unaccented artifacts
(`"Correo electronico"`, `.not.toContain("Politica")`, `.not.toContain("Terminos")`) — the
accent requirement is actively regression-guarded, not just eyeballed once. **Verified correct,
no issues.**

### T014 — doc-comment correction only, claim independently re-verified

Read the full `git diff` for `src/lib/api.ts`, `src/domain/registration.ts`, and
`src/domain/profile.ts` directly (not the impl report's summary of it). Every changed hunk in all
three files is either a blank line or a `//`-prefixed comment line — **zero non-comment lines
touched**, confirming the "comments-only" claim independently (not by trusting the implementer's
own scripted check, by reading the diff myself). Checked the corrected comments' *content* for
accuracy against `spec.md`'s Assumptions, not just their presence: `spec.md` states backend
`004-session-authentication` "deleted [the X-User-Id header] entirely, in every `NODE_ENV`," and
the corrected comments in all three files say exactly that (`api.ts`: "deleted that trust path
entirely, in every NODE_ENV"; `registration.ts`/`profile.ts`: same phrasing) — this matches the
spec's own recorded finding precisely, not merely a different-but-unverified claim. The
header-sending code itself (`setCurrentUserId`, `getHeaders`'s `X-User-Id` line) is confirmed
still present and unremoved in `src/lib/api.ts`, matching `plan.md` Research Decision 7's explicit
instruction not to delete it in this feature. **Verified correct, no issues.**

### Constitution IV — `src/domain`/`src/lib` React Native import check

Grepped every new/changed file in this batch for `react-native`/`from "react"`/`from 'react'`
imports: `src/domain/nationality.ts`, `src/domain/schemas.ts`,
`src/domain/i18n/copy/registration.ts`, `src/lib/registration-draft.ts`,
`src/features/identity/authCardLayout.ts` — **zero matches in any of them.** `useNationalities.ts`
(the one file that does need `react`/`@tanstack/react-query`) correctly lives under
`src/features/identity/`, not `src/domain`, matching `plan.md`'s explicit "the one place in this
feature that needs a hook" placement. **Verified correct, no issues.**

### Requirement traceability (Level 5, `docs/verification.md`) — this batch

| FR | Test(s) | Status |
|---|---|---|
| FR-002 | `schemas.test.ts` → `usuarioCrearCuentaSchema` describe block | Met |
| FR-003 | `schemas.test.ts` → `tiendaProfileFormSchema`/`tiendaCrearCuentaSchema` describe blocks | Met |
| FR-007 | `registration.test.ts` (key parity, no-empty-values, orthography, mockup-artifact exclusion, tab-distinct placeholders, Select copy, submit copy) | Met — parity test independently confirmed non-vacuous (see T013 above) |
| FR-009 | `registration-draft.test.ts` (atomicity, second-consume-undefined, clear-then-consume, overwrite) | Met — atomicity independently re-verified in the source, not just the test |
| FR-012 | `nationality.test.ts`, `useNationalities.test.ts` | Met for the buildable/testable half; real-network half correctly, visibly `[BLOCKED-ON-015]` |
| FR-016 | `LoginScreenChrome.test.tsx`'s pre-existing `maxWidth === 660` assertion, still green sourced from the shared constant | Met |
| Constitution III (CURP/RFC never logged/persisted beyond the flow) | `registration-draft.ts`'s design + its test's atomicity proof; grep for `console.*`/storage APIs | Met |
| Constitution IV (`src/domain`/`src/lib` free of RN imports) | Grep across this batch's files | Met |

### `tasks.md` checklist status (this batch)

- [X] T008 — verified (narrow schema confirmed by reading the diff; existing four schemas
      byte-for-byte unchanged; `ProfileForm.tsx`/`.test.tsx` untouched)
- [X] T009 — verified (atomic consume genuinely proven by both source and test; zero leak
      surface found anywhere in this batch)
- [X] T010 — verified (assumption visibly flagged; nothing beyond `plan.md` invented)
- [X] T011 — verified (return shape matches `Select.types.ts`'s real props, not the plan's
      stale prose)
- [X] T012 — verified (true no-op refactor for `LoginScreenChrome.web.tsx`)
- [X] T013 — verified (accents correct; parity test independently confirmed non-vacuous)
- [X] T014 — verified (comments-only confirmed by reading the diff directly; content accurate
      to spec.md's Assumptions)

### `CHECKPOINTS.md` C1–C6 walkthrough (this batch)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md` and `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` not independently re-run this pass beyond `tsc`/`npx jest` (both clean); the
      implementer's own full `./init.sh` run reports `RESULT: SUCCESS`, same pre-existing
      Stage 5/6 WARNs as the documented baseline — consistent with `npx jest`'s independently
      reproduced 82/571 result, not re-run live by this review but not flagged as a gap since
      Stage 7's Tests-stage result is independently reproducible and was reproduced.

**C2 — state coherent**
- [x] Exactly one feature (`010-registration-redesign`) is `in_progress` (`feature_list.json`).
- [x] Every file this batch touches has passing, real tests covering it.
- [x] `progress/current.md` reflects the active session (out of this review's scope to
      re-verify content beyond the earlier round; not flagged).

**C3 — architecture respected**
- [x] `src/domain`/`src/lib` files touched in this batch (`nationality.ts`, `schemas.ts`,
      `registration-draft.ts`, `i18n/copy/registration.ts`) import zero React/React Native —
      independently grepped.
- [x] `useNationalities.ts` (the one hook this batch adds) calls into `src/domain/nationality.ts`
      rather than embedding a fetch/validation inline; correctly placed under
      `src/features/identity/`, not `src/domain`.
- [x] No inline `Platform.OS` conditionals introduced by this batch (no platform-specific file
      touched here beyond a no-op literal substitution in `LoginScreenChrome.web.tsx`).
- [x] No direct Postgres/Redis/S3/Supabase-table access anywhere in this batch.
- [x] No new global state library.
- [x] No stray `console.*`/context-free `TODO` anywhere in this batch's files (grepped
      independently).

**C4 — verification real**
- [x] Every new `src/domain`/`src/lib` export in this batch has a real, non-vacuous unit test
      (`nationality.ts`, `registration-draft.ts`, `schemas.ts`'s three new schemas,
      `registration.ts` i18n copy's parity guard) — Level 1, independently spot-checked above,
      not merely present.
- [x] `useNationalities.ts` (the one new hook) has a real `renderHook`-based test asserting on
      resolved state, not implementation details — Level 2-equivalent for a hook.
- [x] `./init.sh`'s build/native-alignment stages reported clean by the implementer's own run,
      consistent with this batch introducing no new native surface (pure TS/domain work).
- [x] Level 3 manual smoke check correctly **not performed and explicitly disclosed as such** —
      this batch has zero UI consumers (T015–T019 remain `[ ]`), matching
      `docs/verification.md`'s "an unreachable screen/change is not a verified one" rule; stating
      this plainly is the correct behavior, not a gap.

**C5 — session hygiene**
- [x] No suspicious untracked files beyond the expected new source/test files for this batch.
- Not independently assessed here (`progress/history.md` session-close bookkeeping remains out
  of this code review's scope, consistent with prior rounds).

**C6 — SDD**
- [x] `specs/010-registration-redesign/{spec.md,plan.md,tasks.md}` all exist, re-read fresh.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers.
- [ ] N/A — feature not yet `done` (Phase 3/4/5 remain `[ ]`).
- [x] Every `FR-00x` this batch's tasks claim to satisfy is referenced by at least one test's
      description or an adjacent comment (see traceability table above) — no untagged claim
      found.

### Findings

None. No blocking, non-blocking, or nit-level issue found in T008–T014. Every specific concern
raised in the review brief was independently re-verified against the actual source rather than
the implementer's account: the draft module's atomicity is real (proven in both the source and a
genuinely falsifiable test), nothing in this batch or in T001–T007's already-shipped files
provides an alternate leak path for the draft; `tiendaProfileFormSchema` is narrow and
independent of `businessProfileFormSchema`, and all four pre-existing schemas plus
`ProfileForm.tsx`/its tests are confirmed byte-for-byte unaffected; the nationality-catalog
assumption is visibly flagged as unconfirmed in the code itself, not just in prose docs, and
`useNationalities`' return shape was checked against the real, T006-fixed `Select.types.ts`, not
the plan's stale field names; T013's Spanish is properly accented and its English-parity test was
proven non-vacuous by an ad hoc mutation-and-revert check; T014's diff is genuinely comments-only
and its corrected content accurately reflects backend `004`'s documented, every-`NODE_ENV`
deletion of the `X-User-Id` trust path, not merely a differently-worded claim.

### Independent re-run summary

```
$ node_modules/.bin/tsc --noEmit
(clean, zero errors)

$ npx jest
Test Suites: 82 passed, 82 total
Tests:       571 passed, 571 total
```

Matches the implementer's own reported numbers exactly, independently reproduced.

## Verdict

**APPROVE**

T008–T014 are sound, correctly scoped, and independently re-verified against the source rather
than taken on the implementer's account. This completes Phase 2 (Foundational) — Phase 3 (US1
screens: `UsuarioForm`/`TiendaForm`/`CrearCuentaScreen`, T015 onward) may proceed. One thing to
carry forward into that phase's review, not a defect in this batch: `verify-phone.tsx`'s T019
extension is where `consumeRegistrationDraft()` first gets a real caller — that is the point to
re-check the draft truly never escapes the module (e.g. via a `console.error` added to a catch
block around the auto-submit call, or the draft's contents ending up in a thrown-error payload
logged elsewhere) now that it has an actual consumer.

---

# Review round 3 — T015–T017 (Phase 3: User Story 1, `Crear cuenta` screen + its two tab forms)

Reviewed against `specs/010-registration-redesign/{spec.md,plan.md,tasks.md}`,
`docs/design-brief-registration-redesign.md`, `.specify/memory/constitution.md`,
`docs/conventions.md`, `docs/verification.md`, `CHECKPOINTS.md`, all re-read fresh from disk.
`progress/impl_010-registration-redesign.md`'s "Run 5 — T015–T017" section treated as a claim,
verified independently below, not trusted.

## Scope actually reviewed

`git status --short` confirms the new files named in the brief are genuinely untracked:
`src/features/identity/UsuarioForm.{tsx,test.tsx}`, `TiendaForm.{tsx,test.tsx}`,
`CrearCuentaScreen.{tsx,web.tsx,test.tsx}`, `useCrearCuentaSubmit.ts` — plus one modified,
already-approved file extended additively: `src/domain/i18n/copy/registration.ts` (six new
`sessionIssue`/retry keys). `app/(auth)/register.tsx`, `app/(auth)/verify-phone.tsx`,
`app/(auth)/profile.tsx`, `src/domain/registration.ts`, `src/domain/profile.ts` all show **zero
diff** — confirmed directly via `git diff --stat -- <those paths>`, not taken on the
implementer's word. T018/T019 genuinely not started.

## Independent verification run

- `node_modules/.bin/tsc --noEmit` — clean, zero errors.
- `npx jest` — **85 suites / 596 tests, all green**, matching the implementer's reported numbers
  exactly.
- `./init.sh` (no `--skip-*` flags) — `RESULT: SUCCESS (10/10 stages passed)`. Stages 5/6 carry
  the same pre-existing, non-blocking WARN set documented in every prior round of this feature
  (`expo-image-picker@15.0.7`, `react-native@0.74.0`, `react-native-safe-area-context@4.10.1`,
  `@types/react@18.3.31`, `typescript@5.9.3`) — no new warning attributable to this batch. No
  local Xcode/SDK-51 incompatibility surfaced in this run (environment-dependent either way).
- Manual smoke check: correctly **not performed and disclosed as not performed** —
  `CrearCuentaScreen` has zero route consumers as of this batch (T018, which mounts it at
  `/register`, is out of scope). Confirmed this is genuinely true, not just claimed: `git diff
  --stat -- "app/(auth)/register.tsx"` is empty. `./init.sh`'s stage 8 (web/iOS/Android bundle
  export, all three green) is the correct, strongest verification available for code with no
  reachable route yet, and that's what was actually run.

## Requirement traceability (T015–T017 claims, spot-checked against the real test files)

| FR | Test(s) checked | Verdict |
|---|---|---|
| FR-001 (one screen, segmented control, Usuario default) | `CrearCuentaScreen.test.tsx` — "shows the shared title/subtitle chrome and defaults to the Usuario tab", "switching the segmented control swaps the rendered form" (both platform variants) | Confirmed, real behavior asserted (form swap, not just style) |
| FR-002 (Usuario field set/order) | `UsuarioForm.test.tsx` (8 tests) | Confirmed — field order in `UsuarioForm.tsx` matches design brief §3 exactly; the full-payload test asserts every field by name |
| FR-003 (Tienda field set/order, no personal field ever) | `TiendaForm.test.tsx`, especially "never renders a personal-account field" | Confirmed — negative assertion (`queryByLabelText`/`queryByText`/`queryByTestId`, all `null`), not a positive-only check. `TiendaForm.tsx` itself contains no `nombre`/`birthDate`/`nationality`/`curp` field, confirmed by reading the file in full |
| FR-006 (token-only visual language) | No raw hex found in any of the three new files (`grep`-checked); all colors route through `@/theme` | Mostly confirmed — see Finding 1 below for a narrow, non-color exception |
| FR-008/FR-009 (three-call flow unchanged; draft written, in-memory only) | `CrearCuentaScreen.test.tsx`'s Tienda-submit test, using the real unmocked `consumeRegistrationDraft()` | Confirmed — exact 4-field registration call asserted, exact draft shape asserted via the real module, not a mock |
| FR-013 (real date-picker control) | `UsuarioForm.test.tsx`'s birth-date-driving tests | Confirmed — drives the vendor's own public `DateTimePickerEvent` contract, matching `DateField.test.tsx`'s established technique |
| FR-014 (platform split via file extension only) | `CrearCuentaScreen.tsx`/`.web.tsx` — neither imports `Platform`, confirmed by `grep` | Confirmed |
| FR-017/SC-002 (specific inline errors, never a raw default) | `UsuarioForm.test.tsx`'s 12-assertion empty-submit test; `TiendaForm.test.tsx`'s missing-RFC test | Confirmed — every message is the schema's own specific copy, none is a raw Zod default string |

## The three items flagged for extra scrutiny

**1. `useCrearCuentaSubmit.ts` — an undeclared file, judged on the merits.** Placement
(`src/features/identity/`, colocated with the screen it serves) matches
`docs/conventions.md`'s "custom hooks... live beside the feature that owns them." It contains no
business logic of its own — it only calls already-portable `src/domain`/`src/lib` functions
(`submitPersonalRegistration`, `submitBusinessRegistration`, `retrySignIn`,
`setRegistrationDraft`, `setCurrentUserId`) and holds UI-lifecycle state (`tab`, `isSubmitting`,
`sessionIssue`), which is exactly the same shape `useKycGate.ts` already has and `plan.md` itself
anticipated for this feature ("the one place... that needs a hook rather than a pure
`src/domain` function"). It doesn't contradict `plan.md`'s Project Structure so much as it
factors what that document assigned to `CrearCuentaScreen.tsx` into a file both platform variants
share — a legitimate DRY move given `.tsx`/`.web.tsx` would otherwise duplicate ~60 lines of
network/session-state orchestration verbatim, a real drift risk for security-adjacent code (it
holds the credentials `retrySignIn` needs and writes the CURP/RFC-bearing draft). Verdict:
justified, correctly layered, not a Constitution IV violation. See Finding 2 below for its one
real gap — test coverage, not architecture.

**2. The unconditional-before-`sessionError` draft write.** Read `useCrearCuentaSubmit.ts` and
`app/(auth)/register.tsx` side by side to check fidelity, not just the claim. `register.tsx`'s
pre-existing T033 mechanism already calls `setCurrentUserId(user.id)` unconditionally, before the
`sessionError` branch, on the documented reasoning that the backend account exists either way.
`completeRegistration()` in the new hook extends that exact precedent to
`setRegistrationDraft(draft)` — same reasoning, same place in the control flow, correctly
extended rather than newly invented. Traced every path:
- Registration call itself throws (`EmailTaken`, network error, etc.) → `completeRegistration` is
  never reached (it's called only after `submitPersonalRegistration`/`submitBusinessRegistration`
  resolves) → no draft written. Correct — matches FR-009's "never persisted... beyond the flow's
  lifetime" for a flow that never actually started.
- Registration succeeds, sign-in succeeds (`sessionError` absent) → draft written, immediate
  `router.replace("/verify-phone")`. Draft sits in memory until `verify-phone.tsx`'s T019
  extension consumes it — not yet built, so today it simply sits there until the app closes; this
  is the expected, disclosed mid-feature state (T017 supplies the write, T019 supplies the
  consumer), not a defect in this batch.
- Registration succeeds, sign-in fails (`sessionError` present) → draft written, `sessionIssue`
  state shown, no navigation. A `Retry sign-in` press re-calls only `retrySignIn` (never
  re-registers, matching the "don't re-register" comment carried forward from `register.tsx`
  verbatim) and navigates on success — the already-written draft is untouched and still correct
  for the eventual `/verify-phone` consumer.
- A later, different-tab submission in the same session (e.g. abandon a Usuario attempt mid-
  `sessionIssue`, switch to Tienda, submit successfully) → `setRegistrationDraft` is a plain
  module-level `let`, so the second `set` overwrites the first — `registration-draft.test.ts`
  (already-approved, Run 4) explicitly covers this exact "later set overwrites an earlier
  unconsumed draft" case. No orphaned old draft lingers to be wrongly consumed by the *same*
  attempt's own later step.

No path in this batch's own code leaves a draft "stranded" in the sense of surviving past what
Constitution III allows (it never touches disk/storage; it's gone the moment the JS process
ends) or in the sense of silently double-writing/duplicating. The one real cross-session-boundary
question this design raises — whether a *stale, abandoned* draft from an earlier, never-retried
`sessionIssue` attempt could later be wrongly picked up by `consumeRegistrationDraft()` if a
*separate*, unrelated `/verify-phone` visit happens in the same still-alive JS session (e.g. a
resumed different-account flow reached via the KYC gate) — is a real design question, but it is
**T019's question, not this batch's**: T019 is what will call `consumeRegistrationDraft()` for
the first time, T019's own review should re-examine whether that call site needs a scoping guard
(e.g. keying the draft to the email/session it was written for) before trusting an unconditional
consume. Flagging this explicitly as the item to carry into that review, not as a defect here —
this batch only supplies the write half faithfully, and it does so correctly.

**3. `TiendaForm` — no personal-account field, absent not hidden.** Confirmed by reading
`TiendaForm.tsx` in full: there is no `nombre`/`apellidoPaterno`/`apellidoMaterno`/`birthDate`/
`nationality`/`curp` `Controller`, field, or import of `DateField`/`Select` anywhere in the file —
not a conditionally-rendered branch, genuinely absent from the source. `TiendaForm.test.tsx`
backs this with a dedicated negative test using `queryByLabelText`/`queryByText`/`queryByTestId`
(all asserted `null`), exactly as required, plus an explicit `queryByText("RFC (PLD)")` check for
Clarification 3. This is the correct frontend half of design brief §7.6's decision.

## Other checks

- **`app/(auth)/register.tsx`'s `sessionIssue`/`retrySignIn` mechanism (`001-registration-kyc`
  T031/T033) does not regress.** Confirmed two ways: (a) `register.tsx` itself is untouched
  (empty `git diff`), so its own copy is unmodified by construction; (b) the new hook's copy was
  read side-by-side against it (both files quoted above) — `setCurrentUserId` unconditional
  placement, the `currentUserQueryKey` merge-not-replace pattern, `retrySignIn` never
  re-registering, and the exact navigation targets (`/verify-phone` on success, no navigation on
  `sessionError`) all carry over faithfully. Copy differs (now routed through `registrationCopy`
  instead of hardcoded English strings, correctly per FR-007) but the mechanism is
  behaviorally identical.
- **`src/domain/registration.ts` is functionally unchanged.** Independently confirmed via `git
  diff -- src/domain/registration.ts` plus a scripted check (`grep -E "^[+-]"` excluding blank/
  comment lines) — zero non-comment lines changed. This file was carried forward from Run 4
  (T014), not touched again in this batch; re-verified here since the brief asked for it
  independently.
- **Copy sourcing.** Both forms and both screen chrome files call `useTranslation(registrationCopy)`
  exclusively for every user-visible string; no literal Spanish/English string found in any of
  the five new component/hook files via inspection (only comments and test-file expected-output
  strings, which is correct — tests assert against real rendered/localized text).
- **Field order vs. design brief.** `UsuarioForm.tsx`: Nombre(s) → Apellido paterno → Apellido
  materno → Correo electrónico → Contraseña → Usuario → Fecha de nacimiento → Celular →
  Nacionalidad → CURP → RFC → consents → Registrarse — matches §3 exactly (with Clarifications
  1/2/4 applied as documented). `TiendaForm.tsx`: Nombre comercial → Correo electrónico →
  Contraseña → Usuario → RFC → Celular → Domicilio fiscal → consents → Registrarse — matches §4
  exactly (Clarifications 1/3 applied).
- **`Select` fed by props, not `useNationalities`.** Confirmed — `UsuarioForm.tsx` takes
  `nationalityOptions`/`nationalityLoading`/`nationalityError`/`onRetryNationality` as plain props
  (defaulting to `[]`/`false`/`undefined`/`undefined`) and never imports `useNationalities`;
  `CrearCuentaScreen.tsx`/`.web.tsx` don't pass them through either (T020's job, correctly out of
  this batch). Matches spec.md's Edge Cases — no hardcoded fallback list anywhere.
- **Constitution I/IV**: no `Platform` import, no inline `Platform.OS`, in either
  `CrearCuentaScreen.tsx` or `.web.tsx` (`grep`-confirmed); the two files differ only in chrome, as
  claimed. No API call, validation, or data transform embedded in a component body — `UsuarioForm`/
  `TiendaForm` only render and call `onSubmit`; `useCrearCuentaSubmit` is the one place orchestration
  lives, itself calling only `src/domain`/`src/lib` functions.
- **CHECKPOINTS C3/C4 spot-checks**: zero `console.*` calls in any of the five new files (`grep`-
  confirmed; the one match found is inside a comment in `UsuarioForm.tsx` describing the absence).
  Zero context-free `TODO`s. `src/domain`/`src/lib` RN-import boundary intact — the only matches for
  `react-native`/`expo-` in `src/domain/*` are inside comments (e.g. `registration.ts`'s prose
  about why it stays import-free); `src/lib/registration-draft.ts` has zero real RN/Expo imports,
  confirmed by reading the file.

## Findings

**Finding 1 (nit, not blocking) — magic-number typography literals in the `sessionIssue`
chrome.** `src/features/identity/CrearCuentaScreen.tsx:137-141` and
`CrearCuentaScreen.web.tsx:137-141` (`styles.sessionTitle`) hardcode `fontSize: 22, fontWeight:
"600"` rather than sourcing from a `src/theme/typography` token. Colors are correctly tokenized
(`colors.text.primary`/`colors.text.secondary`), but FR-006 reads "no new raw hex/magic-number
literal, except where a genuinely new token is required (the segmented control's inactive-track
fill; the sentence-case field-label variant)" — the two listed exceptions don't cover this case,
and no existing `typography` entry matches `22`/`"600"` (the closest, `display.lg`, is `28`/
`"700"` with a serif `fontFamily` that doesn't fit a body heading). This is carried over visually
from `register.tsx`'s own pre-`006` sessionIssue styling (which was never brought into
`006-visual-identity`'s token pass and is explicitly not required to be restyled by this feature's
Deferred/Out-of-Scope section, which only names `verify-phone.tsx`) — but `CrearCuentaScreen` is a
*new* file this feature introduces, squarely inside "this screen" as FR-006 defines it, so the
literal counts as newly introduced here even though the visual result matches old behavior. Low
severity (two numbers, no color/hex, no accessibility impact — 22px easily clears any minimum
size), does not block this batch; worth a token (or an explicit FR-006 exception note) before the
feature's Phase 5 polish pass.

**Finding 2 (nit, not blocking) — `useCrearCuentaSubmit`'s failure path has no direct test.**
Neither a standalone `useCrearCuentaSubmit.test.ts` nor any case in `CrearCuentaScreen.test.tsx`
exercises `submitPersonalRegistration`/`submitBusinessRegistration` **rejecting** (e.g.
`EmailTaken`, a network error) — the `catch (error) { setServerError(mapRegistrationError(error))
}` branch in both `handleUsuarioSubmit` and `handleTiendaSubmit` is therefore untested at every
level: `mapRegistrationError` itself is unit-tested in `registration.test.ts` (pre-existing), and
`UsuarioForm.test.tsx`/`TiendaForm.test.tsx`'s "server-supplied field error" tests pass a
`serverError` prop directly into the form, bypassing the hook's catch block entirely — the actual
wiring between "the registration call rejected" and "the right error reaches the right form"
is never exercised end to end. Low risk in practice (it's a two-line, faithful port of
`register.tsx`'s own already-reviewed `catch` block), but it is a genuine, currently-zero-coverage
code path in new PII/credential-adjacent orchestration, worth a
`mockSubmitBusinessRegistration.mockRejectedValue(...)`-style case in `CrearCuentaScreen.test.tsx`
(mirroring the existing Tienda-submit test's structure) before this feature reaches Phase 5.

Neither finding blocks T015–T017; both are pre-existing-pattern-adjacent, low-severity, and
appropriate to fix in a later pass of this same feature (Finding 1 fits naturally into T027's
accessibility/token pass or T030's final `./init.sh`/`CHECKPOINTS.md` walk; Finding 2 fits
naturally alongside T019, which is the next task to touch this same hook's call sites).

## CHECKPOINTS C1–C6 walkthrough (this round)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists, current.
- [x] `./init.sh` exits 0 (`RESULT: SUCCESS (10/10 stages passed)`, pre-existing dependency WARNs
      excepted per `docs/verification.md`).

**C2 — state coherent**
- [x] `010-registration-redesign` is the only `in_progress` feature (not re-verified against
      `feature_list.json` in this round beyond confirming no other feature's files were touched).
- [x] Every `done` feature still has passing tests (full suite green, no regression).
- [ ] N/A this round — `progress/current.md` session-scope is an orchestrator concern, not
      re-checked here.

**C3 — architecture respected**
- [x] `src/domain` has zero real React Native/Expo imports (spot-checked `registration.ts`,
      confirmed comment-only matches).
- [x] UI components (`UsuarioForm`, `TiendaForm`, `CrearCuentaScreen*`) call into `src/domain`/
      `src/lib` via `useCrearCuentaSubmit` rather than embedding fetch/validation/business rules.
- [x] Platform-specific code uses the `.web.tsx` convention; no inline `Platform.OS` found in any
      new file this batch added.
- [x] No direct Postgres/Redis/S3/Supabase-table access; all calls go through `src/domain`
      functions wrapping `ApiClient`/the Supabase Auth SDK.
- [x] No new global state library.
- [x] No stray `console.*`, no context-free `TODO` in any new file (grep-confirmed).

**C4 — verification real**
- [x] Every `src/domain` export with logic has a covering unit test (unchanged this batch —
      `registration.ts` only gained comment corrections in a prior round).
- [x] New/changed screens (`UsuarioForm`, `TiendaForm`, `CrearCuentaScreen`/`.web`) have RNTL
      component tests asserting real rendered output/behavior, not implementation details.
- [x] `./init.sh`'s three build-export stages (web/iOS/Android) all pass; Native dependency
      alignment stage WARNs only on the same pre-existing five packages, not FAILing.

**C5 — session closed well** — N/A this round (mid-feature checkpoint, not a session close;
orchestrator's responsibility).

**C6 — SDD**
- [x] `specs/010-registration-redesign/{spec.md,plan.md,tasks.md}` all exist, re-read fresh.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers.
- [ ] N/A — feature not yet `done` (T018 onward remain `[ ]`).
- [x] Every `FR-00x` this batch's tasks claim is referenced by at least one test's description or
      an adjacent comment (see traceability table above) — no untagged claim found.

## Verdict

**APPROVE WITH NITS**

T015–T017 are correctly scoped, faithful to `spec.md`/`plan.md`/the design brief, and
independently re-verified against the actual source rather than the implementer's account: field
sets/order match the design brief exactly on both tabs, `TiendaForm` genuinely contains no
personal-account field (absent, not hidden, with a negative test), the `sessionIssue`/`retrySignIn`
mechanism is faithfully carried forward and `register.tsx` itself is untouched, `registration.ts`
is confirmed comment-only, and the two items flagged for extra scrutiny (`useCrearCuentaSubmit.ts`'s
extraction and the unconditional-before-`sessionError` draft write) both hold up as sound,
correctly-layered design decisions rather than shortcuts. Two nits recorded above (a magic-number
typography pair, and a real-but-low-risk test-coverage gap on the registration-failure path) —
neither blocks proceeding to T018/T019, both are appropriately deferred to this feature's own later
passes. One item explicitly carried forward, not a defect in this batch: **T019's own review should
re-examine whether `consumeRegistrationDraft()` needs a scoping guard against a stale, abandoned
draft from an earlier unretried `sessionIssue` attempt being wrongly picked up by an unrelated
`/verify-phone` visit in the same JS session** — this batch only supplies the write half, and does
so correctly; T019 is what gives the draft its first real consumer.

---

# Review round 4 — T018–T019 (route rewiring, Run 5 nit fix, and the email-scoping guard) — 2026-08-06

Reviewed against `specs/010-registration-redesign/{spec.md,plan.md,tasks.md}`,
`.specify/memory/constitution.md`, `docs/conventions.md`, `docs/verification.md`,
`CHECKPOINTS.md`, all re-read fresh from disk. `progress/impl_010-registration-redesign.md`'s
"Run 6 — T018–T019 + Run 5 nit" section treated as claims, verified independently below by
reading the actual source, running the checks myself, and tracing the routing mechanics through
`src/domain/kyc-gate.ts`/`src/features/identity/useKycGate.ts`/`app/_layout.tsx` (all confirmed
untouched by this feature) rather than trusting the report's narrative.

## Scope actually reviewed

`git status`/`git diff HEAD` confirm the batch: `app/(auth)/register.tsx` (rewritten to thin
glue), `app/(auth)/register.test.tsx`, `app/(auth)/register.session-wiring.test.tsx`,
`app/(auth)/register.session-failure.test.tsx`, `app/(auth)/verify-phone.tsx` (one new branch),
`app/(auth)/verify-phone.test.tsx` (extended), `src/theme/typography.ts` (new `heading.sm`
token), plus three previously-approved files touched by the disclosed guard:
`src/lib/registration-draft.ts` (new `email` field + `draftMatchesEmail`),
`src/features/identity/useCrearCuentaSubmit.ts` (passes `email` into the draft),
`src/lib/supabase-client.ts` (new `getCurrentSessionEmail()`). `src/domain/registration.ts` and
`src/domain/profile.ts` confirmed **zero diff** beyond what Run 4 already approved (re-checked
directly: `git diff HEAD -- src/domain/registration.ts src/domain/profile.ts | grep -E "^[+-]"`
excluding comment/blank lines returns nothing).

## Independent verification run

- `node_modules/.bin/tsc --noEmit` — clean, zero errors.
- `npx jest` — **85 suites / 598 tests, all green**, matching the implementer's reported numbers
  exactly (one pre-existing, unrelated `act()` warning from `ScanSearchField.tsx`, not touched by
  this feature).
- `./init.sh` (no `--skip-*` flags) — `RESULT: SUCCESS (10/10 stages passed)`. Stages 5/6 carry
  the same pre-existing, non-blocking WARN set documented in every prior round of this feature
  (`expo-image-picker@15.0.7`, `react-native@0.74.0`, `react-native-safe-area-context@4.10.1`,
  `@types/react@18.3.31`, `typescript@5.9.3`) — no new warning attributable to this batch.

## The headline item — the cross-account PII-leak chain and the guard that closes it

**Independently traced the chain against the actual, untouched gate code, not accepted on
narrative alone.**

1. `src/domain/kyc-gate.ts` — confirmed byte-for-byte unchanged from the file already approved in
   `005-login`/`001-registration-kyc` (this feature's own diff touches neither this file nor
   `useKycGate.ts` nor `app/_layout.tsx`, confirmed via `git diff --stat`). `resolveKycRoute()`
   maps `!user` → `"unauthenticated"` and, once a session exists, `!user.phoneVerifiedAt` →
   `"verify-phone"` — read directly at `src/domain/kyc-gate.ts:63-73`.
2. `useKycGate.ts`'s `hasSession` is `sessionResolved && (session !== null || sessionCheckFailed)`
   — for User A, whose registration succeeded but whose Supabase sign-in failed
   (`useCrearCuentaSubmit.ts`'s `sessionIssue` branch), `session` genuinely stays `null` (nothing
   in `completeRegistration()` establishes one on that path), so `hasSession` is `false` and the
   gate's resolved route stays `"unauthenticated"` (target `/login`) for as long as A sits on the
   `sessionIssue` view.
3. `app/_layout.tsx`'s `<Redirect href={KYC_ROUTE_TARGETS[route]} />` uses `expo-router`'s own
   `useFocusEffect`-backed `Redirect` (confirmed by reading
   `node_modules/expo-router/build/link/Link.js:40-51` directly) — `specs/005-login/spec.md`'s
   own recorded finding (lines 72-79, read fresh) already establishes, as pre-existing,
   previously-reviewed behavior, that this redirect **re-fires when the gate's resolved route
   value changes**, not on every render/navigation. Since A's route stays `"unauthenticated"` the
   entire time A is on `/register`'s `sessionIssue` view (no session ever gets established on
   that path), the value never changes, so the redirect does not fire A away from `/register`.
   This is consistent with `/register` being reachable and usable by unauthenticated visitors at
   all under this exact same gate — already-proven, existing behavior, not something this
   feature's diff could have altered even if it wanted to (both files are untouched).
4. `SignInForm.tsx` genuinely has a `<Link href="/register">` ("Create account"), so a browser
   Back (or an equivalent native back-gesture) from `/register` to `/login` is ordinary
   `expo-router` SPA client-side navigation — no full reload, so `src/lib/registration-draft.ts`'s
   module-level state survives, exactly as claimed.
5. A signs in as a different, already-registered account B whose `phoneVerifiedAt` is `null`.
   This is a genuine route-VALUE change (`"unauthenticated"` → `"verify-phone"`), which — per the
   same re-fire mechanism `005-login`'s own spec already documents — does actively navigate B to
   `/verify-phone`, in the same still-alive JS process A's stale, unconsumed draft is sitting in.
6. Without the guard, B's `/verify-phone` success would call the unconditional
   `consumeRegistrationDraft()` and silently submit **A's** draft (name, CURP, RFC, birth date) as
   B's own profile — a genuine, concrete cross-account PII leak. **This is real and reachable, not
   a contrived edge case** — it requires only two already-ordinary user actions (an existing
   in-app "Create account" link and browser/gesture back-navigation), no full reload, no multiple
   tabs, no unusual timing.

**Verdict on reachability: confirmed real**, independently, against the actual gate mechanics
rather than accepted from the implementer's narrative.

### The guard's shape, judged file by file

- **`src/lib/registration-draft.ts`** — adds `email: string` to both `RegistrationDraft` union
  variants (a scoping key, not a new profile field collected from the user) and a new pure
  export, `draftMatchesEmail(draft, email)`: case/whitespace-insensitive comparison,
  `null`/`undefined` input **never** matches (fails closed). Minimal, single-purpose, well
  isolated in its own doc comment explaining the exact leak it closes. **Sound.**
- **`src/features/identity/useCrearCuentaSubmit.ts`** — one added line per submit handler
  (`handleUsuarioSubmit`/`handleTiendaSubmit`), passing the already-destructured `email` into the
  draft object each already builds. No new control flow, no new call, no change to the
  unconditional-before-`sessionError` write order this file's own Run 5 review already cleared.
  **Minimal, justified.**
- **`src/lib/supabase-client.ts`** — new `getCurrentSessionEmail()`. Read side by side against
  `signInWithPassword` (the file's own "MUST NEVER THROW" reference implementation, lines 92-109):
  both wrap the one Supabase SDK call in `try {...} catch { return <safe fallback> }`, with no
  code path that can throw past the wrapper. `getCurrentSessionEmail()`'s fallback (`null`) is
  correctly treated by `draftMatchesEmail()` as "never matches" — the same "narrow access under
  uncertainty, never widen it" posture `kyc-gate.ts`'s own doc comment already establishes for
  `statusFetchFailed`. **The shape genuinely matches the file's established contract.**
- **`app/(auth)/verify-phone.tsx`** — `consumeRegistrationDraft()` is called first, unconditionally
  (so a draft is cleared exactly once regardless of match outcome — confirmed by reading the
  current file directly, lines 76-95); only a **present and matching** draft is auto-submitted.
  A present-but-mismatched draft falls through to the exact same `/profile` redirect the
  draft-absent case already used — **it is discarded, not returned to the pool, and not
  silently retried for a third visitor.** This is the correct, minimal wiring point (the one
  place `consumeRegistrationDraft()` is actually called in the whole codebase).
- **Fail-closed posture on a null/unknown email**: correct call. Given the alternative (treating
  an unknown session email as "assume it matches") would silently re-open exactly the leak this
  guard exists to close, failing closed is the only defensible posture here, and it degrades
  gracefully — a false negative (an actually-matching draft treated as a mismatch, e.g. if
  `getCurrentSessionEmail()` transiently fails) only costs the user a `/profile` re-entry
  (FR-010's already-existing, accepted recovery path), never a wrong outcome.

### Tests for the guard — real, not vacuous

`app/(auth)/verify-phone.test.tsx` uses the **real, unmocked** `src/lib/registration-draft.ts`
module (only `@/domain/profile`'s `submitProfile` and `@/lib/supabase-client`'s
`getCurrentSessionEmail` are mocked) — so `draftMatchesEmail()`'s actual comparison logic runs for
real in these tests, not a stub. Three new/extended cases independently read and confirmed
non-vacuous: a matching-email draft auto-submits and reaches `/tutorial`
(`mockSubmitProfile` asserted called with the exact expected payload, `email`/`kind` excluded);
a matching-email draft whose `submitProfile` call rejects reaches `/profile` with the draft
already gone (`consumeRegistrationDraft()` asserted `undefined` afterward — a genuine re-entry,
not a retry); and the dedicated mismatch case (`getCurrentSessionEmail` resolves `"bob@
example.com"` against a draft written for `"ana@example.com"`) asserts `mockSubmitProfile` was
**never called** and the draft is still consumed (gone), landing on the same `/profile` path as
"no draft at all." This is the actual leak path, closed and proven, not merely asserted in a
comment.

Two previously-approved tests this touched were checked for weakening, not just presence:
- `src/lib/registration-draft.test.ts` — fixtures gained an `email` field; every existing
  assertion (`toEqual(personalDraft)`, the atomicity/overwrite cases) is untouched and still
  exercises the exact same behavior it did before — **purely additive.**
- `src/features/identity/CrearCuentaScreen.test.tsx` — its one `consumeRegistrationDraft()`
  `toEqual({...})` assertion gained the now-expected `email` field, keeping it a full,
  field-by-field real-shape assertion (not loosened to `toMatchObject` or a partial check) —
  **purely additive.**

## T018 — `app/(auth)/register.tsx` rewrite

Read the current file directly: it is exactly `<CrearCuentaScreen />` behind a bare
`@/features/identity/CrearCuentaScreen` import (platform-extension resolution, mirroring
`LoginScreen.tsx`'s own `./LoginScreenChrome` precedent) — no local state, no duplicated
`setCurrentUserId`/`sessionIssue`/`retrySignIn` copy. That mechanism was confirmed, independently,
to still exist and be byte-for-byte faithful inside `useCrearCuentaSubmit.ts` (already approved in
the prior review round, re-spot-checked here): `setCurrentUserId(result.user.id)` unconditional
before the `sessionError` check, the `currentUserQueryKey` merge-not-replace cache write,
`retrySignIn`'s "never re-registers" comment and behavior, and identical navigation targets. No
regression found.

**The three test files updated (only one named in T018's own task text)** — `register.test.tsx`
(named), `register.session-wiring.test.tsx` and `register.session-failure.test.tsx` (not named,
but required — both call `getByLabelText("Email")`/press `"Create account"`, which no longer
exist once `register.tsx` renders `CrearCuentaScreen`). Read all three in full:
- `register.session-wiring.test.tsx` (the T033 real-integration regression guard) — still renders
  the real, unmocked `RegisterScreen`/`submitBusinessRegistration`/`api` singleton, still stubs
  only the true I/O boundary (`global.fetch`, `@/lib/supabase-client`), and still proves the exact
  thing it was built to prove: a second, real `api()` call after registration carries the
  `X-User-Id` header sourced from the backend's own returned `User.id`. Adapted to the Tienda tab
  (no `useNationalities()` wiring at this composed level yet, T020) — correctly reasoned as a
  non-weakening substitution, since `completeRegistration()` inside `useCrearCuentaSubmit.ts`
  does not branch on account type for the mechanism this test actually guards (confirmed by
  reading that function directly — the `setCurrentUserId`/cache-write/draft-write sequence runs
  identically for both `handleUsuarioSubmit`/`handleTiendaSubmit`). **Guard intact, not
  loosened.**
- `register.session-failure.test.tsx` (the T034 real-`signInWithPassword`-rejection regression
  guard) — still mocks only `@supabase/supabase-js`'s SDK-level `signInWithPassword` to *reject*
  (not resolve with an `{ error }` field), still asserts the rejection is caught and surfaced as
  the `sessionIssue` view (`crear-cuenta-session-issue`, confirmed to be the real testID rendered
  by `CrearCuentaScreen.tsx:49`) rather than the generic form-error path
  (`tienda-form-error`, confirmed to be the real testID rendered by `TiendaForm.tsx:77`) — same
  Tienda-tab adaptation, same non-weakening reasoning as above. **Guard intact.**
- `register.test.tsx` — rewritten around the Tienda tab throughout (the composed screen doesn't
  wire `useNationalities()` yet, so a full Usuario submit is genuinely unreachable at this level —
  the identical, already-accepted reasoning `CrearCuentaScreen.test.tsx` established in the prior
  round). Still covers the three things T018's own text names: successful submit → real
  registration call with only the four credential fields → `/verify-phone`; the `sessionIssue`
  view; `setCurrentUserId` called in both the immediate-success and sessionIssue-then-retry paths.
  The one real trade-off (this file no longer directly exercises the Usuario/`submitPersonalRegistration`
  path through the actual `/register` route) is a continuation of an already-reviewed and accepted
  pattern from the prior round (`CrearCuentaScreen.test.tsx`'s own Tienda-only composed-level
  coverage), not a new gap introduced here — `UsuarioForm.test.tsx` already covers the Usuario
  submit payload in full at the form level.

## T019 — `app/(auth)/verify-phone.tsx` success-handler extension

- **Draft-absent path unchanged**: confirmed via the dedicated
  `"calls verifyPhoneCode and navigates to /profile on a correct-code submission (draft-absent,
  unchanged)"` test, which additionally asserts `mockSubmitProfile` is never called — proving the
  fall-through is genuine, not merely "still passes."
- **Failure branch is a genuine re-entry, not a silent retry**: `consumeRegistrationDraft()` is
  called *before* `submitProfile` is attempted (read directly in `verify-phone.tsx`), so a failed
  auto-submit lands on `/profile` with the draft already gone — proven by the dedicated failure
  test asserting `consumeRegistrationDraft()` returns `undefined` afterward, matching FR-010's
  requirement and Constitution III (no cached-value silent retry).
- **The `as unknown as BusinessProfileFormInput` cast** (`verify-phone.tsx:68`) — judged on the
  merits: `tiendaProfileFormSchema`'s shape (`commercialName`/`rfc`/`fiscalAddress`/
  `tosAccepted`/`privacyAccepted`) is genuinely narrower than `submitProfile`'s declared
  `BusinessProfileFormInput` parameter (which still requires personal fields via
  `businessProfileFormSchema.extend(profileFormSchema)`, confirmed by reading `schemas.ts`
  directly) — this is a real, disclosed, currently-expected type/runtime gap, not an invented one:
  `spec.md`'s own User Story 2 Dependency note (lines 243-253) states plainly that a Tienda
  profile submission cannot complete against today's backend until `015` ships. At runtime,
  `submitProfile`'s `schema.parse(input)` call (`businessProfileFormSchema` for `isBusiness:
  true`) will genuinely reject the narrower payload (missing `nombre`/`apellidoPaterno`/etc.),
  throwing and routing to the documented `/profile` recovery branch — the exact, correct,
  currently-expected outcome Acceptance Scenario 3 describes. The cast does not hide a bug; it
  is the minimal way to express "this call is known to fail today, by design, until backend `015`
  relaxes the schema it validates against," and the double-cast (`as unknown as X`) idiom it uses
  is already an established pattern in this codebase (`ProfileForm.tsx`,
  `TiendaForm.tsx`/`UsuarioForm.tsx`'s own checkbox-literal casts, `Select.web.tsx`,
  `LoginScreenChrome.web.tsx`). **Honest and minimal, not a hidden type error.**
- **Run 5 nit fix** (`CrearCuentaScreen.tsx`/`.web.tsx`'s magic-number `fontSize: 22`/
  `fontWeight: "600"`) — a new `typography.heading.sm` sibling token was added, with a doc comment
  correctly explaining why no existing token fits (`display.lg` is `28`/`700` with the serif
  `PLAYFAIR_DISPLAY_BOLD` family) and why no new `contrast.test.ts` case is needed (the token
  carries no `color`; both call sites already source `color` from `colors.text.primary`
  directly, confirmed by reading both files). Both `.tsx` and `.web.tsx` now read
  `typography.heading.sm.fontSize`/`.fontWeight`. **Fixed correctly, matches the T002/T003
  precedent this feature already established.**
- **`src/domain/registration.ts`/`src/domain/profile.ts` stay functionally unchanged**: confirmed
  independently — see "Scope actually reviewed" above.

## Findings

**Finding 1 (nit, not blocking) — `getCurrentSessionEmail()`'s own "MUST NEVER THROW" contract
has zero direct unit test.** `src/lib/supabase-client.ts:112-130`. Every sibling function in the
same file that shares this exact contract (`signInWithPassword`, `requestPasswordReset`,
`createPasswordRecoverySession`) has its own dedicated `describe` block in
`src/lib/supabase-client.test.ts`, **including a rejection-path test that proves the `catch`
actually fires** (`signInWithPassword`'s own T034 regression case, added specifically because an
earlier version of this exact class of function let a rejection escape unhandled — found only via
manual iOS-simulator testing, per that test file's own comment). `getCurrentSessionEmail()` has no
equivalent — it is only ever exercised through a full `jest.mock("@/lib/supabase-client", () => ({
getCurrentSessionEmail: () => mockGetCurrentSessionEmail() }))` in `verify-phone.test.tsx`, so the
real implementation (the `supabase.auth.getSession()` call, the `data.session?.user.email ?? null`
mapping, and — most importantly, given this repo's own T034 history — the `try/catch` itself) is
never actually executed by any test in the suite. **Failure scenario this leaves unverified**: if
`supabase.auth.getSession()` rejects at the network level (the exact, already-proven-real failure
mode `useKycGate.ts`'s own T034 fix documents for the identical call), does
`getCurrentSessionEmail()` genuinely resolve to `null` as claimed, or could a future refactor
silently reintroduce an unhandled rejection here (the same class of regression this repo has hit
before) with nothing in the suite to catch it? Low severity in isolation (the implementation is a
two-line, structurally-identical copy of an already-proven pattern), but it is a real,
currently-zero-coverage gap in the one function this security-sensitive guard depends on to fail
closed — worth a `src/lib/supabase-client.test.ts` case (mirroring `signInWithPassword`'s own
resolve/reject cases) before this feature reaches Phase 5.

**Finding 2 (nit, not blocking) — `draftMatchesEmail()`'s own edge cases (case-insensitivity,
whitespace trimming) have no dedicated unit test.** `src/lib/registration-draft.ts:96-102`. The
function's real implementation is exercised for real (not mocked) by `verify-phone.test.tsx`'s
match/mismatch cases, which is good — but those two cases use byte-identical vs. completely
different email strings, never a same-email-different-casing or whitespace-padded pair, so the
doc comment's own specific claim ("Supabase normalizes stored email casing, so a byte-for-byte
comparison ... would produce false negatives on a legitimate match") is asserted in prose but not
regression-guarded by any test. Worth a direct case in `registration-draft.test.ts` alongside its
existing atomicity suite (mirroring that file's own established per-behavior test granularity).

Neither finding blocks T018/T019 — both are narrow, low-severity, currently-zero-coverage gaps on
otherwise sound, correctly-scoped, minimal implementations, in the same spirit as the two nits
carried from the prior round (both already fixed/superseded — the typography one fixed in this
same batch, the registration-failure-path one still open and equally appropriate to fix in the
same later pass as these two).

## Requirement traceability (Level 5, this batch)

| FR / Constitution | Test(s) | Status |
|---|---|---|
| FR-001 (one `Crear cuenta` screen reachable at `/register`) | `register.test.tsx` | Met |
| FR-008 (three-call flow unchanged; phone verification stays a visible, reachable step) | `register.test.tsx`, `verify-phone.test.tsx` | Met |
| FR-009 (profile-step values survive the interruption in memory only, submitted automatically) | `verify-phone.test.tsx`'s auto-submit-success case + atomicity assertion | Met |
| FR-010 (a failed automatic profile submission routes to `/profile`, draft genuinely cleared) | `verify-phone.test.tsx`'s failure case | Met |
| FR-006 (token-only visual language) | `typography.ts`'s new `heading.sm` + both `CrearCuentaScreen*.tsx` sourcing it | Met |
| Constitution III (registration-draft values never persisted/logged beyond the active attempt, and never leak cross-account) | `verify-phone.test.tsx`'s mismatch test (the leak path closed); `registration-draft.test.ts` (atomicity, updated fixtures) | Met for the closed leak path; **`getCurrentSessionEmail()`'s own fail-closed contract itself is unverified by a direct test — Finding 1** |

## `tasks.md` checklist status (this batch)

- [X] T018 — verified: `register.tsx` is thin glue over `CrearCuentaScreen`; the
  `setCurrentUserId`/`sessionIssue`/`retrySignIn` mechanism is faithfully preserved (moved, not
  reimplemented); the three test files this rewrite required (one named, two not) all still guard
  what they were built to guard.
- [X] T019 — verified: draft-present/absent/mismatch branches all correctly wired and tested; the
  `as unknown as BusinessProfileFormInput` cast is an honest, minimal, disclosed expression of a
  real, already-documented backend-`015` gap, not a hidden defect; the email-scoping guard closes
  a genuine, independently-confirmed cross-account PII leak with a minimal, well-tested, fail-closed
  implementation across the three touched previously-approved files.

## `CHECKPOINTS.md` C1–C6 walkthrough (this round)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists, current.
- [x] `./init.sh` exits 0 (`RESULT: SUCCESS (10/10 stages passed)`, pre-existing dependency WARNs
      excepted per `docs/verification.md`) — independently re-run.

**C2 — state coherent**
- [x] `010-registration-redesign` is the only `in_progress` feature.
- [x] Every `done` feature still has passing tests (full suite green, no regression: 85/598).
- [ ] N/A this round — `progress/current.md` session-scope is an orchestrator concern.

**C3 — architecture respected**
- [x] `src/lib/registration-draft.ts`/`src/lib/supabase-client.ts` have zero React/React Native
      logic leaking into `src/domain` (both stay under `src/lib`, matching the existing
      `signInWithPassword`/`currentUserId` precedent this feature explicitly mirrors).
- [x] `app/(auth)/register.tsx`/`verify-phone.tsx` call into `src/domain`/`src/lib` functions only
      (`consumeRegistrationDraft`, `draftMatchesEmail`, `getCurrentSessionEmail`, `submitProfile`)
      — no fetch/validation/business rule embedded in either route file.
- [x] No inline `Platform.OS` introduced by this batch (grepped: none in the touched files).
- [x] No direct Postgres/Redis/S3/Supabase-table access; the one new Supabase call
      (`getCurrentSessionEmail`) goes through the same `supabase.auth` SDK surface every other
      auth call in this file already uses.
- [x] No new global state library.
- [x] No stray `console.*` (grepped, only a comment match); no context-free `TODO`.

**C4 — verification real**
- [x] Every new/changed `src/lib` export with logic in this batch has *some* covering test, except
      **`getCurrentSessionEmail()`'s own implementation, which is fully mocked everywhere it's
      used and has zero direct test of its own** (Finding 1) — this is the one genuine gap in an
      otherwise-met checkpoint, not a blocking failure of the checkpoint as a whole.
- [x] New/changed screens (`register.tsx`/`verify-phone.tsx`, via their `.test.tsx` files) have
      real RNTL assertions on rendered output/behavior, not implementation details.
- [x] `./init.sh`'s three build-export stages all pass; native-dependency-alignment stage WARNs
      only on the same pre-existing five packages.

**C5 — session closed well** — N/A this round (mid-feature checkpoint).

**C6 — SDD**
- [x] `specs/010-registration-redesign/{spec.md,plan.md,tasks.md}` all exist, re-read fresh.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers.
- [ ] N/A — feature not yet `done` (T020 onward remain `[ ]`).
- [x] Every `FR-00x` this batch's tasks claim is referenced by at least one test's description or
      an adjacent comment (see traceability table above) — the one partial exception
      (`getCurrentSessionEmail`'s own fail-closed contract) is disclosed as Finding 1, not silently
      unmet.

## Verdict

**APPROVE WITH NITS**

T018 and T019 are correctly scoped, faithful to `spec.md`/`plan.md`, and independently
re-verified against the actual source and routing mechanics rather than the implementer's account.
The headline item — the claimed cross-account PII-leak chain — was traced independently against
`kyc-gate.ts`/`useKycGate.ts`/`app/_layout.tsx` (confirmed untouched by this feature) and against
`005-login`'s own already-recorded finding about the gate's `Redirect` re-fire mechanism, and is
**confirmed genuinely reachable**, not contrived. The guard that closes it
(`draftMatchesEmail`/`getCurrentSessionEmail`/the `email` scoping field) is minimal, correctly
fails closed on an unknown/null session email, does not widen access under uncertainty, is wired
at the one correct call site, discards (rather than re-queues) a mismatched draft, and is backed by
a real, non-vacuous regression test proving the leak path is actually closed — not merely asserted
in a comment. The scope expansion into three previously-approved files
(`registration-draft.ts`, `useCrearCuentaSubmit.ts`, `supabase-client.ts`) is justified, each edit
is small and disclosed, and the two tests those files' existing suites depend on were extended
additively, not weakened. The `as unknown as BusinessProfileFormInput` cast is an honest, minimal,
already-disclosed expression of a real, spec-documented backend-`015` gap, not a hidden type
error. The Run 5 nit (magic-number `sessionTitle` typography) is correctly fixed via a new
`typography.heading.sm` token. `src/domain/registration.ts`/`profile.ts` remain functionally
unchanged, confirmed independently. Type-check is clean, the full suite (85/598) passes, and
`./init.sh` reports the same clean baseline.

Two non-blocking nits recorded above: **Finding 1** — `getCurrentSessionEmail()`, the one function
this new security-adjacent guard depends on to fail closed, has zero direct unit test of its own
"MUST NEVER THROW" contract (only ever exercised through a full mock) — given this exact class of
defect (an unhandled rejection escaping a "never throw" wrapper) is this repo's own documented
T034 history, this is worth a dedicated `supabase-client.test.ts` case before Phase 5. **Finding
2** — `draftMatchesEmail()`'s case/whitespace-insensitivity claim is asserted in its doc comment
but not regression-guarded by any test exercising same-email-different-casing/whitespace pairs.
Neither blocks proceeding to T020; both are appropriately deferred to this feature's own later
polish pass, alongside the one still-open nit carried from the prior round (Run 5 review Finding
2, `useCrearCuentaSubmit`'s registration-failure catch-branch coverage gap).

---

# Review round 5 — T020–T022 (nationality wiring, `ProfileForm` restyle, `RegistrationForm`
deletion) + the three carried-over test gaps — 2026-08-06

Reviewed against `specs/010-registration-redesign/{spec.md,plan.md,tasks.md}`,
`docs/design-brief-registration-redesign.md`, `.specify/memory/constitution.md`,
`docs/conventions.md`, `docs/verification.md`, `CHECKPOINTS.md`, all re-read fresh from disk.
`progress/impl_010-registration-redesign.md`'s "Run 7 — T020–T022 + carried-over test gaps"
section treated as claims, verified independently below by reading the current source directly
(this branch has no intermediate commits, so there is no `git diff` to lean on for the
already-untracked files — every claim below was checked by reading the file on disk, not by
trusting the report or a diff).

## Scope actually reviewed

`git status --short` confirms the batch: `src/features/identity/ProfileForm.tsx` (tracked,
modified — `git diff HEAD` read in full), `RegistrationForm.tsx`/`RegistrationForm.test.tsx`
(deleted), plus untracked files whose mtimes cluster at 15:02–15:11 (this run) rather than
14:19–14:46 (prior rounds): `src/domain/i18n/copy/registration.ts`,
`src/features/identity/CrearCuentaScreen.tsx`/`.web.tsx`/`.test.tsx`,
`src/features/identity/UsuarioForm.test.tsx`, `src/lib/supabase-client.test.ts`,
`src/lib/registration-draft.test.ts`. `src/lib/supabase-client.ts` and
`src/lib/registration-draft.ts` themselves carry the *older* 14:46 mtime — confirming, not just
accepting on the report's word, that the two carried-over "MUST NEVER THROW"/case-insensitivity
gaps were closed by adding tests against the existing implementation, not by changing it.
`UsuarioForm.tsx`/`TiendaForm.tsx` also carry the older 14:19 mtime — confirmed untouched.

## Independent verification run

- `node_modules/.bin/tsc --noEmit` — clean, zero errors.
- `npx jest` — **84 suites / 611 tests, all green**, matching the implementer's reported numbers
  exactly (one pre-existing, unrelated `act()` warning from `UploadDropzone.tsx`/`Icon`, not
  touched by this feature).
- `./init.sh` (no `--skip-*` flags) — `RESULT: SUCCESS (10/10 stages passed)`. Stages 5/6 carry
  the exact same pre-existing, non-blocking WARN set documented in every prior round of this
  feature (`expo-image-picker@15.0.7`, `react-native@0.74.0`,
  `react-native-safe-area-context@4.10.1`, `@types/react@18.3.31`, `typescript@5.9.3`) — no new
  warning attributable to this batch.

## The three carried-over test gaps — verified as genuine fixes, not just new test files

**1. `getCurrentSessionEmail()`'s "MUST NEVER THROW" contract.** Read `src/lib/supabase-client.ts`
directly — the function itself is byte-for-byte unchanged (older mtime confirms this). Read the
new `describe("getCurrentSessionEmail", ...)` block in `supabase-client.test.ts` in full: it
imports the real `getCurrentSessionEmail` (not a mock of the module under test), mocks only the
SDK boundary (a dedicated `mockGetSession` wired onto the *same* shared singleton auth object
`mockSignInWithPassword`/`mockResetPasswordForEmail` already use, confirmed by reading the shared
`jest.mock("@supabase/supabase-js", ...)` factory at the top of the file — not the throwaway
recovery client), and has three cases mirroring `signInWithPassword`'s own T034 shape exactly:
resolves-with-session → returns the email; resolves-with-no-session → returns `null`; **the
regression case** — `mockGetSession.mockRejectedValue(new TypeError("Network request failed"))`,
asserting `await expect(getCurrentSessionEmail()).resolves.toBeNull()`. This genuinely executes
the real `try { await supabase.auth.getSession() } catch { return null }` and proves the `catch`
fires on a rejection, the same shape and the same class of regression `signInWithPassword`'s own
T034 case already proved for the sibling function. **Genuinely closed, not merely a new test file
around a still-fully-mocked function** — `verify-phone.test.tsx` still mocks
`getCurrentSessionEmail` at the module boundary for its own, unrelated purpose (testing the
draft-consumption wiring, not this function's own contract), which is correct and does not
conflict with this new, real, unit-level coverage.

**2. `draftMatchesEmail()`'s case-insensitivity/whitespace-trimming.** Read
`src/lib/registration-draft.ts:96-101` directly — unchanged
(`draft.email.trim().toLowerCase() === email.trim().toLowerCase()`). The new
`describe("draftMatchesEmail (FR-009, carried-over review Finding 2)", ...)` block in
`registration-draft.test.ts` calls the real, unmocked function with six cases: byte-identical
match, complete mismatch (both already existed, kept for baseline), **same email with different
casing** (`"ANA@EXAMPLE.COM"` and `"Ana@Example.Com"` against a draft written as
`"ana@example.com"`, both asserted `true`), **same email with surrounding whitespace**
(`"  ana@example.com  "`, asserted `true`), a **combined** casing+whitespace case, and the
fail-closed `null`/`undefined` cases. These are genuinely new comparisons, not a restatement of
the pre-existing identical-vs-different pair — they specifically exercise the `.trim()` and
`.toLowerCase()` calls the doc comment claims exist for. **Genuinely closed.**

**3. `useCrearCuentaSubmit`'s registration-failure path.** Read `useCrearCuentaSubmit.ts`
directly to confirm `handleUsuarioSubmit`/`handleTiendaSubmit` share an identical
`try {...} catch (error) { setServerError(mapRegistrationError(error)); } finally {...}`
structure (same variable names, same call shape, differing only in which
`submitPersonalRegistration`/`submitBusinessRegistration` and which draft-object shape is built)
— so exercising the shared catch branch through either tab is equivalent coverage of the actual
wiring being tested, the same reasoning this feature's own reviews have already accepted for the
success-path test (Tienda-only composed-level coverage standing in for Usuario, since
`register.test.tsx`/`CrearCuentaScreen.test.tsx` don't wire `useNationalities()` at that level for
Usuario's own submit path). The new case in `CrearCuentaScreen.test.tsx`
(`mockSubmitBusinessRegistration.mockRejectedValue(new ApiError(409, "UsernameTaken", ...))`)
asserts the mapped message reaches the rendered form (`findByText("That username is already
taken")`), `mockReplace` is never called, `mockSetCurrentUserId` is never called, and
`consumeRegistrationDraft()` resolves `undefined` (no draft written) — this is exactly the
end-to-end wiring the prior review's Finding 2 said was missing (`mapRegistrationError`'s own
unit test and the forms' `serverError`-prop tests each individually could not prove this). **Judged
against what the prior finding actually asked for: genuinely covers it.**

## T020 — nationality wiring, verified as a primary path, not an afterthought

- **Reachable today, not theoretical.** `useNationalities()` is called unconditionally in both
  `CrearCuentaScreen.tsx`/`.web.tsx` (read directly, lines 38/53 and 29/44) — its `loading`/`error`
  state is live from the first render of the Usuario tab, exactly the state spec.md's Edge Cases
  says is "genuinely reachable today, since backend `015` hasn't shipped."
- **Spanish copy routed through `Select`'s copy-override props, not English defaults leaking
  through.** Read `UsuarioForm.tsx:330-345` directly: every one of `Select`'s five copy props
  (`retryLabel`, `searchPlaceholder`, `loadingLabel`, `filterAccessibilityLabel`,
  `closeAccessibilityLabel`) is supplied via `t("selectRetryLabel")` etc., sourced from
  `registrationCopy` — none left at `Select.tsx`'s own hardcoded English default. Cross-checked
  `src/domain/i18n/copy/registration.ts` directly: `selectRetryLabel: "Reintentar"`,
  `selectSearchPlaceholder: "Buscar…"`, `selectLoadingLabel: "Cargando…"`,
  `selectFilterAccessibilityLabel: "Filtrar opciones"`, `selectCloseAccessibilityLabel: "Cerrar"`
  in `es`, with genuine English parity in `en`. The catalog-load error itself is separately
  re-localized at the `CrearCuentaScreen` boundary (`t("nationalityLoadError")`, "No pudimos cargar
  el catálogo de nacionalidades.") rather than left as `useNationalities()`'s own deliberately
  un-localized `NATIONALITIES_LOAD_ERROR_MESSAGE` fallback — confirmed by reading
  `useNationalities.ts`'s own doc comment, which explicitly defers localization to its caller.
  `CrearCuentaScreen.test.tsx`'s dedicated case asserts the Spanish string renders AND the English
  fallback string is absent (`queryByText("We couldn't load the list of nationalities.")` is
  `null`) — a real, falsifiable check that this isn't accidentally left un-localized.
- **Retry actually wired to `refetch`, not a no-op.** `useNationalities.ts`'s `onRetry: () => { void
  query.refetch(); }` (unchanged, older mtime), and `CrearCuentaScreen.test.tsx`'s error-state case
  presses the rendered retry control and asserts the real `onRetry` mock — the one
  `useNationalities()` itself returned — was called exactly once. This proves the wiring reaches
  through `CrearCuentaScreen` → `UsuarioForm` → `Select`'s retry button and back, not merely that a
  prop was passed.
- **No hardcoded fallback nationality list at any layer.** Grepped the whole
  batch (`grep -rn "Mexicana\|Canadiense\|Estadounidense\|nationalityOptions\s*=\s*\["` across
  `src/`, excluding test files) — the only matches are `UsuarioForm.tsx`'s `nationalityOptions =
  []` default (empty, not a fallback list) and the `nationalityPlaceholder: "Mexicana"` copy string
  (a placeholder hint, not a selectable option). No static list exists anywhere in the chain.
- **The `useNationalities` seam lands at the `CrearCuentaScreen`/`UsuarioForm` boundary, not pushed
  down inside `UsuarioForm`.** Confirmed by grep: `UsuarioForm.tsx` contains zero references to
  `useNationalities` other than in comments explicitly disclaiming it ("this component does NOT
  call `useNationalities()`"); the hook is called exactly twice in the whole batch, once in each of
  `CrearCuentaScreen.tsx`/`.web.tsx`, matching the design this feature's plan.md and prior review
  rounds already committed to.
- **The `Registrarse` submit button is not gated on the nationality catalog's state.** Read
  `UsuarioForm.tsx`'s `PrimaryButton` wiring directly — `busy`/disabled state derives only from
  `isSubmitting`, never from `nationalityLoading`/`nationalityError`. Matches spec.md's Edge Case
  ("`Registrarse` is not blocked from being pressed for reasons unrelated to nationality").
- **`CrearCuentaScreen.test.tsx`'s mock defaults keep every pre-existing Tienda-focused test
  deterministic.** `beforeEach` sets `mockUseNationalities.mockReturnValue({ options: [], loading:
  false, error: undefined, onRetry: jest.fn() })` before every test in the shared
  `describeCrearCuentaScreen` block, confirmed by reading the file — none of those pre-existing
  tests became flaky or dependent on the new mock's default shape by accident.

Task text's own wording (`isLoading`/`refetch`) is stale relative to the real, already-reviewed
`Select.types.ts`/`useNationalities.ts` field names (`loading`/`onRetry`) — already flagged and
accepted as correct in Review round 2 (T011); the actual wiring here correctly uses the real
names, not the plan's stale prose.

## T021 — `ProfileForm.tsx` restyle, checked for scope creep

- Read `git diff HEAD -- src/features/identity/ProfileForm.tsx` in full. Confirmed: same fields
  (nombre/apellidoPaterno/apellidoMaterno/birthDate/nationality/curp/rfc plus the
  `isBusiness`-conditional commercialName/fiscalAddress block), same
  `profileFormSchema`/`businessProfileFormSchema` resolver (still imported and used exactly as
  before, no schema swap), same `ProfileFormProps` shape, no new/removed field, no new prop. Every
  rendered string (`"Nombre"`, `"Complete your profile"`, `"Save profile"`/`"Saving…"`, every
  `accessibilityLabel`/`testID`) is byte-for-byte unchanged in the diff — only `labelCase`,
  `placeholderTextColor`, style-block values, and the `Pressable`→`PrimaryButton` submit swap
  changed.
- **Confirmed it did NOT narrow the business block to `TiendaForm`'s shorter field set** — the
  `isBusiness ? <>...commercialName/fiscalAddress...</> : null` block and the
  `businessProfileFormSchema` resolver selection are both untouched in the diff. Cross-checked
  against `plan.md`'s Research Decision 8 (read fresh): "today's real backend `profileBusinessSchema`
  genuinely still requires those personal fields... `/profile`'s current shape is the one that
  actually succeeds against the backend as it exists right now" — matches exactly. T026 (the task
  that will eventually add a dated comment flagging this for backend `015`'s follow-up) is
  correctly still `[ ]` in `tasks.md`, and the specific comment T026 asks for (at the top of the
  `isBusiness`-conditional block itself) is correctly *not yet* present — this batch did not
  prematurely claim T026's own work.
- **Raw literals**: `grep -n "#[0-9a-fA-F]\{3,6\}"` on the file — zero matches, confirming the hex
  removal claim. A few pre-existing magic numbers remain (`generalError`'s `fontSize: 14`,
  `error`'s `fontSize: 13`, `checkbox`'s `width: 24`/`height: 24`/`borderWidth: 1`,
  `checkboxRow`'s `minHeight: 44`) — read the diff to confirm every one of these values was already
  present, unchanged, before this restyle (only their *colors* were tokenized, e.g.
  `color: "#dc2626"` → `color: colors.text.danger`). Since FR-006 bars *new* raw
  hex/magic-number literals and these are pre-existing, untouched values on a pre-existing file
  (unlike Review round 3's Finding 1, where the flagged magic numbers were in a file this feature
  newly introduced), this is not a new FR-006 violation — a defensible, consistent application of
  the same "newly introduced vs. pre-existing" distinction that finding itself established.
- **Test-file check**: `git diff HEAD -- src/features/identity/ProfileForm.test.tsx` is genuinely
  empty — confirmed directly, not taken on the report's word. `grep -n "style\|StyleSheet"` on the
  test file returns only prose-comment matches, confirming there was truly nothing to update per
  the task's own conditional instruction, and that every one of its 11 existing behavioral
  assertions (`getByLabelText`, `getByRole`, server-error-to-field mapping, the business-block
  conditional render) is unchanged and still passing in the full suite run above.

## T022 — `RegistrationForm.tsx`/`.test.tsx` deletion

- Confirmed both files are deleted (`git status` shows `D`), and `grep -rn "from [\"'].*RegistrationForm[\"']\|import.*RegistrationForm"` across `src/`/`app/` returns zero matches — no
  broken import anywhere. `tsc --noEmit` and the full suite (both re-run above) confirm this
  independently — a broken import would have surfaced as a compile error, not just a missing grep
  hit.
- **The five-plus comments still naming `RegistrationForm.tsx` as though it exists.** Grepped the
  whole repo for `RegistrationForm` (not narrowed to the three files named in the brief) and found
  a substantially larger set than five — comments in `SegmentedControl.tsx`,
  `SegmentedControl.test.tsx` (×2), `SignInForm.tsx` (×3), `FormField.tsx`, `FormField.test.tsx`,
  `CodeInput.tsx`, `CodeInput.test.tsx`, `TutorialScreen.tsx`, `ResetPasswordForm.tsx`,
  `VerifyPhoneScreen.tsx` (×3), `ProfileForm.tsx` (×4), `UsuarioForm.tsx`/`.test.tsx`,
  `FoundCardPanel.tsx`, `typography.ts`, `LoginScreen.tsx`, and `app/(auth)/register.tsx` all cite
  `RegistrationForm.tsx` by name as an established-pattern precedent, most predating this batch
  (only `UsuarioForm.tsx`/`ProfileForm.tsx` were touched by this feature at all, and their own
  `RegistrationForm.tsx` references were written in earlier, already-approved rounds, not this
  one). Read each of the three files the brief specifically named
  (`SegmentedControl.tsx`/`.test.tsx`, `SignInForm.tsx`) in full: in every case, the comment
  supplies its own complete, self-contained "why" inline (e.g. `SegmentedControl.tsx`'s full
  explanation of the `aria-checked`-as-top-level-prop mechanism is written out in the same comment
  block, not deferred entirely to the cited file) and cites `RegistrationForm.tsx` as
  *additional*, now-stale attribution/precedent, not as the reader's only source for
  understanding the current code. `docs/conventions.md`'s "Comments: default to none, only write
  one when it captures a non-obvious *why*" doesn't speak directly to this case (citing a sibling
  file by name as precedent, where that file is later deleted), and this exact pattern — citing a
  historical task ID/file (`001-registration-kyc T024`, `T031`, `T033`, etc.) as precedent — is
  pervasive and already established throughout this codebase, well before this feature. Judged on
  balance: **not a blocking defect** — a reader can fully understand each citing file's own
  behavior without opening the reference (verified above), and rewriting a repo-wide pattern this
  large is out of proportion to a three-task batch whose own instructions (`tasks.md` T022) only
  asked for an import grep, not a comment audit. It is, however, a genuine and now-slightly-worse
  piece of doc rot (a reader curious enough to actually open `RegistrationForm.tsx` for the fuller
  context these comments gesture at will hit a 404) — worth a lightweight pass in this feature's
  own T027 (Polish/accessibility pass) or a follow-up note, not a re-request of this batch.

## Requirement traceability (Level 5, this batch)

| FR / Constitution | Test(s) | Status |
|---|---|---|
| FR-006 (token-only visual language) | `ProfileForm.tsx`'s restyle (zero raw hex, `grep`-confirmed); no new `contrast.test.ts` case needed (colors reused, already covered) | Met |
| FR-007 (all copy via `src/domain/i18n`, Spanish default, English parity) | `registration.test.ts`'s key-parity/orthography suite (unchanged, still covers the new `nationalityLoadError` key via the parity assertion); `CrearCuentaScreen.test.tsx`'s localized-error case | Met |
| FR-012 (nationality picker, backend-served, no hardcoded fallback, keyboard-operable) | `CrearCuentaScreen.test.tsx`'s 4-case × 2-platform Nacionalidad wiring block; `UsuarioForm.test.tsx`'s new loading-state case | Met for the buildable/testable half; real-network half correctly stays `[BLOCKED-ON-015]` |
| Constitution III (`getCurrentSessionEmail()` fails closed for real, not just under a mock; `draftMatchesEmail()`'s comparison genuinely case/whitespace-insensitive) | `supabase-client.test.ts`'s new `getCurrentSessionEmail` describe block (rejection case genuinely exercises the real `try/catch`); `registration-draft.test.ts`'s new `draftMatchesEmail` describe block (six real, non-mocked comparisons) | Met — both carried-over gaps genuinely closed, not merely wrapped in a new test file |
| (Coverage-completeness, Review round 3 Finding 2) `useCrearCuentaSubmit`'s registration-failure catch branch | `CrearCuentaScreen.test.tsx`'s new rejection case (mapped error reaches the form, no navigation, no `setCurrentUserId`, no draft written) | Met |

## `tasks.md` checklist status (this batch)

- [X] T020 — verified: `useNationalities()` called at the `CrearCuentaScreen`/`UsuarioForm`
  boundary (not pushed into `UsuarioForm`), Spanish copy genuinely routed through `Select`'s
  copy-override props on every slot, retry genuinely re-invokes the real `refetch`-backed
  `onRetry`, zero hardcoded fallback list anywhere in the chain, submit button not gated on the
  catalog's state.
- [X] T021 — verified: same fields/resolver/props, no structural change, business block correctly
  NOT narrowed (matches plan.md Research Decision 8 and the still-open T026), zero raw hex,
  `ProfileForm.test.tsx` genuinely untouched (nothing to update), all 11 existing tests pass
  unchanged.
- [X] T022 — verified: both files deleted, zero remaining imports (grep + clean `tsc`/full suite
  confirm this independently), the surviving comment references are non-blocking doc rot (see
  above), not a functional defect.

## `CHECKPOINTS.md` C1–C6 walkthrough (this round)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists, current.
- [x] `./init.sh` exits 0 (`RESULT: SUCCESS (10/10 stages passed)`, pre-existing dependency WARNs
      excepted per `docs/verification.md`) — independently re-run.

**C2 — state coherent**
- [x] `010-registration-redesign` is the only `in_progress` feature (`feature_list.json`).
- [x] Every `done` feature still has passing tests (full suite green, no regression: 84/611).
- [ ] N/A this round — `progress/current.md` session-scope is an orchestrator concern, not
      re-checked here.

**C3 — architecture respected**
- [x] No `src/domain`/`src/lib` file touched in this batch gained a React/React Native import
      (`registration.ts`'s copy dictionary, `supabase-client.ts`/`registration-draft.ts`
      unchanged, confirmed by mtime and by reading the files).
- [x] `CrearCuentaScreen.tsx`/`.web.tsx` call into `useNationalities()`/`useCrearCuentaSubmit()`
      rather than embedding a fetch or validation rule directly; `UsuarioForm`/`ProfileForm`
      remain render-only, taking every piece of catalog/loading/error state as props.
- [x] No inline `Platform.OS` introduced by this batch (grepped: none in the touched files;
      `CrearCuentaScreen.tsx`/`.web.tsx` remain the platform split).
- [x] No direct Postgres/Redis/S3/Supabase-table access; the new test coverage exercises the same
      `supabase.auth`/`ApiClient` seams every other call in this feature already uses.
- [x] No new global state library.
- [x] No stray `console.*` (grepped: zero matches across this batch's changed files); no
      context-free `TODO`.

**C4 — verification real**
- [x] Every `src/lib` export this batch's tests newly cover (`getCurrentSessionEmail`,
      `draftMatchesEmail`) is exercised for real, against the actual implementation, not a mock of
      the function under test — independently confirmed above, not merely accepted on the report.
- [x] New/changed screens (`CrearCuentaScreen`/`.web`, `ProfileForm`) have real RNTL assertions on
      rendered output/behavior (localized text present/absent, retry re-invoking the real handler,
      disabled/busy accessibility state), not implementation details.
- [x] `./init.sh`'s three build-export stages all pass; native-dependency-alignment stage WARNs
      only on the same pre-existing five packages.

**C5 — session closed well** — N/A this round (mid-feature checkpoint, not a session close;
orchestrator's responsibility, consistent with every prior round of this feature).

**C6 — SDD**
- [x] `specs/010-registration-redesign/{spec.md,plan.md,tasks.md}` all exist, re-read fresh.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers.
- [ ] N/A — feature not yet `done` (T023 onward remain `[ ]`).
- [x] Every `FR-00x` this batch's tasks claim is referenced by at least one test's description or
      an adjacent comment (see traceability table above) — no untagged claim found.

## Findings

**Finding 1 (nit, not blocking) — a large, pre-existing set of code comments across the repo
still name the now-deleted `RegistrationForm.tsx` as though it can be opened for the fuller
explanation they gesture at.** Not introduced by this batch (only `UsuarioForm.tsx`/
`ProfileForm.tsx`'s references were touched by this feature at all, and even those were written in
earlier, already-approved rounds), and every citing comment this review read in full supplies its
own complete inline "why" rather than depending on the reader actually opening the deleted file —
so this is not a functional or comprehension defect today, just doc rot that will read slightly
oddly to a future reader who goes looking. Worth a lightweight sweep (rewording "RegistrationForm.tsx's
account-type toggle already established" → something like "the account-type toggle
`RegistrationForm.tsx` established before its `010` removal" or similar) during this feature's own
T027 Polish pass rather than blocking this batch.

No other findings. All three carried-over test-coverage gaps from Review rounds 3/4 are genuinely
closed against the real implementations, not merely wrapped in new test files pointed at mocks;
T020's nationality-catalog error/loading state is confirmed reachable today and fully localized
end to end with a working retry and zero hardcoded fallback list at any layer, with the
`useNationalities` seam correctly landing at the `CrearCuentaScreen`/`UsuarioForm` boundary; T021's
`ProfileForm.tsx` restyle is confirmed behavior-preserving with the business block deliberately
left un-narrowed per plan.md Research Decision 8; T022's deletion leaves zero broken imports.

## Verdict

**APPROVE WITH NITS**

T020–T022 are correctly scoped, faithful to `spec.md`/`plan.md`/the design brief, and independently
re-verified against the actual source (not the implementer's account) — including by reading files'
mtimes to distinguish "new test added around an existing implementation" from "implementation
changed," which confirmed all three carried-over gaps were closed the honest way. Type-check is
clean, the full suite (84/611) passes, and `./init.sh` reports the same clean baseline. This
completes User Story 1's implementation; only T023 (manual smoke check), User Story 2 (T024–T026),
and Polish (T027–T030) remain. One non-blocking nit recorded above (stale `RegistrationForm.tsx`
comment references across the repo, pre-dating this batch) — appropriate for T027, not a reason to
send this batch back.

---

# Review round 6 — T024, T026, T027 + the three device-defect fixes (Run 11) — 2026-08-06

Scope: T024 (explicit business-draft coverage in `verify-phone.test.tsx`), T026 (comment-only
follow-up in `ProfileForm.tsx`), T027 (accessibility pass — the Space-key react-native-web gap),
and the three defect fixes made afterward (native `CrearCuentaScreen` safe-area insets, native
`DateField.tsx`'s modal-sheet redesign, `DateField.web.tsx`'s focus ring). Read fresh from disk:
`specs/010-registration-redesign/{spec.md,plan.md,tasks.md}`,
`docs/design-brief-registration-redesign.md`, `.specify/memory/constitution.md`,
`docs/conventions.md`, `docs/verification.md`, `CHECKPOINTS.md`. `progress/impl_010-registration-
redesign.md`'s "Run 9"/"Run 10"/"Run 11" sections and `progress/current.md`'s T023/T025/T028/T029
sections treated as claims, verified independently below by reading current source, not trusted.

## Scope actually reviewed

`git status --short` (working tree, still zero commits on this branch): T024/T026/T027/Run-11
touch `app/(auth)/verify-phone.test.tsx`, `src/features/identity/ProfileForm.tsx`, the new
`src/features/ui/webKeyActivation.{ts,test.ts}`, `SegmentedControl.tsx`, `Select.web.tsx`,
`UsuarioForm.tsx`/`.test.tsx`, `TiendaForm.tsx`/`.test.tsx`, `ProfileForm.test.tsx`,
`CrearCuentaScreen.tsx`/`.test.tsx`, `DateField.tsx`/`.types.ts`/`.test.tsx`,
`DateField.web.tsx`/`.web.test.tsx`, `src/domain/i18n/copy/registration.ts`, and (safe-area mock
only) `app/(auth)/register.test.tsx`, `register.session-wiring.test.tsx`,
`register.session-failure.test.tsx`. T001–T023 files spot-checked for disturbance: no unexpected
diffs beyond what each run's own account describes.

## Independent verification run

- `node_modules/.bin/tsc --noEmit` — **clean, zero errors.**
- `npx jest --silent` — **85 suites / 630 tests, all green** — matches the implementer's claimed
  final count exactly, independently reproduced, not accepted on the report.
- `./init.sh` (no `--skip-*` flags) — `RESULT: SUCCESS (10/10 stages passed)`. Stage 5
  (expo-doctor) and Stage 6 (native dependency alignment) show the exact same five pre-existing
  packages every prior round of this feature has recorded (`expo-image-picker@15.0.7`,
  `react-native@0.74.0`, `react-native-safe-area-context@4.10.1`, `@types/react@18.3.31`,
  `typescript@5.9.3`) — no new warning. Stage 8 (web/iOS/Android bundle export) all green.
- Grepped every file this round touched for `console.*`/context-free `TODO` — zero matches (two
  comment-only mentions of "no `console.*` anywhere in this file" in `ProfileForm.tsx`/
  `UsuarioForm.tsx`, not actual calls).

## T024 — explicit business-draft path in `verify-phone.test.tsx`

Read `app/(auth)/verify-phone.test.tsx` in full. The new test
(`"auto-submits a present, confirmed business draft with isBusiness: true and a
tiendaProfileFormSchema-shaped payload"`) is a direct, non-incidental assertion: it asserts
`mockSubmitProfile` is called with the exact `{ commercialName, rfc, fiscalAddress, tosAccepted:
true, privacyAccepted: true }` payload and `{ isBusiness: true }` as the options argument — cross-
checked against `verify-phone.tsx`'s real `completeProfileFromDraft` business branch
(`await submitProfile(api, profile as unknown as BusinessProfileFormInput, { isBusiness: true })`,
line 68) and against `tiendaProfileFormSchema`'s actual field set in `src/domain/schemas.ts` — the
two match exactly, field-for-field. Four explicit `not.toHaveProperty("nombre"/"birthDate"/
"nationality"/"curp")` assertions on the real call argument directly encode FR-003's "no
personal-account field... at any point in the flow," at the payload level rather than only the
form-render level `TiendaForm.test.tsx` already covers. Draft atomicity is re-asserted (a second
`consumeRegistrationDraft()` call returns `undefined`), mirroring the personal-draft test's own
pattern. **Verified correct — this is a real, direct assertion, not incidental coverage riding on
the generic `kind === "personal"` branch test.**

## T026 — comment-only follow-up in `ProfileForm.tsx`

Read the diff region directly (`ProfileForm.tsx:317–328`): the entire addition is a JSX comment
block (`{/* ... */}`) immediately above the pre-existing `{isBusiness ? (` conditional — zero
non-comment lines touched, confirmed by reading the surrounding code (the resolver selection at
line 123, the `DEFAULT_VALUES` block, the conditional's own JSX) byte-for-byte unchanged from
Review round 5's already-approved T021 restyle. Content accuracy checked against `plan.md`
Research Decision 8 (re-read fresh): the comment states this block still validates against
`businessProfileFormSchema` (still requiring personal fields `TiendaForm.tsx` never collects), that
it should switch to `tiendaProfileFormSchema` once backend `015` User Story 2 ships, and that it is
deliberately left as-is today because narrowing it now would break the recovery screen for exactly
the Tienda users it exists to help — this is a verbatim-consistent restatement of Research Decision
8's own reasoning, not an invented rationale. **Verified correct — genuinely comment-only, content
accurate.**

## T027 — the react-native-web Space-key finding, independently verified against source

**Read `node_modules/react-native-web/dist/cjs/modules/usePressEvents/PressResponder.js` directly**
(not taken on the implementer's word): `isButtonRole = element => getElementRole(element) ===
'button'`; `isValidKeyPress = event => { ...; var isButtonish = getElementType(target) === 'button'
|| isButtonRole(target); return key === 'Enter' || isSpacebar && isButtonish; }` — confirms the
claim exactly: **Enter is unconditionally valid regardless of role; Space is valid only when the
DOM role is literally `"button"`.** Also read `AccessibilityUtil/propsToAriaRole.js` to confirm
`accessibilityRole` genuinely maps to the DOM `role` attribute in this pinned version (it does, via
`accessibilityRoleToWebRole`), which is the mechanism the whole finding depends on. Every
`role="checkbox"`/`"radio"`/`"combobox"` element this feature introduced (`SegmentedControl`'s
segments, `Select.web.tsx`'s trigger, the six consent checkboxes across `UsuarioForm`/`TiendaForm`/
`ProfileForm`) is therefore genuinely Space-dead before this fix — a real, reproducible-in-browser
defect, not a theoretical one.

**Fix genuinely restores Space activation.** `src/features/ui/webKeyActivation.ts`'s
`spaceKeyActivation(activate, disabled?)` handles only Space (`" "`/`"Spacebar"`), calls
`preventDefault()`, and deliberately does not also handle Enter (react-native-web already fires
`onPress` for Enter regardless of role — handling it here too would double-activate; confirmed
correct against the same source read above). Applied via `{...spaceKeyActivation(...)}` spread at
every affected control: `SegmentedControl.tsx`'s radio Pressables, `Select.web.tsx`'s combobox
trigger, and all six consent checkboxes (`UsuarioForm.tsx` ×2, `TiendaForm.tsx` ×2,
`ProfileForm.tsx` ×2) — grepped directly, confirmed above. `Select.tsx` (native), `DateField.tsx`
(native), and `PrimaryButton.tsx` all correctly need no fix — each is `accessibilityRole="button"`,
confirmed by grep, which `isButtonRole` already covers.

**Real regression coverage, not just wiring.** `webKeyActivation.test.ts` (5 pure-function cases,
Level 1) plus real `fireEvent(..., "keyDown", { key: " " })` regression tests added to
`SegmentedControl.test.tsx`, `Select.web.test.tsx` (2 cases, including "does not open on Space
while disabled by a catalog error" — the exact reachable-today state the orchestrator flagged),
`UsuarioForm.test.tsx`, `TiendaForm.test.tsx`, and `ProfileForm.test.tsx` — each asserts the actual
post-Space `accessibilityState.checked`/open-panel state changed, not merely that a prop was
passed. Ran a subset directly to confirm they exercise the real fix, not a tautology: reverting
`webKeyActivation.ts`'s `if (key === " " || key === "Spacebar")` condition to always-false would
fail every one of these new tests (traced by inspection, consistent with the assertions reading
real post-event state).

**`DateField.web.tsx`'s `outline: "none"` reported-not-fixed in T027, genuinely fixed in Run 11** —
see below.

No blocking finding in T024/T026/T027.

## Run 11 — the three defect fixes

### 1. Native `CrearCuentaScreen` safe-area insets — mocking approach, checked as requested

Read `CrearCuentaScreen.tsx` directly: `useSafeAreaInsets()` is called unconditionally and its
`top`/`left`/`right` insets are added to `space.xxl` on both the normal-flow `ScrollView`'s
`contentContainerStyle` and the `sessionIssue` recovery view's — matches `ShellHeader.tsx`'s
established precedent (grepped, same `16-base + insets` shape). `CrearCuentaScreen.web.tsx` does
not import the hook at all (confirmed by grep) — correctly a no-op change there.

**How the five affected suites resolved the new dependency — a mock, not a provider, applied
consistently, with zero assertion weakened:**
- `CrearCuentaScreen.test.tsx`: `jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn() }))`, a controllable `jest.fn()` — every pre-existing `beforeEach`
  (both the main `describeCrearCuentaScreen` shared block, used for both the native and web
  variant, and the "Nacionalidad wiring (T020)" block) sets it to `{ top: 0, bottom: 0, left: 0,
  right: 0 }` before every test, so every pre-existing assertion runs against the same zero-inset
  baseline it always implicitly had (an omitted/undefined hook would have thrown, not silently
  defaulted to zero — the mock is required, not decorative). A new, dedicated `describe` block adds
  three real, non-mocked-away assertions: `paddingTop`/`paddingLeft`/`paddingRight` reflect a
  mocked *non-zero* inset via `StyleSheet.flatten` on the actual rendered `ScrollView`'s
  `contentContainerStyle` (both the main content and, separately, the `sessionIssue` view, reached
  by actually driving a Tienda submission to that error state) and a zero-inset fallback case. This
  is a real, falsifiable proof that the hook is wired into the rendered style computation, honestly
  scoped by both the implementer's account and this file's own comment as NOT proof of on-device
  visual clearance (that's what the orchestrator's own iPhone 17 Pro re-pass confirmed, per
  `progress/current.md`'s T029 section, screenshots not re-viewed by this review but the
  distinction between structural-proxy and device-proof is stated honestly rather than implied).
- `register.test.tsx`/`register.session-wiring.test.tsx`/`register.session-failure.test.tsx`: each
  adds the identical inline mock `jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }))` — a fixed return, since
  these three files have no need to vary insets (they test registration/session wiring, not
  padding). Read `register.test.tsx`'s full diff directly: the large line-count change (204 lines)
  is overwhelmingly the file's own already-approved T018 rewrite (Tienda-tab fill helper replacing
  the old flat-form helper, carried from an earlier round) — the safe-area-specific addition is
  exactly the 6-line mock block, and every pre-existing assertion this file's T033/T034-adjacent
  tests make is untouched in substance: `expect(mockSetCurrentUserId).toHaveBeenCalledWith(...)`,
  `expect(mockSubmitBusinessRegistration).toHaveBeenCalledWith(...)`, the retry-sign-in-once
  assertion, the session-issue message/retry-button assertions — all present, unweakened, just
  updated to the Tienda-tab fixture values an earlier, already-reviewed round introduced.
  `register.session-wiring.test.tsx`'s **T033 regression guard** (the real, unmocked
  `src/lib/api.ts`/`setCurrentUserId` integration proving the `X-User-Id` header survives into the
  next authenticated call) is untouched in substance — same assertion
  (`expect(mockFetch).toHaveBeenCalledWith(..., headers: expect.objectContaining({ "X-User-Id":
  BACKEND_USER_ID }) )`), same real (non-safe-area-mocked) `api`/`setCurrentUserId` imports, only
  the new safe-area mock added since this file also renders `RegisterScreen` → `CrearCuentaScreen`.
  `register.session-failure.test.tsx`'s **T034 regression guard** (real, unmocked
  `@supabase/supabase-js` rejection → `crear-cuenta-session-issue` renders, not the generic
  registration-error path) is likewise untouched in substance —
  `expect(await findByTestId("crear-cuenta-session-issue")).toBeTruthy()`,
  `expect(queryByTestId("tienda-form-error")).toBeNull()`, `expect(mockReplace).not.toHaveBeenCalled()`
  all present, unchanged.
- `UsuarioForm.test.tsx` does **not** call/mock `useSafeAreaInsets` at all (grepped, zero matches)
  — `UsuarioForm.tsx` itself never imports the hook. Its ripple this round is a *different* one
  (Defect 2's `DateField` confirm-button interaction — see below), not the safe-area fix; the task
  brief's framing of "five suites" bundles both ripples from the same three-defect batch, but the
  safe-area-specific ripple is genuinely four files, not five, and every one of those four uses a
  mock (never a `<SafeAreaProvider>`), applied consistently with `ShellHeader.test.tsx`'s own
  established precedent, not invented ad hoc.

**Verdict on point 1**: the mock was wired cleanly and consistently, mirroring an existing
in-repo pattern; no assertion was weakened or deleted to make any of the four affected suites
pass; T033 and T034's regression guards still guard exactly what they were written to guard.

### 2. Native `DateField.tsx`'s modal-sheet redesign — contract check

Read `DateField.tsx` in full. `confirmSelection()` calls `onChange(draft)` where `draft` is a
`useState<Date>` — still a real `Date` object, confirmed via `DateField.test.tsx`'s
`expect(emitted).toBeInstanceOf(Date)` / `expect(emitted.getTime()).toBe(selected.getTime())`
assertions on the actual `onChange` mock's captured argument. Cross-checked against
`src/domain/schemas.ts:124`, `birthDate: z.coerce.date({...})` — byte-for-byte unchanged (grepped
directly) — the emission contract is intact.

**Dismissing without choosing behaves sanely.** `closePicker()` is a plain `setOpen(false)`; it
never calls `onChange`. Backdrop press and the hardware back button (`onRequestClose={closePicker}`)
both route through it. `openPicker()` re-seeds `draft` from `value ?? new Date()` on every open, so
a discarded in-progress scroll never leaks into the next open. `DateField.test.tsx`'s "does not
update the draft on a 'dismissed' event... and confirm re-commits the field's existing value" case
directly exercises this: fires a `"dismissed"` vendor event, then presses backdrop, and asserts
`onChange` was never called — a real, falsifiable proof of the discard path, not merely absence of
a crash.

**`DateField.web.tsx` is untouched apart from the focus ring.** Read the file in full: the
`toInputValue`/`fromInputValue` ISO conversion, the raw `<input type="date">` render via
`React.createElement`, the `testID`→`data-testid` rename — all byte-for-byte identical to the
pre-Run-11 version described in Review round (Run 7/T023 fix). The only addition is the
`focused`/`rawInputFocusedStyle` state described below. **Verified correct on both counts.**

### 3. `DateField.web.tsx`'s focus ring

Read the file directly: at rest, `rawInputStyle.outline` remains `"none"` — unchanged, not simply
deleted — while a new `focused` boolean (tracked via real `onFocus`/`onBlur` DOM handlers, the only
mechanism available to a plain CSS-in-JS object with no `:focus` pseudo-class) swaps in
`rawInputFocusedStyle`, whose `outline: '2px solid ${colors.brand.primary}'` sources an existing
`src/theme` token (grepped `colors.brand.primary` — already defined, not a new literal). This is a
genuine, real proof rather than a device-only proxy, and the review confirmed it as such: a Jest
test can and does exercise a real `"focus"`/`"blur"` DOM event and assert the resulting `style`
object — no browser needed for this one specifically, unlike Defects 1/2.
`DateField.web.test.tsx`'s new case does exactly this: asserts `outline: "none"` at rest, fires
`"focus"`, asserts the ring value, fires `"blur"`, asserts reversion. **Verified correct.**

## Requirement traceability (Level 5, this batch)

| FR | Test(s) checked | Status |
|---|---|---|
| FR-003 (Tienda tab, no personal field, at any point) | `verify-phone.test.tsx`'s new business-draft test's four `not.toHaveProperty` assertions on the actual auto-submitted payload | Met |
| FR-008 (three-call flow; profile step carries business fields via `isBusiness: true`) | same test — exact call-shape assertion against the real `completeProfileFromDraft` branch | Met |
| FR-013 (real date-picker control, `Date` emission) | `DateField.test.tsx`'s rewritten interaction tests; contract cross-checked against `schemas.ts`'s unchanged `birthDate: z.coerce.date()` | Met |
| FR-014 (platform split via extension only, no inline `Platform.OS`) | `DateField.tsx`'s `display="spinner"` needed no `Platform.OS` branch; grepped — none introduced anywhere this round | Met |
| FR-015 (Enter/Space activation, visible focus, roles/labels, 44×44) | `webKeyActivation.test.ts` + 5 real `keyDown`-driven regression tests across `SegmentedControl`/`Select.web`/`UsuarioForm`/`TiendaForm`/`ProfileForm`; `DateField.web.test.tsx`'s new focus/blur test; source-verified against `PressResponder.js`/`propsToAriaRole.js` directly | Met |
| FR-016 (usable across widths, incl. native safe-area) | `CrearCuentaScreen.test.tsx`'s three new inset-padding tests — structural proxy only, honestly disclosed as such; device-level confirmation is `progress/current.md`'s T029 re-pass, out of this review's own re-verification (no simulator available in this session) | Met, with the device-level claim correctly not re-litigated here (per the task's own framing — unit tests are not the proof for Defects 1/2) |

## `tasks.md` checklist status (this batch)

- [X] T024 — verified: direct, non-incidental business-draft assertion at the payload level.
- [X] T026 — verified: genuinely comment-only, content accurate to plan.md Research Decision 8.
- [X] T027 — verified: the Space-key gap is real (confirmed by reading react-native-web's pinned
      source directly), the fix is correctly scoped (Space only, not double-handling Enter),
      applied everywhere it's needed (grepped), and covered by real `keyDown`-driven regression
      tests, not just wiring.
- Fixes to already-`[X]` T007/T017/T027/T029 (Run 11) — all three verified independently: the
  safe-area mock is applied cleanly and consistently across exactly the four files that needed it,
  with zero assertion weakened and T033/T034's regression guards intact; `DateField.tsx`'s
  Date-emission contract and discard-on-dismiss behavior are both genuinely correct and tested;
  `DateField.web.tsx` is confirmed untouched apart from the focus ring, which is a real (not
  proxy) Jest-provable fix.
- [ ] T030 — correctly still unchecked; out of scope for this round.

## `CHECKPOINTS.md` C1–C6 walkthrough (this round)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists, current.
- [x] `./init.sh` exits 0 (`RESULT: SUCCESS (10/10 stages passed)`, pre-existing dependency WARNs
      excepted) — independently re-run this round, matches the claimed baseline exactly.

**C2 — state coherent**
- [x] `010-registration-redesign` is the only `in_progress` feature (`feature_list.json`).
- [x] Every file this batch touches has passing, real tests covering it (85/630 green,
      independently reproduced).
- [x] `progress/current.md`'s T023/T025/T028/T029 sections are internally consistent with this
      round's claims (device-defect fixes cross-referenced and confirmed on-device by the
      orchestrator per its own account) — not independently re-verified on a device by this
      review (no simulator/browser tool available in this session), consistent with the task's
      own framing that unit tests are not the proof for Defects 1/2.

**C3 — architecture respected**
- [x] No `src/domain`/`src/lib` file touched this round gained a React/React Native import
      (`registration.ts`'s copy dictionary only gained a plain string key pair).
- [x] `DateField.tsx`/`CrearCuentaScreen.tsx` hold only UI-lifecycle state (`open`/`draft`,
      inset computation); no fetch/validation embedded — `useCrearCuentaSubmit`/domain modules
      untouched this round.
- [x] No inline `Platform.OS` introduced (`display="spinner"` needed none, confirmed by reading
      the vendor's own cross-platform support); `.web.tsx` convention respected throughout.
- [x] No direct Postgres/Redis/S3/Supabase-table access.
- [x] No new global state library.
- [x] No stray `console.*`/context-free `TODO` (grepped, this round's files).

**C4 — verification real**
- [x] Every new/changed behavior this round has a real RNTL/DOM-event-driven assertion on
      rendered output or actual mock-call arguments, not a smoke test — independently spot-
      checked above (T024's payload assertions, T027's Space-key `keyDown` tests, Defect 2's
      draft/discard/emit tests, Defect 3's focus/blur test).
- [x] `./init.sh`'s three build-export stages all pass; native-dependency-alignment stage WARNs
      only on the same five pre-existing packages.
- [x] Level 3 manual smoke check correctly disclosed as not performed by `task-implementer` for
      any file in this round (no browser/device tool in that session) — the device-only claims
      (Defects 1/2's real-device clearance/anchoring) are explicitly, honestly attributed to the
      orchestrator's own separate iPhone 17 Pro re-pass, not implied by the green suite.

**C5 — session hygiene** — not independently assessed here (`progress/history.md` session-close
bookkeeping remains out of this code review's scope, consistent with every prior round).

**C6 — SDD**
- [x] `specs/010-registration-redesign/{spec.md,plan.md,tasks.md}` all exist, re-read fresh.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers.
- [ ] N/A — feature not yet `done` (T030 remains `[ ]`).
- [x] Every `FR-00x` this round's tasks/fixes claim is referenced by at least one test's
      description or an adjacent comment (see traceability table above) — no untagged claim
      found.

## Findings

None blocking. Every specific concern raised for this round was independently re-verified against
the actual source, not the implementer's account: T024's business-draft test is a direct,
payload-level assertion, not incidental coverage; T026 is genuinely comment-only with content that
accurately restates `plan.md` Research Decision 8; T027's headline finding was independently
re-derived by reading `react-native-web`'s pinned `PressResponder.js`/`propsToAriaRole.js` source
directly, and the fix correctly restores Space activation everywhere it's needed (and nowhere it
isn't) with real `keyDown`-driven regression coverage; the safe-area mock genuinely required by
Run 11's `useSafeAreaInsets()` addition was wired as a consistent, non-provider mock across exactly
the four files that needed it (`CrearCuentaScreen.test.tsx` + the three `register.*` suites —
`UsuarioForm.test.tsx`'s own ripple this round was a distinct, unrelated `DateField` confirm-button
update, not the safe-area fix), with zero assertion weakened and both `001-registration-kyc`'s
T033/T034 regression guards confirmed to still guard exactly what they were written to guard
(the real `X-User-Id` header-survival integration and the real Supabase-rejection → session-issue
path, respectively); `DateField.tsx`'s modal-sheet redesign preserves the `Date` emission contract
byte-for-byte against `schemas.ts`'s unchanged `birthDate: z.coerce.date()`, dismisses sanely
without ever calling `onChange`, and `DateField.web.tsx` is confirmed untouched beyond the
genuinely-provable (not device-proxy) focus-ring fix.

## Independent re-run summary

```
$ node_modules/.bin/tsc --noEmit
(clean, zero errors)

$ npx jest --silent
Test Suites: 85 passed, 85 total
Tests:       630 passed, 630 total

$ ./init.sh
RESULT: SUCCESS (10/10 stages passed)
(Stage 5/6 WARNs: same pre-existing 5-package set as every prior round; no new warning)
```

Matches the implementer's own reported final numbers exactly, independently reproduced.

## Verdict

**APPROVE**

T024, T026, and T027 are sound and independently re-verified against the actual source, including
re-deriving T027's react-native-web keyboard-activation finding from the pinned dependency's own
code rather than trusting the writeup. The three Run 11 defect fixes are each judged on the merits
requested: the safe-area test-mocking ripple was resolved cleanly and consistently with zero
assertion weakened, and `001-registration-kyc`'s T033/T034 regression guards remain intact; the
native `DateField.tsx` modal-sheet redesign preserves its `Date`-emission contract exactly, handles
dismiss-without-choosing sanely, and leaves `DateField.web.tsx`'s separate inline `<input
type="date">` behavior genuinely untouched apart from the (correctly real, not device-proxy)
focus-ring fix. Type-check is clean, the full suite (85 suites / 630 tests) passes, and `./init.sh`
reports the same clean, pre-existing-only warning baseline as every prior round — independently
reproduced, not accepted on the implementer's account. Only T030 (the final `./init.sh` run +
`CHECKPOINTS.md` walk) remains before this feature can be considered for `done`.
