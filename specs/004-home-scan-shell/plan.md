# Implementation Plan: Home & Scan Shell

**Branch**: `004-home-scan-shell` | **Date**: 2026-08-04 | **Spec**: `specs/004-home-scan-shell/spec.md`

**Input**: Feature specification from `specs/004-home-scan-shell/spec.md`

**Note**: Like `001-registration-kyc`'s plan, this folds Phase 0 (research) and Phase 1 (data
model / quickstart) into this single file rather than separate `research.md`/`data-model.md`/
`quickstart.md` documents. This feature has no data model at all (spec.md's Key Entities is
empty) and no interface-contract surface (no backend calls) — a split would produce mostly
empty files.

## Summary

Replace `app/index.tsx`'s scaffold placeholder with a real navigation shell (Amigos /
Home-Scan / Social) and the Home/Scan screen it contains, without touching
`001-registration-kyc`'s routing gate. Native (iOS/Android) renders the shell as a bottom tab
bar via `expo-router`'s `<Tabs>`; web renders it via a dedicated `.web.tsx` layout that
switches between a persistent left sidebar (≥768px) and a native-equivalent bottom bar
(<768px) — the Clarifications' Option C default. The Home/Scan screen renders a centre "+"
card affordance that navigates to a stubbed `/scan` route (the real scanner is a future
feature), plus four inert top-right placeholder controls and a top-left Amigos quick-access
pill. Amigos and Social render as reachable, contentless placeholder screens. No backend
calls anywhere in this feature.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node 20 (per `.nvmrc`) — unchanged from
`001-registration-kyc`.

**Primary Dependencies**: `expo-router` `~3.5.0` (already installed) — its own
`@react-navigation/bottom-tabs`/`native`/`native-stack` transitive dependencies already
satisfy the native tab bar (`<Tabs>`) with no new package. `@expo/vector-icons` (`^14.0.3`,
already a transitive dependency of the `expo` package) supplies tab/control icons — no new
runtime dependency required for this entire feature. `react-native-safe-area-context`
(already installed) for safe-area insets under the native tab bar.

