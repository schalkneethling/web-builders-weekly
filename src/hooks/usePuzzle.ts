import { useEffect, useMemo, useReducer, useState } from "react";
import type {
  ActiveClue,
  CellCoordinate,
  CellStatus,
  Direction,
  Puzzle,
  PuzzleIndex,
  PuzzleStats,
} from "../types/puzzle";
import {
  createEntryGrid,
  createStatusGrid,
  findNextOpenCell,
  getActiveClue,
  getCell,
  getClueForCell,
  getFirstLetterCell,
  getNextCellInWord,
  getNextClue,
  getWordCells,
  isLetterCell,
  isPuzzleComplete,
} from "../utils/gridHelpers";
import { loadPuzzleBundleFromUrl } from "../utils/puzzleLoader";
import {
  canUsePuzzleProgressStorage,
  clearAllPuzzleProgress,
  clearPuzzleProgress,
  getPuzzleProgressStorage,
  readPuzzleProgress,
  writePuzzleProgress,
  type PuzzleProgressSnapshot,
} from "../utils/puzzleStorage";
import { createInitialPuzzleStats } from "../utils/puzzleStats";
import { checkCells, revealCells } from "../utils/validation";

interface PuzzleState {
  puzzle: Puzzle | null;
  puzzleIndex: PuzzleIndex | null;
  entries: string[][];
  cellStatus: (CellStatus | null)[][];
  activeCell: CellCoordinate | null;
  activeDirection: Direction;
  isComplete: boolean;
  stats: PuzzleStats;
  announcement: string;
  skipNextPersist: boolean;
}

type CheckScope = "cell" | "word" | "puzzle";
type RevealScope = CheckScope;

type PuzzleAction =
  | {
      type: "LOAD_PUZZLE";
      puzzle: Puzzle;
      puzzleIndex?: PuzzleIndex;
      savedProgress?: PuzzleProgressSnapshot | null;
    }
  | { type: "SET_ACTIVE"; cell: CellCoordinate }
  | { type: "FOCUS_CLUE"; activeClue: ActiveClue }
  | { type: "TOGGLE_DIRECTION" }
  | { type: "SET_CELL"; value: string }
  | { type: "CLEAR_CELL"; moveBack: boolean }
  | { type: "MOVE_FOCUS"; deltaRow: number; deltaCol: number }
  | { type: "NEXT_CLUE"; offset: 1 | -1 }
  | { type: "CHECK"; scope: CheckScope }
  | { type: "REVEAL"; scope: RevealScope }
  | { type: "RESET_PROGRESS"; announcement: string };

const initialState: PuzzleState = {
  puzzle: null,
  puzzleIndex: null,
  entries: [],
  cellStatus: [],
  activeCell: null,
  activeDirection: "across",
  isComplete: false,
  stats: createInitialPuzzleStats(),
  announcement: "",
  skipNextPersist: false,
};

function getAvailableDirection(
  puzzle: Puzzle,
  cell: CellCoordinate,
  preferred: Direction,
): Direction {
  if (getClueForCell(puzzle, cell.row, cell.col, preferred)) {
    return preferred;
  }

  return preferred === "across" ? "down" : "across";
}

function getScopeCells(state: PuzzleState, scope: CheckScope): CellCoordinate[] {
  if (!state.puzzle) {
    return [];
  }

  if (scope === "puzzle") {
    return state.puzzle.grid.flatMap((row, rowIndex) =>
      row.flatMap((cell, colIndex) =>
        isLetterCell(cell) ? [{ row: rowIndex, col: colIndex }] : [],
      ),
    );
  }

  if (!state.activeCell) {
    return [];
  }

  if (scope === "cell") {
    return [state.activeCell];
  }

  const activeClue = getActiveClue(state.puzzle, state.activeCell, state.activeDirection);

  return activeClue ? getWordCells(activeClue.clue, activeClue.direction) : [state.activeCell];
}

function markStatuses(
  statusGrid: (CellStatus | null)[][],
  updates: Array<CellCoordinate & { status: CellStatus | null }>,
) {
  const nextStatus = statusGrid.map((row) => [...row]);

  for (const update of updates) {
    nextStatus[update.row]![update.col] = update.status;
  }

  return nextStatus;
}

function markRevealed(statusGrid: (CellStatus | null)[][], cells: CellCoordinate[]) {
  const nextStatus = statusGrid.map((row) => [...row]);

  for (const cell of cells) {
    nextStatus[cell.row]![cell.col] = "revealed";
  }

  return nextStatus;
}

function withCompletion(
  state: PuzzleState,
  entries: string[][],
  announcement: string,
): PuzzleState {
  const isComplete = state.puzzle ? isPuzzleComplete(state.puzzle, entries) : false;

  return {
    ...state,
    entries,
    isComplete,
    announcement: isComplete ? "Puzzle completed. Nicely solved." : announcement,
    skipNextPersist: false,
  };
}

