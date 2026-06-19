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

const DAILY_BOARD_SIZE = 100;
const DAILY_PREVIEW_MS = 2000;
const DAILY_PENALTY_SECONDS = 3;
const DAILY_STORAGE_PREFIX = "blink-and-find-daily-result";

type DailyPhase = "ready" | "preview" | "playing" | "complete";

interface DailyResult {
  dateKey: string;
  rawTimeMs: number;
  penaltyMs: number;
  finalTimeMs: number;
  wrongTaps: number;
  attempts: number;
  completedAt: string;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDailyDate(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

function hashSeed(input: string) {
  let hash = 2166136261;

  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash) || 1;
}

function getDailyChallenge(dateKey: string) {
  const seed = hashSeed(`blink-and-find:${dateKey}`);
  const board = generateSeededZigZagBoard(DAILY_BOARD_SIZE, seed);
  const targetIndex = seed % board.length;

  return {
    seed,
    board,
    target: board[targetIndex] ?? null,
  };
}

function getDailyStorageKey(dateKey: string) {
  return `${DAILY_STORAGE_PREFIX}:${dateKey}`;
}

function loadDailyResult(dateKey: string): DailyResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getDailyStorageKey(dateKey));
    return rawValue ? JSON.parse(rawValue) as DailyResult : null;
  } catch {
    return null;
  }
}

function saveDailyResult(result: DailyResult) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getDailyStorageKey(result.dateKey), JSON.stringify(result));
}

