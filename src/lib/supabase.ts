import { createClient } from "@supabase/supabase-js";

/**
 * These values are public browser config, not private service credentials.
 * Environment variables still take priority, while the fallback keeps
 * browser deployments working when runtime variable injection is unavailable.
 */
const FALLBACK_SUPABASE_URL = "https://swvezxnpzlwgttqkjccz.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ur5uw-qmrQKX9uag29JeEA_vl6CSTFB";

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
