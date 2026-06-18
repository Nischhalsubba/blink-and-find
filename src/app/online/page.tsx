"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import OnlineSameChallengeGame from "@/components/OnlineSameChallengeGame";
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
import {
  createOnlineRoom,
  fetchOnlineRoomSnapshot,
  joinOnlineRoom,
  startOnlineRoom,
  subscribeToOnlineRoom,
} from "@/lib/onlineRooms";
import { hasSupabaseConfig } from "@/lib/supabase";
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

export default function OnlinePage() {
  const autoActionStartedRef = useRef(false);
  const [action, setAction] = useState<OnlineAction>("create");
  const [playerName, setPlayerName] = useState("Player");
  const [roomCode, setRoomCode] = useState("");
  const [gameType, setGameType] = useState<OnlineGameType>("same_challenge");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [rounds, setRounds] = useState(5);
  const [penaltySeconds, setPenaltySeconds] = useState(3);
  const [snapshot, setSnapshot] = useState<OnlineRoomSnapshot | null>(null);
  const [localPlayer, setLocalPlayer] = useState<OnlinePlayer | null>(null);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function refreshRoom(roomId: string) {
    const nextSnapshot = await fetchOnlineRoomSnapshot(roomId);
    setSnapshot(nextSnapshot);
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
      const result = await createOnlineRoom({
        playerName,
        deviceId: getDeviceId(),
        gameType,
        settings: buildSettings(),
      });

      setSnapshot(result);
      setLocalPlayer(result.localPlayer);
      setMessage("Room created. Share the invite link.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create room.");
    } finally {
      setIsBusy(false);
    }
  }

  async function quickJoinRoom(code = roomCode) {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      setMessage("Enter the room code.");
      return;
    }

    setIsBusy(true);
    setMessage("Joining room...");
    saveOnlineName(playerName);

    try {
      const result = await joinOnlineRoom({
        code: normalizedCode,
        playerName,
        deviceId: getDeviceId(),
      });

      setRoomCode(normalizedCode);
      setSnapshot(result);
      setLocalPlayer(result.localPlayer);
      setMessage("Joined room.");
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

  async function copyInvite() {
    if (!snapshot) {
      return;
    }

    const inviteUrl = `${window.location.origin}/online?room=${snapshot.room.code}&join=1`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setMessage("Invite copied. Send it to your friend.");
    } catch {
      setMessage(inviteUrl);
    }
  }

  function updatePlayerName(name: string) {
    setPlayerName(name);
    saveOnlineName(name);
  }

  useEffect(() => {
    setPlayerName(getDefaultOnlineName());
  }, []);

  useEffect(() => {
    if (autoActionStartedRef.current || !hasSupabaseConfig()) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get("room")?.toUpperCase() ?? "";
    const shouldJoin = params.get("join") === "1";

    if (codeFromUrl) {
      setRoomCode(codeFromUrl);
      setAction("join");
    }

    if (codeFromUrl && shouldJoin) {
      autoActionStartedRef.current = true;
      void quickJoinRoom(codeFromUrl);
    }
  }, [playerName]);

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
  }, [snapshot?.room.id]);

  if (!hasSupabaseConfig()) {
    return (
      <main className="app-shell">
        <section className="flex h-full items-center justify-center px-2">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle>Online Play needs Supabase</CardTitle>
              <CardDescription>Add the Supabase environment variables locally and in Vercel.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then run the SQL in supabase/schema.sql.
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline">
                <Link href="/">Back</Link>
              </Button>
            </CardFooter>
          </Card>
        </section>
      </main>
    );
  }

  if (snapshot && localPlayer) {
    const isHost = localPlayer.is_host;
    const roomStatus = snapshot.room.status;

    if (roomStatus !== "lobby" && snapshot.room.game_type === "same_challenge") {
      return (
        <OnlineSameChallengeGame
          snapshot={snapshot}
          localPlayer={localPlayer}
          onRefresh={() => refreshRoom(snapshot.room.id)}
          onBackToLobby={() => setSnapshot(null)}
        />
      );
    }

    if (roomStatus !== "lobby" && snapshot.room.game_type === "live_race") {
      return (
        <main className="app-shell">
          <section className="flex h-full items-center justify-center px-2">
            <Card className="w-full max-w-xl overflow-hidden">
              <CardHeader className="border-b pb-4">
                <Badge variant="secondary" className="mb-3 w-fit">Live Race</Badge>
                <CardTitle className="text-3xl font-semibold tracking-tight">Live Race is coming next</CardTitle>
                <CardDescription>The room is synced. Simultaneous gameplay is the next build step.</CardDescription>
              </CardHeader>
              <CardFooter className="border-t p-4 sm:p-5">
                <Button variant="outline" onClick={() => setSnapshot(null)}>Back</Button>
              </CardFooter>
            </Card>
          </section>
        </main>
      );
    }

    return (
      <main className="app-shell">
        <section className="flex h-full items-center justify-center px-2">
          <Card className="w-full max-w-2xl overflow-hidden">
            <CardHeader className="border-b pb-4 text-center">
              <Badge variant="secondary" className="mx-auto mb-3 w-fit">Room ready</Badge>
              <CardTitle className="text-4xl font-semibold tracking-tight sm:text-6xl">{snapshot.room.code}</CardTitle>
              <CardDescription>Share the invite. Start when your friend appears.</CardDescription>
            </CardHeader>

            <CardContent className="grid gap-4 p-4 sm:p-5">
              <div className="grid gap-2">
                {snapshot.players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between rounded-lg border bg-muted/20 p-3 text-sm">
                    <div className="font-medium">{player.name}</div>
                    <div className="flex items-center gap-2">
                      {player.is_host && <Badge variant="secondary">Host</Badge>}
                      {player.id === localPlayer.id && <Badge variant="outline">You</Badge>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 text-center text-sm text-muted-foreground">
                {snapshot.players.length < 2 ? "Waiting for your friend..." : "Friend joined. Ready to start."}
              </div>

              {message && <div className="text-center text-sm text-muted-foreground" role="status">{message}</div>}
            </CardContent>

            <CardFooter className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <Button asChild variant="outline">
                <Link href="/">Back</Link>
              </Button>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button variant="outline" onClick={copyInvite}>Copy Invite</Button>
                {isHost && roomStatus === "lobby" && (
                  <Button onClick={handleStartRoom} disabled={isBusy || snapshot.players.length < 2}>
                    Start Game
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="flex h-full items-center justify-center px-2">
        <Card className="w-full max-w-xl overflow-hidden">
          <CardHeader className="border-b pb-4 text-center">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit">Online Play</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-5xl">Play with a friend</CardTitle>
            <CardDescription>Create a room or join one. That is the whole job.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 p-4 sm:p-5">
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

            {action === "create" ? (
              <Button size="lg" className="h-14 text-base" onClick={quickCreateRoom} disabled={isBusy}>
                {isBusy ? "Creating..." : "Create Game"}
              </Button>
            ) : (
              <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
                <Label htmlFor="room-code">Room code</Label>
                <div className="flex gap-2">
                  <Input
                    id="room-code"
                    value={roomCode}
                    onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                    placeholder="AB123"
                  />
                  <Button onClick={() => quickJoinRoom()} disabled={isBusy || roomCode.trim().length === 0}>
                    Join
                  </Button>
                </div>
              </div>
            )}

            <details className="rounded-lg border bg-muted/20 p-3">
              <summary className="cursor-pointer text-sm font-medium">Name and options</summary>
              <div className="mt-3 grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="player-name">Your name</Label>
                  <Input id="player-name" value={playerName} onChange={(event) => updatePlayerName(event.target.value)} />
                </div>

                <div className="grid gap-2">
                  <Label>Game type</Label>
                  <div className="flex flex-wrap gap-2">
                    <ChoicePill active={gameType === "same_challenge"} onClick={() => setGameType("same_challenge")}>
                      Same Challenge
                    </ChoicePill>
                    <ChoicePill active={gameType === "live_race"} onClick={() => setGameType("live_race")}>
                      Live Race
                    </ChoicePill>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIFFICULTIES.map((item) => (
                      <ChoicePill key={item.id} active={difficulty === item.id} onClick={() => setDifficulty(item.id)}>
                        {item.label}
                      </ChoicePill>
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

            {message && <div className="text-center text-sm text-muted-foreground" role="status">{message}</div>}
          </CardContent>

          <CardFooter className="border-t p-4 sm:p-5">
            <Button asChild variant="outline">
              <Link href="/">Back</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
