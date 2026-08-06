# Implementation Plan: Visual Identity (Login + Scan)

**Branch**: `006-visual-identity` | **Date**: 2026-08-05 | **Spec**: `specs/006-visual-identity/spec.md`

**Input**: Feature specification from `specs/006-visual-identity/spec.md`

**Note**: Like `001-registration-kyc`, `004-home-scan-shell`, and `005-login`, this folds Phase 0
(research) and Phase 1 (data model / contracts / quickstart) into this single file rather than
separate `research.md`/`data-model.md`/`contracts/`/`quickstart.md` documents — this feature has
no backend-facing contract at all (pure client-side restyle + i18n), so a full `contracts/`
directory would hold nothing.

## Summary

Introduce the app's first design-token module (`src/theme/`) and six shared UI primitives
(`src/features/ui/`), then apply them to restyle `005-login`'s login screen and rebuild
`004-home-scan-shell`'s `/scan` stub as a fully branded, still-camera-free visual shell — on both
mobile and web, per `docs/design-brief-visual-identity.md`. Add a lightweight, portable i18n
lookup mechanism (`src/domain/i18n/`) carrying Spanish (default) and English copy for exactly
these two screens, with a locale context/hook `007-localization` can build a real picker on top
of. Three design decisions (bundled serif font, four contrast-driven token adjustments, and
`/scan` staying outside the app shell) are recorded as defaults in spec.md's Clarifications,
flagged for human confirmation at the approval gate. Zero behavioral change to `005-login`'s
FR-006/forgot-password-as-local-state design or to `004-home-scan-shell`'s FR-005 camera
prohibition — this is markup/styling plus one new cross-cutting infrastructure layer.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node 20 (per `.nvmrc`) — unchanged.

**Primary Dependencies (new)**:
- `@expo-google-fonts/playfair-display` + `expo-font` — bundled serif display font (spec.md
  Clarifications, Recorded default 1). `expo-font` is a direct Expo SDK package (not previously a
  declared dependency — confirmed via `package.json`), the `@expo-google-fonts/*` package is
  Expo's own maintained wrapper, OFL-licensed, requiring no hand-sourced binary.
- `expo-linear-gradient` — the login screen's mobile "soft vertical gradient wash" (brief §4.1)
  has no native CSS-gradient equivalent in plain React Native; this is the standard, official
  Expo SDK package for it, works identically across iOS/Android/web (via `react-native-web`).

