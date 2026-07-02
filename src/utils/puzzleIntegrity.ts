import type { Clue, Direction, Puzzle } from "../types/puzzle";
import { getCell, getWordCells, isLetterCell } from "./gridHelpers";

interface IntegrityResult {
  errors: string[];
}

function validateCluePath(puzzle: Puzzle, clue: Clue, direction: Direction): string[] {
  const errors: string[] = [];
  const cells = getWordCells(clue, direction);
  const answer = cells
    .map((cell) => {
      const puzzleCell = getCell(puzzle, cell.row, cell.col);

      return isLetterCell(puzzleCell) ? puzzleCell.answer : "#";
    })
    .join("");

  if (answer.includes("#")) {
    errors.push(`${direction} ${clue.number} crosses a blocked or missing cell.`);
  }

  if (answer !== clue.answer) {
    errors.push(
      `${direction} ${clue.number} answer is ${clue.answer}, but the grid reads ${answer}.`,
    );
  }

  if (clue.answer.length !== clue.length) {
    errors.push(
      `${direction} ${clue.number} length is ${clue.length}, but answer has ${clue.answer.length} letters.`,
    );
  }

  return errors;
}

function getClueStartNumbers(puzzle: Puzzle, row: number, col: number): number[] {
  return (["across", "down"] as const).flatMap((direction) =>
    puzzle.clues[direction].flatMap((clue) =>
      clue.row === row && clue.col === col ? [clue.number] : [],
    ),
  );
}

function formatCellLocation(row: number, col: number) {
  return `Row ${row + 1}, column ${col + 1}`;
}

function getLetterRunKey(run: Pick<Clue, "answer" | "col" | "length" | "row">) {
  return `${run.row}:${run.col}:${run.length}:${run.answer}`;
}

function getLetterRuns(
  puzzle: Puzzle,
  direction: Direction,
): Array<Pick<Clue, "answer" | "col" | "length" | "row">> {
  const runs: Array<Pick<Clue, "answer" | "col" | "length" | "row">> = [];
  const outerLimit = direction === "across" ? puzzle.size.rows : puzzle.size.cols;
  const innerLimit = direction === "across" ? puzzle.size.cols : puzzle.size.rows;

  for (let outerIndex = 0; outerIndex < outerLimit; outerIndex += 1) {
    let runStart = 0;

    while (runStart < innerLimit) {
      const row = direction === "across" ? outerIndex : runStart;
      const col = direction === "across" ? runStart : outerIndex;
      const cell = getCell(puzzle, row, col);

      if (!isLetterCell(cell)) {
        runStart += 1;
        continue;
      }

      const letters: string[] = [];
      const startRow = row;
      const startCol = col;

      while (runStart < innerLimit) {
        const nextRow = direction === "across" ? outerIndex : runStart;
        const nextCol = direction === "across" ? runStart : outerIndex;
        const nextCell = getCell(puzzle, nextRow, nextCol);

        if (!isLetterCell(nextCell)) {
          break;
        }

        letters.push(nextCell.answer);
        runStart += 1;
      }

      if (letters.length > 1) {
        runs.push({
          answer: letters.join(""),
          col: startCol,
          length: letters.length,
          row: startRow,
        });
      }
    }
  }

  return runs;
}

function validateClueCoverage(puzzle: Puzzle, direction: Direction): string[] {
  const errors: string[] = [];
  const runs = getLetterRuns(puzzle, direction);
  const runKeys = new Set(runs.map(getLetterRunKey));

  for (const clue of puzzle.clues[direction]) {
    if (!runKeys.has(getLetterRunKey(clue))) {
      errors.push(`${direction} ${clue.number} does not match a complete ${direction} run.`);
    }
  }

  return errors;
}

export function validatePuzzleIntegrity(puzzle: Puzzle): IntegrityResult {
  const errors: string[] = [];

  if (puzzle.grid.length !== puzzle.size.rows) {
    errors.push(`Puzzle declares ${puzzle.size.rows} rows, but grid has ${puzzle.grid.length}.`);
  }

  puzzle.grid.forEach((row, rowIndex) => {
    if (row.length !== puzzle.size.cols) {
      errors.push(
        `Row ${rowIndex + 1} declares ${puzzle.size.cols} columns, but has ${row.length}.`,
      );
    }

    row.forEach((cell, colIndex) => {
      if (isLetterCell(cell) && !/^[A-Z]$/.test(cell.answer)) {
        errors.push(
          `Row ${rowIndex + 1}, column ${colIndex + 1} must have a single uppercase answer.`,
        );
      }

      if (isLetterCell(cell)) {
        const clueStartNumbers = getClueStartNumbers(puzzle, rowIndex, colIndex);
        const uniqueStartNumbers = [...new Set(clueStartNumbers)];
        const expectedNumber = uniqueStartNumbers[0];

        if (uniqueStartNumbers.length > 1) {
          errors.push(
            `${formatCellLocation(rowIndex, colIndex)} starts clues with conflicting numbers: ${uniqueStartNumbers.join(", ")}.`,
          );
        }

        if (expectedNumber && cell.clueNumber !== expectedNumber) {
          errors.push(
            `${formatCellLocation(rowIndex, colIndex)} should display clue number ${expectedNumber}, but displays ${cell.clueNumber ?? "none"}.`,
          );
        }

        if (!expectedNumber && cell.clueNumber) {
          errors.push(
            `${formatCellLocation(rowIndex, colIndex)} displays clue number ${cell.clueNumber}, but no clue starts there.`,
          );
        }
      }
    });
  });

  for (const direction of ["across", "down"] as const) {
    errors.push(...validateClueCoverage(puzzle, direction));

    for (const clue of puzzle.clues[direction]) {
      errors.push(...validateCluePath(puzzle, clue, direction));
    }
  }

  return { errors };
}
