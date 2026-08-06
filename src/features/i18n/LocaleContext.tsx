// T021 (FR-010, FR-011, FR-012, spec.md US4 AS3/AS5): the thin React context wrapper around
// src/domain/i18n's portable locale/translate logic — the ONLY RN-dependent layer in this
// feature's i18n mechanism (it uses React context/hooks, which is expected and fine per
// Constitution Principle IV; the actual lookup logic it wraps, translate() from T018, has zero
// React Native import and is unit-tested directly there).
//
// This is the exact seam 007-localization's future language-picker UI builds on: a real picker
// component calls useLocale().setLocale(nextLocale) from anywhere inside <LocaleProvider>, and
// every screen already reading copy via useTranslation() re-renders with the new locale
// automatically — no restructuring of how login/scan already consume copy (FR-011).
// src/features/i18n/README.md (T022) documents this seam in more detail.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { DEFAULT_LOCALE, type Locale } from "@/domain/i18n/locale";
import { translate } from "@/domain/i18n/translate";

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

// Falls back to a default-locale, no-op-setter value when rendered outside a <LocaleProvider>
// (e.g. a component test rendering a primitive in isolation) rather than throwing — mirrors this
// repo's general preference for a graceful, testable default over a hard invariant crash, since
// nothing about this context guards a security- or data-integrity-sensitive boundary the way
// e.g. an auth context might.
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (context) {
    return context;
  }
  return { locale: DEFAULT_LOCALE, setLocale: () => {} };
}

// Convenience hook wrapping translate() (T018), bound to the current context locale — every
// login/scan component calls this instead of importing translate()/useLocale() separately.
export function useTranslation<T extends Record<string, string>>(dictionary: { es: T; en: T }) {
  const { locale } = useLocale();
  return useCallback((key: keyof T) => translate(dictionary, locale, key), [dictionary, locale]);
}
