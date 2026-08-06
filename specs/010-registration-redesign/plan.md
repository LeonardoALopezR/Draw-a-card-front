# Implementation Plan: Registration Redesign (`Crear cuenta` — Usuario + Tienda)

**Branch**: `010-registration-redesign` | **Date**: 2026-08-06 | **Spec**: `specs/010-registration-redesign/spec.md`

**Input**: Feature specification from `specs/010-registration-redesign/spec.md`

**Note**: Following `001-registration-kyc`'s and `006-visual-identity`'s precedent, this plan
folds Phase 0 (research) and Phase 1 (data model / quickstart) into this single file rather than
separate `research.md`/`data-model.md`/`quickstart.md` documents — there is no external
interface-contract surface beyond the backend's own already-specified REST API, so a
`/contracts/` directory would only duplicate it.

## Summary

Replace `app/(auth)/register.tsx`'s rendered content with a single `Crear cuenta` screen carrying
a `Usuario`/`Tienda` segmented control, restyled to `006-visual-identity`'s token layer, with the
`Usuario` tab's `Nombre completo` already split into three inputs by the existing
`profileFormSchema` (no schema change needed there) and its `Nacionalidad` field upgraded to a
catalog-backed picker via a new shared `Select` primitive. The backend interaction stays the
existing three calls (register → verify phone → profile); this feature's central technical
decision is how the *profile-step* fields collected on the same screen as registration survive the
phone-verification interruption without ever being shown to the user as a second form, and without
being persisted anywhere beyond the active flow (Constitution Principle III) — solved via a small,
in-memory-only "registration draft" module, consumed exactly once by `verify-phone.tsx`'s success
handler. `app/(auth)/profile.tsx` remains a real, separate route — no longer the primary journey
step, but the explicit recovery screen for a failed auto-submission or an abandoned/resumed
registration, restyled for visual consistency but structurally unchanged.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node 20 (per `.nvmrc`)

**Primary Dependencies**: Expo SDK 51 + expo-router, React Query (TanStack Query) v5, React Hook
Form + Zod, `@supabase/supabase-js` — all already in `package.json`, unchanged. **One new
dependency**: `@react-native-community/datetimepicker` (`~8.0.1`, the Expo-SDK-51-aligned version
per Expo's own compatibility table), per spec.md Clarification 4 — native date picker on
iOS/Android; web uses the browser's native `<input type="date">` via a `.web.tsx` split, so no web
dependency is added. No new dependency for the nationality picker — see Research Decisions below
for why a dependency-free custom `Select` is chosen over a picker package.

**Storage**: N/A directly (Constitution II) — all persistence is via the backend API. The one new
piece of client-side state this feature introduces (the in-flight profile-field draft) is
deliberately **not** storage at all — a plain in-memory module-level variable, cleared on use,
never touching `expo-secure-store`/web storage (see Research Decisions, "Flow architecture").

**Testing**: Jest + `jest-expo` + `@testing-library/react-native`, already installed
(`001-registration-kyc`, T001). No new test-tooling task needed for this feature.

**Target Platform**: iOS, Android, and web (react-native-web) from the one Expo codebase
(Constitution I).

**Project Type**: Single Expo (React Native) app — `app/` (expo-router screens), `src/domain`
(portable logic), `src/lib` (Expo/RN adapters), `src/features/identity` (screen UI),
`src/features/ui` (shared cross-feature primitives), `src/theme` (design tokens).

**Performance Goals**: No numeric latency target beyond spec.md's SC-001 (end-to-end flow under 5
active minutes, once backend `015` ships). Standard React Query defaults.

**Constraints**:
- `005-login`'s `KYC_ROUTE_TARGETS.unauthenticated → '/login'` mapping and
  `useKycGate()`/`resolveKycRoute()`/`src/domain/kyc-gate.ts`/`app/_layout.tsx` come out
  byte-for-byte unchanged (spec.md FR-011) — this feature only changes what
  `app/(auth)/register.tsx` renders and adds one branch to `app/(auth)/verify-phone.tsx`'s success
  handler; it does not touch the gate's route targets, `resolveKycRoute()`'s branch logic, or
  `app/_layout.tsx` at all.
