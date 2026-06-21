import { supabase } from "@/lib/supabase";

export interface PlayerProfile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const PROFILE_KEY = "blink-and-find-player-profile";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function defaultProfile(): PlayerProfile {
  const now = new Date().toISOString();

  return {
    id: createId(),
    name: "Player",
    createdAt: now,
    updatedAt: now,
  };
}

export function getPlayerProfile(): PlayerProfile {
  if (typeof window === "undefined") {
    return defaultProfile();
  }

  try {
    const rawValue = window.localStorage.getItem(PROFILE_KEY);
    if (!rawValue) {
      const profile = defaultProfile();
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      return profile;
    }

    const parsed = JSON.parse(rawValue) as Partial<PlayerProfile>;
    const profile: PlayerProfile = {
      id: parsed.id || createId(),
      name: parsed.name?.trim() || "Player",
      createdAt: parsed.createdAt || new Date().toISOString(),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };

    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return profile;
  } catch {
    const profile = defaultProfile();
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return profile;
  }
}

export function savePlayerProfile(nextProfile: Pick<PlayerProfile, "name">): PlayerProfile {
  const current = getPlayerProfile();
  const profile: PlayerProfile = {
    ...current,
    name: nextProfile.name.trim() || "Player",
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function resetPlayerProfile(): PlayerProfile {
  const profile = defaultProfile();

  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  return profile;
}

function isMissingProfileTableError(error: { code?: string; message?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205" || error?.message?.toLowerCase().includes("player_profiles");
}

export async function syncPlayerProfile(profile = getPlayerProfile()) {
  if (!supabase) {
    return { synced: false, unavailable: true };
  }

  const { error } = await supabase
    .from("player_profiles")
    .upsert({
      player_id: profile.id,
      display_name: profile.name,
    }, { onConflict: "player_id" });

  if (isMissingProfileTableError(error)) {
    return { synced: false, unavailable: true };
  }

  if (error) {
    throw error;
  }

  return { synced: true, unavailable: false };
}
