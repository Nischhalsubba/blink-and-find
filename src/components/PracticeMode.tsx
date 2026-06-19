"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import NumberGrid from "@/components/NumberGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateZigZagBoard } from "@/engine/board";
import { DIFFICULTIES } from "@/lib/gameDefaults";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/types/game";

const PRACTICE_STORAGE_KEY = "blink-and-find-practice-rounds";

function getStoredPracticeRounds() {
  if (typeof window === "undefined") {
    return 0;
  }

  const value = Number(window.localStorage.getItem(PRACTICE_STORAGE_KEY) ?? "0");
  return Number.isFinite(value) ? value : 0;
}

function saveStoredPracticeRounds(value: number) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PRACTICE_STORAGE_KEY, String(value));
  }
}

function pickTarget(board: number[]) {
  return board[Math.floor(Math.random() * board.length)] ?? null;
}

function createBoard(difficulty: Difficulty) {
  const preset = DIFFICULTIES.find((item) => item.id === difficulty) ?? DIFFICULTIES[1];
  const board = generateZigZagBoard(preset.boardSize);

  return {
    board,
    target: pickTarget(board),
    preset,
  };
}

function DifficultyPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-2 text-sm font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-xs"
          : "border-border bg-muted/20 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {label}
    </button>
  );
}

export default function PracticeMode() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [{ board, target, preset }, setPracticeBoard] = useState(() => createBoard("easy"));
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectionWrong, setSelectionWrong] = useState(false);
  const [foundCount, setFoundCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [storedRounds, setStoredRounds] = useState(0);
  const [message, setMessage] = useState("Start slowly. Find the target number with no timer pressure.");
  const [hintVisible, setHintVisible] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [scatterKey, setScatterKey] = useState(() => Date.now());

  const accuracy = useMemo(() => {
    const total = foundCount + missCount;

    if (total === 0) {
      return 100;
    }

    return Math.round((foundCount / total) * 100);
  }, [foundCount, missCount]);

  function loadNewBoard(nextDifficulty = difficulty) {
    setPracticeBoard(createBoard(nextDifficulty));
    setSelectedNumber(null);
    setSelectionWrong(false);
    setHintVisible(false);
    setRoundComplete(false);
    setScatterKey(Date.now());
    setMessage("New practice board ready. Find the target at your own pace.");
  }

  function handleDifficultyChange(nextDifficulty: Difficulty) {
    setDifficulty(nextDifficulty);
    loadNewBoard(nextDifficulty);
  }

  function handleSelect(number: number) {
    if (roundComplete || target === null) {
      return;
    }

    setSelectedNumber(number);

    if (number === target) {
      const nextFoundCount = foundCount + 1;
      const nextStoredRounds = storedRounds + 1;

      setFoundCount(nextFoundCount);
      setStoredRounds(nextStoredRounds);
      saveStoredPracticeRounds(nextStoredRounds);
      setSelectionWrong(false);
      setHintVisible(false);
      setRoundComplete(true);
      setMessage("Nice find. No rush, no penalty, just practice reps stacking up.");
      return;
    }

    setMissCount((current) => current + 1);
    setSelectionWrong(true);
    setMessage(`Not ${number}. That is okay here. Practice mode is where mistakes are useful.`);
  }

  function showHint() {
    if (target === null || roundComplete) {
      return;
    }

    setSelectedNumber(target);
    setSelectionWrong(false);
    setHintVisible(true);
    setMessage("Hint shown. Look at where the target sits, then try a fresh board.");
  }

  useEffect(() => {
    setStoredRounds(getStoredPracticeRounds());
  }, []);

  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto grid min-h-full w-full max-w-6xl gap-3 py-3 lg:grid-cols-[0.38fr_0.62fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b p-4 sm:p-5">
            <Badge variant="secondary" className="mb-3 w-fit">Practice Mode</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">Train without pressure</CardTitle>
            <CardDescription>
              No timer, no final score, no penalty drama. Learn the board, build confidence, then go bully the clock later.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3 p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((item) => (
                <DifficultyPill
                  key={item.id}
                  active={difficulty === item.id}
                  label={item.label}
                  onClick={() => handleDifficultyChange(item.id)}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Target</div>
                <div className="text-3xl font-bold tracking-tight">{target ?? "-"}</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Found</div>
                <div className="text-3xl font-bold tracking-tight">{foundCount}</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Accuracy</div>
                <div className="text-3xl font-bold tracking-tight">{accuracy}%</div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground" role="status" aria-live="polite">
              {message}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Button onClick={() => loadNewBoard()}>{roundComplete ? "Next Practice Board" : "New Board"}</Button>
              <Button variant="outline" onClick={showHint} disabled={roundComplete || hintVisible}>Show Hint</Button>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
              Lifetime practice rounds on this device: <span className="font-semibold text-foreground">{storedRounds}</span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-between sm:p-5">
            <Button asChild variant="ghost"><Link href="/tutorial">Tutorial</Link></Button>
            <Button asChild variant="outline"><Link href="/">Back Home</Link></Button>
          </CardFooter>
        </Card>

        <Card className="min-h-[60dvh] overflow-hidden lg:min-h-0">
          <CardHeader className="border-b p-4 sm:p-5">
            <CardTitle>Find {target ?? "the target"}</CardTitle>
            <CardDescription>
              {preset.label} board · {preset.boardSize} numbers · {hintVisible ? "Hint is highlighted" : "Tap the matching number"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[52dvh] items-center justify-center p-2 sm:p-4 lg:min-h-[calc(100dvh-9rem)]">
            <NumberGrid
              numbers={board}
              targetNumber={target}
              selectedNumber={selectedNumber}
              isSelectionWrong={selectionWrong}
              scatterKey={scatterKey}
              disabled={false}
              onSelect={handleSelect}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
