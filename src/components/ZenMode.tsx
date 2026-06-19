"use client";

import Link from "next/link";
import { useState } from "react";
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
  const [message, setMessage] = useState("No timer. No penalties. Just find the number and breathe, a scandalous design choice.");

  function newBoard(nextSize = boardSize) {
    setRound(createRound(nextSize));
    setSelectedNumber(null);
    setMessage("New calm board ready.");
  }

  function changeBoardSize(nextSize: BoardSize) {
    setBoardSize(nextSize);
    newBoard(nextSize);
  }

  function handleSelect(value: number) {
    setSelectedNumber(value);

    if (value !== round.target) {
      setMessage("That is not it. No penalty here, just information. Civilization advances.");
      return;
    }

    setFound((current) => current + 1);
    setMessage("Found it. New board loaded.");
    window.setTimeout(() => newBoard(), 350);
  }

  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto grid min-h-full w-full max-w-6xl gap-3 py-3 lg:grid-cols-[0.38fr_0.62fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b p-4 sm:p-5">
            <Badge variant="secondary" className="mb-3 w-fit">Zen Mode</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">Endless calm boards</CardTitle>
            <CardDescription>
              Practice visual search with no timer and no score pressure. The game briefly becomes reasonable. Cherish it.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-2">
              <Button variant={boardSize === 25 ? "default" : "outline"} onClick={() => changeBoardSize(25)}>Calm 5x5</Button>
              <Button variant={boardSize === 100 ? "default" : "outline"} onClick={() => changeBoardSize(100)}>Focus 10x10</Button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Target</div>
                <div className="text-4xl font-bold tracking-tight">{round.target ?? "-"}</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Found</div>
                <div className="text-4xl font-bold tracking-tight">{found}</div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground" role="status" aria-live="polite">
              {message}
            </div>

            <Button onClick={() => newBoard()} variant="outline">Skip Board</Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-between sm:p-5">
            <Button asChild variant="ghost"><Link href="/comfort">Comfort</Link></Button>
            <Button asChild variant="outline"><Link href="/">Back Home</Link></Button>
          </CardFooter>
        </Card>

        <Card className="min-h-[60dvh] overflow-hidden lg:min-h-0">
          <CardHeader className="border-b p-4 sm:p-5">
            <CardTitle>Find {round.target ?? "the target"}</CardTitle>
            <CardDescription>{boardSize} numbers · no timer · no pressure</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[52dvh] items-center justify-center p-2 sm:p-4 lg:min-h-[calc(100dvh-9rem)]">
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
      </section>
    </main>
  );
}
