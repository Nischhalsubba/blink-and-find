"use client";

import { useEffect, useRef, useState } from "react";
import GameScreen from "@/components/GameScreen";
import NumberGrid from "@/components/NumberGrid";
import ReadyScreen from "@/components/ReadyScreen";
import RoundSummary from "@/components/RoundSummary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createTurnResult, formatTime } from "@/engine/scoring";
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
import { endOnlineRoom, finishOnlineRoom } from "@/lib/onlineRoomStatus";
import type { GamePhase, TurnResult } from "@/types/game";
import type { OnlinePlayer, OnlineRoomSnapshot } from "@/types/online";

const MAX_VISIBLE_FEED_PLAYERS = 24;

interface OnlineSameChallengeGameProps {
  snapshot: OnlineRoomSnapshot;
  localPlayer: OnlinePlayer;
  onRefresh: () => Promise<void>;
  onBackToLobby: () => void;
  onEndRoom?: () => void;
}

function getRoomParticipants(snapshot: OnlineRoomSnapshot, localPlayer: OnlinePlayer) {
  const connectedPlayers = snapshot.players.filter((player) => player.is_connected || player.is_host || player.id === localPlayer.id);
  const participants = connectedPlayers.length > 0 ? connectedPlayers : snapshot.players;
  return [...participants].sort((a, b) => a.joined_at.localeCompare(b.joined_at));
}

