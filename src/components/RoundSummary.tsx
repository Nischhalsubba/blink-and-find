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
 * Multiplayer stays fair because each player in the same round receives the
 * same target and the same board before this screen appears.
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

  const ranking = [...players].sort(
    (a, b) => a.totalTimeMs - b.totalTimeMs
  );

  const isFinalRound = round >= totalRounds;

  return (
    <section className="game-panel p-3 h-100 d-flex flex-column">
      <div className="text-center mb-2">
        <h1 className="compact-title mb-1">Round {round} Complete</h1>
        <p className="compact-small text-muted-game mb-0">
          {isFinalRound ? "Final round finished." : `Next up: Round ${round + 1}`}
        </p>
      </div>

      <div className="row g-2 flex-grow-1 min-h-0">
        <div className="col-12 col-md-6 d-flex flex-column min-h-0">
          <h2 className="compact-small text-muted-game mb-1">Round result</h2>
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
                {roundResults.map((result, index) => (
                  <tr key={result.id}>
                    <td>{index + 1}</td>
                    <td>{result.playerName}</td>
                    <td>{formatTime(result.finalTimeMs)}</td>
                    <td>{result.wrongTaps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-12 col-md-6 d-flex flex-column min-h-0">
          <h2 className="compact-small text-muted-game mb-1">Overall ranking</h2>
          <div className="score-table-wrap flex-grow-1">
            <table className="table table-dark table-striped table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((player, index) => (
                  <tr key={player.id}>
                    <td>{index + 1}</td>
                    <td>{player.name}</td>
                    <td>{formatTime(player.totalTimeMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary fw-bold mt-2"
        onClick={isFinalRound ? onFinishGame : onNextRound}
      >
        {isFinalRound ? "See Final Results" : "Start Next Round"}
      </button>
    </section>
  );
}