**Primary Dependencies (existing, reused)**: `@expo/vector-icons` (already a transitive
dependency of `expo`, already used by `004-home-scan-shell`'s tab icons) supplies every glyph
this feature needs (camera, magnifier, gear, upload, playing-card) — no new icon dependency.
`react-hook-form` + `@hookform/resolvers/zod` + `zod` (unchanged, `005-login`'s existing forms
stack — this feature does not touch form validation logic, only the markup around it).

**Storage**: N/A. The token module and i18n dictionaries are static, in-memory, compiled-in data
— no persistence of any kind (the active locale is a fixed in-memory default per spec.md FR-012;
real persistence is `007-localization`'s job).

**Testing**: Jest + `jest-expo` + `@testing-library/react-native` (already installed by
`001-registration-kyc`'s T001) — no new tooling task needed. `docs/verification.md` Levels 1–4
apply as normal; Level 5 (requirement traceability) applies to every `FR-00x` below. This feature
adds one new category of Level-1 test not seen in prior features: **computed contrast-ratio
assertions** (`src/theme/contrast.test.ts`) that regression-guard spec.md's Recorded default 2
math directly against the shipped token values, not just against a one-time manual calculation.

**Target Platform**: iOS, Android, and web (`react-native-web`) from the one Expo codebase
(Constitution I). Platform splits for this feature: `Field` (mobile borderless+shadow vs. web
bordered), the login screen's background chrome (mobile gradient wash vs. web card-over-radial-
blooms), the scan screen's layout (mobile single column vs. web two-column at ≥768px) — all via
the `.web.tsx` file-extension convention, matching `004-home-scan-shell`'s established pattern
for the same breakpoint.

**Project Type**: Single Expo (React Native) app — `src/theme/` (new, cross-cutting token
module), `src/features/ui/` (new, cross-cutting shared primitives — a documented Constitution V
exception, exactly like `004-home-scan-shell`'s `src/features/navigation/`), `src/domain/i18n/`
(new, portable copy-lookup logic), `src/features/i18n/` (new, the thin React context/hook layer),
`src/features/identity/` (existing files restyled), `src/features/scanner/` (existing stub
replaced with the real visual shell), `app/(auth)/login.tsx` and `app/scan.tsx` (existing route
glue, restyled/rewired, no new route files).

**Performance Goals**: No numeric latency target beyond the existing screens' — this feature adds
one new async gate (font loading via `useFonts`) at app root, mirroring the existing `KycGate`
loading-guard pattern already in `app/_layout.tsx` so it doesn't introduce a new class of loading
state, just one more thing the existing "render nothing until ready" gate waits on.

**Constraints**:
- `005-login`'s `LoginScreen.tsx` state machine (`mode`, `signInSucceeded`, the FR-006 no-
  `useRouter()`-on-success guard) MUST NOT change — only its rendered JSX/styles.
- `004-home-scan-shell`'s FR-005 (no camera import/capture/recognition) MUST NOT be lifted — the
  scan visual shell adds inert presentation only.
- The app's navigation shell (`src/domain/navigation.ts`'s `NAV_DESTINATIONS`) stays at exactly
  three entries — this feature does not add a fourth.
- No dark mode, no mockup-tool chrome (spec.md FR-014).

**Scale/Scope**: 4 user stories (shared foundation, login restyle, scan visual shell, i18n
layer); ~2 new runtime dependencies; 1 new top-level module (`src/theme/`); 1 new cross-cutting
UI module (`src/features/ui/`, 6 primitives); 1 new i18n module (`src/domain/i18n/` +
`src/features/i18n/`); ~6 existing files restyled in place (`FormField`, `SignInForm`,
`RequestPasswordResetForm`, `ResetPasswordForm`, `LoginScreen`, `app/(auth)/login.tsx`); the scan
stub rebuilt as a multi-file visual shell (~6 new presentational components) replacing
`ScanPlaceholderScreen`.

## Constitution Check

*GATE: Must pass before task breakdown. Re-checked after Phase 1 design below.*

| Principle | Check | Status |
|---|---|---|
| I. One Codebase, Three Targets | One login screen, one scan screen; every platform difference expressed as a `.web.tsx` file variant of the same component, never a second app. | PASS |
| II. Backend Is the Source of Truth | Zero backend calls anywhere in this feature — pure client-side restyle + static i18n dictionaries. No exception to justify. | PASS (N/A) |
| III. Auth Goes Through the Provider SDK | Untouched — this feature does not call `signInWithPassword`/`resetPasswordForEmail`/etc. itself; it restyles the components that already call them (`005-login`, unmodified). | PASS (N/A) |
| IV. Business Logic Stays Portable | Token *values* (`src/theme/`) and copy *lookup* (`src/domain/i18n/translate.ts`) are plain TypeScript with zero React Native imports, unit-tested directly (contrast math, key-parity checks) rather than only through a component render. Platform-specific rendering (`Field`, login background chrome, scan layout) uses the `.web.tsx` convention exclusively — no `Platform.OS === ...` branch scattered through a shared component body, with one narrow, convention-sanctioned exception noted in Research Decisions (a single `Platform.select` for one trivial color value on the scan "Back" affordance, per `docs/conventions.md`'s explicit allowance for `Platform.select` as an alternative to a full file split). | PASS |
| V. Screen/Component Structure Mirrors Product Domains | **Documented, narrow exception, same shape as `004-home-scan-shell`'s**: `src/theme/` (tokens) and `src/features/ui/` (BrandMark/PrimaryButton/SecondaryButton/OrDivider/StatusPill) have no single backend bounded context to mirror — they are cross-cutting design-system infrastructure consumed by both `identity` and `scanner`. This is additive, not a contradiction of an existing MUST — called out for visibility, not requiring a Complexity Tracking entry (matches `004`'s own precedent exactly). `Field` stays inside `src/features/identity/FormField.tsx` per the human's explicit instruction (extend, don't parallel) — see Research Decisions for the accepted side effect this has on `001-registration-kyc`'s other forms. | PASS (with noted, justified exception) |
| VI. Spec Before Code, One Spec Per Feature | Single `spec.md`, platform notes inline per user story. | PASS |
| VII. Accessible and Responsive by Default | Contrast computed (not assumed) and regression-tested (spec.md Recorded default 2); every interactive element keeps its explicit label/≥44×44 target as its own task; 375px-web-through-desktop and phone/tablet usability checked at Level 3. | PASS |
| VIII. Local-First Development | Fully developable/testable via `expo start --web` with no backend running at all — this feature has no backend dependency whatsoever, the strongest possible satisfaction of this principle. | PASS |

