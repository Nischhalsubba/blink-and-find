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

function uniquePositiveIntegers(values: number[]): number[] {
  const seen = new Set<number>();

  return values.filter((value) => {
    if (!Number.isInteger(value) || value <= 0 || seen.has(value)) {
      return false;
    }

    seen.add(value);
    return true;
  });
}

function applyZigZagOrder(numbers: number[], boardSize: number): number[] {
  const columns = getGridColumns(boardSize);
  const zigZagBoard: number[] = [];

  for (let start = 0; start < numbers.length; start += columns) {
    const rowIndex = Math.floor(start / columns);
    const row = numbers.slice(start, start + columns);

    zigZagBoard.push(...(rowIndex % 2 === 0 ? row : row.reverse()));
  }

  return zigZagBoard;
}

function createCandidateNumbers(boardSize: number, requiredNumbers: number[] = []): { safeBoardSize: number; required: number[]; candidates: number[] } {
  const safeBoardSize = Math.max(1, Math.floor(boardSize));
  const required = uniquePositiveIntegers(requiredNumbers).slice(0, safeBoardSize);
  const requiredSet = new Set(required);
  const fillerCount = safeBoardSize - required.length;
  const highestRequired = Math.max(0, ...required);
  const candidateLimit = Math.max(safeBoardSize, highestRequired + fillerCount + safeBoardSize);
  const candidates = Array.from({ length: candidateLimit }, (_, index) => index + 1).filter((value) => !requiredSet.has(value));

  return { safeBoardSize, required, candidates };
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
 * Creates a randomized board that always contains required user numbers.
 * Extra slots are filled with unique random numbers that do not duplicate the user's choices.
 */
export function generateCustomBoard(boardSize: number, requiredNumbers: number[] = []): number[] {
  const { safeBoardSize, required, candidates } = createCandidateNumbers(boardSize, requiredNumbers);

  if (required.length >= safeBoardSize) {
    return shuffle(required).slice(0, safeBoardSize);
  }

  const fillerCount = safeBoardSize - required.length;
  const fillers = shuffle(candidates).slice(0, fillerCount);

  return shuffle([...required, ...fillers]);
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
 * Creates a deterministic randomized board that always includes required user numbers.
 */
export function generateSeededCustomBoard(boardSize: number, seed: number, requiredNumbers: number[] = []): number[] {
  const { safeBoardSize, required, candidates } = createCandidateNumbers(boardSize, requiredNumbers);

  if (required.length >= safeBoardSize) {
    return shuffleWithSeed(required, seed).slice(0, safeBoardSize);
  }

  const fillerCount = safeBoardSize - required.length;
  const fillers = shuffleWithSeed(candidates, seed + 17).slice(0, fillerCount);

  return shuffleWithSeed([...required, ...fillers], seed + 31);
}

/**
 * Creates a randomized board and then applies a zig-zag row order.
 *
 * The numbers are still random, but every second row is visually reversed.
 * This matches the original paper-game idea: chaotic numbers, arranged in a
 * snake-like scan pattern that feels harder to search than a normal grid.
 */
export function generateZigZagBoard(boardSize: number): number[] {
  return applyZigZagOrder(generateBoard(boardSize), boardSize);
}

/**
 * Creates a randomized zig-zag board that always includes the required user numbers.
 */
export function generateCustomZigZagBoard(boardSize: number, requiredNumbers: number[] = []): number[] {
  return applyZigZagOrder(generateCustomBoard(boardSize, requiredNumbers), boardSize);
}

/**
 * Creates a deterministic zig-zag board for online play.
 */
export function generateSeededZigZagBoard(boardSize: number, seed: number): number[] {
  return applyZigZagOrder(generateSeededBoard(boardSize, seed), boardSize);
}

/**
 * Creates a deterministic zig-zag board that keeps required user numbers for online play.
 */
export function generateSeededCustomZigZagBoard(boardSize: number, seed: number, requiredNumbers: number[] = []): number[] {
  return applyZigZagOrder(generateSeededCustomBoard(boardSize, seed, requiredNumbers), boardSize);
}
