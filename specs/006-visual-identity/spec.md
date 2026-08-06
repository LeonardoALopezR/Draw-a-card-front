# Feature Specification: Visual Identity (Login + Scan)

**Feature Branch**: `006-visual-identity`

**Created**: 2026-08-05

**Status**: Clarified (three recorded design defaults below, flagged for explicit human
confirmation at the `spec_ready` approval gate — not blocking `[NEEDS CLARIFICATION]` markers,
since a reasonable, fully-worked-out default exists for each)

**Input**: Four human-supplied mockups (login mobile, login web, scan mobile, scan web),
transcribed into `docs/design-brief-visual-identity.md` on 2026-08-05 — that file is the
**authoritative design source** for this feature; this spec implements against it, not against
any assumption about what the source images might have shown. Scoped by the human at a scoping
gate the same day (recorded in `feature_list.json`'s `006-visual-identity` entry and
`progress/current.md`): (1) scan gets a **visual shell only** — no camera, no capture, no
recognition, `004-home-scan-shell` FR-005 stands; (2) copy ships in **Spanish and English**, via
an i18n layer — the language-**picker UI** is a separate feature (`007-localization`), not this
one.

**The gap this fills**: the app currently has no visual identity — every existing screen
hardcodes its own hex values (`SignInForm.tsx`'s `#111827`/`#d1d5db`/`#374151`, etc.) and no
theme/token module exists anywhere in `src/`. This feature introduces the first shared token
layer, the primitives the mockups imply, and applies both to the two screens the human supplied
mockups for — login and scan.

**Related backend spec**: none. This feature calls no `Draw-a-card` backend endpoint and adds no
new Supabase Auth SDK call — it is a pure client-side restyle plus an i18n layer. The only
touchpoints with prior features are (a) `005-login`'s `LoginScreen`/`SignInForm`/
`RequestPasswordResetForm`/`ResetPasswordForm`, restyled but behaviorally unchanged, and (b)
`004-home-scan-shell`'s `/scan` route and `ScanPlaceholderScreen`, restyled but still forbidden
from importing any camera module.

## Clarifications

### Recorded default 1 (2026-08-05): the bold serif display type is a bundled font asset (Playfair Display), not a system-font substitute

**What was found**: `docs/design-brief-visual-identity.md` §2.2 calls for a "bold transitional
serif" for `display.xl`/`display.lg` ("Draw a Card", "Escanear", "Escanear carta") and explicitly
says "do not fake it with a bolded sans." Checking what's actually available bundled/reliable
across this app's three targets: `package.json` has no font-related dependency at all today (no
`expo-font`, no font asset anywhere in the repo — confirmed, no `.ttf`/`.otf` files exist and
`app.json` declares no font asset). System serif fonts differ meaningfully per platform — iOS
ships `Georgia`/`Times New Roman`/`Palatino` as real system fonts; Android only exposes a generic
`"serif"` font-family token that resolves to whatever the device manufacturer shipped (commonly
Noto Serif, but not guaranteed, and its `700` weight is frequently synthesized/faux-bolded rather
than a true bold face on many devices); web has `Georgia`/`Times New Roman`/generic `serif` as
fallbacks. Relying on these would produce three visibly different "brand" typefaces per platform
— directly undermining the brief's own opening claim that this feature exists to give the app "a
coherent brand."

