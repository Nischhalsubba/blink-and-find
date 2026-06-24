"use client";

import { useEffect, useRef, useState } from "react";
import { generateCustomZigZagBoard } from "@/engine/board";
import { applyTurnResultToPlayers, createTurnResult } from "@/engine/scoring";
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
  customNumbers: [],
};

type FeedbackTone = "target" | "wrong" | "correct" | "round" | "finish";

function createPlayers(names: string[]): Player[] {
  return names.map((name, index) => ({
    id: `player-${index + 1}`,
    name: name.trim() || `Player ${index + 1}`,
    totalTimeMs: 0,
    wrongTaps: 0,
    completedTurns: 0,
  }));
}

function normalizeCustomNumbers(numbers: number[], boardSize: number): number[] {
  const seen = new Set<number>();

  return numbers
    .filter((value) => Number.isInteger(value) && value > 0)
    .filter((value) => {
      if (seen.has(value)) {
        return false;
      }

      seen.add(value);
      return true;
    })
    .slice(0, Math.max(0, boardSize));
}

function createRound(boardSize: number, customNumbers: number[] = []): { board: number[]; target: number } {
  const requiredNumbers = normalizeCustomNumbers(customNumbers, boardSize);
  const board = generateCustomZigZagBoard(boardSize, requiredNumbers);
  return {
    board,
    target: generateTarget(board),
  };
}

function playTone(kind: FeedbackTone, muted: boolean) {
  if (muted || typeof window === "undefined") {
    return;
  }

  const AudioContextConstructor = window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextConstructor) {
    return;
  }

  try {
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const toneMap: Record<FeedbackTone, number> = {
      target: 520,
      wrong: 180,
      correct: 720,
      round: 440,
      finish: 880,
    };

    oscillator.frequency.value = toneMap[kind];
    oscillator.type = kind === "wrong" ? "square" : "sine";
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.14);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.16);
  } catch {
    // Audio is optional feedback. The game should not fail because a browser is being dramatic.
  }
}

