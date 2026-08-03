import { createApiClient } from "@/domain/api-client";
import { supabase } from "./supabase-client";

export const api = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
  getToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  },
});
