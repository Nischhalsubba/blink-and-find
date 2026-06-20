"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import InvitePanel from "@/components/InvitePanel";
import OnlineLiveRaceGame from "@/components/OnlineLiveRaceGame";
import OnlineModeExplainer from "@/components/OnlineModeExplainer";
import OnlinePlayerPresence from "@/components/OnlinePlayerPresence";
import OnlineSameChallengeGame from "@/components/OnlineSameChallengeGame";
import ResultScreen from "@/components/ResultScreen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDeviceId } from "@/lib/device";
import { DIFFICULTIES } from "@/lib/gameDefaults";
import { abandonStaleOnlineRooms, isOnlineRoomStale } from "@/lib/onlineCleanup";
import { fetchPublicLobbyRooms, removeOnlinePlayer, setOnlineRoomVisibility, type OnlineRoomVisibility, type PublicLobbyRoom } from "@/lib/onlineRoomExtras";
import {
  createOnlineRoom,
  fetchOnlineRoomSnapshot,
  joinOnlineRoom,
  onlinePlayersToGamePlayers,
  onlineResultsToTurnResults,
  startOnlineRoom,
  subscribeToOnlineRoom,
} from "@/lib/onlineRooms";
import {
  clearOnlineRoomSession,
  getOnlineRoomSessionAge,
  loadOnlineRoomSession,
  saveOnlineRoomSession,
  type OnlineRoomSession,
} from "@/lib/onlineSession";
import { hasSupabaseConfig } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { Difficulty, GameConfig } from "@/types/game";
import type { OnlineGameType, OnlinePlayer, OnlineRoomSnapshot } from "@/types/online";

const ONLINE_NAME_KEY = "blink-and-find-online-name";

type OnlineAction = "create" | "join";

const DEFAULT_CONFIG: GameConfig = {
  mode: "multiplayer",
  difficulty: "normal",
  boardSize: 100,
  totalRounds: 5,
  flashDurationMs: 2000,
  penaltySeconds: 3,
};

function getDifficultyConfig(difficulty: Difficulty) {
  return DIFFICULTIES.find((item) => item.id === difficulty) ?? DIFFICULTIES[1];
}

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

  if (typeof window === "undefined") {
    return path;
  }

  return `${window.location.origin}${path}`;
}

function ChoicePill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-xs"
          : "border-border bg-muted/20 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {children}
    </button>
  );
}

function OnlineRecoveryActions({
  message,
  onClear,
  onCleanup,
}: {
  message: string;
  onClear: () => void;
  onCleanup: () => void;
}) {
  if (!message) {
    return null;
  }

  return (
    <div className="grid gap-2 rounded-xl border bg-muted/20 p-3 text-sm">
      <div className="text-muted-foreground" role="status">{message}</div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" variant="outline" onClick={onCleanup}>Clean stale rooms</Button>
        <Button size="sm" variant="ghost" onClick={onClear}>Dismiss</Button>
      </div>
    </div>
  );
}

