// T018 (FR-009, FR-010): thin glue only — maps useKycGate's already-resolved kycStatus/
// statusFetchFailed into KycStatusScreen's two-member `variant` union and passes through
// kycRejectionReason + a real retry handler. This screen adds no branching logic of its own
// beyond that one two-way mapping: resolveKycRoute() (src/domain/kyc-gate.ts) is still the sole
// source of truth for *whether* this route is reached at all (Constitution IV) — by the time
// this screen renders, the only two ways it could have gotten here are `statusFetchFailed` or a
// successfully-fetched `kycStatus: "rejected"` (see KycStatusScreen.tsx's top comment for the
// full branch-order justification), so `statusFetchFailed ? "error" : "rejected"` is a complete,
// exhaustive mapping, not a guess.
import { KycStatusScreen } from "@/features/identity/KycStatusScreen";
import { useKycGate } from "@/features/identity/useKycGate";
import { StyleSheet, View } from "react-native";

export default function KycStatusRouteScreen() {
  const { statusFetchFailed, kycRejectionReason, refetchStatus, isRefetching } = useKycGate();

  return (
    <View style={styles.screen}>
      <KycStatusScreen
        variant={statusFetchFailed ? "error" : "rejected"}
        rejectionReason={kycRejectionReason}
        onRetry={refetchStatus}
        isRetrying={isRefetching}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
});
