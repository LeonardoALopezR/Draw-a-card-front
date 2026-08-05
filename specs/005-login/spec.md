# Feature Specification: Login & Password Recovery

**Feature Branch**: `005-login`

**Created**: 2026-08-05

**Status**: Clarified (two recorded design defaults below, flagged for explicit human
confirmation at the `spec_ready` approval gate — not blocking `[NEEDS CLARIFICATION]`
markers, since a reasonable default exists for each and is fully worked out below)

**Input**: User description: "make a new feature, this feature will be the login view." Scoped
by the human at a scoping gate on 2026-08-05 (verbatim, not re-litigated here): (1) an email +
password sign-in form for a returning user, PLUS a forgot-password flow (Supabase reset-password
email + a set-new-password screen) — explicitly chosen over "just the sign-in form," so password
recovery is in scope, not deferred; (2) change `KYC_ROUTE_TARGETS.unauthenticated`
(`src/features/identity/useKycGate.ts`) from `/register` to `/login`, with the login screen
carrying a "Create account" link to `/register` — the one deliberate, human-approved edit to
`001-registration-kyc`'s gate wiring this feature is permitted to make, restricted to that single
mapping (`resolveKycRoute()` in `src/domain/kyc-gate.ts` keeps its branch logic unchanged). Out
of scope, explicitly not chosen by the human: social sign-in (Google/Apple OAuth) and an
explicit "remember me" toggle (session persistence already works via the `expo-secure-store`
adapter in `src/lib/supabase-client.ts`).

**The gap this fills**: `001-registration-kyc` shipped registration, which auto-signs-in a
brand-new user via `src/lib/supabase-client.ts`'s `signInWithPassword()` (reused, not
reimplemented, by this feature — see Clarifications and plan.md). There has never been a sign-in
screen for a *returning* user: a signed-out user who already has an account is sent to the
registration form, which fails with the backend's `EmailTaken` (409) the moment they try to
create the account they already have.

**Related backend spec**: `001-user-registration-kyc` in the `Draw-a-card` backend repo (status
`done`). This feature calls **no** `Draw-a-card` backend endpoint of its own — sign-in and
password recovery go through the Supabase Auth SDK directly (Constitution Principle III), same
as `001`'s own sign-in call after registration. The backend's identity routes were re-read in
full for this feature (`routes.ts`) to confirm that: (a) there is no backend sign-in/session
endpoint of any kind — confirming sign-in is 100% client-SDK, with nothing extra expected of the
backend on a successful sign-in beyond what `001` already established; and (b) the backend
**does** already have its own `POST /identity/password-reset` (its own `001` spec's User Story 3,
"Forgot password," `FR-008`) — see the Clarifications entry below for why this feature does not
call it.

## Clarifications

### Recorded default 1 (2026-08-05): password-reset request goes through the Supabase client SDK directly, not the backend's existing `POST /identity/password-reset`

**What was found**: the backend cross-check (mandatory for any feature with a backend
counterpart) found the backend already ships a dedicated password-reset endpoint
(`POST /identity/password-reset`, backend `routes.ts:145-156`) that delegates to
`AuthProvider.initiatePasswordReset(email)` using a **privileged, secret-key admin credential**
(`RestAuthProvider`, backend `authProvider.ts`) — not the public anon key this frontend app
holds. It is deliberately anti-enumeration (always returns the same `200`, whether or not the
email is registered).

| Option | Description | Implications |
|---|---|---|
| **A (recommended, chosen default)** | Call `supabase.auth.resetPasswordForEmail(email)` directly from the app, using the same public anon key already configured (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) — no new credential, no new backend call. | Matches Constitution Principle III verbatim ("password reset [is] handled client-side via the auth provider's SDK... The app never implements its own password/session logic... never through the backend") and the human's own scoping-gate wording ("Supabase reset-password email"). Supabase's SDK method has the same anti-enumeration property by default (always succeeds from the caller's point of view, regardless of whether the email is registered) — no security regression versus the backend's endpoint. The backend's `POST /identity/password-reset` becomes unused by this feature (not removed — it's a legitimate, already-shipped, independently-tested backend capability that may serve a different caller, e.g. a future admin tool, later). |
| B | Call the backend's `POST /identity/password-reset` instead. | Reuses the backend's already-built, already-tested endpoint and its explicit anti-enumeration design. Requires this app to make its *first* pre-auth backend call under this feature (a small new interface surface), and directly conflicts with Constitution Principle III's literal text, which would need to be read as scoped to *sign-in* only, not password reset — a constitutional interpretation call, not this spec's to make unilaterally. |
| Custom | Some hybrid (e.g. backend endpoint for the request step, SDK for the confirm step) | Not evaluated — no concrete motivation found for splitting the two steps across two different callers. |

