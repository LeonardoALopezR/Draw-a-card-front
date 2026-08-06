# Tasks: Visual Identity (Login + Scan)

**Input**: Design documents from `specs/006-visual-identity/` (`spec.md`, `plan.md`)

**Tests**: Included. `docs/verification.md` mandates unit tests for every `src/domain`/`src/theme`
export and component/screen tests for every new/changed screen; test tooling already exists
(installed by `001-registration-kyc`), so no test-tooling *setup* task is needed — this feature's
own Phase 1 only adds the two new runtime dependencies (font + gradient) it genuinely needs.

**Organization**: Tasks are grouped by user story from `spec.md`. User Stories 1 (shared
foundation) and 4 (i18n layer) are both P1/Foundational — neither screen restyle can start
without them, so both land in Phase 2. User Story 2 (login, P2) is sequenced before User Story 3
(scan, P3) per spec.md's stated priority (higher behavioral regression risk, sequenced first).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 (shared token/primitive foundation, P1), US4 (i18n layer, P1), US2 (login
  restyle, P2), US3 (scan visual shell, P3)
- File paths are exact; see `plan.md`'s Project Structure for the full tree

---

## Phase 1: Setup

- [X] T001 Add three new runtime dependencies: `npx expo install expo-font expo-linear-gradient`
  (native-module packages — must go through `expo install`, not plain `npm install`, so Expo
  aligns them to the SDK's expected version, per `docs/verification.md`'s Level 4 native-
  dependency-alignment stage) and `npm install @expo-google-fonts/playfair-display` (a pure-JS
  font-asset package, no native alignment needed). Confirm `package.json` records all three.
  Run `./init.sh`'s native-dependency-alignment stage (or the full script) once to confirm no
  version-drift warning appears for the two `expo install`-managed packages before building
  anything on top of them. *(spec.md Clarifications, Recorded default 1; plan.md's Technical
  Context)*

---

## Phase 2: Foundational (Blocking Prerequisites — User Stories 1 & 4)

**Purpose**: The token module, the six shared primitives, and the i18n lookup mechanism every
later screen task consumes. **No login/scan restyle task (Phase 3/4) starts before this phase is
done.**

### Token module (User Story 1)

- [X] T002 [P] [US1] Create `src/theme/colors.ts`: export a `colors` `const` object (`as const`)
  structured as `{ brand: { primary, onPrimary }, text: { primary, secondary, placeholder, link
  }, viewfinder: { bg, grid, hintText }, bg: { page, surface, surfaceMuted }, border: { subtle,
  input, dashed }, accent: { priceGreen, pillBg } }` using spec.md Clarifications' Recorded
  default 2 **adjusted** values exactly (`text.secondary: "#646B78"`, `text.placeholder:
  "#6D7787"`, `viewfinder.hintText: "#9CA3AF"` — a token distinct from `text.placeholder`,
  `text.link: "#247B3D"`, `accent.priceGreen: "#1C844A"`), and every other brief §2.1 value
  unchanged (`brand.primary: "#C7F24C"`, `brand.onPrimary: "#10281A"`, `text.primary: "#10281A"`,
  `bg.page: "#ECEDEE"`, `bg.surface: "#FFFFFF"`, `bg.surfaceMuted: "#F7F8F8"`, `border.subtle:
  "#E3E5E6"`, `border.input: "#DDE0E1"`, `border.dashed: "#C9CDCE"`, `viewfinder.bg: "#0B0F0C"`,
  `viewfinder.grid: "rgba(199,242,76,0.10)"`, `accent.pillBg: "#E4F5E7"`). Zero React Native
  import. *(FR-001, FR-002, FR-004)*
- [X] T003 [P] [US1] Create `src/theme/geometry.ts`: export `radius` (`{ pill: 999, card: 28,
  panel: 20, tile: 26, row: 16 }`), `space` (`{ xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24,
  xxxl: 32, huge: 40, giant: 48 }` — the 4-based scale from brief §2.3), `CONTROL_HEIGHT = 56`.
  Zero React Native import. *(FR-001)*
- [X] T004 [P] [US1] Create `src/theme/fonts.ts`: export `PLAYFAIR_DISPLAY_BOLD =
  "PlayfairDisplay_700Bold"` (must match `@expo-google-fonts/playfair-display`'s own export name
  exactly — verify against the installed package, T001, before hardcoding). Zero React Native
  import. *(spec.md Clarifications, Recorded default 1)*
