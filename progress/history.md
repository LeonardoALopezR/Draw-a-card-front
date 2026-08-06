# Session history

Append-only log. Each entry is the rolled-over content of `progress/current.md` at the point a
feature reached `done` (or a session ended with meaningful progress worth keeping), most recent
entry last. Owned by `sdd-orchestrator` — see `AGENTS.md` §5.

---

# Session 2026-08-05 — 006-visual-identity (closed, DONE)

**Started**: 2026-08-05
**Feature**: 006-visual-identity
**State**: DONE — all 54 tasks (55 checkbox lines) [X], final review APPROVE

## What happened this session

- Human supplied four mockups (login mobile/web, scan mobile/web) and asked to "implement the
  design in the actual views". The images are not in the repo, so they were transcribed into
  **`docs/design-brief-visual-identity.md`** — that file is the authoritative design source for
  this feature, including its §7 scope decisions.
- Compared the mockups against the current code and found the gap is far larger than a restyle:
  - No theme/token layer exists anywhere in `src/` — every screen hardcodes hex values.
  - `src/features/identity/SignInForm.tsx` is an unstyled English form; the mockup adds a full
    brand layer plus a distinct web layout.
  - `src/features/scanner/ScanPlaceholderScreen.tsx` is a "Scanner coming soon" stub, and
    `004-home-scan-shell` FR-005 **forbids** camera on `/scan` (asserted by a source-inspecting
    test). The mockup depicts a working scanner with results and priced recent-scans.
  - The mockups' nav has 5 destinations; the app has 3 (Cartera/Trades are unspecced).
- Two scoping questions put to the human, both answered:
  1. **Scan → visual shell only.** Build the appearance, no camera, no data. 004's FR-005 stands.
  2. **Copy → Spanish and English**, via an i18n layer, "add a feature to choose the language".
- Registered two features in `feature_list.json` (pure addition, no existing entries touched):
  - **006-visual-identity** — token layer, shared primitives, login restyle, scan visual shell,
    i18n layer carrying es+en for these two screens.
  - **007-localization** — translate the remaining screens + the language-picker UI and its
    persistence. Depends on 006's i18n layer; do not start it first.
- Handed 006 to `sdd-orchestrator`. Note it was **explicitly directed to 006**, not left to pick
  the first `pending` feature (which would have been 002-kyc-document-verification).