**Recorded default**: **Option A.** Chosen because it is a direct, unambiguous match for both
the binding Constitution Principle III text and the human's own scoping-gate wording, and
carries no discovered security or functional downside (Supabase's own anti-enumeration
behavior covers the one thing the backend's version was specifically built to protect).
**Flagged explicitly for the human to confirm or override at the approval gate** — if the human
intended reuse of the backend's endpoint instead (Option B), only this decision and its
corresponding `plan.md` Research Decision / `src/lib` implementation need to change; nothing
else in this spec depends on which option is chosen, since both deliver the identical user-facing
behavior (submit an email, get a generic confirmation, receive something to act on by email).

### Recorded default 2 (2026-08-05): the whole forgot-password flow stays on the `/login` screen, via an emailed 6-digit code — not a magic link / deep link

**What was found**: tracing `app/_layout.tsx`'s `KycGate` component (which wraps the *entire*
app — every route, not just the `(auth)` group) showed that its `<Redirect>` re-fires whenever
the gate's resolved route changes (via `expo-router`'s `useFocusEffect`, confirmed by reading
`node_modules/expo-router/build/link/Link.js`'s `Redirect` implementation directly). A classic
Supabase "click the link in your email" recovery flow needs the app to open on a **new route**
(e.g. `/reset-password`) and, in the process of opening it, establishes a real (temporary,
"recovery") session on `supabase.auth` — and the instant that session becomes visible to the
shared client `useKycGate()` observes, the gate independently recomputes `resolveKycRoute()` for
whatever *that* account's real registration/KYC progress is and redirects away, almost certainly
before the person has had a chance to type a new password. This app has exactly one shared
Supabase client instance (`src/lib/supabase-client.ts`'s `supabase` singleton) and the human's
constraint for this feature is to touch nothing about the gate beyond the one
`KYC_ROUTE_TARGETS.unauthenticated` mapping — so teaching the gate to exempt a `/reset-password`
route was ruled out as a candidate default (it would mean touching `app/_layout.tsx`'s gate
wiring a second time, beyond the one permitted line).

| Option | Description | Implications |
|---|---|---|
| **A (recommended, chosen default)** | Forgot-password is a set of extra local view-states on the **same** `/login` screen (not new routes): "sign in" → "enter your email to get a reset code" → "enter the code + your new password." The code-confirmation step runs against a second, throwaway Supabase client instance created just for that step (`persistSession: false`, never touching the shared singleton), so no session the gate can see is ever created until the user is done and returns to plain "sign in." | Zero additional gate-adjacent changes of any kind — the diff to gate wiring stays exactly the one permitted `KYC_ROUTE_TARGETS` line. No deep-linking, no URL-scheme/redirect configuration, no `.web.tsx`/native split for session establishment. Reuses the exact "type a code that arrived out-of-band" UX this app already ships for SMS phone verification (`CodeInput`, `VerifyPhoneScreen` pattern) rather than inventing a second pattern. Requires the Supabase project's "Reset Password" email template to include `{{ .Token }}` (a one-time project-dashboard configuration step, outside this repo — see Assumptions) so the email actually contains a code to type, not only a link. |
| B | Classic magic-link flow: emailed link deep-links into a dedicated `/reset-password` route (`drawacard://reset-password` on native via `expo-linking`, a web URL on web), which exchanges the link's token for a session and shows a set-new-password form. | The standard, most common Supabase pattern — but, per the finding above, would additionally require teaching the gate to exempt this one route from its unconditional redirect (a second gate-adjacent change beyond the one permitted line), plus real native deep-link plumbing (this repo's first use of it for an inbound link, `expo-linking` is already a dependency but not yet used this way) and its own edge cases (link opened on a device without the app installed, an already-consumed/expired link, etc.). |
| Custom | A different mechanism | Not evaluated. |