- Backend `015-registration-profile-support` (nationality catalog, business-profile relaxation) is
  `pending`, unspec'd. This feature's tasks isolate everything that depends on it (see tasks.md)
  so the rest can ship and be verified independently.
- Backend `004-session-authentication` (`done`, 2026-08-06) retired the `X-User-Id` mechanism
  entirely — see spec.md Assumptions. No functional change is required of this feature for that;
  one small doc-correction task is included so the stale comments describing `X-User-Id` as
  load-bearing don't mislead a future reader.

**Scale/Scope**: 2 user stories (Usuario P1/MVP, Tienda P2). ~3 new shared UI primitives
(`SegmentedControl`, `Select` + `.web.tsx`, `DateField` + `.web.tsx`), 2 new combined Zod schemas,
1 new small in-memory draft module, restyles of 2 existing screens
(`RegistrationForm.tsx`→replaced, `ProfileForm.tsx`→restyled in place), 1 new domain module
(`nationality.ts`) with its real backend wiring explicitly isolated behind backend `015`.

## Constitution Check

*GATE: Must pass before task breakdown. Re-checked after Phase 1 design below.*

| Principle | Check | Status |
|---|---|---|
| I. One Codebase, Three Targets | One screen tree; iOS/Android/web differences are `.ios.tsx`/`.android.tsx`/`.web.tsx` variants of `Select`/`DateField`, not separate apps. | PASS |
| II. Backend Is the Source of Truth | Every field this feature collects reaches the backend via the existing `src/domain/registration.ts`/`profile.ts` calls through `src/domain/api-client.ts`; the nationality catalog is read via a new backend call (once `015` ships), never a bundled static list. | PASS |
| III. Auth Goes Through the Provider SDK | Unchanged — this feature adds no new auth primitive. The new in-memory registration-draft module is explicitly *not* a session/auth mechanism; it is scoped to Constitution III's "never persist CURP/RFC beyond the flow's lifetime" requirement (see Research Decisions). | PASS |
| IV. Business Logic Stays Portable | Combined-tab Zod schemas, the draft module's read/write functions, and `mapProfileError`-style error interpretation stay in `src/domain`/`src/lib`; `CrearCuentaForm.tsx`/`ProfileForm.tsx` render and call into them only. Platform variance (`Select`, `DateField`) isolated via file-extension convention. | PASS |
| V. Screen/Component Structure Mirrors Product Domains | All new UI lives under `src/features/identity/` (screen-specific) or `src/features/ui/` (the two genuinely reusable primitives, `SegmentedControl`/`Select`, matching where `PrimaryButton`/`OrDivider`/`StatusPill` already live) — mirrors the backend's `identity` module exactly as `001`/`005` already established. | PASS |
| VI. Spec Before Code, One Spec Per Feature | Single `spec.md` covers both tabs, with the design brief's platform notes captured inline (per-story "Platform notes" subsections), not as separate documents. | PASS |
| VII. Accessible and Responsive by Default | `SegmentedControl`/`Select`/`DateField` all specify roles/keyboard operability/44×44 targets as explicit requirements (spec.md FR-015), verified at the task level, not left implicit. Any new color token goes through `src/theme/contrast.ts`'s real WCAG check (FR-006), not eyeballed. | PASS (verified at task level) |
| VIII. Local-First Development | Registration itself (`POST /identity/register(/business)`) needs no bearer token and is fully exercisable against a local `docker compose up` backend today. Phone-verification/profile calls need a real Supabase-issued JWT the backend can verify — genuinely not exercisable end-to-end against any backend configuration available today (see spec.md Assumptions) — disclosed explicitly in tasks.md's verification tasks rather than silently assumed away. | PASS (with an honestly-disclosed, pre-existing-class-of gap, not a new violation) |

No violations requiring a Complexity Tracking entry.

## Research Decisions

### 1. Flow architecture: one screen, an in-memory draft, and the phone-verification interruption auto-submitting the profile

**Decision**: `app/(auth)/register.tsx` is rewritten to render a new `CrearCuentaScreen`
(`src/features/identity/CrearCuentaScreen.tsx`), composing a new `UsuarioForm`/`TiendaForm` pair
behind a `SegmentedControl`. Both forms validate against new **combined** Zod schemas (Research
Decision 2) covering every field on that tab, including the profile-step fields the mockup shows
alongside the registration fields. On submit:

