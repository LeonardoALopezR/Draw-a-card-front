# Implementation Plan: Home Visual Alignment (Inicio restyle)

**Branch**: `012-home-visual-alignment` | **Date**: 2026-08-07 | **Spec**:
`specs/012-home-visual-alignment/spec.md`

**Input**: Feature specification from `specs/012-home-visual-alignment/spec.md`

**Note**: Like `004-home-scan-shell`, `005-login`, `006-visual-identity`, and
`010-registration-redesign`, this folds Phase 0 (research) and Phase 1 (data model/contracts/
quickstart) into this single file rather than separate `research.md`/`data-model.md`/
`contracts/`/`quickstart.md` documents — this feature has no backend-facing contract at all (pure
client-side restyle of two existing files), so a full `contracts/` directory would hold nothing.

## Summary

Restyle `src/features/scanner/ScanEntryCard.tsx` from its pre-`006-visual-identity` hardcoded-hex,
flat-outline look to the app's "soft surface + lime badge" visual language (`colors.bg.surface`
fill, `radius.card`, `shadowSurface`, a 1px dashed `colors.border.dashed` outline, a circular
`colors.brand.primary` "+" badge), and remove `src/features/navigation/HomeScreen.tsx`'s
duplicated `BrandMark`/tagline block (already rendered once, shell-wide, by `ShellHeader`),
re-centering the remaining single "Inicio" heading and the card as one balanced group. Zero new
runtime dependency, zero backend call, zero change to `ScanEntryCard`'s aspect ratio or
`HomeScreen`'s navigation logic. Two small, targeted files (plus their copy/test files) — no new
shared primitive, no new token category beyond one new `contrast.test.ts` regression case.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node 20 (per `.nvmrc`) — unchanged.

