import type { TurnResult } from "@/types/game";

export interface ScoreValidationInput {
  result: TurnResult;
  penaltySeconds: number;
  boardSize: number;
}

const MIN_HUMAN_RAW_TIME_MS = 150;
const MAX_REASONABLE_RAW_TIME_MS = 30 * 60 * 1000;
const MAX_WRONG_TAPS = 500;

export function validateTurnResultForSubmission({ result, penaltySeconds, boardSize }: ScoreValidationInput) {
  const expectedPenaltyMs = result.wrongTaps * penaltySeconds * 1000;
  const errors: string[] = [];

  if (!Number.isInteger(result.rawTimeMs) || result.rawTimeMs < MIN_HUMAN_RAW_TIME_MS) {
    errors.push("Raw time is unrealistically low.");
  }

  if (result.rawTimeMs > MAX_REASONABLE_RAW_TIME_MS) {
    errors.push("Raw time is outside the allowed range.");
  }

  if (!Number.isInteger(result.wrongTaps) || result.wrongTaps < 0 || result.wrongTaps > MAX_WRONG_TAPS) {
    errors.push("Wrong tap count is outside the allowed range.");
  }

  if (result.penaltyMs !== expectedPenaltyMs) {
    errors.push("Penalty time does not match the wrong-tap count.");
  }

  if (result.finalTimeMs !== result.rawTimeMs + result.penaltyMs) {
    errors.push("Final time does not match raw time plus penalty.");
  }

  if (!Number.isInteger(result.targetNumber) || result.targetNumber < 1 || result.targetNumber > boardSize) {
    errors.push("Target number is outside the board range.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function assertValidTurnResultForSubmission(input: ScoreValidationInput) {
  const validation = validateTurnResultForSubmission(input);

  if (!validation.ok) {
    throw new Error(`Score rejected: ${validation.errors.join(" ")}`);
  }
}
