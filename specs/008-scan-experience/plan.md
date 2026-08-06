# Implementation Plan: Scan Experience

**Branch**: `008-scan-experience` | **Date**: 2026-08-05 | **Spec**: `specs/008-scan-experience/spec.md`

**Input**: Feature specification from `specs/008-scan-experience/spec.md`

**Note**: Like `004-home-scan-shell` and `006-visual-identity`, this folds Phase 0 (research) and
Phase 1 (data model / quickstart) into this single file rather than separate `research.md`/
`data-model.md`/`quickstart.md` documents — this feature has no backend-facing contract (spec.md's
"Related backend spec: none"), so a `contracts/` directory would hold nothing.

## Summary

Replace the shell's three destinations (Amigos/Home/Social) with five (Inicio/Escanear/Cartera/
Trades/Perfil) in `src/domain/navigation.ts`, moving Escanear from a standalone `/scan` route
into the persistent shell itself (reversing `006-visual-identity`'s Recorded default 3). Redesign
`004-home-scan-shell`'s Home screen as Inicio, in `006`'s visual language. Rebuild the four
top-right placeholder controls as icon-only and move them from Inicio-only into a single shared
shell-header component rendered on every destination. Add a hardcoded three-card sample pool and
a small, portable found-card state machine (`src/domain`) that both the mobile viewfinder-driven
Escanear shell and the web search/upload-only Escanear shell trigger identically, rendering a
shared `FoundCardPanel` with real local condition/quantity/graded interactions. Add Cartera/
Trades/Perfil as contentless placeholders under their already-scaffolded domain modules, and
retire Amigos/Social outright. Zero backend calls, zero camera-module import, zero diff to
`001-registration-kyc`'s KYC gate anywhere in this feature.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node 20 (per `.nvmrc`) — unchanged.

**Primary Dependencies**: none new. `@expo/vector-icons` (already a transitive dependency,
already used by `004`'s tab icons and `006`'s scanner glyphs) supplies every new icon this
feature needs (scan-frame, briefcase, swap-arrows, person, bell, chat-bubble). The language
control's Mexico/USA flag visual is a hand-drawn two-letter badge built from existing `View`/
`Text` primitives and `src/theme` tokens — no flag-icon package, no emoji, no new asset pipeline
(spec.md's Design note on the Android flag-emoji rendering gap).

**Storage**: N/A — this feature persists nothing. The found-card state resets to idle on every
navigation away from Escanear (spec.md's Edge Cases) and on cold boot, exactly like `004`'s "no
new last-active-tab persistence" precedent.

**Testing**: Jest + `jest-expo` + `@testing-library/react-native` (already installed) — no new
tooling task. `docs/verification.md` Levels 1–5 apply as normal; Level 1 gains one new category
of pure-logic test this feature is genuinely rich in (`src/domain/scanResults.ts`'s condition/
quantity/graded/cycling transition functions), matching the "portable, zero-RN-import, directly
testable" shape Constitution IV asks for.

**Target Platform**: iOS, Android, and web (`react-native-web`) from the one Expo codebase
(Constitution I) — identical to every other feature in this repo.

**Project Type**: Single Expo (React Native) app. Touches `app/(app)/` (route files),
`src/domain/navigation.ts` and a new `src/domain/scanResults.ts`, `src/domain/i18n/copy/*` (new
and extended dictionaries), `src/features/navigation/` (shell chrome — extended, one file
retired), `src/features/scanner/` (Escanear content — extended, one new domain-logic hook + one
new shared panel component), and three already-scaffolded domain modules
(`src/features/portfolio/`, `src/features/trading/`, `src/features/identity/`) each gaining their
first placeholder screen.

**Performance Goals**: No numeric latency target beyond the existing screens' — the found-state
trigger is synchronous local `useState`, no async work, no loading state to gate.

**Constraints**:
- Must not modify `resolveKycRoute()`, `useKycGate()`, or `KYC_ROUTE_TARGETS` (spec.md FR-014,
  confirmed unnecessary by direct source inspection — see Clarifications' Recorded default 2).
- Must not add a new runtime dependency (spec.md's Design note on the flag badge; every icon this
  feature needs already exists in the installed `@expo/vector-icons` set).
- Must keep the camera-import source-inspection guard green across every file this feature
  touches under `src/features/scanner/` (spec.md FR-016).
- Every new/changed string routes through `src/domain/i18n` (spec.md FR-017) — no hardcoded copy.

**Scale/Scope**: 6 user stories (shell + shared header, found-state domain logic, mobile Escanear,
web Escanear, Inicio redesign, Cartera/Trades/Perfil + Amigos/Social retirement); 1 new
`src/domain` module; 1 new i18n copy dictionary (+ 2 extended); ~6 new component files under
`src/features/navigation`/`src/features/scanner`; 3 new placeholder screens; 6 route files
added/changed under `app/(app)/`; 1 standalone route (`app/scan.tsx`) and 5 files removed.

## Constitution Check

*GATE: Must pass before task breakdown. Re-checked after Phase 1 design below.*

| Principle | Check | Status |
|---|---|---|
| I. One Codebase, Three Targets | One shell, one Escanear screen; every platform difference (viewfinder/button presence, single vs. two-column) is a `.web.tsx` file variant or a `useWindowDimensions()`-driven branch inside the already-established `.web.tsx` file, never a second app. | PASS |
| II. Backend Is the Source of Truth | Zero backend calls anywhere in this feature (spec.md FR-016) — no exception to justify. | PASS (N/A) |
| III. Auth Goes Through the Provider SDK | Untouched — this feature reads no session/auth state itself; it renders only after `001`'s gate has already resolved `"main"`. | PASS (N/A) |
| IV. Business Logic Stays Portable | The found-card state machine (`src/domain/scanResults.ts` — condition/quantity/graded/cycling transitions, zero RN import, directly unit-tested) and the shared destination table (`src/domain/navigation.ts`, extended in place) are the two pieces of real logic here; `src/features/scanner/useScanSimulation.ts` is the thin RN-dependent `useState` wrapper around the former, mirroring `006-visual-identity`'s `translate()`/`LocaleContext` split exactly. Platform-specific rendering (viewfinder+button present/absent, one vs. two columns) stays in the existing `.web.tsx` file pair, no inline `Platform.OS` branch added. | PASS |
| V. Screen/Component Structure Mirrors Product Domains | Cartera/Trades/Perfil placeholders land in the already-scaffolded `src/features/portfolio/`, `src/features/trading/`, `src/features/identity/` modules (no new Constitution V exception needed for them). The shell header/icon-control row extends the existing, already-justified `src/features/navigation/` exception (established by `004`) — no new exception category. `FoundCardPanel`/`useScanSimulation`/the sample-card pool stay under `src/features/scanner/`/`src/domain`, the scanner's own existing domain, not a new module. | PASS (reuses existing, justified exceptions — no new ones) |
| VI. Spec Before Code, One Spec Per Feature | Single `spec.md`, platform notes inline per user story. | PASS |
| VII. Accessible and Responsive by Default | Every new/changed interactive element keeps an explicit accessibility label and ≥44×44 target as its own task; the icon-only controls specifically get real accessibility labels since they lose their visible text labels (spec.md FR-011/FR-012). | PASS (verified at task level) |
| VIII. Local-First Development | This feature needs no backend at all to develop or verify (`expo start --web` is sufficient). | PASS |

No violations requiring a Complexity Tracking entry.

## Research Decisions

### Escanear moves inside the shell — reversing `006-visual-identity`'s Recorded default 3

- **Decision**: `app/scan.tsx` (the standalone route, its manual "Back to Home" affordance, and
  its test) are retired. A new `app/(app)/escanear.tsx` renders `ScanShellScreen`/
  `ScanShellScreen.web.tsx` (unchanged file names — see below) as one of the five `<Tabs.Screen>`/
  sidebar-or-bottom-bar entries, exactly like `app/(app)/index.tsx` already does for Inicio.
  `src/domain/navigation.ts`'s `SCAN_ROUTE` constant is removed — `HomeScreen.tsx`'s quick-action
  card now looks up the `escanear` entry from `NAV_DESTINATIONS` the same way `AmigosQuickAccessPill`
  looked up `amigos` in `004` (before this feature retires that component), so the route can never
  drift from the shell's own destination table.
- **Rationale**: The 5-destination mockups this feature implements show Escanear as an active tab/
  sidebar item inside the persistent shell on both mobile and web — the exact structural change
  `006`'s Recorded default 3 explicitly declined to make (because no 5-destination nav existed
  yet at the time, and the mockups it worked from never depicted Escanear as a shell member).
  Settled decision 1 in this feature ("replace the shell's three destinations with the mockup's
  five") supersedes that earlier default directly; spec.md's FR-003 records the reversal
  explicitly rather than leaving it implicit.
- **Alternatives considered**: Keeping `/scan` standalone and adding a *sixth*, redundant
  "Escanear" tab that also links to it — rejected, produces two different UIs for what the
  mockups show as one destination, and leaves `/scan`'s manual "Back" affordance pointless once a
  persistent shell already surrounds every other destination.

### Found-card state machine — pure `src/domain` logic, one thin `useState` hook

- **Decision**: `src/domain/scanResults.ts` exports `SampleCard`, `ConditionOption`,
  `CONDITION_OPTIONS`, `SAMPLE_CARDS` (the three mockup-specified cards), `MIN_QUANTITY`, and pure
  functions `startFoundState(card)`, `selectCondition(state, condition)`, `toggleGraded(state)`,
  `incrementQuantity(state)`, `decrementQuantity(state)` (clamped at `MIN_QUANTITY`),
  `advanceToNextCard(state)` (cycles `SAMPLE_CARDS`, re-seeding condition/graded/quantity to the
  next card's own defaults per spec.md FR-009), plus two pure formatting helpers,
  `formatListMeta(card)` (`"${grade} · ${code}"`, for `RecentScansList`) and
  `formatDetailMeta(card)` (`"${setLabel} · ${code}"`, for `FoundCardPanel`) — all zero-RN-import,
  directly unit-tested (Level 1). `src/features/scanner/useScanSimulation.ts` is the only
  RN-dependent layer: a `useState<FoundCardState | null>` wrapper exposing `result`,
  `triggerScan()`, `changeCard()`, `removeCard()`, `acceptCard()` (gives a brief local
  confirmation flag, then clears to idle), and pass-throughs for condition/graded/quantity, all of
  which just call the pure `src/domain` functions and set state.
- **Rationale**: This is the one genuinely reusable piece of business logic in this feature —
  both `ScanShellScreen.tsx` (mobile) and `ScanShellScreen.web.tsx` (web) need identical
  transition rules behind visually different triggers/layouts (spec.md User Story 2 is explicitly
  Foundational and platform-agnostic for exactly this reason). Keeping it in `src/domain` and unit
  testing it directly, rather than only through a component render, is what
  `docs/verification.md`'s anti-pattern list explicitly asks for, and matches
  `006-visual-identity`'s own `translate()`/`LocaleContext` precedent for the same shape of split.
- **Alternatives considered**: Duplicating the transition logic inline in both
  `ScanShellScreen.tsx` and `ScanShellScreen.web.tsx` — rejected, exactly the kind of drift-prone
  duplication Constitution IV's portability rule and `docs/conventions.md`'s "extreme consistency"
  principle both argue against, especially since "Cambiar"'s re-seeding rule (FR-009) is easy to
  get subtly wrong twice.

### Sample-card pool — single source for both the found panel and the recent-scans list

- **Decision**: `SAMPLE_CARDS` (see above) replaces `RecentScansList.tsx`'s existing local
  `PLACEHOLDER_ROWS` array — `RecentScansList` imports the shared pool and calls
  `formatListMeta()` per row instead of maintaining its own hand-typed `PlaceholderScanRow[]`.
  `FoundCardPanel` reads the same `SampleCard` shape via `useScanSimulation()`'s `result.card`.
- **Rationale**: Both lists describe the same three cards in the actual mockups (Dragón Eterno/
  Fénix de Tormenta/Serpiente del Vacío) — keeping two independently-hand-typed lists (as `006`
  briefly did with its own placeholder Pokémon-named set, written before this mockup existed)
  is exactly the duplication this repo's conventions discourage. Card names/codes/grades stay
  outside the i18n dictionary (spec.md FR-017) — they are data, not UI chrome, matching the
  precedent `006`'s original `RecentScansList` already set.
- **Alternatives considered**: Keeping `RecentScansList`'s own list and adding a *second*,
  separate pool for the found panel — rejected per the reasoning above.

### Shell header — one shared component, three consumption points, zero per-screen duplication

- **Decision**: `src/features/navigation/ShellHeader.tsx` renders `TopRightControls` (rewritten
  in place to icon-only controls, see below) with the same `useSafeAreaInsets()`-aware top/right
  padding `HomeScreen.tsx` used to apply itself. It is consumed from exactly three places: (1)
  `app/(app)/_layout.tsx`'s native `<Tabs screenOptions={{ header: () => <ShellHeader /> }}>` (a
  custom header replaces the previous `headerShown: false`, so no per-screen file renders its own
  copy); (2) `WebSidebarNav.tsx`'s content column, above its `<Slot />`; (3)
  `WebBottomBarNav.tsx`'s content column, above its `<Slot />` — matching how both web layouts
  already wrap `<Slot />` today, just adding one more child above it. `HomeScreen.tsx` (Inicio) no
  longer renders `TopRightControls` or `AmigosQuickAccessPill` itself.
- **Rationale**: Satisfies spec.md FR-011's "not duplicated per-screen, appears identically across
  all five destinations" directly — three consumption points (one native, two web) is the
  minimum possible given the existing native-`<Tabs>`-vs-web-layout-pair structure `004` already
  established, and each is a one-line addition to an already-existing wrapper, not a new
  structural pattern.
- **Alternatives considered**: Rendering `TopRightControls` inside each of the five destination
  screens individually — rejected, exactly the "five copies that could drift" duplication FR-011
  exists to prevent, and the literal shape of `004`'s original, now-superseded, Home-only
  placement.

### Icon-only controls, with a hand-drawn flag badge for language

- **Decision**: `TopRightControls.tsx` is rewritten from four bordered text buttons (`"ENG/ESP"`,
  `"USD/MXN"`, `"Notifications"`, `"Messages"`) to four icon buttons: a new small `FlagBadge`
  subcomponent (a rounded chip with `"MX"`/`"US"` text, `src/theme` tokens only, no new asset) for
  language, `@expo/vector-icons`' `cash-outline` for currency, `notifications-outline` for
  notifications, `chatbubble-outline` for messages. The existing "press → inline 'not yet
  available' text" feedback mechanism (`004`'s established, tested pattern) is kept as-is, just
  attached to icon buttons instead of text-label buttons — no new feedback mechanism invented.
  Every button's `accessibilityLabel` stays a full sentence (e.g. "Language, Spanish or English —
  not yet available"), now carrying strictly more information than the visible icon alone, per
  spec.md FR-011/FR-012 and Constitution VII.
- **Rationale**: Spec.md's settled decision 4 explicitly says "icons only." Real flag emoji is
  unsafe cross-platform (spec.md's Design note — stock Android's emoji font does not reliably
  render regional-indicator flag sequences as flags); a hand-drawn two-letter badge avoids both
  the Android gap and a new icon-package dependency, matching Constitution IV's "don't reach for
  exotic workarounds" guidance from the other direction (don't add a dependency for something this
  small, either).
- **Alternatives considered**: A real flag SVG/PNG asset pair — rejected, a new asset pipeline
  and a licensing/attribution question for two small icons is disproportionate to what four inert
  placeholder controls need; `react-native-svg`-based flag icon packages — rejected, unjustified
  new dependency for the same reason `006`'s plan.md rejected a toast library for four inert
  buttons.

### Inicio (`HomeScreen.tsx`) — restyled in place, not renamed

- **Decision**: `src/features/navigation/HomeScreen.tsx` keeps its filename (it is still "the
  Home/Scan screen" conceptually, now specifically Inicio's content) but its body is rewritten:
  drop `AmigosQuickAccessPill` and `TopRightControls` (both now owned elsewhere — retired and
  moved to `ShellHeader`, respectively), keep the centre card affordance
  (`src/features/scanner/ScanEntryCard.tsx`, unchanged component) but repoint its `onPress` to the
  `escanear` entry of `NAV_DESTINATIONS` instead of the retired `SCAN_ROUTE` constant, and add a
  `BrandMark` + `display.xl` title + tagline above it, per spec.md's Recorded default 1 and
  `006-visual-identity`'s established primitives.
- **Rationale**: Reuses the exact, already-tested `ScanEntryCard` press-to-navigate pattern rather
  than inventing a new affordance for the same underlying action ("go start a scan"); keeping the
  filename avoids a needless rename of every import site the moment the file's *content* is the
  actual thing changing, matching this repo's general preference (contrast with `006`'s explicit
  choice to rename `ScanPlaceholderScreen` → `ScanShellScreen`, which was justified there because
  the old name had become actively misleading about what the file held — `HomeScreen.tsx`'s name
  never implied "no content yet" the way "Placeholder" did).
- **Alternatives considered**: Renaming to `InicioScreen.tsx` — rejected as churn with no
  behavioral benefit; every import site (`app/(app)/index.tsx`, tests) would need updating for a
  purely cosmetic rename.

### Placeholder screens — reuse the exact `004` pattern, now localized

- **Decision**: `src/features/portfolio/CarteraPlaceholderScreen.tsx`,
  `src/features/trading/TradesPlaceholderScreen.tsx`, and
  `src/features/identity/PerfilPlaceholderScreen.tsx` each mirror
  `AmigosPlaceholderScreen.tsx`'s exact shape (a header-role title + a body paragraph explaining
  "no content yet") — but, unlike the original Amigos/Social placeholders (hardcoded English,
  predating this app's i18n layer), copy routes through `src/domain/i18n` in both locales,
  matching spec.md FR-017.
- **Rationale**: No reason to invent a different placeholder shape for three screens that serve
  the exact same purpose `004`'s two placeholders already served — reusing a proven pattern is
  lower-risk than a new one, and localizing it costs nothing new (the i18n layer already exists,
  unlike when `004` was built).
- **Alternatives considered**: None — this is a direct, low-risk continuation of an established
  pattern with no material design question to weigh.

## Project Structure

### Documentation (this feature)

```text
specs/008-scan-experience/
├── spec.md                 # Feature spec — two recorded-default decisions flagged for
│                            # confirmation at the approval gate, several resolved Design notes
├── plan.md                 # This file — includes research decisions inline
├── tasks.md                # Phase 2 output (/speckit-tasks)
└── checklists/
    └── requirements.md     # Spec quality checklist
```

No separate `research.md`, `data-model.md`, `contracts/`, or `quickstart.md` — see the note at
the top of this file.

### Source Code (repository root)

```text
app/
├── scan.tsx                          # REMOVED — Escanear moves inside the shell
├── scan.test.tsx                     # REMOVED
└── (app)/
    ├── _layout.tsx                   # MODIFIED — 5 destinations (was 3); adds a custom
    │                                  # screenOptions.header rendering ShellHeader
    ├── _layout.web.tsx               # UNCHANGED — still just resolveWebNavLayout(width)
    ├── index.tsx                     # UNCHANGED file — renders the redesigned HomeScreen (Inicio)
    ├── escanear.tsx                  # NEW — renders ScanShellScreen (moved from app/scan.tsx),
    │                                  # no standalone "Back" affordance (the shell provides
    │                                  # navigation away, like every other destination)
    ├── cartera.tsx                   # NEW — renders CarteraPlaceholderScreen
    ├── trades.tsx                    # NEW — renders TradesPlaceholderScreen
    ├── perfil.tsx                    # NEW — renders PerfilPlaceholderScreen
    ├── amigos.tsx                    # REMOVED
    ├── amigos.test.tsx               # REMOVED
    ├── social.tsx                    # REMOVED
    └── social.test.tsx               # REMOVED

src/domain/
├── navigation.ts                     # MODIFIED — NavDestinationKey/NAV_DESTINATIONS become
│                                      # inicio/escanear/cartera/trades/perfil; SCAN_ROUTE removed
├── navigation.test.ts                # MODIFIED
├── scanResults.ts                    # NEW — SampleCard, ConditionOption, CONDITION_OPTIONS,
│                                      # SAMPLE_CARDS, MIN_QUANTITY, FoundCardState + pure
│                                      # transition functions, formatListMeta/formatDetailMeta
├── scanResults.test.ts               # NEW
└── i18n/copy/
    ├── scan.ts                       # MODIFIED — extended with found-panel/viewfinder-found copy
    ├── scan.test.ts                  # MODIFIED
    ├── nav.ts                        # NEW — 5 destination labels + icon-control accessibility
    │                                  # copy (language/currency/notifications/messages) +
    │                                  # sidebar wordmark/tagline
    ├── nav.test.ts                   # NEW
    ├── home.ts                       # NEW — Inicio's title/tagline/quick-action copy
    ├── home.test.ts                  # NEW
    ├── placeholders.ts               # NEW — Cartera/Trades/Perfil placeholder copy
    └── placeholders.test.ts          # NEW

src/features/navigation/
├── HomeScreen.tsx                    # MODIFIED — Inicio's redesigned content (see Research
│                                      # Decisions); drops AmigosQuickAccessPill/TopRightControls
├── HomeScreen.test.tsx               # MODIFIED
├── HomeScreen.integration.test.tsx   # MODIFIED
├── TopRightControls.tsx              # MODIFIED — icon-only controls (language FlagBadge,
│                                      # currency/notifications/messages icons), same inline
│                                      # feedback mechanism as before
├── TopRightControls.test.tsx         # MODIFIED
├── ShellHeader.tsx                   # NEW — safe-area-aware wrapper around TopRightControls,
│                                      # consumed by the native Tabs header and both web layouts
├── ShellHeader.test.tsx              # NEW
├── WebSidebarNav.tsx                 # MODIFIED — renders ShellHeader above <Slot/>; adds a
│                                      # compact BrandMark + wordmark block at the top (no
│                                      # user-profile/tier block — spec.md Assumptions)
├── WebSidebarNav.test.tsx            # MODIFIED
├── WebBottomBarNav.tsx               # MODIFIED — renders ShellHeader above <Slot/>
├── WebBottomBarNav.test.tsx          # MODIFIED
├── AmigosQuickAccessPill.tsx         # REMOVED
├── AmigosQuickAccessPill.test.tsx    # REMOVED
├── AppWebLayout.test.tsx             # MODIFIED (if any destination-count assumptions exist)
└── README.md                         # MODIFIED

src/features/scanner/
├── ScanShellScreen.tsx               # MODIFIED — enabled "Escanear carta" button wired to
│                                      # useScanSimulation().triggerScan(); renders FoundCardPanel
│                                      # inline below the controls when a card is found
├── ScanShellScreen.web.tsx           # MODIFIED — Viewfinder/PrimaryButton/StatusPill removed
│                                      # from the left column; right column renders
│                                      # EmptyResultsPanel (idle) or FoundCardPanel (found) above
│                                      # RecentScansList (always visible)
├── ScanShellScreen.test.tsx          # MODIFIED — camera-import guard extended to every new/
│                                      # renamed file this feature adds under src/features/scanner/
├── Viewfinder.tsx                    # MODIFIED — accepts `state: "idle" | "found"`; found state
│                                      # renders a glowing scan-line + check glyph +
│                                      # "¡Carta encontrada!" instead of the grid/brackets/hint
├── Viewfinder.test.tsx               # MODIFIED
├── ScanSearchField.tsx               # MODIFIED — accepts `onSubmit` (Enter key / magnifier tap)
├── ScanSearchField.test.tsx          # MODIFIED
├── UploadDropzone.tsx                # MODIFIED — becomes a real Pressable (`onPress`),
│                                      # accessibilityRole="button" — disclosed behavior change
│                                      # from 006's intentionally-inert version, since it is now
│                                      # a genuine local trigger (spec.md FR-007)
├── UploadDropzone.test.tsx           # MODIFIED
├── FoundCardPanel.tsx                # NEW — the shared found-card detail panel (thumbnail,
│                                      # name, meta, grade/price pills, Eliminar/Cambiar links,
│                                      # Gradeada toggle + grade value, condition chips, quantity
│                                      # stepper, market price, Aceptar), used inline (mobile) and
│                                      # in the right column (web)
├── FoundCardPanel.test.tsx           # NEW
├── useScanSimulation.ts              # NEW — the RN useState wrapper around
│                                      # src/domain/scanResults.ts's pure functions
├── useScanSimulation.test.tsx        # NEW
├── RecentScansList.tsx               # MODIFIED — reads SAMPLE_CARDS from src/domain/
│                                      # scanResults.ts instead of its own local PLACEHOLDER_ROWS
├── RecentScansList.test.tsx          # MODIFIED
├── EmptyResultsPanel.tsx             # UNCHANGED
└── EmptyResultsPanel.test.tsx        # UNCHANGED

src/features/portfolio/
├── CarteraPlaceholderScreen.tsx      # NEW
├── CarteraPlaceholderScreen.test.tsx # NEW
└── README.md                         # MODIFIED (first real file added)

src/features/trading/
├── TradesPlaceholderScreen.tsx       # NEW
├── TradesPlaceholderScreen.test.tsx  # NEW
└── README.md                         # MODIFIED

src/features/identity/
├── PerfilPlaceholderScreen.tsx       # NEW — distinct from the existing registration-flow
│                                      # ProfileForm.tsx (spec.md User Story 6, AS3)
├── PerfilPlaceholderScreen.test.tsx  # NEW
└── README.md                         # MODIFIED

src/features/social/
├── AmigosPlaceholderScreen.tsx       # REMOVED
├── AmigosPlaceholderScreen.test.tsx  # REMOVED
├── SocialPlaceholderScreen.tsx       # REMOVED
├── SocialPlaceholderScreen.test.tsx  # REMOVED
└── README.md                         # UNCHANGED — module reverts to the bare pre-004 scaffold
```

**Structure Decision**: Single Expo project (Constitution I). No new top-level module — every
addition lands in an already-scaffolded or already-`004`-justified location
(`src/features/navigation/`'s existing Constitution V exception, `src/features/scanner/`'s
existing domain, and `src/features/portfolio/`/`trading/`/`identity/`'s pre-existing scaffolds).
Platform variance stays expressed via the existing `.web.tsx` file pair for Escanear and the
native-`<Tabs>`-vs-web-layout-pair for the shell — no inline `Platform.OS` branch added anywhere
by this feature.

## Data Model

- **NavDestination** (`src/domain/navigation.ts`, extended in place): `{ key: "inicio" |
  "escanear" | "cartera" | "trades" | "perfil"; route: string; label: string }`. No persistence.
- **SampleCard** (`src/domain/scanResults.ts`, new): `{ id: string; name: string; setLabel:
  string; code: string; grade: string; priceLabel: string; thumbnailColorToken: string;
  defaultCondition: ConditionOption; defaultGraded: boolean }`. Static, compiled-in data — no
  persistence, no backend counterpart (spec.md FR-010).
- **ConditionOption**: `"nearMint" | "excellent" | "veryGood" | "good" | "fair"` — an identifier
  union, not a display string; display labels are looked up through `src/domain/i18n/copy/
  scan.ts`.
- **FoundCardState** (`src/domain/scanResults.ts`, new): `{ card: SampleCard; condition:
  ConditionOption; graded: boolean; quantity: number } | null` (`null` = idle). No persistence —
  lives only in `useScanSimulation()`'s component-local `useState`, reset on unmount/navigation
  away (spec.md's Edge Cases).

## Interface Contracts

No backend HTTP contract, no Supabase SDK contract — this feature calls neither. The one internal
surface a later feature is expected to build on:

| Consumer-facing surface | Shape | Who depends on it next |
|---|---|---|
| `src/domain/scanResults.ts` (`SampleCard`, `SAMPLE_CARDS`, `FoundCardState`, transition functions) | Plain TypeScript, zero RN import | A future real scanner/recognition feature replaces `SAMPLE_CARDS`/the local trigger with a genuine camera+recognition+backend-search pipeline, and a future portfolio feature turns `acceptCard()`'s no-op confirmation into a real "add to my collection" call — both without needing to change `FoundCardPanel`'s prop shape, only what feeds it |
| `src/features/navigation/ShellHeader.tsx` | `{}` (no props — reads nothing but the theme/i18n context) | `007-localization`'s picker replaces `TopRightControls`' language control's inert press-handler with a real `useLocale().setLocale()` call, without needing to move where the control renders |

## Quickstart Validation

Once tasks are implemented, validate manually per `docs/verification.md` Level 3 (`npm run web`)
plus the relevant simulator/device for the platform-parity pass:

1. From a fixture user resolving to `"main"`, cold-boot at a mobile-width web viewport — confirm
   it lands on the redesigned Inicio screen inside a five-destination shell (Inicio active), with
   the four icon controls visible top-right.
2. Select Escanear, Cartera, Trades, Perfil in turn from the shell — confirm each renders its own
   distinct content with the same shell (including the icon row) intact, and Inicio again shows
   its content unchanged on return.
3. On Escanear (mobile width), confirm the idle viewfinder/search/dropzone/enabled button render;
   press the button — confirm the viewfinder switches to its found drawing and the found-card
   panel appears inline below the controls with Dragón Eterno's data.
4. Exercise the found panel: switch condition chips, use the quantity +/− stepper (never below
   1), toggle "Gradeada", press "Cambiar" (confirm the next sample card's own defaults apply, not
   the previous card's), press "Eliminar" (confirm return to idle), re-trigger and press "Aceptar"
   (confirm a visible confirmation then return to idle).
5. Resize to a desktop web width (≥768px) on Escanear — confirm no viewfinder, no "Escanear
   carta" button, and no "Cámara disponible" badge anywhere in the two-column layout; submit the
   search field or tap the upload dropzone — confirm the right column's empty-results panel is
   replaced by the found-card panel, with the recent-scans list still visible below it.
6. Resize below 768px on Escanear (web) — confirm the two columns collapse to one, with the
   mobile-only viewfinder/button still absent (this is web, not native).
7. Toggle the locale context between `"es"` and `"en"` on every screen touched by this feature —
   confirm every visible string (including the new nav labels, Inicio copy, placeholder copy, and
   found-panel copy) changes with nothing left blank.
8. Confirm — via `grep -rn "expo-camera\|expo-image-picker" src/features/scanner/` — zero matches,
   and that `ScanShellScreen.test.tsx`'s source-inspection test passes for every file this feature
   added under `src/features/scanner/`.
9. Confirm — via `git diff main -- src/domain/kyc-gate.ts src/features/identity/useKycGate.ts
   app/_layout.tsx` — an empty diff.
10. Confirm — via `grep -rn "amigos\|Amigos\|social\|Social" app/ src/features/navigation/
    src/features/social/ src/domain/navigation.ts` — zero remaining references outside
    `src/features/social/README.md`'s bare scaffold text.
11. Repeat steps 1–6 on iOS and Android simulators/devices — confirm the native tab bar shows all
    five destinations with the persistent header rendering above each screen's content, and that
    VoiceOver/TalkBack announces real labels for every icon control and every new interactive
    element in the found panel.
12. At a 375px-wide browser window and a typical desktop width, confirm no clipped content or
    horizontal overflow on any of the five destinations (spec.md SC-007).

## Complexity Tracking

*No Constitution Check violations — table intentionally empty.*
