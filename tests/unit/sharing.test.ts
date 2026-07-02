import { describe, expect, it } from "vite-plus/test";
import puzzleIndex from "../../public/puzzles/index.json";
import { getPuzzleArchive, getShareResult } from "../../src/utils/social";

describe("social result and archive utilities", () => {
  it("creates compact share text with revealed cell count", () => {
    const result = getShareResult({
      date: "2026-07-07",
      entries: [["F", "L"]],
      puzzleId: "2026-07-07",
      revealedCount: 1,
      stats: {
        checksUsed: 2,
        revealsUsed: 1,
        lettersEntered: 3,
      },
      theme: "CSS Layout",
      totalCells: 2,
    });

    expect(result).toContain("Web Builders Weekly Crossword 2026-07-07");
    expect(result).toContain("Solved CSS Layout");
    expect(result).toContain("Revealed 1/2");
    expect(result).toContain(
      "I completed CSS Layout, a 2-cell crossword, with 3 letter entries, 2 checks, and 1 revealed cell.",
    );
    expect(result).toContain("#WebBuildersWeekly");
  });

  it("omits zero letter entries and avoids repeated cell counts in share prose", () => {
    const result = getShareResult({
      date: "2026-07-07",
      entries: [["F", "L"]],
      puzzleId: "2026-07-07",
      revealedCount: 2,
      stats: {
        checksUsed: 0,
        revealsUsed: 0,
        lettersEntered: 0,
      },
      theme: "Web Platform Friday",
      totalCells: 2,
    });

    expect(result).toContain(
      "I completed Web Platform Friday, a 2-cell crossword, with no checks and 2 revealed cells.",
    );
    expect(result).not.toContain("0 letter entries");
    expect(result).not.toContain("cells filled");
  });

  it("sorts puzzle history newest first", () => {
    const launchDay = new Date("2026-07-03T12:00:00Z");

    expect(getPuzzleArchive(puzzleIndex, launchDay).map((puzzle) => puzzle.id)).toEqual([
      "2026-07-03",
    ]);
  });

  it("hides puzzles before their publish date", () => {
    const dayBeforeLaunch = new Date("2026-07-02T12:00:00Z");

    expect(getPuzzleArchive(puzzleIndex, dayBeforeLaunch)).toEqual([]);
  });
});
