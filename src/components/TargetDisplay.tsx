interface TargetDisplayProps {
  targetNumber: number | null;
  hidden?: boolean;
}

/**
 * Displays the currently flashed target number.
 * When hidden, the player must remember what blinked before the timer started.
 */
export default function TargetDisplay({
  targetNumber,
  hidden = false,
}: TargetDisplayProps) {
  return (
    <div className="game-panel p-3 text-center target-card">
      <div className="compact-small text-muted-game mb-1">
        TARGET
      </div>

      <div className={hidden ? "target-number target-hidden" : "target-number target-pulse"}>
        {hidden ? "?" : targetNumber ?? "-"}
      </div>
    </div>
  );
}
