"use client";

import { useEffect, useMemo, useState } from "react";
import NumberGrid from "@/components/NumberGrid";
import StartScreen from "@/components/StartScreen";
import TargetDisplay from "@/components/TargetDisplay";
import Timer from "@/components/Timer";
import { generateBoard } from "@/engine/board";
import { applyTurnResultToPlayers, createTurnResult, formatTime, getWinner } from "@/engine/scoring";
import { generateTarget } from "@/engine/target";
import type { Difficulty, GameConfig, GameMode, GamePhase, Player, TurnResult } from "@/types/game";

const DEFAULT_CONFIG: GameConfig = {
  mode: "multiplayer",
  difficulty: "normal",
  boardSize: 100,
  totalRounds: 5,
  flashDurationMs: 2000,
  penaltySeconds: 3,
};

/**
 * Creates clean player records from the entered names.
 */
function createPlayers(names: string[]): Player[] {
  return names.map((name, index) => ({
    id: `player-${index + 1}`,
    name: name.trim() || `Player ${index + 1}`,
    totalTimeMs: 0,
    wrongTaps: 0,
    completedTurns: 0,
  }));
}

/**
 * Main game controller.
 * This keeps the first playable version intentionally contained in one file.
 * Later, this can be split into hooks once the gameplay feels right.
 */
