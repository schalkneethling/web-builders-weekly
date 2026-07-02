export type Direction = "across" | "down";

export type CellStatus = "correct" | "incorrect" | "revealed";

export interface PuzzleStats {
  checksUsed: number;
  revealsUsed: number;
  lettersEntered: number;
}

export interface LetterCell {
  type: "letter";
  answer: string;
  clueNumber?: number;
}

export interface BlockedCell {
  type: "blocked";
}

export type PuzzleCell = LetterCell | BlockedCell;

export interface Clue {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  length: number;
}

export interface Puzzle {
  id: string;
  date: string;
  theme: string;
  size: {
    rows: number;
    cols: number;
  };
  grid: PuzzleCell[][];
  clues: Record<Direction, Clue[]>;
}

export interface PuzzleIndexEntry {
  id: string;
  date: string;
  theme: string;
}

export interface PuzzleIndex {
  latest: string;
  puzzles: PuzzleIndexEntry[];
}

export interface PuzzleBundle {
  index: PuzzleIndex;
  puzzle: Puzzle;
}

export interface CellCoordinate {
  row: number;
  col: number;
}

export interface ActiveClue {
  direction: Direction;
  clue: Clue;
}
