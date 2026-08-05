import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { tutorialStorageKey } from "@/domain/tutorial";

// T019 (FR-007): Expo/RN-specific storage adapter (unlike src/domain, this file is intentionally
// NOT portable — same boundary rule src/lib/supabase-client.ts documents at its own top). Persists
// whether a given (Supabase auth) user has completed the first-run tutorial, keyed by
// tutorialStorageKey() (src/domain/tutorial.ts) so the key format itself stays pure/testable.
//
// No backend endpoint exists for this (see tutorial.ts's doc comment for the full route-by-route
// confirmation against the backend repo) — this is a deliberate local-only fallback, not a stand-in
// for a future backend call this file is racing to obsolete. Mirrors supabase-client.ts's
// Platform.OS === "web" split: expo-secure-store is unavailable on web, so web reads/writes go
// through `window.localStorage` instead. Both branches are wrapped in try/catch — a full disk on
// native or a privacy-mode/disabled-storage browser on web should degrade to "tutorial not
// complete yet" (show the tutorial again) rather than crash the app; per this task's KYC-adjacent
// data-handling constraint, nothing stored here is a KYC/identity document, so there is no
// "must not persist longer than needed" concern to balance against that fallback.
export async function getHasCompletedTutorial(supabaseUserId: string): Promise<boolean> {
  const key = tutorialStorageKey(supabaseUserId);
  try {
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !window.localStorage) {
        return false;
      }
      return window.localStorage.getItem(key) === "true";
    }
    const value = await SecureStore.getItemAsync(key);
    return value === "true";
  } catch {
    return false;
  }
}

export async function setHasCompletedTutorial(supabaseUserId: string): Promise<void> {
  const key = tutorialStorageKey(supabaseUserId);
  try {
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !window.localStorage) {
        return;
      }
      window.localStorage.setItem(key, "true");
      return;
    }
    await SecureStore.setItemAsync(key, "true");
  } catch {
    // Best-effort: a write failure here means the tutorial may be shown again next launch,
    // which is a UX annoyance, not a data-integrity or security problem — never throw out of a
    // tutorial-completion action over this.
  }
}
