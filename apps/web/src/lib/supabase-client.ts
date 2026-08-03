import { createClient } from "@supabase/supabase-js";

// Auth lives entirely client-side against the provider SDK (Constitution Principle II).
// The backend never sees a password — only the resulting session token, attached via
// apiClient's `token` option.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);
