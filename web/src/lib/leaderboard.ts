import { supabase } from "@/lib/supabase";
import { getPlayerProfile } from "@/lib/playerProfile";
import { trackEvent } from "@/lib/analytics";

export interface LeaderboardScore {
  id: string;
  playerId: string;
  playerName: string;
  mode: string;
  scoreMs: number;
  wrongTaps: number;
  accuracyPercent: number;
  createdAt: string;
  source: "local" | "global";
}

export interface SubmitLeaderboardScoreInput {
  playerName: string;
  mode: string;
  scoreMs: number;
  wrongTaps: number;
  accuracyPercent: number;
}

const LOCAL_LEADERBOARD_KEY = "blink-and-find-leaderboard";
const MAX_LOCAL_SCORES = 50;

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `score-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isMissingLeaderboardError(error: { code?: string; message?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205" || error?.message?.toLowerCase().includes("leaderboard_scores");
}

export function loadLocalLeaderboard(): LeaderboardScore[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    return rawValue ? JSON.parse(rawValue) as LeaderboardScore[] : [];
  } catch {
    return [];
  }
}

export function saveLocalLeaderboardScore(input: SubmitLeaderboardScoreInput): LeaderboardScore {
  const profile = getPlayerProfile();
  const score: LeaderboardScore = {
    id: createId(),
    playerId: profile.id,
    playerName: input.playerName.trim() || profile.name,
    mode: input.mode,
    scoreMs: input.scoreMs,
    wrongTaps: input.wrongTaps,
    accuracyPercent: input.accuracyPercent,
    createdAt: new Date().toISOString(),
    source: "local",
  };

  if (typeof window !== "undefined") {
    const scores = [...loadLocalLeaderboard(), score]
      .sort((a, b) => a.scoreMs - b.scoreMs || a.wrongTaps - b.wrongTaps)
      .slice(0, MAX_LOCAL_SCORES);
    window.localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(scores));
  }

  trackEvent("leaderboard_submit", { mode: score.mode, scoreMs: score.scoreMs, source: "local" });
  return score;
}

export async function submitGlobalLeaderboardScore(input: SubmitLeaderboardScoreInput) {
  if (!supabase) {
    return { saved: false, unavailable: true };
  }

  const profile = getPlayerProfile();
  const { error } = await supabase
    .from("leaderboard_scores")
    .insert({
      player_id: profile.id,
      player_name: input.playerName.trim() || profile.name,
      mode: input.mode,
      score_ms: input.scoreMs,
      wrong_taps: input.wrongTaps,
      accuracy_percent: Math.round(input.accuracyPercent),
    });

  if (isMissingLeaderboardError(error)) {
    return { saved: false, unavailable: true };
  }

  if (error) {
    throw error;
  }

  trackEvent("leaderboard_submit", { mode: input.mode, scoreMs: input.scoreMs, source: "global" });
  return { saved: true, unavailable: false };
}

export async function loadGlobalLeaderboard(mode = "classic"): Promise<{ scores: LeaderboardScore[]; unavailable: boolean }> {
  if (!supabase) {
    return { scores: [], unavailable: true };
  }

  const { data, error } = await supabase
    .from("leaderboard_scores")
    .select("*")
    .eq("mode", mode)
    .order("score_ms", { ascending: true })
    .order("wrong_taps", { ascending: true })
    .limit(25);

  if (isMissingLeaderboardError(error)) {
    return { scores: [], unavailable: true };
  }

  if (error) {
    throw error;
  }

  return {
    scores: (data ?? []).map((score) => ({
      id: score.id,
      playerId: score.player_id,
      playerName: score.player_name,
      mode: score.mode,
      scoreMs: score.score_ms,
      wrongTaps: score.wrong_taps,
      accuracyPercent: score.accuracy_percent,
      createdAt: score.created_at,
      source: "global" as const,
    })),
    unavailable: false,
  };
}
