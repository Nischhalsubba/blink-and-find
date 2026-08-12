"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NumberGrid from "@/components/NumberGrid";
import ShareableResultCard from "@/components/ShareableResultCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateZigZagBoard } from "@/engine/board";
import { DIFFICULTIES } from "@/lib/gameDefaults";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/types/game";

const STREAK_STORAGE_KEY = "blink-and-find-streak-best";

type StreakPhase = "ready" | "playing" | "ended";

interface StreakBest {
  streak: number;
  difficulty: Difficulty;
  completedAt: string;
}

function pickTarget(board: number[]) {
  return board[Math.floor(Math.random() * board.length)] ?? null;
}

function createRound(difficulty: Difficulty) {
  const preset = DIFFICULTIES.find((item) => item.id === difficulty) ?? DIFFICULTIES[1];
  const board = generateZigZagBoard(preset.boardSize);

  return {
    board,
    target: pickTarget(board),
    preset,
    scatterKey: Date.now() + Math.random(),
  };
}

function loadBest(): StreakBest | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(STREAK_STORAGE_KEY);
    return value ? JSON.parse(value) as StreakBest : null;
  } catch {
    return null;
  }
}

function saveBest(best: StreakBest) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(best));
  }
}

function ModePill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-2 text-sm font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-muted/20 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {label}
    </button>
  );
}

export default function StreakMode() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [{ board, target, preset, scatterKey }, setRound] = useState(() => createRound("easy"));
  const [phase, setPhase] = useState<StreakPhase>("ready");
  const [streak, setStreak] = useState(0);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectionWrong, setSelectionWrong] = useState(false);
  const [best, setBest] = useState<StreakBest | null>(null);
  const [message, setMessage] = useState("Build the longest clean streak you can. One wrong tap ends the run, because mercy apparently has limits.");

  function resetRound(nextDifficulty = difficulty) {
    setRound(createRound(nextDifficulty));
    setSelectedNumber(null);
    setSelectionWrong(false);
  }

  function startRun() {
    setPhase("playing");
    setStreak(0);
    resetRound();
    setMessage("Run started. Find the target. Do not tap nonsense. Simple, allegedly.");
  }

  function endRun() {
    const result: StreakBest = {
      streak,
      difficulty,
      completedAt: new Date().toISOString(),
    };

    if (!best || result.streak > best.streak) {
      setBest(result);
      saveBest(result);
      setMessage("New streak best saved. Clean hands, sharp eyes, minimal chaos.");
    } else {
      setMessage("Streak ended. Your previous best is still sitting there looking smug.");
    }

    setPhase("ended");
  }

  function handleDifficultyChange(nextDifficulty: Difficulty) {
    if (phase === "playing") {
      return;
    }

    setDifficulty(nextDifficulty);
    resetRound(nextDifficulty);
  }

  function handleSelect(number: number) {
    if (phase !== "playing" || target === null) {
      return;
    }

    setSelectedNumber(number);

    if (number !== target) {
      setSelectionWrong(true);
      endRun();
      return;
    }

    setStreak((current) => current + 1);
    setSelectionWrong(false);
    setMessage("Correct. Streak continues.");
    resetRound();
  }

  useEffect(() => {
    setBest(loadBest());
  }, []);

  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto grid min-h-full w-full max-w-6xl gap-3 py-3 lg:grid-cols-[0.38fr_0.62fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b p-4 sm:p-5">
            <Badge variant="secondary" className="mb-3 w-fit">Streak Mode</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">One mistake ends it</CardTitle>
            <CardDescription>
              Keep finding targets until your first wrong tap. It is focus training with a dramatic exit door.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3 p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((item) => (
                <ModePill key={item.id} active={difficulty === item.id} label={item.label} onClick={() => handleDifficultyChange(item.id)} />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Target</div>
                <div className="text-3xl font-bold tracking-tight">{target ?? "-"}</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Current</div>
                <div className="text-3xl font-bold tracking-tight">{streak}</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Best</div>
                <div className="text-3xl font-bold tracking-tight">{best?.streak ?? 0}</div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground" role="status" aria-live="polite">
              {message}
            </div>

            {phase === "ended" && (
              <ShareableResultCard
                eyebrow="Streak Mode"
                title={`${streak} clean find${streak === 1 ? "" : "s"}`}
                subtitle={`${preset.label} board · one wrong tap ended it`}
                primaryLabel="Final streak"
                primaryValue={String(streak)}
                metrics={[
                  { label: "Best", value: String(best?.streak ?? streak) },
                  { label: "Difficulty", value: preset.label },
                  { label: "Rule", value: "1 miss ends" },
                  { label: "Mode", value: "Focus" },
                ]}
                footer="Try Streak Mode in Blink & Find"
                filename="blink-find-streak.svg"
                shareText={`I reached a ${streak}-target streak in Blink & Find Streak Mode.`}
              />
            )}

            <Button onClick={startRun}>{phase === "playing" ? "Restart Streak" : "Start Streak"}</Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-between sm:p-5">
            <Button asChild variant="ghost"><Link href="/time-attack">Time Attack</Link></Button>
            <Button asChild variant="outline"><Link href="/">Back Home</Link></Button>
          </CardFooter>
        </Card>

        <Card className="min-h-[60dvh] overflow-hidden lg:min-h-0">
          <CardHeader className="border-b p-4 sm:p-5">
            <CardTitle>Find {target ?? "the target"}</CardTitle>
            <CardDescription>{preset.label} board · {phase === "playing" ? "keep the streak clean" : "start a streak first"}</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[52dvh] items-center justify-center p-2 sm:p-4 lg:min-h-[calc(100dvh-9rem)]">
            <NumberGrid
              numbers={board}
              targetNumber={target}
              selectedNumber={selectedNumber}
              isSelectionWrong={selectionWrong}
              scatterKey={scatterKey}
              disabled={phase !== "playing"}
              onSelect={handleSelect}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
