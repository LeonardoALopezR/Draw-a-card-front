# Implementation Progress — 006-visual-identity

## Run 1 (2026-08-05) — T001: Add runtime dependencies

### Task

`T001 Add three new runtime dependencies: npx expo install expo-font expo-linear-gradient ...
and npm install @expo-google-fonts/playfair-display ...` per `specs/006-visual-identity/tasks.md`.

### What was done

1. `npx expo install expo-font expo-linear-gradient` — native-module packages, resolved and
   installed at the versions Expo SDK 51 expects:
   - `expo-font@~12.0.10`
   - `expo-linear-gradient@~13.0.2`
   - `expo install` also auto-registered `expo-font`'s config plugin in `app.json`'s
     `expo.plugins` array (`["expo-router", "expo-font"]`) — this is `expo install`'s own
     automatic side effect for native packages that ship a config plugin, not a manual edit.
     Flagging it explicitly since the task instructions said "don't touch anything beyond
     package.json/package-lock.json" — this one `app.json` line is an unavoidable, expected
     byproduct of running the exact command T001 specifies, not a deviation I chose. No other
     part of `app.json` changed.
2. `npm install @expo-google-fonts/playfair-display` — pure-JS font-asset package, no native
   alignment needed. Installed at `^0.4.2`.
3. `package.json` now records all three under `dependencies`:
   ```
   "@expo-google-fonts/playfair-display": "^0.4.2",
   "expo-font": "~12.0.10",
   "expo-linear-gradient": "~13.0.2",
   ```
   `package-lock.json` updated accordingly (not hand-edited, produced by npm).

### Font export-name verification (for T004's benefit)

Inspected `node_modules/@expo-google-fonts/playfair-display/index.js` and `index.d.ts`
directly. The 700-weight export is:

```
export const PlayfairDisplay_700Bold = require('./700Bold/PlayfairDisplay_700Bold.ttf');
```

**This matches exactly** what `tasks.md`'s T004 hardcodes
(`PLAYFAIR_DISPLAY_BOLD = "PlayfairDisplay_700Bold"`). No discrepancy — T004 can proceed as
written, no correction needed.

### Verification

Ran the full `./init.sh` (no skip flags):

```
▶ 1/8 Checking prerequisites          ✅ OK — node v20.20.2, npm v10.8.2
▶ 2/8 Environment file                ✅ OK — .env already exists, left untouched
▶ 3/8 Installing dependencies         ✅ OK — dependencies installed
▶ 4/8 Type-checking                   ✅ OK — no type errors
▶ 5/8 Expo config/dependency health   ⚠️  WARN — pre-existing "outdated dependencies" advisory
▶ 6/8 Native dependency alignment     ⚠️  WARN — version drift on expo-image-picker, react-native,
                                          react-native-safe-area-context, @types/react, typescript
▶ 7/8 Running test suite              ✅ OK — all tests passed
▶ 8/8 Bundle export smoke checks      ✅ OK — web/iOS/Android all exported cleanly

RESULT: SUCCESS (10/10 stages passed)
```

The two Stage 6 warnings are pre-existing drift on packages this task did not touch
(`expo-image-picker`, `react-native`, `react-native-safe-area-context`, `@types/react`,
`typescript`) — none of them are `expo-font` or `expo-linear-gradient`. **Neither of the two
`expo install`-managed packages this task added appears anywhere in the native-dependency-
alignment warning** — confirming T001's explicit acceptance criterion ("no version-drift
warning appears for the two `expo install`-managed packages") is met. `expo-doctor`'s Stage 5
warning is the same underlying pre-existing drift, not new.

`RESULT: SUCCESS` overall (10/10 stages), tests green, type-check clean, all three bundle
targets export cleanly.

### Files changed

- `/Users/leo/Desktop/DrawACard/Draw-a-card-front/package.json` — added the three dependencies.
- `/Users/leo/Desktop/DrawACard/Draw-a-card-front/package-lock.json` — npm-generated lockfile
  update for the three new packages (and their own transitive deps).
- `/Users/leo/Desktop/DrawACard/Draw-a-card-front/app.json` — one-line automatic side effect of
  `expo install expo-font` (added `"expo-font"` to the `plugins` array). Not a manual edit;
  documented above.
- `/Users/leo/Desktop/DrawACard/Draw-a-card-front/specs/006-visual-identity/tasks.md` — T001
  marked `[X]`.
- `/Users/leo/Desktop/DrawACard/Draw-a-card-front/progress/impl_006-visual-identity.md` — this
  report (new file).

### Requirement traceability

T001 is a Setup-phase infrastructure task with no `FR-00x` of its own to satisfy directly (per
`tasks.md`, its citation is spec.md's Clarifications Recorded default 1 and plan.md's Technical
Context, not a functional requirement) — no test is expected at this stage. Traceability for
the FRs these dependencies enable (font loading, gradient backgrounds) lands with T004/T010/
T025/T026 in a later run.

### Task IDs now `[X]`

- T001

### Deviations / notes for sign-off

- `app.json`'s one-line `plugins` addition (`"expo-font"`) is an unavoidable, automatic
  byproduct of `npx expo install expo-font` as specified verbatim in T001's own instructions —
  flagged here rather than silently left out of the report, per the "don't touch anything
  beyond package.json/package-lock.json" note in my task brief. No sign-off action needed; this
  is expected `expo install` behavior for a native package with a config plugin, and removing it
  would leave the package non-functional.
- No other deviations. Font export name matches T004's hardcoded assumption exactly (see above).

Next: T002+ (Phase 2, token module) — not started, out of scope for this run.

## Run 2 (2026-08-05) — T002–T009: Token module (User Story 1)

### Task

`T002`–`T009` from `specs/006-visual-identity/tasks.md` — the entire "Token module (User
Story 1)" subsection: `src/theme/colors.ts`, `geometry.ts`, `fonts.ts`, `typography.ts`,
`shadows.ts`, `shadows.web.ts`, `contrast.ts` (+ `contrast.test.ts`), `index.ts`. T010 (root
`useFonts()`/`LocaleContext` wiring) explicitly excluded — it depends on T021 (i18n context),
not yet built.

### Files changed

- `src/theme/colors.ts` — NEW. `colors` `const` (`as const`), zero RN import. Structured
  exactly per the task brief: `{ brand: {primary, onPrimary}, text: {primary, secondary,
  placeholder, link}, viewfinder: {bg, grid, hintText}, bg: {page, surface, surfaceMuted},
  border: {subtle, input, dashed}, accent: {priceGreen, pillBg} }`. Uses spec.md Clarifications
  "Recorded default 2" **adjusted** values for the four that changed (`text.secondary:
  "#646B78"`, `text.placeholder: "#6D7787"`, `viewfinder.hintText: "#9CA3AF"` — a token
  distinct from `text.placeholder`, `text.link: "#247B3D"`, `accent.priceGreen: "#1C844A"`);
  every other value taken verbatim from brief §2.1. A code comment records why the four values
  differ from the brief and points at `contrast.test.ts` as the executable guard.
- `src/theme/geometry.ts` — NEW. `radius` (`{pill:999, card:28, panel:20, tile:26, row:16}`),
  `space` (`{xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32, huge:40, giant:48}`),
  `CONTROL_HEIGHT = 56`. Zero RN import.
- `src/theme/fonts.ts` — NEW. `export const PLAYFAIR_DISPLAY_BOLD =
  "PlayfairDisplay_700Bold"`. Verified directly against
  `node_modules/@expo-google-fonts/playfair-display/index.js` before hardcoding (re-verified
  independently in this run, not just trusting T001's report — see "Verification" below): the
  package's own export is `export const PlayfairDisplay_700Bold =
  require('./700Bold/PlayfairDisplay_700Bold.ttf');`. Exact match, no correction needed. Zero
  RN import.
- `src/theme/typography.ts` — NEW. `typography` object matching brief §2.2's table exactly:
  `display.xl`/`display.lg` (40/28, 700, `fontFamily: PLAYFAIR_DISPLAY_BOLD`), `body.tagline`
  (15/400, `colors.text.secondary`), `label.field` (12/500, uppercase, `letterSpacing: 0.08 *
  12`, `colors.text.secondary`), `body.input` (16/400 — the iOS-zoom-on-focus floor),
  `button.label` (16/700), `body.link` (14/500, `colors.text.link`), `body.legal` (12/400,
  centered, `colors.text.secondary`, with a doc-comment convention for embedded
  `text.link`-colored spans — nested `<Text>` children inheriting `body.legal`'s non-color
  properties), `label.section` (12/600, uppercase, letter-spaced — same 0.08em spacing as
  `label.field`, since the brief only says "letter-spaced" without a distinct numeric value for
  this role). Only a type-only `import type { TextStyle } from "react-native"` — erased at
  compile time, confirmed this doesn't pull in a runtime RN dependency (no other import from
  `"react-native"` in the file). Depends on `colors.ts`/`fonts.ts`.
- `src/theme/shadows.ts` — NEW (native). `shadowSurface`/`shadowRaised` as `ViewStyle`-shaped
  objects. One deviation from a literal reading of the brief worth flagging: the brief's
  `rgba(16,40,26,0.06)`/`rgba(16,40,26,0.12)` values are decomposed into `shadowColor: "#10281A"`
  (the opaque RGB channel — `16,40,26` in decimal is exactly `#10281A`, which also happens to
  equal `colors.brand.onPrimary`) plus `shadowOpacity: 0.06`/`0.12` (the alpha channel) rather
  than passing the `rgba(...)` string straight through as `shadowColor`. Native's
  `shadowOpacity` multiplies with whatever alpha `shadowColor` itself carries — passing the
  already-translucent `rgba(...)` string as `shadowColor` would double-apply the alpha (roughly
  `0.06 × 0.06 ≈ 0.0036`), rendering the shadow far fainter than the brief's intended 6%/12%
  opacity. Documented inline in the file. `shadowRadius`/`shadowOffset`/`elevation` map directly
  from the brief's blur/y-offset values (2/12/2 and 6/20/6).
- `src/theme/shadows.web.ts` — NEW (web). Same two export names as `{ boxShadow: "0px 2px
  12px rgba(16,40,26,0.06)" }` / `{ boxShadow: "0px 6px 20px rgba(16,40,26,0.12)" }` — no
  decomposition needed here since CSS `box-shadow`'s own syntax already takes an rgba color
  directly.
- `src/theme/contrast.ts` — NEW. Pure `contrastRatio(fg: string, bg: string): number`
  implementing the real WCAG relative-luminance formula (hex → sRGB channels → linear-light via
  the `c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4` piecewise function → `0.2126R +
  0.7152G + 0.0722B` → `(lighter+0.05)/(darker+0.05)`, order-independent). Zero RN import.
- `src/theme/contrast.test.ts` — NEW. Asserts against the **real** `colors` export from
  `colors.ts` (imported, not duplicated as hardcoded hex strings) that every pairing spec.md's
  Clarifications "Recorded default 2" table lists clears `>= 4.5`: `brand.onPrimary` on
  `brand.primary`; `text.secondary` on `bg.page`/`bg.surface`/`bg.surfaceMuted`;
  `text.placeholder` on `bg.surface`; `viewfinder.hintText` on `viewfinder.bg`; `text.link` on
  `bg.page`/`bg.surface`/`bg.surfaceMuted`/`accent.pillBg`; `accent.priceGreen` on `bg.surface`.
  Plus three formula sanity checks (identical colors → ratio 1, black-on-white → ratio 21,
  order-independence). This is a real computed regression guard, not hardcoded expected
  numbers — every assertion reads live off `colors.ts`.
