# AGENTS.md — Navigation map for AI agents

> This file is the **entry point** for any agent working in this repository. It is NOT a
> rulebook of everything — it's a **map**. Read only what you need, when you need it
> (progressive disclosure).

## 1. Before starting anything (required)

1. Run `./init.sh` and confirm it ends with `RESULT: SUCCESS`. If it fails, **stop** and fix
   the environment before touching code. (A "no test script yet" warning is expected until
   the first feature that needs tests sets up tooling — see `docs/verification.md`.)
2. Read `progress/current.md` to see what state the last session left things in.
3. Read `feature_list.json`. Every feature with `"sdd": true` goes through **Spec Driven
   Development** — see §4 below.
4. Before touching any spec or `"sdd": true` feature, read the relevant
   `.claude/skills/speckit-*/SKILL.md` file for the phase you're in (specify / clarify / plan
   / tasks / implement / analyze) and `.specify/memory/constitution.md`.

## 2. Repo map

| Path | What it holds | Read it when |
|---|---|---|
| `feature_list.json` | Status per feature: `pending` / `spec_ready` / `in_progress` / `done` / `blocked` | Always, at start |
| `progress/current.md` | State of the session in progress | Always, at start |
| `progress/history.md` | Append-only log of past sessions | When you need historical context |
| `progress/impl_<feature>.md` | `task-implementer`'s full report: files changed, tests, FR→test traceability | Written by `task-implementer`, read by `code-reviewer` and `sdd-orchestrator` |
| `progress/review_<feature>.md` | `code-reviewer`'s full verdict: traceability, tasks checklist, `CHECKPOINTS.md` walkthrough, findings | Written by `code-reviewer`, read by `sdd-orchestrator` (and you, before trusting a "done") |
| `specs/<feature>/spec.md` + `plan.md` + `tasks.md` | Spec Kit's spec / technical plan / task breakdown for one feature — platform differences noted inline, not as separate docs | Before implementing any `"sdd": true` feature |
| `.specify/memory/constitution.md` | Binding architecture decisions (Expo/RN, `src/domain`/`src/lib`/`src/features` boundary), tech stack, non-negotiable principles | Before any implementation decision |
| `docs/conventions.md` | Code style, naming, component structure | Before writing code |
| `docs/verification.md` | What counts as tested, verification levels, test-tooling status, anti-patterns | Before declaring a task `done` |
| `CHECKPOINTS.md` | Repo-hygiene / harness-health self-audit (distinct from code review) | `code-reviewer` walks this before approving |
| `.claude/skills/speckit-*/SKILL.md` | The actual SDD process definition (specify → clarify → plan → tasks → implement → analyze → checklist) | Before writing or reading a spec |
| `.claude/skills/feature-branch/SKILL.md` | Sync `main` and cut/resume the feature's own branch (one branch per feature, named after the feature id) | At `pending` → `in_progress`, before the first `task-implementer` call, and when resuming a feature in a fresh session |
| `.claude/agents/` | Subagent definitions: `sdd-orchestrator`, `spec-writer`, `task-implementer`, `code-reviewer` | If you're orchestrating work across a feature |
| `.claude/settings.json` | Hooks that enforce verification automatically (type-check on every edit, `init.sh` on session stop) — not optional, the harness runs these regardless of what an agent decides | If you're wondering why a check ran without being asked |
| `app/` | expo-router screens (routing layer) | To implement a route/screen |
| `src/domain/` | Portable business logic — zero React Native imports (api-client, types, schemas) | For logic that isn't UI |
| `src/lib/` | Expo-specific adapter layer (Supabase client, configured API instance) | For platform wiring |
| `src/features/` | UI screens/components by domain, mirroring the backend's modules | For UI implementation |
| `init.sh` | One-shot local env setup: install, type-check, expo-doctor, native dependency alignment, tests, and bundle export checks for **all three** targets (web, iOS, Android) | To verify your environment or before declaring a task done |

No separate `docs/architecture.md` or `docs/specs.md` — the constitution already covers
architecture/tech stack, and the `speckit-*` skills already are the process definition.
Don't create parallel docs that can drift out of sync with those; extend the existing ones.

