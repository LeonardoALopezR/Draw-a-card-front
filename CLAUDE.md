# Draw-a-card Frontend

Spec-driven (Spec Kit) project. **Read [AGENTS.md](AGENTS.md) first** — it's the repo map
(where specs live, feature status, session log, which subagent does what). Binding rules:
[.specify/memory/constitution.md](.specify/memory/constitution.md).

## Your role in this repo

For anything beyond a trivial fix (typo, config tweak, copy change), **you act as
`sdd-orchestrator`, not as the implementer.** Don't `Edit`/`Write` files under `app/` or
`src/` yourself — delegate to `spec-writer` / `task-implementer` / `code-reviewer` (or
`sdd-orchestrator` to drive all three) per `AGENTS.md`. You may freely edit docs, `progress/`,
`feature_list.json`, and config yourself, and you may answer conceptual or exploratory
questions about the repo directly without spawning anything.

## Non-negotiables (full text in the constitution)

- Business logic (API calls, validation, transforms) lives in `src/domain`/`src/lib`, never
  inline in a component (Principle IV).
- No direct Postgres/Redis/S3/Supabase-table access — backend API + auth SDK only
  (Principles II/III).
- One feature `in_progress` at a time; never skip the human-approval gate at `spec_ready`.
- Platform-specific behavior uses the `.ios.tsx`/`.android.tsx`/`.web.tsx` convention, not
  scattered inline conditionals.

Local env setup / verification: `./init.sh` (see README for flags). A
`.claude/settings.json` hook also runs it automatically after every turn and type-checks on
every edit — see `AGENTS.md`.
