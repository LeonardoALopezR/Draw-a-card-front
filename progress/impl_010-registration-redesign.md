# Implementation Progress: `010-registration-redesign`

## Run 1 — T001 only (Phase 1: Setup)

**Scope**: T001 only, per the orchestrator's explicit one-task increment. No feature code, no
component, no screen, no import of the new package anywhere — confirmed via `git status`/`git
diff` below.

### Reading done before touching anything

1. `.specify/memory/constitution.md` — Principles II/III/IV, Technology Stack, Governance.
2. `specs/010-registration-redesign/tasks.md` — T001 (Phase 1: Setup) and its Checkpoint line.
3. `specs/010-registration-redesign/plan.md` — Technical Context (`@react-native-community/
   datetimepicker` note) and Research Decision 3/Clarification-4-referencing text.
4. `specs/010-registration-redesign/spec.md` — Clarification/Recorded default 4 (the human-approved
   decision to take this one new native dependency, Option A, over the no-new-dependency masked-text
   fallback Option B).
5. `docs/conventions.md` and `docs/verification.md`.

### What T001 asked for

Add `@react-native-community/datetimepicker` at the Expo-SDK-51-aligned version to
`package.json` dependencies, **without hand-picking a version** — confirmed against Expo's own
SDK-51 compatibility table via `npx expo install --check` (or equivalent), and report which
command was used and what it reported. No feature code.

### What I did

1. **Baseline capture** — ran `npx --yes expo install --check` *before* touching `package.json`,
   to have a true "before" snapshot of the dependency-alignment output (saved to
   `/tmp/expo-check-before.log`):

   ```
   The following packages should be updated for best compatibility with the installed expo version:
     expo-image-picker@15.0.7 - expected version: ~15.1.0
     react-native@0.74.0 - expected version: 0.74.5
     react-native-safe-area-context@4.10.1 - expected version: 4.10.5
     @types/react@18.3.31 - expected version: ~18.2.79
     typescript@5.9.3 - expected version: ~5.3.3
   Your project may not work correctly until you install the expected versions of the packages.
   Found outdated dependencies
   ```

   This is exactly the pre-existing, non-blocking warning set every feature since 004 has
   documented — confirmed as the starting point.

2. **Confirmed the SDK-51-aligned pin directly from Expo's own compatibility table**, not
   hand-picked: `node_modules/expo/bundledNativeModules.json` (the file `expo install`/`expo
   install --check` themselves read to decide "the SDK-51-aligned version") records:

   ```
   "@react-native-community/datetimepicker": "8.0.1",
   ```

3. **Installed via the Expo CLI itself** (not `npm install <pkg>@<version>` by hand): ran
   `npx --yes expo install @react-native-community/datetimepicker`. Output:

   ```
   › Installing 1 SDK 51.0.0 compatible native module using npm
   > npm install
   added 1 package, and audited 1509 packages in 2s
   ```

   This is the "repo's equivalent" command the task allowed as an alternative to `--check` — it
   resolves the version from the same `bundledNativeModules.json` table and writes it to
   `package.json` itself, so there was no manual version entry at any point.

4. **Result in `package.json`** (only line added, confirmed via `git diff -- package.json`):

   ```diff
   +    "@react-native-community/datetimepicker": "8.0.1",
   ```

   Note: this is pinned as an **exact** version (`"8.0.1"`, no `~`/`^`), not the `~8.0.1` written
   in `tasks.md`'s task text/`plan.md`. This is not a deviation I introduced — it's exactly what
   `expo install`, reading Expo's own compatibility table, chose. It also matches this
   `package.json`'s existing convention for other native-module pins that must track the SDK
   exactly (`"react-native": "0.74.0"`, `"react-native-safe-area-context": "4.10.1"`,
   `"react-native-screens": "3.31.1"` are all exact-pinned, not tilde-ranged, in this same file).
   `tasks.md`'s `~8.0.1` reads as shorthand for "the SDK-51-aligned version," not a literal
   instruction to override what the compatibility-check tooling itself produces — flagging this
   explicitly per the "say which command you used and what it reported" instruction, rather than
   silently reconciling the two.

5. **Re-ran `npx --yes expo install --check`** *after* the addition (saved to
   `/tmp/expo-check-after.log`) and diffed it byte-for-byte against the baseline:

   ```
   $ diff /tmp/expo-check-before.log /tmp/expo-check-after.log
   (no output — files are identical)
   ```

   **The new package does not appear anywhere in the dependency-alignment output, before or
   after.** The five packages listed (`expo-image-picker`, `react-native`,
   `react-native-safe-area-context`, `@types/react`, `typescript`) are the exact same
   pre-existing set — confirming the addition introduced **zero new alignment warning**.

6. **Confirmed no feature code was touched**: `git status` shows only `package.json` and
   `package-lock.json` (dependency install) as this task's changes — no new component, screen, or
   import of the package anywhere in `src/`/`app/`.

   ```
   modified:   package-lock.json
   modified:   package.json
   ```

   (`feature_list.json`/`progress/current.md` show as already modified/staged from the
   orchestrator's own session setup prior to this task — not touched by me, left as-is.)

7. Marked T001 `[X]` in `specs/010-registration-redesign/tasks.md`.

### `./init.sh` — full run, no `--skip-*` flags

```
▶ 1/8 Checking prerequisites          ✅ OK  node v20.20.2, npm v10.8.2
▶ 2/8 Environment file                ✅ OK  .env already exists, left untouched
▶ 3/8 Installing dependencies         ✅ OK  dependencies installed
▶ 4/8 Type-checking                   ✅ OK  no type errors
▶ 5/8 Expo config/dependency health   ⚠️  WARN  expo-doctor: outdated deps (pre-existing, see below)
▶ 6/8 Native dependency alignment     ⚠️  WARN  same 5 pre-existing packages, see below
▶ 7/8 Running test suite              ✅ OK  all tests passed
▶ 8/8 Bundle export (web/iOS/Android) ✅ OK  all three platforms exported cleanly

RESULT: SUCCESS (10/10 stages passed)
```

Stage 5 (expo-doctor) full detail, confirming the new package is absent from both failing checks:

```
✖ Check native tooling versions
  Your Expo SDK version 51 is not compatible with Xcode 26.6.0. Required Xcode version: <=16.2.0.
  (pre-existing local-toolchain warning, unrelated to any dependency — present before this task too)

✖ Check that packages match versions required by installed Expo SDK
  expo-image-picker@15.0.7 - expected version: ~15.1.0
  react-native@0.74.0 - expected version: 0.74.5
  react-native-safe-area-context@4.10.1 - expected version: 4.10.5
  @types/react@18.3.31 - expected version: ~18.2.79
  typescript@5.9.3 - expected version: ~5.3.3
```

Stage 6 (Native dependency alignment) — identical five-package list, `@react-native-community/
datetimepicker` not present in either stage's output.

**Checkpoint met**: `npm install` succeeded; the dependency-alignment stage (6/8) is clean for
the new package specifically — it neither newly failed nor newly warned. The pre-existing
five-package warning set is unchanged from the documented baseline (every feature since 004).

### Tests written/run

None — T001 is a dependency-manifest-only task per its own text ("No feature code in this task").
`./init.sh`'s Tests stage (7/8) ran the full existing suite unchanged and passed.

### Requirement traceability

Not applicable for this task — T001 implements spec.md's Clarification/Recorded default 4 (a
process decision about which dependency option to take), not a functional requirement (`FR-00x`)
directly. No new `src/domain` export or screen exists yet to attach an `FR-00x`-tagged test to.

### Task IDs now `[X]`

- **T001** — `[X]` in `specs/010-registration-redesign/tasks.md`.

No other task in this file was touched (T002 onward remain `[ ]`).

### Deviations / findings needing sign-off

- **None requiring a design decision.** The dependency-alignment stage introduced **zero** new
  warning because of this addition — Clarification 4's Option A (take the dependency) is fully
  viable as planned; there is no need to fall back to Option B (masked `dd/mm/yyyy` text input).
- **Minor notation discrepancy, not a functional deviation**: `tasks.md`/`plan.md` write the
  version as `~8.0.1`; what Expo's own compatibility table (`bundledNativeModules.json`) and `expo
  install` actually produced is the exact pin `8.0.1` (no tilde) — consistent with this
  `package.json`'s existing convention for other SDK-tracked native modules. Flagged above per the
  task's explicit instruction to report exactly what the compatibility-check command reported,
  not silently reconciled to match the task text's shorthand.

---

## Run 2 — T002–T007 (Phase 2: Foundational, theme tokens + shared UI primitives half)

**Scope**: T002 through T007 only, per the orchestrator's explicit instruction to stop there.
T008 onward (schemas, registration-draft, nationality domain module, i18n copy, etc.) untouched.

### Reading done before touching anything

1. `.specify/memory/constitution.md` — full re-read (Principles I–VIII, Technology Stack,
   Governance).
2. `specs/010-registration-redesign/tasks.md` — T002–T007 verbatim, the Phase 2 header, and its
   Checkpoint line, plus enough of Phase 3 (T015/T016) to understand how these primitives will be
   consumed later (so their prop shapes don't need revisiting).
3. `specs/010-registration-redesign/plan.md` — Research Decisions 1–8 in full, especially 3
   (`Select`'s design) and 4 (the two new theme tokens).
4. `specs/010-registration-redesign/spec.md` — FR-006, FR-012, FR-013, FR-015, Clarification 4,
   and the Assumptions section.
5. `docs/design-brief-registration-redesign.md` §2 (shared chrome).
6. `docs/conventions.md`, `docs/verification.md`.
7. Source read before editing: `src/theme/colors.ts`, `src/theme/contrast.ts`,
   `src/theme/contrast.test.ts`, `src/theme/typography.ts`, `src/theme/geometry.ts`,
   `src/theme/index.ts`, `src/features/identity/FormField.tsx` + `.web.tsx` + `.test.tsx`,
   `src/features/identity/RegistrationForm.tsx` (the account-type toggle's `aria-checked`
   pattern), `src/features/identity/ProfileForm.tsx` (existing birth-date `TextInput` and
   `profileFormSchema`'s `birthDate: z.coerce.date()`), `src/features/ui/PrimaryButton.tsx` /
   `SecondaryButton.tsx` / `StatusPill.tsx` (existing primitive conventions),
   `src/features/identity/CodeInput.types.ts` + `.ios.tsx` (the shared-types-file pattern for
   platform-split components), `src/features/identity/LoginScreenChrome.web.tsx` (the
   `backgroundImage` unrecognized-style-prop pass-through precedent), `package.json`,
   `jest.config.js`.

### T002 — `colors.segment.inactiveTrack` + contrast regression case

**The task's contrast claim was verified, not trusted**, per the orchestrator's explicit
instruction. Computed directly against the real `src/theme/contrast.ts` implementation (not a
hand-copy of the formula) via a throwaway Node script:

```
$ node -e '<hexToRgb/channelToLinear/relativeLuminance/contrastRatio copied verbatim from
src/theme/contrast.ts> console.log(contrastRatio("#646B78", "#EDEEF5"))'
4.634450880697834
```

**Result: 4.63:1 (rounds from 4.634450880697834), clears the 4.5:1 AA floor.** Matches the task's
claimed value exactly — no deviation, safe to ship.

Changes:
- `src/theme/colors.ts` — added `colors.segment = { inactiveTrack: "#EDEEF5" }`, with a doc
  comment recording the computed ratio and how it was derived.
- `src/theme/contrast.test.ts` — new case: `"text.secondary on segment.inactiveTrack
  (SegmentedControl's inactive label, spec 010 FR-006)"`, asserting `contrastRatio(colors.text.
  secondary, colors.segment.inactiveTrack) >= 4.5`.

### T003 — `typography.label.fieldSentence`

`src/theme/typography.ts` — added `typography.label.fieldSentence`: identical `fontSize`(12)/
`fontWeight`("500")/`color` (`colors.text.secondary`) to the existing `label.field`, with no
`textTransform`/`letterSpacing`. No color change, so (per the task's own instruction) no new
`contrast.test.ts` case was added — it inherits `text.secondary`, already covered by T002's
pairing and the pre-existing `text.secondary on bg.page/bg.surface/bg.surfaceMuted` case.

### T004 — `FormField`'s `labelCase` prop, defaulting to `"uppercase"`

**Backward-compatibility guarantee verified by grep, not assumed**, per the orchestrator's
explicit instruction:

```
$ grep -rn "<FormField" src app --include="*.tsx" | grep -v ".test.tsx"
```

Found 19 call sites across `SignInForm.tsx` (×2), `RegistrationForm.tsx` (×4),
`ProfileForm.tsx` (×9), `RequestPasswordResetForm.tsx` (×1), `ResetPasswordForm.tsx` (×3),
`VerifyPhoneScreen.tsx` (×1) — **none pass a `labelCase` prop today**. Confirmed the default is
genuinely load-bearing, not theoretical.

Changes:
- `src/features/identity/FormField.tsx` / `FormField.web.tsx` — added `labelCase?: "uppercase" |
  "sentence"` to `FormFieldProps`, defaulting to `"uppercase"`; the label `<Text>` now picks
  `styles.labelSentence` (→ `typography.label.fieldSentence`) when `labelCase === "sentence"`,
  else the existing `styles.label` (→ `typography.label.field`, unchanged).
- `src/features/identity/FormField.test.tsx` — added 4 new cases (2 per variant): a
  `labelCase="sentence"` regression asserting no `textTransform`/`letterSpacing` and the correct
  `fieldSentence` values, and an explicit "still renders uppercase when `labelCase` is omitted"
  regression guard.

**Re-ran every existing call-site screen's own test suite unchanged** (six screens named in the
task):

```
$ npx jest src/features/identity/SignInForm.test.tsx src/features/identity/RequestPasswordResetForm.test.tsx \
    src/features/identity/ResetPasswordForm.test.tsx src/features/identity/VerifyPhoneScreen.test.tsx \
    src/features/identity/RegistrationForm.test.tsx src/features/identity/ProfileForm.test.tsx

PASS src/features/identity/VerifyPhoneScreen.test.tsx
PASS src/features/identity/SignInForm.test.tsx
PASS src/features/identity/ResetPasswordForm.test.tsx
PASS src/features/identity/RequestPasswordResetForm.test.tsx
PASS src/features/identity/RegistrationForm.test.tsx
PASS src/features/identity/ProfileForm.test.tsx

Test Suites: 6 passed, 6 total
Tests:       46 passed, 46 total
```

All 46 pre-existing tests across those six suites pass byte-for-byte unchanged — confirms the
default is genuinely non-breaking, not just "should be fine."

### T005 — `src/features/ui/SegmentedControl.tsx`

Generic, full-width two-(or-more)-segment pill control: `options: {label, value}[]`, `value`,
`onChange`, `testID`. Styled per the design brief §2: active segment `brand.primary` fill + bold
`brand.onPrimary` label; inactive segment `colors.segment.inactiveTrack` (T002) fill + `text.
secondary` label; full pill radius (`radius.pill`), `CONTROL_HEIGHT` (56, matching the brief's
"~56px tall" exactly — no new literal). No platform split (identical `Pressable`s render
correctly on all three targets per `plan.md` Research Decision 3).

**Reused, not reinvented**, the exact accessible `radiogroup`/`radio` + top-level `aria-checked`
pattern from `RegistrationForm.tsx`'s account-type toggle (`001-registration-kyc` T024), read in
full before writing this file — including its documented reason (`aria-checked` set as a
top-level `Pressable` prop, not just inside `accessibilityState`, because this repo's pinned
react-native-web 0.19.13 never forwards `accessibilityState` to the DOM).

`src/features/ui/SegmentedControl.test.tsx` — 5 tests: both labels render; active segment gets
`brand.primary`/inactive gets `segment.inactiveTrack` (and the track itself is
`segment.inactiveTrack`); `onChange` fires with the pressed value; `aria-checked` correctly
tracks selection on both segments across a rerender (mirroring `RegistrationForm.test.tsx`'s own
`UNSAFE_getAllByType(Pressable)` technique, with the same comment explaining why); an accessible
`radiogroup`/`radio` role structure exists.

```
PASS src/features/ui/SegmentedControl.test.tsx (5 tests)
```

### T006 — `src/features/ui/Select.tsx` + `Select.web.tsx` (the largest/riskiest item)

**`Select.types.ts`** — shared `SelectOption`/`SelectProps` contract (mirrors
`CodeInput.types.ts`'s established pattern for platform-split components with no `.web`
extension of its own, so Metro never resolves a divergent copy per platform): `options`, `value`,
`onChange`, `label`, `placeholder?`, `loading?`, `error?`, `onRetry?`, `testID?`, `labelCase?`
(same optional default as `FormField`'s, for parity).

**`Select.tsx`** (native/default — iOS/Android): a `Pressable` trigger styled like `FormField`'s
input pill (`bg.surface`, `CONTROL_HEIGHT`, `radius.pill`), opening a `Modal` (`transparent`,
`animationType="fade"`) containing a filter `TextInput` (`autoFocus`) + a `FlatList` of options.
Loading renders an `ActivityIndicator` in place of the value text and disables the trigger; error
renders an inline error line plus, when `onRetry` is passed, a separate "Retry" `Pressable`. No
new dependency — `Modal`/`FlatList`/`ActivityIndicator` are all `react-native` core.

**`Select.web.tsx`**: swaps the `Modal` for an absolutely-positioned dropdown panel (`position:
"absolute"`, anchored below the trigger, `zIndex: 10`) with real keyboard handling on the filter
`TextInput`'s `onKeyPress`: `ArrowDown`/`ArrowUp` move a `highlightedIndex` state (clamped),
`Enter` selects the highlighted option and closes, `Escape` closes and restores focus to the
trigger via a `triggerRef`. **Verified, not assumed**, that react-native-web's `TextInput.
onKeyPress` fires for every keydown (not just Enter/Backspace as native RN's limited version
does) by reading `node_modules/react-native-web/dist/cjs/exports/TextInput/index.js`'s
`handleKeyDown` directly — it calls `onKeyPress(e)` unconditionally before its own Enter-specific
handling, with `e.nativeEvent.key` carrying the real DOM key name
(`TextInputKeyPressEventData`, react-native's own type — used directly, no custom event-shape
hack).

**Real keyboard sequence tested, not just wiring** (`src/features/ui/Select.web.test.tsx`, 5
tests): open/close via trigger press; `ArrowDown` ×2 then `Enter` selects the 3rd option
("Canadiense"); `ArrowUp` from the top stays clamped at index 0; **Escape restoring focus to the
trigger** — this needed a real investigation, documented in the test file's comment: the
`ReactTestInstance` `getByTestId` returns is *not* the same object as the component's internal
`triggerRef.current` (confirmed empirically — `el === capturedRef` is `false`, and `el.focus` is
`undefined`), so a naive "mutate the returned test instance's `.focus`" spy is a false-positive
trap. `triggerRef.current.constructor === View` was confirmed directly (`ref.current.constructor
=== View` → `true`), so the test spies on `View.prototype.focus` (the shared prototype method
react-native-web's `usePlatformMethods` attaches `.focus()`/`.blur()` to) and asserts the call
count increased after Escape, rather than asserting a hollow "handler was passed" check; unrelated
keys are confirmed to do nothing.

`src/features/ui/Select.test.tsx` — 8 tests for the native/default variant: label/placeholder
render, selected-value render, opening/closing via trigger and backdrop press, selecting an
option calls `onChange` and closes, filtering by typed text, loading state renders distinctly
and disables the trigger, error+retry renders distinctly and `onRetry` fires, and the trigger
does not open while disabled.

```
PASS src/features/ui/Select.test.tsx (8 tests)
PASS src/features/ui/Select.web.test.tsx (5 tests)
```

### T007 — `src/features/identity/DateField.tsx` + `DateField.web.tsx` (first consumer of T001's dependency)

**`DateField.types.ts`** — shared `DateFieldProps`: `label`, `value?: Date`, `onChange: (date:
Date) => void`, `error?`, `placeholder?`, `testID?`, `labelCase?`. Both variants emit a real
`Date` — verified against `src/domain/schemas.ts`'s actual `profileFormSchema.birthDate: z.
coerce.date(...)` field (read directly, not assumed) — **no schema change**, per the task's
explicit instruction.

**`DateField.tsx`** (native): wraps `@react-native-community/datetimepicker` (T001, already
installed with zero new alignment warning per Run 1) via the package's own documented
"Component usage" pattern (its README, read directly) — the native `<DateTimePicker>` element is
only mounted while local `open` state is true, and `onChange` closes it and calls the prop
`onChange(selected)` only when `event.type === "set"` (Android's dialog can report `"dismissed"`
on cancel; iOS's inline/compact picker always reports `"set"`). This is what keeps the file free
of any inline `Platform.OS` branch (Constitution IV) even though iOS/Android's real picker
chrome genuinely differs — the package's own declarative wrapper absorbs that, not this file.

**`DateField.web.tsx`**: **a genuine technical finding, verified by reading the pinned
dependency's actual source rather than trusting the task text's stated mechanism.** The task
description says the web variant should use "react-native-web's pass-through of unrecognized
native DOM props, the same mechanism `LoginScreenChrome.web.tsx`'s `backgroundImage` already
relies on." That mechanism is real for **style** props (unrecognized CSS keys on a `style`
object are forwarded verbatim), but does **not** apply to a `type="date"` **component** prop on
`TextInput`: reading `node_modules/react-native-web/dist/cjs/exports/TextInput/index.js` line
387 directly shows `supportedProps.type = multiline ? undefined : type;` — `TextInput`
unconditionally **overwrites** any passed `type` prop with its own internally-computed value
(derived only from `keyboardType`/`inputMode`/`secureTextEntry`, none of whose cases ever produce
`"date"`), so `<TextInput type="date" />` silently renders `type={undefined}` in this repo's
pinned react-native-web (0.19.13) — confirmed by reading the code, not by trial and error alone.
Given this, `DateField.web.tsx` renders a **real DOM `<input type="date">` element directly**
(via `React.createElement("input", props)`, not JSX's lowercase-tag form, to avoid `@types/react`'s
DOM `JSX.IntrinsicElements["input"]` rejecting the RN-convention `testID` prop) rather than
routing through `TextInput` at all — the only way to actually get the browser's native
date-picker affordance (calendar icon, typed/parsed value) FR-013 and the design brief call for.
**Confirmed this renders and is testable under this repo's existing Jest setup** via a scratch
test before committing to the approach: `@testing-library/react-native`'s `react-test-renderer`
accepts any host tag string (native RN component or bare DOM tag) with no RN-specific
`ViewConfig` requirement, and `fireEvent` invokes whatever prop handler is passed exactly like any
other host node — no real browser/jsdom needed. `toInputValue`/`fromInputValue` convert to/from
the DOM's own always-ISO `YYYY-MM-DD` format.

**Test-writing finding for `DateField.tsx`** (native): initially tried `fireEvent(picker,
"change", ...)` directly against the rendered `<DateTimePicker>` testID, which threw
(`TypeError: Cannot read properties of undefined (reading 'timestamp')`) — the vendor package's
own `datetimepicker.ios.js` wraps the *actual native host component's* raw change event in its
own `_onChange` translator before ever calling the `onChange` prop `DateField.tsx` passes in, and
jest-expo's fixed "ios" haste platform (confirmed via `RegistrationForm.test.tsx`'s own prior
comment on this) means the `.android.js` variant (which can report `"dismissed"`) is never
reachable in this test environment at all — the iOS variant always synthesizes `type: "set"`. Re-
designed the tests to grab `DateField.tsx`'s own `<DateTimePicker onChange={...}>` prop directly
via `UNSAFE_getByType(DateTimePicker)` and invoke it with event shapes matching the package's
*public* `DateTimePickerEvent` contract — testing `DateField.tsx`'s own logic (the
`setOpen(false)` + `event.type === "set"` conditional), not re-verifying the vendor's internal
event translation, which isn't this file's code to test. This also required wrapping the direct
prop-invocation in `act(...)` (imported from `@testing-library/react-native`, matching
`VerifyPhoneScreen.test.tsx`'s existing import pattern in this repo) — an initial attempt without
it produced an "update not wrapped in act" warning and a stale-tree read on the very next
assertion.

```
PASS src/features/identity/DateField.test.tsx (6 tests)
PASS src/features/identity/DateField.web.test.tsx (5 tests)
```

### Full verification

```
$ npx tsc --noEmit
(no output — clean)

