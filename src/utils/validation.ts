import type { CellCoordinate, CellStatus, Puzzle } from "../types/puzzle";
import { getCell, isLetterCell } from "./gridHelpers";

function checkCell(puzzle: Puzzle, entries: string[][], cell: CellCoordinate): CellStatus | null {
  const puzzleCell = getCell(puzzle, cell.row, cell.col);
  const entry = entries[cell.row]?.[cell.col];

  if (!isLetterCell(puzzleCell) || !entry) {
    return null;
  }

  return entry === puzzleCell.answer ? "correct" : "incorrect";
}

export function checkCells(
  puzzle: Puzzle,
  entries: string[][],
  cells: CellCoordinate[],
): Array<CellCoordinate & { status: CellStatus | null }> {
  return cells.map((cell) => ({ ...cell, status: checkCell(puzzle, entries, cell) }));
}

export function revealCells(
  puzzle: Puzzle,
  entries: string[][],
  cells: CellCoordinate[],
): string[][] {
  const nextEntries = entries.map((row) => [...row]);

  for (const cell of cells) {
    const puzzleCell = getCell(puzzle, cell.row, cell.col);

    if (isLetterCell(puzzleCell)) {
      nextEntries[cell.row]![cell.col] = puzzleCell.answer;
    }
  }

  return nextEntries;
}
