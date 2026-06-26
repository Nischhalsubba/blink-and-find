import { createOnlineRoom, fetchOnlineRoomSnapshot } from "@/lib/onlineRooms";
import { supabase } from "@/lib/supabase";
import type { GameConfig, TurnResult } from "@/types/game";
import type { OnlineGameType, OnlinePlayer, OnlineRoom, OnlineRoomSnapshot } from "@/types/online";

const AI_DEVICE_PREFIX = "ai-opponent:";
const AI_NAMES = [
  "AI Neon Fox",
  "AI Pixel Panda",
  "AI Turbo Lynx",
  "AI Quantum Owl",
  "AI Chrome Tiger",
  "AI Circuit Raven",
  "AI Vector Wolf",
  "AI Glitch Falcon",
];

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function isOnlineAiPlayer(player: Pick<OnlinePlayer, "device_id" | "name"> | null | undefined) {
  return Boolean(player?.device_id?.startsWith(AI_DEVICE_PREFIX) || player?.name?.startsWith("AI "));
}

export function clampAiOpponentCount(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(Math.floor(value), 24));
}

function getAiName(index: number) {
  return AI_NAMES[index % AI_NAMES.length] + (index >= AI_NAMES.length ? ` ${index + 1}` : "");
}

function createAiRows(roomId: string, startIndex: number, aiCount: number) {
  return Array.from({ length: aiCount }, (_, offset) => {
    const index = startIndex + offset;
    return {
      room_id: roomId,
      name: getAiName(index),
      device_id: `${AI_DEVICE_PREFIX}${roomId}:${index + 1}`,
      is_host: false,
      is_connected: true,
    };
  });
}

export async function addAiPlayersToOnlineRoom(roomId: string, aiCount: number): Promise<OnlineRoomSnapshot> {
  const client = requireSupabase();
  const count = clampAiOpponentCount(aiCount);
  const snapshot = await fetchOnlineRoomSnapshot(roomId);

  if (snapshot.room.status !== "lobby") {
    throw new Error("AI opponents can only be added before the room starts.");
  }

  const existingAiCount = snapshot.players.filter(isOnlineAiPlayer).length;
  const aiRows = createAiRows(roomId, existingAiCount, count);
  const nextCapacity = Math.max(snapshot.room.max_players ?? 2, snapshot.players.length + aiRows.length);

  const [playerResponse, roomResponse] = await Promise.all([
    client.from("online_players").insert(aiRows),
    client.from("online_rooms").update({ max_players: nextCapacity }).eq("id", roomId),
  ]);

  if (playerResponse.error) throw playerResponse.error;
  if (roomResponse.error) throw roomResponse.error;

  return fetchOnlineRoomSnapshot(roomId);
}

export async function createOnlineRoomWithAi(params: {
  playerName: string;
  deviceId: string;
  gameType: OnlineGameType;
  settings: GameConfig;
  aiCount: number;
}): Promise<OnlineRoomSnapshot & { localPlayer: OnlinePlayer }> {
  const roomResult = await createOnlineRoom({
    playerName: params.playerName,
    deviceId: params.deviceId,
    gameType: params.gameType,
    settings: params.settings,
  });
  const snapshot = await addAiPlayersToOnlineRoom(roomResult.room.id, params.aiCount);

  return {
    ...snapshot,
    localPlayer: snapshot.players.find((player) => player.id === roomResult.localPlayer.id) ?? roomResult.localPlayer,
  };
}

export function createAiTurnTiming(params: {
  boardSize: number;
  roundNumber: number;
  playerIndex: number;
  playerId: string;
}) {
  const idSeed = hashString(`${params.playerId}:${params.roundNumber}:${params.playerIndex}`);
  const baseMs = Math.max(650, Math.min(3400, 900 + params.boardSize * 10));
  const varianceMs = (idSeed * 97 + params.roundNumber * 211 + params.playerIndex * 389) % 1900;
  const wrongTaps = (idSeed + params.roundNumber + params.playerIndex) % 7 === 0 ? 2 : (idSeed + params.roundNumber) % 3 === 0 ? 1 : 0;
  return {
    rawTimeMs: baseMs + varianceMs,
    wrongTaps,
  };
}

export function createAiSameChallengeResult(params: {
  room: OnlineRoom;
  player: OnlinePlayer;
  playerIndex: number;
  targetNumber: number;
}): TurnResult {
  const timing = createAiTurnTiming({
    boardSize: params.room.settings.boardSize,
    roundNumber: params.room.current_round,
    playerIndex: params.playerIndex,
    playerId: params.player.id,
  });
  const penaltyMs = timing.wrongTaps * params.room.settings.penaltySeconds * 1000;

  return {
    id: `ai-${params.room.current_round}-${params.player.id}-${Date.now()}`,
    round: params.room.current_round,
    playerId: params.player.id,
    playerName: params.player.name,
    targetNumber: params.targetNumber,
    rawTimeMs: timing.rawTimeMs,
    penaltyMs,
    finalTimeMs: timing.rawTimeMs + penaltyMs,
    wrongTaps: timing.wrongTaps,
  };
}

export function getAiThinkingDelayMs(player: OnlinePlayer, roundNumber: number) {
  return 650 + (hashString(`${player.id}:${roundNumber}`) % 950);
}
