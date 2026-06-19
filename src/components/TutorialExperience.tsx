"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TARGET_NUMBER = 7;
const PENALTY_SECONDS = 3;
const BOARD_NUMBERS = [12, 4, 21, 7, 16, 2, 9, 25, 3, 18, 5, 11];
const TUTORIAL_STORAGE_KEY = "blink-and-find-tutorial-seen";

type TutorialStep = "memorize" | "find" | "complete";

function saveTutorialSeen() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  }
}

export default function TutorialExperience() {
  const [step, setStep] = useState<TutorialStep>("memorize");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [wrongTaps, setWrongTaps] = useState(0);

  const finalPenalty = wrongTaps * PENALTY_SECONDS;
  const progressText = useMemo(() => {
    if (step === "memorize") {
      return "Step 1 of 3";
    }

    if (step === "find") {
      return "Step 2 of 3";
    }

    return "Step 3 of 3";
  }, [step]);

  function startFinding() {
    setStep("find");
    setSelectedNumber(null);
  }

  function restartTutorial() {
    setStep("memorize");
    setSelectedNumber(null);
    setWrongTaps(0);
  }

  function handleTilePress(number: number) {
    if (step !== "find") {
      return;
    }

    setSelectedNumber(number);

    if (number === TARGET_NUMBER) {
      saveTutorialSeen();
      setStep("complete");
      return;
    }

    setWrongTaps((current) => current + 1);
  }

  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto flex min-h-full w-full max-w-4xl items-center justify-center py-4">
        <Card className="w-full overflow-hidden">
          <CardHeader className="border-b text-center">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit">{progressText}</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-5xl">Learn Blink &amp; Find</CardTitle>
            <CardDescription className="mx-auto max-w-2xl">
              A tiny practice round for new players. No score pressure, no setup, and no mysterious buttons judging you silently.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 p-4 sm:grid-cols-[0.85fr_1.15fr] sm:p-5">
            <Card className="bg-muted/20 shadow-none">
              <CardHeader>
                <CardTitle className="text-xl">
                  {step === "memorize" && "1. Remember the target"}
                  {step === "find" && "2. Find the hidden number"}
                  {step === "complete" && "3. You found it"}
                </CardTitle>
                <CardDescription>
                  {step === "memorize" && "This number will hide before the board becomes playable."}
                  {step === "find" && "Tap the matching number on the board. Wrong taps are allowed, but they add time."}
                  {step === "complete" && "That is the whole loop: memorize, find, avoid extra penalties, try again faster."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-2xl border bg-background p-6 text-center">
                  <div className="mb-2 text-sm text-muted-foreground">Target</div>
                  <div className="text-6xl font-bold tracking-tight">
                    {step === "memorize" ? TARGET_NUMBER : "?"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border bg-background p-3">
                    <div className="text-muted-foreground">Wrong taps</div>
                    <div className="text-2xl font-semibold">{wrongTaps}</div>
                  </div>
                  <div className="rounded-xl border bg-background p-3">
                    <div className="text-muted-foreground">Penalty</div>
                    <div className="text-2xl font-semibold">+{finalPenalty}s</div>
                  </div>
                </div>

                {step === "memorize" && <Button onClick={startFinding}>I remember it</Button>}
                {step === "complete" && (
                  <div className="grid gap-2">
                    <Button asChild><Link href="/">Play a Real Game</Link></Button>
                    <Button variant="outline" onClick={restartTutorial}>Practice Again</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/20 shadow-none">
              <CardHeader>
                <CardTitle className="text-xl">Practice board</CardTitle>
                <CardDescription>
                  {step === "memorize" ? "The board unlocks after you hide the target." : "Find the target number here."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Tutorial number board">
                  {BOARD_NUMBERS.map((number) => {
                    const isSelected = selectedNumber === number;
                    const isTarget = number === TARGET_NUMBER;
                    const isCorrect = step === "complete" && isTarget;
                    const isWrong = isSelected && !isTarget && step === "find";

                    return (
                      <button
                        key={number}
                        type="button"
                        disabled={step !== "find"}
                        onClick={() => handleTilePress(number)}
                        className={cn(
                          "min-h-16 rounded-xl border text-xl font-semibold transition-all focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed",
                          step === "find" ? "bg-background hover:bg-accent" : "bg-muted/30 text-muted-foreground",
                          isCorrect && "border-primary bg-primary text-primary-foreground",
                          isWrong && "border-destructive text-destructive"
                        )}
                        aria-label={`Tutorial number ${number}`}
                      >
                        {number}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl border bg-background p-3 text-sm text-muted-foreground" role="status" aria-live="polite">
                  {step === "memorize" && "Tip: say the number in your head once, then press I remember it."}
                  {step === "find" && selectedNumber === null && "Now tap 7 on the board."}
                  {step === "find" && selectedNumber !== null && selectedNumber !== TARGET_NUMBER && `Not ${selectedNumber}. That adds ${PENALTY_SECONDS}s, but you can keep going.`}
                  {step === "complete" && `Nice. You found ${TARGET_NUMBER}${wrongTaps > 0 ? ` with ${wrongTaps} wrong tap${wrongTaps === 1 ? "" : "s"}` : " with no wrong taps"}.`}
                </div>
              </CardContent>
            </Card>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-between sm:p-5">
            <Button asChild variant="ghost"><Link href="/rules">Read Rules</Link></Button>
            <Button asChild variant="outline"><Link href="/">Back to Home</Link></Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
