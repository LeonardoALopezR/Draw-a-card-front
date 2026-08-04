# Conventions — style, naming, structure

> Extreme consistency. An agent predicts better when the repo looks like itself everywhere.
> Architecture and the `src/domain` / `src/lib` / `src/features` boundary live in
> `.specify/memory/constitution.md`; this file is the level below that — how individual files
> are written.

## TypeScript / React Native style

- Strict mode is on (`tsconfig.json`) — don't weaken it per-file with `// @ts-ignore` or
  `any` to route around a real type error; fix the type.
- Function components only, no class components.
- Custom hooks are named `useX` and live beside the feature that owns them, or in
  `src/lib`/`src/domain` if they're portable (no RN imports).
- Platform-specific behavior uses the `.ios.tsx` / `.android.tsx` / `.web.tsx` file-extension
  convention or `Platform.select` — never scattered inline `if (Platform.OS === ...)` chains
  through shared component bodies (Constitution Principle IV).
- No business logic (API calls, validation, data transforms) inside a component body — call
  into `src/domain`/`src/lib` (Constitution Principle IV). A component file should read as
  "render this data, call this handler," not compute or fetch it inline.

## Names

| Kind | Convention | Example |
|---|---|---|
| Components | `PascalCase`, one per file, filename matches | `RegistrationForm.tsx` |
| Hooks | `camelCase`, `use` prefix | `useKycStatus.ts` |
| Screens (expo-router) | lowercase route segment per expo-router convention | `app/(auth)/register.tsx` |
| Functions / variables | `camelCase` | `submitRegistration` |
| Types / Zod schemas | `PascalCase` for types, `camelCase` for schema constants | `type User`, `userSchema` |
| Constants | `UPPER_SNAKE` | `DEFAULT_VERIFICATION_CODE_LENGTH` |

## Data fetching and forms

- All server state goes through React Query — no bare `fetch`/`axios` calls inside
  components. Wrap backend calls in `src/domain/api-client.ts` (or add there).
- Forms use React Hook Form + Zod, with the schema defined in `src/domain/schemas.ts`
  (or feature-local if truly not shared) and reused for both client-side validation and
  typing the submitted payload — don't hand-roll a second validation path.
- No global state library (Redux/Zustand/Jotai) until a concrete need is demonstrated
  (Constitution Principle: technology stack section) — local/UI state via React state,
  server state via React Query.

## Error handling

- Network/API errors surface as typed errors from `src/domain/api-client.ts`, not raw
  `fetch` rejections leaking into component code.
- User-facing error messages are explicit and inline near the relevant field/action — no
  silent failures, no bare `console.error` as the only signal.
- Never log or persist raw KYC document images/data beyond what's needed for the immediate
  upload — this app captures identity documents client-side even though the backend is the
  system of record (see the backend's Constitution Principle III on compliance data; the
  same spirit applies here even though it isn't yet a numbered principle in this repo's
  constitution).

## Tests

- Once a test runner exists (see `docs/verification.md` — not installed yet as of this
  writing), colocate: `<file>.test.ts(x)` next to the file it tests.
- `src/domain` tests are pure TS/Jest, no rendering needed.
- Component/screen tests use React Native Testing Library, asserting on rendered
  output/behavior — not implementation details (internal state, private functions).

## Comments

Default to none. Only write one when it captures a non-obvious *why* — a platform quirk, a
store-review requirement, a workaround. Names and structure should do the rest.
