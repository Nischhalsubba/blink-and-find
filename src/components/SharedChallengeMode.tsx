"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import NumberGrid from "@/components/NumberGrid";
import ShareableResultCard from "@/components/ShareableResultCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateSeededZigZagBoard } from "@/engine/board";
import { calculatePenaltyMs, formatTime } from "@/engine/scoring";
import { absoluteUrl } from "@/lib/seo";

const DEFAULT_SEED = 20260619;
const DEFAULT_SIZE = 100;
const PREVIEW_MS = 2000;
const PENALTY_SECONDS = 3;

type ChallengePhase = "ready" | "preview" | "playing" | "complete";

function sanitizeSeed(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_SEED;
}

function sanitizeBoardSize(size: number) {
  if ([25, 100, 225].includes(size)) {
    return size;
  }

  return DEFAULT_SIZE;
}

function buildChallengeUrl(seed: number, size: number, target: number) {
  return absoluteUrl(`/challenge?seed=${seed}&size=${size}&target=${target}`);
}

function getChallengeFromUrl() {
  if (typeof window === "undefined") {
    const board = generateSeededZigZagBoard(DEFAULT_SIZE, DEFAULT_SEED);
    return { seed: DEFAULT_SEED, size: DEFAULT_SIZE, board, target: board[DEFAULT_SEED % board.length] ?? 1 };
  }

  const params = new URLSearchParams(window.location.search);
  const seed = sanitizeSeed(Number(params.get("seed") ?? DEFAULT_SEED));
  const size = sanitizeBoardSize(Number(params.get("size") ?? DEFAULT_SIZE));
  const board = generateSeededZigZagBoard(size, seed);
  const requestedTarget = Number(params.get("target"));
  const target = board.includes(requestedTarget) ? requestedTarget : board[seed % board.length] ?? 1;

  return { seed, size, board, target };
}

export default function SharedChallengeMode() {
  const challenge = useMemo(() => getChallengeFromUrl(), []);
  const startedAtRef = useRef<number | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<ChallengePhase>("ready");
  const [countdown, setCountdown] = useState(0);
  const [targetHidden, setTargetHidden] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectionWrong, setSelectionWrong] = useState(false);
  const [message, setMessage] = useState("This link always opens the same board and target. Finally, fairness, a rare visitor.");

  const penaltyMs = calculatePenaltyMs(wrongTaps, PENALTY_SECONDS);
  const finalTimeMs = phase === "complete" ? elapsedMs + penaltyMs : elapsedMs;
  const shareUrl = buildChallengeUrl(challenge.seed, challenge.size, challenge.target);

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

  function startChallenge() {
    clearTimers();
    startedAtRef.current = null;
    const previewEndsAt = Date.now() + PREVIEW_MS;

    setPhase("preview");
    setCountdown(Math.ceil(PREVIEW_MS / 1000));
    setTargetHidden(false);
    setElapsedMs(0);
    setWrongTaps(0);
    setSelectedNumber(null);
    setSelectionWrong(false);
    setMessage("Memorize the target. Same challenge, same humiliation options for everyone.");

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((previewEndsAt - Date.now()) / 1000)));
    }, 100);

    previewTimeoutRef.current = window.setTimeout(() => {
      clearTimers();
      startedAtRef.current = Date.now();
      setCountdown(0);
      setTargetHidden(true);
      setPhase("playing");
      setMessage("Target hidden. Find it on the shared board.");
    }, PREVIEW_MS);
  }

  function handleSelect(value: number) {
    if (phase !== "playing" || startedAtRef.current === null) {
      return;
    }

    setSelectedNumber(value);

    if (value !== challenge.target) {
      setWrongTaps((current) => current + 1);
      setSelectionWrong(true);
      setMessage(`Not ${value}. +${PENALTY_SECONDS}s added.`);
      return;
    }

    setSelectionWrong(false);
    setElapsedMs(Date.now() - startedAtRef.current);
    startedAtRef.current = null;
    setPhase("complete");
    setMessage("Challenge complete. Share the same link and compare properly.");
  }

  async function copyChallengeLink() {
    if (!navigator.clipboard) {
      setMessage("Clipboard is not available in this browser.");
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    setMessage("Challenge link copied.");
  }

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (phase !== "playing" || startedAtRef.current === null) {
      return;
    }

    const timer = window.setInterval(() => {
      if (startedAtRef.current !== null) {
        setElapsedMs(Date.now() - startedAtRef.current);
      }
    }, 80);

    return () => window.clearInterval(timer);
  }, [phase]);

  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto grid min-h-full w-full max-w-6xl gap-3 py-3 lg:grid-cols-[0.38fr_0.62fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b p-4 sm:p-5">
            <Badge variant="secondary" className="mb-3 w-fit">Challenge Link</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">Shared board #{challenge.seed}</CardTitle>
            <CardDescription>
              Send this exact challenge to a friend. They get the same board, same target, and no excuses except the usual human ones.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3 p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Target</div>
                <div className="text-3xl font-bold tracking-tight">{targetHidden ? "?" : challenge.target}</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Time</div>
                <div className="text-3xl font-bold tracking-tight">{formatTime(finalTimeMs)}</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Wrong</div>
                <div className="text-3xl font-bold tracking-tight">{wrongTaps}</div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground" role="status" aria-live="polite">
              {phase === "preview" ? <>Target hides in <Badge variant="secondary">{countdown}</Badge></> : message}
            </div>

            {phase === "complete" && (
              <ShareableResultCard
                eyebrow="Shared Challenge"
                title={formatTime(finalTimeMs)}
                subtitle={`Seed ${challenge.seed} · ${challenge.size} numbers`}
                primaryLabel="Final time"
                primaryValue={formatTime(finalTimeMs)}
                metrics={[
                  { label: "Wrong taps", value: String(wrongTaps) },
                  { label: "Penalty", value: formatTime(penaltyMs) },
                  { label: "Target", value: String(challenge.target) },
                  { label: "Board", value: String(challenge.size) },
                ]}
                footer="Try the same Blink & Find challenge"
                filename={`blink-find-challenge-${challenge.seed}.svg`}
                shareText={`I finished this Blink & Find challenge in ${formatTime(finalTimeMs)} with ${wrongTaps} wrong taps.`}
                shareUrl={shareUrl}
              />
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={startChallenge} disabled={phase === "preview" || phase === "playing"}>{phase === "complete" ? "Retry Challenge" : "Start Challenge"}</Button>
              <Button variant="outline" onClick={copyChallengeLink}>Copy Challenge Link</Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-between sm:p-5">
            <Button asChild variant="ghost"><Link href="/daily">Daily</Link></Button>
            <Button asChild variant="outline"><Link href="/">Back Home</Link></Button>
          </CardFooter>
        </Card>

        <Card className="min-h-[60dvh] overflow-hidden lg:min-h-0">
          <CardHeader className="border-b p-4 sm:p-5">
            <CardTitle>Shared board</CardTitle>
            <CardDescription>{challenge.size} numbers · seed {challenge.seed}</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[52dvh] items-center justify-center p-2 sm:p-4 lg:min-h-[calc(100dvh-9rem)]">
            <NumberGrid
              numbers={challenge.board}
              targetNumber={challenge.target}
              selectedNumber={selectedNumber}
              isSelectionWrong={selectionWrong}
              scatterKey={challenge.seed}
              disabled={phase !== "playing"}
              onSelect={handleSelect}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
