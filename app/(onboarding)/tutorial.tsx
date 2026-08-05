// T019 (FR-007): thin glue only — renders TutorialScreen and, on completion, performs the three
// steps FR-007's "shown only once" requires: (1) call markTutorialComplete()
// (src/domain/registration.ts — a documented no-op placeholder, no backend endpoint exists, see
// that function's own doc comment), (2) persist the completion flag locally via
// src/lib/tutorial-storage.ts, keyed by the Supabase auth user id (src/domain/tutorial.ts's
// tutorialStorageKey — see that file's doc comment for why this id, not the backend's own
// User.id, is what's used), and (3) invalidate useKycGate's currentUserQueryKey so its query
// re-runs, re-reads the now-`true` local flag (see useKycGate.ts's queryFn), and
// resolveKycRoute() (src/domain/kyc-gate.ts) re-resolves to "main" on the next render. This
// screen does NOT call router.replace/push itself — app/_layout.tsx's <Redirect> (driven by
// useKycGate's recomputed route) is what actually moves the user on, exactly as it would for any
// other gate-driven transition (Constitution IV: routing decisions stay in resolveKycRoute, not
// duplicated here).
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";

import { markTutorialComplete } from "@/domain/registration";
import { TutorialScreen } from "@/features/identity/TutorialScreen";
import { currentUserQueryKey } from "@/features/identity/useKycGate";
import { supabase } from "@/lib/supabase-client";
import { setHasCompletedTutorial } from "@/lib/tutorial-storage";

export default function TutorialRouteScreen() {
  const queryClient = useQueryClient();
  const [isCompleting, setIsCompleting] = useState(false);

  async function handleComplete() {
    setIsCompleting(true);
    try {
      await markTutorialComplete();

      // T034 (2026-08-04, found auditing every supabase.auth.getSession() call site for the same
      // unhandled-rejection defect fixed in src/lib/supabase-client.ts's signInWithPassword and
      // src/features/identity/useKycGate.ts): getSession() can reject on a network-level failure,
      // not just resolve. Left unguarded, that rejection would skip the cache invalidation below
      // entirely, stranding the user on this screen after pressing "Get started" with no error
      // shown. Degrades the same way src/lib/tutorial-storage.ts's own catch blocks already do for
      // a local write failure: the completion flag may not persist (the tutorial could show again
      // next launch — a UX annoyance, not a data-integrity problem) but the user still moves on.
      try {
        const { data } = await supabase.auth.getSession();
        const supabaseUserId = data.session?.user.id;
        if (supabaseUserId) {
          await setHasCompletedTutorial(supabaseUserId);
        }
      } catch {
        // See comment above — best-effort only, never blocks the invalidation below.
      }

      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <TutorialScreen onComplete={handleComplete} isCompleting={isCompleting} />
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
