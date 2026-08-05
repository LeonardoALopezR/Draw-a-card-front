# Feature Specification: Home & Scan Shell

**Feature Branch**: `004-home-scan-shell`

**Created**: 2026-08-04

**Status**: Clarified (one open design decision recorded below with a chosen default —
flagged for explicit human confirmation or override at the `spec_ready` approval gate, not a
blocking `[NEEDS CLARIFICATION]`)

**Input**: User description: a hand-drawn wireframe of the authenticated home/scan screen,
relayed via `feature_list.json`'s `004-home-scan-shell` entry (see that entry for the full
verbatim transcription of the sketch — top-left "Amigos" pill; top-right vertical stack of
four controls (ENG/ESP, USD/MXN, Notifications, Messages); dead-centre large vertical
rounded-rectangle "+" card placeholder; bottom-edge "social" bar). Scope = the persistent
navigation shell (Amigos / Home-Scan / Social) plus the Home/Scan screen's placeholder
affordances. Explicitly **not** in scope: any real Amigos or Social content, and the scanner
itself (camera, capture, recognition) — the centre "+" only defines and wires the route
boundary to that not-yet-built feature.

**No backend counterpart**: unlike `001-registration-kyc`, this feature calls no backend
endpoint. It is UI-shell work only — three navigable destinations, one route boundary to a
stubbed future screen, and four inert placeholder controls. Nothing here should invent an API
contract; where a control implies a future backend-backed feature (translation, currency
conversion, notifications, messaging), that is recorded under Assumptions as a forward
dependency, not built here.

**Integration point**: `001-registration-kyc`'s routing gate (`resolveKycRoute()` in
`src/domain/kyc-gate.ts`, wired by `src/features/identity/useKycGate.ts` into
`app/_layout.tsx`) already resolves a fully-onboarded, non-rejected user to its `"main"`
route, which today renders whatever matches `/` inside the root `<Stack>` — currently
`app/index.tsx`, the repo-scaffold placeholder. This feature is what that gate lands on: it
replaces `app/index.tsx`'s content with the real Home/Scan screen inside the new navigation
shell. **This feature does not change `resolveKycRoute()`, `useKycGate()`, or
`KYC_ROUTE_TARGETS`** — the gate's branch logic and the meaning of `"main"` are out of scope;
only what `"main"` now renders changes.

## Clarifications

### ✅ CONFIRMED BY THE HUMAN AT THE APPROVAL GATE, 2026-08-04

Both open items below were put to the human at the `spec_ready` gate and **both recorded
defaults were confirmed as-is**. They are no longer open questions — build against them:

1. **Web navigation treatment → Option C (responsive)** confirmed. Persistent left sidebar at
   ≥768px, bottom tab bar below 768px, split via the `.web.tsx` file convention. The 768px
   breakpoint stands.
2. **Top-left "Amigos" pill → shortcut to the same Amigos destination** confirmed (FR-008 as
   written). It is not a friend-request badge and is not to be dropped.

The original decision records follow, kept verbatim for the rationale and the alternatives
that were weighed.

### Session 2026-08-04 (recorded default — CONFIRMED, see above)

The human's instruction ("for web try to implement it in a modern way") is a genuine open
design decision with several reasonable, materially different implementations. Rather than
silently picking one, a recommended default is recorded here for `/speckit-plan` to build
against, **explicitly flagged for the human to confirm or override when reviewing this
feature at `spec_ready`** — not a blocking clarification, since a reasonable default exists
and downstream planning is not blocked on it.

**Question**: What should the "modern" web navigation treatment be, for the shell containing
Amigos / Home-Scan / Social?

| Option | Description | Implications |
|---|---|---|
| A | Persistent top nav bar (destinations as horizontal links/icons in a header) across all web widths | Familiar, simplest to build; wastes vertical space on desktop; cramped below ~480px, so still needs a narrow-width fallback |
| B | Persistent left sidebar (icons + labels) across all web widths | Common "app shell" pattern (Slack/Notion/Discord-style); reads as more "modern" per the human's instruction; awkward and space-costly at narrow (375px) web widths where SC-003 requires usability |
| **C (recommended, chosen default)** | Responsive switch by viewport breakpoint: persistent left sidebar at **≥768px** width; a bottom tab bar — visually and behaviorally equivalent to the native tab bar — below **768px** | Satisfies Constitution Principle VII (usable phone-through-desktop) with one shell, not per-breakpoint one-offs; the ≥768px sidebar is the genuinely "modern" desktop-web treatment the human asked for, while the <768px fallback reuses the exact pattern already required natively, so there is only one narrow-width layout to build and test, not two |
| Custom | Human provides a different treatment | — |