function WaitingCard({
  title,
  description,
  onBack,
  onEndRoom,
  canEndRoom,
}: {
  title: string;
  description: string;
  onBack: () => void;
  onEndRoom: () => void;
  canEndRoom: boolean;
}) {
  return (
    <main className="app-shell">
      <section className="flex h-full items-center justify-center px-2">
        <Card className="w-full max-w-xl overflow-hidden rounded-[1.5rem]">
          <CardHeader className="border-b pb-4">
            <Badge variant="secondary" className="mb-3 w-fit">Online Room</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 text-sm text-muted-foreground sm:p-5" role="status" aria-live="polite">
            Waiting for the first shared board to be created.
          </CardContent>
          <CardFooter className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-between sm:p-5">
            <Button variant="outline" onClick={onBack}>Leave Room</Button>
            {canEndRoom && <Button variant="destructive" onClick={onEndRoom}>End Room</Button>}
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

function getRoundResult(snapshot: OnlineRoomSnapshot, playerId: string) {
  return snapshot.results.find((result) => result.round_number === snapshot.room.current_round && result.player_id === playerId) ?? null;
}

function getLiveElapsedMs(snapshot: OnlineRoomSnapshot, liveNow: number) {
  const round = getCurrentOnlineRound(snapshot);
  if (snapshot.room.status !== "playing" || !round?.start_at) {
    return 0;
  }

  return Math.max(0, liveNow - Date.parse(round.start_at));
}

function selectVisibleFeedPlayers(players: OnlinePlayer[], activePlayer: OnlinePlayer | null) {
  const visible = players.slice(0, MAX_VISIBLE_FEED_PLAYERS - 1);

  if (activePlayer && !visible.some((player) => player.id === activePlayer.id)) {
    visible.push(activePlayer);
  } else if (players[MAX_VISIBLE_FEED_PLAYERS - 1]) {
    visible.push(players[MAX_VISIBLE_FEED_PLAYERS - 1]);
  }

  return visible.slice(0, MAX_VISIBLE_FEED_PLAYERS);
}

function LiveRoomPanel({
  snapshot,
  players,
  activePlayer,
  liveNow,
}: {
  snapshot: OnlineRoomSnapshot;
  players: OnlinePlayer[];
  activePlayer: OnlinePlayer | null;
  liveNow: number;
}) {
  const liveElapsedMs = getLiveElapsedMs(snapshot, liveNow);
  const completedPlayerIds = new Set(
    snapshot.results
      .filter((result) => result.round_number === snapshot.room.current_round)
      .map((result) => result.player_id)
  );
  const completedThisRound = players.filter((player) => completedPlayerIds.has(player.id)).length;
  const visiblePlayers = selectVisibleFeedPlayers(players, activePlayer);
  const hiddenCount = Math.max(0, players.length - visiblePlayers.length);

  return (
    <Card className="soft-panel online-live-panel py-0">
      <CardContent className="grid gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-black text-slate-950">Live room feed</div>
            <div className="text-xs text-muted-foreground">
              {activePlayer ? `${activePlayer.name} is ${snapshot.room.status === "playing" ? "playing" : "getting ready"}` : "Round is moving automatically"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">Round {snapshot.room.current_round}/{snapshot.room.settings.totalRounds}</Badge>
            <Badge variant="secondary">{completedThisRound}/{players.length} done</Badge>
            {snapshot.room.status === "playing" && <Badge variant="outline">Live {formatTime(liveElapsedMs)}</Badge>}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {visiblePlayers.map((player) => {
            const roundResult = getRoundResult(snapshot, player.id);
            const isActive = activePlayer?.id === player.id;
            const liveTotal = player.total_time_ms + (isActive && snapshot.room.status === "playing" ? liveElapsedMs : 0);
            const statusLabel = roundResult
              ? `Finished ${formatTime(roundResult.final_time_ms)}`
              : isActive
                ? snapshot.room.status === "playing" ? `Playing ${formatTime(liveElapsedMs)}` : "Preparing"
                : "Waiting";

            return (
              <div key={player.id} className={`rounded-2xl border p-3 text-sm ${isActive ? "border-primary/60 bg-primary/10" : "bg-white/70"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 font-black text-slate-950">
                    <span className="truncate">{player.name}</span>
                  </div>
                  <Badge variant={roundResult ? "default" : isActive ? "secondary" : "outline"}>{statusLabel}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span>Total {formatTime(liveTotal)}</span>
                  <span>Wrong {player.wrong_taps + (roundResult?.wrong_taps ?? 0)}</span>
                  <span>{player.is_connected ? "Live" : "Away"}</span>
                </div>
              </div>
            );
          })}
        </div>

        {hiddenCount > 0 && (
          <div className="rounded-2xl border bg-white/70 p-3 text-center text-xs font-bold text-muted-foreground">
            +{hiddenCount} more player{hiddenCount === 1 ? "" : "s"} in this room. Showing a compact feed so the page stays fast.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DisabledBoardView({
  snapshot,
  players,
  localPlayer,
  board,
  activePlayer,
  liveNow,
  onLeave,
  onEndRoom,
}: {
  snapshot: OnlineRoomSnapshot;
  players: OnlinePlayer[];
  localPlayer: OnlinePlayer;
  board: number[];
  activePlayer: OnlinePlayer | null;
  liveNow: number;
  onLeave: () => void;
  onEndRoom: () => void;
}) {
  const isHost = localPlayer.is_host;
  const activeCopy = activePlayer
    ? `${activePlayer.name} is ${snapshot.room.status === "playing" ? "playing now" : "getting ready"}`
    : "Round is advancing";

  return (
    <main className="app-shell">
      <div className="game-play-shell online-watch-shell">
        <Card className="glass-panel game-play-topbar py-0">
          <CardContent className="grid gap-3 p-3 sm:flex sm:items-center sm:justify-between sm:p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">Watching</Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">Round {snapshot.room.current_round}/{snapshot.room.settings.totalRounds}</Badge>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950 sm:text-3xl">{activeCopy}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Your board is locked while another player takes their turn. The next round starts automatically when everyone finishes.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button variant="outline" className="rounded-2xl" onClick={onLeave}>Leave Room</Button>
              {isHost && <Button variant="destructive" className="rounded-2xl" onClick={onEndRoom}>End Room</Button>}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel game-play-board-card online-watch-board py-0">
          <CardContent className="relative flex h-full min-h-0 flex-col items-center justify-center gap-2 p-2 sm:p-4">
            <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full border bg-white/90 px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
              Board disabled
            </div>
            <NumberGrid numbers={board} targetNumber={null} selectedNumber={null} isSelectionWrong={false} scatterKey={`${snapshot.room.id}-${snapshot.room.current_round}`} disabled />
          </CardContent>
        </Card>

        <LiveRoomPanel snapshot={snapshot} players={players} activePlayer={activePlayer} liveNow={liveNow} />
      </div>
    </main>
  );
}

export default function OnlineSameChallengeGame({ snapshot, localPlayer, onRefresh, onBackToLobby, onEndRoom }: OnlineSameChallengeGameProps) {
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
  const [liveNow, setLiveNow] = useState(Date.now());

  const room = snapshot.room;
  const roomParticipants = getRoomParticipants(snapshot, localPlayer);
  const currentRound = getCurrentOnlineRound(snapshot);
  const activePlayer = roomParticipants.find((player) => player.id === room.current_player_id) ?? null;
  const localIsActive = activePlayer?.id === localPlayer.id;
  const localIsHost = localPlayer.is_host;
  const gamePlayers = onlinePlayersToGamePlayers(roomParticipants);
  const gameResults = onlineResultsToTurnResults(snapshot.results);
  const gameCurrentPlayer = activePlayer ? onlinePlayerToGamePlayer(activePlayer) : null;
  const board = currentRound ? getOnlineBoard(room.settings, currentRound.seed) : [];
  const targetNumber = currentRound?.target_number ?? null;

  async function handleEndRoom() {
    if (!localIsHost) {
      onBackToLobby();
      return;
    }

    if (onEndRoom) {
      onEndRoom();
      return;
    }

    try {
      await endOnlineRoom(room.id);
      onBackToLobby();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not end room.");
    }
  }

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

  useEffect(() => () => clearPreviewTimers(), []);

  useEffect(() => {
    const timer = window.setInterval(() => setLiveNow(Date.now()), 500);
    return () => window.clearInterval(timer);
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
    setStatusMessage(localIsActive ? "Your turn. Get ready." : "Watching the active player.");
  }, [room.current_player_id, room.current_round, localIsActive]);

  useEffect(() => {
    if (phase !== "playing" || turnStartedAt === null) return;
    const timer = window.setInterval(() => setElapsedMs(Date.now() - turnStartedAt), 80);
    return () => window.clearInterval(timer);
  }, [phase, turnStartedAt]);

  useEffect(() => {
    if (phase !== "turnSummary") return;
    const timer = window.setInterval(() => {
      void onRefresh();
    }, 700);
    return () => window.clearInterval(timer);
  }, [phase, onRefresh]);

  async function startTurn() {
    if (!currentRound || targetNumber === null) return;
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
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start online turn.");
    }

    const previewEndsAt = Date.now() + room.settings.flashDurationMs;
    countdownIntervalRef.current = window.setInterval(() => setPreviewCountdown(Math.max(0, Math.ceil((previewEndsAt - Date.now()) / 1000))), 100);
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
    if (phase !== "playing" || targetNumber === null || turnStartedAt === null || !activePlayer) return;
    setLastSelectedNumber(value);
    if (value !== targetNumber) {
      wrongTapsRef.current += 1;
      setCurrentWrongTaps(wrongTapsRef.current);
      setLastSelectionWasWrong(true);
      setStatusMessage(`${value} is wrong. ${room.settings.penaltySeconds} second penalty added.`);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(35);
      return;
    }

    const result = createTurnResult({ round: room.current_round, player: onlinePlayerToGamePlayer(activePlayer), targetNumber, rawTimeMs: Date.now() - turnStartedAt, wrongTaps: wrongTapsRef.current, penaltySeconds: room.settings.penaltySeconds });

    setLastSelectionWasWrong(false);
    setLastResult(result);
    setElapsedMs(result.finalTimeMs);
    setTurnStartedAt(null);
    setStatusMessage(`Correct. ${activePlayer.name} finished in ${(result.finalTimeMs / 1000).toFixed(2)} seconds. Syncing next turn...`);
    setPhase("turnSummary");

    try {
      await submitSameChallengeResult({ room, players: snapshot.players, result });
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit result.");
    }
  }

  async function nextRound() {
    if (!localIsHost) return;
    try { await startNextOnlineRound(room, roomParticipants); await onRefresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not start next round."); }
  }

  async function finishRoom() {
    if (!localIsHost) return;
    try { await finishOnlineRoom(room); await onRefresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not finish room."); }
  }

  if (!currentRound) return <WaitingCard title="Waiting for round" description="The host has not started the first round yet." onBack={onBackToLobby} onEndRoom={handleEndRoom} canEndRoom={localIsHost} />;

  if (!localIsActive) {
    return <DisabledBoardView snapshot={snapshot} players={roomParticipants} localPlayer={localPlayer} board={board} activePlayer={room.status === "round_summary" ? null : activePlayer} liveNow={liveNow} onLeave={onBackToLobby} onEndRoom={handleEndRoom} />;
  }

  if (room.status === "round_summary") {
    if (!localIsHost) {
      return <DisabledBoardView snapshot={snapshot} players={roomParticipants} localPlayer={localPlayer} board={board} activePlayer={null} liveNow={liveNow} onLeave={onBackToLobby} onEndRoom={handleEndRoom} />;
    }
    return <RoundSummary round={room.current_round} totalRounds={room.settings.totalRounds} players={gamePlayers} results={gameResults} onNextRound={nextRound} onFinishGame={finishRoom} />;
  }

  if (phase === "ready") {
    return <ReadyScreen player={gameCurrentPlayer} round={room.current_round} totalPlayers={roomParticipants.length} playerIndex={roomParticipants.findIndex((player) => player.id === activePlayer?.id)} config={room.settings} onStartTurn={startTurn} onBackToSetup={localIsHost ? handleEndRoom : onBackToLobby} backLabel={localIsHost ? "End Room" : "Leave Room"} />;
  }

  return <GameScreen phase={phase} config={room.settings} currentPlayer={gameCurrentPlayer} currentRound={room.current_round} board={board} targetNumber={targetNumber} targetHidden={phase === "turnSummary" ? true : targetHidden} elapsedMs={elapsedMs} previewCountdown={phase === "turnSummary" ? 0 : previewCountdown} currentWrongTaps={currentWrongTaps} lastSelectedNumber={lastSelectedNumber} lastSelectionWasWrong={lastSelectionWasWrong} lastResult={lastResult} statusMessage={message || statusMessage} isMuted={isMuted} autoContinue={autoContinue} boardScatterKey={`${room.id}-${room.current_round}`} onNumberSelect={handleNumberSelect} onContinue={() => onRefresh()} onBackToSetup={localIsHost ? handleEndRoom : onBackToLobby} onToggleMute={() => setIsMuted((current) => !current)} onToggleAutoContinue={() => setAutoContinue((current) => !current)} quitLabel={localIsHost ? "End Room" : "Leave Room"} quitTitle={localIsHost ? "End this online room?" : "Leave this online room?"} quitDescription={localIsHost ? "This will close the room for every player." : "You will leave the room. The host can keep playing or end it."} quitConfirmLabel={localIsHost ? "End Room" : "Leave Room"} />;
}
