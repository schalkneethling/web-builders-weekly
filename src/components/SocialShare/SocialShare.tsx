import { useMemo, useState } from "react";
import type { CellStatus, Puzzle, PuzzleStats } from "../../types/puzzle";
import { isLetterCell } from "../../utils/gridHelpers";
import { getShareResult, getShareSummary } from "../../utils/social";

interface SocialShareProps {
  cellStatus: (CellStatus | null)[][];
  entries: string[][];
  isComplete: boolean;
  puzzle: Puzzle;
  stats: PuzzleStats;
}

function countLetterCells(puzzle: Puzzle) {
  return puzzle.grid.flat().filter(isLetterCell).length;
}

function countRevealed(cellStatus: (CellStatus | null)[][]) {
  return cellStatus.flat().filter((status) => status === "revealed").length;
}

export function SocialShare({ cellStatus, entries, isComplete, puzzle, stats }: SocialShareProps) {
  const [message, setMessage] = useState("");
  const totalCells = useMemo(() => countLetterCells(puzzle), [puzzle]);
  const revealedCount = useMemo(() => countRevealed(cellStatus), [cellStatus]);
  const shareSummary = useMemo(
    () => getShareSummary({ revealedCount, stats, theme: puzzle.theme, totalCells }),
    [puzzle.theme, revealedCount, stats, totalCells],
  );
  const shareText = useMemo(
    () =>
      getShareResult({
        date: puzzle.date,
        entries,
        puzzleId: puzzle.id,
        revealedCount,
        stats,
        theme: puzzle.theme,
        totalCells,
      }),
    [entries, puzzle, revealedCount, stats, totalCells],
  );

  async function copyText(text: string, successMessage: string) {
    if (!navigator.clipboard?.writeText) {
      setMessage("Clipboard access is unavailable. Select the recap text to copy it manually.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setMessage(successMessage);
    } catch {
      setMessage("Unable to copy. Select the recap text to copy it manually.");
    }
  }

  async function shareResult() {
    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
          title: "Web Builders Weekly Crossword",
          url: window.location.href,
        });
        setMessage("Share sheet opened.");
      } catch {
        setMessage("Share cancelled.");
      }
      return;
    }

    await copyText(`${shareText}\n${window.location.href}`, "Result copied.");
  }

  async function copyProse() {
    await copyText(`${shareSummary}\n${window.location.href}`, "Suggested post copied.");
  }

  return (
    <section className="social-share" aria-labelledby="share-title">
      <div>
        <h2 className="social-share__title" id="share-title">
          Share result
        </h2>
        <p className="social-share__copy">
          Finish the puzzle to create a spoiler-free recap for sharing.
        </p>
      </div>
      {isComplete ? <p className="social-share__summary">{shareSummary}</p> : null}
      <div className="social-share__actions">
        <button disabled={!isComplete} onClick={() => void shareResult()} type="button">
          Share score
        </button>
        <button disabled={!isComplete} onClick={() => void copyProse()} type="button">
          Copy prose
        </button>
      </div>
      <p className="social-share__status" aria-live="polite">
        {message || (isComplete ? "Ready to share." : "Finish the puzzle to share.")}
      </p>
    </section>
  );
}