- **Recorded default**: Option C. Implemented via the `.web.tsx` file-extension convention
  (Constitution Principle IV) — `app/(app)/_layout.web.tsx` picks sidebar vs. bottom-bar
  internally based on `useWindowDimensions()`, `app/(app)/_layout.tsx` (no platform suffix,
  resolved on iOS/Android) renders the native tab bar via `expo-router`'s `<Tabs>`. Neither
  file contains an inline `Platform.OS` branch — the platform split is the file itself.
- **Breakpoint value**: 768px logical width (a common tablet-portrait threshold), chosen as a
  reasonable default in the absence of a designer-specified breakpoint; adjustable without a
  respec if the human's confirmation prefers a different number.
- **If overridden at the approval gate**: only `plan.md`'s "Web navigation breakpoint"
  research decision and `app/(app)/_layout.web.tsx`'s task need to change; no other artifact
  in this spec depends on which option is chosen.

### Design note (resolved, not blocking): the top-left "Amigos" pill vs. the Amigos tab

The wireframe shows a top-left pill-shaped "Amigos" button on the Home/Scan screen **and**
a separate bottom "social" bar; the human's own scope notes list "Amigos" as one of the
shell's three tab destinations. Read literally, the sketch has two "Amigos" entry points on
the same screen. Resolved here as FR-008 below: the top-left pill is a **quick-access
shortcut to the same Amigos destination** as the shell's Amigos tab, not a second, competing
destination — reconciling the sketch with a single Amigos screen rather than shipping two.
This is a low-risk, easily-reversible default (a single navigation target), not flagged as a
blocking clarification, but is called out here explicitly in case the human intended the
top-left pill to mean something else entirely (e.g. a friend-request count badge, a
different "recently viewed friend" shortcut) — if so, say so at the approval gate and this
one line item can be revised without touching anything else in this spec.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reach the Home/Scan screen inside the navigation shell (Priority: P1)

