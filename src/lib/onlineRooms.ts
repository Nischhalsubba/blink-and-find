import { generateSeededZigZagBoard } from "@/engine/board";
import { supabase } from "@/lib/supabase";
import type { GameConfig, Player, TurnResult } from "@/types/game";
import type { OnlineGameType, OnlinePlayer, OnlineResult, OnlineRoom, OnlineRoomSnapshot, OnlineRound } from "@/types/online";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LIVE_RACE_COUNTDOWN_MS = 5000;

export function createRoomCode(): string {
  return Array.from({ length: 5 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
}

export function createRoundSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

export function getLiveRaceStartsAt(): string {
  return new Date(Date.now() + LIVE_RACE_COUNTDOWN_MS).toISOString();
}

export function getOnlineBoard(boardSize: number, seed: number): number[] {
  return generateSeededZigZagBoard(boardSize, seed);
}

export function pickTargetFromSeededBoard(boardSize: number, seed: number): number {
  const board = getOnlineBoard(boardSize, seed);
  const targetIndex = Math.abs(seed * 31 + boardSize * 17) % board.length;
  return board[targetIndex];
}

export function getCurrentOnlineRound(snapshot: OnlineRoomSnapshot): OnlineRound | null {
  return snapshot.rounds.find((round) => round.round_number === snapshot.room.current_round) ?? null;
}

export function onlinePlayerToGamePlayer(player: OnlinePlayer): Player {
  return {
    id: player.id,
    name: player.name,
    totalTimeMs: player.total_time_ms,
    wrongTaps: player.wrong_taps,
    completedTurns: 0,
  };
}

export function onlineResultToTurnResult(result: OnlineResult): TurnResult {
  return {
    id: result.id,
    round: result.round_number,
    playerId: result.player_id,
    playerName: result.player_name,
    targetNumber: result.target_number,
    rawTimeMs: result.raw_time_ms,
    penaltyMs: result.penalty_ms,
    finalTimeMs: result.final_time_ms,
    wrongTaps: result.wrong_taps,
  };
}

export function onlinePlayersToGamePlayers(players: OnlinePlayer[]): Player[] {
  return players.map(onlinePlayerToGamePlayer);
}

export function onlineResultsToTurnResults(results: OnlineResult[]): TurnResult[] {
  return results.map(onlineResultToTurnResult);
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

  if (room.status === "abandoned") {
    throw new Error("That room is no longer active. Create a new room instead.");
  }

  const { data: existingPlayer } = await client
    .from("online_players")
    .select("*")
    .eq("room_id", room.id)
    .eq("device_id", params.deviceId)
    .maybeSingle();

  let localPlayer = existingPlayer as OnlinePlayer | null;

  if (!localPlayer && room.status !== "lobby") {
    throw new Error("That game already started. Ask the host to create a new room.");
  }

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
  const isLiveRace = room.game_type === "live_race";
  const startsAt = isLiveRace ? getLiveRaceStartsAt() : null;

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
      status: isLiveRace ? "playing" : "waiting",
      start_at: startsAt,
    }, { onConflict: "room_id,round_number" });

  if (roundError) {
    throw roundError;
  }

  const { error: roomError } = await client
    .from("online_rooms")
    .update({
      status: isLiveRace ? "playing" : "ready",
      current_round: 1,
      current_player_id: isLiveRace ? null : firstPlayer.id,
      round_start_at: startsAt,
    })
    .eq("id", room.id);

  if (roomError) {
    throw roomError;
  }
}

export async function markSameChallengeTurnPlaying(roomId: string, roundId: string): Promise<void> {
  const client = requireSupabase();

  const [roomResponse, roundResponse] = await Promise.all([
    client.from("online_rooms").update({ status: "playing" }).eq("id", roomId),
    client.from("online_rounds").update({ status: "playing", start_at: new Date().toISOString() }).eq("id", roundId),
  ]);

  if (roomResponse.error) {
    throw roomResponse.error;
  }

  if (roundResponse.error) {
    throw roundResponse.error;
  }
}

