"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import InvitePanel from "@/components/InvitePanel";
import OnlineAvailablePlayers from "@/components/OnlineAvailablePlayers";
import OnlineLiveRaceGame from "@/components/OnlineLiveRaceGame";
import OnlineModeExplainer from "@/components/OnlineModeExplainer";
import OnlinePlayerPresence from "@/components/OnlinePlayerPresence";
import OnlineSameChallengeGame from "@/components/OnlineSameChallengeGame";
import ResultScreen from "@/components/ResultScreen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackEvent } from "@/lib/analytics";
import { getDeviceId } from "@/lib/device";
import { DIFFICULTIES } from "@/lib/gameDefaults";
import { addAiPlayersToOnlineRoom, clampAiOpponentCount, createOnlineRoomWithAi, isOnlineAiPlayer } from "@/lib/onlineAi";
import { setOnlinePresenceOffline, upsertOnlinePresence } from "@/lib/onlinePresence";
import { getMinimumPlayersToStart, normalizeMaxPlayers, removeOnlinePlayer, setOnlineRoomVisibility, type OnlineRoomVisibility } from "@/lib/onlineRoomExtras";
import { endOnlineRoom } from "@/lib/onlineRoomStatus";
import {
  createOnlineRoom,
  fetchOnlineRoomSnapshot,
  joinOnlineRoom,
  onlinePlayersToGamePlayers,
  onlineResultsToTurnResults,
  startOnlineRoom,
  subscribeToOnlineRoom,
} from "@/lib/onlineRooms";
import { clearOnlineRoomSession, loadOnlineRoomSession, saveOnlineRoomSession } from "@/lib/onlineSession";
import { getPlayerProfile } from "@/lib/playerProfile";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { Difficulty, GameConfig } from "@/types/game";
import type { OnlineGameType, OnlinePlayer, OnlineRoomSnapshot } from "@/types/online";

const ONLINE_NAME_KEY = "blink-and-find-online-name";

const DEFAULT_CONFIG: GameConfig = {
  mode: "multiplayer",
  difficulty: "normal",
  boardSize: 100,
  totalRounds: 5,
  flashDurationMs: 2000,
  penaltySeconds: 3,
  customNumbers: [],
};

function getDefaultOnlineName(): string {
  if (typeof window === "undefined") return "Player";
  const savedName = window.localStorage.getItem(ONLINE_NAME_KEY);
  if (savedName && savedName.trim().toLowerCase() !== "player") return savedName;
  const profile = getPlayerProfile();
  window.localStorage.setItem(ONLINE_NAME_KEY, profile.name);
  return profile.name;
}

function saveOnlineName(name: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(ONLINE_NAME_KEY, name.trim() || getPlayerProfile().name);
}

function getInviteUrl(roomCode: string): string {
  const path = `/online?room=${roomCode}&join=1`;
  return typeof window === "undefined" ? path : `${window.location.origin}${path}`;
}

function expandRange(start: number, end: number) {
  const step = start <= end ? 1 : -1;
  const values: number[] = [];
  for (let value = start; step > 0 ? value <= end : value >= end; value += step) values.push(value);
  return values;
}

function parseCustomNumbers(input: string, limit: number) {
  const rangeMatches = Array.from(input.matchAll(/(\d+)\s*(?:-|\.\.|to)\s*(\d+)/gi));
  const rangeNumbers = rangeMatches.flatMap((match) => expandRange(Number(match[1]), Number(match[2])));
  const inputWithoutRanges = input.replace(/\d+\s*(?:-|\.\.|to)\s*\d+/gi, " ");
  const looseNumbers = inputWithoutRanges.match(/\d+/g)?.map((value) => Number(value)) ?? [];
  const seen = new Set<number>();
  return [...rangeNumbers, ...looseNumbers]
    .filter((value) => Number.isInteger(value) && value > 0)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .slice(0, Math.max(0, limit));
}

function clampNumber(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(Math.floor(value), max));
}

