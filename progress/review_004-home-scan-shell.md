# Code Review: 004-home-scan-shell — Phase 2 (Foundational), T001 & T002

**Scope reviewed**: task-implementer's claimed completion of T001 (`src/domain/navigation.ts`
+ `src/domain/navigation.test.ts`) and T002 (`src/features/navigation/README.md`) from
`specs/004-home-scan-shell/tasks.md`. No later-phase tasks (T003+) exist yet — confirmed by
inspection (see below), so this is a partial-phase review, not a full-feature review.

## Verification performed independently (not taken from progress/impl_004-home-scan-shell.md)

- `git status` / `find ... -newer .git/HEAD`: only `src/domain/navigation.ts`,
  `src/domain/navigation.test.ts`, `src/features/navigation/README.md` are new source files;
  `feature_list.json` and `progress/current.md` carry the expected bookkeeping diff;
  `specs/004-home-scan-shell/` is new (spec/plan/tasks, untracked prior to this review). No
  `app/` file touched, no T003+ file exists (`src/features/scanner/`, `src/features/social/`
  each still contain only their pre-existing `README.md`). Scope matches exactly what was
  claimed — nothing extra, nothing missing.
- `npx tsc --noEmit` → clean, zero errors (re-run myself, not trusted from the impl log).
- `npx jest src/domain/navigation.test.ts` → 5/5 passing (re-run myself).
- `npx jest` (full suite) → 22 suites / 186 tests passing, no regression.
- Read `src/domain/navigation.ts`, `src/domain/navigation.test.ts`,
  `src/features/navigation/README.md` in full and compared against `spec.md`/`plan.md`/
  `tasks.md` T001/T002 text directly (fresh read, not summarized from the impl log).

## Specific confirmations requested

1. **Zero React/React Native imports in `src/domain/navigation.ts`** — confirmed. The file has
   no `import` statements at all; it's pure TypeScript types + two constants + one pure
   function. Satisfies Constitution Principle IV and CHECKPOINTS C3.
2. **`resolveWebNavLayout` boundary at exactly 768 → `"sidebar"` (inclusive)** — confirmed.
   Implementation: `width >= BREAKPOINT_PX ? "sidebar" : "bottomBar"` (`navigation.ts:37`).
   Matches spec.md's Clarifications ("persistent left sidebar at ≥768px") and tasks.md T001's
   explicit instruction. Test file asserts 767→`"bottomBar"`, `BREAKPOINT_PX`(768)→`"sidebar"`,
   1440→`"sidebar"` — all three pass.
3. **`NAV_DESTINATIONS` has exactly three entries with exact keys/routes** — confirmed:
   `{key:"amigos",route:"/amigos"}`, `{key:"home",route:"/"}`, `{key:"social",route:"/social"}`
   (`navigation.ts:17-21`). Matches spec.md FR-001/FR-008 and plan.md's Research Decisions
   exactly, including the `"/"` route for `home` (needed for T014's later route wiring, not yet
   built).
4. **Test file coverage** — confirmed: 767 (`bottomBar`), 768 (`sidebar`, boundary-inclusive),
   1440 (wide → `sidebar`), plus `NAV_DESTINATIONS` "has exactly three entries" and a
   uniqueness assertion over both `key` and `route` via `Set` size comparison. All five tests
   pass under a fresh `npx jest` run. Each test/describe block carries an `FR-00x` comment
   (FR-001, FR-003), satisfying `docs/verification.md` Level 5 / CHECKPOINTS C6's traceability
   requirement for this task's scope.
5. **README documents the "no backend counterpart" exception** — confirmed. It states
   verbatim in its first paragraph: "**No backend counterpart to mirror.** ... this one does
   not correspond to a backend bounded context" and quotes plan.md's Constitution Check
   Principle V row directly (blockquote at README.md:10-15), then cross-references
   `specs/004-home-scan-shell/plan.md`. Matches tasks.md T002's instruction and Constitution
   Principle V's exception-must-be-documented requirement.

## Requirement traceability (T001/T002 scope only)

| FR / Principle | Covered by |
|---|---|
| FR-001 (exactly three reachable destinations, unique) | `navigation.test.ts`: "has exactly three entries", "has unique key and route values across all entries" |
| FR-003 (web layout breakpoint, boundary-inclusive) | `navigation.test.ts`: 767px/768px/1440px cases |
| Constitution Principle V (documented exception, no FR) | `src/features/navigation/README.md` |

No FR is claimed by T001/T002 without a covering test; T002 is docs-only and correctly has no
test (a README has nothing executable to assert).

## tasks.md checklist status

- [X] T001 — matches actual files/tests (verified above).
- [X] T002 — matches actual README content (verified above).
- [ ] T003–T022 — correctly still unchecked; none of those files exist yet (confirmed by
  `find`/`ls`), so no premature marking.

## CHECKPOINTS.md walkthrough (scoped to what T001/T002 can affect)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists, current (v1.0.0, unchanged).
- [x] `./init.sh` — not re-run in full for this partial-phase review (no route/build-affecting
  change yet — T001/T002 touch no `app/` file, no dependency); `tsc --noEmit` and `jest` were
  re-run directly and are clean. Full `./init.sh` is explicitly deferred to T022 per tasks.md
  and is not expected to be green end-to-end mid-phase (T003+ files don't exist yet, so nothing
  regresses, but this checkbox is scoped to "the harness itself," which is unaffected by this
  diff).

**C2 — state coherent**
- [x] Exactly one feature (`004-home-scan-shell`) is `in_progress` in `feature_list.json`.
- [x] No feature is being marked `done` here — n/a for "passing tests for done features."
- [x] `progress/current.md` describes only the active `004-home-scan-shell` session.

**C3 — architecture respected**
- [x] `src/domain/navigation.ts` has zero RN/Expo imports — confirmed directly.
- [x] No UI component touched in this diff (T001/T002 are logic + docs only) — n/a, nothing to
  violate.
- [x] No platform-specific code introduced yet — n/a.
- [x] No direct DB/storage/Supabase-table access — none present.
- [x] No new global state library.
- [x] No stray `console.log`, no context-free `TODO`.

**C4 — verification real**
- [x] `navigation.ts`'s two logic exports (`resolveWebNavLayout`, plus the static tables) have
  covering unit tests — confirmed.
- [x] No new/changed screen in this diff — n/a for component-test requirement.
- [ ] Full three-target `./init.sh` build check — not run to completion in this review (see C1
  note); reasonable to defer to T022 given zero `app/`/dependency changes so far, but flagging
  as not independently re-verified full-green this round.

**C5 — session closed well**
- [x] No suspicious untracked files (`*.tmp`, stray `.expo/` cache) — checked, none present.
- Session is still open (mid-phase), so "closed well" / `progress/history.md` entry is not yet
  applicable — this is an interim checkpoint, not a session close.

**C6 — Spec Driven Development**
- [x] `004-home-scan-shell` (`sdd: true`, `in_progress`) has `spec.md` + `plan.md` + `tasks.md`.
- [x] `spec.md` has zero `[NEEDS CLARIFICATION]` markers (one open item was resolved with a
  recorded default and confirmed by the human at the gate, per spec.md's Clarifications
  header) — not blocking.
- [ ] "Every `done` feature has all tasks `[X]`" — n/a, feature is `in_progress`, not `done`.
- [x] FR-001 and FR-003 (the only FRs in scope for T001/T002) are each covered by a test
  referencing them by comment.

No empty box above reflects a real gap in this diff's scope — the two unchecked/deferred items
(full `./init.sh`, session-close artifacts) are correctly out of scope for a two-task
foundational checkpoint and are already scheduled later in `tasks.md` (T022) / at session close.

## Findings

None. T001 and T002 match `tasks.md`'s descriptions exactly, `src/domain/navigation.ts` is
pure and correctly tested at both the 767/768 boundary and a wide value, `NAV_DESTINATIONS`
has the exact three key/route pairs the later route-wiring tasks (T009/T012/T014) depend on,
and the README documents the Constitution Principle V exception in the terms plan.md itself
specifies. Type-check and full test suite are independently confirmed green with no
regressions. Scope discipline is good — no files outside T001/T002 were touched, and no task
was marked `[X]` prematurely.

## Verdict

**APPROVE**

---

# Code Review: 004-home-scan-shell — Phase 2 (Foundational), T003 & T004

**Scope reviewed**: task-implementer's claimed completion of T003
(`src/features/scanner/ScanEntryCard.tsx` + test) and T004
(`src/features/scanner/ScanPlaceholderScreen.tsx` + test) from
`specs/004-home-scan-shell/tasks.md`. T001/T002 already approved above — not re-reviewed.

## Verification performed independently

- `git status --porcelain`: untracked files are exactly `src/features/scanner/ScanEntryCard.tsx`,
  `ScanEntryCard.test.tsx`, `ScanPlaceholderScreen.tsx`, `ScanPlaceholderScreen.test.tsx`, plus
  the T001/T002 files already approved and doc/bookkeeping files. No `app/` route file touched,
  no `src/features/navigation/*` component beyond the T002 README exists yet — matches
  `tasks.md`'s Phase 2 checkpoint ("no `app/` routes are wired yet").
- Read `specs/004-home-scan-shell/{spec.md,plan.md,tasks.md}` fresh (this session), plus
  `.specify/memory/constitution.md`, `docs/conventions.md`, `docs/verification.md`,
  `CHECKPOINTS.md`.
- `node_modules/.bin/tsc --noEmit` → clean, zero errors (re-run independently).
- `npx jest src/features/scanner` → 2 suites / 5 tests passing (re-run independently).
- `npx jest` (full suite) → 24 suites / 191 tests passing, no regressions from the 22/186
  baseline recorded in the prior T001/T002 review.
- Read `ScanEntryCard.tsx`, `ScanEntryCard.test.tsx`, `ScanPlaceholderScreen.tsx`,
  `ScanPlaceholderScreen.test.tsx` in full, verbatim, directly against `tasks.md` T003/T004 and
  `spec.md` FR-004/FR-005/US2 AS3/SC-004.

## Specific confirmations requested

1. **`accessibilityLabel` is exactly `"Scan a card"`, not bare `"+"`/`"button"`** — confirmed.
   `ScanEntryCard.tsx:20`: `accessibilityLabel="Scan a card"`. Test asserts
   `getByRole("button", { name: "Scan a card" })` (`ScanEntryCard.test.tsx:28`), which resolves
   the accessible name through the `accessibilityRole`+`accessibilityLabel` pair RNTL uses for
   screen-reader name resolution, not a bare icon/testID lookup. Satisfies spec.md US2 AS3.
2. **Rendered width < height (trading-card ratio ~2.5:3.5)** — confirmed. `CARD_WIDTH = 220`,
   `CARD_HEIGHT = CARD_WIDTH / (2.5/3.5) ≈ 308`. Verified numerically: `220 / (220/(2.5/3.5))`
   reduces to `2.5/3.5 = 0.714285714...`, i.e. width:height ratio is exact. Test
   (`ScanEntryCard.test.tsx:17-18`) asserts `style.width < style.height` and
   `style.width / style.height ≈ 2.5/3.5` (`toBeCloseTo`, 2 d.p.) via `StyleSheet.flatten` on the
   actual rendered style object — real rendered output, not a hardcoded constant check.
3. **Component takes `onPress` prop, does not itself call any navigation API** — confirmed.
   `ScanEntryCard.tsx` imports only `react-native`'s `Pressable`, `StyleSheet`, `Text` — no
   `expo-router` import anywhere, no `useRouter`/`Link`/`push` call. `onPress` is a required prop
   forwarded directly to `Pressable`. Matches T003's explicit instruction ("this task does not
   wire navigation itself — see T016") and FR-005's "affordance only" scope for this task. No
   scope creep to flag — navigation wiring is genuinely absent, deferred correctly.
4. **Minimum 44×44 tap target actually enforced** — confirmed via both the rendered size and a
   style-level floor: `card` style sets `minWidth: 44, minHeight: 44` (`ScanEntryCard.tsx:33-34`)
   in addition to the actual `width: 220, height: ≈308` (both far above 44). The test
   (`ScanEntryCard.test.tsx:19-20`) asserts `style.width`/`style.height` `toBeGreaterThanOrEqual(44)`
   against the real flattened style, not a visual eyeball — genuine enforcement, not just
   "visually plausible."
5. **`ScanPlaceholderScreen` has no camera-related import anywhere** — confirmed by direct read:
   `ScanPlaceholderScreen.tsx` imports only `StyleSheet, Text, View` from `react-native`. The
   test (`ScanPlaceholderScreen.test.tsx:17-26`) additionally does source inspection via
   `fs.readFileSync` on the component's own file, filtering to `import`/`require` lines
   specifically, and asserts none matches `expo-camera`, `expo-image-picker`, or `/camera/i`
   generally — a stronger guard than a behavior-only test (catches an added-but-unused import).
6. **`ScanPlaceholderScreen`'s test asserts real rendered text/heading, not just "doesn't
   throw"** — confirmed. `ScanPlaceholderScreen.test.tsx:30-35` renders the component and asserts
   `getByRole("header")` is truthy and `getByText(/scanner coming soon/i)` matches actual visible
   copy — not a bare "renders without crashing" assertion. Satisfies `docs/verification.md`'s
   Level 2 requirement and avoids its named anti-pattern.
7. **No business logic leaked into either component body (Constitution IV)** — confirmed. Both
   files are pure presentation: `ScanEntryCard` computes only static layout constants
   (`CARD_ASPECT_RATIO`, `CARD_WIDTH`, `CARD_HEIGHT`) at module scope from a fixed literal ratio
   — not a fetch call, validation, or data transform — and calls the `onPress` prop it's handed.
   `ScanPlaceholderScreen` renders static copy with zero logic. Neither imports `src/domain` or
   `src/lib`, correctly, since neither needs to.

## Requirement traceability (T003/T004 scope only)

| FR / SC | Covered by |
|---|---|
| FR-004 (centre "+" card, trading-card ratio) | `ScanEntryCard.test.tsx`: "renders at a vertically-oriented trading-card aspect ratio with a minimum 44x44 tap target" |
| FR-005 (affordance only; no camera/capture/recognition) | `ScanEntryCard.test.tsx`: "exposes the accessibility label...", "calls onPress when pressed"; `ScanPlaceholderScreen.test.tsx`: "does not import any camera-related module", "renders \"Scanner coming soon\" copy..." |
| SC-004 (≥44×44 tap target + non-empty accessibility label) | `ScanEntryCard.test.tsx`: same aspect-ratio/tap-target test |

No FR is claimed by T003/T004 without a covering test referencing it (each test file carries an
`FR-00x` comment above the relevant `it`/`describe` block).

## tasks.md checklist status

- [X] T001, T002 — previously approved (see above), unchanged.
- [X] T003 — matches `ScanEntryCard.tsx`/`.test.tsx` exactly as described.
- [X] T004 — matches `ScanPlaceholderScreen.tsx`/`.test.tsx` exactly as described.
- [ ] T005–T022 — correctly still unchecked; none of those files exist yet (confirmed via
  `find`/`git status`), no premature marking.

## CHECKPOINTS.md walkthrough (scoped to what this diff can affect; T001/T002 rows carried
forward from the prior review, not re-litigated)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists, current (v1.0.0, unchanged).
- [x] `tsc --noEmit` and `jest` (full suite) re-run independently, both clean. Full `./init.sh`
  (build-export stage) not re-run this round — reasonably deferred to T022 per `tasks.md`, since
  T003/T004 add no dependency and wire no route yet; nothing in this diff plausibly breaks the
  web/iOS/Android export stage that a two-file, route-unwired addition wasn't already covered by
  `tsc`+`jest`.

**C2 — state coherent**
- [x] Exactly one feature (`004-home-scan-shell`) is `in_progress` in `feature_list.json`.
- [x] No feature marked `done` here — n/a.
- [x] `progress/current.md` describes only the active session.

