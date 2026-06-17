interface TargetDisplayProps {
  targetNumber: number | null;
  hidden?: boolean;
}

/**
 * Displays the currently flashed target number.
 */
export default function TargetDisplay({
  targetNumber,
  hidden = false,
}: TargetDisplayProps) {
  return (
    <div className="game-panel p-3 text-center">
      <div className="compact-small text-muted-game mb-1">
        TARGET
      </div>

      <div className="target-number">
        {hidden ? '?' : targetNumber ?? '-'}
      </div>
    </div>
  );
}
