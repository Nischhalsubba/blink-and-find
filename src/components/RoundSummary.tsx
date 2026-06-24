import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTime } from "@/engine/scoring";
import type { Player, TurnResult } from "@/types/game";

interface RoundSummaryProps {
  round: number;
  totalRounds: number;
  players: Player[];
  results: TurnResult[];
  onNextRound: () => void;
  onFinishGame: () => void;
}

/**
 * Shows a compact summary after every player has finished the current round.
 */
export default function RoundSummary({
  round,
  totalRounds,
  players,
  results,
  onNextRound,
  onFinishGame,
}: RoundSummaryProps) {
  const roundResults = results
    .filter((result) => result.round === round)
    .sort((a, b) => a.finalTimeMs - b.finalTimeMs);

  const ranking = [...players].sort((a, b) => a.totalTimeMs - b.totalTimeMs);
  const isFinalRound = round >= totalRounds;

  return (
    <section className="game-stage">
      <div className="game-stage-shell game-stage-shell--center">
        <Card className="glass-panel game-stage-card game-stage-card--wide py-0">
          <CardHeader className="game-stage-header">
            <CardDescription className="hero-copy mx-auto max-w-2xl">
              {isFinalRound ? "All rounds are complete. One final look, then results." : `Great round. Round ${round + 1} is ready when you are.`}
            </CardDescription>
            <CardTitle className="hero-title mt-2 text-4xl sm:text-6xl">
              Round {round} complete
            </CardTitle>
          </CardHeader>

          <CardContent className="game-stage-content">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="gap-3 rounded-[1.5rem] bg-white/80 py-4 shadow-none">
                <CardHeader className="px-4">
                  <CardTitle className="text-base font-black">This round</CardTitle>
                  <CardDescription>Fastest clean search rises to the top. Wrong taps add time.</CardDescription>
                </CardHeader>
                <CardContent className="px-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Wrong</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roundResults.map((result, index) => (
                        <TableRow key={result.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{result.playerName}</TableCell>
                          <TableCell>{formatTime(result.finalTimeMs)}</TableCell>
                          <TableCell>{result.wrongTaps}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="gap-3 rounded-[1.5rem] bg-white/80 py-4 shadow-none">
                <CardHeader className="px-4">
                  <CardTitle className="text-base font-black">Overall standings</CardTitle>
                  <CardDescription>Lowest total time is leading the game.</CardDescription>
                </CardHeader>
                <CardContent className="px-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ranking.map((player, index) => (
                        <TableRow key={player.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{player.name}</TableCell>
                          <TableCell>{formatTime(player.totalTimeMs)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </CardContent>

          <CardFooter className="game-stage-actions">
            <Button asChild className="h-12 rounded-2xl font-bold" variant="outline"><a href="/">Back Home</a></Button>
            <Button className="h-12 rounded-2xl font-black" onClick={isFinalRound ? onFinishGame : onNextRound}>
              {isFinalRound ? "See Final Results" : "Start Next Round"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
