# Identity feature module

Mirrors the backend's `identity` module. Screens/components for this domain live here,
built on top of `src/domain` (portable logic) and `src/lib` (Expo-specific wiring). See
`specs/` at the project root for the spec defining what belongs here.

## `PerfilPlaceholderScreen.tsx` is not `ProfileForm.tsx`

`PerfilPlaceholderScreen.tsx` (specs/008-scan-experience T029) is a contentless placeholder
reserving the shell's Perfil destination (`app/(app)/perfil.tsx`) for a future profile-view
feature — no real profile data, no form fields, no shared code with `ProfileForm.tsx`.
`ProfileForm.tsx` is a wholly separate component: the registration flow's form for
collecting/submitting profile data during KYC onboarding. The two are never rendered
interchangeably and should not be merged.

## Prerequisite: Supabase "Reset Password" email template must include `{{ .Token }}`

`005-login`'s forgot-password flow (`RequestPasswordResetForm.tsx` / `ResetPasswordForm.tsx` /
`LoginScreen.tsx`) has the user type a 6-digit code rather than follow an emailed link
(`specs/005-login/spec.md`'s Clarifications, "Recorded default 2" — a magic-link/deep-link
flow would race `app/_layout.tsx`'s `KycGate` redirect, so it was ruled out). That code only
shows up in the email if the Supabase project's dashboard, under **Authentication → Email
Templates → Reset Password**, has `{{ .Token }}` in the template body — by default Supabase's
template only includes `{{ .ConfirmationURL }}` (a link, no code).

This is a **one-time, per-Supabase-project, out-of-repo configuration step** — nothing in this
app's code can set or verify it, and there is no application-code fallback if it's missing (a
user who requests a code from a misconfigured project gets an email with no code to enter, and
`ResetPasswordForm` has no way to detect that). If the forgot-password flow's emailed message
never contains a code during manual verification, check this setting before assuming a code
path in the app is broken. Recorded as an Assumption in `specs/005-login/spec.md`, not tracked
as a task in `specs/005-login/tasks.md` for that reason.

## Password-recovery: throwaway Supabase client, not the shared singleton

`src/lib/supabase-client.ts`'s `createPasswordRecoverySession()` builds and returns a
**second**, disposable `createClient(...)` instance (`persistSession: false,
autoRefreshToken: false`), bound to its own `verifyCode`/`updatePassword`/`discard` functions
— it never touches the module-level `supabase` singleton that export file's other functions
(`signInWithPassword`, `requestPasswordReset`) and `useKycGate()` share. This is deliberate,
not an oversight or dead-code candidate to consolidate:

`supabase.auth.verifyOtp({ type: "recovery" })` establishes a real (if temporary) session as a
side effect of succeeding. `app/_layout.tsx`'s `KycGate` re-evaluates and redirects the instant
*any* session becomes visible on the shared `supabase` singleton — so if the code-verification
step ran on that singleton, a successful `verifyOtp` would hand control to the gate (and
possibly navigate the user away from `/login`) before they've had a chance to type their new
password. Using a wholly separate client instance keeps that intermediate session invisible to
`useKycGate()` entirely; `LoginScreen.tsx` creates exactly one such instance per
"Forgot password?" attempt (`useState(() => createPasswordRecoverySession())`, lazily — not on
every `/login` mount) and `src/domain/passwordReset.ts`'s `submitNewPassword()` always calls
`discard()` (`recoveryClient.auth.signOut()`) once the attempt finishes, success or failure, so
the throwaway session never lingers. Full trace: `specs/005-login/spec.md`'s Clarifications,
"Recorded default 2"; `specs/005-login/plan.md`'s "Password-reset confirmation" Research
Decision.

**Do not** refactor `createPasswordRecoverySession()` to reuse the shared `supabase` export, or
route `verifyCode`/`updatePassword` through it — that reintroduces the exact gate-race this
design exists to avoid.
