const LENGTH_HINT_PATTERN = /\s*\(\d+\)\s*$/;

export function stripLengthHint(clue: string): string {
  return clue.replace(LENGTH_HINT_PATTERN, "").trimEnd();
}

export function ensureLengthHint(clue: string, length: number): string {
  const stripped = stripLengthHint(clue);

  if (!stripped) {
    return "";
  }

  if (LENGTH_HINT_PATTERN.test(clue)) {
    return clue.trimEnd();
  }

  return `${stripped} (${length})`;
}

export function parseClueLine(line: string): { number: number; clue: string } | null {
  const match = line.match(/^\s*(\d+)\.\s*(.+?)\s*$/);

  if (!match) {
    return null;
  }

  return {
    number: Number(match[1]),
    clue: match[2] ?? "",
  };
}