function PublicRoomBrowser({
  rooms,
  unavailable,
  isLoading,
  onRefresh,
  onJoin,
}: {
  rooms: PublicLobbyRoom[];
  unavailable: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onJoin: (code: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Public rooms</div>
          <div className="text-xs text-muted-foreground">Join an open lobby without pasting a code.</div>
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={isLoading}>{isLoading ? "Loading..." : "Refresh"}</Button>
      </div>

      {unavailable ? (
        <div className="rounded-lg border bg-background/50 p-3 text-sm text-muted-foreground">
          Public room browsing needs the latest Supabase migration. The UI is ready; the database needs to catch up, like usual.
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-lg border bg-background/50 p-3 text-sm text-muted-foreground">No public lobbies right now.</div>
      ) : (
        <div className="grid gap-2">
          {rooms.map(({ room, playerCount }) => (
            <div key={room.id} className="flex items-center justify-between gap-2 rounded-lg border bg-background/50 p-3 text-sm">
              <div>
                <div className="font-semibold">Room {room.code}</div>
                <div className="text-xs text-muted-foreground">
                  {room.game_type === "same_challenge" ? "Same Challenge" : "Live Race"} · {playerCount}/{room.max_players ?? 8} players
                </div>
              </div>
              <Button size="sm" onClick={() => onJoin(room.code)}>Join</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OnlinePage() {
  const autoActionStartedRef = useRef(false);
  const [action, setAction] = useState<OnlineAction>("create");
  const [playerName, setPlayerName] = useState("Player");
  const [roomCode, setRoomCode] = useState("");
  const [gameType, setGameType] = useState<OnlineGameType>("same_challenge");
  const [roomVisibility, setRoomVisibility] = useState<OnlineRoomVisibility>("private");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [publicRooms, setPublicRooms] = useState<PublicLobbyRoom[]>([]);
  const [publicRoomsUnavailable, setPublicRoomsUnavailable] = useState(false);
  const [isLoadingPublicRooms, setIsLoadingPublicRooms] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [rounds, setRounds] = useState(5);
  const [penaltySeconds, setPenaltySeconds] = useState(3);
  const [restoreSession, setRestoreSession] = useState<OnlineRoomSession | null>(null);
  const [snapshot, setSnapshot] = useState<OnlineRoomSnapshot | null>(null);
  const [localPlayer, setLocalPlayer] = useState<OnlinePlayer | null>(null);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  async function loadPublicRooms() {
    if (!hasSupabaseConfig()) {
      return;
    }

    setIsLoadingPublicRooms(true);

    try {
      const result = await fetchPublicLobbyRooms();
      setPublicRooms(result.rooms);
      setPublicRoomsUnavailable(result.unavailable);
    } catch (error) {
      setPublicRooms([]);
      setMessage(error instanceof Error ? error.message : "Could not load public rooms.");
    } finally {
      setIsLoadingPublicRooms(false);
    }
  }

  async function runStaleRoomCleanup(showResult = false) {
    try {
      const result = await abandonStaleOnlineRooms();
      const total = result.lobbyAbandoned + result.activeAbandoned;

      if (showResult) {
        setMessage(total > 0 ? `Cleaned up ${total} stale room${total === 1 ? "" : "s"}.` : "No stale rooms found.");
      }

      return result;
    } catch (error) {
      if (showResult) {
        setMessage(error instanceof Error ? error.message : "Could not clean up stale rooms.");
      }

      return null;
    }
  }

  function rememberRoom(nextSnapshot: OnlineRoomSnapshot, nextLocalPlayer: OnlinePlayer) {
    const session = saveOnlineRoomSession(nextSnapshot, nextLocalPlayer);
    setRestoreSession(session);
  }

  function enterOnlineRoom(result: OnlineRoomSnapshot & { localPlayer: OnlinePlayer }, nextMessage: string) {
    if (result.room.status === "abandoned" || isOnlineRoomStale(result.room)) {
      clearOnlineRoomSession();
      setRestoreSession(null);
      setSnapshot(null);
      setLocalPlayer(null);
      setMessage("That room is no longer active. Create a new room to keep playing.");
      return;
    }

    setSnapshot(result);
    setLocalPlayer(result.localPlayer);
    rememberRoom(result, result.localPlayer);
    setMessage(nextMessage);
  }

  async function refreshRoom(roomId: string) {
    const nextSnapshot = await fetchOnlineRoomSnapshot(roomId);

    if (nextSnapshot.room.status === "abandoned" || isOnlineRoomStale(nextSnapshot.room)) {
      await runStaleRoomCleanup(false);
      clearOnlineRoomSession();
      setRestoreSession(null);
      setSnapshot(null);
      setLocalPlayer(null);
      setMessage("That room is no longer active. Create a new room to keep playing.");
      return;
    }

    const nextLocalPlayer = localPlayer
      ? nextSnapshot.players.find((player) => player.id === localPlayer.id) ?? localPlayer
      : null;

    setSnapshot(nextSnapshot);

    if (nextLocalPlayer) {
      setLocalPlayer(nextLocalPlayer);
      rememberRoom(nextSnapshot, nextLocalPlayer);
    }
  }

  function buildSettings(): GameConfig {
    const selectedDifficulty = getDifficultyConfig(difficulty);

    return {
      ...DEFAULT_CONFIG,
      difficulty,
      boardSize: selectedDifficulty.boardSize,
      totalRounds: Math.max(1, Math.min(rounds, 20)),
      flashDurationMs: selectedDifficulty.flashDurationMs,
      penaltySeconds: Math.max(0, Math.min(penaltySeconds, 10)),
    };
  }

  async function quickCreateRoom() {
    setIsBusy(true);
    setMessage("Creating room...");
    saveOnlineName(playerName);

    try {
      await runStaleRoomCleanup(false);
      const result = await createOnlineRoom({
        playerName,
        deviceId: getDeviceId(),
        gameType,
        settings: buildSettings(),
      });

      const visibilityResult = await setOnlineRoomVisibility(result.room.id, roomVisibility, maxPlayers);
      const nextSnapshot = visibilityResult.applied ? await fetchOnlineRoomSnapshot(result.room.id) : result;

      trackEvent("online_room_created", { gameType, visibility: roomVisibility, maxPlayers });
      enterOnlineRoom({ ...nextSnapshot, localPlayer: result.localPlayer }, visibilityResult.applied ? "Room created. Share the invite with your friend." : "Room created. Public/private controls need the latest Supabase migration.");
      void loadPublicRooms();
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
      await runStaleRoomCleanup(false);
      const result = await joinOnlineRoom({
        code: normalizedCode,
        playerName: name,
        deviceId: getDeviceId(),
      });

      setRoomCode(normalizedCode);
      trackEvent("online_room_joined", { code: normalizedCode, status: result.room.status });
      enterOnlineRoom(result, result.room.status === "finished" ? "Rejoined completed room." : "Joined room. Wait for the host to start.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not join room.");
    } finally {
      setIsBusy(false);
    }
  }

  async function restoreLastRoom(session = restoreSession) {
    if (!session) {
      return;
    }

    setIsRestoring(true);
    setMessage(`Reconnecting to room ${session.roomCode}...`);

    try {
      await runStaleRoomCleanup(false);
      const result = await joinOnlineRoom({
        code: session.roomCode,
        playerName: session.playerName || playerName,
        deviceId: getDeviceId(),
      });

      enterOnlineRoom(result, result.room.status === "finished" ? "Rejoined completed room." : "Reconnected to your room.");
    } catch (error) {
      clearOnlineRoomSession();
      setRestoreSession(null);
      setMessage(error instanceof Error ? error.message : "Could not rejoin last room.");
    } finally {
      setIsRestoring(false);
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
    setMessage(`Removing ${player.name}...`);

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

  async function handleRematch() {
    if (!snapshot || !localPlayer) {
      return;
    }

    setIsBusy(true);
    setMessage("Creating rematch room...");
    saveOnlineName(localPlayer.name);

    try {
      const result = await createOnlineRoom({
        playerName: localPlayer.name,
        deviceId: getDeviceId(),
        gameType: snapshot.room.game_type,
        settings: snapshot.room.settings,
      });

      const rematchVisibility = snapshot.room.visibility ?? "private";
      await setOnlineRoomVisibility(result.room.id, rematchVisibility, snapshot.room.max_players ?? maxPlayers);
      const nextSnapshot = await fetchOnlineRoomSnapshot(result.room.id);

      setGameType(snapshot.room.game_type);
      setRoomVisibility(rematchVisibility);
      setDifficulty(snapshot.room.settings.difficulty);
      setRounds(snapshot.room.settings.totalRounds);
      setPenaltySeconds(snapshot.room.settings.penaltySeconds);
      trackEvent("online_rematch_created", { gameType: snapshot.room.game_type, visibility: rematchVisibility });
      enterOnlineRoom({ ...nextSnapshot, localPlayer: result.localPlayer }, "Rematch room created. Share the new invite and start again.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create rematch room.");
    } finally {
      setIsBusy(false);
    }
  }

  function updatePlayerName(name: string) {
    setPlayerName(name);
    saveOnlineName(name);
  }

  function dismissLastRoom() {
    clearOnlineRoomSession();
    setRestoreSession(null);
    setMessage("Last room cleared.");
  }

  function closeRoomView() {
    setSnapshot(null);
    setLocalPlayer(null);
    setMessage(restoreSession ? `Room ${restoreSession.roomCode} saved. You can rejoin it from here.` : "");
    void loadPublicRooms();
  }

  useEffect(() => {
    async function initializeOnlinePage() {
      const savedName = getDefaultOnlineName();
      const savedSession = loadOnlineRoomSession();
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get("room")?.toUpperCase() ?? "";
      const shouldJoin = params.get("join") === "1";

      setPlayerName(savedName);
      setRestoreSession(savedSession);

      if (!hasSupabaseConfig()) {
        return;
      }

      await runStaleRoomCleanup(false);
      await loadPublicRooms();

      if (codeFromUrl) {
        setRoomCode(codeFromUrl);
        setAction("join");
      }

      if (codeFromUrl && shouldJoin) {
        autoActionStartedRef.current = true;
        await quickJoinRoom(codeFromUrl, savedName);
        return;
      }

      if (savedSession && !autoActionStartedRef.current) {
        autoActionStartedRef.current = true;
        await restoreLastRoom(savedSession);
      }
    }

    void initializeOnlinePage();
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

  if (isRestoring && !snapshot) {
    return (
      <main className="app-shell">
        <section className="flex h-full items-center justify-center px-2">
          <Card className="w-full max-w-xl overflow-hidden">
            <CardHeader className="border-b pb-4 text-center">
              <Badge variant="secondary" className="mx-auto mb-3 w-fit">Reconnecting</Badge>
              <CardTitle className="text-3xl font-semibold tracking-tight">Finding your room...</CardTitle>
              <CardDescription>Restoring your game after refresh. The browser forgot, so we reminded it.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 text-center text-sm text-muted-foreground sm:p-5" role="status" aria-live="polite">
              {message || "Reconnecting..."}
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  if (snapshot && localPlayer) {
    const isHost = localPlayer.is_host;
    const roomStatus = snapshot.room.status;
    const inviteUrl = getInviteUrl(snapshot.room.code);

    if (roomStatus === "finished") {
      return (
        <main className="app-shell">
          <ResultScreen
            players={onlinePlayersToGamePlayers(snapshot.players)}
            results={onlineResultsToTurnResults(snapshot.results)}
            bestScore={null}
            latestScore={null}
            isNewBest={false}
            onPlayAgain={handleRematch}
            playAgainLabel={isBusy ? "Creating Rematch..." : "Start Rematch"}
          />
        </main>
      );
    }

    if (roomStatus !== "lobby" && snapshot.room.game_type === "same_challenge") {
      return (
        <OnlineSameChallengeGame
          snapshot={snapshot}
          localPlayer={localPlayer}
          onRefresh={() => refreshRoom(snapshot.room.id)}
          onBackToLobby={closeRoomView}
        />
      );
    }

    if (roomStatus !== "lobby" && snapshot.room.game_type === "live_race") {
      return (
        <OnlineLiveRaceGame
          snapshot={snapshot}
          localPlayer={localPlayer}
          onRefresh={() => refreshRoom(snapshot.room.id)}
          onBackToLobby={closeRoomView}
        />
      );
    }

    return (
      <main className="app-shell">
        <section className="flex h-full items-center justify-center px-2">
          <Card className="w-full max-w-2xl overflow-hidden">
            <CardHeader className="border-b pb-4 text-center">
              <Badge variant="secondary" className="mx-auto mb-3 w-fit">Room ready</Badge>
              <CardTitle className="text-4xl font-semibold tracking-tight sm:text-6xl">{snapshot.room.code}</CardTitle>
              <CardDescription>
                {isHost ? "Share the invite, then start when your friend appears." : "You joined. Wait for the host to start."}
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{snapshot.room.visibility ?? "private"}</Badge>
                <Badge variant="outline">{snapshot.room.game_type === "same_challenge" ? "Same Challenge" : "Live Race"}</Badge>
                <Badge variant="outline">{snapshot.players.length}/{snapshot.room.max_players ?? 8} players</Badge>
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

              <div className="grid gap-2 rounded-lg border bg-muted/20 p-3 text-center text-sm text-muted-foreground">
                <div>{snapshot.players.length < 2 ? "Waiting for your friend..." : "Friend joined. Ready to start."}</div>
                <div>{snapshot.room.game_type === "same_challenge" ? "Same Challenge: turn-based, fair, and resilient." : "Live Race: simultaneous, fast, and mildly dramatic."}</div>
              </div>

              {message && <div className="text-center text-sm text-muted-foreground" role="status">{message}</div>}
            </CardContent>

            <CardFooter className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeRoomView}>Back</Button>
                <Button variant="ghost" onClick={() => refreshRoom(snapshot.room.id)}>Refresh</Button>
              </div>
              {isHost && roomStatus === "lobby" && (
                <Button onClick={handleStartRoom} disabled={isBusy || snapshot.players.length < 2}>
                  {snapshot.players.length < 2 ? "Waiting for Friend" : "Start Game"}
                </Button>
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
        <Card className="w-full max-w-2xl overflow-hidden">
          <CardHeader className="border-b pb-4 text-center">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit">Online Play</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-5xl">Play with a friend</CardTitle>
            <CardDescription>Create a room, share the code, join a public lobby, and pick the online style that fits the moment.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 p-4 sm:p-5">
            {restoreSession && (
              <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">Rejoin room {restoreSession.roomCode}</div>
                    <div className="text-muted-foreground">{restoreSession.playerName} · {getOnlineRoomSessionAge(restoreSession)}</div>
                  </div>
                  <Badge variant="outline">Saved</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button onClick={() => restoreLastRoom()} disabled={isBusy || isRestoring}>Rejoin Last Room</Button>
                  <Button variant="outline" onClick={dismissLastRoom}>Dismiss</Button>
                </div>
              </div>
            )}

            <OnlineModeExplainer value={gameType} onChange={setGameType} />

            <div className="flex rounded-full border bg-muted/20 p-1" aria-label="Choose online action">
              <button
                type="button"
                aria-pressed={action === "create"}
                onClick={() => setAction("create")}
                className={cn(
                  "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  action === "create" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
                )}
              >
                Create
              </button>
              <button
                type="button"
                aria-pressed={action === "join"}
                onClick={() => setAction("join")}
                className={cn(
                  "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  action === "join" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
                )}
              >
                Join
              </button>
            </div>

            {action === "create" && (
              <div className="grid gap-3 rounded-xl border bg-muted/20 p-3">
                <Label>Room privacy</Label>
                <div className="flex flex-wrap gap-2">
                  <ChoicePill active={roomVisibility === "private"} onClick={() => setRoomVisibility("private")}>Private invite</ChoicePill>
                  <ChoicePill active={roomVisibility === "public"} onClick={() => setRoomVisibility("public")}>Public lobby</ChoicePill>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max-players">Max players</Label>
                  <Input id="max-players" min={2} max={8} type="number" value={maxPlayers} onChange={(event) => setMaxPlayers(Number(event.target.value))} />
                </div>
              </div>
            )}

            {action === "create" ? (
              <Button size="lg" className="h-14 text-base" onClick={quickCreateRoom} disabled={isBusy}>
                {isBusy ? "Creating..." : roomVisibility === "public" ? "Create Public Game" : "Create Private Game"}
              </Button>
            ) : (
              <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
                <Label htmlFor="room-code">Room code</Label>
                <div className="flex gap-2">
                  <Input id="room-code" value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} placeholder="AB123" />
                  <Button onClick={() => quickJoinRoom()} disabled={isBusy || roomCode.trim().length === 0}>Join</Button>
                </div>
              </div>
            )}

            {action === "join" && (
              <PublicRoomBrowser
                rooms={publicRooms}
                unavailable={publicRoomsUnavailable}
                isLoading={isLoadingPublicRooms}
                onRefresh={() => void loadPublicRooms()}
                onJoin={(code) => void quickJoinRoom(code, playerName)}
              />
            )}

            <details className="rounded-lg border bg-muted/20 p-3">
              <summary className="cursor-pointer text-sm font-medium">Name and options</summary>
              <div className="mt-3 grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="player-name">Your name</Label>
                  <Input id="player-name" value={playerName} onChange={(event) => updatePlayerName(event.target.value)} />
                </div>

                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIFFICULTIES.map((item) => (
                      <ChoicePill key={item.id} active={difficulty === item.id} onClick={() => setDifficulty(item.id)}>{item.label}</ChoicePill>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="online-rounds">Rounds</Label>
                    <Input id="online-rounds" min={1} max={20} type="number" value={rounds} onChange={(event) => setRounds(Number(event.target.value))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="online-penalty">Penalty</Label>
                    <Input id="online-penalty" min={0} max={10} type="number" value={penaltySeconds} onChange={(event) => setPenaltySeconds(Number(event.target.value))} />
                  </div>
                </div>
              </div>
            </details>

            <OnlineRecoveryActions message={message} onClear={() => setMessage("")} onCleanup={() => void runStaleRoomCleanup(true)} />
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
