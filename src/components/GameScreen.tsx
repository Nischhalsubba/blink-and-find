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
    return "Memorize the number before it hides.";
  }

  if (phase === "playing" && targetHidden) {
    return "Scan the board and tap the matching number.";
  }

  if (phase === "turnSummary") {
    return "Round complete. Review the result.";
  }

  return "Get ready for the next round.";
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
      <div className="design-shell flex h-full min-h-0 flex-col gap-3">
        <Card className="glass-panel shrink-0 overflow-hidden rounded-[1.75rem] py-0">
          <CardContent className="grid gap-3 p-3 sm:flex sm:items-center sm:justify-between sm:p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">Round {currentRound}/{config.totalRounds}</Badge>
                <span className="truncate text-sm font-black text-slate-950 sm:text-base">{currentPlayer?.name ?? "Player"}</span>
              </div>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{getObjective(phase, targetHidden)}</p>
            </div>

            <div className="grid min-w-0 grid-cols-[auto_auto_1fr_1fr_1fr] items-center gap-1.5 sm:flex sm:shrink-0 sm:flex-wrap sm:justify-end sm:gap-2">
              <Badge variant="outline" className="h-9 justify-center rounded-2xl px-3 text-[11px] sm:text-xs">
                Wrong {currentWrongTaps}
              </Badge>
              <Badge variant="secondary" className="h-9 justify-center rounded-2xl px-3 text-[11px] sm:text-xs">
                +{config.penaltySeconds}s penalty
              </Badge>
              <Button variant="outline" size="sm" className="h-9 min-w-0 rounded-2xl px-2 text-xs sm:px-3" onClick={onToggleMute}>
                <span className="truncate">{isMuted ? "Muted" : "Sound"}</span>
              </Button>
              <Button variant="outline" size="sm" className="h-9 min-w-0 rounded-2xl px-2 text-xs sm:px-3" onClick={onToggleAutoContinue}>
                <span className="truncate">{autoContinue ? "Auto" : "Manual"}</span>
              </Button>
              <QuitGameDialog onConfirm={onBackToSetup} />
            </div>
          </CardContent>
        </Card>

        <div className="grid shrink-0 grid-cols-[1fr_0.72fr] gap-3 sm:grid-cols-[1fr_0.58fr]">
          <TargetDisplay targetNumber={targetNumber} hidden={targetHidden} />
          <Timer elapsedMs={elapsedMs} />
        </div>

        <Card className="glass-panel min-h-0 flex-1 overflow-hidden rounded-[2rem] py-0">
          <CardContent className="flex h-full min-h-0 items-center justify-center p-2 sm:p-4">
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

        <Card className="soft-panel shrink-0 rounded-[1.5rem] py-0">
          <CardContent className="p-3 text-center text-sm" role="status" aria-live="polite">
            {phase === "preview" && (
              <span>
                Target hides in <Badge variant="secondary" className="ml-1 rounded-full">{previewCountdown}</Badge>
              </span>
            )}
            {phase === "playing" && (
              <span>
                {statusMessage || "Find the matching number on the board."}
                {lastSelectionWasWrong && lastSelectedNumber !== null && (
                  <span className="ml-2 font-bold text-destructive">
                    Not {lastSelectedNumber}. +{config.penaltySeconds}s.
                  </span>
                )}
              </span>
            )}
            {phase === "turnSummary" && lastResult && (
              <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                <span>
                  {lastResult.playerName} finished in {formatTime(lastResult.finalTimeMs)}
                  {autoContinue && <span className="ml-2 text-muted-foreground">Next screen is coming...</span>}
                </span>
                <Button size="sm" className="rounded-2xl" onClick={onContinue}>Continue</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