- [X] T005 [US1] Create `src/theme/typography.ts`: export a `typography` object matching brief
  §2.2's table exactly — `display.xl` (`{ fontSize: 40, fontWeight: "700", fontFamily:
  PLAYFAIR_DISPLAY_BOLD }`), `display.lg` (`{ fontSize: 28, fontWeight: "700", fontFamily:
  PLAYFAIR_DISPLAY_BOLD }`), `body.tagline` (15/400 sans, color `colors.text.secondary`),
  `label.field` (12/500 sans, `textTransform: "uppercase"`, `letterSpacing: 0.08 * 12`, color
  `colors.text.secondary`), `body.input` (16/400 sans — never smaller, per brief §2.2's iOS-zoom
  note), `button.label` (16/700 sans), `body.link` (14/500 sans, color `colors.text.link`),
  `body.legal` (12/400 sans, centered, color `colors.text.secondary`, with a documented
  convention for rendering embedded `text.link`-colored spans), `label.section` (12/600 sans,
  uppercase, letter-spaced). Depends on: T002 (colors), T004 (fonts). Zero React Native import
  beyond a type-only `TextStyle` import (erased at compile time — does not count as a runtime RN
  dependency, per plan.md's Constitution IV note). *(FR-001)*
- [X] T006 [P] [US1] Create `src/theme/shadows.ts` (native): export `shadowSurface` and
  `shadowRaised` as native `ViewStyle`-shaped objects (`shadowColor`, `shadowOffset`,
  `shadowRadius`, `shadowOpacity`, `elevation`) matching brief §2.4's y-offset/blur/opacity
  values for each (`shadow.surface`: 2/12/`rgba(16,40,26,0.06)`; `shadow.raised`: 6/20/
  `rgba(16,40,26,0.12)`). *(FR-001, FR-005)*
- [X] T007 [P] [US1] Create `src/theme/shadows.web.ts` (web): export the same two names
  (`shadowSurface`, `shadowRaised`) as `{ boxShadow: "..." }` CSS-string equivalents of T006's
  values (`react-native-web` passes `boxShadow` straight through to CSS `box-shadow`). *(FR-001,
  FR-005)*
- [X] T008 [US1] Create `src/theme/contrast.ts`: export a pure `contrastRatio(fg: string, bg:
  string): number` implementing the WCAG relative-luminance formula (sRGB → linear → relative
  luminance → `(L1+0.05)/(L2+0.05)`). Create `src/theme/contrast.test.ts` asserting, using the
  **real** `colors` export from T002 (not hardcoded duplicate hex strings): `contrastRatio(colors.
  brand.onPrimary, colors.brand.primary) >= 4.5`; `contrastRatio(colors.text.secondary, colors.bg.
  page) >= 4.5` (and against `bg.surface`, `bg.surfaceMuted`); `contrastRatio(colors.text.
  placeholder, colors.bg.surface) >= 4.5`; `contrastRatio(colors.viewfinder.hintText, colors.
  viewfinder.bg) >= 4.5`; `contrastRatio(colors.text.link, ...)` against `bg.page`, `bg.surface`,
  `bg.surfaceMuted`, `accent.pillBg`, each `>= 4.5`; `contrastRatio(colors.accent.priceGreen,
  colors.bg.surface) >= 4.5`. Depends on: T002. *(FR-004, spec.md Clarifications Recorded default
  2, SC-002)*
- [X] T009 [US1] Create `src/theme/index.ts`: barrel-export everything from T002–T008 (`colors`,
  `typography`, `geometry`'s `radius`/`space`/`CONTROL_HEIGHT`, `shadowSurface`/`shadowRaised`
  — importing from the platform-suffixed files by their unsuffixed base name so Metro's own
  platform resolution picks the right one, exactly as `app/(app)/_layout.web.tsx` already relies
  on for `.web.tsx` resolution) plus a combined `theme` namespace object. Depends on: T002–T008.
  *(FR-001)*
- [X] T010 Modify `app/_layout.tsx`: add `useFonts({ PlayfairDisplay_700Bold })` (from
  `@expo-google-fonts/playfair-display`) and wrap the existing `QueryClientProvider`/`KycGate`
  tree in `src/features/i18n/LocaleContext.tsx`'s provider (T021, sequence this task after T021
  lands, or land the provider-wrap portion as a follow-up edit once T021 exists). While
  `!fontsLoaded`, render the exact same minimal `<View style={{ flex: 1 }} />` placeholder
  `KycGate` already renders during its own `isLoading` — do not invent a second, differently
  -styled loading view (plan.md's "Font loading" Research Decision). Depends on: T001, T004,
  T021. *(spec.md Clarifications Recorded default 1, FR-011)*

**Checkpoint**: Token module complete and contrast-regression-tested; font loading wired at root.

### Shared primitives (User Story 1)

- [X] T011 [P] [US1] Create `src/features/ui/BrandMark.tsx` + `.test.tsx`: a `radius.tile`
  rounded square, `brand.primary` fill, `shadow.raised`, a centered serif "D" glyph in
  `brand.onPrimary` (using `typography.display` family), default size 112px (matching the login
  screen's usage) with a `size` prop for reuse elsewhere later. Test: renders with an accessible
  role/label (e.g. `accessibilityRole="image"`, `accessibilityLabel="Draw a Card"`), applies the
  documented fill/shadow — asserted via rendered style, not snapshot. *(FR-001, FR-003)*
- [X] T012 [P] [US1] Create `src/features/ui/PrimaryButton.tsx` + `.test.tsx`: full-width,
  `CONTROL_HEIGHT`, `radius.pill`, `brand.primary` fill, `brand.onPrimary` bold
  (`typography.button.label`) centered text, `shadow.raised`. Props: `label: string`, `onPress:
  () => void`, `disabled?: boolean`, `busy?: boolean`, `testID?`, `accessibilityLabel?` (defaults
  to `label`). Disabled → 60% opacity + `accessibilityState.disabled`. Test: renders label, calls
  `onPress`, disabled state blocks press and sets both the opacity style and
  `accessibilityState.disabled`, tap target ≥44×44 (rendered height check against
  `CONTROL_HEIGHT`). *(FR-001, FR-003, FR-013)*
- [X] T013 [P] [US1] Create `src/features/ui/SecondaryButton.tsx` + `.test.tsx`: same geometry as
  `PrimaryButton` (`CONTROL_HEIGHT`, `radius.pill`, full-width), `bg.surface` fill, `border.
  subtle` 1px, `text.primary` bold label — **no shadow** (per brief §3.2/§3.3, secondary buttons
  are flat). Same prop shape as `PrimaryButton` for interchangeability. Test: mirrors T012's
  cases minus the shadow/opacity-disabled specifics (secondary buttons aren't specified with a
  disabled-opacity rule in the brief — confirm behavior against brief §3.3, don't invent one it
  doesn't ask for). *(FR-001, FR-003, FR-013)*
- [X] T014 [P] [US1] Create `src/features/ui/OrDivider.tsx` + `.test.tsx`: a full-width hairline
  `border.subtle` rule with a small centered lowercase "o" on `bg.page`, breaking the line in the
  middle (e.g. two flex-1 `View` rules either side of a centered `Text`). Test: renders the "o"
  text and confirms it's not announced as an interactive element (no `accessibilityRole`
  implying interactivity). *(FR-001, FR-003)*
- [X] T015 [P] [US1] Create `src/features/ui/StatusPill.tsx` + `.test.tsx`: `accent.pillBg` fill,
  `text.link` label color, `radius.pill`, small horizontal padding, sized to content (not
  full-width). Props: `label: string`. Test: renders the label with the documented colors/shape,
  and — since brief §5.2 uses it non-interactively ("Cámara disponible") — confirms it does
  **not** carry `accessibilityRole="button"` by default (it's a status indicator, not a control).
  *(FR-001, FR-003, spec.md US3 AS4)*
- [X] T016 [US1] Create `src/features/ui/README.md`: a short note (mirroring `src/features/
  navigation/README.md`'s existing convention) explaining why this module exists outside any
  single backend-mirrored domain — the documented Constitution V exception from `plan.md`'s
  Constitution Check table, referencing `004-home-scan-shell`'s `src/features/navigation/` as
  the precedent for this exact kind of exception.

**Checkpoint**: All six shared primitives exist, tested, ready for both screen restyles.

### i18n layer (User Story 4)

- [X] T017 [P] [US4] Create `src/domain/i18n/locale.ts`: `export type Locale = "es" | "en";
  export const DEFAULT_LOCALE: Locale = "es";`. Zero React Native import. *(FR-012)*
- [X] T018 [US4] Create `src/domain/i18n/translate.ts` + `.test.ts`: export `translate<T extends
  Record<string, string>>(dictionary: { es: T; en: T }, locale: Locale, key: keyof T): string`.
  Test covers: resolving a key for `"es"` and for `"en"`; a `TypeScript`-level check (not
  runtime) that an invalid key doesn't compile — document this in a comment since it can't be a
  runtime assertion. Depends on: T017. Zero React Native import. *(FR-010)*
- [X] T019 [P] [US4] Create `src/domain/i18n/copy/login.ts` + `.test.ts`: `{ es: {...}, en: {...}
  }` covering every string `docs/design-brief-visual-identity.md` §4 specifies for the plain
  sign-in view (brand tagline, `CORREO`/`CONTRASEÑA` labels + placeholders, "Olvidé mi
  contraseña", "Entrar", "Crear cuenta", the legal line's three segments — plain text plus
  "Términos de Uso" and "Política de Privacidad" as separately-keyed link segments) **and** the
  existing (currently English-hardcoded) `SignInForm`/`RequestPasswordResetForm`/
  `ResetPasswordForm` copy that isn't in the brief's mockup but still needs both locales per
  spec.md FR-010 (form titles, server-error-adjacent static copy, resend-code copy, "Back to sign
  in", etc. — enumerate every literal string currently in those three files, not only the
  brief's explicit list). Write real, correctly-accented Spanish (`CONTRASEÑA`, not
  `CONTRASENA` — brief §4's explicit orthography note) and accurate English. `en`'s type is
  `Record<keyof typeof es, string>` so a missing key is a compile error. Test asserts
  `Object.keys(es).sort()` equals `Object.keys(en).sort()` (runtime key-parity, defense-in-depth
  beyond the type constraint). *(FR-010, spec.md US4 AS1/AS2)*
- [X] T020 [P] [US4] Create `src/domain/i18n/copy/scan.ts` + `.test.ts`: same shape as T019,
  covering every string `docs/design-brief-visual-identity.md` §5 specifies (`Escanear`/
  `Escanear carta` titles, viewfinder hint "Apunta la cámara a la carta", search placeholder
  "Buscar carta por nombre o código…", upload dropzone "Subir imagen de carta", "Escanear
  carta" button, "Cámara disponible" pill, empty-results-panel copy, "ESCANEOS RECIENTES" section
  label, "Back" affordance label) plus the placeholder recent-scans row content's static labels
  (name/meta/price format strings if any are literal copy vs. data). Same key-parity test pattern
  as T019. *(FR-010, spec.md US4 AS1/AS2)*
- [X] T021 [US4] Create `src/features/i18n/LocaleContext.tsx` + `.test.tsx`: a React context
  providing `{ locale: Locale, setLocale: (l: Locale) => void }` (default state `DEFAULT_LOCALE`,
  T017), exported `LocaleProvider` component, `useLocale()` hook, and a `useTranslation(
  dictionary: { es: T; en: T })` convenience hook wrapping `translate()` (T018) bound to the
  context's current `locale`. Test: renders a consumer under the default provider and confirms
  `"es"` strings resolve; calling `setLocale("en")` (via a test-only trigger component) and
  re-rendering resolves `"en"` strings instead. Depends on: T018. *(FR-010, FR-011, FR-012, spec.md
  US4 AS3/AS5)*
- [X] T022 [US4] Create `src/features/i18n/README.md`: documents the exact seam
  `007-localization` builds its language picker on (`useLocale().setLocale`), the current
  hardcoded default (`DEFAULT_LOCALE = "es"`, explicitly flagged as a placeholder, not a real
  detection/persistence decision — spec.md Assumptions), and how to add a new screen's dictionary
  (copy the `copy/login.ts`/`copy/scan.ts` pattern).

**Checkpoint**: Phase 2 complete. Tokens, primitives, and i18n mechanism exist, are unit-tested,
and font-loading is wired at the root. No screen has been touched yet.

---

## Phase 3: User Story 2 - The login screen reads as the branded app (Priority: P2)

**Goal**: `/login` matches `docs/design-brief-visual-identity.md` §4 on mobile and web, in both
shipped locales, with zero change to `005-login`'s FR-006/forgot-password-as-local-state
behavior.

**Independent Test**: Per spec.md — render `/login` at mobile and web widths, confirm content
order/copy/layout match §4; confirm every `005-login` behavioral test (sign-in, FR-006 guard,
forgot-password mode sequence) still passes unmodified.

### Implementation for User Story 2

- [X] T023 [US2] Restyle `src/features/identity/FormField.tsx` (mobile/default) to the `Field`
  spec: uppercase `label.field` above the input, `bg.surface` container, `radius.pill`,
  `CONTROL_HEIGHT`, 20px horizontal padding, **borderless with `shadow.surface`** (no
  `borderWidth`). Preserve the existing `FormFieldProps` shape (`label`, `error`, `children`,
  `testID`) exactly — every existing call site (`RegistrationForm`, `VerifyPhoneScreen`,
  `ProfileForm`, plus this feature's own `SignInForm`/`RequestPasswordResetForm`/
  `ResetPasswordForm`) continues to compile with no prop change. Depends on: T005, T006, T009.
  *(FR-001, FR-003, FR-005)*
- [X] T024 [US2] Create `src/features/identity/FormField.web.tsx`: same props/structure as T023,
  web treatment — 1px `border.input`, **no shadow**. Depends on: T023, T007, T009. *(FR-003,
  FR-005)*
- [X] T024a [US2] Extend `src/features/identity/FormField.test.tsx`: confirm the label renders
  uppercase, confirm mobile renders with a shadow style and no border, confirm the web variant
  (imported explicitly by path, mirroring how this repo already tests other `.web.tsx` files
  directly — see `docs/conventions.md`) renders with a border and no shadow. Confirm the error-
  text `accessibilityRole="alert"` behavior (pre-existing, must not regress) still holds. Depends
  on: T023, T024.
- [X] T025 [US2] Create `src/features/identity/LoginScreenChrome.tsx` (mobile): accepts `{
  children: ReactNode }`, renders an `expo-linear-gradient` pale-lime (`rgba(199,242,76,0.22)`)
  to `bg.page` vertical wash sized to ~45% of viewport height (via `useWindowDimensions()`),
  with `children` rendered below/within it on flat `bg.page` for the remainder. Depends on: T001,
  T009. *(spec.md US2 AS1)*
- [X] T026 [US2] Create `src/features/identity/LoginScreenChrome.web.tsx` (web): `bg.page`
  background with two large, low-opacity CSS `radial-gradient` blooms (top-right, bottom-left,
  `rgba(199,242,76,0.18)`, soft-edged via a fully-transparent outer gradient stop — no blur
  library needed, per plan.md's Research Decision), `children` rendered inside a centered card
  (`bg.surfaceMuted`, `radius.card`, `shadow.surface`, `maxWidth: 660`, `padding: 48`, vertically
  centered). Depends on: T007, T009. *(spec.md US2 AS2)*
- [X] T027 [US2] Create `src/features/identity/LoginScreenChrome.test.tsx`: confirm both variants
  render their `children` unchanged (a passthrough regression guard — chrome must never swallow
  or alter its children's content), and confirm the web variant's card container applies the
  documented `maxWidth`/`padding`/`radius`. Depends on: T025, T026.
- [X] T028 [US2] Restyle `src/features/identity/SignInForm.tsx`: replace raw `TextInput`+`Pressable`
  styling with `Field` (T023/T024, via the existing `FormField` import), `PrimaryButton` (T012)
  for "Entrar", `SecondaryButton` (T013, wrapping the existing `<Link href="/register">`
  behavior — unchanged navigation) for "Crear cuenta", `OrDivider` (T014) between them. Move the
  "Olvidé mi contraseña" `Pressable` to right-aligned `body.link` styling. Add the legal line
  ("Al continuar aceptas los **Términos de Uso** y la **Política de Privacidad**") as
  `body.legal`, both phrases in `text.link`. Route every rendered string through
  `useTranslation(loginCopy)` (T019/T021) — zero hardcoded copy left in this file. Preserve every
  existing prop (`onSubmit`, `onForgotPassword`, `isSubmitting`, `serverError`,
  `confirmationMessage`, `initialEmail`) and behavior (react-hook-form + `zodResolver
  (signInSchema)`, unchanged) exactly. Depends on: T009, T012, T013, T014, T019, T021, T023,
  T024. *(FR-006, spec.md US2 AS3, AS6)*
- [X] T029 [US2] Extend `src/features/identity/SignInForm.test.tsx`: every existing assertion
  (valid submission calls `onSubmit`; `serverError` renders; "Forgot password?" press calls
  `onForgotPassword`; "Create account" link's `href`) kept passing unmodified. Add: the legal
  line renders both link phrases; the forgot-password link is right-aligned (or at least present
  with the documented `body.link` role); rendering with the locale context set to `"en"` shows
  the English equivalents. Depends on: T028.
- [X] T030 [US2] Restyle `src/features/identity/RequestPasswordResetForm.tsx`: same field/button
  treatment as T028 (`Field`, `PrimaryButton` for "Send reset code", plain restyled `Pressable`
  or `SecondaryButton`-style for "Back to sign in" — match brief-adjacent visual vocabulary, no
  new content order), copy routed through `useTranslation(loginCopy)`. Preserve every existing
  prop/behavior (`onSubmit` boolean-resolving contract, `onBack`, `isSubmitting`, `serverError`,
  the anti-enumeration confirmation copy) exactly. Depends on: T009, T012, T019, T021, T023,
  T024. *(spec.md Assumptions — "forgot-password sub-views inherit the vocabulary")*
- [X] T031 [US2] Extend `src/features/identity/RequestPasswordResetForm.test.tsx`: every existing
  assertion kept passing unmodified; add a locale-switch rendering check. Depends on: T030.
- [X] T032 [US2] Restyle `src/features/identity/ResetPasswordForm.tsx`: same treatment as T030
  (`Field` for email/new-password, `CodeInput` unchanged internally but wrapped in the restyled
  `Field` label treatment, `PrimaryButton` for "Set new password", a restyled resend
  `Pressable`/`SecondaryButton`, restyled "Back to sign in"), copy routed through
  `useTranslation(loginCopy)`. Preserve every existing prop/behavior (the `RESEND_COOLDOWN_
  SECONDS` timer, the `serverError.field === "code"` inline-error wiring) exactly. Depends on:
  T009, T012, T019, T021, T023, T024. *(spec.md Assumptions)*
- [X] T033 [US2] Extend `src/features/identity/ResetPasswordForm.test.tsx`: every existing
  assertion kept passing unmodified; add a locale-switch rendering check. Depends on: T032.
- [X] T034 [US2] Modify `src/features/identity/LoginScreen.tsx`: wrap the existing per-mode JSX
  in `<LoginScreenChrome>...</LoginScreenChrome>` (T025/T026); in the `"sign-in"` mode branch
  only, render `BrandMark` (T011, 112px) + `display.xl` "Draw a Card" + `body.tagline` copy
  (`useTranslation(loginCopy)`) directly above `<SignInForm>`. **Zero change** to `mode` state,
  `signInSucceeded` handling, `handleSubmit`/`handleForgotPassword`/`handleRequestReset`/
  `handleResetSubmit`/`handleBackToSignIn`/`resetFlowState` — this task touches only the returned
  JSX tree, never the function bodies above it. The "Signing you in…" view's text also routes
  through `useTranslation(loginCopy)`. Depends on: T011, T025, T026, T028, T030, T032. *(FR-006 —
  regression-critical, spec.md US2 AS4/AS5)*
- [X] T035 [US2] Extend `src/features/identity/LoginScreen.test.tsx`: **run the existing suite
  first and confirm every current assertion passes unmodified** — especially the FR-006
  regression guard (no `useRouter()`/navigation call on successful sign-in) and the
  "reset-with-code" step never touching the shared `signIn` prop. Add: `BrandMark`/title/tagline
  render only in `"sign-in"` mode, not in `"request-reset"`/`"reset-with-code"`/the "Signing you
  in…" view. Depends on: T034.
- [X] T036 [US2] Confirm `app/(auth)/login.tsx` needs no prop-shape change (it passes `signIn`/
  `requestPasswordReset`/`createPasswordRecoverySession` into `LoginScreen`, all unchanged by
  T034) — if it does need any change, it must be import-path-only, never new logic. Confirm
  `app/(auth)/login.test.tsx` still passes unmodified. Depends on: T034.
- [X] T037 [US2] Manual smoke check (Level 3, `docs/verification.md`): `npm run web` — confirm
  the mobile-width gradient wash, the desktop-width card-over-blooms, the bordered-vs-borderless
  field switch at the 768px boundary, the FR-006 "Signing you in…" transition with no navigation,
  and both locales render correctly (toggle via a temporary dev harness). Repeat on iOS/Android
  simulators — confirm the bundled Playfair Display serif renders (not a system-font
  substitute). Record findings in `progress/impl_006-visual-identity.md`. Depends on: T035, T036.

**Checkpoint**: User Story 2 complete — `/login` is fully restyled on both platforms, in both
locales, with zero behavioral regression from `005-login`.

---

## Phase 4: User Story 3 - The scan screen's visual shell matches the brand (Priority: P3)

**Goal**: `/scan` renders the full visual shell from `docs/design-brief-visual-identity.md` §5 on
mobile and web, with zero camera import/capture/recognition and the existing "Back" affordance
kept.

**Independent Test**: Per spec.md — render `/scan` at mobile and web widths (above/below the
768px breakpoint), confirm every element in §5 renders inertly and accessibly; confirm the
migrated camera-import source-inspection test still passes.

### Implementation for User Story 3

- [X] T038 [P] [US3] Create `src/features/scanner/Viewfinder.tsx` + `.test.tsx`: `viewfinder.bg`
  fill, `radius.panel`, ~4:3 aspect ratio, a faint `viewfinder.grid` 4×4 grid (drawn via absolute
  -positioned thin `View` lines, not an image), four lime L-shaped corner brackets inset ~16px
  (~36px long, 3px thick, `brand.primary` color), a centered camera glyph
  (`@expo/vector-icons`) above `viewfinder.hintText`-colored copy (`useTranslation(scanCopy)`,
  "Apunta la cámara a la carta"), and a small circular settings-gear chip inset top-right
  (rendered non-interactive — `accessibilityElementsHidden`/no button role — per spec.md US3
  AS4, since pressing it does nothing in this feature). Zero camera-module import — plain
  drawing only. Test: renders the hint text, confirms the gear chip is not exposed as a button
  role, confirms via source-inspection (mirroring `004`'s existing technique) that this file
  imports no `expo-camera`/`expo-image-picker`/camera-matching line. Depends on: T009, T020,
  T021. *(FR-007, spec.md US3 AS1/AS4/AS5)*
- [X] T039 [P] [US3] Create `src/features/scanner/ScanSearchField.tsx` + `.test.tsx`: `bg.
  surface`, `radius.row`, `CONTROL_HEIGHT`, placeholder "Buscar carta por nombre o código…"
  (`useTranslation(scanCopy)`), a magnifier glyph at the trailing edge, minimum 44×44 tap target
  on the glyph if it's ever made pressable (it isn't in this feature — a plain `TextInput` that
  accepts focus/typing is fine as "inert" since typing itself does nothing yet; document this
  explicitly in a code comment). Depends on: T009, T020, T021. *(FR-007, FR-013)*
- [X] T040 [P] [US3] Create `src/features/scanner/UploadDropzone.tsx` + `.test.tsx`: 1px dashed
  `border.dashed`, `radius.row`, centered "Subir imagen de carta" (`useTranslation(scanCopy)`)
  with a leading upload glyph. Non-interactive in this feature (no `expo-image-picker` call) —
  rendered without an actionable `accessibilityRole` (labeled as static informational content,
  per spec.md US3 AS4). Depends on: T009, T020, T021. *(FR-007, FR-013)*
- [X] T041 [P] [US3] Create `src/features/scanner/EmptyResultsPanel.tsx` + `.test.tsx` (web-only
  component, rendered only from `ScanShellScreen.web.tsx`): 1px dashed `border.dashed`,
  `radius.panel`, tall, centered playing-card glyph, "Escanea una carta para ver sus detalles
  aquí" (`text.secondary`) and "Los resultados aparecerán automáticamente" (`text.placeholder`,
  smaller) — both via `useTranslation(scanCopy)`. Depends on: T009, T020, T021. *(FR-007)*
- [X] T042 [P] [US3] Create `src/features/scanner/RecentScansList.tsx` + `.test.tsx` (web-only):
  `label.section` "ESCANEOS RECIENTES" heading (`useTranslation(scanCopy)`), then a stack of
  static local placeholder rows (`bg.surface`, `radius.row`, `shadow.surface`, padding 16 — a
  44px rounded colored thumbnail, name in `text.primary`/600 over meta in `text.secondary`/12,
  right-aligned price in `accent.priceGreen`) defined as a local, clearly-commented placeholder
  array (**a comment stating explicitly this is placeholder-until-the-real-scanner-feature-
  ships, no `src/domain` import, no fetch call anywhere in this file** — spec.md FR-008). Depends
  on: T009, T020, T021. *(FR-008, spec.md US3 AS6)*
- [X] T043 [US3] Create `src/features/scanner/ScanShellScreen.tsx` (mobile/default): single
  column, 20px padding, composes `display.lg` title "Escanear" (`useTranslation(scanCopy)`),
  `Viewfinder` (T038), `ScanSearchField` (T039), `UploadDropzone` (T040), `PrimaryButton` "Escanear
  carta" (T012, disabled/no-op `onPress` — pressing it does nothing in this feature, documented
  in a comment referencing FR-007). Depends on: T011–T015 (indirectly via T038–T042), T038–T040,
  T012. *(FR-007, spec.md US3 AS1)*
- [X] T044 [US3] Create `src/features/scanner/ScanShellScreen.web.tsx`: reads
  `useWindowDimensions()` and `src/domain/navigation.ts`'s existing `BREAKPOINT_PX` (reused, not
  redefined) to render two columns at ≥768px (left: `display.lg` title "Escanear carta" +
  `StatusPill` "Cámara disponible" (T015) side by side, then `Viewfinder`/`ScanSearchField`/
  `UploadDropzone`/`PrimaryButton`; right: `EmptyResultsPanel` (T041) above `RecentScansList`
  (T042)) or one column (controls, then the results panel/list below) below 768px. Depends on:
  T011–T015, T038–T042, T012. *(FR-007, spec.md US3 AS2/AS3)*
- [X] T045 [US3] Create `src/features/scanner/ScanShellScreen.test.tsx`: renders the title,
  viewfinder hint text, search placeholder, dropzone copy, and primary button; confirms the web
  variant's two-column-vs-one-column collapse at the breakpoint (mock `useWindowDimensions`, same
  technique `004-home-scan-shell`'s own breakpoint tests already use). **Includes the migrated
  camera-import source-inspection guard** (FR-007): read `ScanShellScreen.tsx`,
  `ScanShellScreen.web.tsx`, and every file under `src/features/scanner/` this feature added
  (T038–T044) from disk, assert none contains an `expo-camera`/`expo-image-picker`/camera-
  matching import line — same technique as the retired `ScanPlaceholderScreen.test.tsx`, not
  weakened. Depends on: T043, T044. *(FR-007, SC-004)*
- [X] T046 [US3] Remove `src/features/scanner/ScanPlaceholderScreen.tsx` and
  `ScanPlaceholderScreen.test.tsx` — confirm no remaining import references it anywhere (grep the
  full repo). Depends on: T045 (the guard must already be migrated before the old file/test is
  deleted, so the repo is never without this guard even mid-task).
- [X] T047 [US3] Modify `app/scan.tsx`: import `ScanShellScreen` (T043/T044) in place of
  `ScanPlaceholderScreen`; restyle the existing "Back" `Pressable` (still calling
  `router.back()`, unchanged) with token-driven styling — a single, narrow `Platform.select` for
  the icon/label color against the two different backgrounds is acceptable here per
  `docs/conventions.md`'s explicit allowance (not a full `.web.tsx` fork for one style value).
  Depends on: T045, T046. *(FR-009, spec.md US3 AS1)*
- [X] T048 [US3] Update `app/scan.test.tsx`: keep the existing `router.back()`-on-press assertion
  unmodified; update the "renders the scanner stub screen" assertion to match the new shell's
  actual copy/roles (title "Escanear", not "Scanner coming soon"). Depends on: T047.
- [X] T049 [US3] Manual smoke check (Level 3): `npm run web` at a mobile width — confirm the
  single-column shell and working "Back" press (returns to Home with the shell intact, per
  `004`'s existing US2 AS2 behavior). Resize across 768px — confirm the two-column-to-one-column
  collapse. Confirm both locales render correctly. Repeat on iOS/Android simulators — confirm
  VoiceOver/TalkBack announces the inert controls (gear chip, dropzone, search field, disabled
  primary button) as non-actionable where appropriate, and the real "Back" affordance correctly.
  Run `grep -rn "expo-camera\|expo-image-picker" src/features/scanner/` and confirm zero matches.
  Record findings in `progress/impl_006-visual-identity.md`. Depends on: T048.

**Checkpoint**: User Story 3 complete — `/scan`'s visual shell is fully built on both platforms,
in both locales, with the camera-prohibition guard intact and migrated.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T050 [P] Accessibility pass (Constitution VII) across every new/restyled component from
  Phases 2–4 — accessibility labels on every interactive element, ≥44×44 tap targets (explicitly
  re-check the gear chip, magnifier, "Olvidé mi contraseña" link, and `StatusPill` per brief §6),
  visible keyboard focus order on web across both screens, and confirm no inert scan control
  carries a bare `accessibilityRole="button"` it doesn't back up with real behavior. Fix findings
  in place; no new files.
- [X] T051 [P] Responsive layout check at a 375px-wide web viewport and a typical desktop width,
  plus phone and tablet form factors on iOS/Android simulators, for both `/login` and `/scan` in
  both locales (spec.md SC-006). Fix findings in place.
- [X] T052 Run the **full** existing test suite (`npm test`, not a filtered subset) and confirm
  every pre-existing test outside this feature's own new/modified files still passes — this is
  the explicit regression check for `plan.md`'s disclosed `FormField` side effect (restyling it
  in place also changes `RegistrationForm`/`VerifyPhoneScreen`/`ProfileForm`'s rendered
  appearance, though not their asserted behavior). If any pre-existing test fails because it
  asserted a now-changed visual detail (e.g. a literal color/radius), fix the *test* to assert
  behavior/role/text instead (per `docs/conventions.md`'s testing guidance), never silently
  revert `FormField`'s restyle to make an unrelated test pass. Depends on: all of Phase 3/4.
- [X] T053 Confirm `src/theme/contrast.test.ts` (T008) is green, and re-run the
  `grep -rn "expo-camera\|expo-image-picker" src/features/scanner/` check from T049 one more time
  after all Phase 4/5 edits, to catch any last-minute import creep. Depends on: T052.
- [X] T054 Run `./init.sh` end to end (no `--skip-*` flags) and confirm `RESULT: SUCCESS` — Tests
  stage OK, type-check clean, native-dependency-alignment clean for the three new dependencies
  (T001), and all three bundle exports (web/iOS/Android) clean, confirming the font/gradient
  additions and the `/scan` file removal (T046) didn't break any target's bundle. Depends on:
  T053.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — BLOCKS every later phase (font/gradient packages needed by T004,
  T025, T026, T010).
- **Foundational (Phase 2)**: T002–T022 — BLOCKS User Stories 2 and 3 entirely. Internally: the
  token module (T002–T009) mostly parallel, then the primitives (T011–T016) depend on the token
  module, and the i18n layer (T017–T022) is independent of the token module but both must finish
  before Phase 3/4 start (both screens need primitives *and* copy).
- **User Story 2 (Phase 3, P2)**: Depends on all of Phase 2. Mostly sequential within the phase
  (`Field` → `LoginScreenChrome` → each form → `LoginScreen` → screen glue → smoke check), since
  each layer wraps or is wrapped by the previous one.
- **User Story 3 (Phase 4, P3)**: Depends on all of Phase 2 (not on Phase 3 — independently
  buildable in parallel with it if desired, since scan and login share no component beyond the
  Phase 2 foundation). Internally: T038–T042 (the five presentational pieces) can run in
  parallel, then T043/T044 compose them, then T045–T049 sequential.
- **Polish (Phase 5)**: Depends on both User Stories being complete.

### Parallel Opportunities

- Phase 2: T002, T003, T004 in parallel; T006/T007 in parallel; T011–T015 (the five primitives
  with disjoint files) in parallel once the token module (T009) lands; T017, T019, T020 in
  parallel.
- Phase 3 and Phase 4 can be worked in parallel by two independent task-implementer passes once
  Phase 2 is fully checkpointed, since they share no file.
- Within Phase 4: T038, T039, T040, T041, T042 (five disjoint files) in parallel once T009/T020/
  T021 are done.
- Phase 5: T050 and T051 in parallel; T052–T054 sequential (each depends on the prior).

---

## Parallel Example: Phase 2 primitives (after T009 lands)

```bash
Task: "Create src/features/ui/BrandMark.tsx + test"
Task: "Create src/features/ui/PrimaryButton.tsx + test"
Task: "Create src/features/ui/SecondaryButton.tsx + test"
Task: "Create src/features/ui/OrDivider.tsx + test"
Task: "Create src/features/ui/StatusPill.tsx + test"
```

## Parallel Example: Phase 4 presentational pieces (after T009/T020/T021 land)

```bash
Task: "Create src/features/scanner/Viewfinder.tsx + test"
Task: "Create src/features/scanner/ScanSearchField.tsx + test"
Task: "Create src/features/scanner/UploadDropzone.tsx + test"
Task: "Create src/features/scanner/EmptyResultsPanel.tsx + test"
Task: "Create src/features/scanner/RecentScansList.tsx + test"
```

---

## Implementation Strategy

### Foundation First, Then the Higher-Risk Screen

1. Complete Phase 1 (Setup) and Phase 2 (Foundational) in full — nothing in Phase 3/4 compiles
   without the token module, primitives, and i18n layer.
2. Complete Phase 3 (User Story 2, login) next — the higher behavioral-regression-risk restyle,
   sequenced first so any FR-006/forgot-password regression is caught early, while `005-login`'s
   test suite is still fresh context.
3. **STOP and VALIDATE**: run T037's manual smoke check and confirm `005-login`'s full existing
   test suite is green before starting Phase 4.
4. Complete Phase 4 (User Story 3, scan) — lower risk, no existing behavioral logic underneath
   (the retired `ScanPlaceholderScreen` was a single static stub).
5. Complete Phase 5 (Polish) — the full-suite regression run (T052) and `./init.sh` (T054) are
   the final gate before this feature can be marked `done`.
