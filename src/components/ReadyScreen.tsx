import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
 * Shadcn-style pre-turn screen.
 * This gives each player an intentional handoff before the target flashes.
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
    <section className="flex h-full items-center justify-center px-1">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardDescription>
            Round {round} of {config.totalRounds} · Player {playerIndex + 1} of {totalPlayers}
          </CardDescription>
          <CardTitle className="text-3xl tracking-tight sm:text-5xl">
            {player?.name ?? "Player"}, get ready
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4">
          <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
            Everyone in this round gets the same board and target. Memorize the number when it appears, then find it after it hides.
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground">Tiles</div>
              <div className="font-semibold">{config.boardSize}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground">Preview</div>
              <div className="font-semibold">{config.flashDurationMs / 1000}s</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground">Penalty</div>
              <div className="font-semibold">+{config.penaltySeconds}s</div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={onBackToSetup}>
            Back to Setup
          </Button>
          <Button onClick={onStartTurn}>
            Show Target
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