1. The screen calls the existing, unchanged `submitPersonalRegistration`/
   `submitBusinessRegistration` (`src/domain/registration.ts`) with only the four registration
   fields (email/password/phone/username) — the real backend contract still only accepts those at
   this step (spec.md FR-008).
2. On success, the screen writes every *other* collected field (name, birth date, nationality,
   CURP, RFC, or the business fields) into a **new in-memory-only module**,
   `src/lib/registration-draft.ts`, via `setRegistrationDraft(draft)` — deliberately mirroring
   `src/lib/api.ts`'s existing `currentUserId` module-level-variable pattern (a precedent already
   established and reviewed in this repo), not a new storage mechanism. Nothing is written to
   `expo-secure-store`, web `localStorage`, a route param, or a URL query string at any point —
   satisfying Constitution III's "CURP/RFC never persisted beyond the flow's lifetime" as literally
   as possible: it exists only as a JS heap value for as long as the current process is alive and
   the draft hasn't been consumed yet.
3. The screen navigates to `/verify-phone` exactly as it does today — **no change to this
   navigation target**.
4. `app/(auth)/verify-phone.tsx`'s existing success handler (today: an unconditional
   `router.replace("/profile")` after `verifyPhoneCode` resolves) gains **one new branch**: it
   calls `consumeRegistrationDraft()` (reads the draft **and** clears it in the same call, so it
   can never be read twice or accidentally replayed) before deciding where to go next:
   - **Draft present** (the common case — the user registered and verified in the same session):
     immediately call `submitProfile(api, draft, { isBusiness })` with no intermediate screen. On
     success, `router.replace("/tutorial")` — the same destination `profile.tsx` already routes to
     today. On failure, `router.replace("/profile")` (spec.md FR-010) — the draft has already been
     cleared by `consumeRegistrationDraft()`, so this is a genuine "please re-enter your profile
     information" recovery screen, not a silent retry with cached sensitive values.
   - **Draft absent** (a returning user in a genuinely new JS session — the app was closed between
     registering and verifying, or between verifying and completing the profile on a prior
     attempt): fall through to **exactly today's existing behavior**,
     `router.replace("/profile")`. This is not new logic; it is what `verify-phone.tsx` already
     does unconditionally today, now reached only when there is nothing to auto-submit.
5. `app/(auth)/profile.tsx` and `ProfileForm.tsx` are **structurally unchanged** — same fields, same
   `submitProfile` call, same `isBusiness`-conditional business-field block — restyled to this
   feature's shared visual tokens (FormField/PrimaryButton, sentence-case labels) so it doesn't
   look jarringly out of place next to the new screen, but it gains no segmented control and no new
   fields. It was already `005`/`004`'s established recovery/resumability screen; this feature
   repurposes that existing role rather than inventing a second one.