$ npx jest
Test Suites: 78 passed, 78 total
Tests:       531 passed, 531 total
```

```
$ ./init.sh
▶ 1/8 Checking prerequisites          ✅ OK  node v20.20.2, npm v10.8.2
▶ 2/8 Environment file                ✅ OK  .env already exists, left untouched
▶ 3/8 Installing dependencies         ✅ OK  dependencies installed
▶ 4/8 Type-checking                   ✅ OK  no type errors
▶ 5/8 Expo config/dependency health   ⚠️  WARN  expo-doctor: outdated deps (pre-existing five-package set, unchanged from Run 1's baseline)
▶ 6/8 Native dependency alignment     ⚠️  WARN  same pre-existing five-package set, unchanged
▶ 7/8 Running test suite              ✅ OK  all tests passed
▶ 8/8 Bundle export (web/iOS/Android) ✅ OK  all three platforms exported cleanly

RESULT: SUCCESS (10/10 stages passed)
```

The stage 5/6 warnings are byte-for-byte the same five packages (`expo-image-picker`,
`react-native`, `react-native-safe-area-context`, `@types/react`, `typescript`) documented as
pre-existing/non-blocking in Run 1 and in every feature since `004` — **no new warning appeared**.

### Manual smoke check (Level 3) — explicitly not performed, and why

**No `npm run web` check was run for this batch.** T002–T007 build shared theme tokens and UI
primitives (`SegmentedControl`, `Select`, `DateField`) with **zero consumers yet** — nothing
under `app/` renders any of them (that starts at T015/T016/T017 in Phase 3, still `[ ]`).
`RegistrationForm.tsx`/`ProfileForm.tsx` (the only currently-reachable screens this batch touched,
via `FormField`'s `labelCase` prop) render byte-for-byte identically today, confirmed by their own
unchanged test suites passing (see T004 above) — there is nothing new to observe in a browser.
Stating this plainly rather than performing a smoke check that couldn't show anything, per
`docs/verification.md`'s "an unreachable screen/change is not a verified one" discipline. The
real Level 3 check for these primitives happens naturally once `CrearCuentaScreen`/`UsuarioForm`
render them (T017/T023).

### Requirement traceability (this batch)

| FR / Constitution ref | Covered by |
|---|---|
| FR-006 (token-only visual language, WCAG-checked new tokens) | `contrast.test.ts`'s new `segment.inactiveTrack` case; `SegmentedControl.test.tsx`'s "FR-006" test; `FormField.test.tsx`'s `labelCase="sentence"` cases |
| FR-012 (nationality field via a new shared, reusable, keyboard-operable selection primitive, backend-sourced) | `Select.test.tsx`, `Select.web.test.tsx` (the primitive itself; the backend-sourced wiring is T010/T011/T020, not yet built) |
| FR-013 (real date-picker control) | `DateField.test.tsx`, `DateField.web.test.tsx` |
| FR-015 (accessibility: roles/labels, 44×44 targets, keyboard operability) | `SegmentedControl.test.tsx`'s `aria-checked`/`radiogroup` tests; `Select.web.test.tsx`'s full keyboard sequence; `Select.test.tsx`'s accessible-role assertions |
| Constitution VII (WCAG 4.5:1, computed not eyeballed) | T002's verified-by-computation contrast ratio, recorded above |

### Task IDs now `[X]`

- **T002, T003, T004, T005, T006, T007** — all `[X]` in `specs/010-registration-redesign/tasks.md`.

T008 onward remain `[ ]`, untouched, per the orchestrator's explicit stop-at-T007 instruction.

### Files changed/added this run

- Modified: `src/theme/colors.ts`, `src/theme/contrast.test.ts`, `src/theme/typography.ts`,
  `src/features/identity/FormField.tsx`, `src/features/identity/FormField.web.tsx`,
  `src/features/identity/FormField.test.tsx`.
- Added: `src/features/ui/SegmentedControl.tsx` + `.test.tsx`; `src/features/ui/Select.types.ts`,
  `Select.tsx` + `.test.tsx`, `Select.web.tsx` + `.web.test.tsx`;
  `src/features/identity/DateField.types.ts`, `DateField.tsx` + `.test.tsx`, `DateField.web.tsx`
  + `.web.test.tsx`.

### Deviations / findings needing sign-off

1. **T002's contrast value, independently verified**: 4.634450880697834 (rounds to 4.63:1),
   matching the task's stated figure exactly. No discrepancy — recorded per the orchestrator's
   explicit instruction to report the number actually computed, not just confirm the task text.
2. **T007/`DateField.web.tsx`'s implementation mechanism differs from the plan/task's literal
   description**, for a verified technical reason, not a preference: `react-native-web`
   `TextInput`'s `type` prop is unconditionally overwritten by internally-computed logic
   (confirmed by reading `node_modules/react-native-web/dist/cjs/exports/TextInput/index.js`
   directly) and can never actually render `type="date"` in this repo's pinned version — so
   `TextInput type="date"` (what the plan/task literally describe) would silently **not work** at
   runtime. The fix used instead — a real DOM `<input>` rendered directly via
   `React.createElement` — achieves the actually-required behavior (FR-013, the design brief's
   "browser's native `<input type='date'>`") and stays fully testable under this repo's existing
   Jest setup (confirmed empirically). This is flagged here per the "stop and report rather than
   improvising a design decision" instruction, though in this case the alternative wasn't a design
   choice among options — it was the only mechanism that actually produces the required, spec'd
   browser behavior at all, given a hard constraint in a pinned dependency. No FR/plan.md text
   changes were made without this disclosure; `code-reviewer` should confirm this reasoning is
   accepted or direct a different fallback (e.g. Clarification 4's Option B) if not.
3. No other deviation. All backward-compatibility guarantees (T004) were verified by grep and by
   re-running the exact six existing screens' test suites unchanged, per the orchestrator's
   explicit instruction, not assumed safe.

---

## Run 3 — T006 review fixes

**Scope**: exactly the one blocking finding `code-reviewer` returned on T006 in
`progress/review_010-registration-redesign.md` (two parts, both inside `src/features/ui/Select.tsx`
and `src/features/ui/Select.web.tsx`). T006 stays `[X]` — this is a fix to an already-checked task,
not a new task. Nothing in T008 onward touched.

### Reading done before touching anything

1. `progress/review_010-registration-redesign.md` — Findings and Verdict sections in full.
2. `specs/010-registration-redesign/spec.md` — FR-006, FR-007 re-read.
3. `docs/design-brief-registration-redesign.md` §1 ("Everything here is `src/theme` tokens and
   `src/features/ui` primitives. No new hex literals.").
4. `src/features/ui/PrimaryButton.tsx`, `SecondaryButton.tsx`, `StatusPill.tsx` — confirmed each
   takes 100% of its rendered text as props, none hardcodes a literal string internally; this is
   the convention `Select` needed to match.
5. `src/features/ui/Select.tsx`, `Select.web.tsx`, `Select.types.ts`, `Select.test.tsx`,
   `Select.web.test.tsx` — the two flagged files plus their shared types/tests, read in full.
6. `src/features/identity/DateField.tsx`, `DateField.web.tsx` — checked for the same hardcoded-copy
   defect the reviewer flagged in `Select`.
7. `src/theme/colors.ts` — re-read T002's `colors.segment.inactiveTrack` addition as the pattern to
   mirror for the new backdrop token.

### Part A — copy-override props added to `Select.tsx` / `Select.web.tsx`

`src/features/ui/Select.types.ts`: added five optional props to `SelectProps` — `retryLabel`,
`searchPlaceholder`, `loadingLabel`, `filterAccessibilityLabel`, `closeAccessibilityLabel` — with a
doc comment explaining the fix and naming `PrimaryButton`/`SecondaryButton`/`StatusPill` as the
convention being matched. Both `Select.tsx` and `Select.web.tsx` import this same file, so their
prop surfaces stay identical by construction (no separate type declared per file).

`src/features/ui/Select.tsx`: destructures the five new props, each defaulted to the exact string
that was previously hardcoded (`"Retry"`, `"Search"`, `"Loading…"`, `"Filter options"`, `"Close"`),
so no existing call site or test needs to change. Replaced every hardcoded literal:
- The retry `Pressable`'s `accessibilityLabel` and its `Text` child now read `retryLabel`.
- The filter `TextInput`'s `placeholder` now reads `searchPlaceholder`, its `accessibilityLabel`
  now reads `filterAccessibilityLabel`.
- The backdrop `Pressable`'s `accessibilityLabel` now reads `closeAccessibilityLabel`.
- The native loading `ActivityIndicator` (which previously had no `accessibilityLabel` at all) now
  gets `accessibilityLabel={loadingLabel}` — a genuine accessibility improvement, not just parity,
  since a screen-reader user previously had no announced reason the trigger was disabled/spinning.

`src/features/ui/Select.web.tsx`: same four applicable props (`retryLabel`, `searchPlaceholder`,
`loadingLabel`, `filterAccessibilityLabel`) destructured and wired identically — the web variant's
visible `"Loading…"` `Text` now reads `loadingLabel`, the retry button/`accessibilityLabel` and the
filter `TextInput`'s `placeholder`/`accessibilityLabel` all read the corresponding props.
`closeAccessibilityLabel` is intentionally **not** destructured/used here — the web variant has no
backdrop or dedicated "close" control (closing happens via a second trigger press or `Escape`), so
there is no element to attach it to; the *type* still carries the prop (shared `SelectProps`), so a
caller passing it is not a type error, it's simply a no-op on this variant, mirroring how `onRetry`
being optional works on both.

**`DateField.tsx` / `DateField.web.tsx` — checked, no fix needed.** Neither file hardcodes any
copy string with no override: the birth-date field's only literal is the `placeholder = "dd/mm/aaaa"`
default, which was already an optional prop before this run (a caller can already override it), and
every `accessibilityLabel` in both files already reads the caller-supplied `label` prop, not a
hardcoded string. Confirmed by re-reading both files in full — the reviewer's suspicion that the
same defect might exist there does not hold.

### Part B — `colors.overlay.backdrop` token

`src/theme/colors.ts`: added a new `overlay: { backdrop: "rgba(0,0,0,0.4)" }` token, with a doc
comment following T002's `colors.segment.inactiveTrack` pattern exactly (what it's for, why it was
added, and — per the task's explicit instruction to judge this rather than skip it — **why it does
not need a `contrast.test.ts` case**: a translucent black scrim behind a modal panel is decorative
dimming, not a text-on-background color pairing; there is no text rendered directly on the backdrop
fill for a reader to parse, so WCAG 4.5:1 text-contrast doesn't apply to it the way it does to
`segment.inactiveTrack`'s label-on-fill pairing). `src/features/ui/Select.tsx`'s `styles.backdrop`
now reads `backgroundColor: colors.overlay.backdrop` instead of the inline `"rgba(0,0,0,0.4)"`
literal — same numeric value, now sourced from `src/theme` per FR-006/the design brief §1's "no new
hex literals."

`Select.web.tsx` has no backdrop (no full-screen modal on web — see its own file comment on the
absolutely-positioned dropdown panel), so this token is consumed by the native variant only.

### Tests added

`src/features/ui/Select.test.tsx` (native/default): added `StyleSheet`/`colors` imports and 4 new
cases — a caller-supplied `retryLabel` renders instead of `"Retry"` (and `"Retry"` is confirmed
absent); caller-supplied `searchPlaceholder`/`filterAccessibilityLabel`/`closeAccessibilityLabel`
all reach the open picker's filter input and backdrop; every copy prop still defaults to the
original English strings when omitted (the loading `ActivityIndicator`'s new `accessibilityLabel`
specifically, since that's also a new assertion surface); and the backdrop's `style.backgroundColor`
resolves (via `StyleSheet.flatten`) to `colors.overlay.backdrop`, not a literal.

`src/features/ui/Select.web.test.tsx`: added 3 new cases mirroring the above for the web variant —
`retryLabel` override, `searchPlaceholder`/`filterAccessibilityLabel` override on the open panel,
and `loadingLabel` override (asserting `"Cargando…"` renders and the built-in `"Loading…"` does
not).

All new tests are FR-007-tagged in their `it(...)` description (or FR-006 for the backdrop-token
test), per this repo's traceability requirement.

### Full verification

```
$ npx jest src/features/ui/Select.test.tsx src/features/ui/Select.web.test.tsx --verbose
PASS src/features/ui/Select.web.test.tsx (8 tests)
PASS src/features/ui/Select.test.tsx (12 tests)
Test Suites: 2 passed, 2 total
Tests:       20 passed, 20 total
```

```
$ node_modules/.bin/tsc --noEmit
(no output — clean)

$ npx jest
Test Suites: 78 passed, 78 total
Tests:       538 passed, 538 total
```

538 = the 531-test baseline the review batch established, plus this run's 7 new cases (4 in
`Select.test.tsx`, 3 in `Select.web.test.tsx`) — zero regressions, zero test deleted/weakened to
make this pass.

```
$ ./init.sh
▶ 1/8 Checking prerequisites          ✅ OK  node v20.20.2, npm v10.8.2
▶ 2/8 Environment file                ✅ OK  .env already exists, left untouched
▶ 3/8 Installing dependencies         ✅ OK  dependencies installed
▶ 4/8 Type-checking                   ✅ OK  no type errors
▶ 5/8 Expo config/dependency health   ⚠️  WARN  expo-doctor: outdated deps (same pre-existing five-package set)
▶ 6/8 Native dependency alignment     ⚠️  WARN  same pre-existing five-package set, unchanged
▶ 7/8 Running test suite              ✅ OK  all tests passed
▶ 8/8 Bundle export (web/iOS/Android) ✅ OK  all three platforms exported cleanly

RESULT: SUCCESS (10/10 stages passed)
```

Stage 5/6 warnings are the exact same five packages (`expo-image-picker`, `react-native`,
`react-native-safe-area-context`, `@types/react`, `typescript`) documented as pre-existing in every
prior run of this feature — **no new warning appeared**. The Xcode/SDK-51 local-toolchain warning
this task's instructions called out as an acceptable pre-existing item did not surface at all in
this run's `expo-doctor` output (environment-dependent, not something this fix touches either way).

### Manual smoke check (Level 3) — not performed, same reasoning as Run 2

`Select` still has **zero consumers** anywhere under `app/` (T015/T020, which wire it into
`CrearCuentaScreen`, remain `[ ]`) — nothing changed by this run is reachable in a running app yet.
Per `docs/verification.md`'s "an unreachable screen/change is not a verified one" discipline, a
`npm run web` pass would show nothing new to observe. The real Level 3 check for these copy props
happens naturally once T015/T020 render `Select` and pass real Spanish copy through them.

### Requirement traceability (this run)

| FR | Covered by |
|---|---|
| FR-007 (all copy routes through an override a caller can localize) | `Select.test.tsx`'s two new copy-prop tests + the backward-compatibility-defaults test; `Select.web.test.tsx`'s three new copy-prop tests |
| FR-006 (token-only visual language, no new hex literals) | `Select.test.tsx`'s new backdrop-token test (`colors.overlay.backdrop`) |

### Task IDs now `[X]`

No change — **T006 was already `[X]`** and stays `[X]`; this run fixes defects inside it per the
review verdict, it does not newly complete a task. No other task ID in `tasks.md` was touched.

### Files changed this run

- `src/features/ui/Select.types.ts` — added 5 optional copy-override props.
- `src/features/ui/Select.tsx` — consumes the 5 props (defaulted), backdrop now reads
  `colors.overlay.backdrop`.
- `src/features/ui/Select.web.tsx` — consumes 4 applicable props (defaulted).
- `src/theme/colors.ts` — added `colors.overlay.backdrop` token with doc comment.
- `src/features/ui/Select.test.tsx` — 4 new tests.
- `src/features/ui/Select.web.test.tsx` — 3 new tests.
- `src/features/identity/DateField.tsx`, `DateField.web.tsx` — read, not modified (no equivalent
  defect found).

### Deviations / findings needing sign-off

- **None.** Both parts of the finding were fixed exactly as the reviewer's suggested shape
  describes (prop names match the reviewer's own suggestion verbatim; token name/placement mirrors
  T002's precedent exactly). The one judgment call the task asked me to make explicitly — whether
  the new backdrop token needs a `contrast.test.ts` case — was concluded **no**, with the reasoning
  recorded both in `colors.ts`'s doc comment and above: a translucent scrim is not a
  text-on-background pairing, so WCAG 4.5:1 text contrast doesn't apply to it.

---

## Run 4 — T008–T014 (Phase 2: Foundational, domain/infrastructure half)

**Scope**: T008 through T014 only, per the orchestrator's explicit batch boundary. No screen/
component work (T015+), no User Story code. HEAD stayed on `010-registration-redesign`; no commit
made.

### Reading done before touching anything

1. `.specify/memory/constitution.md` — Principles II/III/IV especially, plus Governance.
2. `docs/conventions.md`, `docs/verification.md`.
3. `specs/010-registration-redesign/tasks.md` — T008–T014 verbatim plus the Phase 2 Checkpoint.
4. `specs/010-registration-redesign/plan.md` — Research Decisions 1, 2, 5, 6, 7 and the Data Model
   section.
5. `specs/010-registration-redesign/spec.md` — FR-002, FR-003, FR-007, FR-009, FR-012, FR-016, the
   Assumptions section, and `docs/design-brief-registration-redesign.md` §2–§4 for the exact field/
   copy lists T013 needed.
6. Existing source read in full before editing: `src/domain/schemas.ts` + `schemas.test.ts`,
   `src/lib/api.ts`, `src/domain/registration.ts`, `src/domain/profile.ts`,
   `src/domain/api-client.ts`, `src/features/ui/Select.types.ts` (per the orchestrator's explicit
   instruction — confirmed the real prop names are `loading`/`error`/`onRetry`, not the plan's
   `isLoading`/`refetch` phrasing), `src/domain/i18n/copy/login.ts` + `login.test.ts` (the coverage
   pattern to mirror), `src/domain/i18n/translate.ts`, `src/features/identity/LoginScreenChrome.web.tsx`
   + its test, `src/features/identity/useKycGate.ts` + `useKycGate.test.ts` (the React Query
   hook-testing pattern to mirror for T011).

### T008 — `src/domain/schemas.ts`: `usuarioCrearCuentaSchema` / `tiendaProfileFormSchema` / `tiendaCrearCuentaSchema`

Added, **existing schemas byte-for-byte unchanged** (confirmed via `git diff` — only additions,
no edits to `personalRegistrationSchema`/`profileFormSchema`/`businessRegistrationSchema`/
`businessProfileFormSchema`):

- `usuarioCrearCuentaSchema = personalRegistrationSchema.merge(profileFormSchema)`.
- `tiendaProfileFormSchema` — built **narrow**, from scratch (`z.object({ commercialName, rfc,
  fiscalAddress, tosAccepted, privacyAccepted })`), explicitly **not** derived from
  `businessProfileFormSchema` (which still extends `profileFormSchema` and would have wrongly
  required `nombre`/`apellidoPaterno`/`birthDate`/`nationality`/`curp` — verified by reading
  `businessProfileFormSchema`'s definition directly before writing this, per the orchestrator's
  explicit flag).
- `tiendaCrearCuentaSchema = businessRegistrationSchema.merge(tiendaProfileFormSchema)`.
- All three types exported (`UsuarioCrearCuentaInput`, `TiendaProfileFormInput`,
  `TiendaCrearCuentaInput`).

`schemas.test.ts` extended with 4 new `describe` blocks (16 new tests): happy path + missing
registration-field + missing profile-field for `usuarioCrearCuentaSchema`; happy path + "no
personal field required/rejected" assertion (explicitly checks `nombre`/`apellidoPaterno`/
`birthDate`/`nationality`/`curp` are absent from the parsed output) + three missing-required-field
cases for `tiendaProfileFormSchema`; happy path + one missing-field case each for registration-side
and profile-side on `tiendaCrearCuentaSchema`. `ProfileForm.tsx`'s existing tests untouched and
still green (confirmed in the full suite run below) — it never imported any of the new schemas.

### T009 — `src/lib/registration-draft.ts` (the task given the most explicit care instructions)

Built exactly as directed: a plain module-level `let draft: RegistrationDraft | undefined`
variable, mirroring `src/lib/api.ts`'s `currentUserId` pattern — **no** `expo-secure-store`, **no**
AsyncStorage, **no** new persistence mechanism of any kind. Three exports:
`setRegistrationDraft(draft)`, `consumeRegistrationDraft()` (reads and clears **in the same
call** — `const current = draft; draft = undefined; return current;`), `clearRegistrationDraft()`.
`RegistrationDraft` is the discriminated union `plan.md`'s Data Model specifies (`{ kind:
"personal"; nombre; apellidoPaterno; apellidoMaterno?; birthDate: Date; nationality; curp; rfc;
tosAccepted: true; privacyAccepted: true } | { kind: "business"; commercialName; rfc;
fiscalAddress; tosAccepted: true; privacyAccepted: true }`) — `birthDate` typed as `Date` to match
what `DateField`/`DateField.web` (T007, already built) emit and what `profileFormSchema`'s
`z.coerce.date()` expects.

The file's doc comment is written specifically to explain *why* this is deliberately volatile
(quoted from the file): "there is nothing to leak from disk, nothing to expire, nothing for a
device-forensics or backup-extraction scenario to find... losing the draft on a killed app/closed
tab is the intended, honest tradeoff this design makes, not a bug to 'fix'... Do NOT add
persistence here." No `console.*` anywhere in this file (grepped to confirm — see verification
section below).

`registration-draft.test.ts` (6 tests): set-then-consume for both a personal and a business draft;
**a second consume call returns `undefined`** (the atomicity requirement, tested explicitly and
separately from the "clear" test); `clearRegistrationDraft()` after a set makes a subsequent
consume return `undefined`; consuming with nothing ever set returns `undefined`; a later `set`
overwrites an earlier unconsumed draft.

### T010 — `src/domain/nationality.ts`

`NationalityOption` (`{ value: string; label: string }`) and `fetchNationalities(client: ApiClient):
Promise<NationalityOption[]>`, calling `GET /identity/nationalities` — same dependency-injection
pattern as `registration.ts`/`profile.ts` (an `ApiClient` parameter, no direct `src/lib/api.ts`
import, zero React/RN imports). The file's top comment states plainly, in capital letters, that the
endpoint path is a **planning assumption, not a confirmed contract** (backend `015` has no spec of
its own), unlike every call in `registration.ts`/`profile.ts`, which are cross-checked against real
backend source — and that real-network verification is `[BLOCKED-ON-015]`, matching `tasks.md`'s
own label. `nationality.test.ts` (3 tests): happy path (asserts the exact call shape too), an
empty-catalog path, and a rejected/network-error path — both against a mocked `ApiClient`, no real
network call.

### T011 — `src/features/identity/useNationalities.ts`

Read `Select.types.ts` first, as instructed, before writing this — confirmed the real prop names
are `loading?: boolean`, `error?: string`, `onRetry?: () => void` (not `isLoading`/`refetch` as
`plan.md`'s prose describes it). The hook's return shape (`{ options, loading, error, onRetry }`)
is deliberately named to match those exactly, so a future caller can spread it straight into
`<Select loading={result.loading} error={result.error} onRetry={result.onRetry} .../>` with no
renaming. Wraps `fetchNationalities` (T010) via the injected `api` singleton (`src/lib/api.ts`)
through a plain `useQuery`, `retry: false` (matches `useKycGate.ts`'s own precedent of not letting
React Query silently retry a call whose failure state the UI needs to render). `error` is
`query.isError ? NATIONALITIES_LOAD_ERROR_MESSAGE : undefined` — a plain, un-localized English
string for now, following the exact same precedent `registration.ts`'s `SESSION_LOST_MESSAGE`/
`map*Error` fallbacks already set (plain strings, not routed through `src/domain/i18n` at the
domain/hook layer); the caller wiring this into `UsuarioForm` (a later task, T020) is free to
override it with `registrationCopy`'s copy before it ever reaches a user.

`useNationalities.test.ts` (5 tests, `renderHook` + `QueryClientProvider`, mirroring
`useKycGate.test.ts`'s wrapper/mocking pattern): starts loading with empty options and no error;
exposes fetched options once loaded; exposes a real (non-empty-string) error message on failure;
`onRetry` genuinely re-invokes `fetchNationalities` (not a no-op — asserted via call-count and the
eventual successful state after a first failure); queries under the exported
`nationalitiesQueryKey`. `@/lib/supabase-client` is mocked (not `@/lib/api` itself) so
`src/lib/api.ts`'s module graph still resolves without touching real `expo-secure-store`, matching
`useKycGate.test.ts`'s own precedent exactly.

### T012 — `src/features/identity/authCardLayout.ts`

`export const AUTH_CARD_MAX_WIDTH = 660;` — a plain number, no React import.
`LoginScreenChrome.web.tsx` now imports it and assigns `const CARD_MAX_WIDTH = AUTH_CARD_MAX_WIDTH;`
instead of owning the literal itself. `LoginScreenChrome.test.tsx` was **not** edited — it still
asserts `style.maxWidth === 660` directly, and that assertion still passes unchanged (confirmed
below), proving the refactor is a byte-for-byte no-op for that screen.

### T013 — `src/domain/i18n/copy/registration.ts`

Built the full Spanish-default/English-parity dictionary, mirroring `login.ts`'s structure exactly:
title/subtitle, both segmented-control labels, every Usuario-tab and Tienda-tab field
label/placeholder from the design brief's §3/§4 tables (including the two tabs' genuinely different
`@`-handle and RFC placeholders — `usuarioUsernamePlaceholder`/`tiendaUsernamePlaceholder`,
`rfcPlaceholder`/`tiendaRfcPlaceholder`), the two consent-row labels, the submit button's idle
(`Registrarse`) and busy (`Creando cuenta…`) copy. Spanish carries correct diacritics throughout —
`Correo electrónico`, `Contraseña`, `Nacionalidad`, `Política de Privacidad`, `Términos de Uso`,
`Domicilio fiscal` — verified both by eye and by a dedicated test asserting the dictionary does
**not** contain the mockup tool's unaccented artifacts (`Correo electronico`, `Politica`,
`Terminos`).

Also — per the orchestrator's explicit prompt to check whether this dictionary should carry
`Select`'s new copy-override keys now — added Spanish/English defaults for all five of
`Select.types.ts`'s copy props (`selectRetryLabel`, `selectSearchPlaceholder`, `selectLoadingLabel`,
`selectFilterAccessibilityLabel`, `selectCloseAccessibilityLabel`), so whichever later task wires
the `Nacionalidad` picker into `UsuarioForm` has Spanish copy ready to pass through rather than
falling back to `Select`'s English internal defaults. Deliberately did **not** attempt to relocalize
the reused schemas' own validation messages (`profileFormSchema`/`tiendaProfileFormSchema`, etc.) —
those stay plain English, matching every other schema-driven form in this app today; noted in this
file's own doc comment as an explicit, pre-existing, out-of-scope state, not an oversight.

`registration.test.ts` (9 tests) mirrors `login.test.ts`'s coverage pattern: key-parity across
locales, no empty-string values, spot-checks for every accented string the design brief calls out,
an explicit "does not contain the mockup tool's unaccented artifacts" check, the two tabs' distinct
placeholders, all five `Select` copy overrides, and the submit button's idle/busy copy.

### T014 — doc-comment correction only (no functional change)

Corrected the stale "`X-User-Id` is backend-trusted in development/test" claims in three files —
`src/lib/api.ts` (the file-level `setCurrentUserId`/`X-User-Id` comment), `src/domain/
registration.ts` (the file-level DI/auth note, `verifyPhoneCode`'s doc comment,
`fetchCurrentUser`'s doc comment, `SESSION_LOST_MESSAGE`'s doc comment, and the two `T033`
inline comments in `mapVerifyPhoneError`/`mapResendError` that described `Unauthenticated` as
"only reachable if the X-User-Id wiring regresses" — now corrected to state it's the ordinary
"session missing/expired/invalid" case since backend `004-session-authentication` replaced the
header mechanism with real Bearer-JWT verification), and `src/domain/profile.ts` (the file-level
comment, the `UserNotFound` error-code note, and `mapProfileError`'s equivalent `T033` inline
comment). Every corrected comment now states plainly that backend `004-session-authentication`
(`done`, merged 2026-08-06) deleted the `X-User-Id` trust path entirely, in every `NODE_ENV`, and
that the real backend now identifies every caller via the Bearer JWT `src/lib/api.ts` already
sends. The header-sending code itself (`setCurrentUserId`, the `getHeaders` callback, the
`X-User-Id` line) is **left in place, unremoved**, exactly as `plan.md` Research Decision 7
specifies.

**Confirmed via a scripted diff check** (not just eyeballing) that only comment lines changed in
all three files: every added/removed line in `git diff -- src/lib/api.ts src/domain/registration.ts
src/domain/profile.ts` was either blank or started with `//` once the leading `+`/`-` marker was
stripped — zero non-comment lines touched.

### Verification

`node_modules/.bin/tsc --noEmit` — clean, zero errors.

Targeted run of every new/changed test file first:

```
PASS src/features/identity/useNationalities.test.ts
PASS src/domain/i18n/copy/registration.test.ts
PASS src/lib/registration-draft.test.ts
PASS src/domain/nationality.test.ts
PASS src/features/identity/LoginScreenChrome.test.tsx
PASS src/domain/schemas.test.ts

Test Suites: 6 passed, 6 total
Tests:       89 passed, 89 total
```

Full suite (`npx jest`):

```
Test Suites: 82 passed, 82 total
Tests:       571 passed, 571 total
```

(Baseline before this run was 78 suites / 538 tests — this run added 4 new suites
(`registration-draft.test.ts`, `nationality.test.ts`, `useNationalities.test.ts`,
`registration.test.ts`) and extended 2 existing ones (`schemas.test.ts` +16,
`LoginScreenChrome.test.tsx` unchanged/still passing), totaling +33 tests.)

Grepped the two files this batch is most sensitive about for stray `console.*` calls —
`src/lib/registration-draft.ts` and its test: zero matches, as required.

Full `./init.sh`, no `--skip-*` flags:

```
▶ 1/8 Checking prerequisites          ✅ OK
▶ 2/8 Environment file                ✅ OK
▶ 3/8 Installing dependencies         ✅ OK
▶ 4/8 Type-checking                   ✅ OK — no type errors
▶ 5/8 Expo config/dependency health   ⚠️  WARN (pre-existing, see below)
▶ 6/8 Native dependency alignment     ⚠️  WARN (pre-existing, see below)
▶ 7/8 Running test suite              ✅ OK — all tests passed
▶ 8/8 Bundle export smoke checks      ✅ OK — web, iOS, Android all exported cleanly

RESULT: SUCCESS (10/10 stages passed)
```

Both WARN stages carry **exactly** the pre-existing, already-disclosed non-blocking findings named
in the task brief and first recorded in this feature's own Run 1 baseline capture
(`expo-image-picker@15.0.7`, `react-native@0.74.0`, `react-native-safe-area-context@4.10.1`,
`@types/react@18.3.31`, `typescript@5.9.3`, all pre-dating this feature) — nothing new. No local
Xcode/SDK-51 incompatibility surfaced in this run (the iOS/Android bundle-export smoke checks both
passed cleanly at stage 8, since `npx expo export` only bundles JS and doesn't require a native
toolchain).

### Requirement traceability (this batch)

| FR | Test(s) |
|---|---|
| FR-002 | `schemas.test.ts` → `usuarioCrearCuentaSchema` describe block (4 tests) |
| FR-003 | `schemas.test.ts` → `tiendaProfileFormSchema`/`tiendaCrearCuentaSchema` describe blocks (10 tests) |
| FR-007 | `registration.test.ts` (all 9 tests — key parity, no empties, Spanish orthography, mockup-artifact exclusion, placeholders, Select copy, submit copy) |
| FR-009 | `registration-draft.test.ts` (all 6 tests — set/consume atomicity, second-consume-returns-undefined, clear-then-consume, overwrite) |
| FR-012 | `nationality.test.ts` (3 tests), `useNationalities.test.ts` (5 tests) |
| FR-016 | `LoginScreenChrome.test.tsx` (existing `maxWidth === 660` assertion, now sourced from `AUTH_CARD_MAX_WIDTH`, still green) |

### Task status

`T008`, `T009`, `T010`, `T011`, `T012`, `T013`, `T014` all marked `[X]` in `tasks.md` — every one
genuinely done, verified per the above. Phase 2's Checkpoint ("run `npm test` and `npx tsc --noEmit`
— both must pass before proceeding to Phase 3") is satisfied. **Stopped at T014 as instructed** —
no Phase 3/User Story work (T015+) started.

### Deviations from plan — none requiring sign-off

No design decision was made unilaterally. The one place `plan.md`'s own prose (`{ options,
isLoading, error, refetch }`) differs from what was actually built (`{ options, loading, error,
onRetry }`) is not a deviation from `plan.md`'s *intent* — `plan.md` itself says the hook's shape
must plug directly into `Select`'s real props, and the orchestrator's brief explicitly flagged this
exact naming gap and directed reading `Select.types.ts` as the source of truth over the plan's own
descriptive prose. Recorded here for visibility, not as something needing separate approval.

---

## Run 5 — T015–T017 (Phase 3: User Story 1, `Crear cuenta` screen + its two tab forms)

**Scope**: T015, T016, T017 only, per the orchestrator's explicit stop-at-T017 instruction. T018
(`register.tsx` rewrite) and T019 (`verify-phone.tsx` extension) — the highest-regression-risk
route-rewiring tasks — were **not started**; confirmed via `git diff --stat` that
`app/(auth)/register.tsx`, `app/(auth)/register.test.tsx`, `app/(auth)/verify-phone.tsx`, and
`app/(auth)/profile.tsx` show **zero diff** (empty output) after this run. No commit made.

### Reading done before touching anything

1. `.specify/memory/constitution.md` — full re-read (all eight Principles, Technology Stack,
   Governance).
2. `specs/010-registration-redesign/tasks.md` — T015, T016, T017 verbatim, their `Depends on:`
   lines, FR references, and the surrounding Phase 3 goal/Independent-Test text.
3. `specs/010-registration-redesign/plan.md` — Research Decision 1 (the draft/flow mechanism) in
   full, the Data Model section, and the Project Structure tree's exact file list for this phase.
4. `specs/010-registration-redesign/spec.md` — FR-001, FR-002, FR-003, FR-006, FR-013, FR-014,
   FR-017, User Story 1's acceptance scenarios, and Clarifications 1–4.
5. `docs/design-brief-registration-redesign.md` §2 (shared chrome), §3 (Usuario field list/order),
   §4 (Tienda field list/order).
6. `docs/conventions.md`, `docs/verification.md`.
7. Every module this batch consumes, read from disk (not from the plan's description of them, per
   the brief's explicit instruction — several gained props during T006's review round):
   `src/features/ui/Select.types.ts` (confirmed the five copy-override props:
   `retryLabel`/`searchPlaceholder`/`loadingLabel`/`filterAccessibilityLabel`/
   `closeAccessibilityLabel`), `src/features/ui/SegmentedControl.tsx`,
   `src/features/identity/DateField.types.ts`, `src/features/identity/FormField.tsx` (the
   `labelCase` prop, defaulting to `"uppercase"`), `src/domain/schemas.ts`
   (`usuarioCrearCuentaSchema`, `tiendaCrearCuentaSchema`, `tiendaProfileFormSchema`),
   `src/lib/registration-draft.ts`, `src/domain/i18n/copy/registration.ts`,
   `src/features/identity/authCardLayout.ts`. Also read in full before writing anything:
   `src/features/identity/RegistrationForm.tsx` (a11y radio pattern, consent-checkbox pattern),
   `src/features/identity/ProfileForm.tsx` (checkbox/field conventions), `src/features/ui/Select.tsx`
   + `.web.tsx` (exact rendered structure/testID scheme), `src/features/identity/DateField.tsx` +
   `.web.tsx`, `src/features/identity/LoginScreenChrome.tsx` + `.web.tsx` (the mobile-chrome/
   web-card-chrome split this feature's screen mirrors), `src/features/identity/LoginScreen.tsx`,
   `src/features/ui/PrimaryButton.tsx`, `src/domain/registration.ts` (the exact
   `submitPersonalRegistration`/`submitBusinessRegistration`/`retrySignIn`/`mapRegistrationError`
   signatures), `src/lib/api.ts`, `src/features/identity/useKycGate.ts` (`currentUserQueryKey`),
   `src/domain/i18n/copy/login.ts` + `src/features/identity/SignInForm.tsx` (the
   `useTranslation(copy)` consumption pattern), `src/features/i18n/LocaleContext.tsx`
   (confirmed `useLocale()` falls back to the default locale — Spanish — outside a
   `<LocaleProvider>`, so bare-render tests need no wrapper), and — the explicit regression-guard
   read — **`app/(auth)/register.tsx` and `app/(auth)/register.test.tsx` in full**, to understand
   the exact `sessionIssue`/`retrySignIn` mechanism (`001-registration-kyc` T031/T033) this batch
   must not regress.

### T015 — `src/features/identity/UsuarioForm.tsx` + `UsuarioForm.test.tsx`

React Hook Form + `zodResolver(usuarioCrearCuentaSchema)`, rendering every Usuario field in the
design brief §3 order via `FormField`/`labelCase="sentence"`: `Nombre(s)` / `Apellido paterno` /
`Apellido materno` (optional) / `Correo electrónico` / `Contraseña` (Clarification 1, directly
under email) / `Usuario` / `Fecha de nacimiento` (`DateField`) / `Celular` / `Nacionalidad`
(`Select`) / `CURP` / `RFC` (Clarification 2 — two separate inputs) / the two consent checkboxes /
`Registrarse`. All copy sourced from `useTranslation(registrationCopy)` — zero literal Spanish/
English strings.

**The seam the brief flagged explicitly is kept clean**: `UsuarioForm` does **not** call
`useNationalities()` itself. It accepts `nationalityOptions?`/`nationalityLoading?`/
`nationalityError?`/`onRetryNationality?` props (defaulting to `[]`/`false`/`undefined`/
`undefined`) and passes them straight through to `Select`'s `options`/`loading`/`error`/`onRetry`
— `CrearCuentaScreen` (T017) currently passes none of these through in production (no hardcoded
fallback list at any layer, matching spec.md's Edge Cases), and T020 (out of this batch) is what
wires the real hook at that call-site boundary.

**A real design bug found and fixed while implementing, not left for review to catch**: feeding
`errors.nationality?.message` (the plain "Nationality is required" client validation error)
directly into `Select`'s own `error` prop would have **disabled the picker's trigger** the moment
a user attempted an empty submit — `Select`'s `error` prop is designed for "the catalog failed to
load" (nothing to pick from, correctly disabling), not "you haven't picked one yet" (which must
stay clickable so the user can actually fix it). Fixed by giving the two error sources separate
rendering slots: `Select`'s `error` prop receives only `nationalityError` (the catalog-fetch
error); a schema-validation error on `nationality` renders through a small manual `<Text
accessibilityRole="alert">` alongside it instead. `UsuarioForm.test.tsx` has a dedicated regression
test for this exact scenario (`"keeps the Nacionalidad picker operable when only a validation
error ... is present"`) plus a companion test confirming a genuine catalog error still disables the
trigger and surfaces retry.

