interface TimerProps {
  elapsedMs: number;
}

/**
 * Lightweight timer display.
 * The parent component controls the actual timer logic.
 */
export default function Timer({ elapsedMs }: TimerProps) {
  return (
    <div className="game-panel p-2 text-center">
      <div className="compact-small text-muted-game">
        TIMER
      </div>

      <div className="fw-bold">
        {(elapsedMs / 1000).toFixed(2)}s
      </div>
    </div>
  );
}
