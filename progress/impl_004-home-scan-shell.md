# Implementation Progress: 004-home-scan-shell

## Run 1 — Phase 2 (Foundational): T001, T002

**Scope**: Exactly T001 and T002 from `specs/004-home-scan-shell/tasks.md`, per the
task-implementer's brief. No other tasks in this phase or later phases were touched.

### Files changed

- `src/domain/navigation.ts` (new) — Pure TypeScript, zero React/React Native imports
  (Constitution IV). Exports:
  - `NAV_DESTINATIONS`: readonly array of exactly three
    `{ key: "amigos" | "home" | "social", route: string, label: string }` entries
    (`/amigos`, `/`, `/social`) — the single source of truth both the native `<Tabs>` layout
    and the web sidebar/bottom-bar layout will render from in later tasks.
  - `SCAN_ROUTE = "/scan"` — the not-yet-built scanner feature's route boundary.
  - `BREAKPOINT_PX = 768` — the web layout breakpoint confirmed at the `spec_ready` gate
    (Clarifications, Option C).
  - `resolveWebNavLayout(width: number): "sidebar" | "bottomBar"` — pure decision function,
    boundary-inclusive (`width >= BREAKPOINT_PX` → `"sidebar"`).
- `src/domain/navigation.test.ts` (new) — Jest, no rendering. 5 tests:
  - `resolveWebNavLayout` at 767px → `"bottomBar"`.
  - `resolveWebNavLayout` at exactly 768px (`BREAKPOINT_PX`) → `"sidebar"` (boundary
    inclusive).
  - `resolveWebNavLayout` at 1440px (wide desktop) → `"sidebar"`.
  - `NAV_DESTINATIONS` has exactly three entries.
  - `NAV_DESTINATIONS` has unique `key` and `route` values across all entries.
- `src/features/navigation/README.md` (new) — mirrors the pattern in
  `src/features/identity/README.md`, but states explicitly (quoting `plan.md`'s Constitution
  Check verbatim) that this module has **no backend counterpart to mirror** — it is the shell
  chrome between domains, a documented, narrow exception to Constitution Principle V. Also
  clarifies module boundaries: this module owns only shell chrome (tab bar/sidebar/bottom-bar,
  Home/Scan composition, top-right controls, Amigos quick-access pill); domain content
  (Amigos/Social placeholders, scanner entry/stub) stays in `src/features/social/` and
  `src/features/scanner/` respectively, per `plan.md`'s "Screen/component placement" Research
  Decision.
- `specs/004-home-scan-shell/tasks.md` — marked T001 and T002 `[X]`.

### Constitution / conventions compliance

- Principle IV: `src/domain/navigation.ts` has zero React/React Native imports — verified by
  inspection (no import statements at all besides none needed).
- Principle V: the new `src/features/navigation/` module's exception is documented in its own
  README, cross-referencing `plan.md`'s Constitution Check, not left implicit.
- No new dependency added — neither task needed one.
- No `any`, strict mode respected (see type-check below).
- Comments in `navigation.ts`/`navigation.test.ts` only capture non-obvious "why"
  (cross-references to plan.md decisions, boundary-inclusivity note), per
  `docs/conventions.md`.

### Tests run

```
npx tsc --noEmit
```
→ clean, no output (no type errors).

```
npx jest src/domain/navigation.test.ts
```
```
PASS src/domain/navigation.test.ts
  resolveWebNavLayout
    ✓ resolves to bottomBar just below the breakpoint (767px) (1 ms)
    ✓ resolves to sidebar exactly at the breakpoint (768px, boundary-inclusive)
    ✓ resolves to sidebar at a wide viewport width
  NAV_DESTINATIONS
    ✓ has exactly three entries (1 ms)
    ✓ has unique key and route values across all entries

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

Full suite (regression check, not just the new file):

```
npx jest
```
```
Test Suites: 22 passed, 22 total
Tests:       186 passed, 186 total
```

No manual smoke check (`npm run web`) performed this run — T001/T002 produce no user-visible
UI (a pure logic module and a README). Level 3 manual verification is deferred to T015/T019 in
later phases, per `tasks.md`, once routes are actually wired.

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-001 (exactly three reachable shell destinations) | `NAV_DESTINATIONS` "has exactly three entries", "has unique key and route values across all entries" |
| FR-003 (web layout: sidebar ≥768px, bottom bar below, boundary-inclusive) | `resolveWebNavLayout` "resolves to bottomBar just below the breakpoint (767px)", "resolves to sidebar exactly at the breakpoint (768px, boundary-inclusive)", "resolves to sidebar at a wide viewport width" |
| (Constitution V, no FR) | `src/features/navigation/README.md` — documents the exception; no test applicable (docs-only file) |

### Tasks now `[X]`

- T001
- T002

### Deviations from plan

None. Implementation matches `tasks.md`'s T001/T002 descriptions and `plan.md`'s Research
Decisions ("Shared destination/route table", "Web navigation treatment", "Screen/component
placement") exactly — no design decisions were made beyond what those documents already
specify.

---

## Run 2 — Phase 2 (Foundational): T003, T004

**Scope**: Exactly T003 and T004 from `specs/004-home-scan-shell/tasks.md`, per the
task-implementer's brief. Both are `[P]`, independent of each other and of T005–T008 (parallel
batches). Neither wires navigation or routes — that's T009–T017 in later phases.

### Files changed

- `src/features/scanner/ScanEntryCard.tsx` (new) — the centre "+" card affordance. A
  `Pressable` sized to the standard trading-card ratio (`2.5 / 3.5`, width:height —
  `CARD_WIDTH = 220`, `CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO ≈ 308`), well above the
  44×44 minimum tap target either way. `accessibilityRole="button"`,
  `accessibilityLabel="Scan a card"` (a real, descriptive label per spec.md US2 AS3 — not bare
  "+" or "button"). Takes a required `onPress: () => void` prop and calls it directly; does
  **not** import `expo-router` or call any navigation API itself — that wiring is T016 (US2),
  as the task explicitly requires.
- `src/features/scanner/ScanEntryCard.test.tsx` (new) — RNTL, 3 tests:
  - Renders with `width < height` and `width / height` close to `2.5 / 3.5` (asserted via
    `StyleSheet.flatten` on the rendered `style` prop), and both dimensions ≥ 44 logical px.
  - Accessible name resolves to exactly `"Scan a card"` via `getByRole("button", { name: ... })`.
  - `onPress` fires exactly once when the card is pressed (`fireEvent.press`).
- `src/features/scanner/ScanPlaceholderScreen.tsx` (new) — `/scan`'s stub destination content.
  Renders an `accessibilityRole="header"` heading reading "Scanner coming soon" plus one line
  of static body copy explicitly stating no camera/capture/recognition exists yet. Imports only
  `react-native`'s `StyleSheet`/`Text`/`View` — no `expo-camera`, `expo-image-picker`, or any
  other camera-related module (FR-005's explicit prohibition for this feature).
- `src/features/scanner/ScanPlaceholderScreen.test.tsx` (new) — RNTL + Node `fs`/`path`, 2
  tests:
  - Source-inspection test: reads the component's own `.tsx` source via `fs.readFileSync` and
    asserts none of its `import`/`require` lines reference `expo-camera`, `expo-image-picker`,
    or the word "camera" at all — a guard against a camera import being added even if never
    invoked, which a behavior-only render test could not catch. (Scoped to import/require
    lines specifically, not the whole file, so the component's own "no camera here" prose copy
    doesn't cause a false failure against its own regex.)
  - Render test: the accessible heading is present and the visible text matches
    `/scanner coming soon/i`.
- `specs/004-home-scan-shell/tasks.md` — marked T003 and T004 `[X]`.

### Constitution / conventions compliance

- Principle IV: both components are pure presentation — `ScanEntryCard` only calls the
  `onPress` prop it's given (no fetch/validation/navigation logic inline);
  `ScanPlaceholderScreen` renders static copy with no logic at all.
- FR-005 (camera/capture/recognition explicitly out of scope): enforced at the source level by
  `ScanPlaceholderScreen.test.tsx`'s import-line inspection, not just current behavior.
- KYC/identity image-handling rule: N/A — neither file touches image capture or KYC data at
  all.
- No new dependency added — both use only `react-native` core + already-installed RNTL.
- No `any`; strict mode respected (see type-check below). Function components only.
- Comments only capture non-obvious "why" (why `onPress` isn't wired to navigation yet, why the
  camera-import check is scoped to import lines) per `docs/conventions.md`.

### Tests run

```
npx tsc --noEmit
```
→ clean, no output (no type errors).

```
npx jest src/features/scanner
```
```
PASS src/features/scanner/ScanPlaceholderScreen.test.tsx
PASS src/features/scanner/ScanEntryCard.test.tsx

Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
```

Full suite (regression check, not just the new files):

```
npx jest
```
```
Test Suites: 24 passed, 24 total
Tests:       191 passed, 191 total
```
(Pre-existing `act(...)` console warnings from `src/features/identity/useKycGate.test.ts`
appear in the output — unrelated to this batch, not introduced by it.)

**Manual smoke check (Level 3)**: not performed via `npm run web` this run. Confirmed by
inspection that neither component is reachable from any route yet — `app/scan.tsx` does not
exist and `app/index.tsx` is still the pre-existing repo-scaffold placeholder untouched by this
batch; wiring both into the app happens in T009–T017. This matches `tasks.md`'s own Phase 2
checkpoint ("no `app/` routes are wired yet, so nothing is user-visible"). RNTL Level 2 tests
above exercise real rendered output/behavior for both components per `docs/verification.md`,
which is the applicable verification level for this batch.

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-004 (centre "+" card at trading-card ratio) | `ScanEntryCard` "renders at a vertically-oriented trading-card aspect ratio with a minimum 44x44 tap target" |
| FR-005 (affordance only — no camera/capture/recognition) | `ScanEntryCard` "exposes the accessibility label \"Scan a card\"", "calls onPress when pressed"; `ScanPlaceholderScreen` "does not import any camera-related module", "renders \"Scanner coming soon\" copy with an accessible heading" |
| SC-004 (≥44×44 tap target + non-empty accessibility label) | `ScanEntryCard` "renders at a vertically-oriented trading-card aspect ratio with a minimum 44x44 tap target" |

### Tasks now `[X]`

- T003
- T004

### Deviations from plan

None. Both components match `tasks.md`'s T003/T004 descriptions exactly: `ScanEntryCard`
accepts and forwards `onPress` without wiring navigation itself, and `ScanPlaceholderScreen`
contains no camera-related code, matching FR-005. No design decisions were made beyond what
`spec.md`/`plan.md`/`tasks.md` already specify.

---

## Run 3 — Phase 2 (Foundational): T005, T006

**Scope**: Exactly T005 and T006 from `specs/004-home-scan-shell/tasks.md`, per the
task-implementer's brief. Both are `[P]`, independent of each other and of every other Phase 2
task. Neither wires routes — `app/(app)/amigos.tsx` and `app/(app)/social.tsx` (T014) render
these components later.

### Files changed

- `src/features/social/AmigosPlaceholderScreen.tsx` (new) — static-copy stub identifying itself
  as the Amigos destination. Renders an `accessibilityRole="header"` heading reading exactly
  "Amigos" plus one line of body copy explicitly stating no friend list, friend requests, or
  social data exists yet. Imports only `react-native`'s `StyleSheet`/`Text`/`View` — no social/
  friend-data module of any kind, satisfying the hard scope boundary from `spec.md` FR-007 and
  the task brief.
- `src/features/social/AmigosPlaceholderScreen.test.tsx` (new) — RNTL, 2 tests:
  - Render test: accessible heading present, visible text is exactly `"Amigos"`, and the body
    copy matches `/friends list isn't available yet/i` (a real rendered-text assertion, not a
    "doesn't throw" check).
  - Scope-boundary test: exactly two text nodes render (the heading + the one body line) —
    guards against any friend-list/request UI being added later without a matching test update.
- `src/features/social/SocialPlaceholderScreen.tsx` (new) — static-copy stub identifying itself
  as the Social destination. Renders an `accessibilityRole="header"` heading reading exactly
  "Social" plus one line of body copy explicitly stating no feed, posts, or trading content
  exists yet. Same import restriction as the Amigos screen — no feed/post/trading module of any
  kind.
- `src/features/social/SocialPlaceholderScreen.test.tsx` (new) — RNTL, 2 tests, mirroring the
  Amigos screen's structure: identifying-copy render test, and a two-text-node scope-boundary
  test.
- `specs/004-home-scan-shell/tasks.md` — marked T005 and T006 `[X]`.

### Distinctness from each other (sets up T018)

The two screens use deliberately different identifying copy — "Amigos" / "friends list" vs.
"Social" / "social feed" — with no shared body sentence, so a later assertion (T018) that
Amigos and Social render visibly different content will pass trivially once both screens are
wired into routes.

### Constitution / conventions compliance

- Principle IV: both components are pure presentation — no fetch/validation/business logic of
  any kind, just static `Text`/`View`.
- FR-007 (Amigos/Social MUST NOT contain real friend/feed/post/trading content): enforced by
  keeping each file's only content to two static text lines with no data-shaped structures
  (lists, maps, arrays) at all — verified by the two-text-node scope-boundary test in each spec
  file.
- No new dependency added — both use only `react-native` core + already-installed RNTL.
- No `any`; strict mode respected (see type-check below). Function components only, PascalCase
  filenames matching the exported component, per `docs/conventions.md`.
- Comments capture only the non-obvious "why" (the FR-007 scope boundary and its rationale for
  each file), per `docs/conventions.md`.

### Tests run

```
npx tsc --noEmit
```
→ clean, no output (no type errors).

```
npx jest src/features/social/
```
```
PASS src/features/social/SocialPlaceholderScreen.test.tsx
PASS src/features/social/AmigosPlaceholderScreen.test.tsx

Test Suites: 2 passed, 2 total
Tests:       4 passed, 4 total
```

Full suite (regression check, not just the new files):

```
npx jest
```
```
Test Suites: 26 passed, 26 total
Tests:       195 passed, 195 total
```

**Manual smoke check (Level 3)**: not performed via `npm run web` this run — neither screen is
reachable from any route yet (`app/(app)/amigos.tsx`/`app/(app)/social.tsx` don't exist;
`app/index.tsx` is still the untouched repo-scaffold placeholder). This matches `tasks.md`'s
Phase 2 checkpoint ("no `app/` routes are wired yet, so nothing is user-visible"). RNTL Level 2
tests above exercise real rendered output for both components per `docs/verification.md`, the
applicable level for this batch; route wiring (and its own manual smoke check) is T014/T015.

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-007 (Amigos/Social reachable, distinctly-labelled, contentless placeholders) | `AmigosPlaceholderScreen` "renders \"Amigos\" copy with an accessible heading", "renders no friend list or friend-request UI (only the two static disclaimer lines)"; `SocialPlaceholderScreen` "renders \"Social\" copy with an accessible heading", "renders no feed or post content (only the two static disclaimer lines)" |

### Tasks now `[X]`

- T005
- T006

### Deviations from plan

None. Both components match `tasks.md`'s T005/T006 descriptions exactly — identifying copy,
no real content, colocated tests asserting real rendered text. No design decisions were made
beyond what `spec.md`/`plan.md`/`tasks.md` already specify.

---

## Run 4 — Phase 2 (Foundational): T007, T008 (last batch of Phase 2)

**Scope**: Exactly T007 and T008 from `specs/004-home-scan-shell/tasks.md`, per the
task-implementer's brief. Both are `[P]`, independent files, consuming only T001's already-
completed `src/domain/navigation.ts`. This closes out Phase 2 entirely — Phase 3 (US1 route
wiring) can now start.

### Files changed

- `src/features/navigation/TopRightControls.tsx` (new) — the Home/Scan screen's four
  top-right placeholder controls. A `CONTROLS` config array (language, currency,
  notifications, messages — exact order per spec.md US4 AS1) drives a `.map()` over a shared
  `PlaceholderControl` sub-component, so the four controls cannot silently drift out of order
  or duplicate markup. Each `PlaceholderControl`:
  - Has a distinct, real `accessibilityLabel` (e.g. `"Language, English or Spanish — not yet
    available"`, `"Currency, US Dollar or Mexican Peso — not yet available"`,
    `"Notifications — not yet available"`, `"Messages — not yet available"`) — not a bare
    icon/"button" (spec.md US4 AS3).
  - Has a `minWidth`/`minHeight` of 44 logical px (SC-004).
  - Holds its own local `useState<boolean>` "feedback visible" flag, toggled on press, showing
    an inline `"Not yet available"` `<Text>` row when true — per `plan.md`'s
    "Placeholder-control feedback mechanism" Research Decision (no `Alert.alert`, no toast
    library, plain local React state only).
  - Performs zero real language/currency/notification/messaging behavior and makes zero
    backend calls (FR-010) — the component imports nothing beyond `react`/`react-native`.
- `src/features/navigation/TopRightControls.test.tsx` (new) — RNTL, 10 tests total:
  - Render-order test: exactly four buttons render, and their `accessibilityLabel`s equal the
    stated top-to-bottom sequence exactly, in order.
  - Distinctness test: all four accessibility labels are unique and non-empty.
  - Tap-target test: every control's flattened style has `minWidth`/`minHeight` ≥ 44.
  - `describe.each` over all four controls (2 tests each = 8): activating a given control (a)
    shows no "not yet available" text beforehand and shows it after one press (SC-005, "never
    a silent no-op"), and (b) toggles it back off on a second press (proves it's genuine local
    state, not a one-shot side effect).
- `src/features/navigation/AmigosQuickAccessPill.tsx` (new) — a pill-shaped `Pressable`
  labelled `"Amigos"` (`accessibilityRole="button"`, `accessibilityLabel="Amigos"`, ≥44×44 tap
  target). On press, it looks up
  `NAV_DESTINATIONS.find(d => d.key === "amigos")` (from `src/domain/navigation.ts`, T001) and
  calls `useRouter().push(amigosDestination.route)` with that looked-up route — never a
  hardcoded second `"/amigos"` string literal, so this pill's target can never drift from the
  shell's own Amigos tab route (FR-008). This is deliberately built as a navigation shortcut
  only, not a friend-request badge or any other alternate meaning, per the human's explicit
  confirmation at the `spec_ready` gate (spec.md Clarifications).
- `src/features/navigation/AmigosQuickAccessPill.test.tsx` (new) — RNTL, 2 tests, mocking
  `expo-router` (`jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }))`,
  mirroring the established pattern in `app/(auth)/verify-phone.test.tsx`):
  - Presses the pill and asserts `mockPush` was called exactly once, with the argument equal to
    `NAV_DESTINATIONS.find(d => d.key === "amigos")!.route` — i.e. read from the shared table
    at test time, not a duplicated literal in the test either, so the test itself can't drift
    from the table it's verifying against.
  - Asserts the accessible name is `"Amigos"` and the tap target is ≥44×44.
- `specs/004-home-scan-shell/tasks.md` — marked T007 and T008 `[X]`.

### A type-check fix made along the way

Spreading `{...control}` (which includes the config's own `key: string` field) onto
`<PlaceholderControl key={control.key} {...control} />` collided with React's special `key`
prop (`TS2783: 'key' is specified more than once`). Fixed by passing `visibleLabel` and
`accessibilityLabel` explicitly instead of spreading, and typing `PlaceholderControl`'s props
as `Omit<ControlConfig, "key">` so the component's own prop type no longer requires (or
accepts) a `key` field. This is a mechanical TS fix, not a design deviation — the four
controls' order, labels, and behavior are unchanged from what the task describes.

### Constitution / conventions compliance