**Primary Dependencies (new)**: none. Every token/primitive this feature needs already exists
(`src/theme/colors.ts`, `geometry.ts`, `shadows.ts`/`shadows.web.ts`, `index.ts`'s barrel export)
shipped by `006-visual-identity`.

**Primary Dependencies (existing, reused)**: `@testing-library/react-native` (test rendering,
already installed); `src/domain/i18n/copy/home.ts` + `useTranslation` (`src/features/i18n/
LocaleContext.tsx`, already installed by `006-visual-identity`); `src/domain/navigation.ts`'s
`NAV_DESTINATIONS` (unchanged, only read).

**Storage**: N/A — no persisted or transient data entity (spec.md Key Entities: none).

**Testing**: Jest + `jest-expo` + `@testing-library/react-native` (already installed) — no new
tooling task needed. `docs/verification.md` Levels 1–4 apply as normal. This feature adds exactly
one new Level-1 assertion: a `contrast.test.ts` case for `colors.text.primary` on `colors.bg.
surface` (the card label pairing) — the badge's "+" glyph reuses the *already-tested*
`brand.onPrimary`-on-`brand.primary` pairing (`006-visual-identity`'s existing `contrast.test.ts`
case), so no second new case is needed for it.

**Target Platform**: iOS, Android, and web (`react-native-web`) from the one Expo codebase
(Constitution I). The only platform-specific representation this feature touches is the shadow —
already split as `src/theme/shadows.ts` (native) / `shadows.web.ts` (web), consumed via the
existing barrel export (`src/theme/index.ts`) exactly as `PrimaryButton.tsx`/`BrandMark.tsx`
already do. No new platform-suffixed file is created.

**Project Type**: Single Expo (React Native) app — two existing files restyled in place
(`src/features/scanner/ScanEntryCard.tsx`, `src/features/navigation/HomeScreen.tsx`), their two
test files updated deliberately, and one copy file (`src/domain/i18n/copy/home.ts`) trimmed of a
now-dead key.

**Performance Goals**: No numeric latency target — this is a pure styling/JSX change with no new
async work, no new render pass beyond what already exists.

**Constraints**:
- `ScanEntryCard`'s 2.5:3.5 aspect ratio and its `onPress`/`label` prop contract MUST NOT change
  (spec.md FR-005; `HomeScreen.tsx`'s call site is unaffected).
- `HomeScreen.tsx`'s navigation logic (the `NAV_DESTINATIONS` "escanear" lookup + `router.push`)
  MUST NOT change — only the returned JSX/styles (spec.md FR-012).
- No raw hex literal may remain in `ScanEntryCard.tsx` (spec.md FR-004, `006-visual-identity`
  FR-001 still binding).
- No new `Platform.OS` branch — the shadow's platform difference stays expressed via the existing
  `.ts`/`.web.ts` file-extension split (spec.md FR-011).
- `es`/`en` key parity in `src/domain/i18n/copy/home.ts` MUST be preserved after removing the now-
  dead `tagline` key (spec.md FR-008).

**Scale/Scope**: 2 user stories (card restyle, brand-block removal); 0 new runtime dependencies;
0 new files beyond test-file updates; 2 existing component files restyled in place; 1 existing
copy file trimmed; 1 new `contrast.test.ts` assertion.

## Constitution Check

*GATE: Must pass before task breakdown. Re-checked after Phase 1 design below.*

| Principle | Check | Status |
|---|---|---|
| I. One Codebase, Three Targets | One `ScanEntryCard`, one `HomeScreen`; the one platform difference (shadow) is expressed via the existing `.ts`/`.web.ts` file-extension convention, never a new per-platform component. | PASS |
| II. Backend Is the Source of Truth | Zero backend calls — pure client-side restyle. No exception to justify. | PASS (N/A) |
| III. Auth Goes Through the Provider SDK | Untouched — this feature calls no auth SDK method at all. | PASS (N/A) |
| IV. Business Logic Stays Portable | `ScanEntryCard`'s `onPress`/`label` prop contract and `HomeScreen`'s `NAV_DESTINATIONS`-lookup navigation logic are both unchanged — this feature edits only the returned JSX/`StyleSheet` bodies. No new business logic is introduced anywhere. | PASS |
| V. Screen/Component Structure Mirrors Product Domains | No new module — both edited files already live in their correct domain (`scanner`, `navigation`). | PASS (N/A) |
| VI. Spec Before Code, One Spec Per Feature | Single `spec.md`, platform notes inline per user story. | PASS |
| VII. Accessible and Responsive by Default | The one new text-on-background pairing (label on `bg.surface`) is computed and regression-tested, not eyeballed; the badge's "+" glyph reuses an already-tested pairing; the card's existing 44×44 tap-target floor and aspect ratio are preserved verbatim; the dead-gap fix is verified live at both a mobile-width and desktop-width web viewport (spec.md FR-009/SC-005), not assumed from static reasoning. | PASS |
| VIII. Local-First Development | Fully developable/testable via `expo start --web` with no backend running — this feature has no backend dependency of any kind. Visual verification of the gated Inicio route needs the temporary, non-committed `BYPASS_GATE` workaround documented in spec.md's Edge Cases (an existing sandbox limitation, not something this feature's shipped code depends on). | PASS |

No violations requiring a Complexity Tracking entry.

## Research Decisions

### Card badge/label composition — "+"-only badge, label lives on the surface, both reuse already-tested contrast pairings

- **Decision**: `ScanEntryCard.tsx` renders a circular `View` (diameter `CONTROL_HEIGHT`, i.e. 56 —
  reusing the existing shared control-height token rather than inventing a new magic number,
  `radius.pill` corner radius, `colors.brand.primary` fill) containing only the "+" `Text`, colored
  `colors.brand.onPrimary`. The optional `label` `Text`, when provided, renders as a sibling
  *outside* the badge, directly on the card's `colors.bg.surface` fill, colored `colors.text.
  primary`. The outer card `Pressable` gets `colors.bg.surface` fill, `radius.card`, a 1px dashed
  `colors.border.dashed` border, and `shadowSurface` applied as a trailing array entry in its
  `style` prop (`style={[styles.card, shadowSurface]}`) — the exact pattern `PrimaryButton.tsx`
  already uses for `shadowRaised`, not a spread inside `StyleSheet.create` (which would defeat
  Metro's per-platform resolution of the imported `shadowSurface` value).
- **Rationale**: Satisfies the hard constraint that "the lime badge must NOT carry text or be
  relied on as a contrast-bearing element" (kickoff notes; `colors.brand.primary` on `colors.bg.
  surface` measures ~1.29:1, computed) by construction — the badge only ever carries the one glyph
  it was already designed and tested for (`006-visual-identity`'s existing `contrast.test.ts` case,
  "brand.onPrimary on brand.primary," 12.11:1), and the label's new pairing (`text.primary` on
  `bg.surface`) computes to 15.67:1 — comfortably clears 4.5:1, added as one new regression case
  rather than assumed. Reusing `CONTROL_HEIGHT` (56) for the badge diameter avoids introducing yet
  another one-off numeric literal for something this app already has a shared token for.
- **Alternatives considered**: Rendering the label as a caption *underneath* a larger, label-
  carrying badge (i.e., keeping the "+" and label vertically stacked but both inside one colored
  container) — rejected, because a container that's `colors.brand.primary`-filled edge-to-edge
  behind the label text would make the label itself sit on the ~1.29:1 pairing the kickoff notes
  explicitly forbid. Keeping the badge small and circular, with the label on the surface instead,
  is the only shape that satisfies "badge must not carry text" while still visually reading as one
  composed card.

### HomeScreen re-layout — one centered group, not two separately-positioned blocks

- **Decision**: `HomeScreen.tsx`'s `brandBlock` `View` (and the `BrandMark`/tagline it contained)
  is deleted outright. The remaining heading `Text` (`accessibilityRole="header"`, `homeCopy.
  title`) and the existing `home-screen-centre` `View` (still wrapping `ScanEntryCard` alone, so
  `HomeScreen.test.tsx`'s existing `within(screen.getByTestId("home-screen-centre"))` queries need
  no change) both become children of one new, single centering container
  (`flex: 1, alignItems: "center", justifyContent: "center", gap: space.xxl`) inside the
  `ScrollView`'s content, replacing the prior split (`brandBlock` top-anchored with `paddingTop:
  space.xxl`, `centre` separately `flex: 1`-centered below it). The heading keeps `typography.
  display.xl` initially (the token it already uses today); the task-implementer's live-verification
  pass (T0xx below) MUST confirm this reads correctly alone (without the 72px `BrandMark` beside
  it it was originally sized against) at both a mobile-width and a desktop-width viewport, and MAY
  step it down to `typography.display.lg` if `display.xl` alone reads oversized — this is an
  explicitly allowed implementation-time adjustment per spec.md's Edge Cases (the exact spacing/
  sizing mechanism is deliberately not spec-mandated, only the "no dead gap, one balanced group"
  outcome is).
- **Rationale**: The dead vertical gap spec.md's Edge Cases describes is a direct consequence of
  the current two-block structure (a top-pinned block plus a separately flex-centered block below
  it) — collapsing both into one flex-centered group is the minimal structural change that
  addresses it, without needing a new layout primitive or a numeric height guess. Keeping `home-
  screen-centre`'s existing meaning (wraps the card only) minimizes the test diff to exactly what
  spec.md FR-014 requires (retiring `home-screen-brand-block`, nothing else).
- **Alternatives considered**: Keeping two separate blocks but shrinking the top block's
  `paddingTop` — rejected, treats a symptom (the numeric gap) rather than the actual structural
  cause (two independently-positioned regions), and would need to be re-tuned by feel rather than
  fixed by removing the redundant grouping.

### `home.ts`'s dead `tagline` key — removed, not left unreferenced

- **Decision**: `src/domain/i18n/copy/home.ts`'s `tagline` key is deleted from both the `es` and
  `en` dictionaries in the same change that removes its only call site (`HomeScreen.tsx`'s
  `t("tagline")`). `home.test.ts`'s existing `Object.keys(homeCopy.es).sort()` / `Object.keys
  (homeCopy.en).sort()` parity check requires no code change — it will simply compare the smaller,
  still-matched key sets.
- **Rationale**: Leaving an unreferenced translation key in a shared copy dictionary is exactly
  the kind of drift-prone dead code `docs/conventions.md`'s consistency principle warns against,
  and there is no future call site planned for it (`ShellHeader`'s own tagline, `sidebarTagline`/
  the login screen's `tagline`, are separate, already-used keys in different dictionaries entirely
  — not affected).
- **Alternatives considered**: Leaving `tagline` in place, unreferenced, in case a future feature
  wants it back — rejected; it costs nothing to re-add a key later if genuinely needed, and
  `007-localization`/future maintainers should not have to guess whether an unreferenced key is
  intentional scaffolding or forgotten cleanup.

### Stale doc comment inside `ScanEntryCard.tsx` — corrected, not left inaccurate

- **Decision**: The comment above `ScanEntryCardProps.label` claiming the prop "must stay
  optional so no other/future caller is disturbed" (written when the prop was first added,
  `008-scan-experience`) is updated to state plainly that `HomeScreen.tsx` is confirmed (grepped,
  2026-08-07) as the sole caller today, and that the prop remains optional simply because it always
  has been, not because a second caller currently depends on that shape.
- **Rationale**: The original comment's stated reason no longer describes reality once re-verified
  — leaving inaccurate reasoning in a doc comment is worse than removing it, per this repo's own
  established practice of correcting stale comments encountered mid-task rather than propagating
  them (see `006-visual-identity`'s own several "comment no longer describes reality" fixes).
- **Alternatives considered**: Leaving the comment untouched since it's not strictly wrong (the
  prop genuinely is still optional) — rejected; its *reasoning* ("so no other/future caller is
  disturbed," implying an unverified assumption) is exactly what this task re-verifies and can now
  state as a confirmed fact instead.

## Project Structure

### Documentation (this feature)

```text
specs/012-home-visual-alignment/
├── spec.md                 # Feature spec — two settled kickoff decisions, no open
│                            # [NEEDS CLARIFICATION] markers, no recorded-default table needed
├── plan.md                 # This file — includes research decisions inline
├── tasks.md                # Phase 2 output (/speckit-tasks)
└── checklists/
    └── requirements.md     # Spec quality checklist
```

No separate `research.md`, `data-model.md`, `contracts/`, or `quickstart.md` — see the note at
the top of this file.

### Source Code (repository root)

```text
src/theme/
├── colors.ts                          # UNCHANGED — no new token value needed; every color this
│                                       # feature uses already exists
└── contrast.test.ts                   # MODIFIED — + one new case: text.primary on bg.surface
                                        # (the card label pairing, FR-010)

src/features/scanner/
├── ScanEntryCard.tsx                  # MODIFIED — restyled per Research Decisions above; the
│                                       # stale label-prop doc comment corrected; zero raw hex
│                                       # literal remains
└── ScanEntryCard.test.tsx             # MODIFIED — existing assertions kept passing unmodified;
                                        # new assertions added for the surface fill/radius/border/
                                        # shadow/badge fill (US1 AS1–AS5)

src/features/navigation/
├── HomeScreen.tsx                     # MODIFIED — BrandMark/tagline block removed; heading +
│                                       # card re-centered as one group (Research Decisions)
└── HomeScreen.test.tsx                # MODIFIED — first test rewritten (no more `home-screen-
                                        # brand-block`/BrandMark/tagline assertions; asserts the
                                        # single header instead); every other existing test kept
                                        # passing unmodified

src/domain/i18n/copy/
└── home.ts                            # MODIFIED — `tagline` key removed from both `es`/`en`
                                        # (home.test.ts needs no code change — its parity check
                                        # is key-count-agnostic)
```

No new file is created by this feature — every change is a modification to an existing file.

**Structure Decision**: Single Expo project (Constitution I). No new module, no new shared
primitive, no new token category. Both edited component files already live in their correct
domain (`src/features/scanner/`, `src/features/navigation/`) — no Constitution V exception to
document, unlike `004-home-scan-shell`'s `src/features/navigation/` or `006-visual-identity`'s
`src/features/ui/`, since this feature adds no new cross-cutting module at all.

## Data Model

None (spec.md Key Entities: none). This feature introduces no persisted or transient data shape.

## Interface Contracts

None. No backend HTTP contract, no Supabase SDK contract, and no new internal TypeScript module
surface — `ScanEntryCard`'s prop shape (`onPress`, `label?`) and `HomeScreen`'s exported component
signature are both unchanged; the only "contract" touched is `home.ts`'s copy dictionary shape,
which shrinks by one key without changing its type constraint (`en: Record<keyof typeof es,
string>` continues to hold, now over a smaller key set).

## Quickstart Validation

Once tasks are implemented, validate manually per `docs/verification.md` Level 3 (`npm run web`,
already running in-session per the kickoff notes — do not spawn a second one):

1. Apply the temporary, non-committed `BYPASS_GATE` workaround (spec.md Edge Cases) to reach
   Inicio without a live session.
2. At a mobile-width viewport, confirm: the shell header (rendered once, above Inicio's own
   content) shows the brand mark + tagline; Inicio's own content shows exactly one "Inicio"
   heading, then the restyled card (white fill, dashed border, soft shadow, lime circular "+"
   badge, label on the white surface) — with no large empty gap between the heading and the card.
3. Resize to a desktop width — confirm the same: one brand appearance (shell header only), one
   heading, one balanced heading+card group, no dead gap.
4. Confirm pressing the card still navigates to `/escanear` (unchanged `NAV_DESTINATIONS`-lookup
   behavior, FR-012).
5. Toggle the locale context between `"es"` and `"en"` (existing `LocaleProvider`/`setLocale`
   seam, no new mechanism) — confirm the heading and card label both switch language correctly and
   nothing renders blank.
6. Revert the `BYPASS_GATE` workaround (`git checkout app/_layout.tsx`) — confirm `git status`
   shows no diff to `app/_layout.tsx` before anything is committed.
7. Repeat steps 2–4 on an iOS simulator if one is available in the environment — confirm the
   shadow renders as a real native shadow (not merely a web `boxShadow` string) and the badge/label
   layout looks correct on a physically smaller viewport. Disclose plainly in `progress/
   impl_012-home-visual-alignment.md` if no simulator is available in this environment, rather than
   silently skipping this step (this repo's own documented "green tests, broken app" history).
8. Run `grep -n "#[0-9a-fA-F]\{3,6\}" src/features/scanner/ScanEntryCard.tsx` and confirm zero
   matches (SC-001).

## Complexity Tracking

*No Constitution Check violations — table intentionally empty.*
