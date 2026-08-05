# CHECKPOINTS — evaluating final state

> In multi-agent systems you don't grade the path, you grade the destination. These are the
> objective checkpoints a reviewer (human or `code-reviewer`) uses to decide whether the repo
> is healthy. This is a repo-hygiene / harness-health checklist — distinct from code-level
> review, which is covered by `docs/conventions.md` and `docs/verification.md`.

## C1 — The harness is complete

- [ ] `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md` all exist.
- [ ] `docs/verification.md` and `docs/conventions.md` exist.
- [ ] `.specify/memory/constitution.md` exists and is current.
- [ ] `./init.sh` exits 0 (test-tooling-not-installed-yet warning excepted, per
      `docs/verification.md`).

## C2 — State is coherent

- [ ] At most one feature is `in_progress` in `feature_list.json`.
- [ ] Every `done` feature has passing tests covering it (or documented manual verification
      for the period before test tooling existed).
- [ ] `progress/current.md` describes only the active session — no leftover content from a
      previous, already-closed session.

## C3 — Code respects the architecture

- [ ] `src/domain` has zero React Native / Expo imports (Constitution Principle IV) —
      it stays portable TypeScript.
- [ ] UI components in `src/features` and `app/` call into `src/domain`/`src/lib` rather than
      embedding fetch calls, validation, or business rules directly.
- [ ] Platform-specific code uses the `.ios.tsx`/`.android.tsx`/`.web.tsx` convention or
      `Platform.select`, not inline conditionals scattered through shared components.
- [ ] No direct calls to Postgres/Redis/S3/Supabase tables from the app — all data through
      the backend API or the auth provider's SDK only (Constitution Principles II/III).
- [ ] No new global state library added without a documented, demonstrated need.
- [ ] No stray `console.log` debug statements, no context-free `TODO`s.

## C4 — Verification is real

- [ ] Every exported `src/domain` function with logic has a covering unit test, once test
      tooling exists for that feature area (see `docs/verification.md`).
- [ ] New/changed screens have component tests using React Native Testing Library, asserting
      on rendered output — not implementation details.
- [ ] `./init.sh`'s build checks pass for **all three** targets (`expo export` for web, iOS,
      and Android — each is its own stage), and its "Native dependency alignment" stage is not
      FAILing (an undeclared `expo-router` peer means the app will crash at runtime on native
      even though every bundle and test is green).

## C5 — The session closed well

- [ ] No suspicious untracked files (`*.tmp`, `.expo/` cache artifacts outside
      `.gitignore`, stray logs).
- [ ] `progress/history.md` has an entry for the session just closed.
- [ ] The last feature worked on is reflected accurately in `feature_list.json`.

## C6 — Spec Driven Development

- [ ] Every feature with `"sdd": true` in `spec_ready`, `in_progress`, or `done` has
      `specs/<name>/spec.md` + `plan.md` + `tasks.md`.
- [ ] `spec.md` has no open `[NEEDS CLARIFICATION]` markers once the feature is past
      `spec_ready`.
- [ ] Every `done` feature with `"sdd": true` has all its `tasks.md` items marked `[X]`.
- [ ] Every `FR-00x` in `spec.md` is covered by at least one test referencing it, once test
      tooling exists for that feature area.

---

**How to use this file:** `code-reviewer` walks every checkbox, marks it `[x]` or `[ ]` in its
`progress/review_<feature>.md` report, and rejects the review if any box in C1–C6 is empty
(excluding the explicitly-conditional test-tooling items before it's been set up).
