# Feature Specification: Home Visual Alignment (Inicio restyle)

**Feature Branch**: `012-home-visual-alignment`

**Created**: 2026-08-07

**Status**: No open `[NEEDS CLARIFICATION]` markers. Two scope-defining decisions were already
made by the human at kickoff (see "Decisions already made" below) and are treated as settled
requirements, not spec-level clarifications — there is no other genuine open question this spec
needs to record as a "recorded default" the way `004-home-scan-shell`/`005-login`/
`006-visual-identity`/`010-registration-redesign` did.

**Input**: Registered 2026-08-07 at the human's request, from a screenshot of Inicio (Home) on
web that they said "seems a bit off... especially the button 'Escanea una carta,'" asking it be
brought in line with the other views (verbatim origin recorded in `feature_list.json`'s
`012-home-visual-alignment` entry — that entry is this spec's authoritative kickoff brief).

**The gap this fills**: `006-visual-identity` (2026-08-05) introduced this app's shared design-
token system (`src/theme/`) and restyled `/login` and `/scan`, but `src/features/scanner/
ScanEntryCard.tsx` — the centre "+" affordance on Inicio — was never migrated. It still carries
three raw `#111827` hex literals (a Tailwind blue-grey-900, a *different* black from this app's
`colors.text.primary` `#10281A`), a hardcoded `borderRadius: 16` instead of `radius.card`, and a
hard 2px solid outline with no fill or shadow, while every other surface in the app is a soft,
shadowed card. Separately, `008-scan-experience` (2026-08-06) added a `BrandMark` + `display.xl`
title + tagline block to the top of `HomeScreen.tsx` — but `004-home-scan-shell`'s `ShellHeader`
(rendered shell-wide, above every tab screen, including Inicio) already renders its own brand
mark plus the "Draw a Card / Tu plataforma de cartas coleccionables" tagline, so the brand
currently appears twice on the Inicio screen with two different, competing taglines. No other
shell destination repeats the brand this way.

**Related backend spec**: none. This is a pure client-side visual restyle of two existing files —
zero new or changed backend endpoint, zero new Supabase Auth SDK call. Confirmed by checking the
`Draw-a-card` backend repo's `feature_list.json` directly: it has no feature keyed to "home,"
"scan entry," or "visual" of any kind — there is no backend counterpart to mirror or diverge from
here, consistent with `006-visual-identity`'s own "Related backend spec: none" precedent for the
same kind of pure-restyle work.

## Decisions already made (not open questions)

These two decisions were put to the human at kickoff and answered — `spec-writer` re-verified
both against the current code on 2026-08-07 (see the Gap section above) rather than trusting the
kickoff summary at face value, and both check out. They are recorded here as settled scope, not
as `[NEEDS CLARIFICATION]` markers or "recorded defaults" open for override at the approval gate.

1. **Card treatment ("soft surface + lime badge")**: `ScanEntryCard.tsx` becomes a white
   `colors.bg.surface` fill, `radius.card` (28), a subtle shadow from `src/theme/shadows`
   (respecting the existing `.ts`/`.web.ts` split), a 1px dashed `colors.border.dashed` outline,
   and a circular `colors.brand.primary` "+" badge — with any label text living outside the
   badge, in `colors.text.primary`, directly on the card's white surface. The card keeps its
   existing silhouette: the standard 2.5:3.5 (width:height) trading-card aspect ratio is
   unchanged. This is a restyle of an existing, already-tested affordance, not a new one and not
   a new interaction.
2. **Scope**: restyle the card **and** remove the duplicated `BrandMark`/tagline block from
   `HomeScreen.tsx`, keeping a single "Inicio" heading. Nothing beyond these two items — this is
   not a fuller Inicio redesign (no new content, no new sections, no change to what the screen
   does).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The "Escanear una carta" card reads as the same brand as the rest of the app (Priority: P1)

A user on Inicio sees the centre quick-action card rendered as a soft, white, shadowed surface
with a dashed outline and a small lime "+" badge — matching the visual language every other
restyled screen (`/login`, `/scan`, `Crear cuenta`) already uses — instead of today's flat white
box with a hard black 2px border and a bare black "+".

**Why this priority**: This is the specific element the human flagged as "off" in the originating
screenshot — the highest-value, most visible fix in this feature.

**Independent Test**: Render `ScanEntryCard` in isolation and confirm it renders with
`colors.bg.surface` fill, `radius.card` corner radius, a shadow style applied, a 1px dashed
`colors.border.dashed` border, and a circular badge filled with `colors.brand.primary` containing
the "+" glyph — with zero raw hex literal anywhere in the file. Confirm the aspect ratio and
minimum 44×44 tap target assertions `ScanEntryCard.test.tsx` already has continue to pass
unmodified.

**Acceptance Scenarios**:

1. **Given** `ScanEntryCard` with no `label` prop (its original, `004-home-scan-shell`-era call
   shape), **When** it renders, **Then** it shows a `colors.bg.surface`-filled, `radius.card`-
   rounded, dashed-`colors.border.dashed`-bordered card with a soft shadow and a centered circular
   `colors.brand.primary` badge holding the "+" glyph, and still exposes the accessibility label
   "Scan a card" — its pre-existing, unlocalized default label, unchanged by this feature.
2. **Given** `ScanEntryCard` with a `label` prop (Inicio's actual call shape, via
   `homeCopy.scanQuickActionLabel`), **When** it renders, **Then** the label text renders in
   `colors.text.primary`, on the card's white surface — **not** inside or over the lime badge —
   and continues to double as the accessible name, exactly as today.
3. **Given** the badge's "+" glyph, **When** its rendered color is inspected, **Then** it uses
   `colors.brand.onPrimary` (the same, already-contrast-tested pairing `PrimaryButton`/`BrandMark`
   use against `colors.brand.primary`) — never a bare white/black literal and never the raw badge
   fill color repeated as its own text color.
4. **Given** the restyled card's source file, **When** inspected, **Then** it contains zero raw
   hex color literals (`#111827` or otherwise) — every color traces to a `src/theme` semantic
   token (`006-visual-identity` FR-001, still binding).
5. **Given** the card rendered on a native platform vs. web, **When** its shadow is inspected,
   **Then** the platform-appropriate shadow representation is used via the existing
   `src/theme/shadows.ts`/`shadows.web.ts` file-extension split — never an inline
   `Platform.OS === ...` branch inside the component (Constitution Principle I/IV).

**Platform notes**: Only the shadow's underlying representation differs by platform (native
shadow properties vs. web `boxShadow`), and that split already exists and needs no new file —
`ScanEntryCard.tsx` simply starts importing `shadowSurface` from the existing `src/theme` barrel.
Everything else (fill, radius, border, badge, label) is identical across iOS, Android, and web.

