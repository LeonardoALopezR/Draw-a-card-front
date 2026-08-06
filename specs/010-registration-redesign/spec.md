# Feature Specification: Registration Redesign (`Crear cuenta` — Usuario + Tienda)

**Feature Branch**: `010-registration-redesign`

**Created**: 2026-08-06

**Status**: Clarified (four recorded defaults below, flagged for explicit human confirmation at
the `spec_ready` approval gate — not blocking `[NEEDS CLARIFICATION]` markers, since a reasonable,
fully-worked-out default exists for each — per this repo's `004-home-scan-shell`/`005-login`/
`006-visual-identity` precedent)

**Input**: The human's own framing (verbatim, from `feature_list.json`'s `010-registration-redesign`
entry): "lets create a new feature to redesign the create user views, fro the 'usuario' tab lets
modify nombre completo to have 3 inputs (Name(s), lastname, second last name) in nacionalidad we
need a catalog to have varous nacionalities (if its necessesary add the feature in the backend
project) only ignore the documentos section, the missing fields needs to be store in the backend
add a feature if is necessary (the database needs to store the name, lastname and second lastname
and also the birthday), in 'tienda' tab ignore the blue message at the top, Datos bancarios(PLD)
and Documentos, everything else needs to be sotre in back end and has his own columns (add a task
if is necessary)." Backed by eight mockups (Usuario/Tienda × mobile/web × top/bottom), transcribed
into `docs/design-brief-registration-redesign.md` on 2026-08-06 — the images themselves are not in
this repo; that document is the **authoritative design source**, this spec implements against it.

**The gap this fills**: `app/(auth)/register.tsx` and `app/(auth)/profile.tsx` still carry the
pre-`006-visual-identity` unstyled, hardcoded-hex, English-labeled look (`RegistrationForm.tsx`'s
`#111827`/`#d1d5db`, plain `Text` labels) even though `006` restyled `/login` and `/scan`. This
feature brings the registration/profile data-collection experience up to the same brand, folds it
into a single `Crear cuenta` screen with a `Usuario`/`Tienda` account-type switch (matching the
mockups), and makes several fields (name split, nationality) genuinely richer than what the
current `ProfileForm.tsx`/`RegistrationForm.tsx` render.

**Related backend specs** (`Draw-a-card` backend repo, all confirmed by reading the backend
source directly on 2026-08-06, not assumed):
- `001-user-registration-kyc` (`done`) — every column this feature needs already exists:
  `User.nombre`/`apellidoPaterno`/`apellidoMaterno`/`birthDate`/`nationality`/`curp`/`rfc`/
  `email`/`username`/`phone`, and `BusinessProfile.commercialName`/`rfc`/`fiscalAddress`. **No
  migration task belongs in this feature.**
