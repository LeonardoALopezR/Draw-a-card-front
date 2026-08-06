# Tasks: Registration Redesign (`Crear cuenta` — Usuario + Tienda)

**Input**: Design documents from `specs/010-registration-redesign/` (`spec.md`, `plan.md`)

**Tests**: Included — test tooling already exists in this repo (installed by
`001-registration-kyc`'s T001), so `docs/verification.md`'s Level 1/2 bar (unit tests for every
`src/domain` export, component tests for every new/changed screen) applies without a setup task.

**Organization**: tasks are grouped by user story from `spec.md`, in priority order (P1 → P2), per
`005-login`/`001-registration-kyc`'s established pattern. One deliberate packaging decision,
recorded here rather than left implicit: because `spec.md`'s FR-001 requires the `Usuario`/
`Tienda` segmented control to exist as **one screen** from the start (not two independently
completable screens that happen to share a route), `TiendaForm`'s initial build sits in Phase 3
(US1) alongside `UsuarioForm` — the screen cannot be correct for US1's own Independent Test
("fill and submit the Usuario tab") without a real segmented control offering a real second
option. Phase 4 (US2) owns Tienda's own deeper verification (its acceptance scenarios, the
business-draft path through `verify-phone.tsx`, and the explicit backend-`015`-gated follow-up)
rather than `TiendaForm`'s existence — mirroring `001-registration-kyc`'s own precedent of
building a personal-only form first and adding the business toggle as a later, clearly-labeled
task, adapted here because this feature's two tabs are more tightly coupled at the component level
than `001`'s were.

