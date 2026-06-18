"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTime } from "@/engine/scoring";
import { getDeviceId } from "@/lib/device";
import { fetchOnlineHistory, type OnlineHistorySnapshot } from "@/lib/onlineHistory";
import { hasSupabaseConfig } from "@/lib/supabase";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState<OnlineHistorySnapshot | null>(null);
  const [selectedRoomCode, setSelectedRoomCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHistory() {
    setIsLoading(true);
    setError("");

    try {
      const snapshot = await fetchOnlineHistory(getDeviceId(), 40);
      setHistory(snapshot);
      setSelectedRoomCode((current) => current ?? snapshot.rooms[0]?.room.code ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load online history.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setIsLoading(false);
      setError("Supabase is not configured for online history.");
      return;
    }

    void loadHistory();
  }, []);

  const selectedRoom = useMemo(() => {
    if (!history || !selectedRoomCode) {
      return null;
    }

    return history.rooms.find((room) => room.room.code === selectedRoomCode) ?? history.rooms[0] ?? null;
  }, [history, selectedRoomCode]);

  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto grid min-h-full w-full max-w-6xl gap-4 py-4">
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="secondary" className="mb-3 w-fit">Central History</Badge>
                <CardTitle className="text-3xl font-semibold tracking-tight sm:text-5xl">Online results</CardTitle>
                <CardDescription>Finished rooms, player rankings, and round-by-round details saved in Supabase.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadHistory} disabled={isLoading}>Refresh</Button>
                <Button asChild variant="outline"><Link href="/">Back</Link></Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {isLoading && (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Loading online history...</CardContent></Card>
        )}

        {!isLoading && error && (
          <Card><CardContent className="p-6 text-center text-sm text-destructive">{error}</CardContent></Card>
        )}

        {!isLoading && !error && history && history.rooms.length === 0 && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b text-center">
              <Badge variant="secondary" className="mx-auto mb-3 w-fit">History</Badge>
              <CardTitle>No finished online games yet</CardTitle>
              <CardDescription>Complete a Same Challenge room and it will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 text-center">
              <Button asChild><Link href="/online">Create Online Game</Link></Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && history && history.rooms.length > 0 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Finished games" value={history.totals.finishedRooms} />
              <StatCard label="Players" value={history.totals.players} />
              <StatCard label="Rounds" value={history.totals.rounds} />
              <StatCard label="Results" value={history.totals.results} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <Card className="overflow-hidden">
                <CardHeader className="border-b">
                  <CardTitle>Recent games</CardTitle>
                  <CardDescription>Latest finished online rooms.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>Winner</TableHead>
                        <TableHead>Players</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.rooms.map((room) => (
                        <TableRow key={room.room.id} data-state={selectedRoom?.room.id === room.room.id ? "selected" : undefined}>
                          <TableCell className="font-medium">{room.room.code}</TableCell>
                          <TableCell>{room.winner?.name ?? "-"}</TableCell>
                          <TableCell>{room.players.length}</TableCell>
                          <TableCell>{formatDate(room.completedAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => setSelectedRoomCode(room.room.code)}>View</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="border-b">
                  <CardTitle>Player leaderboard</CardTitle>
                  <CardDescription>Grouped by player name and browser.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>Games</TableHead>
                        <TableHead>Wins</TableHead>
                        <TableHead className="text-right">Avg</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.leaderboard.slice(0, 12).map((player, index) => (
                        <TableRow key={`${player.name}-${index}`}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{player.name}</span>
                              {player.isCurrentDevice && <Badge variant="secondary">You</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>{player.gamesPlayed}</TableCell>
                          <TableCell>{player.wins}</TableCell>
                          <TableCell className="text-right font-medium">{formatTime(player.averageTimeMs)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {selectedRoom && (
              <Card className="overflow-hidden">
                <CardHeader className="border-b">
                  <Badge variant="secondary" className="mb-3 w-fit">Room {selectedRoom.room.code}</Badge>
                  <CardTitle>Game details</CardTitle>
                  <CardDescription>{formatDate(selectedRoom.completedAt)} · {selectedRoom.players.length} players · {selectedRoom.totalRounds} rounds</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 p-4 sm:p-5">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedRoom.players.map((player, index) => (
                      <div key={player.id} className="rounded-xl border bg-muted/20 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold">#{index + 1} {player.name}</div>
                          {selectedRoom.winner?.id === player.id && <Badge>Winner</Badge>}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {formatTime(player.total_time_ms)} · {player.wrong_taps} wrong taps
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Round</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Wrong</TableHead>
                          <TableHead className="text-right">Final time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRoom.results.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>{result.round_number}</TableCell>
                            <TableCell>{result.player_name}</TableCell>
                            <TableCell>{result.target_number}</TableCell>
                            <TableCell>{result.wrong_taps}</TableCell>
                            <TableCell className="text-right font-medium">{formatTime(result.final_time_ms)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </section>
    </main>
  );
}