No violations requiring a Complexity Tracking entry.

## Research Decisions

### Token module structure — plain TypeScript data, platform split isolated to elevation only

- **Decision**: `src/theme/colors.ts`, `typography.ts`, `geometry.ts` are plain, RN-import-free
  TypeScript modules exporting `const` objects (e.g. `export const colors = { brand: { primary:
  "#C7F24C", onPrimary: "#10281A" }, text: { primary: "#10281A", secondary: "#646B78", ... },
  ... } as const;`) using spec.md's Recorded default 2 adjusted values, not the brief's originals,
  where they differ. `src/theme/shadows.ts` (native) and `src/theme/shadows.web.ts` (web) are the
  **only** platform-split token files — both export the same two names (`shadowSurface`,
  `shadowRaised`), native using the `shadowColor`/`shadowOffset`/`shadowRadius`/`shadowOpacity` +
  `elevation` quintuple, web using a single `boxShadow` string (`react-native-web` passes this
  straight through to CSS `box-shadow`). `src/theme/fonts.ts` exports the font-family name
  constants the `useFonts` call and `typography.ts` both reference (`PLAYFAIR_DISPLAY_BOLD =
  "PlayfairDisplay_700Bold"`, matching `@expo-google-fonts/playfair-display`'s own export-name
  convention). `src/theme/index.ts` re-exports everything as one `theme` namespace object plus
  the individual named exports, so a consumer can write either `theme.colors.brand.primary` or
  `import { colors } from "@/theme"`.
