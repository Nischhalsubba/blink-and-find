import ShareableResultCard from "@/components/ShareableResultCard";
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
import { calculateGameStats } from "@/engine/stats";
import type { SavedScore } from "@/lib/storage";
import type { Player, TurnResult } from "@/types/game";

interface ResultScreenProps {
  players: Player[];
  results: TurnResult[];
  bestScore: SavedScore | null;
  latestScore: SavedScore | null;
  isNewBest: boolean;
  onPlayAgain: () => void;
}

/**
 * Final screen with ranking, saved best score, share text, and round history.
 */
export default function ResultScreen({
  players,
  results,
  bestScore,
  latestScore,
  isNewBest,
  onPlayAgain,
}: ResultScreenProps) {
  const ranking = [...players].sort((a, b) => a.totalTimeMs - b.totalTimeMs);
  const stats = calculateGameStats(results);
  const winner = ranking[0] ?? null;
  const history = [...results].sort((a, b) => {
    if (a.round !== b.round) {
      return a.round - b.round;
    }

    return a.finalTimeMs - b.finalTimeMs;
  });

  function copyResult() {
    if (!winner || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    const text = `I played Blink & Find. Winner: ${winner.name}, time: ${formatTime(winner.totalTimeMs)}, accuracy: ${stats.accuracyPercent.toFixed(0)}%, wrong taps: ${stats.totalWrongTaps}.`;
    void navigator.clipboard.writeText(text);
  }

  return (
    <section className="flex h-full items-center justify-center px-1">
      <Card className="max-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden">
        <CardHeader className="border-b text-center">
          <CardDescription>{isNewBest ? "New best saved. Nicely hunted." : "Game complete. Here is the scoreboard."}</CardDescription>
          <CardTitle className="text-3xl tracking-tight sm:text-5xl">
            {winner?.name ?? "Nobody"} wins
          </CardTitle>
        </CardHeader>

        <CardContent className="min-h-0 overflow-auto p-4 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-4">
            <Card className="gap-1 bg-muted/20 p-3 shadow-none">
              <div className="text-xs text-muted-foreground">Average turn</div>
              <div className="font-semibold">{formatTime(stats.averageTurnMs)}</div>
            </Card>
            <Card className="gap-1 bg-muted/20 p-3 shadow-none">
              <div className="text-xs text-muted-foreground">Accuracy</div>
              <div className="font-semibold">{stats.accuracyPercent.toFixed(0)}%</div>
            </Card>
            <Card className="gap-1 bg-muted/20 p-3 shadow-none">
              <div className="text-xs text-muted-foreground">Fastest find</div>
              <div className="font-semibold">{stats.fastestTurn ? formatTime(stats.fastestTurn.finalTimeMs) : "-"}</div>
            </Card>
            <Card className="gap-1 bg-muted/20 p-3 shadow-none">
              <div className="text-xs text-muted-foreground">Penalty time</div>
              <div className="font-semibold">{formatTime(stats.totalPenaltyMs)}</div>
            </Card>
          </div>

          <div className="mt-3 rounded-lg border bg-muted/20 p-3 text-sm">
            <div className="flex flex-col justify-between gap-1 sm:flex-row">
              <span className="text-muted-foreground">
                {isNewBest ? "Personal best updated" : "Best saved result"}
              </span>
              <strong>
                {bestScore ? `${bestScore.winnerName} - ${formatTime(bestScore.winnerTimeMs)}` : "No saved score yet. First victory gets the throne."}
              </strong>
            </div>
            {latestScore && !isNewBest && (
              <div className="mt-1 text-muted-foreground">
                This run: {latestScore.winnerName} - {formatTime(latestScore.winnerTimeMs)}
              </div>
            )}
          </div>

          {winner && (
            <ShareableResultCard
              eyebrow="Blink & Find Result"
              title={`${winner.name} wins`}
              subtitle={`${ranking.length} player${ranking.length === 1 ? "" : "s"} · ${results.length} turn${results.length === 1 ? "" : "s"}`}
              primaryLabel="Winning time"
              primaryValue={formatTime(winner.totalTimeMs)}
              metrics={[
                { label: "Accuracy", value: `${stats.accuracyPercent.toFixed(0)}%` },
                { label: "Wrong taps", value: String(stats.totalWrongTaps) },
                { label: "Fastest find", value: stats.fastestTurn ? formatTime(stats.fastestTurn.finalTimeMs) : "-" },
                { label: "Penalty", value: formatTime(stats.totalPenaltyMs) },
              ]}
              footer="Play the free number hunting memory game"
              filename={`blink-find-${winner.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-result.svg`}
              shareText={`I played Blink & Find. ${winner.name} won with ${formatTime(winner.totalTimeMs)}, ${stats.accuracyPercent.toFixed(0)}% accuracy, and ${stats.totalWrongTaps} wrong taps.`}
            />
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <Card className="gap-3 bg-muted/20 py-4 shadow-none">
              <CardHeader className="px-4">
                <CardTitle className="text-base">Final ranking</CardTitle>
                <CardDescription>Lowest total time wins. Calm hands help, annoyingly.</CardDescription>
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
                    {ranking.map((player, index) => (
                      <TableRow key={player.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{player.name}</TableCell>
                        <TableCell>{formatTime(player.totalTimeMs)}</TableCell>
                        <TableCell>{player.wrongTaps}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="gap-3 bg-muted/20 py-4 shadow-none">
              <CardHeader className="px-4">
                <CardTitle className="text-base">Round history</CardTitle>
                <CardDescription>Every turn is saved here so the scoreboard has receipts.</CardDescription>
              </CardHeader>
              <CardContent className="px-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Round</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Wrong</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{result.round}</TableCell>
                        <TableCell>{result.playerName}</TableCell>
                        <TableCell>{result.targetNumber}</TableCell>
                        <TableCell>{formatTime(result.finalTimeMs)}</TableCell>
                        <TableCell>{result.wrongTaps}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="flex flex-col gap-2 p-4 sm:flex-row sm:justify-end sm:p-6">
          <Button variant="outline" onClick={copyResult}>Copy Result</Button>
          <Button onClick={onPlayAgain}>Play Again</Button>
        </CardFooter>
      </Card>
    </section>
  );
}