**Backend dependency labeling**: any task whose *real, end-to-end* behavior depends on backend
`015-registration-profile-support` (still `pending`, unspec'd as of this writing) is marked
**`[BLOCKED-ON-015]`** in its description. These tasks are still fully buildable and
unit/component-testable today against fixtures/assumed contracts — only their live-backend
verification is gated. No other task in this feature depends on `015`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 (Usuario, P1/MVP), US2 (Tienda, P2)
- File paths are exact; see `plan.md`'s Project Structure for the full tree

---

## Phase 1: Setup

**Purpose**: The one new dependency this feature needs. No feature code yet.

- [X] T001 Add `@react-native-community/datetimepicker` (`~8.0.1`, the Expo-SDK-51-aligned
  version) to `package.json` dependencies, per `plan.md`'s Technical Context and spec.md
  Clarification 4. Run `npx expo install --check` (or the repo's equivalent) to confirm the
  pinned version matches Expo's own SDK-51 compatibility table — do not hand-pick an
  arbitrary version. Confirm `./init.sh`'s "Native dependency alignment" stage does not newly
  FAIL or WARN because of this addition.

**Checkpoint**: `npm install` succeeds; `./init.sh`'s dependency-alignment stage is clean for the
new package.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Every shared token, primitive, schema, and infrastructure module both user stories
depend on. **No user-story screen work starts before this phase is done.**

- [X] T002 [P] `src/theme/colors.ts`: add `colors.segment.inactiveTrack = "#EDEEF5"` (the design
  brief's suggested value, computed — not eyeballed — to clear WCAG AA: `contrastRatio(colors.
  text.secondary, "#EDEEF5")` = 4.63:1, per `plan.md`'s Research Decision 4). Add a new case to
  `src/theme/contrast.test.ts` regression-guarding this exact pairing at ≥4.5:1, mirroring the
  file's existing pairing-test format. *(spec.md FR-006, Constitution VII)*
- [X] T003 [P] `src/theme/typography.ts`: add `typography.label.fieldSentence` — identical
  `fontSize`/`fontWeight`/`color` to the existing `label.field`, no `textTransform`/
  `letterSpacing` (Research Decision 4). No color change, so no new `contrast.test.ts` case is
  needed for this token. *(FR-006)*
- [X] T004 [P] Extend `src/features/identity/FormField.tsx` and `FormField.web.tsx` with a new
  optional `labelCase?: "uppercase" | "sentence"` prop, **defaulting to `"uppercase"`** so every
  existing call site (`SignInForm`, `RequestPasswordResetForm`, `ResetPasswordForm`,
  `VerifyPhoneScreen`, etc.) is byte-for-byte unaffected — grep every current `<FormField`/
  `<FormField.web` usage and confirm none pass `labelCase` today, so the default is genuinely
  load-bearing for backward compatibility, not just theoretically safe. Add a `labelCase="sentence"`
  regression case to `FormField.test.tsx` asserting `typography.label.fieldSentence` is applied
  and no `textTransform` leaks through. Depends on: T003. *(FR-006, design brief §2)*
- [X] T005 [P] Create `src/features/ui/SegmentedControl.tsx` + `SegmentedControl.test.tsx` — a
  generic, full-width two-segment pill control (`options: { label: string; value: string }[]`,
  `value`, `onChange`, `testID`), styled per the design brief §2 (active: `brand.primary` fill +
  bold `brand.onPrimary` label; inactive: the new `colors.segment.inactiveTrack` (T002) +
  `text.secondary` label; full pill radius, ~56px tall). Reuse the exact accessible
  `radiogroup`/`radio` + top-level `aria-checked` pattern already established and reviewed in
  `RegistrationForm.tsx`'s account-type toggle (`001-registration-kyc` T024) rather than
  reinventing it. Depends on: T002. *(FR-001, FR-006, FR-015)*
- [X] T006 [P] Create `src/features/ui/Select.tsx` + `Select.web.tsx` + their test files — the
  generic, dependency-free selection primitive (`options: { value: string; label: string }[]`,
  `value`, `onChange`, `label`, `placeholder`, `loading?`, `error?`, `onRetry?`, `testID`), per
  `plan.md`'s Research Decision 3: `.tsx` opens a `Modal` with a filter `TextInput` + `FlatList`;
  `.web.tsx` opens an absolutely-positioned dropdown panel with real keyboard handling
  (`ArrowDown`/`ArrowUp` to move the highlighted option, `Enter` to choose, `Escape` to close and
  restore focus to the trigger). Tests cover: opening/closing, selecting an option, the
  `loading`/`error`+`onRetry` states rendering distinctly, and (web file only) the keyboard
  interaction sequence. No new dependency. *(FR-012, FR-015)*
- [X] T007 [P] Create `src/features/identity/DateField.tsx` + `DateField.web.tsx` + their test
  files — wraps `@react-native-community/datetimepicker` (T001) on iOS/Android; `.web.tsx` wraps
  a plain `<input type="date">` (react-native-web's pass-through of unrecognized native DOM props,
  the same mechanism `LoginScreenChrome.web.tsx`'s `backgroundImage` already relies on). Both emit
  a `Date` to match `profileFormSchema`'s existing `birthDate: z.coerce.date()` — no schema
  change. Depends on: T001. *(FR-013, spec.md Clarification 4)*
- [X] T008 [P] Extend `src/domain/schemas.ts`: add `usuarioCrearCuentaSchema =
  personalRegistrationSchema.merge(profileFormSchema)` and a new, narrower
  `tiendaProfileFormSchema` (commercialName/rfc/fiscalAddress/tosAccepted/privacyAccepted only —
  **not** `businessProfileFormSchema`, which still extends `profileFormSchema` and would wrongly
  require personal fields) plus `tiendaCrearCuentaSchema =
  businessRegistrationSchema.merge(tiendaProfileFormSchema)`. Export both new
  `*CrearCuentaSchema` types. Existing `personalRegistrationSchema`/`profileFormSchema`/
  `businessRegistrationSchema`/`businessProfileFormSchema` are **unchanged** — every existing
  consumer (`ProfileForm.tsx`, their tests) is unaffected. Extend `schemas.test.ts`. *(FR-002,
  FR-003, `plan.md` Research Decision 2)*
- [X] T009 [P] Create `src/lib/registration-draft.ts`: `RegistrationDraft` discriminated-union
  type (`{ kind: "personal"; ... } | { kind: "business"; ... }`, per `plan.md`'s Data Model),
  `setRegistrationDraft(draft)`, `consumeRegistrationDraft(): RegistrationDraft | undefined`
  (reads **and clears** in the same call — the atomicity is the point), `clearRegistrationDraft()`
  — a plain in-memory module-level variable, mirroring `src/lib/api.ts`'s existing `currentUserId`
  pattern (not a new storage mechanism). Add `registration-draft.test.ts` covering: set-then-
  consume returns the value; a second consume call returns `undefined`; `clearRegistrationDraft()`
  after a set also makes a subsequent consume return `undefined`. *(FR-009, Constitution III,
  `plan.md` Research Decision 1)*
- [X] T010 [P] Create `src/domain/nationality.ts`: `NationalityOption` type (`{ value: string;
  label: string }`) and `fetchNationalities(client: ApiClient): Promise<NationalityOption[]>`
  calling the **assumed** `GET /identity/nationalities` (a planning assumption, not a confirmed
  contract — see `plan.md`'s Research Decision 5 and Data Model; reconcile once backend `015` has
  its own spec). Add `nationality.test.ts` covering the happy path and a network-error path
  against a mocked `ApiClient`. **`[BLOCKED-ON-015]`** for real-backend verification only — this
  function itself is fully buildable and unit-testable today. *(FR-012)*
- [X] T011 [P] Create `src/features/identity/useNationalities.ts`: a React Query hook wrapping
  `fetchNationalities` (T010) via the injected `api` client, returning `{ options, isLoading,
  error, refetch }` shaped for `Select`'s (T006) `loading`/`error`/`onRetry` props directly. Add
  `useNationalities.test.ts` (mocked client). Depends on: T010. **`[BLOCKED-ON-015]`** for real-
  backend verification only. *(FR-012)*
- [X] T012 [P] Create `src/features/identity/authCardLayout.ts` exporting `AUTH_CARD_MAX_WIDTH =
  660` (a plain number, no React import). Update `LoginScreenChrome.web.tsx` to import and use it
  instead of its own local `CARD_MAX_WIDTH = 660` literal — confirm `LoginScreenChrome.test.tsx`
  still passes unchanged (same value, just sourced from the shared constant).
  *(FR-016, `plan.md` Research Decision 6)*
- [X] T013 [P] Create `src/domain/i18n/copy/registration.ts`: the full Spanish-default/English-
  parity dictionary for this screen — title (`Crear cuenta`), subtitle (`Completa tu perfil`),
  segmented labels (`Usuario`/`Tienda`), every field label/placeholder on both tabs (properly
  accented — `Correo electrónico`, `Contraseña`, `Nombre(s)`, `Apellido paterno`, `Apellido
  materno`, `Fecha de nacimiento`, `Celular`, `Nacionalidad`, `Nombre comercial`, `Domicilio
  fiscal`), the two consent-row labels, the submit button's idle/busy copy, and any
  feature-specific validation/error copy not already covered by the reused schemas' existing
  messages. Add `registration.test.ts` mirroring `login.test.ts`'s coverage pattern (both locales
  present, same key set). *(FR-007)*
- [X] T014 [P] Doc-comment correction only, **no functional change**: update the comments in
  `src/lib/api.ts` (the `setCurrentUserId`/`X-User-Id` file-level comment), `src/domain/
  registration.ts`, and `src/domain/profile.ts` that describe `X-User-Id` as backend-trusted in
  development/test — per `plan.md`'s Research Decision 7, backend `004-session-authentication`
  (`done`, 2026-08-06) deleted that trust path **entirely, in every `NODE_ENV`**, replacing it
  with real Bearer-JWT verification the frontend's `src/lib/api.ts` already sends. Confirm via
  `git diff` that only comments changed — the header-sending code itself stays as-is (now an inert
  no-op against the real backend, not removed here). *(spec.md Assumptions)*

**Checkpoint**: run `npm test` and `npx tsc --noEmit` — both must pass before proceeding to Phase
3. Every shared primitive/schema/module this feature's screens need now exists and is
independently unit/component-tested.

---

## Phase 3: User Story 1 - Usuario (personal) registration through `Crear cuenta` (Priority: P1) 🎯 MVP

**Goal**: A new user can complete the `Usuario` tab of the redesigned single screen, be
interrupted by phone verification exactly once, and have their profile fields submitted
automatically — with the `Tienda` tab present and selectable (FR-001) even though its own deeper
verification is Phase 4's job.

**Independent Test**: per spec.md — on web, fill and submit the `Usuario` tab, confirm the
phone-verification interruption appears, and (against a locally running backend) confirm the
registration call fires with exactly the four credential fields.

### Implementation for User Story 1

- [X] T015 [P] [US1] Create `src/features/identity/UsuarioForm.tsx` + `UsuarioForm.test.tsx` —
  React Hook Form + `zodResolver(usuarioCrearCuentaSchema)` (T008), rendering every Usuario field
  in the design brief §3 order via `FormField`/`FormField.web` with `labelCase="sentence"` (T004):
  `Nombre(s)`/`Apellido paterno`/`Apellido materno` (optional), `Correo electrónico`,
  `Contraseña` (Clarification 1), `Usuario`, `Fecha de nacimiento` via `DateField` (T007),
  `Celular`, `Nacionalidad` via `Select` (T006, wired to whatever `options`/`loading`/`error`/
  `onRetry` props its caller passes — this task does not itself call `useNationalities`, see
  T020), `CURP`/`RFC` as two inputs (Clarification 2), the two consent checkboxes. Copy sourced
  from `useTranslation(registrationCopy)` (T013). Tests cover: every required field's specific
  inline error (no raw default message, SC-002), `apellidoMaterno`'s genuine optionality, and a
  successful-submit call with the full combined payload. Depends on: T004, T006, T007, T008, T013.
  *(FR-002, FR-013, FR-014, FR-017)*
- [X] T016 [P] [US1] Create `src/features/identity/TiendaForm.tsx` + `TiendaForm.test.tsx` — same
  conventions as T015, `zodResolver(tiendaCrearCuentaSchema)` (T008), rendering exactly the design
  brief §4 field list (`Nombre comercial`, `Correo electrónico`, `Contraseña`, `Usuario`, `RFC` —
  ordinary styling, no `(PLD)` suffix per Clarification 3, `Celular`, `Domicilio fiscal`, the two
  consent checkboxes) — **no personal-account field anywhere in this file**. Tests cover: the
  exact field set (assert no `nombre`/`birthDate`/`nationality`/`curp` field/label is ever
  rendered), missing-RFC inline validation, a successful-submit call. Built here (not Phase 4) per
  this file's top note — FR-001 requires both tabs to exist together. Depends on: T004, T008,
  T013. *(FR-003)*
- [X] T017 [US1] Create `src/features/identity/CrearCuentaScreen.tsx` + `.web.tsx` +
  `CrearCuentaScreen.test.tsx` — composes `SegmentedControl` (T005, defaulting to `Usuario`),
  `UsuarioForm`/`TiendaForm` (T015/T016), and the shared title/subtitle chrome (design brief §2).
  On submit: calls `submitPersonalRegistration`/`submitBusinessRegistration`
  (`src/domain/registration.ts`, **unchanged**) with only the four credential fields; on success,
  builds a `RegistrationDraft` (T009) from the remaining fields and calls
  `setRegistrationDraft(draft)`, then navigates to `/verify-phone` — the same target
  `app/(auth)/register.tsx` already navigates to today. The `.web.tsx` variant centers the screen
  in a card capped at `AUTH_CARD_MAX_WIDTH` (T012). Reuses the existing `sessionIssue`/
  `retrySignIn` recovery UI `register.tsx` already has for a registration-succeeded-but-sign-in-
  failed outcome (`001-registration-kyc` T031) — that mechanism is unrelated to this feature and
  must not regress. Depends on: T005, T009, T012, T015, T016. *(FR-001, FR-006, `plan.md`
  Research Decision 1)*
- [X] T018 [US1] Rewrite `app/(auth)/register.tsx` to render `CrearCuentaScreen` (T017) in place of
  today's `RegistrationForm`; preserve the existing `setCurrentUserId(user.id)` call and the
  `sessionIssue`/retry-sign-in flow byte-for-byte (only what's rendered on the happy path changes).
  Replace `register.test.tsx`'s assertions accordingly (still covering: successful submit
  navigates to `/verify-phone`, the session-issue recovery view, `setCurrentUserId` is called).
  Depends on: T017. *(FR-001, FR-008)*
- [X] T019 [US1] Extend `app/(auth)/verify-phone.tsx`'s success handler (today: an unconditional
  `router.replace("/profile")` after `verifyPhoneCode` resolves): call `consumeRegistrationDraft()`
  (T009) first.
  - **Draft present**: call `submitProfile(api, draftPayload, { isBusiness: draft.kind ===
    "business" })` (`src/domain/profile.ts`, unchanged) immediately, no intermediate screen. On
    success, `router.replace("/tutorial")` (the same destination `profile.tsx` already routes to
    today). On failure, `router.replace("/profile")` (FR-010) — the draft is already cleared by
    `consumeRegistrationDraft()`, so this is a genuine "please re-enter your profile information"
    recovery, not a silent retry with cached values.
  - **Draft absent**: fall through to exactly today's existing behavior,
    `router.replace("/profile")` — unchanged.
  Extend `verify-phone.test.tsx` with cases for: draft-present-personal success, draft-present-
  personal failure (asserts `/profile` reached and the draft was cleared, not retried), and
  draft-absent (asserts the existing unconditional-redirect behavior is unchanged). Depends on:
  T009. *(FR-008, FR-009, FR-010, `plan.md` Research Decision 1)*
- [X] T020 [P] [US1] **`[BLOCKED-ON-015]`** for its real network behavior only. Wire the
  `Nacionalidad` field in `UsuarioForm` (T015) to `useNationalities()` (T011) at the
  `CrearCuentaScreen`/`UsuarioForm` call-site boundary, passing its `options`/`isLoading`/`error`/
  `refetch` straight through to the `Select` primitive's `loading`/`error`/`onRetry` props (spec.md
  Edge Cases — no hardcoded fallback list at any layer). Extend `UsuarioForm.test.tsx` with the
  loading/error/retry-visible states using a mocked `useNationalities`. Depends on: T011, T015.
  *(FR-012)*
- [X] T021 [P] [US1] Restyle `ProfileForm.tsx` in place — `FormField`/`FormField.web` with
  `labelCase="sentence"` (T004), `006` tokens throughout (no raw hex), `registrationCopy` (T013)
  or the existing profile-specific copy as appropriate — **same fields, same
  `profileFormSchema`/`businessProfileFormSchema` resolver, same props, no structural change**
  (`plan.md` Research Decision 1's step 5 and Research Decision 8 — this screen is now the
  explicit recovery/resumability path, not the primary journey, and its business block is
  deliberately **not** narrowed to match `TiendaForm`'s shorter field set yet, since today's real
  backend still requires the personal fields it already collects — see T026). Update
  `ProfileForm.test.tsx`'s existing assertions to the new `labelCase`/token-sourced styles where
  they assert on style values; behavioral assertions are unchanged. Depends on: T004. *(FR-006)*
- [X] T022 [US1] Remove `src/features/identity/RegistrationForm.tsx` and
  `RegistrationForm.test.tsx` — fully superseded by `UsuarioForm`/`TiendaForm` (`plan.md` Project
  Structure). Grep the repo for any remaining import and confirm none exist. Depends on: T018.
- [X] T023 [US1] Manual smoke check (Level 3), **stating precisely which live services were
  running** per `docs/verification.md`'s bar: on web (`npm run web`) at a 375px viewport and a
  desktop width, fill and submit the `Usuario` tab against a locally running backend (`docker
  compose up` in the `Draw-a-card` repo) — confirm `POST /identity/register` fires with exactly
  the four credential fields and `/verify-phone` is reached. Explicitly confirm and record in this
  task's report: (a) the `Nacionalidad` field's loading/error/retry state is what's actually
  reachable today, since backend `015` has not shipped (no live catalog to select from — this is
  the expected, disclosed outcome, not a defect); (b) entering a phone-verification code and
  having it succeed additionally needs a real Supabase-issued JWT the backend can verify (spec.md
  Assumptions) — state plainly whether this was reachable in whatever environment this check runs
  in, rather than assuming it was covered. Depends on: T018, T019, T020.

**Checkpoint**: User Story 1 (MVP) is functional and independently testable as far as today's
backend allows — the `Usuario` tab renders, validates, and submits its registration call
correctly; the phone-verification interruption and its draft-consumption logic are unit/component-
tested; live end-to-end completion is explicitly, honestly gated on backend `015` and Supabase
JWT configuration, not silently implied.

---

## Phase 4: User Story 2 - Tienda (business) registration through `Crear cuenta` (Priority: P2)

**Goal**: The `Tienda` tab's own acceptance scenarios are verified, its business-draft path
through the phone-verification interruption is explicitly tested, and the current backend's
inability to complete a Tienda profile submission (pending `015` User Story 2) is disclosed
rather than silently absorbed.

**Independent Test**: per spec.md — switch to `Tienda`, confirm no personal-account field is ever
shown or requested, fill and submit the shorter field set, confirm the same phone-verification
interruption appears.

### Implementation for User Story 2

- [X] T024 [US2] Extend `verify-phone.test.tsx`'s draft-consumption coverage (T019) with an
  explicit business-path case: `draft.kind === "business"` calls `submitProfile` with
  `{ isBusiness: true }` and the `tiendaProfileFormSchema`-shaped payload (T008) — asserted
  directly, not left as incidental coverage of T019's generic branch. *(FR-003, FR-008)*
- [X] T025 [US2] Manual smoke check (Level 3), same honesty bar as T023: on web, switch to
  `Tienda`, confirm no personal-account field appears at any point (before or after phone
  verification), fill and submit against a locally running backend, confirm `POST
  /identity/register/business` fires correctly and `/verify-phone` is reached identically to the
  Usuario path. **`[BLOCKED-ON-015]`**: explicitly attempt and record the automatic profile
  submission's outcome after phone verification — per spec.md's Dependency note under User Story
  2, this is *expected* to fail against today's backend (`profileBusinessSchema` still requires
  personal fields the Tienda tab never collects), landing on the FR-010 recovery screen. Record
  this as the correct, disclosed, currently-expected outcome, not a defect to chase — it will
  start succeeding once backend `015` User Story 2 ships, with no frontend code change required.
  Depends on: T018, T019, T024.
- [X] T026 [US2] Record the `/profile` business-block follow-up (`plan.md` Research Decision 8)
  explicitly: add a short, clearly-dated comment at the top of `ProfileForm.tsx`'s
  `isBusiness`-conditional block noting that once backend `015` User Story 2 ships, this block
  should switch to validating against `tiendaProfileFormSchema` (T008) instead of
  `businessProfileFormSchema`, to stop asking a resumed Tienda user for personal fields the
  primary `Tienda` tab never collects. Not implemented now — flagged for whoever picks up `015`'s
  frontend follow-up. Depends on: T021.

**Checkpoint**: User Story 2 is functional and independently testable as far as today's backend
allows — the `Tienda` tab renders and validates correctly, its registration call succeeds, and its
currently-expected profile-completion failure (pending `015`) is disclosed and tested for the
right (recovery-path-reached) outcome rather than treated as a bug.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T027 [P] Accessibility pass across every component this feature built or restyled
  (`SegmentedControl`, `Select`/`Select.web`, `DateField`/`DateField.web`, `UsuarioForm`,
  `TiendaForm`, `CrearCuentaScreen`, restyled `ProfileForm`) — labels/roles, minimum 44×44 tap
  targets, and full keyboard operability on web (tab order, visible focus, `Enter`/`Space`
  activation, `Select`'s arrow-key navigation + `Escape`-to-dismiss). Fix findings in place; add
  regression tests for anything fixed, mirroring `001-registration-kyc` T028's
  `aria-checked`-forwarding fix pattern if the same react-native-web `accessibilityState`
  limitation recurs here. *(FR-015, Constitution VII)*
- [X] T028 [P] Responsive layout check at a 375px-wide web viewport through desktop widths, both
  tabs, plus phone/tablet form factors on iOS/Android simulators if available in this session. Fix
  findings in place. **State plainly and specifically which targets were actually exercised live
  (e.g. via a real browser-automation tool against a running `npm run web`) versus which were only
  reviewed structurally** — per `docs/verification.md`'s explicit anti-pattern list and this
  repo's own "green tests, broken app" history; do not imply coverage that wasn't performed.
  *(FR-016, SC-003)*
- [X] T029 A real iOS Simulator pass, if one is available in this session: confirm `DateField`
  opens the native iOS date picker and produces a correct value; confirm `Select`'s modal
  presentation is usable via VoiceOver swipe navigation; confirm both tabs render correctly at
  phone and tablet sizes. **If no simulator is available, state that explicitly in this task's
  report rather than silently skipping it or implying it was covered** — matching this repo's
  standing instruction (see `008-scan-experience`'s and `001-registration-kyc`'s own precedent of
  disclosing exactly which targets were never exercised).
- [X] T030 Run `./init.sh` end to end (all stages, no `--skip-*` flags) and confirm `RESULT:
  SUCCESS` with the Tests stage at OK. Fix any regressions found. Walk `CHECKPOINTS.md` C1–C6:
  confirm no stray `console.*` debug calls, no context-free `TODO`, and that
  `src/domain/nationality.ts`/`src/lib/registration-draft.ts` have zero React Native imports
  (Constitution IV, `src/domain`/`src/lib` boundary). Depends on: all prior tasks.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 (T007 needs the new dependency from T001) —
  BLOCKS all user-story work.
- **User Story 1 (Phase 3, P1)**: Depends on Foundational only.
- **User Story 2 (Phase 4, P2)**: Depends on User Story 1's `verify-phone.tsx` extension (T019)
  and `register.tsx` rewrite (T018) existing to extend/test against — per this feature's explicit
  P1-before-P2 ordering, mirroring `001-registration-kyc`.
- **Polish (Phase 5)**: Depends on both user stories being complete.

### Parallel Opportunities

- Within Phase 2 (Foundational): T002–T014 touch disjoint files and can all run in parallel once
  Phase 1's T001 lands (only T007 needs it; everything else in Phase 2 has no dependency on T001).
- Within Phase 3 (US1): T015 and T016 touch disjoint files and can run in parallel; T017 depends
  on both; T018 depends on T017; T019 depends only on T009 (Foundational) and can run in parallel
  with T015–T018; T020 depends on T011+T015; T021 depends only on T004 and can run in parallel
  with everything else in this phase; T022 depends on T018; T023 must run last in this phase.
- Within Phase 4 (US2): T024 depends on T019; T025 depends on T018+T019+T024; T026 depends on T021
  (Phase 3) and can run in parallel with T024/T025.
- Within Phase 5: T027 and T028 can run in parallel; T029 can run in parallel with both; T030 must
  run last.

---

## Parallel Example: Phase 2 (Foundational, after T001 lands)

```bash
Task: "Add colors.segment.inactiveTrack + contrast.test.ts case (T002)"
Task: "Add typography.label.fieldSentence (T003)"
Task: "Create src/features/ui/SegmentedControl.tsx (T005)"
Task: "Create src/lib/registration-draft.ts (T009)"
Task: "Create src/domain/i18n/copy/registration.ts (T013)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1) — this also produces `TiendaForm`'s initial build (see this
   file's top note on why) and `register.tsx`/`verify-phone.tsx`'s shared rewiring, which Phase 4
   builds on rather than duplicates.
3. **STOP and VALIDATE**: run T023's manual smoke check, paying particular attention to what it
   explicitly could and could not reach given backend `015`'s pending status.
4. That's a demoable MVP — the `Usuario` tab, end to end, as far as today's backend allows.

### Incremental Delivery

5. Complete Phase 4 (User Story 2) — Tienda-specific verification and the explicit `015`-gated
   disclosure.
6. Complete Phase 5 (Polish) — accessibility, responsive, and simulator passes, then `./init.sh`.
7. This feature is ready for the `spec_ready` → human-approval gate once `spec.md`'s four recorded
   Clarification defaults have been confirmed or overridden and `tasks.md` is fully `[X]`.
