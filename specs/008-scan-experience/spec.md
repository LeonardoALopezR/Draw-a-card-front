# Feature Specification: Scan Experience (5-destination nav, branded scanner, Inicio redesign)

**Feature Branch**: `008-scan-experience`

**Created**: 2026-08-05

**Status**: Clarified (four decisions were already settled by the human before this spec was
written — see Input below; two further decisions are recorded here with a chosen default and
explicitly flagged for confirmation at the `spec_ready` approval gate, per the human's own
request; several smaller, low-stakes mockup-transcription ambiguities are resolved inline as
non-blocking Design notes, matching the pattern established in `specs/004-home-scan-shell/
spec.md` and `specs/006-visual-identity/spec.md`)

**Input**: Human request, relayed via `feature_list.json`'s `008-scan-experience` entry (read
that entry for the full verbatim request and the complete transcription of four mockup images —
the images themselves are not in this repo): *"lets create a new feature, the scaner view need
to be like the images uploaded, keep in mind that the web version it won't have the scaner
option, also add the icons for localization (spanish/english with mexican/USA flags),
currency(usd,mxn) notifications and messages, only the icons the implementation needs to be on
other feature and redesing the pre-scanner view (feature 004-home-scan-shell) this will be the
first view when a user logs (after tutorial) put it with the same design as the other views."*

**Four decisions already settled by the human (2026-08-05, at the orchestrator's asking) — not
reopened here as `[NEEDS CLARIFICATION]`**:

1. **Navigation** — the shell's current three destinations (Amigos/Home/Social) are **replaced**
   by the mockups' five: Inicio, Escanear, Cartera, Trades, Perfil. Amigos and Social are
   retired. Cartera, Trades, and Perfil are new, empty placeholder destinations — no content in
   this feature.
2. **Web has no camera scanner** — despite the web mockup drawing a viewfinder, web renders
   **no** viewfinder and **no** "Escanear carta" button. Web's Escanear destination keeps only
   the search field, the image-upload affordance, and the results/detail panel. Escanear itself
   stays in the web sidebar. This is a deliberate, disclosed deviation from the supplied web
   mockup, not a bug.
3. **Found-card result panel is inert UI with mock data** — the full found-card layout and its
   local interactions (condition chip, quantity stepper, graded toggle) are built against
   hardcoded sample cards. No camera module, no recognition, no backend call anywhere in this
   feature. The "found" state is reachable only as local UI state.
4. **Four icon controls go top-right on every screen** — a persistent header row inside the app
   shell (Inicio, Escanear, and the rest), not just the home screen. Icons only: language
   (Mexico/USA flags for es/en), currency (USD/MXN), notifications, messages. All four stay
   inert — no language switching (`007-localization`'s job), no currency conversion, no
   notification feed, no messaging.

**Depends on `006-visual-identity`** (`src/theme`, `src/domain/i18n` + `src/features/i18n`, the
existing `src/features/scanner` shell, the `src/features/ui` primitives) — confirmed `done` and
merged to `main` (commits `16d8620`, `44c6cc4`) before this branch is cut.

**Related backend spec**: none. Every FR below is client-side UI only (Constitution Principle
II/VIII) — the sample cards are hardcoded fixtures, not a `Draw-a-card` API response. Checked
against the backend repo directly (`Draw-a-card/feature_list.json`, 2026-08-05): the backend has
no `portfolio`/`trading`/`profile-view` bounded-context feature spec'd yet (only `identity`,
`onboarding-tutorial-state`, `kyc-document-verification` (pending), `session-authentication`
(pending), and `catalog` (`card-catalog`, `catalog-ingestion`, `catalog-search`, all done or in
progress)) — so Cartera/Trades/Perfil introduce no field/entity shape that needs to stay in sync
with anything on the backend today; a future feature that gives them real content is what does
that cross-check. The backend's `008-catalog-search` (done) is a plausible real data source for
Escanear's search field once a future feature wires real search — this feature deliberately does
**not** call it (settled decision 3).

## Clarifications

### Recorded default 1 (2026-08-05, flagged for the human at the approval gate): Inicio's redesigned content and layout

**No mockup was supplied for Inicio.** The four transcribed mockups are all Escanear (mobile
idle, web idle, web found, mobile found) — none shows the landing/home screen. `004-home-scan-
shell`'s existing Home/Scan screen (`src/features/navigation/HomeScreen.tsx`) must still be
redesigned in the same visual language per the human's explicit instruction ("redesing the
pre-scanner view ... put it with the same design as the other views"), so a proposal is recorded
here rather than left unspecified.

| Option | Description | Implications |
|---|---|---|
| **A (recommended, chosen default)** | Reuse the exact primitives/tokens the mockups already establish: a `BrandMark`, a `display.xl` serif "Inicio" (or a short welcome line), a brief tagline, and — since the wireframe's centre "+" card affordance has no obvious replacement content and Escanear is now its own persistent destination — repurpose that same card as a quick-action shortcut reading "Escanear una carta" that navigates to the Escanear destination (via `NAV_DESTINATIONS`, not a hardcoded route string, mirroring `004`'s own `AmigosQuickAccessPill` pattern). No user-specific data (name, balance, recent activity) is rendered — none of that exists in this app yet. | Lowest-risk option: reuses every primitive this feature and `006` already ship, adds no new visual vocabulary, and gives the "+" card's well-tested affordance (press → navigate) continued purpose instead of deleting it outright. Explicitly disclosed as **this spec-writer's proposal**, not a transcribed mockup. |
| B | Leave Inicio as a bare title with no call-to-action, relying entirely on the persistent nav shell to reach Escanear. | Simpler, but throws away the one interaction `004-home-scan-shell` already validated (a large, centred, accessible "start scanning" affordance) for no stated reason — the human never asked for it to be removed, only for the screen to be redesigned. |
| Custom | Human supplies real Inicio content/layout. | — |

