import { createClient } from "@supabase/supabase-js";

/**
 * These values are public browser config, not private service credentials.
 * Env vars still win, but the fallback keeps Cloudflare Pages from breaking when
 * build/runtime variable injection decides to become a small bureaucratic dragon.
 */
const FALLBACK_SUPABASE_URL = "https://uzbjbxexzhrxjjtowpde.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rZMzBiPGVo7Bx68U6PH0pg_sFlJblV6";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  FALLBACK_SUPABASE_PUBLISHABLE_KEY;

export function hasSupabaseConfig(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

export const supabase = hasSupabaseConfig()
  ? createClient(supabaseUrl, supabaseKey)
  : null;