`UsuarioForm.test.tsx` (8 tests): every required field's own specific inline error on an empty
submit (SC-002 — asserted against the exact schema message strings, e.g. `"Enter a valid birth
date (YYYY-MM-DD)"`, `"Nationality is required"`, never a raw Zod default); `apellidoMaterno`'s
genuine optionality (submits successfully, and the resolved payload carries `undefined`, not `""`);
a successful submit with the full combined payload asserted field-by-field via
`toHaveBeenCalledWith`; a server-supplied field error rendering inline; the two Nacionalidad-error
regression tests above. `DateField`'s native picker is driven the same way `DateField.test.tsx`
itself already does (`UNSAFE_getByType(DateTimePicker)`, a synthetic `"set"` event) — the vendor's
own public `DateTimePickerEvent` contract, not an internal implementation detail. `Select` is
driven the same way `Select.test.tsx` already does (press trigger, press option by testID).

### T016 — `src/features/identity/TiendaForm.tsx` + `TiendaForm.test.tsx`

Same conventions as T015, `zodResolver(tiendaCrearCuentaSchema)`, rendering exactly the design
brief §4 field list in order: `Nombre comercial` / `Correo electrónico` / `Contraseña` / `Usuario`
/ `RFC` (ordinary styling, no `(PLD)` suffix per Clarification 3) / `Celular` / `Domicilio fiscal`
/ the two consent checkboxes / `Registrarse`.

