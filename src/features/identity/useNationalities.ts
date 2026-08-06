// 010-registration-redesign T011 (FR-012, plan.md Research Decision 5): wires
// src/domain/nationality.ts's fetchNationalities() to React Query, via the injected `api`
// singleton (src/lib/api.ts) — the one place in this feature that needs a hook rather than a
// pure src/domain function, since it's UI-lifecycle-bound caching (same placement precedent as
// useKycGate.ts, src/features/identity/useKycGate.ts).
//
// Shaped to plug directly into Select's (src/features/ui/Select.types.ts, T006) `loading`/
// `error`/`onRetry` props at the call site — `<Select loading={result.loading}
// error={result.error} onRetry={result.onRetry} .../>` — rather than React Query's own
// `isLoading`/`isError`/`refetch` names, so a caller doesn't have to rename anything. `error` is
// Select's expected `string | undefined` message, not a boolean, so this hook is the one place
// that turns a thrown fetch failure into that user-facing string.
//
// Real-network behavior is [BLOCKED-ON-015] (backend 015-registration-profile-support has no
// spec of its own yet — see nationality.ts's own top comment) — this hook is fully buildable and
// unit-testable today against a mocked fetchNationalities.
import { useQuery } from "@tanstack/react-query";

import { fetchNationalities, type NationalityOption } from "@/domain/nationality";
import { api } from "@/lib/api";

export const nationalitiesQueryKey = ["identity", "nationalities"] as const;

export interface UseNationalitiesResult {
  options: NationalityOption[];
  loading: boolean;
  error: string | undefined;
  onRetry: () => void;
}

// Deliberately not routed through src/domain/i18n here — mirrors the existing precedent of
// src/domain/registration.ts's SESSION_LOST_MESSAGE and its own map*Error fallbacks, which are
// plain, un-localized strings a caller renders as-is; this hook's caller (UsuarioForm, a later
// task) is free to override this with localized copy before it ever reaches Select's `error`
// prop if that's wired in later.
const NATIONALITIES_LOAD_ERROR_MESSAGE = "We couldn't load the list of nationalities.";

export function useNationalities(): UseNationalitiesResult {
  const query = useQuery<NationalityOption[]>({
    queryKey: nationalitiesQueryKey,
    queryFn: () => fetchNationalities(api),
    retry: false,
  });

  return {
    options: query.data ?? [],
    loading: query.isLoading,
    error: query.isError ? NATIONALITIES_LOAD_ERROR_MESSAGE : undefined,
    onRetry: () => {
      void query.refetch();
    },
  };
}