- `spec-writer` wrote `specs/006-visual-identity/{spec,plan,tasks}.md` (+ `checklists/
  requirements.md`). Cross-checked the brief against the actual current code (not assumed) per
  the kickoff brief's instruction — three genuine discrepancies found and resolved as recorded
  defaults in spec.md's Clarifications (same non-blocking, flagged-for-confirmation pattern as
  `004`/`005`):
  1. **Font** — no serif is reliably bundled/consistent across iOS/Android/web; recommends
     bundling Playfair Display 700 via `@expo-google-fonts/playfair-display` + `expo-font`
     rather than a system-font substitute (Lora named as the runner-up override).
  2. **Contrast** — computed (not eyeballed) WCAG ratios found FOUR of the brief's §2.1 values
     miss 4.5:1 (`text.secondary` on `bg.page`, `text.placeholder` on `bg.surface`, `text.link`
     on every background it's used on, `accent.priceGreen` on `bg.surface`) — plus a discrepancy
     the brief's own spot-check list didn't anticipate: `text.placeholder` is reused for the
     viewfinder's dark-background hint text, and no single gray clears 4.5:1 against both a
     near-white and a near-black surface, so it's split into two tokens
     (`text.placeholder`/`viewfinder.hintText`). Adjusted values recorded with a before/after
     table; a new `src/theme/contrast.test.ts` regression-guards them going forward.
  3. **Scan shell chrome** — the brief describes "the existing sidebar"/"the existing bottom tab
     bar" around `/scan`, but `004-home-scan-shell` deliberately built `/scan` OUTSIDE the
     three-destination shell. Recommended default: `/scan` stays the standalone route `004`
     built (its restyled "Back" affordance stays the sole return path) rather than moving the
     route into the shell (real expo-router-version risk, bigger structural diff) or duplicating
     nav-rendering logic in a look-alike rail.
  - Also disclosed, not hidden: restyling `FormField.tsx` in place (per the explicit instruction
    to extend it, not add a parallel component) will also visually change
    `RegistrationForm`/`VerifyPhoneScreen`/`ProfileForm`'s rendered field appearance —
    `tasks.md`'s Polish phase re-runs the full existing test suite to confirm no behavioral
    regression.
  - i18n mechanism: a small hand-rolled lookup (`src/domain/i18n/`, plain TS, zero RN imports) +
    a thin React context/hook (`src/features/i18n/`) — not `i18next`, justified in plan.md as
    proportionate to today's two-screen, no-interpolation scope. Default locale hardcoded to
    Spanish (FR-012), explicitly flagged as a `007-localization` placeholder.
  - `feature_list.json`'s `006-visual-identity` entry updated to `"status": "spec_ready"`.

## Open questions / blockers (all resolved by session end)

- **Serif display font.** Resolved — human confirmed Playfair Display 700, as-is, at the
  approval gate.
- **Contrast verification.** Resolved — human confirmed the four adjusted token values, as-is,
  at the approval gate.
- 007-localization's default-locale behavior (device detection vs. hardcoded Spanish) remains
  undecided — belongs to that feature's spec, not 006's. Still open for 007.

## sdd-orchestrator session (resumed 2026-08-05)

- Bootstrapped: `./init.sh` green (10/10 stages; only the pre-existing expo-doctor/native-dep
  warnings that predate this feature). Local `main` was 2 commits behind `origin/main` (missing
  the merged 005-login PR) — fast-forwarded, then replayed this session's uncommitted
  feature-registration changes (`feature_list.json`, `progress/current.md`,
  `docs/design-brief-visual-identity.md`) on top. No app code touched.
- Confirmed target: `006-visual-identity`, still `pending`. Explicitly not picking
  `002-kyc-document-verification` (the first `pending` entry) per the human's direction.
- Delegated to `spec-writer` for spec/plan/tasks — done this session (see above). Paused at
  `spec_ready` for human approval, as required — no implementation this session.
- **HUMAN APPROVAL GRANTED.** All three recorded defaults confirmed as-is, no overrides: (1)
  font — Playfair Display 700 via `@expo-google-fonts/playfair-display` + `expo-font`, loaded
  behind the existing `KycGate`-style loading guard, referenced only via
  `typography.display.fontFamily`; (2) contrast — the four adjusted values + the
  `text.placeholder`/`viewfinder.hintText` split, ship exactly as tabled in spec.md,
  `contrast.test.ts` must compute real ratios (no hardcoded-expected-number degradation); (3)
  scan chrome — `/scan` stays standalone, restyled "Back" affordance is the sole return path.
  Two things flagged to hold the line on during implementation: the `FormField` blast radius
  onto `RegistrationForm`/`VerifyPhoneScreen`/`ProfileForm` is accepted in appearance but not in
  behavior (Polish-phase full-suite re-run is the regression gate, any resulting test-expectation
  change gets reviewed as carefully as code); the i18n seam must stay clean/documented for
  `007-localization` to add a picker onto, not replace.
- Flipped `feature_list.json`'s `006-visual-identity.status` to `in_progress`.
- Ran the `feature-branch` skill: local `main` was already up to date with `origin/main`
  (`777bb9e`); stashed this session's uncommitted spec/registration changes, cut fresh branch
  `006-visual-identity` from `main@777bb9e` (didn't exist locally or on origin), popped the
  stash cleanly (no conflicts), recorded `branch_cut_from: "main@777bb9e"` in `feature_list.json`.
  `./init.sh` green (10/10 stages, only the pre-existing warnings) on the new branch before any
  task work started.
- Planned batching for the remaining 53 tasks (checkpoint-aligned, per tasks.md's own phase/
  subsection structure): T001 (done) | T002-T009 token module | T011-T016 primitives |
  T017-T022 i18n | T010 root wiring | T023/T024/T024a Field | T025-T027 LoginScreenChrome |
  T028/T029 SignInForm | T030/T031 RequestPasswordResetForm | T032/T033 ResetPasswordForm |
  T034-T037 LoginScreen wiring+smoke | T038-T042 scan pieces | T043/T044 ScanShellScreen |
  T045/T046 test+cleanup | T047-T049 app/scan.tsx+smoke | T050/T051 a11y+responsive |
  T052-T054 full regression+init.sh.
- **T001 — done -> progress/impl_006-visual-identity.md, reviewed APPROVED ->
  progress/review_006-visual-identity.md.** `expo-font`, `expo-linear-gradient` (via `expo
  install`), `@expo-google-fonts/playfair-display` (via `npm install`) added; no new
  native-dependency-alignment drift beyond this repo's pre-existing disclosed warnings.
- **T002-T009 (token module) — done -> progress/impl_006-visual-identity.md (Run 2), reviewed
  APPROVED -> progress/review_006-visual-identity.md.** `src/theme/{colors,geometry,fonts,
  typography,shadows,shadows.web,contrast,contrast.test,index}.ts` created. Colors use spec.md's
  adjusted contrast values (not the brief's originals). `contrast.test.ts` is a real computed
  regression guard against the live `colors` export, confirmed green (311/311 suite passing).
  Two disclosed judgment calls, both reviewed and accepted: native `shadows.ts` splits the
  brief's rgba shadow color into `shadowColor`+`shadowOpacity` (standard RN pattern, avoids
  double-applying alpha); `label.section`'s letter-spacing reuses `label.field`'s 0.08em (brief
  gave no explicit number). `./init.sh` green, 10/10 stages, only pre-existing warnings.
- **T011-T016 (shared primitives) — done -> progress/impl_006-visual-identity.md (Run 3), first
  review CHANGES_REQUESTED -> progress/review_006-visual-identity.md** (two magic-number
  literals in `OrDivider.tsx`/`StatusPill.tsx` duplicating `space.md` instead of importing the
  token — genuine FR-001 regression, everything else in the batch clean). Fixed by
  `task-implementer`, **re-reviewed APPROVED**. `src/features/ui/{BrandMark,PrimaryButton,
  SecondaryButton,OrDivider,StatusPill}.tsx` + tests + `README.md` now ship with zero raw hex/
  magic-literal, full suite + `./init.sh` green.
- **T017-T022 (i18n layer) — done -> progress/impl_006-visual-identity.md, reviewed APPROVED ->
  progress/review_006-visual-identity.md.** `src/domain/i18n/{locale,translate,copy/login,
  copy/scan}.ts` (zero RN imports, confirmed) + `src/features/i18n/LocaleContext.tsx`
  (`LocaleProvider`/`useLocale`/`useTranslation`) + `README.md`. Dictionaries cover both the
  brief's explicit login/scan copy (correct Spanish orthography — `CONTRASEÑA`, `Olvidé`,
  accented) and the existing SignInForm/RequestPasswordResetForm/ResetPasswordForm hardcoded
  strings, es/en key-parity enforced by type + runtime test. Full suite + `./init.sh` green.
- **T010 (root layout wiring) — done -> progress/impl_006-visual-identity.md, reviewed
  APPROVED -> progress/review_006-visual-identity.md.** `app/_layout.tsx`: Playfair Display
  loaded via `useFonts()` behind the same minimal flex:1 placeholder `KycGate` already uses;
  `LocaleProvider` wraps the existing `QueryClientProvider`/`KycGate` tree. `KycGate`/
  `useKycGate()`/`resolveKycRoute()`/`src/domain/kyc-gate.ts` independently confirmed
  byte-for-byte untouched (highest-risk regression surface for this task, extra scrutiny paid).
  New test correctly placed per the `_layout.*` colocation exception. Full suite + full
  `./init.sh` (all 8 stages) green.
  **PHASE 2 (FOUNDATIONAL) COMPLETE — T001-T022 all [X] and reviewed.**
- **T023/T024/T024a (Field/FormField restyle) — done -> progress/impl_006-visual-identity.md
  (Run 7), reviewed APPROVE WITH NITS -> progress/review_006-visual-identity.md.**
  `FormField.tsx`/`FormField.web.tsx` restyled (borderless+shadow mobile, bordered web);
  `FormFieldProps` byte-for-byte unchanged; `RegistrationForm`/`VerifyPhoneScreen`/`ProfileForm`
  call sites and test suites independently re-run, zero regression, zero test-file changes. One
  disclosed nit (pre-existing, not introduced here): `FormField`'s error-text color is a raw hex
  not sourced from `src/theme` (no danger/error token exists yet in the brief's palette) —
  deferred to Polish phase, not blocking.
- **T025-T027 (LoginScreenChrome) — done -> progress/impl_006-visual-identity.md, reviewed
  APPROVED -> progress/review_006-visual-identity.md.** Mobile gradient wash
  (`expo-linear-gradient`) + web radial-bloom card container, both passthrough-tested (children
  unchanged). Translucent-lime-wash color handling (not in `src/theme` today, opaque
  `brand.primary` only) resolved as a disclosed, token-derived exception — reviewer judged
  proportionate for two decorative backgrounds.
- **T028/T029 (SignInForm restyle) — done -> progress/impl_006-visual-identity.md, reviewed
  APPROVED -> progress/review_006-visual-identity.md.** Field/PrimaryButton/SecondaryButton/
  OrDivider composed per brief §4 items 4-10, all copy routed through `useTranslation(
  loginCopy)`. Prop contract (`onSubmit`/`onForgotPassword`/`isSubmitting`/`serverError`/
  `confirmationMessage`/`initialEmail`) and validation/handler logic independently confirmed
  byte-for-byte unchanged; every pre-restyle test assertion still passes unmodified; "Create
  account" Link href confirmed unchanged.
- **T030/T031 (RequestPasswordResetForm restyle) — done -> progress/impl_006-visual-identity.md,
  reviewed APPROVED -> progress/review_006-visual-identity.md.** Same Field/PrimaryButton/
  useTranslation(loginCopy) pattern as SignInForm; onSubmit/onBack/isSubmitting/serverError/
  anti-enumeration copy logic unchanged. This batch rippled into `LoginScreen.test.tsx`/
  `app/(auth)/login.test.tsx` (outside its declared file scope) — reviewer specifically
  scrutinized this per the human's "test-expectation changes reviewed as carefully as code"
  instruction: confirmed both diffs are query-string-only fixes (translated placeholder/label
  text lookups following the copy move), zero assertion removed or weakened, FR-006's
  no-`useRouter()`-on-success guard specifically untouched and still passing.
- **T032/T033 (ResetPasswordForm restyle) — done -> progress/impl_006-visual-identity.md,
  reviewed APPROVED -> progress/review_006-visual-identity.md.** Field-wrapped email/new-password
  + unchanged `CodeInput`, `PrimaryButton` "Set new password", restyled resend/back-to-sign-in
  consistent with the prior batch's vocabulary. `RESEND_COOLDOWN_SECONDS` timer and
  `serverError.field === "code"` wiring confirmed byte-for-byte unchanged. Same
  `LoginScreen.test.tsx`/`login.test.tsx` ripple pattern as T030/T031, again scrutinized and
  confirmed narrow/query-only, FR-006 guard untouched.
- **T034-T037 (LoginScreen wiring + smoke check) — done -> progress/impl_006-visual-identity.md,
  reviewed APPROVED -> progress/review_006-visual-identity.md.** `LoginScreen.tsx` wrapped in
  `LoginScreenChrome`, BrandMark/title/tagline gated to `mode === "sign-in"` only. Zero change to
  any handler/state-machine function body, independently line-diffed. FR-006's no-`useRouter()`
  guard re-verified live (would fail if regressed, not just currently passing). `app/(auth)/
  login.tsx` needed no change. T037's manual smoke check honestly disclosed as a substitute
  (no real browser/simulator in this sandbox) — component tests + clean bundle export instead,
  not overstated.
  **PHASE 3 (LOGIN RESTYLE, T023-T037) COMPLETE — 364/364 tests passing, zero 005-login
  regression.**
- **T038-T042 (scan presentational pieces) — done -> progress/impl_006-visual-identity.md,
  reviewed APPROVED -> progress/review_006-visual-identity.md.** `src/features/scanner/
  {Viewfinder,ScanSearchField,UploadDropzone,EmptyResultsPanel,RecentScansList}.tsx` + tests.
  Zero camera-module import confirmed by grep across all five (the hardest constraint in this
  feature). `RecentScansList` (FR-008) confirmed zero `src/domain` import/fetch, placeholder
  data clearly commented. All copy through `useTranslation(scanCopy)`, all styling token-driven.
- **T043/T044 (ScanShellScreen mobile+web) — done -> progress/impl_006-visual-identity.md,
  reviewed APPROVED -> progress/review_006-visual-identity.md.** Mobile single-column;
  web reuses `src/domain/navigation.ts`'s existing `BREAKPOINT_PX` (not redefined) for the
  two-column/>=768px vs one-column/<768px collapse, verified both sides of the threshold.
  "Escanear carta" PrimaryButton confirmed genuinely disabled/no-op with an FR-007 comment.
  Zero camera import in the composition.
- **T045/T046 (camera-guard migration + old-file cleanup) — done ->
  progress/impl_006-visual-identity.md, reviewed APPROVED -> progress/review_006-visual-identity.md.**
  `ScanShellScreen.test.tsx`'s camera-import guard now covers all 7 scanner files this feature
  added, confirmed at least as strict as the original `ScanPlaceholderScreen.test.tsx`, migrated
  before deletion (repo never without an active guard). Old placeholder file+test fully removed,
  zero remaining repo reference confirmed by grep.
- **T047-T049 (app/scan.tsx wiring + smoke) — done -> progress/impl_006-visual-identity.md,
  reviewed APPROVED -> progress/review_006-visual-identity.md.** `ScanShellScreen` wired in
  place of the retired `ScanPlaceholderScreen`; "Back" `Pressable`'s `onPress`/accessibility/
  testID confirmed byte-for-byte unchanged (only styling retokenized) — 004 US2 AS2 intact.
  `Platform.select` correctly NOT used (both platforms share one token value, verified by grep;
  not a scope violation). Camera-import grep re-confirmed zero matches.
  **PHASE 4 (SCAN VISUAL SHELL, T038-T049) COMPLETE.** 388/388 tests passing.
- **T050/T051 (a11y + responsive polish) — done -> progress/impl_006-visual-identity.md
  (Run 17), reviewed APPROVED -> progress/review_006-visual-identity.md.** Real fixes made and
  independently re-verified: ScrollView added to LoginScreenChrome/ScanShellScreen (fixes a
  genuine short-viewport clipping bug, zero regression to passthrough/FR-006 guards);
  Viewfinder's gear chip `aria-hidden` swap confirmed technically correct on both native+web by
  reading RN/react-native-web source directly; app/scan.tsx Back copy now i18n'd (pre-existing
  keys); new computed `colors.text.danger` token replaces the raw error-text hex across
  FormField/SignInForm/RequestPasswordResetForm/ResetPasswordForm (resolves the T023-T024a nit),
  contrast-tested, zero behavioral regression in any of the four forms. 394/394 tests, full
  `./init.sh` green.
- **T052-T054 (final regression gate) — done -> progress/impl_006-visual-identity.md (Run 18),
  reviewed APPROVE -> progress/review_006-visual-identity.md.** Zero-source-change verification
  pass, every claim independently reproduced by code-reviewer (not accepted on report alone):
  full suite 394/394 across 63 suites, `contrast.test.ts` re-confirmed a genuine computed guard,
  camera-import grep re-confirmed zero actual import/require lines under `src/features/scanner/`,
  full `./init.sh` (all 8 stages, no skip flags) `RESULT: SUCCESS` with zero new
  native-dependency-alignment drift attributable to this feature's three T001 additions, all
  three bundle exports clean (confirming neither the font/gradient additions nor the
  `ScanPlaceholderScreen` removal broke any target). The human's specifically named concern (a
  pre-existing test edited to dodge a `FormField`-restyle regression) does not apply — no
  pre-existing test was touched in this batch at all; `RegistrationForm.test.tsx`/
  `VerifyPhoneScreen.test.tsx`/`ProfileForm.test.tsx` never needed a fix because they already
  assert behavior/role/text, confirmed by direct inspection.
  **ALL 54 TASKS (55 CHECKBOX LINES) [X]. FEATURE-LEVEL FINAL REVIEW: APPROVE, CHECKPOINTS.md
  C1-C6 all satisfied (the two empty boxes are explicitly orchestrator-scoped: the
  `progress/history.md` entry and the `feature_list.json` status flip to `done`, both completed
  below).**
- sdd-orchestrator independently re-ran `./init.sh` one final time before closing: green, 10/10
  stages, only the same pre-existing warnings. Flipped `feature_list.json`'s
  `006-visual-identity.status` to `done` with a comprehensive closing summary in its `notes`
  field, mirroring the pattern used for 001/004/005. Session closed; `progress/current.md` reset
  to its template.

## Feature complete — 006-visual-identity is DONE

All work delegated per AGENTS.md's SDD lifecycle: `spec-writer` (spec/plan/tasks, paused at
`spec_ready` for human approval) → human approval with all three recorded design defaults
confirmed as-is (Playfair Display font, four adjusted contrast values, `/scan` staying
standalone) → `feature-branch` skill (branch cut from `main@777bb9e`) → 18
`task-implementer` runs across 54 tasks, each independently reviewed by `code-reviewer` (20
review rounds total, one CHANGES_REQUESTED cycle on T011-T016, fixed and re-approved; two
APPROVE WITH NITS rounds, both nits later resolved during Polish) → final feature-level APPROVE.
Ships the app's first visual-identity token layer, six shared primitives, the login screen and
scan-screen visual shell fully restyled on mobile+web, and an es/en i18n layer — with zero
disclosed regression to 005-login's FR-006 or 004-home-scan-shell's FR-005/US2 AS2. Two genuine
bugs (a ScrollView-clipping issue, a web-a11y attribute gap) were caught and fixed during Polish,
not shipped silently. See `feature_list.json`'s `006-visual-identity` entry for the full closing
summary, and `progress/impl_006-visual-identity.md` (18 runs) /
`progress/review_006-visual-identity.md` (20 review rounds) for complete detail.