- `004-session-authentication` (`done`, merged 2026-08-06) — a finding not in this feature's
  original kickoff brief, surfaced during this spec's mandatory backend cross-check: the
  backend's dev-only `X-User-Id` header stand-in (which `001-registration-kyc`'s Assumptions and
  `src/lib/api.ts`'s `setCurrentUserId` describe at length) has been **deleted entirely, in every
  `NODE_ENV`** and replaced by real Bearer-JWT verification (`requireAuth`, `src/shared/auth.ts`).
  The frontend's `src/lib/api.ts` already sends `Authorization: Bearer <supabase access_token>`
  on every call (it always has — see that file's `getToken`), so this is not a new call this
  feature must add; it is a documentation/currency issue (see Assumptions below) plus a
  materially-changed verification picture (see the Verification note in Assumptions).
- `015-registration-profile-support` (`pending`, not yet spec'd) — the nationality catalog
  endpoint (its User Story 1) and the relaxation of `profileBusinessSchema` so a Tienda profile no
  longer requires personal fields (its User Story 2). **This feature depends on both** for a
  genuinely complete end-to-end submission on either tab — see Assumptions and the Dependencies
  note under each user story below. Nothing else in this feature depends on `015`.

## Clarifications

### Recorded default 1 (2026-08-06): a `Contraseña` (password) field is added to both tabs, directly under the email field

**What was found**: none of the eight mockups show a password field anywhere on either tab, but
`POST /identity/register`/`register/business` requires `password` (min 8 characters,
`registerCredentialsSchema`, confirmed in the backend's `src/modules/identity/validation.ts`), and
sign-in is Supabase Auth (Constitution Principle III) — an account cannot exist without one. The
mockup is not satisfiable as drawn.

| Option | Description | Implications |
|---|---|---|
| **A (recommended, chosen default)** | Add a single `Contraseña` input to both tabs, directly under `Correo electrónico`, reusing the existing `passwordSchema` (min 8 chars, `src/domain/schemas.ts`) with no confirm-password field. | Matches `personalRegistrationSchema`, which has never had a confirm field — no new validation concept introduced. The account can actually be created. This is an addition to the mockup, made because the mockup is not satisfiable without it, not a design choice. |
| B | Omit password entirely and generate a random one server-side, emailed to the user for a later reset. | Rejected — no such backend capability exists today (`POST /identity/register` has no such mode), and it would add a second, unscoped backend feature just to avoid one form field. |
| Custom | Place the password field elsewhere in the tab order (e.g. immediately above `Registrarse`). | Not adopted — directly under email matches where a password field conventionally sits and where `005-login`'s `/login` screen already places it, keeping registration and sign-in visually consistent. |

**Recorded default**: **Option A.** Flagged for the human to confirm or override at the approval
gate — if a different placement or a confirm-password field is preferred, only `FR-003`/`FR-004`
and the two forms' field order change; nothing else in this spec depends on it.

### Recorded default 2 (2026-08-06): `CURP` and `RFC` ship as two separate inputs, not the mockup's one combined field

**What was found**: the Usuario mockup shows one `CURP / RFC` field (placeholder
`GARL900101HDFRCN04`), but the backend's `profilePersonalSchema` requires `curp` **and** `rfc` as
separate non-empty strings, and `User` has a distinct column for each (`prisma/schema.prisma`).
One input cannot populate two required columns without the client inventing a split rule for two
values that are genuinely different strings (a CURP is 18 characters with a fixed structure; an
RFC is 12–13). `001-registration-kyc`'s `ProfileForm.tsx` already ships two separate fields today.

| Option | Description | Implications |
|---|---|---|
| **A (recommended, chosen default)** | Render two separate inputs, `CURP` and `RFC`, exactly as `ProfileForm.tsx` already does — no new schema shape needed, `profileFormSchema`'s existing `curp`/`rfc` fields carry over unchanged. | Zero data loss, zero client-side parsing risk, and it is the option `001-registration-kyc` already shipped and tested — no regression to an already-working pattern. Visually diverges from the one-field mockup, but the mockup cannot be satisfied without either this or Option B. |
| B | Keep one combined input; relax `rfc` to optional server-side and derive/omit it from the combined value. | Rejected — was not requested, loses data the product's own compliance framing (KYC identity fields) wants captured, and requires a new backend relaxation this feature does not otherwise need. |

**Recorded default**: **Option A.** Flagged for confirmation at the gate — if the human prefers
Option B, only the Usuario tab's two-field block and a new backend relaxation task change;
everything else (the rest of the form, the flow, the Tienda tab) is unaffected.

### Recorded default 3 (2026-08-06): the Tienda `RFC` field ships as an ordinary field — no `(PLD)` suffix, no blue treatment

**What was found**: the Tienda mockup labels its RFC field `RFC (PLD)` in blue with a blue input
border, pointing back at the blue `Cumplimiento PLD/AML` banner at the top of the same tab — which
is explicitly out of scope for this feature (§6 of the design brief, per the human's own
instruction to ignore it). Shipping the `(PLD)` marker/blue treatment with its explanatory banner
removed would leave an unexplained visual state with no context for what "PLD" means.

| Option | Description | Implications |
|---|---|---|
| **A (recommended, chosen default)** | Render `RFC` as an ordinary field — standard `label.field` colour, standard input treatment, no `(PLD)` suffix. | Consistent with every other field on both tabs; nothing on screen references a concept (PLD/AML compliance) that has no explanation anywhere in the shipped UI. When the banner is eventually built, the marker returns with it, as a follow-up to whichever feature builds the banner. |
| B | Ship the `(PLD)` suffix and blue treatment anyway, without the banner. | Rejected — an unexplained regulatory-sounding marker on a form field is more likely to alarm or confuse a user than help them, with no compensating benefit since this feature builds no explanatory content for it. |

**Recorded default**: **Option A.** Flagged for confirmation at the gate — if the human wants the
marker shipped regardless, only the Tienda tab's RFC field's style/copy changes.

### Recorded default 4 (2026-08-06): `Fecha de nacimiento` ships as a real date-picker control, taking a new native dependency

**What was found**: `001-registration-kyc`'s `ProfileForm.tsx` deliberately renders birth date as
a plain `YYYY-MM-DD` `TextInput`, with its own comment recording that no date-picker dependency is
installed and adding one would be an undocumented addition. The mockup shows a real date control
(`dd/mm/yyyy` placeholder plus a calendar glyph).

| Option | Description | Implications |
|---|---|---|
| **A (recommended, chosen default)** | Take a native dependency (`@react-native-community/datetimepicker`, the standard Expo-SDK-51-compatible package for this) on iOS/Android, with web using the browser's native `<input type="date">` via the existing `.web.tsx` platform-split convention. | Matches the mockup's real date-picker affordance; a native date control also removes an entire class of manual date-typo bugs (`31/02/2026`, ambiguous `dd/mm` vs `mm/dd`) a free-text field invites. One new, small, single-purpose, actively-maintained dependency, justified in `plan.md`'s Research Decisions the way `006-visual-identity` justified `expo-font` — no Play/App Store review risk (it wraps each OS's own native date picker, the most store-review-neutral kind of native module there is). |
| B | Keep the existing plain `TextInput` with a `dd/mm/yyyy` placeholder (a masked/formatted text field, not a raw free-text one). | Zero new dependency — a legitimate fallback if the human declines the new package. Worse UX (a user can still type an invalid or ambiguous date; needs its own client-side mask/validation logic this feature would have to build from scratch). |

**Recorded default**: **Option A.** Flagged for confirmation at the gate — this is the one default
with a real cost (a new native dependency) rather than a pure styling choice, so it is called out
most explicitly for override. If declined, only the Usuario tab's birth-date field's
implementation changes (Option B), plus one fewer `package.json` dependency and no `.web.tsx` file
for that field; every other requirement in this spec is unaffected either way.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Personal ("Usuario") account registration through the redesigned screen (Priority: P1) 🎯 MVP

A new user opens `Crear cuenta`, sees the `Usuario` tab selected by default, and fills in one
continuous form: given name(s), paternal surname, maternal surname (optional), email, password,
username, birth date, phone, nationality (picked from a list, not typed), CURP, RFC, and the two
consent checkboxes. Pressing `Registrarse` creates the account and sends an SMS code; the user
enters that code on the existing verification screen (a visible, one-time interruption); once
verified, the rest of the form's already-entered values (name, birth date, nationality, CURP, RFC,
consents) are submitted automatically — the user is never shown a second form to re-enter them.

**Why this priority**: entry point for the entire product; this feature exists specifically to
replace what `001-registration-kyc` shipped for exactly this path.

**Independent Test**: on web (`expo start --web`), fill and submit the Usuario tab, confirm the
phone-verification interruption appears, enter the code, and confirm the account reaches the same
post-registration destination `001-registration-kyc`'s flow already reaches (tutorial or main app)
with no second, user-visible form for the already-entered fields.

**Acceptance Scenarios**:

1. **Given** a visitor on `Crear cuenta` with `Usuario` selected (the default), **When** they fill
   every field correctly and press `Registrarse`, **Then** the account-creation call fires with
   only email/password/phone/username (matching the backend's real registration contract — see
   Assumptions), a verification code is sent, and the visible phone-verification screen appears.
2. **Given** a correct verification code is entered, **When** verification succeeds, **Then** the
   name/birth-date/nationality/CURP/RFC/consent values already entered on `Crear cuenta` are
   submitted without the user re-entering or re-seeing them as a separate form, and the user
   proceeds exactly as `001-registration-kyc`'s existing post-profile routing already does.
3. **Given** the given-name/paternal-surname/email/password/username/phone/nationality/CURP/RFC
   fields, **When** any required one is left empty or malformed, **Then** the offending field
   shows a specific, real inline error (never a raw framework default message) and nothing is
   submitted.
4. **Given** the maternal surname field, **When** it is left empty, **Then** the form still
   submits successfully (it is genuinely optional, mirroring the backend's `apellidoMaterno`).
5. **Given** the nationality field, **When** the user opens it, **Then** they choose from a list
   of nationalities rather than typing free text.

**Edge Cases**:

- What happens if the phone-verification step succeeds but the automatic profile submission that
  follows fails (network error, an unexpected validation rejection, etc.)? → The user is not left
  stranded on a dead end or shown a raw error with no path forward: they land on the existing
  resumable profile-completion screen (`001-registration-kyc`'s `/profile`, reachable through the
  unchanged routing gate) with a clear message that account creation succeeded but profile setup
  did not finish, and are asked to re-enter the profile fields. Per Constitution Principle III,
  those values are **not** retained anywhere across this failure — asking the user to re-enter
  them is the honest tradeoff of never persisting CURP/RFC/etc. beyond the active flow, not a bug.
- What happens if the user closes the app/tab between pressing `Registrarse` and finishing phone
  verification, then returns later? → This is the same resumable-registration case
  `001-registration-kyc` already defines (`phoneVerifiedAt` as the backend's own progress marker):
  the returning user is routed to wherever they left off by the unchanged gate, and — because the
  in-flight values from `Crear cuenta` live only in memory for the active session (Constitution
  III) — a return via `verify-phone` still incomplete or via the resumable `/profile` screen means
  re-entering the profile fields, exactly as the previous edge case.
- What happens if the nationality list can't be loaded (the backend catalog this depends on,
  `015-registration-profile-support`, has not shipped yet as of this writing)? → The field shows a
  visible loading/error state with a retry action; `Registrarse` is not blocked from being pressed
  for reasons unrelated to nationality, but the nationality field itself cannot be completed and
  the backend will reject a missing/invalid value at the profile step exactly as it does today for
  any other missing required field. No static, hardcoded nationality list is ever used as a silent
  fallback — the human explicitly chose a backend-served catalog as the single source of truth.
- What happens on a duplicate email, duplicate username, or a business RFC already registered to
  another Tienda? → Exactly as today: a specific inline error on the offending field, sourced from
  the backend's response, never a generic failure banner.

**Platform notes**:
- *iOS/Android*: the phone-verification code input keeps the existing SMS-autofill support
  (`CodeInput.ios.tsx`/`CodeInput.android.tsx`, unchanged). The birth-date field opens each
  platform's native date picker (Clarification 4).
- *Web*: the birth-date field uses the browser's native `<input type="date">`. The whole screen
  renders as a single column centered in a white card on a page background, per the design brief's
  Layout section; the nationality picker is fully keyboard-operable (open/close, arrow-key
  navigate, type-to-filter, `Escape` to dismiss) since there is no touch affordance to fall back
  on.

**Dependency on backend `015-registration-profile-support` (User Story 1, the catalog endpoint)**:
this story's nationality field cannot be completed end-to-end against any backend available as of
this writing — see the Edge Case above and Assumptions. The rest of this story (every other field,
the flow, the phone-verification interruption, the resumability behavior) does not depend on
`015` and is independently completable and verifiable today.

---

### User Story 2 - Business ("Tienda") account registration through the redesigned screen (Priority: P2)

A visitor switches the `Crear cuenta` screen's segmented control to `Tienda` and sees a shorter
field set: commercial name, email, password, username, RFC, phone, fiscal address, and the two
consent checkboxes — no personal name, no birth date, no nationality, no CURP, matching the Tienda
mockup exactly. Submission follows the same three-call flow as User Story 1 (register → verify
phone → profile), with the profile step carrying only the business fields.

**Why this priority**: required for the marketplace/shop side; ships after the core personal flow,
mirroring `001-registration-kyc`'s own P1/P2 split between its User Story 1 and 2.

**Independent Test**: switch to `Tienda`, confirm no personal-account fields (name/birth
date/nationality/CURP) are shown or requested at any point in the flow, fill and submit the
shorter field set, confirm the phone-verification interruption appears identically to the Usuario
tab, and confirm a business account is what results.

**Acceptance Scenarios**:

1. **Given** a visitor selects `Tienda`, **When** they view the form, **Then** it shows exactly
   the fields in the design brief's Tienda field list (§4) — commercial name, email, password,
   username, RFC, phone, fiscal address, consents — and nothing else; no personal-account field
   ever appears on this tab, before or after phone verification.
2. **Given** a Tienda submission, **When** RFC is missing, **Then** the request is rejected with a
   visible, specific inline error identifying RFC as the missing field.
3. **Given** a Tienda submission that reaches the automatic profile-completion step (after phone
   verification), **When** the backend's business-profile requirements have not yet been relaxed
   to match this tab's shorter field set (see Dependency note below), **Then** the user sees the
   same honest "account created, profile setup didn't finish" recovery path as User Story 1's first
   Edge Case — never a silent success that actually left an incomplete business profile.

**Platform notes**: identical to User Story 1 — no Tienda-specific platform variance; the tab has
no date-picker or nationality-picker fields at all.

**Dependency on backend `015-registration-profile-support` (User Story 2, the business-profile
relaxation)**: as of this writing, the backend's `profileBusinessSchema` still requires every
personal field (`nombre`, `apellidoPaterno`, `birthDate`, `nationality`, `curp`) in addition to
the business fields (confirmed directly against `src/modules/identity/validation.ts` on
2026-08-06) — none of which the Tienda tab collects. **A Tienda registration built by this feature
cannot complete its automatic profile step against the current backend**; it will predictably fail
exactly as Acceptance Scenario 3 above describes, until `015`'s User Story 2 ships. This is stated
plainly per this feature's own verification standard (see Success Criteria) rather than implied
away. Everything else in this story — the tab's fields, its validation, the registration call
itself, the shared flow mechanics — is independent of `015` and is completable and verifiable
today.

---

### Edge Cases *(cross-cutting, not specific to one user story)*

- What happens to a user who lands on today's still-existing `/profile` recovery screen (reached
  via either edge case above)? → It keeps collecting the same fields it does today
  (`ProfileForm.tsx`, unchanged in shape), restyled to this feature's shared visual tokens so it
  does not look jarringly out of place next to the new `Crear cuenta` screen, but it is **not**
  re-drawn as a second copy of the Usuario/Tienda mockup — it has no segmented control (the
  account type is already known by the time this screen is reached) and is explicitly a recovery
  path, not a primary journey screen.
- What happens on a slow/failed network for the nationality catalog specifically, versus a genuine
  "the catalog endpoint doesn't exist yet" failure? → The UI does not need to (and, before `015`
  ships, cannot) distinguish these — both render the same loading/retry/error state described in
  User Story 1's nationality Edge Case.
- What happens if a user resizes the browser window mid-flow (crossing the mobile/desktop layout
  breakpoint)? → No in-progress form field value is lost; this mirrors the same requirement every
  prior feature in this repo has held for responsive layouts (Constitution Principle VII).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST present one `Crear cuenta` screen with a full-width `Usuario`/`Tienda`
  segmented control, replacing what `app/(auth)/register.tsx` renders today; `Usuario` is
  selected by default.
- **FR-002**: The Usuario tab MUST collect, in order: given name(s), paternal surname, maternal
  surname (optional), email, password, username, birth date, phone, nationality (from a catalog,
  not free text), CURP, RFC, and two consent checkboxes (Terms of Service, Privacy Policy) —
  matching the design brief §3 field list, with the four Clarifications above applied.
- **FR-003**: The Tienda tab MUST collect, in order: commercial name, email, password, username,
  RFC, phone, fiscal address, and the same two consent checkboxes — matching the design brief §4
  field list, with Clarifications 1 and 3 applied. It MUST NOT collect or display any personal
  name, birth date, nationality, or CURP field at any point.
- **FR-004**: Every in-scope field on both tabs MUST be genuinely persisted to the backend, each
  to its own already-existing column (see Assumptions — no new column/migration is needed for
  anything this feature collects).
- **FR-005**: The app MUST NOT display the `DOCUMENTOS` section, the blue `Cumplimiento PLD/AML`
  banner, or `Datos bancarios (PLD)`/CLABE on either tab — all three are explicitly out of scope
  (design brief §6).
- **FR-006**: The screen's visual language MUST use `006-visual-identity`'s existing token layer
  exclusively (colors, typography, spacing, radius, shadows) — no new raw hex/magic-number
  literal, except where a genuinely new token is required (the segmented control's inactive-track
  fill; the sentence-case field-label variant), each of which MUST be added to `src/theme` and,
  where it bears text-on-background color, MUST clear the WCAG 4.5:1 contrast floor via
  `src/theme/contrast.ts`'s real computation — never eyeballed (Constitution Principle VII).
- **FR-007**: All copy on this screen MUST route through `src/domain/i18n`, Spanish as the default
  locale with English at full key parity, with correct Spanish diacritics (`Correo electrónico`,
  not the mockup tool's unaccented `Correo electronico`) — the mockups' missing accents are a
  mockup-tool rendering artifact, not a design decision.
- **FR-008**: The backend interaction MUST remain the three existing calls — register (personal or
  business) → phone verification → profile — with no change to the backend flow itself; the
  existing phone-verification screen MUST remain a visible, reachable step between pressing
  `Registrarse` and the profile submission, never hidden or skipped.
- **FR-009**: The values collected on `Crear cuenta` beyond the initial registration call (name,
  birth date, nationality, CURP, RFC, business fields, consents) MUST survive the phone-
  verification interruption without the user re-entering or re-viewing them as a second form on
  the happy path, MUST be held only in memory for the lifetime of the active registration attempt,
  and MUST never be logged or persisted (e.g. to `expo-secure-store`, local/web storage, or any
  backend call other than the profile submission itself) beyond that (Constitution Principle III).
- **FR-010**: If the automatic profile submission fails after a successful registration and phone
  verification, the app MUST route the user to a screen where they can complete their profile
  (reusing the existing resumable profile-completion screen), with a clear, honest message that
  their account exists but setup is incomplete — never a silent failure, a dead end, or a false
  claim of success.
- **FR-011**: `005-login`'s `KYC_ROUTE_TARGETS.unauthenticated → '/login'` mapping and the
  `useKycGate()`/`resolveKycRoute()`/`src/domain/kyc-gate.ts`/`app/_layout.tsx` routing gate MUST
  come out of this feature byte-for-byte unchanged.
- **FR-012**: The nationality field MUST render via a new shared, reusable selection primitive
  (not a one-off built only for this screen) that is keyboard-operable on web and
  native-appropriate on iOS/Android, sourced from a backend-served list of nationalities — never a
  static, hardcoded list baked into the app.
- **FR-013**: The birth-date field MUST render via a real date-picker control per Clarification 4
  (or the Clarification's stated fallback, if overridden at the approval gate).
- **FR-014**: Any platform-specific behavior in this feature (the date control, and the
  nationality picker's platform-appropriate presentation) MUST use the `.ios.tsx`/`.android.tsx`/
  `.web.tsx` file-extension convention, never an inline `Platform.OS` conditional in a shared
  component body.
- **FR-015**: Every interactive element introduced or restyled by this feature (segmented control,
  text inputs, date control, nationality picker, checkboxes, submit button) MUST expose correct
  accessibility roles/labels and meet the minimum 44×44 tap-target size, and MUST be fully
  operable via keyboard alone on web (tab order, visible focus, `Enter`/`Space` activation, arrow-
  key list navigation and `Escape`-to-dismiss for the nationality picker).
- **FR-016**: The screen MUST remain fully usable at a 375px-wide web viewport through desktop
  widths, and on phone/tablet form factors on iOS/Android; the web layout's centered card MUST use
  the same maximum width already established for this app's other web auth surfaces, not a new
  one-off value.
- **FR-017**: Every validator on this screen MUST surface a specific, real, user-facing message —
  never a raw framework/library default validation string (mirrors the standing bar
  `001-registration-kyc`'s T032 fix established for this exact class of defect).

### Key Entities *(include if feature involves data)*

Mirrors the backend's already-shipped **User** and **BusinessProfile** entities
(`prisma/schema.prisma`) — see `specs/001-registration-kyc/spec.md`'s Key Entities section and
`src/domain/types.ts` for the existing frontend shapes this feature extends the *UI* around, not
the *data model* (no new column is needed — see Assumptions).

- **User**: `nombre`, `apellidoPaterno`, `apellidoMaterno`, `birthDate`, `nationality`, `curp`,
  `rfc`, `email`, `username`, `phone` — every field this feature's Usuario tab collects already
  has a column.
- **BusinessProfile**: `commercialName`, `rfc`, `fiscalAddress` — every field this feature's
  Tienda tab collects already has a column.
- **NationalityOption** *(new, frontend-only until `015` ships)*: a `{ value, label }`-shaped
  option the new selection primitive renders, sourced from the not-yet-specified backend catalog
  endpoint. The exact wire shape is an assumption this spec records provisionally (see
  Assumptions) and MUST be reconciled once backend `015` has its own spec.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Once backend `015` ships both its user stories, a new user can complete either tab's
  full flow (form → phone verification → automatic profile completion) in under 5 minutes of
  active interaction, on any of the three targets.
- **SC-002**: Zero raw framework/library default validation messages are shown anywhere on this
  screen — every validation failure shows specific, real copy (FR-017).
- **SC-003**: The screen is fully usable at a 375px-wide web viewport through desktop widths on
  both tabs, and on phone/tablet form factors on iOS/Android.
- **SC-004**: All validation errors show inline; zero full-page/screen reloads anywhere in the
  flow, including across the phone-verification interruption.
- **SC-005**: A user who abandons the flow after `Registrarse` but before profile completion (for
  any reason — closing the app, a network failure at the profile step) always lands, on return, on
  a screen that lets them finish — never a dead end, never a silently-incomplete account with no
  visible path forward.
- **SC-006**: As of this feature's completion, it is stated plainly and specifically (not implied
  away) which parts of the flow could and could not be verified end-to-end against a real backend,
  given backend `015`'s pending status — mirroring this repo's standing "green tests, broken app"
  verification discipline (`docs/verification.md`, `009-verification-hardening`).

## Assumptions

- **Every column this feature needs already exists** on the backend (`001-user-registration-kyc`,
  `done`) — confirmed directly against `prisma/schema.prisma` on 2026-08-06. No migration task
  belongs in this feature's `tasks.md`.
- **The registration flow stays three backend calls**, per the human's own 2026-08-06 decision
  recorded in `feature_list.json`: `POST /identity/register(/business)` →
  `POST /identity/phone/verify` → `POST /identity/me/profile`. This feature changes what the user
  sees and when the calls fire relative to that view, not the calls themselves.
- **Backend `004-session-authentication` shipped `done` on 2026-08-06**, retiring the dev-only
  `X-User-Id` header entirely (deleted in every `NODE_ENV`, not just outside development/test as
  `001-registration-kyc`'s spec originally documented) in favor of real Bearer-JWT verification.
  The frontend's `src/lib/api.ts` already sends the Supabase session's access token as a Bearer
  header on every call — that mechanism needs no change for this feature. The existing
  `setCurrentUserId`/`X-User-Id`-sending code in `src/lib/api.ts` and the doc comments describing
  it as load-bearing (`src/domain/registration.ts`, `src/domain/profile.ts`) are now **stale**:
  the header is inert against the current backend, not load-bearing. This feature's `tasks.md`
  includes a small task to correct those comments so they do not mislead a future reader — it does
  **not** require removing the now-inert header-sending code itself, since doing so safely is a
  separable, small cleanup with no user-visible effect, and is explicitly out of this feature's
  scope creep.
- **Verification impact of the above** (stated plainly per SC-006, not glossed over): genuinely
  authenticating a phone-verification or profile call against a real backend now requires a real
  Supabase-issued JWT the backend's `AUTH_PROVIDER_PUBLIC_KEY` can verify — which additionally
  depends on backend `AUTH_PROVIDER_MODE` being configured against the same live Supabase project
  this app's client uses (backend `014-supabase-live-auth-integration`, `pending`). This is the
  same class of gap `docs/verification.md`'s "Which live services to run" section already
  documents (a mock-mode backend mints a fake `authProviderId` the app can never sign in against)
  — it is not a new gap this feature introduces, but the removal of the `X-User-Id` fallback means
  there is now genuinely **no backend configuration available today** under which this feature's
  phone-verification/profile calls can be exercised end to end against a live backend; only
  registration itself (`POST /identity/register(/business)`, which needs no bearer token) can.
  `tasks.md`'s verification tasks must state this plainly.
- **Backend `015-registration-profile-support` is required for two things only**: the nationality
  catalog (Usuario tab) and the business-profile relaxation (Tienda tab). Both are isolated,
  clearly-labeled tasks in `tasks.md` rather than smeared across the feature — everything else is
  independent of `015` and proceeds regardless of its status.
- **The nationality catalog's exact wire contract is not yet defined** (backend `015` has no spec
  of its own yet). This spec's Key Entities section records a provisional `{ value, label }` shape
  for planning purposes; `plan.md` records the assumed endpoint path/response shape explicitly as
  an assumption to reconcile once `015` is spec'd, not as a confirmed contract.
- **`app/(auth)/register.tsx` is replaced** (its rendered content, not its route) by the new
  `Crear cuenta` screen; **`app/(auth)/verify-phone.tsx` and `app/(auth)/profile.tsx` remain real,
  separate routes**, unchanged in their route paths — `profile.tsx` becomes this feature's explicit
  recovery/resumability screen rather than a step every user sees. See `plan.md` for the exact
  mechanism that lets the phone-verification interruption resume automatically into a profile
  submission without showing that screen on the happy path.
- Every other assumption `001-registration-kyc`'s spec already records (SMS resend rate limits,
  Expo managed workflow, etc.) still holds and is not repeated here.

## Deferred / Explicitly Out of Scope

- The `DOCUMENTOS` section on both tabs (visual spec preserved in the design brief §5 for
  `002-kyc-document-verification` to inherit — nothing in it is built here).
- The Tienda tab's blue `Cumplimiento PLD/AML` banner and `Datos bancarios (PLD)`/CLABE (design
  brief §6 — `BusinessProfile` has no bank-account column today, so this is a genuine scope
  boundary, not a deferred data question).
- Any language-picker UI, currency conversion, or other unrelated `004-home-scan-shell`-flagged
  forward dependency — unrelated to this feature.
- Restyling `app/(auth)/verify-phone.tsx` beyond what it already looks like today — it stays a
  functional, visible interruption; a full visual restyle to this feature's tokens is not required
  by any user story above, though a small amount of `FormField`/`PrimaryButton` reuse there is not
  precluded if a task naturally touches that file (e.g. wiring the auto-submit behavior).
