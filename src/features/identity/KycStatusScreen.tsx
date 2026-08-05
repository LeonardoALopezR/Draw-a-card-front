// T018 (FR-009, FR-010): the blocking status screen resolveKycRoute() (src/domain/kyc-gate.ts)
// routes to for "kyc-status". Branches on exactly two variants — "rejected" and "error" — NOT
// three. Reasoning, since this is a deliberate deviation from this task's own pre-implementation
// text (which listed "pending | rejected | error"):
//
//   resolveKycRoute()'s actual branch order (src/domain/kyc-gate.ts, decision B) never produces
//   "kyc-status" for a successfully-fetched `kycStatus: "pending"` user — branch 6 sends
//   "pending" (exactly like "verified") to "tutorial"/"main". The ONLY two ways to reach this
//   screen are: (a) `statusFetchFailed: true` (branch 2, the FR-010 retryable-error case), or
//   (b) a successfully-fetched `kycStatus: "rejected"` (branch 5). A `pending` branch on this
//   screen would therefore be dead code that can never render through the real gate — worse, a
//   future reader could mistake it for a still-reachable state and build against it. This
//   matches plan.md's revised "KYC status gate" Research Decision verbatim ("KycStatusScreen now
//   branches on rejected | error only ... a misleading dead branch, not defensive code") and
//   tasks.md's T018 text, both already authored with this same conclusion. `KycStatusVariant`
//   below is a two-member union, not three, so this isn't just a convention — an attempt to pass
//   a third variant fails to compile.
//
// "Resubmit documents" CTA (rejected branch): per this run's explicit instruction, this CTA does
// NOT navigate anywhere. Document upload lives in feature 002 (002-kyc-document-verification),
// which is registered but entirely unspec'd — there is no real screen/route for this button to
// go to yet, and expo-router navigating to a fabricated path would either crash or silently land
// on expo-router's generic "Unmatched Route" screen, which looks like a bug, not an intentional
// placeholder. Instead the CTA renders disabled, with adjacent copy stating plainly that
// resubmission isn't available yet — see KYC_RESUBMIT_PLACEHOLDER_COPY below, a single exported
// constant so a future feature-002 implementer has one obvious place to wire real navigation
// (and one obvious test, KycStatusScreen.test.tsx, that will need a deliberate update to match).
//
// "error" branch (FR-010): per this run's explicit instruction, this is the branch a real user
// is most likely to actually hit today — the backend has no GET /identity/me returning a full
// profile, only GET /identity/me/kyc-status gated behind an in-memory-only X-User-Id header (see
// useKycGate.ts's file-level comment), so a genuine cold boot fails this fetch even with a valid
// Supabase session. Its retry action is wired to a real React Query refetch (useKycGate's
// refetchStatus, see app/(auth)/kyc-status.tsx), not a no-op.
import { Pressable, StyleSheet, Text, View } from "react-native";

export type KycStatusVariant = "rejected" | "error";

export interface KycStatusScreenProps {
  variant: KycStatusVariant;
  // Only read when variant === "rejected". Backend-provided rejection reason
  // (User.kycRejectionReason) — falls back to GENERIC_REJECTION_COPY when absent or empty, per
  // spec.md's Clarifications ("a generic fallback message when the backend returns no reason").
  rejectionReason?: string | null;
  // Only read when variant === "error". Re-triggers the underlying React Query fetch (see
  // useKycGate.ts's refetchStatus) — must be a real retry, never a no-op.
  onRetry?: () => void;
  isRetrying?: boolean;
}

// FR-009: shown whenever the backend reports kycStatus: "rejected" without a rejection reason
// (or with an empty/whitespace-only one).
export const GENERIC_REJECTION_COPY =
  "Your verification wasn't approved. Please review your information and try again.";

// See this file's top comment for the full reasoning — no real destination exists yet.
export const KYC_RESUBMIT_PLACEHOLDER_COPY =
  "Document resubmission isn't available yet. Check back soon.";

export const RETRY_ERROR_COPY = "We couldn't load your verification status.";

function hasVisibleReason(reason: string | null | undefined): reason is string {
  return typeof reason === "string" && reason.trim().length > 0;
}

export function KycStatusScreen({
  variant,
  rejectionReason,
  onRetry,
  isRetrying = false,
}: KycStatusScreenProps) {
  if (variant === "rejected") {
    const reasonCopy = hasVisibleReason(rejectionReason) ? rejectionReason : GENERIC_REJECTION_COPY;

    return (
      <View style={styles.container} testID="kyc-status-rejected">
        <Text style={styles.title} accessibilityRole="header">
          Verification not approved
        </Text>
        <Text style={styles.body} testID="kyc-status-rejection-reason">
          {reasonCopy}
        </Text>

        {/* Explicit, visible, disabled placeholder — see this file's top comment. Intentionally
            NOT wired to any navigation call. */}
        <Pressable
          style={[styles.button, styles.buttonDisabled]}
          disabled
          accessibilityRole="button"
          accessibilityLabel="Resubmit documents"
          accessibilityState={{ disabled: true }}
          testID="kyc-status-resubmit-button"
        >
          <Text style={styles.buttonText}>Resubmit documents</Text>
        </Pressable>
        <Text style={styles.placeholderNote} testID="kyc-status-resubmit-placeholder-note">
          {KYC_RESUBMIT_PLACEHOLDER_COPY}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="kyc-status-error">
      <Text style={styles.title} accessibilityRole="header">
        Couldn&apos;t load your verification status
      </Text>
      <Text style={styles.body} accessibilityRole="alert" testID="kyc-status-error-message">
        {RETRY_ERROR_COPY}
      </Text>

      <Pressable
        style={[styles.button, isRetrying ? styles.buttonDisabled : null]}
        onPress={onRetry}
        disabled={isRetrying}
        accessibilityRole="button"
        accessibilityLabel="Retry"
        accessibilityState={{ disabled: isRetrying, busy: isRetrying }}
        testID="kyc-status-retry-button"
      >
        <Text style={styles.buttonText}>{isRetrying ? "Retrying…" : "Retry"}</Text>
      </Pressable>
    </View>
  );
}

// Minimum 44x44 tap targets (Constitution VII, SC-003); single narrow column, unmodified at a
// 375px-wide web viewport through tablet/desktop widths — mirrors this feature's other screens.
const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 420,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  body: {
    fontSize: 15,
    color: "#374151",
  },
  placeholderNote: {
    fontSize: 13,
    color: "#6b7280",
  },
  button: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