---


---

# Session 2026-08-04 — 001-registration-kyc (closed)

**Started**: 2026-08-04
**Feature**: 001-registration-kyc
**State**: spec_ready → awaiting human approval gate

## What happened this session

- Ran `./init.sh` → `RESULT: SUCCESS (7/7)`. Expected warnings only: expo-doctor outdated
  deps (non-blocking) and no `test` script yet.
- Read `feature_list.json` / `specs/001-registration-kyc/spec.md`: feature was `pending`,
  spec.md had 1 open `[NEEDS CLARIFICATION]`, no `plan.md` / `tasks.md`.
- Resolved the open clarification with the human (see below) so `spec-writer` wasn't blocked
  on it.
- Delegated clarify → plan → tasks to `spec-writer`, which:
  - Applied the clarification to `spec.md` (`## Clarifications` section, Edge Cases, new
    FR-009/FR-010, an SC, and Assumptions) — zero open `[NEEDS CLARIFICATION]` markers remain.
  - Wrote `specs/001-registration-kyc/plan.md`: resolves FR-004's presigned-URL mechanism
    (presign → PUT → confirm), designates this feature as the one that installs
    jest + jest-expo + @testing-library/react-native, and passes the Constitution Check gate.
  - Wrote `specs/001-registration-kyc/tasks.md`: 30 tasks, Setup → Foundational → US1 (P1,
    MVP) → US3 (P1) → US2 (P2) → Polish, with FR→task traceability.
  - Flipped `feature_list.json`'s status to `spec_ready`.

## Resolved clarifications

- **kycStatus `pending` vs `rejected` UI** (spec.md Edge Cases): **blocking status screen**
  for both. On reopen, `pending` → a "verificación en revisión" screen with no access to the
  main app; `rejected` → screen showing the **backend-provided rejection reason** (generic
  fallback if the backend returns none) plus a resubmit CTA that returns the user to the KYC
  upload step.

## Implementation log

- **2026-08-04 — human APPROVED at the `spec_ready` gate.** `feature_list.json` → `in_progress`.
- Confirmed the backend repo is present at `../Draw-a-card` with its
  `specs/001-user-registration-kyc/` — so T005 verifies the presign/confirm endpoint shape
  against it rather than relying on plan.md's placeholder.
- **T001 [X]** (test tooling) — jest 29.7 + jest-expo 51.0.4 + @testing-library/react-native
  13.3.3 + react-test-renderer 18.2 + @types/jest. `npm test` passes; `init.sh` Tests stage
  flipped WARN → OK; `RESULT: SUCCESS`. Independently re-verified by the orchestrator.
  Deviations (both accepted): skipped the deprecated `@testing-library/jest-native` (matchers
  ship in RNTL ≥12.4), added `@types/jest` so `tsc` accepts Jest globals in `.test.ts`.
  Report: `progress/impl_001-registration-kyc.md`.
- **Phase 2 (Foundational)** in progress, split into two reviewable batches:
  batch A = T002 + T003 (types + pure `kyc-gate`), batch B = T004 + T005 + T006 (API wrappers
  + upload adapter), then T007 + T008.

- **T002 + T003 [X]** — `User.kycRejectionReason` / `hasCompletedTutorial`, `IdentityDocument`,
  and the pure `resolveKycRoute()` gate + 7 branch tests. `npm test` green, `tsc` clean,
  `init.sh` SUCCESS. The implementer's mandated backend cross-check surfaced the blocker below.

## BLOCKER FOUND AND RESOLVED — backend scope mismatch (2026-08-04)

`task-implementer`'s cross-check against `../Draw-a-card` found that this feature's approved
spec targets a backend scope that no longer exists. **Orchestrator independently verified all
of it** against the backend's `spec.md`, `prisma/schema.prisma`, and `feature_list.json`:

1. Backend descoped **all KYC document handling** out of `001` on 2026-08-03 into
   `002-kyc-document-verification`, which is still `pending` and unspec'd. No presign
   endpoint, no object storage, no KYC provider exists. `IdentityDocument` is in the schema
   but "untouched and unused". → our FR-004 / T005, T006, T015, T016, T017 had no backend.
2. Backend has **no code path leaving `kycStatus: pending`** ("the correct, intentional
   terminal state for this iteration"). Combined with FR-009's blocking screen, **every user
   would have been permanently locked out of the app.** Backend's settled decision (its
   FR-006) is that KYC gates *money paths only* — sale/withdrawal, not card-for-card trades.
3. Our flow was **missing a whole step**: backend is `POST /identity/register` (email,
   password, phone, username only) → `POST /identity/phone/verify` → `POST /identity/me/profile`
   (nombre, apellidoPaterno, apellidoMaterno?, birth date, nationality, CURP, RFC + ToS/privacy).
   CURP/RFC are **typed fields**, not documents.
4. Business fields (commercialName/RFC/fiscalAddress) belong at that **profile step**, not on
   the register screen.
5. Context: backend `/identity/me/*` + `/identity/phone/*` identify the caller from an
   `X-User-Id` header, fail-closed outside dev/test. Real auth is backend
   `003-session-authentication` (`pending`), so US3 has no token-based auth to persist yet.

**Human decisions (2026-08-04, second gate):**
- **Re-scope 001 to match the backend that exists today** — move document upload out to a new
  frontend feature `002`, add the missing profile step, move business fields onto it.
- **`pending` passes through to the main app.** `resolveKycRoute`/`KycStatusScreen` stay built
  but only route on `rejected`, once backend 002 can actually produce it.

## Post-re-scope progress

- `spec-writer` amended `spec.md`/`plan.md`/`tasks.md` and registered frontend feature
  `002-kyc-document-verification` (`pending`). T001–T003 kept `[X]` with numbering intact;
  document-upload tasks preserved verbatim under "Deferred to feature 002".
- **T004 + T005 [X]** — removed `IdentityDocument` (moved to 002), added the backend-mirroring
  `User` fields, widened `resolveKycRoute` to
  `unauthenticated | verify-phone | profile | kyc-status | tutorial | main`. `pending` now
  passes through; only `rejected` (and fetch-failure) blocks. Fail-safe precedence preserved.
- **T006 + T007 + T008 [X]** — `src/domain/registration.ts`, `schemas.ts` (rewritten),
  `profile.ts`, plus `ApiError`/`ApiClient` in `api-client.ts` and the temporary `X-User-Id`
  boundary in `src/lib/api.ts`. Contract verified against the backend's actual source
  (`src/modules/identity/{routes,service,validation,errors,username}.ts`), not just its spec.
- **`code-reviewer`: APPROVED** over T001–T008 → `progress/review_001-registration-kyc.md`.
  No blocking findings. 63 tests passing, `tsc` clean, `init.sh` SUCCESS.

## Backend contract deviations found (all reconciled in code)

- No separate `businessRfc` field; `tosAccepted`/`privacyAccepted`, not
  `acceptedTerms`/`acceptedPrivacyPolicy`.
- No `sendVerificationCode` or `accountType` concept backend-side; no `retryAfterSeconds` in
  the resend response.
- **No backend endpoint for tutorial completion at all** → `hasCompletedTutorial` is hardcoded
  `false` in `toDomainUser()` for now. **T019 must decide** local storage vs. a backend field.

## Open questions / blockers

- None blocking. One carried-forward decision: T019's tutorial-completion data source.

## T009 + T010 [X] — and a second backend gap

- `app/(auth)/_layout.tsx`, `app/(onboarding)/_layout.tsx`, `src/features/identity/useKycGate.ts`
  (+ tests), wired into `app/_layout.tsx` with the loading gate built now (not deferred to T022).
  73 tests passing, `tsc` clean, `init.sh` SUCCESS. Reviewer's `setCurrentUserId` constraint honored.
- **Correctness bug found and fixed en route**: a user with a live session whose status fetch
  failed resolved to `"unauthenticated"` (→ registration screen) instead of `"kyc-status"`
  (→ retry screen), because `resolveKycRoute` checks `!user` before `statusFetchFailed`. Fixed
  with an `UNKNOWN_GATE_USER` placeholder at the hook boundary — zero changes to the pure
  `resolveKycRoute`, so Constitution IV holds.
- **Scope creep, justified, each verified by reproducing the failure first**: `@opentelemetry/api`
  (Metro can't resolve Supabase's optional dynamic import without it) and `ws` + a placeholder
  Supabase URL (`expo export` static-prerenders in Node 20, which has no global WebSocket, and
  `createClient("")` throws synchronously). **Tidy-up owed**: `ws` landed in `dependencies`, not
  `devDependencies` — a Node-only lib now in the client bundle. Works, but should move.

### BACKEND GAP 2 — US3 cannot be delivered (orchestrator-verified)

The backend's only GET is `/me/kyc-status`, returning `{ kycStatus }` alone. Verified directly
against `../Draw-a-card/src/modules/identity/routes.ts` — the full route set is `/ping`,
`/register`, `/register/business`, `/phone/verify`, `/phone/resend`, `/password-reset`,
`/me/profile` (POST), `/me/kyc-status` (GET).

There is **no endpoint returning `phoneVerifiedAt` / `nombre` / `apellidoPaterno`**, which
`resolveKycRoute` needs to route a returning user. With `X-User-Id` in-memory only, every cold
boot fails the fetch and lands on FR-010's retry screen. Root cause: backend
`003-session-authentication` is still `pending`.

**Human decision (2026-08-04, third gate): build US1 screens, defer US3.** T022/T023 are
blocked on backend 003 and are OUT of this feature's closing criteria — 001 does not wait on them.

## Phase 3 / US1 — T011–T020 all [X]

- **T011+T012** — `RegistrationForm.tsx`, `FormField.tsx`, `app/(auth)/register.tsx`. First UI
  in the repo; set the conventions the rest follow. Added `metro.config.js` (justified
  deviation): expo-router turns every `.tsx` under `app/` into a route, so a colocated
  `register.test.tsx` shipped as route `/register.test` and pulled a devDependency into the
  production bundle. Block-listing test files from Metro preserves the colocation convention.
- **T013+T014+T015** — `CodeInput.tsx` + `.ios`/`.android` SMS-autofill variants sharing one
  explicit interface (`CodeInput.types.ts`), `VerifyPhoneScreen.tsx`, `app/(auth)/verify-phone.tsx`.
  Countdown driven by a client-side constant (backend returns no `retryAfterSeconds`).
  Orchestrator **reverted** the run's `tsconfig.json` `allowImportingTsExtensions` addition —
  verified unnecessary (nothing imports with a `.tsx` extension; `jest.config.js`'s
  `haste.defaultPlatform` override is the actual fix). All tests still pass without it.
- **T016+T017** — `ProfileForm.tsx`, `app/(auth)/profile.tsx`. Correct backend field names
  (`tosAccepted`/`privacyAccepted`), `apellidoMaterno` genuinely optional. CURP/RFC confirmed
  not logged, not in URLs, not persisted beyond form state (Constitution III).
