import { formatTime } from "@/engine/scoring";
import type { Player } from "@/types/game";

interface ResultScreenProps {
  players: Player[];
  onPlayAgain: () => void;
}

/**
 * Dedicated result screen component.
 * Keeps page.tsx from becoming a giant monster file.
 */
export default function ResultScreen({
  players,
  onPlayAgain,
}: ResultScreenProps) {
  const ranking = [...players].sort(
    (a, b) => a.totalTimeMs - b.totalTimeMs
  );

  return (
    <section className="game-panel p-3 h-100 d-flex flex-column">
      <div className="text-center mb-3">
        <h1 className="compact-title mb-1">Game Over</h1>
        <p className="text-muted-game mb-0">
          Winner: {ranking[0]?.name ?? "Nobody"}
        </p>
      </div>

      <div className="score-table-wrap flex-grow-1">
        <table className="table table-dark table-striped table-sm align-middle">
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

      <button
        className="btn btn-primary fw-bold mt-2"
        onClick={onPlayAgain}
      >
        Play Again
      </button>
    </section>
  );
}
