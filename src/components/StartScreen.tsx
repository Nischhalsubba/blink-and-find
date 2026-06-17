"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
 * Uses official shadcn-style primitives for form controls and layout.
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
          <Badge variant="secondary" className="mx-auto">
            Memory speed challenge
          </Badge>
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
                  <Label htmlFor="mode">Mode</Label>
                  <Select value={mode} onValueChange={(value) => onModeChange(value as GameMode)}>
                    <SelectTrigger id="mode">
                      <SelectValue placeholder="Choose mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Player</SelectItem>
                      <SelectItem value="multiplayer">Multiplayer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 sm:col-span-1">
                  <Label htmlFor="players">Players</Label>
                  <Select
                    value={String(mode === "single" ? 1 : playerNames.length)}
                    disabled={mode === "single"}
                    onValueChange={(value) => updatePlayerCount(Number(value))}
                  >
                    <SelectTrigger id="players">
                      <SelectValue placeholder="Players" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6].map((count) => (
                        <SelectItem key={count} value={String(count)}>{count}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 sm:col-span-2">
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

                <div className="grid gap-2 sm:col-span-4">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={(value) => onDifficultyChange(value as Difficulty)}>
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Choose difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label} - {item.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="penalty">Wrong tap penalty</Label>
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
                  <Badge variant="outline">
                    {mode === "single" ? 1 : playerNames.length}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="grid gap-2 px-5 sm:grid-cols-2 lg:grid-cols-1">
                {playerNames.map((name, index) => (
                  <div className="grid gap-2" key={index}>
                    <Label className="sr-only" htmlFor={`player-${index}`}>Player {index + 1}</Label>
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
