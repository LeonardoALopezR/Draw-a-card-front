# Draw-a-card — Frontend

Single Expo (React Native) codebase targeting iOS, Android, and web (via
`react-native-web`) for the Draw-a-card TCG portfolio, scanning, social, and trading
platform. Talks to the `Draw-a-card` backend repo's API — see that repo for the database
schema and API implementation.

## Why one codebase

Almost the entire product sits behind authentication — no public marketing pages, no
SEO-critical surfaces. That's what makes a single Expo/`react-native-web` codebase the
right tradeoff here instead of a separate Next.js web app: no duplicated screens, one
team, one thing to ship. See `.specify/memory/constitution.md` Principle I for the full
reasoning, including when this would be worth revisiting (a future public marketing site or
public shop/auction listings meant to rank on Google).

## Designed for eventual native migration

This app may later split into fully native apps (Kotlin/Swift) and/or a standalone React
web app once the product and team have grown. To keep that realistic later:

- **`src/domain/`** — plain TypeScript, zero React Native imports. API client shape, data
  types, Zod validation schemas. Portable to any future codebase almost unchanged.
- **`src/lib/`** — the Expo-specific adapter layer (Supabase client with secure storage,
  the configured API instance). This is what a native rewrite would need to reimplement in
  Kotlin/Swift; everything in `src/domain` stays as reference logic either way.
- **`src/features/`** — UI screens/components, organized by domain, calling into
  `src/domain`/`src/lib` rather than embedding business logic inline.

See `.specify/memory/constitution.md` Principle IV for the binding rule on this boundary.

## Stack

- Expo + expo-router, TypeScript, targeting iOS/Android/web from one codebase
- React Query for data fetching
- Supabase Auth SDK with `expo-secure-store` for session persistence on native
- React Hook Form + Zod for forms/validation

## Spec-driven development

Uses [Spec Kit](https://github.com/github/spec-kit). One spec per feature — platform
differences (native camera vs. web file input, SMS autofill, etc.) are captured as inline
"Platform notes" within each user story, not as separate documents. See
`specs/001-registration-kyc/spec.md` for the pattern.

```
/speckit-constitution   → already set up in .specify/memory/constitution.md
/speckit-specify        → write a spec
/speckit-clarify        → resolve open questions before planning
/speckit-plan           → generate the technical plan
/speckit-tasks          → break the plan into tasks
/speckit-implement      → implement task by task, with review between chunks
```

### Subagents

Four subagents in `.claude/agents/` wrap this pipeline so it's delegated consistently instead
of drifting session to session:

- **spec-writer** — runs specify → clarify → plan → tasks for a feature. Never writes
  application code.
- **task-implementer** — implements one task (or small batch) from an existing `tasks.md`
  against its `plan.md`/`spec.md`. Never writes specs or plans.
- **code-reviewer** — reviews a diff with no task context, fresh from the spec/plan/
  constitution on disk. Read-only, never edits code.
- **sdd-orchestrator** — drives a feature end-to-end by delegating to the three above, gating
  on the constitution (no code without an on-disk plan, review after every task before the
  next one starts).

Use `sdd-orchestrator` for a whole feature; use the other three directly for a single phase.
None of the four paste full results into chat — they write detail to `specs/<feature>/`,
`progress/impl_<feature>.md`, and `progress/review_<feature>.md`, and return a one-line
pointer.

### Harness

Beyond the agents, this repo tracks its own state on disk instead of relying on chat history:

- **`AGENTS.md`** — the actual navigation map agents read first (`CLAUDE.md` just points here).
- **`feature_list.json`** — status per feature plus the invariants (`one_feature_at_a_time`,
  etc.) as a `rules` block.
- **`progress/current.md` / `history.md`** — live session log and its append-only archive.
- **`docs/conventions.md`, `docs/verification.md`** — code style and what "tested" means
  (including that test tooling isn't installed yet — see that file).
- **`CHECKPOINTS.md`** — a repo-hygiene self-audit `code-reviewer` walks before approving.
- **`.claude/settings.json`** — hooks enforcing verification regardless of what an agent
  decides: a type-check after every edit, and `./init.sh` after every turn (async, only
  interrupts on failure).

## Local setup

Requires the backend running first (`docker compose up` in the `Draw-a-card` backend repo).

Run everything in one shot:

```bash
./init.sh   # install, type-check, expo-doctor, tests (once configured), web build check
```

Requires Node >= 20 (`nvm use`, pinned in `.nvmrc`). Safe to re-run — every stage is
idempotent — and prints a pass/fail summary at the end (also what `sdd-orchestrator` runs
once per session before delegating any work). Flags: `--skip-doctor`, `--skip-tests`,
`--skip-build`.

Or step through it manually:

```bash
cp .env.example .env
npm install
npm run web       # fastest to iterate on — opens in browser
npm run ios       # or: npm run android
```

**Physical device via Expo Go**: replace `localhost` in `.env` with your machine's LAN IP
(e.g. `http://192.168.1.23:3000`) — `localhost` won't resolve from the phone to your dev
machine. Web and simulators can keep using `localhost`.

## Project structure

```
app/                expo-router screens (routing layer)
src/
  domain/           portable business logic — no RN imports (api-client, types, schemas)
  lib/              Expo-specific wiring — Supabase client, configured API instance
  features/
    identity/       registration, KYC, profile — mirrors backend's identity module
    catalog/        card browsing/search
    portfolio/      portfolio/wallet screens
    social/         feed, posts, comments
    trading/        offers, auctions
    scanner/        card scan upload + confirm flow
specs/              one folder per feature spec (Spec Kit workflow output)
.specify/           Spec Kit configuration, constitution, templates
docs/               conventions.md, verification.md — shared rules agents point to
progress/           current.md (live session log), history.md, impl_*/review_* reports
.claude/
  agents/           sdd-orchestrator, spec-writer, task-implementer, code-reviewer
  settings.json     hooks that enforce verification automatically
feature_list.json   feature backlog + status + harness invariants
AGENTS.md           navigation map for agents (read this first)
CHECKPOINTS.md      repo-hygiene self-audit checklist
init.sh             one-shot local setup + verification
```
