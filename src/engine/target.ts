/**
 * Picks a random target from the current board.
 */
export function generateTarget(board: number[]): number {
  const randomIndex = Math.floor(
    Math.random() * board.length
  );

  return board[randomIndex];
}
