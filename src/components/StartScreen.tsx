"use client";

import Link from "next/link";
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
 * Minimal setup screen. Keep the menu quiet so the game board can be the focus.
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
    <section className="flex h-full items-center justify-center px-2">
      <Card className="w-full max-w-xl overflow-hidden">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge variant="secondary" className="mb-3">
                Blink &amp; Find
              </Badge>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                Game setup
              </CardTitle>
              <CardDescription className="mt-2">
                Choose local play or create an online room.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="mode">Mode</Label>
              <Select value={mode} onValueChange={(value) => onModeChange(value as GameMode)}>
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Choose mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Player</SelectItem>
                  <SelectItem value="multiplayer">Same Device</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
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
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
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
                  <SelectItem value="1">1</SelectItem>
                  {[2, 3, 4, 5, 6].map((count) => (
                    <SelectItem key={count} value={String(count)}>{count}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Label>Player names</Label>
                <Badge variant="outline">{playerNames.length}</Badge>
              </div>
              <div className="grid max-h-36 gap-2 overflow-auto pr-1 sm:grid-cols-2">
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
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="text-sm text-muted-foreground">
            {selectedDifficulty.boardSize} tiles · {selectedDifficulty.flashDurationMs / 1000}s preview
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/online">Online</Link>
            </Button>
            <Button onClick={handleStart}>
              Start
            </Button>
          </div>
        </CardFooter>
      </Card>
    </section>
  );
}
