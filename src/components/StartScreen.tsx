"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIFFICULTIES } from "@/lib/gameDefaults";
import { cn } from "@/lib/utils";
import type { Difficulty, GameConfig, GameMode } from "@/types/game";

interface StartScreenProps {
  mode: GameMode;
  playerNames: string[];
  totalRounds: number;
  difficulty: Difficulty;
  penaltySeconds: number;
  onModeChange: (mode: GameMode) => void;
  onPlayerNamesChange: (names: string[]) => void;
  onTotalRoundsChange: (rounds: number) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onPenaltySecondsChange: (seconds: number) => void;
  onStart: (config: GameConfig) => void;
}

function ChoicePill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-xs"
          : "border-border bg-muted/20 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {children}
    </button>
  );
}

/**
 * Quick-first setup screen. Most people should press one button and play.
 */
export default function StartScreen({
  mode,
  playerNames,
  totalRounds,
  difficulty,
  penaltySeconds,
  onModeChange,
  onPlayerNamesChange,
  onTotalRoundsChange,
  onDifficultyChange,
  onPenaltySecondsChange,
  onStart,
}: StartScreenProps) {
  const selectedDifficulty = DIFFICULTIES.find((item) => item.id === difficulty) ?? DIFFICULTIES[1];
  const normalDifficulty = DIFFICULTIES.find((item) => item.id === "normal") ?? selectedDifficulty;

  function updatePlayerCount(count: number) {
    const nextNames = Array.from({ length: count }, (_, index) => {
      return playerNames[index] ?? `Player ${index + 1}`;
    });

    onPlayerNamesChange(nextNames);
  }

  function updatePlayerName(index: number, name: string) {
    const nextNames = [...playerNames];
    nextNames[index] = name;
    onPlayerNamesChange(nextNames);
  }

  function handleQuickStart() {
    onStart({
      mode: "single",
      difficulty: "normal",
      boardSize: normalDifficulty.boardSize,
      totalRounds: 5,
      flashDurationMs: normalDifficulty.flashDurationMs,
      penaltySeconds: 3,
    });
  }

  function handleCustomStart() {
    onStart({
      mode,
      difficulty,
      boardSize: selectedDifficulty.boardSize,
      totalRounds,
      flashDurationMs: selectedDifficulty.flashDurationMs,
      penaltySeconds,
    });
  }

  return (
    <section className="flex h-full items-center justify-center px-2">
      <Card className="w-full max-w-lg overflow-hidden">
        <CardHeader className="border-b pb-4 text-center">
          <Badge variant="secondary" className="mx-auto mb-3 w-fit">
            Blink &amp; Find
          </Badge>
          <CardTitle className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Ready?
          </CardTitle>
          <CardDescription className="mt-2">
            Tap once. Start playing. No form-filling ceremony required.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 sm:p-5">
          <Button size="lg" className="h-16 text-lg" onClick={handleQuickStart}>
            Play Now
          </Button>

          <Button asChild size="lg" variant="outline" className="h-16 text-lg">
            <Link href="/online?host=1">Play with Friend</Link>
          </Button>

          <div className="rounded-lg border bg-muted/20 p-3 text-center text-sm text-muted-foreground">
            Default: Normal board · 5 rounds · 3s penalty
          </div>

          <details className="rounded-lg border bg-muted/20 p-3">
            <summary className="cursor-pointer text-sm font-medium">Change settings</summary>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-2">
                <Label>Local mode</Label>
                <div className="flex flex-wrap gap-2">
                  <ChoicePill active={mode === "single"} onClick={() => onModeChange("single")}>
                    Solo
                  </ChoicePill>
                  <ChoicePill active={mode === "multiplayer"} onClick={() => onModeChange("multiplayer")}>
                    Same Device
                  </ChoicePill>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Difficulty</Label>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map((item) => (
                    <ChoicePill key={item.id} active={difficulty === item.id} onClick={() => onDifficultyChange(item.id)}>
                      {item.label}
                    </ChoicePill>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label>Players</Label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map((count) => (
                      <ChoicePill
                        key={count}
                        active={(mode === "single" ? 1 : playerNames.length) === count}
                        onClick={() => {
                          onModeChange(count === 1 ? "single" : "multiplayer");
                          updatePlayerCount(count);
                        }}
                      >
                        {count}
                      </ChoicePill>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="rounds">Rounds</Label>
                  <Input
                    id="rounds"
                    min={1}
                    max={20}
                    type="number"
                    value={totalRounds}
                    onChange={(event) => onTotalRoundsChange(Number(event.target.value))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="penalty">Penalty</Label>
                  <Input
                    id="penalty"
                    min={0}
                    max={10}
                    type="number"
                    value={penaltySeconds}
                    onChange={(event) => onPenaltySecondsChange(Number(event.target.value))}
                  />
                </div>
              </div>

              {mode === "multiplayer" && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Names</Label>
                    <Badge variant="outline">{playerNames.length}</Badge>
                  </div>
                  <div className="grid max-h-32 gap-2 overflow-auto pr-1 sm:grid-cols-2">
                    {playerNames.map((name, index) => (
                      <Input
                        key={index}
                        value={name}
                        aria-label={`Player ${index + 1} name`}
                        onChange={(event) => updatePlayerName(index, event.target.value)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleCustomStart}>Start Custom Game</Button>
            </div>
          </details>
        </CardContent>

        <CardFooter className="justify-center border-t p-4 text-sm text-muted-foreground sm:p-5">
          Find the hidden number faster than your friend. That is mercifully all.
        </CardFooter>
      </Card>
    </section>
  );
}