- **T018+T019** — `KycStatusScreen.tsx` (rejected + error variants; the `pending` branch was
  **dropped as unreachable** rather than tested as fiction, since `resolveKycRoute` never routes
  a fetched `pending` here), `app/(auth)/kyc-status.tsx`, `TutorialScreen.tsx`,
  `app/(onboarding)/tutorial.tsx`. Resubmit CTA is a visibly **disabled placeholder** — feature
  002 doesn't exist, and routing to a nonexistent path would hit expo-router's "Unmatched Route"
  screen and read as a bug. `hasCompletedTutorial` persisted **locally** (no backend endpoint).
- **T020** — wiring verified across the full transition matrix; no loop, no dangling route, local
  tutorial flag genuinely on the gate's path. 138 tests. It also found BACKEND GAP 3 below.

### BACKEND GAP 3 — no session was ever established (orchestrator-verified, RESOLVED by decision)

`useKycGate` keys the entire gate on `supabase.auth.getSession()`, but **nothing in the repo ever
creates a session**: no `signInWithPassword`, no `signUp`, no `setSession` (grep-verified — the
only session references are reads). The backend's `POST /identity/register` returns
`res.status(201).json({ user })` — no token. So every user resolved `"unauthenticated"` → `/register`
forever, regardless of real backend progress. Every existing test missed it because they all mock
the session.

Verified the fix is available client-side: the backend calls
`getAuthProvider().signUpWithPassword(email, password)` (`service.ts:143`), so the Supabase auth
account already exists with the user's own credentials.

**Human decision (2026-08-04, fourth gate): the client calls
`supabase.auth.signInWithPassword({ email, password })` after a successful registration.** No
backend change; satisfies Constitution III (auth through the provider SDK); `persistSession: true`
is already configured. Caveat to watch: a Supabase project requiring email confirmation before
sign-in would block this.

## T031 [X] — session establishment (BACKEND GAP 3 fix)

`src/lib/supabase-client.ts` now exports `signInWithPassword`, **dependency-injected** into
`submitPersonalRegistration` at the screen call site so `src/domain` still imports nothing from
`src/lib` (Constitution IV holds). Registration → sign-in → live session → gate routes onward.

Failure UX (registration succeeds, sign-in fails — e.g. Supabase requires email confirmation):
a dedicated "Your account was created" screen explaining the cause, with a **Retry** that retries
only the sign-in — never re-posts registration, which would hit `409 EmailTaken`. Credentials are
held in component state in that branch only, same lifetime as the form state; not persisted.

## T021 [X] — manual smoke check, run by the orchestrator in a real browser

`expo start --web` + browser, at a 375px viewport. **Verified working**: app boots; gate redirects
to `/register`; form renders exactly the four backend-contract fields (no business fields —
re-scope confirmed live); inline validation fires (SC-002); layout clean at 375px with no
horizontal scroll (SC-003).

**Found two defects the 145 passing tests did not catch** — fixed as T032:
1. Raw Zod defaults leaking as user copy: Username showed
   `String must contain at least 1 character(s)`. Audited all of `schemas.ts`; every
   user-reachable validator now has real copy. Re-verified live: "Username is required",
   "Enter a valid email address", and an actionable regex message naming the allowed characters.
2. **`apellidoMaterno` was not genuinely optional.** `z.string().min(1).optional()` accepts
   `undefined` but rejects `""`. `ProfileForm` defaulted it to `undefined` to dodge this, and the
   test only covered the never-touched case — so **type-a-value-then-clear-it** set `""` and
   blocked submission with the raw message from defect 1. Schema fixed to accept and normalize
   empty, regression test added for the type-then-clear path, same latent bug fixed in
   `commercialName`/`fiscalAddress`.

**Not verifiable in this environment, still owed**: screens past `/register` (needs the backend
running), and SMS autofill on iOS/Android (needs simulators). Recorded, not silently skipped.

## State at pause

- **T001–T021, T031, T032 all `[X]`.** 155 tests, `tsc` clean, `init.sh` `RESULT: SUCCESS`.
- US1 (the P1 MVP) is functionally complete and browser-verified at the register screen.
- Nothing committed — working tree uncommitted, matching how the backend repo was left.

## US2 + Polish [X] — T024–T030

