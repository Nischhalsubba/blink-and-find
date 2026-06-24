"use client";

import { useEffect } from "react";
import { getDeviceId } from "@/lib/device";
import { upsertOnlinePresence, setOnlinePresenceOffline } from "@/lib/onlinePresence";
import { getPlayerProfile } from "@/lib/playerProfile";
import { hasSupabaseConfig } from "@/lib/supabase";

const AVAILABILITY_KEY = "blink-and-find-available-to-play";

function isAvailableToPlay() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(AVAILABILITY_KEY) !== "false";
}

/**
 * Lightweight app-wide heartbeat so users can appear in the online lobby
 * while browsing the app, not only after manually creating a room.
 */
export default function AppOnlinePresence() {
  useEffect(() => {
    if (!hasSupabaseConfig()) {
      return;
    }

    const deviceId = getDeviceId();

    async function heartbeat() {
      if (window.location.pathname.startsWith("/online")) {
        return;
      }

      try {
        const profile = getPlayerProfile();
        await upsertOnlinePresence({
          deviceId,
          displayName: profile.name,
          availableToPlay: isAvailableToPlay(),
          currentRoomId: null,
        });
      } catch {
        // Presence is nice-to-have. The rest of the game should not fail if
        // Supabase tables are missing or the network is sulking in the corner.
      }
    }

    void heartbeat();
    const timer = window.setInterval(() => {
      void heartbeat();
    }, 20_000);

    return () => {
      window.clearInterval(timer);
      void setOnlinePresenceOffline(deviceId);
    };
  }, []);

  return null;
}
