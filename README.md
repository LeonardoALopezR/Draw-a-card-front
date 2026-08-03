# Draw-a-card — Frontend (Web + Mobile)

Monorepo containing the web client (Next.js) and mobile app (Expo/React Native) for the
Draw-a-card TCG portfolio, scanning, social, and trading platform. Both talk to the
`Draw-a-card` backend repo's API — see that repo for the database schema and API
implementation.

## Structure

```
apps/
  web/              Next.js web app
  mobile/           Expo (React Native) mobile app
packages/
  shared/           API client factory, types, and Zod schemas used by BOTH apps
specs/              one folder per feature spec (Spec Kit workflow output)
.specify/           Spec Kit configuration, constitution, templates
```

Why a shared package instead of copy-pasting: registration validation, API request shapes,
and TypeScript types would otherwise drift between web and mobile as features are added.
Only genuinely platform-agnostic logic lives in `packages/shared` — anything touching
Next.js routing or React Native APIs stays in its own app. See
`.specify/memory/constitution.md` Principle III for the exact boundary.

## Stack

- **Web**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Mobile**: Expo + expo-router + TypeScript
- **Shared**: TypeScript types, Zod validation schemas, a platform-agnostic API client
  factory
- **Auth**: Supabase Auth SDK on both platforms
- **Data fetching**: React Query on both platforms

See `.specify/memory/constitution.md` for the full, binding set of architecture decisions —
kept consistent with the backend repo's own constitution.

## Spec-driven development

Same workflow as the backend repo, using [Spec Kit](https://github.com/github/spec-kit).
Note the pattern for platform-specific behavior:

- `specs/001-registration-kyc-web-screens/` — the baseline spec (applies to both platforms
  unless overridden)
- `specs/002-registration-kyc-mobile-screens/` — extends the web spec, capturing *only*
  what's different on mobile (native camera, SMS autofill, session persistence)

Use this pattern for future features too: write the shared/baseline spec first, then a
platform-specific spec only if real behavioral differences exist — don't create a mobile
spec that just repeats the web one.

```
/speckit-constitution   → already set up in .specify/memory/constitution.md
/speckit-specify        → write a spec
/speckit-clarify        → resolve open questions before planning
/speckit-plan           → generate the technical plan
/speckit-tasks          → break the plan into tasks
/speckit-implement      → implement task by task, with review between chunks
```

## Local setup

Requires the backend running first (see the `Draw-a-card` repo's own local setup —
`docker compose up` there).

```bash
npm install                       # installs all workspaces (web, mobile, shared) at once

# Web
cp apps/web/.env.example apps/web/.env.local
npm run dev:web                   # http://localhost:3001

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
npm run dev:mobile                # opens Expo dev tools; scan QR with Expo Go app
```

**Note for mobile on a physical device**: `localhost` in `apps/mobile/.env` won't reach your
dev machine from a phone. Replace it with your machine's LAN IP (e.g.
`http://192.168.1.23:3000`) when testing via Expo Go instead of a simulator.

## Project structure detail

```
apps/web/src/
  app/            Next.js App Router pages/layouts
  features/       identity, catalog, portfolio, social, trading, scanner — mirrors backend
  lib/            api.ts (wires the shared client), supabase-client.ts

apps/mobile/
  app/            expo-router screens
  src/lib/        api.ts (wires the shared client), supabase-client.ts

packages/shared/src/
  api-client.ts   createApiClient() factory — platform provides baseUrl + token getter
  types.ts        shared TypeScript types mirroring the backend Prisma schema
  schemas.ts      shared Zod validation schemas for forms
```
