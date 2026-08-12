import type { CSSProperties, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NumberGridProps {
  numbers: number[];
  targetNumber: number | null;
  selectedNumber: number | null;
  isSelectionWrong: boolean;
  scatterKey?: string | number;
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

function getScatterSeed(scatterKey: string | number | undefined): number {
  if (typeof scatterKey === "number") {
    return scatterKey;
  }

  if (!scatterKey) {
    return 1;
  }

  return Array.from(scatterKey).reduce((total, char) => total + char.charCodeAt(0), 0);
}

function getTileSize(count: number): number {
  if (count <= 25) {
    return 10.75;
  }

  if (count <= 100) {
    return 6.15;
  }

  return 4.75;
}

function getBoardDensity(count: number) {
  if (count <= 25) {
    return "comfortable";
  }

  if (count <= 100) {
    return "dense";
  }

  return "compact";
}

function overlaps(candidate: PlacedTile, placed: PlacedTile[]): boolean {
  return placed.some((tile) => {
    const minDistance = (candidate.size + tile.size) * 0.5;
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

function createCandidate(number: number, index: number, attempt: number, tileSize: number, scatterSeed: number): PlacedTile {
  const usableArea = 100 - tileSize;
  const x = seededFraction(number * 97 + index * 131 + attempt * 17 + scatterSeed * 41) * usableArea + tileSize / 2;
  const y = seededFraction(number * 193 + index * 53 + attempt * 29 + scatterSeed * 67) * usableArea + tileSize / 2;

  return {
    centerX: x,
    centerY: y,
    size: tileSize,
  };
}

function getScatteredStyles(numbers: number[], scatterKey?: string | number): Map<number, NumberTileStyle> {
  const tileSize = getTileSize(numbers.length);
  const scatterSeed = getScatterSeed(scatterKey);
  const placed: PlacedTile[] = [];
  const styles = new Map<number, NumberTileStyle>();

  numbers.forEach((number, index) => {
    let bestCandidate = createCandidate(number, index, 0, tileSize, scatterSeed);
    let bestScore = -1;

    for (let attempt = 0; attempt < 120; attempt += 1) {
      const candidate = createCandidate(number, index, attempt, tileSize, scatterSeed);
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

    const rotation = (seededFraction(number * 7 + index * 13 + scatterSeed * 19) - 0.5) * 10;
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

function focusTile(event: KeyboardEvent<HTMLButtonElement>, nextIndex: number) {
  const buttons = Array.from(
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button") ?? []
  );
  const target = buttons[nextIndex];

  if (target) {
    target.focus();
  }
}

export default function NumberGrid({
  numbers,
  targetNumber,
  selectedNumber,
  isSelectionWrong,
  scatterKey,
  disabled = false,
  onSelect,
}: NumberGridProps) {
  const scatteredStyles = getScatteredStyles(numbers, scatterKey);
  const density = getBoardDensity(numbers.length);

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

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (["ArrowRight", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      focusTile(event, Math.min(index + 1, numbers.length - 1));
    }

    if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      focusTile(event, Math.max(index - 1, 0));
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusTile(event, 0);
    }

    if (event.key === "End") {
      event.preventDefault();
      focusTile(event, numbers.length - 1);
    }
  }

  return (
    <div className="flex h-full w-full min-h-0 min-w-0 items-center justify-center">
      <div className="number-grid" data-density={density} role="group" aria-label="Scattered number board">
        {numbers.map((number, index) => {
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
              onKeyDown={(event) => handleKeyDown(event, index)}
              onClick={() => onSelect?.(number)}
            >
              <span className="number-tile-label">{number}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
