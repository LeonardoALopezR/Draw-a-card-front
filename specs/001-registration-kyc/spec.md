# Feature Specification: Registration & KYC

**Feature Branch**: `001-registration-kyc`

**Created**: 2026-08-02

**Status**: Draft

**Input**: User description: "Registration/KYC flow from the product wireframe: Draw a
Card entry screen, personal vs Tienda (business) registration forms, phone verification
code entry, KYC document upload, terms/privacy acceptance, first-run tutorial. One Expo
codebase targets iOS, Android, and web — platform differences are noted inline per screen
rather than as separate specs."

**Related backend spec**: `001-user-registration-kyc` in the `Draw-a-card` backend repo.
Field names, validation rules, and status values (`kycStatus: pending | verified |
rejected`) must stay consistent with that spec's Key Entities section.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Personal account registration (Priority: P1)

A new user signs up with email and password, verifies their identity via a code sent to
their phone, and completes basic KYC before reaching the app's main experience — identical
flow across iOS, Android, and web.

**Why this priority**: Entry point for the entire product; nothing else is reachable
without it.

**Independent Test**: Register a new personal account end-to-end on each target (start with
web via `expo start --web`, since it's fastest to iterate on) and confirm the user lands in
the tutorial with the correct `kycStatus`.

**Acceptance Scenarios**:

1. **Given** a new visitor, **When** they submit email + password + phone, **Then** a
   verification code is sent to their phone and the account is created with `kycStatus:
   pending`.
2. **Given** an unverified account, **When** they submit the correct 5-digit code within
   the expiry window, **Then** their phone is marked verified and they proceed to the KYC
   document step.
3. **Given** a verified-phone account, **When** they submit official ID + proof of life +
   CURP/RFC, **Then** the documents are uploaded and KYC status moves to `pending review`
   (or `verified` if the KYC provider auto-verifies).

**Platform notes**:
- *Web*: document upload uses a standard file input.
- *iOS/Android*: document upload offers a choice between native camera capture
  (`expo-camera`) and photo library (`expo-image-picker`) — most users will photograph
  their physical ID in the moment rather than have an existing scan. Camera permission
  requires a pre-permission explanation screen before the OS prompt (store review
  guidelines expect context, not a bare prompt).
- *iOS/Android*: the verification code input should support SMS autofill where the OS
  provides it, so the code populates automatically when the SMS arrives.

---

### User Story 2 - Business ("Tienda") registration (Priority: P2)

A visitor registers a "Tienda" account, providing commercial name, RFC, and fiscal address
in addition to standard personal fields. Identical across all three platforms — no
platform-specific behavior here.

**Why this priority**: Required for the marketplace/shop side, ships after the core
personal flow.

**Independent Test**: Register with `accountType: business`, confirm a linked
`BusinessProfile` is created and the form rejects submission without RFC.

**Acceptance Scenarios**:

1. **Given** a new visitor selects "Tienda", **When** they submit personal fields plus
   commercial name, RFC, and fiscal address, **Then** a business account with a linked
   `BusinessProfile` is created.
2. **Given** a business registration missing RFC, **When** submitted, **Then** the request
   is rejected with a validation error identifying the missing field.

---

### User Story 3 - Session persistence (Priority: P1)

A logged-in user reopens the app (mobile) or returns to the tab (web) and remains logged in
without re-entering credentials, unless the session has genuinely expired.

**Why this priority**: High-friction cost if missing, especially on mobile where a full app
restart is common.

**Independent Test**: Log in, fully kill and reopen the app (mobile) or close and reopen the
browser tab (web), confirm the user is still authenticated.

**Platform notes**:
- *iOS/Android*: session persists via `expo-secure-store`, not in-memory-only state.
- *Web*: session persists via the Supabase SDK's default web storage mechanism.

---

### Edge Cases

- What happens when the verification code expires before submission? → Allow resend,
  rate-limited to prevent SMS abuse.
- What happens when KYC document upload fails on poor/offline mobile connectivity? → Queue
  and retry automatically rather than failing silently.
- What happens if camera permission is permanently denied on mobile? → Fall back to library
  picker, with a message and a deep link to the OS settings screen.
- What happens when a username is unique-but-differs only by case or diacritics (per the
  wireframe's "Usuario (único y detergente)" note)? → Uniqueness check must be
  case-insensitive and accent-insensitive.
- How does the UI distinguish `kycStatus: pending` from `rejected` when the user returns
  later? → [NEEDS CLARIFICATION: exact copy/UI for each status not specified in the
  wireframe beyond field presence].

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: App MUST allow account creation via email + password, delegated to the
  external auth provider (Constitution: never hand-roll password hashing).
- **FR-002**: App MUST send a 5-digit verification code to the user's phone and validate it
  before allowing progression past registration, with SMS autofill support on iOS/Android.
- **FR-003**: App MUST support both `personal` and `business` account types at
  registration.
- **FR-004**: App MUST collect KYC documents via camera capture or library selection on
  mobile, and file input on web, uploading to the backend's presigned-URL flow (exact
  mechanism resolved in `/speckit-plan`).
- **FR-005**: App MUST enforce case-insensitive, accent-insensitive username uniqueness
  (validated by the backend; surfaced clearly in the UI).
- **FR-006**: App MUST persist sessions securely across restarts on all three platforms.
- **FR-007**: App MUST show the first-run tutorial only once per user, per the wireframe's
  "Solo 1° vez" branching logic.
- **FR-008**: App MUST require camera/photo-library permission with a pre-permission
  explanation screen on mobile before triggering the native OS prompt.

### Key Entities *(include if feature involves data)*

Mirrors the backend spec's **User**, **BusinessProfile**, **IdentityDocument**, and
**Address** entities. See `src/domain/types.ts` for the frontend-side TypeScript shapes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user completes registration → verification → KYC form in under 5
  minutes of active interaction, on any of the three targets.
- **SC-002**: All form validation errors show inline; zero full-page/screen reloads during
  the flow.
- **SC-003**: The flow is fully usable at a 375px-wide mobile viewport on web, and on both
  phone and tablet form factors on iOS/Android.
- **SC-004**: KYC document capture via camera completes in 3 taps or fewer from the KYC
  step screen (choose method → capture/select → confirm) on mobile.

## Assumptions

- The backend's `001-user-registration-kyc` feature is implemented (or stubbed) before this
  spec's `/speckit-implement` phase begins.
- Expo's managed workflow (not bare React Native) is used, so `expo-camera` and
  `expo-image-picker` work without native module linking.
- File uploads use the same backend endpoint regardless of source platform — no
  platform-specific backend changes are assumed.