- **Rationale**: Matches spec.md FR-001/FR-002 exactly (semantic names, dark-theme-ready
  structure) and Constitution IV's "isolate platform difference to a file, not an inline branch"
  — elevation is the *only* token category with a genuine per-platform representation (a shadow
  is expressed completely differently in CSS vs. RN's shadow properties), so it's the only token
  file that needs the `.web.tsx`-equivalent split (`.ts`/`.web.ts`, since these are non-component
  files — Metro's platform-extension resolution applies to any `.ts`/`.tsx` file, not only
  screens/components).
- **Alternatives considered**: A single `tokens.ts` with inline `Platform.select(...)` for shadow
  values — rejected, this is exactly the "platform difference embedded in a shared module" shape
  Constitution IV's file-convention preference exists to avoid, and two small, named-consistently
  files are no harder to maintain than one branching one.

### Contrast regression guard — a real, computed unit test, not a one-time manual check

- **Decision**: `src/theme/contrast.ts` exports a pure `contrastRatio(fg: string, bg: string):
  number` (WCAG relative-luminance formula) and `src/theme/contrast.test.ts` asserts every
  pairing spec.md's Recorded default 2 table lists — reading the *actual* exported `colors`
  values, not hardcoded duplicate strings — clears 4.5:1. A future edit to any of these token
  values that regresses contrast fails this test immediately, not only at a future manual audit.
- **Rationale**: `docs/verification.md`'s Level 1 mandate ("every exported function in
  `src/domain`/`src/lib`... has a test") extended here to `src/theme` since it's the same
  "portable, zero-RN-import, directly testable" shape Constitution IV asks for — and Constitution
  VII's 4.5:1 floor is non-negotiable, so it deserves an executable guard, not just spec.md prose.
- **Alternatives considered**: Leaving contrast as a one-time manual calculation recorded only in
  spec.md — rejected, that's exactly the "eyeballed, not measured" failure mode this whole
  Clarification exists to fix; a static prose record with no executable check could silently rot.

### Font loading — `expo-font`'s `useFonts`, gated at the root layout, mirroring the existing `KycGate` loading pattern

- **Decision**: `app/_layout.tsx`'s `RootLayout` calls `useFonts({ PlayfairDisplay_700Bold })`
  (from `@expo-google-fonts/playfair-display`) alongside its existing `QueryClientProvider`/
  `KycGate` composition. While fonts are loading, render the same minimal `<View style={{ flex: 1
  }} />` placeholder `KycGate` already renders during its own `isLoading` state (not a new,
  differently-styled loading screen) — both loading conditions (`!fontsLoaded`, `isLoading`)
  gate rendering of the real `<Stack>` the same way, composed as one combined guard.
- **Rationale**: Reuses an already-established, already-tested "render nothing until ready"
  pattern instead of inventing a second loading-UI convention; avoids any flash of the fallback
  system font on `display.xl`/`display.lg` text (a layout-shift/FOUC risk `useFonts` gating
  specifically prevents).
- **Alternatives considered**: `expo-splash-screen`'s `preventAutoHideAsync`/`hideAsync` pair
  (the more "official" Expo font-loading pattern) — not adopted only because this app has no
  `expo-splash-screen` dependency today and no custom splash screen configured beyond
  `app.json`'s bare `backgroundColor`; the existing `KycGate` loading-guard pattern already
  solves the same problem with zero new dependency, so it's reused rather than introducing a
  second, parallel loading mechanism for one new async condition.

### Login screen — chrome (background/card) is a platform-split wrapper; the state machine stays in one file

- **Decision**: `src/features/identity/LoginScreenChrome.tsx` (mobile) and
  `LoginScreenChrome.web.tsx` (web) each accept `{ children: ReactNode }` and render the
  brief's §4.1/§4.2 background treatment — mobile: an `expo-linear-gradient` pale-lime-to-
  `bg.page` vertical wash sized to ~45% of viewport height, with `children` rendered beneath it
  on flat `bg.page`; web: `bg.page` with two large, low-opacity CSS `radial-gradient` blooms
  (top-right, bottom-left — achieved via `.web.tsx`-only `style` objects passed straight through
  to the underlying DOM node by `react-native-web`, no blur library needed since a soft
  radial-gradient with a fully-transparent outer stop already reads as "heavily blurred" without
  an actual blur filter), with `children` inside a centered card (`bg.surfaceMuted`,
  `radius.card`, `shadow.surface`, max-width 660, padding 48). `LoginScreen.tsx` wraps its
  existing per-mode JSX in `<LoginScreenChrome>...</LoginScreenChrome>` and is otherwise
  **completely unmodified in logic** — same `mode`/`signInSucceeded`/handler functions, same
  props, same regression-guarded FR-006 behavior. `BrandMark` + the `display.xl` "Draw a Card" +
  the tagline (brief items 1–3) render inside `LoginScreen.tsx`'s `"sign-in"`-mode branch only,
  directly above `<SignInForm>`, since the brief's content order describes the plain sign-in view
  specifically (the mockups do not depict the forgot-password sub-views at all).
- **Rationale**: Keeps `005-login`'s entire, already-tested state machine in exactly one file
  (no risk of two platform-forked copies drifting on behavior), while still expressing the one
  genuine platform difference (background chrome) via the file-extension convention.
- **Alternatives considered**: A `LoginScreen.web.tsx` fork of the whole screen — rejected, this
  is precisely the risk `docs/design-brief-visual-identity.md`'s own instruction ("use the
  `.web.tsx` convention for this split... not inline conditionals scattered through the
  component") is trying to keep contained: forking the *entire* screen for one background
  difference would duplicate the FR-006 regression-guarded logic across two files.

### Forgot-password sub-views inherit the token/primitive vocabulary, not a new mockup layout

- **Decision**: `RequestPasswordResetForm.tsx` and `ResetPasswordForm.tsx` are restyled to use
  `Field`, `PrimaryButton`, `SecondaryButton` (where applicable), and the token module's
  typography/color for their existing content (title, fields, buttons, "Back to sign in") — same
  field order, same copy positions as today, since no mockup exists for these two views.
- **Rationale**: The design brief's four mockups only cover the plain sign-in view; leaving the
  forgot-password views in their pre-006 hardcoded-hex styling would make `/login` look
  two-thirds branded and one-third legacy mid-flow, a worse outcome than applying the same
  already-defined vocabulary with no new layout invention.
- **Alternatives considered**: Leaving these two views entirely unstyled until a future feature
  mocks them — rejected as a visibly broken-looking flow for zero benefit; the token/primitive
  reuse here is low-risk (no content-order or behavioral change, purely visual).

### `Field` stays `FormField.tsx` — an accepted, disclosed side effect on other forms

- **Decision**: The existing `src/features/identity/FormField.tsx` is restyled in place (its
  export name and import sites are unchanged) to the brief's `Field` spec — uppercase
  `label.field`, pill radius, `control.height`, 20px horizontal padding, mobile
  borderless+shadow (`FormField.tsx`) vs. web bordered (`FormField.web.tsx`, new file).
- **Rationale**: The human's explicit instruction: "extending the existing `FormField.tsx`, not a
  parallel component." Because `FormField` is already shared by `RegistrationForm`,
  `VerifyPhoneScreen`, `ProfileForm` (`001-registration-kyc`, all unmodified by this feature's own
  scope), those screens **will** visually inherit the new pill/label look as a side effect — this
  is disclosed here explicitly, not a hidden landmine. It is not expected to be a *behavioral*
  regression (those screens' own tests assert roles/labels/text, not literal colors/radii), but
  `tasks.md`'s Polish phase re-runs the **full** existing test suite (not just this feature's new
  files) specifically to confirm that expectation holds.
- **Alternatives considered**: A new, separate `Field.tsx` in `src/features/ui/` that duplicates
  `FormField`'s structure for login-only use — rejected, directly contradicts the explicit
  instruction and would leave two independently-maintained field components where one already
  exists.

### Scan visual shell — `ScanPlaceholderScreen` retired in favor of `ScanShellScreen` + `.web.tsx`; the camera-import guard test migrates with it

- **Decision**: `src/features/scanner/ScanPlaceholderScreen.tsx` (and its test) are retired;
  `src/features/scanner/ScanShellScreen.tsx` (mobile, single column) and
  `ScanShellScreen.web.tsx` (web, two-column at ≥768px / one-column below it, reusing
  `src/domain/navigation.ts`'s existing `BREAKPOINT_PX`) become `/scan`'s real content, composed
  from smaller presentational pieces: `Viewfinder.tsx` (drawn grid + corner brackets + camera
  glyph + hint text + gear chip — identical on both platforms, no split needed), `ScanSearchField.
  tsx`, `UploadDropzone.tsx`, and (web-only) `EmptyResultsPanel.tsx` + `RecentScansList.tsx` (the
  static placeholder rows, explicitly commented as placeholder-until-the-real-scanner-feature-
  ships, per spec.md FR-008). `app/scan.tsx` imports `ScanShellScreen` in place of
  `ScanPlaceholderScreen` and keeps its own "Back" affordance (restyled — a single, narrow
  `Platform.select` for the icon/label color against the two different backgrounds, per
  `docs/conventions.md`'s explicit `Platform.select` allowance, not a full `.web.tsx` fork for
  one style value). The camera-import source-inspection guard test migrates to cover
  `ScanShellScreen.tsx`/`ScanShellScreen.web.tsx`/every new file under `src/features/scanner/`
  this feature adds — same technique (read the file(s) from disk, assert no `expo-camera`/
  `expo-image-picker`/`camera`-matching import line), not weakened or dropped.
- **Rationale**: `docs/design-brief-visual-identity.md` §5's shell has real internal structure
  (viewfinder, search, dropzone, button, plus an entire second column on web) that doesn't fit
  inside one file without becoming unreadable; splitting into small, single-purpose presentational
  components matches this repo's established granularity (`ScanEntryCard`, `AmigosQuickAccessPill`
  in `004-home-scan-shell`). Retiring `ScanPlaceholderScreen.tsx`'s literal filename (rather than
  keeping the name and rewriting its insides) avoids a component whose name says "Placeholder"
  holding a fully-built visual shell, which would read as misleading to a future maintainer — the
  *behavior* it guards (no camera, ever) is what must survive, not the filename.
