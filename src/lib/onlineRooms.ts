import { generateSeededCustomZigZagBoard } from "@/engine/board";
import { supabase } from "@/lib/supabase";
import { assertValidTurnResultForSubmission } from "@/lib/scoreValidation";
import type { GameConfig, Player, TurnResult } from "@/types/game";
import type { OnlineGameType, OnlinePlayer, OnlineResult, OnlineRoom, OnlineRoomSnapshot, OnlineRound } from "@/types/online";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LIVE_RACE_COUNTDOWN_MS = 5000;
const DEFAULT_MAX_ONLINE_PLAYERS = 1000;

export function createRoomCode(): string {
  return Array.from({ length: 5 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
}

export function createRoundSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

export function getLiveRaceStartsAt(): string {
  return new Date(Date.now() + LIVE_RACE_COUNTDOWN_MS).toISOString();
}

export function getOnlineBoard(settingsOrBoardSize: GameConfig | number, seed: number): number[] {
  const settings = typeof settingsOrBoardSize === "number" ? null : settingsOrBoardSize;
  const boardSize = settings?.boardSize ?? (settingsOrBoardSize as number);
  const customNumbers = settings?.customNumbers ?? [];

  return generateSeededCustomZigZagBoard(boardSize, seed, customNumbers);
}

export function pickTargetFromSeededBoard(settingsOrBoardSize: GameConfig | number, seed: number): number {
  const board = getOnlineBoard(settingsOrBoardSize, seed);
  const boardSize = typeof settingsOrBoardSize === "number" ? settingsOrBoardSize : settingsOrBoardSize.boardSize;
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

function sortOnlinePlayers(players: OnlinePlayer[]) {
  return [...players].sort((a, b) => a.joined_at.localeCompare(b.joined_at));
}

function getRoundCompletedPlayerIds(results: OnlineResult[], roundNumber: number) {
  return new Set(results.filter((result) => result.round_number === roundNumber).map((result) => result.player_id));
}

function getSameChallengeProgressPlayers(players: OnlinePlayer[]) {
  const activePlayers = players.filter((player) => player.is_connected || player.is_host);
  return sortOnlinePlayers(activePlayers.length > 0 ? activePlayers : players);
}

function shouldRepairSameChallengeProgress(snapshot: OnlineRoomSnapshot) {
  const room = snapshot.room;

  if (room.game_type !== "same_challenge" || room.status === "lobby" || room.status === "finished" || room.status === "abandoned") {
    return false;
  }

  const players = getSameChallengeProgressPlayers(snapshot.players);
  const completedPlayerIds = getRoundCompletedPlayerIds(snapshot.results, room.current_round);

  if (players.length === 0) {
    return false;
  }

  if (room.status === "round_summary" || !room.current_player_id) {
    return true;
  }

  if (completedPlayerIds.has(room.current_player_id)) {
    return true;
  }

  return players.every((player) => completedPlayerIds.has(player.id));
}

async function writeSameChallengeNextRound(room: OnlineRoom, players: OnlinePlayer[]) {
  const client = requireSupabase();
  const firstPlayer = sortOnlinePlayers(players)[0];
  const nextRound = room.current_round + 1;
  const seed = createRoundSeed();
  const targetNumber = pickTargetFromSeededBoard(room.settings, seed);

  if (!firstPlayer) {
    throw new Error("A room needs players before the next round can start.");
  }

  if (nextRound > room.settings.totalRounds) {
    const [roundResponse, roomResponse] = await Promise.all([
      client
        .from("online_rounds")
        .update({ status: "complete", start_at: null })
        .eq("room_id", room.id)
        .eq("round_number", room.current_round),
      client
        .from("online_rooms")
        .update({ status: "finished", current_player_id: null, round_start_at: null })
        .eq("id", room.id),
    ]);

    if (roundResponse.error) throw roundResponse.error;
    if (roomResponse.error) throw roomResponse.error;
    return;
  }

  const [currentRoundResponse, nextRoundResponse, roomResponse] = await Promise.all([
    client
      .from("online_rounds")
      .update({ status: "complete", start_at: null })
      .eq("room_id", room.id)
      .eq("round_number", room.current_round),
    client
      .from("online_rounds")
      .upsert({
        room_id: room.id,
        round_number: nextRound,
        seed,
        target_number: targetNumber,
        board_size: room.settings.boardSize,
        status: "waiting",
        start_at: null,
      }, { onConflict: "room_id,round_number" }),
    client
      .from("online_rooms")
      .update({
        status: "ready",
        current_round: nextRound,
        current_player_id: firstPlayer.id,
        round_start_at: null,
      })
      .eq("id", room.id),
  ]);

  if (currentRoundResponse.error) throw currentRoundResponse.error;
  if (nextRoundResponse.error) throw nextRoundResponse.error;
  if (roomResponse.error) throw roomResponse.error;
}

async function writeSameChallengeRoomProgress(room: OnlineRoom, players: OnlinePlayer[], results: OnlineResult[]) {
  const client = requireSupabase();
  const sortedPlayers = sortOnlinePlayers(players);
  const completedPlayerIds = getRoundCompletedPlayerIds(results, room.current_round);
  const nextPlayer = sortedPlayers.find((player) => !completedPlayerIds.has(player.id)) ?? null;
  const isFinalRound = room.current_round >= room.settings.totalRounds;

  if (nextPlayer) {
    const [roundResponse, roomResponse] = await Promise.all([
      client
        .from("online_rounds")
        .update({ status: "waiting", start_at: null })
        .eq("room_id", room.id)
        .eq("round_number", room.current_round),
      client
        .from("online_rooms")
        .update({ status: "ready", current_player_id: nextPlayer.id, round_start_at: null })
        .eq("id", room.id),
    ]);

    if (roundResponse.error) throw roundResponse.error;
    if (roomResponse.error) throw roomResponse.error;
    return;
  }

  const placementResponses = await Promise.all(
    results
      .filter((result) => result.round_number === room.current_round)
      .sort((a, b) => a.final_time_ms - b.final_time_ms)
      .map((result, index) => client.from("online_results").update({ placement: index + 1 }).eq("id", result.id))
  );

  const placementError = placementResponses.find((response) => response.error)?.error;
  if (placementError) throw placementError;

  if (isFinalRound) {
    const [roundResponse, roomResponse] = await Promise.all([
      client
        .from("online_rounds")
        .update({ status: "complete", start_at: null })
        .eq("room_id", room.id)
        .eq("round_number", room.current_round),
      client
        .from("online_rooms")
        .update({ status: "finished", current_player_id: null, round_start_at: null })
        .eq("id", room.id),
    ]);

    if (roundResponse.error) throw roundResponse.error;
    if (roomResponse.error) throw roomResponse.error;
    return;
  }

  await writeSameChallengeNextRound(room, sortedPlayers);
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
    const snapshot = await fetchOnlineRoomSnapshot(room.id);
    const maxPlayers = room.max_players ?? DEFAULT_MAX_ONLINE_PLAYERS;

    if (snapshot.players.length >= maxPlayers) {
      throw new Error("That room is full. Even chaos needs capacity planning.");
    }

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

async function fetchOnlineRoomSnapshotRaw(roomId: string): Promise<OnlineRoomSnapshot> {
  const client = requireSupabase();

  const [roomResponse, playersResponse, roundsResponse, resultsResponse] = await Promise.all([
    client.from("online_rooms").select("*").eq("id", roomId).single(),
    client.from("online_players").select("*").eq("room_id", roomId).order("joined_at", { ascending: true }),
    client.from("online_rounds").select("*").eq("room_id", roomId).order("round_number", { ascending: true }),
    client.from("online_results").select("*").eq("room_id", roomId).order("created_at", { ascending: true }),
  ]);

  if (roomResponse.error) throw roomResponse.error;
  if (playersResponse.error) throw playersResponse.error;
  if (roundsResponse.error) throw roundsResponse.error;
  if (resultsResponse.error) throw resultsResponse.error;

  return {
    room: roomResponse.data as OnlineRoom,
    players: playersResponse.data as OnlinePlayer[],
    rounds: roundsResponse.data as OnlineRound[],
    results: resultsResponse.data as OnlineResult[],
  };
}

export async function fetchOnlineRoomSnapshot(roomId: string): Promise<OnlineRoomSnapshot> {
  const snapshot = await fetchOnlineRoomSnapshotRaw(roomId);

  if (!shouldRepairSameChallengeProgress(snapshot)) {
    return snapshot;
  }

  try {
    await writeSameChallengeRoomProgress(snapshot.room, getSameChallengeProgressPlayers(snapshot.players), snapshot.results);
    return fetchOnlineRoomSnapshotRaw(roomId);
  } catch {
    return snapshot;
  }
}

export async function repairSameChallengeProgress(snapshot: OnlineRoomSnapshot): Promise<boolean> {
  if (!shouldRepairSameChallengeProgress(snapshot)) {
    return false;
  }

  await writeSameChallengeRoomProgress(snapshot.room, getSameChallengeProgressPlayers(snapshot.players), snapshot.results);
  return true;
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
  const firstPlayer = sortOnlinePlayers(players)[0];
  const seed = createRoundSeed();
  const boardSize = room.settings.boardSize;
  const targetNumber = pickTargetFromSeededBoard(room.settings, seed);
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
  const startedAt = new Date().toISOString();

  const [roomResponse, roundResponse] = await Promise.all([
    client.from("online_rooms").update({ status: "playing", round_start_at: startedAt }).eq("id", roomId),
    client.from("online_rounds").update({ status: "playing", start_at: startedAt }).eq("id", roundId),
  ]);

  if (roomResponse.error) throw roomResponse.error;
  if (roundResponse.error) throw roundResponse.error;
}

export async function submitSameChallengeResult(params: {
  room: OnlineRoom;
  players: OnlinePlayer[];
  result: TurnResult;
}): Promise<void> {
  const client = requireSupabase();
  const currentPlayer = params.players.find((player) => player.id === params.result.playerId) ?? null;

  assertValidTurnResultForSubmission({
    result: params.result,
    penaltySeconds: params.room.settings.penaltySeconds,
    boardSize: params.room.settings.boardSize,
  });

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

  if (!existingResult) {
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
  }

  const freshSnapshot = await fetchOnlineRoomSnapshotRaw(params.room.id);

  if (freshSnapshot.room.status === "finished" || freshSnapshot.room.status === "abandoned" || freshSnapshot.room.current_round !== params.result.round) {
    return;
  }

  await writeSameChallengeRoomProgress(
    freshSnapshot.room,
    getSameChallengeProgressPlayers(freshSnapshot.players),
    freshSnapshot.results
  );
}

export async function submitLiveRaceResult(params: {
  room: OnlineRoom;
  players: OnlinePlayer[];
  result: TurnResult;
}): Promise<void> {
  const client = requireSupabase();
  const currentPlayer = params.players.find((player) => player.id === params.result.playerId);
  const isFinalRound = params.room.current_round >= params.room.settings.totalRounds;

  assertValidTurnResultForSubmission({
    result: params.result,
    penaltySeconds: params.room.settings.penaltySeconds,
    boardSize: params.room.settings.boardSize,
  });

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
    completedResults.map((result, index) => client.from("online_results").update({ placement: index + 1 }).eq("id", result.id))
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
  const firstPlayer = sortOnlinePlayers(players)[0];
  const nextRound = room.current_round + 1;
  const seed = createRoundSeed();
  const boardSize = room.settings.boardSize;
  const targetNumber = pickTargetFromSeededBoard(room.settings, seed);
  const isLiveRace = room.game_type === "live_race";
  const startsAt = isLiveRace ? getLiveRaceStartsAt() : null;

  if (!firstPlayer) {
    throw new Error("A room needs players before the next round can start.");
  }

  if (!isLiveRace && nextRound > room.settings.totalRounds) {
    const [roundResponse, roomResponse] = await Promise.all([
      client.from("online_rounds").update({ status: "complete", start_at: null }).eq("room_id", room.id).eq("round_number", room.current_round),
      client.from("online_rooms").update({ status: "finished", current_player_id: null, round_start_at: null }).eq("id", room.id),
    ]);

    if (roundResponse.error) throw roundResponse.error;
    if (roomResponse.error) throw roomResponse.error;
    return;
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