A fully-onboarded, non-rejected user (per `001-registration-kyc`'s routing gate) opens the app
and lands on the Home/Scan screen, with a persistent navigation shell showing all three
destinations — Amigos, Home/Scan (centre, current), Social — reachable from any of the other
two without re-running the onboarding/KYC gate.

**Why this priority**: This is what `resolveKycRoute()`'s `"main"` route has pointed at all
along with no real screen behind it (`app/index.tsx`'s scaffold placeholder) — without this
story, every onboarded user has nowhere real to land.

**Independent Test**: With a mocked/fixture user already past the KYC gate (`kycStatus:
"pending"` or `"verified"`, tutorial completed — see `001-registration-kyc`'s `useKycGate`),
confirm the app renders the Home/Scan screen with a visible, labelled shell exposing all three
destinations, on each of iOS, Android, and web (at both narrow and wide web widths).

**Acceptance Scenarios**:

1. **Given** an onboarded user whose gate resolves to `"main"`, **When** the app finishes
   loading, **Then** the Home/Scan screen renders with the navigation shell visible and the
   Home/Scan destination shown as currently active.
2. **Given** the Home/Scan screen is active, **When** the user selects Amigos or Social from
   the shell, **Then** the corresponding placeholder screen renders with that destination
   shown as active, and the shell remains visible and reachable.
3. **Given** the user is on the Amigos or Social placeholder, **When** they select Home/Scan
   again, **Then** the Home/Scan screen renders exactly as it did before navigating away (no
   state loss, no re-run of the KYC gate).
4. **Given** a web viewport at 375px width, **When** the shell renders, **Then** it renders as
   the narrow-width bottom-bar treatment (Clarifications, Option C) with all three
   destinations reachable and no horizontal overflow.
5. **Given** a web viewport at ≥768px width, **When** the shell renders, **Then** it renders
   as the persistent left-sidebar treatment (Clarifications, Option C).
6. **Given** a web browser window resized across the 768px breakpoint while the shell is
   mounted, **When** the resize completes, **Then** the shell re-renders in the correct
   treatment for the new width without a page reload and without losing the active
   destination.

**Platform notes**:
- *iOS/Android*: the shell renders as a native bottom tab bar (`expo-router`'s `<Tabs>`,
  `app/(app)/_layout.tsx`), respecting safe-area insets (notch/home-indicator/status-bar) via
  `react-native-safe-area-context` (already a dependency).
- *Web*: the shell renders via `app/(app)/_layout.web.tsx`, switching between a persistent
  left sidebar and a bottom bar per the breakpoint above; every destination is reachable via
  Tab/Shift+Tab and activated via Enter/Space, with a visible focus indicator (Constitution
  Principle VII).

---

### User Story 2 - Navigate to the scanner from the "+" card affordance (Priority: P1)

On the Home/Scan screen, the user sees a single large, vertically-oriented rounded rectangle
at a trading-card aspect ratio, containing a "+" glyph, dead centre. Pressing it navigates to
the scanner's entry route. The scanner itself (camera, capture, recognition) is a separate,
not-yet-built feature; this story only defines and wires that route boundary, with a stub
destination screen.

**Why this priority**: The "+" card is the wireframe's single described interaction and the
product's primary calls-to-action ("scan a card") — the human explicitly called out that
pressing it "navigates to the scanner, which is another feature," making the route boundary
itself, not the scanner's implementation, this story's deliverable.

**Independent Test**: From the Home/Scan screen, press the "+" card affordance and confirm
navigation to the scanner's stub route (a visibly distinct "coming soon"-style placeholder,
not a raw unmatched-route error) — on all three platforms.

**Acceptance Scenarios**:

1. **Given** the Home/Scan screen, **When** the user presses the "+" card affordance, **Then**
   the app navigates to the scanner's route (`/scan`), which renders a stub screen — not
   camera UI, not a capture flow.
2. **Given** the user is on the scanner's stub screen, **When** they navigate back, **Then**
   they return to the Home/Scan screen with the navigation shell intact.
3. **Given** VoiceOver/TalkBack or a screen reader on web, **When** the user reaches the "+"
   card affordance via accessible navigation, **Then** it announces a clear, non-empty label
   describing the action (e.g. "Scan a card") — not merely "+" or "button."

**Platform notes**: identical across iOS, Android, and web — no platform-specific behavior
for this story; the affordance is a plain pressable element, not a native camera trigger
(that belongs entirely to the future scanner feature).

---

### User Story 3 - Reach Amigos and Social as reachable, contentless placeholders (Priority: P2)

Selecting Amigos or Social from the shell (or, for Amigos, the Home screen's top-left
quick-access pill — see the Design note above) renders a real, reachable screen — not a 404 or
an unmatched-route error — that clearly communicates it has no content yet.

**Why this priority**: Explicit human instruction: "ignore the amigos and social but add the
tab" — these destinations must exist and be reachable so the shell is genuinely three-way
navigable, but they carry zero product content in this feature.

**Independent Test**: Select each of Amigos and Social from the shell and confirm each
renders a distinct, labelled placeholder screen (not each other's content, not an error page).

**Acceptance Scenarios**:

1. **Given** the shell, **When** the user selects Amigos, **Then** a placeholder screen
   renders identifying itself as the Amigos destination, with no friend list, request, or
   social data of any kind.
2. **Given** the shell, **When** the user selects Social, **Then** a placeholder screen
   renders identifying itself as the Social destination, with no feed, post, or trading
   content of any kind.
3. **Given** the Home/Scan screen, **When** the user presses the top-left "Amigos" pill,
   **Then** the same Amigos placeholder screen renders (and the shell's Amigos destination is
   shown as active) — per the Design note, this is the same destination as the tab, not a
   second one.

---

### User Story 4 - Top-right placeholder controls are visible, accessible, and inert (Priority: P3)

The Home/Scan screen shows a vertical stack of four small controls in its top-right corner —
language (ENG/ESP), currency (USD/MXN), Notifications, Messages — each with correct
affordance, position, an accessibility label, and a minimum tap target, but with no working
behavior: no language switch, no currency conversion, no notification feed, no messaging.

**Why this priority**: Lowest priority of the four stories — these controls are explicitly
"left as placeholders" per the human's instruction, and depend on future features (i18n,
multi-currency, notifications, messaging) that don't exist yet; getting their *presence and
accessibility* right matters now, their *behavior* does not.

**Independent Test**: Render the Home/Scan screen and confirm all four controls are present,
positioned top-right in the stated order, each individually reachable and activatable via
keyboard (web) and screen reader (all platforms), and that activating any one of them gives
visible feedback rather than doing nothing.

**Acceptance Scenarios**:

1. **Given** the Home/Scan screen, **When** it renders, **Then** exactly four controls appear
   top-right, top-to-bottom, in this order: language toggle, currency toggle, Notifications,
   Messages.
2. **Given** any one of the four controls, **When** the user activates it (press, Enter/Space,
   or the screen-reader equivalent), **Then** the control gives clear, visible feedback that
   the feature is not yet available (e.g. inline "coming soon" text or a disabled/stub state)
   — never a silent no-op that leaves the user unsure whether the tap registered.
3. **Given** a screen reader or keyboard-only user, **When** they reach any of the four
   controls, **Then** each announces a distinct, real label (e.g. "Language, English or
   Spanish — not yet available"), not a bare icon with no label.

**Platform notes**: identical across iOS, Android, and web — these are plain pressable
elements with no platform-specific behavior; no camera, storage, or native API is involved.

---

### Edge Cases

- What happens when a web browser window is resized across the 768px breakpoint while the
  shell is mounted? → The shell re-evaluates its layout live (no reload) and preserves the
  currently active destination (User Story 1, Acceptance Scenario 6).
- What happens if the user presses the "+" card affordance before the future scanner feature
  exists in a shipped build? → They see the stub screen described in User Story 2, never a
  raw "Unmatched Route" error — the stub is this feature's deliverable, not a placeholder for
  a broken link.
- What happens if the four top-right controls don't fit vertically on a very short/narrow
  device viewport (e.g. a small phone in landscape)? → Content must never overlap or obscure
  the centre "+" card affordance, and no element may become unreachable.

  **AMENDED 2026-08-04 (human-confirmed during implementation, T020/T021).** This edge case
  originally illustrated the mitigation as "the stack may scroll independently within its own
  top-right region." Implementation found the real bug this edge case was pointing at, and it
  was not the one the illustration assumed: at ~667×300 it was the fixed-height **centre "+"
  card**, not the top-right stack, that overflowed — and because Expo's web output sets
  `body { overflow: hidden }`, it was clipped and genuinely *unreachable*, not merely cramped.
  Scoping scroll to the top-right stack would not have fixed it. The shipped mitigation makes
  the whole Home screen scroll (`ScrollView` with `flexGrow: 1` on the content container, so
  centring is unchanged whenever content already fits). `code-reviewer` confirmed the binding
  no-overlap requirement holds at every tested viewport; the human confirmed the broader fix
  at the escalation gate. The requirement above is restated as the outcome it always meant,
  rather than the one implementation that was guessed at spec time.
- What happens when the user backgrounds and reopens the app (mobile) or reloads the tab
  (web) while on Amigos or Social? → On a warm resume (app backgrounded, not fully killed),
  the shell returns to the same destination that was active. On a cold boot/full reload, the
  gate re-evaluates from scratch (unchanged 001 behavior) and the shell opens on Home/Scan,
  its default destination — this feature does not add any new persisted "last active tab"
  storage.
- What happens if a user without an established session (or one still mid-KYC-gate) somehow
  requests one of this feature's routes directly (e.g. a bookmarked `/amigos` URL on web)? →
  Unchanged 001 behavior: `useKycGate`'s redirect still fires on the shared root layout,
  routing them to whichever step they haven't completed — this feature adds no separate guard,
  since the existing gate already covers every route under the app root.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a persistent navigation shell with exactly three reachable
  destinations — Amigos, Home/Scan, and Social — each reachable from either of the other two
  without re-running the KYC/onboarding gate.
- **FR-002**: On iOS and Android, the shell MUST render as a native bottom tab bar.
- **FR-003**: On web, the shell MUST render via a dedicated web-only layout file (the
  `.web.tsx` convention, Constitution Principle IV) implementing the responsive treatment
  recorded in Clarifications (persistent left sidebar at ≥768px, bottom bar below) — no
  inline `Platform.OS` branching is permitted for this split.
- **FR-004**: The Home/Scan screen MUST render, dead centre, a single large
  vertically-oriented rounded-rectangle affordance at a trading-card aspect ratio (~2.5:3.5,
  width:height) containing a "+" glyph.
- **FR-005**: Pressing the "+" card affordance MUST navigate to a dedicated scanner route
  (`/scan`). This feature owns defining that route and its stub destination screen only — it
  MUST NOT implement camera access, image capture, or card recognition of any kind.
- **FR-006**: The Home/Scan screen MUST render four placeholder controls in a vertical stack
  in its top-right corner, top-to-bottom: language (ENG/ESP), currency (USD/MXN),
  Notifications, Messages. Each MUST have a real accessibility label, a minimum 44×44 logical-
  pixel tap target, and MUST give visible feedback when activated (never a silent no-op); none
  MUST perform real language switching, currency conversion, notification delivery, or
  messaging.
- **FR-007**: Amigos and Social MUST each render a reachable, distinctly-labelled placeholder
  screen with no real content — never an unmatched-route/404 error.
- **FR-008**: The Home/Scan screen's top-left "Amigos" pill MUST navigate to the same Amigos
  destination as the shell's Amigos tab (see Clarifications' Design note) — not a second,
  competing destination.
- **FR-009**: This feature MUST NOT modify `resolveKycRoute()` (`src/domain/kyc-gate.ts`),
  `useKycGate()`, or `KYC_ROUTE_TARGETS` (`src/features/identity/useKycGate.ts`) — it only
  changes what the existing `"main"` route renders.
- **FR-010**: No screen or component in this feature MUST call a backend endpoint. The
  language, currency, notification, and messaging controls are pure client-side UI stubs;
  the corresponding real features (i18n, multi-currency, a notification feed, messaging) are
  forward dependencies recorded under Assumptions, not built by this feature.

### Key Entities

None. This feature introduces no data model, persisted entity, or backend contract — it is
navigation/UI-shell structure and inert placeholder controls only (see FR-010).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An onboarded user's cold boot resolves to a fully rendered Home/Scan screen
  (shell + centre card + top-right controls) with no visible flash of the prior scaffold
  placeholder or an unmatched-route error, on iOS, Android, and web.
- **SC-002**: All three shell destinations, the "+" card affordance, the top-left Amigos
  pill, and all four top-right controls are reachable and operable via keyboard alone on web,
  and via VoiceOver (iOS) / TalkBack (Android) on native, with zero elements requiring a
  pointer/touch-only interaction to reach.
- **SC-003**: The shell and Home/Scan screen render without clipped content, overlapping
  elements, or horizontal overflow at a 375px-wide web viewport, and at both phone and tablet
  form factors on iOS/Android.
- **SC-004**: Every interactive element introduced by this feature (three tab destinations,
  the "+" card, the Amigos pill, the four top-right controls) has a minimum 44×44 logical-
  pixel tap target and a non-empty accessibility label.
- **SC-005**: Zero placeholder control (top-right stack, Amigos/Social screens) produces a
  silent no-op — every one gives visible confirmation that it registered the interaction, even
  though none performs its eventual real behavior yet.

## Assumptions

- **No backend counterpart.** This feature calls no `Draw-a-card` backend endpoint (FR-010).
  There is nothing to cross-check against a backend spec, unlike `001-registration-kyc`.
- **Language (ENG/ESP) and currency (USD/MXN) are forward dependencies, not built here.** The
  top-right controls' eventual real behavior depends on future i18n and multi-currency
  features that do not exist yet anywhere in this repo or the backend. This feature renders
  only their affordance and position.
- **Notifications and Messages are likewise forward dependencies** — no notification feed or
  messaging system exists yet; those two controls are inert placeholders for the same reason.
- **Card aspect ratio**: absent a more precise measurement from the hand-drawn wireframe, the
  centre "+" affordance uses the standard trading-card ratio (2.5in × 3.5in ≈ 0.714:1,
  width:height) as a reasonable default.
- **"Amigos" is treated as part of the `social` bounded context for placeholder purposes.**
  Both placeholder screens (Amigos, Social) live under the existing `src/features/social/`
  module (already scaffolded, mirrors the backend's `social` module per Constitution
  Principle V) rather than a new bounded context, since neither has real content yet. If
  Amigos (friends) later proves to be its own backend bounded context, its placeholder can be
  moved out at that point without affecting this feature's routes.
- **The shell (tab bar / web sidebar-or-bottom-bar) is genuinely cross-cutting, not owned by
  any single backend-mirrored domain** (identity/catalog/portfolio/social/trading/scanner). It
  lives under a new `src/features/navigation/` module — an intentional, narrow exception to
  Constitution Principle V's domain-mirroring convention, justified in `plan.md`'s Constitution
  Check, since the shell itself has no backend counterpart to mirror.
- **The scanner's stub destination (`/scan`) is a placeholder screen only**, owned by the
  existing `src/features/scanner/` module (already scaffolded). The future scanner feature
  replaces that stub's content without needing to change this feature's navigation wiring.
- **Top-right controls and the top-left Amigos pill are specific to the Home/Scan screen**,
  not global chrome repeated on the Amigos/Social placeholders — the wireframe describes the
  layout of the home/scan screen specifically, not a shared header across all three
  destinations.
- **No new "last active tab" persistence.** A cold boot/full reload always opens on Home/Scan
  (the gate's existing default); only a warm app-resume (not a kill) preserves the active
  destination, via ordinary React Navigation/expo-router state, not a new storage mechanism.
