# Tasks: Home & Scan Shell

**Input**: Design documents from `specs/004-home-scan-shell/` (`spec.md`, `plan.md`)

**Tests**: Included. `docs/verification.md` mandates unit tests for every `src/domain`
export and component/screen tests for every new/changed screen; test tooling already exists
(installed by `001-registration-kyc`), so no setup task is needed here — this feature starts
directly at Phase 2 (Foundational). See `docs/verification.md` for what counts as verified.

**Organization**: Tasks are grouped by user story from `spec.md`, in priority order
(P1 → P1 → P2 → P3). User Story 1 (the shell + landing screen) is the MVP — nothing else is
reachable without it, since it's what replaces `app/index.tsx`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 (shell + landing, P1), US2 ("+" → scanner stub, P1), US3 (Amigos/Social
  reachability, P2), US4 (top-right inert controls, P3)
- File paths are exact; see `plan.md`'s Project Structure for the full tree

---

## Phase 1: Setup

**Skipped — no new setup needed.** Test tooling (`jest`, `jest-expo`,
`@testing-library/react-native`) was already installed by `001-registration-kyc`'s T001, and
this feature adds no new runtime dependency (`plan.md`'s "Native tab bar" and "Web navigation
treatment" Research Decisions both confirm everything needed — `expo-router`'s bundled
`@react-navigation/bottom-tabs`, `@expo/vector-icons` transitively via `expo` — is already
installed).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared route table/breakpoint logic and every leaf UI component the shell's
screens compose. **No route-wiring task (Phase 3+) starts before this phase is done.**

- [X] T001 [P] Create `src/domain/navigation.ts`: export `NAV_DESTINATIONS` (readonly array of
  exactly three `{ key: "amigos" | "home" | "social", route: string, label: string }` entries
  — `"/amigos"`, `"/"`, `"/social"`), `SCAN_ROUTE = "/scan"`, `BREAKPOINT_PX = 768`, and a pure
  `resolveWebNavLayout(width: number): "sidebar" | "bottomBar"` (`width >= BREAKPOINT_PX` →
  `"sidebar"`, else `"bottomBar"`). Zero React/React Native imports (Constitution IV). Add
  `src/domain/navigation.test.ts` covering: `resolveWebNavLayout` at 767 (`"bottomBar"`), 768
  (`"sidebar"`, boundary-inclusive), and a wide value (`"sidebar"`); `NAV_DESTINATIONS` has
  exactly three entries with unique `key`/`route` values. *(FR-001, FR-003)*
- [X] T002 [P] Create `src/features/navigation/README.md` — mirrors the existing per-domain
  README pattern (see `src/features/identity/README.md`) but states explicitly that this
  module has **no backend counterpart to mirror**: it is the shell chrome between domains
  (Constitution Principle V's documented exception — see `plan.md`'s Constitution Check).
  *(supports Constitution V, no FR)*
- [X] T003 [P] Create `src/features/scanner/ScanEntryCard.tsx`: a pressable, vertically
  oriented rounded-rectangle at a ~2.5:3.5 aspect ratio containing a "+" glyph, with
  `accessibilityLabel="Scan a card"` (not bare "+"/"button" — spec.md US2 AS3) and a minimum
  44×44 tap target. Takes an `onPress` prop (this task does not wire navigation itself — see
  T016). Add `src/features/scanner/ScanEntryCard.test.tsx` (RNTL) asserting the rendered
  aspect-ratio-driven dimensions relationship (width < height), the accessibility label, and
  that `onPress` fires on press. *(FR-004, FR-005 [affordance only], SC-004)*
- [X] T004 [P] Create `src/features/scanner/ScanPlaceholderScreen.tsx`: a stub screen with a
  clear "Scanner coming soon" (or equivalent) message and an accessible heading — explicitly
  not camera UI, not a capture flow (spec.md FR-005). Add
  `src/features/scanner/ScanPlaceholderScreen.test.tsx` asserting the stub copy renders and no
  camera-related module is imported. *(FR-005)*
- [X] T005 [P] Create `src/features/social/AmigosPlaceholderScreen.tsx`: a placeholder screen
  identifying itself as the Amigos destination, with no friend list/request/social data.
  Add `src/features/social/AmigosPlaceholderScreen.test.tsx` asserting the identifying copy
  renders. *(FR-007)*
- [X] T006 [P] Create `src/features/social/SocialPlaceholderScreen.tsx`: a placeholder screen
  identifying itself as the Social destination, with no feed/post/trading content. Add
  `src/features/social/SocialPlaceholderScreen.test.tsx` asserting the identifying copy
  renders. *(FR-007)*
