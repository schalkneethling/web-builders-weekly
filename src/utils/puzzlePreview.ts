import type { Puzzle } from "../types/puzzle";

const PREVIEW_STORAGE_KEY = "wbw:puzzle-preview";

function getPreviewStorage(): Storage | null {
  return globalThis.localStorage ?? null;
}

export function isPreviewMode(search = window.location.search): boolean {
  return new URLSearchParams(search).get("preview") === "1";
}

export function createPreviewPlayerUrl(puzzleId: string): string {
  const params = new URLSearchParams({
    puzzle: puzzleId,
    preview: "1",
  });

  return `/?${params.toString()}`;
}

export function writePuzzlePreview(puzzle: Puzzle): boolean {
  try {
    const storage = getPreviewStorage();

    if (!storage) {
      return false;
    }

    storage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(puzzle));
    return true;
  } catch {
    return false;
  }
}

export function readPuzzlePreview(puzzleId: string): Puzzle | null {
  try {
    const raw = getPreviewStorage()?.getItem(PREVIEW_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const puzzle = JSON.parse(raw) as Puzzle;

    return puzzle.id === puzzleId ? puzzle : null;
  } catch {
    return null;
  }
}

export function getStoredPreviewId(): string | null {
  try {
    const raw = getPreviewStorage()?.getItem(PREVIEW_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const puzzle = JSON.parse(raw) as Puzzle;

    return typeof puzzle.id === "string" && puzzle.id.length > 0 ? puzzle.id : null;
  } catch {
    return null;
  }
}

export function consumePuzzlePreview(puzzleId: string): Puzzle | null {
  const puzzle = readPuzzlePreview(puzzleId);

  if (puzzle) {
    clearPuzzlePreview();
  }

  return puzzle;
}

export function clearPuzzlePreview(): void {
  try {
    getPreviewStorage()?.removeItem(PREVIEW_STORAGE_KEY);
  } catch {
    // Ignore storage failures in preview helpers.
  }
}
