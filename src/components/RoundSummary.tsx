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
    <section className="flex h-full items-center justify-center px-1">
      <Card className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-hidden">
        <CardHeader className="border-b text-center">
          <CardDescription>
            {isFinalRound ? "Final round finished" : `Next up: Round ${round + 1}`}
          </CardDescription>
          <CardTitle className="text-3xl tracking-tight sm:text-5xl">
            Round {round} Complete
          </CardTitle>
        </CardHeader>

        <CardContent className="min-h-0 overflow-auto p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="gap-3 bg-muted/20 py-4 shadow-none">
              <CardHeader className="px-4">
                <CardTitle className="text-base">Round result</CardTitle>
                <CardDescription>Fastest player this round appears first.</CardDescription>
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

            <Card className="gap-3 bg-muted/20 py-4 shadow-none">
              <CardHeader className="px-4">
                <CardTitle className="text-base">Overall ranking</CardTitle>
                <CardDescription>Total time across every completed turn.</CardDescription>
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

        <Separator />

        <CardFooter className="justify-end p-4 sm:p-6">
          <Button onClick={isFinalRound ? onFinishGame : onNextRound}>
            {isFinalRound ? "See Final Results" : "Start Next Round"}
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
