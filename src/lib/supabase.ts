import { createClient } from "@supabase/supabase-js";
import { getDeviceSecret } from "@/lib/device";

/**
 * These values are public browser config, not private service credentials.
 * Environment variables still take priority, while the fallback keeps
 * browser deployments working when runtime variable injection is unavailable.
 */
const FALLBACK_SUPABASE_URL = "https://iqofwbiwujbbdynlyola.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WyWbYlKlx9V7wcXDQWuEkQ_6aGppaES";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  FALLBACK_SUPABASE_PUBLISHABLE_KEY;

export function hasSupabaseConfig(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

const fetchWithWriteIdentity: typeof fetch = (input, init = {}) => {
  const headers = new Headers(init.headers);

  if (typeof window !== "undefined") {
    headers.set("x-device-secret", getDeviceSecret());
  }

  return fetch(input, { ...init, headers });
};

export const supabase = hasSupabaseConfig()
  ? createClient(supabaseUrl, supabaseKey, {
      global: { fetch: fetchWithWriteIdentity },
    })
  : null;
