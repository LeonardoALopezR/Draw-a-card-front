import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// This file is intentionally Expo/RN-specific (unlike src/domain) — it's the adapter layer
// that would need a native (Kotlin/Swift) or web-specific equivalent during a future
// migration, per Constitution Principle IV. Keep this boundary clean: nothing outside
// src/lib should import expo-secure-store or react-native directly.

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  {
    auth: {
      // expo-secure-store isn't available on web; fall back to the SDK's default there.
      storage: Platform.OS === "web" ? undefined : ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