function vibrate(pattern: VibratePattern) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export function useGameController() {
  const previewTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const autoContinueTimeoutRef = useRef<number | null>(null);
  const wrongTapsRef = useRef(0);

  const [mode, setMode] = useState<GameMode>("multiplayer");
  const [playerNames, setPlayerNames] = useState<string[]>(["Player 1", "Player 2"]);
  const [totalRounds, setTotalRounds] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [penaltySeconds, setPenaltySeconds] = useState(3);
  const [customNumbersInput, setCustomNumbersInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [autoContinue, setAutoContinue] = useState(true);

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
  const [statusMessage, setStatusMessage] = useState("Set up the game to begin.");
  const [results, setResults] = useState<TurnResult[]>([]);
  const [lastResult, setLastResult] = useState<TurnResult | null>(null);
  const [bestScore, setBestScore] = useState<SavedScore | null>(null);
  const [latestScore, setLatestScore] = useState<SavedScore | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  const currentPlayer = players[currentPlayerIndex] ?? null;

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

  function clearAutoContinueTimer() {
    if (autoContinueTimeoutRef.current !== null) {
      window.clearTimeout(autoContinueTimeoutRef.current);
      autoContinueTimeoutRef.current = null;
    }
  }

  useEffect(() => {
    const savedSettings = loadGameSettings();

    if (savedSettings) {
      setMode(savedSettings.mode);
      setPlayerNames(savedSettings.playerNames.length > 0 ? savedSettings.playerNames : ["Player 1", "Player 2"]);
      setTotalRounds(savedSettings.totalRounds);
      setDifficulty(savedSettings.difficulty);
      setPenaltySeconds(savedSettings.penaltySeconds);
      setCustomNumbersInput(savedSettings.customNumbersInput ?? "");
      setIsMuted(Boolean(savedSettings.isMuted));
      setAutoContinue(savedSettings.autoContinue ?? true);
    }

    setBestScore(getBestScore());

    return () => {
      clearPreviewTimers();
      clearAutoContinueTimer();
    };
  }, []);

  useEffect(() => {
    saveGameSettings({
      mode,
      playerNames,
      totalRounds,
      difficulty,
      penaltySeconds,
      customNumbersInput,
      isMuted,
      autoContinue,
    });
  }, [mode, playerNames, totalRounds, difficulty, penaltySeconds, customNumbersInput, isMuted, autoContinue]);

  useEffect(() => {
    if (phase !== "playing" || turnStartedAt === null) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - turnStartedAt);
    }, 80);

    return () => window.clearInterval(timer);
  }, [phase, turnStartedAt]);

  function prepareTurn(nextBoard: number[], nextTarget: number) {
    clearPreviewTimers();
    clearAutoContinueTimer();
    wrongTapsRef.current = 0;

    setBoard(nextBoard);
    setTargetNumber(nextTarget);
    setTargetHidden(false);
    setCurrentWrongTaps(0);
    setLastSelectedNumber(null);
    setLastSelectionWasWrong(false);
    setElapsedMs(0);
    setPreviewCountdown(0);
    setTurnStartedAt(null);
    setStatusMessage("Ready for the next player.");
    setPhase("ready");
  }

  function startTurn(nextBoard: number[], nextTarget: number, turnConfig: GameConfig = config) {
    clearPreviewTimers();
    clearAutoContinueTimer();
    wrongTapsRef.current = 0;

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
    setStatusMessage(`Memorize target ${nextTarget}.`);
    setPhase("preview");
    playTone("target", isMuted);

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
      setStatusMessage("Target hidden. Find it on the board.");
      setPhase("playing");
    }, turnConfig.flashDurationMs);
  }

  function startPreparedTurn() {
    if (targetNumber === null) {
      return;
    }

    startTurn(board, targetNumber);
  }

  function handleStart(nextConfig: GameConfig) {
    const safeConfig: GameConfig = {
      ...nextConfig,
      totalRounds: Math.max(1, Math.min(nextConfig.totalRounds, 20)),
      penaltySeconds: Math.max(0, Math.min(nextConfig.penaltySeconds, 10)),
      customNumbers: normalizeCustomNumbers(nextConfig.customNumbers ?? [], nextConfig.boardSize),
    };
    const names = safeConfig.mode === "single" ? ["Player 1"] : playerNames;
    const nextPlayers = createPlayers(names);
    const firstRound = createRound(safeConfig.boardSize, safeConfig.customNumbers);

    setConfig(safeConfig);
    setPlayers(nextPlayers);
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setResults([]);
    setLastResult(null);
    setLatestScore(null);
    setIsNewBest(false);
    setTurnStartedAt(null);

    prepareTurn(firstRound.board, firstRound.target);
  }

  function handleNumberSelect(value: number) {
    if (phase !== "playing" || targetNumber === null || currentPlayer === null || turnStartedAt === null) {
      return;
    }

    setLastSelectedNumber(value);

    if (value !== targetNumber) {
      wrongTapsRef.current += 1;
      setLastSelectionWasWrong(true);
      setCurrentWrongTaps(wrongTapsRef.current);
      setStatusMessage(`${value} is wrong. ${config.penaltySeconds} second penalty added.`);
      playTone("wrong", isMuted);
      vibrate(35);
      return;
    }

    setLastSelectionWasWrong(false);

    const rawTimeMs = Date.now() - turnStartedAt;
    const result = createTurnResult({
      round: currentRound,
      player: currentPlayer,
      targetNumber,
      rawTimeMs,
      wrongTaps: wrongTapsRef.current,
      penaltySeconds: config.penaltySeconds,
    });

    setPlayers((currentPlayers) => applyTurnResultToPlayers(currentPlayers, result));
    setResults((currentResults) => [...currentResults, result]);
    setLastResult(result);
    setTurnStartedAt(null);
    setElapsedMs(result.finalTimeMs);
    setStatusMessage(`Correct. ${currentPlayer.name} finished in ${(result.finalTimeMs / 1000).toFixed(2)} seconds.`);
    setPhase("turnSummary");
    playTone("correct", isMuted);
    vibrate([15, 35, 15]);
  }

  function continueGame() {
    clearAutoContinueTimer();
    const hasNextPlayer = currentPlayerIndex < players.length - 1;

    if (hasNextPlayer && targetNumber !== null) {
      setCurrentPlayerIndex((index) => index + 1);
      prepareTurn(board, targetNumber);
      return;
    }

    setStatusMessage(`Round ${currentRound} complete.`);
    setPhase("roundSummary");
    playTone("round", isMuted);
  }

  useEffect(() => {
    if (phase !== "turnSummary" || !autoContinue || lastResult === null) {
      return;
    }

    autoContinueTimeoutRef.current = window.setTimeout(() => {
      continueGame();
    }, 900);

    return () => clearAutoContinueTimer();
  }, [phase, autoContinue, lastResult, currentPlayerIndex, players.length, targetNumber, board]);

  function startNextRound() {
    const nextRound = currentRound + 1;
    const next = createRound(config.boardSize, config.customNumbers);

    setCurrentRound(nextRound);
    setCurrentPlayerIndex(0);
    setLastResult(null);
    prepareTurn(next.board, next.target);
  }

  function finishGame() {
    const scoreSnapshot = createScoreSnapshot(config, players, results);
    const saveResult = saveBestScore(scoreSnapshot);

    setLatestScore(scoreSnapshot);
    setBestScore(saveResult.bestScore);
    setIsNewBest(saveResult.isNewBest);
    setStatusMessage("Game finished. Results are ready.");
    setPhase("finished");
    playTone("finish", isMuted);
  }

  function resetGame() {
    clearPreviewTimers();
    clearAutoContinueTimer();
    wrongTapsRef.current = 0;

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
    setStatusMessage("Set up the game to begin.");
    setResults([]);
    setLastResult(null);
  }

  function toggleMute() {
    setIsMuted((current) => !current);
  }

  function toggleAutoContinue() {
    setAutoContinue((current) => !current);
  }

  return {
    mode,
    playerNames,
    totalRounds,
    difficulty,
    penaltySeconds,
    customNumbersInput,
    setMode,
    setPlayerNames,
    setTotalRounds,
    setDifficulty,
    setPenaltySeconds,
    setCustomNumbersInput,
    config,
    phase,
    players,
    board,
    targetNumber,
    targetHidden,
    currentRound,
    currentPlayerIndex,
    elapsedMs,
    previewCountdown,
    currentWrongTaps,
    lastSelectedNumber,
    lastSelectionWasWrong,
    statusMessage,
    results,
    lastResult,
    bestScore,
    latestScore,
    isNewBest,
    currentPlayer,
    isMuted,
    autoContinue,
    handleStart,
    startPreparedTurn,
    handleNumberSelect,
    continueGame,
    startNextRound,
    finishGame,
    resetGame,
    toggleMute,
    toggleAutoContinue,
  };
}
