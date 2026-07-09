import type { Clue, Direction, Puzzle, PuzzleCell } from "../types/puzzle";
import { validatePuzzleIntegrity } from "../utils/puzzleIntegrity";
import { ensureLengthHint } from "./clueText";
import { assignPublishedNumbers, getLetterRuns, getPublishedNumberedRuns } from "./letterRuns";
import type { CompileResult, NumberedRun, PuzzleDraft } from "./types";
import { isBlockedCell, isLetterChar, toCluePositionKey } from "./types";

function validateDraftGrid(draft: PuzzleDraft): string[] {
  const errors: string[] = [];

  if (draft.rows.length === 0) {
    errors.push("Grid is empty.");
    return errors;
  }

  const colCount = draft.rows[0]?.length ?? 0;

  if (colCount === 0) {
    errors.push("Grid rows must contain at least one column.");
    return errors;
  }

  draft.rows.forEach((row, rowIndex) => {
    if (row.length !== colCount) {
      errors.push(`Row ${rowIndex + 1} has ${row.length} columns, expected ${colCount}.`);
    }

    row.split("").forEach((char, colIndex) => {
      if (!isBlockedCell(char) && !isLetterChar(char)) {
        errors.push(
          `Row ${rowIndex + 1}, column ${colIndex + 1} must be a letter (A-Z) or blocked (.).`,
        );
      }
    });
  });

  return errors;
}

function validateDraftMeta(draft: PuzzleDraft): string[] {
  const errors: string[] = [];

  if (!draft.id) {
    errors.push("Puzzle id is required.");
  }

  if (!draft.date) {
    errors.push("Puzzle date is required.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) {
    errors.push("Puzzle date must use YYYY-MM-DD format.");
  }

  if (!draft.theme.trim()) {
    errors.push("Puzzle theme is required.");
  }

  return errors;
}

function buildGrid(draft: PuzzleDraft, publishedStarts: Set<string>): PuzzleCell[][] {
  const publishedNumbers = assignPublishedNumbers(draft.rows, publishedStarts);

  return draft.rows.map((row, rowIndex) =>
    row.split("").map((char, colIndex) => {
      if (isBlockedCell(char)) {
        return { type: "blocked" } as const;
      }

      const clueNumber = publishedNumbers.get(`${rowIndex}:${colIndex}`);

      return {
        type: "letter" as const,
        answer: char,
        ...(clueNumber ? { clueNumber } : {}),
      };
    }),
  );
}

function findOrphanClues(draft: PuzzleDraft): string[] {
  const errors: string[] = [];
  const runKeys = new Set(
    (["across", "down"] as const).flatMap((direction) =>
      getLetterRuns(draft.rows, direction).map((run) => `${direction}:${run.row},${run.col}`),
    ),
  );

  for (const direction of ["across", "down"] as const) {
    for (const [positionKey, clueText] of Object.entries(draft.clues[direction])) {
      if (!clueText.trim()) {
        continue;
      }

      const key = `${direction}:${positionKey}`;

      if (!runKeys.has(key)) {
        errors.push(
          `${direction} clue at ${positionKey} has text but no matching word start on the grid.`,
        );
      }
    }
  }

  return errors;
}

function isIncidentalUncluedRun(
  draft: PuzzleDraft,
  direction: Direction,
  run: { length: number; row: number; col: number },
): boolean {
  if (run.length >= 3) {
    return false;
  }

  const positionKey = toCluePositionKey(run.row, run.col);
  const otherDirection: Direction = direction === "across" ? "down" : "across";

  return Boolean(draft.clues[otherDirection][positionKey]?.trim());
}

function findUncluedRuns(draft: PuzzleDraft): string[] {
  return (["across", "down"] as const).flatMap((direction) =>
    getLetterRuns(draft.rows, direction)
      .filter((run) => {
        const positionKey = toCluePositionKey(run.row, run.col);

        return (
          !draft.clues[direction][positionKey]?.trim() &&
          !isIncidentalUncluedRun(draft, direction, run)
        );
      })
      .map(
        (run) =>
          `${direction} ${run.answer} at ${run.row},${run.col} (${run.length} letters) has no clue text.`,
      ),
  );
}

export function compileDraft(draft: PuzzleDraft): CompileResult {
  const errors = [...validateDraftMeta(draft), ...validateDraftGrid(draft)];

  if (errors.length > 0) {
    return { puzzle: null, errors, warnings: [], runs: [] };
  }

  errors.push(...findOrphanClues(draft));

  const warnings = findUncluedRuns(draft);
  const runs = getPublishedNumberedRuns(draft.rows, draft);

  const clues: Record<Direction, Clue[]> = {
    across: [],
    down: [],
  };

  const publishedStarts = new Set<string>();

  for (const run of runs) {
    const positionKey = toCluePositionKey(run.row, run.col);
    const clueText = draft.clues[run.direction][positionKey]?.trim();

    if (!clueText) {
      continue;
    }

    publishedStarts.add(`${run.row}:${run.col}`);
    clues[run.direction].push({
      number: run.number,
      clue: ensureLengthHint(clueText, run.length),
      answer: run.answer,
      row: run.row,
      col: run.col,
      length: run.length,
    });
  }

  for (const direction of ["across", "down"] as const) {
    clues[direction].sort((first, second) => first.number - second.number);
  }

  if (clues.across.length === 0 && clues.down.length === 0) {
    errors.push("At least one across or down clue is required.");
  }

  if (errors.length > 0) {
    return { puzzle: null, errors, warnings, runs };
  }

  const puzzle: Puzzle = {
    id: draft.id,
    date: draft.date,
    theme: draft.theme.trim(),
    size: {
      rows: draft.rows.length,
      cols: draft.rows[0]?.length ?? 0,
    },
    grid: buildGrid(draft, publishedStarts),
    clues,
  };

  const integrityErrors = validatePuzzleIntegrity(puzzle).errors;

  if (integrityErrors.length > 0) {
    return {
      puzzle: null,
      errors: integrityErrors,
      warnings,
      runs,
    };
  }

  return { puzzle, errors: [], warnings, runs };
}

export function getDraftRuns(draft: PuzzleDraft): NumberedRun[] {
  return getPublishedNumberedRuns(draft.rows, draft);
}

export function getUncluedRuns(draft: PuzzleDraft): NumberedRun[] {
  return (["across", "down"] as const).flatMap((direction) =>
    getLetterRuns(draft.rows, direction)
      .filter((run) => {
        const positionKey = toCluePositionKey(run.row, run.col);

        return (
          !draft.clues[direction][positionKey]?.trim() &&
          !isIncidentalUncluedRun(draft, direction, run)
        );
      })
      .map((run) => ({
        number: 0,
        direction,
        row: run.row,
        col: run.col,
        length: run.length,
        answer: run.answer,
      })),
  );
}
