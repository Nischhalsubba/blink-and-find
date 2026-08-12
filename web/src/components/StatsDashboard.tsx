"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTime } from "@/engine/scoring";
import { loadBestScores, type SavedScore } from "@/lib/storage";

const PRACTICE_STORAGE_KEY = "blink-and-find-practice-rounds";
const DAILY_STORAGE_PREFIX = "blink-and-find-daily-result:";
const TIME_ATTACK_STORAGE_KEY = "blink-and-find-time-attack-best";
const STREAK_STORAGE_KEY = "blink-and-find-streak-best";

interface TimeAttackBest {
  correct: number;
  wrong: number;
  accuracy: number;
  difficulty: string;
  completedAt: string;
}

interface StreakBest {
  streak: number;
  difficulty: string;
  completedAt: string;
}

interface DailyBest {
  dateKey: string;
  finalTimeMs: number;
  wrongTaps: number;
  attempts: number;
  completedAt: string;
}

interface LocalStatsSnapshot {
  scores: SavedScore[];
  practiceRounds: number;
  dailyResults: DailyBest[];
  timeAttackBest: TimeAttackBest | null;
  streakBest: StreakBest | null;
}

interface Achievement {
  title: string;
  description: string;
  unlocked: boolean;
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

function loadDailyResults(): DailyBest[] {
  if (typeof window === "undefined") {
    return [];
  }

  return Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
    .filter((key): key is string => Boolean(key?.startsWith(DAILY_STORAGE_PREFIX)))
    .map((key) => readJson<DailyBest>(key))
    .filter((result): result is DailyBest => Boolean(result))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

function getPracticeRounds() {
  if (typeof window === "undefined") {
    return 0;
  }

  const value = Number(window.localStorage.getItem(PRACTICE_STORAGE_KEY) ?? "0");
  return Number.isFinite(value) ? value : 0;
}

function loadLocalStats(): LocalStatsSnapshot {
  return {
    scores: loadBestScores(),
    practiceRounds: getPracticeRounds(),
    dailyResults: loadDailyResults(),
    timeAttackBest: readJson<TimeAttackBest>(TIME_ATTACK_STORAGE_KEY),
    streakBest: readJson<StreakBest>(STREAK_STORAGE_KEY),
  };
}

function buildAchievements(snapshot: LocalStatsSnapshot): Achievement[] {
  const hasCleanScore = snapshot.scores.some((score) => score.totalWrongTaps === 0);
  const hasHardScore = snapshot.scores.some((score) => score.difficulty === "hard") || snapshot.streakBest?.difficulty === "hard" || snapshot.timeAttackBest?.difficulty === "hard";

  return [
    {
      title: "First Finish",
      description: "Complete one local game.",
      unlocked: snapshot.scores.length > 0,
    },
    {
      title: "Clean Eyes",
      description: "Finish a saved game with zero wrong taps.",
      unlocked: hasCleanScore,
    },
    {
      title: "Practice Habit",
      description: "Complete 10 pressure-free practice boards.",
      unlocked: snapshot.practiceRounds >= 10,
    },
    {
      title: "Daily Hunter",
      description: "Complete at least one Daily Challenge.",
      unlocked: snapshot.dailyResults.length > 0,
    },
    {
      title: "Sprint Goblin",
      description: "Find 10 or more targets in Time Attack.",
      unlocked: (snapshot.timeAttackBest?.correct ?? 0) >= 10,
    },
    {
      title: "No-Miss Chain",
      description: "Reach a 5-target streak.",
      unlocked: (snapshot.streakBest?.streak ?? 0) >= 5,
    },
    {
      title: "Hard Mode Survivor",
      description: "Record any result on Hard difficulty.",
      unlocked: Boolean(hasHardScore),
    },
    {
      title: "Persistent Human",
      description: "Save at least five local game results.",
      unlocked: snapshot.scores.length >= 5,
    },
  ];
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <Card className="gap-0 bg-muted/20 shadow-none">
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
        {detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
      </CardContent>
    </Card>
  );
}

export default function StatsDashboard() {
  const [snapshot, setSnapshot] = useState<LocalStatsSnapshot>({
    scores: [],
    practiceRounds: 0,
    dailyResults: [],
    timeAttackBest: null,
    streakBest: null,
  });

  const achievements = useMemo(() => buildAchievements(snapshot), [snapshot]);
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;
  const bestScore = snapshot.scores[0] ?? null;
  const averageAccuracy = snapshot.scores.length > 0
    ? snapshot.scores.reduce((total, score) => total + score.accuracyPercent, 0) / snapshot.scores.length
    : 0;

  function refreshStats() {
    setSnapshot(loadLocalStats());
  }

  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto grid min-h-full w-full max-w-6xl gap-4 py-4">
        <Card className="overflow-hidden">
          <CardHeader className="border-b p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <Badge variant="secondary" className="mb-3 w-fit">Personal Stats</Badge>
                <CardTitle className="text-3xl font-semibold tracking-tight sm:text-5xl">Your progress</CardTitle>
                <CardDescription>
                  Local scores, practice reps, daily results, and achievements saved on this device. No account required, because sometimes restraint exists.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={refreshStats}>Refresh</Button>
                <Button asChild variant="outline"><Link href="/">Back Home</Link></Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Saved games" value={snapshot.scores.length} detail={bestScore ? `Best: ${bestScore.winnerName}` : "Finish a local game to start"} />
          <StatCard label="Practice reps" value={snapshot.practiceRounds} detail="Pressure-free boards completed" />
          <StatCard label="Daily challenges" value={snapshot.dailyResults.length} detail="Best daily result per date" />
          <StatCard label="Achievements" value={`${unlockedCount}/${achievements.length}`} detail="Tiny badges, suspicious motivation" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle>Best modes</CardTitle>
              <CardDescription>Your strongest saved results across local modes.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-4">
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-sm text-muted-foreground">Best local game</div>
                <div className="mt-1 font-semibold">
                  {bestScore ? `${bestScore.winnerName} · ${formatTime(bestScore.winnerTimeMs)} · ${bestScore.accuracyPercent.toFixed(0)}%` : "No local score yet"}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-sm text-muted-foreground">Time Attack</div>
                <div className="mt-1 font-semibold">
                  {snapshot.timeAttackBest ? `${snapshot.timeAttackBest.correct} found · ${snapshot.timeAttackBest.accuracy}% accuracy` : "No sprint yet"}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-sm text-muted-foreground">Streak Mode</div>
                <div className="mt-1 font-semibold">
                  {snapshot.streakBest ? `${snapshot.streakBest.streak} clean find${snapshot.streakBest.streak === 1 ? "" : "s"}` : "No streak yet"}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-sm text-muted-foreground">Average saved accuracy</div>
                <div className="mt-1 font-semibold">{snapshot.scores.length > 0 ? `${averageAccuracy.toFixed(0)}%` : "-"}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Unlocked from local play, practice, daily, sprint, and streak mode.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 p-4 sm:grid-cols-2">
              {achievements.map((achievement) => (
                <div key={achievement.title} className="rounded-xl border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">{achievement.title}</div>
                    <Badge variant={achievement.unlocked ? "default" : "outline"}>{achievement.unlocked ? "Unlocked" : "Locked"}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{achievement.description}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle>Saved local games</CardTitle>
            <CardDescription>Top saved results from this browser.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.scores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      No saved local games yet. The statistics goblin awaits data.
                    </TableCell>
                  </TableRow>
                )}
                {snapshot.scores.map((score, index) => (
                  <TableRow key={score.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{score.winnerName}</TableCell>
                    <TableCell>{score.mode}</TableCell>
                    <TableCell>{score.difficulty}</TableCell>
                    <TableCell>{score.accuracyPercent.toFixed(0)}%</TableCell>
                    <TableCell className="text-right font-medium">{formatTime(score.winnerTimeMs)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-end">
            <Button asChild variant="outline"><Link href="/daily">Daily Challenge</Link></Button>
            <Button asChild variant="outline"><Link href="/time-attack">Time Attack</Link></Button>
            <Button asChild><Link href="/streak">Streak Mode</Link></Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