- `src/theme/index.ts` — NEW. Barrel-exports `colors`, `typography`, `radius`/`space`/
  `CONTROL_HEIGHT`, `PLAYFAIR_DISPLAY_BOLD`, `shadowSurface`/`shadowRaised` (imported from
  `"./shadows"` by its unsuffixed base name so Metro's platform resolution — and, under Jest,
  the `jest-expo` preset's `platform: "ios"` default — picks the right file, exactly like
  `app/(app)/_layout.web.tsx`'s existing `.web.tsx` resolution), `contrastRatio`, plus a
  combined `theme` namespace object (`theme.colors.brand.primary`, etc.) for callers who prefer
  one import over many named ones.
- `specs/006-visual-identity/tasks.md` — T002–T009 marked `[X]`.
- `progress/impl_006-visual-identity.md` — this section (appended, not overwritten).

### Verification

1. **Font export-name re-verification** (T004's explicit instruction to check, not assume):
   ```
   $ cat node_modules/@expo-google-fonts/playfair-display/index.js | head
   export const PlayfairDisplay_700Bold = require('./700Bold/PlayfairDisplay_700Bold.ttf');
   ```
   Matches `PLAYFAIR_DISPLAY_BOLD = "PlayfairDisplay_700Bold"` exactly.

2. **Contrast values computed independently** (before writing the test, to confirm the task
   brief's adjusted hex values genuinely clear 4.5:1, not just trust the spec's own table) —
   ran the same relative-luminance formula in a standalone Node script against the literal hex
   values going into `colors.ts`:
   ```
   onPrimary/primary        12.11
   secondary/page            4.57
   secondary/surface         5.36
   secondary/surfaceMuted    5.04
   placeholder/surface       4.53
   hintText/viewfinderBg     7.60
   link/page                 4.51
   link/surface              5.28
   link/surfaceMuted         4.96
   link/pillBg               4.66
   priceGreen/surface        4.72
   ```
   Every pairing clears 4.5:1, matching spec.md's table to two decimal places.

3. **Type-check**: `npx tsc --noEmit` — clean, no errors.

4. **`src/theme` tests**:
   ```
   PASS src/theme/contrast.test.ts
   Test Suites: 1 passed, 1 total
   Tests:       9 passed, 9 total
   ```
   Confirms the contrast test suite genuinely passes against the real token values (not just
   that the formula compiles).

5. **Full existing test suite** (regression check — no other file was touched this run):
   ```
   Test Suites: 45 passed, 45 total
   Tests:       311 passed, 311 total
   ```

6. **`./init.sh` (full, no skip flags)**:
   ```
   ▶ 1/8 Checking prerequisites          ✅ OK
   ▶ 2/8 Environment file                ✅ OK
   ▶ 3/8 Installing dependencies         ✅ OK
   ▶ 4/8 Type-checking                   ✅ OK — no type errors
   ▶ 5/8 Expo config/dependency health   ⚠️  WARN — same pre-existing "outdated dependencies"
                                             advisory T001's report already documented
   ▶ 6/8 Native dependency alignment     ⚠️  WARN — same pre-existing drift (expo-image-picker,
                                             react-native, react-native-safe-area-context,
                                             @types/react, typescript) — none of this run's
                                             files are native-module packages, so nothing new
   ▶ 7/8 Running test suite              ✅ OK — all tests passed
   ▶ 8/8 Bundle export smoke checks      ✅ OK — web/iOS/Android all exported cleanly

   RESULT: SUCCESS (10/10 stages passed)
   ```
   The two Stage 5/6 warnings are identical, pre-existing, and unrelated to this run's files
   (confirmed against T001's own report — same five package names, same reasons).

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-001 (semantic token names, no raw hex/magic literal at a consumer) | `src/theme/colors.ts`/`geometry.ts`/`typography.ts`/`shadows.ts`/`shadows.web.ts` are the semantic-name source of truth; no consumer exists yet in this batch to grep-check (that check lands with the primitives/screens in later batches) — `contrast.test.ts`'s own assertions read the real `colors` export, not duplicated hex, demonstrating the pattern. |
| FR-002 (dark-theme-ready structure) | Structural — `colors.ts`'s nested-object shape (`{ brand: {...}, text: {...}, ... }`) leaves room for a future second value set per semantic name without changing any call site; no dedicated test (a structural property, not a runtime behavior — matches `docs/verification.md`'s "plain literal-data const object typically doesn't need a dedicated test file" guidance). |
| FR-004 (every text/background pairing clears 4.5:1, using the adjusted values) | `src/theme/contrast.test.ts` — all 6 pairing groups ("token contrast pairings clear WCAG AA 4.5:1 (FR-004, Recorded default 2)" describe block), 9/9 tests passing. |
| FR-005 (platform-specific rendering split via file convention, not inline `Platform.OS`) | `src/theme/shadows.ts` (native) / `src/theme/shadows.web.ts` (web) — same two export names, Metro/Jest platform-extension resolution picks the right one; zero `Platform.OS` branch in either file. No dedicated test in this batch (elevation's actual visual effect is exercised once a primitive consumes it, later batch) — the file-split itself is the FR-005 compliance mechanism. |

Recorded default 2's contrast table (spec.md Clarifications) is the direct source for `colors.ts`'s
four adjusted values and is the table `contrast.test.ts` regression-guards.

### Task IDs now `[X]`

- T002, T003, T004, T005, T006, T007, T008, T009

### Deviations / notes for sign-off

- **`shadows.ts`'s `shadowColor` decomposition** (see "Files changed" above): the brief's §2.4
  table gives `rgba(16,40,26,0.06)`/`rgba(16,40,26,0.12)` as single values, and the task brief
  says "per brief §2.4" without specifying how to split that into native's separate
  `shadowColor`/`shadowOpacity` fields. I decomposed it as opaque hex `#10281A` (== `16,40,26`
  decimal, which also happens to equal `colors.brand.onPrimary`) + the alpha as `shadowOpacity`,
  rather than passing the `rgba(...)` string directly as `shadowColor`, because native's
  `shadowOpacity` multiplies against whatever alpha `shadowColor` already carries — passing the
  translucent rgba string as-is would silently double-apply the alpha and render the shadow far
  fainter than intended (~0.0036 effective opacity instead of 0.06). This is a correctness
  judgment call within T006's own scope (the task didn't specify the exact field-by-field split),
  flagged here for visibility rather than treated as self-evidently correct. `shadows.web.ts`
  needed no equivalent decomposition since CSS `box-shadow` takes the rgba color directly.
- `label.section`'s `letterSpacing` value: the brief only says "letter-spaced" for this role
  without a distinct numeric value (unlike `label.field`'s explicit `~0.08em`). Used the same
  `0.08 * 12` spacing as `label.field` for consistency (both are uppercase, 12px, sans-serif
  section-style labels) — flagged as a judgment call, not an explicit spec value, in case the
  human wants a different number when `label.section` is actually consumed (T042's
  "ESCANEOS RECIENTES" heading, a later batch).
- No other deviations from the task brief. T010 (root layout wiring) correctly left out of
  scope per the batch instructions — it depends on T021 (i18n context), not yet built.

Next: T011+ (shared primitives, User Story 1) and T017+ (i18n layer, User Story 4) — not
started, out of scope for this run.

## Run 3 (2026-08-05) — T011–T016: Shared primitives (User Story 1)

### Scope

Implemented the five shared UI primitives `docs/design-brief-visual-identity.md` §3 specifies
(minus `Field`, which stays `src/features/identity/FormField.tsx` per plan.md's explicit
instruction and lands in a later batch), plus the `src/features/ui/README.md` documenting the
Constitution Principle V exception this module represents.

### Files changed

- `src/features/ui/BrandMark.tsx` (new) — a `radius.tile` rounded square, `brand.primary` fill,
  `shadow.raised`, centered serif "D" glyph (`typography.display.lg`'s `fontFamily`/`fontWeight`)
  in `brand.onPrimary`, default `size=112`, scalable via a `size` prop. Renders as an
  `accessibilityRole="image"` element with `accessibilityLabel="Draw a Card"` — note the
  `accessible` prop had to be set explicitly (see Deviations below) for
  `@testing-library/react-native`'s `getByRole` to recognize it.
- `src/features/ui/BrandMark.test.tsx` (new) — 4 tests: accessible image role/label; documented
  `brand.primary` fill / `radius.tile` / `shadow.raised` (via `shadowOpacity > 0`) / default
  112px size, asserted via rendered style, not snapshot; the `size` prop resizes the tile; the
  "D" glyph renders in `brand.onPrimary` using the Playfair Display family.
- `src/features/ui/PrimaryButton.tsx` (new) — full-width, `CONTROL_HEIGHT`, `radius.pill`,
  `brand.primary` fill, `brand.onPrimary` bold centered label (`typography.button.label`),
  `shadow.raised`. Props: `label`, `onPress`, `disabled?`, `busy?`, `testID?`,
  `accessibilityLabel?` (defaults to `label`). `disabled || busy` renders at 60% opacity, blocks
  the press handler, and sets `accessibilityState.disabled`.
- `src/features/ui/PrimaryButton.test.tsx` (new) — 5 tests: label render + `onPress` call;
  disabled blocks press + 60% opacity + `accessibilityState.disabled`; `busy` treated the same
  as `disabled`; full-width/`CONTROL_HEIGHT`(>=44)/`radius.pill`/`brand.primary` fill; label
  override via `accessibilityLabel`.
- `src/features/ui/SecondaryButton.tsx` (new) — same geometry as `PrimaryButton`
  (`CONTROL_HEIGHT`, `radius.pill`, full-width), `bg.surface` fill, `border.subtle` 1px,
  `text.primary` bold label, **no shadow**. Same prop shape as `PrimaryButton`. Per brief
  §3.2/§3.3, no disabled-opacity rule is specified for the secondary button, so none was
  invented — `disabled`/`busy` still block the press handler and set
  `accessibilityState.disabled` (the interaction contract), but the visual style is unchanged.
- `src/features/ui/SecondaryButton.test.tsx` (new) — mirrors `PrimaryButton.test.tsx`'s cases
  minus the shadow/opacity-disabled specifics; explicitly asserts `shadowOpacity`/`boxShadow`
  are both `undefined` (no shadow, confirming the brief's flat-secondary-button spec) alongside
  the fill/border/radius/height/width assertions.
- `src/features/ui/OrDivider.tsx` (new) — a full-width hairline `border.subtle` rule (two
  `flex-1` `View`s) broken by a centered lowercase "o" `Text` (`text.secondary` color, `bg.page`
  background). No `accessibilityRole` — purely decorative.
- `src/features/ui/OrDivider.test.tsx` (new) — renders the "o"; confirms it carries no
  `accessibilityRole` and is not reachable via `getByRole("button"|"link")`.
- `src/features/ui/StatusPill.tsx` (new) — `accent.pillBg` fill, `text.link` label color
  (`typography.body.link`), `radius.pill`, small horizontal/vertical padding, `alignSelf:
  "flex-start"` (sized to content, not full-width). Props: `label`. Carries a `testID` for the
  test to assert the pill container's style directly (see Deviations).
- `src/features/ui/StatusPill.test.tsx` (new) — renders the label; confirms `accent.pillBg`
  fill / `text.link` label color / `radius.pill` / no explicit `width` / `alignSelf:
  "flex-start"`; confirms it does **not** carry `accessibilityRole="button"`.
- `src/features/ui/README.md` (new) — short note mirroring `src/features/navigation/README.md`'s
  convention, documenting the Constitution Principle V exception (`src/features/ui/` has no
  backend bounded context to mirror — cross-cutting design-system infrastructure consumed by
  both `identity` and `scanner`), citing `plan.md`'s Constitution Check table and
  `004-home-scan-shell`'s `src/features/navigation/` as the precedent.

Every primitive imports exclusively from `@/theme` (`colors`, `typography`, `radius`,
`CONTROL_HEIGHT`, `shadowRaised`) — zero raw hex/magic-number literal in any component body
(FR-001), confirmed by reading each file back after writing it.

**Correction (see Run 4 below):** this claim was inaccurate as shipped. `OrDivider.tsx` and
`StatusPill.tsx` each had one un-tokenized numeric literal (`marginHorizontal: 12` and
`paddingHorizontal: 12`/`paddingVertical: 6`) that duplicated/approximated `space` token values
without importing `space`. `code-reviewer` caught this (CHANGES_REQUESTED); fixed in Run 4.

### Tests run

1. **New primitive suite**:
   ```
   PASS src/features/ui/StatusPill.test.tsx
   PASS src/features/ui/BrandMark.test.tsx
   PASS src/features/ui/PrimaryButton.test.tsx
   PASS src/features/ui/SecondaryButton.test.tsx
   PASS src/features/ui/OrDivider.test.tsx

   Test Suites: 5 passed, 5 total
   Tests:       18 passed, 18 total
   ```

2. **Type-check**: `npx tsc --noEmit` — clean, no errors.

3. **Full existing test suite** (regression check — no other feature's files touched this run):
   ```
   Test Suites: 50 passed, 50 total
   Tests:       329 passed, 329 total
   ```

4. **`./init.sh` (full, no skip flags)**:
   ```
   ▶ 1/8 Checking prerequisites          ✅ OK
   ▶ 2/8 Environment file                ✅ OK
   ▶ 3/8 Installing dependencies         ✅ OK
   ▶ 4/8 Type-checking                   ✅ OK — no type errors
   ▶ 5/8 Expo config/dependency health   ⚠️  WARN — same pre-existing "outdated dependencies"
                                             advisory T001/T002-T009's reports already documented
   ▶ 6/8 Native dependency alignment     ⚠️  WARN — same pre-existing drift (expo-image-picker,
                                             react-native, react-native-safe-area-context,
                                             @types/react, typescript) — none of this run's files
                                             are native-module packages, so nothing new
   ▶ 7/8 Running test suite              ✅ OK — all tests passed
   ▶ 8/8 Bundle export smoke checks      ✅ OK — web/iOS/Android all exported cleanly

   RESULT: SUCCESS (10/10 stages passed)
   ```
   The two Stage 5/6 warnings are identical, pre-existing, and unrelated to this run's files.

No manual `npm run web` smoke check this run — these five files are pure presentational
primitives with no route/screen to render standalone yet (they aren't wired into `/login` or
`/scan` until Phase 3/4); their rendered behavior is fully covered by Level 2 component tests
above. The first screen-level manual smoke check is `docs/verification.md`/`tasks.md`'s T037
(login) and T049 (scan), once those batches land.

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-001 (semantic token names, no raw hex/magic literal at a consumer) | All five `src/features/ui/*.test.tsx` suites assert rendered style values equal the real `@/theme` exports (`colors.brand.primary`, `radius.pill`, `CONTROL_HEIGHT`, etc.), not duplicated literals — demonstrating every primitive consumes tokens, not hex. |
| FR-003 (six shared primitives matching brief §3) | `BrandMark.test.tsx`, `PrimaryButton.test.tsx`, `SecondaryButton.test.tsx`, `OrDivider.test.tsx`, `StatusPill.test.tsx` — one suite per primitive, each asserting the documented visual role from brief §3 items 1/2/3/5/6. |
| FR-013 (real accessibility label + >=44x44 tap target; inert elements not falsely presented as actionable) | `PrimaryButton.test.tsx`/`SecondaryButton.test.tsx` assert `CONTROL_HEIGHT` (56) >= 44 and real `accessibilityLabel`/`accessibilityState.disabled`; `OrDivider.test.tsx` and `StatusPill.test.tsx` assert no `accessibilityRole="button"`/`"link"` on non-interactive elements. |
| spec.md US1 AS2 (PrimaryButton disabled → 60% opacity + `accessibilityState.disabled`) | `PrimaryButton.test.tsx`'s "blocks press, applies 60% opacity, and exposes accessibilityState.disabled when disabled" test. |
| spec.md US3 AS4 (StatusPill is a status indicator, not a control) | `StatusPill.test.tsx`'s "does not carry accessibilityRole='button' by default" test. |

### Task IDs now `[X]`

- T011, T012, T013, T014, T015, T016

### Deviations / notes for sign-off

- **`BrandMark` needed an explicit `accessible` prop, not just `accessibilityRole`/
  `accessibilityLabel`, for `@testing-library/react-native`'s `getByRole` to find it.** Reading
  the installed `@testing-library/react-native` (v13) source
  (`build/helpers/accessibility.js`'s `isAccessibilityElement`): a plain `View` is only
  considered an "accessibility element" for role-query purposes if `props.accessible` is
  explicitly set (or it's a host `Text`/`TextInput`/`Switch`) — setting `accessibilityRole`/
  `accessibilityLabel` alone is not sufficient for this library version's query matching, even
  though real iOS/Android accessibility trees would expose the node either way. Added
  `accessible` to `BrandMark`'s outer `View` to make the primitive discoverable by
  `getByRole("image", { name: "Draw a Card" })` as the task brief's test description calls for.
  Flagged here since it's a library-version-specific detail future primitives with a similar
  "non-Text host element wants a role" shape should watch for.
- **`StatusPill` carries a `testID="status-pill"`**, not specified in the task brief's prop
  list (`label: string` only). Added purely so the test can assert the pill container's
  `backgroundColor`/`borderRadius`/`alignSelf` directly — `label.parent` (the natural way to
  reach the wrapping `View` from the `Text` node) resolved to `undefined` under this RNTL
  version's tree structure. `testID` is optional/inert for any consumer that doesn't pass one,
  so this doesn't change `StatusPill`'s documented prop contract for real usage.
- No other deviations from the task brief. `Field`/`FormField.tsx` restyle (brief's sixth
  primitive) correctly left out of scope per the batch instructions — it's User Story 2's T023/
  T024, a later batch.

Next: T017+ (i18n layer, User Story 4) and Phase 3 (login restyle, User Story 2) — not started,
out of scope for this run.

## Run 4 (2026-08-05) — CHANGES_REQUESTED fix on T011–T016 (code-reviewer)

### Scope

`code-reviewer`'s review of the Run 3 batch (see `progress/review_006-visual-identity.md`'s
T011–T016 entry) returned CHANGES_REQUESTED on two files, both violating FR-001 ("no raw hex
value or magic numeric literal duplicating a token's value may appear directly in a screen or
primitive component body"):

1. `src/features/ui/OrDivider.tsx:32` — `marginHorizontal: 12` duplicated `space.md` (12)
   without importing/using the token.
2. `src/features/ui/StatusPill.tsx:27` — `paddingHorizontal: 12` had the same problem, and
   `StatusPill.tsx:28`'s `paddingVertical: 6` was an unsourced magic number with no matching
   token at all.

### Files changed

- `src/features/ui/OrDivider.tsx` — imports `space` from `@/theme` alongside `colors`;
  `label.marginHorizontal` now reads `space.md` instead of the literal `12`. No visual change
  (12 === 12).
- `src/features/ui/StatusPill.tsx` — imports `space` from `@/theme` alongside `colors`,
  `radius`, `typography`; `pill.paddingHorizontal` now reads `space.md` (no visual change,
  12 === 12). `pill.paddingVertical` now reads `space.sm` (8) instead of the un-sourced literal
  `6`. Checked `docs/design-brief-visual-identity.md` §3 item 6 first: the brief only specifies
  "small horizontal padding" for `StatusPill` and gives no vertical-padding value at all, so
  there was no brief-mandated number to preserve — `space.sm` is the nearest token to the
  original ad-hoc `6`, a 2px visual difference judged negligible for a small pill. Added an
  inline comment on the token choice explaining the brief only specifies horizontal padding, so
  a future reader doesn't mistake `space.sm` for a brief-literal value.
- `progress/impl_006-visual-identity.md` — this section, plus the correction note inserted into
  Run 3's "Files changed" section (not rewriting Run 3's original claim, just flagging it wrong
  and pointing here).

### Tests run

1. Targeted re-run:
   ```
   PASS src/features/ui/OrDivider.test.tsx
   PASS src/features/ui/StatusPill.test.tsx

   Test Suites: 2 passed, 2 total
   Tests:       5 passed, 5 total
   ```
   No test needed updating — neither suite asserts exact padding/margin pixel values (both only
   assert color/radius/role/sizing-to-content), so the `12`→`space.md` (no-op) and `6`→`space.sm`
   (8, was 6) changes caused no test regression.

2. `./init.sh --skip-build`:
   ```
   ▶ 1/8 Checking prerequisites          ✅ OK
   ▶ 2/8 Environment file                ✅ OK
   ▶ 3/8 Installing dependencies         ✅ OK
   ▶ 4/8 Type-checking                   ✅ OK — no type errors
   ▶ 5/8 Expo config/dependency health   ⚠️  WARN — same pre-existing "outdated dependencies" advisory
   ▶ 6/8 Native dependency alignment     ⚠️  WARN — same pre-existing version-drift, unrelated to this change
   ▶ 7/8 Running test suite              ✅ OK — all tests passed
   ▶ 8/8 Bundle export smoke checks      ⚠️  WARN — skipped (--skip-build)

   RESULT: SUCCESS (8/8 stages passed)
   ```
   Full suite green, type-check clean. Both Stage 5/6 warnings are the same pre-existing,
   unrelated drift documented in Runs 1–3. `--skip-build` used since this batch changes no
   bundling/build config — per the task-implementer brief's own guidance on when the fast path
   is acceptable.

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-001 (no raw hex/magic-number literal duplicating a token in a primitive body) | `OrDivider.test.tsx`/`StatusPill.test.tsx` (unchanged assertions, still passing) verify rendered behavior is unaffected by routing the values through `space.md`/`space.sm` instead of raw literals; the source-level fix itself (grep-verifiable: no bare `12`/`6` remains in either file's `StyleSheet.create` block) is what actually satisfies FR-001 — this class of violation isn't independently unit-tested beyond the reviewer's manual/grep check, consistent with how Run 3's other primitives were verified. |

### Task IDs now `[X]`

No change — T011–T016 were already marked `[X]` in Run 3; this run only fixes a reviewer
finding within already-completed tasks, no task status changes.

### Deviations / notes for sign-off

- `StatusPill`'s `paddingVertical` moved from `6` to `space.sm` (8) — a 2px increase. The brief
  never specified a vertical-padding number (only "small horizontal padding"), so this isn't a
  literal-value deviation from the brief, just a judgment call on which existing token best
  approximates the original ad-hoc value. Flagging for sign-off in case the human wants to
  eyeball the pill at 8px vertical padding vs. the original 6px before considering this fully
  closed — no test can catch a "does this look right" call.
- No other file touched this run, per the review's explicit scope.

Next: unchanged from Run 3 — T017+ (i18n layer) and Phase 3 (login restyle) not started.

## Run 5 (2026-08-05) — T017–T022: i18n layer (User Story 4)

### Scope

Implemented the entire "i18n layer (User Story 4)" subsection of `tasks.md`: the portable
locale/translate primitives (`src/domain/i18n/`), the login and scan copy dictionaries
(`src/domain/i18n/copy/`), the thin React context wrapper (`src/features/i18n/`), and its
README documenting the seam `007-localization` builds on.

### Files changed

- `src/domain/i18n/locale.ts` (new) — `export type Locale = "es" | "en"; export const
  DEFAULT_LOCALE: Locale = "es";` exactly as specified. Zero React Native import.
- `src/domain/i18n/translate.ts` (new) — `translate<T extends Record<string, string>>(dictionary:
  { es: T; en: T }, locale: Locale, key: keyof T): string`. Zero React Native import.
- `src/domain/i18n/translate.test.ts` (new) — asserts resolution against a local test dictionary
  for both `"es"` and `"en"`; documents (in a comment, not a runtime assertion) that an invalid
  key is a **compile-time** TypeScript error via `translate()`'s `key: keyof T` parameter type,
  not something a runtime test can observe.
- `src/domain/i18n/copy/login.ts` (new) — `{ es: {...}, en: {...} }` covering: brief §4's brand
  block (`brandTitle`, `tagline`), field copy (`emailLabel`/`emailPlaceholder`/`passwordLabel`),
  `forgotPassword`, `signInButton`, `createAccount`, and the legal line's four separately-keyed
  segments (`legalPrefix`, `termsLink`, `legalMiddle`, `privacyLink`) — **plus** every existing
  literal string I found by reading `SignInForm.tsx`, `RequestPasswordResetForm.tsx`, and
  `ResetPasswordForm.tsx` directly: `signInTitle` ("Sign in"), `signingIn` ("Signing in…"),
  `requestResetTitle`/`requestResetSubtitle`/`requestResetConfirmation`/`sendResetCode`/
  `sendingResetCode`/`backToSignIn` (`RequestPasswordResetForm.tsx`, including its exported
  `REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE` constant's text), and `resetCodeTitle`/
  `resetCodeSentMessage`/`resetCodeSubtitle`/`resetCodeLabel`/`newPasswordLabel`/`setNewPassword`/
  `settingPassword`/`resendCode`/`resendCodeWithSeconds` (`ResetPasswordForm.tsx`, including its
  exported `RESET_CODE_SENT_MESSAGE` constant's text). `en`'s type is `Record<keyof typeof es,
  string>`. Spanish orthography verified correct (`Contraseña`, `Olvidé mi contraseña`,
  `Términos de Uso`, `Política de Privacidad`) per brief §4's explicit note.
- `src/domain/i18n/copy/login.test.ts` (new) — asserts `Object.keys(es).sort()` equals
  `Object.keys(en).sort()`; asserts no empty-string values in either dictionary; asserts the
  brief's explicitly-called-out Spanish strings render with correct accents.
- `src/domain/i18n/copy/scan.ts` (new) — `{ es: {...}, en: {...} }` covering every brief §5
  string: `titleMobile`/`titleWeb` ("Escanear"/"Escanear carta"), `viewfinderHint`,
  `searchPlaceholder`, `uploadDropzone`, `scanButton`, `statusPillCameraAvailable`,
  `emptyResultsLine1`/`emptyResultsLine2`, `recentScansHeading` ("ESCANEOS RECIENTES", natural
  case since `label.section`'s `textTransform: "uppercase"` handles the visual caps), plus the
  existing "Back"/"Back to Home" affordance's copy from `app/scan.tsx`
  (`backLabel`/`backAccessibilityLabel`). The recent-scans row content itself (thumbnail/name/
  meta/price) is deliberately NOT represented here — it's static placeholder DATA per spec.md
  FR-008, not copy, and a code comment says so explicitly.
- `src/domain/i18n/copy/scan.test.ts` (new) — same key-parity/no-empty-value pattern as
  `login.test.ts`, plus assertions on the brief's exact shared-copy strings and the
  mobile-vs-web title distinction.
- `src/features/i18n/LocaleContext.tsx` (new) — `LocaleContext` (`{ locale: Locale, setLocale:
  (l: Locale) => void }`, default `DEFAULT_LOCALE`), `LocaleProvider`, `useLocale()` (falls back
  to a default-locale/no-op-setter value when rendered outside a provider, e.g. for isolated
  component tests — documented inline as a deliberate graceful-default choice, not a
  security-sensitive invariant), and `useTranslation(dictionary)` wrapping `translate()` bound to
  the context's current locale via `useCallback`.
- `src/features/i18n/LocaleContext.test.tsx` (new) — renders a consumer under the default
  provider and confirms `"es"` resolves; renders a test-only `LocaleSwitchTrigger` alongside it,
  presses it to call `setLocale("en")`, and confirms the same consumer re-renders with `"en"`
  strings; confirms `useLocale()`'s outside-provider fallback.
- `src/features/i18n/README.md` (new) — documents the Constitution V exception (no backend
  bounded context to mirror, mirroring `src/features/ui/README.md`'s established pattern), the
  exact `useLocale().setLocale` seam `007-localization` builds its picker on (with a short code
  example), the `DEFAULT_LOCALE = "es"` placeholder framing (quoting spec.md's Assumptions
  section verbatim, per the task brief's instruction), and a step-by-step "how to add a new
  screen's dictionary" guide pointing at `copy/login.ts`/`copy/scan.ts` as the worked examples.
- `specs/006-visual-identity/tasks.md` — T017–T022 marked `[X]`.
- `progress/impl_006-visual-identity.md` — this section (appended, not overwritten).

### Tests run

1. New i18n suite:
   ```
   PASS src/domain/i18n/translate.test.ts
   PASS src/domain/i18n/copy/scan.test.ts
   PASS src/domain/i18n/copy/login.test.ts
   PASS src/features/i18n/LocaleContext.test.tsx

   Test Suites: 4 passed, 4 total
   Tests:       12 passed, 12 total
   ```

2. **Type-check**: `npx tsc --noEmit` — clean, no errors (after fixing two test files' use of
   Jest's `expect(value, message)` two-argument form, which `@types/jest` doesn't accept — Jest,
   unlike Chai, has no built-in per-assertion custom-message parameter; rewrote both loops to
   iterate `Object.values(dict)` directly instead of `Object.entries` + a message string).

3. **Full existing test suite** (regression check — no file outside `src/domain/i18n/` and
   `src/features/i18n/` touched this run):
   ```
   Test Suites: 54 passed, 54 total
   Tests:       341 passed, 341 total
   ```

4. **`./init.sh` (full, no skip flags)**:
   ```
   ▶ 1/8 Checking prerequisites          ✅ OK
   ▶ 2/8 Environment file                ✅ OK
   ▶ 3/8 Installing dependencies         ✅ OK
   ▶ 4/8 Type-checking                   ✅ OK — no type errors
   ▶ 5/8 Expo config/dependency health   ⚠️  WARN — same pre-existing "outdated dependencies"
                                             advisory prior runs already documented
   ▶ 6/8 Native dependency alignment     ⚠️  WARN — same pre-existing drift (expo-image-picker,
                                             react-native, react-native-safe-area-context,
                                             @types/react, typescript) — none of this run's files
                                             are native-module packages, so nothing new
   ▶ 7/8 Running test suite              ✅ OK — all tests passed
   ▶ 8/8 Bundle export smoke checks      ✅ OK — web/iOS/Android all exported cleanly

   RESULT: SUCCESS (10/10 stages passed)
   ```
   Both Stage 5/6 warnings are identical, pre-existing, and unrelated to this run's files
   (same five package names as every prior run's report).

No manual `npm run web` smoke check this run — none of this batch's files render into any
existing route yet (`loginCopy`/`scanCopy`/`LocaleContext` are not wired into `LoginScreen`/
`ScanShellScreen` until Phase 3/4's later tasks, T028+/T038+). Their behavior is fully covered by
the Level 1/2 tests above; the first screen-level manual smoke check exercising locale-switching
end to end is `tasks.md`'s T037 (login) and T049 (scan), once those batches land.

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-010 (i18n lookup mechanism: plain TS, zero-RN-import, keyed by key+locale, complete es/en dictionaries for login+scan, no hardcoded copy in a login/scan component) | `translate.test.ts` ("translate (FR-010)" describe block — 2 tests, plus the documented compile-time-only invalid-key note); `copy/login.test.ts` ("loginCopy (FR-010, spec.md US4 AS2)" — 3 tests); `copy/scan.test.ts` ("scanCopy (FR-010, spec.md US4 AS2)" — 3 tests). No login/scan component consumes these dictionaries yet in this batch — that hardcoded-copy-removal half of FR-010 lands with T028+/T038+. |
| FR-011 (locale context/provider + lookup hook usable by a future component, no restructuring needed) | `LocaleContext.test.tsx`'s "resolves 'en' strings after setLocale('en') is called via the context seam (FR-011)" test — exercises the exact `setLocale` seam a future picker calls. |
| FR-012 (active locale defaults to a single documented fixed value, Spanish) | `LocaleContext.test.tsx`'s "resolves 'es' strings by default (FR-012's documented fixed default)" test; `locale.ts`'s `DEFAULT_LOCALE: Locale = "es"` is the source of truth it reads. |
| spec.md US4 AS1 (every visible string looked up by key, grep-checkable — no literal sentence typed into a `<Text>`) | Not yet grep-checkable against a real screen in this batch (no component consumes these dictionaries yet); the dictionaries themselves are structured so every value is reachable only via `translate()`/`useTranslation()`, never a bare export a component could copy-paste as a literal. Full AS1 satisfaction (zero hardcoded copy in the actual screen files) is asserted once T028+/T038+ land. |
| spec.md US4 AS2 (es/en dictionaries contain the exact same key set — unit test, not visual inspection) | `copy/login.test.ts`/`copy/scan.test.ts`'s "has the exact same set of keys in both the es and en dictionaries" tests. |
| spec.md US4 AS3 (no locale explicitly chosen → resolves to documented fixed default) | Same `LocaleContext.test.tsx` default-locale test as FR-012 above. |
| spec.md US4 AS4 (string-resolution logic lives in a plain TS module with no RN import, unit-tested directly) | `translate.ts` has zero RN import (confirmed by inspection — its only import is `type Locale` from `./locale`, itself RN-import-free); `translate.test.ts` tests it directly, not through any component render. |
| spec.md US4 AS5 (leaves in place a locale context/provider + translation-lookup hook a future picker can read/write without restructuring login/scan's consumption) | `LocaleContext.tsx`'s `useLocale`/`useTranslation` exports plus `README.md`'s documented seam section; `LocaleContext.test.tsx` exercises both hooks end to end. |

### Task IDs now `[X]`

- T017, T018, T019, T020, T021, T022

### Deviations / notes for sign-off

- **Jest's `expect(value, message)` two-argument form doesn't exist** — I initially wrote
  `login.test.ts`/`scan.test.ts`'s empty-value check using a Chai-style second "custom message"
  argument to `expect()`, which `@types/jest` rejects at compile time (`Expected 1 arguments, but
  got 2`). Fixed by iterating `Object.values(dict)` directly instead of `Object.entries` (dropping
  the per-assertion message, which Jest doesn't support at the `expect()` call site the way some
  other assertion libraries do) — caught by `npx tsc --noEmit` before this ever reached a test
  run, not a runtime surprise.
- **`login.ts` includes several keys beyond the task brief's own literal list** (`signingIn`,
  `requestResetTitle` through `backToSignIn`, `resetCodeTitle` through `resendCodeWithSeconds`) —
  this is intentional and required by the task brief's own instruction to "enumerate every literal
  user-facing string ... not only the brief's explicit list," reading `SignInForm.tsx`/
  `RequestPasswordResetForm.tsx`/`ResetPasswordForm.tsx` directly rather than relying on `tasks.md`
  T019's own (non-exhaustive) parenthetical examples.
- **`resendCodeWithSeconds` stores a literal `{{seconds}}` placeholder token**, not a real
  interpolation feature — `translate()` (T018) deliberately has no interpolation support per
  `plan.md`'s i18n Research Decision ("no interpolation ... needed today"), so this one
  pre-existing dynamic string (`ResetPasswordForm.tsx`'s `` `Resend code (${secondsRemaining}s)` ``)
  is represented as a plain-string template; whichever future task (T032, out of this batch's
  scope) wires this dictionary into `ResetPasswordForm.tsx` is expected to do a simple
  `.replace("{{seconds}}", String(secondsRemaining))` at the call site. Documented inline in
  `login.ts`'s top comment so this doesn't read as an oversight later.
- **Did not add `LoginScreen.tsx`'s "Signing you in…" transition text or its
  `PASSWORD_RESET_SUCCESS_MESSAGE` constant to `login.ts`'s dictionary** — the task brief's
  instruction explicitly scoped the "enumerate every literal string" requirement to three named
  files (`SignInForm.tsx`, `RequestPasswordResetForm.tsx`, `ResetPasswordForm.tsx`), not
  `LoginScreen.tsx`. `plan.md`'s T034 description does say the "Signing you in…" view's text
  "also routes through `useTranslation(loginCopy)`" once that later task lands — flagging here
  that whoever implements T034 will need to add `signingInTransition`/
  `passwordResetSuccessMessage`-shaped keys to `login.ts` at that time (a small, additive,
  non-breaking edit to this file, not a redesign) rather than assuming they're already present.
- No other deviations from the task brief.

Next: Phase 3 (User Story 2, login restyle — T023+) — not started, out of scope for this run.
Phase 2 (T001–T022, the entire Foundational phase: token module, six primitives, i18n layer) is
now fully complete.

---

## Run 6 (2026-08-05) — T010: Wire font loading + LocaleProvider at the root layout

### Scope

Last remaining Phase 2 task: `app/_layout.tsx` gains `useFonts({ PlayfairDisplay_700Bold })`
(from `@expo-google-fonts/playfair-display`) gated behind the same minimal
`<View style={{ flex: 1 }} />` placeholder `KycGate` already renders during its own `isLoading`,
and wraps the existing `QueryClientProvider`/`KycGate` tree in
`src/features/i18n/LocaleContext.tsx`'s `LocaleProvider`. Depends on T001 (deps installed), T004
(`PLAYFAIR_DISPLAY_BOLD` constant), T021 (`LocaleProvider`) — all three already landed in prior
runs.

### Files changed

- `app/_layout.tsx` (MODIFIED) — added:
  - `import { PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";`
  - `import { useFonts } from "expo-font";`
  - `import { LocaleProvider } from "@/features/i18n/LocaleContext";`
  - `import { PLAYFAIR_DISPLAY_BOLD } from "@/theme/fonts";`
  - Inside `RootLayout`: `const [fontsLoaded] = useFonts({ [PLAYFAIR_DISPLAY_BOLD]:
    PlayfairDisplay_700Bold });` — the object key is the `PLAYFAIR_DISPLAY_BOLD` constant
    (computed property), not a second hardcoded `"PlayfairDisplay_700Bold"` string literal, so
    this call and `typography.ts`'s `fontFamily` reference (T005) can never drift apart — both
    now trace back to the single `src/theme/fonts.ts` source of truth.
  - `if (!fontsLoaded) return <View testID="fonts-loading" style={{ flex: 1 }} />;` — deliberately
    the exact same minimal shape as `KycGate`'s own `isLoading` placeholder a few lines below (a
    literal `<View style={{ flex: 1 }} />`), not a second, differently-styled loading view. Added
    a `testID` (KycGate's own placeholder already has one, `"kyc-gate-loading"`) purely for test
    instrumentation — this doesn't change what's visually rendered.
  - The return value now reads `<LocaleProvider><QueryClientProvider client={queryClient}>
    <KycGate /></QueryClientProvider></LocaleProvider>` — `LocaleProvider` wraps the *existing*
    `QueryClientProvider`/`KycGate` tree exactly as the task instruction specified ("wrap the
    existing `QueryClientProvider`/`KycGate` tree in `LocaleContext.tsx`'s provider"), not the
    reverse.
  - `KycGate` itself (the unexported function below `RootLayout`) is completely untouched — same
    `useKycGate()` call, same `resolveKycRoute()`-driven `<Redirect>`/`<Stack>` branch, same
    `isLoading` placeholder. Zero change to `src/domain/kyc-gate.ts` or `useKycGate.ts`.
- `src/features/i18n/RootLayout.test.tsx` (NEW) — the first test for `app/_layout.tsx`. Per
  `docs/conventions.md`'s documented `_layout.*` test-placement exception (colocating as
  `app/_layout.test.tsx` would crash `expo start --web`'s route-manifest scan — see
  `src/features/navigation/AppWebLayout.test.tsx`'s precedent for the full mechanism), this lives
  at `src/features/i18n/RootLayout.test.tsx`, importing the default export by relative path
  (`../../../app/_layout`). Three tests, all passing:
  1. `renders the flex:1 placeholder while fonts are loading, not the app tree` — mocks
     `expo-font`'s `useFonts` to return `[false, null]`, confirms `getByTestId("fonts-loading")`
     is present, `queryByTestId("stack-placeholder")` (the mocked `<Stack>` stand-in) is absent,
     and `useKycGate` (mocked) is never even called — proving the font gate sits above the whole
     `QueryClientProvider`/`KycGate` tree, not nested inside it.
  2. `renders the existing tree wrapped in the locale provider once fonts are loaded` — mocks
     `useFonts` to return `[true, null]`; the mocked `expo-router` module's `<Stack>` stand-in
     calls the REAL (unmocked) `useLocale()` from `src/features/i18n/LocaleContext.tsx` and
     renders the resolved `locale` value into a `<Text testID="stack-placeholder">` — asserting
     that text equals `"es"` (the real `DEFAULT_LOCALE`) proves `RootLayout`'s tree is genuinely
     wrapped in `<LocaleProvider>`, not merely that something renders after the font gate passes.
  3. `does not alter KycGate's own isLoading placeholder once fonts are loaded` — fonts loaded,
     `useKycGate` mocked to return `isLoading: true`; confirms `KycGate`'s own (real, unmocked,
     defined in the same file) `<View testID="kyc-gate-loading" style={{ flex: 1 }} />` still
     renders exactly as before this task — the regression guard that T010 is additive scaffolding
     only, never a change to `useKycGate()`/`resolveKycRoute()`'s own behavior.
  - Mocking approach: `@expo-google-fonts/playfair-display` and `expo-font` are both mocked
    directly (avoids depending on real `.ttf` asset resolution under Jest, which isn't the concern
    this test needs to prove); `@/features/identity/useKycGate` is mocked to isolate this test from
    Supabase/React Query wiring (that hook already has its own coverage elsewhere — this test's
    job is the wrap/gate around it, not its internals); `expo-router` is mocked with a `<Stack>`
    stand-in that deliberately calls the real `useLocale()` — the one place in this file where a
    real (non-mocked) piece of this feature's own code runs, since that's the actual behavior
    under test.
- `specs/006-visual-identity/tasks.md` (MODIFIED) — marked T010 `[X]`.

### Tests run

```
$ npx jest src/features/i18n/RootLayout.test.tsx
PASS src/features/i18n/RootLayout.test.tsx
  app/_layout.tsx
    ✓ renders the flex:1 placeholder while fonts are loading, not the app tree (14 ms)
    ✓ renders the existing tree wrapped in the locale provider once fonts are loaded (2 ms)
    ✓ does not alter KycGate's own isLoading placeholder once fonts are loaded

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

Full `./init.sh` (not `--skip-build` — this run touches the app root):

```
▶ 1/8 Prerequisites                  ✅ OK — node v20.20.2, npm v10.8.2
▶ 2/8 Env file                       ✅ OK — .env already exists, left untouched
▶ 3/8 Installing dependencies        ✅ OK
▶ 4/8 Type-checking                  ✅ OK — no type errors
▶ 5/8 Expo config/dependency health  ⚠️  WARN — same pre-existing "outdated dependencies"
                                          advisory recorded in every prior run's report (Run 1
                                          onward), unrelated to this change
▶ 6/8 Native dependency alignment    ⚠️  WARN — same pre-existing version drift
                                          (expo-image-picker, react-native,
                                          react-native-safe-area-context, @types/react,
                                          typescript), unrelated to this change
▶ 7/8 Running test suite             ✅ OK — all tests passed (full suite, includes the new
                                          RootLayout.test.tsx)
▶ 8/8 Bundle export smoke checks     ✅ OK — web/iOS/Android all exported cleanly

RESULT: SUCCESS (10/10 stages passed)
```

No manual `npm run web` smoke check performed this run — `app/_layout.tsx` renders nothing
visually distinguishable yet (no screen consumes `useTranslation()`/`useLocale()` until Phase
3/4's later tasks, T028+/T034/T038+), and the font/locale wiring itself is fully exercised by the
three tests above plus the green bundle-export stage (confirms the new imports resolve and bundle
on all three targets). The first screen-level manual smoke check that will visibly exercise the
Playfair Display font rendering is `tasks.md`'s T037 (login).

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-011 (locale context/provider usable by a future component, no restructuring of how login/scan consume it — including that it must actually be wired into the app root, not just exist unused) | `RootLayout.test.tsx`'s "renders the existing tree wrapped in the locale provider once fonts are loaded" test — proves `<LocaleProvider>` genuinely wraps the root tree by having the mocked `<Stack>` stand-in read the real `useLocale()` and resolve `"es"`. |
| spec.md Clarifications, Recorded default 1 (bundled Playfair Display font, loaded once at the root, gated behind a loading guard mirroring `KycGate`'s own pattern, so no screen can flash an unstyled fallback font) | `RootLayout.test.tsx`'s "renders the flex:1 placeholder while fonts are loading, not the app tree" test — confirms the app tree (and therefore any `display.xl`/`display.lg` text) never renders before `fontsLoaded` is `true`. |

### Task IDs now `[X]`

- T010

### Checkpoint confirmation

Per `tasks.md`'s note directly after T010: **"Token module complete and contrast-regression-tested;
font loading wired at root."** — this checkpoint is now met. Combined with Run 2's T002–T009
(token module) and Run 3/4's T011–T016 (six shared primitives) and Run 5's T017–T022 (i18n
layer), **Phase 2 (Setup + Foundational, T001–T022) is now fully complete** — every task in
Phases 1–2 is `[X]` in `tasks.md`. Phase 3 (User Story 2, login restyle, T023+) is the next work,
not started, out of scope for this run.

### Deviations / notes for sign-off

- **`useFonts({ [PLAYFAIR_DISPLAY_BOLD]: PlayfairDisplay_700Bold })` uses a computed property key
  referencing the `PLAYFAIR_DISPLAY_BOLD` constant (T004), not the literal object-shorthand
  `useFonts({ PlayfairDisplay_700Bold })` the task description shows verbatim.** Both produce the
  exact same runtime key (`"PlayfairDisplay_700Bold"`, since `PLAYFAIR_DISPLAY_BOLD`'s value IS
  that exact string, verified against the installed package in T004) — this is a non-behavioral,
  DRY-motivated choice: it means the `useFonts()` call and `typography.ts`'s `fontFamily`
  reference (T005) both trace back to `src/theme/fonts.ts`'s single constant rather than each
  independently hardcoding the same literal string, closing off any future drift between them.
  Flagging explicitly since it's a literal deviation from the task text's exact syntax, even
  though not from its intent or behavior.
- No other deviations from the task brief.

Next: Phase 3 (User Story 2, login restyle — T023+).

## Run 7 (2026-08-05) — T023, T024, T024a: Restyle `FormField` to the `Field` spec (User Story 2, login restyle)

### Scope

Phase 3's first batch — restyled the existing `src/features/identity/FormField.tsx` (mobile/
default) and added `src/features/identity/FormField.web.tsx` per `docs/design-brief-visual-
identity.md` §3 item 4, and extended `FormField.test.tsx`. This is the highest-blast-radius task
in the feature: `FormField` is also consumed, unmodified in prop shape, by `RegistrationForm`,
`VerifyPhoneScreen`, and `ProfileForm` (`001-registration-kyc`, outside this feature's scope) —
those three screens visually inherit the new pill/label look as an explicitly accepted side
effect (plan.md's Research Decisions, human-approved at the approval gate), with zero behavioral
change expected.

### Files changed

- **`src/features/identity/FormField.tsx`** (modified): `FormFieldProps` (`label`, `error`,
  `children`, `testID`) is byte-for-byte unchanged — only the rendered JSX/styles changed. The
  input container (a new inner `View` wrapping `children`) now gets `colors.bg.surface`,
  `radius.pill`, `CONTROL_HEIGHT`, `space.xl` (20) horizontal padding, and `shadowSurface`
  (native shadow properties) — no `borderWidth`. The label now renders with
  `typography.label.field` (uppercase, 12px/500, `letterSpacing`, `colors.text.secondary`)
  instead of the old hardcoded `{ fontSize: 14, fontWeight: "500", color: "#374151" }`. Added a
  derived (not a new prop) `testID={testID ? \`${testID}-input\` : undefined}` on the inner
  container so tests can target it directly without adding a new prop to `FormFieldProps`. The
  error `<Text accessibilityRole="alert">` is untouched in behavior; its literal `#dc2626` color
  is intentionally left as-is — no error/danger token exists in `src/theme/colors.ts` (Recorded
  default 2's adjusted set), and `docs/design-brief-visual-identity.md` §3 item 4 doesn't specify
  error-text color either, so inventing one wasn't in this task's scope. Documented that reasoning
  in a code comment.
- **`src/features/identity/FormField.web.tsx`** (new): identical `FormFieldProps` shape and
  structure to `FormField.tsx`, but the input container has `borderWidth: 1` /
  `borderColor: colors.border.input` and **no** shadow — the platform split is expressed purely
  via the `.web.tsx` file-extension convention (Metro resolves this file on web, `FormField.tsx`
  everywhere else), not an inline `Platform.OS` branch, per `docs/conventions.md` and Constitution
  IV/FR-005.
- **`src/features/identity/FormField.test.tsx`** (new — no prior test file existed for
  `FormField`, despite T024a's task text reading "Extend"; I created it fresh, covering
  everything T024a asks for): confirms the label renders with `typography.label.field`'s uppercase
  treatment on both variants; confirms the mobile/default input container is borderless
  (`borderWidth` `undefined`) with a shadow.surface-shaped style (`shadowColor: "#10281A"`,
  `shadowOpacity > 0`); confirms the web variant's input container has `borderWidth: 1` /
  `colors.border.input` and no `shadowColor`/`boxShadow`; confirms the pre-existing
  `accessibilityRole="alert"` error-text behavior (from `001-registration-kyc`) still holds on
  both variants, and that no alert renders when `error` is omitted.
- **`specs/006-visual-identity/tasks.md`** (modified): marked T023, T024, T024a `[X]`.

### Tests written/run

`FormField.test.tsx` (7 new tests, all passing):

```
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

**Regression check (explicitly requested)** — ran the existing `RegistrationForm.test.tsx`,
`VerifyPhoneScreen.test.tsx`, and `ProfileForm.test.tsx` suites (the three screens that consume
the now-restyled `FormField` outside this feature's scope):

```
PASS src/features/identity/VerifyPhoneScreen.test.tsx
PASS src/features/identity/RegistrationForm.test.tsx
PASS src/features/identity/ProfileForm.test.tsx

Tests: 24 passed, 24 total
```

All pre-existing assertions in those three suites passed unmodified — none of them assert on
`FormField`'s literal colors/radii/borders (they assert roles/labels/text/behavior per
`docs/conventions.md`'s testing guidance), so the restyle didn't require touching any of their
test files.

**Full existing suite** (`npx jest --no-coverage`, all 56 suites, not just this feature's):

```
Test Suites: 56 passed, 56 total
Tests:       351 passed, 351 total
```

(The `act()` warnings printed during the run come from a pre-existing `useKycGate.test.ts`
timer/query-cache interaction unrelated to this batch — not a failure, and not introduced by this
change.)

**Type-check**: `npx tsc --noEmit` — clean, zero errors.

**`./init.sh` (full, no `--skip-*` flags)** — `RESULT: SUCCESS (10/10 stages passed)`:
type-check clean, tests all passed, and all three bundle exports (web/iOS/Android) exported
cleanly. The two `WARN` stages (expo-doctor outdated-dependency advisory, native-dependency
version drift on `expo-image-picker`/`react-native`/`react-native-safe-area-context`/
`@types/react`/`typescript`) are pre-existing, unrelated to this batch (no dependency was
added/changed here), and were already present before this run — non-blocking per
`docs/verification.md`.

**Manual smoke check (Level 3)** — not performed via an actual browser render this run: this
sandbox has no browser binary available (`chromium`/`google-chrome` not found), and installing
Playwright's bundled Chromium was not completed within this batch's scope. In lieu of that, I
relied on: (a) the component-level tests above, which assert the exact rendered style values
(border presence/absence, shadow presence/absence, `backgroundColor`, `borderRadius`, uppercase
label) the brief specifies for both platform variants; (b) `./init.sh`'s successful web/iOS/
Android bundle exports, confirming both `FormField.tsx` and `FormField.web.tsx` resolve and
bundle without error on every target; (c) the full regression suite for the three consumer
screens. **Flagging this explicitly** — a real `npm run web` visual check of `/register`,
`/verify-phone`, `/profile`, and `/login` (the four screens whose fields are now visually
affected) has not been done yet in this feature. This is lower-risk for T023/T024/T024a
specifically (component-level style assertions plus a green bundle export cover the same ground a
visual check would for a single isolated primitive), but the feature's own T037 (login) and later
tasks still carry a mandatory `npm run web` manual smoke check per `tasks.md` — that has not been
skipped, only deferred to when it's actually schedulable (once a browser is available, or at the
next run).

### Requirement traceability

| FR / AS | Test |
|---|---|
| FR-001 (semantic tokens only, no raw hex/magic literal duplicating a token) | `FormField.test.tsx`'s style assertions read `colors.bg.surface`/`radius.pill`/`typography.label.field.*` from the real `@/theme` exports, not duplicated literals |
| FR-003 (`Field` matches brief §3 item 4) | `FormField.test.tsx`: "renders the input container borderless with a shadow.surface style, bg.surface, and radius.pill" (mobile) / "renders the input container bordered (border.input) with no shadow" (web) |
| FR-005 (platform difference via `.web.tsx`, not inline `Platform.OS`) | `FormField.web.tsx` is a distinct file resolved by Metro's platform-extension convention; `FormField.tsx` contains no `Platform.OS` branch — confirmed by inspection, and indirectly by the two variants' test blocks asserting opposite border/shadow outcomes from the same props |
| spec.md US1 AS3 ("mobile borderless+shadow, web bordered+no-shadow, expressed via `.web.tsx`") | Same two tests above |
| Regression guard (plan.md's disclosed `FormField` side effect on `RegistrationForm`/`VerifyPhoneScreen`/`ProfileForm`) | Existing `RegistrationForm.test.tsx`, `VerifyPhoneScreen.test.tsx`, `ProfileForm.test.tsx` suites, re-run and confirmed green unmodified |

### Task IDs now `[X]`

- T023, T024, T024a

### Deviations / notes for sign-off

- **T024a's task text says "Extend `src/features/identity/FormField.test.tsx`"** — no such file
  existed before this run (`FormField.tsx` had never had a colocated test file, including back in
  `001-registration-kyc`). I created it fresh rather than extending a nonexistent file; its
  contents cover every assertion T024a's task text asks for.
- **Added a derived (non-prop) `testID` on the input container** (`${testID}-input`) purely to
  make the container's style directly queryable in tests without adding a new field to
  `FormFieldProps` (which the task explicitly forbids changing). This is additive, internal, and
  backward compatible — existing callers that don't pass `testID` simply get `undefined` on the
  inner container, identical to today's behavior of not tagging it at all.
- **Left the error-text color as the pre-existing literal `#dc2626`**, not a token — no error/
  danger color exists anywhere in this feature's token module (`src/theme/colors.ts`), and the
  design brief's §3 item 4 doesn't specify one either. Flagging this as a scope boundary I held,
  not an oversight: introducing a new, unspecified token value felt out of bounds for a task whose
  brief enumerated exactly which properties to change (label, container fill/radius/height/
  padding, border-vs-shadow).
- Manual browser-based smoke check deferred — see the "Manual smoke check" note above.

Next: T025 (`LoginScreenChrome.tsx`, mobile gradient wash) and T026 (`LoginScreenChrome.web.tsx`,
web radial-bloom + centered card), the next tasks in Phase 3's login restyle sequence.

---

## Run 8 (2026-08-05) — T025, T026, T027: `LoginScreenChrome` background chrome (User Story 2, login restyle)

Implemented the login screen's platform-split background chrome: `LoginScreenChrome.tsx`
(mobile — gradient wash, §4.1) and `LoginScreenChrome.web.tsx` (web — radial-bloom background +
centered card, §4.2), plus their passthrough/regression test file. Both are pure presentational
wrappers — `{ children: ReactNode }` in, unchanged `children` out — not yet wired into
`LoginScreen.tsx` itself (that's a later task, T034); this batch only builds the chrome.

### Files changed

- **`src/theme/colorUtils.ts`** (new): exports a pure `withAlpha(hex: string, alpha: number):
  string` helper (sRGB hex → `rgba(r,g,b,alpha)`), zero React/React Native import. This exists
  because `docs/design-brief-visual-identity.md` §4.1/§4.2 specify two translucent lime washes
  (`rgba(199,242,76,0.22)` and `rgba(199,242,76,0.18)`) that aren't literally present as tokens in
  `src/theme/colors.ts` (`colors.brand.primary` is the opaque `#C7F24C`, used for solid fills).
  Rather than typing either value as a bare, disconnected `rgba(...)` literal in the two chrome
  files (which would silently drift from `brand.primary` if that token ever changed) or adding a
  new named token for what's really just "brand.primary at some alpha," I computed both from the
  real token via this small, directly-testable helper — the same shape as `src/theme/contrast.ts`
  (a pure function extending the token module, not a bare literal). This is disclosed explicitly
  per this task's own instructions, since it's a judgment call: the task text also sanctioned "a
  clearly-commented exception referencing the brief's exact values" as an acceptable alternative
  if a helper felt disproportionate for two decorative constants — I judged the helper the better
  call here since *two* chrome files need the same derivation and a tested, reusable function is
  less error-prone than duplicating a hex-parsing comment/literal pair in each file.
- **`src/theme/colorUtils.test.ts`** (new): 3 tests — confirms `withAlpha(colors.brand.primary,
  0.22)` and `withAlpha(colors.brand.primary, 0.18)` reproduce the brief's exact `rgba(199,242,
  76,...)` strings (reading the *real* `colors` export, not a duplicated hex literal), plus one
  sanity check against a different token (`colors.brand.onPrimary`) at full opacity.
- **`src/theme/index.ts`** (modified): added `export { withAlpha } from "./colorUtils";` to the
  barrel, alongside the existing `contrastRatio` export — same pattern.
- **`src/features/identity/LoginScreenChrome.tsx`** (new, mobile/default): accepts `{ children:
  ReactNode }`. Renders a `View` (`flex: 1`, `backgroundColor: colors.bg.page`) containing an
  absolutely-positioned `expo-linear-gradient` `<LinearGradient>` pinned to the top (`top: 0,
  left: 0, right: 0`), sized to `useWindowDimensions().height * 0.45` (§4.1's "~45% of viewport
  height"), going from `withAlpha(colors.brand.primary, 0.22)` to `colors.bg.page`
  (`pointerEvents="none"` since it's purely decorative), and a `children`-hosting `View` (`flex:
  1`) rendered *after* the gradient in JSX/paint order — so children painted at the top overlap
  the wash, and children flowing past the wash's height land on the flat `bg.page` beneath it,
  matching §4.1 ("brand block sits inside it... form block sits on flat bg.page") without this
  component needing any knowledge of which child is which — that split is `LoginScreen.tsx`'s
  concern (a later task), not this one's.
- **`src/features/identity/LoginScreenChrome.web.tsx`** (new, web): accepts the same `{ children:
  ReactNode }` shape. Renders a full-bleed `View` (`colors.bg.page`, centered
  align/justify, `paddingVertical: 48`/`paddingHorizontal: 24` so the card never touches the
  viewport edge at narrow widths) carrying two radial-gradient blooms via a `backgroundImage` CSS
  string (`radial-gradient(circle at 100% 0%, ...)` top-right, `radial-gradient(circle at 0%
  100%, ...)` bottom-left, both using `withAlpha(colors.brand.primary, 0.18)` fading to
  `transparent` at 60% — the "fully-transparent outer stop" the brief and plan.md's Research
  Decision call for, no blur library). Inside, a centered card `View` (`testID=
  "login-chrome-card"`): `width: "100%"`, `maxWidth: 660`, `padding: 48`, `borderRadius:
  radius.card`, `backgroundColor: colors.bg.surfaceMuted`, `shadowSurface` — hosting `children`
  unchanged. `react-native-web` forwards unrecognized style keys straight to the underlying DOM
  node's CSS (the exact mechanism `src/theme/shadows.web.ts`'s `boxShadow` already relies on);
  since RN's own `ViewStyle` type has no `backgroundImage` member, the bloom-style object is typed
  as a small local `ViewStyle & { backgroundImage?: string }` extension rather than an `any` cast
  — this hit a real TypeScript gap during implementation (see Deviations below) that the token
  module's existing `boxShadow` pattern doesn't actually solve the way it first appeared to.
- **`src/features/identity/LoginScreenChrome.test.tsx`** (new): 4 tests — mobile variant renders
  its `children` unchanged; web variant renders its `children` unchanged; web variant's card
  container (`testID="login-chrome-card"`) has `maxWidth: 660`, `padding: 48`, `borderRadius:
  radius.card` (read from the real `@/theme` export, not a duplicated `28` literal).
- **`specs/006-visual-identity/tasks.md`** (modified): marked T025, T026, T027 `[X]`.

### Tests written/run

`colorUtils.test.ts` + `LoginScreenChrome.test.tsx` (6 new tests, all passing):

```
PASS src/theme/colorUtils.test.ts
PASS src/features/identity/LoginScreenChrome.test.tsx

Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
```

**Full existing suite** (`npx jest --no-coverage`, all 58 suites):

```
Test Suites: 58 passed, 58 total
Tests:       357 passed, 357 total
```

**Type-check**: `npx tsc --noEmit` — clean, zero errors.

**`./init.sh` (full, no `--skip-*` flags)** — `RESULT: SUCCESS (10/10 stages passed)`: type-check
clean, tests all passed, all three bundle exports (web/iOS/Android) clean. The two `WARN` stages
(expo-doctor outdated-dependency advisory, native-dependency version drift on
`expo-image-picker`/`react-native`/`react-native-safe-area-context`/`@types/react`/`typescript`)
are pre-existing and unrelated to this batch (unchanged from Run 7's report) — non-blocking per
`docs/verification.md`.

**Manual smoke check (Level 3)** — a real browser is available in this environment this run
(installed Chromium via `npx playwright install chromium` specifically to do this properly, since
Run 7's report flagged no browser was available). Started `npx expo start --web` and used
`npx playwright screenshot` against `http://localhost:8099/login` at 390×844 (mobile), 1280×900
(desktop), and 375×812 (FR-013's narrow-viewport check) — the app rendered correctly at all three
(no crash, no visual regression from Run 7's `FormField` restyle), confirming the new files
(`colorUtils.ts`, `LoginScreenChrome.tsx`/`.web.tsx`) don't break anything they're incidentally
bundled alongside. **However**, these screenshots show the *pre-existing* `/login` content only —
`LoginScreenChrome` isn't imported by `LoginScreen.tsx` yet (that wiring is T034, out of this
batch's scope), so there was nothing chrome-specific to see at `/login` itself yet. I then tried
a temporary, uncommitted preview route (`app/dev-chrome-preview.tsx`, rendering
`<LoginScreenChrome>` directly with sample content) to visually confirm the wash/bloom/card
render as designed ahead of T034 — this was blocked by the app's own `KycGate`
(`app/_layout.tsx`): for an unauthenticated session, `useKycGate()` resolves a non-`"main"` route
and `<Redirect>` unconditionally sends *any* requested path to `/login`, by design (not a bug to
route around). I judged temporarily patching around the app's own auth-redirect logic just to get
a screenshot was out of scope and riskier than the payoff, deleted the preview file (confirmed
gone from `git status`), and rely instead on: (a) the component-level tests above, which assert
the exact documented style values (`maxWidth`, `padding`, `borderRadius`, children passthrough);
(b) the `expo-linear-gradient` component itself confirmed to render without error under this
project's Jest setup (verified with a throwaway smoke test before writing the real component,
then removed); (c) `./init.sh`'s green web/iOS/Android bundle exports. A full visual confirmation
of the wash/bloom/card *in situ* on `/login` is the explicit subject of T034's own task text and
T037's mandatory manual smoke check later in Phase 3 — not skipped, just not yet reachable given
this task's scope (chrome only, not wired in).

### Requirement traceability

| FR / AS | Test |
|---|---|
| spec.md US2 AS1 (mobile: brand block inside a pale-lime wash fading to `bg.page` by ~45% of viewport height, form block on flat `bg.page`, per §4.1) | `LoginScreenChrome.tsx`'s implementation (gradient `colors={[WASH_TOP_COLOR, colors.bg.page]}`, height `= windowHeight * 0.45`); `LoginScreenChrome.test.tsx`'s mobile passthrough test confirms the wrapper doesn't alter what's rendered inside it |
| spec.md US2 AS2 (web: centered card — `bg.surfaceMuted`, `radius.card`, `shadow.surface`, `maxWidth: 660`, `padding: 48`, vertically centered — over a `bg.page` background with two radial blooms, bordered inputs unaffected by this task, per §4.2) | `LoginScreenChrome.test.tsx`: "renders the centered card with the documented maxWidth, padding, and radius.card (§4.2)" |
| FR-001 (semantic tokens only, no raw hex/magic literal duplicating a token) | `colorUtils.test.ts` confirms the wash/bloom colors are *derived* from the real `colors.brand.primary` export (not independently typed rgba strings); `LoginScreenChrome.test.tsx`'s card-style test reads `radius.card` from `@/theme`, not a duplicated `28` |
| FR-005 (platform difference via `.web.tsx`, not inline `Platform.OS`) | `LoginScreenChrome.web.tsx` is a distinct file resolved by Metro's platform-extension convention; neither file contains a `Platform.OS` branch — confirmed by inspection |
| "Chrome must never swallow or alter its children's content" (this task's own passthrough regression-guard instruction) | `LoginScreenChrome.test.tsx`: "renders its children unchanged" (both variants) |

### Task IDs now `[X]`

- T025, T026, T027

### Deviations / notes for sign-off

- **Added `src/theme/colorUtils.ts` (+ test)**, a file not explicitly named in T025–T027's task
  text. Flagged per this task's own instructions as a judgment call — see the "Files changed"
  entry above for the full reasoning (derive-from-token vs. bare-literal tradeoff). If review
  prefers the bare-literal-with-comment alternative instead, this is a small, easily-reverted
  addition (two rgba constants inline in the two chrome files, with the same explanatory comment
  moved there) — flagging for explicit sign-off rather than assuming the heavier option is
  correct.
- **A real TypeScript gap surfaced while writing `LoginScreenChrome.web.tsx`** that's worth
  recording for future `.web.tsx` authors: `src/theme/shadows.web.ts`'s untyped `{ boxShadow:
  string }` export type-checks cleanly at its call sites *only* because this repo's `tsconfig.json`
  has no `moduleSuffixes` configured, so `tsc` always resolves a bare `import "./shadows"` to the
  `.ts` (native) sibling for type-checking purposes — it never actually sees `shadows.web.ts`'s
  shape through that import path, regardless of which platform bundles at runtime. That means the
  "untyped object, let structural typing carry it" trick only works when a same-named, differently
  -typed *sibling* file exists for `tsc` to silently substitute. `LoginScreenChrome.web.tsx` has no
  such sibling defining the bloom-background object, so the same untyped-literal-in-an-array
  pattern produced a real `TS2769` excess-property-check error at the JSX call site. Resolved by
  typing the constant explicitly as `ViewStyle & { backgroundImage?: string }` (a named, honest
  extension of the real type — not `any`) rather than reaching for a workaround. No code or task
  text needed correcting because of this — it's a fact about *why* this file's typing looks
  slightly different from `shadows.web.ts`'s, recorded so it doesn't look like an inconsistency
  the next reader has to puzzle out independently.
- **Manual smoke check**: real screenshots taken of the current `/login` (unaffected, still
  showing Run 7's `FormField` restyle correctly) at three viewport widths, but the chrome
  components themselves could not be visually confirmed in a real browser this run because they
  aren't wired into any reachable route yet and the app's own `KycGate` redirect blocks
  previewing an arbitrary unauthenticated route — see the "Manual smoke check" section above for
  the full account of what was attempted and why it was judged out of scope to route around. This
  is disclosed explicitly, not silently skipped; T034 (wiring `LoginScreenChrome` into
  `LoginScreen.tsx`) and T037 (that phase's own mandatory `npm run web` smoke check) are where
  this gets a real, reachable, screen-reader-checkable visual confirmation.
- Stopped the temporary `expo start --web` dev server and removed the throwaway
  `app/dev-chrome-preview.tsx` file before finishing this run; confirmed via `git status` that no
  stray file was left behind.

Next: T028 (`SignInForm.tsx` restyle — `Field`/`PrimaryButton`/`SecondaryButton`/`OrDivider`,
i18n-routed copy), the next task in Phase 3's login restyle sequence. `LoginScreenChrome` is not
consumed by any screen yet — that's T034, later in the same phase, once T028/T030/T032 (the three
forms) are also restyled.

## Run 9 (2026-08-05) — T028, T029: Restyle `SignInForm.tsx` + extend its test (User Story 2, login restyle)

### Scope

`T028`/`T029` from `specs/006-visual-identity/tasks.md` — restyle
`src/features/identity/SignInForm.tsx` to `docs/design-brief-visual-identity.md` §4 items 4-10
(`Field`, `PrimaryButton`, `SecondaryButton`-styled `<Link>`, `OrDivider`, the right-aligned
forgot-password link, the legal line) with every string routed through
`useTranslation(loginCopy)`, and extend `SignInForm.test.tsx` accordingly. Read the pre-existing
`SignInForm.tsx`/`SignInForm.test.tsx` first, exactly as instructed, before changing anything.

### Files changed

- **`src/features/identity/SignInForm.tsx`** (modified): every existing prop
  (`onSubmit`/`onForgotPassword`/`isSubmitting`/`serverError`/`confirmationMessage`/`initialEmail`)
  and the `react-hook-form` + `zodResolver(signInSchema)` wiring are byte-for-byte unchanged —
  only the returned JSX/styles changed, plus the new `const t = useTranslation(loginCopy);` call.
  - Email/password fields: unchanged `FormField` (T023/T024's restyled `Field`) usage, now with
    `label={t("emailLabel")}`/`label={t("passwordLabel")}`, `accessibilityLabel` on each
    `TextInput` translated the same way, plus a new `placeholder={t("emailPlaceholder")}` +
    `placeholderTextColor={colors.text.placeholder}` on the email field (brief §4 item 4 — no
    prior placeholder existed). The `TextInput`'s own style lost every literal chrome property
    (`borderWidth`/`borderColor`/`borderRadius`/`padding*`, previously `#d1d5db`/`8`/`12`/`10`) —
    that chrome now lives entirely in `Field`'s container (T023/T024); the input itself only
    carries `typography.body.input`'s `fontSize`/`fontWeight` + `colors.text.primary`.
  - "Olvidé mi contraseña" (`Pressable`, unchanged `onForgotPassword`/`disabled`/
    `accessibilityState` wiring): moved from `alignSelf: "flex-start"` to `"flex-end"` (brief §4
    item 6's explicit right-alignment), text style now reads `typography.body.link`'s
    `fontSize`/`fontWeight`/`color` (was a hardcoded `{14, "500", "#374151"}`).
  - "Entrar": the old hand-styled `Pressable` is replaced by `<PrimaryButton>` (T012) —
    `label={isSubmitting ? t("signingIn") : t("signInButton")}`, `onPress={submit}`,
    `busy={isSubmitting}`, `testID="sign-in-submit-button"` (kept). `PrimaryButton`'s own
    `disabled || busy` logic now supplies the press-blocking + 60%-opacity behavior the old
    `styles.buttonDisabled` literal used to.
  - New `<OrDivider />` (T014) between the primary and secondary actions (brief §4 item 8) — no
    props, purely decorative.
  - "Crear cuenta": the existing `<Link href="/register">` is preserved verbatim (same `href`,
    same navigation mechanism — T028's brief explicitly calls for "wrapping" `<Link>`, not
    replacing it) but now carries `SecondaryButton`'s exact geometry/token values
    (`CONTROL_HEIGHT`, `radius.pill`, `colors.bg.surface` fill, `colors.border.subtle` 1px,
    `colors.text.primary` bold label, `typography.button.label`'s size/weight) applied directly
    to the `<Link>`'s own `style` prop, since expo-router's `<Link>` renders as a `Text`-backed
    navigation element and can't literally host the `SecondaryButton` component (which takes
    `onPress`, not `href`). `lineHeight: CONTROL_HEIGHT` + `textAlignVertical: "center"` reproduce
    the same "Text-as-button" vertical-centering trick the pre-006 code already used for this
    exact element, now with token-driven dimensions instead of ad-hoc ones.
  - New legal line (brief §4 item 10, not present before this task at all): one `<Text>` styled
    with `typography.body.legal` containing `t("legalPrefix")`/`t("legalMiddle")` as plain
    segments and `t("termsLink")`/`t("privacyLink")` as nested `<Text style={{color:
    colors.text.link}}>` spans — verified via a throwaway spike test (see "Tests written/run"
    below) that RNTL's `getByText` can resolve each nested span independently before committing to
    this structure, since that's exactly how `SignInForm.test.tsx`'s new legal-line test queries
    it.
  - Kept, translated via `t("signInTitle")`: the pre-existing "Sign in" `<Text
    accessibilityRole="header">` heading. This is **not** part of brief §4's items 4-10 (which
    start at the email field — items 1-3, the brand block, are `LoginScreen.tsx`'s territory,
    T034) — flagged explicitly as a judgment call in Deviations below, not a silent inconsistency.
  - Two pre-existing literals kept as documented exceptions, same precedent as
    `FormField.tsx`'s error-text color (Run 7): the title's `fontSize: 22`/`fontWeight: "600"`
    (no brief-specified heading token exists) and the general-error banner's `#dc2626` (no
    error/danger token exists in this feature's token module either).
  - New imports: `loginCopy` (`@/domain/i18n/copy/login`), `useTranslation`
    (`@/features/i18n/LocaleContext`), `colors`/`CONTROL_HEIGHT`/`radius`/`space`/`typography`
    (`@/theme`), `OrDivider`/`PrimaryButton` (`@/features/ui`).
- **`src/features/identity/SignInForm.test.tsx`** (modified): every one of the six pre-existing
  test cases is kept, each now querying `loginCopy.es`'s real exported strings
  (`es.emailLabel`/`es.passwordLabel`/`es.signInButton`/`es.forgotPassword`/`es.createAccount`)
  instead of the old hardcoded English literals — reading the dictionary directly (never a
  duplicated string) so this file can't silently drift from the real copy. Added three new
  tests: (1) the forgot-password link's right-alignment (`alignSelf: "flex-end"`) and
  `body.link`-colored label; (2) the legal line renders both link phrases
  (`es.termsLink`/`es.privacyLink`) with `colors.text.link`; (3) rendering under a
  `<LocaleProvider>` with a test-only `LocaleSwitchTrigger` (the exact pattern
  `src/features/i18n/LocaleContext.test.tsx` already established) and pressing it to
  `setLocale("en")` shows every English equivalent (`en.emailLabel`, `en.passwordLabel`,
  `en.forgotPassword`, `en.signInButton`, `en.createAccount`, `en.termsLink`, `en.privacyLink`),
  after first confirming Spanish is the pre-switch default (FR-012).
- **`src/features/identity/LoginScreen.test.tsx`** and **`app/(auth)/login.test.tsx`**
  (modified — **not in T028/T029's own file list, see Deviations below for why this was
  necessary**): every `getByLabelText("Email"|"Password")`/`getByRole("button", { name: "Sign
  in"|"Forgot password?" })` query that targets a currently-**SignInForm**-mounted field/control
  (i.e. while `LoginScreen`'s `mode === "sign-in"`) was updated to read the same real
  `loginCopy.es` strings (via a new `const signInCopy = loginCopy.es;`) SignInForm now actually
  renders. Every query that targets `RequestPasswordResetForm`'s or `ResetPasswordForm`'s own
  fields/buttons (`"Send reset code"`, `"Back to sign in"`, `"Reset code"`, `"New password"`,
  `"Set new password"`, and every `getByLabelText("Email")` reached while `mode ===
  "request-reset"`/`"reset-with-code"`) was left **completely untouched** — those two forms are
  T030/T032's scope, not yet landed, and still render their pre-existing hardcoded English copy.
  This required tracing each test's exact mode sequence line-by-line to avoid mis-classifying an
  occurrence (see Deviations — I caught and fixed one such misclassification myself, on
  `LoginScreen.test.tsx` line 211, before finalizing this run).
- **`specs/006-visual-identity/tasks.md`** (modified): marked T028, T029 `[X]`.

### Tests written/run

1. **New/updated `SignInForm.test.tsx` suite** (10 tests, all passing):
   ```
   PASS src/features/identity/SignInForm.test.tsx
     SignInForm
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

   Test Suites: 1 passed, 1 total
   Tests:       10 passed, 10 total
   ```
   Before writing the legal-line assertion, ran a throwaway spike test confirming RNTL's
   `getByText` resolves a nested `<Text>` span's own content independently of its parent
   `<Text>`'s combined content (not obvious from the RN nesting model alone) — passed, then
   deleted the spike file, confirmed via `git status` it left no trace.

2. **Type-check**: `npx tsc --noEmit` — clean, zero errors.

3. **Full existing test suite** (`npx jest --no-coverage`, all 58 suites — includes the
   `LoginScreen.test.tsx`/`login.test.tsx` ripple fix described in Deviations):
   ```
   Test Suites: 58 passed, 58 total
   Tests:       360 passed, 360 total
   ```
   Zero regressions to any pre-existing assertion's underlying behavior — every fixed query now
   targets the same functional element it always did, just under its new (Spanish-by-default)
   rendered name.

4. **`./init.sh` (full, no `--skip-*` flags)** — `RESULT: SUCCESS (10/10 stages passed)`:
   type-check clean, full test suite green, all three bundle exports (web/iOS/Android) clean. The
   two `WARN` stages (expo-doctor outdated-dependency advisory, native-dependency version drift on
   `expo-image-picker`/`react-native`/`react-native-safe-area-context`/`@types/react`/
   `typescript`) are the same pre-existing, unrelated drift every prior run in this feature has
   already documented — no dependency was added/changed this run.

5. **Manual smoke check (Level 3)**: no headless-browser binary was available in this sandbox
   (`chromium`/`google-chrome` not found; `npx playwright install chromium` completed with exit
   code 0 but did not actually download a browser — no network-fetched cache appeared under
   `~/.cache/ms-playwright` afterward, unlike Run 8's session in this same feature). In lieu of a
   real screenshot: started `npx expo start --web` on a scratch port and `curl`'d `/login` —
   confirmed HTTP 200, a clean Metro bundle (`Web Bundled ... node_modules/expo-router/entry.js`,
   no error), and only the same two pre-existing native-dependency-drift warnings already
   documented above (no new warning from this run's files). The raw HTML response only shows
   `KycGate`'s SSR-time `isLoading` placeholder (`data-testid="kyc-gate-loading"`) — this
   repo's `expo-router` server-renders the *initial* HTML per request even under `expo start
   --web`, but `useKycGate()`'s Supabase session check is genuinely async, so the real `/login`
   form (this task's actual subject) only appears after client-side hydration, which `curl` can't
   execute. Stopped the dev server and confirmed via `lsof`/`git status` no stray process or file
   was left behind. Given no browser was reachable, this run's confidence in the actual rendered
   look comes from: (a) `SignInForm.test.tsx`'s 10 component-level tests, which assert the exact
   documented style values (`alignSelf: "flex-end"`, `colors.text.link`, translated labels/roles)
   directly against rendered output; (b) the clean bundle export/dev-server-serve confirming no
   import/runtime-crash exists; (c) the full 360-test regression suite. This is the same
   deferred-smoke-check disclosure pattern Runs 7/8 already used in this feature for the identical
   reason (no browser reachable in that session) — not silently skipped. A real, reachable,
   screen-visible confirmation of this file's restyle is `tasks.md`'s T037 (once T030-T036 finish
   composing the full `/login` screen).

### Requirement traceability

| FR / AS | Test(s) |
|---|---|
| FR-006 (zero change to the no-`useRouter()`-on-success guard, the `onSubmit`/`onForgotPassword`/etc. prop contract, and the `zodResolver(signInSchema)` wiring) | Every one of `SignInForm.test.tsx`'s pre-existing 6 tests, still passing, still exercising the identical prop contract and validation wiring — only the query strings now target the new rendered copy. |
| spec.md US2 AS3 (exact §4 copy, Spanish orthography — `CONTRASEÑA` not `CONTRASENA`, `Olvidé` not `Olvide` — and an accurate English equivalent in the same content order) | `SignInForm.test.tsx`'s "renders the English equivalents when the locale context is set to 'en'" test; `loginCopy.es`'s own pre-existing orthography (verified correct in Run 5's `copy/login.test.ts`) is what every other query in this file now reads live. |
| spec.md US2 AS6 ("Crear cuenta" still navigates via the existing `<Link href="/register">`, unchanged) | `SignInForm.test.tsx`'s "resolves the 'Create account' link's href to exactly /register" test (unchanged assertion, now against the translated `accessibilityLabel`). |
| FR-010 (every string routed through `useTranslation(loginCopy)`, zero hardcoded copy left in this file) | Every string in `SignInForm.tsx`'s JSX is now a `t(...)` call (grep-verifiable: no literal Spanish/English sentence remains in the file) — confirmed by inspection while writing it; the "renders the English equivalents" test is the runtime proof this actually took effect, not just that the call sites exist. |
| FR-013 (real accessibility label + tap target on every interactive element) | `SignInForm.test.tsx`'s forgot-password-link test asserts the `body.link`-colored label directly; `PrimaryButton`'s own `T012` test suite (unchanged, still green) already covers the ≥44×44/`accessibilityState.disabled` contract this file now delegates to. |

### Task IDs now `[X]`

- T028, T029

### Deviations / notes for sign-off

- **The most significant deviation this run, flagged explicitly rather than improvised silently:
  T028 changing `SignInForm`'s default-rendered copy to Spanish (FR-012's `DEFAULT_LOCALE = "es"`)
  broke 13 pre-existing tests in two files outside T028/T029's own scope —
  `src/features/identity/LoginScreen.test.tsx` and `app/(auth)/login.test.tsx` — because both
  files query SignInForm's rendered fields/buttons by their old hardcoded English text
  (`"Email"`, `"Password"`, `"Sign in"`, `"Forgot password?"`). This is an unavoidable, direct,
  foreseeable consequence of T028 landing before T034-T036 (the tasks that actually own those two
  test files) — not a bug in either file, and not something a different implementation of T028
  could have avoided while still meeting FR-012/FR-010's requirement that the login screen
  actually renders in Spanish by default.**
  - Given the explicit instruction to run the full suite and confirm zero regression before
    reporting done, and given `docs/verification.md`/`tasks.md` T052's own precedent ("If any
    pre-existing test fails because it asserted a now-changed... detail... fix the *test* to
    assert behavior/role/text instead... never silently revert the restyle"), I fixed the
    **minimum necessary** ripple in both files: updating only the literal query strings that
    target SignInForm's own now-translated copy (via a new `const signInCopy = loginCopy.es`,
    reading the real dictionary rather than a duplicated literal), while leaving every query that
    targets `RequestPasswordResetForm`'s/`ResetPasswordForm`'s still-hardcoded-English copy
    completely untouched. I did **not** touch `LoginScreen.tsx`/`login.tsx` themselves (no source
    logic changed, only their test files' query strings), and did **not** do any of T034-T036's
    actual remaining work (adding `BrandMark`/title/tagline, wiring `LoginScreenChrome`,
    confirming `app/(auth)/login.tsx`'s prop shape) — those tasks still have their own real work
    to do, including likely extending these same two test files further under their own task IDs.
  - This required tracing each affected test's exact `mode` sequence (`"sign-in"` →
    `"request-reset"` → `"reset-with-code"` → `"sign-in"`) line-by-line to correctly classify
    which `getByLabelText("Email")` occurrence belonged to which form, since the string `"Email"`
    is a label shared by all three forms' (currently-unmodified two, now-modified one)
    `FormField`/`Field` instances and only one is ever mounted at a time. **I made one
    classification mistake in my first pass** (initially changed `LoginScreen.test.tsx` line 211's
    `getByLabelText("Email")` — which the adjacent comment explicitly says targets
    "ResetPasswordForm's initialEmail" — to the Spanish string), caught it via the resulting test
    failure on the very next full-suite run, and corrected it back to the plain `"Email"` literal
    with a clarifying comment before finalizing. Flagging this explicitly rather than silently
    fixing it, since it's a real signal of how easy this specific kind of cross-file ripple is to
    get subtly wrong — worth double-checking again at T034/T035/T036 time once
    `RequestPasswordResetForm`/`ResetPasswordForm` also gain translated copy and every remaining
    `"Email"`/`"Reset code"`/etc. literal in these two test files needs the same treatment.
  - **Flagging for explicit sign-off**: this fix keeps the suite green today, but T034/T035/T036
    (not yet done) will need to revisit both files again once `RequestPasswordResetForm.tsx`/
    `ResetPasswordForm.tsx` are themselves restyled/translated (T030-T033) — at that point every
    remaining hardcoded-English query in `LoginScreen.test.tsx`/`login.test.tsx` will need the
    same kind of update this run just did for SignInForm's slice. This run does not pre-empt that
    work, only unblocks the suite for the state as of T028/T029.
- **Kept the pre-existing "Sign in" heading** (translated to `t("signInTitle")`), even though
  brief §4's content order for this file (items 4-10) doesn't include a heading between the
  tagline and the email field — removing it felt like a structural change beyond "markup/styling
  + copy-routing only" (no instruction asked for its removal), so it was preserved and merely
  translated/token-colored. Flagged explicitly for sign-off: if the human prefers it gone once
  `LoginScreen.tsx`'s brand block (T034) sits directly above this form, that's a one-line removal
  at that time, not a redesign.
- **Two literals kept undokenized, same disclosed precedent as `FormField.tsx`'s error-text
  color (Run 7)**: the "Sign in" title's `fontSize: 22`/`fontWeight: "600"` (no brief-specified
  heading token) and the general-error banner's `#dc2626` (no error/danger token in this
  feature's token module). Both pre-exist this run's changes; neither is new.
- **`SecondaryButton` itself is not literally instantiated for "Crear cuenta"** — per the task's
  own phrasing ("SecondaryButton... wrapping the existing `<Link href="/register">` behavior"),
  the component can't host an `href`-driven `<Link>` (it takes `onPress`), so its exact style
  values were applied directly to the `<Link>`'s own `style` prop instead. This is disclosed as a
  literal reading of the task text, not a silent substitution — the navigation behavior itself
  (`<Link href="/register">`, unchanged) is exactly what the task asked to preserve.
- No other deviations from the task brief. `RequestPasswordResetForm.tsx`/`ResetPasswordForm.tsx`
  (T030/T032) and `LoginScreen.tsx`'s own composition (T034) remain untouched and out of this
  batch's scope, as instructed.

Next: T030 (`RequestPasswordResetForm.tsx` restyle) is the next task in Phase 3's login restyle
sequence, per `tasks.md`'s stated dependency ordering.

## Run 10 (2026-08-05) — T030, T031: Restyle `RequestPasswordResetForm.tsx` + extend its test (User Story 2, login restyle)

### Scope

`T030`/`T031` from `specs/006-visual-identity/tasks.md` — restyle
`src/features/identity/RequestPasswordResetForm.tsx` to the same `Field`/`PrimaryButton`
vocabulary `SignInForm.tsx` (T028, Run 9) already established, with every string routed through
`useTranslation(loginCopy)`, and extend `RequestPasswordResetForm.test.tsx` accordingly. Read the
pre-existing component/test files first, exactly as instructed, before changing anything, and read
Run 9's report for the exact pattern to reuse (how it used `Field`/`PrimaryButton`/
`useTranslation(loginCopy)` while preserving props/behavior exactly).

### Files changed

- **`src/features/identity/RequestPasswordResetForm.tsx`** (modified): every existing prop
  (`onSubmit`/`onBack`/`isSubmitting`/`serverError`) is byte-for-byte unchanged — only the
  returned JSX/styles changed, plus a new `const t = useTranslation(loginCopy);` call.
  - Title (`t("requestResetTitle")`), subtitle (`t("requestResetSubtitle")`), and the general
    `serverError` banner are unchanged in structure/logic, now translated.
  - Email field: unchanged `FormField` (T023/T024's restyled `Field`) usage, now with
    `label={t("emailLabel")}`, translated `accessibilityLabel`, plus a new
    `placeholder={t("emailPlaceholder")}` + `placeholderTextColor={colors.text.placeholder}`
    (mirroring T028's identical addition to `SignInForm`'s email field — brief §4 item 4's
    placeholder treatment, reused here since this view shares the same field vocabulary). The
    `TextInput`'s own style lost every literal chrome property (`borderWidth`/`borderColor`/
    `borderRadius`/`padding*`) — that chrome now lives entirely in `Field`'s container; the input
    itself only carries `typography.body.input`'s `fontSize`/`fontWeight` + `colors.text.primary`,
    same as T028's identical change to `SignInForm`.
  - "Send reset code": the old hand-styled `Pressable` is replaced by `<PrimaryButton>` (T012) —
    `label={isSubmitting ? t("sendingResetCode") : t("sendResetCode")}`, `onPress={submit}`,
    `busy={isSubmitting}`, `testID="request-reset-submit-button"` (kept). `PrimaryButton`'s own
    `disabled || busy` logic now supplies the press-blocking + 60%-opacity behavior the old
    `styles.buttonDisabled` literal used to.
  - "Back to sign in": kept as a plain `Pressable` (not `SecondaryButton`) — a full-width pill
    would read as a second, competing call-to-action on a screen with exactly one real action,
    the same judgment `SignInForm.tsx` already applied to its own "Olvidé mi contraseña" link
    (task-implementer's judgment call, per the task's own "task-implementer's judgment call"
    phrasing). Restyled with `typography.body.link`'s `fontSize`/`fontWeight`/`color` (was a
    hardcoded `{14, "500", "#374151"}`), same token-driven treatment as `SignInForm`'s
    forgot-password link. Kept `alignSelf: "flex-start"` (unchanged position — no mockup exists
    for this view to specify a different alignment from).
  - Confirmation copy (`t("requestResetConfirmation")`, shown when `submitted` is true): copy now
    resolves through `loginCopy` instead of the retired `REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE`
    exported constant — the anti-enumeration LOGIC (always the same message regardless of whether
    the email is registered) is completely untouched, only where the text comes from changed.
    Confirmed via repo-wide `grep -rn "REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE"` before removing
    the export that nothing outside this file's own (now-rewritten) test imported it.
  - Two pre-existing literals kept as documented exceptions, same precedent as `FormField.tsx`'s
    error-text color (Run 7) and `SignInForm.tsx`'s title/error-banner literals (Run 9): the
    title's `fontSize: 22`/`fontWeight: "600"` (no brief-specified heading token exists — this
    view has no mockup at all) and the general-error banner's `#dc2626` (no error/danger token
    exists in this feature's token module).
  - New imports: `loginCopy` (`@/domain/i18n/copy/login`), `useTranslation`
    (`@/features/i18n/LocaleContext`), `colors`/`space`/`typography` (`@/theme`), `PrimaryButton`
    (`@/features/ui/PrimaryButton`).
- **`src/features/identity/RequestPasswordResetForm.test.tsx`** (modified): every one of the four
  pre-existing test cases is kept, unmodified in behavior/assertions, each now querying
  `loginCopy.es`'s real exported strings (`es.emailLabel`, `es.sendResetCode`, `es.backToSignIn`,
  `es.requestResetConfirmation`) instead of the old hardcoded English literals/the retired
  `REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE` import — reading the dictionary directly (never a
  duplicated string) so this file can't silently drift from the real copy. Added one new test
  (T031's explicit ask, "a locale-switch rendering check"): rendering under a `<LocaleProvider>`
  with a test-only `LocaleSwitchTrigger` (the exact pattern `SignInForm.test.tsx`/
  `LocaleContext.test.tsx` already established) and pressing it to `setLocale("en")` shows every
  English equivalent (`en.emailLabel`, `en.requestResetTitle`, `en.requestResetSubtitle`,
  `en.sendResetCode`, `en.backToSignIn`), after first confirming Spanish is the pre-switch default
  (FR-012).
- **`src/features/identity/LoginScreen.test.tsx`** and **`app/(auth)/login.test.tsx`** (modified —
  **not in T030/T031's own file list, but a foreseeable ripple of the same shape Run 9 already
  hit and documented for T028** — see Deviations below for why this was necessary): every
  `getByLabelText("Email")`/`getByRole("button", { name: "Send reset code"|"Back to sign in" })`
  query that targets a currently-**RequestPasswordResetForm**-mounted field/control (i.e. while
  `LoginScreen`'s `mode === "request-reset"`) was updated to read the same real `loginCopy.es`
  strings (via a new `const requestResetCopy = loginCopy.es;`) `RequestPasswordResetForm` now
  actually renders. Every query that targets `ResetPasswordForm`'s own fields/buttons (reached
  only after the mode sequence has already advanced to `"reset-with-code"` — "Reset code", "New
  password", "Set new password", and the "Email"/"Back to sign in" occurrences that happen
  specifically *after* that transition) was left **completely untouched** — that's T032's scope,
  not yet landed. Traced each affected test's exact mode sequence line-by-line before changing
  anything, the same discipline Run 9's report flagged as easy to get subtly wrong (its own
  disclosed near-miss on `LoginScreen.test.tsx` line 211) — no misclassification this run,
  confirmed by the full suite passing on the first re-run after these edits.
- **`specs/006-visual-identity/tasks.md`** (modified): marked T030, T031 `[X]`.

### Tests written/run

1. **New/updated `RequestPasswordResetForm.test.tsx` suite** (5 tests, all passing):
   ```
   PASS src/features/identity/RequestPasswordResetForm.test.tsx
     RequestPasswordResetForm
       ✓ calls onSubmit with the parsed email then renders the generic confirmation on success
       ✓ renders a serverError banner instead of the confirmation when onSubmit resolves false
       ✓ shows an inline validation error and does not call onSubmit for an invalid email
       ✓ calls onBack when 'Back to sign in' is pressed
       ✓ renders the English equivalents when the locale context is set to 'en'

   Test Suites: 1 passed, 1 total
   Tests:       5 passed, 5 total
   ```

2. **Type-check**: `npx tsc --noEmit` — clean, zero errors.

3. **Ripple fix verification** — `LoginScreen.test.tsx` (9/9 passing) and the full suite (below)
   confirm the `requestResetCopy`-based query updates in both affected test files resolve
   correctly against `RequestPasswordResetForm`'s new rendered copy, with zero change to any
   `ResetPasswordForm`-targeting query.

4. **Full existing test suite** (`npx jest --no-coverage`, all 58 suites):
   ```
   Test Suites: 58 passed, 58 total
   Tests:       361 passed, 361 total
   ```
   Zero regressions to any pre-existing assertion's underlying behavior — every fixed query now
   targets the same functional element it always did, just under its new (Spanish-by-default)
   rendered name.

5. **`./init.sh` (full, no `--skip-*` flags)** — `RESULT: SUCCESS (10/10 stages passed)`:
   type-check clean, full test suite green (361/361), all three bundle exports (web/iOS/Android)
   clean. The two `WARN` stages (expo-doctor outdated-dependency advisory, native-dependency
   version drift on `expo-image-picker`/`react-native`/`react-native-safe-area-context`/
   `@types/react`/`typescript`) are the same pre-existing, unrelated drift every prior run in this
   feature has already documented — no dependency was added/changed this run.

6. **Manual smoke check (Level 3)**: no headless-browser binary was available in this sandbox
   (`chromium`/`google-chrome`/`chromium-browser` not found; no Playwright browser cache present
   at `~/.cache/ms-playwright`) — the same limitation Runs 7-9 already hit and disclosed in this
   feature. In lieu of a real screenshot: started `npx expo start --web` on a scratch port
   (8123) and `curl`'d `/login` — confirmed HTTP 200, a clean Metro web bundle export with no
   error, and only the same two pre-existing native-dependency-drift warnings already documented
   above (no new warning from this run's files). Stopped the dev server afterward and confirmed
   via `lsof`/`git status` no stray process or file was left behind. As with Run 9, the real
   `/login` form only renders after client-side hydration (behind `useKycGate()`'s async Supabase
   session check), which a plain `curl` can't execute — so this run's confidence in the actual
   rendered look comes from: (a) `RequestPasswordResetForm.test.tsx`'s 5 component-level tests,
   which assert the exact documented behavior (translated labels/roles, `PrimaryButton`'s
   busy/disabled contract inherited unchanged, the locale switch) directly against rendered
   output; (b) the clean bundle export/dev-server-serve confirming no import/runtime-crash exists;
   (c) the full 361-test regression suite. Not silently skipped — disclosed explicitly, same
   pattern as every prior run in this feature that hit the same sandbox limitation. A real,
   reachable, screen-visible confirmation of this file's restyle (and every other forgot-password
   sub-view) is `tasks.md`'s T037, once T032-T036 finish composing the full `/login` screen.

### Requirement traceability

| FR / AS | Test(s) |
|---|---|
| spec.md Assumptions ("forgot-password sub-views inherit the vocabulary, not a new mockup layout") | `RequestPasswordResetForm.tsx`'s use of `Field`/`PrimaryButton`/token-driven styling, identical vocabulary to `SignInForm.tsx` (T028); no new content order (grep-verifiable — same field/button sequence as before this task). |
| `onSubmit`'s boolean-resolving contract, `onBack`, `isSubmitting`, `serverError`, the anti-enumeration confirmation copy — preserved exactly | Every one of `RequestPasswordResetForm.test.tsx`'s 4 pre-existing tests, still passing, still exercising the identical prop contract — only the query strings now target the new rendered copy. |
| FR-010 (every string routed through `useTranslation(loginCopy)`, zero hardcoded copy left in this file) | Every string in `RequestPasswordResetForm.tsx`'s JSX is now a `t(...)` call (grep-verifiable: no literal Spanish/English sentence remains in the file) — confirmed by inspection while writing it; the "renders the English equivalents" test is the runtime proof this actually took effect. |
| spec.md US4 AS1 (every visible string looked up by key, no hardcoded copy) | `RequestPasswordResetForm.test.tsx`'s "renders the English equivalents when the locale context is set to 'en'" test. |
| FR-013 (real accessibility label + tap target on every interactive element) | `RequestPasswordResetForm.tsx`'s "Send reset code" now delegates to `PrimaryButton`'s own already-tested (T012) ≥44×44/`accessibilityState.disabled`/busy contract; "Back to sign in" keeps its pre-existing `minHeight: 44, minWidth: 44` tap target, unchanged. |

### Task IDs now `[X]`

- T030, T031

### Deviations / notes for sign-off

- **The same class of ripple Run 9 flagged for T028 recurred here for T030, on the same two files
  (`LoginScreen.test.tsx`, `app/(auth)/login.test.tsx`), for the same unavoidable reason**:
  translating `RequestPasswordResetForm`'s rendered copy to Spanish-by-default (FR-012) broke every
  query in those two files that targeted its old hardcoded English text
  (`"Email"`/`"Send reset code"`/`"Back to sign in"`, while `mode === "request-reset"`
  specifically). Per the same precedent Run 9 established (and `docs/verification.md`/`tasks.md`
  T052's own guidance — fix the *test* to assert behavior/role/text instead of reverting the
  restyle), I fixed the minimum necessary ripple: added a `requestResetCopy = loginCopy.es` alias
  in both files and retargeted only the queries that fire while `mode === "request-reset"`, tracing
  each test's exact mode sequence line-by-line (as Run 9's report recommended doing again at this
  exact point) to avoid the same kind of classification mistake Run 9 disclosed making once. No
  misclassification this run — the full suite passed on the first re-run after these edits. Left
  every query targeting `ResetPasswordForm`'s own still-hardcoded-English copy (reached only after
  the mode sequence advances to `"reset-with-code"`) completely untouched — that form's own restyle
  is T032, not yet landed, and will need this exact same treatment applied to its own remaining
  occurrences in both files at that time.
- **Retired the `REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE` exported constant** rather than
  keeping it as a static English fallback — confirmed via `grep -rn
  "REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE"` across `src/`/`app/` that only this file and its
  own test imported it (a comment in `ResetPasswordForm.tsx` *mentions* it in prose but does not
  import it), so removing it is safe. The confirmation copy's anti-enumeration LOGIC is completely
  unchanged (still always the same message regardless of registration status) — only its text now
  comes from `loginCopy.{es,en}.requestResetConfirmation` (already present in the dictionary since
  Run 5/T019) rather than a locale-blind hardcoded string. Flagged explicitly since removing an
  exported symbol is a small API-surface change, even though nothing outside this file's own test
  depended on it.
- **Kept "Back to sign in" as a plain restyled `Pressable`, not a `SecondaryButton`** — this was an
  explicit either/or choice left to task-implementer's judgment in the task brief itself. Chose the
  plain-link treatment because a full-width pill-shaped `SecondaryButton` would read as a second
  competing call-to-action on a screen with exactly one real action ("Send reset code"), mirroring
  the same reasoning `SignInForm.tsx` (T028) already applied to its own right-aligned
  "Olvidé mi contraseña" link rather than making it a button-styled control. Flagged for sign-off
  in case the human prefers the heavier `SecondaryButton` treatment instead — this is a small,
  easily-reverted style choice, not a structural one.
- No other deviations from the task brief. `ResetPasswordForm.tsx` (T032) and `LoginScreen.tsx`'s
  own composition (T034) remain untouched and out of this batch's scope, as instructed.

Next: T032 (`ResetPasswordForm.tsx` restyle) is the next task in Phase 3's login restyle sequence,
per `tasks.md`'s stated dependency ordering — its own restyle will require the same kind of
`LoginScreen.test.tsx`/`app/(auth)/login.test.tsx` ripple fix this run and Run 9 both already
performed, now for the remaining `ResetPasswordForm`-targeting queries in both files.

---

## Run 11 (2026-08-05) — T032, T033: Restyle `ResetPasswordForm.tsx` + extend its test (User Story 2, login restyle)

### Scope

`T032`/`T033` from `specs/006-visual-identity/tasks.md` — restyle
`src/features/identity/ResetPasswordForm.tsx` to the same `Field`/`PrimaryButton` vocabulary
`SignInForm.tsx` (T028, Run 9) and `RequestPasswordResetForm.tsx` (T030, Run 10) already
established, with every string routed through `useTranslation(loginCopy)`, and extend
`ResetPasswordForm.test.tsx` accordingly. Read the pre-existing component/test files first, exactly
as instructed, before changing anything, and read Run 10's report for the exact pattern to reuse.

### Files changed

- **`src/features/identity/ResetPasswordForm.tsx`** (modified): every existing prop
  (`onSubmit`/`onResend`/`onBack`/`initialEmail`/`isSubmitting`/`isResending`/`serverError`) is
  byte-for-byte unchanged — only the returned JSX/styles changed, plus a new
  `const t = useTranslation(loginCopy);` call. `RESEND_COOLDOWN_SECONDS`'s value and its timer
  `useEffect` are unchanged; the `serverError?.field === "code"` -> `setError(serverError.field,
  ...)` inline-error `useEffect` is unchanged.
  - Title (`t("resetCodeTitle")`), the always-shown confirmation line (`t("resetCodeSentMessage")`,
    same `testID="reset-password-code-sent-message"`/`accessibilityRole="text"` as before), and
    subtitle (`t("resetCodeSubtitle")`) are unchanged in structure/logic, now translated. The
    general `serverError` banner (shown only when `!serverError.field`) is unchanged — it renders
    the server-provided message text verbatim, not a translated key (it never was a static string
    to translate).
  - Email field: unchanged `FormField` (T023/T024's restyled `Field`) usage, now with
    `label={t("emailLabel")}`, translated `accessibilityLabel`, plus a new
    `placeholder={t("emailPlaceholder")}` + `placeholderTextColor={colors.text.placeholder}`
    (mirroring T028/T030's identical addition to their own email fields — brief §4 item 4's
    placeholder treatment, reused here for the same field vocabulary). The `initialEmail` pre-fill/
    editability logic in `useForm`'s `defaultValues` is completely untouched.
  - Reset-code field: unchanged `FormField` wrapping an unchanged `CodeInput` (T013) — only the
    `Field`'s `label`/`accessibilityLabel` are now `t("resetCodeLabel")`; `CodeInput` itself
    receives no new props and is not modified in any way (per the task's explicit instruction).
  - New-password field: unchanged `FormField`/`TextInput` structure — `label`/`accessibilityLabel`
    now `t("newPasswordLabel")`; `autoComplete="password-new"`/`secureTextEntry` unchanged.
  - "Set new password": the old hand-styled `Pressable` is replaced by `<PrimaryButton>` (T012) —
    `label={isSubmitting ? t("settingPassword") : t("setNewPassword")}`, `onPress={submit}`,
    `busy={isSubmitting}`, `testID="reset-password-submit-button"` (kept). `PrimaryButton`'s own
    `disabled || busy` logic now supplies the press-blocking + 60%-opacity behavior the old
    `styles.buttonDisabled` literal used to.
  - "Resend code": replaced the old hand-styled bordered `Pressable` with `<SecondaryButton>`
    (T013) — `label={resendLabel}` (a small local `resendLabel` computed the same way as before:
    `secondsRemaining > 0 ? t("resendCodeWithSeconds").replace("{{seconds}}", String(secondsRemaining))
    : t("resendCode")`, using `loginCopy.login.ts`'s documented `{{seconds}}`-template convention
    for this one interpolation case per `plan.md`'s i18n Research Decision), `onPress=
    {handleResendPress}` (unchanged function — still sets `secondsRemaining` and calls `onResend`),
    `disabled={!canResend}` (unchanged `canResend` derivation: `!isResending && !isSubmitting &&
    secondsRemaining === 0`), `testID="reset-password-resend-button"` (kept). Chose
    `SecondaryButton` over a plain restyled `Pressable` (the task brief's explicit either/or,
    "Pressable/SecondaryButton") because — unlike "Back to sign in", which reads as a plain link —
    this control was ALREADY a bordered, button-shaped secondary action before this restyle (full
    background/border/centered-label, not a bare link), so `SecondaryButton`'s exact geometry is a
    direct, non-inventive fit rather than a new design decision. One small, disclosed behavior
    delta: the old markup additionally set `accessibilityState.busy: isResending` — neither
    `PrimaryButton` nor `SecondaryButton` (T012/T013, both pre-existing from earlier phases of this
    same feature) expose a `busy` key in `accessibilityState`, only `disabled` (which already
    covers the `isResending` case via `canResend`'s derivation, since `isResending` being `true`
    already forces `disabled` to `true`) — see Deviations below.
  - "Back to sign in": kept as a plain, restyled `Pressable` (not `SecondaryButton`) — same
    judgment `RequestPasswordResetForm.tsx` (T030) already applied to its own "Back to sign in":
    a full-width pill would read as a second/third competing call-to-action on a screen that
    already has two real actions ("Set new password", "Resend code"). Restyled with
    `typography.body.link`'s `fontSize`/`fontWeight`/`color` (was a hardcoded
    `{14, "500", "#374151"}`), identical treatment to `RequestPasswordResetForm.tsx`'s and
    `SignInForm.tsx`'s own link-styled controls — the same restyled visual vocabulary, confirmed by
    reading `RequestPasswordResetForm.tsx`'s actual final implementation before writing this one.
  - Retired the `RESET_CODE_SENT_MESSAGE` exported string constant in favor of
    `loginCopy.{es,en}.resetCodeSentMessage` (already present in the dictionary since Run
    5/T019) — confirmed via repo-wide `grep -rn "RESET_CODE_SENT_MESSAGE"` that only this file and
    its own (now-rewritten) test imported it before removing the export. The confirmation copy's
    "always shown regardless of props" LOGIC (progress/review_005-login.md's Finding 2) is
    completely unchanged — only its text source changed.
  - Two pre-existing literals kept as documented exceptions, same precedent as `FormField.tsx`'s
    error-text color (Run 7) and `SignInForm.tsx`/`RequestPasswordResetForm.tsx`'s title/error-
    banner literals (Runs 9/10): the title's `fontSize: 22`/`fontWeight: "600"` (no heading token
    exists — this view has no mockup) and the general-error banner's `#dc2626` (no error/danger
    token exists in this feature's token module).
  - New imports: `loginCopy` (`@/domain/i18n/copy/login`), `useTranslation`
    (`@/features/i18n/LocaleContext`), `colors`/`space`/`typography` (`@/theme`), `PrimaryButton`
    (`@/features/ui/PrimaryButton`), `SecondaryButton` (`@/features/ui/SecondaryButton`).
- **`src/features/identity/ResetPasswordForm.test.tsx`** (modified): every one of the six
  pre-existing test cases is kept, unmodified in behavior/assertions, each now querying
  `loginCopy.es`'s real exported strings (`es.resetCodeLabel`, `es.newPasswordLabel`,
  `es.setNewPassword`, `es.resendCode`, `es.resendCodeWithSeconds` (templated via the same
  `.replace("{{seconds}}", ...)` call the component itself uses), `es.backToSignIn`,
  `es.resetCodeSentMessage`) instead of the old hardcoded English literals/the retired
  `RESET_CODE_SENT_MESSAGE` import — reading the dictionary directly (never a duplicated string) so
  this file can't silently drift from the real copy. Added one new test (T033's explicit ask, "a
  locale-switch rendering check"): rendering under a `<LocaleProvider>` with the same test-only
  `LocaleSwitchTrigger` pattern `RequestPasswordResetForm.test.tsx`/`SignInForm.test.tsx` already
  established, pressing it to `setLocale("en")`, and confirming every English equivalent
  (`en.emailLabel`, `en.resetCodeTitle`, `en.resetCodeSentMessage`, `en.resetCodeSubtitle`,
  `en.resetCodeLabel`, `en.newPasswordLabel`, `en.setNewPassword`, `en.resendCode`,
  `en.backToSignIn`) after first confirming Spanish is the pre-switch default (FR-012, via
  `queryByLabelText(es.emailLabel)` returning `null` post-switch, the same "confirm the old one is
  actually gone" check `RequestPasswordResetForm.test.tsx`'s own version uses).
- **`src/features/identity/LoginScreen.test.tsx`** and **`app/(auth)/login.test.tsx`** (modified —
  **not in T032/T033's own file list, but the exact foreseeable ripple Run 9 and Run 10 both
  already hit and documented for T028/T030, now landing on the LAST remaining hardcoded-English
  occurrences in both files** — see Deviations below): every `getByLabelText("Email"|"Reset
  code"|"New password")`/`getByRole("button", { name: "Set new password"|"Back to sign in" })`
  query that targets a currently-**ResetPasswordForm**-mounted field/control (i.e. only reachable
  after `LoginScreen`'s `mode` has already advanced to `"reset-with-code"`) was updated to read the
  same real `loginCopy.es` strings (via a new `const resetCopy = loginCopy.es;` in both files) that
  `ResetPasswordForm` now actually renders. With this run, **every** query in both files now targets
  translated copy — no hardcoded-English query remains in either file, since `SignInForm`,
  `RequestPasswordResetForm`, and `ResetPasswordForm` (the only three forms `LoginScreen` composes)
  are now all restyled and translated. Traced each affected test's exact mode sequence line-by-line
  before changing anything, the same discipline Runs 9/10 both flagged as easy to get subtly wrong
  — no misclassification this run, confirmed by both files' full suites passing on the first
  re-run after these edits.
- **`specs/006-visual-identity/tasks.md`** (modified): marked T032, T033 `[X]`.

### Tests written/run

1. **New/updated `ResetPasswordForm.test.tsx` suite** (7 tests, all passing):
   ```
   PASS src/features/identity/ResetPasswordForm.test.tsx
     ResetPasswordForm
       ✓ always shows the static 'we've sent a code' confirmation, regardless of props (47 ms)
       ✓ calls onSubmit with the parsed email/code/password on a successful submit (57 ms)
       ✓ pre-fills the email field from initialEmail but allows editing it (55 ms)
       ✓ renders an invalid/expired-code serverError inline on the code field (4 ms)
       ✓ disables the resend button during the cooldown after pressing it, and re-enables once it elapses (7 ms)
       ✓ calls onBack when 'Back to sign in' is pressed (3 ms)
       ✓ renders the English equivalents when the locale context is set to 'en' (8 ms)

   Test Suites: 1 passed, 1 total
   Tests:       7 passed, 7 total
   ```

2. **Type-check**: `npx tsc --noEmit` — clean, zero errors.

3. **Ripple fix verification** — `LoginScreen.test.tsx` (9/9 passing) and `app/(auth)/login.test.tsx`
   (4/4 passing), run individually:
   ```
   PASS src/features/identity/LoginScreen.test.tsx (9 tests)
   PASS app/(auth)/login.test.tsx (4 tests)
   ```
   confirm the `resetCopy`-based query updates in both affected test files resolve correctly
   against `ResetPasswordForm`'s new rendered copy, with zero change to any
   `SignInForm`/`RequestPasswordResetForm`-targeting query (those were already fixed in Runs 9/10
   and are left untouched this run).

4. **Full existing test suite** (`npx jest --no-coverage`, all 58 suites):
   ```
   Test Suites: 58 passed, 58 total
   Tests:       362 passed, 362 total
   ```
   Zero regressions to any pre-existing assertion's underlying behavior — every fixed query now
   targets the same functional element it always did, just under its new (Spanish-by-default)
   rendered name.

5. **`./init.sh` (full, no `--skip-*` flags)** — `RESULT: SUCCESS (10/10 stages passed)`:
   type-check clean, full test suite green (362/362), all three bundle exports (web/iOS/Android)
   clean. The two `WARN` stages (expo-doctor outdated-dependency advisory, native-dependency
   version drift on `expo-image-picker`/`react-native`/`react-native-safe-area-context`/
   `@types/react`/`typescript`) are the same pre-existing, unrelated drift every prior run in this
   feature has already documented — no dependency was added/changed this run.

6. **Manual smoke check (Level 3)**: same headless-browser limitation as Runs 7-10 (`chromium`/
   `google-chrome`/`chromium-browser` not found; no Playwright browser cache at
   `~/.cache/ms-playwright`). In lieu of a real screenshot: started `npx expo start --web` on a
   scratch port (8124) and `curl`'d `/login` — confirmed HTTP 200, a clean Metro web bundle export
   with no error, and only the same two categories of pre-existing warning already documented in
   this feature (a `require cycle` warning inside `@supabase/auth-js`'s own `webauthn.js`, unrelated
   to this run's files, and the same native-dependency-drift advisory). Stopped the dev server
   afterward and confirmed via `lsof`/`git status` no stray process or file was left behind. As with
   Runs 9/10, the real `/login` form only renders after client-side hydration (behind
   `useKycGate()`'s async Supabase session check), which a plain `curl` can't execute — so this
   run's confidence in the actual rendered look comes from: (a) `ResetPasswordForm.test.tsx`'s 7
   component-level tests, which assert the exact documented behavior (translated labels/roles,
   `PrimaryButton`/`SecondaryButton`'s disabled/busy contracts inherited unchanged, the
   `RESEND_COOLDOWN_SECONDS` timer, the locale switch) directly against rendered output; (b) the
   clean bundle export/dev-server-serve confirming no import/runtime-crash exists; (c) the full
   362-test regression suite. Not silently skipped — disclosed explicitly, same pattern as every
   prior run in this feature that hit the same sandbox limitation. A real, reachable,
   screen-visible confirmation of this file's restyle (and the whole composed `/login` screen) is
   `tasks.md`'s T037, once T034-T036 finish composing the full screen.

### Requirement traceability

| FR / AS | Test(s) |
|---|---|
| spec.md Assumptions ("forgot-password sub-views inherit the vocabulary, not a new mockup layout") | `ResetPasswordForm.tsx`'s use of `Field`/`PrimaryButton`/`SecondaryButton`/token-driven styling, identical vocabulary to `SignInForm.tsx`/`RequestPasswordResetForm.tsx`; no new content order (grep-verifiable — same field/button sequence as before this task). |
| `onSubmit`, `onResend`, `onBack`, `initialEmail`, `isSubmitting`, `isResending`, `serverError`, the `RESEND_COOLDOWN_SECONDS` timer, and the `serverError.field === "code"` inline-error wiring — preserved exactly | Every one of `ResetPasswordForm.test.tsx`'s 6 pre-existing tests, still passing, still exercising the identical prop/timer/error contract — only the query strings now target the new rendered copy. |
| FR-010 (every string routed through `useTranslation(loginCopy)`, zero hardcoded copy left in this file) | Every string in `ResetPasswordForm.tsx`'s JSX is now a `t(...)` call (grep-verifiable: no literal Spanish/English sentence remains in the file, aside from the passed-through, server-provided `serverError.message`/`errors.*.message` text, which was never static copy to translate) — confirmed by inspection while writing it; the "renders the English equivalents" test is the runtime proof this actually took effect. |
| spec.md US4 AS1 (every visible string looked up by key, no hardcoded copy) | `ResetPasswordForm.test.tsx`'s "renders the English equivalents when the locale context is set to 'en'" test. |
| FR-013 (real accessibility label + tap target on every interactive element) | `ResetPasswordForm.tsx`'s "Set new password" and "Resend code" now delegate to `PrimaryButton`'s/`SecondaryButton`'s own already-tested (T012/T013) ≥44×44/`accessibilityState.disabled` contract; "Back to sign in" keeps its pre-existing `minHeight: 44, minWidth: 44` tap target, unchanged. |

### Task IDs now `[X]`

- T032, T033

### Deviations / notes for sign-off

- **The same class of ripple Runs 9/10 flagged for T028/T030 recurred here for T032, on the same
  two files (`LoginScreen.test.tsx`, `app/(auth)/login.test.tsx`), for the same unavoidable
  reason**: translating `ResetPasswordForm`'s rendered copy to Spanish-by-default (FR-012) broke
  every remaining query in those two files that targeted its old hardcoded English text
  (`"Email"`/`"Reset code"`/`"New password"`/`"Set new password"`/`"Back to sign in"`, while
  `mode === "reset-with-code"` specifically). Per the same precedent Runs 9/10 established, I fixed
  the minimum necessary ripple: added a `resetCopy = loginCopy.es` alias in both files and
  retargeted only the queries that fire while `mode === "reset-with-code"`, tracing each test's
  exact mode sequence line-by-line before changing anything. No misclassification — the full suite
  passed on the first re-run after these edits. **With this run, both `LoginScreen.test.tsx` and
  `app/(auth)/login.test.tsx` are now fully migrated off hardcoded-English queries** — every query
  in both files reads from `loginCopy.es` (via `signInCopy`/`requestResetCopy`/`resetCopy`, all
  currently aliasing the same `loginCopy.es` object, kept as three separate named `const`s per file
  purely for readability/traceability to which form each query targets, matching Runs 9/10's own
  precedent of not collapsing them into one shared alias).
- **Retired the `RESET_CODE_SENT_MESSAGE` exported constant** rather than keeping it as a static
  English fallback — confirmed via `grep -rn "RESET_CODE_SENT_MESSAGE"` across `src/`/`app/` that
  only this file and its own test imported it. The confirmation copy's "always shown regardless of
  props" logic (progress/review_005-login.md's Finding 2) is completely unchanged — only its text
  now comes from `loginCopy.{es,en}.resetCodeSentMessage` rather than a locale-blind hardcoded
  string. Flagged explicitly since removing an exported symbol is a small API-surface change, even
  though nothing outside this file's own test depended on it (same disclosed precedent as Run 10's
  retirement of `REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE`).
- **Chose `SecondaryButton` for "Resend code" (not a plain `Pressable`), and kept "Back to sign in"
  as a plain restyled `Pressable` (not `SecondaryButton`)** — this was an explicit either/or choice
  left to task-implementer's judgment in the task brief itself ("a restyled resend
  `Pressable`/`SecondaryButton`"). Reasoning: "Resend code" was already a bordered, button-shaped
  secondary action before this restyle (background fill, 1px border, centered bold label) — a
  direct, non-inventive fit for `SecondaryButton`'s existing geometry. "Back to sign in" was always
  a bare, unbordered link — the same judgment `RequestPasswordResetForm.tsx` (T030) already applied
  to its own identical control. Flagged for sign-off in case the human prefers a different split
  (e.g. both as `SecondaryButton`, or both as plain links) — this is a small, easily-reverted style
  choice, not a structural one.
- **Small, disclosed accessibility-state delta on "Resend code"**: the pre-restyle markup set
  `accessibilityState={{ disabled: !canResend, busy: isResending }}`; `SecondaryButton` (T013, an
  earlier phase of this same feature, unmodified by this task) only exposes `disabled` in its
  `accessibilityState`, not `busy`. Functionally this is a no-op for VoiceOver/TalkBack's actual
  announcement of *interactivity* — `isResending === true` always implies `canResend === false`
  (via `canResend`'s existing, unchanged derivation `!isResending && !isSubmitting &&
  secondsRemaining === 0`), so `disabled` alone already correctly reflects "not currently pressable"
  at every moment `busy` would have been `true`. The only information lost is the more specific
  screen-reader hint "this is busy/in-progress" vs. the generic "this is disabled" during the
  in-flight `isResending` window specifically (as opposed to the cooldown-countdown window, which
  was always `disabled`-only even before this restyle). No test asserted `accessibilityState.busy`
  on this control before this run (confirmed by reading `ResetPasswordForm.test.tsx`'s pre-restyle
  version directly), so this is not a regression against any asserted behavior — flagged for
  sign-off as a small, disclosed fidelity loss from reusing the shared primitive rather than a
  bespoke `Pressable`, consistent with this feature's overall goal of consolidating onto shared
  primitives (FR-001/FR-003) over one-off styling.
- No other deviations from the task brief. `LoginScreen.tsx`'s own composition (T034 — wrapping the
  per-mode JSX in `LoginScreenChrome` and adding the `BrandMark`/title/tagline block) remains
  untouched and out of this batch's scope, as instructed.

Next: T034 (`LoginScreen.tsx` composition) is the next task in Phase 3's login restyle sequence,
per `tasks.md`'s stated dependency ordering. Since all three composed forms (`SignInForm`,
`RequestPasswordResetForm`, `ResetPasswordForm`) are now fully restyled and translated, T034 and its
own test extension (T035) should be a pure JSX-wrapping change with no further translation-driven
ripple expected in `LoginScreen.test.tsx`/`app/(auth)/login.test.tsx` beyond what T034/T035
themselves introduce (e.g. new queries for `BrandMark`/title/tagline).

---

## Run 12 (2026-08-05) — T034, T035, T036, T037: `LoginScreen.tsx` composition + manual smoke check (User Story 2, login restyle)

### Scope

The final batch of Phase 3 (User Story 2, login restyle): wraps `LoginScreen.tsx`'s existing
per-mode JSX in `LoginScreenChrome` (T025/T026) and adds the brand block (`BrandMark` + `display.xl`
title + `body.tagline`) above `<SignInForm>` in the `"sign-in"` branch only (T034); extends
`LoginScreen.test.tsx` with the new mode-gated rendering assertions while confirming every
pre-existing assertion — especially the FR-006 no-navigation guard and the reset-with-code
never-touches-`signIn` guard — still passes (T035); confirms `app/(auth)/login.tsx` and its test
need zero change (T036); and records the Level 3 manual smoke check, with an honest disclosure of
this environment's browser/simulator limitation and the strongest available substitute evidence
(T037).

**Before touching anything**: re-read `LoginScreen.tsx`'s own file-level FR-006 comment (documenting
exactly why this screen never calls `useRouter()` on success) and `LoginScreen.test.tsx` end to end,
confirmed unmodified, exactly as they existed after Run 11 — see "Baseline" below.

### Baseline (before any edit this run)

Ran the pre-existing `LoginScreen.test.tsx` and `app/(auth)/login.test.tsx` suites first, before
making any change, per the task brief's explicit instruction:

```
PASS src/features/identity/LoginScreen.test.tsx (9 tests)
PASS app/(auth)/login.test.tsx (4 tests)
```

All 13 pre-existing assertions green — confirmed the FR-006 regression guard
("...navigates nowhere", "...never calls the shared signIn prop during the reset-with-code
submission") and the full mode-sequence walk were all passing before any T034 edit.

### Files changed

- `src/features/identity/LoginScreen.tsx` (T034) — **JSX-only change, zero touch to any function
  body**, exactly as instructed:
  - Added imports: `loginCopy` (`@/domain/i18n/copy/login`), `useTranslation`
    (`@/features/i18n/LocaleContext`), `BrandMark` (`@/features/ui/BrandMark`), `colors`/`space`/
    `typography` (`@/theme`), `LoginScreenChrome` (`./LoginScreenChrome`).
  - Added one hook call, `const t = useTranslation(loginCopy);`, alongside the existing `useState`
    calls at the top of the component body — a hook addition, not a change to any handler
    (`handleSubmit`/`handleForgotPassword`/`handleRequestReset`/`handleResetSubmit`/
    `handleBackToSignIn`/`resetFlowState` are byte-for-byte identical to Run 11's version, confirmed
    by diffing only the `return` statements below `t`'s declaration).
  - Wrapped all four existing `return` blocks (`signInSucceeded`, `mode === "request-reset"`,
    `mode === "reset-with-code"`, and the default `"sign-in"` branch) in `<LoginScreenChrome>...
    </LoginScreenChrome>` — each mode's own inner `<View style={styles.screen}>` and its child
    form component are otherwise unchanged.
  - In the `"sign-in"` branch only, added a `styles.brandBlock` wrapper directly above
    `<SignInForm>` containing `<BrandMark size={112} />`, a `styles.brandTitle` `<Text>` reading
    `t("brandTitle")` ("Draw a Card" in both locales — brief §4 items 1-3 are Spanish-first but this
    specific string happens to be identical in both dictionaries), and a `styles.tagline` `<Text>`
    reading `t("tagline")` ("Tu plataforma de cartas coleccionables" / "Your collectible card
    platform"). Not rendered in any other branch.
  - The "Signing you in…" view's text now reads `{t("signingIn")}` instead of the hardcoded English
    literal `"Signing you in…"` — reusing the **existing** `signingIn` key `loginCopy` already
    defines (`es: "Entrando…"`, `en: "Signing in…"`), the same key `SignInForm.tsx`'s
    `PrimaryButton` already uses for its own busy-state label, rather than adding a new,
    near-duplicate key. See "Deviations" below for why this differs from Run 5's own forward-note
    suggestion.
  - Style changes: `styles.screen`'s `padding: 24` became `padding: space.xxl` (24 — value
    unchanged, now token-sourced per FR-001/SC-001); `styles.signingInText`'s color changed from the
    raw pre-existing literal `"#374151"` to `colors.text.secondary` (this file is now genuinely
    restyled by this task, so the raw-hex exemption that applied while T034 hadn't landed yet no
    longer applies — SC-001 requires zero raw hex in a screen this feature touches); added
    `styles.brandBlock`/`brandTitle`/`tagline`, all token-sourced (`space.sm`/`space.xxl`,
    `typography.display.xl`, `typography.body.tagline`, `colors.text.primary`).
- `src/features/identity/LoginScreen.test.tsx` (T035):
  - Updated the one existing assertion that queried the literal English string `"Signing you
    in…"` (`getByRole("alert", { name: "Signing you in…" })`) to query `signInCopy.signingIn`
    instead — the underlying regression guard (an `accessibilityRole="alert"` announcement on this
    exact transition, with `testID="login-signing-in"`) is unchanged; only the literal string
    changed, the same kind of ripple Runs 9/10/11 (T028/T030/T032) already applied throughout this
    file for every other translated control.
  - Added two new tests:
    1. `"renders the brand block (BrandMark, title, tagline) on the sign-in view, and nowhere in
       the forgot-password sub-flow"` — asserts `getByRole("image", { name: "Draw a Card" })`,
       `getByText(signInCopy.brandTitle)`, `getByText(signInCopy.tagline)` all present on the
       initial `"sign-in"` render; walks to `"request-reset"` then `"reset-with-code"` and asserts
       `queryByRole("image", ...)`/`queryByText(signInCopy.tagline)` are both `null` at each step.
    2. `"does not render the brand block on the 'Signing you in…' transition"` — submits a
       successful sign-in, waits for `testID="login-signing-in"`, and asserts the same two queries
       are `null`.
  - Every pre-existing test (all 9 from the baseline run) kept passing with no other edit — see
    "Tests run" below.
- `app/(auth)/login.tsx` (T036) — **zero change**. Confirmed by inspection: it passes `signIn`/
  `requestPasswordReset`/`createPasswordRecoverySession` into `<LoginScreen>`, exactly the props
  `LoginScreenProps` still declares (T034 touched no prop, no type). No edit needed or made.
- `app/(auth)/login.test.tsx` (T036) — **zero change**. Confirmed still green, unmodified — see
  "Tests run" below.
- `specs/006-visual-identity/tasks.md` — T034, T035, T036, T037 marked `[X]`.
- `progress/impl_006-visual-identity.md` — this section (appended).

### Tests run

1. **Targeted re-run, `LoginScreen.test.tsx` + `app/(auth)/login.test.tsx`** (after all edits):
   ```
   PASS src/features/identity/LoginScreen.test.tsx
     ✓ replaces SignInForm with the neutral 'Signing you in…' view on a successful sign-in and navigates nowhere
     ✓ exposes the 'Signing you in…' view as an alert so assistive tech announces it
     ✓ keeps SignInForm visible with the serverError rendered on a credentials rejection
     ✓ renders a network-failure error distinctly from a credentials error
     ✓ does not create a recovery session until 'Forgot password?' is pressed, and creates only one for repeated presses
     ✓ walks the full sign-in -> request-reset -> reset-with-code -> sign-in mode sequence
     ✓ never calls the shared signIn prop during the reset-with-code submission
     ✓ stays on 'request-reset' and shows the error inline when requestPasswordReset resolves with a network-level error
     ✓ returns to plain sign-in with no residual reset-flow state when 'Back to sign in' is pressed mid-flow
     ✓ renders the brand block (BrandMark, title, tagline) on the sign-in view, and nowhere in the forgot-password sub-flow
     ✓ does not render the brand block on the 'Signing you in…' transition

   Test Suites: 1 passed, 1 total
   Tests:       11 passed, 11 total

   PASS app/(auth)/login.test.tsx
     ✓ calls the real signInWithPassword with the exact submitted email/password and never navigates
     ✓ surfaces an SDK-rejected submission's mapped error inline
     ✓ walks the full sign-in -> request-reset -> reset-with-code -> sign-in sequence via the real DI chain
     ✓ never touches the shared singleton's signInWithPassword mock during the reset-with-code step

   Test Suites: 1 passed, 1 total
   Tests:       4 passed, 4 total
   ```
   Every one of the 9 pre-existing `LoginScreen.test.tsx` assertions and all 4 `app/(auth)/
   login.test.tsx` assertions — including both FR-006 no-navigation guards and both
   reset-with-code-never-touches-`signIn` guards — passed unmodified in behavior (only the one
   literal-string ripple noted above). 2 new tests added and passing.

2. **Type-check**: `npx tsc --noEmit` — clean, no errors.

3. **Full existing test suite** (regression check):
   ```
   Test Suites: 58 passed, 58 total
   Tests:       364 passed, 364 total
   ```

4. **`./init.sh` (full, no skip flags)**:
   ```
   ▶ 1/8 Checking prerequisites          ✅ OK — node v20.20.2, npm v10.8.2
   ▶ 2/8 Environment file                ✅ OK
   ▶ 3/8 Installing dependencies         ✅ OK
   ▶ 4/8 Type-checking                   ✅ OK — no type errors
   ▶ 5/8 Expo config/dependency health   ⚠️  WARN — same pre-existing "outdated dependencies" advisory
   ▶ 6/8 Native dependency alignment     ⚠️  WARN — same pre-existing drift (expo-image-picker,
                                            react-native, react-native-safe-area-context,
                                            @types/react, typescript) — unrelated to this run's files
   ▶ 7/8 Running test suite              ✅ OK — all tests passed
   ▶ 8/8 Bundle export smoke checks      ✅ OK — web/iOS/Android all exported cleanly

   RESULT: SUCCESS (10/10 stages passed)
   ```
   Both Stage 5/6 warnings are identical, pre-existing, and unrelated to this run's files (same
   five package names as every prior run's report).

### T037 — Manual smoke check: honest disclosure + substitute evidence

**No real browser or simulator tool was available in this environment for this run** — the tool
list available to me this session was `Read`/`Write`/`Edit`/`Bash` only; no Playwright/Claude
Browser tool and no iOS/Android simulator were reachable. Rather than claim a visual check I did
not perform, here is exactly what I *did* run, in place of it, as the strongest available
substitute:

1. **Booted the real Metro dev server** (`npx expo start --web`, not just `expo export`) and
   confirmed it bundled cleanly with no error — only a pre-existing, unrelated `@supabase/auth-js`
   require-cycle warning (present before this batch, not introduced by it):
   ```
   Web Bundled 1200ms node_modules/expo-router/entry.js (888 modules)
   ```
2. **Fetched `/login`'s server-rendered HTML** (`curl http://localhost:8081/login`) — confirmed it
   returns the expected loading placeholder (`testID="kyc-gate-loading"`), which is `app/_layout.tsx`'s
   pre-existing, unmodified SSR behavior (the async KYC/session check is unresolved at
   request time on the server, unrelated to this batch — the real, hydrated content only exists
   client-side after the browser runs the JS bundle, which a `curl`-only environment cannot
   execute). Flagging this limitation explicitly rather than mistaking the SSR shell for the real
   rendered screen.
3. **Fetched the actual client bundle `/login` loads** (`entry.bundle?platform=web&dev=true&...`,
   read directly from the `<script src="...">` tag in step 2's HTML — 6.2MB) and grepped it for the
   literal strings the browser would render on hydration:
   ```
   grep -c "Draw a Card"                              -> 5
   grep -c "Tu plataforma de cartas coleccionables"    -> 1
   grep -c "Entrar"                                    -> 3
   grep -c "Olvid"                                     -> 5
   grep -c "PlayfairDisplay_700Bold"                   -> 13
   grep -c "login-signing-in"                          -> 1
   grep -c "Entrando"                                  -> 1
   ```
   Confirms the exact compiled code a real browser would execute contains the brand title, tagline,
   "Entrar"/"Olvidé…" copy, the bundled Playfair Display font-family reference, and the
   "Signing you in…" transition's testID/translated text — i.e., every piece this task added is
   genuinely present in what ships to the browser, even though I could not screenshot the
   post-hydration pixels.
4. **`./init.sh`'s Stage 8** (see above) independently confirms `expo export --platform ios` and
   `--platform android` also bundle cleanly with this same code — the strongest signal available
   for native-platform "does it even boot" short of an actual simulator.
5. Shut the dev server down cleanly afterward (confirmed port 8081 free).

**What this does NOT confirm, and is disclosed as a real gap, not silently skipped**: the actual
pixel-level rendering (gradient wash vs. card-over-blooms at the 768px+ boundary, the
bordered-vs-borderless `Field` switch, the Playfair Display glyph actually rendering as a serif
rather than a fallback) was **not visually verified** this run — no browser/simulator was available
to do so. This mirrors the same disclosed limitation noted in this feature's own `plan.md`/prior
runs' pattern of honest reporting; per the task brief's own instruction, I am recording this
explicitly rather than claiming a check I did not perform. Sign-off note for the human: a real
`npm run web` + resize + locale-toggle + iOS/Android simulator pass (steps 1-10 of `plan.md`'s
Quickstart Validation section) is still owed before this feature's Phase 5 (`T054`) closes it out,
if this environment's tooling doesn't change before then.

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-006 (zero change to no-`useRouter()`-on-success; regression-critical) | `LoginScreen.test.tsx`'s "replaces SignInForm with the neutral 'Signing you in…' view... and navigates nowhere" and `app/(auth)/login.test.tsx`'s "...never navigates" — both pre-existing, confirmed still passing unmodified in behavior. |
| FR-005 (platform split via `.web.tsx`, not inline `Platform.OS`) | `LoginScreenChrome`/`LoginScreenChrome.web.tsx` (already tested in Run 8) are now genuinely wired into every `LoginScreen.tsx` branch — no `Platform.OS` branch added in this file. |
| FR-010 (no hardcoded copy in the screen; everything through `useTranslation`) | The brand block and the "Signing you in…" text are the last two strings in this file that were hardcoded; both now resolve via `t(...)`. Asserted by `LoginScreen.test.tsx`'s two new tests plus the updated `signingIn` assertion. |
| FR-001/SC-001 (no raw hex/magic literal in a touched screen) | `styles.signingInText`'s color is no longer `"#374151"` — now `colors.text.secondary`; `styles.screen`'s `padding` is now `space.xxl` instead of the literal `24`. |
| spec.md US2 AS1/AS2 (brand block content order, both platforms) | `LoginScreen.test.tsx`'s new "renders the brand block... on the sign-in view" test (role/text queries, not platform-specific — the platform split itself is `LoginScreenChrome`'s, already tested separately). |
| spec.md US2 AS4 (successful sign-in → neutral "Signing you in…" state, no brand block, no navigation) | `LoginScreen.test.tsx`'s new "does not render the brand block on the 'Signing you in…' transition" test, plus the pre-existing FR-006 guard above. |
| spec.md US2 AS5 (forgot-password sub-flow stays local view-state, no route change) | Untouched — `handleForgotPassword`/`handleBackToSignIn` are byte-for-byte unchanged; the pre-existing mode-sequence and "Back to sign in" tests confirm this still holds. |

### Task IDs now `[X]`

- T034, T035, T036, T037

### Deviations / notes for sign-off

- **Reused the existing `signingIn` key instead of adding a new `signingInTransition`-shaped key**,
  which Run 5's own forward-looking note (see that run's "Deviations" section) had suggested T034
  would need to add. On inspection, `loginCopy`'s existing `signingIn` key (`es: "Entrando…"`,
  `en: "Signing in…"`) already carries the right meaning for this exact moment (SignInForm's own
  `PrimaryButton` already uses it for "the sign-in action is in flight") — introducing a second,
  near-duplicate key for the same underlying state felt like the kind of un-owned duplication
  `docs/conventions.md`'s "extreme consistency" principle argues against, for zero real benefit
  (both moments *are* "signing in," just rendered in two different places). Flagged explicitly since
  it diverges from a prior run's own forward note — if the human prefers a distinct, longer phrase
  specifically for this full-screen transition (e.g. restoring something closer to the original
  "Signing you in…" wording, which is slightly different from "Signing in…"), that's a one-line
  addition to `login.ts` plus a one-line swap in `LoginScreen.tsx`, not a structural change.
- **`PASSWORD_RESET_SUCCESS_MESSAGE` (this file's exported constant, rendered via `SignInForm`'s
  `confirmationMessage` prop) remains a hardcoded English literal, untouched by this batch** — it
  was out of both `tasks.md`'s T034 description and my kickoff instructions' explicit scope (neither
  mentions it), and touching it would mean editing `handleResetSubmit`'s body (which sets
  `setSignInConfirmationMessage(PASSWORD_RESET_SUCCESS_MESSAGE)`), directly contradicting the "zero
  change to function bodies" constraint this task was given. Flagging this as a **real, disclosed
  FR-010 gap** for a future task/sign-off decision: this string is genuinely user-facing copy that
  bypasses `loginCopy` today. Fixing it correctly would need a new `login.ts` key plus changing this
  one line inside `handleResetSubmit` — a small, but real, function-body edit outside this batch's
  explicit mandate, so it was left as-is rather than taking that call unilaterally.
- **T037's manual smoke check is a disclosed partial substitute, not a full Level 3 pass** — see the
  dedicated section above. No browser/simulator tool was reachable this run; the dev-server-boot +
  compiled-bundle-content check is the strongest automatable substitute available, but does not
  replace an actual visual/pixel confirmation. This is the same environment limitation this
  feature's kickoff briefs have referenced in prior runs, disclosed again here rather than silently
  waved through.
- No other deviations from the task brief. Every function body in `LoginScreen.tsx`
  (`handleSubmit`/`handleForgotPassword`/`handleRequestReset`/`handleResetSubmit`/
  `handleBackToSignIn`/`resetFlowState`) is byte-for-byte identical to Run 11's version — confirmed
  by inspection, not just by the tests passing.

Next: Phase 3 (User Story 2, login restyle) is now fully complete — every task T023–T037 is `[X]`.
Per `tasks.md`'s Implementation Strategy, the next phase is Phase 4 (User Story 3, scan visual
shell, T038+), independently buildable against Phase 2's foundation without depending on Phase 3.

---

## Run 13 (2026-08-05) — T038, T039, T040, T041, T042: five disjoint scan visual-shell presentational pieces (User Story 3, scan restyle)

**Scope**: `tasks.md`'s Phase 4, the five independent, parallel-safe presentational files
(`Viewfinder`, `ScanSearchField`, `UploadDropzone`, `EmptyResultsPanel`, `RecentScansList`) — the
`ScanShellScreen.tsx`/`ScanShellScreen.web.tsx` composition, `app/scan.tsx` rewiring, and
`ScanPlaceholderScreen` retirement (T043–T048) are explicitly out of this batch's scope, per the
kickoff brief.

### Files created

- `src/features/scanner/Viewfinder.tsx` + `.test.tsx` (T038) — `viewfinder.bg` fill,
  `radius.panel`, `aspectRatio: 4/3`, a faint 4×4 grid drawn as 3 absolute-positioned 1px
  `viewfinder.grid` lines in each direction (`GRID_DIVIDER_FRACTIONS = [0.25, 0.5, 0.75]`), four
  lime L-shaped corner brackets (`BRACKET_INSET = 16`, `BRACKET_LENGTH = 36`,
  `BRACKET_THICKNESS = 3`, `brand.primary`, 8 absolutely-positioned bar `View`s, 2 per corner), a
  centered `Ionicons name="camera-outline"` glyph above `viewfinderHint` copy
  (`useTranslation(scanCopy)`, colored `viewfinder.hintText`), and a circular gear chip
  (`Ionicons name="settings-outline"`, `viewfinder.grid`-tinted background) hidden from the
  accessibility tree via `accessibilityElementsHidden` +
  `importantForAccessibility="no-hide-descendants"` (spec.md US3 AS4 — it does nothing, so it's
  removed from the a11y tree entirely rather than given a role it can't back up). Zero camera-
  module import, confirmed by both the source-inspection test and a manual `grep` pass (below).
- `src/features/scanner/ScanSearchField.tsx` + `.test.tsx` (T039) — `bg.surface` pill row,
  `radius.row`, `CONTROL_HEIGHT`, an **uncontrolled** `TextInput` (no `value`/`onChangeText` —
  documented in a code comment that wiring it to real search logic is a future scanner feature's
  job, not this restyle's) with placeholder `searchPlaceholder` (`useTranslation(scanCopy)`) and
  `placeholderTextColor={colors.text.placeholder}`, plus a trailing `Ionicons
  name="search-outline"` glyph.
- `src/features/scanner/UploadDropzone.tsx` + `.test.tsx` (T040) — 1px dashed `border.dashed`
  panel, `radius.row`, a leading `Ionicons name="cloud-upload-outline"` glyph, centered
  `uploadDropzone` copy (`useTranslation(scanCopy)`). No `accessibilityRole` — static
  informational content, confirmed non-actionable by its test (`getByRole("button")` throws).
- `src/features/scanner/EmptyResultsPanel.tsx` + `.test.tsx` (T041) — 1px dashed `border.dashed`,
  `radius.panel`, tall (`minHeight: 280`), a centered `MaterialCommunityIcons
  name="cards-outline"` playing-card glyph, `emptyResultsLine1` (`typography.body.tagline`,
  which already resolves to `text.secondary`) and `emptyResultsLine2` (`typography.body.legal`
  overridden to `text.placeholder`, smaller per its 12px size vs. `emptyResultsLine1`'s 15px) —
  both via `useTranslation(scanCopy)`. Not itself a `.web.tsx` file (no platform branch of its
  own) — it's simply unused by the mobile composition once `ScanShellScreen.tsx`/`.web.tsx` land
  in a later task; the file-level comment says so explicitly.
- `src/features/scanner/RecentScansList.tsx` + `.test.tsx` (T042) — `label.section`
  "ESCANEOS RECIENTES" heading (`recentScansHeading` via `useTranslation(scanCopy)`, natural-case
  in the dictionary since `label.section`'s `textTransform: "uppercase"` renders it), then a
  `PLACEHOLDER_ROWS` array of 3 hand-typed rows (`bg.surface`, `radius.row`, `shadowSurface`,
  `padding: space.lg` (16)) each rendering a 44px rounded thumbnail (colored via existing theme
  tokens — `colors.brand.primary`/`colors.accent.priceGreen`/`colors.text.link`, cycled per row,
  never a raw hex literal, since `src/theme` has no dedicated "swatch" token category), name
  (`text.primary`, 600) over meta (`text.secondary`, 12), and a right-aligned price
  (`accent.priceGreen`, 600). A prominent `*** PLACEHOLDER-UNTIL-THE-REAL-SCANNER-FEATURE-SHIPS
  ***` banner comment sits directly above the file's imports and again directly above
  `PLACEHOLDER_ROWS` itself (FR-008).

### FR-008 nuance found and resolved (flagged, not unilaterally decided past what the spec itself already resolves)

The kickoff brief's own T042 instruction said "this file must have zero `src/domain` import and
zero fetch call anywhere," but the same instruction also requires the "ESCANEOS RECIENTES" heading
go through `useTranslation(scanCopy)` — and `scanCopy` is itself imported from
`@/domain/i18n/copy/scan`, i.e. `src/domain`. Taken completely literally, "zero `src/domain`
import" and "route copy through `useTranslation(scanCopy)`" directly contradict each other in the
same instruction.

Resolved by going back to `spec.md`'s own FR-008 text, which is more precise than the kickoff
brief's shorthand: *"no `src/domain` **fetch**, no API call, no persistence"* — not a blanket ban
on every `src/domain` import. Every one of this batch's other four files also imports `scanCopy`
from `@/domain/i18n/copy/scan` for the exact same reason (FR-010 forbids hardcoded copy), and
nothing in `spec.md`/`plan.md` suggests `RecentScansList` should be uniquely exempt from FR-010's
i18n mandate. So: `RecentScansList.tsx` imports `@/domain/i18n/copy/scan` (the static translation
dictionary, required by FR-010) but nothing else from `src/domain` — no `@/domain/api-client`, no
`fetch(...)` call anywhere. `RecentScansList.test.tsx`'s source-inspection test asserts this
precisely: every `@/domain` import line must match `@/domain/i18n/`, no import line may match
`api-client`, and no `fetch(` call appears anywhere in the file. This is a **narrower, more
accurate reading of FR-008 as actually written in `spec.md`**, not a relaxation of it — flagging
here per the "stop and report rather than improvise" instruction, since it's a real discrepancy
between the kickoff brief's shorthand and the spec text it was summarizing, even though the
resolution required no design judgment call beyond re-reading the already-approved spec.

### Icon glyph choices (not specified verbatim by the design brief, chosen from the existing `@expo/vector-icons` dependency)

`docs/design-brief-visual-identity.md` §5 names each glyph only descriptively ("camera glyph,"
"magnifier glyph," "upload glyph," "settings-gear chip," "playing-card glyph"), not by exact
Ionicons/MaterialCommunityIcons name. Verified each chosen name exists in the installed
`@expo/vector-icons` glyph maps before using it (`node` one-off checks against
`node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/*.json`, since
requiring the package directly under Node's ESM loader failed — the glyph-map JSON files were
read/parsed directly instead):

- Camera → `Ionicons name="camera-outline"`
- Magnifier → `Ionicons name="search-outline"`
- Upload → `Ionicons name="cloud-upload-outline"`
- Settings gear → `Ionicons name="settings-outline"`
- Playing card → `MaterialCommunityIcons name="cards-outline"` (also confirmed
  `cards-playing-outline` exists as a closer literal match if a future reviewer prefers it — not
  used here since `cards-outline` already reads clearly as a stack of cards at 40px)

No new icon dependency — `@expo/vector-icons` is already a transitive `expo` dependency, already
used by `app/(app)/_layout.tsx`'s tab icons, per `plan.md`'s Technical Context.

### Tests written/run and results

```
$ npx jest src/features/scanner --silent
PASS src/features/scanner/RecentScansList.test.tsx
PASS src/features/scanner/Viewfinder.test.tsx
PASS src/features/scanner/ScanSearchField.test.tsx
PASS src/features/scanner/EmptyResultsPanel.test.tsx
PASS src/features/scanner/UploadDropzone.test.tsx
PASS src/features/scanner/ScanEntryCard.test.tsx
PASS src/features/scanner/ScanPlaceholderScreen.test.tsx

Test Suites: 7 passed, 7 total
Tests:       20 passed, 20 total
```

Every new test file (5 files × 3–4 tests each) covers: (1) the source-inspection camera-import
guard (mirroring `ScanPlaceholderScreen.test.tsx`'s exact technique — read the file from disk,
filter to `import`/`require` lines, assert none matches `expo-camera`/`expo-image-picker`/
`camera`), (2) the component renders its documented Spanish copy by default (no `<LocaleProvider>`
needed — `useLocale()` falls back to `DEFAULT_LOCALE`, matching every other bare-render test in
this repo), and (3) the documented accessibility behavior (no bare `accessibilityRole="button"` on
an inert control, or — for `ScanSearchField` — that typing doesn't throw despite being otherwise
inert). `RecentScansList.test.tsx` additionally covers the FR-008 src/domain-import-scope
assertion described above.

### Requirement traceability

| FR | Test |
|---|---|
| FR-007 (visual shell, zero camera import) | `Viewfinder.test.tsx` / `ScanSearchField.test.tsx` / `UploadDropzone.test.tsx` / `EmptyResultsPanel.test.tsx` / `RecentScansList.test.tsx` — "does not import any camera-related module" (all five); `Viewfinder.test.tsx`'s "renders the viewfinder hint text"; `ScanSearchField.test.tsx`'s "renders the search placeholder..."; `UploadDropzone.test.tsx`'s "renders the upload dropzone copy"; `EmptyResultsPanel.test.tsx`'s "renders both lines of empty-results copy" |
| FR-008 (recent-scans rows are static local placeholder content, no API call) | `RecentScansList.test.tsx`'s "imports no data-fetching src/domain module and calls no fetch" and "renders the section heading and placeholder rows" |
| FR-010 (no hardcoded copy; i18n lookup) | All five test files render through `useTranslation(scanCopy)` and assert against `scanCopy.es.*` literals directly, never a duplicated hardcoded string |
| FR-013 (accessible label / inert controls not exposed as actionable) | `Viewfinder.test.tsx`'s "does not expose the gear chip... as a button role"; `UploadDropzone.test.tsx`'s "does not expose a button role"; `EmptyResultsPanel.test.tsx`'s "does not expose a button role"; `ScanSearchField.test.tsx`'s "renders the search placeholder as an accessible label" |

### `./init.sh` (full, no `--skip-*` flags)

```
▶ 4/8 Type-checking: ✅ [OK] Type-check: no type errors
▶ 7/8 Running test suite: ✅ [OK] Tests: all tests passed
▶ 8/8 Bundle export smoke checks: ✅ web / ✅ ios / ✅ android

RESULT: SUCCESS (10/10 stages passed)
```

Two pre-existing, unrelated `WARN`s (expo-doctor outdated-dependency advice, native-dependency
version drift for `expo-image-picker`/`react-native`/`react-native-safe-area-context`/
`@types/react`/`typescript`) are carried over from before this batch — not introduced by it, not
touched by any file in this batch.

### Camera-import guard — explicit manual grep, as instructed

```
$ grep -rn "expo-camera\|expo-image-picker" src/features/scanner/
```

Every match returned is inside a comment or a test's own guard-assertion string (e.g.
`Viewfinder.test.tsx`'s `/expo-camera/.test(line)`, `UploadDropzone.tsx`'s comment "no
expo-image-picker call") — **zero matches inside an actual `import`/`require` statement** across
every file in `src/features/scanner/`, confirmed by manual inspection of the full grep output.

### Manual smoke check — deferred, disclosed (not skipped silently)

None of these five components are rendered from any route yet — `ScanShellScreen.tsx`/
`ScanShellScreen.web.tsx` (T043/T044) are what compose them into `/scan`'s actual content, and
`app/scan.tsx` still renders the retired-pending `ScanPlaceholderScreen` until T047. `npm run web`
would show the *old* placeholder screen unchanged by this batch, so a Level 3 visual smoke check
would exercise nothing this batch touched. This mirrors `tasks.md`'s own phase structure — it
places the composition tasks (T043–T045) and the actual manual smoke check (T049) **after**
T038–T042, in the same phase but later tasks — so this is not a deviation, it's the task
breakdown's own sequencing. The real Level 3 smoke check for these five components' rendered
appearance happens once T043/T044 compose them and T049 runs, in a later batch.

### Task status

`T038`, `T039`, `T040`, `T041`, `T042` all marked `[X]` in `specs/006-visual-identity/tasks.md`.

### Deviations needing sign-off

- The FR-008/T042 `src/domain`-import nuance described above (resolved by re-reading `spec.md`'s
  own FR-008 text rather than the kickoff brief's shorter paraphrase — no design judgment call
  made beyond that).
- No other deviations. All five files draw exclusively from `src/theme` (FR-001), route every
  string through `useTranslation(scanCopy)` (FR-010), and introduce zero new npm dependency
  (`@expo/vector-icons` was already installed).

Next: `T043`–`T048` (ScanShellScreen mobile/web composition, `ScanPlaceholderScreen` retirement,
`app/scan.tsx` rewiring) — not started this run, per the kickoff brief's explicit scope boundary.
Not started this run.

---

## Run 14 (2026-08-05) — T043, T044: `ScanShellScreen.tsx` (mobile) + `ScanShellScreen.web.tsx` (web) composition (User Story 3, scan restyle)

### Task

`T043` and `T044` from `specs/006-visual-identity/tasks.md` — compose the five already-approved
presentational pieces (`Viewfinder`, `ScanSearchField`, `UploadDropzone`, `EmptyResultsPanel`,
`RecentScansList`, Run 13) plus `PrimaryButton`/`StatusPill` (`src/features/ui/`) into `/scan`'s
real mobile and web screens, per `docs/design-brief-visual-identity.md` §5.1/§5.2.

### Files changed

- **`src/features/scanner/ScanShellScreen.tsx`** (new, mobile/default) — single-column screen
  inside a `ScrollView` (same "avoid clipping on a short viewport" fix `HomeScreen.tsx` already
  established, `contentContainerStyle={{ flexGrow: 1 }}`), `space.xl` (20px) padding, `space.lg`
  gap between children. Composes, in order: `display.lg` title (`t("titleMobile")` → "Escanear"),
  `Viewfinder`, `ScanSearchField`, `UploadDropzone`, and a `PrimaryButton` labeled
  `t("scanButton")` ("Escanear carta") with `disabled` set and a no-op `onPress={() => {}}`. A
  code comment on the button explains this is FR-007's intentional placeholder — `disabled`
  already blocks `PrimaryButton`'s `onPress` from ever firing (see `PrimaryButton.tsx`'s
  `isDisabled` guard), so the no-op only satisfies the required prop shape. Background
  `colors.bg.page`; title styled from `typography.display.lg` + `colors.text.primary` (same
  spread pattern `LoginScreen.tsx`'s `brandTitle` style already uses).
- **`src/features/scanner/ScanShellScreen.web.tsx`** (new, web) — reads `useWindowDimensions()`
  and imports `BREAKPOINT_PX` from `src/domain/navigation.ts` (reused, not redefined — grepped
  the repo first to confirm no second breakpoint constant exists anywhere in `src/theme` or
  `src/features/scanner`), matching `app/(app)/_layout.web.tsx`'s exact
  `useWindowDimensions()`-against-`BREAKPOINT_PX` pattern. At `width >= BREAKPOINT_PX`: renders a
  `flexDirection: "row"` two-column layout — left column: a title row (`display.lg` "Escanear
  carta" + `StatusPill` "Cámara disponible" side by side) then
  `Viewfinder`/`ScanSearchField`/`UploadDropzone`/`PrimaryButton` stacked; right column:
  `EmptyResultsPanel` above `RecentScansList`. Below the breakpoint: the same two column `View`s
  render inside a `flexDirection: "column"` wrapper instead (controls first, results below), per
  brief §5.2's last sentence — implemented as one `isTwoColumn ? styles.rowLayout :
  styles.stackedLayout` ternary on the wrapping `View`'s style, not a duplicated JSX tree. Same
  FR-007 disabled/no-op `PrimaryButton` placeholder comment as the mobile file. No inline
  `Platform.OS` branch in either file — the `.web.tsx` extension itself is the entire platform
  split, matching FR-005/Constitution IV.
- **`specs/006-visual-identity/tasks.md`** — `T043`, `T044` marked `[X]`.

Neither file imports `expo-camera`, `expo-image-picker`, or any camera-related module — confirmed
by `grep -n "expo-camera\|expo-image-picker\|camera" src/features/scanner/ScanShellScreen.tsx
src/features/scanner/ScanShellScreen.web.tsx`, which only matched this file's own doc comments
(the word "camera" appearing in prose, not an import line). No import from either the five
composed pieces or these two new files reaches a camera module — the five pieces were already
confirmed camera-free in Run 13, and composition adds no new import beyond `@/theme`,
`@/domain/i18n/copy/scan`, `@/features/i18n/LocaleContext`, `@/features/ui/PrimaryButton`,
`@/features/ui/StatusPill`, `@/domain/navigation`, and the five sibling scanner files.

### Verification

**Type-check + full `./init.sh` (no `--skip-*` flags):**

```
▶ 1/8 Checking prerequisites          ✅ node v20.20.2, npm v10.8.2
▶ 2/8 Environment file                ✅ .env already exists, left untouched
▶ 3/8 Installing dependencies         ✅ dependencies installed
▶ 4/8 Type-checking                   ✅ no type errors
▶ 5/8 Expo config/dependency health   ⚠️  outdated-dependency warning (pre-existing, unrelated
                                          to this batch — same warning present before this run)
▶ 6/8 Native dependency alignment     ⚠️  version-drift warning (pre-existing, unrelated —
                                          expo-image-picker/react-native/react-native-safe-area-
                                          context/@types/react/typescript, none touched by T043/
                                          T044)
▶ 7/8 Running test suite              ✅ all tests passed
▶ 8/8 Bundle export smoke checks      ✅ web / iOS / Android all exported cleanly
RESULT: SUCCESS (10/10 stages passed)
```

Both warnings (stages 5/6) are pre-existing dependency-version drift unrelated to this batch —
confirmed against Run 1's own recorded package versions, nothing T043/T044 touched.

**Full test suite scoped to `src/features/scanner/`** (`npx jest src/features/scanner --silent`):
7 suites, 20 tests, all passing — the five pieces' own tests (unmodified by this run) still
green. No new `.test.tsx` was added for `ScanShellScreen`/`ScanShellScreen.web` in this batch —
`tasks.md`'s own breakdown assigns that to `T045` (`ScanShellScreen.test.tsx`, the migrated
camera-import source-inspection guard plus the two/one-column collapse assertion), a separate
task not in this batch's scope.

**Manual smoke check (Level 3 equivalent — no browser available in this environment):** since
`npm run web` here has no interactive browser to inspect, I substituted a real React Native
Testing Library render (the same rendering technology `npm run web`'s app itself uses under
`react-native-web`) as concrete rendered-output evidence, then deleted the temporary test files
immediately after (not part of this feature's permanent test suite — `T045` owns the real,
committed test file):

1. Rendered `ScanShellScreen` (mobile) under `LocaleProvider` (default `"es"` locale) — confirmed
   `getByText("Escanear")` (the title), `getByTestId("viewfinder")`,
   `getByTestId("scan-search-field")`, `getByTestId("upload-dropzone")`, and
   `getByTestId("scan-shell-button")` all present. Passed.
2. Rendered `ScanShellScreen.web` with `useWindowDimensions` mocked to `{ width: 1024 }`
   (>= 768px) — confirmed `getByRole("header")` (the "Escanear carta" title, disambiguated from
   the button's identical label text via role), `getByTestId("status-pill")`,
   `getByTestId("empty-results-panel")`, and `getByTestId("recent-scans-list")` all present.
   Passed.
3. Rendered `ScanShellScreen.web` with `useWindowDimensions` mocked to `{ width: 500 }`
   (< 768px) — confirmed both `scan-shell-controls-column` and `scan-shell-results-column`
   render without throwing (the one-column collapse path). Passed.

All three passed on first or second attempt (test 2 initially failed on
`getByText("Escanear carta")` because both the title and the primary button share that exact
copy string — `scanCopy.es.titleWeb` and `scanCopy.es.scanButton` are both "Escanear carta" per
the brief; fixed by querying `getByRole("header")` instead, which is unambiguous — not a bug in
either component, a query-specificity fix in the throwaway test only). This is real rendered
output from the actual `.tsx`/`.web.tsx` files, run through the same React Native Testing
Library setup `jest-expo` provides for every other component test in this repo — the strongest
evidence available without a running browser in this sandboxed environment.

**Camera-import grep** (spec.md SC-004, this batch's explicit instruction):
```
$ grep -n "expo-camera\|expo-image-picker\|camera" src/features/scanner/ScanShellScreen.tsx src/features/scanner/ScanShellScreen.web.tsx
ScanShellScreen.tsx:9:   (doc comment, prose only)
ScanShellScreen.tsx:13:  (doc comment, prose only)
ScanShellScreen.web.tsx:19: (doc comment, prose only)
```
Zero actual import lines matched.

### Requirement traceability

| FR | Covered by |
|---|---|
| FR-001 | Both files draw every color/typography/geometry value from `src/theme` (`colors`, `typography`, `space`) — no raw hex/magic literal. |
| FR-003 | Composes `PrimaryButton` and `StatusPill` (`src/features/ui/`) as specified. |
| FR-005 | Platform split expressed entirely via the `.web.tsx` file-extension convention (`ScanShellScreen.tsx` vs. `ScanShellScreen.web.tsx`) — zero inline `Platform.OS` branch in either file. |
| FR-007 | Both files render the full visual shell (viewfinder, search, dropzone, button, and — web — the two-column layout with results panel/recent-scans) with zero camera import (grep-confirmed above); the "Escanear carta" button is genuinely disabled/no-op, documented in-line. |
| FR-009 | Neither file touches `app/scan.tsx`'s existing "Back" affordance or adds any sidebar/tab-bar chrome — that remains `T047`'s scope, untouched here. |
| FR-010 | Every visible string (`titleMobile`, `titleWeb`, `scanButton`, `statusPillCameraAvailable`) resolves through `useTranslation(scanCopy)` — zero hardcoded copy in either file. |
| FR-013 | `PrimaryButton`'s `CONTROL_HEIGHT` (56) and `StatusPill`'s existing tap-target treatment (unmodified by this batch) both already exceed the 44×44 floor — no new small interactive control introduced by composition. |

### Task status

`T043`, `T044` marked `[X]` in `specs/006-visual-identity/tasks.md`.

### Deviations needing sign-off

None. Both files match `tasks.md`'s description exactly: same component composition, same
disabled/no-op button with an FR-007-referencing comment, same reused (not redefined)
`BREAKPOINT_PX`, same `.web.tsx`-only platform split with zero inline `Platform.OS` branch.

Next: `T045`–`T048` (the migrated camera-import source-inspection test, `ScanPlaceholderScreen`
retirement, `app/scan.tsx` rewiring) — not started this run, per this batch's explicit scope
boundary (only `T043`/`T044` were assigned).

---

## Run 15 (2026-08-05) — T045, T046: migrated camera-import guard (`ScanShellScreen.test.tsx`) + `ScanPlaceholderScreen` retirement (User Story 3, scan restyle)

### Scope

Assigned batch: `T045`, `T046` only. Per `tasks.md`, `T046` "Depends on: T045 (the guard must
already be migrated before the old file/test is deleted, so the repo is never without this guard
even mid-task)" — sequencing was followed exactly: `T045` was written and confirmed green first,
only then were `ScanPlaceholderScreen.tsx`/`.test.tsx` deleted.

### Files changed

- **`src/features/scanner/ScanShellScreen.test.tsx`** (new, T045) — renders `ScanShellScreen`
  (mobile) and confirms the title, viewfinder hint text, search placeholder, dropzone copy, and
  primary button all render (defaulting to Spanish/`DEFAULT_LOCALE` with no `<LocaleProvider>`,
  matching every other bare-render scanner test in this feature). Renders `ScanShellScreen.web`
  and confirms the two-column-vs-one-column collapse at the 768px breakpoint by mocking
  `"react-native/Libraries/Utilities/useWindowDimensions"` — the exact technique
  `src/features/navigation/AppWebLayout.test.tsx` already uses for this repo's identical
  `BREAKPOINT_PX`. Also carries the **migrated camera-import source-inspection guard** (FR-007,
  SC-004): reads `ScanShellScreen.tsx`, `ScanShellScreen.web.tsx`, `Viewfinder.tsx`,
  `ScanSearchField.tsx`, `UploadDropzone.tsx`, `EmptyResultsPanel.tsx`, and `RecentScansList.tsx`
  from disk via `it.each`, asserting no import/require line matches `expo-camera`,
  `expo-image-picker`, or a bare `camera` pattern — the same technique the retired
  `ScanPlaceholderScreen.test.tsx` used, now covering every file this feature added under
  `src/features/scanner/` (T038–T044), not just the two shell files.
- **`src/features/scanner/ScanPlaceholderScreen.tsx`** and
  **`src/features/scanner/ScanPlaceholderScreen.test.tsx`** — deleted (T046), only after
  confirming `ScanShellScreen.test.tsx`'s guard was green.
- **`app/scan.tsx`** — **deviation, see below**: minimal import swap
  (`ScanPlaceholderScreen` → `ScanShellScreen`) plus a matching JSX swap, and an updated top-of-
  file comment explaining the swap. The "Back" `Pressable`'s styling/behavior is **unchanged** —
  the full token-driven restyle (a narrow `Platform.select`, per `docs/conventions.md`) remains
  `T047`'s scope, not done here.
- **`app/scan.test.tsx`** — **deviation, see below**: the one assertion that checked for the
  retired stub's `"scanner coming soon"` copy now checks for `ScanShellScreen`'s real title
  (`scanCopy.es.titleMobile`, "Escanear") instead; the `router.back()`-on-press assertion is
  unchanged, per `tasks.md`'s own instruction for the eventual `T048`.

### Deviations needing sign-off

`tasks.md`'s dependency graph lists `T046` as depending only on `T045`, but `app/scan.tsx` has a
**live** (non-comment) import of `ScanPlaceholderScreen` that `T047` — explicitly out of this
batch's assigned scope (`T045`, `T046` only) — is the task that was supposed to fix. Deleting
`ScanPlaceholderScreen.tsx` per `T046`'s literal instruction, without also fixing that import,
would have left `app/scan.tsx` failing to resolve a module and made both of this run's own
mandated verification steps impossible to satisfy: "confirm no remaining import references it
anywhere (grep the full repo)" (T046's own text) and a green `./init.sh` (this run's explicit
instruction, and `docs/verification.md`'s "never mark a task done on red type-check/tests" rule).

Given that conflict, and since the fix is a **mechanical one-line swap to an already-built,
already-approved replacement component** (`ScanShellScreen`/`ScanShellScreen.web`, T043/T044 —
not a new design decision), the minimal necessary edit was made: `app/scan.tsx`'s import/JSX now
points at `ScanShellScreen` instead of the deleted `ScanPlaceholderScreen`, and
`app/scan.test.tsx`'s one now-invalid assertion was updated to match. **Explicitly not done**:
`T047`'s full scope (restyling the "Back" `Pressable` itself with token-driven colors/spacing and
a `Platform.select`) and `T048`'s full scope (any further test alignment beyond the one
assertion that would otherwise fail) — both are left `[ ]` in `tasks.md` for a future run assigned
those exact task IDs. This is flagged here explicitly for sign-off: a future `task-implementer`
run picking up `T047` will find `app/scan.tsx` already importing `ScanShellScreen` (not
`ScanPlaceholderScreen`) and should treat that import as already done, focusing only on the
"Back" button's visual restyle.

### Tests run

`npx jest src/features/scanner app/scan.test.tsx` — 8 suites, 31 tests, all passing, including
`ScanShellScreen.test.tsx`'s 11 tests (7 camera-import-guard cases via `it.each`, 1 mobile
content-rendering case, 3 web breakpoint/content cases):

```
PASS src/features/scanner/ScanShellScreen.test.tsx
  scan visual-shell source files — camera-import guard (FR-007, SC-004)
    ✓ ScanShellScreen.tsx does not import any camera-related module
    ✓ ScanShellScreen.web.tsx does not import any camera-related module
    ✓ Viewfinder.tsx does not import any camera-related module
    ✓ ScanSearchField.tsx does not import any camera-related module
    ✓ UploadDropzone.tsx does not import any camera-related module
    ✓ EmptyResultsPanel.tsx does not import any camera-related module
    ✓ RecentScansList.tsx does not import any camera-related module
  ScanShellScreen (mobile)
    ✓ renders the title, viewfinder hint text, search placeholder, dropzone copy, and primary button
  ScanShellScreen.web — two-column-vs-one-column collapse at the 768px breakpoint
    ✓ renders the two-column (row) layout at/above 768px
    ✓ collapses to a single (column) layout below 768px
    ✓ renders the full web shell content (title, status pill, results panel, recent scans)

Test Suites: 8 passed, 8 total
Tests:       31 passed, 31 total
```

Full repo suite (`npx jest`): **63 suites, 388 tests, all passing.** Type-check
(`npx tsc --noEmit`): clean, zero errors.

Full `./init.sh` (no `--skip-*` flags):

```
✅ [OK] Prerequisites
✅ [OK] Env file
✅ [OK] npm install
✅ [OK] Type-check: no type errors
⚠️  [WARN] expo-doctor: outdated dependencies (pre-existing, unrelated to this batch)
⚠️  [WARN] Native deps: version drift (pre-existing, unrelated to this batch)
✅ [OK] Tests: all tests passed
✅ [OK] Build check (web): web bundle exported cleanly
✅ [OK] Build check (ios): ios bundle exported cleanly
✅ [OK] Build check (android): android bundle exported cleanly

RESULT: SUCCESS (10/10 stages passed)
```

The two `WARN`s (dependency-version drift) are pre-existing and predate this run — not introduced
by these changes; not a blocker per `docs/verification.md`'s "excluding the test-tooling warning"
carve-out (these are the equivalent native-dependency-drift class already documented as
non-blocking `WARN`s in prior runs, e.g. Run 1's `T001`).

### Grep verification (T046's own explicit instruction + this run's final check)

```
$ grep -rn "ScanPlaceholderScreen" --include="*.ts" --include="*.tsx" . | grep -v node_modules
app/scan.test.tsx:3:// retired ScanPlaceholderScreen stub) ... (comment, prose only)
app/scan.tsx:2:// ... Originally rendered the ScanPlaceholderScreen stub (T004); ... (comment, prose only)
src/features/scanner/ScanShellScreen.test.tsx:10: (comment, prose only, refers to the retired file's technique)
src/features/scanner/ScanShellScreen.test.tsx:15: (comment, prose only)
src/features/scanner/Viewfinder.test.tsx:4: (comment, prose only)
```

Zero live import/require statements remain anywhere in the repo — every remaining match is
explanatory prose in a comment referencing the retired file's history, not a module reference.

### Requirement traceability

| FR / SC | Covered by |
|---|---|
| FR-007 | `ScanShellScreen.test.tsx`'s camera-import guard (7 `it.each` cases) — migrated intact from `ScanPlaceholderScreen.test.tsx`, now covering all 7 scanner source files this feature added. |
| SC-004 | Same guard — "the scan screen's source files import zero camera-related modules... kept green throughout this feature's implementation" — confirmed green both before and after `ScanPlaceholderScreen`'s removal (T045 run first, T046 only after). |
| spec.md US3 Independent Test | `ScanShellScreen.test.tsx`'s content-rendering tests (title, viewfinder hint, search placeholder, dropzone copy, primary button) plus the migrated guard. |
| spec.md US3 AS2/AS3 | The two breakpoint tests (`renders the two-column (row) layout at/above 768px`, `collapses to a single (column) layout below 768px`), using the same `useWindowDimensions` mock technique as `AppWebLayout.test.tsx`. |

### Task status

`T045`, `T046` marked `[X]` in `specs/006-visual-identity/tasks.md`. `T047`, `T048`, `T049`
remain `[ ]` — out of this batch's assigned scope, though `app/scan.tsx`'s import/JSX swap
(normally part of `T047`) was completed as a necessary minimal fix (see Deviations above); the
"Back" button's visual restyle itself was not touched.

---

## Run 16 (2026-08-05) — T047, T048, T049: restyle `app/scan.tsx`'s "Back" affordance + align its test + manual smoke check (User Story 3, scan restyle — Phase 4 final tasks)

### Scope

Assigned batch: `T047`, `T048`, `T049` only — the final Phase 4 ("User Story 3, scan visual
shell") tasks. As Run 15 flagged in its own Deviations section, `app/scan.tsx`'s import/JSX swap
(`ScanShellScreen` in place of the retired `ScanPlaceholderScreen`) was already done as a
necessary minimal fix in that prior run — this run treated that swap as already complete and
focused only on the "Back" `Pressable`'s visual restyle, `app/scan.test.tsx`'s alignment, and the
manual smoke check.

### Files changed

- **`app/scan.tsx`** (T047) — restyled the existing "Back" `Pressable` with `src/theme` tokens:
  a `bg.surface` pill chip (`radius.pill`, `shadowSurface`), a leading `Ionicons name="chevron-back"`
  glyph, and the label styled with `typography.button.label`'s size/weight and `colors.text.primary`.
  `onPress={() => router.back()}`, `accessibilityRole="button"`, `accessibilityLabel="Back to
  Home"`, and `testID="scan-back-button"` are byte-for-byte unchanged — the button's *behavior*
  is untouched, only its visual styling traces to tokens now. Updated the top-of-file comment to
  reflect T047's completion and to document the `Platform.select` decision (see Deviations below).
- **`app/scan.test.tsx`** (T048) — the `router.back()`-on-press assertion is unchanged. The
  "renders the scan visual shell..." test's *body* was already asserting the new shell's real
  copy/roles (header role + `scanCopy.es.titleMobile`, "Escanear") as of Run 15's necessary fix —
  only the `it()` description string was tightened this run to explicitly name "Escanear" for
  clarity/traceability. No new assertions were added or removed.

### Deviations needing sign-off — the single-value `Platform.select` allowance was considered and deliberately not used

`tasks.md`'s T047 text, `plan.md`'s Research Decisions, and this run's own kickoff instructions all
described "a single, narrow `Platform.select` for the icon/label color against the two different
backgrounds" as the expected/acceptable shape for this restyle. Before writing the code, I traced
what those "two different backgrounds" actually are today by reading both
`src/features/scanner/ScanShellScreen.tsx` (mobile) and `ScanShellScreen.web.tsx` (web) — both set
the *identical* token, `backgroundColor: colors.bg.page`, on their outermost `ScrollView`, and
`spec.md`'s Recorded default 3 confirms `/scan` deliberately does **not** gain a web-only sidebar
or any other chrome that could plausibly differ from the mobile background. The "Back" `Pressable`
sits (via `position: "absolute"`, `zIndex: 1`) directly on top of that same `bg.page` background on
both platforms — there is no genuine mobile-vs-web background difference for an icon/label color to
key off of in the shipped design.

Given that, a `Platform.select({ web: ..., default: ... })` with two identical branches would be
dead code — it resolves to the same value either way, and would directly contradict this same
task's paired "don't over-engineer a platform split for a single color value" instruction. I made
the call to use one shared `colors.text.primary` value for both platforms instead, and documented
this reasoning explicitly in `app/scan.tsx`'s own top-of-file comment (not just here), so a future
reader/reviewer isn't left wondering why the described `Platform.select` isn't present. The
allowance itself remains available and unused, ready to invoke narrowly if `/scan` ever gains a
genuine web-only background treatment later (e.g. if a future feature reconsiders Recorded default
3). Flagging this explicitly for sign-off since it's a literal (if, I believe, well-reasoned)
deviation from the task's described shape — happy to add the `Platform.select` back with two
identical branches if the human/reviewer prefers the letter of the instruction over this reasoning.

### T049 — Manual smoke check (Level 3): real dev-server boot + compiled-bundle content check (no browser/simulator binary available)

No Claude Browser tool, headless browser binary (`chromium`/`google-chrome`), or iOS/Android
simulator was reachable in this environment this run — the same sandbox limitation disclosed in
this feature's own T037 run (Run 12) and several earlier runs. Rather than claim a pixel-level
visual check I could not perform, here is exactly what I ran in its place, the same substitute
technique T037 established:

1. **Booted the real Metro dev server** (`npx expo start --web --port 8082`) and confirmed it
   bundled cleanly — only the same pre-existing, unrelated `@supabase/auth-js` require-cycle
   warning present before this batch:
   ```
   Web Bundled 1367ms node_modules/expo-router/entry.js (895 modules)
   ```
2. **Fetched `/scan`'s SSR HTML** (`curl http://localhost:8082/scan`) — returned `200`, confirming
   the route resolves and serves without a server-side crash.
3. **Fetched the actual client bundle `/scan` loads** and grepped it for the literal strings a
   real browser would render on hydration:
   ```
   grep -c "Escanear"                          -> 5
   grep -c "Apunta la c[aá]mara"                -> 1
   grep -c "Buscar carta por nombre"            -> 1
   grep -c "Subir imagen de carta"              -> 1
   grep -c "Cámara disponible"                  -> 2
   grep -c "Escaneos recientes"                 -> 2
   grep -c "chevron-back"                       -> 7
   ```
   Confirms the exact compiled code a real browser would execute contains the restyled shell's
   title, viewfinder hint, search placeholder, dropzone copy, status pill, recent-scans heading,
   and the "Back" button's new chevron icon — every piece this and prior Phase 4 runs added is
   genuinely present in what ships to the browser, even though I could not screenshot the
   post-hydration pixels or resize an actual viewport across the 768px breakpoint.
4. **`./init.sh`'s bundle-export stage** (below) independently confirms `expo export` for
   `web`/`ios`/`android` all bundle cleanly with this same code — the strongest signal available
   for "does it even boot" on native short of an actual simulator.
5. Shut the dev server down cleanly afterward (confirmed port 8082 free).
6. **Camera-import grep** (the task's own explicit final check), run against `src/features/scanner/`
   only (not the full compiled bundle, which legitimately contains the strings `expo-camera`/
   `expo-image-picker` once each from `package.json`'s declared-but-unused-here dependencies, used
   by the KYC document-capture feature elsewhere in the app — confirmed via a second grep scoped to
   `src/`, which found only two prose comments, no live imports):
   ```
   $ grep -rn "expo-camera\|expo-image-picker" src/features/scanner/
   (zero matches)
   ```

**What this does NOT confirm, disclosed as a real gap, not silently skipped**: the actual
pixel-level rendering (single-column shell on mobile width, the two-column-to-one-column collapse
at 768px, VoiceOver/TalkBack announcing the gear chip/dropzone/search field/disabled primary button
as non-actionable, the restyled "Back" chip's real tap-and-navigate round trip back to an intact
Home screen) was **not visually/interactively verified** this run — no browser/simulator was
available. This mirrors T037's own disclosed limitation. Sign-off note for the human: a real
`npm run web` + resize + locale-toggle + iOS/Android simulator pass (the remainder of `plan.md`'s
Quickstart Validation steps) is still owed before this feature's Phase 5 (`T054`) closes it out, if
this environment's tooling doesn't change before then. The breakpoint collapse and inert-control
accessibility behavior *are* covered at the component level by `ScanShellScreen.test.tsx` (Run 15)
and the individual primitive tests (Run 13), which is real automated evidence even though it isn't
a substitute for an actual resize/screen-reader pass.

### Tests run

```
$ npx jest app/scan.test.tsx --silent
PASS app/scan.test.tsx
Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

Full repo suite (`npm test`): **63 suites, 388 tests, all passing.**

Full `./init.sh` (no `--skip-*` flags):

```
✅ [OK] Prerequisites
✅ [OK] Env file
✅ [OK] npm install
✅ [OK] Type-check: no type errors
⚠️  [WARN] expo-doctor: outdated dependencies (pre-existing, unrelated to this batch)
⚠️  [WARN] Native deps: version drift (pre-existing, unrelated to this batch)
✅ [OK] Tests: all tests passed
✅ [OK] Build check (web): web bundle exported cleanly
✅ [OK] Build check (ios): ios bundle exported cleanly
✅ [OK] Build check (android): android bundle exported cleanly

RESULT: SUCCESS (10/10 stages passed)
```

The two `WARN`s are the same pre-existing, unrelated dependency-version-drift warnings already
documented in every prior run's `init.sh` output in this feature (e.g. Run 15) — not introduced by
this batch.

### Requirement traceability

| FR | Covered by |
|---|---|
| FR-009 (scan screen keeps its existing "Back" affordance, restyled but not removed, no persistent sidebar/tab bar added) | `app/scan.test.tsx`'s unmodified `'calls router.back() when "Back to Home" is pressed'` test (behavior proof) + this run's manual bundle-content check confirming the chevron icon compiles into the shipped code (visual-restyle proof, substitute-level). |
| spec.md US3 AS1 (`/scan` renders the branded visual shell, not camera UI) | `app/scan.test.tsx`'s `'renders the scan visual shell (title "Escanear"), not camera UI'` test. |
| FR-007 / SC-004 (zero camera-related import under `src/features/scanner/`) | This run's `grep -rn "expo-camera\|expo-image-picker" src/features/scanner/` re-check — zero matches, consistent with `ScanShellScreen.test.tsx`'s automated guard (Run 15). |

### Task status

`T047`, `T048`, `T049` marked `[X]` in `specs/006-visual-identity/tasks.md`. This closes out
Phase 4 (User Story 3) — every task `T038`–`T049` is now `[X]`. Phase 5 (Polish & Cross-Cutting,
`T050`–`T054`) is the only remaining work in this feature's `tasks.md`, not part of this batch.

---

## Run 17 (2026-08-05) — T050, T051: Accessibility pass + responsive layout check (Phase 5, Polish)

### Scope

`T050` (Constitution VII accessibility pass across every new/restyled component from Phases 2–4)
and `T051` (responsive layout check at 375px web / typical desktop / phone / tablet, both
screens, both locales) from `specs/006-visual-identity/tasks.md`. Plus the one disclosed,
carried-forward nit from the T023-T024a review: `FormField.tsx`/`FormField.web.tsx`'s raw
`#dc2626` error-text hex literal — resolved in this run (not deferred), per the task brief's
"either resolution is acceptable, but don't silently do neither" instruction.

Audited, file by file: every file under `src/features/ui/`, `src/features/identity/`
(`FormField`/`.web`, `LoginScreenChrome`/`.web`, `SignInForm`, `RequestPasswordResetForm`,
`ResetPasswordForm`, `LoginScreen`), and `src/features/scanner/`, plus `app/scan.tsx` (rendered
content of the scan screen, in scope even though not one of the three named folders, since its
"Back" affordance is one of the screen's interactive elements and was modified by Phase 4's T047).
Re-read `docs/design-brief-visual-identity.md` §6 before starting.

### Findings and fixes

**1. Real bug — `/login` had no scroll affordance; tall content on a short viewport was clipped
with no way to reach it (T051, SC-006).** `LoginScreenChrome.tsx` (mobile) and
`LoginScreenChrome.web.tsx` (web) each wrapped `children` in a plain `flex: 1` View / `flex: 1,
justifyContent: "center"` View respectively — no `ScrollView`. The full sign-in view's real
content height (`BrandMark` + `display.xl` title + tagline + email field + password field +
"Olvidé mi contraseña" + "Entrar" + `OrDivider` + "Crear cuenta" + the three-segment legal line)
comfortably exceeds a short/narrow viewport (a 375×667 phone, a landscape phone, or the visible
area once an on-screen keyboard is up), and Expo's web output sets `body { overflow: hidden }`
(confirmed against `HomeScreen.tsx`'s own documented rationale for its identical fix). This is the
*exact* failure mode `004-home-scan-shell` (`HomeScreen.tsx`, T020/T021) and this same feature's
own `ScanShellScreen.tsx`/`ScanShellScreen.web.tsx` (T043) already fixed with a `ScrollView` +
`flexGrow: 1` content container — `/login` was the one screen in this feature that never got the
equivalent fix, since neither `LoginScreenChrome` file was touched again after their original T025/
T026 authoring. **Fixed**: both files now wrap `children` in a `ScrollView` (`contentContainerStyle`
carrying the previous layout's `flexGrow`/`alignItems`/`justifyContent`/padding, so nothing
visually changes whenever content already fits — it only scrolls once it doesn't). The mobile
gradient wash stays a sibling of the ScrollView (absolute-positioned, `pointerEvents="none"`), so
it stays pinned to the viewport rather than scrolling away with the form, matching the design
brief's intent.

**1a. Follow-on bug my own fix would have introduced — dead first tap on "Entrar"/"Olvidé mi
contraseña"/"Crear cuenta" while the keyboard is open.** RN's `ScrollView` defaults to
`keyboardShouldPersistTaps="never"`: the first tap on any touchable other than the currently
focused `TextInput` only dismisses the keyboard, swallowing the press. Before this run's fix
there was no `ScrollView` on `/login` at all, so this failure mode didn't exist; introducing one
without addressing it would have traded "clipped content" for "must tap the submit button twice
after typing a password." **Fixed**: both `LoginScreenChrome` files now set
`keyboardShouldPersistTaps="handled"`. Applied the same fix defensively to
`ScanShellScreen.tsx`/`ScanShellScreen.web.tsx` too (their `ScrollView` also wraps a `TextInput`,
`ScanSearchField`) — no practical effect today since every other scan control is intentionally
disabled/no-op per FR-007, but it prevents the same gotcha from silently resurfacing once a real
scanner feature enables those controls.

**2. Real bug — the settings-gear chip in `Viewfinder.tsx` was not actually hidden from
screen readers on web, despite the code's own stated intent.** The chip used
`accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"` (T038's original
implementation, correctly reasoned for native). Checked the installed `react-native-web`'s
`forwardedProps` list directly: neither prop is forwarded to the DOM on web — they're silently
dropped, so on the web target this chip remained reachable in the accessibility tree (as an
unlabeled, roleless element) despite the code visibly declaring intent to hide it. Checked the
installed `react-native` (0.74.0) `View.js` source: `aria-hidden` is a first-class prop RN 0.74
maps *internally* to the exact same `accessibilityElementsHidden`/`importantForAccessibility`
pair on native, **and** it's one of the props `react-native-web` does forward straight through to
the DOM's real `aria-hidden` attribute — one prop, correct on all three targets. **Fixed**:
replaced both legacy props with `aria-hidden` on the gear-chip `View`. Added a regression test
(`Viewfinder.test.tsx`) asserting `gearChip.props["aria-hidden"] === true`, using
`{ includeHiddenElements: true }` on the query — confirmed this option is actually necessary
first (without it, `@testing-library/react-native`'s own `isHiddenFromAccessibility` check, which
already recognizes `aria-hidden`, makes the element unfindable by a normal query — itself an
independent, second confirmation that the fix genuinely hides the element from the same kind of
tooling a screen reader integration would use).

**3. Real bug — `app/scan.tsx`'s "Back" affordance copy was hardcoded English, not routed
through the i18n mechanism (FR-010/US4 AS1), despite the dictionary already reserving keys for
exactly this button.** `src/domain/i18n/copy/scan.ts`'s own top comment (Run 5) states it
includes "the existing 'Back'/'Back to Home' affordance's copy from `app/scan.tsx`"
(`backLabel`/`backAccessibilityLabel`, both locales present, `es`: "Atrás"/"Volver al inicio",
`en`: "Back"/"Back to Home") — but `app/scan.tsx` itself (last touched by Run 16's T047, a
restyle-only task scoped to visual tokens, not copy) never actually consumed them; the visible
`Text` and `accessibilityLabel` were still the literal strings `"Back"` / `"Back to Home"`. This
is exactly the class of finding T050's "accessibility labels on every interactive element" check
exists to catch — the label wasn't missing, but it was unlocalized and disconnected from copy the
feature's own i18n layer already carries for it. **Fixed**: `app/scan.tsx` now calls
`useTranslation(scanCopy)` and renders `t("backLabel")`/`t("backAccessibilityLabel")`. Updated
`app/scan.test.tsx`'s press-assertion query (`getByRole("button", { name: ... })`) from the
retired literal `"Back to Home"` to `scanCopy.es.backAccessibilityLabel` (this render has no
`<LocaleProvider>`, so `useLocale()`'s documented outside-provider fallback resolves
`DEFAULT_LOCALE`/`"es"` — the same convention every other bare-render test in this feature
already follows).

**4. Disclosed nit resolved (not deferred) — `FormField.tsx`/`FormField.web.tsx`'s raw
`#dc2626` error-text color.** Computed its actual contrast ratio against every background this
feature's error text can render on (`bg.page` 4.12:1 — **fails** 4.5:1; `bg.surface` 4.83:1;
`bg.surfaceMuted` 4.54:1) using the same `contrastRatio()` helper T008 built, not eyeballed —
confirming this literal wasn't just undocumented, it was a genuine, unnoticed Constitution VII
violation on `bg.page` specifically (the mobile login screen's own background). Added
`colors.text.danger = "#B91C1C"` (Tailwind red-700 — a darker shade of the exact same hue, the
identical adjustment method spec.md's Recorded default 2 already used for four other tokens) to
`src/theme/colors.ts`; it clears 4.5:1 against all three backgrounds this feature actually uses
(`bg.page` 5.52:1, `bg.surface` 6.47:1, `bg.surfaceMuted` 6.08:1). Added a
`contrast.test.ts` case covering all three pairings (mirrors the existing
`text.secondary`/`text.link` pairing-group pattern exactly). Replaced the raw `"#dc2626"` literal
in `FormField.tsx`, `FormField.web.tsx`, and — since `SignInForm.tsx`/
`RequestPasswordResetForm.tsx`/`ResetPasswordForm.tsx`'s own `generalError` styles each carried
the identical literal with a comment explicitly cross-referencing "the same disclosed precedent as
FormField.tsx's error-text color" (i.e., the same finding, duplicated across this feature's own
touched files) — those three files too, with `colors.text.danger`. **Deliberately did not touch**
`RegistrationForm.tsx`/`ProfileForm.tsx`/`VerifyPhoneScreen.tsx`'s own (separate) `#dc2626`
instances: those are `001-registration-kyc` files never restyled by `006-visual-identity`, out of
this feature's scope per FR-014's "MUST NOT... translations for any screen other than login and
scan" boundary — touching them would be an unreviewed change to shipped, unrelated feature code
with no reported failure driving it. Flagging this scope boundary explicitly per the task brief's
own "if you judge X out of scope, say so" guidance, though for this specific nit I judged the
*named* files (FormField + the three login forms already inside this feature's own scope) as
squarely in-scope and fixed them, rather than leaving the whole nit unresolved.

### Checked and confirmed already correct (no fix needed)

- **44×44 tap targets** — `PrimaryButton`/`SecondaryButton` (`CONTROL_HEIGHT` 56), `FormField`'s
  input container (`CONTROL_HEIGHT` 56), the "Olvidé mi contraseña" link (`SignInForm.tsx`'s
  `forgotPasswordButton` style already carries explicit `minHeight: 44, minWidth: 44`), the "Back
  to sign in" links in `RequestPasswordResetForm.tsx`/`ResetPasswordForm.tsx` (same explicit
  `minHeight`/`minWidth: 44`), `app/scan.tsx`'s "Back" chip (`minWidth: 44, minHeight: 44`) — all
  already compliant. The gear chip and the search field's magnifier glyph are correctly
  **non-interactive** (no tap target requirement applies to a decorative element that isn't
  pressable — confirmed the magnifier is a plain icon beside an uncontrolled `TextInput`, not a
  separate pressable, per `ScanSearchField.tsx`'s own documented "inert" reasoning). `StatusPill`
  is a non-interactive status indicator (confirmed no `accessibilityRole="button"`), so no tap
  target requirement applies to it either — consistent with brief §6's own framing ("check the
  small ones") being about controls that are (or read as) interactive, not purely decorative ones.
- **No inert scan control carries a bare `accessibilityRole="button"`.** Re-checked every file
  under `src/features/scanner/`: `Viewfinder`'s gear chip (now genuinely `aria-hidden`, see Finding
  2), `ScanSearchField` (plain `TextInput`, no role), `UploadDropzone` (plain `View`/`Text`, no
  role), `EmptyResultsPanel`/`RecentScansList` (plain presentational, no role). The "Escanear
  carta" `PrimaryButton` does carry `accessibilityRole="button"` and is `disabled` — this is
  correct, not a violation: a `disabled` button with `accessibilityState.disabled` set (which
  `PrimaryButton.tsx` already does) honestly communicates "this is a button, currently unavailable"
  rather than falsely presenting as either fully interactive or a non-control; this is
  pre-existing, already-reviewed Phase 4 behavior (T043/T044's own documented FR-007 rationale),
  not reopened here.
- **Visible keyboard focus order on web.** Confirmed no file under the audited scope sets `order`
  (CSS flex reordering) anywhere, so DOM order matches visual order on both screens — real,
  natural tab order. Confirmed no file sets `outlineStyle`/`outlineWidth`/`outline` (the browser's
  default focus ring is left untouched everywhere, matching this repo's existing, documented
  `WebSidebarNav.tsx`/`WebBottomBarNav.tsx` convention for the same concern). Read
  `react-native-web`'s installed `Pressable` implementation directly: every `Pressable` in this
  codebase (`PrimaryButton`, `SecondaryButton`, "Olvidé mi contraseña," "Back to sign in," the
  resend button, `app/scan.tsx`'s "Back" chip) gets `tabIndex={0}` by default (or `-1` when
  `disabled`), so all of them are genuinely keyboard-reachable in visual order. `expo-router`'s
  `<Link>` ("Crear cuenta") renders a real `<a href>`, natively focusable. `TextInput`s render
  native `<input>`s, natively focusable. Confirmed `BrandMark`'s `accessible` prop (needed for
  `@testing-library/react-native`'s role queries, per Run 3's own note) does not add a spurious
  tab stop on web — `react-native-web`'s `forwardedProps` doesn't even forward `accessible`, and
  `View.js`'s `focusable` computation only keys off `tabIndex`/`focusable`, neither of which
  `BrandMark` sets.
- **Contrast** (re-confirmed, not re-derived) — `contrast.test.ts` (T008, unchanged apart from
  the new `text.danger` case) still passes; no color value this run touched besides the new danger
  token.
- **OS font scaling** — confirmed no file under the audited scope sets `allowFontScaling={false}`
  anywhere (RN's default, `true`, is left in effect everywhere), so Dynamic Type/large-font-scale
  settings are honored, not blocked.
- **Legal line's "Términos de Uso"/"Política de Privacidad" spans** — styled in `text.link` but
  intentionally not functional hyperlinks (no `onPress`/`href`). Confirmed this isn't a regression
  or a mislabeled control: the app has no `/terms`/`/privacy` route to link to yet (grepped `app/`
  — none exist), matches spec.md US2's own content-order description (styled text, not specified
  as interactive), and — critically — they carry no `accessibilityRole` implying interactivity, so
  they don't violate the "don't present an inert element as actionable" rule; they're accurately
  presented as non-interactive styled text.

### Judged out of scope (disclosed, not silently skipped)

- **Fixed-height controls (`CONTROL_HEIGHT` = 56, applied via `height`, not `minHeight`) under
  extreme OS text-scaling.** At very large accessibility font-scale settings, text inside a
  pill-shaped `height: 56` container could in principle get tight/clip before wrapping has
  anywhere to go. This is a pre-existing characteristic of the design brief's own token
  (`control.height`, specified as a fixed value in `docs/design-brief-visual-identity.md` §2.3,
  applied identically across `FormField`, `PrimaryButton`, `SecondaryButton`, `ScanSearchField`).
  Changing `height` to `minHeight` across every one of these already-reviewed, already-tested
  components would be a broader, riskier redesign than this pass's "audit and fix in place" scope,
  and brief §6 doesn't call this out as one of its named concerns (it names tap targets, contrast,
  inert-control labeling, and the 375px viewport specifically — not text-scaling reflow). Flagging
  this explicitly as a follow-up candidate rather than silently leaving it unmentioned; not fixed
  in this run.

### Responsive layout check (T051) — method and results

A real browser/simulator was not available in this sandbox — the same disclosed limitation prior
runs' Level 3 smoke checks (T037, T049) already noted. Per this task's own instruction, substituted
the strongest available verification: component/rendering tests driven by explicit viewport-width
mocks and structural assertions, plus source-level review for anything that could cause horizontal
overflow (fixed pixel widths, non-percentage sizing) at a narrow viewport.

1. **`ScanShellScreen.test.tsx`**: added two new tests rendering `ScanShellScreen.web` at exactly
   SC-006's literal figures — `375` (single column, `flexDirection: "column"`) and `1440` (two
   columns, `flexDirection: "row"`) — both confirming full content renders with no crash at either
   width. (The existing `767`/`800` breakpoint tests already exercised the same column-collapse
   logic generically; these two pin the exact numbers SC-006 names.)
2. **`LoginScreenChrome.test.tsx`**: added a `width: "100%"` assertion on the web card style
   (alongside the pre-existing `maxWidth`/`padding`/`radius` assertions) — confirming the card's
   width is percentage-based, not a fixed pixel value, which is what actually guarantees it can't
   force horizontal overflow at a 375px viewport (it only ever caps how wide the card grows on a
   spacious one). Added the two `ScrollView`-wrapping tests described in Finding 1 above (both
   variants) as the substitute verification that tall content on a short viewport stays reachable
   rather than clipped.
3. **Source-level review, no fixed non-percentage widths found** that could force horizontal
   overflow at 375px in any audited file: `SignInForm`/`RequestPasswordResetForm`/
   `ResetPasswordForm`'s `container` style is `width: "100%", maxWidth: 420` (percentage-based,
   the cap only matters on wide viewports); `LoginScreenChrome.web.tsx`'s card is `width: "100%",
   maxWidth: 660`; `ScanShellScreen`'s columns are `flex: 1` inside a `flexDirection` container,
   no fixed widths. `CodeInput.tsx` (pre-existing `001-registration-kyc` component, reused
   unmodified by `ResetPasswordForm` per T032's own disclosed decision) has no explicit `width`
   either — it stretches to its `FormField` container's width via flexbox's default
   `alignItems: "stretch"`, confirmed by reading the file; not touched, since it's outside this
   feature's restyle scope (T032's own documented boundary).
4. **Both locales** — re-ran the full `src/domain/i18n/copy/login.test.ts`/`copy/scan.test.ts`
   key-parity suites (unchanged by this run, still green) as confirmation neither locale's copy
   was affected by this run's fixes; the one copy-consumption change this run made
   (`app/scan.tsx`'s "Back" affordance) now reads from the same `scanCopy` dictionary every other
   scan string already used, in both `es`/`en`.
5. **Phone/tablet form factors on iOS/Android simulators** — not available in this sandbox (same
   disclosed limitation as every prior run's Level 3 checks in this feature). No native-only code
   path was touched this run (no `.ios.tsx`/`.android.tsx` file was edited) — every fix in this
   run (`ScrollView`, `keyboardShouldPersistTaps`, `aria-hidden`, the `text.danger` token, the i18n
   wiring in `app/scan.tsx`) is expressed in cross-platform files (`.tsx`/`.web.tsx` only), so the
   web-target verification above and the `./init.sh` iOS/Android **bundle-export** checks (which
   did pass, see below) are the available evidence; a live simulator run is recorded here as not
   performed, not claimed.

### Tests run

1. Targeted re-run of every file this run touched or added a test to:
   ```
   PASS src/features/identity/LoginScreenChrome.test.tsx
   PASS src/features/identity/LoginScreen.test.tsx
   PASS src/features/scanner/Viewfinder.test.tsx
   PASS app/scan.test.tsx
   PASS src/features/scanner/ScanShellScreen.test.tsx
   PASS src/theme/contrast.test.ts
   PASS src/features/identity/FormField.test.tsx
   PASS src/features/identity/SignInForm.test.tsx
   PASS src/features/identity/RequestPasswordResetForm.test.tsx
   PASS src/features/identity/ResetPasswordForm.test.tsx
   ```
2. **Type-check**: `npx tsc --noEmit` — clean, no errors.
3. **Full existing test suite** (`npx jest`, whole repo, not filtered):
   ```
   Test Suites: 63 passed, 63 total
   Tests:       394 passed, 394 total
   ```
   Zero regression to any pre-existing test — every suite that existed before this run (including
   every test this run did not touch) still passes unmodified.
4. **`./init.sh` (full, no skip flags)**:
   ```
   ▶ 1/8 Checking prerequisites          ✅ OK
   ▶ 2/8 Environment file                ✅ OK
   ▶ 3/8 Installing dependencies         ✅ OK
   ▶ 4/8 Type-checking                   ✅ OK — no type errors
   ▶ 5/8 Expo config/dependency health   ⚠️  WARN — same pre-existing "outdated dependencies"
                                             advisory every prior run's report already documented
   ▶ 6/8 Native dependency alignment     ⚠️  WARN — same pre-existing drift (expo-image-picker,
                                             react-native, react-native-safe-area-context,
                                             @types/react, typescript) — none of this run's files
                                             are native-module packages, so nothing new
   ▶ 7/8 Running test suite              ✅ OK — all tests passed
   ▶ 8/8 Bundle export smoke checks      ✅ OK — web/iOS/Android all exported cleanly

   RESULT: SUCCESS (10/10 stages passed)
   ```
   Both Stage 5/6 warnings are identical, pre-existing, and unrelated to this run's files (same
   five package names as every prior run's report, going back to Run 1).

### Requirement traceability

| FR / SC | Covered by |
|---|---|
| FR-013 (real accessibility label + ≥44×44 tap target on every interactive element; inert elements not presented as actionable) | `Viewfinder.test.tsx`'s new `aria-hidden` test (Finding 2); re-confirmed via existing `PrimaryButton.test.tsx`/`SecondaryButton.test.tsx`/`OrDivider.test.tsx`/`StatusPill.test.tsx` tap-target/role assertions (all pre-existing, still green, no fix needed there) |
| FR-010 (no hardcoded copy in a login/scan component) | `app/scan.tsx`'s Finding 3 fix + `app/scan.test.tsx`'s updated assertion |
| FR-004 / Constitution VII (4.5:1 contrast floor) | `src/theme/contrast.test.ts`'s new `text.danger` pairing-group test (Finding 4) |
| SC-006 (usable at 375px web viewport through desktop widths, phone/tablet form factors, no clipped content) | `LoginScreenChrome.test.tsx`'s new `ScrollView`-wrapping + `width: "100%"` tests (Finding 1); `ScanShellScreen.test.tsx`'s new 375px/1440px width tests |
| spec.md US3 AS4 (no inert scan control presents as actionable) | `Viewfinder.test.tsx`'s existing "does not expose the gear chip (or anything else) as a button role" test (still green) + the new `aria-hidden` test closing the web-specific gap in that same guarantee |

### Task IDs now `[X]`

- T050, T051 (both marked `[X]` in `specs/006-visual-identity/tasks.md`)

### Files changed

- `src/features/identity/LoginScreenChrome.tsx` — `ScrollView` + `keyboardShouldPersistTaps`
  fix (Findings 1, 1a).
- `src/features/identity/LoginScreenChrome.web.tsx` — same fix, web variant.
- `src/features/identity/LoginScreenChrome.test.tsx` — new `ScrollView`/`width` assertions.
- `src/features/scanner/Viewfinder.tsx` — `aria-hidden` fix (Finding 2).
- `src/features/scanner/Viewfinder.test.tsx` — new `aria-hidden` regression test.
- `src/features/scanner/ScanShellScreen.tsx` / `ScanShellScreen.web.tsx` —
  `keyboardShouldPersistTaps` defensive fix (Finding 1a).
- `src/features/scanner/ScanShellScreen.test.tsx` — new 375px/1440px width tests.
- `app/scan.tsx` — i18n wiring for the "Back" affordance (Finding 3).
- `app/scan.test.tsx` — updated press-assertion query.
- `src/theme/colors.ts` — new `colors.text.danger` token (Finding 4).
- `src/theme/contrast.test.ts` — new `text.danger` contrast test.
- `src/features/identity/FormField.tsx` / `FormField.web.tsx` — consume `colors.text.danger`.
- `src/features/identity/SignInForm.tsx` / `RequestPasswordResetForm.tsx` /
  `ResetPasswordForm.tsx` — consume `colors.text.danger` (same finding, same feature scope).
- `specs/006-visual-identity/tasks.md` — T050, T051 marked `[X]`.
- `progress/impl_006-visual-identity.md` — this section.

### Deviations / notes for sign-off

- Findings 1, 1a, 2, and 3 are genuine, previously-unreported defects found during this audit, not
  anticipated by the task brief's own bullet list (which named the gear chip/magnifier/"Olvidé mi
  contraseña"/`StatusPill` as things to *re-check*, not as already-known bugs) — flagging clearly
  that these are new findings from this pass, fixed in place per the task's own instruction, not
  pre-existing known issues being closed out.
- Finding 4 (the `text.danger` token) resolves the disclosed T023-T024a nit by adding the token
  and fixing every in-scope file that carried the same literal, rather than leaving it as a
  follow-up — the task brief said either resolution was acceptable; chose to resolve it since the
  contrast computation showed it was an actual (not merely cosmetic) Constitution VII gap on
  `bg.page`, not just an undocumented literal.
- The "OS font scaling / fixed `CONTROL_HEIGHT`" item is explicitly flagged as a judged-out-of-
  scope follow-up candidate, not silently omitted — see that section above.
- No native simulator (iOS/Android) or live browser was available in this sandbox; the
  substitute-verification method used (viewport-width-driven component tests, source-level
  non-percentage-width review, `./init.sh`'s three-platform bundle-export check) is disclosed
  above rather than a claimed live check. This mirrors the same disclosed limitation in every
  prior Level 3 smoke-check entry in this feature's progress log (Run 12/T037, Run 16/T049).

Phase 5 remaining: `T052` (full-suite regression re-run — effectively already re-confirmed by this
run's own "Tests run" section above, but not yet formally executed as its own dedicated task),
`T053` (contrast test + camera-import grep re-check), `T054` (final `./init.sh` gate) — not
executed as their own named tasks in this run, out of this batch's explicit scope (`T050`/`T051`
only).

## Run 18 (2026-08-05) — T052, T053, T054: Full regression suite, contrast/camera-import re-check, final `./init.sh` gate (Phase 5, Polish — final tasks)

### Scope

Verification-and-fix-if-needed pass only, per the launch instructions — no new component/file
expected, and none was added. Goal: prove the whole `006-visual-identity` feature is
regression-free end to end, with special scrutiny on the `FormField` restyle's (T023/T024)
blast radius into `RegistrationForm`/`VerifyPhoneScreen`/`ProfileForm` (`005`/`001` features).

### T052 — Full test suite regression check

Ran `npm test -- --silent` (the full, unfiltered suite — not `npm test -- <pattern>`):

```
Test Suites: 63 passed, 63 total
Tests:       394 passed, 394 total
Snapshots:   0 total
Time:        2.092 s
```

All 63 suites green, including every pre-existing suite outside this feature's own files:
`RegistrationForm.test.tsx`, `app/(auth)/verify-phone.test.tsx`, `ProfileForm.test.tsx`,
`app/(auth)/register.test.tsx`, `app/(auth)/register.session-wiring.test.tsx`,
`app/(auth)/register.session-failure.test.tsx`, `KycStatusScreen.test.tsx`,
`useKycGate.test.ts`, `HomeScreen.test.tsx`/`HomeScreen.integration.test.tsx`, and every other
suite from `001-registration-kyc`/`004-home-scan-shell`/`005-login`.

**No test required fixing.** Before concluding that, I specifically checked whether
`RegistrationForm.test.tsx`, `app/(auth)/verify-phone.test.tsx`, or `ProfileForm.test.tsx` (the
three call sites plan.md's disclosed `FormField` side effect names) assert any visual literal
that the restyle could have invalidated:

```
grep -n "borderColor\|backgroundColor\|#[0-9A-Fa-f]{6}\|borderRadius" \
  src/features/identity/RegistrationForm.test.tsx \
  src/features/identity/ProfileForm.test.tsx \
  "app/(auth)/verify-phone.test.tsx"
# (no output — zero matches in all three files)
```

None of the three files assert a hardcoded color/radius/border value against `FormField`'s
rendered output — they were already written per `docs/conventions.md`'s behavior/role/text
guidance (asserting field labels, error text via `accessibilityRole="alert"`, submit-button
presses, navigation calls), so the restyle (borderless + `shadow.surface` on mobile,
`border.input` + no shadow on web, uppercase `label.field`) changed those three screens'
appearance without touching anything those tests actually assert. This confirms plan.md's
disclosed side effect landed exactly as scoped: visual change only, zero behavioral regression.
**No test edit was made** — there was nothing to fix.

### T053 — Contrast test + camera-import grep re-check

`src/theme/contrast.test.ts` (T008, extended with the `text.danger` pairing in Run 17's Finding
4) is green — confirmed both standalone and as part of the T052 full-suite run above (`PASS
src/theme/contrast.test.ts` in the suite list).

Re-ran the camera-import guard one more time, after all Phase 4/5 edits:

```
grep -rn "expo-camera\|expo-image-picker" src/features/scanner/
```

Output: 15 matches, every one of them either (a) inside a `.test.tsx` file's own guard
assertion string (e.g. `expect(importLines.some((line) => /expo-camera/.test(line))).toBe(false)`
in `ScanSearchField.test.tsx`, `RecentScansList.test.tsx`, `ScanShellScreen.test.tsx`,
`UploadDropzone.test.tsx`, `EmptyResultsPanel.test.tsx`, `Viewfinder.test.tsx`), or (b) a code
comment documenting the prohibition (`UploadDropzone.tsx`: "no expo-image-picker call, no press
handler"; `Viewfinder.tsx`: "expo-camera). The camera glyph below is a static icon..."). **Zero
actual `import`/`require` lines** reference either package anywhere under
`src/features/scanner/`. No import creep found.

### T054 — Final `./init.sh` end-to-end run

Ran `./init.sh` with no `--skip-*` flags:

```
▶ 1/8 Checking prerequisites
✅ [OK] Prerequisites: node v20.20.2, npm v10.8.2

▶ 2/8 Environment file
✅ [OK] Env file: .env already exists, left untouched

▶ 3/8 Installing dependencies
✅ [OK] npm install: dependencies installed

▶ 4/8 Type-checking
✅ [OK] Type-check: no type errors

▶ 5/8 Expo config/dependency health (expo-doctor)
⚠️  [WARN] expo-doctor: issues found (non-blocking) — Found outdated dependencies

▶ 6/8 Native dependency alignment
⚠️  [WARN] Native deps: peers declared, but some package versions differ from the pinned SDK's
   expectations (non-blocking):
     expo-image-picker@15.0.7 - expected version: ~15.1.0
     react-native@0.74.0 - expected version: 0.74.5
     react-native-safe-area-context@4.10.1 - expected version: 4.10.5
     @types/react@18.3.31 - expected version: ~18.2.79
     typescript@5.9.3 - expected version: ~5.3.3

▶ 7/8 Running test suite
✅ [OK] Tests: all tests passed

▶ 8/8 Bundle export smoke checks (web, iOS, Android)
✅ [OK] Build check (web): web bundle exported cleanly
✅ [OK] Build check (ios): ios bundle exported cleanly
✅ [OK] Build check (android): android bundle exported cleanly

==================== init.sh summary ====================
✅ [OK] Prerequisites: node v20.20.2, npm v10.8.2
✅ [OK] Env file: .env already exists, left untouched
✅ [OK] npm install: dependencies installed
✅ [OK] Type-check: no type errors
⚠️  [WARN] expo-doctor: issues found (non-blocking)
⚠️  [WARN] Native deps: version drift (non-blocking, see package list above)
✅ [OK] Tests: all tests passed
✅ [OK] Build check (web): web bundle exported cleanly
✅ [OK] Build check (ios): ios bundle exported cleanly
✅ [OK] Build check (android): android bundle exported cleanly
===========================================================
RESULT: SUCCESS (10/10 stages passed)
```

**`RESULT: SUCCESS`** — all mandatory stages green. The two non-blocking WARN stages
(`expo-doctor`, native-dependency-alignment) list version drift on `expo-image-picker`,
`react-native`, `react-native-safe-area-context`, `@types/react`, and `typescript` — **none of
this feature's three T001 dependencies** (`expo-font`, `expo-linear-gradient`,
`@expo-google-fonts/playfair-display`) appear in either warning list, confirming T001's
`expo install`-managed alignment held clean through the entire feature, exactly as T054
requires ("native-dependency-alignment clean for the three new dependencies"). The drifted
packages are pre-existing SDK-pin staleness unrelated to `006-visual-identity` (present before
this feature started, per Run 1's own T001 alignment check finding zero drift on the three new
packages specifically) — out of this batch's scope to fix, and not a regression this feature
introduced.

All three bundle-export stages (web/iOS/Android) passed cleanly, confirming the font
(`expo-font`/`@expo-google-fonts/playfair-display`) and gradient (`expo-linear-gradient`)
additions, and the `/scan` file removal (`ScanPlaceholderScreen.tsx`/`.test.tsx`, T046), didn't
break any target's bundle.

### Findings

No genuine behavioral regression found. No test needed fixing (T052 required zero edits — the
three at-risk pre-existing test files already asserted behavior/role/text, not visual literals,
so the `FormField` restyle's appearance-only change left them all green with no modification).

### Task IDs now `[X]`

- T052, T053, T054 (all three marked `[X]` in `specs/006-visual-identity/tasks.md`)

**All 54 tasks in `specs/006-visual-identity/tasks.md` are now `[X]`. The `006-visual-identity`
feature is complete.**

### Files changed this run

- `specs/006-visual-identity/tasks.md` — T052, T053, T054 marked `[X]`.
- `progress/impl_006-visual-identity.md` — this section.

No source file under `app/`, `src/domain`, `src/lib`, `src/features`, or `src/theme` was
touched in this run — verification found nothing to fix.

### Deviations / notes for sign-off

None. The feature closes with zero unresolved findings from this final gate. The two
non-blocking `./init.sh` WARN stages are pre-existing, unrelated dependency drift (not
introduced by, and not in scope for, this feature) and don't affect `RESULT: SUCCESS`.

## Run 19 (2026-08-05) — Follow-up amendment: remove `SignInForm`'s stray "Sign in" heading, promote `LoginScreen`'s brand title to the sole heading

Not a new task from `tasks.md` — `006-visual-identity` was already fully complete (all 54 tasks
`[X]` as of Run 18). This is a post-sign-off, human-requested amendment: the reviewer looked at
the running app and asked to remove `SignInForm.tsx`'s `{t("signInTitle")}` heading (flagged as
an open sign-off question in its own code comment since Run 9 — see lines 85-90 of the
pre-change file), since it isn't part of `docs/design-brief-visual-identity.md` §4's content
order and doesn't appear in the mockups. Sign-off was given on the explicit condition that the
accessibility regression this would otherwise cause (zero headings left on the sign-in view) be
fixed atomically in the same change, not deferred again.

### What changed

1. **`src/features/identity/SignInForm.tsx`** — removed the `<Text style={styles.title}
   accessibilityRole="header">{t("signInTitle")}</Text>` element and its explanatory comment
   (the one that deferred this exact decision to sign-off), plus the now-unused `styles.title`
   StyleSheet entry. Nothing else in the file changed — `onSubmit`/`onForgotPassword`/
   `isSubmitting`/`serverError`/`confirmationMessage`/`initialEmail` props, the
   react-hook-form + `zodResolver(signInSchema)` wiring, and every other rendered element are
   untouched.

2. **`src/features/identity/LoginScreen.tsx`** — the brand block's `{t("brandTitle")}` (`"Draw a
   Card"` / `"Draw a Card"` — same string in both locales) `<Text>`, previously plain, now carries
   `accessibilityRole="header"`. Added an inline comment explaining why (this is now the sign-in
   view's single heading, replacing the removed one, and matches the human's mockups where the
   visual heading genuinely is "Draw a Card"). This block only renders in the `mode === "sign-in"`
   branch, same as before — no change to when/whether it renders.

3. **`src/domain/i18n/copy/login.ts`** — removed the `signInTitle` key from both the `es` dict
   (`"Iniciar sesión"`) and the `en` dict (`"Sign in"`), plus its now-one-line-shorter section
   comment. `en`'s type is `Record<keyof typeof es, string>`, so removing the key from `es` also
   makes it a compile error to leave it in `en` — both had to go together, which `tsc` enforced
   (confirmed: leaving one and not the other fails the type check, tried locally before settling
   on removing both in the same edit).

### Verified the other two `mode` branches are genuinely unaffected

Read `RequestPasswordResetForm.tsx` (line 94) and `ResetPasswordForm.tsx` (line 165) directly
rather than assuming: each already renders its own `<Text accessibilityRole="header">` title
(`requestResetTitle` / `resetCodeTitle`), and `LoginScreen.tsx`'s brand block is scoped to the
`mode === "sign-in"` return branch only (confirmed by reading the full component — the
`signInSucceeded`, `"request-reset"`, and `"reset-with-code"` branches each return before reaching
the brand-block JSX). So every one of the login screen's four view-states
(sign-in / signing-in-transition / request-reset / reset-with-code) still has exactly one heading
after this change — sign-in via the promoted `brandTitle`, the other two via their pre-existing
titles, and the transition view intentionally has none (it's a live-region `alert`, not a
navigable view with its own heading, same as before this change).

### Test suite check (no test needed changing)

Grepped the whole suite before touching anything for `signInTitle`, `"Iniciar sesión"`, `"Sign
in"` as a literal, and any `getByRole("header")`/`role: "header"` query:

- `SignInForm.test.tsx` — no assertion on the removed heading (its own T029 comment already
  documents it queries `loginCopy.es`/`loginCopy.en` values directly rather than duplicating
  literals, so the dictionary key's removal has no test surface to update).
- `LoginScreen.test.tsx` — line 363's `expect(getByText(signInCopy.brandTitle)).toBeTruthy()`
  (from the T035 brand-block test) queries by text only, not by role, so it's unaffected by
  adding `accessibilityRole="header"` to that same element.
- `src/domain/i18n/copy/login.test.ts` — its three tests (`es`/`en` key-parity, no-empty-values,
  Spanish-orthography spot-check) are all keyed off `Object.keys(...)`/specific unrelated keys
  (`passwordLabel`, `forgotPassword`, `termsLink`, `privacyLink`) — none reference `signInTitle`,
  so removing the key from both dicts together keeps key-parity intact and needs no test edit.

Confirmed no test anywhere in the repo referenced `signInTitle` (`grep -rn "signInTitle"` across
`src/` and `app/` returned only the new explanatory comment in `LoginScreen.tsx` after the
change, zero remaining references before it).

### Commands run

```
npx tsc --noEmit          # clean, zero errors
npm test -- --silent      # 63 suites / 394 tests — unchanged from baseline
```

```
Test Suites: 63 passed, 63 total
Tests:       394 passed, 394 total
Snapshots:   0 total
Time:        2.222 s
```

**394/394, 63/63 — identical to the Run 18 baseline.** No test count change, because (as
predicted by the grep above) no existing test referenced the removed heading or key.

### Manual smoke check

No screenshot/browser tool was available in this session, so verification was done via the dev
server's compiled web bundle rather than a visual screenshot:

```
npm run web   # expo start --web, booted clean (Metro Bundled, Web Bundled, no errors)
```

Fetched the real compiled bundle Metro serves for web (`GET
/node_modules/expo-router/entry.bundle?platform=web&dev=true`, 200, ~6.3MB) and grepped it
directly:

- `"Iniciar sesión"` → 0 matches (confirms the removed Spanish string is genuinely gone from
  the shipped output, not just the source)
- `"signInTitle"` → 0 matches (confirms the dead key was fully removed, not left as an unused
  but still-bundled string)
- `"Draw a Card"` → 5 matches (confirms the brand title — now the sole heading — is still
  present and bundled correctly)

Combined with the RNTL-based `LoginScreen.test.tsx`/`SignInForm.test.tsx` suites (which render
the real component trees, not mocks, and already passed above), this covers both "the markup
change compiled and shipped" and "the components render without throwing and with the expected
text," which is what Level 2/3 verification calls for here. Killed the dev server
(`pkill -f "expo start"`) after the check.

### Task IDs

No `tasks.md` task ID changes — this amendment is out-of-scope of `006-visual-identity`'s task
list by design (a post-completion, human-requested fix), so `specs/006-visual-identity/tasks.md`
was not touched, per the instruction not to touch spec/plan/tasks scope for this follow-up.

### Files changed this run

- `src/features/identity/SignInForm.tsx` — removed the `signInTitle` heading `<Text>`, its
  deferral comment, and the unused `styles.title` entry.
- `src/features/identity/LoginScreen.tsx` — promoted `brandTitle`'s `<Text>` to
  `accessibilityRole="header"` with an explanatory comment.
- `src/domain/i18n/copy/login.ts` — removed the `signInTitle` key from both `es` and `en`.
- `progress/impl_006-visual-identity.md` — this section.

### Deviations / notes for sign-off

None — this run did exactly what was asked (remove the stray heading, promote the brand title to
fill the accessibility gap, drop the now-dead i18n key in both locales) and verified no test or
FR (005-login's FR-006, specifically — `LoginScreen.tsx` still has zero `useRouter()` calls,
confirmed by re-reading the full file during this change) regressed.
