"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import NumberGrid from "@/components/NumberGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateZigZagBoard } from "@/engine/board";
import { calculatePenaltyMs, formatTime } from "@/engine/scoring";

const BOARD_SIZE = 25;
const PREVIEW_MS = 5000;
const PENALTY_SECONDS = 1;

type ComfortPhase = "ready" | "preview" | "playing" | "complete";

function pickTarget(board: number[]) {
  return board[Math.floor(Math.random() * board.length)] ?? null;
}

function createRound() {
  const board = generateZigZagBoard(BOARD_SIZE);
  return { board, target: pickTarget(board), scatterKey: Date.now() + Math.random() };
}

export default function ComfortMode() {
  const [round, setRound] = useState(() => createRound());
  const [phase, setPhase] = useState<ComfortPhase>("ready");
  const [targetHidden, setTargetHidden] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectionWrong, setSelectionWrong] = useState(false);
  const [message, setMessage] = useState("Large tiles, smaller board, longer preview. Take your time.");
  const previewTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  function clearTimers() {
    if (previewTimeoutRef.current !== null) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }

  function newRound() {
    clearTimers();
    setRound(createRound());
    setPhase("ready");
    setTargetHidden(false);
    setCountdown(0);
    setStartedAt(null);
    setElapsedMs(0);
    setWrongTaps(0);
    setSelectedNumber(null);
    setSelectionWrong(false);
    setMessage("New comfort board ready. Press Start when you are ready.");
  }

  function startRound() {
    clearTimers();
    const previewEndsAt = Date.now() + PREVIEW_MS;

    setPhase("preview");
    setTargetHidden(false);
    setCountdown(Math.ceil(PREVIEW_MS / 1000));
    setSelectedNumber(null);
    setSelectionWrong(false);
    setMessage("Look at the target. Comfort mode gives you a longer preview.");

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((previewEndsAt - Date.now()) / 1000)));
    }, 100);

    previewTimeoutRef.current = window.setTimeout(() => {
      clearTimers();
      setTargetHidden(true);
      setStartedAt(Date.now());
      setCountdown(0);
      setPhase("playing");
      setMessage("Target hidden. Tap the matching number on the large board.");
    }, PREVIEW_MS);
  }

  function handleSelect(value: number) {
    if (phase !== "playing" || round.target === null || startedAt === null) {
      return;
    }

    setSelectedNumber(value);

    if (value !== round.target) {
      setWrongTaps((current) => current + 1);
      setSelectionWrong(true);
      setMessage(`Not ${value}. Comfort mode adds only +${PENALTY_SECONDS}s.`);
      return;
    }

    const raw = Date.now() - startedAt;
    const final = raw + calculatePenaltyMs(wrongTaps, PENALTY_SECONDS);

    setSelectionWrong(false);
    setElapsedMs(final);
    setStartedAt(null);
    setPhase("complete");
    setMessage("Found it. Nice and steady.");
  }

  useEffect(() => {
    return () => clearTimers();
  }, []);

  return (
    <main className="app-shell overflow-auto">
      <section className="game-stage">
        <div className="game-stage-shell grid lg:grid-cols-[0.38fr_0.62fr]">
          <Card className="glass-panel overflow-hidden rounded-[2rem] py-0">
            <CardHeader className="border-b p-4 sm:p-5">
              <Badge variant="secondary" className="mb-3 w-fit rounded-full px-3 py-1">Comfort Mode</Badge>
              <CardTitle className="hero-title text-4xl sm:text-5xl">Bigger, calmer play</CardTitle>
              <CardDescription className="hero-copy mt-3">
                Built for kids, seniors, first-time players, and anyone who wants larger tiles and a gentler pace.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3 p-4 sm:p-5">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-[1.25rem] border bg-white/80 p-3 text-center">
                  <div className="font-bold text-muted-foreground">Target</div>
                  <div className="text-4xl font-black tracking-tight text-slate-950">{targetHidden ? "?" : round.target ?? "-"}</div>
                </div>
                <div className="rounded-[1.25rem] border bg-white/80 p-3 text-center">
                  <div className="font-bold text-muted-foreground">Preview</div>
                  <div className="text-4xl font-black tracking-tight text-slate-950">{phase === "preview" ? countdown : 5}s</div>
                </div>
                <div className="rounded-[1.25rem] border bg-white/80 p-3 text-center">
                  <div className="font-bold text-muted-foreground">Wrong</div>
                  <div className="text-4xl font-black tracking-tight text-slate-950">{wrongTaps}</div>
                </div>
              </div>

              <div className="rounded-[1.25rem] border bg-white/80 p-3 text-base leading-6 text-slate-700" role="status" aria-live="polite">
                {phase === "complete" ? `${message} Final time: ${formatTime(elapsedMs)}.` : message}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button className="h-12 rounded-2xl text-base font-black" onClick={startRound} disabled={phase === "preview" || phase === "playing"}>{phase === "complete" ? "Try Again" : "Start"}</Button>
                <Button className="h-12 rounded-2xl text-base font-bold" variant="outline" onClick={newRound}>New Board</Button>
              </div>

              <div className="rounded-[1.25rem] border bg-white/80 p-3">
                <div className="text-sm font-black text-slate-950">Want no timer at all?</div>
                <p className="mt-1 text-sm leading-5 text-slate-700">Zen Mode is fully playable: endless boards, visible target, no score pressure.</p>
                <Button asChild className="mt-3 h-11 rounded-2xl" variant="secondary"><Link href="/zen">Open Zen Mode</Link></Button>
              </div>
            </CardContent>

            <CardFooter className="game-stage-actions">
              <Button asChild className="h-12 rounded-2xl font-bold" variant="outline"><Link href="/">Back Home</Link></Button>
            </CardFooter>
          </Card>

          <Card className="glass-panel min-h-[60dvh] overflow-hidden rounded-[2rem] py-0 lg:min-h-0">
            <CardHeader className="border-b p-4 sm:p-5">
              <CardTitle className="font-black">Large board</CardTitle>
              <CardDescription>25 numbers · gentle penalty · longer preview</CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-[52dvh] items-center justify-center p-2 sm:p-4 lg:min-h-[calc(100dvh-11rem)]">
              <NumberGrid
                numbers={round.board}
                targetNumber={round.target}
                selectedNumber={selectedNumber}
                isSelectionWrong={selectionWrong}
                scatterKey={round.scatterKey}
                disabled={phase !== "playing"}
                onSelect={handleSelect}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
