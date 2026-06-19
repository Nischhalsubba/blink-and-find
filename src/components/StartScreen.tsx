"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
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
  compact = false,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border font-medium transition-all",
        compact ? "min-h-10 px-3 py-2 text-sm" : "px-4 py-2 text-sm",
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
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  if (settingsOpen) {
    return (
      <section className="flex h-full min-h-0 items-start justify-center overflow-y-auto px-2 py-2 sm:items-center">
        <Card className="flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden">
          <CardHeader className="shrink-0 border-b p-3 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Badge variant="secondary" className="mb-2 w-fit">Settings</Badge>
                <CardTitle className="truncate text-xl font-semibold tracking-tight sm:text-3xl">Make it yours</CardTitle>
                <CardDescription className="mt-1 hidden sm:block">Choose the board, rounds, and players. Defaults are already beginner-friendly.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSettingsOpen(false)}>Done</Button>
            </div>
          </CardHeader>

          <CardContent className="grid min-h-0 gap-2 overflow-y-auto p-3 sm:gap-3 sm:p-5">
            <div className="grid gap-2 rounded-xl border bg-muted/20 p-2.5 sm:p-3">
              <Label>Local mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <ChoicePill compact active={mode === "single"} onClick={() => onModeChange("single")}>Solo</ChoicePill>
                <ChoicePill compact active={mode === "multiplayer"} onClick={() => onModeChange("multiplayer")}>Same Device</ChoicePill>
              </div>
            </div>

            <div className="grid gap-2 rounded-xl border bg-muted/20 p-2.5 sm:p-3">
              <Label>Difficulty</Label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((item) => (
                  <ChoicePill key={item.id} compact active={difficulty === item.id} onClick={() => onDifficultyChange(item.id)}>{item.label}</ChoicePill>
                ))}
              </div>
            </div>

            <div className="grid gap-2 rounded-xl border bg-muted/20 p-2.5 sm:p-3">
              <Label>Players</Label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((count) => (
                  <ChoicePill
                    key={count}
                    compact
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

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="grid gap-2 rounded-xl border bg-muted/20 p-2.5 sm:p-3">
                <Label htmlFor="rounds">Rounds</Label>
                <Input id="rounds" className="h-10 text-center text-base sm:h-11" min={1} max={20} type="number" value={totalRounds} onChange={(event) => onTotalRoundsChange(Number(event.target.value))} />
              </div>

              <div className="grid gap-2 rounded-xl border bg-muted/20 p-2.5 sm:p-3">
                <Label htmlFor="penalty">Penalty</Label>
                <Input id="penalty" className="h-10 text-center text-base sm:h-11" min={0} max={10} type="number" value={penaltySeconds} onChange={(event) => onPenaltySecondsChange(Number(event.target.value))} />
              </div>
            </div>

            {mode === "multiplayer" && (
              <div className="grid gap-2 rounded-xl border bg-muted/20 p-2.5 sm:p-3">
                <div className="flex items-center justify-between">
                  <Label>Names</Label>
                  <Badge variant="outline">{playerNames.length}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {playerNames.map((name, index) => (
                    <Input key={index} className="h-10" value={name} aria-label={`Player ${index + 1} name`} onChange={(event) => updatePlayerName(index, event.target.value)} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="shrink-0 border-t p-3 sm:p-5">
            <Button className="h-12 w-full text-base" onClick={handleCustomStart}>Start Custom Game</Button>
          </CardFooter>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 items-center justify-center px-2">
      <Card className="flex max-h-full w-full max-w-lg flex-col overflow-hidden">
        <CardHeader className="shrink-0 border-b pb-4 text-center">
          <Badge variant="secondary" className="mx-auto mb-3 w-fit">Blink &amp; Find</Badge>
          <CardTitle className="text-4xl font-semibold tracking-tight sm:text-5xl">Ready to play?</CardTitle>
          <CardDescription className="mt-2">Memorize one number, find it on the board, and try to beat your time.</CardDescription>
        </CardHeader>

        <CardContent className="grid min-h-0 gap-3 p-4 sm:gap-4 sm:p-5">
          <Button size="lg" className="h-16 text-lg" onClick={handleQuickStart}>Play Now</Button>

          <Button asChild size="lg" variant="outline" className="h-14 text-base">
            <Link href="/daily">Daily Challenge</Link>
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button asChild size="lg" variant="outline" className="h-14 text-base"><Link href="/practice">Practice</Link></Button>
            <Button asChild size="lg" variant="outline" className="h-14 text-base"><Link href="/online">Play with Friend</Link></Button>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 text-center text-sm text-muted-foreground">
            New here? Try the quick tutorial or pressure-free practice first, then take today’s challenge.
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="secondary" className="h-12"><Link href="/tutorial">Learn in 20s</Link></Button>
            <Button variant="secondary" className="h-12" onClick={() => setSettingsOpen(true)}>Change settings</Button>
          </div>
        </CardContent>

        <CardFooter className="flex shrink-0 flex-col gap-2 border-t p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <span>Tip: wrong taps add time, so quick eyes beat frantic fingers.</span>
          <div className="flex gap-1">
            <Button asChild variant="ghost" size="sm"><Link href="/rules">Rules</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/history">History</Link></Button>
          </div>
        </CardFooter>
      </Card>
    </section>
  );
}
