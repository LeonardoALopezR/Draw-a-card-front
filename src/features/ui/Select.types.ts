// Shared prop contract for Select.tsx (native/default — iOS/Android, and the fallback for any
// platform without a more specific variant) and Select.web.tsx (T006, specs/010-registration-
// redesign, FR-012/FR-015). Defined once here, in a file with no `.web` extension so Metro's
// platform resolver never selects a *different* version of it per platform, and imported by both
// implementations — the same pattern already established by CodeInput.types.ts
// (001-registration-kyc), so the two variants' public interfaces cannot drift apart.
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  // Loading/error/onRetry render the nationality-catalog loading/error/retry state spec.md's
  // Edge Cases require (plan.md Research Decision 5) — this primitive itself has no knowledge of
  // *why* it's loading or erroring; the caller (useNationalities, a later task) owns that.
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  testID?: string;
  // Same optional prop/default as FormField's labelCase (T004) — defaults to "uppercase" so a
  // future non-registration consumer of this generic primitive gets the app's usual label
  // treatment unless it opts into sentence case, mirroring FormField's own default exactly.
  labelCase?: "uppercase" | "sentence";
  // Copy-override escape hatch (review fix, T006 — spec.md FR-007): this primitive renders no
  // hardcoded English string internally, mirroring PrimaryButton/SecondaryButton/StatusPill's own
  // "caller owns 100% of the rendered text" convention. Every one defaults to the primitive's
  // original English copy so no existing call site or test breaks; a caller wiring real i18n copy
  // (src/domain/i18n) passes Spanish (or any other locale's) text through these instead.
  retryLabel?: string;
  searchPlaceholder?: string;
  loadingLabel?: string;
  filterAccessibilityLabel?: string;
  closeAccessibilityLabel?: string;
}
