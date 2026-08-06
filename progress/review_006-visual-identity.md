# Review — 006-visual-identity — T001 (Add three new runtime dependencies)

**Scope of this review**: T001 only, per `specs/006-visual-identity/tasks.md` Phase 1 (Setup).
Task: `npx expo install expo-font expo-linear-gradient` + `npm install
@expo-google-fonts/playfair-display`, confirm `package.json` records all three, confirm no new
native-dependency-alignment drift. No `app/`/`src/` code is in scope for this task.

## What changed (git diff against main)

- `package.json` — added `@expo-google-fonts/playfair-display` (`^0.4.2`), `expo-font`
  (`~12.0.10`), `expo-linear-gradient` (`~13.0.2`) to `dependencies`.
- `package-lock.json` — npm-generated lock update for the same three packages + transitives.
- `app.json` — `expo.plugins` gained `"expo-font"` (`["expo-router", "expo-font"]`) — this is
  `expo install expo-font`'s own automatic config-plugin registration side effect for a native
  package that ships one, not a manual edit. Verified this is expected `expo install` behavior;
  no other line in `app.json` changed.
- `feature_list.json`, `progress/current.md` — orchestrator/spec-writer bookkeeping from the
  spec_ready gate and branch cut, predating T001, untouched by this task.
- New untracked files: `docs/design-brief-visual-identity.md` (spec-writer's design-source
  transcription), `progress/impl_006-visual-identity.md` (this task's implementer report),
  `specs/006-visual-identity/` (spec/plan/tasks/checklist) — all pre-existing artifacts from the
  spec-writer phase / this task's own report, not app/src code.

No file under `app/` or `src/` is touched. Correct for a dependency-only task.

## Independent verification performed

1. **Dependency install method** — confirmed via `package.json`/`package-lock.json` diff that
   `expo-font` and `expo-linear-gradient` are declared with the `~` (tilde) version ranges Expo's
   own `expo install` writes for SDK-aligned native packages (`~12.0.10`, `~13.0.2`), and
   `@expo-google-fonts/playfair-display` is declared with the `^` (caret) range plain `npm
   install` writes (`^0.4.2`). This matches the claimed install method for each package (native
   via `expo install`, pure-JS via `npm install`).
2. **Version alignment** — ran `npx expo install --check` myself (fresh, independent of the
   implementer's report). Output lists exactly five packages needing an update:
   `expo-image-picker`, `react-native`, `react-native-safe-area-context`, `@types/react`,
   `typescript` — **none of them `expo-font` or `expo-linear-gradient`**. This is the same
   pre-existing, disclosed drift set the repo already carried before this feature (confirmed
   these five package names appear nowhere in this diff's changed dependencies). No new
   version-drift warning was introduced by T001.
3. **`./init.sh` re-run** — ran the full script myself, no skip flags:
   `RESULT: SUCCESS (10/10 stages passed)`, exit code `0`. Type-check clean, tests green
   (existing suite only — no new tests expected at this task), all three bundle exports (web/
   iOS/Android) clean. Stage 5 (expo-doctor) and Stage 6 (native dependency alignment) show the
   identical pre-existing warning set reported above — non-blocking per `docs/verification.md`,
   and not attributable to this task's two `expo install`-managed packages.
4. **Font export-name claim** — read `node_modules/@expo-google-fonts/playfair-display/index.js`
   and `index.d.ts` directly. Confirmed the 700-weight export is exactly:
   `export const PlayfairDisplay_700Bold = require('./700Bold/PlayfairDisplay_700Bold.ttf');`
   This matches what `progress/impl_006-visual-identity.md` reports and exactly matches the
   string T004 (not yet implemented) will hardcode
   (`PLAYFAIR_DISPLAY_BOLD = "PlayfairDisplay_700Bold"`). No discrepancy.
5. **Blast radius** — `git status`/`git diff --stat` confirm only `package.json`,
   `package-lock.json`, `app.json` (the documented, unavoidable `expo install` side effect),
   `feature_list.json`, and `progress/current.md` (pre-existing spec-writer/orchestrator
   bookkeeping, not part of this task's diff) changed, plus the new spec/progress artifacts.
   Zero `app/`/`src/` changes, as required for a dependency-only Setup task.
6. **`tasks.md` status** — `specs/006-visual-identity/tasks.md` line 26: `- [X] T001 ...`.
   Correctly marked done.

## Requirement traceability

T001 is a Setup-phase infrastructure task with no `FR-00x` of its own (its citations are
spec.md's Clarifications Recorded default 1 and plan.md's Technical Context, not a functional
requirement) — no test is expected at this stage, consistent with `docs/verification.md` (no
`src/domain`/screen code exists yet to test) and `tasks.md`'s own framing. Not a blocking gap.

## CHECKPOINTS.md walkthrough (C1–C6, as applicable to this task-level review)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md` and `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 (confirmed independently, exit code 0, only pre-existing disclosed warnings).

**C2 — state coherent**
- [x] At most one feature `in_progress` (`006-visual-identity`; all others `done`/`pending`).
- [x] Every `done` feature has passing tests covering it (spot-checked via the full green test
      suite in `./init.sh`'s Stage 7; not re-litigating prior features' own reviews here).
- [x] `progress/current.md` describes only the active session (006-visual-identity, current).

**C3 — architecture respected**
- [x] N/A for this task — no `src/domain`, `src/features`, or `app/` files were touched. Nothing
      to check for portability/platform-split/data-path violations at this task's scope.

**C4 — verification real**
- [x] N/A for this task — no new exported function or screen exists yet to test. `./init.sh`
      (Level 4) re-run independently, green.

**C5 — session closed well**
- [x] No suspicious untracked files (`docs/design-brief-visual-identity.md`,
      `progress/impl_006-visual-identity.md`, `specs/006-visual-identity/` are all legitimate,
      expected artifacts — no `.tmp`, no stray `.expo/` cache, no logs).
- [ ] `progress/history.md` has no entry yet for this specific session's T001 work — expected and
      not blocking: this is a mid-session, single-task checkpoint, not a session close (the prior
      `005-login` feature's own final review noted this same box is the orchestrator's own
      end-of-session job, not per-task).
- [x] `feature_list.json` accurately reflects `006-visual-identity` as `in_progress`.

**C6 — SDD**
- [x] `006-visual-identity` (`sdd: true`, `in_progress`) has `spec.md` + `plan.md` + `tasks.md`.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers — three Recorded defaults exist,
      explicitly documented as non-blocking (human already confirmed all three at the approval
      gate per `progress/current.md`).
- [x] N/A yet — feature not `done`, so "every tasks.md item [X]" doesn't apply at the feature
      level; T001 itself is correctly `[X]`.
- [x] N/A — T001 carries no `FR-00x` of its own (Setup/infrastructure task); no traceability gap.

No blocking empty box for this task-level scope.

## Findings

None. T001 is exactly what it claims to be: two native-module packages installed via
`expo install` at SDK-aligned versions with no new drift, one pure-JS package installed via
plain `npm install`, `package.json`/`package-lock.json` correctly updated, the one incidental
`app.json` plugin-array line is a disclosed, unavoidable, correctly-attributed `expo install`
side effect (not a hidden scope creep), the font export-name claim for T004's benefit is
verified byte-for-byte against the actual installed package, and no `app/`/`src/` file was
touched.

## Verdict

**APPROVE**

---

# Review — 006-visual-identity — T002–T009 (Token module, User Story 1)

**Scope of this review**: T002–T009 only, per `specs/006-visual-identity/tasks.md` Phase 2
("Token module (User Story 1)"): `src/theme/colors.ts`, `geometry.ts`, `fonts.ts`,
`typography.ts`, `shadows.ts`, `shadows.web.ts`, `contrast.ts` + `contrast.test.ts`,
`index.ts`. T010 (root `useFonts()`/`LocaleContext` wiring) is explicitly out of scope for this
batch (depends on T021, not yet built).

## What changed (git status / diff)

- New: `src/theme/colors.ts`, `geometry.ts`, `fonts.ts`, `typography.ts`, `shadows.ts`,
  `shadows.web.ts`, `contrast.ts`, `contrast.test.ts`, `index.ts` — exactly the nine files
  `tasks.md`/`plan.md`'s Project Structure list for T002–T009, nothing extra.
- `specs/006-visual-identity/tasks.md` — T002–T009 now `[X]` (verified: lines 46, 58, 62, 66,
  78, 83, 87, 98 all show `[X]`; T010 correctly still `[ ]`).
- No file under `app/` was touched, and no `src/` file outside `src/theme/` was touched —
  confirmed via `git status --porcelain=v1` (only `app.json`/`package.json`/`package-lock.json`/
  `feature_list.json`/`progress/current.md` show as modified, all pre-existing from T001 and
  orchestrator bookkeeping, already reviewed in the T001 entry above).

## Independent verification performed (not taking the implementer's report at its word)

1. **`colors.ts` values vs. spec.md's Clarifications "Recorded default 2" table** — read the
   file directly and diffed every key against the table: `text.secondary: "#646B78"`,
   `text.placeholder: "#6D7787"`, `viewfinder.hintText: "#9CA3AF"` (a token distinct from
   `text.placeholder`), `text.link: "#247B3D"`, `accent.priceGreen: "#1C844A"` — all four
   adjusted values plus the new split token match exactly. Every other value
   (`brand.primary`/`brand.onPrimary`/`text.primary`/`bg.*`/`border.*`/`viewfinder.bg`/
   `viewfinder.grid`/`accent.pillBg`) matches `docs/design-brief-visual-identity.md` §2.1
   verbatim, unchanged. Zero React Native import in the file (grepped — no `import` line at
   all). Constitution IV satisfied.
2. **`contrastRatio` formula correctness** — read `src/theme/contrast.ts` line by line
   (hex→sRGB→linear via the `c<=0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4` piecewise function→
   `0.2126R+0.7152G+0.0722B`→`(lighter+0.05)/(darker+0.05)`, order-independent) and
   **independently reimplemented the same formula from scratch** in a standalone Node script
   (not copy-pasted from the file under review), then ran it against:
   - A known external WCAG reference pair, `#767676` on white — canonical published ratio
     **4.54:1**; my independent script produced **4.54**, matching exactly.
   - Black-on-white — canonical **21:1**; produced **21.00**.
   - All eleven pairings in spec.md's Clarifications table — my independently-computed numbers
     matched spec.md's documented ratios to two decimal places for every single pairing
     (`onPrimary/primary` 12.11, `secondary/page` 4.57, `secondary/surface` 5.36,
     `secondary/surfaceMuted` 5.04, `placeholder/surface` 4.53, `hintText/viewfinderBg` 7.60,
     `link/page` 4.51, `link/surface` 5.28, `link/surfaceMuted` 4.96, `link/pillBg` 4.66,
     `priceGreen/surface` 4.72). The formula is genuinely correct, not just self-consistent.
3. **`contrast.test.ts` is a real, non-tautological regression guard** — confirmed it imports
   the *real* `colors` export (`import { colors } from "./colors"`) and asserts against
   `colors.text.secondary` etc., not hardcoded duplicate hex strings. Then **proved** it would
   catch a real regression: temporarily edited `src/theme/colors.ts` to revert
   `text.secondary` from the adjusted `"#646B78"` back to the brief's original `"#6B7280"`, ran
   `npx jest src/theme/contrast.test.ts`, and confirmed it **failed** exactly as expected
   (`Expected: >= 4.5, Received: 4.124247644938985`), then restored the file and confirmed via
   `diff` it was byte-identical to before the experiment. This is a genuine, working regression
   guard, not vacuous.
4. **Ran the test file myself, green**: `npx jest src/theme/contrast.test.ts` → `Test Suites: 1
   passed, 1 total`, `Tests: 9 passed, 9 total` (3 formula sanity checks + 6 pairing-group
   assertions covering every pairing spec.md's table lists).
5. **`typography.ts` vs. brief §2.2** — every role (`display.xl` 40/700/serif, `display.lg`
   28/700/serif, `body.tagline` 15/400/`text.secondary`, `label.field` 12/500/uppercase/
   `0.08*12`/`text.secondary`, `body.input` 16/400, `button.label` 16/700, `body.link`
   14/500/`text.link`, `body.legal` 12/400/centered/`text.secondary`, `label.section`
   12/600/uppercase/letter-spaced) matches the brief's table. Depends correctly on
   `colors.ts`/`fonts.ts`. The only import beyond that is `import type { TextStyle } from
   "react-native"` — confirmed this is a genuine `import type` (erased at compile time by
   TypeScript, produces zero runtime `require`/`import` of `react-native` in the emitted JS) —
   grepped the file for any other `"react-native"` reference: none. Constitution IV satisfied.
6. **`shadows.ts`/`shadows.web.ts` — the native shadowColor/shadowOpacity split is correct and
   idiomatic React Native.** This is the standard, textbook RN shadow pattern: native
   `shadowColor` does not itself carry a usable alpha channel the way `shadowOpacity` does —
   passing an `rgba(...)` string as `shadowColor` and *also* setting `shadowOpacity` would
   multiply the two alphas together (the file's own comment computes this correctly: `0.06 ×
   0.06 ≈ 0.0036`, a shadow ~17x fainter than intended). Decomposing into opaque
   `shadowColor: "#10281A"` (`rgb(16,40,26)`, matching the brief's rgba tuple's RGB channel
   exactly) + `shadowOpacity: 0.06`/`0.12` avoids that double-application and is exactly how
   React Native's own docs and every mainstream RN styling library express a translucent shadow
   color. `shadowOffset`/`shadowRadius`/`elevation` map directly to brief §2.4's y-offset/blur
   values (`shadow.surface`: 2/12; `shadow.raised`: 6/20), and `elevation` (Android's own,
   alpha-less approximation) is set to the y-offset value, a reasonable convention. Confirmed
   `shadows.web.ts` produces the CSS-equivalent string directly (`"0px 2px 12px
   rgba(16,40,26,0.06)"` / `"0px 6px 20px rgba(16,40,26,0.12)"`) — exact numeric match to the
   brief, no decomposition needed there since CSS `box-shadow` takes `rgba()` natively.
7. **`label.section`'s reused `0.08em` letter-spacing** — the brief (§2.2) gives `label.field`
   an explicit `~0.08em` but only says "letter-spaced" for `label.section` with no number.
   Task-implementer reused `label.field`'s exact value and disclosed this explicitly in
   `progress/impl_006-visual-identity.md`'s "Deviations / notes for sign-off" section as a
   judgment call, not an invented spec fact. This is a reasonable, low-risk choice (both are
   uppercase 12px sans-serif label roles). **Nit**: the choice is disclosed in the progress log
   but **not** commented in `typography.ts` itself next to the `section` token — a future reader
   of the source file alone (without the progress log) would not know this was a deliberate
   reuse rather than an oversight. `docs/conventions.md`'s comment guidance ("only write one
   when it captures a non-obvious *why*") argues for a one-line comment here. Non-blocking, but
   worth a follow-up touch when `label.section` is actually consumed (T042).
8. **`index.ts` barrel-export mechanism** — read `app/(app)/_layout.web.tsx` (the cited
   precedent) and confirmed it and its sibling `app/(app)/_layout.tsx` (no suffix) are both
   resolved by Metro's own platform-extension resolution with zero explicit
   `Platform.OS`/`Platform.select` branch — exactly the mechanism `src/theme/index.ts` relies on
   for `import { shadowSurface, shadowRaised } from "./shadows"` picking `shadows.ts` (native)
   vs. `shadows.web.ts` (web) automatically. Then **proved it actually works under Jest**, not
   just Metro: wrote a temporary throwaway test importing `theme`/`colors`/`typography`/
   `shadowSurface`/`shadowRaised` from `"./index"`, ran it under `jest-expo`'s default `ios`
   platform, confirmed `shadowSurface`/`shadowRaised` resolved to the *native* (`shadows.ts`)
   shapes with no import-resolution error, then deleted the temporary file and confirmed `git
   status` shows no residue (`src/theme/` still exactly the 9 expected files). This directly
   validates plan.md's claim that this barrel pattern works "exactly as `app/(app)/_layout.web.
   tsx` already relies on."
9. **Type-check**: ran `node_modules/.bin/tsc --noEmit` myself — clean, zero errors/output.
10. **Full test suite**: ran `npx jest` myself (not trusting the implementer's number) —
    `Test Suites: 45 passed, 45 total`, `Tests: 311 passed, 311 total`. Matches the
    implementer's reported 311/311 exactly. No unexpected `act()` warnings beyond the
    pre-existing React Query async-update noise already present before this feature (unrelated
    to this batch's files, which have zero component/rendering code).
11. **Scope check** — confirmed via `git status --porcelain=v1` that this batch touched only
    the 9 new `src/theme/*` files plus `tasks.md`'s checkbox update and this progress-log
    append; nothing under `app/` or any other `src/` directory.

I did not re-run `./init.sh` end-to-end for this batch specifically (the implementer's report
documents a fresh `RESULT: SUCCESS (10/10 stages passed)` run with the same two pre-existing,
disclosed Stage 5/6 warnings as T001's review already verified independently) — I instead
independently re-verified the two components `./init.sh` would exercise that matter most at
this scope (type-check and the full test suite), both green, which is sufficient corroboration
given T001's review already independently confirmed `./init.sh` end-to-end is green and no
native-module dependency was touched in this batch.

## Requirement traceability

| FR | Test(s) / evidence |
|---|---|
| FR-001 (semantic names, no raw hex/magic literal at a consumer) | `colors.ts`/`geometry.ts`/`typography.ts`/`shadows.ts`/`shadows.web.ts` are the semantic-name source; `contrast.test.ts` reads the real `colors` export, not duplicated hex, demonstrating the pattern. No consumer exists yet in this batch to grep-check for violations — correctly deferred to the primitives/screens batches. |
| FR-002 (dark-theme-ready structure) | Structural — `colors.ts`'s nested-object shape leaves room for a second value set per name without changing a call site. No dedicated test; matches `docs/verification.md`'s guidance that a plain literal-data const object doesn't need one. |
| FR-004 (every rendered text/background pairing clears 4.5:1, adjusted values) | `src/theme/contrast.test.ts`, 9/9 passing, independently re-verified (see point 2/3 above) — both the formula's correctness and the test's genuine regression-catching behavior were proven, not assumed. |
| FR-005 (platform split via file convention, not inline `Platform.OS`) | `shadows.ts` (native) / `shadows.web.ts` (web) — same two export names, zero `Platform.OS` branch in either file (grepped, none present); `index.ts`'s barrel-export mechanism independently proven to resolve correctly under Jest (point 8 above). |

## `tasks.md` checklist status (T002–T009)

- [X] T002 `src/theme/colors.ts` — verified, adjusted values exact match, zero RN import.
- [X] T003 `src/theme/geometry.ts` — verified, matches brief §2.3 exactly.
- [X] T004 `src/theme/fonts.ts` — verified against installed package (re-confirmed export name).
- [X] T005 `src/theme/typography.ts` — verified, matches brief §2.2, type-only RN import confirmed.
- [X] T006 `src/theme/shadows.ts` — verified, correct idiomatic RN shadow decomposition.
- [X] T007 `src/theme/shadows.web.ts` — verified, exact CSS-string equivalents.
- [X] T008 `src/theme/contrast.ts` + `contrast.test.ts` — verified, formula correct, test genuinely catches regressions.
- [X] T009 `src/theme/index.ts` — verified, barrel-export mechanism proven to work under Jest.

All eight boxes correctly checked in `specs/006-visual-identity/tasks.md`. T010 correctly left
unchecked (out of scope for this batch, depends on T021).

## CHECKPOINTS.md walkthrough (C1–C6, as applicable to this task-level review)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md` and `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 — independently corroborated via type-check + full test suite both
      green myself (see "Independent verification" above); implementer's own fresh
      `RESULT: SUCCESS (10/10 stages passed)` run for this exact batch is consistent with that.

**C2 — state coherent**
- [x] At most one feature `in_progress` (`006-visual-identity`).
- [x] Every `done` feature has passing tests covering it (full suite green, 311/311, no
      regression introduced by this batch).
- [x] `progress/current.md` describes only the active session.

**C3 — architecture respected**
- [x] `src/theme/` (this batch's entire scope) has zero React Native/Expo imports except one
      confirmed type-only `TextStyle` import in `typography.ts` (Constitution IV) — pure,
      portable TypeScript.
- [x] No UI component code in this batch (Phase 2 token layer only) — N/A for the
      component-calls-into-domain check at this scope.
- [x] Platform-specific code (`shadows.ts`/`shadows.web.ts`) uses the file-extension
      convention, zero inline `Platform.OS` conditional.
- [x] No direct Postgres/Redis/S3/Supabase-table access anywhere in this batch (pure static
      data module, no data access at all).
- [x] No new global state library.
- [x] No stray `console.log`/context-free `TODO` (grepped, none present in the 9 new files).

**C4 — verification real**
- [x] `contrast.ts`'s exported logic function has a covering unit test — independently proven
      non-tautological (see point 3 above).
- [x] N/A for this batch — no new/changed screens yet (Phase 2 token-only).
- [x] `./init.sh`'s build checks pass for all three targets per the implementer's fresh run for
      this batch, consistent with type-check/full-suite results I reproduced myself.

**C5 — session closed well**
- [x] No suspicious untracked files — only the 9 documented `src/theme/*` files plus expected
      progress/spec artifacts.
- [ ] `progress/history.md` has no entry yet for this specific mid-session checkpoint — expected
      and not blocking, same as noted in the T001 review (session-close bookkeeping is the
      orchestrator's job, not per-task).
- [x] `feature_list.json` accurately reflects `006-visual-identity` as `in_progress`.

**C6 — SDD**
- [x] `006-visual-identity` (`sdd: true`, `in_progress`) has `spec.md` + `plan.md` + `tasks.md`.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers.
- [x] N/A yet at the feature level (not `done`); T002–T009 themselves are correctly `[X]`.
- [x] FR-001/FR-002/FR-004/FR-005 (the FRs this batch's tasks cite) are each referenced by at
      least one test description/comment or structural justification, per the traceability table
      above.

No blocking empty box for this task-level scope.

## Findings

**Nit (non-blocking)**: `src/theme/typography.ts`'s `label.section.letterSpacing` reuses
`label.field`'s `0.08 * 12` value with no numeric spec from the brief to back it. This is a
disclosed, reasonable judgment call — but the disclosure lives only in
`progress/impl_006-visual-identity.md`, not as an inline comment in `typography.ts` itself next
to the `section` token. Recommend a one-line comment be added the next time this file is
touched (e.g. when `label.section` is actually consumed by `RecentScansList` in a later batch)
so a reader of the source alone understands this is a deliberate reuse, not an oversight.

No other findings. Every value, formula, and platform-split mechanism in this batch was
independently reproduced/verified against spec.md/plan.md/the design brief — not merely
eyeballed against the implementer's own report.

## Verdict

**APPROVE WITH NITS**

---

# Review — 006-visual-identity — T011–T016 (Shared primitives: BrandMark, PrimaryButton, SecondaryButton, OrDivider, StatusPill, README)

**Scope of this review**: T011–T016 only, per `specs/006-visual-identity/tasks.md`'s "Shared
primitives (User Story 1)" section: `src/features/ui/BrandMark.tsx`, `PrimaryButton.tsx`,
`SecondaryButton.tsx`, `OrDivider.tsx`, `StatusPill.tsx` (each with a `.test.tsx`), plus
`src/features/ui/README.md`. `Field`/`FormField.tsx` is explicitly out of scope for this batch
(lands with the `identity` restyle later).

## What changed (git status)

All of `src/theme/` (prior batch) and `src/features/ui/` (this batch) are untracked/uncommitted
on `006-visual-identity`, so there is no commit boundary to diff against — verified scope by
`git status --porcelain=v1`: the only paths that differ from the last commit are `app.json`,
`feature_list.json`, `package-lock.json`, `package.json`, `progress/current.md` (all pre-existing
from T001/orchestrator bookkeeping, already reviewed) plus the untracked
`docs/design-brief-visual-identity.md`, `progress/impl_006-visual-identity.md`,
`progress/review_006-visual-identity.md`, `specs/006-visual-identity/`, `src/features/ui/`,
`src/theme/`. Nothing under `app/` or any other `src/` directory was touched by this batch —
correct for a primitives-only Phase.

New files this batch: `src/features/ui/BrandMark.tsx` + `.test.tsx`, `PrimaryButton.tsx` +
`.test.tsx`, `SecondaryButton.tsx` + `.test.tsx`, `OrDivider.tsx` + `.test.tsx`, `StatusPill.tsx`
+ `.test.tsx`, `README.md` — exactly the twelve files `tasks.md`/`plan.md`'s Project Structure
list for T011–T016, nothing extra.

## Independent verification performed (not taking the implementer's report at its word)

1. **FR-001/SC-001 grep for raw hex/magic-literal token duplication** — ran
   `grep -n "#[0-9a-fA-F]\{3,8\}" src/features/ui/*.tsx` (excluding `.test.tsx`): zero hex
   literals, good. Then grepped for numeric literals matching a `space`/`radius`/`CONTROL_HEIGHT`
   token value (`space.md` = 12, per `src/theme/geometry.ts`) directly in the five component
   bodies:
   - **`src/features/ui/OrDivider.tsx:32`**: `marginHorizontal: 12` — a raw literal that
     duplicates `space.md`'s value (12) instead of importing and using `space.md` from `@/theme`.
   - **`src/features/ui/StatusPill.tsx:27`**: `paddingHorizontal: 12` — same issue, duplicates
     `space.md` (12) as a bare literal.
   - `StatusPill.tsx:28`'s `paddingVertical: 6` is a magic number too, though it does not
     literally duplicate any single `space.*` value (closest are `space.xs`=4, `space.sm`=8), so
     it is a lesser instance of the same underlying problem (geometry not sourced from the theme
     module at all) rather than a token-value duplicate.
   - This directly contradicts `progress/impl_006-visual-identity.md`'s Run 3 claim: "Every
     primitive imports exclusively from `@/theme`... zero raw hex/magic-number literal in any
     component body (FR-001), confirmed by reading each file back after writing it." That claim
     is incorrect for two of the five primitives.
   - **This is exactly the failure mode spec.md FR-001/SC-001 exist to prevent** ("no raw hex
     value or magic numeric literal duplicating a token's value may appear directly in a screen
     or primitive component body... verified by code review/grep, not visual inspection alone").
     `OrDivider` and `StatusPill` fail this grep-checkable requirement as shipped.
   - `BrandMark.tsx`'s `fontSize: size * 0.4` is a computed proportion of the `size` prop, not a
     fixed literal duplicating a specific token value — acceptable, since the primitive is
     explicitly designed to scale with a caller-supplied `size`.
2. **`BrandMark`** — read the file directly: `radius.tile` ✓, `colors.brand.primary` fill ✓,
   `shadowRaised` spread onto the outer `View`'s style ✓, "D" glyph in `colors.brand.onPrimary`
   using `typography.display.lg`'s `fontFamily`/`fontWeight` (Playfair Display 700 Bold) ✓,
   default `size = 112` with a `size` prop ✓. Accessible via `accessibilityRole="image"` +
   `accessibilityLabel="Draw a Card"` (plus an explicit `accessible` prop, disclosed in the
   implementer's notes as necessary for RNTL v13's `getByRole` matching — confirmed this
   reasoning against `@testing-library/react-native`'s installed source, correct). Test suite (4
   tests) asserts rendered `backgroundColor`/`borderRadius`/`width`/`height`/`shadowOpacity>0`/
   glyph color/`fontFamily` against the *real* `@/theme` exports, not duplicated literals — ran
   `npx jest src/features/ui/BrandMark.test.tsx`, green (4/4).
3. **`PrimaryButton`** — full-width (`width: "100%"`) ✓, `CONTROL_HEIGHT` ✓, `radius.pill` ✓,
   `colors.brand.primary` fill ✓, `colors.brand.onPrimary` bold label via
   `typography.button.label` ✓, `shadowRaised` ✓. Ran the test file myself (not just read it):
   `npx jest src/features/ui/PrimaryButton.test.tsx` → 5/5 green, including the disabled case
   which genuinely fires `fireEvent.press` on a disabled button and asserts `onPress` was **not**
   called (`expect(onPress).not.toHaveBeenCalled()`), `accessibilityState.disabled === true`, and
   `style.opacity === 0.6` — a real behavioral assertion, not merely a prop check. The
   `disabled ? undefined : onPress` wiring in the component body (`PrimaryButton.tsx:32`) is the
   actual mechanism blocking the press, and `Pressable`'s own `disabled={isDisabled}` prop is a
   second, redundant guard — both correctly present. Tap-target test explicitly asserts
   `style.height === CONTROL_HEIGHT` and `CONTROL_HEIGHT >= 44` (not merely assumed) — exactly
   what the review brief asked to confirm.
4. **`SecondaryButton`** — same geometry (`CONTROL_HEIGHT`, `radius.pill`, full-width) ✓,
   `colors.bg.surface` fill ✓, `colors.border.subtle` 1px border ✓, `colors.text.primary` bold
   label via `typography.button.label` ✓, **no shadow** — confirmed no `shadowRaised`/`shadowColor`
   import or spread anywhere in the file, and the test explicitly asserts
   `style.shadowOpacity`/`style.boxShadow` are both `undefined`. Cross-checked brief §3.2/§3.3
   myself: §3 item 3 ("`SecondaryButton` — same geometry as `PrimaryButton`... `bg.surface` fill,
   `border.subtle` 1px, `text.primary` bold label") specifies no disabled-opacity rule for the
   secondary button — only item 2 (`PrimaryButton`) says "Disabled = 60% opacity." The component
   correctly does **not** add an opacity/disabled style branch, matching the brief precisely
   (task-implementer neither invented a rule that isn't there nor silently omitted one that is —
   there genuinely isn't one). Ran `npx jest src/features/ui/SecondaryButton.test.tsx` → 5/5
   green.
5. **`OrDivider`** — hairline `border.subtle` rule (two `flex-1` 1px `View`s) broken by a centered
   lowercase "o" on `colors.bg.page` ✓ (matches brief §3 item 5). Test confirms
   `label.props.accessibilityRole` is `undefined` and that `getByRole("button")`/`getByRole("link")`
   both throw — i.e., it genuinely checks the *absence* of interactivity, not merely that the
   component renders. Ran `npx jest src/features/ui/OrDivider.test.tsx` → 2/2 green. (Flagged
   above: `marginHorizontal: 12` is a magic literal that should be `space.md`.)
6. **`StatusPill`** — `colors.accent.pillBg` fill ✓, `colors.text.link` label color ✓,
   `radius.pill` ✓, content-sized (`alignSelf: "flex-start"`, no explicit `width`, test asserts
   `pillStyle.width` is `undefined`) — not full-width ✓. Confirmed the component sets **no**
   `accessibilityRole` at all (default `undefined`), and the test explicitly asserts
   `expect(() => screen.getByRole("button")).toThrow()` — this is the specific negative
   assertion spec.md US3 AS4 calls for, genuinely checking the absence of the role rather than
   only asserting the component renders. Ran `npx jest src/features/ui/StatusPill.test.tsx` →
   3/3 green. (Flagged above: `paddingHorizontal: 12`/`paddingVertical: 6` are magic literals not
   sourced from `@/theme`.)
7. **`src/features/ui/README.md` vs. `src/features/navigation/README.md`** — read both directly.
   The new README mirrors the existing one's structure and tone exactly (opens with "No backend
   counterpart to mirror," quotes the relevant Constitution Check table excerpt from its own
   `plan.md`, states what the module owns/doesn't own, cites the precedent). Cross-checked the
   Constitution's actual Principle V text ("Screens and components are organized by the same
   bounded contexts as the backend... so a feature can be reasoned about as one unit of work
   across backend and frontend") against both READMEs' framing of the exception — both correctly
   characterize `src/features/ui/`/`src/features/navigation/` as cross-cutting infrastructure
   with no backend bounded context to mirror, which is the correct, narrow shape of exception
   Principle V's own text implies (it's about domain alignment, not a blanket prohibition on
   shared infra). Not hand-waved — this is a substantive, accurate parallel.
8. **Full test suite** — ran `npx jest` (not `npm test`, no test script is configured in
   `package.json`; `jest` is invoked directly, consistent with prior review rounds for this
   feature): `Test Suites: 50 passed, 50 total`, `Tests: 329 passed, 329 total`. Matches the
   implementer's reported 329/329 exactly, no regression.
9. **Type-check**: `node_modules/.bin/tsc --noEmit` — clean, zero output/errors.
10. **`./init.sh` (full, no skip flags)** — ran independently: `RESULT: SUCCESS (10/10 stages
    passed)`. Stage 5 (expo-doctor) and Stage 6 (native dependency alignment) show the identical
    pre-existing, disclosed warning set (`expo-image-picker`, `react-native`,
    `react-native-safe-area-context`, `@types/react`, `typescript` version drift) already
    verified as pre-existing in the T001/T002–T009 review rounds — no new warning introduced by
    this batch.
11. **`tasks.md` checklist** — `specs/006-visual-identity/tasks.md` lines 117, 123, 131, 138,
    143, 149: T011–T016 all show `- [X]`. Correctly marked done.
12. **Blast-radius / scope check** — confirmed via `git status --porcelain=v1` that this batch
    touched only the six new `src/features/ui/*` component+test pairs, `README.md`, `tasks.md`'s
    checkbox updates, and this progress-log append. Nothing under `app/` or any other `src/`
    directory.

## Requirement traceability

| FR | Test(s) / evidence |
|---|---|
| FR-001 (semantic token names only, no raw hex/magic literal duplicating a token value) | **Partially fails.** `BrandMark`, `PrimaryButton`, `SecondaryButton` are clean. `OrDivider.tsx:32` (`marginHorizontal: 12`) and `StatusPill.tsx:27` (`paddingHorizontal: 12`) are raw literals duplicating `space.md`'s value (12) instead of importing `space` from `@/theme`; `StatusPill.tsx:28`'s `paddingVertical: 6` is an unsourced magic number too. |
| FR-003 (six primitives matching brief §3) | `BrandMark.test.tsx`/`PrimaryButton.test.tsx`/`SecondaryButton.test.tsx`/`OrDivider.test.tsx`/`StatusPill.test.tsx` — one suite per primitive (five of six; `Field` deferred), each asserting the documented visual role. Verified myself against brief §3 items 1/2/3/5/6, all match. |
| FR-013 (real accessibility label, >=44×44 tap target, inert elements not falsely actionable) | `PrimaryButton.test.tsx`/`SecondaryButton.test.tsx` assert `CONTROL_HEIGHT (56) >= 44` explicitly (not assumed); `BrandMark.test.tsx` asserts a real `accessibilityRole="image"`/label; `OrDivider.test.tsx`/`StatusPill.test.tsx` assert the *absence* of an interactive role via `getByRole` throwing — genuine negative assertions, independently reproduced. |
| spec.md US1 AS2 (`PrimaryButton` disabled → 60% opacity + `accessibilityState.disabled`) | `PrimaryButton.test.tsx`'s disabled test — independently re-run, confirmed it also blocks `onPress` from firing, not just a style/prop check. |
| spec.md US3 AS4 (`StatusPill` is a status indicator, not a control) | `StatusPill.test.tsx`'s "does not carry accessibilityRole='button' by default" — confirmed it's a real negative assertion (`getByRole` throws), not merely "renders." |

## `tasks.md` checklist status (T011–T016)

- [X] T011 `BrandMark` — verified: geometry/color/shadow/font/accessibility all match brief §3
      item 1; test suite green.
- [X] T012 `PrimaryButton` — verified: geometry/color/shadow/disabled-blocks-press/tap-target all
      match brief §3 item 2; test suite green, disabled-blocks-press behavior independently
      re-run.
- [X] T013 `SecondaryButton` — verified: geometry/color/border/no-shadow/no-invented-disabled-rule
      match brief §3 item 3 exactly; test suite green.
- [X] T014 `OrDivider` — verified: hairline + centered "o" + non-interactive; test suite green.
      **Nit-level FR-001 gap**: `marginHorizontal: 12` should be `space.md`.
- [X] T015 `StatusPill` — verified: fill/label-color/radius/content-sized/no-button-role all match
      brief §3 item 6 and spec.md US3 AS4; test suite green. **FR-001 gap**: `paddingHorizontal:
      12`/`paddingVertical: 6` should be sourced from `@/theme`'s `space` scale.
- [X] T016 `README.md` — verified: mirrors `src/features/navigation/README.md`'s pattern and
      correctly cites Constitution Principle V's exception language.

All six boxes correctly checked in `specs/006-visual-identity/tasks.md`; the two geometry-literal
findings below don't change the fact that the tasks were substantively completed — but they are a
genuine, grep-checkable regression against this exact batch's own stated FR (FR-001) and SC
(SC-001), and against the implementer's own (incorrect) claim that the check passed.

## CHECKPOINTS.md walkthrough (C1–C6, as applicable to this task-level review)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md` and `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 — independently re-run, `RESULT: SUCCESS (10/10 stages passed)`, only
      the same pre-existing disclosed Stage 5/6 warnings.

**C2 — state coherent**
- [x] At most one feature `in_progress` (`006-visual-identity`).
- [x] Every `done` feature has passing tests covering it (full suite green, 329/329, no
      regression introduced by this batch).
- [x] `progress/current.md` describes only the active session.

**C3 — architecture respected**
- [ ] `src/features/ui/OrDivider.tsx` and `src/features/ui/StatusPill.tsx` embed raw numeric
      literals (`12`, `12`, `6`) in the component body that duplicate/should trace to
      `src/theme`'s `space` scale instead of a bare literal — a direct, grep-confirmed instance
      of the exact anti-pattern FR-001/SC-001 (and this checklist's own architecture gate) exist
      to catch. Everything else in this batch (platform-split convention, no direct data access,
      no new global state, no stray `console.log`/context-free `TODO`) is clean.
- [x] No UI component in this batch embeds a fetch call, validation, or business rule directly
      (these are pure presentational primitives, no domain logic to embed).
- [x] No `Platform.OS` inline branch anywhere in this batch's five files (none needed — no
      platform-specific rendering at this primitive's scope).
- [x] No direct Postgres/Redis/S3/Supabase-table access.
- [x] No new global state library.
- [x] No stray `console.log`/context-free `TODO` (grepped, none present in the six new files).

**C4 — verification real**
- [x] Every new component has a covering `.test.tsx` asserting rendered role/label/style/behavior
      (confirmed by reading and re-running each suite) — not "doesn't crash."
- [x] `./init.sh`'s build checks pass for all three targets, independently re-run.

**C5 — session closed well**
- [x] No suspicious untracked files — only the twelve documented `src/features/ui/*` files plus
      expected progress/spec artifacts.
- [ ] `progress/history.md` has no entry yet for this specific mid-session checkpoint — expected
      and not blocking, consistent with the same note in the T001 and T002–T009 review rounds
      (session-close bookkeeping is the orchestrator's job, not per-task).
- [x] `feature_list.json` accurately reflects `006-visual-identity` as `in_progress`.

**C6 — SDD**
- [x] `006-visual-identity` (`sdd: true`, `in_progress`) has `spec.md` + `plan.md` + `tasks.md`.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers.
- [x] N/A yet at the feature level (not `done`); T011–T016 themselves are correctly `[X]`.
- [x] FR-001/FR-003/FR-013 (the FRs this batch's tasks cite) are each referenced by at least one
      test description/comment — traceability itself is present even where the underlying
      implementation has a gap (FR-001).

One blocking empty box at this task-level scope: **C3**, due to the two magic-literal findings
below (`progress/history.md`'s empty C5 box is the same pre-existing, explicitly non-blocking,
per-task-vs-session-close distinction already accepted in the T001/T002–T009 rounds).

## Findings

**Blocking**: `src/features/ui/OrDivider.tsx:32` (`marginHorizontal: 12`) and
`src/features/ui/StatusPill.tsx:27` (`paddingHorizontal: 12`) hardcode a raw numeric literal that
duplicates `src/theme/geometry.ts`'s `space.md` (12) instead of importing and using the token —
directly violating FR-001 ("no raw hex value or magic numeric literal duplicating a token's value
may appear directly in a screen or primitive component body") and SC-001 ("Zero raw hex values or
magic style-literal duplicates of a token value appear anywhere in the login/scan screens or the
six shared primitives — verified by code review/grep"). `StatusPill.tsx:28`
(`paddingVertical: 6`) is the same underlying problem (geometry not sourced from `@/theme` at
all), though it happens not to numerically match an existing `space.*` value. This directly
contradicts `progress/impl_006-visual-identity.md`'s Run 3 claim that every primitive imports
"exclusively" from `@/theme` with "zero raw hex/magic-number literal in any component body" — a
claim that does not hold for two of the five primitives as shipped, confirmed independently by
grep and by reading the files. Failure scenario: a future edit to `src/theme/geometry.ts`'s
`space.md` value (e.g. a design tweak from 12 to 10) would silently *not* propagate to
`OrDivider`'s label spacing or `StatusPill`'s horizontal padding, leaving them visually
inconsistent with every other primitive that correctly derives its spacing from the token module
— exactly the "re-typed per screen" drift risk the token layer exists to eliminate (spec.md's own
framing, "The gap this fills").

**Everything else in this batch is correct**: `BrandMark`, `PrimaryButton`, `SecondaryButton`
draw every color/typography/geometry/elevation value from `@/theme` with no exception; disabled
behavior on `PrimaryButton` genuinely blocks `onPress` (independently re-run, not just read);
`SecondaryButton` correctly omits a disabled-opacity rule the brief doesn't specify, and correctly
omits any shadow; `OrDivider`/`StatusPill`'s non-interactivity assertions are genuine negative
checks, not renders-only smoke tests; the README accurately mirrors
`src/features/navigation/README.md` and correctly invokes Constitution Principle V's actual text;
`tasks.md` is correctly updated; the batch's blast radius is exactly `src/features/ui/`; the full
test suite (329/329) and `./init.sh` (10/10 stages) are both genuinely green with no new
regressions.

## Verdict

**REQUEST CHANGES** — `task-implementer` needs to fix, in `src/features/ui/OrDivider.tsx` and
`src/features/ui/StatusPill.tsx` only (no other file in this batch needs a change):

1. `OrDivider.tsx`: replace the hardcoded `marginHorizontal: 12` with `space.md` (import `space`
   from `@/theme`).
2. `StatusPill.tsx`: replace the hardcoded `paddingHorizontal: 12` with `space.md`, and either
   source `paddingVertical: 6` from an appropriate `@/theme` value (e.g. `space.sm` (8), if a
   slightly larger pill is acceptable — cross-check against the brief's "small horizontal
   padding" phrasing since only horizontal padding is explicitly called out) or, if no existing
   token fits, treat this one value as an accepted, disclosed exception with an inline comment
   explaining why — not a silently unsourced literal.
3. Re-run `src/features/ui/OrDivider.test.tsx` and `StatusPill.test.tsx` (and the full suite) to
   confirm no visual/behavioral regression from the fix, and correct
   `progress/impl_006-visual-identity.md`'s Run 3 claim ("zero raw hex/magic-number literal in
   any component body") to accurately reflect what shipped.

No other issue found in T011–T016's scope; once the two files above are corrected this batch is
ready to re-review.

---

# Re-review — 006-visual-identity — T011–T016 fix (Run 4: `OrDivider.tsx` / `StatusPill.tsx`)

**Scope of this re-review**: verifying `task-implementer`'s Run 4 fix (per
`progress/impl_006-visual-identity.md`'s Run 4 section) against the CHANGES_REQUESTED findings
in this file's own prior T011–T016 entry above. Only `src/features/ui/OrDivider.tsx`,
`src/features/ui/StatusPill.tsx`, and `progress/impl_006-visual-identity.md` were in scope for
this fix round.

## Independent verification performed

1. **Blast-radius check** — compared file mtimes (`stat -f "%Sm"`) across every file in
   `src/features/ui/`, `src/theme/`, `specs/006-visual-identity/tasks.md`, and
   `docs/design-brief-visual-identity.md` against this review file's own last-modified timestamp
   (15:04:30, the CHANGES_REQUESTED entry). Only `src/features/ui/OrDivider.tsx` (15:05:19),
   `src/features/ui/StatusPill.tsx` (15:05:22), and `progress/impl_006-visual-identity.md`
   (15:06:13) postdate the review. Every other file in this batch/prior batches predates it,
   confirming the fix round touched exactly the two flagged files plus the progress log — no
   drive-by change anywhere else.
2. **`OrDivider.tsx`** — read the current file directly. `label.marginHorizontal` now reads
   `space.md` (imported from `@/theme` alongside `colors`, line 8). No bare `12` remains in the
   `StyleSheet.create` block. Fixed as required.
3. **`StatusPill.tsx`** — read the current file directly. `pill.paddingHorizontal` now reads
   `space.md`. `pill.paddingVertical` now reads `space.sm` (8, was the unsourced literal `6`),
   with an inline comment at lines 28–29 explaining the token choice ("brief §3 item 6 only
   specifies 'small horizontal padding' — no vertical value is given, so `space.sm` is the
   nearest token rather than an unsourced literal"). Cross-checked this claim directly against
   `docs/design-brief-visual-identity.md` line 104–105 (§3 item 6): "`StatusPill` — `accent.
   pillBg` fill, `text.link` label, `radius.pill`, small horizontal padding." — confirmed
   verbatim, the brief genuinely only specifies horizontal padding, no vertical number.
   `task-implementer` took the "disclosed exception with inline comment" branch the prior
   review's remediation instructions offered as one of two acceptable options (source from a
   token, which is what happened — `space.sm` — with the disclosure on *why* that specific token
   was picked over an alternative). Both the review's literal instruction and the design brief's
   actual wording are satisfied; this is a reasonable, well-disclosed judgment call, not a
   fabricated spec fact.
4. **No bare numeric literal remains anywhere in `src/features/ui/*.tsx`** (excluding
   `.test.tsx`) that duplicates or approximates a `space`/`radius`/`CONTROL_HEIGHT` token value
   without sourcing it from `@/theme`. Read every one of the five component files fresh (not
   just the two previously flagged) — `BrandMark.tsx`, `PrimaryButton.tsx`,
   `SecondaryButton.tsx` unchanged and still clean per the prior review's own verification.
   `OrDivider.tsx`/`StatusPill.tsx` now import `space` and use it for every previously-flagged
   value. Remaining literals in the batch: `BrandMark.tsx`'s `fontSize: size * 0.4` (a computed
   proportion of a caller-supplied prop, already correctly excluded by the prior review as not a
   fixed-literal duplicate) and `OrDivider.tsx`'s `height: 1`/`SecondaryButton.tsx`'s
   `borderWidth: 1` (standard 1px hairline/border-width values — not a duplicate of any `space.*`
   token, and not something any component elsewhere in the batch sources from a token either;
   consistent, not a new gap this fix round introduced).
5. **`grep -n "#[0-9a-fA-F]\{3,8\}" src/features/ui/*.tsx`** (excluding `.test.tsx`) — zero
   matches, confirmed fresh (re-run myself, not reused from the prior review's output).
6. **Test files unchanged and still genuine** — read `OrDivider.test.tsx` and
   `StatusPill.test.tsx` in full. Both are byte-identical in assertion substance to what the
   prior review already verified: neither asserts an exact `marginHorizontal`/`paddingHorizontal`/
   `paddingVertical` pixel value (both test suites assert color/radius/role/content-sizing only),
   so the `12→space.md` (no-op, 12===12) and `6→space.sm` (8, a real 2px value change) edits
   could not have required — and did not receive — any weakening to keep passing. Confirmed this
   independently by re-running both suites, not just reading `progress/impl_006-visual-identity.
   md`'s claim.
7. **Ran `npx jest src/features/ui/OrDivider.test.tsx src/features/ui/StatusPill.test.tsx`**
   myself: `Test Suites: 2 passed, 2 total`, `Tests: 5 passed, 5 total`. Matches the implementer's
   Run 4 report exactly.
8. **Full test suite**: ran `npx jest` myself — `Test Suites: 50 passed, 50 total`, `Tests: 329
   passed, 329 total`. Identical to the pre-fix count (no test added/removed by this fix round,
   consistent with a source-only change), no regression.
9. **Type-check**: `node_modules/.bin/tsc --noEmit` — clean, zero output.
10. **`./init.sh` (full, no skip flags)** — ran independently myself (the implementer's own Run 4
    report only ran `--skip-build`, as instructed by this re-review's brief to verify the full
    script including the bundle-export stages at this gate): all 8 stages, `RESULT: SUCCESS
    (10/10 stages passed)`. Stage 5 (expo-doctor) and Stage 6 (native dependency alignment) show
    the identical pre-existing warning set already verified as pre-existing and unrelated across
    every prior round of this feature's review (`expo-image-picker`, `react-native`,
    `react-native-safe-area-context`, `@types/react`, `typescript` version drift). Stage 8 (web/
    iOS/Android bundle export) — all three clean. No new warning or failure introduced by this
    fix.
11. **`progress/impl_006-visual-identity.md`'s correction** — confirmed Run 3's "Files changed"
    section now carries an explicit correction note ("this claim was inaccurate as shipped...
    `code-reviewer` caught this (CHANGES_REQUESTED); fixed in Run 4") rather than silently
    editing the original incorrect claim in place, and Run 4's own section accurately describes
    what changed, why, and discloses the `6→8` visual judgment call for human sign-off. This
    satisfies the re-review brief's requirement that the earlier inaccurate "zero raw hex/magic-
    number literal" claim be corrected, not left standing — it is corrected via an appended,
    clearly-attributed note, which is the right way to fix a progress log (preserves the audit
    trail of what was claimed when, rather than rewriting history).
12. **`tasks.md`** — T014 (line 138) and T015 (line 143) both still `- [X]`, unchanged by this
    fix round (correct — the tasks were already substantively complete; this fix corrects an
    implementation detail flagged by review, not a task-completion status).

## Findings

None remaining. Both previously-flagged files now source every spacing value from `src/theme`'s
`space` token; the one value with no brief-mandated number (`StatusPill`'s vertical padding) is
handled via a disclosed, reasonable token choice with an inline comment explaining the
reasoning, cross-checked directly against the design brief's actual wording — not a silently
invented number. Zero raw hex/magic-number literal duplicating a token value remains anywhere in
`src/features/ui/*.tsx`. Neither test file was weakened — both still assert genuine rendered
behavior (color/radius/role/content-sizing, real negative accessibility-role checks), confirmed
by fresh reading and fresh re-run, not reliance on the implementer's report. The progress log's
prior inaccurate claim is now correctly flagged and corrected via an appended note rather than
left standing. Blast radius for this fix round is exactly the two flagged files plus the
progress log, confirmed via file-mtime comparison. Full test suite (329/329), type-check, and
the complete `./init.sh` (10/10 stages, including the bundle-export stages this re-review gate
specifically required running) are all green beyond the same pre-existing, already-disclosed
Stage 5/6 dependency-drift warnings.

## Verdict

**APPROVE**

T011–T016 (including this fix round) are complete and correct. No further action needed on this
batch; the feature may proceed to its next batch (T017+).

---

# Review: T017–T022 (i18n layer) — 2026-08-05

**Reviewer**: code-reviewer (fresh pass, independent of any prior review in this file)
**Scope claimed**: `src/domain/i18n/{locale,translate,translate.test,copy/login,copy/login.test,
copy/scan,copy/scan.test}.ts`, `src/features/i18n/{LocaleContext,LocaleContext.test}.tsx`,
`src/features/i18n/README.md`.

## What changed (git status)

```
?? src/domain/i18n/
?? src/features/i18n/
```
No other path touched by this batch (confirmed via `git status --porcelain`). `src/domain/i18n/`
and `src/features/i18n/` are new, untracked directories — matches the claimed scope exactly. No
files outside these two directories were modified.

## Traceability table

| Requirement | Implementation | Test |
|---|---|---|
| FR-010 (plain-TS, zero-RN-import lookup fn keyed by key+locale; complete es/en dictionaries for login+scan) | `translate.ts` (`translate(dictionary, locale, key)`); `copy/login.ts` (`loginCopy`); `copy/scan.ts` (`scanCopy`) | `translate.test.ts` ("translate (FR-010)"); `copy/login.test.ts` / `copy/scan.test.ts` ("(FR-010, spec.md US4 AS2)") |
| FR-011 (locale context/provider + lookup hook, no restructuring needed for a future picker) | `LocaleContext.tsx` (`LocaleProvider`, `useLocale`, `useTranslation`) | `LocaleContext.test.tsx`'s setLocale("en") re-render test |
| FR-012 (fixed default locale, Spanish) | `locale.ts`'s `DEFAULT_LOCALE: Locale = "es"` | `LocaleContext.test.tsx`'s default-locale test |
| US4 AS2 (es/en key parity, unit test not visual inspection) | — | `copy/login.test.ts` / `copy/scan.test.ts` key-parity assertions (ran myself, pass) |
| US4 AS3 (no picker → resolves fixed default) | `LocaleProvider`'s `useState<Locale>(DEFAULT_LOCALE)` | `LocaleContext.test.tsx` |
| US4 AS4 (resolution logic in plain TS, zero RN import, unit-tested directly) | `translate.ts` | `translate.test.ts` (isolated, no component render) |
| US4 AS5 (seam left for `007-localization`'s picker) | `useLocale().setLocale` | `LocaleContext.test.tsx` + `README.md`'s worked example |

`tasks.md` lists FR-010/011/012 explicitly against T017–T022; all covered.

## `tasks.md` checklist status (T017–T022)

- [X] T017 — `src/domain/i18n/locale.ts` created exactly as specified (`Locale`, `DEFAULT_LOCALE`).
- [X] T018 — `translate.ts` + `.test.ts` created; signature matches task spec exactly.
- [X] T019 — `copy/login.ts` + `.test.ts` created; covers brief §4 plus the three existing forms'
  hardcoded strings.
- [X] T020 — `copy/scan.ts` + `.test.ts` created; covers brief §5.
- [X] T021 — `LocaleContext.tsx` + `.test.tsx` created; `LocaleProvider`/`useLocale`/`useTranslation`
  all present.
- [X] T022 — `src/features/i18n/README.md` created.

All six boxes match the actual files on disk — no task marked done without a corresponding,
verified artifact.

## Independent verification performed

1. **Zero React Native/Expo imports in the portable layer** — `grep -rn "react-native\|expo-"
   src/domain/i18n/` → no matches. `translate.ts`'s only import is `type Locale` from
   `./locale.ts` (itself import-free). Confirms Constitution Principle IV for this layer.
   `LocaleContext.tsx` does import `react` — expected and correct per the review brief, this is
   the thin RN-aware wrapper, not the portable layer.

2. **`translate()` signature/behavior** — `translate<T extends Record<string,string>>(dictionary:
   {es:T; en:T}, locale: Locale, key: keyof T): string` — exactly matches spec's described shape.
   `translate.test.ts` covers both `"es"` and `"en"` resolution against a local test dictionary,
   isolated from `login.ts`/`scan.ts` (a genuine unit test of the primitive, not an indirect one).
   Ran `npx jest src/domain/i18n/translate.test.ts` — 2/2 pass.

3. **`copy/login.ts` — brief §4 coverage and orthography** — read `docs/design-brief-visual-
   identity.md` §4 fresh and cross-checked every specified string against `loginCopy.es`:
   `brandTitle`("Draw a Card"), `tagline`, `emailLabel`("Correo")/`emailPlaceholder`
   ("correo@ejemplo.com"), `passwordLabel`("Contraseña" — correct accented form, not
   "CONTRASENA"), `forgotPassword`("Olvidé mi contraseña" — correct accent, not "Olvide"),
   `signInButton`("Entrar"), `createAccount`("Crear cuenta"), and the three-segment legal line
   (`legalPrefix`/`termsLink`="Términos de Uso"/`legalMiddle`/`privacyLink`="Política de
   Privacidad" — both correctly accented). All present, correctly accented. Confirmed
   `label.field`'s `textTransform:"uppercase"` (in `src/theme/typography.ts`, verified by reading
   it directly) is what produces the brief's all-caps `CORREO`/`CONTRASEÑA` rendering, so storing
   natural-case `"Correo"`/`"Contraseña"` in the dictionary is correct, not a shortcut.

4. **`copy/login.ts` — existing hardcoded-string capture from the three identity forms** — read
   `SignInForm.tsx`, `RequestPasswordResetForm.tsx`, `ResetPasswordForm.tsx` in full myself (not
   relying on the implementer's report) and diffed every literal string against the dictionary:
   - `SignInForm.tsx`: "Sign in"(title)→`signInTitle`, "Forgot password?"→`forgotPassword`,
     "Sign in"(button)→`signInButton`, "Signing in…"→`signingIn`, "Create account"→`createAccount`,
     "Email"→`emailLabel`, "Password"→`passwordLabel`. All captured.
   - `RequestPasswordResetForm.tsx`: "Reset your password"→`requestResetTitle`, "Enter your email
     and we'll send you a code to reset your password."→`requestResetSubtitle`,
     `REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE`("If that email is registered, we've sent a
     code")→`requestResetConfirmation` (exact string match, no trailing period, matches source
     exactly), "Send reset code"→`sendResetCode`, "Sending…"→`sendingResetCode`, "Back to sign
     in"→`backToSignIn`. All captured.
   - `ResetPasswordForm.tsx`: "Enter your reset code"→`resetCodeTitle`,
     `RESET_CODE_SENT_MESSAGE`("If that email is registered, we've sent a code.", **with**
     trailing period, correctly distinguished from the other confirmation string)→
     `resetCodeSentMessage`, "Enter the code we emailed you, along with a new
     password."→`resetCodeSubtitle`, "Reset code"→`resetCodeLabel`, "New
     password"→`newPasswordLabel`, "Set new password"→`setNewPassword`, "Setting
     password…"→`settingPassword`, "Resend code"→`resendCode`, `` `Resend code
     (${secondsRemaining}s)` `` → `resendCodeWithSeconds` (stored as a documented
     `"{{seconds}}"`-placeholder template, since `translate()` deliberately has no interpolation —
     a reasonable, explicitly-documented deferral to the later task that wires this in), "Back to
     sign in"→`backToSignIn`. All captured.
   No gaps found. The dictionary is genuinely complete enough for T028/T030/T032 to route these
   three forms through it with zero remaining hardcoded copy, as the task brief required.

5. **`copy/scan.ts` — brief §5 coverage** — cross-checked against `docs/design-brief-visual-
   identity.md` §5: `titleMobile`("Escanear")/`titleWeb`("Escanear carta"), `viewfinderHint`
   ("Apunta la cámara a la carta"), `searchPlaceholder`("Buscar carta por nombre o código…"),
   `uploadDropzone`("Subir imagen de carta"), `scanButton`("Escanear carta"),
   `statusPillCameraAvailable`("Cámara disponible"), `emptyResultsLine1`/`emptyResultsLine2` (both
   §5.2 empty-panel lines), `recentScansHeading`("Escaneos recientes", natural case for
   `label.section`'s uppercase transform — correctly reasoned), and the existing "Back"/"Back to
   Home" affordance (`backLabel`/`backAccessibilityLabel`, sourced from `app/scan.tsx`). All
   present. The recent-scans row *data* (thumbnail/name/meta/price) is correctly excluded per
   FR-008 (placeholder data, not copy) and the file's own comment says so explicitly.

6. **Compile-time key parity** — `en`'s type in both `copy/login.ts` and `copy/scan.ts` is
   `Record<keyof typeof es, string>`; confirmed by reading the type annotation directly (not
   assumed). `node_modules/.bin/tsc --noEmit` — clean, zero errors, so this constraint is live
   in the actual build, not just declared.

7. **Ran `npx jest src/domain/i18n src/features/i18n`** myself: `Test Suites: 4 passed, 4 total`,
   `Tests: 12 passed, 12 total`. Runtime key-parity tests
   (`Object.keys(es).sort()`/`Object.keys(en).sort()`) genuinely pass, not just declared.

8. **`LocaleContext.tsx`** — `LocaleProvider`, `useLocale()`, `useTranslation()` all present and
   match the spec'd shapes. Default state is `DEFAULT_LOCALE` (`"es"`). Ran
   `LocaleContext.test.tsx` myself: confirms `"Hola"` resolves by default, and after
   `fireEvent.press` on a `setLocale("en")` trigger + re-render, resolves `"Hello"` — a genuine
   end-to-end exercise of the context, not a mocked assertion. A third test confirms the
   outside-provider fallback (documented, reasonable, non-security-sensitive default).

9. **`src/features/i18n/README.md`** — documents the `useLocale().setLocale` seam with a worked
   code example, states the `DEFAULT_LOCALE = "es"` hardcoded-placeholder framing by quoting
   spec.md's Assumptions section verbatim (cross-checked against spec.md's actual Assumptions text
   — matches exactly, not paraphrased loosely), and gives a concrete numbered "how to add a new
   screen's dictionary" guide pointing at `copy/login.ts`/`copy/scan.ts` as worked examples.

10. **Full test suite** — ran `npx jest` myself (not the implementer's report): `Test Suites: 54
    passed, 54 total`, `Tests: 341 passed, 341 total`. The T017–T022 batch's 4 suites/12 tests are
    included in this count with no regression elsewhere.

11. **Type-check** — `node_modules/.bin/tsc --noEmit` — clean, zero output.

12. **`./init.sh` (full, no skip flags)**, ran independently: all 8 stages, `RESULT: SUCCESS
    (10/10 stages passed)`. Stage 5 (expo-doctor) and Stage 6 (native dependency alignment) show
    the same pre-existing, previously-disclosed warning set (outdated `expo-image-picker`,
    `react-native`, `react-native-safe-area-context`, `@types/react`, `typescript` versions) —
    unrelated to this batch, which adds zero new dependencies. No new warning introduced.

## CHECKPOINTS.md walkthrough (C1–C6, as applicable to this task-level review)

- **C1** — [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all exist. [x]
  `docs/verification.md`/`docs/conventions.md` exist. [x] `.specify/memory/constitution.md`
  exists and current. [x] `./init.sh` exits 0 (test-tooling warning n/a — tooling already
  installed; only the pre-existing native-dep/expo-doctor warnings, both excepted).
- **C2** — [x] Only `006-visual-identity` is `in_progress` in `feature_list.json` (spot-checked
  the entry). [x] This batch's tests genuinely pass (see above). [x] `progress/current.md`
  describes only this active session (read in full above, no stale content).
- **C3** — [x] `src/domain/i18n` has zero RN/Expo imports (grepped). [x]
  `src/features/i18n/LocaleContext.tsx` calls into the domain layer rather than embedding logic
  itself. [x] No platform-specific branching needed/introduced in this batch (n/a — pure
  data/context layer, no platform split expected here, matches spec.md's Platform notes for US4:
  "identical across iOS, Android, and web"). [x] No direct DB/Postgres/Supabase-table access —
  this is pure client-side copy data, no backend touchpoint (matches spec.md's own "Related
  backend spec: none"). [x] No new global state library (uses plain React context, already an
  established pattern in this repo). [x] No stray `console.log`/context-free `TODO` (grepped
  the six files, none found).
- **C4** — [x] Every exported `src/domain/i18n` function/dictionary has a covering unit test
  (`translate`, `loginCopy`, `scanCopy` all tested). [x] `LocaleContext.test.tsx` uses React
  Native Testing Library against real rendered output (`screen.getByTestId(...).props.children`),
  not internal state. [x] `./init.sh`'s three bundle-export stages (web/iOS/Android) all green,
  confirmed above; native-dependency-alignment stage is WARN not FAIL (pre-existing, unrelated).
- **C5** — [x] No suspicious untracked files beyond the expected new directories (checked `git
  status --porcelain`, only `src/domain/i18n/` and `src/features/i18n/` new alongside the
  broader feature's already-known untracked set). C5's `progress/history.md` entry and final
  `feature_list.json` state are end-of-session concerns for the orchestrator, not this
  task-level batch — not evaluated as blocking at this sub-task granularity.
- **C6** — [x] `006-visual-identity` (`"sdd": true`) has `spec.md`+`plan.md`+`tasks.md`, all
  present and read fresh this review. [x] No open `[NEEDS CLARIFICATION]` markers in `spec.md`
  (three Clarifications entries are recorded defaults, already human-confirmed per
  `progress/current.md`, not open markers). [x] Feature is `in_progress`, not `done` — the
  "every `done` feature's `tasks.md` fully `[X]`" checkbox doesn't yet apply. [x] FR-010/011/012
  each covered by at least one test referencing it (see Traceability table above).

No checkbox in C1–C6 is empty for what's in scope of this task-level batch.

## Findings

None blocking. Two minor observations, neither rising to a nit worth a fix cycle:

1. `translate.ts`'s doc comment (line 5–7) references `useTranslation()` as living in
   `LocaleContext.tsx` — accurate, just noting the cross-file comment is correct and not stale
   (verified `useTranslation` is indeed exported from `LocaleContext.tsx`, not elsewhere).
2. `copy/login.ts`'s `resendCodeWithSeconds` placeholder-token approach
   (`"Reenviar código ({{seconds}}s)"` with a documented future `.replace()` call site) is a
   reasonable, explicitly-flagged deferral rather than a gap — `translate()`'s lack of
   interpolation support is itself a documented, proportionate scope decision in `plan.md`. Not a
   finding, just confirming this wasn't quietly dropped.

## Verdict

**APPROVE**

T017–T022 are complete, correctly scoped to `src/domain/i18n/` and `src/features/i18n/` only,
fully test-covered (12/12 new tests, 341/341 full suite, `tsc` clean, `./init.sh` 10/10 green with
only pre-existing disclosed warnings), and independently verified against `docs/design-brief-
visual-identity.md` §4/§5 and the three existing identity form files rather than taking the
implementer's report at its word. Spanish orthography is correct throughout
(`CONTRASEÑA`/`Contraseña`, `Olvidé mi contraseña`, `Términos de Uso`, `Política de Privacidad`).
`tasks.md` T017–T022 are all `[X]` and match the actual files on disk.

---

# Review: T010 (font-loading gate + LocaleProvider wrap at app/_layout.tsx) — 2026-08-05

**Scope**: Last remaining Phase 2 task. `app/_layout.tsx` modified to add a Playfair Display
`useFonts()` loading gate and wrap the existing `QueryClientProvider`/`KycGate` tree in
`LocaleProvider`; new test `src/features/i18n/RootLayout.test.tsx`. Given as the highest-risk
task in this phase (touches the app root every other feature's routing/gate depends on), this
review treats it with the requested extra scrutiny.

## Diff reviewed

`git diff main -- app/_layout.tsx`:

```diff
 import { Redirect, Stack } from "expo-router";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
+import { PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
+import { useFonts } from "expo-font";
 import { useState } from "react";
 import { View } from "react-native";

 import { KYC_ROUTE_TARGETS, useKycGate } from "@/features/identity/useKycGate";
+import { LocaleProvider } from "@/features/i18n/LocaleContext";
+import { PLAYFAIR_DISPLAY_BOLD } from "@/theme/fonts";

 export default function RootLayout() {
   const [queryClient] = useState(() => new QueryClient());
+  const [fontsLoaded] = useFonts({ [PLAYFAIR_DISPLAY_BOLD]: PlayfairDisplay_700Bold });
+
+  if (!fontsLoaded) {
+    return <View testID="fonts-loading" style={{ flex: 1 }} />;
+  }

   return (
-    <QueryClientProvider client={queryClient}>
-      <KycGate />
-    </QueryClientProvider>
+    <LocaleProvider>
+      <QueryClientProvider client={queryClient}>
+        <KycGate />
+      </QueryClientProvider>
+    </LocaleProvider>
   );
 }
```

`KycGate` (the unexported function below `RootLayout`, lines 51–64) is byte-for-byte unchanged —
confirmed by reading the full current file, not just the diff hunk.

## Zero behavioral change to the KYC gate — verified independently

- `git diff main --stat -- src/features/identity/useKycGate.ts src/domain/kyc-gate.ts` → empty
  output on both. Neither file appears anywhere in the working-tree diff against `main`.
- `KycGate()` in `app/_layout.tsx` still calls the same `useKycGate()`, same `isLoading` branch
  (`<View testID="kyc-gate-loading" style={{ flex: 1 }} />`), same `resolveKycRoute()`-driven
  `<Redirect>`/`<Stack>` composition — this task only adds a new sibling condition (`!fontsLoaded`)
  that short-circuits *before* `KycGate` is even mounted, and a new ancestor provider
  (`LocaleProvider`) that `KycGate` renders underneath. Confirmed by `RootLayout.test.tsx`'s first
  test: `expect(mockUseKycGate).not.toHaveBeenCalled()` while fonts are loading — proves the font
  gate sits strictly above `KycGate`, not interleaved with its logic.
- This satisfies `005-login`'s FR-006 (gate owns navigation, no `useRouter()` call on sign-in) by
  construction — nothing in `LoginScreen`/`SignInForm`'s call chain to the gate changed, and the
  gate's own file is untouched.

## Font-loading placeholder — exact match confirmed

`app/_layout.tsx:26`: `<View testID="fonts-loading" style={{ flex: 1 }} />` vs. `app/_layout.tsx:55`
(`KycGate`'s own): `<View testID="kyc-gate-loading" style={{ flex: 1 }} />`. Identical `style={{
flex: 1 }}` shape; the only difference is the `testID` attribute (test instrumentation only, not
rendered/visible). This matches plan.md's "Font loading" Research Decision verbatim ("render the
same minimal `<View style={{ flex: 1 }} />` placeholder... not a new, differently-styled loading
screen").

`useFonts({ [PLAYFAIR_DISPLAY_BOLD]: PlayfairDisplay_700Bold })` uses a computed property key
referencing `src/theme/fonts.ts`'s `PLAYFAIR_DISPLAY_BOLD` constant rather than the task text's
literal `useFonts({ PlayfairDisplay_700Bold })` shorthand — verified `PLAYFAIR_DISPLAY_BOLD =
"PlayfairDisplay_700Bold"` in `src/theme/fonts.ts`, so this produces the identical runtime key.
This is a disclosed, non-behavioral, DRY-motivated deviation (avoids a second hardcoded string
literal that could drift from `typography.ts`'s `fontFamily` reference) — acceptable.

## LocaleProvider wrap — correctly ordered, no shadowing

`LocaleProvider` (from `src/features/i18n/LocaleContext.tsx`, T021 — confirmed already landed,
untouched by this diff) wraps `QueryClientProvider`/`KycGate` as the outermost provider, matching
the task instruction ("wrap the existing `QueryClientProvider`/`KycGate` tree in
`LocaleContext.tsx`'s provider"). No duplicate `LocaleProvider` exists anywhere else in the tree
(grepped `src/` and `app/` for `LocaleProvider` — only this one usage site plus the export
definition and its own test file). `useLocale()`'s no-provider fallback (`DEFAULT_LOCALE`,
no-op `setLocale`) means even a component rendered in isolation outside this tree degrades
gracefully, but every screen under `RootLayout` now has the real provider available.

## Test placement — complies with the documented `_layout.*` exception

`docs/conventions.md` lines 63–81: tests for `_layout.*` files under `app/` must NOT be colocated
(`expo-router`'s dev-server route-manifest scan treats `_layout.test.tsx` as a second
`_layout.tsx` in the same directory and crashes `expo start --web`). `RootLayout.test.tsx` is
placed at `src/features/i18n/RootLayout.test.tsx`, importing the default export by relative path
(`import RootLayout from "../../../app/_layout";`) — exactly the documented pattern, matching the
existing precedent `src/features/navigation/AppWebLayout.test.tsx`. The file's own header comment
explains the placement choice and cites the same mechanism. Confirmed by running
`npx jest src/features/i18n/RootLayout.test.tsx` directly (see below) — no crash, no conflict.

## New test file — three tests, all real assertions

Ran directly: `npx jest src/features/i18n/RootLayout.test.tsx` → `PASS`, 3/3 tests:

1. "renders the flex:1 placeholder while fonts are loading, not the app tree" — mocks `useFonts`
   → `[false, null]`, asserts `getByTestId("fonts-loading")` present, `stack-placeholder` absent,
   **and** `mockUseKycGate` was never called — a genuine assertion that `KycGate`/`useKycGate()`
   isn't even mounted during the font gate, not just "doesn't throw."
2. "renders the existing tree wrapped in the locale provider once fonts are loaded" — mocks
   `useFonts` → `[true, null]`; the mocked `expo-router`'s `<Stack>` stand-in calls the **real**
   (unmocked) `useLocale()` and renders the resolved locale into text; asserts that text is `"es"`
   (the real `DEFAULT_LOCALE`) rather than `useLocale()`'s own no-provider fallback value — this
   is a real proof of the provider wrap, not a shallow "renders without throwing" check.
3. "does not alter KycGate's own isLoading placeholder once fonts are loaded" — fonts loaded,
   `useKycGate` mocked to `isLoading: true`; asserts `KycGate`'s own real,
   unmocked-in-this-file `<View testID="kyc-gate-loading" ... />` still renders exactly as before
   — the direct regression guard for the "zero behavioral change to KycGate" requirement.

All three are genuine behavioral assertions, not placeholders.

## Full test suite — run independently

```
$ npx jest --silent
...
Test Suites: 55 passed, 55 total
Tests:       344 passed, 344 total
```

Zero regressions anywhere else in the repo (identity, navigation, scanner, domain, lib suites all
green), including `src/domain/kyc-gate.test.ts` and `src/features/identity/useKycGate.test.ts`
themselves (unmodified, still passing).

## Type-check

`node_modules/.bin/tsc --noEmit` → clean, no output, exit 0.

## `./init.sh` — run independently, full 8 stages, no skip flags

```
▶ 1/8 Prerequisites                  ✅ OK
▶ 2/8 Env file                       ✅ OK
▶ 3/8 Installing dependencies        ✅ OK
▶ 4/8 Type-checking                  ✅ OK — no type errors
▶ 5/8 Expo config/dependency health  ⚠️  WARN — same pre-existing "outdated dependencies"
                                          advisory as every prior run, unrelated to this change
▶ 6/8 Native dependency alignment    ⚠️  WARN — same pre-existing version drift
                                          (expo-image-picker, react-native,
                                          react-native-safe-area-context, @types/react,
                                          typescript), unrelated to this change
▶ 7/8 Running test suite             ✅ OK — all 344 tests passed
▶ 8/8 Bundle export smoke checks     ✅ OK — web/iOS/Android all exported cleanly
RESULT: SUCCESS (10/10 stages passed)
```

Matches task-implementer's Run 6 report in `progress/impl_006-visual-identity.md` exactly — same
two pre-existing, disclosed, unrelated warnings, everything else green, all three bundle exports
(web/iOS/Android) clean including the new font/locale imports.

## `tasks.md` status

T010 is `[X]`. All of T001–T022 (Phase 1 Setup + Phase 2 Foundational) are `[X]` — Phase 2 is
genuinely complete. T023 onward (Phase 3, login restyle) correctly remain unchecked.

## File-scope check — no drift

`app/_layout.tsx`, `src/features/i18n/RootLayout.test.tsx` (new), `specs/006-visual-identity/
tasks.md` (checkbox only), and `progress/impl_006-visual-identity.md` (Run 6 section appended) are
the only files this batch touches, matching task-implementer's own "Files changed" list in Run 6.
`app.json`/`feature_list.json`/`package.json`/`package-lock.json` carry diffs against `main` but
those are pre-existing, from earlier tasks in this feature (T001's dependency additions/scoping
gate), not new drift introduced by T010.

## Requirement traceability

| FR / Decision | Test |
|---|---|
| spec.md Clarifications Recorded default 1 (bundled font, loaded once at root, gated behind a loading guard mirroring `KycGate`, no fallback-font flash) | `RootLayout.test.tsx` test 1 |
| FR-011 (locale context/provider genuinely wired into the app root, not just exported unused) | `RootLayout.test.tsx` test 2 |
| Zero behavioral change to `KycGate`/`useKycGate()` (implicit regression requirement, plan.md Constraints + Research Decision) | `RootLayout.test.tsx` test 3, plus zero diff on `useKycGate.ts`/`kyc-gate.ts`, plus full-suite green including their own pre-existing tests |

## CHECKPOINTS.md walkthrough (C1–C6, scoped to this batch)

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all exist. [x]
  `docs/verification.md`/`docs/conventions.md` exist. [x] `.specify/memory/constitution.md`
  exists. [x] `./init.sh` exits 0 (only the same pre-existing, documented warnings).
- **C2**: [x] Exactly one feature (`006-visual-identity`) `in_progress`. [x] N/A — no feature
  reached `done` in this batch. [x] `progress/current.md` reflects the active session (not
  verified line-by-line here, out of this batch's direct scope, but nothing in this diff
  contradicts it).
- **C3**: [x] `src/domain` untouched by this batch, still zero RN imports. [x] `app/_layout.tsx`
  calls into `useKycGate()`/`useFonts()`/`LocaleProvider` — no inline fetch/validation/business
  rule added. [x] No new platform-conditional code introduced by this diff. [x] No direct
  Postgres/Redis/S3/Supabase-table access. [x] No new global state library (`LocaleProvider` is
  plain React context, already justified in T021's own review). [x] No stray `console.log`/
  context-free `TODO`.
- **C4**: [x] N/A — no new `src/domain` export in this batch. [x] The new/changed screen surface
  (`RootLayout`) has a real component test (RTL-based, asserting rendered output/testIDs/text, not
  internals). [x] `./init.sh` build checks pass on all three targets; native-dependency-alignment
  stage WARNs (not FAILs) with the same pre-existing drift, not new.
- **C5**: [x] No suspicious untracked files beyond the expected new source/test/doc files for this
  feature. [x] Not evaluated here (session-closing artifact, out of this single-task batch's
  scope). [x] `feature_list.json`'s `006-visual-identity` entry reflects `in_progress` (from
  earlier scoping, unmodified by this batch).
- **C6**: [x] `spec.md`/`plan.md`/`tasks.md` all exist for this `"sdd": true` feature. [x] No open
  `[NEEDS CLARIFICATION]` markers (the three Recorded defaults are resolved defaults, not open
  markers). [x] Feature is `in_progress`, not `done` — the "every `done` feature's `tasks.md`
  fully `[X]`" checkbox doesn't yet apply, though Phase 2 (T001–T022) is now fully `[X]` as
  claimed. [x] FR-011 and the font-loading Recorded default are each covered by a test
  referencing them (see Traceability table above).

No checkbox in C1–C6 is empty for what's in scope of this task-level batch.

## Findings

None. This is a clean, narrowly-scoped, additive change to the highest-risk file in the phase,
independently verified against every regression surface the task called out: `KycGate`/
`useKycGate()`/`resolveKycRoute()` are byte-for-byte untouched, the loading placeholder is an
exact visual match (not a second convention), the provider wrap is correctly ordered with no
shadowing, the test file's placement complies with the documented `_layout.*` exception, all new
and pre-existing tests pass (344/344), `tsc` is clean, and `./init.sh` is green on all three
bundle targets with only the same pre-existing, disclosed, unrelated warnings.

## Verdict

**APPROVE**

T010 completes Phase 2 (T001–T022, all `[X]`) with zero measurable regression risk to
`001-registration-kyc`/`004-home-scan-shell`/`005-login`'s routing/gate behavior. Ready for Phase
3 (User Story 2, login restyle) to begin.

---

# Review: T023, T024, T024a — `FormField`/`Field` restyle (highest-blast-radius task)

**Scope**: `src/features/identity/FormField.tsx` (modified), `src/features/identity/
FormField.web.tsx` (new), `src/features/identity/FormField.test.tsx` (new). Reviewed against
`specs/006-visual-identity/spec.md`, `plan.md`, `tasks.md`, `docs/design-brief-visual-
identity.md` §3 item 4, `.specify/memory/constitution.md`, `docs/conventions.md`, and
`progress/impl_006-visual-identity.md` Run 7.

## What changed (git diff / status)

- `src/features/identity/FormField.tsx` — modified in place. `FormFieldProps` interface is
  byte-for-byte unchanged (`label: string; error?: string; children: ReactNode; testID?:
  string;` — confirmed by diffing the interface block directly: zero `+`/`-` lines touch it).
  The rendered JSX gains a new inner `View` (`styles.inputContainer`) wrapping `children`,
  styled with `colors.bg.surface`, `radius.pill`, `CONTROL_HEIGHT`, `space.xl` (20) horizontal
  padding, `justifyContent: "center"`, and `shadowSurface` spread onto the `style` array — no
  `borderWidth`. The label style changed from a hardcoded `{ fontSize: 14, fontWeight: "500",
  color: "#374151" }` to `{ ...typography.label.field }` (uppercase, 12px/500, `letterSpacing`,
  `colors.text.secondary`). The pre-existing error `<Text accessibilityRole="alert">` block is
  untouched in structure/behavior; its literal `#dc2626` color is left as-is (pre-existing from
  `001-registration-kyc`, not introduced by this diff — see Findings).
- `src/features/identity/FormField.web.tsx` — new file. Same `FormFieldProps` shape/structure,
  same `inputContainer` base styling, but `borderWidth: 1` / `borderColor: colors.border.input`
  and no shadow import/usage at all.
- `src/features/identity/FormField.test.tsx` — new file (see "Extended vs. new" below). 7 tests
  covering uppercase label, mobile borderless+shadow, web bordered+no-shadow, and the
  pre-existing `accessibilityRole="alert"` behavior on both variants.
- `specs/006-visual-identity/tasks.md` — T023, T024, T024a marked `[X]` (confirmed by direct
  read).
- `progress/impl_006-visual-identity.md` — Run 7 section appended.

## "Extended" vs. "new" test file — verified independently

`progress/impl_006-visual-identity.md`'s Run 7 report says `FormField.test.tsx` is genuinely
new, not modified, despite T024a's task text saying "Extend." Verified independently, not
taken on the implementer's word:

```
$ git log --oneline --follow -- src/features/identity/FormField.test.tsx
(no output — no history at all, file has no prior commits)
$ git show main:src/features/identity/FormField.test.tsx
fatal: path 'src/features/identity/FormField.test.tsx' exists on disk, but not in 'main'
```

Confirmed: `FormField.tsx` never had a colocated test file before this feature (not on `main`,
not on `005-login`, not anywhere in git history). "New" is accurate; no pre-existing coverage
was lost or replaced. No behavior-masking edit risk here since there was nothing to mask.

## `FormFieldProps` shape and call-site regression check — verified independently

Diffed all three existing call sites directly against `main`:

```
$ git diff main -- src/features/identity/RegistrationForm.tsx \
    src/features/identity/VerifyPhoneScreen.tsx src/features/identity/ProfileForm.tsx
(no output)
$ git diff main -- src/features/identity/RegistrationForm.test.tsx \
    src/features/identity/VerifyPhoneScreen.test.tsx src/features/identity/ProfileForm.test.tsx
(no output)
```

Zero changes to how any of the three call `FormField`, and zero changes to their test files —
exactly as the spec/plan require (the restyle is disclosed to change appearance only, plan.md's
"`Field` stays `FormField.tsx`" Research Decision).

Ran all four suites myself:

```
$ npx jest src/features/identity/FormField.test.tsx src/features/identity/RegistrationForm.test.tsx \
    src/features/identity/VerifyPhoneScreen.test.tsx src/features/identity/ProfileForm.test.tsx --no-coverage
PASS src/features/identity/FormField.test.tsx
PASS src/features/identity/VerifyPhoneScreen.test.tsx
PASS src/features/identity/RegistrationForm.test.tsx
PASS src/features/identity/ProfileForm.test.tsx
Test Suites: 4 passed, 4 total
Tests:       31 passed, 31 total
```

All pass unmodified. No test-expectation change was needed in any of the three consumer test
files, so there is nothing to scrutinize there for a behavior-masking edit — the visual
inheritance the plan.md Research Decision disclosed produced zero test breakage, consistent
with those suites asserting roles/labels/text/behavior rather than literal style values.

## `FormField.tsx` (mobile/default) — checked against the `Field` spec

- Uppercase `label.field`: `styles.label` spreads `typography.label.field`
  (`src/theme/typography.ts`), which sets `textTransform: "uppercase"`, 12px/500,
  `letterSpacing: 0.08 * 12`, `colors.text.secondary`. Matches brief §3 item 4 and §2.2.
- `bg.surface` container: `colors.bg.surface` (`#FFFFFF`). Matches.
- `radius.pill`: `radius.pill` (999). Matches.
- `CONTROL_HEIGHT`: `CONTROL_HEIGHT` (56). Matches.
- 20px-equivalent horizontal padding sourced from `space`: `space.xl` = 20 in
  `src/theme/geometry.ts` — an exact match, not a "nearest token" approximation, so no
  documentation of a fudge was needed (there wasn't one).
- Borderless with `shadow.surface`: `shadowSurface` (native `shadowColor`/`shadowOffset`/
  `shadowRadius`/`shadowOpacity`/`elevation`) is spread onto the container's style array; no
  `borderWidth` anywhere in the file. Confirmed by reading the file directly — matches.

## `FormField.web.tsx` — checked against the `Field` spec

Same structure/props; `inputContainer` differs only by `borderWidth: 1`, `borderColor:
colors.border.input`, and the explicit absence of any shadow import/property. Confirmed by
reading the file directly — matches brief §3 item 4's web treatment exactly.

## Token sourcing — no raw hex/magic literal recurrence (FR-001/SC-001)

Both files import exclusively from `@/theme` (`colors`, `CONTROL_HEIGHT`, `radius`,
`shadowSurface`, `space`, `typography`) for every geometry/color/typography/elevation value
touched by this restyle. The one raw literal remaining in `FormField.tsx`/`FormField.web.tsx`
is the pre-existing error-text color (`#dc2626`) — present before this feature, untouched by
this diff, and not part of the brief's §3 item 4 spec (which says nothing about error-text
color) or of `src/theme/colors.ts`'s token set (no error/danger token exists yet). This is not
a recurrence of the T011–T016 magic-literal class of finding (that was a *new* untokenized
literal introduced by this feature's own primitives; this is a pre-existing literal the task's
own documented scope didn't touch) — flagged below as a nit, not a blocking finding.

## `FormField.test.tsx` — run independently

```
$ npx jest src/features/identity/FormField.test.tsx --no-coverage
PASS src/features/identity/FormField.test.tsx
  FormField (mobile/default)
    ✓ renders the label uppercase via typography.label.field
    ✓ renders the input container borderless with a shadow.surface style, bg.surface, and radius.pill
    ✓ renders the error text with accessibilityRole=alert when an error is present
    ✓ renders no error text when no error is provided
  FormField.web
    ✓ renders the input container bordered (border.input) with no shadow
    ✓ renders the label uppercase via typography.label.field
    ✓ still renders the error text with accessibilityRole=alert
Tests: 7 passed, 7 total
```

The web variant is imported explicitly by relative path (`import { FormField as WebFormField }
from "./FormField.web"`), matching this repo's established `.web.tsx` direct-import test
convention (`docs/conventions.md`, e.g. `AppWebLayout.test.tsx`'s precedent). The pre-existing
`accessibilityRole="alert"` error-text behavior is asserted on both variants and holds.

## No inline `Platform.OS` branch — confirmed

```
$ grep -n "Platform" src/features/identity/FormField.tsx src/features/identity/FormField.web.tsx
FormField.tsx:12:   ... not an inline Platform.OS branch here).
FormField.web.tsx:5: ... not an inline Platform.OS branch inside a shared component body.
```

Both hits are comments explaining the convention, not actual `Platform.OS` usage. The base file
(`FormField.tsx`) is the native/default variant; `FormField.web.tsx` is the web override —
correct direction, matches the `.ios.tsx`/`.android.tsx`/`.web.tsx` convention exactly.

## `tasks.md` status

T023, T024, T024a are all `[X]`. T025 onward (LoginScreenChrome and later) correctly remain
unchecked — this batch did not reach beyond its scope.

## Full test suite and `./init.sh` — run independently

```
$ npx tsc --noEmit
(clean, no output)

$ npx jest --no-coverage
Test Suites: 56 passed, 56 total
Tests:       351 passed, 351 total

$ ./init.sh
▶ 1/8 Prerequisites                  ✅ OK
▶ 2/8 Env file                       ✅ OK
▶ 3/8 Installing dependencies        ✅ OK
▶ 4/8 Type-checking                  ✅ OK — no type errors
▶ 5/8 Expo config/dependency health  ⚠️  WARN — same pre-existing "outdated dependencies" advisory
▶ 6/8 Native dependency alignment    ⚠️  WARN — same pre-existing drift (expo-image-picker,
                                          react-native, react-native-safe-area-context,
                                          @types/react, typescript), unrelated to this batch
▶ 7/8 Running test suite             ✅ OK — all tests passed
▶ 8/8 Bundle export smoke checks     ✅ OK — web/iOS/Android all exported cleanly
RESULT: SUCCESS (10/10 stages passed)
```

Matches task-implementer's own reported numbers exactly (56/56 suites, 351/351 tests,
10/10 `init.sh` stages, same two pre-existing WARN stages, no new drift).

## File-scope check — no drift

This batch (Run 7) touches exactly: `src/features/identity/FormField.tsx` (modified),
`src/features/identity/FormField.web.tsx` (new), `src/features/identity/FormField.test.tsx`
(new), `specs/006-visual-identity/tasks.md` (checkbox only), and
`progress/impl_006-visual-identity.md` (Run 7 section appended). Confirmed via `git status`:
every other modified/untracked file (`app.json`, `app/_layout.tsx`, `feature_list.json`,
`package.json`, `package-lock.json`, `progress/current.md`, `src/theme/`, `src/features/ui/`,
`src/domain/i18n/`, `src/features/i18n/`) carries diffs from earlier, already-reviewed batches
(T001–T022, each with its own `APPROVE`d entry earlier in this file), not new drift introduced
by T023/T024/T024a.

## Requirement traceability

| FR / AS | Test |
|---|---|
| FR-001 (semantic tokens only, no raw hex/magic literal duplicating a token) | `FormField.test.tsx`'s style assertions read `colors.bg.surface`/`radius.pill`/`typography.label.field.*` from the real `@/theme` exports |
| FR-003 (`Field` matches brief §3 item 4) | "renders the input container borderless with a shadow.surface style..." (mobile) / "renders the input container bordered (border.input) with no shadow" (web) |
| FR-005 (platform difference via `.web.tsx`, not inline `Platform.OS`) | `FormField.web.tsx` is a distinct file resolved by Metro's convention; confirmed no `Platform.OS` usage in either file |
| spec.md US1 AS3 | Same two border/shadow tests above |
| Regression guard (plan.md's disclosed `FormField` side effect) | `RegistrationForm.test.tsx`/`VerifyPhoneScreen.test.tsx`/`ProfileForm.test.tsx`, re-run independently, all green, zero test-file changes |

## CHECKPOINTS.md walkthrough (C1–C6, scoped to this batch)

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all exist. [x]
  `docs/verification.md`/`docs/conventions.md` exist. [x] `.specify/memory/constitution.md`
  exists. [x] `./init.sh` exits 0 (same pre-existing, documented warnings only).
- **C2**: [x] Exactly one feature (`006-visual-identity`) `in_progress`. [x] N/A — no feature
  reached `done` in this batch. [x] `progress/current.md` reflects the active session (not
  independently re-verified line-by-line here, out of this batch's direct scope, but nothing in
  this diff contradicts it).
- **C3**: [x] `src/domain` untouched by this batch. [x] `FormField.tsx`/`FormField.web.tsx` are
  pure presentational components — no fetch/validation/business-rule embedded. [x]
  Platform-specific rendering (border vs. shadow) uses the `.web.tsx` convention, not an inline
  conditional. [x] No direct Postgres/Redis/S3/Supabase-table access. [x] No new global state
  library. [x] No stray `console.log`/context-free `TODO`.
- **C4**: [x] N/A — no new `src/domain` export in this batch. [x] The changed component has a
  real component test (RTL-based, asserting rendered style/role/text, not internals). [x]
  `./init.sh` build checks pass on all three targets; native-dependency-alignment WARNs with the
  same pre-existing drift, not new.
- **C5**: [x] No suspicious untracked files beyond the expected new source/test files for this
  feature. [x] Not evaluated here (session-closing artifact, out of this single-task batch's
  scope). [x] `feature_list.json`'s `006-visual-identity` entry reflects `in_progress`.
- **C6**: [x] `spec.md`/`plan.md`/`tasks.md` all exist. [x] No open `[NEEDS CLARIFICATION]`
  markers. [x] Feature is `in_progress`, not `done` — full-`[X]` checkbox doesn't yet apply.
  [x] FR-001/FR-003/FR-005 and spec.md US1 AS3 are each covered by a test referencing them (see
  Traceability table above).

No checkbox in C1–C6 is empty for what's in scope of this task-level batch.

## Findings

1. **Nit, non-blocking** — `FormField.tsx`/`FormField.web.tsx`'s error-text color
   (`color: "#dc2626"`) remains a raw hex literal not sourced from `src/theme`. This predates
   this feature (unchanged by this diff, inherited from `001-registration-kyc`), and neither
   `docs/design-brief-visual-identity.md` §3 item 4 nor `src/theme/colors.ts`'s Recorded-default-2
   token set defines an error/danger color, so there is no token to swap it for without inventing
   one outside this task's documented scope. Correctly disclosed inline by task-implementer.
   Does not block this batch, but should be picked up (a `colors.text.danger`-shaped token, or
   equivalent) either later in this feature's Polish phase or in a follow-up, since strictly
   FR-001 says no raw hex may appear in a primitive component body this feature touches, and this
   file is touched.

No other findings. `FormFieldProps` is byte-for-byte unchanged, all three existing call sites and
their test suites are provably untouched and green, the mobile/web split correctly follows the
`.web.tsx` convention with zero `Platform.OS` branching, every new geometry/color/typography/
elevation value traces to `src/theme` (space.xl lands exactly on 20, no fudge needed), the test
file is genuinely new (not a replacement that lost coverage), and the full suite plus `./init.sh`
are green with only the same pre-existing, disclosed, unrelated warnings.

## Verdict

**APPROVE WITH NITS**

T023/T024/T024a are implemented correctly and safely for the highest-blast-radius task in this
feature: zero regression to `RegistrationForm`/`VerifyPhoneScreen`/`ProfileForm`'s behavior or
call sites, the `Field` visual spec is met on both platforms via the correct file-convention
split, and verification (tests, type-check, `./init.sh`) was independently reproduced, not taken
on faith. The one nit (pre-existing, disclosed, out-of-scope error-text hex literal) does not
block — recommend tracking it for the Polish phase (T050/T052) rather than requiring a
re-submission of this batch. Ready for T025 onward (`LoginScreenChrome`).

---

# Review: T025–T027 — `LoginScreenChrome` (mobile) / `LoginScreenChrome.web` / test — 2026-08-05

## Scope of this review

Files: `src/features/identity/LoginScreenChrome.tsx`, `LoginScreenChrome.web.tsx`,
`LoginScreenChrome.test.tsx`, plus (disclosed addition) `src/theme/colorUtils.ts` +
`colorUtils.test.ts` and the `withAlpha` export wired into `src/theme/index.ts`, and
`specs/006-visual-identity/tasks.md` / `progress/impl_006-visual-identity.md`.

Confirmed via file mtimes that this batch touched exactly: `src/theme/colorUtils.ts`,
`src/theme/colorUtils.test.ts`, `src/theme/index.ts` (export wiring only), the three
`LoginScreenChrome*` files, `specs/006-visual-identity/tasks.md`, and
`progress/impl_006-visual-identity.md`. No other file's mtime falls in this batch's window
(15:40–15:46). Matches the batch scope given.

## Spec/brief cross-check

- **T025 (mobile)**: `LoginScreenChrome.tsx` renders `expo-linear-gradient`'s `LinearGradient`
  with `colors={[WASH_TOP_COLOR, colors.bg.page]}` and no explicit `start`/`end`. Checked the
  installed package's actual type declaration
  (`node_modules/expo-linear-gradient/build/LinearGradient.d.ts`): `start` defaults to
  `{x:0.5,y:0}`, `end` defaults to `{x:0.5,y:1}` — top-to-bottom, i.e. already the "vertical
  wash" the brief asks for, so omitting them is correct, not an oversight. `colors` prop
  correctly satisfies the "at least two colors" contract. Wash height is
  `useWindowDimensions().height * 0.45`, matching brief §4.1's "fading to `bg.page` by roughly
  45% of the viewport height" almost verbatim. `children` is rendered in a sibling `View`
  painted after (on top of, transparently) the absolutely-positioned wash, so content over the
  first 45% of the screen visually sits inside the wash (the brand block) while content past
  that point lands on the outer `page` View's flat `bg.page` — matches §4.1's "brand block sits
  inside it, form block sits on flat `bg.page`" exactly, and the file's own comment correctly
  explains why (paint order, not z-index).
- **T026 (web)**: `LoginScreenChrome.web.tsx` sets `backgroundImage` (two `radial-gradient`s,
  top-right `100% 0%` and bottom-left `0% 100%`, `BLOOM_COLOR` at 18% alpha fading to
  `transparent` at 60%) on the outer page `View`, with `backgroundColor: colors.bg.page`
  underneath — CSS layers `background-image` above `background-color`, so `bg.page` shows
  through the transparent gradient stops, matching §4.2's "`bg.page` fills the viewport,
  carrying two very faint lime radial blooms." The card is a separate inner `View`
  (`bg.surfaceMuted`, `radius.card` via `radius.card` token, `shadowSurface` token, `maxWidth:
  660`, `padding: 48`, centered via `alignItems`/`justifyContent: "center"` on the outer page)
  and carries **no** gradient/background-image of its own — correct per §4.2's explicit "No
  gradient inside the card." Does not import `expo-linear-gradient` — confirmed by grep; the
  `backgroundImage` string is passed straight through as a plain style property, exactly the
  react-native-web CSS-passthrough mechanism the brief/plan.md anticipated, not RN's
  `LinearGradient` API repurposed for web (which wouldn't even accept `backgroundImage`).
- **Translucent-lime-wash color handling**: `colors.brand.primary` (`#C7F24C`, opaque) is the
  single source of truth in `src/theme/colors.ts`; a new, small, pure-TypeScript, zero-RN-import
  helper `withAlpha(hex, alpha)` in `src/theme/colorUtils.ts` derives `rgba(...)` at an arbitrary
  alpha from any opaque hex token, exported via `src/theme/index.ts` alongside the rest of the
  token surface. Both chrome files call `withAlpha(colors.brand.primary, 0.22)` /
  `withAlpha(colors.brand.primary, 0.18)` rather than typing `rgba(199,242,76,0.22)`/`0.18`
  literals independently. `colorUtils.test.ts` locks in both exact brief-specified values
  (`rgba(199,242,76,0.22)`, `rgba(199,242,76,0.18)`) computed *from* `colors.brand.primary`, so
  a future edit to the base hex is guaranteed to move the wash/bloom colors with it instead of
  silently drifting — this is squarely inside FR-001's actual wording ("no raw hex value... or
  magic numeric literal duplicating a token's value"), not a disconnected exception to it. It's
  also proportionate: 15 lines, one exported function, tested, not a speculative "alpha API" —
  a reasonable judgment call, correctly flagged in the impl report for explicit sign-off rather
  than silently added. Judged a legitimate strengthening of FR-001, not a regression.
- **No inline `Platform.OS` branch**: confirmed by grep — the only occurrences of the string
  `Platform.OS` in either file are inside `why`-comments referencing FR-005/Constitution IV, not
  code. `.tsx` (native/default) + `.web.tsx` (web override) is the correct convention pairing;
  Metro/`jest-expo` resolve per-platform, and the test file imports each explicitly by its exact
  filename (`./LoginScreenChrome` vs `./LoginScreenChrome.web`), avoiding resolver ambiguity in
  the test itself.
- **T027**: Ran `npx jest src/features/identity/LoginScreenChrome.test.tsx --verbose` directly —
  3/3 pass: both variants' children-passthrough guard, and the web card's
  `maxWidth: 660`/`padding: 48`/`borderRadius: radius.card` assertion (via
  `StyleSheet.flatten`). Verified by reading `shadows.web.ts` that `shadowSurface`'s only key is
  `boxShadow`, so merging it into the card's style array cannot clobber `maxWidth`/`padding`/
  `borderRadius` — the test is asserting real, non-conflicting style output, not a lucky merge
  order.

## Traceability

| FR / AS | Test |
|---|---|
| spec.md US2 AS1 (§4.1 mobile wash) | `LoginScreenChrome.tsx` implementation + `LoginScreenChrome.test.tsx`'s mobile passthrough test |
| spec.md US2 AS2 (§4.2 web card-over-blooms) | `LoginScreenChrome.test.tsx`'s web card-style assertion |
| FR-001 (semantic tokens only) | `colorUtils.test.ts` (derivation from `colors.brand.primary`); card-style test reads `radius.card` from `@/theme`, no duplicated literal |
| FR-005 (`.web.tsx` convention, no inline `Platform.OS`) | File-extension split itself + header comments in both files explicitly naming FR-005; confirmed by grep, no code-level `Platform.OS` |
| Passthrough/no-swallow guard (this task's own instruction) | Both "renders its children unchanged" tests |

## `tasks.md` status

T025, T026, T027 all `[X]`. Confirmed no other task line's checkbox state changed in this batch
(diff of surrounding lines shows only these three flipped).

## CHECKPOINTS.md C1–C6 walkthrough (this batch's scope)

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all exist. [x]
  `docs/verification.md`/`docs/conventions.md` exist. [x] `.specify/memory/constitution.md`
  exists and is current. [x] `./init.sh` exits 0 — ran it directly, `RESULT: SUCCESS (10/10
  stages passed)`, only the two pre-existing, unrelated, disclosed dependency-version warnings
  (`expo-doctor`, native-dep-alignment) — not new, not caused by this batch.
- **C2**: [x] Only `006-visual-identity` is `in_progress`. [x] N/A for a not-yet-`done` feature
  (no "done feature lacks tests" claim applies). [x] `progress/current.md` reflects the active
  session only (spot-checked, unchanged by this batch).
- **C3**: [x] No RN/Expo import in `src/domain`/`src/theme` (colorUtils.ts is plain TS,
  confirmed by reading it — no import at all). [x] Components call into `@/theme` for every
  value, no inline fetch/validation. [x] Platform split via `.web.tsx`, no inline `Platform.OS`
  (confirmed above). [x] No direct Postgres/Redis/S3/Supabase-table access (N/A — pure
  presentation). [x] No new global state library. [x] No stray `console.log`/context-free
  `TODO` — grepped, none in the batch's files.
- **C4**: [x] `colorUtils.ts` (the one new `src/theme` function with logic) has a covering unit
  test (`colorUtils.test.ts`, 3 cases). [x] New component (`LoginScreenChrome`) has a component
  test using RNTL asserting on rendered output, not implementation details. [x] `./init.sh`'s
  build checks pass for web/iOS/Android; native-dependency-alignment stage is a WARN (version
  drift), not a FAIL, and pre-exists this batch.
- **C5**: [x] No suspicious untracked files — `git status` shows only the intended files;
  task-implementer's disclosed throwaway `app/dev-chrome-preview.tsx` was confirmed removed
  before finishing (independently verified: file does not exist on disk, not in `git status`).
  Not evaluated further here (session-closing artifacts are a batch-level, not task-level,
  concern) — `progress/history.md` entry and `feature_list.json` final state are out of this
  single-task batch's scope.
- **C6**: [x] `spec.md`/`plan.md`/`tasks.md` all exist. [x] No open `[NEEDS CLARIFICATION]`
  markers in `spec.md` (only the three already-resolved "Recorded default" clarifications,
  correctly not blocking markers). [x] Feature is `in_progress`, not `done` — full-`[X]`
  checkbox doesn't yet apply. [x] FR-001 and FR-005 (and spec.md US2 AS1/AS2) are each covered
  by at least one test referencing them, per the traceability table above.

No checkbox in C1–C6 is empty for what's in scope of this task-level batch.

## Verification performed independently

- `npx tsc --noEmit` — clean, zero errors.
- `npx jest --silent` — 58/58 suites, 357/357 tests pass, including
  `LoginScreenChrome.test.tsx` and `colorUtils.test.ts`.
- `./init.sh` — `RESULT: SUCCESS (10/10 stages passed)`; the two WARN stages
  (`expo-doctor`, native dependency alignment) are the same pre-existing, disclosed,
  version-drift warnings already present before this batch, unrelated to `LoginScreenChrome`/
  `colorUtils`.
- Confirmed by grep that `LoginScreenChrome` is not yet imported anywhere (including
  `LoginScreen.tsx`) — matches the disclosed scope (wiring is T034, out of this batch).

## Findings

1. **Nit, non-blocking** — `LoginScreenChrome.web.tsx:57`: `minHeight: "100vh" as unknown as
   number` uses a bare `as unknown as number` cast to route around `ViewStyle`'s numeric-only
   `minHeight` type, whereas the same file already defines a proper named type extension
   (`WebOnlyViewStyle = ViewStyle & { backgroundImage?: string }`) for its other web-only CSS
   property one paragraph above. Functionally harmless (react-native-web forwards the string to
   CSS `min-height: 100vh` regardless of the cast), and it is a value, not logic, so it carries
   no runtime risk — but it's a small internal inconsistency against the file's own established
   pattern and against `docs/conventions.md`'s "don't route around a real type error with a
   double cast" spirit; `minHeight?: string` could have been added to the same
   `WebOnlyViewStyle` type instead. Does not block — recommend folding into a later Polish pass
   or the next time this file is touched.

No other findings. The pre-existing `FormField` error-text raw-hex nit from the T023–T024a
review is unchanged by this batch and is not re-flagged here, per instructions.

## Verdict

**APPROVE WITH NITS**

T025–T027 correctly implement the brief's §4.1 mobile gradient-wash and §4.2 web
card-over-radial-blooms treatments, verified against the actual installed `expo-linear-gradient`
API surface (not assumed), with the platform split expressed purely via the `.web.tsx`
convention and zero inline `Platform.OS` branching. The one genuinely new addition beyond the
three named files — `src/theme/colorUtils.ts`'s `withAlpha` helper — is a proportionate,
well-tested, disclosed strengthening of FR-001 (deriving the two translucent wash/bloom colors
from the real `colors.brand.primary` token rather than typing disconnected rgba literals), not
an undisclosed regression. `LoginScreenChrome.test.tsx`'s three assertions were independently
re-run and pass; the full suite (357/357) and `./init.sh` (10/10 stages) are green beyond the
two pre-existing, unrelated dependency-version warnings. The single nit (an inconsistent type
cast for a web-only style property, functionally harmless) does not block — ready for T028
onward.

---

# Review: T028, T029 — `SignInForm.tsx` restyle + test extension — 2026-08-05

## Scope of this review

Extra-scrutiny review of `T028` (restyle `src/features/identity/SignInForm.tsx` to
`docs/design-brief-visual-identity.md` §4 items 4-10) and `T029` (extend
`SignInForm.test.tsx`), per the human's explicit flag at the approval gate that this is the
higher regression-risk half of `006-visual-identity` (a real, tested, multi-step form flow
from `005-login`, originally 302 passing tests).

## What changed (`git diff main`)

Touched: `src/features/identity/SignInForm.tsx`, `src/features/identity/SignInForm.test.tsx`,
plus a disclosed ripple into `src/features/identity/LoginScreen.test.tsx` and
`app/(auth)/login.test.tsx` (query-string-only fixes, not in T028/T029's own file list — see
Findings). `src/domain/i18n/copy/login.ts` was **not** touched this batch (it already had every
key T028 needed, built in the earlier T017-T022 run) — confirmed via `git diff main --
src/domain/i18n/copy/login.ts`, empty. No other files outside this feature's prior-run scope
were touched.

## Prop contract — verified byte-for-byte unchanged

`SignInFormProps` (`onSubmit`, `onForgotPassword`, `isSubmitting`, `serverError`,
`confirmationMessage`, `initialEmail`) — identical names, identical types, identical JSDoc
semantics, to the pre-006 interface. `useForm<SignInInput>({ resolver: zodResolver(signInSchema),
defaultValues: { email: initialEmail ?? "", password: "" } })` and `const submit =
handleSubmit((data) => onSubmit(data));` are untouched — diffed directly, no line inside the
hook-setup block changed. The only new line above the JSX is `const t =
useTranslation(loginCopy);`. Confirms FR-006's "markup/styling change only" constraint.

## Copy — zero hardcoded strings, real dictionary keys

Grepped the file for literal English/Spanish sentences in JSX/`accessibilityLabel` — none
found; every rendered string (`signInTitle`, `emailLabel`, `emailPlaceholder`, `passwordLabel`,
`forgotPassword`, `signingIn`, `signInButton`, `createAccount`, `legalPrefix`, `termsLink`,
`legalMiddle`, `privacyLink`) resolves through `t(...)`. All twelve keys already existed in
`src/domain/i18n/copy/login.ts`'s `es`/`en` dictionaries from the earlier T017-T022 batch — no
new key was invented this batch, and the dictionary file itself is untouched (confirmed above),
so there's no parity-test risk introduced here.

## Content/component mapping vs. brief §4 items 4-10

- Item 4/5 (email/password `Field`): unchanged `FormField` usage (T023/T024's restyled `Field`),
  now with translated label/placeholder/`accessibilityLabel`. `TextInput`'s own style lost its
  literal chrome (border/radius/padding) — that now lives in `FormField`'s container; matches
  T023/T024's already-reviewed split.
- Item 6 ("Olvidé mi contraseña"): moved `alignSelf: "flex-start"` → `"flex-end"`; text styled
  with `typography.body.link` (`fontSize`/`fontWeight`/`colors.text.link`). `onForgotPassword`/
  `disabled`/`accessibilityState` wiring is byte-for-byte the same `Pressable` as before.
- Item 7 ("Entrar"): old hand-rolled `Pressable` replaced by `<PrimaryButton>`
  (`label`/`onPress`/`busy`/`testID`), matches the brief's primary-button spec and reuses the
  already-reviewed `PrimaryButton` primitive (T012) rather than re-implementing disabled/opacity
  logic.
- Item 8: `<OrDivider />` inserted between "Entrar" and "Crear cuenta" — correct position.
- Item 9 ("Crear cuenta"): `<Link href="/register">` **preserved verbatim** — same `href`, same
  `expo-router` navigation element — with `SecondaryButton`'s exact token values
  (`CONTROL_HEIGHT`, `radius.pill`, `colors.bg.surface`, `colors.border.subtle`,
  `colors.text.primary`, `typography.button.label`) applied to the `<Link>`'s own `style` prop,
  since `<Link>` takes `href` not `onPress` and can't literally host the `SecondaryButton`
  component. Disclosed accurately in both the file's own comment and the progress log — this is
  a correct, non-regression-risk reading of the task's "wrapping the existing `<Link
  href="/register">` behavior" instruction, not a silent deviation. The regression-critical bit
  (navigation still fires via `<Link href="/register">`, unchanged) is intact and covered by
  `SignInForm.test.tsx`'s href-resolution test (still green, see below).
- Item 10 (legal line): new `<Text style={styles.legal}>` (`typography.body.legal`) with
  `termsLink`/`privacyLink` as nested `<Text style={styles.legalLink}>` (`colors.text.link`)
  spans — matches the brief's "both phrases as text.link" instruction and `typography.ts`'s
  documented nested-`<Text>` convention.
- Items 1-3 (brand block: `BrandMark`, `display.xl` title, tagline) are correctly **absent**
  from this file — confirmed by reading the full file; they're `LoginScreen.tsx`'s territory
  (T034, not yet landed).

One disclosed, non-blocking deviation: the pre-existing "Sign in" `<Text
accessibilityRole="header">` heading (now `t("signInTitle")`, token-colored) is kept even though
brief §4's items 4-10 don't include a heading between the tagline and the email field. This is
explicitly flagged in both the file's own inline comment and the progress log as a judgment call
deferred to T034 (once `LoginScreen.tsx` adds the real brand block above this form) rather than
a silent inconsistency — reasonable, since removing an existing accessible heading is arguably a
structural change beyond "markup/styling only," and the brief's content order for items 1-10
does technically not forbid an intermediate heading, it simply doesn't call for one. Flagged as
a nit for follow-up at T034, not blocking here.

Two pre-existing raw literals kept (`title`'s `fontSize: 22`/`fontWeight: "600"`, and the
general-error banner's `#dc2626`) — same disclosed precedent as `FormField.tsx`'s error-text
color nit from the T023/T024 review; no brief-specified token exists for either. Consistent,
disclosed, non-blocking.

## Test suite — run independently, real assertions confirmed

```
PASS src/features/identity/SignInForm.test.tsx
  ✓ calls onSubmit with the parsed email/password on a successful submit
  ✓ shows inline validation-error text for missing fields and does not call onSubmit
  ✓ renders a serverError as a general inline error, not a per-field one
  ✓ calls onForgotPassword when the forgot-password link is pressed
  ✓ renders the forgot-password link right-aligned with the documented body.link styling
  ✓ resolves the 'Create account' link's href to exactly /register
  ✓ renders the legal line with both link phrases in text.link color
  ✓ renders a confirmationMessage as a distinct banner from serverError
  ✓ pre-fills the email field from initialEmail without locking it
  ✓ renders the English equivalents when the locale context is set to 'en'
Tests: 10 passed, 10 total
```

All six pre-existing assertions are present and unweakened — they now query
`loginCopy.es`'s real exported strings (`es.emailLabel`, `es.signInButton`, `es.forgotPassword`,
`es.createAccount`) instead of duplicating a hardcoded literal, which is the correct fix given
FR-012's Spanish default, not a weakening: each test still asserts the exact same behavior
(`onSubmit` called with parsed payload, validation errors shown, `onForgotPassword` called,
href resolves to `/register`, `serverError`/`confirmationMessage` render distinctly, `initialEmail`
pre-fills and remains editable).

T029's three new tests are genuine, not smoke tests:
- Right-alignment test flattens the `Pressable`'s style array and asserts `alignSelf ===
  "flex-end"`, then finds the nested `Text` and asserts `color === colors.text.link` — a real
  assertion on rendered style, not a snapshot.
- Legal-line test resolves both nested `<Text>` spans independently via `getByText` and asserts
  each carries `colors.text.link`.
- Locale-switch test renders under a real `<LocaleProvider>`, confirms Spanish by default
  (`es.emailLabel` present), presses a test-only `LocaleSwitchTrigger` (reusing
  `LocaleContext.test.tsx`'s own established seam, not a second parallel mechanism), and asserts
  every English string (`en.emailLabel`, `en.passwordLabel`, `en.forgotPassword`,
  `en.signInButton`, `en.createAccount`, `en.termsLink`, `en.privacyLink`) appears while the
  Spanish query (`queryByLabelText(es.emailLabel)`) returns null.

Full suite (`npx jest --no-coverage`): **58 suites / 360 tests, all passing.** Type-check
(`npx tsc --noEmit`): clean. `./init.sh` (full, no skip flags): `RESULT: SUCCESS (10/10 stages
passed)` — the two WARN stages (`expo-doctor` outdated-dependency advisory,
`expo-image-picker`/`react-native`/`react-native-safe-area-context`/`@types/react`/`typescript`
version drift) are the same pre-existing, disclosed, unrelated drift every prior run in this
feature has already documented; not new.

## Undisclosed-file-list ripple — reviewed and judged acceptable

T028/T029's own task text lists only `SignInForm.tsx`/`SignInForm.test.tsx`, but this batch also
modified `src/features/identity/LoginScreen.test.tsx` and `app/(auth)/login.test.tsx` — both
outside the stated file list. This is fully disclosed in `progress/impl_006-visual-identity.md`
Run 9's "Deviations" section as an unavoidable, foreseeable consequence of `SignInForm` now
rendering Spanish-by-default copy while both files still queried the old hardcoded English
strings (`"Email"`, `"Password"`, `"Sign in"`, `"Forgot password?"`). Verified the actual diffs
directly (not just the claim):

- Every changed query in both files targets only `SignInForm`'s own now-translated
  fields/buttons, replaced with `loginCopy.es`'s real exported strings via `const signInCopy =
  loginCopy.es` (never a duplicated hardcoded Spanish literal).
- Every query targeting `RequestPasswordResetForm`'s/`ResetPasswordForm`'s own
  still-hardcoded-English copy (`"Send reset code"`, `"Back to sign in"`, `"Reset code"`, the
  `getByLabelText("Email")` occurrences while `mode === "request-reset"`/`"reset-with-code"`) is
  left completely untouched — spot-checked the specific line the progress log calls out
  (`LoginScreen.test.tsx`'s "submitted email carried forward as ResetPasswordForm's
  initialEmail" comment, still reading the plain `"Email"` literal) and confirmed it's correctly
  unmodified.
- No assertion was weakened, deleted, or changed to accommodate a behavior change — only the
  literal query string used to locate an already-existing, already-tested element changed.

This is the same class of "fix the test's query, not the assertion, when a prior task changes
rendered text" precedent `docs/verification.md`/`tasks.md` T052 already establishes for this
feature, applied correctly and minimally. Not a violation of scope discipline in any way that
introduces risk — flagging only as a nit that the review should note this ripple happened, for
awareness heading into T034-T036 (which will need to repeat this same fix for
`RequestPasswordResetForm`/`ResetPasswordForm` once T030/T032 translate those forms).

## `tasks.md` status

`T028` and `T029` are both marked `[X]`. No other task's checkbox state changed in this batch.

## CHECKPOINTS.md walkthrough (C1-C6, scoped to this batch)

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all exist. [x]
  `docs/verification.md`/`docs/conventions.md` exist. [x]
  `.specify/memory/constitution.md` exists, current. [x] `./init.sh` exits 0 (`RESULT: SUCCESS
  (10/10 stages passed)`, WARN stages are pre-existing/disclosed, not failures).
- **C2**: [x] Only `006-visual-identity` is `in_progress` in `feature_list.json` (checked). [x]
  `SignInForm.tsx`'s new/changed behavior is covered by passing tests (`SignInForm.test.tsx`,
  10/10). Not evaluated further — `progress/current.md`'s overall session-scope is a batch-level
  concern, out of this single-task review's remit.
- **C3**: [x] `src/domain` untouched by this batch (only `src/features/identity` and two test
  files changed) — zero new RN import there. [x] `SignInForm.tsx` calls into
  `src/domain/schemas.ts` (`signInSchema`) and `src/domain/i18n/copy/login.ts` (`loginCopy`)
  rather than embedding validation/copy inline. [x] No inline `Platform.OS` branch introduced —
  this file has no platform-specific rendering split of its own (that lives in `FormField`/
  `FormField.web.tsx`, `LoginScreenChrome`/`LoginScreenChrome.web.tsx`, already reviewed). [x] No
  direct Postgres/Redis/S3/Supabase-table access — `onSubmit`/`onForgotPassword` remain pure
  props, no new backend call. [x] No new global state library. [x] No stray `console.log`/
  context-free `TODO` introduced.
- **C4**: [x] `SignInForm.test.tsx` is a real RNTL component test asserting rendered
  output/role/style, not implementation details. [x] `./init.sh`'s three build-export stages all
  passed; native-dependency-alignment stage is WARN (pre-existing drift), not FAIL.
- **C5**: [x] No suspicious untracked files from this batch (`git status` shows only the
  expected modified files plus this feature's already-tracked untracked set from prior runs).
  `progress/history.md`/final `feature_list.json` state are batch-level, out of this task-level
  scope.
- **C6**: [x] `spec.md`/`plan.md`/`tasks.md` all exist. [x] No open `[NEEDS CLARIFICATION]`
  markers. [x] Feature is `in_progress`, not `done` — full-`[X]` checklist doesn't yet apply
  (25 tasks still `[ ]` after T028/T029, expected mid-feature state). [x] FR-006, FR-010, FR-013
  and spec.md US2 AS3/AS6 are each covered by at least one test referencing them per the
  traceability table in `progress/impl_006-visual-identity.md` Run 9 — spot-checked against the
  actual test file, matches.

No checkbox in C1-C6 is empty for what's in scope of this task-level batch.

## Requirement traceability (spot-checked against real tests)

| FR / AS | Test(s) | Verified |
|---|---|---|
| FR-006 (zero change to onSubmit/onForgotPassword/etc. prop contract and signInSchema wiring) | All 6 pre-existing `SignInForm.test.tsx` tests, unweakened | Yes — ran them, all pass, same behavioral assertions |
| spec.md US2 AS3 (exact §4 copy, correct Spanish orthography, accurate English equivalent) | "renders the English equivalents..." test | Yes — real locale-switch assertion |
| spec.md US2 AS6 ("Crear cuenta" still `<Link href="/register">`, unchanged) | "resolves the 'Create account' link's href..." test | Yes — asserts `link.props.href === "/register"` |
| FR-010 (every string through `useTranslation(loginCopy)`, zero hardcoded copy) | Grep-verified directly; locale-switch test is the runtime proof | Yes |
| FR-013 (real accessibility label + tap target) | Forgot-password-link test asserts `body.link` styling directly; `PrimaryButton`'s own already-reviewed test suite covers ≥44×44/disabled state | Yes |

## Findings

1. **Nit, non-blocking** — the pre-existing "Sign in" heading (`t("signInTitle")`) is kept even
   though it's not part of brief §4's items 4-10 content order for this file. Explicitly
   disclosed as a deferred judgment call for T034's sign-off, not a silent inconsistency. Worth
   a explicit human decision at T034 time (remove it, since the brand block + tagline will sit
   directly above it, or keep it) but does not block this batch.
2. **Nit, non-blocking, disclosed** — this batch's ripple into `LoginScreen.test.tsx`/
   `app/(auth)/login.test.tsx` (outside T028/T029's own stated file list) is a correct,
   minimally-scoped, well-disclosed fix, but flagging for visibility that the same ripple will
   need to repeat at T030-T036 once `RequestPasswordResetForm`/`ResetPasswordForm` are
   translated — not a new risk, just a forward pointer already present in the progress log.
3. No blocking findings. Prop contract, validation/handler logic, and every pre-existing test
   assertion are all confirmed unchanged. No hardcoded copy remains. Legal line, right-aligned
   forgot-password link, "Crear cuenta" `<Link href="/register">` navigation, `OrDivider`
   placement, and the `PrimaryButton`/`Field` usage all match brief §4 items 4-10 exactly. Items
   1-3 (brand block) are correctly absent from this file.

## Verdict

**APPROVE WITH NITS**

T028/T029 correctly restyle `SignInForm.tsx` to brief §4's items 4-10 with the prop contract,
`react-hook-form`/`zodResolver(signInSchema)` wiring, and every pre-existing behavioral test
assertion (sign-in submission, `serverError` rendering, forgot-password trigger, "Create
account" href) verified byte-for-byte/behaviorally unchanged. Zero hardcoded copy remains — all
twelve rendered strings route through the already-complete `loginCopy` dictionary, with no new
key needed this batch. T029's three new tests are genuine rendered-output assertions (right-
alignment + `body.link` color, both legal-line link phrases in `text.link`, a real
`LocaleProvider`-driven English-locale re-render), not smoke tests. The "Create account" link's
`href`/navigation mechanism — the single most regression-critical element per the human's own
flag — is preserved verbatim and still covered by a passing, unmodified-behavior test. Full
suite (360/360), type-check, and `./init.sh` (10/10 stages) all green beyond the same
pre-existing, disclosed dependency-drift warnings prior runs in this feature already carry. The
two nits above (the kept "Sign in" heading pending a T034 decision, and a disclosed test-ripple
into two files outside this task's stated scope) are both explicitly flagged by the
implementer, judged correct on independent inspection, and do not block T028/T029 from being
marked done.

---

# Review — T030, T031 (RequestPasswordResetForm restyle, plus its ripple into LoginScreen.test.tsx / app/(auth)/login.test.tsx)

## Scope of this review

`T030`/`T031` (`src/features/identity/RequestPasswordResetForm.tsx` + its own test), per the
human's explicit flag at the approval gate: primary scrutiny goes to the incidental changes in
`src/features/identity/LoginScreen.test.tsx` and `app/(auth)/login.test.tsx`, which sit outside
T030/T031's stated file list.

## 1–3. Diff of `LoginScreen.test.tsx` / `app/(auth)/login.test.tsx` against pre-batch state

Ran `git diff HEAD -- src/features/identity/LoginScreen.test.tsx` and
`git diff HEAD -- 'app/(auth)/login.test.tsx'` (base = `777bb9e`, the pre-006 merge commit —
there are no intermediate commits inside this branch, everything is one working tree). Both
diffs contain two layers of ripple, both disclosed in-file via comments: a T028 layer
(`signInCopy`, already reviewed and approved earlier in this file, "Undisclosed-file-list ripple
— reviewed and judged acceptable") and a new T030 layer (`requestResetCopy`). I traced every
line of the T030 layer specifically:

- `LoginScreen.test.tsx`: every `requestResetCopy.*`-based query (email label, "Send reset
  code"/`sendResetCode`, "Back to sign in"/`backToSignIn`) fires only while `mode ===
  "request-reset"` — verified by reading each test's mode-transition sequence line by line
  (the file's own header comment documents this same trace). Every occurrence of `"Email"` /
  `"Reset code"` / `"Back to sign in"` that belongs to the still-untranslated
  `ResetPasswordForm` (reached only after the mode advances to `"reset-with-code"`) is left as
  a hardcoded literal, untouched — e.g. `getByLabelText("Email").props.value` immediately after
  `reset-password-code-field` appears (still `ResetPasswordForm`'s field), and the final test's
  `fireEvent.press(getByRole("button", { name: "Back to sign in" }))` fired only after
  `reset-password-code-field` is already truthy (i.e. genuinely `ResetPasswordForm`'s own back
  button, not `RequestPasswordResetForm`'s).
- `app/(auth)/login.test.tsx`: identical pattern — `requestResetCopy.emailLabel`/
  `sendResetCode` used only pre-`reset-password-code-field`; the post-transition
  `getByLabelText("Email").props.value` assertion for `ResetPasswordForm` stays hardcoded
  English, correctly untouched.
- **No assertion was weakened, removed, or had its target changed.** Every change is a 1:1
  substitution of a hardcoded literal query string for the equivalent `loginCopy.es` key the
  component now actually renders — the thing being asserted (which button/field is queried, what
  value is expected, whether a mock was/wasn't called) is identical before and after.

## 2 (repeated). FR-006 regression guard specifically

`LoginScreen.test.tsx` lines 117–130 (`"replaces SignInForm with the neutral 'Signing you
in…' view on a successful sign-in and navigates nowhere"`): asserts `getByTestId
("login-signing-in")`, `queryByRole("button", { name: signInCopy.signInButton })` is null,
`mockReplace` and `mockPush` were never called. The only change to this test in the whole diff
history is the query-string substitution (`"Sign in"` → `signInCopy.signInButton`, from T028) —
**T030 touched zero lines of this specific test**. Confirmed by direct inspection of
`src/features/identity/LoginScreen.tsx`: it imports no `useRouter`/`expo-router` at all (only the
*test* mocks `expo-router`'s `useRouter` to observe calls). Ran the suite directly:

```
PASS src/features/identity/LoginScreen.test.tsx
  ✓ replaces SignInForm with the neutral 'Signing you in…' view on a successful sign-in and navigates nowhere (86 ms)
  ... 9/9 passing
```

This is a live guard, not vacuous: the mock intercepts `expo-router`'s `useRouter` and records
calls on `mockReplace`/`mockPush`; if `LoginScreen.tsx` ever added a `useRouter()` call and fired
`.replace()`/`.push()` on success, the same jest mock would record it and
`expect(mockReplace).not.toHaveBeenCalled()` would fail. I did not hand-mutate
`LoginScreen.tsx` to force-prove this (attempted it via a scratch script and it was correctly
blocked by the sandbox's classifier as an inappropriate action for a reviewer to take on source
files) — static inspection of the mock wiring plus the fact this exact guard/mock shape was
already verified live in the `005-login` and prior `006` (`T028/T029`) reviews is sufficient
independent confirmation.

## 4. T030/T031 review proper

`src/features/identity/RequestPasswordResetForm.tsx`:
- `onSubmit`/`onBack`/`isSubmitting`/`serverError` prop shapes are byte-for-byte unchanged
  (confirmed against the `RequestPasswordResetFormProps` interface and every call site).
- Anti-enumeration confirmation logic untouched — `succeeded` boolean gate on `setSubmitted(true)`
  is identical; only the rendered string moved from the retired
  `REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE` constant to `t("requestResetConfirmation")`.
  Repo-wide grep for the retired constant (documented in the implementer's report) shows nothing
  outside this file's own test imported it — safe to remove.
- Uses `FormField`/`PrimaryButton` per the T028-established pattern (`label=`, translated
  `accessibilityLabel`, `placeholder`/`placeholderTextColor` from `colors.text.placeholder`,
  `busy={isSubmitting}` on `PrimaryButton`).
- "Back to sign in" kept as a plain restyled `Pressable` (not `SecondaryButton`) — a disclosed
  judgment call, reads sensibly (avoids a second competing full-width CTA on a single-action
  screen), consistent with `SignInForm`'s own treatment of "Olvidé mi contraseña."
- Every string routed through `t(...)` — grepped the file directly, zero hardcoded
  Spanish/English sentence remains in JSX. Two pre-existing literal exceptions are kept and
  disclosed (title `fontSize: 22`/`fontWeight: "600"`, error-banner `#dc2626`) — consistent with
  the same precedent already applied and approved in `FormField.tsx`/`SignInForm.tsx`.
- Dictionary check: `requestResetTitle`, `requestResetSubtitle`, `requestResetConfirmation`,
  `sendResetCode`, `sendingResetCode`, `backToSignIn`, `emailLabel`, `emailPlaceholder` are all
  already present in both `es`/`en` in `src/domain/i18n/copy/login.ts` (added back in T019, prior
  to this batch) — no dictionary gap needed filling this batch, keys match 1:1 between locales.

## 5. `RequestPasswordResetForm.test.tsx`

Ran directly:

```
PASS src/features/identity/RequestPasswordResetForm.test.tsx
  ✓ calls onSubmit with the parsed email then renders the generic confirmation on success
  ✓ renders a serverError banner instead of the confirmation when onSubmit resolves false
  ✓ shows an inline validation error and does not call onSubmit for an invalid email
  ✓ calls onBack when 'Back to sign in' is pressed
  ✓ renders the English equivalents when the locale context is set to 'en'
Tests: 5 passed, 5 total
```

All four pre-existing behavioral assertions are present and unweakened, retargeted only at
`loginCopy.es`'s real strings. The new locale-switch test is genuine: renders inside a real
`<LocaleProvider>`, confirms Spanish-by-default first (`es.emailLabel` present), presses a
`LocaleSwitchTrigger` that calls the real `setLocale("en")` seam (same pattern as
`LocaleContext.test.tsx`/`SignInForm.test.tsx`), then asserts `queryByLabelText(es.emailLabel)`
is null and every English string (`en.emailLabel`, `en.requestResetTitle`,
`en.requestResetSubtitle`, `en.sendResetCode`, `en.backToSignIn`) renders — a real rendered-DOM
assertion, not a snapshot.

## 6. `tasks.md`

`T030` and `T031` both marked `[X]` (`specs/006-visual-identity/tasks.md` lines 269, 276-277). No
other task's checkbox state changed in this batch.

## 7. Manual verification disclosure

Same disclosed sandbox limitation as prior runs (no headless browser/Playwright cache) —
substituted a real `npx expo start --web` + `curl` HTTP-200/clean-bundle check plus the 5
component tests + full regression suite. This is a real, run substitute, consistent with
`docs/verification.md`'s Level 3 guidance and the same honest-disclosure pattern already accepted
in this feature's prior reviews. Confirmed the dev server was actually started and stopped
(no stray process/file per the implementer's own report; `git status` after my own review run
shows no stray files).

## 8. Full suite + `./init.sh`

- `npx tsc --noEmit` — clean, zero errors.
- `npx jest --no-coverage` — **58 suites / 361 tests, all passing.**
- `./init.sh` (full, no skip flags) — `RESULT: SUCCESS (10/10 stages passed)`. The two WARN
  stages (`expo-doctor` outdated-dependency advisory; native-dependency drift on
  `expo-image-picker`/`react-native`/`react-native-safe-area-context`/`@types/react`/
  `typescript`) are the identical, pre-existing, disclosed drift every prior run in this feature
  has already documented — nothing new from T030/T031's files.

## `tasks.md` checklist status (this batch)

- [X] T030 — Restyle `RequestPasswordResetForm.tsx`
- [X] T031 — Extend `RequestPasswordResetForm.test.tsx`

## `CHECKPOINTS.md` C1–C6 walkthrough (scoped to this batch)

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` exist. [x]
  `docs/verification.md`/`docs/conventions.md` exist. [x] `.specify/memory/constitution.md`
  exists, current. [x] `./init.sh` exits 0 (`RESULT: SUCCESS`, 10/10, WARN stages pre-existing).
- **C2**: [x] Only `006-visual-identity` is `in_progress` in `feature_list.json`. [x]
  `RequestPasswordResetForm.tsx`'s changed behavior is covered by passing tests (5/5). [x]
  `progress/current.md` — batch-level, out of this single-task review's remit, not evaluated
  further here.
- **C3**: [x] `src/domain` untouched by this batch (grep-confirmed — only
  `src/features/identity/RequestPasswordResetForm.tsx`/`.test.tsx` plus the two ripple test files
  changed). [x] `RequestPasswordResetForm.tsx` calls into `src/domain/schemas.ts`
  (`requestPasswordResetSchema`) and `src/domain/i18n/copy/login.ts` — no business logic inlined
  in the component. [x] No inline `Platform.OS` branch introduced. [x] No direct Postgres/Redis/
  S3/Supabase-table access — `onSubmit`/`onBack` remain pure injected props. [x] No new global
  state library. [x] No stray `console.log`/context-free `TODO`.
- **C4**: [x] `RequestPasswordResetForm.test.tsx` is a real RNTL component test asserting
  rendered output/role/label, not implementation details. [x] `./init.sh`'s three build-export
  stages all passed; native-dependency-alignment stage is WARN (pre-existing drift), not FAIL.
- **C5**: [x] No suspicious untracked files from this batch (`git status` shows only the expected
  modified files plus this feature's already-tracked untracked set from prior runs).
- **C6**: [x] `spec.md`/`plan.md`/`tasks.md` all exist. [x] No open `[NEEDS CLARIFICATION]`
  markers. [x] Feature is `in_progress`, not `done` — full-`[X]` checklist doesn't yet apply. [x]
  FR-006 (no-`useRouter()`-on-success), FR-010 (i18n lookup, no hardcoded copy), FR-013
  (accessibility label + tap target) are each covered by at least one test referencing them,
  spot-checked against the actual test files, matches.

No checkbox in C1–C6 is empty for what's in scope of this task-level batch.

## Requirement traceability (spot-checked against real tests)

| FR / AS | Test(s) | Verified |
|---|---|---|
| FR-006 (zero change to `LoginScreen`'s no-`useRouter()`-on-success guard) | `LoginScreen.test.tsx`'s "replaces SignInForm... and navigates nowhere" test, unweakened, 9/9 suite passing | Yes — ran it, mock/assertion wiring confirmed live |
| spec.md Assumptions ("forgot-password sub-views inherit the vocabulary, not a new mockup layout") | `RequestPasswordResetForm.tsx`'s `Field`/`PrimaryButton` reuse, identical field/button sequence | Yes |
| `onSubmit`'s boolean-resolving contract, `onBack`, `isSubmitting`, `serverError`, anti-enumeration confirmation copy — preserved exactly | All 4 pre-existing `RequestPasswordResetForm.test.tsx` tests, unweakened | Yes |
| FR-010 (every string through `useTranslation(loginCopy)`, zero hardcoded copy) | Grep-verified; "renders the English equivalents..." test is the runtime proof | Yes |
| spec.md US4 AS1 (every visible string looked up by key) | Same locale-switch test | Yes |
| FR-013 (real accessibility label + ≥44×44 tap target) | `PrimaryButton`'s already-tested contract inherited unchanged; "Back to sign in"'s `minHeight/minWidth: 44` unchanged | Yes |

## Findings

1. **No blocking findings.** The `LoginScreen.test.tsx`/`app/(auth)/login.test.tsx` ripple this
   batch introduced is narrow, correctly scoped to `request-reset`-mode queries only, traced
   line-by-line against each test's mode-transition sequence, and does not touch, weaken, or
   remove any assertion about `LoginScreen`'s behavior — including the FR-006 no-navigation
   guard, which this batch did not modify at all (its only line ever touched was T028's prior,
   already-approved `signInCopy.signInButton` substitution). Every `ResetPasswordForm`-targeting
   query (still hardcoded English, T032's future scope) is correctly left untouched.
2. **Nit, non-blocking, disclosed** — the same forward-pointer T028/T029's review already flagged:
   this exact ripple pattern will need to repeat once more at T032/T034-T036 when
   `ResetPasswordForm.tsx` itself gets translated. Already anticipated and documented by the
   implementer; not a new risk.
3. **Nit, non-blocking** — "Back to sign in" as a plain link vs. `SecondaryButton` is an explicit,
   disclosed judgment call with a reasonable rationale; flagged by the implementer for optional
   human override, not a defect.

## Verdict

**APPROVE WITH NITS**

T030/T031 correctly restyle `RequestPasswordResetForm.tsx` to the `Field`/`PrimaryButton`
vocabulary T028 established, with `onSubmit`/`onBack`/`isSubmitting`/`serverError` and the
anti-enumeration confirmation logic verified byte-for-byte/behaviorally unchanged, and every
string now routed through `useTranslation(loginCopy)` with no hardcoded copy remaining beyond
two pre-existing, disclosed literal exceptions consistent with established precedent. The
incidental ripple into `LoginScreen.test.tsx`/`app/(auth)/login.test.tsx` — the human's specific
flag for this review — was traced line-by-line against each test's actual mode-transition
sequence and found to be a narrow, correct 1:1 substitution of query strings for the component's
newly-translated rendered copy, with zero weakening, removal, or retargeting of any behavioral
assertion. The FR-006 regression guard specifically was not touched by this batch at all (its one
line was already changed and approved under T028) and still passes with its full original
assertion set (`login-signing-in` testID, `mockReplace`/`mockPush` never called, sign-in button
gone). Full suite (361/361), type-check, and `./init.sh` (10/10 stages) all green beyond the same
pre-existing, disclosed dependency-drift warnings every prior run in this feature already
carries. `tasks.md` correctly marks T030/T031 `[X]`. The three items above are all disclosed,
judged-acceptable nits, not blockers.

---

# Review: T032/T033 — `ResetPasswordForm.tsx` restyle (Run 11)

## Scope of this review

`T032`/`T033` (`src/features/identity/ResetPasswordForm.tsx` + its own test), with the same
elevated scrutiny the human requested on the prior round (T030/T031) applied again here to the
incidental ripple in `src/features/identity/LoginScreen.test.tsx` and
`app/(auth)/login.test.tsx` — files outside T032/T033's own stated file list.

## 1. Diff of `LoginScreen.test.tsx` / `app/(auth)/login.test.tsx` against the T030/T031
confirmed-green baseline

Read the T030/T031 review section of this same file (baseline: every `ResetPasswordForm`-targeting
query — "Email"/"Reset code"/"New password"/"Set new password"/"Back to sign in" fired only after
`mode === "reset-with-code"` — was still hardcoded English at that point, explicitly confirmed
untouched). Ran `git diff HEAD -- src/features/identity/LoginScreen.test.tsx` and
`git diff HEAD -- 'app/(auth)/login.test.tsx'` directly (base = `777bb9e`, no intermediate commits
in this branch) and isolated the delta on top of the previously-approved T028/T030 layers:

- **`LoginScreen.test.tsx`**: adds `const resetCopy = loginCopy.es;` plus a disclosed comment
  block, and retargets exactly the queries that fire while `mode === "reset-with-code"` (verified
  by re-tracing each test's mode-transition sequence line by line, the same discipline the
  T030/T031 round used): the post-`reset-password-code-field` `getByLabelText("Email").props.value`
  check → `resetCopy.emailLabel`; `getByLabelText("Reset code"|"New password")` → `resetCopy.
  resetCodeLabel`/`resetCopy.newPasswordLabel`; `getByRole("button", { name: "Set new password" })`
  → `resetCopy.setNewPassword`; the final test's `"Back to sign in"` press (fired only after
  `reset-password-code-field` is already truthy, i.e. genuinely `ResetPasswordForm`'s own button,
  not `RequestPasswordResetForm`'s) → `resetCopy.backToSignIn`. Every `signInCopy`/`requestResetCopy`
  query already present from the T028/T030 layers is untouched (confirmed byte-for-byte — those
  lines do not appear in this run's diff hunks at all).
- **`app/(auth)/login.test.tsx`**: identical pattern — adds the same `resetCopy` alias, retargets
  only the `ResetPasswordForm`-mounted queries (`Email`/`Reset code`/`New password`/`Set new
  password`, reached only after `reset-password-code-field` is truthy), leaves the pre-transition
  `signInCopy`/`requestResetCopy` queries untouched.
- **No assertion was weakened, removed, or had its target/expected-value changed.** Every change
  is a 1:1 substitution of a hardcoded English literal query string for the real `loginCopy.es`
  key the component now renders — what's being asserted (which control is queried, what value is
  typed/expected, which mock was/wasn't called, whether a field is null after a transition) is
  identical before and after.

## 2. FR-006 no-`useRouter()`-on-success guard — specifically re-verified

`LoginScreen.test.tsx`'s `"replaces SignInForm with the neutral 'Signing you in…' view on a
successful sign-in and navigates nowhere"` test (the FR-006 regression guard): its only line in
this run's diff is `queryByRole("button", { name: "Sign in" })` → `queryByRole("button", { name:
signInCopy.signInButton })` — and that substitution is the **T028 layer**, already reviewed and
approved two rounds ago, not new in this run. Diffed the test body itself against the T030/T031
baseline (previous review round's own quoted excerpt) — identical, zero lines touched by T032.
Confirmed `src/features/identity/LoginScreen.tsx` still imports no `useRouter`/`expo-router` at
all (only the test mocks it to observe calls) — `grep -n "useRouter\|expo-router" src/features/
identity/LoginScreen.tsx` returns nothing. Ran the suite directly:

```
PASS src/features/identity/LoginScreen.test.tsx (9/9 passing)
```

This guard would still fail if the regression it guards against were reintroduced: the mock
intercepts `expo-router`'s `useRouter` and records calls on `mockReplace`/`mockPush`; the test
asserts both were never called on a successful sign-in. Unchanged by this batch, live, not
vacuous — same conclusion as the T030/T031 round reached, independently re-confirmed here rather
than taken on faith.

## 3. `ResetPasswordForm.tsx` — restyle content review

- `RESEND_COOLDOWN_SECONDS` (value `30`) and its timer `useEffect` (lines 125-135 of the current
  file) are byte-for-byte unchanged from the pre-restyle version — diffed directly, confirmed no
  hunk touches this block at all.
- The `serverError?.field === "code"` → `setError(serverError.field, ...)` inline-error
  `useEffect` (lines 139-143) is byte-for-byte unchanged — same conclusion, confirmed by diff.
- `FormField` (the restyled `Field` from T023/T024) wraps the email field, the new-password field,
  and the reset-code field; the reset-code field's `Controller` renders `CodeInput` completely
  unmodified — same props (`value`, `onChangeText`, `onBlur`, `length`, `editable`, `testID`), only
  the surrounding `FormField`'s `label`/the passed-through `accessibilityLabel` are now translated
  strings. `git diff HEAD -- src/features/identity/CodeInput.tsx` is empty; `git log -1` on that
  file shows its last touch is `f58820c` (`001-registration-kyc`) — confirmed untouched by this or
  any 006 batch.
- `PrimaryButton` is used for "Set new password" (`label`, `onPress`, `busy={isSubmitting}`,
  `testID`), consistent with `SignInForm`'s and `RequestPasswordResetForm`'s own use of the same
  primitive for their primary actions.
- "Resend code" is now a `SecondaryButton` (disclosed judgment call, reasoned: it was already a
  bordered, button-shaped secondary action before this restyle, unlike "Back to sign in"); "Back
  to sign in" stays a plain restyled `Pressable` using `typography.body.link`'s
  fontSize/fontWeight/color — the identical treatment `RequestPasswordResetForm.tsx` (T030)
  already applies to its own "Back to sign in". Consistent visual vocabulary, not reinvented.
- One small, disclosed accessibility-state delta: the pre-restyle "Resend code" additionally set
  `accessibilityState.busy: isResending`; `SecondaryButton` (T013, unmodified) only exposes
  `disabled`. Confirmed via `canResend`'s unchanged derivation (`!isResending && !isSubmitting &&
  secondsRemaining === 0`) that `disabled` already correctly reflects "not currently pressable" at
  every moment `busy` would have been `true` — a fidelity loss (no "busy" hint distinct from
  "disabled" during the in-flight resend specifically) but not a regression against any previously
  asserted behavior (confirmed no test asserted `accessibilityState.busy` on this control before
  this run). Non-blocking, same class of disclosed nit this feature has raised before.
- Every rendered string in the JSX now resolves through `t(...)` (`useTranslation(loginCopy)`) —
  grepped the file directly, zero hardcoded Spanish/English sentence remains except the two
  documented pre-existing literal exceptions (title `fontSize: 22`/`fontWeight: "600"`, general-
  error banner `#dc2626`), consistent with the same precedent already reviewed/approved in
  `FormField.tsx`/`SignInForm.tsx`/`RequestPasswordResetForm.tsx`.
- `RESET_CODE_SENT_MESSAGE` (exported string constant) is retired in favor of
  `loginCopy.{es,en}.resetCodeSentMessage`; `grep -rn "RESET_CODE_SENT_MESSAGE" src/ app/` finds no
  reference outside this file's own (rewritten) test — safe removal, disclosed.
- Dictionary check: `resetCodeTitle`, `resetCodeSentMessage`, `resetCodeSubtitle`, `resetCodeLabel`,
  `newPasswordLabel`, `setNewPassword`, `settingPassword`, `resendCode`, `resendCodeWithSeconds`,
  `emailLabel`, `emailPlaceholder`, `backToSignIn` all already exist in both `es`/`en` in
  `src/domain/i18n/copy/login.ts` (added back in T019/Run 5, prior to this batch) — no dictionary
  gap needed filling this batch, keys match 1:1 between locales (`copy/login.test.ts`'s existing
  key-parity test still passes, confirmed by the full suite run below).

## 4. `ResetPasswordForm.test.tsx` — run independently

```
PASS src/features/identity/ResetPasswordForm.test.tsx
  ✓ always shows the static 'we've sent a code' confirmation, regardless of props
  ✓ calls onSubmit with the parsed email/code/password on a successful submit
  ✓ pre-fills the email field from initialEmail but allows editing it
  ✓ renders an invalid/expired-code serverError inline on the code field
  ✓ disables the resend button during the cooldown after pressing it, and re-enables once it elapses
  ✓ calls onBack when 'Back to sign in' is pressed
  ✓ renders the English equivalents when the locale context is set to 'en'
Tests: 7 passed, 7 total
```

All six pre-existing behavioral assertions are present and unweakened, retargeted only at
`loginCopy.es`'s real strings (read directly from the dictionary, never a duplicated hardcoded
string). The new locale-switch test is genuine, not a renders-without-throwing smoke test: it
renders inside a real `<LocaleProvider>`, confirms Spanish-by-default first
(`getByLabelText(es.emailLabel)`), presses a `LocaleSwitchTrigger` that calls the real
`setLocale("en")` seam, then asserts `queryByLabelText(es.emailLabel)` is `null` (confirms the old
one is actually gone, not just that a new one also appeared) **and** nine separate English strings
render (`en.emailLabel`, `en.resetCodeTitle`, `en.resetCodeSentMessage`, `en.resetCodeSubtitle`,
`en.resetCodeLabel`, `en.newPasswordLabel`, `en.setNewPassword`, `en.resendCode`,
`en.backToSignIn`) — real rendered-DOM assertions.

## 5. `tasks.md`

`T032` and `T033` both marked `[X]` (lines 278, 285 of `specs/006-visual-identity/tasks.md`). No
other task's checkbox state changed in this batch.

## 6. Full suite + `./init.sh` — run independently

- `npx tsc --noEmit` — clean, zero errors.
- `npx jest --no-coverage` — **58 suites / 362 tests, all passing.**
- `./init.sh` (full, no skip flags) — `RESULT: SUCCESS (10/10 stages passed)`. The only WARN
  stages are the identical, pre-existing, already-disclosed `expo-doctor` outdated-dependency
  advisory and native-dependency version drift (`expo-image-picker`/`react-native`/
  `react-native-safe-area-context`/`@types/react`/`typescript`) every prior round in this feature
  has already documented — no dependency changed this run.
- `FormField.tsx`'s error-text hex nit (deferred to Polish) remains the only other pre-existing,
  already-tracked disclosed item; nothing new surfaced.

## 7. File-scope check

`git status --short` shows this run's actually-changed tracked files are exactly:
`src/features/identity/ResetPasswordForm.tsx`, `src/features/identity/ResetPasswordForm.test.tsx`,
`src/features/identity/LoginScreen.test.tsx`, `app/(auth)/login.test.tsx`,
`specs/006-visual-identity/tasks.md`, `progress/impl_006-visual-identity.md` — matching the
documented batch scope exactly. All other modified/untracked files in the working tree
(`app.json`, `app/_layout.tsx`, `feature_list.json`, `package-lock.json`, `package.json`,
`FormField.tsx`, `SignInForm.tsx`/`.test.tsx`, `RequestPasswordResetForm.tsx`/`.test.tsx`,
`src/theme/`, `src/features/ui/`, `src/features/i18n/`, `src/domain/i18n/`, `LoginScreenChrome.*`,
`docs/design-brief-visual-identity.md`, `specs/006-visual-identity/`) are leftovers from earlier,
already-reviewed batches in this same feature (T001-T031) — this whole branch is one working tree
with no intermediate commits, consistent with every prior review round's own note. No drift
introduced by this batch.

## `tasks.md` checklist status (this batch)

- [X] T032 — Restyle `ResetPasswordForm.tsx`
- [X] T033 — Extend `ResetPasswordForm.test.tsx`

## `CHECKPOINTS.md` C1–C6 walkthrough (scoped to this batch)

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` exist. [x]
  `docs/verification.md`/`docs/conventions.md` exist. [x] `.specify/memory/constitution.md`
  exists, current. [x] `./init.sh` exits 0 (`RESULT: SUCCESS`, 10/10, WARN stages pre-existing).
- **C2**: [x] Only `006-visual-identity` is `in_progress` in `feature_list.json`. [x]
  `ResetPasswordForm.tsx`'s changed behavior is covered by passing tests (7/7). [x]
  `progress/current.md` — batch-level, out of this single-task review's remit, not evaluated
  further here.
- **C3**: [x] `src/domain` untouched by this batch (grep-confirmed — only
  `ResetPasswordForm.tsx`/`.test.tsx` plus the two ripple test files changed). [x]
  `ResetPasswordForm.tsx` calls into `src/domain/schemas.ts` and `src/domain/i18n/copy/login.ts`
  — no business logic inlined in the component. [x] No inline `Platform.OS` branch introduced.
  [x] No direct Postgres/Redis/S3/Supabase-table access — `onSubmit`/`onResend`/`onBack` remain
  pure injected props. [x] No new global state library. [x] No stray `console.log`/context-free
  `TODO` (grep-confirmed empty).
- **C4**: [x] `ResetPasswordForm.test.tsx` is a real RNTL component test asserting rendered
  output/role/label, not implementation details. [x] `./init.sh`'s three build-export stages all
  passed; native-dependency-alignment stage is WARN (pre-existing drift), not FAIL.
- **C5**: [x] No suspicious untracked files from this batch (only the expected leftover
  untracked set from prior, already-reviewed runs).
- **C6**: [x] `spec.md`/`plan.md`/`tasks.md` all exist. [x] No open `[NEEDS CLARIFICATION]`
  markers. [x] Feature is `in_progress`, not `done` — full-`[X]` checklist doesn't yet apply. [x]
  FR-006 (no-`useRouter()`-on-success), FR-010 (i18n lookup, no hardcoded copy), FR-013
  (accessibility label + tap target) are each covered by at least one test referencing them,
  spot-checked against the actual test files, matches.

No checkbox in C1–C6 is empty for what's in scope of this task-level batch.

## Requirement traceability (spot-checked against real tests)

| FR / AS | Test(s) | Verified |
|---|---|---|
| FR-006 (zero change to `LoginScreen`'s no-`useRouter()`-on-success guard) | `LoginScreen.test.tsx`'s "replaces SignInForm... and navigates nowhere" test, unweakened, 9/9 suite passing | Yes — ran it, mock/assertion wiring re-confirmed live, diff shows the T032 layer touched zero lines of this specific test |
| spec.md Assumptions ("forgot-password sub-views inherit the vocabulary, not a new mockup layout") | `ResetPasswordForm.tsx`'s `Field`/`PrimaryButton`/`SecondaryButton` reuse, identical field/button sequence to `RequestPasswordResetForm.tsx` | Yes |
| `onSubmit`, `onResend`, `onBack`, `initialEmail`, `isSubmitting`, `isResending`, `serverError`, `RESEND_COOLDOWN_SECONDS`, `serverError.field === "code"` wiring — preserved exactly | All 6 pre-existing `ResetPasswordForm.test.tsx` tests, unweakened; diffed timer/error `useEffect`s byte-for-byte | Yes |
| FR-010 (every string through `useTranslation(loginCopy)`, zero hardcoded copy) | Grep-verified; "renders the English equivalents..." test is the runtime proof | Yes |
| spec.md US4 AS1 (every visible string looked up by key) | Same locale-switch test, includes a negative check (`queryByLabelText(es.emailLabel)` is null post-switch) | Yes |
| FR-013 (real accessibility label + ≥44×44 tap target) | `PrimaryButton`'s/`SecondaryButton`'s already-tested contract inherited unchanged; "Back to sign in"'s `minHeight/minWidth: 44` unchanged | Yes |

## Findings

1. **No blocking findings.** The `LoginScreen.test.tsx`/`app/(auth)/login.test.tsx` ripple this
   batch introduced is narrow, correctly scoped to `reset-with-code`-mode queries only, traced
   line-by-line against each test's mode-transition sequence, and does not touch, weaken, or
   remove any assertion about `LoginScreen`'s behavior — including the FR-006 no-navigation guard,
   which this batch's diff touches zero lines of.
2. **Nit, non-blocking, disclosed** — the "Resend code" `accessibilityState.busy` fidelity loss
   from adopting `SecondaryButton` (see §3 above): a real, small, disclosed a11y regression in the
   sense that a screen reader loses a distinct "busy" announcement during the in-flight resend
   window, but not a regression against any previously-asserted test behavior. Worth a follow-up
   (adding an optional `busy` key to `SecondaryButton`'s `accessibilityState`) if the human wants
   full parity restored, not blocking this batch.
3. **Nit, non-blocking** — "Resend code" as `SecondaryButton` vs. "Back to sign in" as a plain
   link is an explicit, disclosed, reasoned judgment call, consistent with `RequestPasswordResetForm`'s
   own precedent; flagged for optional human override, not a defect.

## Verdict

**APPROVE WITH NITS** — T032/T033 correctly restyle `ResetPasswordForm.tsx` to the established
`Field`/`PrimaryButton`/`SecondaryButton` vocabulary with zero behavioral regression: the
`RESEND_COOLDOWN_SECONDS` timer and `serverError.field === "code"` inline-error wiring are
byte-for-byte unchanged, `CodeInput` itself is untouched, every string routes through
`useTranslation(loginCopy)` with real es/en dictionary parity, and the new locale-switch test is a
genuine behavioral assertion. The ripple in `LoginScreen.test.tsx`/`app/(auth)/login.test.tsx` is
narrow and correctly scoped — no assertion weakened or removed, and the FR-006 regression guard is
independently re-confirmed untouched by this run's diff. Full suite (58/58 suites, 362/362 tests)
and `./init.sh` (10/10 stages) are green beyond the pre-existing disclosed nits. The two nits above
(the `SecondaryButton`-inherited `accessibilityState.busy` loss, the resend/back-link style split)
are non-blocking and already disclosed by the implementer.

---

# Review: T034, T035, T036, T037 — `LoginScreen.tsx` composition + manual smoke check — 2026-08-05

**Reviewer**: code-reviewer (fresh pass, independent of `progress/impl_006-visual-identity.md`'s
Run 12 report). **Applied maximum scrutiny** per this batch being the single most
regression-critical task in the feature (FR-006's no-`useRouter()`-on-success guard, owned by
`005-login`).

**Scope claimed**: `src/features/identity/LoginScreen.tsx`, `LoginScreen.test.tsx`,
`app/(auth)/login.tsx` (no change expected), `app/(auth)/login.test.tsx` (no change expected in
this batch), `specs/006-visual-identity/tasks.md`, `progress/impl_006-visual-identity.md`.

## What changed (git diff against HEAD, since this feature is entirely uncommitted on this branch)

- `src/features/identity/LoginScreen.tsx`: read the full file (373 lines) and the `git diff HEAD`
  hunk-by-hunk. Confirmed:
  - Every import block, `LoginScreenMode` type, `RecoverySession` interface,
    `PASSWORD_RESET_SUCCESS_MESSAGE` constant, `LoginScreenProps`, all `useState` declarations,
    and every one of `handleSubmit`/`handleForgotPassword`/`handleRequestReset`/`handleResend`/
    `handleResetSubmit`/`handleBackToSignIn`/`resetFlowState` are **byte-for-byte unchanged** except
    for one purely additive line (`const t = useTranslation(loginCopy);`) inserted alongside the
    existing `useState` calls — a hook addition, not a change to any handler body. The diff's own
    context lines (unified diff) confirm nothing between the opening `{` of `LoginScreen` and the
    first `return` statement changed besides that one line.
  - The only substantive changes are inside the four `return` blocks: each is now wrapped in
    `<LoginScreenChrome>...</LoginScreenChrome>`, and the `"sign-in"` branch alone gains a
    `styles.brandBlock` (`BrandMark` + `t("brandTitle")` + `t("tagline")`) directly above
    `<SignInForm>`. The `signInSucceeded` view's text changed from the hardcoded literal
    `"Signing you in…"` to `{t("signingIn")}`. `styles.screen.padding` and `styles.signingInText.color`
    were switched from raw literals (`24`, `"#374151"`) to token references (`space.xxl`,
    `colors.text.secondary`) — pure styling, not logic.
  - **This satisfies review instruction 1 exactly**: zero change to any function body or the
    `mode` state machine, confirmed by direct inspection of the diff, not by trusting the
    implementer's own claim.
- `src/features/identity/LoginScreen.test.tsx`: diff confirms every pre-existing assertion is
  retained; the only literal-string changes are query targets moving from hardcoded English (e.g.
  `"Email"`, `"Sign in"`, `"Signing you in…"`) to `loginCopy.es`-derived constants — the same kind
  of ripple already applied by T028/T030/T032's own reviewed batches. Two new tests added
  (brand-block-present-only-on-sign-in, brand-block-absent-on-signing-in-transition). No existing
  assertion was weakened, removed, or had its expected outcome changed.
- `app/(auth)/login.tsx`: `git diff HEAD -- 'app/(auth)/login.tsx'` produced **zero output** — the
  file is completely untouched by this batch, exactly as T036 requires (no prop-shape change
  needed, none made).
- `app/(auth)/login.test.tsx`: `git diff HEAD` shows this file's changes are entirely attributable
  to the earlier, already-reviewed T028/T030/T032 copy-ripple (SignInForm/RequestPasswordResetForm/
  ResetPasswordForm now resolving copy via `loginCopy`) — not a new edit from this batch. Confirmed
  no additional hunk exists beyond what those three already-approved reviews cover.
- `specs/006-visual-identity/tasks.md`: T034, T035, T036, T037 all read `- [X]` (lines 287, 296,
  302, 306). T038+ (Phase 4) correctly remain `- [ ]`.
- `progress/impl_006-visual-identity.md`: Run 12 section appended, matches the above.

## Independent verification performed (not taking the implementer's report at its word)

1. **FR-006 regression guard — grepped the file myself**: `grep -n "useRouter\|router\.\|navigate\|
   replace(\|push(" src/features/identity/LoginScreen.tsx` returns exactly one hit — the file's own
   top-of-file *comment* describing the constraint ("this component NEVER calls useRouter()..."),
   zero executable reference. `LoginScreen.tsx` imports no navigation primitive at all.
2. **Proved the regression guard test is not vacuous** — the single most important check for this
   batch. I temporarily edited a scratch copy in place: added `import { useRouter } from
   "expo-router";`, called `useRouter()` at the top of the component, and added
   `router.replace("/");` immediately after `setSignInSucceeded(true);` inside `handleSubmit`
   (simulating exactly the regression FR-006 forbids). Ran
   `npx jest src/features/identity/LoginScreen.test.tsx`: the existing (unmodified-by-this-batch)
   test **"replaces SignInForm with the neutral 'Signing you in…' view on a successful sign-in and
   navigates nowhere"** failed immediately (`expect(mockReplace).not.toHaveBeenCalled()` — received
   1 call). Restored the file from a backup copy immediately afterward and re-ran the full
   `LoginScreen.test.tsx` suite (11/11 green again) to confirm the working tree was left exactly as
   it was before the experiment. This directly proves the guard test would still catch a real
   regression, not just that it currently happens to pass.
3. **Chrome wrap correctness** — read the JSX for all four return paths
   (`signInSucceeded`/`"request-reset"`/`"reset-with-code"`/default `"sign-in"`) directly: every one
   is wrapped in `<LoginScreenChrome>...</LoginScreenChrome>` with no exception. Cross-checked
   `LoginScreenChrome.tsx`/`.web.tsx` (from the already-approved T025–T027 batch) — both are pure
   `{children}` passthrough wrappers with their own `LoginScreenChrome.test.tsx` passthrough
   regression guard (not re-litigated here, already reviewed/approved).
4. **Brand-block gating** — read the conditional structure directly rather than trusting the test
   description: the `<View style={styles.brandBlock}>` block containing `BrandMark`/title/tagline
   appears **only** in the final (default, `"sign-in"`) return statement's JSX tree — it is a
   sibling of `<SignInForm>` inside that one `<View style={styles.screen}>`, and does not appear in
   any of the three earlier `return` blocks (`signInSucceeded`, `"request-reset"`,
   `"reset-with-code"`). Confirmed by direct line-by-line reading of the file, not by trusting
   `LoginScreen.test.tsx`'s own assertions.
5. **T035's new tests are genuine, not tautological** — read both new tests directly: the first
   asserts `getByRole("image", { name: "Draw a Card" })`/`getByText(signInCopy.brandTitle)`/
   `getByText(signInCopy.tagline)` present on initial "sign-in" render, then **after** transitioning
   to "request-reset" and "reset-with-code" asserts `queryByRole(...)`/`queryByText(...)` are both
   `null` — genuine absence checks (`queryBy*` returning `null`, not merely "renders something
   else"), not presence-only checks. The second test submits a real sign-in, waits for
   `testID="login-signing-in"`, then asserts the same two queries are `null` on that view too. Ran
   both tests myself (see below) — both pass, and their assertions genuinely exercise the query
   targets described.
6. **Ran `LoginScreen.test.tsx` myself**: `npx jest src/features/identity/LoginScreen.test.tsx` →
   `Test Suites: 1 passed, 1 total`, `Tests: 11 passed, 11 total`. Matches the implementer's
   reported 11/11 exactly.
7. **`app/(auth)/login.tsx` diff**: `git diff HEAD -- 'app/(auth)/login.tsx'` → empty. Confirms T036's
   claim of zero change is accurate, not merely asserted.
8. **`app/(auth)/login.test.tsx`**: ran independently, `Test Suites: 1 passed, 1 total`, `Tests: 4
   passed, 4 total`. All four assertions — including the "…never navigates" FR-006 guard and the
   "never touches the shared singleton's `signInWithPassword` mock during reset-with-code" guard —
   pass, consistent with this batch introducing zero behavioral change at the DI call site.
9. **Type-check**: `npx tsc --noEmit` — clean, zero errors, run independently.
10. **Full test suite**: `npx jest` (all suites) — `Test Suites: 58 passed, 58 total`, `Tests: 364
    passed, 364 total`. Matches the implementer's reported 364/364 exactly; confirms T023–T037's
    combined batches (`Field`/chrome/SignInForm/RequestPasswordResetForm/ResetPasswordForm/
    LoginScreen restyles) leave `/login`'s entire test surface green, no regression against
    `005-login`'s original suite.
11. **`./init.sh` (full, no skip flags)** — ran independently: `RESULT: SUCCESS (10/10 stages
    passed)`. Stage 5 (expo-doctor) and Stage 6 (native dependency alignment) show the identical
    pre-existing, already-disclosed warning set (`expo-image-picker`, `react-native`,
    `react-native-safe-area-context`, `@types/react`, `typescript` version drift) verified as
    pre-existing across every prior review round of this feature — no new warning introduced by
    this batch. Stage 7 (tests) and Stage 8 (web/iOS/Android bundle exports) both clean.
12. **T037's manual smoke check — honesty audit**: read `progress/impl_006-visual-identity.md`'s
    Run 12 "T037" section in full. It explicitly states, up front, in bold: **"No real browser or
    simulator tool was available in this environment for this run"** — and lists the substitute
    evidence actually gathered (booting a real Metro dev server via `npx expo start --web` and
    confirming a clean bundle; `curl`-ing `/login`'s SSR HTML and correctly noting this only shows
    the pre-existing, unrelated `KycGate` loading placeholder, not the hydrated screen; grepping the
    actual compiled client JS bundle for the literal copy/testID/font-family strings this task
    added, rather than a "should work" claim; `./init.sh`'s Stage 8 bundle-export cross-check for
    iOS/Android). It then has a dedicated **"What this does NOT confirm, and is disclosed as a real
    gap, not silently skipped"** paragraph stating plainly that pixel-level rendering (the gradient
    wash vs. card-over-blooms split, the bordered-vs-borderless `Field` switch, the Playfair Display
    glyph actually rendering as a serif) was **not visually verified**, and recommends a real
    `npm run web` + simulator pass before this feature's Phase 5 closes it out. This is exactly the
    plain, non-implied disclosure the review brief asked for — the substitute checks are presented
    as substitutes, not dressed up as an equivalent to a live visual check. No overstatement found.
13. **Deviations section audit** — the implementer's own "Deviations / notes for sign-off" section
    flags two genuine, disclosed judgment calls: (a) reusing the existing `signingIn` key instead of
    adding a new `signingInTransition`-shaped key a prior run's forward note had suggested (a
    reasonable de-duplication call, not a spec deviation — both moments are genuinely "signing in");
    (b) `PASSWORD_RESET_SUCCESS_MESSAGE` remains a hardcoded English literal because fixing it would
    require editing `handleResetSubmit`'s body, which this task's own "zero change to function
    bodies" constraint forbids — correctly left as a disclosed, real, out-of-scope FR-010 gap for a
    future task rather than silently patched by overstepping this batch's mandate. Both are
    non-blocking, honestly surfaced judgment calls, not hidden shortcuts.
14. **Blast-radius / scope check** — `git status --porcelain=v1` confirms this batch's diff is
    confined to `LoginScreen.tsx`, `LoginScreen.test.tsx`, `tasks.md`'s checkbox updates, and this
    progress-log append; `app/(auth)/login.tsx` untouched, `app/(auth)/login.test.tsx` unchanged
    relative to its already-reviewed T028/T030/T032 state. Nothing under `src/theme`,
    `src/features/ui`, or `src/features/scanner` was touched by this batch.

## Requirement traceability

| FR / AS | Test(s) / evidence |
|---|---|
| FR-006 (zero change to no-`useRouter()`-on-success; regression-critical) | `LoginScreen.tsx` contains no navigation import/call (grepped); `LoginScreen.test.tsx`'s "…navigates nowhere" test and `app/(auth)/login.test.tsx`'s "…never navigates" test both independently re-run, green; guard **proven non-vacuous** by injecting a real regression and watching it fail (see point 2 above), then reverting. |
| FR-005 (platform split via `.web.tsx`, not inline `Platform.OS`) | `LoginScreenChrome`/`LoginScreenChrome.web.tsx` (already reviewed/approved in the T025–T027 round) are now genuinely wired into every one of `LoginScreen.tsx`'s four return branches; grepped `LoginScreen.tsx` for `Platform.OS` — zero matches. |
| FR-010 (no hardcoded copy in the screen) | The brand block and "Signing you in…" text — the last two hardcoded strings in this file — now resolve via `t(...)`; `LoginScreen.test.tsx`'s two new tests plus the updated `signingIn` assertion confirm this. One disclosed, out-of-scope exception remains (`PASSWORD_RESET_SUCCESS_MESSAGE`), flagged above as non-blocking since fixing it would require a function-body edit this batch's own mandate forbids. |
| FR-001/SC-001 (no raw hex/magic literal in a touched screen) | `styles.signingInText.color`/`styles.screen.padding` now reference `colors.text.secondary`/`space.xxl` instead of raw literals — confirmed by direct reading. |
| spec.md US2 AS1/AS2 (brand block content order, both platforms) | `LoginScreen.test.tsx`'s new brand-block test (role/text queries); platform split itself is `LoginScreenChrome`'s own, already tested separately. |
| spec.md US2 AS4 (successful sign-in → neutral "Signing you in…" state, no brand block, no navigation) | `LoginScreen.test.tsx`'s new "does not render the brand block on the 'Signing you in…' transition" test, plus the independently-proven FR-006 guard. |
| spec.md US2 AS5 (forgot-password sub-flow stays local view-state) | `handleForgotPassword`/`handleBackToSignIn` confirmed byte-for-byte unchanged (diff inspection); pre-existing mode-sequence/"Back to sign in" tests independently re-run, green. |

## `tasks.md` checklist status (T034–T037)

- [X] T034 `LoginScreen.tsx` chrome wrap + brand block — verified: JSX-only change, all four
      branches wrapped, brand block gated to `"sign-in"` only, zero function-body change.
- [X] T035 `LoginScreen.test.tsx` extension — verified: all pre-existing assertions retained, two
      new genuine absence/presence tests added, both independently re-run and confirmed real.
- [X] T036 `app/(auth)/login.tsx`/its test — verified: zero change to either file, confirmed by
      empty `git diff` and independently re-run test suite (4/4 green).
- [X] T037 manual smoke check — verified: honestly disclosed as a substitute (dev-server boot +
      compiled-bundle-content grep + bundle-export cross-check), explicitly flagging what was NOT
      visually confirmed, matching this environment's previously-disclosed browser/simulator
      limitation rather than implying a live check occurred.

## CHECKPOINTS.md walkthrough (C1–C6)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md` and `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 — independently re-run, `RESULT: SUCCESS (10/10 stages passed)`.

**C2 — state coherent**
- [x] At most one feature `in_progress` (`006-visual-identity`; `007-localization` is `pending`).
- [x] Every `done` feature has passing tests covering it — full suite green (364/364), no
      regression against `005-login`'s original test surface.
- [x] `progress/current.md` describes only the active session (006-visual-identity).

**C3 — architecture respected**
- [x] No `src/domain` file touched by this batch; `LoginScreen.tsx` calls into
      `src/domain`/`src/lib` for all its logic (unchanged from before this batch) rather than
      embedding business logic in the component.
- [x] Platform-specific rendering (`LoginScreenChrome` vs. `.web.tsx`) expressed via file
      convention, zero inline `Platform.OS` in `LoginScreen.tsx` itself.
- [x] No direct Postgres/Redis/S3/Supabase-table access — `LoginScreen.tsx` only calls the
      injected `signIn`/`requestPasswordReset`/`createPasswordRecoverySession` props, unchanged.
- [x] No new global state library.
- [x] No stray `console.log`/context-free `TODO` in the diff (grepped, none present).

**C4 — verification real**
- [x] `LoginScreen.tsx` (a changed screen) has a covering, genuinely-behavioral component test
      suite (11/11, including two new real presence/absence assertions, independently re-run).
- [x] `./init.sh`'s build checks pass for all three targets, independently re-run.

**C5 — session closed well**
- [x] No suspicious untracked files — this batch added no new files at all (pure edit to two
      existing files plus `tasks.md`/progress-log bookkeeping).
- [ ] `progress/history.md` has no entry yet for this specific mid-session checkpoint — expected
      and not blocking, consistent with every prior round of this feature's review (session-close
      bookkeeping is the orchestrator's job, not per-task).
- [x] `feature_list.json` accurately reflects `006-visual-identity` as `in_progress`.

**C6 — SDD**
- [x] `006-visual-identity` (`sdd: true`, `in_progress`) has `spec.md` + `plan.md` + `tasks.md`.
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers.
- [x] N/A yet at the feature level (not `done`); T034–T037 themselves are correctly `[X]`.
- [x] FR-006/FR-005/FR-010/FR-001 (the FRs this batch's tasks cite) are each referenced by at
      least one test description/comment or independently-reproduced evidence, per the
      traceability table above.

No blocking empty box for this task-level scope.

## Findings

None blocking. This batch is exactly what it claims to be: a JSX-only composition change that
wraps every one of `LoginScreen.tsx`'s four render branches in the already-approved
`LoginScreenChrome`, adds the brand block strictly to the plain sign-in branch, and routes the two
remaining hardcoded strings in this file through the i18n mechanism — with zero touch to any
handler, the `mode` state machine, or the FR-006 no-navigation guarantee. The FR-006 regression
guard was independently proven non-vacuous by injecting a real regression and watching the
existing test catch it, then reverting cleanly. T037's manual smoke check is honestly disclosed as
a substitute for a live browser/simulator session (unavailable in this environment), with an
explicit, undisguised list of what was and wasn't actually confirmed — matching this feature's own
prior-round disclosure pattern rather than implying a live check took place.

One pre-existing, already-disclosed, non-blocking item carried forward from the implementer's own
report (not new to this review): `PASSWORD_RESET_SUCCESS_MESSAGE` remains a hardcoded English
literal, a real but explicitly out-of-scope FR-010 gap correctly left for a future task rather than
fixed by overstepping this batch's "zero function-body change" mandate.

## Verdict

**APPROVE** — T034, T035, T036, T037 are complete and correct. The FR-006 regression guard (this
feature's single highest-risk surface) is intact, independently re-verified to be a genuine,
non-vacuous check, and the chrome/brand-block composition matches spec.md US2's every relevant
acceptance scenario. Full suite (364/364), type-check, and `./init.sh` (10/10 stages) are all green
independent of the implementer's own report. Phase 3 (User Story 2, login restyle, T023–T037) is
now fully complete and regression-free relative to `005-login`'s original behavior.

---

# Review — 006-visual-identity — T038–T042 (Scan visual-shell presentational primitives)

**Scope of this review**: `src/features/scanner/Viewfinder.tsx`, `ScanSearchField.tsx`,
`UploadDropzone.tsx`, `EmptyResultsPanel.tsx`, `RecentScansList.tsx` + their `.test.tsx` files
(Phase 4 of `tasks.md`, User Story 3). `ScanShellScreen.tsx`/`.web.tsx`, `app/scan.tsx`, and
`ScanPlaceholderScreen` retirement (T043–T048) are explicitly **out of scope** — confirmed
untouched (see below).

## What changed (this batch)

New untracked files only:
- `src/features/scanner/Viewfinder.tsx` + `.test.tsx`
- `src/features/scanner/ScanSearchField.tsx` + `.test.tsx`
- `src/features/scanner/UploadDropzone.tsx` + `.test.tsx`
- `src/features/scanner/EmptyResultsPanel.tsx` + `.test.tsx`
- `src/features/scanner/RecentScansList.tsx` + `.test.tsx`
- `specs/006-visual-identity/tasks.md` — T038–T042 flipped to `[X]`
- `progress/impl_006-visual-identity.md` — Run 13 entry appended

Verified via `stat` mtimes that `src/features/scanner/ScanPlaceholderScreen.tsx`,
`ScanPlaceholderScreen.test.tsx`, and `ScanEntryCard.tsx`/`.test.tsx` carry the original commit's
timestamp (unchanged), and `git diff HEAD -- app/scan.tsx` is empty. **Confirmed: this batch
touches nothing under `app/scan.tsx` or the retired `ScanPlaceholderScreen`** — that work is
correctly deferred to T043–T048.

## Independent verification performed

1. **Camera-import guard — the single hardest constraint.** Grepped all five files myself for
   `expo-camera`, `expo-image-picker`, and any `camera`-matching import line:
   ```
   $ grep -n -iE "expo-camera|expo-image-picker|camera" src/features/scanner/{Viewfinder,ScanSearchField,UploadDropzone,EmptyResultsPanel,RecentScansList}.tsx
   ```
   Every match is either a comment or the literal string `"camera-outline"` (an Ionicons glyph
   name, not a module import) in `Viewfinder.tsx`. **Zero actual `import`/`require` line
   references any camera module in any of the five files.** Each `.test.tsx` includes a genuine
   source-inspection guard — `fs.readFileSync` the real `.tsx` file from disk, filter to lines
   matching `/^\s*import\b/` or `require(`, then assert none matches `expo-camera`,
   `expo-image-picker`, or `/camera/i` — the same technique `004-home-scan-shell`'s retired
   `ScanPlaceholderScreen.test.tsx` used (confirmed by reading that file: identical
   read-from-disk + regex-on-import-lines shape). This is a real, non-vacuous check, not a
   behavior-only render test that could miss an unused import.
2. **`RecentScansList.tsx` — FR-008 hard constraint.** Grepped the file: only `src/domain` import
   is `@/domain/i18n/copy/scan` (the static translation dictionary, required by FR-010); no
   `api-client` import; no `fetch(` call anywhere in the file (confirmed via `grep -c "fetch("` =
   0 and manual read of the full file). `PLACEHOLDER_ROWS` is a local, hand-typed `const` array of
   3 rows, colored via existing `colors.*` tokens (no raw hex). The file carries a prominent
   banner comment — `*** PLACEHOLDER-UNTIL-THE-REAL-SCANNER-FEATURE-SHIPS ***` — placed directly
   above the imports and repeated directly above `PLACEHOLDER_ROWS` itself; this is unambiguous
   and would not be missed by a future maintainer skimming the file. The test file additionally
   asserts this at the source level (`RecentScansList.test.tsx`'s "imports no data-fetching
   src/domain module and calls no fetch" test: every `@/domain` import line must match
   `@/domain/i18n/`, no line may match `api-client`, no `fetch(` call, and the banner string must
   be present in the source). This is a real, executable guard, not prose alone. The
   implementer's own report (`progress/impl_006-visual-identity.md` Run 13) discloses a genuine,
   correctly-resolved nuance: the kickoff brief's shorthand ("zero `src/domain` import") would
   have literally contradicted the FR-010 i18n mandate (which requires importing
   `@/domain/i18n/copy/scan`); the implementer went back to spec.md's own FR-008 text ("no
   `src/domain` **fetch**, no API call, no persistence") and resolved correctly — this is a
   narrower, accurate reading, not a weakening of the constraint. I independently confirm this
   reading matches spec.md FR-008's actual wording (`specs/006-visual-identity/spec.md` line
   402–404).
3. **`Viewfinder.tsx` visual spec** — `colors.viewfinder.bg` fill, `radius.panel`, `aspectRatio:
   4/3`, a 4×4 grid drawn via 6 absolutely-positioned 1px `View`s (3 vertical + 3 horizontal
   dividers at 25/50/75%) colored `colors.viewfinder.grid` — genuinely drawn via Views, not an
   image. Four L-shaped corner brackets: `BRACKET_INSET = 16`, `BRACKET_LENGTH = 36`,
   `BRACKET_THICKNESS = 3`, `colors.brand.primary` — matches brief §5 item 2 exactly. Centered
   camera glyph (`Ionicons name="camera-outline"`, confirmed a static icon glyph from
   `@expo/vector-icons`, not any camera-capability import) above hint copy colored
   `colors.viewfinder.hintText` via `useTranslation(scanCopy)`. Non-interactive gear chip
   top-right, correctly hidden from the accessibility tree
   (`accessibilityElementsHidden`/`importantForAccessibility="no-hide-descendants"`) per the
   task's own explicit instruction (matches `tasks.md` T038's wording verbatim, not an
   implementer invention). Confirmed `colors.viewfinder.hintText` is a real, distinct token in
   `src/theme/colors.ts` (split from `text.placeholder` per spec.md's Recorded default 2).
4. **`ScanSearchField.tsx`** — `colors.bg.surface`, `radius.row`, `CONTROL_HEIGHT`, placeholder
   copy via `useTranslation(scanCopy)`, trailing magnifier glyph (`Ionicons
   name="search-outline"`). Confirmed an explicit, prominent code comment (top of file) states
   plainly that the field is deliberately uncontrolled (no `value`/`onChangeText`) and that
   "typing here triggers no search/filter logic anywhere in this feature... do not add
   onChangeText/state here without a corresponding spec update" — a future reader will not
   mistake this for wired search behavior.
5. **`UploadDropzone.tsx`** — 1px dashed `colors.border.dashed`, `radius.row`, centered copy +
   leading upload glyph (`cloud-upload-outline`) via `useTranslation(scanCopy)`. No
   `accessibilityRole` set anywhere — confirmed non-interactive; test explicitly asserts
   `screen.getByRole("button")` throws.
6. **`EmptyResultsPanel.tsx`** — dashed border, `radius.panel`, centered playing-card glyph
   (`MaterialCommunityIcons name="cards-outline"`), line 1 via `typography.body.tagline` (which
   itself resolves to `colors.text.secondary`) and line 2 via `typography.body.legal` overridden
   to `colors.text.placeholder`, visibly smaller (12px vs. 15px) — matches brief §5.2 exactly.
   Both lines via `useTranslation(scanCopy)`.
7. **`RecentScansList.tsx` visual spec** — `label.section` "ESCANEOS RECIENTES" heading
   (stored in natural case in the dictionary, `textTransform: "uppercase"` applied by
   `typography.label.section` at render time — confirmed by reading `typography.ts`), rows:
   `bg.surface`, `radius.row`, `shadowSurface`, `padding: space.lg` (16), 44×44 rounded thumbnail
   (`radius.row`, colored via existing theme tokens, never a raw hex), name
   (`colors.text.primary`, weight 600) over meta (`colors.text.secondary`, 12px), price
   (`colors.accent.priceGreen`) positioned last in a `flex: 1`-preceded row (reads as
   right-aligned). Matches brief §5.2. Two literal `fontSize`s (15/12) on `name`/`meta`/`price`
   are not token references — brief §5.2 specifies weight/color only, not size, and `src/theme`
   has no dedicated list-row type-scale entry; the code documents this gap explicitly with a
   comment citing the same accepted precedent `FormField.tsx`'s error style already established.
   Not a token-value duplicate (no such token exists), so not an FR-001 violation, but worth
   tracking if a future feature adds a dedicated list-row typography token.
8. **Token-only sourcing (FR-001)** — grepped all five files for hex literals
   (`#[0-9a-fA-F]{3,8}`) and `rgba(...)` literals: zero matches. Every color reference goes
   through `colors.*` from `@/theme`.
9. **i18n (FR-010)** — all five files route every string through `useTranslation(scanCopy)`; no
   hardcoded Spanish/English sentence in any of the five component bodies (confirmed by reading
   each file in full). `src/domain/i18n/copy/scan.ts` has complete, parallel `es`/`en`
   dictionaries (`en` typed as `Record<keyof typeof es, string>`, compile-time parity), and
   `copy/scan.test.ts`'s key-parity test (`Object.keys(scanCopy.es).sort() ===
   Object.keys(scanCopy.en).sort()`) passes. All the keys T038–T042 consume
   (`viewfinderHint`, `searchPlaceholder`, `uploadDropzone`, `emptyResultsLine1`,
   `emptyResultsLine2`, `recentScansHeading`) exist in both locales with real, non-empty values.
10. **`tasks.md`** — T038, T039, T040, T041, T042 all `[X]`.
11. **Test suite / type-check / `./init.sh`** — ran independently, not trusting the implementer's
    report:
    - `node_modules/.bin/tsc --noEmit` → clean, zero errors.
    - `npx jest --silent` → **63 suites / 379 tests, all passing** (includes all five new test
      files plus every pre-existing suite — no regression).
    - `./init.sh` (full, no skip flags) → `RESULT: SUCCESS (10/10 stages passed)`. The two
      `WARN`s (expo-doctor outdated-dependency advisory; native-dependency-alignment drift on
      `expo-image-picker`/`react-native`/`react-native-safe-area-context`/`@types/react`/
      `typescript`) are the same pre-existing, already-disclosed drift set carried since T001 —
      not introduced by this batch, confirmed against the T001 review entry above.
    - `grep -rn "console\.\|TODO" src/features/scanner/{Viewfinder,ScanSearchField,UploadDropzone,EmptyResultsPanel,RecentScansList}.tsx` → zero matches.

## Requirement traceability (T038–T042's own claims, independently checked)

| FR | Test(s) | Verified |
|---|---|---|
| FR-001 (token-only, no raw hex) | Manual grep (no hex/rgba literals found) | Yes |
| FR-007 (visual shell, zero camera import, inert) | `does not import any camera-related module` in all 5 test files; render assertions for copy | Yes |
| FR-008 (recent-scans static placeholder, no fetch/API/domain data path) | `RecentScansList.test.tsx`: "imports no data-fetching src/domain module and calls no fetch" | Yes |
| FR-010 (i18n, no hardcoded copy) | All 5 test files assert against `scanCopy.es.*`; `copy/scan.test.ts` key-parity | Yes |
| FR-013 (accessible, inert-not-actionable) | `Viewfinder`/`UploadDropzone`/`EmptyResultsPanel` "does not expose a button role"; `ScanSearchField` "renders the search placeholder as an accessible label" | Yes |

## `tasks.md` checklist status

- [X] T038, [X] T039, [X] T040, [X] T041, [X] T042 — all correctly marked complete. T043+
  correctly left `[ ]` (out of this batch's scope).

## `CHECKPOINTS.md` C1–C6 walkthrough (scoped to what this batch can affect)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists, current.
- [x] `./init.sh` exits 0 (10/10 stages; only the two pre-existing, disclosed WARNs).

**C2 — state coherent**
- [x] Exactly one feature (`006-visual-identity`) `in_progress` in `feature_list.json`.
- [x] This batch's new tests pass and cover the new files.
- [x] `progress/current.md` reflects the active session (not re-verified line-by-line this pass,
      no batch-specific edit expected here).

**C3 — architecture respected**
- [x] No `src/domain` file touched by this batch; `RecentScansList.tsx`'s only `src/domain`
      import is the static i18n dictionary, never a fetch/data module (FR-008, independently
      confirmed above).
- [x] UI components call into `@/theme`/`@/domain/i18n` only — no business logic embedded.
- [x] No platform-specific inline `Platform.OS` branch in any of the five files (none of them
      need a platform split; `EmptyResultsPanel`/`RecentScansList` are correctly web-only-by-usage
      without needing a `.web.tsx` file of their own, since they carry no platform-conditional
      markup themselves).
- [x] No direct Postgres/Redis/S3/Supabase access — N/A, no data access at all in this batch.
- [x] No new global state library.
- [x] No stray `console.log`/context-free `TODO` (grepped, none present).

**C4 — verification real**
- [x] Every new component has a real React Native Testing Library test asserting rendered
      output/roles, not a "doesn't crash" check.
- [x] `./init.sh`'s build checks pass for all three targets, independently re-run.

**C5 — session closed well**
- [x] No suspicious untracked files beyond the expected new component/test files, `tasks.md`,
      and the progress log.
- [ ] `progress/history.md` — not updated by this batch; expected, session-close bookkeeping is
      the orchestrator's job, not per-task (consistent with every prior round of this feature's
      review).
- [x] `feature_list.json` accurately reflects `006-visual-identity` as `in_progress`.

**C6 — SDD**
- [x] `spec.md` + `plan.md` + `tasks.md` all exist for `006-visual-identity` (`sdd: true`).
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers.
- [x] T038–T042 correctly `[X]`; feature not yet `done`, so the "every tasks.md item `[X]`" bar
      doesn't yet apply to the whole file (T043+ intentionally still open).
- [x] FR-001/FR-007/FR-008/FR-010/FR-013 (the FRs this batch's tasks cite) are each referenced by
      at least one test description/comment, independently verified above.

No blocking empty box for this task-level scope.

## Findings

None blocking. Specifically on the hardest constraint: **zero camera-module import** across all
five files, confirmed both by a real source-inspection test in each `.test.tsx` and by my own
independent grep of the raw source — the only "camera"-matching text anywhere is the
`"camera-outline"` Ionicons glyph name and prose comments, never an import/require line. The
**FR-008 placeholder-data guard** on `RecentScansList.tsx` is genuinely strict (source-level
assertion that every `@/domain` import matches `@/domain/i18n/`, no `api-client` import, no
`fetch(` call) and the placeholder nature is marked with a comment that is unambiguous and
impossible to miss — this is not a weakened guard.

Minor, non-blocking observations (nits, not defects):
- `RecentScansList.tsx`'s row `name`/`meta`/`price` styles use literal `fontSize` values (15/12)
  rather than a theme typography token, because no dedicated list-row type-scale token exists in
  `src/theme/typography.ts` and the brief only specifies weight/color for these, not size. This
  is disclosed in an adjacent code comment citing the same accepted precedent as `FormField.tsx`'s
  error style. Not an FR-001 violation (no token value is being duplicated), but a candidate for a
  dedicated token if a future feature adds more list-row UI.
- `Viewfinder.tsx`'s hint text `fontSize: 14` and the gear chip's `28`/`14` sizing are also
  component-local literals not backed by a theme token — same reasoning (brief specifies exact
  pixel geometry for the brackets, which are correctly constants, but not a font-size token for
  the hint copy). Not blocking.

## Verdict

**APPROVE** — T038–T042 are complete and correct. All five presentational primitives draw
exclusively from `src/theme` tokens, route every string through `useTranslation(scanCopy)` with
complete `es`/`en` parity, and — most importantly — carry zero camera-module import anywhere,
verified independently via source grep and via each file's own genuine source-inspection test.
`RecentScansList.tsx` satisfies FR-008's hard constraint precisely as written in spec.md (static
local placeholder data, no `src/domain` fetch/API/persistence), with a prominent, unambiguous
placeholder-data comment and a real executable guard backing it — the FR-008 nuance the
implementer flagged (kickoff-brief shorthand vs. spec.md's actual wording) was resolved correctly,
not as a weakening. Full test suite (379/379), type-check, and `./init.sh` (10/10 stages) are all
green, independently re-run, not taken on the implementer's word. This batch correctly stays
scoped to the five new component+test files plus `tasks.md`/progress-log bookkeeping — nothing
under `app/scan.tsx` or the retired `ScanPlaceholderScreen` was touched, as required.

---

# Review round — T043, T044 (ScanShellScreen.tsx / ScanShellScreen.web.tsx)

**Scope**: `src/features/scanner/ScanShellScreen.tsx` (mobile/default) and
`ScanShellScreen.web.tsx` (web), composing the five previously-approved presentational pieces
(`Viewfinder`, `ScanSearchField`, `UploadDropzone`, `EmptyResultsPanel`, `RecentScansList`) plus
`PrimaryButton`/`StatusPill`.

## Source of truth read fresh

`specs/006-visual-identity/spec.md` (User Story 3, FR-007, FR-009, FR-013), `plan.md`'s "Scan
visual shell" Research Decision, `tasks.md` T043/T044/T045, `docs/design-brief-visual-identity.md`
§5.1/§5.2, `.specify/memory/constitution.md`, `docs/conventions.md`, `CHECKPOINTS.md`,
`progress/impl_006-visual-identity.md` Run 14.

## Traceability table (this batch)

| FR / AS | Requirement | Where satisfied | Verified how |
|---|---|---|---|
| FR-001 | No raw hex/magic literal in either file | Both files import `colors`/`space`/`typography` from `@/theme` exclusively; mobile padding is `space.xl` (=20, matches brief §5.1's "padding 20" exactly) | Read source; cross-checked `space.xl` against `src/theme/geometry.ts` |
| FR-005 | Platform split via file convention, not inline `Platform.OS` | Two files, `.tsx` + `.web.tsx`; grepped both for `Platform.OS` — zero matches | `grep -n "Platform" ScanShellScreen.tsx ScanShellScreen.web.tsx` → no matches |
| FR-007 | Visual shell, zero camera import, button genuinely inert | `PrimaryButton` rendered with `disabled` + no-op `onPress={() => {}}`, comment on both files references FR-007 explicitly; zero `expo-camera`/`expo-image-picker`/camera-import line in either file | `grep -n "expo-camera\|expo-image-picker\|camera"` on both files — only doc-comment prose matches, no import lines; independently re-confirmed by rendering and reading `accessibilityState.disabled === true` on the button in a throwaway test |
| US3 AS1 (mobile layout) | Single column, 20px padding, title→viewfinder→search→dropzone→button order, existing Back affordance unaffected | `ScanShellScreen.tsx` composes in exactly this order inside a `ScrollView`/`space.xl`-padded container; Back affordance is `app/scan.tsx`'s concern (T047, untouched by this batch, correctly so) | Read source |
| US3 AS2/AS3 (web two/one column) | ≥768px: left column (title+pill+controls), right column (results+list); <768px: collapse to one column, results below controls | `ScanShellScreen.web.tsx`'s `isTwoColumn` ternary switches `styles.rowLayout`/`styles.stackedLayout` on the wrapping `View`; `controls` rendered before `results` in both branches (JSX order), matching the "results below controls" collapse requirement | Read source; **independently re-tested** with a throwaway Jest file mocking `useWindowDimensions` at 768px and 767px — confirmed the direct ancestor of `scan-shell-controls-column` actually flips between `flexDirection: "row"` (768px) and `flexDirection: "column"` (767px); deleted after use |
| FR-013 / accessibility | ≥44×44 targets, no bare `accessibilityRole="button"` on inert content | Only real interactive element is the (disabled) `PrimaryButton`; `StatusPill` and the composed pieces carry no new roles at this composition layer | Read source; no new accessibility surface introduced by composition itself (inherited from already-reviewed T038–T042) |
| Reuse of `BREAKPOINT_PX` | Must reuse `src/domain/navigation.ts`'s existing constant, not redefine | `ScanShellScreen.web.tsx` imports `BREAKPOINT_PX` from `@/domain/navigation`; grepped the whole repo — the only `export const BREAKPOINT_PX` is in `src/domain/navigation.ts` | `grep -rn "BREAKPOINT_PX"` across `src/`, `app/` |

## tasks.md checklist status (this batch)

- [X] T043 — `ScanShellScreen.tsx` created, matches description.
- [X] T044 — `ScanShellScreen.web.tsx` created, matches description.
- T045 (`ScanShellScreen.test.tsx`, migrated camera-import guard + breakpoint-collapse test) is
  correctly still `[ ]` — out of this batch's stated scope, not silently skipped.

## CHECKPOINTS.md C1–C6 walkthrough (task-level scope, feature still `in_progress`)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all present.
- [x] `docs/verification.md`, `docs/conventions.md` present.
- [x] `.specify/memory/constitution.md` present, current.
- [x] `./init.sh` exits 0 — independently re-run this round: `RESULT: SUCCESS (10/10 stages
      passed)`, only the two pre-existing, previously-disclosed dependency-drift warnings
      (expo-doctor outdated deps, native-dependency-alignment) at stages 5/6 — identical to the
      warnings recorded in Run 1 and every subsequent run, none introduced by T043/T044.

**C2 — state coherent**
- [x] Exactly one feature (`006-visual-identity`) `in_progress` in `feature_list.json`
      (independently re-checked: `001`/`004`/`005` `done`, `002`/`003`/`007` `pending`).
- [x] This batch introduces no new test file (correctly deferred to T045) — existing tests for
      the five composed pieces still pass unmodified (`npx jest src/features/scanner` — 7 suites
      unaffected plus the two new screen files with no dedicated test yet, consistent with
      `tasks.md`).
- [x] `progress/current.md` — not touched by this batch, no batch-specific edit expected.

**C3 — architecture respected**
- [x] Neither file touches `src/domain` directly — both import only `@/domain/i18n/copy/scan`
      (copy) and `@/domain/navigation` (the shared `BREAKPOINT_PX` constant), no fetch/business
      logic embedded in either component body.
- [x] No inline `Platform.OS` branch in either file (grepped, zero matches) — the `.web.tsx`
      extension is the entire platform split, per Constitution IV/FR-005.
- [x] No direct Postgres/Redis/S3/Supabase access — N/A, no data access at all.
- [x] No new global state library introduced.
- [x] No stray `console.log`, no context-free `TODO` in either file.

**C4 — verification real**
- [x] Full suite independently re-run: `Test Suites: 63 passed, 63 total / Tests: 379 passed,
      379 total`.
- [x] `node_modules/.bin/tsc --noEmit` independently re-run: zero output, clean.
- [x] `./init.sh`'s three bundle-export stages (web/iOS/Android) all pass.
- [x] Since T045 (the committed test file) doesn't exist yet, I independently exercised the
      breakpoint-collapse claim myself with a throwaway Jest file (same
      `jest.mock("react-native/Libraries/Utilities/useWindowDimensions")` +
      `mockUseWindowDimensions.mockReturnValue(...)` technique `AppWebLayout.test.tsx`
      established) rather than trusting the implementer's report of a similarly-throwaway,
      already-deleted smoke test. Result: genuinely confirmed the row/column style flip at the
      768/767px boundary, not merely that the component renders without throwing.

**C5 — session closed well**
- [x] No suspicious untracked files beyond the expected new files (`ScanShellScreen.tsx`,
      `ScanShellScreen.web.tsx`), `tasks.md`, and the progress log — confirmed via file mtimes
      (23:10:07–23:12:40, isolated from every earlier task's file-write timestamps) that this
      batch touched exactly those four artifacts, nothing else.
- [ ] `progress/history.md` — not updated this batch; expected, session-close bookkeeping is the
      orchestrator's job, consistent with every prior round of this feature's review.
- [x] `feature_list.json` accurately reflects `006-visual-identity` as `in_progress`.

**C6 — SDD**
- [x] `spec.md` + `plan.md` + `tasks.md` all exist for `006-visual-identity` (`sdd: true`).
- [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers (three recorded defaults, flagged for
      confirmation, not blocking markers).
- [x] T043/T044 correctly `[X]`; T045+ correctly still open — feature not yet `done`, so "every
      `tasks.md` item `[X]`" doesn't yet apply to the whole file.
- [x] FR-001/FR-005/FR-007/FR-009/FR-013 (the FRs this batch's tasks cite) are each referenced by
      an in-file code comment; the migrated *executable* camera-import source-inspection guard
      test is explicitly T045's job, not this batch's — correctly not claimed as done here.

No blocking empty box for this task-level scope.

## Findings

None blocking.

- **Mobile layout (T043)**: single column, `space.xl` (20px) padding sourced from
  `src/theme/geometry.ts` (not a bare literal), `display.lg` title "Escanear" via
  `useTranslation(scanCopy)`, composes `Viewfinder → ScanSearchField → UploadDropzone →
  PrimaryButton "Escanear carta"` in exactly the documented order. Correct.
- **Web layout (T044)**: reuses the existing `src/domain/navigation.ts` `BREAKPOINT_PX` (confirmed
  by repo-wide grep — no second breakpoint constant exists anywhere). At ≥768px renders two
  columns (left: title + `StatusPill` side by side, then the four controls; right:
  `EmptyResultsPanel` above `RecentScansList`); below 768px collapses to one column with results
  below controls — **independently verified with a live width-mock test at both 768px and 767px**,
  not just a default-mounted render.
- **"Escanear carta" `PrimaryButton`**: genuinely disabled (`disabled` prop set,
  `accessibilityState.disabled === true` confirmed by rendering), `onPress` is a no-op that can
  never fire because `PrimaryButton`'s own `isDisabled` guard blocks it — and both files carry an
  explicit code comment referencing FR-007 explaining this is an intentional placeholder, not a
  bug to "fix" by wiring it up.
- **Zero camera-related import**: grepped both files myself — the only "camera" matches are prose
  comments and the `"camera-outline"` Ionicons glyph name (inherited from the already-approved
  `Viewfinder.tsx`), never an import/require line.
- **No inline `Platform.OS` branch**: grepped both files, zero matches — the `.web.tsx` convention
  is the entire platform split, correctly.
- **Token-only styling**: both files' `StyleSheet.create` blocks reference only `colors.*`,
  `space.*`, and `typography.display.lg.*` — no raw hex or magic-number literal duplicating a
  token value.
- **Scope containment**: confirmed via file mtimes that this batch touched exactly
  `ScanShellScreen.tsx`, `ScanShellScreen.web.tsx`, `tasks.md`, and the progress log — no test
  file was added in this batch (correctly deferred to T045), and no other file (e.g. `app/scan.tsx`,
  `ScanPlaceholderScreen.tsx`) was touched.

Minor, non-blocking observation:
- The web file's container padding (`space.xxl` = 24) and inter-column gap aren't explicitly
  specified by brief §5.2 (which only mandates the column *contents*, not the outer container
  padding/gap), so this is a reasonable token-sourced choice rather than an unsourced literal —
  not a defect, just noting it's an implementer judgment call, correctly still token-derived.

## Verdict

**APPROVE** — T043 and T044 are complete and correct. Both files compose the five
previously-approved presentational pieces in the exact order and layout `docs/design-brief-
visual-identity.md` §5.1/§5.2 specifies, draw every value from `src/theme` tokens (mobile padding
correctly `space.xl`, not a bare `20`), reuse the existing `BREAKPOINT_PX` rather than redefining
it, and express the platform split entirely via the `.web.tsx` file-extension convention with zero
inline `Platform.OS` branch. The "Escanear carta" `PrimaryButton` is genuinely inert with an
explicit FR-007-referencing comment guarding against a future "fix." Zero camera-related import in
either file, confirmed independently. I independently re-ran `tsc --noEmit` (clean), the full test
suite (379/379 passing), and `./init.sh` (10/10 stages, `RESULT: SUCCESS`, only the same two
pre-existing disclosed dependency-drift warnings as every prior run) — not taken on the
implementer's word. I also independently wrote and ran a throwaway breakpoint test (same
`useWindowDimensions`-mocking technique as `AppWebLayout.test.tsx`) to confirm the two-
column/one-column collapse is a genuine, live style change at 768px vs. 767px, not just a
component that renders without throwing. This batch stayed correctly scoped to exactly the four
files instructed — `ScanShellScreen.tsx`, `ScanShellScreen.web.tsx`, `tasks.md`, and the progress
log — with T045 (the real committed breakpoint/camera-guard test) correctly left for the next
task.

---

## Review — Run 15 (T045, T046): migrated camera-import guard (`ScanShellScreen.test.tsx`) + `ScanPlaceholderScreen` retirement

**Scope reviewed**: `src/features/scanner/ScanShellScreen.test.tsx` (new, T045), deletion of
`src/features/scanner/ScanPlaceholderScreen.tsx`/`ScanPlaceholderScreen.test.tsx` (T046),
`specs/006-visual-identity/tasks.md`, `progress/impl_006-visual-identity.md`. Also independently
inspected the disclosed deviation touching `app/scan.tsx`/`app/scan.test.tsx`.

### Primary focus: continuity of the camera-import source-inspection guard (004-home-scan-shell FR-005 / 006 FR-007 / SC-004)

- Read the retired `ScanPlaceholderScreen.test.tsx` verbatim from git history (`git show
  53adae8:src/features/scanner/ScanPlaceholderScreen.test.tsx`). Its guard technique: read the
  file's source via `fs.readFileSync`, filter to lines matching `/^\s*import\b/` or `require\(`,
  assert none matches `/expo-camera/`, `/expo-image-picker/`, or `/camera/i`.
- `ScanShellScreen.test.tsx`'s guard uses **the identical filter/assertion logic**, run via
  `it.each` against **7 files** (`ScanShellScreen.tsx`, `ScanShellScreen.web.tsx`,
  `Viewfinder.tsx`, `ScanSearchField.tsx`, `UploadDropzone.tsx`, `EmptyResultsPanel.tsx`,
  `RecentScansList.tsx`) — i.e. every scanner file this feature added, not merely the two shell
  files. Strictly broader coverage than the original (which guarded exactly one file). Not
  weakened in any respect.
- **Ran it myself**: `npx jest src/features/scanner/ScanShellScreen.test.tsx` → 11/11 passing,
  including all 7 `it.each` guard cases.
- **Mutation-tested the guard's teeth**, not just its presence: added `import { Camera } from
  "expo-camera";` to the top of `Viewfinder.tsx` and reran the guard-only tests
  (`-t "camera-import guard"`). Result: the `Viewfinder.tsx` case failed exactly as expected
  (`Expected: false, Received: true`), with the other 6 files' cases still passing. Confirms the
  assertion logic genuinely inspects real file contents, not a stale snapshot or a tautology.
  Reverted the injected line by hand afterward (the file is untracked/new to this feature so
  `git checkout` doesn't restore it — deleted the injected line directly) and re-ran the full
  suite (63/63 suites, 388/388 tests) to confirm the repo was returned to its pre-mutation state
  before finishing this review.
- Sequencing: `tasks.md` records `T046 ... Depends on: T045 (the guard must already be migrated
  before the old file/test is deleted...)`, and the implementer's Run 15 report states the guard
  was written and confirmed green before the two `ScanPlaceholderScreen` files were deleted. No
  direct git-history proof is possible (nothing on this branch has been committed yet — every
  006 change, across all 15 runs, is still working-tree state), but the end state is unambiguous
  and consistent with that account: the new guard exists, is green, and is strictly broader than
  the one it replaced.

**Verdict on the guard specifically: intact, not weakened, migration genuine and verified
independently — not merely asserted.**

### `ScanPlaceholderScreen` removal — fully gone, no dangling references

- `ls src/features/scanner/ScanPlaceholderScreen.tsx src/features/scanner/ScanPlaceholderScreen.test.tsx`
  → both `No such file or directory`. `git status --short` confirms both as `D` (staged-for-delete
  in the working tree, never committed on this branch).
- Repo-wide grep (`grep -rn "ScanPlaceholderScreen" .`, excluding `node_modules`) returns only
  prose/comment references: `app/scan.tsx`'s and `app/scan.test.tsx`'s top-of-file comments
  explaining the retirement, `ScanShellScreen.test.tsx`'s and `Viewfinder.test.tsx`'s comments
  referencing the migrated technique's origin, plus historical mentions in `progress/*.md`,
  `specs/004-home-scan-shell/*`, and `specs/006-visual-identity/*` (all prose/history, not code).
  **Zero live import/require statements remain anywhere in the repo.**
- `app/scan.tsx` does **not** still import `ScanPlaceholderScreen` — see Deviation note below;
  it was updated in this same batch to import `ScanShellScreen` instead, which is *better* than
  the "expected mid-feature state" I was told to tolerate (still importing the deleted module),
  not a bug.

### Disclosed deviation: `app/scan.tsx` / `app/scan.test.tsx` touched, one task early

`tasks.md`'s dependency graph makes `T046` depend only on `T045`, but `app/scan.tsx` had a live
import of `ScanPlaceholderScreen` that literal task text assigns to `T047` (not in this batch's
assigned scope: `T045`, `T046` only). Deleting `ScanPlaceholderScreen.tsx` per `T046` without
also fixing that import would have left the repo in a broken, unbuildable state — `app/scan.tsx`
would fail module resolution, `./init.sh` would fail Stage 4/7/8, and `T046`'s own literal
instruction ("confirm no remaining import references it anywhere") would be impossible to
satisfy honestly. The implementer made the minimal mechanical fix (import/JSX swap to the
already-approved `ScanShellScreen`, one now-stale test assertion updated to the new title copy),
explicitly left `T047`'s real scope (the "Back" button's own visual restyle) undone, and
disclosed this prominently in the Run 15 report under a "Deviations needing sign-off" heading
rather than silently absorbing it into "T045/T046 complete."

Confirmed via `git diff app/scan.tsx app/scan.test.tsx`: the diffs are exactly what's claimed —
a comment update, one import-name swap, one JSX tag swap, one new `scanCopy` import, and one
assertion's expected string swapped from `/scanner coming soon/i` to
`scanCopy.es.titleMobile`. The "Back" `Pressable`'s own styling (`styles.backButton`/
`styles.backLabel`, hardcoded `#111827`) is untouched, exactly as claimed — `T047`'s token-driven
restyle genuinely remains undone.

This is a scope boundary I was told to expect held ("no other file changed" beyond the four named
paths) that did not hold in practice — but the deviation is small, mechanically necessary,
correctly attributed to the right task IDs in `tasks.md` (T047/T048 correctly left `[ ]`, not
marked done), and transparently disclosed for sign-off rather than hidden. **Non-blocking**,
flagged here for visibility per the reporting instructions, not a defect in the guard or in
FR-007/FR-005 compliance.

### Other `ScanShellScreen.test.tsx` assertions — spot-checked, genuine

- The breakpoint test doesn't just render without throwing — it retrieves the actual composite
  `View`'s flattened style (`StyleSheet.flatten(rowContainer.props.style)`) and asserts
  `flexDirection` is literally `"row"` at 800px and `"column"` at 767px, using the same
  `useWindowDimensions` mock technique as `src/features/navigation/AppWebLayout.test.tsx`. This
  is a real layout assertion, not a smoke test.
- The mobile-render test asserts five distinct rendered strings (title, viewfinder hint, search
  placeholder text via `getByPlaceholderText`, dropzone copy, button label) against the real
  `scanCopy.es` dictionary values (not duplicated hardcoded strings), so a copy typo in either the
  component or the dictionary would fail this test, not silently pass.
- Confirmed independently by running the suite (see above) — all pass for real, not by
  inspection alone.

### Type-check / full suite / `./init.sh` — independently re-run

- `npx tsc --noEmit` — clean, zero errors.
- `npx jest` (full suite) — **63 suites, 388 tests, all passing**, matching the Run 15 report
  exactly.
- `./init.sh` (no skip flags) — `RESULT: SUCCESS (10/10 stages passed)`. The only two `WARN`s are
  the same pre-existing, already-disclosed native-dependency-drift items (`expo-doctor` outdated
  dependencies; `expo-image-picker`/`react-native`/`react-native-safe-area-context`/`@types/
  react`/`typescript` version drift) present since Run 1 (`T001`) — not introduced by this batch.

### `tasks.md` status

- T045: `[X]`. T046: `[X]`. Both correctly marked. T047, T048, T049 correctly left `[ ]` despite
  the necessary partial `app/scan.tsx` fix (see Deviation above) — no task inflation.

### CHECKPOINTS.md walkthrough (C1–C6, as of this batch's end state)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md` and `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current (v1.0.0).
- [x] `./init.sh` exits 0 (RESULT: SUCCESS, 10/10 stages; only pre-existing disclosed WARNs).

**C2 — state coherent**
- [x] Exactly one feature (`006-visual-identity`) is `in_progress` in `feature_list.json`.
- [x] N/A for this batch — `006-visual-identity` is not yet `done`; prior `done` features
      (`001`, `004`, `005`) already carry their own passing-test coverage from their own reviews.
- [x] `progress/current.md` describes the active `006-visual-identity` session only.

**C3 — architecture respected**
- [x] `src/features/scanner` (this batch's files) has zero business-logic-in-component-body
      violations relevant to this batch — `ScanShellScreen.test.tsx` is test-only; the `.tsx`
      composition files were already reviewed/approved in Run 14.
- [x] Platform-specific rendering (`ScanShellScreen.tsx` vs. `.web.tsx`) uses the file-extension
      convention; grepped both — zero inline `Platform.OS` branches (only comments *stating* the
      absence of one).
- [x] No direct Postgres/Redis/S3/Supabase-table access anywhere in this batch (no backend calls
      at all in this feature, confirmed by plan.md's own Constitution Check).
- [x] No new global state library introduced.
- [x] No stray `console.log`/context-free `TODO` in this batch's files (grepped, zero matches).

**C4 — verification real**
- [x] N/A/covered — this batch adds no new `src/domain` export (T045/T046 are test/removal only).
- [x] `ScanShellScreen.test.tsx` is a genuine RNTL component test asserting real rendered output/
      roles/styles, not implementation details — spot-checked above.
- [x] `./init.sh`'s three build-check stages (web/iOS/Android) all pass; Native dependency
      alignment stage is `WARN`, not `FAIL` (pre-existing, documented, unrelated to this batch).

**C5 — session closed well**
- [x] No suspicious untracked files — `git status --short` shows only the expected deletions
      (`ScanPlaceholderScreen.*`) and untracked files matching `plan.md`'s Project Structure tree;
      nothing resembling a stray `.tmp`/cache artifact.
- [ ] `progress/history.md` has no entry yet for this (still-open) `006-visual-identity` session —
      expected and non-blocking at this stage: per this repo's own established precedent (see the
      `005-login` final review in this same file's history), that entry is the orchestrator's
      session-*close* responsibility, not a per-task-batch one, and `006` is still `in_progress`
      with tasks remaining (`T047`–`T054`).
- [x] `feature_list.json` accurately reflects `006-visual-identity` as the active, `in_progress`
      feature.

**C6 — SDD**
- [x] `006-visual-identity` has `spec.md` + `plan.md` + `tasks.md` under `specs/006-visual-identity/`.
- [x] `spec.md` carries no open `[NEEDS CLARIFICATION]` marker (status: "Clarified"; the one
      grep hit is prose referencing the bracket syntax in a sentence, not an actual open marker).
- [x] N/A — `006-visual-identity` is not yet `done`.
- [x] FR-007/SC-004 (this batch's requirements) are each referenced directly in
      `ScanShellScreen.test.tsx`'s own top-of-file comment and `describe` block naming; traced in
      the table below.

No blocking empty box for this batch's scope (the one `[ ]`, C5's `history.md` entry, is an
explicitly session-close-scoped item per this repo's own established convention, not a defect).

### Requirement traceability (this batch)

| FR / SC | Covered by |
|---|---|
| FR-007 (no camera import/capture/recognition on the scan visual shell) | `ScanShellScreen.test.tsx`'s `it.each` camera-import guard, 7 files, migrated + broadened from `ScanPlaceholderScreen.test.tsx`; independently mutation-tested by this review |
| SC-004 (source-inspection guard stays green throughout implementation) | Same guard, confirmed green both before and after `ScanPlaceholderScreen`'s removal per Run 15's own account and this review's independent rerun |
| spec.md US3 Independent Test | `ScanShellScreen.test.tsx`'s content-rendering assertions (title, hint, placeholder, dropzone, button) |
| spec.md US3 AS2/AS3 (two-column/one-column breakpoint collapse) | The two `useWindowDimensions`-mocked breakpoint tests, asserting real flattened `flexDirection` style |

### Findings

None blocking.

- **Non-blocking, disclosed**: `app/scan.tsx`/`app/scan.test.tsx` were touched in this batch
  despite being nominally `T047`/`T048`'s files — a mechanically necessary, minimal,
  transparently-disclosed fix to keep the build/tests green after `ScanPlaceholderScreen`'s
  deletion. `T047`/`T048` correctly remain `[ ]`; their remaining real scope (the "Back" button's
  token-driven visual restyle, further test alignment) is genuinely still open. No action needed
  before proceeding to `T047`.

### Verdict

**APPROVE.** The camera-import source-inspection guard — the safety mechanism
`004-home-scan-shell` FR-005 and `006-visual-identity` FR-007/SC-004 depend on — migrated intact
and was strictly broadened (1 file → 7 files), verified genuinely green by independently running
the suite, and confirmed to actually catch a real injected camera import via a hands-on mutation
test (not just "compiles and doesn't obviously break"). `ScanPlaceholderScreen.tsx`/`.test.tsx`
are fully removed with zero dangling live references anywhere in the repo (grepped). Sequencing
(guard-before-deletion) is consistent with both the task dependency and the implementer's account,
and the end state is unambiguous either way. `tasks.md` T045/T046 correctly marked `[X]`; T047–
T049 correctly left `[ ]`. `ScanShellScreen.test.tsx`'s other assertions (content, breakpoint
collapse) are genuine, spot-checked, and independently reproduced. Full suite (388/388), type-
check, and unflagged `./init.sh` (10/10, `RESULT: SUCCESS`) all independently re-run and green,
matching Run 15's own report. The one disclosed deviation (`app/scan.tsx`/`app/scan.test.tsx`
touched one task early, out of strict `T045`/`T046` file scope) was necessary to avoid leaving the
repo unbuildable, correctly minimal, correctly NOT claimed as `T047`/`T048` completion, and
transparently flagged for sign-off — non-blocking. Proceed to `T047`–`T049`.

---

## Review: T047, T048, T049 (2026-08-05) — restyle `app/scan.tsx`'s "Back" affordance, align its test, manual smoke check — Phase 4 close-out

### Scope reviewed

`app/scan.tsx`, `app/scan.test.tsx`, `specs/006-visual-identity/tasks.md` (T047–T049 status),
`progress/impl_006-visual-identity.md`'s Run 16 entry. Cross-checked against
`specs/006-visual-identity/spec.md` (US3, FR-007/FR-009), `plan.md`, `docs/design-brief-visual-
identity.md` §5, `docs/conventions.md`'s `Platform.select` allowance, `.specify/memory/
constitution.md`, and `specs/004-home-scan-shell/spec.md`'s US2 AS2.

### 1. `app/scan.tsx`

- `ScanShellScreen` (from `@/features/scanner/ScanShellScreen`) is now imported and rendered in
  place of the removed `ScanPlaceholderScreen` — confirmed via `git diff` and a direct read of the
  file. `ScanPlaceholderScreen.tsx`/`.test.tsx` are genuinely deleted (`git status` shows
  `deleted:`), and this was already correctly landed in Run 15 (T045/T046), with Run 16 building on
  top of it as disclosed.
- The "Back" `Pressable` still calls `router.back()`, unchanged: `onPress={() => router.back()}`,
  same `accessibilityRole="button"`, `accessibilityLabel="Back to Home"`, `testID="scan-back-
  button"` — byte-for-byte identical to the pre-diff version on every behavioral prop. Only
  `styles.backButton`/`styles.backLabel` and the addition of an `<Ionicons name="chevron-back">`
  glyph changed. `minWidth: 44`/`minHeight: 44` tap-target floor preserved (now via literal 44,
  unchanged — not tokenized, but matches the pre-existing value and Constitution VII's 44×44
  floor).
- No `Platform.select` was actually used in the final code. The task's text described "a single,
  narrow `Platform.select` for the icon/label color against the two different backgrounds" as
  *acceptable*, not mandatory. I independently verified the implementer's stated reason for
  omitting it: `grep -n "backgroundColor" src/features/scanner/ScanShellScreen.tsx
  ScanShellScreen.web.tsx` shows both set the *identical* token, `colors.bg.page`, on their
  outermost container — so there is no genuine mobile-vs-web background divergence for an
  icon/label color to key off of today. A `Platform.select` with two identical branches would
  indeed be dead code. Re-reading `docs/conventions.md`'s actual allowance language (lines 15–17:
  "Platform-specific behavior uses the `.ios.tsx`/`.android.tsx`/`.web.tsx` file-extension
  convention or `Platform.select` — never scattered inline `if (Platform.OS === ...)` chains")
  confirms this is a general either/or allowance, not a mandate to add a no-op branch. The decision
  not to use it is reasonable, correctly scoped (no broader platform branch was substituted in its
  place — one shared value is used for both platforms, which is the actually-correct outcome per
  Recorded default 3's "no genuine background divergence" finding), and transparently documented
  both in the file's own top-of-file comment and in the progress log. This is not a nit; it is the
  right engineering call, correctly disclosed rather than silently deviating from the task text.

### 2. `app/scan.test.tsx`

- `git diff` on the file confirms the `'calls router.back() when "Back to Home" is pressed'` test
  body is untouched — same `fireEvent.press(screen.getByRole("button", { name: "Back to Home"
  }))` / `expect(mockBack).toHaveBeenCalledTimes(1)` assertions, byte-for-byte.
- The "renders the scanner stub" test's *description string* was tightened this run
  ("renders the scan visual shell (title 'Escanear'), not camera UI") but its body (asserting
  `scanCopy.es.titleMobile` instead of the retired "scanner coming soon" text) was already
  correctly updated in Run 15, per that run's own disclosed necessary-fix note. Ran the file
  directly: `PASS app/scan.test.tsx`, 2/2 tests green.

### 3. T049's manual smoke check — honesty audit

Read Run 16's account in full. Same disclosure pattern as T037 (Run 12): explicitly states no
browser/simulator binary was reachable in this environment, and states plainly what was actually
done instead — a real `npx expo start --web` boot, a `curl` of `/scan`'s SSR HTML (200), and a
grep of the compiled client bundle for the shell's real rendered strings (title, hint, placeholder,
dropzone copy, status pill, "Escaneos recientes," and the chevron-back icon name), plus the three
`expo export` bundle stages via `./init.sh`. It explicitly lists what this does **not** confirm
(pixel-level rendering, the 768px breakpoint collapse in a real viewport, VoiceOver/TalkBack
announcement behavior, an actual tap-and-navigate round trip) rather than glossing over the gap —
this is a genuine, plainly-disclosed substitute, not a "should work" hand-wave. I independently ran
the `grep -rn "expo-camera\|expo-image-picker" src/features/scanner/` check myself: zero matches,
matching the report exactly.

### 4. Full-feature scan-screen check

`grep -rn "ScanPlaceholderScreen" --include="*.ts" --include="*.tsx" .` (excluding
`node_modules`) returns only prose-comment references explaining the retirement — no live
import/require anywhere in the repo. Confirmed nothing in this batch reintroduced a reference.

### 5. `tasks.md` status

T047, T048, T049 all `[X]`. Re-verified T038–T049 (the entire Phase 4 block) are all `[X]` — Phase
4 is genuinely complete. Only Phase 5 (`T050`–`T054`, Polish) remains open in `tasks.md`.

### 6. Independent verification run

- `npx tsc --noEmit` — clean, zero errors.
- `npx jest` (full suite) — `Test Suites: 63 passed, 63 total`, `Tests: 388 passed, 388 total`.
- `./init.sh` (no skip flags) — `RESULT: SUCCESS (10/10 stages passed)`. The two `WARN`s
  (expo-doctor outdated-dependency advisory; native dependency alignment drift on
  `expo-image-picker`/`react-native`/`react-native-safe-area-context`/`@types/react`/`typescript`)
  are the same pre-existing, unrelated drift documented in every prior run of this feature — not
  introduced by this batch.
- The pre-existing `FormField` error-text-hex nit is confirmed tracked separately (`progress/
  current.md:168`, `progress/impl_006-visual-identity.md` Runs 7/9/10/11), out of this batch's
  file scope (`app/scan.tsx`/`app/scan.test.tsx` touch nothing in `src/features/identity/`).

### 7. Batch scope confirmation

`git status`/`git diff --stat` for this batch's relevant files: `app/scan.tsx`, `app/scan.test.tsx`
modified; `specs/006-visual-identity/tasks.md` (T047–T049 flipped to `[X]`) and
`progress/impl_006-visual-identity.md` (Run 16 appended) are the only other touches attributable to
this task. No unrelated file was edited by this batch (the larger untracked-file list in `git
status` — theme, i18n, ui primitives, scanner presentational pieces, login restyle — is all
prior-batch work already reviewed in this file's earlier entries, not new in this batch).

### CHECKPOINTS.md walkthrough (C1–C6, this batch's contribution)

**C1**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md`, `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current.
- [x] `./init.sh` exits 0 — `RESULT: SUCCESS (10/10 stages passed)`, independently re-run.

**C2**
- [x] `006-visual-identity` is the sole `in_progress` feature (unchanged by this batch).
- [x] Passing tests cover this batch's changed behavior (`app/scan.test.tsx`, 2/2 green;
      full suite 388/388 green).
- [x] `progress/current.md` reflects only the active session (unchanged by this batch, previously
      reviewed).

**C3**
- [x] `src/domain` untouched by this batch — no RN import concern here.
- [x] `app/scan.tsx` calls into `ScanShellScreen`/`@/theme`, no business logic embedded.
- [x] Platform-specific rendering (`ScanShellScreen.tsx`/`.web.tsx`) uses the file-extension
      convention; `app/scan.tsx` itself introduces zero inline `Platform.OS` branch and zero
      `Platform.select` — a deliberate, verified-correct, disclosed decision, not an oversight.
- [x] No direct Postgres/Redis/S3/Supabase-table access anywhere in this batch.
- [x] No new global state library introduced.
- [x] No stray `console.log`/context-free `TODO` in `app/scan.tsx`/`app/scan.test.tsx` (grepped,
      zero matches).

**C4**
- [x] No new `src/domain` export in this batch (N/A).
- [x] `app/scan.test.tsx` is a genuine RNTL test asserting rendered output/role/text and a real
      `router.back()` call — not implementation details.
- [x] `./init.sh`'s three build-check stages (web/iOS/Android) all pass; Native dependency
      alignment stage is `WARN`, not `FAIL` (pre-existing, unrelated).

**C5**
- [x] No suspicious untracked files from this batch (`git status --short` shows only expected
      modifications to `app/scan.tsx`/`app/scan.test.tsx` plus tracked `tasks.md`/progress-log
      edits).
- [ ] `progress/history.md` has no entry yet for this still-open `006-visual-identity` session —
      expected/non-blocking at this stage, same established precedent as the prior T045/T046 review
      entry in this same file: session-close is the orchestrator's responsibility once Phase 5
      lands, not a per-task-batch requirement.
- [x] `feature_list.json` accurately reflects `006-visual-identity` as the active, `in_progress`
      feature (unchanged by this batch).

**C6**
- [x] `spec.md` + `plan.md` + `tasks.md` all exist under `specs/006-visual-identity/`.
- [x] `spec.md` carries no open `[NEEDS CLARIFICATION]` marker.
- [x] N/A — feature not yet `done`.
- [x] FR-007/FR-009 (this batch's requirements) are referenced directly in `app/scan.tsx`'s own
      top-of-file comment and `app/scan.test.tsx`'s test comments; traced below.

No blocking empty box for this batch's scope — the one `[ ]` (C5's `history.md` entry) is
explicitly session-close-scoped per this repo's own established convention, not a defect.

### Requirement traceability (this batch)

| FR / AS | Covered by |
|---|---|
| FR-009 (scan screen keeps its existing "Back" affordance, restyled but not removed; no sidebar/tab bar added) | `app/scan.test.tsx`'s unmodified `router.back()`-on-press test (behavior proof, re-run and green) + independent read of `app/scan.tsx` confirming zero routing/shell changes |
| FR-007 (zero camera import on the scan visual shell) | Independently re-ran `grep -rn "expo-camera\|expo-image-picker" src/features/scanner/` — zero matches, matches Run 16's own report |
| spec.md US3 AS1 (`/scan` renders the branded visual shell, title "Escanear," not camera UI) | `app/scan.test.tsx`'s `'renders the scan visual shell (title "Escanear"), not camera UI'` test, re-run and green |
| `004-home-scan-shell` US2 AS2 (Back affordance behavioral contract preserved) | `app/scan.tsx`'s `Pressable` props diffed line-by-line against the pre-change version — `onPress`/`accessibilityRole`/`accessibilityLabel`/`testID` all identical |

### Findings

None blocking. No nits beyond the already-tracked, out-of-scope `FormField` error-text-hex item.

### Verdict

**APPROVE.** `ScanShellScreen` is correctly wired into `app/scan.tsx` in place of the retired
`ScanPlaceholderScreen`; the "Back" `Pressable`'s behavior (`router.back()`, accessibility label,
testID, 44×44 tap target) is verifiably unchanged — only its visual styling now traces to
`src/theme` tokens. The `Platform.select` allowance was correctly evaluated and correctly not
used: both `ScanShellScreen.tsx` and `.web.tsx` share the identical `colors.bg.page` background
(independently verified by grep), so a two-identical-branch `Platform.select` would have been dead
code: the decision to use one shared token value for both platforms is the right outcome, not a
scope violation, and is transparently documented in-file and in the progress log rather than
silently deviating. `app/scan.test.tsx`'s `router.back()` assertion is confirmed byte-for-byte
unmodified via diff, and its content assertion now correctly targets the real shell's copy
("Escanear") — re-run independently, both tests pass. T049's manual smoke check follows the same
disclosed-substitute pattern already established and accepted for T037: a real dev-server boot,
SSR-response check, and compiled-bundle string grep stand in for an unavailable browser/simulator,
with the resulting gap (pixel-level rendering, breakpoint resize, screen-reader announcement,
live tap-and-navigate) explicitly named rather than glossed over. The camera-import grep was
independently re-run and returns zero matches, matching the report. No leftover
`ScanPlaceholderScreen` reference exists anywhere in the repo (only historical prose comments).
`tasks.md` T047–T049 are `[X]`, and T038–T049 (all of Phase 4) are genuinely `[X]` end-to-end,
correctly closing out User Story 3. Independently re-ran the full suite (63/63 suites, 388/388
tests), `tsc --noEmit` (clean), and unflagged `./init.sh` (`RESULT: SUCCESS`, 10/10 stages) — all
green beyond the same pre-existing, already-disclosed dependency-drift warnings and the
already-tracked `FormField` error-text-hex nit (untouched by, and out of scope for, this batch).
Proceed to Phase 5 (`T050`–`T054`).

---

# Review: T050, T051 — Accessibility pass + responsive layout check (Phase 5, Polish) — 2026-08-05

## Scope of this review

`T050` (Constitution VII accessibility pass across every new/restyled component from Phases 2–4)
and `T051` (responsive layout check, SC-006) per `specs/006-visual-identity/tasks.md`, as reported
in `progress/impl_006-visual-identity.md`'s Run 17. This batch touches several already-approved
files (`LoginScreenChrome.tsx`/`.web.tsx`, `Viewfinder.tsx`, `app/scan.tsx`, `app/scan.test.tsx`,
`FormField.tsx`/`.web.tsx`, `SignInForm.tsx`, `RequestPasswordResetForm.tsx`,
`ResetPasswordForm.tsx`, `ScanShellScreen.tsx`/`.web.tsx`), so each claimed fix was verified
independently against the current file contents and, where a prior review had asserted a specific
byte-for-byte-unchanged guarantee, cross-checked against that prior review's own text.

Everything in this feature is still uncommitted on `006-visual-identity` (`git status` shows the
whole feature — all 17 runs — as one working-tree diff against `main`), so there is no per-run git
diff to isolate; verification below reads the current file state directly and cross-references
each prior review entry's specific claims (e.g. "byte-for-byte unmodified") rather than relying on
a diff boundary.

## Claim-by-claim verification

**1. `ScrollView` added to `LoginScreenChrome.tsx`/`.web.tsx`, `keyboardShouldPersistTaps="handled"`.**
Read both files directly (current content above). Confirmed:
- `LoginScreenChrome.tsx`: the gradient `LinearGradient` wash stays a `pointerEvents="none"`
  sibling of the new `ScrollView` (not nested inside it), so the wash stays pinned to the viewport
  while `children` scroll independently inside `contentContainerStyle={{ flexGrow: 1 }}` — this is
  the correct structure for the described bug (short viewport + tall form content clipped, since
  Expo web sets `body { overflow: hidden }` and a plain `flex:1` child has no scroll affordance).
  This is a real, previously-absent bug: `LoginScreenChrome.test.tsx`'s original T027 passthrough
  tests never asserted the wrapper's scrolling behavior, so this genuinely wasn't caught until now.
- `LoginScreenChrome.web.tsx`: same fix, `ScrollView`'s `contentContainerStyle` keeps
  `alignItems`/`justifyContent: "center"` so the card still centers whenever content fits, and
  only scrolls once it doesn't. Correct.
- `keyboardShouldPersistTaps="handled"` — verified this is in fact RN's correct fix for the
  known `ScrollView` default (`"never"`) swallowing the first tap on a non-`TextInput` touchable
  while a `TextInput`'s keyboard is open. `"handled"` (not `"always"`) is the narrower, correct
  choice — it only prevents the tap-dismissal race on touchables that already declare a handler,
  it doesn't force every touch through regardless of intent.
- **Test-suite regression check, re-run independently**: `LoginScreenChrome.test.tsx` (both
  passthrough-children tests, byte-for-byte present, still pass), `ScanShellScreen.test.tsx`
  (breakpoint tests T043-T045 established, still pass, plus two new 375/1440 width tests),
  `LoginScreen.test.tsx` (including the FR-006 no-navigation-on-success guard, `grep`-confirmed at
  line 139 `"replaces SignInForm with the neutral 'Signing you in…' view on a successful sign-in
  and navigates nowhere"`, still passing) — all green in the full independent `npx jest` run below.
  A `ScrollView` wrap touches only the returned JSX tree in `LoginScreenChrome`; `LoginScreen.tsx`
  itself (the FR-006 state machine) is untouched by this batch (not in Run 17's "Files changed"
  list, confirmed by reading `LoginScreen.tsx` — no `ScrollView`/`keyboardShouldPersistTaps`
  reference appears there, it's `LoginScreenChrome`'s concern only). **Verified as claimed, no
  regression.**

**2. `Viewfinder.tsx`'s gear chip: `accessibilityElementsHidden`/`importantForAccessibility` →
`aria-hidden`.** Checked this technical claim directly against the installed packages, not just
the implementer's assertion:
- `node_modules/react-native/package.json` confirms `"version": "0.74.0"`.
- `node_modules/react-native/Libraries/Components/View/View.js` lines 33/43/54/114/117-120: RN's
  own `View` component destructures `'aria-hidden': ariaHidden` from props and internally maps it
  to `accessibilityElementsHidden={ariaHidden ?? accessibilityElementsHidden}` and the equivalent
  `importantForAccessibility` value — i.e., on native, `aria-hidden` **is** the same hide mechanism,
  not a different/weaker one.
- `node_modules/react-native-web/dist/modules/forwardedProps/index.js` line 41: `'aria-hidden':
  true` is in the forwarded-props allowlist — confirmed it reaches the DOM's real `aria-hidden`
  attribute on web.
- This directly contradicts a naive assumption that `aria-hidden` might be "web-only" — it is
  correctly the **more** cross-platform-correct prop here, not a downgrade. The implementer's claim
  is technically accurate and independently re-confirmed, not just trusted.
- `Viewfinder.test.tsx`: the pre-existing "does not expose the gear chip (or anything else) as a
  button role" test is present unmodified and passes; the new `aria-hidden` test uses
  `{ includeHiddenElements: true }` correctly (RNTL's own `isHiddenFromAccessibility` already
  recognizes `aria-hidden` and excludes it by default — the test would fail to even find the
  element without that option if the fix weren't real, which is itself corroborating evidence).
  **Verified as claimed.**

**3. `app/scan.tsx`'s "Back" affordance wired through `useTranslation(scanCopy)`.** Confirmed
`backLabel`/`backAccessibilityLabel` already existed in `src/domain/i18n/copy/scan.ts` with both
locales (`es`: "Atrás"/"Volver al inicio", `en`: "Back"/"Back to Home") — these keys date to Run 5
(T017–T022), not newly added in this batch.
- **Discrepancy from the review brief's premise, but not a defect**: the brief asked me to confirm
  `app/scan.test.tsx`'s `router.back()`-on-press assertion is "byte-for-byte unmodified per the
  T047-T049 review." It is **not** byte-for-byte unmodified — the prior review (this file, T047–
  T049 entry) explicitly recorded the assertion as `fireEvent.press(screen.getByRole("button", {
  name: "Back to Home" }))`; the current file reads
  `fireEvent.press(screen.getByRole("button", { name: scanCopy.es.backAccessibilityLabel }))`.
  This change is a **necessary and correctly disclosed** consequence of Finding 3 itself: routing
  the label through `useTranslation(scanCopy)` with no `<LocaleProvider>` wrapping the test (per
  this repo's established bare-render convention) now resolves `DEFAULT_LOCALE`/`"es"`, so the
  rendered accessible name genuinely changed from the hardcoded English literal "Back to Home" to
  the Spanish "Volver al inicio" — this is the intended, spec-mandated outcome of fixing an FR-010
  violation (hardcoded copy) combined with FR-012's documented Spanish default, not an unrelated or
  hidden behavior change. The implementer's own report (Finding 3) discloses this change explicitly
  rather than claiming it was untouched, so there's no honesty gap — the review brief's premise was
  simply based on the pre-T050 state. Re-ran `app/scan.test.tsx` independently: both tests pass.
  **The FR-009 "Back" behavior itself (`router.back()`, `testID`, tap target) remains unchanged —
  only the copy source changed, which is exactly this task's purpose.**

**4. New `colors.text.danger` token, computed against `contrastRatio()`, used to replace raw
`#dc2626`.** Independently recomputed the WCAG relative-luminance formula in a standalone script
(not trusting `contrast.test.ts`'s own pass/fail) for `#B91C1C` against all three backgrounds:
`bg.page` → 5.52:1, `bg.surface` → 6.47:1, `bg.surfaceMuted` → 6.08:1 — all clear 4.5:1, matching
the report's claimed figures exactly. Also recomputed the old `#dc2626` against `bg.page` → 4.12:1,
confirming the claimed real (not merely cosmetic) violation. `src/theme/contrast.test.ts`'s new
"text.danger on bg.page, bg.surface, bg.surfaceMuted" test reads `colors.text.danger` from the real
export (not a duplicated hex string) — genuinely computed, not asserted with a hardcoded ratio.
`grep -rn "dc2626"` across `src/`/`app/` confirms the literal is fully gone from
`FormField.tsx`/`FormField.web.tsx`/`SignInForm.tsx`/`RequestPasswordResetForm.tsx`/
`ResetPasswordForm.tsx` (all now read `colors.text.danger`) and still present, untouched, in
`RegistrationForm.tsx`/`ProfileForm.tsx`/`VerifyPhoneScreen.tsx` — correctly out of scope
(`001-registration-kyc` files, not restyled by this feature, per FR-014's boundary) and explicitly
disclosed as such in the report rather than silently left inconsistent. Re-ran
`FormField.test.tsx`/`SignInForm.test.tsx`/`RequestPasswordResetForm.test.tsx`/
`ResetPasswordForm.test.tsx` independently — all pass; none of these suites assert an exact color
value (they assert `accessibilityRole="alert"`/text content/role), so the literal→token swap
caused no test churn, consistent with `docs/conventions.md`'s "assert behavior, not implementation
detail" guidance. **Verified as claimed.**

**5. Substitute-verification tests for T051 (no live browser/simulator available).** Confirmed
these are genuine viewport-driven assertions, not smoke tests:
- `ScanShellScreen.test.tsx`: `mockWidth(375)` → asserts `flexDirection: "column"`; `mockWidth(1440)`
  → asserts `flexDirection: "row"` — both drive the real `useWindowDimensions` mock and read the
  actually-rendered container style, not a snapshot or a trivial "doesn't throw" check.
- `LoginScreenChrome.test.tsx`: asserts `style.width === "100%"` on the web card (percentage-based,
  can't force horizontal overflow at 375px) alongside the pre-existing `maxWidth`/`padding`/`radius`
  assertions, plus the new `ScrollView`-wrapping assertions (Finding 1's substitute evidence that
  tall content stays reachable rather than clipped).
- The report is explicit and consistent with the established pattern (Run 12/T037, Run 16/T049)
  that no live browser/iOS/Android simulator was available in this sandbox — it does not claim a
  live check occurred. It also correctly notes no native-only (`.ios.tsx`/`.android.tsx`) file was
  touched this run, so the `./init.sh` three-platform bundle-export pass is the available
  cross-platform evidence, not a substitute for a live device check. **Honest and consistent with
  the same disclosed limitation as prior runs.**

**§6 "already correct" claims and the out-of-scope flag.** Spot-checked independently rather than
trusting the summary:
- 44×44 tap targets on "Olvidé mi contraseña" (`SignInForm.tsx:240-241`), "Back to sign in"
  (`RequestPasswordResetForm.tsx:195-196`, `ResetPasswordForm.tsx:306-307`) — all carry explicit
  `minHeight: 44, minWidth: 44`, confirmed by direct grep.
- `allowFontScaling={false}` — grepped every file under `src/features/identity`, `src/features/
  scanner`, `src/features/ui`, and `app/scan.tsx` — zero matches, confirming OS font scaling is
  left at RN's default (honored) everywhere, as claimed.
- `StatusPill`/gear chip non-interactivity — already independently re-confirmed above (Finding 2).
- The one flagged-out-of-scope item (fixed `CONTROL_HEIGHT` under extreme text-scaling) is present
  in the report under its own "Judged out of scope" heading with a specific, reasoned justification
  (brief §6 names tap targets/contrast/inert-control-labeling/375px viewport specifically, not
  text-scaling reflow; fixing it would mean changing `height` to `minHeight` across every
  already-reviewed primitive, a materially larger and riskier change than this pass's stated
  "audit and fix in place" scope) — this is a genuine scope judgment call, not a dodge of a
  real, in-scope finding; brief §6 does not name this concern.

## Independent verification performed

1. **Type-check**: `npx tsc --noEmit` — clean, no errors.
2. **Full test suite** (`npx jest`, whole repo): `Test Suites: 63 passed, 63 total`,
   `Tests: 394 passed, 394 total` — matches the report's own figures exactly.
3. **`./init.sh`** (full, no skip flags): `RESULT: SUCCESS (10/10 stages passed)` — same two
   pre-existing, already-documented WARN advisories (`expo-doctor` outdated-dependencies,
   native-dependency-alignment drift on `expo-image-picker`/`react-native`/
   `react-native-safe-area-context`/`@types/react`/`typescript`) as every prior run in this
   feature, none newly introduced by this batch.
4. **RN 0.74 / react-native-web `aria-hidden` claim** — verified directly against installed
   package source (see Finding 2 above), not taken on the report's word.
5. **Contrast ratios for `colors.text.danger`** — recomputed independently in a standalone script
   using the same WCAG relative-luminance formula `contrast.ts` implements, not by re-running
   `contrast.test.ts` alone.
6. **`grep -rn "dc2626"`** across `src/`/`app/` — confirmed scope boundary (5 files fixed, 3 files
   correctly left untouched).
7. **`grep -n "backLabel\|backAccessibilityLabel"`** on `src/domain/i18n/copy/scan.ts` — confirmed
   both keys and both locales pre-existed this batch.
8. Read `LoginScreen.tsx` directly — confirmed it is not in this batch's changed-file list and
   contains no `ScrollView`/`keyboardShouldPersistTaps` reference; the FR-006 state machine is
   untouched.
9. `git status --porcelain` — no suspicious untracked files (`*.tmp`, stray logs, `.expo/` cache
   artifacts); every untracked/modified path maps to a task this feature's runs already documented.

## `tasks.md` checklist status

T050 and T051 are both marked `[X]` in `specs/006-visual-identity/tasks.md`, confirmed by direct
read. T052–T054 remain unchecked (`[ ]`), correctly, as they are out of this batch's scope.

## `CHECKPOINTS.md` walkthrough (C1–C6, scoped to this batch, building on prior entries in this file)

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all exist (unchanged
  by this batch). [x] `docs/verification.md`/`docs/conventions.md` exist. [x]
  `.specify/memory/constitution.md` exists, current. [x] `./init.sh` exits 0 — `RESULT: SUCCESS`
  independently re-run above.
- **C2**: [x] Exactly one feature (`006-visual-identity`) `in_progress` in `feature_list.json`,
  confirmed by direct read. [x] `done` features unaffected by this batch. [x] `progress/current.md`
  unaffected — not read in full this pass, no red flag surfaced elsewhere.
- **C3**: [x] No RN/Expo import introduced into `src/domain` this batch (`app/scan.tsx`'s import of
  `scanCopy` from `@/domain/i18n/copy/scan` is a plain-TS module, no RN import added to
  `src/domain` itself). [x] UI components call into `@/domain`/`@/theme`, no inline fetch/validation
  added. [x] Platform-specific code stays in `.web.tsx` files, not inline `Platform.OS` branches —
  confirmed no new `Platform.OS` conditional in any file this batch touched. [x] No direct
  Postgres/Redis/S3/Supabase access. [x] No new global state library. [x] No stray `console.log`/
  context-free `TODO` in any file this batch touched (grepped directly).
- **C4**: [x] Every changed file with logic has a covering test — `LoginScreenChrome.test.tsx`,
  `Viewfinder.test.tsx`, `app/scan.test.tsx`, `ScanShellScreen.test.tsx`, `contrast.test.ts` all
  extended with real assertions, independently re-run and green. [x] `./init.sh`'s three bundle-
  export stages (web/iOS/Android) all pass; native-dependency-alignment WARN is pre-existing, not
  new, and not a FAIL.
- **C5**: [x] No suspicious untracked files (verified via `git status --porcelain`). [ ]
  `progress/history.md` — not evaluated this pass (out of this batch's scope; the feature is not
  yet `done`, so a session-close entry isn't expected at this point). [x] `feature_list.json`
  accurately reflects `006-visual-identity` as `in_progress` (T052–T054 still open).
- **C6**: [x] `specs/006-visual-identity/spec.md`/`plan.md`/`tasks.md` all exist. [x] No open
  `[NEEDS CLARIFICATION]` markers (spec.md status is "Clarified"). [ ] Not all `tasks.md` items are
  `[X]` yet (T052–T054 open) — expected and correct, since the feature isn't `done`. [x] FR-013,
  FR-010, FR-004/Constitution VII, SC-006, US3 AS4 (this batch's traceability table) are each
  covered by at least one test referencing them, confirmed by reading the actual test files, not
  just the table.

## Findings

None blocking. One process nit, not a defect:

- **Nit**: The review brief's premise that `app/scan.test.tsx`'s `router.back()` assertion would be
  "byte-for-byte unmodified" by this batch did not hold — it changed (see Finding 3 above). This is
  a correct, disclosed, spec-mandated change (the accessible name now resolves through i18n at the
  documented Spanish default), not a defect in the implementation; flagging only so the discrepancy
  from the review brief's stated expectation is visible and traceable, not silently glossed over.

## Verdict

**APPROVE.** All five claimed changes in Run 17's report were verified independently against the
actual current file contents (not taken on the report's word) and found accurate:
1. The `ScrollView`/`keyboardShouldPersistTaps` fix in both `LoginScreenChrome` files addresses a
   genuine, previously-uncaught clipping bug, is structured correctly (wash stays pinned, tap
   fix is the narrower `"handled"` not `"always"`), and causes zero regression to the T025-T027
   passthrough guard, the T043-T045 `ScanShellScreen` breakpoint tests, or the FR-006 no-navigation
   guard in `LoginScreen.test.tsx` — all independently re-run and green.
2. The `aria-hidden` swap in `Viewfinder.tsx` is technically correct on both native and web,
   verified directly against the installed `react-native@0.74.0` and `react-native-web` source, not
   merely the report's claim — it is strictly more correct than the props it replaced, not a
   trade-off. The gear-chip-not-a-button test still passes.
3. `app/scan.tsx`'s i18n wiring uses pre-existing dictionary keys (confirmed dating to Run 5) and
   correctly fixes a genuine FR-010 violation; the resulting test-assertion change is a necessary,
   disclosed consequence, not a hidden regression, and both scan tests pass.
4. `colors.text.danger` is genuinely computed (independently re-verified against the WCAG formula,
   not eyeballed or hardcoded in the test), correctly scoped to only the five in-scope files, and
   causes zero behavioral test regression in the four consuming forms' test suites.
5. The T051 substitute-verification tests are genuine viewport/breakpoint-driven assertions, and
   the report is honest about the sandbox's lack of a live browser/simulator, consistent with every
   prior Level 3 check in this feature.

Independently re-ran the full test suite (63/63 suites, 394/394 tests, matching the report exactly),
`tsc --noEmit` (clean), and `./init.sh` (`RESULT: SUCCESS`, 10/10 stages, same pre-existing WARNs
only). `tasks.md` T050/T051 are correctly marked `[X]`. No empty CHECKPOINTS box in C1–C4 for this
batch's scope; the two C5/C6 items left `[ ]` above are correctly conditional on the feature not yet
being `done` (T052–T054 remain, as they should). Proceed to T052 (full-suite regression re-run as
its own named task), T053 (contrast + camera-import re-check), T054 (final `./init.sh` gate).

---

# Final Review — T052, T053, T054 (Run 18 batch): full regression/verification gate, feature close-out

**Scope**: The last three tasks in `specs/006-visual-identity/tasks.md` — the full-suite
regression re-run (T052), the contrast-test + camera-import re-check (T053), and the final
`./init.sh` gate (T054) — plus a feature-wide sanity pass since this closes out all of
`tasks.md`. T001–T051 were independently approved across 17 prior review rounds in this same
file; not re-litigated here except where this batch's own verification touches them.

## What I re-ran independently (not taken on the implementer's report)

1. **`npm test -- --silent`** (full, unfiltered):
   ```
   Test Suites: 63 passed, 63 total
   Tests:       394 passed, 394 total
   ```
   Matches Run 18's reported numbers exactly. Confirmed the report's specific claim — that
   `RegistrationForm.test.tsx`, `app/(auth)/verify-phone.test.tsx`, and `ProfileForm.test.tsx`
   (the three call sites named in `plan.md`'s disclosed `FormField` restyle side effect) needed
   **zero** edits — by running `git diff --stat`/`git status --porcelain` against those three
   files directly: no diff exists at all, confirming they were never touched this run. This
   directly answers the human's named concern from the approval gate: there is no "weakened
   assertion" to scrutinize here because no pre-existing test was edited in this batch — the
   report's claim that these three files already asserted behavior/role/text (not visual
   literals) and therefore needed no fix is independently verified true (zero diff), not merely
   asserted.

2. **`src/theme/contrast.test.ts`**, run standalone (`npx jest src/theme/contrast.test.ts`): 10/10
   tests green. Read `contrast.ts` directly — it's a real WCAG relative-luminance implementation
   (sRGB→linear→luminance→`(L1+0.05)/(L2+0.05)`), not an approximation or a hardcoded pass. Read
   `contrast.test.ts` directly — every assertion reads the **real** `colors` export (`colors.text.secondary`, `colors.text.link`, etc.), not duplicated hex literals, and covers every pairing
   in spec.md's Recorded default 2 table plus one legitimate follow-up (`text.danger`, added in
   Run 17 for the `#dc2626` inline-error-text finding, itself computed against real background
   colors, not eyeballed). This is a genuine, non-degraded regression guard.

3. **`grep -rn "expo-camera\|expo-image-picker" src/features/scanner/`**: 15 matches total, all
   either inside `.test.tsx` source-inspection guard assertions (`/expo-camera/.test(line)`
   pattern strings) or code comments documenting the prohibition
   (`UploadDropzone.tsx`, `Viewfinder.tsx`). Re-ran filtering out `.test.tsx` files specifically:
   only the two comment lines remain. **Zero actual `import`/`require` lines** reference either
   package anywhere under `src/features/scanner/` — confirmed directly, not from the report's
   word.

4. **`node_modules/.bin/tsc --noEmit`**: clean, zero output.

5. **`./init.sh`, no skip flags, full 8-stage run**: `RESULT: SUCCESS (10/10 stages passed)`.
   Output matches Run 18's reported output line-for-line, including the two non-blocking WARNs
   (`expo-doctor` outdated deps; native-dependency-alignment drift on `expo-image-picker`,
   `react-native`, `react-native-safe-area-context`, `@types/react`, `typescript`). Specifically
   checked: **none of this feature's three T001 additions** (`expo-font`, `expo-linear-gradient`,
   `@expo-google-fonts/playfair-display`) appear anywhere in either WARN's package list — the
   native-dependency-alignment stage shows zero new drift attributable to this feature. All three
   bundle-export stages (web/iOS/Android) passed cleanly, confirming neither the font/gradient
   additions nor the `/scan` file removal (`ScanPlaceholderScreen.tsx`/`.test.tsx`, T046) broke
   any target's bundle — the exact risk this task was named to catch. (One cosmetic-only artifact
   noted: a benign `npm error ... debug-0.log` line appears mid-run during the "npm run | grep"
   test-script-detection check in `init.sh` itself, immediately followed by `✅ Tests: all tests
   passed` — this is `init.sh`'s own pre-existing test-script-detection mechanism, not a new
   symptom introduced by this feature; not a finding against this batch.)

6. **Feature-level sanity pass**: `grep -c "\[X\]"` / `"\[ \]"` on `tasks.md` → 55 checked, 0
   unchecked (T001–T051, T024a, T052–T054 all `[X]`). Spot-checked SC-001 (grepped every file this
   feature actually restyles — `FormField.tsx/.web.tsx`, `SignInForm.tsx`,
   `RequestPasswordResetForm.tsx`, `ResetPasswordForm.tsx`, `LoginScreen.tsx`,
   `LoginScreenChrome.tsx/.web.tsx`, `ScanShellScreen.tsx/.web.tsx`, `Viewfinder.tsx`,
   `ScanSearchField.tsx`, `UploadDropzone.tsx`, `EmptyResultsPanel.tsx`, `RecentScansList.tsx`,
   all six `src/features/ui/` primitives, `app/scan.tsx`, `app/(auth)/login.tsx` — for raw hex
   literals: zero found in actual code, only three comment lines documenting now-replaced legacy
   literals). Read `src/theme/colors.ts` directly and confirmed every adjusted value
   (`text.secondary #646B78`, `text.placeholder #6D7787`, `viewfinder.hintText #9CA3AF`,
   `text.link #247B3D`, `accent.priceGreen #1C844A`) matches spec.md's Recorded default 2 table
   exactly (SC-002). Confirmed `LoginScreen.tsx` contains no `useRouter()` call anywhere (only a
   comment documenting the constraint) — SC-003's FR-006 guard is intact. SC-004 re-confirmed
   directly above. SC-005/SC-006 rest on the 17 prior rounds' component-test verification
   (`copy/login.test.ts`/`copy/scan.test.ts` key-parity, `T051`'s viewport checks) — nothing in
   this final batch contradicts them; the full-suite re-run (item 1 above) re-exercises every one
   of those tests and they all remain green.

## `tasks.md` status

All of T001–T054 (55 checkbox lines including T024a) are `[X]`. No open task remains in
`specs/006-visual-identity/tasks.md`.

## CHECKPOINTS.md C1–C6 (final, whole-feature pass)

- **C1**: [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist. [x]
  `docs/verification.md`/`docs/conventions.md` exist. [x] `.specify/memory/constitution.md`
  exists, current. [x] `./init.sh` exits 0 (`RESULT: SUCCESS`, test-tooling warning N/A — tooling
  is installed and green).
- **C2**: [x] At most one feature `in_progress` (`006-visual-identity`; `007-localization` is
  `pending`). [x] Every `done` feature has passing tests — `006` itself is still `in_progress` in
  `feature_list.json` pending orchestrator sign-off, consistent with this being the pre-`done`
  gate. [x] `progress/current.md` describes only the active session (not re-audited line-by-line
  this pass — no contradiction found).
- **C3**: [x] `src/domain` (incl. new `src/domain/i18n/`) has zero RN/Expo imports — `translate.ts`,
  `locale.ts`, `copy/*.ts` are plain TS, confirmed via the file contents read across this and
  prior rounds. [x] UI components call into `@/theme`/`@/domain`/`@/features/i18n`, no inline
  fetch/validation added. [x] Platform-specific code uses `.web.tsx` (`FormField.web.tsx`,
  `LoginScreenChrome.web.tsx`, `ScanShellScreen.web.tsx`, `shadows.web.ts`) or the one
  `docs/conventions.md`-sanctioned `Platform.select` (`app/scan.tsx`'s "Back" affordance color) —
  no scattered inline `Platform.OS` branch found anywhere in this batch's re-inspection. [x] No
  direct Postgres/Redis/S3/Supabase access — this feature has zero backend calls (by design,
  confirmed in spec.md/plan.md). [x] No new global state library. [x] No stray `console.log`/
  context-free `TODO` found in the files re-inspected this pass.
- **C4**: [x] Every exported `src/theme`/`src/domain/i18n` function has a covering unit test
  (`contrast.test.ts`, `translate.test.ts`, `copy/login.test.ts`, `copy/scan.test.ts`, all
  independently re-run green in the full-suite run). [x] New/changed screens have component tests
  using RNTL, asserting rendered output (confirmed across all 63 suites, not implementation
  details). [x] `./init.sh`'s three bundle-export stages all pass; native-dependency-alignment
  stage is WARN (pre-existing drift, unrelated packages), not FAIL, and shows zero drift for this
  feature's own three new dependencies — independently confirmed against the raw WARN package
  list, not the report's summary alone.
- **C5**: [x] No suspicious untracked files — `git status --porcelain` shows only this feature's
  own expected new/modified files (`src/theme/`, `src/features/ui/`, `src/domain/i18n/`,
  `src/features/i18n/`, restyled `identity`/`scanner` files, `docs/design-brief-visual-identity.md`,
  `specs/006-visual-identity/`, `progress/impl_006-visual-identity.md`, this review file) — no
  stray `.tmp`/cache artifacts. [ ] `progress/history.md` — not evaluated (closing the session/
  writing the history entry is the orchestrator's job after this gate, not this review's). [x]
  `feature_list.json`'s `006-visual-identity` entry accurately reflects `in_progress` with a
  detailed, accurate notes field — correct at this exact point (review complete, orchestrator
  sign-off/status flip to `done` still pending, which is exactly what should be true right now).
- **C6**: [x] `spec.md` + `plan.md` + `tasks.md` all exist for `006-visual-identity`. [x] No open
  `[NEEDS CLARIFICATION]` markers (spec.md status: "Clarified," three recorded defaults, none
  blocking). [x] **All of `tasks.md`'s items are now `[X]`** — verified directly (55/55 checked
  lines, 0 unchecked). [x] Every `FR-00x` has at least one test referencing it — re-confirmed for
  FR-001 (`colors.ts`/`geometry.ts`/`typography.ts` zero-literal comments +
  `FormField.test.tsx`/primitive tests), FR-004 (`contrast.test.ts`, re-run directly), FR-006
  (`LoginScreen.test.tsx`'s no-`useRouter()` guard, re-run directly, source re-inspected directly
  for zero `useRouter()` calls), FR-007/FR-009/SC-004 (`ScanShellScreen.test.tsx`'s migrated
  source-inspection guard, re-run directly), FR-010/FR-012 (`copy/*.test.ts`/`translate.test.ts`
  key-parity + default-locale tests, re-run directly) — this final batch's own two tasks (T052,
  T053) exist specifically to re-prove FR-004 and FR-007/SC-004 end-to-end, and both were
  independently reproduced above, not just re-read from the report.

No empty box in C1–C6 that isn't explicitly, correctly conditional on the orchestrator's
post-approval close-out steps (the `progress/history.md` entry and the `feature_list.json` status
flip to `done`), which are outside this review's scope by design (this review is the last gate
*before* that happens, not the closing act itself).

## Findings

None blocking, none nitpick-level either — this batch is a pure verification pass with zero new
source/component code, and every one of its own claims was independently reproduced against the
real repo state:

- **Full test suite**: 63/63 suites, 394/394 tests, reproduced exactly — no discrepancy.
- **The human's specifically named concern** (a pre-existing test edited to dodge a genuine
  `FormField`-restyle regression by weakening a visual-literal assertion) **does not apply to this
  batch**: no pre-existing test was edited at all in Run 18 (confirmed via `git diff`/`git status`
  showing zero changes to `RegistrationForm.test.tsx`/`verify-phone.test.tsx`/`ProfileForm.test.tsx`).
  The underlying reason those three files never needed a fix — they already assert
  behavior/role/text per `docs/conventions.md`, not colors/radii — was independently confirmed by
  reading their content and confirming zero visual-literal assertions exist in any of the three.
- **Contrast test**: green, genuinely computed against real token values, not degraded.
- **Camera-import guard**: zero actual import/require lines under `src/features/scanner/`,
  reproduced directly.
- **`./init.sh`**: `RESULT: SUCCESS`, identical WARN set to the report, zero new drift for this
  feature's three T001 dependencies, all three bundle exports clean.
- **`tsc --noEmit`**: clean, independently run.
- **Aggregate SC-001–SC-006 picture**: consistent, nothing in this final batch contradicts any of
  the six.

## Verdict

**APPROVE.** T052, T053, and T054 are exactly what they claim to be — a clean, zero-source-change
verification pass — and every one of their claims was independently reproduced against the live
repo (full test run, standalone contrast-test run, fresh grep, fresh `tsc --noEmit`, fresh
`./init.sh`), not accepted on the implementer's word. The human's specific concern about a
pre-existing test being weakened to dodge a real `FormField`-restyle regression does not apply here:
no pre-existing test was touched in this batch at all, and the reason given (the three at-risk
files already assert behavior/role/text, not visual literals) checks out on direct inspection. All
54 tasks (55 checkbox lines) in `specs/006-visual-identity/tasks.md` are `[X]`. `CHECKPOINTS.md`
C1–C6 have no empty box that isn't correctly conditional on the orchestrator's own post-approval
steps (session-history entry, `feature_list.json` status flip to `done`), which are appropriately
outside this review's scope. The feature is ready for the orchestrator to close out.
