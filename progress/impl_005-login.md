# Implementation Progress — 005-login

## Run 1 (2026-08-05) — T001, T002 (Phase 2: Foundational)

Scope: exactly T001 and T002 from `specs/005-login/tasks.md`. No screen/component files
touched — this run is pure `src/domain` logic per Constitution Principle IV, so there is no
new UI surface to smoke-check with `npm run web` (Level 3 doesn't apply to this run; it will
apply starting at T003/T005).

### Files changed

- `src/domain/schemas.ts`
  - Added `passwordSchema = z.string().min(8, "Password must be at least 8 characters")`,
    factored out of the rule that was inline in `personalRegistrationSchema.password`.
  - Refactored `personalRegistrationSchema.password` to `password: passwordSchema` — same
    threshold (8), same message, byte-for-byte behavioral no-op (confirmed by test, see below).
  - Added `signInSchema` (`email: z.string().email("Enter a valid email address")`,
    `password: z.string().min(1, "Enter your password")` — deliberately not `passwordSchema`,
    per plan.md's "Sign-in mechanism" Research Decision: login checks presence only, not
    strength) and its inferred type `SignInInput`.
- `src/domain/schemas.test.ts`
  - Imported `passwordSchema` and `signInSchema`.
  - Added a regression test in the `personalRegistrationSchema` describe block asserting the
    `passwordSchema` refactor is a no-op: a 6-char password still rejects with the exact
    original message, an exactly-8-char password still accepts.
  - Added a `passwordSchema` describe block (rejects <8 chars with the shared message, accepts
    exactly 8).
  - Added a `signInSchema` describe block: valid input accepted; a password shorter than 8
    chars is accepted (proving no strength re-check); missing email rejected; invalid email
    rejected with `"Enter a valid email address"`; empty password rejected with `"Enter your
    password"`.
  - All pre-existing tests in this file were left unmodified and still pass (46/46 total in
    this file after the additions).
- `src/domain/login.ts` (new)
  - Re-exports `SignInWithPassword` from `src/domain/registration.ts` (not redeclared — same
    type/shape, `001-registration-kyc`'s existing DI seam).
  - Exports `submitSignIn(signIn: SignInWithPassword, input: SignInInput): Promise<{ error:
    string | null }>` — parses `signInSchema`, then calls the injected `signIn` with the parsed
    email/password, returning its result unchanged. Zero React/React Native imports.
- `src/domain/login.test.ts` (new)
  - Valid submission: asserts `signIn` is called with the exact parsed email/password, and that
    `{ error: null }` is returned unchanged.
  - Failure shape: asserts a `{ error: "<message>" }` result from `signIn` is returned
    unchanged (not reinterpreted).
  - Invalid input (bad email): asserts `submitSignIn` rejects (via `signInSchema.parse`
    throwing) before `signIn` is ever called (`signInCalled` flag stays `false`).

### Pre-implementation reading confirmed

- `src/domain/registration.ts`'s `SignInWithPassword` type
  (`(email: string, password: string) => Promise<{ error: string | null }>`) — reused verbatim,
  not redeclared.
- `src/lib/supabase-client.ts`'s `signInWithPassword()` doc comment: confirmed MUST-NEVER-THROW
  contract (T034 fix — network-level rejections are caught internally and mapped to
  `NETWORK_SIGN_IN_ERROR_MESSAGE`, never escape as a rejected Promise). Not modified in this
  run; `submitSignIn` relies on this contract rather than adding its own redundant try/catch.

### Tests run

```
npx tsc --noEmit
```
Clean, no output (exit 0).

```
npx jest src/domain/schemas.test.ts src/domain/login.test.ts
```
```
PASS src/domain/login.test.ts
PASS src/domain/schemas.test.ts

Test Suites: 2 passed, 2 total
Tests:       46 passed, 46 total
```

Also ran the full `src/domain` suite as a broader regression check (not required by this task,
done for confidence given the `personalRegistrationSchema` refactor touches shared code):

```
npx jest src/domain
```
```
PASS src/domain/login.test.ts
PASS src/domain/profile.test.ts
PASS src/domain/registration.test.ts
PASS src/domain/schemas.test.ts
PASS src/domain/kyc-gate.test.ts
PASS src/domain/tutorial.test.ts
PASS src/domain/navigation.test.ts

Test Suites: 7 passed, 7 total
Tests:       118 passed, 118 total
```

`./init.sh` was intentionally NOT run in full — per this feature's tasks.md, that's T020's job
once all tasks land. `registration.test.ts` (which already exercises
`personalRegistrationSchema.password` indirectly) also passed unmodified, confirming the
`passwordSchema` refactor didn't change registration validation behavior.

### Requirement traceability (this run's FRs)

| FR | Test(s) |
|---|---|
| FR-001 (email + password sign-in screen, reusing `signInWithPassword()`, no second sign-in code path) | `src/domain/schemas.test.ts` → `signInSchema` describe block (all 5 cases); `src/domain/login.test.ts` → all 3 `submitSignIn` cases |

(FR-001 is the only FR in scope for T001/T002 per tasks.md's own annotation on both tasks;
FR-002 through FR-010 belong to later tasks in this feature.)

### Task status

- [X] T001
- [X] T002

### Deviations from plan

None. `SignInWithPassword` was re-exported (not redeclared) from `src/domain/login.ts` for
caller convenience (so a consumer of `login.ts` doesn't also need a separate import from
`registration.ts` just to name the DI type) — this is a re-export of the exact same type
binding, not a new declaration, so it stays within "do not redeclare it."

### Scope note

Stopped strictly at T001/T002 per instructions. T003 (`SignInForm.tsx`) and everything after it
in Phase 3 onward is untouched.

## Run 2 (2026-08-05) — T003, T004 (Phase 3: User Story 1)

Scope: exactly T003 and T004 from `specs/005-login/tasks.md`. Did not touch
`app/(auth)/login.tsx` (T005), `useKycGate.ts` (T006), or build any `"request-reset"`/
`"reset-with-code"` UI (T013) — per this run's explicit instructions.

### Pre-implementation reading confirmed

- `src/features/identity/FormField.tsx` and `RegistrationForm.tsx` — the established
  React-Hook-Form + `zodResolver` + `FormField` + `TextInput`/`Pressable`/style-constant
  conventions this run's two new components copy verbatim (same `styles` shape: `container`,
  `title`, general-error banner, `input`, `button`/`buttonDisabled`/`buttonText`, all 44×44
  minimums).
- `docs/conventions.md` — no new visual language; forms use React Hook Form + Zod with the
  schema from `src/domain/schemas.ts`; local/UI state via React state (not Redux/Zustand).
- `src/domain/login.ts` (T002) — `submitSignIn`/`SignInWithPassword` re-export, confirmed as the
  seam `LoginScreen`'s `signIn` prop type comes from.
- `src/lib/supabase-client.ts`'s doc comment and `NETWORK_SIGN_IN_ERROR_MESSAGE` export — the
  MUST-NEVER-THROW contract and the exact string this run's `LoginScreen.test.tsx` asserts
  renders distinctly from a credentials-rejection message.
- `plan.md`'s "Post-sign-in navigation" Research Decision (no `router.replace`/`useRouter()` on
  success — the existing gate decides) and "First use of `expo-router`'s `<Link>`" Research
  Decision (a real `<a href>` on web, no functional difference on native, used only for the
  purely-navigational "Create account" affordance — `Pressable`/local `setState` stays for the
  "Forgot password?" view-state toggle, which has no `href`).
- `app/_layout.tsx`'s `KycGate` — confirmed the "minimal neutral placeholder, not a fully
  designed screen" philosophy `LoginScreen`'s post-success "Signing you in…" view mirrors.

### Files changed

