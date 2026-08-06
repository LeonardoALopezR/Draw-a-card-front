# Tasks: Scan Experience

**Input**: Design documents from `specs/008-scan-experience/` (`spec.md`, `plan.md`)

**Tests**: Included. `docs/verification.md` mandates unit tests for every `src/domain` export and
component/screen tests for every new/changed screen; test tooling already exists (installed by
`001-registration-kyc`), so no setup task is needed here — this feature starts directly at
Phase 2 (Foundational), same as `004-home-scan-shell`. This feature also adds no new runtime
dependency (`plan.md`'s Technical Context — every icon it needs is already available via
`@expo/vector-icons`, and the language control's flag badge is hand-drawn, not a new package).

**Organization**: Tasks are grouped by user story from `spec.md`, in priority order. User
Stories 1 (shell + shared header) and 2 (found-state domain logic) are both P1/Foundational —
neither Escanear variant (US3/US4) can be built without them, so both land in Phase 2, mirroring
how `006-visual-identity`'s tasks.md handled its own two Foundational-priority stories. User
Story 3 (mobile Escanear) is sequenced before User Story 4 (web Escanear) since mobile carries
the full viewfinder/button surface `006` already partly built, giving it more existing code to
regress against. User Story 5 (Inicio redesign, P2) is sequenced before User Story 6
(Cartera/Trades/Perfil + Amigos/Social retirement, P3) because retiring
`AmigosQuickAccessPill.tsx` (US6) requires `HomeScreen.tsx` to have already stopped importing it
(US5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 (shell + shared header, P1), US2 (found-state domain logic, P1), US3 (mobile
  Escanear, P1), US4 (web Escanear, P1), US5 (Inicio redesign, P2), US6 (Cartera/Trades/Perfil +
  Amigos/Social retirement, P3)
- File paths are exact; see `plan.md`'s Project Structure for the full tree

---

## Phase 1: Setup

**Skipped — no new setup needed.** Test tooling already exists (`001-registration-kyc`'s T001),
and this feature adds no new runtime dependency (`plan.md`'s Research Decisions confirm every
icon needed is already available via the installed `@expo/vector-icons`, and the language
control's flag badge is hand-drawn `View`/`Text`, not a new package).

---

## Phase 2: Foundational (Blocking Prerequisites — User Stories 1 & 2)

**Purpose**: The 5-destination table, the shared shell header/icon controls, the i18n
dictionaries this feature needs, and the portable found-card state machine every Escanear variant
consumes. **No Escanear/Inicio/placeholder task (Phase 3+) starts before this phase is done.**

### Domain layer

- [X] T001 [P] Modify `src/domain/navigation.ts`: change `NavDestinationKey` to `"inicio" |
  "escanear" | "cartera" | "trades" | "perfil"`; replace `NAV_DESTINATIONS`' three entries with
  five — `{ key: "inicio", route: "/", label: "Inicio" }`, `{ key: "escanear", route:
  "/escanear", label: "Escanear" }`, `{ key: "cartera", route: "/cartera", label: "Cartera" }`,
  `{ key: "trades", route: "/trades", label: "Trades" }`, `{ key: "perfil", route: "/perfil",
  label: "Perfil" }`. Remove the `SCAN_ROUTE` export (no longer needed — Escanear is looked up
  from `NAV_DESTINATIONS` like every other destination, see US5). Leave `BREAKPOINT_PX`/
  `resolveWebNavLayout` untouched. Update `src/domain/navigation.test.ts`: five entries with
  unique `key`/`route` values in the documented order; `resolveWebNavLayout`'s existing
  boundary tests unchanged. *(FR-001, spec.md Clarifications Recorded default 2)*
- [X] T002 [P] Create `src/domain/scanResults.ts`: export `ConditionOption` (`"nearMint" |
  "excellent" | "veryGood" | "good" | "fair"`), `CONDITION_OPTIONS` (the five in that order),
  `SampleCard` interface (`id`, `name`, `setLabel`, `code`, `grade`, `priceLabel`,
  `thumbnailColorToken`, `defaultCondition`, `defaultGraded`), `SAMPLE_CARDS` (exactly the three
  mockup-specified cards — Dragón Eterno/Genesis/GEN-001/PSA 10/$45,000, Fénix de
  Tormenta/Arcana/ARC-047/BGS 9.5/$12,500, Serpiente del Vacío/Genesis/GEN-022/PSA 9/$8,900, each
  `defaultCondition: "nearMint"`, `defaultGraded: true` — reusing `src/theme`'s existing color
  tokens for `thumbnailColorToken`, never a raw hex), `MIN_QUANTITY = 1`, `FoundCardState`
  interface (`card`, `condition`, `graded`, `quantity`), and pure functions
  `startFoundState(card)`, `selectCondition(state, condition)`, `toggleGraded(state)`,
  `incrementQuantity(state)`, `decrementQuantity(state)` (clamped at `MIN_QUANTITY`),
  `advanceToNextCard(state)` (cycles `SAMPLE_CARDS`, re-seeding condition/graded/quantity to the
  next card's own defaults), `formatListMeta(card)` (`"${grade} · ${code}"`),
  `formatDetailMeta(card)` (`"${setLabel} · ${code}"`). Zero React/React Native import. Create
  `src/domain/scanResults.test.ts` covering: `advanceToNextCard` cycles through all three and
  wraps back to the first, resetting condition/graded/quantity each time; `decrementQuantity`
  never drops below `MIN_QUANTITY`; `incrementQuantity` increases by 1; `toggleGraded` flips the
  boolean only; `formatListMeta`/`formatDetailMeta` produce the exact documented strings for
  `SAMPLE_CARDS[0]`. *(FR-007, FR-008, FR-009, FR-010, spec.md Key Entities)*
- [X] T003 [P] Create `src/domain/i18n/copy/nav.ts` + `.test.ts`: `{ es: {...}, en: {...} }`
  covering the five destination labels (Inicio/Escanear/Cartera/Trades/Perfil — English
  equivalents Home/Scan/Wallet/Trades/Profile), each icon control's accessibility label
  (language, currency, notifications, messages — "not yet available" phrasing, matching `004`'s
  established sentence shape) and its "not yet available" inline feedback text, and the web
  sidebar's brand wordmark/tagline strings. Same `Record<keyof typeof es, string>` + key-parity
  test pattern `006-visual-identity`'s `copy/login.ts`/`copy/scan.ts` already established.
  *(FR-011, FR-012, FR-017)*
- [X] T004 [P] Create `src/domain/i18n/copy/home.ts` + `.test.ts`: Inicio's title, tagline, and
  quick-action card label ("Escanear una carta" / "Scan a card"), same pattern as T003.
  *(FR-013, FR-017)*
- [X] T005 [P] Create `src/domain/i18n/copy/placeholders.ts` + `.test.ts`: title + body copy for
  Cartera, Trades, and Perfil, each explicitly stating "no content yet" in both locales — same
  pattern as T003. *(FR-015, FR-017)*
- [X] T006 [P] Extend `src/domain/i18n/copy/scan.ts` + `.test.ts`: add keys for the found
  viewfinder state (`viewfinderFoundHeading`: "¡Carta encontrada!"), the found panel
  (`gradedLabel`: "Gradeada", `gradeValuePlaceholder`: "—", `removeLink`: "Eliminar",
  `changeLink`: "Cambiar", `quantityLabel`: "Cantidad", `marketPriceLabel`: "Precio de mercado",
  `acceptButton`: "Aceptar", `acceptedConfirmation`: a brief confirmation string, e.g. "Carta
  agregada"), and the five condition-chip labels ("Near Mint"/"Excellent"/"Very Good"/"Good"/
  "Fair" and their Spanish equivalents, keyed by `ConditionOption`, T002). Update
  `uploadDropzone`'s existing key's accessibility framing if needed now that the dropzone becomes
  interactive (US3/US4). Key-parity test extended to cover the new keys. *(FR-008, FR-009,
  FR-017)*

### Shell chrome (User Story 1)

- [X] T007 [P] [US1] Modify `src/features/navigation/TopRightControls.tsx`: replace the four
  bordered text buttons with icon buttons — a new local `FlagBadge` subcomponent (a small
  rounded chip rendering `"MX"`/`"US"` text on `src/theme` tokens, no new asset/dependency, per
  `plan.md`'s Research Decision) for language, `@expo/vector-icons`' `cash-outline` for currency,
  `notifications-outline` for notifications, `chatbubble-outline` for messages. Keep the existing
  "press → inline 'not yet available' text" local-state feedback mechanism unchanged (`004`'s
  established pattern). Every button's `accessibilityLabel` and feedback text now read from
  `useTranslation(navCopy)` (T003) instead of the hardcoded English literals `004` shipped.
  Update `src/features/navigation/TopRightControls.test.tsx`: assert icon-only rendering (no
  visible "ENG/ESP"-style text label), the same four accessibility labels/feedback behavior as
  before, both locales. *(FR-011, FR-012, SC-004, SC-005, SC-006)*
- [X] T008 [US1] Create `src/features/navigation/ShellHeader.tsx` + `.test.tsx`: a thin,
  `useSafeAreaInsets()`-aware wrapper positioning `TopRightControls` (T007) top-right, reusing
  the exact safe-area padding logic `HomeScreen.tsx` applied to its own top row in `004`. No
  props. Test: renders `TopRightControls`' four controls; snapshot-free assertion that padding
  reflects `insets.top`/`insets.right` (mock `useSafeAreaInsets`). Depends on: T007. *(FR-011)*
- [X] T009 [US1] Modify `app/(app)/_layout.tsx`: update `TAB_SCREEN_NAMES`/`TAB_ICONS` for the
  five `NavDestinationKey` values (T001) — `inicio` → `"index"`/`home`, `escanear` →
  `"escanear"`/`scan-outline`, `cartera` → `"cartera"`/`briefcase-outline`, `trades` →
  `"trades"`/`swap-horizontal-outline`, `perfil` → `"perfil"`/`person-outline` — each with an
  explicit `tabBarAccessibilityLabel` (unchanged mechanism from `004`). Add
  `screenOptions={{ headerShown: true, header: () => <ShellHeader /> }}` (replacing the previous
  `headerShown: false`) so `ShellHeader` (T008) renders above every one of the five tab screens
  without any of them rendering it themselves. Depends on: T001, T008. *(FR-001, FR-002, FR-011)*
- [X] T010 [P] [US1] Modify `src/features/navigation/WebSidebarNav.tsx`: render the five
  `NAV_DESTINATIONS` (T001, unchanged rendering logic — just more entries) with per-destination
  icons matching T009's set; add a compact brand block at the top of the sidebar (`BrandMark` +
  serif wordmark, `useTranslation(navCopy)` for the wordmark/tagline text, T003) — no user-
  profile/account-tier block (spec.md Assumptions); render `ShellHeader` (T008) above the
  existing `<Slot />` in the content column. Update `WebSidebarNav.test.tsx`: five destinations
  render with correct roles/labels and keyboard reachability (same technique as `004`'s existing
  test); the brand block renders; `ShellHeader`'s four controls render in the content column.
  Depends on: T001, T008. *(FR-001, FR-011, SC-002)*
- [X] T011 [P] [US1] Modify `src/features/navigation/WebBottomBarNav.tsx`: render the five
  `NAV_DESTINATIONS` (T001) with the same icon set as T009/T010; render `ShellHeader` (T008)
  above the existing `<Slot />`. Update `WebBottomBarNav.test.tsx`: five-destination coverage,
  `ShellHeader`'s controls render. Depends on: T001, T008. *(FR-001, FR-011, SC-002, SC-003)*
- [X] T012 [US1] Confirm `app/(app)/_layout.web.tsx` needs no change (it only calls
  `resolveWebNavLayout(width)`, T001, unchanged signature) — update
  `src/features/navigation/AppWebLayout.test.tsx` only if it hardcoded any assumption about the
  old three-destination set; otherwise leave untouched. Depends on: T010, T011.

**Checkpoint**: The 5-destination shell and its single shared header/icon-control row exist,
render on every destination, and are unit/component-tested. No Escanear/Inicio/placeholder
screen content has changed yet.

### Found-state domain logic (User Story 2)

- [X] T013 [P] [US2] Create `src/features/scanner/useScanSimulation.ts` + `.test.tsx`: a
  `useState<FoundCardState | null>` hook wrapping `src/domain/scanResults.ts`'s (T002) pure
  functions — exposes `result`, `triggerScan()` (idle → `startFoundState(SAMPLE_CARDS[0])`),
  `changeCard()` (→ `advanceToNextCard`), `removeCard()` (→ `null`), `acceptCard()` (sets a
  brief local `confirming` flag, then clears to `null`), `selectCondition`, `toggleGraded`,
  `incrementQuantity`, `decrementQuantity` — each a thin pass-through, no logic duplicated from
  T002. Test (via a minimal test-harness component, RNTL): `triggerScan()` then `changeCard()`
  then `removeCard()` walk through the expected states; `acceptCard()` briefly shows a confirming
  state then returns to idle. Depends on: T002. *(FR-007, FR-009, spec.md User Story 2)*
- [X] T014 [US2] Create `src/features/scanner/FoundCardPanel.tsx` + `.test.tsx`: the shared
  found-card detail panel — thumbnail (`thumbnailColorToken`), `name` (bold serif), `
  formatDetailMeta(card)` (T002), a solid `grade` pill and a green `priceLabel` pill, "Eliminar"/
  "Cambiar" text links (red/blue per the mockup, calling the `onRemove`/`onChange` props), a
  "Gradeada" toggle + read-only grade-value field (dash placeholder when off), a five-option
  condition-chip row (`CONDITION_OPTIONS`, T002, labels via `useTranslation(scanCopy)`, T006,
  exactly one selected, wraps onto a second row when it doesn't fit), a quantity −/+ stepper
  (disables "−" at `MIN_QUANTITY`), the market price row, and an "Aceptar" `PrimaryButton`
  (`src/features/ui/PrimaryButton`). All props-driven (`state: FoundCardState`, `onSelectCondition
  `, `onToggleGraded`, `onIncrement`, `onDecrement`, `onChange`, `onRemove`, `onAccept`) — no
  internal fetch, no direct `useScanSimulation()` call (keeps this a pure "render this data, call
  this handler" component per Constitution IV, reusable inline (mobile) and in a side column
  (web)). Test: renders the documented fields for `SAMPLE_CARDS[0]`; selecting a different
  condition chip calls `onSelectCondition` with that option and only one chip ever shows
  selected; the stepper's "−" is disabled at `MIN_QUANTITY`; toggling "Gradeada" calls
  `onToggleGraded` and the grade-value field's visible text follows the `graded` prop; "Cambiar"/
  "Eliminar"/"Aceptar" call their respective handlers. Depends on: T002, T006. *(FR-008, FR-009,
  spec.md User Story 2 AS1–AS4)*

**Checkpoint**: Phase 2 complete. The 5-destination shell, shared header, i18n dictionaries, and
the found-card domain logic + shared panel component all exist and are tested. No `Escanear`/
`Inicio`/placeholder screen has been rewired yet.

---

## Phase 3: User Story 3 - Escanear on mobile: the full camera-style shell, with a working local "found" trigger (Priority: P1)

**Goal**: iOS/Android Escanear renders the branded viewfinder (idle and found), search field,
upload dropzone, and an enabled "Escanear carta" button; triggering it shows the found panel
inline, driven by `useScanSimulation()`.

**Independent Test**: Per spec.md — render Escanear at a mobile width, trigger the found state
via the button/search/dropzone, confirm the viewfinder switches to its found drawing and the
found panel appears inline with the shell intact around it.

### Implementation for User Story 3

- [X] T015 [P] [US3] Modify `src/features/scanner/Viewfinder.tsx`: accept a `state: "idle" |
  "found"` prop (default `"idle"`). `"found"` replaces the grid/brackets/camera-glyph/hint with a
  glowing horizontal `brand.primary` scan line, a check glyph, and
  `t("viewfinderFoundHeading")` (T006) — the gear chip stays in both states. Zero camera-module
  import (unchanged constraint). Update `Viewfinder.test.tsx`: `"idle"` renders the existing
  grid/brackets/hint; `"found"` renders the check glyph + "¡Carta encontrada!" and not the idle
  hint text. Depends on: T006. *(FR-004, spec.md User Story 3 AS2)*
- [X] T016 [P] [US3] Modify `src/features/scanner/ScanSearchField.tsx`: accept an optional
  `onSubmit?: () => void`, wired to the `TextInput`'s `onSubmitEditing` and the (now-pressable)
  trailing magnifier glyph. Update `ScanSearchField.test.tsx`: submitting the field and pressing
  the magnifier both call `onSubmit`; omitting the prop renders exactly as before (no crash).
  *(FR-007)*
- [X] T017 [P] [US3] Modify `src/features/scanner/UploadDropzone.tsx`: becomes a real `Pressable`
  with `accessibilityRole="button"`, a real `accessibilityLabel` (T006's `uploadDropzone` copy),
  and an `onPress` prop — a disclosed behavior change from `006-visual-identity`'s intentionally
  inert version, since this feature makes it a genuine local trigger (spec.md FR-007; note this
  explicitly in a code comment referencing this task). Update `UploadDropzone.test.tsx`:
  confirms `onPress` fires on press, and the accessibility role/label are now present (updating
  the old "not exposed as a button" assertion `006` wrote, since that's now the exact opposite of
  the intended behavior).
- [X] T018 [US3] Modify `src/features/scanner/ScanShellScreen.tsx`: call
  `useScanSimulation()` (T013); pass `Viewfinder` (T015) `state={result ? "found" : "idle"}`;
  wire `ScanSearchField`'s `onSubmit` (T016) and `UploadDropzone`'s `onPress` (T017) to
  `triggerScan()`; enable the "Escanear carta" `PrimaryButton` (`disabled` removed) with
  `onPress={triggerScan}`; render `FoundCardPanel` (T014) inline below the controls, passing
  `useScanSimulation()`'s state/handlers, when `result` is non-null. Update
  `ScanShellScreen.test.tsx`: idle renders the existing controls with an enabled button; pressing
  the button (or submitting search, or tapping the dropzone) shows the found panel with
  `SAMPLE_CARDS[0]`'s data. Depends on: T013, T014, T015, T016, T017. *(FR-004, FR-007, FR-008,
  spec.md User Story 3 AS1–AS3)*
- [X] T019 [US3] Wire the route: create `app/(app)/escanear.tsx` (renders `ScanShellScreen`, T018
  — Metro's platform-extension resolution picks `ScanShellScreen.web.tsx` on web automatically,
  same mechanism `app/scan.tsx` already relied on). **Remove `app/scan.tsx` and
  `app/scan.test.tsx`** in the same task (atomic — `/escanear` is reachable the same instant the
  standalone route disappears, no dangling half-migrated state). Depends on: T009, T018.
  *(FR-003)*
- [X] T020 [US3] Manual smoke check (Level 3, `docs/verification.md`): `npm run web` at a mobile
  width — confirm idle Escanear renders the viewfinder/search/dropzone/enabled button inside the
  five-destination shell; press the button — confirm the viewfinder switches to its found drawing
  and the found panel appears inline with Dragón Eterno's data; confirm navigating to another
  destination and back to Escanear resets to idle (spec.md Edge Cases). Repeat the trigger via
  search-submit and dropzone-tap. Repeat on iOS/Android simulators if available. Record findings
  in `progress/impl_008-scan-experience.md`. Depends on: T019.
- [X] T020a [US3] Standalone follow-up fix (2026-08-05, code-reviewer Round 5 §1 +
  orchestrator decision, option (a)) closing the User Story 3 AS4 gap no Phase 3 task above ever
  owned (T018's own FR traceability cites AS1–AS3 only): add `unmountOnBlur: true`, scoped to the
  Escanear `<Tabs.Screen>` only (not the other four destinations, not shared `screenOptions`), in
  `app/(app)/_layout.tsx`, with a code comment explaining what it closes and the known, accepted
  side effect (remounts Escanear's whole subtree, including scroll position, on every tab-away/
  back — within spec.md's already-accepted no-persistence precedent). Add
  `src/features/navigation/AppNativeLayout.test.tsx` (colocated per `docs/conventions.md`'s
  `_layout.*` exception, not `app/(app)/_layout.test.tsx`) asserting the option is set on the
  Escanear `<Tabs.Screen>`'s config only, via shallow-rendering `AppTabsLayout` — the navigator
  option itself is never executed by the component under test, so this asserts config, not a
  simulated tab blur. Depends on: T009 (already `[X]`). Not part of Phase 3's original scope —
  see `progress/impl_008-scan-experience.md`'s dedicated follow-up entry.

**Checkpoint**: User Story 3 complete — mobile Escanear is fully functional, inside the shell,
with a working local found-state loop.

---

## Phase 4: User Story 4 - Escanear on web: search and upload only, no camera, with a side detail panel (Priority: P1)

**Goal**: Web Escanear (≥768px) renders a two-column layout with no viewfinder/button/camera
badge; triggering the found state via search or upload replaces the empty-results panel with
`FoundCardPanel`, while the recent-scans list (now reading the shared sample pool) stays visible.

**Independent Test**: Per spec.md — render Escanear at a web width ≥768px, confirm no
viewfinder/button/badge exist anywhere in the rendered output or source, trigger the found state,
confirm the right column swaps panels correctly, and confirm the <768px collapse still works.

### Implementation for User Story 4

- [X] T021 [US4] Modify `src/features/scanner/ScanShellScreen.web.tsx`: remove `Viewfinder`,
  the "Escanear carta" `PrimaryButton`, and the `StatusPill` "Cámara disponible" badge from the
  left column entirely (spec.md FR-005 and its Design-note extension) — left column keeps only
  the title, `ScanSearchField` (T016), and `UploadDropzone` (T017). Call `useScanSimulation()`
  (T013); wire `ScanSearchField`'s `onSubmit` and `UploadDropzone`'s `onPress` to `triggerScan()`.
  Right column renders `EmptyResultsPanel` when idle or `FoundCardPanel` (T014, passing
  `useScanSimulation()`'s state/handlers) when found, always followed by `RecentScansList`
  (unchanged position). Depends on: T013, T014, T016, T017. *(FR-005, FR-006, spec.md User Story
  4 AS1–AS3)*
- [X] T022 [US4] Modify `src/features/scanner/RecentScansList.tsx`: replace the local
  `PLACEHOLDER_ROWS` array with `SAMPLE_CARDS` (`src/domain/scanResults.ts`, T002) and
  `formatListMeta(card)` per row — single source of truth with the found panel (spec.md FR-010),
  replacing `006-visual-identity`'s unrelated Charizard/Blastoise/Venusaur set. Update
  `RecentScansList.test.tsx`: asserts the three mockup-specified rows (Dragón Eterno/Fénix de
  Tormenta/Serpiente del Vacío) render with their `formatListMeta` strings and `priceLabel`s.
  Depends on: T002. *(FR-010)*
- [X] T023 [US4] Modify `src/features/scanner/ScanShellScreen.test.tsx`: extend the migrated
  camera-import source-inspection guard to read every file this feature added or changed under
  `src/features/scanner/` (`Viewfinder.tsx`, `ScanSearchField.tsx`, `UploadDropzone.tsx`,
  `FoundCardPanel.tsx`, `useScanSimulation.ts`, `ScanShellScreen.tsx`, `ScanShellScreen.web.tsx`)
  from disk, asserting none contains an `expo-camera`/`expo-image-picker`/camera-matching import
  line — same technique `006-visual-identity` already established, not weakened. Add rendered-
  output assertions: at ≥768px, no `Viewfinder`/no "Escanear carta" button/no "Cámara disponible"
  text anywhere in the tree; below 768px, the same absence holds while the columns collapse to
  one (unchanged collapse mechanism from `006`). Depends on: T021, T022, T015–T017. *(FR-005,
  FR-016, SC-003, SC-005)*
- [X] T024 [US4] Manual smoke check (Level 3): `npm run web` at ≥768px — confirm the two-column
  layout with no viewfinder/button/badge; submit the search field or tap the dropzone — confirm
  the right column swaps to the found panel with `RecentScansList` still visible below it. Resize
  below 768px — confirm the one-column collapse, still with no viewfinder/button/badge present.
  Run `grep -rn "expo-camera\|expo-image-picker" src/features/scanner/` and confirm zero matches.
  Record findings in `progress/impl_008-scan-experience.md`. Depends on: T023.

**Checkpoint**: User Stories 1–4 (all P1) complete — the 5-destination shell and both Escanear
variants are fully functional, sharing one found-state domain logic module with zero drift.

---

## Phase 5: User Story 5 - Inicio is the redesigned, first post-login/post-tutorial landing screen (Priority: P2)

**Goal**: `004-home-scan-shell`'s Home screen becomes Inicio, restyled in `006`'s visual
language per spec.md's Recorded default 1, with zero diff to the KYC routing gate.

**Independent Test**: Per spec.md — cold-boot a fixture user resolving to `"main"`, confirm it
lands on the redesigned Inicio screen; `git diff` the gate files and confirm the diff is empty.

### Implementation for User Story 5

- [X] T025 [US5] Modify `src/features/navigation/HomeScreen.tsx`: remove the
  `AmigosQuickAccessPill` and `TopRightControls` usages (both now owned elsewhere — retired in
  US6, moved to `ShellHeader` in US1); add `BrandMark` (`src/features/ui/BrandMark`) + a
  `display.xl` title + tagline (`useTranslation(homeCopy)`, T004) above the existing centre
  `ScanEntryCard`; repoint `ScanEntryCard`'s `onPress` to look up the `escanear` entry from
  `NAV_DESTINATIONS` (T001) instead of the retired `SCAN_ROUTE` constant, mirroring the exact
  lookup pattern `AmigosQuickAccessPill` used for `amigos` in `004`. Update `HomeScreen.test.tsx`
  and `HomeScreen.integration.test.tsx`: assert `BrandMark`/title/tagline render, the pill/
  top-right controls no longer render from this file, and pressing the quick-action card
  navigates to `NAV_DESTINATIONS.find(d => d.key === "escanear").route`. Depends on: T001, T004,
  T009. *(FR-013, spec.md User Story 5 AS1–AS2)*
- [X] T026 [US5] Manual smoke check (Level 3): `npm run web` — with a fixture user resolving to
  `"main"`, confirm cold boot lands on the redesigned Inicio screen with no flash of the old `004`
  layout; press the quick-action card, confirm navigation to Escanear. Run `git diff main --
  src/domain/kyc-gate.ts src/features/identity/useKycGate.ts app/_layout.tsx` and confirm an
  empty diff (spec.md FR-014/SC-001). Record findings in
  `progress/impl_008-scan-experience.md`. Depends on: T025.

**Checkpoint**: User Story 5 complete — Inicio is the redesigned landing screen, with the KYC
gate confirmed byte-for-byte unchanged.

---

## Phase 6: User Story 6 - Cartera, Trades, and Perfil are reachable placeholders; Amigos and Social are retired (Priority: P3)

**Goal**: The three new destinations render distinct, contentless placeholders; every file that
existed only to support Amigos/Social is removed.

**Independent Test**: Per spec.md — select each of Cartera/Trades/Perfil and confirm distinct
placeholder content; grep the repo and confirm zero remaining Amigos/Social references outside
`src/features/social/README.md`'s bare scaffold text.

### Implementation for User Story 6

- [X] T027 [P] [US6] Create `src/features/portfolio/CarteraPlaceholderScreen.tsx` + `.test.tsx`:
  mirrors `004`'s `AmigosPlaceholderScreen.tsx` shape (header-role title + explanatory body), but
  copy routed through `useTranslation(placeholdersCopy)` (T005) in both locales, per spec.md
  FR-017 (the original `004` placeholders predated the i18n layer and were hardcoded English —
  this one isn't). Update `src/features/portfolio/README.md` to note its first real file.
  Depends on: T005. *(FR-015)*
- [X] T028 [P] [US6] Create `src/features/trading/TradesPlaceholderScreen.tsx` + `.test.tsx`:
  same pattern as T027. Update `src/features/trading/README.md`. Depends on: T005. *(FR-015)*
- [X] T029 [P] [US6] Create `src/features/identity/PerfilPlaceholderScreen.tsx` + `.test.tsx`:
  same pattern as T027 — explicitly distinct from the existing registration-flow `ProfileForm.tsx`
  (different component, different purpose, spec.md User Story 6 AS3). Update
  `src/features/identity/README.md`. Depends on: T005. *(FR-015)*
- [X] T030 [US6] Wire the routes: create `app/(app)/cartera.tsx` (renders
  `CarteraPlaceholderScreen`, T027), `app/(app)/trades.tsx` (renders `TradesPlaceholderScreen`,
  T028), `app/(app)/perfil.tsx` (renders `PerfilPlaceholderScreen`, T029). Depends on: T009,
  T027, T028, T029. *(FR-015)*
- [X] T031 [US6] Retire Amigos/Social: remove `app/(app)/amigos.tsx`, `app/(app)/amigos.test.tsx`,
  `app/(app)/social.tsx`, `app/(app)/social.test.tsx`,
  `src/features/social/AmigosPlaceholderScreen.tsx` + `.test.tsx`,
  `src/features/social/SocialPlaceholderScreen.tsx` + `.test.tsx`, and
  `src/features/navigation/AmigosQuickAccessPill.tsx` + `.test.tsx` — `src/features/social/`
  should contain only `README.md` afterward. Run `grep -rln "AmigosPlaceholderScreen\|
  SocialPlaceholderScreen\|AmigosQuickAccessPill" .` (excluding this feature's own spec/plan/
  tasks files) and confirm zero remaining references. Depends on: T025 (`HomeScreen.tsx` must
  already have stopped importing `AmigosQuickAccessPill`), T030. *(FR-002, spec.md Clarifications
  Recorded default 2)*
- [X] T032 [US6] Manual smoke check (Level 3): `npm run web` — select Cartera, Trades, Perfil
  from the shell in turn, confirm each renders distinct placeholder content with the shell intact
  around it. Confirm `/amigos` and `/social` no longer resolve to anything (expo-router's
  "Unmatched Route" screen, not the old placeholders). Record findings in
  `progress/impl_008-scan-experience.md`. Depends on: T031.

**Checkpoint**: All six user stories complete — the full 5-destination shell, both Escanear
variants, the redesigned Inicio, the three new placeholders, and Amigos/Social's retirement are
all independently verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T033 [P] Accessibility pass (Constitution VII) across every new/changed element in this
  feature — the five shell destinations and their icons, the four icon controls (now icon-only,
  re-verify accessible names carry more information than the visible glyph alone), the
  viewfinder's found state, every interactive element in `FoundCardPanel` (condition chips,
  stepper, toggle, links, Aceptar), the now-interactive `UploadDropzone`, and the three new
  placeholder screens — confirm ≥44×44 tap targets and real accessibility labels throughout, and
  web keyboard reachability/focus order across all five destinations. Fix findings in place; no
  new files. *(SC-002)*
- [X] T034 [P] Responsive layout check at a 375px-wide web viewport and at ≥768px, plus phone and
  tablet form factors on iOS/Android simulators, across all five destinations and both the idle
  and found states of Escanear. Fix findings in place. *(SC-007)*
- [X] T035 Run the **full** existing test suite (`npm test`, not a filtered subset) and confirm
  every pre-existing test outside this feature's own new/modified files still passes — this is
  the explicit regression check for the `NAV_DESTINATIONS`/`TopRightControls`/`RecentScansList`
  shape changes (T001, T007, T022) rippling into any test that assumed the old three-destination
  set, the old text-label controls, or the old Charizard/Blastoise/Venusaur placeholder rows. Fix
  any pre-existing test that asserted a now-intentionally-changed detail; never silently revert
  this feature's changes to make an unrelated test pass. Depends on: all of Phase 2–6.
- [X] T036 Re-run the final checks from earlier smoke tasks one more time after all Phase 3–7
  edits, to catch any last-minute regression: `grep -rn "expo-camera\|expo-image-picker"
  src/features/scanner/` (zero matches); `git diff main -- src/domain/kyc-gate.ts
  src/features/identity/useKycGate.ts app/_layout.tsx` (empty diff); `grep -rln
  "AmigosPlaceholderScreen\|SocialPlaceholderScreen\|AmigosQuickAccessPill" .` (zero matches
  outside this feature's own spec files). Depends on: T035.
- [X] T037 Run `./init.sh` end to end (no `--skip-*` flags) and confirm `RESULT: SUCCESS` — Tests
  stage OK, type-check clean, and all three bundle exports (web/iOS/Android) clean, confirming
  `app/scan.tsx`'s removal (T019) left no orphaned/duplicate route and no new native dependency
  was actually needed. Depends on: T036.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped — nothing to do.
- **Foundational (Phase 2)**: T001–T014 — BLOCKS every user story. Internally: T001–T006 (domain/
  i18n) are all independently parallel; T007–T012 (shell chrome) depend on T001 and, for T008+,
  on T007; T013–T014 (found-state logic) depend on T002 (and T014 also on T006).
- **User Story 3 (Phase 3, P1)**: Depends on all of Phase 2 (needs T009's 5-destination layout to
  wire a route into, and T013/T014/T006 for the found-state trigger/panel).
- **User Story 4 (Phase 4, P1)**: Depends on all of Phase 2, same as US3 — independently buildable
  in parallel with Phase 3 if desired, since mobile (`ScanShellScreen.tsx`) and web
  (`ScanShellScreen.web.tsx`) are disjoint files sharing only the Phase 2 foundation.
- **User Story 5 (Phase 5, P2)**: Depends on Phase 2 (T001, T004, T009).
- **User Story 6 (Phase 6, P3)**: Depends on Phase 2 (T009) and Phase 5's T025 (retiring
  `AmigosQuickAccessPill` requires `HomeScreen.tsx` to have already stopped importing it).
- **Polish (Phase 7)**: Depends on all six user stories being complete.

### Parallel Opportunities

- Phase 2: T001–T006 (domain/i18n, six disjoint files) in parallel; T010/T011 in parallel once
  T008 lands; T013 can start as soon as T002 lands, independent of the shell-chrome track
  (T007–T012).
- Phase 3 and Phase 4 can be worked in parallel by two independent task-implementer passes once
  Phase 2 is fully checkpointed, since `ScanShellScreen.tsx` and `ScanShellScreen.web.tsx` share
  no file beyond Phase 2's foundation (T015–T017 are shared presentational files both variants
  import, so land those first if working the two phases concurrently).
- Phase 6: T027, T028, T029 (three disjoint placeholder files) in parallel; T030/T031/T032
  sequential after them.
- Phase 7: T033 and T034 in parallel; T035–T037 sequential.

---

## Parallel Example: Phase 2 domain/i18n (T001–T006)

```bash
Task: "Modify src/domain/navigation.ts + test — 5 destinations"
Task: "Create src/domain/scanResults.ts + test — sample cards, found-state transitions"
Task: "Create src/domain/i18n/copy/nav.ts + test"
Task: "Create src/domain/i18n/copy/home.ts + test"
Task: "Create src/domain/i18n/copy/placeholders.ts + test"
Task: "Extend src/domain/i18n/copy/scan.ts + test — found-panel/viewfinder-found copy"
```

## Parallel Example: Phase 6 placeholder screens (after T005 lands)

```bash
Task: "Create src/features/portfolio/CarteraPlaceholderScreen.tsx + test"
Task: "Create src/features/trading/TradesPlaceholderScreen.tsx + test"
Task: "Create src/features/identity/PerfilPlaceholderScreen.tsx + test"
```

---

## Implementation Strategy

### Foundation First, Then Both Escanear Variants, Then Lower-Risk Screens

1. Complete Phase 2 (Foundational) in full — nothing in Phase 3+ compiles without the
   5-destination table, the shared header, the i18n dictionaries, and the found-state domain
   logic + shared panel.
2. Complete Phase 3 (User Story 3, mobile Escanear) and Phase 4 (User Story 4, web Escanear) —
   equal priority, either order or in parallel; both share Phase 2's found-state logic with zero
   duplication.
3. **STOP and VALIDATE**: run T020's and T024's manual smoke checks — confirm the found-state
   loop behaves identically on both platforms and that web genuinely never renders a
   viewfinder/button/badge.
4. Complete Phase 5 (User Story 5, Inicio redesign) — lower risk, no mockup to match exactly, and
   confirms the KYC gate stays untouched.
5. Complete Phase 6 (User Story 6, placeholders + retirement) — lowest risk, direct continuation
   of `004`'s already-proven placeholder pattern; retiring Amigos/Social last means nothing else
   in this feature ever depends on files that are about to be deleted.
6. Complete Phase 7 (Polish) — the full-suite regression run (T035) and `./init.sh` (T037) are
   the final gate before this feature can be marked `done`.
