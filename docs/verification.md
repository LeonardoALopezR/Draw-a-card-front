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

### Level 4 — Build check (automated)

`init.sh`'s `npx expo export --platform web` stage confirms the app actually bundles. This
catches import errors, missing platform files, and Metro config issues that type-checking
alone won't. Already automatic — don't skip it (`--skip-build` is for the `Stop` hook's fast
path only, not for a feature you're about to mark `done`).

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
- ❌ Marking a task or feature `done` without a green `./init.sh`.

## Final check before `done`

```bash
./init.sh
```

If it's not green (excluding the test-tooling warning until that's genuinely out of scope
for the feature), don't mark anything `done`. Set the feature's `feature_list.json` status to
`blocked` and record why in `progress/current.md`.
