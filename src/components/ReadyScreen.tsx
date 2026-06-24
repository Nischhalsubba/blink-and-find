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
import type { GameConfig, Player } from "@/types/game";

interface ReadyScreenProps {
  player: Player | null;
  round: number;
  totalPlayers: number;
  playerIndex: number;
  config: GameConfig;
  onStartTurn: () => void;
  onBackToSetup: () => void;
}

/**
 * Pre-turn handoff screen.
 */
export default function ReadyScreen({
  player,
  round,
  totalPlayers,
  playerIndex,
  config,
  onStartTurn,
  onBackToSetup,
}: ReadyScreenProps) {
  return (
    <section className="game-stage">
      <div className="game-stage-shell game-stage-shell--center">
        <Card className="glass-panel game-stage-card game-stage-card--compact py-0">
          <CardHeader className="game-stage-header">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit rounded-full px-3 py-1">
              Round {round} of {config.totalRounds}
            </Badge>
            <CardTitle className="hero-title text-4xl sm:text-5xl">
              {player?.name ?? "Player"}, your turn is ready
            </CardTitle>
            <CardDescription className="hero-copy mx-auto mt-3 max-w-lg">
              You are player {playerIndex + 1} of {totalPlayers}. First, memorize the target. Then find it on the scattered board.
            </CardDescription>
          </CardHeader>

          <CardContent className="game-stage-content grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.25rem] border bg-white/70 p-4 text-center">
                <div className="text-sm text-muted-foreground">Board</div>
                <div className="text-lg font-black">{config.boardSize} numbers</div>
              </div>
              <div className="rounded-[1.25rem] border bg-white/70 p-4 text-center">
                <div className="text-sm text-muted-foreground">Preview</div>
                <div className="text-lg font-black">{config.flashDurationMs / 1000}s</div>
              </div>
              <div className="rounded-[1.25rem] border bg-white/70 p-4 text-center">
                <div className="text-sm text-muted-foreground">Mistake</div>
                <div className="text-lg font-black">+{config.penaltySeconds}s</div>
              </div>
            </div>

            <p className="rounded-[1.25rem] bg-white/70 p-4 text-center text-sm leading-6 text-muted-foreground">
              Take a breath. Accuracy matters more than frantic tapping, which is rude but mathematically true.
            </p>
          </CardContent>

          <CardFooter className="game-stage-actions">
            <Button className="h-12 rounded-2xl font-bold" variant="outline" onClick={onBackToSetup}>Back</Button>
            <Button className="h-12 rounded-2xl font-black" onClick={onStartTurn}>Show Target</Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
