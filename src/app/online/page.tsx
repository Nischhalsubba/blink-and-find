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
import { setOnlinePresenceOffline, upsertOnlinePresence } from "@/lib/onlinePresence";
import { getMinimumPlayersToStart, normalizeMaxPlayers, removeOnlinePlayer, setOnlineRoomVisibility, type OnlineRoomVisibility } from "@/lib/onlineRoomExtras";
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
import { hasSupabaseConfig } from "@/lib/supabase";
import { cn } from "@/lib/utils";
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
  if (typeof window === "undefined") {
    return "Player";
  }

  return window.localStorage.getItem(ONLINE_NAME_KEY) || "Player";
}

function saveOnlineName(name: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ONLINE_NAME_KEY, name.trim() || "Player");
  }
}

function getInviteUrl(roomCode: string): string {
  const path = `/online?room=${roomCode}&join=1`;
  return typeof window === "undefined" ? path : `${window.location.origin}${path}`;
}

function getDifficultyConfig(difficulty: Difficulty) {
  return DIFFICULTIES.find((item) => item.id === difficulty) ?? DIFFICULTIES[1];
}

function expandRange(start: number, end: number) {
  const step = start <= end ? 1 : -1;
  const values: number[] = [];

  for (let value = start; step > 0 ? value <= end : value >= end; value += step) {
    values.push(value);
  }

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
      if (seen.has(value)) {
        return false;
      }

      seen.add(value);
      return true;
    })
    .slice(0, Math.max(0, limit));
}

function clampNumber(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(min, Math.min(Math.floor(value), max));
}

function ChoicePill({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-all",
        active ? "border-primary bg-primary text-primary-foreground shadow-xs" : "border-border bg-muted/20 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {children}
    </button>
  );
}