**Storage**: N/A — this feature persists nothing (FR-010; no new "last active tab" storage
either, per spec.md's Assumptions).

**Testing**: Jest + `jest-expo` + `@testing-library/react-native` (already installed by
`001-registration-kyc`'s T001) — no new tooling task needed here, unlike `001` which had to
install it. `docs/verification.md` Levels 1/2/3/4 all apply as normal.

**Target Platform**: iOS, Android, and web (`react-native-web`) from the one Expo codebase
(Constitution I) — identical to every other feature in this repo.

**Project Type**: Single Expo (React Native) app — `app/` (expo-router screens), `src/domain`
(portable logic — here, just the breakpoint/route-table helpers), `src/features/navigation`
(new — the shell chrome), `src/features/scanner` and `src/features/social` (existing scaffold
folders, gain their first real content: placeholder screens).

**Performance Goals**: No numeric latency target beyond SC-001 (no visible flash of the prior
placeholder or an unmatched-route error on cold boot). Tab/destination switches use ordinary
`expo-router` navigation — no custom animation requirement.

**Constraints**: Must not modify `resolveKycRoute()`, `useKycGate()`, or `KYC_ROUTE_TARGETS`
(spec.md FR-009) — this feature only changes what `"main"` renders. Must not add a new
runtime dependency without checking `init.sh`'s native-dependency-alignment stage first (see
Research Decision below on why none is needed).

**Scale/Scope**: 4 user stories (shell + landing, "+" → scanner-stub navigation, Amigos/Social
placeholders, top-right inert controls); ~7 new route files, ~6 new component files, 1 new
`src/domain` file, 1 file removed (`app/index.tsx`).

## Constitution Check

*GATE: Must pass before task breakdown. Re-checked after Phase 1 design below.*

| Principle | Check | Status |
|---|---|---|
| I. One Codebase, Three Targets | All screens live under one `app/` tree; the web/native shell split is a file-extension variant (`_layout.tsx` vs. `_layout.web.tsx`) of the same route group, not a separate app. | PASS |
| II. Backend Is the Source of Truth | This feature makes zero backend calls (spec.md FR-010) — no exception to justify at all. | PASS (no exception needed) |
| III. Auth Goes Through the Provider SDK | Untouched — this feature reads no session/auth state itself; it is rendered only after `001`'s gate has already resolved `"main"`. | PASS (N/A) |
| IV. Business Logic Stays Portable | The one piece of real logic — which web layout (sidebar vs. bottom bar) a given viewport width should use, and the shared destination/route table — lives in `src/domain/navigation.ts` (zero RN imports, unit-tested). `app/(app)/_layout.tsx` (native) and `app/(app)/_layout.web.tsx` (web) are the platform split, each a thin RN-specific renderer over that shared data — no inline `Platform.OS` branch anywhere. | PASS |
| V. Screen/Component Structure Mirrors Product Domains | **Documented, narrow exception**: the shell itself (`src/features/navigation/`) has no backend bounded context to mirror — it is the cross-cutting chrome *between* domains, analogous to `app/_layout.tsx` itself (which already lives outside any feature folder). The screen *content* it hosts stays domain-aligned: the scanner-entry card lives in `src/features/scanner/` (existing scaffold), the Amigos/Social placeholders live in `src/features/social/` (existing scaffold, per spec.md's Assumptions). This is additive structure, not a contradiction of an existing MUST, so no Complexity Tracking entry is required — but it is called out here for visibility rather than left implicit. | PASS (with noted, justified exception) |
| VI. Spec Before Code, One Spec Per Feature | Single `spec.md`, platform notes (native tab bar vs. web sidebar/bottom-bar) inline per user story, matching `001`'s established pattern. | PASS |
| VII. Accessible and Responsive by Default | Every new interactive element gets an explicit accessibility label and ≥44×44 tap target as its own task (T0xx below), not left implicit; the web layout's breakpoint switch is this feature's core responsiveness mechanism. | PASS (verified at task level) |
| VIII. Local-First Development | This feature needs no backend at all to develop or verify (`expo start --web` is sufficient) — the strongest possible satisfaction of "no live cloud dependency required." | PASS |

No violations requiring a Complexity Tracking entry.

## Research Decisions

### Web navigation treatment — resolves spec.md's Clarifications (Option C)

- **Decision**: `app/(app)/_layout.web.tsx` reads `useWindowDimensions()` and renders a
  persistent left sidebar (icons + labels, `src/features/navigation/WebSidebarNav.tsx`) at
  width ≥ `BREAKPOINT_PX` (768, `src/domain/navigation.ts`), or a bottom bar
  (`src/features/navigation/WebBottomBarNav.tsx`, visually/behaviorally equivalent to the
  native tab bar) below it. Both wrap an `expo-router` `<Slot />` for the active screen.
  `src/domain/navigation.ts` exports a pure `resolveWebNavLayout(width: number): "sidebar" |
  "bottomBar"` so the breakpoint decision itself is unit-tested without rendering anything.
- **Rationale**: Keeps the platform split as a file (`.web.tsx`), per Constitution IV, and
  keeps the *decision* (which layout for which width) as portable, directly-testable logic
  rather than embedded JSX conditionals — matches `001`'s `resolveKycRoute()` pattern of
  "pure decision function + thin RN-specific consumer."
- **Alternatives considered**: A single fixed web treatment (top bar, or sidebar-always) —
  rejected per spec.md's Clarifications table (fails SC-003 at 375px, or wastes desktop space
  respectively); a third-party responsive-nav library — rejected, no such dependency exists in
  this repo today and the two layouts needed are simple enough to build directly (Constitution
  IV's "don't reach for exotic RN-web workarounds," read here as "don't add a dependency for
  something this small").

### Native tab bar — no new dependency

- **Decision**: `app/(app)/_layout.tsx` (no platform suffix — resolved on iOS/Android, and
  also the fallback if `_layout.web.tsx` were ever removed) renders `expo-router`'s `<Tabs>`,
  one `<Tabs.Screen>` per entry in `src/domain/navigation.ts`'s shared `NAV_DESTINATIONS`
  table, with `@expo/vector-icons` icons and `tabBarAccessibilityLabel` set explicitly (not
  left to icon-only defaults).
- **Rationale**: `@react-navigation/bottom-tabs` (`~6.5.7`) is already a direct dependency of
  the installed `expo-router` (confirmed in `node_modules/expo-router/package.json` and
  present under `node_modules/@react-navigation/bottom-tabs`) — no `package.json` change, so
  `init.sh`'s native-dependency-alignment stage has nothing new to flag. `@expo/vector-icons`
  (`^14.0.3`) is already a transitive dependency of the `expo` package itself.
- **Alternatives considered**: A hand-rolled bottom tab bar component — rejected, reinvents
  what `expo-router`'s `<Tabs>` already does correctly (active-state styling, accessibility
  roles, safe-area handling) for no benefit.

### Shared destination/route table

- **Decision**: `src/domain/navigation.ts` exports `NAV_DESTINATIONS: readonly
  { key: "amigos" | "home" | "social"; route: string; label: string }[]` (three entries) and
  `SCAN_ROUTE = "/scan"` as the single source of truth both `_layout.tsx` and
  `_layout.web.tsx` render from, so the three destinations' routes/labels cannot drift between
  the native and web renderers.
- **Rationale**: Constitution IV — this is the "business logic" of the shell (what the three
  destinations *are*), kept portable and out of either platform-specific layout file.
- **Alternatives considered**: Duplicating the three `<Tabs.Screen>`/sidebar-item declarations
  independently in each layout file — rejected, exactly the kind of drift Constitution IV's
  portability rule exists to prevent (two RN-specific files would each need editing in lockstep
  whenever a destination's label or route changes).

### Placeholder-control feedback mechanism

- **Decision**: Each of the four top-right controls (`src/features/navigation/
  TopRightControls.tsx`) and the Amigos/Social placeholder screens use plain local component
  state (an expanded/collapsed inline text row reading e.g. "Not yet available") rather than a
  toast/snackbar library.
- **Rationale**: Satisfies SC-005 ("never a silent no-op") with zero new dependencies;
  `react-native-web` does not implement the native `Alert.alert` well enough to rely on
  cross-platform, and pulling in a toast library for four inert buttons would be exactly the
  kind of "exotic workaround for a small need" Constitution IV cautions against.
- **Alternatives considered**: `Alert.alert` — rejected (inconsistent/absent on web); a toast
  library — rejected, unjustified new dependency for this scope.

### Screen/component placement (resolves spec.md's Assumptions)

- **Decision**: Amigos + Social placeholder screens under the existing `src/features/social/`
  scaffold; the "+" card widget and `/scan` stub screen under the existing
  `src/features/scanner/` scaffold; the shell chrome itself (tab bar config, web sidebar/
  bottom-bar, the Home/Scan composition screen, top-right controls, Amigos quick-access pill)
  under a new `src/features/navigation/` module.
- **Rationale**: Reuses the already-scaffolded domain folders where content genuinely belongs
  to that domain (per Constitution V), and isolates the one genuinely cross-cutting piece (the
  shell) into its own clearly-named module rather than forcing it into an arbitrary existing
  domain — see Constitution Check row V above.

## Project Structure

### Documentation (this feature)

```text
specs/004-home-scan-shell/
├── spec.md                 # Feature spec — one recorded-default open decision (web nav),
│                            # flagged for confirmation at the approval gate, not blocking
├── plan.md                 # This file — includes research decisions inline
├── tasks.md                # Phase 2 output (/speckit-tasks)
└── checklists/
    └── requirements.md     # Spec quality checklist
```

No separate `research.md`, `data-model.md`, `contracts/`, or `quickstart.md` — see the note
at the top of this file for why.

### Source Code (repository root)

```text
app/
├── _layout.tsx                       # existing root gate (001) — UNCHANGED. Its Stack now
│                                      # discovers the new (app) group at "/" once
│                                      # app/index.tsx is removed below.
├── index.tsx                         # REMOVED — scaffold placeholder; its purpose is now
│                                      # served by app/(app)/index.tsx (below), reached via
│                                      # the same "/" URL through the (app) group.
├── (app)/
│   ├── _layout.tsx                   # native tab bar (<Tabs>), resolved on iOS/Android
│   │                                  # [NEW]
│   ├── _layout.web.tsx               # web shell: sidebar (≥768px) or bottom bar (<768px)
│   │                                  # around a <Slot/> [NEW]
│   ├── index.tsx                     # Home/Scan screen — renders
│   │                                  # src/features/navigation/HomeScreen.tsx [NEW]
│   ├── amigos.tsx                    # renders
│   │                                  # src/features/social/AmigosPlaceholderScreen.tsx [NEW]
│   └── social.tsx                    # renders
│                                      # src/features/social/SocialPlaceholderScreen.tsx [NEW]
└── scan.tsx                          # scanner route boundary — renders
                                       # src/features/scanner/ScanPlaceholderScreen.tsx [NEW]

src/domain/
└── navigation.ts                     # NEW — NAV_DESTINATIONS, SCAN_ROUTE, BREAKPOINT_PX,
                                       # resolveWebNavLayout(width). Pure, zero RN imports.

src/features/navigation/              # NEW module (Constitution V exception, see above)
├── README.md                         # NEW — states explicitly this module has no backend
│                                      # counterpart and why it exists (mirrors the existing
│                                      # per-domain README pattern)
├── HomeScreen.tsx                    # NEW — composes ScanEntryCard (from scanner),
│                                      # TopRightControls, AmigosQuickAccessPill
├── TopRightControls.tsx              # NEW — the four inert placeholder controls
├── AmigosQuickAccessPill.tsx         # NEW — top-left pill, navigates to the same /amigos
│                                      # route as the shell's Amigos tab (FR-008)
├── WebSidebarNav.tsx                 # NEW — ≥768px web treatment
└── WebBottomBarNav.tsx               # NEW — <768px web treatment (mirrors native tab bar)

src/features/scanner/                 # existing scaffold, gains its first real files
├── README.md                         # existing, unchanged
├── ScanEntryCard.tsx                 # NEW — the centre "+" card affordance + navigation
│                                      # call to /scan
└── ScanPlaceholderScreen.tsx         # NEW — /scan's stub destination content

src/features/social/                  # existing scaffold, gains its first real files
├── README.md                         # existing, unchanged
├── AmigosPlaceholderScreen.tsx       # NEW
└── SocialPlaceholderScreen.tsx       # NEW
```

**Structure Decision**: Single Expo project (Constitution I) — no new top-level split. New
routes live under `app/(app)/` (the tab/shell group) plus one standalone `app/scan.tsx` (a
route boundary, not a tab). Supporting UI is split across the new `src/features/navigation/`
module (the shell chrome) and the two existing `src/features/scanner/`/`src/features/social/`
scaffolds (domain content), per the Research Decisions above. Platform variance uses the
`.web.tsx` convention (only file-extension split needed for this feature) rather than inline
`Platform.OS` branches, per Constitution IV and `docs/conventions.md`.

## Data Model

None — spec.md's Key Entities section is explicitly empty (FR-010: no backend calls, no
persisted entity). The only "data" this feature introduces is the static
`NAV_DESTINATIONS`/`SCAN_ROUTE` table in `src/domain/navigation.ts`, which is configuration,
not a domain entity.

## Quickstart Validation

Once tasks are implemented, validate manually per `docs/verification.md` Level 3
(`npm run web`) plus the relevant simulator for platform-specific paths:

1. With a mocked/fixture onboarded user (`kycStatus: "pending"` or `"verified"`, tutorial
   complete), cold-boot the app (web) → confirm it lands on the Home/Scan screen with the
   shell visible, no flash of the old scaffold placeholder.
2. At a 375px-wide browser window, confirm the bottom-bar web treatment renders with no
   horizontal overflow; resize past 768px and confirm it live-switches to the sidebar
   treatment without losing the active destination.
3. Select Amigos, then Social, then Home/Scan again from the shell → confirm each renders its
   own distinct placeholder/screen and Home/Scan's state is unchanged on return.
4. Press the top-left Amigos pill from Home/Scan → confirm it lands on the exact same Amigos
   screen as the tab, with the shell's Amigos destination shown active.
5. Press the centre "+" card → confirm navigation to `/scan`'s stub screen (not camera UI, not
   an unmatched-route error); navigate back → confirm the shell/Home screen is intact.
6. Activate each of the four top-right controls (mouse + keyboard-only pass) → confirm each
   gives visible "not yet available" feedback, and that keyboard focus order/visible focus
   ring covers all of them plus the shell's own destinations.
7. Repeat steps 1, 3, 4, 5 on iOS and Android simulators — confirm the native bottom tab bar
   renders correctly (safe-area insets respected) and VoiceOver/TalkBack announces real labels
   for every new interactive element (SC-002/SC-004).

## Complexity Tracking

*No Constitution Check violations — table intentionally empty.*
