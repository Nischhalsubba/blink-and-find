import { supabase } from "@/lib/supabase";
import type { OnlinePlayer, OnlineRoom, OnlineRoomSnapshot } from "@/types/online";

export type OnlineRoomVisibility = "private" | "public";

export interface PublicLobbyRoom {
  room: OnlineRoom;
  playerCount: number;
}

export interface PublicLobbyResult {
  rooms: PublicLobbyRoom[];
  unavailable: boolean;
}

const HOST_STALE_MS = 45_000;

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  return error?.code === "42703" || error?.code === "PGRST204" || error?.message?.toLowerCase().includes("visibility");
}

function isActivePlayer(player: OnlinePlayer, staleMs = HOST_STALE_MS) {
  return player.is_connected && Date.now() - new Date(player.updated_at).getTime() < staleMs;
}

export function normalizeMaxPlayers(value: number, fallback = 2) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(8, Math.floor(value)));
}

export function getMinimumPlayersToStart(maxPlayers?: number | null) {
  return normalizeMaxPlayers(maxPlayers ?? 2) === 1 ? 1 : 2;
}

export async function touchOnlinePlayerPresence(playerId: string, isConnected = true) {
  const client = requireSupabase();
  const { error } = await client
    .from("online_players")
    .update({ is_connected: isConnected })
    .eq("id", playerId);

  if (error) {
    throw error;
  }
}

export async function repairOnlineRoomHost(snapshot: OnlineRoomSnapshot, staleMs = HOST_STALE_MS) {
  const room = snapshot.room;

  if (room.status === "finished" || room.status === "abandoned") {
    return { repaired: false, hostPlayerId: room.host_player_id };
  }

  const currentHost = snapshot.players.find((player) => player.id === room.host_player_id || player.is_host) ?? null;

  if (currentHost && isActivePlayer(currentHost, staleMs)) {
    return { repaired: false, hostPlayerId: currentHost.id };
  }

  const nextHost = snapshot.players
    .filter((player) => isActivePlayer(player, staleMs))
    .sort((a, b) => a.joined_at.localeCompare(b.joined_at))[0] ?? null;

  if (!nextHost) {
    return { repaired: false, hostPlayerId: room.host_player_id };
  }

  const client = requireSupabase();
  const roomUpdate: Partial<OnlineRoom> = { host_player_id: nextHost.id };

  if (room.status === "lobby" && room.current_player_id === room.host_player_id) {
    roomUpdate.current_player_id = nextHost.id;
  }

  const [clearHostsResponse, setHostResponse, roomResponse] = await Promise.all([
    client.from("online_players").update({ is_host: false }).eq("room_id", room.id),
    client.from("online_players").update({ is_host: true, is_connected: true }).eq("id", nextHost.id),
    client.from("online_rooms").update(roomUpdate).eq("id", room.id),
  ]);

  if (clearHostsResponse.error) {
    throw clearHostsResponse.error;
  }

  if (setHostResponse.error) {
    throw setHostResponse.error;
  }

  if (roomResponse.error) {
    throw roomResponse.error;
  }

  return { repaired: true, hostPlayerId: nextHost.id };
}

export async function setOnlineRoomVisibility(roomId: string, visibility: OnlineRoomVisibility, maxPlayers = 2) {
  const client = requireSupabase();
  const { error } = await client
    .from("online_rooms")
    .update({ visibility, max_players: normalizeMaxPlayers(maxPlayers) })
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

  return {
    rooms: publicRooms.filter(({ room, playerCount }) => playerCount < normalizeMaxPlayers(room.max_players ?? 2)),
    unavailable: false,
  };
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
