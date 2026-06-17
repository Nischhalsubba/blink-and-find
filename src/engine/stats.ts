import type { TurnResult } from "@/types/game";

export interface GameStats {
  totalTurns: number;
  totalWrongTaps: number;
  totalRawTimeMs: number;
  totalPenaltyMs: number;
  totalFinalTimeMs: number;
  averageTurnMs: number;
  fastestTurn: TurnResult | null;
  slowestTurn: TurnResult | null;
  accuracyPercent: number;
}

/**
 * Builds useful game stats from all completed turns.
 * This stays UI-independent so it can later power leaderboards, profiles, or daily challenges.
 */
export function calculateGameStats(results: TurnResult[]): GameStats {
  if (results.length === 0) {
    return {
      totalTurns: 0,
      totalWrongTaps: 0,
      totalRawTimeMs: 0,
      totalPenaltyMs: 0,
      totalFinalTimeMs: 0,
      averageTurnMs: 0,
      fastestTurn: null,
      slowestTurn: null,
      accuracyPercent: 100,
    };
  }

  const totalWrongTaps = results.reduce(
    (sum, result) => sum + result.wrongTaps,
    0
  );

  const totalRawTimeMs = results.reduce(
    (sum, result) => sum + result.rawTimeMs,
    0
  );

  const totalPenaltyMs = results.reduce(
    (sum, result) => sum + result.penaltyMs,
    0
  );

  const totalFinalTimeMs = results.reduce(
    (sum, result) => sum + result.finalTimeMs,
    0
  );

  const fastestTurn = [...results].sort(
    (a, b) => a.finalTimeMs - b.finalTimeMs
  )[0];

  const slowestTurn = [...results].sort(
    (a, b) => b.finalTimeMs - a.finalTimeMs
  )[0];

  const totalAttempts = results.length + totalWrongTaps;
  const accuracyPercent = totalAttempts === 0
    ? 100
    : (results.length / totalAttempts) * 100;

  return {
    totalTurns: results.length,
    totalWrongTaps,
    totalRawTimeMs,
    totalPenaltyMs,
    totalFinalTimeMs,
    averageTurnMs: totalFinalTimeMs / results.length,
    fastestTurn,
    slowestTurn,
    accuracyPercent,
  };
}