export function puzzleReducer(state: PuzzleState, action: PuzzleAction): PuzzleState {
  if (action.type === "LOAD_PUZZLE") {
    const firstCell = getFirstLetterCell(action.puzzle);
    const activeCell = action.savedProgress?.activeCell ?? firstCell;
    const activeDirection = activeCell
      ? getAvailableDirection(
          action.puzzle,
          activeCell,
          action.savedProgress?.activeDirection ?? "across",
        )
      : "across";

    return {
      ...initialState,
      puzzle: action.puzzle,
      puzzleIndex: action.puzzleIndex ?? null,
      entries: action.savedProgress?.entries ?? createEntryGrid(action.puzzle),
      cellStatus:
        action.savedProgress?.cellStatus ??
        createStatusGrid<CellStatus | null>(action.puzzle, null),
      activeCell,
      activeDirection,
      isComplete: action.savedProgress?.isComplete ?? false,
      stats: action.savedProgress?.stats ?? createInitialPuzzleStats(),
    };
  }

  if (!state.puzzle) {
    return state;
  }

  switch (action.type) {
    case "SET_ACTIVE": {
      const isSameCell =
        state.activeCell?.row === action.cell.row && state.activeCell.col === action.cell.col;
      const activeDirection = isSameCell
        ? state.activeDirection === "across"
          ? "down"
          : "across"
        : getAvailableDirection(state.puzzle, action.cell, state.activeDirection);

      return { ...state, activeCell: action.cell, activeDirection, skipNextPersist: false };
    }

    case "FOCUS_CLUE":
      return {
        ...state,
        activeCell: { row: action.activeClue.clue.row, col: action.activeClue.clue.col },
        activeDirection: action.activeClue.direction,
        skipNextPersist: false,
      };

    case "TOGGLE_DIRECTION":
      return {
        ...state,
        activeDirection: state.activeDirection === "across" ? "down" : "across",
        skipNextPersist: false,
      };

    case "SET_CELL": {
      if (!state.activeCell || state.isComplete) {
        return state;
      }

      const currentCell = getCell(state.puzzle, state.activeCell.row, state.activeCell.col);

      if (!isLetterCell(currentCell)) {
        return state;
      }

      const value = action.value.toUpperCase();
      const nextEntries = state.entries.map((row) => [...row]);
      const nextStatus = state.cellStatus.map((row) => [...row]);
      nextEntries[state.activeCell.row]![state.activeCell.col] = value;
      nextStatus[state.activeCell.row]![state.activeCell.col] = null;

      const activeClue = getActiveClue(state.puzzle, state.activeCell, state.activeDirection);
      const nextCell = activeClue
        ? getNextCellInWord(activeClue.clue, activeClue.direction, state.activeCell, 1)
        : null;
      const nextState = {
        ...state,
        cellStatus: nextStatus,
        activeCell: nextCell ?? state.activeCell,
        stats: value
          ? { ...state.stats, lettersEntered: state.stats.lettersEntered + 1 }
          : state.stats,
        skipNextPersist: false,
      };

      return withCompletion(nextState, nextEntries, "");
    }

    case "CLEAR_CELL": {
      if (!state.activeCell || state.isComplete) {
        return state;
      }

      const nextEntries = state.entries.map((row) => [...row]);
      const nextStatus = state.cellStatus.map((row) => [...row]);
      const currentEntry = nextEntries[state.activeCell.row]?.[state.activeCell.col];
      const targetCell =
        action.moveBack && !currentEntry
          ? findNextOpenCell(
              state.puzzle,
              state.activeCell,
              state.activeDirection === "down" ? -1 : 0,
              state.activeDirection === "across" ? -1 : 0,
            )
          : state.activeCell;

      if (!targetCell) {
        return state;
      }

      nextEntries[targetCell.row]![targetCell.col] = "";
      nextStatus[targetCell.row]![targetCell.col] = null;

      return {
        ...state,
        entries: nextEntries,
        cellStatus: nextStatus,
        activeCell: targetCell,
        announcement: "",
        skipNextPersist: false,
      };
    }

    case "MOVE_FOCUS": {
      if (!state.activeCell) {
        return state;
      }

      const nextCell = findNextOpenCell(
        state.puzzle,
        state.activeCell,
        action.deltaRow,
        action.deltaCol,
      );

      return nextCell ? { ...state, activeCell: nextCell, skipNextPersist: false } : state;
    }

    case "NEXT_CLUE": {
      const nextClue = getNextClue(
        state.puzzle,
        getActiveClue(state.puzzle, state.activeCell, state.activeDirection),
        action.offset,
      );

      return nextClue
        ? {
            ...state,
            activeCell: { row: nextClue.clue.row, col: nextClue.clue.col },
            activeDirection: nextClue.direction,
            skipNextPersist: false,
          }
        : state;
    }

    case "CHECK": {
      const cells = getScopeCells(state, action.scope);
      const updates = checkCells(state.puzzle, state.entries, cells);
      const incorrectCount = updates.filter((update) => update.status === "incorrect").length;
      const correctCount = updates.filter((update) => update.status === "correct").length;
      const statusText =
        action.scope === "cell"
          ? updates[0]?.status === "correct"
            ? "Cell is correct."
            : updates[0]?.status === "incorrect"
              ? "Cell is incorrect."
              : "Cell is empty."
          : `${correctCount} correct and ${incorrectCount} incorrect.`;

      return {
        ...state,
        cellStatus: markStatuses(state.cellStatus, updates),
        stats: { ...state.stats, checksUsed: state.stats.checksUsed + 1 },
        announcement: statusText,
        skipNextPersist: false,
      };
    }

    case "REVEAL": {
      const cells = getScopeCells(state, action.scope);
      const entries = revealCells(state.puzzle, state.entries, cells);
      const revealedState = {
        ...state,
        cellStatus: markRevealed(state.cellStatus, cells),
        stats: { ...state.stats, revealsUsed: state.stats.revealsUsed + 1 },
      };
      const label =
        action.scope === "puzzle" ? "Puzzle" : action.scope === "word" ? "Word" : "Cell";

      return withCompletion(revealedState, entries, `${label} revealed.`);
    }

    case "RESET_PROGRESS": {
      const firstCell = getFirstLetterCell(state.puzzle);

      return {
        ...state,
        entries: createEntryGrid(state.puzzle),
        cellStatus: createStatusGrid<CellStatus | null>(state.puzzle, null),
        activeCell: firstCell,
        activeDirection: "across",
        isComplete: false,
        stats: createInitialPuzzleStats(),
        announcement: action.announcement,
        skipNextPersist: true,
      };
    }
  }
}

