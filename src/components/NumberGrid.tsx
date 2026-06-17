import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { getGridColumns } from "@/engine/board";
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

function seededFraction(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Creates deterministic scattered positions.
 * The board looks random, but the same board stays identical for every player
 * in the same round. Fairness survives. Barely, but it survives.
 */
function getTileStyle(number: number, index: number, columns: number): NumberTileStyle {
  const safeColumns = Math.max(columns, 1);
  const cellSize = 100 / safeColumns;
  const row = Math.floor(index / safeColumns);
  const column = index % safeColumns;
  const tileSize = cellSize * 0.72;
  const jitterRoom = cellSize - tileSize;
  const jitterX = seededFraction(number * 17 + index * 31) * jitterRoom;
  const jitterY = seededFraction(number * 43 + index * 11) * jitterRoom;
  const rotation = (seededFraction(number * 7 + index * 13) - 0.5) * 7;

  return {
    left: `${column * cellSize + jitterX}%`,
    top: `${row * cellSize + jitterY}%`,
    width: `${tileSize}%`,
    height: `${tileSize}%`,
    "--tile-rotate": `${rotation.toFixed(2)}deg`,
  };
}

/**
 * Dynamic scattered board that avoids rigid columns while keeping hit targets usable.
 */
export default function NumberGrid({
  numbers,
  targetNumber,
  selectedNumber,
  isSelectionWrong,
  disabled = false,
  onSelect,
}: NumberGridProps) {
  const columns = getGridColumns(numbers.length);

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
        {numbers.map((number, index) => {
          const tile = getTileState(number);

          return (
            <Button
              key={number}
              variant={tile.variant}
              size="icon"
              className={cn("number-tile", tile.className)}
              style={getTileStyle(number, index, columns)}
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
