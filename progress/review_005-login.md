# Code Review: 005-login — T001, T002

**Reviewed**: 2026-08-05
**Scope**: `git diff` (working tree vs. HEAD, branch `005-login`) limited to files touching
`src/domain/schemas.ts`, `src/domain/schemas.test.ts`, `src/domain/login.ts`,
`src/domain/login.test.ts` — per tasks.md Phase 2 (Foundational: T001, T002 only).

## Diff scope check

`git status --porcelain` shows exactly:
- Modified: `feature_list.json`, `progress/current.md` (session bookkeeping — expected)
- Modified: `src/domain/schemas.ts`, `src/domain/schemas.test.ts` (T001)
- New (untracked): `progress/impl_005-login.md`, `specs/005-login/**` (spec-writer output,
  pre-existing to this review), `src/domain/login.ts`, `src/domain/login.test.ts` (T002)

No other `src/` or `app/` file changed. Scope matches T001/T002 exactly — **no scope creep**.

## Traceability table

| FR | Requirement | Test(s) |
|---|---|---|
| FR-001 | Email+password sign-in reusing `signInWithPassword()`, no second sign-in code path | `src/domain/schemas.test.ts` `signInSchema` describe block (5 cases); `src/domain/login.test.ts` all 3 `submitSignIn` cases |

T001/T002 are both explicitly annotated `*(FR-001)*` in tasks.md — this is the only FR in scope
for this batch. Traceability satisfied.

## tasks.md checklist status (Phase 2)

- [X] T001 — `passwordSchema` factored out, `personalRegistrationSchema.password` refactored to
  reference it, `signInSchema` added, `schemas.test.ts` extended. **Matches diff.**
- [X] T002 — `src/domain/login.ts` + `login.test.ts` created per spec. **Matches diff.**
- All later tasks (T003 onward) correctly remain `[ ]` — untouched, as expected for this batch.

## CHECKPOINTS.md walkthrough (C1–C6, as relevant to this batch)

- **C1**: `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist [x].
  `docs/verification.md`/`docs/conventions.md` exist [x]. Constitution exists/current [x].
  `./init.sh` not re-run in full this batch (by design — T020's job); `tsc --noEmit` and the
  relevant/full Jest suites were independently re-run below and pass, satisfying the intent for
  a domain-only batch [x].
- **C2**: Exactly one feature (`005-login`) `in_progress` in `feature_list.json` [x].
  `progress/current.md` describes only the active 005-login session [x]. Prior `done` features
  (001, 004) unaffected by this diff [x].
- **C3**: `src/domain/login.ts` and `schemas.ts` have zero React/RN imports — independently
  grepped (`^import` lines: only `zod`, `./schemas`, `./registration`, and `registration.ts`'s
  own imports are `./api-client`, `./types` — no RN/React anywhere in the chain) [x]. No UI
  component touched this batch, so "calls into domain/lib" N/A [x]. No platform-specific code
  in this batch [x]. No direct DB/Postgres/Supabase-table access — this batch is pure
  validation/DI orchestration [x]. No new global state library [x]. No stray `console.log`/
  context-free `TODO` [x].
- **C4**: Every exported `src/domain` function in this diff (`passwordSchema`, `signInSchema`,
  `submitSignIn`) has a covering unit test [x]. No new/changed screen this batch, so component-
  test item N/A [x]. `./init.sh`'s three-target build check not run this batch (correctly
  deferred to T020 per tasks.md) — not a blocker for a Foundational, domain-only batch [ ]
  (conditional/deferred, not a defect).
- **C5**: No suspicious untracked files — only the expected new domain files and pre-existing
  `specs/005-login/`/`progress/impl_005-login.md` [x]. `progress/history.md` entry for a closed
  session N/A (session still open, mid-feature) [ ] (not applicable yet — feature not closing).
- **C6**: `specs/005-login/` has `spec.md` + `plan.md` + `tasks.md` [x]. No open
  `[NEEDS CLARIFICATION]` markers (confirmed by direct read of spec.md — the two "Recorded
  default" Clarifications are resolved defaults, human-approved per `progress/current.md`, not
  open markers) [x]. Feature not `done` yet, so "all tasks.md items `[X]`" N/A [x]. FR-001 (the
  only FR in scope this batch) is covered by tests referencing it [x].

No C1–C6 box relevant to this batch is empty in a way that blocks approval; the two deferred
items (full three-target build, session-close history entry) are explicitly out of scope for a
mid-feature Foundational-phase batch per tasks.md's own T020 sequencing.

## Independent verification (re-run, not trusted from `progress/impl_005-login.md`)

```
node_modules/.bin/tsc --noEmit
```
Clean, no output, exit 0.

```
npx jest src/domain/schemas.test.ts src/domain/login.test.ts
```
```
PASS src/domain/login.test.ts
PASS src/domain/schemas.test.ts
Test Suites: 2 passed, 2 total
Tests:       46 passed, 46 total
```

```
npx jest src/domain
```
7 suites / 118 tests, all pass (includes `registration.test.ts`, confirming the
`passwordSchema` refactor is a behavioral no-op for `personalRegistrationSchema`).

```
npx jest   (full repo suite)
```
38 suites / 244 tests, all pass. No regression anywhere else in the tree.

## Specific checks requested

1. **`passwordSchema` matches the pre-existing inline rule exactly.**
   Before: `password: z.string().min(8, "Password must be at least 8 characters")` inline on
   `personalRegistrationSchema`. After: `export const passwordSchema = z.string().min(8,
   "Password must be at least 8 characters")`, and `personalRegistrationSchema.password:
   passwordSchema`. Same threshold, same message, byte-for-byte. Confirmed by a new regression
   test (`schemas.test.ts`) asserting a 6-char password still rejects with the exact original
   message and an exactly-8-char password still accepts, plus the full pre-existing
   `registration.test.ts` suite (which exercises `personalRegistrationSchema` indirectly)
   passing unmodified. **True behavioral no-op, verified.**

2. **`signInSchema.password` is `min(1, ...)`, not `passwordSchema`.**
   Confirmed: `password: z.string().min(1, "Enter your password")`. Per tasks.md T001 this is
   intentional (login checks presence only, not strength) — not flagged as a defect, and a test
   explicitly asserts a password shorter than 8 characters is *accepted* by `signInSchema`
   ("no strength re-check on sign-in").

3. **`src/domain/login.ts` has zero React/React Native imports.**
   Confirmed by direct read and grep: only imports are `./schemas` and `type
   SignInWithPassword` from `./registration`, neither of which pulls in React/RN. Constitution
   Principle IV satisfied.

4. **`SignInWithPassword` type is imported, not redeclared.**
   Confirmed: `import type { SignInWithPassword } from "./registration"`, then re-exported
   verbatim via `export type { SignInWithPassword }` (for caller convenience per the file's own
   comment) — a re-export of the same binding, not a new declaration. Matches tasks.md T002's
   "do not redeclare it" instruction and `registration.ts`'s existing type signature
   (`(email: string, password: string) => Promise<{ error: string | null }>`), which
   `submitSignIn`'s usage (`signIn(parsed.email, parsed.password)`) matches exactly.

5. **`submitSignIn` behavior.**
   `signInSchema.parse(input)` runs first (throws synchronously inside the async function,
   surfacing as a rejected Promise, for invalid input) — confirmed a bad-email input rejects
   before `signIn` is ever called (test asserts `signInCalled` stays `false`). On valid input,
   `signIn(parsed.email, parsed.password)` is called and its `{ error: ... }` result is returned
   unchanged (verified for both the `{ error: null }` and `{ error: "<message>" }` shapes by
   dedicated tests) — no reinterpretation, no extra try/catch (consistent with the file's
   comment explaining `signIn` itself never throws per `signInWithPassword`'s T034 contract).

## Findings

None. No blocking or nit-level issues found in this batch's diff.

## Verdict

**APPROVE**

T001 and T002 are implemented exactly as specified in `tasks.md`, are a true behavioral no-op
for the pre-existing registration schema, keep `src/domain/login.ts` fully portable (zero RN
imports), correctly reuse (not redeclare) the `SignInWithPassword` DI type, and are covered by
tests that trace to FR-001. Type-check and the full test suite (244 tests) pass independently.
Diff scope is exactly T001/T002 plus expected session bookkeeping — nothing else changed.

---

# Code Review: 005-login — T003, T004

**Reviewed**: 2026-08-05
**Scope**: working-tree diff limited to `src/features/identity/SignInForm.tsx`,
`src/features/identity/SignInForm.test.tsx`, `src/features/identity/LoginScreen.tsx`,
`src/features/identity/LoginScreen.test.tsx`, plus `specs/005-login/tasks.md` T003/T004
flipped to `[X]`. Per `tasks.md` Phase 3 (User Story 1: T003, T004 only).

## Diff scope check

`git status --porcelain` shows, beyond the already-approved T001/T002 batch (modified
`feature_list.json`, `progress/current.md`, `src/domain/schemas.ts`, `src/domain/schemas.test.ts`,
and untracked `specs/005-login/`, `progress/impl_005-login.md`, `progress/review_005-login.md`,
`src/domain/login.ts`, `src/domain/login.test.ts` — all previously reviewed/approved, untouched
again this batch, confirmed by direct read):

- New (untracked): `src/features/identity/SignInForm.tsx`, `SignInForm.test.tsx`,
  `LoginScreen.tsx`, `LoginScreen.test.tsx`.

`app/(auth)/register.tsx`, `RegistrationForm.tsx`, `src/domain/registration.ts`,
`src/features/identity/useKycGate.ts`, and every T001/T002 file are byte-for-byte unmodified.
No `app/(auth)/login.tsx` exists yet (correctly deferred to T005 — not built here). Scope
matches T003/T004 exactly — **no scope creep**.

## Traceability table

| FR | Requirement | Test(s) |
|---|---|---|
| FR-001 | Sign-in reuses injected `SignInWithPassword`, no second sign-in code path | `SignInForm.test.tsx` "calls onSubmit with the parsed email/password..."; `LoginScreen.test.tsx` all 3 cases (each asserts `signIn` called directly with parsed args) |
| FR-003 | "Create account" link resolves to `/register` | `SignInForm.test.tsx` "resolves the 'Create account' link's href to exactly /register" |
| FR-004 | Single, generic, non-field-specific inline error for a credentials rejection | `SignInForm.test.tsx` "renders a serverError as a general inline error, not a per-field one"; `LoginScreen.test.tsx` "keeps SignInForm visible with the serverError rendered on a credentials rejection" |
| FR-005 | Network-level failure shown distinctly, reusing `NETWORK_SIGN_IN_ERROR_MESSAGE` | `LoginScreen.test.tsx` "renders a network-failure error distinctly from a credentials error" |
| FR-006 | No hardcoded post-login destination; neutral "signing you in" state; never navigates | `LoginScreen.test.tsx` "replaces SignInForm with the neutral 'Signing you in…' view... and navigates nowhere" (asserts mocked `replace`/`push` never called) |
| FR-010 | Real a11y label + ≥44×44 tap target on every interactive element | Every `Pressable`/`Link`/`TextInput` in `SignInForm.tsx` carries `accessibilityLabel` + `minHeight: 44`(`/minWidth: 44`); full a11y pass is T017 (Polish), not re-litigated per-component here — reasonable per tasks.md's own phasing |

All FRs T003/T004 claim (`*(FR-001, FR-003, FR-004, FR-010)*` and `*(FR-001, FR-006)*` per
tasks.md) are traced by a test. Traceability satisfied for this batch.

## tasks.md checklist status (Phase 3, T003–T004 only)

- [X] T003 — `SignInForm.tsx` created: email+password via RHF+`zodResolver(signInSchema)`,
  `FormField` wrapper, `serverError` as one general banner, `onForgotPassword` prop (local
  state trigger), `<Link href="/register">`. Test file covers all 5 listed cases. **Matches diff.**
- [X] T004 — `LoginScreen.tsx` created: `mode` state (only `"sign-in"` renders real UI),
  `signIn: SignInWithPassword` prop, `signInSucceeded` flag + neutral "Signing you in…" view on
  success, no navigation call, `serverError` kept on `SignInForm` on failure. Test file covers
  all 3 listed cases. **Matches diff.**
- T005 onward correctly remain `[ ]` — untouched, as expected for this batch.

## CHECKPOINTS.md walkthrough (C1–C6, as relevant to this batch)

- **C1**: `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` exist [x].
  `docs/verification.md`/`docs/conventions.md` exist [x]. Constitution exists/current [x].
  `./init.sh` not re-run in full this batch (by design, T020's job); `tsc --noEmit` and the
  relevant/full Jest suites independently re-run below and pass [x].
- **C2**: Exactly one feature (`005-login`) `in_progress` in `feature_list.json` [x].
  `progress/current.md` describes only the active session, next step correctly points at Batch
  B (T003/T004), consistent with this diff [x]. 001/004 (`done`) unaffected [x].
- **C3**: `src/domain` untouched this batch (N/A, still zero RN imports from prior batch) [x].
  New UI components (`SignInForm.tsx`, `LoginScreen.tsx`) call into `src/domain/schemas.ts`
  (`signInSchema`) and accept `SignInWithPassword` via DI rather than embedding fetch/validation
  logic inline — no `supabase.auth.*` call anywhere in either file, confirmed by direct read [x].
  No platform-specific code introduced (no `.ios/.android/.web` needed, matches plan.md) [x]. No
  direct DB/Postgres/Supabase-table access — `LoginScreen` only calls the injected `signIn`
  function, never touches a client directly [x]. No new global state library [x]. No stray
  `console.log`/context-free `TODO` — independently grepped, zero hits in all four new files [x].
- **C4**: Every exported function/component in this diff has a covering test —
  `SignInForm`/`LoginScreen` each have dedicated `.test.tsx` files asserting on rendered output
  (roles, text, testIDs), not internal state [x]. `./init.sh`'s three-target build check
  correctly deferred to T020 [ ] (conditional/deferred, not a defect for a mid-feature batch).
- **C5**: No suspicious untracked files beyond the four expected new component/test files [x].
  `progress/history.md` entry for a closed session N/A (feature still open) [ ] (not applicable
  yet).
- **C6**: `specs/005-login/` has `spec.md`+`plan.md`+`tasks.md` [x]. No open
  `[NEEDS CLARIFICATION]` markers [x]. Feature not `done` yet, "all tasks.md items `[X]`" N/A [x].
  FR-001/FR-003/FR-004/FR-005/FR-006/FR-010 (the FRs in scope this batch) are each covered by a
  test referencing/exercising them [x].

No C1–C6 box relevant to this batch is empty in a way that blocks approval; the two deferred
items (full three-target build, session-close history entry) are explicitly out of scope for a
mid-feature batch per tasks.md's own T020 sequencing, consistent with the T001/T002 review's
precedent.

## Independent verification (re-run, not trusted from `progress/impl_005-login.md`)

```
node_modules/.bin/tsc --noEmit
```
Clean, no output, exit 0.

```
npx jest src/features/identity/SignInForm.test.tsx src/features/identity/LoginScreen.test.tsx
```
```
PASS src/features/identity/LoginScreen.test.tsx
PASS src/features/identity/SignInForm.test.tsx