- [X] T007 [P] Create `src/features/navigation/TopRightControls.tsx`: renders exactly four
  controls, top-to-bottom — language toggle (ENG/ESP), currency toggle (USD/MXN),
  Notifications, Messages — each with a distinct, real `accessibilityLabel` (e.g. "Language,
  English or Spanish — not yet available"), a minimum 44×44 tap target, and local
  expanded/collapsed state showing inline "Not yet available" text on activation (no toast
  library — see `plan.md`'s "Placeholder-control feedback mechanism" Research Decision); none
  performs real language/currency/notification/messaging behavior. Add
  `src/features/navigation/TopRightControls.test.tsx` asserting: render order top-to-bottom,
  each control's accessibility label, and that activating each one shows the "not yet
  available" feedback (no silent no-op — SC-005). *(FR-006, FR-010, SC-004, SC-005)*
- [X] T008 [P] Create `src/features/navigation/AmigosQuickAccessPill.tsx`: a pill-shaped
  pressable labelled "Amigos" that calls `useRouter().push` (or `<Link>`) to the same
  `"/amigos"` route as `NAV_DESTINATIONS`' Amigos entry (T001) — not a second destination
  (FR-008). Add `src/features/navigation/AmigosQuickAccessPill.test.tsx` (mocking
  `expo-router`'s router) asserting the navigation call target matches
  `NAV_DESTINATIONS.find(d => d.key === "amigos").route`. *(FR-008)*

**Checkpoint**: Domain table/breakpoint logic and every leaf screen/component exist and are
unit/component-tested; no `app/` routes are wired yet, so nothing is user-visible.

---

## Phase 3: User Story 1 - Reach the Home/Scan screen inside the navigation shell (Priority: P1) 🎯 MVP

**Goal**: An onboarded user's `"main"` gate resolution lands on a real Home/Scan screen with
all three shell destinations reachable, on iOS/Android (native bottom tab bar) and web
(sidebar ≥768px, bottom bar <768px, live-switching on resize).

**Independent Test**: Per spec.md — with a mocked/fixture onboarded user, confirm the shell
renders with all three destinations reachable and the correct web treatment at both narrow and
wide viewports, on all three platforms.

### Implementation for User Story 1

- [X] T009 [US1] Create `app/(app)/_layout.tsx`: `expo-router`'s `<Tabs>`, one
  `<Tabs.Screen>` per `NAV_DESTINATIONS` entry (T001), each with an `@expo/vector-icons` icon
  and an explicit `tabBarAccessibilityLabel` (not left to icon-only defaults). Resolved on
  iOS/Android. Depends on: T001. *(FR-001, FR-002)*
- [X] T010 [P] [US1] Create `src/features/navigation/WebSidebarNav.tsx`: a persistent left
  sidebar rendering `NAV_DESTINATIONS` (T001) as a vertical list of accessible, keyboard-
  focusable links with visible focus states, wrapping an `expo-router` `<Slot />` for the
  active screen. Add `src/features/navigation/WebSidebarNav.test.tsx` asserting all three
  destinations render with the correct roles/labels and are reachable via keyboard (tab
  order). Depends on: T001. *(FR-001, FR-003, SC-002)*
- [X] T011 [P] [US1] Create `src/features/navigation/WebBottomBarNav.tsx`: a bottom bar
  visually/behaviorally equivalent to the native tab bar, rendering `NAV_DESTINATIONS` (T001),
  wrapping an `expo-router` `<Slot />`. Add
  `src/features/navigation/WebBottomBarNav.test.tsx` asserting the same three-destination
  coverage as T010. Depends on: T001. *(FR-001, FR-003, SC-002, SC-003)*
- [X] T012 [US1] Create `app/(app)/_layout.web.tsx`: reads `useWindowDimensions()`, calls
  `resolveWebNavLayout(width)` (T001) to pick `WebSidebarNav` (T010) or `WebBottomBarNav`
  (T011) — no inline `Platform.OS` branch, the file itself is the platform split. Add a test
  (mocking `useWindowDimensions`) covering both branches plus a live-resize case: render at
  767px, assert bottom-bar output; simulate a dimensions-change event to 800px, assert it
  re-renders as the sidebar without unmounting/remounting the active screen's state (spec.md
  US1 AS6). Depends on: T001, T010, T011. *(FR-003, US1 AS4–AS6)*
- [X] T013 [US1] Create `src/features/navigation/HomeScreen.tsx`: composes
  `AmigosQuickAccessPill` (T008, top-left), `TopRightControls` (T007, top-right vertical
  stack), and `ScanEntryCard` (T003, dead centre) in the wireframe's layout, passing
  `ScanEntryCard` a placeholder `onPress` for now (real navigation wiring is T016 — US2). Add
  `src/features/navigation/HomeScreen.test.tsx` asserting all three composed elements render
  with their expected roles/labels and relative positions (top-left / top-right / centre).
  Depends on: T003, T007, T008. *(FR-004, FR-006, FR-008)*
- [X] T014 [US1] Wire the routes: create `app/(app)/index.tsx` (renders `HomeScreen`, T013),
  `app/(app)/amigos.tsx` (renders `AmigosPlaceholderScreen`, T005), `app/(app)/social.tsx`
  (renders `SocialPlaceholderScreen`, T006). **Remove `app/index.tsx`** (the repo-scaffold
  placeholder) in the same task, so `"/"` never briefly resolves to neither file and never to
  both — this is one atomic change, not two. Depends on: T005, T006, T009, T012, T013.
  *(FR-001, FR-007, FR-009)*
- [X] T015 [US1] Manual smoke check (Level 3, `docs/verification.md`): with a mocked/fixture
  onboarded user (`useKycGate` resolving `"main"`), confirm on web (`npm run web`) that the
  Home/Scan screen renders with the shell visible, no flash of the old scaffold placeholder or
  an unmatched-route error (SC-001); confirm the bottom-bar treatment at 375px and the sidebar
  treatment at ≥768px (spec.md US1 AS4/AS5), and that resizing across 768px live-switches
  without losing the active destination (AS6); switch Amigos → Social → Home/Scan and confirm
  state is preserved on return (AS3). Repeat on iOS/Android simulators if available, confirming
  the native bottom tab bar and safe-area insets. Record findings in
  `progress/impl_004-home-scan-shell.md`. Depends on: T014.

**Checkpoint**: User Story 1 (MVP) is fully functional and independently testable — the shell
and Home/Scan landing screen work end to end on all three platforms; `001-registration-kyc`'s
gate now has a real destination.

---

## Phase 4: User Story 2 - Navigate to the scanner from the "+" card affordance (Priority: P1)

**Goal**: Pressing the centre "+" card navigates to a stubbed `/scan` route; navigating back
returns to an intact Home/Scan screen and shell.

**Independent Test**: Per spec.md — press the "+" card, confirm navigation to the scanner's
stub screen (not camera UI, not an unmatched-route error), then navigate back.

### Implementation for User Story 2

- [X] T016 [US2] Create `app/scan.tsx` (renders `ScanPlaceholderScreen`, T004). Wire
  `HomeScreen`'s `ScanEntryCard` instance (T013) to navigate to `SCAN_ROUTE` (T001, `"/scan"`)
  on press, via `expo-router`'s `useRouter().push`. Extend `HomeScreen.test.tsx` (or add a
  screen test for `app/(app)/index.tsx`) asserting the press triggers navigation to exactly
  `SCAN_ROUTE`, and a test for `app/scan.tsx` asserting back-navigation returns to an intact
  shell (spec.md US2 AS1/AS2). Depends on: T001, T003, T004, T013. *(FR-005)*
- [X] T017 [US2] Accessibility confirmation pass on `ScanEntryCard`'s `accessibilityLabel`
  (already set in T003 to "Scan a card") specifically via a screen-reader-oriented assertion
  (query by accessible role + name, not by icon/testID) — fix in place if the label reads as
  anything less descriptive than a clear action (spec.md US2 AS3). Depends on: T003, T016.
  *(SC-002, SC-004)*

**Checkpoint**: User Stories 1 and 2 (both P1) are complete — the shell exists and its single
described interaction (the "+" card) correctly defines the scanner route boundary.

---

## Phase 5: User Story 3 - Reach Amigos and Social as reachable, contentless placeholders (Priority: P2)

**Goal**: Amigos and Social are reachable via both the shell's tabs and (for Amigos) the
Home screen's quick-access pill, always landing on the same respective screen.

**Independent Test**: Per spec.md — select Amigos and Social from the shell, and Amigos via
the top-left pill, confirming each renders its own distinct placeholder and the pill/tab
agree on the same destination.

### Implementation for User Story 3

- [X] T018 [US3] Confirm `AmigosQuickAccessPill` (T008) and the shell's Amigos tab (`app/(app)/
  amigos.tsx`, T014) resolve to the identical rendered screen and the shell shows Amigos as
  the active destination either way (spec.md FR-008, US3 AS3) — add an integration-style test
  (e.g. in `app/(app)/index.tsx`'s screen test, or a new
  `src/features/navigation/HomeScreen.integration.test.tsx`) that presses the pill and asserts
  the resulting screen matches what selecting the Amigos tab directly renders. Depends on:
  T008, T014. *(FR-008)*

**Checkpoint**: User Story 3 complete — Amigos/Social are genuinely reachable with no
duplicate/competing entry points.

---

## Phase 6: User Story 4 - Top-right placeholder controls are visible, accessible, and inert (Priority: P3)

**Goal**: The four top-right controls are correctly positioned, individually accessible, and
give visible feedback on activation without performing any real behavior.

**Independent Test**: Per spec.md — render the Home/Scan screen, confirm all four controls
render in the stated order and each gives visible "not yet available" feedback on activation
via mouse, keyboard, and screen reader.

### Implementation for User Story 4

- [X] T019 [US4] Manual keyboard-only and screen-reader pass (Level 3) across all four
  `TopRightControls` (T007) instances as rendered on the real `Home/Scan` screen (`app/(app)/
  index.tsx`, T014) — confirm each is individually tab-reachable with a visible focus ring
  (web), each announces a distinct real label (not a bare icon) via VoiceOver/TalkBack, and
  each shows visible feedback on activation (spec.md US4 AS2/AS3). Fix any finding in
  `TopRightControls.tsx` directly; add a regression test per fix. Record findings in
  `progress/impl_004-home-scan-shell.md`. Depends on: T007, T014.

**Checkpoint**: All four user stories complete and independently verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T020 [P] Accessibility pass across every screen/component built in this feature (shell
  tabs/sidebar/bottom-bar, Home/Scan screen, "+" card, top-right controls, Amigos pill, Amigos/
  Social/scanner placeholder screens) — labels, roles, minimum 44×44 tap targets, web keyboard
  navigation (tab order, focus states). Fix findings in place; no new files. *(Constitution
  VII, SC-002, SC-004)*
- [X] T021 [P] Responsive layout check at a 375px-wide web viewport and at ≥768px, plus phone
  and tablet form factors on iOS/Android simulators, across every new screen. Fix findings in
  place. *(SC-003)*
- [X] T022 Run `./init.sh` end to end (no `--skip-*` flags) and confirm `RESULT: SUCCESS` with
  the Tests stage at OK, type-check clean, and all three bundle exports (web/iOS/Android)
  clean — this also confirms `app/index.tsx`'s removal (T014) didn't leave an orphaned or
  duplicate `"/"` route, and that no new native dependency was actually needed (per `plan.md`'s
  Research Decisions). Fix any regression found. Depends on: all prior tasks.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped — nothing to do.
- **Foundational (Phase 2)**: T001–T008, all independently parallel (`[P]`, disjoint files) —
  BLOCKS all user stories (every Phase 3+ task consumes at least one of T001/T003/T004/T005/
  T006/T007/T008).
- **User Story 1 (Phase 3, P1)**: Depends on Foundational only.
- **User Story 2 (Phase 4, P1)**: Depends on Foundational (T001, T003, T004) and User Story
  1's T013 (`HomeScreen` must exist before its `ScanEntryCard` instance can be wired to
  navigate) — listed after US1 for that reason, despite being equal priority.
- **User Story 3 (Phase 5, P2)**: Depends on Foundational (T008) and User Story 1's T014
  (routes must exist to compare).
- **User Story 4 (Phase 6, P3)**: Depends on Foundational (T007) and User Story 1's T014.
- **Polish (Phase 7)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- T001–T008 (all of Phase 2) touch disjoint files and can all run in parallel.
- Within Phase 3: T010 and T011 touch disjoint files and can run in parallel once T001 is
  done; T009 has no dependency beyond T001 either, so it too can run alongside T010/T011; T012
  depends on all three; T013 depends on T003/T007/T008 (already done in Phase 2); T014 depends
  on T005/T006/T009/T012/T013; T015 depends on T014.
- Within Phase 7: T020 and T021 can run in parallel; T022 must run last.

---

## Parallel Example: Phase 2 (Foundational)

```bash
Task: "Create src/domain/navigation.ts + navigation.test.ts"
Task: "Create src/features/scanner/ScanEntryCard.tsx + test"
Task: "Create src/features/scanner/ScanPlaceholderScreen.tsx + test"
Task: "Create src/features/social/AmigosPlaceholderScreen.tsx + test"
Task: "Create src/features/social/SocialPlaceholderScreen.tsx + test"
Task: "Create src/features/navigation/TopRightControls.tsx + test"
Task: "Create src/features/navigation/AmigosQuickAccessPill.tsx + test"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1) — this alone replaces `app/index.tsx` with a real,
   three-destination shell and closes `001-registration-kyc`'s open "main lands nowhere real"
   gap.
3. **STOP and VALIDATE**: run T015's manual smoke check across web (both breakpoints) and, if
   available, iOS/Android simulators.
4. That's a demoable MVP. User Stories 2–4 layer the "+" card's navigation, Amigos/Social
   reachability confirmation, and the top-right controls' accessibility polish on top, in
   priority order.