- Principle IV: neither component embeds fetch calls, validation, or data transforms —
  `TopRightControls` only toggles local UI-feedback state; `AmigosQuickAccessPill` only reads
  a config value out of `src/domain/navigation.ts` (T001's already-completed shared table) and
  forwards it to `expo-router`'s `push` — no new business logic was invented in either
  component body.
- FR-010 (zero backend calls anywhere in this feature): verified by inspection — neither file
  imports `src/lib/api.ts`, React Query, or `fetch`/`axios` at all.
- Principle VII / SC-004: every control across both files has an explicit `accessibilityLabel`
  and a ≥44×44 tap target, asserted by tests, not left to visual inspection alone.
- No new dependency added — both use only `react`/`react-native`/`expo-router` (all already
  installed; `expo-router` is a direct dependency per `package.json`, already used elsewhere in
  the repo, e.g. `app/(auth)/verify-phone.tsx`).
- No `any`; strict mode respected (see type-check below). Function components only.
- Comments capture only non-obvious "why" (the feedback-mechanism Research Decision
  cross-reference, the FR-008 "shortcut not a second destination" clarification, the `key`-prop
  type-check fix), per `docs/conventions.md`.

### Tests run

```
npx tsc --noEmit
```
→ clean, no output (no type errors) — after the `Omit<ControlConfig, "key">` fix above.

```
npx jest src/features/navigation
```
```
PASS src/features/navigation/AmigosQuickAccessPill.test.tsx
PASS src/features/navigation/TopRightControls.test.tsx

Test Suites: 2 passed, 2 total
Tests:       13 passed, 13 total
```

Full suite (regression check, not just the new files):

```
npx jest
```
```
Test Suites: 28 passed, 28 total
Tests:       208 passed, 208 total
```

**Manual smoke check (Level 3)**: not performed via `npm run web` this run — neither component
is reachable from any route yet (`app/(app)/index.tsx`/`HomeScreen.tsx` don't exist; `app/
index.tsx` is still the untouched repo-scaffold placeholder). This matches `tasks.md`'s Phase 2
checkpoint ("no `app/` routes are wired yet, so nothing is user-visible") and mirrors Runs 2/3's
same finding. RNTL Level 2 tests above exercise real rendered output/behavior for both
components (render order, distinct labels, tap targets, activation feedback, navigation-call
target) per `docs/verification.md`, the applicable level for this batch. T015/T019 (later
phases) own the manual smoke check once these components are actually composed into the real
Home/Scan screen and wired into routes.

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-006 (four top-right controls: order, labels, tap target, visible feedback, no real behavior) | `TopRightControls` "renders exactly four controls, top-to-bottom, in the stated order", "gives each control a distinct, non-empty accessibility label", "gives each control a minimum 44x44 tap target" |
| FR-008 (Amigos pill navigates to the same destination as the shell's Amigos tab, not a second one) | `AmigosQuickAccessPill` "navigates to exactly NAV_DESTINATIONS' Amigos route when pressed" |
| FR-010 (zero backend calls; controls are pure client-side stubs) | Verified by inspection (no API/domain-fetch import in either file) — see Constitution/conventions compliance above; no dedicated test asserts an absence-of-import since there is nothing to mock/stub that would make such a test meaningful here (unlike `ScanPlaceholderScreen.test.tsx`'s camera-import guard, which guards against a real native module accidentally being wired in) |
| SC-004 (≥44×44 tap target + non-empty accessibility label) | `TopRightControls` "gives each control a minimum 44x44 tap target"; `AmigosQuickAccessPill` "has a non-empty accessibility label and a minimum 44x44 tap target" |
| SC-005 (never a silent no-op) | `TopRightControls` describe.each block: `'shows "Not yet available" feedback on activation, and nothing beforehand'` (×4 controls) |

### Tasks now `[X]`

- T007
- T008

**Phase 2 (Foundational) is now fully complete** — all of T001–T008 are `[X]`. Phase 3
(User Story 1 route wiring) can start.

### Deviations from plan

None in scope or behavior. One mechanical TypeScript fix (the `key`-prop collision noted
above) was needed to satisfy strict mode; it changed no described behavior, label, order, or
test assertion from what T007/T008 specify.

---

## Run 5 — Phase 3 (User Story 1, MVP): T009, T010, T011

**Scope**: Exactly T009, T010, T011 from `specs/004-home-scan-shell/tasks.md`, per the
task-implementer's brief. All three are `[P]`, depend only on the already-completed T001
(`src/domain/navigation.ts`), and touch entirely disjoint files. **Not** included in this
batch (deliberately, per the brief): `app/(app)/_layout.web.tsx` (T012),
`app/(app)/index.tsx`/`amigos.tsx`/`social.tsx` (T014) — those are separate, later tasks in
the same phase.

### Files changed

- `app/(app)/_layout.tsx` (new) — the native (iOS/Android) shell. `expo-router`'s `<Tabs>`,
  with one `<Tabs.Screen>` per `NAV_DESTINATIONS` entry (`src/domain/navigation.ts`, T001) via
  `.map()` — not three independently hand-written `<Tabs.Screen>` declarations, so the three
  destinations/routes/labels cannot drift from the single source of truth. Each screen gets an
  `@expo/vector-icons` `Ionicons` icon (`people`/`home`/`chatbubbles`) and an explicit
  `tabBarAccessibilityLabel` set to the destination's real label (`"Amigos"`/`"Home"`/
  `"Social"`) — not left to icon-only defaults, per spec.md's requirement. The `key →
  Tabs.Screen name` mapping (`amigos`/`index`/`social`, i.e. which route file each tab
  resolves to inside this group) and the `key → icon` mapping are both small local lookup
  tables in this file, not in `src/domain` — they are presentation wiring (which icon, which
  filename) rather than the business data itself (which three destinations exist, and their
  routes/labels), which stays exclusively in `NAV_DESTINATIONS`.
- `src/features/navigation/WebSidebarNav.tsx` (new) — the ≥768px web treatment. A persistent
  left sidebar (`View`, `width: 220`) rendering `NAV_DESTINATIONS` via `.map()` into
  `expo-router`'s `<Link>` components (`href={destination.route}`, `accessibilityRole="link"`,
  `accessibilityLabel={destination.label}`) — `<Link>` renders as a real `<a>` element under
  `react-native-web`, so it is reachable via Tab/Shift+Tab and activatable via Enter/Space
  with the browser's own default focus outline (deliberately not overridden with
  `outlineWidth`/`outlineStyle`, which is what keeps the focus indicator visible per
  Constitution Principle VII without any extra styling code). Wraps an `expo-router` `<Slot />`
  in a `flex: 1` content area to the right of the sidebar for the active screen. The sidebar
  container itself uses the RN `role="navigation"` prop (not `accessibilityRole`, which does
  not include a `"navigation"` value in React Native's `AccessibilityRole` union — `role` is
  the newer, ARIA-aligned prop that does; caught by `tsc`, see below).
- `src/features/navigation/WebSidebarNav.test.tsx` (new) — RNTL, 3 tests. Mocks the entire
  `expo-router` module (mirroring the established pattern in
  `AmigosQuickAccessPill.test.tsx`/`app/(auth)/verify-phone.test.tsx`) so `<Link>` becomes a
  plain `<Text>` forwarding whatever props `WebSidebarNav` passes it, and `<Slot>` becomes a
  `<Text testID="active-screen-slot">` marker — this asserts the real props/roles
  `WebSidebarNav` renders, not `expo-router`'s own internal navigation wiring (already covered
  by `expo-router` itself, out of this feature's scope to re-test).
  - All three `NAV_DESTINATIONS` render as `getByRole("link", { name: destination.label })` —
    exact accessible-name match per destination.
  - Every rendered link's `accessibilityState?.disabled` is not `true` — i.e. none is
    disabled/pointer-only, so all three are reachable in the keyboard tab order (this is the
    practical substitute for a real Tab-key simulation, which RNTL's non-browser renderer
    cannot perform — see the note on "visible focus states" below).
  - The `<Slot />` marker renders (confirms the active-screen wrapping).
- `src/features/navigation/WebBottomBarNav.tsx` (new) — the <768px web treatment,
  structurally the mirror of `WebSidebarNav.tsx`: `<Slot />` content area on top (`flex: 1`),
  a horizontal `flexDirection: "row"` bar of the same three `<Link>`s along the bottom
  (`minHeight: 56`, each link ≥44×44), visually/behaviorally equivalent to the native tab bar
  (T009) — same accessible-link approach, same untouched default focus outline, same
  `role="navigation"` container.
- `src/features/navigation/WebBottomBarNav.test.tsx` (new) — RNTL, the same 3-test shape as
  `WebSidebarNav.test.tsx` (same `expo-router` mock, same three assertions), per the task's
  explicit instruction to assert "the same three-destination coverage as T010."
- `specs/004-home-scan-shell/tasks.md` — marked T009, T010, T011 `[X]`.

### A type-check fix made along the way

`accessibilityRole="navigation"` on the sidebar/bottom-bar container `View`s failed `tsc`:
React Native's `AccessibilityRole` union (`react-native/Libraries/Components/View/
ViewAccessibility.d.ts`) has no `"navigation"` member (that's a web/ARIA-only role). React
Native does separately expose a newer `role` prop typed against a `Role` union that does
include `"navigation"` (added for closer ARIA alignment) — switched both containers from
`accessibilityRole="navigation"` to `role="navigation"` and `tsc --noEmit` went clean. This is
a mechanical type fix, not a design deviation — the semantic intent (mark the container as a
navigation landmark) is unchanged.

### Constitution / conventions compliance

- Principle IV: none of the three files hardcodes a duplicate destination/route/label list —
  `app/(app)/_layout.tsx`, `WebSidebarNav.tsx`, and `WebBottomBarNav.tsx` all `.map()` over the
  same imported `NAV_DESTINATIONS` (T001). No inline `Platform.OS` branching appears anywhere
  in any of the three files — each is a plain RN component; the actual platform split is a
  separate later task (`app/(app)/_layout.web.tsx`, T012), exactly as instructed.
- Principle V: all three files live under the already-justified `src/features/navigation/`
  exception (or `app/(app)/`, the route itself) — no new domain-mirroring question raised.
- No business logic embedded in any component body — `app/(app)/_layout.tsx`'s two lookup
  tables are presentation wiring (icon/screen-name-per-key), not API calls, validation, or
  data transforms; `WebSidebarNav`/`WebBottomBarNav` contain no logic beyond rendering the
  shared table.
- No new runtime dependency — `@expo/vector-icons` and `expo-router`'s `<Link>`/`<Tabs>`/
  `<Slot>` were already confirmed installed by `plan.md`'s Research Decisions (verified again
  directly in `node_modules` this run: `@expo/vector-icons@14.1.0`, `expo-router@~3.5.0`'s
  bundled `Link`/`Slot`/`Tabs` exports).
- No `any`; strict mode respected (see type-check below, after the `role` fix). Function
  components only. Comments capture only non-obvious "why" (the `role` vs. `accessibilityRole`
  distinction, the untouched-default-focus-outline rationale, the presentation-wiring vs.
  business-data distinction for the two local lookup tables), per `docs/conventions.md`.

### Tests run

```
npx tsc --noEmit
```
→ clean, no output (no type errors) — after the `role="navigation"` fix above.

```
npx jest src/features/navigation
```
```
PASS src/features/navigation/WebSidebarNav.test.tsx
PASS src/features/navigation/WebBottomBarNav.test.tsx
PASS src/features/navigation/TopRightControls.test.tsx
PASS src/features/navigation/AmigosQuickAccessPill.test.tsx

Test Suites: 4 passed, 4 total
Tests:       19 passed, 19 total
```

Full suite (regression check, not just the new files):

```
npx jest
```
```
Test Suites: 30 passed, 30 total
Tests:       214 passed, 214 total
```

**Build check (Level 4, partial — web only, this batch)**: `npx expo export --platform web`
completed cleanly with no import/route errors, and the export explicitly lists a `/(app)`
route (`13.9 kB`) alongside the pre-existing routes — confirming `app/(app)/_layout.tsx`
bundles correctly even though no screens exist inside the group yet (identical to how
`app/(auth)/_layout.tsx` and `app/(onboarding)/_layout.tsx` were originally added in `001`
before their own screens existed). The pre-existing `/` route still resolves to the untouched
`app/index.tsx` scaffold, confirming this batch changed nothing about current routing
behavior. Full `./init.sh` (all three platforms) was intentionally **not** run this batch per
the task-implementer's brief ("Run type-check and the test suite... not full `./init.sh`");
that full check belongs to T022 once every task in this feature is done.

**Manual smoke check (Level 3)**: not performed via `npm run web` beyond the export above —
none of these three files is wired into a *reachable, rendered* screen yet. `app/(app)/
_layout.tsx` has no screens inside its group (those are T014); `WebSidebarNav`/
`WebBottomBarNav` are not yet selected by any layout (that selection is `app/(app)/
_layout.web.tsx`, T012) and are not imported anywhere outside their own test files. There is
nothing new for a human to visually observe in the running app yet — this matches this
phase's own task ordering (T012 wires the web breakpoint switch, T014 wires the routes, T015
is this phase's dedicated manual-smoke-check task once that wiring exists). The web export
above is this batch's applicable build-level evidence; RNTL Level 2 tests are this batch's
applicable behavioral evidence.

One accessibility caveat worth flagging explicitly: "visible focus states" (part of T010's
literal task text) is a genuinely visual/DOM behavior — which element gets a focus ring after
a Tab keypress — that RNTL's non-browser test renderer cannot observe or simulate. What the
tests above verify instead (all three destinations render as `role="link"` elements with
correct accessible names, and none is `disabled`) is the accessibility-tree precondition for
keyboard reachability; the actual visible-focus-ring behavior itself is what leaving the
browser's default `outline` un-overridden achieves, and is more properly confirmed by the
manual keyboard-only pass already scheduled at T015/T019/T021 once these components are wired
into a running web page. Flagging this now rather than silently claiming the test covers more
than it does.

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-001 (three reachable shell destinations) | `app/(app)/_layout.tsx` renders one `<Tabs.Screen>` per `NAV_DESTINATIONS` entry (no dedicated test file for this layout — see note below); `WebSidebarNav`/`WebBottomBarNav` "renders all three NAV_DESTINATIONS as links with correct roles and labels" |
| FR-002 (native bottom tab bar on iOS/Android) | `app/(app)/_layout.tsx` — `expo-router`'s `<Tabs>` with explicit `tabBarAccessibilityLabel` per screen; verified via `tsc`/web export this batch (see manual-check note above re: native-specific behavior needing a simulator pass, scheduled at T015) |
| FR-003 (web shell via dedicated `.web.tsx`, no inline `Platform.OS`) | `WebSidebarNav`/`WebBottomBarNav` both "wraps an expo-router Slot for the active screen"; the no-`Platform.OS` constraint verified by inspection (neither file imports `Platform`) |
| SC-002 (reachable/operable via keyboard alone, zero pointer-only elements) | `WebSidebarNav`/`WebBottomBarNav` "renders each destination as an enabled, keyboard-reachable link" |
| SC-003 (no horizontal overflow at 375px) | `WebBottomBarNav` structural design (horizontal `flexDirection: "row"`, `justifyContent: "space-around"`, 3 links only) — no dedicated 375px-viewport test this batch; full responsive-width verification is T021's job once the breakpoint switch (T012) and route wiring (T014) exist to render at a given width |

### Note on T009 not having a dedicated test file

Per the task-implementer's brief and consistent with this repo's existing precedent
(`app/(auth)/_layout.tsx` and `app/(onboarding)/_layout.tsx` from `001-registration-kyc` have
no test files either), `app/(app)/_layout.tsx` was **not** given a dedicated component/screen
test this batch. Rationale: it is pure `expo-router` `<Tabs>` configuration with no rendering
target yet (no screens exist inside the `(app)` group until T014), and mounting `<Tabs>` in
isolation under Jest would either require a heavier router-context mock than this repo has
established anywhere, or would only assert the same `NAV_DESTINATIONS`-mapping structure that
`src/domain/navigation.test.ts` (T001) already covers at the data level. The `npx expo export
--platform web` run above is this batch's build-level evidence that the file bundles
correctly; FR-001/FR-002 native behavior is scheduled for simulator-level confirmation at
T015, matching how `001`'s own route-group layout files were verified.

### Tasks now `[X]`

- T009
- T010
- T011

### Deviations from plan

None in scope or described behavior. One mechanical TypeScript fix (`accessibilityRole=
"navigation"` → `role="navigation"`, detailed above) was needed to satisfy strict mode; it
changed no described behavior, label, or test assertion from what T009/T010/T011 specify. No
icons were added to `WebSidebarNav`/`WebBottomBarNav` (unlike the native tab bar) — neither
task's text requires them, and adding a third local icon-lookup table purely for visual
parity was judged out of this batch's stated scope; if the human wants icon parity on the web
treatments too, that's a one-line addition at `app/(app)/_layout.web.tsx` (T012) or a follow-up
task, not a blocker here. No "active destination" highlighting was added to either web
component (e.g. via `usePathname()`) — neither T010 nor T011's task text requires it, and it is
naturally in scope for `app/(app)/_layout.web.tsx` (T012) or a later polish task if desired,
not this batch's three isolated leaf components.

---

## Run 6 — Phase 3 (User Story 1, MVP): T012, T013

**Scope**: Exactly T012 and T013 from `specs/004-home-scan-shell/tasks.md`, per the
task-implementer's brief. Both touch disjoint files and have no dependency on each other,
though both build on Phase 2/3 work already done (T001, T003, T007, T008, T010, T011). **Not**
included in this batch (deliberately, per the brief): `app/(app)/index.tsx`, `app/(app)/
amigos.tsx`, `app/(app)/social.tsx`, and the removal of `app/index.tsx` — that atomic
route-wiring change is T014, the very next task, not part of this batch.

### Files changed

- `app/(app)/_layout.web.tsx` (new) — the web-only shell layout. Reads
  `useWindowDimensions()` (from `react-native`) and calls `resolveWebNavLayout(width)`
  (`src/domain/navigation.ts`, T001) to pick `WebSidebarNav` (T010, `>=768px`) or
  `WebBottomBarNav` (T011, `<768px`). No inline `Platform.OS` branch anywhere — the `.web.tsx`
  file extension itself is the platform split (Constitution IV, FR-003). Default export
  (`AppWebLayout`), matching `app/(app)/_layout.tsx`'s (T009) existing default-export
  convention.
- `app/(app)/_layout.web.test.tsx` (new) — RNTL, 3 tests. Mocks
  `"react-native/Libraries/Utilities/useWindowDimensions"` directly (the module RN's own
  `useWindowDimensions` re-export resolves to at runtime — confirmed by reading
  `node_modules/react-native/index.js`'s lazy getter and `node_modules/react-native/Libraries/
  Utilities/useWindowDimensions.js`'s default export before writing the mock, rather than
  guessing) so the reported width is controllable per test, and mocks `"expo-router"` the same
  way `WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx` (T010/T011) already do, since both
  nav components render expo-router's `<Link>`/`<Slot>`.
  - Renders at 767px width → `getByTestId("web-bottom-bar-nav")` present, `web-sidebar-nav`
    absent (US1 AS4, FR-003).
  - Renders at 800px width → `getByTestId("web-sidebar-nav")` present, `web-bottom-bar-nav`
    absent (US1 AS5, FR-003).
  - Live-resize case (US1 AS6): renders at 767px (bottom bar), then changes the mocked width to
    800px and calls RNTL's `rerender()` on the *same* render result (not a fresh `render()`/
    `unmount()` call) — asserts the sidebar now renders, the bottom bar no longer does, and the
    (mocked) active-screen `<Slot/>` marker is still present immediately after the switch.
- `src/features/navigation/HomeScreen.tsx` (new) — the Home/Scan screen itself. Composes
  `AmigosQuickAccessPill` (T008, top-left), `TopRightControls` (T007, top-right vertical
  stack), and `ScanEntryCard` (T003, dead centre) inside three `View`s (`home-screen-top-left`/
  `home-screen-top-right`/`home-screen-centre` `testID`s), matching the wireframe's described
  layout (top row containing top-left then top-right, centre row below it). `ScanEntryCard`'s
  `onPress` is wired to a local no-op placeholder function (`handleScanEntryPress`, module-level,
  not inline in the JSX) with a comment stating real navigation wiring to `SCAN_ROUTE` is T016
  (User Story 2) — not invented here. No business logic in the component body at all
  (Constitution IV) — it purely composes already-built, already-tested pieces.
- `src/features/navigation/HomeScreen.test.tsx` (new) — RNTL, 4 tests. Mocks `expo-router`'s
  `useRouter` the same way `AmigosQuickAccessPill.test.tsx` (T008) does, since `HomeScreen`
  renders that pill directly.
  - The Amigos pill renders inside the top-left container (`within(getByTestId(...))`,
    `getByRole("button", { name: "Amigos" })`).
  - All four top-right controls render inside the top-right container
    (`within(...).getAllByRole("button")` has length 4).
  - The scan card renders inside the centre container with its real accessible name
    (`"Scan a card"`).
  - A render-order check across the whole tree: `getAllByRole("button")`'s accessible-name
    sequence is exactly `["Amigos", <4 top-right labels in order>, "Scan a card"]` — the
    structural stand-in for "top-left, then top-right, then centre" since exact pixel position
    isn't meaningful in RNTL (per the task brief and `docs/verification.md`).
- `specs/004-home-scan-shell/tasks.md` — marked T012 and T013 `[X]`.

### The live-resize test's honesty boundary (documented in the test file itself)

Before writing the AS6 (live-resize) test, I reasoned through what it can and cannot actually
prove, given that `WebSidebarNav` and `WebBottomBarNav` (T010/T011, already approved,
out of scope to change here) are two *different* components, each independently wrapping its
own `<Slot/>`. When `app/(app)/_layout.web.tsx`'s ternary switches which one renders, React's
reconciliation necessarily unmounts one subtree (including its nested `<Slot/>` instance) and
mounts the other — this is fundamental React behavior when a sibling *type* changes at a given
tree position, not something a differently-written test could avoid without changing T010/T011
themselves (out of scope for this batch). So a literal "the same `<Slot/>` React instance,
carrying local component state, survives the switch" claim would be false, and asserting it
would be exactly the "green test, broken app" anti-pattern `docs/verification.md` warns
against (from `001-registration-kyc`'s own history).

Per the task's own documented fallback ("if `<Slot/>` itself can't easily carry test state, at
minimum assert the switch happens without the whole tree being torn down and rebuilt"), the
test instead asserts: the switch happens via a single RNTL `rerender()` call on the *same*
render result (not `render()` + `unmount()` + a fresh `render()`), and the active-screen
`<Slot/>` marker is present again immediately after. This is what actually distinguishes "a
live re-render triggered by a width change" from "a page reload" at the level this task (T012)
is responsible for — the surrounding app/router context stays mounted throughout, only this
one layout file's rendered choice changes. What genuinely survives a real browser resize (the
*active route*, tracked in expo-router's own router context above this layout, not in a
`<Slot/>` instance's local state) isn't something a component-level test of this file can
observe directly. Both the reasoning and its limits are written into the test file's own
top-of-file comment, not left implicit.

### Constitution / conventions compliance

- Principle IV: `app/(app)/_layout.web.tsx` contains zero inline `Platform.OS` branching (the
  `.web.tsx` extension is the entire platform split) and zero business logic — it only calls
  the already-pure `resolveWebNavLayout` (T001) and renders one of two already-built
  components. `HomeScreen.tsx` embeds no fetch/validation/transform logic — it composes
  already-tested leaf components and forwards a no-op placeholder handler.
- No new dependency added — both files use only `react-native` core (`useWindowDimensions`)
  and already-installed/already-used `expo-router` exports, plus components already built in
  this feature.
- No `any`; strict mode respected (see type-check below). Function components only, default
  export for the layout file (matching T009's existing convention), named export for
  `HomeScreen` (matching every other component in `src/features/navigation/`).
- Comments capture only non-obvious "why" (the mock-target reasoning for `useWindowDimensions`,
  the live-resize test's documented honesty boundary, the placeholder-onPress cross-reference
  to T016), per `docs/conventions.md`.

### Tests run

```
npx tsc --noEmit
```
→ clean, no output (no type errors).

```
npx jest --testPathPattern "_layout.web.test"
```
```
PASS app/(app)/_layout.web.test.tsx
  app/(app)/_layout.web.tsx
    ✓ renders WebBottomBarNav at 767px width (6 ms)
    ✓ renders WebSidebarNav at 800px width (1 ms)
    ✓ live-switches from the bottom bar to the sidebar on resize without a full remount (2 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

```
npx jest src/features/navigation/HomeScreen.test.tsx
```
```
PASS src/features/navigation/HomeScreen.test.tsx
  HomeScreen
    ✓ renders the Amigos quick-access pill top-left (22 ms)
    ✓ renders the four top-right placeholder controls top-right (3 ms)
    ✓ renders the scan entry card dead centre (2 ms)
    ✓ renders the Amigos pill, then the top-right controls, then the scan card, in that order (2 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

Full suite (regression check, not just the new files):

```
npx jest
```
```
Test Suites: 32 passed, 32 total
Tests:       221 passed, 221 total
```

`./init.sh --skip-build` (fast path, as instructed — not the full build/native-export stages):
```
RESULT: SUCCESS (8/8 stages passed)
```
Type-check, npm install, and the full test suite all `OK`; the two pre-existing `WARN`s
(`expo-doctor` outdated-dependency advisories, native-dependency-version drift for
`expo-image-picker`/`react-native`/`react-native-safe-area-context`/`@types/react`/
`typescript`) are unrelated to this batch — present before this run, not introduced by either
new file, and non-blocking per `docs/verification.md`.

**Build check (Level 4, partial — web only, extra check this batch, beyond what was asked)**:
ran `npx expo export --platform web` (output discarded to the scratchpad, not committed) as an
additional sanity check that Metro actually resolves/bundles both new files with no import
errors — it completed cleanly (`/(app)` still exports as its own static route, `14.5 kB`,
alongside every pre-existing route). This is *not* a substitute for T022's full three-platform
`./init.sh` run; it's extra evidence this batch's new files don't break Metro's web module
graph, given `app/(app)/_layout.web.tsx` is now present for the first time.

**Manual smoke check (Level 3)**: not performed via `npm run web` as a *visual* check this run
— `HomeScreen` and `app/(app)/_layout.web.tsx` are still not reachable from any live route yet.
`app/(app)/index.tsx` (which would render `HomeScreen`) does not exist, and `app/index.tsx` is
still the untouched repo-scaffold placeholder (both are explicitly T014's job, excluded from
this batch by the brief). There is nothing new for a human to visually observe by opening the
app yet, matching this phase's own task ordering — T014 wires the routes, T015 is this phase's
dedicated manual-smoke-check task once that wiring exists (both AS4/AS5/AS6's actual
browser-resize behavior and `HomeScreen`'s real on-screen layout). RNTL Level 2 tests above are
this batch's applicable behavioral evidence; the web-export check above is this batch's
applicable build-level evidence.

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-003 (web shell via dedicated `.web.tsx`, sidebar ≥768px / bottom bar below, no inline `Platform.OS`, live re-render on resize) | `app/(app)/_layout.web.tsx` "renders WebBottomBarNav at 767px width", "renders WebSidebarNav at 800px width", "live-switches from the bottom bar to the sidebar on resize without a full remount"; no-`Platform.OS` constraint verified by inspection (the file imports no `Platform`) |
| FR-004 (centre "+" card, dead centre) | `HomeScreen` "renders the scan entry card dead centre" |
| FR-006 (four top-right controls, positioned top-right) | `HomeScreen` "renders the four top-right placeholder controls top-right" |
| FR-008 (top-left Amigos pill, same destination as the tab) | `HomeScreen` "renders the Amigos quick-access pill top-left" |
| US1 AS4 (narrow web viewport → bottom-bar treatment) | `app/(app)/_layout.web.tsx` "renders WebBottomBarNav at 767px width" |
| US1 AS5 (≥768px web viewport → sidebar treatment) | `app/(app)/_layout.web.tsx` "renders WebSidebarNav at 800px width" |
| US1 AS6 (resize across the breakpoint live-switches without a reload/lost destination) | `app/(app)/_layout.web.tsx` "live-switches from the bottom bar to the sidebar on resize without a full remount" — see the "honesty boundary" note above for exactly what this does and does not prove |

### Tasks now `[X]`

- T012
- T013

### Deviations from plan

None. `app/(app)/_layout.web.tsx` matches T012's description exactly (reads
`useWindowDimensions()`, calls `resolveWebNavLayout`, no inline `Platform.OS` branch).
`HomeScreen.tsx` matches T013's description exactly (composes all three named components in
the stated positions, placeholder `onPress`, real navigation wiring deferred to T016). The one
judgment call — how to test US1 AS6's "live re-render, not reload" claim honestly given
T010/T011's already-approved two-separate-`<Slot/>`-wrapping design — is not a deviation from
either task's text (both explicitly anticipate this exact fallback: T012's task description
says "without unmounting/remounting the active screen's state" and the batch brief's own
elaboration on it says "if `<Slot/>` itself can't easily carry test state, at minimum assert
the switch happens without the whole tree being torn down and rebuilt") — it is documented in
detail both in this report and in the test file's own top-of-file comment, in case a reviewer
wants to reconsider T010/T011's design (e.g. hoisting a single shared `<Slot/>` above the
sidebar/bottom-bar conditional so it never remounts) as a later polish task. No such change was
made to T010/T011 in this batch, since neither is in this batch's scope.

## Run 7 — Phase 3 (User Story 1, MVP): T014 (atomic route wiring — highest-risk task in this feature)

### Scope

T014 only: wire `app/(app)/index.tsx` (renders `HomeScreen`, T013), `app/(app)/amigos.tsx`
(renders `AmigosPlaceholderScreen`, T005), `app/(app)/social.tsx` (renders
`SocialPlaceholderScreen`, T006), and **remove `app/index.tsx`** (the repo-scaffold
placeholder) in the same change, so `"/"` never briefly resolves to neither file and never to
both.

### Files changed

- `app/(app)/index.tsx` (new) — renders `HomeScreen` (`@/features/navigation/HomeScreen`), no
  business logic, no props. This is what `001-registration-kyc`'s `resolveKycRoute()` "main"
  route now lands on.
- `app/(app)/amigos.tsx` (new) — renders `AmigosPlaceholderScreen`
  (`@/features/social/AmigosPlaceholderScreen`).
- `app/(app)/social.tsx` (new) — renders `SocialPlaceholderScreen`
  (`@/features/social/SocialPlaceholderScreen`).
- `app/index.tsx` (removed, `git rm`) — the repo-scaffold placeholder ("Draw-a-card... one
  codebase, three targets" text). Its purpose is now served by `app/(app)/index.tsx` through
  the same `"/"` URL via the `(app)` route group. Removed in the same tool-call batch as the
  three additions above, per the spec's "one atomic change" requirement — there was never a
  point in this session where `git status` showed both `app/index.tsx` and `app/(app)/
  index.tsx` present, nor a point where neither was present.
- `app/(app)/index.test.tsx`, `app/(app)/amigos.test.tsx`, `app/(app)/social.test.tsx` (new) —
  route-level tests, one per new route file (see Tests below).
- `specs/004-home-scan-shell/tasks.md` — T014 marked `[X]`.

No other files changed. `app/_layout.tsx`, `src/domain/kyc-gate.ts`,
`src/features/identity/useKycGate.ts`, and `KYC_ROUTE_TARGETS` were **not** modified in the
final diff (FR-009) — see the "Manual verification" section below for a temporary, fully
-reverted edit made to `app/_layout.tsx` during this run's manual check only, confirmed
byte-identical to its pre-run state (`git diff --stat app/_layout.tsx` shows nothing) before
this run ended.

### Verifying `app/_layout.tsx`'s routing mechanism (read before implementing, as instructed)

`app/_layout.tsx`'s `<Stack screenOptions={{ headerShown: false }} />` has **no explicit
`<Stack.Screen>` children** — expo-router's file-based routing auto-discovers every route under
`app/` (including nested groups) and registers them on that `<Stack>` automatically. This means
the `(app)` route group (its own `_layout.tsx`/`_layout.web.tsx`, T009/T012) is picked up as one
of the Stack's screens with no code change needed in `app/_layout.tsx` itself — exactly what
lets this task be "just" adding/removing route files rather than also touching the root layout.
Confirmed this concretely, not just by reading the file, via `npx expo export --platform web`'s
route list (see Build check below): `"/"` resolves to exactly one exported route (backed by
`app/(app)/index.tsx` through the group) — no ambiguity, no duplicate, no missing route.

### Tests written

- `app/(app)/index.test.tsx` (new, 1 test) — renders `HomeRouteScreen` (mocking `expo-router`'s
  `useRouter` the same way `HomeScreen.test.tsx`/T013 does, since `HomeScreen` composes
  `AmigosQuickAccessPill` which calls it directly), asserts `getByTestId("home-screen")` and the
  scan card's real accessibility label are present — i.e. this is the real Home/Scan screen,
  not the removed scaffold placeholder. *(FR-001, FR-009)*
- `app/(app)/amigos.test.tsx` (new, 1 test) — renders `AmigosRouteScreen`, asserts the Amigos
  placeholder's identifying header renders. *(FR-007)*
- `app/(app)/social.test.tsx` (new, 1 test) — renders `SocialRouteScreen`, asserts the Social
  placeholder's identifying header renders, distinct from Amigos. *(FR-007)*

**Honesty note on what these tests do and do not prove** (per this task's own explicit
instruction to be candid about testing gaps): these three tests each import their route file's
default export directly and render it standalone with React Native Testing Library — they prove
"this file renders that screen," not "expo-router's file-based router resolves the URL `/` to
this exact file with no other candidate." This repo has no existing pattern anywhere (checked
`app/(auth)/*.test.tsx`, `app/(onboarding)/*.test.tsx`) for rendering through expo-router's
actual file-based resolution in Jest — every existing route-level test in this codebase uses
the same "import the default export, render it directly" pattern, not `expo-router/testing-
library`'s router harness (not installed, and adding it would be a new-dependency decision
beyond this task's scope). So a true integration-level "does `/` actually resolve to
`app/(app)/index.tsx` and not to something else" test is **not practical with this codebase's
existing test-mocking patterns**, exactly as this task anticipated as a possible outcome. This
gap is covered instead by two other, non-Jest forms of evidence: the build-export route list
(Build check below, which directly answers "is there ambiguity or a missing route at `/`") and
a real headless-browser render (Manual verification below, which directly answers "does a user
landing on `/` actually see the Home/Scan screen").

### Test run (full suite)

```
npx jest
...
Test Suites: 35 passed, 35 total
Tests:       224 passed, 224 total
Snapshots:   0 total
Time:        1.565 s, estimated 2 s
Ran all test suites.
```

All 35 suites (32 pre-existing + 3 new route tests) pass, including every test from Runs 1–6.

### Type-check

```
npx tsc --noEmit
```
No output — clean.

### Build check (`docs/verification.md` Level 4, web)

```
npx expo export --platform web
```
Succeeded. Route list (relevant excerpt):

```
Exporting 18 static routes:
/ (index) (14.5 kB)
/amigos (14.5 kB)
/social (14.5 kB)
...
/(app) (14.5 kB)
/(app)/amigos (14.5 kB)
/(app)/social (14.5 kB)
...
```

Exactly one `/` entry (no duplicate, no "both files present" ambiguity), plus the group-prefixed
aliases (`/(app)`, `/(app)/amigos`, `/(app)/social`) that expo-router also emits for every route
group in this app — the same alias pattern already exists for `/(auth)/profile` alongside
`/profile`, `/(auth)/register` alongside `/register`, etc. (pre-existing 001 behavior, not new
here), so this is not evidence of a new ambiguity, it's the expected static-export shape. No
`app/index.tsx`/`app/(app)/index.tsx` conflict was reported by the exporter, and no
`+not-found`-only fallback appeared for `/`. Did not run the iOS/Android export stages this run
(no code under this task touches native-only files; T022, the feature-wide `./init.sh` end-to-
end check, is explicitly a later, separate task) — flagging that narrowing explicitly rather
than claiming full Level 4 coverage.

### Manual verification (`docs/verification.md` Level 3) — what was actually observed, and the real limits of this environment

**What I do and do not have access to.** This environment has no live backend, no configured
Supabase project (`.env`'s `EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` are empty), and no browser-
driving tool in my own toolset (no Playwright/Puppeteer, no screenshot tool — only `Bash`/
`Read`/`Write`/`Edit`). So a literal "register a real onboarded user through the UI and watch
it land on Home in a window I can see" was not possible. Rather than settle for "should work,"
I built the closest available real-browser proof:

1. **Confirmed a real machine-local browser exists**: `/Applications/Google Chrome.app`. Used it
   headless (`--headless=new --dump-dom`) against a genuinely running `expo start --web` dev
   server — i.e. actual client-side JS execution in a real browser engine, not a Node-side
   prerender simulation, not RNTL's `react-test-renderer`.
2. **Forced the gate to `"main"` for this check only**: temporarily edited `app/_layout.tsx`'s
   `KycGate()` to hardcode `{ route: "main", isLoading: false }` in place of calling
   `useKycGate()` (commented `TEMP-MANUAL-VERIFICATION-ONLY`, explicit revert-before-done note
   inline). This was the only way to reach the "onboarded user" state this task needed to
   observe, given no real session is obtainable in this environment. **Reverted immediately
   after the check** — `git diff --stat app/_layout.tsx` after reverting shows no changes; this
   file is not part of the delivered diff.
3. **Ran `expo start --web`** and hit it with headless Chrome at three routes:
   - `http://localhost:8098/` → dumped DOM contains `data-testid="home-screen"`,
     `data-testid="home-screen-top-left"` with `>Amigos<` text (the quick-access pill),
     `data-testid="home-screen-top-right"` with the four control buttons' `data-testid="top-
     right-controls"`, `data-testid="home-screen-centre"` with `data-testid="scan-entry-card"`
     and the text "Scan a card", and — at the default (narrow) headless window width —
     `data-testid="web-bottom-bar-nav"`. No occurrence of "unmatched" anywhere in the dumped
     DOM. This is the real Home/Scan screen rendering with the shell visible, not a blank
     screen, not the removed scaffold placeholder, not an unmatched-route error — directly
     satisfying SC-001's core claim for the web target.
   - Re-ran at `--window-size=1200,900` → dumped DOM contains `data-testid="web-sidebar-nav"`
     instead of the bottom bar — confirms the `(app)/_layout.web.tsx` breakpoint switch (T012,
     already-approved, out of this task's own scope) composes correctly with this task's new
     route files, not just in isolation.
   - `http://localhost:8098/amigos` → dumped DOM contains `>Amigos<` and "friends list isn"
     (the placeholder copy) — confirms `app/(app)/amigos.tsx` renders the real
     `AmigosPlaceholderScreen`, reached via the actual dev-server route, not just a direct
     component import in a Jest test.
   - `http://localhost:8098/social` → dumped DOM contains `>Social<` and "social feed isn" —
     same confirmation for `app/(app)/social.tsx`.
4. **Stopped the dev server and fully reverted both the diagnostic file move and the gate
   monkey-patch** (see the finding below for why the file had to be moved out of the way to get
   the dev server running at all). `git status --short` at the end of this run shows the exact
   same untracked-file set as at the start of the run, plus this task's own new/removed files —
   no stray edits to any T001–T013 file.

**This is genuine browser-level evidence** (real Chrome, real JS execution, real DOM after
render) that the three new route files correctly wire to their intended screens and that
landing on `"main"` produces a fully rendered Home/Scan screen with the shell visible — not a
"should work" claim. The one honest gap: this was headless Chrome hitting a dev server, not a
human watching a visible browser window open via `npm run web`, and the "onboarded user" state
was reached via a temporary, fully-reverted source edit rather than a real backend session
(neither of which was avoidable in this environment, per point 1 above). Anyone re-verifying
this with a real local backend + Supabase project configured should still do the literal
`npm run web` + watch-it-happen pass this task's brief originally asked for.

### Finding — pre-existing, NOT caused by this task, but blocks `npm run web` for this entire feature (flagging for the orchestrator/human, not fixing myself)

While starting `expo start --web` for the manual check above, the dev server **crashed on
startup** with:

```
Error: The layouts "./(app)/_layout.web.tsx" and "./(app)/_layout.web.test.tsx" conflict on the
route "/(app)/_layout". Please remove or rename one of these files.
    at getDirectoryTree (node_modules/expo-router/src/getRoutesCore.ts:166:19)
    ...
    at getRoutesManifest (@expo/cli/src/start/server/metro/createServerRouteMiddleware.ts:50:45)
```

Root cause, confirmed by isolation (moved `app/(app)/_layout.web.test.tsx` out of `app/`
temporarily, restarted, dev server started cleanly; moved it back after): `metro.config.js`
already has a `config.resolver.blockList` specifically added ("T012 follow-up," per its own
comment) to stop colocated `*.test.ts(x)` files under `app/` from being bundled as real routes
— but that `blockList` only affects **Metro's own module-resolution/bundling**. `expo start`'s
dev-server route-manifest computation (`getRoutesSSR.ts` → `getDirectoryTree`, used by
`@expo/server`'s middleware to serve the interactive dev server, a different code path from
`expo export`'s static-export route resolution) scans the raw filesystem directly and is **not**
filtered by that blockList, so it sees `_layout.web.tsx` and `_layout.web.test.tsx` as two
layouts for the same route segment and refuses to start at all.

This is **not** caused by T014 — `app/(app)/_layout.web.test.tsx` was created in Run 6 (T012),
before this task, and this task touches none of `app/(app)/_layout.web.tsx`,
`app/(app)/_layout.web.test.tsx`, or `metro.config.js`. It was simply never exercised via
`expo start --web` until this run, since T015 (the feature's own dedicated manual-smoke-check
task, which explicitly calls for `npm run web`) has not run yet. `npx expo export` (used for
this and prior runs' Level 4 build checks) does **not** hit this code path, which is exactly why
it stayed green through Runs 5–6 while `npm run web` was silently broken — a textbook instance
of the "green tests/build, broken app" pattern `docs/verification.md` warns about, just one
layer further out than usual (broken dev server, not broken bundle).

**This blocks T015, T019, and T021 as written** — all three require `npm run web`
(`= expo start --web`) and will hit this exact crash the moment anyone runs them, for any route
under `(app)/`, not just this task's three. I did not fix it myself: fixing it means editing
either `metro.config.js` (broadening its blockList's reach, if that's even the right tool for
this specific dev-server code path) or renaming/relocating `app/(app)/_layout.web.test.tsx`
(T012's file, not T014's), and my instructions are to stay scoped to T014 and to stop and report
rather than improvise a fix to something outside my assigned task. **This needs a decision and
almost certainly a small fix task before T015 can be attempted for real** (something like: move
colocated route tests for `_layout.*` files specifically to a non-colocated test location, or
find whatever config actually gates `getRoutesSSR`'s directory scan — `expo-router`'s own docs/
source would need checking for a supported "exclude from routes" mechanism, since this repo's
existing colocation convention for `<file>.test.tsx` clearly cannot coexist with `expo start`
for any `_layout.*` file in its current form, and this shell feature's directory tree has three
of them: `_layout.tsx`, `_layout.web.tsx`, and (if one gets added) `_layout.test.tsx`/
`_layout.web.test.tsx`).

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-001 (Home/Scan is a reachable shell destination, landed on by `"main"`) | `app/(app)/index.tsx` "renders the Home/Scan screen"; real-browser confirmation in Manual verification above |
| FR-007 (Amigos/Social are reachable, distinctly-labelled placeholders, never an unmatched-route error) | `app/(app)/amigos.tsx` "renders the Amigos placeholder screen"; `app/(app)/social.tsx` "renders the Social placeholder screen"; real-browser confirmation of both routes above (no "unmatched" text in either dumped DOM) |
| FR-009 (this feature does not modify `resolveKycRoute()`/`useKycGate()`/`KYC_ROUTE_TARGETS`; only changes what `"main"` renders) | Verified by inspection: `git diff` against `src/domain/kyc-gate.ts`, `src/features/identity/useKycGate.ts` is empty for this run; `app/_layout.tsx`'s only edit this run was a temporary, fully-reverted manual-check patch (see above), confirmed reverted before this run ended |

### Tasks now `[X]`

- T014

### Deviations from plan

None to the task's own file scope — `app/(app)/index.tsx`, `amigos.tsx`, `social.tsx` were
created exactly as specified, and `app/index.tsx` was removed in the same change (never a
window where both/neither existed — confirmed by never running a partial `git add`/commit
between the four file operations). The one deviation worth flagging for sign-off is the
**pre-existing `expo start --web` crash finding above** — it is not a deviation from T014's own
plan, but it is new information that changes what "done" can mean for T015/T019/T021 as
currently worded, and needs the human/orchestrator's decision on how to fix it before those
tasks are attempted.

---

## Dev-server-crash fix (not T014, not T015) — `npm run web` startup crash

**Scope**: a targeted bug fix surfaced by `code-reviewer`'s T014 review (`REQUEST CHANGES`,
see `progress/review_004-home-scan-shell.md`'s final entry). Not one of `tasks.md`'s numbered
tasks — nothing to mark `[X]` here. Goal: make `npx expo start --web` (`npm run web`) boot
cleanly and serve real content at `/`, `/amigos`, `/social` (and confirm `/scan`'s current
behavior), unblocking T015/T019/T021.

### Root cause, confirmed by reading the installed source (not guessed)

`npm run web` crashed on startup with:

```
Error: The layouts "./(app)/_layout.web.tsx" and "./(app)/_layout.web.test.tsx" conflict on the
route "/(app)/_layout". Please remove or rename one of these files.
```

Reproduced live first (`npx expo start --web`, unprompted crash + `curl` to `/` returning
`HTTP_STATUS:500` with the stack trace as the response body), then traced the exact mechanism
by reading `node_modules/expo-router/build/getRoutesCore.js`,
`node_modules/@expo/cli/build/src/start/server/metro/{router,fetchRouterManifest,createServerRouteMiddleware}.js`
directly:

1. **The dev server's route-manifest scan is a separate code path from `expo export`,
   confirmed in the source, not inferred.** `@expo/cli`'s `getRoutePaths(cwd)`
   (`start/server/metro/router.js`) does `glob.sync("**/*.@(ts|tsx|js|jsx)", { cwd, dot: true })`
   directly against the `app/` directory **on disk** — a raw filesystem glob, completely
   independent of Metro's `resolver.blockList` (which only filters Metro's own
   bundling/module-resolution graph, the code path `expo export` and the dev server's actual JS
   bundling both go through). There is **no** option passed through this call, and no
   app.json/expo-router config hook anywhere in this installed version (`expo-router@3.5.24`)
   that filters this specific glob. This directly answers investigation step 2 from the brief:
   there is no supported "exclude from routes" mechanism at this version — relocating the file
   is the only available fix, not a config change.
2. **Why this hits `_layout.*` files and not ordinary screen tests — read directly from
   `getDirectoryTree` in `getRoutesCore.js`, not assumed:**
   - `getFileMeta(key)` computes `isLayout` from `filenameWithoutExtensions === "_layout"` and
     a `platformExtension`, both derived by taking `removeSupportedExtensions(filename)`
     (which strips only the final `.ts/.tsx/.js/.jsx`) and splitting the result on `.`, then
     destructuring **only the first two** elements. For `_layout.web.test.tsx`, that yields
     `["_layout", "web", "test"]` → `filenameWithoutExtensions = "_layout"`,
     `platformExtension = "web"` — the `"test"` third segment is silently dropped by the
     destructuring and never examined. This makes `_layout.web.test.tsx` computationally
     **indistinguishable** from `_layout.web.tsx` itself: same `isLayout`, same
     `platformExtension`, same resulting specificity (`2`, since the extension matches
     `options.platform`).
   - Critically, `getDirectoryTree`'s conflict check for layouts is keyed **only** on
     `directory.layout[specificity]` — a single slot per directory per specificity level, not
     a filename- or route-name-keyed map. Two files landing in the same directory at the same
     specificity — regardless of what their full filenames are — collide, and outside
     production (`NODE_ENV !== "production"`, i.e. exactly `expo start`'s dev server) this
     throws the literal "the layouts ... conflict" error rather than silently picking one (as
     production/`expo export` does).
   - Ordinary screen files take the **other** branch of the same function
     (`directory.files.get(route)`, keyed by the computed route **name**, not specificity
     alone). For a plain `register.test.tsx`, the two-segment split yields
     `platformExtension = "test"`, which fails `validPlatforms.has(...)`, so `hasPlatformExtension`
     is `false` and the route name is left as the literal `"register.test"` — a distinct route
     name from `"register"`, so no conflict, just an extra (harmless, Metro-blocklisted-from-
     bundling) manifest entry. This is genuinely why the two file kinds behave differently, and
     it is **not** about platform-suffix parsing specifically — it's that layout-conflict
     detection is specificity-keyed while screen-conflict detection is name-keyed. Confirmed
     this generalizes by re-deriving the un-suffixed case: a hypothetical `_layout.test.tsx`
     (no platform segment at all) also collapses to `filenameWithoutExtensions = "_layout"`,
     `platformExtension = "test"` (fails `validPlatforms`, so `specificity = 0`) — the **same**
     specificity as the real `_layout.tsx` (which also gets `specificity = 0`, having no
     platform segment) — so it would conflict too, identically, just via the "no platform
     extension" branch instead of the "matches `options.platform`" branch. **Conclusion for
     investigation step 4 (T009/T016 concern)**: this is narrow to `_layout.*` files
     specifically (any nesting, any platform suffix or none), not to platform-suffix parsing
     in general, and not to screen files at all — `app/(app)/_layout.tsx` (T009, no test file
     today) would hit this exact crash the instant a colocated `_layout.test.tsx` or
     `_layout.<platform>.test.tsx` were added for it, and so would `app/(auth)/_layout.tsx`,
     `app/(onboarding)/_layout.tsx`, or `app/_layout.tsx` (root) under the same condition.
     `app/scan.tsx` (T016) is an ordinary screen file, not a layout — a colocated
     `scan.test.tsx` or `scan.web.test.tsx` would follow the name-keyed screen path and would
     **not** hit this bug.
3. **Isolation test, independently reproduced** (mirroring the prior implementer/reviewer's own
   isolation step): moved `app/(app)/_layout.web.test.tsx` out of `app/` temporarily, restarted
   `expo start --web` — booted cleanly, `curl` to `/` returned `200`. Moved it back — crash
   returned. Confirms the file, not something else, is the trigger.

### Fix chosen

**Relocated the colocated test file out of `app/`, into `src/features/navigation/`,
importing the layout's default export by relative path** — the second option from the brief's
list, and the one investigation steps 1–2 above show is actually correct (no supported
config-level exclusion exists at this `expo-router`/`@expo/cli` version; a metro/expo-router
config change is not available here, so that first-listed option is not viable, not merely
less preferred).

- **Moved** `app/(app)/_layout.web.test.tsx` → `src/features/navigation/AppWebLayout.test.tsx`.
  Same three tests, same mocks (`react-native/Libraries/Utilities/useWindowDimensions`,
  `expo-router`'s `Link`/`Slot`), same assertions — only the import changed, from
  `import AppWebLayout from "./_layout.web"` to
  `import AppWebLayout from "../../../app/(app)/_layout.web"`. Added a top-of-file comment
  explaining *why* this one test file is not colocated, cross-referencing this entry, so a
  future reader doesn't mistake it for an inconsistency.
- **`docs/conventions.md`** — added a narrow, explicit exception to the "Tests" section:
  colocated tests for `_layout.*` files under `app/` must NOT be colocated; they belong in the
  `src/features/<owning-module>/` directory instead, importing the layout's default export by
  relative path. States the reason (the mechanism above) and explicitly scopes the exception to
  `_layout.*` files only — ordinary colocated screen tests
  (`app/(auth)/register.test.tsx`, a future `app/scan.test.tsx`, etc.) are unaffected and stay
  colocated as this repo's convention already establishes. This is the "documented, narrow
  addition to conventions.md" option from the brief's step 3, added because the investigation
  in steps 1–2 showed the fix genuinely requires deviating from straight colocation for this
  one file kind — not a silent one-off special case.
- **`metro.config.js`** — rewrote its existing `T012 follow-up` comment (unchanged code, comment
  only) to state explicitly that `resolver.blockList` does **not** reach the dev server's
  separate route-manifest scan, and to point at `docs/conventions.md`/this entry for the actual
  fix for `_layout.*` files — the previous comment's phrasing ("keeps this repo's test
  colocation convention working... without expo-router ever seeing those files as routes") was
  accurate for Metro's bundling graph but read as broader protection than it actually provides,
  which is exactly what let this crash go unnoticed through T012's own review. No functional
  change to the blockList itself — it is still correct and still needed for ordinary colocated
  screen tests.
- **No `app/(app)/_layout.tsx` (T009) change made** — it has no test file today, so nothing to
  relocate; the `docs/conventions.md` note is what prevents this recurring the moment one is
  added (for T009 or any future `_layout.*` file), per investigation step 4 above.

### Verification

**Type-check and full test suite** (confirms the relocation lost no coverage and broke
nothing):

```
npx tsc --noEmit
```
→ clean, no output.

```
npx jest --silent
```
```
Test Suites: 35 passed, 35 total
Tests:       224 passed, 224 total
```
Identical suite/test counts to the pre-fix baseline (T014's review recorded 35/224) — the
three relocated tests (`AppWebLayout.test.tsx`, formerly `_layout.web.test.tsx`) are still
discovered and still pass; confirmed the file is in Jest's test list
(`npx jest --listTests | grep AppWebLayout` → present) and its 3 tests execute individually.

**`npm run web` genuinely boots and serves real content — verified via three independent
methods, not "no error printed":**

1. **Live dev server, direct HTTP check.** Started `npx expo start --web --port 8102` in the
   background against the fully-reverted, real (non-monkeypatched) codebase. Log shows `Web
   Bundled ... expo-router/entry.js` with no "conflict" error anywhere. `curl -s -o /dev/null
   -w "%{http_code}"` against each route:
   ```
   /        -> 200
   /amigos  -> 200
   /social  -> 200
   /scan    -> 404
   ```
   `/scan` returning `404` is expected, not a regression: `app/scan.tsx` doesn't exist yet
   (T016, not yet built) — confirmed by `ls app/(app)/` and the export route list below, both
   showing no `scan` route at all. This is the same "not-found, not a crash" distinction the
   brief asked to confirm.
2. **Isolation re-check on the fixed tree.** Repeated the "move the file back into `app/`,
   restart, watch it crash again" step with the *relocated* file's original content to confirm
   the fix — not just the absence of a file — is what's holding; reverted immediately after
   (this was a throwaway copy in the scratchpad, not a change to the delivered diff).
3. **Real server-rendered DOM content, not just HTTP status.** This app's `app.json` sets
   `web.output: "static"`, so `expo export --platform web` genuinely server-renders each
   route's initial HTML (confirmed by the bundler log line
   `Bundled ... node_modules/expo-router/node/render.js`), which let me inspect real rendered
   markup per route without a browser-automation tool (headless Chrome, `playwright`, and
   `puppeteer` are all unavailable in this run — Chrome's binary is blocked by this session's
   command classifier, and neither Node package is installed — an environment constraint
   discovered mid-run, not present in this repo's `package.json`). Temporarily patched
   `KycGate()` in `app/_layout.tsx` to unconditionally render `<Stack />` (same "reach `main`
   without a real backend/session" need T014's own manual check hit, but via a plain early
   return this time — an equivalent destructuring-based literal patch produced genuinely
   *incorrect* minified output under this repo's production/export build, a real bundler-level
   finding worth flagging on its own: minifying
   `const {route,isLoading} = {route:"main",isLoading:false}; if (isLoading) return <A/>; return <B/>;`
   compiled to a function that unconditionally returned `<A/>` — visible directly in the
   exported bundle's minified source — so I do not recommend that literal pattern for this
   codebase's future manual checks; a plain early `return` avoided it entirely and produced
   correct output). Ran `npx expo export --platform web`, then read the exported
   `index.html`/`amigos.html`/`social.html` directly:
   - **`/` (`index.html`)**: `data-testid="home-screen"` containing
     `home-screen-top-left` → `amigos-quick-access-pill` labelled `"Amigos"`;
     `home-screen-top-right` → `top-right-controls` with all four labelled buttons
     (`ENG/ESP`, `USD/MXN`, `Notifications`, `Messages`, each with its full accessible-name
     text); `home-screen-centre` → `scan-entry-card` labelled `"Scan a card"` — the real
     Home/Scan screen, not a blank page or the old scaffold, wrapped in
     `web-bottom-bar-nav` (the export's default narrow viewport).
   - **`/amigos` (`amigos.html`)**: `<h1>Amigos</h1>` plus the exact disclaimer body copy
     ("Your friends list isn't available yet. ... no friend list, friend requests, or social
     data here."), plus the shared `web-bottom-bar-nav-list` with `Amigos`/`Home`/`Social`
     links.
   - **`/social` (`social.html`)**: `<h1>Social</h1>` plus its own distinct disclaimer copy
     ("Your social feed isn't available yet. ... no feed, posts, or trading content here."),
     same nav.
   - No `scan.html` exists in the export output at all (matches the `404` above — expected,
     T016 not built).
   Reverted the `KycGate()` patch immediately after — `git diff --stat app/_layout.tsx` /
   `git diff app/_layout.tsx` both empty, confirmed before this fix was considered done.

**Build check**: `npx expo export --platform web` (used for the DOM check above) completed
with no errors, confirming this fix doesn't regress `docs/verification.md` Level 4's web export
stage either.

**`./init.sh --skip-build`**:
```
RESULT: SUCCESS (8/8 stages passed)
```
Type-check and full test suite both `OK`; the two `WARN`s (`expo-doctor` outdated-dependency
advisories, native-dependency-version drift) are pre-existing, present before this fix, and
unrelated to it (same warnings T012's own batch reported).

### Files changed

- `app/(app)/_layout.web.test.tsx` → removed (relocated, not deleted).
- `src/features/navigation/AppWebLayout.test.tsx` (new) — the relocated test, same 3 tests,
  updated import path and a top-of-file comment explaining the relocation.
- `docs/conventions.md` — added the narrow `_layout.*`-test-location exception to the "Tests"
  section.
- `metro.config.js` — comment-only rewrite clarifying `resolver.blockList`'s actual scope (does
  not reach the dev server's separate route-manifest scan); no functional/behavioral change.
- `app/_layout.tsx` — touched only transiently during the manual verification step above
  (temporary `KycGate()` patch), fully reverted; `git diff` against it is empty in the final
  state.

### Requirement traceability

No FR in `specs/004-home-scan-shell/spec.md` is newly introduced or changed by this fix — it is
infrastructure (dev-server route discovery), not product behavior. The fix's own correctness is
covered by: `src/features/navigation/AppWebLayout.test.tsx`'s existing 3 tests (unchanged
assertions, same FR-003/US1 AS4-AS6 comments as before the move), plus the real-content
verification above, which re-confirms FR-001 (Home/Scan reachable), FR-004/FR-006/FR-008 (the
Home/Scan screen's composed elements, visible in the exported `index.html`), and FR-007
(Amigos/Social distinctly-labelled placeholders, visible in `amigos.html`/`social.html`) via
genuine server-rendered markup — a strictly stronger form of the same evidence T014's review
already accepted, not a new claim.

### Tasks now `[X]`

None — this is not a `tasks.md` task. T015 (the feature's own manual-smoke-check task) is now
unblocked and can proceed for real.

### Deviations / notes for sign-off

- The metro/expo-router-config-option direction from the brief's step 3 list was investigated
  and ruled out on the evidence in the "Root cause" section above (no such hook exists in this
  installed `expo-router`/`@expo/cli` version) — not skipped, genuinely unavailable.
- One incidental finding surfaced during verification, flagged for awareness rather than fixed
  (out of this fix's scope): destructuring a literal `{ route: "main", isLoading: false }`
  object and branching on it produced incorrect minified output in this repo's production/
  export build (the minifier kept only the `if (isLoading)` branch's return, dropping the rest
  of the function, even though `isLoading` was statically `false`). This only matters for
  future manual-verification monkeypatches of `app/_layout.tsx`'s `KycGate()` (or similar) —
  it does not affect any shipped code path in this diff, since the patch was reverted before
  this fix was finalized. Worth a mental note for whoever next needs a similar temporary patch
  for a manual check: prefer a plain early `return`, not a literal-object destructuring branch,
  until/unless this minifier behavior is investigated separately.
- No other deviation. This fix does not touch any `tasks.md` task's files beyond the
  already-noted transient, fully-reverted `app/_layout.tsx` edit.

---

## Run 8 — Phase 3 (User Story 1, MVP): T015 (manual smoke check — closes Phase 3/MVP)

### Scope

T015 only: the manual smoke check itself, per `tasks.md`'s own text and this task's brief.
No production file in this diff — the only lasting changes are `specs/004-home-scan-shell/
tasks.md` (T015 marked `[X]`) and this report. One source file (`app/_layout.tsx`) was
temporarily edited to reach the `"main"` state for this check and was **fully reverted** before
this run ended — confirmed empty (`git diff --stat app/_layout.tsx` produced no output) both
mid-run and again at the very end, and the final `git status --porcelain` below is
byte-identical to this run's starting state plus only this run's own two files.

### Starting state confirmed

`git status --porcelain` at the start of this run showed exactly the same untracked/modified
set the T014-review and dev-server-crash-fix entries above left behind (`app/index.tsx`
deleted, `docs/conventions.md`/`feature_list.json`/`metro.config.js`/`progress/current.md`
modified, the T001–T014 new files untracked) — confirmed before touching anything, so this
run's own diff is unambiguous.

`npx tsc --noEmit` and `npx jest --silent` were both re-run first, clean/green
(35 suites / 224 tests), matching the dev-server-crash-fix entry's own baseline exactly — no
drift since that entry closed.

### Environment inventory (what was actually available this run, checked directly, not assumed)

- **Chrome**: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --version` →
  `Google Chrome 150.0.7871.189`, genuinely launchable headless this run (the dev-server-crash-
  fix entry above recorded Chrome as blocked by the command classifier in *that* run's
  environment — this run's sandbox did not block it; confirmed by directly invoking the binary
  successfully, not by re-assuming the prior entry's finding still held).
- **iOS Simulators**: `xcrun simctl list devices` → multiple booted-capable iOS 26.5 devices
  (iPhone 17 Pro, iPhone 17 Pro Max, iPhone 17e, iPhone Air, iPhone 17, several iPads). Booted
  **iPhone 17 Pro** (`0A1C78E6-556A-4E78-BD81-6D747AA15132`) for this run.
- **Expo Go**: already installed on that simulator (`host.exp.Exponent`, `Exponent-2.31.6`,
  confirmed via `xcrun simctl listapps`) — version 2.31.6 corresponds to Expo SDK 51, matching
  this project's installed `expo@51.0.39` (`node_modules/expo/package.json`), so no install step
  was needed.
- **Android**: `which emulator adb` → neither found. **No Android emulator/SDK is available in
  this environment.** Android-specific checks in this task's brief (point 5) are explicitly
  **not performed** — not silently skipped, but genuinely unavailable here, consistent with
  this run's own direct check rather than an assumption carried over from an earlier run.
- **Browser UI automation**: no Playwright/Puppeteer installed (`npm ls playwright puppeteer`
  → empty) and, per Constitution/`docs/conventions.md`'s "no new dependency without a
  documented reason," neither was installed for this one-off manual check. Instead, real Chrome
  was driven directly via the **Chrome DevTools Protocol (CDP)** over a raw WebSocket
  connection from a small Node script (Node 20.20.2's `--experimental-websocket` flag exposes a
  global `WebSocket` client; no npm package added) — genuine browser automation with zero new
  `package.json` dependencies, temporary scripts written only to the scratchpad directory (not
  the repo).
- **macOS Accessibility/UI-automation**: `osascript`'s `System Events` was **not** granted
  Accessibility permission in this sandbox (`osascript is not allowed assistive access
  (-1719)`), so simulated real *taps* on the iOS Simulator's UI (as opposed to Chrome, which CDP
  can drive without that permission) were not possible this run — this genuinely limits what
  could be confirmed natively (see the native section below for exactly where this bit).

### Web verification — real, running `expo start --web`, real Chrome, per finding

Started `npx expo start --web --port 8210` fresh (confirmed no residual process on that port
beforehand). Server log showed `Web Bundled ... expo-router/entry.js` with **no** layout-
conflict error (the dev-server-crash-fix from the prior entry holds) — confirmed again this
run, not re-trusted from the earlier entry:

```
/        -> 200
/amigos  -> 200
/social  -> 200
/scan    -> 404   (expected — app/scan.tsx is T016, not yet built)
```

**Reaching `"main"` without a real backend/session**: this environment has no configured
Supabase project (`.env`'s keys are empty, unchanged from every prior run in this feature), so
a real onboarded session cannot be obtained. Per this task's own brief, temporarily edited
`app/_layout.tsx`'s `KycGate()` to hardcode a `"main"` render (`TEMP-MANUAL-VERIFICATION-ONLY`
comment, original body commented out beneath, not deleted) — the same category of edit the
T014 and dev-server-crash-fix entries above already used and fully reverted. One refinement
worth recording: an early attempt at this patch (a `const {route,isLoading} = {...}` literal
destructure followed by dead code referencing `route`/`isLoading`) failed `tsc --noEmit` with
`TS2538: Type 'undefined' cannot be used as an index type` — TypeScript's control-flow
narrowing for `route: KycRoute | undefined` is lost once the code path becomes unreachable
after an unconditional early return, even though the *reachable* original code narrows it away
cleanly. Not a bug in the shipped code (this dead code was never going to ship), but a genuine
gotcha for future manual `KycGate()` patches: the fix was to comment out the original body
entirely (not leave it as unreachable live code) rather than chase the narrowing loss — `tsc`
went clean immediately after. Reverted via `git checkout -- app/_layout.tsx` at the end of
this run; `git diff --stat app/_layout.tsx` empty, confirmed.

**1) SC-001 — cold `"main"` resolution renders the real Home/Scan screen, no scaffold, no
unmatched-route, at 375px (headless Chrome, real DOM dump):**

```
chrome --headless=new --disable-gpu --dump-dom --window-size=375,800 http://localhost:8210/
```
Dumped DOM contains, and *only* contains, the real screen's test IDs: `home-screen`,
`home-screen-top-left`, `amigos-quick-access-pill`, `home-screen-top-right`,
`top-right-controls`, `home-screen-centre`, `scan-entry-card`, plus `web-bottom-bar-nav` /
`web-bottom-bar-nav-list` (the narrow-width shell treatment). Zero occurrences of the string
"unmatched" anywhere in the dump. This is genuine browser-rendered evidence — real Chrome, real
JS execution, real post-render DOM — not RNTL's `react-test-renderer` output and not a
"should work" claim. **SC-001 confirmed for web.**

**2) AS4/AS5 — narrow (375px) → bottom bar, wide (≥768px) → sidebar (headless Chrome, two
independent window sizes):**

- `--window-size=375,800` → `web-bottom-bar-nav` present, `web-sidebar-nav` absent (shown above).
- `--window-size=1000,900` → dumped DOM contains `web-sidebar-nav`/`web-sidebar-nav-list`,
  no bottom-bar test IDs at all.

**AS4/AS5 confirmed.**

**3) AS6 — resizing across 768px live-switches without a reload and without losing the active
destination (CDP-driven real browser-window resize — the strongest evidence gathered this
run, closing the honesty gap the T012 review flagged as unverifiable by RNTL alone):**

Launched Chrome headless with `--remote-debugging-port=9333`, connected over a raw WebSocket to
the page target, and used `Browser.getWindowForTarget` + `Browser.setWindowBounds` — a genuine
OS-level window resize of the actual browser window, not `Emulation.setDeviceMetricsOverride`'s
device-emulation shortcut — to resize live while the page stayed mounted. Navigated first to
`/amigos` (via `Page.navigate`) so the "active destination" being preserved is meaningfully
non-default, planted a `window.__T015_MARKER__` global (a value that only survives if there is
no full page reload — a reload would reset any JS global), then resized:

```
BEFORE RESIZE  (width 500, /amigos): testids = [web-bottom-bar-nav, web-bottom-bar-nav-list]
AFTER RESIZE   (width 1000, /amigos): testids = [web-sidebar-nav, web-sidebar-nav-list], marker = "still-alive"
AFTER RESIZE BACK (width 500, /amigos): testids = [web-bottom-bar-nav, web-bottom-bar-nav-list], marker = "still-alive"
```

All three snapshots: `url` stayed `/amigos` throughout — the active destination was never lost.
The `__T015_MARKER__` global survived both resizes — direct proof no full reload occurred
(reversing direction and getting the *same* live switch back is stronger evidence than a
one-way check would have been). The full script is in
`/private/tmp/.../scratchpad/cdp-resize-check.mjs` (scratchpad only, not part of this repo's
diff). **AS6 confirmed by genuine real-browser evidence**, not inferred solely from
`AppWebLayout.test.tsx`'s RNTL `rerender()` proxy (that test remains valid supporting evidence,
per the T012 review's own documented honesty-boundary note, but this run adds the actual
browser-level confirmation that test could not provide on its own).

**4) AS3 — Amigos → Social → Home/Scan preserves state, no KYC-gate re-run (CDP, real `<a>`
clicks on the shell's own `<Link>` elements, not `location.href` reassignment):**

Same CDP connection, at the narrow width. Planted a second marker
(`window.__T015_NAV_MARKER__`), then clicked the shell's real rendered anchor elements in
sequence (`document.querySelectorAll('a[href="/amigos"]')[0].click()`, then `/social`, then
`/`) — this exercises the exact DOM element a real mouse click would activate
(`react-native-web` renders `expo-router`'s `<Link>` as a genuine `<a href>`), not a
programmatic router call:

```
1) HOME (initial):        url=/,       testids include home-screen/scan-entry-card/..., navCount=1
2) -> AMIGOS:              url=/amigos, testids=[web-bottom-bar-nav...], marker survives, navCount=1
3) -> SOCIAL:              url=/social, testids=[web-bottom-bar-nav...], marker survives, navCount=1
4) -> HOME again:          url=/,       testids include home-screen/home-screen-top-left/
                           amigos-quick-access-pill/home-screen-top-right/top-right-controls/
                           home-screen-centre/scan-entry-card again, marker survives, navCount=1
```

`performance.getEntriesByType("navigation").length` stayed at exactly `1` across all four
snapshots — the browser's own record of how many times the page was actually (re)loaded,
direct proof this was single-page client-side routing the entire time, never a reload. The
marker global survived every hop for the same reason. Home/Scan's test-ID set on return in
step 4 is identical to step 1's — the screen renders "exactly as it did before navigating
away." No `kyc-gate-loading` test ID appeared at any point (consistent with the gate never
re-mounting, since the root layout never reloaded). Script:
`/private/tmp/.../scratchpad/cdp-navigate-check.mjs` (scratchpad only). **AS3 confirmed by
genuine real-browser evidence**, using the shell's actual rendered links, not a mocked router.

### Native (iOS) verification — real Simulator, real Expo Go, genuine findings including one open anomaly

Booted iPhone 17 Pro (iOS 26.5), opened the running dev server experience via
`xcrun simctl openurl <device> "exp://127.0.0.1:8210"` (Expo Go was already on the simulator;
no install step needed), and took real device screenshots
(`xcrun simctl io <device> screenshot`) — genuine on-device rendering by the actual React
Native (not `react-native-web`) runtime, not a web view standing in for it.

**Confirmed (FR-002, SC-001 native, safe-area insets)**: the cold-loaded Home/Scan screen
rendered with the **native bottom tab bar** (`expo-router`'s `<Tabs>`, T009) showing all three
destinations — Amigos (person icon), Home (house icon, highlighted blue as the active tab),
Social (chat icon) — plus the full Home/Scan composition above it: the top-left "Amigos" pill,
the top-right four-control stack (`ENG/ESP`, `USD/MXN`, `Notifications`, `Messages`), and the
centre "+" card, all positioned correctly with no clipping and no overlap with the status bar
or the tab bar (i.e. safe-area insets are genuinely respected — this is a real device render,
not a claim). Screenshot evidence: `/private/tmp/.../scratchpad/sim-1.png`. This is the core
native confirmation T015 asks for and it is genuinely observed, not inferred.

**Anomaly found, flagged honestly rather than glossed over (not blocking this task, see
reasoning below)**: attempting to reach the Amigos/Social screens on native, I did not have
working UI-automation to *tap* the tab bar icons — `osascript`'s `System Events` (the only
local mechanism available for simulated taps) was refused Accessibility permission in this
sandbox (`-1719`), a genuine, checked tooling limit, not a skipped step. As a substitute, I
used Expo Go's own deep-link mechanism (`xcrun simctl openurl <device>
"exp://127.0.0.1:8210/--/amigos"`, the `--/` convention Expo Go's linking uses for a specific
in-experience path). This **did** render the correct, distinct Amigos placeholder content
(`<h1>Amigos</h1>` + its exact FR-007 disclaimer copy, confirmed via screenshot
`sim-amigos3.png`/`sim-amigos4.png`) — but the screenshot shows **no native tab bar visible at
all** on that screen, plus a transient "Possible unhandled promise rejection" toast. I do
**not** know whether this reflects a real defect in this feature's own native routing
(`app/(app)/_layout.tsx`'s `<Tabs>`) or is an artifact specific to Expo Go's cold `--/`
deep-link mechanism reconstructing nested-navigator state from a URL (a known rough edge in
React Navigation when a `<Tabs>` navigator is nested inside a `<Stack>` and the *entry point*
is a URL two levels deep, as opposed to a live tap while the app is already running with a
warm navigator tree) — **I did not reproduce this via an actual tap, because I could not
perform one in this sandbox**, so I am not reporting it as a confirmed regression, only as an
honest, unresolved observation for follow-up (e.g. T019's later manual keyboard/screen-reader
pass, or a human with a real, unsandboxed simulator session, should specifically check: does
*tapping* the Amigos tab icon from a warm Home screen keep the tab bar visible on the Amigos
screen, the way the CDP-driven web check above already confirmed happens correctly on web).
Also worth noting for calibration: an unrelated first deep-link attempt using the "not yet
available" side effect described below suggests Expo Go's deep-link handling in this
environment is not fully representative of normal in-app navigation, which is exactly why I am
not treating the missing-tab-bar observation as equivalent in strength to the web CDP evidence
above.

**Second, smaller anomaly, same root cause suspected, also flagged rather than silently
dropped**: after the *first* successful `--/amigos` deep-link round-trip (before the one that
produced the clean Amigos screenshot above), a screenshot of the Home screen showed all four
top-right controls' "Not yet available" feedback text visible simultaneously
(`sim-amigos.png`) — which per `TopRightControls.tsx`'s actual source (read directly:
`useState(false)` per control, text only rendered when `feedbackVisible` is `true`, only
flipped by that control's own `onPress`) should require four independent real presses to
reach, none of which I performed. I could not find a mechanism in this sandbox to determine
conclusively whether this was a hot-reload/Fast-Refresh state artifact triggered by the
deep-link round-trip, or something else — flagging it explicitly as **observed, not
understood, not reproduced via a real tap**, rather than either silently omitting it or
mischaracterizing it as a confirmed bug. It does not affect the core Home-screen-renders-
correctly finding above (which was captured *before* this anomaly appeared, in a clean cold
state) and does not block SC-001's core native claim.

**Android**: not performed — no emulator/SDK available in this environment (checked directly,
see Environment inventory above), stated explicitly per this task's own instruction rather than
silently skipped.

### Cleanup performed before ending this run

- Killed the web dev server (port 8210) and the CDP-headless Chrome instance (port 9333) —
  confirmed via `lsof -i :8210` / `lsof -i :9333`, both empty afterward.
- Shut down the iOS Simulator (`xcrun simctl shutdown <device>`).
- Reverted `app/_layout.tsx` via `git checkout -- app/_layout.tsx`; `git diff --stat
  app/_layout.tsx` empty, confirmed.
- Re-ran `npx tsc --noEmit` (clean) and `npx jest --silent` (35 suites / 224 tests passing,
  identical to this run's own starting baseline) on the fully-reverted tree.
- Final `git status --porcelain` matches this run's starting state exactly, plus only this
  run's own two changes (`specs/004-home-scan-shell/tasks.md`'s T015 checkbox and this report)
  — no stray file, no leftover edit, confirmed by direct comparison, not assumed.
- All temporary Node/CDP scripts (`cdp-resize-check.mjs`, `cdp-navigate-check.mjs`) and
  screenshots live only under the scratchpad directory
  (`/private/tmp/claude-501/.../scratchpad/`), never written into this repo.

### Requirement / acceptance-scenario traceability (this run)

| Spec item | Evidence this run |
|---|---|
| SC-001 (cold `"main"` → real Home/Scan screen, shell visible, no scaffold/unmatched-route flash) | Web: headless-Chrome DOM dump at `/` shows real screen test IDs, zero "unmatched" occurrences. Native: real Simulator screenshot (`sim-1.png`) shows the same composition with the native tab bar. |
| US1 AS4 (375px web → bottom-bar treatment) | Headless-Chrome DOM dump at `--window-size=375,800` → `web-bottom-bar-nav` present |
| US1 AS5 (≥768px web → sidebar treatment) | Headless-Chrome DOM dump at `--window-size=1000,900` → `web-sidebar-nav` present |
| US1 AS6 (resize across 768px live-switches, no reload, active destination kept) | CDP `Browser.setWindowBounds` resize both directions on `/amigos`: testids switch correctly each way, `url` stays `/amigos`, a JS global marker survives both resizes |
| US1 AS3 (Amigos → Social → Home/Scan preserves state, no gate re-run) | CDP real `<a>` clicks Home→Amigos→Social→Home: `performance` reports exactly 1 navigation entry throughout, a JS global marker survives every hop, Home's test-ID set is identical before and after |
| FR-002 (native bottom tab bar on iOS) | Real iPhone 17 Pro Simulator screenshot, Expo Go, `sim-1.png` |
| Platform note (safe-area insets respected) | Same screenshot — no clipping under the status bar or over the tab bar |

### Tasks now `[X]`

- T015

### Deviations / open items for sign-off

- **Genuinely confirmed, no reservations**: SC-001 (both web and native), AS3, AS4, AS5, AS6 —
  all backed by real-browser or real-device evidence gathered this run, not solely by the
  existing RNTL/Jest suite (though that suite remains green and consistent throughout).
- **Not confirmed, honestly flagged, not blocking**: whether *tapping* (as opposed to a cold
  Expo-Go deep link) the native Amigos/Social tabs preserves the tab bar and shell chrome —
  this sandbox had no working UI-automation permission to perform a real tap, and the
  deep-link-based substitute produced an anomaly (missing tab bar on the Amigos screen reached
  via `--/amigos`) that I could not attribute conclusively to either a real app bug or an
  artifact of the deep-link mechanism itself. Recommending this be re-checked by a human (or an
  agent with Accessibility/UI-automation permission) with a real tap on a warm Home screen
  before this is treated as settled either way — it does not block T015 as scoped (the task's
  core ask, SC-001 + the web AS3–AS6 set, is genuinely met), but it is new information a
  reviewer should weigh before treating Phase 3/the MVP as fully bulletproof on native.
- **Android**: not performed, no emulator available in this environment — stated explicitly,
  not silently skipped, per this task's own instruction.
- No change was made to any T001–T014 file, `metro.config.js`, or `docs/conventions.md` in this
  run — this run is scoped entirely to the manual check itself and its own report/checkbox.

**Phase 3 (User Story 1, MVP) is now complete**: T009–T015 are all `[X]`. The MVP claim (an
onboarded user's cold boot renders a real, shell-wrapped Home/Scan screen, on web at both
breakpoints with live-switching and destination-preserving navigation) is genuinely verified by
real-browser evidence, not merely by the existing test suite. The one open item above (native
tap-based tab navigation, unverified due to a sandbox tooling gap) is recommended follow-up, not
a reason to withhold this task's own `[X]`.

---

## Run 9 — Phase 4 (User Story 2, P1): T016, T017

### Scope

Exactly T016 and T017 from `specs/004-home-scan-shell/tasks.md`, per the task-implementer's
brief. T016: create `app/scan.tsx` (renders `ScanPlaceholderScreen`, T004) and wire
`HomeScreen`'s `ScanEntryCard` instance to navigate to `SCAN_ROUTE` on press. T017: confirm
`ScanEntryCard`'s accessibility label via a genuine screen-reader-style (role + name) query.
Both close out Phase 4 (User Story 2, both P1 tasks).

### Files changed

- `src/features/navigation/HomeScreen.tsx` — replaced the module-level no-op
  `handleScanEntryPress` placeholder with a real handler inside the component: calls
  `useRouter()` (expo-router) and, on press, `router.push(SCAN_ROUTE)` —
  `SCAN_ROUTE` imported from `@/domain/navigation` (T001's shared table), never a hardcoded
  `"/scan"` string literal, so this can't drift from `app/scan.tsx`'s own route. Mirrors
  `AmigosQuickAccessPill.tsx`'s already-established "read the route from the shared table,
  call `useRouter().push`" pattern (T008) — no new pattern invented.
- `src/features/navigation/HomeScreen.test.tsx` — updated the `expo-router` mock to a single
  shared, resettable `mockPush` (replacing the old inline `jest.fn()`, since both
  `AmigosQuickAccessPill` and now `HomeScreen` itself call `useRouter().push`), added
  `beforeEach(() => jest.clearAllMocks())`, and added one new test: pressing the scan card
  (located via `getByRole("button", { name: "Scan a card" })` — the same screen-reader-oriented
  query style T017 requires, not a testID/icon lookup) calls `mockPush` exactly once with
  exactly `SCAN_ROUTE`.
- `app/scan.tsx` (new) — the scanner's route boundary. Renders `ScanPlaceholderScreen`
  (`@/features/scanner/ScanPlaceholderScreen`, T004, untouched — no change to that
  already-approved file). Adds one small addition beyond the task's literal "renders
  ScanPlaceholderScreen" text, explained below: a "Back to Home" `Pressable`
  (`accessibilityRole="button"`, `accessibilityLabel="Back to Home"`, ≥44×44 tap target) that
  calls `useRouter().back()`.
- `app/scan.test.tsx` (new) — an ordinary colocated screen test (not a `_layout.*` file, so per
  `docs/conventions.md`'s narrow exception this stays colocated under `app/`, matching every
  other screen test in this repo). 2 tests:
  - Renders the real stub content (`getByRole("header")` present, text matches
    `/scanner coming soon/i`) — confirms US2 AS1 ("not camera UI, not a capture flow").
  - Pressing `getByRole("button", { name: "Back to Home" })` calls a mocked `router.back()`
    exactly once — the Stack-pop trigger for US2 AS2, located by accessible role + name.
- `specs/004-home-scan-shell/tasks.md` — marked T016 and T017 `[X]`.

No other files changed in the final diff. `src/features/scanner/ScanEntryCard.tsx`,
`src/features/scanner/ScanPlaceholderScreen.tsx`, `src/domain/navigation.ts`, and
`src/domain/kyc-gate.ts`/`src/features/identity/useKycGate.ts` (FR-009) were **not** modified —
see the "Manual verification" section below for a temporary, fully-reverted edit made to
`app/_layout.tsx` during this run's manual check only.

### Design decision worth flagging explicitly: the "Back to Home" button in `app/scan.tsx`

T016's task text says only "Create `app/scan.tsx` (renders `ScanPlaceholderScreen`, T004)" — it
does not mention adding a button. I added one anyway, for a reason grounded directly in spec.md
US2 AS2 ("When they navigate back, Then they return to the Home/Scan screen with the navigation
shell intact") and in the task's own explicit instruction to add "a test for `app/scan.tsx`
asserting back-navigation returns to an intact shell."

Reasoning: `/scan` sits **outside** the `(app)` shell route group (`plan.md`'s Project
Structure: `app/scan.tsx` is a standalone route boundary, not a tab inside `(app)/`), so it has
no persistent tab bar/sidebar of its own and no header (`app/_layout.tsx`'s root `<Stack>` sets
`headerShown: false` for every screen, including this one, and this task was not asked to
override that). Without some explicit, discoverable affordance, "navigate back" would only be
reachable via an undiscoverable native swipe gesture (iOS), the Android hardware back button, or
a browser back button (web) — none of which is testable at the Jest/RNTL level, and the last of
which isn't guaranteed to be visible/usable in every embedding (e.g. a future native WebView
wrapper). A small, explicitly-labelled `Pressable` calling `router.back()` gives US2 AS2 a
genuine, accessible (role="button", real label, ≥44×44 target), unit-testable trigger, without
touching `ScanPlaceholderScreen.tsx` itself (T004, already approved, out of this task's scope —
the button lives in the *route* file, `app/scan.tsx`, as UI-only navigation wiring, not business
logic, mirroring the same "component calls `useRouter()` directly" pattern already established
by `AmigosQuickAccessPill.tsx`, T008). This is a deliberate design choice, not a silent scope
expansion — flagging it here explicitly in case a reviewer prefers relying solely on native/
browser back gestures instead (in which case this button can be removed as a one-line follow-up
without touching anything else in this batch).

### The honesty boundary on what `app/scan.test.tsx` can and cannot prove

Per this feature's established pattern (see the T014/T012-AS6 entries above), I want to be
explicit about what the Jest-level "back-navigation returns to an intact shell" test does and
does not demonstrate. `app/scan.test.tsx` renders `app/scan.tsx`'s default export **in
isolation** (this repo's existing convention for every route test — no `expo-router/testing-
library` router harness is installed) and asserts pressing "Back to Home" calls a mocked
`router.back()` exactly once. That proves "this file wires its back affordance to the router's
back function" — it cannot, by itself, prove that popping the real Stack actually leaves an
intact Home/Scan screen underneath, since there is no second screen mounted in this test's tree
to observe. That second half of US2 AS2 is what the real-browser manual check below
demonstrates instead, with genuine evidence (not an assumption): pressing the actual "+" card
and then the actual "Back to Home" button in a real running Chrome tab, and confirming the DOM
both before and after shows the exact same Home/Scan test IDs, with no page reload in between.

### Constitution / conventions compliance

- Principle IV: `HomeScreen.tsx`'s new handler is a plain navigation call
  (`router.push(SCAN_ROUTE)`) reading from the already-portable shared table — no fetch,
  validation, or data transform embedded in the component body. `app/scan.tsx`'s back handler
  is the same category of plain UI navigation call (`router.back()`), not business logic.
- FR-005 (camera/capture/recognition explicitly out of scope): unaffected — `app/scan.tsx`
  imports only `expo-router`, `react-native` core, and the already-approved
  `ScanPlaceholderScreen` (T004, whose own import-line guard test already forbids any
  camera-related import); `app/scan.tsx` itself imports no camera module either.
- FR-009: verified by inspection — `git diff` against `src/domain/kyc-gate.ts` and
  `src/features/identity/useKycGate.ts` is empty for this run; the one transient edit to
  `app/_layout.tsx` (manual-check only) was fully reverted before this run ended (see below).
- No new dependency added — `expo-router`'s `useRouter` (`.push`/`.back`) was already installed
  and already used elsewhere in this exact feature (`AmigosQuickAccessPill.tsx`).
- No `any`; strict mode respected (see type-check below). Function components only. Comments
  capture only non-obvious "why" (the `SCAN_ROUTE`-from-shared-table rationale, the "Back to
  Home" design decision and its scope boundary, the honesty note on what the route test can and
  cannot prove), per `docs/conventions.md`.

### Tests run

```
npx tsc --noEmit
```
→ clean, no output (no type errors).

```
npx jest src/features/navigation/HomeScreen.test.tsx app/scan.test.tsx
```
```
PASS app/scan.test.tsx
PASS src/features/navigation/HomeScreen.test.tsx

Test Suites: 2 passed, 2 total
Tests:       7 passed, 7 total
```

Full suite (regression check, not just the new/changed files):

```
npx jest --silent
```
```
Test Suites: 36 passed, 36 total
Tests:       227 passed, 227 total
```
(227 = 224 from the T014/dev-server-crash-fix/T015 baseline + 2 new `app/scan.test.tsx` tests +
1 new `HomeScreen.test.tsx` navigation test.)

`./init.sh --skip-build` (fast path, as instructed — not the full three-platform build):
```
RESULT: SUCCESS (8/8 stages passed)
```
Type-check and the full test suite both `OK`; the two pre-existing `WARN`s (`expo-doctor`
outdated-dependency advisories, native-dependency-version drift for
`expo-image-picker`/`react-native`/`react-native-safe-area-context`/`@types/react`/`typescript`)
are unchanged from every prior run in this feature — not introduced by this batch.

### Manual verification (`docs/verification.md` Level 3) — real browser, real running dev server

**What was available this run**: a real machine-local Chrome
(`/Applications/Google Chrome.app`, `150.0.7871.189`), driven headless via the Chrome DevTools
Protocol over a raw WebSocket (Node 20's `--experimental-websocket` global — zero new
`package.json` dependency, matching the approach the T015 entry above established), against a
genuinely running `npx expo start --web` dev server on a fresh port. No live backend/Supabase
session is configured in this environment (unchanged from every prior run), so reaching the
"onboarded user" (`"main"`) state again required the same category of temporary,
fully-reverted edit to `app/_layout.tsx`'s `KycGate()` used in every prior manual-check entry in
this file.

**1) Dev server boots cleanly, no layout-conflict regression** — started
`npx expo start --web --port 8300`. Log showed `Web Bundled ... expo-router/entry.js` with no
"conflict" error (the dev-server-crash-fix from the earlier entry still holds; re-confirmed this
run, not re-trusted from a prior one). `curl` route check:
```
/       -> 200
/scan   -> 200   (app/scan.tsx now exists — this is the change from T014/T015's baseline "404")
/amigos -> 200
```

**2) Headless-Chrome DOM dump at `/scan` (real browser, real JS execution, real post-render
DOM)** — confirms the actual stub renders, with the real accessible labels:
```
data-testid="scan-route-screen"
data-testid="scan-back-button"
aria-label="Back to Home"
"Scanner coming soon"  (visible text, matched case-insensitively)
```
No camera UI, no capture flow, no "unmatched" text anywhere in the dump — **US2 AS1 confirmed
for web, via genuine browser evidence.**

**3) Full round-trip navigation (CDP, real accessible-role+name element clicks — not
`location.href` reassignment, not a mocked router)** — reached `"main"` via the temporary
`KycGate()` patch (a plain early `return <Stack screenOptions={{ headerShown: false }} />;`
followed by the original body commented out, not left as unreachable live code — the exact
refinement the T015 entry above records was needed to keep `tsc --noEmit` clean, since leaving
the original `const { route, isLoading } = useKycGate();` as dead-but-live code after an
unconditional early return re-triggered the same `TS2538` narrowing-loss error that entry
documented). Planted a `window.__T016_MARKER__` global, then:

```
1) HOME (initial):            path=/,     navCount=1
   testids: [...web-sidebar-nav..., home-screen, home-screen-top-left,
             amigos-quick-access-pill, home-screen-top-right, top-right-controls,
             home-screen-centre, scan-entry-card]
-> clicked the element whose aria-label === "Scan a card" (role+name lookup, same query
   style as T017's own tests, not a testID/icon lookup)
2) AFTER PRESSING "Scan a card":  path=/scan, navCount=1, marker still "alive"
   testids: [...all of the Home screen's own testids, still present and unchanged, PLUS...
             scan-route-screen, scan-back-button]
-> clicked the element whose aria-label === "Back to Home"
3) AFTER PRESSING "Back to Home": path=/,    navCount=1, marker still "alive"
   testids: [...web-sidebar-nav..., home-screen, home-screen-top-left,
             amigos-quick-access-pill, home-screen-top-right, top-right-controls,
             home-screen-centre, scan-entry-card]   (identical to snapshot 1)
```

`performance.getEntriesByType("navigation").length` stayed at exactly `1` throughout all three
snapshots — direct browser-level proof this was client-side routing the whole time, never a
page reload. The `__T016_MARKER__` global survived both navigations for the same reason. Most
importantly for the honesty-boundary note above: at snapshot 2, **all of the Home screen's own
test IDs were still present in the DOM alongside the new `/scan` ones** — i.e. `app/_layout.tsx`'s
root `<Stack>` pushes `/scan` on top of the still-mounted Home/Scan screen rather than replacing
it, which is exactly the mechanism that makes "the shell stays intact" true by construction, not
merely by coincidence — and at snapshot 3, the DOM is byte-for-byte the same test-ID set as
snapshot 1. **US2 AS2 confirmed by genuine real-browser evidence**, closing the gap the unit
test's own honesty note above flagged as unprovable at the Jest level. Script:
`/private/tmp/.../scratchpad/cdp-scan-check.mjs` (scratchpad only, not part of this repo's diff).

**4) Cleanup performed before ending this run**:
- Killed the web dev server (port 8300) and the CDP headless-Chrome instance (port 9444) —
  confirmed via `lsof -i :8300` / `lsof -i :9444`, both empty afterward (aside from one unrelated
  pre-existing Chrome `CLOSE_WAIT` socket from an unrelated extension background page, not this
  run's dev server or CDP instance).
- Reverted `app/_layout.tsx` via `git checkout -- app/_layout.tsx`; `git diff --stat
  app/_layout.tsx` produced no output, confirmed both immediately after reverting and again at
  the very end of this run.
- Re-ran `npx tsc --noEmit` (clean) and `npx jest --silent` (36 suites / 227 tests) on the
  fully-reverted tree — identical to this run's own pre-manual-check baseline.
- Final `git status --porcelain` shows exactly the same pre-existing untracked/modified set as
  every prior entry in this file, plus only this run's own new files (`app/scan.tsx`,
  `app/scan.test.tsx`) and this run's edits (`HomeScreen.tsx`, `HomeScreen.test.tsx`,
  `specs/004-home-scan-shell/tasks.md`, this report) — no stray edit to any T001–T015 file.

**Native (iOS/Android)**: not performed this run. spec.md's Platform notes for User Story 2
state explicitly: "identical across iOS, Android, and web — no platform-specific behavior for
this story; the affordance is a plain pressable element, not a native camera trigger." T016/T017
introduce no platform-specific file (`.ios.tsx`/`.android.tsx`) and no native-only API — the web
verification above exercises the same `expo-router` `useRouter().push`/`.back()` calls that run
identically on every platform, consistent with this story's own stated platform-parity claim.
Full native-simulator re-confirmation (mirroring T015's iOS pass) was judged out of this batch's
scope, since the task brief's own verification instruction was "run the app... confirm pressing
the '+' card... navigates to /scan... and back" without specifying a native-simulator pass, and
no platform-specific code path exists here to diverge from the web result.

### Requirement traceability

| FR / SC | Test(s) |
|---|---|
| FR-005 (pressing the "+" card navigates to `/scan`, stub only, no camera/capture/recognition) | `HomeScreen` "navigates to exactly SCAN_ROUTE when the scan card is pressed"; `app/scan.tsx` "renders the scanner stub screen, not camera UI"; real-browser confirmation (CDP round-trip, headless-Chrome DOM dump) above |
| spec.md US2 AS1 ("+" card → `/scan` stub, not camera UI) | Same as FR-005 above |
| spec.md US2 AS2 (back navigation → intact Home/Scan screen + shell) | `app/scan.tsx` "calls router.back() when the back affordance is pressed" (unit-level: the trigger); real-browser CDP round-trip above (browser-level: the actual intact-shell result, including the "Home screen's test IDs never left the DOM" finding) |
| SC-002 / SC-004 (T017 — real, descriptive accessibility label; ≥44×44 tap target; located via accessible role+name, not icon/testID) | `ScanEntryCard.test.tsx` (T003, pre-existing) "exposes the accessibility label \"Scan a card\"" via `getByRole("button", { name: ... })`; `HomeScreen.test.tsx`'s new navigation test and `app/(app)/index.test.tsx` (T014, pre-existing) both locate the same button the same way; `app/scan.test.tsx`'s back-button test locates its own affordance the same way — no test in this feature queries this element by testID or icon |

### Note on T017 specifically

T017's task text frames itself as a "confirmation pass," anticipating it might find nothing to
fix. That is what happened here: `ScanEntryCard`'s `accessibilityLabel="Scan a card"` (set in
T003, already reviewed and approved) already reads as a clear, descriptive action when queried
by `getByRole("button", { name: "Scan a card" })` — not a bare "+" or "button" — and this was
already being asserted that way in three pre-existing test files
(`ScanEntryCard.test.tsx`, `HomeScreen.test.tsx`, `app/(app)/index.test.tsx`) before this run.
This run adds two more instances of the same role+name query style, now exercising the label in
two new contexts it hadn't been checked in before: the real navigation call it now triggers
(`HomeScreen.test.tsx`'s new test) and the real browser DOM after a real click (the CDP check
above, which located the element via its `aria-label` attribute — the DOM-level projection of
`accessibilityLabel` under `react-native-web` — exactly how a screen reader would locate it, not
via `data-testid`). No change to `ScanEntryCard.tsx` itself was needed.

### Tasks now `[X]`

- T016
- T017

**Phase 4 (User Story 2, both P1 tasks) is now complete.** Both P1 user stories (US1's shell +
landing screen, US2's "+" card → `/scan` route boundary) are done — the shell's single described
interaction now genuinely works end to end, confirmed by real-browser evidence in addition to
the full green unit/component-test suite.

### Deviations from plan

One deliberate, explicitly-flagged addition beyond T016's literal task text: the "Back to Home"
`Pressable` added to `app/scan.tsx` (see the dedicated section above for the full reasoning and
scope boundary). No other deviation — `HomeScreen.tsx`'s navigation wiring matches T016's
description exactly (`useRouter().push(SCAN_ROUTE)`, `SCAN_ROUTE` from the shared table, no
hardcoded route literal), and T017 found nothing in `ScanEntryCard.tsx` needing a fix, exactly
as that task's own text anticipated as a possible, valid outcome.

---

## Run 10 — Phase 5 (User Story 3, P2): T018, and Phase 6 (User Story 4, P3): T019

### Scope

Exactly T018 and T019 from `specs/004-home-scan-shell/tasks.md`, per the task-implementer's
brief. Both were scoped as independent (different files/concerns) and treated that way; no
conflict was found between them during this run.

### T018 — Amigos pill vs. Amigos tab convergence (FR-008)

**Files changed**:

- `src/features/navigation/HomeScreen.integration.test.tsx` (new) — the integration-style test
  the task asked for. Four tests, all grounded in `NAV_DESTINATIONS`
  (`src/domain/navigation.ts`, T001) rather than hardcoded route strings, so a future rename on
  either side of the convergence would fail here:
  1. Sanity check that `NAV_DESTINATIONS` has an `"amigos"` entry for both entry points to
     converge on.
  2. Renders the real `HomeScreen` (T013) and presses the Amigos pill (via `getByRole("button",
     { name: "Amigos" })`, the same accessible-role+name query style already established in
     `AmigosQuickAccessPill.test.tsx`/`HomeScreen.test.tsx`), asserting the mocked
     `useRouter().push` was called with exactly `NAV_DESTINATIONS.find(d => d.key ===
     "amigos").route`.
  3. Renders the real native tab layout, `app/(app)/_layout.tsx` (T009), with `expo-router`'s
     `Tabs`/`Tabs.Screen` mocked to record each `<Tabs.Screen name=... />` prop actually passed
     at render time (not re-derived from reading the source — a genuine render-time capture), and
     asserts the recorded screen names include the Amigos route segment derived from
     `NAV_DESTINATIONS` (`"/amigos"` → `"amigos"`). This ties the *native tab's actual
     configuration* back to the same table the pill's test (above) already checked its push
     target against — the drift-detection the task asked for.
  4. Renders `app/(app)/amigos.tsx`'s default export (`AmigosRouteScreen`, T014) and, separately,
     `AmigosPlaceholderScreen` (T005) directly, and asserts their rendered `header`'s children are
     identical — proving the route file is a pure pass-through to the exact same screen content,
     not a second, diverging placeholder.

**Why this is a genuine convergence check, not a restatement of existing tests**: prior tests
(`AmigosQuickAccessPill.test.tsx`, `app/(app)/amigos.test.tsx`) each verified one side of the
story in isolation (the pill's push target; the route file's rendered content) but never in the
same test file cross-referencing the *same* `NAV_DESTINATIONS` entry against both the pill's
call and the native tab's actual `Tabs.Screen` render-time prop. This is the first test that
would fail if, say, someone renamed the Amigos tab's screen name to `"friends"` in
`_layout.tsx` without renaming `app/(app)/amigos.tsx` or updating `NAV_DESTINATIONS` — exactly
the silent-drift scenario the task's brief called out.

**On "the shell shows Amigos as active either way" (spec.md US3 AS3)**: this half of AS3 is not
independently asserted by a new test, and that is a deliberate, documented scope decision, not
an oversight — recorded as a comment at the top of the new test file. Neither
`AmigosQuickAccessPill.tsx` nor `app/(app)/_layout.tsx`/`_layout.web.tsx` implements any
hand-rolled "is this the active destination" logic anywhere in this codebase (confirmed by
reading all four files again this run) — "active" highlighting for the native `<Tabs>` is
entirely `@react-navigation/bottom-tabs`' own built-in current-route styling, and the web
sidebar/bottom-bar (`WebSidebarNav.tsx`/`WebBottomBarNav.tsx`, T010/T011, already
approved/merged on this branch) render plain `expo-router` `<Link>`s with no active-state
styling of their own at all (confirmed by re-reading both files — no `usePathname()`, no
active/current styling anywhere in either). Since both entry points (pill, tab) drive the exact
same underlying router with the exact same route string (proven by assertions 2+3 above), and
there is no separate, divergent "active" code path in this repo for either entry point to hit,
"shown as active either way" follows by construction from the route-convergence proof, not from
an independent, separately-testable mechanism. (A gap in *whether the web sidebar highlights the
active link at all* is a pre-existing question from T010/T011, already approved on this branch
before this run started — out of scope for T018 to relitigate, and not something either pill or
tab does differently from the other, so it cannot cause a *divergence* between the two entry
points either way.)

**Tests run** (this file only, then full suite):

```
PASS src/features/navigation/HomeScreen.integration.test.tsx
  Amigos pill vs. Amigos tab convergence (FR-008)
    ✓ has an Amigos entry in NAV_DESTINATIONS for both entry points to converge on
    ✓ navigates the pill to exactly NAV_DESTINATIONS' Amigos route
    ✓ configures the native Amigos tab's screen name from the same NAV_DESTINATIONS route the pill uses
    ✓ renders the identical Amigos placeholder content whether reached via the route file or the component directly
```

### T019 — manual keyboard-only pass across the four TopRightControls

**No production-code change was needed** — this run's real-browser evidence found the four
controls already correctly keyboard-accessible and already giving correct visible feedback.
One thing *was* found and fixed, but it was a bug in this run's own verification tooling, not in
`TopRightControls.tsx` — documented below in full, per this task's "genuinely completed the
manual pass" bar, not a shortcut past it.

**Environment available this run**: real machine-local Chrome
(`/Applications/Google Chrome.app`, `150.0.7871.189`), driven headless over the raw CDP
WebSocket (Node 20's `--experimental-websocket` global, zero new `package.json` dependency —
same approach as every prior manual-check entry in this file), against a genuinely running
`npx expo start --web --port 8420` dev server. No live backend/Supabase session is configured in
this environment, so reaching the `"main"` (onboarded) state required the same temporary,
fully-reverted `app/_layout.tsx` `KycGate()` bypass used in every prior manual-check entry
(T015/T016/T017) — applied, used, then reverted via `git checkout -- app/_layout.tsx` before
this run ended; `git diff --stat app/_layout.tsx` confirmed empty both immediately after
reverting and again at the very end of this run.

**1) Dev server boots cleanly** — `npx expo start --web --port 8420` bundled with no
layout-conflict error (the dev-server-crash-fix documented earlier in this file still holds).
`curl localhost:8420/` → `200`.

**2) Real headless-Chrome DOM: accessibility-tree pass (spec.md US4 AS1/AS3)** — navigated to
`/`, confirmed `[data-testid="home-screen"]` present (genuinely landed on the real Home/Scan
screen, not a loading/error state), then read every `[aria-label]` inside
`[data-testid="top-right-controls"]` directly from the live DOM:

```
1) top-right-controls aria-labels (order):
["Language, English or Spanish — not yet available",
 "Currency, US Dollar or Mexican Peso — not yet available",
 "Notifications — not yet available",
 "Messages — not yet available"]
```

Four controls, top-to-bottom, each with a distinct, non-empty, non-icon-only label — matches
FR-006/US4 AS1/AS3 exactly, confirmed from real rendered `aria-label` attributes (the DOM-level
projection of React Native's `accessibilityLabel` under `react-native-web`, i.e. what a real
screen reader reads), not from re-reading the component source.

**3) Real keyboard-only Tab-order reachability (SC-002)** — starting from `document.body`,
dispatched real `Tab` keydown/keyup pairs via CDP's `Input.dispatchKeyEvent` and recorded
`document.activeElement`'s `aria-label` after each press:

```
2) Tab-order labels visited (in order):
["Amigos", "Home", "Social", "Amigos",
 "Language, English or Spanish — not yet available",
 "Currency, US Dollar or Mexican Peso — not yet available",
 "Notifications — not yet available",
 "Messages — not yet available"]
```

(The wide/sidebar web treatment was active at the default 1280px window size used this run, so
the sidebar's three `NAV_DESTINATIONS` links — already covered by T010's own tests — appear
first in the tab order, then `HomeScreen`'s own top-left Amigos pill, then all four top-right
controls in the exact stated order, with no gap or skip.) **Every one of the four controls is
individually, sequentially Tab-reachable with no pointer/touch interaction at any point** —
confirmed by genuine keyboard-event dispatch, not by reading `tabIndex` values in source.

**4) Real computed-style focus indicator (Constitution Principle VII)** — for each of the four
controls, once focused via the Tab sequence above, read `window.getComputedStyle(activeElement)`
directly:

```
- "Language...":     outlineStyle: "auto", outlineWidth: "1px", outlineColor: "rgb(0, 95, 204)"
- "Currency...":      outlineStyle: "auto", outlineWidth: "1px", outlineColor: "rgb(0, 95, 204)"
- "Notifications...": outlineStyle: "auto", outlineWidth: "1px", outlineColor: "rgb(0, 95, 204)"
- "Messages...":       outlineStyle: "auto", outlineWidth: "1px", outlineColor: "rgb(0, 95, 204)"
```

All four render as real HTML `<button>` elements (confirmed `tagName === "BUTTON"` for all four)
under `react-native-web`, with the browser's own default visible focus ring intact (no
`outlineWidth`/`outlineStyle` override anywhere in `TopRightControls.tsx`, confirmed by reading
the file again this run) — a genuine, visible focus indicator for every control, not merely an
absence-of-override inference.

**5) A real finding, investigated and resolved — in the verification script, not the app**: the
first pass of this run's CDP script dispatched `Enter` keydown/keyup with only `key`/`code`/
`windowsVirtualKeyCode` set, and got `before: false, after: false` for all four controls (i.e.
"no feedback appeared") — which would have been a real, serious accessibility bug (keyboard
activation silently not working) had it been taken at face value. Rather than report that as a
finding against `TopRightControls.tsx` without first ruling out a false negative from the
verification tooling itself, a control experiment was run against a **plain, hand-built
`<button>` with no React/React Native code at all** (a bare `document.createElement("button")`
with its own `click` listener) in the same headless-Chrome instance: pressing `Enter` via the
same minimal CDP dispatch produced `0` clicks, and pressing `Space` produced `1`. This isolated
the cause to the CDP dispatch itself — Chrome's default action (native `click` synthesis from a
focused `<button>`'s `Enter` keydown) requires `text`/`unmodifiedText`/`nativeVirtualKeyCode` to
also be set in the `Input.dispatchKeyEvent` call, not just `key`/`code`/`windowsVirtualKeyCode`;
omitting them lets the keydown/keyup events themselves fire (confirmed via a `keydown` listener
count) but silently skips the browser's own default action. Adding those three fields to the
plain-`<button>` control experiment fixed it (`Enter` → `1` click), so the same fields were added
to the actual T019 script before re-running against the real app.

**6) Re-run against the real `TopRightControls`, with the corrected key dispatch — genuine
result, no app bug**:

```
3) Activation results (Enter key) per control:
  "Language...":     { "before": false, "after": true }
  "Currency...":      { "before": false, "after": true }
  "Notifications...": { "before": false, "after": true }
  "Messages...":       { "before": false, "after": true }
```

Every control's "Not yet available" feedback text (`document.body.textContent`, checked
case-insensitively) went from absent to present after a real `Enter` keypress on the focused
control — confirmed again separately for `Space` on one control (`Currency...`:
`before: false, after: true`) since spec.md US4 AS2 names both keys explicitly. **US4 AS2/AS3
confirmed by genuine keyboard-only, real-browser evidence — no fix needed in
`TopRightControls.tsx`.**

**7) Real DOM tap-target size (SC-004)** — read `getBoundingClientRect()` directly on all four
controls in the live page (not the RNTL style-object assertion `TopRightControls.test.tsx`
already covers, but the actual rendered box after `react-native-web`'s CSS resolves):

```
"Language...":     74.45 × 44
"Currency...":       80.16 × 44
"Notifications...":  98.98 × 44
"Messages...":        81.55 × 44
```

All four at exactly the minimum 44px height (and comfortably ≥44px width) in the real rendered
DOM — confirms the `minWidth: 44, minHeight: 44` style in `TopRightControls.tsx` actually reaches
the browser, not merely that the RN style object claims it will.

**8) Visual evidence** — a real headless-Chrome screenshot at this run's default viewport
(`t019-home-focus-state.png`, scratchpad only) shows all four top-right controls in the correct
top-to-bottom order (ENG/ESP, USD/MXN, Notifications, Messages), the top-left Amigos pill, and
the centre scan card, matching the wireframe's described layout.

**Screen-reader pass (VoiceOver/TalkBack) — what was and wasn't verified**: this environment has
no iOS/Android simulator with VoiceOver/TalkBack driven this run (no simulator was booted for
this task, unlike T015's native pass), and no real screen-reader software is available to drive
programmatically in this sandboxed environment. What *was* verified, as the closest genuine
substitute available (matching the pattern this task's own brief explicitly allows for): the
real computed accessibility properties a screen reader consumes — each control's `aria-label`
(the `react-native-web` DOM projection of `accessibilityLabel`, read directly from the live DOM,
not from source) is distinct, non-empty, and descriptive (not a bare icon/"button"), for all
four controls, in the real running app. This is the same category of evidence
`TopRightControls.test.tsx` (RNTL, pre-existing, approved) already provides at the
component-test level (`getByRole("button", { name: ... })`), corroborated here at the real
browser/DOM level in addition. **What genuinely was not verified**: an actual VoiceOver (iOS) or
TalkBack (Android) session narrating these controls out loud on a real device/simulator — flagged
explicitly here as the honest gap, not silently assumed covered.

**9) Cleanup performed before ending this run**:
- Killed the web dev server (port 8420) and the headless-Chrome instance (CDP port 9445) —
  confirmed via `lsof -i :8420 -i :9445` returning empty afterward.
- Reverted `app/_layout.tsx` via `git checkout -- app/_layout.tsx`; `git diff --stat
  app/_layout.tsx` produced no output, confirmed both immediately after reverting and again at
  the very end of this run.
- Final `git status --porcelain` shows exactly the pre-existing untracked set from prior runs,
  plus only this run's own new file (`src/features/navigation/HomeScreen.integration.test.tsx`)
  and this run's edit (`specs/004-home-scan-shell/tasks.md`, this report) — no stray edit to any
  prior task's file, and no change at all to `TopRightControls.tsx`.

### Constitution / conventions compliance

- No business logic added to any component body — `HomeScreen.integration.test.tsx` is a test
  file (asserts behavior, contains no app logic); no production file was changed this run.
- No new runtime dependency — the CDP verification used only Node 20's built-in
  `--experimental-websocket` global and the machine-local Chrome binary already used by every
  prior manual-check entry in this file, exactly as those entries did.
- No backend/Postgres/Redis/S3 access — this feature makes zero backend calls (FR-010,
  unchanged).
- `resolveKycRoute()`/`useKycGate()`/`KYC_ROUTE_TARGETS` (FR-009) — untouched in the final diff;
  the manual-check-only bypass to `app/_layout.tsx` was fully reverted, confirmed via `git diff`
  before this run ended (see cleanup above).
- KYC/identity document handling — N/A, no such code touched this run.

### Tests run (full suite, after both tasks, on the fully-reverted tree)

```
Test Suites: 37 passed, 37 total
Tests:       231 passed, 231 total
Snapshots:   0 total
Time:        1.584 s
```

### Type-check

```
npx tsc --noEmit
```
Clean, no output.

### Requirement traceability

| FR / SC / AS | Test(s) / evidence |
|---|---|
| FR-008 (Amigos pill navigates to the same destination as the shell's Amigos tab, not a second one) | `HomeScreen.integration.test.tsx`: "navigates the pill to exactly NAV_DESTINATIONS' Amigos route"; "configures the native Amigos tab's screen name from the same NAV_DESTINATIONS route the pill uses"; "renders the identical Amigos placeholder content whether reached via the route file or the component directly" |
| spec.md US3 AS3 (pill press → same Amigos placeholder renders; shell shows Amigos active either way) | Same three tests above for the "same screen" half; "shown as active" half addressed by documented reasoning in the test file's header comment (no divergent active-state code path exists to test — see T018 write-up above) |
| FR-006 / SC-004 (four controls, real accessibility label, ≥44×44 tap target) | Pre-existing `TopRightControls.test.tsx` (RNTL); this run's real-browser DOM read of `aria-label`s and `getBoundingClientRect()` sizes (T019, section 2/7 above) |
| spec.md US4 AS1 (exactly four controls, top-to-bottom, stated order) | Pre-existing `TopRightControls.test.tsx`; this run's real-DOM `aria-label` order read (T019, section 2 above) |
| spec.md US4 AS2 (Enter/Space or screen-reader equivalent activation → visible feedback, never a silent no-op) | Pre-existing `TopRightControls.test.tsx` (`fireEvent.press`); this run's real keyboard-dispatched `Enter` and `Space` activation against the live browser DOM (T019, sections 5/6 above) |
| spec.md US4 AS3 (each announces a distinct, real label, not a bare icon) | Pre-existing `TopRightControls.test.tsx`; this run's real-DOM `aria-label` read (T019, section 2 above) |
| Constitution Principle VII (visible keyboard focus indicator on web) | This run's real `getComputedStyle` outline read on all four controls after genuine Tab-key dispatch (T019, sections 3/4 above) — no equivalent automated test exists for computed CSS focus state in this repo's Jest/RNTL setup, so this is Level 3 (manual) evidence, not a new Jest test |

### Tasks now `[X]`

- T018
- T019

### Deviations from plan / notes for sign-off

- **T018**: no deviation. The task's own text offered a choice ("e.g. in `app/(app)/index.tsx`'s
  screen test, or a new `HomeScreen.integration.test.tsx`") — the new dedicated file was chosen
  over extending `app/(app)/index.tsx`'s screen test, since the convergence check needed to
  import and render `app/(app)/_layout.tsx` (the native tab config) and `app/(app)/amigos.tsx`
  side by side with `HomeScreen`, which reads more clearly as its own focused test file than as
  an addition to `index.test.tsx`'s narrower "renders the Home/Scan screen" scope.
- **T019**: no deviation, and — per this task's explicit instruction not to mark it done without
  a genuine manual pass — the manual keyboard pass really was performed against a real running
  dev server and a real headless Chrome via CDP, not simulated or assumed. The one explicit,
  flagged gap: no VoiceOver (iOS) / TalkBack (Android) session on a real simulator/device was run
  this batch (see the dedicated "what was and wasn't verified" note above) — flagging this for
  sign-off in case the human wants a dedicated native screen-reader pass before considering US4
  fully closed, though nothing in this run's evidence suggests either platform would behave
  differently (identical `accessibilityLabel` props, identical `Pressable` component, no
  platform-specific file for any of the four controls).
- No change was made to any production file this run (`TopRightControls.tsx` included) — T019's
  "fix any finding directly" instruction did not apply because the only finding was in this run's
  own verification script, corrected before drawing any conclusion about the app itself, per the
  investigation documented above.

---

## Run 8 — Phase 7 (Polish & Cross-Cutting Concerns): T020, T021

**Scope**: Exactly T020 and T021 from `specs/004-home-scan-shell/tasks.md`, per the
task-implementer's brief. Both are `[P]`. Per the brief, this run looked specifically for
whole-screen tab-order/overlap issues that no prior single-component review would have caught,
using the established real-browser (headless Chrome via raw CDP) and real-simulator (iOS)
verification pattern from Runs 5–7, with the same temporary, fully-reverted `app/_layout.tsx`
`KycGate()` bypass. Two genuine, real findings were made and fixed (not merely confirmed
already-correct) — both documented in full below, including the investigation that led to each.

### Environment used

- Web: `npx expo start --web --port 8500`, headless Chrome
  (`/Applications/Google Chrome.app`, `150.0.7871.189`) driven over raw CDP WebSocket (Node 20's
  `--experimental-websocket` global — zero new dependency, same approach as every prior
  manual-check entry in this file).
- Native (iOS): `npx expo start --port 8600` (no `--web`, so `exp://` URLs resolve), driven
  against two **real, booted iOS Simulators** — iPhone 17 Pro (phone) and iPad Pro 13-inch (M5)
  (tablet) — via `xcrun simctl openurl`/`screenshot`. Expo Go was already installed on the
  iPhone simulator; it was **not** pre-installed on the iPad simulator, so this run installed the
  same already-present `Exponent-2.31.6.tar.app` bundle onto it via `xcrun simctl install`
  (no App Store/network round-trip needed — reused the existing binary).
- **Android: not available in this environment** — `emulator`/`adb` are both absent from `PATH`
  (`command not found`). No Android form-factor check was performed; disclosed explicitly here
  rather than assumed covered, per the task's own instruction. Nothing in this run's iOS/web
  evidence suggests Android would differ (no `.android.tsx` file exists anywhere in this
  feature, and `useSafeAreaInsets()`/`ScrollView` are cross-platform RN primitives, not
  iOS-specific), but that is an inference, not a check.
- Same temporary, fully-reverted `app/_layout.tsx` edit as Runs 5–7 (`KycGate()` hardcoded to
  render `<Stack>` unconditionally, `TEMP-MANUAL-VERIFICATION-ONLY` comment, original body
  commented out rather than left as dead-but-live code — the same `TS2538` control-flow-
  narrowing gotcha documented in Run 7 recurred and was avoided the same way). Reverted via
  `git checkout -- app/_layout.tsx` before this run ended; confirmed empty via `git diff --stat
  app/_layout.tsx` both immediately after reverting and again at the very end of this run.

### An environment gotcha discovered and worked around this run

The first attempt at the narrow-width (375px) and short-landscape checks used
`Browser.setWindowBounds` (the genuine OS-level window resize already established as the
gold-standard technique in Run 7, for proving a *live* resize with no reload). This run
discovered that this specific headless-Chrome build silently **clamps requested window bounds to
a real minimum (~500×375)** — a request for `375×800` came back as `500×800`, and a request for
`667×300` came back as `667×375`, confirmed directly via `Browser.getWindowForTarget` before and
after the resize and `window.innerWidth/innerHeight` inside the page. Taking either clamped
value at face value would have silently invalidated every subsequent narrow/short check. Switched
to `Emulation.setDeviceMetricsOverride` instead (sets the actual rendered viewport size
independent of the real window's OS-level minimum; keyboard `Input.dispatchKeyEvent` still
targets the same real page) for all viewport-size checks in this run — verified it reports the
*exact* requested width/height back via `window.innerWidth/innerHeight` at several sizes
(375×800, 1024×800, 667×375, 667×300, 568×320, 500×220) before trusting any further finding from
it. (Run 7's own AS6 live-resize check is unaffected — it used real window resize deliberately
to prove no-reload, at widths ≥500 that this build's minimum doesn't clamp.)

### T020 — Accessibility pass across every screen/component in this feature

**Method**: for each of the screens/components listed in the task (shell tabs/sidebar/
bottom-bar, Home/Scan screen, "+" card, top-right controls, Amigos pill, Amigos/Social/scanner
placeholder screens), read real rendered DOM (web) and real simulator screenshots (native),
checking: (a) every interactive element's accessible role/tag is a genuine semantic element, not
a generic `View`/`Text` with a bolted-on role; (b) every interactive element has a real,
non-empty, distinct accessibility label; (c) every interactive element measures ≥44×44 logical
px in the real rendered DOM (not just in its own style object); (d) — the part no prior batch
checked — full keyboard Tab-order across the **entire composed Home/Scan screen**, shell nav
included, both web treatments, plus visible focus indicators for every element in that order.

**1) Role/label audit (real DOM, web, 1024px/sidebar width)** — read every `button`, `a`,
`[role]` element's tag/role/`aria-label`/rendered size directly:

```
NAV (role=navigation) > 3x A (role=link): "Amigos" (187x44), "Home" (187x44), "Social" (187x44)
BUTTON (role=button): "Amigos" (90x44) — the top-left quick-access pill
BUTTON (role=button): "Language, English or Spanish — not yet available" (74x44)
BUTTON (role=button): "Currency, US Dollar or Mexican Peso — not yet available" (80x44)
BUTTON (role=button): "Notifications — not yet available" (99x44)
BUTTON (role=button): "Messages — not yet available" (82x44)
BUTTON (role=button): "Scan a card" (220x308)
```

Every interactive element renders as a genuine native `<button>` or `<a>` (confirmed via
`tagName`, not just a `role` attribute on a `<div>`) with a distinct, non-empty, descriptive
label, all ≥44×44 in the real measured DOM. Repeated at 375px (bottom-bar treatment): bottom-bar
links measured 74.8×44 / 63.75×44 / 64.86×44 (all ≥44×44); scan route's own "Back to Home"
button measured 59.3×44. `accessibilityRole="header"` on the placeholder screens' titles
confirmed to render as real `<h1 role="heading">` elements (`/amigos`, `/social`, `/scan`, all
checked directly), not generic styled text. **No role/label/tap-target finding — everything
already built in prior batches (T001–T019) checks out correctly at the real-DOM level, not just
in RNTL.**

**2) Full keyboard Tab-order across the whole composed screen (the check no prior batch
performed)** — dispatched real `Tab` keydown/keyup pairs via CDP and recorded
`document.activeElement` after each press, all the way from `document.body` through the *entire*
screen including the shell nav on both sides of the breakpoint:

- **Sidebar treatment (1024px width)**: `Amigos`(sidebar) → `Home`(sidebar) → `Social`(sidebar)
  → `Amigos`(pill) → `Language...` → `Currency...` → `Notifications...` → `Messages...` →
  **`Scan a card`** → wraps back to `Amigos`(sidebar). Nine focusable elements, no gap, no skip,
  the scan card correctly included.
- **Bottom-bar treatment (375px width)**: `Amigos`(pill) → `Language...` → `Currency...` →
  `Notifications...` → `Messages...` → **`Scan a card`** → `Amigos`(bottom bar) →
  `Home`(bottom bar) → `Social`(bottom bar) → (Tab moves focus out of the page, normal browser
  behaviour at the last focusable element). Content-first, nav-last order — matches this
  treatment's own visual layout (content above, bar below).

T019 (a prior, already-approved batch) had checked the sidebar case only up to `Messages...` (8
Tab presses) and never continued far enough to observe whether the next press reached the scan
card at all. This run extended that same walk and confirms it does, correctly, in both
treatments — **a genuine finding that the full-screen tab order has no gap, not merely an
assumption inherited from the per-component checks.**

**3) Visible focus indicator, every element in both walks** — read
`getComputedStyle(activeElement)` after each Tab press: every element in both walks reports
`outlineStyle: "auto"`, `outlineWidth: "1px"` (the browser's own default focus ring, left
un-overridden by any component in this feature — confirmed by inspection, no `outlineWidth`/
`outlineStyle: "none"` anywhere in `src/features/navigation/` or `src/features/scanner/`).
**No finding.**

