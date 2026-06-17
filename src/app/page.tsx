"use client";

import { useEffect, useRef, useState } from "react";
import NumberGrid from "@/components/NumberGrid";
import ResultScreen from "@/components/ResultScreen";
import RoundSummary from "@/components/RoundSummary";
import StartScreen from "@/components/StartScreen";
import TargetDisplay from "@/components/TargetDisplay";
import Timer from "@/components/Timer";
import { generateZigZagBoard } from "@/engine/board";
import { applyTurnResultToPlayers, createTurnResult, formatTime } from "@/engine/scoring";
import { generateTarget } from "@/engine/target";
import {
  createScoreSnapshot,
  getBestScore,
  loadGameSettings,
  saveBestScore,
  saveGameSettings,
  type SavedScore,
} from "@/lib/storage";
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
 * Builds one complete round board and target.
 * Every player in a multiplayer round gets this exact same board and target.
 */
function createRound(boardSize: number): { board: number[]; target: number } {
  const board = generateZigZagBoard(boardSize);
  return {
    board,
    target: generateTarget(board),
  };
}

/**
 * Main game controller for Blink & Find.
 */
export default function HomePage() {
  const previewTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

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
  const [previewCountdown, setPreviewCountdown] = useState(0);
  const [currentWrongTaps, setCurrentWrongTaps] = useState(0);
  const [lastSelectedNumber, setLastSelectedNumber] = useState<number | null>(null);
  const [lastSelectionWasWrong, setLastSelectionWasWrong] = useState(false);
  const [results, setResults] = useState<TurnResult[]>([]);
  const [lastResult, setLastResult] = useState<TurnResult | null>(null);
  const [bestScore, setBestScore] = useState<SavedScore | null>(null);
  const [latestScore, setLatestScore] = useState<SavedScore | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  const currentPlayer = players[currentPlayerIndex] ?? null;

  /**
   * Clears pending preview timers.
   */
  function clearPreviewTimers() {
    if (previewTimeoutRef.current !== null) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }

  /**
   * Loads saved setup choices and best score once the browser is ready.
   */
  useEffect(() => {
    const savedSettings = loadGameSettings();

    if (savedSettings) {
      setMode(savedSettings.mode);
      setPlayerNames(savedSettings.playerNames.length > 0 ? savedSettings.playerNames : ["Player 1", "Player 2"]);
      setTotalRounds(savedSettings.totalRounds);
      setDifficulty(savedSettings.difficulty);
      setPenaltySeconds(savedSettings.penaltySeconds);
    }

    setBestScore(getBestScore());

    return () => clearPreviewTimers();
  }, []);

  /**
   * Saves setup choices automatically. The browser gets a memory now. Dangerous times.
   */
  useEffect(() => {
    saveGameSettings({
      mode,
      playerNames,
      totalRounds,
      difficulty,
      penaltySeconds,
    });
  }, [mode, playerNames, totalRounds, difficulty, penaltySeconds]);

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
  function startTurn(nextBoard: number[], nextTarget: number, turnConfig: GameConfig = config) {
    clearPreviewTimers();

    const previewEndsAt = Date.now() + turnConfig.flashDurationMs;

    setBoard(nextBoard);
    setTargetNumber(nextTarget);
    setTargetHidden(false);
    setCurrentWrongTaps(0);
    setLastSelectedNumber(null);
    setLastSelectionWasWrong(false);
    setElapsedMs(0);
    setTurnStartedAt(null);
    setPreviewCountdown(Math.max(1, Math.ceil(turnConfig.flashDurationMs / 1000)));
    setPhase("preview");

    countdownIntervalRef.current = window.setInterval(() => {
      const remainingSeconds = Math.max(0, Math.ceil((previewEndsAt - Date.now()) / 1000));
      setPreviewCountdown(remainingSeconds);
    }, 100);

    previewTimeoutRef.current = window.setTimeout(() => {
      if (countdownIntervalRef.current !== null) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      previewTimeoutRef.current = null;
      setPreviewCountdown(0);
      setTargetHidden(true);
      setTurnStartedAt(Date.now());
      setPhase("playing");
    }, turnConfig.flashDurationMs);
  }

  /**
   * Initializes the game from setup settings.
   */
  function handleStart(nextConfig: GameConfig) {
    const safeConfig: GameConfig = {
      ...nextConfig,
      totalRounds: Math.max(1, Math.min(nextConfig.totalRounds, 20)),
      penaltySeconds: Math.max(0, Math.min(nextConfig.penaltySeconds, 10)),
    };
    const names = safeConfig.mode === "single" ? ["Player 1"] : playerNames;
    const nextPlayers = createPlayers(names);
    const firstRound = createRound(safeConfig.boardSize);

    setConfig(safeConfig);
    setPlayers(nextPlayers);
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setResults([]);
    setLastResult(null);
    setLatestScore(null);
    setIsNewBest(false);
    setTurnStartedAt(null);

    startTurn(firstRound.board, firstRound.target, safeConfig);
  }

  /**
   * Handles number selection during active play.
   */
  function handleNumberSelect(value: number) {
    if (phase !== "playing" || targetNumber === null || currentPlayer === null || turnStartedAt === null) {
      return;
    }

    setLastSelectedNumber(value);

    if (value !== targetNumber) {
      setLastSelectionWasWrong(true);
      setCurrentWrongTaps((count) => count + 1);
      return;
    }

    setLastSelectionWasWrong(false);

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
   * Continues inside the current round until all players have tried the same target.
   */
  function continueGame() {
    const hasNextPlayer = currentPlayerIndex < players.length - 1;

    if (hasNextPlayer && targetNumber !== null) {
      setCurrentPlayerIndex((index) => index + 1);
      startTurn(board, targetNumber);
      return;
    }

    setPhase("roundSummary");
  }

  /**
   * Starts the next round with a fresh board and a fresh target.
   */
  function startNextRound() {
    const nextRound = currentRound + 1;
    const next = createRound(config.boardSize);

    setCurrentRound(nextRound);
    setCurrentPlayerIndex(0);
    setLastResult(null);
    startTurn(next.board, next.target);
  }

  /**
   * Saves the finished game and opens the final results screen.
   */
  function finishGame() {
    const scoreSnapshot = createScoreSnapshot(config, players, results);
    const saveResult = saveBestScore(scoreSnapshot);

    setLatestScore(scoreSnapshot);
    setBestScore(saveResult.bestScore);
    setIsNewBest(saveResult.isNewBest);
    setPhase("finished");
  }

  /**
   * Resets the full app back to the setup screen.
   */
  function resetGame() {
    clearPreviewTimers();

    setPhase("setup");
    setPlayers([]);
    setBoard([]);
    setTargetNumber(null);
    setTargetHidden(false);
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setTurnStartedAt(null);
    setElapsedMs(0);
    setPreviewCountdown(0);
    setCurrentWrongTaps(0);
    setLastSelectedNumber(null);
    setLastSelectionWasWrong(false);
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

  if (phase === "roundSummary") {
    return (
      <main className="app-shell">
        <RoundSummary
          round={currentRound}
          totalRounds={config.totalRounds}
          players={players}
          results={results}
          onNextRound={startNextRound}
          onFinishGame={finishGame}
        />
      </main>
    );
  }

  if (phase === "finished") {
    return (
      <main className="app-shell">
        <ResultScreen
          players={players}
          results={results}
          bestScore={bestScore}
          latestScore={latestScore}
          isNewBest={isNewBest}
          onPlayAgain={resetGame}
        />
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
          <NumberGrid
            numbers={board}
            targetNumber={targetNumber}
            selectedNumber={lastSelectedNumber}
            isSelectionWrong={lastSelectionWasWrong}
            disabled={phase !== "playing"}
            onSelect={handleNumberSelect}
          />
        </section>

        <section className="game-panel p-2 text-center compact-small">
          {phase === "preview" && (
            <span>
              Memorize the target. Hiding in <span className="badge text-bg-light ms-1">{previewCountdown}</span>
            </span>
          )}
          {phase === "playing" && (
            <span>
              Find the hidden target number.
              {lastSelectionWasWrong && lastSelectedNumber !== null && (
                <span className="text-danger fw-bold ms-2">
                  {lastSelectedNumber} is wrong. +{config.penaltySeconds}s
                </span>
              )}
            </span>
          )}
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
