# Feature Specification: Registration & KYC Screens (Web)

**Feature Branch**: `001-registration-kyc-web-screens`

**Created**: 2026-08-02

**Status**: Draft

**Input**: User description: "Web screens for the registration/KYC flow shown in the
product wireframe: Draw a Card entry screen, personal vs Tienda (business) registration
forms, phone verification code entry, KYC document upload, terms/privacy acceptance, and
the first-run tutorial."

**Related backend spec**: `001-user-registration-kyc` in the `Draw-a-card` backend repo —
this frontend spec implements the web UI for that backend feature. Field names, validation
rules, and status values (`kycStatus: pending | verified | rejected`) must stay consistent
with the backend spec's Key Entities section.

**Related mobile spec**: `002-registration-kyc-mobile-screens` extends this spec with
platform-specific behavior (native camera picker, SMS autofill). Shared requirements should
not be duplicated there — only differences.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Personal registration form (Priority: P1)

A new visitor sees the "Draw a Card" entry screen with email/password fields and a
"Registrarse" button, submits the form, and is taken to a 5-digit verification code screen.

**Why this priority**: This is the very first screen in the product; nothing else is
reachable without it.

**Independent Test**: Render the registration form, submit valid email/password, assert
navigation to the verification-code screen and that a request was sent to the backend's
`/identity` registration endpoint.

**Acceptance Scenarios**:

1. **Given** the entry screen, **When** a visitor submits a valid email + password,
   **Then** the form calls the auth provider SDK directly (Constitution Principle II) and,
   on success, calls the backend to create the profile record, then navigates to code
   verification.
2. **Given** an invalid email format, **When** submitted, **Then** an inline validation
   error appears without a network request being made.
3. **Given** the code verification screen, **When** the correct 5-digit code is entered,
   **Then** the user proceeds to the KYC form step.

---

### User Story 2 - Business ("Tienda") registration form (Priority: P2)

A visitor selects "Tienda" and sees additional fields: commercial name, RFC, fiscal
address, alongside the standard personal fields.

**Why this priority**: Needed for the marketplace/shop side, ships after the core personal
flow.

**Independent Test**: Toggle account type to "Tienda", confirm the additional fields render
and are required before the submit button is enabled.

**Acceptance Scenarios**:

1. **Given** the registration form, **When** the user selects "Tienda", **Then** commercial
   name, RFC, and fiscal address fields appear and are required.
2. **Given** a Tienda form missing RFC, **When** submit is attempted, **Then** the submit
   button remains disabled or shows a validation error identifying the missing field.

---

### User Story 3 - KYC document upload (Priority: P1)

After phone verification, the user uploads official ID, proof of life, and fills in
CURP/RFC, address, and banking details, then accepts terms and privacy policy.

**Why this priority**: Required before a user can meaningfully use trading/portfolio
features — high priority even though it comes after registration.

**Independent Test**: Complete the form with mock file uploads, confirm the submit request
matches the shape expected by the backend's `IdentityDocument` and `Address` models.

**Acceptance Scenarios**:

1. **Given** the KYC form, **When** a user uploads a document image, **Then** it previews
   before submission and is validated for file type/size client-side before upload.
2. **Given** unchecked terms/privacy checkboxes, **When** submit is attempted, **Then** the
   submit button is disabled.
3. **Given** a successful KYC submission, **When** the backend responds, **Then** the user
   is routed to the first-run tutorial (matches wireframe: "Tutorial" screen shown only on
   first login, per the "Solo 1° vez" annotation).

---

### Edge Cases

- What happens if the verification code screen is reached but the code expires? → Show a
  "resend code" action; do not silently fail.
- What happens if a user refreshes the browser mid-KYC-form? → Form state should not be
  fully lost — persist to a draft (local component state is acceptable for v1; do not use
  browser storage APIs per this environment's constraints, only in-memory/component state
  or a backend-side draft endpoint if one exists).
- What happens on slow/failed image upload during KYC? → Show upload progress and a clear
  retry action, not a silent hang.
- How does the UI distinguish `kycStatus: pending` (under review) from `rejected` (needs
  resubmission) after the user returns later? → [NEEDS CLARIFICATION: exact copy/UI for
  each status not specified in the wireframe beyond field presence].

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: UI MUST provide separate entry points for personal vs. business (Tienda)
  registration, matching the wireframe's two registration card variants.
- **FR-002**: UI MUST validate all form fields client-side before submission, mirroring the
  backend's validation rules (kept in sync via shared Zod schemas where practical).
- **FR-003**: UI MUST never persist passwords or KYC document contents in client-side
  storage of any kind (memory only, cleared on navigation away).
- **FR-004**: UI MUST show the first-run tutorial only once per user, per the wireframe's
  "Solo 1° vez" / "Con cartas subidas" / "Sin cartas subidas" branching logic — branching
  condition needs backend support to indicate first-login and portfolio-card-count state.
- **FR-005**: UI MUST support resending the verification code with a visible cooldown
  timer to prevent accidental spam.

### Key Entities *(include if feature involves data)*

- Mirrors the backend spec's **User**, **BusinessProfile**, **IdentityDocument**, and
  **Address** entities — this spec introduces no new data entities, only screens/forms
  that produce requests shaped by those backend models.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete the full registration → verification → KYC form
  flow in under 5 minutes of active interaction.
- **SC-002**: All form validation errors are shown inline, with zero full-page reloads
  during the flow.
- **SC-003**: The flow is fully usable on a 375px-wide mobile viewport (Constitution
  Principle VI).

## Assumptions

- The backend's `001-user-registration-kyc` feature is implemented (or stubbed) before this
  spec's `/speckit-implement` phase begins — this frontend spec assumes those endpoints
  exist.
- File uploads go directly to the backend's presigned-URL flow (or through the backend as a
  proxy) — exact upload mechanism to be resolved in `/speckit-plan`, not this spec.
- Mobile app (Expo) is out of scope for this repo/spec entirely.