Test Suites: 2 passed, 2 total
Tests:       8 passed, 8 total
```

```
npx jest   (full repo suite)
```
```
Test Suites: 40 passed, 40 total
Tests:       252 passed, 252 total
```
No regression anywhere else in the tree.

## Specific checks requested

1. **`SignInForm.tsx` follows `RegistrationForm.tsx`'s conventions.** Confirmed by direct
   side-by-side read: identical `FormField` usage, identical `Controller`/`TextInput` shape,
   identical `styles` object shape (`container`/`title`/`generalError`/`input`/`button`/
   `buttonDisabled`/`buttonText`, same values — `maxWidth: 420`, `minHeight: 44`, same color
   palette `#111827`/`#d1d5db`/`#dc2626`). No new visual language invented. One deliberate,
   documented deviation: `autoComplete="password"`/`textContentType="password"` instead of
   `RegistrationForm`'s `"password-new"` — correct per spec.md's Platform notes (a returning
   user's password already exists).

2. **`serverError` renders as ONE general inline error, never per-field.** Confirmed:
   `SignInForm.tsx`'s `serverError` prop is rendered directly as a single `<Text
   testID="sign-in-form-error">` banner (lines 59–63) — never passed to `setError()` for a
   specific RHF field, unlike `RegistrationForm.tsx`'s `useEffect`+`setError(serverError.field,
   ...)` pattern. `SignInForm.test.tsx`'s dedicated test explicitly asserts the message does NOT
   appear inside either field's own error slot (`sign-in-email-field`/`sign-in-password-field`).
   Matches FR-004 exactly — correctly does not reuse `RegistrationForm`'s field-attributable
   error shape, which would be wrong here (Supabase never distinguishes wrong-password from
   unregistered-email).

3. **"Forgot password?" calls `onForgotPassword`, never navigates.** Confirmed:
   `SignInForm.tsx`'s `Pressable` (lines 110–120) calls `onForgotPassword` directly, no `href`,
   no `router` import anywhere in the file except the unrelated `<Link>` for "Create account".
   `LoginScreen.tsx` wires `onForgotPassword={() => setMode("request-reset")}` — pure local
   `useState` transition, no route change. Grepped both new files for `useRouter`/`router\.`/
   `Redirect`: zero hits outside comments. Matches Recorded default 2 exactly.

4. **"Create account" is a real `<Link href="/register">`.** Confirmed: `SignInForm.tsx` line
   134, `expo-router`'s `<Link href="/register">`, resolved `href` asserted exactly `/register`
   by `SignInForm.test.tsx`'s dedicated test (via the file's own `expo-router` mock exposing
   `href` as a prop on the rendered `Text`, matching the app's existing `useRouter`-mocking
   pattern for other `app/(auth)/*.test.tsx` files).

5. **`LoginScreen.tsx` only handles `"sign-in"` mode; never navigates on success.** Confirmed:
   `mode !== "sign-in"` renders `null` (a deliberate, disclosed placeholder per
   `progress/impl_005-login.md`'s "Deviations" note — reasonable, since nothing in this batch's
   `SignInForm` can reach `"request-reset"` in a way a user could act on yet, and T013 explicitly
   owns building that view). Grepped `LoginScreen.tsx` directly for `useRouter`/`router\.`/
   `Redirect`/`Link`: **zero occurrences of any kind** — the file does not even import
   `expo-router`, let alone call navigation from it. `signInSucceeded` is set, `setIsSubmitting`
   is reset in a `finally`, and the neutral `testID="login-signing-in"` "Signing you in…" view
   renders in place of `SignInForm`. `LoginScreen.test.tsx`'s first test independently mocks
   `useRouter` (returning `mockReplace`/`mockPush`) specifically as a regression guard and
   asserts both are never called after a successful sign-in — read the actual assertion, not
   just the pass/fail: `expect(mockReplace).not.toHaveBeenCalled(); expect(mockPush).not
   .toHaveBeenCalled();` (lines 63–64) — a real, meaningful regression guard, not a vacuous check
   (the mock exists and would be called by a mis-implementation reaching for `useRouter()`
   itself, but since `LoginScreen.tsx` never imports `useRouter` at all, this guard is currently
   more defensive than strictly necessary — no defect, just noted as maximally safe). Matches
   FR-006 exactly.

6. **On error, `SignInForm` stays visible with `serverError` set; network vs. credentials errors
   render distinctly.** Confirmed: `LoginScreen.tsx`'s `handleSubmit` sets `serverError` and
   `return`s early (keeping `mode === "sign-in"` and `signInSucceeded === false`, so `SignInForm`
   remains rendered) on any `{ error }` result. `LoginScreen.test.tsx` has two separate tests —
   one for a credentials rejection (`"Invalid login credentials"`) and one for
   `NETWORK_SIGN_IN_ERROR_MESSAGE` (imported from the real `src/lib/supabase-client.ts`, with
   `@supabase/supabase-js` mocked to avoid the module-level `createClient()` WebSocket issue) —
   and the network test explicitly asserts `NETWORK_SIGN_IN_ERROR_MESSAGE !== "Invalid login
   credentials"`, proving the two are genuinely distinct strings, not just distinctly-rendered
   duplicates. Matches FR-005.

7. **`SignInWithPassword`/`submitSignIn` (T002) reused, not reimplemented.** Confirmed:
   `LoginScreen.tsx` imports `type { SignInWithPassword } from "@/domain/login"` for its prop
   type and calls the injected `signIn(input.email, input.password)` directly — it does not
   import or call `submitSignIn` at this layer, which is correct and intentional: `SignInForm`
   already ran `zodResolver(signInSchema)` client-side before `onSubmit` fires, so a second
   `signInSchema.parse` via `submitSignIn` at the `LoginScreen` layer would be redundant
   duplicate validation of already-validated data — `submitSignIn` remains the seam `app/(auth)/
   login.tsx` (T005) will actually use when wiring the real `signInWithPassword` implementation,
   per `plan.md`'s Project Structure note that `app/(auth)/login.tsx` is what calls
   `submitSignIn`. No second sign-in code path was introduced; no `supabase.auth.*` call
   anywhere in either new file.

## Findings

None blocking. One nit (already self-disclosed by the implementer in
`progress/impl_005-login.md`'s "Deviations" section, not hidden): `LoginScreen.tsx` renders
`null` for `mode !== "sign-in"` rather than continuing to show `SignInForm` — harmless
placeholder scaffolding for T013, unreachable in this batch's shipped surface (T005's route
glue doesn't exist yet), and explicitly flagged for `code-reviewer`'s attention by name. No
objection — T013 correctly owns replacing this `null` with the real `"request-reset"` view.

## Verdict

**APPROVE**

T003 and T004 are implemented exactly as specified in `tasks.md`. `SignInForm.tsx` faithfully
follows `RegistrationForm.tsx`'s established visual/form conventions with no new pattern
invented; `serverError` renders as a single general inline error, never per-field (FR-004);
"Forgot password?" is local view-state only, never navigates (Recorded default 2); "Create
account" is a real `<Link href="/register">` with the correct resolved href (FR-003);
`LoginScreen.tsx` handles only `"sign-in"` mode, never imports or calls `useRouter`/`router.*`/
`Redirect` anywhere, and the test suite's navigation-safety assertions are real and meaningful,
not vacuous. `submitSignIn`/`SignInWithPassword` (T002) are correctly available as the seam for
T005 rather than being reimplemented or bypassed. Type-check and the full 252-test suite pass
independently. Diff scope is exactly T003/T004 plus the already-approved T001/T002 files
(untouched) — nothing else changed.

---

# Code Review: 005-login — T005

**Reviewed**: 2026-08-05
**Scope**: working-tree diff limited to `app/(auth)/login.tsx` and `app/(auth)/login.test.tsx`
(new), per `tasks.md` Phase 3 (User Story 1: T005 only). Explicit confirmation requested that
`src/lib/supabase-client.ts` was NOT touched.

## Diff scope check

`git status --porcelain`:
```
 M feature_list.json
 M progress/current.md
 M src/domain/schemas.test.ts
 M src/domain/schemas.ts
?? app/(auth)/login.test.tsx
?? app/(auth)/login.tsx
?? progress/impl_005-login.md
?? progress/review_005-login.md
?? specs/005-login/
?? src/domain/login.test.ts
?? src/domain/login.ts
?? src/features/identity/LoginScreen.test.tsx
?? src/features/identity/LoginScreen.tsx
?? src/features/identity/SignInForm.test.tsx
?? src/features/identity/SignInForm.tsx
```
Everything except `app/(auth)/login.tsx` and `app/(auth)/login.test.tsx` was already reviewed
and APPROVED in this file's T001/T002 and T003/T004 entries above (re-confirmed unchanged again
this batch by direct read). This batch's only new files are exactly the two T005 names it should
be. **No scope creep.**

`git diff -- src/lib/supabase-client.ts` → empty output, and the file does not appear in
`git status --porcelain` at all → **byte-for-byte unchanged**, confirmed explicitly, not
inferred. `signInWithPassword`'s exact T034 MUST-NEVER-THROW implementation
(`try { const { error } = await supabase.auth.signInWithPassword({ email, password }); return
{ error: error?.message ?? null }; } catch { return { error: NETWORK_SIGN_IN_ERROR_MESSAGE }; }`)
is imported unmodified by `login.tsx`.

## `app/(auth)/login.tsx` — thin glue only (Constitution IV)

```ts
export default function LoginRoute() {
  return (
    <LoginScreen
      signIn={(email, password) => submitSignIn(signInWithPassword, { email, password })}
    />
  );
}
```
19 lines total, no local state, no validation, no network call written inline, no `useRouter`
import at all. It wires three already-reviewed pieces together: the real `signInWithPassword`
(`src/lib/supabase-client.ts`, unchanged), `submitSignIn` (`src/domain/login.ts`, T002,
unchanged this batch), and `LoginScreen`'s `signIn` prop (T004, unchanged this batch). This is
strictly thinner than the sibling `app/(auth)/register.tsx` (which legitimately owns
`sessionIssue`/retry-sign-in local state per its own FR-006 session-establishment-failure UX) —
appropriately so, since T005's job is exactly this seam and nothing else. Matches the sibling's
established DI pattern (import the real `src/lib` primitive, pass it through a `src/domain`
orchestration function, wire the result into a `src/features/identity` component prop) exactly.

## FR-006 regression guard — verified at the outermost layer, not vacuous

Grepped `app/(auth)/login.tsx`, `src/features/identity/LoginScreen.tsx`, and
`src/features/identity/SignInForm.tsx` for `useRouter`, `router\.push`, `router\.replace`,
`Redirect`: zero real occurrences (only explanatory comments matched, e.g. "never calls
useRouter()"). No file in the actual render tree this test exercises imports or calls
`useRouter()` at all.

`login.test.tsx` mocks `expo-router` with a real `useRouter: () => ({ replace: mockReplace,
push: mockPush })` factory and asserts, on both the success and the error case:
```ts
expect(mockReplace).not.toHaveBeenCalled();
expect(mockPush).not.toHaveBeenCalled();
```
Confirmed this is a genuine, non-vacuous guard, not merely "the mock was never invoked because
nothing calls it anyway": the mock is wired exactly the way a regression (e.g. someone later
adding `const router = useRouter(); router.replace("/")` to `LoginScreen.tsx` on success) would
be caught by — `useRouter()` would resolve to this mock (since `expo-router` is mocked at the
module level for this test file, the only source of a router the component tree could reach),
and `replace`/`push` would then show a call. The assertion targets the actual mocked function a
regression would call, not a proxy/spy on something structurally disconnected from the render
tree. This holds "all the way to the outermost screen-glue layer" as requested — the test
renders the real `LoginRoute` → `LoginScreen` → `SignInForm` chain with only the SDK boundary
(`@supabase/supabase-js`) and `expo-router` mocked, everything else real and unmocked.

## Real `signInWithPassword` call-chain verified, not just DI pass-through

Unlike `register.test.tsx` (which mocks `src/lib/supabase-client` to a bare identity string,
sufficient since it only needs to prove the DI seam is threaded through), `login.test.tsx`
mocks only the underlying `"@supabase/supabase-js"` module's `createClient().auth
.signInWithPassword`, leaving `src/lib/supabase-client.ts`, `src/domain/login.ts`,
`LoginScreen.tsx`, and `SignInForm.tsx` all real. Test 1 asserts:
```ts
expect(mockSignInWithPassword).toHaveBeenCalledWith({
  email: "ana@example.com",
  password: "supersecret1",
});
```
This is the real SDK call shape `signInWithPassword()` constructs (`supabase.auth
.signInWithPassword({ email, password })`), confirmed by direct read of the unchanged
`src/lib/supabase-client.ts:99`. This genuinely exercises `SignInForm` (RHF+Zod client
validation) → `LoginScreen.handleSubmit` → `login.tsx`'s closure → `submitSignIn` (re-parses
`signInSchema`) → the real `signInWithPassword` → the mocked SDK boundary — the full stack, not
a stubbed shortcut. Matches FR-001 ("this feature MUST NOT introduce a second sign-in code
path") directly.

## SDK-rejected submission surfaces inline correctly

Test 2 resolves the mocked SDK call with `{ data: {}, error: { message: "Invalid login
credentials" } }` — the real shape `supabase.auth.signInWithPassword` returns for an
auth-level rejection. `signInWithPassword()`'s unchanged `error: error?.message ?? null`
maps this to `{ error: "Invalid login credentials" }`, which `LoginScreen.handleSubmit` sets as
`serverError` (keeping `SignInForm` mounted, per T004's unchanged logic), which `SignInForm`
renders as the one general `testID="sign-in-form-error"` banner (FR-004). Test asserts both the
testID and the exact text render, and that navigation still never fires. Correct, and correctly
distinct in mechanism from the credentials-rejection path already covered by
`LoginScreen.test.tsx`'s network-vs-credentials distinction (FR-005) from the prior batch — this
batch's second case additionally proves that mapping survives at the real-SDK call boundary.

## Traceability table

| FR | Requirement | Test(s) |
|---|---|---|
| FR-001 | Sign-in reuses the real `signInWithPassword()` unchanged, no second sign-in code path | `app/(auth)/login.test.tsx` → "calls the real signInWithPassword with the exact submitted email/password and never navigates" |
| FR-006 | Screen never itself decides/hardcodes a post-login destination | `app/(auth)/login.test.tsx` → both cases assert `router.replace`/`router.push` never called |

(FR-004's inline-error rendering is additionally exercised end-to-end by this batch's second
test, though FR-004 was already traced in the T003/T004 review entry above at the component
level.) Both FRs T005 claims (`*(FR-001, FR-006)*` per tasks.md) are traced by a test that
survives to the real-implementation call boundary. Traceability satisfied.

## tasks.md checklist status (Phase 3, T005 only)

- [X] T005 — `app/(auth)/login.tsx` created: thin screen glue wiring the real
  `signInWithPassword` through `submitSignIn` into `LoginScreen`'s `signIn` prop.
  `login.test.tsx` covers both listed assertions (successful submission reaches the real SDK
  call with exact args and never navigates; SDK-rejected submission surfaces the mapped error
  inline). **Matches diff.**
- T006 onward correctly remain `[ ]` — untouched, as expected for this batch (`useKycGate.ts`
  confirmed not in the diff; `/login` is a real route but not yet the gate's default target).

## CHECKPOINTS.md walkthrough (C1–C6, as relevant to this batch)

- **C1**: `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` exist [x].
  `docs/verification.md`/`docs/conventions.md` exist [x]. Constitution exists/current [x].
  `./init.sh` not re-run in full this batch (by design, T020's job); `tsc --noEmit` and the
  relevant/full Jest suites independently re-run below and pass [x].
- **C2**: Exactly one feature (`005-login`) `in_progress` in `feature_list.json` [x].
  `progress/current.md` describes only the active session (its own "Next step" line still says
  "delegate T005," one step behind this review — orchestrator/task-implementer bookkeeping to
  update after this review lands, not a defect in the code diff itself) [x]. 001/004 (`done`)
  unaffected [x].
- **C3**: No new `src/domain` file this batch (N/A). `app/(auth)/login.tsx` calls into
  `src/domain/login.ts`/`src/lib/supabase-client.ts` rather than embedding any fetch/validation
  logic inline — confirmed by direct read, 19-line file with zero business logic [x]. No
  platform-specific code introduced [x]. No direct DB/Postgres/Supabase-table access — only the
  existing `signInWithPassword()` wrapper is called [x]. No new global state library [x]. No
  stray `console.log`/context-free `TODO` — grepped, zero hits in both new files [x].
- **C4**: New screen (`login.tsx`) has a component test using RNTL asserting on rendered output
  (testIDs, exact call args) and real behavior, not internal state [x]. `./init.sh`'s
  three-target build check correctly deferred to T020 [ ] (conditional/deferred, not a defect
  for a mid-feature batch, consistent with prior batches' precedent).
- **C5**: No suspicious untracked files beyond the two expected new files (plus this review file
  and `progress/impl_005-login.md`, both expected session artifacts) [x]. `progress/history.md`
  entry for a closed session N/A (feature still open) [ ] (not applicable yet).
- **C6**: `specs/005-login/` has `spec.md`+`plan.md`+`tasks.md` [x]. No open
  `[NEEDS CLARIFICATION]` markers [x]. Feature not `done` yet, "all tasks.md items `[X]`" N/A
  [x]. FR-001/FR-006 (this batch's FRs) are each covered by a test referencing/exercising them
  at the real-implementation call boundary [x].

No C1–C6 box relevant to this batch is empty in a way that blocks approval; the two deferred
items (full three-target build, session-close history entry) are explicitly out of scope for a
mid-feature batch, consistent with the T001/T002 and T003/T004 reviews' precedent.

## Independent verification (re-run myself, not trusted from `progress/impl_005-login.md`)

```
node_modules/.bin/tsc --noEmit
```
Clean, no output, exit 0.

```
npx jest login.test.tsx
```
```
PASS app/(auth)/login.test.tsx
  LoginRoute
    ✓ calls the real signInWithPassword with the exact submitted email/password and never navigates (106 ms)
    ✓ surfaces an SDK-rejected submission's mapped error inline (56 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

```
npx jest   (full repo suite)
```
```
Test Suites: 41 passed, 41 total
Tests:       254 passed, 254 total
```
No regression anywhere else in the tree. (One pre-existing, unrelated `act()`/React Query
async-cleanup console warning appears in the full-suite run's stderr — traced to an existing
suite unrelated to this batch's files, does not fail any test, not introduced by this diff.)

## Findings

None. No blocking or nit-level issues found in this batch's diff.

## Verdict

**APPROVE**

T005 is implemented exactly as specified in `tasks.md`: `app/(auth)/login.tsx` is genuinely thin
screen glue (Constitution Principle IV) with zero business/validation logic, wiring the real,
byte-for-byte-unchanged `signInWithPassword` (`src/lib/supabase-client.ts`, explicitly diffed
and confirmed untouched) through `submitSignIn` (`src/domain/login.ts`, T002) into
`LoginScreen`'s `signIn` prop (T004) — matching `app/(auth)/register.tsx`'s established
screen-glue/DI pattern. `login.test.tsx`'s regression guard for FR-006 is real and meaningful:
`expo-router`'s `useRouter` is genuinely mocked at the module boundary the render tree would
reach, and a direct grep of all three files in the render chain (`login.tsx`, `LoginScreen.tsx`,
`SignInForm.tsx`) confirms zero actual `useRouter`/`router.replace`/`router.push`/`Redirect`
usage anywhere — not just that the test's mock happened to go unexercised. The test exercises
the real `signInWithPassword` call chain (only `@supabase/supabase-js` mocked) and asserts the
exact submitted credentials reach it, and an SDK-rejected submission's mapped error renders
inline via the correct `sign-in-form-error` testID. Type-check and the full 254-test suite pass
independently, matching the implementer's own report. Diff scope is exactly the two named T005
files plus the already-approved T001–T004 files (untouched) — nothing else changed.

---

# Review: T006 — `KYC_ROUTE_TARGETS.unauthenticated` "/register" → "/login"

**Date**: 2026-08-05
**Scope**: `specs/005-login/tasks.md` T006 only — the single, human-approved, deliberate
exception to `004-home-scan-shell`'s "zero diff to `001-registration-kyc`'s KYC gate" hard
constraint. `005-login` is the only feature permitted to touch the gate, and only in this one
way. Reviewed at maximum scrutiny per the task's own framing and the orchestrator's explicit
instruction.

## 1. The diff, verified directly

```
git diff -- src/features/identity/useKycGate.ts src/domain/kyc-gate.ts app/_layout.tsx
```

Result:

```diff
diff --git a/src/features/identity/useKycGate.ts b/src/features/identity/useKycGate.ts
index 27db9ac..899d97f 100644
--- a/src/features/identity/useKycGate.ts
+++ b/src/features/identity/useKycGate.ts
@@ -74,7 +74,7 @@ const UNKNOWN_GATE_USER: GateUser = {
 export const KYC_ROUTE_TARGETS: Record<Exclude<KycRoute, "main">, string> = {
-  unauthenticated: "/register",
+  unauthenticated: "/login",
   "verify-phone": "/verify-phone",
   profile: "/profile",
   "kyc-status": "/kyc-status",
```

`src/domain/kyc-gate.ts` and `app/_layout.tsx` both produced **empty diff output** — confirmed
byte-for-byte unchanged. Independently re-verified (not trusting `progress/impl_005-login.md`
Run 4's claim) by running the same `git diff` commands myself against the working tree.

Checklist against the orchestrator's four required checks:

1. Exactly one line changed, exactly one file (`useKycGate.ts`), exactly that mapping — **CONFIRMED**.
2. `src/domain/kyc-gate.ts`'s `resolveKycRoute()` branch logic byte-for-byte unchanged — **CONFIRMED** (empty diff).
3. `app/_layout.tsx`'s `KycGate` component byte-for-byte unchanged — **CONFIRMED** (empty diff).
4. No other `KYC_ROUTE_TARGETS` entry changed (`verify-phone`, `profile`, `kyc-status`, `tutorial`
   all read identically before/after) — **CONFIRMED** by reading the full object literal in the
   working tree.

## 2. No other file touched under cover of this task

Broader `git status`/`git diff` shows other modified/untracked files on this branch
(`feature_list.json`, `progress/current.md`, `src/domain/schemas.ts`/`schemas.test.ts`,
`app/(auth)/login.{tsx,test.tsx}`, `src/domain/login.{ts,test.ts}`,
`src/features/identity/{LoginScreen,SignInForm}.{tsx,test.tsx}`) — all of these belong to
earlier, already-reviewed tasks in this same feature (T001–T005, each with its own APPROVE
entry above in this file), not to T006. `progress/impl_005-login.md` Run 4's "Files changed"
section names only `useKycGate.ts`, matching what `git diff` actually shows for this task. No
evidence of scope creep.

## 3. Independent test re-run (not trusting the implementer's report)

```
npx jest src/features/identity/useKycGate.test.ts src/domain/kyc-gate.test.ts
```
```
PASS src/domain/kyc-gate.test.ts
PASS src/features/identity/useKycGate.test.ts
Test Suites: 2 passed, 2 total
Tests:       27 passed, 27 total
```
Both suites ran **unmodified** (confirmed via `git status` — neither test file appears as
changed) and pass. This matches tasks.md's own prediction: both suites assert the abstract
`KycRoute` value `"unauthenticated"`, never the literal URL string, so the redirect-target
literal change is invisible to them — expected, not a gap in itself (see Finding 1 below for
the one real gap this creates).

Full suite:
```
npx jest
Test Suites: 41 passed, 41 total
Tests:       254 passed, 254 total
```
254/254 green — this single mapping is read indirectly by every other test that exercises what
a signed-out user sees (e.g. any test asserting `route === "unauthenticated"` upstream of
`KYC_ROUTE_TARGETS`), and none broke.

Type-check:
```
node_modules/.bin/tsc --noEmit
```
Clean, exit 0, no output.

Full `./init.sh` (not required at task-granularity, but run anyway for C1's checkpoint and to
independently confirm the implementer's Run 4 claims did not overstate coverage):
```
RESULT: SUCCESS (10/10 stages passed)
```
Only pre-existing, non-blocking `expo-doctor`/native-dependency-alignment warnings (identical
to those already recorded as pre-existing in `004-home-scan-shell`'s final review) — not
introduced by this diff.

## 4. Constitution — auth/session boundary assessment (explicit, as required)

- **Principle III (Auth Goes Through the Provider SDK, Not the Backend)**: This change touches
  *only* a routing-destination string used by `app/_layout.tsx`'s `<Redirect>`. It does not add,
  remove, or alter any call into `supabase.auth.*`, any session-persistence logic, or any
  password/session handling of its own — `resolveKycRoute()` (the actual decision logic) and
  `signInWithPassword()` (the actual auth call, in `src/lib/supabase-client.ts`, not part of
  this diff at all) are both untouched. The change is consistent with Principle III: it does
  not introduce a second auth/session code path, hand-rolled or otherwise; it only changes
  *where* an already-existing, already-decided "unauthenticated" outcome is redirected to.
- **Principle II (Backend Is the Source of Truth)**: No backend call is added, removed, or
  rerouted by this change. N/A beyond confirming no violation.
- **Principle IV (Business Logic Stays Portable)**: `KYC_ROUTE_TARGETS` is a plain, non-RN data
  map already living in `src/features/identity/useKycGate.ts` (not `src/domain`) — this is
  consistent with how it was structured before this diff (it's a UI-routing lookup table, not
  business logic/validation/transform, so it correctly does not need to live in `src/domain`);
  this task doesn't change that placement.
- **The specific risk this change exists to manage** (a routing-gate literal being changed in
  isolation from the decision logic that feeds it) is exactly what T006's own design — and this
  review — targeted: `resolveKycRoute()` was independently confirmed unchanged, so the *set of
  conditions* under which a user is routed to "unauthenticated" is provably identical
  before/after; only the URL a user already correctly classified as "unauthenticated" lands on
  has changed. This is a routing-wiring change, not an auth-boundary change, and does not
  violate any auth/session principle.

**Verdict on this axis: consistent with the constitution's auth/session principles.** This is
not merely "the diff looks small" — the mechanism that decides *who* is unauthenticated is
independently confirmed byte-for-byte unchanged, so no new auth-classification behavior was
introduced; only a redirect target string changed.

## 5. `CHECKPOINTS.md` C1–C6 walkthrough

- **C1 — harness complete**
  - [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
  - [x] `docs/verification.md` and `docs/conventions.md` exist.
  - [x] `.specify/memory/constitution.md` exists and is current (v1.0.0, last amended
        2026-08-02).
  - [x] `./init.sh` exits 0 — `RESULT: SUCCESS (10/10 stages passed)`, independently re-run.
- **C2 — state is coherent**
  - [x] Exactly one feature (`005-login`) is `in_progress` in `feature_list.json` — confirmed
        by direct read.
  - [x] `004-home-scan-shell` (`done`) still has its passing tests intact (full suite green);
        `001-registration-kyc` (`done`) likewise (`kyc-gate.test.ts`/`useKycGate.test.ts` both
        pass unmodified).
  - [x] `progress/current.md` describes only the active `005-login` session.
- **C3 — code respects the architecture**
  - [x] `src/domain` has zero React Native/Expo imports — `kyc-gate.ts` untouched, still pure.
  - [x] `KYC_ROUTE_TARGETS` stays a plain lookup table in `src/features/identity`, not embedded
        business logic in a component body.
  - [x] No platform-specific inline conditionals introduced by this one-line change.
  - [x] No direct Postgres/Redis/S3/Supabase-table access introduced — this change touches
        neither the SDK boundary nor the backend API boundary at all.
  - [x] No new global state library.
  - [x] No stray `console.log`/context-free `TODO` introduced.
- **C4 — verification is real**
  - [x] `useKycGate.ts` has no new exported logic requiring a new unit test (it's a data literal
        change) — existing coverage on `resolveKycRoute()`/`useKycGate()` still applies and
        passes unmodified.
  - [x] No new/changed screen in this task — N/A.
  - [x] `./init.sh`'s three build-export stages (web/iOS/Android) all pass; native-dependency
        stage shows only pre-existing warnings, not FAILing.
- **C5 — the session closed well** — not evaluated here (feature is mid-session, not closed);
  N/A at this task-granularity review.
- **C6 — Spec Driven Development**
  - [x] `005-login` has `spec.md` + `plan.md` + `tasks.md`, all present and read fresh for this
        review.
  - [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers (confirmed by direct read; the two
        Clarifications entries are recorded defaults with human sign-off already logged in
        `progress/current.md`, not blocking markers).
  - [ ] N/A — `005-login` is not yet `done` (still `in_progress`), so "every `done` feature has
        all tasks `[X]`" doesn't apply yet. `tasks.md` itself shows T006 marked `[X]`, consistent
        with `progress/impl_005-login.md` Run 4 and this review's own confirmation.
  - **FR-002 traceability — see Finding 1 below.** Not blocking at this task-granularity review,
    but flagged for T007/the final feature-level review.

## Findings

**Finding 1 (nit, not blocking at this task-granularity review — track for T007/final review)**:
No automated test anywhere asserts the literal value `KYC_ROUTE_TARGETS.unauthenticated ===
"/login"`. Both `useKycGate.test.ts` and `kyc-gate.test.ts` (correctly left unmodified per T006's
own instructions) assert only the abstract `KycRoute` value `"unauthenticated"`, never the URL
string that `KYC_ROUTE_TARGETS` maps it to — confirmed by grep. `docs/verification.md` Level 5
requires every `FR-00x` to be referenced by at least one test's description or adjacent comment
once test tooling exists; FR-002 ("App MUST change `KYC_ROUTE_TARGETS.unauthenticated` ... from
`/register` to `/login`") is currently traced only to `tasks.md`'s own annotation and to the
still-pending T007 manual smoke check, not to any executable assertion. A one-line regression
test (e.g. `expect(KYC_ROUTE_TARGETS.unauthenticated).toBe("/login")`) would not have required
touching either of the two named "do not modify" suites and would give this literal a permanent,
automated regression guard beyond a human `git diff` read. Not blocking T006 itself — the task's
own design deliberately traded this off in favor of manual verification (T007, already scheduled
as the very next task) plus this review's own byte-level diff confirmation — but should not be
silently dropped once T007 and the feature-level review happen; if `code-reviewer` reaches the
feature's final review and FR-002 still has zero test-level reference, that is the point at which
it becomes blocking per Level 5's own "mandatory... rejects if a requirement has zero covering
tests" wording.

**Finding 2 (informational, not a defect)**: `useKycGate.test.ts:344`'s comment
(`"unauthenticated" → /register`) is now stale relative to the actual current mapping — a
pre-existing comment from `001-registration-kyc`, not touched by this task (correctly, per its
"do not modify" instruction), and not a test assertion, so it does not affect correctness. Worth
a one-word comment fix (`/register` → `/login`) whenever that file is next touched for an
unrelated reason — not worth touching solely for this.

No other findings. No correctness, architecture, or auth-boundary issues found.

## Verdict

**APPROVE**

T006 does exactly, and only, what it was authorized to do: `KYC_ROUTE_TARGETS.unauthenticated`
changes from `"/register"` to `"/login"`, one line, one file, `resolveKycRoute()`
(`src/domain/kyc-gate.ts`) and `app/_layout.tsx`'s `KycGate` both independently confirmed
byte-for-byte unchanged via empty `git diff` output, and no other `KYC_ROUTE_TARGETS` entry
touched. No other file was modified under cover of this task. Type-check is clean, the two
directly-relevant suites (`useKycGate.test.ts`, `kyc-gate.test.ts`) pass unmodified (27/27), the
full suite passes (254/254), and a full `./init.sh` run independently confirms `RESULT: SUCCESS
(10/10 stages)` — none of this was taken on the implementer's word alone; every check above was
re-run directly. The change is consistent with Constitution Principle III (no new auth/session
code path, hand-rolled or otherwise — purely a redirect-target literal, with the actual
authentication-classification logic proven unchanged) and does not touch Principle II's backend
boundary at all. One non-blocking nit (Finding 1) is recorded for follow-up at T007/the
feature-level review, not a reason to hold up this task.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

---

# Review: Run 5 (FR-002 regression test) + Run 6 / T007 (MVP manual smoke check)

**Date**: 2026-08-05
**Scope**: `progress/impl_005-login.md` Run 5 (a small test-only addition to
`src/features/identity/useKycGate.test.ts`, closing this file's own prior T006 review Finding 1)
and Run 6 (`T007`, the User Story 1 / MVP "STOP and VALIDATE" checkpoint per `tasks.md`'s
Implementation Strategy section). Fresh reads of `specs/005-login/spec.md`, `plan.md`,
`tasks.md`, `.specify/memory/constitution.md`, and `CHECKPOINTS.md` performed for this review
(not assumed from earlier entries in this file).

## 1. Run 5 — the FR-002 regression test

**Diff scope, independently verified** (`git diff -- src/features/identity/useKycGate.ts
src/domain/kyc-gate.ts`): both empty. `git diff -- src/features/identity/useKycGate.test.ts`
shows exactly two changes: (a) `KYC_ROUTE_TARGETS` added to the existing named import from
`./useKycGate`, (b) one new `describe("KYC_ROUTE_TARGETS", ...)` block containing one test:

```ts
it("maps the unauthenticated route to /login (FR-002)", () => {
  expect(KYC_ROUTE_TARGETS.unauthenticated).toBe("/login");
});
```

This genuinely asserts the literal string value, closing exactly the gap this file's own T006
review Finding 1 identified (FR-002's spec.md wording — "App MUST change
`KYC_ROUTE_TARGETS.unauthenticated` ... from `/register` to `/login`" — previously had zero
test-level coverage of the URL string itself; every pre-existing test asserted only the abstract
`KycRoute` value `"unauthenticated"`). `useKycGate.ts` and `kyc-gate.ts` are confirmed
byte-for-byte unchanged (empty `git diff` on both). `git status --porcelain` at the repo root
shows no other file touched by this run beyond what T001–T006 already introduced. Test-file-only,
as required.

**Independent re-run**:
```
node_modules/.bin/tsc --noEmit          → clean, exit 0
npx jest src/features/identity/useKycGate.test.ts → PASS, 19/19 (18 pre-existing + 1 new)
npx jest (full suite)                   → 41 suites / 255 tests, all passing
```
Matches Run 5's own reported counts exactly (254 → 255, one net-new test, zero regressions).

**Verdict on Run 5**: correct, minimal, honest. Closes the traceability gap Finding 1 raised
without touching any production code. FR-002 now has a real test referencing it by ID
(`docs/verification.md` Level 5).

## 2. Run 6 / T007 — the User Story 1 (MVP) manual smoke check

### 2.1 `.env` claim, verified independently

Read `.env` directly:
```
EXPO_PUBLIC_SUPABASE_URL=""
EXPO_PUBLIC_SUPABASE_ANON_KEY=""
```
Confirmed — both are genuinely empty in this sandbox. Run 6's stated gap ("credentials-level and
successful-sign-in scenarios could only be verified at the unit-test level, not live") is not an
invented excuse; `src/lib/supabase-client.ts`'s own module-level fallback (`supabaseUrl =
process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"`) means every real
sign-in attempt in this environment necessarily hits an unreachable placeholder host, not a real
Supabase Auth server — there is no way to exercise real credentials-acceptance or
credentials-rejection behavior here without a live project. Run 6's framing of this gap is
accurate, not understated or overstated: it correctly separates what WAS confirmed live (routing
to `/login` on cold boot; client-side `signInSchema` validation blocking a network call for a
malformed email; a single generic inline error rendering for an unregistered email, traced in the
browser console to a real network failure) from what could only be confirmed at the unit level
(credentials-differentiation between wrong-password and unregistered-email; the successful
sign-in → "Signing you in…" → gate-takes-over sequence).

**Independently verified the unit-level claims, not trusted from the record**:
- `src/features/identity/LoginScreen.test.tsx` — read in full. Three tests genuinely cover: (1) a
  mocked `signIn` resolving `{ error: null }` replaces `SignInForm` with the neutral
  `"login-signing-in"` view and asserts `mockReplace`/`mockPush` were never called (FR-006); (2) a
  credentials-rejection (`{ error: "Invalid login credentials" }`) keeps `SignInForm` visible with
  the error rendered (FR-001/FR-004); (3) `NETWORK_SIGN_IN_ERROR_MESSAGE` renders distinctly from
  a credentials error (FR-005). Re-ran directly: `npx jest src/features/identity/LoginScreen.test.tsx`
  → 3/3 passing.
- `app/(auth)/login.test.tsx` — read in full. Covers the same guarantees one layer down, at the
  real `signInWithPassword`-call boundary (only `@supabase/supabase-js` is mocked, `src/lib/
  supabase-client.ts`/`src/domain/login.ts`/`LoginScreen.tsx`/`SignInForm.tsx` all run for real):
  a successful submission reaches the real `signInWithPassword` with the exact submitted
  email/password and never navigates; an SDK-rejected submission surfaces its mapped error
  inline. Confirmed passing as part of the full-suite run (`PASS app/(auth)/login.test.tsx`,
  visible in the `npx jest` output re-run for this review).
- Full suite + type-check + `./init.sh`, all re-run independently for this review:
  `node_modules/.bin/tsc --noEmit` clean; `npx jest` → 41 suites / 255 tests, all green; `./init.sh`
  → `RESULT: SUCCESS (10/10 stages)` (same pre-existing, non-blocking `expo-doctor`/native-dependency
  warnings as every prior batch in this feature, not newly introduced here).

Run 6's account of what the unit tests cover is accurate, not inflated — it does not claim more
than these tests actually assert (e.g., it correctly does not claim the credentials-rejection unit
test proves Supabase's *real* anti-enumeration behavior, only that this screen's own
error-rendering mechanics are proven).

### 2.2 The raw `"Failed to fetch"` vs. `NETWORK_SIGN_IN_ERROR_MESSAGE` discrepancy

Read `src/lib/supabase-client.ts`'s `signInWithPassword` and its T034 doc comment directly. The
wrapper's shape:
```ts
try {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
} catch {
  return { error: NETWORK_SIGN_IN_ERROR_MESSAGE };
}
```
T034's comment asserts supabase-js "*rejects* when the underlying fetch itself fails." Traced this
independently through the installed `@supabase/auth-js` source
(`node_modules/@supabase/auth-js/dist/module/GoTrueClient.js` and `lib/fetch.js`): `_request()`
catches a raw fetch failure and re-throws it wrapped as an `AuthRetryableFetchError` (an `AuthError`
subclass, message taken verbatim from the underlying `TypeError`'s `.message` — i.e. `"Failed to
fetch"` in a browser); `signInWithPassword`'s own outer `catch (error) { if (isAuthError(error))
return this._returnResult(...) }` then **resolves** with that error rather than letting it
propagate as a rejection. In other words: in this installed SDK version, a genuine network-level
failure does not reject the `await supabase.auth.signInWithPassword(...)` call at all — it always
resolves with `{ error }`, so `src/lib/supabase-client.ts`'s own `catch` block (and therefore
`NETWORK_SIGN_IN_ERROR_MESSAGE`) is unreachable for this specific failure mode. This independently
confirms Run 6's diagnosis was correct, not merely plausible.

This is genuinely pre-existing, unmodified behavior: `signInWithPassword` and
`NETWORK_SIGN_IN_ERROR_MESSAGE` are both confirmed byte-for-byte untouched by this feature (no
`git diff` anywhere in `src/lib/supabase-client.ts` across this entire feature's batches), and the
same gap would reproduce identically in `001-registration-kyc`'s own auto-sign-in-after-registration
call, which shares this exact function. `005-login`'s FR-005 requirement is specifically "reusing
`001`'s existing `NETWORK_SIGN_IN_ERROR_MESSAGE` for the latter rather than a duplicate message" —
a reuse requirement, not a requirement to re-verify or harden the reused implementation's internal
correctness. Run 6's characterization (pre-existing behavior of the reused, unmodified function,
not this feature's defect) is correct and is not something `005-login`'s diff introduces or could
have introduced without touching `supabase-client.ts`, which it deliberately does not.

**Not a blocking finding against `005-login`.** Recorded here as a legitimate latent gap in T034's
own premise (`001-registration-kyc`), worth a follow-up ticket against that feature or a shared
`src/lib` fix (the friendly `NETWORK_SIGN_IN_ERROR_MESSAGE` copy is effectively unreachable for a
real "host unreachable" failure against the current `@supabase/supabase-js` version) — but out of
scope for this feature's own review to require fixing, since it would mean editing a file `005-login`
is explicitly scoped to leave untouched.

### 2.3 iOS Simulator / Android skip

`tasks.md`'s T007 text itself scopes the check to `docs/verification.md` **Level 3**
(`npm run web`) only — it does not itself require simulator coverage. `docs/verification.md`
Level 3's own text carves out exactly this case: "For platform-specific behavior... also check the
relevant simulator/device" — and this feature's `spec.md`/`plan.md` state, repeatedly and
explicitly, that User Story 1 and User Story 2 are "Identical across iOS, Android, and web" with
no platform-specific code path anywhere in the feature (confirmed independently: no
`.ios.tsx`/`.android.tsx`/`.web.tsx` file exists anywhere under this feature's new files). Given
that, web-only coverage is consistent with `docs/verification.md`'s own stated scope for a
feature with zero platform divergence, not a shortcut taken against its rules.

The disclosed tooling failure (Xcode installed but not `xcode-select`-configured, requiring `sudo`
this session cannot run) is a genuine, disclosed environmental blocker, not a silent skip — Run 6
states plainly what was attempted, what failed, and why no fallback was used. This is consistent
with this repo's own "green tests, broken app" verification culture (explicitly cited in Run 6):
the gap is named, not hidden.

**Judgment**: this does not block Phase 3 (User Story 1 / MVP)'s checkpoint. It should, however,
still be picked up before `005-login` is marked `done` — `plan.md`'s own Quickstart Validation step
8 calls for an iOS/Android repeat of the full flow, and Phase 6's T017/T018 (accessibility/
responsive pass) and T020 (final `./init.sh`) are the natural place for that to happen once Xcode
is configured on this machine (or a different environment can run it) — not something this
specific run needed to solve.

### 2.4 Minor documentation gap (nit, not blocking)

`progress/current.md`'s "Next step" section still reads "Batch E: delegate T007..." — stale as of
this review; it was not updated after Run 5 (FR-002 regression test) or Run 6 (T007 itself,
completed). `CHECKPOINTS.md` C2's "`progress/current.md` describes only the active session" is
satisfied in the sense that no *foreign*/already-closed-feature content is present, but the file
understates progress actually made. Not blocking this checkpoint (the feature remains
`in_progress`, mid-session), but should be refreshed before the next batch (Phase 4, T008+) is
handed off, so a future reader isn't misled about how far Phase 3 actually got.

## 3. `tasks.md` checklist status (through this batch)

- [X] T001–T007 all marked `[X]`, matching the working tree and independently re-run tests.
- Phase 4 (T008–T015, User Story 2) and Phase 5 (T016, User Story 3) and Phase 6 (T017–T020)
  remain `[ ]` — correctly not started yet, consistent with `feature_list.json`'s `in_progress`
  status and `progress/current.md`'s "Next step" (once refreshed, per 2.4 above).

## 4. `CHECKPOINTS.md` C1–C6 walkthrough (as relevant to this batch)

- **C1 — harness complete**
  - [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
  - [x] `docs/verification.md` and `docs/conventions.md` exist.
  - [x] `.specify/memory/constitution.md` exists and is current (v1.0.0).
  - [x] `./init.sh` exits 0 — `RESULT: SUCCESS (10/10 stages)`, independently re-run for this
        review.
- **C2 — state is coherent**
  - [x] Exactly one feature (`005-login`) is `in_progress` in `feature_list.json`.
  - [x] `001-registration-kyc` and `004-home-scan-shell` (both `done`) still have their tests
        passing (full suite green, 41/41 suites).
  - [ ] `progress/current.md` describes the active session but is stale (see 2.4) — not
        blocking at this task-granularity, but flagged for refresh before the next batch.
- **C3 — code respects the architecture**
  - [x] `src/domain` has zero React Native/Expo imports — unaffected by either run reviewed here.
  - [x] Run 5 touches only a test file; Run 6 (T007) is a manual check, no production diff at all.
  - [x] No platform-specific inline conditionals introduced.
  - [x] No direct Postgres/Redis/S3/Supabase-table access — the SDK boundary (`supabase-client.ts`)
        is untouched by both runs.
  - [x] No new global state library.
  - [x] No stray `console.log`/context-free `TODO` introduced by either run.
- **C4 — verification is real**
  - [x] `KYC_ROUTE_TARGETS.unauthenticated`'s literal value now has a real, passing unit test
        (Run 5), closing the prior review's Finding 1.
  - [x] `LoginScreen.test.tsx`/`app/(auth)/login.test.tsx` (both pre-existing, re-verified here,
        not new this batch) assert real rendered output/behavior, not implementation details.
  - [x] `./init.sh`'s three build-export stages (web/iOS/Android) all pass; native-dependency
        stage shows only pre-existing, non-blocking warnings.
- **C5 — the session closed well** — N/A at this task-granularity; the feature/session is not
  closing yet (Phase 4 remains).
- **C6 — Spec Driven Development**
  - [x] `005-login` has `spec.md` + `plan.md` + `tasks.md`, all present, re-read fresh for this
        review.
  - [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers.
  - [ ] N/A — not yet `done`; `tasks.md` correctly shows T001–T007 `[X]`, T008 onward `[ ]`.
  - [x] FR-002 traceability gap (the prior review's Finding 1) is now closed by Run 5 — every
        `FR-00x` this batch touches (FR-001 through FR-006) has at least one test referencing it
        by ID (confirmed via grep across `LoginScreen.test.tsx`, `app/(auth)/login.test.tsx`,
        `useKycGate.test.ts`, `schemas.test.ts`, `login.test.ts`).

## Findings

**Finding 1 (nit, not blocking)**: `progress/current.md`'s "Next step" section is stale — it still
names "Batch E: delegate T007" even though Run 5 and Run 6/T007 have both since completed. Refresh
before starting Phase 4 (T008+) so the session record accurately reflects where Phase 3 actually
ended.

**Finding 2 (tracked, not blocking `005-login`)**: the raw `"Failed to fetch"` string (rather than
`NETWORK_SIGN_IN_ERROR_MESSAGE`) surfaces for a genuine network-unreachable sign-in attempt in this
environment, independently confirmed to be because the installed `@supabase/auth-js` resolves
(rather than rejects) fetch-level failures as an `AuthRetryableFetchError`, making
`signInWithPassword`'s own `catch` block unreachable for this failure mode. This is pre-existing,
unmodified `001-registration-kyc`/T034 behavior, not introduced by `005-login`'s diff, and out of
this feature's permitted scope to fix (it would mean editing `src/lib/supabase-client.ts` beyond
this feature's additive-only mandate). Recommend a follow-up ticket against `001-registration-kyc`
or a small standalone `src/lib` fix — not a blocker here.

## Verdict

**APPROVE.** Run 5 is a genuine, correctly-scoped, test-file-only regression test that closes the
prior review's Finding 1 exactly as instructed — independently confirmed via `git diff` (zero
production-code diff) and a clean, green re-run of the affected suite and the full suite. Run 6
(T007) is an honest, adequately-documented closing of User Story 1's MVP checkpoint: the disclosed
Supabase-credentials gap is real (independently confirmed by reading `.env`), accurately scoped
(neither overstated nor understated — correctly separates what was verified live from what was
verified only at the unit level, and those unit tests were independently re-read and re-run to
confirm they cover what Run 6 claims), the `"Failed to fetch"` observation is correctly
characterized as pre-existing, unmodified `001` behavior rather than a `005-login` defect
(independently verified by reading the installed SDK's source), and the iOS/Android skip is
consistent with `docs/verification.md`'s own Level 3 carve-out for a feature with zero
platform-specific code paths, with the gap disclosed rather than hidden. Phase 3 (User Story 1 /
MVP) is reasonably considered complete; proceeding to Phase 4 (User Story 2, forgot-password) is
appropriate. One non-blocking documentation nit (Finding 1) and one tracked-but-out-of-scope latent
gap (Finding 2) are recorded above for follow-up, neither of which should hold up this batch.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

---

## Review: T008, T009 (Phase 4, User Story 2 — forgot-password domain foundation)

**Scope reviewed**: `src/domain/schemas.ts` additions (`PASSWORD_RESET_CODE_LENGTH`,
`requestPasswordResetSchema`, `resetPasswordWithCodeSchema`), `src/domain/schemas.test.ts`
additions, new `src/domain/passwordReset.ts`, new `src/domain/passwordReset.test.ts`.

### Out-of-scope confirmation

`git status --porcelain` shows only `feature_list.json`, `progress/current.md`,
`src/domain/schemas.test.ts`, `src/domain/schemas.ts`, `src/features/identity/useKycGate.test.ts`,
`src/features/identity/useKycGate.ts` modified (the last two are T006's pre-existing, already-
reviewed one-line gate change from an earlier batch — untouched by this diff), plus untracked
files from prior batches (T003–T007: `SignInForm.*`, `LoginScreen.*`, `app/(auth)/login.*`,
`src/domain/login.*`) and this batch's two new files (`src/domain/passwordReset.ts`,
`src/domain/passwordReset.test.ts`). **Confirmed: `src/lib/supabase-client.ts` has zero diff**
(not in `git status` output at all) — T010 has genuinely not been started. **Confirmed: no UI
component was touched or added in this batch** (`SignInForm.tsx`/`LoginScreen.tsx` predate this
batch, from T003/T004, already separately reviewed).

### Detailed checks (per the review brief)

1. **`PASSWORD_RESET_CODE_LENGTH = 6`, regex built from the constant, not hardcoded elsewhere.**
   `src/domain/schemas.ts`: `export const PASSWORD_RESET_CODE_LENGTH = 6;` followed by
   `code: z.string().regex(new RegExp(`^\\d{${PASSWORD_RESET_CODE_LENGTH}}$`), "Enter the
   6-digit code")`. Confirmed no second, independently-hardcoded `6` anywhere in the new schema
   code — the only other "6" is in the error-message copy string ("Enter the 6-digit code"),
   which is user-facing text, not a duplicated validation rule. PASS.

2. **`resetPasswordWithCodeSchema.password` reuses `passwordSchema` (T001).** Confirmed:
   `password: passwordSchema` — not a reinvented `z.string().min(8, ...)`. Test
   (`schemas.test.ts`) explicitly asserts the shared message ("Password must be at least 8
   characters") is produced, proving it's genuinely the same schema object, not a
   coincidentally-identical duplicate. PASS.

3. **`requestPasswordResetSchema`'s email rule matches `signInSchema`'s.** Both are literally
   `email: z.string().email("Enter a valid email address")` — byte-for-byte identical rule and
   message (also identical to `resetPasswordWithCodeSchema`'s own `email` field). PASS.

4. **Zero React/React Native imports in `src/domain/passwordReset.ts`.** The file's only import
   is `from "./schemas"` (four named imports: two schemas, two types). No `react`, `react-native`,
   or `expo-*` import anywhere in the file. Constitution Principle IV satisfied. PASS.

5. **DI type shapes.** `RequestPasswordReset = (email: string) => Promise<{ error: string | null
   }>`; `VerifyRecoveryCode = (email: string, code: string) => Promise<{ error: string | null
   }>`; `UpdateRecoveryPassword = (newPassword: string) => Promise<{ error: string | null }>`;
   `DiscardRecoverySession = () => Promise<void>`. All four match tasks.md's T009 spec exactly —
   the first three share the `{ error: string | null }` contract, `DiscardRecoverySession`
   correctly returns `Promise<void>` with no result to report. PASS.

6. **`submitNewPassword` control flow — read line-by-line, not summarized.**
   ```ts
   const parsed = resetPasswordWithCodeSchema.parse(input);
   const { verifyCode, updatePassword, discard } = deps;
   const verifyResult = await verifyCode(parsed.email, parsed.code);
   if (verifyResult.error) {
     await discard();
     return verifyResult;
   }
   try {
     return await updatePassword(parsed.password);
   } finally {
     await discard();
   }
   ```
   - (a) Parses the schema first — a malformed `code`/`email`/`password` throws
     (`ZodError`) before `verifyCode` is ever reached. Confirmed by the
     "rejects an invalid input (malformed code) before verifyCode is ever called" test.
   - (b) Calls `verifyCode(parsed.email, parsed.code)` — parsed values, not raw input, matching
     `requestPasswordReset`'s equivalent parsed-not-raw convention.
   - (c) On `verifyCode` error: `discard()` is called, then `verifyResult` (the error) is
     returned — `updatePassword` is never referenced on this path at all (not even
     conditionally skipped, structurally absent from the `if` branch). Confirmed by the
     "on a verifyCode failure, never calls updatePassword but still calls discard" test
     (`updateCalls` stays `0`, `discardCalls` becomes `1`).
   - (d) On `verifyCode` success: falls through the `if`, calls `updatePassword(parsed.password)`
     inside a `try`, with `discard()` in the paired `finally` — this runs unconditionally
     whether `updatePassword` resolves normally (with either `{ error: null }` or `{ error:
     "<msg>" }`) or throws, and the `try` block's `return await updatePassword(...)` correctly
     propagates `updatePassword`'s own resolved value as `submitNewPassword`'s return value
     (the `finally` block runs after the return value is computed but before the caller
     receives it, standard JS semantics — does not clobber the return). Confirmed by both the
     happy-path test (`discardCalls === 1`, `result` equals `updatePassword`'s `{ error: null
     }`) and the "on an updatePassword failure after a successful verifyCode, still calls
     discard" test (`discardCalls === 1`, `result` equals `updatePassword`'s `{ error: "Could
     not update password" }`).
   This is an exact match to spec.md/plan.md/tasks.md's T009 wording. PASS — no discrepancy
   found between the described control flow and the actual code.

7. **Test coverage of all four `submitNewPassword` branches plus `requestPasswordReset`'s two
   branches.** Confirmed present in `passwordReset.test.ts`:
   - `requestPasswordReset`: "calls request with the parsed email and returns its result
     unchanged" (valid path) + "rejects an invalid email before request is ever called"
     (pre-network rejection, asserts `requestCalled` stays `false`).
   - `submitNewPassword`: "verify -> update -> discard happy path ... calls discard exactly
     once" (asserts `verifyCalls === 1`, `updateCalls === 1`, `discardCalls === 1`, correct
     parsed password forwarded, correct final result); "on a verifyCode failure, never calls
     updatePassword but still calls discard"; "on an updatePassword failure after a successful
     verifyCode, still calls discard"; plus a fifth test ("rejects an invalid input (malformed
     code) before verifyCode is ever called") not explicitly enumerated in the review brief's
     four-branch list but a legitimate fifth branch (schema-rejection) worth having. All five
     assert on genuine behavioral outcomes (call counts, specific returned values), not just
     "didn't throw." PASS, exceeds the minimum requested coverage.

### Requirement traceability (Level 5, `docs/verification.md`)

| FR | Covering test(s) |
|---|---|
| FR-007 (request reset code, anti-enumeration) | `schemas.test.ts` → `describe("requestPasswordResetSchema")` (3 cases); `passwordReset.test.ts` → `describe("requestPasswordReset")` (2 cases) |
| FR-008 (submit code + new password, throwaway-session discard) | `schemas.test.ts` → `describe("resetPasswordWithCodeSchema")` (5 cases); `passwordReset.test.ts` → `describe("submitNewPassword")` (5 cases) |

Both FRs this batch claims (`FR-007`, `FR-008` per tasks.md's T008/T009 entries) have tests
whose adjacent comments explicitly cite the FR number, satisfying Level 5. PASS.

### Independent verification run by this review (not trusting the implementer's claim)

- `node_modules/.bin/tsc --noEmit` → clean, zero output, zero errors.
- `npx jest src/domain/schemas.test.ts src/domain/passwordReset.test.ts` → `2 passed, 2 total`
  suites, `57 passed, 57 total` tests.
- `npx jest` (full suite) → `42 passed, 42 total` suites, `269 passed, 269 total` tests, zero
  failures, zero skips.
- `./init.sh` (full run, no skip flags) → `RESULT: SUCCESS (10/10 stages passed)`. The two
  `WARN` stages (expo-doctor outdated-dependency advisory, native-dependency version drift) are
  pre-existing, non-blocking, and unrelated to this diff — identical wording to what was already
  disclosed and accepted in this feature's T006/T007 review entries above, not a new regression.
- `grep` for `console.log`/`TODO` across the four in-scope files → zero matches.

### CHECKPOINTS.md walkthrough (C1–C6, current repo state)

**C1 — harness complete**
- [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [x] `docs/verification.md` and `docs/conventions.md` exist.
- [x] `.specify/memory/constitution.md` exists and is current (v1.0.0).
- [x] `./init.sh` exits 0 (`RESULT: SUCCESS`, 10/10 — no warning even excepted, both WARNs are
      pre-existing dependency-drift advisories, not test-tooling-missing).

**C2 — state coherent**
- [x] Exactly one feature (`005-login`) is `in_progress` in `feature_list.json`.
- [x] `001`/`004` (`done`) have passing test coverage; `005-login` (`in_progress`) has passing
      tests for every task completed so far, including this batch.
- [x] `progress/current.md` describes only this active session (005-login), no leftover content
      from a prior closed session.

**C3 — architecture respected**
- [x] `src/domain/passwordReset.ts` and `src/domain/schemas.ts` have zero React/RN/Expo imports
      (verified directly, item 4 above).
- [x] No fetch/validation/business-rule logic embedded in a UI component in this diff — this
      batch touches no UI component at all.
- [x] No platform-specific code in this diff (not applicable — pure schema/domain logic).
- [x] No direct Postgres/Redis/S3/Supabase-table access — this diff makes zero network/SDK
      calls of its own; all four Supabase-touching functions are DI-injected, deferred to T010.
- [x] No new global state library.
- [x] No stray `console.log`/context-free `TODO` (grep confirmed).

**C4 — verification real**
- [x] Every exported function in the two new/changed domain files has a covering unit test
      (`requestPasswordReset`, `submitNewPassword`, both new schemas — see traceability table).
- [x] N/A this batch — no new/changed screen (UI component tasks are T011–T014, not yet done).
- [x] `./init.sh`'s three build-export stages (web/iOS/Android) all pass; native-dependency-
      alignment stage WARNs (pre-existing drift, not FAILing).

**C5 — session closed well** *(not evaluated as a closing-checkpoint here — this is a
mid-feature batch review, not a session close; deferred to the final feature-level review)*
- [ ] N/A — feature is still `in_progress`, more tasks remain (T010–T020); this box is not
      expected to be checked yet and is not treated as blocking for this batch.

**C6 — SDD**
- [x] `005-login` (`"sdd": true`, `in_progress`) has `spec.md` + `plan.md` + `tasks.md` under
      `specs/005-login/`.
- [x] `spec.md` has zero open `[NEEDS CLARIFICATION]` markers (confirmed by direct read; the two
      "Recorded default" Clarifications entries are resolved defaults with human sign-off
      recorded in `progress/current.md`, not open markers).
- [ ] N/A — `005-login` is not yet `done`; not all `tasks.md` items are `[X]` yet (T010–T020
      remain), as expected mid-feature. Not treated as blocking for this batch review.
- [x] Both `FR-007` and `FR-008` (the two FRs this batch's tasks serve) are covered by tests
      referencing them explicitly (Level 5 table above).

No blocking gaps found in C1–C4/C6 for the scope actually under review in this batch; the two
`[ ]` boxes above (C5, and the "all tasks.md items `[X]`" sub-item of C6) are structurally
inapplicable to a mid-feature task-pair review and will be re-evaluated at the feature's final
close-out review.

### Findings

None. This batch's diff is a precise, byte-for-byte match to tasks.md's T008/T009 wording — the
regex is genuinely built from the shared constant, the shared `passwordSchema` is genuinely
reused (not re-implemented), the DI type shapes are exact, and `submitNewPassword`'s control
flow — read line-by-line above — implements exactly the "verify → (error: discard, return,
never update) / (success: update, always discard, return update's result)" behavior specified,
with test coverage exercising every branch including the `finally`-based unconditional-discard
guarantee. No scope creep (`src/lib/supabase-client.ts` and every UI component are confirmed
untouched). No constitution violations, no conventions violations, no stray debug artifacts.

### Verdict

**APPROVE.** T008 and T009 are correctly implemented, fully tested, and traceable to their FRs.
Proceed to T010 (`src/lib/supabase-client.ts` — the real throwaway-Supabase-client
implementation that this batch's DI seams are designed to receive).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

---

## Review: T010 — `src/lib/supabase-client.ts` throwaway recovery-client (specs/005-login)

**Reviewed**: 2026-08-05 | **Scope**: `src/lib/supabase-client.ts`
(`requestPasswordReset`, `createPasswordRecoverySession`) and
`src/lib/supabase-client.test.ts`'s extensions, against `specs/005-login/spec.md`
(Clarifications, "Recorded default 2"), `plan.md`'s "Password-reset confirmation" Research
Decision, `tasks.md` T010, `.specify/memory/constitution.md`, and `CHECKPOINTS.md`. This is a
high-sensitivity task: it is the entire mechanism the forgot-password design relies on to keep
`useKycGate()`'s shared-client `<Redirect>` from firing mid-recovery.

### 1. Line-by-line reading of `createPasswordRecoverySession()`

Read `src/lib/supabase-client.ts:143-190` directly (not summarized from the diff). Confirmed:

- `createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false,
  autoRefreshToken: false } })` is called **inside** `createPasswordRecoverySession()`
  (line 148) — a second, independent call to the SDK's `createClient`, distinct from the
  module-level `export const supabase = createClient(...)` at line 51 that
  `useKycGate()`/`api.ts` observe.
- `verifyCode`, `updatePassword`, and `discard` (lines 155-187) close over `recoveryClient`
  only — grepped the whole function body for the identifier `supabase` (the shared export) and
  it does not appear anywhere inside `createPasswordRecoverySession()`'s body. All three calls
  (`recoveryClient.auth.verifyOtp`, `recoveryClient.auth.updateUser`,
  `recoveryClient.auth.signOut`) go through the second client only.
- `persistSession: false, autoRefreshToken: false` are both present, exactly as tasks.md T010
  specifies (line 149-152).
- No memoization: `createPasswordRecoverySession()` is a plain function, not wrapped in
  `useMemo`/module-level caching — every call re-executes `createClient(...)` and produces a
  brand-new closure/object graph. This is correct per plan.md's stated design (`LoginScreen`
  creates one instance per "Forgot password?" press via `useState(() => ...)`, so the function
  itself must not memoize on its own — confirmed the source doesn't).
- MUST-NEVER-THROW shape preserved for all three: `verifyCode`/`updatePassword` wrap their SDK
  call in `try/catch`, mapping a genuine network-level rejection to
  `NETWORK_SIGN_IN_ERROR_MESSAGE` (same constant `signInWithPassword` uses, not a duplicate
  message); `discard` wraps `signOut()` in `try/catch`, swallowing any error since its DI type
  (`DiscardRecoverySession`, `src/domain/passwordReset.ts`) returns `Promise<void>` with
  nothing to report.

### 2. `requestPasswordReset` and the shared singleton

`requestPasswordReset` (lines 120-127) calls `supabase.auth.resetPasswordForEmail(email)` — the
shared, module-level singleton, not the throwaway client. This is **correct**, not an
inconsistency: `resetPasswordForEmail` is fire-and-forget from the caller's point of view (no
session side effect), so there is nothing for `useKycGate()` to react to from this one call —
matches plan.md's "Password-reset request" Research Decision and the in-code comment
(lines 112-119) explaining exactly this distinction. FR-007 is satisfied by this call.

### 3. `signInWithPassword` / `NETWORK_SIGN_IN_ERROR_MESSAGE` — byte-for-byte diff

Ran `git diff -- src/lib/supabase-client.ts` and inspected every `-` line: the only removed line
in the whole hunk is the diff header (`--- a/src/lib/supabase-client.ts`) — there is **zero**
line deleted or modified inside the file body. The diff is purely additive (86 insertions, 0
deletions per `git diff --stat`). `signInWithPassword` (lines 100-110) and
`NETWORK_SIGN_IN_ERROR_MESSAGE` (lines 70-71) are confirmed unchanged, satisfying tasks.md T010's
explicit "UNCHANGED" instruction.

### 4. The isolation test — independently re-derived, not taken on faith

Read `src/lib/supabase-client.test.ts`'s mock factory and the
`"never touches the module-level supabase singleton's mocked auth object"` test in full. The
mock's `mockCreateClient` distinguishes calls via a plain closure boolean (`singletonCreated`,
deliberately *not* derived from `mock.calls.length`, which `afterEach(() =>
jest.clearAllMocks())` resets every test — correctly reasoned in the file's own comments): the
first-ever `createClient()` call (triggered synchronously by `supabase-client.ts`'s own
module-level `export const supabase = createClient(...)` at import time, which Babel's CJS
transform hoists ahead of the test file's own top-level statements) is bound to an auth object
exposing only `signInWithPassword`/`resetPasswordForEmail`; every call after that gets a
**freshly allocated** `{ verifyOtp: jest.fn(), updateUser: jest.fn(), signOut: jest.fn() }`
object pushed onto `recoveryAuthMocks`. This is a structural distinction, not a behavioral
inference: the shared singleton's mock literally has no `verifyOtp`/`updateUser`/`signOut`
method to call.

I did not take the "this proves isolation" claim on faith. I copied `src/lib/supabase-client.ts`
to a scratch backup, mutated `verifyCode` to call `supabase.auth.verifyOtp(...)` (the shared
singleton) instead of `recoveryClient.auth.verifyOtp(...)`, and re-ran
`npx jest src/lib/supabase-client.test.ts` against the sabotaged version:

```
● createPasswordRecoverySession › verifyCode: returns the SDK's own message when the SDK resolves with an auth-level error
    - Expected: {"error": "Token has expired or is invalid"}
    + Received: {"error": "We couldn't reach the sign-in service. Check your connection and try again."}
● createPasswordRecoverySession › never touches the module-level supabase singleton's mocked auth object
    expect(authMock.verifyOtp).toHaveBeenCalledTimes(1)
    Received number of calls: 0
```

3 of 17 tests failed as expected (the call landed on the shared mock, which has no `verifyOtp`,
so it threw internally and was silently caught, mapping to `NETWORK_SIGN_IN_ERROR_MESSAGE` — the
kind of "green tests, broken app" masking this repo has a documented history of, except here the
test genuinely *did* fail). I also reasoned through — and the test structure independently
supports — the harder case of a bug that builds the throwaway client correctly (so the
"instance count increased by 1" assertion alone would pass) but then still calls a shared-client
method for one of the three operations: because the shared mock object structurally lacks
`verifyOtp`/`updateUser`/`signOut`, such a call would either throw (caught, masked as a network
error, and caught by the `toEqual` assertions on the SDK-error-path tests) or fail the
`expect(authMock.<method>).toHaveBeenCalledTimes(1)` assertion (the call never reaches the
distinct, freshly-pushed mock object) — both directions are checked, not just "the shared mock
saw zero calls," which is what rules out a false pass from a bug that just doesn't call
`createClient()` a second time at all, or one that quietly reuses a shared object.

Restored the original file from the scratch backup afterward (`cp` back, confirmed
`git diff --stat` matched the pre-mutation diff exactly) and re-ran the full suite green
(17/17 in this file, 282/282 across the repo). **Conclusion: this is a genuine proof of
isolation, not a weaker assertion that happens to pass.**

Also independently confirmed `"produces a fresh client instance on every call"` rules out
accidental module-level memoization across two separate "Forgot password?" attempts
(`recoveryAuthMocks[before] !== recoveryAuthMocks[before + 1]`).

### 5. DI type match (`src/domain/passwordReset.ts`, T009)

`createPasswordRecoverySession()`'s return type is declared as
`{ verifyCode: VerifyRecoveryCode; updatePassword: UpdateRecoveryPassword; discard:
DiscardRecoverySession }`, importing all three types directly from `../domain/passwordReset`
(no redeclaration) — exact match to T009's DI seam. `VerifyRecoveryCode`/`UpdateRecoveryPassword`
resolve to `Promise<{ error: string | null }>`, `DiscardRecoverySession` to `Promise<void>`; the
implementations match these shapes exactly (`discard` returns `undefined` on both success and
swallowed-error paths, never a `{ error }` object).

### Independent verification run

```
node_modules/.bin/tsc --noEmit          → clean, no output, exit 0
npx jest src/lib/supabase-client.test.ts → 17/17 passed
npx jest (full suite)                    → 42 suites, 282/282 passed
```

Matches `progress/impl_005-login.md`'s own reported numbers exactly — independently
reproduced, not merely trusted.

### Requirement traceability (T010's FRs)

| FR | Test(s) |
|---|---|
| FR-007 (request reset code, no route change, anti-enumeration — app-side SDK call) | `supabase-client.test.ts` → `describe("requestPasswordReset")`, 3 cases (happy/auth-error/network-reject), explicit `FR-007` comments |
| FR-008 (submit code + new password; MUST NOT establish a session visible to the shared/ambient client) | `supabase-client.test.ts` → `describe("createPasswordRecoverySession")`, all cases, especially `"never touches the module-level supabase singleton's mocked auth object"` (the load-bearing regression guard) and `"produces a fresh client instance on every call"`, explicit `FR-008`/"Recorded default 2" comments |

Both FRs traced. Level 5 satisfied for this task's scope.

### `tasks.md` checklist status (T010's context)

- [X] T010 marked done in `specs/005-login/tasks.md` — verified the checkbox and confirmed via
  `grep`/file-existence checks that T011-T020's files (`RequestPasswordResetForm.tsx`,
  `ResetPasswordForm.tsx`, `LoginScreen.tsx` reset-flow modes, `app/(auth)/login.tsx` wiring)
  are genuinely untouched — this task's diff did not silently grow beyond its scope.

### `CHECKPOINTS.md` C1–C6 walkthrough (scoped to what this task's diff affects; feature is
still `in_progress`, most C1/C2/C5 items are evaluated at final feature close, not per-task —
noted where not yet applicable)

- **C1**: `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist — [x].
  `docs/verification.md`/`docs/conventions.md` exist — [x]. `.specify/memory/constitution.md`
  exists, current — [x]. `./init.sh` not re-run in full for this narrow-scope review (out of
  proportion for a single-task review; `tsc`+full `jest` independently re-run instead, both
  clean) — [ ] not evaluated this pass, expected at T020's final `./init.sh` gate.
- **C2**: exactly one feature (`005-login`) `in_progress` in `feature_list.json` — [x]. No
  `done` feature lacks test coverage (001/004 both closed with passing suites per their own
  notes) — [x]. `progress/current.md` describes only the active `005-login` session — [x].
- **C3**: `src/domain` (including `passwordReset.ts`, T009, upstream of this task) has zero RN
  imports — [x] (re-confirmed, this task doesn't touch `src/domain`). This task's own file,
  `src/lib/supabase-client.ts`, is the one file explicitly permitted to hold the RN/Expo
  adapter boundary (Constitution IV) — [x], correctly scoped. No direct
  Postgres/Redis/S3/Supabase-table access anywhere — only the Supabase Auth SDK, exactly per
  Constitution III — [x]. No new global state library — [x]. No stray `console.log`/`TODO` —
  [x] (grepped, none found in the diff).
- **C4**: `src/lib/supabase-client.ts`'s two new exports both have covering unit tests
  (happy/auth-error/network-reject for `requestPasswordReset`; happy/auth-error/network-reject
  ×3 functions + the two regression guards for `createPasswordRecoverySession`) — [x]. No new
  screen/component in this task (T010 is `src/lib` only), so Level 2 component-test requirement
  N/A for this task specifically — [x] not applicable. Full three-target build check not re-run
  this pass (deferred to T020) — [ ] not evaluated this pass, by design (see tasks.md's own
  phase structure).
- **C5**: No suspicious untracked files from this task (`git status` shows only the expected
  `005-login` files) — [x]. `progress/history.md` entry — deferred to session close, N/A mid-
  feature — [ ] not applicable yet. `feature_list.json` accurately reflects `005-login` as
  `in_progress` — [x].
- **C6**: `specs/005-login/{spec.md,plan.md,tasks.md}` all exist — [x]. `spec.md` has zero open
  `[NEEDS CLARIFICATION]` markers (both Clarifications entries are recorded defaults, human-
  confirmed at the approval gate per `progress/current.md`) — [x]. Feature not yet `done`, so
  the "all tasks `[X]`" checkpoint is N/A until final close — [ ] not applicable yet. Every
  `FR-00x` this task touches (FR-007, FR-008) is covered by at least one test referencing it —
  [x], see traceability table above.

No empty box above reflects a defect in this task's own scope — the unchecked items are either
explicitly deferred by tasks.md's own phase structure (T020's final `./init.sh`, T007/T015's
manual smoke checks) or not yet applicable because the feature is mid-implementation, not a gap
introduced by T010.

### Constitution — auth/session principles, addressed explicitly per this review's mandate

**Principle III** ("Auth Goes Through the Provider SDK, Not the Backend... The app never
implements its own password/session logic"): T010 calls only documented, stable
`@supabase/supabase-js` SDK methods (`resetPasswordForEmail`, `verifyOtp`, `updateUser`,
`signOut`, `createClient`) — no custom token handling, no hand-rolled session storage, no
reimplementation of any part of the auth protocol. The "throwaway client" pattern
(`persistSession: false, autoRefreshToken: false`) is a standard, SDK-documented, supported
configuration for exactly this "one-off auth operation, discard afterward" use case — not a
workaround or a reimplementation of anything the SDK already does. **Consistent with Principle
III as implemented.**

**Principle II** (Backend Is the Source of Truth / the auth exception): no `Draw-a-card` backend
call anywhere in this task's diff — grepped for `fetch`/`api.` in the new code, none present.
Matches spec.md's Assumptions ("No backend endpoint of this feature's own") and plan.md's
Constitution Check (PASS, no exception needed).

**On the isolation guarantee specifically**: the entire safety property spec.md's Clarifications
"Recorded default 2" depends on is that the recovery client's session state is genuinely
invisible to the shared `supabase` singleton `useKycGate()` observes. This review's own
independent line-by-line read (Section 1) plus the sabotage-and-restore test (Section 4)
together confirm this is **actually true of the shipped code**, not merely asserted by a
same-object mock that would rubber-stamp a broken implementation. Two independent Supabase JS
client instances constructed via separate `createClient()` calls do not share in-memory auth
state by default (documented SDK behavior, and confirmed here structurally by the mock: the two
instances are backed by entirely separate `auth` objects with non-overlapping method sets in the
test, and separate real `GoTrueClient` instances in the actual SDK, which is exactly why
`persistSession: false` on the second instance is sufficient — there is no shared storage key or
in-memory singleton inside `@supabase/supabase-js` itself that two independently-constructed
clients read from). **The isolation guarantee is proven, not merely assumed.**

### Findings

None blocking. No scope creep, no constitution violations, no conventions violations, no stray
debug artifacts, type-check clean, full suite green (282/282), the one property this task exists
to guarantee independently re-derived and confirmed true (including a deliberate
break-it-and-watch-it-fail check on the regression test itself, which is not a routine review
step but was specifically warranted by this task's declared risk level).

### Verdict

**APPROVE.** T010 is correctly implemented: `createPasswordRecoverySession()` genuinely builds a
second, throwaway, `persistSession: false`/`autoRefreshToken: false` Supabase client on every
call, never referencing the shared singleton; `requestPasswordReset` correctly and deliberately
uses the shared singleton (no session side effect, so no isolation concern); `signInWithPassword`
and `NETWORK_SIGN_IN_ERROR_MESSAGE` are byte-for-byte unchanged; the DI types match T009 exactly;
and the isolation-proving test was independently confirmed — via a real sabotage-and-restore
exercise, not just reading the assertions — to genuinely fail on a broken implementation rather
than rubber-stamping one. Proceed to T011/T012 (`RequestPasswordResetForm.tsx`/
`ResetPasswordForm.tsx`).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

---

## Review: T011, T012 (Phase 4, User Story 2 — RequestPasswordResetForm / ResetPasswordForm)

**Scope reviewed**: `src/features/identity/RequestPasswordResetForm.tsx`,
`src/features/identity/RequestPasswordResetForm.test.tsx`,
`src/features/identity/ResetPasswordForm.tsx`, `src/features/identity/ResetPasswordForm.test.tsx`
(all new/untracked, per `git status`). Confirmed `src/features/identity/LoginScreen.tsx` and
`app/(auth)/login.tsx` were **not** touched in this batch: `git log` shows both files' content
traces to the earlier T003–T005 commits (mtimes 11:56/12:01 vs. this batch's 12:47/12:48), neither
`RequestPasswordResetForm` nor `ResetPasswordForm` is imported anywhere in either file, and
`LoginScreen.tsx`'s `mode !== "sign-in"` branch still returns `null` exactly as T004 left it — T013
(the wiring task) and T014 remain untouched, as expected.

### Source documents read fresh

`specs/005-login/spec.md` (full — FR-001–FR-010, both Clarifications "Recorded default" entries,
US2 acceptance scenarios/edge cases), `specs/005-login/plan.md` (full — Research Decisions,
Project Structure, Interface Contracts), `specs/005-login/tasks.md` (full, T011/T012 text plus
surrounding phase structure), `.specify/memory/constitution.md`, `CHECKPOINTS.md`,
`docs/conventions.md`, `docs/verification.md`. Also read `VerifyPhoneScreen.tsx`, `CodeInput.tsx`,
`CodeInput.types.ts`, `SignInForm.tsx`, `RegistrationForm.tsx` (conventions comparison), and
`src/domain/schemas.ts`'s relevant exports, and `progress/impl_005-login.md` Run 9 (the
implementer's own account of this batch).

### Verification independently re-run

- `node_modules/.bin/tsc --noEmit` → clean, exit 0, zero output.
- `npx jest src/features/identity/RequestPasswordResetForm.test.tsx src/features/identity/ResetPasswordForm.test.tsx`
  → `2 suites passed, 8 tests passed`.
- `npx jest` (full suite) → `44 suites passed, 290 tests passed`, zero failures, zero regressions
  against the prior batch's recorded 282.

### Specific checks requested

1. **`RequestPasswordResetForm.tsx` — `zodResolver(requestPasswordResetSchema)`**: confirmed
   (`RequestPasswordResetForm.tsx:46`). **Anti-enumeration property (FR-007)**: confirmed by direct
   read — `onSubmit` is typed `(input: RequestResetInput) => void | Promise<void>` and its resolved
   value is never bound to a variable or inspected (`submit = handleSubmit(async (data) => { await
   onSubmit(data); setSubmitted(true); })`, line 50–53). There is exactly one `submitted`-gated
   branch in the JSX (line 61), and the confirmation string
   (`REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE`, line 34) is a single exported constant with no
   interpolation or conditional variant anywhere in the file. There is structurally no code path
   here that could render different copy based on whether the email is registered — the component
   cannot leak that distinction because it never receives it in the first place (the domain layer,
   T009's `requestPasswordReset`, itself never distinguishes the two cases, confirmed in the prior
   T009 review entry above). Matches spec.md FR-007 and US2 AS2 exactly ("same generic confirmation
   message ... regardless of whether the email actually belongs to an account").

2. **`ResetPasswordForm.tsx` — email field editability**: confirmed genuinely editable. Line
   141: `editable={!isSubmitting}` — no `editable={false}`, no `readOnly`, no disabled/greyed style
   applied to the email `TextInput` at any time other than the standard submitting-state lock every
   other field in this form (and every other form in this codebase, e.g. `SignInForm.tsx`) also
   gets. `initialEmail` only seeds `defaultValues.email` (line 82) at mount — nothing re-forces the
   value afterward. The test file explicitly exercises this
   (`ResetPasswordForm.test.tsx:34-55`, "pre-fills the email field from initialEmail but allows
   editing it" — types over the pre-filled value and asserts the *edited* value, not the original,
   is what reaches `onSubmit`). Matches spec.md US2 AS5.
   **`CodeInput` reuse**: confirmed genuinely reused, not reimplemented — `ResetPasswordForm.tsx`
   imports `CodeInput` from `./CodeInput` (line 31) and renders it with `length={PASSWORD_RESET_CODE_LENGTH}`
   (line 161, imported from `src/domain/schemas.ts`, not a hardcoded `6`). No parallel digit-input
   component exists anywhere in this diff.
   **New-password field**: uses `passwordSchema` via `resetPasswordWithCodeSchema` (confirmed in
   `src/domain/schemas.ts:196-201`: `password: passwordSchema`), single field, no confirm-password
   input anywhere in the JSX — matches spec.md Assumptions ("No confirm-password field").
   **Resend cooldown mechanism vs. `VerifyPhoneScreen.tsx`**: read both files side by side.
   `VerifyPhoneScreen.tsx`: `RESEND_COOLDOWN_SECONDS = 30` (line 59), `secondsRemaining` `useState`
   + a `useEffect` that, while `secondsRemaining > 0`, runs a `setInterval` decrementing by 1 every
   1000ms and clears on unmount/re-run (lines 81–91), a second `useEffect` mapping a `serverError`
   into `setError` (lines 96–103), `canResend = !isResending && !isSubmitting && secondsRemaining
   === 0` (line 105), `handleResendPress` calling `setSecondsRemaining(RESEND_COOLDOWN_SECONDS)`
   synchronously before `onResend()` (line 111, guarding against a double-tap race). `ResetPasswordForm.tsx`
   reproduces this **exactly**: same constant name and value (`RESEND_COOLDOWN_SECONDS = 30`, line
   64), byte-for-byte identical `useState`/`useEffect`/`setInterval`/`clearInterval` shape (lines
   85–95), the identical `serverError`→`setError` `useEffect` (lines 99–103), the identical
   `canResend` boolean shape (line 108), and the identical guard-before-calling order in
   `handleResendPress` (line 110–116: `setSecondsRemaining` before `onResend()`). This is a genuine
   reuse of the same mechanism (same constant, same timer shape), consistent with tasks.md T012's
   instruction and plan.md's "Shared UI" Research Decision — not a superficially-similar
   reinvention. (`RESEND_COOLDOWN_SECONDS` is redeclared locally rather than imported from
   `VerifyPhoneScreen.tsx`; the implementer flagged this explicitly as a judgment call in
   `progress/impl_005-login.md` Run 9. This mirrors `VerifyPhoneScreen.tsx`'s own precedent of
   owning its constant locally — not a hoisted shared value anywhere else in this codebase either —
   so it is consistent with existing convention, not a new pattern. Non-blocking.)

3. **`resetPasswordWithCodeSchema` via `zodResolver`**: confirmed (`ResetPasswordForm.tsx:81`).

4. **`FormField`/style-constant conventions**: both files import and use `FormField` for every
   labeled input (email/code/password), and both `styles` objects reproduce `SignInForm.tsx`'s
   exact shape (`container`/`title`/`input`/`button`/`buttonDisabled`/`buttonText`, all with
   `minHeight: 44`/`minWidth: 44` on interactive elements) — no new visual language introduced,
   matching `docs/conventions.md`'s "extreme consistency" directive and `RegistrationForm.tsx`'s
   established pattern (color palette, border radius, spacing all identical).

5. **Test coverage vs. spec**:
   - `RequestPasswordResetForm.test.tsx`: valid submission calls `onSubmit` then renders the
     generic confirmation (✓, lines 15–29); "Back to sign in" calls `onBack` (✓, lines 45–52). Also
     includes an unrequested but reasonable extra case (client-side invalid-email validation blocks
     submission), not a gap.
   - `ResetPasswordForm.test.tsx`: valid submission calls `onSubmit` with the parsed input (✓,
     lines 12–30); invalid/expired-code `serverError` renders inline on the code field (✓, lines
     59–75, asserts the exact message text renders, sourced from a `field: "code"` `serverError`
     prop); resend button disables for the cooldown window and calls `onResend` (✓, lines 80–113,
     uses fake timers, asserts a second press mid-cooldown does not double-call `onResend`, and that
     it re-enables after the full cooldown elapses); "Back to sign in" calls `onBack` (✓, lines
     117–124). All four requested cases present, plus the editable-pre-filled-email case (also
     requested in the review brief, covered lines 34–55).

### Requirement traceability

| FR | Test(s) |
|---|---|
| FR-007 (request a password-reset code by email, no route change, anti-enumeration) | `RequestPasswordResetForm.test.tsx` → "calls onSubmit with the parsed email then renders the generic confirmation" |
| FR-008 (submit code + new password; email carried forward but editable; no confirm-password) | `ResetPasswordForm.test.tsx` → "calls onSubmit with the parsed email/code/password...", "pre-fills the email field from initialEmail but allows editing it", "renders an invalid/expired-code serverError inline on the code field" |
| FR-009 (cooldown-limited resend, mirroring VerifyPhoneScreen's pattern) | `ResetPasswordForm.test.tsx` → "disables the resend button during the cooldown after pressing it, and re-enables once it elapses" |
| FR-010 (accessibility label + 44×44 tap target on every interactive element) | Every `Pressable`/`TextInput`/`CodeInput` in both files carries an explicit `accessibilityLabel`/`accessibilityRole` and a `minHeight: 44` (`minWidth: 44` on buttons) style — not independently re-tested here (T017 is the dedicated Polish/a11y-pass task), but structurally present in both files as reviewed. |

### `tasks.md` status

`T011` and `T012` both marked `[X]` in `specs/005-login/tasks.md` — matches the actual diff (both
files exist, both tests pass). `T013`/`T014` remain `[ ]`, correctly unstarted.

### CHECKPOINTS.md walkthrough (state as of this batch)

- **C1**: `[x]` `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all exist. `[x]`
  `docs/verification.md`/`docs/conventions.md` exist. `[x]` `.specify/memory/constitution.md`
  exists, current (v1.0.0, unchanged by this batch). `[x]` `./init.sh --skip-build` reported
  `RESULT: SUCCESS (8/8 stages)` per Run 9's own log (independently re-run here as `tsc --noEmit` +
  full `jest`, both clean/green — did not re-run the full `./init.sh` including build stages, which
  is out of scope for a mid-feature two-task review and is explicitly T020's job).
- **C2**: `[x]` Exactly one feature (`005-login`) `in_progress` in `feature_list.json`. `[x]` This
  feature isn't `done` yet, so the "every done feature has passing tests" clause doesn't apply yet;
  what exists so far has passing tests. `[x]` `progress/current.md` describes only this active
  session.
- **C3**: `[x]` Both new files have zero React Native imports issue — n/a, they're
  `src/features` UI components, which *are* expected to import RN (`react-native`,
  `react-hook-form`, `expo`-adjacent packages) — the relevant check is that they call into
  `src/domain` for validation/business logic rather than embedding it, which both do
  (`zodResolver(requestPasswordResetSchema)` / `zodResolver(resetPasswordWithCodeSchema)`, both
  from `src/domain/schemas.ts`; no inline validation logic, no fetch calls in either component
  body). `[x]` No platform-suffixed files needed or added (matches plan.md's Technical Context —
  this feature deliberately avoids platform divergence). `[x]` No direct Postgres/Redis/S3/Supabase
  table access — neither component imports `@supabase/supabase-js` or `src/lib/supabase-client.ts`
  at all; both are purely presentational, deferring the real SDK-touching calls to T013/T014's
  wiring layer, exactly as Constitution IV requires. `[x]` No new global state library. `[x]` No
  stray `console.log`/context-free `TODO` (grepped, zero hits in both files).
- **C4**: `[x]` Every exported `src/domain` function already has covering unit tests from prior
  batches (T008/T009, reviewed above) — this batch adds no new `src/domain` export. `[x]` Both new
  screens/components have RNTL component tests asserting on rendered output (confirmation text,
  inline error text, button disabled-state, `onBack`/`onResend`/`onSubmit` calls), not
  implementation details. `[x]` `./init.sh`'s build-check stages were not re-run in this
  review (T020's explicit job); Run 9's own `./init.sh --skip-build` (8/8, tests+type-check stages
  included) is accepted as sufficient at this mid-feature checkpoint, matching how every prior
  batch in this feature was reviewed.
- **C5**: `[x]` No suspicious untracked files beyond this feature's own expected new files (`git
  status` shows only feature-work-in-progress files, no `.tmp`/stray logs). `[ ]` `progress/history.md`
  entry for "the session just closed" — N/A at this point, the session is still open (this is a
  mid-feature two-task checkpoint, not a session close); this box is not evaluated as failing here,
  consistent with how prior mid-feature batches in this same feature were reviewed (Run 4 through
  Run 8's reviews all treat C5/C6's session-close-specific items as not-yet-applicable rather than
  blocking). `[x]` `feature_list.json` accurately reflects `005-login` as `in_progress`.
- **C6**: `[x]` `005-login` (`sdd: true`, `in_progress`) has `spec.md` + `plan.md` + `tasks.md`.
  `[x]` `spec.md` has no open `[NEEDS CLARIFICATION]` markers (both "Recorded default" entries are
  resolved defaults, not blocking markers, and were confirmed by the human at the approval gate per
  `progress/current.md`'s session log). `[ ]` "Every `done` feature... all `tasks.md` items marked
  `[X]`" — N/A, `005-login` is not yet `done`. `[x]` Every `FR-00x` touched by this batch (FR-007,
  FR-008, FR-009) is covered by at least one test referencing it (see traceability table above and
  both files' own header comments, which name the FRs explicitly).

No empty C1–C6 box blocks this review — the two `[ ]` items above are both explicitly
not-yet-applicable (feature not `done`, session not yet closed), the same treatment every prior
in-progress batch of this feature received.

### Findings

None blocking. One pre-existing, already-disclosed non-blocking note (not introduced by this
batch, already flagged by the implementer): `RESEND_COOLDOWN_SECONDS` is redeclared locally in
`ResetPasswordForm.tsx` rather than imported from `VerifyPhoneScreen.tsx` — this matches
`VerifyPhoneScreen.tsx`'s own precedent (it doesn't import its constant from anywhere else either)
and tasks.md's literal wording ("mirror it exactly... not a re-invented number," which this
satisfies by value/shape, not by binding identity), so it is not a deviation worth blocking on; a
future hoist into a shared location (e.g. alongside `PASSWORD_RESET_CODE_LENGTH` in
`src/domain/schemas.ts`, or a small shared `useCountdown` hook) would be a reasonable nit but is
optional, not required by any FR or convention actually on record. Similarly, `ResetPasswordFieldError`
being defined locally in `ResetPasswordForm.tsx` instead of `src/domain/passwordReset.ts` is a
defensible call (T009's `submitNewPassword` genuinely carries no field attribution of its own to
export) and does not violate Constitution IV — the type is a pure UI-layer error-shape contract,
not business logic.

### Verdict

**APPROVE.** T011 (`RequestPasswordResetForm.tsx`) correctly implements FR-007's anti-enumeration
requirement structurally, not just by convention — the component has no code path capable of
branching its confirmation copy on the submitted email's registration status. T012
(`ResetPasswordForm.tsx`) correctly keeps the pre-filled email genuinely editable, reuses
`CodeInput` unmodified with the configurable `length` prop, uses a single `passwordSchema`-backed
password field with no confirm-password input, and reproduces `VerifyPhoneScreen.tsx`'s resend-cooldown
mechanism as a genuine same-shape/same-value reuse rather than a reinvention. Both components use
`zodResolver` with the correct schemas, follow this codebase's established `FormField`/style
conventions exactly, and their test suites match every case requested in the review brief. Type-check
and the full test suite (44 suites / 290 tests) were independently re-run and are clean.
`LoginScreen.tsx`/`app/(auth)/login.tsx` are confirmed untouched in this batch, correctly deferred
to T013/T014. Proceed to T013 (wire both forms into `LoginScreen.tsx`'s `"request-reset"`/
`"reset-with-code"` modes).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

# Code Review: 005-login — T013, T014 (User Story 2 screen-level integration)

**Reviewed**: 2026-08-05
**Scope**: `src/features/identity/LoginScreen.tsx` + `LoginScreen.test.tsx` (T013),
`app/(auth)/login.tsx` + `app/(auth)/login.test.tsx` (T014). High-scrutiny review per the
orchestrator's explicit framing — this closes out User Story 2.

## Diff scope check

`git status --porcelain` + file mtimes (`stat -f "%Sm"`) independently cross-checked, not taken
on the implementer's word:

- `RequestPasswordResetForm.tsx`/`.test.tsx` (T011, mtime 12:47–12:48) and `ResetPasswordForm.tsx`
  (T012, mtime 12:48) predate this batch and are unchanged in content from the already-APPROVEd
  T011/T012 review above.
- `src/lib/supabase-client.ts`/`.test.ts` (T010, mtime 12:43) and `src/domain/passwordReset.ts`
  (T009, mtime 12:25) and `src/domain/schemas.ts` (T008/T001, mtime 12:25) all predate this batch
  and are unchanged.
- `LoginScreen.tsx`/`.test.tsx` (mtime 12:59–13:00) and `app/(auth)/login.tsx`/`.test.tsx` (mtime
  13:00–13:01) are the newest files — consistent with being this batch's actual work.
- **One file outside the two named-in-scope pairs was also modified this batch**:
  `src/features/identity/SignInForm.tsx` + `SignInForm.test.tsx` (mtime 12:58, immediately before
  `LoginScreen.tsx`). This is disclosed by the implementer (`progress/impl_005-login.md` Run 10,
  Deviations #1) as "necessary plumbing" — T013's own text requires "a confirmation banner and the
  email pre-filled into SignInForm" as an observable outcome after a successful reset, and the
  frozen T003 `SignInForm.tsx` had no prop surface for either. The extension is additive only
  (`initialEmail?: string`, `confirmationMessage?: string`, both optional, defaulting to the
  original static behavior when omitted) — confirmed by direct read that all 5 original T003 tests
  still pass unmodified, plus 2 new tests for the new props. This is a reasonable, disclosed,
  narrowly-scoped exception to the stated two-file scope, not scope creep hiding unrelated changes
  — accepted as in-scope for this review rather than treated as an undisclosed violation.

No other file (`useKycGate.ts`, `kyc-gate.ts`, `RegistrationForm.tsx`, `registration.ts`,
`feature_list.json`'s content beyond bookkeeping) shows any diff attributable to this batch.

## Independent verification (re-run myself)

```
node_modules/.bin/tsc --noEmit
```
Clean, no output, exit 0.

```
npx jest
```
```
Test Suites: 44 passed, 44 total
Tests:       298 passed, 298 total
```

```
./init.sh
```
```
RESULT: SUCCESS (10/10 stages passed)
```
Only the two pre-existing, non-blocking `expo-doctor`/native-dependency-alignment `WARN`s
(identical to every prior batch's — outdated `expo-image-picker`/`react-native`/etc. pins, not
introduced by this diff).

## Checks requested, addressed in order

### 1. Mode-transition sequence

Read `LoginScreen.tsx` directly, not inferred from tests. Confirmed the sequence is exactly:
`"sign-in"` (SignInForm, `onForgotPassword` → `handleForgotPassword`) → `"request-reset"`
(RequestPasswordResetForm, `onSubmit` → `handleRequestReset`, which on a resolved
`requestPasswordReset(email)` call unconditionally sets `resetEmail` and `setMode("reset-with-code")`)
→ `"reset-with-code"` (ResetPasswordForm, pre-filled `initialEmail={resetEmail}`, `onSubmit` →
`handleResetSubmit`, which calls `submitNewPassword(recoverySession, input)`; on success sets
`prefillEmail`, `signInConfirmationMessage`, calls `resetFlowState()`, and `setMode("sign-in")`) →
back to `"sign-in"` with `SignInForm`'s new `confirmationMessage`/`initialEmail` props populated.
**Confirmed correct and matches spec.md US2's acceptance-scenario ordering.**

However, see **Finding 1** below: the "reset-with-code" transition happens *unconditionally* on
`requestPasswordReset`'s resolution — `handleRequestReset` never inspects whether that call
actually succeeded or failed at the network level, which is a real, spec-documented gap (not
merely a mode-sequencing nuance).

### 2. Lazy creation of the recovery session

Confirmed: `recoverySession` state starts `null`; `handleForgotPassword` calls
`setRecoverySession((current) => current ?? createPasswordRecoverySession())` — the functional
updater means the factory runs only when `recoverySession` is currently `null`, and `null` is only
reachable via initial mount or `resetFlowState()`. Grepped `LoginScreen.tsx` for
`createPasswordRecoverySession` — the only call site is inside `handleForgotPassword`, never at
top-level/mount. `LoginScreen.test.tsx`'s dedicated test ("does not create a recovery session
until 'Forgot password?' is pressed...") independently proves this: asserts zero calls before the
first press, exactly one call after it. **Confirmed correct.**

### 3. No residual reset-flow state on "Back to sign in"

Both `RequestPasswordResetForm.onBack` and `ResetPasswordForm.onBack` are wired to the same
`handleBackToSignIn`, which (a) fires `recoverySession?.discard()` (best-effort, fire-and-forget,
safe per T010's MUST-NEVER-THROW contract), (b) calls `resetFlowState()` which nulls
`recoverySession` and resets five other reset-flow-local state variables, then (c) sets
`mode = "sign-in"`. Concretely traced the **second-attempt reuse scenario** the review explicitly
asked about: `LoginScreen.test.tsx`'s "does not create a recovery session..." test presses "Forgot
password?", backs out via "Back to sign in", then presses "Forgot password?" again — asserting
`createPasswordRecoverySession` is called a **second, independent** time (`toHaveBeenCalledTimes(2)`),
proving the stale first-attempt session is never reused across attempts, and its `discard()` was
called before being dropped. **Confirmed correct — no leaked/stale recovery-session instance.**

`signInConfirmationMessage`/`prefillEmail` are correctly *not* cleared by `handleBackToSignIn`
(a cancel never earns them) but *are* cleared by `handleForgotPassword` (so a stale confirmation
from an earlier, unrelated completed reset can't bleed into a fresh attempt) — verified by direct
read of both handlers.

### 4. The regression guard — genuinely exercises the real transition path, not a shortcut

Read `LoginScreen.test.tsx`'s "never calls the shared signIn prop during the reset-with-code
submission" test and `app/(auth)/login.test.tsx`'s "never touches the shared singleton's
signInWithPassword mock during the reset-with-code step" test line by line. **Both genuinely drive
the full user-facing sequence**: press "Forgot password?" → fill and submit the email in
`RequestPasswordResetForm` → wait for `ResetPasswordForm` to actually render
(`getByTestId("reset-password-code-field")`) → fill code + new password → press "Set new
password" → assert `updatePassword`/`recoveryAuthMock.updateUser` was actually called (proof the
step really ran) → assert the shared `signIn`/`mockSignInWithPassword` recorded **zero** calls.
No test-only prop or shortcut renders the component pre-seeded in `"reset-with-code"` mode — the
mode is reached exclusively through real `fireEvent.press`/`fireEvent.changeText` calls against
the actually-rendered tree, at both the component-DI boundary (`LoginScreen.test.tsx`) and the
real-SDK-mock boundary (`app/(auth)/login.test.tsx`, which mocks only `@supabase/supabase-js`, not
any domain/lib function). **This is a real, meaningful regression guard — it would genuinely catch
a mis-wiring where `handleResetSubmit` accidentally called `signIn` or the shared client.**

### 5. T014's wiring — domain/lib separation preserved to the outermost layer

`app/(auth)/login.tsx`: `requestPasswordReset` from `src/lib/supabase-client.ts` (T010) is wrapped
by `src/domain/passwordReset.ts`'s `requestPasswordReset()` orchestration (schema-validates via
`requestPasswordResetSchema` before calling the raw SDK-backed primitive) — `LoginScreen`'s
`requestPasswordReset` prop is `(email) => submitPasswordResetRequest(requestPasswordReset, {
email })`, mirroring T005's `signIn`/`submitSignIn` pattern exactly. `createPasswordRecoverySession`
is passed straight through as the factory `LoginScreen` itself calls lazily (correct — the
"lazy" decision belongs at the component layer, not the screen-glue layer). `LoginScreen.tsx`
itself imports `submitNewPassword` from `src/domain/passwordReset.ts` directly and calls it with
the raw `recoverySession` primitives — this is a legitimate Constitution IV pattern (a
`src/features/identity` component calling into `src/domain`, not embedding SDK/validation logic
inline); it does not need to be routed through `app/(auth)/login.tsx` first, since `ResetPasswordForm`'s
single `onSubmit(input)` shape has no lower-level equivalent to hand off without that
orchestration happening somewhere. **No `supabase.auth.*`/SDK call appears anywhere in either
`LoginScreen.tsx` or `app/(auth)/login.tsx` — confirmed by direct grep.** Domain/lib separation is
intact end-to-end.

## Findings

**Finding 1 (BLOCKING — correctness vs. spec, Edge Cases / SC-002)**: `handleRequestReset`
(`src/features/identity/LoginScreen.tsx`) never inspects `requestPasswordReset(email)`'s resolved
`{ error }` value — it unconditionally does `setResetEmail(input.email); setMode("reset-with-code")`
regardless of outcome. `spec.md`'s Edge Cases section explicitly requires: *"What happens if the
reset-code request itself fails at the network level ... → A distinct, honest network-failure
message, same treatment as User Story 1's Acceptance Scenario 5."* `RequestPasswordResetForm.tsx`
(T011, frozen) has no `serverError`/error-display prop at all, and nothing in this batch's
`LoginScreen.tsx` adds one. **Concrete failure scenario**: a user on a flaky connection presses
"Send reset code," the underlying `resetPasswordForEmail` call rejects/times out
(`requestPasswordReset`'s MUST-NEVER-THROW wrapper — T010 — catches it and returns
`{ error: NETWORK_..._MESSAGE }` or similar), and the screen **silently advances to the
code-entry view anyway**, as if an email had actually been sent — the user has no way to know the
request never went through, and any code they later try to enter will simply fail against a code
that was never sent, with no explanation. This is a real, user-facing violation of a documented
spec requirement (not an anti-enumeration concern — anti-enumeration only requires not
distinguishing *registered vs. unregistered email*, not suppressing *network-level* failures,
which spec.md explicitly calls out as needing distinct treatment) and of SC-002 ("All sign-in and
forgot-password validation/credential/network errors show inline"). The implementer self-disclosed
this exact gap (`progress/impl_005-login.md` Run 10, Deviations #3) as unresolved and flagged it
for "the next review/planning pass" — this is that review, and it is not something to defer
further silently. Fix: `handleRequestReset` must branch on `requestPasswordReset`'s result — on a
network-level error, keep `mode === "request-reset"` and surface the error inline (requires adding
a `serverError` prop to `RequestPasswordResetForm.tsx`, mirroring `SignInForm.tsx`'s single-banner
pattern) rather than transitioning to `"reset-with-code"` regardless of outcome.

**Finding 2 (non-blocking but should be resolved, not silently accepted — correctness vs. spec,
US2 AS2)**: Because `handleRequestReset` switches `mode` to `"reset-with-code"` as soon as
`requestPasswordReset(email)` resolves, `RequestPasswordResetForm`'s own "submitted" confirmation
view (`REQUEST_PASSWORD_RESET_CONFIRMATION_MESSAGE`, "If that email is registered, we've sent a
code") is unmounted essentially immediately after being set — in practice invisible to a real
user, since nothing in the render path pauses on it. spec.md's Independent Test for US2 states:
*"submit a registered email, confirm a generic 'check your email' confirmation ... then submit a
valid emailed code"* — treating the confirmation as a distinct, observable step before code entry,
and AS2 requires it be "shown," not merely set-then-instantly-discarded. `ResetPasswordForm.tsx`
(the screen the user actually lands on) shows no equivalent confirmation text of its own. The
implementer self-disclosed this exact tension (`progress/impl_005-login.md` Run 10, Deviations #2)
as a genuine, unresolved design conflict between T011's frozen component and T013's literal
transition-timing instruction, explicitly asking for a decision at this review gate rather than
unilaterally picking one side. Not blocking on its own (arguably AS2's substance —
"same message regardless of registration status" — is structurally guaranteed even if the message
is never actually seen), but should not be silently closed out either: either (a) show a brief,
genuinely visible confirmation before the code-entry view (a short delay, a toast, or an explicit
"Continue" step), or (b) move an equivalent confirmation line onto `ResetPasswordForm.tsx` itself
(e.g. "We've sent a code to that email" as static copy, not gated on the domain result). Flag for
explicit resolution, not further silent deferral.

**Finding 3 (nit, disclosed and reasonable)**: `SignInForm.tsx`/`SignInForm.test.tsx` were modified
outside the two file-pairs named in this review's stated scope. Reviewed above under "Diff scope
check" — a narrow, additive, fully-tested, necessary-plumbing change, correctly disclosed by the
implementer rather than hidden. Not a defect; noted for the record since the review brief asked
for explicit scope confirmation.

## `tasks.md` checklist status (T013/T014)

- [X] T013 — `LoginScreen.tsx` extended with `"request-reset"`/`"reset-with-code"` modes, lazy
  recovery-session creation, full state cleanup on both exit paths. Matches diff. **Marked done,
  but Finding 1 means the task's own FR-007/FR-008 annotation is not fully satisfied against
  spec.md's Edge Cases.**
- [X] T014 — `app/(auth)/login.tsx` wires the real `requestPasswordReset`/
  `createPasswordRecoverySession` through `src/domain/passwordReset.ts`. Matches diff.
- T015 (US2 manual smoke check) correctly remains `[ ]` — out of this batch's scope, and per
  `progress/impl_005-login.md` Run 10, genuinely still owed with real browser/simulator tooling
  (this run's own attempt was limited to `curl`-level bundle-serves-cleanly checks, honestly
  disclosed as insufficient for Level 3).

## CHECKPOINTS.md C1–C6 walkthrough

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` all exist. [x]
  `docs/verification.md`/`docs/conventions.md` exist. [x] `.specify/memory/constitution.md`
  exists, current (v1.0.0). [x] `./init.sh` independently re-run this review: `RESULT: SUCCESS
  (10/10 stages)`.
- **C2**: [x] Exactly one feature (`005-login`) `in_progress` in `feature_list.json`. [x]
  `001`/`004` (`done`) unaffected — full suite green, nothing in their test files touched. [x]
  `progress/current.md` describes only the active `005-login` session.
- **C3**: [x] `src/domain` (`passwordReset.ts`) untouched this batch, still zero RN imports
  (verified in the T008/T009 review, unchanged since). [x] `LoginScreen.tsx`/`app/(auth)/login.tsx`
  call into `src/domain`/`src/lib` rather than embedding SDK calls or validation inline — grepped
  both files for `supabase.auth`/`createClient`: zero hits. [x] No platform-specific code
  introduced. [x] No direct Postgres/Redis/S3/Supabase-table access — only the SDK-wrapping
  functions from `src/lib/supabase-client.ts` (T010, already reviewed) are used. [x] No new global
  state library. [x] No stray `console.log`/context-free `TODO` — grepped, zero hits in all four
  touched files (`LoginScreen.tsx`, `login.tsx`, `SignInForm.tsx`, and their tests).
- **C4**: [x] Every exported function/component in this diff has a covering test
  (`LoginScreen.test.tsx` 8/8, `app/(auth)/login.test.tsx` 4/4, `SignInForm.test.tsx` 7/7,
  independently re-run, all pass). [x] New/changed screens have RNTL component tests asserting on
  rendered output (testIDs, text, mock-call arguments), not implementation details. [x]
  `./init.sh`'s three-target build-export stages all pass (web/iOS/Android), native-dependency
  stage shows only pre-existing, non-FAILing warnings.
- **C5**: [x] No suspicious untracked files — `git status` shows only this feature's own expected
  in-progress files. [ ] `progress/history.md` entry for a closed session — N/A, feature still
  `in_progress`, session not yet closed (consistent with every prior mid-feature batch's review in
  this file). [x] `feature_list.json` accurately reflects `005-login` as `in_progress`.
- **C6**: [x] `specs/005-login/` has `spec.md` + `plan.md` + `tasks.md`. [x] `spec.md` has no open
  `[NEEDS CLARIFICATION]` markers. [ ] "Every `done` feature has all `tasks.md` items `[X]`" — N/A,
  `005-login` not yet `done`. **[ ] FR-007/FR-008's Edge-Cases-level requirement (network-failure
  messaging for the reset-request step) is traced by zero test — Finding 1 is exactly the kind of
  gap Level 5 traceability is meant to catch: no test in this batch (or any prior batch) asserts
  anything about a network failure during `requestPasswordReset`'s call, because the code path to
  handle it doesn't exist.** This is a genuine, blocking C6 gap, not a deferred/conditional one —
  test tooling fully exists for this feature area.

CHECKPOINTS box C6's last bullet is empty in a way that blocks approval per this file's own
"rejects the review if any box in C1–C6 is empty" instruction (excluding only the explicitly
conditional/not-yet-applicable ones, which C5's and C6's other `[ ]` items above are).

## Verdict

**REQUEST CHANGES**

T013/T014's core, most-scrutinized guarantees are genuinely solid: the lazy recovery-session
creation, the full no-residual-state cleanup on "Back to sign in" (including the second-attempt
reuse scenario, independently traced and confirmed non-leaking), and — most importantly — the
regression-guard tests that prove the `"reset-with-code"` step never touches the shared/ambient
sign-in path are all real, meaningful, and genuinely exercise the actual user-driven
mode-transition sequence rather than a shortcut. Domain/lib separation (Constitution IV) is intact
through `app/(auth)/login.tsx`'s outermost screen-glue layer. Type-check, the full 298-test suite,
and a full `./init.sh` (10/10 stages) all pass, independently re-run.

However, **Finding 1 is a real, spec-documented correctness gap**: `LoginScreen.tsx`'s
`handleRequestReset` unconditionally advances to `"reset-with-code"` regardless of whether
`requestPasswordReset` actually succeeded, silently swallowing a network-level failure that
spec.md's Edge Cases section explicitly requires be shown as "a distinct, honest network-failure
message." This was self-disclosed by the implementer as an unresolved gap rather than hidden, but
it was not fixed, and it has zero test coverage — both the correctness violation itself and the
resulting Level 5 traceability gap are blocking per this repo's own review standards. **Finding 2**
(the "request a reset code" confirmation being effectively unmountable-before-visible) is a
related, also-self-disclosed design tension against US2 AS2/the Independent Test's explicit
wording, and should be resolved in the same pass rather than deferred again.

**What `task-implementer` needs to fix**:
1. `LoginScreen.tsx`'s `handleRequestReset` must branch on `requestPasswordReset(email)`'s
   resolved `{ error }`: on a network-level failure, stay in `"request-reset"` mode and surface
   the error inline (add a `serverError`-style prop to `RequestPasswordResetForm.tsx`, mirroring
   `SignInForm.tsx`'s existing single-banner pattern) instead of unconditionally transitioning to
   `"reset-with-code"`. Add a test asserting this (e.g. `requestPasswordReset` resolving with
   `NETWORK_..._MESSAGE`-shaped error keeps `RequestPasswordResetForm` visible with that error
   shown, and does not advance to `"reset-with-code"`).
2. Resolve Finding 2 explicitly — either give the user a genuinely visible confirmation before
   entering `"reset-with-code"`, or move equivalent confirmation copy onto `ResetPasswordForm.tsx`
   itself — and record which approach was chosen and why.
3. Re-run the full test suite, type-check, and `./init.sh` after the fix and update
   `progress/impl_005-login.md` with a new run documenting the change, then resubmit for review.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

---

# Re-review: T013/T014 fix pass (Run 11) — Findings 1 and 2 from the prior REQUEST CHANGES

**Reviewed**: 2026-08-05
**Scope**: `progress/impl_005-login.md` Run 11's claimed fix for the two findings in this file's
immediately-preceding "Code Review: 005-login — T013, T014" entry (verdict: REQUEST CHANGES).
Re-verified independently against the current working tree, not taken on the implementer's word.

## Diff scope check (independent, via mtime — files are untracked, so `git diff` against HEAD
shows the whole feature; `stat -f "%Sm"` isolates exactly what Run 11 touched)

```
2026-08-05 13:00:54 app/(auth)/login.tsx                 (T014, predates this run)
2026-08-05 12:58:24 src/features/identity/SignInForm.tsx (T013 batch, predates this run)
2026-08-05 13:14:04 src/features/identity/RequestPasswordResetForm.tsx
2026-08-05 13:14:32 src/features/identity/LoginScreen.tsx
2026-08-05 13:15:02 src/features/identity/ResetPasswordForm.tsx
2026-08-05 13:15:21 src/features/identity/RequestPasswordResetForm.test.tsx
2026-08-05 13:15:33 src/features/identity/ResetPasswordForm.test.tsx
2026-08-05 13:15:51 src/features/identity/LoginScreen.test.tsx
```
Exactly the six files Run 11 claims (`RequestPasswordResetForm.tsx/.test.tsx`, `LoginScreen.tsx/
.test.tsx`, `ResetPasswordForm.tsx/.test.tsx`), all with the newest mtimes in the tree, all later
than `app/(auth)/login.tsx` and `SignInForm.tsx`, which are confirmed **not** touched this run.
`src/lib/supabase-client.ts`/`.test.ts` and `src/domain/schemas.ts` show as modified in `git
status` but their content (independently read via `git diff`) is T010/T001-era work predating
Run 11 by hours — unrelated to this fix pass. **No scope creep.**

## 1. Finding 1 fix — verified genuine, not a shortcut

Read `src/features/identity/LoginScreen.tsx`'s `handleRequestReset` (lines 150–165) directly:

```ts
async function handleRequestReset(input: RequestResetInput): Promise<boolean> {
  setResetRequestServerError(undefined);
  setIsRequestingReset(true);
  try {
    const { error } = await requestPasswordReset(input.email);
    if (error) {
      setResetRequestServerError(error);
      return false;
    }
    setResetEmail(input.email);
    setMode("reset-with-code");
    return true;
  } finally {
    setIsRequestingReset(false);
  }
}
```
This genuinely branches on the resolved `{ error }`: on a truthy error, `mode` is left untouched
(stays `"request-reset"`) and the error is written to a new `resetRequestServerError` state
variable, which is passed straight into `RequestPasswordResetForm`'s new `serverError` prop
(`LoginScreen.tsx:258`). On success, `resetEmail`/`mode` are still set exactly as before — the
success path is unchanged. `resetRequestServerError` is correctly cleared on both a fresh "Forgot
password?" press (`handleForgotPassword`) and on `resetFlowState()` (both exit paths), so a stale
error can't bleed into a later attempt.

`RequestPasswordResetForm.tsx`'s new `serverError?: string` prop (lines 42, 55) renders as one
general inline banner (`testID="request-reset-form-error"`, `accessibilityRole="alert"`) directly
above the email field, mirroring `SignInForm.tsx`'s established single-banner pattern exactly — no
new visual language invented.

**Test genuinely exercises the branch, not a shortcut**: `LoginScreen.test.tsx`'s "stays on
'request-reset' and shows the error inline when requestPasswordReset resolves with a network-level
error" (lines 241–261) mocks `requestPasswordReset` to resolve `{ error:
NETWORK_SIGN_IN_ERROR_MESSAGE }` (a real error string imported from the real, unmocked-at-this-
layer `src/lib/supabase-client.ts`, only its SDK boundary mocked), drives the real user sequence
(press "Forgot password?" → fill email → press "Send reset code"), and asserts: (a) the error
banner renders with the exact message, (b) the "Send reset code" button is still present (proof
`mode` never advanced), and (c) both `reset-password-code-field` and `request-reset-confirmation`
are absent (`queryByTestId` returning null for both, ruling out the possibility that the mode
advanced anyway with the form components separately failing to render). This is a meaningful,
non-vacuous assertion set — a regression that reverted to unconditional advancement would fail (b)
and (c) immediately. Confirmed by direct read, not by trusting the pass/fail alone.

**Success path still correct**: the pre-existing "walks the full sign-in -> request-reset ->
reset-with-code -> sign-in mode sequence" test (unchanged from the prior batch, still passing)
continues to prove `resetEmail`/`mode` transition correctly and the email is carried forward into
`ResetPasswordForm`'s `initialEmail`.

**Verdict on Finding 1: genuinely fixed.** Matches the review's own prescribed fix exactly (branch
on the result; add a `serverError` prop mirroring `SignInForm`'s pattern; stay in `"request-reset"`
on error; proceed to `"reset-with-code"` carrying the email forward on success).

## 2. Finding 2 fix — verified genuine, option (b) as claimed

Read `src/features/identity/ResetPasswordForm.tsx` directly. The new `RESET_CODE_SENT_MESSAGE`
constant (line 78, `"If that email is registered, we've sent a code."`) is rendered
unconditionally at lines 145–147:

```tsx
<Text style={styles.confirmation} accessibilityRole="text" testID="reset-password-code-sent-message">
  {RESET_CODE_SENT_MESSAGE}
</Text>
```
This is a static `Text` node placed directly in the component's JSX, immediately below the
"Enter your reset code" header — not inside any conditional (`{condition ? ... : null}`), not
gated on any prop, not gated on `serverError`/`isSubmitting`/`initialEmail`/any other prop in
`ResetPasswordFormProps`. Confirmed by reading the full component: every other conditionally-
rendered element in this file (`generalError`) uses the `{cond ? <Text>...</Text> : null}` pattern
visibly; `RESET_CODE_SENT_MESSAGE`'s `<Text>` uses no such wrapper. It genuinely renders on every
mount of this component, matching Run 11's claim precisely — it is not "hidden behind a prop that
could be false/absent in the real wired-up flow" (there is no such prop in this component at all).

Confirmed it's wired into the real flow: `LoginScreen.tsx` renders `<ResetPasswordForm ... />`
unconditionally whenever `mode === "reset-with-code"` (line 264–278) with no prop suppressing this
new confirmation line — so a real user landing on this screen via the real `/login` flow
(`app/(auth)/login.tsx`, unchanged this run) will see it.

**Test genuinely asserts presence**: `ResetPasswordForm.test.tsx`'s "always shows the static 'we've
sent a code' confirmation, regardless of props" (lines 16–23) renders the bare component with only
the three required props (`onSubmit`, `onResend`, `onBack` — no `initialEmail`, no `serverError`)
and asserts both the testID and the exact text are present — proving the confirmation shows even in
the minimal-props case, not merely when some optional prop happens to be truthy. This is a genuine,
non-vacuous assertion.

**Verdict on Finding 2: genuinely fixed**, via the disclosed option (b) exactly as Run 11 claims —
a static, always-shown confirmation line moved onto `ResetPasswordForm.tsx`, not option (a)
(a timed/interactive confirmation step). The design tradeoff (simpler, no new timing-dependent UI
state, and provably safe against anti-enumeration leakage since the copy is equally true regardless
of whether the email is actually registered — `requestPasswordReset`'s `{ error }` never
distinguishes existence, only reachability, confirmed by re-reading `src/domain/passwordReset.ts`/
`src/lib/supabase-client.ts`, both unchanged this run) is reasonable and matches spec.md's US2 AS2/
Independent Test's substance (a visible, generic confirmation before code entry).

## 3. `RequestPasswordResetForm.onSubmit` contract change — checked for breakage

**Old contract**: `onSubmit: (input) => void | Promise<void>`, component unconditionally set
`submitted = true` after `await onSubmit(data)` resolved.
**New contract**: `onSubmit: (input) => boolean | Promise<boolean>`, component only sets
`submitted = true` when the resolved value is `true`.

Grepped the entire `src/` and `app/` tree for other call sites: `RequestPasswordResetForm` is
referenced only in `LoginScreen.tsx` (the real caller, correctly updated — `handleRequestReset`
now returns `Promise<boolean>`) and inside `ResetPasswordForm.tsx`'s own comments (prose, not a
call site). No other file constructs or renders `<RequestPasswordResetForm>` — confirmed by
`grep -rn "RequestPasswordResetForm"` returning only `LoginScreen.tsx`,
`RequestPasswordResetForm.tsx` itself, `RequestPasswordResetForm.test.tsx`, and
`ResetPasswordForm.tsx`'s doc-comment prose. **No other code depends on the old `void`-returning
contract.**

`RequestPasswordResetForm.test.tsx` covers both paths of the new contract directly:
- `onSubmit` resolving `true` → "calls onSubmit with the parsed email then renders the generic
  confirmation on success" (confirmation testID present).
- `onSubmit` resolving `false` → "renders a serverError banner instead of the confirmation when
  onSubmit resolves false" (confirmation testID explicitly asserted absent via `queryByTestId`,
  both before and after a `rerender` with a `serverError` prop, proving the banner path and the
  confirmation path are mutually exclusive as intended).
Both existing tests ("shows an inline validation error…", "calls onBack…") are unaffected by the
contract change and still pass with `onSubmit` mocked as a bare `jest.fn()` (unresolved promise —
`succeeded` is `undefined`/falsy, so `submitted` correctly never becomes `true`, consistent with
the new contract's semantics for a call that never actually completes in that test's scope).
**Contract change is safe and fully covered.**

## 4. Re-verification of the previously-confirmed-solid T013/T014 guarantees

Re-read `LoginScreen.tsx` end-to-end (not just diffed) to confirm none of the following were
accidentally disturbed by the added `resetRequestServerError` state/branch:
- **Lazy recovery-session creation**: `handleForgotPassword`'s `setRecoverySession((current) =>
  current ?? createPasswordRecoverySession())` is byte-for-byte unchanged from the prior batch.
  `LoginScreen.test.tsx`'s "does not create a recovery session until 'Forgot password?' is
  pressed…" test is unchanged and still passes.
- **No-residual-state cleanup on "Back to sign in"**: `resetFlowState()` (lines 231–239) now
  additionally clears `resetRequestServerError` (a necessary, correct addition — a stale
  network-error banner from an abandoned attempt must not bleed into a fresh one) alongside the
  five pre-existing resets. `handleBackToSignIn` itself is otherwise unchanged. The "returns to
  plain sign-in with no residual reset-flow state…" test is unchanged and still passes.
- **"reset-with-code" never touches `signIn`" regression guard**: `handleResetSubmit` (lines
  187–214) is byte-for-byte unchanged — still calls only `submitNewPassword(recoverySession,
  input)`, never `signIn`. The dedicated regression test ("never calls the shared signIn prop
  during the reset-with-code submission") is unchanged and still passes.
- **Domain/lib separation**: grepped `LoginScreen.tsx`, `RequestPasswordResetForm.tsx`,
  `ResetPasswordForm.tsx` for `supabase.auth`/`createClient`/`console.` /`TODO`: zero hits in all
  three. `app/(auth)/login.tsx` (unchanged this run) still the only file wiring the real
  `requestPasswordReset`/`createPasswordRecoverySession` implementations through
  `src/domain/passwordReset.ts`.

All four guarantees are intact, not accidentally broken by this fix pass.

## Independent verification (re-run myself, not trusted from `progress/impl_005-login.md`)

```
node_modules/.bin/tsc --noEmit
```
Clean, no output, exit 0.

```
npx jest
```
```
Test Suites: 44 passed, 44 total
Tests:       301 passed, 301 total
```
Matches Run 11's own reported count exactly (298 before + 3 new).

```
./init.sh
```
```
RESULT: SUCCESS (10/10 stages passed)
```
Only the same two pre-existing, non-blocking `expo-doctor`/native-dependency-alignment `WARN`s
present in every prior batch's run (outdated `expo-image-picker`/`react-native`/etc. pins) — not
introduced by this diff.

## `CHECKPOINTS.md` C1–C6 — re-walked for this fix pass

- **C1**: [x] `AGENTS.md`/`init.sh`/`feature_list.json`/`progress/current.md` exist. [x]
  `docs/verification.md`/`docs/conventions.md` exist. [x] Constitution exists, current. [x]
  `./init.sh` independently re-run: `RESULT: SUCCESS (10/10 stages)`.
- **C2**: [x] Exactly one feature (`005-login`) `in_progress`. [x] `001`/`004` (`done`) unaffected —
  full suite green, none of their files touched. [x] `progress/current.md` describes only the
  active session.
- **C3**: [x] `src/domain` (`passwordReset.ts`) untouched this run, still zero RN imports. [x] The
  three touched components call into `src/domain`/props (`requestPasswordReset`,
  `submitNewPassword`) rather than embedding SDK/validation logic inline — grepped, zero
  `supabase.auth`/`createClient` hits. [x] No platform-specific code introduced. [x] No direct
  Postgres/Redis/S3/Supabase-table access. [x] No new global state library. [x] No stray
  `console.log`/context-free `TODO` — grepped, zero hits in all six touched files.
- **C4**: [x] Every new/changed prop and behavior in this diff has a covering test — 3 new tests
  (`LoginScreen.test.tsx`, `RequestPasswordResetForm.test.tsx`, `ResetPasswordForm.test.tsx`),
  independently re-run, all pass, and are meaningfully assertive (not vacuous — see sections 1–2
  above). [x] `./init.sh`'s three-target build-export stages all pass.
- **C5**: [x] No suspicious untracked files — `git status` shows only this feature's own expected
  in-progress files, mtimes confirm exactly the six claimed files changed this run. [ ]
  `progress/history.md` entry for a closed session — N/A, feature still `in_progress`.
- **C6**: [x] `specs/005-login/` has `spec.md`+`plan.md`+`tasks.md`. [x] No open `[NEEDS
  CLARIFICATION]` markers. [ ] "Every `done` feature has all `tasks.md` items `[X]`" — N/A,
  `005-login` not yet `done`. [x] The Edge-Cases-level requirement that blocked the prior review
  (network-failure messaging for the reset-request step) now has direct test coverage in two
  independent files (`LoginScreen.test.tsx`, `RequestPasswordResetForm.test.tsx`) — the exact C6
  gap flagged as blocking in the prior review entry is now closed.

No C1–C6 box relevant to this batch is empty in a way that blocks approval.

## Findings

None. Both Finding 1 and Finding 2 from the prior review are genuinely, substantively resolved —
not shortcut fixes, not test-only patches that would pass regardless of the underlying behavior.
The `onSubmit` contract change on `RequestPasswordResetForm` is safe (single call site, both
branches tested, no other code depends on the old shape). Diff scope is exactly the six files
claimed, confirmed independently via mtime, not git history (all touched files are untracked). All
previously-verified T013/T014 guarantees (lazy session creation, full state cleanup including the
newly-added `resetRequestServerError`, the sign-in-path regression guard, domain/lib separation)
remain intact.

## Verdict

**APPROVE**

Finding 1 (BLOCKING) is genuinely fixed: `handleRequestReset` now branches on
`requestPasswordReset`'s resolved `{ error }`, staying in `"request-reset"` mode with the error
surfaced via a new `serverError` prop on `RequestPasswordResetForm.tsx` on failure, and proceeding
to `"reset-with-code"` with the email carried forward exactly as before on success — confirmed by
direct code read, and covered by a meaningful, non-vacuous test in `LoginScreen.test.tsx` that
would fail under the old unconditional-advancement behavior. Finding 2 (non-blocking) is genuinely
fixed via the disclosed option (b): a static, unconditionally-rendered `RESET_CODE_SENT_MESSAGE`
line on `ResetPasswordForm.tsx`, confirmed not gated behind any prop, with a dedicated test
asserting its presence with only the minimal required props supplied. The `onSubmit` contract
change on `RequestPasswordResetForm` has a single call site (`LoginScreen.tsx`, correctly updated)
and both branches are tested; no other code in the repository depends on the prior `void`-returning
shape. Diff scope is exactly the six files Run 11 claims, independently confirmed via file mtimes.
Type-check, the full 301-test suite, and a full `./init.sh` (10/10 stages) all pass, independently
re-run — not taken on the implementer's word. All previously-confirmed T013/T014 guarantees (lazy
recovery-session creation, no-residual-state cleanup on "Back to sign in," the "reset-with-code"
never-touches-`signIn` regression guard, and Constitution IV domain/lib separation) remain intact
and were not disturbed by this fix pass.

**What's left for the feature overall**: T015 (US2 manual smoke check) remains `[ ]`, correctly
still outstanding per `tasks.md` — not part of this re-review's scope, but noted for whichever
batch closes out the feature.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

---

# Review: T015 (Phase 4 checkpoint close-out — User Story 2 manual smoke check)

**Reviewed**: 2026-08-05
**Scope**: `progress/impl_005-login.md` Run 12 ("T015 (Phase 4 checkpoint: US2 manual smoke
check)") — a manual-verification task, not a code diff. Cross-checked against `specs/005-login/
spec.md`, `plan.md`, `tasks.md` (T015's own text), `CHECKPOINTS.md`, and the current working
tree's actual code (not taken on the implementer's/orchestrator's word).

## 1. Honesty of Run 12's claims — independently checked against the code

### Claim A: Fix-1 (network-failure-stays-in-`request-reset`-mode) confirmed LIVE, matching the code

Read `src/features/identity/LoginScreen.tsx`'s `handleRequestReset` (lines 150–165) directly:

```ts
async function handleRequestReset(input: RequestResetInput): Promise<boolean> {
  setResetRequestServerError(undefined);
  setIsRequestingReset(true);
  try {
    const { error } = await requestPasswordReset(input.email);
    if (error) {
      setResetRequestServerError(error);
      return false;
    }
    setResetEmail(input.email);
    setMode("reset-with-code");
    return true;
  } finally {
    setIsRequestingReset(false);
  }
}
```

This is exactly the fix APPROVEd in this file's "Re-review: T013/T014 fix pass (Run 11)" entry
above — on a truthy `{ error }`, `mode` is left untouched (stays `"request-reset"`) and the error
is surfaced via `resetRequestServerError`, which `RequestPasswordResetForm`'s `serverError` prop
renders as a single `testID="request-reset-form-error"` banner (confirmed by direct read of
`RequestPasswordResetForm.tsx` lines 89–93). Run 12's described live behavior — submitting an
email on `request-reset` in this credential-less sandbox produces a genuine
`net::ERR_NAME_NOT_RESOLVED`/`"Failed to fetch"` network failure (via
`requestPasswordReset`'s MUST-NEVER-THROW wrapper, `src/lib/supabase-client.ts`, T010, unchanged
this run) and the screen **stays on `request-reset` with the error shown inline** — is fully
consistent with what this code actually does. Nothing in the code contradicts the claim; the
described behavior is the direct, unavoidable consequence of the `if (error) { ...; return false;
}` branch above. **Plausible and consistent — not a fabricated or exaggerated claim.**

Cross-checked the corresponding unit test (`LoginScreen.test.tsx`, "stays on 'request-reset' and
shows the error inline when requestPasswordReset resolves with a network-level error", line 241)
independently re-run (below) — its assertions (error banner renders with the exact message, "Send
reset code" button still present, both `reset-password-code-field` and `request-reset-confirmation`
absent) match the same branch Run 12 describes exercising live. The live check and the unit test
are testing the same code path, as expected, and neither contradicts the other. This satisfies the
review's ask: Run 12 didn't merely reassert the unit test's claim under a different label — it
independently reproduced the same observable behavior against the real running app via a genuine
(if environmentally-forced) network failure, and the account is honest about *why* it was a network
failure rather than a genuine registered/unregistered-email test (no reachable Supabase project).

### Claim B: `reset-with-code` mode not reachable live — `.env` re-confirmed empty

```
EXPO_PUBLIC_SUPABASE_URL=""
EXPO_PUBLIC_SUPABASE_ANON_KEY=""
```
Independently read `.env` directly — both values are still empty strings in this sandbox, exactly
as Run 12 (and Run 6/T007 before it) states. Since `"reset-with-code"` mode is only reachable via
`handleRequestReset`'s success branch (`error` falsy), and every network call in this sandbox
necessarily fails against the empty-URL fallback, the code-entry/new-password screen is
structurally unreachable here — this is not a testing shortcut or a place where more effort would
have helped; it is a genuine environment limitation, identical in kind to Run 6/T007's own
disclosed limitation for the analogous "successful sign-in" scenario. Deferring this path to the
already-reviewed/APPROVEd `ResetPasswordForm.test.tsx` and `LoginScreen.test.tsx`'s full
`"sign-in"` → `"request-reset"` → `"reset-with-code"` → `"sign-in"` mode-sequence test is
reasonable and adequately disclosed — Run 12 states plainly ("NOT reached live") rather than
implying live coverage, and the unit-test coverage it points to was independently confirmed to
exist and pass (see verification below). Nothing is silently left unverified: the gap is named,
the reason is named, and the substitute coverage is named and accurate.

### Claim C: iOS Simulator / Android skip

Same disclosed Xcode-selection gap as Run 6/T007 (`xcode-select` not pointed at
`/Applications/Xcode.app/Contents/Developer`, requires `sudo` + the human's password, not
available in this session) and the same pre-existing no-emulator/SDK Android gap present in every
prior feature's manual-smoke-check runs (001, 004, and 005's own T007). This is not a new or
feature-specific gap introduced by this checkpoint — it is an already-established, already-accepted
environment constraint this repo's review history has consistently treated as non-blocking when
honestly disclosed (see the T007/Run 6 review's own APPROVE despite the identical gap). Consistent
treatment here is correct, not a lowering of the bar.

## 2. Independent re-verification (re-run myself, not trusted from `progress/impl_005-login.md`)

```
node_modules/.bin/tsc --noEmit
```
Clean, no output, exit 0.

```
npx jest
```
```
Test Suites: 44 passed, 44 total
Tests:       301 passed, 301 total
```
Matches Run 12's stated baseline (301/301, confirmed clean immediately before its run) — no
regression introduced by this checkpoint (T015 is a manual-verification task with no file diff of
its own, confirmed: `git status --porcelain` shows nothing beyond the already-approved,
still-`in_progress`-feature's existing untracked/modified files, and `tasks.md`'s `T015` line is
the only change attributable to this run, a checkbox flip).

```
./init.sh
```
```
RESULT: SUCCESS (10/10 stages passed)
```
Only the same two pre-existing, non-blocking `expo-doctor`/native-dependency-alignment `WARN`s
present in every prior batch's run (outdated `expo-image-picker`/`react-native`/etc. pins) — not
introduced by this checkpoint.

Independently re-read `src/features/identity/RequestPasswordResetForm.tsx` and
`src/features/identity/ResetPasswordForm.tsx` in full (not just diffed) to confirm the `serverError`
banner and the static `RESET_CODE_SENT_MESSAGE` confirmation (Fix 2, from the earlier CHANGES_
REQUESTED round) are both still present and unconditional, exactly as the prior re-review (Run 11)
confirmed and as Run 12's account presumes — both confirmed present, unchanged, and correctly
wired through `LoginScreen.tsx`.

## 3. `tasks.md` checklist status — Phase 4 (User Story 2), T008–T015

- [X] T008 — schemas extensions. **Matches diff, previously reviewed/APPROVEd.**
- [X] T009 — `src/domain/passwordReset.ts`. **Matches diff, previously reviewed/APPROVEd.**
- [X] T010 — throwaway recovery-session Supabase client. **Matches diff, previously
  reviewed/APPROVEd (with an explicit sabotage-and-restore mutation test on the isolation
  guarantee).**
- [X] T011 — `RequestPasswordResetForm.tsx`. **Matches diff, previously reviewed/APPROVEd.**
- [X] T012 — `ResetPasswordForm.tsx`. **Matches diff, previously reviewed/APPROVEd.**
- [X] T013 — `LoginScreen.tsx` reset-flow modes. **Matches diff; first review round returned
  CHANGES_REQUESTED (Finding 1 blocking, Finding 2 non-blocking-but-must-resolve); both
  genuinely fixed in the Run 11 fix pass and re-reviewed APPROVE.**
- [X] T014 — `app/(auth)/login.tsx` wiring. **Matches diff, same CHANGES_REQUESTED → fix →
  APPROVE cycle as T013 (reviewed jointly).**
- [X] T015 — US2 manual smoke check. **This review.** Task itself carries no file diff (a
  manual-verification task per its own tasks.md text) — its "deliverable" is the honest record
  in `progress/impl_005-login.md` Run 12, independently checked above.

All of T008–T015 are marked `[X]` in `specs/005-login/tasks.md`, matching the actual state of the
repo. T016 (US3, Phase 5) and T017–T020 (Polish, Phase 6) correctly remain `[ ]` — out of this
checkpoint's scope, not silently completed or skipped.

## 4. `progress/review_005-login.md` history — every T008–T015 entry accounted for

Confirmed by re-reading this file's own history (grepped verdicts): T008/T009 → **APPROVE**;
T010 → **APPROVE**; T011/T012 → **APPROVE**; T013/T014 → **REQUEST CHANGES** (Finding 1 blocking:
unconditional mode-advance on a network failure; Finding 2 non-blocking-but-must-resolve: the
anti-enumeration confirmation was set-then-instantly-unmounted) → fix pass (Run 11) re-reviewed →
**APPROVE**. This is exactly the "one CHANGES_REQUESTED → fix → APPROVE cycle on T013/T014"
pattern this review was asked to confirm — no other T008–T015 entry in this file's history ends
in anything other than APPROVE, and the one CHANGES_REQUESTED cycle is fully closed (both findings
independently re-verified fixed in Section 1/this file's Run-11-fix-pass entry, and re-confirmed
present/correct again in Section 2 above).

## 5. `CHECKPOINTS.md` C1–C6 walkthrough (as relevant to this Phase-4-closing checkpoint)

- **C1**: [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist. [x]
  `docs/verification.md`/`docs/conventions.md` exist. [x] `.specify/memory/constitution.md`
  exists and is current. [x] `./init.sh` independently re-run this review: `RESULT: SUCCESS
  (10/10 stages)`.
- **C2**: [x] Exactly one feature (`005-login`) is `in_progress` in `feature_list.json`
  (confirmed by direct read — 001/004 `done`, 002/003 untouched). [x] `001`/`004` (`done`) remain
  unaffected — full suite green, none of their files touched by this checkpoint. [x]
  `progress/current.md` describes only the active `005-login` session (its "Next step" section
  still describes the pre-Run-12 plan for T015 — expected, since updating it to reflect this
  checkpoint's completion and the transition to Phase 5 is the orchestrator's bookkeeping job
  after this review lands, not a defect in this review's own scope).
- **C3**: [x] `src/domain` has zero React Native/Expo imports — unchanged this checkpoint (no
  code diff). [x] UI components call into `src/domain`/`src/lib` rather than embedding
  fetch/validation logic inline — re-confirmed by direct read of `LoginScreen.tsx`,
  `RequestPasswordResetForm.tsx`, `ResetPasswordForm.tsx` (zero `supabase.auth`/`createClient`
  calls in any of the three). [x] No platform-specific code introduced. [x] No direct
  Postgres/Redis/S3/Supabase-table access — only the SDK-wrapping functions from
  `src/lib/supabase-client.ts` (T010, already reviewed) are used. [x] No new global state
  library. [x] No stray `console.log`/context-free `TODO` — grepped the three files above plus
  `LoginScreen.test.tsx`, zero hits.
- **C4**: [x] Every exported `src/domain` function with logic has a covering unit test (unchanged
  this checkpoint, already true). [x] New/changed screens (`LoginScreen.tsx` et al.) have RNTL
  component tests asserting on rendered output — unchanged this checkpoint, already true and
  independently re-run above (301/301). [x] `./init.sh`'s three-target build-export stages
  (web/iOS/Android) all pass; native-dependency-alignment stage shows only the same two
  pre-existing, non-FAILing `WARN`s present in every prior checkpoint's run — not new, not
  FAILing.
- **C5**: [x] No suspicious untracked files — `git status --porcelain` shows only this feature's
  own expected in-progress files (unchanged in kind from every prior batch's review in this
  file). [ ] `progress/history.md` entry for a closed session — N/A, `005-login` is still
  `in_progress` (Phase 5/6 remain), the session has not closed yet; correctly not applicable at
  this checkpoint, consistent with every mid-feature batch's precedent in this file. [x]
  `feature_list.json` accurately reflects `005-login` as `in_progress`.
- **C6**: [x] `specs/005-login/` has `spec.md` + `plan.md` + `tasks.md`, all read fresh for this
  review. [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers. [ ] "Every `done` feature has
  all `tasks.md` items `[X]`" — N/A, `005-login` is not yet `done` (T016–T020 remain, correctly
  `[ ]`). [x] Every `FR-00x` this Phase touches (FR-007, FR-008, FR-009, and the Edge-Cases-level
  network-failure requirement that was the T013/T014 CHANGES_REQUESTED finding) is traced by at
  least one test referencing it — confirmed already true as of the T013/T014 re-review, unchanged
  this checkpoint (no code diff), and independently re-confirmed present in Section 2 above.

No C1–C6 box relevant to this checkpoint is empty in a way that blocks approval — the two `[ ]`
items (session-close history entry, "every `done` feature" FR-tasks-complete bullet) are both
correctly not-yet-applicable (feature still `in_progress`, Phase 5/6 outstanding), consistent
with every prior mid-feature-batch review's precedent in this file.

## Findings

None blocking. Run 12 is an honest, adequately-disclosed closing of User Story 2's checkpoint:
its central claim (Fix-1's network-failure-stays-in-mode behavior reproduced live) was
independently re-verified against the actual code and matches exactly; its disclosed gap
(`reset-with-code` unreachable live, no real Supabase project) is a genuine, structural
environment limitation — re-confirmed via a fresh read of `.env` — not a shortcut, and the
unit-test coverage it defers to was independently confirmed to exist, be already-reviewed, and
still pass; the iOS/Android skip repeats an already-accepted, already-disclosed gap from T007/Run
6 rather than introducing a new one. Type-check, the full 301-test suite, and a full `./init.sh`
(10/10 stages) all independently re-run and pass. All of T008–T015 are `[X]` in `tasks.md`, and
this file's own history shows every one of those tasks' reviews ending in APPROVE, with exactly
the one documented CHANGES_REQUESTED → fix → APPROVE cycle on T013/T014 — both of that cycle's
findings re-confirmed genuinely fixed and still intact in the current working tree.

## Verdict

**APPROVE**

Phase 4 (User Story 2 — forgot password) is complete: T008 through T015 are all implemented,
tested, and reviewed, with the one CHANGES_REQUESTED round on T013/T014 fully and verifiably
resolved. Run 12's manual smoke check is an honest closing record — every claim it makes was
independently checked against the actual code, the actual `.env` contents, and a fresh test/
type-check/`./init.sh` run, and none of it overstates what was actually verified. `005-login`
remains correctly `in_progress` (Phase 5 — User Story 3/T016 — and Phase 6 — Polish/T017–T020 —
are still outstanding and correctly `[ ]`); this checkpoint does not close the feature, only
Phase 4.

**What remains for the feature overall** (not blocking this checkpoint, noted for the next
batch): T016 (US3 create-account-link confirmation), T017 (accessibility pass), T018 (responsive
layout check), T019 (Supabase email-template prerequisite documentation), T020 (final `./init.sh`
end-to-end run) — all still `[ ]`, as expected.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

---

# Review — T016 (Phase 5, User Story 3 checkpoint — "Create account" link confirmation)

**Scope reviewed**: `specs/005-login/tasks.md` T016 only — a confirmation-only task (no new
source code). Claim under review (`progress/impl_005-login.md`, "Run — T016" section): (a)
`SignInForm.test.tsx` already asserts the "Create account" `<Link href="/register">`'s resolved
`href`, so no test change was needed; (b) `app/(auth)/register.tsx`,
`src/features/identity/RegistrationForm.tsx`, and `src/domain/registration.ts` remain
byte-for-byte unchanged by this entire feature.

## Independent verification performed

1. **Diff against the correct base.** `005-login` has zero commits ahead of `main`
   (`git log --oneline main..HEAD` empty; `git merge-base main HEAD` = `293746f`, i.e. `main`'s
   tip) — every change on this branch is uncommitted working-tree state. Ran exactly the
   requested command:
   ```
   git diff main -- "app/(auth)/register.tsx" "src/features/identity/RegistrationForm.tsx" "src/domain/registration.ts"
   ```
   Output: **empty**, confirming the claim. Cross-checked two independent ways: (i) `git status
   --porcelain` shows none of the three paths as modified or untracked; (ii) `git diff --stat
   main -- .` (whole-repo) lists exactly 8 changed tracked files —
   `feature_list.json`, `progress/current.md`, `src/domain/schemas.ts`/`schemas.test.ts`,
   `src/features/identity/useKycGate.ts`/`useKycGate.test.ts`,
   `src/lib/supabase-client.ts`/`supabase-client.test.ts` — none of which are the three named
   registration-family files. The one "import" the task description flagged for scrutiny
   (`SignInWithPassword`) is confirmed to be a pure `import type` in `src/domain/login.ts`
   (`import type { SignInWithPassword } from "./registration";` + a re-export), consuming a type
   that `registration.ts` already declared (`export type SignInWithPassword = (...) => ...`,
   line 125) as part of `001-registration-kyc`'s own pre-existing DI seam — zero lines added to
   `registration.ts` itself, consistent with the empty diff.

2. **`SignInForm.test.tsx` href assertion.** Read the file in full
   (`src/features/identity/SignInForm.test.tsx`, lines 93–101). It contains:
   ```tsx
   it("resolves the 'Create account' link's href to exactly /register", () => {
     const { getByRole } = render(<SignInForm onSubmit={jest.fn()} onForgotPassword={jest.fn()} />);
     const link = getByRole("link", { name: "Create account" });
     expect(link.props.href).toBe("/register");
   });
   ```
   This is a genuine, specific assertion — `toBe("/register")` on the resolved `href` prop of an
   element found by accessibility role `"link"` and accessible name `"Create account"`, not a
   weaker "link exists"/"text renders" check. The file's `expo-router` mock (lines 15–24) renders
   `<Link>` as an `accessibilityRole="link"` `Text` exposing the resolved `href` as a prop — the
   same pattern every `app/(auth)/*.test.tsx` already uses for `useRouter`, since a bare RNTL
   render has no live router context. This matches T016's own instruction ("if
   `SignInForm.test.tsx` does not already assert the link's resolved `href`, extend it to do so
   explicitly here") — it already did, from T003's original batch (previously reviewed/approved
   in this file's earlier entries), so correctly no test file was touched this run.

3. **`tasks.md` checkbox.** `specs/005-login/tasks.md:278` reads `- [X] T016 [US3] Confirm
   SignInForm's "Create account" ...` — confirmed marked `[X]`.

4. **Full test suite and type-check, independently re-run** (not trusted from the implementer's
   report):
   ```
   npx tsc --noEmit        → clean, exit 0
   npx jest                → Test Suites: 44 passed, 44 total; Tests: 301 passed, 301 total
   ```
   Matches the 44/301 figures claimed in `impl_005-login.md`'s Run for T016.

5. **Full `./init.sh` (no skip flags), independently re-run**:
   ```
   RESULT: SUCCESS (10/10 stages passed)
   ```
   Type-check clean; `expo-doctor`/native-dependency-alignment show only the same two
   pre-existing, non-blocking `WARN`s present in every prior checkpoint's run in this file
   (outdated-dependency advisories, not new); all three bundle exports (web/iOS/Android) clean.

## Requirement traceability

| FR | Requirement | Test(s) |
|---|---|---|
| FR-003 | "Create account" link navigates to `/register`, unmodified from `001-registration-kyc` | `SignInForm.test.tsx` → "resolves the 'Create account' link's href to exactly /register" (independently re-confirmed above, genuine assertion, not weakened); `app/(auth)/register.test.tsx` (unmodified, independently re-confirmed still passing in the 301-test run, proving `/register` itself still renders and behaves correctly) |

## `tasks.md` checklist status (through this checkpoint)

T001–T016 all `[X]`. T017–T020 (Phase 6, Polish) correctly `[ ]` — not in scope for this
checkpoint.

## `CHECKPOINTS.md` C1–C6 walkthrough

- **C1**: [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist. [x]
  `docs/verification.md`/`docs/conventions.md` exist. [x] `.specify/memory/constitution.md`
  exists and is current. [x] `./init.sh` independently re-run this review: `RESULT: SUCCESS
  (10/10 stages)`.
- **C2**: [x] Exactly one feature (`005-login`) is `in_progress` in `feature_list.json` (direct
  read confirms; `001`/`004` `done`). [x] `001`/`004` remain unaffected — untouched by this
  checkpoint's zero-diff confirmation, full suite green. [x] `progress/current.md` describes only
  the active `005-login` session (its "Next step" section still names Batch K/T016 as the
  upcoming step — expected, since updating it to reflect T016's completion and the transition to
  Phase 6 is the orchestrator's bookkeeping job after this review lands, not a defect in this
  review's own scope).
- **C3**: [x] `src/domain` has zero React Native/Expo imports — unchanged this checkpoint (no
  code diff at all; T016 touched no source file). [x] UI components call into
  `src/domain`/`src/lib` rather than embedding logic inline — unchanged, already true and
  previously reviewed. [x] No platform-specific code introduced. [x] No direct
  Postgres/Redis/S3/Supabase-table access. [x] No new global state library. [x] No stray
  `console.log`/context-free `TODO` introduced (zero diff).
- **C4**: [x] Every exported `src/domain` function with logic has a covering unit test (unchanged
  this checkpoint). [x] New/changed screens have RNTL component tests asserting on rendered
  output — unchanged, and the one test this checkpoint's claim rests on
  (`SignInForm.test.tsx`'s href assertion) independently re-verified as a real,
  rendered-output-level assertion, not an implementation-detail check. [x] `./init.sh`'s
  three-target build-export stages all pass; native-dependency-alignment shows only the same
  pre-existing non-FAILing `WARN`s as every prior checkpoint in this file.
- **C5**: [x] No suspicious untracked files — `git status --porcelain` shows only this feature's
  own expected in-progress files, unchanged in kind from every prior batch's review here. [ ]
  `progress/history.md` entry for a closed session — N/A, `005-login` is still `in_progress`
  (Phase 6/T017–T020 remain); correctly not applicable, consistent with every mid-feature batch's
  precedent in this file. [x] `feature_list.json` accurately reflects `005-login` as
  `in_progress`.
- **C6**: [x] `specs/005-login/` has `spec.md` + `plan.md` + `tasks.md`, all read fresh for this
  review. [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers. [ ] "Every `done` feature has
  all `tasks.md` items `[X]`" — N/A, `005-login` is not yet `done` (T017–T020 remain, correctly
  `[ ]`). [x] FR-003 (the only FR this checkpoint touches) is traced by at least one test
  referencing it, independently re-confirmed present and genuinely assertive, per the
  traceability table above.

No C1–C6 box relevant to this checkpoint is empty in a way that blocks approval — the two `[ ]`
items (session-close history entry, "every `done` feature" bullet) are both correctly
not-yet-applicable given the feature is still `in_progress` with Phase 6 outstanding, consistent
with every prior mid-feature-batch review's precedent in this file.

## Findings

None blocking, none non-blocking. This was a genuine confirmation-only task: no source file was
edited (only `tasks.md`'s own checkbox and `progress/impl_005-login.md`), and both of its two
claims were independently re-verified against the actual repo state rather than taken on the
implementer's word — the three-file zero-diff claim is objectively true (empty `git diff`
output, cross-checked two ways), and the href-assertion claim is objectively true and is a real,
specific `toBe("/register")` check, not a weakened placeholder. Full type-check, the full
301-test suite, and a full `./init.sh` (10/10 stages) were all independently re-run and pass.

## Verdict

**APPROVE**

Phase 5 (User Story 3 — new visitor creates an account from the sign-in screen) is now complete:
T016 is genuinely verified, not merely claimed. **All three user stories in `specs/005-login/`
are now implemented and reviewed** (US1/Phase 3 — sign-in + routing change; US2/Phase 4 —
forgot-password; US3/Phase 5 — create-account link). Only Phase 6 (Polish: T017 accessibility
pass, T018 responsive-layout check, T019 Supabase email-template documentation, T020 final
end-to-end `./init.sh`) remains before the feature as a whole can move to `done`. `005-login`
correctly remains `in_progress` in `feature_list.json` — this checkpoint does not close the
feature.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

---

## Review: T017, T018 (Phase 6 — Polish: accessibility pass, responsive layout check)

Scope: independently re-verify Run 13's (`task-implementer`, code-level audit) and Run 14's
(orchestrator, live browser verification) claims for T017/T018, per the reviewing agent's own
brief. Read `specs/005-login/spec.md` (FR-010, SC-003, Platform notes), `plan.md`,
`specs/005-login/tasks.md` (T017/T018 wording), `.specify/memory/constitution.md`,
`CHECKPOINTS.md`, and both Run 13 and Run 14 in full from `progress/impl_005-login.md`, fresh.

### Independent verification of Run 13's code-level claims

Read `SignInForm.tsx`, `RequestPasswordResetForm.tsx`, `ResetPasswordForm.tsx`, `LoginScreen.tsx`,
and `LoginScreen.test.tsx` directly (not the run's summary):

- `SignInForm.tsx`: `forgotPasswordButton` (line 197-202) and `createAccountLink` (line 225-233)
  styles both now declare `minWidth: 44` alongside their pre-existing `minHeight: 44` — confirmed
  exactly as claimed.
- `RequestPasswordResetForm.tsx`: `backButton` style (line 194-199) declares `minWidth: 44` —
  confirmed.
- `ResetPasswordForm.tsx`: `backButton` style (line 321-326) declares `minWidth: 44` — confirmed.
- `LoginScreen.tsx` (line 249): the "Signing you in…" `<Text>` now has
  `accessibilityRole="alert"` (was `"text"`), with an inline comment (lines 244-248) explaining
  the live-region rationale and referencing the sibling banners' precedent — confirmed exactly as
  claimed.
- `LoginScreen.test.tsx` (lines 107-117): the new test
  `"exposes the 'Signing you in…' view as an alert so assistive tech announces it"` asserts
  `getByRole("alert", { name: "Signing you in…" })` resolves after a successful sign-in. This is
  **not** a tautology — RNTL's `getByRole("alert", ...)` only matches an element whose
  `accessibilityRole` (mapped to ARIA `role` on web) is literally `"alert"`; had the fix not been
  applied (role still `"text"`), this assertion would fail with a "no element found" error. The
  test genuinely exercises the fixed line, not a placeholder.

All four style additions and the one behavioral/markup change match Run 13's stated diff exactly.
No unexplained discrepancy found.

### Independent assessment of Run 13's T018 "already compliant" verdict

Read the full `StyleSheet.create` blocks in all four files directly rather than trusting the
summary:

- `SignInForm.tsx`, `RequestPasswordResetForm.tsx`, `ResetPasswordForm.tsx`: each `container`
  style is `{ width: "100%", maxWidth: 420, gap: 16 }` — confirmed identical across all three,
  matching the claimed `RegistrationForm.tsx` percentage-width-plus-cap convention. Confirmed zero
  `flexDirection: "row"` anywhere in any of the three files (every field/button stacks via default
  flex-column). The only `paddingHorizontal` occurrences are `12` on the `input`/`TextInput` style
  in each file (a small fixed inset, not a layout-breaking width) — confirmed.
- `LoginScreen.tsx`'s `screen` style: `{ flex: 1, alignItems: "center", justifyContent: "center",
  padding: 24 }` — no fixed `width` of its own, confirmed; at a 375px viewport this leaves 327px of
  content width, comfortably under each child form's `maxWidth: 420` cap.

Run 13's "already compliant, no changes needed" verdict for T018 holds up under an independent
re-read — no hardcoded pixel width, no row-based layout, nothing that would overflow a 375px
viewport was found in any of the four files.

### Independent assessment of Run 14's live verification adequacy

Run 14 walked the real tab order in `sign-in` mode (Email → Password → "Forgot password?" → "Sign
in" → "Create account") and `request-reset` mode (Email → "Send reset code" → "Back to sign in"),
confirmed a real non-suppressed `outline` via `getComputedStyle`, and confirmed no horizontal
overflow at 375×812 and correct `maxWidth` capping at 1440×900 via `scrollWidth`/`clientWidth`
checks and screenshots. Two things were explicitly **not** covered live:

1. `reset-with-code` mode's tab order — disclosed as unreachable in this sandbox (needs a
   successful `requestPasswordReset` round-trip to a real inbox, unavailable here), consistent
   with the same disclosed gap in Run 12 (T015's manual smoke check). This is a reasonable,
   consistently-disclosed limitation, not silently glossed over — and Run 13's code-level read
   (source order: email → code → new password → submit → "Resend code" → "Back to sign in", no
   `tabIndex` irregularities) is a reasonable stand-in given the identical DOM-ordering pattern
   used by the other two modes, which *were* live-verified.
2. `sign-in`/`reset-with-code` were not individually re-screenshotted at 375px — Run 14 relies on
   the fact that all three forms share byte-for-byte the same `container` style object (verified
   above, independently, not just inferred). Given that identity is confirmed at the code level,
   inferring that a passing screenshot of `request-reset` at 375px generalizes to the other two is
   reasonable and disclosed, not a gap that should block this batch.

Both limitations are disclosed, reasonably scoped, and consistent with this repo's established
precedent for partial-environment manual verification (Runs 6/12). Neither blocks approval.

### Gap found independently — not caught by either Run 13 or Run 14 (non-blocking)

`ResetPasswordForm.tsx:145` — the `RESET_CODE_SENT_MESSAGE` confirmation `<Text>` uses
`accessibilityRole="text"`, not `"alert"`. This text is the first content a user sees the instant
`LoginScreen.tsx`'s `mode` flips from `"request-reset"` to `"reset-with-code"`
(`handleRequestReset`, `LoginScreen.tsx:150-165`) — i.e. `ResetPasswordForm`'s entire subtree
replaces `RequestPasswordResetForm`'s with **no user-initiated focus change**, exactly the same
category of transition Run 13 itself identified and fixed for `LoginScreen`'s "Signing you in…"
view ("this view mounts in place of SignInForm with no user-initiated focus change... needs
`accessibilityRole="alert"`"). Under Run 13's own stated reasoning, a screen-reader user who just
pressed "Send reset code" lands on an entirely new screen with no live-region announcement of
that fact — they'd have to manually explore to discover the flow advanced at all. This is a real,
if narrow, inconsistency in the audit's completeness (Run 13's own text scoped its "already uses
`alert`" claim only to `ResetPasswordForm`'s `generalError`, correctly *not* claiming this for
`confirmation` — so the write-up itself is not misleading, it's an omission, not a
misrepresentation).

Severity: **non-blocking nit**. FR-010's text is scoped to "every interactive element" (labels +
tap targets) — this is a static informational `<Text>`, not an interactive element, so it isn't a
literal FR-010 violation. It does bear on Constitution Principle VII's broader "respect platform
accessibility conventions" and on the same reasoning basis Run 13 itself used elsewhere in this
same task, so it should be picked up in a follow-up pass (T019 doc pass or a fast fix-in-place
commit) rather than blocking this batch.

### Confirm no other file changed beyond T017/T018's legitimate scope

Compared mtimes across every file this feature has touched. `SignInForm.tsx`,
`RequestPasswordResetForm.tsx`, `ResetPasswordForm.tsx`, `LoginScreen.tsx`, and
`LoginScreen.test.tsx` all cluster within the same ~20-second window (13:32:45–13:33:03), distinct
from every earlier file's mtime (`schemas.ts`, `supabase-client.ts`, `useKycGate.ts`,
`SignInForm.test.tsx`, `RequestPasswordResetForm.test.tsx`, `ResetPasswordForm.test.tsx`, etc. —
all from earlier runs, untouched in this window). This corroborates Run 13's "Files changed" list
exactly: no scope creep into T019/T020 or into any file outside the five named. No stray
`console.log`/context-free `TODO` found in any of the four component files (grepped directly).

### Independent re-run of type-check and full test suite

```
node_modules/.bin/tsc --noEmit
```
Clean, exit 0, no output.

```
npx jest
```
```
Test Suites: 44 passed, 44 total
Tests:       302 passed, 302 total
```
Matches Run 13's reported numbers exactly (44 suites / 302 tests, up from 301 with the one new
`LoginScreen.test.tsx` alert-role assertion). No test-tooling gap for this feature area, so
`docs/verification.md` Level 5 traceability applies and is satisfied (FR-010 traced by the
`minWidth`/`accessibilityRole` code-level evidence documented in Run 13, cross-checked directly
above, plus the new, genuinely assertive `LoginScreen.test.tsx` case).

### `tasks.md` checklist status (T017/T018 and surrounding context)

- [X] T017 — Accessibility pass. Confirmed genuinely done: findings fixed in place, verified
  directly above.
- [X] T018 — Responsive layout check. Confirmed genuinely done: "already compliant" verdict holds
  under independent re-read.
- [ ] T019 — Document Supabase email-template prerequisite + throwaway-client design. Correctly
  still open, out of this batch's scope.
- [ ] T020 — Final `./init.sh` end-to-end run. Correctly still open, out of this batch's scope.

### `CHECKPOINTS.md` C1–C6 walkthrough

- **C1**: [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist
  (confirmed present on disk). [x] `docs/verification.md` and `docs/conventions.md` exist
  (confirmed present). [x] `.specify/memory/constitution.md` exists and is current (v1.0.0, read
  fresh). [x] `./init.sh` — not re-run in full this pass (out of this batch's scope, reserved for
  T020); `progress/current.md` records the session's own prior `./init.sh` `RESULT: SUCCESS`
  (10/10 stages) runs, and this review independently re-ran the type-check and full jest suite
  (both clean), which are `init.sh`'s two most code-relevant stages for this batch.
- **C2**: [x] Exactly one feature (`005-login`) is `in_progress` in `feature_list.json`, confirmed
  by direct read — 001/004 `done`, 002/003 untouched/pending. [x] `005-login` is not yet `done`,
  so the "every done feature has passing tests" bullet is N/A; its own tests are green (confirmed
  above). [x] `progress/current.md` describes only this active session (`005-login`, T001-T020),
  no leftover content from a closed session.
- **C3**: [x] `src/domain` untouched by this batch (T017/T018 touched only
  `src/features/identity/*`) — zero RN/Expo imports there, unaffected. [x] The four touched
  components call into no new business logic; `LoginScreen.tsx`'s fixed accessibility markup is
  pure UI, not a data/validation change. [x] No platform-specific code introduced or touched by
  this batch — no `.ios.tsx`/`.android.tsx`/`.web.tsx` files involved. [x] No direct
  Postgres/Redis/S3/Supabase-table access introduced. [x] No new global state library. [x] No
  stray `console.log`/context-free `TODO` (grepped directly, none found).
- **C4**: [x] Every exported `src/domain` function already has covering tests (unchanged by this
  batch). [x] `LoginScreen.test.tsx`'s new case uses RNTL, asserts on rendered output
  (`getByRole("alert", ...)`), not an implementation detail. [x] `./init.sh`'s build-export stages
  not independently re-run this pass (see C1) — reserved for T020, the task explicitly scoped to
  that final full run.
- **C5**: [x] No suspicious untracked files found beyond the feature's own expected set (spec/plan/
  tasks/progress files, source files already accounted for in `git status`). [ ] N/A —
  `progress/history.md` session-close entry not applicable, `005-login` remains `in_progress`
  (T019/T020 outstanding), consistent with every prior mid-feature-batch review in this file.
  [x] `feature_list.json` accurately reflects `005-login` as `in_progress`.
- **C6**: [x] `specs/005-login/` has `spec.md` + `plan.md` + `tasks.md`, all read fresh for this
  review. [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers. [ ] N/A — "every done feature
  has all tasks.md items [X]" does not apply, `005-login` is not yet `done`. [x] FR-010 (the only
  FR this batch touches) is traced by direct code-level evidence (styles) plus a genuinely
  assertive test for its one behavioral component, independently re-confirmed above.

No C1–C6 box relevant to this batch is empty in a way that blocks approval — the two `[ ]` items
(session-close history entry, "every done feature" bullet) are correctly not-yet-applicable given
`005-login` is still `in_progress` with T019/T020 outstanding, consistent with every prior
mid-feature-batch review's precedent in this file.

## Findings

1. **Non-blocking nit** — `src/features/identity/ResetPasswordForm.tsx:145`: the
   `RESET_CODE_SENT_MESSAGE` confirmation text uses `accessibilityRole="text"` despite being a
   transitional, no-focus-change screen-swap message in the exact same category Run 13 itself
   identified and fixed for `LoginScreen.tsx`'s "Signing you in…" view. Recommend changing it to
   `accessibilityRole="alert"` in a fast follow-up (or folded into T019's polish pass) for
   consistency with the precedent this same task established elsewhere in this feature. Does not
   block this batch — it is a pre-existing (T012) gap, not something Run 13/14 introduced or
   regressed, and it is not a literal FR-010 violation (FR-010 is scoped to interactive elements).

No other findings. Both runs' claims were independently verified against the actual files, not
taken on the implementer's/orchestrator's word: the `minWidth: 44` additions and the
`accessibilityRole` change are exactly as claimed; the new `LoginScreen.test.tsx` assertion is
real and would fail without the fix; T018's "already compliant" verdict holds under a direct
re-read of all four files' style objects; Run 14's live-verification gaps (reset-with-code tab
order, no per-mode 375px re-screenshot) are reasonable, consistently-disclosed limitations, not
silent gaps; mtime clustering confirms no file outside the claimed five was touched in this batch;
type-check and the full 302-test suite are independently reconfirmed clean.

## Verdict

**APPROVE WITH NITS**

T017 and T018 are both genuinely complete: the accessibility-pass fixes (three `minWidth: 44`
additions, one `accessibilityRole` correction with a real, non-tautological regression test) and
the responsive-layout "already compliant" verdict both hold up under independent, direct
re-verification of the actual source files — not just the write-up. Run 14's live-browser
follow-up is adequate corroboration of Run 13's code-level audit, with its two disclosed gaps
(reset-with-code tab order, per-mode 375px screenshots) being reasonable and consistently
disclosed rather than silently skipped. One non-blocking accessibility nit was found
independently (`ResetPasswordForm.tsx`'s `RESET_CODE_SENT_MESSAGE` should arguably also be
`role="alert"`, by this same task's own established reasoning) — flagged for a fast follow-up,
not a blocker.

Type-check and the full test suite (44 suites / 302 tests) were independently re-run and are
clean, matching Run 13's reported numbers exactly.

`specs/005-login/` Phase 6 status: T017 `[X]`, T018 `[X]` genuinely earned. **Only T019
(document the Supabase "Reset Password" email-template `{{ .Token }}` prerequisite and the
throwaway-client design in `src/features/identity/README.md`) and T020 (final `./init.sh`
end-to-end run, no `--skip-*` flags) remain before `005-login` as a whole can move to `done`.**

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

---

# Review: T019 — README documentation (Supabase reset-password prerequisite + throwaway-client design)

**Reviewer**: code-reviewer (independent pass, no prior-conversation context)
**Scope**: `src/features/identity/README.md` only, per T019 (`specs/005-login/tasks.md:303-307`,
Phase 6 Polish).

## What changed

`git diff -- src/features/identity/README.md` shows two new `##` sections appended after the
existing one-paragraph file (previously untouched since `8b47e8c`, the single-Expo-codebase
collapse — this is the first `005-login`-era edit to this README):

1. **"Prerequisite: Supabase 'Reset Password' email template must include `{{ .Token }}`"**
2. **"Password-recovery: throwaway Supabase client, not the shared singleton"**

`git status --short` confirms the working tree's other modified/untracked files
(`schemas.ts`, `useKycGate.ts`, `supabase-client.ts`, the new domain/feature files, etc.) are
all from earlier `005-login` tasks (T001–T018), not this batch. Run 15's own "Files changed"
list in `progress/impl_005-login.md` (lines 2161–2186) claims exactly two files touched:
`src/features/identity/README.md` (content) and `specs/005-login/tasks.md` (checkbox only) —
confirmed accurate; no other file's diff/mtime is attributable to this task.

## 1. Supabase `{{ .Token }}` prerequisite — accuracy vs. spec.md

spec.md's Assumptions (lines 340–345) state this is a "one-time project-dashboard configuration
step" that "`plan.md`/`tasks.md` records ... as a documented prerequisite, not as application
code this feature can itself guarantee."

The README's new section matches this framing precisely: it names the exact dashboard path
("Authentication → Email Templates → Reset Password"), states plainly "**one-time,
per-Supabase-project, out-of-repo configuration step** — nothing in this app's code can set or
verify it, and there is no application-code fallback if it's missing," and even adds a
practical debugging pointer (check this setting first if a manually-tested email never contains
a code) that spec.md's Assumptions entry implies but doesn't spell out as a runbook step — a
reasonable, non-contradictory addition. It correctly notes this is "not tracked as a task in
`specs/005-login/tasks.md`" (true — no separate task exists to configure the Supabase dashboard
itself, only T019 to document the prerequisite). No inaccuracy found.

## 2. Throwaway-client design note vs. actual `src/lib/supabase-client.ts` code

Read `src/lib/supabase-client.ts` directly (lines 129–190, `createPasswordRecoverySession()`).
Confirmed against the README's claims:

- **"second, disposable `createClient(...)` instance"** — accurate: line 148,
  `const recoveryClient = createClient(supabaseUrl, supabaseAnonKey, {...})`, a wholly separate
  call from the module-level `export const supabase = createClient(...)` at line 51.
- **`persistSession: false, autoRefreshToken: false`** — accurate, verbatim match to lines
  150–152.
- **"never touches the module-level `supabase` singleton"** — accurate: `verifyCode`,
  `updatePassword`, and `discard` (lines 155–187) all close over `recoveryClient` only; no
  reference to the outer `supabase` binding anywhere in the function body.
- **Why**: the README's causal claim — `verifyOtp({ type: "recovery" })` establishes a real
  session as a side effect, and `KycGate` redirects the instant any session becomes visible on
  the shared singleton, so running verification on the shared client would race the user typing
  a new password — matches both the code's own inline comment (lines 129–142, "app/_layout.tsx's
  KycGate re-evaluates and redirects the instant ANY session becomes visible on the shared
  `supabase` singleton") and spec.md's Clarifications "Recorded default 2" (lines 70–86) nearly
  verbatim. Not an invented rationale — traceable to both artifacts independently.
- **Lifecycle claims**: "`LoginScreen.tsx` creates exactly one such instance per 'Forgot
  password?' attempt (`useState(() => createPasswordRecoverySession())`, lazily...)" and
  "`submitNewPassword()` always calls `discard()` ... once the attempt finishes, success or
  failure" — consistent with the code comment at lines 140–142 ("LoginScreen.tsx, T013, creates
  exactly one per 'Forgot password?' press") and the `discard` implementation (lines 181–187,
  best-effort `recoveryClient.auth.signOut()`, swallows errors). Not independently re-verified
  against `LoginScreen.tsx`'s/`passwordReset.ts`'s literal source in this pass (out of this
  task's stated file scope, and both were already reviewed in prior T013/T009 review rounds per
  the review file's own history), but nothing in this pass contradicts the claim, and the
  `supabase-client.ts` doc comment corroborates it independently.
- **"Do not refactor... to reuse the shared `supabase` export"** warning is a reasonable,
  accurate anti-regression note given the race condition just documented — not overstated.

No inaccuracy or unsupported claim found in this section.

## 3. Structural/tone consistency with the existing README

The pre-existing file (`src/features/identity/README.md:1-5`) is a single terse paragraph
mirroring the backend module and pointing at `src/domain`/`src/lib`/`specs/`. The two new
sections follow the house style already established by `src/features/navigation/README.md`
(the only other `src/features/*` README with prose beyond the one-paragraph template): `##`
section headers, short paragraphs, explicit `specs/<feature>/spec.md`/`plan.md` citations by
name rather than paraphrase-without-attribution, and a closing directive/warning paragraph
(navigation's README doesn't have a "do not" warning, but identity's own prior
`001-registration-kyc`-era content in this same file already uses a similarly direct,
imperative tone elsewhere in the codebase's other feature READMEs — consistent, not a stylistic
outlier). No em-dash-free/markdown-lint issues found; renders as clean GFM.

## 4. No other file changed in this batch

Confirmed via `git diff -- src/features/identity/README.md` (isolated diff, clean) and
`git status --short` (all other modifications attributable to earlier `005-login` tasks,
already reviewed in prior rounds of this same review file). `specs/005-login/tasks.md`'s T019
checkbox flip (`- [X] T019` at line 303) is the only other file this task's own report claims
to touch, and that's an expected, in-scope bookkeeping edit for a tasks.md checklist item, not
a scope violation.

## Independent verification (re-run, not trusted from the report)

```
npx tsc --noEmit
```
→ clean, exit 0, no diagnostics.

```
npx jest
```
→
```
Test Suites: 44 passed, 44 total
Tests:       302 passed, 302 total
Snapshots:   0 total
Time:        1.584 s, estimated 2 s
```
Matches Run 15's reported numbers exactly. Docs-only change, as expected, has zero effect on
either check.

## Requirement traceability

Not applicable — T019 carries no `(FR-...)` tag in `tasks.md` (documentation task, not a
functional-requirement implementation task), consistent with `docs/verification.md` Level 5's
scope (which applies to tests referencing FRs, not to README prose).

## `tasks.md` checklist status

T001–T019 all `[X]`. T020 (`./init.sh` end-to-end, no `--skip-*` flags) remains `[ ]` — the only
task left before `005-login` can move to `done`.

## CHECKPOINTS.md C1–C6 walkthrough

Feature status is `in_progress` (`feature_list.json`), not yet `done` — T020 (the final,
full-repo `init.sh` run) is exactly the task that will produce fresh evidence for several of
these boxes (build-export checks, native dependency alignment, session-close hygiene). A full
C1–C6 sign-off is premature before T020 runs; noting current state per-box, scoped to what's
checkable/relevant to this docs-only task today:

- **C1**: `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist — [x].
  `docs/verification.md`/`docs/conventions.md` exist — [x]. `.specify/memory/constitution.md`
  exists — [x]. `./init.sh` exits 0 — [ ] not re-run in this pass (that's T020's own job, not
  this review's; `tsc --noEmit` and `jest` were independently re-run above and are clean, but
  that's not the same as a full `init.sh` pass including bundle exports).
- **C2**: exactly one feature (`005-login`) `in_progress` — [x] (confirmed via
  `feature_list.json`). Every `done` feature has passing tests — [x] (302/302 passing, no
  regressions). `progress/current.md` describes only the active session — [ ] not
  re-inspected in this pass (out of this task's file scope; no evidence of a problem, just not
  re-checked here).
- **C3**: `src/domain` stays RN/Expo-import-free — [x] (this task touches no `src/domain` code
  at all). UI calls into domain/lib rather than embedding logic — [x] (docs-only, N/A).
  Platform-specific code uses the file-convention/`Platform.select` — [x] (N/A, no code
  changed). No direct Postgres/Redis/S3/Supabase-table access — [x] (`README.md` accurately
  documents the existing SDK-only design; introduces no new access pattern). No new global
  state library — [x] (N/A). No stray `console.log`/context-free `TODO` — [x] (README has none).
- **C4**: every exported `src/domain` function has a covering test — [x] (unaffected by this
  docs change; prior rounds already confirmed this for T001–T018's actual code). New/changed
  screens have component tests — [x] N/A, no screen changed. `init.sh` build checks for all
  three targets — [ ] deferred to T020, not re-run here.
- **C5**: no suspicious untracked files — [x] (git status shows only expected `005-login`
  in-progress artifacts, no `.tmp`/cache/log stragglers). `progress/history.md` entry for the
  closed session — [ ] not applicable yet; the session (feature) isn't closed until T020.
  Last feature worked on reflected accurately in `feature_list.json` — [x].
- **C6**: `005-login` (`sdd: true`, `in_progress`) has `spec.md` + `plan.md` + `tasks.md` — [x]
  (all present under `specs/005-login/`). `spec.md` has no open `[NEEDS CLARIFICATION]` markers
  — [x] (both Clarifications entries are recorded defaults with explicit human-confirmation
  flags, not open markers, per spec.md's own Status line). Every `done` feature's `tasks.md`
  fully `[X]` — N/A, `005-login` isn't `done` yet (T020 outstanding by design). Every `FR-00x`
  covered by a referencing test — [x] for the FRs T001–T018 touch (already confirmed in prior
  review rounds); T019 itself maps to no FR, correctly not claimed as FR-covered.

None of the `[ ]` boxes above are blocking for a documentation-only Polish task: they are
either explicitly T020's own responsibility (the final `init.sh` run, session-close bookkeeping)
or out of this task's declared file scope and unaffected by a two-section README addition.

## Findings

None blocking. No inaccuracies found in either new README section against `spec.md` or the
actual `src/lib/supabase-client.ts` source; no scope creep; style consistent with the
established `src/features/*` README convention; type-check and full test suite independently
reconfirmed clean and unaffected, as expected for a docs-only change.

## Verdict

**APPROVE**

T019 is complete and accurate: both new `src/features/identity/README.md` sections were checked
directly against `specs/005-login/spec.md` (Assumptions, Clarifications "Recorded default 2")
and against `src/lib/supabase-client.ts`'s actual `createPasswordRecoverySession()`
implementation, not just the task description — no drift between documentation and reality was
found. The batch touched exactly the files it claimed to (`README.md` content,
`tasks.md` checkbox), and independently re-run `tsc --noEmit`/`npx jest` are clean (44/44 suites,
302/302 tests), matching the implementer's reported numbers.

**This is the second-to-last task for `005-login`.** Only **T020** — running `./init.sh`
end-to-end (no `--skip-*` flags) and confirming `RESULT: SUCCESS` with the Tests stage OK,
type-check clean, and all three bundle exports (web/iOS/Android) clean — remains before this
feature can move to `done`. T020 is also where several of the C1/C4/C5 checkpoint boxes left
`[ ]` above should get their real, final evidence (full build-export/native-dependency-alignment
check), not just the narrower `tsc`+`jest` re-check this docs-only review performed.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

---

# FINAL FEATURE-LEVEL REVIEW — 005-login (all 20 tasks, T001–T020)

**Reviewed**: 2026-08-05 (fresh, no prior-conversation context — read `spec.md`, `plan.md`,
`tasks.md`, the constitution, `CHECKPOINTS.md`, this entire review file's prior 8 rounds, and
all 20 `progress/impl_005-login.md` runs directly from disk before writing this).

**Scope**: The feature as a whole, not a re-litigation of any individual task. All 20 tasks were
already independently reviewed (8 review rounds above: T001/T002, T003/T004, T005, T006 + FR-002
regression follow-up, T007, T008/T009, T010, T011/T012, T013/T014 [REQUEST CHANGES → fix →
APPROVE], T015, T016, T017/T018, T019). This entry is the gate before `feature_list.json` can be
flipped from `in_progress` to `done`.

## `tasks.md` status

`specs/005-login/tasks.md` read fresh from disk: **T001 through T020 are all `[X]`**, 20/20. No
open checkbox anywhere in the file. Matches every review round's own tracking.

## 1. FR-001..FR-010 traced to real, passing tests (independently re-confirmed, not assumed)

| FR | Requirement (spec.md) | Test(s) confirmed by direct grep + read |
|---|---|---|
| FR-001 | Email+password sign-in at `/login`, reusing `signInWithPassword()`, no second sign-in code path | `src/domain/schemas.test.ts` `signInSchema` block; `src/domain/login.test.ts` all 3 `submitSignIn` cases; `src/features/identity/SignInForm.test.tsx` ("calls onSubmit with the exact typed SignInInput payload"); `app/(auth)/login.test.tsx` ("a successful submission reaches the real signInWithPassword with the exact submitted email/password") |
| FR-002 | `KYC_ROUTE_TARGETS.unauthenticated` changed to `/login`, `resolveKycRoute()`/other entries unchanged | `src/features/identity/useKycGate.test.ts:99` `it("maps the unauthenticated route to /login (FR-002)")` — added as a direct follow-up to Finding 1 of the T006 review, now present and passing |
| FR-003 | "Create account" link navigates to `/register`, unmodified | `SignInForm.test.tsx` ("the 'Create account' link's resolved href is exactly /register") |
| FR-004 | Single generic, non-field-specific inline error for a credentials rejection | `SignInForm.test.tsx` ("a serverError renders as ONE general inline error, not a per-field one"); `LoginScreen.test.tsx`; `app/(auth)/login.test.tsx` ("an SDK-rejected submission... surfaces inline") |
| FR-005 | Network-level failure distinct from a credentials rejection, reusing `NETWORK_SIGN_IN_ERROR_MESSAGE` | `LoginScreen.test.tsx` ("a network-level failure... renders distinctly from a credentials error") |
| FR-006 | No hardcoded post-login destination; neutral "Signing you in…" state; never navigates | `LoginScreen.test.tsx` (replaces `SignInForm`, asserts `mockReplace`/`mockPush` never called); `app/(auth)/login.test.tsx` (same guard at the real-SDK-call boundary) |
| FR-007 | "Forgot password?" entry point, no route change, anti-enumeration | `RequestPasswordResetForm.test.tsx`; `src/domain/passwordReset.test.ts` `requestPasswordReset` block; `LoginScreen.test.tsx` mode-sequence tests |
| FR-008 | Submit code + new password (≥8 chars), never establishes a session on the shared client | `src/domain/passwordReset.test.ts` `submitNewPassword` block (verify→update→discard happy path, verify-failure, update-failure, all asserting `discard` runs); `ResetPasswordForm.test.tsx`; `LoginScreen.test.tsx`/`app/(auth)/login.test.tsx`'s explicit regression guard asserting the shared `signIn` mock records zero calls during `"reset-with-code"` |
| FR-009 | Cooldown-limited resend, mirroring `VerifyPhoneScreen`'s pattern | `ResetPasswordForm.test.tsx` ("pressing 'Resend code' calls onResend and disables for the cooldown window") |
| FR-010 | Real a11y label + ≥44×44 tap target on every interactive element; usable at 375px–desktop and phone/tablet | Direct grep: every `Pressable`/`TextInput`/`Link` in `SignInForm.tsx`, `RequestPasswordResetForm.tsx`, `ResetPasswordForm.tsx` carries `accessibilityLabel` + `minHeight: 44`/`minWidth: 44` (confirmed by direct read, not assumed); `LoginScreen.test.tsx:116` (`getByRole("alert", { name: "Signing you in…" })`) is a real, non-vacuous regression test added in T017's fix pass; T018's responsive-layout pass verdict ("already compliant") independently re-confirmed by the T017/T018 review round against the actual style objects |

All ten FRs have at least one real, executable test referencing or exercising them, independently
re-confirmed by direct grep/read in this session (not taken on any prior round's word). Level 5
traceability (`docs/verification.md`) is satisfied for the feature as a whole.

## 2. The three human-approved scope decisions — re-verified independently against current code

1. **Password reset goes through `supabase.auth.resetPasswordForEmail()` directly, never the
   backend's `POST /identity/password-reset`.** Grepped the entire `src/`/`app/` tree for
   `password-reset` and `resetPasswordForEmail`: every hit is either the Supabase SDK call itself
   (`src/lib/supabase-client.ts:122`, wrapped by `requestPasswordReset()`) or a comment/test
   description referencing it. Zero calls to any `/identity/password-reset` backend path, zero
   `fetch`/`api-client` calls anywhere in this feature's files. **Confirmed exactly as approved
   (Recorded default 1).**
2. **The entire forgot-password flow stays as local view-state on `/login`, no new route.**
   `find app -iname "*reset*" -o -iname "*forgot*"` returns nothing — no `/reset-password` or
   similar file exists anywhere under `app/`. `app/(auth)/` contains only `login.tsx`,
   `register.tsx`, `verify-phone.tsx`, `profile.tsx`, `kyc-status.tsx` plus their tests — no new
   route file. `LoginScreen.tsx`'s `mode` state (`"sign-in" | "request-reset" | "reset-with-code"`)
   is the entire mechanism, confirmed by direct read. **Confirmed exactly as approved (Recorded
   default 2).**
3. **The KYC gate diff is exactly the one line.** `git diff main -- src/features/identity/useKycGate.ts`
   shows exactly one changed line: `unauthenticated: "/register"` → `unauthenticated: "/login"`.
   `git diff main -- src/domain/kyc-gate.ts app/_layout.tsx` produces **empty output on both
   files** — byte-for-byte unchanged from `main`, independently re-run in this session, not
   trusted from any prior round's claim. **Confirmed exactly as approved.**

## 3. Social sign-in and "remember me" — confirmed NOT built

`grep -rniE "google|apple|oauth|remember.?me|rememberMe" src/features/identity app/(auth)`
returns zero hits. No OAuth provider call, no persistence-toggle UI, no "remember me" checkbox
anywhere in this feature's diff. Session persistence remains exactly `001`'s pre-existing
`expo-secure-store` adapter, untouched. **Confirmed out of scope, as the human decided.**

## 4. `CHECKPOINTS.md` C1–C6 — walked for the feature as a whole

- **C1 — harness complete**
  - [x] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist (confirmed
    present on disk).
  - [x] `docs/verification.md` and `docs/conventions.md` exist (read fresh, both current).
  - [x] `.specify/memory/constitution.md` exists, current (v1.0.0, last amended 2026-08-02).
  - [x] `./init.sh` exits 0 — independently re-run in this session, full/unflagged:
    `RESULT: SUCCESS (10/10 stages passed)`. Only the two pre-existing, non-blocking
    `expo-doctor`/native-dependency-alignment `WARN`s (outdated `expo-image-picker`/
    `react-native`/`react-native-safe-area-context`/`@types/react`/`typescript` pins), identical
    to every prior batch's and to `004-home-scan-shell`'s own final review — not introduced by
    this feature.
- **C2 — state is coherent**
  - [x] Exactly one feature (`005-login`) is `in_progress` in `feature_list.json`, confirmed by
    direct read.
  - [x] `001-registration-kyc` and `004-home-scan-shell` (`done`) still have passing tests — full
    suite green (302/302), neither feature's test files touched by this diff.
  - [x] `progress/current.md` — not re-inspected line-by-line in this final pass (out of this
    review's file scope per the review brief, and every prior round confirmed it describes only
    the active `005-login` session); no evidence of a problem.
- **C3 — code respects the architecture**
  - [x] `src/domain` (`login.ts`, `passwordReset.ts`, `schemas.ts` additions) has zero React
    Native/Expo imports — confirmed by direct grep of every new `src/domain` file's `import`
    lines this session: only `zod` and sibling `src/domain` modules.
  - [x] UI components (`SignInForm.tsx`, `RequestPasswordResetForm.tsx`, `ResetPasswordForm.tsx`,
    `LoginScreen.tsx`, `app/(auth)/login.tsx`) call into `src/domain`/`src/lib` rather than
    embedding fetch/validation/SDK calls inline — grepped all five files for `supabase.auth`/
    `createClient`/`fetch(`: zero hits outside `src/lib/supabase-client.ts` itself, which is the
    one file constitutionally permitted to hold them.
  - [x] No platform-specific code introduced anywhere in this feature (no `.ios.tsx`/`.android.tsx`/
    `.web.tsx` file, no inline `Platform.OS` branching) — matches `plan.md`'s explicit design
    goal of avoiding platform divergence.
  - [x] No direct Postgres/Redis/S3/Supabase-table access — every Supabase touch point goes
    through the SDK (`supabase.auth.*`), confirmed above; no backend HTTP call of this feature's
    own exists anywhere (confirmed by grep for `api-client`/`fetch` in every new file: none).
  - [x] No new global state library — local `useState` only, matching the constitution's
    technology-stack section.
  - [x] No stray `console.log`/context-free `TODO` — grepped every new/modified file in this
    feature's diff this session: zero hits.
- **C4 — verification is real**
  - [x] Every exported `src/domain` function with logic (`submitSignIn`, `requestPasswordReset`,
    `submitNewPassword`, the four new schemas) has a covering unit test — confirmed above (FR
    table) and by direct suite re-run.
  - [x] Every new/changed screen (`SignInForm`, `RequestPasswordResetForm`, `ResetPasswordForm`,
    `LoginScreen`, `app/(auth)/login.tsx`) has component tests using React Native Testing
    Library, asserting on rendered output (testIDs, roles, exact call arguments) — independently
    re-read several of these test files this session; they assert real rendered behavior, not
    "didn't throw."
  - [x] `./init.sh`'s three-target build-export stages (web/iOS/Android) all pass, independently
    re-run this session; native-dependency-alignment stage is `WARN`, not `FAIL` (pre-existing,
    unrelated to this feature).
- **C5 — the session closed well**
  - [x] No suspicious untracked files — `git status --porcelain` (re-run this session) shows
    only the feature's own expected source/test/spec/progress files; no `.tmp`, no stray cache
    artifacts, no unexplained logs.
  - [ ] `progress/history.md` — not independently re-opened in this pass; this is the
    orchestrator's job to close out once this review lands and the feature is actually flipped to
    `done` (per this review's own instructions, marking `tasks.md`/`feature_list.json`/
    `progress/history.md` is explicitly NOT this review's job). Not a blocker for this review's
    own verdict — flagged as the orchestrator's next step.
  - [x] The last feature worked on (`005-login`) is reflected accurately in `feature_list.json`
    (`in_progress`, correct branch, correct `spec_dir`).
- **C6 — Spec Driven Development**
  - [x] `005-login` (`sdd: true`, `in_progress`) has `specs/005-login/spec.md` + `plan.md` +
    `tasks.md`, all present, all read fresh for this review.
  - [x] `spec.md` has no open `[NEEDS CLARIFICATION]` markers — the two "Recorded default" entries
    are resolved defaults with a documented alternatives table, not blocking markers, per the
    file's own `Status` line and consistent with every prior round's reading.
  - [x] `tasks.md` — all 20 items marked `[X]`, confirmed by fresh direct read at the top of this
    review (this is the first review round where this bullet is actually gradeable — the feature
    is now complete — and it passes).
  - [x] Every `FR-00x` in `spec.md` is covered by at least one test referencing it — confirmed in
    Section 1 above, independently, not assumed from any prior round's table.

**No C1–C6 box is empty in a way that blocks approval.** The one `[ ]` (C5's `progress/history.md`
session-close entry) is explicitly the orchestrator's post-review responsibility per this review's
own brief, not a code/verification gap this review is grading.

## 5. Overall test suite and build health — independently re-run in this session

```
node_modules/.bin/tsc --noEmit
```
Clean, exit 0, no output.

```
npx jest
```
```
Test Suites: 44 passed, 44 total
Tests:       302 passed, 302 total
```

```
./init.sh   (full, unflagged — no --skip-* flags)
```
```
RESULT: SUCCESS (10/10 stages passed)
```
All mandatory stages (prerequisites, env, install, type-check, tests, and all three bundle
exports — web/iOS/Android) green. The two `WARN` stages (`expo-doctor`, native dependency
alignment) are pre-existing dependency-version drift unrelated to this feature — identical
warnings already recorded as pre-existing in `004-home-scan-shell`'s own final review, not
introduced by `005-login`. These numbers match `progress/impl_005-login.md`'s Run — T020 report
exactly; independently reproduced, not taken on the implementer's word.

## 6. Honest accounting of what was and wasn't verified live

**What WAS verified live (real browser, `npm run web`, T007/Run 6)**:
- Cold boot with no active session lands on `/login`, not `/register` (US1 AS1) — confirmed via
  `window.location.href`.
- The "Create account" link's resolved `href` is `/register` (US3).
- Client-side validation blocks a malformed email before any network call (`signInSchema`
  genuinely runs, confirmed via `read_network_requests` showing zero requests).
- An unregistered email + any password produces exactly one general inline error (not per-field)
  — though the actual text shown in this sandbox was a raw `"Failed to fetch"` string rather than
  the polished `NETWORK_SIGN_IN_ERROR_MESSAGE` copy, because this environment's Supabase
  credentials are empty placeholders (`EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` both `""`), so every
  submission — registered or not — hits the same unreachable host. This is a pre-existing,
  disclosed environment gap inherited from `001`, not a `005-login` defect (`signInWithPassword`
  is reused byte-for-byte unmodified).
- "Forgot password?" switches local state with no URL change (`window.location.href` stays
  `/login` throughout).

**What remains covered ONLY at the unit/component-test level, NOT re-confirmed against a live
Supabase project or real device in this environment**:
- **Credentials differentiation**: a wrong-password rejection and an unregistered-email rejection
  producing the identical generic Supabase error message (US1 AS4) — this specific claim requires
  a real Supabase Auth response and was not exercised live; covered instead by
  `LoginScreen.test.tsx`'s mocked-credentials-rejection test.
- **Successful sign-in's actual landing screen** (US1 AS3 — the documented "couldn't load your
  verification status" retry screen, not the main app) — no real registered account was reachable
  in this sandbox to sign in with; covered instead by `LoginScreen.test.tsx`/
  `app/(auth)/login.test.tsx`'s mocked-success tests plus `useKycGate.test.ts`'s pre-existing,
  unmodified `statusFetchFailed` → `"kyc-status"` coverage.
- **The full `reset-with-code` happy path** (request a code → receive a real email → enter the
  real code + a new password → confirm the OLD password now fails and the NEW one works) — never
  run against a live Supabase project with real email delivery in this environment (T015/Run 12
  disclosed this explicitly); covered instead by `passwordReset.test.ts`'s full mocked
  verify→update→discard sequence and `LoginScreen.test.tsx`'s mode-transition + shared-client
  never-touched regression guards.
- **iOS Simulator**: not exercised at all for this feature (Xcode not selected on this machine,
  disclosed in T007/Run 6 — same environment constraint, not new to this feature).
- **Android**: never exercised (no emulator/SDK available in this environment, consistent with
  every prior feature in this repo).

**Is this an acceptable state to ship?** Yes, with the caveat stated plainly rather than implied.
This mirrors — does not introduce — the exact environment gap `001-registration-kyc` already
disclosed and shipped under (no live Supabase credentials, no iOS/Android device access in this
sandbox). The specific things this repo's "green tests, broken app" history warns about — a
screen that renders but a handler that's wired wrong, a regression a mock would hide — were
specifically targeted by this feature's own process: the T013/T014 round genuinely caught a real
correctness bug (`handleRequestReset` silently swallowing a network failure, violating a
spec-documented Edge Case) through code-level scrutiny, not a live click-through, and the fix was
independently re-verified before approval. The credentials-differentiation and successful-sign-in
gaps are not new-code risk (they exercise the reused, `001`-hardened `signInWithPassword()`
unchanged) — they are the same live-backend/live-device access limitation this whole repo has
operated under since `001`. What this state does **not** cover, and should be flagged to the
human before or shortly after merge: nobody has yet watched the real `reset-with-code` flow work
end-to-end against a live Supabase project with a real emailed code — that is the one genuinely
new, previously-unexercised runtime path this feature introduces (the throwaway-client design,
`verifyOtp`/`updateUser` against a second `createClient()` instance), and it is exactly the kind
of thing this repo's `docs/verification.md` Level 3 note ("manual iOS testing found two real bugs
that 174 passing tests did not") warns is not guaranteed by tests alone. Recommend recording this
explicitly as a known post-merge follow-up (a real manual pass against a live Supabase project),
not silently treating "302 tests pass" as equivalent to "the reset-with-code flow has been seen
working."

## 7. `feature_list.json` state

Confirmed by direct read this session:
- `001-registration-kyc`: `"status": "done"`. ✓
- `002-kyc-document-verification`: `"status": "pending"`, untouched by this feature. ✓
- `003-registration-kyc-completion`: `"status": "pending"`, untouched by this feature. ✓
- `004-home-scan-shell`: `"status": "done"`. ✓
- `005-login`: `"status": "in_progress"` — **not yet flipped to `done`**, correctly left for the
  orchestrator to do after this review, per this review's own instructions.

## Overall verdict

**READY TO BE MARKED `done`.** All 20 tasks are genuinely complete, not just checkbox-complete:
every `FR-001`–`FR-010` traces to a real, independently-reconfirmed test; all three human-approved
scope decisions (direct-SDK password reset, no-new-route forgot-password flow, the one-line KYC
gate diff) hold exactly as approved, verified byte-for-byte against `main` in this session; social
sign-in and "remember me" are confirmed absent; every C1–C6 checkpoint box is either `[x]` or a
genuinely non-blocking, correctly-scoped `[ ]` (the orchestrator's own post-review bookkeeping);
type-check, the full 302-test suite, and a full unflagged `./init.sh` (10/10 stages) all pass,
independently re-run in this session rather than trusted from any prior claim. The one documented
`REQUEST CHANGES` round (T013/T014, a genuine spec-correctness gap — a silently-swallowed
network failure during the reset-request step) was fixed substantively, not shortcut-patched, and
re-verified before its `APPROVE`.

The one thing worth surfacing explicitly to the human before or shortly after merge (not a
blocker, per Section 6 above): the `reset-with-code` happy path's real, live-Supabase,
real-emailed-code behavior has never actually been watched working end-to-end in this environment
— only its component/unit-test-level mocked equivalents have. Recommend a real manual pass against
a live Supabase project (and, when device access is available, iOS/Android) as a near-term
follow-up, tracked wherever this repo tracks that kind of post-merge verification debt — not a
reason to withhold `done` status given the identical, already-accepted precedent set by `001`'s
own live-backend/live-device gaps.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
