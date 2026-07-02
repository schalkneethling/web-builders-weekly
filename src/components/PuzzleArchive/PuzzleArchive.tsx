import type { PuzzleIndex } from "../../types/puzzle";
import { getPuzzleArchive } from "../../utils/social";

interface PuzzleArchiveProps {
  currentPuzzleId: string;
  puzzleIndex: PuzzleIndex | null;
}

export function PuzzleArchive({ currentPuzzleId, puzzleIndex }: PuzzleArchiveProps) {
  if (!puzzleIndex) {
    return null;
  }

  return (
    <section className="puzzle-archive" aria-labelledby="archive-title">
      <h2 className="puzzle-archive__title" id="archive-title">
        Past puzzles
      </h2>
      <ol className="puzzle-archive__list">
        {getPuzzleArchive(puzzleIndex).map((puzzle) => (
          <li className="puzzle-archive__item" key={puzzle.id}>
            <a
              aria-current={puzzle.id === currentPuzzleId ? "page" : undefined}
              className="puzzle-archive__link"
              href={`?puzzle=${puzzle.id}`}
            >
              <span>{puzzle.theme}</span>
              <time dateTime={puzzle.date}>{puzzle.date}</time>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
