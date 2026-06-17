import { getGridColumns } from "@/engine/board";

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
 * It also shows short feedback for the most recent wrong/correct selection.
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

  function getTileClass(number: number): string {
    const isSelected = selectedNumber === number;
    const isCorrectSelection = isSelected && !isSelectionWrong && targetNumber === number;
    const isWrongSelection = isSelected && isSelectionWrong;

    if (isCorrectSelection) {
      return "btn btn-success number-tile tile-correct";
    }

    if (isWrongSelection) {
      return "btn btn-danger number-tile tile-wrong";
    }

    return "btn btn-outline-light number-tile";
  }

  return (
    <div className="board-wrap">
      <div
        className="number-grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {numbers.map((number) => (
          <button
            key={number}
            className={getTileClass(number)}
            disabled={disabled}
            onClick={() => onSelect?.(number)}
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  );
}
