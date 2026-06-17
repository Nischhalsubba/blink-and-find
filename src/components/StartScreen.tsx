"use client";

import { DIFFICULTIES } from "@/lib/gameDefaults";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Difficulty, GameConfig, GameMode } from "@/types/game";

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
 * The structure now follows a shadcn-style card composition while still using
 * Bootstrap grid utilities for responsive layout.
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
    <section className="setup-shell h-100 d-flex align-items-center justify-content-center">
      <Card className="setup-card w-100">
        <CardHeader className="text-center">
          <div className="ui-eyebrow mx-auto mb-2">Memory speed challenge</div>
          <CardTitle>Blink &amp; Find</CardTitle>
          <CardDescription>
            Memorize the target, find it after it disappears, and beat everyone else without panic-clicking like a caffeinated squirrel.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="row g-3">
            <div className="col-12 col-lg-7">
              <div className="ui-section h-100">
                <div className="ui-section-header">
                  <div>
                    <h3>Game setup</h3>
                    <p>Choose the flow before the grid starts judging your eyesight.</p>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label">Mode</label>
                    <select
                      className="form-select"
                      value={mode}
                      onChange={(event) => onModeChange(event.target.value as GameMode)}
                    >
                      <option value="single">Single Player</option>
                      <option value="multiplayer">Multiplayer</option>
                    </select>
                  </div>

                  <div className="col-6 col-sm-3">
                    <label className="form-label">Players</label>
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

                  <div className="col-6 col-sm-3">
                    <label className="form-label">Rounds</label>
                    <input
                      className="form-control"
                      min={1}
                      max={20}
                      type="number"
                      value={totalRounds}
                      onChange={(event) => onTotalRoundsChange(Number(event.target.value))}
                    />
                  </div>

                  <div className="col-12 col-sm-7">
                    <label className="form-label">Difficulty</label>
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

                  <div className="col-12 col-sm-5">
                    <label className="form-label">Wrong tap penalty</label>
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
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="ui-section h-100">
                <div className="ui-section-header">
                  <div>
                    <h3>Players</h3>
                    <p>Names are saved locally on this device.</p>
                  </div>
                  <span className="ui-badge">{mode === "single" ? 1 : playerNames.length}</span>
                </div>

                <div className="row g-2">
                  {playerNames.map((name, index) => (
                    <div className="col-12 col-sm-6 col-lg-12" key={index}>
                      <label className="form-label visually-hidden">Player {index + 1}</label>
                      <input
                        className="form-control"
                        value={name}
                        aria-label={`Player ${index + 1} name`}
                        onChange={(event) => updatePlayerName(index, event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-3">
          <div className="ui-meta">
            <strong>{selectedDifficulty.label}</strong>
            <span>{selectedDifficulty.boardSize} tiles · {selectedDifficulty.flashDurationMs / 1000}s preview</span>
          </div>

          <Button size="lg" onClick={handleStart}>
            Start Game
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
