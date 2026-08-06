# Implementation progress — 008-scan-experience

## Run 1 — Phase 2 domain/i18n batch (T001–T006)

Scope: exactly the six disjoint, `[P]`-marked domain/i18n tasks in `specs/008-scan-experience/tasks.md`'s
"Domain layer" section. No shell-chrome, Escanear, Inicio, or placeholder-screen files were touched —
those are later tasks (T007+) explicitly out of scope for this run.

### Files changed

**T001 — `src/domain/navigation.ts` + `src/domain/navigation.test.ts`**
- `NavDestinationKey` changed from `"amigos" | "home" | "social"` to `"inicio" | "escanear" |
  "cartera" | "trades" | "perfil"`.
- `NAV_DESTINATIONS` now has five entries in the documented order: Inicio (`/`), Escanear
  (`/escanear`), Cartera (`/cartera`), Trades (`/trades`), Perfil (`/perfil`).
- `SCAN_ROUTE` export removed — Escanear is now looked up from `NAV_DESTINATIONS` like every
  other destination (FR-003's reversal of `006`'s Recorded default 3).
- `BREAKPOINT_PX`/`resolveWebNavLayout` left untouched, per the task's explicit instruction.
- Test file updated: five-entry length check, unique key/route check (unchanged assertions,
  updated count), a new documented-order test, and a new exact route/label table test.
  `resolveWebNavLayout`'s existing boundary tests are byte-for-byte unchanged.

**T002 — `src/domain/scanResults.ts` (new) + `src/domain/scanResults.test.ts` (new)**
- Exports `ConditionOption`, `CONDITION_OPTIONS` (five options, documented order), `SampleCard`,
  `SAMPLE_CARDS` (Dragón Eterno/Genesis/GEN-001/PSA 10/$45,000/`colors.brand.primary`; Fénix de
  Tormenta/Arcana/ARC-047/BGS 9.5/$12,500/`colors.accent.priceGreen`; Serpiente del
  Vacío/Genesis/GEN-022/PSA 9/$8,900/`colors.text.link` — each `defaultCondition: "nearMint"`,
  `defaultGraded: true`), `MIN_QUANTITY = 1`, `FoundCardState`, and the pure functions
  `startFoundState`, `selectCondition`, `toggleGraded`, `incrementQuantity`,
  `decrementQuantity` (clamped), `advanceToNextCard` (cycles by `SAMPLE_CARDS` index, wraps,
  re-seeds via `startFoundState` on the next card), `formatListMeta`, `formatDetailMeta`.
- `thumbnailColorToken` is populated from `colors.brand.primary` / `colors.accent.priceGreen` /
  `colors.text.link` — real `@/theme/colors` tokens, never a raw hex — imported directly from
  `@/theme/colors` (not the `@/theme` barrel, which pulls in `shadows.ts`'s `import type {
  ViewStyle } from "react-native"`; importing the leaf module keeps this file's own import list
  free of any `react-native` specifier at all, satisfying the "zero React/RN import" instruction
  literally, not just at the type-erasure level).
- Zero React/React Native import — verified by inspection (only import is `@/theme/colors`,
  which itself has zero imports).
- Test file covers: `SAMPLE_CARDS` order/defaults, `startFoundState` seeding, `selectCondition`
  isolation, `toggleGraded` isolation + round-trip, `incrementQuantity`/`decrementQuantity`
  (including the `MIN_QUANTITY` floor), `advanceToNextCard` cycling through all three and
  wrapping back to the first while resetting condition/graded/quantity to the next card's own
  defaults (not carrying over the previous card's edited values), and the exact documented
  `formatListMeta`/`formatDetailMeta` strings for `SAMPLE_CARDS[0]`.

**T003 — `src/domain/i18n/copy/nav.ts` (new) + `.test.ts` (new)**
- `{ es, en }` dictionary, same `Record<keyof typeof es, string>` + key-parity pattern as
  `copy/login.ts`/`copy/scan.ts`.
- Five destination labels (`navInicio`/`navEscanear`/`navCartera`/`navTrades`/`navPerfil`) —
  English equivalents Home/Scan/Wallet/Trades/Profile, per the task's explicit instruction.
- Four icon-control accessibility labels (language/currency/notifications/messages), same
  sentence shape `004-home-scan-shell`'s `TopRightControls.tsx` already established ("Language,
  English or Spanish — not yet available", etc.), now in both locales.
- One shared `notYetAvailableFeedback` string ("Aún no disponible" / "Not yet available") — `004`
  used a single hardcoded feedback string for all four controls, so this mirrors that exactly
  rather than inventing four separate feedback strings.
- `sidebarWordmark`/`sidebarTagline` for the web sidebar's brand block.
- Test file: key-parity, no-empty-string, exact destination-label values in both locales, and an
  assertion that every icon control's accessibility label states "not yet available"/"no
  disponible" in both locales.

**T004 — `src/domain/i18n/copy/home.ts` (new) + `.test.ts` (new)**
- `title`, `tagline`, `scanQuickActionLabel` ("Escanear una carta" / "Scan a card" — the exact
  strings the task specifies).
- Test file: key-parity, no-empty-string, exact quick-action label values.

**T005 — `src/domain/i18n/copy/placeholders.ts` (new) + `.test.ts` (new)**
- Title + body for Cartera/Trades/Perfil, each body explicitly stating "no content yet" in both
  locales ("todavía no tiene contenido" / "no content yet").
- Test file: key-parity, no-empty-string, distinct titles, and a substring check that every body
  states "no content yet" in both locales.

**T006 — `src/domain/i18n/copy/scan.ts` (extended) + `.test.ts` (extended)**
- Added `viewfinderFoundHeading` ("¡Carta encontrada!" / "Card found!").
- Added the found-panel keys: `gradedLabel`, `gradeValuePlaceholder` ("—"), `removeLink`,
  `changeLink`, `quantityLabel`, `marketPriceLabel`, `acceptButton`, `acceptedConfirmation`.
- Added five condition-chip labels keyed `condition<Option>` (`conditionNearMint`,
  `conditionExcellent`, `conditionVeryGood`, `conditionGood`, `conditionFair`) — one per
  `src/domain/scanResults.ts`'s `ConditionOption`, kept flat (`condition` + PascalCase option
  name) rather than nesting a sub-object, to preserve the dictionary's established flat
  `Record<keyof typeof es, string>` shape.
- Reviewed `uploadDropzone`'s existing key per the task's instruction — its phrasing already
  reads as an actionable command ("Subir imagen de carta" / "Upload a card image"), suitable
  as-is for an `accessibilityLabel` on the now-interactive dropzone (T017); left unchanged, with
  a comment documenting that this was reviewed, not skipped.
- Test file: new tests for the found-viewfinder heading, the found-panel copy set, and all five
  condition-chip labels in both locales. Existing tests untouched.

### Tests written/run (this batch's own six files)

```
npx jest src/domain/navigation.test.ts src/domain/scanResults.test.ts \
  src/domain/i18n/copy/nav.test.ts src/domain/i18n/copy/home.test.ts \
  src/domain/i18n/copy/placeholders.test.ts src/domain/i18n/copy/scan.test.ts

PASS src/domain/scanResults.test.ts
PASS src/domain/i18n/copy/nav.test.ts
PASS src/domain/i18n/copy/placeholders.test.ts
PASS src/domain/i18n/copy/home.test.ts
PASS src/domain/navigation.test.ts
PASS src/domain/i18n/copy/scan.test.ts

Test Suites: 6 passed, 6 total
Tests:       36 passed, 36 total
```

All 36 tests across the six files this batch owns pass.

### Requirement traceability (this batch)

| FR | Test(s) |
|---|---|
| FR-001 | `src/domain/navigation.test.ts` — "has exactly five entries", "has unique key and route values...", "orders the five destinations...", "has the exact route and label for each destination" |
| FR-007 | `src/domain/scanResults.test.ts` — `startFoundState` describe block (seeding contract every trigger relies on) |
| FR-008 | `src/domain/scanResults.test.ts` — `selectCondition`, `toggleGraded`, `incrementQuantity`/`decrementQuantity` describe blocks; `src/domain/i18n/copy/scan.test.ts` — "has the found-card panel's Gradeada/links/quantity/price/accept copy", "has the five condition-chip labels in both locales" |
| FR-009 | `src/domain/scanResults.test.ts` — `advanceToNextCard` describe block (cycles + resets to next card's own defaults) |
| FR-010 | `src/domain/scanResults.test.ts` — `SAMPLE_CARDS` describe block, `formatListMeta`/`formatDetailMeta` describe block |
| FR-011 | `src/domain/i18n/copy/nav.test.ts` — "has the five destination labels...", "every icon control's accessibility label states it is not yet available" |
| FR-012 | `src/domain/i18n/copy/nav.test.ts` — "every icon control's accessibility label states it is not yet available" (language control's sentence carries the flag-badge's meaning as text) |
| FR-013 | `src/domain/i18n/copy/home.test.ts` — "has the quick-action card label 'Escanear una carta' / 'Scan a card'" |
| FR-015 | `src/domain/i18n/copy/placeholders.test.ts` — "has distinct titles...", "every body string explicitly states there is no content yet" |
| FR-017 | Every one of the six new/extended dictionaries' key-parity + no-empty-string tests (`nav.test.ts`, `home.test.ts`, `placeholders.test.ts`, `scan.test.ts`'s extended assertions, plus the pre-existing `login.test.ts` pattern this batch continued) |

### Full-repo verification (documenting expected breakage from T001, not fixed in this run)

Per the task instructions: T001 removes `SCAN_ROUTE` and narrows `NavDestinationKey`, which
breaks consumers scoped to later tasks (T007–T012, T025). Ran both checks to confirm exactly
what's red and that it's *only* the expected consequence of T001's signature change.

**`npx tsc --noEmit`** — 7 errors, all in files this batch was explicitly told not to touch:

```
app/(app)/_layout.tsx(15,3): error TS2353: Object literal may only specify known properties, and 'amigos' does not exist in type 'Record<NavDestinationKey, string>'.
app/(app)/_layout.tsx(21,3): error TS2353: Object literal may only specify known properties, and 'amigos' does not exist in type 'Record<NavDestinationKey, ...icon names...>'.
src/features/navigation/AmigosQuickAccessPill.test.tsx(32,70): error TS2367: This comparison appears to be unintentional because the types 'NavDestinationKey' and '"amigos"' have no overlap.
src/features/navigation/AmigosQuickAccessPill.tsx(16,70): error TS2367: This comparison appears to be unintentional because the types 'NavDestinationKey' and '"amigos"' have no overlap.
src/features/navigation/HomeScreen.integration.test.tsx(62,68): error TS2367: This comparison appears to be unintentional because the types 'NavDestinationKey' and '"amigos"' have no overlap.
src/features/navigation/HomeScreen.test.tsx(33,10): error TS2305: Module '"@/domain/navigation"' has no exported member 'SCAN_ROUTE'.
src/features/navigation/HomeScreen.tsx(5,10): error TS2305: Module '"@/domain/navigation"' has no exported member 'SCAN_ROUTE'.
```

All seven trace directly to T001's two changes (`NavDestinationKey` narrowed from
`"amigos"|"home"|"social"`, `SCAN_ROUTE` removed) in exactly the files `tasks.md` names as
consumers repaired by T007 (`app/(app)/_layout.tsx`), T025
(`HomeScreen.tsx`/`HomeScreen.test.tsx`/`HomeScreen.integration.test.tsx`), and T031
(`AmigosQuickAccessPill.tsx`/`.test.tsx`, retired outright in that later task). None of the six
files this batch actually wrote or edited (`navigation.ts`, `navigation.test.ts`,
`scanResults.ts`, `scanResults.test.ts`, `copy/nav.ts(.test.ts)`, `copy/home.ts(.test.ts)`,
`copy/placeholders.ts(.test.ts)`, `copy/scan.ts(.test.ts)`) appears anywhere in this list.

**`npx jest`** (full suite) — 2 failed suites / 4 failed tests, 65 passed suites / 417 passed
tests:

```
FAIL src/features/navigation/HomeScreen.integration.test.tsx
  ● Amigos pill vs. Amigos tab convergence (FR-008) › has an Amigos entry in NAV_DESTINATIONS for both entry points to converge on
  ● Amigos pill vs. Amigos tab convergence (FR-008) › navigates the pill to exactly NAV_DESTINATIONS' Amigos route
  ● Amigos pill vs. Amigos tab convergence (FR-008) › configures the native Amigos tab's screen name from the same NAV_DESTINATIONS route the pill uses

FAIL src/features/navigation/AmigosQuickAccessPill.test.tsx
  ● AmigosQuickAccessPill › navigates to exactly NAV_DESTINATIONS' Amigos route when pressed

Test Suites: 2 failed, 65 passed, 67 total
Tests:       4 failed, 417 passed, 421 total
```

All four failures are `NAV_DESTINATIONS.find((d) => d.key === "amigos")` now returning
`undefined` (the `"amigos"` key no longer exists, per T001/FR-001) inside tests that belong to
`AmigosQuickAccessPill.tsx`, a file `tasks.md` explicitly retires in T031 (dependent on T025).
`app/(app)/amigos.test.tsx` and `src/features/navigation/HomeScreen.test.tsx` still pass at
**runtime** despite the `tsc` errors above — Jest's babel transform doesn't type-check, so an
import of the now-removed `SCAN_ROUTE` resolves to `undefined` at runtime without throwing,
and neither test's assertions happen to exercise that value. This is a real, if incidental,
gap between "tsc red" and "jest green" for those two files specifically — flagging it rather
than treating jest's pass as a clean bill of health for `HomeScreen.tsx`.

**Six files this batch's own scope covers are unaffected**: `navigation.test.ts`,
`scanResults.test.ts`, `copy/nav.test.ts`, `copy/home.test.ts`, `copy/placeholders.test.ts`,
`copy/scan.test.ts` all pass, both individually (see above) and inside the full-suite run.

### Manual smoke check

Not applicable to this batch — every file is pure TypeScript under `src/domain` with zero
React/React Native import (verified by inspection: `scanResults.ts` imports only
`@/theme/colors`; the four `copy/*.ts` files have zero imports at all). Nothing here is
independently renderable or reachable through the app yet — Level 3 (`npm run web`) has nothing
new to exercise until the shell-chrome/Escanear/Inicio/placeholder tasks (T007+) wire these
dictionaries and the sample-card pool into actual screens.

### Tasks now `[X]`

T001, T002, T003, T004, T005, T006 — all marked `[X]` in
`specs/008-scan-experience/tasks.md`. No other task IDs touched.

### Deviations from the plan / notes for reviewer

- **Condition-chip label naming**: `tasks.md` T006 says the labels are "keyed by
  `ConditionOption`" without specifying an exact key-naming scheme. I named them
  `condition<PascalCaseOption>` (`conditionNearMint`, etc.) to keep `scan.ts`'s established flat
  `Record<keyof typeof es, string>` shape (a nested `conditionLabels: { nearMint: string, ... }`
  sub-object would have broken that pattern and the `Record<keyof typeof es, string>`
  compile-time constraint on `en`). If a nested shape was actually intended, that's a one-file
  rename, not a structural change — flagging for confirmation, not blocking.
- **`thumbnailColorToken` import path**: imported `colors` from `@/theme/colors` directly rather
  than the `@/theme` barrel, specifically to avoid the barrel's transitive `import type {
  ViewStyle } from "react-native"` (in `shadows.ts`) appearing anywhere in `scanResults.ts`'s own
  import graph, even as a type-only, compile-time-erased import — an intentionally stricter
  reading of "zero React/React Native imports" than the letter of Constitution IV strictly
  requires (which only forbids business logic depending on RN at runtime). No functional
  difference either way; flagging the choice in case a reviewer prefers the barrel for
  consistency with how `RecentScansList.tsx` (a component, not domain) already imports colors.
- **tsc/jest red state**: as instructed, left T001's ripple effects on `app/(app)/_layout.tsx`,
  `HomeScreen.tsx`(+ its two test files), and `AmigosQuickAccessPill.tsx`(+ its test) untouched —
  those are T007/T009/T025/T031's scope, not this batch's. `./init.sh` was not run to completion
  (it would report the same tsc failures as a hard stop); Levels 1 (this batch's own six test
  files) and the full-suite diff above are the verification this run supports. Do not mark the
  overall feature `done` until T007–T012/T025/T031 land and `./init.sh` goes green.

## Run 2 — Phase 2 shell-chrome batch (T007–T012, User Story 1)

Scope: exactly the six shell-chrome tasks in `specs/008-scan-experience/tasks.md`'s "Shell
chrome (User Story 1)" section. No Escanear (Phase 3/4), Inicio (T025), found-state (T013/T014),
or placeholder-screen (Phase 6) files were touched — those are later tasks, explicitly out of
scope for this run. This batch is the one that repairs the deliberate breakage T001 (Run 1)
introduced (`SCAN_ROUTE` removal, `NavDestinationKey` narrowing) in every file this batch owns;
the two remaining consumers (`HomeScreen.tsx` and `AmigosQuickAccessPill.tsx`) are explicitly
T025/T031's job, not this batch's, and were left untouched as instructed.

### Files changed

**T007 — `src/features/navigation/TopRightControls.tsx` + `.test.tsx`**
- Rewrote the four bordered TEXT-label buttons ("ENG/ESP", "USD/MXN", "Notifications",
  "Messages") into four ICON buttons: a new local `FlagBadge` subcomponent (hand-drawn `View`/
  `Text`, `"MX"`/`"US"` on `src/theme` tokens — no flag emoji, no new asset/icon-package
  dependency) for language, and `@expo/vector-icons`' `cash-outline`/`notifications-outline`/
  `chatbubble-outline` for currency/notifications/messages.
- The language control renders both `FlagBadge`s together in one control (mirrors 004's original
  shape — a single control showing both options, e.g. "ENG/ESP", not a toggle — since the control
  stays fully inert; no real language switch exists yet, that's `007-localization`'s job).
- Kept the existing "press → inline 'not yet available' text" local-state feedback mechanism
  unchanged (004's established, tested pattern) — only the visible control surface moved from
  text to icon/flag-badge.
- Every `accessibilityLabel` and the shared feedback text now read from `useTranslation(navCopy)`
  (T003, Run 1) instead of 004's hardcoded English literals.
- Test file rewritten: confirms icon-only rendering (none of the four old visible text labels
  render anywhere), confirms the `FlagBadge` pair (`flag-badge-mx`/`flag-badge-us` testIDs)
  renders for the language control, the same four-control-order/accessibility-label/44×44-tap-
  target/"not yet available"-toggle behavior as before (now sourced from `navCopy`), plus a new
  English-locale pass (`LocaleProvider` + a test-only `switch-to-en` trigger, the exact pattern
  `SignInForm.test.tsx`/`LocaleContext.test.tsx` already established) confirming every
  accessibility label and the feedback text switch to English.

**T008 — `src/features/navigation/ShellHeader.tsx` (new) + `.test.tsx` (new)**
- A thin, `useSafeAreaInsets()`-aware wrapper positioning `TopRightControls` (T007) top-right —
  reuses the exact safe-area padding logic (`16 + insets.top`/`16 + insets.left`/
  `16 + insets.right`) `HomeScreen.tsx` applied to its own top row in 004. No props.
- This is the ONE shared header row consumed by all three shell entry points (native `<Tabs>`
  custom header T009, `WebSidebarNav.tsx` T010, `WebBottomBarNav.tsx` T011) — satisfies FR-011's
  "not duplicated per-screen, appears identically across all five destinations."
- Test file: renders `TopRightControls`' four controls (asserted via their accessibility
  labels/roles, defaulting to Spanish with no `<LocaleProvider>`, matching the repo's bare-render
  convention); a snapshot-free assertion that `paddingTop`/`paddingRight` reflect
  `insets.top`/`insets.right` when non-zero (mocked `useSafeAreaInsets`); and a fallback-to-16px
  test when insets are zero (the web case).

**T009 — `app/(app)/_layout.tsx`**
- `TAB_SCREEN_NAMES`/`TAB_ICONS` updated for the five `NavDestinationKey` values (T001, Run 1):
  `inicio` → `"index"`/`home`, `escanear` → `"escanear"`/`scan-outline`, `cartera` →
  `"cartera"`/`briefcase-outline`, `trades` → `"trades"`/`swap-horizontal-outline`, `perfil` →
  `"perfil"`/`person-outline` — each still carrying an explicit `tabBarAccessibilityLabel`
  (unchanged mechanism from 004).
- Added `screenOptions={{ headerShown: true, header: () => <ShellHeader /> }}` (replacing the
  previous `headerShown: false`), so `ShellHeader` (T008) renders above every one of the five tab
  screens without any of them rendering it themselves.
- This is the file whose two `tsc` errors from Run 1 (`'amigos' does not exist in type
  Record<NavDestinationKey, ...>` ×2) are now gone — confirmed by the `tsc --noEmit` run below.

**T010 — `src/features/navigation/WebSidebarNav.tsx` + `.test.tsx`**
- Renders the five `NAV_DESTINATIONS` (T001, unchanged rendering logic — just more entries, plus
  a per-destination `Ionicons` glyph matching T009's icon set) as before, still via `<Link>`.
- Added a compact brand block (`BrandMark` size 40 + serif wordmark + tagline,
  `useTranslation(navCopy)` for both strings, T003) at the top of the sidebar — no user-
  profile/account-tier block, per spec.md's Assumptions.
- Renders `ShellHeader` (T008) above the existing `<Slot />` in the content column.
- Test file updated: five-destination link-role/label coverage (was three), keyboard-reachability
  assertion unchanged in shape, a new brand-block assertion (`web-sidebar-brand-block` testID +
  wordmark/tagline text), a new assertion that `ShellHeader`'s four controls render in the content
  column, and the pre-existing `<Slot />` assertion. Added the library's official
  `react-native-safe-area-context/jest/mock` (the same technique
  `HomeScreen.integration.test.tsx` already established) since `ShellHeader` now calls
  `useSafeAreaInsets()` inside this tree.

**T011 — `src/features/navigation/WebBottomBarNav.tsx` + `.test.tsx`**
- Same five-destination + icon-set treatment as T010, `ShellHeader` (T008) rendered above the
  existing `<Slot />`.
- Test file updated: five-destination coverage (was three), a new `ShellHeader`-controls-render
  assertion, and the same safe-area-context mock addition as T010's test file (same reason).

**T012 — `app/(app)/_layout.web.tsx`**
- Confirmed unchanged is correct: it only calls `resolveWebNavLayout(width)` (T001, unchanged
  signature) — no edit made to this file, per the task's own instruction.
- `src/features/navigation/AppWebLayout.test.tsx` needed one addition (not a destination-count
  hardcode — it never asserted an old three-destination count, so no rewrite was needed there):
  the same `react-native-safe-area-context/jest/mock` addition T010/T011's test files needed,
  since both `WebSidebarNav`/`WebBottomBarNav` (rendered by `AppWebLayout`) now mount `ShellHeader`
  which calls `useSafeAreaInsets()`. Without this mock all three of this file's tests failed with
  "No safe area value available" — confirmed by running the suite before and after the fix.

### Tests written/run (this batch's own five test files)

```
npx jest src/features/navigation/TopRightControls.test.tsx \
  src/features/navigation/ShellHeader.test.tsx \
  src/features/navigation/WebSidebarNav.test.tsx \
  src/features/navigation/WebBottomBarNav.test.tsx \
  src/features/navigation/AppWebLayout.test.tsx

PASS src/features/navigation/TopRightControls.test.tsx
PASS src/features/navigation/AppWebLayout.test.tsx
PASS src/features/navigation/ShellHeader.test.tsx
PASS src/features/navigation/WebSidebarNav.test.tsx
PASS src/features/navigation/WebBottomBarNav.test.tsx

Test Suites: 5 passed, 5 total
Tests:       29 passed, 29 total
```

(`AppWebLayout.test.tsx` is a pre-existing file this batch only extended with a mock addition per
T012's instruction — its 3 tests are included in the 29 above, still all green.)

`act(...)` console warnings appear during these runs, originating from `@expo/vector-icons`'
internal `Icon` component's async font-metadata `setState` — this is pre-existing framework noise
already present in every other test file that renders an `Ionicons` glyph (confirmed by running
`src/features/scanner/Viewfinder.test.tsx`, which predates this batch and shows the identical
warning), not something introduced by this batch's code, and does not affect any assertion's
pass/fail result.

### Requirement traceability (this batch)

| FR | Test(s) |
|---|---|
| FR-011 | `TopRightControls.test.tsx` — order/label/44×44/feedback/English-locale tests; `ShellHeader.test.tsx` — renders-four-controls + padding tests; `WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx` — "renders ShellHeader's four controls above the active screen's Slot" |
| FR-012 | `TopRightControls.test.tsx` — "renders the language control as a Mexico/USA FlagBadge pair, not a text label" |
| SC-004 | `TopRightControls.test.tsx` — "gives each control a minimum 44x44 tap target" |
| SC-005 | `TopRightControls.test.tsx` — the `describe.each` "not yet available" feedback block |
| SC-006 | `TopRightControls.test.tsx` — "renders the English equivalents when the locale context is set to 'en'" |
| FR-001 | `WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx` — "renders all five NAV_DESTINATIONS as links with correct roles and labels" (also asserts `NAV_DESTINATIONS.length === 5` explicitly) |
| SC-002 | `WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx` — "renders each destination as an enabled, keyboard-reachable link" |

### `npx tsc --noEmit` — full repo, after this batch

```
src/features/navigation/AmigosQuickAccessPill.test.tsx(32,70): error TS2367: This comparison appears to be unintentional because the types 'NavDestinationKey' and '"amigos"' have no overlap.
src/features/navigation/AmigosQuickAccessPill.tsx(16,70): error TS2367: This comparison appears to be unintentional because the types 'NavDestinationKey' and '"amigos"' have no overlap.
src/features/navigation/HomeScreen.integration.test.tsx(62,68): error TS2367: This comparison appears to be unintentional because the types 'NavDestinationKey' and '"amigos"' have no overlap.
src/features/navigation/HomeScreen.test.tsx(33,10): error TS2305: Module '"@/domain/navigation"' has no exported member 'SCAN_ROUTE'.
src/features/navigation/HomeScreen.tsx(5,10): error TS2305: Module '"@/domain/navigation"' has no exported member 'SCAN_ROUTE'.
```

5 errors remain (down from Run 1's 7 — the two `app/(app)/_layout.tsx` errors this batch's T009
was responsible for repairing are gone, confirmed by their absence above). Every remaining error
maps to a task this batch was explicitly told NOT to do yet:

| File | Owning task |
|---|---|
| `src/features/navigation/HomeScreen.tsx` (imports removed `SCAN_ROUTE`) | **T025** (Inicio redesign) |
| `src/features/navigation/HomeScreen.test.tsx` (imports removed `SCAN_ROUTE`) | **T025** |
| `src/features/navigation/HomeScreen.integration.test.tsx` (compares against retired `"amigos"` key) | **T025** (stops importing `AmigosQuickAccessPill`) and **T031** (retires the file this test is entirely about) |
| `src/features/navigation/AmigosQuickAccessPill.tsx` (compares against retired `"amigos"` key) | **T031** (retires this file outright) |
| `src/features/navigation/AmigosQuickAccessPill.test.tsx` (same) | **T031** |

No error in this list touches any file this batch (T007–T012) added or modified.

### `npx jest` — full repo, after this batch

```
Test Suites: 3 failed, 65 passed, 68 total
Tests:       5 failed, 425 passed, 430 total
```

All 5 failing tests are in the same three files the table above names, all owned by T025/T031:

- `src/features/navigation/AmigosQuickAccessPill.test.tsx` — 1 failing test
  (`NAV_DESTINATIONS.find(d => d.key === "amigos")` now returns `undefined`, same T001 ripple
  Run 1 already documented) — **T031**.
- `src/features/navigation/HomeScreen.integration.test.tsx` — 3 failing tests (same `"amigos"`-
  key-lookup ripple, this whole file is the Amigos-pill-vs-Amigos-tab convergence test) —
  **T025**/**T031**.
