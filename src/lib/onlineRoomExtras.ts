import { supabase } from "@/lib/supabase";
import type { OnlineRoom } from "@/types/online";

export type OnlineRoomVisibility = "private" | "public";

export interface PublicLobbyRoom {
  room: OnlineRoom;
  playerCount: number;
}

export interface PublicLobbyResult {
  rooms: PublicLobbyRoom[];
  unavailable: boolean;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  return error?.code === "42703" || error?.code === "PGRST204" || error?.message?.toLowerCase().includes("visibility");
}

export async function setOnlineRoomVisibility(roomId: string, visibility: OnlineRoomVisibility, maxPlayers = 4) {
  const client = requireSupabase();
  const { error } = await client
    .from("online_rooms")
    .update({ visibility, max_players: Math.max(2, Math.min(maxPlayers, 8)) })
    .eq("id", roomId);

  if (isMissingColumnError(error)) {
    return { applied: false };
  }

  if (error) {
    throw error;
  }

  return { applied: true };
}

export async function fetchPublicLobbyRooms(): Promise<PublicLobbyResult> {
  const client = requireSupabase();
  const { data: rooms, error } = await client
    .from("online_rooms")
    .select("*")
    .eq("visibility", "public")
    .eq("status", "lobby")
    .order("updated_at", { ascending: false })
    .limit(8);

  if (isMissingColumnError(error)) {
    return { rooms: [], unavailable: true };
  }

  if (error) {
    throw error;
  }

  const publicRooms = await Promise.all(
    ((rooms ?? []) as OnlineRoom[]).map(async (room) => {
      const { count } = await client
        .from("online_players")
        .select("id", { count: "exact", head: true })
        .eq("room_id", room.id);

      return {
        room,
        playerCount: count ?? 0,
      };
    })
  );

  return { rooms: publicRooms, unavailable: false };
}

export async function removeOnlinePlayer(roomId: string, hostPlayerId: string, playerId: string) {
  if (hostPlayerId === playerId) {
    throw new Error("The host cannot remove themselves. Even games need one adult in the room.");
  }

  const client = requireSupabase();
  const { data: roomData, error: roomError } = await client
    .from("online_rooms")
    .select("host_player_id,status")
    .eq("id", roomId)
    .single();

  if (roomError) {
    throw roomError;
  }

  if (roomData?.host_player_id !== hostPlayerId) {
    throw new Error("Only the host can remove players.");
  }

  if (roomData?.status !== "lobby") {
    throw new Error("Players can only be removed before the game starts.");
  }

  const { error } = await client
    .from("online_players")
    .delete()
    .eq("room_id", roomId)
    .eq("id", playerId)
    .eq("is_host", false);

  if (error) {
    throw error;
  }
}