**Recorded default**: **Option A.** Chosen specifically because it is the only option found that
respects the human's explicit "keep the diff to that one route-target mapping only" constraint
without silently shipping a forgot-password flow that would, in practice, usually fail (the
gate racing the recovery screen). **Flagged explicitly for the human to confirm or override at
the approval gate** — if Option B (or an explicit relaxation of the "one mapping only"
constraint) is preferred instead, only this decision, its `plan.md` Research Decision, and the
`ResetPasswordForm`/`app/(auth)/login.tsx` tasks need to change; the sign-in story (User Story 1)
and the routing change do not depend on which option is chosen here.

### Honest statement of what a successful login lands on today (not a design choice — a disclosed, pre-existing limitation)

Per the backend cross-check requirement: the backend's `/identity/me/*` routes (including
`GET /identity/me/kyc-status`, which `useKycGate()` calls immediately after any session is
established) authenticate the caller from a dev-only, in-memory `X-User-Id` header
(`src/lib/api.ts`'s `setCurrentUserId`) until the backend's session-authentication feature ships
— a known limitation already recorded in `specs/001-registration-kyc/spec.md`'s Assumptions and
tracked as `003-registration-kyc-completion` T022/T023 in this repo's own `feature_list.json`.
Today, **nothing in this app's sign-in path ever learns the backend's `User.id`** — unlike
registration (whose response body *is* the newly created `User`, letting `register.tsx` call
`setCurrentUserId(user.id)` directly), a successful `signInWithPassword()` call returns only a
Supabase session, with no backend `User.id` anywhere in it. This means: **every** successful
sign-in through this feature — not only a literal cold app-launch, but any sign-in performed
during this JS session at all, since nothing ever populates `X-User-Id` from a login response —
establishes a valid Supabase session but leaves the backend unable to recognize a user id for
subsequent `/identity/me/*` calls, so `useKycGate()`'s current-user fetch fails
(`statusFetchFailed: true`) and `resolveKycRoute()` (unchanged by this feature) lands the user on
its existing `"kyc-status"` route — `001-registration-kyc`'s FR-010 retryable "couldn't load your
verification status" screen — not the main app. This is **not** something this feature is
responsible for fixing (that is `003-registration-kyc-completion`'s and backend
`004-session-authentication`'s job); it is recorded here, plainly, in User Story 1's acceptance
scenarios and this document's Assumptions, so nobody mistakes "signed in successfully" for
"reached the main app" while reading this spec.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Returning user signs in (Priority: P1)

A visitor who already has an account, and who is currently signed out, is routed to a sign-in
screen (not the registration form) and can sign in with their email and password to resume their
session.

**Why this priority**: This is the entire gap this feature exists to fill — without it, every
returning signed-out user is currently sent to a registration form that will fail for them.

**Independent Test**: With no active session, open the app and confirm it lands on `/login` (not
`/register`); submit valid credentials for an existing account and confirm a Supabase session is
established (survives across the existing `001` session-persistence mechanism); submit invalid
credentials and confirm a clear, inline error with no full-page reload.

**Acceptance Scenarios**:

1. **Given** no active session, **When** the app is opened, **Then** it routes to the sign-in
   screen (`/login`) — not the registration screen — per the `KYC_ROUTE_TARGETS.unauthenticated`
   change (see Clarifications; the *only* change this feature makes to `001`'s gate wiring).
2. **Given** the sign-in screen, **When** the user submits a registered email and its correct
   password, **Then** a Supabase session is established and the screen shows a neutral
   "signing you in" state (not the sign-in form) while the existing `001` routing gate
   re-evaluates and takes over navigation — this screen does not itself decide or hardcode where
   a signed-in user goes next, since that decision already belongs entirely to
   `resolveKycRoute()` (unchanged by this feature).
3. **Given** a fresh JS process (or, per the Clarifications finding above, in practice *any*
   sign-in performed by this feature), **When** sign-in succeeds, **Then** the user reaches
   `001-registration-kyc`'s existing retryable "couldn't load your verification status" screen,
   **not** the main app directly — a disclosed, pre-existing backend limitation (see
   Clarifications), not a defect introduced by this feature, and not something this feature
   attempts to fix.
4. **Given** the sign-in screen, **When** the user submits an incorrect password or an
   unregistered email, **Then** a single, generic inline error is shown (e.g. "Invalid email or
   password") that does not reveal which of the two was wrong (matches Supabase's own default
   anti-enumeration behavior for sign-in) — the field values are preserved, and no full-page
   reload occurs.
5. **Given** the sign-in screen, **When** the underlying network call to the sign-in service
   itself fails (unreachable host, offline, timeout — distinct from a credentials rejection),
   **Then** a distinct, honest message is shown (mirroring `001`'s existing
   `NETWORK_SIGN_IN_ERROR_MESSAGE`, reused here rather than a second copy of the same message).

**Platform notes**: Identical across iOS, Android, and web — plain text/password fields and a
submit button, no platform-specific behavior (unlike phone verification's SMS-autofill, there is
no OS-level "autofill a password" hook this app controls beyond the standard
`autoComplete="password"`/`textContentType` hints already used elsewhere in this codebase's
forms).

---

### User Story 2 - Forgot password (Priority: P2)

A user on the sign-in screen who has forgotten their password can request a reset code by email,
enter that code alongside a new password, and resume signing in with the new password — without
ever leaving the sign-in screen (Clarifications, Recorded default 2).

**Why this priority**: Explicitly chosen as in-scope by the human at the 2026-08-05 scoping gate,
over the simpler "just the sign-in form" alternative — real, if secondary to the core sign-in
gap.

**Independent Test**: From the sign-in screen, select "Forgot password?", submit a registered
email, confirm a generic "check your email" confirmation (identical wording regardless of
whether the email is actually registered), then submit a valid emailed code plus a new password
of at least 8 characters and confirm the screen returns to the plain sign-in state; sign in with
the new password and confirm it succeeds while the old password no longer does.

**Acceptance Scenarios**:

1. **Given** the sign-in screen, **When** the user selects "Forgot password?", **Then** the
   screen switches (in place, no route change) to a "request a reset code" view asking only for
   an email address.
2. **Given** the "request a reset code" view, **When** the user submits any well-formed email
   address, **Then** the same generic confirmation message is shown ("If that email is
   registered, we've sent a code") regardless of whether the email actually belongs to an
   account — this app never reveals account existence through this flow (matches both Supabase's
   own default behavior and the backend's own already-shipped anti-enumeration design for the
   equivalent capability, see Clarifications).
3. **Given** a submitted reset request, **When** the user proceeds to the "enter code and new
   password" view, **Then** they can enter the code that arrived by email, a new password (same
   minimum-length rule as registration, at least 8 characters), and submit — success returns them
   to the plain sign-in view with a confirmation, ready to sign in with the new password. This
   step never establishes a session on the app's shared/ambient Supabase client, and never
   navigates away from `/login` — see Clarifications, Recorded default 2, for why.
4. **Given** the "enter code and new password" view, **When** the submitted code is wrong or
   expired, **Then** an inline error is shown on the code field, with the option to request a new
   code (mirrors `001`'s existing phone-verification resend pattern: a cooldown-limited "Resend
   code" action, not a second full round-trip through the "request a reset code" view).
5. **Given** any of the forgot-password views, **When** the user selects "Back to sign in",
   **Then** the screen returns to the plain sign-in view with no residual state (no stale email
   pre-filled from a previous attempt bleeding into a fresh sign-in attempt in a way that would
   confuse rather than help — pre-filling the just-submitted email as a convenience is
   acceptable, silently retaining an old password attempt is not).

**Platform notes**: Identical across iOS, Android, and web — no platform-specific behavior; this
flow deliberately avoids any deep-linking/URL-scheme mechanism that would otherwise need
platform-specific handling (Clarifications, Recorded default 2).

**Edge Cases**:

- What happens if the user requests a reset code, then closes and reopens the app before
  entering it? → The in-progress "enter code" view is local UI state on `/login`, not persisted;
  reopening the app returns to the plain sign-in view. The user can request a fresh code; the
  previously emailed code remains usable until it expires or is superseded, per Supabase's own
  code lifecycle (not re-implemented by this app).
- What happens if the reset-code request itself fails at the network level (not a credentials
  issue — the request never reached the sign-in service)? → A distinct, honest network-failure
  message, same treatment as User Story 1's Acceptance Scenario 5.
- What happens if a user requests a reset code, successfully sets a new password, but never
  actually signs back in during that session? → No special handling needed; they simply see the
  plain sign-in view and can sign in whenever they choose, exactly like any other visitor to
  `/login`.

---

### User Story 3 - New visitor creates an account from the sign-in screen (Priority: P3)

A visitor without an existing account, who lands on the sign-in screen (per User Story 1's
routing change), can navigate to the registration form instead.

**Why this priority**: Small and mechanical relative to the other two stories, but necessary —
without it, a genuinely new visitor arriving at `/login` (the new default for anyone signed out)
would have no way to reach `/register` at all.

**Independent Test**: From the sign-in screen, select "Create account" and confirm it navigates
to `/register` (`001-registration-kyc`'s existing, unmodified registration screen).

**Acceptance Scenarios**:

1. **Given** the sign-in screen, **When** the user selects "Create account", **Then** the app
   navigates to `/register`.
2. **Given** the registration screen reached this way, **When** the user completes registration,
   **Then** `001-registration-kyc`'s existing flow proceeds completely unmodified (this feature
   changes nothing about `/register` itself, only how a signed-out user arrives somewhere other
   than it by default).

**Platform notes**: Identical across iOS, Android, and web.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: App MUST provide an email + password sign-in screen at `/login`, using the
  existing `signInWithPassword()` (`src/lib/supabase-client.ts`, already exported by
  `001-registration-kyc`) — this feature MUST NOT introduce a second sign-in code path.
- **FR-002**: App MUST change `KYC_ROUTE_TARGETS.unauthenticated`
  (`src/features/identity/useKycGate.ts`) from `/register` to `/login`. This is the **only**
  change this feature makes to `001-registration-kyc`'s gate wiring —
  `resolveKycRoute()` (`src/domain/kyc-gate.ts`) MUST NOT have its branch logic changed, and no
  other `KYC_ROUTE_TARGETS` entry MUST change.
- **FR-003**: The sign-in screen MUST provide a "Create account" link that navigates to
  `/register`, unmodified from `001-registration-kyc`.
- **FR-004**: The sign-in screen MUST show a single, generic, non-field-specific inline error
  for any credentials rejection (wrong password or unregistered email) — MUST NOT reveal whether
  a submitted email belongs to a registered account.
- **FR-005**: The sign-in screen MUST distinguish, in its messaging, a credentials rejection
  (Supabase resolved the call, the credentials were wrong) from a network-level failure to reach
  the sign-in service at all (Supabase's call rejected) — reusing `001`'s existing
  `NETWORK_SIGN_IN_ERROR_MESSAGE` for the latter rather than a duplicate message.
- **FR-006**: After a successful sign-in, the screen MUST NOT itself decide or hardcode a
  post-login destination — it MUST rely entirely on the existing, unmodified
  `useKycGate()`/`resolveKycRoute()` mechanism to route the now-signed-in user, showing a neutral
  "signing you in" state in the interim rather than leaving the sign-in form visible or
  navigating anywhere on its own.
- **FR-007**: App MUST provide a "Forgot password?" entry point from the sign-in screen that lets
  a user request a password-reset code by email, without requiring a route change (Clarifications,
  Recorded default 2) and without revealing whether the submitted email is registered (same
  anti-enumeration requirement as FR-004, applied to this flow).
- **FR-008**: App MUST let a user who requested a reset code submit that code together with a new
  password (minimum 8 characters, matching `001`'s existing password rule) to set a new password
  for their account, and MUST NOT establish any session visible to the app's shared/ambient
  Supabase client (the one `useKycGate()` observes) as a side effect of this step
  (Clarifications, Recorded default 2) — the check MUST use a session scoped only to that step,
  discarded once the step completes.
- **FR-009**: The "enter code" step MUST offer a cooldown-limited resend action, mirroring
  `001-registration-kyc`'s existing phone-verification-code resend UX pattern (not a second,
  differently-behaved resend mechanism).
- **FR-010**: Every interactive element this feature introduces MUST have a real accessibility
  label and a minimum 44×44 logical-pixel tap target, and the sign-in and forgot-password views
  MUST remain usable (no clipped content, no horizontal overflow, no unreachable element) at a
  375px-wide web viewport through desktop widths, and on phone/tablet form factors on iOS/Android
  (Constitution Principle VII).

### Key Entities

None new. This feature introduces no persisted entity of its own — it operates entirely on the
existing Supabase-managed auth account (email/password) that `001-registration-kyc`'s
registration flow already creates, and the existing `User`/session concepts already modeled in
`src/domain/types.ts`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A returning user with valid credentials can go from opening the signed-out app to
  a submitted sign-in attempt in under 30 seconds of active interaction.
- **SC-002**: All sign-in and forgot-password validation/credential/network errors show inline,
  with zero full-page/screen reloads during either flow.
- **SC-003**: The sign-in screen and both forgot-password views are fully usable at a 375px-wide
  mobile viewport on web, at desktop web widths, and on both phone and tablet form factors on
  iOS/Android (Constitution Principle VII).
- **SC-004**: Zero cases, across manual verification, of the forgot-password flow being
  interrupted or redirected away from `/login` by `001-registration-kyc`'s routing gate before
  the user finishes it (the specific failure mode Clarifications' Recorded default 2 exists to
  prevent).
- **SC-005**: A signed-out visitor's default landing route is `/login` in 100% of cases (zero
  regressions to `/register` as a default landing route), and `/register` remains fully reachable
  via the "Create account" link in 100% of cases.

## Assumptions

- **Supabase email-template configuration is a prerequisite, outside this repo's code.** The
  forgot-password flow (Clarifications, Recorded default 2) depends on the Supabase project's
  "Reset Password" email template including `{{ .Token }}` so the email contains a code the user
  can type, not only a `{{ .ConfirmationURL }}` link. This is a one-time project-dashboard
  configuration step; `plan.md`/`tasks.md` records it as a documented prerequisite, not as
  application code this feature can itself guarantee.
- **The emailed code's exact length is assumed to be 6 digits** (Supabase Auth's documented
  default for email OTPs), distinct from `001`'s existing 5-digit SMS phone-verification code.
  The UI component this feature reuses (`CodeInput`) already accepts a configurable length as a
  prop, so this is a one-constant adjustment if the live project's configured length differs —
  not a structural risk.
- **No confirm-password field.** The new-password step uses a single password field with the
  same minimum-length rule as registration, matching this codebase's existing convention
  (`RegistrationForm` also has no confirm-password field) rather than introducing a new pattern
  not used anywhere else in the app.
- **No backend endpoint of this feature's own.** Sign-in and password reset are 100%
  Supabase-SDK-driven (Clarifications, Recorded default 1); the only backend call anywhere in
  this feature's execution path is `001-registration-kyc`'s existing, unmodified
  `GET /identity/me/kyc-status` call inside `useKycGate()`, triggered automatically after a
  session is established — not a new call this feature adds.
- **The known cold-boot / dev-only `X-User-Id` limitation is out of scope to fix here** (see
  Clarifications' honest-landing statement above) — tracked as
  `003-registration-kyc-completion` T022/T023 and backend `004-session-authentication`.
- **Social sign-in and "remember me" are out of scope**, per the human's explicit 2026-08-05
  scoping decision (not re-opened by this spec).
