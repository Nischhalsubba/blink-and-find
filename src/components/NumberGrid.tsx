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

/**
 * Dynamic board that scales according to board size.
 * Number tiles now use the shadcn Button primitive instead of Bootstrap buttons.
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
      <div
        className="number-grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {numbers.map((number) => {
          const tile = getTileState(number);

          return (
            <Button
              key={number}
              variant={tile.variant}
              size="icon"
              className={cn("number-tile", tile.className)}
              disabled={disabled}
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