- **T024–T026** — account-type toggle (`radiogroup`/`radio`, browser-verified), `register.tsx`
  branches to `submitBusinessRegistration` (which goes through the **same T031 sign-in path**, so
  business users don't hit the dead end), business fields conditionally rendered on `ProfileForm`
  per the re-scope. Browser-verified live: selecting "Tienda" correctly does NOT reveal business
  fields on the register screen.
- **T027–T030** — accessibility, responsive, and final-gate pass.
  - Orchestrator measured the register screen in-browser: **all tap targets exactly 44px**
    (compliant), 375px layout clean, no horizontal scroll.
  - **Accessibility defect found by the orchestrator, fixed**: the account-type radios emitted
    **no `aria-checked` at all** — selection was conveyed only by a background-color class, so a
    screen-reader user could not tell which type was selected. Re-verified live after the fix:
    `Personal=false, Tienda=true` on selecting Tienda. Regression test added.

## code-reviewer, second pass (T009–T032): CHANGES_REQUESTED → fixed as T033

**BLOCKING finding, orchestrator-verified**: `setCurrentUserId()` was **never called anywhere**.
Only its definition (`src/lib/api.ts:24`) and comments existed — every screen carried a comment
saying the wiring was "intentionally left for a later task," and no later task ever added it.

The backend's `requireUserId()` has **no bearer-token fallback**, so `POST /identity/phone/verify`,
`/phone/resend`, `/me/profile`, and `GET /me/kyc-status` **all 401, always**. A user would type the
correct SMS code and be permanently stuck on verify-phone with "Something went wrong."

Cause is partly an orchestrator instruction: repeated guidance not to make `X-User-Id` "more
pervasive" was read as "never call it." The correct reading was: call it exactly once, where a
real user id is confirmed.

**T033 [X]** — `setCurrentUserId(user.id)` after successful registration (incl. the `retrySignIn`
recovery path), cleared on session loss via `useKycGate`'s `onAuthStateChange`, `Unauthenticated`
branches added to all three error mappers, stale comments corrected. Verified against the **live
local backend with curl** (401 without the header, authenticated with it) **and by reverting each
fix to prove the new tests actually fail**. 174 tests, `tsc` clean, `init.sh` SUCCESS.

## BACKEND GAP 4 — no CORS: the web target cannot reach the local backend (UNRESOLVED)

Brought up the real backend (docker compose: postgres/redis/minio; API on :3000, `/identity/ping`
→ 200) and drove a real registration from the browser. Result:

```
Access to fetch at 'http://localhost:3000/identity/register' from origin
'http://localhost:8081' has been blocked by CORS policy: No 'Access-Control-Allow-Origin'
header is present on the requested resource.
```

Preflight `OPTIONS` returns 200 but carries no CORS headers. Confirmed the backend has **zero CORS
handling** — no `cors` dependency, no `Access-Control` header anywhere in its `src/`.

This breaks Constitution I (web is a first-class target) and VIII (local-first development). **The
fix belongs in the backend repo**, which has its own SDD process and its `001` marked `done` — not
changed unilaterally from here. **Escalated to the human; not fixed.**

Also blocking a genuine end-to-end run: `.env` has `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY` **empty**, so the placeholder fallback applies and
`signInWithPassword` cannot reach a real project. The backend can run fully mocked
(`AUTH_PROVIDER_MODE=mock`), but the frontend gate needs a real Supabase session — worth noting as
local-first friction: the frontend cannot be exercised locally without cloud credentials.

## State at pause

- **T001–T021, T024–T033 all `[X]`.** 174 tests, `tsc` clean, `init.sh` `RESULT: SUCCESS`.
- T022/T023 (US3) deferred to backend `003` by the 2026-08-04 decision.
- Nothing committed; working tree uncommitted.

## Manual iOS testing (by the human) — two more real bugs, neither catchable by tests

1. **`Cannot find native module 'ExpoLinking'`** — app crashed on launch on iOS.
   Root cause: `expo-router@3.5.24` declares `expo-linking`/`expo-constants` as
   **peerDependencies with a wildcard `"*"` range**. Neither was declared in `package.json`, so
   npm auto-installed them at the newest major — **57.x, built for SDK 54+** — against this
   project's **SDK 51** runtime. JS resolved; the native module didn't exist. Fixed with
   `npx expo install expo-linking expo-constants` → `~6.3.1` / `~16.0.2`, now explicitly declared.
   Left `typescript`/`@types/react` alone: SDK 51 wants *downgrades* (5.9.3 → ~5.3.3) that would
   likely break the type-check and 174 tests for no native-runtime benefit.
2. **T034 — unhandled rejection in `signInWithPassword`.** The wrapper assumed supabase-js always
   resolves to `{ error }`. On a *network-level* failure (unreachable host, DNS, offline,
   timeout) it **rejects**. That throw escaped into `register.tsx`'s registration `catch`, so a
   user whose account **was** created (backend returned 201) saw a generic registration error,
   retried, and hit `409 EmailTaken` — permanently locked out. Exactly the trap T031's failure
   screen exists to prevent. Fixed; the audit found the same class in `useKycGate`'s
   `getSession()` (would have wedged the loading state on cold boot) and `tutorial.tsx`.
   `src/lib/api.ts` audited and already safe. **181 tests.**

Diagnosis was done against the live backend: `POST /identity/register` → `HTTP 201` with a real
user; `placeholder.supabase.co` → `000` (unreachable, because both Supabase env vars are empty).

## init.sh — now verifies all three targets (human-requested)

Stages went 6 → 8. Verified both paths: full run `RESULT: SUCCESS (10/10)`, and the `Stop` hook's
`--skip-build` fast path `SUCCESS (8/8)` (unchanged in speed — it already skipped exports).

- **New stage 6, "Native dependency alignment"** — the one that actually guards the ExpoLinking
  bug class. **FAILs** when an `expo-router` peer is installed but undeclared in `package.json`;
  WARNs when installed versions drift from the SDK. **Proven non-vacuous**: temporarily
  undeclaring `expo-linking` made it report `DETECTED: [expo-linking]`; clean when restored.
- **Stage 8 now exports web + iOS + Android**, each its own stage so the summary names the
  failing platform. Previously web-only — which is precisely how a completely broken native app
  passed every gate for an entire feature.
- New `--skip-native` flag for a fast inner loop.
- **Honest limitation, documented in the script and `docs/verification.md`**: these exports
  bundle JS, they do not compile a native binary, so they could NOT have caught the ExpoLinking
  runtime mismatch on their own — stage 6 is what covers that. A real native compile needs
  `expo prebuild`, which writes `ios/`/`android/` into this managed-workflow repo; deliberately
  not added.
- Docs updated to match: `AGENTS.md`, `README.md`, `docs/verification.md` (Level 4 rewritten),
  `CHECKPOINTS.md`.

## Backend coordination (2026-08-04, end of session)

**CORS registered as backend feature `006-web-cors`** (`pending`) in `../Draw-a-card/feature_list.json`,
per human instruction to register rather than implement. Entry records the full evidence (no `cors`
dep, zero `Access-Control` matches in `src/`, `index.ts` registers only `express.json()`; live repro
of the blocked preflight), that impact is **browser-only** (native confirmed working, HTTP 201), and
that the fix must be an **origin allowlist, never `*`** — `/identity/me/*` carries curp/rfc under
their Principle III. Queued behind their `005-card-catalog`, which is `in_progress`. JSON validated;
`one_feature_at_a_time` still holds (1 in_progress).

### Two discoveries while reading their feature_list — both affect us

1. **Their `002-onboarding-tutorial-state` shipped TODAY and is `done`.** It adds
   `GET /identity/me/tutorials` and `POST /identity/me/tutorials/complete` — verified present in
   `src/modules/identity/routes.ts`. **This supersedes our T019 decision.** We persisted
   `hasCompletedTutorial` locally in secure-store *specifically because* no backend endpoint
   existed; that premise is now false. `toDomainUser()` still hardcodes `hasCompletedTutorial:
   false`. Worth a follow-up task to move to the real endpoint — local state won't survive a
   reinstall or follow the user across devices. **Not actioned**, flagged.
2. **Their feature numbering shifted.** The KYC-document feature is now their `003`, not `002`
   (tutorial-state was inserted ahead of it), and session-auth is their `004`, not `003`. Every
   "backend 002/003" reference written earlier in this repo is off by one. Corrected the
   `002-kyc-document-verification` note in our `feature_list.json`; **older references inside
   `specs/001-registration-kyc/` and earlier entries in this file are still stale** and should be
   read with this in mind.

**T035 added (open, not implemented)** — moves tutorial completion off local-only storage onto the
now-existing `GET /identity/me/tutorials` + `POST /identity/me/tutorials/complete`. Records why it
matters (local-only means the tutorial replays after a reinstall or on a second device, so FR-007's
"once per *user*" is not actually met — only "once per install"), the exact scope, the backend's
response contract, the open decision on whether `src/lib/tutorial-storage.ts` is deleted or kept as
an offline cache, and that T033's `setCurrentUserId` wiring is a prerequisite. FR-007 traceability
row updated to distinguish what T019 vs T035 each satisfy.

## Open tasks in 001 (4 of 35)

- **T021** — manual smoke, web portion blocked on backend `006-web-cors`; iOS partially done
  (register verified; the rest needs Supabase credentials).
- **T035** — real tutorial endpoints (just added, above).
- **T022 / T023** — US3 session persistence, deferred by decision to backend `004-session-authentication`.

## Next step

1. **Backend CORS** is now tracked as their `006-web-cors` — web end-to-end stays blocked until it
   ships.
2. Real Supabase credentials in `.env` for a true happy-path walkthrough.
3. Then re-run T021/T027 manual smoke properly, re-review, and `feature_list.json` → `done`.
   **001 should NOT be marked `done` until the flow is verified against the real backend** — three
   separate "green tests, broken app" bugs (T031, T033, CORS) were found precisely where mocks
   stopped and reality began.

---

# Session 2026-08-05 — 004-home-scan-shell (closed, done)


**Started**: 2026-08-04
**Feature**: 004-home-scan-shell
**State**: implementation (spec approved by the human 2026-08-04)

## What happened this session

- Human requested a new feature from a hand-drawn wireframe of the authenticated
  home/scan screen: nav shell (Amigos / centre Scan / Social), a card-shaped `+`
  affordance that routes to the scanner, and four top-right placeholder controls
  (ENG/ESP, USD/MXN, Notifications, Messages).
- Registered `004-home-scan-shell` in `feature_list.json` as `pending` with the full
  wireframe description and scope boundaries in its `notes` (subagents can't see the
  image — the notes are the source of truth for what was drawn).
- Scope stated by the human up front: Amigos and Social get the *tabs* but no screen
  content; the scanner itself is a separate feature, this one only wires the route
  boundary; the four top-right controls are placeholders.
- Delegated to `spec-writer` to produce `specs/004-home-scan-shell/{spec,plan,tasks}.md`.

- `spec-writer` delivered spec.md / plan.md / tasks.md (22 tasks, 10 FRs, 4 user
  stories) + checklists/requirements.md, and flipped 004 to `spec_ready`.
- **Human approved at the `spec_ready` gate 2026-08-04**, confirming both recorded
  defaults: web nav = Option C (responsive sidebar ≥768px / bottom bar <768px), and the
  top-left Amigos pill = a shortcut to the same Amigos destination (FR-008 as written).
  Recorded at the top of spec.md's Clarifications section.
- Handed to `sdd-orchestrator` to cut the branch and drive the
  `task-implementer` → `code-reviewer` loop.
- `sdd-orchestrator` flipped status to `in_progress`, ran `feature-branch` skill: synced
  `main` (fast-forwarded 2 commits, `001-registration-kyc`'s full merge), cut
  `004-home-scan-shell` fresh off updated `main` (commit `a461fc4`), restored stashed
  spec/plan/tasks + feature_list.json/progress edits with no conflicts. `./init.sh` green
  (10/10, only pre-existing expo-doctor/native-dep-alignment warnings). Starting
  `task-implementer` loop at Phase 2 (Foundational): T001–T008, all `[P]`.
- Batch 1 (T001 `src/domain/navigation.ts`+test, T002 `src/features/navigation/README.md`):
  `task-implementer` → done. `code-reviewer` → APPROVED, no findings. Both `[X]` in
  `tasks.md`.
- Batch 2 (T003 `ScanEntryCard.tsx`+test, T004 `ScanPlaceholderScreen.tsx`+test):
  `task-implementer` → done. `code-reviewer` → APPROVED, no findings. Both `[X]` in
  `tasks.md`.
- Batch 3 (T005 `AmigosPlaceholderScreen.tsx`+test, T006 `SocialPlaceholderScreen.tsx`+test):
  `task-implementer` → done. `code-reviewer` → APPROVED, confirmed no real social/feed
  content leaked in. Both `[X]` in `tasks.md`.
- Batch 4 (T007 `TopRightControls.tsx`+test, T008 `AmigosQuickAccessPill.tsx`+test):
  `task-implementer` → done. `code-reviewer` → APPROVED, confirmed zero backend calls, no
  toast lib, pill's route derived from `NAV_DESTINATIONS` not hardcoded. Both `[X]` in
  `tasks.md`. **Phase 2 (Foundational) complete — all of T001-T008 `[X]` and reviewed.**
  Starting Phase 3 (US1 route wiring).
- Batch 5 (T009 `app/(app)/_layout.tsx` native tabs, T010 `WebSidebarNav.tsx`+test, T011
  `WebBottomBarNav.tsx`+test): `task-implementer` → done. `code-reviewer` → APPROVED, all
  three derive from `NAV_DESTINATIONS`, no drift risk, no premature Platform.OS branching.
  All three `[X]` in `tasks.md`.
- Batch 6 (T012 `app/(app)/_layout.web.tsx`+test, T013 `HomeScreen.tsx`+test):
  `task-implementer` → done. `code-reviewer` → APPROVED, confirmed no inline `Platform.OS`
  in `_layout.web.tsx`, breakpoint delegates to `resolveWebNavLayout`, live-resize test is
  real, `HomeScreen`'s scan-card `onPress` is still an inert placeholder (T016 wires it).
  Both `[X]` in `tasks.md`. Next: T014 (atomic route wiring — remove `app/index.tsx`, add
  `app/(app)/index.tsx`+`amigos.tsx`+`social.tsx`), the highest-risk task in this feature.
- T014: `task-implementer` → done, `app/index.tsx` removed atomically with the three new
  `(app)/` routes added, FR-009 respected (gate files untouched). Manual verification done
  via headless Chrome DOM dumps against a real `expo start --web` server (no GUI browser
  tool available), with a temporary revert-before-done monkeypatch to force the gate to
  `"main"` — reverted, confirmed clean. **Surfaced a real, pre-existing bug** (from T012, not
  T014's own diff): `expo start --web` crashes on startup — `_layout.web.tsx` and
  `_layout.web.test.tsx` "conflict" per expo-router's dev-server route-manifest scan (a
  different code path from `expo export`, which stays green — `metro.config.js`'s
  `blockList` doesn't reach it). `code-reviewer` independently reproduced this
  (`CHANGES_REQUESTED`) — confirmed real, confirmed not T014's fault, confirmed it blocks
  T015/T019/T021 (all require `npm run web`). T014's own files need no changes; routing a
  separate, narrowly-scoped fix task to `task-implementer` before resuming T015.
- **Dev-server crash fix** (not a numbered task): `task-implementer` found root cause via
  the actual `expo-router` source — `_layout.*` files hit a dev-server-only
  route-manifest-scan conflict that ordinary colocated route tests don't; relocated
  `app/(app)/_layout.web.test.tsx`'s coverage out of `app/`'s route-discovery path (no test
  coverage lost), documented the new `_layout.*`-test-placement rule in
  `docs/conventions.md` so T009/T016 don't hit the same landmine. `code-reviewer` →
  APPROVED, independently reproduced `npm run web` now booting clean with real `200`s at
  `/`, `/amigos`, `/social`. T014 (and this fix) now fully closed; T015 unblocked.
- T015 (US1 manual smoke check): `task-implementer` → done. **CORRECTION to my own earlier
  summary of this task** (caught while resolving a coordinator query later in the session —
  my original bullet here understated what actually happened; the real report is stronger):
  confirmed via a real running `npm run web` + headless Chrome driven over raw CDP (temporary
  gate monkeypatch, fully reverted) that the Home/Scan screen renders with the shell visible,
  no scaffold flash, no unmatched-route error (SC-001); AS6 (live-resize across 768px) was
  confirmed via a genuine OS-level browser window resize (CDP `Browser.setWindowBounds`) with
  a JS global marker proving no reload occurred in either direction — not merely inferred from
  T012's unit test. **A real iOS Simulator (iPhone 17 Pro) WAS booted and used** — real Expo
  Go, real device screenshots — confirming the native bottom tab bar and safe-area composition
  on native. One honest, unresolved gap from this task: reaching Amigos/Social *on native* used
  Expo Go's cold deep-link mechanism as a substitute for a real tap (no Accessibility/UI-
  automation permission was available in the sandbox to simulate an actual tap), and one
  resulting screenshot showed the native tab bar not visible on the Amigos screen reached that
  way — flagged explicitly as unresolved (not attributed to either a real bug or a deep-link
  artifact), recommended for a human with real device access to check by *tapping* the Amigos
  tab from a warm Home screen. Android: genuinely unavailable in this environment (no
  emulator/SDK), not performed, disclosed honestly. `code-reviewer` → APPROVED, independently
  reproduced the core SC-001 claim itself, confirmed `app/_layout.tsx` diff is clean. T015
  `[X]`. **Phase 3 / User Story 1 (MVP) complete.** Starting Phase 4 (US2: "+" card →
  `/scan` navigation, T016-T017).
- Batch (T016 `app/scan.tsx`+wire `HomeScreen`'s "+"card navigation, T017 a11y confirmation
  pass): `task-implementer` → done, navigation uses `SCAN_ROUTE` (no hardcoded string),
  manually confirmed via `npm run web` that press → `/scan` stub → back → intact shell.
  `code-reviewer` → APPROVED, independently reproduced the navigation round-trip, confirmed
  role/name-based a11y query resolves to "Scan a card". Both `[X]` in `tasks.md`. **Phase 4
  / User Story 2 complete.** Starting Phase 5 (US3: T018) + Phase 6 (US4: T019).
- Batch (T018 pill/tab convergence test, T019 `TopRightControls` manual a11y pass):
  `task-implementer` → done, T018's test derives its expectation from `NAV_DESTINATIONS`
  directly (not two independently-drifting assertions); T019 performed a real headless-
  Chrome DOM/keyboard pass against a live `npm run web` server (real Tab/Enter/Space
  dispatch, real `getComputedStyle`/`getBoundingClientRect()` reads) and found nothing
  needing a fix in `TopRightControls.tsx` — flagged one honest gap (no real iOS/TalkBack or
  Android/VoiceOver simulator session this batch; environment constraint, not a skipped
  check). `code-reviewer` → APPROVED. Both `[X]` in `tasks.md`. **All four user stories
  (US1-US4) now implemented and reviewed.** Starting
  Phase 7 (Polish: T020-T022).
- Batch (T020 full-screen a11y/tab-order pass, T021 responsive layout check):
  `task-implementer` → done, found and fixed two real bugs via live-dev-server reproduction:
  (a) the "+" card became clipped/unreachable at short landscape-phone viewports — fixed by
  making `HomeScreen`'s root a `ScrollView` (was a plain `View`); (b) iOS status-bar/Dynamic-
  Island overlap — fixed via `useSafeAreaInsets()`. Both fixes are presentation-only
  (Constitution IV), backed by new regression tests. `code-reviewer` → **APPROVE WITH
  NITS**: (1) flagged that the `ScrollView` fix makes the *whole* screen scroll rather than
  only the top-right controls stack, as spec.md's Edge Cases section illustratively suggested
  — reviewer confirmed this does NOT violate the edge case's binding MUST (no overlap at any
  tested viewport) and was the only fix that actually addressed the reproduced bug (the card,
  not the stack, was what overflowed), but explicitly recommended human sign-off on this
  disclosed deviation before closing; (2) a factual overclaim in the impl report about full
  card visibility at 667x300 — corrected in `progress/impl_004-home-scan-shell.md` directly
  (documentation-only, no code change). Both `[X]` in `tasks.md`. **Surfaced (1) to the
  human before proceeding to T022/close**, per this session's instruction to pause on
  anything touching a spec deviation rather than guess.
- **Human confirmed at the escalation gate**: keep the whole-screen `ScrollView` fix as-is,
  do not narrow it to a stack-only scroll — matches `code-reviewer`'s own reasoning (fixes
  the bug actually reproduced, satisfies the edge case's binding no-overlap MUST,
  presentation-only with regression tests). The human independently amended `spec.md`'s Edge
  Cases section to restate the requirement as the outcome, with an `AMENDED 2026-08-04` note
  — not re-edited by the orchestrator, per instruction. Also instructed: run T022, flip to
  `done`, move this log to history, and commit the branch (no push/PR/merge).
