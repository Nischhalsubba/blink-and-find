import { getGridColumns } from "@/engine/board";

interface NumberGridProps {
  numbers: number[];
  onSelect?: (value: number) => void;
}

/**
 * Dynamic board that scales according to board size.
 */
export default function NumberGrid({
  numbers,
  onSelect,
}: NumberGridProps) {
  const columns = getGridColumns(numbers.length);

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
            className="btn btn-outline-light number-tile"
            onClick={() => onSelect?.(number)}
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  );
}
