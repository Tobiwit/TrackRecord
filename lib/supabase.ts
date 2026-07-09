import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when Supabase env vars are set — the app then uses the real backend. */
export function supabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

let client: SupabaseClient | null = null;

/** Browser Supabase client (singleton). Only call when supabaseConfigured(). */
export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!url || !anonKey) throw new Error("Supabase is not configured");
    client = createClient(url, anonKey);
  }
  return client;
}
