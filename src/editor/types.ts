import type { Direction } from "../types/puzzle";
import { assignPublishedNumbers, getPublishedNumberedRuns } from "../authoring/letterRuns";
import { compileDraft, decompilePuzzle } from "../authoring";
import type { CompileResult, PuzzleDraft } from "../authoring/types";
import { toCluePositionKey } from "../authoring/types";
import type { Puzzle } from "../types/puzzle";

export interface EditorCell {
  row: number;
  col: number;
}

export interface EditorWordEntry {
  id: string;
  number: number;
  direction: Direction;
  row: number;
  col: number;
  answer: string;
  clue: string;
}

export interface EditorState {
  id: string;
  date: string;
  theme: string;
  rows: number;
  cols: number;
  entries: EditorWordEntry[];
  isReady: boolean;
}

export function createEmptyEditorState(rows = 7, cols = 7): EditorState {
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: today,
    date: today,
    theme: "",
    rows,
    cols,
    entries: [],
    isReady: false,
  };
}

export function getEntryLength(entry: EditorWordEntry): number {
  return entry.answer.length;
}

export function getEntryCells(entry: EditorWordEntry): EditorCell[] {
  return entry.answer.split("").map((_, index) => ({
    row: entry.direction === "across" ? entry.row : entry.row + index,
    col: entry.direction === "across" ? entry.col + index : entry.col,
  }));
}

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

export function getCellLetterMap(entries: EditorWordEntry[]): Map<string, string> {
  const letters = new Map<string, string>();

  for (const entry of entries) {
    for (const [index, letter] of entry.answer.split("").entries()) {
      const row = entry.direction === "across" ? entry.row : entry.row + index;
      const col = entry.direction === "across" ? entry.col + index : entry.col;
      const key = cellKey(row, col);
      const existing = letters.get(key);

      if (existing && existing !== letter) {
        continue;
      }

      letters.set(key, letter);
    }
  }

  return letters;
}

export function entriesToDraft(state: EditorState): PuzzleDraft {
  const letters = getCellLetterMap(state.entries);
  const rowStrings = Array.from({ length: state.rows }, (_, rowIndex) =>
    Array.from({ length: state.cols }, (_, colIndex) => {
      return letters.get(cellKey(rowIndex, colIndex)) ?? ".";
    }).join(""),
  );

  const clues: PuzzleDraft["clues"] = {
    across: {},
    down: {},
  };

  for (const entry of state.entries) {
    if (!entry.clue.trim()) {
      continue;
    }

    clues[entry.direction][toCluePositionKey(entry.row, entry.col)] = entry.clue.trim();
  }

  return {
    id: state.id,
    date: state.date,
    theme: state.theme,
    rows: rowStrings,
    clues,
  };
}

export function draftToEditorState(draft: PuzzleDraft): EditorState {
  const runs = getPublishedNumberedRuns(draft.rows, draft);
  const publishedStarts = new Set(runs.map((run) => `${run.row}:${run.col}`));
  const publishedNumbers = assignPublishedNumbers(draft.rows, publishedStarts);

  const entries: EditorWordEntry[] = runs.map((run) => ({
    id: `${run.direction}-${run.row}-${run.col}`,
    number: publishedNumbers.get(`${run.row}:${run.col}`) ?? run.number,
    direction: run.direction,
    row: run.row,
    col: run.col,
    answer: run.answer,
    clue: draft.clues[run.direction][toCluePositionKey(run.row, run.col)] ?? "",
  }));

  return {
    id: draft.id,
    date: draft.date,
    theme: draft.theme,
    rows: draft.rows.length,
    cols: draft.rows[0]?.length ?? 7,
    entries,
    isReady: true,
  };
}

export function puzzleToEditorState(puzzle: Puzzle): EditorState {
  return draftToEditorState(decompilePuzzle(puzzle));
}

export function compileEditorState(state: EditorState): CompileResult {
  return compileDraft(entriesToDraft(state));
}

export function createEntryId(): string {
  return `entry-${crypto.randomUUID()}`;
}

export interface SelectionRange {
  start: EditorCell;
  end: EditorCell;
  cells: EditorCell[];
  direction: Direction | null;
}

export function getSelectionRange(start: EditorCell, end: EditorCell): SelectionRange {
  if (start.row === end.row) {
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    const cells = Array.from({ length: maxCol - minCol + 1 }, (_, index) => ({
      row: start.row,
      col: minCol + index,
    }));

    return {
      start: { row: start.row, col: minCol },
      end: { row: start.row, col: maxCol },
      cells,
      direction: "across",
    };
  }

  if (start.col === end.col) {
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const cells = Array.from({ length: maxRow - minRow + 1 }, (_, index) => ({
      row: minRow + index,
      col: start.col,
    }));

    return {
      start: { row: minRow, col: start.col },
      end: { row: maxRow, col: start.col },
      cells,
      direction: "down",
    };
  }

  return {
    start,
    end,
    cells: [start],
    direction: null,
  };
}

export function findEntryAtCell(
  entries: EditorWordEntry[],
  cell: EditorCell,
): EditorWordEntry | null {
  return (
    entries.find((entry) =>
      getEntryCells(entry).some(
        (entryCell) => entryCell.row === cell.row && entryCell.col === cell.col,
      ),
    ) ?? null
  );
}

export function validateEntryPlacement(
  state: EditorState,
  candidate: Omit<EditorWordEntry, "id"> & { id?: string },
): string[] {
  const errors: string[] = [];
  const answer = candidate.answer.toUpperCase();
  const { entries } = state;

  if (!/^[A-Z]+$/.test(answer)) {
    errors.push("Answer must contain only letters A-Z.");
  }

  if (answer.length < 2) {
    errors.push("Answer must be at least 2 letters.");
  }

  if (candidate.direction === "across" && candidate.col + answer.length > state.cols) {
    errors.push("Word extends past the right edge of the grid.");
  }

  if (candidate.direction === "down" && candidate.row + answer.length > state.rows) {
    errors.push("Word extends past the bottom edge of the grid.");
  }

  const candidateCells = answer.split("").map((letter, index) => ({
    row: candidate.direction === "across" ? candidate.row : candidate.row + index,
    col: candidate.direction === "across" ? candidate.col + index : candidate.col,
    letter,
  }));

  for (const cell of candidateCells) {
    for (const entry of entries) {
      if (candidate.id && entry.id === candidate.id) {
        continue;
      }

      const entryCells = getEntryCells(entry);

      for (const [index, entryCell] of entryCells.entries()) {
        if (entryCell.row !== cell.row || entryCell.col !== cell.col) {
          continue;
        }

        const entryLetter = entry.answer[index];

        if (entryLetter !== cell.letter) {
          errors.push(
            `Letter "${cell.letter}" conflicts with "${entryLetter}" in ${entry.direction} ${entry.answer}.`,
          );
        }
      }
    }
  }

  const duplicateNumber = entries.find(
    (entry) =>
      entry.number === candidate.number &&
      entry.direction === candidate.direction &&
      entry.id !== candidate.id,
  );

  if (duplicateNumber) {
    errors.push(
      `${candidate.direction} clue number ${candidate.number} is already used by ${duplicateNumber.answer}.`,
    );
  }

  return errors;
}