**Recorded default**: **Option A.** Flagged explicitly for the human to confirm or override at
the approval gate — if overridden, only `HomeScreen.tsx`'s content changes; no other artifact in
this spec depends on it. See User Story 5 / FR-013.

### Recorded default 2 (2026-08-05, flagged for the human at the approval gate): Amigos and Social are retired outright, and the KYC gate needs zero diff

**What was found**: tracing `resolveKycRoute()` (`src/domain/kyc-gate.ts`) and `KYC_ROUTE_TARGETS`
(`src/features/identity/useKycGate.ts`) directly — `KYC_ROUTE_TARGETS`'s type is
`Record<Exclude<KycRoute, "main">, string>`; `"main"` is never a key in it, and `app/_layout.tsx`'s
`KycGate` renders the root `<Stack>` as-is with **no** `<Redirect>` when `route === "main"`. The
gate has never known or cared what `"main"` renders — `004-home-scan-shell` already relied on
this (its FR-009 "zero diff" was possible for the same reason). Replacing `NAV_DESTINATIONS`'
three entries with five, and redesigning what `app/(app)/index.tsx` renders, therefore requires
**zero changes** to `resolveKycRoute()`, `useKycGate()`, or `KYC_ROUTE_TARGETS` — confirmed by
reading the actual source, not assumed. This directly answers the second flagged question: the
5-destination change does **not** force a routing change.

**What remains a real decision**: what happens to the Amigos/Social screens themselves.

| Option | Description | Implications |
|---|---|---|
| **A (recommended, chosen default)** | **Retire outright.** Remove `app/(app)/amigos.tsx`, `app/(app)/social.tsx`, their route tests, `src/features/social/AmigosPlaceholderScreen.tsx`/`SocialPlaceholderScreen.tsx` and their tests, and `src/features/navigation/AmigosQuickAccessPill.tsx` and its test — restoring `src/features/social/` to the bare README-only scaffold it was before `004-home-scan-shell`. `NAV_DESTINATIONS` no longer has `amigos`/`social` keys at all. | Matches the human's own wording ("retired") literally. A future "Amigos" feature (if the product ever wants one) starts from its own spec rather than resurrecting dead placeholder code that predates any real design for it — cleaner than carrying unreachable, unlinked files forward. Zero user-facing regression: neither placeholder ever had real content (`004`'s explicit scope), so nothing of value is lost. |
| B | Keep the files, just unlink them from `NAV_DESTINATIONS` (orphaned but not deleted). | Leaves dead, untested-by-nothing-importing-them code in the tree — exactly the kind of drift `docs/conventions.md`'s "extreme consistency" principle argues against; no stated reason to keep it. |
| C | Fold Amigos/Social into one of the five new destinations (e.g. Amigos under Perfil). | Not supported by the mockups (none of the five destinations mention friends/social content) and invents scope the human didn't ask for. |

**Recorded default**: **Option A.** Flagged explicitly for the human to confirm or override at
the approval gate — if overridden (e.g. the human wants the files kept dormant), only the
"retire" tasks in `tasks.md` change; nothing else in this spec depends on it. See User Story 6 /
FR-002.

### Design note (resolved, not blocking): dropping the "Cámara disponible" badge on web along with the viewfinder

Settled decision 2 removes the viewfinder and the "Escanear carta" button from web, but the
transcribed web mockup also shows a `StatusPill` reading "Cámara disponible" ("Camera available")
next to the web title — already shipped by `006-visual-identity`. Keeping a badge that claims a
camera is available on the one platform that explicitly has no camera would be actively
misleading, not merely an unfaithful mockup reproduction. This spec extends decision 2's own
reasoning: the badge is dropped from web alongside the viewfinder/button it describes (FR-005).
Mobile is unaffected — it never had this badge (the mobile mockup doesn't show one).

### Design note (resolved, not blocking): what triggers the local "found" state, on each platform

Settled decision 3 says the found-card panel is driven by hardcoded sample cards reachable only
as local UI state, but does not say which control triggers it. Resolved here, consistently across
platforms — the same handler fires from any of these, so no platform gets a materially different
trigger surface than another:

- **Mobile**: pressing "Escanear carta" (now enabled, replacing `006`'s intentionally-disabled
  placeholder button), **or** submitting the search field, **or** tapping the upload dropzone.
- **Web**: submitting the search field, **or** tapping the upload dropzone (no viewfinder/button
  exists on web to trigger from, per decision 2).

Every trigger calls the same local simulate-a-match action; none inspects what (if anything) was
typed or "uploaded" — this is presentation-only, not a real search or recognition path (FR-016).
See User Story 2 / FR-007.

### Design note (resolved, not blocking): the sample-card pool, "Cambiar"/"Eliminar"/"Aceptar", and one small invented detail

- The three sample cards transcribed for the web mockup's "ESCANEOS" recent-scans rows (Dragón
  Eterno · GEN-001 · PSA 10 · $45,000; Fénix de Tormenta · ARC-047 · BGS 9.5 · $12,500; Serpiente
  del Vacío · GEN-022 · PSA 9 · $8,900) are reused as the **single source of truth** for both the
  recent-scans list *and* the found-card panel's pool (`src/domain`) — not two independently
  hand-typed lists that could drift, and not the unrelated Charizard/Blastoise/Venusaur set
  `006-visual-identity` hand-typed before this mockup existed (replaced by this feature).
