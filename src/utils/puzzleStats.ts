import type { PuzzleStats } from "../types/puzzle";

export function createInitialPuzzleStats(): PuzzleStats {
  return {
    checksUsed: 0,
    revealsUsed: 0,
    lettersEntered: 0,
  };
}

export function isPuzzleStats(value: unknown): value is PuzzleStats {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const stats = value as Record<string, unknown>;

  return (
    Number.isInteger(stats.checksUsed) &&
    Number(stats.checksUsed) >= 0 &&
    Number.isInteger(stats.revealsUsed) &&
    Number(stats.revealsUsed) >= 0 &&
    Number.isInteger(stats.lettersEntered) &&
    Number(stats.lettersEntered) >= 0
  );
}