- **Alternatives considered**: Keeping the single-file `ScanPlaceholderScreen.tsx` name and
  growing its contents in place — rejected as both a readability problem at this feature's actual
  scope (viewfinder + search + dropzone + button + two-column web variant) and a misleading name
  for what the file has become.

### i18n mechanism — a small, portable, hand-rolled lookup, not `i18next`

- **Decision**:
  - `src/domain/i18n/locale.ts`: `export type Locale = "es" | "en"; export const DEFAULT_LOCALE:
    Locale = "es";` (spec.md FR-012 — Spanish, matching the brief's Spanish-first copy and the
    human's own scoping language; this is a placeholder default, not a permanent decision — see
    spec.md Assumptions).
  - `src/domain/i18n/copy/login.ts` and `src/domain/i18n/copy/scan.ts`: each exports an `es` and
    an `en` object of the same literal shape (e.g. `{ es: { title: "Draw a Card", tagline: "Tu
    plataforma de cartas coleccionables", ... }, en: { title: "Draw a Card", tagline: "Your
    collectible card platform", ... } }`), typed so `en`'s keys are constrained to exactly match
    `es`'s (`Record<keyof typeof es, string>`) — a missing English key is a **compile-time** type
    error, not just a unit-test failure (the unit test in `copy/login.test.ts`/`copy/scan.test.ts`
    additionally asserts this at runtime via `Object.keys` comparison, covering the (unlikely but
    possible) case of a key present with an empty-string value slipping past the type check).
  - `src/domain/i18n/translate.ts`: a pure `translate<T extends Record<string, string>>(
    dictionary: { es: T; en: T }, locale: Locale, key: keyof T): string` helper — zero React
    Native imports, directly unit-tested.
  - `src/features/i18n/LocaleContext.tsx`: a thin React context (`{ locale: Locale, setLocale:
    (l: Locale) => void }`, defaulting to `DEFAULT_LOCALE`) + `useLocale()` hook + a
    `useTranslation(dictionary)` convenience hook that calls `translate()` with the context's
    current locale — this is the seam `007-localization`'s picker UI will call `setLocale` from
    (spec.md FR-011).