- While preparing the final report, caught and corrected an error in my own T015 log entry
  above (see the T015 bullet's inline correction) — it had understated real verification that
  actually happened (a real iOS Simulator was booted for T015; AS6 was CDP-verified, not just
  inferred from a unit test).
- T022 (final `./init.sh` gate): `task-implementer` → done, full unabridged `./init.sh` run
  → `RESULT: SUCCESS` (10/10), only the pre-existing expo-doctor/native-dep-alignment
  warnings that predate this feature. Confirmed `app/_layout.tsx`/`kyc-gate.ts`/
  `useKycGate.ts` zero diff (FR-009), no stray files. `code-reviewer` → **APPROVE WITH
  NITS** (final, holistic verdict on all 22 tasks): confirmed feature genuinely ready for
  `done` — every FR traced to a real test, zero backend calls, `init.sh` green, all tasks
  `[X]`. Two of three carried-forward nits closed (ScrollView deviation: human-confirmed and
  spec.md amended; 667×300 overclaim: corrected in the impl report). One nit still open,
  explicitly re-flagged for acknowledgment rather than silently dropped a fourth time:
  `WebSidebarNav`/`WebBottomBarNav` (T010/T011) each wrap their own independent
  `expo-router` `<Slot/>`, so the web sidebar↔bottom-bar switch on a breakpoint crossing
  unmounts/remounts the active screen subtree, resetting local component state (e.g.
  `TopRightControls`' toggle) — does NOT violate spec.md's binding AS6 (the active *route*
  survives above this layout), only ephemeral UI feedback state resets. Orchestrator
  acknowledges this explicitly here (recorded in `feature_list.json`'s closing notes too) as
  a known, accepted, non-blocking limitation — candidate for a future follow-up (hoist a
  shared `<Slot/>` above the layout ternary), not fixed in this feature.
- T022 `[X]`. All 22/22 tasks `[X]` and reviewed. `feature_list.json` flipped
  `004-home-scan-shell` to `done`.

## Open questions / blockers

- None blocking. One acknowledged, non-blocking loose end carried into `feature_list.json`'s
  closing notes: the web breakpoint switch resets ephemeral top-right-control feedback state
  (ScrollView/Slot nit above) — candidate for a future small follow-up, not spec-violating.
- One unresolved, disclosed gap from manual native verification (T015): reaching Amigos/
  Social on native during testing used a cold Expo-Go deep link (no real-tap capability in
  the sandbox); one resulting screenshot showed the native tab bar not visible on that screen
  — never reproduced via a real tap, never attributed conclusively to a real bug vs. a
  deep-link artifact. Recommend a human with real device access check: does *tapping* the
  Amigos tab from a warm Home screen keep the tab bar visible?
- Android was never available in this environment at any point in this feature — zero
  Android-specific manual verification was ever performed (inferred-safe, not checked).

## Next step

- Feature is `done`. No next step for `004-home-scan-shell` itself. Follow-ups worth a human
  decision, not auto-spawned: (a) the native tab-bar-on-deep-link anomaly above, (b) whether
  the `<Slot/>` state-reset nit is worth a small fix, (c) a real Android verification pass
  once an emulator/SDK is available.

---

# Session 2026-08-05 — 005-login (closed)

**Started**: 2026-08-05
**Feature**: 005-login
**State**: in_progress -- implementing T001-T020

## What happened this session

- Bootstrap: ran ./init.sh -> RESULT: SUCCESS (10/10 stages). Pre-existing expo-doctor / native-dep-alignment warnings noted (expected, predate this feature, non-blocking).
- Read progress/current.md (empty template, no in_progress feature) and feature_list.json: 001 done, 004 done, 002/003 pending/untouched, 005-login pending with sdd:true -- selected as this session's feature per one-feature-at-a-time.
- Delegating to spec-writer to produce specs/005-login/{spec.md,plan.md,tasks.md} per the human-decided scope in 005-login's feature_list.json notes (email+password sign-in + forgot-password flow; KYC_ROUTE_TARGETS.unauthenticated -> /login with Create-account link to /register; social sign-in and remember-me explicitly out of scope; must reuse signInWithPassword()/NETWORK_SIGN_IN_ERROR_MESSAGE, FormField/RegistrationForm patterns, src/domain/schemas.ts; Principle IV domain/lib split; backend cross-check re Supabase Auth SDK + dev-only X-User-Id cold-boot limitation).

- spec-writer returned: specs/005-login/{spec.md,plan.md,tasks.md} written, feature_list.json status flipped by spec-writer itself to spec_ready (its own responsibility per AGENTS.md). Zero [NEEDS CLARIFICATION] markers -- no speckit-clarify pass needed. Verified directly: grep for the literal marker string across all three files returns only spec.md's own explanatory prose (line 8), not an open marker; spec.md's Clarifications section (lines 42-126) confirmed by direct read.
- Backend cross-check performed by spec-writer against the sibling Draw-a-card backend repo (specs/001-user-registration-kyc/spec.md, src/modules/identity/routes.ts): confirmed sign-in needs nothing extra from the backend (100% Supabase SDK). Also found the backend already ships its own POST /identity/password-reset (privileged admin-credential endpoint) that this feature deliberately does NOT call -- recorded as Clarifications "Recorded default 1" (calls supabase.auth.resetPasswordForEmail() directly instead, per Constitution Principle III + the human's own "Supabase reset-password email" wording).
- Second finding, more load-bearing: tracing app/_layout.tsx's KycGate + expo-router's Redirect showed a classic magic-link deep-link password-reset flow would establish a session the gate observes and would very likely redirect away before the user could set a new password -- fixing that would need a second, unplanned gate-wiring change beyond the human's permitted one-line KYC_ROUTE_TARGETS edit. Resolved via "Recorded default 2": the whole forgot-password flow stays as local view-state on /login (no new route), confirming a code via a second throwaway non-persisted Supabase client instance, reusing the existing CodeInput/VerifyPhoneScreen "type a code" UX pattern.
- Spec also states plainly (not silently implied) that because sign-in never learns the backend User.id, every successful login under this feature currently lands on 001's FR-010 retryable status screen, not the main app -- the pre-existing X-User-Id limitation, out of scope to fix here.
- spec.md: 3 user stories (P1 sign-in+routing/MVP, P2 forgot-password, P3 create-account link), FR-001..FR-010, SC-001..SC-005. plan.md: Constitution Check all PASS. tasks.md: 20 tasks (T001-T020), T006 is the one-line KYC_ROUTE_TARGETS edit with an explicit self-check not to let its diff grow.
- Confirmed via feature_list.json: no other feature moved to in_progress; 002/003 remain untouched/pending, 001/004 remain done.

- HUMAN APPROVAL RECEIVED 2026-08-05: all three items confirmed -- (1) Recorded default 1 CONFIRMED as Option A (supabase.auth.resetPasswordForEmail() directly, never the backend's POST /identity/password-reset -- do not modify that backend endpoint); (2) Recorded default 2 CONFIRMED as Option A (forgot-password stays entirely as local view-state on /login via emailed 6-digit code + throwaway persistSession:false client, no new route, no deep link); (3) SPEC APPROVED, proceed past the gate. Human also flagged: the Supabase dashboard's Reset Password email template {{ .Token }} configuration is their own out-of-repo step, already acknowledged, not a blocker for implementation/tests -- must be mentioned again in the final report so it isn't forgotten.
- feature_list.json: 005-login flipped to in_progress by orchestrator, "branch": "005-login" added.
- Invoked feature-branch skill: git status showed feature_list.json/progress/current.md/specs/005-login/ as this feature's own uncommitted work (nothing belonging to another feature) -> stashed with `git stash push -u -m "005-login pre-branch"`. Fetched origin, checked out main, `git pull --ff-only` fast-forwarded a461fc4 -> 293746f (2 commits: the merged PR #2 bringing in 004-home-scan-shell's full shell work, confirming the human's note that 004's merge must be in this branch's base). No local branch/origin branch named 005-login existed yet, so cut fresh: `git checkout -b 005-login` from that up-to-date main. `git stash pop` restored the feature's own changes cleanly, no conflicts. Verified feature_list.json post-pop: 001 done, 002/003 pending untouched, 004 done, 005-login in_progress/branch 005-login -- as expected. Ran ./init.sh -> RESULT: SUCCESS (10/10 stages, same pre-existing expo-doctor/native-dep warnings as before, non-blocking).
- Ready to begin delegating tasks.md's T001-T020 to task-implementer in small batches, each followed by code-reviewer, per AGENTS.md §4. Standing constraints restated for this pass: KYC_ROUTE_TARGETS.unauthenticated is the ONLY permitted gate-wiring edit (resolveKycRoute() and app/_layout.tsx's KycGate untouched); reuse signInWithPassword() (MUST-NEVER-THROW preserved); Principle IV domain/lib split; Principle VII responsiveness on web via file-convention splits; verification must be honest about what was actually exercised on which platform (real dev server + iOS Simulator if available, no inferred Android coverage).

- Read tasks.md in full (20 tasks). Batching plan: A) T001+T002 Foundational; B) T003+T004 SignInForm+LoginScreen(sign-in mode); C) T005 screen glue; D) T006 the one-line gate edit (isolated for scrutiny); E) T007 MVP manual smoke; F) T008+T009 reset schemas+domain; G) T010 supabase-client extension (throwaway client, sensitive); H) T011+T012 the two reset form components (parallel-safe); I) T013+T014 LoginScreen reset modes + screen wiring; J) T015 US2 manual smoke; K) T016 US3 link confirmation; L) T017+T018 a11y+responsive; M) T019 docs; N) T020 final ./init.sh.
- Batch A (T001, T002) -> task-implementer: done -> progress/impl_005-login.md. Added passwordSchema (byte-for-byte no-op refactor of personalRegistrationSchema.password) and signInSchema to src/domain/schemas.ts; created src/domain/login.ts (submitSignIn, zero RN imports, reuses SignInWithPassword type from registration.ts) + login.test.ts.
- Batch A -> code-reviewer: APPROVED -> progress/review_005-login.md. Confirmed passwordSchema is a true no-op, signInSchema password field correctly min(1) not passwordSchema, zero React/RN imports in login.ts, type reused not redeclared, submitSignIn behavior correct, type-check and tests independently re-run clean.

