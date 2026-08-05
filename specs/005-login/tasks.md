# Tasks: Login & Password Recovery

**Input**: Design documents from `specs/005-login/` (`spec.md`, `plan.md`)

**Tests**: Included. `docs/verification.md` mandates unit tests for every `src/domain` export
and component/screen tests for every new/changed screen; test tooling already exists (installed
by `001-registration-kyc`), so no setup task is needed here — this feature starts directly at
Phase 2 (Foundational). See `docs/verification.md` for what counts as verified.

**Organization**: Tasks are grouped by user story from `spec.md`, in priority order
(P1 → P2 → P3). User Story 1 (sign-in + the routing change) is the MVP — it is the entire
reason this feature exists, per spec.md's "gap this fills."

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 (sign-in + routing change, P1), US2 (forgot password, P2), US3 (create-account
  link, P3)
- File paths are exact; see `plan.md`'s Project Structure for the full tree

---

## Phase 1: Setup

**Skipped — no new setup needed.** Test tooling (`jest`, `jest-expo`,
`@testing-library/react-native`) was already installed by `001-registration-kyc`'s T001, and
this feature adds no new runtime dependency (`plan.md`'s Technical Context confirms
`@supabase/supabase-js`, `react-hook-form`, `@hookform/resolvers/zod`, and `zod` are all
already installed).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared validation schemas and sign-in orchestration that User Story 1 (the
MVP) needs. Password-reset-specific domain/lib work is scoped to User Story 2's own phase
instead (it is not needed by the MVP) — see `plan.md`'s Project Structure note on why this
differs slightly from `004-home-scan-shell`'s "everything shared goes in Foundational"
grouping.

- [X] T001 [P] Extend `src/domain/schemas.ts`: add `passwordSchema` (`z.string().min(8,
  "Password must be at least 8 characters")`, the exact rule already inline in
  `personalRegistrationSchema.password`) and refactor `personalRegistrationSchema.password` to
  reference it — confirm via the existing `schemas.test.ts` suite that this is a byte-for-byte
  no-op (same error message, same threshold, all existing registration-schema tests still pass
  unmodified). Add `signInSchema` (`email: z.string().email("Enter a valid email address")`,
  `password: z.string().min(1, "Enter your password")` — deliberately not `passwordSchema`, see
  `plan.md`'s "Sign-in mechanism" Research Decision on why login does not re-enforce a strength
  rule). Extend `schemas.test.ts` with `signInSchema` cases (valid input; missing/invalid email;
  empty password) and a `passwordSchema`-refactor regression case. *(FR-001)*
