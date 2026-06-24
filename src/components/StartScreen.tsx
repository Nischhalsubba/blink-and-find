"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import GameModeCard from "@/components/GameModeCard";
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
  customNumbersInput: string;
  onModeChange: (mode: GameMode) => void;
  onPlayerNamesChange: (names: string[]) => void;
  onTotalRoundsChange: (rounds: number) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onPenaltySecondsChange: (seconds: number) => void;
  onCustomNumbersInputChange: (input: string) => void;
  onStart: (config: GameConfig) => void;
}

function ChoicePill({ active, children, compact = false, onClick }: { active: boolean; children: ReactNode; compact?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-2xl border font-bold transition-all focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring",
        compact ? "min-h-11 px-3 py-2 text-sm" : "px-4 py-2 text-sm",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-primary/50 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function FlowCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <article className="soft-panel rounded-[1.75rem] p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-black text-white">{number}</div>
      <h3 className="text-lg font-black tracking-[-0.03em]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}

function PlayChoiceCard({ title, description, bestFor, action, href, tone, onClick }: { title: string; description: string; bestFor: string; action: string; href?: string; tone: "solo" | "together" | "online"; onClick?: () => void }) {
  const inner = (
    <Card className={cn("mode-intent-card h-full rounded-[1.75rem] transition-all hover:-translate-y-0.5 hover:shadow-lg", tone === "solo" && "choice-solo", tone === "together" && "choice-together", tone === "online" && "choice-online")}>
      <CardContent className="flex h-full flex-col gap-4 p-5 sm:p-6">
        <div>
          <h3 className="text-2xl font-black tracking-[-0.04em]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="mt-auto rounded-2xl bg-white/70 p-3 text-sm shadow-xs">
          <span className="font-bold text-slate-950">Best for: </span>
          <span className="text-muted-foreground">{bestFor}</span>
        </div>
        <span className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground">{action}</span>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block h-full rounded-[1.75rem] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">{inner}</Link>;
  }

  return <button type="button" onClick={onClick} className="block h-full w-full rounded-[1.75rem] text-left focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">{inner}</button>;
}

function expandRange(start: number, end: number) {
  const step = start <= end ? 1 : -1;
  const values: number[] = [];

  for (let value = start; step > 0 ? value <= end : value >= end; value += step) {
    values.push(value);
  }

  return values;
}

function parseCustomNumbers(input: string, limit: number) {
  const rangeMatches = Array.from(input.matchAll(/(\d+)\s*(?:-|\.\.|to)\s*(\d+)/gi));
  const rangeNumbers = rangeMatches.flatMap((match) => expandRange(Number(match[1]), Number(match[2])));
  const inputWithoutRanges = input.replace(/\d+\s*(?:-|\.\.|to)\s*\d+/gi, " ");
  const looseNumbers = inputWithoutRanges.match(/\d+/g)?.map((value) => Number(value)) ?? [];
  const rawNumbers = [...rangeNumbers, ...looseNumbers];
  const seen = new Set<number>();
  const unique = rawNumbers.filter((value) => {
    if (!Number.isInteger(value) || value <= 0 || seen.has(value)) {
      return false;
    }

    seen.add(value);
    return true;
  });

  return {
    numbers: unique.slice(0, Math.max(0, limit)),
    rawCount: rawNumbers.length,
    uniqueCount: unique.length,
    ignoredCount: Math.max(0, unique.length - limit),
  };
}

export default function StartScreen({
  mode,
  playerNames,
  totalRounds,
  difficulty,
  penaltySeconds,
  customNumbersInput,
  onModeChange,
  onPlayerNamesChange,
  onTotalRoundsChange,
  onDifficultyChange,
  onPenaltySecondsChange,
  onCustomNumbersInputChange,
  onStart,
}: StartScreenProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const selectedDifficulty = DIFFICULTIES.find((item) => item.id === difficulty) ?? DIFFICULTIES[1];
  const normalDifficulty = DIFFICULTIES.find((item) => item.id === "normal") ?? selectedDifficulty;
  const easyDifficulty = DIFFICULTIES.find((item) => item.id === "easy") ?? normalDifficulty;
  const customNumbers = parseCustomNumbers(customNumbersInput, selectedDifficulty.boardSize);
  const remainingRandomSlots = Math.max(0, selectedDifficulty.boardSize - customNumbers.numbers.length);
  const gridSize = Math.ceil(Math.sqrt(selectedDifficulty.boardSize));

  function updatePlayerCount(count: number) {
    const nextNames = Array.from({ length: count }, (_, index) => playerNames[index] ?? `Player ${index + 1}`);
    onPlayerNamesChange(nextNames);
  }

  function updatePlayerName(index: number, name: string) {
    const nextNames = [...playerNames];
    nextNames[index] = name;
    onPlayerNamesChange(nextNames);
  }

  function openSoloSetup() {
    onModeChange("single");
    onDifficultyChange(normalDifficulty.id);
    onTotalRoundsChange(5);
    onPenaltySecondsChange(3);
    setSettingsOpen(true);
  }

  function openGuidedSetup() {
    onModeChange("single");
    onDifficultyChange(easyDifficulty.id);
    onTotalRoundsChange(3);
    onPenaltySecondsChange(1);
    setSettingsOpen(true);
  }

  function handleCustomStart() {
    onStart({
      mode,
      difficulty,
      boardSize: selectedDifficulty.boardSize,
      totalRounds,
      flashDurationMs: selectedDifficulty.flashDurationMs,
      penaltySeconds,
      customNumbers: customNumbers.numbers,
    });
  }

  function openSameDeviceSetup() {
    onModeChange("multiplayer");
    updatePlayerCount(Math.max(2, playerNames.length));
    setSettingsOpen(true);
  }

  if (settingsOpen) {
    return (
      <section className="min-h-full overflow-y-auto px-3 py-4 sm:px-6 sm:py-8">
        <div className="design-shell grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
          <Card className="glass-panel overflow-hidden rounded-[2rem]">
            <CardHeader className="border-b p-6 sm:p-8">
              <Badge variant="secondary" className="mb-4 w-fit rounded-full px-3 py-1">Pre-match setup</Badge>
              <CardTitle className="hero-title text-4xl sm:text-6xl">Choose the board. Add your numbers.</CardTitle>
              <CardDescription className="hero-copy mt-4 text-base">
                Select a board size first. Then enter the numbers that must appear before the match starts.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-6 sm:p-8">
              <div className="rounded-[1.5rem] border bg-white/75 p-4">
                <div className="text-sm font-black text-slate-950">Current board</div>
                <div className="mt-2 text-4xl font-black tracking-[-0.05em] text-slate-950">{gridSize}x{gridSize}</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{selectedDifficulty.boardSize} total slots. {customNumbers.numbers.length} chosen, {remainingRandomSlots} random.</p>
              </div>
              <div className="rounded-[1.5rem] border bg-white/75 p-4 text-sm leading-6 text-muted-foreground">
                Example: on a 5x5 board, type <strong className="text-slate-950">1 to 20</strong>. The game will add 5 random unique numbers and reshuffle the 25-number board each round.
              </div>
              <Button variant="outline" className="h-14 rounded-2xl text-base font-bold" onClick={() => setSettingsOpen(false)}>Back to home</Button>
            </CardContent>
          </Card>

          <Card className="glass-panel overflow-hidden rounded-[2rem]">
            <CardHeader className="border-b p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Badge variant="outline" className="mb-2 w-fit rounded-full">Required before match</Badge>
                  <CardTitle className="text-2xl font-black tracking-[-0.04em]">Board and number entry</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)}>Close</Button>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 p-6 sm:p-8">
              <div className="grid gap-2 rounded-[1.5rem] border bg-white/70 p-4">
                <Label>Step 1: Select board size</Label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map((item) => (
                    <ChoicePill key={item.id} compact active={difficulty === item.id} onClick={() => onDifficultyChange(item.id)}>
                      {Math.ceil(Math.sqrt(item.boardSize))}x{Math.ceil(Math.sqrt(item.boardSize))}
                    </ChoicePill>
                  ))}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{selectedDifficulty.label}: {selectedDifficulty.description}, {selectedDifficulty.boardSize} total slots.</p>
              </div>

              <div className="grid gap-2 rounded-[1.5rem] border bg-white/70 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <Label htmlFor="custom-numbers">Step 2: Enter numbers that must appear</Label>
                  <Badge variant="outline">{customNumbers.numbers.length}/{selectedDifficulty.boardSize}</Badge>
                </div>
                <Input
                  id="custom-numbers"
                  className="h-12 rounded-2xl text-base"
                  inputMode="numeric"
                  placeholder="Example: 1 to 20 or 1, 2, 3, 8, 15"
                  value={customNumbersInput}
                  onChange={(event) => onCustomNumbersInputChange(event.target.value)}
                />
                <div className="rounded-2xl bg-white/80 p-3 text-sm leading-6 text-muted-foreground">
                  {customNumbers.numbers.length > 0 ? (
                    <span>
                      The board will include your {customNumbers.numbers.length} chosen number{customNumbers.numbers.length === 1 ? "" : "s"}. The remaining {remainingRandomSlots} slot{remainingRandomSlots === 1 ? "" : "s"} will be filled with random unique numbers. Every round reshuffles the full board.
                    </span>
                  ) : (
                    <span>Leave empty to use a fully random board. You can type ranges like 1 to 20, 1-20, or 1..20.</span>
                  )}
                  {customNumbers.ignoredCount > 0 && <span className="mt-1 block font-bold text-destructive">Only the first {selectedDifficulty.boardSize} unique numbers will be used for this board size.</span>}
                </div>
              </div>

              <div className="grid gap-2 rounded-[1.5rem] border bg-white/70 p-4">
                <Label>Step 3: Match type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <ChoicePill compact active={mode === "single"} onClick={() => onModeChange("single")}>Solo</ChoicePill>
                  <ChoicePill compact active={mode === "multiplayer"} onClick={() => onModeChange("multiplayer")}>Same device</ChoicePill>
                </div>
              </div>

              <div className="grid gap-2 rounded-[1.5rem] border bg-white/70 p-4">
                <Label>Players</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((count) => (
                    <ChoicePill key={count} compact active={(mode === "single" ? 1 : playerNames.length) === count} onClick={() => { onModeChange(count === 1 ? "single" : "multiplayer"); updatePlayerCount(count); }}>{count}</ChoicePill>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2 rounded-[1.5rem] border bg-white/70 p-4">
                  <Label htmlFor="rounds">Rounds</Label>
                  <Input id="rounds" className="h-12 rounded-2xl text-center text-base" min={1} max={20} type="number" value={totalRounds} onChange={(event) => onTotalRoundsChange(Number(event.target.value))} />
                </div>
                <div className="grid gap-2 rounded-[1.5rem] border bg-white/70 p-4">
                  <Label htmlFor="penalty">Penalty</Label>
                  <Input id="penalty" className="h-12 rounded-2xl text-center text-base" min={0} max={10} type="number" value={penaltySeconds} onChange={(event) => onPenaltySecondsChange(Number(event.target.value))} />
                </div>
              </div>

              {mode === "multiplayer" && (
                <div className="grid gap-2 rounded-[1.5rem] border bg-white/70 p-4">
                  <div className="flex items-center justify-between">
                    <Label>Player names</Label>
                    <Badge variant="outline">{playerNames.length}</Badge>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {playerNames.map((name, index) => (
                      <Input key={index} className="h-12 rounded-2xl" value={name} aria-label={`Player ${index + 1} name`} onChange={(event) => updatePlayerName(index, event.target.value)} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t p-6 sm:p-8">
              <Button className="h-14 w-full rounded-2xl text-base font-black" onClick={handleCustomStart}>Start match</Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-full overflow-y-auto px-3 py-4 sm:px-6 sm:py-8">
      <div className="design-shell grid gap-7">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="hero-card overflow-hidden rounded-[2.25rem]">
            <CardHeader className="relative overflow-hidden p-6 sm:p-10">
              <div className="relative max-w-3xl">
                <Badge variant="secondary" className="mb-5 w-fit rounded-full px-3 py-1">New concept game</Badge>
                <CardTitle className="hero-title rainbow-title text-5xl sm:text-7xl">Memorize the number. Find it faster.</CardTitle>
                <CardDescription className="hero-copy mt-5 max-w-2xl text-base sm:text-lg">
                  Blink & Find shows you a number, hides it, then challenges you to find the match on the board. Play solo, on one device, or online with someone far away.
                </CardDescription>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="h-14 rounded-2xl px-8 text-base font-black" onClick={openSoloSetup}>Set up match</Button>
                  <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl px-8 text-base font-bold">
                    <Link href="/tutorial">Learn how it works</Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="glass-panel overflow-hidden rounded-[2.25rem]">
            <CardHeader className="p-6 sm:p-8">
              <Badge variant="outline" className="mb-4 w-fit rounded-full">For new players</Badge>
              <CardTitle className="text-3xl font-black tracking-[-0.045em]">Start simple, then compete.</CardTitle>
              <CardDescription className="hero-copy mt-3">Best first route for ages 10-60: try a small board, understand the loop, then invite others.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-6 pt-0 sm:p-8 sm:pt-0">
              <Button className="h-14 rounded-2xl text-base font-black" onClick={openGuidedSetup}>Set up guided game</Button>
              <Link href="/comfort" className="flow-pill rounded-[1.35rem] p-4 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">
                <span className="block text-sm font-black text-slate-950">Comfort mode</span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">Bigger tiles, easier pace, lower pressure.</span>
              </Link>
              <Link href="/rules" className="flow-pill rounded-[1.35rem] p-4 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">
                <span className="block text-sm font-black text-slate-950">Rules in one minute</span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">Quick explanation before you play.</span>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <FlowCard number="01" title="Choose" description="Select the board size and enter any numbers that must appear." />
          <FlowCard number="02" title="Watch" description="Remember the target number before it hides." />
          <FlowCard number="03" title="Find" description="Scan the rearranged board and tap the matching number." />
        </div>

        <div className="grid gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.045em]">How do you want to play?</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Set up the board first, then start the match.</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <PlayChoiceCard title="Play solo" description="Choose board size, add numbers, then beat your own best time." bestFor="first-time players and quick practice" action="Set up solo" tone="solo" onClick={openSoloSetup} />
            <PlayChoiceCard title="Play together" description="Choose board size and required numbers before local multiplayer starts." bestFor="family, classroom, friends nearby" action="Set up players" tone="together" onClick={openSameDeviceSetup} />
            <PlayChoiceCard title="Play online" description="Create a room and match with someone on another device." bestFor="friends away from you" action="Create room" tone="online" href="/online" />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.045em]">Explore modes</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Once the loop clicks, choose a mode by mood: learn, relax, race, or compete.</p>
            </div>
            <Button variant="outline" className="h-11 rounded-2xl font-bold" onClick={() => setSettingsOpen(true)}>Customize setup</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <GameModeCard title="Practice" eyebrow="learn" description="Replay the core loop and build confidence before competing." href="/practice" actionLabel="Practice" tone="focus" />
            <GameModeCard title="Daily" eyebrow="habit" description="One shared board per day for a simple focus routine." href="/daily" actionLabel="Play daily" tone="calm" />
            <GameModeCard title="Time Attack" eyebrow="speed" description="A 60-second sprint for sharper recognition and faster scanning." href="/time-attack" actionLabel="Start sprint" tone="speed" />
            <GameModeCard title="Streak" eyebrow="precision" description="Keep a clean chain going. One wrong tap ends the run." href="/streak" actionLabel="Build streak" tone="progress" />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <GameModeCard title="Challenge Link" eyebrow="share" description="Send a fixed board so friends can compare the same exact run." href="/challenge" actionLabel="Make link" tone="focus" />
            <GameModeCard title="Zen" eyebrow="relax" description="Practice without a timer when you want calm repetition." href="/zen" actionLabel="Play zen" tone="calm" />
            <GameModeCard title="Leaderboard" eyebrow="progress" description="Compare saved times after you finish a strong run." href="/leaderboard" actionLabel="View scores" tone="progress" />
            <GameModeCard title="Profile" eyebrow="identity" description="Set your display name before rooms, scores, and shared results." href="/profile" actionLabel="Edit profile" tone="social" />
          </div>
        </div>

        <Card className="soft-panel rounded-[1.75rem]">
          <CardFooter className="flex flex-col gap-3 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Clear first, fast second. The game should make sense before it gets competitive.</span>
            <div className="flex flex-wrap justify-center gap-1">
              <Button asChild variant="ghost" size="sm"><Link href="/modes">Modes</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link href="/tips">Tips</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link href="/faq">FAQ</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link href="/stats">Stats</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link href="/history">History</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link href="/telemetry">QA</Link></Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