- Batch B (T003, T004) -> task-implementer: done -> progress/impl_005-login.md (Run 2). Created SignInForm.tsx (+test) following RegistrationForm/FormField conventions, general serverError only, onForgotPassword local-state trigger, Link href="/register"; LoginScreen.tsx (+test) with mode state (only "sign-in" handled yet), neutral "Signing you in..." view on success, never navigates. tasks.md T003/T004 marked [X]. Full jest (40 suites/252 tests) green, tsc clean.
- Batch B -> code-reviewer: APPROVED -> progress/review_005-login.md (appended). Confirmed conventions followed, serverError is general/single, "Forgot password?" does not navigate (grepped for useRouter/router.push/replace/Redirect -- none present), Create-account Link href exactly /register, LoginScreen never calls navigation on success, network vs credentials errors render distinctly, submitSignIn reused correctly. Independently re-ran type-check + full jest.

- Batch C (T005) -> task-implementer: done -> progress/impl_005-login.md (Run 3). Created app/(auth)/login.tsx (thin glue wiring signInWithPassword via submitSignIn into LoginScreen) + login.test.tsx (asserts real signInWithPassword call + never-navigates regression guard). src/lib/supabase-client.ts untouched. tasks.md T005 [X]. Full jest 254/254 across 41 suites, tsc clean.
- Batch C -> code-reviewer: APPROVED -> progress/review_005-login.md (appended). Confirmed thin-glue pattern matches register.tsx, FR-006 navigation constraint holds at the outermost screen-glue layer (grepped useRouter/router.push/replace/Redirect), supabase-client.ts diffed as byte-for-byte unchanged, error mapping correct. Independently re-ran type-check + full jest.

- Batch D (T006) -> task-implementer: done -> progress/impl_005-login.md (Run 4). Changed exactly KYC_ROUTE_TARGETS.unauthenticated "/register" -> "/login" in useKycGate.ts. Orchestrator independently ran `git diff` on useKycGate.ts/kyc-gate.ts/app/_layout.tsx before sending to review -- confirmed exactly one line, one file changed.
- Batch D -> code-reviewer: APPROVED -> progress/review_005-login.md (appended). Confirmed via independent git diff: resolveKycRoute()/kyc-gate.ts and app/_layout.tsx byte-for-byte unchanged, no other KYC_ROUTE_TARGETS entry touched. Explicitly addressed Constitution Principle III (no new auth/session code path, purely a redirect-target literal) -- verified per AGENTS.md's requirement that gate/auth-touching reviews explicitly address constitution principles. Independently re-ran useKycGate.test.ts/kyc-gate.test.ts (27/27) + full suite (254/254) + full ./init.sh (RESULT: SUCCESS). One non-blocking nit (Finding 1): FR-002 has no automated test asserting the literal KYC_ROUTE_TARGETS.unauthenticated === "/login" value (existing suites correctly assert only the abstract KycRoute value, not the URL string, per T006's own "do not modify" instruction) -- reviewer flagged this must not be silently dropped, becomes blocking at final feature review if still uncovered. Folding a one-line regression test into the T007 batch.

