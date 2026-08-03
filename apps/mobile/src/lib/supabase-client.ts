import { createClient } from "@supabase/supabase-js";

// Same auth pattern as web (Constitution Principle II): auth happens client-side via the
// provider SDK, and the resulting token is attached to backend API calls.
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ""
);