**Rationale**: satisfies spec.md's FR-008/FR-009 (`Registrarse` behind one screen, values survive
the interruption, never shown as a second form on the happy path) while making **zero change** to
`useKycGate()`/`resolveKycRoute()`/`KYC_ROUTE_TARGETS` (FR-011) — the gate's existing
`verify-phone`/`profile`/`tutorial`/`main` routing states and their targets are completely
untouched; only what happens *inside* `verify-phone.tsx`'s already-existing success handler
changes, and only by adding one conditional branch in front of its existing behavior. Mirrors
`005-login`'s own precedent for exactly this class of problem (`LoginScreen.tsx`'s forgot-password
sub-flow staying local view-state rather than a route change) at the "don't invent a new mechanism
when local state solves it" level, while still using real, separate routes for `verify-phone`
and `profile` (unlike `005-login`'s all-local-state choice) — because, unlike `005`'s
forgot-password flow, this one has a genuine resumability requirement across a killed app/browser
tab that only a real route (reachable by the gate on a cold boot) can serve.

**Alternatives considered**:
- *Pass the profile draft through router params.* Rejected outright — `expo-router`'s params
  serialize into the URL on web (visible in browser history/devtools/server logs for a web
  deployment) and Metro/React Navigation params are not designed to carry sensitive PII like CURP;
  directly conflicts with Constitution III.
- *Persist the draft to `expo-secure-store`/web storage so it survives a killed app.* Rejected —
  this is exactly the case Constitution III's "never persisted beyond the flow's lifetime" rules
  out; a killed-app resumability case is explicitly handled instead by falling through to the
  existing `/profile` recovery screen (re-entry), which is the honest tradeoff spec.md's Edge
  Cases section states plainly rather than glosses over.
- *Collapse `verify-phone`/`profile` into local view-state on the same screen, like
  `005-login`'s forgot-password flow.* Rejected — that pattern fits a flow with no genuine
  cross-session resumability requirement. This flow already has one (`phoneVerifiedAt`,
  `001-registration-kyc`'s own resumable-registration marker), and the existing gate already routes
  a returning user to a real `/verify-phone` or `/profile` route based on it; keeping those as real
  routes preserves that resumability for free instead of having to rebuild it.

### 2. Combined per-tab Zod schemas

**Decision**: two new schemas in `src/domain/schemas.ts`:
- `usuarioCrearCuentaSchema = personalRegistrationSchema.merge(profileFormSchema)` — every Usuario
  field in one shape, reusing both existing schemas' field-level rules verbatim (no duplicated
  validation logic).
- `tiendaCrearCuentaSchema = businessRegistrationSchema.merge(z.object({ commercialName:
  z.string().min(1, ...), rfc: z.string().min(1, ...), fiscalAddress: z.string().min(1, ...),
  tosAccepted: z.literal(true, ...), privacyAccepted: z.literal(true, ...) }))` — **a new,
  narrower shape**, not `businessProfileFormSchema` (which still extends `profileFormSchema` and
  would incorrectly require personal fields the Tienda tab never collects). This narrower shape is
  named `tiendaProfileFormSchema` where it's reused standalone (see below) and represents what the
  backend's `profileBusinessSchema` **will** accept once `015`'s User Story 2 relaxes it — not
  what it accepts today (see Research Decision 5's disclosure).

`CrearCuentaScreen`'s submit handler splits the validated combined object back into the four
registration fields (for step 1's `submitPersonalRegistration`/`submitBusinessRegistration` call)
and the remainder (the draft written for step 2's later `submitProfile` call) — a plain object
destructure, no new domain function needed for the split itself.

**Rationale**: React Hook Form validates the whole visible form as one unit (matching the mockup,
which shows no visual seam between "registration fields" and "profile fields") without inventing a
second, hand-rolled validation pass, and without changing `personalRegistrationSchema`/
`profileFormSchema`/`businessRegistrationSchema` themselves — every existing consumer of those
(`profile.tsx`'s fallback screen, their existing tests) is unaffected.

**Alternatives considered**: hand-rolling one flat schema per tab from scratch — rejected, would
duplicate every field-level rule already correctly expressed in the existing schemas, the exact
kind of drift risk `docs/conventions.md`'s "reuse the schema for both client validation and typing
the payload" guidance exists to prevent.

### 3. Three new shared UI primitives

- **`src/features/ui/SegmentedControl.tsx`** — a generic, full-width, two-(or-more)-segment pill
  control (`options: { label, value }[]`, `value`, `onChange`), styled per the design brief §2
  (active segment: `brand.primary` fill/`brand.onPrimary` bold label; inactive: the new
  `colors.segment.inactiveTrack` token, `text.secondary` label). Builds on the exact accessible
  `radiogroup`/`radio` + `aria-checked` pattern `RegistrationForm.tsx`'s existing account-type
  toggle already established (T024, `001-registration-kyc`) — not a new accessibility pattern, a
  generalization of an already-reviewed one. No platform split needed — identical, dependency-free
  `Pressable`s render correctly on all three targets.
- **`src/features/ui/Select.tsx` + `Select.web.tsx`** — the new nationality-picker primitive
  (spec.md FR-012), generic (`options: { value, label }[]`, `value`, `onChange`, `label`,
  `placeholder`, `loading`, `error`, `onRetry`). **Deliberately dependency-free** (see Alternatives
  below): a `Pressable` styled like `FormField`'s input pill, opening a `Modal` containing a
  `TextInput` filter + a `FlatList` of options. The `.web.tsx` variant swaps `Modal` for an
  absolutely-positioned dropdown panel (matching how web dropdowns conventionally behave — no
  full-screen takeover) and adds real keyboard handling (`ArrowDown`/`ArrowUp` to move the
  highlighted option, `Enter` to choose it, `Escape` to close, restoring focus to the trigger) —
  the platform split is exactly what Constitution IV's `.web.tsx` convention exists for: two
  genuinely different interaction models for the same semantic control, not a cosmetic difference.
- **`src/features/ui/DateField.tsx` + `DateField.web.tsx`** — wraps
  `@react-native-community/datetimepicker` on iOS/Android; the `.web.tsx` variant wraps a plain
  `<input type="date">` (rendered via `react-native-web`'s pass-through of unrecognized native DOM
  props, the same mechanism `LoginScreenChrome.web.tsx`'s `backgroundImage` already relies on).
  Both variants emit a `Date` to match `profileFormSchema`'s existing `birthDate: z.coerce.date()`
  field — **no schema change**.

**Rationale for a dependency-free `Select`** rather than a package
(`@react-native-picker/picker`, a UI-kit's select component, etc.): a picker package would add a
second, less-controllable styling system to a screen whose entire point is matching this app's own
token layer precisely (spec.md FR-006 — no raw literal, and the design brief's precise pill/border
geometry); a modal+list built from primitives already in `react-native` core needs zero new
dependency at all, unlike the date field (Clarification 4 already justifies that one dependency
explicitly — this repo does not take a second, unjustified one in the same feature for a control
that doesn't need OS-level native chrome the way a date/calendar picker genuinely benefits from).

### 4. Two new theme tokens, one contrast-checked

- **`colors.segment.inactiveTrack = "#EDEEF5"`** (`src/theme/colors.ts`) — the design brief's own
  suggested value. **Computed, not eyeballed** (Constitution VII, mirroring `006-visual-identity`'s
  "Recorded default 2" precedent): `contrastRatio(colors.text.secondary, "#EDEEF5")` = **4.63:1**,
  clearing the 4.5:1 AA floor (computed directly via `src/theme/contrast.ts`'s real formula, not
  approximated) — a new `src/theme/contrast.test.ts` case regression-guards this pairing exactly
  like every existing one.
- **`typography.label.fieldSentence`** (`src/theme/typography.ts`) — the design brief's explicit
  "sentence case here, not uppercase" instruction (§2) conflicts with the existing
  `typography.label.field` token, which every other screen in this app (including `005-login`'s
  `SignInForm`) renders in uppercase via `textTransform: "uppercase"`. Rather than changing
  `label.field`'s existing behavior (which would silently re-style every other screen that already
  uses it), this feature adds a **sibling token** — same `fontSize`/`fontWeight`/`color` as
  `label.field`, no `textTransform`/`letterSpacing` — and gives `FormField.tsx`/`FormField.web.tsx`
  a new optional `labelCase?: "uppercase" | "sentence"` prop, **defaulting to `"uppercase"`** so
  every existing call site (`SignInForm`, `RequestPasswordResetForm`, etc.) is byte-for-byte
  unaffected; only this feature's new forms pass `labelCase="sentence"`. No color changes, so no
  new `contrast.test.ts` case is needed for this token (color is inherited from `text.secondary`,
  already covered).

### 5. Nationality catalog: real backend contract not yet defined, isolated explicitly

**Decision**: `src/domain/nationality.ts` exports `fetchNationalities(client: ApiClient):
Promise<NationalityOption[]>`, calling an **assumed** `GET /identity/nationalities` (or wherever
backend `015`'s own spec ultimately places it — this path is a planning assumption, not a
confirmed contract, and MUST be reconciled once `015` has a spec of its own) returning
`{ value: string, label: string }[]`. Wired into the Usuario tab's `Nacionalidad` field via a
plain React Query `useQuery` (`src/features/identity/useNationalities.ts`, the one place in this
feature that needs a hook rather than a pure `src/domain` function, since it's UI-lifecycle-bound
caching — same placement precedent as `useKycGate.ts`). The `Select` primitive's `loading`/`error`/
`onRetry` props render the loading/retry state spec.md's Edge Cases require; there is **no
hardcoded fallback list** at any layer (spec.md FR-012 — the human explicitly chose a backend
catalog over a static list specifically so it stays editable server-side).

**Explicitly isolated in tasks.md**: every task that touches `nationality.ts`/
`useNationalities.ts`'s real network call, or that claims the Usuario tab's nationality field
works end-to-end, is labeled and sequenced so it's unmistakably gated on backend `015` User Story
1 shipping — the `Select` primitive itself (Research Decision 3) and its wiring into the form are
**not** gated (they're generic/testable with fixture data today).

### 6. Web card layout reuses the existing 660px auth-card width, not the mockup's ~910px

**Decision**: the new web layout's centered card reuses `LoginScreenChrome.web.tsx`'s existing
`CARD_MAX_WIDTH = 660` value — promoted to a small shared constant,
`AUTH_CARD_MAX_WIDTH` (`src/features/identity/authCardLayout.ts`, a plain exported number, no
React import needed), that both `LoginScreenChrome.web.tsx` and this feature's new
`CrearCuentaScreen.web.tsx` chrome import, rather than each hardcoding `660` independently.

**Rationale**: the design brief itself instructs "cap it at the same width the rest of the app's
web surfaces use rather than introducing a one-off" (§2) — `660` (from `/login`) is the **only**
existing precedent for "a card on a web auth surface" in this codebase (confirmed by grepping every
`maxWidth`/`*_MAX_WIDTH` in `src/`/`app/` on 2026-08-06); the mockup's own ~910px is not adopted,
per that same explicit instruction against a one-off.

**Alternatives considered**: matching the mockup's ~910px literally — rejected per the design
brief's own explicit instruction; a new, feature-local constant duplicating `660` instead of
sharing `LoginScreenChrome.web.tsx`'s — rejected as an avoidable, silent-drift-risk duplication of
a value both screens now derive their meaning from ("the app's web auth-card width").

### 7. `X-User-Id` doc-correction (non-functional)

**Decision**: one small task updates the stale doc comments in `src/lib/api.ts`,
`src/domain/registration.ts`, and `src/domain/profile.ts` that describe the `X-User-Id` header as
load-bearing/dev-only-trusted — per spec.md Assumptions, backend `004-session-authentication`
deleted that trust path entirely on 2026-08-06. The header-sending code itself
(`setCurrentUserId`/`getHeaders`) is **left in place, unremoved** — it is now an inert no-op
against the real backend (the backend simply ignores an unrecognized header), and safely removing
it (auditing every call site, confirming no test depends on the header literal) is a
separable, small cleanup with zero user-visible effect, out of scope for a screen-redesign
feature. Comments are corrected so a future reader isn't misled into believing the header still
does anything; no behavior changes.

### 8. `/profile`'s business-field block stays as-is for now — a known, disclosed, `015`-dependent follow-up

**Decision**: `ProfileForm.tsx`'s existing `isBusiness`-conditional block (still validated against
today's `businessProfileFormSchema`, which still requires personal fields) is **not** changed to
match the Tienda tab's shorter field set. This is deliberate: today's real backend
`profileBusinessSchema` genuinely still requires those personal fields (confirmed 2026-08-06,
`015` User Story 2 not yet shipped), so `/profile`'s current shape is the one that actually
succeeds against the backend as it exists right now. Changing it to match the Tienda tab's shorter
field set today would make the fallback screen **fail** against the real backend for exactly the
population (Tienda users who reach it) it exists to help. **Recorded as an explicit follow-up**,
sequenced in tasks.md right alongside the other backend-`015`-gated work: once `015` User Story 2
ships, `/profile`'s business branch should switch to `tiendaProfileFormSchema` (Research Decision
2) to match. Not fixed here — flagged, not silently left inconsistent.

## Project Structure

### Documentation (this feature)

```text
specs/010-registration-redesign/
├── spec.md                # Feature spec — no open [NEEDS CLARIFICATION] markers
├── plan.md                # This file
├── tasks.md                # Phase 2 output (/speckit-tasks)
└── checklists/
    └── requirements.md    # Spec quality checklist
```

### Source Code (repository root)

```text
app/(auth)/
├── register.tsx                       # REWRITTEN — renders CrearCuentaScreen instead of
│                                       # RegistrationForm; same submit-then-navigate-to-
│                                       # verify-phone shape, now also writes the registration
│                                       # draft on success (Research Decision 1)
├── verify-phone.tsx                   # EXTENDED — one new branch in the success handler:
│                                       # consumeRegistrationDraft() -> auto-submitProfile ->
│                                       # /tutorial or /profile; falls through to today's
│                                       # unconditional /profile redirect when no draft exists
└── profile.tsx                        # UNCHANGED logic; ProfileForm restyled (see below)

src/features/identity/
├── CrearCuentaScreen.tsx              # NEW — composes SegmentedControl + UsuarioForm/TiendaForm,
│                                       # owns the account-type toggle and the submit/draft-write
│                                       # orchestration (Research Decision 1)
├── UsuarioForm.tsx                    # NEW — usuarioCrearCuentaSchema-validated form
├── TiendaForm.tsx                     # NEW — tiendaCrearCuentaSchema-validated form
├── CrearCuentaScreen.web.tsx          # NEW — web chrome (centered card, AUTH_CARD_MAX_WIDTH)
├── authCardLayout.ts                  # NEW — AUTH_CARD_MAX_WIDTH shared constant (Research
│                                       # Decision 6), also imported by LoginScreenChrome.web.tsx
├── useNationalities.ts                # NEW — React Query hook wrapping
│                                       # src/domain/nationality.ts's fetchNationalities()
│                                       # (Research Decision 5, explicitly 015-gated for its real
│                                       # network behavior)
├── RegistrationForm.tsx               # REMOVED — fully superseded by UsuarioForm/TiendaForm;
│                                       # its established a11y patterns (radiogroup/aria-checked)
│                                       # carry forward into SegmentedControl, not this file
├── ProfileForm.tsx                    # RESTYLED IN PLACE — same fields/schema/props, tokens only
└── FormField.tsx / FormField.web.tsx  # EXTENDED — new optional labelCase prop (Research
                                       # Decision 4), default unchanged

src/features/ui/
├── SegmentedControl.tsx               # NEW (Research Decision 3)
├── Select.tsx                         # NEW
└── Select.web.tsx                     # NEW

src/features/identity/ (continued — date field lives here, not src/features/ui, since it's
                         profile-specific rather than a general-purpose primitive)
├── DateField.tsx                      # NEW
└── DateField.web.tsx                  # NEW

src/domain/
├── schemas.ts                         # EXTENDED — usuarioCrearCuentaSchema,
│                                       # tiendaCrearCuentaSchema/tiendaProfileFormSchema
│                                       # (Research Decision 2); existing schemas UNCHANGED
├── nationality.ts                     # NEW — fetchNationalities(), NationalityOption type
│                                       # (Research Decision 5)
├── registration.ts                    # Doc-comment correction only (Research Decision 7); no
│                                       # functional change
└── profile.ts                         # Doc-comment correction only; no functional change

src/lib/
├── registration-draft.ts              # NEW — setRegistrationDraft/consumeRegistrationDraft/
│                                       # clearRegistrationDraft, the in-memory-only module-level
│                                       # variable (Research Decision 1)
└── api.ts                             # Doc-comment correction only (Research Decision 7)

src/theme/
├── colors.ts                          # EXTENDED — colors.segment.inactiveTrack
├── typography.ts                      # EXTENDED — typography.label.fieldSentence
└── contrast.test.ts                   # EXTENDED — new pairing case (Research Decision 4)
```

**Structure Decision**: single Expo project, no new top-level directory. New screen-specific
components live under `src/features/identity/`; the two genuinely cross-feature primitives
(`SegmentedControl`, `Select`) live under `src/features/ui/`, matching where `PrimaryButton`/
`OrDivider`/`StatusPill` already live — `DateField` stays under `src/features/identity/` since
nothing outside this feature's own profile-field collection needs a generic date picker today
(it can be promoted to `src/features/ui/` later if a second, genuinely different feature needs one
— YAGNI, matching this repo's own "no global state library until demonstrated need" posture
applied to component placement, not just state).

## Data Model

No change to `src/domain/types.ts`'s `User`/`BusinessProfile` shapes — every field this feature
collects already has a home there from `001-registration-kyc`. Two new types:

- **`NationalityOption`** (`src/domain/nationality.ts`, new): `{ value: string; label: string }`
  — the frontend-side shape of one backend catalog entry. Provisional until backend `015` has its
  own spec (see spec.md Assumptions) — this plan records the assumption explicitly rather than
  presenting it as a confirmed contract.
- **`RegistrationDraft`** (`src/lib/registration-draft.ts`, new): the shape of everything
  `CrearCuentaScreen` collects beyond the four registration-call fields — a discriminated union of
  the Usuario and Tienda remainders (`{ kind: "personal"; nombre; apellidoPaterno;
  apellidoMaterno?; birthDate; nationality; curp; rfc; tosAccepted; privacyAccepted } | { kind:
  "business"; commercialName; rfc; fiscalAddress; tosAccepted; privacyAccepted }`), so
  `verify-phone.tsx`'s auto-submit branch knows which schema/`isBusiness` flag to use without a
  second, separate lookup.

State transitions (extends `001-registration-kyc`'s existing diagram — the gate's own states are
unchanged; this adds detail only to the already-existing `verify-phone` → `profile`/`tutorial`
leg):

```
Crear cuenta (Usuario or Tienda tab) --Registrarse--> submitPersonalRegistration/
    submitBusinessRegistration (unchanged) --success--> setRegistrationDraft(remainder),
    router.replace("/verify-phone")  [unchanged navigation target]

/verify-phone --correct code--> verifyPhoneCode (unchanged) --success-->
    consumeRegistrationDraft()
      draft present  --submitProfile(draft)--> success --> /tutorial (unchanged destination)
                                             --> failure --> /profile (FR-010 recovery, draft
                                                              already cleared, re-entry required)
      draft absent (resumed/killed-app case) --> /profile (UNCHANGED existing behavior)
```

## Quickstart Validation

Once tasks are implemented, validate manually per `docs/verification.md` Level 3 (`npm run web`)
plus the relevant simulator for platform-specific paths — **stating plainly which of the
following could and could not be reached**, per this feature's own SC-006 and this repo's
"green tests, broken app" history:

1. Load `/register` on web at a 375px viewport and at a desktop width — confirm the `Usuario`/
   `Tienda` segmented control renders, defaults to `Usuario`, and both tabs show exactly the field
   set spec.md's FR-002/FR-003 describe, with sentence-case labels (not the app's usual uppercase).
2. Fill the Usuario tab completely except leave `Apellido materno` blank — confirm client-side
   validation passes (it's genuinely optional) and every other required field's omission produces
   a specific inline error, never a raw default message (SC-002).
3. Confirm the `Nacionalidad` field's loading/error/retry state — since backend `015` has not
   shipped as of this writing, this is the one field expected to be **unable to complete** against
   any backend available today; confirm it fails visibly and specifically, not silently.
4. Press `Registrarse` on the Usuario tab with a value that reaches the real registration call
   (needs a locally running backend, `docker compose up`) — confirm `POST /identity/register`
   fires with only the four credential fields, a code is sent, and `/verify-phone` appears.
5. On `/verify-phone`, confirm the code-entry screen renders unchanged from today. Entering a code
   and having it verify successfully additionally needs a real Supabase-issued JWT the backend can
   verify (see spec.md Assumptions) — **state plainly if this step could not be reached** in
   whatever environment this validation runs in, rather than assuming it was covered.
6. Switch to the `Tienda` tab — confirm no personal-account field ever appears, fill and submit,
   confirm the same `/verify-phone` interruption appears.
7. Kill the app/close the tab between `Registrarse` and completing phone verification, reopen —
   confirm the returning user lands wherever `resolveKycRoute()` already routes them today (this
   feature does not change that), and that reaching `/profile` this way asks for the profile
   fields again (the disclosed, intentional re-entry tradeoff).
8. A real iOS Simulator pass, if one is available in the session: confirm the `DateField` opens
   the native iOS date picker, and the `Select`'s modal presentation is usable via VoiceOver
   swipe navigation. **State explicitly if no simulator was available** rather than implying this
   was covered.

## Complexity Tracking

*No Constitution Check violations — table intentionally empty.*
