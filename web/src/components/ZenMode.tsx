"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import NumberGrid from "@/components/NumberGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateZigZagBoard } from "@/engine/board";

type BoardSize = 25 | 100;

function pickTarget(board: number[]) {
  return board[Math.floor(Math.random() * board.length)] ?? null;
}

function createRound(size: BoardSize) {
  const board = generateZigZagBoard(size);
  return { board, target: pickTarget(board), scatterKey: Date.now() + Math.random() };
}

export default function ZenMode() {
  const [boardSize, setBoardSize] = useState<BoardSize>(25);
  const [round, setRound] = useState(() => createRound(25));
  const [found, setFound] = useState(0);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [message, setMessage] = useState("No timer. No penalties. Find the target at your own pace.");
  const advanceTimerRef = useRef<number | null>(null);

  function clearAdvanceTimer() {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }

  function newBoard(nextSize = boardSize) {
    clearAdvanceTimer();
    setRound(createRound(nextSize));
    setSelectedNumber(null);
    setMessage("New calm board ready. Find the visible target.");
  }

  function changeBoardSize(nextSize: BoardSize) {
    setBoardSize(nextSize);
    newBoard(nextSize);
  }

  function handleSelect(value: number) {
    setSelectedNumber(value);

    if (value !== round.target) {
      setMessage(`Not ${value}. No penalty in Zen Mode. Try again calmly.`);
      return;
    }

    setFound((current) => current + 1);
    setMessage("Found it. Loading a new board.");
    clearAdvanceTimer();
    advanceTimerRef.current = window.setTimeout(() => newBoard(), 350);
  }

  useEffect(() => {
    return () => clearAdvanceTimer();
  }, []);

  return (
    <main className="app-shell overflow-auto">
      <section className="game-stage">
        <div className="game-stage-shell grid lg:grid-cols-[0.38fr_0.62fr]">
          <Card className="glass-panel overflow-hidden rounded-[2rem] py-0">
            <CardHeader className="border-b p-4 sm:p-5">
              <Badge variant="secondary" className="mb-3 w-fit rounded-full px-3 py-1">Zen Mode</Badge>
              <CardTitle className="hero-title text-4xl sm:text-5xl">Endless calm boards</CardTitle>
              <CardDescription className="hero-copy mt-3">
                Practice visual search with no timer and no score pressure. The target stays visible.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3 p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-2">
                <Button className="h-12 rounded-2xl font-bold" variant={boardSize === 25 ? "default" : "outline"} onClick={() => changeBoardSize(25)}>Calm 5x5</Button>
                <Button className="h-12 rounded-2xl font-bold" variant={boardSize === 100 ? "default" : "outline"} onClick={() => changeBoardSize(100)}>Focus 10x10</Button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-[1.25rem] border bg-white/80 p-3 text-center">
                  <div className="font-bold text-muted-foreground">Target</div>
                  <div className="text-4xl font-black tracking-tight text-slate-950">{round.target ?? "-"}</div>
                </div>
                <div className="rounded-[1.25rem] border bg-white/80 p-3 text-center">
                  <div className="font-bold text-muted-foreground">Found</div>
                  <div className="text-4xl font-black tracking-tight text-slate-950">{found}</div>
                </div>
              </div>

              <div className="rounded-[1.25rem] border bg-white/80 p-3 text-base leading-6 text-slate-700" role="status" aria-live="polite">
                {message}
              </div>

              <Button className="h-12 rounded-2xl font-bold" onClick={() => newBoard()} variant="outline">Skip Board</Button>
            </CardContent>

            <CardFooter className="game-stage-actions">
              <Button asChild className="h-12 rounded-2xl font-bold" variant="outline"><Link href="/comfort">Comfort</Link></Button>
              <Button asChild className="h-12 rounded-2xl font-black"><Link href="/">Back Home</Link></Button>
            </CardFooter>
          </Card>

          <Card className="glass-panel min-h-[60dvh] overflow-hidden rounded-[2rem] py-0 lg:min-h-0">
            <CardHeader className="border-b p-4 sm:p-5">
              <CardTitle className="font-black">Find {round.target ?? "the target"}</CardTitle>
              <CardDescription>{boardSize} numbers · no timer · no penalty</CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-[52dvh] flex-col items-center justify-center gap-2 p-2 sm:p-4 lg:min-h-[calc(100dvh-11rem)]">
              {boardSize === 100 && (
                <div className="rounded-full bg-white/85 px-3 py-1 text-center text-xs font-bold text-slate-700 shadow-sm" role="note">
                  100-number focus board: all numbers fit inside this square.
                </div>
              )}
              <NumberGrid
                numbers={round.board}
                targetNumber={round.target}
                selectedNumber={selectedNumber}
                isSelectionWrong={selectedNumber !== null && selectedNumber !== round.target}
                scatterKey={round.scatterKey}
                disabled={false}
                onSelect={handleSelect}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
