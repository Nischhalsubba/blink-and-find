"use client";

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
import { NativeSelect } from "@/components/ui/native-select";
import { DIFFICULTIES } from "@/lib/gameDefaults";
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

/**
 * Setup screen for Blink & Find.
 * This now uses real shadcn-style component files and Tailwind utility classes,
 * while Bootstrap remains available elsewhere in the app where it already works.
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
  const selectedDifficulty =
    DIFFICULTIES.find((item) => item.id === difficulty) ?? DIFFICULTIES[1];

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

  function handleStart() {
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
    <section className="flex h-full items-center justify-center px-1">
      <Card className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-hidden">
        <CardHeader className="border-b text-center">
          <div className="mx-auto w-fit rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            Memory speed challenge
          </div>
          <CardTitle className="text-4xl font-bold tracking-tight sm:text-6xl">
            Blink &amp; Find
          </CardTitle>
          <CardDescription className="mx-auto max-w-2xl">
            Memorize the target, wait for it to disappear, then find it faster than everyone else. Wrong taps add penalty time.
          </CardDescription>
        </CardHeader>

        <CardContent className="min-h-0 overflow-auto p-4 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.45fr_0.9fr]">
            <Card className="gap-4 bg-muted/20 py-5 shadow-none">
              <CardHeader className="px-5">
                <CardTitle className="text-base">Game setup</CardTitle>
                <CardDescription>
                  Choose the mode, difficulty, and penalty rules before the grid starts being rude.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4 px-5 sm:grid-cols-6">
                <div className="grid gap-2 sm:col-span-3">
                  <label className="text-sm font-medium" htmlFor="mode">Mode</label>
                  <NativeSelect
                    id="mode"
                    value={mode}
                    onChange={(event) => onModeChange(event.target.value as GameMode)}
                  >
                    <option value="single">Single Player</option>
                    <option value="multiplayer">Multiplayer</option>
                  </NativeSelect>
                </div>

                <div className="grid gap-2 sm:col-span-1">
                  <label className="text-sm font-medium" htmlFor="players">Players</label>
                  <NativeSelect
                    id="players"
                    value={mode === "single" ? 1 : playerNames.length}
                    disabled={mode === "single"}
                    onChange={(event) => updatePlayerCount(Number(event.target.value))}
                  >
                    {[2, 3, 4, 5, 6].map((count) => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                  </NativeSelect>
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <label className="text-sm font-medium" htmlFor="rounds">Rounds</label>
                  <Input
                    id="rounds"
                    min={1}
                    max={20}
                    type="number"
                    value={totalRounds}
                    onChange={(event) => onTotalRoundsChange(Number(event.target.value))}
                  />
                </div>

                <div className="grid gap-2 sm:col-span-4">
                  <label className="text-sm font-medium" htmlFor="difficulty">Difficulty</label>
                  <NativeSelect
                    id="difficulty"
                    value={difficulty}
                    onChange={(event) => onDifficultyChange(event.target.value as Difficulty)}
                  >
                    {DIFFICULTIES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label} - {item.description}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <label className="text-sm font-medium" htmlFor="penalty">Wrong tap penalty</label>
                  <Input
                    id="penalty"
                    min={0}
                    max={10}
                    type="number"
                    value={penaltySeconds}
                    onChange={(event) => onPenaltySecondsChange(Number(event.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="gap-4 bg-muted/20 py-5 shadow-none">
              <CardHeader className="px-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Players</CardTitle>
                    <CardDescription>Names are saved locally on this device.</CardDescription>
                  </div>
                  <div className="rounded-md border bg-background px-2 py-1 text-xs font-medium">
                    {mode === "single" ? 1 : playerNames.length}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-2 px-5 sm:grid-cols-2 lg:grid-cols-1">
                {playerNames.map((name, index) => (
                  <div className="grid gap-2" key={index}>
                    <label className="sr-only" htmlFor={`player-${index}`}>Player {index + 1}</label>
                    <Input
                      id={`player-${index}`}
                      value={name}
                      aria-label={`Player ${index + 1} name`}
                      onChange={(event) => updatePlayerName(index, event.target.value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-stretch justify-between gap-3 border-t sm:flex-row sm:items-center">
          <div className="text-sm">
            <div className="font-medium">{selectedDifficulty.label}</div>
            <div className="text-muted-foreground">
              {selectedDifficulty.boardSize} tiles · {selectedDifficulty.flashDurationMs / 1000}s preview
            </div>
          </div>

          <Button size="lg" onClick={handleStart}>
            Start Game
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
