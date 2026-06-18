import { shuffle, shuffleWithSeed } from "@/utils/shuffle";

/**
 * Calculates a near-square grid size.
 * 25 => 5
 * 100 => 10
 * 225 => 15
 */
export function getGridColumns(boardSize: number): number {
  return Math.ceil(Math.sqrt(boardSize));
}

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
 * Creates a deterministic randomized board from 1..boardSize.
 * Used by online play so multiple devices get the same challenge.
 */
export function generateSeededBoard(boardSize: number, seed: number): number[] {
  return shuffleWithSeed(
    Array.from(
      { length: boardSize },
      (_, index) => index + 1
    ),
    seed
  );
}

/**
 * Creates a randomized board and then applies a zig-zag row order.
 *
 * The numbers are still random, but every second row is visually reversed.
 * This matches the original paper-game idea: chaotic numbers, arranged in a
 * snake-like scan pattern that feels harder to search than a normal grid.
 */
export function generateZigZagBoard(boardSize: number): number[] {
  const columns = getGridColumns(boardSize);
  const randomized = generateBoard(boardSize);
  const zigZagBoard: number[] = [];

  for (let start = 0; start < randomized.length; start += columns) {
    const rowIndex = Math.floor(start / columns);
    const row = randomized.slice(start, start + columns);

    zigZagBoard.push(...(rowIndex % 2 === 0 ? row : row.reverse()));
  }

  return zigZagBoard;
}

/**
 * Creates a deterministic zig-zag board for online play.
 */
export function generateSeededZigZagBoard(boardSize: number, seed: number): number[] {
  const columns = getGridColumns(boardSize);
  const randomized = generateSeededBoard(boardSize, seed);
  const zigZagBoard: number[] = [];

  for (let start = 0; start < randomized.length; start += columns) {
    const rowIndex = Math.floor(start / columns);
    const row = randomized.slice(start, start + columns);

    zigZagBoard.push(...(rowIndex % 2 === 0 ? row : row.reverse()));
  }

  return zigZagBoard;
}