- FR-002 regression test: delegated to task-implementer (small targeted addition, not a tasks.md-numbered task) -> done -> impl_005-login.md Run 5. Added one assertion to useKycGate.test.ts confirming KYC_ROUTE_TARGETS.unauthenticated === "/login" literally; useKycGate.ts/kyc-gate.ts confirmed byte-for-byte unchanged (absent from git status).
- T007 MVP manual smoke check: task-implementer lacks browser/simulator tools (Read/Write/Edit/Bash/Grep/Glob only), so performed directly by the orchestrator instead, disclosed as a deviation. Ran full jest (255/255) + tsc clean first. Started real npm run web dev server (port 8081), drove it via the Claude Browser tool: confirmed cold boot lands on /login not /register (window.location.href verified); Create-account link resolves to exactly /register; client-side email validation blocks submission with zero network calls issued (verified via read_network_requests); invalid-credentials submission renders ONE general inline error, traced via console to a genuine net::ERR_NAME_NOT_RESOLVED against the placeholder Supabase host (this sandbox's .env has empty EXPO_PUBLIC_SUPABASE_URL/ANON_KEY -- same pre-existing gap 001-registration-kyc already disclosed) -- honestly noted that the rendered text was the raw "Failed to fetch" string rather than the polished NETWORK_SIGN_IN_ERROR_MESSAGE copy, flagged as pre-existing behavior of the reused unmodified signInWithPassword(), not a defect introduced by this feature. Credentials-differentiation (wrong password vs unregistered email) and the successful-sign-in landing screen could NOT be verified live (no real Supabase project reachable) -- covered only at the already-reviewed unit-test level instead, disclosed plainly rather than implied. iOS Simulator attach FAILED (Xcode not selected on this machine, needs sudo + human password) -- disclosed, no silent fallback to generic screen tools per the tool's own instruction. Android not attempted (no emulator/SDK, consistent with every prior feature). Findings appended as Run 6 to impl_005-login.md; T007 marked [X] in tasks.md.
- Batch (FR-002 test + T007) -> code-reviewer: APPROVED -> progress/review_005-login.md (appended). Independently verified the FR-002 test genuinely asserts the literal string, re-ran unit tests to confirm LoginScreen.test.tsx/login.test.tsx actually cover the credentials/success scenarios Run 6 claims; independently read signInWithPassword's T034 doc comment and agreed the "Failed to fetch" vs NETWORK_SIGN_IN_ERROR_MESSAGE discrepancy is pre-existing reused-function behavior, not this feature's defect; agreed web-only coverage with honestly-stated gaps is sufficient to close the Phase 3/MVP checkpoint and proceed to Phase 4.
- Phase 3 (User Story 1 / MVP) checkpoint: COMPLETE and reviewed.

- Batch F (T008, T009) -> task-implementer: done -> impl_005-login.md Run 7. Added PASSWORD_RESET_CODE_LENGTH=6, requestPasswordResetSchema, resetPasswordWithCodeSchema (reusing passwordSchema) to schemas.ts; created src/domain/passwordReset.ts (requestPasswordReset, submitNewPassword with verify->update->discard-always control flow, zero RN imports) + passwordReset.test.ts. tasks.md T008/T009 [X]. Full jest 269/269 across 42 suites, tsc clean.
- Batch F -> code-reviewer: APPROVED -> progress/review_005-login.md (appended). Independently read submitNewPassword line-by-line confirming exact control flow (verifyCode error -> discard() then return, updatePassword never called; verifyCode success -> updatePassword then discard() unconditionally regardless of outcome); confirmed all branches tested including discard-called-exactly-once and discard-still-called-on-updatePassword-failure; confirmed PASSWORD_RESET_CODE_LENGTH used via regex not duplicated, passwordSchema reused not reinvented; zero RN imports. Independently re-ran type-check + full jest.

- Batch G (T010) -> task-implementer: done -> impl_005-login.md. Added requestPasswordReset (shared singleton, correct per design) + createPasswordRecoverySession (second throwaway client, persistSession:false/autoRefreshToken:false, never touches shared singleton) to supabase-client.ts. signInWithPassword/NETWORK_SIGN_IN_ERROR_MESSAGE byte-for-byte unchanged. Full jest 282/282, tsc clean.
- Batch G -> code-reviewer: APPROVED -> progress/review_005-login.md (appended). Extra scrutiny warranted and applied: reviewer independently read createPasswordRecoverySession line-by-line, then performed a deliberate sabotage-and-restore mutation test on the isolation-proving test itself (temporarily broke the implementation to confirm the regression test would actually catch it, then restored -- confirmed repo state matches original diff exactly afterward) rather than just trusting the test passed. Confirmed isolation guarantee is PROVEN not merely assumed. Explicitly addressed Constitution Principle III (SDK-only, no hand-rolled session logic, persistSession:false is a standard supported SDK config) and Principle II (no backend call, grepped). requestPasswordReset correctly uses shared singleton (no session side effect, no isolation concern). DI types match T009 exactly.

- Batch H (T011, T012) -> task-implementer: done -> impl_005-login.md. Created RequestPasswordResetForm.tsx (+test) with identical anti-enumeration confirmation copy regardless of domain result; ResetPasswordForm.tsx (+test) with editable initialEmail-prefilled field, reused CodeInput, passwordSchema new-password field, VerifyPhoneScreen-mirrored resend-cooldown pattern. Full jest + tsc clean.
- Batch H -> code-reviewer: APPROVED -> progress/review_005-login.md (appended). Confirmed no email-exists/doesn't-exist leak in RequestPasswordResetForm's copy (FR-007 anti-enumeration held); confirmed initialEmail field genuinely editable not disabled; confirmed resend-cooldown is genuinely the same mechanism as VerifyPhoneScreen.tsx (same constant, same timer shape), not a reinvention; LoginScreen.tsx/app/(auth)/login.tsx confirmed untouched.

- Batch I (T013, T014) -> task-implementer: done -> impl_005-login.md Run 10. Extended LoginScreen.tsx with request-reset/reset-with-code modes, lazy recovery-session creation, full state cleanup on Back-to-sign-in; wired app/(auth)/login.tsx's real requestPasswordReset/createPasswordRecoverySession through passwordReset.ts. Implementer self-disclosed two unresolved gaps in Deviations rather than hiding them.
- Batch I -> code-reviewer: CHANGES_REQUESTED -> progress/review_005-login.md (appended). Core guarantees (lazy creation, no-residual-state cleanup including second-attempt reuse, the reset-with-code-never-touches-signIn regression guard, domain/lib separation to the outermost layer) all independently confirmed solid -- reviewer traced the actual user-driven transition sequence, not a shortcut. BLOCKING Finding 1: LoginScreen.tsx's handleRequestReset unconditionally advances to "reset-with-code" regardless of whether requestPasswordReset succeeded -- a network-level failure is silently swallowed and the user is shown the code-entry screen as if an email had been sent, violating spec.md's Edge Cases network-failure requirement and SC-002. Zero test coverage of this path (CHECKPOINTS C6 gap). Non-blocking Finding 2 (resolve in same pass, not deferred again): the anti-enumeration confirmation copy is set then instantly unmounted on transition to reset-with-code, so a real user never sees it, conflicting with US2 AS2's "shown" requirement -- reviewer offered two options (visible confirmation before code-entry, or equivalent static copy on ResetPasswordForm itself), implementer/orchestrator to pick one.
- Full 298-test suite, tsc, and full ./init.sh (10/10) all independently re-run and pass in this review despite the CHANGES_REQUESTED verdict -- the gap is a missing error-handling branch + missing UX confirmation, not a broader regression.

- Fix pass -> task-implementer: done -> impl_005-login.md Run 11. Fix 1: handleRequestReset now branches on requestPasswordReset's result -- error keeps mode in "request-reset" with serverError shown via new RequestPasswordResetForm prop, success proceeds to "reset-with-code". Fix 2: orchestrator directed option (b) -- static always-shown RESET_CODE_SENT_MESSAGE added to ResetPasswordForm.tsx (not gated on any result, correct since requestPasswordReset is anti-enumeration by design). RequestPasswordResetForm's onSubmit now resolves boolean. Full suite 301/301, tsc clean, full ./init.sh RESULT: SUCCESS (10/10).
- Fix pass -> code-reviewer (re-review): APPROVED -> progress/review_005-login.md (appended). Independently re-verified both fixes against actual code/tests (not taken on faith): handleRequestReset genuinely branches and stays in request-reset mode on error with the error shown; the LoginScreen.test.tsx addition genuinely mocks an error result and asserts no mode advance; RESET_CODE_SENT_MESSAGE confirmed genuinely unconditional, not prop-gated; RequestPasswordResetForm's boolean-contract change confirmed not to break any other caller; diff scope confirmed via git status/diff to exactly the six claimed files; re-confirmed the first review's already-approved guarantees (lazy creation, no-residual-state cleanup, reset-with-code-never-touches-signIn guard, domain/lib separation) still intact.
- Phase 4 (User Story 2) screen-level integration (T013/T014) now COMPLETE and approved.

- T015 (orchestrator-performed, real dev server via Claude Browser tool, same tool-access reasoning as T007): confirmed "Forgot password?" reaches a working request-reset screen; LIVE-confirmed the T013/T014 Fix 1 behavior -- submitting an email against this sandbox's unreachable placeholder Supabase host produced the same net::ERR_NAME_NOT_RESOLVED/"Failed to fetch" failure as T007, and the screen correctly stayed on request-reset mode with the error shown inline rather than silently advancing (the exact bug the CHANGES_REQUESTED round caught, now independently reconfirmed against the real running app, not just the mocked unit test); "Back to sign in" cleanly returns to a fresh sign-in view with no residual state/error. reset-with-code mode (code-entry+new-password) could not be reached live (needs a successful request, which needs a real Supabase project this sandbox lacks) -- disclosed plainly, covered only at the unit-test level (already reviewed/approved). No console errors beyond the two expected network-failure traces. iOS Simulator/Android not attempted (same disclosed Xcode gap as T007). Findings appended as Run 12 to impl_005-login.md; T015 marked [X] in tasks.md.
- T015 -> code-reviewer: APPROVED -> progress/review_005-login.md (appended). Independently re-verified the Fix-1-confirmed-live claim against handleRequestReset's actual code and LoginScreen.test.tsx; re-confirmed .env still has empty Supabase credentials so deferring reset-with-code to unit-test-only coverage is reasonable and honestly disclosed; confirmed all of T008-T015 marked [X] in tasks.md with every one ending APPROVE (accounting for the single CHANGES_REQUESTED->fix->APPROVE cycle on T013/T014); full suite + type-check independently re-run clean.
- Phase 4 (User Story 2 / forgot-password) COMPLETE and reviewed.

- Batch K (T016) -> task-implementer: done -> impl_005-login.md. Confirmed href assertion already existed in SignInForm.test.tsx from T003 (nothing to add); confirmed git diff main -- register.tsx/RegistrationForm.tsx/registration.ts is genuinely empty -- all three byte-for-byte unchanged. Full jest 301/301, tsc clean. T016 [X].
- Batch K -> code-reviewer: APPROVED -> progress/review_005-login.md (appended). Independently re-ran the same git diff (confirmed empty), independently read SignInForm.test.tsx's href assertion. Noted all three user stories (US1/US2/US3) now complete -- only Phase 6 Polish (T017-T020) remains.
- Phase 5 (User Story 3) COMPLETE and reviewed.

- Batch L (T017, T018) -> task-implementer: done -> impl_005-login.md Run 13. Fixed 3 findings: added minWidth:44 to SignInForm's forgotPasswordButton/createAccountLink, RequestPasswordResetForm's backButton, ResetPasswordForm's backButton; changed LoginScreen's "Signing you in..." accessibilityRole "text"->"alert" for screen-reader live-region announcement (+ new test). T018 audited as already compliant (RegistrationForm's established width:100%/maxWidth:420 pattern followed throughout, no row layouts, no hardcoded widths) -- no changes needed, honestly reported rather than inventing findings.
- Orchestrator live-verification follow-up (Run 14, same tool-access reasoning as T007/T015): walked real keyboard tab order via browser in sign-in mode (Email->Password->Forgot password?->Sign in->Create account) and request-reset mode (Email->Send reset code->Back to sign in), confirmed a real non-suppressed focus ring via getComputedStyle; resized to 375x812 and 1440x900, confirmed no horizontal overflow (scrollWidth===clientWidth) and correct maxWidth:420 desktop capping via screenshots. reset-with-code mode's live tab order not reachable (same no-backend limitation); sign-in/reset-with-code not individually re-screenshotted at 375px (reasonable inference from shared container pattern, disclosed).
- Batch L -> code-reviewer: APPROVED -> progress/review_005-login.md (appended). Independently re-read all diffs confirming minWidth/accessibilityRole changes exactly as claimed and the new test is meaningful; independently re-verified T018's already-compliant styles across all four files; assessed Run 14's live-verification gaps (reset-with-code tab order, per-mode 375px screenshots) as reasonable disclosed limitations, not blocking. Full suite + type-check independently re-run.
- Phase 6 Polish: T017/T018 COMPLETE. Only T019 (docs) and T020 (final ./init.sh) remain.

- T019 -> task-implementer: done -> impl_005-login.md. Documented the Supabase Reset Password email-template {{ .Token }} prerequisite (one-time, out-of-repo dashboard step) and the throwaway-client design note in src/features/identity/README.md, following the file's existing 001-registration-kyc conventions. Docs-only change; full jest/tsc re-confirmed clean.
- T019 -> code-reviewer: APPROVED -> progress/review_005-login.md (appended). Independently confirmed the email-template prerequisite description matches spec.md's Assumptions framing exactly, and the throwaway-client design note accurately describes createPasswordRecoverySession() against the actual current supabase-client.ts code (second non-shared persistSession:false instance, separate from the singleton). Confirmed via git status/diff that only README.md changed.
- Phase 6 Polish: T001-T019 all COMPLETE and reviewed. Only T020 (final full ./init.sh) remains.

- T020 -> task-implementer: done -> impl_005-login.md. Full unflagged ./init.sh -> RESULT: SUCCESS (10/10 stages): type-check clean, 302/302 tests across 44 suites (including useKycGate.test.ts/kyc-gate.test.ts/all register.test.tsx suites, confirming T006's one-line gate change didn't break routing or 001's tests), all three bundle exports (web/iOS/Android) clean. tasks.md T020 marked [X] -- all 20 tasks now [X].
- FINAL FEATURE-LEVEL REVIEW (all 20 tasks, feature as a whole, not per-task re-litigation) -> code-reviewer: APPROVED, READY TO BE MARKED done -> progress/review_005-login.md. Independently re-confirmed, fresh from disk: all FR-001..FR-010 traced to real passing tests (table in review); all three human-approved scope decisions hold byte-for-byte as approved (direct-SDK password reset -- zero backend /identity/password-reset calls; no new route for forgot-password -- zero /reset-password file exists; KYC gate diff is exactly the one line, kyc-gate.ts/app/_layout.tsx byte-for-byte unchanged from main); social sign-in and remember-me confirmed absent (grepped); CHECKPOINTS C1-C6 walked for the feature as a whole -- no blocking empty box (the one [ ], C5's progress/history.md session-close entry, is explicitly this orchestrator's own post-review job); independently re-ran tsc/full jest (302/302)/full ./init.sh (RESULT: SUCCESS) itself rather than trusting T020's report; honest accounting of live-vs-unit-test-only coverage given (matches this session's own T007/T015/T017-T018 disclosures, mirrors 001's own already-accepted live-backend/live-device gaps, not new risk). One explicit non-blocking recommendation for the human: the reset-with-code flow's real live-Supabase/real-emailed-code path has never been watched working end-to-end in this sandbox (no reachable Supabase project) -- recommend a real manual pass against a live Supabase project as a near-term post-merge follow-up.
- Phase 6 Polish: ALL of T001-T020 COMPLETE and reviewed. Feature 005-login is READY TO BE MARKED done.

## Open questions / blockers

- None blocking. One post-merge recommendation from the final review (not a blocker): run a real manual pass against a live Supabase project to watch the reset-with-code flow work end-to-end with a real emailed code, since this sandbox never had reachable Supabase credentials to do so itself.
- Human reminder, explicitly requested not to be forgotten: the Supabase project dashboard's "Reset Password" email template must include `{{ .Token }}` for the code-based reset flow to actually deliver a code by email -- a one-time, out-of-repo dashboard step, documented in spec.md's Assumptions and src/features/identity/README.md.

## Next step

- Feature is `done`. No next step for `005-login` itself. Follow-ups worth a human decision, not auto-spawned: (a) the live-Supabase manual pass for reset-with-code above, (b) the Supabase dashboard email-template configuration reminder above, (c) a real iOS Simulator pass once Xcode is selected on this machine (`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`), (d) a real Android verification pass once an emulator/SDK is available.
