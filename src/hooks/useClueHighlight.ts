import { useMemo } from "react";
import type { CellCoordinate, Direction, Puzzle } from "../types/puzzle";
import { getActiveClue } from "../utils/gridHelpers";

export function useClueHighlight(
  puzzle: Puzzle | null,
  activeCell: CellCoordinate | null,
  direction: Direction,
) {
  return useMemo(() => {
    if (!puzzle) {
      return null;
    }

    return getActiveClue(puzzle, activeCell, direction);
  }, [activeCell, direction, puzzle]);
}
