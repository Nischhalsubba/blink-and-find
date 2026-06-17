import type { Player, TurnResult } from "@/types/game";

/**
 * Converts seconds into milliseconds so calculations stay consistent.
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}

/**
 * Calculates penalty time for wrong taps.
 */
export function calculatePenaltyMs(
  wrongTaps: number,
  penaltySeconds: number
): number {
  return wrongTaps * secondsToMs(penaltySeconds);
}

/**
 * Creates a completed turn result.
 */
export function createTurnResult(params: {
  round: number;
  player: Player;
  targetNumber: number;
  rawTimeMs: number;
  wrongTaps: number;
  penaltySeconds: number;
}): TurnResult {
  const penaltyMs = calculatePenaltyMs(
    params.wrongTaps,
    params.penaltySeconds
  );

  return {
    id: `${params.round}-${params.player.id}-${Date.now()}`,
    round: params.round,
    playerId: params.player.id,
    playerName: params.player.name,
    targetNumber: params.targetNumber,
    rawTimeMs: params.rawTimeMs,
    penaltyMs,
    finalTimeMs: params.rawTimeMs + penaltyMs,
    wrongTaps: params.wrongTaps,
  };
}

/**
 * Applies a turn result back to the matching player.
 */
export function applyTurnResultToPlayers(
  players: Player[],
  result: TurnResult
): Player[] {
  return players.map((player) => {
    if (player.id !== result.playerId) {
      return player;
    }

    return {
      ...player,
      totalTimeMs: player.totalTimeMs + result.finalTimeMs,
      wrongTaps: player.wrongTaps + result.wrongTaps,
      completedTurns: player.completedTurns + 1,
    };
  });
}

/**
 * Finds the player with the lowest total time.
 */
export function getWinner(players: Player[]): Player | null {
  if (players.length === 0) {
    return null;
  }

  return [...players].sort(
    (first, second) => first.totalTimeMs - second.totalTimeMs
  )[0];
}

/**
 * Formats milliseconds for game UI.
 */
export function formatTime(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}
