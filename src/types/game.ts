/**
 * All game modes supported by Blink & Find.
 */
export type GameMode = "single" | "multiplayer";

/**
 * The visible phase of the game screen.
 */
export type GamePhase = "setup" | "ready" | "preview" | "playing" | "turnSummary" | "roundSummary" | "finished";

/**
 * Difficulty presets are only configuration shortcuts.
 * The engine still accepts custom board sizes and timings.
 */
export type Difficulty = "easy" | "normal" | "hard";

/**
 * A player in either single-player or turn-based multiplayer mode.
 */
export interface Player {
  id: string;
  name: string;
  totalTimeMs: number;
  wrongTaps: number;
  completedTurns: number;
}

/**
 * Runtime configuration for the game.
 * Change this object and the whole game adapts without UI rewrites.
 */
export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
  boardSize: number;
  totalRounds: number;
  flashDurationMs: number;
  penaltySeconds: number;
  customNumbers?: number[];
}

/**
 * Result recorded after a single player finishes a turn.
 */
export interface TurnResult {
  id: string;
  round: number;
  playerId: string;
  playerName: string;
  targetNumber: number;
  rawTimeMs: number;
  penaltyMs: number;
  finalTimeMs: number;
  wrongTaps: number;
}

/**
 * Complete client-side game state.
 */
export interface GameState {
  config: GameConfig;
  phase: GamePhase;
  players: Player[];
  board: number[];
  currentRound: number;
  currentPlayerIndex: number;
  targetNumber: number | null;
  turnStartedAt: number | null;
  currentWrongTaps: number;
  results: TurnResult[];
}

/**
 * Difficulty preset shown in the setup screen.
 */
export interface DifficultyPreset {
  id: Difficulty;
  label: string;
  boardSize: number;
  flashDurationMs: number;
  description: string;
}
