import type { Direction } from "../types/puzzle";
import { parseClueLine, stripLengthHint } from "./clueText";
import {
  getLetterRuns,
  getPublishedNumberedRuns,
  startsAcrossRun,
  startsDownRun,
} from "./letterRuns";
import { normalizeDraftChar, toCluePositionKey, type PuzzleDraft } from "./types";

function parseMetaLine(line: string): { key: string; value: string } | null {
  const match = line.match(/^\s*([a-z]+)\s*:\s*(.+?)\s*$/i);

  if (!match) {
    return null;
  }

  return {
    key: match[1]!.toLowerCase(),
    value: match[2]!.trim(),
  };
}

function isDirectionHeading(line: string): Direction | null {
  const normalized = line.trim().toLowerCase();

  if (normalized === "across") {
    return "across";
  }

  if (normalized === "down") {
    return "down";
  }

  return null;
}

function buildDraftFromAssignment(
  rows: string[],
  numberedClues: Record<Direction, Record<number, string>>,
  assignedCells: Map<number, { row: number; col: number }>,
  meta: Pick<PuzzleDraft, "id" | "date" | "theme">,
): PuzzleDraft {
  const draft: PuzzleDraft = {
    ...meta,
    rows,
    clues: { across: {}, down: {} },
  };

  for (const direction of ["across", "down"] as const) {
    for (const [numberText, clueText] of Object.entries(numberedClues[direction])) {
      const number = Number(numberText);
      const cell = assignedCells.get(number);

      if (!cell || !clueText.trim()) {
        continue;
      }

      const run = getLetterRuns(rows, direction).find(
        (candidate) => candidate.row === cell.row && candidate.col === cell.col,
      );

      if (run) {
        draft.clues[direction][toCluePositionKey(run.row, run.col)] = stripLengthHint(clueText);
      }
    }
  }

  return draft;
}

function verifyAssignment(
  rows: string[],
  numberedClues: Record<Direction, Record<number, string>>,
  assignedCells: Map<number, { row: number; col: number }>,
  meta: Pick<PuzzleDraft, "id" | "date" | "theme">,
): boolean {
  const draft = buildDraftFromAssignment(rows, numberedClues, assignedCells, meta);
  const publishedRuns = getPublishedNumberedRuns(rows, draft);

  for (const direction of ["across", "down"] as const) {
    for (const [numberText, clueText] of Object.entries(numberedClues[direction])) {
      if (!clueText.trim()) {
        continue;
      }

      const number = Number(numberText);
      const run = publishedRuns.find(
        (candidate) => candidate.direction === direction && candidate.number === number,
      );

      if (!run) {
        return false;
      }

      const positionKey = toCluePositionKey(run.row, run.col);
      const storedClue = draft.clues[direction][positionKey];

      if (!storedClue || stripLengthHint(storedClue) !== stripLengthHint(clueText)) {
        return false;
      }
    }
  }

  return true;
}

function resolvePublishedCellNumbers(
  rows: string[],
  numberedClues: Record<Direction, Record<number, string>>,
  meta: Pick<PuzzleDraft, "id" | "date" | "theme">,
): Map<number, { row: number; col: number }> {
  const clueNumbers = [
    ...new Set([
      ...Object.keys(numberedClues.across).map(Number),
      ...Object.keys(numberedClues.down).map(Number),
    ]),
  ].sort((first, second) => first - second);

  const rowCount = rows.length;
  const colCount = rows[0]?.length ?? 0;
  const candidates: Array<{ row: number; col: number }> = [];

  for (let row = 0; row < rowCount; row += 1) {
    for (let col = 0; col < colCount; col += 1) {
      candidates.push({ row, col });
    }
  }

  const validCellsForNumber = (number: number) =>
    candidates.filter((cell) => {
      const hasAcross = Boolean(numberedClues.across[number]?.trim());
      const hasDown = Boolean(numberedClues.down[number]?.trim());
      const acrossMatch = !hasAcross || startsAcrossRun(rows, cell.row, cell.col);
      const downMatch = !hasDown || startsDownRun(rows, cell.row, cell.col);

      return acrossMatch && downMatch;
    });

  const assignedCells = new Map<number, { row: number; col: number }>();

  function assignNumber(index: number, usedPositions: Set<string>): boolean {
    if (index >= clueNumbers.length) {
      return verifyAssignment(rows, numberedClues, assignedCells, meta);
    }

    const number = clueNumbers[index]!;

    for (const cell of validCellsForNumber(number)) {
      const positionKey = `${cell.row}:${cell.col}`;

      if (usedPositions.has(positionKey)) {
        continue;
      }

      assignedCells.set(number, cell);
      usedPositions.add(positionKey);

      if (assignNumber(index + 1, usedPositions)) {
        return true;
      }

      assignedCells.delete(number);
      usedPositions.delete(positionKey);
    }

    return false;
  }

  assignNumber(0, new Set());

  return assignedCells;
}

export function parseSource(source: string): PuzzleDraft {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const draft: PuzzleDraft = {
    id: "",
    date: "",
    theme: "",
    rows: [],
    clues: {
      across: {},
      down: {},
    },
  };

  const numberedClues: Record<Direction, Record<number, string>> = {
    across: {},
    down: {},
  };

  let section: "meta" | "grid" | "across" | "down" = "meta";

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      if (section === "meta" && draft.rows.length === 0) {
        continue;
      }

      if (section === "grid" && draft.rows.length > 0) {
        section = "across";
      }

      continue;
    }

    const direction = isDirectionHeading(line);

    if (direction) {
      section = direction;
      continue;
    }

    if (section === "meta") {
      const meta = parseMetaLine(line);

      if (meta?.key === "id") {
        draft.id = meta.value;
      } else if (meta?.key === "date") {
        draft.date = meta.value;
      } else if (meta?.key === "theme") {
        draft.theme = meta.value;
      } else if (!meta && draft.rows.length === 0) {
        section = "grid";
        draft.rows.push(
          line
            .split("")
            .map((char) => String(normalizeDraftChar(char)))
            .join(""),
        );
      }

      continue;
    }

    if (section === "grid") {
      draft.rows.push(
        line
          .split("")
          .map((char) => String(normalizeDraftChar(char)))
          .join(""),
      );
      continue;
    }

    const clue = parseClueLine(line);

    if (clue) {
      numberedClues[section][clue.number] = clue.clue;
    }
  }

  if (!draft.id && draft.date) {
    draft.id = draft.date;
  }

  if (!draft.date && draft.id) {
    draft.date = draft.id;
  }

  const publishedCells = resolvePublishedCellNumbers(draft.rows, numberedClues, {
    id: draft.id,
    date: draft.date,
    theme: draft.theme,
  });

  return buildDraftFromAssignment(draft.rows, numberedClues, publishedCells, {
    id: draft.id,
    date: draft.date,
    theme: draft.theme,
  });
}
