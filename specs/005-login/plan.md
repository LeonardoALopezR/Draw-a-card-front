# Implementation Plan: Login & Password Recovery

**Branch**: `005-login` | **Date**: 2026-08-05 | **Spec**: `specs/005-login/spec.md`

**Input**: Feature specification from `specs/005-login/spec.md`

**Note**: Like `001-registration-kyc` and `004-home-scan-shell`, this folds Phase 0 (research)
and Phase 1 (data model / contracts / quickstart) into this single file rather than separate
`research.md`/`data-model.md`/`contracts/`/`quickstart.md` documents — this feature has no
persisted entity of its own (spec.md's Key Entities is empty) and its "contracts" are Supabase
SDK call shapes, not HTTP endpoints this app exposes, so a full contracts/ directory would hold
a single short file.

## Summary

Add a `/login` screen (email + password, reusing `001-registration-kyc`'s existing
`signInWithPassword()` unchanged) as the new default landing point for a signed-out user
(`KYC_ROUTE_TARGETS.unauthenticated: "/register"` → `"/login"` — the one permitted edit to
`001`'s gate wiring), with a "Create account" link back to `/register`, and a forgot-password
sub-flow (request a code by email, enter the code + a new password) that stays entirely on the
`/login` screen as local view-state rather than new routes, using a throwaway, non-persisted
second Supabase client instance so the code-confirmation step never creates a session the shared
gate (`useKycGate()`) can see and prematurely redirect away from. Zero calls to the `Draw-a-card`
backend beyond the pre-existing, unmodified `GET /identity/me/kyc-status` call already made by
`useKycGate()` after any session is established.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node 20 (per `.nvmrc`) — unchanged.

**Primary Dependencies**: `@supabase/supabase-js` `^2.45.0` (already installed, already used by
`src/lib/supabase-client.ts`) — no new runtime dependency. `react-hook-form` + `@hookform/
resolvers/zod` + `zod` (already installed, `001`'s established forms stack). No new package.

**Storage**: N/A for this feature's own state (no new persisted entity). Session persistence
itself is unchanged, existing `001` behavior (`expo-secure-store` on native, SDK default on web).

**Testing**: Jest + `jest-expo` + `@testing-library/react-native` (already installed, `001`'s
T001) — no new tooling task needed. `docs/verification.md` Levels 1–4 apply as normal; Level 5
(requirement traceability) applies to every `FR-00x` below.

**Target Platform**: iOS, Android, and web (`react-native-web`) from the one Expo codebase
(Constitution I) — identical to every other feature in this repo. No platform-specific file
(`.ios.tsx`/`.android.tsx`/`.web.tsx`) is needed anywhere in this feature — see Research
Decisions below for why the forgot-password design specifically avoids the one thing (deep
linking) that would have required one.

**Project Type**: Single Expo (React Native) app — `app/(auth)/login.tsx` (screen glue),
`src/features/identity/` (new UI components, alongside `001`'s existing ones),
`src/domain/` (new pure logic files + `schemas.ts` additions), `src/lib/supabase-client.ts`
(additions only — no change to its existing exports' behavior).

**Performance Goals**: No numeric latency target beyond SC-001 (sign-in attempt submitted within
30 seconds of active interaction) — this is a UX/interaction-count goal, not a technical
performance budget; no new performance-sensitive code path is introduced.

**Constraints**: `resolveKycRoute()` (`src/domain/kyc-gate.ts`) MUST NOT have its branch logic
changed; `KYC_ROUTE_TARGETS` (`src/features/identity/useKycGate.ts`) MUST change only the
`unauthenticated` entry — no other entry, no change to `useKycGate()`'s hook logic itself, no
change to `app/_layout.tsx`'s `KycGate` component (spec.md FR-002, and see Research Decisions
below for how the forgot-password design avoids needing any further gate-adjacent change at
all).

**Scale/Scope**: 3 user stories (sign-in + routing change, forgot-password, create-account
link); 1 new route file, ~4 new `src/features/identity` components, ~2 new `src/domain` files
plus `schemas.ts` additions, additions (not behavioral changes) to `src/lib/supabase-client.ts`,
a 1-line change to `useKycGate.ts`.

## Constitution Check

*GATE: Must pass before task breakdown. Re-checked after Phase 1 design below.*

| Principle | Check | Status |
|---|---|---|
| I. One Codebase, Three Targets | One `/login` screen, no platform-suffixed files anywhere in this feature (see Research Decisions — the forgot-password design was specifically chosen to avoid needing one). | PASS |
| II. Backend Is the Source of Truth | This feature adds no new `Draw-a-card` backend call of its own (spec.md Assumptions) — the only backend call in its execution path is `001`'s pre-existing, unmodified `GET /identity/me/kyc-status`. No exception to justify. | PASS |
| III. Auth Goes Through the Provider SDK, Not the Backend | Central to this feature: sign-in reuses `001`'s existing `signInWithPassword()` unchanged (FR-001); password reset uses `supabase.auth.resetPasswordForEmail()`/`verifyOtp()`/`updateUser()` directly (Clarifications, Recorded default 1) rather than the backend's own already-shipped `POST /identity/password-reset` — the literal text of this principle is the deciding factor in that recorded default. | PASS |
| IV. Business Logic Stays Portable | All validation (`src/domain/schemas.ts` additions) and orchestration (`src/domain/login.ts`, `src/domain/passwordReset.ts`, new, both zero-RN-import, DI-seamed exactly like `src/domain/registration.ts`'s existing `SignInWithPassword` pattern) lives in `src/domain`; the real Supabase-touching implementations live in `src/lib/supabase-client.ts` (the one file already permitted to import `expo-secure-store`/`react-native`). Screens (`app/(auth)/login.tsx`) are thin glue; UI components (`src/features/identity/*.tsx`) own no network/validation logic of their own. | PASS |
| V. Screen/Component Structure Mirrors Product Domains | All new files live under the existing `identity` bounded context (`src/features/identity/`, `src/domain/`) — no new module, unlike `004`'s justified `navigation` exception. | PASS |
| VI. Spec Before Code, One Spec Per Feature | Single `spec.md`, platform notes inline per user story (all "identical across iOS/Android/web" here, since the design was chosen specifically to avoid platform divergence — see Research Decisions). | PASS |
| VII. Accessible and Responsive by Default | Every new interactive element gets an explicit accessibility label and ≥44×44 tap target as its own task below, mirroring `001`'s `RegistrationForm`/`VerifyPhoneScreen` conventions exactly (same `FormField`, same style constants). | PASS |
| VIII. Local-First Development | Fully developable/testable against `expo start --web` with no live backend running at all (this feature never calls the `Draw-a-card` backend) — only a configured Supabase project is needed, same prerequisite `001` already has. | PASS |

No violations requiring a Complexity Tracking entry.

## Research Decisions

### Sign-in mechanism — reuse `001`'s `signInWithPassword()` unchanged

- **Decision**: `app/(auth)/login.tsx` calls the existing `signInWithPassword(email, password)`
  export from `src/lib/supabase-client.ts` — no new sign-in primitive. A thin `src/domain/
  login.ts` adds `signInSchema` validation (`src/domain/schemas.ts`) and a
  `submitSignIn(signIn: SignInWithPassword, input: SignInInput)` wrapper that parses the schema
  then calls the injected `signIn`, mirroring `registration.ts`'s
  `submitPersonalRegistration`/`retrySignIn` shape exactly (same `SignInWithPassword` DI type,
  imported from `registration.ts` rather than redeclared).
- **Rationale**: `signInWithPassword()` already carries the T034 "MUST NEVER THROW" fix (a
  network-level rejection is caught and mapped to `NETWORK_SIGN_IN_ERROR_MESSAGE`) — reusing it
  is both the literal instruction from this feature's kickoff and the only way to avoid
  re-introducing the exact bug T034 fixed a second time in a new code path.
- **Alternatives considered**: A second, login-specific wrapper around
  `supabase.auth.signInWithPassword` — rejected, pure duplication of an already-hardened
  function for no behavioral difference (registration's post-registration sign-in and a
  returning user's sign-in are the identical SDK call).
- **No password-strength re-validation on sign-in**: `signInSchema.password` is
  `z.string().min(1, "Enter your password")`, not `personalRegistrationSchema`'s
  `min(8, ...)` — a login form should not re-enforce a strength rule against a password that
  might predate any given rule change; only presence is client-side-checked, Supabase is the
  authority on whether it's correct.

### Post-sign-in navigation — none of this feature's own; defers entirely to the existing gate

- **Decision**: `app/(auth)/login.tsx` does not call `router.replace(...)` on a successful
  sign-in. It sets a local `signInSucceeded` flag and renders a neutral "Signing you in…" view
  (mirroring `app/_layout.tsx`'s own minimal loading-placeholder philosophy) while
  `useKycGate()` — mounted at the root layout, observing `supabase.auth.onAuthStateChange`
  independently of this screen — recomputes `route` and its `<Redirect>` fires on its own.
- **Rationale**: Unlike registration (where the very next step is deterministic — a freshly
  registered user always needs phone verification next), a *returning* user's next step depends
  entirely on their individual progress/`kycStatus`, which is exactly what `resolveKycRoute()`
  already exists to decide. Hardcoding a destination in `login.tsx` would duplicate that
  decision in a second place, risking drift from the gate's own logic — exactly what FR-002/the
  "keep the diff to one mapping" constraint is trying to prevent in spirit, even though it's
  phrased about `KYC_ROUTE_TARGETS` specifically.
- **Alternatives considered**: Navigating to a fixed post-login route (e.g. always
  `router.replace("/")`) and letting the gate redirect from there if needed — rejected as an
  unnecessary extra navigation hop with no benefit over simply waiting for the gate, which is
  already watching every relevant piece of state.

### Password-reset request — direct Supabase SDK call, not the backend's `POST /identity/password-reset`

- **Decision**: `supabase.auth.resetPasswordForEmail(email)`, called via a new
  `requestPasswordReset(email)` export from `src/lib/supabase-client.ts` (same
  MUST-NEVER-THROW `try { } catch { return NETWORK_..._MESSAGE }` shape as `signInWithPassword`),
  through a `src/domain/passwordReset.ts` orchestration function
  (`requestPasswordReset(request: RequestPasswordReset, input: RequestResetInput)`) that parses
  `requestPasswordResetSchema` first.
- **Rationale/Alternatives considered**: see spec.md Clarifications, Recorded default 1, in
  full — not repeated here.

### Password-reset confirmation — emailed 6-digit code entered on `/login`, via an isolated, non-shared Supabase client

- **Decision**:
  1. `src/lib/supabase-client.ts` adds `createPasswordRecoverySession()`, a factory that
     internally calls `createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession:
     false, autoRefreshToken: false } })` — a **second, throwaway** Supabase client instance,
     never assigned to the module-level `supabase` singleton `useKycGate()`/`api.ts` observe —
     and returns four bound functions: `verifyCode(email, code)` (wraps
     `client.auth.verifyOtp({ email, token: code, type: "recovery" })`), `updatePassword
     (newPassword)` (wraps `client.auth.updateUser({ password: newPassword })`, only valid
     after `verifyCode` has succeeded on the same client instance), `discard()` (wraps
     `client.auth.signOut()` — cleans up the throwaway client's in-memory session; a no-op on
     the shared singleton, since this client was never that one), each following the same
     MUST-NEVER-THROW shape as `signInWithPassword`.
  2. `src/domain/passwordReset.ts` adds a `submitNewPassword(deps: { verifyCode,
     updatePassword, discard }, input: ResetWithCodeInput)` orchestration function: parses
     `resetPasswordWithCodeSchema`, calls `verifyCode` → on error, returns it without calling
     `updatePassword`/`discard` is still called in a `finally` for hygiene; on success, calls
     `updatePassword` → returns its result; always calls `discard()` before returning, whether
     or not `updatePassword` succeeded, so the throwaway session never lingers.
  3. `src/features/identity/LoginScreen.tsx` creates exactly one
     `createPasswordRecoverySession()` instance via `useState(() => ...)` the first time the
     user opens the "forgot password" view (not eagerly on every `/login` mount), and passes
     its three functions down to `ResetPasswordForm` via the same `onSubmit`-callback-prop
     pattern `RegistrationForm`/`VerifyPhoneScreen` already establish.
- **Rationale**: see spec.md Clarifications, Recorded default 2, for the full trace of why a
  session visible to the shared client would race `useKycGate()`'s `<Redirect>`. Using a second,
  `persistSession: false` client instance is a standard, supported Supabase JS pattern for
  exactly this "one-off, throwaway auth operation" use case — no custom storage adapter or
  monkey-patching needed, since two independently-`createClient()`'d instances never share
  in-memory state by default.
- **Alternatives considered**: performing `verifyOtp`/`updateUser` on the shared `supabase`
  singleton and immediately `signOut()`-ing afterward — rejected, the moment `verifyOtp`
  succeeds, `onAuthStateChange` already fired on the shared client and `useKycGate()` may have
  already redirected before the subsequent `updateUser`/`signOut` calls even run; a magic-link/
  deep-link flow — rejected per Recorded default 2's full comparison in spec.md.

### Shared schemas

- **Decision**: `src/domain/schemas.ts` gains: a new `passwordSchema` (`z.string().min(8,
  "Password must be at least 8 characters")`, factored out of the literal rule already inline
  in `personalRegistrationSchema.password`, which is refactored to reference it — no behavior
  change, `personalRegistrationSchema.password`'s validation is byte-for-byte identical before
  and after); `signInSchema` (`email` + a presence-only `password`); `requestPasswordResetSchema`
  (`email` only); `resetPasswordWithCodeSchema` (`email` + `code` (`/^\d{6}$/`, distinct pattern
  constant from `verificationCodeSchema`'s existing 5-digit one — see `PASSWORD_RESET_CODE_
  LENGTH` below) + `password` (reusing the new shared `passwordSchema`)).
- **Rationale**: Matches this file's existing "one schema per backend/provider contract, reused
  for both validation and typing" convention exactly; factoring out `passwordSchema` avoids two
  independently-maintained 8-character rules silently drifting apart later.

### Shared UI: reuse `CodeInput`/`FormField`, no new low-level primitive

- **Decision**: `ResetPasswordForm.tsx` reuses `CodeInput` (`src/features/identity/CodeInput.tsx`
  and its platform variants) with `length={PASSWORD_RESET_CODE_LENGTH}` (new constant, `6`,
  exported alongside `resetPasswordWithCodeSchema` — see spec.md Assumptions on why 6 is an
  assumption, not a confirmed value) and `FormField` for every field's label/inline-error
  layout, exactly like `VerifyPhoneScreen`/`RegistrationForm` already do. `SignInForm.tsx` and
  `RequestPasswordResetForm.tsx` follow the identical `FormField` + `TextInput` + `Pressable`
  button styling constants already established (copy the same `styles` shape, not a new design
  language).
- **Rationale**: "Extreme consistency" (`docs/conventions.md`) — a fourth independently-invented
  form layout in the same feature area would be a regression, not an improvement.

### First use of `expo-router`'s `<Link>` for a pure navigation affordance

- **Decision**: The "Create account" link (User Story 3) and the "Back to sign in"/"Forgot
  password?" toggles use `expo-router`'s `<Link>` component (`href="/register"`) for the one
  that's a genuine cross-route navigation with no side effect, rather than a `Pressable` +
  `router.push` (registration's existing pattern is `Pressable` + `router.replace`, but that's
  always paired with an async side effect first — this is the first purely-navigational link in
  the app).
- **Rationale**: `<Link>` renders a real `<a href>` on web (correct right-click/"open in new
  tab"/status-bar-preview browser behavior for a plain navigation link) with no functional
  difference on native — a strictly better default for a link with zero side effects, and no new
  dependency (`expo-router` already provides it).
- **Alternatives considered**: `Pressable` + `router.push` (registration's existing pattern) —
  rejected only for this one purely-navigational case, since it produces a `<div>`/non-`<a>` on
  web with no upside; the "Forgot password?"/"Back to sign in" *view-state* toggles (no route
  change at all, see Recorded default 2) correctly stay `Pressable` + local `setState`, not
  `<Link>`, since there is no `href` to point at.

## Project Structure

### Documentation (this feature)

```text
specs/005-login/
├── spec.md                 # Feature spec — two recorded-default decisions, flagged for
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
app/
└── (auth)/
    └── login.tsx                      # NEW — thin screen glue: owns isSubmitting/mode-adjacent
                                        # local state that's genuinely screen-level (which of
                                        # SignInForm/RequestPasswordResetForm/ResetPasswordForm
                                        # to render), wires signInWithPassword +
                                        # createPasswordRecoverySession() to LoginScreen's props.
                                        # No router.replace on sign-in success (see Research
                                        # Decisions).

src/domain/
├── schemas.ts                         # MODIFIED — + passwordSchema, signInSchema,
│                                       # requestPasswordResetSchema, resetPasswordWithCodeSchema,
│                                       # PASSWORD_RESET_CODE_LENGTH. personalRegistrationSchema
│                                       # refactored to reuse passwordSchema (no behavior change).
├── schemas.test.ts                    # MODIFIED — new schemas' happy/error-path cases added
├── login.ts                           # NEW — signInSchema-based submitSignIn(), reusing
│                                       # registration.ts's exported SignInWithPassword DI type
├── login.test.ts                      # NEW
├── passwordReset.ts                   # NEW — requestPasswordReset()/submitNewPassword()
│                                       # orchestration, DI types for the four throwaway-client
│                                       # functions, error mapping
└── passwordReset.test.ts              # NEW

src/lib/
├── supabase-client.ts                 # MODIFIED (additive only) — + requestPasswordReset(email),
│                                       # + createPasswordRecoverySession() factory. signInWithPassword
│                                       # and NETWORK_SIGN_IN_ERROR_MESSAGE UNCHANGED.
└── supabase-client.test.ts            # MODIFIED — new exports' happy/network-failure cases added
                                        # (file may not exist yet; create if this is the first
                                        # test file for this module — check before assuming)

src/features/identity/
├── SignInForm.tsx                     # NEW — email + password fields, submit, "Forgot
│                                       # password?" toggle, "Create account" <Link>
├── SignInForm.test.tsx                # NEW
├── RequestPasswordResetForm.tsx       # NEW — email field, submit, "Back to sign in" toggle
├── RequestPasswordResetForm.test.tsx  # NEW
├── ResetPasswordForm.tsx              # NEW — email (pre-filled, editable) + CodeInput
│                                      # (length=6) + new-password field, submit, cooldown-limited
│                                      # resend, "Back to sign in" toggle
├── ResetPasswordForm.test.tsx         # NEW
├── LoginScreen.tsx                    # NEW — composes the three forms above by local `mode`
│                                       # state ("sign-in" | "request-reset" | "reset-with-code"),
│                                       # owns the "signing you in…" post-success neutral view
└── LoginScreen.test.tsx               # NEW

src/features/identity/useKycGate.ts    # MODIFIED — ONE line:
                                        # KYC_ROUTE_TARGETS.unauthenticated: "/register" → "/login"
```

**Structure Decision**: Single Expo project (Constitution I) — all new files live inside the
existing `identity` bounded context (`app/(auth)/`, `src/domain/`, `src/features/identity/`,
`src/lib/`), consistent with Constitution V (no new module needed, unlike `004`'s justified
`navigation` exception). No platform-suffixed file anywhere in this feature (Research
Decisions above explain why the design specifically avoids needing one).

## Data Model

None new. This feature reads/writes no entity beyond the Supabase-managed auth account
`001-registration-kyc` already creates at registration (email/password) and the session concept
already modeled by that feature's `useKycGate()`. The only "shape" this feature introduces is
purely client-side input/DI typing (`SignInInput`, `RequestResetInput`, `ResetWithCodeInput` —
`z.infer` types on the new `schemas.ts` entries), not a domain entity.

## Interface Contracts

This feature's only external interface is the Supabase Auth JS SDK (`@supabase/supabase-js`
`^2.45.0`), not an HTTP endpoint this app exposes. The exact calls used, all already-documented,
stable SDK methods (no custom REST calls):

| Step | SDK call | Client instance |
|---|---|---|
| Sign in (User Story 1) | `supabase.auth.signInWithPassword({ email, password })` | shared singleton (`src/lib/supabase-client.ts`'s `supabase`) — via the existing, unchanged `signInWithPassword()` wrapper |
| Request reset code (User Story 2) | `supabase.auth.resetPasswordForEmail(email)` | shared singleton (no session side effect from this call) |
| Verify reset code (User Story 2) | `client.auth.verifyOtp({ email, token: code, type: "recovery" })` | throwaway (`createPasswordRecoverySession()`) |
| Set new password (User Story 2) | `client.auth.updateUser({ password: newPassword })` | same throwaway instance as the row above |
| Discard recovery session (User Story 2) | `client.auth.signOut()` | same throwaway instance |

No `Draw-a-card` backend HTTP contract is defined or consumed by this feature (Constitution II
exception not needed — see Constitution Check table).

## Quickstart Validation

Once tasks are implemented, validate manually per `docs/verification.md` Level 3
(`npm run web`) plus the relevant simulator/device for the platform-parity pass:

1. With no active session (fresh incognito/dev-client install), cold-boot the app → confirm it
   lands on `/login`, not `/register`.
2. Submit an unregistered email + any password → confirm a single generic "Invalid email or
   password" inline error, not a full reload.
3. Submit a real registered account's correct credentials → confirm the screen briefly shows a
   neutral "Signing you in…" state, then (per this repo's known cold-boot/X-User-Id limitation,
   spec.md Clarifications) lands on `001`'s existing "couldn't load your verification status"
   retry screen — confirm this is what actually happens, and that it matches what spec.md
   documents, rather than silently treating a different outcome as fine.
4. From `/login`, select "Create account" → confirm `/register` renders unmodified.
5. From `/login`, select "Forgot password?" → submit a real registered email → confirm the
   generic confirmation message, then check the inbox for a code.
6. Enter the received code + a new password (≥8 characters) → confirm success returns to the
   plain sign-in view, and that the OLD password no longer works while the NEW one does (retry
   step 3 with the new password).
7. Mid-forgot-password (after requesting a code, before entering it), background/reopen the app
   or reload the tab → confirm it returns to the plain sign-in view, not a stuck/broken
   intermediate state (spec.md Edge Cases).
8. Repeat steps 1–6 on iOS and Android simulators/devices — confirm no unexpected platform
   divergence (none is expected, per this feature's design), and that VoiceOver/TalkBack
   announces real labels for every new interactive element (SC-003).
9. At a 375px-wide browser window and at a typical desktop width, confirm no clipped content or
   horizontal overflow on any of the three views (SC-003).

## Complexity Tracking

*No Constitution Check violations — table intentionally empty.*
