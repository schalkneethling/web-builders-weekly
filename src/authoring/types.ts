import type { Direction } from "../types/puzzle";

export type DraftCell = string;

export type CluePositionKey = `${number},${number}`;

export interface PuzzleDraft {
  id: string;
  date: string;
  theme: string;
  rows: string[];
  clues: Record<Direction, Record<CluePositionKey, string>>;
}

export interface NumberedRun {
  number: number;
  direction: Direction;
  row: number;
  col: number;
  length: number;
  answer: string;
}

export interface CompileResult {
  puzzle: import("../types/puzzle").Puzzle | null;
  errors: string[];
  warnings: string[];
  runs: NumberedRun[];
}

export function createEmptyDraft(rows = 7, cols = 7): PuzzleDraft {
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: today,
    date: today,
    theme: "",
    rows: Array.from({ length: rows }, () => ".".repeat(cols)),
    clues: {
      across: {},
      down: {},
    },
  };
}

export function isBlockedCell(char: string): boolean {
  return char === "." || char === "#";
}

export function isLetterChar(char: string): boolean {
  return /^[A-Z]$/.test(char);
}

export function normalizeDraftChar(char: string): DraftCell {
  if (isBlockedCell(char)) {
    return ".";
  }

  const upper = char.toUpperCase();

  if (/^[A-Z]$/.test(upper)) {
    return upper;
  }

  return ".";
}

export function toCluePositionKey(row: number, col: number): CluePositionKey {
  return `${row},${col}`;
}

export function parseCluePositionKey(key: string): { row: number; col: number } | null {
  const [rowText, colText] = key.split(",");

  if (!rowText || !colText) {
    return null;
  }

  const row = Number(rowText);
  const col = Number(colText);

  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    return null;
  }

  return { row, col };
}
