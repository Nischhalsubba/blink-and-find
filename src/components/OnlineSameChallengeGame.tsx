"use client";

import { useEffect, useRef, useState } from "react";
import GameScreen from "@/components/GameScreen";
import ReadyScreen from "@/components/ReadyScreen";
import ResultScreen from "@/components/ResultScreen";
import RoundSummary from "@/components/RoundSummary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createTurnResult } from "@/engine/scoring";
import {
  getCurrentOnlineRound,
  getOnlineBoard,
  markSameChallengeTurnPlaying,
  onlinePlayersToGamePlayers,
  onlinePlayerToGamePlayer,
  onlineResultsToTurnResults,
  startNextOnlineRound,
  submitSameChallengeResult,
} from "@/lib/onlineRooms";
import type { GamePhase, TurnResult } from "@/types/game";
import type { OnlinePlayer, OnlineRoomSnapshot } from "@/types/online";

interface OnlineSameChallengeGameProps {
  snapshot: OnlineRoomSnapshot;
  localPlayer: OnlinePlayer;
  onRefresh: () => Promise<void>;
  onBackToLobby: () => void;
}

function WaitingCard({ title, description, onBack }: { title: string; description: string; onBack: () => void }) {
  return (
    <main className="app-shell">
      <section className="flex h-full items-center justify-center px-2">
        <Card className="w-full max-w-xl overflow-hidden">
          <CardHeader className="border-b pb-4">
            <Badge variant="secondary" className="mb-3 w-fit">Online Room</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 text-sm text-muted-foreground sm:p-5" role="status" aria-live="polite">
            This screen updates automatically when the room changes.
          </CardContent>
          <CardFooter className="border-t p-4 sm:p-5">
            <Button variant="outline" onClick={onBack}>Back to Lobby</Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

/**
 * Online Same Challenge gameplay.
 * Each player gets the same board and target, but plays on their own device in turn order.
 */
export default function OnlineSameChallengeGame({
  snapshot,
  localPlayer,
  onRefresh,
  onBackToLobby,
}: OnlineSameChallengeGameProps) {
  const previewTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const wrongTapsRef = useRef(0);

  const [phase, setPhase] = useState<GamePhase>("ready");
  const [targetHidden, setTargetHidden] = useState(false);
  const [turnStartedAt, setTurnStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [previewCountdown, setPreviewCountdown] = useState(0);
  const [currentWrongTaps, setCurrentWrongTaps] = useState(0);
  const [lastSelectedNumber, setLastSelectedNumber] = useState<number | null>(null);
  const [lastSelectionWasWrong, setLastSelectionWasWrong] = useState(false);
  const [lastResult, setLastResult] = useState<TurnResult | null>(null);
  const [statusMessage, setStatusMessage] = useState("Ready when you are.");
  const [isMuted, setIsMuted] = useState(false);
  const [autoContinue, setAutoContinue] = useState(true);
  const [message, setMessage] = useState("");

  const room = snapshot.room;
  const currentRound = getCurrentOnlineRound(snapshot);
  const activePlayer = snapshot.players.find((player) => player.id === room.current_player_id) ?? null;
  const localIsActive = activePlayer?.id === localPlayer.id;
  const gamePlayers = onlinePlayersToGamePlayers(snapshot.players);
  const gameResults = onlineResultsToTurnResults(snapshot.results);
  const gameCurrentPlayer = activePlayer ? onlinePlayerToGamePlayer(activePlayer) : null;
  const board = currentRound ? getOnlineBoard(currentRound.board_size, currentRound.seed) : [];
  const targetNumber = currentRound?.target_number ?? null;

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

  useEffect(() => {
    return () => clearPreviewTimers();
  }, []);

  useEffect(() => {
    clearPreviewTimers();
    wrongTapsRef.current = 0;
    setPhase("ready");
    setTargetHidden(false);
    setTurnStartedAt(null);
    setElapsedMs(0);
    setPreviewCountdown(0);
    setCurrentWrongTaps(0);
    setLastSelectedNumber(null);
    setLastSelectionWasWrong(false);
    setLastResult(null);
    setStatusMessage(localIsActive ? "Your turn. Get ready." : "Waiting for the active player.");
  }, [room.current_player_id, room.current_round, localIsActive]);

  useEffect(() => {
    if (phase !== "playing" || turnStartedAt === null) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - turnStartedAt);
    }, 80);

    return () => window.clearInterval(timer);
  }, [phase, turnStartedAt]);

  async function startTurn() {
    if (!currentRound || targetNumber === null) {
      return;
    }

    clearPreviewTimers();
    wrongTapsRef.current = 0;

    setMessage("");
    setPhase("preview");
    setTargetHidden(false);
    setTurnStartedAt(null);
    setElapsedMs(0);
    setPreviewCountdown(Math.max(1, Math.ceil(room.settings.flashDurationMs / 1000)));
    setCurrentWrongTaps(0);
    setLastSelectedNumber(null);
    setLastSelectionWasWrong(false);
    setStatusMessage(`Memorize target ${targetNumber}.`);

    try {
      await markSameChallengeTurnPlaying(room.id, currentRound.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start online turn.");
    }

    const previewEndsAt = Date.now() + room.settings.flashDurationMs;

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
      setStatusMessage("Target hidden. Find it on the shared board.");
      setPhase("playing");
    }, room.settings.flashDurationMs);
  }

  async function handleNumberSelect(value: number) {
    if (phase !== "playing" || targetNumber === null || turnStartedAt === null || !activePlayer) {
      return;
    }

    setLastSelectedNumber(value);

    if (value !== targetNumber) {
      wrongTapsRef.current += 1;
      setCurrentWrongTaps(wrongTapsRef.current);
      setLastSelectionWasWrong(true);
      setStatusMessage(`${value} is wrong. ${room.settings.penaltySeconds} second penalty added.`);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(35);
      }
      return;
    }

    const rawTimeMs = Date.now() - turnStartedAt;
    const result = createTurnResult({
      round: room.current_round,
      player: onlinePlayerToGamePlayer(activePlayer),
      targetNumber,
      rawTimeMs,
      wrongTaps: wrongTapsRef.current,
      penaltySeconds: room.settings.penaltySeconds,
    });

    clearPreviewTimers();
    setLastSelectionWasWrong(false);
    setTurnStartedAt(null);
    setElapsedMs(result.finalTimeMs);
    setLastResult(result);
    setStatusMessage(`Correct. ${activePlayer.name} finished this turn.`);
    setPhase("turnSummary");

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([15, 35, 15]);
    }

    try {
      await submitSameChallengeResult({ room, players: snapshot.players, result });
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit online result.");
    }
  }

  async function handleNextRound() {
    setMessage("");

    try {
      await startNextOnlineRound(room, snapshot.players);
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start next online round.");
    }
  }

  if (!currentRound && room.status !== "lobby") {
    return (
      <WaitingCard
        title="Preparing online round"
        description="The host has started the room. Waiting for the round to appear. Yes, distributed state is needy."
        onBack={onBackToLobby}
      />
    );
  }

  if (room.status === "round_summary") {
    if (localPlayer.is_host) {
      return (
        <main className="app-shell">
          <RoundSummary
            round={room.current_round}
            totalRounds={room.settings.totalRounds}
            players={gamePlayers}
            results={gameResults}
            onNextRound={handleNextRound}
            onFinishGame={onRefresh}
          />
          {message && <p className="sr-only" role="status">{message}</p>}
        </main>
      );
    }

    return (
      <WaitingCard
        title={`Round ${room.current_round} complete`}
        description="Waiting for the host to start the next round. Power corrupts, even tiny host buttons."
        onBack={onBackToLobby}
      />
    );
  }

  if (room.status === "finished") {
    return (
      <main className="app-shell">
        <ResultScreen
          players={gamePlayers}
          results={gameResults}
          bestScore={null}
          latestScore={null}
          isNewBest={false}
          onPlayAgain={onBackToLobby}
        />
      </main>
    );
  }

  if (!localIsActive) {
    return (
      <WaitingCard
        title={`Waiting for ${activePlayer?.name ?? "next player"}`}
        description="They are playing the same board and target on their own device. Your turn is coming."
        onBack={onBackToLobby}
      />
    );
  }

  if (phase === "ready" && room.status !== "playing") {
    return (
      <main className="app-shell">
        <ReadyScreen
          player={gameCurrentPlayer}
          round={room.current_round}
          totalPlayers={snapshot.players.length}
          playerIndex={snapshot.players.findIndex((player) => player.id === activePlayer?.id)}
          config={room.settings}
          onStartTurn={startTurn}
          onBackToSetup={onBackToLobby}
        />
      </main>
    );
  }

  return (
    <GameScreen
      phase={phase}
      config={room.settings}
      currentPlayer={gameCurrentPlayer}
      currentRound={room.current_round}
      board={board}
      targetNumber={targetNumber}
      targetHidden={targetHidden}
      elapsedMs={elapsedMs}
      previewCountdown={previewCountdown}
      currentWrongTaps={currentWrongTaps}
      lastSelectedNumber={lastSelectedNumber}
      lastSelectionWasWrong={lastSelectionWasWrong}
      lastResult={lastResult}
      statusMessage={message || statusMessage}
      isMuted={isMuted}
      autoContinue={autoContinue}
      onNumberSelect={handleNumberSelect}
      onContinue={onRefresh}
      onBackToSetup={onBackToLobby}
      onToggleMute={() => setIsMuted((current) => !current)}
      onToggleAutoContinue={() => setAutoContinue((current) => !current)}
    />
  );
}
