import { describe, expect, it } from "vite-plus/test";
import puzzle from "../../public/puzzles/2026-07-03.json";
import type { Puzzle } from "../../src/types/puzzle";
import { loadPuzzleBundleFromUrl } from "../../src/utils/puzzleLoader";
import {
  clearPuzzlePreview,
  consumePuzzlePreview,
  createPreviewPlayerUrl,
  getStoredPreviewId,
  isPreviewMode,
  readPuzzlePreview,
  writePuzzlePreview,
} from "../../src/utils/puzzlePreview";

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

describe("puzzle preview helpers", () => {
  it("detects preview mode from the query string", () => {
    expect(isPreviewMode("?puzzle=2026-07-09&preview=1")).toBe(true);
    expect(isPreviewMode("?puzzle=2026-07-09")).toBe(false);
  });

  it("builds a preview player url", () => {
    expect(createPreviewPlayerUrl("2026-07-09")).toBe("/?puzzle=2026-07-09&preview=1");
  });

  it("consumes a stored preview and clears local storage", () => {
    const storage = new MemoryStorage();

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
    });

    writePuzzlePreview({
      ...weeklyPuzzle,
      id: "2026-07-10",
      date: "2026-07-10",
    });

    expect(getStoredPreviewId()).toBe("2026-07-10");
    expect(consumePuzzlePreview("2026-07-10")?.id).toBe("2026-07-10");
    expect(getStoredPreviewId()).toBeNull();
    expect(readPuzzlePreview("2026-07-10")).toBeNull();

    clearPuzzlePreview();
  });
});

describe("loadPuzzleBundleFromUrl preview mode", () => {
  it("loads an unpublished puzzle from local preview storage", async () => {
    const previewPuzzle: Puzzle = {
      ...weeklyPuzzle,
      id: "2026-07-09",
      date: "2026-07-09",
      theme: "Preview Theme",
    };
    const storage = new MemoryStorage();

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
    });

    writePuzzlePreview(previewPuzzle);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const path =
        typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;

      if (path === "/puzzles/index.json") {
        return {
          ok: true,
          json: async () => ({
            latest: "2026-07-03",
            puzzles: [
              {
                id: "2026-07-03",
                date: "2026-07-03",
                theme: "Web Platform Friday",
              },
            ],
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch: ${path}`);
    };

    const bundle = await loadPuzzleBundleFromUrl("?puzzle=2026-07-09&preview=1");

    expect(bundle.puzzle).toEqual(previewPuzzle);
    expect(bundle.index.latest).toBe("2026-07-09");
    expect(bundle.index.puzzles[0]).toEqual({
      id: "2026-07-09",
      date: "2026-07-09",
      theme: "Preview Theme",
    });
    expect(readPuzzlePreview("2026-07-09")).toEqual(previewPuzzle);

    globalThis.fetch = originalFetch;
  });
});
