# Tasks: Home Visual Alignment (Inicio restyle)

**Input**: Design documents from `specs/012-home-visual-alignment/` (`spec.md`, `plan.md`)

**Tests**: Included. `docs/verification.md` mandates unit/component tests for every changed
component and a computed (not eyeballed) contrast regression case for every new text-on-
background pairing; all needed test tooling already exists (`jest-expo` + `@testing-library/
react-native`, installed by `001-registration-kyc`'s T001) — no test-tooling *setup* task is
needed for this feature.

**Organization**: Tasks are grouped by user story from `spec.md`. There is no separate Setup
phase — this feature adds no new runtime dependency. A small Foundational phase adds the one new
contrast regression case both user stories' new pairings need covered before either screen change
ships. User Story 1 (card restyle, P1) is sequenced before User Story 2 (brand-block removal,
P2) per spec.md's stated priority — it's both the higher-visibility fix (the human's original
complaint) and the one with a genuinely new visual treatment to get right, vs. User Story 2's
mostly-deletion shape.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 (card restyle, P1), US2 (brand-block removal, P2)
- File paths are exact; see `plan.md`'s Project Structure for the full tree

---

## Phase 1: Foundational (Blocking Prerequisite)

**Purpose**: The one new contrast regression case both user stories' new pairings ultimately rely
on being provably safe. **Neither US1 nor US2's component edits should be considered done until
this passes**, but this task itself has no file dependency on either and can be written first or
in parallel with early US1 work.

- [ ] T001 Add one new case to `src/theme/contrast.test.ts`: `contrastRatio(colors.text.primary,
  colors.bg.surface) >= 4.5` (the card label's new pairing, spec.md FR-010/US1 AS2) — reading the
  **real** `colors` export from `src/theme/colors.ts`, not a hardcoded duplicate hex string,
  mirroring every existing case in this file exactly. Do **not** add a separate case for the
  badge's "+" glyph (`colors.brand.onPrimary` on `colors.brand.primary`) — that pairing is
  already covered by this file's existing "brand.onPrimary on brand.primary" case
  (`006-visual-identity`), reused verbatim, not duplicated. Confirm the new case passes (expected:
  ~15.67:1, comfortably clears 4.5:1). *(FR-010, SC-002)*

**Checkpoint**: The one new text-on-background pairing this feature introduces is provably safe
before either screen's restyle lands.

---

## Phase 2: User Story 1 - The "Escanear una carta" card reads as the same brand as the rest of the app (Priority: P1)

**Goal**: `ScanEntryCard.tsx` renders the "soft surface + lime badge" treatment (spec.md
Decisions already made, item 1) with zero raw hex literal, unchanged aspect ratio/tap target, and
the platform-appropriate shadow via the existing token split.

**Independent Test**: Per spec.md — render `ScanEntryCard` in isolation (both with and without a
`label`) and confirm the surface fill/radius/dashed border/shadow/badge fill render as specified,
the existing aspect-ratio and accessibility-label assertions still pass, and the file contains
zero raw hex literals.

### Implementation for User Story 1

- [ ] T002 [US1] Restyle `src/features/scanner/ScanEntryCard.tsx`:
  - Replace the outer `Pressable`'s `card` style: drop `borderWidth: 2, borderColor: "#111827"`
    and the hardcoded `borderRadius: 16`; add `backgroundColor: colors.bg.surface`, `borderRadius:
    radius.card`, `borderWidth: 1, borderStyle: "dashed", borderColor: colors.border.dashed`.
    Apply `shadowSurface` as a trailing entry in the `style` array prop
    (`style={[styles.card, shadowSurface]}`) — the same pattern `PrimaryButton.tsx` already uses
    for `shadowRaised`, **not** spread inside `StyleSheet.create` (plan.md's Research Decisions —
    a spread there would defeat Metro's per-platform resolution of the imported value). Keep
    `width`/`height`/`minWidth`/`minHeight`/`alignItems`/`justifyContent`/`gap` exactly as they
    are (spec.md FR-005 — the aspect ratio and tap-target floor must not change).
  - Wrap the "+" glyph in a new circular `View` (`width`/`height`: `CONTROL_HEIGHT`, `borderRadius:
    radius.pill`, `backgroundColor: colors.brand.primary`, `alignItems`/`justifyContent: "center"`)
    — the badge. The "+" `Text` inside it changes color from `"#111827"` to `colors.brand.
    onPrimary`; its `fontSize`/`fontWeight` are otherwise unchanged.
  - The optional `label` `Text`, when provided, stays a **sibling of the badge**, not a child of
    it — change its color from `"#111827"` to `colors.text.primary`; `fontSize`/`fontWeight`/
    `textAlign`/`paddingHorizontal` are otherwise unchanged.
  - Import `colors`, `radius`, `CONTROL_HEIGHT`, `shadowSurface` from `@/theme` (the existing
    barrel export, mirroring `PrimaryButton.tsx`'s import line exactly).
  - Correct the stale doc comment above `ScanEntryCardProps.label` per plan.md's Research
    Decisions — state plainly that `HomeScreen.tsx` is confirmed (as of this feature) the sole
    caller, rather than reasoning about an unverified "other/future caller."
  - Confirm, by grep, that zero raw hex literals (`#[0-9a-fA-F]{3,6}`) remain in this file after
    the edit (SC-001). Depends on: T001 (the contrast case this restyle relies on must exist and
    pass first). *(FR-001, FR-002, FR-003, FR-004, FR-005, FR-011, US1 AS1–AS5)*
- [ ] T003 [US1] Extend `src/features/scanner/ScanEntryCard.test.tsx`: **run the existing suite
  first and confirm every current assertion passes unmodified** — the aspect-ratio/tap-target
  test, the default-accessibility-label test, the `onPress` test, the no-label/with-label
  visible-text tests. Add new assertions: the outer card's flattened style includes `colors.bg.
  surface` as `backgroundColor`, `radius.card` as `borderRadius`, `borderStyle: "dashed"` with
  `colors.border.dashed` as `borderColor`, and a shadow property present (e.g. `shadowOpacity`/
  `shadowColor` on native, or the imported `shadowSurface` object's own keys present in the
  flattened style — assert against the real imported `shadowSurface`/`colors`/`radius` values,
  not hardcoded duplicates, mirroring `contrast.test.ts`'s own established convention); the "+"
  glyph's rendered color is `colors.brand.onPrimary`; when a `label` is provided, its rendered
  color is `colors.text.primary`. Depends on: T002. *(US1 AS1–AS5)*

**Checkpoint**: User Story 1 complete — `ScanEntryCard` matches the app's shared visual language,
independently verifiable in isolation without `HomeScreen` changing at all.

---

## Phase 3: User Story 2 - Inicio shows the brand once, not twice, with no dead layout gap (Priority: P2)

**Goal**: `HomeScreen.tsx` renders a single "Inicio" heading (no `BrandMark`, no tagline) and
the heading + restyled card read as one balanced, centered group — verified live, not only by
static reasoning.

**Independent Test**: Per spec.md — render `HomeScreen` and confirm no `BrandMark`/tagline
renders and exactly one `header`-role element ("Inicio") exists; confirm existing test IDs
(`home-screen`, `home-screen-centre`, `scan-entry-card`) still resolve; separately, render the
full screen at a mobile-width and a desktop-width web viewport and confirm no dead vertical gap.

### Implementation for User Story 2

- [ ] T004 [US2] Modify `src/features/navigation/HomeScreen.tsx`:
  - Remove the `brandBlock` `View` entirely, along with the `BrandMark` import/usage, the
    `display.xl`-styled title `Text`, and the tagline `Text` (`t("tagline")`).
  - Introduce one new outer `View` (or repurpose the existing `container`/content structure) that
    centers its children as a single group: `flex: 1, alignItems: "center", justifyContent:
    "center", gap: space.xxl` (plan.md's Research Decisions — replacing the prior top-anchored-
    block-plus-separately-centered-block split). This wraps: (a) the heading `Text`
    (`accessibilityRole="header"`, `t("title")`, kept styled with `typography.display.xl`
    initially) and (b) the existing `home-screen-centre` `View` (unchanged test ID, still wrapping
    only `ScanEntryCard`).
  - Keep the `ScrollView` wrapper (`testID="home-screen"`) and its `flexGrow: 1` content-container
    style exactly as-is — this feature must not reintroduce the pre-`004-home-scan-shell`
    landscape-clipping bug that `ScrollView` fixes.
  - Keep the `NAV_DESTINATIONS`-lookup `handleScanEntryPress` function completely unchanged
    (spec.md FR-012) — this task touches only the returned JSX/styles.
  - Update the top-of-file comment describing this screen's content to reflect the single-heading,
    no-`BrandMark` reality (the existing comment references the now-removed `BrandMark`/tagline
    block explicitly and would otherwise go stale). Depends on: T002 (renders the restyled
    `ScanEntryCard`, so this task should land after the card itself is restyled, even though the
    two files are otherwise independent). *(FR-006, FR-007, FR-009, FR-012, US2 AS1, AS4)*
- [ ] T005 [US2] Modify `src/domain/i18n/copy/home.ts`: remove the `tagline` key from both the
  `es` and `en` dictionaries (plan.md's Research Decisions — its only call site is removed by
  T004). Confirm `src/domain/i18n/copy/home.test.ts` still passes with no code change needed (its
  parity/no-empty-value checks are key-count-agnostic). Depends on: T004. *(FR-008, US2 AS3)*
- [ ] T006 [US2] Rewrite the first test in `src/features/navigation/HomeScreen.test.tsx`
  ("renders the BrandMark, title, and tagline in the brand block") to match the new structure: no
  more `home-screen-brand-block`/`BrandMark`-label/tagline-text assertions; instead assert exactly
  one `getByRole("header", { name: "Inicio" })` exists on the screen, and that `queryByLabelText
  ("Draw a Card")` / `queryByText(homeCopy.es.tagline)`-style assertions are **not** present (since
  `homeCopy.es.tagline` no longer exists after T005, reference the literal removed string directly
  in a comment, not a now-nonexistent `homeCopy` key). Confirm every *other* existing test in this
  file (the "no longer renders the Amigos pill..." test, the scan-entry-card localized-text tests,
  the `ScrollView` regression guard, the navigation test) passes unmodified — these do not
  reference the brand block and are unaffected by T004/T005. Depends on: T004, T005. *(FR-014,
  US2 AS1, AS5, AS6)*
- [ ] T007 [US2] Confirm `src/features/navigation/HomeScreen.integration.test.tsx` and
  `app/(app)/index.test.tsx` still pass unmodified — both were grepped during spec-writing and
  confirmed to reference only `homeCopy.scanQuickActionLabel`/the `home-screen` test ID, neither
  of which this feature touches. If either needs any change, it must be limited to whatever T004/
  T005 actually altered, never a new assertion unrelated to this feature's scope. Depends on: T004,
  T005, T006. *(SC-003)*

**Checkpoint**: User Story 2 complete — Inicio's brand appears exactly once (via `ShellHeader`
alone), with a single heading and no structural duplication left in `HomeScreen.tsx`.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [ ] T008 Manual smoke check (Level 3, `docs/verification.md`): apply the temporary, non-
  committed `BYPASS_GATE` workaround (spec.md Edge Cases) against the already-running `npm run
  web` dev server — do not spawn a second one. Confirm, per plan.md's Quickstart Validation steps
  1–5: the shell header shows the brand exactly once; Inicio shows one "Inicio" heading and the
  restyled card with no dead vertical gap, at both a mobile-width and a desktop-width viewport;
  pressing the card still navigates to `/escanear`; both locales render correctly. If the heading's
  `typography.display.xl` sizing reads oversized now that it renders alone (without the 72px
  `BrandMark` it was originally sized against), step it down to `typography.display.lg` per
  plan.md's explicitly allowed adjustment — record whichever outcome was chosen and why in
  `progress/impl_012-home-visual-alignment.md`. **Revert the `BYPASS_GATE` workaround** (`git
  checkout app/_layout.tsx`) and confirm `git status` shows no diff to `app/_layout.tsx` before
  continuing. Depends on: T003, T006, T007. *(FR-009, SC-004, SC-005)*
- [ ] T009 Repeat T008's steps 2–4 on an iOS simulator if one is available in this environment —
  confirm the shadow renders as a real native shadow and the badge/label layout looks correct at
  a physically smaller viewport. If no simulator is available, disclose that plainly in `progress/
  impl_012-home-visual-alignment.md` rather than silently skipping it (this repo's own documented
  "green tests, broken app" history — `docs/verification.md`). Depends on: T008.
- [ ] T010 Run the **full** existing test suite (`npm test`, not a filtered subset) and confirm
  every pre-existing test outside this feature's own modified files still passes — this is the
  explicit regression check for `ScanEntryCard`'s single call site and `HomeScreen`'s copy/test
  changes. If any pre-existing test fails because it asserted a now-changed visual detail, fix the
  *test* to assert behavior/role/text instead (per `docs/conventions.md`'s testing guidance),
  never silently revert this feature's restyle to make an unrelated test pass. Depends on: T008.
- [ ] T011 Run `grep -n "#[0-9a-fA-F]\{3,6\}" src/features/scanner/ScanEntryCard.tsx` one more
  time after all edits, to catch any last-minute literal creep (SC-001), and confirm `src/theme/
  contrast.test.ts` (T001) is still green. Depends on: T010.
- [ ] T012 Run `./init.sh` end to end (no `--skip-*` flags) and confirm `RESULT: SUCCESS` — Tests
  stage OK, type-check clean, no native-dependency-alignment concern (no new dependency was
  added), and all three bundle exports (web/iOS/Android) clean. Depends on: T011.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: T001 — BLOCKS T002 (the card restyle relies on the label-on-surface
  pairing being provably safe before it ships).
- **User Story 1 (Phase 2, P1)**: Depends on T001. Internally sequential (T002 restyle → T003
  test extension).
- **User Story 2 (Phase 3, P2)**: Depends on T002 (renders the restyled card, so this phase's
  live-verification steps see the finished US1 treatment) — not on T001 directly. Internally
  mostly sequential (T004 → T005 → T006 → T007).
- **Polish (Phase 4)**: Depends on both user stories being complete (T003, T006, T007).

### Parallel Opportunities

- T001 has no file dependency on T002/T004 and could be written first or alongside early US1 work
  — but per Constitution VII and this feature's own FR-010, the case must exist and pass before
  T002's restyle is considered done, so it is sequenced first here for a clean, unambiguous order
  rather than genuinely run in parallel.
- T008 and T009 are sequential (T009 repeats T008's steps on a second platform) rather than
  parallel, since T009's disclosure depends on whether a simulator is actually available once T008
  has already established the workaround/revert cycle works on web.
- T010 and T011 could run in parallel with each other (different concerns, no file dependency) but
  are sequenced here so T011's grep check runs against the exact same tree T010's full suite ran
  against, avoiding any ambiguity about which state was verified.

---

## Implementation Strategy

### The Visible Fix First, Then the Deletion

1. Complete Phase 1 (T001) — the one new contrast case, quick and foundational.
2. Complete Phase 2 (User Story 1, the card restyle) — this is the specific element the human
   flagged as "off," so it ships first and is independently verifiable without touching
   `HomeScreen.tsx` at all.
3. **STOP and VALIDATE**: confirm `ScanEntryCard.test.tsx`'s full suite (existing + new
   assertions) is green before starting Phase 3.
4. Complete Phase 3 (User Story 2, brand-block removal) — lower risk, mostly deletion, and now
   visually composable against the already-restyled card from step 2.
5. Complete Phase 4 (Polish) — the live smoke check (T008/T009, including the mandatory
   `BYPASS_GATE` revert), the full-suite regression run (T010), and `./init.sh` (T012) are the
   final gate before this feature can be marked `done`.
