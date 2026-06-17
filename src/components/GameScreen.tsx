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
  onNumberSelect: (value: number) => void;
  onContinue: () => void;
  onBackToSetup: () => void;
  onToggleMute: () => void;
  onToggleAutoContinue: () => void;
}

/**
 * Active gameplay screen.
 * Kept separate from the controller hook so layout and game logic stop wrestling in public.
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
  onNumberSelect,
  onContinue,
  onBackToSetup,
  onToggleMute,
  onToggleAutoContinue,
}: GameScreenProps) {
  return (
    <main className="app-shell">
      <div className="flex h-full min-h-0 flex-col gap-2">
        <Card className="shrink-0 gap-0 py-0">
          <CardContent className="flex items-center justify-between gap-2 p-2 sm:p-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold sm:text-base">{currentPlayer?.name}</div>
              <div className="text-xs text-muted-foreground">
                Round {currentRound} / {config.totalRounds}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              <Badge variant="outline">Wrong {currentWrongTaps}</Badge>
              <Badge variant="secondary">+{config.penaltySeconds}s</Badge>
              <Button variant="outline" size="sm" onClick={onToggleMute}>
                {isMuted ? "Muted" : "Sound"}
              </Button>
              <Button variant="outline" size="sm" onClick={onToggleAutoContinue}>
                {autoContinue ? "Auto" : "Manual"}
              </Button>
              <QuitGameDialog onConfirm={onBackToSetup} />
            </div>
          </CardContent>
        </Card>

        <div className="grid shrink-0 grid-cols-[1fr_0.62fr] gap-2">
          <TargetDisplay targetNumber={targetNumber} hidden={targetHidden} />
          <Timer elapsedMs={elapsedMs} />
        </div>

        <Card className="min-h-0 flex-1 gap-0 py-0">
          <CardContent className="flex h-full min-h-0 items-center justify-center p-2">
            <NumberGrid
              numbers={board}
              targetNumber={targetNumber}
              selectedNumber={lastSelectedNumber}
              isSelectionWrong={lastSelectionWasWrong}
              disabled={phase !== "playing"}
              onSelect={onNumberSelect}
            />
          </CardContent>
        </Card>

        <Card className="shrink-0 gap-0 py-0">
          <CardContent className="p-2 text-center text-sm" role="status" aria-live="polite">
            {phase === "preview" && (
              <span>
                Memorize the target. Hiding in <Badge variant="secondary" className="ml-1">{previewCountdown}</Badge>
              </span>
            )}
            {phase === "playing" && (
              <span>
                {statusMessage}
                {lastSelectionWasWrong && lastSelectedNumber !== null && (
                  <span className="ml-2 font-semibold text-destructive">
                    {lastSelectedNumber} is wrong. +{config.penaltySeconds}s
                  </span>
                )}
              </span>
            )}
            {phase === "turnSummary" && lastResult && (
              <div className="flex items-center justify-between gap-2">
                <span>
                  {lastResult.playerName}: {formatTime(lastResult.finalTimeMs)}
                  {autoContinue && <span className="ml-2 text-muted-foreground">Auto-continuing...</span>}
                </span>
                <Button size="sm" onClick={onContinue}>
                  Continue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