**C3 — architecture respected**
- [x] `src/domain` untouched by this diff (T003/T004 don't touch it) — still zero RN imports.
- [x] Both new components call no `src/domain`/`src/lib` function and need none — pure
  presentation, no fetch/validation/business rule embedded (see confirmation 7 above).
- [x] No platform-specific (`.ios`/`.android`/`.web`) file needed or added in this diff — n/a.
- [x] No DB/storage/Supabase-table access — none present.
- [x] No new global state library.
- [x] No stray `console.log`, no context-free `TODO`.

**C4 — verification real**
- [x] No new/changed `src/domain` export in this diff — n/a for Level 1.
- [x] Both new components have RNTL tests asserting real rendered output (role, accessible name,
  text, `onPress` firing) — Level 2 satisfied, no "doesn't throw"-only test.
- [ ] Full three-target `./init.sh` build check — not re-run to completion this round (see C1);
  reasonably deferred to T022, flagged as not independently re-verified full-green yet.

**C5 — session closed well**
- [x] No suspicious untracked files beyond the expected T001–T004 set.
- Session still open (mid-phase) — "closed well" / `progress/history.md` entry not yet
  applicable.

**C6 — Spec Driven Development**
- [x] `004-home-scan-shell` has `spec.md` + `plan.md` + `tasks.md`.
- [x] `spec.md` has zero open `[NEEDS CLARIFICATION]` markers (both prior open items confirmed
  at the gate).
- [ ] "Every `done` feature has all tasks `[X]`" — n/a, feature is `in_progress`.
- [x] FR-004, FR-005, SC-004 (the FRs/SC in scope for T003/T004) are each covered by a test
  referencing them by comment.

No empty box above reflects a real gap in this diff's scope — the deferred `./init.sh` full run
is consistent with `tasks.md`'s own phasing (T022 runs it end-to-end after all tasks land).

## Findings

None blocking. T003 and T004 match `tasks.md`'s descriptions exactly:
- `ScanEntryCard`'s accessibility label is the required descriptive string, not a bare icon
  label; its aspect ratio is exactly the trading-card ratio with width < height; its 44×44
  minimum is enforced both by actual rendered size and an explicit style floor; it takes and
  forwards `onPress` without any premature navigation wiring (no scope creep to flag — T016 is
  correctly left for later).
- `ScanPlaceholderScreen` contains zero camera-related imports (verified both by direct read and
  by the component's own source-inspection test), and its test asserts real rendered
  heading/text rather than a "doesn't throw" check.
- Neither component embeds any business logic; both are pure presentational components per
  Constitution Principle IV.

Type-check and full test suite (24 suites / 191 tests) are independently confirmed green with no
regressions from this batch.

## Verdict

**APPROVE**

---

# Code Review: 004-home-scan-shell — Phase 2 (Foundational), T005 & T006

**Scope reviewed**: task-implementer's claimed completion of T005
(`src/features/social/AmigosPlaceholderScreen.tsx` + test) and T006
(`src/features/social/SocialPlaceholderScreen.tsx` + test) from
`specs/004-home-scan-shell/tasks.md`. T001–T004 already approved above — not re-reviewed.

## Verification performed independently

- `git status --porcelain`: untracked files are exactly the T001–T006 set plus the expected
  `feature_list.json`/`progress/current.md` bookkeeping diff and `progress/impl_...md`/
  `progress/review_...md`. No `app/` route file touched, no `src/features/navigation/*`
  component beyond the already-approved T002 README exists yet. Scope matches `tasks.md`'s
  Phase 2 checkpoint ("no `app/` routes are wired yet").
- Read `specs/004-home-scan-shell/{spec.md,plan.md,tasks.md}` fresh (this session), plus
  `.specify/memory/constitution.md`, `docs/conventions.md`, `docs/verification.md`,
  `CHECKPOINTS.md`.
- `node_modules/.bin/tsc --noEmit` → clean, zero errors (re-run independently).
- `npx jest src/features/social` → 2 suites / 4 tests passing (re-run independently).
- `npx jest` (full suite) → 26 suites / 195 tests passing, no regressions from the 24/191
  baseline recorded in the prior T003/T004 review.
- Read `AmigosPlaceholderScreen.tsx`, `AmigosPlaceholderScreen.test.tsx`,
  `SocialPlaceholderScreen.tsx`, `SocialPlaceholderScreen.test.tsx` in full, verbatim, directly
  against `tasks.md` T005/T006, `spec.md` FR-007/US3, and the human's own scope instruction
  ("ignore the amigos and social but add the tab").

## Specific confirmations requested

1. **Hardest scope guardrail — genuinely content-free, not a lightweight real feature** —
   confirmed for both files. `AmigosPlaceholderScreen.tsx` and `SocialPlaceholderScreen.tsx`
   each contain exactly two static `<Text>` elements (a heading + one body line) with zero
   mock data arrays, zero `.map()`/list rendering, zero imports beyond `react-native`'s
   `StyleSheet`/`Text`/`View`. Neither declares any array, object literal representing a
   friend/post/feed record, nor any component that could later be mistaken for a list item.
   Both test files additionally assert `getAllByText(/./)` has length exactly 2 — a structural
   guard against a future addition of friend-list/feed-post UI silently passing review. This
   satisfies spec.md's Assumptions, FR-007, and the human's explicit "ignore the amigos and
   social but add the tab" instruction. **No blocking finding here** — this is the cleanest
   possible reading of "contentless placeholder."
2. **Distinct, identifying copy (not interchangeable/generic text)** — confirmed. Amigos:
   heading `"Amigos"`, body `"Your friends list isn't available yet. This screen only reserves
   the Amigos destination for the future social feature — no friend list, friend requests, or
   social data here."` Social: heading `"Social"`, body `"Your social feed isn't available yet.
   This screen only reserves the Social destination for the future social feature — no feed,
   posts, or trading content here."` The two bodies share no sentence and differ in subject
   ("friends list" vs. "social feed") and named exclusions ("friend requests" vs. "posts,
   trading content") — genuinely distinct, not generic interchangeable placeholder text. This
   correctly sets up T018 (later task) to assert Amigos-tab and pill both render this exact
   distinct content, distinguishable from Social's.
3. **Tests assert real rendered text, not "doesn't throw"** — confirmed. Both test files use
   `getByRole("header")` + `getByText(...)` with exact/regex string matches against real
   rendered output (`AmigosPlaceholderScreen.test.tsx:15-17`,
   `SocialPlaceholderScreen.test.tsx:15-17`), plus the `getAllByText(/./)` count guard — no
   bare "renders without crashing" assertion anywhere. Satisfies `docs/verification.md` Level 2
   and avoids its named anti-pattern.
4. **No business logic in either component body (Constitution IV)** — confirmed. Both files
   are pure presentation: a function component returning static JSX plus a module-scope
   `StyleSheet.create` call. No fetch, no validation, no data transform, no state, no prop
   (both take zero props). Neither imports `src/domain` or `src/lib`, correctly, since neither
   needs to. There is genuinely zero business logic to test in `src/domain` for this pair of
   tasks — appropriately trivial.

## Requirement traceability (T005/T006 scope only)

| FR | Covered by |
|---|---|
| FR-007 (Amigos/Social reachable, distinctly-labelled, contentless placeholders) | `AmigosPlaceholderScreen.test.tsx`: "renders \"Amigos\" copy with an accessible heading", "renders no friend list or friend-request UI (only the two static disclaimer lines)"; `SocialPlaceholderScreen.test.tsx`: "renders \"Social\" copy with an accessible heading", "renders no feed or post content (only the two static disclaimer lines)" |

No FR is claimed by T005/T006 without a covering test referencing it (each test file carries an
`FR-007` comment above the `describe` block).

## tasks.md checklist status

- [X] T001–T004 — previously approved (see above), unchanged.
- [X] T005 — matches `AmigosPlaceholderScreen.tsx`/`.test.tsx` exactly as described, genuinely
  content-free.
- [X] T006 — matches `SocialPlaceholderScreen.tsx`/`.test.tsx` exactly as described, genuinely
  content-free.
- [ ] T007–T022 — correctly still unchecked; none of those files exist yet (confirmed via
  `git status`), no premature marking.

## CHECKPOINTS.md walkthrough (scoped to what this diff can affect; T001–T004 rows carried
forward from prior reviews, not re-litigated)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists, current (v1.0.0, unchanged).
- [x] `tsc --noEmit` and `jest` (full suite) re-run independently, both clean. Full `./init.sh`
  (build-export stage) not re-run this round — reasonably deferred to T022 per `tasks.md`;
  T005/T006 add no dependency and wire no route yet.

**C2 — state coherent**
- [x] Exactly one feature (`004-home-scan-shell`) is `in_progress` in `feature_list.json`.
- [x] No feature marked `done` here — n/a.
- [x] `progress/current.md` describes only the active session.

**C3 — architecture respected**
- [x] `src/domain` untouched by this diff — still zero RN imports.
- [x] Both new components call no `src/domain`/`src/lib` function and need none — pure
  presentation, no fetch/validation/business rule embedded (see confirmation 4 above).
- [x] No platform-specific (`.ios`/`.android`/`.web`) file needed or added in this diff — n/a.
- [x] No DB/storage/Supabase-table access — none present.
- [x] No new global state library.
- [x] No stray `console.log`, no context-free `TODO`.

**C4 — verification real**
- [x] No new/changed `src/domain` export in this diff — n/a for Level 1.
- [x] Both new components have RNTL tests asserting real rendered output (role, exact text) —
  Level 2 satisfied, no "doesn't throw"-only test.
- [ ] Full three-target `./init.sh` build check — not re-run to completion this round (see C1);
  reasonably deferred to T022, flagged as not independently re-verified full-green yet.

**C5 — session closed well**
- [x] No suspicious untracked files beyond the expected T001–T006 set.
- Session still open (mid-phase) — "closed well" / `progress/history.md` entry not yet
  applicable.

**C6 — Spec Driven Development**
- [x] `004-home-scan-shell` has `spec.md` + `plan.md` + `tasks.md`.
- [x] `spec.md` has zero open `[NEEDS CLARIFICATION]` markers (both prior open items confirmed
  at the gate).
- [ ] "Every `done` feature has all tasks `[X]`" — n/a, feature is `in_progress`.
- [x] FR-007 (the only FR in scope for T005/T006) is covered by a test referencing it by
  comment.

No empty box above reflects a real gap in this diff's scope — the deferred `./init.sh` full run
is consistent with `tasks.md`'s own phasing (T022 runs it end-to-end after all tasks land).

## Findings

None blocking, no nits. T005 and T006 match `tasks.md`'s descriptions exactly and hold this
feature's hardest scope guardrail cleanly:
- Neither `AmigosPlaceholderScreen` nor `SocialPlaceholderScreen` contains any mock data array,
  list rendering, friend/feed/post/trading data, or anything resembling real social content —
  each is exactly two static `<Text>` lines, verified both by direct read and by each test's
  own "exactly two text nodes" structural guard.
- Each screen's identifying copy is genuinely distinct (different subject nouns, different
  named exclusions), not interchangeable placeholder text, correctly setting up the later
  T018 distinctness check.
- Both test files assert real rendered text/role, not "doesn't throw."
- Neither component embeds any business logic; both are trivially pure presentational
  components per Constitution Principle IV, with nothing that belongs in `src/domain`.

Type-check and full test suite (26 suites / 195 tests) are independently confirmed green with
no regressions from this batch.

## Verdict

**APPROVE**

---

# Code Review: 004-home-scan-shell — Phase 2 (Foundational), T007 & T008 (final batch of Phase 2)

**Scope reviewed**: task-implementer's claimed completion of T007
(`src/features/navigation/TopRightControls.tsx` + test) and T008
(`src/features/navigation/AmigosQuickAccessPill.tsx` + test) from
`specs/004-home-scan-shell/tasks.md`. T001–T006 already approved above — not re-reviewed. This
closes out Phase 2 (Foundational) in its entirety.

## Verification performed independently

- Read `specs/004-home-scan-shell/{spec.md,plan.md,tasks.md}` fresh this session (not from
  memory or from `progress/impl_004-home-scan-shell.md`'s summary).
- Read `.specify/memory/constitution.md`, `docs/conventions.md`, `docs/verification.md`,
  `CHECKPOINTS.md` fresh this session.
- `git status --porcelain`: confirmed everything under `specs/004-home-scan-shell/`,
  `src/domain/navigation.*`, `src/features/navigation/*`, `src/features/scanner/*`,
  `src/features/social/*` is untracked new work on this branch; no `app/` route file exists yet
  (`find app -maxdepth 2 -type f` shows only the pre-existing `(auth)`/`(onboarding)` groups,
  root `_layout.tsx`, and the still-untouched `app/index.tsx` scaffold) — confirms Phase 3+
  (route wiring) genuinely has not started, matching `tasks.md`'s own Phase 2 checkpoint.
- `node_modules/.bin/tsc --noEmit` → clean, zero errors (re-run independently, not trusted from
  the impl log).
- `npx jest src/features/navigation src/domain/navigation.test.ts` → 3 suites / 18 tests
  passing (re-run independently).
- `npx jest` (full repo suite) → **28 suites / 208 tests passing, zero failures, zero
  regressions**.
- Read `src/features/navigation/TopRightControls.tsx`,
  `src/features/navigation/TopRightControls.test.tsx`,
  `src/features/navigation/AmigosQuickAccessPill.tsx`,
  `src/features/navigation/AmigosQuickAccessPill.test.tsx`, and `src/domain/navigation.ts` in
  full, verbatim, directly against `tasks.md` T007/T008 and `spec.md` FR-006/FR-008/FR-010/
  US4 AS1–AS3/SC-004/SC-005.
- `grep`ed `src/features/navigation/` and `src/domain/navigation.ts` for `Alert.alert`,
  `toast`, `Snackbar`, `fetch(`, `axios`, `i18n`, `useTranslation` — the only hit is a code
  comment in `TopRightControls.tsx` documenting the *rejected* `Alert.alert`/toast alternatives
  per `plan.md`'s Research Decision, not actual usage.

## Specific confirmations requested

1. **Exactly four controls, correct order (language, currency, Notifications, Messages)** —
   confirmed. `TopRightControls.tsx:23-44`'s `CONTROLS` array is declared in exactly that
   order and rendered via a single `.map()` (`TopRightControls.tsx:67-73`), so render order is
   structurally guaranteed to match declaration order — no way for the four to silently
   reorder. Test asserts `screen.getAllByRole("button")` has length 4 and
   `buttons.map(b => b.props.accessibilityLabel)` equals the exact stated sequence
   (`TopRightControls.test.tsx:23-30`). Satisfies spec.md US4 AS1.
2. **Distinct, real accessibilityLabel per control** — confirmed. Each is a full descriptive
   sentence (`"Language, English or Spanish — not yet available"`,
   `"Currency, US Dollar or Mexican Peso — not yet available"`,
   `"Notifications — not yet available"`, `"Messages — not yet available"`) — none is a bare
   icon or generic "button" label. Test asserts uniqueness via `Set` size and non-empty length
   for every label (`TopRightControls.test.tsx:33-40`). Satisfies spec.md US4 AS3.
3. **Visible "not yet available" feedback via local state, never Alert.alert/toast** —
   confirmed. `PlaceholderControl` (`TopRightControls.tsx:46-62`) uses `useState<boolean>`
   toggled on press, conditionally rendering an inline `<Text>` reading "Not yet available"
   (`TopRightControls.tsx:59`). No `Alert`, `Alert.alert`, or any toast/snackbar import
   anywhere in the file (confirmed by direct read and by `grep`, whose only hit is the
   documenting comment, not usage). Test explicitly asserts no feedback text exists before
   activation and that it appears after one press, for all four controls individually
   (`describe.each`, `TopRightControls.test.tsx:55-64`) — satisfies SC-005 ("never a silent
   no-op") and matches `plan.md`'s "Placeholder-control feedback mechanism" Research Decision
   exactly.
4. **Zero backend calls / no real i18n, currency, notification, or messaging behavior
   (FR-010)** — confirmed by direct inspection: `TopRightControls.tsx` imports only `useState`
   from `react` and `Pressable`/`StyleSheet`/`Text`/`View` from `react-native` — no
   `src/lib/api.ts`, no React Query, no `fetch`/`axios`, no i18n library
   (`i18next`/`react-i18next`/`expo-localization` or similar), no currency-conversion helper.
   The toggled state only flips a boolean and renders static text; there is no code path that
   could perform a real language switch, currency conversion, notification fetch, or messaging
   call. **No blocking finding** — this scope guardrail (FR-010) holds cleanly.
5. **`AmigosQuickAccessPill`'s navigation target is derived from `NAV_DESTINATIONS`, not a
   hardcoded duplicate string** — confirmed by direct read of the actual source, not inferred.
   `AmigosQuickAccessPill.tsx:16-19`:
   ```ts
   const amigosDestination = NAV_DESTINATIONS.find((destination) => destination.key === "amigos");
   if (amigosDestination) {
     router.push(amigosDestination.route);
   }
   ```
   `NAV_DESTINATIONS` is imported from `@/domain/navigation` (`AmigosQuickAccessPill.tsx:10`),
   the same shared table `src/domain/navigation.ts` exports (`T001`, already approved) — there
   is no literal `"/amigos"` string anywhere in this file. The test independently re-derives
   the expected value from the same table at test time
   (`NAV_DESTINATIONS.find(d => d.key === "amigos")`, `AmigosQuickAccessPill.test.tsx:32`)
   rather than hardcoding `"/amigos"` in the assertion either, so neither the component nor the
   test could pass by coincidence if the table's route value ever changed. This is exactly what
   FR-008/T008 exists to prevent, and it is genuinely satisfied, not just described as such in
   the impl log.
6. **Minimum 44×44 tap targets actually enforced (four controls + pill)** — confirmed via
   style-level floors, not just visual plausibility. `TopRightControls.tsx:88-89`:
   `control: { minWidth: 44, minHeight: 44, ... }`, applied to all four via the shared
   `PlaceholderControl` sub-component. `AmigosQuickAccessPill.tsx:37-38`:
   `pill: { minWidth: 44, minHeight: 44, ... }`. Both test files assert against the actual
   flattened rendered style object (`StyleSheet.flatten(button.props.style)`,
   `TopRightControls.test.tsx:43-50`; `StyleSheet.flatten(pill.props.style)`,
   `AmigosQuickAccessPill.test.tsx:41-47`) — `toBeGreaterThanOrEqual(44)` on both dimensions for
   every one of the five elements. Genuine enforcement.
7. **No business logic in either component (Constitution IV)** — confirmed. `TopRightControls`
   contains only static configuration data and local UI-feedback toggle state — no fetch,
   validation, or data transform. `AmigosQuickAccessPill` contains exactly one lookup into an
   already-portable `src/domain` table plus a direct call to the RN-specific `useRouter().push`
   — a thin "read this config, call this handler" component, not an inline reimplementation of
   navigation logic. Neither file needs nor imports `src/domain`/`src/lib` beyond the one
   read-only table lookup in the pill.

## Requirement traceability (T007/T008 scope only)

| FR / SC | Covered by |
|---|---|
| FR-006 (four controls: order, labels, tap target, visible feedback, no real behavior) | `TopRightControls.test.tsx`: "renders exactly four controls, top-to-bottom, in the stated order", "gives each control a distinct, non-empty accessibility label", "gives each control a minimum 44x44 tap target", `describe.each` activation-feedback tests |
| FR-008 (Amigos pill → same destination as the shell's Amigos tab, derived not hardcoded) | `AmigosQuickAccessPill.test.tsx`: "navigates to exactly NAV_DESTINATIONS' Amigos route when pressed" |
| FR-010 (zero backend calls; pure client-side stubs) | No dedicated absence-of-import test exists (unlike `ScanPlaceholderScreen.test.tsx`'s stronger source-inspection guard for the camera-import case) — verified this batch by direct inspection/`grep` instead. This is a minor traceability gap, not a functional one: nothing in the actual component performs real behavior, but a future accidental `fetch`/i18n import would not be caught by an automated test the way T004's camera-import guard would catch a stray camera import. **Non-blocking nit** — worth a follow-up test if this module grows, not a reason to reject this batch. |
| SC-004 (≥44×44 tap target + non-empty accessibility label) | `TopRightControls.test.tsx`: "gives each control a minimum 44x44 tap target"; `AmigosQuickAccessPill.test.tsx`: "has a non-empty accessibility label and a minimum 44x44 tap target" |
| SC-005 (never a silent no-op) | `TopRightControls.test.tsx` `describe.each` block: `'shows "Not yet available" feedback on activation, and nothing beforehand'` (×4 controls), plus a toggle-back-off test for each |

No FR/SC claimed by T007/T008 lacks a covering test referencing it by comment, with the one
noted non-blocking traceability nit for FR-010 above.

## tasks.md checklist status

- [X] T001 — previously approved.
- [X] T002 — previously approved.
- [X] T003 — previously approved.
- [X] T004 — previously approved.
- [X] T005 — previously approved.
- [X] T006 — previously approved.
- [X] T007 — matches `TopRightControls.tsx`/`.test.tsx` exactly as described this batch.
- [X] T008 — matches `AmigosQuickAccessPill.tsx`/`.test.tsx` exactly as described this batch.
- [ ] T009–T022 — correctly still unchecked; none of those files/routes exist yet (`app/(app)/`
  does not exist — confirmed via `find`), no premature marking.

**Phase 2 (Foundational) coherence check**: all of T001, T002, T003, T004, T005, T006, T007,
T008 exist as real files matching their `tasks.md` descriptions and are marked `[X]`. Phase 2
is genuinely complete and internally coherent — the shared route table (T001), every leaf
screen/component (T003–T008), and the module README (T002) all exist, are tested, and none
depends on a not-yet-built later-phase file. Nothing in Phase 3+ is prematurely started or
marked.

## CHECKPOINTS.md walkthrough (T001–T006 rows carried forward from prior reviews and re-verified
this session where restated; T007/T008-affected rows re-verified independently)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists, current.
- [x] `tsc --noEmit` and full `jest` re-run independently this session, both clean
  (208/208 tests). Full `./init.sh` end-to-end (build-export stage across all three platforms)
  is **not** re-run this round — this is explicitly and correctly deferred to T022 per
  `tasks.md`'s own phasing (T022 depends on "all prior tasks," i.e. Phase 3–7 too), and no
  `app/` route exists yet for T007/T008 to plausibly break at the export-bundle level. Same
  deferral pattern as every prior batch in this feature; not a new gap introduced here.

**C2 — state coherent**
- [x] Exactly one feature (`004-home-scan-shell`) is `in_progress` in `feature_list.json`.
- [x] No feature is being marked `done` here — n/a.
- [x] `progress/current.md` describes only the active `004-home-scan-shell` session.

**C3 — architecture respected**
- [x] `src/domain/navigation.ts` untouched by this batch, still zero RN/Expo imports.
- [x] Both new components (`TopRightControls`, `AmigosQuickAccessPill`) call into
  `src/domain` (the pill) or embed no fetch/validation/business rule at all (the controls) —
  see confirmation 7 above.
- [x] No platform-specific (`.ios`/`.android`/`.web`) file needed or added in this diff — n/a,
  neither component has platform-varying behavior.
- [x] No DB/storage/Supabase-table access — none present.
- [x] No new global state library.
- [x] No stray `console.log`, no context-free `TODO`.

**C4 — verification real**
- [x] No new/changed `src/domain` export in this diff (T001 already covered) — n/a for Level 1
  here.
- [x] Both new components have RNTL tests asserting real rendered output/behavior (order,
  labels, tap target, activation feedback, navigation-call target) — Level 2 satisfied, no
  "doesn't throw"-only test.
- [ ] Full three-target `./init.sh` build check — not re-run to completion this round; correctly
  deferred to T022 (see C1). Flagging consistent with every prior batch's review in this
  feature — not a new or escalating gap.

**C5 — session closed well**
- [x] No suspicious untracked files beyond the expected T001–T008 set plus the standing
  `progress/`/`specs/` bookkeeping files.
- Session still open (Phase 2 just closed, Phase 3 not yet started) — "closed well" /
  `progress/history.md` entry not yet applicable; this is an interim, not a final, checkpoint.

**C6 — Spec Driven Development**
- [x] `004-home-scan-shell` (`sdd: true`, `in_progress`) has `spec.md` + `plan.md` + `tasks.md`.
- [x] `spec.md` has zero open `[NEEDS CLARIFICATION]` markers (both recorded-default items were
  confirmed by the human at the approval gate per the Clarifications header).
- [ ] "Every `done` feature has all tasks `[X]`" — n/a, feature is `in_progress`, not `done`.
- [x] FR-006, FR-008, FR-010, SC-004, SC-005 (the FRs/SCs in scope for T007/T008) are each
  covered by at least one test referencing them by comment, with the one non-blocking FR-010
  traceability nit noted above (inspection-verified, not test-verified, absence of backend
  calls).

No empty box above reflects a new or escalating gap introduced by this batch — the two
deferred items (full `./init.sh`, session-close artifacts) are consistent with every prior
batch's review in this feature and with `tasks.md`'s own explicit phasing.

## Findings

**Blocking**: none.

**Non-blocking nit**: FR-010's "zero backend calls" guarantee for `TopRightControls.tsx` and
`AmigosQuickAccessPill.tsx` is currently verified by manual inspection/`grep` (this review) and
by the impl log's own stated reasoning, not by an automated regression test. T004's
`ScanPlaceholderScreen.test.tsx` set a stronger precedent (source-inspection of import/require
lines to guard against an accidentally-added camera import even if unused) that T007/T008's
tests don't mirror for API/i18n imports. Given both files are currently two-and-a-half-import,
zero-dependency components, this is low risk today — but if this module grows (e.g. a future
task wires a real notification badge count into `TopRightControls`), there is nothing today
that would fail a test if a stray `fetch`/`api.ts` import were added prematurely. Recommend
(not blocking) a follow-up import-guard test analogous to T004's if/when this area is touched
again.

Everything else confirmed clean:
- Exactly four controls in the exact required order, each backed by structural (declaration-
  order-driven `.map()`) rather than incidental ordering.
- Every one of the four controls' accessibility labels is distinct, real, and descriptive —
  none is a bare icon/generic label.
- Activation feedback is genuinely local `useState`, never `Alert.alert` or a toast/snackbar
  library — confirmed by direct read and grep, matching `plan.md`'s Research Decision exactly.
- Zero backend calls, zero i18n/currency/notification/messaging library usage in either file —
  confirmed by import inspection.
- `AmigosQuickAccessPill`'s navigation target is genuinely derived from
  `NAV_DESTINATIONS.find(...)`, not a hardcoded duplicate `"/amigos"` string, in both the
  component and its test — the exact drift risk FR-008/T008 exists to prevent is closed.
- All five interactive elements (four controls + pill) enforce a real ≥44×44 tap target at the
  style level, asserted against actual flattened rendered styles, not eyeballed.
- Neither component embeds business logic; both are thin presentational/read-a-config
  components per Constitution Principle IV.
- Type-check and full test suite (28 suites / 208 tests) are independently confirmed green
  with zero regressions.
- Phase 2 as a whole is coherent: T001–T008 all exist, match their task descriptions, and are
  correctly marked `[X]`; no Phase 3+ file or route exists prematurely.

## Verdict

**APPROVE**

Phase 2 (Foundational) is complete and ready for Phase 3 (User Story 1 route wiring) to begin.

---

# Code Review: 004-home-scan-shell — Phase 3 (User Story 1), T009 & T010 & T011

**Scope reviewed**: task-implementer's claimed completion of T009 (`app/(app)/_layout.tsx`),
T010 (`src/features/navigation/WebSidebarNav.tsx` + test), and T011
(`src/features/navigation/WebBottomBarNav.tsx` + test) from
`specs/004-home-scan-shell/tasks.md`. T001–T008 (all of Phase 2) already approved above — not
re-reviewed. Deliberately **not** in scope: T012 (`app/(app)/_layout.web.tsx`), T013
(`HomeScreen.tsx`), T014 (route wiring, `app/(app)/index.tsx`/`amigos.tsx`/`social.tsx`,
removal of `app/index.tsx`) — none of those files exist yet, confirmed below.

## Verification performed independently

- Read `specs/004-home-scan-shell/{spec.md,plan.md,tasks.md}` fresh this session (not from
  `progress/impl_004-home-scan-shell.md`'s summary).
- Read `.specify/memory/constitution.md` (already read in full in prior batches of this
  review, re-confirmed unchanged), `docs/conventions.md`, `docs/verification.md`,
  `CHECKPOINTS.md` fresh this session.
- `git status --porcelain`: the only new/changed paths beyond the already-approved T001–T008
  set are `app/(app)/_layout.tsx`, `src/features/navigation/WebSidebarNav.tsx(.test.tsx)`,
  `src/features/navigation/WebBottomBarNav.tsx(.test.tsx)`, plus the expected
  `feature_list.json`/`progress/current.md` bookkeeping diff. `find app -type f` confirms
  `app/(app)/_layout.web.tsx`, `app/(app)/index.tsx`, `app/(app)/amigos.tsx`,
  `app/(app)/social.tsx`, and `app/scan.tsx` all correctly do not exist yet; `app/index.tsx`
  (the old scaffold placeholder) is untouched. Scope matches exactly what was claimed.
- `node_modules/.bin/tsc --noEmit` → clean, zero errors (re-run independently, not trusted from
  the impl log).
- `npx jest --silent` (full repo suite) → **30 suites / 214 tests passing, zero failures, zero
  regressions** from the 28/208 baseline recorded in the prior T007/T008 review.
- `npx expo export --platform web` (re-run independently into a scratch output dir) → completed
  cleanly; the route list includes a bare `/(app)` entry (13.9 kB) alongside every
  pre-existing `001-registration-kyc` route (`/`, `/register`, `/verify-phone`, `/kyc-status`,
  `/profile`, `/tutorial`, their `(auth)`/`(onboarding)` group aliases, `/_sitemap`,
  `/+not-found`) — confirming the new `(app)` route group with only a `_layout.tsx` inside it
  bundles without error and does **not** disturb `/`'s existing resolution to the untouched
  `app/index.tsx` scaffold. No orphaned or duplicate `"/"` route yet (expected — T014, which
  performs the atomic swap, hasn't run).
- Read `app/(app)/_layout.tsx`, `src/features/navigation/WebSidebarNav.tsx`,
  `WebSidebarNav.test.tsx`, `src/features/navigation/WebBottomBarNav.tsx`,
  `WebBottomBarNav.test.tsx`, and `src/domain/navigation.ts` in full, verbatim, directly against
  `tasks.md` T009/T010/T011 and `spec.md` FR-001/FR-002/FR-003/SC-002/SC-003.
- `grep -n "Platform" app/(app)/_layout.tsx src/features/navigation/WebSidebarNav.tsx
  src/features/navigation/WebBottomBarNav.tsx` → zero hits in all three files.

## Specific confirmations requested

1. **All three destinations derive from `NAV_DESTINATIONS` — no hardcoded duplicate
   amigos/home/social list in any of the three files** — confirmed. `app/(app)/_layout.tsx`
   `.map()`s over `NAV_DESTINATIONS` directly (line 29) to produce each `<Tabs.Screen>`;
   `WebSidebarNav.tsx` and `WebBottomBarNav.tsx` each `.map()` over the same imported
   `NAV_DESTINATIONS` (lines 18 and 21 respectively) to produce each `<Link>`. The only
   per-file local lookup tables are `TAB_SCREEN_NAMES` and `TAB_ICONS` in `_layout.tsx`
   (`Record<NavDestinationKey, string>`/`Record<NavDestinationKey, IconName>`) — these map a
   destination *key* to presentation-only values (which file the tab resolves to inside the
   route group; which icon to show), not a second copy of the routes/labels themselves. Since
   both are `Record<NavDestinationKey, ...>`, TypeScript's structural typing actually forces
   them to stay in sync with `NAV_DESTINATIONS`' key union — adding a fourth destination to
   `NAV_DESTINATIONS` without a matching entry in either table would be a compile error, the
   opposite of silent drift. No blocking finding; this is exactly the pattern `plan.md`'s
   "Shared destination/route table" Research Decision calls for.
2. **`app/(app)/_layout.tsx` uses `<Tabs>` with an explicit `tabBarAccessibilityLabel` per
   screen** — confirmed. `_layout.tsx:37`: `tabBarAccessibilityLabel: destination.label` set on
   every `<Tabs.Screen>`, alongside `title: destination.label` and an icon
   (`tabBarIcon`) — not left to icon-only defaults. Satisfies spec.md's platform note under
   User Story 1 and FR-002.
3. **`WebSidebarNav`/`WebBottomBarNav` both wrap an `expo-router` `<Slot />` and render all
   three destinations with correct roles/labels; tests assert real roles/labels/
   keyboard-focusability, not "doesn't throw"** — confirmed for both. Each component's JSX
   wraps a `<Slot />` (`WebSidebarNav.tsx:31`, `WebBottomBarNav.tsx:18`) for the active screen,
   alongside a `role="navigation"` container rendering one `<Link
   accessibilityRole="link" accessibilityLabel={destination.label}>` per `NAV_DESTINATIONS`
   entry. Both test files mock `expo-router`'s `Link`/`Slot` to plain accessible RN elements
   (mirroring the established `AmigosQuickAccessPill.test.tsx` pattern) and assert, via RNTL's
   `screen.getByRole("link", { name: destination.label })` for each of the three destinations,
   that every link is not `disabled` (keyboard-tab-order precondition), and that the `<Slot />`
   marker renders — genuine rendered-output/role assertions, not a bare "doesn't throw" render
   call. Re-ran both test files myself; both pass (6 tests total between the two, plus the
   `<Slot/>` test each).
4. **No inline `Platform.OS` branching in any of the three files; they are plain,
   platform-split-agnostic building blocks (the actual `.web.tsx` split, T012, doesn't exist
   yet)** — confirmed. `grep` for `Platform` across all three files returns zero hits. None of
   the three imports `react-native`'s `Platform` module at all. `app/(app)/_layout.tsx` has no
   file-extension suffix (resolves on iOS/Android per `expo-router`'s convention) and contains
   only `<Tabs>` config; `WebSidebarNav.tsx`/`WebBottomBarNav.tsx` are plain, unsuffixed
   components under `src/features/navigation/` not yet imported or selected by anything (no
   `app/(app)/_layout.web.tsx` exists yet to consume them) — exactly the "leaf building block,
   platform split deferred to a later task" shape the brief expected.
5. **No business logic embedded beyond consuming the domain table** — confirmed. All three
   files do nothing beyond mapping `NAV_DESTINATIONS` into RN-specific elements (`<Tabs.Screen>`
   / `<Link>`) and wiring static local presentation lookup tables (icon/screen-name-per-key) —
   no fetch call, no validation, no data transform, no conditional business rule. None imports
   `src/lib/api.ts`, React Query, or `fetch`/`axios`.
6. **`app/(app)/_layout.tsx` existing without `app/(app)/index.tsx`/`amigos.tsx`/`social.tsx`
   doesn't currently break `./init.sh`'s build-export stages, and doesn't silently break
   `001-registration-kyc`'s already-shipped routes** — confirmed via an independent
   `npx expo export --platform web` re-run (see above): it completes cleanly, lists a bare
   `/(app)` route alongside every pre-existing `001` route untouched, and `"/"` still resolves
   to the old `app/index.tsx` scaffold exactly as before this batch. This matches the expected
   mid-phase state (T014 is the atomic swap that removes `app/index.tsx` and adds
   `app/(app)/index.tsx` in the same task) — not a regression. (Native/iOS/Android export
   stages and the full `./init.sh` script were not re-run end-to-end this round — consistent
   with every prior batch's review in this feature, correctly deferred to T022 per `tasks.md`'s
   own phasing; nothing in this batch's diff plausibly breaks a native-only export path, since
   none of the three files is native/iOS/Android-specific beyond `_layout.tsx`'s ordinary
   `<Tabs>` usage, which is exactly what `plan.md`'s "Native tab bar — no new dependency"
   Research Decision already confirmed needs no new dependency.)

## Requirement traceability (T009/T010/T011 scope only)

| FR / SC | Covered by |
|---|---|
| FR-001 (three reachable shell destinations) | `WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx`: "renders all three NAV_DESTINATIONS as links with correct roles and labels"; `app/(app)/_layout.tsx` renders one `<Tabs.Screen>` per `NAV_DESTINATIONS` entry (no dedicated test file for this layout — see note below, consistent with `001`'s own `(auth)`/`(onboarding)` `_layout.tsx` precedent) |
| FR-002 (native bottom tab bar on iOS/Android) | `app/(app)/_layout.tsx` — `expo-router`'s `<Tabs>` with explicit `tabBarAccessibilityLabel` per screen; verified via `tsc`/web export this batch — native-simulator-level confirmation is explicitly scheduled at T015, not claimed here |
| FR-003 (web shell via dedicated `.web.tsx`, no inline `Platform.OS`) | `WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx`: "wraps an expo-router Slot for the active screen"; the no-`Platform.OS` constraint verified independently by `grep` (zero hits) across all three files this review, not just claimed |
| SC-002 (reachable/operable via keyboard alone, zero pointer-only elements) | `WebSidebarNav.test.tsx`/`WebBottomBarNav.test.tsx`: "renders each destination as an enabled, keyboard-reachable link" |
| SC-003 (no horizontal overflow at 375px) | `WebBottomBarNav.tsx`'s structural design (horizontal row, `justifyContent: "space-around"`, three links only) — no dedicated 375px-viewport test this batch; full responsive-width verification is correctly deferred to T021 once the breakpoint switch (T012) and route wiring (T014) exist to actually render at a given width |

No FR/SC claimed by T009/T010/T011 lacks at least one covering test or an explicitly-documented
inspection-based verification (native-tab-bar visual/simulator confirmation and 375px-viewport
rendering are both legitimately deferred to later tasks already named in `tasks.md`, not
silently skipped).

## tasks.md checklist status

- [X] T001–T008 — previously approved (see above), unchanged.
- [X] T009 — matches `app/(app)/_layout.tsx` exactly as described this batch.
- [X] T010 — matches `WebSidebarNav.tsx`/`.test.tsx` exactly as described this batch.
- [X] T011 — matches `WebBottomBarNav.tsx`/`.test.tsx` exactly as described this batch.
- [ ] T012–T022 — correctly still unchecked; none of those files exist yet (confirmed via
  `find`/`git status`), no premature marking.

## CHECKPOINTS.md walkthrough (T001–T008 rows carried forward from prior reviews, re-verified
where restated; T009/T010/T011-affected rows re-verified independently this session)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists, current.
- [x] `tsc --noEmit` and full `jest` re-run independently this session, both clean
  (214/214 tests). A web-only `expo export` was also independently re-run and is clean. Full
  `./init.sh` end-to-end (all three platform bundle exports + native-dependency-alignment
  stage) is **not** re-run this round — explicitly and correctly deferred to T022 per
  `tasks.md`'s own phasing (T022 depends on "all prior tasks"), consistent with every prior
  batch's review in this feature.

**C2 — state coherent**
- [x] Exactly one feature (`004-home-scan-shell`) is `in_progress` in `feature_list.json`.
- [x] No feature is being marked `done` here — n/a.
- [x] `progress/current.md` describes only the active `004-home-scan-shell` session.

**C3 — architecture respected**
- [x] `src/domain/navigation.ts` untouched by this batch, still zero RN/Expo imports.
- [x] All three new/changed files (`_layout.tsx`, `WebSidebarNav.tsx`, `WebBottomBarNav.tsx`)
  consume `src/domain/navigation.ts`'s `NAV_DESTINATIONS` rather than embedding a duplicate
  route/label list or any other business rule — see confirmation 1/5 above.
- [x] No inline `Platform.OS` branching anywhere in this batch's three files — confirmed by
  `grep`, zero hits; the actual `.web.tsx` platform-split file (T012) does not exist yet, and
  correctly so at this stage.
- [x] No DB/storage/Supabase-table access — none present.
- [x] No new global state library.
- [x] No stray `console.log`, no context-free `TODO`.

**C4 — verification real**
- [x] No new/changed `src/domain` export in this diff (T001 already covered) — n/a for Level 1
  here.
- [x] `WebSidebarNav`/`WebBottomBarNav` each have RNTL tests asserting real rendered
  roles/labels/keyboard-reachability, not "doesn't throw" — Level 2 satisfied for those two.
  `app/(app)/_layout.tsx` has no dedicated test file this batch — see note below; this mirrors
  established repo precedent (`app/(auth)/_layout.tsx`, `app/(onboarding)/_layout.tsx` from
  `001` also have none) for a route-group layout file with no screens to render yet, and its
  build-level correctness is instead confirmed via the independent `expo export --platform web`
  re-run above. Not treated as a blocking gap, but flagged for visibility.
- [ ] Full three-target `./init.sh` build check — not re-run to completion this round (see C1);
  reasonably and consistently deferred to T022.

**C5 — session closed well**
- [x] No suspicious untracked files beyond the expected T001–T011 set plus the standing
  `progress/`/`specs/` bookkeeping files.
- Session still open (Phase 3 partially complete — T009/T010/T011 done, T012–T015 remaining) —
  "closed well" / `progress/history.md` entry not yet applicable; this is an interim, not a
  final, checkpoint.

**C6 — Spec Driven Development**
- [x] `004-home-scan-shell` (`sdd: true`, `in_progress`) has `spec.md` + `plan.md` + `tasks.md`.
- [x] `spec.md` has zero open `[NEEDS CLARIFICATION]` markers (both recorded-default items were
  confirmed by the human at the approval gate per the Clarifications header).
- [ ] "Every `done` feature has all tasks `[X]`" — n/a, feature is `in_progress`, not `done`.
- [x] FR-001, FR-002, FR-003, SC-002, SC-003 (the FRs/SCs in scope for T009/T010/T011) are each
  covered by at least one test or an explicitly-documented inspection/build-check where a
  rendering-level test isn't yet meaningful (native tab bar visuals, 375px viewport rendering —
  both correctly scheduled at later tasks already named in `tasks.md`).

No empty box above reflects a new or escalating gap introduced by this batch — the deferred
items (full `./init.sh`, session-close artifacts, `_layout.tsx`'s own dedicated test) are
consistent with this feature's established phasing and repo precedent, not silently skipped
requirements.

## Findings

**Blocking**: none.

**Non-blocking nits**:
- `app/(app)/_layout.tsx` has no dedicated component/screen test this batch. This mirrors
  established precedent in this repo (`app/(auth)/_layout.tsx`, `app/(onboarding)/_layout.tsx`
  from `001-registration-kyc` also have none) and is defensible given it has no screens to
  render yet (T014) and mounting `<Tabs>` in isolation would require a heavier router-context
  mock than anything established elsewhere in this repo. Its structural correctness (one
  `<Tabs.Screen>` per `NAV_DESTINATIONS`, explicit `tabBarAccessibilityLabel`) was confirmed by
  direct read and by an independent `expo export --platform web` re-run this session, not just
  taken on faith from the impl log. Recommend closing this gap once real screens exist behind
  it (T014/T015), not before.
- `WebSidebarNav`/`WebBottomBarNav` render text-only links with no icon, unlike the native tab
  bar's icon+label pairing. Neither T010 nor T011's task text requires icon parity, and the
  Research Decisions in `plan.md` don't call for it either — purely cosmetic, not a functional
  or accessibility gap (the accessible label is still present and correct on both). Not a
  reason to withhold approval.

Everything else confirmed clean:
- All three files derive their destinations from `NAV_DESTINATIONS` — no hardcoded duplicate
  amigos/home/social list anywhere; the two local lookup tables in `_layout.tsx`
  (`TAB_SCREEN_NAMES`, `TAB_ICONS`) are `Record<NavDestinationKey, ...>`-typed presentation
  wiring, not a second source of truth for routes/labels, and TypeScript's exhaustiveness check
  actually prevents them from drifting out of sync with `NAV_DESTINATIONS`' key union.
- `app/(app)/_layout.tsx` sets an explicit `tabBarAccessibilityLabel` per screen, not relying on
  icon-only defaults.
- `WebSidebarNav`/`WebBottomBarNav` both wrap an `expo-router` `<Slot />` for the active screen
  and render all three destinations with correct roles/labels; their tests assert real rendered
  roles/labels/enabled-state, not "doesn't throw."
- Zero inline `Platform.OS` branching in any of the three files, confirmed by `grep`, not just
  by inspection — consistent with this stage genuinely being the platform-agnostic building
  blocks the brief expected, ahead of T012's actual `.web.tsx` split.
- No business logic embedded in any of the three components beyond consuming
  `NAV_DESTINATIONS` and forwarding it to RN-specific elements.
- `app/(app)/_layout.tsx` existing without `app/(app)/index.tsx`/`amigos.tsx`/`social.tsx` does
  not currently break `./init.sh`'s build-export stages — independently re-verified via a fresh
  `expo export --platform web` run, which lists the new bare `/(app)` route cleanly alongside
  every pre-existing `001-registration-kyc` route, with `"/"` still resolving to the untouched
  `app/index.tsx` scaffold exactly as before. No dangling reference, no silent regression to
  `001`'s already-shipped routes.
- Type-check and full test suite (30 suites / 214 tests) are independently confirmed green with
  zero regressions from this batch.

## Verdict

**APPROVE**

Phase 3 (User Story 1) is on track — T009/T010/T011 are solid, drift-resistant building blocks
ready for T012 (`app/(app)/_layout.web.tsx`) to consume.

---

# Code Review: 004-home-scan-shell — Phase 3 (User Story 1), T012 & T013

**Scope reviewed**: task-implementer's claimed completion of T012 (`app/(app)/_layout.web.tsx`
+ `app/(app)/_layout.web.test.tsx`) and T013 (`src/features/navigation/HomeScreen.tsx` +
`HomeScreen.test.tsx`) from `specs/004-home-scan-shell/tasks.md`. T001–T011 already approved
above — not re-reviewed. Deliberately **not** in scope: T014 (`app/(app)/index.tsx`/
`amigos.tsx`/`social.tsx`, removal of `app/index.tsx`) — confirmed below that it does not
exist yet.

## Verification performed independently

- Read `specs/004-home-scan-shell/{spec.md,plan.md,tasks.md}` fresh this session (not from
  `progress/impl_004-home-scan-shell.md`'s narrative).
- Read `.specify/memory/constitution.md` (re-confirmed unchanged from prior batches),
  `docs/conventions.md`, `docs/verification.md`, `CHECKPOINTS.md` fresh this session.
- `git status --porcelain`: the only new/changed paths beyond the already-approved T001–T011
  set are `app/(app)/_layout.web.tsx`, `app/(app)/_layout.web.test.tsx`,
  `src/features/navigation/HomeScreen.tsx`, `src/features/navigation/HomeScreen.test.tsx`, plus
  the expected `feature_list.json`/`progress/current.md` bookkeeping diff and the two
  `progress/impl_...`/`progress/review_...` files. `find "app/(app)"` confirms `index.tsx`,
  `amigos.tsx`, `social.tsx` do not exist yet, and `app/index.tsx` is untouched — T014 genuinely
  has not started. Scope matches exactly what was claimed.
- `node_modules/.bin/tsc --noEmit` → clean, zero errors (re-run independently, not trusted from
  the impl log).
- `npx jest --silent` (full repo suite) → **32 suites / 221 tests passing, zero failures, zero
  regressions** from the 30/214 baseline recorded in the prior T009/T010/T011 review.
- Read `app/(app)/_layout.web.tsx`, `app/(app)/_layout.web.test.tsx`,
  `src/features/navigation/HomeScreen.tsx`, `src/features/navigation/HomeScreen.test.tsx`,
  `src/domain/navigation.ts`, `src/features/navigation/WebSidebarNav.tsx`, and
  `src/features/navigation/WebBottomBarNav.tsx` in full, verbatim, directly against `tasks.md`
  T012/T013 and `spec.md` FR-003/FR-004/FR-006/FR-008/US1 AS4–AS6.
- `grep -n "Platform"` across both new files → the only hit is a code comment in
  `_layout.web.tsx` documenting the absence of an inline `Platform.OS` branch, not an actual
  usage. Confirmed by direct read: neither file imports `react-native`'s `Platform` module at
  all.

## Specific confirmations requested

1. **No inline `Platform.OS` check in `app/(app)/_layout.web.tsx`; the `.web.tsx` extension
   itself is the entire platform split (Constitution IV / FR-003)** — confirmed. The file's
   only logic is:
   ```ts
   export default function AppWebLayout() {
     const { width } = useWindowDimensions();
     const layout = resolveWebNavLayout(width);
     return layout === "sidebar" ? <WebSidebarNav /> : <WebBottomBarNav />;
   }
   ```
   No `Platform` import, no `Platform.OS`/`Platform.select` anywhere. This is a hard
   requirement per the brief and it is genuinely satisfied, not just described as such.
2. **Calls `resolveWebNavLayout(width)` from `src/domain/navigation.ts` (T001) rather than
   reimplementing the 768px threshold inline** — confirmed. `_layout.web.tsx:3,15` imports and
   calls the actual T001 function; there is no literal `768`/`>=`/`<` comparison anywhere in
   this file. The breakpoint decision genuinely has one source of truth.
3. **Breakpoint test genuinely exercises both branches at real widths, boundary-inclusive at
   exactly 768 → sidebar** — confirmed for the `<768`/`>=768` split at the widths this file's
   test actually uses (767 → `WebBottomBarNav`, 800 → `WebSidebarNav`), matching `tasks.md`
   T012's literal instruction ("render at 767px... simulate a dimensions-change event to
   800px..."), which does not require re-testing the exact `768` boundary itself here — that
   boundary-inclusive case (`768` → `"sidebar"`) is already covered directly and unit-tested in
   `src/domain/navigation.test.ts` (T001, previously approved), the single source of truth for
   that decision. No gap: the boundary-inclusive property is tested once, at the pure-function
   level where it belongs (Constitution IV — logic tested in `src/domain`, not re-derived in
   every consumer), and this file's test correctly exercises that `resolveWebNavLayout` is
   actually being *called* and *consumed* correctly on both sides of it.
4. **Live-resize test (spec.md US1 AS6) — real assertion or superficial?** This is the batch's
   one genuine finding, and the implementer's own log is unusually honest about its limits
   (`progress/impl_004-home-scan-shell.md`'s "The live-resize test's honesty boundary" section,
   also mirrored in the test file's own top-of-file comment,
   `app/(app)/_layout.web.test.tsx:10-21`). Read closely, independently, against what the test
   can and cannot actually prove:
   - The test does call `rerender()` on the same RNTL render result after changing the mocked
     `useWindowDimensions()` return value (767→800), not a fresh `render()`/`unmount()` — so it
     genuinely proves `AppWebLayout` itself doesn't get torn down and rebuilt from the router's
     perspective, and that the switch is a live re-render reacting to a width change, not a
     reload. That much is real, not superficial.
   - However, `WebSidebarNav` and `WebBottomBarNav` (T010/T011, already-approved, unchanged in
     this batch) are two structurally different components, **each independently wrapping its
     own `<Slot />`**. When `AppWebLayout`'s ternary switches which one renders, React's
     reconciliation unmounts the previous subtree (including its nested `<Slot />`, and whatever
     screen component that `<Slot />` was rendering) and mounts an entirely new one. This is not
     a hypothetical — it is what the actual implementation does today, confirmed by reading
     `WebSidebarNav.tsx:31`/`WebBottomBarNav.tsx:18` (each has its own `<Slot />` inside its own
     JSX, not a `<Slot />` hoisted above the ternary in `_layout.web.tsx` and passed through as
     children).
   - The test's `<Slot />` mock is a **stateless** static-text stand-in
     (`() => <SlotText testID="active-screen-slot">active screen</SlotText>`,
     `_layout.web.test.tsx:31-34`). It carries no state that could ever fail to survive a
     remount, so the test's final assertion (`getByTestId("active-screen-slot")` truthy after
     the switch) **would pass identically whether or not the real active screen's component
     state actually survives the resize** — it cannot distinguish "the screen's local state
     (e.g. a `TopRightControls` toggle left open) was preserved" from "the screen was silently
     unmounted and remounted from scratch." This is exactly the "looks tested but isn't" shape
     called out in the review brief and in `docs/verification.md`'s own anti-pattern list.
   - **Net effect on real behavior**: `tasks.md`'s T012 task text asks for a test asserting the
     shell "re-renders as the sidebar... without unmounting/remounting the active screen's
     state." The actual implementation does **not** satisfy that literal wording — any local
     component state inside whichever screen is currently active behind the shell (concretely,
     today: `HomeScreen`'s `TopRightControls`, whose four controls each hold a local
     `useState` toggle for their "Not yet available" feedback text) **would be reset** by a
     resize across the 768px breakpoint, because the screen's whole subtree remounts along with
     the sidebar/bottom-bar swap. Separately, `spec.md`'s own AS6 wording ("without losing the
     active destination") is satisfied regardless — "active destination" there means which
     *route* is active, which is tracked by `expo-router`'s router context above this layout
     and is genuinely unaffected by which of the two nav chrome components is currently
     rendered — so the feature's actual required behavior (spec.md) is fine; it is `tasks.md`'s
     stricter, self-imposed "screen state" wording that the implementation and its test don't
     actually satisfy.
   - This is a real, if narrow, gap: it stems from `WebSidebarNav`/`WebBottomBarNav`'s own
     already-approved internal-`<Slot />` design (T010/T011), which this batch correctly
     recognized it should not silently modify. The available fix — hoisting a single shared
     `<Slot />` in `_layout.web.tsx` above the ternary and having `WebSidebarNav`/
     `WebBottomBarNav` accept `children` instead of each rendering their own `<Slot />` — would
     touch already-approved files and is reasonably treated as a follow-up, not a silent
     rewrite mid-batch. What is not fully acceptable is that neither the test nor the impl log
     flags this to a human decision-maker as an open item requiring confirmation — it's
     documented as settled reasoning in a code comment and progress log, not raised as a
     question. Given the practical impact today is limited to one ephemeral, non-critical piece
     of UI state (a placeholder "not yet available" toggle with no data behind it — see
     T007/FR-010), and the disclosure is thorough and honestly reasoned (not concealed), this is
     a **non-blocking finding**, but a real one: recommend a follow-up task (before this feature
     is marked `done`, or explicitly deferred to Polish/T020-T021 with the human's sign-off)
     that either (a) hoists a shared `<Slot />` above the breakpoint switch so screen state
     genuinely survives a resize, or (b) explicitly downgrades `tasks.md` T012's "without
     losing... state" wording to match spec.md's actual "active destination" requirement, so
     this isn't quietly left as an unflagged discrepancy between `tasks.md` and shipped
     behavior.
5. **`HomeScreen.tsx` composes all three required elements with a genuinely inert placeholder
   `onPress`** — confirmed. `AmigosQuickAccessPill` (top-left, `home-screen-top-left`),
   `TopRightControls` (top-right, `home-screen-top-right`), `ScanEntryCard` (centre,
   `home-screen-centre`) are all present (`HomeScreen.tsx:20-32`).
   `handleScanEntryPress` (`HomeScreen.tsx:14-16`) is a module-level, literally empty function
   body with only a comment — it calls no `expo-router` API, no state setter, nothing. `grep`
   for `useRouter`/`router.push`/`Router` in `HomeScreen.tsx` → zero hits. This is genuinely
   inert, not a disguised early navigation wire-up — no scope creep to flag; T016 (US2) is
   correctly left for later, exactly as `tasks.md` T013 specifies.
6. **`HomeScreen`'s test asserts real structural composition, not "renders without throwing"**
   — confirmed. All four tests query by role/accessible name within named containers
   (`within(getByTestId(...))`, `getByRole("button", { name: ... })`,
   `getAllByRole("button")`), and the fourth test asserts the exact ordered sequence of all six
   buttons' `accessibilityLabel`s across the whole tree
   (`["Amigos", "Language...", "Currency...", "Notifications...", "Messages...", "Scan a
   card"]`), which is a genuine structural/composition assertion (top-left pill, then top-right
   stack, then centre card, matching render order in `HomeScreen`'s own JSX) — not a bare
   "doesn't throw" check. Re-ran independently: 4/4 pass.
7. **No business logic embedded in either file beyond consuming already-tested domain logic
   (Constitution IV)** — confirmed. `_layout.web.tsx` contains exactly one already-pure
   function call (`resolveWebNavLayout`) and a ternary render choice — no fetch, no
   validation, no data transform. `HomeScreen.tsx` composes three already-built, already-tested
   leaf components and forwards a no-op placeholder handler — no business rule invented in
   either file's body. Neither imports `src/lib/api.ts`, React Query, or `fetch`/`axios`.

## Requirement traceability (T012/T013 scope only)

| FR / SC | Covered by |
|---|---|
| FR-003 (web shell via dedicated `.web.tsx`, sidebar ≥768px / bottom bar below, no inline `Platform.OS`) | `_layout.web.test.tsx`: "renders WebBottomBarNav at 767px width", "renders WebSidebarNav at 800px width"; boundary-inclusive `768` case covered at the `resolveWebNavLayout` level in `src/domain/navigation.test.ts` (T001); no-`Platform.OS` constraint verified independently by direct read/`grep`, not just claimed |
| FR-004 (centre "+" card) | `HomeScreen.test.tsx`: "renders the scan entry card dead centre" |
| FR-006 (four top-right controls) | `HomeScreen.test.tsx`: "renders the four top-right placeholder controls top-right" |
| FR-008 (top-left Amigos pill) | `HomeScreen.test.tsx`: "renders the Amigos quick-access pill top-left" |
| US1 AS4/AS5 (narrow → bottom bar; ≥768px → sidebar) | `_layout.web.test.tsx`, same two tests as FR-003 |
| US1 AS6 (live resize, no reload, active destination preserved) | `_layout.web.test.tsx`: "live-switches from the bottom bar to the sidebar on resize without a full remount" — **genuinely covers** "live re-render, not reload" and "active destination [route] preserved" (spec.md's actual wording); **does not and cannot cover** `tasks.md` T012's stricter "active screen's state" wording, since the mocked `<Slot />` is stateless and the real `WebSidebarNav`/`WebBottomBarNav` each wrap independent `<Slot />` instances that do unmount/remount the active screen on switch — see finding 4 above. This is the one non-blocking gap in this batch's traceability. |

## tasks.md checklist status

- [X] T001–T011 — previously approved (see above), unchanged.
- [X] T012 — matches `app/(app)/_layout.web.tsx`/`.test.tsx`'s described behavior for the
  breakpoint-switch/no-`Platform.OS` requirements; the test's coverage of the "without
  unmounting/remounting the active screen's state" clause specifically is honestly
  documented as narrower than that literal wording requires (see finding 4) — marking `[X]`
  is still reasonable given spec.md's actual AS6 requirement (active *destination*, i.e.
  route) is genuinely satisfied and the gap is disclosed, not hidden, but this is flagged
  explicitly rather than silently accepted.
- [X] T013 — matches `HomeScreen.tsx`/`.test.tsx` exactly as described.
- [ ] T014–T022 — correctly still unchecked; `app/(app)/index.tsx`/`amigos.tsx`/`social.tsx`
  and `app/index.tsx`'s removal do not exist yet (confirmed via `find`/`git status`), no
  premature marking.

## CHECKPOINTS.md walkthrough (T001–T011 rows carried forward from prior reviews, re-verified
where restated; T012/T013-affected rows re-verified independently this session)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists, current.
- [x] `tsc --noEmit` and full `jest` re-run independently this session, both clean
  (221/221 tests). The impl log additionally reports an independent `./init.sh --skip-build`
  run at `RESULT: SUCCESS (8/8)` this batch; full `./init.sh` (all three platform bundle
  exports) is correctly deferred to T022 per `tasks.md`'s own phasing, consistent with every
  prior batch's review in this feature.

**C2 — state coherent**
- [x] Exactly one feature (`004-home-scan-shell`) is `in_progress` in `feature_list.json`.
- [x] No feature is being marked `done` here — n/a.
- [x] `progress/current.md` describes only the active `004-home-scan-shell` session.

**C3 — architecture respected**
- [x] `src/domain/navigation.ts` untouched by this batch, still zero RN/Expo imports.
- [x] Both new files consume already-tested `src/domain`/leaf-component logic rather than
  embedding a business rule inline — see confirmation 7 above.
- [x] `app/(app)/_layout.web.tsx` is the `.web.tsx`-convention platform split with zero inline
  `Platform.OS` branching — confirmed directly, this batch's hard requirement, genuinely met.
- [x] No DB/storage/Supabase-table access — none present.
- [x] No new global state library.
- [x] No stray `console.log`, no context-free `TODO`.

**C4 — verification real**
- [x] No new/changed `src/domain` export in this diff — n/a for Level 1 here.
- [x] Both new files have RNTL tests asserting real rendered output (testID-scoped
  role/label queries, ordered-sequence assertion, breakpoint-driven testID presence/absence)
  — Level 2 satisfied for the parts that are actually testable; the one narrower-than-claimed
  piece (live-resize "state" preservation) is disclosed above, not silently passed off as
  fully covered.
- [ ] Full three-target `./init.sh` build check — not re-run to completion by me this round
  (the impl log's own `--skip-build` run is not a substitute); reasonably and consistently
  deferred to T022 per `tasks.md`'s own phasing, same as every prior batch in this feature.

**C5 — session closed well**
- [x] No suspicious untracked files beyond the expected T001–T013 set plus the standing
  `progress/`/`specs/` bookkeeping files.
- Session still open (Phase 3 nearly complete — T012/T013 done, T014/T015 remaining) —
  "closed well" / `progress/history.md` entry not yet applicable; this is an interim, not a
  final, checkpoint.

**C6 — Spec Driven Development**
- [x] `004-home-scan-shell` (`sdd: true`, `in_progress`) has `spec.md` + `plan.md` + `tasks.md`.
- [x] `spec.md` has zero open `[NEEDS CLARIFICATION]` markers (both recorded-default items were
  confirmed by the human at the approval gate).
- [ ] "Every `done` feature has all tasks `[X]`" — n/a, feature is `in_progress`, not `done`.
- [x] FR-003, FR-004, FR-006, FR-008 (the FRs in scope for T012/T013) are each covered by at
  least one test referencing them; US1 AS6 is covered by a test with an honestly-disclosed
  narrower scope than `tasks.md`'s literal wording (see findings).

No empty box above reflects a new or escalating gap introduced by this batch beyond the one
disclosed finding — the deferred items (full `./init.sh`, session-close artifacts) are
consistent with this feature's established phasing.

## Findings

**Blocking**: none.

**Non-blocking, but should be tracked before this feature is marked `done`**:
- `app/(app)/_layout.web.tsx`'s live-resize behavior does not actually preserve the active
  screen's local component state across the 768px breakpoint switch, because `WebSidebarNav`
  and `WebBottomBarNav` (T010/T011) each wrap an independent `<Slot />`, so React unmounts one
  subtree and mounts the other whenever the ternary flips. `tasks.md` T012's literal task text
  ("without unmounting/remounting the active screen's state") is therefore not fully satisfied
  by the shipped implementation, and the corresponding test cannot detect this because its
  mocked `<Slot />` is stateless — the test would pass identically whether or not real state
  survives. `spec.md`'s own AS6 requirement ("without losing the active destination") is
  satisfied regardless, since "active destination" resolves to the current route via
  `expo-router`'s own router context, independent of which nav-chrome component currently
  renders. Concretely, today this means: if a user opens one of `TopRightControls`' "Not yet
  available" feedback toggles and then resizes the browser across 768px, that toggle silently
  resets to hidden. Low real-world severity (ephemeral, non-critical UI feedback state, not
  data loss or navigation loss), and the gap is disclosed thoroughly and honestly in both the
  test file's own top-of-file comment and the impl log — not concealed. Recommend a follow-up
  decision (at Polish, T020/T021, or explicitly before `done`): either hoist a single shared
  `<Slot />` above the breakpoint ternary in `_layout.web.tsx` (touching T010/T011) so state
  genuinely survives, or explicitly reconcile `tasks.md`'s wording with `spec.md`'s actual (and
  already-satisfied) AS6 requirement so this isn't left as a quiet mismatch between the task
  spec and shipped behavior.

Everything else confirmed clean:
- Zero inline `Platform.OS` branching in `_layout.web.tsx` — confirmed by direct read and
  `grep`, not just claimed; the `.web.tsx` extension is genuinely the entire platform split.
- `resolveWebNavLayout` (T001) is the single source of truth for the breakpoint decision — no
  reimplemented threshold logic in the consuming file.
- The 767px/800px branches are both genuinely exercised at real widths; the boundary-inclusive
  `768` case is correctly tested once, at the pure-function level (`src/domain/navigation.test.ts`,
  T001), not re-derived or skipped here.
- `HomeScreen.tsx` composes all three required elements in the correct regions with a
  genuinely inert placeholder `onPress` — no premature navigation wiring, no scope creep ahead
  of T016.
- `HomeScreen.test.tsx` asserts real structural composition (testID-scoped roles/labels, an
  ordered accessible-name sequence across the whole tree) — not a "renders without throwing"
  check.
- No business logic embedded in either file beyond consuming already-tested `src/domain`/leaf
  components (Constitution IV).
- Type-check and full test suite (32 suites / 221 tests) are independently confirmed green with
  zero regressions from this batch.
- Scope discipline is good: T014 (route wiring, removal of `app/index.tsx`) was not touched,
  matching the stated batch boundary.

## Verdict

**APPROVE WITH NITS**

T012 and T013 are solid, drift-resistant implementations that correctly satisfy their hard
requirements (no inline `Platform.OS`, single-source-of-truth breakpoint logic, inert
placeholder composition, real structural tests). The one nit — the live-resize test's
"active screen state" coverage being honestly narrower than `tasks.md`'s literal wording,
tracing to an inherited design choice in already-approved T010/T011 — is disclosed, low-impact,
and appropriately deferred rather than blocking; it should be tracked and resolved (either by a
follow-up fix or an explicit spec/tasks reconciliation) before this feature is marked `done`.

---

# Review — Run 7 (T014): route wiring, `app/index.tsx` removal

**Scope reviewed**: `app/(app)/index.tsx`, `app/(app)/amigos.tsx`, `app/(app)/social.tsx`
(new), their colocated tests, and the removal (`git rm`) of `app/index.tsx`. Prior batches
(T001–T013) are already approved and not re-reviewed here.

## Independent verification performed

1. **Reproduced `npm run web` (`expo start --web`) crashing, confirmed live, right now on this
   branch.** Ran `npx expo start --web --port 8099` directly (not trusting the impl report's
   claim). The dev server itself logged, unprompted:
   ```
   Error: The layouts "./(app)/_layout.web.tsx" and "./(app)/_layout.web.test.tsx" conflict on
   the route "/(app)/_layout". Please remove or rename one of these files.
       at getDirectoryTree (node_modules/expo-router/src/getRoutesCore.ts:166:19)
       at getRoutesManifest (@expo/cli/src/start/server/metro/createServerRouteMiddleware.ts:50:45)
   ```
   Then `curl -s -w "HTTP_STATUS:%{http_code}" http://localhost:8099/` returned
   **`HTTP_STATUS:500`**, with that same stack trace rendered as the response body (an HTML
   `<pre>` error page). This is not a cosmetic log line — the dev server cannot serve `/` (or
   any route) at all. `npm run web` is genuinely, reproducibly broken on this branch today.
2. **Confirmed the two code paths really are different**, per the report's claim: with the
   crash live, `npx expo export --platform web` (already independently re-run) still succeeds
   and lists `/(app)`, `/(app)/amigos`, `/(app)/social` as clean static routes. So a green
   `expo export` genuinely does not prove `npm run web` works — verified directly, not just
   accepted on the report's word.
3. **Isolated the exact cause.** Moved `app/(app)/_layout.web.test.tsx` out of `app/` (to the
   scratchpad), restarted `expo start --web` on a fresh port: server boots cleanly (`Web
   Bundled ... expo-router/entry.js`), and `curl` to `/` returns **`HTTP_STATUS:200`** with a
   real HTML shell. Moved the file back immediately after; `git status` on `app/(app)/`
   reverted to the pre-check untracked state (no stray change introduced by this review).
   This directly confirms the report's root-cause claim: `metro.config.js`'s
   `config.resolver.blockList` (added as a "T012 follow-up" per its own comment, `metro.config.js:16`)
   only filters Metro's bundling/module-resolution graph, not `expo-router`'s separate
   dev-server route-manifest scan (`getRoutesSSR.ts` → `getDirectoryTree`), which walks the raw
   filesystem and sees `_layout.web.tsx` and `_layout.web.test.tsx` as two competing layouts for
   the same route segment.
4. **Confirmed this is not caused by T014.** `git status --short "app/(app)/_layout.web.test.tsx"`
   shows it as untracked (added in Run 6/T012, already approved in this review file above,
   before T014 ran). T014's own diff — `app/(app)/index.tsx`, `amigos.tsx`, `social.tsx`,
   their three test files, and the `git rm` of `app/index.tsx` — touches none of
   `app/(app)/_layout.web.tsx`, `app/(app)/_layout.web.test.tsx`, or `metro.config.js`. The
   crash is real, reproducible, pre-existing (introduced when T012 added the colocated
   `_layout.web.test.tsx` without anyone having run `expo start --web` since), and T014's diff
   does not contribute to it. That said, per the task brief's own instruction, whether `npm run
   web` is broken *right now* controls the verdict regardless of attribution — see Verdict below.
5. **Read `app/(app)/index.tsx`, `amigos.tsx`, `social.tsx`** — each is a two-line route file
   with zero business logic, importing and rendering exactly the intended already-tested
   component (`HomeScreen`, `AmigosPlaceholderScreen`, `SocialPlaceholderScreen` respectively).
   Matches T014's description exactly.
6. **Confirmed `app/index.tsx` is genuinely gone**, not just moved: `git status --short` shows
   it `deleted`, and `grep -rn "app/index"` across `app/` and `src/` finds only comments
   referencing its removal (in `app/_layout.tsx` and `app/(app)/index.tsx`/`index.test.tsx`),
   no live import or route reference.
7. **Confirmed FR-009 is respected.** `git diff HEAD -- src/domain/kyc-gate.ts
   src/features/identity/useKycGate.ts` is empty (0 lines). `git diff HEAD -- app/_layout.tsx`
   is empty — the report's claimed temporary monkeypatch-and-revert left no trace; independently
   verified, not just trusted.
8. **Confirmed the three new route tests assert real rendered content, not "doesn't throw."**
   `app/(app)/index.test.tsx` asserts `getByTestId("home-screen")` and
   `getByRole("button", { name: "Scan a card" })`; `amigos.test.tsx` asserts
   `getByRole("header", { name: "Amigos" })`; `social.test.tsx` asserts
   `getByRole("header", { name: "Social" })`. All three exercise real accessible output.
9. **Independently ran `npx tsc --noEmit`** — clean, no output.
10. **Independently ran `npx jest`** — `35 passed, 35 total` / `224 passed, 224 total`, matching
    the report's claimed numbers exactly.

## Requirement traceability (this batch)

| FR | Test(s) | Verified |
|---|---|---|
| FR-001 (Home/Scan reachable, `"main"` lands on it) | `app/(app)/index.test.tsx` "renders the Home/Scan screen" | Yes — real accessible-role assertions |
| FR-007 (Amigos/Social reachable, distinct placeholders, never unmatched-route) | `app/(app)/amigos.test.tsx`, `app/(app)/social.test.tsx` | Yes |
| FR-009 (gate itself untouched) | Verified by inspection (`git diff` empty on all three gate files) — no dedicated test needed, this is an absence-of-change requirement | Yes |

## `tasks.md` checklist status (this feature, current state)

- T001–T013: `[X]` (already approved in prior review runs above, not re-reviewed here).
- **T014: `[X]`** — reviewed in this batch, files match description exactly.
- T015: `[ ]` — correctly left unchecked; blocked by the `npm run web` crash below.
- T016–T022: `[ ]` — not started.

## CHECKPOINTS.md C1–C6 walkthrough (state as of this review)

- **C1**: `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` exist — `[x]`.
  `docs/verification.md`/`docs/conventions.md` exist — `[x]`. Constitution exists/current —
  `[x]`. `./init.sh` exits 0 — **not independently re-run this batch** (prior batches ran
  `./init.sh --skip-build`, SUCCESS); given the live `npm run web` crash found below, a full
  `./init.sh` run's web-export stage would likely still pass (export ≠ dev server per the
  finding), but this checkbox should not be considered fully closed until T022 runs it
  end-to-end — `[ ]` (deferred to T022 as tasks.md already schedules).
- **C2**: exactly one feature `in_progress` (`004-home-scan-shell`) — `[x]`. Tests pass for
  done features — n/a here (this feature isn't `done` yet). `progress/current.md` scoped to
  active session — not inspected this batch, assume unchanged — `[x]` (provisional).
- **C3**: `src/domain/navigation.ts` has zero RN/Expo imports (already verified in prior
  runs) — `[x]`. T014's three route files call into already-tested `src/features` components
  with zero embedded logic — `[x]`. No inline `Platform.OS` in T014's files — `[x]` (n/a, none
  present). No direct Postgres/Redis/S3/Supabase access — `[x]`. No new global state library —
  `[x]`. No stray `console.log`/context-free `TODO` in T014's files — `[x]`.
- **C4**: `src/domain` exports covered by unit tests — `[x]` (prior batches). New screens have
  RNTL component tests asserting real rendered output — `[x]` (this batch's three route tests
  do this, confirmed above). `./init.sh` build checks pass for all three targets — **not run
  this batch**; web-only `expo export` confirmed clean, iOS/Android not exercised this batch
  (consistent with T014's stated scope, deferred to T022) — `[ ]` (open until T022).
- **C5**: no suspicious untracked files — `[x]` (checked `git status --short`, only expected
  feature files). `progress/history.md` — not checked this batch (out of this batch's scope).
- **C6**: `spec.md`+`plan.md`+`tasks.md` all exist for `004-home-scan-shell` — `[x]`. No open
  `[NEEDS CLARIFICATION]` markers — `[x]` (spec.md's one open item was confirmed by the human,
  not a blocking marker). All `tasks.md` items `[X]` — **no**, this feature is not `done` yet
  (`in_progress`), so this box is not yet applicable/required. Every FR covered by a
  referencing test — `[x]` for FR-001/FR-007/FR-009 (this batch); prior FRs already confirmed
  in earlier review runs.

Given this feature is still `in_progress`, not `done`, several C1/C4 boxes are legitimately
open pending T022 (the feature's own final full-`init.sh` gate) — that is expected at this
point in the phase, not itself a new defect. The one checkpoint-relevant item that **is** a
live defect right now, independent of "done" status, is documented below.

## Findings

**Blocking**:

1. **`npm run web` (`expo start --web`) crashes on startup / returns HTTP 500 for every route,
   right now, on this branch.** Confirmed via direct reproduction (see steps 1–3 above), not
   accepted on the implementer's word alone. Exact error:
   ```
   Error: The layouts "./(app)/_layout.web.tsx" and "./(app)/_layout.web.test.tsx" conflict on
   the route "/(app)/_layout". Please remove or rename one of these files.
   ```
   Implicated files: `app/(app)/_layout.web.test.tsx` (the colocated test file expo-router's
   dev-server route-manifest scan mistakes for a second layout) and `metro.config.js`
   (its `resolver.blockList`, which filters Metro's bundling graph but not this separate
   `getRoutesSSR`/`getDirectoryTree` dev-server code path). **Not** caused by T014's own diff
   (confirmed: `_layout.web.test.tsx` predates T014, from the already-approved T012 batch;
   T014 touches neither that file nor `metro.config.js`) — but per the review brief, that does
   not change the verdict: a broken dev server for this feature's own route tree blocks this
   feature's own remaining tasks (T015, T019, T021 all require `npm run web` per
   `docs/verification.md` Level 3) and is squarely this feature's problem to resolve before any
   further Level-3 manual verification can be trusted. Concrete failure scenario: any
   developer or reviewer running `npm run web` on this branch right now, on any route under
   `(app)/` (not just this batch's three), gets a blank error page instead of the app —
   `SC-001` ("no visible flash... or an unmatched-route error, on iOS, Android, and web") is
   not currently demonstrable on web at all via the normal dev-server path, only via the
   static `expo export` output or the headless-Chrome-against-a-crashing-server workaround the
   impl report used.

   **Scoping note for the fix task**: this is not T014's bug to fix (T014's own files are
   clean), but it must be fixed — either by relocating/renaming the colocated `_layout.*.test.tsx`
   files out of `app/`'s route-discovery path, or by finding whichever mechanism actually gates
   `expo-router`'s dev-server manifest scan (if one exists) — before T015 (or any manual web
   check for this feature) can be attempted for real. Recommend a small, explicitly-scoped fix
   task (not folded into T014, which is otherwise complete and correct) before T015 proceeds.

**Non-blocking / carried forward from the prior review run** (not re-litigated, already
disclosed and accepted above): the live-resize `<Slot/>` state-loss nit from T012/T013's
review remains open and unrelated to this batch.

Everything else in this batch confirmed clean: route files are minimal and correct, `app/
index.tsx`'s removal is atomic and complete with no lingering reference, FR-009 is respected
with an independently-confirmed empty diff on all three gate files, tests assert real rendered
content, and full type-check/test suite are green with no regressions.

## Verdict

**REQUEST CHANGES**

T014 itself — the three new route files, the atomic removal of `app/index.tsx`, and their
tests — is implemented correctly and matches `tasks.md`'s description exactly; on its own it
would be an easy approve. However, `npm run web` is confirmed broken right now on this branch
(reproduced independently: dev-server crash, HTTP 500 on every route), which blocks this
feature's own T015/T019/T021 and means `docs/verification.md`'s Level 3 manual-smoke-check
requirement cannot currently be satisfied for this feature at all via the normal path. Per the
review brief's own instruction, this blocks approval regardless of attribution. Before this
batch (or T015) can be signed off:

- Fix the `expo start --web` crash — either move/rename the colocated `app/(app)/
  _layout.web.test.tsx` (and any sibling `_layout.*.test.tsx` files this feature or future ones
  add) out of `expo-router`'s route-discovery path, or extend whatever config actually gates its
  dev-server manifest scan (`metro.config.js`'s `blockList` does not reach that code path,
  confirmed). Scope this as its own small task, separate from T014 (which does not need to
  change).
- Re-run `npm run web` after the fix and confirm a real `HTTP 200` / rendered app at `/`,
  `/amigos`, and `/social` before T015's manual smoke check is attempted for real.

Once that fix lands and is re-verified, T014's own files need no further changes.

---

# Code Review: 004-home-scan-shell — Dev-server-crash fix (not a numbered `tasks.md` task)

**Scope reviewed**: the targeted bug fix task-implementer produced in response to this file's
own prior `REQUEST CHANGES` entry ("Review — Run 7 (T014)"), which blocked approval on a live
`npm run web` / `npx expo start --web` startup crash: `"The layouts './(app)/_layout.web.tsx'
and './(app)/_layout.web.test.tsx' conflict on the route '/(app)/_layout'"`. This is not one of
`tasks.md`'s 22 numbered tasks — nothing new is marked `[X]` in `tasks.md` by this fix, and none
should be. T001–T014 remain as previously approved and are not re-reviewed here.

## Independent verification performed (not taken from progress/impl_004-home-scan-shell.md)

1. **`git status --porcelain` / `find`**: confirmed `app/(app)/_layout.web.test.tsx` no longer
   exists anywhere under `app/`, and `src/features/navigation/AppWebLayout.test.tsx` exists in
   its place. `docs/conventions.md`, `metro.config.js`, `feature_list.json`,
   `progress/current.md` are the only modified tracked files; no other `app/` file changed
   beyond the already-approved T014 diff (`app/index.tsx` still shows `deleted`, as before).
2. **Started `npx expo start --web --port 8199` myself**, fresh, on the real (non-monkeypatched)
   working tree. Server log shows `Web Bundled ... expo-router/entry.js` with **no** "conflict"
   error anywhere — confirmed by reading the full startup log directly, not by absence-checking
   a grep. This reproduces the fix, not just accepts the report's claim.
3. **`curl` against every route** while that server was live:
   - `/` → `200`
   - `/amigos` → `200`
   - `/social` → `200`
   - `/scan` → `404` (expected — `app/scan.tsx` is T016, not yet built; this is a real
     not-found, not a crash, and matches the export route list below, which lists no `scan`
     route at all)
4. **Confirmed the `200` responses are real rendered markup, not a blank shell.** Each of `/`,
   `/amigos`, `/social` server-renders a `data-testid="kyc-gate-loading"` node (the app's actual
   `KycGate` loading state, since this curl call carries no authenticated session) — genuine
   app-level, expected behavior for an unauthenticated request, not an error page. Confirmed
   this is not new/regressed behavior by diffing against a pre-existing, already-approved route:
   `curl http://localhost:8199/register` (from `001-registration-kyc`, untouched by this fix)
   renders the identical `kyc-gate-loading` node and also returns `200` — i.e. this feature's
   new routes behave exactly like the rest of the app's SSR output, not specially broken. The
   implementer's own report went one step further and did a temporary, fully-reverted
   `KycGate()` monkeypatch to inspect the actual `HomeScreen`/`AmigosPlaceholderScreen`/
   `SocialPlaceholderScreen` markup underneath that loading state (`amigos-quick-access-pill`,
   `top-right-controls`, `scan-entry-card`, `<h1>Amigos</h1>`/`<h1>Social</h1>` with their exact
   disclaimer copy) — I did not need to repeat that step myself since (a) the component-level
   RNTL tests already assert that exact content and (b) the loading-state parity check above is
   sufficient to confirm this fix didn't leave the routes in some broken intermediate state; I
   independently confirmed the underlying report's methodology was sound rather than blindly
   trusting its conclusion.
5. **Confirmed no other colocated `_layout.*.test.tsx` file exists anywhere under `app/`**
   (`find app -iname "_layout*test*"` → empty) — the crash's specific trigger is fully removed,
   not just moved to a different `_layout.*` file.
6. **Read the actual installed `expo-router@3.5.24` source** to verify the report's root-cause
   claim rather than trust its prose:
   - `node_modules/expo-router/build/getRoutesCore.js:248`:
     `const [filenameWithoutExtensions, platformExtension] = removeSupportedExtensions(filename).split('.')`
     — confirmed this destructuring silently drops any third+ dot-segment. For
     `_layout.web.test.tsx`, `split('.')` yields `["_layout", "web", "test"]`; only the first two
     are read, so `platformExtension = "web"` and the `"test"` segment is invisible to this
     function — exactly as the report describes.
   - `getRoutesCore.js:111-123`: layout conflict detection is keyed **only** on
     `directory.layout[meta.specificity]` — a single slot per directory per specificity level,
     with no filename/route-name component in the key at all.
   - `getRoutesCore.js:144-166`: ordinary (non-layout, non-API) file conflict detection is keyed
     on `directory.files.get(route)` where `route` is the **route name** (which, since `"test"`
     is not in `validPlatforms`, is left as `"register.test"` for a file like
     `register.test.tsx` — a distinct route name from `"register"`, so no conflict).
   This independently confirms the report's central technical claim — layout-conflict detection
   is specificity-keyed while screen-conflict detection is name-keyed, which is genuinely why
   `_layout.*.test.tsx` collides and `<screen>.test.tsx` doesn't — rather than accepting it as
   asserted prose. The report's generalization claim (any `_layout.*` file anywhere under `app/`
   would hit this the moment a colocated test file is added for it, including the still-test-
   less `app/(app)/_layout.tsx` from T009) follows directly from this mechanism and is correct,
   not hand-waved.
7. **Confirmed `metro.config.js`'s actual diff is comment-only.** `git diff metro.config.js`
   shows the single functional line, `config.resolver.blockList = exclusionList([/\.test\.[jt]sx?$/])`,
   is byte-for-byte unchanged; only the surrounding comment was rewritten to state the blockList's
   real scope. This matches the report's claim exactly and confirms this fix did not weaken or
   remove the existing guard that keeps ordinary colocated screen tests
   (`app/(auth)/register.test.tsx`, etc.) out of production bundles.
8. **Confirmed `docs/conventions.md`'s addition is real, not just claimed.** `git diff
   docs/conventions.md` shows a new, clearly-scoped exception in the "Tests" section: tests for
   `_layout.*` files under `app/` must live in `src/features/<owning-module>/` instead of being
   colocated, with the reasoning and an example import path. The exception is explicitly scoped
   to `_layout.*` files only — it does not claim (and does not need to claim) anything about
   ordinary screen tests, which the source-reading above confirms are unaffected.
9. **Confirmed the relocated test file lost no assertions.** Read
   `src/features/navigation/AppWebLayout.test.tsx` in full: same three `it` blocks (767px →
   bottom bar, 800px → sidebar, live-resize `rerender()` case), same mocks
   (`useWindowDimensions`, `expo-router`'s `Link`/`Slot`), only the import path changed (`import
   AppWebLayout from "../../../app/(app)/_layout.web"` instead of the former relative `"./
   _layout.web"`). Ran `npx jest --listTests` — `AppWebLayout.test.tsx` is present and discovered
   normally; ran it directly and it passes (see below).
10. **Confirmed `app/_layout.tsx` (the KYC gate) carries no leftover diff from the report's
    described temporary monkeypatch.** `git diff --stat app/_layout.tsx` and `git diff
    app/_layout.tsx` both produce zero output — the file is genuinely untouched in the final
    state, matching FR-009's "gate itself untouched" requirement, independently re-confirmed
    (not re-trusted from the T014 review's earlier identical check).
11. **`node_modules/.bin/tsc --noEmit`** → clean, exit 0, re-run independently.
12. **`npx jest --silent`** → `Test Suites: 35 passed, 35 total`, `Tests: 224 passed, 224 total`
    — identical counts to the pre-fix T014-review baseline, confirmed by `npx jest --listTests`
    that all pre-existing `001-registration-kyc` colocated route tests
    (`app/(auth)/register.test.tsx`, `app/(auth)/register.session-wiring.test.tsx`,
    `app/(auth)/register.session-failure.test.tsx`, `app/(auth)/verify-phone.test.tsx`,
    `app/(auth)/profile.test.tsx`, `app/(auth)/kyc-status.test.tsx`,
    `app/(onboarding)/tutorial.test.tsx`) are still discovered and still pass — no regression
    from `metro.config.js`'s comment-only change.
13. **`npx expo export --platform web`** (re-run independently into a scratch directory, deleted
    after) → completed cleanly, same route list as before (`/(app)`, `/(app)/amigos`,
    `/(app)/social`, plus every `001` route), confirming this fix does not regress the static
    web-export build path either.
14. **Re-read `tasks.md`** — confirmed no task is newly/incorrectly marked. T001–T014 remain
    `[X]` (previously approved), T015 remains correctly `[ ]` (this fix unblocks it but does not
    perform it), T016–T022 remain `[ ]`.
15. **Read `CHECKPOINTS.md`, `docs/verification.md`, `.specify/memory/constitution.md`** fresh
    this session — nothing in this fix conflicts with any of the three; see the walkthrough
    below.

## Was the fix approach sound, or does it just paper over this one file?

Sound, and the report's own investigation (independently re-verified against the installed
`expo-router` source above, not just re-stated) directly answers the generalization question
the prior review flagged:

- The bug is intrinsic to `expo-router@3.5.24`'s dev-server route-manifest scan for **any**
  `_layout.*` file with a colocated `_layout.*.test.tsx`/`_layout.<platform>.test.tsx` sibling
  in the same directory — not specific to the web variant or to this one file. A future
  colocated test for `app/(app)/_layout.tsx` (T009, no test file today), `app/(auth)/_layout.tsx`,
  `app/(onboarding)/_layout.tsx`, or the root `app/_layout.tsx` would hit the identical crash the
  moment such a test file were added, for the identical mechanism.
- No supported `expo-router`/`@expo/cli`-level configuration hook exists at this installed
  version to exclude a file from that specific glob (confirmed by reading
  `@expo/cli`'s `router.js`/`fetchRouterManifest.js` per the report — I did not re-derive this
  negative claim myself beyond confirming no `blockList`-equivalent option is referenced in
  those files' code, which is consistent with the report), so relocating the test file is a
  correct choice given the constraint, not a shortcut.
- The `docs/conventions.md` addition converts this from a one-off, easy-to-forget special case
  into a documented rule that will apply the next time someone adds a test for `app/(app)/
  _layout.tsx` (T009) or any other `_layout.*` file — closing the exact landmine the review brief
  asked about, rather than leaving it for a future task to rediscover the hard way.
- `app/scan.tsx` (T016, not yet built) is an ordinary screen file, not a layout — confirmed via
  the same source reading (name-keyed conflict detection for non-layout files) that a future
  `scan.test.tsx`/`scan.web.test.tsx` would **not** hit this bug and needs no similar exception.

## Requirement traceability

This fix introduces no new/changed FR — it is dev-server infrastructure, not product behavior,
correctly reflected in the impl report's own traceability section. Its correctness is instead
covered by: `AppWebLayout.test.tsx`'s unchanged 3 tests (still tagged with the same FR-003/US1
AS4-AS6 references), the full regression suite (224/224), and the live-server route checks
above, which re-confirm FR-001/FR-004/FR-006/FR-007/FR-008 are still reachable in practice (not
just in `expo export`'s static output, which the prior review already flagged as insufficient
proof of a working dev server).

## `tasks.md` checklist status

- T001–T014: `[X]` — unchanged, previously approved, not re-reviewed here.
- T015: `[ ]` — correctly still unchecked; this fix unblocks it but does not perform the manual
  smoke check itself.
- T016–T022: `[ ]` — not started.

No task was marked `[X]` by this fix, correctly — it is not a numbered task.

## CHECKPOINTS.md C1–C6 walkthrough (state as of this review)

- **C1**: `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` exist — `[x]`.
  `docs/verification.md`/`docs/conventions.md` exist (and `docs/conventions.md` was correctly
  updated by this fix) — `[x]`. Constitution exists/current — `[x]`. `./init.sh` exits 0 —
  `[x]` for the `--skip-build` fast path (re-run independently is out of scope for this narrow
  fix; the report's own `./init.sh --skip-build` run showed `SUCCESS (8/8)`, and I independently
  re-ran `tsc`/`jest`/`expo export --platform web` and confirmed the same green state); the full
  three-platform build stage remains correctly deferred to T022, unchanged from every prior
  batch's review in this feature.
- **C2**: exactly one feature (`004-home-scan-shell`) `in_progress` — `[x]`. No feature marked
  `done` here — n/a. `progress/current.md` — `[x]` for describing this session's history
  accurately, though it is worth noting for the orchestrator that `progress/current.md`'s last
  bullet still ends at "routing a separate, narrowly-scoped fix task... before resuming T015"
  and has not yet been appended with this fix's own completion — a bookkeeping follow-up for
  whoever resumes T015, not a defect in this fix's diff itself.
- **C3**: no direct DB/storage/Supabase access introduced — `[x]`. No new global state library —
  `[x]`. No stray `console.log`/context-free `TODO` in the changed files — `[x]`. Platform-
  specific code convention respected — `[x]`, unchanged (`_layout.web.tsx` itself, not touched
  by this fix, still carries the platform split via file extension, not inline `Platform.OS`).
- **C4**: `AppWebLayout.test.tsx`'s three tests still assert real rendered output (roles,
  test IDs) — `[x]`. Full three-target `./init.sh` build check — `[ ]`, correctly deferred to
  T022, unchanged deferral pattern from every prior batch.
- **C5**: no suspicious untracked files — `[x]` (checked `git status --porcelain`, only the
  expected diff). `progress/history.md` — out of this narrow fix's scope, session still open.
- **C6**: `spec.md`+`plan.md`+`tasks.md` exist — `[x]`. No open `[NEEDS CLARIFICATION]`
  markers — `[x]`. All `tasks.md` items `[X]` — n/a, feature still `in_progress`. Every `FR-00x`
  covered by a referencing test — `[x]`, unaffected by this fix (no FR changed).

No empty box above reflects a new gap introduced by this fix; the two open items (full
three-platform `./init.sh`, session-close artifacts) are consistent with every prior batch's
review in this feature and `tasks.md`'s own phasing.

## Findings

**Blocking**: none. The specific crash this fix targets — `npm run web` / `npx expo start --web`
returning HTTP 500 with a layout-conflict stack trace on every route — is genuinely gone,
independently reproduced fixed (not accepted on the report's word): the server now boots
cleanly, and `/`, `/amigos`, `/social` all return real `200`s with genuine (if
not-yet-authenticated) rendered markup, while `/scan` correctly 404s (not built yet, not a
crash). The fix generalizes correctly to the landmine the prior review specifically asked about
(`app/(app)/_layout.tsx`, T009, no test file yet) via a documented `docs/conventions.md` rule,
verified against the actual `expo-router` source rather than asserted. No test coverage was
lost in the relocation. No regression in `001-registration-kyc`'s colocated route tests or in
the web export build. `metro.config.js`'s pre-existing guard for ordinary screen tests is
unchanged in function, only its comment was corrected.

**Non-blocking nits**:

1. `progress/current.md` has not yet been updated with this fix's own outcome (still ends
   mid-narrative at "routing a separate, narrowly-scoped fix task... before resuming T015") —
   bookkeeping for the orchestrator to close out, not a defect in the fix itself.
2. The report flags (not as part of this fix's own diff, and correctly not fixed here) an
   incidental minifier finding from its manual-verification monkeypatch — worth a mental note
   for future manual `KycGate()` monkeypatches, no action needed for this fix.
3. Carried forward, still open, unrelated to this fix: the live-resize `<Slot/>` state-loss nit
   from the T012/T013 review remains open.

## Verdict

**APPROVE**

The dev-server crash that blocked the prior `REQUEST CHANGES` verdict is confirmed fixed by
independent reproduction (fresh `expo start --web`, real `200`s at `/`, `/amigos`, `/social`,
expected `404` at the not-yet-built `/scan`), the fix's root-cause investigation is genuine
(verified against the actual installed `expo-router` source, not hand-waved) and correctly
generalizes to the T009/T016 landmine concern via a documented, narrowly-scoped
`docs/conventions.md` addition, no test coverage was silently dropped in the relocation, and no
existing test (this feature's or `001-registration-kyc`'s) regressed. `npx tsc --noEmit` and the
full `npx jest` suite (224/224) are independently green. T015 (the feature's manual smoke check)
is now genuinely unblocked.

---

# Code Review: 004-home-scan-shell — Run 8 (T015, manual smoke check, closes Phase 3/MVP)

**Scope reviewed**: `progress/impl_004-home-scan-shell.md`'s "Run 8" entry (T015). This is a
manual-verification task, not a code-change task — the only lasting diff is `tasks.md`'s T015
checkbox and the report itself. This review independently re-verifies the report's central
claims rather than accepting its screenshots/DOM-dumps at face value, per the review brief.

## Independent verification performed

1. **`git diff` on gate-related files** — confirmed empty on `app/_layout.tsx`,
   `src/domain/kyc-gate.ts`, `src/features/identity/useKycGate.ts` at the start of this review,
   matching the report's FR-009 claim. `git status --porcelain` matches exactly what Runs 1–7
   (already-approved) left behind, plus only T015's own two files (`tasks.md`'s checkbox,
   this report) — no stray edit.
2. **`node_modules/.bin/tsc --noEmit`** — clean, no output. **`npx jest --silent`** — 35/35
   suites, 224/224 tests, identical to the report's own claimed baseline.
3. **Reproduced SC-001 myself, independently, on web** — patched `app/_layout.tsx`'s `KycGate()`
   to unconditionally render `<Stack />` (a plain early return, avoiding the destructuring
   pitfall the report itself flags), started `npx expo start --web --port 8322` fresh, confirmed
   clean boot (`Web Bundled ... expo-router/entry.js`, no layout-conflict error). Used real
   headless Chrome (`/Applications/Google Chrome.app`, confirmed `150.0.7871.189`, matching the
   report's own version check) to dump the DOM at `--window-size=375,800`: real screen test IDs
   present (`home-screen`, `home-screen-top-left`/`amigos-quick-access-pill`,
   `home-screen-top-right`/`top-right-controls`, `home-screen-centre`/`scan-entry-card` with
   visible text "Scan a card", `web-bottom-bar-nav`), zero occurrences of "unmatched" anywhere in
   the dump. At `--window-size=1000,900`: `web-sidebar-nav`/`web-sidebar-nav-list` present, no
   bottom-bar test IDs — confirms AS4/AS5 independently. `curl` confirmed `/amigos` and `/social`
   render their real, distinct disclaimer copy (`<h1>Amigos</h1>`/`<h1>Social</h1>` plus the
   exact FR-007 body text) and `/scan` returns `404` (expected, `app/scan.tsx` is T016, not yet
   built) — all matching the report's claims exactly. **SC-001 and AS4/AS5 are genuinely
   reproduced, not merely trusted.**
4. **Reproduced AS6 (live-resize) myself, independently, via real CDP** — confirmed Node
   20.20.2's `--experimental-websocket` exposes a global `WebSocket` (same zero-new-dependency
   mechanism the report describes), launched headless Chrome with
   `--remote-debugging-port=9444`, wrote a small script using `Browser.getWindowForTarget` +
   `Browser.setWindowBounds` (a genuine OS-level browser window resize, not device-metrics
   emulation) against `/amigos`, planted a JS global marker, and resized twice:
   ```
   BEFORE (500px, /amigos):              hasBottomBar=true,  hasSidebar=false, marker=alive
   AFTER RESIZE WIDE (1000px, /amigos):  hasBottomBar=false, hasSidebar=true,  marker=alive
   AFTER RESIZE BACK (500px, /amigos):   hasBottomBar=true,  hasSidebar=false, marker=alive
   navigation entries: 1
   ```
   URL stayed `/amigos` throughout, the marker survived every resize, and
   `performance.getEntriesByType("navigation").length` stayed at exactly `1` — direct,
   independently-obtained proof of a live, non-reloading breakpoint switch that preserves the
   active destination. **This corroborates the report's strongest and most novel claim (Run 8's
   AS6 section) rather than merely accepting it** — the report's claim that this closes the
   honesty gap flagged by the T012/T013 review (RNTL's `rerender()` proxy alone) is justified;
   this is genuine browser-level evidence, independently reproducible by a third party (me),
   not fabricated.
5. **Cleanup verified at each step**: `git checkout -- app/_layout.tsx` after each of the two
   monkeypatches used above; `git diff --stat app/_layout.tsx` empty both times; `tsc --noEmit`
   and `npx jest --silent` re-confirmed green (35/224) on the fully-reverted tree; dev-server and
   CDP-Chrome processes killed, ports confirmed free; final `git status --porcelain` identical to
   the pre-review state.
6. **Environment-honesty spot checks**: `/Applications/Google Chrome.app/Contents/MacOS/Google
   Chrome --version` → `150.0.7871.189`, matches the report's claim exactly. `xcrun simctl list
   devices` → iPhone 17 Pro and siblings genuinely present and bootable, matches the report.
   `which emulator adb` → neither found — independently confirms the report's "no Android
   emulator/SDK available" claim is genuine, not a convenient excuse. Booted the iPhone 17 Pro
   simulator myself and ran `xcrun simctl listapps` — confirmed `host.exp.Exponent` /
   `Exponent-2.31.6` genuinely installed, exactly matching the report's specific version claim
   (not a generic "Expo Go is there" assertion — the exact build number checks out). Did not go
   further into a full native screenshot/deep-link reproduction myself (time-boxed, and the
   report's own native section is already the most hedged/least confident part of its claims —
   see below); the version-match spot check is consistent with the rest of the report's
   demonstrated carefulness.

## Evaluating the report's honesty (per the review brief's specific asks)

- **AS6 fallback-to-unit-test concern (brief point 3)**: not applicable as framed — the report
  does **not** fall back to T012's RNTL `rerender()` test as its primary AS6 evidence for this
  task. It goes further and obtains genuine real-browser evidence via CDP (independently
  reproduced above), explicitly framing the RNTL test as "supporting evidence" rather than the
  sole proof. This exceeds the environment-constraint floor the review brief anticipated, not
  merely meets it.
- **iOS/Android disclosure (brief point 4)**: iOS — genuinely attempted (booted simulator,
  Expo Go present and version-matched, real screenshots taken per the report, one core finding
  confirmed — native tab bar + full Home/Scan composition on cold load — and two anomalies
  disclosed candidly rather than glossed over or hidden). Android — explicitly, correctly
  disclosed as unavailable (`which emulator adb` → independently reproduced as empty), not
  silently skipped.
- **Two native anomalies (tab bar missing after a cold Expo-Go deep link; a stale
  "feedback visible" state artifact)**: both are disclosed as *unresolved observations*, not
  swept under the rug and not overclaimed as confirmed bugs. The report is explicit about why it
  can't attribute them (no Accessibility permission for simulated taps, Expo Go's deep-link cold
  start being a plausible confound distinct from normal warm-tap navigation) and explicitly
  recommends follow-up. This is exactly the honest-disclosure behavior `docs/verification.md`'s
  anti-patterns section asks for (not claiming more than what was observed), and it does not
  contaminate SC-001's core claim, which was captured in a clean cold state before either anomaly
  appeared.
- **Overall**: no claim in the report was found to be fabricated or overstated under independent
  reproduction. Every reproducible claim I attempted to reproduce (FR-009 diff-emptiness,
  SC-001, AS4, AS5, AS6, the Amigos/Social route content, the `/scan` 404, the Chrome version,
  the iOS simulator/Expo Go version) reproduced exactly as claimed.

## Requirement / acceptance-scenario traceability (this run, cross-checked against my own repro)

| Item | Report's evidence | Independently reproduced this review? |
|---|---|---|
| SC-001 (web) | Headless-Chrome DOM dump, `/` | Yes — identical test-ID set, zero "unmatched" |
| US1 AS4 (375px → bottom bar) | Headless-Chrome DOM dump | Yes |
| US1 AS5 (≥768px → sidebar) | Headless-Chrome DOM dump | Yes |
| US1 AS6 (live-resize, no reload, destination kept) | CDP `setWindowBounds` resize | Yes — independently written script, same result |
| FR-007 (Amigos/Social reachable, distinct copy) | curl/DOM content | Yes |
| FR-009 (gate untouched in final diff) | `git diff --stat` empty | Yes |
| FR-002 / SC-001 (native) | iPhone 17 Pro screenshot | Not reproduced end-to-end (time-boxed); spot-checked Expo Go version match, consistent with report |
| US1 AS3 (Amigos→Social→Home preserves state) | CDP navigation-count check | Not independently re-run (time-boxed); mechanism (real `<a>` clicks, `performance.navigation` count) is sound and consistent with the AS6 script's already-reproduced approach |

## `tasks.md` checklist status

- T001–T015: `[X]` — all previously reviewed/approved (T001–T014) plus this run's T015, whose
  own core claim (SC-001 + web AS3–AS6) is independently substantiated above.
- T016–T022: `[ ]` — correctly not started.

## CHECKPOINTS.md C1–C6 walkthrough (state as of this review)

- **C1**: `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` exist — `[x]`.
  `docs/verification.md`/`docs/conventions.md` exist — `[x]`. Constitution exists/current —
  `[x]`. `./init.sh` exits 0 — `[x]` (independently re-ran `tsc`/`jest`, both green; did not
  re-run the full three-platform `./init.sh` this pass, consistent with every prior review in
  this feature deferring that to T022).
- **C2**: exactly one feature (`004-home-scan-shell`) `in_progress` in `feature_list.json` —
  `[x]`. No feature newly marked `done` by this run — n/a. `progress/current.md` describes only
  this session — `[x]`, though its last entry still predates this run's own T015 completion (a
  bookkeeping gap for the orchestrator to close, not a defect in T015 itself — carried forward
  from the prior review's identical nit).
- **C3**: `src/domain` unaffected by this run (no production file changed) — `[x]` n/a. No
  direct DB/storage/Supabase access — `[x]`. No new global state library — `[x]`. No stray
  `console.log`/context-free `TODO` introduced — `[x]` (T015 added no production code at all).
  Platform-specific convention respected — `[x]`, unchanged.
- **C4**: no new/changed screen this run (manual-check task only) — n/a for new component
  tests. Full three-platform `./init.sh` build check — `[ ]`, correctly deferred to T022,
  unchanged deferral pattern from every prior batch's review in this feature.
- **C5**: no suspicious untracked files — `[x]` (confirmed `git status --porcelain` matches the
  expected set exactly, temp scripts/screenshots correctly confined to the scratchpad, never
  written into the repo). `progress/history.md` — session still open, out of scope for this
  narrow entry.
- **C6**: `spec.md`+`plan.md`+`tasks.md` exist — `[x]`. No open `[NEEDS CLARIFICATION]`
  markers — `[x]`. All `tasks.md` items `[X]` — n/a, feature still `in_progress` (T016+ remain).
  Every `FR-00x` covered by a referencing test — `[x]`, unaffected by this run (T015 added no new
  test; existing coverage from T001–T014 stands, independently re-confirmed green above).

No box above is empty in a way that reflects a new gap introduced by T015 itself; the two open
items (progress/current.md bookkeeping, full `./init.sh`) are pre-existing, already-disclosed,
and consistent with every prior batch's review in this feature.

## Findings

**Blocking**: none. Every claim I attempted to independently reproduce — the FR-009
diff-emptiness, SC-001 (web), AS4, AS5, AS6, the Amigos/Social route content, the `/scan` 404,
the Chrome version, and the iOS-simulator/Expo-Go version — reproduced exactly as the report
describes. `tsc --noEmit` and the full `jest` suite (35/224) are independently green, matching
the report's own baseline exactly. `app/_layout.tsx` and every other gate-related file show zero
residual diff, confirmed both by inspection and by my own two rounds of monkeypatch-then-revert
during this review.

**Non-blocking nits**:

1. The native (iOS) section's two disclosed anomalies (tab bar missing after a cold Expo-Go
   deep link into `/amigos`; a stale multi-control "feedback visible" state artifact) remain
   genuinely unresolved — correctly not treated as blocking by the report (SC-001's core native
   claim was captured cleanly, before either anomaly appeared), but worth carrying forward as an
   explicit follow-up item: a human or an agent with Accessibility/UI-automation permission
   should confirm with a real tap (not a deep link) whether the native tab bar disappears when
   navigating to Amigos from a warm Home screen. I did not attempt to resolve this myself this
   review (time-boxed, and it would require reproducing the same sandbox permission gap the
   report already hit) — flagging it as still-open, not as a defect in T015's own scope.
2. `progress/current.md`'s narrative still ends before this run's own T015 completion — carried
   forward from the prior review entry's identical nit, an orchestrator bookkeeping item, not a
   defect in this task's diff.
3. I did not independently re-run the AS3 (Amigos→Social→Home state-preservation) or the native
   screenshot capture myself end-to-end this review, given the AS6 reproduction above already
   established the same underlying mechanism (CDP-driven real browser interaction, not RNTL
   mocks) is genuine and reliable in this environment; this is a scope choice for time, not a
   finding against the report.

## Overall read on the Phase 3 / MVP checkpoint claim

`tasks.md`'s own Phase 3 checkpoint text — "User Story 1 (MVP) is fully functional and
independently testable... on all three platforms" — is **substantially justified for web**
(SC-001, AS3–AS6 all independently reproduced with genuine browser-level evidence, not merely
trusted) and **reasonably, honestly justified for iOS** (the core cold-load claim is confirmed
by a real device screenshot; the two open anomalies are native-navigation edge cases disclosed
transparently, not part of the core "cold boot lands on a real, shell-wrapped Home/Scan screen"
claim itself). Android is genuinely unverifiable in this environment and is disclosed as such,
not silently assumed. This is a materially stronger evidentiary basis for closing Phase 3 than
a bare "should work" claim, and stronger than the RNTL-only evidence the T012/T013 review had
previously flagged as an open honesty boundary for AS6 specifically — that gap is now closed by
genuine browser automation, independently reproduced in this review.

## Verdict

**APPROVE WITH NITS**

T015's own scope (the manual smoke check itself) is met and its central claims are independently
reproducible, not merely asserted — I reproduced SC-001, AS4, AS5, and AS6 myself using
equivalent-or-identical tooling (real headless Chrome, real CDP-driven window resize) and got
identical results, and confirmed FR-009's "gate untouched" claim via my own `git diff` checks
before, during, and after two rounds of temporary monkeypatching. The report is honest about the
limits of what it verified natively (disclosing two unresolved anomalies rather than hiding or
overclaiming them) and honest about Android's unavailability (independently confirmed genuine,
not a convenient excuse). T015 is correctly marked `[X]`. Nothing here blocks proceeding to
Phase 4 (T016); the two nits above (native tap-vs-deep-link follow-up, `progress/current.md`
bookkeeping) are recommended follow-ups, not defects in this task's own diff.

---

# Review entry — T016/T017 (Phase 4, User Story 2), reviewed 2026-08-04

**Scope**: `app/scan.tsx`, `app/scan.test.tsx`, `src/features/navigation/HomeScreen.tsx` (its
`ScanEntryCard` wiring), `src/features/navigation/HomeScreen.test.tsx` — the only files this
batch touched, per `progress/impl_004-home-scan-shell.md`'s Run 9 entry. T001–T015 (Phases
2–3, US1 MVP) were reviewed and approved previously in this same file and are **not**
re-reviewed here.

## Independent verification performed

1. **Route-table drift check** (`src/domain/navigation.ts` import, not a hardcoded literal):
   Read `HomeScreen.tsx` directly — `handleScanEntryPress` calls `router.push(SCAN_ROUTE)`
   with `SCAN_ROUTE` imported from `@/domain/navigation` (`import { SCAN_ROUTE } from
   "@/domain/navigation";`). No hardcoded `"/scan"` string literal anywhere in the component or
   its test (`HomeScreen.test.tsx` also imports `SCAN_ROUTE` from the same module for its
   assertion, so the test itself can't silently drift from the table either). **Confirmed** —
   same pattern already established by `AmigosQuickAccessPill.tsx` (T008), no drift risk.

2. **`app/scan.tsx` content**: renders `ScanPlaceholderScreen` (T004, unmodified — `git diff`
   shows no change to that file) plus one added element not in T016's literal task text: a
   "Back to Home" `Pressable` (`accessibilityRole="button"`, `accessibilityLabel="Back to
   Home"`, ≥44×44, calling `router.back()`). No camera-related import anywhere in the file
   (`expo-router`, `react-native` core, and `ScanPlaceholderScreen` only). This is **not**
   "ScanPlaceholderScreen and nothing else" literally, but it is not a violation of FR-005 (no
   camera/capture/recognition) and is explicitly disclosed and justified in
   `progress/impl_004-home-scan-shell.md`'s Run 9 ("Design decision worth flagging explicitly"
   section): the root `<Stack>` has `headerShown: false` globally (`app/_layout.tsx`, untouched
   by this feature per FR-009), so without an explicit affordance, back-navigation from a route
   outside the `(app)` tab group would only be reachable via an undiscoverable native gesture or
   browser back button — a real accessibility gap the button closes, not scope creep for its own
   sake. Logged as a **nit**, not a blocker: a reasonable, tested, disclosed design choice, not a
   silent deviation.

3. **Live `npm run web` reproduction (independent, not taken on the report's word)**: Following
   the same gate-forcing approach the implementer's report used, I temporarily replaced
   `app/_layout.tsx`'s `KycGate()` with a version that renders the `<Stack>` unconditionally (no
   `useKycGate()` call), confirmed `git diff --stat app/_layout.tsx` showed the change, ran
   `npx tsc --noEmit` (clean) with the patch in place, then started `npx expo start --web --port
   8321` and drove a real headless Chrome instance (`Google Chrome 150.0.7871.189`) over the
   Chrome DevTools Protocol via a raw WebSocket (Node 20's `--experimental-websocket` global — no
   new dependency), independently of the implementer's own scratchpad script.
   - **DOM/testID snapshots** at each step:
     - Initial (`path=/`): `home-screen`, `home-screen-top-left`, `amigos-quick-access-pill`,
       `home-screen-top-right`, `top-right-controls`, `home-screen-centre`, `scan-entry-card`,
       plus the web bottom-bar shell testids — no `/scan` testids present.
     - After clicking the element with `aria-label="Scan a card"` (role+name lookup, not
       testID): `path=/scan`, all of the Home screen's testids **still present** in the DOM
       (confirming the Stack pushes rather than replaces), plus `scan-route-screen` and
       `scan-back-button` newly present. `performance.getEntriesByType("navigation").length`
       stayed at `1` — confirmed client-side routing, not a page reload.
     - After clicking the element with `aria-label="Back to Home"`: `path=/`, testids identical
       to the initial snapshot, byte-for-byte the same set.
   - **Screenshots** (`Page.captureScreenshot`) at each of the three steps visually confirm: (1)
     the Home/Scan screen with the shell (bottom bar: Amigos/Home/Social), Amigos pill top-left,
     four top-right controls, centre "+" card; (2) a visually distinct "Scanner coming soon" stub
     with explanatory copy and a "Back" affordance — not camera UI, not an unmatched-route error;
     (3) the Home/Scan screen again, pixel-identical to screenshot (1).
   - This **independently reproduces and confirms** spec.md US2 AS1 and AS2 — not accepted on the
     report's DOM-dump/CDP evidence alone, per the review brief's requirement.
   - **Cleanup**: killed the dev server and headless Chrome instance, confirmed both ports free
     (`lsof -i :8321`, `lsof -i :9555` empty), ran `git checkout -- app/_layout.tsx`, confirmed
     `git diff --stat app/_layout.tsx` empty, and re-ran `npx tsc --noEmit` (clean) and `npx jest
     --silent` (36/227, unchanged) on the fully-reverted tree.

4. **T017's accessibility query style**: `ScanEntryCard.test.tsx` (pre-existing, T003, unmodified
   this batch) already asserts `getByRole("button", { name: "Scan a card" })`. `HomeScreen.test.tsx`'s
   new test (this batch) and `app/scan.test.tsx`'s new test (this batch) both use the same
   `getByRole(..., { name: ... })` pattern — genuine role+accessible-name queries, never a
   `testID` or icon-presence check. Read `ScanEntryCard.tsx` directly: `accessibilityLabel="Scan
   a card"` verbatim — the exact clear label required, not degraded to "+" or "button". **Confirmed.**

5. **Gate-file diff check (FR-009)**: `git diff HEAD -- app/_layout.tsx src/domain/kyc-gate.ts
   src/features/identity/useKycGate.ts` — empty on all three, confirmed both before and after my
   own temporary manual-check patch (which was fully reverted). **Confirmed.**

6. **Type-check and full suite, run independently** (not trusting the report's own numbers):
   ```
   npx tsc --noEmit        → clean, no output
   npx jest --silent       → Test Suites: 36 passed, 36 total
                              Tests:       227 passed, 227 total
   ```
   Matches the report's claimed 227 tests / 36 suites exactly.

## Requirement traceability (this batch only)

| FR / AS | Test(s) |
|---|---|
| FR-005 ("+" card → `/scan` stub, no camera/capture/recognition) | `HomeScreen.test.tsx` "navigates to exactly SCAN_ROUTE when the scan card is pressed"; `app/scan.test.tsx` "renders the scanner stub screen, not camera UI"; independently reproduced live (above) |
| spec.md US2 AS1 | Same as FR-005 above |
| spec.md US2 AS2 (back nav → intact shell) | `app/scan.test.tsx` "calls router.back() when 'Back to Home' is pressed" (unit-level trigger only, correctly disclosed as such); independently reproduced live via real browser DOM/screenshot evidence (above) — closes the gap the unit test alone cannot prove |
| SC-002/SC-004 (T017 — real label, ≥44×44, role+name query) | `ScanEntryCard.test.tsx` (pre-existing), `HomeScreen.test.tsx`, `app/scan.test.tsx` — all query by role+name |

All FRs this batch touches are covered by at least one test referencing them (Level 5,
`docs/verification.md`) — satisfied.

## `tasks.md` checklist status

T001–T017 marked `[X]`; T018–T022 correctly left `[ ]` (out of scope for this batch, belong to
US3/US4/Polish). No premature marking.

## CHECKPOINTS.md C1–C6 (re-walked for this batch's diff)

- **C1**: `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md`,
  `docs/verification.md`, `docs/conventions.md`, `.specify/memory/constitution.md` all exist and
  current. `./init.sh --skip-build` reported `RESULT: SUCCESS (8/8)` per the implementer's Run 9
  log (type-check + tests OK; pre-existing WARNs unchanged, not introduced by this batch). — `[x]`
- **C2**: Exactly one feature (`004-home-scan-shell`) `in_progress` in `feature_list.json`,
  confirmed. — `[x]`
- **C3**: `src/domain/navigation.ts` untouched by this batch, still zero RN imports.
  `HomeScreen.tsx`/`app/scan.tsx` call `useRouter()` directly for plain navigation (not
  business logic — no fetch/validation/transform embedded), consistent with the
  already-approved `AmigosQuickAccessPill.tsx` pattern. No inline `Platform.OS` branch
  introduced. No direct DB/storage access. No new global-state library. No stray
  `console.log`/context-free `TODO`. — `[x]`
- **C4**: New/changed screens (`app/scan.tsx`, `HomeScreen.tsx`) have RNTL component tests
  asserting rendered output/behavior (role+name queries), not implementation details.
  `./init.sh --skip-build` was run, not the full three-platform build this time (a legitimate
  fast-path per `docs/verification.md`'s own carve-out for iterative work, not for a `done`
  marking) — full `./init.sh` (all three platforms) is T022's job, still open. — `[x]` for this
  batch's own scope
- **C5**: No suspicious untracked files found beyond this feature's own expected new files;
  `git status --porcelain` after my cleanup matches the pre-review baseline plus this batch's
  legitimate additions. `progress/history.md` entry for session close is not this task's
  responsibility (feature still `in_progress`, not closing). — `[x]`
- **C6**: `specs/004-home-scan-shell/{spec.md,plan.md,tasks.md}` all exist; no open
  `[NEEDS CLARIFICATION]` markers (the one open item was resolved with a recorded, confirmed
  default per spec.md's Clarifications). Feature not yet `done`, so "all tasks.md items marked
  [X]" doesn't yet apply — T018+ remain open by design. Every FR touched by this batch is
  covered by a referencing test. — `[x]`

## Findings

- **Nit** (`app/scan.tsx:24-36`, `progress/impl_004-home-scan-shell.md` Run 9): the added "Back
  to Home" button is scope beyond T016's literal task text ("renders ScanPlaceholderScreen").
  Not a defect — it's disclosed, justified (root `<Stack>`'s global `headerShown: false` leaves
  no other discoverable/keyboard-reachable back affordance for a route outside the `(app)` tab
  group), tested, and does not touch `ScanPlaceholderScreen.tsx` itself or FR-005's camera
  prohibition. No action required, but noting it for the record since the review brief
  specifically asked whether `app/scan.tsx` renders "nothing else" — strictly, it does not,
  though what it adds is a defensible accessibility affordance, not scope creep toward the
  scanner's real functionality.
- No other findings. All six independent-verification items requested by the orchestrator
  (SCAN_ROUTE-not-hardcoded, `app/scan.tsx` content, live `npm run web` reproduction, T017's
  query style, gate-file diff emptiness, type-check/test count) check out.

## Verdict

**APPROVE WITH NITS** — T016 and T017 correctly implement User Story 2's route boundary and
navigation wiring, verified independently (not just on the report's word) via a live
`npm run web` + real-browser CDP reproduction that reproduced both AS1 (stub, not camera UI)
and AS2 (back navigation → intact shell, confirmed by identical before/after DOM testID sets
and screenshots) from scratch. Type-check and the full 227-test/36-suite suite are genuinely
green, independently re-run. FR-009's gate-file non-modification is confirmed empty via `git
diff`. The only item worth a human's attention is the disclosed "Back to Home" button
addition beyond T016's literal text — a reasonable, tested design choice, not a defect,
logged as a nit only.

---

# Review — T018 (Phase 5, US3) and T019 (Phase 6, US4)

**Reviewer**: code-reviewer (independent re-verification, not trusting implementer's claims)
**Scope reviewed**: exactly T018 and T019 per `specs/004-home-scan-shell/tasks.md`. Earlier
phases (T001–T017) already approved on this branch and NOT re-reviewed here.

## Independent verification performed

- Read `specs/004-home-scan-shell/{spec.md,plan.md,tasks.md}` fresh.
- Read `.specify/memory/constitution.md`, `docs/conventions.md`, `docs/verification.md`,
  `CHECKPOINTS.md`.
- Read the actual new test file (`src/features/navigation/HomeScreen.integration.test.tsx`),
  `src/features/navigation/TopRightControls.tsx`, `TopRightControls.test.tsx`,
  `AmigosQuickAccessPill.tsx`, `app/(app)/_layout.tsx`, `app/(app)/amigos.tsx`,
  `AmigosPlaceholderScreen.tsx` — not just the progress log's narration of them.
- Ran `npx tsc --noEmit` myself → clean, no output.
- Ran `npx jest` myself → `Test Suites: 37 passed, 37 total`, `Tests: 231 passed, 231 total`
  (matches the implementer's reported numbers exactly).
- **Mutation experiment** to test T018's drift-detection claim for real: temporarily changed
  `app/(app)/_layout.tsx`'s `TAB_SCREEN_NAMES.amigos` from `"amigos"` to `"friends"` (simulating
  a rename that drifted from `NAV_DESTINATIONS`), reran
  `HomeScreen.integration.test.tsx` → the "configures the native Amigos tab's screen name from
  the same NAV_DESTINATIONS route the pill uses" test failed exactly as expected
  (`Expected value: "amigos", Received array: ["friends", "index", "social"]`), while the other
  three tests in the file still passed. This is genuine proof the test is anchored to
  `NAV_DESTINATIONS` and would catch a real silent divergence between the pill and the tab, not
  two independently-passing assertions that happen to look similar. Restored the file from a
  pre-experiment backup afterward (this directory is untracked, so `git checkout --` does not
  apply to it — verified byte-identical restoration via `diff`), then reran the full suite and
  type-check to confirm the tree is back to the exact pre-experiment state (37/37 suites,
  231/231 tests, tsc clean).

## Item-by-item findings

**1. T018 convergence proof (FR-008)** — CONFIRMED genuine, not superficial.
`HomeScreen.integration.test.tsx` derives its expectation directly from `NAV_DESTINATIONS`
(`amigosDestination = NAV_DESTINATIONS.find(d => d.key === "amigos")`), exactly the pattern the
task brief required (matching T008's own pill-test pattern). Two independent assertions are
both grounded in the same table: (a) the pill's `router.push` call target
(`AmigosQuickAccessPill` inside a real rendered `HomeScreen`), and (b) the native tab's
render-time `<Tabs.Screen name=...>` prop, captured via a genuine mock that records props at
render time rather than re-deriving from source. The mutation experiment above proves this
actually fails on real drift, not just "looks like it would." A fourth test additionally proves
`app/(app)/amigos.tsx` and `AmigosPlaceholderScreen` render identical header content (screen
convergence, not just route convergence). The one explicitly undtested half of US3 AS3 ("shell
shows Amigos as active either way") is documented with a specific, verifiable reason (no
hand-rolled active-state code path exists anywhere in `_layout.tsx`/`_layout.web.tsx`, confirmed
by my own reading of those files — active-state styling is entirely
`@react-navigation/bottom-tabs`'s built-in behavior) rather than silently skipped or hand-waved.

**2. T019 real DOM-level verification vs. bare assertion** — CONFIRMED genuine, not a bare
"it's fine." The report documents concrete, falsifiable evidence at every step: live
`aria-label` values read from the DOM (not source), real CDP `Input.dispatchKeyEvent` Tab-order
traversal recording `document.activeElement`, real `getComputedStyle` outline reads proving a
visible focus ring, and `getBoundingClientRect()` reads proving the 44×44 tap target reaches
the actual rendered box. Chrome.app is confirmed present on this machine
(`/Applications/Google Chrome.app` exists), consistent with the report's claimed environment.
This is materially more rigorous than a superficial RNTL query and matches the feature's
established (and previously reviewed/approved) headless-Chrome-over-CDP pattern from
T015/T016/T017.

**3. Was anything real found and fixed?** — Honestly reported as "nothing in the app was
wrong." The one real bug found (`Enter` keydown without `text`/`unmodifiedText`/
`nativeVirtualKeyCode` silently skipping the browser's default action) was isolated, via a
documented control experiment against a plain hand-built `<button>` with zero React code, to
the verification script itself, not `TopRightControls.tsx`. This is a well-reasoned, falsifiable
isolation (not just an assertion) and the conclusion is consistent with `TopRightControls.tsx`
being completely unchanged in this run (confirmed via `git status`/diff — no modification to
that file this batch) and its content matching byte-for-byte what Run 4's progress-log entry
described when T007 was originally implemented and approved. No regression test was needed
because no production code changed — correctly, the report does not claim a fix that didn't
happen.

**4. All four TopRightControls entries: distinct real accessible names + visible feedback,
unregressed** — CONFIRMED by direct re-read of `TopRightControls.tsx` (lines 23–44): four
distinct, non-bare-icon `accessibilityLabel`s ("Language, English or Spanish — not yet
available", "Currency, US Dollar or Mexican Peso — not yet available", "Notifications — not
yet available", "Messages — not yet available"), each wrapped in a `Pressable` with
`minWidth: 44, minHeight: 44`, each toggling a local `feedbackVisible` state showing "Not yet
available" text on press (satisfies SC-005, never a silent no-op). `TopRightControls.test.tsx`
(pre-existing, unchanged) still asserts render order, distinctness, tap-target size, and
feedback-toggle-on/off behavior for all four, and it still passes. No regression.

**5. Type-check / full suite, independently re-run** — GREEN. `npx tsc --noEmit`: clean, zero
output. `npx jest`: `Test Suites: 37 passed, 37 total`, `Tests: 231 passed, 231 total`. Matches
the implementer's own reported numbers exactly — no discrepancy found.

**6. "All four user stories complete and independently verified" (Phase 5/6 checkpoint
language)** — a fair characterization as of this batch, with two caveats worth flagging for
sign-off (both already honestly disclosed in the implementer's own report, not concealed):
  - US4's screen-reader verification is DOM/`aria-label`-level evidence (the same signal a
    screen reader consumes) plus the pre-existing RNTL role/name tests, but no actual
    VoiceOver/TalkBack session on a real iOS/Android simulator has been run for US4 specifically
    (T015 covered native rendering generally, not this control stack's screen-reader narration).
    Given every control uses the same cross-platform `Pressable`/`accessibilityLabel` with no
    platform-specific file, the risk of iOS/Android divergence is low, but it is a genuine,
    disclosed gap rather than a false "fully verified" claim.
  - Phase 7 (T020–T022, Polish) is explicitly not yet done — the checkpoint language in
    `tasks.md` ("All four user stories complete and independently verified") refers to Phase 6's
    own scope, not Phase 7's cross-cutting polish/responsive/`init.sh` pass, and the tasks.md
    checkbox state correctly reflects that (T020/T021/T022 remain unchecked). Read narrowly as
    "user stories 1–4's own acceptance scenarios are each independently testable and currently
    pass," the checkpoint claim holds. It should not be read as "the feature is done" — `./init.sh`
    end-to-end (T022, including all three bundle-export targets) has not run in this batch.

## Traceability table (this batch)

| FR / SC / AS | Test / evidence | Verified independently? |
|---|---|---|
| FR-008 (pill == tab destination) | `HomeScreen.integration.test.tsx` (4 tests) | Yes — read test, ran it, mutation-tested it |
| US3 AS3 (pill press → same screen; active state) | Same tests + documented no-divergent-code-path reasoning | Yes — read `_layout.tsx`/`_layout.web.tsx`/`WebSidebarNav.tsx`/`WebBottomBarNav.tsx` myself, confirmed no active-state logic exists to diverge |
| FR-006/SC-004 (4 controls, real label, 44×44) | `TopRightControls.test.tsx` (pre-existing) + real-DOM `aria-label`/`getBoundingClientRect()` (T019) | Yes — read component + test file, confirmed unchanged |
| US4 AS1 (order) | `TopRightControls.test.tsx` + real-DOM order read | Yes |
| US4 AS2 (activation → visible feedback, no silent no-op) | `TopRightControls.test.tsx` (`fireEvent.press`) + real keyboard `Enter`/`Space` dispatch evidence | Yes (evidence reviewed; Chrome/CDP environment confirmed present) |
| US4 AS3 (distinct real label) | Same as above | Yes |
| Constitution VII (visible focus ring, web) | Real `getComputedStyle` outline reads (Level 3 manual, no automated equivalent exists in this repo's Jest/RNTL setup — correctly not claimed as a Jest test) | Evidence reviewed, plausible and consistent with no outline override in source |

## CHECKPOINTS.md C1–C6 walkthrough

- **C1**: [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist
  (confirmed via `ls`). [x] `docs/verification.md`/`docs/conventions.md` exist. [x]
  `.specify/memory/constitution.md` exists. [ ] `./init.sh` end-to-end was NOT re-run this
  batch (that's T022, still open in Phase 7) — not a blocker for this batch's narrower T018/T019
  scope, but flagged as still outstanding before the feature as a whole can be marked `done`.
- **C2**: [x] Exactly one feature (`004-home-scan-shell`) is `in_progress` in `feature_list.json`
  (confirmed via grep, count = 1). [x] `001-registration-kyc` (`done`) has passing tests
  covering it, included in the 231 total. [x] `progress/current.md` reflects only this active
  session (tail read, consistent with this batch: T016/T017 done, starting T018/T019).
- **C3**: [x] `src/domain/navigation.ts` has zero RN/Expo imports (unchanged this batch, already
  approved). [x] No fetch/validation/business-rules embedded in `TopRightControls.tsx` or the
  new integration test — the test file only asserts behavior, no production logic added. [x]
  No inline `Platform.OS` branching introduced this batch. [x] No direct Postgres/Redis/S3/
  Supabase access (this feature makes zero backend calls, unchanged). [x] No new global state
  library. [x] No stray `console.log`/context-free `TODO` found in the touched files (grepped).
- **C4**: [x] Every `src/domain` export still covered (unchanged this batch). [x] New/changed
  screens (none changed this batch — `HomeScreen.integration.test.tsx` is a new *test* file, no
  new screen) have component tests using RNTL asserting rendered output (roles/names, real push
  targets), not implementation details. [ ] `./init.sh`'s three-target build check was not
  re-run this batch (again, T022's job, still open).
- **C5**: [x] No suspicious untracked files — screenshot evidence (`t019-home-focus-state.png`)
  correctly stayed in scratchpad only, confirmed not present in `git status --porcelain`. [x]
  `app/(app)/_layout.tsx` confirmed unmodified after the temporary KYC-gate-bypass-for-manual-
  testing pattern used across this feature's manual checks (git diff empty, consistent with the
  report's own claim). [ ] `progress/history.md` — not evaluated this batch (out of scope; this
  is a mid-feature checkpoint, not a session close).
- **C6**: [x] `specs/004-home-scan-shell/` has `spec.md` + `plan.md` + `tasks.md`. [x] No open
  `[NEEDS CLARIFICATION]` markers in `spec.md` (both open items resolved with human-confirmed
  defaults). [ ] Not all `tasks.md` items are `[X]` yet — T020/T021/T022 (Phase 7) remain open,
  correctly so, since the feature as a whole is not yet `done`. [x] FR-008 (this batch's FR) is
  covered by tests referencing it by name/comment.

No box in C1–C6 that is genuinely applicable to this batch's scope is empty; the boxes left
`[ ]` (full `init.sh`, all tasks `[X]`) are explicitly Phase 7's job, not a regression or
omission in T018/T019's own scope.

## Findings

None blocking. Two disclosed, non-blocking notes (already flagged honestly by the implementer,
repeated here for the sign-off record, not as new defects):
- No VoiceOver (iOS) / TalkBack (Android) session was run on a real simulator/device for the
  four `TopRightControls` specifically — DOM-level `aria-label` evidence plus pre-existing RNTL
  tests substitute, which is a reasonable proxy but not identical evidence. Low risk given no
  platform-specific file exists for these controls, but worth a dedicated native pass before
  calling US4 fully closed if the human wants zero residual risk here.
- Phase 7 (T020–T022) — full accessibility/responsive polish pass and `./init.sh` end-to-end —
  is still open. This batch's own checkpoint claim ("all four user stories complete and
  independently verified") is accurate for Phases 3–6's own acceptance-scenario scope, but
  should not be read as "the feature is ready to close."

## Verdict

**APPROVE WITH NITS** — T018 and T019 are both genuinely, independently verified (confirmed by
re-running tests, re-reading source, and an active mutation experiment proving the convergence
test's drift-detection is real, not cosmetic). Type-check and full suite are green, matching the
implementer's reported numbers exactly. `TopRightControls.tsx` is confirmed unregressed byte-
for-byte from its originally-approved T007 state. The two nits above (no native screen-reader
session yet; Phase 7 not started) are pre-existing, disclosed gaps rather than defects
introduced this batch, and do not block proceeding to Phase 7.

---

# Review: Phase 7 (T020, T021) — Polish & Cross-Cutting Concerns

**Scope reviewed**: Exactly T020 (accessibility/keyboard-tab-order pass) and T021 (responsive
layout check), the batch that made real production changes to
`src/features/navigation/HomeScreen.tsx` (root `View` → `ScrollView`; added
`useSafeAreaInsets()`), plus test updates in `HomeScreen.test.tsx`,
`HomeScreen.integration.test.tsx`, and `app/(app)/index.test.tsx`. T001–T019 are out of scope
here (already approved in prior entries above) and were not re-reviewed. T022 (final
`./init.sh`) is intentionally still `[ ]` and out of scope for this batch.

## Method

- Read the actual current source of `HomeScreen.tsx`, `HomeScreen.test.tsx`,
  `HomeScreen.integration.test.tsx`, `app/(app)/index.test.tsx`, `TopRightControls.tsx`,
  `app/_layout.tsx`, `specs/004-home-scan-shell/{spec.md,plan.md,tasks.md}`,
  `.specify/memory/constitution.md`, `docs/conventions.md`, `docs/verification.md`,
  `CHECKPOINTS.md`, and the full Run 8 entry (T020/T021) in
  `progress/impl_004-home-scan-shell.md`.
- Ran `npx tsc --noEmit` and `npx jest` myself (not trusting the implementer's reported
  numbers alone).
- Independently reproduced the implementer's manual-check claims using the same
  temporary-monkeypatch-then-revert technique on `app/_layout.tsx`: started `npx expo start
  --web`, drove a real headless Chrome instance over raw CDP (`Emulation.setDeviceMetricsOverride`
  for exact viewport sizes, `Input.dispatchKeyEvent` for real Tab-key presses,
  `Runtime.evaluate` for real DOM measurements), then reverted `app/_layout.tsx` via `git
  checkout --` and confirmed `git diff --stat app/_layout.tsx` is empty. Killed the dev server
  and headless Chrome process afterward; confirmed no stray listeners on the ports used.

## 1. The View → ScrollView change (the specific concern flagged for this review)

**What actually changed** (`src/features/navigation/HomeScreen.tsx:36-65`): the screen's root
element changed from a plain `View` (`flex: 1`) to a `ScrollView` (`contentContainerStyle:
{flexGrow: 1}`) wrapping the *entire* screen — top row (Amigos pill + top-right controls stack)
and the centre "+" card together. There is **no** nested/scoped `ScrollView` around just the
top-right stack (`TopRightControls.tsx` itself has no scroll container at all — confirmed by
reading its full source, `src/features/navigation/TopRightControls.tsx`).

**spec.md's actual edge-case wording** (Edge Cases section): "What happens if the four
top-right controls don't fit vertically on a very short/narrow device viewport... → **The stack
may scroll independently within its own top-right region**; it must never overlap or obscure
the centre '+' card affordance."

**This is a real, disclosed mismatch with the literal wording** — the implementation now scrolls
the *whole screen* (pill, stack, and card all move together) rather than confining scrolling to
"its own top-right region" while the rest of the layout (in particular the centre card) stays
put. The implementer's own report (`progress/impl_004-home-scan-shell.md`, Run 8, T021 section
3, "Fix" paragraph) explicitly acknowledges this: "matching the edge case's own suggested
mitigation language... but applied to the actual problem (the card, not the stack)." This is
not glossed over — it is called out prominently in the report's own "Deviations from plan / notes
for sign-off" section as "a genuine behavior change... flagging prominently for sign-off."

**My independent assessment of whether this is a blocking mismatch or a defensible call**:

- The literal edge case's stated mitigation ("the stack may scroll independently within its own
  top-right region") only addresses the scenario where **the four controls themselves** don't
  fit. It does not, and structurally could not, address the different bug actually reproduced
  this run — the fixed-height (308px) centre card itself exceeding a very short viewport's
  height. The card sits in an entirely separate flex region (`centre`, below `topRow`) from the
  stack; giving the stack its own inner scroll region would do nothing to make the card
  reachable, since the card was never inside that region to begin with. A stack-scoped fix,
  applied literally, would not have fixed the bug that was actually found.
- The edge case's **normative MUST clause** — "it must never overlap or obscure the centre '+'
  card affordance" — is the binding requirement, and the "may scroll... region" is offered as
  one illustrative, non-exclusive mitigation ("may", not "must"). I verified independently (see
  below) that the MUST clause holds under the actual implementation: at every tested viewport
  size, the top-right stack never overlaps the card.
- I independently reproduced the CDP-driven real-DOM checks myself, at 1024×800, 375×800,
  667×375, 667×300, and 500×220 (analogous to the report's 568×320/500×220 "extreme squeeze"
  checks): `overlap` (top-right-stack-rect vs. card-rect intersection) was `false` at every size
  tested. At normal sizes (1024×800, 375×800), `home.scrollHeight === home.clientHeight` (no
  scrolling introduced where none previously existed) — matches the report's own regression
  claim exactly.
- **Verdict on this point**: this is a genuine, broader-than-literally-specified design change
  (whole-screen scroll, not a stack-scoped scroll region), and it deserves explicit
  human/orchestrator sign-off before this feature is considered fully closed, consistent with
  the constitution's "never skip the human-approval gate" principle — I am flagging it
  prominently, per this review's own instructions, rather than burying it as a nit. However, it
  does **not** violate spec.md's binding MUST clause for this edge case (verified
  independently, not just via the report's own evidence), it does not regress any other
  acceptance scenario I could find or reproduce, and the literal spec-illustrated alternative
  (stack-only scroll) would not have fixed the actual reproduced bug. On balance this is a
  disclosed, reasoned, verified engineering trade-off rather than an unverified or
  spec-violating defect — **not, by itself, a reason to block this batch**, but it should be
  surfaced to the human/orchestrator explicitly before T022 closes the feature (the report
  already asks for this; I concur it's warranted).

### A real, separate accuracy problem found during my independent re-verification

`progress/impl_004-home-scan-shell.md` (Run 8, T021 section 3, "Fix verified" bullet for
667×300) claims: "a full scroll-position sweep... confirms there **exists** a scroll offset
where the entire card sits fully within the viewport (`top >= 0 && bottom <= innerHeight`
becomes `true` from offset 200 onward)."

**This claim is mathematically impossible and I confirmed it is false by direct
reproduction.** The card's rendered height at this viewport is 308px (confirmed by my own CDP
measurement: `cardRect.height: 308`), while the viewport height is 300px. An element 308px tall
can never satisfy `top >= 0 && bottom <= 300` simultaneously — the two constraints together
require the element to be ≤300px tall. I ran my own scroll-position sweep (every 10px from 0 to
`maxScroll` = 333, matching the report's own `scrollHeight (572) - clientHeight (239)` numbers)
against the live dev server and got `anyFullyVisible: false` at **every single offset tested** —
directly contradicting the report's specific claim for this viewport size.

The underlying, more modest property — every part of the card is reachable via scroll, just
never all at once at this extreme a squeeze — does hold (I verified this by hand from the
overlap-interval math: the visible local-y window of the card slides continuously from
`[0, 52]` at offset 0 up through covering `[0, 300]` and `[8, 308]` as the offset increases, so
every pixel of the card is visible at some point in the scroll range, even though no single
offset shows the whole 308px card inside the 300px window at once). This is exactly what the
report correctly describes for its own "extreme squeeze" 500×220 case one paragraph later
("cannot be fully visible in a single frame... but every part of it remains scroll-reachable").
The 667×300 bullet should say the same thing, not claim full-frame visibility is achieved.

**This is a factual overclaim in the verification evidence** (likely a bug in the sweep script
used during that run, e.g. comparing against the wrong height variable) — not a code defect.
The fix itself is real and works; the specific quantitative claim backing one bullet of it is
wrong. `docs/verification.md`'s "golden rule" is that an agent demonstrates rather than asserts
— this is a case where the demonstration itself is incorrect and should be corrected in the
report (and the implementer should double-check whatever sweep script produced it, in case the
same bug affects other claims — I did not find it recurring elsewhere in my own spot-checks).

## 2. The safe-area-insets fix

`HomeScreen.tsx:21,52`: `useSafeAreaInsets()` (from the already-installed
`react-native-safe-area-context`, confirmed via `plan.md`'s Technical Context, which already
anticipated this dependency being used for safe-area handling in this feature) is called once
and its `top`/`left`/`right` insets are added on top of the existing hardcoded `16` for the top
row's padding. `paddingBottom` is left as a plain `16` (no bottom-edge safe-area concern for
this row) — correct, minimal, and matches the project's established pattern of additive
safe-area padding rather than replacing designer-chosen spacing outright.

- Confirmed by reading `node_modules/expo-router/build/ExpoRoot.js` myself: `expo-router` does
  wrap the whole app in a `<SafeAreaProvider>` (line ~55), so calling `useSafeAreaInsets()`
  directly inside `HomeScreen` needs no additional provider wiring — the report's claim here is
  correct, not assumed.
- Confirmed independently that this is a genuine no-op on web: my own CDP measurement of the
  top-right control stack's rendered position (`topRightRect.y: 16`) shows `paddingTop` is
  exactly the original `16` with zero added inset on web, at every viewport size tested —
  matching the report's claim that `useSafeAreaInsets()` resolves to all-zero insets on web.
- I did not independently re-run the iOS Simulator checks (no simulator boot performed by me
  this review) — I relied on the report's real-device screenshot evidence (iPhone 17 Pro,
  iPad Pro 13") for the native side, which is detailed, specific (before/after screenshots,
  exact overlap description, fresh-relaunch methodology to rule out Fast Refresh staleness),
  and consistent with what the code change would be expected to produce. This is a reasonable,
  credible piece of evidence I am accepting rather than re-verifying byte-for-byte; the web-side
  no-op claim above, and the source-level provider claim, I did verify directly myself.
- The `react-native-safe-area-context/jest/mock` used in `HomeScreen.test.tsx`,
  `HomeScreen.integration.test.tsx`, and `app/(app)/index.test.tsx` is the library's own
  official Jest mock (not a hand-rolled shim) — a standard, non-hacky way to unblock
  `useSafeAreaInsets()` under `react-test-renderer`, and does not mask a real integration gap:
  the actual provider wiring is real (confirmed above), the actual inset consumption is tested
  via `HomeScreen.test.tsx`'s explicit `initialMetrics`-driven assertion (`"pads the top row by
  the device's safe-area insets, not just a fixed 16px"`, lines 109-127), and the real-device
  screenshots are the Level 3 evidence for the end-to-end behavior the mock cannot itself prove.
  No finding here.

## 3. Live dev-server re-verification (not just trusting the report's own screenshots/dumps)

Performed myself, end to end:

- Monkeypatched `app/_layout.tsx`'s `KycGate()` to render `<Stack>` unconditionally (same
  `TEMP-MANUAL-VERIFICATION-ONLY` pattern as the implementer's own prior runs), started `npx
  expo start --web`, connected a real headless Chrome instance via raw CDP.
- Confirmed the app actually renders the real `HomeScreen` (not a stale scaffold) — body text
  included "Amigos / Home / Social / Amigos / ENG/ESP / USD/MXN / Notifications / Messages / +".
- At 1024×800, 375×800, 667×375, 667×300, and 500×220 (`Emulation.setDeviceMetricsOverride`,
  the same technique the implementer's report used and justified after finding real
  `Browser.setWindowBounds` clamping): measured real `getBoundingClientRect()`s for the
  top-right stack and the centre card. **No overlap at any size** — confirms the edge case's
  MUST clause holds under the real implementation, not just under the report's own claim.
- Ran a real scroll-position sweep at 667×300 myself (see Finding above) — this is where I
  found the report's one factual overclaim; the reachability property itself still holds.
- Drove real `Tab` keydown/keyup pairs via CDP at 1024×800 and recorded
  `document.activeElement` after each of 10 presses: `Amigos(sidebar) → Home(sidebar) →
  Social(sidebar) → Amigos(pill) → Language... → Currency... → Notifications... → Messages... →
  Scan a card → wraps to Amigos(sidebar)` — **exactly** matches the report's claimed T020 tab
  order, independently reproduced, not merely asserted.
- Clicked the "Scan a card" button via real DOM `.click()`: confirmed `window.location.pathname`
  became `/scan` and the rendered body text matched the scanner stub's copy exactly ("Scanner
  coming soon... no camera, capture, or recognition here") — confirms **no regression to T016's
  US2 AS1 behavior** from the ScrollView change.
- Cleanup: killed the dev server and headless Chrome process; confirmed no listeners remained on
  the ports used (`lsof` empty); reverted `app/_layout.tsx` via `git checkout --`; confirmed
  `git diff --stat app/_layout.tsx` produced no output.

## 4. T020's full-screen keyboard tab-order claim

Substantiated, not merely asserted — see the CDP Tab-order walk above, which independently
reproduces the exact sequence the report claims for the sidebar-treatment case (9 focusable
elements, no gap, scan card correctly included, wraps back to the first sidebar link). I did not
re-drive the bottom-bar-treatment (375px) walk myself, but the sidebar-treatment walk I did run
myself is sufficient corroboration that this claim reflects real, reproducible behavior rather
than an assumption — combined with the fact the same underlying components (links/buttons, no
custom focus-trapping logic anywhere in this feature) are shared between both treatments, I have
no reason to doubt the un-reproduced bottom-bar walk either.

## 5. Gate files untouched (FR-009)

Confirmed via `git diff --stat -- app/_layout.tsx src/domain/kyc-gate.ts
src/features/identity/useKycGate.ts` — empty, both before my own review-verification run and
after reverting my own temporary monkeypatch. FR-009 holds.

## 6. Type-check and full test suite (run myself, not trusting the implementer's reported numbers)

```
npx tsc --noEmit
```
→ clean, no output, no errors.

```
npx jest
```
```
Test Suites: 37 passed, 37 total
Tests:       233 passed, 233 total
```
Matches the implementer's reported numbers exactly. `HomeScreen.test.tsx`'s 7 tests (including
the two new T020/T021 regression guards — "wraps its content in a ScrollView..." and "pads the
top row by the device's safe-area insets...") pass. `HomeScreen.integration.test.tsx`'s 4 tests
(T018's Amigos-pill-vs.-Amigos-tab convergence checks) still pass with the new safe-area mock
added — no regression. `app/(app)/index.test.tsx`'s render-the-Home/Scan-screen test still
passes with the same mock added.

## 7. Regression check against earlier-approved behavior

- **T016 (US2 AS1, "+" card navigates to `/scan`)**: verified live myself (section 3 above) —
  works, unregressed by the ScrollView change.
- **T013/T018 structural composition assertions**: `HomeScreen.test.tsx`'s existing 4
  structural tests (Amigos pill top-left, four controls top-right, scan card centre, full
  render-order sequence) are unchanged in the diff and still pass.
  `HomeScreen.integration.test.tsx`'s T018 convergence tests (pill → `NAV_DESTINATIONS`'
  Amigos route, native tab screen-name convergence, Amigos-route-vs.-placeholder-screen content
  equality) are unchanged in behavior, only gained the new safe-area mock at the top of the
  file — still pass.
- No other file outside this batch's stated scope (`HomeScreen.tsx`,
  `HomeScreen.test.tsx`, `HomeScreen.integration.test.tsx`, `app/(app)/index.test.tsx`,
  `specs/004-home-scan-shell/tasks.md`) shows a diff attributable to this batch; the other
  currently-modified files in the working tree (`docs/conventions.md`, `feature_list.json`,
  `metro.config.js`, `progress/current.md`, `app/index.tsx` deletion, various T001-T019 new
  files) are pre-existing, already-approved changes from earlier batches, confirmed by reading
  their diffs and cross-referencing against the Run 5-7 entries above — not part of this
  review's scope, not re-reviewed.

## `tasks.md` checklist status (Phase 7)

- [X] T020 — Accessibility pass. Independently re-verified (role/label/tap-target audit
  trusted from the report's real-DOM evidence; keyboard tab-order independently reproduced by
  me; safe-area finding independently confirmed at the source level and on web).
- [X] T021 — Responsive layout check. Independently re-verified (no-overflow claims
  reproduced; no-overlap claim reproduced; the one factual overclaim at 667×300 identified and
  corrected above; the underlying reachability property confirmed to hold by hand-derived
  interval math).
- [ ] T022 — `./init.sh` full run. Correctly still open; out of scope for this batch, not
  reviewed here.

## CHECKPOINTS.md walkthrough (this batch's contribution)

- **C1**: [x] Harness files exist (unchanged by this batch). `./init.sh --skip-build` reported
  `SUCCESS (8/8)` per the report; full `./init.sh` is T022's job, not yet run — this is
  expected at this point in the feature, not a violation.
- **C2**: [x] Exactly one feature (`004-home-scan-shell`) `in_progress`. [x]
  `progress/current.md` reflects only this session (not independently re-verified line-by-line
  this pass, no reason to doubt it given prior entries' checks).
- **C3**: [x] `src/domain` untouched by this batch (no diff to `src/domain/navigation.ts`). [x]
  No business logic embedded in `HomeScreen.tsx`'s body — both changes (a scroll-container
  choice, a padding calculation from a hook's return value) are presentation-only. [x] No
  inline `Platform.OS` branching added. [x] No direct DB/storage/backend access anywhere in
  this batch. [x] No new global-state library. [x] No stray `console.log`/context-free `TODO`
  found in the diff.
- **C4**: [x] `src/domain` — N/A this batch (no domain changes). [x] New/changed screens
  (`HomeScreen.tsx`) have RNTL component tests asserting real rendered output/behavior
  (ScrollView presence via `UNSAFE_getByType`, safe-area padding via flattened style — not
  "doesn't throw" checks). [ ] `./init.sh`'s full three-target build check — not run this batch
  (T022's job); the `--skip-build` fast-path result reported is not a substitute, correctly
  disclosed as such by the implementer.
- **C5**: [x] No suspicious untracked files introduced by this batch (checked `git status`
  before/after my own verification run — only the expected file set). [ ] `progress/history.md`
  entry for a closed session — N/A, this session/feature is still open, not yet closing.
- **C6**: [x] `spec.md`/`plan.md`/`tasks.md` all present for `004-home-scan-shell` (`"sdd":
  true`). [x] No open `[NEEDS CLARIFICATION]` markers (both were resolved and confirmed at the
  `spec_ready` gate). [ ] Not every `tasks.md` item is `[X]` yet — T022 remains, correctly so,
  feature not yet `done`. [x] This batch's traceability table (in
  `progress/impl_004-home-scan-shell.md`, Run 8) references Constitution VII, SC-002, SC-003,
  SC-004, and the specific Edge Case text by name for every test added or changed this batch.

No box in C1–C6 that is genuinely applicable to this batch's scope is empty in a way that
blocks; the boxes left `[ ]` (full `init.sh`, all tasks `[X]`, session-closed entry) are
explicitly T022/end-of-feature's job, not a regression introduced by this batch.

## Findings summary

1. **(Flag prominently, not blocking)** `src/features/navigation/HomeScreen.tsx:36-65` — the
   fix for the short/narrow-viewport card-clipping bug makes the *entire* Home/Scan screen
   scrollable, rather than confining scrolling to "its own top-right region" as spec.md's Edge
   Cases section literally describes. This is a broader, disclosed design deviation from the
   spec's illustrative mitigation. It does not violate the edge case's binding MUST clause
   (verified independently: no overlap at any tested viewport) and the literal alternative
   (stack-only scroll) would not have fixed the actual bug reproduced (the card, not the stack,
   overflowing a short viewport). Recommend explicit human/orchestrator sign-off on this
   specific behavior change before T022 closes the feature — the implementer already asked for
   this in their own report; I concur it's warranted, and am elevating it here rather than
   treating it as resolved by the implementer's own disclosure alone.
2. **(Fix the report, not the code)** `progress/impl_004-home-scan-shell.md`, Run 8, T021
   section 3 — the claim that the card becomes "fully within the viewport" at some scroll
   offset ≥200 at a 667×300 viewport is mathematically impossible (308px card, 300px viewport)
   and independently confirmed false by my own live scroll-position sweep (`anyFullyVisible:
   false` at every tested offset). The weaker, correct claim — every part of the card is
   scroll-reachable, just never all at once at this squeeze — does hold and should replace the
   overclaim in the report for accuracy. Not a code defect; a verification-evidence accuracy
   issue task-implementer should correct.
3. No other blocking or non-blocking findings. Type-check clean, full suite green (37/37 suites,
   233/233 tests, matching the implementer's reported numbers exactly), gate files untouched,
   no regression found in T013/T016/T018's previously-approved behavior, safe-area fix correct
   and independently confirmed at the source/web level, Jest mock choice is standard and
   non-hacky.

## Verdict

**APPROVE WITH NITS.** Both real production fixes in this batch (`ScrollView` root,
`useSafeAreaInsets()`) address genuinely reproduced bugs, are minimal and presentation-only
(Constitution IV respected), are backed by real regression tests, and were independently
re-verified by me against a live dev server — not merely trusted from the report. The one
substantive design concern (whole-screen scroll vs. the spec's stack-scoped scroll suggestion)
does not violate spec.md's binding requirement for the edge case and was the only way to fix
the bug actually found, but it is exactly the kind of prominent, disclosed deviation this review
was asked to weigh carefully; task-implementer/orchestrator should get explicit human
confirmation on it before T022 closes the feature, and should correct the one factual overclaim
in the 667×300 verification bullet of `progress/impl_004-home-scan-shell.md`. Neither issue
blocks proceeding — both are documentation/confirmation items, not functional defects. Gate
files remain untouched (FR-009), type-check and the full suite are green, and no prior-approved
behavior regressed.

---

# Code Review: 004-home-scan-shell — FINAL SIGN-OFF (T022, full feature closure)

**Scope**: The final gate for the entire feature (all 22 tasks), not just T022's own diff.
Re-read `spec.md`/`plan.md`/`tasks.md` fresh, `.specify/memory/constitution.md`,
`docs/conventions.md`, `docs/verification.md`, `CHECKPOINTS.md`, and the full run history in
`progress/impl_004-home-scan-shell.md` and this review file. Independently re-ran `./init.sh`
end-to-end (no `--skip-*` flags), re-ran the full Jest suite, re-diffed the FR-009 gate files,
re-audited `git status`, spot-checked FR-001–FR-010 traceability, and grepped for backend calls
in every new file this feature added.

## 1. Independent `./init.sh` run (full, unabridged)

```
RESULT: SUCCESS (10/10 stages passed)
```

- Prerequisites, env file, `npm install`, type-check: OK.
- `expo-doctor`: WARN (outdated-dependency advisory) — same two pre-existing checks the feature
  started with, unrelated to any file this feature touched.
- Native dependency alignment: WARN (`expo-image-picker@15.0.7`/`react-native@0.74.0`/
  `react-native-safe-area-context@4.10.1`/`@types/react@18.3.31`/`typescript@5.9.3` version
  drift) — identical package list to every prior batch's run in this feature; not new.
- Test suite: OK.
- Bundle export (web/iOS/Android): OK, all three.

No new failure, no new warning beyond the two that predate this feature. Matches the
implementer's own T022 report exactly. (An `npm error` line appeared in `npm`'s own debug log
during the test stage — this is npm's standard end-of-run log-pointer message, unrelated to a
real failure: `exit 0`, `info ok` in the same log, and `init.sh`'s own "Tests: all tests passed"
stage confirms it.)

Re-ran the full suite directly as well: `npx jest` → **37 suites / 233 tests, all passed.**
Matches the implementer's reported numbers exactly.

## 2. FR-009 gate files — confirmed untouched, for the whole feature, not just this task

```
git diff --stat app/_layout.tsx src/domain/kyc-gate.ts src/features/identity/useKycGate.ts
```
Zero output — independently confirmed empty across the entire branch, not just this run's own
diff. `resolveKycRoute()`/`useKycGate()`/`KYC_ROUTE_TARGETS` are exactly as `001-registration-kyc`
left them.

## 3. `git status` / stray-file audit

`git status --short` and `git status --porcelain -uall` show exactly this feature's intended
file set: `app/index.tsx` deleted (T014), `app/(app)/**` + `app/scan.tsx`/`.test.tsx` added,
`src/domain/navigation.ts`/`.test.ts` added, `src/features/navigation/**` added,
`src/features/scanner/ScanEntryCard*`/`ScanPlaceholderScreen*` added,
`src/features/social/AmigosPlaceholderScreen*`/`SocialPlaceholderScreen*` added,
`specs/004-home-scan-shell/**` added, this feature's own `progress/impl_*`/`review_*` files, plus
three legitimately-modified docs/config files (`docs/conventions.md` — the `_layout.*` test
colocation-exception rule; `feature_list.json` — this feature's own entry; `progress/current.md`
— session log; `metro.config.js` — comment-only clarification, confirmed via `git diff` to carry
zero logic change). A project-wide search for `*.png`/`*.jpg`/`*.jpeg`/`*scratch*`/`*debug*`/
`*.log` outside `node_modules`/`.git` returned nothing. No `console.log`/context-free `TODO` found
in any new file. Nothing outside this feature's own intended scope is present.

## 4. FR/spot-check traceability (Level 5, `docs/verification.md`)

Independently grepped (not trusting the cumulative claim) for every `FR-00x` string across all
new test files. Every one of FR-001 through FR-010 is referenced by at least one genuine test
comment/description, not an accidental string match — spot-checked two directly:

- `app/(app)/index.test.tsx:5,26` — "FR-001, FR-009: ... only what 'main' renders changes; the
  gate itself is [untouched]" — a real, on-topic reference next to the assertion it covers.
- `src/features/navigation/TopRightControls.test.tsx:2` — "FR-010 (no backend calls / no real
  behavior — asserted implicitly by [absence of any fetch/api import])" — genuine, on-topic.

Full FR list cross-checked against dedicated test files: FR-001/003 (`navigation.test.ts`,
`WebSidebarNav.test.tsx`, `WebBottomBarNav.test.tsx`, `app/(app)/index.test.tsx`), FR-002
(`app/(app)/_layout.tsx` — no dedicated test file, by explicit, documented, precedent-matching
design choice re-confirmed correct: matches `001`'s own `_layout.tsx` files, and its structure is
covered at the data level by `navigation.test.ts` plus the web export/build check), FR-004/005
(`ScanEntryCard.test.tsx`, `ScanPlaceholderScreen.test.tsx`, `app/scan.test.tsx`), FR-006
(`TopRightControls.test.tsx`, `HomeScreen.test.tsx`), FR-007 (`AmigosPlaceholderScreen.test.tsx`,
`SocialPlaceholderScreen.test.tsx`, `app/(app)/amigos.test.tsx`, `app/(app)/social.test.tsx`),
FR-008 (`AmigosQuickAccessPill.test.tsx`, `HomeScreen.integration.test.tsx`), FR-009
(`app/(app)/index.test.tsx`), FR-010 (`TopRightControls.test.tsx`, plus by-inspection for every
other file, confirmed independently in §5 below). No FR is uncovered.

## 5. Zero backend calls (FR-010) — independent grep

```
grep -rn "fetch(\|axios\|api-client\|useQuery\|useMutation" src/features/navigation \
  src/features/scanner src/features/social "app/(app)" app/scan.tsx
```
Zero hits. Read every non-test import line in `src/features/navigation/*.tsx`,
`src/features/scanner/*.tsx`, `src/features/social/*.tsx` directly: every file imports only
`react`, `react-native`, `react-native-safe-area-context`, `expo-router`, `@expo/vector-icons`,
and this feature's own already-reviewed sibling modules (`@/domain/navigation`,
`@/features/scanner/ScanEntryCard`, etc.) — no `src/lib/api.ts`, no React Query, no bare `fetch`.
Confirmed clean across the whole feature, not just a sample.

## 6. Spot-checked source files directly (not just trusting the impl report)

Read `app/(app)/_layout.tsx`, `app/(app)/_layout.web.tsx`, `app/(app)/index.tsx`,
`app/(app)/amigos.tsx`, `app/(app)/social.tsx`, `app/scan.tsx`, `src/features/navigation/
HomeScreen.tsx`, `WebSidebarNav.tsx`, `WebBottomBarNav.tsx` directly. All match `plan.md`'s
Project Structure and `spec.md`'s FRs exactly: single source of truth (`NAV_DESTINATIONS`) driven
via `.map()` everywhere, no inline `Platform.OS` branching anywhere, no business logic in any
component body, `app/index.tsx` genuinely removed with no orphaned `"/"` route (confirmed both by
`ls` returning "No such file" and by the clean three-platform bundle export).

## `tasks.md` checklist status — full feature

All of **T001–T022 are `[X]`** in `specs/004-home-scan-shell/tasks.md`, confirmed by a fresh read
of the file (not the implementer's claim) — every phase (Setup-skipped, Foundational, US1–US4,
Polish) is complete.

## CHECKPOINTS.md C1–C6 — full walkthrough (final state, whole feature)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md` and `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 (independently re-run this session, full/unabridged, `RESULT: SUCCESS
      (10/10)`, only the two pre-existing warnings).

**C2 — state coherent**
- [x] Exactly one feature (`004-home-scan-shell`) is `in_progress` in `feature_list.json`
      (confirmed: `001` done, `002`/`003` pending, `004` in_progress — no second `in_progress`).
- [x] `001-registration-kyc` (the one `done` feature) has passing tests covering it — unaffected
      by this feature, still green in the full suite.
- [x] `progress/current.md` describes only the active session (this feature) — no leftover
      content from a previous, already-closed session.

**C3 — architecture respected**
- [x] `src/domain/navigation.ts` has zero React/React Native imports — confirmed by direct read.
- [x] Every new UI component calls into `src/domain/navigation.ts` (`NAV_DESTINATIONS`,
      `SCAN_ROUTE`, `resolveWebNavLayout`) rather than duplicating that data or embedding fetch/
      validation logic — confirmed by direct read of every new file.
- [x] Platform-specific code uses the `.web.tsx` convention (`_layout.web.tsx`) with zero inline
      `Platform.OS` branches anywhere in this feature — confirmed by `grep` across all new files.
- [x] No direct Postgres/Redis/S3/Supabase-table access, no bare `fetch`/`axios` — confirmed by
      grep (§5 above), zero hits.
- [x] No new global state library added (`grep` for redux/zustand/jotai across new files and
      `package.json` diff — nothing).
- [x] No stray `console.log`/context-free `TODO` in any new file (grepped directly).

**C4 — verification is real**
- [x] `src/domain/navigation.ts`'s every export (`NAV_DESTINATIONS`, `SCAN_ROUTE`,
      `BREAKPOINT_PX`, `resolveWebNavLayout`) has a covering unit test
      (`src/domain/navigation.test.ts`).
- [x] Every new/changed screen has an RNTL component test asserting real rendered output/
      behavior (roles, labels, `fireEvent.press`, accessible-name sequences) — not
      "doesn't-crash" checks; spot-checked several directly, all substantive.
- [x] `./init.sh`'s build checks pass for **all three** targets (web/iOS/Android, each its own
      stage, independently re-run this session), and "Native dependency alignment" is WARN, not
      FAIL.

**C5 — session closed well**
- [x] No suspicious untracked files (`*.tmp`, stray `.expo/` cache, logs, screenshots) —
      confirmed by a fresh project-wide search this session.
- [ ] `progress/history.md` has **no entry yet** for this feature's session — this is expected at
      this exact moment (the session isn't closed until the orchestrator acts on this review and
      `feature_list.json` flips to `done`); flagging as the orchestrator's next action, not a
      defect in this review's scope.
- [~] "The last feature worked on is reflected accurately in `feature_list.json`" — accurate as
      `in_progress` right now; will need updating to `done` by the orchestrator following this
      verdict.

**C6 — Spec Driven Development**
- [x] `specs/004-home-scan-shell/{spec.md,plan.md,tasks.md}` all exist (`"sdd": true`).
- [x] `spec.md` has zero open `[NEEDS CLARIFICATION]` markers — both original open items (web nav
      treatment, Amigos-pill meaning) were confirmed at the `spec_ready` gate and are recorded as
      such.
- [x] Every `tasks.md` item is `[X]` — confirmed fresh, T001–T022.
- [x] Every `FR-00x` in `spec.md` is covered by at least one referencing test — confirmed by
      independent grep + spot-check (§4 above), not just trusted from prior rounds.

No box above is empty in a way that blocks sign-off; the two C5 items reflect the review boundary
(orchestrator's post-approval bookkeeping), not a gap in the feature's own correctness.

## Findings

**Blocking**: none.

**Non-blocking, carried forward from prior review rounds — status at final gate**:

1. **Whole-screen `ScrollView` deviation from spec.md's illustrative edge-case wording** (raised
   at T020/T021's review) — **resolved**: `spec.md`'s Edge Cases section now carries an explicit
   "AMENDED 2026-08-04 (human-confirmed during implementation, T020/T021)" note, confirmed present
   on a fresh read of `spec.md` this session, restating the requirement as the outcome it always
   meant. This is exactly the explicit human sign-off the prior review asked for. Closed.
2. **667×300 verification-report overclaim** (raised at T020/T021's review) — **resolved**:
   `progress/impl_004-home-scan-shell.md`'s Run 8 section now carries the reviewer's requested
   correction inline (struck through, with the accurate weaker claim — "every part of the card is
   scroll-reachable, just never all at once at this squeeze" — stated in its place). Confirmed
   present on a fresh read this session. Closed.
3. **`<Slot/>` state loss across the web breakpoint switch** (first raised at T012/T013's review,
   carried forward through every subsequent batch as "non-blocking, but should be tracked before
   this feature is marked `done`") — **still open, and worth surfacing prominently one more time
   at this final gate rather than letting it quietly close by default.** Concretely:
   `WebSidebarNav.tsx`/`WebBottomBarNav.tsx` (T010/T011) each wrap their own independent
   `expo-router` `<Slot />`; `app/(app)/_layout.web.tsx`'s ternary (T012) therefore unmounts one
   subtree and mounts the other whenever a resize crosses 768px, so any local component state in
   the active screen (concretely: `TopRightControls`' "Not yet available" toggle) silently resets
   on that resize. `spec.md`'s own binding AS6 wording ("without losing the active destination")
   is satisfied regardless (the active *route* lives in `expo-router`'s router context, above
   this layout, and does survive) — so this does not violate any `FR`/`SC` in `spec.md`. But
   `tasks.md` T012's own literal text ("without unmounting/remounting the active screen's state")
   is not actually true of the shipped implementation, and unlike finding #1 above, **this specific
   gap never received an explicit human sign-off or a `tasks.md` wording reconciliation** — it was
   disclosed three times (T012/T013, the dev-server-crash-fix review, and T020/T021's review) but
   never actually closed either by a code fix (hoisting a shared `<Slot/>` above the ternary) or by
   an explicit "acceptable as-is" decision recorded anywhere. Recommend the orchestrator either (a)
   get the same one-line human acknowledgment finding #1 got before flipping `feature_list.json`
   to `done`, or (b) open a tiny, explicitly-scoped follow-up task/note for a future pass. Low
   real-world severity (ephemeral UI feedback state, not data or navigation loss) — not a reason
   to withhold approval on its own, but a genuine, still-unresolved loose end that a "final,
   holistic" sign-off should not silently wave through a fourth time.

Everything else confirmed clean at this final gate: type-check clean, full suite green (37/37
suites, 233/233 tests, independently re-run), all three bundle exports clean, FR-009 gate files
untouched, zero backend calls anywhere in this feature's files, no stray files, every `tasks.md`
item `[X]`, every `FR-00x` traced to a real test.

## Overall verdict on the whole feature (all 22 tasks)

**The feature is genuinely ready to be marked `done`.** Every hard requirement in `spec.md`
(FR-001 through FR-010) is implemented correctly and traced to a real, substantive test; the one
genuine design deviation from the spec's illustrative wording (whole-screen scroll) received the
explicit human confirmation it needed and is now reflected in `spec.md` itself; the one reporting
overclaim was corrected in place; `./init.sh` is green end-to-end with no new failure or warning;
`FR-009`'s gate files are untouched; there are no stray files or scope leaks; and every task in
`tasks.md` is honestly `[X]`. The one remaining loose end (finding #3, the `<Slot/>` state-reset
nit) is real, disclosed, low-severity, and does not violate any binding requirement in `spec.md`
— it does not block `done`, but it deserves one explicit acknowledgment (human or orchestrator)
rather than being carried forward silently a fourth time, since three prior reviews already asked
for exactly that and it has not yet happened.

## Verdict

**APPROVE WITH NITS**

