"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GameScreen from "@/components/GameScreen";
import ResultScreen from "@/components/ResultScreen";
import RoundSummary from "@/components/RoundSummary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createTurnResult, formatTime } from "@/engine/scoring";
import { LIVE_RACE_ROUND_TIMEOUT_MS, resolveLiveRaceTimeout } from "@/lib/liveRaceTimeout";
import {
  getCurrentOnlineRound,
  getOnlineBoard,
  onlinePlayersToGamePlayers,
  onlinePlayerToGamePlayer,
  onlineResultsToTurnResults,
  startNextOnlineRound,
  submitLiveRaceResult,
} from "@/lib/onlineRooms";
import type { GamePhase, TurnResult } from "@/types/game";
import type { OnlinePlayer, OnlineRoomSnapshot } from "@/types/online";

interface OnlineLiveRaceGameProps {
  snapshot: OnlineRoomSnapshot;
  localPlayer: OnlinePlayer;
  onRefresh: () => Promise<void>;
  onBackToLobby: () => void;
}

function WaitingCard({ title, description, children, onBack }: { title: string; description: string; children?: React.ReactNode; onBack: () => void }) {
  return (
    <main className="app-shell">
      <section className="flex h-full items-center justify-center px-2">
        <Card className="w-full max-w-xl overflow-hidden">
          <CardHeader className="border-b pb-4 text-center">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit">Live Race</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          {children && <CardContent className="p-4 sm:p-5">{children}</CardContent>}
          <CardFooter className="border-t p-4 sm:p-5">
            <Button variant="outline" onClick={onBack}>Back to Lobby</Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

export default function OnlineLiveRaceGame({ snapshot, localPlayer, onRefresh, onBackToLobby }: OnlineLiveRaceGameProps) {
  const wrongTapsRef = useRef(0);
  const timeoutCheckRef = useRef(0);
  const [now, setNow] = useState(Date.now());
  const [lastSelectedNumber, setLastSelectedNumber] = useState<number | null>(null);
  const [lastSelectionWasWrong, setLastSelectionWasWrong] = useState(false);
  const [currentWrongTaps, setCurrentWrongTaps] = useState(0);
  const [lastResult, setLastResult] = useState<TurnResult | null>(null);
  const [message, setMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [autoContinue, setAutoContinue] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const room = snapshot.room;
  const currentRound = getCurrentOnlineRound(snapshot);
  const gamePlayers = onlinePlayersToGamePlayers(snapshot.players);
  const gameResults = onlineResultsToTurnResults(snapshot.results);
  const gameCurrentPlayer = onlinePlayerToGamePlayer(localPlayer);
  const board = currentRound ? getOnlineBoard(currentRound.board_size, currentRound.seed) : [];
  const targetNumber = currentRound?.target_number ?? null;
  const roundStartAt = room.round_start_at ?? currentRound?.start_at ?? null;
  const roundStartMs = roundStartAt ? new Date(roundStartAt).getTime() : now;
  const countdownMs = Math.max(0, roundStartMs - now);
  const countdownSeconds = Math.ceil(countdownMs / 1000);
  const hasStarted = countdownMs <= 0;
  const isTimedOut = hasStarted && now - roundStartMs >= LIVE_RACE_ROUND_TIMEOUT_MS;
  const localRoundResult = snapshot.results.find((result) => {
    return result.round_number === room.current_round && result.player_id === localPlayer.id;
  });
  const roundResults = snapshot.results.filter((result) => result.round_number === room.current_round);
  const phase: GamePhase = hasStarted ? (localRoundResult ? "turnSummary" : "playing") : "preview";
  const elapsedMs = hasStarted ? (localRoundResult?.final_time_ms ?? Math.max(0, now - roundStartMs)) : 0;

  const liveStatus = useMemo(() => {
    if (!hasStarted) {
      return `Race starts in ${countdownSeconds}. Memorize the target.`;
    }

    if (localRoundResult) {
      return `You finished in ${formatTime(localRoundResult.final_time_ms)}. Waiting for the others.`;
    }

    if (isTimedOut) {
      return "This round timed out. Resolving unfinished players now.";
    }

    return "Go. Find the hidden target before everyone else does.";
  }, [countdownSeconds, hasStarted, isTimedOut, localRoundResult]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 80);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    wrongTapsRef.current = 0;
    timeoutCheckRef.current = 0;
    setCurrentWrongTaps(0);
    setLastSelectedNumber(null);
    setLastSelectionWasWrong(false);
    setLastResult(null);
    setMessage("");
  }, [room.current_round]);

  useEffect(() => {
    if (!isTimedOut || room.status !== "playing" || timeoutCheckRef.current === room.current_round) {
      return;
    }

    timeoutCheckRef.current = room.current_round;
    setMessage("Live Race timeout reached. Resolving the round so nobody is held hostage by one sleeping tab.");

    resolveLiveRaceTimeout(snapshot)
      .then((changed) => {
        if (changed) {
          return onRefresh();
        }

        return undefined;
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Could not resolve the live race timeout."));
  }, [isTimedOut, room.current_round, room.status, snapshot, onRefresh]);

  async function handleNumberSelect(value: number) {
    if (!hasStarted || isTimedOut || isSubmitting || localRoundResult || targetNumber === null || !currentRound) {
      return;
    }

    setLastSelectedNumber(value);

    if (value !== targetNumber) {
      wrongTapsRef.current += 1;
      setCurrentWrongTaps(wrongTapsRef.current);
      setLastSelectionWasWrong(true);
      setMessage(`${value} is wrong. ${room.settings.penaltySeconds} second penalty added.`);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(35);
      }
      return;
    }

    const rawTimeMs = Math.max(0, Date.now() - roundStartMs);
    const result = createTurnResult({
      round: room.current_round,
      player: onlinePlayerToGamePlayer(localPlayer),
      targetNumber,
      rawTimeMs,
      wrongTaps: wrongTapsRef.current,
      penaltySeconds: room.settings.penaltySeconds,
    });

    setIsSubmitting(true);
    setLastSelectionWasWrong(false);
    setLastResult(result);
    setMessage(`Finished in ${formatTime(result.finalTimeMs)}. Waiting for everyone else.`);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([15, 35, 15]);
    }

    try {
      await submitLiveRaceResult({ room, players: snapshot.players, result });
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit live race result.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNextRound() {
    try {
      await startNextOnlineRound(room, snapshot.players);
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start next live round.");
    }
  }

  async function handleFinishGame() {
    await onRefresh();
  }

  if (!currentRound || targetNumber === null) {
    return <WaitingCard title="Preparing Live Race" description="Waiting for the shared board and target to appear." onBack={onBackToLobby} />;
  }

  if (room.status === "round_summary") {
    if (localPlayer.is_host) {
      return (
        <main className="app-shell">
          <RoundSummary round={room.current_round} totalRounds={room.settings.totalRounds} players={gamePlayers} results={gameResults} onNextRound={handleNextRound} onFinishGame={handleFinishGame} />
          {message && <p className="sr-only" role="status">{message}</p>}
        </main>
      );
    }

    return (
      <WaitingCard title={`Round ${room.current_round} complete`} description="Waiting for the host to start the next live race." onBack={onBackToLobby}>
        <div className="rounded-xl border bg-muted/20 p-3 text-center text-sm text-muted-foreground">
          {roundResults.length} / {snapshot.players.length} players finished this round.
        </div>
      </WaitingCard>
    );
  }

  if (room.status === "finished") {
    return (
      <main className="app-shell">
        <ResultScreen players={gamePlayers} results={gameResults} bestScore={null} latestScore={null} isNewBest={false} onPlayAgain={onBackToLobby} />
      </main>
    );
  }

  if (localRoundResult) {
    return (
      <WaitingCard title="Result submitted" description="Your time is saved. Waiting for every player to finish this live race round." onBack={onBackToLobby}>
        <div className="grid gap-3 text-center">
          <div className="text-4xl font-semibold tracking-tight">{formatTime(localRoundResult.final_time_ms)}</div>
          <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
            {roundResults.length} / {snapshot.players.length} players finished.
          </div>
        </div>
      </WaitingCard>
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
      targetHidden={hasStarted}
      elapsedMs={elapsedMs}
      previewCountdown={countdownSeconds}
      currentWrongTaps={currentWrongTaps}
      lastSelectedNumber={lastSelectedNumber}
      lastSelectionWasWrong={lastSelectionWasWrong}
      lastResult={lastResult}
      statusMessage={message || liveStatus}
      isMuted={isMuted}
      autoContinue={autoContinue}
      boardScatterKey={currentRound ? `${currentRound.seed}-${room.current_round}` : room.current_round}
      onNumberSelect={handleNumberSelect}
      onContinue={onRefresh}
      onBackToSetup={onBackToLobby}
      onToggleMute={() => setIsMuted((current) => !current)}
      onToggleAutoContinue={() => setAutoContinue((current) => !current)}
    />
  );
}