- Only Dragón Eterno's found-panel detail is transcribed in the mockups ("Genesis · GEN-001").
  Fénix de Tormenta's and Serpiente del Vacío's set names ("Arcana", "Genesis" respectively,
  inferred from their `ARC-`/`GEN-` code prefixes) are spec-writer-supplied filler, since the
  mockups never show their detail panels — flagged here explicitly rather than silently invented,
  low-stakes since it's inert placeholder data with zero downstream consequence.
- "Cambiar" (blue text link) cycles the found panel to the next sample card in the pool,
  re-seeding condition/graded/quantity to that card's defaults. "Eliminar" (red text link) clears
  back to the idle/empty state. "Aceptar" gives a brief, visible local confirmation (never a
  silent no-op, matching `004`'s SC-005/`006`'s established precedent) and then returns to the
  idle state — it does not persist anything anywhere (no backend, no `src/domain` write); a
  future portfolio feature is what turns "Aceptar" into a real "add to my collection" action.

### Design note (resolved, not blocking): the "Gradeada" field's ambiguous transcription

Image 3's transcription reads: "two side-by-side fields 'Gradeada' and 'PSA 10' the latter
carrying an OFF toggle switch" — genuinely ambiguous prose (which field the toggle belongs to,
and what "OFF" means next to an already-graded card). Resolved as: a left field labelled
"Gradeada" holding a boolean toggle (defaults to the sample card's `defaultGraded`, `true` for
all three seeded cards, since each already carries a grade), and a right, read-only "Grado" field
showing the grade text (e.g. "PSA 10") when the toggle is on, and a dash placeholder when off.
Toggling it is purely local UI state — it does not alter price, condition options, or anything
else in this feature. See FR-008.

### Design note (resolved, not blocking): the language control's flag icons avoid raw flag emoji

Rendering literal flag emoji (🇲🇽/🇺🇸) is not a safe cross-platform choice: stock Android does not
ship the Unicode regional-indicator flag glyphs in its default emoji font, so those code points
commonly render as two bare letters ("MX"/"US") instead of a flag on real Android devices/most
emulators — not a hypothetical, a well-known platform gap. Rather than risk a broken glyph on one
of three target platforms, the language control renders a small, hand-drawn flag-shaped
rectangle per option, built from nested `View`s using each country's real flag colors (Mexico:
three equal vertical bands, green/white/red; USA: red/white horizontal stripes with a blue
canton in the upper-left) — no emoji, no image asset, no new icon/flag-asset dependency. (An
earlier iteration of this control rendered a plain two-letter `"MX"`/`"US"` text chip instead of
anything flag-shaped; the human explicitly asked for a real flag-like visual, 2026-08-05, and
this note/FR-012 were updated to describe what actually ships.) See FR-012.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reach any of five destinations from one persistent shell, with the four icon controls always present (Priority: P1, Foundational)

The app's navigation shell exposes exactly five destinations — Inicio, Escanear, Cartera,
Trades, Perfil — reachable from any of the others, on iOS/Android (native tab bar) and web
(existing responsive sidebar/bottom-bar split at 768px, unchanged breakpoint mechanism). A single
persistent header row showing four icon controls (language, currency, notifications, messages)
renders identically on every one of the five destinations, not only on Inicio.

**Why this priority**: Every other story in this feature renders inside this shell; nothing else
can be demonstrated without it existing first.

**Independent Test**: From a fixture user already past the KYC gate, confirm the app renders a
shell exposing exactly five labelled, reachable destinations (in the order Inicio, Escanear,
Cartera, Trades, Perfil) on iOS, Android, and web at both narrow and wide widths, and that the
four icon controls appear, identically, on each of the five destinations' screens.

**Acceptance Scenarios**:

1. **Given** an onboarded user whose gate resolves to `"main"`, **When** the app finishes
   loading, **Then** it renders the shell with exactly five destinations, Inicio shown active,
   and the four icon controls visible top-right.
2. **Given** the shell, **When** the user selects any of Escanear, Cartera, Trades, or Perfil,
   **Then** that destination renders with the shell (including the four icon controls) intact and
   that destination shown active.
3. **Given** any of the five destinations, **When** rendered, **Then** the same four icon
   controls appear in the same order (language, currency, notifications, messages) — not
   duplicated per-screen markup that could drift, but one shared implementation.
4. **Given** a web viewport crossing the existing 768px breakpoint, **When** it resizes, **Then**
   the shell switches between the sidebar and bottom-bar treatments exactly as `004-home-scan-
   shell` already established, with all five destinations and the icon row present in both.
5. **Given** a keyboard-only user on web or VoiceOver/TalkBack on native, **When** they reach any
   destination link or icon control, **Then** each announces a real, distinct label and is
   independently activatable — none is icon-only with no accessible name.

**Platform notes**: identical destination set/order on all three platforms; native renders via
`expo-router`'s `<Tabs>` (unchanged mechanism from `004`), web via the existing `.web.tsx`
sidebar/bottom-bar split (unchanged breakpoint, `src/domain/navigation.ts`'s
`resolveWebNavLayout`). The icon-control row is implemented once and composed into both the
native tab layout and the two web layouts — not five separate per-screen copies.

