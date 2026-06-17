import { shuffle } from "@/utils/shuffle";

/**
 * Creates a randomized board from 1..boardSize.
 */
export function generateBoard(boardSize: number): number[] {
  return shuffle(
    Array.from(
      { length: boardSize },
      (_, index) => index + 1
    )
  );
}

/**
 * Calculates a near-square grid size.
 * 25 => 5
 * 100 => 10
 * 225 => 15
 */
export function getGridColumns(boardSize: number): number {
  return Math.ceil(Math.sqrt(boardSize));
}
