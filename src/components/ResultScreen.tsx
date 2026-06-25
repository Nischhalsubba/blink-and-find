"use client";

import { useState } from "react";
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
  localPlayerId?: string;
}

function getPlayerResults(results: TurnResult[], playerId: string) {
  return results
    .filter((result) => result.playerId === playerId)
    .sort((a, b) => a.round - b.round);
}

function getPlacement(ranking: Player[], playerId: string) {
  const placement = ranking.findIndex((player) => player.id === playerId);
  return placement >= 0 ? placement + 1 : null;
}

export default function ResultScreen({
  players,
  results,
  bestScore,
  latestScore,
  isNewBest,
  onPlayAgain,
  playAgainLabel = "Play Again",
  localPlayerId,
}: ResultScreenProps) {
  const ranking = [...players].sort((a, b) => a.totalTimeMs - b.totalTimeMs);
  const gameStats = calculateGameStats(results);
  const winner = ranking[0] ?? null;
  const localPlayer = localPlayerId ? ranking.find((player) => player.id === localPlayerId) ?? null : null;
  const focusPlayer = localPlayer ?? winner;
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(focusPlayer?.id ?? null);
  const selectedPlayer = ranking.find((player) => player.id === selectedPlayerId) ?? focusPlayer ?? winner;
  const focusResults = focusPlayer ? getPlayerResults(results, focusPlayer.id) : [];
  const focusStats = calculateGameStats(focusResults);
  const selectedResults = selectedPlayer ? getPlayerResults(results, selectedPlayer.id) : [];
  const selectedStats = calculateGameStats(selectedResults);
  const localWon = Boolean(localPlayer && winner?.id === localPlayer.id);
  const hasPersonalContext = Boolean(localPlayer);
  const focusPlacement = focusPlayer ? getPlacement(ranking, focusPlayer.id) : null;
  const selectedPlacement = selectedPlayer ? getPlacement(ranking, selectedPlayer.id) : null;
  const history = [...results].sort((a, b) => {
    if (a.round !== b.round) {
      return a.round - b.round;
    }

    return a.finalTimeMs - b.finalTimeMs;
  });
  const resultTitle = hasPersonalContext
    ? localWon ? "You win" : "You lose"
    : `${winner?.name ?? "Nobody"} wins`;
  const resultDescription = hasPersonalContext && focusPlayer
    ? `${focusPlayer.name} placed #${focusPlacement ?? "-"} of ${ranking.length}. ${localWon ? "Nice. You beat the tiny number goblins." : `${winner?.name ?? "Someone"} won this run.`}`
    : isNewBest ? "New personal best saved." : "Game complete. Review the run.";

  function copyResult() {
    if (!focusPlayer || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    const outcome = hasPersonalContext
      ? localWon ? "I won" : `I lost. ${winner?.name ?? "Someone"} won`
      : `${winner?.name ?? focusPlayer.name} won`;
    const text = `I played Blink & Find. ${outcome}. My time: ${formatTime(focusPlayer.totalTimeMs)}, accuracy: ${focusStats.accuracyPercent.toFixed(0)}%, wrong taps: ${focusStats.totalWrongTaps}.`;
    void navigator.clipboard.writeText(text);
  }

  return (
    <section className="game-stage">
      <div className="game-stage-shell game-stage-shell--center">
        <Card className="glass-panel game-stage-card game-stage-card--wide py-0">
          <CardHeader className="game-stage-header relative overflow-hidden">
            <div className="relative">
              <CardDescription className="hero-copy">{resultDescription}</CardDescription>
              <CardTitle className="hero-title mt-2 text-5xl sm:text-7xl">
                {resultTitle}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="game-stage-content">
            <div className="grid gap-3 sm:grid-cols-4">
              <Card className="gap-1 rounded-[1.5rem] border-blue-100 bg-white/85 p-4 text-center shadow-none">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{hasPersonalContext ? "Your avg" : "Average"}</div>
                <div className="text-xl font-black">{formatTime(focusStats.averageTurnMs)}</div>
              </Card>
              <Card className="gap-1 rounded-[1.5rem] border-emerald-100 bg-white/85 p-4 text-center shadow-none">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{hasPersonalContext ? "Your accuracy" : "Accuracy"}</div>
                <div className="text-xl font-black">{focusStats.accuracyPercent.toFixed(0)}%</div>
              </Card>
              <Card className="gap-1 rounded-[1.5rem] border-indigo-100 bg-white/85 p-4 text-center shadow-none">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{hasPersonalContext ? "Your fastest" : "Fastest"}</div>
                <div className="text-xl font-black">{focusStats.fastestTurn ? formatTime(focusStats.fastestTurn.finalTimeMs) : "-"}</div>
              </Card>
              <Card className="gap-1 rounded-[1.5rem] border-amber-100 bg-white/85 p-4 text-center shadow-none">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{hasPersonalContext ? "Your penalty" : "Penalty"}</div>
                <div className="text-xl font-black">{formatTime(focusStats.totalPenaltyMs)}</div>
              </Card>
            </div>

            <div className="mt-4 rounded-[1.5rem] border bg-white/85 p-4 text-sm shadow-sm">
              <div className="flex flex-col justify-between gap-1 sm:flex-row">
                <span className="text-muted-foreground">
                  {hasPersonalContext ? "Your result" : isNewBest ? "Personal best updated" : "Best saved result"}
                </span>
                <strong>
                  {focusPlayer ? `${focusPlayer.name} - ${formatTime(focusPlayer.totalTimeMs)}${focusPlacement ? ` · #${focusPlacement}` : ""}` : "No result yet."}
                </strong>
              </div>
              {!hasPersonalContext && latestScore && !isNewBest && (
                <div className="mt-1 text-muted-foreground">
                  This run: {latestScore.winnerName} - {formatTime(latestScore.winnerTimeMs)}
                </div>
              )}
              {!hasPersonalContext && bestScore && (
                <div className="mt-1 text-muted-foreground">
                  Best saved: {bestScore.winnerName} - {formatTime(bestScore.winnerTimeMs)}
                </div>
              )}
            </div>

            {focusPlayer && (
              <ShareableResultCard
                eyebrow="Blink & Find Result"
                title={hasPersonalContext ? resultTitle : `${winner?.name ?? focusPlayer.name} wins`}
                subtitle={`${focusPlayer.name} · ${ranking.length} player${ranking.length === 1 ? "" : "s"} · ${results.length} turn${results.length === 1 ? "" : "s"}`}
                primaryLabel={hasPersonalContext ? "Your total time" : "Winning time"}
                primaryValue={formatTime(focusPlayer.totalTimeMs)}
                metrics={[
                  { label: "Accuracy", value: `${focusStats.accuracyPercent.toFixed(0)}%` },
                  { label: "Wrong taps", value: String(focusStats.totalWrongTaps) },
                  { label: "Fastest find", value: focusStats.fastestTurn ? formatTime(focusStats.fastestTurn.finalTimeMs) : "-" },
                  { label: "Penalty", value: formatTime(focusStats.totalPenaltyMs) },
                ]}
                footer="Play the free number hunting memory game"
                filename={`blink-find-${focusPlayer.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-result.svg`}
                shareText={`I played Blink & Find. ${hasPersonalContext ? resultTitle : `${winner?.name ?? focusPlayer.name} won`} with ${formatTime(focusPlayer.totalTimeMs)}, ${focusStats.accuracyPercent.toFixed(0)}% accuracy, and ${focusStats.totalWrongTaps} wrong taps.`}
              />
            )}

            {selectedPlayer && (
              <Card className="mt-4 gap-3 rounded-[1.75rem] bg-white/85 py-4 shadow-none">
                <CardHeader className="px-4">
                  <CardTitle className="text-base font-black">{selectedPlayer.id === focusPlayer?.id ? "Your breakdown" : `${selectedPlayer.name}'s breakdown`}</CardTitle>
                  <CardDescription>Tap any player in the ranking to inspect their run. Finally, useful curiosity.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 px-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-2xl border bg-muted/20 p-3">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Placement</div>
                      <div className="text-2xl font-black">#{selectedPlacement ?? "-"}</div>
                    </div>
                    <div className="rounded-2xl border bg-muted/20 p-3">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Total time</div>
                      <div className="text-2xl font-black">{formatTime(selectedPlayer.totalTimeMs)}</div>
                    </div>
                    <div className="rounded-2xl border bg-muted/20 p-3">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Average turn</div>
                      <div className="text-2xl font-black">{formatTime(selectedStats.averageTurnMs)}</div>
                    </div>
                    <div className="rounded-2xl border bg-muted/20 p-3">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Mistakes</div>
                      <div className="text-2xl font-black">{selectedStats.totalWrongTaps}</div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Round</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Raw</TableHead>
                          <TableHead>Penalty</TableHead>
                          <TableHead>Final</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedResults.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>{result.round}</TableCell>
                            <TableCell>{result.targetNumber}</TableCell>
                            <TableCell>{formatTime(result.rawTimeMs)}</TableCell>
                            <TableCell>{formatTime(result.penaltyMs)}</TableCell>
                            <TableCell>{formatTime(result.finalTimeMs)}</TableCell>
                          </TableRow>
                        ))}
                        {selectedResults.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">No completed turns for this player.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <Card className="gap-3 rounded-[1.75rem] bg-white/85 py-4 shadow-none">
                <CardHeader className="px-4">
                  <CardTitle className="text-base font-black">Final ranking</CardTitle>
                  <CardDescription>Tap a player to see their breakdown.</CardDescription>
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
                        <TableRow
                          key={player.id}
                          tabIndex={0}
                          role="button"
                          className={`cursor-pointer transition hover:bg-primary/10 ${selectedPlayer?.id === player.id ? "bg-primary/10" : ""}`}
                          onClick={() => setSelectedPlayerId(player.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedPlayerId(player.id);
                            }
                          }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{player.id === localPlayerId ? "You" : player.name}</TableCell>
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
                          <TableCell>{result.playerId === localPlayerId ? "You" : result.playerName}</TableCell>
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
            {focusPlayer && (
              <LeaderboardSaveButton
                playerName={focusPlayer.name}
                scoreMs={focusPlayer.totalTimeMs}
                wrongTaps={focusPlayer.wrongTaps}
                accuracyPercent={focusStats.accuracyPercent}
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
