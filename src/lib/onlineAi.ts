import { createOnlineRoom, fetchOnlineRoomSnapshot } from "@/lib/onlineRooms";
import { supabase } from "@/lib/supabase";
import type { GameConfig } from "@/types/game";
import type { OnlineGameType, OnlinePlayer, OnlineRoomSnapshot } from "@/types/online";

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

export function isOnlineAiPlayer(player: Pick<OnlinePlayer, "device_id" | "name">) {
  return player.device_id.startsWith(AI_DEVICE_PREFIX) || player.name.startsWith("AI ");
}

export function clampAiOpponentCount(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(Math.floor(value), 20));
}

function getAiName(index: number) {
  return AI_NAMES[index % AI_NAMES.length] + (index >= AI_NAMES.length ? ` ${index + 1}` : "");
}

export async function createOnlineRoomWithAi(params: {
  playerName: string;
  deviceId: string;
  gameType: OnlineGameType;
  settings: GameConfig;
  aiCount: number;
}): Promise<OnlineRoomSnapshot & { localPlayer: OnlinePlayer }> {
  const client = requireSupabase();
  const aiCount = clampAiOpponentCount(params.aiCount);
  const roomResult = await createOnlineRoom({
    playerName: params.playerName,
    deviceId: params.deviceId,
    gameType: params.gameType,
    settings: params.settings,
  });

  const aiRows = Array.from({ length: aiCount }, (_, index) => ({
    room_id: roomResult.room.id,
    name: getAiName(index),
    device_id: `${AI_DEVICE_PREFIX}${roomResult.room.id}:${index + 1}`,
    is_host: false,
    is_connected: true,
  }));

  const { error } = await client.from("online_players").insert(aiRows);
  if (error) throw error;

  const snapshot = await fetchOnlineRoomSnapshot(roomResult.room.id);
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
  const idSeed = Array.from(params.playerId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const baseMs = Math.max(650, Math.min(3200, 900 + params.boardSize * 12));
  const varianceMs = (idSeed * 97 + params.roundNumber * 211 + params.playerIndex * 389) % 1700;
  const wrongTaps = (idSeed + params.roundNumber + params.playerIndex) % 5 === 0 ? 1 : 0;
  return {
    rawTimeMs: baseMs + varianceMs,
    wrongTaps,
  };
}