export function usePuzzle() {
  const [state, dispatch] = useReducer(puzzleReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canPersistProgress, setCanPersistProgress] = useState(true);

  useEffect(() => {
    let isMounted = true;

    loadPuzzleBundleFromUrl()
      .then((bundle) => {
        if (isMounted) {
          const storage = getPuzzleProgressStorage();

          setCanPersistProgress(canUsePuzzleProgressStorage(storage));
          dispatch({
            type: "LOAD_PUZZLE",
            puzzle: bundle.puzzle,
            puzzleIndex: bundle.index,
            savedProgress: readPuzzleProgress(bundle.puzzle, storage),
          });
          setError(null);
        }
      })
      .catch((caughtError: unknown) => {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load puzzle.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.puzzle || state.skipNextPersist) {
      return;
    }

    const didSaveProgress = writePuzzleProgress(state.puzzle, {
      entries: state.entries,
      cellStatus: state.cellStatus,
      activeCell: state.activeCell,
      activeDirection: state.activeDirection,
      isComplete: state.isComplete,
      stats: state.stats,
    });

    setCanPersistProgress(didSaveProgress);
  }, [
    state.activeCell,
    state.activeDirection,
    state.cellStatus,
    state.entries,
    state.isComplete,
    state.puzzle,
    state.skipNextPersist,
    state.stats,
  ]);

  const actions = useMemo(
    () => ({
      setActiveCell: (cell: CellCoordinate) => dispatch({ type: "SET_ACTIVE", cell }),
      focusClue: (activeClue: ActiveClue) => dispatch({ type: "FOCUS_CLUE", activeClue }),
      toggleDirection: () => dispatch({ type: "TOGGLE_DIRECTION" }),
      setCell: (value: string) => dispatch({ type: "SET_CELL", value }),
      clearCell: (moveBack: boolean) => dispatch({ type: "CLEAR_CELL", moveBack }),
      moveFocus: (deltaRow: number, deltaCol: number) =>
        dispatch({ type: "MOVE_FOCUS", deltaRow, deltaCol }),
      nextClue: (offset: 1 | -1) => dispatch({ type: "NEXT_CLUE", offset }),
      check: (scope: CheckScope) => dispatch({ type: "CHECK", scope }),
      reveal: (scope: RevealScope) => dispatch({ type: "REVEAL", scope }),
      clearCurrentProgress: () => {
        if (!state.puzzle) {
          return;
        }

        setCanPersistProgress(clearPuzzleProgress(state.puzzle.id));
        dispatch({ type: "RESET_PROGRESS", announcement: "Progress cleared for this puzzle." });
      },
      clearAllProgress: () => {
        setCanPersistProgress(clearAllPuzzleProgress());
        dispatch({ type: "RESET_PROGRESS", announcement: "All saved progress cleared." });
      },
    }),
    [state.puzzle],
  );

  return { ...state, actions, canPersistProgress, isLoading, error };
}
