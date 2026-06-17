import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NumberGridProps {
  numbers: number[];
  targetNumber: number | null;
  selectedNumber: number | null;
  isSelectionWrong: boolean;
  disabled?: boolean;
  onSelect?: (value: number) => void;
}

type NumberTileStyle = CSSProperties & {
  "--tile-rotate": string;
};

interface PlacedTile {
  centerX: number;
  centerY: number;
  size: number;
}

function seededFraction(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function getTileSize(count: number): number {
  if (count <= 25) {
    return 9.5;
  }

  if (count <= 100) {
    return 5.35;
  }

  return 4.3;
}

function overlaps(candidate: PlacedTile, placed: PlacedTile[]): boolean {
  return placed.some((tile) => {
    const minDistance = (candidate.size + tile.size) * 0.52;
    const dx = Math.abs(candidate.centerX - tile.centerX);
    const dy = Math.abs(candidate.centerY - tile.centerY);

    return dx < minDistance && dy < minDistance;
  });
}

function scoreCandidate(candidate: PlacedTile, placed: PlacedTile[]): number {
  if (placed.length === 0) {
    return 100;
  }

  return Math.min(
    ...placed.map((tile) => {
      const dx = candidate.centerX - tile.centerX;
      const dy = candidate.centerY - tile.centerY;
      return Math.sqrt(dx * dx + dy * dy);
    })
  );
}

function createCandidate(number: number, index: number, attempt: number, tileSize: number): PlacedTile {
  const usableArea = 100 - tileSize;
  const x = seededFraction(number * 97 + index * 131 + attempt * 17) * usableArea + tileSize / 2;
  const y = seededFraction(number * 193 + index * 53 + attempt * 29) * usableArea + tileSize / 2;

  return {
    centerX: x,
    centerY: y,
    size: tileSize,
  };
}

/**
 * Creates deterministic free-form scattered positions.
 * This removes the visible grid while keeping every same-round player on the
 * exact same board. Random-looking, not unfair. Miracles do happen.
 */
function getScatteredStyles(numbers: number[]): Map<number, NumberTileStyle> {
  const tileSize = getTileSize(numbers.length);
  const placed: PlacedTile[] = [];
  const styles = new Map<number, NumberTileStyle>();

  numbers.forEach((number, index) => {
    let bestCandidate = createCandidate(number, index, 0, tileSize);
    let bestScore = -1;

    for (let attempt = 0; attempt < 90; attempt += 1) {
      const candidate = createCandidate(number, index, attempt, tileSize);
      const candidateScore = scoreCandidate(candidate, placed);

      if (!overlaps(candidate, placed)) {
        bestCandidate = candidate;
        break;
      }

      if (candidateScore > bestScore) {
        bestCandidate = candidate;
        bestScore = candidateScore;
      }
    }

    placed.push(bestCandidate);

    const rotation = (seededFraction(number * 7 + index * 13) - 0.5) * 16;
    styles.set(number, {
      left: `${bestCandidate.centerX - tileSize / 2}%`,
      top: `${bestCandidate.centerY - tileSize / 2}%`,
      width: `${tileSize}%`,
      height: `${tileSize}%`,
      "--tile-rotate": `${rotation.toFixed(2)}deg`,
    });
  });

  return styles;
}

/**
 * Dynamic scattered board that avoids strict columns while keeping hit targets usable.
 */
export default function NumberGrid({
  numbers,
  targetNumber,
  selectedNumber,
  isSelectionWrong,
  disabled = false,
  onSelect,
}: NumberGridProps) {
  const scatteredStyles = getScatteredStyles(numbers);

  function getTileState(number: number) {
    const isSelected = selectedNumber === number;
    const isCorrectSelection = isSelected && !isSelectionWrong && targetNumber === number;
    const isWrongSelection = isSelected && isSelectionWrong;

    if (isCorrectSelection) {
      return {
        variant: "default" as const,
        className: "tile-correct",
      };
    }

    if (isWrongSelection) {
      return {
        variant: "destructive" as const,
        className: "tile-wrong",
      };
    }

    return {
      variant: "outline" as const,
      className: "",
    };
  }

  return (
    <div className="flex min-h-0 items-center justify-center">
      <div className="number-grid" aria-label="Scattered number board">
        {numbers.map((number) => {
          const tile = getTileState(number);

          return (
            <Button
              key={number}
              variant={tile.variant}
              size="icon"
              className={cn("number-tile", tile.className)}
              style={scatteredStyles.get(number)}
              disabled={disabled}
              aria-label={`Number ${number}`}
              onClick={() => onSelect?.(number)}
            >
              {number}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