export default function DailyChallenge() {
  const dateKey = useMemo(() => getTodayKey(), []);
  const dateLabel = useMemo(() => formatDailyDate(dateKey), [dateKey]);
  const challenge = useMemo(() => getDailyChallenge(dateKey), [dateKey]);
  const previewTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<DailyPhase>("ready");
  const [targetHidden, setTargetHidden] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectionWrong, setSelectionWrong] = useState(false);
  const [bestResult, setBestResult] = useState<DailyResult | null>(null);
  const [latestResult, setLatestResult] = useState<DailyResult | null>(null);
  const [message, setMessage] = useState("Everyone gets this same challenge today. One board, one target, one tiny argument with your attention span.");

  const shareResult = latestResult ?? bestResult;

  function clearPreviewTimers() {
    if (previewTimeoutRef.current !== null) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }

  function startDailyChallenge() {
    clearPreviewTimers();
    startedAtRef.current = null;

    const previewEndsAt = Date.now() + DAILY_PREVIEW_MS;

    setPhase("preview");
    setTargetHidden(false);
    setCountdown(Math.ceil(DAILY_PREVIEW_MS / 1000));
    setElapsedMs(0);
    setWrongTaps(0);
    setSelectedNumber(null);
    setSelectionWrong(false);
    setLatestResult(null);
    setMessage("Memorize the target. It hides soon, because apparently attention needs obstacles.");

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((previewEndsAt - Date.now()) / 1000)));
    }, 100);

    previewTimeoutRef.current = window.setTimeout(() => {
      clearPreviewTimers();
      startedAtRef.current = Date.now();
      setTargetHidden(true);
      setCountdown(0);
      setPhase("playing");
      setMessage("Target hidden. Find the matching number on today’s board.");
    }, DAILY_PREVIEW_MS);
  }

  function handleNumberSelect(value: number) {
    if (phase !== "playing" || challenge.target === null || startedAtRef.current === null) {
      return;
    }

    setSelectedNumber(value);

    if (value !== challenge.target) {
      setWrongTaps((current) => current + 1);
      setSelectionWrong(true);
      setMessage(`Not ${value}. +${DAILY_PENALTY_SECONDS}s added. Keep hunting.`);
      return;
    }

    const rawTimeMs = Date.now() - startedAtRef.current;
    const penaltyMs = calculatePenaltyMs(wrongTaps, DAILY_PENALTY_SECONDS);
    const finalTimeMs = rawTimeMs + penaltyMs;
    const previousBest = bestResult ?? loadDailyResult(dateKey);
    const attempts = (previousBest?.attempts ?? 0) + 1;
    const result: DailyResult = {
      dateKey,
      rawTimeMs,
      penaltyMs,
      finalTimeMs,
      wrongTaps,
      attempts,
      completedAt: new Date().toISOString(),
    };
    const nextBest = !previousBest || result.finalTimeMs < previousBest.finalTimeMs
      ? result
      : { ...previousBest, attempts };

    saveDailyResult(nextBest);
    startedAtRef.current = null;
    setSelectionWrong(false);
    setElapsedMs(finalTimeMs);
    setLatestResult(result);
    setBestResult(nextBest);
    setPhase("complete");
    setMessage(nextBest.finalTimeMs === result.finalTimeMs ? "New daily best saved on this device." : "Good run. Your earlier daily best still holds.");
  }

  async function copyDailyResult() {
    const result = latestResult ?? bestResult;

    if (!result || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(
      `I played the ${dateLabel} Blink & Find Daily Challenge: ${formatTime(result.finalTimeMs)}, ${result.wrongTaps} wrong taps. Try it: ${absoluteUrl("/daily")}`
    );
    setMessage("Daily result copied. Now you can politely ruin someone else’s productivity.");
  }

  useEffect(() => {
    setBestResult(loadDailyResult(dateKey));

    return () => clearPreviewTimers();
  }, [dateKey]);

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
            <Badge variant="secondary" className="mb-3 w-fit">Daily Challenge</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">{dateLabel}</CardTitle>
            <CardDescription>
              Same target and same board for everyone today. A fair little contest, which is suspiciously wholesome.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3 p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Target</div>
                <div className="text-3xl font-bold tracking-tight">{targetHidden ? "?" : challenge.target ?? "-"}</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Time</div>
                <div className="text-3xl font-bold tracking-tight">{formatTime(elapsedMs)}</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">Wrong</div>
                <div className="text-3xl font-bold tracking-tight">{wrongTaps}</div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground" role="status" aria-live="polite">
              {phase === "preview" && <>Target hides in <Badge variant="secondary">{countdown}</Badge></>}
              {phase !== "preview" && message}
            </div>

            {bestResult && (
              <div className="rounded-xl border bg-muted/20 p-3 text-sm">
                <div className="text-muted-foreground">Best today on this device</div>
                <div className="mt-1 font-semibold">
                  {formatTime(bestResult.finalTimeMs)} · {bestResult.wrongTaps} wrong · {bestResult.attempts} attempt{bestResult.attempts === 1 ? "" : "s"}
                </div>
              </div>
            )}

            {shareResult && (
              <ShareableResultCard
                eyebrow="Daily Challenge"
                title={dateLabel}
                subtitle="Same board, same target, every player today"
                primaryLabel="Final time"
                primaryValue={formatTime(shareResult.finalTimeMs)}
                metrics={[
                  { label: "Wrong taps", value: String(shareResult.wrongTaps) },
                  { label: "Penalty", value: formatTime(shareResult.penaltyMs) },
                  { label: "Raw time", value: formatTime(shareResult.rawTimeMs) },
                  { label: "Attempts", value: String(shareResult.attempts) },
                ]}
                footer="Play today’s free number hunting challenge"
                filename={`blink-find-daily-${dateKey}.svg`}
                shareText={`I played the ${dateLabel} Blink & Find Daily Challenge: ${formatTime(shareResult.finalTimeMs)}, ${shareResult.wrongTaps} wrong taps.`}
              />
            )}

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Button onClick={startDailyChallenge} disabled={phase === "preview" || phase === "playing"}>
                {bestResult ? "Retry Today" : "Start Today’s Challenge"}
              </Button>
              <Button variant="outline" onClick={copyDailyResult} disabled={!bestResult && !latestResult}>Copy Result</Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-between sm:p-5">
            <Button asChild variant="ghost"><Link href="/practice">Practice</Link></Button>
            <Button asChild variant="outline"><Link href="/">Back Home</Link></Button>
          </CardFooter>
        </Card>

        <Card className="min-h-[60dvh] overflow-hidden lg:min-h-0">
          <CardHeader className="border-b p-4 sm:p-5">
            <CardTitle>Today’s board</CardTitle>
            <CardDescription>
              Normal board · {DAILY_BOARD_SIZE} numbers · {phase === "ready" ? "press start first" : phase === "complete" ? "challenge complete" : "find the target"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[52dvh] items-center justify-center p-2 sm:p-4 lg:min-h-[calc(100dvh-9rem)]">
            <NumberGrid
              numbers={challenge.board}
              targetNumber={challenge.target}
              selectedNumber={selectedNumber}
              isSelectionWrong={selectionWrong}
              scatterKey={challenge.seed}
              disabled={phase !== "playing"}
              onSelect={handleNumberSelect}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
