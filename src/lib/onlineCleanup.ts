import { supabase } from "@/lib/supabase";
import type { OnlineRoom } from "@/types/online";

const HOUR_MS = 60 * 60 * 1000;

export const ONLINE_ROOM_CLEANUP_POLICY = {
  lobbyStaleAfterMs: 2 * HOUR_MS,
  activeStaleAfterMs: 6 * HOUR_MS,
  finishedRetentionDays: 30,
};

export interface OnlineRoomCleanupResult {
  lobbyAbandoned: number;
  activeAbandoned: number;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function getRoomTimestamp(room: OnlineRoom): number {
  return new Date(room.updated_at || room.created_at).getTime();
}

export function isOnlineRoomStale(room: OnlineRoom, now = Date.now()): boolean {
  if (room.status === "finished" || room.status === "abandoned") {
    return false;
  }

  const ageMs = now - getRoomTimestamp(room);

  if (room.status === "lobby") {
    return ageMs > ONLINE_ROOM_CLEANUP_POLICY.lobbyStaleAfterMs;
  }

  return ageMs > ONLINE_ROOM_CLEANUP_POLICY.activeStaleAfterMs;
}

/**
 * App-side safety cleanup for stale unfinished rooms.
 * Finished rooms are retained for history; unfinished stale rooms become abandoned.
 */
export async function abandonStaleOnlineRooms(): Promise<OnlineRoomCleanupResult> {
  const client = requireSupabase();
  const now = Date.now();
  const lobbyCutoff = new Date(now - ONLINE_ROOM_CLEANUP_POLICY.lobbyStaleAfterMs).toISOString();
  const activeCutoff = new Date(now - ONLINE_ROOM_CLEANUP_POLICY.activeStaleAfterMs).toISOString();

  const [lobbyResponse, activeResponse] = await Promise.all([
    client
      .from("online_rooms")
      .update({ status: "abandoned", current_player_id: null })
      .eq("status", "lobby")
      .lt("updated_at", lobbyCutoff)
      .select("id"),
    client
      .from("online_rooms")
      .update({ status: "abandoned", current_player_id: null })
      .in("status", ["ready", "playing", "round_summary"])
      .lt("updated_at", activeCutoff)
      .select("id"),
  ]);

  if (lobbyResponse.error) {
    throw lobbyResponse.error;
  }

  if (activeResponse.error) {
    throw activeResponse.error;
  }

  return {
    lobbyAbandoned: lobbyResponse.data?.length ?? 0,
    activeAbandoned: activeResponse.data?.length ?? 0,
  };
}