export async function submitSameChallengeResult(params: {
  room: OnlineRoom;
  players: OnlinePlayer[];
  result: TurnResult;
}): Promise<void> {
  const client = requireSupabase();
  const sortedPlayers = [...params.players].sort((a, b) => a.joined_at.localeCompare(b.joined_at));
  const playerIndex = sortedPlayers.findIndex((player) => player.id === params.result.playerId);
  const currentPlayer = sortedPlayers[playerIndex];
  const nextPlayer = sortedPlayers[playerIndex + 1] ?? null;
  const isFinalRound = params.room.current_round >= params.room.settings.totalRounds;

  if (!currentPlayer) {
    throw new Error("Could not find the current online player.");
  }

  const { error: resultError } = await client
    .from("online_results")
    .upsert({
      room_id: params.room.id,
      round_number: params.result.round,
      player_id: params.result.playerId,
      player_name: params.result.playerName,
      target_number: params.result.targetNumber,
      raw_time_ms: params.result.rawTimeMs,
      penalty_ms: params.result.penaltyMs,
      final_time_ms: params.result.finalTimeMs,
      wrong_taps: params.result.wrongTaps,
      client_tap_at: new Date().toISOString(),
    }, { onConflict: "room_id,round_number,player_id" });

  if (resultError) {
    throw resultError;
  }

  const { error: playerError } = await client
    .from("online_players")
    .update({
      total_time_ms: currentPlayer.total_time_ms + params.result.finalTimeMs,
      wrong_taps: currentPlayer.wrong_taps + params.result.wrongTaps,
    })
    .eq("id", currentPlayer.id);

  if (playerError) {
    throw playerError;
  }

  if (nextPlayer) {
    const { error: roomError } = await client
      .from("online_rooms")
      .update({
        status: "ready",
        current_player_id: nextPlayer.id,
      })
      .eq("id", params.room.id);

    if (roomError) {
      throw roomError;
    }

    return;
  }

  const [roundResponse, roomResponse] = await Promise.all([
    client.from("online_rounds").update({ status: "complete" }).eq("room_id", params.room.id).eq("round_number", params.room.current_round),
    client.from("online_rooms").update({
      status: isFinalRound ? "finished" : "round_summary",
      current_player_id: null,
    }).eq("id", params.room.id),
  ]);

  if (roundResponse.error) {
    throw roundResponse.error;
  }

  if (roomResponse.error) {
    throw roomResponse.error;
  }
}

export async function submitLiveRaceResult(params: {
  room: OnlineRoom;
  players: OnlinePlayer[];
  result: TurnResult;
}): Promise<void> {
  const client = requireSupabase();
  const currentPlayer = params.players.find((player) => player.id === params.result.playerId);
  const isFinalRound = params.room.current_round >= params.room.settings.totalRounds;

  if (!currentPlayer) {
    throw new Error("Could not find the current online player.");
  }

  const { data: existingResult, error: existingError } = await client
    .from("online_results")
    .select("id")
    .eq("room_id", params.room.id)
    .eq("round_number", params.result.round)
    .eq("player_id", params.result.playerId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingResult) {
    return;
  }

  const { error: resultError } = await client
    .from("online_results")
    .insert({
      room_id: params.room.id,
      round_number: params.result.round,
      player_id: params.result.playerId,
      player_name: params.result.playerName,
      target_number: params.result.targetNumber,
      raw_time_ms: params.result.rawTimeMs,
      penalty_ms: params.result.penaltyMs,
      final_time_ms: params.result.finalTimeMs,
      wrong_taps: params.result.wrongTaps,
      client_tap_at: new Date().toISOString(),
    });

  if (resultError) {
    throw resultError;
  }

  const { error: playerError } = await client
    .from("online_players")
    .update({
      total_time_ms: currentPlayer.total_time_ms + params.result.finalTimeMs,
      wrong_taps: currentPlayer.wrong_taps + params.result.wrongTaps,
    })
    .eq("id", currentPlayer.id);

  if (playerError) {
    throw playerError;
  }

  const { data: roundResults, error: resultsError } = await client
    .from("online_results")
    .select("*")
    .eq("room_id", params.room.id)
    .eq("round_number", params.room.current_round)
    .order("final_time_ms", { ascending: true });

  if (resultsError) {
    throw resultsError;
  }

  const completedResults = (roundResults ?? []) as OnlineResult[];

  if (completedResults.length < params.players.length) {
    return;
  }

  await Promise.all(
    completedResults.map((result, index) => {
      return client.from("online_results").update({ placement: index + 1 }).eq("id", result.id);
    })
  );

  const [roundResponse, roomResponse] = await Promise.all([
    client.from("online_rounds").update({ status: "complete" }).eq("room_id", params.room.id).eq("round_number", params.room.current_round),
    client.from("online_rooms").update({
      status: isFinalRound ? "finished" : "round_summary",
      current_player_id: null,
      round_start_at: null,
    }).eq("id", params.room.id),
  ]);

  if (roundResponse.error) {
    throw roundResponse.error;
  }

  if (roomResponse.error) {
    throw roomResponse.error;
  }
}

export async function startNextOnlineRound(room: OnlineRoom, players: OnlinePlayer[]): Promise<void> {
  const client = requireSupabase();
  const firstPlayer = players[0];
  const nextRound = room.current_round + 1;
  const seed = createRoundSeed();
  const boardSize = room.settings.boardSize;
  const targetNumber = pickTargetFromSeededBoard(boardSize, seed);
  const isLiveRace = room.game_type === "live_race";
  const startsAt = isLiveRace ? getLiveRaceStartsAt() : null;

  if (!firstPlayer) {
    throw new Error("A room needs players before the next round can start.");
  }

  const { error: roundError } = await client
    .from("online_rounds")
    .upsert({
      room_id: room.id,
      round_number: nextRound,
      seed,
      target_number: targetNumber,
      board_size: boardSize,
      status: isLiveRace ? "playing" : "waiting",
      start_at: startsAt,
    }, { onConflict: "room_id,round_number" });

  if (roundError) {
    throw roundError;
  }

  const { error: roomError } = await client
    .from("online_rooms")
    .update({
      status: isLiveRace ? "playing" : "ready",
      current_round: nextRound,
      current_player_id: isLiveRace ? null : firstPlayer.id,
      round_start_at: startsAt,
    })
    .eq("id", room.id);

  if (roomError) {
    throw roomError;
  }
}
