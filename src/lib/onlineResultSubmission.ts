import { supabase } from "@/lib/supabase";
import type { TurnResult } from "@/types/game";
import type { OnlineRoom } from "@/types/online";

export interface AtomicResultSubmission {
  inserted: boolean;
  resultId?: string;
  roomId: string;
  roundNumber: number;
  status: OnlineRoom["status"];
  completedResults?: number;
  activePlayers?: number;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function submitOnlineResultAtomic(
  room: Pick<OnlineRoom, "id">,
  result: TurnResult
): Promise<AtomicResultSubmission> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("submit_online_result_v2", {
    p_room_id: room.id,
    p_round_number: result.round,
    p_player_id: result.playerId,
    p_target_number: result.targetNumber,
    p_raw_time_ms: result.rawTimeMs,
    p_penalty_ms: result.penaltyMs,
    p_final_time_ms: result.finalTimeMs,
    p_wrong_taps: result.wrongTaps,
    p_client_tap_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }

  return data as AtomicResultSubmission;
}
