import type { Puzzle, PuzzleBundle, PuzzleIndex } from "../types/puzzle";
import { resolveLatestPublishedPuzzleId } from "./puzzleSchedule";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }

  return response.json() as Promise<T>;
}

export async function loadPuzzleBundleFromUrl(
  search = window.location.search,
): Promise<PuzzleBundle> {
  const index = await fetchJson<PuzzleIndex>("/puzzles/index.json");
  const requestedId = new URLSearchParams(search).get("puzzle");
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