- `src/features/identity/SignInForm.tsx` (new)
  - Email + password fields via React Hook Form + `zodResolver(signInSchema)` (T001), using the
    shared `FormField` wrapper and `RegistrationForm`'s exact `TextInput`/`Pressable`/style
    conventions (same `styles` shape; password field uses `autoComplete="password"` +
    `textContentType="password"`, not `RegistrationForm`'s `"password-new"`, per spec.md's
    Platform notes — a returning user's password already exists).
  - `serverError?: string` prop renders ONE general inline error banner
    (`testID="sign-in-form-error"`) — never routed through react-hook-form's per-field
    `setError`, unlike `RegistrationForm`'s field-specific `EmailTaken`/`UsernameTaken` case
    (FR-004: Supabase's own sign-in rejection never distinguishes which credential was wrong).
  - `onForgotPassword: () => void` prop, wired to a `Pressable` — a local UI-state trigger, not
    a route change (no `href`, no `router` call anywhere in this file).
  - `<Link href="/register">Create account</Link>` from `expo-router` — this repo's first use of
    `<Link>` for a pure navigation affordance.
- `src/features/identity/SignInForm.test.tsx` (new) — 5 cases: valid submission calls `onSubmit`
  with the parsed `{ email, password }`; missing fields show `signInSchema`'s inline errors and
  never call `onSubmit`; a `serverError` renders as the one general banner (and is NOT present
  inside either field's own error slot); "Forgot password?" press calls `onForgotPassword`; the
  "Create account" link's resolved `href` prop is exactly `"/register"`. `expo-router` is mocked
  in this file (a `Text` with `accessibilityRole="link"` and the resolved `href` exposed as a
  prop) since the real `<Link>` needs router context (`useExpoRouter()`) a bare RNTL render
  doesn't provide — same pattern already used by every `app/(auth)/*.test.tsx` for `useRouter`.
- `src/features/identity/LoginScreen.tsx` (new)
  - `LoginScreenMode = "sign-in" | "request-reset" | "reset-with-code"` — the union already
    names all three states (per T004's brief, so T013 extends the render `switch`, not the
    state shape), but only `"sign-in"` renders real UI this run; any other `mode` value
    currently renders `null` (a deliberate placeholder — nothing in this run's `SignInForm` sets
    `mode` to anything other than `"sign-in"`/`"request-reset"` via `onForgotPassword`, and
    `"request-reset"` has no view yet).
  - Accepts `signIn: SignInWithPassword` (from `src/domain/login.ts`) and calls it directly with
    `SignInForm`'s parsed `input.email`/`input.password` — no re-validation via `submitSignIn`
    at this layer (validation already happened in `SignInForm` via `zodResolver`); the real
    implementation is wired in by T005, not here.
  - On `{ error: null }`, sets `signInSucceeded` and renders a neutral
    `testID="login-signing-in"` "Signing you in…" `<Text>` in place of `SignInForm` — **no**
    `useRouter()` import anywhere in this file, no navigation call of any kind (FR-006).
  - On `{ error: "<message>" }`, sets `serverError` and keeps `SignInForm` rendered.
- `src/features/identity/LoginScreen.test.tsx` (new) — 3 cases: a successful sign-in replaces
  `SignInForm` with the "Signing you in…" view (`signIn` called with the exact
  email/password, no `Sign in` button left in the tree) and calls neither a mocked `replace` nor
  `push`; a credentials error (`{ error: "Invalid login credentials" }`) keeps `SignInForm`
  visible with that exact text rendered inline; a network-failure error
  (`NETWORK_SIGN_IN_ERROR_MESSAGE`, imported from the real `src/lib/supabase-client.ts`) renders
  distinctly (different string) from the credentials-rejection case. `expo-router` is mocked the
  same way as `SignInForm.test.tsx` (plus a `useRouter` mock, so "never navigates" is actually
  observable) and `@supabase/supabase-js` is mocked (same pattern as
  `src/lib/supabase-client.test.ts`) so importing the real `NETWORK_SIGN_IN_ERROR_MESSAGE`
  constant doesn't also run `supabase-client.ts`'s module-level `createClient(...)` call, which
  otherwise throws in this Jest/Node-20 environment (no native `WebSocket`, per that file's own
  documented `RealtimeClient` issue).

### Tests run

```
npx tsc --noEmit -p tsconfig.json
```
Clean, no output (exit 0).

```
npx jest src/features/identity/SignInForm.test.tsx src/features/identity/LoginScreen.test.tsx \
  src/domain/login.test.ts src/domain/schemas.test.ts src/lib/supabase-client.test.ts
```
```
PASS src/features/identity/SignInForm.test.tsx
PASS src/lib/supabase-client.test.ts
PASS src/domain/schemas.test.ts
PASS src/domain/login.test.ts
PASS src/features/identity/LoginScreen.test.tsx

Test Suites: 5 passed, 5 total
Tests:       58 passed, 58 total
```

Full repo regression check (not required by this task alone, run for confidence since
`SignInForm`/`LoginScreen` are new files with no prior consumers):

```
npx jest
```
```
Test Suites: 40 passed, 40 total
Tests:       252 passed, 252 total
```

### Manual smoke check (Level 3) — deferred, not skipped

No route currently renders `LoginScreen` (`app/(auth)/login.tsx` is T005, not yet built), so
there is nothing reachable via `npm run web` yet to exercise end-to-end. This is expected per
tasks.md's own structure: T007's manual smoke check runs after T005 (screen glue) and T006 (the
`useKycGate` routing-target change) land, once `/login` is a real, reachable route. Level 2
(component tests, above) is the applicable verification level for this run; Level 3 will be
performed and recorded as part of T007.

### Requirement traceability (this run's FRs)

| FR | Test(s) |
|---|---|
| FR-001 (email + password sign-in screen, reusing the injected `SignInWithPassword`, no second sign-in code path) | `SignInForm.test.tsx` → "calls onSubmit with the parsed email/password..."; `LoginScreen.test.tsx` → all 3 cases (each calls the injected `signIn` directly) |
| FR-003 ("Create account" link navigates to `/register`) | `SignInForm.test.tsx` → "resolves the 'Create account' link's href to exactly /register" |
| FR-004 (single, generic, non-field-specific inline error for a credentials rejection) | `SignInForm.test.tsx` → "renders a serverError as a general inline error, not a per-field one"; `LoginScreen.test.tsx` → "keeps SignInForm visible with the serverError rendered on a credentials rejection" |
| FR-005 (network-level failure shown distinctly from a credentials rejection, reusing `NETWORK_SIGN_IN_ERROR_MESSAGE`) | `LoginScreen.test.tsx` → "renders a network-failure error distinctly from a credentials error" |
| FR-006 (screen never itself decides/hardcodes a post-login destination; shows a neutral "signing you in" state instead) | `LoginScreen.test.tsx` → "replaces SignInForm with the neutral 'Signing you in…' view... and navigates nowhere" (asserts a mocked `replace`/`push` are never called) |
| FR-010 (real accessibility label + ≥44×44 tap target on every interactive element introduced) | Every `Pressable`/`Link`/`TextInput` in `SignInForm.tsx` carries an explicit `accessibilityLabel` and a `minHeight: 44`/`minWidth: 44` style, mirroring `RegistrationForm.tsx`'s established pattern; a full manual/automated a11y pass across this feature's three views is T017's dedicated Polish task, not re-litigated per-component here. |

### Task status

- [X] T003
- [X] T004

### Deviations from plan

None. One implementation judgment call not spelled out verbatim in tasks.md: when `mode !==
"sign-in"` (i.e. after "Forgot password?" is pressed), `LoginScreen` renders `null` rather than
still showing `SignInForm` — chosen because tasks.md T004 explicitly says this task handles only
`"sign-in"` and defers the other two modes to T013, and continuing to show `SignInForm` while
`mode` had already moved on would misrepresent that a "request-reset" view exists when it
doesn't yet. This is purely additive scaffolding for T013 to build on, not a behavior a signed-out
user can currently trigger in a way that matters (T005 isn't wired yet either), and is called out
here explicitly in case `code-reviewer`/T013's implementer would prefer a different placeholder.

## Run 3 (2026-08-05) — T005 (Phase 3: User Story 1)

Scope: exactly T005 from `specs/005-login/tasks.md`. Did not touch `useKycGate.ts` (T006 — `/login`
remains unreachable via the gate until that task lands), did not build any reset-flow modes
(User Story 2), and did not modify `src/lib/supabase-client.ts` (`signInWithPassword` is
imported unchanged, exactly as T034 left it).

### Pre-implementation reading confirmed

- `app/(auth)/register.tsx` and `register.test.tsx` — the sibling screen's thin-glue pattern
  (wires a real `src/lib/supabase-client.ts` primitive into a `src/features/identity` screen
  component via a `src/domain` orchestration function) and its test-mocking approach (mock
  `expo-router`'s `useRouter` to assert on navigation calls; mock the SDK boundary rather than
  the domain layer when the test needs to prove a real call chain, vs. mocking the domain layer
  wholesale when only pass-through matters).
- `src/features/identity/LoginScreen.tsx` (T004) — confirmed its exact prop signature
  (`{ signIn: SignInWithPassword }`, `SignInWithPassword` imported from `src/domain/login.ts`)
  and its file-level comment's hard constraint: no `useRouter()`/navigation call anywhere in this
  component on a successful sign-in.
- `src/domain/login.ts` (T002) — `submitSignIn(signIn: SignInWithPassword, input: SignInInput):
  Promise<{ error: string | null }>` — re-parses `signInSchema` before forwarding to the injected
  `signIn`.
- `src/lib/supabase-client.ts` — confirmed `signInWithPassword`'s exact signature (`(email:
  string, password: string) => Promise<{ error: string | null }>`) and its MUST-NEVER-THROW doc
  comment (T034). Not modified.
- `app/(auth)/_layout.tsx` — plain `<Stack screenOptions={{ headerShown: false }} />` scaffolding
  with no per-route registration list; expo-router's file-based routing picks up
  `app/(auth)/login.tsx` automatically, exactly like every other screen already in that group
  (`register.tsx`, `verify-phone.tsx`, etc.). No layout change was needed or made.

### Files changed

- `app/(auth)/login.tsx` (new) — thin screen glue only: renders `LoginScreen` (T004) with a
  `signIn` prop implemented as `(email, password) => submitSignIn(signInWithPassword, { email,
  password })`, closing over the real `signInWithPassword` import from
  `src/lib/supabase-client.ts` (unchanged) and `submitSignIn` from `src/domain/login.ts` (T002).
  This satisfies `LoginScreenProps.signIn: SignInWithPassword`'s exact shape while routing every
  submission back through `signInSchema` validation. No `useRouter()` import, no navigation call
  anywhere in this file (FR-006) — the existing `useKycGate()`/`resolveKycRoute()` mechanism,
  unmodified by this task, is solely responsible for what happens after a session is
  established.
- `app/(auth)/login.test.tsx` (new) — mirrors `register.test.tsx`'s mocking pattern but, because
  this task's regression guard specifically requires proving the *real* `signInWithPassword`
  primitive is reached (not merely that a DI seam was passed through), it instead follows
  `src/lib/supabase-client.test.ts`/`LoginScreen.test.tsx`'s pattern of mocking only the
  underlying `"@supabase/supabase-js"` module (a controllable `auth.signInWithPassword` jest.fn),
  leaving `supabase-client.ts`, `domain/login.ts`, `LoginScreen.tsx`, and `SignInForm.tsx` all
  real and unmocked. `expo-router`'s `Link` and `useRouter` (`replace`/`push`) are mocked the same
  way `LoginScreen.test.tsx` mocks them. Two cases:
  1. A successful submission (mock SDK resolves `{ error: null }`) asserts the real
     `signInWithPassword`/mocked SDK call was invoked with the exact submitted `{ email:
     "ana@example.com", password: "supersecret1" }`, that the "Signing you in…" view appears, and
     that neither `router.replace` nor `router.push` was ever called — the regression guard for
     the "let the gate handle it" design.
  2. An SDK-rejected submission (mock SDK resolves `{ error: { message: "Invalid login
     credentials" } }`) asserts the mapped error string renders inline (`sign-in-form-error`
     testID) and that navigation still never fires.

### Tests run

```
npx tsc --noEmit
```
Clean, no output (exit 0).

```
npx jest login.test.tsx
```
```
PASS app/(auth)/login.test.tsx
  LoginRoute
    ✓ calls the real signInWithPassword with the exact submitted email/password and never navigates
    ✓ surfaces an SDK-rejected submission's mapped error inline

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

Full repo regression check:

```
npx jest
```
```
Test Suites: 41 passed, 41 total
Tests:       254 passed, 254 total
```

### Manual smoke check (Level 3)

`/login` is not yet reachable via the gate (`useKycGate.ts`'s `KYC_ROUTE_TARGETS.unauthenticated`
is still `/register` until T006), so this run checked the route directly rather than via a full
cold-boot flow (that end-to-end check is T007's explicit scope, after T006 lands). Started
`npx expo start --web` on a scratch port and confirmed:
- `GET /login` returns a normal Expo/RNW HTML shell (200, no Metro/bundler error page, no thrown
  server-side prerender exception) — the root `<div id="root">` renders the same
  `data-testid="kyc-gate-loading"` placeholder every other route currently shows before client
  hydration takes over (expected, matches `app/_layout.tsx`'s existing `KycGate` loading-state
  philosophy already exercised by every other screen).
- Fetched the web JS bundle (`expo-router/entry.bundle?platform=web...`) directly (6.05 MB,
  200 OK) and confirmed it contains compiled references to the new `login` module — i.e. Metro
  successfully resolved and bundled `app/(auth)/login.tsx` and its full import chain
  (`LoginScreen` → `SignInForm` → `signInSchema`/`submitSignIn`/`signInWithPassword`) with no
  module-resolution failure.
- Did not perform the full interactive form-fill-and-submit browser check in this run (no
  browser-automation tool available in this environment) — Level 2 (the two component/screen
  tests above, exercising the real `signInWithPassword`→SDK call chain end-to-end against a
  controllable mock) is the verification level actually exercised for this run's behavior;
  T007's dedicated manual smoke-check task (after T006 makes `/login` the real gate target) is
  where a human/interactive-browser pass belongs per tasks.md's own structure.
- Server process stopped after the check.

### Requirement traceability (this run's FRs)

| FR | Test(s) |
|---|---|
| FR-001 (sign-in screen reuses the real `signInWithPassword()` unchanged, no second sign-in code path) | `app/(auth)/login.test.tsx` → "calls the real signInWithPassword with the exact submitted email/password and never navigates" |
| FR-006 (screen never itself decides/hardcodes a post-login destination) | `app/(auth)/login.test.tsx` → both cases assert `router.replace`/`router.push` are never called |

(FR-004/FR-005's mapped-error-rendering behavior itself is already covered by
`LoginScreen.test.tsx`/`SignInForm.test.tsx` from Run 2; this run's second test case additionally
confirms that error path still holds at the real-`signInWithPassword` call boundary.)

### Task status

- [X] T005

### Deviations from plan

None. `app/(auth)/_layout.tsx` required no change — expo-router's file-based routing picks up
`login.tsx` automatically, confirmed by reading it before starting (no per-route registration
list exists in this repo's `(auth)` group, matching every other screen already there).

### Scope note

Stopped strictly at T005. `useKycGate.ts`'s `KYC_ROUTE_TARGETS.unauthenticated` mapping (T006)
and User Story 2's reset-flow modes (T008+) are untouched — `/login` is a real, working route
when navigated to directly, but is not yet the gate's default landing point for a signed-out
visitor.

## Run 4 (2026-08-05) — T006 (Phase 3: User Story 1)

Scope: exactly T006 from `specs/005-login/tasks.md` — a single-line change, deliberately
high-scrutiny per the task's own wording and per the human's explicit scoping decision (this
is the one permitted edit to `001-registration-kyc`'s gate wiring for the entire `005-login`
feature).

### Pre-implementation reading confirmed

- `src/features/identity/useKycGate.ts` (full file, T010/T018/T019/T033/T034's cumulative
  state) — confirmed `KYC_ROUTE_TARGETS` is the only place a `KycRoute` value is mapped to a
  URL string, and that `unauthenticated: "/register"` was the sole entry needing to change.
  Confirmed the hook's actual routing *decision* logic (`resolveKycRoute`, imported unchanged)
  is untouched by this map — the map only supplies *where* to redirect once `resolveKycRoute`
  has already decided the `KycRoute` value.
- `src/domain/kyc-gate.ts` (full file) — confirmed `resolveKycRoute()`'s branch order/precedence
  (fail-safe `statusFetchFailed` check, phone/profile completeness, `kycStatus`, tutorial state)
  has zero dependency on the literal URL strings in `useKycGate.ts`'s `KYC_ROUTE_TARGETS` — it
  only returns the abstract `KycRoute` union value `"unauthenticated"`, never a URL. This
  confirms the two modules are correctly decoupled: this task's one-line change in
  `useKycGate.ts` cannot and does not require any change here.
- `specs/005-login/tasks.md`'s T006 entry — read directly for the authoritative wording (the
  single permitted line, the explicit "do not touch these" list, and the stop-and-reconsider
  instruction if either existing test suite needed modification to pass).

### Files changed

- `src/features/identity/useKycGate.ts` — exactly one line changed:
  ```diff
  -  unauthenticated: "/register",
  +  unauthenticated: "/login",
  ```
  No other line in this file was touched. `src/domain/kyc-gate.ts` and `app/_layout.tsx` have
  zero diff (confirmed below via `git diff`, both empty).

### Tests run

```
npx tsc --noEmit
```
Clean, no output (exit 0).

```
npx jest src/features/identity/useKycGate.test.ts src/domain/kyc-gate.test.ts
```
```
PASS src/domain/kyc-gate.test.ts
PASS src/features/identity/useKycGate.test.ts

Test Suites: 2 passed, 2 total
Tests:       27 passed, 27 total
```
Both suites ran **unmodified** and passed — exactly as tasks.md predicted (they assert the
`KycRoute` value `"unauthenticated"`, never the literal URL string, so the redirect-target
change is invisible to them). No test file needed editing, so the task's own "stop and
reconsider" trigger was never hit.

Full repo regression check (required by this task's own instructions — "run the full `npx jest`
suite to confirm zero regressions anywhere," since this map is read by other tests indirectly):
```
npx jest
```
```
Test Suites: 41 passed, 41 total
Tests:       254 passed, 254 total
```
Zero regressions anywhere in the suite.

### Exact diff (as required by this task's verification instructions)

```
git diff src/features/identity/useKycGate.ts src/domain/kyc-gate.ts app/_layout.tsx
```
```diff
diff --git a/src/features/identity/useKycGate.ts b/src/features/identity/useKycGate.ts
index 27db9ac..899d97f 100644
--- a/src/features/identity/useKycGate.ts
+++ b/src/features/identity/useKycGate.ts
@@ -74,7 +74,7 @@ const UNKNOWN_GATE_USER: GateUser = {
 // ((auth), (onboarding)) are transparent to the URL in expo-router, so no group prefix here —
 // see plan.md's Project Structure for the underlying file paths.
 export const KYC_ROUTE_TARGETS: Record<Exclude<KycRoute, "main">, string> = {
-  unauthenticated: "/register",
+  unauthenticated: "/login",
   "verify-phone": "/verify-phone",
   profile: "/profile",
   "kyc-status": "/kyc-status",
```
`src/domain/kyc-gate.ts` and `app/_layout.tsx` each produced empty diff output — confirmed
byte-for-byte identical to before this task, satisfying every one of the task's hard
constraints (no other `KYC_ROUTE_TARGETS` entry changed, no hook-logic change, no
`resolveKycRoute()`/`kyc-gate.ts` change, no `app/_layout.tsx` `KycGate` change).

### Manual smoke check

Not performed in this run — T006 itself carries no manual-smoke-check requirement in tasks.md
(that is T007's explicit, separate scope, listed as depending on T006). Deferring the
interactive cold-boot check to T007 as tasks.md structures it.

### Requirement traceability (this run's FRs)

| FR | Test(s) |
|---|---|
| FR-002 (a signed-out visitor's default landing route is `/login`, not `/register`) | `src/features/identity/useKycGate.test.ts`'s existing "resolves 'unauthenticated' when no session exists" style cases (unmodified) continue to assert the `KycRoute` value; the actual URL-string behavior this FR now describes is exercised end-to-end by T007's manual smoke check, per tasks.md's own division of labor between T006 (the wiring change) and T007 (the observable behavior check) |

### Task status

- [X] T006 (marked `[X]` in `specs/005-login/tasks.md`)

### Deviations from plan

None. The change is exactly the single line specified, verified against all three explicit
hard constraints in the task description via `git diff` on all three named files.

## Run 5 (2026-08-05) — Targeted addition: regression test for `KYC_ROUTE_TARGETS.unauthenticated`

Scope: not a `tasks.md` task ID — a small, targeted follow-up requested directly, closing out
`code-reviewer`'s T006 review Finding 1 (non-blocking nit): no automated test anywhere asserted
the literal string value `KYC_ROUTE_TARGETS.unauthenticated === "/login"`, only the abstract
`KycRoute` value `"unauthenticated"`. FR-002 (spec.md: "App MUST change
`KYC_ROUTE_TARGETS.unauthenticated` ... from `/register` to `/login`") had zero test-level
coverage per `docs/verification.md` Level 5.

### Pre-implementation reading confirmed

- `src/features/identity/useKycGate.ts` — confirmed `KYC_ROUTE_TARGETS` is already exported
  (`export const KYC_ROUTE_TARGETS: Record<Exclude<KycRoute, "main">, string> = { unauthenticated:
  "/login", ... }`), so no source change was needed — only a missing test.
- `src/features/identity/useKycGate.test.ts` — confirmed none of its existing tests import or
  reference `KYC_ROUTE_TARGETS` at all (only `currentUserQueryKey` and `useKycGate` were
  imported from `./useKycGate`); every existing assertion checks `result.current.route` against
  the abstract `KycRoute` string `"unauthenticated"`, never a URL.
- `progress/review_005-login.md`'s T006 section, Finding 1 — read directly for the exact wording
  of the suggested fix (`expect(KYC_ROUTE_TARGETS.unauthenticated).toBe("/login")`) and the
  instruction not to touch `useKycGate.ts`/`kyc-gate.ts` themselves.

### Files changed

- `src/features/identity/useKycGate.test.ts`
  - Added `KYC_ROUTE_TARGETS` to the existing named import from `./useKycGate` (no new import
    statement).
  - Added one new top-level `describe("KYC_ROUTE_TARGETS", ...)` block (placed just before the
    existing `describe("useKycGate", ...)` block, after the shared `beforeEach`) with a single
    test: `it("maps the unauthenticated route to /login (FR-002)", () => { expect(KYC_ROUTE_TARGETS
    .unauthenticated).toBe("/login"); })`. A one-line comment above the block references FR-002
    and explains why this assertion didn't already exist (T006's own "do not modify these two
    suites" instruction, by design, left the URL-string literal untested at the time).
  - No other line in this file changed. `useKycGate.ts` and `kyc-gate.ts` were not touched (no
    `git diff` output on either — confirmed below).

### Tests run

```
node_modules/.bin/tsc --noEmit
```
Clean, no output (exit 0).

```
npx jest src/features/identity/useKycGate.test.ts
```
```
PASS src/features/identity/useKycGate.test.ts
Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
```
(18 pre-existing + 1 new = 19; matches the one-new-assertion expectation.)

Full repo suite:
```
npx jest
```
```
Test Suites: 41 passed, 41 total
Tests:       255 passed, 255 total
```
Exactly one net-new test versus the T006 review's last recorded count (254 → 255), zero
regressions anywhere else in the tree. (The pre-existing, unrelated act()/React Query
async-cleanup console warning in this file's own suite still appears — traced in the T005 review
to code that predates this run, not introduced by this change, does not fail any test.)

### Diff scope confirmation

```
git status --porcelain
```
Shows exactly one newly modified file beyond what was already tracked/untracked from prior,
already-reviewed T001–T006 runs: `src/features/identity/useKycGate.test.ts`. `useKycGate.ts`
does not appear in `git status` output at all this run (byte-for-byte unchanged, confirmed by
its absence). No other file touched.

### Requirement traceability

| FR | Requirement | Test(s) |
|---|---|---|
| FR-002 | `KYC_ROUTE_TARGETS.unauthenticated` maps to `/login`, not `/register` | `src/features/identity/useKycGate.test.ts` → `KYC_ROUTE_TARGETS` describe block, "maps the unauthenticated route to /login (FR-002)" |

### Task status

Not a `tasks.md`-numbered task — no checkbox to flip. `T006` (already `[X]`) remains `[X]`;
this run only adds test coverage for the value it set.

### Deviations from plan

None. `KYC_ROUTE_TARGETS.unauthenticated` and every other part of `useKycGate.ts`/`kyc-gate.ts`
were left byte-for-byte unchanged, exactly as instructed — this run is confined to test file(s)
only.

---

## Run 6 (2026-08-05) — T007 (Phase 3 checkpoint: MVP manual smoke check)

Scope: exactly T007 from `specs/005-login/tasks.md`. Performed directly by the orchestrator
(`sdd-orchestrator`), not `task-implementer` — `task-implementer`'s tool access (Read, Write,
Edit, Bash, Grep, Glob) has no browser/simulator driving capability, and this task requires
real interactive verification per this repo's own "green tests, broken app" history (see
`progress/history.md`/`004-home-scan-shell`'s notes). The full `npx jest` suite (255/255,
41 suites) and `tsc --noEmit` were re-confirmed clean immediately before this run.

**Platform coverage — stated precisely, not implied:**
- **Web**: exercised directly against a real running `npm run web` dev server (port 8081) via
  the Claude Browser tool (real DOM reads, real form input, real clicks, real
  `window.location.href`/console/network inspection) — not just Jest/RNTL.
- **iOS Simulator**: NOT exercised. `mcp__Claude_Code_iOS_Simulator__control` (`attach`) failed:
  Xcode is installed but not selected on this machine (`xcode-select` needs to point at
  `/Applications/Xcode.app/Contents/Developer`, which requires `sudo` and the human's password —
  not something this session can run). Per the tool's own explicit instruction, no fallback to
  generic screen-control tools was attempted; this is a disclosed gap, not silently skipped.
- **Android**: not attempted (no emulator/SDK in this environment, consistent with every prior
  feature's notes).

**Findings, in the order tasks.md's T007 text specifies:**

1. **Cold boot lands on `/login`, not `/register` (US1 AS1)** — CONFIRMED. Navigating to
   `http://localhost:8081/` with no active session redirected to `/login`
   (`window.location.href` read back as exactly `http://localhost:8081/login`); the rendered
   screen shows "Sign in", an Email field, a Password field, "Forgot password?", a "Sign in"
   button, and a "Create account" link. `read_page` confirmed the "Create account" link's
   resolved `href` is exactly `/register` (FR-003/US3, also confirmed at the component-test
   level in T003's batch).

2. **Unregistered email + any password, then registered email + wrong password → identical
   generic error (US1 AS4)** — PARTIALLY VERIFIABLE, and here is the honest limit of what this
   environment allows: `.env`'s `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` are
   both empty strings in this sandbox (confirmed by reading `.env` directly), so
   `signInWithPassword()` always talks to the unreachable `https://placeholder.supabase.co`
   fallback (documented in `supabase-client.ts`'s own T034 comment) — every submission in this
   environment hits the SAME network-unreachable path regardless of which credentials are typed,
   never a real Supabase Auth credentials response. This is the identical, already-disclosed
   limitation `001-registration-kyc`'s own notes recorded ("the happy path additionally needs
   real EXPO_PUBLIC_SUPABASE_URL/ANON_KEY... it currently runs... a fake authProviderId the
   client cannot sign in against"), not something new to this feature. What WAS confirmed live:
   submitting an unregistered email + a password renders exactly one general inline error
   (`SignInForm`'s single `serverError`, not a per-field error) reading "Failed to fetch" — the
   browser console (`read_console_messages`) traced this to a real `net::ERR_NAME_NOT_RESOLVED` /
   `TypeError: Failed to fetch` against the placeholder host, i.e. a genuine network failure, not
   a stub. One honest observation for the record (not a 005-login-introduced bug — `signInWithPassword`
   is reused byte-for-byte unmodified from T034): the text shown was the browser/SDK's raw
   `"Failed to fetch"` string, not the polished `NETWORK_SIGN_IN_ERROR_MESSAGE` copy
   ("We couldn't reach the sign-in service..."). This means supabase-js's web fetch adapter is
   *resolving* with an `AuthError` whose `.message` is the raw fetch error (so
   `error?.message ?? null` surfaces it) rather than *rejecting* (which is what
   `signInWithPassword`'s `try/catch` — and `NETWORK_SIGN_IN_ERROR_MESSAGE` — is specifically
   there to catch, per its own T034 doc comment). This is pre-existing behavior of the reused,
   unmodified function (would affect registration's auto-sign-in identically), not something
   T005 introduced — flagged here for the record per this repo's verification culture, not
   claimed as this feature's defect to fix. Genuine credentials-level testing (wrong password vs.
   unregistered email both producing Supabase's real, identical generic auth error) requires a
   live Supabase project and was NOT verified end-to-end in this environment.
   Client-side validation WAS fully verified live and needs no backend: submitting a syntactically
   invalid email ("not-an-email") renders "Enter a valid email address" as a field-level error
   under the Email input and issues no network call at all (confirmed via
   `read_network_requests` — no new request appeared), i.e. `signInSchema` genuinely blocks
   before any `signIn` call, matching `login.test.ts`'s unit-level assertion of the same
   behavior.

3. **Valid credentials → "Signing you in…" transition → lands on the documented, disclosed
   cold-boot/X-User-Id retry screen, not silently the main app (US1 AS3)** — NOT VERIFIED in this
   environment, honestly, for the same reason as (2): there is no real registered Supabase
   account reachable from this sandbox to sign in with. This was exhaustively verified instead at
   the unit-test level in T004's `LoginScreen.test.tsx` (mocked successful sign-in renders the
   neutral "Signing you in…" view and calls no navigation function) and T005's
   `app/(auth)/login.test.tsx` (same guarantee at the real-`signInWithPassword`-call boundary) —
   both already independently re-run and APPROVEd by `code-reviewer`. The "what screen is reached
   next" half of this scenario (FR-010's retry screen) is `001-registration-kyc`'s existing,
   already-shipped, already-tested behavior — `useKycGate`'s own test suite covers the
   `statusFetchFailed` → `"kyc-status"` route path — and is unmodified by this feature; T006's
   batch confirmed `resolveKycRoute()` byte-for-byte unchanged.

4. **"Forgot password?" behavior** (not explicitly in T007's checklist but adjacent/relevant to
   FR-006's "never navigate" guarantee): clicking it switched local `mode` state away from
   `"sign-in"` (the screen went blank) with `window.location.href` confirmed unchanged at
   `http://localhost:8081/login` throughout — no navigation occurred, consistent with spec.md's
   Clarifications "Recorded default 2." The blank render itself is EXPECTED and not a bug: T004's
   batch built only the `"sign-in"` mode; the `"request-reset"` mode's actual UI is T013's job
   (User Story 2, not yet implemented). `code-reviewer`'s T004 review already flagged and
   accepted this exact placeholder behavior by name.

**Verdict for this checkpoint**: User Story 1 (MVP)'s routing change and error-handling
mechanics are confirmed working live on web to the full extent this environment's missing
Supabase credentials allow; the credentials-differentiation and successful-sign-in-destination
scenarios are covered at the unit-test level only (already reviewed/approved) and were not
re-confirmed against a live backend here — this mirrors, rather than introduces, the exact
environment gap `001-registration-kyc` already disclosed. No iOS Simulator or Android coverage
this run — disclosed above, not implied.

### Task status

`T007` is a manual-smoke-check task, not a code change — no file diff. `tasks.md`'s `T007`
checkbox to be marked `[X]` by the orchestrator alongside this record.

### Deviations from plan

Performed by the orchestrator directly rather than `task-implementer`, for the tool-access reason
stated above — a deviation from the letter of "delegate every task to task-implementer" but not
from tasks.md's actual intent (a real interactive smoke check), and disclosed here rather than
silently reassigned.

---

## Run 7 — T008, T009 (Phase 4, User Story 2 — forgot-password domain foundation)

**Scope**: `T008` (schemas.ts extensions) and `T009` (`src/domain/passwordReset.ts`) only. No UI
component, no `src/lib/supabase-client.ts` change (that's T010, out of this run's scope).

### Files changed

- `src/domain/schemas.ts` — added:
  - `PASSWORD_RESET_CODE_LENGTH = 6` (spec.md Assumptions: an assumed value, adjustable if the
    live Supabase project's configured OTP length differs).
  - `requestPasswordResetSchema` — `email` only, identical rule to `signInSchema`'s email field.
  - `resetPasswordWithCodeSchema` — `email` + `code: z.string().regex(new
    RegExp(`^\d{6}$`), "Enter the 6-digit code")` + `password: passwordSchema` (reused from
    T001, not reinvented).
  - `RequestResetInput`/`ResetWithCodeInput` `z.infer` types.
- `src/domain/schemas.test.ts` — added `describe("requestPasswordResetSchema", …)` (happy path,
  missing email, invalid email with custom message) and `describe("resetPasswordWithCodeSchema",
  …)` (happy path, invalid email, non-digit code, wrong-length code, short password reusing
  `passwordSchema`'s shared message).
- `src/domain/passwordReset.ts` (new) — DI types `RequestPasswordReset`, `VerifyRecoveryCode`,
  `UpdateRecoveryPassword` (each `Promise<{ error: string | null }>`), and
  `DiscardRecoverySession` (`Promise<void>`, matching tasks.md's exact contract). Exports:
  - `requestPasswordReset(request, input)` — parses `requestPasswordResetSchema` then calls
    `request(parsed.email)`, returning its result unchanged (mirrors `login.ts`'s `submitSignIn`
    exactly).
  - `submitNewPassword({ verifyCode, updatePassword, discard }, input)` — parses
    `resetPasswordWithCodeSchema`, calls `verifyCode(email, code)`; on error, calls `discard()`
    then returns that error WITHOUT ever calling `updatePassword`; on success, calls
    `updatePassword(password)` inside a `try`, with `discard()` in the matching `finally` so it
    always runs exactly once regardless of `updatePassword`'s outcome, then returns
    `updatePassword`'s result via the `try` block's `return`. Zero React/React Native imports.
- `src/domain/passwordReset.test.ts` (new) — covers: a valid `requestPasswordReset` call
  (asserts the injected `request` receives the parsed email); an invalid-email request rejected
  (`.rejects.toThrow()`) before `request` is ever called; the full verify→update→discard happy
  path (asserts `verifyCode`/`updatePassword` each called once, `updatePassword` receives the
  parsed password, `discard` called exactly once, final result is `updatePassword`'s); a
  `verifyCode` failure (asserts `updatePassword` never called, `discard` still called exactly
  once, returned error is `verifyCode`'s); an `updatePassword` failure after a successful
  `verifyCode` (asserts `discard` still runs, returned error is `updatePassword`'s); an invalid
  input (malformed code) rejected before `verifyCode` is ever called.
- `specs/005-login/tasks.md` — marked `T008` and `T009` `[X]`.

### Requirement traceability

| FR | Test |
|---|---|
| FR-007 (request reset code, no route change, anti-enumeration) | `schemas.test.ts` → `describe("requestPasswordResetSchema")`; `passwordReset.test.ts` → `describe("requestPasswordReset")` (both cases) |
| FR-008 (submit code + new password, throwaway-session discard) | `schemas.test.ts` → `describe("resetPasswordWithCodeSchema")`; `passwordReset.test.ts` → `describe("submitNewPassword")` (all 4 cases) |

### Tests run

`npx tsc --noEmit` — clean, no output (no type errors).

`npx jest src/domain/schemas.test.ts src/domain/passwordReset.test.ts`:
```
PASS src/domain/passwordReset.test.ts
PASS src/domain/schemas.test.ts

Test Suites: 2 passed, 2 total
Tests:       57 passed, 57 total
```

Full suite, `npx jest`:
```
Test Suites: 42 passed, 42 total
Tests:       269 passed, 269 total
```
(Pre-existing `act(...)` console warnings from `useKycGate.test.ts` are unrelated to this run's
changes — same warnings present before this batch, not introduced by it.)

No manual smoke check performed this run — T008/T009 are pure `src/domain` additions with no UI
surface; per `docs/verification.md` a domain-only change is fully covered by its unit tests, and
tasks.md's own manual-smoke-check task for this phase (T015) is explicitly scoped to after T014
(the full screen wiring), not this batch.

### Task status

`T008` and `T009` marked `[X]` in `specs/005-login/tasks.md`. `T010` (extend
`src/lib/supabase-client.ts`) is the next task in Phase 4 and was deliberately left untouched, per
this run's scope.

### Deviations from plan

None. Implementation matches tasks.md's T008/T009 wording verbatim, including the exact
`submitNewPassword` control-flow contract (discard-without-update on verify failure;
always-discard via `finally` after a verify success, regardless of update outcome).

---

## Run 8 (2026-08-05) — T010 (Phase 4, User Story 2 — throwaway recovery-session Supabase client)

**Scope**: exactly T010 from `specs/005-login/tasks.md`. Additive-only change to
`src/lib/supabase-client.ts` (`signInWithPassword` and `NETWORK_SIGN_IN_ERROR_MESSAGE` are
byte-for-byte unchanged — confirmed via `git diff` showing only insertions, zero deletions, on
that file). No UI component built (T011/T012), `LoginScreen.tsx` not touched (T013),
`app/(auth)/login.tsx` not touched (T014) — all out of scope for this run.

### Pre-implementation reading confirmed

- `specs/005-login/spec.md`'s Clarifications, "Recorded default 2" in full — the entire reason
  this task exists: `app/_layout.tsx`'s `KycGate` re-evaluates and redirects the instant ANY
  session becomes visible on the shared `supabase` singleton, so the code-verification step
  (which DOES establish a real, if temporary, session via `verifyOtp`) must run on a second,
  throwaway client instance that is never assigned to that singleton.
- `specs/005-login/tasks.md`'s T010 entry, read directly (not paraphrased) — the exact
  MUST-NEVER-THROW shape required for all four new functions, the exact SDK calls to wrap
  (`resetPasswordForEmail`, `verifyOtp({ email, token: code, type: "recovery" })`, `updateUser({
  password: newPassword })`, `signOut()`), and the exact regression-guard requirement (a test
  proving the shared singleton's mocks record zero calls as a result of any recovery-session
  operation).
- `src/lib/supabase-client.ts` (full file, pre-change) — confirmed `signInWithPassword`'s exact
  try/catch shape (the pattern every new function mirrors), the module-level `supabase` singleton
  construction (`createClient(supabaseUrl, supabaseAnonKey, { auth: { storage, autoRefreshToken:
  true, persistSession: true }, realtime: ... })`), and `NETWORK_SIGN_IN_ERROR_MESSAGE`'s exact
  string (reused, not duplicated).
- `src/lib/supabase-client.test.ts` (full file, pre-change) — confirmed the existing
  `jest.mock("@supabase/supabase-js", ...)` pattern (`mockSignInWithPassword` referenced only
  inside a nested closure, never read synchronously at factory-call time) and the
  `jest.clearAllMocks()` `afterEach` convention.
- `src/domain/passwordReset.ts` (T009, done/reviewed) — confirmed the exact DI type signatures
  (`VerifyRecoveryCode = (email: string, code: string) => Promise<{ error: string | null }>`,
  `UpdateRecoveryPassword = (newPassword: string) => Promise<{ error: string | null }>`,
  `DiscardRecoverySession = () => Promise<void>`) imported and matched verbatim, not redeclared.

### Files changed

- `src/lib/supabase-client.ts`
  - Added `import type { DiscardRecoverySession, UpdateRecoveryPassword, VerifyRecoveryCode }
    from "../domain/passwordReset";` (type-only import — no runtime dependency from `src/lib` on
    `src/domain` beyond the type, consistent with Constitution Principle IV's `src/domain`
    boundary staying RN-free; `src/lib` importing a `src/domain` *type* introduces no RN import
    into `src/domain`).
  - Added `requestPasswordReset(email: string): Promise<{ error: string | null }>` — wraps
    `supabase.auth.resetPasswordForEmail(email)` on the **shared/ambient** `supabase` singleton
    (deliberately, per the task's own instruction: this call is fire-and-forget and establishes
    no session, so there is nothing for `useKycGate()` to react to), with the identical
    try/catch → `NETWORK_SIGN_IN_ERROR_MESSAGE`-on-reject shape as `signInWithPassword`.
  - Added `createPasswordRecoverySession(): { verifyCode, updatePassword, discard }` — calls
    `createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false,
    autoRefreshToken: false } })` to build a **second, throwaway** client instance on every call,
    never assigned to the module-level `supabase` export. Returns three functions bound only to
    that instance:
    - `verifyCode(email, code)` → `recoveryClient.auth.verifyOtp({ email, token: code, type:
      "recovery" })`, same MUST-NEVER-THROW shape.
    - `updatePassword(newPassword)` → `recoveryClient.auth.updateUser({ password: newPassword
      })`, same shape.
    - `discard()` → `recoveryClient.auth.signOut()`, wrapped in its own try/catch that silently
      swallows any failure (matches `DiscardRecoverySession`'s `Promise<void>` contract — nothing
      to report either way, per `src/domain/passwordReset.ts`'s own doc comment).
  - Doc comments on every new export trace back to FR-007/FR-008 and spec.md's Clarifications,
    explaining precisely *why* `requestPasswordReset` is safe on the shared client while
    `createPasswordRecoverySession`'s three functions are not.

- `src/lib/supabase-client.test.ts`
  - Extended the `jest.mock("@supabase/supabase-js", ...)` factory to construct **all** mock
    state — `mockSignInWithPassword`, `mockResetPasswordForEmail`, a `recoveryAuthMocks` array,
    and a `mockCreateClient` jest.fn() that branches on a plain closure boolean
    (`singletonCreated`) — entirely *inside* the factory function body, then exposes that state
    via a test-only `__supabaseMockState` property on the mocked module, retrieved afterward via
    `jest.requireMock("@supabase/supabase-js")`. This restructuring was necessary; see "A real bug
    found and fixed while building this test" below for why the more obvious approach (declaring
    these mocks as ordinary module-level `const`s referenced from inside the factory, the way the
    file's original `mockSignInWithPassword` line already did) does not work once the factory
    needs to *synchronously* branch on call order rather than merely defer a read to later.
  - Added a `describe("requestPasswordReset", ...)` block mirroring `signInWithPassword`'s
    existing three-case structure exactly: resolves-clean, resolves-with-auth-error,
    rejects-at-the-network-layer (mapped to `NETWORK_SIGN_IN_ERROR_MESSAGE`).
  - Added a `describe("createPasswordRecoverySession", ...)` block with:
    - Three cases each for `verifyCode`, `updatePassword`, and `discard` (happy/auth-error/
      network-reject — `discard`'s "error" case asserts it still resolves `undefined` rather than
      throwing, since it has no error to report per its `Promise<void>` contract).
    - **The regression guard this task exists for** — `"never touches the module-level supabase
      singleton's mocked auth object"`: runs a full `verifyCode` → `updatePassword` → `discard`
      sequence through a freshly created recovery session, then asserts `mockSignInWithPassword`
      and `mockResetPasswordForEmail` (the only two methods the shared singleton's mocked auth
      object exposes) recorded **zero** calls, while the *distinct* recovery-session auth mock
      object recorded exactly one call each on `verifyOtp`/`updateUser`/`signOut`. See "How the
      singleton-isolation guarantee was proven" below for the full mechanics.
    - `"produces a fresh client instance on every call"` — calling `createPasswordRecoverySession()`
      twice pushes two genuinely distinct (`!==`) auth mock objects.

### A real bug found and fixed while building this test

The first version of this test file declared `mockSignInWithPassword`, `mockResetPasswordForEmail`,
`recoveryAuthMocks`, and `mockCreateClient` as ordinary module-level `const`s *before* the
`jest.mock(...)` call, exactly matching the file's pre-existing pattern for
`mockSignInWithPassword` alone. This failed at import time with `TypeError: Cannot read properties
of undefined (reading 'apply')`.

Root cause, confirmed with a throwaway diagnostic test file (added console.log statements at every
top-level statement, run once, then deleted — not part of the final diff): with this project's
Babel/CommonJS module transform, the `import {...} from "./supabase-client"` statement's underlying
`require()` call executes **before every other top-level statement in the test file**, even ones
written textually earlier in the source (confirmed directly: `console.log` calls placed as the
very first lines of the file, above the `jest.mock()` call, never printed before the mocked
module's own `createClient()` invocation ran). The pre-existing `mockSignInWithPassword` pattern
never hit this because its factory only ever returned an inline object whose *nested* closure
captured `mockSignInWithPassword` by name for a deferred read (well after the whole test module
finishes evaluating, inside an `it()` body) — it never needed to *synchronously* read a
module-level mock variable at factory-call time. T010's `createClient` mock does need that: to
correctly identify "is this the singleton call or a recovery-session call," it must branch, at the
moment `createClient()` is actually invoked (which happens synchronously and immediately, as part
of `supabase-client.ts`'s own module-level `export const supabase = createClient(...)`, triggered
by the hoisted-before-everything `require()`), on state that must therefore already exist by then
— and no module-level `const` written above `jest.mock()` in this file's own source can satisfy
that, regardless of textual ordering.

Fix: moved **all** mock state construction fully inside the `jest.mock(..., factory)` call itself
(a self-contained closure, immune to the ordering problem since nothing outside the factory needs
to already exist when the factory runs), exposing it afterward via a test-only
`__supabaseMockState` property retrieved through `jest.requireMock("@supabase/supabase-js")` — a
normal statement in the test file's own module body, which runs fine at that point since it only
*reads* already-built state, it doesn't need anything to exist earlier than it already does.

A second, related bug surfaced and was fixed in the same pass: the first version of the
inside-the-factory `mockCreateClient` derived "is this the first call" from
`mockCreateClient.mock.calls.length === 1` — but this file's existing `afterEach(() =>
jest.clearAllMocks())` resets every jest.fn()'s call history between tests, so on the *second* test
that calls `createPasswordRecoverySession()`, `mock.calls.length` would again read `1` and
misidentify a recovery-session client as the singleton. Fixed by tracking singleton-creation with
a **plain closure boolean** (`singletonCreated`, not a jest-mock-tracked property), which
`clearAllMocks()` does not touch, so it correctly reflects the one real, whole-file-lifetime event
it needs to (the shared `supabase` singleton is constructed exactly once, ever, the first time this
mocked module is required) rather than a per-test count.

### How the singleton-isolation guarantee was proven (not just "a test passed")

This is the property the entire forgot-password design depends on, so here is precisely what the
regression test checks and why it's a genuine proof rather than an assumption:

1. **Distinguishable instances, not a single shared mock.** The `jest.mock("@supabase/
   supabase-js", ...)` factory's `mockCreateClient` returns a *different* object on every call: the
   very first call (the module-level `supabase` singleton, constructed once, at module-import
   time) gets an auth object exposing only `signInWithPassword`/`resetPasswordForEmail`, backed by
   `mockSignInWithPassword`/`mockResetPasswordForEmail`. Every subsequent call gets a **freshly
   allocated** object (`{ verifyOtp: jest.fn(), updateUser: jest.fn(), signOut: jest.fn() }`,
   pushed onto `recoveryAuthMocks`) — a genuinely distinct JS object each time, not a reused
   reference. This means "did the recovery session touch the singleton" is not an inference from
   behavior, it's a direct object-identity fact the mock structurally enforces: the singleton's
   auth object doesn't even *have* a `verifyOtp`/`updateUser`/`signOut` method to call.
2. **The assertion checks the singleton's own mocks recorded zero calls**, not merely that the
   recovery functions "exist" or "returned successfully": `expect(mockSignInWithPassword)
   .not.toHaveBeenCalled(); expect(mockResetPasswordForEmail).not.toHaveBeenCalled();` — run
   *after* a full `verifyCode` → `updatePassword` → `discard` sequence on a real
   `createPasswordRecoverySession()` instance. If a future change accidentally wired any of these
   three functions to the shared `supabase` export instead of the throwaway `recoveryClient`, the
   call would land on `mockSignInWithPassword`/`mockResetPasswordForEmail`'s auth object — which
   has no `verifyOtp`/`updateUser`/`signOut` of its own, so the call would either throw (caught by
   the MUST-NEVER-THROW try/catch, silently masking the bug as a network error) or, if the shapes
   ever grew to overlap, would show up directly as a nonzero call count on these specific mocks.
   The test also positively asserts the *distinct* recovery auth mock recorded exactly one call
   each, so a "the calls went nowhere at all" false pass is ruled out too.
3. **Verified the test actually fails when the isolation is broken**, not merely that it passes
   today. Before finalizing, `verifyCode`'s implementation was temporarily edited (in
   `src/lib/supabase-client.ts`, saved to a scratch backup first) to call `supabase.auth.verifyOtp(
   ...)` (the shared singleton) instead of `recoveryClient.auth.verifyOtp(...)`. Re-running `npx
   jest src/lib/supabase-client.test.ts` against that sabotaged version produced exactly the
   expected failures: the `"never touches the module-level supabase singleton's mocked auth
   object"` test failed with `expect(authMock.verifyOtp).toHaveBeenCalledTimes(1)` → `Received
   number of calls: 0` (the call landed elsewhere, not on the throwaway instance), plus two other
   `verifyCode`-specific tests failed because the shared singleton's mocked auth object has no
   `verifyOtp` method at all, so the call threw and was caught, silently returning
   `NETWORK_SIGN_IN_ERROR_MESSAGE` instead of the test's expected message. The file was then
   restored to the correct implementation from the scratch backup and the full suite re-confirmed
   green (17/17 in this file, 282/282 across the repo). This is the concrete evidence that the
   regression guard is load-bearing, not decorative.
4. **A fresh instance every call.** `"produces a fresh client instance on every call"` asserts two
   separate `createPasswordRecoverySession()` calls push two `!==` auth mock objects, ruling out
   any accidental module-level caching/reuse of a single throwaway client across separate
   "Forgot password?" attempts.

### Tests run

```
npx tsc --noEmit -p .
```
Clean, no output (exit 0).

```
npx jest src/lib/supabase-client.test.ts
```
```
PASS src/lib/supabase-client.test.ts
  signInWithPassword
    ✓ returns a null error when the SDK resolves successfully
    ✓ returns the SDK's own message when the SDK resolves with an auth-level error
    ✓ does not throw and resolves to a distinct network-failure message when the underlying call rejects
    ✓ gives the network-failure message distinct, honest copy from a credentials rejection
  requestPasswordReset
    ✓ returns a null error when the SDK resolves successfully
    ✓ returns the SDK's own message when the SDK resolves with an auth-level error
    ✓ does not throw and resolves to NETWORK_SIGN_IN_ERROR_MESSAGE when the underlying call rejects
  createPasswordRecoverySession
    ✓ verifyCode: returns a null error when the SDK resolves successfully
    ✓ verifyCode: returns the SDK's own message when the SDK resolves with an auth-level error
    ✓ verifyCode: does not throw and resolves to NETWORK_SIGN_IN_ERROR_MESSAGE when the underlying call rejects
    ✓ updatePassword: returns a null error when the SDK resolves successfully
    ✓ updatePassword: returns the SDK's own message when the SDK resolves with an auth-level error
    ✓ updatePassword: does not throw and resolves to NETWORK_SIGN_IN_ERROR_MESSAGE when the underlying call rejects
    ✓ discard: resolves (void) when the SDK resolves successfully
    ✓ discard: does not throw even when the underlying call rejects
    ✓ never touches the module-level supabase singleton's mocked auth object
    ✓ produces a fresh client instance on every call

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
```

Full repo regression check:
```
npx jest
```
```
Test Suites: 42 passed, 42 total
Tests:       282 passed, 282 total
```
(269 before this run's additions + 13 net-new in this file = 282; zero regressions elsewhere.)

No manual smoke check performed this run — T010 is a pure `src/lib` addition with no UI surface
reachable yet (`LoginScreen.tsx`/`app/(auth)/login.tsx` aren't wired to these new exports until
T013/T014); tasks.md's own manual-smoke-check task for this phase is T015, explicitly scoped to
after T014.

### Requirement traceability (this run's FRs)

| FR | Test(s) |
|---|---|
| FR-007 (request a reset code by email, no route change, anti-enumeration — the app-side call itself) | `supabase-client.test.ts` → `describe("requestPasswordReset")` (all 3 cases) |
| FR-008 (submit code + new password without establishing any session visible to the shared/ambient Supabase client) | `supabase-client.test.ts` → `describe("createPasswordRecoverySession")`, especially `"never touches the module-level supabase singleton's mocked auth object"` (the regression guard) and the per-function happy/error/network-reject cases for `verifyCode`/`updatePassword`/`discard` |

### Task status

- [X] T010 (marked `[X]` in `specs/005-login/tasks.md`)

### Deviations from plan

None in the production code — `src/lib/supabase-client.ts`'s two new exports match tasks.md's
T010 wording exactly (same SDK calls, same MUST-NEVER-THROW shape, same throwaway-client
construction options). The test file's internal mocking *structure* differs from what a literal
first reading of "same `jest.mock` pattern already in that file" might suggest (state moved fully
inside the factory, retrieved via `jest.requireMock`, rather than declared as plain module-level
`const`s the way the pre-existing `mockSignInWithPassword` was) — this was a necessary fix for a
real hoisting/ordering bug (detailed above), not a stylistic choice, and the resulting tests still
follow the same `describe`/`it` shape and assertion style as the existing `signInWithPassword`
block. Flagging this explicitly in case `code-reviewer` wants to confirm the reasoning.

### Scope note

Stopped strictly at T010. `RequestPasswordResetForm.tsx`/`ResetPasswordForm.tsx` (T011/T012),
`LoginScreen.tsx`'s reset-flow modes (T013), and `app/(auth)/login.tsx`'s wiring of these new
exports (T014) are all untouched.

---

## Run 9 (2026-08-05) — T011, T012 (Phase 4, User Story 2 — request/reset forms, [P])

**Scope**: exactly `T011` and `T012` from `specs/005-login/tasks.md`. Did not touch
`LoginScreen.tsx` (T013 — the two new components are not wired into it yet) or
`app/(auth)/login.tsx` (T014).

### Pre-implementation reading confirmed

- `src/features/identity/FormField.tsx` — the shared label/inline-error layout primitive, no
  react-hook-form/Zod knowledge of its own.
- `src/features/identity/CodeInput.tsx` — a single accessible `TextInput` (not five boxes),
  masking-only (digits, `maxLength=length`), `length` prop already configurable —
  confirmed reusable as-is with `length={PASSWORD_RESET_CODE_LENGTH}`, no new low-level
  primitive built.
- `src/features/identity/VerifyPhoneScreen.tsx` — read in full, specifically its resend-cooldown
  mechanism: `RESEND_COOLDOWN_SECONDS = 30`, the `secondsRemaining` `useState` + `useEffect`
  `setInterval`/`clearInterval` shape, and `canResend`/`handleResendPress`'s exact logic
  (`setSecondsRemaining(RESEND_COOLDOWN_SECONDS)` called synchronously before `onResend()`, so a
  double-tap can never fire `onResend` twice). `ResetPasswordForm.tsx`'s resend mechanism copies
  this shape verbatim (same variable names, same effect body, same guard order).
- `src/domain/schemas.ts` (current state, post-T008) — confirmed `requestPasswordResetSchema`
  (`email` only), `resetPasswordWithCodeSchema` (`email` + `code` regex + `password:
  passwordSchema`), and `PASSWORD_RESET_CODE_LENGTH = 6` are already in place from T008 — no
  schema change needed in this run.
- `src/features/identity/SignInForm.tsx` + `SignInForm.test.tsx` (T003) — the established
  `styles` shape (`container`/`title`/`input`/`button`/`buttonDisabled`/`buttonText`), the
  `serverError`-as-one-general-banner convention, and the "Pressable + local trigger, not a
  route" pattern for `onForgotPassword`/`onBack`-equivalent affordances (Recorded default 2).
- `src/domain/passwordReset.ts` (T009) — confirmed `submitNewPassword`'s
  `{ error: string | null }` contract carries no field attribution of its own (a code-rejection
  and a password-rejection are indistinguishable at that layer) — this is why
  `ResetPasswordForm`'s `serverError` field-error shape (`ResetPasswordFieldError`) is defined
  locally in the component file rather than in `src/domain`: attributing an error to the "code"
  field specifically is a UI-layer judgment call `LoginScreen`/`app/(auth)/login.tsx` (T013/T014)
  will make when wiring this component up, not something `passwordReset.ts` itself decides.
- `docs/conventions.md` — no new visual language; forms use React Hook Form + Zod with schemas
  from `src/domain/schemas.ts`; comments only for non-obvious *why*.

### Files changed

- `src/features/identity/RequestPasswordResetForm.tsx` (new)
  - One email field (`FormField` + `TextInput`, React Hook Form +
    `zodResolver(requestPasswordResetSchema)`), a "Send reset code" submit button, and a
    "Back to sign in" `Pressable` calling the injected `onBack` prop.
  - `onSubmit: (input: RequestResetInput) => void | Promise<void>` — the component awaits it but
    never reads its resolved value; after it resolves (regardless of what it resolves to), local
    `submitted` state flips to `true` and the form is replaced by a fixed confirmation string,
    exported as `REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE = "If that email is registered,
    we've sent a code"` — deliberately the one and only rendering path after a submission, so
    there is no code path in this file that could leak an email-exists/doesn't-exist distinction
    (FR-007's anti-enumeration property, matching `requestPasswordReset`'s T009 domain contract).
  - Same `styles` shape as `SignInForm.tsx` (44×44 minimum tap targets throughout).
- `src/features/identity/RequestPasswordResetForm.test.tsx` (new) — 3 cases: a valid submission
  calls `onSubmit` with the parsed `{ email }` and then renders the generic confirmation
  (`testID="request-reset-confirmation"`); an invalid/missing email is caught client-side and
  never calls `onSubmit`; pressing "Back to sign in" calls `onBack`.
- `src/features/identity/ResetPasswordForm.tsx` (new)
  - Email field pre-filled from `initialEmail` (`defaultValues.email: initialEmail ?? ""`) but
    fully editable — no `editable={false}`/read-only styling anywhere on it.
  - `CodeInput` with `length={PASSWORD_RESET_CODE_LENGTH}` (imported from `src/domain/schemas.ts`,
    not a hardcoded `6`), `accessibilityLabel="Reset code"` (distinct from
    `VerifyPhoneScreen`'s default "Verification code" label, since these are two different codes
    a user could otherwise confuse).
  - New-password field: single field, no confirm-password (spec.md Assumptions), `secureTextEntry`
    + `autoComplete="password-new"`, same convention as `RegistrationForm.tsx`'s password field.
  - Submit button ("Set new password" / "Setting password…" while `isSubmitting`).
  - Resend button: `RESEND_COOLDOWN_SECONDS = 30` (exported, same value/shape as
    `VerifyPhoneScreen.tsx`'s constant — not imported from there, each screen owns its own
    constant exactly as `VerifyPhoneScreen` itself does, but the *value* and the full
    `useState`/`useEffect`/`canResend`/`handleResendPress` mechanism are byte-for-byte mirrored).
  - "Back to sign in" `Pressable` calling `onBack`.
  - `serverError?: ResetPasswordFieldError` (`{ field?: "code"; message: string }`, defined
    locally in this file — see reading notes above) — when `field === "code"`, fed into
    `errors.code` via `setError` in a `useEffect`, identical to `VerifyPhoneScreen`'s
    `serverError` handling; a field-less `serverError` renders as one general banner
    (`testID="reset-password-form-error"`).
  - `zodResolver(resetPasswordWithCodeSchema)` (T008) validates `email`/`code`/`password`
    together.
- `src/features/identity/ResetPasswordForm.test.tsx` (new) — 5 cases: a valid submission calls
  `onSubmit` with the parsed `{ email, code, password }`; the email field is pre-filled from
  `initialEmail` but remains editable (typing a different value and submitting confirms the
  *edited* value is what's sent, not the original); an invalid/expired-code `serverError` renders
  inline on the code field (`errors.code`); the resend button disables for the cooldown window
  after a press (`fireEvent.press` while fake timers are active, asserting `onResend` is called
  exactly once even after a second press mid-cooldown, then re-enables once the timer elapses —
  same test shape as `VerifyPhoneScreen.test.tsx`'s equivalent case); pressing "Back to sign in"
  calls `onBack`.
- `specs/005-login/tasks.md` — marked `T011` and `T012` `[X]`.

### Requirement traceability (this run's FRs)

| FR | Test(s) |
|---|---|
| FR-007 (request a password-reset code by email, no route change, anti-enumeration) | `RequestPasswordResetForm.test.tsx` → "calls onSubmit with the parsed email then renders the generic confirmation" (and the client-side-validation-blocks-submission case) |
| FR-008 (submit code + new password, min 8 chars, no session established as a side effect of this UI layer — this component never touches Supabase directly) | `ResetPasswordForm.test.tsx` → "calls onSubmit with the parsed email/code/password on a successful submit"; "pre-fills the email field from initialEmail but allows editing it"; "renders an invalid/expired-code serverError inline on the code field" |
| FR-009 (cooldown-limited resend action, mirroring `001`'s phone-verification resend UX) | `ResetPasswordForm.test.tsx` → "disables the resend button during the cooldown after pressing it, and re-enables once it elapses" |

### Tests run

```
npx tsc --noEmit
```
Clean, no output (exit 0).

```
npx jest src/features/identity/RequestPasswordResetForm.test.tsx src/features/identity/ResetPasswordForm.test.tsx
```
```
PASS src/features/identity/RequestPasswordResetForm.test.tsx
PASS src/features/identity/ResetPasswordForm.test.tsx

Test Suites: 2 passed, 2 total
Tests:       8 passed, 8 total
```

Full repo regression check:
```
npx jest
```
```
Test Suites: 44 passed, 44 total
Tests:       290 passed, 290 total
```
(282 before this run's additions + 8 net-new in these two files = 290; zero regressions
elsewhere.)

```
./init.sh --skip-build
```
```
RESULT: SUCCESS (8/8 stages passed)
```
Two pre-existing, unrelated non-blocking `WARN`s (expo-doctor "outdated dependencies",
native-dep version drift for `expo-image-picker`/`react-native`/`react-native-safe-area-context`/
`@types/react`/`typescript`) — present before this run, not introduced by it, and both already
disclosed in prior runs' notes for this feature.

### Manual smoke check (Level 3)

Started `npm run web`, confirmed Metro bundled cleanly (no module-resolution error for either new
file or their imports — `CodeInput`, `FormField`, `resetPasswordWithCodeSchema`,
`requestPasswordResetSchema`, `PASSWORD_RESET_CODE_LENGTH`), and confirmed `GET /login` still
returns `200` with the existing sign-in screen (T004/T005's already-wired `"sign-in"` mode — these
two new components are not yet reachable via any UI interaction, since `LoginScreen.tsx`'s
`"request-reset"`/`"reset-with-code"` modes are T013's job, not this run's). This is the expected,
disclosed state per tasks.md's own phase structure — same "deferred, not skipped" situation Run 2
recorded for `SignInForm`/`LoginScreen` before `app/(auth)/login.tsx` existed. Level 2 (the 8
component tests above) is the verification level actually exercised for this run's new UI
behavior; the full `"sign-in"` → `"request-reset"` → `"reset-with-code"` → `"sign-in"` interactive
sequence will become smoke-checkable once T013/T014 land (T015 is tasks.md's dedicated manual
check for that point).

### Task status

- [X] T011
- [X] T012

### Deviations from plan

One implementation judgment call not spelled out verbatim in either task's tasks.md wording:
`ResetPasswordFieldError` (the `{ field?: "code"; message: string }` shape for `serverError`) is
defined locally inside `ResetPasswordForm.tsx` rather than in `src/domain/passwordReset.ts`,
because `submitNewPassword` (T009) returns a plain `{ error: string | null }` with no field
attribution of its own — deciding "a code-verification failure belongs on the code field
specifically" is a UI-layer judgment `LoginScreen.tsx`/`app/(auth)/login.tsx` (T013/T014) will
make when wiring this component's `onSubmit` up to the real `submitNewPassword` call, mirroring
exactly how `registration.ts`'s `VerifyPhoneFieldError` already lives in `src/domain` only because
that mapping (`mapVerifyPhoneError`) is itself a `src/domain` function — no equivalent mapping
function exists yet for password reset (T009 doesn't define one; only T013/T014 would, if the
plan calls for it). Flagged here explicitly in case `code-reviewer`/T013's implementer would
prefer a different location for this type.

`RESEND_COOLDOWN_SECONDS` is redeclared locally in `ResetPasswordForm.tsx` (value `30`, identical
to `VerifyPhoneScreen.tsx`'s) rather than imported from that file — per tasks.md's own phrasing
("same 30-second constant and timer useEffect shape... not a re-invented mechanism") this reads as
"use the identical value and pattern," not "import the literal binding," and mirrors
`VerifyPhoneScreen.tsx`'s own precedent of owning its cooldown constant locally rather than
importing one from elsewhere. Flagged here in case a shared constant (e.g. hoisted into
`src/domain/schemas.ts` alongside `PASSWORD_RESET_CODE_LENGTH`) is preferred instead.

### Scope note

Stopped strictly at T011/T012. `LoginScreen.tsx`'s `"request-reset"`/`"reset-with-code"` modes
(T013) and `app/(auth)/login.tsx`'s wiring of `requestPasswordReset`/
`createPasswordRecoverySession` (T014) are untouched — these two new components have no consumer
yet.

---

## Run 10 (2026-08-05) — T013, T014 (Phase 4, User Story 2 — LoginScreen/login.tsx integration)

Scope: exactly T013 and T014 from `specs/005-login/tasks.md`. T001–T012 already `[X]` and
reviewed (APPROVE) per the assignment. Read `spec.md` (in full, including both Clarifications
entries, with special attention to Recorded default 2), `plan.md`, and `tasks.md`'s T013/T014
entries directly before writing any code, plus the current state of every file involved:
`LoginScreen.tsx`/`LoginScreen.test.tsx` (T004), `RequestPasswordResetForm.tsx` (T011),
`ResetPasswordForm.tsx` (T012), `src/domain/passwordReset.ts` (T009), `src/lib/supabase-client.ts`
(T010), `SignInForm.tsx` (T003), `app/(auth)/login.tsx`/`login.test.tsx` (T005).

### What changed and why

**`src/features/identity/LoginScreen.tsx` (T013)** — rewritten to add the two new modes:

- `LoginScreenProps` gained two new required props: `requestPasswordReset: RequestPasswordReset`
  and `createPasswordRecoverySession: () => RecoverySession` (a **factory**, not a value — see
  below). `signIn` is unchanged from T004.
- `mode === "request-reset"` renders `RequestPasswordResetForm` (T011), wired to a
  `handleRequestReset` handler that calls the raw `requestPasswordReset(email)` prop directly
  (never the domain-layer `requestPasswordReset()` orchestration function from
  `src/domain/passwordReset.ts` — that schema-validation wrapping is embedded in the prop's real
  implementation at the screen call site, T014, exactly mirroring how `signIn` already embeds
  `submitSignIn` per T004/T005's existing pattern), then carries the submitted email forward and
  switches to `"reset-with-code"`.
- `mode === "reset-with-code"` renders `ResetPasswordForm` (T012), wired to a `handleResetSubmit`
  handler that DOES call `src/domain/passwordReset.ts`'s `submitNewPassword(recoverySession,
  input)` directly — this is the one place `LoginScreen` imports domain orchestration logic
  itself, because `ResetPasswordForm`'s single `onSubmit(input: ResetWithCodeInput)` shape has no
  raw equivalent to hand off to; the three lower-level primitives (`verifyCode`, `updatePassword`,
  `discard`) must be orchestrated together before `onSubmit` can be satisfied.
- A successful `handleResetSubmit` sets `prefillEmail`, sets a
  `signInConfirmationMessage` (`PASSWORD_RESET_SUCCESS_MESSAGE`, exported), clears all
  reset-flow-local state (`resetFlowState()`, see below), and switches `mode` back to `"sign-in"`.
- **Lazy recovery-session creation**: `recoverySession` state starts `null`.
  `handleForgotPassword` (wired to `SignInForm`'s existing `onForgotPassword` prop) calls
  `setRecoverySession((current) => current ?? createPasswordRecoverySession())` — the functional
  updater means the factory is invoked only the first time this runs after the state was last
  `null` (i.e. genuinely once per attempt, never eagerly on mount, and never twice for the same
  attempt even across repeated "Forgot password?" presses before backing out).

**How "no residual reset-flow state on Back to sign in" (spec.md US2 AS5) was implemented,
concretely**: every "Back to sign in" press (from either `RequestPasswordResetForm` or
`ResetPasswordForm`) calls `handleBackToSignIn()`, which does three things:

1. `void recoverySession?.discard()` — best-effort cleanup of the throwaway client's in-memory
   session (a safe no-op if `verifyCode` never succeeded; `discard()` is itself
   MUST-NEVER-THROW per T010, so this is fire-and-forget).
2. `resetFlowState()` — a single function shared by BOTH exit paths from the sub-flow (this
   cancel path AND the successful-completion path in `handleResetSubmit`) that resets **six**
   separate state variables to their initial values: `recoverySession → null` (so the *next*
   "Forgot password?" press builds a genuinely fresh throwaway client, never reuses a stale/
   possibly-half-used one), `resetEmail → undefined` (so a later attempt's
   `RequestPasswordResetForm` doesn't inherit a previous attempt's submitted email — that form
   has no `initialEmail` prop of its own and always starts blank, so this mainly matters for not
   leaking into `ResetPasswordForm`'s `initialEmail` on a later attempt), `resetServerError →
   undefined`, `isResetSubmitting → false`, `isResending → false`, `isRequestingReset → false`.
3. `setMode("sign-in")`.

Note explicitly: `signInConfirmationMessage`/`prefillEmail` are **not** touched by
`handleBackToSignIn()` — they're a different state pair, only ever set by a *successful*
`handleResetSubmit`, and a plain "Back to sign in" (a cancel, not a completion) never earns them
in the first place, so there's nothing to clear on that path. They ARE cleared by
`handleForgotPassword` (a fresh "Forgot password?" press clears any earlier confirmation banner
before showing the request-reset view), so a stale confirmation from an old, already-completed
reset can't bleed into a brand-new attempt either.

**`src/features/identity/SignInForm.tsx` (additive extension, necessary plumbing for T013)** —
T013's own text requires "the email pre-filled into SignInForm" and "a confirmation banner" on
the sign-in view after a successful reset; `SignInForm.tsx` (T003, frozen) had no prop surface
for either. Extended additively, non-breaking:
- `initialEmail?: string` — feeds `useForm`'s `defaultValues.email` (was a static
  `DEFAULT_VALUES` const, now `{ email: initialEmail ?? "", password: "" }`, applied only at
  mount — safe because `SignInForm` always fully remounts when `LoginScreen` returns to
  `"sign-in"` mode, since the tree in between was a different component entirely). Editable, not
  locked, per US2 AS5.
- `confirmationMessage?: string` — rendered as a distinct banner (`testID
  "sign-in-confirmation-message"`, neutral gray, not red) above `serverError`, never conflated
  with it.
- Existing tests (T003's five, all unmodified) still pass unchanged since both new props are
  optional and the old `DEFAULT_VALUES` const's actual values (`{ email: "", password: "" }`) are
  preserved when `initialEmail` is `undefined`. Added two new tests to
  `SignInForm.test.tsx` for the new props directly (confirmation banner renders distinctly from
  serverError; `initialEmail` pre-fills but doesn't lock the field).

**`app/(auth)/login.tsx` (T014)** — extended additively:
- Imports `requestPasswordReset` (aliased `submitPasswordResetRequest`) from
  `src/domain/passwordReset.ts`, and `createPasswordRecoverySession`/`requestPasswordReset` from
  `src/lib/supabase-client.ts` (T010's real exports).
- `LoginScreen`'s `requestPasswordReset` prop is wired as `(email) =>
  submitPasswordResetRequest(requestPasswordReset, { email })` — the domain orchestration
  (schema-validates via `requestPasswordResetSchema`, then calls the real SDK-backed primitive) —
  same "wrap the real primitive in its domain orchestration function, hand the wrapped thing down
  as a prop" pattern T005 already established for `signIn`/`submitSignIn`.
- `LoginScreen`'s `createPasswordRecoverySession` prop is the real export passed straight
  through, unchanged — it's already a factory of the exact shape `LoginScreen` expects, and
  `LoginScreen` itself is the one that decides *when* to call it (lazily), not this screen.

### Tests written/run

**`src/features/identity/LoginScreen.test.tsx`** (extended, 8 tests total, 5 new): the original
three T004 tests were adapted to the new required-prop signature via a `renderLoginScreen()`
helper (defaults `requestPasswordReset`/`createPasswordRecoverySession` to harmless mocks), plus:
- *"does not create a recovery session until 'Forgot password?' is pressed, and creates only one
  for repeated presses"* — asserts `createPasswordRecoverySession` is NOT called on mount, IS
  called exactly once after the first press, and a fresh press-after-backing-out produces a
  SECOND, independent call (proving `resetFlowState()` genuinely nulled the old one out).
- *"walks the full sign-in -> request-reset -> reset-with-code -> sign-in mode sequence"* — the
  full US2 happy path: submits an email in `RequestPasswordResetForm`, asserts
  `requestPasswordReset` was called with it and `ResetPasswordForm` renders with that email as
  `initialEmail`; submits a code + new password, asserts `recoverySession.verifyCode`/
  `updatePassword`/`discard` were each called correctly; asserts the screen lands back on
  `SignInForm` with the confirmation banner visible and the email pre-filled.
- **`"never calls the shared signIn prop during the reset-with-code submission"` — THE REGRESSION
  GUARD THIS TASK EXISTS FOR** (spec.md Clarifications, Recorded default 2). Mechanism: a `jest.fn()`
  `signIn` mock is passed into `LoginScreen` alongside a *separate*, independently-mocked
  `recoverySession` (its own `verifyCode`/`updatePassword`/`discard` jest mocks). The test drives
  the full request-reset → enter-code-and-password → submit sequence and, after confirming
  `recoverySession.updatePassword` was actually called (proof the reset step really ran, not a
  vacuously-true assertion), asserts `expect(signIn).not.toHaveBeenCalled()`. Because `signIn` and
  `recoverySession`'s three functions are entirely distinct jest mocks with no shared
  implementation, this proves — at the component level — that `handleResetSubmit`'s call graph
  never reaches `signIn` at any point, which is the literal code-level meaning of "the reset step
  genuinely never touches the shared/ambient sign-in path."
- *"returns to plain sign-in with no residual reset-flow state when 'Back to sign in' is pressed
  mid-flow"* — drives request-reset → reset-with-code → "Back to sign in" (before ever
  submitting a code), then asserts: `SignInForm` is visible, `sign-in-confirmation-message` is
  absent (`queryByTestId` returns `null`), the email field is empty (`""`, not the abandoned
  attempt's submitted email), and `recoverySession.discard` was called exactly once.

**`app/(auth)/login.test.tsx`** (extended, 4 tests total, 2 new): the original two T005 tests are
unchanged in substance. Added, at the real-implementation call boundary (only
`"@supabase/supabase-js"` mocked, mirroring `src/lib/supabase-client.test.ts`'s own
self-contained-factory mock pattern exactly — `createClient()`'s first call is the shared
singleton, every call after that is a fresh throwaway recovery client, tracked as distinct
`recoveryAuthMocks` entries):
- *"walks the full sign-in -> request-reset -> reset-with-code -> sign-in sequence via the real DI
  chain"* — same sequence as the `LoginScreen.test.tsx` version, but asserting the REAL
  `mockResetPasswordForEmail` and the real per-instance `verifyOtp`/`updateUser`/`signOut` mocks
  were called with the exact right arguments (`{ email, token: code, type: "recovery" }`, etc.),
  proving `app/(auth)/login.tsx` → `src/domain/passwordReset.ts` → `src/lib/supabase-client.ts` →
  the SDK is genuinely wired end-to-end, not stubbed at some intermediate layer.
- *"never touches the shared singleton's signInWithPassword mock during the reset-with-code
  step"* — the same regression guard as `LoginScreen.test.tsx`'s, but at the real-implementation
  boundary: asserts `mockSignInWithPassword` (the shared singleton's mocked auth method) recorded
  zero calls after a full reset-with-code submission that did land on the distinct
  `recoveryAuthMock`.

**Full suite**: `npx tsc --noEmit` — clean, no errors. `npx jest` — **44 suites, 298 tests, all
passing** (target files: `LoginScreen.test.tsx` 8/8, `app/(auth)/login.test.tsx` 4/4,
`SignInForm.test.tsx` 7/7).

```
Test Suites: 44 passed, 44 total
Tests:       298 passed, 298 total
```

`./init.sh` (full run, no `--skip-*` flags): `RESULT: SUCCESS (10/10 stages passed)`. Type-check
clean; test suite clean; all three bundle exports (web/iOS/Android) clean. The two `WARN` lines
(expo-doctor outdated-dependency advisory, native-dep version drift) are pre-existing,
unrelated to this feature (same warnings present in Run 6's `init.sh` output) — not introduced by
T013/T014.

**Manual smoke check (Level 3)**: no browser-automation tool (Claude Browser tool, as Run 6 used)
was available to this run — disclosed honestly rather than skipped silently. As a best-effort
substitute within this run's actual tool access: started a real `npm run web` dev server, curled
`http://localhost:8081/` and `http://localhost:8081/login` (both `200`), and inspected the dev
server's own bundler log for errors — only Metro's pre-existing `@supabase/auth-js`
`webauthn.js`/`webauthn.errors.js` require-cycle `WARN` appeared (present before this run too,
unrelated), no bundling/module-resolution errors. This confirms the new code paths bundle and the
route serves, but does NOT constitute the interactive click-driven confirmation of the actual
mode-transition UX that `docs/verification.md` Level 3 calls for — that remains genuinely owed to
`T015` (`tasks.md`'s own dedicated manual-smoke-check task for the full US2 flow, not assigned to
this run), which should be run with real browser/simulator tooling before US2 is considered fully
verified end-to-end. Flagging this gap explicitly rather than claiming a check that didn't happen.

### Requirement traceability

| FR | Requirement | Test(s) |
|---|---|---|
| FR-007 | "Forgot password?" entry point, in-place mode switch, anti-enumeration | `LoginScreen.test.tsx` → "walks the full sign-in -> request-reset -> reset-with-code -> sign-in mode sequence"; `app/(auth)/login.test.tsx` → same sequence at the real DI boundary |
| FR-008 | Submit code + new password; never establishes a session visible to the shared client | `LoginScreen.test.tsx` → "never calls the shared signIn prop during the reset-with-code submission" (THE regression guard); `app/(auth)/login.test.tsx` → "never touches the shared singleton's signInWithPassword mock during the reset-with-code step" |
| FR-009 | Cooldown-limited resend (exercised via `ResetPasswordForm`, wired through `handleResend`) | Covered at the `ResetPasswordForm.test.tsx` (T012) level for the cooldown mechanism itself; `LoginScreen`'s `handleResend` wiring is exercised implicitly by rendering `ResetPasswordForm` with a real `onResend` prop in every `LoginScreen.test.tsx`/`login.test.tsx` reset-with-code test |
| US2 AS5 (no residual state) | "Back to sign in" clears mode AND all reset-flow-local state, including the lazily created recovery session | `LoginScreen.test.tsx` → "does not create a recovery session until 'Forgot password?' is pressed, and creates only one for repeated presses" (proves a fresh session is built after Back+re-press) and "returns to plain sign-in with no residual reset-flow state when 'Back to sign in' is pressed mid-flow" |
| US2 AS3 (confirmation + prefill) | Successful reset returns to sign-in with a confirmation banner and the email pre-filled | `LoginScreen.test.tsx`/`app/(auth)/login.test.tsx` → full mode-sequence tests; `SignInForm.test.tsx` → "renders a confirmationMessage as a distinct banner from serverError", "pre-fills the email field from initialEmail without locking it" |

### Files changed

- `src/features/identity/LoginScreen.tsx` — rewritten (T013): `"request-reset"`/
  `"reset-with-code"` modes added, lazy recovery-session creation, full state cleanup on both
  "Back to sign in" and successful completion.
- `src/features/identity/LoginScreen.test.tsx` — extended (T013): 8 tests total (3 adapted, 5
  new).
- `src/features/identity/SignInForm.tsx` — additive extension (necessary plumbing for T013):
  `initialEmail`/`confirmationMessage` props.
- `src/features/identity/SignInForm.test.tsx` — extended: 2 new tests for the above.
- `app/(auth)/login.tsx` — extended (T014): real `requestPasswordReset`/
  `createPasswordRecoverySession` wiring.
- `app/(auth)/login.test.tsx` — extended (T014): 4 tests total (2 unchanged, 2 new).
- `specs/005-login/tasks.md` — T013, T014 marked `[X]`.

### Task status

`T013` and `T014` now `[X]` in `specs/005-login/tasks.md`. `T015` (US2's own manual smoke check)
remains `[ ]` — explicitly out of this run's assigned scope, and, per the note above, still
genuinely owed with real browser/simulator tooling.

### Deviations from plan / flagged for sign-off

1. **`SignInForm.tsx` extension (additive)**: T013's task text only names `LoginScreen.tsx` as
   the file to extend, but literally requires "a confirmation banner and the email pre-filled
   into SignInForm" as an observable outcome — which `SignInForm.tsx` (T003, frozen/approved)
   had no prop surface for. Extended it additively (two new optional props, zero behavior change
   for callers that don't pass them, all five original T003 tests still pass unmodified) rather
   than reworking `LoginScreen`'s render output some other way. Flagging this for explicit
   sign-off since it touches a file outside T013/T014's literally-named scope, even though it was
   necessary plumbing to satisfy T013's own requirement.
2. **`RequestPasswordResetForm`'s own "submitted" confirmation view is effectively unreachable in
   the actual flow, given T013's literal instruction.** `RequestPasswordResetForm.tsx` (T011)
   awaits `onSubmit`, then sets its own local `submitted` state to show
   `REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE` in place. T013's text says a successful request
   "switches to `reset-with-code`" — i.e. `LoginScreen.handleRequestReset` sets `mode` to
   `"reset-with-code"` as soon as `requestPasswordReset(email)` resolves, which unmounts
   `RequestPasswordResetForm` essentially immediately afterward (React's automatic batching means
   the parent's mode change and the child's own `setSubmitted(true)` land in the same
   flush/commit). In practice this means the user is very unlikely to ever visibly see
   `RequestPasswordResetForm`'s own confirmation text — they go straight from the request form to
   the code-entry form. This was implemented literally per T013's explicit mode-transition
   instruction rather than reinterpreted, since tasks.md was named as authoritative over
   paraphrase for this task; flagging it here as a genuine design tension between T011's
   (frozen) component design and T013's transition timing, worth a decision at the next review
   gate (e.g., should `LoginScreen` briefly delay the mode switch, or should
   `RequestPasswordResetForm`'s confirmation view be considered effectively dead code by design?).
3. **No network-level-failure display for the "request a reset code" step.** spec.md's Edge Cases
   section calls for "a distinct, honest network-failure message" if the reset-code request
   itself fails at the network level — but `RequestPasswordResetForm.tsx` (T011, frozen) has no
   `serverError`/error-display prop at all, and `handleRequestReset` in `LoginScreen.tsx`
   deliberately does not branch on `requestPasswordReset`'s resolved value (per FR-007's
   anti-enumeration requirement — the transition must be identical regardless of outcome). This
   means a network failure at this specific step is currently silent from the user's point of
   view (the screen still advances to `reset-with-code`, where a subsequent `verifyCode` will
   simply fail against a code that was never actually sent). Not introduced by T013/T014 — it's a
   gap in what T011 built combined with T013's literal instructions — flagging it for the next
   review/planning pass rather than unilaterally redesigning a frozen component's props.

## Run 11 (2026-08-05) — T013/T014 review fix pass: `CHANGES_REQUESTED` Findings 1 and 2

Scope: `code-reviewer` returned `REQUEST CHANGES` on the T013/T014 batch
(`progress/review_005-login.md`, the "Review: T013, T014" section, Findings 1 and 2). This run
fixes both, exactly as directed by the orchestrator's follow-up instructions — no other task or
file touched. Both gaps were self-disclosed in Run 10 above rather than hidden; this is the
follow-up pass to actually resolve them.

### Fix 1 (BLOCKING, Finding 1) — `handleRequestReset` now branches on the result

**The bug**: `LoginScreen.tsx`'s `handleRequestReset` called `requestPasswordReset(email)` and
then *unconditionally* set `mode = "reset-with-code"`, regardless of whether the call actually
succeeded. `spec.md`'s Edge Cases section requires a network-level failure of the reset-code
request to show "a distinct, honest network-failure message, same treatment as User Story 1's
Acceptance Scenario 5" — instead, the screen silently advanced to the code-entry view as if a
code had been sent, with no way for the user to know the request never went through.

**The fix**:
- `src/features/identity/RequestPasswordResetForm.tsx` (T011, previously frozen): added a
  `serverError?: string` prop, rendered as one general inline error banner directly above the
  email field — mirrors `SignInForm.tsx`'s existing `serverError` pattern exactly (one general
  banner, never per-field, same `generalError` style: `fontSize: 14, color: "#dc2626"`). Also
  changed `onSubmit`'s contract from `(input) => void | Promise<void>` to
  `(input) => boolean | Promise<boolean>` — the caller now reports back whether the call
  succeeded, so this component only shows its own local "submitted" confirmation on `true`,
  never on `false` (previously it unconditionally set `submitted = true` after `await onSubmit`
  resolved, which — once `LoginScreen` started branching on the result — would have raced with
  and potentially still displayed the wrong state; making the contract explicit avoids that).
- `src/features/identity/LoginScreen.tsx`: `handleRequestReset` now:
  1. Clears `resetRequestServerError`, sets `isRequestingReset`.
  2. Calls `requestPasswordReset(input.email)` and destructures `{ error }`.
  3. On `error` truthy: calls `setResetRequestServerError(error)`, returns `false` — mode stays
     `"request-reset"`, and the error is passed into `RequestPasswordResetForm`'s new
     `serverError` prop.
  4. On success: sets `resetEmail`, switches `mode` to `"reset-with-code"` (unchanged behavior),
     returns `true`.
  - Added a new `resetRequestServerError` state variable, cleared in both `handleForgotPassword`
    (a fresh attempt should never show a stale error from a previous one) and `resetFlowState()`
    (called on both "Back to sign in" and a successful reset completion).
  - Anti-enumeration is fully preserved: the branch only reacts to a genuine network-level
    failure (`src/lib/supabase-client.ts`'s MUST-NEVER-THROW wrapper around
    `resetPasswordForEmail`, T010) — `requestPasswordReset` never distinguishes "email exists"
    from "email doesn't exist" in its own resolved value in the first place (Supabase's own
    anti-enumeration design, Clarifications Recorded default 1), so branching on its `{ error }`
    can never leak that distinction; it only reveals reachability, which spec.md explicitly
    requires be surfaced.

**Tests added**:
- `src/features/identity/LoginScreen.test.tsx`: "stays on 'request-reset' and shows the error
  inline when requestPasswordReset resolves with a network-level error" — mocks
  `requestPasswordReset` to resolve `{ error: NETWORK_SIGN_IN_ERROR_MESSAGE }`, presses "Send
  reset code", asserts `request-reset-form-error` renders with that exact message, and asserts
  the screen never advances (`Send reset code` button still present, `reset-password-code-field`
  and `request-reset-confirmation` both absent).
- `src/features/identity/RequestPasswordResetForm.test.tsx`: renamed the existing success test to
  make the "on success" condition explicit (`onSubmit` now resolves `true`), and added "renders a
  serverError banner instead of the confirmation when onSubmit resolves false" — submits, asserts
  no confirmation renders when `onSubmit` resolves `false`, then re-renders with a `serverError`
  prop and asserts the error banner (`request-reset-form-error`) renders with that exact text and
  the confirmation still never appears.

### Fix 2 (Finding 2) — static confirmation moved onto `ResetPasswordForm.tsx` (option (b), as directed)

**The tension**: because `handleRequestReset` (even before this fix) switched `mode` to
`"reset-with-code"` as soon as `requestPasswordReset` resolved successfully,
`RequestPasswordResetForm`'s own "If that email is registered, we've sent a code" confirmation
view was mounted and unmounted in the same render pass — never actually visible to a real user,
even though spec.md's US2 Independent Test and AS2 treat it as a distinct, observable
confirmation step.

**Design choice — option (b), per the orchestrator's explicit direction, recorded here for the
record**: rather than (a) adding a genuinely visible confirmation before the transition (a
delay, toast, or an explicit "Continue" step the user presses), the fix moves an equivalent,
always-accurate confirmation line onto `ResetPasswordForm.tsx` itself — the screen the user
actually lands on and reads. This was preferred because:
- It's simpler and adds no new interaction step or timing-dependent UI state (a fixed delay or a
  toast would itself need its own test coverage and a design decision about duration/dismissal).
- It's always accurate to show unconditionally: `requestPasswordReset` (T009/T010) never
  distinguishes "email exists" from "email doesn't exist" in its own result (Clarifications,
  Recorded default 1), so a static "if that email is registered, we've sent a code" line is
  equally true regardless of the real outcome — there is no risk of this static copy ever being
  wrong or leaking registration status.
- It preserves `RequestPasswordResetForm`'s existing "submitted" confirmation state as
  defense-in-depth for any future case where the transition doesn't fire immediately, without
  requiring that path to be the *primary* mechanism a real user relies on.

**The fix**: `src/features/identity/ResetPasswordForm.tsx` — added an exported constant
`RESET_CODE_SENT_MESSAGE = "If that email is registered, we've sent a code."` (deliberately
identical wording to `RequestPasswordResetForm.tsx`'s
`REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE`, so the two views read as one consistent flow —
not imported from there, each screen owns its own copy, matching this file's existing convention
for `RESEND_COOLDOWN_SECONDS`). Rendered as a `Text` (testID `reset-password-code-sent-message`,
`accessibilityRole="text"` since it's a static, non-transient line, not an alert) directly below
the "Enter your reset code" header, always shown — not gated on any prop or domain result. Added
a top-of-file comment recording this design choice and its rationale (mirroring what's in this
report, so a future reader finds the "why" in the code itself, not only here).

**Test added**: `src/features/identity/ResetPasswordForm.test.tsx` — "always shows the static
'we've sent a code' confirmation, regardless of props" — renders the bare component with no
special props and asserts the message is present.

### Verification

```
node_modules/.bin/tsc --noEmit
```
Clean, no output, exit 0.

```
npx jest src/features/identity/LoginScreen.test.tsx src/features/identity/RequestPasswordResetForm.test.tsx src/features/identity/ResetPasswordForm.test.tsx "app/(auth)/login.test.tsx"
```
```
Test Suites: 3 passed, 3 total (first invocation matched 3 of the 4 due to glob/parenthesis
escaping in the combined pattern)
Tests:       18 passed, 18 total
```
Re-ran the fourth file explicitly with proper escaping:
```
npx jest "app/\(auth\)/login.test.tsx"
```
```
Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

Full suite:
```
npx jest
```
```
Test Suites: 44 passed, 44 total
Tests:       301 passed, 301 total
```
(298 before this run + 3 new: 1 in `LoginScreen.test.tsx`, 1 in
`RequestPasswordResetForm.test.tsx`, 1 in `ResetPasswordForm.test.tsx`.)

```
./init.sh
```
```
RESULT: SUCCESS (10/10 stages passed)
```
Only the two pre-existing, non-blocking `expo-doctor`/native-dependency-alignment `WARN`s
(identical to every prior batch's — outdated `expo-image-picker`/`react-native`/etc. pins, not
introduced by this diff).

### Diff scope check

Confirmed via `stat -f "%Sm"` mtimes that exactly six files were touched this run:
`src/features/identity/RequestPasswordResetForm.tsx`/`.test.tsx`,
`src/features/identity/LoginScreen.tsx`/`.test.tsx`, and
`src/features/identity/ResetPasswordForm.tsx`/`.test.tsx`. `SignInForm.tsx` and
`app/(auth)/login.tsx` (and every other file in the feature) predate this run and were not
touched — no changes were needed to either for this fix.

### Requirement traceability (this run's additions)

| FR / Edge Case | Test |
|---|---|
| spec.md Edge Cases (reset-code request network failure) | `LoginScreen.test.tsx`: "stays on 'request-reset' and shows the error inline when requestPasswordReset resolves with a network-level error" |
| spec.md Edge Cases (reset-code request network failure) | `RequestPasswordResetForm.test.tsx`: "renders a serverError banner instead of the confirmation when onSubmit resolves false" |
| FR-007 (anti-enumeration, generic confirmation on success) | `RequestPasswordResetForm.test.tsx`: "calls onSubmit with the parsed email then renders the generic confirmation on success" (renamed/clarified, pre-existing) |
| spec.md US2 AS2 / Independent Test (visible "we've sent a code" confirmation) | `ResetPasswordForm.test.tsx`: "always shows the static 'we've sent a code' confirmation, regardless of props" |

### Tasks.md status

No task IDs change status in this run — T013/T014 were already marked `[X]` in Run 10 and remain
so; this run only addresses the review's blocking/non-blocking findings against that existing
work, per the orchestrator's instructions. Ready for re-review.

### Deviations from plan

None. Both fixes were implemented exactly as directed: Fix 1 per the review's own prescribed
fix (branch on the result, add a `serverError` prop mirroring `SignInForm`'s pattern); Fix 2 per
the orchestrator's explicit choice of option (b) over option (a), with the rationale recorded
above.

---

## Run 12 (2026-08-05) — T015 (Phase 4 checkpoint: US2 manual smoke check)

Scope: exactly T015 from `specs/005-login/tasks.md`. Performed directly by the orchestrator
(`sdd-orchestrator`), same tool-access reasoning as Run 6/T007: `task-implementer` has no
browser-driving capability. Full `npx jest` (301/301) and `tsc --noEmit` were clean immediately
before this run (per Run 11 and its re-review).

**Platform coverage — stated precisely, matching Run 6's disclosure pattern:**
- **Web**: exercised directly against a real running `npm run web` dev server (port 8081) via
  the Claude Browser tool.
- **iOS Simulator / Android**: not attempted this run either — no new attempt was made to fix
  the Xcode-selection gap disclosed in Run 6; same unavailability applies.

**Findings:**

1. **"Forgot password?" reaches a working `request-reset` screen** — CONFIRMED. Clicking it from
   `/login` renders "Reset your password", an Email field, "Send reset code", and "Back to sign
   in" — matching `RequestPasswordResetForm.tsx`/T011.

2. **Fix 1 (the T013/T014 re-review's headline fix) verified LIVE, not just via unit test**:
   submitting a real email on `request-reset` in this sandbox (no reachable Supabase project,
   same `EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY`-empty limitation as Run 6) produced the SAME
   `net::ERR_NAME_NOT_RESOLVED` / `"Failed to fetch"` network failure as T007's sign-in test —
   and, critically, the screen correctly STAYED on `request-reset` mode with the error shown
   inline, rather than silently advancing to `reset-with-code` as the pre-fix code did. This is
   exactly the blocking bug `code-reviewer`'s first T013/T014 review caught and the fix pass
   addressed — now independently confirmed against the real running app, not just
   `LoginScreen.test.tsx`'s mocked assertion of the same behavior.

3. **"Back to sign in" clears state cleanly** — CONFIRMED. From the errored `request-reset`
   screen, pressing "Back to sign in" returned to a fresh `Sign in` view with empty fields and no
   residual error banner — consistent with spec.md US2 AS5's "no residual reset-flow state"
   requirement and the no-stale-state guarantee `code-reviewer` traced in T013's review.

4. **`reset-with-code` mode (the code-entry + new-password screen, with Fix 2's static
   confirmation copy) — NOT reached live**, for the same reason credentials-level sign-in
   couldn't be reached in Run 6: this mode only renders after a SUCCESSFUL `requestPasswordReset`
   call, which requires a real Supabase project this sandbox doesn't have. This remains verified
   only at the unit-test level (`ResetPasswordForm.test.tsx`, `LoginScreen.test.tsx`'s mode-
   sequence test, both already independently re-run and APPROVEd in the T013/T014 re-review) —
   disclosed plainly, not implied as live-checked.

5. **No console errors beyond the two expected network-failure traces** — confirmed via
   `read_console_messages`; no React crash, no unrelated warning.

**Verdict for this checkpoint**: User Story 2's client-reachable surface (mode transition into
`request-reset`, the Fix-1 network-failure-stays-in-mode behavior, and clean state reset via
"Back to sign in") is confirmed working live on web to the full extent this environment's
missing Supabase credentials allow. The code-entry/new-password screen and the full happy path
(request → real emailed code → verify → new password → back to sign-in with success banner)
remain covered only at the unit-test level, consistent with the same disclosed, pre-existing
environment gap `001-registration-kyc` and this feature's own T007 already recorded — not a new
limitation, not silently glossed over here either.

### Task status

`T015` is a manual-smoke-check task, not a code change — no file diff. `tasks.md`'s `T015`
checkbox marked `[X]` by the orchestrator alongside this record.

### Deviations from plan

Performed by the orchestrator directly rather than `task-implementer`, for the same tool-access
reason as Run 6/T007 — disclosed, not silently reassigned.

---

## Run — T016 (Phase 5, User Story 3 — confirm "Create account" link and `/register` isolation)

**Scope**: exactly T016 from `specs/005-login/tasks.md`. This is a confirmation task, not new
feature work — no source files were modified beyond `tasks.md`'s own checkbox.

### Pre-implementation reading confirmed

- `.specify/memory/constitution.md`, `docs/conventions.md`, `docs/verification.md` — re-read in
  full per this run's standing instructions.
- `specs/005-login/spec.md` (User Story 3, FR-003) and `plan.md` (Research Decisions — "First use
  of `expo-router`'s `<Link>`") — re-read to confirm what T016 needs to verify.
- `specs/005-login/tasks.md`'s T016 entry, read directly for authoritative wording (not
  paraphrased from the task prompt).
- `src/features/identity/SignInForm.tsx` (T003, already built/reviewed) — confirmed the
  `<Link href="/register">Create account</Link>` implementation is unchanged since T003.
- `src/features/identity/SignInForm.test.tsx` (T003, already built/reviewed) — read in full.

### Finding (a): did the href assertion already exist?

**Already existed — nothing needed to be added.** `SignInForm.test.tsx` already contains (lines
93–101, from T003's original batch):

```ts
// FR-003: the "Create account" link's resolved href is exactly /register — the one deliberate
// way a visitor without an account reaches 001-registration-kyc's existing registration form
// from this new default landing screen.
it("resolves the 'Create account' link's href to exactly /register", () => {
  const { getByRole } = render(<SignInForm onSubmit={jest.fn()} onForgotPassword={jest.fn()} />);

  const link = getByRole("link", { name: "Create account" });
  expect(link.props.href).toBe("/register");
});
```

This asserts the link's resolved `href` prop directly (via the file's `expo-router` mock, which
renders `<Link>` as a `Text` with `accessibilityRole="link"` and the resolved `href` exposed as a
prop — the same pattern every `app/(auth)/*.test.tsx` already uses for `useRouter`, since a bare
RNTL render has no router context). T016's own text anticipated this ("if `SignInForm.test.tsx`
does not already assert... extend it") — it does, so no test file was touched this run.

### Finding (b): `/register`-family files' diff against `main`

Ran, exactly as instructed:

```
git diff main -- "app/(auth)/register.tsx" "src/features/identity/RegistrationForm.tsx" "src/domain/registration.ts"
```

**Output: empty (zero diff).** All three files are byte-for-byte identical to `main` on this
branch (confirmed additionally via `git status --porcelain` on the same three paths, which also
produced no output — none of the three appear as modified/untracked at all). Verified this isn't
a false negative from `005-login` being commit-free relative to `main` (`git log --oneline
main..HEAD` is empty — this branch's changes are all uncommitted working-tree modifications) by
also running `git diff --stat main -- .` restricted to source, which lists only the files this
feature has actually touched: `src/domain/schemas.ts`/`schemas.test.ts`,
`src/features/identity/useKycGate.ts`/`useKycGate.test.ts`,
`src/lib/supabase-client.ts`/`supabase-client.test.ts` — none of the three named
registration-family files appear in that list at all.

Regarding the one import task-description flagged for scrutiny (`SignInWithPassword`'s type
"being exported/reused" from `registration.ts`): confirmed by reading `src/domain/login.ts`
(T002) that it only **imports** `SignInWithPassword` from `registration.ts`
(`import type { SignInWithPassword } from "./registration";`) and re-exports that same binding —
it does not modify `registration.ts` itself. Grepping `registration.ts` for `SignInWithPassword`
shows the type was already declared there (`export type SignInWithPassword = (...) => ...`) as
part of `001-registration-kyc`'s own pre-existing DI seam (used by that feature's
`submitPersonalRegistration`/`retrySignIn`), consistent with the zero-diff result above —
`005-login` added no line to `registration.ts` at all, it only consumes an export that already
existed there before this feature started.

`RegistrationForm.tsx` and `app/(auth)/register.tsx` are confirmed completely clean of any
`005-login`-attributable change — both files exist unmodified from before this feature's branch
diverged.

### Tests run

```
npx tsc --noEmit
```
Clean, no output (exit 0).

```
npx jest
```
```
Test Suites: 44 passed, 44 total
Tests:       301 passed, 301 total
```
Includes `SignInForm.test.tsx` (all cases, including the pre-existing href assertion above) and
`app/(auth)/register.test.tsx` (unmodified, passing, confirming `/register` itself is unaffected
end-to-end). The one pre-existing console warning (`act(...)` wrapping, `useKycGate.test.ts`,
`HookContainer`/React Query async store update) is unchanged from prior runs — not introduced by
this task, does not fail the suite.

No manual `npm run web` smoke check was performed for this run specifically: T016 is a
confirmation task over already-built, already-smoke-tested surfaces (T003's link and T007's live
web check already exercised `/login` → "Create account" → confirmed `href="/register"` live in
the browser, per Run 6 above). Re-running the same interactive check would not add new evidence
beyond what Run 6 already recorded and what the still-passing automated suite reconfirms here.

### Requirement traceability

| FR | Requirement | Test(s) |
|---|---|---|
| FR-003 | "Create account" link navigates to `/register`, unmodified from `001-registration-kyc` | `SignInForm.test.tsx` → "resolves the 'Create account' link's href to exactly /register" (pre-existing, reconfirmed passing this run); `app/(auth)/register.test.tsx` (unmodified, reconfirmed passing, proving `/register` itself still renders correctly) |

### Task status

- [X] T016 (marked `[X]` in `specs/005-login/tasks.md`)

### Deviations from plan

None. This was a pure confirmation task — no source file was edited, since the required test
assertion and the required file isolation were both already true from prior, already-reviewed
work (T003).

---

## Run 13 (2026-08-05) — T017, T018 (Phase 6: Polish — accessibility pass, responsive layout check)

**Scope**: exactly T017 and T018 from `specs/005-login/tasks.md`. `[P]` fix-in-place tasks, no
new files, restricted to `SignInForm.tsx`, `RequestPasswordResetForm.tsx`, `ResetPasswordForm.tsx`,
and `LoginScreen.tsx` (plus their test files, only where a new assertion was warranted). T019
(README doc) and T020 (full `./init.sh`) are explicitly out of this run's scope.

### Pre-implementation reading confirmed

- `specs/005-login/tasks.md`'s T017/T018 entries — read directly for the authoritative wording.
- `specs/005-login/spec.md`'s FR-010 (accessibility label + ≥44×44 tap target on every
  interactive element this feature introduces; usable at 375px through desktop widths) and
  SC-003 (375px web viewport through desktop widths, plus phone/tablet form factors).
- `docs/conventions.md` — no new visual language; extreme consistency with existing patterns.
- `src/features/identity/RegistrationForm.tsx` and `VerifyPhoneScreen.tsx` — the established
  reference conventions: every `TextInput`/`Pressable` carries an explicit `accessibilityLabel`
  and `accessibilityRole`; every tappable element declares `minHeight: 44` AND `minWidth: 44` in
  its style object (even elements that already stretch to fill their container via default flex
  behavior, e.g. `RegistrationForm`'s submit `button` style declares both explicitly rather than
  relying on stretch-fill alone); container styles use `width: "100%", maxWidth: 420` (percentage
  + cap, not a fixed pixel width) with a single-column (`gap`-based, no `flexDirection: "row"`)
  layout for the whole form, which is what keeps these screens usable at a 375px viewport with no
  responsive-specific code path.
- `src/features/identity/FormField.tsx` and `CodeInput.tsx`/`CodeInput.types.ts` — confirmed
  these shared primitives (already reused, not new to this feature) already carry correct
  `accessibilityRole="alert"` inline-error text and a `minHeight: 44, minWidth: 44` input style
  with a configurable `accessibilityLabel` prop — no changes needed to either.
- All four files in scope (`SignInForm.tsx`, `RequestPasswordResetForm.tsx`,
  `ResetPasswordForm.tsx`, `LoginScreen.tsx`) read in full before making any change.

### T017 — Accessibility pass: findings and fixes

**Already compliant (no changes needed):**
- Every `TextInput` in all three forms carries an explicit `accessibilityLabel` ("Email",
  "Password"/"New password", "Reset code" on `CodeInput`) — matches `RegistrationForm`'s pattern
  exactly.
- Every `Pressable` carries `accessibilityRole="button"` + an explicit, human-readable
  `accessibilityLabel` ("Forgot password?", "Sign in", "Send reset code", "Back to sign in",
  "Set new password", "Resend code") and an `accessibilityState={{ disabled, busy }}` reflecting
  its actual interactive state.
- `SignInForm`'s `<Link href="/register">` already carries an explicit
  `accessibilityLabel="Create account"` (this repo's first use of `<Link>` for a pure navigation
  affordance, per `plan.md`'s Research Decision — already correctly labeled from T003).
- The primary submit buttons and the `CodeInput` field in all three forms already declare both
  `minHeight: 44` and `minWidth: 44` explicitly.
- No `tabIndex`/`focusable`/`importantForAccessibility` overrides exist anywhere in the four
  files (confirmed via grep) — every interactive element is a real `TextInput`/`Pressable`/`Link`
  that `react-native-web` maps to a genuinely focusable DOM element (`input`, a `role="button"`
  div with an implicit `tabIndex="0"`, or a real `<a href>`), and no decorative `Text`/`View` is
  marked focusable. Source order within each of the three modes (`sign-in`: email → password →
  "Forgot password?" → submit → "Create account"; `request-reset`: email → submit → "Back to
  sign in"; `reset-with-code`: email → code → new password → submit → "Resend code" → "Back to
  sign in") is a sensible, linear reading/interaction order in every mode — nothing in the DOM
  structure would produce an out-of-order or skipped tab stop. (Live keyboard-tab verification in
  a real browser is explicitly the orchestrator's follow-up per this task's brief, not re-driven
  here.)

**Findings fixed in place:**

1. **Missing explicit `minWidth: 44` on shrink-wrapped, text-only `Pressable` "link-style"
   buttons.** `SignInForm.tsx`'s `forgotPasswordButton` style, `RequestPasswordResetForm.tsx`'s
   `backButton` style, and `ResetPasswordForm.tsx`'s `backButton` style each use
   `alignSelf: "flex-start"` (deliberately shrink-wrapping to their text content's width, unlike
   the full-width submit buttons) but declared only `minHeight: 44`, not `minWidth: 44`. Visually
   these are almost certainly already wider than 44px given their text content ("Forgot
   password?"/"Back to sign in" at 14px), but per this task's own brief ("check actual style
   values … against this, not just visual appearance") the style object itself did not guarantee
   the ≥44px-wide tap target FR-010 requires — a shorter future copy change, an unusually narrow
   font-scaling setting, or a different locale's shorter translation could shrink the actual
   rendered width below 44px with nothing in the style catching it. Fixed by adding
   `minWidth: 44` to all three style objects.
2. **`SignInForm.tsx`'s `createAccountLink` style** (the `<Link>`'s style prop) declared
   `minHeight: 44` but not `minWidth: 44` — same category of gap as above, even though it likely
   already stretches to the full container width by default flex behavior (no `alignSelf`
   override, same as the submit `button` style right above it, which explicitly declares both).
   Added `minWidth: 44` for the same explicit-guarantee reasoning, matching the sibling submit
   button's own belt-and-suspenders pattern in the same file.
3. **`LoginScreen.tsx`'s "Signing you in…" view used `accessibilityRole="text"`, not `"alert"`.**
   This view replaces `SignInForm`'s entire subtree the instant sign-in succeeds, with no
   user-initiated focus change — nothing prompts a screen reader to discover and announce it on
   its own with a plain, non-live `"text"` role. Every other transitional confirmation/error
   banner this feature introduces (`SignInForm`'s `confirmationMessage`/`serverError`,
   `RequestPasswordResetForm`'s confirmation, `ResetPasswordForm`'s `generalError`) already uses
   `accessibilityRole="alert"` specifically so VoiceOver/TalkBack/web screen readers announce it
   as a live-region update the moment it appears — the "Signing you in…" view was the one
   transitional message in this feature's own four files that didn't follow that established
   in-feature convention. Fixed by changing its `accessibilityRole` from `"text"` to `"alert"`
   (with an inline comment explaining why, referencing the sibling banners' precedent).

No other accessibility gaps found across the four files.

### T018 — Responsive layout check: findings

Checked all `StyleSheet.create` blocks in the four files (`grep -n "width:|flexDirection|
paddingHorizontal|marginHorizontal"` across all four, plus a full manual read of every style
object) for hardcoded pixel widths or row-based layouts that could overflow a 375px-wide
viewport:

- `SignInForm.tsx`, `RequestPasswordResetForm.tsx`, `ResetPasswordForm.tsx`: each `container`
  style is `{ width: "100%", maxWidth: 420, gap: 16 }` — byte-for-byte the same percentage-width-
  plus-cap pattern `RegistrationForm.tsx`/`VerifyPhoneScreen.tsx` already establish. No
  `flexDirection: "row"` anywhere in any of the three forms (unlike `RegistrationForm`'s
  `accountTypeRow`, which is not part of this feature) — every field/button stacks in a single
  column via the default flex-column behavior, so nothing depends on available horizontal space
  beyond the field width itself. The only two `paddingHorizontal` occurrences in these three
  files (`SignInForm.tsx:193`, `RequestPasswordResetForm.tsx:173`, `ResetPasswordForm.tsx:285`)
  are each `12`, on the `input`/`TextInput` style only — a small, fixed inset, not a
  layout-breaking fixed width.
- `LoginScreen.tsx`'s `screen` style (`{ flex: 1, alignItems: "center", justifyContent: "center",
  padding: 24 }`) has no `width` of its own — it centers whichever child form is mounted within
  the full available viewport, leaving `327px` of content width at a 375px viewport
  (`375 - 2×24`), comfortably under each child form's `maxWidth: 420` cap, so no overflow at the
  narrow end and no unbounded stretch at the wide end (desktop widths are capped by each form's
  own `maxWidth: 420, alignSelf` — inherited from `container`'s `width: "100%"` inside the
  centered `screen` — matching `RegistrationForm`'s already-established desktop behavior).
- `CodeInput.tsx` (shared, reused by `ResetPasswordForm.tsx`, not new to this feature) has no
  fixed `width` either — its `input` style sets only `minHeight`/`minWidth: 44`, stretching to
  fill its `FormField` parent's width like every other `TextInput` in these forms.
- `FormField.tsx` (shared) has no `width`/layout constraint of its own beyond `gap: 4` on its
  wrapping `View` — no responsive-layout concern.

**Verdict: already compliant, no changes needed for T018.** All four files were already built
following `RegistrationForm.tsx`'s established responsive conventions exactly (as tasks.md's
T003/T011/T012 entries required at build time) — this audit found zero hardcoded pixel widths,
zero `flexDirection: "row"` layouts, and zero other layout assumption that would break at a
375px-wide viewport. This is a code-level styles read, not a live visual check (no browser tool
available in this session) — full phone/tablet simulator verification (iOS/Android) and a live
375px/desktop browser-window check remain the orchestrator's separate follow-up, per this task's
own brief.

### Files changed

- `src/features/identity/SignInForm.tsx` — added `minWidth: 44` to `forgotPasswordButton` and
  `createAccountLink` styles.
- `src/features/identity/RequestPasswordResetForm.tsx` — added `minWidth: 44` to `backButton`
  style.
- `src/features/identity/ResetPasswordForm.tsx` — added `minWidth: 44` to `backButton` style.
- `src/features/identity/LoginScreen.tsx` — changed the "Signing you in…" `<Text>`'s
  `accessibilityRole` from `"text"` to `"alert"`, with an inline comment explaining why.
- `src/features/identity/LoginScreen.test.tsx` — added one new test case ("exposes the 'Signing
  you in…' view as an alert so assistive tech announces it") asserting
  `getByRole("alert", { name: "Signing you in…" })` resolves, covering the `accessibilityRole`
  fix above. No other test file needed a new assertion — the `minWidth` style additions are pure
  style-object values with no existing or newly-warranted behavioral assertion in this codebase's
  test style (styles are not unit-tested elsewhere in this repo either).

### Tests run

```
npx tsc --noEmit
```
Clean, no output (exit 0).

```
npx jest src/features/identity
```
```
PASS src/features/identity/TutorialScreen.test.tsx
PASS src/features/identity/KycStatusScreen.test.tsx
PASS src/features/identity/CodeInput.test.tsx
PASS src/features/identity/VerifyPhoneScreen.test.tsx
PASS src/features/identity/RegistrationForm.test.tsx
PASS src/features/identity/SignInForm.test.tsx
PASS src/features/identity/ResetPasswordForm.test.tsx
PASS src/features/identity/RequestPasswordResetForm.test.tsx
PASS src/features/identity/ProfileForm.test.tsx
PASS src/features/identity/useKycGate.test.ts
PASS src/features/identity/LoginScreen.test.tsx

Test Suites: 11 passed, 11 total
Tests:       80 passed, 80 total
```

Full repo suite:
```
npx jest
```
```
Test Suites: 44 passed, 44 total
Tests:       302 passed, 302 total
```
(301 → 302: exactly the one new `LoginScreen.test.tsx` assertion added this run; zero
regressions anywhere else.)

No manual `npm run web` smoke check performed this run — T017/T018 are code-level style/markup
audits per this task's own brief ("you don't have browser tools" / "focus your part on making
sure nothing in the DOM/component structure would obviously break"); the live keyboard-tab-order
and live-viewport checks are explicitly the orchestrator's separate follow-up.

### Requirement traceability

| FR | Requirement | Test(s) / evidence |
|---|---|---|
| FR-010 (accessibility label + ≥44×44 tap target on every interactive element; usable 375px through desktop) | `SignInForm.test.tsx`/`RequestPasswordResetForm.test.tsx`/`ResetPasswordForm.test.tsx` (pre-existing, reconfirmed passing) already assert every `accessibilityLabel`; `LoginScreen.test.tsx`'s new case asserts the "Signing you in…" view's `accessibilityRole="alert"`; the `minWidth: 44` style additions are a styles-level fix with no corresponding RNTL assertion pattern elsewhere in this repo (styles aren't unit-tested; verified by direct code read, documented above) |

### Task status

- [X] T017 (marked `[X]` in `specs/005-login/tasks.md`)
- [X] T018 (marked `[X]` in `specs/005-login/tasks.md`)

### Deviations from plan

None. Both tasks were fix-in-place audits restricted to the four named files (plus
`LoginScreen.test.tsx` for the one new, warranted assertion) — no new files created, no scope
expansion into `T019`/`T020`.

---

## Run 14 (2026-08-05) — T017/T018 live verification (orchestrator follow-up)

Scope: the live keyboard-tab-order and live-viewport checks explicitly deferred by Run 13's
code-level audit (task-implementer has no browser tools). Performed directly by the orchestrator
via a real `npm run web` dev server and the Claude Browser tool, same tool-access reasoning as
Runs 6/12 (T007/T015).

**Keyboard tab order (T017)**:
- `sign-in` mode: clicked into the Email field to establish page focus, then walked `Tab` five
  times, reading `document.activeElement` after each press. Order confirmed: **Email → Password
  → "Forgot password?" → "Sign in" → "Create account"** — matches visual top-to-bottom order,
  no skipped/out-of-order elements.
- `request-reset` mode: same method. Order confirmed: **Email → "Send reset code" → "Back to
  sign in"** — also matches visual order.
- Focus visibility: read `getComputedStyle(document.activeElement)` after tabbing to "Sign in" —
  `outline: "rgb(229, 151, 0) auto 1px"` — a real, non-suppressed browser focus ring is present
  (not `outline: none`), confirmed live, not just inferred from the absence of an
  `outline`-suppressing style in the source.
- `reset-with-code` mode's tab order was NOT checked live, for the same reason its screen
  couldn't be reached in Run 12 (needs a successful `requestPasswordReset` call, unavailable in
  this sandbox) — this remains a code-level-only check (Run 13's audit read `ResetPasswordForm.tsx`
  directly, found no `tabIndex` irregularities, but was not visually walked in a live tab order).

**Responsive layout (T018)**:
- Resized to 375×812 (mobile) on the `request-reset` screen: form fills available width with no
  horizontal overflow — confirmed via `document.documentElement.scrollWidth === clientWidth ===
  375` (no horizontal scrollbar), matching Run 13's code-level prediction of the
  `width: "100%", maxWidth: 420` pattern. The `minWidth: 44` fix from Run 13 is visually evident:
  "Back to sign in"'s focus-ring box is comfortably wider than 44px around its own text.
  Screenshot confirms no clipped/overlapping content.
  - `sign-in`/`reset-with-code` modes were not individually re-screenshotted at 375px this run
    (same layout primitives/container pattern as `request-reset`, already confirmed structurally
    identical by Run 13's code read across all three forms) — a reasonable inference from the
    shared pattern, not a separate live check for each of the three modes.
- Resized to 1440×900 (desktop): form stays capped at its `maxWidth: 420` and centered, no
  unbounded stretch to fill the wide viewport — confirmed visually via screenshot.

**Verdict**: T017/T018's live-verifiable-on-web portion (tab order across two of the three
modes, visible focus ring, no horizontal overflow at 375px, correct desktop cap) is confirmed
working. iOS/Android simulator-based phone/tablet form-factor verification remains unavailable in
this environment (same disclosed Xcode-selection gap as every prior manual-check task this
session) — not attempted, not implied as covered.

### Task status

No new checkbox change — T017/T018 were already marked `[X]` by Run 13; this run adds live
verification evidence on top of that code-level audit, following the same pattern Run 6/Run 12
added for T007/T015.

### Deviations from plan

Performed by the orchestrator directly rather than `task-implementer`, for the same tool-access
reason as prior manual-check runs — disclosed, not silently reassigned.

---

## Run 15 (task-implementer): T019 — document Supabase reset-password template prerequisite + throwaway-client design

### Task

`specs/005-login/tasks.md` T019 (Phase 6, Polish): document, in
`src/features/identity/README.md`, (a) the Supabase project-dashboard "Reset Password" email
template's `{{ .Token }}` prerequisite (spec.md Assumptions — a one-time, out-of-repo,
project-dashboard configuration step, not application code) and (b) a short note on why
`createPasswordRecoverySession()` (`src/lib/supabase-client.ts`, T010) uses a second, throwaway
Supabase client instance rather than the shared `supabase` singleton, so a future reader doesn't
mistake it for dead code or accidentally consolidate it.

### Files changed

- `src/features/identity/README.md` — appended two new sections after the existing top-level
  paragraph, following the same prose/spec-citation style already established by
  `src/features/navigation/README.md` (short paragraphs, blockquote-free here since no direct
  quote from plan.md was needed, explicit `specs/005-login/spec.md` / `specs/005-login/plan.md`
  citations):
  - **"Prerequisite: Supabase 'Reset Password' email template must include `{{ .Token }}`"** —
    explains the forgot-password flow's 6-digit-code design (vs. magic link, and why: the
    `KycGate`-redirect race documented in spec.md's "Recorded default 2"), states plainly that
    this is a one-time per-project dashboard setting under Authentication → Email Templates →
    Reset Password, that Supabase's own default template only has `{{ .ConfirmationURL }}` (no
    code), that there is no in-app fallback/detection if it's missing, and points a future
    debugger at this setting first if the emailed message never contains a code during manual
    verification.
  - **"Password-recovery: throwaway Supabase client, not the shared singleton"** — states the
    `createPasswordRecoverySession()` design decision explicitly (second `createClient(...)`
    instance, `persistSession: false, autoRefreshToken: false`, never touching the module-level
    `supabase` export), explains the *why* (a successful `verifyOtp({ type: "recovery" })`
    establishes a real session as a side effect; `app/_layout.tsx`'s `KycGate` redirects the
    instant any session becomes visible on the shared singleton, which would race the user typing
    their new password if the code-verification step ran there), notes the lazy
    per-attempt-instance / always-`discard()` lifecycle, cites `specs/005-login/spec.md`'s
    "Recorded default 2" and `specs/005-login/plan.md`'s "Password-reset confirmation" Research
    Decision, and ends with an explicit "do not consolidate this into the shared client" warning.
- `specs/005-login/tasks.md` — marked T019 `[X]`.

Read (not modified) to confirm accuracy before writing: `src/features/identity/README.md`
(existing structure/tone from `001-registration-kyc`), `src/lib/supabase-client.ts`'s
`createPasswordRecoverySession()`/`signInWithPassword`/`requestPasswordReset` (T010's actual
implementation, to make sure the design description matches the real code rather than a
paraphrase of the task text), `src/features/navigation/README.md` (style reference — the only
other `src/features/*` README with prose beyond the one-paragraph template, so used as the
convention model), `spec.md`'s Assumptions + Clarifications "Recorded default 2", and `plan.md`'s
"Password-reset confirmation" Research Decision.

### Verification

Documentation-only change — no test changes required. Ran type-check and the full suite anyway
per instructions, to confirm nothing was accidentally broken:

```
npx tsc --noEmit
```
→ clean, no output, exit 0.

```
npx jest
```
→
```
Test Suites: 44 passed, 44 total
Tests:       302 passed, 302 total
Snapshots:   0 total
Time:        1.676 s, estimated 2 s
Ran all test suites.
```

No manual smoke check performed — this task touches no runtime code, only a `.md` file under
`src/features/identity/`, which is not itself imported/bundled by the app.

### Requirement traceability

Not applicable — T019 is a documentation task with no functional-requirement mapping in
`tasks.md` (no `(FR-...)` tag on this task, unlike T001–T018).

### Task status

- [X] T019 marked done in `specs/005-login/tasks.md`.
- T020 (`./init.sh` end-to-end, all prior tasks' dependency) remains `[ ]` — not in scope for
  this run.

### Deviations from plan

None. Pure documentation addition, no code paths touched, no new dependency, no scope creep
beyond what T019's wording specifies.

---

## Run — T020 (2026-08-05) — Final verification gate

Scope: exactly T020 from `specs/005-login/tasks.md` — verification-only, no code changes
attempted or needed. Read `specs/005-login/tasks.md`'s T020 entry, `docs/verification.md`, and
confirmed via `git status` that no code files were dirty going into this run beyond the
existing 005-login diff (T001-T019's work, all previously reviewed APPROVE).

### Command run

```
./init.sh
```

(full, unflagged — no `--skip-doctor`, `--skip-tests`, `--skip-build`, or `--skip-native`.)

### Full summary output

```
==================== init.sh summary ====================
✅ [OK] Prerequisites: node v20.20.2, npm v10.8.2
✅ [OK] Env file: .env already exists, left untouched
✅ [OK] npm install: dependencies installed
✅ [OK] Type-check: no type errors
⚠️  [WARN] expo-doctor: issues found (non-blocking) — see /tmp/init-sh-front-doctor.log: Found
    outdated dependencies. Advice: Use 'npx expo install --check' to review and upgrade your
    dependencies. To ignore specific packages, add them to "expo.install.exclude" in
    package.json. 2 checks failed, indicating possible issues with the project.
⚠️  [WARN] Native deps: peers declared, but some package versions differ from the pinned SDK's
    expectations (non-blocking) — see /tmp/init-sh-front-expo-install-check.log:
    expo-image-picker@15.0.7 (expected ~15.1.0), react-native@0.74.0 (expected 0.74.5),
    react-native-safe-area-context@4.10.1 (expected 4.10.5), @types/react@18.3.31 (expected
    ~18.2.79), typescript@5.9.3 (expected ~5.3.3).
✅ [OK] Tests: all tests passed
✅ [OK] Build check (web): web bundle exported cleanly
✅ [OK] Build check (ios): ios bundle exported cleanly
✅ [OK] Build check (android): android bundle exported cleanly
===========================================================
RESULT: SUCCESS (10/10 stages passed)
```

### Test stage detail (`/tmp/init-sh-front-tests.log`)

```
Test Suites: 44 passed, 44 total
Tests:       302 passed, 302 total
Snapshots:   0 total
Time:        1.549 s, estimated 2 s
Ran all test suites.
```

All 44 suites pass, including the specific regression guards T020 exists to confirm:
- `src/features/identity/useKycGate.test.ts` — PASS (T006's one-line
  `KYC_ROUTE_TARGETS.unauthenticated` change to `/login` didn't break the `KycRoute` value
  assertions).
- `src/domain/kyc-gate.test.ts` — PASS (untouched gate logic still correct).
- `app/(auth)/register.test.tsx`, `app/(auth)/register.session-wiring.test.tsx`,
  `app/(auth)/register.session-failure.test.tsx` — all PASS (confirms `/register` is still
  fully reachable/functional and untouched by this feature, per T016's requirement).
- `src/features/identity/SignInForm.test.tsx`, `src/features/identity/LoginScreen.test.tsx`,
  `app/(auth)/login.test.tsx`, `src/domain/login.test.ts` — all PASS (US1, the MVP).
- `src/features/identity/RequestPasswordResetForm.test.tsx`,
  `src/features/identity/ResetPasswordForm.test.tsx`, `src/domain/passwordReset.test.ts`,
  `src/lib/supabase-client.test.ts` — all PASS (US2, forgot password).
- `src/domain/schemas.test.ts` — PASS (T001's `passwordSchema` refactor + `signInSchema` +
  T008's reset schemas, including the byte-for-byte-no-op regression case for
  `personalRegistrationSchema.password`).

### Stages 1-4 (prerequisites, env, install, type-check)

All OK. Type-check clean across the whole repo (not scoped to this feature — a full
`tsc --noEmit`-equivalent), confirming no dangling type error was introduced by any of
T001-T019's changes, including the `KycRoute`/`KYC_ROUTE_TARGETS` type shape and the new
`src/domain/login.ts` / `src/domain/passwordReset.ts` DI types.

### Stages 5-6 (expo-doctor, native dependency alignment) — WARN, non-blocking

Both warnings are pre-existing dependency-version drift (`expo-image-picker`, `react-native`,
`react-native-safe-area-context`, `@types/react`, `typescript` all slightly behind the pinned
Expo SDK's expected versions) — unrelated to 005-login's scope, not introduced by this
feature, and explicitly documented in `docs/verification.md` as non-blocking ("excluding the
test-tooling warning" carve-out aside, `init.sh`'s own summary marks these WARN not FAIL, and
`RESULT: SUCCESS` reflects that). No action taken per T020's instruction not to silently "fix"
anything outside this task's scope.

### Stage 7 (tests) — OK

Covered above: 302/302 passed, 44/44 suites passed.

### Stage 8 (bundle exports) — OK, all three platforms

`web`, `ios`, and `android` all exported cleanly via `npx expo export`. This confirms
`app/(auth)/login.tsx` and every new `src/features/identity/*` file resolve correctly in all
three Metro module graphs (per `docs/verification.md`'s Level 4 rationale — web-only success
would not have caught a native-only import error).

### Result

`RESULT: SUCCESS (10/10 stages passed)`. All mandatory stages (prerequisites, env, install,
type-check, tests, and all three bundle exports) are green. The two WARN stages are
non-blocking, pre-existing, and out of scope for this feature.

### Task status

- [X] T020 marked done in `specs/005-login/tasks.md`.

This closes out `specs/005-login/tasks.md` — T001 through T020 are now all `[X]`. All three
user stories (US1 sign-in + routing change, US2 forgot password, US3 create-account link) are
implemented, tested, and pass the full verification gate.

### Deviations from plan

None. No code changes were made or needed — T020 is verification-only, and everything passed
on the first full run.
