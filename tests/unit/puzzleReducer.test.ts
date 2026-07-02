import { describe, expect, it } from "vite-plus/test";
import puzzle from "../../public/puzzles/2026-07-03.json";
import { puzzleReducer } from "../../src/hooks/usePuzzle";
import type { CellStatus, Puzzle } from "../../src/types/puzzle";

const weeklyPuzzle = puzzle as unknown as Puzzle;
const unloadedState = {
  puzzle: null,
  puzzleIndex: null,
  entries: [],
  cellStatus: [],
  activeCell: null,
  activeDirection: "across" as const,
  isComplete: false,
  stats: {
    checksUsed: 0,
    revealsUsed: 0,
    lettersEntered: 0,
  },
  announcement: "",
  skipNextPersist: false,
};

describe("puzzleReducer", () => {
  it("loads the puzzle and advances through an across entry", () => {
    let state = puzzleReducer(unloadedState, { type: "LOAD_PUZZLE", puzzle: weeklyPuzzle });

    state = puzzleReducer(state, { type: "SET_CELL", value: "F" });
    state = puzzleReducer(state, { type: "SET_CELL", value: "L" });

    expect(state.entries[0]?.slice(0, 2)).toEqual(["F", "L"]);
    expect(state.activeCell).toEqual({ row: 0, col: 2 });
    expect(state.stats.lettersEntered).toBe(2);
  });

  it("checks and reveals the active cell", () => {
    let state = puzzleReducer(unloadedState, { type: "LOAD_PUZZLE", puzzle: weeklyPuzzle });

    state = puzzleReducer(state, { type: "SET_CELL", value: "Q" });
    state = puzzleReducer(state, { type: "SET_ACTIVE", cell: { row: 0, col: 0 } });
    state = puzzleReducer(state, { type: "CHECK", scope: "cell" });

    expect(state.cellStatus[0]?.[0]).toBe("incorrect");
    expect(state.announcement).toBe("Cell is incorrect.");
    expect(state.stats.checksUsed).toBe(1);

    state = puzzleReducer(state, { type: "REVEAL", scope: "cell" });

    expect(state.entries[0]?.[0]).toBe("F");
    expect(state.cellStatus[0]?.[0]).toBe("revealed");
    expect(state.stats.revealsUsed).toBe(1);
  });

  it("restores saved entries and selection when loading the puzzle", () => {
    const savedEntries = weeklyPuzzle.grid.map((row) => row.map(() => ""));
    const savedStatus: (CellStatus | null)[][] = weeklyPuzzle.grid.map((row) =>
      row.map(() => null),
    );
    savedEntries[4]![0] = "P";
    savedStatus[4]![0] = "correct";

    const state = puzzleReducer(unloadedState, {
      type: "LOAD_PUZZLE",
      puzzle: weeklyPuzzle,
      savedProgress: {
        entries: savedEntries,
        cellStatus: savedStatus,
        activeCell: { row: 4, col: 0 },
        activeDirection: "across",
        isComplete: false,
        stats: {
          checksUsed: 2,
          revealsUsed: 1,
          lettersEntered: 4,
        },
      },
    });

    expect(state.entries[4]?.[0]).toBe("P");
    expect(state.cellStatus[4]?.[0]).toBe("correct");
    expect(state.activeCell).toEqual({ row: 4, col: 0 });
    expect(state.activeDirection).toBe("across");
    expect(state.stats).toEqual({
      checksUsed: 2,
      revealsUsed: 1,
      lettersEntered: 4,
    });
  });

  it("resets progress without saving the reset state immediately", () => {
    let state = puzzleReducer(unloadedState, { type: "LOAD_PUZZLE", puzzle: weeklyPuzzle });

    state = puzzleReducer(state, { type: "SET_CELL", value: "F" });
    state = puzzleReducer(state, {
      type: "RESET_PROGRESS",
      announcement: "Progress cleared for this puzzle.",
    });

    expect(state.entries[0]?.[0]).toBe("");
    expect(state.activeCell).toEqual({ row: 0, col: 0 });
    expect(state.stats).toEqual({
      checksUsed: 0,
      revealsUsed: 0,
      lettersEntered: 0,
    });
    expect(state.skipNextPersist).toBe(true);
    expect(state.announcement).toBe("Progress cleared for this puzzle.");
  });
});
