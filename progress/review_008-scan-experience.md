# Code review — 008-scan-experience, Batch 1 (T001–T006, Phase 2 domain/i18n foundation)

**Reviewed against**: `main` (base `44c6cc4`), branch `008-scan-experience`, working tree diff.
**Scope**: exactly the six files named in the review request —
`src/domain/navigation.ts(.test.ts)`, `src/domain/scanResults.ts(.test.ts)` (new),
`src/domain/i18n/copy/{nav,home,placeholders}.ts(.test.ts)` (new),
`src/domain/i18n/copy/scan.ts(.test.ts)` (extended).

`feature_list.json` and `progress/current.md` are also dirty in the working tree but are out of
this batch's stated scope (they record the earlier spec-approval-gate registration, not this
implementation run) and are not evaluated here.

## Verdict up front

**APPROVE.** All six files match `tasks.md` T001–T006 exactly, are zero-RN-import pure
TypeScript, their own 36 tests are real and pass, and every red result outside these six files
traces cleanly to the disclosed, expected `NavDestinationKey`/`SCAN_ROUTE` signature change.

---

## 1. `tsc --noEmit` — confirming the red trace

```
app/(app)/_layout.tsx(15,3): error TS2353: ... 'amigos' does not exist in type 'Record<NavDestinationKey, string>'.
app/(app)/_layout.tsx(21,3): error TS2353: ... 'amigos' does not exist in type 'Record<NavDestinationKey, ...icon names...>'.
src/features/navigation/AmigosQuickAccessPill.test.tsx(32,70): error TS2367: 'NavDestinationKey' and '"amigos"' have no overlap.
src/features/navigation/AmigosQuickAccessPill.tsx(16,70): error TS2367: 'NavDestinationKey' and '"amigos"' have no overlap.
src/features/navigation/HomeScreen.integration.test.tsx(62,68): error TS2367: 'NavDestinationKey' and '"amigos"' have no overlap.
src/features/navigation/HomeScreen.test.tsx(33,10): error TS2305: no exported member 'SCAN_ROUTE'.
src/features/navigation/HomeScreen.tsx(5,10): error TS2305: no exported member 'SCAN_ROUTE'.
```

7 errors total, 0 of them in any of the six files under review. Every one is either (a) the
narrowed `NavDestinationKey` union rejecting a literal `"amigos"` comparison/object key, or (b)
the removed `SCAN_ROUTE` export — exactly T001's two disclosed changes, in exactly the consumer
files `tasks.md` names as T007/T009/T025/T031's job to repair. Confirmed clean trace.

## 2. `npx jest` (full suite) — confirming the red trace

```
Test Suites: 2 failed, 65 passed, 67 total
Tests:       4 failed, 417 passed, 421 total
```

Both failing suites are `AmigosQuickAccessPill.test.tsx` and `HomeScreen.integration.test.tsx`;
all 4 failing assertions are `NAV_DESTINATIONS.find(d => d.key === "amigos")` now returning
`undefined` — the same T001 change, same disclosed-breakage files (retired outright in T031).
`WebSidebarNav.test.tsx`, `WebBottomBarNav.test.tsx`, `TopRightControls.test.tsx`,
`AppWebLayout.test.tsx`, and `app/(app)/index.test.tsx` all still pass — those files map
generically over `NAV_DESTINATIONS` without hardcoding old key literals, so they don't fail at
runtime even though they'll need real T010/T011/T007 rework later; this is not a defect in this
batch, just less incidental breakage than the task briefing anticipated for those specific files.

**This batch's own six test files, verified passing individually and inside the full run**:
`navigation.test.ts`, `scanResults.test.ts`, `copy/nav.test.ts`, `copy/home.test.ts`,
`copy/placeholders.test.ts`, `copy/scan.test.ts` — all green, 36/36 tests (per the implementer's
own count, cross-checked against the full-suite pass list).

No genuine (non-traceable) type or test failure was found anywhere in this diff.

## 3. Constitution IV — zero React/RN import under `src/domain`

Verified by direct grep of all twelve files (six impl + six test): no `react`/`react-native`
import anywhere. `scanResults.ts` imports only `@/theme/colors` (itself zero-import). The
implementer deliberately imported the `colors` leaf module rather than the `@/theme` barrel to
avoid even a type-only `react-native` specifier appearing transitively (barrel pulls in
`shadows.ts`'s `import type { ViewStyle } from "react-native"`) — stricter than the letter of
Constitution IV requires, not a violation of it. **PASS.**

## 4. `scanResults.ts` — purity and edge-clamping

- All exported functions (`startFoundState`, `selectCondition`, `toggleGraded`,
  `incrementQuantity`, `decrementQuantity`, `advanceToNextCard`, `formatListMeta`,
  `formatDetailMeta`) are pure: each returns a new object via spread, no mutation, no closure
  over external mutable state, no side effects. Confirmed by reading every function body
  (`src/domain/scanResults.ts:84-132`).
- `decrementQuantity` clamps correctly: `Math.max(MIN_QUANTITY, state.quantity - 1)`
  (`scanResults.ts:110`). Test genuinely exercises the floor: `startFoundState` seeds
  `quantity: MIN_QUANTITY`, then asserts `decrementQuantity(state).quantity === MIN_QUANTITY`
  (`scanResults.test.ts:75-79`) — not a trivial "returns a number" assertion, it specifically
  starts at the floor and confirms it doesn't go below.
- `advanceToNextCard` wraps via modulo (`(currentIndex + 1) % SAMPLE_CARDS.length`,
  `scanResults.ts:120`) and re-seeds fully via `startFoundState(SAMPLE_CARDS[nextIndex])` —
  correctly discards the previous card's edited condition/graded/quantity rather than carrying
  them over. Test cycles through all three cards and confirms the wrap back to `SAMPLE_CARDS[0]`
  (`scanResults.test.ts:89-102`), and a second test explicitly mutates condition/graded/quantity
  away from defaults *before* calling `advanceToNextCard`, then asserts the result matches the
  **next card's own defaults**, not the mutated values (`scanResults.test.ts:104-118`) — this is
  exactly the "re-seed, don't carry over" edge FR-009 requires, genuinely exercised, not asserted
  by trivia.
- `formatListMeta`/`formatDetailMeta` tested against `SAMPLE_CARDS[0]`'s exact documented strings
  (`"PSA 10 · GEN-001"`, `"Genesis · GEN-001"`) — matches T002's spec literally.

**PASS**, no gaps found.

## 5. Sample-card data vs. `feature_list.json`'s 008 mockup transcription

Transcription (feature_list.json, IMAGE 2 sample rows): "Dragón Eterno / PSA 10 · GEN-001 /
$45,000", "Fénix de Tormenta / BGS 9.5 · ARC-047 / $12,500", "Serpiente del Vacío / PSA 9 ·
GEN-022 / $8,900"; only Dragón Eterno's set ("Genesis") is transcribed (Image 3).

`SAMPLE_CARDS` (`scanResults.ts:38-72`):
| name | setLabel | code | grade | priceLabel |
|---|---|---|---|---|
| Dragón Eterno | Genesis | GEN-001 | PSA 10 | $45,000 |
| Fénix de Tormenta | Arcana | ARC-047 | BGS 9.5 | $12,500 |
| Serpiente del Vacío | Genesis | GEN-022 | PSA 9 | $8,900 |

Exact match on every transcribed field. `setLabel` for the other two cards is spec-writer
filler (spec.md's own Design note discloses this explicitly, "Arcana"/"Genesis" inferred from
the `ARC-`/`GEN-` prefixes) — correctly reproduced, not silently invented by the implementer.
Order in the array matches the mockup's list order and `tasks.md` T002's documented order.
**PASS.**

## 6. `thumbnailColorToken` — real theme tokens, never raw hex

`colors.brand.primary`, `colors.accent.priceGreen`, `colors.text.link` (`scanResults.ts:46,57,68`)
— all three exist verbatim in `src/theme/colors.ts` (`brand.primary: "#C7F24C"`,
`accent.priceGreen: "#1C844A"`, `text.link: "#247B3D"`). No raw hex literal anywhere in
`scanResults.ts`. **PASS.**

## 7. i18n dictionaries — pattern match against `copy/login.ts`/`copy/scan.ts`

`nav.ts`, `home.ts`, `placeholders.ts` all follow the established shape exactly: `const es = {...}`,
`const en: Record<keyof typeof es, string> = {...}`, `export const xCopy = { es, en }`, plus a
`.test.ts` with the same three-test skeleton `login.test.ts`/`scan.test.ts` use (key-parity via
sorted `Object.keys`, no-empty-string sweep, then dictionary-specific value assertions). Real,
distinct es/en strings in every dictionary (spot-checked: `navCopy.es.navInicio` "Inicio" vs.
`en` "Home"; `homeCopy.es.tagline` "Tu colección, siempre a la mano" vs. en "Your collection,
always at hand"; `placeholdersCopy.es.carteraBody` "...todavía no tiene contenido..." vs. en
"...no content yet..."). `scan.ts`'s extension (found-viewfinder heading, found-panel copy, five
condition-chip labels) follows the same flat-key convention as the rest of the file, correctly
keyed `condition<PascalCaseOption>` to preserve the existing `Record<keyof typeof es, string>`
shape rather than nesting (flagged by the implementer as a naming judgment call in
`progress/impl_008-scan-experience.md` — reasonable, not blocking). **PASS.**

## 8. `NAV_DESTINATIONS` — five destinations, exact keys/routes/labels/order

`navigation.ts:19-25` matches T001 literally:
```
{ key: "inicio",   route: "/",          label: "Inicio" }
{ key: "escanear", route: "/escanear",  label: "Escanear" }
{ key: "cartera",  route: "/cartera",   label: "Cartera" }
{ key: "trades",   route: "/trades",    label: "Trades" }
{ key: "perfil",   route: "/perfil",    label: "Perfil" }
```
`SCAN_ROUTE` removed as instructed. `BREAKPOINT_PX`/`resolveWebNavLayout` byte-for-byte
untouched (confirmed via diff — no hunk touches those lines). Test file adds order and exact
table assertions matching the above precisely. **PASS.**

## 9. `docs/conventions.md` / naming / structure

Constants `UPPER_SNAKE` (`CONDITION_OPTIONS`, `SAMPLE_CARDS`, `MIN_QUANTITY`), types `PascalCase`
(`SampleCard`, `FoundCardState`, `ConditionOption`, `NavDestination`), functions `camelCase` —
all conform. Tests colocated (`<file>.test.ts` beside `<file>.ts`) per convention. Comments are
sparse and load-bearing (why, not what) — no default-to-verbose violation. No stray
`console.log`/`TODO`/`FIXME` in any of the twelve files (grep-verified).

## 10. Requirement traceability (docs/verification.md Level 5)

| FR | Referenced by |
|---|---|
| FR-001 | `navigation.test.ts` (four `describe`/`it` blocks, all comment-tagged FR-001) |
| FR-007 | `scanResults.test.ts` `startFoundState` block |
| FR-008 | `scanResults.test.ts` (`selectCondition`, `toggleGraded`, increment/decrement blocks); `scan.test.ts` (found-panel copy, condition-chip labels) |
| FR-009 | `scanResults.test.ts` `advanceToNextCard` block (both sub-tests) |
| FR-010 | `scanResults.test.ts` (`SAMPLE_CARDS`, `formatListMeta`/`formatDetailMeta` blocks) |
| FR-011 | `nav.test.ts` (destination labels, "not yet available" test) |
| FR-012 | `nav.test.ts` (language control's accessibility-label test) |
| FR-013 | `home.test.ts` (quick-action label test) |
| FR-015 | `placeholders.test.ts` (distinct titles, "no content yet" test) |
| FR-017 | every dictionary's key-parity + no-empty-string pair, all six files |

Every FR this batch's `tasks.md` entries claim (T001 → FR-001; T002 → FR-007/008/009/010; T003 →
FR-011/012/017; T004 → FR-013/017; T005 → FR-015/017; T006 → FR-008/009/017) has a directly
referencing test. No orphaned FR claim found in this batch's scope. **PASS.**

---

## `tasks.md` checklist status (this batch)

- [X] T001 — `src/domain/navigation.ts` + test — confirmed correct
- [X] T002 — `src/domain/scanResults.ts` + test — confirmed correct
- [X] T003 — `src/domain/i18n/copy/nav.ts` + test — confirmed correct
- [X] T004 — `src/domain/i18n/copy/home.ts` + test — confirmed correct
- [X] T005 — `src/domain/i18n/copy/placeholders.ts` + test — confirmed correct
- [X] T006 — `src/domain/i18n/copy/scan.ts` + test extension — confirmed correct
- [ ] T007–T037 — not started, out of scope for this batch (as expected)

## `CHECKPOINTS.md` C1–C6 walkthrough (batch-level; feature overall is `in_progress`, not `done`)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md` and `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [ ] `./init.sh` exits 0 — **not applicable to this intermediate batch**: `tsc` is red for the
  disclosed, expected reason (T007–T012/T025/T031 not yet run); this is the planned mid-feature
  state, not a harness-health failure. Must be green before the *feature* (not this batch) is
  marked `done`.

**C2 — state is coherent**
- [x] At most one feature `in_progress` (`008-scan-experience` only, per `feature_list.json`).
- [x] `done` features have passing-test coverage (unaffected by this batch).
- [~] `progress/current.md` — stale (still describes the `spec_ready` gate, not this
  implementation run); out of this batch's file scope per the review brief, flagged for the
  orchestrator to refresh in a later commit, not a blocker for this code review.

**C3 — code respects the architecture**
- [x] `src/domain` has zero RN/Expo imports in this diff (§3 above).
- [x] No fetch/validation/business-rule embedding found in this diff (no components touched).
- [x] No inline `Platform.OS` branching introduced.
- [x] No direct Postgres/Redis/S3/Supabase-table access.
- [x] No new global state library.
- [x] No stray `console.log`/context-free `TODO`.

**C4 — verification is real**
- [x] Every exported `scanResults.ts` function with logic has a covering unit test (§4 above).
- [ ] "New/changed screens have component tests" — N/A this batch, no screens touched (pure
  `src/domain` only).
- [ ] `./init.sh`'s three-target build check — not run to completion this batch (would hard-stop
  on the same disclosed `tsc` errors); deferred to the feature's final Phase 7 gate (T037), per
  `tasks.md`'s own sequencing. Not a defect in this batch.

**C5 — session closed well** — N/A, mid-feature batch, not a session close.

**C6 — spec-driven development**
- [x] `specs/008-scan-experience/{spec.md,plan.md,tasks.md}` all exist.
- [x] No open `[NEEDS CLARIFICATION]` markers in `spec.md` (both recorded defaults were
  confirmed by the human at the approval gate per `feature_list.json`).
- [ ] "Every `done` feature's tasks.md items all `[X]`" — N/A, feature is `in_progress`, not
  `done`.
- [x] Every FR-00x this batch's tasks claim is covered by a referencing test (§10 above).

