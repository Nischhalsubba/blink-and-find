import { supabase } from "@/lib/supabase";

export interface PlayerProfile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const PROFILE_KEY = "blink-and-find-player-profile";

const ANIMALS = ["Falcon", "Panda", "Tiger", "Otter", "Yak", "Fox", "Hawk", "Rhino", "Wolf", "Mango", "Cobra", "Eagle"];
const COLORS = ["Blue", "Red", "Gold", "Green", "Silver", "Purple", "Neon", "Swift", "Lucky", "Pixel", "Cosmic", "Turbo"];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getBrowserLabel() {
  if (typeof navigator === "undefined") {
    return "Blink";
  }

  const ua = navigator.userAgent;

  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  return "Blink";
}

function hashText(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

function friendlyNameFromId(id: string) {
  const browser = getBrowserLabel();
  const hash = hashText(`${browser}-${id}`);
  const color = COLORS[hash % COLORS.length];
  const animal = ANIMALS[Math.floor(hash / COLORS.length) % ANIMALS.length];
  const suffix = id.replace(/[^a-z0-9]/gi, "").slice(-3).toUpperCase() || String(hash % 999).padStart(3, "0");

  return `${browser} ${color} ${animal} ${suffix}`;
}

function defaultProfile(): PlayerProfile {
  const now = new Date().toISOString();
  const id = createId();

  return {
    id,
    name: friendlyNameFromId(id),
    createdAt: now,
    updatedAt: now,
  };
}

function shouldReplaceGenericName(name: string | undefined) {
  const normalized = name?.trim().toLowerCase() ?? "";
  return normalized === "" || normalized === "player" || normalized === "player 1" || normalized === "host";
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
    const id = parsed.id || createId();
    const profile: PlayerProfile = {
      id,
      name: shouldReplaceGenericName(parsed.name) ? friendlyNameFromId(id) : parsed.name?.trim() || friendlyNameFromId(id),
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
    name: nextProfile.name.trim() || friendlyNameFromId(current.id),
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
