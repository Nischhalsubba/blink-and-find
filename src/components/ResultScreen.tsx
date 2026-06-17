import { formatTime } from "@/engine/scoring";
import { calculateGameStats } from "@/engine/stats";
import type { Player, TurnResult } from "@/types/game";

interface ResultScreenProps {
  players: Player[];
  results: TurnResult[];
  onPlayAgain: () => void;
}

/**
 * Final screen with ranking and simple match statistics.
 */
export default function ResultScreen({
  players,
  results,
  onPlayAgain,
}: ResultScreenProps) {
  const ranking = [...players].sort((a, b) => a.totalTimeMs - b.totalTimeMs);
  const stats = calculateGameStats(results);

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

      <div className="score-table-wrap flex-grow-1">
        <table className="table table-dark table-striped table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Time</th>
              <th>Wrong</th>
              <th>Turns</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((player, index) => (
              <tr key={player.id}>
                <td>{index + 1}</td>
                <td>{player.name}</td>
                <td>{formatTime(player.totalTimeMs)}</td>
                <td>{player.wrongTaps}</td>
                <td>{player.completedTurns}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn btn-primary fw-bold mt-2" onClick={onPlayAgain}>
        Play Again
      </button>
    </section>
  );
}