- **Rationale**: This is the *first* genuinely-needed i18n use case in the app and covers exactly
  two screens' worth of keys (no pluralization, no interpolation, no ICU message format needed
  today) — `i18next`/`react-i18next` would add a runtime dependency graph, its own initialization
  boilerplate, and ICU/plural machinery this feature has no use for, while *still* needing a
  custom locale-persistence/detection layer on top (that's `007`'s job either way). A ~120-line
  hand-rolled module is simpler to read, test, and hand off to `007` than configuring a general-
  purpose i18n framework for a two-screen, two-locale, no-interpolation use case. Constitution
  IV's "business logic stays portable" is satisfied directly: `translate()` and the dictionaries
  are plain TypeScript, importable by a hypothetical future non-RN web app with zero change.
- **Alternatives considered**: `i18next` + `react-i18next` — rejected per the rationale above;
  revisit if `007-localization`'s broader scope (many more screens, possibly plurals/dates)
  changes the calculus — that decision belongs to `007`'s own plan.md, not retrofitted here.

## Project Structure

### Documentation (this feature)

```text
specs/006-visual-identity/
├── spec.md                 # Feature spec — three recorded-default decisions, flagged for
│                            # confirmation at the approval gate, not blocking
├── plan.md                 # This file — includes research decisions inline
├── tasks.md                # Phase 2 output (/speckit-tasks)
└── checklists/
    └── requirements.md     # Spec quality checklist
```

No separate `research.md`, `data-model.md`, `contracts/`, or `quickstart.md` — see the note at
the top of this file.

### Source Code (repository root)