**No personal-account field anywhere in this file** — not hidden, not disabled, not
rendered-then-filtered: absent. `TiendaForm.test.tsx` asserts this **negatively**, not just
positively: `queryByLabelText("Nombre(s)")`, `queryByLabelText("Apellido paterno")`,
`queryByLabelText("Apellido materno")`, `queryByLabelText("CURP")`,
`queryByText("Fecha de nacimiento")`, `queryByText("Nacionalidad")`,
`queryByTestId("usuario-birth-date-trigger")`, and `queryByTestId("usuario-nationality-trigger")`
are all asserted `null` in a dedicated test, in addition to the field list's own positive
assertions and an explicit check that `"RFC (PLD)"` never renders.

`TiendaForm.test.tsx` (5 tests): exact field set; the negative personal-field check above; missing
RFC shows `"RFC is required"` and does not call `onSubmit` (Acceptance Scenario 2); a successful
submit's exact combined payload; a server-supplied field error rendering inline.

### T017 — `src/features/identity/CrearCuentaScreen.tsx` + `.web.tsx` + `CrearCuentaScreen.test.tsx`

**One deliberate addition beyond the task's literal three-file list, disclosed here rather than
left implicit**: `src/features/identity/useCrearCuentaSubmit.ts`, a plain colocated hook (this
repo's own established convention per `docs/conventions.md` — "hooks... live beside the feature
that owns them") holding the submit/draft-write/session-issue/retry-sign-in orchestration both
platform files need. This mirrors `Select.types.ts`/`DateField.types.ts`'s own precedent of
creating an un-enumerated-in-prose shared file to keep two platform variants from silently
drifting — except here the shared surface is *behavior* (network calls, state transitions), not
just a prop *type*, so duplicating it verbatim across `.tsx`/`.web.tsx` (mirroring `Select`'s
own full-duplication precedent) would have meant a real bug-fix drift risk between platforms for
a screen this security/PII-sensitive (it handles the credentials used for `retrySignIn`, and
writes the CURP/RFC-bearing draft). `CrearCuentaScreen.tsx`/`.web.tsx` therefore differ **only**
in their surrounding chrome (mobile single-column `ScrollView` on `bg.page` vs. a centered white
card capped at `AUTH_CARD_MAX_WIDTH` on `bg.page`, mirroring `LoginScreenChrome.tsx`/`.web.tsx`'s
identical split) — both compose `SegmentedControl` (defaulting to `"usuario"`), the shared
title/subtitle chrome, and `UsuarioForm`/`TiendaForm`, driven by the one shared hook.

**Submit orchestration** (`useCrearCuentaSubmit.ts`), moved from where `app/(auth)/register.tsx`
currently has it (`001-registration-kyc` T031/T033) into this screen's new home, per `plan.md`'s
own "`CrearCuentaScreen.tsx`... owns the submit/draft-write orchestration" note — T018 (out of
this batch) is what will delete the now-superseded copy from `register.tsx`:

1. On Usuario submit: destructures the validated `UsuarioCrearCuentaInput` into
   `{ email, password, phone, username }` + the remainder, calls
   `submitPersonalRegistration(api, signInWithPassword, { email, password, phone, username })`
   (`src/domain/registration.ts`, **unchanged** — confirmed via `git diff`, this file was only
   read, never edited) — **exactly the four credential fields**, nothing else.
2. On Tienda submit: same split, calling `submitBusinessRegistration` with the same four fields.
3. On any successful registration response (**regardless of whether Supabase sign-in also
   succeeded**): calls `setCurrentUserId(result.user.id)`, merges `isBusiness` into the
   `currentUserQueryKey` cache entry (both carried forward byte-for-byte from
   `register.tsx`'s T033/T026 mechanism), and calls `setRegistrationDraft(draft)` with a
   `RegistrationDraft` (T009) built from the remaining fields — written **unconditionally, before**
   the `sessionError` branch, since the account exists either way and `verify-phone.tsx`'s later
   auto-submit (T019, out of scope) needs it whichever path the user takes to get there. **Nothing
   on this path ever calls `console.*`, puts the draft into a route param, or writes it to any
   storage** — grepped to confirm.
4. If `sessionError` is present: sets `sessionIssue` state (renders the recovery view below) and
   does **not** navigate. Otherwise: `router.replace("/verify-phone")` — the same target
   `register.tsx` already navigates to today.
5. `handleRetrySignIn`: calls `retrySignIn` with the held credentials (never the domain submit
   functions again, matching `register.tsx`'s existing "don't re-register" comment) and navigates
   to `/verify-phone` on success.

**`sessionIssue`/`retrySignIn` recovery UI — confirmed intact, not just "should still work"**: I
did not touch `app/(auth)/register.tsx` at all (`git diff --stat -- "app/(auth)/register.tsx"
"app/(auth)/register.test.tsx"` returns empty output — zero lines changed), so that file's own
mechanism is unmodified by construction. Separately, `CrearCuentaScreen` carries the *same*
mechanism forward into its own new home (since T018, which will delete the old copy from
`register.tsx`, is out of this batch — until T018 lands, the mechanism exists in **both** places,
which is expected and correct for a mid-feature checkpoint), and `CrearCuentaScreen.test.tsx` has
its own dedicated regression tests for it (`"shows the session-issue recovery view and does not
navigate when registration succeeds but sign-in fails"`, `"retries only the sign-in primitive on
Retry, and navigates once it succeeds"`) — both passing, both run against **both** platform
variants via the shared `describeCrearCuentaScreen` suite.

**Nacionalidad/backend-`015` disclosure, stated plainly per this feature's own SC-006 discipline**:
`CrearCuentaScreen` does not call `useNationalities()` (T020's job) — production renders the
Usuario tab's `Select` with an empty `nationalityOptions` array, matching spec.md's own Edge Cases.
This means a **full** "fill every Usuario field and submit successfully" test is not reachable at
the composed-screen level today (there is no nationality option to select) — that exact coverage
already exists, fully self-contained, in `UsuarioForm.test.tsx` (which injects its own
`nationalityOptions` prop directly, independent of any catalog). `CrearCuentaScreen.test.tsx`
verifies the screen's own job — tab switching, the four-credential-field split, the draft write,
navigation, and the sessionIssue/retry mechanism — through the **Tienda** tab instead, which needs
no catalog at all and exercises the exact same shared `useCrearCuentaSubmit` hook Usuario
submission would. This is a disclosed scope boundary, not an oversight.

`CrearCuentaScreen.test.tsx` (14 tests, run against **both** `CrearCuentaScreen` and
`CrearCuentaScreen.web` via one shared `describeCrearCuentaScreen(name, Component)` suite —
mirroring `LoginScreenChrome.test.tsx`'s own side-by-side-import pattern — plus 2 web-only chrome
tests): shared title/subtitle chrome renders and Usuario is selected by default (`FR-001`); the
segmented control actually swaps the rendered form (not just a visual change) and back; a
successful Tienda submit calls `submitBusinessRegistration` with **exactly** the four credential
fields, and `consumeRegistrationDraft()` (the real, unmocked module — not a mock assertion) returns
the exact expected `{ kind: "business", ... }` object; the `isBusiness` flag is cached under
`currentUserQueryKey`; the sessionIssue view renders and blocks navigation on a sign-in failure;
"Retry sign-in" retries only the sign-in primitive and navigates on success. Web-only: the card is
capped at `AUTH_CARD_MAX_WIDTH` (660, the same value `/login`'s own web card uses); the content is
wrapped in a real `ScrollView` (found via `UNSAFE_getAllByType(ScrollView).find(...)` by testID,
**not** the singular `UNSAFE_getByType` — the mounted-but-closed Nacionalidad `Select`'s `Modal`
keeps its `FlatList` mounted, whose own internal `ScrollView` would otherwise make a plain
`UNSAFE_getByType(ScrollView)` throw as ambiguous; found and fixed this during test-writing, not
left flaky).

**A registration-copy dictionary was extended (`src/domain/i18n/copy/registration.ts`, already
`[X]`/approved from Run 4)** — this was necessary, not optional: the `sessionIssue` recovery view
must route through `src/domain/i18n` like every other string on this screen (FR-007), but T013's
original dictionary had no keys for it (the sessionIssue mechanism predates this feature and wasn't
anticipated in that pass). Added six new keys (`sessionIssueTitle`, `sessionIssueBodyPrefix`,
`sessionIssueBodySuffix`, `retrySignInLabel`, `retrySignInBusyLabel` — `es`/`en` both), additive
only. The body is split into a prefix/suffix pair rather than one templated string, since
`translate()` only resolves static keys with no interpolation — the dynamic `sessionError` message
renders as its own inline `<Text>` between them, mirroring `loginCopy`'s own established convention
for nesting dynamic/linked spans as separate `Text` children rather than templating a single
string. `registration.test.ts`'s existing key-parity/no-empty-string tests still pass unchanged
against the extended dictionary (they assert set equality/no-empties generically, not an
exhaustive enumerated key list) — confirmed by re-running that suite.

### Full verification

```
$ npx jest src/features/identity/UsuarioForm.test.tsx src/features/identity/TiendaForm.test.tsx \
    src/features/identity/CrearCuentaScreen.test.tsx src/domain/i18n/copy/registration.test.ts --verbose
PASS src/features/identity/CrearCuentaScreen.test.tsx (14 tests)
PASS src/features/identity/UsuarioForm.test.tsx (8 tests)
PASS src/features/identity/TiendaForm.test.tsx (5 tests)
PASS src/domain/i18n/copy/registration.test.ts (7 tests)
Test Suites: 4 passed, 4 total
Tests:       32 passed (originally reported per-suite; combined total below)
```

```
$ node_modules/.bin/tsc --noEmit
(no output — clean)

$ npx jest
Test Suites: 85 passed, 85 total
Tests:       596 passed, 596 total
```

(Baseline before this run was 82 suites / 571 tests, per Run 4's own report — this run added 3 new
suites: `UsuarioForm.test.tsx`, `TiendaForm.test.tsx`, `CrearCuentaScreen.test.tsx`, totaling +25
tests; the pre-existing `registration.test.ts` suite grew from 7 to 7 tests in count but gained
locale-parity coverage of the 6 new keys within its existing generic assertions — no new suite
needed there.)

```
$ ./init.sh
▶ 1/8 Checking prerequisites          ✅ OK  node v20.20.2, npm v10.8.2
▶ 2/8 Environment file                ✅ OK  .env already exists, left untouched
▶ 3/8 Installing dependencies         ✅ OK  dependencies installed
▶ 4/8 Type-checking                   ✅ OK  no type errors
▶ 5/8 Expo config/dependency health   ⚠️  WARN  expo-doctor: outdated deps (pre-existing five-package set, unchanged)
▶ 6/8 Native dependency alignment     ⚠️  WARN  same pre-existing five-package set, unchanged
▶ 7/8 Running test suite              ✅ OK  all tests passed
▶ 8/8 Bundle export (web/iOS/Android) ✅ OK  all three platforms exported cleanly

RESULT: SUCCESS (10/10 stages passed)
```

Stage 5/6 warnings are byte-for-byte the same five packages (`expo-image-picker`, `react-native`,
`react-native-safe-area-context`, `@types/react`, `typescript`) documented as pre-existing/
non-blocking since Run 1 — **no new warning appeared**. No local Xcode/SDK-51 incompatibility
surfaced in this run's `expo-doctor` output (environment-dependent; stage 8's bundle-export checks
don't require a native toolchain either way).

Grepped every new file for stray `console.*` — none found. Grepped `useCrearCuentaSubmit.ts`
specifically (the file that touches `RegistrationDraft`/credentials) — confirmed no `console.*`
call anywhere on any code path that touches the draft or `sessionIssue.password`.

### Manual smoke check (Level 3) — explicitly not performed, and why

**No `npm run web` browser check was run for this batch, stated plainly rather than implied.**
`CrearCuentaScreen` has **zero route consumers** as of this run — `app/(auth)/register.tsx` still
renders the old `RegistrationForm` unchanged (confirmed: zero diff on that file), and T018 (the
task that would actually mount `CrearCuentaScreen` at `/register`) is explicitly out of this
batch's scope per the orchestrator's instruction. There is therefore no reachable screen this run
changed that a browser check could show — per `docs/verification.md`'s "an unreachable screen is
not a verified screen" discipline, running `npm run web` here would only reach the same
pre-`010` `/register` screen this batch didn't touch, which would be a misleading thing to report
as a check of this batch's own work. `./init.sh`'s stage 8 (web/iOS/Android bundle export)
confirms all three new/changed files compile and bundle cleanly on every target — the strongest
verification available for genuinely unreachable-yet code at this checkpoint. The real Level 3
check for this screen happens once T018 wires it into `/register` (a later, separate task's own
verification responsibility).

### Requirement traceability (this batch)

| FR | Covered by |
|---|---|
| FR-001 (one `Crear cuenta` screen, `Usuario`/`Tienda` segmented control, `Usuario` default) | `CrearCuentaScreen.test.tsx`'s "shows the shared title/subtitle chrome and defaults to the Usuario tab" and "switching the segmented control swaps the rendered form" (both variants) |
| FR-002 (Usuario tab field set/order) | `UsuarioForm.test.tsx` (all 8 tests) |
| FR-003 (Tienda tab field set/order, no personal field ever) | `TiendaForm.test.tsx` (all 5 tests, especially the negative "never renders a personal-account field" test) |
| FR-006 (token-only visual language) | `CrearCuentaScreen.web.test`'s `AUTH_CARD_MAX_WIDTH` test; no raw hex anywhere in the three new components (all styles source `@/theme`) |
| FR-008, FR-009 (three-call flow unchanged; draft survives the interruption, in-memory only) | `CrearCuentaScreen.test.tsx`'s "submits the Tienda tab with only the four credential fields, writes the draft, and navigates to /verify-phone" (asserts the exact 4-field call + the exact draft shape via the real, unmocked `consumeRegistrationDraft()`) |
| FR-013 (real date-picker control) | `UsuarioForm.test.tsx`'s birth-date-driving tests (all three submit-path tests exercise `DateField`) |
| FR-014 (platform split via file extension, never inline `Platform.OS`) | `CrearCuentaScreen.tsx`/`.web.tsx` differ only by file extension; neither imports `Platform` |
| FR-017, SC-002 (every required field's specific inline error, never a raw default) | `UsuarioForm.test.tsx`'s "shows every required field's specific inline error..." test (asserts 12 exact schema messages); `TiendaForm.test.tsx`'s missing-RFC test |

### Task IDs now `[X]`

- **T015, T016, T017** — all `[X]` in `specs/010-registration-redesign/tasks.md`.

**T018 and T019 remain `[ ]`, untouched**, per the orchestrator's explicit stop-at-T017 instruction
— confirmed no change to `app/(auth)/register.tsx`, `app/(auth)/register.test.tsx`,
`app/(auth)/verify-phone.tsx`, or `app/(auth)/verify-phone.test.tsx`.

### Files changed/added this run

- Added: `src/features/identity/UsuarioForm.tsx` + `UsuarioForm.test.tsx`;
  `src/features/identity/TiendaForm.tsx` + `TiendaForm.test.tsx`;
  `src/features/identity/useCrearCuentaSubmit.ts` (the one addition beyond the task's literal
  three-file list, disclosed above); `src/features/identity/CrearCuentaScreen.tsx`,
  `CrearCuentaScreen.web.tsx`, `CrearCuentaScreen.test.tsx`.
- Modified: `src/domain/i18n/copy/registration.ts` (six new `sessionIssue`/retry keys, additive
  only, `es`/`en` both — already an `[X]` file from Run 4, extended here as this batch's own
  copy needs required it).
- **Not touched** (confirmed via `git diff --stat`, empty output): `app/(auth)/register.tsx`,
  `app/(auth)/register.test.tsx`, `app/(auth)/verify-phone.tsx`, `app/(auth)/profile.tsx`,
  `src/domain/registration.ts`, `src/domain/profile.ts`.

### Deviations / findings needing sign-off

1. **One file added beyond the task's literal enumerated list**: `useCrearCuentaSubmit.ts`.
   Disclosed in full above with its rationale (avoiding a real drift risk between the two platform
   variants' submit/session-issue logic, mirroring this repo's own hook-colocation convention).
   This is a judgment call within the batch's own scope (no new dependency, no architecture
   change, no route wired) — flagged here per the "say which command/decision you made and why"
   discipline rather than left silent, but not something I believe needs to block T015–T017 being
   marked done; `code-reviewer` should confirm this reasoning is accepted.
2. **A real UX bug found and fixed during implementation, not a plan deviation**: `Select`'s
   `error` prop cannot safely carry a plain required-field validation message (it also disables
   the trigger) — documented and fixed inside `UsuarioForm.tsx` itself (see T015 above), with a
   dedicated regression test. This is a defect in how a Foundational-phase primitive (`Select`,
   already `[X]`/approved) gets *consumed*, not a defect in `Select.tsx` itself — `Select`'s own
   `error`-disables-trigger behavior is correct for its actual intended use (a catalog-load
   failure); the fix belongs at the call site, which is what T015 built.
3. No other deviation from `plan.md`/`tasks.md`. The registration-copy dictionary extension is an
   additive, backward-compatible change to an already-approved file, required by this batch's own
   FR-007 obligation (the sessionIssue view's copy) — not a redesign of anything T013 built.

---

## Run 6 — T018–T019 + Run 5 nit

**Scope**: T018 and T019 only, per the orchestrator's explicit instruction to stop before T020.
Also fixed the one carried-over Run 5 review nit (Finding 1: magic-number typography literals in
`CrearCuentaScreen.tsx`/`.web.tsx`'s `sessionTitle` style).

### Reading done before touching anything

1. `.specify/memory/constitution.md` (Principles II/III/IV, Governance).
2. `specs/010-registration-redesign/tasks.md` — T018, T019 verbatim (including T019's two
   draft-present branches and its draft-absent fall-through).
3. `specs/010-registration-redesign/plan.md` — Research Decision 1 (the full flow mechanism) and
   the Project Structure diagram's `register.tsx`/`verify-phone.tsx` entries.
4. `specs/010-registration-redesign/spec.md` — FR-001, FR-008, FR-009, FR-010, User Story 1's
   acceptance scenarios, and the cross-cutting Edge Cases section.
5. `progress/review_010-registration-redesign.md`'s "Review round 3" (T015–T017, what the
   orchestrator's brief called "Run 5" after `impl_...md`'s own section numbering — same content),
   in particular its "item 2" discussion of the unconditional-before-`sessionError` draft write and
   the Verdict's explicit carry-forward note about a possible scoping guard.
6. `app/(auth)/register.tsx`, `app/(auth)/verify-phone.tsx`,
   `src/features/identity/useCrearCuentaSubmit.ts`, `src/lib/registration-draft.ts`,
   `src/domain/profile.ts`, `src/domain/schemas.ts` (for `ProfileFormInput`/
   `BusinessProfileFormInput`/`tiendaProfileFormSchema`'s exact shapes).

### T018 — rewrote `app/(auth)/register.tsx`

`app/(auth)/register.tsx` is now thin glue only: it imports the bare `@/features/identity/
CrearCuentaScreen` specifier (no `.web` suffix) and renders `<CrearCuentaScreen />` with no local
state/props — mirroring `LoginScreen.tsx`'s own `./LoginScreenChrome` bare-import convention for
platform-extension resolution. Every behavior that used to live in this file (submit ->
navigate-to-`/verify-phone`, `setCurrentUserId(user.id)`, the `sessionIssue`/`retrySignIn`
recovery UI) was **not reimplemented here** — it already lives in `useCrearCuentaSubmit.ts`
(T017, approved in Run 5/Review-round-3), which `CrearCuentaScreen` already calls. I verified
byte-for-byte fidelity by reading `register.tsx`'s old version and `useCrearCuentaSubmit.ts` side
by side (both already quoted in this file's Run 5 report and the review's own "item 2" section):
same unconditional `setCurrentUserId` placement before the `sessionError` check, same
`currentUserQueryKey` merge-not-replace cache write, same `retrySignIn`-never-re-registers
comment, same navigation targets. No second copy was created; the old copy was deleted outright
by this rewrite.

Updated three test files that render this route directly:

- `app/(auth)/register.test.tsx` — rewritten to mirror `CrearCuentaScreen.test.tsx`'s own
  established mocking pattern, exercised through the real `./register` module. **Deliberately
  drives the Tienda tab, not the default-selected Usuario tab** — `CrearCuentaScreen` does not
  wire `useNationalities()` at this composed level (T020, out of this batch, unchanged from Run
  5), so the Usuario tab's Nacionalidad picker has no options to select and a full Usuario submit
  is genuinely unreachable here, exactly the reasoning `CrearCuentaScreen.test.tsx`'s own header
  comment already documents. Covers all three things the task explicitly names: a successful
  submit calling the real registration domain function with only the four credential fields and
  navigating to `/verify-phone`; the `sessionIssue` recovery view rendering (with the retry
  button) when registration succeeds but sign-in fails; `setCurrentUserId` being called in both
  the immediate-success and sessionIssue-then-retry paths. Also kept the pre-existing
  `isBusiness`-caching regression test.
- `app/(auth)/register.session-wiring.test.tsx` (T033 regression guard — the real, unmocked
  `src/domain/registration.ts`/`src/lib/api.ts` integration proving the `X-User-Id` header
  actually propagates via `setCurrentUserId`) — same Tienda-tab adaptation; the test's own point
  (the `setCurrentUserId`/header-wiring mechanism) doesn't depend on which tab produced the
  registration call, since `completeRegistration()` inside `useCrearCuentaSubmit.ts` doesn't
  branch on account type for that part of the flow.
- `app/(auth)/register.session-failure.test.tsx` (T034 regression guard — a real
  `signInWithPassword` network-level rejection landing on the sessionIssue view, not the generic
  registration-error path) — same Tienda-tab adaptation, same reasoning.

I did not find these three files named in T018's own task text, but leaving them un-updated would
have left the suite red (they call `getByLabelText("Email")`/press "Create account", which no
longer exist once `register.tsx` renders `CrearCuentaScreen`) — required to satisfy this batch's
own stated primary bar ("nothing that works today breaks").

### T019 — extended `app/(auth)/verify-phone.tsx`'s success handler

Implemented exactly as `tasks.md` specifies, plus one addition (see "Judgment call" below):

- `consumeRegistrationDraft()` is called first, unconditionally, once `verifyPhoneCode` resolves —
  same atomic read-and-clear contract as before (T009, unchanged).
- **Draft present** (and, per the judgment call below, confirmed for the account actually
  completing verification): `submitProfile(api, draftPayload, { isBusiness: draft.kind ===
  "business" })` fires immediately. Success -> `router.replace("/tutorial")` (the same destination
  `profile.tsx`'s own successful submit already reaches — confirmed by reading `profile.tsx`
  fresh, unchanged). Failure -> `router.replace("/profile")` (FR-010) — the draft was already
  cleared by `consumeRegistrationDraft()` before the `submitProfile` attempt, so this is a genuine
  re-entry, not a retry with cached values.
  - The business branch's payload only matches `tiendaProfileFormSchema`'s shape (narrower than
    `submitProfile`'s declared `BusinessProfileFormInput` parameter, which still requires the
    personal fields the Tienda tab never collects, pending backend `015` User Story 2) — passed
    via an explicit, commented `as unknown as BusinessProfileFormInput` cast, the documented,
    currently-expected gap `spec.md`'s User Story 2 Dependency note already discloses, not a
    silent widening. The client-side `schema.parse()`/backend rejection this produces today is
    exactly what routes to the `/profile` recovery branch until `015` ships — no frontend change
    needed when it does.
- **Draft absent**: falls through to exactly today's original, unconditional `router.replace(
  "/profile")` — unchanged, and explicitly tested (see below).

### Judgment call: the Run 5-review-flagged scoping guard — implemented, not just flagged

The review round covering T015–T017 explicitly carried forward a question for this task: whether
`consumeRegistrationDraft()` needs a guard against a *stale* draft — left behind by an earlier,
abandoned `sessionIssue` attempt — being wrongly picked up by an unrelated `/verify-phone` visit
in the same JS session. I traced a concrete, realistic path (not a contrived edge case):

1. User A fills `Crear cuenta`, registration succeeds, but Supabase sign-in fails (`sessionIssue`)
   — **no session is ever established for A**. The draft (name/CURP/RFC/etc.) sits unconsumed in
   memory.
2. Because A never got a session, `useKycGate`'s `hasSession` stays `false`, so the root gate does
   **not** block A from reaching `/login` — confirmed by reading `useKycGate.ts`/`kyc-gate.ts`
   directly, not assumed. A plausible path there requires no full page reload (which would clear
   module state and make this moot): `SignInForm.tsx` has a real `<Link href="/register">` from
   `/login`, so the reverse (browser Back from `/register` to `/login`) is an ordinary, expected
   SPA client-side navigation in `expo-router`, not a full reload.
3. A signs in as a **different, already-registered account B** (e.g. abandons registration,
   decides to log in instead) whose `phone Verified At` is still `null`. `resolveKycRoute()`
   (confirmed by reading `kyc-gate.ts`) routes `!phoneVerifiedAt` straight to `"verify-phone"`,
   and the root layout's `<Redirect>` fires reactively — B lands on `/verify-phone` with a real,
   valid session, in the same still-alive JS process A's abandoned draft is still sitting in.
4. Without a guard, B's `/verify-phone` success would silently consume and submit **A's** stale
   draft (name, CURP, RFC, birth date) as B's own profile — a genuine cross-account PII leak, not
   a cosmetic bug.

Given this is realistic (not requiring an unlikely full reload or a contrived multi-tab scenario)
and the review explicitly invited a judgment call rather than treating it as strictly
out-of-scope, I implemented a bounded, minimal guard rather than only flagging it:

- `src/lib/registration-draft.ts` (T009, previously approved) — added an `email: string` field to
  both `RegistrationDraft` union variants (not a new profile field being collected, just a scoping
  key) and a new pure export, `draftMatchesEmail(draft, email)` (case/whitespace-insensitive
  comparison; `null`/`undefined` never matches — fails closed under uncertainty, mirroring
  `kyc-gate.ts`'s own "never widen access under uncertainty" posture).
- `src/features/identity/useCrearCuentaSubmit.ts` (T017, previously approved) — both
  `handleUsuarioSubmit`/`handleTiendaSubmit` now pass the already-destructured `email` into the
  draft object they build (one line each; no other change).
- `src/lib/supabase-client.ts` — added `getCurrentSessionEmail()`, the RN/Expo-dependent half of
  the check (reads `supabase.auth.getSession()`), following the exact "MUST NEVER THROW, fail
  closed" shape `signInWithPassword`/`requestPasswordReset` in the same file already establish —
  a rejection here (the same network-level failure mode `useKycGate.ts`'s T034 fix already
  documents for the identical `getSession()` call) returns `null`, which `draftMatchesEmail`
  always treats as no match, rather than crashing an already-successful phone verification.
- `app/(auth)/verify-phone.tsx` — after consuming the draft, awaits `getCurrentSessionEmail()` and
  only auto-submits when `draftMatchesEmail(draft, sessionEmail)` is true; otherwise falls through
  to the ordinary `/profile` redirect, identical to the draft-absent case. The draft is still
  consumed (cleared) either way — a mismatched draft is discarded, not left for a third visitor.
- Updated the two already-approved tests this touches structurally:
  `src/lib/registration-draft.test.ts`'s fixtures (added `email` to both fixture drafts) and
  `src/features/identity/CrearCuentaScreen.test.tsx`'s one `toEqual(...)` draft-shape assertion
  (added the now-expected `email` field). Both are additive, not a rewrite of what those tests
  actually verify.
- Added a dedicated regression test in `verify-phone.test.tsx`: a present draft whose `email`
  does not match the current session's email is never auto-submitted and falls through to
  `/profile`, exactly like "no draft" — proving the leak path above is actually closed, not just
  asserted in a comment.

**Why I made this call instead of only reporting it**: the orchestrator's brief explicitly framed
this as within T019's own scope ("T019 is where a stale or mismatched draft would actually do
damage. Judge whether a guard is warranted here"), the leak is real PII exposure across accounts
(not a cosmetic issue), and the fix is small, bounded, and fully covered by new/updated tests
rather than an open-ended redesign. I did **not** touch `src/domain/profile.ts` or
`src/domain/registration.ts` (both stay unchanged, as instructed), and the guard adds no new
dependency, no global state, and no change to the backend contract. If `code-reviewer` or the
human orchestrator judges this should have been raised as a separate follow-up task instead of
folded into T019, the change is small and self-contained enough to revert independently of the
rest of this batch (it lives in exactly the four files listed above, each with its own dedicated
doc comment explaining why).

### Run 5 review nit — `CrearCuentaScreen`'s magic-number `sessionTitle` typography

Added `typography.heading.sm` (`fontSize: 22, fontWeight: "600"`) to `src/theme/typography.ts` as
a new sibling category to `display`/`body`/`label`/`button` — not a rename of an existing token,
since none of those fit (the finding's own reasoning: `display.lg` is `28`/`700` with the serif
`PLAYFAIR_DISPLAY_BOLD` family, wrong for a secondary in-flow heading). No color is carried by
this token (both call sites already source `color` from `colors.text.primary` directly), so no
new `contrast.test.ts` case is needed — the finding's own text confirmed this was purely about the
two numeric literals, not a color. Updated both `CrearCuentaScreen.tsx` and
`CrearCuentaScreen.web.tsx`'s `styles.sessionTitle` to read `typography.heading.sm.fontSize`/
`.fontWeight` instead of the inline `22`/`"600"` literals — same visual result, now token-sourced,
mirroring T002's `colors.segment.inactiveTrack` precedent the finding itself pointed at.

### Verification

```
$ node_modules/.bin/tsc --noEmit
(clean, zero errors)

$ npx jest
Test Suites: 85 passed, 85 total
Tests:       598 passed, 598 total

$ npx jest --testPathPattern "register|verify-phone" --verbose
PASS app/(auth)/register.session-wiring.test.tsx
PASS app/(auth)/register.session-failure.test.tsx
PASS app/(auth)/verify-phone.test.tsx (6 tests, including the new email-mismatch guard test)
PASS app/(auth)/register.test.tsx (4 tests)
Test Suites: 4 passed, 4 total
Tests:       12 passed, 12 total

$ ./init.sh   (no --skip-* flags)
RESULT: SUCCESS (10/10 stages passed)
```

Stage 5/6 WARNs are the same pre-existing, disclosed set every prior round of this feature has
reported (`expo-image-picker@15.0.7`, `react-native@0.74.0`,
`react-native-safe-area-context@4.10.1`, `@types/react@18.3.31`, `typescript@5.9.3`) — no new
warning attributable to this batch, confirmed by diffing against Run 5's own reported WARN text.
No local Xcode/SDK-51 incompatibility surfaced in this run (environment-dependent either way, per
the brief).

No manual smoke check (`npm run web`) was performed this run — T018/T019's own behavior (which
route renders which screen, the draft hand-off across `/verify-phone`) is a pure JS/router wiring
change with no new visual surface of its own (the screens it wires, `CrearCuentaScreen`/
`UsuarioForm`/`TiendaForm`, already had their own manual-smoke disclosure deferred to T023 in
`tasks.md`, which remains out of this batch's scope) — all new/changed behavior here is covered by
real RNTL tests exercising the actual rendered route, not implementation details.

### Requirement traceability (this batch)

| FR | Test(s) |
|---|---|
| FR-001 (one `Crear cuenta` screen reachable at `/register`) | `register.test.tsx` — renders `CrearCuentaScreen` via the Tienda tab, real submit flow |
| FR-008 (backend interaction stays the three existing calls; phone verification stays a visible, reachable step) | `register.test.tsx`'s successful-submit test; `verify-phone.test.tsx`'s draft-present-personal success test |
| FR-009 (profile-step values survive the phone-verification interruption in memory only, submitted automatically) | `verify-phone.test.tsx` — "auto-submits a present, confirmed personal draft...", plus the atomicity assertion (`consumeRegistrationDraft()` returns `undefined` after) |
| FR-010 (a failed automatic profile submission routes to the resumable `/profile` screen with the draft genuinely cleared, not retried) | `verify-phone.test.tsx` — "routes to /profile and leaves the draft cleared, not retried..." |
| FR-006 (token-only visual language) | `typography.ts`'s new `heading.sm` token + both `CrearCuentaScreen*.tsx` sourcing it (no `contrast.test.ts` case needed — no color carried) |
| Constitution III (registration-draft values never persisted/logged beyond the active attempt) | `verify-phone.test.tsx`'s email-mismatch test (a leak path closed) + `registration-draft.test.ts`'s existing atomicity suite (updated fixtures only) |

### `tasks.md` checklist status (this batch)

- [X] T018 — done, tests passing, `tsc`/`jest`/`init.sh` all green.
- [X] T019 — done, including the judgment-call guard described above, tests passing.

### Deviations / findings needing sign-off

1. **The email-scoping guard on `consumeRegistrationDraft()`** (described in full above) — a
   judgment call made within T019's own declared scope per the orchestrator's brief, not a
   silent addition. Touches two previously-approved files (`registration-draft.ts`,
   `useCrearCuentaSubmit.ts`) beyond `register.tsx`/`verify-phone.tsx` themselves. Flagged
   explicitly for `code-reviewer`/the human orchestrator to confirm or push back on.
2. **Three test files not named in T018's own task text were updated**
   (`register.test.tsx` was named; `register.session-wiring.test.tsx` and
   `register.session-failure.test.tsx` were not) — required because they render the real route
   directly against the old `RegistrationForm` field labels/button copy, which no longer exist
   after the rewrite. Both were adapted to drive the Tienda tab (the only tab fully fillable at
   this composed-screen level today, per T020 still being unimplemented) while preserving each
   file's own original regression-guard intent (real `X-User-Id` header wiring;
   real-`signInWithPassword`-rejection handling) unchanged.
3. No other deviation from `plan.md`/`tasks.md`.

---

## Run 7 — T020–T022 + carried-over test gaps

**Scope**: T020 (wire `useNationalities()` into `CrearCuentaScreen`/`UsuarioForm`), T021 (restyle
`ProfileForm.tsx` in place), T022 (delete superseded `RegistrationForm.tsx`/`.test.tsx`), plus
three narrow test-coverage gaps carried over from Review rounds 3/4 on already-approved code:
`getCurrentSessionEmail()`'s own unit test, `draftMatchesEmail()`'s case/whitespace edge cases,
and `useCrearCuentaSubmit`'s registration-failure path. Stopped after T022 per the brief — T023
(manual smoke check) is explicitly out of this run's scope.

### Reading done before touching anything

1. `.specify/memory/constitution.md`.
2. `specs/010-registration-redesign/tasks.md` — T020/T021/T022 verbatim, `Depends on:` lines.
3. `specs/010-registration-redesign/plan.md` — Research Decisions 1 (step 5), 5, 8.
4. `specs/010-registration-redesign/spec.md` — FR-006, FR-012, the nationality-catalog Edge Cases.
5. `progress/review_010-registration-redesign.md` — Review round 4's Findings 1/2, Review round
   3's Finding 2.
6. `docs/conventions.md`, `docs/verification.md`.

### T020 — wired `useNationalities()` at the `CrearCuentaScreen`/`UsuarioForm` boundary

**Files changed**:
- `src/domain/i18n/copy/registration.ts` — added `nationalityLoadError` (es: "No pudimos cargar
  el catálogo de nacionalidades.", en: "We couldn't load the list of nationalities.") to both
  locale dictionaries. This is the localized override for `useNationalities()`'s own deliberately
  un-localized fallback error string (that hook's own top comment states its caller is expected
  to override it — this is that override).
- `src/features/identity/CrearCuentaScreen.tsx` / `CrearCuentaScreen.web.tsx` — both now call
  `useNationalities()` once and pass `options`/`loading`/`onRetry` straight through to
  `UsuarioForm`'s matching props, with `error` re-localized via `t("nationalityLoadError")`
  before being passed down (so FR-007 holds on the one nationality state genuinely reachable
  today, since backend `015` hasn't shipped). No hardcoded fallback nationality list anywhere in
  the chain — confirmed by reading the full prop-threading path from `useNationalities()` through
  `UsuarioForm` to `Select`'s own `loading`/`error`/`onRetry` props (`Select.types.ts`).
- `src/features/identity/UsuarioForm.test.tsx` — added one new case: the loading state (disabled
  trigger + `Cargando…` accessibility label on the `Select`'s `ActivityIndicator`) using
  `nationalityLoading` directly as a prop (the error/retry states were already covered by T015's
  own tests, correctly flagged there as "T020's future wiring seam").
- `src/features/identity/CrearCuentaScreen.test.tsx` — added `jest.mock("./useNationalities", ...)`
  (both platform variants import from the same relative path, so one mock intercepts both) with a
  deterministic default (`{ options: [], loading: false, error: undefined, onRetry: jest.fn() }`)
  applied in every existing `beforeEach`, so none of the pre-existing Tienda-tab-focused tests
  became non-deterministic. Added a new shared `describeNacionalidadWiring` block, run against
  both platform variants, with four real-behavior cases: options reach the picker's rendered
  option list; the loading state disables the trigger and renders the loading indicator; a
  catalog-load error renders the LOCALIZED Spanish message (asserting the English fallback string
  is absent) and a working retry that re-invokes the real `onRetry` the hook returned; the
  no-error/no-loading state leaves the picker fully operable.

Updated the top-of-file disclosure comments in `CrearCuentaScreen.tsx`/`.web.tsx`/
`CrearCuentaScreen.test.tsx` (previously stating "CrearCuentaScreen does NOT call
useNationalities() itself — T020's job, out of this batch") to reflect that the wiring now
exists.

### T021 — restyled `ProfileForm.tsx` in place

**File changed**: `src/features/identity/ProfileForm.tsx` only (no schema/prop/behavioral
change).

- Every `<FormField>` now passes `labelCase="sentence"` (T004).
- Every raw hex literal removed — `styles` now sources `colors.text.danger`, `colors.text.primary`,
  `colors.text.secondary`, `colors.border.input`, `colors.brand.primary`, `radius.pill`,
  `typography.heading.sm`, `typography.body.input`, `typography.body.tagline`, `space.lg`/`.md`,
  mirroring `TiendaForm.tsx`'s/`UsuarioForm.tsx`'s own established style-block shape exactly.
  Confirmed via `grep -n "#[0-9a-fA-F]\{3,6\}"` on the file — zero matches.
- `input` style simplified to text-only properties (`fontSize`/`fontWeight`/`color`/`padding: 0`),
  since `FormField`'s own `inputContainer` already supplies the pill container
  (radius/background/height/padding) — the same division of responsibility `TiendaForm`/
  `UsuarioForm` already use, previously duplicated inconsistently in `ProfileForm`'s own
  `input`/`button` styles.
- The submit `Pressable` replaced with the shared `PrimaryButton` primitive (same
  `label`/`busy`/`testID` props, `label` alternates `"Save profile"`/`"Saving…"` exactly as
  before).
- **Every rendered string is byte-for-byte unchanged** — `"Complete your profile"`,
  `"Nombre"`/`"Apellido paterno"`/`"Apellido materno"`/`"Birth date"`/`"Nationality"`/`"CURP"`/
  `"RFC"`/`"Commercial name"`/`"Fiscal address"`, both consent-checkbox labels, the button copy,
  every `testID`. This was a deliberate choice, not an oversight: `ProfileForm.test.tsx`'s
  existing `getByLabelText`/`getByRole` assertions depend on these exact strings, and per the
  task's own instruction ("same fields, same resolver, same props, no structural change"),
  changing the copy would have been a behavioral change disguised as a style one.
- **Not done, deliberately** (per plan.md Research Decision 8, explicitly out of this task's
  scope): the business block still validates against `businessProfileFormSchema` (still requires
  personal fields), not narrowed to `tiendaProfileFormSchema` — today's real backend genuinely
  still requires those fields until backend `015` User Story 2 ships. Left a clarifying comment
  at the top of the file distinguishing this feature's own `T021` restyle from
  `001-registration-kyc`'s pre-existing `T026` business-block addition (a naming collision with
  this feature's own, separate, not-yet-done `T026` follow-up task).

**Test-file check**: `ProfileForm.test.tsx` has **zero pre-existing style-value assertions**
(confirmed via `grep -n "style\|StyleSheet"` — the only matches are prose comments) — so there
was nothing to update per the task's own conditional instruction ("where they assert on style
values"). All 11 existing tests pass unchanged, confirming behavioral parity.

### T022 — removed `RegistrationForm.tsx`/`.test.tsx`

Grepped the whole repo for `from ["'].*RegistrationForm["']` / `import.*RegistrationForm` before
deleting: the only real import was `RegistrationForm.test.tsx` importing its own file under test.
Every other match across the repo (`SegmentedControl.tsx`, `ProfileForm.tsx`, `UsuarioForm.tsx`,
`FormField.tsx`, `src/domain/registration.ts`'s `RegistrationFormField` type name, etc.) is either
a historical/comparative comment or an unrelated identifier, not an import. Deleted both files;
re-ran the same grep afterward — zero remaining matches of any kind.

### Three carried-over test gaps

1. **`getCurrentSessionEmail()`'s own "MUST NEVER THROW" contract** — `src/lib/supabase-client.test.ts`:
   added a `getCurrentSessionEmail` mock (`mockGetSession`, wired onto the same shared singleton
   auth object `mockSignInWithPassword`/`mockResetPasswordForEmail` already use — not the
   throwaway recovery client) and a new `describe` block mirroring `signInWithPassword`'s own
   three-case shape: resolves with a session -> returns the email; resolves with no session ->
   returns `null`; **the underlying SDK call REJECTS -> resolves to `null`, does not throw** (the
   actual regression case this gap existed to close — mirrors `signInWithPassword`'s own T034
   regression test exactly).
2. **`draftMatchesEmail()`'s case-insensitivity/whitespace-trimming** — `src/lib/registration-draft.test.ts`:
   added a `draftMatchesEmail` describe block with six real, non-mocked cases against the real
   comparison function: byte-identical match, complete mismatch, same-email-different-casing
   (both a fully-uppercase and a mixed-case variant), same-email-with-surrounding-whitespace,
   both combined at once, and the fail-closed `null`/`undefined` cases.
3. **`useCrearCuentaSubmit`'s registration-failure path** — `src/features/identity/CrearCuentaScreen.test.tsx`:
   added one case (both platform variants, via the existing `describeCrearCuentaScreen` shared
   block) mirroring the existing successful-Tienda-submit test's exact structure:
   `mockSubmitBusinessRegistration.mockRejectedValue(new ApiError(409, "UsernameTaken", "That
   username is already taken"))`, asserting the mapped message reaches the rendered form, no
   navigation occurs, `setCurrentUserId` is never called, and no draft is written
   (`consumeRegistrationDraft()` resolves `undefined`) — the exact wiring
   `mapRegistrationError`'s own unit test and the forms' own `serverError`-prop tests could not
   prove on their own, per Review round 3 Finding 2's own wording.

### Verification

```
$ node_modules/.bin/tsc --noEmit
(clean, zero errors)

$ npx jest
Test Suites: 84 passed, 84 total
Tests:       611 passed, 611 total
```

`./init.sh` (no `--skip-*` flags): `RESULT: SUCCESS (10/10 stages passed)`. Stages 5/6 carry the
exact same pre-existing, non-blocking WARN set as every prior round of this feature
(`expo-image-picker@15.0.7`, `react-native@0.74.0`, `react-native-safe-area-context@4.10.1`,
`@types/react@18.3.31`, `typescript@5.9.3`) — no new warning attributable to this batch. All
three bundle-export stages (web/iOS/Android) passed.

### Requirement traceability (this batch)

| FR | Test(s) | Status |
|---|---|---|
| FR-006 (token-only visual language) | `ProfileForm.tsx`'s restyle (no raw hex, `grep`-confirmed) — no new token needed, no new `contrast.test.ts` case (colors reused, all already covered) | Met |
| FR-007 (all copy via `src/domain/i18n`, Spanish default) | `CrearCuentaScreen.test.tsx`'s "surfaces a localized error..." case (asserts the Spanish message present, the English fallback absent) | Met |
| FR-012 (nationality picker, backend-served, no hardcoded fallback) | `CrearCuentaScreen.test.tsx`'s Nacionalidad wiring block (4 cases × 2 platform variants); `UsuarioForm.test.tsx`'s new loading-state case | Met for the buildable/testable half; real-network half stays `[BLOCKED-ON-015]` as documented |
| Constitution III (registration-draft never leaks cross-account; `getCurrentSessionEmail()` fails closed for real, not just under a mock) | `src/lib/supabase-client.test.ts`'s new `getCurrentSessionEmail` describe block; `src/lib/registration-draft.test.ts`'s new `draftMatchesEmail` describe block | Met — both carried-over gaps closed |

### `tasks.md` checklist status (this batch)

- [X] T020 — done, tests passing (Nacionalidad wiring genuinely exercised at the composed-screen
  level, not just at `UsuarioForm`'s own prop boundary).
- [X] T021 — done, `ProfileForm.tsx` restyled in place, zero raw hex remaining, all 11 existing
  tests pass unchanged (no style-value assertions existed to update).
- [X] T022 — done, `RegistrationForm.tsx`/`.test.tsx` deleted, zero remaining references
  confirmed by grep before and after.

### Deviations / findings needing sign-off

None. All three tasks were implemented as scoped in `tasks.md`, and the three carried-over test
gaps were fixed exactly as each review round's Finding described, without touching any other
already-approved behavior. `docs/verification.md`'s bar (real tests asserting behavior, `tsc`
clean, full suite green, `./init.sh` `RESULT: SUCCESS`) is met.

## Run 8 — T023 smoke-check defect fix

Fixes one defect T023's live-browser Level 3 check found (`progress/current.md`, "T023 — US1
manual smoke check"): `DateField.web.tsx`'s `RawDateInput` — a genuine raw DOM `<input>`, created
via `React.createElement("input", …)` because no react-native-web component renders a real
`type="date"` picker (see that file's original top comment; this mechanism is unchanged) — passed
its `testID` prop straight through to the DOM. React only recognizes real DOM attributes, and
React-DOM (unlike `react-test-renderer`, which is what `@testing-library/react-native` actually
renders through in this repo's Jest setup, and which accepts any prop name with no validation —
exactly why 611 prior green tests never caught this) logs an error-level console warning on every
render: "React does not recognize the `testID` prop on a DOM element." Confirmed live at
`/register`'s Usuario tab, component stack `RawDateInput → DateField → Controller → UsuarioForm →
CrearCuentaScreen → RegisterScreen`, per T023's finding.

### Files changed

- **`src/features/identity/DateField.web.tsx`** — `RawDateInput` now destructures `testID` out of
  its own props and forwards it to `React.createElement` renamed to `data-testid`:
  `function RawDateInput({ testID, ...props }: RawDateInputProps) { return
  React.createElement("input", { ...props, "data-testid": testID }); }`. This mirrors what
  react-native-web's own host components already do internally for every *other* field in this
  codebase (`node_modules/react-native-web/dist/cjs/modules/createDOMProps/index.js`:
  `domProps['data-testid'] = testID`) — `Select.web.tsx` and `FormField.web.tsx` (the two
  precedents named in the task) never hit this bug themselves only because they render through
  real react-native-web components (`View`/`Pressable`/`TextInput`), which already do this rename
  before anything reaches the DOM; `RawDateInput` bypasses react-native-web entirely (it has to,
  per that file's top comment — `TextInput` unconditionally overwrites `type`), so it has to do
  the same rename itself. `DateField`'s own public prop stays `testID` — no caller
  (`UsuarioForm.tsx`, `DateField.tsx`, the shared `DateFieldProps` contract) changed. The
  `React.createElement("input", …)` approach itself is untouched, per the task's explicit
  constraint.
- **`src/features/identity/DateField.web.test.tsx`** — updated by the orchestrator directly
  (mid-task, not by me — see below), not left as I last edited it. The four existing behavioral
  queries were switched from `screen.getByTestId("birth-date-input")` to
  `screen.getByLabelText("Fecha de nacimiento")` (the raw `<input>` already carries
  `aria-label={label}`), because RNTL's `getByTestId` only ever matches the literal `node.props.testID`
  — which the fix, correctly, no longer forwards to this node. Continuing to query by `testID`
  would have required resurrecting the exact bug being fixed just to keep the old query working.
  `getByLabelText` resolves the identical host node and every assertion on it (`props.type`,
  `props.value`, the four `fireEvent` change payloads) is unchanged in strength — it additionally
  documents that the field is reachable the way a screen-reader user reaches it. A sixth test was
  added asserting both directions directly: `input.props["data-testid"]` equals the expected id
  AND `input.props.testID` is `undefined` (checking only the former would still pass if `testID`
  were forwarded alongside `data-testid`, which would still trigger the browser warning).

### Why I didn't keep `testID` reaching the node (a real trade-off, not overlooked)

I initially converted `RawDateInput` to *drop* `testID` from the object passed to
`React.createElement` entirely (matching what's in the repo now). I confirmed by inspection
(`node_modules/@testing-library/react-native/build/queries/test-id.js`:
`matches(testId, node.props.testID, …)`) that RNTL's `getByTestId` only ever reads
`node.props.testID` — there is no `data-testid` fallback in this installed version (13.3.3), no
`configure({ testIdAttribute })` escape hatch either (checked `config.js`). Passing *both*
`testID` and `data-testid` to `React.createElement` would have kept the old queries working but
would not have fixed the actual defect — React-DOM in a real browser still warns on an
unrecognized `testID` attribute regardless of whether `data-testid` is present alongside it, since
the same `props` object reaches both `react-test-renderer` (Jest) and `react-dom` (the real
Metro-bundled web build) unchanged; there is no environment-conditional branch in this file. So
the only way to genuinely close the defect was to stop forwarding `testID` to the DOM node, which
meant the four old `getByTestId` queries necessarily broke and had to be re-pointed at a real,
still-present attribute of that node.

### Verified: the new test is genuinely red before the fix, green after

Independently confirmed (not just accepted the orchestrator's report) by reverting only
`RawDateInput` in a scratch copy back to its pre-fix body (`const RawDateInput = (props:
RawDateInputProps) => React.createElement("input", props);`) against the *current*
`DateField.web.test.tsx`, then running that one file:

```
$ npx jest src/features/identity/DateField.web.test.tsx   # pre-fix RawDateInput
✓ renders the label and a real <input type=date> with an empty value when unset
✓ renders the DOM input's value as ISO YYYY-MM-DD when a Date is set
✓ emits a real Date matching the typed/picked ISO value on change
✓ does not call onChange for an incomplete/invalid typed value
✕ passes the test id to the DOM as `data-testid` and never as React Native's `testID`
   Expected: "birth-date-input"  Received: undefined
✓ renders an inline error when provided
Tests: 1 failed, 5 passed, 6 total
```

Confirms two things: (1) the new regression test genuinely fails against the buggy component —
the exact bar the task set — and (2) the four rewritten `getByLabelText` queries were not
themselves what caused red; they pass identically pre- and post-fix, since `aria-label` was never
part of the bug. Restored the fix immediately after (`RawDateInput` back to the `data-testid`
version) and reran:

```
$ npx jest src/features/identity/DateField.web.test.tsx   # post-fix RawDateInput
Tests: 6 passed, 6 total
```

### Sweep for the same bug class elsewhere in this feature

Per the task's instruction, grepped every `.web.tsx` file this feature touched or added
(`git status --porcelain -- '*.web.tsx'`: `FormField.web.tsx` (modified), `LoginScreenChrome.web.tsx`
(modified, out of scope — pre-existing from 006), `CrearCuentaScreen.web.tsx` (new), `DateField.web.tsx`
(new), `Select.web.tsx` (new)) for `React.createElement`, raw HTML tag JSX (`<input`, `<div`,
`<span`, `<button`), and `data-testid`:

```
$ git status --porcelain=v1 -- '*.web.tsx' '*.web.test.tsx' | awk '{print $2}' | \
  xargs grep -n "createElement\|<input\|<div\|<span\|<button"
```

Only `DateField.web.tsx` matched (its own `React.createElement("input", …)` call, the file already
fixed). `CrearCuentaScreen.web.tsx`, `Select.web.tsx`, and `FormField.web.tsx` render exclusively
through real react-native-web components (`ScrollView`/`View`/`Text`/`Pressable`/`TextInput`),
which already perform the `testID` → `data-testid` rename internally before anything reaches the
DOM — confirmed by reading each file in full, not just grepping. **Nothing else in this feature's
new/changed `.web.tsx` code has the same bug class.** `RawDateInput` was the only place that
constructs a DOM element directly rather than through a react-native-web component, which is
exactly what made it exempt from that automatic rename.

### Verification run

```
$ node_modules/.bin/tsc --noEmit
(clean, zero errors)

$ npx jest
Test Suites: 84 passed, 84 total
Tests:       612 passed, 612 total
```

`./init.sh` (no `--skip-*` flags): `RESULT: SUCCESS (10/10 stages passed)`. Stages 5/6 carry the
same pre-existing, non-blocking WARN set as every prior round of this feature
(`expo-image-picker@15.0.7`, `react-native@0.74.0`, `react-native-safe-area-context@4.10.1`,
`@types/react@18.3.31`, `typescript@5.9.3`, plus the local Xcode/SDK-51 note carried in
`docs/verification.md`) — no new warning attributable to this batch. All three bundle-export
stages (web/iOS/Android) passed.

### Requirement traceability (this batch)

| FR | Test(s) | Status |
|---|---|---|
| FR-013 (web date field uses the browser's native `<input type="date">`) | `DateField.web.test.tsx`'s new "forwards testID to the DOM as data-testid, never as the RN-only testID prop" case (added this run); all five pre-existing FR-013 cases in the same file continue to pass against the fixed component | Met — regression closed |

### `tasks.md` checklist status (this batch)

No task IDs changed. T007 and T020 (already `[X]`) own `DateField.web.tsx`; T023 (already `[X]`)
is the manual smoke check whose finding this run fixes. Per the task brief, this is a fix to
already-completed work, not a new or renumbered task — `tasks.md` is unmodified.

### Deviations / process note for the record

The component fix (`RawDateInput` renaming `testID` → `data-testid`) is exactly as I designed and
wrote it. The four pre-existing test queries in `DateField.web.test.tsx` and the new sixth test
were edited directly by the orchestrator mid-task (not by me) after my fix broke those four
queries and the repo's Stop hook — which runs `./init.sh` on every turn boundary — was blocking on
the red suite. I did not author that edit, but I independently verified it afterward (see "Why I
didn't keep `testID` reaching the node" and "Verified: the new test is genuinely red before the
fix, green after" above) rather than taking the report of it on faith, and it holds up: it's the
only viable fix given RNTL 13.3.3's `getByTestId` implementation, every rewritten assertion is
equal or stronger than what it replaced, and the new regression test is confirmed genuinely red
pre-fix / green post-fix.

---

## Run 9 — T024, T026

**Scope**: T024 and T026 only, per the orchestrator's explicit instruction. T025 (the manual
Tienda-tab smoke check) explicitly skipped — the orchestrator ran it directly, in parallel, and
marked it `[X]` itself (confirmed via `git diff`/re-read of `tasks.md` mid-task; not touched by
me). T027 onward untouched. `src/features/identity/DateField.web.tsx` and
`DateField.web.test.tsx` were not opened or modified, per the explicit instruction not to touch
them.

### Reading done before touching anything

1. `.specify/memory/constitution.md` — Principles II/III/IV, Governance.
2. `specs/010-registration-redesign/tasks.md` — T024 and T026 verbatim, their Depends-on lines,
   and the Phase 4 Checkpoint.
3. `specs/010-registration-redesign/plan.md` — Research Decision 8 (the `/profile` business-block
   follow-up this task records).
4. `specs/010-registration-redesign/spec.md` — FR-003, FR-008, and User Story 2's Dependency note
   ("as of this writing, the backend's `profileBusinessSchema` still requires every personal
   field ... none of which the Tienda tab collects").
5. `docs/conventions.md`, `docs/verification.md`.
6. Source read before editing: `app/(auth)/verify-phone.tsx` (the `completeProfileFromDraft`
   branch T024 extends coverage for), `app/(auth)/verify-phone.test.tsx` (the existing
   personal-draft-success/failure/draft-absent/email-scoping-guard tests, to match their
   established mocking shape exactly rather than inventing a new one), `src/lib/
   registration-draft.ts` (the `RegistrationDraft` business variant's exact field shape —
   `commercialName`/`rfc`/`fiscalAddress`/`tosAccepted`/`privacyAccepted`, no `email`/`kind` once
   destructured), `src/domain/schemas.ts` (`tiendaProfileFormSchema`'s exact field set, confirmed
   directly rather than assumed), `src/features/identity/ProfileForm.tsx` (the `isBusiness`
   conditional block T026 comments, plus its existing T021/001-T026 comments already there, to
   place the new comment consistently rather than duplicating what's already said elsewhere in the
   file).

### T024 — explicit business-draft-path test in `verify-phone.test.tsx`

The orchestrator's brief was explicit that this needed to be a direct assertion, not incidental
coverage riding on T019's generic `kind === "personal"` branch test. Added:

- A `BUSINESS_DRAFT` fixture constant (mirrors `PERSONAL_DRAFT`'s existing shape/placement
  exactly): `{ kind: "business", email: "tienda@example.com", commercialName: "Tienda Ana", rfc,
  fiscalAddress, tosAccepted: true, privacyAccepted: true }`.
- A new test, `"auto-submits a present, confirmed business draft with isBusiness: true and a
  tiendaProfileFormSchema-shaped payload"`, placed directly after the existing personal-draft
  success test (same file position, same `mockVerifyPhoneCode`/`mockGetCurrentSessionEmail`/
  `mockSubmitProfile`/`setRegistrationDraft` mocking pattern every other test in this file already
  uses — no new mocking style introduced). Asserts:
  - `mockSubmitProfile` is called with exactly `{ commercialName, rfc, fiscalAddress,
    tosAccepted: true, privacyAccepted: true }` (the `tiendaProfileFormSchema`-shaped payload,
    `email`/`kind` stripped) and `{ isBusiness: true }` as the options argument — matching
    `verify-phone.tsx`'s own `completeProfileFromDraft` business branch exactly (read directly
    before writing the assertion, not assumed).
  - Navigation reaches `/tutorial` on success (same destination the personal path reaches).
  - The payload genuinely carries **no** personal-account field — explicit
    `not.toHaveProperty("nombre"/"birthDate"/"nationality"/"curp")` checks on the actual call
    argument, directly encoding FR-003's "no personal-account field" requirement at the payload
    level, not just at the form-rendering level `TiendaForm.test.tsx` already covers.
  - The draft is genuinely consumed (a second `consumeRegistrationDraft()` call returns
    `undefined`), mirroring the personal test's own atomicity assertion.
- Extended the file's top doc comment with a short paragraph naming this addition and its FR
  tags, matching the file's existing convention of documenting each run's extension there.

This intentionally tests the **frontend contract** only (what gets sent, with `isBusiness: true`)
— not that the backend accepts it, per the orchestrator's explicit framing and spec.md's own
User Story 2 Dependency note (today's real `profileBusinessSchema` is expected to reject this
payload until backend `015` User Story 2 ships; that expected-failure outcome is T025's concern,
already recorded there, not this test's).

```
$ npx jest verify-phone.test
PASS app/(auth)/verify-phone.test.tsx
  VerifyPhoneRouteScreen
    ✓ calls verifyPhoneCode and navigates to /profile on a correct-code submission (draft-absent, unchanged)
    ✓ renders an inline error for a wrong code and does not navigate
    ✓ calls resendVerificationCode once and disables the resend button during the cooldown
    ✓ auto-submits a present, confirmed personal draft and navigates to /tutorial on success
    ✓ auto-submits a present, confirmed business draft with isBusiness: true and a tiendaProfileFormSchema-shaped payload
    ✓ routes to /profile and leaves the draft cleared, not retried, when the automatic profile submission fails
    ✓ does not auto-submit a draft written for a different account, and falls through to the ordinary /profile redirect

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

### T026 — comment-only follow-up note in `ProfileForm.tsx`

Added a new, clearly-dated (`2026-08-06`) block comment directly above the existing
`{isBusiness ? (` conditional (the same block T021's file-header comment already forward-referenced
as "a separate, later task records that explicit `015`-gated follow-up"). The comment states
plainly:
- This block still validates against `businessProfileFormSchema` (still requiring the personal
  fields `TiendaForm.tsx` never collects).
- Once backend `015` User Story 2 ships, it should switch its resolver to `tiendaProfileFormSchema`
  (`src/domain/schemas.ts`) instead.
- It is explicitly **not implemented here** — deliberately left as-is because today's real backend
  still requires those personal fields, so narrowing this now would make this recovery screen fail
  for exactly the Tienda users it exists to help (restating plan.md Research Decision 8's own
  reasoning inline, not just cross-referencing it).

No code changed — confirmed via `git diff -- src/features/identity/ProfileForm.tsx`, which shows
only the new comment lines inserted (the rest of the file's diff, visible in a full `git diff`
against `HEAD`, is entirely T021's already-`[X]`, still-uncommitted restyle from a prior run —
none of it touched by this edit).

### Full verification

```
$ node_modules/.bin/tsc --noEmit
(no output — clean)

$ npx jest
Test Suites: 84 passed, 84 total
Tests:       613 passed, 613 total
```

613 = the 612-test baseline stated in this task's brief, plus the one new business-draft test
added above — zero regressions, zero test removed/weakened.

```
$ ./init.sh
▶ 1/8 Checking prerequisites          ✅ OK  node v20.20.2, npm v10.8.2
▶ 2/8 Environment file                ✅ OK  .env already exists, left untouched
▶ 3/8 Installing dependencies         ✅ OK  dependencies installed
▶ 4/8 Type-checking                   ✅ OK  no type errors
▶ 5/8 Expo config/dependency health   ⚠️  WARN  expo-doctor: same pre-existing five-package set
▶ 6/8 Native dependency alignment     ⚠️  WARN  same pre-existing five-package set, unchanged
▶ 7/8 Running test suite              ✅ OK  all tests passed (84 suites / 613 tests)
▶ 8/8 Bundle export (web/iOS/Android) ✅ OK  all three platforms exported cleanly

RESULT: SUCCESS (10/10 stages passed)
```

Stage 5/6 warnings are the exact same five packages (`expo-image-picker`, `react-native`,
`react-native-safe-area-context`, `@types/react`, `typescript`) documented as pre-existing/
non-blocking in every prior run of this feature — no new warning appeared.

### Manual smoke check (Level 3)

Not performed by me for this batch — T025 (the Tienda-tab manual smoke check) was explicitly
carved out to the orchestrator, running in parallel against a locally running backend. T024/T026
are a test-file extension and a comment-only doc note respectively, neither of which changes any
rendered screen; there is nothing new for a `npm run web` pass to observe beyond what T023's own
prior smoke check already covered structurally. Per `docs/verification.md`'s discipline, stating
this plainly rather than performing a check that couldn't show anything new.

### Requirement traceability (this batch)

| FR | Covered by |
|---|---|
| FR-003 (Tienda tab collects only its own field set, no personal-account field, at any point in the flow) | `verify-phone.test.tsx`'s new business-draft test — the `not.toHaveProperty` assertions directly encode this at the auto-submitted payload level, not just the form-rendering level `TiendaForm.test.tsx` already covers |
| FR-008 (backend interaction stays the three existing calls; the profile step carries the business fields via `isBusiness: true`) | same new test — asserts `submitProfile` is called with `{ isBusiness: true }` and the exact `tiendaProfileFormSchema`-shaped payload |

### Task IDs now `[X]`

- **T024** — `[X]` in `specs/010-registration-redesign/tasks.md` (marked by me).
- **T026** — `[X]` in `specs/010-registration-redesign/tasks.md` (marked by me).
- **T025** — left as the orchestrator marked it (`[X]`, observed via a mid-task re-read of
  `tasks.md` after a system notification that the file had been modified concurrently) — not
  touched or re-marked by me, per the explicit "leave T025 unchecked, the orchestrator will mark
  it" instruction; it was already `[X]` by the time I finished, from the parallel run, not from
  anything I did.

### Files changed this run

- `app/(auth)/verify-phone.test.tsx` — added `BUSINESS_DRAFT` fixture, one new test, and a short
  doc-comment addition at the top of the file.
- `src/features/identity/ProfileForm.tsx` — added one new, dated, comment-only block above the
  `isBusiness` conditional; no code change (verified via `git diff`).
- `specs/010-registration-redesign/tasks.md` — T024 and T026 marked `[X]`.

### Deviations / findings needing sign-off

None. Both tasks were implemented exactly as specified, using the established patterns already
present in each file (no new mocking style, no new comment convention). `DateField.web.tsx`/
`DateField.web.test.tsx` were not opened at any point in this run.

---

## Run 10 — T027

**Scope**: the accessibility pass (FR-015, Constitution VII) across every component this
feature built or restyled — `SegmentedControl`, `Select`/`Select.web`, `DateField`/
`DateField.web`, `UsuarioForm`, `TiendaForm`, `CrearCuentaScreen`(+`.web`), and the restyled
`ProfileForm`. T028/T029 were explicitly out of scope for me (the orchestrator ran those live,
in parallel) and were not touched.

### What was audited, and the verdict on each

- **Labels/roles**: every text input has a matching `accessibilityLabel`; the segmented control
  is `radiogroup`/`radio`, checkboxes are `role="checkbox"`, `Select`'s native trigger is
  `role="button"` and the web trigger is `role="combobox"`, error text is `role="alert"`. No
  finding.
- **Minimum 44×44 tap targets**: `CONTROL_HEIGHT = 56` (`src/theme/geometry.ts`) covers every
  text input/`Select`/`DateField` trigger; every checkbox row is `minHeight: 44` and stretches to
  the form's full width (the container's default `alignItems: "stretch"`), not just the visible
  24×24 box; `Select`'s retry button and native option rows are `minHeight: 44`. No finding.
- **Keyboard operability on web — tab order/visible focus**: DOM order matches visual order
  throughout (no `order` styling anywhere in this feature); no element strips the browser's
  default focus outline **except** `DateField.web.tsx`'s raw `<input type="date">`, which sets
  `outline: "none"` in its `rawInputStyle` object (line 120) with no replacement focus style —
  see "Reported, not fixed" below.
- **Keyboard operability on web — Enter/Space activation (real finding, fixed)**: read this
  repo's pinned react-native-web (0.19.13) source directly
  (`node_modules/react-native-web/dist/cjs/modules/usePressEvents/PressResponder.js`,
  `isValidKeyPress`) rather than assuming — it only treats the **Space** key as a valid
  `Pressable` activation key when the rendered DOM `role` is literally `"button"`
  (`isButtonRole`). Every other `accessibilityRole` this feature uses (`checkbox`, `radio`,
  `combobox`) gets **Enter** for free (that branch has no role restriction) but **silently drops
  Space** — confirmed by reading the library source, the same class of "passes every test, fails
  a real keyboard user" defect the task brief flagged for `accessibilityState`. This is a second,
  distinct instance of a react-native-web keyboard/accessibility gap in this exact pinned
  version, not the `accessibilityState`-forwarding one (which `SegmentedControl`'s/the consent
  checkboxes'/`Select.web`'s `aria-checked`/`aria-expanded`/`aria-selected` top-level props
  already handle correctly — verified, not just assumed unchanged).
- **`Select`'s arrow-key navigation + `Escape`-to-dismiss**: already correct (T006), re-verified
  by re-reading `Select.web.tsx` and its existing passing tests — no finding.
- **The nationality `Select`'s error/retry state specifically** (called out by the orchestrator
  as the state real users actually reach today): the trigger is correctly `disabled` (so Enter/
  Space on it are both no-ops, verified — see the new "does not open on a Space keydown while
  disabled" test below) and the `Reintentar` retry action is a `role="button"` element, so it
  already had full Enter/Space/click operability before this run; no finding there beyond the
  general trigger fix above (which matters once the catalog loads successfully and the trigger
  becomes enabled).

### Fix: `spaceKeyActivation` (FR-015)

Added `src/features/ui/webKeyActivation.ts` (+ `webKeyActivation.test.ts`) — a small,
dependency-free helper mirroring `001-registration-kyc` T028's `aria-checked` fix pattern exactly
as the task brief asked: `spaceKeyActivation(activate, disabled?)` returns `{ onKeyDown }`,
handling **only** the Space key (never Enter — react-native-web already fires `onPress` for
Enter regardless of role, so handling it too would double-activate) and calling
`event.preventDefault()` to stop the browser's default page-scroll-on-Space, exactly mirroring
what react-native-web's own `PressResponder` already does internally for `role="button"`.

**Why a returned object spread onto `Pressable`, not a literal JSX prop**: `onKeyDown` is not
part of the `PressableProps` type this repo's pinned `react-native` package declares (confirmed:
`grep`'d `node_modules/react-native/Libraries/Components/Pressable/Pressable.d.ts` — no
`onKeyDown` member). Passing it as a literal JSX attribute fails `tsc --noEmit` (verified with a
throwaway scratch file, then deleted). Spreading a *variable* of that shape onto `<Pressable>`
passes strict `tsc --noEmit` cleanly (also verified with a throwaway scratch file before
committing to this approach) because TypeScript's excess-property check only applies to object
*literals* written directly in JSX attribute position, not to a spread of a differently-shaped
variable — no `@ts-ignore`/`any`-widening anywhere, strict mode fully intact
(`docs/conventions.md`). Confirmed harmless on iOS/Android by reading `react-native`'s own
`Pressable.js`: unrecognized props land in `...restProps`, spread onto the underlying `View`,
which native platforms simply never fire a `keydown`-shaped event against — the same "no-op on
native" precedent the existing `aria-checked` top-level props already established for this exact
react-native-web version, not a new pattern.

Applied at every `role="checkbox"`/`role="radio"`/`role="combobox"` Pressable this feature
introduced:
- `src/features/ui/SegmentedControl.tsx` — each segment's radio Pressable.
- `src/features/ui/Select.web.tsx` — the trigger's `combobox` Pressable (Space now
  opens/closes the panel, matching Enter's existing behavior and the WAI-ARIA select-only-
  combobox pattern, which conventionally supports both).
- `src/features/identity/UsuarioForm.tsx` — both consent checkboxes.
- `src/features/identity/TiendaForm.tsx` — both consent checkboxes.
- `src/features/identity/ProfileForm.tsx` — both consent checkboxes (in scope as the "restyled
  `ProfileForm`" T027 explicitly names).

`Select.tsx` (native), `DateField.tsx` (native, `role="button"` — already Space-operable via
react-native-web's own default), and `PrimaryButton.tsx` (`role="button"` — same) needed no
change; verified, not assumed.

### Reported, not fixed: `DateField.web.tsx`'s `outline: "none"`

Per the explicit instruction that this file is off limits for edits (just settled after a
concurrent-edit collision, verified correct in a live browser): its `rawInputStyle` object
(line 120) sets `outline: "none"` on the raw `<input type="date">` with **no replacement focus
style**, which removes the browser's default visible-focus ring for a keyboard user tabbing to
this field — a genuine finding against FR-015's "visible focus" requirement. **Not edited.**
Flagging for whoever next touches this file (or for explicit sign-off to touch it in a follow-up)
to either drop the `outline: "none"` line (letting the browser default ring show) or replace it
with an explicit `outline`/`boxShadow` focus-visible style matching this feature's token layer.

### Tests written/run

New/changed test files (all real RNTL assertions on rendered output/behavior, not smoke tests,
per `docs/verification.md` Level 2 — and Level 1 for the pure-function helper):
- `src/features/ui/webKeyActivation.test.ts` (new) — 5 tests: Space activates + calls
  `preventDefault`, the legacy `"Spacebar"` key value also works, Enter/other keys/no-key are
  correctly ignored (Enter is react-native-web's own job, not this helper's), `disabled` blocks
  activation, and a missing `preventDefault` on the event object doesn't throw.
- `src/features/ui/SegmentedControl.test.tsx` — added "activates a segment on a Space keydown,
  not just a press (FR-015)".
- `src/features/ui/Select.web.test.tsx` — added two tests: Space opens/closes the trigger's
  dropdown panel, and Space does nothing while the trigger is `disabled` by a catalog error (the
  state the orchestrator flagged as the one real users actually reach today).
- `src/features/identity/UsuarioForm.test.tsx` — added "toggles the consent checkboxes on a
  Space keydown, not just a press (FR-015)".
- `src/features/identity/TiendaForm.test.tsx` — same, for the Tienda tab's two checkboxes.
- `src/features/identity/ProfileForm.test.tsx` — same, for the restyled recovery screen's two
  checkboxes.

One non-obvious implementation detail these new tests had to account for, found while writing
them (not assumed): `getByTestId(...).props["aria-checked"]` is **not** how to read a
`Pressable`'s checked state from the *rendered host node* in this Jest environment — real
`react-native`'s own `Pressable.js` (what Jest actually resolves `"react-native"` to; this repo's
`jest.config.js` uses no web-specific project) destructures the top-level `aria-checked` prop out
and merges it into `accessibilityState.checked` on the rendered `View` before that node is
returned by `getByTestId`. The existing, pre-`aria-checked`-fix tests in this file already knew
this and used `UNSAFE_getAllByType(Pressable)` to read the *composite* element's original props
instead; my new tests read `getByTestId(...).props.accessibilityState.checked` (the correct
post-merge value on the host node) rather than reaching for `UNSAFE_getAllByType` again, since I
only needed the state, not the original prop. Caught by an actual test failure on first run
(`Expected: false, Received: undefined`), not caught by static review — fixed before proceeding.

Full results:

```
$ node_modules/.bin/tsc --noEmit
(no output — clean)

$ npx jest
Test Suites: 85 passed, 85 total
Tests:       624 passed, 624 total
```

(84 → 85 suites, 612 → 624 tests vs. the stated starting baseline: +1 suite —
`webKeyActivation.test.ts` — and the 11 new/changed regression tests across the six files listed
above.)

```
$ ./init.sh
▶ 1/8 Checking prerequisites          ✅ OK  node v20.20.2, npm v10.8.2
▶ 2/8 Environment file                ✅ OK  .env already exists, left untouched
▶ 3/8 Installing dependencies         ✅ OK  dependencies installed
▶ 4/8 Type-checking                   ✅ OK  no type errors
▶ 5/8 Expo config/dependency health   ⚠️  WARN  expo-doctor: same pre-existing five-package set
▶ 6/8 Native dependency alignment     ⚠️  WARN  same pre-existing five-package set, unchanged
▶ 7/8 Running test suite              ✅ OK  all tests passed
▶ 8/8 Bundle export (web/iOS/Android) ✅ OK  all three platforms exported cleanly

RESULT: SUCCESS (10/10 stages passed)
```

Stage 5/6 warnings are the same pre-existing five-package set (`expo-image-picker`,
`react-native`, `react-native-safe-area-context`, `@types/react`, `typescript`) documented in
every prior run of this feature — no new warning.

### Manual smoke check (Level 3)

**Not performed live by me in a browser this run** — I have no browser-automation tool in this
session, and the orchestrator was already running a live browser pass (T028) and an iOS
Simulator pass (T029) in parallel against a running `npm run web` dev server (confirmed listening
on `:8081` via `lsof` during this run). Stating this plainly rather than implying coverage I
didn't perform, per `docs/verification.md`. Mitigating factors, stated honestly rather than as a
substitute for a real check: every change in this run is an additive `onKeyDown` prop (no style/
layout/JSX-structure change to anything already visually verified), and it is covered by real
RNTL assertions on rendered behavior (see above) plus a from-source reading of the exact
react-native-web code path being patched — but neither of those is a live-browser confirmation
that pressing the physical Space bar in a real browser actually toggles a checkbox/opens the
`Select` panel/selects a segment. If the orchestrator's parallel T028/T029 passes did not
separately exercise keyboard-only interaction, that specific behavior (as opposed to the visual
rendering) remains unconfirmed in a real browser as of this run.

### Requirement traceability (this batch)

| FR | Covered by |
|---|---|
| FR-015 (every interactive element this feature introduced/restyled exposes correct roles/labels, meets the 44×44 tap-target floor, and is fully keyboard-operable on web — Enter/Space activation, arrow-key nav + Escape for the picker) | `webKeyActivation.test.ts` (the helper itself); `SegmentedControl.test.tsx`'s new Space test; `Select.web.test.tsx`'s two new Space tests; `UsuarioForm.test.tsx`/`TiendaForm.test.tsx`/`ProfileForm.test.tsx`'s new Space-on-checkbox tests; the pre-existing (re-verified, unchanged) `aria-checked`/`aria-expanded`/arrow-key/Escape tests in the same files |
| Constitution Principle VII (accessible and responsive by default) | same tests above, plus the tap-target/label/role audit recorded in this run's "What was audited" section |

### Task IDs now `[X]`

- **T027** — `[X]` in `specs/010-registration-redesign/tasks.md` (marked by me this run).

### Files changed this run

- `src/features/ui/webKeyActivation.ts` (new) — the `spaceKeyActivation` helper.
- `src/features/ui/webKeyActivation.test.ts` (new).
- `src/features/ui/SegmentedControl.tsx` — added `spaceKeyActivation` to each segment's
  Pressable.
- `src/features/ui/SegmentedControl.test.tsx` — added the Space-activation regression test.
- `src/features/ui/Select.web.tsx` — added `spaceKeyActivation` to the trigger Pressable.
- `src/features/ui/Select.web.test.tsx` — added two Space-activation regression tests.
- `src/features/identity/UsuarioForm.tsx` — added `spaceKeyActivation` to both consent
  checkboxes.
- `src/features/identity/UsuarioForm.test.tsx` — added the Space-activation regression test.
- `src/features/identity/TiendaForm.tsx` — added `spaceKeyActivation` to both consent
  checkboxes.
- `src/features/identity/TiendaForm.test.tsx` — added the Space-activation regression test.
- `src/features/identity/ProfileForm.tsx` — added `spaceKeyActivation` to both consent
  checkboxes.
- `src/features/identity/ProfileForm.test.tsx` — added the Space-activation regression test.
- `specs/010-registration-redesign/tasks.md` — T027 marked `[X]`.

### Deviations / findings needing sign-off

- **`DateField.web.tsx`'s `outline: "none"` with no replacement focus style** — a genuine FR-015
  finding (visible focus), **not fixed**, per the explicit instruction that this file is off
  limits after its recent concurrent-edit-collision resolution. See "Reported, not fixed" above.
  This needs either explicit sign-off to touch that file in a follow-up, or someone already
  slated to touch it next to fold the one-line fix in.
- No other deviation. `CrearCuentaScreen.tsx`/`.web.tsx` and `Select.tsx`/`DateField.tsx`
  (native) were reviewed and required no change — recorded above with the specific reasoning for
  each, not silently skipped.

---

## Run 11 — T029 device defects + focus-ring fix

Fixing three defects found on the real iOS Simulator pass (T029) and the previously-fenced-off
web focus-ring finding from T027 (see the "Reported, not fixed" note at the end of that run).
These are fixes to already-`[X]` tasks (T007/T017/T027) — no task IDs added or renumbered.
T028/T030 left unchecked, as instructed; the orchestrator runs T030 last.

### Defect 1 — native `CrearCuentaScreen` had no safe-area inset

`app/(auth)/_layout.tsx` renders with `headerShown: false`, so nothing else on the `/register`
route accounted for the status bar/Dynamic Island — the `Crear cuenta` title rendered underneath
it at rest, exactly the defect class `004-home-scan-shell` already hit and fixed with
`useSafeAreaInsets()`. Followed that precedent verbatim rather than inventing a second approach —
specifically `ShellHeader.tsx`'s `16-base + insets.top/insets.left/insets.right` pattern (the
current shell-wide implementation of that same fix).

**Fix**: `CrearCuentaScreen.tsx` (native only — `.web.tsx` untouched, per instruction, since it
renders in a centered card and is unaffected) now calls `useSafeAreaInsets()` and adds
`space.xxl + insets.{top,left,right}` to both the normal-flow `ScrollView`'s
`contentContainerStyle` and the `sessionIssue` recovery view's — both are full-bleed scroll
surfaces on this route, both had the same gap. `useSafeAreaInsets()` resolves to 0 on web, so
this is a no-op there (consistent with why the web variant needs no equivalent change).

**What proves this and what doesn't**: three new tests in `CrearCuentaScreen.test.tsx`
(`describe("CrearCuentaScreen (mobile/default) — FR-016, T029 safe-area fix")`) assert the
computed `paddingTop`/`paddingLeft`/`paddingRight` on both the main content and the session-issue
view reflect a mocked non-zero `useSafeAreaInsets()` return, and fall back to the plain theme
base when insets are zero — mirroring `ShellHeader.test.tsx`'s own identical pattern. **This is a
real, structural proof that the hook is wired into the actual rendered style computation — it is
NOT proof that the title actually clears the status bar/Dynamic Island on a real device.** Only a
real simulator/device re-pass (the orchestrator's next T029 run) can confirm that; stated plainly
rather than implied by the green suite, per the task's own instruction.

### Defect 2 — native date picker rendered outside its own field

Root cause, read from the vendor's own behavior: mounting `<DateTimePicker mode="date"
onChange=.../>` with no explicit `display` let iOS pick its own default, which on iOS 14+
resolves to "compact" — a small, intrinsically-sized chip showing the picker's *current* value
(defaulting to today's date — exactly the "6 Aug 2026" chip the device pass observed), rendered
as a new sibling row underneath the styled pill rather than anchored to it. Tapping that chip
opens a second, real popover anchored to the chip's own on-screen position ("below and to the
right" of the pill, matching the report), and the styled pill itself never visually updates until
a value is committed — two controls, one looking permanently empty.

**Fix**: `DateField.tsx` (native only — `.web.tsx` untouched, its `<input type="date">` was
already correct) now presents the picker inside its own `Modal` sheet — the same primitive
`Select.tsx` already uses for its native picker, so this is a proven pattern in this codebase,
not a new one — with `display="spinner"`, a self-contained wheel supported identically on iOS and
Android (no `Platform.OS` branch needed, keeping FR-014/Constitution IV intact). Because spinner
mode's `onChange` fires on every wheel tick rather than only on a final choice, the previous
"commit and close on the first `set` event" behavior would have slammed the sheet shut after a
single tick; the selected value is now held as an in-progress `draft` (`useState`) until the
sheet's own "confirm" (`Aceptar`/`Done`, localized via a new `confirmLabel` prop, defaulting to
English to match `Select.tsx`'s own copy-override convention) button is pressed, which is when
`onChange` is actually called and the field's own pill re-renders with the committed value.
Backdrop press or the hardware back button (`onRequestClose`) discards the draft, matching
`Select.tsx`'s own discard-on-backdrop-press behavior.

**Threaded through**: `DateFieldProps` gained `confirmLabel?`/`closeAccessibilityLabel?` (shared
type file, `DateField.web.tsx` simply doesn't use them); `UsuarioForm.tsx`'s `DateField` call site
now passes `t("dateConfirmLabel")` (new key, `"Aceptar"`/`"Done"`, added to both `es`/`en` in
`src/domain/i18n/copy/registration.ts`) and reuses the existing `t("selectCloseAccessibilityLabel")`.

**What proves this and what doesn't**: `DateField.test.tsx` was rewritten for the new
interaction — a new test asserts the picker and its confirm control are found *within* the
field's own subtree (`within(field).getByTestId(...)`, not a floating/detached query), a new test
asserts a `"set"` event does NOT call the field's `onChange` or close the sheet (proving the
old "closes after one tick" defect can't recur), and the existing "commits on set" test was
changed to commit-on-confirm. **The subtree-containment assertion is a structural proxy for
"presented as part of its own field" — it proves the React tree relationship, not the real
on-screen visual position of the sheet relative to the pill on a physical device, which is
exactly the class of defect only a real simulator/device pass can catch.** `UsuarioForm.test.tsx`'s
`setBirthDate` helper was updated to press the new confirm control (two tests were failing before
this fix — `apellidoMaterno`-optional and full-payload submit — both now pass).

### Defect 3 — `DateField.web.tsx`'s `outline: "none"` removed the keyboard focus ring (FR-015, Constitution VII)

The file itself was minimally touched, as instructed — its `testID`→`data-testid` rename and its
tests querying by accessible label were left untouched. Added: an `onFocus`/`onBlur`-tracked
`focused` boolean state (a plain CSS-in-JS style object has no `:focus` pseudo-class to hook, so
this is the only way to conditionally style it without a stylesheet/className mechanism, which
this repo has none of), and a second style object (`rawInputFocusedStyle`, `...rawInputStyle` plus
`outline: `2px solid ${colors.brand.primary}`` + `outlineOffset: 2`) applied only while focused —
`colors.brand.primary` is an existing `src/theme` token (no new token added), matching every other
active/selected state in this feature (segmented control, checkboxes). At rest the outline is
still `"none"` (unchanged), so this is additive, not a removal of the original (now-conditional)
behavior.

**What proves this and what doesn't**: this is a genuine, real proof, not a proxy — unlike the two
device defects above, a focus/blur style computation is fully exercisable in Jest with no browser
needed. A new test in `DateField.web.test.tsx` renders the field, asserts `outline: "none"` at
rest, fires a real `"focus"` DOM event and asserts the style becomes
`` `2px solid ${colors.brand.primary}` ``, then fires `"blur"` and asserts it reverts. This
directly exercises the same style-computation code path a real browser's Tab key would trigger.

### Files changed

- `src/features/identity/CrearCuentaScreen.tsx` — `useSafeAreaInsets()` wired into both scroll
  surfaces' `contentContainerStyle` (Defect 1).
- `src/features/identity/CrearCuentaScreen.test.tsx` — new `jest.mock("react-native-safe-area-
  context", ...)` (mirroring `ShellHeader.test.tsx`'s pattern, since the real hook throws with no
  `<SafeAreaProvider>` in the tree) wired into every existing `beforeEach`, plus a new
  `describe` block with three regression tests for the inset-aware padding.
- `src/features/identity/DateField.tsx` — Modal-sheet + confirm-button redesign (Defect 2).
- `src/features/identity/DateField.types.ts` — added `confirmLabel?`/`closeAccessibilityLabel?`.
- `src/features/identity/DateField.test.tsx` — rewritten picker-interaction tests + a new
  subtree-containment regression test; top comment updated to state the real-proof-vs-proxy split.
- `src/features/identity/DateField.web.tsx` — real, visible, token-based focus ring (Defect 3).
- `src/features/identity/DateField.web.test.tsx` — new focus/blur regression test.
- `src/features/identity/UsuarioForm.tsx` — `DateField` call site passes `confirmLabel`/
  `closeAccessibilityLabel`.
- `src/features/identity/UsuarioForm.test.tsx` — `setBirthDate` helper presses the new confirm
  control.
- `src/domain/i18n/copy/registration.ts` — new `dateConfirmLabel` key (`es`: "Aceptar", `en`:
  "Done").
- `app/(auth)/register.test.tsx`, `app/(auth)/register.session-wiring.test.tsx`,
  `app/(auth)/register.session-failure.test.tsx` — added the same `react-native-safe-area-context`
  mock (these render the real route, which now transitively calls the hook via `CrearCuentaScreen`).

### Tests run

`npx jest` (full suite): **85 suites / 630 tests, all green.** No suite skipped, no new console
warnings introduced by this run's changes (the pre-existing `Icon`/act() warning from
`TopRightControls`/`ScanSearchField` is unrelated to any file touched this run).

`node_modules/.bin/tsc --noEmit`: clean, no errors.

`./init.sh` (full, no `--skip-*` flags): **`RESULT: SUCCESS (10/10 stages)`.** Stage 5
(expo-doctor) and Stage 6 (native dependency alignment) carry the exact same pre-existing
outdated-dependency warnings (`expo-image-picker`, `react-native`, `react-native-safe-area-
context`, `@types/react`, `typescript`) every prior run of this feature has recorded — nothing
new. Stage 8 (bundle export smoke checks) passed for web/iOS/Android.

### Manual smoke check

**Not performed live in a real browser or simulator by me this run.** I have no
browser-automation or device tool in this session. Per the task's own explicit instruction: a
Jest test genuinely cannot prove Defect 1 (real device safe-area rendering) or Defect 2 (real
native picker on-screen position/chrome) — those are exactly what the automated suite above
cannot see, and are restated as proxies, not proof, in each section above. Defect 3 (the web
focus ring) is a pure style computation and IS genuinely proven by its new Jest test — no browser
needed for that one specifically. The orchestrator's own re-run of a real iOS Simulator pass is
what will actually confirm Defects 1 and 2.

### Requirement traceability (this batch)

| FR / Constitution | Covered by |
|---|---|
| FR-013 (birth date via a real date-picker control) | `DateField.test.tsx` (rewritten interaction tests); `UsuarioForm.test.tsx` (`setBirthDate` updated) — structural proof only for the on-device chrome/position claim, see Defect 2 above |
| FR-014 (platform-specific behavior via file-extension convention, never inline `Platform.OS`) | `DateField.tsx`'s `display="spinner"` fix needed no `Platform.OS` branch — confirmed by reading the vendor's own cross-platform `display` support, not asserted by a test |
| FR-015 / Constitution VII (visible keyboard focus, accessible controls) | `DateField.web.test.tsx`'s new focus/blur test (Defect 3, genuine proof) |
| FR-016 (screen usable across viewport widths, incl. safe-area on native) | `CrearCuentaScreen.test.tsx`'s three new inset-padding tests (Defect 1, structural proxy only — see above) |

### Task IDs now `[X]`

No change — T007/T017/T027/T029 were already `[X]` before this run (these are fixes to those
tasks' own work, not new tasks). T028/T030 remain `[ ]`, left for the orchestrator.

### Deviations / findings needing sign-off

- **`DateField`'s interaction model changed** (auto-commit-on-pick → explicit confirm button).
  This is a real UX change beyond a pure style/position fix, made necessary by `display="spinner"`
  firing `onChange` continuously — flagged here rather than silently expanded scope, since the
  original design brief/mockups show a single-tap-to-pick affordance and this introduces a second
  tap (open → scroll → confirm). This is the standard interaction pattern for spinner-style
  pickers (matches iOS's own Photos/Reminders apps) and was the safest fix given no `Platform.OS`
  branch is allowed (FR-014) and iOS's "compact"/"default" modes are what caused the original
  defect — but it is a genuine, real interaction-model change, not merely a visual anchor fix, and
  is called out explicitly for the orchestrator's re-verification.
- **A new copy key was added** (`dateConfirmLabel`) rather than reusing an existing one — no
  existing key fit ("Aceptar"/"Done" for a date-picker confirm is distinct from `submitLabel`
  ("Registrarse") or any `select*` key).
- No other deviation from the plan/spec. `DateField.web.tsx`'s `testID`→`data-testid` rename and
  its accessible-label-based test queries were left untouched, per instruction.
