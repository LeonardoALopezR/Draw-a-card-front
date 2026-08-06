# Verification — how to prove a change works

> Golden rule: an agent doesn't say "this works," it demonstrates it. Every task ends with
> executable evidence, not a claim. This is the single source of truth for what "verified"
> means in this repo — `task-implementer` and `code-reviewer` both point here instead of
> each carrying their own copy of these rules.

## Test tooling isn't installed yet

As of this writing, `package.json` has no `test` script and no test runner is a dependency.
**The first `"sdd": true` feature whose tasks require tests must set this up as part of that
feature** (typically `jest` + `jest-expo` + `@testing-library/react-native` — the standard
combination for Expo/RN projects) rather than assuming it already exists. Document that setup
in the feature's `plan.md`/`tasks.md` like any other task. Until then, `init.sh` reports "no
test script" as a warning, not a failure — don't read that warning as permission to skip
verification, read it as a signal that verification for that feature needs the tooling task
done first.

## Levels of verification

### Level 1 — Unit tests (mandatory once tooling exists)

Every exported function in `src/domain` (validation, transforms, the API client's request/
response shaping) has a test covering the happy path and at least one error path if it can
fail. Pure TypeScript, no rendering — fast and framework-agnostic.

### Level 2 — Component/screen tests (mandatory for new or changed screens)

Use React Native Testing Library against real rendered output — user-visible text, roles,
interactions (`fireEvent`, `userEvent`) — not internal state or private functions. A test
that only checks "the component didn't throw" is not a real test.

### Level 3 — Manual smoke check (mandatory before marking a UI task done)

```bash
npm run web   # fastest to iterate on — opens in browser
```

Exercise the actual flow you changed. For platform-specific behavior (camera capture, SMS
autofill, secure storage), also check the relevant simulator/device — don't assume web
parity covers native-only code paths (`.ios.tsx`/`.android.tsx` files, permission flows).

#### Which live services to run — Supabase, the local backend, or both

This app has **two independent live dependencies** (Constitution Principles II/III/VIII): the
Supabase Auth SDK, and the `Draw-a-card` backend API. A Level 3 check may run against either
one alone or both together — **all three configurations are legitimate**, and none of them is
"the" correct setup. What is *not* legitimate is being vague about which one you used.

**State the configuration in your task report, and state what it therefore could not cover.**
"Smoke-checked on web" is not a verification claim; "smoke-checked on web against a real
Supabase project with no backend running, so nothing behind the KYC gate was reachable" is.

| Configuration | Set | Covers | Cannot cover |
|---|---|---|---|
| **Supabase only** | `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Sign-in, registration's auth step, session persistence, password reset — everything Principle III routes through the SDK | Any `/identity/me/*` or other API call. The KYC gate's status fetch fails, so you land on the retryable status screen rather than the app |
| **Local backend only** | `EXPO_PUBLIC_API_URL` → `http://localhost:<port>`; in the backend repo, `docker compose up` (Postgres/Redis/MinIO) then `npm run dev` | API request/response shaping, endpoint contracts, backend error handling | **Anything behind the KYC gate.** With no session, `resolveKycRoute` returns `unauthenticated` and redirects every authenticated route to `/login` |
| **Both** | All three env vars, both services up | Genuine end-to-end flows — sign in, then the authenticated screens that follow | Native-module behavior (still needs a simulator/device, see Level 3 above) |

Two traps, both hit for real in this repo rather than hypothetical:

- **An unreachable screen is not a verified screen.** The gate redirects on *session*, not on
  data. A screen whose content is entirely local and static is still unreachable without
  Supabase credentials — this is exactly how `006-visual-identity`'s `/scan` shell shipped
  with component tests only. If you couldn't reach a screen, say so; don't let "the tests
  pass" stand in for having seen it.
- **Running both is not enough if they disagree about the user.** The backend's
  `AUTH_PROVIDER_MODE` must point at the *same* Supabase project the app uses. Left at
  `"mock"` (its `.env.example` default) the backend mints its own fake `authProviderId` that
  the app can never sign in against, so the two halves silently describe different users and
  every authenticated call fails in a way that looks like an app bug.

Mock a service only when its real counterpart **doesn't exist yet** (Principle VIII), not to
dodge setup. If credentials or the backend genuinely aren't available in your environment,
that's a disclosed gap in the task report — never an implied live check.

### Level 4 — Build check (automated)

`init.sh` runs `npx expo export` **once per target — web, iOS, and Android** — confirming the
app actually bundles on each. This catches import errors, missing platform files, and Metro
config issues that type-checking alone won't. Already automatic — don't skip it
(`--skip-build` / `--skip-native` are for the `Stop` hook's fast path only, not for a feature
you're about to mark `done`).

**Why all three, and what it still doesn't cover** (learned the hard way on
`001-registration-kyc`, 2026-08-04): Metro resolves a *different module graph per platform*.
Web goes through `react-native-web` and never touches the native module graph, so for an
entire feature a green web-only export coexisted with an iOS app that crashed on launch. Each
platform is now its own stage so the summary names the one that broke.

These exports bundle JS; they do **not** compile a native binary, so they cannot catch a
native-module *version* mismatch (`Cannot find native module 'ExpoLinking'`) — that only
appears at runtime in Expo Go or a dev client. Stage 6, **Native dependency alignment**, is
what guards that class: it fails when an `expo-router` peer dependency is installed but not
declared in `package.json` (undeclared, npm floats it to the newest major, incompatible with
the pinned SDK), and warns when installed versions drift from the SDK's expectations.

Neither replaces Level 3 — actually running the app on a simulator remains the only way to
catch runtime and integration failures. On this feature, manual iOS testing found two real
bugs that 174 passing tests did not.

### Level 5 — Requirement traceability (mandatory for `"sdd": true` features)

Every `FR-00x` in a feature's `spec.md` must be referenced by at least one test's
description or an adjacent comment. `code-reviewer` checks this explicitly and rejects if a
requirement has zero covering tests, once test tooling exists for that feature area.

## Anti-patterns (don't do this)

- ❌ "I added the screen, it should work" — no runnable test or documented manual check,
  not verified.
- ❌ Testing that a component "doesn't crash" instead of asserting real rendered
  output/behavior.
- ❌ Business logic tested only indirectly through a component render — put it in
  `src/domain`, test it directly there (Constitution Principle IV exists partly so this is
  possible).
- ❌ Assuming web behavior covers iOS/Android without checking the platform-specific file or
  simulator when platform notes exist in the spec.
- ❌ Reporting a Level 3 check without naming which live services were running — or writing
  "smoke-checked on web" when the screen in question was never actually reachable (see
  "Which live services to run" above).
- ❌ Pointing the backend at `AUTH_PROVIDER_MODE="mock"` while the app uses a real Supabase
  project, then reporting the result as an end-to-end check.
- ❌ Marking a task or feature `done` without a green `./init.sh`.

## Final check before `done`

```bash
./init.sh
```

If it's not green (excluding the test-tooling warning until that's genuinely out of scope
for the feature), don't mark anything `done`. Set the feature's `feature_list.json` status to
`blocked` and record why in `progress/current.md`.