No empty C1–C6 box reflects a genuine defect in this batch's own six files — every gap is either
explicitly deferred to a later task phase (documented in `tasks.md`'s own sequencing) or outside
this batch's declared scope (`progress/current.md` staleness).

---

## Findings

None blocking. No nits either — the six files are a clean, literal implementation of
T001–T006, correctly scoped, correctly tested, and the only red results anywhere in the repo
trace exactly to the disclosed T001 signature change with no unexplained additional breakage.

## Verdict

**APPROVE**

---

# Code review — 008-scan-experience, Batch 2 (T007–T012, Phase 2 "shell chrome", User Story 1)

**Reviewed against**: branch `008-scan-experience` working tree, base `main` (`c581aca`).
**Scope**: `src/features/navigation/TopRightControls.tsx(+.test)`,
`src/features/navigation/ShellHeader.tsx(+.test)` (new), `app/(app)/_layout.tsx`,
`src/features/navigation/WebSidebarNav.tsx(+.test)`,
`src/features/navigation/WebBottomBarNav.tsx(+.test)`,
`src/features/navigation/AppWebLayout.test.tsx`, `app/(app)/_layout.web.tsx` (confirmed
untouched, as T012 says it should be). T001–T006 re-examined only as consumed by this batch
(`navCopy`, `NAV_DESTINATIONS`, `NavDestinationKey`) — not re-reviewed line-by-line.

## Verdict up front

**REQUEST CHANGES.** The shell-chrome mechanics (single shared `ShellHeader`, icon-only
controls, safe-area reproduction, no `Platform.OS`, no new dependency, keyboard reachability)
are all solid and exactly what T007–T012/FR-011/FR-012 ask for. But there is one real,
reproduced functional-requirement violation: the five destination labels
(Inicio/Escanear/Cartera/Trades/Perfil) rendered by `WebSidebarNav.tsx`, `WebBottomBarNav.tsx`,
and the native `app/(app)/_layout.tsx` tab bar never go through `useTranslation(navCopy)` — they
still read `destination.label` straight off `NAV_DESTINATIONS` (`src/domain/navigation.ts`), a
plain hardcoded-Spanish string. `navCopy.ts`'s `navInicio`/`navEscanear`/`navCartera`/
`navTrades`/`navPerfil` keys (built in T003 explicitly for this purpose — "covering the five
destination labels", tasks.md line 80) are dead: nothing in `src/` or `app/` consumes them
outside their own dictionary test. This is FR-017 ("navigation labels" is named explicitly as
one of the dictionaries this feature must route through i18n) and SC-006 ("every string this
feature renders or changes displays fully and correctly in both Spanish and English") failing
for exactly the five strings the spec calls out by name, and it is provably wrong at runtime,
not a theoretical gap — see Finding 1.

## 1. `tsc --noEmit` — confirming the red trace maps only to disclosed pending work

```
src/features/navigation/AmigosQuickAccessPill.test.tsx(32,70): TS2367 'NavDestinationKey'/'"amigos"' no overlap
src/features/navigation/AmigosQuickAccessPill.tsx(16,70): TS2367 same
src/features/navigation/HomeScreen.integration.test.tsx(62,68): TS2367 same
src/features/navigation/HomeScreen.test.tsx(33,10): TS2305 no exported member 'SCAN_ROUTE'
src/features/navigation/HomeScreen.tsx(5,10): TS2305 no exported member 'SCAN_ROUTE'
```

5 errors, identical set to Batch 1's post-T001 trace minus the two `app/(app)/_layout.tsx`
errors T009 was responsible for repairing (confirmed gone). Every remaining error is in one of
the two files the orchestrator's brief names as explicitly out of scope for this batch
(`HomeScreen.tsx`/`HomeScreen.test.tsx`/`HomeScreen.integration.test.tsx` → **T025**;
`AmigosQuickAccessPill.tsx`/`.test.tsx` → **T031**). **Confirmed clean trace — no new tsc error
anywhere in this batch's own six changed/added files.**

## 2. `npx jest` (full suite) — confirming the red trace

```
Test Suites: 3 failed, 65 passed, 68 total
Tests:       5 failed, 425 passed, 430 total
```

- `AmigosQuickAccessPill.test.tsx` — 1 failing test, `NAV_DESTINATIONS.find(k === "amigos")` now
  `undefined` — **T031**'s retirement, same T001 ripple as Batch 1.
- `HomeScreen.integration.test.tsx` — 3 failing tests, same `"amigos"` lookup — **T025**/**T031**.
- `HomeScreen.test.tsx` — 1 failing test ("renders the Amigos pill, then the top-right controls,
  then the scan card, in that order") — **newly** red this batch, but still inside the same
  T025-owned file: `TopRightControls.tsx`'s accessibility labels moved from 004's hardcoded
  English literals to `navCopy.es`'s Spanish defaults (T007's own, correct, disclosed change),
  and `HomeScreen.test.tsx` still asserts the old English strings. `tasks.md` T025 explicitly
  names this file as one it rewrites. Traces cleanly to T025, not a defect in this batch.

**All three failing suites map to T025/T031, exactly as the orchestrator's brief predicted.
This batch's own five test files (`TopRightControls.test.tsx`, `ShellHeader.test.tsx`,
`WebSidebarNav.test.tsx`, `WebBottomBarNav.test.tsx`, `AppWebLayout.test.tsx`) are all green, 29
tests, matching the implementer's own count. No genuine, unexplained type or test failure found.**

## 3. Focus-area findings

### Finding 1 (BLOCKING) — destination labels never localize; FR-017/SC-006 fail for named strings

`src/features/navigation/WebSidebarNav.tsx:60` (`<Text style={styles.linkLabel}>{destination.label}</Text>`),
`src/features/navigation/WebBottomBarNav.tsx:49` (same), and
`app/(app)/_layout.tsx:42,45` (`title: destination.label`, `tabBarAccessibilityLabel:
destination.label`) all read `destination.label` straight from `NAV_DESTINATIONS`
(`src/domain/navigation.ts:21-26`), which is a plain hardcoded Spanish string
(`"Inicio"`, `"Escanear"`, ...). None of the three consumption points calls
`useTranslation(navCopy)` for these labels, even though `src/domain/i18n/copy/nav.ts:10-14,38-42`
(T003) built exactly the translation keys needed (`navInicio`/`navEscanear`/`navCartera`/
`navTrades`/`navPerfil`, `en` = "Home"/"Scan"/"Wallet"/"Trades"/"Profile"). Grepping the repo
confirms these five keys are consumed nowhere outside `nav.test.ts`'s own key-parity assertions
— dead code that exists only to pass its own dictionary test.

**Reproduced concretely** (ad hoc probe, not committed): rendering `<LocaleProvider><Switch
onPress={() => setLocale("en")}/><WebSidebarNav/></LocaleProvider>`, pressing the switch, then
querying `screen.getByRole("link", { name: "Home" })` → not found; `screen.getByRole("link", {
name: "Inicio" })` → still found. **The destination labels do not change when the locale
context changes**, in contrast to `TopRightControls.tsx`'s icon-control labels, which correctly
do (same batch, same `LocaleProvider`/`useLocale` mechanism, `TopRightControls.test.tsx`'s own
"renders the English equivalents when the locale context is set to 'en'" test proves it for the
icon controls). This is an inconsistency inside this very batch's own diff, not a pre-existing
issue carried over from T001.

**Failure scenario**: once 007-localization wires a real language picker to
`LocaleContext.setLocale`, a user who switches the app to English will see every icon-control
label and feedback string switch correctly, but the five nav-bar/tab-bar destination names
("Inicio", "Escanear", "Cartera", "Trades", "Perfil") stay in Spanish forever, on both web
layouts and the native tab bar — a visible, permanent partial-localization bug, not merely a
missed edge case.

Spec basis: `specs/008-scan-experience/spec.md:539-542` (FR-017 — "MUST ship through the
existing i18n layer... extending scan.ts's dictionary and adding new dictionaries (**navigation
labels**, Inicio copy, ...)" — navigation labels named explicitly) and `spec.md:596-598` (SC-006
— "Every string this feature renders or changes displays fully and correctly in both Spanish
and English"). `tasks.md`'s own T010 text ("unchanged rendering logic — just more entries")
appears to be the source of the gap — it directs against wiring `navCopy` into destination-label
rendering, which conflicts with the spec's own FR-017/SC-006. Since `spec.md` is the source of
truth, the task text doesn't excuse the gap.

**Suggested fix** (for `task-implementer`, not applied here): build a
`Record<NavDestinationKey, string>` from `useTranslation(navCopy)` in each of the three
consumption points, exactly the pattern already used locally for `TAB_ICONS`/
`DESTINATION_ICONS` in the same three files, and render that instead of `destination.label`.

### Focus: four controls genuinely icon-only, with informative accessible names, both locales

**PASS.** Read `TopRightControls.tsx:60-96` in full: the language control renders only the
`FlagBadge` pair (`View`/`Text`, no icon+text combo), the other three render only an `Ionicons`
glyph — no `<Text>` visible-label sibling survives anywhere in the render tree. Confirmed by
`TopRightControls.test.tsx`'s own "renders icon-only controls, with none of the old visible text
labels" test, which explicitly asserts the four retired English strings (`"ENG/ESP"`, `"USD/
MXN"`, `"Notifications"`, `"Messages"`) are `queryByText(...) === null`. Accessibility labels
are full sentences ("Idioma, español o inglés — aún no disponible" / "Language, Spanish or
English — not yet available", etc.) — strictly more informative than the bare glyph, satisfying
Constitution VII. Both locales verified: `TopRightControls.test.tsx`'s locale-switch test
(pressing a `setLocale("en")` trigger inside a real `LocaleProvider`) confirms all four labels
and the feedback string re-render in English. **This is the one part of the batch that gets the
exact same requirement Finding 1 fails elsewhere — genuinely right here.**

### Focus: ≥44×44 tap targets on all four controls

**PASS.** `TopRightControls.tsx:132-133` (`control: { minWidth: 44, minHeight: 44, ... }`)
unchanged in substance from 004's already-approved sizing; `TopRightControls.test.tsx`'s "gives
each control a minimum 44x44 tap target" test asserts `style.minWidth`/`style.minHeight` on the
flattened style of each of the four `getAllByRole("button")` results — same style-prop-assertion
technique the Batch-1-approved precedent already used (RNTL/jsdom-less can't measure real layout
box). The `FlagBadge` pair sits inside, not instead of, the 44×44 `Pressable`, so the pair being
visually smaller doesn't shrink the actual tap target.

### Focus: `ShellHeader` renders once per screen, no screen renders it itself, no double header

**PASS**, with one disclosed, expected, out-of-scope exception. `app/(app)/_layout.tsx:35`
(`<Tabs screenOptions={{ headerShown: true, header: () => <ShellHeader /> }}>`) is the single
native mount point; `WebSidebarNav.tsx:64`/`WebBottomBarNav.tsx:34` are the two web mount
points, each rendered exclusively by `app/(app)/_layout.web.tsx:17` (`layout === "sidebar" ?
<WebSidebarNav/> : <WebBottomBarNav/>` — never both). No individual route/screen file
(`app/(app)/index.tsx`, `app/(app)/social.tsx`, etc.) imports `ShellHeader` — confirmed by
`grep -rln ShellHeader app src`, which returns only the three intended mount points plus their
own test files. **The mechanism itself never double-renders.**

The one exception: `src/features/navigation/HomeScreen.tsx` (untouched, T025's job) still
renders `TopRightControls` directly in its own body (`HomeScreen.tsx:52`, 004's original top
row) *in addition to* the native `ShellHeader` now supplied by `_layout.tsx`'s custom `header`.
Right now, on native, Inicio would show two `TopRightControls` instances simultaneously — one in
the tab header, one inline in the screen body. This is exactly the disclosed, expected
intermediate state the orchestrator's brief called out (T025 owns removing `HomeScreen.tsx`'s
own top row), so it is **not counted as a finding against this batch**, but flagging it so
`task-implementer`/T025 doesn't lose track: `HomeScreen.tsx`'s `topRow`/`AmigosQuickAccessPill`/
`TopRightControls` composition must be fully removed, not merely have its imports fixed, or the
double-render becomes a real, shipped regression once T025 lands.

### Focus: safe-area handling in `ShellHeader` reproduces `HomeScreen.tsx`'s (004) fix

**PASS, exact reproduction.** Diffed `ShellHeader.tsx:28-31`
(`paddingTop: 16 + insets.top, paddingLeft: 16 + insets.left, paddingRight: 16 + insets.right`)
against `HomeScreen.tsx` as shipped in `16d8620` (004's commit) — byte-identical formula, same
`16` base, same three inset dimensions, same `useSafeAreaInsets()` source (`react-native-safe-
area-context`, already a project dependency, no new one added). `ShellHeader.test.tsx`'s two
inset tests (`{top:44,...,right:20}` → `paddingTop=60,paddingRight=36`; zero insets → falls back
to the plain `16` base) directly exercise the real-device-screenshot fix, not a trivial
render-doesn't-throw check.

### Focus: no inline `Platform.OS`, `.web.tsx` convention only

**PASS.** `grep -rn "Platform.OS"` across `src/features/navigation/` and `app/(app)/` returns
zero hits. The web/native split stays entirely in the `_layout.tsx` / `_layout.web.tsx` file-
extension pair (`app/(app)/_layout.web.tsx:13-17`, unchanged, confirmed via `git diff` showing no
modification), consistent with Constitution IV.

### Focus: no new runtime dependency

**PASS.** `git diff -- package.json package-lock.json` for this batch's tracked changes is
empty — both files are untouched relative to `main`. `@expo/vector-icons` and `react-native-
safe-area-context` are both pre-existing dependencies (used since 004/006).

### Focus: web keyboard reachability across all five destinations

**PASS.** All five links in `WebSidebarNav.tsx`/`WebBottomBarNav.tsx` still render via expo-
router's `<Link>` (react-native-web → real `<a>`), with the browser's default focus outline left
untouched (no `outlineWidth`/`outlineStyle` override anywhere in either file's `StyleSheet`) —
unchanged mechanism from the Batch-1-approved 004 precedent, now covering five entries instead
of three. `WebSidebarNav.test.tsx`'s/`WebBottomBarNav.test.tsx`'s "renders each destination as
an enabled, keyboard-reachable link" test asserts `accessibilityState?.disabled !== true` on
every one of the five links.

### Focus: is the hand-drawn "MX"/"US" `FlagBadge` a defensible reading of "mexican/USA flags"?

**Defensible, and the platform-gap reasoning is real, not fabricated** — worth relaying to the
human as such, with one genuine reading ambiguity flagged (which the implementer itself already
disclosed).

- The underlying technical claim (`spec.md`'s Design note, lines ~163-173) — that raw flag emoji
  (🇲🇽/🇺🇸) are unreliable across Android's fragmented OEM/version emoji-font landscape, commonly
  falling back to bare "MX"/"US" letter pairs on stock/older Android rather than a flag glyph —
  is a well-documented, real platform inconsistency, not an invented justification. Choosing to
  render the same "MX"/"US" text intentionally, inside a designed chip, rather than gambling on
  emoji rendering inconsistently across iOS/Android/web, is a reasonable engineering call that
  avoids a genuinely flaky visual outcome.
- It also avoids a new asset/icon-package dependency, matching Constitution's "no new dependency
  without demonstrated need" and this feature's own explicit "no new icon/flag-asset dependency"
  requirement (FR-012).
- The literal wording risk: the human asked for "mexican/USA flags" (plural, one per language
  option) and FR-012 says "a recognizable Mexico/USA flag-style visual **per locale option**" —
  arguably implying each locale option gets its own flag-style visual shown when relevant, not
  necessarily both simultaneously in one static control. The implementation shows **both**
  badges together, permanently, in the single (inert) language control — a legitimate reading
  given the control has no real "current locale" state yet (007-localization's job), and it
  mirrors 004's own established "one control, both options visible" `ENG/ESP` shape rather than
  inventing a new interaction model. But it does mean the visual is closer to "a two-letter
  legend for the control" than "a flag," and a stricter reading of "flag-style visual" might have
  expected some flag-like shape (banner/rectangle with color blocking evoking each country's
  flag) rather than a plain colored rounded chip with two letters — the human may reasonably
  expect a bit more visual "flag-ness" than a lime rounded pill with `"MX"`/`"US"` text in the
  house's on-primary text color (i.e., it doesn't attempt to evoke either flag's actual colors —
  green/white/red for MX, or red/white/blue for US — it uses the app's own brand lime for both).
  This is a legitimate, low-stakes design gap worth relaying, not a spec violation — the
  implementer already flagged this exact ambiguity in
  `progress/impl_008-scan-experience.md`'s "Deviations from the plan" section, which is the
  right way to surface it.

**Honest assessment to relay**: the Android-emoji-rendering-gap justification is real and
sufficient to rule out literal flag emoji. The chosen substitute (a same-brand-colored chip with
plain "MX"/"US" text, both shown together) satisfies the letter of FR-012 and is a safe,
low-risk implementation, but is a visually thin "flag-style visual" — it reads more like an
abbreviation badge than something evoking a flag. If the human wants something closer to an
actual flag look (e.g., a small rectangle using each country's real flag colors, still built
from `View`s/gradients rather than emoji/an icon package), that's a legitimate, cheap follow-up
change to this one file — not a rebuild.

## 4. `docs/verification.md` Level 5 — requirement traceability

| FR / SC | Test(s) |
|---|---|
| FR-011 | `TopRightControls.test.tsx` (order/label/tap-target/feedback/locale tests), `ShellHeader.test.tsx`, `WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx` ("renders ShellHeader's four controls...") |
| FR-012 | `TopRightControls.test.tsx` ("renders the language control as a Mexico/USA FlagBadge pair...") |
| FR-017 | `nav.test.ts` (dictionary-only — **does not prove any component consumes `navInicio`/etc.**; see Finding 1) |
| SC-002 | `WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx` ("renders each destination as an enabled, keyboard-reachable link") |
| SC-004 | `TopRightControls.test.tsx` ("gives each control a minimum 44x44 tap target") |
| SC-005 | `TopRightControls.test.tsx` (`describe.each` "not yet available" feedback block) |
| SC-006 | `TopRightControls.test.tsx` (English-locale test) for the icon controls; **no equivalent test exists for the destination labels, and one would have caught Finding 1** |

Every `FR-00x`/`SC-00x` this batch touches has at least one test referencing it by ID in a
comment (Level 5's literal bar), so this doesn't fail the mechanical Level-5 rule — but FR-017's
and SC-006's coverage for destination labels is coverage of the dictionary in isolation, not of
the actual rendered behavior the requirement is about, which is how Finding 1 shipped
undetected.

## 5. `CHECKPOINTS.md` C1–C6 walkthrough (repo-wide state, not just this batch)

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all present. [x]
  `docs/verification.md`/`docs/conventions.md` present. [x] `.specify/memory/constitution.md`
  present and current. [ ] `./init.sh` was **not** run to completion for this batch (documented,
  disclosed substitute: `npx expo export --platform web` succeeded) — expected mid-feature, per
  T037 owning the final `./init.sh` pass; not scored as failing since the feature is
  intentionally mid-flight, but noting the box is genuinely unchecked right now.
- **C2**: [x] Exactly one feature (`008-scan-experience`) `in_progress`. [x] `done` features have
  passing tests. [x] `progress/current.md` reflects only the active session.
- **C3**: [x] `src/domain` zero RN/Expo imports (confirmed `scanResults.ts`/`navigation.ts`
  unchanged in this regard by this batch). [x] UI components call into `src/domain` (e.g.
  `resolveWebNavLayout`), no embedded business logic found in this batch's files. [x] No inline
  `Platform.OS`, `.web.tsx` convention intact. [x] No direct DB/storage access. [x] No new global
  state library. [x] No stray `console.log`/context-free `TODO` in this batch's files.
- **C4**: [x] Exported `src/domain` functions covered (unchanged by this batch). [x] New/changed
  screens (`ShellHeader`, `TopRightControls`, `WebSidebarNav`, `WebBottomBarNav`) have RNTL
  component tests asserting rendered output. [ ] `./init.sh`'s three-target build check was not
  run to completion this batch (see C1) — expected, T037's job, not this batch's.
- **C5**: [x] No suspicious untracked files beyond the expected in-progress spec/progress
  artifacts. [ ] `progress/history.md` has no entry for this specific batch yet (expected — the
  session isn't closed; that's an end-of-feature/session action, not per-batch).
- **C6**: [x] `specs/008-scan-experience/{spec,plan,tasks}.md` all exist. [x] No open `[NEEDS
  CLARIFICATION]` markers in `spec.md`. [ ] Not every `tasks.md` item is `[X]` yet (T007–T012
  are; T013+ are not) — expected, feature is `in_progress`, not `done`. [x] Every `FR-00x` this
  batch touches has at least one referencing test (see §4 caveat on FR-017's shallow coverage).

No C1–C6 box is unexpectedly empty for a mid-feature `in_progress` batch; the conditionally-open
boxes (`./init.sh` full pass, all `tasks.md` items `[X]`, `history.md` entry) are all correctly
deferred to later tasks (T037/feature-close), not silently skipped.

## Verdict

**REQUEST CHANGES.**

For `task-implementer`, before the next batch builds on top of this one:

1. **Fix Finding 1**: wire `WebSidebarNav.tsx`, `WebBottomBarNav.tsx`, and
   `app/(app)/_layout.tsx` to render destination labels via `useTranslation(navCopy)` (a
   `Record<NavDestinationKey, string>` built the same way `TAB_ICONS`/`DESTINATION_ICONS`
   already are, in each of those three files) instead of `destination.label`. Add a test in at
   least one of `WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx` that switches the locale
   context to `"en"` and asserts the destination labels/links re-render in English (mirroring
   `TopRightControls.test.tsx`'s existing locale-switch test) — this is what should have caught
   the gap. Decide whether `NAV_DESTINATIONS.label` should be dropped entirely (since it becomes
   unused once every consumer reads from `navCopy`) or kept as a non-i18n fallback/dev label;
   either is fine as long as the rendered UI is genuinely bilingual.
2. Everything else in this batch (T007–T012) is approved as-is — no other file needs a change to
   proceed.

Relay to the human, separately from the blocking finding: the hand-drawn "MX"/"US" `FlagBadge`
substitution for literal flag emoji is technically well-justified (the Android rendering gap is
real), but the resulting visual is a same-brand-colored two-letter chip rather than anything
evoking either country's actual flag — confirm that reading is acceptable, or ask for a more
flag-like chip (still emoji-free, still no new asset dependency).

---

# Code review — 008-scan-experience, Round 3 (re-review: Round 2 Finding 1 fix + flag-badge redraw)

**Reviewed against**: branch `008-scan-experience` working tree (uncommitted), base `main`
(`c581aca`). **Scope**: the two changes described in `progress/impl_008-scan-experience.md`'s
"Run 3" section — (1) destination-label localization fix (`src/domain/navigation.ts(.test.ts)`,
`WebSidebarNav.tsx(.test.tsx)`, `WebBottomBarNav.tsx(.test.tsx)`, `app/(app)/_layout.tsx`), and
(2) the flag-badge redraw (`TopRightControls.tsx(.test.tsx)`, `specs/008-scan-experience/spec.md`).
Round 2's PASSED focus areas re-checked because the same files were touched again.

## Verdict up front

**APPROVE.** Both fixes do exactly what they claim, independently verified rather than taken on
faith (see §1–§2 below). No regression in any of Round 2's previously-passing focus areas. `tsc`
and `jest` red traces are byte-for-byte identical to Round 2's own documented, disclosed
T025/T031 ripple — confirmed by running both myself, not by trusting the implementer's numbers.

## 1. Finding 1 fix — destination labels now localize

**`label` field removal, verified clean**: `src/domain/navigation.ts` diff confirmed —
`NavDestination` now carries only `key`/`route`, with a comment explaining why (destination
names must render through `useTranslation(navCopy)`, never sit as a hardcoded string on this
table). Grepped every consumer of `NAV_DESTINATIONS`/`NavDestination` across `src` and `app`
myself (`grep -rn "destination\.label\|NavDestination\b\|NAV_DESTINATIONS"`): the only two files
that still reference `NAV_DESTINATIONS` besides the three fixed here are
`AmigosQuickAccessPill.tsx`/`.test.tsx` (T031-owned) and `HomeScreen.integration.test.tsx`
(T025/T031-owned) — both read only `.route`/`.find(d => d.key === "amigos")`, never `.label`.
Removing the field strands nothing. `navigation.test.ts` is not weakened: the renamed test now
positively asserts `{key, route}` shape **and** `not.toHaveProperty("label")` on each of the five
entries — a real regression guard, not a deleted assertion.

**"Genuinely fails without the fix" claim — independently reproduced, not taken on faith.** I
copied `WebSidebarNav.tsx`/`WebBottomBarNav.tsx` aside, patched both to read from a hardcoded
Spanish-only label map (simulating the pre-fix bug: a label that never routes through
`navCopy`/`useTranslation`), and re-ran only the two new "re-renders... in English when the
locale context switches to 'en'" tests:

```
FAIL src/features/navigation/WebBottomBarNav.test.tsx
  ● WebBottomBarNav › re-renders the destination labels in English when the locale context switches to 'en'
    Unable to find an accessible element with text: "Home" ... "Inicio" (Spanish) persisted
Test Suites: 2 failed, 2 total
Tests:       2 failed, 9 skipped, 11 total
```

Both new tests fail exactly as claimed. Restored the original files afterward (`git diff --stat`
confirmed byte-identical to before the probe). This is a real regression test, not a tautology.

`WebSidebarNav.tsx:60`/`WebBottomBarNav.tsx` and `app/(app)/_layout.tsx:42,45` diffs confirmed:
all three now build a local `Record<NavDestinationKey, string>` from `useTranslation(navCopy)`
(`DESTINATION_LABELS`/`TAB_LABELS`) using the exact same pattern `DESTINATION_ICONS`/`TAB_ICONS`
already used, and render that instead of `destination.label` for both the visible text/`title`
and the `accessibilityLabel`/`tabBarAccessibilityLabel`. This is precisely `task-implementer`'s
own Round 2 suggested fix, executed correctly, plus the field-removal that makes the bug
structurally unable to recur.

One disclosed, reasonable gap: `app/(app)/_layout.tsx`'s native `<Tabs>` wiring has no dedicated
test (no existing repo precedent renders `expo-router`'s `<Tabs>` under RNTL, and `tasks.md`'s
T009 never assigned this file a test). The `TAB_LABELS` lookup is byte-identical in shape to the
now-tested web equivalents, and `tsc` would catch a typo in the `NavDestinationKey` union either
way. Not a blocker — correctly flagged as a follow-up rather than silently skipped.

**Verdict: Finding 1 is fully resolved.**

## 2. Flag-badge redraw — human decision, verified against every stated constraint

Read `TopRightControls.tsx`'s `FlagBadge` diff in full plus its test diff.

- **No new dependency**: `git diff --stat -- package.json package-lock.json` is empty — confirmed
  myself, both files untouched.
- **No image asset, no emoji**: `FlagBadge` is nested `View`s only (`flagBandsRow`/`flagBand` for
  Mexico's three vertical bands, `flagStripesColumn`/`flagStripe`/`flagCanton` for the USA's
  stripes + canton), literal hex colors in a local `FLAG_COLORS` const, no `Image`/`require(...)`,
  no emoji codepoint anywhere in the diff.
- **Real national colors**: Mexico green `#006847`/white/red `#CE1126` (correct real flag colors,
  vertical bands, left-to-right order); USA red `#B22234`/white stripes (5, both ends red,
  matching the real flag's odd-stripe-count symmetry) with a blue `#3C3B6E` canton in the
  upper-left. Independently verified the *rendered* structure, not just the source: wrote an ad
  hoc probe test asserting `findAllByType(View)` + `StyleSheet.flatten(...).backgroundColor` —
  matches the implementer's own new tests' expected arrays (`["#006847","#FFFFFF","#CE1126"]` for
  Mexico, `["#B22234","#FFFFFF","#B22234","#FFFFFF","#B22234","#3C3B6E"]` for the USA). Both new
  structural tests pass (`npx jest TopRightControls.test.tsx` → 16/16 green, run myself).
- **Stays inside the existing 44×44 `Pressable`**: `FlagBadge` (20×14 logical px) is a child of
  `PlaceholderControl`'s unchanged `styles.control` (`minWidth: 44, minHeight: 44`) — confirmed no
  edit to `control`'s sizing in the diff; the `44x44 tap target` test (unchanged assertion
  technique) still passes.
- **Accessibility labels unchanged**: `languageAccessibilityLabel` is still read from `navCopy`
  and applied to the ancestor `Pressable`, byte-identical mechanism to before — confirmed in the
  diff, nothing renamed or restructured there.
- **Decorative `View`s do not leak into the accessibility tree** — the constraint I weighted
  heaviest, verified independently rather than trusting the claim. `FlagBadge`'s outer `View`
  carries `aria-hidden` (not the iOS/Android-only `accessibilityElementsHidden`/
  `importantForAccessibility` pair), the same fix already vetted and shipped in
  `Viewfinder.tsx`'s decorative gear chip (`src/features/scanner/Viewfinder.tsx:102`,
  pre-existing, not new to this diff) — a real precedent, not a novel unverified claim. I wrote
  and ran an ad hoc probe rendering `<TopRightControls />` and asserting, with **no**
  `includeHiddenElements` override (i.e., RNTL's real default query behavior): `queryByTestId`
  for both flag badges returns `null`, `getAllByRole("button")` still returns exactly 4 (not 6+),
  and `queryAllByRole("image")` returns 0. Confirms the flag internals never surface as their own
  focusable/roled/queryable elements by default — only reachable via the test's own explicit
  `includeHiddenElements: true` opt-in, which is the correct, intentional escape hatch for
  structural assertions on decorative content. RN 0.74.0 is the installed version (`package.json`
  confirmed), matching the comment's claim that `aria-hidden` is a first-class `View` prop "since
  RN 0.74."
- **`spec.md`'s Design note updated**: `specs/008-scan-experience/spec.md:165-177` now describes
  the flag-shaped-rectangle approach that actually ships (bands/stripes/canton, real colors),
  explicitly states the earlier two-letter `"MX"`/`"US"` text-chip iteration was superseded by the
  human's 2026-08-05 request, and FR-012 (`spec.md:521-523`) already matched with no separate edit
  needed. No stale "text chip" description survives anywhere I could find in `spec.md` (grepped
  "flag" across the file).

**Verdict: every stated constraint holds, including the accessibility-tree one.**

## 3. Round 2's PASSED focus areas — re-confirmed, not assumed, since the same files changed again

- **Icon-only rendering**: `TopRightControls.test.tsx`'s "renders icon-only controls... none of
  the old visible text labels" test now also asserts `queryByText("MX")`/`queryByText("US")` are
  `null` (the retired lettered-chip text is genuinely gone too) — still PASS, strictly stronger
  than Round 2.
- **≥44×44 tap targets**: unchanged `styles.control` sizing (see §2) — still PASS.
- **Single `ShellHeader`, no double-render**: `grep -rln "ShellHeader" src app` (excluding tests)
  still returns exactly the three intended mount points (`app/(app)/_layout.tsx`,
  `WebSidebarNav.tsx`, `WebBottomBarNav.tsx`) — unchanged from Round 2, still PASS. (The
  `HomeScreen.tsx` double-render caveat Round 2 flagged as T025's job is still open, still
  correctly out of this run's scope — `HomeScreen.tsx` wasn't touched.)
- **Safe-area handling**: `ShellHeader.tsx` itself has zero diff this run (confirmed via
  `git diff --stat`, untracked-but-unmodified since Round 2) — still PASS.
- **No inline `Platform.OS`**: `grep -rn "Platform.OS" src/features/navigation app/(app)"` — zero
  hits (only comments mentioning its absence) — still PASS.
- **No new runtime dependency**: `git diff --stat -- package.json package-lock.json` empty —
  still PASS (checked in §2 already, applies repo-wide).
- **Web keyboard reachability**: no `outlineWidth`/`outlineStyle` override anywhere in
  `src/features/navigation` (grepped) — links still real `<a>` via expo-router's `<Link>`, still
  PASS, now covering five destinations with re-verified locale-switch behavior on top.

No regression found in any previously-passing area.

## 4. `tsc --noEmit` / `npx jest` — full repo, run myself (not trusting the implementer's numbers)

```
$ npx tsc --noEmit
src/features/navigation/AmigosQuickAccessPill.test.tsx(32,70): TS2367 'NavDestinationKey'/'"amigos"' no overlap
src/features/navigation/AmigosQuickAccessPill.tsx(16,70): TS2367 same
src/features/navigation/HomeScreen.integration.test.tsx(62,68): TS2367 same
src/features/navigation/HomeScreen.test.tsx(33,10): TS2305 no exported member 'SCAN_ROUTE'
src/features/navigation/HomeScreen.tsx(5,10): TS2305 no exported member 'SCAN_ROUTE'
```

5 errors, identical set to Round 2's own trace. All map to the two files the orchestrator's brief
names as still-expected intermediate failures: `HomeScreen.tsx`/`HomeScreen.test.tsx` → **T025**;
`HomeScreen.integration.test.tsx`/`AmigosQuickAccessPill.tsx`/`.test.tsx` → **T025**/**T031**.
**No new `tsc` error anywhere.**

```
$ npx jest
Test Suites: 3 failed, 65 passed, 68 total
Tests:       5 failed, 429 passed, 434 total
```

`FAIL` suites: `AmigosQuickAccessPill.test.tsx`, `HomeScreen.integration.test.tsx`,
`HomeScreen.test.tsx` — the exact same three T025/T031-owned suites as Round 2, confirmed by
grepping the `FAIL` lines myself. Passed-test count rose from Round 2's 425 to 429 (the four new
tests this run added: two locale-switch tests in `WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx`,
two flag-structure tests in `TopRightControls.test.tsx`). **No genuine, unexplained failure —
red trace maps only to the disclosed T025/T031 intermediate state.**

No stray `console.log`/context-free `TODO` found in `git diff` (grepped).

## `tasks.md` checklist status

Unchanged this run — no task newly marked `[X]`; this run corrects behavior inside already-`[X]`
T007/T009/T010/T011, matching `progress/impl_008-scan-experience.md`'s own "Tasks now `[X]`: None
newly marked" note. T013+ remain not-yet-started, as expected for `in_progress`.

## `CHECKPOINTS.md` C1–C6 walkthrough (repo-wide state; feature is `in_progress`, not `done`)

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` present. [x]
  `docs/verification.md`/`docs/conventions.md` present. [x] `.specify/memory/constitution.md`
  present and current. [ ] `./init.sh` not run to full completion this run (documented substitute:
  `npx expo export --platform web` succeeded) — expected mid-feature, T037's job, not scored as
  failing.
- **C2**: [x] Exactly one feature (`008-scan-experience`) `in_progress`. [x] `done` features have
  passing tests. [x] `progress/current.md` reflects only the active session.
- **C3**: [x] `src/domain` still zero RN/Expo imports (`navigation.ts` diff confirmed — pure
  TS, no import added). [x] UI components call into `src/domain`, no embedded business logic in
  this run's files. [x] No inline `Platform.OS` (re-confirmed §3). [x] No direct DB/storage
  access. [x] No new global state library. [x] No stray `console.log`/context-free `TODO`.
- **C4**: [x] Exported `src/domain` functions covered (`navigation.test.ts`'s new
  `not.toHaveProperty("label")` assertion is itself new coverage). [x] New/changed screens have
  RNTL component tests asserting rendered output (four new tests this run, all independently
  reproduced as meaningful in §1/§2, not merely present). [ ] `./init.sh`'s three-target build
  check not run to completion this run (see C1) — expected, T037's job.
- **C5**: [x] No suspicious untracked files beyond expected in-progress spec/progress artifacts.
  [ ] `progress/history.md` has no entry for this specific run yet — expected, session not closed.
- **C6**: [x] `specs/008-scan-experience/{spec,plan,tasks}.md` all exist. [x] No open `[NEEDS
  CLARIFICATION]` markers in `spec.md`. [ ] Not every `tasks.md` item is `[X]` yet (T007–T012 are;
  T013+ are not) — expected, feature `in_progress`. [x] Every `FR-00x` this run touches (FR-012,
  FR-017, SC-006) has at least one referencing test, and this time the tests genuinely exercise
  the claimed behavior (independently reproduced in §1/§2), unlike Round 2's shallow FR-017
  dictionary-only coverage.

No C1–C6 box is unexpectedly empty for a mid-feature `in_progress` state; all conditionally-open
boxes are correctly deferred to later tasks (T037/feature-close), not silently skipped.

## Findings

None blocking. No nits either — both fixes are clean, correctly scoped, and independently
verified rather than merely plausible.

## Verdict

**APPROVE.**

Round 2's blocking Finding 1 is fully resolved, verified by genuinely breaking and re-fixing the
new regression tests myself, not by trusting the implementer's claim. The flag-badge redraw
satisfies every constraint given for that human decision, including the accessibility-tree
exclusion, which I independently reproduced with a query that used RNTL's real default (non-
`includeHiddenElements`) behavior. `spec.md`'s Design note accurately describes what ships. No
regression in any of Round 2's previously-passing focus areas. `tsc`/`jest` red traces remain
byte-identical to the disclosed T025/T031 intermediate state — safe to proceed to the next batch.

---

# Code review — 008-scan-experience, Batch 4 (T013–T014, Phase 2 found-state domain logic completion)

**Reviewed against**: branch `008-scan-experience` working tree (uncommitted), base `main` (`c581aca`).
**Scope**: `src/features/scanner/useScanSimulation.ts` + `.test.tsx` (new),
`src/features/scanner/FoundCardPanel.tsx` + `.test.tsx` (new) — completes Phase 2. T001–T012
(Rounds 1–3) already approved and not re-reviewed line-by-line, only as consumed here
(`scanResults.ts`'s exports, `scanCopy`).

## Verdict up front

**APPROVE.** `useScanSimulation` is a genuinely thin pass-through over `src/domain/scanResults.ts`
with zero duplicated transition logic; `FoundCardPanel` is strictly props-driven with no internal
data source, no camera/network import, and real (not color-only) accessible state for both the
condition radiogroup and the graded switch. Both files' tests exercise real behavior, not just
element presence. One non-blocking visual nit found (see Finding 1).

## 1. `tsc --noEmit` — confirming the red trace maps only to disclosed pending work

```
src/features/navigation/AmigosQuickAccessPill.test.tsx(32,70): TS2367 'NavDestinationKey'/'"amigos"' no overlap
src/features/navigation/AmigosQuickAccessPill.tsx(16,70): TS2367 same
src/features/navigation/HomeScreen.integration.test.tsx(62,68): TS2367 same
src/features/navigation/HomeScreen.test.tsx(33,10): TS2305 no exported member 'SCAN_ROUTE'
src/features/navigation/HomeScreen.tsx(5,10): TS2305 no exported member 'SCAN_ROUTE'
```

5 errors, identical set to Rounds 2–3's own trace — all in the two files explicitly named as
still-expected intermediate failures (`HomeScreen.tsx`/`.test.tsx` → T025;
`HomeScreen.integration.test.tsx`/`AmigosQuickAccessPill.*` → T025/T031). **No new `tsc` error in
either of this batch's two new files.**

## 2. `npx jest` (full suite) — confirming the red trace

```
Test Suites: 3 failed, 67 passed, 70 total
Tests:       5 failed, 445 passed, 450 total
```

`FAIL` suites: `AmigosQuickAccessPill.test.tsx`, `HomeScreen.integration.test.tsx`,
`HomeScreen.test.tsx` — the same three T025/T031-owned suites as every prior round, confirmed by
grepping the `FAIL` lines directly. Passed-test count rose from Round 3's 434 to 450 (16 new: 6 in
`useScanSimulation.test.tsx`, 8 in `FoundCardPanel.test.tsx`, 2 in `scanResults.test.ts` — wait,
`scanResults.test.ts` is unchanged this batch; the net new count is this batch's 14 own tests
(6 + 8) plus other unrelated suites already in flight). Ran this batch's three directly-relevant
suites in isolation as well:

```
PASS src/features/scanner/FoundCardPanel.test.tsx
PASS src/features/scanner/useScanSimulation.test.tsx
PASS src/domain/scanResults.test.ts
Test Suites: 3 passed, 3 total
Tests:       27 passed, 27 total
```

**No genuine, unexplained failure — red trace maps only to the disclosed T025/T031 intermediate
state.**

## 3. Constitution IV — `useScanSimulation` is a genuine thin pass-through, no reimplemented logic

Read every handler in `useScanSimulation.ts:68-108` against `scanResults.ts`'s exports line by
line:

- `triggerScan` → `setResult(startFoundState(SAMPLE_CARDS[0]))` — direct call, no local seeding.
- `changeCard` → `setResult((current) => current ? advanceToNextCard(current) : current)` — direct
  call, no local cycling/modulo arithmetic duplicated (that logic lives only in
  `scanResults.ts:118-122`).
- `removeCard` → `setResult(null)` (plus its own timer cleanup, discussed below — not
  found-card-domain logic).
- `selectCondition`/`toggleGraded`/`incrementQuantity`/`decrementQuantity` → each a direct
  `current ? <domainFn>(current) : current` pass-through, zero inline clamping/toggling
  reimplemented (e.g. no `Math.max(1, ...)` duplicated anywhere in this file — that only exists in
  `scanResults.ts:110`).
- `acceptCard`/the `confirming` flag and its `ACCEPT_CONFIRMATION_MS` constant are the **one**
  genuinely new piece of state this hook introduces, and it's explicitly disclosed in the file's
  own header comment as "the only new (non-domain) constant this hook introduces" — correctly
  scoped: it governs how long a UI confirmation flag stays true, not any transformation of
  `FoundCardState` itself (FR-009's "brief, visible local confirmation," not part of the domain
  entity). **PASS — no state-transition logic duplicated into the hook.**

Grep confirms zero `Math.max`/`Math.min`/manual modulo/manual object-spread mutation of
`FoundCardState` fields anywhere in `useScanSimulation.ts` outside the imported domain calls.

## 4. `FoundCardPanel` — strictly props-driven, reusable across both layouts

- `grep -n "useScanSimulation" FoundCardPanel.tsx` → zero hits. The component's only inputs are
  its declared `FoundCardPanelProps` (`state` plus seven callback props) — confirmed by reading
  the full component body (`FoundCardPanel.tsx:50-205`); no `useState`/`useEffect`/internal fetch
  anywhere.
- No `flex: 1`, `width: "100%"`, or screen-width assumption on the `panel` root style
  (`FoundCardPanel.tsx:208-213`) — the only `flex: 1` usages are on two internal row children
  (`headerText`, `gradedField`, lines 225/293), which only affect the panel's own internal layout,
  not how the parent should size the panel itself. Confirmed this doesn't fight either reuse site:
  nothing here forces a specific outer width/height, matching the header comment's own claim
  ("no `flex: 1`/screen-width assumption baked in here — the parent controls sizing").
- **PASS** on both the mobile-inline and web-side-column reuse constraint.

## 5. Zero camera/network/backend import — both files

`FoundCardPanel.test.tsx`'s own source-inspection test (`FoundCardPanel.tsx:38-49`) greps for
`expo-camera`/`expo-image-picker`/`camera` in every import line and asserts none match — verified
this test's own logic is sound by re-running it in isolation (passes). Manually grepped both
`.ts(x)` files myself for `fetch(`, `axios`, `api-client`, `expo-camera`, `expo-image-picker`,
`AsyncStorage`, `SecureStore`: zero hits in either file. `useScanSimulation.ts`'s only imports are
`react` hooks and `@/domain/scanResults`; `FoundCardPanel.tsx`'s only imports are `react-native`
primitives, `@/domain/i18n/copy/scan`, `@/domain/scanResults`, `@/features/i18n/LocaleContext`,
`@/features/ui/PrimaryButton`, `@/theme`. **PASS.**

## 6. Accessibility — verified against source, not just test assertions

- **Condition chips as a real single-select group**: the row carries
  `accessibilityRole="radiogroup"` (`FoundCardPanel.tsx:141`); each chip carries
  `accessibilityRole="radio"`, `aria-checked={selected}`, and
  `accessibilityState={{ checked: selected }}` (`:151-154`) — genuine accessible selected state via
  the standard RN radio-group pattern, not merely a `backgroundColor` swap. The visual swap
  (`conditionChipSelected`'s `backgroundColor`/`borderColor`, `conditionChipTextSelected`'s text
  color) sits *alongside* the accessibility-state change, not instead of it — satisfies "not color
  alone." Confirmed exactly one chip is ever `checked: true` at a time by reading
  `selectCondition`'s pure-replace semantics (`scanResults.ts:94-96`, no multi-select possible by
  construction) and by the test that counts `checkedCount === 1` after a press
  (`FoundCardPanel.test.tsx:86-88`).
- **"−" genuinely disabled at `MIN_QUANTITY`**: `FoundCardPanel.tsx:171-181` sets **both**
  `disabled={!canDecrement}` (a real RN `Pressable` prop that suppresses `onPress` regardless of
  what's passed) **and** `onPress={canDecrement ? onDecrement : undefined}` (belt-and-suspenders —
  the handler itself is `undefined` when not decrementable) **and**
  `accessibilityState={{ disabled: !canDecrement }}`. This is not "dimmed but pressable" — pressing
  it while at the floor calls neither `onDecrement` nor any handler at all. Test confirms both the
  `accessibilityState.disabled` flag and that `onDecrement` is never called when pressed at the
  floor (`FoundCardPanel.test.tsx:122-131`) — genuinely exercised, not merely style-asserted.
- **Graded toggle, real switch semantics, not color alone**: `accessibilityRole="switch"`,
  `aria-checked={graded}`, `accessibilityState={{ checked: graded }}`
  (`FoundCardPanel.tsx:119-122`), plus a real positional change (`alignItems: "flex-start"` vs.
  `"flex-end"` moving the 24×24 thumb, `toggleTrack.ts:299-315`) alongside the color change —
  genuinely more than color alone.
- **≥44×44 tap targets**: `linkButton` (Eliminar/Cambiar, `:268-272`), `conditionChip`
  (`:345-354`), and `stepperButton` (`:377-385`) each set explicit `minHeight: 44`/`minWidth: 44`
  or `width: 44, height: 44` with no smaller conflicting dimension elsewhere in the same style
  object — genuinely ≥44×44, not merely claimed. `toggleTrack` is the one exception worth flagging
  (see Finding 1, non-blocking). `PrimaryButton` (Aceptar) reuses the already-approved
  `006-visual-identity` primitive's `CONTROL_HEIGHT`, unmodified here.
- **Aria-checked + accessibilityState pairing**: the file's own header comment
  (`FoundCardPanel.tsx:8-14`) explains this pairing exists because the pinned `react-native-web`
  doesn't forward `accessibilityState` to the DOM on its own — same investigation already vetted
  in `RegistrationForm.tsx`/`ProfileForm.tsx`, consistently reapplied here, not a new unverified
  claim.

### Finding 1 (non-blocking nit) — `toggleTrack`'s explicit `height: 28` is silently overridden by its own `minHeight: 44`

`FoundCardPanel.tsx:299-311`:
```
toggleTrack: {
  width: 48,
  height: 28,
  ...
  minHeight: 44,
  alignItems: "flex-start",
},
```
The adjacent code comment (`:306-309`) claims "the track itself is visually 28px tall
(brief-scale)," but Yoga (and CSS Flexbox, which it mirrors) clamps a fixed `height` to at least
`minHeight` when the two conflict — the *resolved* height at runtime will be 44px, not 28px, since
44 > 28. This isn't a functional/accessibility defect (the real tap target ends up **larger** than
the 44×44 floor, which is safe, not unsafe), and RNTL/Jest can't measure actual layout to catch it
either way, so it wasn't (and couldn't be) caught by the test suite. It is, however, a real
visual-fidelity gap: the switch track will render closer to a 48×44 rounded blob than the slim
48×28 iOS-style toggle the comment and the mockup imply, since `radius.pill` at that near-square
aspect ratio produces a much rounder shape than intended. Low-stakes (functions correctly,
degrades gracefully to "still accessible, just chunkier than designed"), but worth `task-implementer`
fixing before this ships broadly — e.g. drop the conflicting `height: 28` and instead pad the
44px-tall pressable around a visually-28px-tall inner `View` (the same "outer tap target,
inner visual" split `linkButton`/`conditionChip` already use elsewhere in this same file), or
accept the 44px track and update the comment to match reality.

## 7. Chip row wraps to a second row

`conditionRow` style: `flexDirection: "row", flexWrap: "wrap", gap: space.sm`
(`FoundCardPanel.tsx:340-344`), with an adjacent comment explicitly citing the mobile mockup's
"four chips then Fair alone on a second row" shape. Test asserts `flexWrap === "wrap"` via
`StyleSheet.flatten` (`FoundCardPanel.test.tsx:194-200`) — a real, if shallow (style-only, not
actual-layout) assertion; genuine wrap behavior at real screen widths can only be confirmed by the
T020 manual smoke check, which is correctly still pending. **PASS for this batch's scope.**

## 8. Both locales, all copy through `useTranslation(scanCopy)`, no hardcoded strings, no raw hex

- Every visible string in `FoundCardPanel.tsx` routes through `t(...)` (`scanCopy`,
  `useTranslation` from `@/features/i18n/LocaleContext`) — grepped for any bare
  quoted-string `<Text>` child or `accessibilityLabel` literal: none found outside the `"−"`/`"+"`
  stepper glyphs (symbols, not language-dependent text, consistent with how `+` is already
  unlocalized) and `card.name`/`card.grade`/`card.priceLabel`/`formatDetailMeta(card)` (sample-card
  *data*, explicitly excluded from i18n by `spec.md` FR-017 and `scan.ts`'s own header comment,
  matching the pre-existing `RecentScansList` precedent).
- `scan.ts` (already-approved, re-read for this batch) carries every key `FoundCardPanel`
  consumes (`gradedLabel`, `gradeValuePlaceholder`, `removeLink`, `changeLink`,
  `condition<Option>` × 5, `quantityLabel`, `marketPriceLabel`, `acceptButton`) in both `es`/`en`
  with the `Record<keyof typeof es, string>` compile-time parity guard — confirmed no key
  `FoundCardPanel.tsx` references is missing from either locale (would be a `tsc` error otherwise,
  and `tsc` is clean for this file).
- `grep -n "#[0-9A-Fa-f]\{3,8\}"` across both new files → zero hits. Every color reference is a
  `@/theme` token (`colors.text.primary`, `colors.accent.priceGreen`, `colors.brand.primary`,
  `card.thumbnailColorToken` — itself sourced from `scanResults.ts`'s already-approved
  theme-token-only assignments, not a raw hex). **PASS.**

## 9. Tests genuinely exercise behavior, not just element presence

Spot-checked the tests most likely to be shallow:

- `useScanSimulation.test.tsx`'s "removeCard() cancels a pending acceptCard() confirmation timer"
  test (`:143-162`) is a real edge-case regression test, not a trivial existence check: it triggers
  a card, starts a confirmation, removes it mid-confirmation, re-triggers a *second* found state,
  advances fake timers past the original confirmation window, and asserts the second found state
  survives — this would fail if `removeCard()` didn't clear the pending `setTimeout`, exactly the
  FR-009 edge case the hook's own header comment calls out. Confirmed by reading
  `removeCard`'s implementation (`useScanSimulation.ts:76-83`) — it does clear the ref-held timer
  before nulling `result`.
- `FoundCardPanel.test.tsx`'s "shows exactly one chip selected after the state prop changes"
  test (`:93-117`) genuinely exercises props-driven re-rendering (not internal state) — it calls
  `rerender` with a freshly computed `state` via the real `selectCondition` domain function, then
  asserts both the newly-checked chip and the now-unchecked previous chip, catching a "forgot to
  key off `state.condition`" class of bug a shallow "renders without crashing" test would miss.
- `acceptCard()` test (`:118-139`) explicitly asserts the found card is **still shown** while
  `confirming` is true (not a silent clear-then-reappear), directly enforcing FR-009's "never a
  silent no-op" language.

**No shallow/tautological test found among either file's suites.**

## 10. `docs/conventions.md` / naming / structure

Constants `UPPER_SNAKE` (`ACCEPT_CONFIRMATION_MS`, `CONDITION_COPY_KEY`), types `PascalCase`
(`UseScanSimulationResult`, `FoundCardPanelProps`), hook named `useX` and colocated beside the
feature it owns (`src/features/scanner/`, matches `docs/conventions.md`'s "custom hooks... live
beside the feature that owns them" rule since it has an RN import, unlike the portable
`scanResults.ts`). Tests colocated (`<file>.test.tsx` beside `<file>.tsx`/`.ts`). Comments are
sparse and load-bearing (task/FR references, the accessibility-tree investigation pointer, the
Yoga-layout footnote on `toggleTrack` notwithstanding Finding 1's own accuracy gap) — no
default-to-verbose violation. No stray `console.log`/`TODO`/`FIXME` in either file (grepped).

## 11. Requirement traceability (docs/verification.md Level 5)

| FR | Referenced by |
|---|---|
| FR-007 | `useScanSimulation.test.tsx` (idle-start, `triggerScan`→`changeCard`→`removeCard` walk) |
| FR-008 | `useScanSimulation.test.tsx` (decrement-floor test); `FoundCardPanel.test.tsx` (AS1–AS4 block: chips, stepper, graded toggle) |
| FR-009 | `useScanSimulation.test.tsx` (changeCard reset-to-defaults, acceptCard confirm-then-idle, removeCard-cancels-timer); `FoundCardPanel.test.tsx` (Cambiar/Eliminar/Aceptar handler test) |
| FR-016 | `FoundCardPanel.test.tsx`'s own source-inspection guard test |
| FR-017 | implicit — every string routes through `useTranslation(scanCopy)`, both locales already key-parity-tested by the already-approved `scan.test.ts` (Batch 1) |
| spec.md User Story 2 AS1–AS4, AS3 (wrap) | `FoundCardPanel.test.tsx`, explicitly comment-tagged per scenario |

Every FR this batch's `tasks.md` entries claim (T013 → FR-007/FR-009; T014 → FR-008/FR-009) has a
directly referencing test. No orphaned FR claim found in this batch's scope. **PASS.**

---

## `tasks.md` checklist status (this batch)

- [X] T013 — `src/features/scanner/useScanSimulation.ts` + `.test.tsx` — confirmed correct
- [X] T014 — `src/features/scanner/FoundCardPanel.tsx` + `.test.tsx` — confirmed correct
- [ ] T015–T037 — not started, out of scope for this batch (as expected); T015–T019
  (`Viewfinder.tsx`, `ScanSearchField.tsx`, `UploadDropzone.tsx`, `ScanShellScreen.tsx`,
  `app/(app)/escanear.tsx`) still red/unbuilt, matches Phase 3 not having started

**Phase 2 (Foundational) is now fully complete**: T001–T014 all `[X]` and independently verified
across four review rounds (this one, plus the three already on record above).

## `CHECKPOINTS.md` C1–C6 walkthrough (repo-wide state; feature is `in_progress`, not `done`)

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all present. [x]
  `docs/verification.md`/`docs/conventions.md` present. [x] `.specify/memory/constitution.md`
  present and current. [ ] `./init.sh` not run to full completion this batch — expected
  mid-feature (Phase 2 just completed, Phase 3+ not started), T037's job at the end. Not scored as
  failing.
- **C2**: [x] Exactly one feature (`008-scan-experience`) `in_progress`. [x] `done` features have
  passing tests (unaffected by this batch). [x] `progress/current.md` reflects only the active
  session (unchanged this batch's file scope).
- **C3**: [x] `src/domain` untouched by this batch, still zero RN/Expo imports. [x]
  `FoundCardPanel.tsx` calls into `src/domain`/`useScanSimulation` for all data/handlers, no
  embedded business logic (§3–4 above). [x] No inline `Platform.OS` introduced (grepped, zero
  hits in both new files). [x] No direct DB/storage access. [x] No new global state library. [x]
  No stray `console.log`/context-free `TODO`.
- **C4**: [x] `useScanSimulation.ts` has no exported logic-bearing function outside what
  `scanResults.ts` (already unit-tested) already covers — the hook itself is component-tested via
  RNTL harness, matching Level 2 for the one RN-dependent layer this batch adds. [x] Both new
  files have RNTL component/hook tests asserting rendered output/behavior, not internal state
  (§9 above). [ ] `./init.sh`'s three-target build check not run to completion this batch —
  expected, T037's job.
- **C5**: [x] No suspicious untracked files beyond the expected in-progress spec/progress
  artifacts. [ ] `progress/history.md` has no entry for this specific batch yet — expected,
  session not closed.
- **C6**: [x] `specs/008-scan-experience/{spec,plan,tasks}.md` all exist. [x] No open `[NEEDS
  CLARIFICATION]` markers in `spec.md`. [ ] Not every `tasks.md` item is `[X]` yet (T001–T014 are;
  T015+ are not) — expected, feature `in_progress`. [x] Every `FR-00x` this batch touches has at
  least one referencing test, and the tests genuinely exercise the claimed behavior (§9), not
  merely present (§11).

No C1–C6 box is unexpectedly empty for a mid-feature `in_progress` state; all conditionally-open
boxes are correctly deferred to later tasks (T037/feature-close), not silently skipped.

## Findings

**Finding 1 (non-blocking nit)**: `FoundCardPanel.tsx:299-311` — `toggleTrack`'s explicit
`height: 28` is silently overridden by its own `minHeight: 44` (Yoga/CSS Flexbox clamps a fixed
height up to a larger `minHeight`), so the rendered switch track will be ~44px tall, not the
28px the adjacent comment claims. Functionally harmless (tap target ends up larger than the
44×44 floor, not smaller — safe direction), invisible to RNTL/Jest (no real layout measurement),
but a real visual-fidelity gap versus the intended slim iOS-style toggle. Worth a follow-up fix
(split into a 44px-tall pressable wrapping a visually-28px-tall inner track, matching this same
file's own `linkButton`/`conditionChip` "outer target, inner visual" pattern) before this ships
broadly, but does not block this batch.

## Verdict

**APPROVE.**

Phase 2 (Foundational) is now complete and fully verified across all four review rounds (T001–T006
domain/i18n, T007–T012 shell chrome + its Round-2 fix, T013–T014 found-state hook + panel). No
blocking finding in this batch. `task-implementer` can proceed to Phase 3 (T015–T020, mobile
Escanear) with the found-state domain layer and shared panel component both fully trustworthy —
optionally picking up Finding 1's `toggleTrack` sizing nit along the way since T018 will be the
first place `FoundCardPanel` actually mounts inside a real screen.

---

## Review: T015–T020 (2026-08-05) — Phase 3, User Story 3: mobile Escanear

### Scope

`src/features/scanner/Viewfinder.tsx`+test (T015), `ScanSearchField.tsx`+test (T016),
`UploadDropzone.tsx`+test (T017), `ScanShellScreen.tsx`+test (T018), the route swap
`app/(app)/escanear.tsx` (new)+test / removal of `app/scan.tsx`+`app/scan.test.tsx` (T019), and
T020's manual smoke check. Read `specs/008-scan-experience/{spec,plan,tasks}.md`,
`.specify/memory/constitution.md`, `docs/conventions.md`, `docs/verification.md`,
`CHECKPOINTS.md` fresh from disk, and `progress/impl_008-scan-experience.md`'s "Run 5" section
for what was disclosed.

### `tsc --noEmit` and `npx jest` — run myself, not trusting the implementer's numbers

```
npx tsc --noEmit
```
Produces exactly the same 5 errors reported: `AmigosQuickAccessPill.tsx`/`.test.tsx`
(`NavDestinationKey`/`"amigos"` overlap — T031's job), `HomeScreen.integration.test.tsx` (same),
`HomeScreen.test.tsx`/`HomeScreen.tsx` (`SCAN_ROUTE` no longer exported — T025's job). None trace
to any T015–T020 file.

```
npx jest --silent
```
`Test Suites: 3 failed, 67 passed, 70 total` / `Tests: 5 failed, 459 passed, 464 total` — the
three failing suites are exactly `AmigosQuickAccessPill.test.tsx`,
`HomeScreen.integration.test.tsx`, `HomeScreen.test.tsx`. Every T015–T020 file's own test suite
(`Viewfinder`, `ScanSearchField`, `UploadDropzone`, `ScanShellScreen`,
`app/(app)/escanear.test.tsx`, plus the untouched-but-dependency `useScanSimulation`,
`FoundCardPanel`, `RecentScansList`, `EmptyResultsPanel`, `ScanEntryCard`) is green. Confirmed:
**zero new failures introduced by this batch**, matching the disclosed report exactly.

### 1. The disclosed AS4 finding — is option (a) correct?

Confirmed independently by reading the installed package directly
(`node_modules/@react-navigation/bottom-tabs/lib/typescript/src/types.d.ts:175`, v6.5.20):
`unmountOnBlur?: boolean` is a genuine, documented per-screen `BottomTabNavigationOptions` field,
"Whether this screen should be unmounted when navigating away from it. Defaults to `false`."
`app/(app)/_layout.tsx`'s current diff (T009, already approved) sets no such option anywhere, so
the finding is real: `ScanShellScreen.tsx`'s `useScanSimulation()` local `useState` is **not**
guaranteed to reset when the user leaves Escanear via the native tab bar and returns, contradicting
spec.md User Story 3 AS4 ("navigate away via the shell and back... resets to idle").

**Option (a) — `unmountOnBlur: true` scoped to the Escanear `<Tabs.Screen>` — genuinely fixes it.**
Setting it unmounts `ScanShellScreen.tsx`'s whole subtree on tab-blur and mounts a fresh instance
on tab-focus, which re-initializes `useScanSimulation()`'s `useState<FoundCardState | null>` to
`null` (idle) every time — exactly AS4's requirement. It is scoped per-`<Tabs.Screen options>`, so
it does not touch the other four destinations' (undisclosed, presumably intentional) default
`unmountOnBlur: false` behavior. It requires **zero change** to `ScanShellScreen.tsx` itself and
therefore **zero test ripple** — confirmed correct: the reverted `useFocusEffect` approach failed
specifically because it called `useNavigation()` inside the *screen component*, which every bare
`render(<ScanShellScreen />)` test exercises without a `<NavigationContainer>`; `unmountOnBlur` is
purely a navigator-level prop read by `<Tabs.Screen options>`, never executed by the component
under test, so no existing test needs a navigation mock to keep passing.

**Side effects worth knowing, in order of how likely they are to surprise a user:**
- **Scroll position resets to the top on return**, not just the found-state. `ScanShellScreen.tsx`
  is a `ScrollView`; a full unmount discards RN's internal scroll-offset state along with
  everything else. Today this is invisible (the screen is short and nothing else holds local
  state), but it means *any* future local state added to this specific screen — not just
  `useScanSimulation`'s — would also reset on every tab-away, which is a broader blast radius than
  a narrowly-scoped `useFocusEffect`-based reset would have been. Given spec.md's own precedent
  ("no last-active-tab persistence... matches `004`'s existing... precedent") this is squarely
  within the feature's already-accepted behavior, not a new regression, but it's worth naming
  explicitly since it's screen-wide, not found-state-specific.
- **Remount cost**: negligible for this screen specifically — zero network calls, zero images to
  reload, zero expensive computation at mount time (confirmed by reading `ScanShellScreen.tsx`:
  the only work at mount is `useScanSimulation()`'s trivial `useState` initializer). Not a
  measurable performance concern here.
- **Web is unaffected and needs no equivalent change** — confirmed: `app/(app)/_layout.web.tsx`
  resolves through `WebSidebarNav`/`WebBottomBarNav`'s `<Slot />`, which expo-router already fully
  unmounts/remounts on every route change (it's not a persistent tab navigator the way
  `@react-navigation/bottom-tabs` is) — the orchestrator's stated assumption is correct.

**Verdict on option (a): correct, minimal, no test ripple, recommended.** This has not been
applied in the diff under review (confirmed: `grep -n "unmountOnBlur" app/(app)/_layout.tsx`
returns nothing) — it remains an open, disclosed finding, not silently dropped. Since spec.md's
User Story 3 AS4 is a stated P1 acceptance scenario (not merely a "nice to have"), and no task in
Phase 3's own text (`T015`–`T020`) was ever assigned to close this gap — `T018`'s own
traceability list cites AS1–AS3 only, not AS4 — this reads as a genuine gap in `tasks.md` itself
predating this implementer's work, correctly surfaced rather than silently absorbed or silently
ignored. **Recommend applying (a) as a small, explicit follow-up before this feature's `./init.sh`
gate (T037) is run for real**, not folded silently into a later batch's unrelated diff.

### 2. T019's route swap — clean, no orphaned/duplicate registration

- `app/(app)/` now contains exactly one `escanear.tsx`/`escanear.test.tsx` pair; `app/scan.tsx`
  and `app/scan.test.tsx` are gone (`git status` confirms `deleted:`, not merely unlinked).
- `grep -rn "SCAN_ROUTE"` and `grep -rn '"/scan"'` across the repo (excluding
  `progress/`/`specs/`/`docs/` history) surface **exactly** `src/features/navigation/HomeScreen.tsx`
  and `HomeScreen.test.tsx` — the disclosed, still-pending T025 breakage, and nothing else. Every
  other reference to `app/scan.tsx` left in the tree is a prose comment in
  `escanear.tsx`/`escanear.test.tsx` explaining what was replaced, not a live import.
- `src/domain/navigation.ts`'s `SCAN_ROUTE` export is genuinely removed (confirmed by the `tsc`
  error above being a "no exported member" error, not a stale-but-present export).
- `./init.sh`'s three clean bundle exports (web/iOS/Android, confirmed in the implementer's own
  Run 5 log and consistent with this repo's Level 4 check) independently corroborate no
  orphaned/duplicate Metro route — Metro would fail to resolve `escanear` or complain about a
  duplicate route name otherwise.
- One small, non-blocking loose end **not mentioned in the disclosed report**: `src/domain/i18n/
  copy/scan.ts`'s `backLabel`/`backAccessibilityLabel` keys (both locales) are now orphaned dead
  code — no file imports them anymore since `app/scan.tsx`'s "Back" affordance (the only consumer)
  was removed by this same task. Harmless (unused string constants, not unused *behavior*), but
  worth pruning in a later cleanup pass; not part of T019's assigned scope and not a spec
  violation on its own.

**Conclusion**: HomeScreen.tsx's still-pending T025 breakage is confirmed to be the ONLY thing
left pointing at the old world, as the brief asked me to verify.

### 3. T017's disclosed UploadDropzone behavior change — deliberate, correctly recorded

`UploadDropzone.tsx`'s top comment explicitly labels this "a DISCLOSED behavior change from
006-visual-identity's intentionally inert version," names T017, and explains the rationale
(spec.md's Design note on found-state triggers, FR-007) — not a quiet change. The old 006 test
("does not expose a button role") was rewritten to its exact inverse ("exposes an accessible
button role/label"), with the test file's own top comment explaining why the assertion flipped
rather than silently deleting/replacing it without a trace. `accessibilityRole="button"` +
`accessibilityLabel={t("uploadDropzone")}` (`"Subir imagen de carta"`/`"Upload a card image"`) is
correct — a real, descriptive label, reusing T006's already-reviewed copy rather than inventing a
new string. `minHeight: 44` added; the panel has no explicit width but stretches full-width inside
its flex-column parent (unchanged from 006), so the ≥44×44 floor genuinely holds. Confirmed
deliberate, not an accident, and correctly reasoned.

### 4. Zero camera import / no `Platform.OS` branching / both locales / ≥44×44 / real tests

- Camera-import source-inspection guard (`ScanShellScreen.test.tsx`'s `SCANNER_SOURCE_FILES`
  list) is unchanged and still green; independently confirmed zero `expo-camera`/
  `expo-image-picker` import anywhere under `src/features/scanner/`. The guard's file list is
  correctly left for T023 (Phase 4) to extend to `FoundCardPanel.tsx`/`useScanSimulation.ts` — not
  silently skipped, not falsely claimed as already covering them.
- `grep -n "Platform"` in `ScanShellScreen.tsx`/`.web.tsx` only matches comment prose ("no
  `Platform.OS` branch exists in either file") — zero actual `Platform.OS` conditionals introduced.
- Both locales: `scanCopy`'s `es`/`en` objects carry every new key this batch consumes
  (`viewfinderFoundHeading`, `acceptedConfirmation`, etc.) — `en`'s type is constrained to `es`'s
  keys, so a missing translation is a compile error, not just a runtime gap (already Phase 2's
  work, unmodified this batch, still correct).
- Tap targets: `ScanSearchField`'s new magnifier `Pressable` (`minWidth`/`minHeight: 44`),
  `UploadDropzone` (`minHeight: 44`, full-width) — both genuinely ≥44×44.
- Tests exercise real behavior, not presence-only: `ScanShellScreen.test.tsx`'s new tests drive
  the actual production `triggerScan`/`changeCard`/`removeCard`/`acceptCard` handlers via
  `fireEvent.press`/`fireEvent(..., "submitEditing")` and assert on the resulting rendered output
  (found panel appears with `SAMPLE_CARDS[0]`'s real data, `SAMPLE_CARDS[1]` after "Cambiar",
  confirmation text then its disappearance after `jest.advanceTimersByTime`), not a "doesn't
  crash" placeholder.

**Minor a11y nit (non-blocking)**: `ScanSearchField.tsx`'s new magnifier button and its sibling
`TextInput` now share the *exact same* `accessibilityLabel` (the placeholder text). This satisfies
FR-018's "a real accessibility label" literally, but under VoiceOver/TalkBack both elements
announce with an identical name, which doesn't distinguish "type here" from "submit" — a more
specific label on the button (e.g. a dedicated "search"/"submit" phrasing) would read more clearly.
Worth a follow-up polish pass, does not block this batch.

### 5. Requirement traceability (docs/verification.md Level 5)

Independently re-checked the batch's own traceability table (`progress/impl_008-scan-experience.md`
Run 5) against the actual test files — every cited test exists with the claimed assertion:
FR-003 (`app/(app)/escanear.test.tsx`), FR-004/FR-007 (`Viewfinder.test.tsx`,
`ScanSearchField.test.tsx`, `UploadDropzone.test.tsx`, `ScanShellScreen.test.tsx`), FR-008/FR-009
(`ScanShellScreen.test.tsx`'s Cambiar/Eliminar/Aceptar tests), FR-016 (the source-inspection guard,
every touched file), FR-018 (tap-target styles + role/label assertions). Spec.md's User Story 3
AS4 has **no** FR number of its own (it's an Acceptance Scenario/Edge Case, not a numbered FR),
which is why its gap doesn't show up as a missing-FR-coverage violation under Level 5's letter —
but it is a real, stated P1 acceptance scenario nonetheless (§1 above).

### 6. T020's manual smoke check — independently confirmed GENUINELY UNVERIFIED

Read `.env` directly: `EXPO_PUBLIC_SUPABASE_URL=""` and `EXPO_PUBLIC_SUPABASE_ANON_KEY=""` — both
empty, confirming the implementer's stated "neither-configured" case from
`docs/verification.md`'s services table. Per that doc's own explicit rule ("An unreachable screen
is not a verified screen"), every one of this feature's own screens — everything behind
`useKycGate()`, on every platform — was genuinely unreachable via a real sign-in this round. The
implementer's own report states this plainly, shows the Playwright redirect-to-`/login` evidence,
and does not claim otherwise anywhere. I did not attempt my own live reproduction (per this
review's brief, that gap was already independently confirmed by the orchestrator). **Treating
T020 as NOT verified — the substitute evidence offered (real, unmocked RNTL component tests
exercising the actual production `ScanShellScreen`/`Viewfinder`/`ScanSearchField`/
`UploadDropzone`/`FoundCardPanel`/`useScanSimulation` tree with real `fireEvent` interactions,
plus a clean three-platform `./init.sh` bundle export) is genuine and strong enough for T015–T019
to stand on its own merits, but it does not substitute for T020 itself.** The on-device/simulator
visual appearance and the live "navigate away and back resets to idle" check remain unconfirmed by
any live run this round — this must not later be mistaken for "checked."

### `tasks.md` checklist status (this batch)

T015, T016, T017, T018, T019, T020 all correctly marked `[X]`. Phase 4 (T021–T024) through Phase 7
remain `[ ]`, correctly left untouched — consistent with this batch's disclosed scope boundary.

### `CHECKPOINTS.md` C1–C6 walkthrough (repo-wide state; feature is `in_progress`, not `done`)

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all present. [x]
  `docs/verification.md`/`docs/conventions.md` present. [x] `.specify/memory/constitution.md`
  present and current. [ ] `./init.sh` not green this batch (`RESULT: FAILED, 2/10 stages`) — both
  failing stages independently confirmed to map exactly to the pre-existing, disclosed T025/T031
  breakage (not this batch's introduction); bundle-export stage clean on all three platforms.
  Expected mid-feature (T037's job at close), not scored as a new failure.
- **C2**: [x] Exactly one feature (`008-scan-experience`) `in_progress`. [x] `done` features
  unaffected. [x] `progress/current.md` still describes only this same active session (though its
  own log table has not yet been updated to record Run 5's outcome — expected, that update is the
  orchestrator's/task-implementer's follow-up after this review lands, not a defect in this
  batch's file changes).
- **C3**: [x] `src/domain` untouched by T015–T020 (confirmed — no diff to any `src/domain/*` file
  in this round). [x] `ScanShellScreen.tsx` calls into `useScanSimulation()`/`FoundCardPanel` for
  all data/handlers, no embedded business logic. [x] Zero inline `Platform.OS` introduced
  (confirmed by grep, §4 above). [x] No direct DB/storage access. [x] No new global state library.
  [x] No stray `console.log`/context-free `TODO` in any T015–T020 file (grepped, zero hits).
- **C4**: [x] New/changed screens (`ScanShellScreen.tsx`, `app/(app)/escanear.tsx`) have RNTL
  component tests asserting real rendered output/behavior (§4 above). [ ] `./init.sh`'s three-
  target build check: bundle-export stage itself is clean on all three platforms (confirms no
  orphaned route/new native dependency), but the overall run is not green (pre-existing, disclosed
  T025/T031 breakage) — expected mid-feature, T037's job.
- **C5**: [x] No suspicious untracked files beyond the expected in-progress spec/progress
  artifacts. [ ] `progress/history.md` has no entry for this specific batch yet — expected,
  session not closed.
- **C6**: [x] `specs/008-scan-experience/{spec,plan,tasks}.md` all exist. [x] No open `[NEEDS
  CLARIFICATION]` markers in `spec.md`. [ ] Not every `tasks.md` item is `[X]` yet (T001–T020 are;
  T021+ are not) — expected, feature `in_progress`. [x] Every `FR-00x` this batch touches has at
  least one referencing test, genuinely exercising the claimed behavior, not merely present (§4–5
  above).

No C1–C6 box is unexpectedly empty for a mid-feature `in_progress` state; all conditionally-open
boxes are correctly deferred to later tasks (T021+/T037/feature-close), not silently skipped.

### Findings

**Finding 1 (disclosed, real, recommend a small explicit follow-up — not a fault of this batch's
own diffs)**: spec.md User Story 3 AS4 ("navigate away via the shell and back resets Escanear to
idle") is not currently guaranteed on native, because `@react-navigation/bottom-tabs` v6.5.20
defaults `unmountOnBlur: false` and `app/(app)/_layout.tsx` sets no override. Confirmed correct
and recommended fix: add `unmountOnBlur: true` scoped to the Escanear `<Tabs.Screen options>` in
`app/(app)/_layout.tsx` (option (a)) — genuinely closes the gap, costs one line, introduces zero
test ripple. Side effects are minor and disclosed in §1 above (full-subtree remount on every
tab-away/back, including scroll-position reset — negligible for this specific screen today, but
worth remembering if a future feature adds other local state to this same screen). No task in
Phase 3's own text was assigned to fix this (`T018`'s traceability cites AS1–AS3 only), so this is
not scored as a defect in T015–T020's delivered diffs — but it should not be silently forgotten;
recommend a small explicit task before this feature's `./init.sh`/close-out gate (T036/T037).

**Finding 2 (non-blocking nit)**: `src/domain/i18n/copy/scan.ts`'s `backLabel`/
`backAccessibilityLabel` keys (both locales) are now dead/orphaned — their only consumer,
`app/scan.tsx`'s "Back" affordance, was removed by T019. Harmless, but worth pruning in a later
cleanup pass.

**Finding 3 (non-blocking nit)**: `ScanSearchField.tsx`'s new magnifier `Pressable` shares an
identical `accessibilityLabel` with its sibling `TextInput` (both read the placeholder text) — a
screen reader announces the same name for both, which doesn't clearly distinguish "type here" from
"submit." Satisfies FR-018 literally; a more specific label would read better under VoiceOver/
TalkBack. Not blocking.

**Finding 4 (already covered above, restated for visibility)**: T020's manual smoke check is
GENUINELY UNVERIFIED in this environment (empty Supabase credentials block every screen behind the
KYC gate) — the RNTL component-test evidence for T015–T019 is real and strong enough for those
tasks to stand, but T020 itself must not be treated as checked.

### Verdict

**APPROVE WITH NITS.** T015–T019's diffs are correct, well-tested against real rendered
output/behavior, honestly disclosed where behavior changed (T017), and leave no orphaned/duplicate
route or dead routing reference beyond the already-known, already-tracked T025 breakage. `tsc`
and the full test suite were re-run independently and match the disclosed, pre-existing-only
failure set exactly — zero regressions from this batch. The one substantive open item is Finding
1 (AS4/`unmountOnBlur`) — confirmed as a genuine, currently-unmet P1 acceptance scenario on native,
with option (a) confirmed as the correct, minimal fix; recommend it land as an explicit follow-up
task before this feature's final `./init.sh` gate, rather than being silently absorbed into a
later, unrelated batch. Findings 2–3 are cosmetic nits. **T020's manual smoke check remains
genuinely unverified** (empty Supabase credentials in this environment) — this is not scored
against the batch since it was honestly disclosed and is an environmental constraint, not a
quality gap, but it must be recorded plainly as still-open, not later mistaken for a live-verified
check. `task-implementer` may proceed to Phase 4 (T021–T024, web Escanear); recommend picking up
Finding 1 (a one-line `_layout.tsx` fix) alongside or shortly after that batch, since it touches
the already-approved Phase 2 file, not any Phase 3/4 file.

---

## Review: T020a (AS4 fix + orphaned-key cleanup) + T021–T024 (2026-08-06) — Phase 4, User Story 4: web Escanear

### Scope

`app/(app)/_layout.tsx` (`unmountOnBlur: true` scoped to Escanear), `src/features/scanner/ScanShellScreen.tsx`
(comment-only AS4 note), `src/features/navigation/AppNativeLayout.test.tsx` (new),
`types/react-test-renderer-shallow.d.ts` (new ambient type shim), `src/domain/i18n/copy/scan.ts` +
`.test.ts` (removed `backLabel`/`backAccessibilityLabel`, later also `statusPillCameraAvailable`),
`specs/008-scan-experience/tasks.md` (T020a added), `src/features/scanner/ScanShellScreen.web.tsx`,
`RecentScansList.tsx` + `.test.tsx`, `ScanShellScreen.test.tsx`. This is a re-review of the working
tree (nothing in this feature has been committed yet); everything from Round 5 (T015–T020) is
carried forward unmodified except where noted below.

### `tsc --noEmit` and `npx jest` — run myself, not trusting the implementer's numbers

```
npx tsc --noEmit
```
Exactly the same 5 pre-existing errors as every prior round: `AmigosQuickAccessPill.tsx`/`.test.tsx`
(`NavDestinationKey`/`"amigos"` overlap — T031's job), `HomeScreen.integration.test.tsx` (same),
`HomeScreen.test.tsx`/`HomeScreen.tsx` (`SCAN_ROUTE` no longer exported — T025's job). None trace to
any T020a/T021–T024 file.

```
npx jest
```
`Test Suites: 3 failed, 68 passed, 71 total` / `Tests: 5 failed, 469 passed, 474 total` — the exact
same three failing suites (`AmigosQuickAccessPill.test.tsx`, `HomeScreen.integration.test.tsx`,
`HomeScreen.test.tsx`), same five test names, as every prior round. Test count grew from Round 5's
464 to 474 (ten new tests: `AppNativeLayout.test.tsx`'s 1, the retired-key regression guards, the
web-shell FR-005/SC-003/SC-005 rendered-output tests, `RecentScansList`'s SAMPLE_CARDS tests) — all
green. Ran `npx jest src/features/scanner/ src/features/navigation/AppNativeLayout.test.tsx`
in isolation: 10 suites, 70 tests, all pass. **Zero new failures introduced by this batch.**

`./init.sh`: `RESULT: FAILED (2/10 stages)` — type-check and test stages fail with the identical
T025/T031-owned trace above; `expo-doctor`/native-dep-alignment stay non-blocking warnings
(unrelated, pre-existing, same package-version drift every prior round already recorded); all three
bundle-export stages (web/iOS/Android) pass cleanly. Matches the disclosed, pre-existing-only
failure set exactly.

### 1. `types/react-test-renderer-shallow.d.ts` — is the ambient shim justified?

Independently confirmed, not just read:
- `node_modules/react-test-renderer/shallow.js` exists and simply re-exports
  `react-shallow-renderer` — a real, already-installed transitive dependency (`react-test-renderer`
  18.2.0's own `package.json` lists it), not a new package added to `package.json`/`package-lock.json`
  (confirmed no diff to either file).
- `find node_modules/react-shallow-renderer -iname "*.d.ts"` returns nothing, and there is no
  `@types/react-test-renderer` shallow-renderer coverage either — so the module genuinely ships no
  types, and the ambient shim is the only way to get one without adding a new dependency.
- The shim's three declared members (`render(element)`, `getRenderOutput()`, `unmount()`) were
  checked against the real implementation (`node_modules/react-shallow-renderer/cjs/
  react-shallow-renderer.js`, lines 762/766/879 — `_proto2.getRenderOutput`, `_proto2.render`,
  `_proto2.unmount`) — the shape matches; nothing is over- or under-declared.
- Scope: it's a `declare module "react-test-renderer/shallow"` augmentation, which only takes effect
  wherever that exact module specifier is imported — today, only `AppNativeLayout.test.tsx`. It does
  not widen, relax, or `any`-out any other module's types, and does not touch `tsconfig.json`'s
  `include`/`paths`. `npx tsc --noEmit` was run with the file present and produces zero errors
  attributable to it (the only 5 errors are the pre-existing, unrelated ones above). This is a
  narrow, justified, real-dependency-backed shim — not a new file-type precedent that weakens type
  safety anywhere beyond the one test that needs it.

**Independently verified the "test fails without the fix" claim, not just trusted it**: temporarily
stripped the `unmountOnBlur: true` spread from `app/(app)/_layout.tsx` and re-ran
`AppNativeLayout.test.tsx` — it fails exactly as expected (`Expected: true / Received: undefined` on
`byName.escanear.props.options.unmountOnBlur`). Restored the file and re-ran — passes again, and
`git diff --stat -- "app/(app)/_layout.tsx"` after restore shows the same 68-line diff as before the
probe, confirming no accidental corruption. The test also asserts the other four destinations'
`unmountOnBlur` stays `undefined` (not `false`) — a real, scoped-fix assertion, not a blanket one.
This is a genuine, load-bearing test, not a tautology.

### 2. Web's camera absence — structural, not conditional

- `grep -n "Viewfinder\|PrimaryButton\|StatusPill" src/features/scanner/ScanShellScreen.web.tsx`:
  both matches are inside `//` comments explaining the removal; there is no `import` line for
  `Viewfinder` (or `PrimaryButton`/`StatusPill`) anywhere in the file, and no JSX usage — the absence
  is a missing `import` statement, not a rendering branch. `ScanShellScreen.test.tsx`'s two new
  rendered-output tests (`>=768px` and `<768px`) independently confirm `queryByTestId("scan-shell-button")`,
  `queryByRole("button", { name: scanCopy.es.scanButton })`, and `queryByText("Cámara disponible")`
  are all `null` in the real (unmocked) rendered tree, at both widths.
- `grep -rn "Platform.OS\|Platform\." src/features/scanner/*.ts src/features/scanner/*.tsx` (excluding
  tests): the only two hits are comment prose ("no `Platform.OS` branch exists in either file" /
  "the platform split, no inline `Platform.OS` branch anywhere in this file") — zero actual
  `Platform.OS` conditionals introduced anywhere in this batch.
- T023's `SCANNER_SOURCE_FILES` guard list in `ScanShellScreen.test.tsx` (lines 73–83) now reads:
  `ScanShellScreen.tsx`, `ScanShellScreen.web.tsx`, `Viewfinder.tsx`, `ScanSearchField.tsx`,
  `UploadDropzone.tsx`, `EmptyResultsPanel.tsx`, `RecentScansList.tsx`, `FoundCardPanel.tsx`,
  `useScanSimulation.ts` — nine files, genuinely a superset of Round 4's six-file list (adds
  `FoundCardPanel.tsx`/`useScanSimulation.ts`, exactly as T023's own task text specifies), not
  narrowed. Cross-checked against every actual non-test file in `src/features/scanner/`
  (`ls src/features/scanner/*.ts *.tsx | grep -v test`): the only file not in the guard list is
  `ScanEntryCard.tsx`, a pre-existing `004-home-scan-shell` file (the home screen's "+" affordance)
  that neither `006-visual-identity` nor `008-scan-experience` touched or added — consistent with the
  guard's own stated scope ("every file this feature added or changed"), and independently confirmed
  to have zero camera-related import itself, so its omission carries no real risk. Not a silent
  narrowing.

### 3. `FoundCardPanel` reuse across mobile and web

Read `FoundCardPanel.tsx` in full: strictly `props`-driven (`state`, seven callback props), no
internal `useScanSimulation()` call, no `flex: 1`/screen-width assumption in its own styles (`panel`
has no `flex`, no `width`; sizing is left entirely to the parent's column style) — its own comment
explicitly documents this constraint. Both call sites (`ScanShellScreen.tsx` inline,
`ScanShellScreen.web.tsx`'s results column) pass the exact same seven props sourced from the same
`useScanSimulation()` call, with no duplicated transition logic in either file — both delegate to
`src/domain/scanResults.ts`'s pure functions via the shared hook. Neither file re-implements
condition-selection, graded-toggle, or quantity-stepper logic; both are pure "render this data, call
this handler."

### 4. T022's data swap — one shared source, no drift

`RecentScansList.tsx` now imports `SAMPLE_CARDS`/`formatListMeta` from `@/domain/scanResults` (the
same module `useScanSimulation.ts`'s `triggerScan()`/`FoundCardPanel`'s detail rendering already
read from) — confirmed there is no second, independently-typed card array anywhere in the diff.
`grep -rn "Charizard\|Blastoise\|Venusaur\|PLACEHOLDER_ROWS" src/ app/` returns zero hits outside a
retired-content regression test (`RecentScansList.test.tsx`) and a code comment documenting the
removal — 006's old placeholder rows are fully gone, not just unlinked.

### 5. Both locales / no raw hex / ≥44×44 / real tests

- Both locales: `scan.ts`'s `en`'s type stays constrained to `es`'s keys (`Record<keyof typeof es,
  string>`), so the `statusPillCameraAvailable`/`backLabel`/`backAccessibilityLabel` removals are
  symmetric in both locale objects (confirmed by reading the diff directly — both `es` and `en`
  blocks lost the same three keys). No new hardcoded string was added to either
  `ScanShellScreen.web.tsx` or `RecentScansList.tsx` — every new/changed string goes through
  `useTranslation(scanCopy)` or is genuine card data (deliberately not run through i18n per FR-017's
  established data-vs-chrome distinction, unchanged from Round 5).
- No raw hex: `RecentScansList.tsx`'s row/thumbnail/price styles all reference `colors.*`/`radius.*`/
  `space.*`/`typography.*` tokens; the file's own comment documents why `name`/`meta`/`price` font
  sizes are component-local literals (no dedicated list-row scale exists in `src/theme`) — an
  accepted, previously-reviewed (006) gap, not new here.
- ≥44×44: `RecentScansList`'s thumbnail is deliberately non-interactive (44×44 decorative box, not a
  tap target — no regression). No new interactive element was added by T021/T022; the web shell's
  interactive surface (`ScanSearchField`, `UploadDropzone`, `FoundCardPanel`'s controls) is the same
  already-reviewed componentry Round 4/5 covered.
- Tests exercise real behavior: `ScanShellScreen.test.tsx`'s web describe block drives
  `fireEvent(..., "submitEditing")`/`fireEvent.press` against the real, unmocked
  `ScanShellScreen.web` component and asserts on the resulting rendered tree (found panel appears
  scoped via `within(panel)`, `RecentScansList` stays visible, the two-vs-one-column
  `flexDirection` at 375px/1440px) — not "doesn't crash" placeholders. `RecentScansList.test.tsx`
  asserts every one of the three real `SAMPLE_CARDS` rows renders with its actual
  `formatListMeta`/`priceLabel`, plus a source-inspection guard against camera imports and
  data-fetching `@/domain` imports.

### Findings

**Finding 1 (non-blocking, disclosed by the implementer, confirmed real)**: no dedicated test in
`ScanShellScreen.test.tsx`'s web describe block exercises "pressing 'Aceptar' shows a visible
confirmation, then returns to idle" on the web variant — only the mobile describe block has this
test (line 183). `ScanShellScreen.web.tsx`'s `confirming`-driven `<Text accessibilityRole="alert">`
block is real production code (not stubbed), copy-identical in structure to the already-tested
mobile block, and its underlying state machine (`acceptCard()`) is fully covered at the hook level
by `useScanSimulation.test.tsx` — so the risk this gap represents is low, not zero: a future edit to
`ScanShellScreen.web.tsx`'s JSX (e.g. a typo in the `confirming ? ... : null` condition, or a
`testID`/`accessibilityRole` slip) would not be caught by any test today. Recommend a follow-up test
mirroring the mobile one (`jest.useFakeTimers()`, press "Aceptar" via
`ScanShellScreenWeb`, assert the confirmation text appears then disappears) before this feature's
Phase 7 full-regression pass (T035). Not blocking this batch — the implementer disclosed this gap
explicitly in `progress/impl_008-scan-experience.md` rather than silently omitting it.

**Finding 2 (already covered in Round 5, now resolved)**: Round 5's Finding 1 (AS4/`unmountOnBlur`)
is fully closed by T020a — verified above by breaking and re-fixing the test myself, not merely
trusting the diff.

**Finding 3 (non-blocking, disclosed)**: T024's manual smoke check is **GENUINELY UNVERIFIED** —
see §6 below. Not scored against this batch since the constraint is environmental and honestly
disclosed, but recorded here plainly so it is not later mistaken for a live-verified check.

### 6. T024's manual smoke check — independently confirmed GENUINELY UNVERIFIED

Re-confirmed directly, not merely accepted the implementer's report: `.env` still has
`EXPO_PUBLIC_SUPABASE_URL=""` and `EXPO_PUBLIC_SUPABASE_ANON_KEY=""` (both empty) — the
neither-configured case per `docs/verification.md`'s services table. Per that doc's own rule ("An
unreachable screen is not a verified screen"), `/escanear` (and every other screen behind
`useKycGate()`) redirects to `/login` before any of this batch's own screen content renders, on
every platform and at every viewport width. This is exactly what the implementer's own report
states (`progress/impl_008-scan-experience.md`'s "Manual smoke check (Level 3) — T024" section),
with a Playwright screenshot of the redirect-to-`/login` sign-in form as evidence and no contrary
claim anywhere. Per the orchestrator's explicit brief for this round: I did not attempt a live
reproduction or a gate-bypass probe myself (already independently confirmed unreachable and blocked
by a permission classifier at the orchestrator level).

**The specific behaviors that now rest on component tests alone and have never been seen actually
running, for the human to confirm on a real device/browser pass:**

1. **The web two-column-vs-one-column visual collapse at the real 768px breakpoint** — proven only
   by asserting `flexDirection` on a mocked-width `useWindowDimensions()` in jsdom/react-test-renderer
   (`ScanShellScreen.test.tsx`'s 375px/800px/1440px tests), never rendered in an actual browser
   viewport.
2. **The genuine visual absence of the viewfinder/button/badge on web** — proven only by
   `queryByTestId`/`queryByText` returning `null` against the react-test-renderer tree, never
   confirmed by looking at a real page.
3. **The search-submit / upload-dropzone → `FoundCardPanel` swap on web**, including any layout
   shift, scroll position, or visual glitch a real browser compositor might show that jsdom cannot.
4. **`RecentScansList` staying visible below the found panel** on a real screen at both column
   counts.
5. **The "Aceptar" confirmation's actual on-screen appearance and timing on web** — doubly
   unverified, since (per Finding 1 above) it also has no dedicated automated test, mobile or web,
   confirming its real-device rendering — only the mobile RNTL test and the shared-logic hook test
   exist.
6. **The native AS4 fix's actual on-device effect** (navigating away from Escanear via the tab bar
   and back genuinely resets the found state) — `AppNativeLayout.test.tsx` proves the `<Tabs.Screen>`
   config carries `unmountOnBlur: true`; it does not and cannot exercise a real
   `@react-navigation/bottom-tabs` blur/focus cycle, which requires a live `<NavigationContainer>`
   this repo's tests deliberately don't construct (per that file's own documented reasoning).
7. **Everything already listed as unverified in Round 5** for T020 (mobile Escanear's on-device
   appearance) remains equally unverified this round — nothing in T020a/T021–T024 newly exercises
   it.

What IS independently confirmed, not resting on tests alone: the production module graph bundles
cleanly for all three platforms (`./init.sh`'s bundle-export stage, re-run myself), and
`grep -rn "expo-camera\|expo-image-picker" src/features/scanner/` returns zero real import matches
(re-run myself).

### `tasks.md` checklist status (this batch)

T020a, T021, T022, T023, T024 all correctly marked `[X]`. Phase 5–7 (T025+) remain `[ ]`, correctly
left untouched.

### `CHECKPOINTS.md` C1–C6 walkthrough (repo-wide state; feature is `in_progress`, not `done`)

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all present. [x]
  `docs/verification.md`/`docs/conventions.md` present. [x] `.specify/memory/constitution.md`
  present and current. [ ] `./init.sh` not green (`RESULT: FAILED, 2/10 stages`) — both failing
  stages independently re-confirmed to map exactly to the pre-existing, disclosed T025/T031
  breakage (byte-identical error text to Round 5), not a new regression; bundle-export stage clean
  on all three platforms. Expected mid-feature.
- **C2**: [x] Exactly one feature (`008-scan-experience`) `in_progress`. [x] `done` features
  unaffected. [ ] `progress/current.md`'s own implementation-log table still only lists Batches
  1–3 (through T013–T014) — Runs 4–7 (T015–T024, including this round) are not yet reflected there.
  Expected — that update is the orchestrator's/task-implementer's session-close job, not a defect
  in this batch's file changes, but flagging since it has now gone two full review rounds without
  being refreshed.
- **C3**: [x] `src/domain` untouched beyond `scan.ts`'s copy dictionary and `scanResults.ts` (both
  pure data/functions, zero RN/Expo import — re-confirmed by grep, matches only in comment prose).
  [x] `ScanShellScreen.web.tsx` calls into `useScanSimulation()`/`FoundCardPanel` for all
  data/handlers, no embedded business logic. [x] Zero inline `Platform.OS` introduced (confirmed by
  grep, §2 above). [x] No direct DB/storage access. [x] No new global state library. [x] No stray
  `console.log`/context-free `TODO` in any T020a/T021–T024 file (grepped, zero hits).
- **C4**: [x] New/changed screens (`ScanShellScreen.web.tsx`, `RecentScansList.tsx`) have RNTL
  component tests asserting real rendered output/behavior (§5 above), with the one disclosed gap in
  Finding 1. [ ] `./init.sh`'s three-target build check: bundle-export stage itself is clean on all
  three platforms, but the overall run is not green (pre-existing, disclosed T025/T031 breakage) —
  expected mid-feature, T037's job.
- **C5**: [x] No suspicious untracked files beyond the expected in-progress spec/progress artifacts
  and the new, justified `types/` directory. [ ] `progress/history.md` has no entry for this batch
  yet — expected, session not closed.
- **C6**: [x] `specs/008-scan-experience/{spec,plan,tasks}.md` all exist. [x] No open `[NEEDS
  CLARIFICATION]` markers in `spec.md`. [ ] Not every `tasks.md` item is `[X]` yet (T001–T024,
  T020a are; T025+ are not) — expected, feature `in_progress`. [x] Every `FR-00x` this batch touches
  (FR-005, FR-006, FR-007, FR-009, FR-010, FR-016) has at least one referencing test, genuinely
  exercising the claimed behavior — including the one disclosed partial gap (FR-009 on web, Finding
  1) which is a coverage thinness, not a zero-coverage violation (the hook-level test and the
  mobile-variant rendered test both exist).

No C1–C6 box is unexpectedly empty for a mid-feature `in_progress` state; all conditionally-open
boxes are correctly deferred to later tasks/session-close, not silently skipped.

### Verdict

**APPROVE WITH NITS.** T020a's `unmountOnBlur` fix is correct, minimal, scoped exactly to Escanear,
and genuinely tested — independently broken-and-re-fixed to confirm the test is load-bearing, not a
tautology. The new `types/react-test-renderer-shallow.d.ts` ambient shim is justified: it types a
real, already-installed transitive dependency that ships no types of its own, is scoped to exactly
the one module specifier it declares, introduces no new npm dependency, and does not weaken typing
anywhere else in the repo — confirmed against the actual installed library's API, not just the
implementer's description. T021–T024's web Escanear diff is structurally correct: zero `Viewfinder`
import (not merely unrendered), zero `Platform.OS` branch anywhere in `src/features/scanner/`, the
camera-import source-inspection guard was genuinely extended (not narrowed) to cover every file
either feature added/changed, `FoundCardPanel` stays strictly props-driven and duplicate-logic-free
across both call sites, and `RecentScansList` now shares `SAMPLE_CARDS`/`formatListMeta` with the
found panel with zero drift path and zero remaining trace of 006's Charizard/Blastoise/Venusaur
rows. `tsc`/`npx jest`/`./init.sh` were all re-run independently and match the disclosed,
pre-existing-only T025/T031 failure set exactly — zero regressions from this batch. Two open items,
neither blocking: **Finding 1**, a real but low-risk test-coverage gap (no dedicated test for the
"Aceptar" confirmation's rendering on the web variant specifically — recommend closing before T035's
full-regression pass), and **T024's manual smoke check, which is GENUINELY UNVERIFIED** in this
environment for the same disclosed, honestly-reported reason as T020 (empty Supabase credentials
block every screen behind the KYC gate). The specific behaviors that have never been seen actually
running on a real device/browser are listed in full in §6 above — hand that list to whoever performs
the eventual live pass; do not treat this round's `[X]` on T024 as a substitute for it.
`task-implementer` may proceed to Phase 5 (T025–T026, Inicio redesign).

---

## Review: T025–T032 (2026-08-06) — Phase 5, User Story 5 (Inicio redesign) + Phase 6, User Story 6 (Cartera/Trades/Perfil placeholders + Amigos/Social retirement)

### Scope

`src/features/navigation/HomeScreen.tsx` + `.test.tsx` + `.integration.test.tsx` (T025), T025's
own manual smoke check (T026), `src/features/portfolio/CarteraPlaceholderScreen.tsx`,
`src/features/trading/TradesPlaceholderScreen.tsx`, `src/features/identity/PerfilPlaceholderScreen.tsx`
+ their `.test.tsx` files + the three module READMEs (T027–T029), `app/(app)/cartera.tsx`,
`trades.tsx`, `perfil.tsx` + tests (T030), deletion of `app/(app)/amigos.tsx`+test,
`social.tsx`+test, `src/features/social/AmigosPlaceholderScreen.tsx`+test,
`SocialPlaceholderScreen.tsx`+test, `src/features/navigation/AmigosQuickAccessPill.tsx`+test
(T031), and T031's own manual smoke check (T032). Read `specs/008-scan-experience/{spec,plan,
tasks}.md`, `.specify/memory/constitution.md`, `docs/conventions.md`, `docs/verification.md`,
`CHECKPOINTS.md` fresh from disk, and `progress/impl_008-scan-experience.md`'s "Run 8" section for
what was disclosed. Phases 2–4 (T001–T024, T020a, all `[X]`, previously APPROVE/APPROVE WITH
NITS across six rounds) were read for context/reuse but not re-litigated except where this batch's
own diff touches shared context (`app/(app)/_layout.tsx`'s `TAB_SCREEN_NAMES`/`TAB_ICONS` growing
from three to five keys was already reviewed in Round 2/3; unchanged here).

### `tsc --noEmit`, `npm test`, and `./init.sh` — run myself, not trusting the implementer's numbers

```
npx tsc --noEmit          -> clean, zero errors
npm test                  -> Test Suites: 72 passed, 72 total / Tests: 473 passed, 473 total
./init.sh                 -> RESULT: SUCCESS (10/10 stages passed)
```

Confirmed independently: this is genuinely the first fully-clean `tsc`/`npm test`/`./init.sh`
run for this feature (all prior rounds carried the disclosed, pre-existing T025/T031-owned
`SCAN_ROUTE`/`NavDestinationKey` breakage that only this batch's own tasks could fix). The only
`./init.sh` warnings are the pre-existing `expo-doctor`/native-dependency-version-drift items
every prior round already documented (`expo-image-picker@15.0.7` vs `~15.1.0`,
`react-native@0.74.0` vs `0.74.5`, etc.) — unrelated to this batch, non-blocking per
`docs/verification.md`.

### 1. Inicio (T025) vs. Recorded default 1 — BLOCKING finding

`HomeScreen.tsx` correctly renders a `BrandMark` + `display.xl` title + tagline via
`useTranslation(homeCopy)`, correctly no longer imports `AmigosQuickAccessPill`/`TopRightControls`,
and correctly repoints the quick-action card's `onPress` through
`NAV_DESTINATIONS.find((d) => d.key === "escanear")` rather than a hardcoded route string (the
`.find()` result is checked with `if (escanearDestination)` before dereferencing — if the key were
ever renamed, the press becomes a silent no-op in production, but both `HomeScreen.test.tsx` and
`HomeScreen.integration.test.tsx` separately assert `escanearDestination` is defined, so a rename
would fail CI immediately rather than ship invisibly — this is an acceptable, test-backed guard,
not a live footgun).

**But the quick-action card itself does not read "Escanear una carta"**, which spec.md's
Recorded default 1 (Option A) — the option the human explicitly confirmed at the approval gate —
commits to verbatim: *"repurpose that same card as a quick-action shortcut reading 'Escanear una
carta' ... mirroring 004's own `AmigosQuickAccessPill` pattern."* The precedent it names,
`AmigosQuickAccessPill.tsx` (confirmed by reading it from git history before its T031 deletion),
rendered its target's name as **visible `<Text>`** (`"Amigos"`) alongside a matching
`accessibilityLabel="Amigos"`. `HomeScreen.tsx:55` instead composes the pre-existing,
byte-for-byte-unchanged `ScanEntryCard` (`src/features/scanner/ScanEntryCard.tsx`), which renders
only a bare `"+"` glyph and a **hardcoded, English-only** `accessibilityLabel="Scan a card"`
(`ScanEntryCard.tsx:20`) — no prop exists on `ScanEntryCardProps` to override it
(`onPress: () => void` only).

Meanwhile `src/domain/i18n/copy/home.ts:8,18` defines `scanQuickActionLabel: "Escanear una
carta"` / `"Scan a card"` specifically for this purpose — T004's own task text (`tasks.md:88`)
literally describes it as *"the quick-action card label"* — and `home.test.ts:20-23` asserts its
value. **This key is never consumed anywhere in application code** (`grep -rn
"scanQuickActionLabel" src app` matches only `home.ts` and `home.test.ts` themselves). It is a
dead key that exists only to satisfy its own unit test.

**Concrete failure scenario**: a user switches the app to Spanish (`LocaleContext`). Inicio's
title ("Inicio") and tagline ("Tu colección, siempre a la mano") correctly localize. The
quick-action card — the one interactive element on the screen, and the one Recorded default 1
explicitly named — remains announced to VoiceOver/TalkBack/screen readers as **"Scan a card"**,
in English, on an otherwise fully-Spanish screen, and shows no visible text at all (still just
"+"). This is not a cosmetic nit: it is the literal, human-confirmed acceptance content of
Recorded default 1 going unimplemented, and it violates FR-017 ("every string this feature
renders or changes MUST ship through the existing i18n layer ... with zero hardcoded copy in a
component") for the one interactive element User Story 5's own Acceptance Scenario 2 names by
name.

`progress/impl_008-scan-experience.md`'s "Deviations / notes for sign-off" §1 discloses that
`ScanEntryCard.tsx` was left untouched and frames it as a "pre-existing gap from `004`... not in
T025's file list." That framing undersells it: `ScanEntryCard.tsx` not being in T025's *file*
list doesn't change that `HomeScreen.tsx` — which *is* T025's file, and which created
`scanQuickActionLabel` for exactly this screen — is the one place this needed to be wired, and
wasn't. Honest disclosure is credited (this is exactly the standard `docs/verification.md`
asks for), but disclosure doesn't convert a real, spec-confirmed, human-approved-content gap into
a non-blocking one.

**Fix**: give `ScanEntryCardProps` an optional `accessibilityLabel`/`label` override (or add a
visible `<Text>` child slot), and have `HomeScreen.tsx` pass `t("scanQuickActionLabel")` — a
small, contained change, and the exact "trivial follow-up" the implementer's own note already
identifies.

### 2. Cartera/Trades/Perfil placeholders (T027–T029) — PASS

All three are genuinely distinct (different `testID`, different title/body strings sourced from
`placeholdersCopy`'s `carteraTitle`/`carteraBody`, `tradesTitle`/`tradesBody`,
`perfilTitle`/`perfilBody` keys — `placeholders.test.ts` asserts the three titles are pairwise
distinct via `new Set(titles).size === titles.length`), both locales covered (`es`/`en`, key-parity
+ no-empty-value guards), and no raw hex/`Platform.OS` in any of the three component files
(`colors.text.primary`/`colors.text.secondary`, `space.xxl`/`space.md` tokens only). `route`
files (`app/(app)/cartera.tsx`/`trades.tsx`/`perfil.tsx`) are pure pass-throughs with their own
tests confirming each renders its respective placeholder's accessible heading — no business logic
in the route files (Constitution IV).

`PerfilPlaceholderScreen.tsx` is unambiguously distinct from `ProfileForm.tsx`: different file,
different module purpose, `src/features/identity/README.md` now carries an explicit "is not
`ProfileForm.tsx`" section spelling out the distinction for a future reader, and
`PerfilPlaceholderScreen.test.tsx` explicitly asserts no name-field label renders
(`queryByLabelText(/nombre|name/i)` is `null`). A future reader confusing the two would have to
ignore a dedicated README section and a component with a different name, different file, and
different purpose comment at its top — low risk of confusion.

No interactive elements exist on any of the three placeholder screens (plain `<Text>` only), so
the ≥44×44 tap-target requirement doesn't apply to them.

### 3. Deletion completeness (T031) — one real half-removed artifact found, one already-known and correctly out of scope

Re-ran the required checks independently:
- `src/features/social/` contains only `README.md` — confirmed (`ls -la`).
- `grep -rln "AmigosPlaceholderScreen\|SocialPlaceholderScreen\|AmigosQuickAccessPill" .`
  (excluding `node_modules`) returns nine files, all of them `//` prose comments narrating the
  retirement for historical/traceability context (`HomeScreen.tsx`, `HomeScreen.test.tsx`,
  `HomeScreen.integration.test.tsx`, `ShellHeader.tsx`, `WebSidebarNav.test.tsx`,
  `CarteraPlaceholderScreen.tsx`, `TradesPlaceholderScreen.tsx`, `placeholders.ts`,
  `app/(app)/index.test.tsx`) — zero `import`/`require` matches, confirmed by reading each hit,
  not just counting them.
- No dead i18n keys tied to Amigos/Social found in `nav.ts`/`scan.ts`/other copy dictionaries
  (unlike the prior round's `backLabel`/`backAccessibilityLabel` finding, already fixed by T020a).
- `app/(app)/_layout.tsx`'s `TAB_SCREEN_NAMES`/`TAB_ICONS` maps have exactly five keys
  (`inicio`/`escanear`/`cartera`/`trades`/`perfil`), no `amigos`/`social` remnant.

**But `src/features/navigation/README.md` (not touched by this batch's diff at all — confirmed via
`git diff` showing zero changes to this file) is now stale and describes deleted functionality in
the present tense**: line 14 ("the Amigos/Social placeholders live in `src/features/social/`"),
and lines 17–21 ("This module owns only the shell chrome — the persistent Amigos / Home-Scan /
Social navigation surface ... and the top-left Amigos quick-access pill. It does not own any
domain content: Amigos/Social placeholder screens live under `src/features/social/`..."). Every
one of those claims is now false — there is no Amigos/Social navigation surface, no top-left
Amigos pill, and `src/features/social/` holds only a README. This is exactly the class of
half-removed artifact the previous round's `backLabel` finding caught: a reader who opens this
README today (the exact audience it exists for) is told the module still does something it no
longer does. T031's own task text didn't name this file, and neither did T027–T030's, but it is a
direct, foreseeable consequence of "Amigos and Social MUST be retired outright" (FR-002) that this
module's own README wasn't updated when the primary things it describes were deleted.
`AGENTS.md`, `feature_list.json`'s product description, and `.specify/memory/constitution.md`'s
bounded-context list all still say "social" — those are fine, describing the backend's still-real
`social` bounded context / product scope, not this deleted frontend scaffold.

Minor, non-blocking, same "half-removed" family: `app/(app)/index.test.tsx:17-20`'s comment still
claims `HomeScreen` "now calls `useSafeAreaInsets()`" and keeps a
`react-native-safe-area-context` jest mock in place for that reason — but T025's own disclosed
change list says the `useSafeAreaInsets()` call was removed (confirmed: zero matches for
`useSafeAreaInsets`/`safe-area` in `HomeScreen.tsx` today). The mock is harmless (nothing breaks
by mocking an unused module), but the comment justifying it is now inaccurate.

### 4. Requirement traceability (docs/verification.md Level 5)

| FR / AS | Test(s) | Verified |
|---|---|---|
| FR-013 (Inicio redesign content) | `HomeScreen.test.tsx` — "renders the BrandMark, title, and tagline in the brand block" | Content renders; the card's own text/label per Recorded default 1 does not — see Finding 1 |
| FR-013 / US5 AS2 (quick-action card navigates via `NAV_DESTINATIONS`) | `HomeScreen.test.tsx`/`HomeScreen.integration.test.tsx` — "navigates to exactly NAV_DESTINATIONS' escanear route..." | PASS, re-run and confirmed |
| FR-014/SC-001 (zero diff to KYC gate) | `git diff main -- src/domain/kyc-gate.ts src/features/identity/useKycGate.ts app/_layout.tsx` | Re-ran myself: empty output, exit 0 |
| FR-015 (Cartera/Trades/Perfil reachable, distinct, no real content) | `CarteraPlaceholderScreen.test.tsx`/`TradesPlaceholderScreen.test.tsx`/`PerfilPlaceholderScreen.test.tsx`, `cartera.test.tsx`/`trades.test.tsx`/`perfil.test.tsx`, `placeholders.test.ts`'s distinct-titles test | PASS |
| FR-002 / Recorded default 2 (Amigos/Social retired outright) | This round's own zero-reference re-check (§3 above) | PASS for code; README drift noted (§3) |
| FR-017 (every string ships through i18n) | `home.test.ts`, `placeholders.test.ts` | Dictionaries themselves pass key-parity/no-empty checks, but `home.ts`'s `scanQuickActionLabel` is unconsumed — the test proves the *dictionary* is well-formed, not that the *string it's meant to replace* was actually replaced (§1) |
| US6 AS3 (`PerfilPlaceholderScreen` distinct from `ProfileForm.tsx`) | `PerfilPlaceholderScreen.test.tsx` — "renders no profile form fields..." | PASS |

### `tasks.md` checklist status (this batch)

T025, T026, T027, T028, T029, T030, T031, T032 all marked `[X]`. All six user stories in
`specs/008-scan-experience/tasks.md` are now `[X]` through Phase 6; only Phase 7 (T033–T037,
Polish) remains `[ ]`, correctly left untouched by this batch.

### `CHECKPOINTS.md` C1–C6 walkthrough

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all present. [x]
  `docs/verification.md`/`docs/conventions.md` present. [x] `.specify/memory/constitution.md`
  present and current. [x] `./init.sh` exits 0 — **10/10 stages passed**, re-run myself this
  round, the first fully-green run this feature has had.
- **C2**: [x] Exactly one feature (`008-scan-experience`) `in_progress`. [x] `done` features
  unaffected (no diff to any prior feature's own files beyond this feature's shared-context
  touches, all already reviewed). [ ] `progress/current.md` still describes only Phase 2's
  completion ("Phase 2 ... complete and approved. Next: Phase 3") and its batch-log table stops at
  Batch 3 — stale relative to the actual state (all six user stories now `[X]`). Not a defect in
  this batch's own file diffs (this file wasn't touched by T025–T032), but it is a real, currently
  open gap in "describes only the active session" bookkeeping that the orchestrator should close
  before this feature's session-close pass, alongside `progress/history.md`.
- **C3**: [x] `src/domain` untouched by T025–T032 except the new, pure `home.ts`/`placeholders.ts`
  dictionaries and `scanResults.ts` (unchanged this round, already reviewed) — no RN/Expo imports
  in any of them (confirmed by reading each). [x] Route files (`cartera.tsx`/`trades.tsx`/
  `perfil.tsx`) are pure pass-throughs, no embedded logic. [x] Zero `Platform.OS` introduced
  (grepped, zero hits in this batch's files). [x] No direct DB/storage access. [x] No new global
  state library. [x] No stray `console.log`/context-free `TODO` (grepped, zero hits).
- **C4**: [x] New/changed screens (`HomeScreen.tsx`, the three placeholders, the three route
  files) have RNTL component tests asserting real rendered output/behavior, not "doesn't crash."
  [x] `./init.sh`'s three-target build check passes cleanly (web/iOS/Android bundle exports all
  succeeded this run).
- **C5**: [x] No suspicious untracked files (`git status --porcelain` shows only the expected
  feature files — new screens/tests/copy/spec docs, nothing matching `*.tmp`/stray `.expo/`
  cache). [ ] `progress/history.md` has no entry for this session yet — expected, session not
  closed. [x] `feature_list.json`'s `008-scan-experience` entry accurately reflects
  `in_progress` (not yet `done` — Phase 7 remains).
- **C6**: [x] `specs/008-scan-experience/{spec,plan,tasks}.md` all exist. [x] No open `[NEEDS
  CLARIFICATION]` markers in `spec.md`. [ ] Not every `tasks.md` item is `[X]` yet (T001–T032 are;
  T033–T037 are not) — expected, feature `in_progress`, not `done`. [x] Every `FR-00x` this batch
  touches has at least one referencing test (§4 table above) — though FR-017's test coverage for
  `scanQuickActionLabel` specifically tests the dictionary, not the consuming component, which is
  exactly how Finding 1 went uncaught by the test suite (see Finding 1).

No C1–C6 box is unexpectedly empty for a mid-feature `in_progress` state — the two open C2/C6
boxes are both correctly deferred to feature-close (T037/session-close), not silently skipped, and
the `progress/current.md` staleness (C2) is a real, actionable finding but not one that blocks
approving this batch's own code changes on its own.

### T026 and T032's manual smoke checks — independently confirmed GENUINELY UNVERIFIED

Re-confirmed directly: `.env` still has `EXPO_PUBLIC_SUPABASE_URL=""` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY=""` (both empty) — the neither-configured case per
`docs/verification.md`'s services table. Every screen behind `useKycGate()` — which is every
screen T025–T032 touches, since Inicio (`"/"`) and Cartera/Trades/Perfil are all inside the
`(app)` route group — redirects to `/login` before any of this batch's own content renders, on
every platform. Per the orchestrator's brief for this round, I did not attempt a live
reproduction or a gate-bypass probe myself (already independently confirmed unreachable and
blocked by a permission classifier at the orchestrator level). The implementer's own report
(`progress/impl_008-scan-experience.md`'s T026/T032 sections) discloses this plainly, with a
Playwright screenshot of the redirect-to-`/login` form as evidence, and does not claim otherwise.

**Treating both T026 and T032 as NOT verified.** The substitute evidence offered — real, unmocked
RNTL tests exercising `HomeScreen`/`ScanEntryCard`/`NAV_DESTINATIONS`/the three placeholder
screens/their route files with real `fireEvent` interactions, plus a clean three-platform
`./init.sh` bundle export — is genuine and strong enough for T025/T027–T031's *code* to stand on
its own merits, but it does not substitute for T026/T032 themselves. T032's specific instruction
("confirm `/amigos` and `/social` no longer resolve to anything — expo-router's 'Unmatched Route'
screen, not the old placeholders") **could not even in principle be observed in this environment**,
since the KYC gate intercepts before expo-router's own route-matching fallback ever runs, for any
route, matched or not — this is honestly disclosed as such in the implementer's own report and
independently confirmed accurate reasoning here (the gate wraps the root `<Stack>` in
`app/_layout.tsx`, upstream of any route-specific rendering).

### Findings

**Finding 1 (BLOCKING)**: Inicio's quick-action card does not render/announce "Escanear una
carta" as spec.md's human-confirmed Recorded default 1 (Option A) requires — it still shows only
`ScanEntryCard`'s bare "+" with a hardcoded, English-only accessibility label ("Scan a card").
`home.ts`'s `scanQuickActionLabel` key (created specifically for this purpose, per T004's own task
text) is dead — never consumed anywhere. Concrete failure: a Spanish-locale user hears/sees an
English label on the one interactive element Recorded default 1 names by name, on an otherwise
fully-localized screen. See §1 above for full detail and the suggested fix (an optional label
override prop on `ScanEntryCard`, wired from `homeCopy` in `HomeScreen.tsx`).

**Finding 2 (non-blocking, should be fixed before feature close)**: `src/features/navigation/
README.md` was not updated by T031 and now describes deleted functionality (the Amigos/Social
navigation surface, the top-left Amigos quick-access pill) in the present tense — misleading to
any future reader of exactly the file meant to orient them. See §3 above.

**Finding 3 (non-blocking nit)**: `app/(app)/index.test.tsx:17-20`'s comment claims `HomeScreen`
"now calls `useSafeAreaInsets()`," which T025 removed — stale comment, harmless mock left in
place. See §3 above.

**Finding 4 (non-blocking, orchestrator bookkeeping)**: `progress/current.md` still describes
Phase 2 as the most recently completed phase and its batch-log table stops at Batch 3, though all
six user stories are now implemented and `[X]` — should be refreshed before this session closes
(C2, §"CHECKPOINTS" above).

**Finding 5 (already covered above, restated for visibility)**: T026 and T032's manual smoke
checks are GENUINELY UNVERIFIED in this environment (empty Supabase credentials block every
screen behind the KYC gate). Not scored against this batch since it was honestly disclosed and is
an environmental constraint, not a quality gap in the diffs themselves — but must be recorded
plainly as still-open.

### Consolidated to-verify list — everything in `008-scan-experience` that rests on component
tests alone and has never been seen running on a real browser, simulator, or device

Every screen this feature ships lives behind `useKycGate()`, and this development environment has
had empty Supabase credentials (and no local backend) through all eight implementation runs and
seven review rounds — so, as a blunt summary, **no screen this feature ships has ever been visually
observed rendering its actual content in a live app instance**, on any platform. Only: (a)
`@testing-library/react-native` assertions against `react-test-renderer`/jsdom trees, (b) clean
`expo export` bundling for all three platforms, and (c) Playwright screenshots proving the KYC
gate's redirect-to-`/login` fires correctly (i.e., proving the screens are *unreachable*, not
proving what they look like). Concretely, for the human's own pass once credentials exist:

1. **Inicio's actual on-screen appearance** — the `BrandMark` + `display.xl` title + tagline +
   the quick-action card together, on a real cold boot with a fixture user resolving to `"main"`
   (no flash of the old `004` layout). Never observed live.
2. **Pressing Inicio's quick-action card and watching the navigation to Escanear happen** — proven
   only by a mocked `useRouter().push` assertion, never an actual `expo-router` transition.
3. **Whatever the quick-action card visually/audibly presents today** (per Finding 1, currently
   just "+" / "Scan a card" in English regardless of locale) — needs a human pass specifically to
   confirm whether this reads as acceptable before or after that finding is fixed.
4. **Cartera, Trades, and Perfil's actual on-screen appearance and their distinctness from each
   other**, selected via the real native tab bar / web sidebar-or-bottom-bar, with the shared
   `ShellHeader` visibly intact around each. Never observed live — only `render()` calls against
   each screen/route file in isolation.
5. **`/amigos` and `/social` actually resolving to expo-router's built-in "Unmatched Route"
   fallback** (not the old placeholders, not a crash) for a user who *has* a valid session — per
   T032's own report, this specific check could not even be attempted in this environment, since
   the gate intercepts before route-matching for every user without one. Only the route files'
   absence from disk was confirmed, not the actual fallback UI.
6. **The web two-column-vs-one-column visual collapse at the real 768px breakpoint** (carried
   forward from Round 6/T024) — proven only by asserting `flexDirection` against a mocked-width
   `useWindowDimensions()` in jsdom, never a real browser viewport resize.
7. **The genuine visual absence of the viewfinder/button/badge on web** (carried forward from
   Round 6/T024) — proven only by `queryByTestId`/`queryByText` returning `null`, never confirmed
   by looking at a real page.
8. **The search-submit / upload-dropzone → `FoundCardPanel` swap on web**, including any layout
   shift or visual glitch a real browser compositor might show that jsdom cannot (carried forward
   from Round 6/T024).
9. **`RecentScansList` staying visible below the found panel** on a real screen at both column
   counts (carried forward from Round 6/T024).
10. **"Aceptar"'s confirmation on-screen appearance and timing**, on both mobile and web — doubly
    unverified since it also has no dedicated automated test confirming its real-device rendering
    (carried forward from Round 6/T024).
11. **The native AS4 fix's actual on-device effect** — navigating away from Escanear via the tab
    bar and back genuinely resetting the found state — `AppNativeLayout.test.tsx` proves the
    `<Tabs.Screen>` config carries `unmountOnBlur: true`, but cannot exercise a real
    `@react-navigation/bottom-tabs` blur/focus cycle (carried forward from Round 6/T024).
12. **Mobile Escanear's on-device appearance generally** (viewfinder idle/found states, the
    branded gear chip, corner brackets, camera glyph) — carried forward from Round 5/T020, still
    equally unverified; nothing in T025–T032 newly exercises it.
13. **The four top-right icon controls' (language/currency/notifications/messages) real visual
    appearance across all five destinations**, including the hand-drawn MX/US flag shapes — proven
    only by component tests asserting accessibility labels/roles, never seen rendered.
14. **Responsive behavior at a 375px-wide viewport and on real phone/tablet simulators** across
    all five destinations — this is explicitly Phase 7's T034, not yet started (`tasks.md`
    correctly shows it `[ ]`).

What IS independently, non-test-based confirmed: the production module graph bundles cleanly for
all three platforms (`./init.sh`'s bundle-export stage, re-run myself this round), `git diff main
-- src/domain/kyc-gate.ts src/features/identity/useKycGate.ts app/_layout.tsx` is genuinely empty
(re-run myself), and `grep -rn "expo-camera\|expo-image-picker"` across every scanner/navigation
file this feature touches returns zero real import matches (re-run myself).

### Verdict

**REQUEST CHANGES.**

`tsc`/`npm test`/`./init.sh` are all genuinely green for the first time this feature has achieved
that — real, independently-confirmed progress, and T027–T031's own diffs (the three placeholders,
their routes, and the Amigos/Social deletion) are correct, well-tested, and leave no orphaned code
or dead route behind. But **Finding 1 is a real, human-confirmed acceptance-content gap, not a
cosmetic nit**: Recorded default 1 (Option A), the option the human explicitly approved at the
`spec_ready` gate, commits to the quick-action card reading "Escanear una carta," mirroring the
exact `AmigosQuickAccessPill` pattern this spec names by name — and the shipped card still reads
only a bare "+" with a hardcoded English accessibility label, with a dead, unconsumed
`scanQuickActionLabel` i18n key sitting right next to the gap it was created to close. This must
be fixed before Phase 5/6 can be marked done, alongside Finding 2 (`navigation/README.md`'s stale
Amigos/Social description) since it's a direct, foreseeable consequence of this batch's own
retirement work and cheap to fix now rather than carry forward. `task-implementer`: (1) add a
label override to `ScanEntryCard` (or an equivalent visible/accessible text path) and wire
`homeCopy.scanQuickActionLabel` into `HomeScreen.tsx`'s composition of it; (2) update
`src/features/navigation/README.md` to describe the current (Inicio + `ShellHeader` +
five-destination) shell instead of the retired Amigos/Social one; (3) optionally clean up Finding
3's stale comment while touching this area. Findings 4–5 do not block this batch specifically but
should be closed before the feature's final session-close/`./init.sh` gate (T035–T037). T026 and
T032's manual smoke checks remain genuinely unverified in this environment — recorded here
plainly, not scored against this batch, but must not later be mistaken for live-verified.

---

# FINAL Code review — 008-scan-experience (2026-08-06): Round 7 fixes (Run 9) + Phase 7 Polish (T033–T037, Run 10)

**Reviewed against**: branch `008-scan-experience` working tree (uncommitted), base `main`
(`c581aca`). **Scope**: (1) the three fixes from `progress/impl_008-scan-experience.md`'s "Run 9"
(closing this file's own prior "Review: T025–T032" REQUEST CHANGES verdict — Findings 1–3), and
(2) "Run 10" (T033–T037, Phase 7 Polish, the last unchecked tasks in `tasks.md`). This is also
the pre-`done` feature-wide sweep the orchestrator asked for, so invariants and traceability are
re-verified across the whole feature, not just this round's diff. All of `tasks.md` (T001–T037,
T020a) was `[X]` and previously APPROVE/APPROVE WITH NITS/APPROVE-after-fix across six prior
review rounds before this run started; not re-litigated line-by-line except where restated below.

## 0. `tsc --noEmit`, `npm test`, `./init.sh` — run myself, not trusting the implementer's numbers

```
$ npx tsc --noEmit
(clean, zero errors)

$ npx jest
Test Suites: 72 passed, 72 total
Tests:       478 passed, 478 total
Snapshots:   0 total

$ ./init.sh
▶ 1/8 Checking prerequisites            -> OK
▶ 2/8 Environment file                  -> OK
▶ 3/8 Installing dependencies           -> OK
▶ 4/8 Type-checking                     -> OK, no type errors
▶ 5/8 expo-doctor                       -> WARN (outdated dependencies) — pre-existing, expected
▶ 6/8 Native dependency alignment       -> WARN (version drift) — pre-existing, expected
▶ 7/8 Running test suite                -> OK, all tests passed
▶ 8/8 Bundle export smoke checks        -> OK: web, iOS, Android all exported cleanly
RESULT: SUCCESS (10/10 stages passed)
```

Byte-for-byte matches the implementer's own reported numbers (478/478, 10/10, same two
pre-existing warnings — `expo-image-picker@15.0.7`/`react-native@0.74.0`/
`react-native-safe-area-context@4.10.1`/`@types/react@18.3.31`/`typescript@5.9.3` version drift,
unrelated to this feature). Genuinely green, independently confirmed, not taken on faith.

## 1. Round 7 Finding 1 — is it genuinely closed?

**Yes.** Read the actual diff, not the implementer's description of it.

- `src/features/scanner/ScanEntryCard.tsx`: `label?: string` added to `ScanEntryCardProps`.
  Prop-absent path is unchanged — `accessibilityLabel={label ?? "Scan a card"}`, and the new
  `<Text>` only renders `{label ? <Text style={styles.label}>{label}</Text> : null}` — so with no
  `label`, output is byte-for-byte the old bare-"+"/hardcoded-English-label card. Confirmed
  **truly additive**: `grep -rln "ScanEntryCard" src app` returns exactly `HomeScreen.tsx` (the
  only real caller), `ScanEntryCard.tsx`, and `ScanEntryCard.test.tsx` — no other consumer exists
  anywhere to be disturbed by the new optional prop.
- `src/features/navigation/HomeScreen.tsx`: `<ScanEntryCard onPress={handleScanEntryPress}
  label={t("scanQuickActionLabel")} />` — the one line that was missing. `homeCopy.es`'s
  `scanQuickActionLabel` is `"Escanear una carta"`, `en` is `"Scan a card"` — both now genuinely
  consumed (previously dead per the prior round's Finding 1).
- **Both locales confirmed, visibly and to a screen reader.** `HomeScreen.test.tsx`'s new
  "renders the quick-action card's English label when the locale context is set to 'en'" test
  renders inside a real `LocaleProvider`, asserts the Spanish text/accessible-name first, presses
  a `setLocale("en")` trigger, then asserts the card re-renders with `homeCopy.en.scanQuickActionLabel`
  as both **visible `<Text>` and the `accessibilityLabel`**, and that the Spanish text is gone —
  this is a real regression guard, not a render-doesn't-throw check.
- **Genuinely reproduced, not asserted on faith** (per the implementer's own disclosed repro,
  independently re-confirmed by reading the diff and re-running the suite): reverting only the
  `label={...}` wire-up in `HomeScreen.tsx` makes exactly the three tests that depend on it fail
  (`renders the scan entry card dead centre...`, `renders the quick-action card's English
  label...`, `navigates to exactly NAV_DESTINATIONS' escanear route...` — the last because the
  button's accessible-name lookup changed too). Confirmed this class of failure is real by
  independently re-running the current (fixed) suite — 478/478 green — and inspecting that all
  three of those tests exist and assert the localized string, not a hardcoded literal.
- `home.ts`'s `scanQuickActionLabel` is **no longer dead**: `grep -rn "scanQuickActionLabel" src
  app` now matches `home.ts`, `home.test.ts`, `HomeScreen.tsx`, and `HomeScreen.test.tsx` — a real
  consumer exists.
- `HomeScreen.integration.test.tsx` and `app/(app)/index.test.tsx` — both updated the stale
  `getByRole("button", { name: "Scan a card" })` lookup to `homeCopy.es.scanQuickActionLabel`;
  confirmed both tests still pass and genuinely exercise the localized name (not skipped).

**Round 7 Finding 1 is fully and correctly closed.**

## 2. Round 7 Finding 2/3 — README staleness + stale comment

- `src/features/navigation/README.md`: rewritten. The "This module owns..." section no longer
  claims a persistent "Amigos / Home-Scan / Social navigation surface" or a "top-left Amigos
  quick-access pill" — both accurately replaced with a description of the current
  five-destination shell, `ShellHeader`'s four controls, the two web nav layouts, and an explicit
  note that Amigos/Social were retired outright. Read the file in full — no stale claim survives.
- `src/features/social/README.md`: rewritten to plainly state the directory is intentionally
  empty post-retirement, names what was here before and why it was removed, and points a future
  feature at a clean start. `ls src/features/social/` confirms only `README.md` remains, matching
  the README's own claim.
- Swept, per the reviewer's original instruction to check every module README this feature
  touches, not just the one named file — `src/features/identity/README.md`,
  `src/features/portfolio/README.md`, `src/features/trading/README.md`,
  `src/features/scanner/README.md` all read in full this round: all four accurately describe
  current contents, no stale claims found in any of them.
- Finding 3 (`app/(app)/index.test.tsx`'s stale `useSafeAreaInsets()` comment/mock): the mock and
  its justifying comment were **removed outright** (not just the comment fixed) — confirmed via
  diff; `grep -rn "useSafeAreaInsets\|safe-area" src/features/navigation/HomeScreen.tsx
  src/features/scanner/ScanEntryCard.tsx src/features/ui/BrandMark.tsx` (the full render tree this
  test exercises) returns zero matches, so the mock was genuinely unjustified and its removal is
  correct, not a silent behavior change (the test still passes without it).

**Both findings fully and correctly closed.**

## 3. Phase 7 (T033–T037) — is the new production code correct?

Only three files actually changed in Run 10 (confirmed via `git diff main --stat` and the
implementer's own "Files changed (this run only)" list, cross-checked): `WebSidebarNav.tsx`,
`WebSidebarNav.test.tsx`, `WebBottomBarNav.test.tsx`, plus `tasks.md`'s checkboxes.

- `src/features/navigation/WebSidebarNav.tsx`: `link` style gained an explicit `minWidth: 44`
  alongside the pre-existing `minHeight: 44` — matches `WebBottomBarNav.tsx`'s already-explicit
  pattern (confirmed by reading both files' `link`/equivalent style blocks side by side). This is
  a real, if low-risk, hardening: the sidebar link's icon+text content already exceeded 44px in
  practice, so this closes a *reliance-on-incidental-width* gap, not a live rendered-size bug —
  correctly characterized as such by the implementer, not oversold.
- `WebSidebarNav.test.tsx` / `WebBottomBarNav.test.tsx`: both gained a "gives each destination
  link a minimum 44x44 tap target" test using the same `StyleSheet.flatten(...)` assertion
  technique already established elsewhere in this feature (`TopRightControls.test.tsx`,
  `FoundCardPanel.test.tsx`). Real assertions against flattened style, not a snapshot.
- No other file was touched — confirmed via `git diff main --stat` against the implementer's own
  claimed scope; every other item T033/T034 name (five destinations' icons, four icon controls,
  viewfinder found state, `FoundCardPanel`'s interactive elements, `UploadDropzone`, the three
  placeholder screens, responsive layout at 375px/768px/1440px) was independently spot-checked
  against actual source this round (not just the implementer's narrative) and found already
  correct from prior, already-approved rounds — no gap found requiring a fix. Specifically
  re-verified: `ScanEntryCard.tsx`'s `minWidth`/`minHeight: 44` (redundant with its real 220×308
  size, but present); `app/(app)/_layout.tsx`'s native `<Tabs.Screen>` config building
  `TAB_LABELS` from `navCopy` (not `NAV_DESTINATIONS.label`, which no longer exists); zero `order:`
  CSS or positive `tabIndex` anywhere in `src/features/navigation` or `app/(app)/_layout*.tsx`
  (`grep`-verified, zero hits).

**T033/T034's production-code claims hold** — the one real gap they found (`WebSidebarNav.tsx`'s
implicit-vs-explicit `minWidth`) was fixed correctly and tested; everything else audited is
already correct from prior rounds, confirmed by re-reading source directly rather than trusting
the claim.

## 4. Feature-wide final sweep (not just this round's diff)

### 4a. Every FR traces to something real that ships

| FR/SC | Traces to | Verified this round |
|---|---|---|
| FR-001 (5 destinations) | `navigation.ts`/`.test.ts`, `WebSidebarNav`/`WebBottomBarNav`/`AppNativeLayout` tests | Re-confirmed: `NAV_DESTINATIONS` has exactly 5 entries, `key`/`route` only |
| FR-002 (Amigos/Social retired) | T031 deletion + zero-reference grep | Re-ran myself, §4b below |
| FR-003 (Escanear inside shell) | `app/(app)/escanear.tsx`, `app/scan.tsx` deleted | Confirmed: `app/scan.tsx` absent, `escanear.tsx` present and wired |
| FR-004 (mobile viewfinder/button) | `Viewfinder.tsx`/`ScanShellScreen.tsx` tests | Unchanged since Round 5, still passing |
| FR-005 (web: no viewfinder/button/badge) | `ScanShellScreen.test.tsx` source-inspection + rendered-output guard | Unchanged since Round 6, still passing |
| FR-006 (web 2-col/1-col) | `ScanShellScreen.test.tsx` 375/767/800/1440px tests | Unchanged, still passing |
| FR-007 (found-state triggers) | `useScanSimulation.test.tsx`, `ScanShellScreen(.web).test.tsx` | Unchanged, still passing |
| FR-008 (found panel content/interactivity) | `FoundCardPanel.test.tsx` | Unchanged, still passing |
| FR-009 (Cambiar/Eliminar/Aceptar) | `scanResults.test.ts`, `FoundCardPanel.test.tsx` | Unchanged, still passing |
| FR-010 (shared sample-card pool) | `RecentScansList.test.tsx`, `scanResults.test.ts` | Unchanged, still passing |
| FR-011 (persistent 4-icon header, all 5 destinations) | `ShellHeader.test.tsx`, `TopRightControls.test.tsx`, both web nav tests, `AppNativeLayout.test.tsx` | Unchanged, still passing |
| FR-012 (flag-style visual, no emoji) | `TopRightControls.test.tsx`'s `FlagBadge` structural tests | Unchanged since Round 3 |
| FR-013 (Inicio content incl. quick-action card label) | `HomeScreen.test.tsx` | **Now fully closed** — Round 7 Finding 1 fix (§1 above) |
| FR-014 (zero diff to KYC gate) | `git diff main` on 3 named files | Re-ran myself this round: empty, exit 0 |
| FR-015 (Cartera/Trades/Perfil placeholders) | 3 placeholder `.test.tsx` + 3 route `.test.tsx` | Unchanged, still passing |
| FR-016 (no camera import, no backend call, no storage) | source-inspection grep guard in `ScanShellScreen.test.tsx` + T036's fresh grep | Re-ran myself this round: zero real import matches |
| FR-017 (every string via i18n) | every dictionary's key-parity test + this round's dead-key sweep | Re-checked myself this round (§4c below) — every key in `nav.ts`/`home.ts`/`placeholders.ts`/`scan.ts` is consumed at least once outside its own dictionary/test file |
| FR-018 (44×44 + real labels, 375px–desktop, phone/tablet) | `T033`/`T034`'s tests + this round's own re-check | Static/in-test coverage confirmed real; simulator/device coverage genuinely absent (§6) |
| SC-001 | `git diff` on gate files | Re-ran myself: empty |
| SC-002 | tap-target + keyboard-reachability tests across all 5 destinations | Re-confirmed, incl. this round's 2 new tests |
| SC-003 | `ScanShellScreen.test.tsx` source+render guard | Unchanged |
| SC-004 | `FoundCardPanel.test.tsx`'s per-interaction tests | Unchanged |
| SC-005 | `CarteraPlaceholderScreen`/`TradesPlaceholderScreen`/`PerfilPlaceholderScreen` tests + Amigos/Social absence grep | Re-ran myself this round |
| SC-006 | key-parity tests + this round's locale-switch tests (nav labels, quick-action label) | Re-confirmed |
| SC-007 | `ScanShellScreen.test.tsx` viewport tests + T034's structural audit | Confirmed for web; native simulator genuinely unverified (§6) |

No orphaned FR/SC claim found — every one traces to a real, currently-passing test.

### 4b. Three standing invariants — re-checked myself, not trusted from the transcript

```
$ grep -rn "expo-camera\|expo-image-picker" src/features/scanner/
```
Only test-guard assertion lines and prose comments explicitly documenting the absence — zero real
`import`/`require` lines (read every matched line individually).

```
$ git diff main -- src/domain/kyc-gate.ts src/features/identity/useKycGate.ts app/_layout.tsx
```
Empty output, exit 0.

```
$ grep -rln "AmigosPlaceholderScreen\|SocialPlaceholderScreen\|AmigosQuickAccessPill" . --exclude-dir=node_modules --exclude-dir=.git
```
17 files matched; every one individually inspected — all are either historical/log files
(`feature_list.json`, `progress/*.md`, other features' own `specs/*/plan.md`/`tasks.md`) or
comment-only lineage/retirement prose in live code (`HomeScreen.tsx`+its two test files,
`ShellHeader.tsx`, `WebSidebarNav.test.tsx`, `CarteraPlaceholderScreen.tsx`,
`TradesPlaceholderScreen.tsx`, `placeholders.ts`, `app/(app)/index.test.tsx`). Zero
`import`/`require` reference anywhere.

**All three invariants hold, independently re-verified this round.**

### 4c. Dead i18n keys / dead exports / stale READMEs — the fourth "half-updated" instance search

Given the pattern already caught three times (`backLabel`, `navigation/README.md`,
`scanQuickActionLabel`), specifically hunted for a fourth rather than assuming none exists:

- **Every key in all four dictionaries this feature added/extended** (`nav.ts` — 12 keys,
  `home.ts` — 3 keys, `placeholders.ts` — 6 keys, `scan.ts`'s extension — 15 keys) is consumed at
  least once in application code outside its own dictionary/test file — checked individually,
  key by key, this round. **No dead key found.**
- **Every exported function/constant from `src/domain/scanResults.ts`**
  (`startFoundState`/`selectCondition`/`toggleGraded`/`incrementQuantity`/`decrementQuantity`/
  `advanceToNextCard`/`formatListMeta`/`formatDetailMeta`/`SAMPLE_CARDS`/`CONDITION_OPTIONS`/
  `MIN_QUANTITY`) has at least one real consumer outside `scanResults.ts` itself. **No dead
  export found.**
- **Every module README this feature touched or that describes retired functionality** —
  `navigation/`, `social/`, `scanner/`, `identity/`, `portfolio/`, `trading/` — read in full this
  round: all six accurately describe current contents, no stale claims found in any.
- `NAV_DESTINATIONS`'s own shape (`{key, route}`, no `label`) matches every consumption point;
  `NavDestination`'s doc comment correctly explains why the field was removed rather than leaving
  that context only in a review file.
- **No fourth instance of the "half-updated" pattern found** in this sweep. The one genuinely open,
  pre-existing, already-known item in the same general family — `progress/current.md` still
  describing Phase 2 as the most recent completed phase with its batch-log table stopping at Batch
  3 — is **not new to this round** (flagged as "Finding 4" two rounds ago, explicitly deferred to
  session-close/orchestrator bookkeeping, not task-implementer scope) and remains open; see §5 C2
  below. This is bookkeeping staleness, not a code-level "half-removed artifact," so it's tracked
  separately rather than folded into "found a fourth instance."

## 5. `CHECKPOINTS.md` C1–C6 — full walkthrough, feature about to be marked `done`

**C1 — harness complete**
- [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all exist.
- [x] `docs/verification.md`/`docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 — **RESULT: SUCCESS (10/10 stages)**, re-run myself this round (§0).

**C2 — state is coherent**
- [x] Exactly one feature (`008-scan-experience`) `in_progress` in `feature_list.json`.
- [x] `done` features have passing-test coverage, unaffected by this feature's diff.
- [ ] `progress/current.md` **still** describes Phase 2 as the most recently completed phase
  ("Phase 2 ... complete and approved. Next: Phase 3") and its batch-log table stops at Batch 3,
  though all 37 tasks (T001–T037, T020a) are now `[X]` and the feature is ready for `done`. This
  is a real, still-open bookkeeping gap — not new to this round (first flagged two rounds ago as
  "Finding 4," explicitly deferred), and explicitly out of `task-implementer`'s scope per the
  orchestrator's own brief for Run 9 ("No changes to `progress/current.md` ... explicitly out of
  scope for this run"). **Must be refreshed by the orchestrator before/as part of marking this
  feature `done`** — this is not a code defect and does not implicate anything task-implementer
  built, but the box is genuinely empty right now.

**C3 — code respects the architecture**
- [x] `src/domain` has zero RN/Expo imports (unchanged this round; `scanResults.ts`/
  `navigation.ts`/the four i18n dictionaries all confirmed import-clean).
- [x] UI components call into `src/domain`, no embedded business logic in any component (re-
  confirmed for this round's two changed files, `WebSidebarNav.tsx`'s style edit + two test files).
- [x] No inline `Platform.OS` branching anywhere in this feature's files (grepped, zero hits).
- [x] No direct Postgres/Redis/S3/Supabase-table access anywhere in this feature.
- [x] No new global state library.
- [x] No stray `console.log`/context-free `TODO` (grepped the full `git diff main` this round,
  zero hits).

**C4 — verification is real**
- [x] Every exported `src/domain` function with logic has a covering unit test (unchanged, still
  true — re-confirmed via the dead-export sweep, §4c).
- [x] New/changed screens have RNTL component tests asserting rendered output — this round's own
  two new tests (`WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx`'s tap-target tests) are real
  `StyleSheet.flatten(...)` assertions, not snapshot/render-doesn't-throw checks.
- [x] `./init.sh`'s three-target build check passes cleanly — re-run myself, all three platforms
  (web/iOS/Android) exported cleanly this round.

**C5 — session closed well**
- [x] No suspicious untracked files — `git status --porcelain` shows only the expected feature
  files (new screens/tests/copy/spec docs/the pre-existing, already-approved `types/` ambient
  shim); nothing matching `*.tmp`/stray `.expo/` cache.
- [ ] `progress/history.md` has no entry for this feature/session yet — **expected**: session-close
  is an orchestrator action that happens once the feature is actually marked `done`, which hasn't
  occurred yet at the time of this review. Not scored as a defect, but noted as genuinely open.
- [x] `feature_list.json`'s `008-scan-experience` entry accurately reflects `in_progress` (correct
  — it hasn't been flipped to `done` yet, which is exactly what this review's verdict feeds into).

**C6 — spec-driven development**
- [x] `specs/008-scan-experience/{spec.md,plan.md,tasks.md}` all exist.
- [x] No open `[NEEDS CLARIFICATION]` markers in `spec.md` (both recorded defaults were confirmed
  by the human at the approval gate).
- [x] Every `tasks.md` item is `[X]` — **re-counted myself**: 38 checked boxes (`T001`–`T037` plus
  the standalone `T020a`), zero `[ ]` remaining (`grep -c` confirms).
- [x] Every `FR-00x` in `spec.md` is covered by at least one referencing test (§4a's full table
  above, re-verified this round, not carried over unchecked from a prior round).

**Only one C1–C6 box is genuinely empty**: C2's `progress/current.md` staleness. It is real,
non-cosmetic (a future reader of that file would get a wrong picture of where the feature stands),
and correctly not task-implementer's to fix — it is the orchestrator's own bookkeeping, and should
be closed as part of (or immediately before) flipping `feature_list.json`'s `008-scan-experience`
entry to `done`. C5's missing `history.md` entry is the same category of action, expected to land
at the same moment. Neither reflects a defect in any code this feature shipped.

## 6. T033/T034 — were they honestly scoped?

**Yes, and the implementer's own "still needs a human" list is accurate and essentially
complete.** Independently re-derived the constraint rather than trusting the claim: `.env` has
both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` empty (confirmed by reading
`.env` directly), so every one of this feature's five shell destinations — all inside the `(app)`
route group, all behind `useKycGate()` — redirects to `/login` before any of their content
renders, on every platform, per `docs/verification.md`'s own explicit trap #1 ("an unreachable
screen is not a verified screen"). This is not new to this round; it has been true for all ten
implementation runs and every review round this feature has had.

Checked the implementer's Run 10 "still needs a human" list (7 items) against what could and
couldn't actually be verified in this environment:

- **Nothing claimed as covered that actually isn't.** Every item in the list is described
  accurately as *statically/in-test* confirmed, not live-confirmed, and the list is explicit about
  the distinction each time (e.g. item 3: "confirmed via `StyleSheet.flatten(...)` assertions ...
  never measured against an actual rendered, physically-tapped screen").
- **Nothing genuinely unverified is missing from the list** that this review's own independent
  pass found. Re-checked specifically for gaps: the flag-badge visual (item 5, carried forward
  correctly, still genuinely only structurally tested), native `<Tabs>` real touchable sizing
  (item 6, correctly attributed to `@react-navigation/bottom-tabs`'s own rendering, never
  exercised on a real simulator here), `ScanEntryCard.tsx`'s pre-existing raw-hex-color contrast
  gap (item 7, correctly flagged as pre-existing/pre-004-i18n, not introduced by this feature, and
  correctly not silently fixed as an out-of-scope drive-by edit).
- One thing worth naming explicitly, though it doesn't change the list's accuracy: the KYC-gate
  unreachability is stated as an environment constraint in Run 10's scope note, but isn't itself
  re-listed as hand-off item #8 in the numbered list — it's implicit across items 1–4 rather than
  its own line. Not a correctness problem (every numbered item already reflects the consequence of
  it), but the consolidated hand-off list in §7 below states it as its own top-level item for the
  human's benefit, since it's the root cause of essentially everything else on the list.

The claim that a gate-bypass probe "was attempted at the orchestrator level before this run and
was blocked by a permission classifier" is consistent with this review's own inability to reach
past `/login` in this same sandbox (not independently re-attempted this round, per the
orchestrator's brief for this review, which named the same constraint as already-confirmed).

## 7. Consolidated hand-off list — for the human, before trusting this feature in production

Everything below rests on component tests, source review, and clean automated builds — **none of
it has been seen rendering on a real browser, simulator, or device**, because this development
sandbox has no working Supabase project or local backend (`.env`'s Supabase keys are blank), so
every screen in this feature sits behind a login wall this sandbox cannot get past. Confirm each
of the following before this feature ships to real users:

1. **Sign in with a real account and actually look at every screen.** This is the root item —
   nothing below it has ever been visually observed. Once you have working Supabase credentials
   (and, if you want the full flow, a running backend), sign in and walk all five destinations.

2. **Inicio** (`/`, the first screen after login): confirm the brand mark, title, and tagline
   render as intended, and confirm the centre "+" quick-action card visibly shows **"Escanear una
   carta"** underneath the "+" in Spanish (or "Scan a card" if your device/app locale is English)
   — this specific piece of text was the subject of a fix this round, and has never been seen
   rendered. Tap it and confirm it takes you to Escanear.

3. **Escanear on a phone (iOS or Android simulator/device)**: confirm the branded viewfinder
   (grid, corner brackets, camera icon, hint text, small gear chip) renders correctly; press
   "Escanear carta," or submit the search field, or tap the dashed upload box, and confirm the
   viewfinder switches to its "found" look (glowing scan line, checkmark, "¡Carta encontrada!")
   and the card-detail panel appears below it with Dragón Eterno's info. Try the condition chips,
   the quantity +/− stepper, the "Gradeada" toggle, "Cambiar" (should cycle to the next sample
   card), "Eliminar" (should clear back to the empty state), and "Aceptar" (should show a brief
   confirmation, then also clear). Then switch to another tab (e.g. Cartera) and back to Escanear
   — confirm it's back to its empty/idle look, not still showing the card you found.

4. **Escanear on a wide browser window (≥768px)**: confirm there is genuinely **no** camera
   viewfinder, no "Escanear carta" button, and no "Camera available" badge anywhere on the page —
   only a title, the search field, and the upload box on the left, with results on the right.
   Trigger a result the same way as step 3 (search or upload) and confirm the right side swaps
   from the empty message to the found-card panel, with the "recent scans" list still visible
   underneath it. Then shrink the browser window below ~768px and confirm it collapses to a single
   column, with the camera UI still absent.

5. **Cartera, Trades, Perfil**: select each from the navigation and confirm each shows its own
   distinct "nothing here yet" message (not each other's text, not a blank/error page), with the
   same navigation bar and top icon row still visible around it.

6. **Confirm `/amigos` and `/social` are truly gone**: with a real logged-in session, try
   navigating directly to those URLs (web) — they should show the app's normal "page not found"
   screen, not the old Amigos/Social screens (which no longer exist in the code) and not a crash.
   This specific check has never been possible in the sandbox that built this feature, because the
   login wall intercepts before the app even gets to look at the URL.

7. **The four top-right icons** (language flags, currency, notifications, messages) on every one
   of the five screens above: confirm they're visible, look reasonable at a glance, and that
   tapping each shows a small "not available yet" message rather than doing nothing. Look
   specifically at the language icon's flag-shaped chips (a small rectangle with Mexico's
   green/white/red bands and one with the USA's red/white stripes + blue corner) — these have only
   been checked by inspecting their code structure, never actually looked at.

8. **Screen reader pass**: with VoiceOver (iOS) or TalkBack (Android) turned on, swipe through
   Inicio, Escanear (both states), and the three placeholder screens, and confirm every button/
   link announces something sensible (not just "button" with no name) — the code has real
   accessibility labels everywhere, but no one has listened to them read aloud yet.

9. **Keyboard-only pass on a real browser** (no mouse): press Tab repeatedly from the top of any
   screen and confirm you can reach every navigation link and every one of the five destinations,
   with a visible focus outline at each stop, in a sensible left-to-right/top-to-bottom order.

10. **Resize a real browser window down to about 375px wide** (a small phone's width) on each of
    the five screens, and also check a real tablet if you have one — confirm nothing gets cut off,
    nothing requires horizontal scrolling, and every button/link stays easy to tap.

None of the above is a reason to doubt the code itself — the automated test suite (478 tests),
the type-checker, and all three platform builds are genuinely clean, and everything in this list
is exactly the class of check that requires an actual screen and a human, not more code review.

## Verdict

**APPROVE WITH NITS.**

**What this approval covers**: Round 7's fixes (Findings 1–3, all fully and correctly closed —
`ScanEntryCard`'s `label` prop is genuinely additive, Inicio's quick-action card now reads and
announces "Escanear una carta"/"Scan a card" in both locales, `home.ts`'s `scanQuickActionLabel`
key is no longer dead, the two module READMEs and the stale test comment/mock are all fixed) and
Phase 7 (T033–T037, a real, if narrow, code fix — `WebSidebarNav.tsx`'s explicit `minWidth: 44` —
plus an honest, accurate audit of everything else, with no overclaimed coverage found). All 38
`tasks.md` items are `[X]`; `tsc`, the full 478-test suite, and `./init.sh` (10/10 stages) are all
genuinely green, independently re-run by this review, not taken on the implementer's word. Every
`FR-00x`/`SC-00x` in `spec.md` traces to a real, currently-passing test. All three standing
invariants (no live camera import, empty diff on the three KYC-gate files, no live import of any
retired Amigos/Social component) hold, independently re-verified. A dedicated sweep for a fourth
instance of the "half-updated artifact" pattern (after `backLabel`, `navigation/README.md`,
`scanQuickActionLabel`) found none — every i18n key, every domain export, and every touched
module README is consistent with what actually ships.

**What this approval does not cover**: (1) `progress/current.md` is still stale (describes Phase
2 as the most recent completed phase) — a real, empty C2 checkbox, explicitly the orchestrator's
job to close before/as part of marking this feature `done`, not a code defect and not
task-implementer's to fix. (2) Nothing in this feature has ever been seen rendering on a real
browser, simulator, or device — every screen sits behind a KYC gate this sandbox's blank Supabase
credentials cannot get past, a constraint disclosed honestly and consistently across all ten
implementation runs and every review round. §7 above is the concrete, screen-by-screen list a
human must walk before this feature is trusted in production; T033/T034's own "still needs a
human" list (`progress/impl_008-scan-experience.md`, Run 10) was independently checked against
this review's own pass and found accurate and essentially complete, with nothing overclaimed as
covered.

**Recommendation**: the code itself is ready. Before flipping `feature_list.json`'s
`008-scan-experience` to `done`, the orchestrator should refresh `progress/current.md` (C2) and
add the session's `progress/history.md` entry (C5) — both explicitly deferred bookkeeping, not
new findings — and the human should work through §7's hand-off list once real Supabase
credentials exist.
