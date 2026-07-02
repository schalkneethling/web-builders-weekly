import { describe, expect, it } from "vite-plus/test";
import puzzleIndex from "../../public/puzzles/index.json";
import puzzle from "../../public/puzzles/2026-07-03.json";
import type { Puzzle, PuzzleIndex } from "../../src/types/puzzle";
import { validatePuzzleIntegrity } from "../../src/utils/puzzleIntegrity";

const weeklyPuzzle = puzzle as unknown as Puzzle;
const weeklyPuzzleIndex = puzzleIndex as unknown as PuzzleIndex;

describe("weekly puzzle integrity", () => {
  it("has clues whose answers match the grid", () => {
    expect(validatePuzzleIntegrity(weeklyPuzzle).errors).toEqual([]);
  });

  it("keeps puzzle metadata aligned with the index", () => {
    const indexEntry = weeklyPuzzleIndex.puzzles.find((entry) => entry.id === weeklyPuzzle.id);

    expect(indexEntry).toMatchObject({
      date: weeklyPuzzle.date,
      theme: weeklyPuzzle.theme,
    });
  });

  it("reports clue numbers that do not match clue starts", () => {
    const puzzleWithWrongCellNumber = structuredClone(weeklyPuzzle);
    const cell = puzzleWithWrongCellNumber.grid[0]?.[0];

    if (cell?.type === "letter") {
      cell.clueNumber = 10;
    }

    expect(validatePuzzleIntegrity(puzzleWithWrongCellNumber).errors).toContain(
      "Row 1, column 1 should display clue number 1, but displays 10.",
    );
  });

  it("allows incidental letter runs without clues", () => {
    const puzzleWithAnEditorialDownSet = structuredClone(weeklyPuzzle);

    puzzleWithAnEditorialDownSet.clues.down = puzzleWithAnEditorialDownSet.clues.down.filter(
      (clue) => clue.number !== 1,
    );

    expect(validatePuzzleIntegrity(puzzleWithAnEditorialDownSet).errors).toEqual([]);
  });

  it("reports published clues that do not match complete runs", () => {
    const puzzleWithWrongCluePath = structuredClone(weeklyPuzzle);

    puzzleWithWrongCluePath.clues.across[0]!.length = 3;

    expect(validatePuzzleIntegrity(puzzleWithWrongCluePath).errors).toContain(
      "across 1 does not match a complete across run.",
    );
  });
});
