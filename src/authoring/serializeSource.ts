import type { Direction } from "../types/puzzle";
import { ensureLengthHint } from "./clueText";
import { getPublishedNumberedRuns } from "./letterRuns";
import type { PuzzleDraft } from "./types";

function serializeClueSection(
  direction: Direction,
  draft: PuzzleDraft,
  runs: ReturnType<typeof getPublishedNumberedRuns>,
): string[] {
  const lines = [direction === "across" ? "Across" : "Down"];
  const directionRuns = runs
    .filter((run) => run.direction === direction)
    .sort((first, second) => first.number - second.number);

  for (const run of directionRuns) {
    const clueText = draft.clues[direction][`${run.row},${run.col}`] ?? "";
    const displayText = clueText ? ensureLengthHint(clueText, run.length) : "";

    lines.push(`${run.number}. ${displayText}`.trimEnd());
  }

  return lines;
}

export function serializeSource(draft: PuzzleDraft): string {
  const runs = getPublishedNumberedRuns(draft.rows, draft);
  const sections = [
    `id: ${draft.id}`,
    `date: ${draft.date}`,
    `theme: ${draft.theme}`,
    "",
    ...draft.rows,
    "",
    ...serializeClueSection("across", draft, runs),
    "",
    ...serializeClueSection("down", draft, runs),
  ];

  return `${sections.join("\n").trimEnd()}\n`;
}
