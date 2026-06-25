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
  quitLabel?: string;
  quitTitle?: string;
  quitDescription?: string;
  quitConfirmLabel?: string;
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
  quitLabel,
  quitTitle,
  quitDescription,
  quitConfirmLabel,
  onNumberSelect,
  onContinue,
  onBackToSetup,
  onToggleMute,
  onToggleAutoContinue,
}: GameScreenProps) {
  const isDenseBoard = board.length >= 100;

  return (
    <main className="app-shell">
      <div className="game-play-shell">
        <Card className="glass-panel game-play-topbar py-0">
          <CardContent className="grid h-full gap-3 p-3 sm:flex sm:items-center sm:justify-between sm:p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">Round {currentRound}/{config.totalRounds}</Badge>
                <span className="truncate text-sm font-black text-slate-950 sm:text-base">{currentPlayer?.name ?? "Player"}</span>
              </div>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{getObjective(phase, targetHidden)}</p>
            </div>

            <div className="grid min-w-0 grid-cols-[auto_auto_1fr_1fr] items-center gap-1.5 sm:flex sm:shrink-0 sm:flex-wrap sm:justify-end sm:gap-2">
              <Badge variant="outline" className="h-9 justify-center rounded-2xl px-3 text-[11px] sm:text-xs">
                Wrong {currentWrongTaps}
              </Badge>
              <Badge variant="secondary" className="h-9 justify-center rounded-2xl px-3 text-[11px] sm:text-xs">
                +{config.penaltySeconds}s penalty
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-9 min-w-0 rounded-2xl px-2 text-xs sm:px-3"
                aria-label={isMuted ? "Sound is muted. Tap to turn sound on." : "Sound is on. Tap to mute."}
                title={isMuted ? "Sound is muted. Tap to turn sound on." : "Sound is on. Tap to mute."}
                onClick={onToggleMute}
              >
                <span className="truncate">{isMuted ? "Muted" : "Sound on"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 min-w-0 rounded-2xl px-2 text-xs sm:px-3"
                aria-label={autoContinue ? "Auto next is on. Turn summaries advance automatically." : "Manual next is on. Use Continue after each turn."}
                title={autoContinue ? "Auto next advances after each turn summary." : "Manual next waits for the Continue button after each turn."}
                onClick={onToggleAutoContinue}
              >
                <span className="truncate">{autoContinue ? "Auto next" : "Manual next"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="game-play-meta">
          <TargetDisplay targetNumber={targetNumber} hidden={targetHidden} />
          <Timer elapsedMs={elapsedMs} />
        </div>

        <Card className="glass-panel game-play-board-card py-0">
          <CardContent className="flex h-full min-h-0 flex-col items-center justify-center gap-2 p-2 sm:p-4">
            {isDenseBoard && (
              <div className="rounded-full bg-white/85 px-3 py-1 text-center text-xs font-bold text-slate-700 shadow-sm" role="note">
                100-number board: all numbers fit inside this square. Tap the center of a tile.
              </div>
            )}
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

        <Card className="soft-panel game-play-status py-0">
          <CardContent className="flex h-full items-center justify-center p-3 text-center text-sm" role="status" aria-live="polite">
            {phase === "preview" && (
              <span>
                Target hides in <Badge variant="secondary" className="ml-1 rounded-full">{previewCountdown}</Badge>
              </span>
            )}
            {phase === "playing" && (
              <span>
                {statusMessage || "Find the matching number on the board."}
                {lastSelectionWasWrong && lastSelectedNumber !== null && (
                  <span className="ml-2 rounded-full bg-red-50 px-2 py-1 font-black text-destructive">
                    Not {lastSelectedNumber}. +{config.penaltySeconds}s.
                  </span>
                )}
              </span>
            )}
            {phase === "turnSummary" && lastResult && (
              <span>
                {lastResult.playerName} finished in {formatTime(lastResult.finalTimeMs)}
                {autoContinue && <span className="ml-2 text-muted-foreground">Auto next is on.</span>}
              </span>
            )}
          </CardContent>
        </Card>

        <div className="game-stage-actions" aria-label="Game actions">
          <QuitGameDialog
            onConfirm={onBackToSetup}
            triggerLabel={quitLabel}
            title={quitTitle}
            description={quitDescription}
            confirmLabel={quitConfirmLabel}
          />
          {phase === "turnSummary" && lastResult && (
            <Button className="h-12 rounded-2xl font-black" onClick={onContinue}>Continue</Button>
          )}
        </div>
      </div>
    </main>
  );
}