function QuickActionCard({ title, description, badge, children }: { title: string; description: string; badge: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-[1.6rem] border bg-background/75 shadow-none">
      <CardHeader className="pb-3">
        <Badge variant="outline" className="mb-2 w-fit rounded-full">{badge}</Badge>
        <CardTitle className="text-xl font-black tracking-[-0.03em]">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function OnlinePage() {
  const autoActionStartedRef = useRef(false);
  const [playerName, setPlayerName] = useState("Player");
  const [roomCode, setRoomCode] = useState("");
  const [gameType, setGameType] = useState<OnlineGameType>("same_challenge");
  const [roomVisibility, setRoomVisibility] = useState<OnlineRoomVisibility>("private");
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [aiOpponentCount, setAiOpponentCount] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [boardSize, setBoardSize] = useState(100);
  const [rounds, setRounds] = useState(5);
  const [previewSeconds, setPreviewSeconds] = useState(2);
  const [penaltySeconds, setPenaltySeconds] = useState(3);
  const [customNumbersInput, setCustomNumbersInput] = useState("");
  const [snapshot, setSnapshot] = useState<OnlineRoomSnapshot | null>(null);
  const [localPlayer, setLocalPlayer] = useState<OnlinePlayer | null>(null);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const safeBoardSize = clampNumber(boardSize, 4, 225, 100);
  const safeRounds = clampNumber(rounds, 1, 20, 5);
  const safePreviewSeconds = clampNumber(previewSeconds, 1, 15, 2);
  const safePenaltySeconds = clampNumber(penaltySeconds, 0, 10, 3);
  const safeAiOpponentCount = clampAiOpponentCount(aiOpponentCount);
  const customNumbers = parseCustomNumbers(customNumbersInput, safeBoardSize);
  const gridSize = Math.ceil(Math.sqrt(safeBoardSize));

  function buildSettings(): GameConfig {
    return {
      ...DEFAULT_CONFIG,
      difficulty,
      boardSize: safeBoardSize,
      totalRounds: safeRounds,
      flashDurationMs: safePreviewSeconds * 1000,
      penaltySeconds: safePenaltySeconds,
      customNumbers,
    };
  }

  function updatePlayerName(name: string) {
    setPlayerName(name);
    saveOnlineName(name);
  }

  function markAvailable(name = localPlayer?.name ?? playerName) {
    void upsertOnlinePresence({ deviceId: getDeviceId(), displayName: name, availableToPlay: true, currentRoomId: null });
  }

  function closeRoomView(nextMessage = "") {
    clearOnlineRoomSession();
    setSnapshot(null);
    setLocalPlayer(null);
    setMessage(nextMessage);
    markAvailable();
  }

  function enterOnlineRoom(result: OnlineRoomSnapshot & { localPlayer: OnlinePlayer }, nextMessage: string) {
    setSnapshot(result);
    setLocalPlayer(result.localPlayer);
    saveOnlineRoomSession(result, result.localPlayer);
    setMessage(nextMessage);
    void upsertOnlinePresence({ deviceId: getDeviceId(), displayName: result.localPlayer.name, availableToPlay: false, currentRoomId: result.room.id });
  }

  async function refreshRoom(roomId: string) {
    const nextSnapshot = await fetchOnlineRoomSnapshot(roomId);

    if (nextSnapshot.room.status === "abandoned") {
      closeRoomView("The host ended this room.");
      return;
    }

    const nextLocalPlayer = localPlayer ? nextSnapshot.players.find((player) => player.id === localPlayer.id) ?? localPlayer : null;
    setSnapshot(nextSnapshot);
    if (nextLocalPlayer) {
      setLocalPlayer(nextLocalPlayer);
      saveOnlineRoomSession(nextSnapshot, nextLocalPlayer);
    }
  }

  async function createInviteRoom() {
    setIsBusy(true);
    setMessage("Creating invite room...");
    saveOnlineName(playerName);
    try {
      const normalizedMaxPlayers = normalizeMaxPlayers(maxPlayers);
      const result = await createOnlineRoom({ playerName, deviceId: getDeviceId(), gameType, settings: buildSettings() });
      const visibilityResult = await setOnlineRoomVisibility(result.room.id, roomVisibility, normalizedMaxPlayers);
      const nextSnapshot = visibilityResult.applied ? await fetchOnlineRoomSnapshot(result.room.id) : result;
      trackEvent("online_room_created", { gameType, visibility: roomVisibility, maxPlayers: normalizedMaxPlayers });
      enterOnlineRoom({ ...nextSnapshot, localPlayer: result.localPlayer }, "Room ready. Share the code or invite a live player.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create room.");
    } finally {
      setIsBusy(false);
    }
  }

  async function createAiMatch() {
    setIsBusy(true);
    setMessage("Creating AI match...");
    saveOnlineName(playerName);
    try {
      const settings = buildSettings();
      const result = await createOnlineRoomWithAi({ playerName, deviceId: getDeviceId(), gameType: "same_challenge", settings, aiCount: safeAiOpponentCount });
      await setOnlineRoomVisibility(result.room.id, "private", safeAiOpponentCount + 1);
      const nextSnapshot = await fetchOnlineRoomSnapshot(result.room.id);
      trackEvent("online_room_created", { gameType: "same_challenge", visibility: "private", maxPlayers: safeAiOpponentCount + 1, aiOpponents: safeAiOpponentCount });
      enterOnlineRoom({ ...nextSnapshot, localPlayer: result.localPlayer }, `AI match ready with ${safeAiOpponentCount} opponent${safeAiOpponentCount === 1 ? "" : "s"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create AI match.");
    } finally {
      setIsBusy(false);
    }
  }

  async function addAiToCurrentRoom() {
    if (!snapshot || !localPlayer?.is_host) return;
    setIsBusy(true);
    setMessage(`Adding ${safeAiOpponentCount} AI opponent${safeAiOpponentCount === 1 ? "" : "s"}...`);
    try {
      const nextSnapshot = await addAiPlayersToOnlineRoom(snapshot.room.id, safeAiOpponentCount);
      const nextLocalPlayer = nextSnapshot.players.find((player) => player.id === localPlayer.id) ?? localPlayer;
      enterOnlineRoom({ ...nextSnapshot, localPlayer: nextLocalPlayer }, `Added ${safeAiOpponentCount} AI opponent${safeAiOpponentCount === 1 ? "" : "s"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add AI opponents.");
    } finally {
      setIsBusy(false);
    }
  }

  async function quickJoinRoom(code = roomCode, name = playerName) {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setMessage("Enter the room code.");
      return;
    }
    setIsBusy(true);
    setMessage("Joining room...");
    saveOnlineName(name);
    try {
      const result = await joinOnlineRoom({ code: normalizedCode, playerName: name, deviceId: getDeviceId() });
      setRoomCode(normalizedCode);
      trackEvent("online_room_joined", { code: normalizedCode, status: result.room.status });
      enterOnlineRoom(result, result.room.status === "finished" ? "Rejoined completed room." : "Joined room. Wait for the host to start.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not join room.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStartRoom() {
    if (!snapshot || !localPlayer?.is_host) return;
    setIsBusy(true);
    setMessage("Starting game...");
    try {
      await startOnlineRoom(snapshot.room, snapshot.players);
      await refreshRoom(snapshot.room.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start room.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRemovePlayer(player: OnlinePlayer) {
    if (!snapshot || !localPlayer?.is_host) return;
    setIsBusy(true);
    try {
      await removeOnlinePlayer(snapshot.room.id, localPlayer.id, player.id);
      await refreshRoom(snapshot.room.id);
      setMessage(`${player.name} removed from the lobby.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove player.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleEndRoom() {
    if (!snapshot) {
      closeRoomView();
      return;
    }

    if (!localPlayer?.is_host) {
      closeRoomView("You left the room.");
      return;
    }

    setIsBusy(true);
    try {
      await endOnlineRoom(snapshot.room.id);
      closeRoomView("Room ended for everyone.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not end room.");
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    async function initializeOnlinePage() {
      const savedName = getDefaultOnlineName();
      const savedSession = loadOnlineRoomSession();
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get("room")?.toUpperCase() ?? "";
      const shouldJoin = params.get("join") === "1";
      const boardParam = Number(params.get("board"));
      const roundsParam = Number(params.get("rounds"));
      const previewParam = Number(params.get("preview"));
      const penaltyParam = Number(params.get("penalty"));
      const numbersParam = params.get("numbers") ?? "";
      setPlayerName(savedName);
      if (Number.isFinite(boardParam) && boardParam > 0) setBoardSize(clampNumber(boardParam, 4, 225, 100));
      if (Number.isFinite(roundsParam) && roundsParam > 0) setRounds(clampNumber(roundsParam, 1, 20, 5));
      if (Number.isFinite(previewParam) && previewParam > 0) setPreviewSeconds(clampNumber(previewParam, 1, 15, 2));
      if (Number.isFinite(penaltyParam)) setPenaltySeconds(clampNumber(penaltyParam, 0, 10, 3));
      if (numbersParam) setCustomNumbersInput(numbersParam);
      if (!hasSupabaseConfig()) return;
      if (codeFromUrl) setRoomCode(codeFromUrl);
      if (codeFromUrl && shouldJoin) {
        autoActionStartedRef.current = true;
        await quickJoinRoom(codeFromUrl, savedName);
        return;
      }
      if (savedSession && !autoActionStartedRef.current) {
        autoActionStartedRef.current = true;
        await quickJoinRoom(savedSession.roomCode, savedSession.playerName || savedName);
        return;
      }
      await upsertOnlinePresence({ deviceId: getDeviceId(), displayName: savedName, availableToPlay: true, currentRoomId: null });
    }
    void initializeOnlinePage();
    return () => { void setOnlinePresenceOffline(getDeviceId()); };
  }, []);

  useEffect(() => {
    if (!snapshot?.room.id) return;
    const roomId = snapshot.room.id;
    let unsubscribe: (() => void) | undefined;
    let refreshTimer: number | undefined;
    let disposed = false;

    const requestRefresh = () => {
      if (disposed || document.visibilityState === "hidden") return;
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        refreshTimer = undefined;
        refreshRoom(roomId).catch((error) => setMessage(error.message));
      }, 150);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") requestRefresh();
    };

    subscribeToOnlineRoom(roomId, requestRefresh)
      .then((cleanup) => {
        if (disposed) {
          cleanup();
          return;
        }
        unsubscribe = cleanup;
      })
      .catch((error) => setMessage(error.message));

    window.addEventListener("focus", requestRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      window.removeEventListener("focus", requestRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unsubscribe?.();
    };
  }, [snapshot?.room.id, localPlayer?.id]);

  if (!hasSupabaseConfig()) {
    return (
      <main className="app-shell">
        <section className="flex h-full items-center justify-center px-2">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle>Online Play needs Supabase</CardTitle>
              <CardDescription>Add the Supabase environment variables locally and in Cloudflare Pages.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then run the SQL in supabase/schema.sql.</CardContent>
            <CardFooter><Button asChild variant="outline"><Link href="/">Back</Link></Button></CardFooter>
          </Card>
        </section>
      </main>
    );
  }

  if (snapshot && localPlayer) {
    const isHost = localPlayer.is_host;
    const roomStatus = snapshot.room.status;
    const inviteUrl = getInviteUrl(snapshot.room.code);
    const roomCapacity = normalizeMaxPlayers(snapshot.room.max_players ?? 2);
    const minimumPlayersToStart = getMinimumPlayersToStart(roomCapacity);
    const canStartRoom = snapshot.players.length >= minimumPlayersToStart;
    const startLabel = !canStartRoom ? "Waiting for Friend" : roomCapacity === 1 ? "Start Solo Online Game" : "Start Game";

    if (roomStatus === "finished") {
      return <main className="app-shell"><ResultScreen players={onlinePlayersToGamePlayers(snapshot.players)} results={onlineResultsToTurnResults(snapshot.results)} bestScore={null} latestScore={null} isNewBest={false} onPlayAgain={closeRoomView} playAgainLabel="Back to Online" localPlayerId={localPlayer.id} /></main>;
    }

    if (roomStatus !== "lobby" && snapshot.room.game_type === "same_challenge") {
      return <OnlineSameChallengeGame snapshot={snapshot} localPlayer={localPlayer} onRefresh={() => refreshRoom(snapshot.room.id)} onBackToLobby={() => closeRoomView("You left the room.")} onEndRoom={handleEndRoom} />;
    }

    if (roomStatus !== "lobby" && snapshot.room.game_type === "live_race") {
      return <OnlineLiveRaceGame snapshot={snapshot} localPlayer={localPlayer} onRefresh={() => refreshRoom(snapshot.room.id)} onBackToLobby={() => closeRoomView("You left the room.")} />;
    }

    return (
      <main className="app-shell overflow-auto">
        <section className="flex min-h-full items-center justify-center px-2 py-3">
          <Card className="w-full max-w-2xl overflow-hidden rounded-[1.7rem]">
            <CardHeader className="border-b pb-4 text-center">
              <Badge variant="secondary" className="mx-auto mb-3 w-fit rounded-full">Room ready</Badge>
              <CardTitle className="text-4xl font-black tracking-tight sm:text-6xl">{snapshot.room.code}</CardTitle>
              <CardDescription>{isHost ? "You are admin. Invite players, add AI opponents, then start." : "You joined. The admin will start the game."}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{snapshot.room.game_type === "same_challenge" ? "Same Challenge" : "Live Race"}</Badge>
                <Badge variant="outline">{snapshot.players.length}/{roomCapacity} players</Badge>
                <Badge variant="outline">{snapshot.room.settings.boardSize} slots</Badge>
                <Badge variant="outline">{snapshot.room.settings.totalRounds} rounds</Badge>
              </div>
              <div className="grid gap-2">
                {snapshot.players.map((player) => {
                  const isAi = isOnlineAiPlayer(player);
                  return (
                    <div key={player.id} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
                      <div><div className="font-medium">{player.name}</div><div className="text-xs text-muted-foreground">{isAi ? "AI opponent" : `Joined ${new Date(player.joined_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}</div></div>
                      <div className="flex items-center gap-2">{isAi ? <Badge variant="secondary">AI</Badge> : <OnlinePlayerPresence player={player} localPlayerId={localPlayer.id} snapshot={snapshot} />}{isHost && !player.is_host && roomStatus === "lobby" && <Button size="sm" variant="ghost" onClick={() => handleRemovePlayer(player)} disabled={isBusy}>Remove</Button>}</div>
                    </div>
                  );
                })}
              </div>
              {isHost && snapshot.room.game_type === "same_challenge" && (
                <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="grid gap-2"><Label htmlFor="lobby-ai-count">AI opponents</Label><Input id="lobby-ai-count" min={1} max={24} type="number" value={safeAiOpponentCount} onChange={(event) => setAiOpponentCount(clampAiOpponentCount(Number(event.target.value)))} /></div>
                  <Button className="rounded-2xl" onClick={addAiToCurrentRoom} disabled={isBusy}>Add AI</Button>
                </div>
              )}
              {isHost ? <InvitePanel roomCode={snapshot.room.code} inviteUrl={inviteUrl} onMessage={setMessage} /> : <div className="rounded-xl border bg-muted/20 p-4 text-center text-sm text-muted-foreground">You are a player in this room. The admin controls Start and End Room.</div>}
              {message && <div className="text-center text-sm text-muted-foreground" role="status">{message}</div>}
            </CardContent>
            <CardFooter className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => closeRoomView("You left the room.")}>Leave Room</Button>{isHost && <Button variant="destructive" onClick={handleEndRoom} disabled={isBusy}>End Room</Button>}<Button variant="ghost" onClick={() => refreshRoom(snapshot.room.id)}>Refresh</Button></div>
              {isHost && roomStatus === "lobby" && <Button onClick={handleStartRoom} disabled={isBusy || !canStartRoom}>{startLabel}</Button>}
            </CardFooter>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto grid min-h-full w-full max-w-5xl gap-4 px-3 py-4 sm:px-6">
        <Card className="overflow-hidden rounded-[2rem] border bg-white/85 shadow-xl shadow-slate-950/5">
          <CardHeader className="border-b p-6 text-center sm:p-8">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit rounded-full">Online Play</Badge>
            <CardTitle className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">Online in 3 moves</CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-base leading-7">Pick someone online, add AI opponents, create an invite room, or join a code. The advanced settings are tucked away where they belong.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 sm:p-6">
            <div className="grid gap-2 rounded-[1.4rem] border bg-muted/20 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="grid gap-2"><Label htmlFor="player-name">Your name</Label><Input id="player-name" className="h-12 rounded-2xl" value={playerName} onChange={(event) => updatePlayerName(event.target.value)} /></div>
              <Badge variant="outline" className="h-12 justify-center rounded-2xl px-4">{gridSize}x{gridSize} · {safeRounds} rounds</Badge>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
              <OnlineAvailablePlayers playerName={playerName} gameType={gameType} settings={buildSettings()} onEnterRoom={enterOnlineRoom} onMessage={setMessage} />
              <div className="grid gap-3">
                <QuickActionCard title="Play AI opponents" badge="AI" description="No one online? Add bots and start a Same Challenge match."><div className="grid gap-3"><div className="grid gap-2"><Label htmlFor="ai-count">Number of AI</Label><Input id="ai-count" min={1} max={24} type="number" value={safeAiOpponentCount} onChange={(event) => setAiOpponentCount(clampAiOpponentCount(Number(event.target.value)))} /></div><Button className="h-14 w-full rounded-2xl text-base font-black" onClick={createAiMatch} disabled={isBusy}>{isBusy ? "Creating..." : "Create AI Match"}</Button></div></QuickActionCard>
                <QuickActionCard title="Invite a friend" badge="2" description="Create a private room and share the code."><Button className="h-14 w-full rounded-2xl text-base font-black" onClick={createInviteRoom} disabled={isBusy}>{isBusy ? "Creating..." : "Create Invite Room"}</Button></QuickActionCard>
                <QuickActionCard title="Join with code" badge="3" description="Paste the code your friend sent you."><div className="flex gap-2"><Input className="h-12 rounded-2xl" value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} placeholder="AB123" /><Button className="h-12 rounded-2xl" onClick={() => quickJoinRoom()} disabled={isBusy || roomCode.trim().length === 0}>Join</Button></div></QuickActionCard>
              </div>
            </div>
            <details className="rounded-[1.4rem] border bg-muted/20 p-4">
              <summary className="cursor-pointer text-sm font-black">Advanced match setup</summary>
              <div className="mt-4 grid gap-4">
                <OnlineModeExplainer value={gameType} onChange={setGameType} />
                <div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-2"><Label>Board preset</Label><div className="flex flex-wrap gap-2">{DIFFICULTIES.map((item) => <Button key={item.id} type="button" variant={safeBoardSize === item.boardSize ? "default" : "outline"} className="rounded-full" onClick={() => { setDifficulty(item.id); setBoardSize(item.boardSize); setPreviewSeconds(Math.max(1, Math.round(item.flashDurationMs / 1000))); }}>{Math.ceil(Math.sqrt(item.boardSize))}x{Math.ceil(Math.sqrt(item.boardSize))}</Button>)}</div></div><div className="grid gap-2"><Label htmlFor="board-size">Custom slots</Label><Input id="board-size" className="h-12 rounded-2xl" min={4} max={225} type="number" value={safeBoardSize} onChange={(event) => setBoardSize(clampNumber(Number(event.target.value), 4, 225, 100))} /></div></div>
                <div className="grid gap-2"><Label htmlFor="custom-numbers">Required numbers</Label><Input id="custom-numbers" className="h-12 rounded-2xl" value={customNumbersInput} onChange={(event) => setCustomNumbersInput(event.target.value)} placeholder="Example: 1 to 20" /><div className="text-xs text-muted-foreground">{customNumbers.length}/{safeBoardSize} required numbers. Remaining {Math.max(0, safeBoardSize - customNumbers.length)} slots become random.</div></div>
                <div className="grid gap-3 sm:grid-cols-4"><div className="grid gap-2"><Label htmlFor="rounds">Rounds</Label><Input id="rounds" min={1} max={20} type="number" value={safeRounds} onChange={(event) => setRounds(clampNumber(Number(event.target.value), 1, 20, 5))} /></div><div className="grid gap-2"><Label htmlFor="preview">Preview</Label><Input id="preview" min={1} max={15} type="number" value={safePreviewSeconds} onChange={(event) => setPreviewSeconds(clampNumber(Number(event.target.value), 1, 15, 2))} /></div><div className="grid gap-2"><Label htmlFor="penalty">Penalty</Label><Input id="penalty" min={0} max={10} type="number" value={safePenaltySeconds} onChange={(event) => setPenaltySeconds(clampNumber(Number(event.target.value), 0, 10, 3))} /></div><div className="grid gap-2"><Label htmlFor="players">Players</Label><Input id="players" min={1} max={8} type="number" value={maxPlayers} onChange={(event) => setMaxPlayers(normalizeMaxPlayers(Number(event.target.value)))} /></div></div>
                <div className="grid gap-2"><Label>Room type</Label><div className="flex flex-wrap gap-2"><Button type="button" variant={roomVisibility === "private" ? "default" : "outline"} className="rounded-full" onClick={() => setRoomVisibility("private")}>Private</Button><Button type="button" variant={roomVisibility === "public" ? "default" : "outline"} className="rounded-full" onClick={() => setRoomVisibility("public")}>Public</Button></div></div>
              </div>
            </details>
            {message && <div className="rounded-2xl border bg-muted/20 p-3 text-center text-sm text-muted-foreground" role="status">{message}</div>}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-between sm:p-5"><Button asChild variant="outline" className="rounded-full"><Link href="/">Back</Link></Button><Button asChild variant="ghost" className="rounded-full"><Link href="/modes">All Modes</Link></Button></CardFooter>
        </Card>
      </section>
    </main>
  );
}