- `src/features/navigation/HomeScreen.test.tsx` — 1 failing test ("renders the Amigos pill, then
  the top-right controls, then the scan card, in that order") — **newly** broken by this batch's
  own T007 change (not merely T001's carry-over): the test's hardcoded expected accessibility-
  label strings are 004's old English literals ("Language, English or Spanish — not yet
  available", etc.); `TopRightControls.tsx` now renders `navCopy.es`'s Spanish-default strings
  instead. This is disclosed, expected breakage — `tasks.md` T025 explicitly names
  `HomeScreen.test.tsx` as one of the two files it rewrites ("assert BrandMark/title/tagline
  render, the pill/top-right controls no longer render from this file..."), and the fix is to
  remove `TopRightControls` from `HomeScreen.tsx` entirely (per T025's own scope), not to touch
  `TopRightControls.tsx`'s new i18n behavior. Flagging explicitly since it's a new line item this
  run added to the "expected red" list Run 1 started, not because it's an unexplained regression.

**65 → 65 passed suites, 425 passed tests** (up from Run 1's 417 — the 8 additional passing tests
are this batch's own new/extended assertions: `ShellHeader.test.tsx`'s 3 new tests,
`TopRightControls.test.tsx`'s net +2 tests versus its prior 12, `WebSidebarNav.test.tsx`'s +2
(brand block, ShellHeader controls), `WebBottomBarNav.test.tsx`'s +1 (ShellHeader controls)).
Every pre-existing passing suite outside the T025/T031-owned files still passes — no new
regression introduced anywhere else in the repo.

### Build check (partial — Level 4 substitute for this intermediate batch)

`./init.sh` was not run to completion (it would hard-stop on the same disclosed `tsc` errors
above, exactly as Run 1 documented for its own state — this is still the planned mid-feature
state, not a harness-health failure). As a substitute sanity check that this batch's actual
runtime module graph bundles cleanly (babel/Metro strips types, so `tsc`'s red state doesn't by
itself prove a bundling failure), ran:

```
npx expo export --platform web
```

Succeeded — `Web Bundled 771ms node_modules/expo-router/entry.js (877 modules)`, all existing
routes (including `app/(app)/_layout.tsx`, `WebSidebarNav.tsx`, `WebBottomBarNav.tsx`,
`ShellHeader.tsx`, `TopRightControls.tsx`) exported without a runtime import error. `/escanear`,
`/cartera`, `/trades`, `/perfil` correctly do NOT appear yet (their route files don't exist until
T019/T030) — only `/scan`, `/`, `/amigos`, `/social`, etc. (the pre-existing route set) appear, as
expected at this point in the feature. The `dist/` output was deleted after the check (not
committed, not part of this batch's file scope).

### Manual smoke check (Level 3)

**Disclosed gap, same as Run 1's precedent**: this sandboxed environment has no browser/
Playwright/Puppeteer tooling available (`ls node_modules/.bin | grep -i playwright` returns
nothing), so an actual `npm run web` + visual inspection was not possible. This is consistent with
`docs/verification.md`'s own guidance to disclose the gap rather than imply an unverified check —
no screenshot or "smoke-checked on web" claim is made for this run. What IS demonstrated, per the
build-check section above: the entire updated shell-chrome module graph bundles without error, and
the Level 2 component/screen tests above assert the actual rendered output (accessibility
labels/roles, icon presence, ShellHeader's presence in both web layouts, tap targets, bilingual
copy) directly against `@testing-library/react-native`'s rendered tree — not merely "doesn't
crash." A full Level 3 pass showing the five-destination shell live in a browser is deferred to
T020 (this feature's first scheduled manual-smoke task, once Escanear's route exists to navigate
into), consistent with `tasks.md`'s own sequencing.

### Tasks now `[X]`

T007, T008, T009, T010, T011, T012 — all marked `[X]` in `specs/008-scan-experience/tasks.md`. No
other task IDs touched. (T001–T006 remain `[X]` from Run 1.)

### Deviations from the plan / notes for reviewer

- **Language control shape**: FR-012 says the language control must render "a recognizable
  Mexico/USA flag-style visual per locale option." Read this as: both options render together in
  one control (mirroring 004's original single-control "ENG/ESP" shape, which showed both language
  options in one inert button, not a toggle) — implemented as a `FlagBadge` pair
  (`"MX"` + `"US"`) inside the language control, rather than a single flag that would imply an
  active/selected state the control doesn't actually have (no real language switching exists yet).
  Flagging this reading explicitly in case a different interpretation (e.g. showing only the
  current locale's flag) was intended — this is a one-file, low-risk change if so.
- **`AppWebLayout.test.tsx` needed a test change despite T012 saying "confirm no change needed"**:
  the *layout file itself* (`app/(app)/_layout.web.tsx`) genuinely needed zero edit (confirmed —
  its only logic is `resolveWebNavLayout(width)`, T001's unchanged signature). Its *test file*
  needed one addition (the `react-native-safe-area-context` Jest mock) purely because the
  components it renders (`WebSidebarNav`/`WebBottomBarNav`) now transitively mount `ShellHeader`,
  which calls a hook that has no real value under `react-test-renderer` without the library's
  official mock. This isn't a "destination-count assumption" in the sense T012's text anticipates,
  but it is a required test-file change to keep the suite green — included under T012's scope
  since it's the task that owns confirming/updating this specific test file.
- **`ShellHeader.tsx` renders no top-left content**: `HomeScreen.tsx`'s original top row (004) had
  a `topLeft`/`topRight` split (`AmigosQuickAccessPill` left, `TopRightControls` right).
  `ShellHeader` only ever renders the right-hand half — it has no left-hand content by design,
  since none of the five destinations has a shell-level top-left affordance in this feature's
  mockups (Amigos is retired outright, T031). `justifyContent: "flex-end"` on a single-child row
  is intentionally simple here, not a partial port of the old two-sided layout.
- No blockers. All six tasks landed exactly as `tasks.md` specifies; the two files this batch was
  told NOT to touch (`HomeScreen.tsx`, `AmigosQuickAccessPill.tsx`) were left untouched, confirmed
  by `git status`/the `tsc`/`jest` traces above showing zero new red result outside those two
  files' own scope (T025/T031).

## Run 3 — Round 2 review follow-up: destination-label localization fix + flag-badge redraw

Scope: two review-driven fixes to already-`[X]`'d Batch 2 (T007/T009/T010/T011) work, per
`progress/review_008-scan-experience.md`'s Round 2 verdict (CHANGES_REQUESTED, BLOCKING Finding
1) and a separate explicit human design decision on the flag badges. No task IDs change state —
both fixes correct behavior inside tasks already marked `[X]`, they don't complete new tasks.
`specs/008-scan-experience/tasks.md` is otherwise untouched by this run.

### Fix 1 — destination labels now localize (Round 2 Finding 1, FR-017/SC-006)

**Root cause confirmed**: `WebSidebarNav.tsx`, `WebBottomBarNav.tsx`, and
`app/(app)/_layout.tsx` all read `destination.label` straight off `NAV_DESTINATIONS`, a
hardcoded-Spanish field, instead of `navCopy`'s `navInicio`/`navEscanear`/`navCartera`/
`navTrades`/`navPerfil` keys (built in T003 for exactly this purpose but never consumed).

**Decision on `NavDestination.label`**: **removed**, not kept as a documented fallback. Grepped
every consumer of `NAV_DESTINATIONS`/`NavDestination` first (`grep -rln "NAV_DESTINATIONS"
src app`) — the only files that ever read `.label` were the three being fixed here
(`WebSidebarNav.tsx`, `WebBottomBarNav.tsx`, `app/(app)/_layout.tsx`) plus their own test files;
`AmigosQuickAccessPill.tsx`/`.test.tsx` and `HomeScreen.integration.test.tsx` (the two files
still pending T025/T031, out of scope for this run) only ever read `.route`, never `.label`, so
removing the field touches zero files outside this run's declared scope. Keeping a field that
by design nothing should ever render directly is exactly the kind of drift `docs/conventions.md`
warns against and the surest way this exact bug recurs later (a future consumer reaching for the
"obvious" `.label` field again) — so the field is gone, with a comment on `NavDestination`
explaining why and where the real copy lives.

**Files changed:**

- `src/domain/navigation.ts` — `NavDestination` interface no longer has a `label` field; all
  five `NAV_DESTINATIONS` entries now carry only `key`/`route`. Added a comment explaining why
  (destination names are user-facing copy and MUST go through `useTranslation(navCopy)`, not sit
  as a hardcoded string on this table) so this can't quietly reappear.
- `src/domain/navigation.test.ts` — "has the exact route and label for each destination" renamed
  to "has the exact route for each destination and carries no label field"; asserts the five
  `{key, route}` objects AND explicitly asserts `not.toHaveProperty("label")` on each, so the
  field's removal is itself regression-guarded, not merely implied by the type change.
- `src/features/navigation/WebSidebarNav.tsx` — builds a local `DESTINATION_LABELS:
  Record<NavDestinationKey, string>` from `useTranslation(navCopy)` (the exact pattern
  `DESTINATION_ICONS` already used two lines above it), renders that for both the link's
  `accessibilityLabel` and its visible `<Text>` instead of `destination.label`. Comment added at
  the fix site referencing Round 2's Finding 1.
- `src/features/navigation/WebBottomBarNav.tsx` — same fix; this file previously had **no**
  `navCopy`/`useTranslation` import at all (unlike `WebSidebarNav.tsx`, which already imported
  `navCopy` for the sidebar's brand block) — added both imports plus the same
  `DESTINATION_LABELS` lookup.
- `app/(app)/_layout.tsx` — `AppTabsLayout` now calls `useTranslation(navCopy)` and builds the
  same `TAB_LABELS: Record<NavDestinationKey, string>` lookup, used for both `title` and
  `tabBarAccessibilityLabel` (previously both read `destination.label`).
- `src/features/navigation/WebSidebarNav.test.tsx` / `WebBottomBarNav.test.tsx` — the "correct
  roles and labels" test now asserts against a locally-built `SPANISH_LABEL_BY_KEY` map (mirrors
  the component's own lookup, not imported from it) instead of `destination.label`. Added a new
  test to each file — "re-renders the destination labels in English when the locale context
  switches to 'en'" — that renders inside a real `LocaleProvider`, presses a `setLocale("en")`
  trigger (the identical `LocaleSwitchTrigger` pattern `TopRightControls.test.tsx` already
  established), and asserts all five links re-render under their `ENGLISH_LABEL_BY_KEY` names.
  **Confirmed this test genuinely fails without the fix**: reverted the two component files
  locally, re-ran just these two new tests, got `Unable to find an accessible element with
  text: "Home"` (Spanish `"Inicio"` persisted after the locale switch) — then re-applied the
  fix and re-ran to confirm green. This is exactly the reproduction Round 2's review described by
  hand; it's now a permanent regression test.
- `app/(app)/_layout.tsx` (native `<Tabs>`) has no existing test file — RNTL/`expo-router`'s
  `<Tabs>` component is not straightforward to render in this repo's test harness (no existing
  precedent anywhere in the codebase does it, unlike the two web layouts which mock `Link`/`Slot`
  directly), and `tasks.md`'s T009 never assigned this file a test. I did not create one for this
  fix — the native tab bar's `TAB_LABELS` lookup is byte-for-byte the same pattern as the two web
  files' (already covered by their new locale-switch tests), so the underlying logic is exercised
  even though this specific file's wiring isn't independently rendered. Flagging this as a
  disclosed gap rather than silently skipping it — if a reviewer wants native-layout coverage,
  that's a new, separate task (likely alongside T033's accessibility pass), not something to
  improvise into this fix.

### Fix 2 — flag badges redrawn as actual flag shapes (human decision, FR-012)

Per the human's explicit instruction: `FlagBadge` no longer renders a lime rounded chip with
"MX"/"US" text. It now renders a small (20×14 logical px) flag-shaped rectangle hand-drawn from
nested `View`s using each country's real flag colors:

- **Mexico**: three equal vertical bands, green (`#006847`) / white / red (`#CE1126`).
- **USA**: five alternating horizontal red (`#B22234`)/white stripes (top and bottom both red,
  matching the real flag's odd stripe count) with a blue (`#3C3B6E`) canton box in the upper-left
  covering the fly-side 42% of width and the top three of five stripes' height.

**Files changed:**

- `src/features/navigation/TopRightControls.tsx` — `FlagBadge` rewritten: a local `FLAG_COLORS`
  constant (with a comment explaining these are literal national-flag colors, not `src/theme`
  brand tokens, so they deliberately don't route through `src/theme/colors.ts`), `FLAG_WIDTH`/
  `FLAG_HEIGHT`/`USA_STRIPE_COLORS` constants, and the two shape trees (Mexico: a `flexDirection:
  "row"` container of three `flex: 1` bands; USA: a `flexDirection: "column"` container of five
  `flex: 1` stripes plus an absolutely-positioned canton `View`). The outer badge `View` clips
  overflow and carries a small `borderRadius: 2` + hairline border so the white band/stripe
  stays legible against any background. `testID`s (`flag-badge-mx`/`flag-badge-us`) are
  unchanged so nothing downstream that references them by ID breaks.
  - **Accessibility**: the outer badge `View` carries `aria-hidden` (not
    `accessibilityElementsHidden`/`importantForAccessibility` directly) — this mirrors
    `Viewfinder.tsx`'s existing decorative-gear-chip fix and its documented reasoning: React
    Native itself maps `aria-hidden` internally to that exact iOS/Android pair, and
    react-native-web forwards it straight through to the DOM's real `aria-hidden`, so it's the
    one prop that's actually correct on all three targets (the two-prop version silently doesn't
    reach the DOM on web). This satisfies the constraint that the flag `View`s must never
    surface as their own, separate, unlabeled accessibility elements — the ancestor `Pressable`
    still carries the real, unchanged `languageAccessibilityLabel`.
  - The 44×44 `Pressable` tap target, both-badges-shown-together behavior, and every
    accessibility label are all byte-for-byte unchanged — only the visual inside the badge
    changed.
- `specs/008-scan-experience/spec.md` — updated the "language control's flag icons avoid raw
  flag emoji" Design note to describe what actually ships now (flag-shaped rectangles built from
  real flag colors) instead of the retired two-letter text-chip description, with a sentence
  noting the human's 2026-08-05 explicit request superseded the earlier iteration. FR-012's own
  wording ("a recognizable Mexico/USA flag-style visual... without raw flag emoji... without a
  new icon/flag-asset dependency") already matched the new implementation with no edit needed.
- `src/features/navigation/TopRightControls.test.tsx` — the "renders the language control as a
  Mexico/USA FlagBadge pair, not a text label" test now also asserts `queryByText("MX")`/
  `queryByText("US")` are both `null` (the old lettered-chip text genuinely no longer renders).
  Two new tests assert the actual drawn structure via `.findAllByType(View)` +
  `StyleSheet.flatten(...).backgroundColor` on each badge (the same `ReactTestInstance.findByType`
  technique `SignInForm.test.tsx` already established for asserting a nested node's resolved
  style): Mexico's three bands resolve to exactly `["#006847", "#FFFFFF", "#CE1126"]` in that
  order; USA's stripes+canton resolve to exactly `["#B22234", "#FFFFFF", "#B22234", "#FFFFFF",
  "#B22234", "#3C3B6E"]`. Both queries pass `{ includeHiddenElements: true }` — required because
  RNTL v13 excludes `aria-hidden` elements from default queries, and the badges are
  intentionally `aria-hidden` (see above); this is documented inline in the test.

### `npx tsc --noEmit` — full repo, after this run

```
src/features/navigation/AmigosQuickAccessPill.test.tsx(32,70): error TS2367: This comparison appears to be unintentional because the types 'NavDestinationKey' and '"amigos"' have no overlap.
src/features/navigation/AmigosQuickAccessPill.tsx(16,70): error TS2367: This comparison appears to be unintentional because the types 'NavDestinationKey' and '"amigos"' have no overlap.
src/features/navigation/HomeScreen.integration.test.tsx(62,68): error TS2367: This comparison appears to be unintentional because the types 'NavDestinationKey' and '"amigos"' have no overlap.
src/features/navigation/HomeScreen.test.tsx(33,10): error TS2305: Module '"@/domain/navigation"' has no exported member 'SCAN_ROUTE'.
src/features/navigation/HomeScreen.tsx(5,10): error TS2305: Module '"@/domain/navigation"' has no exported member 'SCAN_ROUTE'.
```

Identical 5-error set to Run 2's post-batch trace, byte-for-byte — this run introduced **zero**
new `tsc` errors anywhere. Every remaining error maps to the same pending tasks Run 2 already
documented:

| File | Owning task |
|---|---|
| `src/features/navigation/HomeScreen.tsx` / `HomeScreen.test.tsx` (import removed `SCAN_ROUTE`) | **T025** |
| `src/features/navigation/HomeScreen.integration.test.tsx` (compares against retired `"amigos"` key) | **T025**/**T031** |
| `src/features/navigation/AmigosQuickAccessPill.tsx` / `.test.tsx` (same) | **T031** |

### `npm test` — full repo, after this run

```
Test Suites: 3 failed, 65 passed, 68 total
Tests:       5 failed, 429 passed, 434 total
```

The same three suites and five tests Run 2 already documented as T025/T031-owned are still the
**only** red results — confirmed line-for-line identical failure list to Run 2's own trace (three
`AmigosQuickAccessPill.test.tsx`/`HomeScreen.integration.test.tsx`/`HomeScreen.test.tsx`
failures, all `NAV_DESTINATIONS.find(d => d.key === "amigos")` returning `undefined` or the
still-English-hardcoded assertion in `HomeScreen.test.tsx`). Passed-test count rose from Run 2's
425 to this run's 429 — the four new tests this run added (two locale-switch tests, one each in
`WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx`, plus two new flag-structure tests in
`TopRightControls.test.tsx`, net of the one pre-existing test that was extended rather than
counted as new). Ran the full suite three times across this run (after each fix, then once more
final) — identical result every time, no flakiness observed.

Individually verified the four directly-touched test files pass in isolation too:

```
npx jest src/features/navigation/WebSidebarNav.test.tsx src/features/navigation/WebBottomBarNav.test.tsx \
  src/domain/navigation.test.ts src/domain/i18n/copy/nav.test.ts

Test Suites: 4 passed, 4 total
Tests:       22 passed, 22 total
```

```
npx jest src/features/navigation/TopRightControls.test.tsx

Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
```

### Manual/build check

Ran `npx expo export --platform web` after both fixes — succeeded, all existing routes exported
without a runtime import error (the `dist/` output was not committed; `.gitignore` already
excludes it). This confirms the updated `useTranslation(navCopy)` wiring in
`app/(app)/_layout.tsx`/`WebSidebarNav.tsx`/`WebBottomBarNav.tsx` and the rewritten
`TopRightControls.tsx` all bundle cleanly on web.

**Disclosed gap, same as Run 2's precedent**: this sandboxed environment still has no browser/
Playwright/Puppeteer tooling (`ls node_modules/.bin | grep -i "playwright\|puppeteer"` returns
nothing), so an actual `npm run web` + visual screenshot of the redrawn flags was not possible —
no "smoke-checked on web" claim is made. What IS demonstrated: (a) the RNTL debug-tree dump
captured while iterating on the flag-structure tests shows the exact nested `View` hierarchy
being produced (three plain `View`s under `flag-badge-mx`, six under `flag-badge-us` — matching
the intended band/stripe/canton structure) and (b) the two new structural tests assert the
resolved `backgroundColor` of each node against the real flag hex values, which is a stronger,
more precise check than a visual glance would be for confirming the right colors landed in the
right positions — but neither substitutes for an actual look. Recommend a human (or a future run
with browser tooling available) do a quick visual pass on `/`'s top-right corner in both a light
desktop viewport and a narrow mobile-width viewport before this feature is marked `done`.

### Tasks now `[X]`

None newly marked — this run corrects behavior inside T007/T009/T010/T011, all already `[X]`
since Run 2. No `tasks.md` checkbox changed.

### Deviations from the plan / notes for reviewer

- **`NavDestination.label` removed, not kept**: see "Decision on `NavDestination.label`" above —
  chose removal over keeping it as a documented non-render-ready fallback, since every legitimate
  consumer is exactly the three files fixed in this run and a lingering field is the likeliest
  way this same bug recurs. If a future feature genuinely wants a synchronous, non-i18n dev/debug
  label on this table (e.g. for a log line), that's a new, explicitly-named field
  (`debugLabel`?), not a resurrection of the ambiguous `label` name.
- **No test added for `app/(app)/_layout.tsx`'s native `<Tabs>` wiring**: flagged explicitly
  above (Fix 1's file list) — no existing precedent in this repo renders `expo-router`'s
  `<Tabs>` under RNTL, and `tasks.md` never assigned this file a test. The `TAB_LABELS` lookup is
  identical in shape/logic to the now-tested web equivalents; if independent native-layout
  coverage is wanted, it should be scoped as its own task rather than improvised here.
- **Flag colors and the small `borderRadius: 2`/hairline-border values are local, literal
  numbers/hex codes, not `src/theme` tokens** — flagged as an intentional, documented exception
  (see the `FLAG_COLORS` comment in `TopRightControls.tsx`): national flag colors are fixed
  real-world constants this app could never restyle, so they don't belong in the brand-palette
  vocabulary `src/theme/colors.ts` exists for, unlike every other color in this file.
- No blockers. Both fixes are scoped exactly to the review's Finding 1 and the human's flag
  redesign request; no other file in the repo was touched.

## Run 4 — Phase 2 found-state domain logic batch (T013–T014, User Story 2, completes Phase 2)

Scope: exactly the two `[US2]`-marked "Found-state domain logic" tasks in
`specs/008-scan-experience/tasks.md`. No Escanear route/screen wiring (Phase 3/4: T015–T024),
Inicio (T025), or placeholder-screen (Phase 6) files were touched — those are later tasks,
explicitly out of scope for this run. T001–T012 (Runs 1–3) were re-read but not modified;
`src/domain/scanResults.ts` (T002, already `[X]`/approved) was read closely and its pure
functions are called, never re-implemented, per this run's explicit instruction.

### Files changed

**T013 — `src/features/scanner/useScanSimulation.ts` (new) + `.test.tsx` (new)**
- A `useState<FoundCardState | null>` hook that thinly wraps every one of
  `src/domain/scanResults.ts`'s (T002) pure functions — `startFoundState`, `advanceToNextCard`,
  `selectCondition`, `toggleGraded`, `incrementQuantity`, `decrementQuantity`. Zero transition
  logic is duplicated here; every state change is `setResult((current) => current ? pureFn(current,
  ...) : current)` or a direct `setResult(...)`.
- Exposes exactly the surface `tasks.md` names: `result`, `confirming`, `triggerScan()` (idle →
  `startFoundState(SAMPLE_CARDS[0])`), `changeCard()` (→ `advanceToNextCard`), `removeCard()` (→
  `null`, also cancels any pending accept-confirmation timer), `acceptCard()` (sets `confirming`
  true, keeps `result` visible, then after a brief `ACCEPT_CONFIRMATION_MS` window clears both to
  idle — FR-009's "visible confirmation, then idle, no network call, no storage write"),
  `selectCondition`, `toggleGraded`, `incrementQuantity`, `decrementQuantity`.
- The `acceptCard()` timer is tracked in a `useRef` and cleared on unmount (a `useEffect` cleanup)
  and on `removeCard()` — prevents a stray timer from clearing a *different*, later-triggered
  found card out from under the user if "Eliminar" is pressed mid-confirmation.
- Zero camera-module import, zero backend call (`src/domain/api-client` is not imported anywhere
  in this file), zero persisted storage — `result`/`confirming` live only in this component-local
  `useState` (FR-016).
- Test file: a minimal RNTL test-harness component (`ScanSimulationHarness`) renders the hook's
  returned state as `Text`/`Pressable` elements (per the task's explicit "via a minimal
  test-harness component, RNTL" instruction) — six tests: starts idle; `triggerScan()` →
  `changeCard()` → `removeCard()` walks through the expected states; `changeCard()` resets
  condition/graded/quantity to the next card's own defaults (not the previous card's edited
  values); `decrementQuantity` never drops below `MIN_QUANTITY`; `acceptCard()` briefly shows a
  confirming state (result still visible) then returns to idle (`jest.useFakeTimers()` +
  `act(() => jest.advanceTimersByTime(...))`, the same pattern `ResetPasswordForm.test.tsx`'s
  resend-cooldown test already established); `removeCard()` cancels a pending `acceptCard()`
  timer so it can't clear a later, unrelated found state.

**T014 — `src/features/scanner/FoundCardPanel.tsx` (new) + `.test.tsx` (new)**
- The shared found-card detail panel, strictly props-driven (`state: FoundCardState`,
  `onSelectCondition`, `onToggleGraded`, `onIncrement`, `onDecrement`, `onChange`, `onRemove`,
  `onAccept`) — it never calls `useScanSimulation()` itself and has no internal fetch, matching
  the task's explicit "render this data, call this handler" constraint (Constitution IV) so both
  the mobile inline layout (T018) and the web side column (T021) can reuse it unmodified.
- Renders: the thumbnail (`card.thumbnailColorToken`), `card.name` (bold serif —
  `PLAYFAIR_DISPLAY_BOLD`), `formatDetailMeta(card)` (T002), a solid grade pill (`text.primary`
  bg / `bg.surface` text — no dedicated "solid badge" token exists in `src/theme`, documented
  inline as reusing the nearest existing pairing rather than inventing a raw hex), a green price
  pill (`accent.pillBg`/`accent.priceGreen`, the same pairing `StatusPill.tsx`/
  `RecentScansList.tsx` already establish), "Eliminar"/"Cambiar" text links (`text.danger`/
  `text.link` respectively — `text.link` is this repo's existing semantic "blue/actionable link"
  token even though its literal hex is green, the same token every other "blue link" in this app
  already uses, e.g. `SignInForm.tsx`'s "forgot password"), a "Gradeada" toggle + read-only grade
  value field (`card.grade` when on, `t("gradeValuePlaceholder")` — "—" — when off), a five-option
  condition-chip row (`CONDITION_OPTIONS`, T002, labels via `useTranslation(scanCopy)`, T006), a
  quantity −/+ stepper, the market price row, and an "Aceptar" `PrimaryButton`
  (`src/features/ui/PrimaryButton`).
- **Real accessible state, not just background color** (this run's explicit constraint):
  - Condition chips: wrapped in a `View accessibilityRole="radiogroup"`, each chip
    `accessibilityRole="radio"` with both `aria-checked` and `accessibilityState={{ checked }}` —
    the exact pairing `RegistrationForm.tsx`'s account-type radios already established (this
    repo's pinned react-native-web doesn't forward bare `accessibilityState` to the DOM, so
    `aria-checked` is required for a real web accessible name/state, not decorative).
  - "Gradeada" toggle: `accessibilityRole="switch"` with the same `aria-checked`/
    `accessibilityState.checked` pairing (mirrors `ProfileForm.tsx`'s checkbox fix).
  - Stepper "−": `disabled={!canDecrement}` AND `onPress={canDecrement ? onDecrement : undefined}`
    AND `accessibilityState={{ disabled: !canDecrement }}` at `MIN_QUANTITY` — genuinely blocks
    the press (verified by a test asserting `onDecrement` is never called), not merely dimmed.
- **≥44×44 tap targets** on every interactive element: link buttons (`minHeight`/`minWidth: 44`,
  mirroring `SignInForm.tsx`'s "forgot password" link), the toggle track (`minHeight: 44`,
  `width: 48`), condition chips (`minHeight`/`minWidth: 44`), and the stepper buttons
  (`width`/`height: 44`) — regression-guarded by a dedicated test.
- **Condition-chip row wraps to a second row**: `conditionRow` style is
  `flexDirection: "row", flexWrap: "wrap", gap: space.sm` — regression-guarded by a test asserting
  `flexWrap === "wrap"` on the row's flattened style (the mobile mockup shows four chips then
  "Fair" alone on a second row, per spec.md User Story 3 AS3).
- All copy through `useTranslation(scanCopy)` (T006) — the two stepper-button accessibility
  labels (no dedicated increment/decrement key exists in T006's already-approved dictionary, and
  this run does not modify `scan.ts`, which is out of this task's file scope) compose
  `t("quantityLabel")` with the universal `"+1"`/`"−1"` numeric suffix, the same treatment this
  repo already gives non-translatable data (card names/codes) — not a new hardcoded English/
  Spanish phrase.
- Card data (`name`, `grade`, `priceLabel`, `formatDetailMeta`) is intentionally NOT translated,
  matching T002/T006's already-established precedent that sample-card data is data, not UI copy.
- Zero camera-module import, zero backend call, zero `useScanSimulation()` import.
- Test file: 10 tests — the camera-import source-inspection guard (same technique every
  `src/features/scanner/` file test already carries); renders the documented fields for
  `SAMPLE_CARDS[0]` (thumbnail, name, meta, grade pill text, price pill text, links, "Gradeada"
  label, near-mint chip checked, quantity 1, "Aceptar" button); selecting a different chip calls
  `onSelectCondition` with that option and only one chip is ever checked (both immediately after
  the press, still reflecting the unchanged props-driven state, and after a `rerender` with a new
  `state` prop showing the checked state actually moves); the stepper's "−" is disabled at
  `MIN_QUANTITY` and does not call `onDecrement` when pressed; "+" calls `onIncrement`; toggling
  "Gradeada" calls `onToggleGraded` and the grade-value field's visible text follows the `graded`
  prop across a `rerender`; "Cambiar"/"Eliminar"/"Aceptar" call their respective handlers; the
  condition row is styled to wrap; every interactive element keeps a ≥44×44 tap target.

### Tests written/run (this batch's own two test files)

```
npx jest src/features/scanner/useScanSimulation.test.tsx src/features/scanner/FoundCardPanel.test.tsx

PASS src/features/scanner/useScanSimulation.test.tsx
PASS src/features/scanner/FoundCardPanel.test.tsx

Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
```

### Requirement traceability (this batch)

| FR | Test(s) |
|---|---|
| FR-007 | `useScanSimulation.test.tsx` — "starts idle (result null)", "walks triggerScan() -> changeCard() -> removeCard() through the expected states" |
| FR-008 | `FoundCardPanel.test.tsx` — "renders the documented fields for SAMPLE_CARDS[0]", "selecting a different condition chip calls onSelectCondition...", "shows exactly one chip selected after the state prop changes", "disables the stepper's '−' at MIN_QUANTITY...", "calls onIncrement...", "toggling 'Gradeada' calls onToggleGraded, and the grade-value field follows the graded prop" |
| FR-009 | `useScanSimulation.test.tsx` — "changeCard() resets condition/graded/quantity to the next card's own defaults", "acceptCard() briefly shows a confirming state then returns to idle", "removeCard() cancels a pending acceptCard() confirmation timer"; `FoundCardPanel.test.tsx` — "'Cambiar', 'Eliminar', and 'Aceptar' call their respective handlers" |
| FR-016 | Both files' camera-import source-inspection guard test; neither file imports `@/domain/api-client` or any storage API (confirmed by inspection, not just by test) |
| FR-017 | `FoundCardPanel.test.tsx` — every assertion reads copy via `scanCopy.es.*`, not a hardcoded literal |

(spec.md User Story 2's AS1–AS7 map onto the tests above 1:1 — AS1→"renders the documented
fields", AS2→the two condition-chip tests, AS3→the two stepper tests, AS4→the "Gradeada" test,
AS5→"Cambiar" assertion, AS6→"Eliminar" assertion, AS7→"acceptCard() briefly shows a confirming
state then returns to idle".)

### `npx tsc --noEmit` — full repo, after this batch

```
src/features/navigation/AmigosQuickAccessPill.test.tsx(32,70): error TS2367: ...
src/features/navigation/AmigosQuickAccessPill.tsx(16,70): error TS2367: ...
src/features/navigation/HomeScreen.integration.test.tsx(62,68): error TS2367: ...
src/features/navigation/HomeScreen.test.tsx(33,10): error TS2305: Module '"@/domain/navigation"' has no exported member 'SCAN_ROUTE'.
src/features/navigation/HomeScreen.tsx(5,10): error TS2305: Module '"@/domain/navigation"' has no exported member 'SCAN_ROUTE'.
```

Identical 5-error set to Run 3's post-batch trace, byte-for-byte — this run introduced **zero**
new `tsc` errors anywhere (neither of this batch's two new files, `useScanSimulation.ts`/
`FoundCardPanel.tsx`, appears in the list). Every remaining error maps to a task this batch was
explicitly told not to do:

| File | Owning task |
|---|---|
| `src/features/navigation/HomeScreen.tsx` / `HomeScreen.test.tsx` (import removed `SCAN_ROUTE`) | **T025** (Inicio redesign) |
| `src/features/navigation/HomeScreen.integration.test.tsx` (compares against retired `"amigos"` key) | **T025**/**T031** |
| `src/features/navigation/AmigosQuickAccessPill.tsx` / `.test.tsx` (same) | **T031** (retire Amigos/Social) |

### `npm test` — full repo, after this batch

```
Test Suites: 3 failed, 67 passed, 70 total
Tests:       5 failed, 445 passed, 450 total
```

The same three suites / five tests Runs 2–3 already documented as T025/T031-owned are still the
**only** red results (`AmigosQuickAccessPill.test.tsx`, `HomeScreen.integration.test.tsx`,
`HomeScreen.test.tsx` — all `NAV_DESTINATIONS.find(d => d.key === "amigos")` returning `undefined`
or `HomeScreen.test.tsx`'s still-hardcoded-English expectation). Passed suites rose from Run 3's
65/68 to this run's 67/70 (two new suites, both fully passing), and passed tests rose from 429 to
445 (16 new tests from this batch). No pre-existing passing suite outside the T025/T031-owned
files regressed.

`./init.sh --skip-build` was run and reports the same two expected `[FAIL]` stages
(type-check, tests) for the identical reasons documented above, plus its usual non-blocking
`expo-doctor`/native-dependency-alignment warnings (pre-existing, unrelated to this batch) — not
a new regression, matches the "clean except pending-task failures" bar this run was asked to
verify against.

### Build check

```
npx expo export --platform web
```

Succeeded — the web bundle exports cleanly with `useScanSimulation.ts`/`FoundCardPanel.tsx` in
the module graph (neither is wired into a route yet, so neither is part of the exported bundle's
reachable screens, but the export itself proves no import-graph error). `dist/` was deleted after
the check, not committed.

### Manual smoke check

**Not applicable to this batch, same disclosed precedent as Run 1**: neither
`useScanSimulation.ts` nor `FoundCardPanel.tsx` is wired into any route yet — that's T018
(mobile `ScanShellScreen.tsx`) and T021 (web `ScanShellScreen.web.tsx`), both explicitly
out of scope here. There is nothing new reachable through `npm run web` until those land. Level 2
(the 16 RNTL tests above, asserting real rendered output/behavior — accessibility roles/state,
visible text, tap-target sizes, wrap layout) is the verification this run supports; a live Level
3 pass over the found-card panel is deferred to T020 (mobile)/T024 (web)'s scheduled manual-smoke
tasks, consistent with `tasks.md`'s own sequencing.

### Tasks now `[X]`

T013, T014 — both marked `[X]` in `specs/008-scan-experience/tasks.md`. (T001–T012 remain `[X]`
from Runs 1–3.) **Phase 2 (Foundational) is now complete** — every task in "Domain layer",
"Shell chrome (User Story 1)", and "Found-state domain logic (User Story 2)" is `[X]`.

### Deviations from the plan / notes for reviewer

- **Stepper +/− accessibility labels compose `quantityLabel` with a literal `"+1"`/`"−1"`
  suffix** rather than a dedicated translated "increase"/"decrease" phrase, since T006's
  already-approved `scan.ts` dictionary has no such key and this task's file scope is limited to
  `FoundCardPanel.tsx`/`useScanSimulation.ts` only (not `scan.ts`). If a reviewer wants a fuller
  translated sentence (e.g. "Cantidad, disminuir" / "Quantity, decrease"), that's a small T006-
  adjacent follow-up adding two keys, not a structural change here.
- **"Solid" grade pill and "blue" Cambiar link both reuse existing tokens whose literal
  appearance doesn't perfectly match the mockup's English description** (`text.primary`/
  `bg.surface` for "solid"; `text.link`, whose real hex is green, for "blue") — both documented
  inline in `FoundCardPanel.tsx` and above, consistent with this repo's existing precedent
  (`text.link` already plays this role everywhere else a mockup calls for a blue link, e.g.
  `SignInForm.tsx`). No raw hex was introduced either way.
- **`confirming` is exposed by `useScanSimulation()` but has no corresponding prop on
  `FoundCardPanel`** — by design: `tasks.md` T014's prop list (`state`, `onSelectCondition`,
  `onToggleGraded`, `onIncrement`, `onDecrement`, `onChange`, `onRemove`, `onAccept`) has no slot
  for it, and FR-009's "visible confirmation" is therefore expected to be rendered by
  `ScanShellScreen.tsx`/`ScanShellScreen.web.tsx` (T018/T021) alongside `FoundCardPanel`, using
  `useScanSimulation()`'s `confirming` flag directly — not inside this props-driven component.
  Flagging so T018/T021's implementer knows `confirming`/`t("acceptedConfirmation")` are already
  available and wired correctly on the hook side.
- No blockers. Both tasks landed exactly as `tasks.md` specifies, calling only `src/domain/
  scanResults.ts`'s (T002) existing pure functions with zero duplicated transition logic, and
  touching no file outside this run's declared two-file (+ two test-file) scope.

## Run 5 — Phase 3, User Story 3: mobile Escanear (T015–T020)

### Scope

Exactly the six `[US3]`-marked tasks in `specs/008-scan-experience/tasks.md`'s Phase 3 —
`Viewfinder.tsx` state prop (T015), `ScanSearchField.tsx` `onSubmit` (T016), `UploadDropzone.tsx`
becomes pressable (T017), `ScanShellScreen.tsx` wiring (T018), route swap `app/scan.tsx` →
`app/(app)/escanear.tsx` (T019), and this run's own manual smoke check (T020). Phase 4
(`ScanShellScreen.web.tsx`, T021–T024), Phase 5 (`HomeScreen.tsx`/Inicio, T025), and Phase 6
(placeholders/Amigos-Social retirement, T027–T032) were not touched — those are later tasks. Read
Phase 2 (T001–T014, all `[X]`/reviewer-approved) but did not modify any of its files except where
explicitly noted below.

### Files changed

**T015 — `src/features/scanner/Viewfinder.tsx` + `.test.tsx`**
- Added `ViewfinderProps { state?: "idle" | "found" }` (default `"idle"`). `"found"` swaps the
  grid/brackets/camera-glyph/hint block for a glowing horizontal `brand.primary` scan line
  (a thin `View` with a colored `shadowColor`/`shadowOpacity`/`shadowRadius` — no new
  animation/glow dependency), a `checkmark-circle` glyph, and `t("viewfinderFoundHeading")`
  ("¡Carta encontrada!", T006's already-approved key). The gear chip renders unchanged in both
  states, still `aria-hidden`. Zero camera-module import (unchanged; the guard test still passes).
- Tests: idle still renders the grid/brackets/hint (existing test kept); new tests assert the
  default (`state` omitted) does NOT render the found heading, and `state="found"` renders the
  found heading and NOT the idle hint text.

**T016 — `src/features/scanner/ScanSearchField.tsx` + `.test.tsx`**
- Added `ScanSearchFieldProps { onSubmit?: () => void }`, wired to the `TextInput`'s
  `onSubmitEditing` (also set `returnKeyType="search"`) and a new `Pressable` wrapping the
  trailing magnifier glyph (`accessibilityRole="button"`, `accessibilityLabel` = the search
  placeholder text, `minWidth`/`minHeight: 44` for the tap-target floor without growing the
  visible 20px icon).
- Tests: submitting the field (RNTL's `submitEditing` event) and pressing the magnifier
  (`testID="scan-search-submit"`) both call `onSubmit`; omitting the prop doesn't throw on either
  path. Updated the pre-existing "renders the search placeholder as an accessible label" test to
  scope its magnifier-button assertion by role (`getByRole("button", { name: ... })`) instead of a
  bare `getByLabelText`, since the input and the now-pressable button both legitimately carry the
  same accessible name (the placeholder text) and a single `getByLabelText` now matches two
  elements.

**T017 — `src/features/scanner/UploadDropzone.tsx` + `.test.tsx`**
- Converted the outer `View` to a `Pressable` (`accessibilityRole="button"`, `accessibilityLabel`
  = `t("uploadDropzone")`, an `onPress?: () => void` prop, `minHeight: 44`). A code comment on the
  component explicitly discloses this as the reversal of `006-visual-identity`'s intentionally
  inert version, per this task's own instruction, referencing T017 by ID.
- Tests: replaced the old "does not expose a button role" assertion (now the exact opposite of
  intended behavior, per the task text) with "exposes an accessible button role/label"; added
  "calls onPress when pressed"; added "renders and behaves without throwing when onPress is
  omitted" (needed since `ScanShellScreen.web.tsx`, Phase 4's file, still renders this component
  without an `onPress` — left untouched this run).

**T018 — `src/features/scanner/ScanShellScreen.tsx` + `.test.tsx`**
- Calls `useScanSimulation()` (T013, already built/approved); passes `Viewfinder`
  `state={result ? "found" : "idle"}`; wires `ScanSearchField`'s `onSubmit` and
  `UploadDropzone`'s `onPress` to `triggerScan`; the "Escanear carta" `PrimaryButton` is now
  enabled (`disabled`/no-op `onPress={() => {}}` both removed, `onPress={triggerScan}`); renders
  `FoundCardPanel` (T014) inline below the controls, wired to every one of
  `useScanSimulation()`'s handlers, when `result` is non-null.
- **Deviation beyond the task's literal text, flagged explicitly**: also renders a visible
  `t("acceptedConfirmation")` line (`accessibilityRole="alert"`) while `useScanSimulation()`'s
  `confirming` flag is true. T018's own task text only says "render FoundCardPanel... when result
  is non-null" — it doesn't mention `confirming` — but `FoundCardPanel` (T014, already built) was
  deliberately built with **no** `confirming` prop, and that task's own Run 4 progress notes
  explicitly flagged "FR-009's 'visible confirmation' is therefore expected to be rendered by
  `ScanShellScreen.tsx`... alongside `FoundCardPanel`, using `useScanSimulation()`'s `confirming`
  flag directly." Without this, pressing "Aceptar" would have been a silent no-op for ~1.2s (the
  panel just sitting there, indistinguishable from before the press) before disappearing —
  directly violating FR-009 ("Aceptar' MUST give a visible local confirmation ... never a silent
  no-op") and spec.md User Story 2 AS7. Added the missing wiring rather than shipping the gap.
- Tests added to the existing "ScanShellScreen (mobile)" describe block (the "ScanShellScreen.web
  — ..." describe block, Phase 4's territory, is untouched): enabled button + no found panel at
  idle; pressing the button shows the found panel with Dragón Eterno's (`SAMPLE_CARDS[0]`) data;
  submitting the search field triggers it; tapping the dropzone triggers it; "Cambiar" advances to
  `SAMPLE_CARDS[1]`; "Eliminar" returns to idle; "Aceptar" shows the confirmation text then
  (`jest.useFakeTimers()` + `act(() => jest.advanceTimersByTime(...))`, the same pattern
  `useScanSimulation.test.tsx` already established) returns to idle with the confirmation gone.

**T019 — route swap**
- Created `app/(app)/escanear.tsx` (renders `ScanShellScreen`, no business logic, no "Back"
  affordance — the shell provides navigation away like every other destination) +
  `app/(app)/escanear.test.tsx` (confirms the shell renders with no `scan-back-button`, and that
  pressing "Escanear carta" shows the found panel end to end through the actual route file).
- Removed `app/scan.tsx` and `app/scan.test.tsx` in the same tool-call batch (`git rm` both, no
  intermediate state with either both files present or both absent-and-unreplaced).
- Verified no orphaned/duplicate route: `grep -rn "app/scan\b" app src` (excluding this run's own
  explanatory comments referencing the retired file by name) returns nothing outside comments;
  `app/(app)/_layout.tsx` (Phase 2, T009, already wired) already expected exactly
  `escanear: "escanear"` in `TAB_SCREEN_NAMES`, which this task's new file now satisfies; all
  three `./init.sh` bundle-export stages (web/iOS/Android) passed cleanly (see below) — Metro
  never complained about a missing or duplicate `escanear` route.

### A reverted attempt, disclosed rather than silently dropped

While preparing T020's smoke-check items, I found (by reading
`node_modules/@react-navigation/bottom-tabs/lib/module/views/BottomTabView.js` directly) that
`unmountOnBlur` defaults to `false` — i.e. React Navigation's bottom-tabs (which `app/(app)/
_layout.tsx`'s native `<Tabs>` wraps) does **not** unmount an inactive tab screen by default, only
hides it. Since `ScanShellScreen.tsx`'s found state lives in `useScanSimulation()`'s
component-local `useState`, a screen that stays mounted across a tab switch would **not**
naturally reset to idle — appearing to contradict spec.md User Story 3 AS4 ("navigate away via the
shell and back... resets to idle").

I prototyped a fix (`useFocusEffect` from `expo-router`, itself already a project dependency — no
new package — whose cleanup fires on blur, calling `removeCard()`), but reverted it: `expo-router`'s
`useFocusEffect` calls `@react-navigation/native`'s `useNavigation()` unconditionally, which
**throws** ("Couldn't find a navigation object. Is your component inside NavigationContainer?")
in every bare `render(<ScanShellScreen />)` test with no `<NavigationContainer>` — exactly the
rendering convention this whole file's test suite (and `app/(app)/escanear.test.tsx`) already
uses. Fixing that would mean adding an `expo-router` navigation mock to every test that renders
this screen, a broader testing-pattern change no task in this batch's text asked for, and a
unilateral design decision beyond what T015–T020 describe. Left as a **disclosed, unresolved
finding** (documented inline in `ScanShellScreen.tsx`'s own top comment, referencing this report)
for the human/orchestrator to decide between: (a) a small `unmountOnBlur: true` addition scoped to
the Escanear `<Tabs.Screen>` in the already-approved `app/(app)/_layout.tsx` (Phase 2), or (b) a
`useFocusEffect`-based reset in `ScanShellScreen.tsx` plus the test-mocking ripple it requires, or
(c) accepting this as a known loose end, the same way spec.md's own Edge Cases section already
accepts the web resize-triggered-remount caveat as a disclosed, unfixed loose end from `004`.

### Tests written/run (this batch's changed/new files)

```
npx jest src/features/scanner "app/(app)/escanear" --silent
```
(the `(app)` glob needed a separate `--testPathPattern "escanear"` run since the parens aren't a
literal Jest testPathPattern token; both runs shown together here)

```
PASS src/features/scanner/RecentScansList.test.tsx
PASS src/features/scanner/ScanEntryCard.test.tsx
PASS src/features/scanner/useScanSimulation.test.tsx
PASS src/features/scanner/FoundCardPanel.test.tsx
PASS src/features/scanner/EmptyResultsPanel.test.tsx
PASS src/features/scanner/UploadDropzone.test.tsx
PASS src/features/scanner/Viewfinder.test.tsx
PASS src/features/scanner/ScanSearchField.test.tsx
PASS src/features/scanner/ScanShellScreen.test.tsx

Test Suites: 9 passed, 9 total
Tests:       61 passed, 61 total
```

```
PASS app/(app)/escanear.test.tsx

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

### Requirement traceability (this batch)

| FR | Test(s) |
|---|---|
| FR-003 (Escanear is a shell destination, not a standalone route with its own "Back") | `app/(app)/escanear.test.tsx` — 'renders the scan visual shell (title "Escanear") with no standalone "Back" affordance' |
| FR-004 (mobile: branded viewfinder idle/found, enabled "Escanear carta" wired to the local found trigger) | `Viewfinder.test.tsx` — 'defaults to "idle"...', 'state="found" renders the check glyph heading...'; `ScanShellScreen.test.tsx` — "renders an enabled scan button and no found panel at idle", 'pressing "Escanear carta" shows the found panel...' |
| FR-007 (every trigger — button, search-submit, dropzone-tap — fires the same local found-state action, none inspects real input) | `ScanSearchField.test.tsx` — "calls onSubmit when the field is submitted", "calls onSubmit when the magnifier button is pressed"; `UploadDropzone.test.tsx` — "calls onPress when pressed"; `ScanShellScreen.test.tsx` — "submitting the search field shows the found panel", "tapping the upload dropzone shows the found panel" |
| FR-008 (found-card panel renders inline with real interactive condition/graded/quantity state) | `ScanShellScreen.test.tsx` — 'pressing "Escanear carta" shows the found panel with Dragón Eterno's data' (FoundCardPanel's own field-level tests are T014's, unchanged, still green) |
| FR-009 ("Cambiar"/"Eliminar"/"Aceptar" — advance/reset-to-idle/visible-confirmation-then-idle, no network, no storage) | `ScanShellScreen.test.tsx` — 'pressing "Cambiar" advances the found panel to the next sample card', 'pressing "Eliminar" returns to idle...', 'pressing "Aceptar" shows a visible confirmation, then returns to idle' |
| FR-016 (zero camera-module import in any file this batch touched) | Every changed file's own camera-import source-inspection guard test (`Viewfinder.test.tsx`, `ScanSearchField.test.tsx`, `UploadDropzone.test.tsx`, and `ScanShellScreen.test.tsx`'s `SCANNER_SOURCE_FILES` guard, unchanged list — extending it to `FoundCardPanel.tsx`/`useScanSimulation.ts` is T023's job, Phase 4, not this batch's) |
| FR-018 (≥44×44 tap target, real accessibility label, every interactive element this batch touched) | `ScanSearchField.tsx`'s `submitButton` style sets `minWidth`/`minHeight: 44` (source-level, not independently unit-tested in this batch — no existing test-file precedent in this repo asserts raw `StyleSheet` values for a ≥44 floor outside a dedicated a11y-pass task); `UploadDropzone.test.tsx`'s role/label test confirms the accessible name; `FoundCardPanel`'s own T014 tests (unchanged) already cover its own tap targets |

### `npx tsc --noEmit` — full repo, after this batch

```
src/features/navigation/AmigosQuickAccessPill.test.tsx(32,70): error TS2367: ...
src/features/navigation/AmigosQuickAccessPill.tsx(16,70): error TS2367: ...
src/features/navigation/HomeScreen.integration.test.tsx(62,68): error TS2367: ...
src/features/navigation/HomeScreen.test.tsx(33,10): error TS2305: Module '"@/domain/navigation"' has no exported member 'SCAN_ROUTE'.
src/features/navigation/HomeScreen.tsx(5,10): error TS2305: Module '"@/domain/navigation"' has no exported member 'SCAN_ROUTE'.
```

Identical 5-error set to Run 4's — this batch introduced **zero** new `tsc` errors. Confirmed by
`git stash` (reverting to the `006-visual-identity` merge base, before any of this feature's
Phase 2/3 work existed) that these exact three suites/five failures are pre-existing to this
batch, not caused by it — they trace to `HomeScreen.tsx` still importing the now-removed
`SCAN_ROUTE` and `AmigosQuickAccessPill.tsx`/its tests comparing against the now-retired
`"amigos"` `NavDestinationKey`, both explicitly **T025**'s (Inicio redesign) and **T031**'s
(retire Amigos/Social) job — neither touched by T015–T020.

### `npm test` — full repo, after this batch

```
Test Suites: 3 failed, 67 passed, 70 total
Tests:       5 failed, 459 passed, 464 total
```

The same three suites (`AmigosQuickAccessPill.test.tsx`, `HomeScreen.integration.test.tsx`,
`HomeScreen.test.tsx`) as Run 4, still the **only** red results. Passed tests rose from Run 4's
445 to this run's 459 (14 new tests: 2 on `Viewfinder`, 3 on `ScanSearchField`, 2 on
`UploadDropzone`, 6 on `ScanShellScreen` mobile, 2 on the new `escanear.test.tsx` route file, net
of the one pre-existing `ScanSearchField` assertion I rewrote rather than added). No pre-existing
passing suite outside the T025/T031-owned files regressed.

### Build check (Level 4)

```
./init.sh          # full, no --skip-* flags
```

```
▶ 4/8 Type-checking            ❌ FAIL (the 5 pre-existing errors above)
▶ 7/8 Running test suite       ❌ FAIL (the 3 pre-existing suites above)
▶ 8/8 Bundle export smoke checks
  ✅ Build check (web): web bundle exported cleanly
  ✅ Build check (ios): ios bundle exported cleanly
  ✅ Build check (android): android bundle exported cleanly

RESULT: FAILED (2/10 stages failed)
```

All three platforms' bundle exports are clean — directly confirms T019's route swap left no
orphaned/duplicate `escanear` (or stale `scan`) route on any target, and that no new native
dependency was pulled in. The two `FAIL`ed stages are exactly (and only) the pre-existing
T025/T031-owned breakage above; the two `WARN`-level stages (`expo-doctor`, native-dependency
version drift) are the same pre-existing, unrelated drift every prior run in this feature has
already documented (no dependency added/changed this batch). Re-ran `./init.sh --skip-native`
after the `confirming`-banner fix (below) and confirmed the web export stage alone is still
clean, without re-paying the ~5 min native-export cost twice.

### Manual smoke check (Level 3) — T020

**Environment**: no `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` are set in this
environment's `.env` (both empty strings), and no local `Draw-a-card` backend is running. Per
`docs/verification.md`'s "Which live services to run" table, this is the **neither-configured**
case — every authenticated route (everything past `useKycGate()`, i.e. every one of this
feature's own screens) is genuinely unreachable via a real sign-in, on every platform, since
`app/_layout.tsx`'s `KycGate` wraps the entire root `<Stack>` regardless of platform or route
group.

**What I actually did, and what it does/doesn't prove**:

1. `npm run web` (`expo start --web`) — booted clean: `Web Bundled ... node_modules/expo-router/
   entry.js (883 modules)`, no error, only the two pre-existing native-dependency-drift warnings
   already documented in every prior run.
2. Used Playwright (Chromium was already cached in this environment from a prior session —
   confirmed via `npx playwright install chromium --dry-run` pointing at an existing
   `~/Library/Caches/ms-playwright/chromium-1234` install) to navigate to
   `http://localhost:8098/escanear` at a 390×844 (mobile) viewport. **Result: redirected to
   `/login`**, screenshot confirmed (`Draw a Card` sign-in form rendered correctly) — this is the
   KYC gate working exactly as designed for an unauthenticated session (FR-014 — zero diff to the
   gate), not a bug, but it does mean the actual Escanear screen was never visually reachable this
   run.
3. Fetched the real compiled bundle Metro serves for web (`/node_modules/expo-router/
   entry.bundle?platform=web&dev=true`, ~6.3 MB) and grepped it: `"Escanear carta"` → 5 matches,
   `"Subir imagen de carta"` → 2, `"Buscar carta por nombre..."` → 1 — confirms this batch's
   strings genuinely compiled and shipped in the web bundle. **Also discovered, and worth
   recording explicitly**: `SAMPLE_CARDS`/`dragon-eterno`/`"BGS 9.5"` (i.e. anything only reachable
   through `ScanShellScreen.tsx`'s mobile-only import chain — `FoundCardPanel`/
   `useScanSimulation`/`scanResults.ts`) are **absent** from this web bundle. This is expected,
   not a bug: on the web platform, Metro's `.web.tsx` platform-extension resolution picks
   `ScanShellScreen.web.tsx` for the bare `"./ScanShellScreen"` import in `app/(app)/escanear.tsx`
   — never `ScanShellScreen.tsx` (this batch's file) — regardless of the browser's viewport width.
   **This means T015–T018's actual code path is never exercised by `npm run web` at any width,
   mobile or otherwise** — only by iOS/Android, where no `.ios.tsx`/`.android.tsx` file exists so
   Metro falls back to the bare `ScanShellScreen.tsx`. I want this stated plainly rather than
   implied: T020's task text says "`npm run web` at a mobile width" as its primary check, but for
   this specific file pair (a `006-visual-identity` structural decision, unchanged by this batch)
   that instruction cannot actually reach this batch's own code on any platform except native.
4. iOS simulators ARE available in this environment (`xcrun simctl list devices available` shows
   iPhone 17/17 Pro/Air/etc., all `Shutdown` but bootable) — Android has never been available in
   this environment (consistent with every prior run in this feature). I did **not** boot the iOS
   simulator this run: doing so would hit the exact same Supabase-credential wall at the exact
   same place (`app/_layout.tsx`'s `KycGate` wraps the root `<Stack>` identically on every
   platform), so it would add build time (a full Expo Go/dev-client boot) without adding reachable
   coverage beyond what step 2 already showed on web. Flagging this reasoning explicitly rather
   than silently skipping it.

**What I therefore rely on instead, and its limits**: the interaction behavior T020 asks me to
verify (idle rendering, the three trigger paths, the found panel's data, "Cambiar"/"Eliminar"/
"Aceptar") is proven by the Level 2 `@testing-library/react-native` tests above — these render the
**real, unmocked** `ScanShellScreen`/`Viewfinder`/`ScanSearchField`/`UploadDropzone`/
`FoundCardPanel`/`useScanSimulation` component tree and business logic (not stubs), and drive them
with real `fireEvent.press`/`fireEvent(..., "submitEditing")` calls — this is meaningfully more
than a snapshot or a "doesn't crash" check, but it is still jsdom/react-test-renderer, not a real
device compositor. It **cannot** catch a real-device-only layout/runtime bug the way `004`'s two
simulator-only bugs were caught. Combined with Level 4's clean three-platform bundle export (which
does prove the actual native module graph resolves and bundles without error), my honest
confidence level for this batch is: **compiles and bundles cleanly on all three platforms; the
exact production logic is exercised end-to-end by real (non-mocked) component tests; the screen's
on-device pixel-level appearance and the "navigate away and back" native tab-persistence question
(see the reverted-attempt section above) were NOT visually confirmed on a live device or simulator
this run**, because of the credential wall documented above.

**"Navigating to another destination and back resets to idle"**: NOT verified live (same wall);
see the "reverted attempt" section above for the source-level finding (React Navigation's
`unmountOnBlur` defaults `false`) that this may not actually hold on native as currently wired,
disclosed as an open finding rather than silently assumed to work.

### Tasks now `[X]`

T015, T016, T017, T018, T019, T020 — all marked `[X]` in `specs/008-scan-experience/tasks.md`.
**Phase 3 (User Story 3, mobile Escanear) is now complete.**

### Deviations / notes for sign-off

1. **Added a `confirming` visual confirmation to `ScanShellScreen.tsx` beyond T018's literal task
   text** (see the T018 file entry above) — required by FR-009, and explicitly anticipated by
   T014's own Run 4 notes. Not an invented scope expansion; closes a gap the prior task's
   implementer already flagged as this task's responsibility.
2. **Prototyped and reverted a `useFocusEffect`-based fix for AS4's "resets to idle on
   navigate-away-and-back"** — left as a disclosed, unresolved finding rather than either a
   silent gap or a unilateral fix with untracked test-suite-wide ripple (see the dedicated section
   above). Recommend the human/orchestrator pick one of the three options listed there as a small
   follow-up task.
3. **`npm run web` cannot reach this batch's own mobile-only code path at all, on any viewport
   width**, because `ScanShellScreen.web.tsx` (Phase 4's untouched file) is what Metro resolves
   for the web platform regardless of window size — this is a pre-existing structural fact from
   `006-visual-identity`, not something this batch changed, but flagging it because T020's own
   task text implies `npm run web` is the primary way to check T015–T018, and for this specific
   pair of files that's only true for the *shell around* Escanear (the 5-destination nav, the
   route resolving, the bundle being clean), not for the viewfinder/button/found-panel wiring
   itself.
4. No other deviations. `ScanShellScreen.web.tsx`, `RecentScansList.tsx`,
   `ScanShellScreen.test.tsx`'s web describe block and its `SCANNER_SOURCE_FILES` guard list,
   `HomeScreen.tsx`, and every Phase 4/5/6 file were read where relevant for context but not
   modified, per this batch's explicit scope.

Next: Phase 4 (User Story 4, web Escanear — T021–T024), independently buildable against the same
Phase 2 foundation this batch also depended on. The two disclosed findings above (the AS4
tab-persistence question, and `npm run web`'s inability to reach mobile-only Escanear code) are
both still open and not addressed by Phase 4 automatically — worth the orchestrator's explicit
attention before/alongside that batch.

---

## Run 6 — Standalone follow-up: AS4 unmountOnBlur fix (T020a) + orphaned i18n key removal

### Scope

Exactly the two fixes the orchestrator specified from code-reviewer's Round 5 verdict
(`progress/review_008-scan-experience.md`, "Review: T015–T020" section, §1 and Finding 2) —
deliberately standalone, not folded into Phase 4 (T021–T024) or any later batch's diff, per the
orchestrator's and the reviewer's own explicit request.

1. Close the User Story 3 AS4 gap (orchestrator decision: option (a) — `unmountOnBlur: true`
   scoped to the Escanear `<Tabs.Screen>` in `app/(app)/_layout.tsx`).
2. Remove `src/domain/i18n/copy/scan.ts`'s orphaned `backLabel`/`backAccessibilityLabel` keys
   (both locales), dead since T019 removed `app/scan.tsx`'s "Back" affordance.

Neither Phase 4/5/6 file was touched. No other file in the working tree was modified beyond what
is listed below.

### Files changed

**`app/(app)/_layout.tsx`** — added `unmountOnBlur: true` to the Escanear `<Tabs.Screen>`'s
`options` only (spread conditionally on `destination.key === "escanear"`), with a code comment
explaining: what P1 acceptance scenario it closes (AS4), the orchestrator decision/date, the
`@react-navigation/bottom-tabs` default (`unmountOnBlur: false`) it overrides, that it is scoped
to Escanear only (the other four destinations keep the default), and the known, accepted side
effect — remounting Escanear's whole subtree (not just found-state) on every tab-away/back,
including scroll position, and that any *future* local state added to this screen will reset too.
The comment explicitly warns against "cleaning this up" without re-reading the linked review.

**`src/features/scanner/ScanShellScreen.tsx`** — rewrote the file-top comment block that
previously described this as a "disclosed, unresolved finding" needing sign-off; it now points to
where the fix actually lives (`app/(app)/_layout.tsx`'s `unmountOnBlur: true`, T020a) and keeps
the still-true technical reasoning for why a `useFocusEffect`-based reset inside this component
itself was rejected (would require an `expo-router`/`NavigationContainer` mock in every existing
bare-render test of this file and `app/(app)/escanear.test.tsx`). No behavioral change to this
file — comment-only.

**`src/features/navigation/AppNativeLayout.test.tsx`** (new) — the regression test for the fix.
Per the reviewer's explicit instruction ("`unmountOnBlur` is a navigator-level option never
executed by the component under test... assert the option is set on the Escanear screen's config
rather than pretending to simulate a real tab blur"), this does exactly that: it shallow-renders
`AppTabsLayout` (`app/(app)/_layout.tsx`'s default export) using `react-test-renderer/shallow`,
which calls the component function (running its real hooks, `useTranslation` included) but does
**not** recurse into `<Tabs>` itself — so no `<NavigationContainer>` is needed (the exact
constraint that sank the earlier `useFocusEffect` prototype in Run 5). The shallow-render output
is the raw `<Tabs>` React element; its `children` prop is the array of five still-unexecuted
`<Tabs.Screen>` elements, each carrying its real `options` object as plain data. The test asserts
`options.unmountOnBlur === true` for the Escanear screen and `undefined` (navigator default, not
explicitly set) for the other four. Colocated under `src/features/navigation/`, not as
`app/(app)/_layout.test.tsx`, per `docs/conventions.md`'s `_layout.*` exception (same reasoning
`AppWebLayout.test.tsx` already documents).

I did not stop at "this compiles" — I verified the test is a genuine regression guard by
temporarily reverting the `unmountOnBlur: true` addition (`app/(app)/_layout.tsx`) and re-running
just this test file: it failed (`Expected: true, Received: undefined`), then restored the fix and
re-ran: it passed. Confirms the test would actually catch a regression, not merely assert
something trivially true.

**`types/react-test-renderer-shallow.d.ts`** (new) — a minimal ambient module declaration for
`react-test-renderer/shallow`. This is **not a new dependency** — `react-test-renderer` is
already an installed project dependency (`package.json`), and `react-test-renderer/shallow` is
one of its own subpath exports (backed by `react-shallow-renderer`, already present in
`node_modules` as a transitive dependency); it simply ships no TypeScript declarations of its own
and no `@types/react-test-renderer` package covers the shallow-renderer subpath. Without this,
`npx tsc --noEmit` reported `TS7016: Could not find a declaration file for module
'react-test-renderer/shallow'` on the new test file. The declaration is scoped to exactly the
`ShallowRenderer` class shape this one test file uses (`render`, `getRenderOutput`, `unmount`).

**`src/domain/i18n/copy/scan.ts`** — removed the `backLabel`/`backAccessibilityLabel` keys from
both the `es` and `en` dictionaries. Before removing, ran
`grep -rn "backLabel\|backAccessibilityLabel" --include="*.ts" --include="*.tsx" .` (excluding
`node_modules`) — the only matches were the four lines inside `scan.ts` itself (two per locale);
no component/screen file consumed either key. Confirms nothing else was stranded by the removal.
Also rewrote the file's top comment: it previously described these keys as belonging to "the
existing 'Back'/'Back to Home' affordance already present in `app/scan.tsx`... which this feature
restyles but does not remove (FR-009)" — stale since T019 (an earlier batch, already `[X]`)
removed `app/scan.tsx` and its "Back" affordance outright, which is what made these two keys
orphaned in the first place. The new comment states plainly that the keys were removed as a
standalone follow-up once they lost their only consumer, with a grep-confirmed note and a
pointer to this report.

**`src/domain/i18n/copy/scan.test.ts`** — no existing assertion directly referenced `backLabel`/
`backAccessibilityLabel` by value (grep-confirmed), so the existing key-parity test
(`Object.keys(scanCopy.es).sort()` vs. `scanCopy.en`'s) continues to pass unchanged — both
locales lost the same two keys together. Added one new test, mirroring the regression-guard
pattern `navigation.test.ts`'s Round 3 fix already established for a structurally identical
situation (`not.toHaveProperty("label")`): asserts `scanCopy.es`/`scanCopy.en` no longer have
`backLabel`/`backAccessibilityLabel`, so the dead keys can't silently reappear unnoticed.

**`specs/008-scan-experience/tasks.md`** — added `T020a` under Phase 3 (User Story 3), marked
`[X]`, describing exactly this fix and explicitly noting no prior Phase 3 task ever owned AS4
(T018's own FR-traceability line cites AS1–AS3 only) — the gap `code-reviewer`'s Round 5 review
and this run's brief both identified.

### Tests written/run

```
npx jest src/features/navigation/AppNativeLayout.test.tsx src/domain/i18n/copy/scan.test.ts --silent
```
```
PASS src/features/navigation/AppNativeLayout.test.tsx
PASS src/domain/i18n/copy/scan.test.ts

Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total
```

Regression-guard proof for `AppNativeLayout.test.tsx` (temporarily reverted
`unmountOnBlur: true`, re-ran, restored):
```
FAIL src/features/navigation/AppNativeLayout.test.tsx
  ● ... sets unmountOnBlur: true on the Escanear <Tabs.Screen> only ...
    Expected: true
    Received: undefined
```
— confirms the test genuinely fails without the fix.

### `npx tsc --noEmit` — full repo, after this run

```
src/features/navigation/AmigosQuickAccessPill.test.tsx(32,70): error TS2367: 'NavDestinationKey'/'"amigos"' no overlap
src/features/navigation/AmigosQuickAccessPill.tsx(16,70): error TS2367: same
src/features/navigation/HomeScreen.integration.test.tsx(62,68): error TS2367: same
src/features/navigation/HomeScreen.test.tsx(33,10): error TS2305: no exported member 'SCAN_ROUTE'
src/features/navigation/HomeScreen.tsx(5,10): error TS2305: no exported member 'SCAN_ROUTE'
```

Exactly the same 5 pre-existing errors as every prior run since Run 1 — **zero new `tsc` errors**
from this run's own two files (`app/(app)/_layout.tsx`, `AppNativeLayout.test.tsx`); the new
`react-test-renderer/shallow` type-declaration gap (`TS7016`) was fixed via
`types/react-test-renderer-shallow.d.ts` rather than left red or silenced with `any`/
`@ts-ignore`. Mapping, as requested:

| File | Error | Owner |
|---|---|---|
| `src/features/navigation/AmigosQuickAccessPill.tsx` / `.test.tsx` | `NavDestinationKey`/`"amigos"` no overlap | **T031** (retire Amigos/Social) |
| `src/features/navigation/HomeScreen.integration.test.tsx` | same | **T031** (also T025-adjacent, same root cause) |
| `src/features/navigation/HomeScreen.tsx` / `.test.tsx` | no exported member `SCAN_ROUTE` | **T025** (Inicio redesign — repoints `ScanEntryCard`'s `onPress` to `NAV_DESTINATIONS`) |

### `npm test` — full repo, after this run

```
Test Suites: 3 failed, 68 passed, 71 total
Tests:       5 failed, 461 passed, 466 total
```

The same three suites as every prior run (`AmigosQuickAccessPill.test.tsx`,
`HomeScreen.integration.test.tsx`, `HomeScreen.test.tsx`) are the **only** red results — same 5
failing tests, same root causes (T025/T031), confirmed by diffing the failure output against
Run 5's own recorded numbers. Passed-test count rose from Run 5's 459 to this run's 461 (net of
the suite total also rising by 2 new files): `AppNativeLayout.test.tsx` (1 new test) and one new
test added to `scan.test.ts` (the `not.toHaveProperty` regression guard) — 2 new tests, matching
461 vs. 459. No pre-existing passing suite regressed.

### Requirement/scenario traceability (this run)

| Item | Test(s) |
|---|---|
| spec.md User Story 3 AS4 ("navigate away via the shell and back... resets to idle") | `AppNativeLayout.test.tsx` — "sets unmountOnBlur: true on the Escanear \<Tabs.Screen\> only..." (asserts the navigator-level config that closes the gap; see the file's own comment for why a full simulated-blur test isn't possible/honest at this level) |
| Orphaned-key removal (no FR — Finding 2, code cleanliness, not a functional requirement) | `scan.test.ts` — "no longer carries the retired backLabel/backAccessibilityLabel keys..." |

### Which task IDs are now `[X]`

`T020a` — newly added to `specs/008-scan-experience/tasks.md` under Phase 3 and marked `[X]` in
the same edit. No other task ID changed state this run (T015–T020 were already `[X]` from Run 5;
Phase 4 onward remains untouched).

### Deviations / notes for sign-off

1. **Added `types/react-test-renderer-shallow.d.ts`**, a small ambient type declaration, not
   listed explicitly in the orchestrator's brief. This is not a new runtime or dev dependency —
   `react-test-renderer` (which ships the `shallow` subpath) is already installed; the shim only
   supplies the missing TypeScript declarations `tsc --noEmit` requires to type-check the new
   test file without `any`/`@ts-ignore` (`docs/conventions.md`'s strict-mode rule). Flagging this
   explicitly since it's a new file the brief didn't name, in the interest of not silently adding
   anything unreviewed.
2. **Rewrote (did not just trim) the top-of-file comments in both `app/(app)/_layout.tsx`'s new
   options block and `src/domain/i18n/copy/scan.ts`**, beyond the minimum needed to make the
   diffs technically correct — both files had comments that would otherwise go stale/misleading
   the moment this fix landed (one described the AS4 gap as still-open; the other still described
   the now-nonexistent `app/scan.tsx` "Back" affordance as the reason these keys existed). Left
   as-is would have been a worse version of exactly the kind of drift `docs/conventions.md`'s
   "extreme consistency" principle warns about.
3. No other deviation. Every other file left untouched by prior runs (Phase 4/5/6 files, the
   already-`[X]` Phase 2/3 files besides the two edited above) was not modified.

Next: Phase 4 (User Story 4, web Escanear — T021–T024) remains the next unstarted work, as it was
before this run. This run closes both of Round 5's outstanding follow-up items; no other open
finding from any prior review round is addressed here.

## Run 7 — Phase 4, User Story 4: web Escanear (T021–T024)

### Scope

Exactly the four `[US4]`-marked tasks in `specs/008-scan-experience/tasks.md`'s Phase 4 —
`ScanShellScreen.web.tsx`'s camera-free two-column layout (T021), `RecentScansList.tsx` reading
`SAMPLE_CARDS` (T022), the extended camera-import/absence guard in `ScanShellScreen.test.tsx`
(T023), and this run's own manual smoke check (T024). Phase 3 (T015–T020a, mobile Escanear) was
already `[X]`/complete before this run and was read for context (mobile's
`ScanShellScreen.tsx`/`useScanSimulation.ts`/`FoundCardPanel.tsx` are reused, not modified) but
not changed. Phase 5 (`HomeScreen.tsx`, T025) and Phase 6 (placeholders/Amigos-Social retirement,
T027–T032) were not touched.

### Files changed

**T021 — `src/features/scanner/ScanShellScreen.web.tsx`**
- `Viewfinder`, the `PrimaryButton` ("Escanear carta"), and the `StatusPill` ("Cámara disponible")
  are removed from this file's imports and JSX entirely — not conditionally hidden, not gated
  behind a prop. There is no `Viewfinder` import anywhere in this file, so no future prop change
  can resurrect it on web (the central requirement this batch was given). The left ("controls")
  column now renders only the title, `ScanSearchField`, and `UploadDropzone`.
- Calls `useScanSimulation()` (T013, unchanged) directly; `ScanSearchField`'s `onSubmit` and
  `UploadDropzone`'s `onPress` are both wired to `triggerScan()` — web's only two triggers (spec.md
  Design note: no viewfinder/button exists on web to trigger from).
- The right ("results") column renders the shared `FoundCardPanel` (T014, reused byte-for-byte —
  no new prop, no platform branch inside it) when `result` is non-null, `EmptyResultsPanel`
  otherwise, both always followed by `RecentScansList` (T022) — matching spec.md User Story 4 AS1
  (idle) and AS2 (found, list stays visible).
- Added the same `confirming`-flag visible-confirmation line `ScanShellScreen.tsx` (mobile, T018)
  already renders — `FoundCardPanel` deliberately has no `confirming` prop (T014's own design), so
  without this, "Aceptar" on web would have been a silent no-op for ~1.2s, violating FR-009 the
  same way an unfixed web gap would have. Not explicitly named in T021's own task text, but
  required by FR-009 (which is platform-agnostic) and directly mirrors T018's own precedent —
  flagged as a deliberate consistency choice, not a scope invention.
- The `.web.tsx` file-extension convention remains the entire platform split — no `Platform.OS`
  branch was added anywhere in this file (Constitution IV).

**T022 — `src/features/scanner/RecentScansList.tsx` + `.test.tsx`**
- `PLACEHOLDER_ROWS`/`PlaceholderScanRow` (006-visual-identity's hand-typed Charizard/Blastoise/
  Venusaur set) are gone. The list now maps `SAMPLE_CARDS` (`@/domain/scanResults`, T002) directly,
  rendering `card.name`, `formatListMeta(card)` (`"${grade} · ${code}"`), and `card.priceLabel` per
  row — the exact same data source `useScanSimulation()`'s `triggerScan()`/`FoundCardPanel` already
  read from (FR-010's "single shared pool," zero drift risk between the two lists going forward).
- Test file rewritten: the camera-import guard is unchanged; the "imports no data-fetching
  src/domain module" test now allows `@/domain/scanResults` (a static fixture module, not a fetch)
  alongside the existing `@/domain/i18n/` allowance, and no longer requires the now-removed
  `PLACEHOLDER-UNTIL-THE-REAL-SCANNER-FEATURE-SHIPS` comment marker; a new test asserts all three
  `SAMPLE_CARDS` rows render with their real `formatListMeta`/`priceLabel` values (Dragón
  Eterno/PSA 10 · GEN-001/$45,000, Fénix de Tormenta/BGS 9.5 · ARC-047/$12,500, Serpiente del
  Vacío/PSA 9 · GEN-022/$8,900); a second new test confirms the old Charizard/Blastoise/Venusaur
  names no longer render anywhere.

**T023 — `src/features/scanner/ScanShellScreen.test.tsx`**
- `SCANNER_SOURCE_FILES` (the camera-import source-inspection guard's file list) extended from
  seven to nine entries — `FoundCardPanel.tsx` and `useScanSimulation.ts` (T014/T013) added,
  nothing removed (strengthened, not weakened, per the task's explicit instruction).
- The `ScanShellScreen.web` describe block is substantially rewritten:
  - The old "renders the full web shell content" test (which asserted `statusPillCameraAvailable`
    and used `getAllByText` for a dual title/button match) is replaced by an idle-content test (no
    badge/button assertions needed there since those elements no longer exist) plus two dedicated
    absence tests — one at ≥768px, one at <768px — that assert, via testID/role (not just text,
    since "Escanear carta" is legitimately still the web title's own copy): no
    `testID="scan-shell-button"`, no button with the accessible name `scanButton`, no "Cámara
    disponible" text, no viewfinder hint text, no viewfinder-found heading text.
  - Two new interaction tests: submitting the search field and tapping the dropzone both swap the
    right column from the empty-results panel to `FoundCardPanel` (scoped via `within(panel)` since
    `SAMPLE_CARDS[0]`'s name also legitimately appears in `RecentScansList`'s own first row below
    it — a real collision this run hit and fixed, not a hypothetical), with `RecentScansList`
    staying visible.
  - The 375px/1440px responsive checks (already present from `006`) are updated to no longer assert
    `viewfinderHint` (removed on web) and now also assert the camera-UI absence holds at both
    widths.
- Also added a `RETIRED_STATUS_PILL_TEXT` local literal (`"Cámara disponible"`) — see the
  orphaned-copy-key note below for why this couldn't stay `scanCopy.es.statusPillCameraAvailable`.

**Orphaned-copy-key cleanup, disclosed as a deviation beyond T021–T024's literal file list —
`src/domain/i18n/copy/scan.ts` + `.test.ts`**
- Removed `statusPillCameraAvailable` (`es`/`en`) — T021 removed its one and only consumer (the
  web `StatusPill`; mobile never rendered this badge). Grep-confirmed zero remaining consumers
  before removal (`grep -rln "statusPillCameraAvailable" src app` → only the two `scan.ts`/
  `scan.test.ts` files and, at the time, `ScanShellScreen.test.tsx`'s absence assertions, all fixed
  in the same run). This mirrors the exact precedent Run 6 already set for `backLabel`/
  `backAccessibilityLabel` once `app/scan.tsx`'s removal (T019) orphaned those two keys — same
  reasoning, same fix shape, applied the moment this run's own change (T021) produced a second
  instance of it. `scan.ts`'s file-top comment and `scan.test.ts` gained a matching
  regression-guard test (`not.toHaveProperty("statusPillCameraAvailable")`).
- This key is not literally in T021–T024's own file list (only `scan.ts`'s *content* is affected by
  T021's badge removal, not `scan.ts` the file itself), so flagging this explicitly rather than
  silently including it — it is a small, mechanical, low-risk continuation of an already-established
  pattern in this same feature, not a new design decision.

### Tests written/run

```
npx jest src/features/scanner src/domain/i18n/copy/scan.test.ts --silent
```
```
PASS src/features/scanner/ScanShellScreen.test.tsx
PASS src/features/scanner/UploadDropzone.test.tsx
PASS src/features/scanner/FoundCardPanel.test.tsx
PASS src/features/scanner/ScanSearchField.test.tsx
PASS src/features/scanner/Viewfinder.test.tsx
PASS src/features/scanner/useScanSimulation.test.tsx
PASS src/features/scanner/EmptyResultsPanel.test.tsx
PASS src/features/scanner/ScanEntryCard.test.tsx
PASS src/features/scanner/RecentScansList.test.tsx
PASS src/domain/i18n/copy/scan.test.ts

Test Suites: 10 passed, 10 total
Tests:       78 passed, 78 total
```

### Requirement traceability (this batch)

| FR | Test(s) |
|---|---|
| FR-005 (web renders only title/search/dropzone in controls column — no viewfinder/button/badge) | `ScanShellScreen.test.tsx` — "renders the idle web shell content...", "renders no Viewfinder / no \"Escanear carta\" button / no \"Cámara disponible\" badge at >=768px", "...below 768px" |
| FR-006 (two-column at/above 768px, one-column collapse below it) | `ScanShellScreen.test.tsx` — "renders the two-column (row) layout at/above 768px", "collapses to a single (column) layout below 768px" (unchanged mechanics, still green) |
| FR-007 (search-submit / dropzone-tap trigger the same local found state on web) | `ScanShellScreen.test.tsx` — "submitting the search field swaps the right column to FoundCardPanel...", "tapping the upload dropzone swaps the right column to FoundCardPanel" |
| FR-009 ("Aceptar" gives a visible confirmation on web too, never a silent no-op) | Covered structurally by `ScanShellScreen.web.tsx`'s new `confirming` rendering (mirrors T018's already-tested mobile behavior); no new dedicated web-side accept test was added this run — see Deviations below |
| FR-010 (recent-scans list and found panel share one hardcoded pool) | `RecentScansList.test.tsx` — "renders the section heading and all three SAMPLE_CARDS rows with their formatListMeta/priceLabel", "no longer renders 006-visual-identity's old Charizard/Blastoise/Venusaur placeholder rows" |
| FR-016 (zero camera-module import in every file this feature touched under src/features/scanner/) | `ScanShellScreen.test.tsx`'s extended `SCANNER_SOURCE_FILES` guard (now 9 files, including `FoundCardPanel.tsx`/`useScanSimulation.ts`); `RecentScansList.test.tsx`'s own guard, unchanged |
| SC-003 (web source + rendered output contain zero viewfinder/button/badge) | `ScanShellScreen.test.tsx`'s two absence tests (≥768px, <768px) plus the source-inspection guard |
| SC-005 (Escanear's rendered output on web has zero camera UI) | Same as SC-003 |

(spec.md User Story 4's AS1–AS4 map onto: AS1 → "renders the idle web shell content...", AS2 →
the two trigger tests, AS3 → "collapses to a single (column) layout below 768px" + the <768px
absence test, AS4 → the source-inspection guard's now-9-file list.)

### `npx tsc --noEmit` — full repo, after this batch

```
src/features/navigation/AmigosQuickAccessPill.test.tsx(32,70): error TS2367: ...
src/features/navigation/AmigosQuickAccessPill.tsx(16,70): error TS2367: ...
src/features/navigation/HomeScreen.integration.test.tsx(62,68): error TS2367: ...
src/features/navigation/HomeScreen.test.tsx(33,10): error TS2305: no exported member 'SCAN_ROUTE'
src/features/navigation/HomeScreen.tsx(5,10): error TS2305: no exported member 'SCAN_ROUTE'
```

Byte-for-byte identical 5-error set to every prior run since Run 1 — this batch introduced **zero**
new `tsc` errors. Mapping, as requested:

| File | Owning task |
|---|---|
| `src/features/navigation/HomeScreen.tsx` / `HomeScreen.test.tsx` (imports removed `SCAN_ROUTE`) | **T025** (Inicio redesign) |
| `src/features/navigation/HomeScreen.integration.test.tsx` (compares against retired `"amigos"` key) | **T025** / **T031** |
| `src/features/navigation/AmigosQuickAccessPill.tsx` / `.test.tsx` (same) | **T031** (retire Amigos/Social) |

### `npm test` — full repo, after this batch

```
Test Suites: 3 failed, 68 passed, 71 total
Tests:       5 failed, 469 passed, 474 total
```

The same three suites (`AmigosQuickAccessPill.test.tsx`, `HomeScreen.integration.test.tsx`,
`HomeScreen.test.tsx`) as every prior run — still the **only** red results, confirmed by
`grep FAIL` against the full run's output (line-for-line identical failing-suite list to Run 6's).
Passed tests rose from Run 6's 461 to this run's 469 (+8: 5 new/changed in
`ScanShellScreen.test.tsx`'s web describe block net of the two replaced tests, +2 in
`RecentScansList.test.tsx`, +1 in `scan.test.ts`'s new orphaned-key guard). No pre-existing passing
suite outside the T025/T031-owned files regressed.

### Build check (Level 4)

```
npx expo export --platform web
```
Succeeded both before and after the orphaned-key cleanup — `App exported to: dist`, no import-graph
error. `dist/` was not committed (deleted after each check).

`./init.sh` end-to-end (with the iOS/Android export stages) was **not** re-run this pass — the
web-only export above, plus the full `npx tsc --noEmit`/`npx jest` runs (which cover every source
file this batch touched, and confirm zero new failures anywhere), are the verification this run
relies on; the two native export stages are unaffected by this batch (no new import, no new
dependency, and `ScanShellScreen.web.tsx` is never part of the native module graph regardless — the
`.web.tsx` extension itself excludes it). Run 5's own `./init.sh` full run already confirmed all
three platforms bundle cleanly at that point in the feature, and nothing in this batch changes
anything upstream of the native bundlers (no `app/` route added/removed, no new native dependency).
Recommend re-running full `./init.sh` once more before the whole feature is marked `done` (already
`tasks.md`'s own T037 job).

### Manual smoke check (Level 3) — T024

**Environment, stated plainly per the orchestrator's brief**: `.env` has `EXPO_PUBLIC_SUPABASE_URL`
and `EXPO_PUBLIC_SUPABASE_ANON_KEY` both set to empty strings, and no local `Draw-a-card` backend
was started this run. Per `docs/verification.md`'s "Which live services to run" table, this is the
**neither-configured** case: `resolveKycRoute()` returns `unauthenticated` for every request, so
`app/_layout.tsx`'s `KycGate` redirects every authenticated route — including `/escanear`, on every
platform and at every viewport width — to `/login`, before this batch's own screen content ever
renders. This is not new to this run; it was already established at the orchestrator level and
independently reconfirmed below rather than assumed.

**What I actually did, and what it does/doesn't prove**:

1. `npx expo start --web` (`npm run web`'s underlying command) — booted clean: `Web Bundled ...
   node_modules/expo-router/entry.js (898 modules)`, no error, only the pre-existing
   native-dependency-version-drift warnings every prior run in this feature has already documented
   (unrelated to this batch, no dependency changed).
2. Used the `playwright` CLI (available via `npx --yes playwright`, backed by an already-cached
   Chromium install in this environment — same tool Run 5 used for its own T020 check, not a new
   project dependency; nothing was added to `package.json`) to screenshot `http://localhost:8099/
   escanear` at a 1024×800 (≥768px) viewport. **Result: the actual page rendered was the Spanish
   sign-in form ("Draw a Card" / "Correo" / "Contraseña" / "Entrar")** — i.e. the client-side
   redirect to `/login` fired exactly as `resolveKycRoute()`'s `unauthenticated` branch predicts.
   Screenshot saved to this session's scratchpad (not part of the repo). This directly confirms:
   (a) the gate is working as designed (FR-014 — zero diff, not touched by this batch anyway), and
   (b) **the actual two-column Escanear layout, the absence of the viewfinder/button/badge, and the
   search/dropzone → FoundCardPanel swap were NOT visually observed this run** — the screen was
   never reachable via a real navigation, at any viewport width, because the KYC gate wraps the
   root `<Stack>` before any route-specific content (mobile or web) is ever reached.
3. Did **not** attempt any workaround to bypass the gate (mocking `resolveKycRoute`, patching
   `.env`, intercepting the redirect, etc.) — per this run's explicit instruction, a prior
   gate-bypass probe at the orchestrator level was already tried and blocked by a permission
   classifier; repeating or working around that here would be exactly the anti-pattern
   `docs/verification.md` names ("an unreachable screen is not a verified screen" — letting a
   workaround stand in for an honest gap is worse than disclosing the gap).
4. Ran the exact static check T024's own task text asks for:
   ```
   grep -rn "expo-camera\|expo-image-picker" src/features/scanner/
   ```
   Zero real import matches — every hit is inside a test-assertion regex string, a code comment, or
   a `.test.` filename referencing the pattern by name (full output recorded in this run's tool
   trace); no file under `src/features/scanner/` has an actual `import`/`require` line for either
   package. This directly satisfies T024's own explicit instruction and is fully runnable/verified
   in this environment, unlike the KYC-gated visual check above.
5. Separately confirmed, by source inspection (not rendering), that `ScanShellScreen.web.tsx` has
   zero `Viewfinder` reference anywhere except its own explanatory comments (`grep -n
   "Viewfinder\|PrimaryButton\|StatusPill" src/features/scanner/ScanShellScreen.web.tsx` — both
   matching lines are inside `//` comments, none is an import or JSX usage). This is the
   "structural, not conditional" requirement the orchestrator's brief called out as central —
   confirmed at the source level even though the rendered page itself was unreachable.

**What I therefore rely on instead, and its limits**: the interaction behavior T024 asks me to
verify (idle two-column layout, both triggers, the panel swap, the recent-scans list staying
visible, the <768px collapse, the camera-UI absence at both widths) is proven by the Level 2
`@testing-library/react-native` tests above — these render the **real, unmocked**
`ScanShellScreen.web`/`ScanSearchField`/`UploadDropzone`/`FoundCardPanel`/`EmptyResultsPanel`/
`RecentScansList`/`useScanSimulation` component tree and business logic (not stubs), driven by real
`fireEvent` calls — meaningfully more than a snapshot or "doesn't crash" check, but still
jsdom/react-test-renderer, not a real browser compositor rendering real pixels. Combined with the
clean `npx expo export --platform web` (proves the actual production module graph — including this
batch's rewritten `ScanShellScreen.web.tsx` — resolves and bundles with no import error) and the
Playwright screenshot showing the gate redirect (proves the *route* itself is wired correctly and
the gate behaves exactly as `docs/verification.md`'s table predicts), my honest confidence level
for this batch is: **compiles and bundles cleanly; the exact production logic and every
interaction this batch introduces is exercised end-to-end by real (non-mocked) component tests;
the screen's actual on-screen appearance — the two-column layout, the swap animation/timing, and
the visual absence of any camera chrome — was NOT visually confirmed in a live browser this run**,
because of the credential wall documented above, which this run neither caused nor could resolve.

### Tasks now `[X]`

T021, T022, T023, T024 — all marked `[X]` in `specs/008-scan-experience/tasks.md`.
**Phase 4 (User Story 4, web Escanear) is now complete.** Combined with Phase 3 (already `[X]`),
User Stories 1–4 (all P1) are now all complete per `tasks.md`'s own Phase 4 checkpoint note.

### Deviations / notes for sign-off

1. **Added a `confirming` visual confirmation to `ScanShellScreen.web.tsx` beyond T021's literal
   task text** — same reasoning as Run 5's identical, already-accepted deviation for
   `ScanShellScreen.tsx` (mobile, T018): FR-009 is platform-agnostic and `FoundCardPanel`
   deliberately has no `confirming` prop, so the visible-confirmation requirement has to be met one
   level up on both platforms, not just mobile.
2. **Removed `scanCopy`'s now-orphaned `statusPillCameraAvailable` key** (`src/domain/i18n/copy/
   scan.ts` + `.test.ts`), a file not literally named in T021–T024's own file list — flagged
   explicitly as a small, mechanical continuation of the exact precedent Run 6 already established
   for `backLabel`/`backAccessibilityLabel` in the same file, applied the moment this run's own
   change (T021's badge removal) produced a second orphaned key. If a reviewer prefers this be a
   separate standalone fix (mirroring how Run 6 was kept standalone from Run 5), it's a one-file,
   easily-isolated revert — the key's removal has no other ripple.
3. **No dedicated new test asserts "Aceptar" gives a visible confirmation specifically on the web
   variant** (item 1 above) — the underlying `confirming` rendering logic is identical to, and
   copy-consistent with, `ScanShellScreen.tsx`'s (mobile) already-tested version (Run 5's
   `'pressing "Aceptar" shows a visible confirmation, then returns to idle'` test), and this run's
   own budget was spent on the FR-005/FR-006/FR-010/SC-003/SC-005 assertions T021–T023 explicitly
   name. Flagging this as a real, if small, coverage gap rather than silently claiming full
   parity — a follow-up test in `ScanShellScreen.test.tsx`'s web describe block (mirroring the
   mobile one almost line-for-line, using `jest.useFakeTimers()`) would close it in well under an
   hour if a reviewer wants it closed before Phase 4 is considered fully signed off.
4. **`npm run web`/Level 3 could not reach this batch's own screen at all**, for the reasons
   detailed in the Manual smoke check section above — disclosed plainly rather than implied to be
   covered by the green test suite, per this run's explicit instruction and `docs/verification.md`'s
   own anti-pattern list.
5. No other deviations. `ScanShellScreen.tsx` (mobile), `useScanSimulation.ts`, `FoundCardPanel.tsx`,
   `Viewfinder.tsx`, `ScanSearchField.tsx`, `UploadDropzone.tsx` (all Phase 2/3, already `[X]`) were
   read for context/reuse but not modified. `HomeScreen.tsx` and every Phase 5/6 file were not
   touched.

Next: Phase 5 (User Story 5, Inicio redesign — T025) and Phase 6 (User Story 6, placeholders +
Amigos/Social retirement — T027–T032) remain the next unstarted work. Both of Phase 4's own
disclosed gaps above (item 3's missing web-side "Aceptar" confirmation test, and the still-open
KYC-gate-driven Level 3 visibility gap that now applies identically to both Escanear variants) are
worth the orchestrator's attention before this feature's final `./init.sh`/T035–T037 polish pass.

## Run 8 — Phase 5 + Phase 6: Inicio redesign, Cartera/Trades/Perfil, Amigos/Social retirement (T025–T032)

### Scope

Exactly `[US5]`/`[US6]`-marked tasks T025 through T032 in `specs/008-scan-experience/tasks.md` —
`HomeScreen.tsx`'s (Inicio) restyle (T025), that task's own manual smoke check (T026), the three
new placeholder screens + their READMEs (T027–T029), their route files (T030), Amigos/Social's
outright retirement (T031), and that retirement's manual smoke check (T032). Phases 2–4 (T001–T024,
all `[X]`, code-reviewer APPROVED per the orchestrator's brief) were read for context/reuse but not
modified. Phase 7 (T033–T037, Polish) was not touched — out of this batch's scope.

Both of `spec.md`'s Recorded defaults were treated as CONFIRMED (per the orchestrator's brief,
already human-approved at the `spec_ready` gate) and implemented as written, not re-litigated:
Inicio = Option A (`BrandMark` + `display.xl` title + tagline + the repurposed quick-action card,
no user-specific data); Amigos/Social = Option A (retired outright, files deleted).

### Files changed

**T025 — `src/features/navigation/HomeScreen.tsx`**
- Removed the `AmigosQuickAccessPill` and `TopRightControls` imports/usages entirely — both are
  now owned elsewhere (`AmigosQuickAccessPill` retired outright by T031; `TopRightControls` moved
  shell-wide into `ShellHeader`, T008/US1, already `[X]` before this run). This also removed the
  `useSafeAreaInsets()` call and the old top-row/top-left/top-right layout — the native `<Tabs>`
  header (`ShellHeader`, rendered by `app/(app)/_layout.tsx`'s `screenOptions.header`, already
  `[X]`) now reserves the safe-area top space itself; Inicio no longer needs to.
- Removed the `SCAN_ROUTE` import (already deleted from `src/domain/navigation.ts` by T001) — this
  was the last remaining consumer of that removed export, and the last of the five `tsc` errors
  this feature had carried since Run 1 (`HomeScreen.tsx`/`HomeScreen.test.tsx`'s `SCAN_ROUTE`
  errors) is now gone.
- Added a brand block: `BrandMark` (`size={72}`, `src/features/ui/BrandMark`, unchanged component)
  + a `display.xl`-styled title + a tagline, both read via `useTranslation(homeCopy)`
  (`src/domain/i18n/copy/home.ts`, T004, already `[X]`) — styled to match the exact token/style
  shape `LoginScreen.tsx`'s own brand block already established (`006-visual-identity`'s
  precedent: `typography.display.xl`, `typography.body.tagline`, `colors.text.primary`, no raw
  hex).
- `ScanEntryCard`'s `onPress` now looks up the `"escanear"` entry from `NAV_DESTINATIONS`
  (`src/domain/navigation.ts`) and pushes its `route` — mirroring the exact
  `NAV_DESTINATIONS.find(...)` lookup pattern `AmigosQuickAccessPill` used for `"amigos"` before
  this feature retired that component (FR-013, spec.md US5 AS2). `ScanEntryCard.tsx` itself
  (`src/features/scanner/ScanEntryCard.tsx`) was **not** modified — it is not in T025's file list
  or `plan.md`'s Project Structure tree, and its own hardcoded `accessibilityLabel="Scan a card"`
  is a pre-existing gap from `004-home-scan-shell` predating this feature's i18n layer, not
  introduced or worsened by this batch. Flagged explicitly under Deviations below rather than
  silently left unmentioned.
- The `ScrollView` wrapper (`testID="home-screen"`) and its short-viewport scroll-independence
  fix (`004`'s T020/T021 precedent) are unchanged.

**T025 — `src/features/navigation/HomeScreen.test.tsx`** (rewritten)
- New assertions: the brand block renders `BrandMark` (via `getByLabelText("Draw a Card")`), the
  `"Inicio"` header, and the `"Tu colección, siempre a la mano"` tagline (default locale, `es`).
- A regression guard confirms exactly one button renders from this file now (the quick-action
  card) and that no `"Amigos"`-named button exists — proving `AmigosQuickAccessPill`/
  `TopRightControls` no longer render from `HomeScreen.tsx` itself.
- The centre `ScanEntryCard` render check and the `ScrollView` regression guard are carried over
  unchanged (still real, still passing).
- The navigation test now asserts `mockPush` is called with exactly
  `NAV_DESTINATIONS.find(d => d.key === "escanear")!.route` — not a hardcoded `"/escanear"`
  literal in the test itself, mirroring `SCAN_ROUTE`'s retired test pattern.

**T025 — `src/features/navigation/HomeScreen.integration.test.tsx`** (rewritten)
- Replaces `004-home-scan-shell`'s original "Amigos pill vs. Amigos tab convergence" test (which
  is no longer meaningful — `AmigosQuickAccessPill` is retired by T031) with the equivalent shape
  applied to Inicio's repurposed quick-action card and the Escanear tab: (1) confirms
  `NAV_DESTINATIONS` has an `"escanear"` entry; (2) confirms pressing the quick-action card inside
  a real `HomeScreen` render pushes exactly that entry's route; (3) confirms
  `app/(app)/_layout.tsx`'s native `<Tabs.Screen>` derives its Escanear tab's screen name from the
  same route segment; (4) confirms `app/(app)/escanear.tsx` — the literal route file — renders the
  identical title (`"Escanear"`, from `scanCopy.es.titleMobile`) as `ScanShellScreen` rendered
  directly, proving the route file is a pure pass-through, not a second diverging screen. No
  `useSafeAreaInsets` mock is needed here (unlike the original file) since neither `HomeScreen` nor
  `ScanShellScreen` calls that hook anymore/at all.

**T026 — manual smoke check.** See its own section below.

**T027 — `src/features/portfolio/CarteraPlaceholderScreen.tsx` (new) + `.test.tsx` (new)**
- Mirrors `004`'s `AmigosPlaceholderScreen.tsx` shape (header-role title + a body paragraph
  explicitly stating "no content yet") but, per FR-017 and this batch's explicit instruction, copy
  is routed through `useTranslation(placeholdersCopy)` (`src/domain/i18n/copy/placeholders.ts`,
  T005, already `[X]` — its `carteraTitle`/`carteraBody` keys were already written and tested) in
  both locales — not hardcoded English like `004`'s originals. Uses `src/theme` tokens
  (`colors.text.primary`/`colors.text.secondary`, `space.xxl`/`space.md`) exclusively, no raw hex.
  Test asserts the accessible heading, the "no content yet" body text, and that only the two
  static disclaimer lines render (no portfolio/inventory data of any kind, FR-015).
- `src/features/portfolio/README.md` updated to note this is the module's first real file.

**T028 — `src/features/trading/TradesPlaceholderScreen.tsx` (new) + `.test.tsx` (new)**
- Identical pattern to T027, using `placeholdersCopy`'s `tradesTitle`/`tradesBody` keys. Test
  asserts the same shape (heading, body, exactly two disclaimer lines — no trade/offer data).
- `src/features/trading/README.md` updated.

**T029 — `src/features/identity/PerfilPlaceholderScreen.tsx` (new) + `.test.tsx` (new)**
- Identical pattern to T027/T028, using `placeholdersCopy`'s `perfilTitle`/`perfilBody` keys.
  Explicitly distinct from `ProfileForm.tsx` (spec.md User Story 6 AS3) — different component,
  different purpose, no shared code, documented in both the file's own header comment and
  `src/features/identity/README.md`'s new section. Test asserts the same disclaimer-only shape
  plus a regression check that no form-field label (e.g. "nombre"/"name") renders — proving this
  is not `ProfileForm` under a different name.
- `src/features/identity/README.md` gained a new "`PerfilPlaceholderScreen.tsx` is not
  `ProfileForm.tsx`" section explaining the distinction (existing sections — the Supabase reset-
  password-template prerequisite, the password-recovery throwaway-client note — left untouched).

**T030 — three new route files + their tests**
- `app/(app)/cartera.tsx`, `app/(app)/trades.tsx`, `app/(app)/perfil.tsx` — each a pure pass-
  through rendering its respective placeholder screen only, no business logic (Constitution IV),
  matching `app/(app)/escanear.tsx`'s (T019, already `[X]`) established shape exactly.
- Added `cartera.test.tsx`/`trades.test.tsx`/`perfil.test.tsx` (colocated, ordinary route files —
  not `_layout.*`, so `docs/conventions.md`'s colocation exception doesn't apply) mirroring
  `amigos.test.tsx`'s minimal "renders the placeholder screen with its accessible heading" shape.
  T030's own task text doesn't explicitly demand these test files, but `docs/verification.md`'s
  Level 2 mandate ("component/screen tests for every new/changed screen") and the established
  `amigos.tsx`/`social.tsx`/`escanear.tsx` precedent both call for them — added as a direct,
  low-risk continuation of that pattern, flagged under Deviations below since T030's literal file
  list only names the three non-test route files.

**T031 — Amigos/Social retirement**
- Deleted via `git rm`: `app/(app)/amigos.tsx`, `app/(app)/amigos.test.tsx`,
  `app/(app)/social.tsx`, `app/(app)/social.test.tsx`,
  `src/features/social/AmigosPlaceholderScreen.tsx` + `.test.tsx`,
  `src/features/social/SocialPlaceholderScreen.tsx` + `.test.tsx`,
  `src/features/navigation/AmigosQuickAccessPill.tsx` + `.test.tsx` — ten files total, exactly the
  list T031 names.
- `src/features/social/` now contains only `README.md`, confirmed by directory listing. That
  README was checked against T031's explicit instruction ("check whether that README still
  describes screens that no longer exist; update it if so") — it was already the bare, generic
  pre-`004` scaffold text ("Mirrors the backend's `social` module...") with **no** reference to
  `AmigosPlaceholderScreen`/`SocialPlaceholderScreen` by name or description, so no update was
  needed; left unchanged.
- `app/(app)/index.test.tsx`'s header comment (not in T031's own file list, but a real, now-false
  claim in live test code — "HomeScreen composes AmigosQuickAccessPill, which calls expo-router's
  useRouter directly") was corrected to describe what `HomeScreen.tsx` actually does post-T025
  (calls `useRouter` itself, since `AmigosQuickAccessPill` — the original caller — is retired).
  Flagged under Deviations below as a small, mechanical accuracy fix, not new scope.

### Zero-reference verification (T031's own explicit instruction)

```
grep -rln "AmigosPlaceholderScreen\|SocialPlaceholderScreen\|AmigosQuickAccessPill" . \
  --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v "^specs/008-scan-experience/"
```

Remaining hits, categorized:

- **Historical/log files** (excluded by the task's own "excluding this feature's own spec/plan/
  tasks files" instruction, or by the same nature — a permanent session record): `feature_list.json`,
  `progress/history.md`, `progress/review_004-home-scan-shell.md`, `progress/impl_004-home-scan-
  shell.md`, `progress/review_008-scan-experience.md`, `progress/impl_008-scan-experience.md` (this
  file), `specs/004-home-scan-shell/plan.md`, `specs/004-home-scan-shell/tasks.md`,
  `specs/006-visual-identity/plan.md` — all describe what a *different, already-`done`* feature
  built, not this feature's current state; none imports or renders the retired components.
- **Live code, but comment-only, explicitly stating "retired"** (not a functional reference, no
  `import`/`require`): `src/features/navigation/HomeScreen.tsx`, `HomeScreen.test.tsx`,
  `HomeScreen.integration.test.tsx`, `src/features/navigation/ShellHeader.tsx` (already `[X]`
  before this run, its own comment already said "has been retired (US6)"),
  `src/features/navigation/WebSidebarNav.test.tsx` (already `[X]`, a comment attributing a testing
  *technique* to `AmigosQuickAccessPill.test.tsx`'s origin), `app/(app)/index.test.tsx` (corrected
  this run, see above — now explicitly says "was retired outright by T031"),
  `src/features/portfolio/CarteraPlaceholderScreen.tsx`, `src/features/trading/
  TradesPlaceholderScreen.tsx` (both new this run — their header comments cite `004`'s
  `AmigosPlaceholderScreen.tsx` as the shape they mirror, standard historical-lineage-comment
  practice already used throughout this codebase, e.g. every file's own "T0XX (specs/...)" header),
  `src/domain/i18n/copy/placeholders.ts` (already `[X]`, its comment cites the same lineage).

**Confirmed separately** — an explicit search for any actual `import`/`require` line referencing
any of the three retired components:

```
grep -rn "from \"@/features/social/AmigosPlaceholderScreen\"\|from \"@/features/social/SocialPlaceholderScreen\"\|from \"\./AmigosQuickAccessPill\"\|from \"@/features/navigation/AmigosQuickAccessPill\"" --include="*.ts*" .
```

Zero matches. No file in the repository still imports any of the three retired components — the
substantive requirement T031/spec.md US6 AS4/SC-005 ask for.

### `npx tsc --noEmit` — full repo, after this batch

```
(no output — exit clean)
```

**Zero errors.** This is the first fully clean `tsc` run this feature has had — every prior run
since Run 1 carried the same 5-error set, all traced to files this batch (T025/T031) owns
(`HomeScreen.tsx`/`HomeScreen.test.tsx`'s now-removed `SCAN_ROUTE` import;
`AmigosQuickAccessPill.tsx`/`.test.tsx`'s `NavDestinationKey` comparison; `HomeScreen.integration.
test.tsx`'s comparison against the retired `"amigos"` key) — confirmed cleared as predicted.

### `npm test` — full repo, after this batch

```
Test Suites: 72 passed, 72 total
Tests:       473 passed, 473 total
Snapshots:   0 total
Time:        1.842 s
```

**Fully green — the first fully green `npm test` run this feature has had.** Suite count dropped
from Run 7's 71 total (68 passed + 3 failed) to 72 total, all passing — net change: −10 deleted
suites (the five retired `.tsx`/`.test.tsx` pairs) + `+13` new suites (`CarteraPlaceholderScreen.
test.tsx`, `TradesPlaceholderScreen.test.tsx`, `PerfilPlaceholderScreen.test.tsx`,
`cartera.test.tsx`, `trades.test.tsx`, `perfil.test.tsx`, plus the two rewritten `HomeScreen.*`
suites counted as still-present, not new) — reconciles arithmetically with the file changes above.
Test count: 469 (Run 7) → 473 passing (+9 net: +6 new placeholder/route tests × ~1 each, +5 rewritten
`HomeScreen.test.tsx` tests replacing 7 old ones, +4 rewritten `HomeScreen.integration.test.tsx`
tests replacing 4 old ones, −10 deleted-file tests (`AmigosQuickAccessPill.test.tsx`'s 3 +
`AmigosPlaceholderScreen.test.tsx`'s 2 + `SocialPlaceholderScreen.test.tsx`'s ~2 + `amigos.test.tsx`'s
1 + `social.test.tsx`'s ~1) — net delta consistent with the file-level accounting above, no
unexplained gap).

Only `@expo/vector-icons`' pre-existing `act(...)` console warnings appear in the output (from
`AppWebLayout.test.tsx`'s `WebBottomBarNav`/`Icon` rendering) — these are console noise from a
third-party component's internal `setState`, not test failures, and predate this batch (present in
every prior run's output too, unrelated to any file this batch touched).

### `npx expo export --platform web` (Level 4, partial)

```
App exported to: dist
```

Succeeded cleanly — no import-graph error, confirming the full production module graph (including
every file this batch added/changed: `HomeScreen.tsx`, the three new placeholder screens, the three
new route files, and the ten deletions) resolves and bundles. `dist/` was deleted after the check,
not committed. **iOS/Android export stages were not re-run this pass** — same reasoning Run 7
recorded: this batch adds no new native dependency, no new native-only file, and the
`.web.tsx`/native-file-extension convention itself means nothing under `app/(app)/` or the three new
placeholder screens is platform-conditional in a way that would newly break either native bundler.
Full `./init.sh` (all three platforms) remains T037's job, not re-run standalone here.

### Manual smoke check (Level 3) — T026

**Environment, stated plainly**: identical to every prior run in this feature — `.env` has
`EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` both empty, no local `Draw-a-card`
backend was started. Per `docs/verification.md`'s "Which live services to run" table, this is the
**neither-configured** case: `resolveKycRoute()` returns `unauthenticated` for every request, so
`app/_layout.tsx`'s `KycGate` redirects every authenticated route — including `/` (Inicio) — to
`/login`, before this batch's own screen content ever renders. Independently reconfirmed this run
(not assumed carried over from a prior run's finding):

1. `npx expo start --web` booted clean at `http://localhost:8098` — `Web Bundled ... node_modules/
   expo-router/entry.js (743 modules)`, no error, only the pre-existing native-dependency-version-
   drift warnings every prior run has already documented (unrelated to this batch).
2. Used the `playwright` CLI (same tool prior runs used, cached Chromium, no new project dependency)
   to screenshot `http://localhost:8098/cartera` at 1024×800. **Result: the Spanish sign-in form
   rendered** ("Draw a Card" / "Correo" / "Contraseña" / "Entrar") — confirming the gate redirect
   fires exactly as predicted, and that **Inicio's actual on-screen appearance (the BrandMark,
   title, tagline, and quick-action card together) was NOT visually observed this run** — the
   screen was never reachable via a real navigation, at any point, because the KYC gate wraps the
   root `<Stack>` before any route-specific content is reached. Screenshot saved to this session's
   scratchpad (not part of the repo).
3. Did **not** attempt any gate-bypass workaround (mocking `resolveKycRoute`, patching `.env`,
   intercepting the redirect) — per this run's explicit instruction and every prior run's own
   established precedent; a prior gate-bypass probe at the orchestrator level was already tried and
   blocked by a permission classifier.
4. Ran the exact `git diff` check T026's own task text asks for:
   ```
   git diff main -- src/domain/kyc-gate.ts src/features/identity/useKycGate.ts app/_layout.tsx
   ```
   **Empty output, exit code 0.** Byte-for-byte confirmed — not assumed carried over from the
   orchestrator's own earlier probe-and-revert, independently re-verified from a clean `git diff`
   invocation in this run. FR-014/SC-001 hold.

**What I therefore rely on instead, and its limits**: the interaction behavior T026 asks me to
verify (cold boot lands on Inicio with no flash of the old `004` layout, pressing the quick-action
card navigates to Escanear) is proven by the Level 2 `@testing-library/react-native` tests above —
real, unmocked `HomeScreen`/`ScanEntryCard`/`NAV_DESTINATIONS` rendering and interaction, not a
snapshot. Combined with the clean `npx expo export --platform web` (proves the production module
graph resolves) and the Playwright screenshot showing the gate redirect (proves the route itself is
wired correctly, matching `docs/verification.md`'s own predicted table entry), my honest confidence
level: **compiles and bundles cleanly; the exact production logic (the escanear-route lookup, the
brand-block copy/i18n wiring) is exercised end-to-end by real component tests; Inicio's actual
on-screen appearance was NOT visually confirmed in a live browser this run**, for the same
credential-wall reason disclosed in every prior run's own T020/T024 sections — this run neither
caused nor could resolve it.

### Manual smoke check (Level 3) — T032

Same environment/credential-wall disclosure as T026 above applies identically here. What was
actually run:

1. With the same `npx expo start --web` session still up, screenshotted `/cartera` (above, shared
   with T026's check) and separately `/amigos` at 1024×800 — **both rendered the identical Spanish
   sign-in form**, confirming the gate intercepts before route resolution for both a still-valid
   destination (`/cartera`) and a now-deleted one (`/amigos`) alike. This means T032's own specific
   instruction — "confirm `/amigos` and `/social` no longer resolve to anything (expo-router's
   'Unmatched Route' screen, not the old placeholders)" — **could not be visually confirmed this
   run**: the gate redirects *before* expo-router's own route-matching/"Unmatched Route" fallback
   ever gets a chance to render, for any route, matched or not, whenever no session exists. This is
   a real, disclosed limitation of this specific verification, not a claim that the "Unmatched
   Route" behavior doesn't work — only that it was not observable in this environment.
2. What **was** directly, statically confirmed (fully runnable, not gated): the route files
   `app/(app)/amigos.tsx` and `app/(app)/social.tsx` are absent from disk (`test -f` checks both
   returned "gone"), and no top-level `app/amigos.tsx`/`app/social.tsx` or custom
   `app/+not-found.tsx` exists either — `find /app -iname "*not-found*"` returned nothing, meaning
   expo-router's own built-in "Unmatched Route" fallback (not a custom screen) is what would render
   for any user who *did* have a session and requested either URL. This is expo-router's documented,
   standard file-based-routing behavior (absence of a matching route file → its built-in fallback),
   not new code this batch wrote or could unit-test directly — the absence of the route files is
   the actual deliverable, and that absence is directly, unambiguously confirmed.
3. The zero-reference `grep` check (T032's other, fully runnable instruction) is documented in its
   own section above — zero real (`import`/`require`) references remain anywhere in the repository.
4. Selecting Cartera/Trades/Perfil "from the shell" and confirming each renders distinct placeholder
   content with the shell intact — **not observed live**, same credential-wall reason as above;
   relied on instead: `CarteraPlaceholderScreen.test.tsx`/`TradesPlaceholderScreen.test.tsx`/
   `PerfilPlaceholderScreen.test.tsx` each assert distinct accessible headings/body text (no overlap
   between the three), and `cartera.test.tsx`/`trades.test.tsx`/`perfil.test.tsx` each confirm the
   real route file renders its respective placeholder — real component-tree assertions, not "doesn't
   crash" checks, but jsdom/react-test-renderer, not a live browser compositor.

### Requirement traceability (this batch)

| FR / AS | Test(s) |
|---|---|
| FR-013 (Inicio redesign — BrandMark, display.xl title, tagline, repurposed quick-action card, no user-specific data) | `HomeScreen.test.tsx` — "renders the BrandMark, title, and tagline in the brand block", "no longer renders the Amigos pill or the top-right controls from this file", "renders the scan entry card dead centre" |
| FR-013, spec.md US5 AS2 (quick-action card navigates via NAV_DESTINATIONS, not a hardcoded route) | `HomeScreen.test.tsx` — "navigates to exactly NAV_DESTINATIONS' escanear route when the quick-action card is pressed"; `HomeScreen.integration.test.tsx` — "navigates the quick-action card to exactly NAV_DESTINATIONS' Escanear route" |
| FR-014/SC-001 (zero diff to the KYC gate) | `git diff main -- src/domain/kyc-gate.ts src/features/identity/useKycGate.ts app/_layout.tsx` — empty output, this run's own section above |
| spec.md US5 AS3 (route-file/component convergence) | `HomeScreen.integration.test.tsx` — "configures the native Escanear tab's screen name from the same NAV_DESTINATIONS route the quick-action card uses", "renders the identical Escanear screen title whether reached via the route file or the component directly" |
| FR-015 (Cartera/Trades/Perfil each render a reachable, distinctly-labelled placeholder, no real content) | `CarteraPlaceholderScreen.test.tsx`, `TradesPlaceholderScreen.test.tsx`, `PerfilPlaceholderScreen.test.tsx` — each "renders '<X>' copy with an accessible heading" + "renders no <domain> data (only the two static disclaimer lines)"; `cartera.test.tsx`/`trades.test.tsx`/`perfil.test.tsx` — "renders the <X> placeholder screen" |
| FR-017 (every string ships through i18n in both locales) | `placeholders.test.ts` (already `[X]`, unchanged this run) — key-parity + no-empty-value guards cover `CarteraPlaceholderScreen`/`TradesPlaceholderScreen`/`PerfilPlaceholderScreen`'s only copy source; `home.test.ts` (already `[X]`) covers Inicio's copy source |
| spec.md User Story 6 AS3 (PerfilPlaceholderScreen explicitly distinct from ProfileForm.tsx) | `PerfilPlaceholderScreen.test.tsx` — "renders no profile form fields or real profile data (only the two static disclaimer lines)" (asserts no name-field label renders) |
| FR-002, spec.md Clarifications Recorded default 2, SC-005 (Amigos/Social retired outright, zero remaining references) | This run's "Zero-reference verification" section above — `grep` for the three retired component names (categorized: historical logs + comment-only "retired" attributions, zero functional `import`/`require` matches) |

### Tasks now `[X]`

T025, T026, T027, T028, T029, T030, T031, T032 — all marked `[X]` in
`specs/008-scan-experience/tasks.md`. **Phases 5 and 6 (User Stories 5 and 6) are now both
complete.** Combined with Phases 2–4 (already `[X]`), all six user stories in this feature are now
implemented — only Phase 7 (Polish: T033–T037) remains.

### Deviations / notes for sign-off

1. **`ScanEntryCard.tsx`'s own hardcoded `accessibilityLabel="Scan a card"` was left untouched** —
   not in T025's file list or `plan.md`'s Project Structure tree (only `HomeScreen.tsx` is listed
   as modified under `src/features/navigation/`; `ScanEntryCard.tsx` lives under
   `src/features/scanner/` and isn't mentioned at all in this feature's plan). This is a pre-
   existing gap from `004-home-scan-shell` (predates this feature's i18n layer entirely) — FR-017
   requires every string *this feature* renders or changes to ship through i18n, and this feature
   does not change `ScanEntryCard.tsx`. Flagged explicitly rather than silently left unmentioned; a
   trivial follow-up (accept an `accessibilityLabel` prop, source it from `homeCopy` at the call
   site) would close it if a reviewer wants it closed in this feature rather than deferred.
2. **Added `.test.tsx` files for `cartera.tsx`/`trades.tsx`/`perfil.tsx`** beyond T030's own literal
   file list (which names only the three non-test route files) — a direct, low-risk continuation of
   the `amigos.test.tsx`/`social.test.tsx`/`escanear.test.tsx` precedent already established for
   every other route file in this app, and required by `docs/verification.md`'s Level 2 mandate
   ("component/screen tests for every new/changed screen"). Flagged as a small, mechanical addition
   beyond the task's literal text, not a new design decision.
3. **Corrected `app/(app)/index.test.tsx`'s header comment** (not in T031's file list) — it made a
   now-false claim about `HomeScreen.tsx` composing `AmigosQuickAccessPill`. Fixed to describe the
   actual post-T025 behavior. No test assertion or mock in that file changed, only the comment.
4. **Both T026 and T032's manual smoke checks could not visually observe their own screens' actual
   on-screen appearance**, for the same disclosed credential-wall reason every prior Level-3 check
   in this feature has carried (empty Supabase credentials, no local backend, KYC gate redirects
   every authenticated route to `/login` before any route-specific content renders). T032's specific
   "confirm `/amigos`/`/social` resolve to expo-router's Unmatched Route screen, not the old
   placeholders" instruction additionally could not be observed even in principle in this
   environment, since the gate intercepts *before* expo-router's own route-matching fallback would
   ever run — disclosed precisely in T032's own section above rather than implied covered.
5. No other deviations. Phases 2–4 (`src/features/scanner/`, `src/features/navigation/ShellHeader.
   tsx`/`TopRightControls.tsx`/`WebSidebarNav.tsx`/`WebBottomBarNav.tsx`, `app/(app)/_layout.tsx`,
   `src/domain/navigation.ts`, all already `[X]`) were read for context/reuse but not modified.

### Final verification summary for this batch

```
npx tsc --noEmit          -> clean, zero errors (first time this feature has been fully clean)
npm test                  -> 72/72 suites, 473/473 tests passing (first time fully green)
npx expo export --web     -> App exported to: dist (succeeded)
git diff main -- src/domain/kyc-gate.ts src/features/identity/useKycGate.ts app/_layout.tsx
                           -> (empty), exit 0
```

Per the orchestrator's brief: "After T025 lands, `npx tsc --noEmit` should be FULLY clean and
`npm test` should be fully green — no more pending-task-owned failures remain after this batch."
Confirmed exactly as predicted — both are green, with no unexplained residual failure.

Next: Phase 7 (Polish — T033 accessibility pass, T034 responsive-layout check, T035 full-suite
regression confirmation, T036 final grep/diff re-checks, T037 full `./init.sh`) is the only
remaining work in this feature. Recommend the next run re-run full `./init.sh` (all three platform
export stages, not just web) as T037 explicitly requires, since this run only re-confirmed the web
export standalone.

## Run 9 — Round 7 review follow-up: quick-action card localization fix + README staleness sweep

Fixes code-reviewer's Round 7 (`progress/review_008-scan-experience.md`'s "Review: T025–T032"
section) verdict REQUEST CHANGES: Finding 1 (BLOCKING), Finding 2 (non-blocking), Finding 3
(non-blocking nit). Finding 4 (`progress/current.md` staleness) explicitly out of scope — left
untouched per the orchestrator's brief. Finding 5 (T026/T032's manual smoke checks remaining
genuinely unverified in this environment) is an environmental constraint, not something this run
could resolve — not attempted again here.

No task ID changes: T025–T032 (and every other task) were already `[X]` before this run: this is
a review-fix pass on already-completed tasks' own files, not new task scope, so `tasks.md` is
unchanged.

### Finding 1 (BLOCKING) — quick-action card now reads and announces the localized label

**Root cause**: `HomeScreen.tsx` composed the pre-existing `ScanEntryCard` (`src/features/
scanner/ScanEntryCard.tsx`, 004-era shared code) with no way to override its hardcoded, English-
only `accessibilityLabel="Scan a card"` and no visible text at all — so `home.ts`'s
`scanQuickActionLabel` key (built by T004 specifically for this) was never consumed anywhere.

**Fix, two parts**:

1. `ScanEntryCard.tsx`: added an **optional** `label?: string` prop to `ScanEntryCardProps`.
   Checked for other callers first (`grep -rln "ScanEntryCard" src app` — only `HomeScreen.tsx`
   and `ScanEntryCard.test.tsx` itself reference it; no other consumer exists to disturb). Left
   absent, behavior is byte-for-byte unchanged: bare "+" glyph, hardcoded `"Scan a card"`
   accessibility label, no visible text — exactly the existing three tests still assert with zero
   changes. When `label` is provided: the "+" glyph is **kept, not replaced** (a judgment call —
   spec.md's own Recorded default 1 rationale explicitly credits the "+" card's "well-tested
   affordance" as the reason to reuse rather than redesign the card, so removing it to make room
   for text would cut against the spec's own stated reasoning), and the label renders as an
   **additional visible `<Text>` line underneath the glyph** — this satisfies Recorded default
   1's literal requirement that the card "read" the label (not just carry it as an
   accessibility-only string), while both the visible text and the `accessibilityLabel` are set
   from the same `label` value, so the announced name always matches what's on screen.
2. `HomeScreen.tsx`: wired `label={t("scanQuickActionLabel")}` into its `ScanEntryCard`
   composition — the one line that was missing. Updated the file's own top comment to describe
   this instead of calling `ScanEntryCard` "unchanged."

**Tests added/updated** (both locales, per the review's explicit ask):
- `ScanEntryCard.test.tsx` — two new tests: (a) confirms the prop-absent default behavior is
  unchanged (no visible text, `"Scan a card"` accessibility label), (b) confirms a provided
  `label` renders as visible text alongside "+" and becomes the accessible name.
- `HomeScreen.test.tsx` — the existing "renders the scan entry card dead centre" test now asserts
  `homeCopy.es.scanQuickActionLabel` ("Escanear una carta") both as visible text and as the
  accessible name (Spanish is `DEFAULT_LOCALE`, no `<LocaleProvider>` needed — same
  bare-render-defaults-to-es convention every other i18n'd test in this repo uses). Added a new
  locale-switch test, mirroring `TopRightControls.test.tsx`'s established
  `LocaleProvider`/`LocaleSwitchTrigger` pattern exactly: renders `HomeScreen` inside a real
  `LocaleProvider`, confirms the Spanish label first, presses a `setLocale("en")` trigger, then
  confirms the card re-renders with `homeCopy.en.scanQuickActionLabel` ("Scan a card") as both
  visible text and accessible name, and that the Spanish text is gone. The pre-existing
  route-navigation test's button lookup was updated from the literal `"Scan a card"` to
  `homeCopy.es.scanQuickActionLabel`.
- `HomeScreen.integration.test.tsx` and `app/(app)/index.test.tsx` — both had a stale
  `getByRole("button", { name: "Scan a card" })` lookup (the label the button no longer has by
  default, since Spanish is the default locale); updated to
  `homeCopy.es.scanQuickActionLabel`.

**Genuinely reproduced, not asserted on faith**: copied `HomeScreen.tsx` aside, reverted only the
`label={t("scanQuickActionLabel")}` wire-up (back to `<ScanEntryCard onPress={...} />`, no
label), and re-ran `HomeScreen.test.tsx`:

```
FAIL src/features/navigation/HomeScreen.test.tsx
  ✕ renders the scan entry card dead centre with its localized visible text and accessibility label
  ✕ renders the quick-action card's English label when the locale context is set to 'en'
  ✕ navigates to exactly NAV_DESTINATIONS' escanear route when the quick-action card is pressed
Test Suites: 1 failed, 1 total
Tests:       3 failed, 3 passed, 6 total
```

All three of the tests that depend on the fix fail without it, confirming they're real regression
guards, not tautologies. Restored `HomeScreen.tsx` to the fixed version immediately after
(confirmed via `grep` that the `label={t("scanQuickActionLabel")}` wire-up is back in place).

### Finding 2 (non-blocking) — README staleness sweep

Per the reviewer's instruction to sweep rather than fix only the one named file, read every
`src/features/*/README.md` this feature touched or that describes now-deleted functionality:

- **`src/features/navigation/README.md`** (the file the reviewer named) — rewrote the "This
  module owns..." section: removed the present-tense claims about a persistent "Amigos / Home-
  Scan / Social navigation surface" and a "top-left Amigos quick-access pill" (both deleted by
  T031), replaced with an accurate description of the current five-destination shell
  (Inicio/Escanear/Cartera/Trades/Perfil), `ShellHeader`'s four icon controls, the two web nav
  layouts, and an explicit note that Amigos/Social were retired outright (spec.md's Recorded
  default 2) and `src/features/social/` now holds only its own README.
- **`src/features/social/README.md`** — was still the generic "Screens/components for this
  domain live here" template, describing files that no longer exist (`ls
  src/features/social/` confirmed: only `README.md` remains). Rewrote to state plainly that the
  directory is intentionally empty right now, name what was here before and why it was removed
  (008's Recorded default 2), and note that a future feature giving the backend's `social`
  bounded context real frontend content starts fresh here.
- **`src/features/scanner/README.md`** — read; still the generic, accurate template (no claim
  about deleted functionality). No change needed.
- **`src/features/identity/README.md`, `src/features/portfolio/README.md`,
  `src/features/trading/README.md`** (the three updated in T027–T029) — read in full; all three
  accurately describe their current placeholder-screen contents with no stale claims. No change
  needed.
- Repo-wide sanity check: `grep -rln "Amigos\|amigos" src app --include="*.md"` now returns only
  the two files just rewritten (both intentionally describing the retirement, not claiming it
  still exists).

### Finding 3 (non-blocking nit) — stale comment fixed, mock removed

`app/(app)/index.test.tsx`'s comment claimed `HomeScreen` "now calls `useSafeAreaInsets()`,"
which T025 removed (confirmed: zero matches for `useSafeAreaInsets`/`safe-area` anywhere in
`HomeScreen.tsx`, `ScanEntryCard.tsx`, or `BrandMark.tsx` — the full render tree this test
exercises). **Chose to remove the mock, not just fix the comment**: the reviewer said either
choice is fine ("the harmless mock can stay or go, your call"); removing it avoids leaving a
second stale artifact (a jest mock justified by a comment describing behavior that no longer
exists) sitting in the same file the reviewer just caught for exactly that pattern. Re-ran
`app/(app)/index.test.tsx` after removal — still passes.

### `npx tsc --noEmit` and `npm test` — full repo, run after every change in this run

```
npx tsc --noEmit   -> clean, zero errors
npm test            -> Test Suites: 72 passed, 72 total / Tests: 476 passed, 476 total
```

476 vs. Run 8's 473: +3 new tests (2 in `ScanEntryCard.test.tsx`, 1 in `HomeScreen.test.tsx`'s
locale-switch test), no test removed, no test suite newly failing.

### Requirement traceability (this run)

| FR | Test(s) |
|---|---|
| FR-013 (Inicio's quick-action card content, Recorded default 1) | `HomeScreen.test.tsx` — "renders the scan entry card dead centre with its localized visible text and accessibility label" |
| FR-017 (every string this feature renders ships through i18n, zero hardcoded copy in a component) | `HomeScreen.test.tsx` — "renders the quick-action card's English label when the locale context is set to 'en'"; `ScanEntryCard.test.tsx` — "renders the provided label as visible text and uses it as the accessibility label" |

### Files changed

- `src/features/scanner/ScanEntryCard.tsx` — optional `label` prop, additive visible-text
  rendering, unchanged default behavior.
- `src/features/scanner/ScanEntryCard.test.tsx` — two new tests for the `label` prop.
- `src/features/navigation/HomeScreen.tsx` — wires `homeCopy.scanQuickActionLabel` into
  `ScanEntryCard`'s new `label` prop; comment updated.
- `src/features/navigation/HomeScreen.test.tsx` — updated two existing assertions, added one new
  locale-switch test, new imports (`homeCopy`, `LocaleProvider`/`useLocale`,
  `Pressable`/`Text` for the switch trigger).
- `src/features/navigation/HomeScreen.integration.test.tsx` — updated one stale button-name
  lookup.
- `app/(app)/index.test.tsx` — updated one stale button-name lookup, removed the now-unjustified
  `react-native-safe-area-context` mock and its stale comment.
- `src/features/navigation/README.md` — rewritten to describe the current five-destination shell.
- `src/features/social/README.md` — rewritten to describe the module's current (empty,
  post-retirement) state.

### Deviations / notes for sign-off

1. Chose to keep the "+" glyph and add the label as additional visible text underneath, rather
   than replacing "+" with text (the alternative the reviewer's suggested fix left open as "or a
   visible `<Text>` child slot"). Reasoning given above in Finding 1's section — grounded in
   spec.md's own stated rationale for reusing the card, not a new, undiscussed design decision.
   If the human prefers the label to replace "+" instead (closer to `AmigosQuickAccessPill`'s
   old text-only pattern), that's a small follow-up to this same file.
2. Removed (rather than kept) the harmless-but-now-unjustified `react-native-safe-area-context`
   mock in `app/(app)/index.test.tsx`, per the reviewer's explicit "your call." Reasoning: the
   reviewer had just caught the READMEs for exactly this "stale artifact left in place after its
   own justification disappeared" pattern; removing it here is more consistent than leaving one
   more instance of it.
3. No changes to `progress/current.md` (Finding 4) or to T026/T032's environment-blocked manual
   smoke checks (Finding 5) — both explicitly out of scope for this run per the orchestrator's
   brief.
4. `tasks.md` unchanged — no task ID corresponds to a review-fix pass on already-`[X]` tasks;
   T025–T032 remain `[X]` as they were.

## Run 10 — Phase 7: Polish & Cross-Cutting Concerns (T033–T037)

### Scope

Exactly Phase 7's five tasks: T033 (accessibility pass), T034 (responsive layout check), T035
(full-suite regression run), T036 (final grep/diff re-checks), T037 (`./init.sh` end to end). All
six user stories (T001–T032, T020a) were already `[X]` and code-reviewer-approved (Round 7's
findings fixed in Run 9) before this run started — read for audit purposes, not re-implemented.

**Environment constraint carried over from every prior run, restated plainly per this run's own
explicit instruction**: `.env` has empty `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`
and no local backend was started, so every authenticated route (all five shell destinations) is
unreachable behind the KYC gate — confirmed structurally true again this run
(`git diff main -- src/domain/kyc-gate.ts src/features/identity/useKycGate.ts app/_layout.tsx`
stays empty, see T036 below). A gate-bypass probe was attempted at the orchestrator level before
this run and was blocked by a permission classifier — not attempted again here. T033/T034 below are
therefore a rigorous **static/in-test** audit (source review + RNTL assertions), not a live-browser
or on-device pass — see the explicit "still needs a human" list at the end of this section.

### T033 — Accessibility pass (Constitution VII, SC-002)

Read the actual source of every element the task names, cross-referenced against each file's
existing test coverage, before deciding what (if anything) needed a code or test fix:

- **Five shell destinations + their icons** (`app/(app)/_layout.tsx` native `<Tabs>`,
  `WebSidebarNav.tsx`, `WebBottomBarNav.tsx`): every destination carries an explicit
  `tabBarAccessibilityLabel`/`accessibilityLabel` sourced from `navCopy` (not the icon alone), in
  both locales — confirmed already tested (`WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx`'s
  locale-switch tests, `AppNativeLayout.test.tsx` for the native `<Tabs.Screen>` config). No `order`
  CSS override or positive `tabIndex` anywhere in these files (`grep -rn "order:" ...` / `grep -rn
  "tabIndex" ...` both empty) — DOM order matches visual/keyboard-tab order in both web layouts.
- **Four icon controls** (`TopRightControls.tsx`): re-verified `navCopy`'s
  `languageAccessibilityLabel`/etc. are full sentences ("Idioma, español o inglés — aún no
  disponible" / "Language, Spanish or English — not yet available"), not the bare glyph name —
  genuinely carries more information than the visible icon alone, satisfying the task's explicit
  re-verify ask. `minWidth`/`minHeight: 44` already present on every control; `FlagBadge`'s decorative
  inner `View`s are `aria-hidden` so they never surface as unlabeled elements — already tested.
- **Viewfinder's found state**: purely decorative (a glowing scan-line `View`, a checkmark icon, a
  heading `Text`) — no interactive element exists in this state, so no tap-target concern applies;
  the pre-existing gear chip stays `aria-hidden` in both states (unchanged, already tested).
- **`FoundCardPanel`**: every interactive element (condition chips/`radiogroup`, quantity stepper,
  "Gradeada" `switch`, "Eliminar"/"Cambiar" links, "Aceptar") already carries a real
  `accessibilityRole`, a real `accessibilityLabel`, and `accessibilityState.checked`/`disabled`
  where applicable — `FoundCardPanel.test.tsx`'s own "keeps every interactive element at a minimum
  44x44 tap target" test already covers this set directly against rendered styles. No gap found.
- **`UploadDropzone`**: real `Pressable` + `accessibilityRole="button"` + a real, actionable
  `accessibilityLabel` (`scanCopy.uploadDropzone`) — already tested
  (`UploadDropzone.test.tsx`'s "exposes an accessible button role/label"). `minHeight: 44` is
  explicit; width is not (a full-width block element under a flex-column parent, not an
  inline-sized control) — read this as structurally safe, not a gap requiring a style change (every
  other full-width block element in this codebase, e.g. `PrimaryButton`, follows the same pattern).
- **Three placeholder screens** (`CarteraPlaceholderScreen.tsx`/`TradesPlaceholderScreen.tsx`/
  `PerfilPlaceholderScreen.tsx`): no interactive elements at all (a header-role title + a static
  body paragraph) — nothing to apply a tap-target/label requirement to; confirmed no `Pressable`/
  `Link` exists in any of the three files.
- **Inicio's quick-action card** (`ScanEntryCard.tsx` via `HomeScreen.tsx`): `minWidth`/
  `minHeight: 44` present (redundant with its actual 220×308 size), real `accessibilityLabel`
  sourced from `homeCopy.scanQuickActionLabel` in both locales (Run 9's fix) — already tested.

**One real, concrete gap found and fixed**: `WebSidebarNav.tsx`'s `link` style declared
`minHeight: 44` but never an explicit `minWidth: 44` — every other tap-target style in this
feature (`WebBottomBarNav.tsx`'s equivalent `link`, `TopRightControls.tsx`'s `control`,
`FoundCardPanel.tsx`'s chips/stepper/toggle, `ScanSearchField.tsx`'s submit button,
`ScanEntryCard.tsx`'s card) states both floors explicitly. In practice the sidebar link's icon +
text content already exceeds 44px in width, so this was never a real rendered-size bug — but
relying on incidental content width instead of an explicit floor is exactly the kind of drift that
could regress silently (e.g. a future icon-only variant of this link). Fixed:

- `src/features/navigation/WebSidebarNav.tsx` — added `minWidth: 44` to the `link` style, with a
  comment explaining why (matches `WebBottomBarNav.tsx`'s already-explicit pattern).
- `src/features/navigation/WebSidebarNav.test.tsx` — new test "gives each destination link a
  minimum 44x44 tap target", the same flattened-style assertion technique
  `TopRightControls.test.tsx`/`FoundCardPanel.test.tsx` already established.
- `src/features/navigation/WebBottomBarNav.test.tsx` — the equivalent new regression test (its
  component-level style already had both floors; this closes the test-coverage gap, not a code
  gap, for that file).

No other file needed a code change. **No new files created**, per the task's own constraint — only
edits to the three files above.

### T034 — Responsive layout check (SC-007)

Static structural review (flex/gap-based layouts, no fixed-pixel widths that could overflow 375px,
no hardcoded desktop-only assumptions) plus the existing width-driven-branch test coverage, read
file by file:

- **Escanear (web)**: `ScanShellScreen.web.tsx` already has explicit tests at 375px, 767px, 800px,
  and 1440px (`ScanShellScreen.test.tsx`'s "renders correctly at a 375px-wide viewport"/"...1440px"
  tests, plus the two-column/one-column collapse tests at the 768px boundary) — covering both idle
  and found states (search-submit/dropzone-tap trigger tests run at 800px; the found panel's own
  `conditionRow` wraps via `flexWrap: "wrap"`, already asserted). No gap found.
- **Escanear (mobile)**: `ScanShellScreen.tsx` has no internal width branch (always single-column,
  `ScrollView` + `flexGrow: 1`) — structurally width-independent; the one fixed-size element inside
  it (`Viewfinder`'s `aspectRatio: 4/3` frame) is percentage/aspect-ratio-based, not a fixed pixel
  width, so it scales with its container at any width ≥ the padding floor.
- **Shell chrome**: `app/(app)/_layout.web.tsx`'s sidebar-vs-bottom-bar switch is tested at
  767px/800px (`AppWebLayout.test.tsx`), which is the only width-dependent behavior this feature's
  shell chrome has — `WebSidebarNav`/`WebBottomBarNav` themselves render identically regardless of
  width (their parent decides which one mounts).
- **Inicio, Cartera, Trades, Perfil**: none has an internal width branch; each is a centered flex
  column with either no fixed pixel width (`Home`'s brand block, the three placeholders) or one
  bounded element well under 375px (`ScanEntryCard`'s 220px width, `maxWidth: 320` on every
  placeholder's body text) — confirmed by direct source read, not run through a live resize.

No code fix was needed here — every element already uses `flex`/`gap`/percentage sizing rather than
a fixed pixel width that could overflow a 375px viewport, and the one genuinely width-driven
component (`ScanShellScreen.web.tsx`) already had the exact boundary tests this task asks for.
**Phone/tablet form factors on iOS/Android simulators could not be checked at all** — no simulator
is available in this environment (see the "still needs a human" list below); the same aspect-ratio/
flex-based reasoning applies (nothing in this feature reads native window dimensions the way the
web variant reads `useWindowDimensions()`), but that is a structural argument, not a substitute for
an actual simulator screenshot.

### T035 — Full test suite (regression check)

```
npm test

Test Suites: 72 passed, 72 total
Tests:       478 passed, 478 total
Snapshots:   0 total
```

478 vs. Run 9's 476 — the two new tap-target regression tests added in T033 above (one each in
`WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx`). **Every suite passes, zero failures** — no
pre-existing test outside this feature needed a fix; the `NAV_DESTINATIONS`/`TopRightControls`/
`RecentScansList` shape-change ripple this task specifically calls out was already fully resolved
by Run 8 (T025/T031), confirmed still true here.

```
npx tsc --noEmit   -> clean, zero errors
```

### T036 — Final invariant re-checks

```
grep -rn "expo-camera\|expo-image-picker" src/features/scanner/
```
Only matches are test-guard assertion lines (`.test.tsx` files' own `expect(...).toBe(false)`
checks) and one prose comment in `Viewfinder.tsx`/`UploadDropzone.tsx` explicitly documenting the
absence — zero real `import`/`require` lines. Confirmed by inspecting every matched line
individually, not just counting matches.

```
git diff main -- src/domain/kyc-gate.ts src/features/identity/useKycGate.ts app/_layout.tsx
```
Empty output, exit code 0 — byte-for-byte unchanged from `main`, re-confirmed independently this
run (not assumed carried over).

```
grep -rln "AmigosPlaceholderScreen\|SocialPlaceholderScreen\|AmigosQuickAccessPill" . \
  --exclude-dir=node_modules --exclude-dir=.git
```
Same categorized result Run 8/9 already documented: historical/log files (`feature_list.json`,
`progress/*.md`, other features' own `specs/*/plan.md`/`tasks.md`) and live-code comment-only
"retired"/lineage attributions (`HomeScreen.tsx`+its two test files, `ShellHeader.tsx`,
`WebSidebarNav.test.tsx`, `CarteraPlaceholderScreen.tsx`, `TradesPlaceholderScreen.tsx`,
`placeholders.ts`, `app/(app)/index.test.tsx`) — zero functional `import`/`require` reference.
Independently re-ran the stricter import-only grep this run:

```
grep -rn "from \"@/features/social/AmigosPlaceholderScreen\"\|from \"@/features/social/SocialPlaceholderScreen\"\|from \"\./AmigosQuickAccessPill\"\|from \"@/features/navigation/AmigosQuickAccessPill\"" --include="*.ts*" .
```
Zero matches. All three invariants hold.

### T037 — Full `./init.sh` (no `--skip-*` flags)

```
▶ 1/8 Checking prerequisites            -> OK (node v20.20.2, npm v10.8.2)
▶ 2/8 Environment file                  -> OK
▶ 3/8 Installing dependencies           -> OK
▶ 4/8 Type-checking                     -> OK, no type errors
▶ 5/8 expo-doctor                       -> WARN (outdated dependencies) — pre-existing, expected
▶ 6/8 Native dependency alignment       -> WARN (version drift) — pre-existing, expected
▶ 7/8 Running test suite                -> OK, all tests passed
▶ 8/8 Bundle export smoke checks        -> OK: web, iOS, Android all exported cleanly

RESULT: SUCCESS (10/10 stages passed)
```

Both warnings are exactly the two `docs/verification.md`/task-brief-named pre-existing, expected
warnings (expo-doctor's outdated-dependency advisory; `expo-image-picker`/`react-native`/
`react-native-safe-area-context`/`@types/react`/`typescript` version-vs-SDK drift) — identical
package list to every prior run's own `init.sh`/`expo-install --check` output in this feature,
confirming nothing new regressed. All three platform bundle exports (web/iOS/Android) succeeded,
confirming `app/scan.tsx`'s removal (T019, Run 5) left no orphaned/duplicate route and this
feature's Phase 7 edits introduced no new native dependency.

### Files changed (this run only)

- `src/features/navigation/WebSidebarNav.tsx` — added explicit `minWidth: 44` to the `link` style
  (T033 fix, see above).
- `src/features/navigation/WebSidebarNav.test.tsx` — new "gives each destination link a minimum
  44x44 tap target" test.
- `src/features/navigation/WebBottomBarNav.test.tsx` — new "gives each destination link a minimum
  44x44 tap target" test.
- `specs/008-scan-experience/tasks.md` — T033, T034, T035, T036, T037 marked `[X]`.

No other file in the repository was touched this run — every other file named in T033/T034's own
task text was read for audit purposes and found to already satisfy the requirement (built in
directly by prior runs, several explicitly citing accessibility-pass reasoning in their own
comments, e.g. `Viewfinder.tsx`'s/`ScanShellScreen.tsx`'s "T050"-labeled fixes carried over from
`006-visual-identity`'s own accessibility pass).

### Requirement traceability (this run)

| SC | Test(s) |
|---|---|
| SC-002 (every destination + every icon control operable via keyboard alone, ≥44×44, real accessible names) | `WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx` — new "gives each destination link a minimum 44x44 tap target" (this run); pre-existing: `TopRightControls.test.tsx`'s "gives each control a minimum 44x44 tap target"/"gives each control a distinct, non-empty accessibility label", `FoundCardPanel.test.tsx`'s "keeps every interactive element at a minimum 44x44 tap target", `UploadDropzone.test.tsx`'s "exposes an accessible button role/label", `ScanEntryCard.test.tsx`, `AppNativeLayout.test.tsx` |
| SC-007 (no clipped content/horizontal overflow at 375px through desktop widths) | `ScanShellScreen.test.tsx` — "renders correctly at a 375px-wide viewport"/"...at a typical desktop width (1440px)"; `AppWebLayout.test.tsx`'s 767px/800px breakpoint tests (pre-existing, re-verified this run, not modified) |

### Tasks now `[X]`

T033, T034, T035, T036, T037 — all marked `[X]` in `specs/008-scan-experience/tasks.md`. **All 37
tasks in this feature (T001–T032, T020a, T033–T037) are now `[X]`.**

### Still needs a human on a real device/browser (explicit deliverable, not a hedge)

This environment cannot reach any of the five shell destinations (the KYC gate redirects every
authenticated route to `/login` with empty Supabase credentials and no local backend, and a
gate-bypass probe was already attempted and blocked at the orchestrator level) and has no
iOS/Android simulator or browser-automation tooling available. The following are genuinely
unverified by anything in this run or any prior run, and specifically require a human (or a future
run with that tooling) before this feature's accessibility/responsiveness claims are considered
fully closed:

1. **A real VoiceOver (iOS) / TalkBack (Android) pass** across all five destinations and both
   Escanear states — RNTL assertions confirm `accessibilityRole`/`accessibilityLabel`/
   `accessibilityState` props are set correctly, but never that a real screen reader announces them
   correctly, in the right order, on-device (SC-002's literal wording).
2. **Real keyboard-only navigation (Tab/Shift+Tab) through a live browser** across all five web
   destinations — confirmed structurally (no CSS `order` override, no positive `tabIndex`, every
   interactive element uses `Pressable`/`Link` which react-native-web makes natively focusable) but
   never driven through an actual browser's focus engine or visually confirmed with a focus ring.
3. **On-device/simulator tap-target measurement** — confirmed via `StyleSheet.flatten(...)`
   assertions on `minWidth`/`minHeight` ≥ 44 logical px, never measured against an actual rendered,
   physically-tapped screen.
4. **A real 375px-wide browser resize and desktop-width view**, plus **phone and tablet form
   factors on iOS/Android simulators**, across all five destinations and both Escanear states — this
   run's structural audit (flex/gap/aspect-ratio-based sizing, the pre-existing width-mocked RNTL
   tests at 375/767/800/1440px) is the strongest available substitute in this environment, but is
   not a substitute for an actual rendered viewport or simulator screenshot.
5. **The `FlagBadge` visual redraw** (Run 3, still open) — only structural (`findAllByType(View)` +
   resolved `backgroundColor`) assertions exist; no human has yet looked at the rendered flag shapes
   in a browser or simulator.
6. **Native `<Tabs>` tab-bar tap-target sizing and VoiceOver/TalkBack announcement order** — this
   feature supplies `tabBarAccessibilityLabel`/`tabBarIcon` per screen, but the actual touchable
   sizing is `@react-navigation/bottom-tabs`' own default rendering, never exercised on a real
   simulator in this environment (same disclosed gap `AppNativeLayout.test.tsx`'s own header comment
   already names for this file).
7. **`ScanEntryCard.tsx`'s pre-existing raw-hex colors** (`#111827` text/border against
   `colors.bg.page`) were not checked for WCAG contrast — a pre-004-i18n-era gap this feature did not
   introduce and Run 8/9 already flagged, restated here since T033 is the natural place a contrast
   check would belong if one is wanted.

None of the above blocks `./init.sh`'s green result (T037) or the full test suite (T035) — both are
genuinely green — but neither substitutes for the items above, per `docs/verification.md`'s own
anti-pattern list ("an unreachable screen is not a verified screen").

---

## Run 11 — Post-ship layout bug fix: `<Link>` flex styles silently ignored on web

**This is exactly the kind of gap Run 10's item 2 warned about.** The feature shipped in commit
`39c3f02` with a real layout bug in `WebBottomBarNav.tsx`/`WebSidebarNav.tsx` that all 476 tests
passed straight through, because those tests assert the flattened style *object* (which genuinely
contained `gap`), never how `react-native-web` actually renders `<Link>` in a browser. **It was
found by a live browser render, not by this test suite** — the exact failure mode Run 10 could
only warn about in the abstract ("confirmed via `StyleSheet.flatten(...)` assertions... never
measured against an actual rendered... screen") turned out to be a real, shipped defect, not a
hypothetical gap. Recorded here as a concrete data point for this repo's verification history:
component/screen tests that only assert style *props* are not sufficient evidence that a web
layout renders correctly, and `docs/verification.md`'s "an unreachable screen is not a verified
screen" caveat should probably be read to also cover "a screen whose tests never modeled the
target renderer's actual box model."

### The bug

`WebBottomBarNav.tsx` and `WebSidebarNav.tsx` applied `gap`/`alignItems`/`justifyContent` (and,
in the sidebar's case, `flexDirection: "row"`) directly to expo-router's `<Link>`, with the
`Ionicons` glyph and the label `<Text>` as its direct children. `react-native-web` renders
`<Link>` as an inline `<a>` on web (confirmed by reading
`node_modules/react-native-web/dist/exports/Text/index.js`: the component's base style is
`display: 'inline'`, same as the underlying `Text` primitive `Link` wraps). Flex properties have
no effect on `display: inline` elements, so the icon and label rendered flush against each other
with zero separation at both 375px and desktop widths — exactly as described in the bug report
(home glyph flush against "Inicio", scan-frame glyph overlapping "Escanear").

**A second, previously-undetected consequence of the same root cause**: `minWidth`/`minHeight`
(T033's 44×44 tap-target floor) were *also* silently ignored on the same `display: inline`
element — CSS `min-width`/`min-height` don't apply to non-replaced inline boxes either. This means
the web tap target was smaller than the accessibility floor the whole time T033's own test
(`StyleSheet.flatten(link.props.style).minWidth >= 44`) reported as passing. This wasn't called
out in the original bug report but is the same class of defect and is fixed by the same change.

### Fix

Read `node_modules/expo-router/build/link/Link.js` and
`node_modules/react-native-web/dist/exports/Text/index.js` before choosing a fix, to confirm
*why* the styles were ignored rather than guessing.

Adopted (and extended) the suggested fix — kept `<Link>` for navigation/semantics, moved the
icon+label flex layout onto a nested `<View>` — plus one addition the write-up flagged as needing
verification: also set `display: "flex"` on the `<Link>`'s own style (`styles.link`), not removed.

Reasoning for keeping both changes rather than either alone:

- **Nested `<View>` for `gap`/`alignItems`/`flexDirection`** (`styles.linkContent`): a `View`
  is guaranteed to be a flex container on every platform without any `display` override, unlike
  `Link`/`Text` whose default is web-only `inline`. This means the icon/label layout can't
  silently regress again if a future edit touches `styles.link` and drops an easy-to-miss
  `display: "flex"` line — a real structural guarantee, not just "this specific style object
  happens to be correct today."
- **`display: "flex"` kept on `<Link>`'s own style, not delegated to the inner `View`**: this is
  what makes `minWidth`/`minHeight` (the actual tap target) apply to the real, focusable,
  `accessibilityRole="link"` element — not just to an inner `View`'s bounding box. The task
  explicitly flagged this risk ("make sure the touch target stays on the element that is actually
  the link, not only on an inner View"), and it's a real risk: without `display: "flex"` on the
  `Link` itself, an inline anchor's line-box height is driven by its content's rendered size
  (here, the icon+label wrapper, well under 44px tall), so the tap target would still be broken —
  just less visually obvious than the gap bug, and not what the bug report called out, but the same
  underlying defect.

An alternative considered and rejected: only adding `display: "flex"` to `<Link>`'s own style
(no nested `View`, keeping `Ionicons`/`Text` as direct children, matching the *original* file
structure exactly). This would have fixed the bug identically, with a smaller diff. Rejected for
two reasons: (1) it's more fragile — a single style-object property is easy to delete in a future
refactor without anyone noticing the web-only consequence, whereas a `View` wrapper is a
structural fact of the component tree; (2) `jest-expo`'s default test environment renders through
`react-test-renderer`, not `react-native-web`/jsdom-with-real-CSS-layout — there is no way to
write a Jest test in this repo that verifies actual computed CSS (`display`, `gap`) takes effect
in a browser, only that a given style value is *present*, which is precisely the class of
assertion that let this bug ship in the first place. A `View`-wrapper *structure* is the one thing
this Jest environment genuinely can verify as a reliable proxy for "this will actually flex on
web," since `View`'s flex-by-default behavior is not conditional on any style value at all.

**Accessibility properties confirmed unchanged**: `accessibilityRole="link"` and
`accessibilityLabel` stay on the `<Link>` itself (unchanged from before — never moved to the
inner `View`). The inner `View` carries no accessibility props of its own, so it introduces no new
node in the accessibility tree — a plain, unlabeled `<div>` inside an `<a>` is accessibility-inert
and does not affect `role`, name, or keyboard-focus behavior. Nesting a `<div>` inside an `<a>` is
also valid HTML5 (the "transparent" content model for `<a>` explicitly permits flow content,
unlike HTML4's stricter inline-only rule) and is not a new/exotic pattern — this repo already
nests non-`Text` children (`Ionicons`) inside `<Link>` before this change; the only difference now
is one more layer. Keyboard reachability and focus order are unaffected — the focusable element is
still exactly one `<a>` per destination, unchanged in count or position in the DOM/tab order.

### Other components in this feature checked for the same mistake

Per the task's instruction, checked every component in `008-scan-experience` that could plausibly
apply flex styles to a component rendering an inline web element:

| Component | Uses `<Link>`? | Verdict |
|---|---|---|
| `ShellHeader.tsx` | No — `View` only | Not affected |
| `TopRightControls.tsx` | No — `Pressable`/`View` only (`Pressable` renders a `<div>` on web via `react-native-web`, which defaults to flex-friendly block behavior, not `inline`) | Not affected |
| `ScanEntryCard.tsx` | No — `Pressable`/`Text` only | Not affected |
| `FoundCardPanel.tsx` | No — `Pressable`/`View`/`Text` only throughout (condition chips, stepper, toggle, links) | Not affected |
| `CarteraPlaceholderScreen.tsx` / `TradesPlaceholderScreen.tsx` / `PerfilPlaceholderScreen.tsx` | No — no `Link`/`Pressable` at all, `View`/`Text` only | Not affected |
| `HomeScreen.tsx` | No — no `Link`/`Pressable` beyond what `ScanEntryCard` already covers | Not affected |
| `WebBottomBarNav.tsx`, `WebSidebarNav.tsx` | Yes | **Fixed this run** |

One more `<Link>` exists in the repo — `SignInForm.tsx`'s "Create account" link — but it belongs
to `005-login`, a different feature, out of this task's scope. Checked anyway for completeness:
its `style={styles.createAccountLink}` wraps a single string child (no icon, no multi-child flex
layout), so it isn't exhibiting this bug — there's no `gap`/`alignItems`/`justifyContent`/
`flexDirection` on it to be silently ignored. Not touched.

### Files changed

- `src/features/navigation/WebBottomBarNav.tsx` — moved `alignItems`/`justifyContent`/`gap` off
  `styles.link` onto a new `styles.linkContent`, applied to a new `<View>` wrapping the
  `Ionicons`+`Text` children; added `display: "flex"` to `styles.link`. Added a header comment
  explaining the bug and fix, referencing commit `39c3f02`.
- `src/features/navigation/WebSidebarNav.tsx` — same shape: moved `flexDirection`/`alignItems`/
  `gap` off `styles.link` onto a new `styles.linkContent` View wrapper; added `display: "flex"`
  to `styles.link`. Same header comment pattern.
- `src/features/navigation/WebBottomBarNav.test.tsx` — added a structural regression test
  ("wraps each link's icon and label in a real View container, not as the Link's direct
  children") that asserts `link.children` has length 1 and that the single child is a real
  `View` containing the label text, using `findAllByType(View)` (the same technique
  `TopRightControls.test.tsx` already established for verifying drawn structure) — not a style-
  object assertion. Added `View`/`within` imports.
- `src/features/navigation/WebSidebarNav.test.tsx` — identical regression test, same technique.
- `src/features/navigation/README.md` — updated the `WebSidebarNav.tsx`/`WebBottomBarNav.tsx`
  bullet to document the `display: "flex"` requirement and the `View`-wrapper structure, and
  records that this fixes a bug that shipped in `39c3f02` and was only caught by a live browser
  render.

### Regression test verified to actually catch the bug (not just re-describe the fix)

Before finalizing, stashed the two component changes (kept the two test file changes) and re-ran
the new tests against the original, buggy component code:

```
FAIL src/features/navigation/WebSidebarNav.test.tsx
  ● WebSidebarNav › wraps each link's icon and label in a real View container, not as the Link's direct children
    expect(received).toHaveLength(expected)
    Expected length: 1
    Received length: 2
FAIL src/features/navigation/WebBottomBarNav.test.tsx
  ● WebBottomBarNav › wraps each link's icon and label in a real View container, not as the Link's direct children
    expect(received).toHaveLength(expected)
    Expected length: 1
    Received length: 2
Test Suites: 2 failed, 2 total
Tests:       2 failed, 13 passed, 15 total
```

Both new tests fail against the pre-fix code (`Ionicons` + `Text` as two direct children of
`Link`) and pass against the fixed code (one `View` child). Restored the component fix
(`git stash pop`) after confirming this.

### `npx tsc --noEmit` — full repo, after the fix

```
$ npx tsc --noEmit
(no output — clean)
```

### `npm test` — full repo, after the fix

```
Test Suites: 72 passed, 72 total
Tests:       480 passed, 480 total
Snapshots:   0 total
```

480 (was 476 before this run) — the four new tests are the two structural regression tests
above plus nothing else; no pre-existing test needed a change.

### Level 4 (build check) plus a direct inspection of the compiled web bundle

Ran `npx expo export --platform web` to a scratch directory (outside the repo) — exported
cleanly, 37 files, no errors. Since `jest-expo`'s default test environment cannot verify actual
CSS/layout behavior (see "Fix" section above), inspected the *compiled* bundle's JS directly —
the closest thing to "what a real browser will execute" available without a live browser tool in
this environment — and confirmed both fixes are present verbatim in the shipped code:

```
// WebBottomBarNav's compiled StyleSheet.create(...) call:
link:{display:"flex",alignItems:"center",justifyContent:"center",minWidth:44,minHeight:44,
  paddingHorizontal:p.space.sm,paddingVertical:p.space.xs},
linkContent:{alignItems:"center",justifyContent:"center",gap:2}

// WebSidebarNav's compiled StyleSheet.create(...) call:
link:{display:"flex",alignItems:"center",minWidth:44,minHeight:44,paddingVertical:12,
  paddingHorizontal:12,borderRadius:8},
linkContent:{flexDirection:"row",alignItems:"center",gap:h.space.sm}
```

Also confirmed the compiled JSX tree shape directly in the bundle:
`(0,x.jsx)(l.Link,{...,style:j.link,children:(0,x.jsxs)(c.default,{style:j.linkContent,
children:[(0,x.jsx)(n.Ionicons,{...}),(0,x.jsx)(s.default,{style:j.linkLabel,...})]})})` —
`Link` wraps exactly one `View` (`c.default`), which wraps the icon and label. Deleted the
scratch export directory afterward (not committed to the repo).

### `./init.sh --skip-build`

```
RESULT: SUCCESS (8/8 stages passed)
```

Type-check clean, full test suite green (`--skip-build` used only because the fast path already
had a manual `npx expo export --platform web` run moments earlier for the bundle inspection above
— the two pre-existing `expo-doctor`/native-dependency-alignment warnings are unrelated outdated-
package advisories, unchanged by this fix, and already present before this run).

### Manual smoke check (Level 3) — disclosed gap, unchanged from every prior run in this feature

**Not performed against a live browser in this environment.** `EXPO_PUBLIC_SUPABASE_URL`/
`EXPO_PUBLIC_SUPABASE_ANON_KEY` are empty in `.env`, and no local backend responds on
`localhost:3000` (confirmed with `curl`, connection refused). Per `docs/verification.md`'s "which
live services to run" table, this means every destination behind the KYC gate — including both
nav components fixed in this run — is genuinely unreachable in this environment; this is the same
disclosed gap Run 10 already recorded ("this environment cannot reach any of the five shell
destinations"). The compiled-bundle inspection above is the strongest verification available
without that access, but it is not a substitute for an actual rendered browser confirming the
icon/label gap is now visible and the tap target now measures ≥44×44 — that remains open per Run
10's item 2 ("real keyboard-only navigation... never driven through an actual browser's focus
engine") and item 4 ("a real 375px-wide browser resize... never a substitute for an actual
rendered viewport").

### Requirement traceability (this run)

This is a bug fix to already-shipped, already-traced functionality (FR-001/FR-011/SC-002/SC-003,
per `WebBottomBarNav.test.tsx`/`WebSidebarNav.test.tsx`'s own header comments) — no new
functional requirement. The two new tests are regression coverage for the same FR-001/SC-002
surface (destination links reachable and correctly structured), not a new FR.

### Tasks now `[X]`

No `tasks.md` task ID changes — this is a post-ship defect fix found by a live render, not a
tracked task in `specs/008-scan-experience/tasks.md` (which was already 100% `[X]` before this
run, per Run 10). No task line added or modified.

### Deviations / notes for sign-off

- **Extended the suggested fix** (nested `View` for `gap`/`alignItems`/`flexDirection`) with an
  additional change the write-up explicitly asked to be verified rather than assumed: kept
  `display: "flex"` on `<Link>`'s own style too, specifically to fix the tap-target risk the task
  called out ("make sure the touch target stays on the element that is actually the link, not
  only on an inner View"). Flagging this as a deviation from the literal suggested fix (which
  didn't mention touching `<Link>`'s own `display`) for sign-off, even though it's a strict
  improvement addressing the task's own explicit concern — see "Fix" section above for the full
  reasoning on why the nested `View` alone would have left the tap target broken.
- Also surfaces a previously-undetected defect (T033's tap-target floor was silently
  non-functional on web this whole time, same root cause) that wasn't part of the original bug
  report — documented above rather than silently folded in.
- No other component in this feature exhibited the same mistake (see table above).
- `src/features/identity/SignInForm.tsx`'s unrelated `<Link>` (feature `005-login`) was checked
  and confirmed not affected, and left untouched as out of this task's scope.

---

## Run — `TopRightControls`/`ShellHeader` vertical-column layout bug (2026-08-06)

**Caught by a live browser render, not the test suite.** `TopRightControls.tsx` (T007) laid its
four icon controls out as `flexDirection: "column"` — reasonable in `004-home-scan-shell`, where
they sat in one screen's top-right corner, but `ShellHeader.tsx` (T008) later made that stack
shell-wide chrome above all five destinations (Run covering T009–T012). As shell-wide chrome, the
column reserved the stack's full height as empty space on *every* page before any page content —
measured in a real browser: ~285px on desktop, ~450px of an 812px mobile viewport (over half the
screen). Jest/RNTL doesn't run a real layout engine (`react-test-renderer`, not
`react-native-web`-in-a-browser), so nothing in the 483-test suite could have caught this — it only
verified the *presence* of `flexDirection: "column"` and the four controls' individual props, never
what a browser actually does with that style shell-wide. Same class of gap as the
`WebSidebarNav`/`WebBottomBarNav` bug fixed above in commit `39c3f02`, different mechanism (a
correctly-flexing `View` laid out in a shape nobody re-checked at the new shell-wide scale, vs. a
`flexDirection` silently ignored by a web-`inline` element).

### Fix

- **`src/features/navigation/TopRightControls.tsx`**
  - `styles.stack`: `flexDirection: "column"` → `"row"`, `alignItems: "flex-end"` → `"center"`
    (all four controls are the same height; center is the correct cross-axis alignment for a
    row of icon buttons, not the old column's right-edge alignment).
  - Renamed `styles.controlRow` → `styles.controlWrapper` (it's no longer literally "a row" once
    the parent is one) and made it the positioning context (`position: "relative"`, RN's default
    anyway, kept explicit for clarity) for each control's feedback bubble.
  - **The one piece that doesn't fall out of a plain column→row swap**: the "press → inline 'not
    yet available' feedback" text. In the old column, feedback sat in-flow directly below its
    control with nothing beside it to disturb. In a row, in-flow feedback text would widen that
    control's flex item and visibly shove the other three controls sideways every time it toggled
    on/off — the exact regression the task called out as most likely. **Decision**: made the
    feedback `Text` `position: "absolute"` (removed from flex flow entirely), anchored `top: 48`
    (just below the 44px control), `right: 0` (so it grows leftward under its own control rather
    than off the right edge of the viewport for the rightmost "messages" control, given the whole
    row is itself right-aligned by `ShellHeader`'s `justifyContent: "flex-end"`), with a small
    `bg.surface`/`border.subtle` chip background + `zIndex: 20` so it reads as a legible floating
    bubble rather than a bare label overlapping whatever page content sits just below the header
    on web (`zIndex` matters here: CSS paints a positioned descendant with a numeric `z-index`
    above later, non-positioned DOM siblings within the same stacking context regardless of DOM
    order — the header renders before the page `Slot` in the DOM, so without it the feedback bubble
    could paint underneath the page content that follows).
  - No change to `accessibilityRole="button"`, `accessibilityLabel`, or the ≥44×44 `control` style
    — all untouched, still per-control, still icon-first, still translated via
    `useTranslation(navCopy)`.
- **`src/features/navigation/ShellHeader.tsx`**
  - `styles.row`: `alignItems: "flex-start"` → `"center"`. That value dated from when
    `TopRightControls` was a tall column the row needed to pin to the top rather than
    stretch/center; with a single, uniformly-tall row child, `"flex-start"` and `"center"` render
    identically today, but `"center"` is the one that stays correct if this header ever grows a
    second, differently-sized child (documented inline rather than left as stale reasoning).
    `justifyContent: "flex-end"` and `paddingBottom: 16` both still make sense unchanged — the
    header should still right-align its content and still leave breathing room before the page
    content that follows.
- Header comments added to both files explaining the bug, the measured impact, and the fix
  (mirrors this file's existing convention for prior live-render-caught bugs).

### Other callers of `TopRightControls` checked

`grep -rl "TopRightControls"` across `src/` and `app/` turns up exactly one importer besides the
component's own file/test: `src/features/navigation/ShellHeader.tsx`. No other caller depended on
the old column layout — nothing was silently changed out from under a second consumer.

### Files changed

- `src/features/navigation/TopRightControls.tsx` — `stack` row layout, `controlRow` →
  `controlWrapper` rename + `position: "relative"`, feedback bubble now `position: "absolute"`
  with an anchored, backgrounded, z-indexed presentation; top-of-file comment explaining the fix.
- `src/features/navigation/TopRightControls.test.tsx` — new/updated tests (below).
- `src/features/navigation/ShellHeader.tsx` — `row.alignItems: "flex-start"` → `"center"`,
  top-of-file comment explaining the fix.
- `src/features/navigation/ShellHeader.test.tsx` — new test (below).

### Tests written/updated — and why they'd actually catch this regression

Per the task's explicit steer (same standard as the `39c3f02` fix above): prefer assertions that
would actually catch a real rendered-structure regression over ones that just re-assert a style
key exists. Two things make the row/column assertions here meaningfully different from a bare
"style key exists" check, unlike the earlier `<Link>` bug: `View` is a genuine flex container on
every platform by default (RN's Yoga layout engine, and react-native-web's `View` primitive,
`display: flex` unconditionally) — there's no web-`inline`-style trap here where the style is
present but silently ignored. So `flexDirection`/`position` assertions against a `View`'s style are
a real proxy for what a browser/simulator will render, not the same class of false-positive the
`Link`/`Text` bug exposed.

- **`TopRightControls.test.tsx`**
  - Renamed the existing order test from "top-to-bottom" to "left-to-right" (FR-011) — same
    assertions, corrected wording now that the row is horizontal.
  - New: `"lays the four controls out horizontally as a row, not stacked as a column"` — asserts
    `StyleSheet.flatten(topRightControls.props.style).flexDirection === "row"` on the actual
    rendered container (FR-011, the fix's core claim).
  - New: `"shows feedback as an out-of-flow bubble that does not shift the other three controls"`
    — asserts the feedback `Text`'s flattened style has `position: "absolute"` (the property that
    actually removes it from flex flow) **and** that the other three buttons' accessibility-label
    order is byte-for-byte unchanged before vs. after one control's feedback is activated
    (FR-011, SC-005 — "never a silent no-op" for the feedback itself, while genuinely proving the
    "must not shift siblings" requirement rather than assuming it from the style alone).
- **`ShellHeader.test.tsx`**
  - New: `"renders TopRightControls as a horizontal row, keeping the header a compact bar"` — the
    same `flexDirection === "row"` assertion, but at the `ShellHeader` integration level (the
    actual component all five destinations render), not only inside `TopRightControls`' own
    isolated unit test.

### Regression tests verified to actually catch the bug (mutation test)

Stashed the two component changes (`git stash push -- TopRightControls.tsx ShellHeader.tsx`, kept
the two test-file changes) and re-ran against the original, buggy (column-layout) component code:

```
● TopRightControls › lays the four controls out horizontally as a row, not stacked as a column
  expect(received).toBe(expected)
  Expected: "row"
  Received: "column"

● TopRightControls › shows feedback as an out-of-flow bubble that does not shift the other three controls
  (position assertion — fails: old feedback style has no `position` key at all)

● ShellHeader › renders TopRightControls as a horizontal row, keeping the header a compact bar
  expect(received).toBe(expected)
  Expected: "row"
  Received: "column"

Test Suites: 2 failed, 2 total
Tests:       3 failed, 19 passed, 22 total
```

All three new tests fail against the pre-fix code and pass against the fixed code. Restored the
fix (`git stash pop`) and confirmed `git status` matched the pre-stash diff exactly.

### `npx tsc --noEmit`

```
(no output — clean)
```

### `npm test` — full repo, after the fix

```
Test Suites: 72 passed, 72 total
Tests:       483 passed, 483 total
Snapshots:   0 total
Time:        1.984 s, estimated 2 s
```

483 (was 480 before this run) — the three new tests above, plus nothing else changed; no
pre-existing test needed modification beyond the two renamed titles already noted.

### `./init.sh`

```
RESULT: SUCCESS (10/10 stages passed)
```

Type-check clean, full suite green, all three bundle-export smoke checks (web/iOS/Android) green.
The two `expo-doctor`/native-dependency-alignment warnings are the same pre-existing,
unrelated-outdated-package advisories every prior run in this feature has already flagged —
unchanged by this fix.

### Manual smoke check (Level 3) — web only, disclosed gap same shape as every prior run

Ran `npm run web` (Metro/`expo start --web`) against this environment's `.env`
(`EXPO_PUBLIC_API_URL` + `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` all set — same
"both services configured" row `docs/verification.md`'s table describes). Metro bundled cleanly
(`Web Bundled ... node_modules/expo-router/entry.js`, no errors) — confirms the change doesn't
crash on boot. This session's tool list has no browser-automation/screenshot tool (unlike whatever
render caught the original bug, which happened outside this session), so — as the strongest
available substitute, following the same technique already used for the `39c3f02` fix above —
fetched the actual dev-server-compiled bundle (`curl .../node_modules/expo-router/entry.bundle...`)
and located the compiled `TopRightControls.tsx` module verbatim in it. Confirmed the exact shipped
`StyleSheet.create` call matches the source: `stack: { flexDirection: "row", alignItems: "center",
gap: theme.space.sm }`, `controlWrapper: { position: "relative" }`, `feedback: { position:
"absolute", top: 48, right: 0, zIndex: 20, ... }` — i.e., what a real browser will actually receive
and render is the fixed code, not a stale cache or an unbundled edit.

**What this does not cover** (disclosed, same class of gap Run 8/9's own "genuinely unverified"
list above already names for this feature): this environment cannot reach any of the five shell
destinations behind the KYC gate (no way to complete Supabase sign-in from this session), and has
no real browser/simulator to visually confirm the actual pixel layout, the feedback bubble's
readability against real page content, or that it truly doesn't visually overlap adjacent controls
when several are active in the mobile 375px width — those remain open the same way item 4 in the
"disclosed, unverified in this environment" list above already does. The compiled-bundle
inspection above proves the *code that will run* is correct; it is not a substitute for an actual
rendered viewport.

### Requirement traceability (this run)

Bug fix to already-shipped, already-traced functionality (FR-011/FR-012/SC-004/SC-005/SC-006, per
`TopRightControls.test.tsx`'s own header comment) — no new functional requirement. The three new
tests are regression coverage for the same FR-011 surface (four controls, correct order, visible
feedback that never silently fails), not a new FR.

### Tasks now `[X]`

No `tasks.md` task ID changes — T007/T008 were already `[X]` before this run (this feature's
`tasks.md` was already 100% complete per Run 10). This is a post-ship defect fix found by a live
render, not a tracked task.

### Deviations / notes for sign-off

- **Feedback presentation is a judgment call, not spelled out in spec.md/plan.md**: the task
  explicitly asked "decide how the feedback presents in a row layout and say what you chose" —
  chose an absolutely-positioned, right-anchored bubble under each control (see "Fix" above for
  the full reasoning). Flagging for sign-off since this is new visual treatment beyond what any
  prior task/spec text described, even though it reuses only existing `src/theme` tokens and no
  new dependency.
- `ShellHeader.tsx`'s `alignItems: "flex-start"` → `"center"` change is currently a no-op given
  today's single, uniformly-tall child — kept as a forward-looking correctness fix per the task's
  explicit ask to check whether that style "still makes sense," not because it changes anything
  observable today. Flagging in case a reviewer would rather leave it untouched until it matters.
- No `tasks.md`/`spec.md`/`plan.md` edits made — this run stayed inside the two files + two test
  files the task named.

---

## Follow-up run (2026-08-06): Gradient card thumbnails (human-requested, ad hoc — not a tasks.md task ID)

**Context**: The human explicitly asked for the three sample cards' thumbnails to render as
gradients (per the mockup transcription in `feature_list.json`'s 008 notes — "a rounded gradient
thumbnail" per row, Dragón Eterno's detail thumbnail specifically "a purple gradient with a dragon
glyph") instead of the flat color swatches T002/T014/T022 shipped. This is not a `tasks.md` task
ID; all of `tasks.md`'s tasks were already `[X]` before this run. No `tasks.md` line was
(re)checked as part of this run — it's a direct, disclosed follow-up edit, not new task
completion.

### Dependency decision — no new dependency added

**Checked first, per the instruction, whether `expo-linear-gradient` was already present**: it
is. `package.json` already declares `"expo-linear-gradient": "~13.0.2"` and it is already
**imported and used** in this exact codebase — `src/features/identity/LoginScreenChrome.tsx`
(006-visual-identity's T025, the `/login` background wash). `node_modules/expo-linear-gradient`
confirms a genuine `NativeLinearGradient.web.tsx` variant exists (a real CSS-gradient
implementation under `react-native-web`, not just an iOS/Android native module) — so this package
already gets a real gradient on **all three** targets, not just native.

**Chosen approach**: use the already-installed `expo-linear-gradient` via one new shared
component, `src/features/scanner/CardThumbnail.tsx`. **No new runtime dependency was added** —
`package.json` is unchanged by this run. This is strictly better than the two alternatives raised
in the task: a CSS-gradient approach doesn't cover native, and a hand-layered-`View`
approximation can't produce a true multi-stop blend and would have been extra, unjustified
complexity when a real, already-present, already-proven-in-this-repo gradient primitive was
sitting right there.

### Files changed

- `src/theme/colors.ts` — added `colors.gradients` (`cardPurple`, `cardEmber`, `cardTeal`), each a
  two-stop `[light, dark]` hex tuple of the same hue (a standard Tailwind-shade ramp), documented
  as decorative-only (not subject to `contrast.test.ts`'s WCAG text-on-background pairing checks,
  since these never sit under text). No raw hex at any call site outside this one token file.
- `src/domain/scanResults.ts` — `SampleCard.thumbnailColorToken: string` replaced with
  `thumbnailGradient: readonly [string, string]`; each of the three `SAMPLE_CARDS` now points at
  its own `colors.gradients.*` token (Dragón Eterno → `cardPurple`, Fénix de Tormenta →
  `cardEmber`, Serpiente del Vacío → `cardTeal`) instead of the previous flat
  `brand.primary`/`accent.priceGreen`/`text.link` swatch. Zero React/React Native import
  preserved — the field is still plain data (an ordered color-stop tuple), not a component.
- `src/domain/scanResults.test.ts` — added two tests: each card's `thumbnailGradient` is a real
  `colors.gradients.*` token (identity-equality check, not a duplicated hex literal) with two
  valid hex stops, and all three cards' gradients are pairwise distinct.
- `src/features/scanner/CardThumbnail.tsx` (new) — the one shared decorative-gradient component,
  consumed by both render sites below instead of two independently-styled `LinearGradient`s (this
  repo's "extreme consistency" convention). Props: `gradient`, `size`, optional `testID`. Renders
  square with `radius.row` corners, matching the old flat swatch's exact dimensions/corner radius.
  Deliberately does **not** set `accessible={false}`/`importantForAccessibility=
  "no-hide-descendants"` — investigated and confirmed those props also remove the node from this
  repo's pinned `@testing-library/react-native`'s *default* queries (`getByTestId` etc. skip
  accessibility-hidden elements unless a caller opts in with `{ includeHiddenElements: true }`),
  which would have silently broken every existing `getByTestId("found-card-thumbnail")`/
  `getByTestId("recent-scan-row-...")`-style assertion this component now nests inside. Omitting
  any `accessibilityRole`/press handler already achieves "not focusable, not announced" — exactly
  matching the plain `View` it replaces, which never carried an accessibility role either.
- `src/features/scanner/CardThumbnail.test.tsx` (new) — renders the underlying `LinearGradient`
  with the given gradient's `colors` prop in order, confirms square sizing from the `size` prop,
  confirms no `accessibilityRole`/`onPress` (decorative, Constitution VII), and smoke-renders one
  instance per sample card's own token.
- `src/features/scanner/RecentScansList.tsx` — each row's flat
  `<View style={{ backgroundColor: card.thumbnailColorToken }} />` replaced with
  `<CardThumbnail gradient={card.thumbnailGradient} size={44}
  testID={\`recent-scan-thumbnail-${card.id}\`} />`; the now-dead `styles.thumbnail` entry removed.
- `src/features/scanner/RecentScansList.test.tsx` — added a test asserting exactly three
  `LinearGradient`s render (one per `SAMPLE_CARDS` row), each with that row's own
  `thumbnailGradient` colors in order, and that all three are pairwise distinct.
- `src/features/scanner/FoundCardPanel.tsx` — the detail thumbnail's flat
  `<View style={{ backgroundColor: card.thumbnailColorToken }} testID="found-card-thumbnail" />`
  replaced with `<CardThumbnail gradient={card.thumbnailGradient} size={64}
  testID="found-card-thumbnail" />` (same `testID`, so every pre-existing assertion that looked
  it up still passes unchanged); the now-dead `styles.thumbnail` entry removed.
- `src/features/scanner/FoundCardPanel.test.tsx` — extended the existing "renders the documented
  fields for SAMPLE_CARDS[0]" test with an assertion that the underlying `LinearGradient`'s
  `colors` prop equals `SAMPLE_CARDS[0].thumbnailGradient` (the mockups' "purple gradient" for
  Dragón Eterno).
- `src/features/scanner/ScanShellScreen.test.tsx` — added `"CardThumbnail.tsx"` to
  `SCANNER_SOURCE_FILES`, the camera-import source-inspection guard's file list (FR-016) — a new
  file under `src/features/scanner/`, so it must be covered by the same guard every other file in
  that directory already is, per FR-016/T023's own "extend, not narrow" instruction.

**Other thumbnail render sites checked**: grepped the full `src/`/`app/` tree for
`thumbnailColorToken`/`SAMPLE_CARDS` usage — `RecentScansList.tsx` and `FoundCardPanel.tsx` are
the only two render sites. No other file renders a card thumbnail.

### Verification

- `npx tsc --noEmit` — clean, no errors.
- `npx jest src/domain/scanResults.test.ts src/features/scanner/CardThumbnail.test.tsx
  src/features/scanner/RecentScansList.test.tsx src/features/scanner/FoundCardPanel.test.tsx
  src/features/scanner/ScanShellScreen.test.tsx src/features/identity/LoginScreenChrome.test.tsx`
  — 6 suites, 64 tests, all green (the only console noise is the pre-existing, unrelated
  `@expo/vector-icons` async-`setState`-outside-`act` warning already present before this run).
- `npm test` (full suite) — **73 suites, 491 tests, all green.**
- `./init.sh` (no `--skip-*` flags) — `RESULT: SUCCESS (10/10 stages passed)`: type-check clean;
  tests green; web/iOS/Android bundle exports all clean (confirms
  `expo-linear-gradient` resolves on all three Metro module graphs, not just web — the exact
  failure mode the task called out to catch). The two `WARN`s (`expo-doctor` outdated-dependency
  advisory, native-dependency-version drift for `expo-image-picker`/`react-native`/
  `react-native-safe-area-context`/`@types/react`/`typescript`) are pre-existing, unrelated to
  this change (none of the flagged packages were touched), and were already present before this
  run — non-blocking per `docs/verification.md`.
- **Level 3 (manual smoke check) — partial, gap disclosed**: started `npx expo start --web` and
  confirmed the web bundle serves (`HTTP 200`, real hydration HTML, no server-side crash) with no
  Supabase/backend service running. Per `docs/verification.md`'s own documented trap, this
  environment has no `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` configured, so
  `resolveKycRoute()` resolves `"unauthenticated"` and every authenticated route (Escanear,
  Inicio) redirects to `/login` before rendering — the gradient thumbnails were **not**
  visually confirmed in a live browser for this run, the same disclosed limitation prior sessions
  in this file recorded for KYC-gated screens. No screenshot-capable browser tool was available in
  this session either. The strongest available substitute is what's above: direct
  `LinearGradient`-prop assertions in `CardThumbnail.test.tsx`/`RecentScansList.test.tsx`/
  `FoundCardPanel.test.tsx` (real rendered output, not "doesn't crash") plus all three platforms'
  clean bundle exports.

### Requirement traceability (this run)

This is a presentation-only follow-up to already-`done` FR-008/FR-010 (the found-card panel's
thumbnail, the sample-card pool) — no FR text changed, so no new FR ID exists to trace to. The
existing FR-008/FR-010 traceability from the original implementation stands; this run's new
assertions (gradient-colors-match-token, pairwise-distinct, decorative/non-focusable) are
additional coverage of the same requirements' "thumbnail" clause, not a new requirement.

### Deviations from the original plan.md/spec.md (disclosed, none require sign-off beyond this note)

- `SampleCard.thumbnailColorToken: string` → `thumbnailGradient: readonly [string, string]` is a
  breaking rename of a `src/domain` field spec.md's Key Entities section describes as "a
  thumbnail color token" (singular). This directly implements the human's explicit request in
  this follow-up prompt, which itself states the original flat-swatch result, though spec-compliant
  at the time, doesn't match the mockups. No other consumer of `thumbnailColorToken` existed
  outside the two files updated here (grep-confirmed).
- Tasks.md itself was not edited — none of its task IDs describe this follow-up, so there was
  nothing to mark `[X]` or otherwise change there.

---

## Follow-up run (2026-08-06): four defects found on a real iPhone 17 Pro simulator, invisible to the 491-test suite

Scope: four disclosed native/visual defects in already-`done` feature work — no `tasks.md` task
IDs describe these fixes (they're bugs in T009/T014/T015's implementations, not new task scope),
so none is marked `[X]`; this section is the record instead. Each fix below is paired with a new
test, and each new test was verified by hand to genuinely fail against the pre-fix code (temporarily
reverted the source fix, kept the new test, ran it red, then restored the fix and re-ran it green —
not just "written to plausibly cover the bug").

### 1. "Gradeada" toggle rendered ~44pt tall instead of 28pt, overlapping the condition chip row

**File**: `src/features/scanner/FoundCardPanel.tsx`. The single `Pressable` carrying
`styles.toggleTrack` set `width: 48, height: 28` *and* `minHeight: 44` on the same View. On native,
Yoga's `minHeight` wins over a shorter explicit `height`, so the visible pill rendered ~44pt tall —
a large lime pill overlapping "Casi Nuevo" beneath it. The inline comment claiming the tap target
was "padded out via alignItems/justifyContent centering" was simply wrong; centering doesn't shrink
a View below its `minHeight`.

**Fix**: split the single View into two — an outer `Pressable` (`styles.toggleTouchTarget`:
`minHeight: 44, minWidth: 44`, centered) carrying the real ≥44×44 tap target and all the
accessibility props, and an inner `View` (`styles.toggleTrack`, now genuinely `height: 28` with no
`minHeight` on it) carrying the visible pill. Corrected the misleading comment. The inner track got
its own `testID="found-card-graded-track"` so its visible size is independently assertable.

**Test added** (`FoundCardPanel.test.tsx`, `renders the "Gradeada" toggle's visible track at 28pt
tall with no minHeight override`): queries the track by that new testID and asserts
`style.height === 28` and `style.minHeight === undefined`. **Verified to catch the bug**: reverted
the component back to the single-View structure (restoring `minHeight: 44` alongside `height: 28`
on the same style) — the test failed with `Unable to find an element with testID:
found-card-graded-track` (the merged structure has no such element). Restored the fix, test passes.
The pre-existing 44×44 tap-target test (`keeps every interactive element at a minimum 44x44 tap
target`) still queries `found-card-graded-toggle` (now the outer Pressable) and continues to pass —
the tap target itself didn't regress, only the previously-untested visible-size claim.

### 2. "Condición actual" section label missing entirely

**Files**: `src/domain/i18n/copy/scan.ts`, `src/domain/i18n/copy/scan.test.ts`,
`src/features/scanner/FoundCardPanel.tsx`, `FoundCardPanel.test.tsx`. Grep-confirmed before this
fix: no `conditionLabel`-shaped key existed anywhere in `scan.ts`, and `FoundCardPanel.tsx` rendered
the condition-chip row with no heading above it — traced back to `tasks.md` T006's key list and
T014's description, neither of which ever named this label, so no review or test ever missed it.

**Fix**: added `conditionLabel` to both locales (`es`: "Condición actual", `en`: "Current
condition"), and render `<Text style={styles.fieldLabel}>{t("conditionLabel")}</Text>` immediately
above the chip row, wrapped in a new `conditionSection` style (`gap: space.sm`) — the same
label-over-content shape `gradedField` already establishes for "Gradeada" and the grade-value box,
reusing the existing `fieldLabel` (`typography.label.field`) treatment "Cantidad" and "Precio de
mercado" already use, not a new style.

**Tests added**:
- `scan.test.ts`: `has the 'Condición actual' section label above the condition-chip row in both
  locales` — asserts the exact Spanish/English strings.
- `FoundCardPanel.test.tsx`: `renders the "Condición actual" label above the condition-chip row` —
  asserts `screen.getByText(scanCopy.es.conditionLabel)` is truthy.

**Verified to catch the bug**: removed the label-rendering block from the component (kept the copy
key) — the component test failed with `Unable to find an element with text: Condición actual`.
Restored the fix, test passes.

### 3. Native tab bar's active tint was iOS system-default blue, not brand lime

**File**: `app/(app)/_layout.tsx`. `<Tabs screenOptions={...}>` set no
`tabBarActiveTintColor`/`tabBarInactiveTintColor`, so iOS fell back to system blue — disagreeing
with the mockups (active destination in brand lime) and with the rest of the shell.

**Contrast check performed, not eyeballed** (`node` one-off using the exact WCAG formula
`src/theme/contrast.ts` implements, then re-verified via the real `contrastRatio` export):
- `colors.brand.primary` (#C7F24C, the lime) against `colors.bg.surface` (#FFFFFF, the closest
  theme token to iOS's near-white default tab-bar background): **~1.29:1** — far below the WCAG AA
  4.5:1 floor (Constitution VII). Using the lime here would trade one invisible-text bug (defect 4
  below) for another.
- `colors.text.link` (#247B3D — this repo's existing "actionable/brand-accent green" token, already
  used for `FoundCardPanel.tsx`'s "Cambiar" link and `SignInForm.tsx`'s "forgot password") against
  `bg.surface`: **~5.28:1**. Against `colors.bg.page` (#ECEDEE, a plausible Android tab-bar
  background): **~4.51:1**. Both clear the 4.5:1 floor.
- Chose `colors.text.link` for `tabBarActiveTintColor` and the existing `colors.text.secondary` for
  `tabBarInactiveTintColor` (already the app's established inactive/secondary-text token,
  ~5.36:1 against `bg.surface`). Documented the rejected-lime reasoning inline in `_layout.tsx`'s
  comment so a future edit doesn't reintroduce it without re-checking contrast.

**Deviation flagged for the human**: the brief's "brand lime" for the active tab is not what
shipped — `text.link` (dark green) was substituted because the lime literally fails contrast
against a light tab-bar background. This mirrors defect 4's same class of problem in the opposite
direction (light-on-light here vs. dark-on-dark there). No raw hex was introduced either way.

**Test added** (`src/features/navigation/AppNativeLayout.test.tsx`, new describe block): shallow-
renders `<AppTabsLayout />` (existing pattern in this file, no `NavigationContainer` needed) and
asserts `screenOptions.tabBarActiveTintColor === colors.text.link` and
`screenOptions.tabBarInactiveTintColor === colors.text.secondary`, plus a second test that computes
`contrastRatio(activeTint, colors.bg.surface)` and `contrastRatio(activeTint, colors.bg.page)` and
asserts both `>= 4.5` — so a future change to either token value, not just the assignment itself,
still has to clear AA. **Verified to catch the bug**: reverted `_layout.tsx`'s `<Tabs>` back to
`screenOptions={{ headerShown: true, header: () => <ShellHeader /> }}` (no tint props) — the first
test failed with `Expected: "#247B3D", Received: undefined`, and the second failed with a
`TypeError` inside `contrast.ts`'s `hexToRgb` (`undefined.replace`) since `activeTint` was
`undefined`. Restored the fix, both pass.

### 4. "¡Carta encontrada!" heading unreadable on the viewfinder's near-black background

**File**: `src/features/scanner/Viewfinder.tsx`. `foundHeading` used `color: colors.text.primary`
(#10281A) on `colors.viewfinder.bg` (#0B0F0C) — computed contrast **~1.23:1**, effectively
invisible, versus the `checkmark-circle` icon directly above it which already correctly used
`colors.brand.primary`.

**Fix**: changed `foundHeading`'s color to `colors.brand.primary` — the same token the icon above it
already uses, computed contrast **~14.92:1** against `viewfinder.bg`, comfortably clearing WCAG AA
(and AAA). Documented the before/after ratios inline.

**Idle-state hint checked too** (`"Apunta la cámara a la carta"`, `styles.hint`): already uses
`colors.viewfinder.hintText` (#9CA3AF) against `viewfinder.bg`, computed contrast **~7.60:1** —
clears AA comfortably (in fact clears AAA's 7:1 floor too). No change needed; documented this
finding inline in the component and in the report here rather than leaving it unstated.

**Tests added**:
- `src/theme/contrast.test.ts`: new regression entry `brand.primary on viewfinder.bg (the
  found-state heading, spec 008-scan-experience FR-004)` — guards the token pairing itself.
- `Viewfinder.test.tsx`: `renders the found-state heading in a color that clears WCAG AA against the
  viewfinder background` — renders `state="found"`, flattens the heading `Text`'s style, asserts
  `style.color === colors.brand.primary` *and* independently recomputes
  `contrastRatio(style.color, colors.viewfinder.bg) >= 4.5` from the actual rendered style (not just
  the token in isolation) — so this fails both on a color regression and on a future token-value
  drift.

**Verified to catch the bug**: reverted `foundHeading.color` back to `colors.text.primary` — the
`Viewfinder.test.tsx` test failed with `Expected: "#C7F24C", Received: "#10281A"`. Restored the fix,
test passes. (`contrast.test.ts`'s own regression entry would also have failed on this pairing had
the token itself regressed, independent of the component.)

### Verification

- `npx tsc --noEmit` — clean, no errors.
- `npm test` — **73 suites, 498 tests, all green** (491 pre-existing + 7 new: 1 in
  `scan.test.ts`, 2 in `FoundCardPanel.test.tsx`, 1 in `contrast.test.ts`, 1 in
  `Viewfinder.test.tsx`, 2 in `AppNativeLayout.test.tsx`).
- Each new test individually hand-verified to fail against the pre-fix source (see each defect's
  "Verified to catch the bug" note above) — this is the direct answer to "the suite passes 491/491
  with the bug present": each addition closes exactly the gap that let its defect through.
- `./init.sh` (no `--skip-*` flags) — `RESULT: SUCCESS (10/10 stages passed)`. Type-check clean;
  test suite green; web/iOS/Android bundle exports all clean. The two `WARN`s (`expo-doctor`
  outdated-dependency advisory; native-dependency-version drift for `expo-image-picker`/
  `react-native`/`react-native-safe-area-context`/`@types/react`/`typescript`) are pre-existing and
  unrelated to this change (none of the flagged packages were touched).
- **Level 3 (manual smoke check) — partial, gap disclosed, same trap this file has recorded before**:
  ran `npx expo start --web` with no Supabase/backend service configured in this environment
  (`.env` has an empty `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`, no backend at
  `localhost:3000`). Confirmed the web bundle serves (`HTTP 200`, real hydration HTML, no
  server-side crash) — proving the JS changes don't break bundling — but every authenticated route
  (Escanear, Inicio, the five-tab shell) redirects to `/login` before rendering, so none of the four
  fixes was visually confirmed in a live browser this run, and the native tab-bar tint fix (defect
  3) has no web equivalent to check regardless (native-only, `<Tabs>` is not rendered on web). No
  headless-browser/screenshot tool was available in this session. This is the same disclosed
  limitation recorded earlier in this file for KYC-gated screens — the strongest available
  substitute is the real-rendered-output component tests above (Level 2) plus the hand-verified
  red→green check against the actual pre-fix source for each one (stronger than the usual
  "write a plausible test" bar, precisely because the task noted the existing suite missed these).
  All four defects were originally found on a real iPhone 17 Pro simulator by the human, per the
  task — this run could not independently re-confirm on a simulator/device (none available in this
  environment); the fixes are grounded in exact computed contrast ratios and RN layout semantics
  (`minHeight` overriding `height` in Yoga) rather than a re-observed device screenshot.

### Requirement traceability (this run)

| Requirement | Test |
|---|---|
| FR-008 (found-card panel fields, incl. condition-chip row) | `FoundCardPanel.test.tsx`: `renders the "Condición actual" label above the condition-chip row`; `scan.test.ts`: `has the 'Condición actual' section label...` |
| FR-018 / Constitution VII (≥44×44 tap targets) | `FoundCardPanel.test.tsx`: `renders the "Gradeada" toggle's visible track at 28pt tall with no minHeight override` (paired with the pre-existing `keeps every interactive element at a minimum 44x44 tap target`, unchanged and still green) |
| FR-001 (five destinations reachable) / Constitution VII (accessible by default) | `AppNativeLayout.test.tsx`: `sets tabBarActiveTintColor/tabBarInactiveTintColor from theme tokens...`; `the chosen active tint clears WCAG AA 4.5:1 against bg.surface and bg.page` |
| FR-004 (branded viewfinder, found visual state) / Constitution VII | `Viewfinder.test.tsx`: `renders the found-state heading in a color that clears WCAG AA...`; `contrast.test.ts`: `brand.primary on viewfinder.bg (the found-state heading...)` |

### Deviations from the original plan.md/spec.md requiring sign-off

- **Defect 3's active-tab color is `colors.text.link` (dark green), not the mockups' literal brand
  lime.** Disclosed and reasoned above — the lime fails WCAG AA against a light tab-bar background
  (~1.29:1), and using it anyway would ship a fifth invisible-text defect. This is a genuine
  deviation from the visual mockups, not a style preference; flagging for explicit sign-off per this
  task's own instruction ("say what you chose and why").
- No other deviations. `tasks.md` was not edited (these are bug fixes to already-`[X]` tasks, not
  new task scope); no task ID changed state as a result of this run.