| Option | Description | Implications |
|---|---|---|
| **A (recommended, chosen default)** | Bundle **Playfair Display**, weight 700, via the `@expo-google-fonts/playfair-display` npm package (Expo's own maintained wrapper around the Google Fonts OFL-licensed family, ships pre-built as an `expo-font`-compatible asset — no binary font file needs to be hand-sourced or committed as raw bytes) + `expo-font`'s `useFonts` hook, loaded once at the root layout and gated behind a loading guard (mirrors the existing `KycGate`'s "render nothing until resolved" pattern in `app/_layout.tsx`) so no screen using `display.xl`/`display.lg` can flash an unstyled fallback font. Referenced everywhere as the semantic token `typography.display.fontFamily`, never a bare string literal at a call site. | One new (small, well-maintained, official-Expo-org) npm dependency. Identical, pixel-consistent brand typeface on iOS, Android, and web — the entire point of "coherent brand" in the brief's opening sentence. Playfair Display is a high-contrast serif in the Baskerville/transitional lineage, a strong match for "bold transitional serif" at large display sizes (40px/28px) specifically, which is the only place this feature uses a serif at all. |
| B | Rely on per-platform system serif fonts via `Platform.select` (`Georgia` iOS/web, generic `"serif"` Android). | Zero new dependency — but directly contradicts the brief's explicit "do not fake it with a bolded sans" instruction in spirit (Android's generic serif's bold weight is frequently a synthetic/faux bold, visually close to a bolded sans at small sizes) and produces three genuinely different typefaces per platform, which is the specific outcome "coherent brand" (the brief's stated goal) argues against. |
| Custom | A different open-license transitional serif, e.g. **Lora** (`@expo-google-fonts/lora`) | Also a solid, well-supported option — Lora reads slightly more restrained/text-oriented than Playfair Display's higher-contrast display character, which is a closer match for a bold 40px logotype headline specifically. Flagged here as the most plausible override if the human prefers a quieter serif. |

**Recorded default**: **Option A, specifically Playfair Display 700.** Chosen because it is the
only option that satisfies both the brief's explicit "no faked serif" instruction and its
"coherent brand" goal across all three targets, without hand-sourcing binary font content.
**Flagged explicitly for the human to confirm or override at the approval gate** — if a different
family is preferred (e.g. Lora), only the font-loading task and the `typography.display` token
value change; nothing else in this spec depends on which specific serif family is chosen.

### Recorded default 2 (2026-08-05): four token values are adjusted, not used as eyeballed in the brief, to clear the 4.5:1 contrast floor (Constitution VII)

**What was found**: `docs/design-brief-visual-identity.md` §2.1 states its color values are
"eyeballed from mockups, not measured." Computing actual WCAG contrast ratios (relative
luminance, the same formula browsers/axe/Lighthouse use) for every text-on-background pairing the
brief specifies:

| Pairing (brief's original values) | Computed ratio | Clears 4.5:1? |
|---|---|---|
| `brand.onPrimary` `#10281A` on `brand.primary` `#C7F24C` | 12.11:1 | Yes |
| `text.secondary` `#6B7280` on `bg.page` `#ECEDEE` | 4.12:1 | **No** |
| `text.placeholder` `#9CA3AF` on `bg.surface` `#FFFFFF` (§6's explicit spot-check) | 2.54:1 | **No** |
| `text.link` `#2F9E4F` on `bg.page`/`bg.surface`/`bg.surfaceMuted`/`accent.pillBg` | 2.93:1–3.43:1 | **No** (found during the required spot-check pass, not explicitly asked for in §6 but directly implicated by the same 4.5:1 floor — `text.link` labels "Olvidé mi contraseña," the legal links, and the "Cámara disponible" pill, none of which are large text at their specified sizes) |
| `accent.priceGreen` `#22A15A` on `bg.surface` `#FFFFFF` (recent-scans list prices) | 3.33:1 | **No** (same reasoning — a price is meaningful content, not decorative) |

A fifth finding, not anticipated by §6's spot-check list: `text.placeholder` is specified for
**two** visually opposite contexts — input placeholders on `bg.surface` (near-white) **and** the
viewfinder hint copy on `viewfinder.bg` (near-black, §5 item 2). No single gray value can clear
4.5:1 against both a near-white and a near-black background simultaneously (the luminance math is
mutually exclusive at that threshold — confirmed by computation, not assumption). The original
`#9CA3AF` already clears 7.60:1 against `viewfinder.bg`; a value dark enough to clear 4.5:1 against
`bg.surface` drops to ~4.26:1 against `viewfinder.bg` — a regression in the one place the
original value already worked.

| Option | Description | Implications |
|---|---|---|
| **A (recommended, chosen default)** | Adjust the four failing values to the nearest darkened shade (same hue family, reduced lightness) that clears 4.5:1, and **split `text.placeholder` into two tokens**: `text.placeholder` (adjusted, for input placeholders on light surfaces) and a new `viewfinder.hintText` (keeps the original `#9CA3AF` — it already passes against `viewfinder.bg`, the only surface it's used on). See the adjusted-values table below. | Every text/background pairing this feature ships clears WCAG AA (4.5:1) for real, not by eyeballed assumption — directly satisfies Constitution VII, which is non-negotiable. Visually, the adjusted colors are close enough to the brief's originals (same hue, ~10–15% darker) that the brand still reads as "lime-on-dark-green" — this is a calibration correction, not a redesign. |
| B | Ship the brief's original values as-is. | Directly violates Constitution VII (a binding, non-negotiable principle) on four separate token/pairing combinations — not a legitimate option, listed only for completeness. |
| Custom | Different specific adjusted values, or a different resolution to the `text.placeholder` split (e.g. one value with a slightly relaxed threshold for "decorative-adjacent" text) | Not adopted — §6 already anticipated `text.placeholder` might be borderline ("decorative-adjacent... should still clear 4.5:1"), so no threshold relaxation is applied. |

**Recorded default**: **Option A.** Adjusted values (all computed, not further eyeballed):

| Token | Brief's value | **Adjusted value (this spec)** | New ratio | Against |
|---|---|---|---|---|
| `text.secondary` | `#6B7280` | **`#646B78`** | 4.57:1–5.36:1 | `bg.page`, `bg.surface`, `bg.surfaceMuted` |
| `text.placeholder` (input placeholders only) | `#9CA3AF` | **`#6D7787`** | 4.53:1 | `bg.surface` |
| `viewfinder.hintText` (**new token**, viewfinder hint copy only) | n/a (brief reused `text.placeholder`) | **`#9CA3AF`** (unchanged) | 7.60:1 | `viewfinder.bg` |
| `text.link` | `#2F9E4F` | **`#247B3D`** | 4.51:1–5.28:1 | `bg.page`, `bg.surface`, `bg.surfaceMuted`, `accent.pillBg` |
| `accent.priceGreen` | `#22A15A` | **`#1C844A`** | 4.72:1 | `bg.surface` |

All other brief token values (`brand.primary`, `brand.onPrimary`, `text.primary`, `bg.*`,
`border.*`, `viewfinder.bg`, `viewfinder.grid`) are used exactly as specified — either they carry
no text-on-background pairing (borders, backgrounds behind other backgrounds) or they already
clear the floor. **Flagged explicitly for the human to confirm or override at the approval
gate** — this is a visible deviation from the mockups' exact colors, even though a small one; if
the human prefers different specific adjusted shades, only the token module's literal values
change, nothing structural.

### Recorded default 3 (2026-08-05): `/scan` does not gain the app shell's sidebar/tab bar; it stays the standalone route `004-home-scan-shell` built

**What was found**: `docs/design-brief-visual-identity.md` §5.2 describes the scan-web mockup as
having an "existing sidebar on the left, unchanged in structure," and §5.1 says scan-mobile sits
above "the existing bottom tab bar." Tracing the actual current routing (`app/scan.tsx`,
`app/(app)/_layout.tsx`, `app/(app)/_layout.web.tsx`, `src/domain/navigation.ts`) found `/scan`
was **deliberately built outside** the three-destination shell by `004-home-scan-shell` — it has
its own standalone "Back to Home" affordance specifically *because* it has no persistent
sidebar/tab bar of its own to return via (see `app/scan.tsx`'s own top-of-file comment). Neither
mockup screen the human supplied is one of the shell's three actual destinations (Amigos/Home/
Social) today, so literally reproducing "the existing sidebar/tab bar around scan" would require
either (a) moving `/scan` into the shell's navigator (a routing-structure change with real
version-dependent risk on native — expo-router's "hidden tab, still reachable" pattern would need
verifying against this repo's exact `expo-router ~3.5.0`, and changes which navigator hosts this
route, a bigger diff than "visual shell only" implies), or (b) building a second, look-alike
navigation surface that duplicates `NAV_DESTINATIONS`' rendering logic outside the real shell
(the exact kind of un-owned, drift-prone duplication `docs/conventions.md`'s "extreme
consistency" principle warns against).

| Option | Description | Implications |
|---|---|---|
| **A (recommended, chosen default)** | `/scan` stays exactly the standalone route it already is — its restyled "Back" affordance (already an explicit hard constraint, independent of this decision) remains the sole way back. No sidebar/tab bar is added around it, mirroring the same reasoning `docs/design-brief-visual-identity.md` §7 already uses to exclude the mockups' 5-destination nav elsewhere: the shell is `004`'s concern, not `006`'s, and `006` restyles what already exists rather than restructuring routing around it. | Zero routing/navigator changes, zero new nav-duplicate code, zero expo-router-version risk. Every other element the brief specifies for scan-web/mobile (§5 items 1–5, the two-column layout, the results panel, the recent-scans rows) still ships exactly as described — only the persistent shell chrome around the screen is not reproduced. |
| B | Move `app/scan.tsx` into `app/(app)/` as a hidden-tab screen so it shares the real `<Tabs>`/`WebSidebarNav`/`WebBottomBarNav` chrome the other three destinations use. | Most faithful to the mockup's literal appearance — but a genuine routing-structure change (which navigator hosts `/scan`, whether expo-router `~3.5.0`'s hidden-tab mechanism behaves as expected on native), a bigger diff than "restyle only," and a decision that reopens what `004-home-scan-shell` deliberately scoped out, not something `006` should make unilaterally. |
| C | Duplicate a look-alike nav rail purely for `/scan`'s benefit (real `<Link>`s to the same three destinations, styled to resemble the shell). | Avoids the routing change, but is the "second implementation of the same nav data" duplication `docs/conventions.md` explicitly argues against, and doesn't correspond to any of the shared primitives §3 of the design brief actually lists. |

**Recorded default**: **Option A.** Chosen because it carries zero regression risk against
`004-home-scan-shell`'s FR-005/US2 AS2 (the back-affordance dependency), introduces no new
routing behavior or version-dependent native mechanism, and is a direct, principled extension of
the same "restyle what exists, don't extend the shell" reasoning the design brief's own §7 already
applies to the 5-destination nav. **Flagged explicitly for the human to confirm or override at the
approval gate** — if literal shell-chrome parity with the mockup is preferred (Option B), only the
scan-screen tasks and `app/(app)/_layout.tsx` change; the token layer, primitives, and login
restyle do not depend on which option is chosen here.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A shared brand foundation exists for every screen this feature touches (Priority: P1, Foundational)

Every screen this feature restyles draws its colors, type, spacing, corner radii, and shadows
from one shared token module and a small set of shared components — never a raw hex value or a
one-off style typed directly into a screen.

**Why this priority**: Nothing else in this feature can ship without it — the login and scan
restyles (User Stories 2 and 3) are both consumers of this foundation, not independent designs.

**Independent Test**: Render each shared primitive (`BrandMark`, `PrimaryButton`,
`SecondaryButton`, the restyled `Field`, `OrDivider`, `StatusPill`) in isolation and confirm each
renders its documented visual role, accessible label, and minimum tap target with no direct
reference to a raw color/size literal — every value traces back to the token module. Confirm the
token module itself exposes semantic names (e.g. `text.primary`), never requires a consumer to
know a hex value.

**Acceptance Scenarios**:

1. **Given** the token module, **When** any of its color/type/geometry/elevation values are
   read by a component, **Then** the component references a semantic name (`brand.primary`,
   `text.secondary`, `radius.pill`, `control.height`, `shadow.surface`, etc.) — never a bare hex
   string or an inline numeric literal duplicating a token's value.
2. **Given** `PrimaryButton`, **When** it renders disabled, **Then** it renders at reduced
   (60%) opacity and exposes `accessibilityState.disabled` — matching `docs/design-brief-
   visual-identity.md` §3.2.
3. **Given** `Field` (the restyled `FormField`), **When** it renders on a mobile viewport versus
   a web viewport, **Then** the mobile rendering is borderless with a soft elevation shadow and
   the web rendering has a visible 1px border and no shadow — the platform difference is
   expressed via the `.web.tsx` file-extension convention, not an inline `Platform.OS` branch
   inside a shared component body (Constitution Principle IV).
4. **Given** every interactive primitive (`PrimaryButton`, `SecondaryButton`, the "Olvidé mi
   contraseña" link, `StatusPill` if ever made interactive later, the field itself), **When**
   rendered at its documented size, **Then** its tap target is at least 44×44 logical pixels
   (Constitution Principle VII) — `control.height` (56) already exceeds this for the larger
   controls; small controls (icon-only chips) are checked explicitly, not assumed.
5. **Given** the color tokens with a text-on-background pairing this feature actually uses,
   **When** their contrast ratio is computed, **Then** every pairing clears 4.5:1 (Clarifications,
   Recorded default 2) — not merely visually plausible.

**Platform notes**: The token module's color/type/geometry values are identical across iOS,
Android, and web (pure data, no platform branch needed). Only elevation (soft shadows) and
`Field`'s border-vs-shadow treatment differ by platform, expressed via the `.web.tsx` convention
(Constitution Principle I/IV) — see Clarifications and `plan.md`'s Research Decisions for exactly
where that split lives.

---

### User Story 2 - The login screen reads as the branded app, not a generic form (Priority: P2)

A visitor who opens `/login` sees the branded lime-on-dark-green identity — the `BrandMark`,
serif "Draw a Card" headline, tagline, pill-shaped fields, and primary/secondary buttons — in the
exact content order and copy `docs/design-brief-visual-identity.md` §4 specifies, on both mobile
and web, in whichever of the two shipped languages (Spanish or English) the app is currently
resolved to. Every behavior `005-login` already built — sign-in, the forgot-password sub-flow as
local view-state, "Create account," the post-sign-in "Signing you in…" transition and its
deliberate absence of any `useRouter()` call — is completely unchanged; only markup and styling
are touched.

**Why this priority**: The login screen is the first screen most visitors see; it's the more
behavior-sensitive of the two restyles (a real, tested, multi-step form flow underneath) and the
one with the harder regression risk (`005-login`'s FR-006 and forgot-password-as-local-state
design), so it is sequenced before the lower-risk scan visual shell.

**Independent Test**: Render `/login` on a mobile-width and a web-width viewport and confirm the
content order, copy, and layout described in `docs/design-brief-visual-identity.md` §4 (brand
block → tagline → email field → password field → right-aligned "Olvidé mi contraseña" → "Entrar"
→ divider → "Crear cuenta" → legal line). Confirm every `005-login` behavioral test (sign-in
submission, forgot-password mode transitions, the FR-006 no-`useRouter()`-on-success regression
guard) still passes unmodified.

**Acceptance Scenarios**:

1. **Given** `/login` on a mobile viewport, **When** it renders, **Then** the brand block (1–3)
   sits inside a soft pale-lime vertical gradient wash fading to `bg.page` by ~45% of viewport
   height, and the form block (4–10) sits on flat `bg.page`, with 24px horizontal padding — per
   `docs/design-brief-visual-identity.md` §4.1.
2. **Given** `/login` on a web viewport, **When** it renders, **Then** the content sits in a
   centered card (`bg.surfaceMuted`, `radius.card`, `shadow.surface`, max-width 660, padding 48,
   vertically centered) over a `bg.page` background carrying two faint blurred lime radial
   blooms, with bordered (not borderless-with-shadow) inputs — per §4.2. The platform difference
   is expressed via the `.web.tsx` convention (Constitution Principle IV), not an inline
   `Platform.OS` branch.
3. **Given** the exact copy `docs/design-brief-visual-identity.md` §4 specifies, **When** it
   renders in Spanish, **Then** it uses correct orthography (`CONTRASEÑA`, "Olvidé mi
   contraseña," "Términos," "Política") — **not** the mockup tool's rendering artifact
   (`CONTRASENA`, "Olvide") — and **When** the active locale is English instead, **Then** an
   accurate English equivalent renders in the same content order, with no copy hardcoded directly
   in a component (every string is looked up through the i18n mechanism, User Story 4).
4. **Given** a successful sign-in on the restyled screen, **When** it succeeds, **Then**
   `005-login`'s existing behavior is completely unchanged: no `useRouter()` call fires from this
   screen, a neutral "signing you in" state renders in place of the form, and the existing
   `useKycGate()`/`resolveKycRoute()` mechanism (untouched) takes over navigation — the exact
   regression guard `005-login`'s `LoginScreen.test.tsx` already asserts, which must still pass.
5. **Given** the "Olvidé mi contraseña" link, **When** pressed, **Then** the forgot-password
   sub-flow still renders as local view-state on the same `/login` screen (no route change) —
   `005-login`'s Recorded default 2 behavior, restyled but not restructured.
6. **Given** "Crear cuenta," **When** pressed, **Then** it still navigates via the existing
   `<Link href="/register">` behavior, unchanged.

**Platform notes**: Content order and copy are identical across iOS, Android, and web; only the
background treatment (gradient wash vs. card-over-radial-blooms) and the field's border/shadow
treatment differ, per Acceptance Scenarios 1–2 above and Clarifications' general primitive
platform-split note.

---

### User Story 3 - The scan screen's visual shell matches the brand, with no camera behavior of any kind (Priority: P3)

A user who reaches `/scan` (still via the existing "+" card on Home, still a standalone route
outside the shell per Clarifications' Recorded default 3) sees a fully branded, inert visual
shell — a drawn viewfinder with corner brackets and a grid, a search field, an upload dropzone,
and (on web) an empty results panel plus static placeholder "recent scans" rows — in the exact
layout `docs/design-brief-visual-identity.md` §5 specifies. Every element is genuinely inert: no
camera import, no capture, no recognition, no network/domain call for the "recent scans" content.
The existing "Back" affordance stays, restyled.

**Why this priority**: Lower behavioral risk than the login restyle (no existing multi-step form
logic underneath — `ScanPlaceholderScreen` today is a single static stub) and self-contained
(this story does not depend on User Story 2's completion, only on User Story 1's shared
foundation).

**Independent Test**: Render `/scan` on a mobile-width and a web-width (both above and below the
tablet breakpoint) viewport and confirm every element §5 specifies is present with the correct
inert/no-op behavior and accessible labeling. Confirm the existing camera-import source-inspection
test (`ScanPlaceholderScreen.test.tsx`, or its successor covering whatever file(s) now render the
visual shell) still passes — no `expo-camera`/`expo-image-picker`/camera-related import anywhere
in the scan visual-shell code.

**Acceptance Scenarios**:

1. **Given** `/scan` on a mobile viewport, **When** it renders, **Then** it shows, in a single
   column with 20px padding: the `display.lg` title "Escanear," the viewfinder, the search
   field, the upload dropzone, and the "Escanear carta" `PrimaryButton`, with the existing
   restyled "Back" affordance still present and functional (`004-home-scan-shell` US2 AS2) — and
   **no** persistent sidebar/tab bar is added around it (Clarifications, Recorded default 3).
2. **Given** `/scan` on a web viewport at or above the tablet breakpoint, **When** it renders,
   **Then** it shows a two-column layout: left column with the `display.lg` title "Escanear
   carta" beside a `StatusPill` reading "Cámara disponible," then the viewfinder/search/dropzone/
   button stack; right column with an empty results panel (dashed border, centered playing-card
   glyph, two lines of copy) above a "ESCANEOS RECIENTES" section listing static placeholder rows
   (thumbnail, name, meta, price) — per §5.2.
3. **Given** the same web viewport below the tablet breakpoint, **When** it renders, **Then** the
   two columns collapse to one, with the results panel below the controls — per §5.2's last
   sentence.
4. **Given** the viewfinder, search field, upload dropzone, settings-gear chip, and every other
   presentation-only control in the shell, **When** inspected for accessibility, **Then** none
   presents as an actionable button to a screen reader unless it genuinely does something (only
   the "Escanear carta" `PrimaryButton` and the real "Back" link are truly interactive) — inert
   elements are labeled for what they visually are, not given a bare `accessibilityRole="button"`
   they don't back up with behavior.
5. **Given** the scan visual-shell source files, **When** inspected, **Then** none imports
   `expo-camera`, `expo-image-picker`, or any camera-related module — the same source-inspection
   guard `004-home-scan-shell`'s test already enforces, kept green (or migrated intact to
   whichever file(s) now hold the rendered shell).
6. **Given** the "recent scans" rows on web, **When** inspected in code, **Then** they are static
   local placeholder data with no `src/domain` fetch, no API call, and no persistence — and are
   marked in a code comment as placeholder-until-the-real-scanner-feature-ships, so a future
   reader does not mistake them for real data wiring.
7. **Given** the exact copy §5 specifies, **When** it renders in Spanish vs. English, **Then**
   the same locale mechanism from User Story 2/4 applies — no hardcoded copy in either language.

**Platform notes**: Mobile is a single column; web is two-column at/above the tablet breakpoint
(reusing the same 768px breakpoint `004-home-scan-shell` already established,
`src/domain/navigation.ts`'s `BREAKPOINT_PX`) and collapses to one column below it. The
`.web.tsx` convention expresses this split, not an inline `Platform.OS` branch.

---

### User Story 4 - Login and scan copy ships in Spanish and English, with a mechanism the language-picker feature can build on (Priority: P1, Foundational)

Every piece of copy on the login and scan screens is resolved through a shared, portable
lookup mechanism rather than hardcoded in a component, and ships with both a complete Spanish and
a complete English dictionary. No picker UI exists yet — the active locale defaults to a fixed
value for this feature — but the mechanism (a locale concept, a lookup function, a way for a
future component to read/change the active locale) is documented and ready for
`007-localization` to build a real picker on top of.

**Why this priority**: Foundational alongside User Story 1 — both the login and scan restyles
(User Stories 2 and 3) render copy through this mechanism from the moment they exist; it isn't a
separable, later-added feature within this scope.

**Independent Test**: Render the login screen and the scan screen with the locale explicitly set
to `"es"`, then again with it set to `"en"` (via the mechanism's own seam — no picker UI needed to
exercise this), and confirm every visible string changes accordingly with no missing/blank/
untranslated fallback. Confirm the lookup mechanism itself is plain TypeScript, importable and
testable with zero React Native imports (Constitution Principle IV).

**Acceptance Scenarios**:

1. **Given** the login and scan screens' copy, **When** enumerated, **Then** every string a user
   sees is looked up by a key through the shared mechanism — grep-checked: no literal
   Spanish/English sentence is typed directly into a `<Text>`/`accessibilityLabel` in either
   screen's component files.
2. **Given** both locale dictionaries (Spanish, English), **When** compared key-by-key, **Then**
   they contain the exact same set of keys — no key present in one and missing in the other (unit
   test, not visual inspection).
3. **Given** the app with no locale explicitly chosen (no picker UI exists yet in this feature),
   **When** it starts, **Then** it resolves to a documented, fixed default locale (Spanish,
   matching the design brief's Spanish-first copy and the human's original phrasing) — recorded
   as a known, intentional placeholder for `007-localization` to replace with real
   detection/persistence, not a design decision this feature claims to have made permanently.
4. **Given** the lookup mechanism, **When** inspected, **Then** the actual string-resolution
   logic (given a key and a locale, return the string) lives in a plain TypeScript module with no
   React Native import, and is unit-tested directly — not only indirectly through a component
   render (Constitution Principle IV, `docs/verification.md`'s anti-pattern list).
5. **Given** `007-localization`'s stated dependency on this feature's i18n layer, **When** this
   feature ships, **Then** it leaves in place a locale context/provider and a translation-lookup
   hook that a future language-picker component can read from and write to, without needing to
   restructure how login/scan already consume copy.

**Platform notes**: Identical across iOS, Android, and web — this is pure data/lookup logic with
a thin React context wrapper, no platform-specific behavior of its own.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: App MUST provide a single shared design-token module (color, typography, geometry,
  elevation) that every component this feature touches or creates consumes exclusively through
  semantic names — no raw hex value or magic numeric literal duplicating a token's value may
  appear directly in a screen or primitive component body.
- **FR-002**: The token module's structure MUST allow a future dark theme to be added without
  changing any consumer's call sites (semantic names resolve to values, not the reverse) — dark
  mode itself is explicitly out of scope for this feature (see Assumptions).
- **FR-003**: App MUST provide six shared primitives — `BrandMark`, `PrimaryButton`,
  `SecondaryButton`, a restyled `Field` (extending, not replacing, the existing `FormField`
  component), `OrDivider`, `StatusPill` — matching `docs/design-brief-visual-identity.md` §3's
  visual specification for each, consumed by both the login and scan restyles wherever the brief
  calls for them.
- **FR-004**: Every text/background color pairing this feature actually renders MUST clear a
  4.5:1 contrast ratio (Constitution Principle VII) — using the adjusted token values recorded in
  Clarifications, Recorded default 2, not the design brief's original eyeballed values where they
  differ.
- **FR-005**: Platform-specific rendering differences (mobile borderless-with-shadow vs. web
  bordered fields; mobile gradient-wash vs. web card-over-radial-blooms backgrounds; elevation's
  `boxShadow` vs. native shadow properties) MUST be expressed via the `.ios.tsx`/`.android.tsx`/
  `.web.tsx` file-extension convention, never an inline `Platform.OS === ...` branch scattered
  through a shared component body (Constitution Principle IV).
- **FR-006**: The login screen (`/login`, `005-login`'s `LoginScreen`/`SignInForm`/
  `RequestPasswordResetForm`/`ResetPasswordForm`) MUST be restyled to match
  `docs/design-brief-visual-identity.md` §4's content order, copy, and layout on both mobile and
  web, with **zero** change to `005-login`'s FR-006 (no `useRouter()` call on a successful sign-in
  — the existing `useKycGate()`/`resolveKycRoute()` mechanism owns post-sign-in navigation) or to
  the forgot-password sub-flow's local-view-state design (no new route, no restructuring of
  `LoginScreen`'s `mode` state machine) — this is a markup/styling change only.
- **FR-007**: The scan screen (`/scan`) MUST render the visual shell `docs/design-brief-visual-
  identity.md` §5 specifies (viewfinder, search field, upload dropzone, primary button, and —
  on web at/above the tablet breakpoint — the two-column layout with results panel and recent-
  scans rows) with **zero** camera import, capture, or recognition of any kind
  (`004-home-scan-shell` FR-005 stands unchanged) — every element is inert presentation, and any
  source-inspection test guarding against a camera-related import MUST stay green.
- **FR-008**: The scan screen's "recent scans" rows MUST be static, local placeholder content
  only — no `src/domain` fetch, no API call, no persistence — and MUST be marked in a code
  comment as placeholder-until-the-real-scanner-feature-ships.
- **FR-009**: The scan screen MUST keep its existing "Back" affordance (`app/scan.tsx`,
  `004-home-scan-shell` US2 AS2), restyled but not removed, and MUST NOT gain a persistent
  sidebar/tab bar around it (Clarifications, Recorded default 3) and MUST NOT extend the app's
  navigation shell beyond its existing three destinations (Amigos/Home/Social) — the mockups'
  five-destination nav (adding "Cartera"/"Trades") is explicitly not built.
- **FR-010**: App MUST provide an i18n lookup mechanism — a plain TypeScript, zero-React-Native-
  import string-resolution function keyed by (translation key, locale) — with complete Spanish
  and English dictionaries for every string the login and scan screens render, and MUST NOT
  hardcode any user-facing copy directly inside a login/scan component.
- **FR-011**: The i18n mechanism MUST expose a locale context/provider and a lookup hook usable
  by a future component with no restructuring of how login/scan already consume it — no
  language-picker UI ships in this feature (that is `007-localization`'s scope), but the seam for
  one MUST exist.
- **FR-012**: The active locale MUST default to a single, documented fixed value (Spanish) when
  no picker UI has ever set it — real device-locale detection or persisted user choice is
  explicitly deferred to `007-localization`.
- **FR-013**: Every interactive element this feature introduces or restyles MUST have a real
  accessibility label and a minimum 44×44 logical-pixel tap target, MUST NOT present an inert
  element as actionable to a screen reader, and the login and scan screens MUST remain usable —
  no clipped content, no horizontal overflow, no unreachable element — at a 375px-wide web
  viewport through desktop widths and on phone/tablet form factors on iOS/Android (Constitution
  Principle VII).
- **FR-014**: This feature MUST NOT build dark mode, the mockup tool's "Dark/Mobile/Web" toggle
  pills, its floating "?" button, the web sidebar's account-tier/compliance subtitle/footer text,
  or translations for any screen other than login and scan (register, verify-phone, profile,
  KYC status, tutorial, home) — all explicitly out of scope per
  `docs/design-brief-visual-identity.md` §7.

### Key Entities

- **Design token**: a semantic name (e.g. `brand.primary`, `radius.pill`, `shadow.raised`)
  resolving to a concrete color/number/platform-specific style-object value. No persistence, no
  backend counterpart — pure client-side presentation data, structured to leave room for a
  future `dark` variant per token without changing any consumer.
- **Locale copy entry**: a translation key (e.g. `login.title`, `scan.searchPlaceholder`) with
  exactly one string value per shipped locale (`es`, `en`). No persistence in this feature (the
  active locale is a fixed in-memory default until `007-localization` adds real
  detection/persistence); no backend counterpart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero raw hex values or magic style-literal duplicates of a token value appear
  anywhere in the login/scan screens or the six shared primitives (verified by code review/grep,
  not visual inspection alone).
- **SC-002**: 100% of the text/background color pairings this feature renders clear a 4.5:1
  contrast ratio, computed (not eyeballed) against the adjusted token values in Clarifications'
  Recorded default 2.
- **SC-003**: The login screen's every `005-login` acceptance scenario (sign-in success/failure,
  the FR-006 no-navigation regression guard, the forgot-password mode sequence, "Create account")
  still passes after the restyle, unmodified in behavior.
- **SC-004**: The scan screen's source files import zero camera-related modules — verified by the
  same or an equivalent source-inspection test to the one `004-home-scan-shell` shipped, kept
  green throughout this feature's implementation.
- **SC-005**: Both the login and scan screens render fully and correctly in Spanish and in
  English with zero missing/blank strings, verified by rendering each screen with the locale
  mechanism set to each of the two shipped locales.
- **SC-006**: The login and scan screens remain fully usable — no clipped content, no horizontal
  overflow — at a 375px-wide web viewport, at a typical desktop width, and on phone and tablet
  form factors on iOS/Android (Constitution Principle VII).

## Assumptions

- **Dark mode is explicitly out of scope.** The token module is structured so one can be added
  later without touching call sites, but no dark theme, dark-mode toggle, or dark-mode-specific
  value ships in this feature (`docs/design-brief-visual-identity.md` §7).
- **The mockups' 5-destination nav (adding "Cartera"/"Trades") is explicitly out of scope.** The
  app's navigation shell stays at its existing three destinations (Amigos/Home/Social); this
  feature restyles that shell's visual treatment only where the login/scan screens intersect with
  it (they don't, per Clarifications' Recorded default 3 for scan — login isn't inside the shell
  at all, being a pre-authentication screen).
- **Real scan results, camera capture, and card recognition are explicitly out of scope.** The
  scan screen ships appearance only; `004-home-scan-shell` FR-005 stands unchanged, and this
  feature adds no new capability toward lifting it.
- **The web sidebar's account-tier/compliance subtitle and footer shown in the mockups are
  explicitly out of scope** — they imply product state (account tier, PLD/AML compliance status)
  this app does not model yet.
- **Translating any screen other than login and scan is explicitly out of scope** — register,
  verify-phone, profile, KYC status, tutorial, and home stay in their current (English, hardcoded)
  copy; `007-localization` owns translating them and building the language-picker UI.
- **Default locale is a hardcoded placeholder, not a real decision.** This feature ships Spanish
  as the fixed default (matching the design brief's Spanish-first copy and the human's original
  scoping language) with no device-locale detection or persistence — `007-localization`'s own
  spec is where that becomes a real, considered choice.
- **The emailed/SMS-code-based flows, session persistence, and every other `001`/`005` behavior
  not touched by this feature's markup/styling changes are assumed unaffected** and are not
  re-specified here — see `specs/001-registration-kyc/spec.md` and `specs/005-login/spec.md` for
  their own Assumptions.
- **`expo-camera`/`expo-image-picker` remain installed dependencies** (used elsewhere, e.g.
  `001-registration-kyc`'s KYC document capture) — this feature's constraint is that the scan
  visual-shell files specifically never import them, not that the packages are removed from
  `package.json`.
