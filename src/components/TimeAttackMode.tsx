"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import NumberGrid from "@/components/NumberGrid";
import ShareableResultCard from "@/components/ShareableResultCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateZigZagBoard } from "@/engine/board";
import { DIFFICULTIES } from "@/lib/gameDefaults";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/types/game";

const TIME_ATTACK_DURATION_MS = 60_000;
const TIME_ATTACK_STORAGE_KEY = "blink-and-find-time-attack-best";

type TimeAttackPhase = "ready" | "playing" | "finished";

interface TimeAttackBest {
  correct: number;
  wrong: number;
  accuracy: number;
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

function loadBest(): TimeAttackBest | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(TIME_ATTACK_STORAGE_KEY);
    return value ? JSON.parse(value) as TimeAttackBest : null;
  } catch {
    return null;
  }
}

function saveBest(best: TimeAttackBest) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TIME_ATTACK_STORAGE_KEY, JSON.stringify(best));
  }
}

function isBetterScore(next: TimeAttackBest, previous: TimeAttackBest | null) {
  if (!previous) {
    return true;
  }

  if (next.correct !== previous.correct) {
    return next.correct > previous.correct;
  }

  if (next.wrong !== previous.wrong) {
    return next.wrong < previous.wrong;
  }

  return next.accuracy > previous.accuracy;
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

export default function TimeAttackMode() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [{ board, target, preset, scatterKey }, setRound] = useState(() => createRound("easy"));
  const [phase, setPhase] = useState<TimeAttackPhase>("ready");
  const [remainingMs, setRemainingMs] = useState(TIME_ATTACK_DURATION_MS);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectionWrong, setSelectionWrong] = useState(false);
  const [message, setMessage] = useState("Find as many targets as you can in 60 seconds. Calm speed beats chaos, annoyingly.");
  const [best, setBest] = useState<TimeAttackBest | null>(null);
  const endsAtRef = useRef<number | null>(null);

  const accuracy = useMemo(() => {
    const total = correct + wrong;
    return total === 0 ? 100 : Math.round((correct / total) * 100);
  }, [correct, wrong]);

  function resetRound(nextDifficulty = difficulty) {
    setRound(createRound(nextDifficulty));
    setSelectedNumber(null);
    setSelectionWrong(false);
  }

  function finishRun() {
    endsAtRef.current = null;
    setRemainingMs(0);
    setPhase("finished");

    const run: TimeAttackBest = {
      correct,
      wrong,
      accuracy,
      difficulty,
      completedAt: new Date().toISOString(),
    };

    if (isBetterScore(run, best)) {
      setBest(run);
      saveBest(run);
      setMessage("New Time Attack best saved. The clock has been mildly embarrassed.");
    } else {
      setMessage("Run complete. Your previous best survived this little incident.");
    }
  }

  function startRun() {
    endsAtRef.current = Date.now() + TIME_ATTACK_DURATION_MS;
    setPhase("playing");
    setRemainingMs(TIME_ATTACK_DURATION_MS);
    setCorrect(0);
    setWrong(0);
    setMessage("Go. Find the target, then another, then another. Elegant panic only.");
    resetRound();
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
      setWrong((current) => current + 1);
      setSelectionWrong(true);
      setMessage(`Not ${number}. No time penalty, just wounded pride.`);
      return;
    }

    setCorrect((current) => current + 1);
    setSelectionWrong(false);
    setMessage("Correct. New target loaded.");
    resetRound();
  }

  useEffect(() => {
    setBest(loadBest());
  }, []);

  useEffect(() => {
    if (phase !== "playing") {
      return;
    }

    const timer = window.setInterval(() => {
      if (endsAtRef.current === null) {
        return;
      }

      const nextRemaining = Math.max(0, endsAtRef.current - Date.now());
      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0) {
        window.clearInterval(timer);
        finishRun();
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [phase, correct, wrong, accuracy, difficulty, best]);

  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto grid min-h-full w-full max-w-6xl gap-3 py-3 lg:grid-cols-[0.38fr_0.62fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b p-4 sm:p-5">
            <Badge variant="secondary" className="mb-3 w-fit">Time Attack</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">60-second sprint</CardTitle>
            <CardDescription>
              Find as many targets as possible before time runs out. A tiny arcade mode for people who looked at peace and said no thanks.
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
                <div className="text-muted-foreground">Time</div>
                <div className="text-3xl font-bold tracking-tight">{Math.ceil(remainingMs / 1000)}s</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Found</div>
                <div className="text-3xl font-bold tracking-tight">{correct}</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Accuracy</div>
                <div className="text-3xl font-bold tracking-tight">{accuracy}%</div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground" role="status" aria-live="polite">
              {message}
            </div>

            {best && (
              <div className="rounded-xl border bg-muted/20 p-3 text-sm">
                <div className="text-muted-foreground">Best sprint on this device</div>
                <div className="mt-1 font-semibold">{best.correct} found · {best.wrong} wrong · {best.accuracy}% accuracy</div>
              </div>
            )}

            {phase === "finished" && (
              <ShareableResultCard
                eyebrow="Time Attack"
                title={`${correct} found in 60s`}
                subtitle={`${preset.label} board · ${wrong} wrong taps`}
                primaryLabel="Targets found"
                primaryValue={String(correct)}
                metrics={[
                  { label: "Accuracy", value: `${accuracy}%` },
                  { label: "Wrong taps", value: String(wrong) },
                  { label: "Difficulty", value: preset.label },
                  { label: "Duration", value: "60s" },
                ]}
                footer="Beat this sprint in Blink & Find"
                filename="blink-find-time-attack.svg"
                shareText={`I found ${correct} targets in Blink & Find Time Attack with ${accuracy}% accuracy.`}
              />
            )}

            <Button onClick={startRun} disabled={phase === "playing"}>{phase === "playing" ? "Run in progress" : "Start 60s Run"}</Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-between sm:p-5">
            <Button asChild variant="ghost"><Link href="/practice">Practice</Link></Button>
            <Button asChild variant="outline"><Link href="/">Back Home</Link></Button>
          </CardFooter>
        </Card>

        <Card className="min-h-[60dvh] overflow-hidden lg:min-h-0">
          <CardHeader className="border-b p-4 sm:p-5">
            <CardTitle>Find {target ?? "the target"}</CardTitle>
            <CardDescription>{preset.label} board · {phase === "playing" ? "keep moving" : "start the run first"}</CardDescription>
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
