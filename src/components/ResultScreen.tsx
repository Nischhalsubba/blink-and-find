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
 * Final screen with ranking, saved best score, and round-by-round history.
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
  const history = [...results].sort((a, b) => {
    if (a.round !== b.round) {
      return a.round - b.round;
    }

    return a.finalTimeMs - b.finalTimeMs;
  });

  return (
    <section className="game-panel p-3 h-100 d-flex flex-column">
      <div className="text-center mb-2">
        <h1 className="compact-title mb-1">Game Over</h1>
        <p className="text-muted-game compact-small mb-0">
          Winner: {ranking[0]?.name ?? "Nobody"}
        </p>
      </div>

      <div className="row g-2 mb-2 compact-small">
        <div className="col-6 col-md-3">
          <div className="stat-card"><span>Average</span><strong>{formatTime(stats.averageTurnMs)}</strong></div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card"><span>Accuracy</span><strong>{stats.accuracyPercent.toFixed(0)}%</strong></div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card"><span>Fastest</span><strong>{stats.fastestTurn ? formatTime(stats.fastestTurn.finalTimeMs) : "-"}</strong></div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card"><span>Penalty</span><strong>{formatTime(stats.totalPenaltyMs)}</strong></div>
        </div>
      </div>

      <div className="game-panel p-2 mb-2 compact-small">
        <div className="d-flex flex-column flex-sm-row justify-content-between gap-1">
          <span>
            {isNewBest ? "New best score saved." : "Best score"}
          </span>
          <strong>
            {bestScore ? `${bestScore.winnerName} - ${formatTime(bestScore.winnerTimeMs)}` : "No saved score yet"}
          </strong>
        </div>
        {latestScore && !isNewBest && (
          <div className="text-muted-game mt-1">
            Current run: {latestScore.winnerName} - {formatTime(latestScore.winnerTimeMs)}
          </div>
        )}
      </div>

      <div className="row g-2 flex-grow-1 min-h-0">
        <div className="col-12 col-md-5 d-flex flex-column min-h-0">
          <h2 className="compact-small text-muted-game mb-1">Final ranking</h2>
          <div className="score-table-wrap flex-grow-1">
            <table className="table table-dark table-striped table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Time</th>
                  <th>Wrong</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((player, index) => (
                  <tr key={player.id}>
                    <td>{index + 1}</td>
                    <td>{player.name}</td>
                    <td>{formatTime(player.totalTimeMs)}</td>
                    <td>{player.wrongTaps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-12 col-md-7 d-flex flex-column min-h-0">
          <h2 className="compact-small text-muted-game mb-1">Round history</h2>
          <div className="score-table-wrap flex-grow-1">
            <table className="table table-dark table-striped table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Player</th>
                  <th>Target</th>
                  <th>Time</th>
                  <th>Wrong</th>
                </tr>
              </thead>
              <tbody>
                {history.map((result) => (
                  <tr key={result.id}>
                    <td>{result.round}</td>
                    <td>{result.playerName}</td>
                    <td>{result.targetNumber}</td>
                    <td>{formatTime(result.finalTimeMs)}</td>
                    <td>{result.wrongTaps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <button className="btn btn-primary fw-bold mt-2" onClick={onPlayAgain}>
        Play Again
      </button>
    </section>
  );
}
