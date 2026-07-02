import type { PuzzleIndex, PuzzleIndexEntry, PuzzleStats } from "../types/puzzle";
import { isPuzzlePublished } from "./puzzleSchedule";

interface ShareResultInput {
  date: string;
  entries: string[][];
  puzzleId: string;
  revealedCount: number;
  stats: PuzzleStats;
  theme: string;
  totalCells: number;
}

export function getPuzzleArchive(index: PuzzleIndex, now = new Date()): PuzzleIndexEntry[] {
  return index.puzzles
    .filter((puzzle) => isPuzzlePublished(puzzle.date, now))
    .toSorted((first, second) => second.date.localeCompare(first.date));
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatUsage(count: number, singular: string, plural = `${singular}s`) {
  return count === 0 ? `no ${plural}` : pluralize(count, singular, plural);
}

function formatList(items: string[]) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

export function getShareSummary({
  revealedCount,
  stats,
  theme,
  totalCells,
}: Pick<ShareResultInput, "revealedCount" | "stats" | "theme" | "totalCells">): string {
  const outcome = revealedCount > 0 ? "completed" : "solved";
  const recapItems = [
    ...(stats.lettersEntered > 0
      ? [pluralize(stats.lettersEntered, "letter entry", "letter entries")]
      : []),
    formatUsage(stats.checksUsed, "check"),
    revealedCount > 0 ? pluralize(revealedCount, "revealed cell") : "no reveals",
  ];

  return `I ${outcome} ${theme}, a ${totalCells}-cell crossword, with ${formatList(
    recapItems,
  )}. #WebBuildersWeekly`;
}

export function getShareResult({
  date,
  entries,
  puzzleId,
  revealedCount,
  stats,
  theme,
  totalCells,
}: ShareResultInput): string {
  const filledCells = entries.flat().filter(Boolean).length;

  return [
    `Web Builders Weekly Crossword ${date}`,
    `Solved ${theme}`,
    `Filled ${filledCells}/${totalCells}`,
    `Revealed ${revealedCount}/${totalCells}`,
    getShareSummary({ revealedCount, stats, theme, totalCells }),
    `Puzzle ${puzzleId}`,
  ].join("\n");
}
