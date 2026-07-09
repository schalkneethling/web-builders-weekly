import type { Puzzle } from "../types/puzzle";
import { isLetterCell } from "../utils/gridHelpers";
import { stripLengthHint } from "./clueText";
import { toCluePositionKey, type PuzzleDraft } from "./types";

export function decompilePuzzle(puzzle: Puzzle): PuzzleDraft {
  const rows = puzzle.grid.map((row) =>
    row
      .map((cell) => {
        if (isLetterCell(cell)) {
          return cell.answer;
        }

        return ".";
      })
      .join(""),
  );

  const clues: PuzzleDraft["clues"] = {
    across: {},
    down: {},
  };

  for (const clue of puzzle.clues.across) {
    clues.across[toCluePositionKey(clue.row, clue.col)] = stripLengthHint(clue.clue);
  }

  for (const clue of puzzle.clues.down) {
    clues.down[toCluePositionKey(clue.row, clue.col)] = stripLengthHint(clue.clue);
  }

  return {
    id: puzzle.id,
    date: puzzle.date,
    theme: puzzle.theme,
    rows,
    clues,
  };
}
