import type { Puzzle, PuzzleBundle, PuzzleIndex } from "../types/puzzle";
import { isPreviewMode, readPuzzlePreview } from "./puzzlePreview";
import { resolveLatestPublishedPuzzleId } from "./puzzleSchedule";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }

  return response.json() as Promise<T>;
}

function buildPreviewBundle(puzzle: Puzzle, index: PuzzleIndex): PuzzleBundle {
  const publishedPuzzles = index.puzzles.filter((entry) => entry.id !== puzzle.id);

  return {
    index: {
      latest: puzzle.id,
      puzzles: [
        {
          id: puzzle.id,
          date: puzzle.date,
          theme: puzzle.theme,
        },
        ...publishedPuzzles,
      ],
    },
    puzzle,
  };
}

export async function loadPuzzleBundleFromUrl(
  search = window.location.search,
): Promise<PuzzleBundle> {
  const params = new URLSearchParams(search);
  const requestedId = params.get("puzzle");
  const previewPuzzle =
    isPreviewMode(search) && requestedId ? readPuzzlePreview(requestedId) : null;

  if (previewPuzzle) {
    const index = await fetchJson<PuzzleIndex>("/puzzles/index.json");
    return buildPreviewBundle(previewPuzzle, index);
  }

  const index = await fetchJson<PuzzleIndex>("/puzzles/index.json");
  const puzzleId = requestedId ?? resolveLatestPublishedPuzzleId(index);

  if (!puzzleId) {
    throw new Error("No puzzle is available yet. Check back on the next release day.");
  }

  const hasPuzzle = index.puzzles.some((puzzle) => puzzle.id === puzzleId);

  if (!hasPuzzle) {
    throw new Error(`Puzzle "${puzzleId}" is not listed in the puzzle index.`);
  }

  return {
    index,
    puzzle: await fetchJson<Puzzle>(`/puzzles/${puzzleId}.json`),
  };
}
