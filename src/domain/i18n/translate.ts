// T018 (FR-010): the actual string-resolution logic — given a dictionary (one object per shipped
// locale, both objects sharing the same key set), a locale, and a key, return the resolved
// string for that locale. Plain TypeScript, zero React Native import (Constitution IV) — directly
// unit-tested in translate.test.ts rather than only indirectly through a component render
// (docs/verification.md's anti-pattern list). src/features/i18n/LocaleContext.tsx's
// useTranslation() hook is the thin RN-aware wrapper that binds this to the active context locale
// — this file itself has no notion of React/context at all.
import type { Locale } from "./locale";

export function translate<T extends Record<string, string>>(
  dictionary: { es: T; en: T },
  locale: Locale,
  key: keyof T,
): string {
  return dictionary[locale][key];
}
