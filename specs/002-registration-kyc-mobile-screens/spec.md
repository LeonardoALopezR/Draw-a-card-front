# Feature Specification: Registration & KYC Screens (Mobile)

**Feature Branch**: `002-registration-kyc-mobile-screens`

**Created**: 2026-08-02

**Status**: Draft

**Input**: User description: "Mobile (Expo/React Native) screens for the same
registration/KYC flow covered by the web spec — implement using native equivalents where
the platform offers a materially better experience (camera capture, SMS code autofill)."

**Extends**: `001-registration-kyc-web-screens` — all functional requirements, user stories,
acceptance criteria, and success criteria from that spec apply here unless explicitly
overridden below. This spec only captures what's *different* on mobile. Do not re-implement
or duplicate the shared requirements; reference them.

**Related backend spec**: `001-user-registration-kyc` in the `Draw-a-card` backend repo.

## Platform Differences from the Web Spec

### Difference 1 - Native camera capture for KYC documents (Priority: P1)

**Web behavior** (baseline): file input, user picks an existing image from their device.

**Mobile behavior**: user is offered a choice between capturing a photo directly via the
device camera or picking from their photo library, using Expo's camera/image-picker APIs.

**Why this differs**: most mobile users will photograph their physical ID in the moment
rather than have a pre-existing scan on their phone — offering camera capture directly
meaningfully reduces drop-off versus web's file-picker-only flow.

**Acceptance Scenarios**:

1. **Given** the KYC document step on mobile, **When** the user taps "upload official ID",
   **Then** they are shown a choice between "Take photo" and "Choose from library".
2. **Given** camera permission has not been granted, **When** "Take photo" is tapped,
   **Then** the OS permission prompt appears with a clear pre-prompt explaining why the
   camera is needed (App Store/Play Store review guidelines require context, not just a
   bare OS prompt).

---

### Difference 2 - SMS verification code autofill (Priority: P2)

**Web behavior** (baseline): user manually types the 5-digit code.

**Mobile behavior**: the code input should support OS-level SMS autofill (iOS
`textContentType="oneTimeCode"` equivalent / Android SMS Retriever) so the code populates
automatically when the SMS arrives, matching platform conventions users already expect.

**Why this differs**: native platforms provide first-class autofill APIs unavailable to
plain web forms; skipping this on mobile would feel like a worse experience than users get
from virtually every other app that does phone verification.

**Acceptance Scenarios**:

1. **Given** the verification code screen on mobile, **When** an SMS with the code arrives,
   **Then** the code is offered as an autofill suggestion or filled automatically depending
   on OS capability.

---

### Difference 3 - Persistent login across app restarts

**Web behavior** (baseline): session persists per the auth provider SDK's default web
storage behavior.

**Mobile behavior**: session must persist across full app kills/restarts using Expo's
`expo-secure-store` (or the auth provider's native-storage adapter) rather than the web
SDK's default storage mechanism, so users aren't asked to log in every time they reopen the
app — a much higher-friction cost on mobile than a web tab refresh.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they fully close and reopen the app, **Then** they
   remain logged in without re-entering credentials, unless the session has genuinely
   expired.

### Edge Cases (mobile-specific only)

- What happens if camera permission is permanently denied? → Fall back to library picker,
  with a clear message and a deep link to the OS settings screen for this app.
- What happens on poor/offline connectivity mid-KYC-upload? → Queue the upload and retry
  automatically when connectivity returns, rather than failing silently — mobile network
  conditions are less reliable than the web baseline assumes.

## Requirements *(mandatory)*

### Functional Requirements

All functional requirements from `001-registration-kyc-web-screens` apply. Additionally:

- **FR-M001**: Mobile app MUST request camera and photo library permissions with a
  pre-permission explanation screen before triggering the native OS prompt.
- **FR-M002**: Mobile app MUST persist auth sessions using secure native storage, not
  in-memory-only state, so restarting the app doesn't force re-login.
- **FR-M003**: Mobile app MUST support SMS-based code autofill where the OS provides it.

## Success Criteria *(mandatory)*

All success criteria from `001-registration-kyc-web-screens` apply. Additionally:

- **SC-M001**: KYC document capture via camera completes in under 3 taps from the KYC step
  screen (choose method → capture/select → confirm).

## Assumptions

- Expo's managed workflow (not bare React Native) is used, so `expo-camera` and
  `expo-image-picker` are available without native module linking.
- The backend's upload endpoint accepts the same image formats regardless of whether the
  source was a native camera capture or a web file picker — no mobile-specific backend
  changes are assumed to be needed for this spec.
