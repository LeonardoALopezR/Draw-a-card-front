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

## Local setup

Requires the backend running first (`docker compose up` in the `Draw-a-card` backend repo).

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
```
