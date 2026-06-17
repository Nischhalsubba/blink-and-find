"use client";

import type { Difficulty, GameConfig, GameMode } from "@/types/game";
import { DIFFICULTIES } from "@/lib/gameDefaults";

interface StartScreenProps {
  mode: GameMode;
  playerNames: string[];
  totalRounds: number;
  difficulty: Difficulty;
  penaltySeconds: number;
  onModeChange: (mode: GameMode) => void;
  onPlayerNamesChange: (names: string[]) => void;
  onTotalRoundsChange: (rounds: number) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onPenaltySecondsChange: (seconds: number) => void;
  onStart: (config: GameConfig) => void;
}

/**
 * Setup screen for Blink & Find.
 * Every control is dynamic so the game can grow without hardcoding player or board limits.
 */
export default function StartScreen({
  mode,
  playerNames,
  totalRounds,
  difficulty,
  penaltySeconds,
  onModeChange,
  onPlayerNamesChange,
  onTotalRoundsChange,
  onDifficultyChange,
  onPenaltySecondsChange,
  onStart,
}: StartScreenProps) {
  const selectedDifficulty =
    DIFFICULTIES.find((item) => item.id === difficulty) ?? DIFFICULTIES[1];

  function updatePlayerCount(count: number) {
    const nextNames = Array.from({ length: count }, (_, index) => {
      return playerNames[index] ?? `Player ${index + 1}`;
    });

    onPlayerNamesChange(nextNames);
  }

  function updatePlayerName(index: number, name: string) {
    const nextNames = [...playerNames];
    nextNames[index] = name;
    onPlayerNamesChange(nextNames);
  }

  function handleStart() {
    onStart({
      mode,
      difficulty,
      boardSize: selectedDifficulty.boardSize,
      totalRounds,
      flashDurationMs: selectedDifficulty.flashDurationMs,
      penaltySeconds,
    });
  }

  return (
    <section className="game-panel p-3 p-sm-4 h-100 d-flex flex-column justify-content-center">
      <div className="text-center mb-3">
        <h1 className="compact-title mb-1">Blink &amp; Find</h1>
        <p className="compact-small text-muted-game mb-0">
          Flash it. Find it. Beat the clock.
        </p>
      </div>

      <div className="row g-2">
        <div className="col-12 col-md-6">
          <label className="form-label compact-small">Mode</label>
          <select
            className="form-select"
            value={mode}
            onChange={(event) => onModeChange(event.target.value as GameMode)}
          >
            <option value="single">Single Player</option>
            <option value="multiplayer">Multiplayer</option>
          </select>
        </div>

        <div className="col-6 col-md-3">
          <label className="form-label compact-small">Players</label>
          <select
            className="form-select"
            value={mode === "single" ? 1 : playerNames.length}
            disabled={mode === "single"}
            onChange={(event) => updatePlayerCount(Number(event.target.value))}
          >
            {[2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
        </div>

        <div className="col-6 col-md-3">
          <label className="form-label compact-small">Rounds</label>
          <input
            className="form-control"
            min={1}
            max={20}
            type="number"
            value={totalRounds}
            onChange={(event) => onTotalRoundsChange(Number(event.target.value))}
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label compact-small">Difficulty</label>
          <select
            className="form-select"
            value={difficulty}
            onChange={(event) => onDifficultyChange(event.target.value as Difficulty)}
          >
            {DIFFICULTIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} - {item.description}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label compact-small">Wrong tap penalty</label>
          <input
            className="form-control"
            min={0}
            max={10}
            type="number"
            value={penaltySeconds}
            onChange={(event) => onPenaltySecondsChange(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="row g-2 mt-2">
        {playerNames.map((name, index) => (
          <div className="col-6 col-md-4" key={index}>
            <input
              className="form-control"
              value={name}
              aria-label={`Player ${index + 1} name`}
              onChange={(event) => updatePlayerName(index, event.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-lg mt-3 fw-bold" onClick={handleStart}>
        Start Game
      </button>
    </section>
  );
}