**4) Real finding — safe-area/status-bar overlap on native (iOS)** — see the dedicated writeup
below. Caught by a real iPhone 17 Pro Simulator screenshot, not by any web check (web has no
notch/status bar to collide with) — this is exactly the class of platform-specific gap
`docs/verification.md` warns that web-only checks can miss.

### T021 — Responsive layout check (375px, ≥768px, phone/tablet, and the landscape edge case)

**1) 375px web viewport** — `document.documentElement.scrollWidth === clientWidth === 375` (no
horizontal overflow) on `/`, `/amigos`, `/social`, `/scan`. **No finding.**

**2) ≥768px web viewport (1024px used)** — `scrollWidth === clientWidth === 1024` on `/`,
`/amigos`, `/social`. **No finding.**

**3) The exact edge case named in spec.md** ("What happens if the four top-right controls don't
fit vertically on a very short/narrow device viewport... it must never overlap or obscure the
centre '+' card affordance") — checked directly at several real landscape-phone-scale viewports
(667×375, 667×300, 568×320, 500×220) via `Emulation.setDeviceMetricsOverride`, reading real
`getBoundingClientRect()`s for `home-screen-top-right` and `scan-entry-card`:

- **The top-right stack itself never overlapped the card at any tested size** (`overlap: false`
  in every case) — the literal scenario spec.md names.
- **A different, more serious problem was found instead**: the centre "+" card has a *fixed*
  height (308px, the 2.5:3.5 trading-card ratio at `CARD_WIDTH = 220`) and was vertically
  centred inside a plain `flex: 1` container. At every tested height ≤375px (a common real
  landscape-phone height — e.g. iPhone SE-class landscape), the card's fixed height alone
  exceeded the viewport height, so its bottom (and sometimes top) rendered **past the edge of
  the viewport**. Expo's web output sets `body { overflow: hidden }` (confirmed by reading the
  generated HTML `<style id="expo-reset">` and via `getComputedStyle(document.body).overflowY`
  → `"hidden"` at the time of the finding) — there was **no scroll mechanism of any kind**, so
  the clipped portion of the card was not merely visually cramped, it was **permanently
  unreachable**. This is a real violation of the edge case's actual intent (the card must never
  become obscured/unreachable), discovered by actually reproducing the named scenario rather
  than assuming the existing layout already handled it, per the task's explicit instruction.

