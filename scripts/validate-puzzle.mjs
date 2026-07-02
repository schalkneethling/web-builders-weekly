import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const puzzlesDir = join(root, "public", "puzzles");

function isLetterCell(cell) {
  return cell?.type === "letter";
}

function getWordCells(clue, direction) {
  return Array.from({ length: clue.length }, (_, index) => ({
    row: direction === "down" ? clue.row + index : clue.row,
    col: direction === "across" ? clue.col + index : clue.col,
  }));
}

function getClueStartNumbers(puzzle, row, col) {
  return ["across", "down"].flatMap((direction) =>
    (puzzle.clues[direction] ?? [])
      .filter((clue) => clue.row === row && clue.col === col)
      .map((clue) => clue.number),
  );
}

function getRunKey(run) {
  return `${run.row}:${run.col}:${run.length}:${run.answer}`;
}

function getLetterRuns(puzzle, direction) {
  const runs = [];
  const outerLimit = direction === "across" ? puzzle.size.rows : puzzle.size.cols;
  const innerLimit = direction === "across" ? puzzle.size.cols : puzzle.size.rows;

  for (let outerIndex = 0; outerIndex < outerLimit; outerIndex += 1) {
    let runStart = 0;

    while (runStart < innerLimit) {
      const row = direction === "across" ? outerIndex : runStart;
      const col = direction === "across" ? runStart : outerIndex;
      const cell = puzzle.grid[row]?.[col];

      if (!isLetterCell(cell)) {
        runStart += 1;
        continue;
      }

      const letters = [];
      const startRow = row;
      const startCol = col;

      while (runStart < innerLimit) {
        const nextRow = direction === "across" ? outerIndex : runStart;
        const nextCol = direction === "across" ? runStart : outerIndex;
        const nextCell = puzzle.grid[nextRow]?.[nextCol];

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

function validatePuzzle(puzzle, indexEntry) {
  const errors = [];

  if (indexEntry.id !== puzzle.id) {
    errors.push(`${indexEntry.id}: index id does not match puzzle id ${puzzle.id}.`);
  }

  if (indexEntry.date !== puzzle.date) {
    errors.push(
      `${puzzle.id}: index date ${indexEntry.date} does not match puzzle date ${puzzle.date}.`,
    );
  }

  if (indexEntry.theme !== puzzle.theme) {
    errors.push(
      `${puzzle.id}: index theme "${indexEntry.theme}" does not match puzzle theme "${puzzle.theme}".`,
    );
  }

  if (puzzle.grid.length !== puzzle.size.rows) {
    errors.push(`${puzzle.id}: expected ${puzzle.size.rows} rows, found ${puzzle.grid.length}.`);
  }

  puzzle.grid.forEach((row, rowIndex) => {
    if (row.length !== puzzle.size.cols) {
      errors.push(
        `${puzzle.id}: row ${rowIndex + 1} expected ${puzzle.size.cols} columns, found ${row.length}.`,
      );
    }

    row.forEach((cell, colIndex) => {
      if (isLetterCell(cell) && !/^[A-Z]$/.test(cell.answer)) {
        errors.push(
          `${puzzle.id}: row ${rowIndex + 1}, column ${colIndex + 1} must be one uppercase letter.`,
        );
      }

      if (isLetterCell(cell)) {
        const clueStartNumbers = getClueStartNumbers(puzzle, rowIndex, colIndex);
        const uniqueStartNumbers = [...new Set(clueStartNumbers)];
        const expectedNumber = uniqueStartNumbers[0];
        const location = `${puzzle.id}: row ${rowIndex + 1}, column ${colIndex + 1}`;

        if (uniqueStartNumbers.length > 1) {
          errors.push(
            `${location} starts clues with conflicting numbers: ${uniqueStartNumbers.join(", ")}.`,
          );
        }

        if (expectedNumber && cell.clueNumber !== expectedNumber) {
          errors.push(
            `${location} should display clue number ${expectedNumber}, but displays ${cell.clueNumber ?? "none"}.`,
          );
        }

        if (!expectedNumber && cell.clueNumber) {
          errors.push(
            `${location} displays clue number ${cell.clueNumber}, but no clue starts there.`,
          );
        }
      }
    });
  });

  for (const direction of ["across", "down"]) {
    const runs = getLetterRuns(puzzle, direction);
    const runKeys = new Set(runs.map(getRunKey));

    for (const clue of puzzle.clues[direction] ?? []) {
      if (!runKeys.has(getRunKey(clue))) {
        errors.push(
          `${puzzle.id}: ${direction} ${clue.number} does not match a complete ${direction} run.`,
        );
      }
    }

    for (const clue of puzzle.clues[direction] ?? []) {
      const answer = getWordCells(clue, direction)
        .map((cell) => {
          const puzzleCell = puzzle.grid[cell.row]?.[cell.col];

          return isLetterCell(puzzleCell) ? puzzleCell.answer : "#";
        })
        .join("");

      if (answer !== clue.answer) {
        errors.push(
          `${puzzle.id}: ${direction} ${clue.number} is ${clue.answer}, but grid reads ${answer}.`,
        );
      }
    }
  }

  return errors;
}

const index = JSON.parse(await readFile(join(puzzlesDir, "index.json"), "utf8"));
const errors = [];

for (const entry of index.puzzles) {
  const puzzle = JSON.parse(await readFile(join(puzzlesDir, `${entry.id}.json`), "utf8"));

  errors.push(...validatePuzzle(puzzle, entry));
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${index.puzzles.length} puzzle${index.puzzles.length === 1 ? "" : "s"}.`);