---

### User Story 2 - A local "found card" result exists, with its own inert interactions, independent of which platform or control triggered it (Priority: P1, Foundational)

A hardcoded pool of three sample cards backs a local "found" UI state: once triggered (User
Stories 3/4 define the triggers), a card-detail panel renders the found card's thumbnail, name,
set/code, grade pill, price pill, a "Gradeada" toggle + grade value, a five-option condition chip
row (one selected), a quantity stepper (minimum 1), the market price, "Eliminar"/"Cambiar" text
links, and an "Aceptar" button. Every one of these is a real, working local interaction — not
static mockup text — but none of it calls a backend, imports a camera module, or persists
anything.

**Why this priority**: Foundational — both the mobile and web Escanear stories (User Stories 3/4)
render this exact panel and share its state logic; building it twice per platform would
duplicate the one genuinely reusable piece of business logic this feature has (Constitution
Principle IV).

**Independent Test**: Starting from the found state, exercise the condition chips (confirm
exactly one is ever selected), the quantity stepper (confirm it never drops below 1), the
"Gradeada" toggle (confirm the grade value's visibility follows it), "Cambiar" (confirm it
advances to the next sample card and resets condition/graded/quantity to that card's own
defaults), "Eliminar" (confirm it returns to the idle state), and "Aceptar" (confirm it gives a
visible confirmation and returns to idle) — all without a network request or camera-module
import anywhere in the code exercised.

**Acceptance Scenarios**:

1. **Given** the found panel for the first sample card, **When** it renders, **Then** it shows
   the thumbnail, "Dragón Eterno", "Genesis · GEN-001", a solid "PSA 10" pill, a green "$45,000"
   pill, "Eliminar"/"Cambiar" links, "Gradeada" + grade-value fields, a condition-chip row with
   "Near Mint" selected, a quantity stepper reading 1, and an "Aceptar" button.
2. **Given** the condition-chip row, **When** the user selects a different chip, **Then** exactly
   that chip shows selected and every other one shows unselected — never zero or more than one
   selected.
3. **Given** the quantity stepper at 1, **When** the user presses "−", **Then** the value does not
   drop below 1; **When** the user presses "+", **Then** the value increases by 1 with no upper
   bound stated by the mockups.
4. **Given** the "Gradeada" toggle on, **When** the user turns it off, **Then** the grade-value
   field shows a placeholder dash instead of the grade text, and turning it back on restores the
   grade text — the toggle never affects price, condition, or quantity.
5. **Given** the found panel, **When** the user presses "Cambiar", **Then** the panel now shows
   the next sample card in the pool with that card's own default condition/graded/quantity — not
   the previous card's values carried over.
6. **Given** the found panel, **When** the user presses "Eliminar", **Then** the screen returns to
   its idle state (no found panel visible).
7. **Given** the found panel, **When** the user presses "Aceptar", **Then** a visible confirmation
   appears and the screen returns to its idle state — no network call, no write to any storage.

**Platform notes**: identical logic and interactions on iOS, Android, and web — the pure
condition/quantity/graded/cycling rules live in `src/domain` with zero React Native import
(Constitution Principle IV) and are unit-tested directly there; only the *layout* of the panel
(inline in a single column on mobile vs. a side panel on web) differs, per User Stories 3/4.

---

### User Story 3 - Escanear on mobile: the full camera-style shell, with a working local "found" trigger (Priority: P1)

On iOS/Android (and web below the tablet breakpoint's mobile-equivalent single column — see
`006-visual-identity`'s existing single-column mobile layout, unaffected by this story since it
targets native), Escanear renders the branded viewfinder (idle: grid + corner brackets + camera
glyph + hint text + gear chip; found: glowing scan line + check glyph + "¡Carta encontrada!"),
the search field, the upload dropzone, and an enabled "Escanear carta" button — all already built
by `006-visual-identity` except that the button is now enabled and wired to User Story 2's local
"found" trigger instead of being a disabled no-op. When a card is found, User Story 2's
detail panel renders inline, below the button, in the same single column.

**Why this priority**: This is the mockups' primary described interaction (mobile idle + mobile
found, two of the four supplied images) and the one screen where the viewfinder's full idle/found
visual states (both drawn, not merely described) must actually exist.

**Independent Test**: Render Escanear on a mobile-width viewport, trigger the found state via any
of the three triggers (button, search-field submit, dropzone tap), and confirm the viewfinder
switches from its idle drawing to its found drawing, and the found panel appears inline below the
existing controls, with the shell (five destinations + icon row) still present around it.

**Acceptance Scenarios**:

1. **Given** Escanear at idle on a mobile viewport, **When** it renders, **Then** it shows, in a
   single column: the `display.lg` title "Escanear", the idle viewfinder, the search field, the
   upload dropzone, and an enabled "Escanear carta" button — with the persistent five-destination
   shell (User Story 1) around it, not a standalone route with its own "Back" affordance (see
   FR-003 — this reverses `006-visual-identity`'s Recorded default 3, which predates the
   5-destination mockups).
2. **Given** idle Escanear, **When** the user presses "Escanear carta", submits the search field,
   or taps the upload dropzone, **Then** the found state triggers (User Story 2) and the
   viewfinder switches to its found drawing (glowing scan line, check glyph, "¡Carta encontrada!").
3. **Given** the found state, **When** it renders, **Then** the found-card panel (User Story 2)
   appears inline below the upload dropzone/button, in the same single column, with the
   condition-chip row wrapping onto a second row where it doesn't fit on one line.