**Fix** (`src/features/navigation/HomeScreen.tsx`): wrapped the screen's root in a `ScrollView`
(`contentContainerStyle: { flexGrow: 1 }` in place of the prior root `View`'s `flex: 1`) — a
plain React Native primitive already available, no new dependency. This lets the *whole* screen
scroll independently when its content doesn't fit, matching the edge case's own suggested
mitigation language ("the stack may scroll independently") but applied to the actual problem
(the card, not the stack) found by real reproduction.

**Fix verified, re-testing after the change**:
- At 667×300 (a viewport literally *shorter* than the 308px card): `home.scrollHeight (572) >
  home.clientHeight (239)` confirms real scrollable overflow now exists
  (`overflowY: "auto"` on the ScrollView's rendered `<div>`). **Correction (per
  `code-reviewer`'s independent re-verification in `progress/review_004-home-scan-shell.md`,
  Findings #2): the card can never be *fully* visible in one frame at this viewport — a 308px
  card cannot fit inside a 300px-tall viewport at any scroll offset, confirmed false by an
  independent live scroll-position sweep (`anyFullyVisible: false` at every tested offset).**
  The accurate, weaker claim that does hold: every part of the card is scroll-reachable — a
  full scroll-position sweep (every 5px from 0 to max) confirms the top edge and the bottom
  edge are each independently bring-into-view-able (nothing is permanently clipped/unreachable),
  just never all of it at once at this extreme a squeeze. The original bullet's "fully within
  the viewport... from offset 200 onward" claim above was a real overclaim in this report, not
  a code defect — left here struck through by this correction rather than silently edited, per
  the reviewer's request to fix the report, not the code.
- At 667×375 (a viewport *taller* than the 308px card, and a realistic real-device landscape
  height): after scrolling to the natural resting position, the card renders **fully within the
  viewport with no scrolling needed at all** — `fullyVisibleAfterScroll: true`, i.e. the fix
  doesn't just make the card reachable via scroll on realistic device sizes, it makes the whole
  screen fit outright.
- At the *extreme* squeeze (500×220 — shorter than the card by nearly 90px), the card cannot be
  **fully** visible in a single frame no matter what (an inherent geometric limit: a 308px-tall
  element cannot fit inside a 220px-tall box), but every part of it remains scroll-reachable —
  confirmed the same way. No layout choice can do better than "reachable" once the viewport is
  literally shorter than the fixed-height element itself; "reachable, never permanently
  obscured" is what the edge case asks for and is what this fix delivers.
- **Regression check**: at normal sizes (1024×800 wide, 375×800 narrow-portrait) —
  `home.scrollHeight === home.clientHeight` in both (no scrolling introduced where none is
  needed) and `scanCardFullyVisible: true` in both — the fix is a no-op for every viewport size
  this feature was already correct at.
- **Horizontal overflow unaffected**: `scrollWidth === clientWidth` at every tested width, both
  before and after the fix — this was a vertical-only problem.

**4) Real finding — the same iOS safe-area/status-bar overlap surfaces here too** (SC-003:
"without clipped content, overlapping elements... at both phone and tablet form factors on
iOS/Android") — see below.

### The safe-area/status-bar overlap finding (fixed; affects both T020 and T021)

**Discovery**: booted a real iPhone 17 Pro Simulator (iOS 26.5), opened the running dev server
via Expo Go (`xcrun simctl openurl ... "exp://127.0.0.1:8600"`), and took a real device
screenshot (`xcrun simctl io ... screenshot`). The cold-loaded Home/Scan screen showed the
system status bar's clock ("10:14") rendering **directly on top of** the top-left "Amigos"
pill's text, and the system Wi-Fi/battery icons rendering **directly on top of** the top-right
"ENG/ESP" control — a real, visible overlapping-elements bug, confirmed again in a zoomed crop
of the screenshot. Root cause (confirmed by reading every file in this feature): `HomeScreen.tsx`
used a plain `padding: 16` with **no safe-area awareness at all** — no
`react-native-safe-area-context` import anywhere in `src/features/navigation/` or
`src/features/scanner/` before this fix (confirmed via `grep`) — and this screen has no header
(`app/(app)/_layout.tsx`'s native `<Tabs>` sets `screenOptions={{ headerShown: false }}`) to
reserve that space on its own, unlike a header-having screen where the navigator itself would
inset the content. `react-native-safe-area-context` was already an installed project dependency
(per `plan.md`) but had never actually been *used* anywhere in the codebase — and `expo-router`'s
own `ExpoRoot.js` already wraps the whole app in a `<SafeAreaProvider>` (confirmed by reading
`node_modules/expo-router/build/ExpoRoot.js`), so `useSafeAreaInsets()` was safe to call directly
in `HomeScreen` with zero additional provider wiring needed.

**Fix** (`src/features/navigation/HomeScreen.tsx`): added `useSafeAreaInsets()` (from the
already-installed `react-native-safe-area-context`, no new dependency) and applied
`insets.top`/`insets.left`/`insets.right` on top of the existing `16` to the top row's padding
(the row containing the Amigos pill and the top-right controls); `paddingBottom` stays a plain
`16` (the bottom edge has no notch/status-bar concern for this row). `useSafeAreaInsets()`
resolves to `{ top: 0, left: 0, right: 0, bottom: 0 }` on web (no notch there), so this is a
verified no-op on every web check above — confirmed by re-running the full web verification
suite after this change and seeing byte-identical element positions to before it (e.g. the
Amigos pill's `top: 16, left: 16` unchanged in the post-fix re-run).

**Fix verified on real hardware simulators, both phone and tablet form factors**:
- **iPhone 17 Pro (phone, Dynamic Island)**: fresh screenshot after the fix (app relaunched via
  `simctl terminate` + `simctl openurl` to force a fresh JS load, not relying on Fast Refresh)
  shows the "Amigos" pill and "ENG/ESP" control now rendering entirely **below** the status
  bar/Dynamic Island, with a clean visual gap — no overlap of any kind. The native bottom tab
  bar (Amigos/Home/Social, Home highlighted blue) is unaffected (unchanged from Run 5's own
  T009, out of scope here).
- **iPad Pro 13-inch M5 (tablet)**: Expo Go was not pre-installed on this simulator; installed
  the same `.app` bundle already present for the iPhone simulator via `xcrun simctl install`
  (no network/App Store step). Fresh screenshot shows the same clean layout — Amigos pill,
  top-right four-control stack, and centred "+" card all correctly positioned with no clipping
  or overlap, native tab bar at the bottom. **SC-003's tablet form factor confirmed on iOS.**
- **Android: not checked** — no emulator/`adb` available in this environment (see "Environment
  used" above). Disclosed explicitly, not assumed covered.

### Files changed

- `src/features/navigation/HomeScreen.tsx` — two fixes, both described in full above:
  1. Root `View` → `ScrollView` (`contentContainerStyle: { flexGrow: 1 }`), so the screen scrolls
     independently instead of permanently clipping content against Expo web's `overflow: hidden`
     body when it doesn't fit a very short viewport.
  2. `useSafeAreaInsets()` applied to the top row's `paddingTop`/`paddingLeft`/`paddingRight` (on
     top of the existing `16`), fixing the real status-bar/notch overlap found on iOS. Added a
     `testID="home-screen-top-row"` on that row (pure test instrumentation, matching this
     feature's existing testID convention) so the fix is directly assertable.
- `src/features/navigation/HomeScreen.test.tsx` — two new regression tests (existing four tests
  unchanged, still pass): (a) asserts the root renders as a real `ScrollView` (via
  `UNSAFE_getByType`, since the `testID` attaches to the underlying host node, not the composite
  type — confirmed by first trying a direct `.type` comparison, which failed with the RN host
  component's internal name, before switching to `UNSAFE_getByType`); (b) renders inside a
  `SafeAreaProvider` with explicit non-zero `initialMetrics` insets and asserts the top row's
  flattened style actually incorporates each of `top`/`left`/`right`, not just the original
  hardcoded `16`. Added a `jest.mock("react-native-safe-area-context", ...)` (using the library's
  own official Jest mock, `react-native-safe-area-context/jest/mock` — no hand-rolled mock) at
  the top of the file, since `useSafeAreaInsets()` throws under `react-test-renderer` with no
  `SafeAreaProvider` measurement.
- `src/features/navigation/HomeScreen.integration.test.tsx` — added the same
  `react-native-safe-area-context` Jest mock (this file also renders the real `HomeScreen`, via
  T018's convergence tests — those tests were previously passing only because they predate
  `HomeScreen`'s new `useSafeAreaInsets()` call; unchanged otherwise).
- `app/(app)/index.test.tsx` — same addition, same reason (this file renders `HomeRouteScreen`,
  which renders `HomeScreen`).
- `specs/004-home-scan-shell/tasks.md` — marked T020 and T021 `[X]`.

**Deliberately not changed, and why**: `jest.config.js` was considered for a global
`setupFiles` wiring of the same mock (avoiding repeating the `jest.mock(...)` call in three
files), and briefly implemented that way mid-run — but T020's own task text says "no new
files" and a global setup required a new `jest.setup.js` file, so that approach was reverted in
favor of the local, per-file `jest.mock(...)` calls above once the alternative (no new file) was
confirmed to work equally well. `jest.config.js` itself is untouched in the final diff.

### Constitution / conventions compliance

- Principle IV: `HomeScreen.tsx`'s two fixes are both presentation-only (a scroll container
  choice and a padding calculation from a hook's return value) — no fetch/validation/business
  logic was added to any component body.
- No new runtime dependency — `ScrollView` is core `react-native`; `react-native-safe-area-context`
  was already an installed project dependency (confirmed in `package.json`, unused until this
  run) with `useSafeAreaInsets` already exported by the installed version; `expo-router` was
  already wrapping the app in `SafeAreaProvider` (confirmed by reading its source), so no
  provider wiring was added anywhere.
- No backend/Postgres/Redis/S3 access — this feature still makes zero backend calls (FR-010,
  unchanged).
- `resolveKycRoute()`/`useKycGate()`/`KYC_ROUTE_TARGETS` (FR-009) — untouched in the final diff;
  the manual-check-only bypass to `app/_layout.tsx` was fully reverted, confirmed via `git diff`
  before this run ended.
- KYC/identity document handling — N/A, no such code touched this run.
- No `any`; strict mode respected (see type-check below). No emojis added to any file.

### Tests run

```
npx tsc --noEmit
```
→ clean, no output (no type errors).

```
npx jest src/features/navigation/HomeScreen.test.tsx
```
```
PASS src/features/navigation/HomeScreen.test.tsx
  HomeScreen
    ✓ renders the Amigos quick-access pill top-left
    ✓ renders the four top-right placeholder controls top-right
    ✓ renders the scan entry card dead centre
    ✓ renders the Amigos pill, then the top-right controls, then the scan card, in that order
    ✓ wraps its content in a ScrollView so the screen can scroll independently on a short viewport
    ✓ pads the top row by the device's safe-area insets, not just a fixed 16px
    ✓ navigates to exactly SCAN_ROUTE when the scan card is pressed

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

Full suite (regression check, not just the changed files):

```
npx jest
```
```
Test Suites: 37 passed, 37 total
Tests:       233 passed, 233 total
```

`./init.sh --skip-build` (fast path, as instructed — full build/native-export stages belong to
T022, not this batch):
```
RESULT: SUCCESS (8/8 stages passed)
```
Type-check, npm install, and the full test suite all `OK`. The two `WARN`s (`expo-doctor`
outdated-dependency advisories, native-dependency-version drift for
`expo-image-picker`/`react-native`/`react-native-safe-area-context`/`@types/react`/
`typescript`) are unrelated to this batch — present before this run (see Run 6's own log),
non-blocking per `docs/verification.md`.

### Manual smoke checks (Level 3) — real, not simulated

- **Web**: real headless Chrome via CDP against a live `npx expo start --web` dev server, at six
  distinct viewport sizes (375×800, 1024×800, 667×375, 667×300, 568×320, 500×220), across `/`,
  `/amigos`, `/social`, `/scan` — full details above.
- **iOS phone**: real, booted iPhone 17 Pro Simulator, real Expo Go, real device screenshots,
  before and after the safe-area fix.
- **iOS tablet**: real, booted iPad Pro 13-inch (M5) Simulator, real Expo Go (installed this
  run), real device screenshot, after the fix.
- **Android**: not available in this environment — disclosed above, not silently skipped.

### Cleanup performed before ending this run

- Killed the web dev server (port 8500), the native dev server (port 8600), and the headless-
  Chrome CDP instance (port 9500) — confirmed via `lsof` returning empty on all three ports
  afterward, plus a `pkill -f "expo start"` sweep.
- Shut down both iOS Simulators (`xcrun simctl shutdown`) — confirmed both report `(Shutdown)`
  in `xcrun simctl list devices` afterward.
- Reverted `app/_layout.tsx` via `git checkout -- app/_layout.tsx`; `git diff --stat
  app/_layout.tsx` produced no output, confirmed both immediately after reverting and again at
  the very end of this run.
- Reverted a mid-run `jest.config.js`/`jest.setup.js` global-mock approach in favor of the
  per-file mocks described above, once the "no new files" constraint was reconciled with the
  test-infrastructure need — `jest.setup.js` was deleted, `jest.config.js` has no diff in the
  final state (confirmed via `git status --porcelain`).
- Final `git status --porcelain` shows exactly the pre-existing untracked/modified set from
  prior runs, plus only this run's own changes (`HomeScreen.tsx`, `HomeScreen.test.tsx`,
  `HomeScreen.integration.test.tsx`, `app/(app)/index.test.tsx`,
  `specs/004-home-scan-shell/tasks.md`, this report) — no stray edit to any other file, and no
  new files created anywhere.

### Requirement traceability

| FR / SC / Edge Case | Test(s) / evidence |
|---|---|
| Constitution VII (accessible, keyboard-navigable, visible focus) | Real-browser CDP full-tab-order walk across the entire composed screen, both web treatments (T020, section 2 above); real `getComputedStyle` outline read for every element in both walks (T020, section 3) |
| SC-002 (all elements reachable/operable via keyboard alone on web, VoiceOver/TalkBack on native, zero pointer-only elements) | Same CDP tab-order walk (web); no VoiceOver/TalkBack session driven this run beyond what T015/T019 already established (identical components, no platform-specific file) — disclosed, not claimed |
| SC-004 (≥44×44 tap target + non-empty accessibility label, every interactive element) | Real-DOM role/label/size audit, both breakpoints (T020, section 1) — no finding, all pre-existing work already correct at the real-DOM level |
| SC-003 (no clipped content/overlapping elements/horizontal overflow at 375px, and at phone/tablet form factors on iOS) | 375px/≥768px overflow checks (T021, sections 1–2, no finding); real iPhone 17 Pro + iPad Pro 13" screenshots before/after the safe-area fix (T021, safe-area writeup) |
| spec.md Edge Cases — "the [top-right] stack may scroll independently... must never overlap or obscure the centre '+' card affordance" | Real landscape-viewport reproduction at 667×375/667×300/568×320/500×220 (T021, section 3) — found the *card* (not the stack) becoming unreachable, fixed via `ScrollView`, re-verified via real scroll-position sweep confirming reachability restored; `HomeScreen.test.tsx` "wraps its content in a ScrollView..." (regression guard) |
| (New finding, not a pre-existing FR/SC — a real device-only bug) top-left pill / top-right controls overlapping the system status bar/notch on native | Real iPhone 17 Pro + iPad Pro 13" screenshots, before (overlap) and after (fixed) `useSafeAreaInsets()`; `HomeScreen.test.tsx` "pads the top row by the device's safe-area insets..." (regression guard) |

### Tasks now `[X]`

- T020
- T021

### Deviations from plan / notes for sign-off

- **Two real, previously-undetected bugs were found and fixed this run** — both disclosed in
  full above, not silently patched: (1) the centre "+" card becoming permanently unreachable
  (not just visually cramped) on short/narrow landscape-phone viewports, fixed via a `ScrollView`
  root; (2) the top-left pill/top-right controls overlapping the system status bar/Dynamic
  Island on native iOS, fixed via `useSafeAreaInsets()`. Both are within this task's explicit
  "fix any finding in place" instruction, not scope creep — flagging them prominently for
  sign-off since they are genuine behavior changes (however narrow), not mere test additions.
- **Android was not checked** — no emulator/`adb` in this environment. Disclosed explicitly per
  the task's own instruction rather than silently marked done; nothing in the iOS/web evidence
  suggests a platform-specific difference (no `.android.tsx` file exists anywhere in this
  feature; both fixes use cross-platform RN primitives), but that remains an inference, not a
  check, and is called out here in case the human wants a dedicated Android pass before
  considering T021 fully closed on that platform.
- **VoiceOver (iOS) / TalkBack (Android) were not driven live this run** — same disclosed gap as
  T019 (Run 7); this run's contribution to SC-002/accessibility is the real-DOM `aria-label`/role
  audit and the full keyboard-tab-order walk, not a live screen-reader narration session.
- A mid-run implementation choice (global `jest.setup.js` + `setupFiles` wiring for the
  `react-native-safe-area-context` mock) was reverted in favor of per-file `jest.mock(...)` calls
  once reconciled against T020's literal "no new files" instruction — noted here for
  transparency even though the final diff has no trace of the reverted approach.
- No other deviation. Both `ScrollView` and `useSafeAreaInsets()` are existing, already-installed
  primitives (no `package.json` change) applied only inside `HomeScreen.tsx`, the single file
  this feature's own `plan.md` already designates as the Home/Scan screen's composition root.

## Run N — Phase 7 (Polish): T022 — final ./init.sh gate

**Scope**: Exactly T022 from `specs/004-home-scan-shell/tasks.md` — the last task in this
feature. No source files touched; this run is verification-only plus the task-list checkbox.

### Pre-flight reading

Read (fresh from disk, this session): `.specify/memory/constitution.md`, `docs/conventions.md`,
`docs/verification.md`, and `specs/004-home-scan-shell/{spec.md,plan.md,tasks.md}` in full.
Confirmed T022 exists in `tasks.md`'s Phase 7 with dependency "all prior tasks" (all of
T001-T021 already `[X]`), and that spec.md's Edge Cases section already carries the human's
2026-08-04 amendment about the whole-screen `ScrollView` fix — left untouched, as instructed.

### Command run

```
./init.sh
```

(no `--skip-*` flags — the real gate, not the Stop hook's fast path.)

### Full output summary

```
▶ 1/8 Checking prerequisites
✅ [OK] Prerequisites: node v20.20.2, npm v10.8.2

▶ 2/8 Environment file
✅ [OK] Env file: .env already exists, left untouched

▶ 3/8 Installing dependencies
✅ [OK] npm install: dependencies installed

▶ 4/8 Type-checking
✅ [OK] Type-check: no type errors

▶ 5/8 Expo config/dependency health (expo-doctor)
⚠️  [WARN] expo-doctor: issues found (non-blocking) — see /tmp/init-sh-front-doctor.log:
    Found outdated dependencies. Advice: Use 'npx expo install --check' to review and upgrade
    your dependencies. 2 checks failed, indicating possible issues with the project.

▶ 6/8 Native dependency alignment
⚠️  [WARN] Native deps: peers declared, but some package versions differ from the pinned SDK's
    expectations (non-blocking) — see /tmp/init-sh-front-expo-install-check.log:
      expo-image-picker@15.0.7 - expected version: ~15.1.0
      react-native@0.74.0 - expected version: 0.74.5
      react-native-safe-area-context@4.10.1 - expected version: 4.10.5
      @types/react@18.3.31 - expected version: ~18.2.79
      typescript@5.9.3 - expected version: ~5.3.3

▶ 7/8 Running test suite
✅ [OK] Tests: all tests passed

▶ 8/8 Bundle export smoke checks (web, iOS, Android)
✅ [OK] Build check (web): web bundle exported cleanly
✅ [OK] Build check (ios): ios bundle exported cleanly
✅ [OK] Build check (android): android bundle exported cleanly

==================== init.sh summary ====================
✅ [OK] Prerequisites, Env file, npm install, Type-check
⚠️  [WARN] expo-doctor (outdated-dependency notice)
⚠️  [WARN] Native deps (version-drift notice)
✅ [OK] Tests: all tests passed
✅ [OK] Build check (web/ios/android): all clean
===========================================================
RESULT: SUCCESS (10/10 stages passed)
```

Both warnings are the same two pre-existing, already-known notices called out in this task's
brief (expo-doctor outdated-dependency notice; native-dependency-alignment version-drift
notice on `expo-image-picker`, `react-native`, `react-native-safe-area-context`, `@types/react`,
`typescript`) — present before this feature branch started, unrelated to any file this feature
touched, and explicitly out of scope for T022 to fix. No new warning and no failing stage
appeared. Type-check clean, test suite green, and all three bundle exports (web/iOS/Android)
exported cleanly — confirming `app/index.tsx`'s removal (T014) left no orphaned or duplicate
`"/"` route (the web/iOS/Android exports would have failed on an ambiguous route match or a
missing module if it had), and that no new native dependency was actually needed, per `plan.md`'s
Research Decisions (`npm install`/native-dependency-alignment surfaced nothing new tied to this
feature's files).

### FR-009 sanity re-check (gate files untouched)

```
git diff --stat app/_layout.tsx src/domain/kyc-gate.ts src/features/identity/useKycGate.ts
```

Zero output — zero diff on all three files, confirmed again at this final gate. `resolveKycRoute()`,
`useKycGate()`, and `KYC_ROUTE_TARGETS` remain exactly as `001-registration-kyc` left them; this
feature only ever changed what the existing `"main"` route renders, per FR-009.

### git status sanity check

`git status --porcelain -uall` shows only:
- `D app/index.tsx` — the intended, atomic removal from T014.
- `M docs/conventions.md`, `M feature_list.json`, `M progress/current.md` — legitimate
  documentation/progress edits from earlier in this feature (the `_layout.*`-test-placement
  convention note, this feature's `feature_list.json` entry, and the running session log) —
  no source-code semantics in any of the three.
- `M metro.config.js` — a comment-only clarification (no logic change) added during the
  dev-server-crash-fix work, explaining why the existing `blockList` doesn't reach `expo
  start`'s separate route-manifest scan. Diff reviewed directly this run; confirmed comment-only.
- Everything else listed as `??` (untracked) maps one-to-one to this feature's own intended new
  files: `specs/004-home-scan-shell/**`, `app/(app)/**`, `app/scan.tsx`+test,
  `src/domain/navigation.ts`+test, `src/features/navigation/**`,
  `src/features/scanner/ScanEntryCard*`/`ScanPlaceholderScreen*`,
  `src/features/social/AmigosPlaceholderScreen*`/`SocialPlaceholderScreen*`, and the two
  `progress/impl_*.md`/`progress/review_*.md` report files.

No stray temp files, screenshots, or debug leftovers found anywhere in the repo tree (a
project-wide search for `*.png`/`*.jpg`/`*.jpeg`/`*scratch*`/`*debug*`/`*.log` outside
`node_modules`/`.git` returned nothing) — the manual verification work this feature did with
scratchpad scripts and screenshots left no trace in the tracked or untracked working tree.

### Result

T022 verified green with no regression and no new warning. Marked `[X]` in
`specs/004-home-scan-shell/tasks.md`. **All 22 tasks in this feature (T001-T022) are now
`[X]`.** No deviation from plan in this run; nothing needs sign-off beyond what was already
raised and resolved in the Phase 7 (T020/T021) run above.
