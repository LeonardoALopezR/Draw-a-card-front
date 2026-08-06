# i18n context module

**No backend counterpart to mirror.** Like `src/features/navigation/` and `src/features/ui/`
before it, this module does not correspond to a backend bounded context — locale/copy state is
pure client-side presentation data. A deliberate, narrow, documented exception to Constitution
Principle V, matching `004-home-scan-shell`'s and `006-visual-identity`'s own established
precedent for this shape of cross-cutting infrastructure.

This module (`src/features/i18n/`) is the thin, RN-dependent React context layer over
`src/domain/i18n/`'s portable lookup logic (`translate()`, `locale.ts`, `copy/*.ts` — zero React
Native import, Constitution Principle IV). It exists only because React context/hooks are
inherently RN/React-dependent; the actual string-resolution logic they wrap lives in `src/domain`
and is unit-tested there directly, independent of any component render.

## The seam `007-localization` builds its language picker on

This feature (`006-visual-identity`) ships **no picker UI** — the active locale defaults to a
fixed, hardcoded value (see below) with no device-locale detection or persistence. What it does
ship is the exact seam a future language-picker component calls into, with zero restructuring of
how `login`/`scan` already consume copy (spec.md FR-011):

```tsx
import { useLocale } from "@/features/i18n/LocaleContext";

function LanguagePicker() {
  const { locale, setLocale } = useLocale();
  // render buttons/a select for "es"/"en", calling setLocale("en") on press —
  // every screen already reading copy via useTranslation() re-renders automatically.
  return ...;
}
```

`setLocale` is the entire seam. It must be called from somewhere inside `<LocaleProvider>` (wired
at the root layout, `app/_layout.tsx`) — every consumer of `useTranslation()` anywhere in the tree
picks up the new locale on the next render, with no prop threading and no restructuring of
`SignInForm`/`ScanShellScreen`/etc.

## The current hardcoded default — a placeholder, not a real decision

`DEFAULT_LOCALE` (`src/domain/i18n/locale.ts`) is hardcoded to `"es"`. This is **explicitly
flagged as a placeholder**, not a permanent product decision — see `specs/006-visual-identity/
spec.md`'s Assumptions section:

> **Default locale is a hardcoded placeholder, not a real decision.** This feature ships Spanish
> as the fixed default (matching the design brief's Spanish-first copy and the human's original
> scoping language) with no device-locale detection or persistence — `007-localization`'s own spec
> is where that becomes a real, considered choice.

`007-localization` is expected to replace `DEFAULT_LOCALE`'s fixed value with real device-locale
detection and/or a persisted user choice (e.g. via `expo-secure-store` or an equivalent), and to
build the actual picker UI that calls `setLocale`. Nothing in this module needs to change shape
for that to happen — only `DEFAULT_LOCALE`'s initial value and `LocaleProvider`'s internal state
initialization are expected to change.

## How to add a new screen's dictionary

Every screen's copy lives in its own `src/domain/i18n/copy/<screen>.ts` file, following the exact
pattern `copy/login.ts` and `copy/scan.ts` already establish — read those two files as the worked
examples:

1. Export an `es` object (`const es = { key: "value", ... }`) with every string the screen
   renders, in natural case (not `UPPERCASE` — `textTransform: "uppercase"` styles handle that at
   render time where the design calls for it).
2. Export an `en` object typed `Record<keyof typeof es, string>` — a missing English translation
   is then a **compile-time** error, not just a unit-test failure.
3. Export the combined dictionary: `export const <screen>Copy = { es, en };`.
4. Add a colocated `<screen>.test.ts` asserting `Object.keys(es).sort()` equals
   `Object.keys(en).sort()` (runtime key-parity, defense-in-depth beyond the type constraint) —
   copy `copy/login.test.ts`/`copy/scan.test.ts` as the template.
5. In the screen's component(s), call `useTranslation(<screen>Copy)` (from
   `src/features/i18n/LocaleContext.tsx`) to get a `(key) => string` lookup function bound to the
   current locale — never hardcode a literal string directly in the component body.

Translating a screen other than `login`/`scan` (register, verify-phone, profile, KYC status,
tutorial, home) is explicitly out of scope for `006-visual-identity` (spec.md Assumptions) —
`007-localization` owns that, using this exact same mechanism.