This app talks to the `Draw-a-card` backend repo (Constitution Principle II/VIII) — running
`./init.sh` here does not start or check that backend; run its own `init.sh` separately when
you need the API up too.

### Anti-telephone-game rule

Subagents don't paste full reports into chat. `spec-writer`, `task-implementer`, and
`code-reviewer` each write their detailed output to a file on disk and return **one line**
(`spec_ready -> specs/<feature>/`, `done -> progress/impl_<feature>.md`,
`APPROVED -> progress/review_<feature>.md`, etc.). If you need the detail, read the file —
don't ask an agent to repeat itself in chat.

## 3. Hard rules (non-negotiable)

- **One feature `in_progress` at a time.** `sdd-orchestrator` won't start a second feature
  while one is already `in_progress` — it surfaces the conflict instead.
- **Never mark a task or feature `done` without a green `./init.sh`** (test-tooling-missing
  warning excepted until it's genuinely that feature's job to add it).
- **Never skip the spec phase.** Every `"sdd": true` feature goes through `spec-writer` and
  gets human approval before any code is touched.
- **Never skip the human-approval gate at `spec_ready`.** `sdd-orchestrator` stops there and
  waits for an explicit go-ahead.
- **Business logic stays out of components** (Constitution Principle IV) — `src/domain`/
  `src/lib` only.
- **Never talk to Postgres/Redis/S3/Supabase tables directly** — the backend API and the auth
  SDK are the only data paths (Constitution Principles II/III).
- **Log what you're doing in `progress/current.md` as you go**, not only at the end.
- **Leave the repo clean** before closing a session (see §5).
- **If you don't know something, check `.specify/memory/constitution.md` or the relevant
  `speckit-*` skill first** — don't invent process.

## 4. Workflow (SDD)

```
pending → [spec-writer] → spec_ready → ⏸ HUMAN → in_progress → [task-implementer → code-reviewer] → done
```

1. `sdd-orchestrator` resumes an `in_progress` feature from `progress/current.md` if one
   exists, otherwise picks the first `pending` feature with `"sdd": true` in
   `feature_list.json`.
2. It delegates to `spec-writer`, which creates `specs/<feature>/{spec,plan,tasks}.md` and
   flips that feature's status to `spec_ready` in `feature_list.json` itself, once `spec.md`
   has no open `[NEEDS CLARIFICATION]` markers — or to `blocked` if it needs clarification
   first, returning `blocked -> specs/<feature>/spec.md` for `sdd-orchestrator` to relay.
3. **Pause.** The human reads `specs/<feature>/` and approves, or asks for changes.
4. Once approved, `sdd-orchestrator` flips status to `in_progress`, invokes the
   `feature-branch` skill to sync `main` and cut the feature's branch (named exactly after the
   feature id — one branch per feature, one PR back to `main`), and only then starts delegating
   tasks to `task-implementer`.
5. `task-implementer` executes `tasks.md` one task (or small independent batch) at a time,
   marking each `[X]` as it completes it, writing its report to
   `progress/impl_<feature>.md`.
6. `code-reviewer` independently re-runs type-check/tests and reviews the diff against spec,
   plan, constitution, `docs/conventions.md`, `docs/verification.md`, and `CHECKPOINTS.md` —
   writes its verdict to `progress/review_<feature>.md` and either approves or requests
   changes back to `task-implementer`.
7. Once every task is `[X]` and reviewed, `sdd-orchestrator` flips status to `done`, and moves
   the session summary from `progress/current.md` into `progress/history.md`.

For how many subagents a given feature warrants, see the escalation table in
`.claude/agents/sdd-orchestrator.md`.

## 5. Closing a session

Before you stop:

1. Run `./init.sh` — confirm it's green (warnings are fine, failures aren't).
2. If a feature finished: set its `status` to `"done"` in `feature_list.json`.
3. Move the summary in `progress/current.md` to the end of `progress/history.md`.
4. Reset `progress/current.md` back to its template.
5. Leave no temp files, no debug `console.log`s, no context-free TODOs.

## 6. If you're stuck

- Re-read the relevant part of `.specify/memory/constitution.md` or the applicable
  `speckit-*` skill.
- If a tool doesn't do what you expect, **don't invent a workaround** — write the blocker in
  `progress/current.md` and stop the session.
