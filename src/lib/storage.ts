import { calculateGameStats } from "@/engine/stats";
import type { Difficulty, GameConfig, GameMode, Player, TurnResult } from "@/types/game";

const SETTINGS_KEY = "blink-and-find-settings";
const BEST_SCORES_KEY = "blink-and-find-best-scores";
const MAX_SAVED_SCORES = 10;

export interface SavedGameSettings {
  mode: GameMode;
  playerNames: string[];
  totalRounds: number;
  difficulty: Difficulty;
  penaltySeconds: number;
}

export interface SavedScore {
  id: string;
  createdAt: string;
  mode: GameMode;
  difficulty: Difficulty;
  boardSize: number;
  totalRounds: number;
  winnerName: string;
  winnerTimeMs: number;
  totalWrongTaps: number;
  totalPenaltyMs: number;
  accuracyPercent: number;
  fastestTurnMs: number | null;
  players: Player[];
  results: TurnResult[];
}

export interface SaveScoreResult {
  scores: SavedScore[];
  bestScore: SavedScore | null;
  isNewBest: boolean;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeRead<T>(key: string): T | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) as T : null;
  } catch {
    return null;
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can fail in private mode or when quota is full.
    // The game should keep working even if the browser refuses to remember things.
  }
}

export function loadGameSettings(): SavedGameSettings | null {
  return safeRead<SavedGameSettings>(SETTINGS_KEY);
}

export function saveGameSettings(settings: SavedGameSettings): void {
  safeWrite(SETTINGS_KEY, settings);
}

export function loadBestScores(): SavedScore[] {
  return safeRead<SavedScore[]>(BEST_SCORES_KEY) ?? [];
}

export function getBestScore(): SavedScore | null {
  return loadBestScores()[0] ?? null;
}

export function createScoreSnapshot(
  config: GameConfig,
  players: Player[],
  results: TurnResult[]
): SavedScore {
  const ranking = [...players].sort((a, b) => a.totalTimeMs - b.totalTimeMs);
  const winner = ranking[0];
  const stats = calculateGameStats(results);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    mode: config.mode,
    difficulty: config.difficulty,
    boardSize: config.boardSize,
    totalRounds: config.totalRounds,
    winnerName: winner?.name ?? "Nobody",
    winnerTimeMs: winner?.totalTimeMs ?? 0,
    totalWrongTaps: stats.totalWrongTaps,
    totalPenaltyMs: stats.totalPenaltyMs,
    accuracyPercent: stats.accuracyPercent,
    fastestTurnMs: stats.fastestTurn?.finalTimeMs ?? null,
    players: ranking,
    results,
  };
}

export function saveBestScore(score: SavedScore): SaveScoreResult {
  const previousScores = loadBestScores();
  const previousBest = previousScores[0] ?? null;

  const nextScores = [...previousScores, score]
    .sort((a, b) => {
      if (a.winnerTimeMs !== b.winnerTimeMs) {
        return a.winnerTimeMs - b.winnerTimeMs;
      }

      if (a.totalWrongTaps !== b.totalWrongTaps) {
        return a.totalWrongTaps - b.totalWrongTaps;
      }

      return b.accuracyPercent - a.accuracyPercent;
    })
    .slice(0, MAX_SAVED_SCORES);

  safeWrite(BEST_SCORES_KEY, nextScores);

  const bestScore = nextScores[0] ?? null;
  const isNewBest = Boolean(
    bestScore &&
    bestScore.id === score.id &&
    (!previousBest || score.winnerTimeMs < previousBest.winnerTimeMs)
  );

  return {
    scores: nextScores,
    bestScore,
    isNewBest,
  };
}