- [X] T002 [P] Create `src/domain/login.ts`: export `submitSignIn(signIn: SignInWithPassword,
  input: SignInInput): Promise<{ error: string | null }>` — parses `signInSchema` (T001) then
  calls the injected `signIn`. Import the `SignInWithPassword` DI type from
  `src/domain/registration.ts` (do not redeclare it — same type, same shape,
  `001-registration-kyc`'s existing seam). Zero React/React Native imports (Constitution IV).
  Add `src/domain/login.test.ts` covering: a valid submission calling `signIn` with the parsed
  email/password and returning its result unchanged (both the `{ error: null }` and
  `{ error: "<message>" }` shapes); an invalid input (bad email) rejecting before `signIn` is
  ever called. *(FR-001)*

**Checkpoint**: Sign-in validation and orchestration exist and are unit-tested; no screen is
wired yet.

---

## Phase 3: User Story 1 - Returning user signs in (Priority: P1) 🎯 MVP

**Goal**: A signed-out visitor lands on `/login` (not `/register`) and can sign in with email +
password, reusing `001`'s existing `signInWithPassword()` unchanged, with no destination
hardcoded by this screen — the existing gate takes over navigation once a session exists.

**Independent Test**: Per spec.md — with no active session, confirm the app lands on `/login`;
submit valid credentials for an existing account and confirm a session is established (per the
documented, disclosed cold-boot/X-User-Id limitation, landing on `001`'s existing retry screen,
not silently on the main app); submit invalid credentials and confirm a generic inline error.

### Implementation for User Story 1

- [X] T003 [US1] Create `src/features/identity/SignInForm.tsx`: email + password fields (React
  Hook Form + `zodResolver(signInSchema)`, T001/T002), using the shared `FormField` wrapper
  (`src/features/identity/FormField.tsx`) and the same `TextInput`/`Pressable`/style-constant
  conventions as `RegistrationForm.tsx` (`docs/conventions.md` — no new visual language). A
  `serverError` prop renders one general inline error (never a per-field one — see spec.md
  FR-004, Supabase never distinguishes wrong-password from unregistered-email in its own
  message, so there is no field to attribute it to, unlike `RegistrationForm`'s
  field-specific `EmailTaken`/`UsernameTaken` case). A "Forgot password?" `Pressable` calling an
  `onForgotPassword` prop (local UI-state trigger, not a route change — spec.md Clarifications,
  Recorded default 2). A "Create account" `expo-router` `<Link href="/register">` (first use of
  `<Link>` in this repo for a pure navigation affordance — see `plan.md`'s Research Decisions).
  Add `src/features/identity/SignInForm.test.tsx` covering: valid submission calls `onSubmit`
  with the parsed input; a `serverError` renders as a general inline error; the "Forgot
  password?" press calls `onForgotPassword`; the "Create account" link's resolved `href` is
  exactly `/register`. *(FR-001, FR-003, FR-004, FR-010)*
- [X] T004 [US1] Create `src/features/identity/LoginScreen.tsx`: owns a `mode` state, initially
  only handling `"sign-in"` (renders `SignInForm`, T003) — the `"request-reset"`/
  `"reset-with-code"` branches are added by User Story 2 (T013), not built here. Accepts a
  `signIn: SignInWithPassword` prop (real implementation wired at the screen call site, T005).
  On a successful sign-in (`{ error: null }`), sets a `signInSucceeded` flag and renders a
  neutral "Signing you in…" view instead of `SignInForm` — this component never calls
  `useRouter()`/navigates on success (spec.md FR-006; see `plan.md`'s "Post-sign-in navigation"
  Research Decision — the existing gate, not this screen, decides where a signed-in user goes).
  On an error, keeps `SignInForm` visible with `serverError` set. Add
  `src/features/identity/LoginScreen.test.tsx` covering: a successful sign-in replaces
  `SignInForm` with the neutral "Signing you in…" view and calls no navigation function; a
  credentials error keeps `SignInForm` visible with the error rendered; a network-failure error
  (the `NETWORK_SIGN_IN_ERROR_MESSAGE` string) renders distinctly from a credentials error.
  Depends on: T002, T003. *(FR-001, FR-006)*
- [X] T005 [US1] Create `app/(auth)/login.tsx`: thin screen glue (Constitution IV) — imports the
  real `signInWithPassword` from `src/lib/supabase-client.ts` (unchanged, T034's existing
  export) and passes it into `LoginScreen`'s `signIn` prop via `src/domain/login.ts`'s
  `submitSignIn` (T002) as the actual `onSubmit` handler wired to `SignInForm`. Add
  `app/(auth)/login.test.tsx` (mirrors `app/(auth)/register.test.tsx`'s mocking pattern for
  `signInWithPassword`) asserting: a successful submission calls the real
  `signInWithPassword` with the exact submitted email/password and never calls
  `router.replace`/`router.push` (regression guard for the "let the gate handle it" design);
  an SDK-rejected submission surfaces the mapped error inline. Depends on: T004. *(FR-001,
  FR-006)*
- [X] T006 [US1] Change **exactly one line** in `src/features/identity/useKycGate.ts`:
  `KYC_ROUTE_TARGETS.unauthenticated` from `"/register"` to `"/login"`. Do **not** change any
  other `KYC_ROUTE_TARGETS` entry, `useKycGate()`'s hook logic, or
  `resolveKycRoute()`/`src/domain/kyc-gate.ts` in any way (spec.md FR-002 — this is the one
  permitted edit to `001-registration-kyc`'s gate wiring). Run the existing
  `useKycGate.test.ts` and `kyc-gate.test.ts` suites unmodified and confirm they still pass
  (they assert the `KycRoute` value `"unauthenticated"`, not the URL string, so no test change
  is expected — if one genuinely is needed, that is a signal this task's diff grew beyond the
  permitted single line; stop and reconsider before proceeding). Depends on: T005 (so `/login`
  exists as a real route before it becomes the redirect target). *(FR-002)*
- [X] T007 [US1] Manual smoke check (Level 3, `docs/verification.md`): with no active session
  (`npm run web`), confirm cold boot lands on `/login`, not `/register` (spec.md US1 AS1).
  Submit an unregistered email + any password, then a registered email + wrong password — confirm
  both produce the identical generic error (spec.md US1 AS4). Submit a real registered account's
  correct credentials — confirm the "Signing you in…" transition appears, then confirm exactly
  what screen is reached next and that it matches spec.md's documented, disclosed cold-boot/
  X-User-Id limitation (US1 AS3) rather than silently assuming success means "reached the main
  app." Record findings in `progress/impl_005-login.md`. Depends on: T006.

**Checkpoint**: User Story 1 (MVP) is fully functional and independently testable — a returning
user can reach and use the sign-in screen, and `001-registration-kyc`'s gate now defaults a
signed-out visitor there instead of to registration.

---

## Phase 4: User Story 2 - Forgot password (Priority: P2)

**Goal**: A user on `/login` can request a reset code by email, enter that code plus a new
password, and return to plain sign-in — entirely as local view-state on `/login`, using a
throwaway Supabase client instance so no session visible to the shared gate is ever created
mid-flow (spec.md Clarifications, Recorded default 2).

**Independent Test**: Per spec.md — request a reset code for a registered email, confirm the
generic confirmation (same wording for a registered and an unregistered email), enter the
emailed code plus a new password, confirm the screen returns to plain sign-in, and confirm
sign-in then succeeds with the new password and fails with the old one.

### Implementation for User Story 2

- [X] T008 [US2] Extend `src/domain/schemas.ts`: add `PASSWORD_RESET_CODE_LENGTH = 6` (see
  spec.md Assumptions — an assumed value, adjustable if the live Supabase project's configured
  OTP length differs), `requestPasswordResetSchema` (`email` only, same rule as `signInSchema`'s
  email field), `resetPasswordWithCodeSchema` (`email` + `code: z.string().regex(new
  RegExp(`^\\d{${PASSWORD_RESET_CODE_LENGTH}}$`), "Enter the 6-digit code")` + `password:
  passwordSchema`, T001). Extend `schemas.test.ts` with happy/error-path cases for both new
  schemas. Depends on: T001. *(FR-007, FR-008)*
- [X] T009 [US2] Create `src/domain/passwordReset.ts`: DI types `RequestPasswordReset`,
  `VerifyRecoveryCode`, `UpdateRecoveryPassword`, `DiscardRecoverySession` (each `Promise<{
  error: string | null }>`-shaped, matching `SignInWithPassword`'s existing contract, except
  `DiscardRecoverySession` which returns `Promise<void>` — nothing to report). Export
  `requestPasswordReset(request: RequestPasswordReset, input: RequestResetInput):
  Promise<{ error: string | null }>` (parses `requestPasswordResetSchema`, T008, then calls
  `request`). Export `submitNewPassword(deps: { verifyCode: VerifyRecoveryCode, updatePassword:
  UpdateRecoveryPassword, discard: DiscardRecoverySession }, input: ResetWithCodeInput):
  Promise<{ error: string | null }>` — parses `resetPasswordWithCodeSchema` (T008), calls
  `verifyCode(email, code)`; on error, calls `discard()` then returns that error without calling
  `updatePassword`; on success, calls `updatePassword(password)`, then **always** calls
  `discard()` (in a `finally`-equivalent) regardless of `updatePassword`'s outcome, then returns
  `updatePassword`'s result. Zero React/React Native imports. Add `src/domain/passwordReset.
  test.ts` covering: a valid request call; an invalid-email request rejected before the network
  call; a full verify→update→discard happy path (asserting `discard` is called exactly once);
  a `verifyCode` failure (asserting `updatePassword` is never called and `discard` still is); an
  `updatePassword` failure after a successful `verifyCode` (asserting `discard` still runs).
  Depends on: T008. *(FR-007, FR-008)*
- [X] T010 [US2] Extend `src/lib/supabase-client.ts` (additive only — `signInWithPassword` and
  `NETWORK_SIGN_IN_ERROR_MESSAGE` UNCHANGED): add `requestPasswordReset(email: string):
  Promise<{ error: string | null }>` (MUST-NEVER-THROW `try { supabase.auth.
  resetPasswordForEmail(email) } catch { return { error: NETWORK_..._MESSAGE } }`, same shape
  as `signInWithPassword` — mirror its exact try/catch pattern, do not invent a different error-
  handling shape). Add `createPasswordRecoverySession(): { verifyCode: VerifyRecoveryCode,
  updatePassword: UpdateRecoveryPassword, discard: DiscardRecoverySession }` — internally calls
  `createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false,
  autoRefreshToken: false } })` to build a **second, throwaway** client instance (never assigned
  to the module-level `supabase` singleton), and returns the three functions bound to it, each
  wrapping the matching SDK call (`client.auth.verifyOtp({ email, token: code, type: "recovery"
  })`, `client.auth.updateUser({ password: newPassword })`, `client.auth.signOut()`) with the
  same MUST-NEVER-THROW shape. Extend `supabase-client.test.ts` (same `jest.mock("@supabase/
  supabase-js", ...)` pattern already in that file) covering: `requestPasswordReset`'s
  happy/error/network-reject paths (mirroring the existing `signInWithPassword` test block
  structure exactly); `createPasswordRecoverySession()`'s three functions' happy/error/
  network-reject paths; and — the regression guard this task exists for — a test asserting that
  calling any of the recovery-session functions never touches the mock backing the
  module-level `supabase` singleton's `auth` object (i.e. the shared `mockSignInWithPassword`-
  style mocks recorded zero calls as a result of a recovery-session operation). Depends on:
  T009. *(FR-007, FR-008)*
