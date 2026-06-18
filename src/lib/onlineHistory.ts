import { supabase } from "@/lib/supabase";
import type { OnlinePlayer, OnlineResult, OnlineRoom } from "@/types/online";

export interface OnlineRoomHistorySummary {
  room: OnlineRoom;
  players: OnlinePlayer[];
  results: OnlineResult[];
  winner: OnlinePlayer | null;
  totalRounds: number;
  resultCount: number;
  totalWrongTaps: number;
  averageFinalTimeMs: number;
  completedAt: string;
}

export interface OnlinePlayerHistorySummary {
  name: string;
  deviceId: string;
  gamesPlayed: number;
  wins: number;
  totalTimeMs: number;
  averageTimeMs: number;
  wrongTaps: number;
  bestGameMs: number;
  isCurrentDevice: boolean;
}

export interface OnlineHistorySnapshot {
  rooms: OnlineRoomHistorySummary[];
  leaderboard: OnlinePlayerHistorySummary[];
  totals: {
    finishedRooms: number;
    players: number;
    rounds: number;
    results: number;
  };
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function getWinner(players: OnlinePlayer[]): OnlinePlayer | null {
  if (players.length === 0) {
    return null;
  }

  return [...players].sort((a, b) => {
    if (a.total_time_ms !== b.total_time_ms) {
      return a.total_time_ms - b.total_time_ms;
    }

    return a.wrong_taps - b.wrong_taps;
  })[0];
}

function getCompletedAt(room: OnlineRoom, results: OnlineResult[]): string {
  const lastResult = [...results].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return lastResult?.created_at ?? room.updated_at ?? room.created_at;
}

function summarizeRoom(room: OnlineRoom, players: OnlinePlayer[], results: OnlineResult[]): OnlineRoomHistorySummary {
  const totalFinalMs = results.reduce((total, result) => total + result.final_time_ms, 0);
  const totalWrongTaps = results.reduce((total, result) => total + result.wrong_taps, 0);

  return {
    room,
    players: [...players].sort((a, b) => {
      if (a.total_time_ms !== b.total_time_ms) {
        return a.total_time_ms - b.total_time_ms;
      }

      return a.joined_at.localeCompare(b.joined_at);
    }),
    results: [...results].sort((a, b) => {
      if (a.round_number !== b.round_number) {
        return a.round_number - b.round_number;
      }

      return a.final_time_ms - b.final_time_ms;
    }),
    winner: getWinner(players),
    totalRounds: room.settings.totalRounds,
    resultCount: results.length,
    totalWrongTaps,
    averageFinalTimeMs: results.length > 0 ? totalFinalMs / results.length : 0,
    completedAt: getCompletedAt(room, results),
  };
}

function buildLeaderboard(rooms: OnlineRoomHistorySummary[], currentDeviceId: string): OnlinePlayerHistorySummary[] {
  const entries = new Map<string, OnlinePlayerHistorySummary>();

  rooms.forEach((roomSummary) => {
    const winnerId = roomSummary.winner?.id ?? null;

    roomSummary.players.forEach((player) => {
      const key = `${player.device_id}:${player.name.trim().toLowerCase()}`;
      const existing = entries.get(key) ?? {
        name: player.name,
        deviceId: player.device_id,
        gamesPlayed: 0,
        wins: 0,
        totalTimeMs: 0,
        averageTimeMs: 0,
        wrongTaps: 0,
        bestGameMs: Number.POSITIVE_INFINITY,
        isCurrentDevice: player.device_id === currentDeviceId,
      };

      existing.gamesPlayed += 1;
      existing.wins += winnerId === player.id ? 1 : 0;
      existing.totalTimeMs += player.total_time_ms;
      existing.wrongTaps += player.wrong_taps;
      existing.bestGameMs = Math.min(existing.bestGameMs, player.total_time_ms);
      existing.averageTimeMs = existing.totalTimeMs / existing.gamesPlayed;
      existing.isCurrentDevice = existing.isCurrentDevice || player.device_id === currentDeviceId;

      entries.set(key, existing);
    });
  });

  return Array.from(entries.values()).sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    if (a.averageTimeMs !== b.averageTimeMs) {
      return a.averageTimeMs - b.averageTimeMs;
    }

    return a.wrongTaps - b.wrongTaps;
  });
}

export async function fetchOnlineHistory(currentDeviceId: string, limit = 30): Promise<OnlineHistorySnapshot> {
  const client = requireSupabase();

  const { data: roomData, error: roomError } = await client
    .from("online_rooms")
    .select("*")
    .eq("status", "finished")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (roomError) {
    throw roomError;
  }

  const rooms = (roomData ?? []) as OnlineRoom[];
  const roomIds = rooms.map((room) => room.id);

  if (roomIds.length === 0) {
    return {
      rooms: [],
      leaderboard: [],
      totals: {
        finishedRooms: 0,
        players: 0,
        rounds: 0,
        results: 0,
      },
    };
  }

  const [playersResponse, resultsResponse] = await Promise.all([
    client
      .from("online_players")
      .select("*")
      .in("room_id", roomIds)
      .order("joined_at", { ascending: true }),
    client
      .from("online_results")
      .select("*")
      .in("room_id", roomIds)
      .order("created_at", { ascending: true }),
  ]);

  if (playersResponse.error) {
    throw playersResponse.error;
  }

  if (resultsResponse.error) {
    throw resultsResponse.error;
  }

  const players = (playersResponse.data ?? []) as OnlinePlayer[];
  const results = (resultsResponse.data ?? []) as OnlineResult[];
  const playersByRoom = new Map<string, OnlinePlayer[]>();
  const resultsByRoom = new Map<string, OnlineResult[]>();

  players.forEach((player) => {
    playersByRoom.set(player.room_id, [...(playersByRoom.get(player.room_id) ?? []), player]);
  });

  results.forEach((result) => {
    resultsByRoom.set(result.room_id, [...(resultsByRoom.get(result.room_id) ?? []), result]);
  });

  const roomSummaries = rooms.map((room) => {
    return summarizeRoom(room, playersByRoom.get(room.id) ?? [], resultsByRoom.get(room.id) ?? []);
  });

  return {
    rooms: roomSummaries,
    leaderboard: buildLeaderboard(roomSummaries, currentDeviceId),
    totals: {
      finishedRooms: roomSummaries.length,
      players: players.length,
      rounds: roomSummaries.reduce((total, room) => total + room.totalRounds, 0),
      results: results.length,
    },
  };
}
