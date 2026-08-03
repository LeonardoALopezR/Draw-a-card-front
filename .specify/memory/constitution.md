# Draw-a-card Frontend Constitution

## Core Principles

### I. One Codebase, Three Targets
This is a single Expo (React Native) app targeting iOS, Android, and web (via
`react-native-web`) from one codebase. Do not create a separate Next.js app or duplicate
screens per platform. Almost the entire product sits behind authentication (registration,
KYC, portfolio, feed, trading) with no public/SEO-critical pages, which is what makes a
single non-SSR codebase the right tradeoff here — revisit this principle specifically if a
public, Google-discoverable surface (marketing site, public shop pages, public auction
listings) becomes a real requirement; that content alone may warrant a thin, separate
server-rendered site later, not a wholesale framework change.

### II. Backend Is the Source of Truth
The app never talks directly to Postgres, Redis, or S3. All data access goes through the
`Draw-a-card` backend API. No feature may embed a second data path except for the one
explicit exception in Principle III (auth).

### III. Auth Goes Through the Provider SDK, Not the Backend
Login, registration, session refresh, and password reset are handled client-side via the
auth provider's SDK (Supabase Auth or equivalent — must match the backend repo's
constitution). Sessions persist via secure native storage (`expo-secure-store`) on
iOS/Android and the SDK's default web storage on web. The app never implements its own
password/session logic.

### IV. Business Logic Stays Portable — Designed for Eventual Native Migration
This project may migrate parts of the app to fully native implementations (Kotlin/Swift)
and/or a standalone React web app later, once the product and team have grown. To keep
that migration realistic rather than a rewrite-from-scratch:
- Business logic (API calls, validation, data transforms, domain types) lives in plain
  TypeScript modules with no React Native imports — under `src/lib/` and `src/domain/` —
  so it is portable to any future TypeScript/React web codebase largely as-is.
- UI components stay UI-only: they call into `src/lib`/`src/domain` functions rather than
  embedding fetch calls, validation logic, or business rules directly in component bodies.
- Platform-specific UI code (camera capture, native gestures, share sheets) is isolated
  using Expo/React Native's `.ios.tsx` / `.android.tsx` / `.web.tsx` file-extension
  convention or `Platform.select`, never scattered as inline conditionals through shared
  components — this is what will need true native rewrites (Kotlin/Swift) later, so keeping
  it isolated now is what makes that future migration tractable rather than a full rewrite.
- Do not reach for exotic RN-web workarounds to force desktop-only UI patterns (dense
  hover-heavy tables, keyboard-shortcut-heavy interfaces) into this codebase. If a screen
  genuinely needs that, it's a signal that screen belongs in a future dedicated web app, not
  a reason to contort this one.

### V. Screen/Component Structure Mirrors Product Domains
Screens and components are organized by the same bounded contexts as the backend
(identity, catalog, portfolio, social, trading, scanner), so a feature can be reasoned
about as one unit of work across backend and frontend.

### VI. Spec Before Code, One Spec Per Feature — Platform Notes Inline
Each feature gets one spec (not a shared spec plus platform-specific extension specs, since
there's only one codebase now). Platform-specific behavior (e.g. native camera vs. web file
input) is captured as a subsection within that single spec, not a separate document — see
`specs/001-registration-kyc/spec.md` for the pattern.

### VII. Accessible and Responsive by Default
Screens must work across phone, tablet, and desktop-web viewport widths, and respect
platform accessibility conventions (VoiceOver/TalkBack labels, minimum tap target sizes,
keyboard navigation on web).

### VIII. Local-First Development
The app must run fully against a locally running backend (`docker compose up` in the
backend repo) with no live cloud dependency required for day-to-day development. Mock API
responses only when the corresponding backend endpoint doesn't exist yet.

## Technology Stack (binding unless amended)

- **Framework**: Expo (React Native) + expo-router, with web support via `react-native-web`
- **Language**: TypeScript throughout, strict mode
- **Data fetching**: React Query (TanStack Query)
- **Auth**: Supabase Auth client SDK (or equivalent — must match backend's auth provider)
- **Secure storage**: `expo-secure-store` for session persistence on native; SDK default on
  web
- **Forms/validation**: React Hook Form + Zod
- **State**: Server state via React Query; local/UI state via React state — no global state
  library (Redux/Zustand) until a concrete need is demonstrated
- **Mobile distribution**: Expo EAS for builds; App Store + Play Store accounts managed
  outside this repo

## Development Workflow

1. `/speckit-constitution` — this file
2. `/speckit-specify` — one spec per feature under `specs/<feature-name>/spec.md`,
   including platform-specific notes inline where behavior genuinely differs
3. `/speckit-clarify` — resolve ambiguities before planning
4. `/speckit-plan` — technical plan per feature
5. `/speckit-tasks` — numbered task breakdown
6. `/speckit-implement` — implementation, task by task, with human review between chunks

## Governance

This constitution supersedes ad-hoc technical decisions made in code review. Any deviation
from the Technology Stack section, or any business logic embedded directly inside a UI
component instead of `src/lib`/`src/domain` (Principle IV), must be called out explicitly
in the PR description with a reason. Amendments require a PR reviewed by the project owner
and a version bump below.

**Version**: 1.0.0 | **Ratified**: 2026-08-02 | **Last Amended**: 2026-08-02