4. **Given** the shell's Cartera, Trades, or Perfil destination selected while a found state is
   active on Escanear, **When** the user returns to Escanear via the shell, **Then** the screen
   returns to its default idle state (no "last found card" persistence — matches `004`'s own "no
   new last-active-tab persistence beyond ordinary navigator state" precedent).

**Platform notes**: iOS/Android only for this story's viewfinder/button — this is a
straightforward continuation of `006-visual-identity`'s existing `ScanShellScreen.tsx`
(mobile-resolved file), now living inside the shell instead of behind a standalone route.

---

### User Story 4 - Escanear on web: search and upload only, no camera, with a working local "found" trigger and a side detail panel (Priority: P1)

On web at/above the existing 768px breakpoint, Escanear renders a two-column layout: left column
has the title, the search field, and the upload dropzone (**no** viewfinder, **no** "Escanear
carta" button, **no** "Cámara disponible" badge — settled decision 2 and its Design-note
extension); right column shows the empty-results panel (idle) or the found-card detail panel
(User Story 2, found) above the "ESCANEOS RECIENTES" recent-scans list, which keeps rendering
regardless of idle/found state. Below the breakpoint, the two columns collapse to one, matching
`006-visual-identity`'s existing collapse behaviour.

**Why this priority**: This is the settled decision that most visibly diverges from the literal
mockup (decision 2) — getting the *absence* of camera UI right on web, while keeping every other
described element, is as load-bearing as getting the presence of it right on mobile (User Story
3).

**Independent Test**: Render Escanear on a web-width viewport at/above 768px and confirm no
viewfinder, no "Escanear carta" button, and no "Cámara disponible" badge exist anywhere in the
rendered output or the component tree (source-inspection + rendered-output checks both), then
trigger the found state via the search field or the upload dropzone and confirm the right
column's empty-results panel is replaced by the found-card detail panel while the recent-scans
list stays visible.

**Acceptance Scenarios**:

1. **Given** Escanear on a web viewport at/above 768px, **When** it renders, **Then** the left
   column shows only the title, search field, and upload dropzone (no viewfinder, no "Escanear
   carta" button, no camera-availability badge), and the right column shows the empty-results
   panel above the recent-scans list.
2. **Given** the same viewport, **When** the search field is submitted or the upload dropzone is
   tapped, **Then** the found state triggers (User Story 2) and the right column's empty-results
   panel is replaced by the found-card detail panel — the recent-scans list stays visible below
   it, unchanged.
3. **Given** a web viewport below 768px, **When** Escanear renders, **Then** the two columns
   collapse to one (controls first, then the results/found panel and recent-scans list below),
   matching `006-visual-identity`'s existing collapse behaviour, but with the mobile-only
   viewfinder/button still absent (this is web, not native, regardless of width).
4. **Given** the Escanear source files, **When** inspected, **Then** none imports `expo-camera`,
   `expo-image-picker`, or any camera-related module — the existing source-inspection guard test
   stays green, extended to cover any renamed/relocated file.

**Platform notes**: web only. The 768px breakpoint and its collapse behaviour are unchanged from
`006-visual-identity` (`src/domain/navigation.ts`'s `BREAKPOINT_PX`).

---

### User Story 5 - Inicio is the redesigned, first post-login/post-tutorial landing screen (Priority: P2)

`004-home-scan-shell`'s Home/Scan screen is redesigned in the same visual language as every other
restyled screen (`006-visual-identity`'s tokens/primitives) and becomes the Inicio destination —
still the first screen a fully-onboarded user lands on after signing in or finishing the
tutorial, with **zero change** to the KYC/onboarding routing gate (Clarifications' Recorded
default 2).

**Why this priority**: Explicitly requested ("redesing the pre-scanner view ... this will be the
first view when a user logs (after tutorial)"), but lower priority than the shell/Escanear
stories since no mockup exists for it and its content is this spec's own proposal (Recorded
default 1) rather than a literal mockup reproduction.

**Independent Test**: With a fixture user resolving to `"main"`, confirm cold boot lands on the
redesigned Inicio screen (not a flash of the old `004` layout or an unmatched-route error), and
that `resolveKycRoute()`/`useKycGate()`/`KYC_ROUTE_TARGETS` are byte-for-byte unchanged from
`main` (`git diff` check, not assumed).

**Acceptance Scenarios**:

1. **Given** an onboarded user whose gate resolves to `"main"`, **When** the app finishes
   loading, **Then** it renders the redesigned Inicio screen inside the five-destination shell,
   using `006-visual-identity`'s tokens/primitives (not `004`'s original hardcoded-hex styling).
2. **Given** Inicio, **When** the user presses the quick-action card (Recorded default 1),
   **Then** the app navigates to the Escanear destination via the shared `NAV_DESTINATIONS` table
   (not a hardcoded route string).
3. **Given** `src/domain/kyc-gate.ts`, `src/features/identity/useKycGate.ts`, and
   `app/_layout.tsx`, **When** diffed against `main` after this feature, **Then** the diff is
   empty (Clarifications' Recorded default 2).

**Platform notes**: identical content/layout across iOS, Android, and web (aside from the
existing responsive shell split from User Story 1) — Inicio itself introduces no new
platform-specific rendering.

---

### User Story 6 - Cartera, Trades, and Perfil are reachable, contentless placeholders; Amigos and Social are retired (Priority: P3)

Selecting Cartera, Trades, or Perfil renders a real, reachable, distinctly-labelled screen
communicating it has no content yet — mirroring exactly the pattern `004-home-scan-shell`
established for Amigos/Social, now applied to the three new destinations. Amigos and Social
themselves, and every file that existed only to support them, are removed from the app
(Clarifications' Recorded default 2).

**Why this priority**: Lowest priority — these three destinations exist only so the shell is
genuinely five-way navigable per the settled decision; they carry zero product content in this
feature, exactly as Amigos/Social carried none in `004`.

**Independent Test**: Select each of Cartera, Trades, and Perfil from the shell and confirm each
renders a distinct, labelled placeholder (not each other's content, not an error page); confirm
`/amigos` and `/social` no longer resolve to anything in the app (grep + route-file absence
check), and that no file in the repository still imports the retired
`AmigosPlaceholderScreen`/`SocialPlaceholderScreen`/`AmigosQuickAccessPill`.

**Acceptance Scenarios**:

1. **Given** the shell, **When** the user selects Cartera, **Then** a placeholder screen renders
   identifying itself as Cartera, with no portfolio/inventory data of any kind, living under
   `src/features/portfolio/` (the already-scaffolded module mirroring the backend's `portfolio`
   bounded context).
2. **Given** the shell, **When** the user selects Trades, **Then** a placeholder screen renders
   identifying itself as Trades, with no trade/offer data of any kind, living under
   `src/features/trading/`.
3. **Given** the shell, **When** the user selects Perfil, **Then** a placeholder screen renders
   identifying itself as Perfil, with no real profile data of any kind, living under
   `src/features/identity/` (distinct from the existing registration-flow `ProfileForm`).
4. **Given** the repository after this feature, **When** searched, **Then** no route file, no
   component, and no `NAV_DESTINATIONS` entry references Amigos or Social in any form.

**Platform notes**: identical across iOS, Android, and web — plain placeholder screens with no
platform-specific behavior, matching `004-home-scan-shell`'s established pattern exactly.

---

### Edge Cases

- What happens if the user triggers a found state on Escanear, then navigates away and back via
  the shell? → The screen resets to idle (User Story 3, Acceptance Scenario 4) — no "last found
  card" persistence is added, consistent with `004`'s existing "no new last-active-tab
  persistence" precedent.
- What happens when a web browser window is resized across the 768px breakpoint while a found
  state is active on Escanear? → The layout switches columns exactly as `006-visual-identity`
  already handles for the idle state; the found panel's own local state (selected condition,
  quantity, graded toggle) is preserved across the resize, since it lives in the same component
  tree that survives the resize (it does not live inside `WebSidebarNav`/`WebBottomBarNav`'s own
  remount-on-breakpoint-change subtree — see `004`'s disclosed, accepted loose end about that
  subtree resetting *screen-owned* ephemeral state on a resize-triggered layout switch; this
  feature does not fix that pre-existing loose end, and Escanear's found-panel state is expected
  to be subject to the same caveat if it is ever exercised right at a resize boundary).
- What happens if a user without an established session (or one still mid-KYC-gate) requests one
  of this feature's routes directly (e.g. a bookmarked `/escanear` URL on web)? → Unchanged `001`
  behavior: the existing gate redirect still fires on the shared root layout; this feature adds
  no separate guard (same as `004`'s equivalent edge case).
- What happens if the four top-right icon controls don't fit alongside a destination's own
  content on a very short/narrow viewport? → Same requirement `004`'s FR-006/SC-003 already
  established for the old three-control stack: content must never overlap or become unreachable;
  the persistent header row scrolls or wraps as needed without obscuring destination content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST replace the shell's current three destinations (Amigos, Home, Social)
  with five — Inicio, Escanear, Cartera, Trades, Perfil — in `src/domain/navigation.ts`'s
  `NAV_DESTINATIONS`, each reachable from any of the others on iOS, Android, and web, using the
  same native-`<Tabs>`/web-sidebar-or-bottom-bar mechanism `004-home-scan-shell` already
  established (unchanged 768px breakpoint).
- **FR-002**: Amigos and Social MUST be retired outright (Clarifications, Recorded default 2) —
  their route files, placeholder screens, tests, and the Home-screen quick-access pill that
  targeted Amigos MUST be removed, not merely unlinked from navigation.
- **FR-003**: Escanear MUST be one of the five persistent shell destinations, reachable and left
  via the shell like every other destination — **not** a standalone route with its own manual
  "Back" affordance outside the shell (this reverses `006-visual-identity`'s Recorded default 3,
  which predates the 5-destination mockups this feature implements).
- **FR-004**: On iOS and Android, Escanear MUST render the branded viewfinder (idle and found
  visual states), the search field, the upload dropzone, and an **enabled** "Escanear carta"
  button wired to trigger the local found state (User Story 2) — replacing `006-visual-identity`'s
  intentionally-disabled placeholder button.
- **FR-005**: On web, Escanear MUST render **only** the title, search field, and upload dropzone
  in its controls column — **no** viewfinder, **no** "Escanear carta" button, and **no**
  "Cámara disponible" (camera-availability) badge — a deliberate, disclosed deviation from the
  supplied web mockup (Clarifications' settled decision 2 and its Design-note extension).
- **FR-006**: On web at/above the existing 768px breakpoint, Escanear MUST render a two-column
  layout (controls left, results/found-panel + recent-scans list right); below the breakpoint the
  columns MUST collapse to one, matching `006-visual-identity`'s existing behaviour.
- **FR-007**: A local "found" scan-result state MUST be triggerable, with identical underlying
  behavior, by: pressing "Escanear carta" (mobile only), submitting the search field (both
  platforms), or tapping the upload dropzone (both platforms) — none of these MUST inspect real
  camera input, real search input, or a real uploaded image; all MUST seed the same hardcoded
  sample-card pool (Clarifications' Design notes).
- **FR-008**: The found-card panel MUST render the found card's thumbnail, name, set/code,
  a grade pill, a price pill, "Eliminar" and "Cambiar" text links, a "Gradeada" toggle whose
  state governs whether a grade value or a placeholder renders next to it, a five-option
  condition-chip row with exactly one option selected at a time, a quantity stepper with a
  minimum of 1, the market price, and an "Aceptar" button — with condition selection, the graded
  toggle, and the quantity stepper all genuinely interactive local state (settled decision 3), not
  static mockup text.
- **FR-009**: "Cambiar" MUST advance the found panel to the next card in the sample-card pool and
  reset condition/graded/quantity to that card's own defaults (not carry over the previous card's
  values). "Eliminar" MUST return the screen to its idle state. "Aceptar" MUST give a visible
  local confirmation and then return the screen to its idle state, with **no** network call and
  **no** write to any storage.
- **FR-010**: The three sample cards used for both the found panel and the "recent scans" list
  MUST come from one shared hardcoded pool in `src/domain` (no duplicate, independently-typed
  card lists) — replacing `006-visual-identity`'s unrelated Charizard/Blastoise/Venusaur
  placeholder rows with the cards this feature's mockups actually specify (Dragón Eterno, Fénix
  de Tormenta, Serpiente del Vacío).
- **FR-011**: A single persistent header row rendering four icon controls — language, currency,
  notifications, messages, in that order — MUST appear identically across all five shell
  destinations (not duplicated per-screen, and not limited to Inicio as it was in
  `004-home-scan-shell`), replacing `TopRightControls.tsx`'s current text-label rendering
  (`ENG/ESP`, `USD/MXN`, `Notifications`, `Messages`). Every control MUST keep a real
  accessibility label, a ≥44×44 tap target, and give visible feedback on activation (never a
  silent no-op) — matching `004`'s established SC-005 precedent — while remaining fully inert: no
  real language switch, currency conversion, notification feed, or messaging.
- **FR-012**: The language control MUST render a recognizable Mexico/USA flag-style visual per
  locale option rather than a text label — implemented without raw flag emoji (Clarifications'
  Design note on the Android rendering gap) and without a new icon/flag-asset dependency.
- **FR-013**: Inicio MUST redesign `004-home-scan-shell`'s Home/Scan screen in
  `006-visual-identity`'s shared visual language (tokens/primitives) per this spec's proposed
  content (Clarifications' Recorded default 1) — a `BrandMark`, a serif title/tagline, and a
  quick-action card navigating to the Escanear destination via `NAV_DESTINATIONS` — and MUST
  remain the screen a fully-onboarded user lands on after login/tutorial.
- **FR-014**: This feature MUST NOT modify `resolveKycRoute()` (`src/domain/kyc-gate.ts`),
  `useKycGate()`, or `KYC_ROUTE_TARGETS` (`src/features/identity/useKycGate.ts`) in any way — the
  5-destination navigation change and the Inicio redesign both change only what the existing,
  gate-agnostic `"main"` route renders (Clarifications' Recorded default 2, confirmed by direct
  source inspection).
- **FR-015**: Cartera, Trades, and Perfil MUST each render a reachable, distinctly-labelled
  placeholder screen with no real content — never an unmatched-route/404 error — living
  respectively under the already-scaffolded `src/features/portfolio/`, `src/features/trading/`,
  and `src/features/identity/` modules (Constitution Principle V), mirroring `004-home-scan-
  shell`'s Amigos/Social placeholder pattern exactly.
- **FR-016**: No file this feature adds or changes MUST import `expo-camera`, `expo-image-picker`,
  or any camera-related module, call a `Draw-a-card` backend endpoint, or read/write any
  persisted storage — the existing camera-import source-inspection guard test MUST stay green,
  extended to cover every renamed/relocated scanner file.
- **FR-017**: Every string this feature renders or changes MUST ship through the existing i18n
  layer (`src/domain/i18n`, `useTranslation`) in both Spanish and English, with zero hardcoded
  copy in a component — extending `scan.ts`'s dictionary and adding new dictionaries (navigation
  labels, Inicio copy, Cartera/Trades/Perfil placeholder copy, the found-panel's copy) as needed.
  Card names/set labels/codes/grades in the hardcoded sample-card pool are proper-noun/data
  values and are **not** run through the i18n dictionary (matching the existing precedent already
  set by `RecentScansList`'s pre-existing placeholder data). The language-picker UI itself remains
  `007-localization`'s scope, not this feature's.
- **FR-018**: Every interactive element this feature introduces or changes MUST have a real
  accessibility label and a minimum 44×44 logical-pixel tap target, and every screen this feature
  touches MUST remain usable — no clipped content, no horizontal overflow, no unreachable element
  — from a 375px-wide web viewport through desktop widths, and on phone and tablet form factors
  on iOS/Android (Constitution Principle VII).

### Key Entities

- **NavDestination** (extended, not newly introduced — `src/domain/navigation.ts`): now five
  entries (`inicio`, `escanear`, `cartera`, `trades`, `perfil`) instead of three
  (`amigos`, `home`, `social`); same shape (`key`, `route`, `label`).
- **SampleCard** (new, `src/domain`): a hardcoded card fixture — id, display name, set label,
  code, grade, formatted price, a thumbnail color token, and default condition/graded values.
  Backs both the found-card panel and the recent-scans list (FR-010). No persistence, no backend
  counterpart — pure client-side presentation data, same shape category as `006-visual-identity`'s
  design tokens.
- **FoundCardState** (new, `src/domain`): the local found-panel's state — which `SampleCard`,
  which condition option, the graded toggle, and the quantity — plus the pure transition
  functions that mutate it (select condition, toggle graded, increment/decrement quantity within
  the minimum-1 floor, advance to the next sample card, clear to idle). Zero React Native import,
  directly unit-tested (Constitution Principle IV); a thin React hook in
  `src/features/scanner` is the only RN-dependent layer wrapping it, mirroring
  `006-visual-identity`'s `useTranslation`/`LocaleContext` split between portable logic and its RN
  wrapper.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An onboarded user's cold boot (after login/tutorial) resolves to the redesigned
  Inicio screen inside the five-destination shell, with zero diff between `main` and this
  feature's branch for `src/domain/kyc-gate.ts`, `src/features/identity/useKycGate.ts`, and
  `app/_layout.tsx` (verified via `git diff`, not assumed).
- **SC-002**: All five shell destinations and all four icon controls are reachable and operable
  via keyboard alone on web and via VoiceOver (iOS)/TalkBack (Android) on native, with zero
  elements requiring pointer/touch-only interaction, on every one of the five destinations (not
  only Inicio).
- **SC-003**: Escanear's rendered output and source files on web contain zero viewfinder
  component, zero "Escanear carta" button, and zero camera-availability badge — verified by both
  a component-level rendered-output assertion and a source-inspection grep, at/above and below the
  768px breakpoint.
- **SC-004**: The found-card panel's condition selection, quantity stepper (never below 1),
  graded toggle, "Cambiar" cycling, "Eliminar", and "Aceptar" are each independently exercised and
  asserted by a real test against rendered output/behavior (not merely "doesn't crash"), triggered
  identically from mobile's button/search/dropzone and web's search/dropzone, with zero network
  call and zero camera-module import anywhere in the code exercised.
- **SC-005**: Cartera, Trades, and Perfil each render a distinct, reachable placeholder with no
  real content; Amigos and Social resolve to nothing reachable anywhere in the app (grep-verified
  route/file absence).
- **SC-006**: Every string this feature renders or changes displays fully and correctly in both
  Spanish and English with zero missing/blank strings (key-parity test, matching
  `006-visual-identity`'s established pattern).
- **SC-007**: Every screen this feature touches remains fully usable — no clipped content, no
  horizontal overflow — at a 375px-wide web viewport, at a typical desktop width, and on phone and
  tablet form factors on iOS/Android.

## Assumptions

- **No backend counterpart for this feature's own scope.** Cartera/Trades/Perfil introduce no
  data shape to keep in sync with anything on the backend today (confirmed against the backend
  repo's `feature_list.json`, 2026-08-05 — no `portfolio`/`trading`/`profile-view` bounded-context
  feature exists there yet); a future feature that gives them real content owns that cross-check
  when it happens. The backend's `008-catalog-search` (done) is a plausible future real data
  source for Escanear's search field — this feature deliberately does not call it (settled
  decision 3).
- **Currency (USD/MXN) and notifications/messages remain forward dependencies**, exactly as
  `004-home-scan-shell` already recorded — this feature only changes their *presentation* (icons
  instead of text labels, and a shell-wide position instead of Inicio-only) per settled decision
  4, not their behavior.
- **The language-picker UI is `007-localization`'s scope**, not this feature's — the language icon
  control stays inert (FR-011), and this feature's own new copy is added to the existing i18n
  dictionaries `007-localization` will build its picker on top of.
- **No dark mode, no mockup-tool chrome** — the "Dark/Mobile/Web" toggle pills and the floating
  "?" button visible in the supplied mockup images are the human's mockup-tool chrome, not app UI,
  and are not built (same exclusion `006-visual-identity`'s FR-014 already established for its own
  mockups).
- **The web sidebar's user-profile block (avatar, name, account tier) is out of scope.** The
  transcribed web mockup shows a bottom sidebar block ("JD" avatar, "Juan Doe", "@juandoe · Free")
  — this implies product state (a display name, an account tier) this app does not model or fetch
  anywhere yet, matching the exact precedent `006-visual-identity`'s FR-014 already set for the
  same sidebar's "account-tier/compliance subtitle/footer." Not built here; a future feature that
  actually has this data to show can add it.
- **A compact brand block (logo tile + wordmark) in the web sidebar is a small, low-risk addition
  consistent with "same design as the other views,"** reusing the existing `BrandMark` primitive
  — included, distinct from the excluded user-profile block above (no real user data required).
- **`expo-camera`/`expo-image-picker` remain installed dependencies** (used elsewhere, e.g.
  `001-registration-kyc`'s KYC document capture) — this feature's constraint is that no file it
  adds or changes imports them (FR-016), not that the packages are removed from `package.json`.
- **Branch timing**: this feature's branch is cut only after `006-visual-identity`'s two commits
  (`16d8620`, `44c6cc4`) are merged into `main`, so the design tokens/i18n layer/scanner shell it
  builds on actually exist on the branch base (already true as of this spec being written — see
  the git log at the top-level session context).