export default function HomePage() {
  const [mode, setMode] = useState<GameMode>("multiplayer");
  const [playerNames, setPlayerNames] = useState<string[]>(["Player 1", "Player 2"]);
  const [totalRounds, setTotalRounds] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [penaltySeconds, setPenaltySeconds] = useState(3);

  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [players, setPlayers] = useState<Player[]>([]);
  const [board, setBoard] = useState<number[]>([]);
  const [targetNumber, setTargetNumber] = useState<number | null>(null);
  const [targetHidden, setTargetHidden] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [turnStartedAt, setTurnStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentWrongTaps, setCurrentWrongTaps] = useState(0);
  const [results, setResults] = useState<TurnResult[]>([]);
  const [lastResult, setLastResult] = useState<TurnResult | null>(null);

  const currentPlayer = players[currentPlayerIndex] ?? null;
  const winner = useMemo(() => getWinner(players), [players]);

  /**
   * Keeps the live timer moving only while a turn is active.
   */
  useEffect(() => {
    if (phase !== "playing" || turnStartedAt === null) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - turnStartedAt);
    }, 80);

    return () => window.clearInterval(timer);
  }, [phase, turnStartedAt]);

  /**
   * Starts a player turn by flashing the target first,
   * then hiding it and starting the timer.
   */
  function startTurn(nextBoard: number[], nextTarget: number) {
    setBoard(nextBoard);
    setTargetNumber(nextTarget);
    setTargetHidden(false);
    setCurrentWrongTaps(0);
    setElapsedMs(0);
    setPhase("preview");

    window.setTimeout(() => {
      setTargetHidden(true);
      setTurnStartedAt(Date.now());
      setPhase("playing");
    }, config.flashDurationMs);
  }

  /**
   * Initializes the game from setup settings.
   */
  function handleStart(nextConfig: GameConfig) {
    const names = nextConfig.mode === "single" ? ["Player 1"] : playerNames;
    const nextPlayers = createPlayers(names);
    const nextBoard = generateBoard(nextConfig.boardSize);
    const nextTarget = generateTarget(nextBoard);

    setConfig(nextConfig);
    setPlayers(nextPlayers);
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setResults([]);
    setLastResult(null);
    setTurnStartedAt(null);

    startTurn(nextBoard, nextTarget);
  }

  /**
   * Handles number selection during active play.
   */
  function handleNumberSelect(value: number) {
    if (phase !== "playing" || targetNumber === null || currentPlayer === null || turnStartedAt === null) {
      return;
    }

    if (value !== targetNumber) {
      setCurrentWrongTaps((count) => count + 1);
      return;
    }

    const rawTimeMs = Date.now() - turnStartedAt;
    const result = createTurnResult({
      round: currentRound,
      player: currentPlayer,
      targetNumber,
      rawTimeMs,
      wrongTaps: currentWrongTaps,
      penaltySeconds: config.penaltySeconds,
    });

    setPlayers((currentPlayers) => applyTurnResultToPlayers(currentPlayers, result));
    setResults((currentResults) => [...currentResults, result]);
    setLastResult(result);
    setTurnStartedAt(null);
    setElapsedMs(result.finalTimeMs);
    setPhase("turnSummary");
  }

  /**
   * Advances to the next player, next round, or final result.
   */
  function continueGame() {
    const hasNextPlayer = currentPlayerIndex < players.length - 1;
    const hasNextRound = currentRound < config.totalRounds;

    if (hasNextPlayer) {
      const nextBoard = generateBoard(config.boardSize);
      const nextTarget = generateTarget(nextBoard);
      setCurrentPlayerIndex((index) => index + 1);
      startTurn(nextBoard, nextTarget);
      return;
    }

    if (hasNextRound) {
      const nextBoard = generateBoard(config.boardSize);
      const nextTarget = generateTarget(nextBoard);
      setCurrentRound((round) => round + 1);
      setCurrentPlayerIndex(0);
      startTurn(nextBoard, nextTarget);
      return;
    }

    setPhase("finished");
  }

  /**
   * Resets the full app back to the setup screen.
   */
  function resetGame() {
    setPhase("setup");
    setPlayers([]);
    setBoard([]);
    setTargetNumber(null);
    setTargetHidden(false);
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setTurnStartedAt(null);
    setElapsedMs(0);
    setCurrentWrongTaps(0);
    setResults([]);
    setLastResult(null);
  }

  if (phase === "setup") {
    return (
      <main className="app-shell">
        <StartScreen
          mode={mode}
          playerNames={mode === "single" ? ["Player 1"] : playerNames}
          totalRounds={totalRounds}
          difficulty={difficulty}
          penaltySeconds={penaltySeconds}
          onModeChange={setMode}
          onPlayerNamesChange={setPlayerNames}
          onTotalRoundsChange={setTotalRounds}
          onDifficultyChange={setDifficulty}
          onPenaltySecondsChange={setPenaltySeconds}
          onStart={handleStart}
        />
      </main>
    );
  }

  if (phase === "finished") {
    return (
      <main className="app-shell">
        <section className="game-panel p-3 h-100 d-flex flex-column">
          <div className="text-center mb-2">
            <h1 className="compact-title mb-1">Game Over</h1>
            <p className="text-muted-game compact-small mb-0">
              Winner: {winner?.name ?? "Nobody"}
            </p>
          </div>

          <div className="score-table-wrap flex-grow-1">
            <table className="table table-dark table-striped table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Total</th>
                  <th>Wrong</th>
                  <th>Turns</th>
                </tr>
              </thead>
              <tbody>
                {[...players]
                  .sort((first, second) => first.totalTimeMs - second.totalTimeMs)
                  .map((player) => (
                    <tr key={player.id}>
                      <td>{player.name}</td>
                      <td>{formatTime(player.totalTimeMs)}</td>
                      <td>{player.wrongTaps}</td>
                      <td>{player.completedTurns}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <button className="btn btn-primary mt-3 fw-bold" onClick={resetGame}>
            Play Again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="game-layout">
        <section className="game-panel p-2 d-flex justify-content-between align-items-center gap-2">
          <div>
            <div className="fw-bold">{currentPlayer?.name}</div>
            <div className="compact-small text-muted-game">
              Round {currentRound} / {config.totalRounds}
            </div>
          </div>

          <div className="text-end compact-small text-muted-game">
            Wrong taps: {currentWrongTaps}<br />
            Penalty: +{config.penaltySeconds}s
          </div>
        </section>

        <div className="row g-2 m-0">
          <div className="col-7 p-0 pe-1">
            <TargetDisplay targetNumber={targetNumber} hidden={targetHidden} />
          </div>
          <div className="col-5 p-0 ps-1">
            <Timer elapsedMs={elapsedMs} />
          </div>
        </div>

        <section className="game-panel board-wrap p-2">
          <NumberGrid numbers={board} onSelect={handleNumberSelect} />
        </section>

        <section className="game-panel p-2 text-center compact-small">
          {phase === "preview" && "Memorize the target..."}
          {phase === "playing" && "Find the hidden target number."}
          {phase === "turnSummary" && lastResult && (
            <div className="d-flex justify-content-between align-items-center gap-2">
              <span>
                {lastResult.playerName}: {formatTime(lastResult.finalTimeMs)}
              </span>
              <button className="btn btn-sm btn-primary fw-bold" onClick={continueGame}>
                Continue
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
