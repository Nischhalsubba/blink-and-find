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
    throw