- [X] T011 [P] [US2] Create `src/features/identity/RequestPasswordResetForm.tsx`: one email
  field (`FormField` + `TextInput`, `zodResolver(requestPasswordResetSchema)`, T008), a submit
  button, and a "Back to sign in" `Pressable` calling an `onBack` prop. On successful submission
  shows the generic confirmation copy ("If that email is registered, we've sent a code") — this
  copy is identical regardless of the domain-layer result, since `requestPasswordReset` (T009)
  never distinguishes "email exists" from "email doesn't exist" in the first place (spec.md
  FR-007). Add `src/features/identity/RequestPasswordResetForm.test.tsx` covering: valid
  submission calls `onSubmit` and then renders the generic confirmation; the "Back to sign in"
  press calls `onBack`. *(FR-007)*
- [X] T012 [P] [US2] Create `src/features/identity/ResetPasswordForm.tsx`: an email field
  pre-filled from a `initialEmail` prop (editable, not read-only — spec.md US2 AS5 allows
  pre-filling as a convenience without forcing it), a `CodeInput` (`src/features/identity/
  CodeInput.tsx`) with `length={PASSWORD_RESET_CODE_LENGTH}` (T008), a new-password field
  (`passwordSchema`, T001 — no confirm-password field, spec.md Assumptions), a submit button,
  a cooldown-limited "Resend code" `Pressable` (mirror `VerifyPhoneScreen.tsx`'s
  `RESEND_COOLDOWN_SECONDS`/countdown pattern exactly — same 30-second constant and timer
  `useEffect` shape, not a re-invented mechanism), and a "Back to sign in" `Pressable` calling an
  `onBack` prop. Uses `resetPasswordWithCodeSchema` (T008) via `zodResolver`. Add
  `src/features/identity/ResetPasswordForm.test.tsx` covering: valid submission calls `onSubmit`
  with the parsed input; an invalid/expired-code `serverError` renders inline on the code field;
  the resend button disables for the cooldown window after a press and calls `onResend`; the
  "Back to sign in" press calls `onBack`. *(FR-007, FR-008, FR-009)*
