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

/**
 * Active gameplay screen.
 */
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
      <div className="flex h-full min-h-0 flex-col gap-1.5 sm:gap-2">
        <Card className="shrink-0 gap-0 overflow-hidden py-0">
          <CardContent className="grid gap-1.5 p-1.5 sm:flex sm:items-center sm:justify-between sm:gap-2 sm:p-3">
            <div className="flex min-w-0 items-center justify-between gap-2 sm:block">
              <div className="truncate text-xs font-semibold sm:text-base">{currentPlayer?.name}</div>
              <div className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">
                Round {currentRound}/{config.totalRounds}
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-[auto_auto_1fr_1fr_1fr] items-center gap-1 sm:flex sm:shrink-0 sm:flex-wrap sm:justify-end sm:gap-1.5">
              <Badge variant="outline" className="h-7 justify-center px-2 text-[11px] sm:h-auto sm:text-xs">
                Wrong {currentWrongTaps}
              </Badge>
              <Badge variant="secondary" className="h-7 justify-center px-2 text-[11px] sm:h-auto sm:text-xs">
                +{config.penaltySeconds}s
              </Badge>
              <Button variant="outline" size="sm" className="h-7 min-w-0 px-2 text-xs sm:h-8 sm:px-3" onClick={onToggleMute}>
                <span className="truncate">{isMuted ? "Muted" : "Sound"}</span>
              </Button>
              <Button variant="outline" size="sm" className="h-7 min-w-0 px-2 text-xs sm:h-8 sm:px-3" onClick={onToggleAutoContinue}>
                <span className="truncate">{autoContinue ? "Auto" : "Manual"}</span>
              </Button>
              <QuitGameDialog onConfirm={onBackToSetup} />
            </div>
          </CardContent>
        </Card>

        <div className="grid shrink-0 grid-cols-[1fr_0.72fr] gap-1.5 sm:grid-cols-[1fr_0.62fr] sm:gap-2">
          <TargetDisplay targetNumber={targetNumber} hidden={targetHidden} />
          <Timer elapsedMs={elapsedMs} />
        </div>

        <Card className="min-h-0 flex-1 gap-0 py-0">
          <CardContent className="flex h-full min-h-0 items-center justify-center p-1.5 sm:p-2">
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

        <Card className="shrink-0 gap-0 py-0">
          <CardContent className="p-2 text-center text-xs sm:text-sm" role="status" aria-live="polite">
            {phase === "preview" && (
              <span>
                Remember this number. It hides in <Badge variant="secondary" className="ml-1">{previewCountdown}</Badge>
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
              <div className="flex items-center justify-between gap-2">
                <span>
                  Nice. {lastResult.playerName} finished in {formatTime(lastResult.finalTimeMs)}
                  {autoContinue && <span className="ml-2 text-muted-foreground">Next screen is coming...</span>}
                </span>
                <Button size="sm" onClick={onContinue}>Continue</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