export default function OnlinePage() {
  const autoActionStartedRef = useRef(false);
  const [playerName, setPlayerName] = useState("Player");
  const [roomCode, setRoomCode] = useState("");
  const [gameType, setGameType] = useState<OnlineGameType>("same_challenge");
  const [roomVisibility, setRoomVisibility] = useState<OnlineRoomVisibility>("private");
  const [maxPlayers, setMaxPlayers] = useState(2);
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
  const customNumbers = parseCustomNumbers(customNumbersInput, safeBoardSize);

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

  function enterOnlineRoom(result: OnlineRoomSnapshot & { localPlayer: OnlinePlayer }, nextMessage: string) {
    setSnapshot(result);
    setLocalPlayer(result.localPlayer);
    saveOnlineRoomSession(result, result.localPlayer);
    setMessage(nextMessage);
    void upsertOnlinePresence({
      deviceId: getDeviceId(),
      displayName: result.localPlayer.name,
      availableToPlay: false,
      currentRoomId: result.room.id,
    });
  }

  async function refreshRoom(roomId: string) {
    const nextSnapshot = await fetchOnlineRoomSnapshot(roomId);
    const nextLocalPlayer = localPlayer
      ? nextSnapshot.players.find((player) => player.id === localPlayer.id) ?? localPlayer
      : null;

    setSnapshot(nextSnapshot);

    if (nextLocalPlayer) {
      setLocalPlayer(nextLocalPlayer);
      saveOnlineRoomSession(nextSnapshot, nextLocalPlayer);
    }
  }

  async function quickCreateRoom() {
    setIsBusy(true);
    setMessage("Creating room...");
    saveOnlineName(playerName);

    try {
      const normalizedMaxPlayers = normalizeMaxPlayers(maxPlayers);
      const result = await createOnlineRoom({
        playerName,
        deviceId: getDeviceId(),
        gameType,
        settings: buildSettings(),
      });

      const visibilityResult = await setOnlineRoomVisibility(result.room.id, roomVisibility, normalizedMaxPlayers);
      const nextSnapshot = visibilityResult.applied ? await fetchOnlineRoomSnapshot(result.room.id) : result;

      trackEvent("online_room_created", { gameType, visibility: roomVisibility, maxPlayers: normalizedMaxPlayers });
      enterOnlineRoom({ ...nextSnapshot, localPlayer: result.localPlayer }, "Room created. Share the invite or wait for an accepted player invite.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create room.");
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
    if (!snapshot) {
      return;
    }

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
    if (!snapshot || !localPlayer) {
      return;
    }

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

  function closeRoomView() {
    const name = localPlayer?.name ?? playerName;
    clearOnlineRoomSession();
    setSnapshot(null);
    setLocalPlayer(null);
    setMessage("");
    void upsertOnlinePresence({
      deviceId: getDeviceId(),
      displayName: name,
      availableToPlay: true,
      currentRoomId: null,
    });
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

      if (Number.isFinite(boardParam) && boardParam > 0) {
        setBoardSize(clampNumber(boardParam, 4, 225, 100));
      }

      if (Number.isFinite(roundsParam) && roundsParam > 0) {
        setRounds(clampNumber(roundsParam, 1, 20, 5));
      }

      if (Number.isFinite(previewParam) && previewParam > 0) {
        setPreviewSeconds(clampNumber(previewParam, 1, 15, 2));
      }

      if (Number.isFinite(penaltyParam)) {
        setPenaltySeconds(clampNumber(penaltyParam, 0, 10, 3));
      }

      if (numbersParam) {
        setCustomNumbersInput(numbersParam);
      }

      if (!hasSupabaseConfig()) {
        return;
      }

      if (codeFromUrl) {
        setRoomCode(codeFromUrl);
      }

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

      await upsertOnlinePresence({
        deviceId: getDeviceId(),
        displayName: savedName,
        availableToPlay: true,
        currentRoomId: null,
      });
    }

    void initializeOnlinePage();

    return () => {
      void setOnlinePresenceOffline(getDeviceId());
    };
  }, []);

  useEffect(() => {
    if (!snapshot?.room.id) {
      return;
    }

    let unsubscribe: (() => void) | undefined;

    subscribeToOnlineRoom(snapshot.room.id, () => {
      refreshRoom(snapshot.room.id).catch((error) => setMessage(error.message));
    }).then((cleanup) => {
      unsubscribe = cleanup;
    }).catch((error) => setMessage(error.message));

    return () => {
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
            <CardContent className="text-sm text-muted-foreground">
              Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then run the SQL in supabase/schema.sql.
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline"><Link href="/">Back</Link></Button>
            </CardFooter>
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
      return (
        <main className="app-shell">
          <ResultScreen
            players={onlinePlayersToGamePlayers(snapshot.players)}
            results={onlineResultsToTurnResults(snapshot.results)}
            bestScore={null}
            latestScore={null}
            isNewBest={false}
            onPlayAgain={closeRoomView}
            playAgainLabel="Back to Online"
          />
        </main>
      );
    }

    if (roomStatus !== "lobby" && snapshot.room.game_type === "same_challenge") {
      return <OnlineSameChallengeGame snapshot={snapshot} localPlayer={localPlayer} onRefresh={() => refreshRoom(snapshot.room.id)} onBackToLobby={closeRoomView} />;
    }

    if (roomStatus !== "lobby" && snapshot.room.game_type === "live_race") {
      return <OnlineLiveRaceGame snapshot={snapshot} localPlayer={localPlayer} onRefresh={() => refreshRoom(snapshot.room.id)} onBackToLobby={closeRoomView} />;
    }

    return (
      <main className="app-shell">
        <section className="flex h-full items-center justify-center px-2">
          <Card className="w-full max-w-2xl overflow-hidden">
            <CardHeader className="border-b pb-4 text-center">
              <Badge variant="secondary" className="mx-auto mb-3 w-fit">Room ready</Badge>
              <CardTitle className="text-4xl font-semibold tracking-tight sm:text-6xl">{snapshot.room.code}</CardTitle>
              <CardDescription>{isHost ? "Share the invite, wait for accepted invites, or start when enough players join." : "You joined. Wait for the host to start."}</CardDescription>
            </CardHeader>

            <CardContent className="grid gap-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{snapshot.room.visibility ?? "private"}</Badge>
                <Badge variant="outline">{snapshot.room.game_type === "same_challenge" ? "Same Challenge" : "Live Race"}</Badge>
                <Badge variant="outline">{snapshot.players.length}/{roomCapacity} players</Badge>
                <Badge variant="outline">{snapshot.room.settings.boardSize} slots</Badge>
                <Badge variant="outline">+{snapshot.room.settings.penaltySeconds}s penalty</Badge>
              </div>

              <div className="grid gap-2">
                {snapshot.players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-muted-foreground">Joined {new Date(player.joined_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <OnlinePlayerPresence player={player} localPlayerId={localPlayer.id} snapshot={snapshot} />
                      {isHost && !player.is_host && roomStatus === "lobby" && (
                        <Button size="sm" variant="ghost" onClick={() => handleRemovePlayer(player)} disabled={isBusy}>Remove</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isHost ? (
                <InvitePanel roomCode={snapshot.room.code} inviteUrl={inviteUrl} onMessage={setMessage} />
              ) : (
                <div className="rounded-xl border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                  You are in room <span className="font-semibold text-foreground">{snapshot.room.code}</span>. Keep this screen open and wait for the host to start.
                </div>
              )}

              {message && <div className="text-center text-sm text-muted-foreground" role="status">{message}</div>}
            </CardContent>

            <CardFooter className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeRoomView}>Back</Button>
                <Button variant="ghost" onClick={() => refreshRoom(snapshot.room.id)}>Refresh</Button>
              </div>
              {isHost && roomStatus === "lobby" && (
                <Button onClick={handleStartRoom} disabled={isBusy || !canStartRoom}>{startLabel}</Button>
              )}
            </CardFooter>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell overflow-auto">
      <section className="flex min-h-full items-center justify-center px-2 py-3">
        <Card className="w-full max-w-3xl overflow-hidden">
          <CardHeader className="border-b pb-4 text-center">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit">Online Play</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-5xl">Play with someone online now</CardTitle>
            <CardDescription>Show your availability, invite available players, create a room, or join with a code.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 p-4 sm:p-5">
            <OnlineModeExplainer value={gameType} onChange={setGameType} />

            <OnlineAvailablePlayers
              playerName={playerName}
              gameType={gameType}
              settings={buildSettings()}
              onEnterRoom={enterOnlineRoom}
              onMessage={setMessage}
            />

            <div className="grid gap-3 rounded-xl border bg-muted/20 p-3">
              <div className="grid gap-2">
                <Label htmlFor="player-name">Your name</Label>
                <Input id="player-name" value={playerName} onChange={(event) => updatePlayerName(event.target.value)} />
              </div>

              <div className="grid gap-2">
                <Label>Room privacy</Label>
                <div className="flex flex-wrap gap-2">
                  <ChoicePill active={roomVisibility === "private"} onClick={() => setRoomVisibility("private")}>Private invite</ChoicePill>
                  <ChoicePill active={roomVisibility === "public"} onClick={() => setRoomVisibility("public")}>Public lobby</ChoicePill>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="board-size">Board slots</Label>
                  <Input id="board-size" min={4} max={225} type="number" value={safeBoardSize} onChange={(event) => setBoardSize(clampNumber(Number(event.target.value), 4, 225, 100))} />
                </div>
                <div className="grid gap-2">
                  <Label>Preset</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIFFICULTIES.map((item) => (
                      <ChoicePill key={item.id} active={safeBoardSize === item.boardSize} onClick={() => { setDifficulty(item.id); setBoardSize(item.boardSize); setPreviewSeconds(Math.max(1, Math.round(getDifficultyConfig(item.id).flashDurationMs / 1000))); }}>{Math.ceil(Math.sqrt(item.boardSize))}x{Math.ceil(Math.sqrt(item.boardSize))}</ChoicePill>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="custom-numbers">Required numbers</Label>
                <Input id="custom-numbers" value={customNumbersInput} onChange={(event) => setCustomNumbersInput(event.target.value)} placeholder="Example: 1 to 20" />
                <div className="text-xs text-muted-foreground">{customNumbers.length}/{safeBoardSize} required numbers. The remaining {Math.max(0, safeBoardSize - customNumbers.length)} slots are random.</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="grid gap-2">
                  <Label htmlFor="max-players">Max players</Label>
                  <Input id="max-players" min={1} max={8} type="number" value={maxPlayers} onChange={(event) => setMaxPlayers(normalizeMaxPlayers(Number(event.target.value)))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="online-rounds">Rounds</Label>
                  <Input id="online-rounds" min={1} max={20} type="number" value={safeRounds} onChange={(event) => setRounds(clampNumber(Number(event.target.value), 1, 20, 5))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="preview">Preview</Label>
                  <Input id="preview" min={1} max={15} type="number" value={safePreviewSeconds} onChange={(event) => setPreviewSeconds(clampNumber(Number(event.target.value), 1, 15, 2))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="online-penalty">Penalty</Label>
                  <Input id="online-penalty" min={0} max={10} type="number" value={safePenaltySeconds} onChange={(event) => setPenaltySeconds(clampNumber(Number(event.target.value), 0, 10, 3))} />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button size="lg" className="h-14 text-base" onClick={quickCreateRoom} disabled={isBusy}>{isBusy ? "Creating..." : "Create Room"}</Button>
                <div className="flex gap-2">
                  <Input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} placeholder="Room code" />
                  <Button onClick={() => quickJoinRoom()} disabled={isBusy || roomCode.trim().length === 0}>Join</Button>
                </div>
              </div>
            </div>

            {message && <div className="text-center text-sm text-muted-foreground" role="status">{message}</div>}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-between sm:p-5">
            <Button asChild variant="outline"><Link href="/">Back</Link></Button>
            <div className="flex gap-1">
              <Button asChild variant="ghost" size="sm"><Link href="/modes">Modes</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link href="/leaderboard">Leaderboard</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link href="/faq">FAQ</Link></Button>
            </div>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
