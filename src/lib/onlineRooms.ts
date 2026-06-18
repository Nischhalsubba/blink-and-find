import { generateSeededZigZagBoard } from "@/engine/board";
import { supabase } from "@/lib/supabase";
import type { GameConfig } from "@/types/game";
import type { OnlineGameType, OnlinePlayer, OnlineResult, OnlineRoom, OnlineRoomSnapshot, OnlineRound } from "@/types/online";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createRoomCode(): string {
  return Array.from({ length: 5 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
}

export function createRoundSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

export function getOnlineBoard(boardSize: number, seed: number): number[] {
  return generateSeededZigZagBoard(boardSize, seed);
}

export function pickTargetFromSeededBoard(boardSize: number, seed: number): number {
  const board = getOnlineBoard(boardSize, seed);
  const targetIndex = Math.abs(seed * 31 + boardSize * 17) % board.length;
  return board[targetIndex];
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  return supabase;
}

export async function createOnlineRoom(params: {
  playerName: string;
  deviceId: string;
  gameType: OnlineGameType;
  settings: GameConfig;
}): Promise<OnlineRoomSnapshot & { localPlayer: OnlinePlayer }> {
  const client = requireSupabase();
  let room: OnlineRoom | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createRoomCode();
    const { data, error } = await client
      .from("online_rooms")
      .insert({
        code,
        game_type: params.gameType,
        settings: params.settings,
      })
      .select("*")
      .single();

    if (!error && data) {
      room = data as OnlineRoom;
      break;
    }

    if (error?.code !== "23505") {
      throw error;
    }
  }

  if (!room) {
    throw new Error("Could not create a unique room code. The alphabet has betrayed us.");
  }

  const { data: playerData, error: playerError } = await client
    .from("online_players")
    .insert({
      room_id: room.id,
      name: params.playerName.trim() || "Host",
      device_id: params.deviceId,
      is_host: true,
    })
    .select("*")
    .single();

  if (playerError) {
    throw playerError;
  }

  const localPlayer = playerData as OnlinePlayer;
  const { data: updatedRoom, error: roomError } = await client
    .from("online_rooms")
    .update({ host_player_id: localPlayer.id, current_player_id: localPlayer.id })
    .eq("id", room.id)
    .select("*")
    .single();

  if (roomError) {
    throw roomError;
  }

  return {
    room: updatedRoom as OnlineRoom,
    players: [localPlayer],
    rounds: [],
    results: [],
    localPlayer,
  };
}

export async function joinOnlineRoom(params: {
  code: string;
  playerName: string;
  deviceId: string;
}): Promise<OnlineRoomSnapshot & { localPlayer: OnlinePlayer }> {
  const client = requireSupabase();
  const normalizedCode = params.code.trim().toUpperCase();

  const { data: roomData, error: roomError } = await client
    .from("online_rooms")
    .select("*")
    .eq("code", normalizedCode)
    .single();

  if (roomError) {
    throw roomError;
  }

  const room = roomData as OnlineRoom;
  const { data: existingPlayer } = await client
    .from("online_players")
    .select("*")
    .eq("room_id", room.id)
    .eq("device_id", params.deviceId)
    .maybeSingle();

  let localPlayer = existingPlayer as OnlinePlayer | null;

  if (!localPlayer) {
    const { data: playerData, error: playerError } = await client
      .from("online_players")
      .insert({
        room_id: room.id,
        name: params.playerName.trim() || "Player",
        device_id: params.deviceId,
        is_host: false,
      })
      .select("*")
      .single();

    if (playerError) {
      throw playerError;
    }

    localPlayer = playerData as OnlinePlayer;
  }

  const snapshot = await fetchOnlineRoomSnapshot(room.id);

  return {
    ...snapshot,
    localPlayer,
  };
}

export async function fetchOnlineRoomSnapshot(roomId: string): Promise<OnlineRoomSnapshot> {
  const client = requireSupabase();

  const [roomResponse, playersResponse, roundsResponse, resultsResponse] = await Promise.all([
    client.from("online_rooms").select("*").eq("id", roomId).single(),
    client.from("online_players").select("*").eq("room_id", roomId).order("joined_at", { ascending: true }),
    client.from("online_rounds").select("*").eq("room_id", roomId).order("round_number", { ascending: true }),
    client.from("online_results").select("*").eq("room_id", roomId).order("created_at", { ascending: true }),
  ]);

  if (roomResponse.error) {
    throw roomResponse.error;
  }

  if (playersResponse.error) {
    throw playersResponse.error;
  }

  if (roundsResponse.error) {
    throw roundsResponse.error;
  }

  if (resultsResponse.error) {
    throw resultsResponse.error;
  }

  return {
    room: roomResponse.data as OnlineRoom,
    players: playersResponse.data as OnlinePlayer[],
    rounds: roundsResponse.data as OnlineRound[],
    results: resultsResponse.data as OnlineResult[],
  };
}

export async function subscribeToOnlineRoom(roomId: string, onChange: () => void) {
  const client = requireSupabase();

  const channel = client
    .channel(`online-room-${roomId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "online_rooms", filter: `id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "online_players", filter: `room_id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "online_rounds", filter: `room_id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "online_results", filter: `room_id=eq.${roomId}` }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

export async function startOnlineRoom(room: OnlineRoom, players: OnlinePlayer[]): Promise<void> {
  const client = requireSupabase();
  const firstPlayer = players[0];
  const seed = createRoundSeed();
  const boardSize = room.settings.boardSize;
  const targetNumber = pickTargetFromSeededBoard(boardSize, seed);

  if (!firstPlayer) {
    throw new Error("A room needs at least one player before it can start. Revolutionary, I know.");
  }

  const { error: roundError } = await client
    .from("online_rounds")
    .upsert({
      room_id: room.id,
      round_number: 1,
      seed,
      target_number: targetNumber,
      board_size: boardSize,
      status: "waiting",
    }, { onConflict: "room_id,round_number" });

  if (roundError) {
    throw roundError;
  }

  const { error: roomError } = await client
    .from("online_rooms")
    .update({
      status: "ready",
      current_round: 1,
      current_player_id: room.game_type === "same_challenge" ? firstPlayer.id : null,
    })
    .eq("id", room.id);

  if (roomError) {
    throw roomError;
  }
}
