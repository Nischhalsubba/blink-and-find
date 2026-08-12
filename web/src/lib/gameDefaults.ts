import type { DifficultyPreset } from "@/types/game";

export const DIFFICULTIES: DifficultyPreset[] = [
  {
    id: "easy",
    label: "Easy",
    boardSize: 25,
    flashDurationMs: 3000,
    description: "5x5 board"
  },
  {
    id: "normal",
    label: "Normal",
    boardSize: 100,
    flashDurationMs: 2000,
    description: "10x10 board"
  },
  {
    id: "hard",
    label: "Hard",
    boardSize: 225,
    flashDurationMs: 1000,
    description: "15x15 board"
  }
];
