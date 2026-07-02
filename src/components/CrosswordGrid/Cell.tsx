import type { CellCoordinate, CellStatus, PuzzleCell } from "../../types/puzzle";
import { isLetterCell } from "../../utils/gridHelpers";

interface CellProps {
  cell: PuzzleCell;
  cellLabel: string;
  coordinate: CellCoordinate;
  entry: string;
  isActive: boolean;
  isInActiveWord: boolean;
  status: CellStatus | null;
  onSelect: (cell: CellCoordinate) => void;
}

export function Cell({
  cell,
  cellLabel,
  coordinate,
  entry,
  isActive,
  isInActiveWord,
  onSelect,
  status,
}: CellProps) {
  if (!isLetterCell(cell)) {
    return <td aria-label="Blocked cell" className="crossword-cell crossword-cell--blocked" />;
  }

  const classes = [
    "crossword-cell",
    "crossword-cell--letter",
    isActive ? "crossword-cell--active" : "",
    isInActiveWord ? "crossword-cell--word" : "",
    status ? `crossword-cell--${status}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <td className={classes}>
      <button
        aria-current={isActive ? "true" : undefined}
        className="crossword-cell__button"
        onClick={() => onSelect(coordinate)}
        type="button"
      >
        <span className="visually-hidden">{cellLabel}</span>
        {cell.clueNumber ? <span className="crossword-cell__number">{cell.clueNumber}</span> : null}
        <span className="crossword-cell__letter">{entry}</span>
        {status ? (
          <span className="crossword-cell__status">{status === "incorrect" ? "!" : "✓"}</span>
        ) : null}
      </button>
    </td>
  );
}