```text
package.json                           # MODIFIED — + @expo-google-fonts/playfair-display,
                                        # expo-font, expo-linear-gradient

app/
├── _layout.tsx                        # MODIFIED — + useFonts() gate, composed with the
                                        # existing KycGate loading guard (no new loading UI)
├── (auth)/
│   └── login.tsx                      # MODIFIED — thin glue unchanged in logic; renders the
│                                       # restyled LoginScreen (no prop-shape change)
└── scan.tsx                           # MODIFIED — renders ScanShellScreen (replaces
                                        # ScanPlaceholderScreen); "Back" affordance restyled

src/theme/
├── colors.ts                          # NEW — adjusted token values (spec.md Recorded default 2)
├── typography.ts                      # NEW — display/UI type scale, references fonts.ts
├── geometry.ts                        # NEW — radius/space/control.height
├── fonts.ts                           # NEW — PLAYFAIR_DISPLAY_BOLD font-family name constant
├── shadows.ts                         # NEW — native shadow.surface/shadow.raised
├── shadows.web.ts                     # NEW — web boxShadow equivalents
├── contrast.ts                        # NEW — pure WCAG contrastRatio() helper
├── contrast.test.ts                   # NEW — regression-guards every pairing in spec.md's
│                                       # Recorded default 2 table against the real colors.ts
│                                       # values
└── index.ts                           # NEW — barrel export (theme namespace + named exports)

src/features/ui/                       # NEW — cross-cutting shared primitives (Constitution V
│                                       # documented exception, mirrors src/features/navigation/)
├── README.md                          # NEW — short note on the Constitution V exception
├── BrandMark.tsx + .test.tsx          # NEW
├── PrimaryButton.tsx + .test.tsx      # NEW
├── SecondaryButton.tsx + .test.tsx    # NEW
├── OrDivider.tsx + .test.tsx          # NEW
└── StatusPill.tsx + .test.tsx         # NEW

src/domain/i18n/
├── locale.ts                          # NEW — Locale type, DEFAULT_LOCALE
├── translate.ts + .test.ts            # NEW — pure lookup helper
└── copy/
    ├── login.ts + .test.ts            # NEW — es/en dictionaries + key-parity test
    └── scan.ts + .test.ts             # NEW — es/en dictionaries + key-parity test

src/features/i18n/
├── LocaleContext.tsx + .test.tsx      # NEW — provider + useLocale()/useTranslation() hooks
└── README.md                          # NEW — documents the seam 007-localization builds on

src/features/identity/
├── FormField.tsx                      # MODIFIED — restyled to the Field spec (mobile:
│                                       # borderless + shadow.surface)
├── FormField.web.tsx                  # NEW — web: 1px border.input, no shadow
├── FormField.test.tsx                 # MODIFIED — extended for new rendering assertions
├── LoginScreenChrome.tsx              # NEW — mobile: gradient wash background
├── LoginScreenChrome.web.tsx          # NEW — web: radial-bloom background + centered card
├── LoginScreenChrome.test.tsx         # NEW
├── LoginScreen.tsx                    # MODIFIED — wraps existing per-mode JSX in
│                                       # LoginScreenChrome; adds BrandMark/title/tagline above
│                                       # SignInForm in "sign-in" mode; ZERO change to mode
│                                       # state machine or FR-006 behavior
├── LoginScreen.test.tsx               # MODIFIED — all existing behavioral assertions kept
│                                       # unmodified; new rendering assertions added
├── SignInForm.tsx                     # MODIFIED — restyled with Field/PrimaryButton/
│                                       # SecondaryButton/OrDivider; copy routed through i18n;
│                                       # right-aligned "Olvidé mi contraseña"; legal line
├── SignInForm.test.tsx                # MODIFIED
├── RequestPasswordResetForm.tsx       # MODIFIED — restyled, same content order, i18n copy
├── RequestPasswordResetForm.test.tsx  # MODIFIED
├── ResetPasswordForm.tsx              # MODIFIED — restyled, same content order, i18n copy
└── ResetPasswordForm.test.tsx         # MODIFIED

src/features/scanner/
├── ScanPlaceholderScreen.tsx          # REMOVED (retired — see Research Decisions)
├── ScanPlaceholderScreen.test.tsx     # REMOVED (guard migrates to ScanShellScreen.test.tsx)
├── ScanShellScreen.tsx                # NEW — mobile single-column composition
├── ScanShellScreen.web.tsx            # NEW — web two-column (≥768px) / one-column composition
├── ScanShellScreen.test.tsx           # NEW — includes the migrated camera-import source-
│                                       # inspection guard (FR-007) covering every new file
│                                       # under src/features/scanner/
├── Viewfinder.tsx + .test.tsx         # NEW — shared, both platforms
├── ScanSearchField.tsx + .test.tsx    # NEW — shared, both platforms
├── UploadDropzone.tsx + .test.tsx     # NEW — shared, both platforms
├── EmptyResultsPanel.tsx + .test.tsx  # NEW — web-only
└── RecentScansList.tsx + .test.tsx    # NEW — web-only; static placeholder data, commented
                                        # placeholder-until-the-real-scanner-feature-ships
                                        # (FR-008)

app/scan.test.tsx                      # MODIFIED — updated rendering assertions for the new
                                        # shell's copy/labels; "Back" → router.back() assertion
                                        # kept unmodified
```

**Structure Decision**: Single Expo project (Constitution I). Two new cross-cutting modules
(`src/theme/`, `src/features/ui/`) plus a new i18n module (`src/domain/i18n/` +
`src/features/i18n/`), each a documented, narrow Constitution V exception exactly like
`004-home-scan-shell`'s `src/features/navigation/` precedent. Everything else is either a
restyle-in-place of existing `identity` files or a rebuild-in-place of the existing `scanner`
stub — no new backend-mirrored domain module.