---

### User Story 2 - Inicio shows the brand once, not twice, with no dead layout gap (Priority: P2)

A user who lands on Inicio sees the brand (mark + tagline) exactly once — rendered by the shared
`ShellHeader` above every tab screen, as it already is — and a single "Inicio" heading on the
screen's own content, not a second, competing `BrandMark`/title/tagline block directly beneath
it. The screen's content (heading + card) reads as one intentionally composed group, not a
title pinned to the top with a large empty gap before a card floating in leftover space.

**Why this priority**: Real, but a smaller and lower-risk fix than User Story 1 — it's a
deletion plus a re-centering of what remains, with no new visual language to introduce.

**Independent Test**: Render `HomeScreen` and confirm no `BrandMark` and no tagline text render
from this file (only `ShellHeader`, mounted separately above it in the real app tree, renders
those); confirm exactly one accessible `header`-role element with the name "Inicio" renders;
confirm the existing `home-screen`/`home-screen-centre`/`scan-entry-card` test IDs this feature's
own tests and `app/(app)/index.test.tsx` depend on still resolve. Separately, render the full
screen at a mobile-width and a desktop-width web viewport and confirm — by eye, against a real
running dev server, not by static reasoning alone — that removing the brand block does not leave
a large empty vertical gap between the heading and the card (Edge Cases below).

