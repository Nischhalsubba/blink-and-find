"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTime } from "@/engine/scoring";
import { loadGlobalLeaderboard, loadLocalLeaderboard, type LeaderboardScore } from "@/lib/leaderboard";

function ScoreTable({ scores, emptyLabel }: { scores: LeaderboardScore[]; emptyLabel: string }) {
  if (scores.length === 0) {
    return <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">{emptyLabel}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Player</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Wrong</TableHead>
          <TableHead>Accuracy</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scores.map((score, index) => (
          <TableRow key={score.id}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{score.playerName}</TableCell>
            <TableCell>{formatTime(score.scoreMs)}</TableCell>
            <TableCell>{score.wrongTaps}</TableCell>
            <TableCell>{Math.round(score.accuracyPercent)}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function LeaderboardPageClient() {
  const [localScores, setLocalScores] = useState<LeaderboardScore[]>([]);
  const [globalScores, setGlobalScores] = useState<LeaderboardScore[]>([]);
  const [globalUnavailable, setGlobalUnavailable] = useState(false);

  useEffect(() => {
    setLocalScores(loadLocalLeaderboard());

    void loadGlobalLeaderboard("classic")
      .then((result) => {
        setGlobalScores(result.scores);
        setGlobalUnavailable(result.unavailable);
      })
      .catch(() => setGlobalUnavailable(true));
  }, []);

  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4 px-2 py-4">
        <Card className="overflow-hidden text-center">
          <CardHeader className="border-b">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit">Leaderboard</Badge>
            <CardTitle className="text-4xl font-semibold tracking-tight sm:text-6xl">Fastest humans</CardTitle>
            <CardDescription>
              Local scores work immediately. Global scores turn on after the Supabase leaderboard migration is applied.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Global leaderboard</CardTitle>
              <CardDescription>
                Shared classic-mode scores, with basic validation so the leaderboard does not instantly become clown math.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {globalUnavailable ? (
                <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Global leaderboard is not available yet. Run the Supabase production migration first.
                </div>
              ) : (
                <ScoreTable scores={globalScores} emptyLabel="No global scores yet." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Local leaderboard</CardTitle>
              <CardDescription>Saved on this device for quick testing and solo bragging rights.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreTable scores={localScores} emptyLabel="No local scores yet. Finish a game and save the result." />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardFooter className="flex flex-col gap-2 p-4 sm:flex-row sm:justify-between">
            <Button asChild variant="outline"><Link href="/">Back Home</Link></Button>
            <Button asChild><Link href="/practice">Play Practice</Link></Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
