import { supabase } from "@/lib/supabase";
import { getCurrentOnlineRound } from "@/lib/onlineRooms";
import type { OnlineResult, OnlineRoomSnapshot } from "@/types/online";

export const LIVE_RACE_ROUND_TIMEOUT_MS = 120_000;

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function resolveLiveRaceTimeout(snapshot: OnlineRoomSnapshot, timeoutMs = LIVE_RACE_ROUND_TIMEOUT_MS) {
  const client = requireSupabase();
  const room = snapshot.room;
  const round = getCurrentOnlineRound(snapshot);

  if (room.game_type !== "live_race" || room.status !== "playing" || !round) {
    return false;
  }

  const roundStartAt = room.round_start_at ?? round.start_at;

  if (!roundStartAt || Date.now() - new Date(roundStartAt).getTime() < timeoutMs) {
    return false;
  }

  const finishedPlayerIds = new Set(
    snapshot.results
      .filter((result) => result.round_number === room.current_round)
      .map((result) => result.player_id)
  );
  const missingPlayers = snapshot.players.filter((player) => !finishedPlayerIds.has(player.id));

  await Promise.all(
    missingPlayers.map(async (player) => {
      const { data: existingResult, error: existingError } = await client
        .from("online_results")
        .select("id")
        .eq("room_id", room.id)
        .eq("round_number", room.current_round)
        .eq("player_id", player.id)
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
          room_id: room.id,
          round_number: room.current_round,
          player_id: player.id,
          player_name: player.name,
          target_number: round.target_number,
          raw_time_ms: timeoutMs,
          penalty_ms: 0,
          final_time_ms: timeoutMs,
          wrong_taps: 0,
          client_tap_at: null,
        });

      if (resultError) {
        throw resultError;
      }

      const { error: playerError } = await client
        .from("online_players")
        .update({
          total_time_ms: player.total_time_ms + timeoutMs,
          wrong_taps: player.wrong_taps,
        })
        .eq("id", player.id);

      if (playerError) {
        throw playerError;
      }
    })
  );

  const { data: results, error: resultsError } = await client
    .from("online_results")
    .select("*")
    .eq("room_id", room.id)
    .eq("round_number", room.current_round)
    .order("final_time_ms", { ascending: true });

  if (resultsError) {
    throw resultsError;
  }

  const completedResults = (results ?? []) as OnlineResult[];

  if (completedResults.length < snapshot.players.length) {
    return false;
  }

  await Promise.all(
    completedResults.map((result, index) => client.from("online_results").update({ placement: index + 1 }).eq("id", result.id))
  );

  const isFinalRound = room.current_round >= room.settings.totalRounds;
  const [roundResponse, roomResponse] = await Promise.all([
    client.from("online_rounds").update({ status: "complete" }).eq("room_id", room.id).eq("round_number", room.current_round),
    client.from("online_rooms").update({ status: isFinalRound ? "finished" : "round_summary", current_player_id: null, round_start_at: null }).eq("id", room.id),
  ]);

  if (roundResponse.error) {
    throw roundResponse.error;
  }

  if (roomResponse.error) {
    throw roomResponse.error;
  }

  return true;
}
