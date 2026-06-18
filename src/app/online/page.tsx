"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Difficulty, GameConfig } from "@/types/game";
import type { OnlineGameType, OnlinePlayer, OnlineRoomSnapshot } from "@/types/online";

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

export default function OnlinePage() {
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

  async function handleCreateRoom() {
    setIsBusy(true);
    setMessage("");

    try {
      const selectedDifficulty = getDifficultyConfig(difficulty);
      const settings: GameConfig = {
        ...DEFAULT_CONFIG,
        difficulty,
        boardSize: selectedDifficulty.boardSize,
        totalRounds: Math.max(1, Math.min(rounds, 20)),
        flashDurationMs: selectedDifficulty.flashDurationMs,
        penaltySeconds: Math.max(0, Math.min(penaltySeconds, 10)),
      };
      const result = await createOnlineRoom({
        playerName,
        deviceId: getDeviceId(),
        gameType,
        settings,
      });

      setSnapshot(result);
      setLocalPlayer(result.localPlayer);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create room.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleJoinRoom() {
    setIsBusy(true);
    setMessage("");

    try {
      const result = await joinOnlineRoom({
        code: roomCode,
        playerName,
        deviceId: getDeviceId(),
      });

      setSnapshot(result);
      setLocalPlayer(result.localPlayer);
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
    setMessage("");

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

    const inviteUrl = `${window.location.origin}/online?room=${snapshot.room.code}`;
    await navigator.clipboard.writeText(inviteUrl);
    setMessage("Invite link copied.");
  }

  if (!hasSupabaseConfig()) {
    return (
      <main className="app-shell">
        <section className="flex h-full items-center justify-center px-2">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle>Online Play needs Supabase</CardTitle>
              <CardDescription>
                Add the Supabase environment variables locally and in Vercel. Software, naturally, refuses to read minds.
              </CardDescription>
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

    return (
      <main className="app-shell">
        <section className="flex h-full items-center justify-center px-2">
          <Card className="w-full max-w-2xl overflow-hidden">
            <CardHeader className="border-b pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="secondary" className="mb-3">Online Room</Badge>
                  <CardTitle className="text-3xl font-semibold tracking-tight">Room {snapshot.room.code}</CardTitle>
                  <CardDescription>
                    {snapshot.room.game_type === "same_challenge" ? "Same Challenge" : "Live Race"} · {roomStatus}
                  </CardDescription>
                </div>
                <Badge variant="outline">{snapshot.players.length} players</Badge>
              </div>
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

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-muted-foreground">Rounds</div>
                  <div className="font-semibold">{snapshot.room.settings.totalRounds}</div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-muted-foreground">Tiles</div>
                  <div className="font-semibold">{snapshot.room.settings.boardSize}</div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-muted-foreground">Penalty</div>
                  <div className="font-semibold">+{snapshot.room.settings.penaltySeconds}s</div>
                </div>
              </div>

              {roomStatus !== "lobby" && (
                <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                  First online sync is ready. Next step is connecting this room state to the shared turn-based gameplay screen.
                </div>
              )}

              {message && <div className="text-sm text-muted-foreground" role="status">{message}</div>}
            </CardContent>

            <CardFooter className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <Button asChild variant="outline">
                <Link href="/">Back</Link>
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyInvite}>Copy Invite</Button>
                {isHost && roomStatus === "lobby" && (
                  <Button onClick={handleStartRoom} disabled={isBusy || snapshot.players.length < 2}>
                    Start Room
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
        <Card className="w-full max-w-2xl overflow-hidden">
          <CardHeader className="border-b pb-4">
            <Badge variant="secondary" className="mb-3 w-fit">Online Play</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight">Create or join a room</CardTitle>
            <CardDescription>
              Same Challenge is turn-based. Live Race is planned on the same room foundation.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5 p-4 sm:p-5">
            <div className="grid gap-2">
              <Label htmlFor="player-name">Your name</Label>
              <Input id="player-name" value={playerName} onChange={(event) => setPlayerName(event.target.value)} />
            </div>

            <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
              <div className="grid gap-2">
                <Label htmlFor="game-type">Game type</Label>
                <Select value={gameType} onValueChange={(value) => setGameType(value as OnlineGameType)}>
                  <SelectTrigger id="game-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same_challenge">Same Challenge</SelectItem>
                    <SelectItem value="live_race">Live Race</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="grid gap-2 sm:col-span-1">
                  <Label htmlFor="online-difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={(value) => setDifficulty(value as Difficulty)}>
                    <SelectTrigger id="online-difficulty"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((item) => (
                        <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="online-rounds">Rounds</Label>
                  <Input id="online-rounds" min={1} max={20} type="number" value={rounds} onChange={(event) => setRounds(Number(event.target.value))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="online-penalty">Penalty</Label>
                  <Input id="online-penalty" min={0} max={10} type="number" value={penaltySeconds} onChange={(event) => setPenaltySeconds(Number(event.target.value))} />
                </div>
              </div>

              <Button onClick={handleCreateRoom} disabled={isBusy}>Create Room</Button>
            </div>

            <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
              <div className="grid gap-2">
                <Label htmlFor="room-code">Room code</Label>
                <Input id="room-code" value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} placeholder="AB123" />
              </div>
              <Button variant="outline" onClick={handleJoinRoom} disabled={isBusy || roomCode.trim().length === 0}>Join Room</Button>
            </div>

            {message && <div className="text-sm text-muted-foreground" role="status">{message}</div>}
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
