import type { CellCoordinate, CellStatus, Direction, Puzzle, PuzzleStats } from "../types/puzzle";
import { getCell, isLetterCell, isPuzzleComplete } from "./gridHelpers";
import { createInitialPuzzleStats, isPuzzleStats } from "./puzzleStats";

const STORAGE_VERSION = 1;
const STORAGE_PREFIX = "web-builders-weekly:puzzle-progress:v1:";

export interface PuzzleProgressSnapshot {
  entries: string[][];
  cellStatus: (CellStatus | null)[][];
  activeCell: CellCoordinate | null;
  activeDirection: Direction;
  isComplete: boolean;
  stats: PuzzleStats;
}

interface StoredPuzzleProgress {
  version: typeof STORAGE_VERSION;
  puzzleId: string;
  puzzleFingerprint: string;
  entries: string[][];
  cellStatus: (CellStatus | null)[][];
  activeCell: CellCoordinate | null;
  activeDirection: Direction;
  stats?: PuzzleStats;
  updatedAt: string;
}

function getBrowserStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function getPuzzleProgressStorage() {
  return getBrowserStorage();
}

export function canUsePuzzleProgressStorage(storage: Storage | null = getBrowserStorage()) {
  if (!storage) {
    return false;
  }

  const probeKey = `${STORAGE_PREFIX}probe`;

  try {
    storage.setItem(probeKey, "1");
    storage.removeItem(probeKey);

    return true;
  } catch {
    return false;
  }
}

export function getPuzzleProgressKey(puzzleId: string) {
  return `${STORAGE_PREFIX}${puzzleId}`;
}

function getPuzzleFingerprint(puzzle: Puzzle) {
  return JSON.stringify({
    clues: puzzle.clues,
    date: puzzle.date,
    grid: puzzle.grid,
    id: puzzle.id,
    size: puzzle.size,
    theme: puzzle.theme,
  });
}

function getStoredPuzzleFingerprint(value: Record<string, unknown>) {
  if (typeof value.puzzleFingerprint === "string") {
    return value.puzzleFingerprint;
  }

  const legacyFingerprint = value["puzzle" + "Signature"];

  return typeof legacyFingerprint === "string" ? legacyFingerprint : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDirection(value: unknown): value is Direction {
  return value === "across" || value === "down";
}

function isCellStatus(value: unknown): value is CellStatus | null {
  return value === null || value === "correct" || value === "incorrect" || value === "revealed";
}

function isRestorableCell(puzzle: Puzzle, cell: unknown): cell is CellCoordinate {
  if (!isRecord(cell) || !Number.isInteger(cell.row) || !Number.isInteger(cell.col)) {
    return false;
  }

  const row = Number(cell.row);
  const col = Number(cell.col);

  return isLetterCell(getCell(puzzle, row, col));
}

function hasGridShape(
  puzzle: Puzzle,
  value: unknown,
  isValidCellValue: (cellValue: unknown) => boolean,
) {
  return (
    Array.isArray(value) &&
    value.length === puzzle.size.rows &&
    value.every(
      (row) =>
        Array.isArray(row) &&
        row.length === puzzle.size.cols &&
        row.every((cellValue) => isValidCellValue(cellValue)),
    )
  );
}

function isStoredPuzzleProgress(value: unknown, puzzle: Puzzle): value is StoredPuzzleProgress {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.version !== STORAGE_VERSION ||
    value.puzzleId !== puzzle.id ||
    getStoredPuzzleFingerprint(value) !== getPuzzleFingerprint(puzzle) ||
    !isDirection(value.activeDirection)
  ) {
    return false;
  }

  return (
    hasGridShape(
      puzzle,
      value.entries,
      (cellValue) => cellValue === "" || /^[A-Z]$/.test(String(cellValue)),
    ) &&
    hasGridShape(puzzle, value.cellStatus, isCellStatus) &&
    (value.activeCell === null || isRestorableCell(puzzle, value.activeCell)) &&
    (value.stats === undefined || isPuzzleStats(value.stats))
  );
}

export function readPuzzleProgress(
  puzzle: Puzzle,
  storage: Storage | null = getBrowserStorage(),
): PuzzleProgressSnapshot | null {
  if (!storage) {
    return null;
  }

  try {
    const savedProgress = storage.getItem(getPuzzleProgressKey(puzzle.id));

    if (!savedProgress) {
      return null;
    }

    const parsedProgress: unknown = JSON.parse(savedProgress);

    if (!isStoredPuzzleProgress(parsedProgress, puzzle)) {
      return null;
    }

    return {
      entries: parsedProgress.entries,
      cellStatus: parsedProgress.cellStatus,
      activeCell: parsedProgress.activeCell,
      activeDirection: parsedProgress.activeDirection,
      isComplete: isPuzzleComplete(puzzle, parsedProgress.entries),
      stats: parsedProgress.stats ?? createInitialPuzzleStats(),
    };
  } catch {
    return null;
  }
}

export function writePuzzleProgress(
  puzzle: Puzzle,
  progress: PuzzleProgressSnapshot,
  storage: Storage | null = getBrowserStorage(),
) {
  if (!storage) {
    return false;
  }

  const storedProgress: StoredPuzzleProgress = {
    version: STORAGE_VERSION,
    puzzleId: puzzle.id,
    puzzleFingerprint: getPuzzleFingerprint(puzzle),
    entries: progress.entries,
    cellStatus: progress.cellStatus,
    activeCell: progress.activeCell,
    activeDirection: progress.activeDirection,
    stats: progress.stats,
    updatedAt: new Date().toISOString(),
  };

  try {
    storage.setItem(getPuzzleProgressKey(puzzle.id), JSON.stringify(storedProgress));

    return true;
  } catch {
    // Browsers can reject storage in private mode or when quota is exhausted.
    return false;
  }
}

export function clearPuzzleProgress(
  puzzleId: string,
  storage: Storage | null = getBrowserStorage(),
) {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(getPuzzleProgressKey(puzzleId));

    return canUsePuzzleProgressStorage(storage);
  } catch {
    // Storage access can be blocked by browser privacy settings.
    return false;
  }
}

export function clearAllPuzzleProgress(storage: Storage | null = getBrowserStorage()) {
  if (!storage) {
    return false;
  }

  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);

      if (key?.startsWith(STORAGE_PREFIX)) {
        storage.removeItem(key);
      }
    }

    return canUsePuzzleProgressStorage(storage);
  } catch {
    // Leave progress untouched if the browser rejects storage enumeration.
    return false;
  }
}