## Data Model

No persisted entity (unchanged from `004`/`005` — this feature adds no backend-facing shape).
Two purely client-side, compiled-in data shapes:

- **Design token** (`src/theme/`): a nested `const` object per category (`colors`, `typography`,
  `geometry`) plus two platform-specific style-object exports (`shadowSurface`, `shadowRaised`).
  No runtime mutation, no persistence — dark-theme support (future, out of scope) would extend
  this shape with a second value set per semantic name, not change any consumer's import.
- **Locale copy dictionary** (`src/domain/i18n/copy/*.ts`): `{ es: Record<string, string>; en:
  Record<string, string> }` per screen namespace, `en`'s type constrained to `keyof typeof es` so
  a missing translation is a compile error. No persistence — the active `Locale` is in-memory
  state in `src/features/i18n/LocaleContext.tsx`, defaulting to `DEFAULT_LOCALE` on every cold
  start (spec.md FR-012, Assumptions).

## Interface Contracts

No backend HTTP contract, no Supabase SDK contract — this feature calls neither. This feature's
own two "contracts" are internal TypeScript module surfaces, documented here since they're what
`007-localization` and any future dark-mode feature build against:

| Consumer-facing surface | Shape | Who depends on it next |
|---|---|---|
| `src/theme` (`colors`, `typography`, `geometry`, `shadowSurface`/`shadowRaised`) | Semantic-named `const` objects, no raw hex/number at any call site | Every future screen restyle; a future dark-mode feature adds a second value set per name without changing this shape |
| `src/features/i18n` (`useLocale()`, `useTranslation(dictionary)`) | `useLocale(): { locale: Locale; setLocale: (l: Locale) => void }`; `useTranslation(dict): (key) => string` | `007-localization`'s language-picker UI calls `setLocale`; every future translated screen adds its own `copy/<screen>.ts` dictionary and calls `useTranslation` |

## Quickstart Validation

Once tasks are implemented, validate manually per `docs/verification.md` Level 3
(`npm run web`) plus the relevant simulator/device for the platform-parity pass:

1. Cold-boot the app at a mobile-width web viewport, land on `/login` — confirm the brand block
   (BrandMark, "Draw a Card" in the bundled serif, tagline) sits inside the pale-lime gradient
   wash, the form block sits on flat `bg.page`, and `CORREO`/`CONTRASEÑA` labels render uppercase.
2. Resize to a desktop width — confirm the login content moves into a centered card over the
   radial-bloom background, and the two input fields switch to the bordered (not
   borderless-with-shadow) treatment.
3. Submit valid credentials — confirm `005-login`'s existing "Signing you in…" transition still
   appears with no navigation call from this screen (regression guard, unchanged from `005`).
4. Select "Olvidé mi contraseña" — confirm the forgot-password views render with the same
   restyled `Field`/`PrimaryButton` vocabulary, still as local view-state (no route change).
5. Navigate to `/scan` from Home's "+" card — confirm the mobile single-column shell (viewfinder
   with grid/corner brackets/hint copy, search field, upload dropzone, "Escanear carta" button,
   restyled "Back" affordance) — and that pressing "Back" returns to Home with the shell intact
   (`004`'s existing behavior, unchanged).
6. Resize `/scan` to a desktop width above 768px — confirm the two-column layout (title + status
   pill, controls stack on the left; empty results panel + "ESCANEOS RECIENTES" placeholder rows
   on the right) — then resize below 768px — confirm it collapses to one column.
7. Toggle the locale context's value between `"es"` and `"en"` (via a temporary dev-only trigger,
   or directly in a test harness — no picker UI ships yet) on both screens — confirm every visible
   string changes with nothing left blank.
8. Confirm — via `grep -rn "expo-camera\|expo-image-picker" src/features/scanner/` — that zero
   matches exist, and that `ScanShellScreen.test.tsx`'s source-inspection test passes.
9. Repeat steps 1–6 on iOS and Android simulators/devices — confirm the bundled serif renders
   identically to web (not a system-font substitute), and that VoiceOver/TalkBack announces real
   labels for every interactive element, with inert scan controls announced as non-interactive.
10. At a 375px-wide browser window and a typical desktop width, confirm no clipped content or
    horizontal overflow on either screen (spec.md SC-006).

## Complexity Tracking

*No Constitution Check violations — table intentionally empty.*
