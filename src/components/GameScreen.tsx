import NumberGrid from "@/components/NumberGrid";
import QuitGameDialog from "@/components/QuitGameDialog";
import TargetDisplay from "@/components/TargetDisplay";
import Timer from "@/components/Timer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTime } from "@/engine/scoring";
import type { GameConfig, GamePhase, Player, TurnResult } from "@/types/game";

interface GameScreenProps {
  phase: GamePhase;
  config: GameConfig;
  currentPlayer: Player | null;
  currentRound: number;
  board: number[];
  targetNumber: number | null;
  targetHidden: boolean;
  elapsedMs: number;
  previewCountdown: number;
  currentWrongTaps: number;
  lastSelectedNumber: number | null;
  lastSelectionWasWrong: boolean;
  lastResult: TurnResult | null;
  statusMessage: string;
  isMuted: boolean;
  autoContinue: boolean;
  boardScatterKey?: string | number;
  onNumberSelect: (value: number) => void;
  onContinue: () => void;
  onBackToSetup: () => void;
  onToggleMute: () => void;
  onToggleAutoContinue: () => void;
}

function getObjective(phase: GamePhase, targetHidden: boolean) {
  if (phase === "preview") {
    return "Remember the target number.";
  }

  if (phase === "playing" && targetHidden) {
    return "Find the hidden match on the board.";
  }

  if (phase === "turnSummary") {
    return "Round complete. Take the win.";
  }

  return "Get ready.";
}

export default function GameScreen({
  phase,
  config,
  currentPlayer,
  currentRound,
  board,
  targetNumber,
  targetHidden,
  elapsedMs,
  previewCountdown,
  currentWrongTaps,
  lastSelectedNumber,
  lastSelectionWasWrong,
  lastResult,
  statusMessage,
  isMuted,
  autoContinue,
  boardScatterKey,
  onNumberSelect,
  onContinue,
  onBackToSetup,
  onToggleMute,
  onToggleAutoContinue,
}: GameScreenProps) {
  return (
    <main className="app-shell">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-2 sm:gap-3">
        <Card className="shrink-0 overflow-hidden border-white/70 bg-white/85 py-0 shadow-sm backdrop-blur">
          <CardContent className="grid gap-2 p-2.5 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full">Round {currentRound}/{config.totalRounds}</Badge>
                <span className="truncate text-sm font-black sm:text-base">{currentPlayer?.name ?? "Player"}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">{getObjective(phase, targetHidden)}</p>
            </div>

            <div className="grid min-w-0 grid-cols-[auto_auto_1fr_1fr_1fr] items-center gap-1.5 sm:flex sm:shrink-0 sm:flex-wrap sm:justify-end sm:gap-2">
              <Badge variant="outline" className="h-8 justify-center rounded-full px-3 text-[11px] sm:text-xs">
                Wrong {currentWrongTaps}
              </Badge>
              <Badge variant="secondary" className="h-8 justify-center rounded-full px-3 text-[11px] sm:text-xs">
                Penalty +{config.penaltySeconds}s
              </Badge>
              <Button variant="outline" size="sm" className="h-8 min-w-0 rounded-full px-2 text-xs sm:px-3" onClick={onToggleMute}>
                <span className="truncate">{isMuted ? "Muted" : "Sound"}</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8 min-w-0 rounded-full px-2 text-xs sm:px-3" onClick={onToggleAutoContinue}>
                <span className="truncate">{autoContinue ? "Auto" : "Manual"}</span>
              </Button>
              <QuitGameDialog onConfirm={onBackToSetup} />
            </div>
          </CardContent>
        </Card>

        <div className="grid shrink-0 grid-cols-[1fr_0.72fr] gap-2 sm:grid-cols-[1fr_0.62fr] sm:gap-3">
          <TargetDisplay targetNumber={targetNumber} hidden={targetHidden} />
          <Timer elapsedMs={elapsedMs} />
        </div>

        <Card className="min-h-0 flex-1 border-white/70 bg-white/80 py-0 shadow-sm backdrop-blur">
          <CardContent className="flex h-full min-h-0 items-center justify-center p-1.5 sm:p-3">
            <NumberGrid
              numbers={board}
              targetNumber={targetNumber}
              selectedNumber={lastSelectedNumber}
              isSelectionWrong={lastSelectionWasWrong}
              scatterKey={boardScatterKey ?? currentRound}
              disabled={phase !== "playing"}
              onSelect={onNumberSelect}
            />
          </CardContent>
        </Card>

        <Card className="shrink-0 border-white/70 bg-white/85 py-0 shadow-sm backdrop-blur">
          <CardContent className="p-3 text-center text-xs sm:p-4 sm:text-sm" role="status" aria-live="polite">
            {phase === "preview" && (
              <span>
                Look closely. The target hides in <Badge variant="secondary" className="ml-1 rounded-full">{previewCountdown}</Badge>
              </span>
            )}
            {phase === "playing" && (
              <span>
                {statusMessage || "Target hidden. Find the matching number on the board."}
                {lastSelectionWasWrong && lastSelectedNumber !== null && (
                  <span className="ml-2 font-semibold text-destructive">
                    Not {lastSelectedNumber}. +{config.penaltySeconds}s, but keep going.
                  </span>
                )}
              </span>
            )}
            {phase === "turnSummary" && lastResult && (
              <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                <span>
                  Nice. {lastResult.playerName} finished in {formatTime(lastResult.finalTimeMs)}
                  {autoContinue && <span className="ml-2 text-muted-foreground">Next screen is coming...</span>}
                </span>
                <Button size="sm" className="rounded-full" onClick={onContinue}>Continue</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
