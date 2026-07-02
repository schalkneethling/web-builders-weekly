import type {
  ActiveClue,
  CellCoordinate,
  Clue,
  Direction,
  Puzzle,
  PuzzleCell,
} from "../types/puzzle";

export function isLetterCell(
  cell: PuzzleCell | undefined,
): cell is Extract<PuzzleCell, { type: "letter" }> {
  return cell?.type === "letter";
}

export function createEntryGrid(puzzle: Puzzle): string[][] {
  return puzzle.grid.map((row) => row.map(() => ""));
}

export function createStatusGrid<T>(puzzle: Puzzle, value: T): T[][] {
  return puzzle.grid.map((row) => row.map(() => value));
}

export function getCell(puzzle: Puzzle, row: number, col: number): PuzzleCell | undefined {
  return puzzle.grid[row]?.[col];
}

export function getFirstLetterCell(puzzle: Puzzle): CellCoordinate | null {
  for (let row = 0; row < puzzle.size.rows; row += 1) {
    for (let col = 0; col < puzzle.size.cols; col += 1) {
      if (isLetterCell(getCell(puzzle, row, col))) {
        return { row, col };
      }
    }
  }

  return null;
}

export function getWordCells(clue: Clue, direction: Direction): CellCoordinate[] {
  return Array.from({ length: clue.length }, (_, index) => ({
    row: direction === "down" ? clue.row + index : clue.row,
    col: direction === "across" ? clue.col + index : clue.col,
  }));
}

export function getClueForCell(
  puzzle: Puzzle,
  row: number,
  col: number,
  direction: Direction,
): Clue | null {
  return (
    puzzle.clues[direction].find((clue) =>
      getWordCells(clue, direction).some((cell) => cell.row === row && cell.col === col),
    ) ?? null
  );
}

export function getActiveClue(
  puzzle: Puzzle,
  activeCell: CellCoordinate | null,
  direction: Direction,
): ActiveClue | null {
  if (!activeCell) {
    return null;
  }

  const clue = getClueForCell(puzzle, activeCell.row, activeCell.col, direction);

  if (!clue) {
    return null;
  }

  return { direction, clue };
}

function getClueOrder(puzzle: Puzzle): ActiveClue[] {
  const clues: ActiveClue[] = [
    ...puzzle.clues.across.map((clue) => ({ direction: "across" as const, clue })),
    ...puzzle.clues.down.map((clue) => ({ direction: "down" as const, clue })),
  ];

  return clues.sort((first, second) => {
    if (first.clue.number === second.clue.number) {
      return first.direction.localeCompare(second.direction);
    }

    return first.clue.number - second.clue.number;
  });
}

export function getNextClue(
  puzzle: Puzzle,
  active: ActiveClue | null,
  offset: 1 | -1,
): ActiveClue | null {
  const clues = getClueOrder(puzzle);

  if (clues.length === 0) {
    return null;
  }

  const currentIndex = active
    ? clues.findIndex(
        (item) => item.direction === active.direction && item.clue.number === active.clue.number,
      )
    : -1;
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + offset + clues.length) % clues.length;

  return clues[nextIndex] ?? null;
}

export function findNextOpenCell(
  puzzle: Puzzle,
  start: CellCoordinate,
  deltaRow: number,
  deltaCol: number,
): CellCoordinate | null {
  let row = start.row + deltaRow;
  let col = start.col + deltaCol;

  while (row >= 0 && col >= 0 && row < puzzle.size.rows && col < puzzle.size.cols) {
    if (isLetterCell(getCell(puzzle, row, col))) {
      return { row, col };
    }

    row += deltaRow;
    col += deltaCol;
  }

  return null;
}

export function getNextCellInWord(
  clue: Clue,
  direction: Direction,
  activeCell: CellCoordinate,
  offset: 1 | -1,
): CellCoordinate | null {
  const cells = getWordCells(clue, direction);
  const index = cells.findIndex(
    (cell) => cell.row === activeCell.row && cell.col === activeCell.col,
  );

  return index === -1 ? null : (cells[index + offset] ?? null);
}

export function isPuzzleComplete(puzzle: Puzzle, entries: string[][]): boolean {
  return (
    puzzle.grid.length === entries.length &&
    puzzle.grid.every((row, rowIndex) => {
      const entryRow = entries[rowIndex];

      return (
        entryRow !== undefined &&
        row.length === entryRow.length &&
        row.every((cell, colIndex) => !isLetterCell(cell) || entryRow[colIndex] === cell.answer)
      );
    })
  );
}
