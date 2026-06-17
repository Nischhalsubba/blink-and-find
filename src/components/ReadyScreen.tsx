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
    <section className="flex h-full items-center justify-center px-2">
      <Card className="w-full max-w-xl overflow-hidden">
        <CardHeader className="border-b pb-4">
          <Badge variant="secondary" className="mb-3 w-fit">
            Round {round} / {config.totalRounds}
          </Badge>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            {player?.name ?? "Player"}, get ready
          </CardTitle>
          <CardDescription>
            Player {playerIndex + 1} of {totalPlayers}. Same board and target for everyone this round.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-3 p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="text-muted-foreground">Tiles</div>
              <div className="font-semibold">{config.boardSize}</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="text-muted-foreground">Preview</div>
              <div className="font-semibold">{config.flashDurationMs / 1000}s</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="text-muted-foreground">Penalty</div>
              <div className="font-semibold">+{config.penaltySeconds}s</div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Memorize the number when it appears, then find it after it hides.
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-3 border-t p-4 sm:p-5">
          <Button variant="outline" onClick={onBackToSetup}>
            Back
          </Button>
          <Button onClick={onStartTurn}>
            Show Target
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
