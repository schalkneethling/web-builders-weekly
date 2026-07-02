import { describe, expect, it } from "vite-plus/test";
import puzzleIndex from "../../public/puzzles/index.json";
import type { PuzzleIndex } from "../../src/types/puzzle";
import {
  getTodayUtcDate,
  isPuzzlePublished,
  resolveLatestPublishedPuzzleId,
} from "../../src/utils/puzzleSchedule";

const index = puzzleIndex as unknown as PuzzleIndex;

describe("puzzle schedule", () => {
  it("uses UTC calendar dates", () => {
    expect(getTodayUtcDate(new Date("2026-07-03T23:30:00Z"))).toBe("2026-07-03");
    expect(getTodayUtcDate(new Date("2026-07-04T00:30:00Z"))).toBe("2026-07-04");
  });

  it("treats puzzles as published on their release date", () => {
    const launchDay = new Date("2026-07-03T00:00:00Z");
    const dayBeforeLaunch = new Date("2026-07-02T23:59:59Z");

    expect(isPuzzlePublished("2026-07-03", launchDay)).toBe(true);
    expect(isPuzzlePublished("2026-07-03", dayBeforeLaunch)).toBe(false);
  });

  it("resolves the newest published puzzle from the index", () => {
    const launchDay = new Date("2026-07-03T12:00:00Z");
    const dayBeforeLaunch = new Date("2026-07-02T12:00:00Z");

    expect(resolveLatestPublishedPuzzleId(index, launchDay)).toBe("2026-07-03");
    expect(resolveLatestPublishedPuzzleId(index, dayBeforeLaunch)).toBeNull();
  });
});