- [X] T013 [US2] Extend `src/features/identity/LoginScreen.tsx` (from T004): add the
  `"request-reset"` mode (renders `RequestPasswordResetForm`, T011, wired to a
  `requestPasswordReset: RequestPasswordReset` prop) and `"reset-with-code"` mode (renders
  `ResetPasswordForm`, T012, wired to `verifyCode`/`updatePassword`/`discard` props matching
  `createPasswordRecoverySession()`'s shape, T010) — these three functions are obtained via
  `useState(() => createPasswordRecoverySession())` created lazily the first time the user
  presses "Forgot password?" (not eagerly on every `/login` mount). `SignInForm`'s
  `onForgotPassword` (T003) switches to `"request-reset"`; a successful request switches to
  `"reset-with-code"` (carrying the submitted email forward as `ResetPasswordForm`'s
  `initialEmail`); a successful `submitNewPassword` (via `src/domain/passwordReset.ts`, T009)
  switches back to `"sign-in"` with a confirmation banner and the email pre-filled into
  `SignInForm`. Every "Back to sign in" press returns directly to `"sign-in"` with no residual
  reset-flow state (spec.md US2 AS5). Extend `LoginScreen.test.tsx` (T004) covering: the full
  `"sign-in"` → `"request-reset"` → `"reset-with-code"` → `"sign-in"` mode sequence; and —
  the regression guard this task exists for — an assertion that during the
  `"reset-with-code"` submission, the `signIn`/shared-client-backed prop(s) passed into
  `LoginScreen` are never called (proving the reset step never touches the shared/ambient
  sign-in path, per spec.md Clarifications' Recorded default 2). Depends on: T004, T009, T010,
  T011, T012. *(FR-007, FR-008, FR-009)*
- [X] T014 [US2] Extend `app/(auth)/login.tsx` (from T005): wire the real
  `requestPasswordReset` and `createPasswordRecoverySession` exports from
  `src/lib/supabase-client.ts` (T010) into `LoginScreen`'s new props, via
  `src/domain/passwordReset.ts`'s `requestPasswordReset`/`submitNewPassword` (T009) as the
  actual handlers. Extend `app/(auth)/login.test.tsx` (T005) covering the same mode-sequence
  assertions as T013 but at the real-implementation call boundary (mocking
  `src/lib/supabase-client.ts`'s new exports, mirroring `register.tsx`'s existing test-mocking
  pattern for `signInWithPassword`). Depends on: T010, T013. *(FR-007, FR-008)*
- [X] T015 [US2] Manual smoke check (Level 3): from `/login`, request a reset code for a real
  registered email — confirm the generic confirmation; repeat with a made-up, unregistered
  email — confirm the identical confirmation wording (spec.md US2 AS2). Check the inbox; if no
  code arrives because the Supabase project's "Reset Password" email template doesn't yet
  include `{{ .Token }}`, configure that template first (one-time project-dashboard step, not
  application code — see spec.md Assumptions) and record that this was required. Enter the
  received code and a new password (≥8 characters) — confirm success returns to plain sign-in
  with the email pre-filled (US2 AS3). Sign in with the OLD password — confirm it now fails;
  sign in with the NEW password — confirm it succeeds (repeats T007's flow). Confirm at no point
  during this entire sequence does the screen navigate away from `/login` or flash a different
  screen (SC-004). Record findings in `progress/impl_005-login.md`. Depends on: T014.

**Checkpoint**: User Story 2 complete — a user who forgets their password can recover access
entirely from `/login`, with no interaction with `001-registration-kyc`'s routing gate.

---

## Phase 5: User Story 3 - New visitor creates an account from the sign-in screen (Priority: P3)

**Goal**: A visitor without an account can reach `/register` from `/login`.

**Independent Test**: Per spec.md — select "Create account" from `/login` and confirm
`/register` renders, completely unmodified from `001-registration-kyc`.

### Implementation for User Story 3

- [X] T016 [US3] Confirm `SignInForm`'s "Create account" `<Link href="/register">` (already
  built in T003) resolves and navigates correctly on all three platforms, and that
  `/register` (`app/(auth)/register.tsx`) is untouched by this feature — grep the diff for this
  feature to confirm zero changes to `app/(auth)/register.tsx`, `RegistrationForm.tsx`, or
  `src/domain/registration.ts` beyond the one import (`SignInWithPassword`'s type, T002) already
  exported from `registration.ts` for reuse. If `SignInForm.test.tsx` (T003) does not already
  assert the link's resolved `href`, extend it to do so explicitly here. Depends on: T003.
  *(FR-003)*

**Checkpoint**: All three user stories complete — `/login` is the fully-functional new default
landing point for a signed-out visitor, with sign-in, password recovery, and a path to
registration all reachable from it.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T017 [P] Accessibility pass (Constitution VII) across `SignInForm`, `RequestPasswordResetForm`,
  `ResetPasswordForm`, and `LoginScreen`'s "Signing you in…" view — accessibility labels on
  every interactive element, minimum 44×44 tap targets, visible keyboard focus order on web
  (tab through every field/button/link in a sensible order across all three modes). Fix
  findings in place; no new files.
- [X] T018 [P] Responsive layout check at a 375px-wide web viewport and at a typical desktop
  width, plus phone and tablet form factors on iOS/Android simulators, across all three
  `/login` modes (spec.md SC-003). Fix findings in place.
- [X] T019 Document the Supabase "Reset Password" email-template prerequisite (`{{ .Token }}`
  must be included for the code-based flow to work — spec.md Assumptions) in
  `src/features/identity/README.md`, alongside a short note on the throwaway-client design
  (`createPasswordRecoverySession()`) so a future reader doesn't mistake it for dead code or
  accidentally consolidate it into the shared `supabase` singleton.
- [X] T020 Run `./init.sh` end to end (no `--skip-*` flags) and confirm `RESULT: SUCCESS` with
  the Tests stage OK, type-check clean, and all three bundle exports (web/iOS/Android) clean —
  this also confirms the one-line `KYC_ROUTE_TARGETS` change (T006) didn't leave `/register`
  unreachable or break any existing `001-registration-kyc` test. Depends on: all prior tasks.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped — nothing to do.
- **Foundational (Phase 2)**: T001, T002 — BLOCKS User Story 1. Independently parallel
  (`[P]`, disjoint files, though T002 imports from `schemas.ts` so should land after T001 lands
  even though both touch different files — sequence T001 before T002 in practice).
- **User Story 1 (Phase 3, P1)**: Depends on Foundational (T001, T002). T003 → T004 → T005 →
  T006 → T007 (mostly sequential — each layer wraps the previous one).
- **User Story 2 (Phase 4, P2)**: Depends on Foundational (T001) directly for `passwordSchema`,
  and on User Story 1's T004/T005 (`LoginScreen`/`app/(auth)/login.tsx` must exist before they
  can be *extended* with the reset-flow modes) — listed after User Story 1 for that reason as
  well as priority.
- **User Story 3 (Phase 5, P3)**: Depends on User Story 1's T003 (the link already exists there;
  this phase only confirms/extends its test).
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- T001 and T002 (Phase 2) can start together, but sequence T001 to land first in practice since
  T002 relies on `signInSchema` from it.
- Within Phase 4: T011 and T012 touch disjoint files and can run in parallel once T008–T010 are
  done; T013 depends on all of T004/T009/T010/T011/T012; T014 depends on T010 and T013; T015
  depends on T014.
- Within Phase 6: T017 and T018 can run in parallel; T019 has no code dependency; T020 must run
  last.

---

## Parallel Example: Phase 4 (User Story 2, after T008–T010 land)

```bash
Task: "Create src/features/identity/RequestPasswordResetForm.tsx + test"
Task: "Create src/features/identity/ResetPasswordForm.tsx + test"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1) — this alone closes the actual gap this feature exists for:
   a returning signed-out user reaches a working sign-in screen instead of a registration form
   that will reject them.
3. **STOP and VALIDATE**: run T007's manual smoke check, including confirming the honest,
   disclosed cold-boot/X-User-Id landing behavior matches spec.md.
4. That's a demoable MVP. User Story 2 (forgot password) and User Story 3 (create-account link
   confirmation) layer on top without touching User Story 1's files beyond the planned
   extensions to `LoginScreen.tsx`/`app/(auth)/login.tsx` (T013/T014).
