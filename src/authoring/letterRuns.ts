import type { Direction } from "../types/puzzle";
import {
  isBlockedCell,
  isLetterChar,
  toCluePositionKey,
  type DraftCell,
  type NumberedRun,
  type PuzzleDraft,
} from "./types";

export interface LetterRun {
  row: number;
  col: number;
  length: number;
  answer: string;
}

function getCell(rows: string[], row: number, col: number): DraftCell | null {
  const line = rows[row];

  if (!line || col < 0 || col >= line.length) {
    return null;
  }

  return line[col] ?? null;
}

function isLetterAt(rows: string[], row: number, col: number): boolean {
  const cell = getCell(rows, row, col);

  return cell !== null && isLetterChar(cell);
}

function getAcrossRunLength(rows: string[], row: number, col: number): number {
  let length = 0;

  while (isLetterAt(rows, row, col + length)) {
    length += 1;
  }

  return length;
}

function getDownRunLength(rows: string[], row: number, col: number): number {
  let length = 0;

  while (isLetterAt(rows, row + length, col)) {
    length += 1;
  }

  return length;
}

export function startsAcrossRun(rows: string[], row: number, col: number): boolean {
  if (!isLetterAt(rows, row, col)) {
    return false;
  }

  const blockedBefore = !isLetterAt(rows, row, col - 1);

  return blockedBefore && getAcrossRunLength(rows, row, col) >= 2;
}

export function startsDownRun(rows: string[], row: number, col: number): boolean {
  if (!isLetterAt(rows, row, col)) {
    return false;
  }

  const blockedBefore = !isLetterAt(rows, row - 1, col);

  return blockedBefore && getDownRunLength(rows, row, col) >= 2;
}

export function getLetterRuns(rows: string[], direction: Direction): LetterRun[] {
  const runs: LetterRun[] = [];
  const rowCount = rows.length;
  const colCount = rows[0]?.length ?? 0;
  const outerLimit = direction === "across" ? rowCount : colCount;
  const innerLimit = direction === "across" ? colCount : rowCount;

  for (let outerIndex = 0; outerIndex < outerLimit; outerIndex += 1) {
    let runStart = 0;

    while (runStart < innerLimit) {
      const row = direction === "across" ? outerIndex : runStart;
      const col = direction === "across" ? runStart : outerIndex;
      const cell = getCell(rows, row, col);

      if (!cell || isBlockedCell(cell) || !isLetterChar(cell)) {
        runStart += 1;
        continue;
      }

      const letters: string[] = [];
      const startRow = row;
      const startCol = col;

      while (runStart < innerLimit) {
        const nextRow = direction === "across" ? outerIndex : runStart;
        const nextCol = direction === "across" ? runStart : outerIndex;
        const nextCell = getCell(rows, nextRow, nextCol);

        if (!nextCell || isBlockedCell(nextCell) || !isLetterChar(nextCell)) {
          break;
        }

        letters.push(nextCell);
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

export function assignStandardNumbers(rows: string[]): Map<string, number> {
  const numbers = new Map<string, number>();
  let nextNumber = 1;
  const rowCount = rows.length;
  const colCount = rows[0]?.length ?? 0;

  for (let row = 0; row < rowCount; row += 1) {
    for (let col = 0; col < colCount; col += 1) {
      const startsAcross = startsAcrossRun(rows, row, col);
      const startsDown = startsDownRun(rows, row, col);

      if (startsAcross || startsDown) {
        numbers.set(`${row}:${col}`, nextNumber);
        nextNumber += 1;
      }
    }
  }

  return numbers;
}

export function getNumberedRuns(
  rows: string[],
): Array<LetterRun & { number: number; direction: Direction }> {
  const startNumbers = assignStandardNumbers(rows);
  const numberedRuns: Array<LetterRun & { number: number; direction: Direction }> = [];

  for (const direction of ["across", "down"] as const) {
    for (const run of getLetterRuns(rows, direction)) {
      const number = startNumbers.get(`${run.row}:${run.col}`);

      if (number) {
        numberedRuns.push({ ...run, number, direction });
      }
    }
  }

  return numberedRuns;
}

export function assignPublishedNumbers(
  rows: string[],
  publishedStarts: Set<string>,
): Map<string, number> {
  const numbers = new Map<string, number>();
  let nextNumber = 1;
  const rowCount = rows.length;
  const colCount = rows[0]?.length ?? 0;

  for (let row = 0; row < rowCount; row += 1) {
    for (let col = 0; col < colCount; col += 1) {
      const key = `${row}:${col}`;

      if (publishedStarts.has(key)) {
        numbers.set(key, nextNumber);
        nextNumber += 1;
      }
    }
  }

  return numbers;
}

export function getAuthoringRuns(rows: string[]): NumberedRun[] {
  const runs = (["across", "down"] as const).flatMap((direction) =>
    getLetterRuns(rows, direction).map((run) => ({
      ...run,
      direction,
      number: 0,
    })),
  );
  const publishedStarts = new Set(runs.map((run) => `${run.row}:${run.col}`));
  const publishedNumbers = assignPublishedNumbers(rows, publishedStarts);

  return runs.map((run) => ({
    ...run,
    number: publishedNumbers.get(`${run.row}:${run.col}`) ?? 0,
  }));
}

export function getPublishedNumberedRuns(rows: string[], draft: PuzzleDraft): NumberedRun[] {
  const allRuns = getNumberedRuns(rows);
  const publishedRuns = allRuns.filter((run) =>
    Boolean(draft.clues[run.direction][toCluePositionKey(run.row, run.col)]?.trim()),
  );
  const publishedStarts = new Set(publishedRuns.map((run) => `${run.row}:${run.col}`));
  const publishedNumbers = assignPublishedNumbers(rows, publishedStarts);

  return publishedRuns.map((run) => ({
    number: publishedNumbers.get(`${run.row}:${run.col}`) ?? 0,
    direction: run.direction,
    row: run.row,
    col: run.col,
    length: run.length,
    answer: run.answer,
  }));
}
