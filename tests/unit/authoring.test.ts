import { describe, expect, it } from "vite-plus/test";
import puzzle from "../../public/puzzles/2026-07-03.json";
import {
  compileDraft,
  decompilePuzzle,
  parseSource,
  serializeSource,
  toCluePositionKey,
} from "../../src/authoring";
import type { Puzzle } from "../../src/types/puzzle";
import { validatePuzzleIntegrity } from "../../src/utils/puzzleIntegrity";

const weeklyPuzzle = puzzle as unknown as Puzzle;

describe("puzzle authoring compile pipeline", () => {
  it("round-trips the weekly puzzle through decompile and compile", () => {
    const draft = decompilePuzzle(weeklyPuzzle);
    const result = compileDraft(draft);

    expect(result.errors).toEqual([]);
    expect(result.puzzle).not.toBeNull();
    expect(validatePuzzleIntegrity(result.puzzle!).errors).toEqual([]);
    expect(result.puzzle!.clues.across).toEqual(weeklyPuzzle.clues.across);
    expect(result.puzzle!.clues.down).toEqual(weeklyPuzzle.clues.down);
    expect(result.puzzle!.grid).toEqual(weeklyPuzzle.grid);
  });

  it("parses and serializes .wbw source", () => {
    const draft = decompilePuzzle(weeklyPuzzle);
    const source = serializeSource(draft);
    const parsed = parseSource(source);

    expect(parsed.id).toBe(draft.id);
    expect(parsed.date).toBe(draft.date);
    expect(parsed.theme).toBe(draft.theme);
    expect(parsed.rows).toEqual(draft.rows);
    expect(parsed.clues.across).toEqual(draft.clues.across);
    expect(parsed.clues.down).toEqual(draft.clues.down);
  });

  it("assigns published crossword numbers to clue starts", () => {
    const draft = decompilePuzzle(weeklyPuzzle);
    const result = compileDraft(draft);

    expect(
      result.runs.find((run) => run.direction === "across" && run.answer === "FLEX"),
    ).toMatchObject({
      number: 1,
      length: 4,
    });
    expect(
      result.runs.find((run) => run.direction === "down" && run.answer === "FORMS"),
    ).toMatchObject({
      number: 1,
      length: 5,
    });
  });

  it("reports orphan clue positions", () => {
    const draft = decompilePuzzle(weeklyPuzzle);
    draft.clues.across["9,9"] = "This clue does not exist on the grid";

    const result = compileDraft(draft);

    expect(result.puzzle).toBeNull();
    expect(result.errors).toContain(
      "across clue at 9,9 has text but no matching word start on the grid.",
    );
  });

  it("warns about unclued runs but still compiles when other clues exist", () => {
    const draft = decompilePuzzle(weeklyPuzzle);
    delete draft.clues.down[toCluePositionKey(0, 0)];

    const result = compileDraft(draft);

    expect(result.errors).toEqual([]);
    expect(result.warnings.some((warning) => warning.includes("FORMS"))).toBe(true);
    expect(validatePuzzleIntegrity(result.puzzle!).errors).toEqual([]);
  });

  it("ignores short incidental runs when the crossing direction is clued", () => {
    const draft = {
      id: "2026-07-10",
      date: "2026-07-10",
      theme: "Crossing only",
      rows: [".......", ".......", ".......", ".......", ".....RC", ".....E.", ".....M."],
      clues: {
        across: {},
        down: {
          [toCluePositionKey(4, 5)]: "Relative unit (3)",
        },
      },
    };

    const result = compileDraft(draft);

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.puzzle?.clues.down[0]?.answer).toBe("REM");
  });

  it("appends length hints when missing from clue text", () => {
    const draft = decompilePuzzle(weeklyPuzzle);
    draft.clues.across[toCluePositionKey(0, 0)] =
      "Layout model that distributes free space along one axis";

    const result = compileDraft(draft);

    expect(result.puzzle?.clues.across[0]?.clue).toBe(
      "Layout model that distributes free space along one axis (4)",
    );
  });

  it("rejects invalid grid characters", () => {
    const draft = decompilePuzzle(weeklyPuzzle);
    draft.rows[0] = "FLEX*JS";

    const result = compileDraft(draft);

    expect(result.puzzle).toBeNull();
    expect(result.errors.some((error) => error.includes("must be a letter"))).toBe(true);
  });
});
