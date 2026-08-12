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

type LaunchTarget = "single" | "multiplayer" | "online";

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

function clampNumber(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(min, Math.min(Math.floor(value), max));
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
  const normalDifficulty = DIFFICULTIES.find((item) => item.id === "normal") ?? DIFFICULTIES[1];
  const easyDifficulty = DIFFICULTIES.find((item) => item.id === "easy") ?? normalDifficulty;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [launchTarget, setLaunchTarget] = useState<LaunchTarget>(mode);
  const [boardSize, setBoardSize] = useState(normalDifficulty.boardSize);
  const [previewSeconds, setPreviewSeconds] = useState(Math.max(1, Math.round(normalDifficulty.flashDurationMs / 1000)));

  const safeBoardSize = clampNumber(boardSize, 4, 225, normalDifficulty.boardSize);
  const safePreviewSeconds = clampNumber(previewSeconds, 1, 15, 2);
  const safeRounds = clampNumber(totalRounds, 1, 20, 5);
  const safePenaltySeconds = clampNumber(penaltySeconds, 0, 10, 3);
  const customNumbers = parseCustomNumbers(customNumbersInput, safeBoardSize);
  const remainingRandomSlots = Math.max(0, safeBoardSize - customNumbers.numbers.length);
  const gridSize = Math.ceil(Math.sqrt(safeBoardSize));
  const difficultyForConfig = difficulty;

  function updatePlayerCount(count: number) {
    const nextNames = Array.from({ length: count }, (_, index) => playerNames[index] ?? `Player ${index + 1}`);
    onPlayerNamesChange(nextNames);
  }

  function updatePlayerName(index: number, name: string) {
    const nextNames = [...playerNames];
    nextNames[index] = name;
    onPlayerNamesChange(nextNames);
  }

  function applyPreset(item: typeof DIFFICULTIES[number]) {
    onDifficultyChange(item.id);
    setBoardSize(item.boardSize);
    setPreviewSeconds(Math.max(1, Math.round(item.flashDurationMs / 1000)));
  }

  function openSetup(target: LaunchTarget, guided = false) {
    setLaunchTarget(target);

    if (target !== "online") {
      onModeChange(target);
    }

    if (guided) {
      applyPreset(easyDifficulty);
      onTotalRoundsChange(3);
      onPenaltySecondsChange(1);
    } else if (target === "single") {
      applyPreset(normalDifficulty);
      onTotalRoundsChange(5);
      onPenaltySecondsChange(3);
    }

    if (target === "multiplayer") {
      updatePlayerCount(Math.max(2, playerNames.length));
    }

    setSettingsOpen(true);
  }

  function handleCustomStart() {
    const localMode: GameMode = launchTarget === "multiplayer" ? "multiplayer" : "single";

    onStart({
      mode: localMode,
      difficulty: difficultyForConfig,
      boardSize: safeBoardSize,
      totalRounds: safeRounds,
      flashDurationMs: safePreviewSeconds * 1000,
      penaltySeconds: safePenaltySeconds,
      customNumbers: customNumbers.numbers,
    });
  }

  function buildOnlineHref() {
    const params = new URLSearchParams({
      board: String(safeBoardSize),
      rounds: String(safeRounds),
      preview: String(safePreviewSeconds),
      penalty: String(safePenaltySeconds),
    });

    if (customNumbersInput.trim()) {
      params.set("numbers", customNumbersInput.trim());
    }

    return `/online?${params.toString()}`;
  }

  if (settingsOpen) {
    return (
      <section className="min-h-full overflow-y-auto px-3 py-4 sm:px-6 sm:py-8">
        <div className="design-shell grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
          <Card className="glass-panel overflow-hidden rounded-[2rem]">
            <CardHeader className="border-b p-6 sm:p-8">
              <Badge variant="secondary" className="mb-4 w-fit rounded-full px-3 py-1">Pre-match setup</Badge>
              <CardTitle className="hero-title text-4xl sm:text-6xl">Customize everything first.</CardTitle>
              <CardDescription className="hero-copy mt-4 text-base">
                Choose the board, required numbers, preview timer, penalty timer, rounds, and then the mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-6 sm:p-8">
              <div className="rounded-[1.5rem] border bg-white/75 p-4">
                <div className="text-sm font-black text-slate-950">Current setup</div>
                <div className="mt-2 text-4xl font-black tracking-[-0.05em] text-slate-950">{gridSize}x{gridSize}</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {safeBoardSize} slots · {customNumbers.numbers.length} chosen · {remainingRandomSlots} random · {safePreviewSeconds}s preview · +{safePenaltySeconds}s penalty
                </p>
              </div>
              <div className="rounded-[1.5rem] border bg-white/75 p-4 text-sm leading-6 text-muted-foreground">
                Example: choose <strong className="text-slate-950">5x5</strong>, type <strong className="text-slate-950">1 to 20</strong>, then start solo, same-device, or online. The game fills 5 random slots and reshuffles every round.
              </div>
              <Button variant="outline" className="h-14 rounded-2xl text-base font-bold" onClick={() => setSettingsOpen(false)}>Back to home</Button>
            </CardContent>
          </Card>

          <Card className="glass-panel overflow-hidden rounded-[2rem]">
            <CardHeader className="border-b p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Badge variant="outline" className="mb-2 w-fit rounded-full">Before starting</Badge>
                  <CardTitle className="text-2xl font-black tracking-[-0.04em]">Full match setup</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)}>Close</Button>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 p-6 sm:p-8">
              <div className="grid gap-2 rounded-[1.5rem] border bg-white/70 p-4">
                <Label>Step 1: Board size</Label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map((item) => (
                    <ChoicePill key={item.id} compact active={safeBoardSize === item.boardSize} onClick={() => applyPreset(item)}>
                      {Math.ceil(Math.sqrt(item.boardSize))}x{Math.ceil(Math.sqrt(item.boardSize))}
                    </ChoicePill>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="grid gap-2">
                    <Label htmlFor="board-size">Custom total slots</Label>
                    <Input id="board-size" className="h-12 rounded-2xl" min={4} max={225} type="number" value={boardSize} onChange={(event) => setBoardSize(clampNumber(Number(event.target.value), 4, 225, 100))} />
                  </div>
                  <Badge variant="outline" className="h-12 justify-center rounded-2xl px-4">Near {gridSize}x{gridSize}</Badge>
                </div>
              </div>

              <div className="grid gap-2 rounded-[1.5rem] border bg-white/70 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <Label htmlFor="custom-numbers">Step 2: Numbers that must appear</Label>
                  <Badge variant="outline">{customNumbers.numbers.length}/{safeBoardSize}</Badge>
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
                    <span>The board keeps your {customNumbers.numbers.length} chosen number{customNumbers.numbers.length === 1 ? "" : "s"}; {remainingRandomSlots} random unique slot{remainingRandomSlots === 1 ? "" : "s"} will be added. Every round reshuffles.</span>
                  ) : (
                    <span>Leave empty for a fully random board. Ranges like 1 to 20, 1-20, and 1..20 are supported.</span>
                  )}
                  {customNumbers.ignoredCount > 0 && <span className="mt-1 block font-bold text-destructive">Only the first {safeBoardSize} unique numbers will be used.</span>}
                </div>
              </div>

              <div className="grid gap-3 rounded-[1.5rem] border bg-white/70 p-4">
                <Label>Step 3: Timers and rounds</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="rounds">Rounds</Label>
                    <Input id="rounds" className="h-12 rounded-2xl text-center text-base" min={1} max={20} type="number" value={safeRounds} onChange={(event) => onTotalRoundsChange(clampNumber(Number(event.target.value), 1, 20, 5))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="preview">Preview timer</Label>
                    <Input id="preview" className="h-12 rounded-2xl text-center text-base" min={1} max={15} type="number" value={safePreviewSeconds} onChange={(event) => setPreviewSeconds(clampNumber(Number(event.target.value), 1, 15, 2))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="penalty">Penalty timer</Label>
                    <Input id="penalty" className="h-12 rounded-2xl text-center text-base" min={0} max={10} type="number" value={safePenaltySeconds} onChange={(event) => onPenaltySecondsChange(clampNumber(Number(event.target.value), 0, 10, 3))} />
                  </div>
                </div>
              </div>

              <div className="grid gap-2 rounded-[1.5rem] border bg-white/70 p-4">
                <Label>Step 4: Choose mode</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ChoicePill compact active={launchTarget === "single"} onClick={() => { setLaunchTarget("single"); onModeChange("single"); }}>Solo</ChoicePill>
                  <ChoicePill compact active={launchTarget === "multiplayer"} onClick={() => { setLaunchTarget("multiplayer"); onModeChange("multiplayer"); updatePlayerCount(Math.max(2, playerNames.length)); }}>Same device</ChoicePill>
                  <ChoicePill compact active={launchTarget === "online"} onClick={() => setLaunchTarget("online")}>Online</ChoicePill>
                </div>
              </div>

              {launchTarget === "multiplayer" && (
                <div className="grid gap-2 rounded-[1.5rem] border bg-white/70 p-4">
                  <div className="flex items-center justify-between">
                    <Label>Player names</Label>
                    <Badge variant="outline">{playerNames.length}</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 3, 4, 5].map((count) => (
                      <ChoicePill key={count} compact active={playerNames.length === count} onClick={() => updatePlayerCount(count)}>{count}</ChoicePill>
                    ))}
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
              {launchTarget === "online" ? (
                <Button asChild className="h-14 w-full rounded-2xl text-base font-black">
                  <Link href={buildOnlineHref()}>Continue to Online Setup</Link>
                </Button>
              ) : (
                <Button className="h-14 w-full rounded-2xl text-base font-black" onClick={handleCustomStart}>Start {launchTarget === "multiplayer" ? "Same-Device" : "Solo"} Match</Button>
              )}
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
                  <Button size="lg" className="h-14 rounded-2xl px-8 text-base font-black" onClick={() => openSetup("single")}>Customize Match</Button>
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
              <Button className="h-14 rounded-2xl text-base font-black" onClick={() => openSetup("single", true)}>Customize Guided Game</Button>
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
          <FlowCard number="01" title="Customize" description="Set board size, timers, penalty, rounds, and numbers first." />
          <FlowCard number="02" title="Choose mode" description="Start solo, same-device, or continue into online room setup." />
          <FlowCard number="03" title="Play" description="The board keeps your numbers and reshuffles every round." />
        </div>

        <div className="grid gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.045em]">How do you want to play?</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Customize the setup first, then choose the mode before starting.</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <PlayChoiceCard title="Play solo" description="Customize everything, then beat your own best time." bestFor="first-time players and quick practice" action="Customize solo" tone="solo" onClick={() => openSetup("single")} />
            <PlayChoiceCard title="Play together" description="Customize everything before local multiplayer starts." bestFor="family, classroom, friends nearby" action="Customize players" tone="together" onClick={() => openSetup("multiplayer")} />
            <PlayChoiceCard title="Play online" description="Customize settings, then create a room for another device." bestFor="friends away from you" action="Customize online" tone="online" onClick={() => openSetup("online")} />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.045em]">Explore modes</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Once the loop clicks, choose a mode by mood: learn, relax, race, or compete.</p>
            </div>
            <Button variant="outline" className="h-11 rounded-2xl font-bold" onClick={() => openSetup("single")}>Customize setup</Button>
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
