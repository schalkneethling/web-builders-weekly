import { describe, expect, it } from "vite-plus/test";
import puzzle from "../../public/puzzles/2026-07-03.json";
import type { CellStatus, Puzzle } from "../../src/types/puzzle";
import {
  canUsePuzzleProgressStorage,
  clearAllPuzzleProgress,
  getPuzzleProgressKey,
  readPuzzleProgress,
  writePuzzleProgress,
  type PuzzleProgressSnapshot,
} from "../../src/utils/puzzleStorage";

const weeklyPuzzle = puzzle as unknown as Puzzle;

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

class BlockedStorage extends MemoryStorage {
  override setItem(_key: string, _value: string) {
    throw new Error("Storage is blocked.");
  }
}

function createProgressSnapshot(): PuzzleProgressSnapshot {
  const entries = weeklyPuzzle.grid.map((row) => row.map(() => ""));
  const cellStatus: (CellStatus | null)[][] = weeklyPuzzle.grid.map((row) => row.map(() => null));

  entries[4]![0] = "S";
  cellStatus[4]![0] = "correct";

  return {
    entries,
    cellStatus,
    activeCell: { row: 4, col: 0 },
    activeDirection: "across",
    isComplete: false,
    stats: {
      checksUsed: 1,
      revealsUsed: 0,
      lettersEntered: 3,
    },
  };
}

describe("puzzle progress storage", () => {
  it("writes and reads progress for a puzzle", () => {
    const storage = new MemoryStorage();
    const progress = createProgressSnapshot();

    expect(writePuzzleProgress(weeklyPuzzle, progress, storage)).toBe(true);
    expect(readPuzzleProgress(weeklyPuzzle, storage)).toMatchObject({
      activeCell: { row: 4, col: 0 },
      activeDirection: "across",
      entries: progress.entries,
      stats: {
        checksUsed: 1,
        revealsUsed: 0,
        lettersEntered: 3,
      },
    });
  });

  it("restores older saved progress without stats", () => {
    const storage = new MemoryStorage();
    const progress = createProgressSnapshot();

    writePuzzleProgress(weeklyPuzzle, progress, storage);

    const savedProgress = storage.getItem(getPuzzleProgressKey(weeklyPuzzle.id));

    if (!savedProgress) {
      throw new Error("Expected saved progress.");
    }

    expect(JSON.parse(savedProgress)).toHaveProperty("puzzleFingerprint");

    const progressWithoutStats = JSON.parse(savedProgress) as Record<string, unknown>;
    delete progressWithoutStats.stats;
    storage.setItem(getPuzzleProgressKey(weeklyPuzzle.id), JSON.stringify(progressWithoutStats));

    expect(readPuzzleProgress(weeklyPuzzle, storage)?.stats).toEqual({
      checksUsed: 0,
      revealsUsed: 0,
      lettersEntered: 0,
    });
  });

  it("restores progress saved with the legacy puzzle signature field", () => {
    const storage = new MemoryStorage();
    const progress = createProgressSnapshot();

    writePuzzleProgress(weeklyPuzzle, progress, storage);

    const savedProgress = storage.getItem(getPuzzleProgressKey(weeklyPuzzle.id));

    if (!savedProgress) {
      throw new Error("Expected saved progress.");
    }

    const legacyProgress = JSON.parse(savedProgress) as Record<string, unknown>;
    legacyProgress.puzzleSignature = legacyProgress.puzzleFingerprint;
    delete legacyProgress.puzzleFingerprint;
    storage.setItem(getPuzzleProgressKey(weeklyPuzzle.id), JSON.stringify(legacyProgress));

    expect(readPuzzleProgress(weeklyPuzzle, storage)).toMatchObject({
      activeCell: { row: 4, col: 0 },
      activeDirection: "across",
      entries: progress.entries,
    });
  });

  it("ignores corrupted progress", () => {
    const storage = new MemoryStorage();

    storage.setItem(
      getPuzzleProgressKey(weeklyPuzzle.id),
      JSON.stringify({
        version: 1,
        puzzleId: weeklyPuzzle.id,
        entries: [["S"]],
        cellStatus: [[null]],
        activeCell: { row: 4, col: 0 },
        activeDirection: "across",
        updatedAt: new Date().toISOString(),
      }),
    );

    expect(readPuzzleProgress(weeklyPuzzle, storage)).toBeNull();
  });

  it("ignores progress saved for an older puzzle version", () => {
    const storage = new MemoryStorage();
    const changedPuzzle = structuredClone(weeklyPuzzle);
    changedPuzzle.theme = "Changed theme";

    writePuzzleProgress(weeklyPuzzle, createProgressSnapshot(), storage);

    expect(readPuzzleProgress(changedPuzzle, storage)).toBeNull();
  });

  it("reports blocked storage", () => {
    const storage = new BlockedStorage();

    expect(canUsePuzzleProgressStorage(storage)).toBe(false);
    expect(writePuzzleProgress(weeklyPuzzle, createProgressSnapshot(), storage)).toBe(false);
  });

  it("clears only namespaced puzzle progress", () => {
    const storage = new MemoryStorage();

    storage.setItem("other-app:data", "keep");
    writePuzzleProgress(weeklyPuzzle, createProgressSnapshot(), storage);

    expect(clearAllPuzzleProgress(storage)).toBe(true);
    expect(storage.getItem(getPuzzleProgressKey(weeklyPuzzle.id))).toBeNull();
    expect(storage.getItem("other-app:data")).toBe("keep");
  });
});
