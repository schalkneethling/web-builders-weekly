import type { PuzzleIndex } from "../types/puzzle";

export function getTodayUtcDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isPuzzlePublished(date: string, now = new Date()): boolean {
  return date <= getTodayUtcDate(now);
}

export function resolveLatestPublishedPuzzleId(
  index: PuzzleIndex,
  now = new Date(),
): string | null {
  const today = getTodayUtcDate(now);
  const published = index.puzzles.filter((puzzle) => puzzle.date <= today);

  if (published.length === 0) {
    return null;
  }

  return published.toSorted((first, second) => second.date.localeCompare(first.date))[0]!.id;
}
