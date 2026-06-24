import LeaderboardSaveButton from "@/components/LeaderboardSaveButton";
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
  playAgainLabel?: string;
}

export default function ResultScreen({
  players,
  results,
  bestScore,
  latestScore,
  isNewBest,
  onPlayAgain,
  playAgainLabel = "Play Again",
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
    <section className="game-stage">
      <div className="game-stage-shell game-stage-shell--center">
        <Card className="glass-panel game-stage-card game-stage-card--wide py-0">
          <CardHeader className="game-stage-header relative overflow-hidden">
            <div className="relative">
              <CardDescription className="hero-copy">{isNewBest ? "New personal best saved." : "Game complete. Review the run."}</CardDescription>
              <CardTitle className="hero-title mt-2 text-5xl sm:text-7xl">
                {winner?.name ?? "Nobody"} wins
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="game-stage-content">
            <div className="grid gap-3 sm:grid-cols-4">
              <Card className="gap-1 rounded-[1.5rem] border-blue-100 bg-white/85 p-4 text-center shadow-none">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Average</div>
                <div className="text-xl font-black">{formatTime(stats.averageTurnMs)}</div>
              </Card>
              <Card className="gap-1 rounded-[1.5rem] border-emerald-100 bg-white/85 p-4 text-center shadow-none">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Accuracy</div>
                <div className="text-xl font-black">{stats.accuracyPercent.toFixed(0)}%</div>
              </Card>
              <Card className="gap-1 rounded-[1.5rem] border-indigo-100 bg-white/85 p-4 text-center shadow-none">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Fastest</div>
                <div className="text-xl font-black">{stats.fastestTurn ? formatTime(stats.fastestTurn.finalTimeMs) : "-"}</div>
              </Card>
              <Card className="gap-1 rounded-[1.5rem] border-amber-100 bg-white/85 p-4 text-center shadow-none">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Penalty</div>
                <div className="text-xl font-black">{formatTime(stats.totalPenaltyMs)}</div>
              </Card>
            </div>

            <div className="mt-4 rounded-[1.5rem] border bg-white/85 p-4 text-sm shadow-sm">
              <div className="flex flex-col justify-between gap-1 sm:flex-row">
                <span className="text-muted-foreground">
                  {isNewBest ? "Personal best updated" : "Best saved result"}
                </span>
                <strong>
                  {bestScore ? `${bestScore.winnerName} - ${formatTime(bestScore.winnerTimeMs)}` : "No saved score yet."}
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
              <Card className="gap-3 rounded-[1.75rem] bg-white/85 py-4 shadow-none">
                <CardHeader className="px-4">
                  <CardTitle className="text-base font-black">Final ranking</CardTitle>
                  <CardDescription>Lowest total time wins.</CardDescription>
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

              <Card className="gap-3 rounded-[1.75rem] bg-white/85 py-4 shadow-none">
                <CardHeader className="px-4">
                  <CardTitle className="text-base font-black">Round history</CardTitle>
                  <CardDescription>Every turn, target, and final time.</CardDescription>
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

          <CardFooter className="game-stage-actions flex-wrap">
            {winner && (
              <LeaderboardSaveButton
                playerName={winner.name}
                scoreMs={winner.totalTimeMs}
                wrongTaps={winner.wrongTaps}
                accuracyPercent={stats.accuracyPercent}
              />
            )}
            <Button asChild className="h-12 rounded-2xl font-bold" variant="outline"><a href="/">Back Home</a></Button>
            <Button className="h-12 rounded-2xl font-bold" variant="outline" onClick={copyResult}>Copy Result</Button>
            <Button className="h-12 rounded-2xl font-black" onClick={onPlayAgain}>{playAgainLabel}</Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
