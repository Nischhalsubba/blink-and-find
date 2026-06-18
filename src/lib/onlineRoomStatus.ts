import { supabase } from "@/lib/supabase";
import type { OnlineRoom } from "@/types/online";

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

/**
 * Marks an online room as finished and closes the current round.
 */
export async function finishOnlineRoom(room: OnlineRoom): Promise<void> {
  const client = requireSupabase();

  const [roundResponse, roomResponse] = await Promise.all([
    client
      .from("online_rounds")
      .update({ status: "complete" })
      .eq("room_id", room.id)
      .eq("round_number", room.current_round),
    client
      .from("online_rooms")
      .update({
        status: "finished",
        current_player_id: null,
      })
      .eq("id", room.id),
  ]);

  if (roundResponse.error) {
    throw roundResponse.error;
  }

  if (roomResponse.error) {
    throw roomResponse.error;
  }
}