**Acceptance Scenarios**:

1. **Given** `HomeScreen`, **When** it renders, **Then** it contains no `BrandMark` component and
   no tagline text of any kind — only a single `Text` with `accessibilityRole="header"` reading
   "Inicio" (`homeCopy.title`, unchanged copy) followed by the restyled `ScanEntryCard`.
2. **Given** the app's real screen tree (`ShellHeader` mounted above `HomeScreen` by the shell,
   `004-home-scan-shell`), **When** Inicio renders, **Then** the brand mark and tagline appear
   exactly once on screen, contributed by `ShellHeader` alone — `HomeScreen` contributes none.
3. **Given** `homeCopy` (`src/domain/i18n/copy/home.ts`), **When** inspected after this feature,
   **Then** its now-unused `tagline` key is removed from both the `es` and `en` dictionaries (not
   left as dead, unrendered copy) — `es`/`en` key parity is preserved (still enforced by
   `home.test.ts`'s existing runtime check).
4. **Given** the restyled Inicio screen, **When** viewed on a mobile-width and a desktop-width web
   viewport, **Then** the heading and card read as one balanced, centered composition — no large
   dead vertical gap between a top-pinned heading and a separately-centered card (Edge Cases).
5. **Given** existing test IDs `home-screen`, `home-screen-centre`, and `scan-entry-card`, **When**
   this feature ships, **Then** all three still resolve exactly as before. The `home-screen-
   brand-block` test ID is retired along with the block it wrapped (there is no longer a "brand
   block" on this screen to wrap) — `HomeScreen.test.tsx` is updated deliberately to match, not
   left broken or silently weakened.
6. **Given** a screen reader, **When** it reaches Inicio, **Then** it still announces exactly one
   button (the quick-action card) inside this screen's own content, matching the existing "no
   longer renders the Amigos pill or the top-right controls from this file" regression guard
   `HomeScreen.test.tsx` already has (`008-scan-experience`), unaffected by this feature.

**Platform notes**: Identical across iOS, Android, and web — this user story is pure JSX/style
deletion and re-layout with no platform-specific behavior of its own.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `ScanEntryCard.tsx` MUST render its card surface using `colors.bg.surface` (fill),
  `radius.card` (corner radius), a 1px dashed `colors.border.dashed` border, and a shadow sourced
  from `src/theme/shadows` (native) / `src/theme/shadows.web` (web) via the existing barrel
  export — replacing the current hardcoded `borderRadius: 16` and 2px solid `#111827` border.
- **FR-002**: `ScanEntryCard.tsx` MUST render a circular badge filled with `colors.brand.primary`
  containing the "+" glyph in `colors.brand.onPrimary` — the badge MUST NOT carry any other text,
  and MUST NOT be relied on as a contrast-bearing surface for anything other than this one
  already-tested glyph pairing.
- **FR-003**: When `ScanEntryCard`'s optional `label` prop is provided, the label text MUST
  render in `colors.text.primary`, directly on the card's `colors.bg.surface` fill — never on or
  inside the lime badge.
- **FR-004**: `ScanEntryCard.tsx` MUST contain zero raw hex color literals after this feature — every
  color value MUST resolve through a `src/theme` semantic token (`006-visual-identity` FR-001,
  still binding, not re-scoped by this feature).
- **FR-005**: `ScanEntryCard`'s existing 2.5:3.5 (width:height) trading-card aspect ratio and its
  minimum 44×44 logical-pixel tap target MUST be unchanged by this restyle (Constitution
  Principle VII, `004-home-scan-shell` FR-004).
- **FR-006**: `HomeScreen.tsx` MUST NOT render a `BrandMark`, a `display.xl`-styled title, or any
  tagline — those are removed outright, not merely restyled.
- **FR-007**: `HomeScreen.tsx` MUST render exactly one accessible heading (`accessibilityRole=
  "header"`) reading `homeCopy.title` ("Inicio" / "Home") — the single heading this feature's
  scope decision (§ "Decisions already made," item 2) requires.
- **FR-008**: `src/domain/i18n/copy/home.ts`'s `tagline` key MUST be removed from both the `es`
  and `en` dictionaries once nothing renders it — `es`/`en` key parity MUST be preserved (existing
  `home.test.ts` runtime check, unmodified in mechanism).
- **FR-009**: The restyled Inicio screen (heading + card) MUST NOT present a large, visually dead
  vertical gap between the heading and the card on either a mobile-width or a desktop-width web
  viewport — verified by rendering against a real running dev server (Edge Cases), not asserted
  by a numeric layout test alone, since "reads as balanced" is a visual judgment a snapshot number
  cannot fully capture.
- **FR-010**: Every text-on-background color pairing this feature newly introduces (the label on
  `colors.bg.surface`; the "+" glyph on `colors.brand.primary`) MUST clear a 4.5:1 WCAG contrast
  ratio, computed via `src/theme/contrast.ts`, not eyeballed, and MUST be regression-guarded by a
  new `contrast.test.ts` assertion for any pairing not already covered there (Constitution
  Principle VII). `colors.brand.primary` on `colors.bg.surface` measures ~1.29:1 — this feature
  MUST NOT place text directly on the lime badge relying on that pairing (FR-002 restates this as
  a hard implementation constraint).
- **FR-011**: Platform-specific rendering this feature introduces (the shadow) MUST be expressed
  via the existing `.ts`/`.web.ts` semantic-import split in `src/theme`, never an inline
  `Platform.OS === ...` branch inside `ScanEntryCard.tsx` (Constitution Principle I/IV).
- **FR-012**: `HomeScreen.tsx`'s existing navigation wiring (looking up the "escanear" entry from
  `NAV_DESTINATIONS` and calling `router.push` with its `route`) MUST be unchanged — this feature
  touches only the returned JSX/styles around it, never this logic (Constitution Principle IV).
- **FR-013**: This feature MUST call zero `Draw-a-card` backend endpoints and zero new Supabase
  Auth SDK methods — it is a pure client-side visual change to two existing files plus their
  copy/test files.
- **FR-014**: Test IDs `home-screen`, `home-screen-centre`, and `scan-entry-card` MUST continue to
  resolve exactly as before this feature. The `home-screen-brand-block` test ID MUST be retired
  (there is no longer a brand block on this screen), with `HomeScreen.test.tsx` updated
  deliberately to match — not left referencing a test ID that no longer exists.

### Key Entities

None. This feature introduces no persisted or transient data entity — it is a pure presentation
change to two existing components and their localized copy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `ScanEntryCard.tsx` contains zero raw hex literals (grep-verified: zero matches for
  a `#[0-9a-fA-F]{3,6}` pattern in the file).
- **SC-002**: 100% of the text/background color pairings this feature renders (the badge's "+"
  glyph, the label on the card surface) clear a 4.5:1 contrast ratio, computed and regression-
  tested against the real `src/theme/colors.ts` export.
- **SC-003**: `ScanEntryCard`'s and `HomeScreen`'s full pre-existing test suites (`ScanEntryCard.
  test.tsx`, `HomeScreen.test.tsx`, `HomeScreen.integration.test.tsx`, `app/(app)/index.test.tsx`,
  `copy/home.test.ts`) pass after this feature, with `HomeScreen.test.tsx` deliberately updated
  (not silently broken or weakened) for the two structural changes (brand block removed, test ID
  retired).
- **SC-004**: Inicio renders the brand (mark + tagline) exactly once in the real app tree
  (contributed by `ShellHeader` alone), verified by rendering the real navigation shell with
  `HomeScreen` mounted inside it, not `HomeScreen` in isolation.
- **SC-005**: A human (or an agent driving a real browser against the running dev server) confirms
  no large dead vertical gap exists between the heading and the card at both a mobile-width and a
  desktop-width web viewport.

## Edge Cases

- **The dead vertical gap** (`HomeScreen.tsx` today: a top-anchored, `paddingTop: space.xxl`
  brand block, with the card centered separately in the remaining `flex: 1` space below it) is
  *expected* to close once the brand block is removed and the heading is re-centered alongside
  the card as one group — but the exact resulting spacing/centering approach is an implementation
  decision, not a spec-level mandate, and MUST be checked against a real running dev server
  (`npm run web`) before this feature is considered done, not merely assumed correct because the
  brand block is gone (per this repo's own documented "green tests, broken app" history —
  `docs/verification.md`).
- **Short/landscape viewports**: `HomeScreen.tsx` already wraps its content in a `ScrollView` (a
  `004-home-scan-shell` fix for a prior landscape-clipping bug) so the screen can scroll
  independently on a short viewport — this feature's re-layout MUST preserve that behavior
  (`HomeScreen.test.tsx`'s existing `ScrollView` regression guard MUST still pass unmodified).
- **Narrow-width label wrapping**: the card's label text (`"Escanear una carta"`/`"Scan a card"`)
  already wraps via `textAlign: "center"` and horizontal padding on the card — this feature
  changes the label's color and container but not this wrapping behavior.
- **Verifying Inicio requires an authenticated session**: the KYC gate in `app/_layout.tsx`
  redirects every route to `/login` unless a live Supabase session and a reachable backend both
  exist. For visual verification only, a temporary, clearly-scoped bypass of that gate (e.g. a
  `const BYPASS_GATE = true as boolean;` guard on the `<Redirect>` in `app/_layout.tsx`) may be
  used locally, and MUST be reverted (`git checkout app/_layout.tsx`) before anything is
  committed — it must never land in a commit or be treated as part of this feature's shipped
  behavior.

## Assumptions

- **No new runtime dependency is needed.** Every token, primitive, and file-extension convention
  this feature reuses (`colors`, `radius`, `shadowSurface`/`shadowSurface.web`, the `.web.ts`
  split, `homeCopy`/`useTranslation`, `NAV_DESTINATIONS`) already exists, shipped by
  `006-visual-identity`, `004-home-scan-shell`, and `008-scan-experience`.
- **`HomeScreen.tsx` remains `ScanEntryCard`'s only caller.** Re-confirmed 2026-08-07 by grepping
  `src/` and `app/` — this feature does not need to consider any other consumer of the card's
  visual treatment.
- **The stale doc comment inside `ScanEntryCard.tsx`** (claiming the `label` prop "must stay
  optional so no other/future caller is disturbed") is corrected as part of this restyle, since
  the constraint it describes is moot now that `HomeScreen` is confirmed the sole caller — the
  prop itself stays optional (no behavior change), only the comment's reasoning is updated to
  reflect current reality.
- **`ShellHeader`'s own brand mark/tagline are out of scope.** This feature only removes
  `HomeScreen.tsx`'s duplicate copy of the brand; `ShellHeader.tsx` itself (rendered shell-wide,
  `004-home-scan-shell`) is untouched.
- **No screen other than Inicio is touched.** `ScanEntryCard` has exactly one caller (see above),
  so restyling it cannot visually affect any other screen; no other screen imports `BrandMark`
  the way `HomeScreen.tsx` did.
- **This is not a redesign.** No new content, section, control, or behavior is added to Inicio —
  scope is bounded to exactly the two items in "Decisions already made" above, per the human's
  explicit instruction.
