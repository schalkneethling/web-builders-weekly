import { useEffect, useId, useMemo, useRef } from "react";
import type { ActiveClue, CellCoordinate, CellStatus, Direction, Puzzle } from "../../types/puzzle";
import { getClueForCell, getWordCells, isLetterCell } from "../../utils/gridHelpers";
import { Cell } from "./Cell";

interface CrosswordGridProps {
  puzzle: Puzzle;
  entries: string[][];
  cellStatus: (CellStatus | null)[][];
  activeCell: CellCoordinate | null;
  activeClue: ActiveClue | null;
  activeDirection: Direction;
  isComplete: boolean;
  onSetActiveCell: (cell: CellCoordinate) => void;
  onSetCell: (value: string) => void;
  onClearCell: (moveBack: boolean) => void;
  onMoveFocus: (deltaRow: number, deltaCol: number) => void;
  onNextClue: (offset: 1 | -1) => void;
  onToggleDirection: () => void;
}

const keyMoves: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowRight: [0, 1],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
};

function getCellLabel(puzzle: Puzzle, row: number, col: number, activeDirection: Direction) {
  const across = getClueForCell(puzzle, row, col, "across");
  const down = getClueForCell(puzzle, row, col, "down");
  const preferred = activeDirection === "across" ? across : down;
  const fallback = across ?? down;
  const clue = preferred ?? fallback;

  return clue
    ? `Row ${row + 1}, Column ${col + 1}, ${clue.number} ${activeDirection}: ${clue.clue}`
    : `Row ${row + 1}, Column ${col + 1}`;
}

export function CrosswordGrid({
  activeCell,
  activeClue,
  activeDirection,
  cellStatus,
  entries,
  isComplete,
  onClearCell,
  onMoveFocus,
  onNextClue,
  onSetActiveCell,
  onSetCell,
  onToggleDirection,
  puzzle,
}: CrosswordGridProps) {
  const entryInputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const activeWordCells = useMemo(
    () => (activeClue ? getWordCells(activeClue.clue, activeClue.direction) : []),
    [activeClue],
  );

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [activeCell]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (/^[a-z]$/i.test(event.key)) {
      event.preventDefault();
      onSetCell(event.key);
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      onClearCell(true);
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      onClearCell(false);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      onNextClue(event.shiftKey ? -1 : 1);
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
      onToggleDirection();
      return;
    }

    const move = keyMoves[event.key];

    if (move) {
      event.preventDefault();
      onMoveFocus(move[0], move[1]);
    }
  };

  return (
    <section className="crossword" aria-labelledby="crossword-title">
      <div className="crossword__topline">
        <h2 className="crossword__title" id="crossword-title">
          Puzzle grid
        </h2>
        <p className="crossword__direction">{activeDirection}</p>
      </div>
      <table
        aria-describedby="active-clue"
        className="crossword__grid"
        style={{ "--crossword-size": puzzle.size.cols } as React.CSSProperties}
      >
        <caption className="visually-hidden">{puzzle.theme} crossword grid</caption>
        <tbody className="crossword__body">
          {puzzle.grid.map((row, rowIndex) => (
            <tr className="crossword__row" key={rowIndex}>
              {row.map((cell, colIndex) => {
                const coordinate = { row: rowIndex, col: colIndex };
                const isActive = activeCell?.row === rowIndex && activeCell.col === colIndex;
                const isInActiveWord = activeWordCells.some(
                  (wordCell) => wordCell.row === rowIndex && wordCell.col === colIndex,
                );

                return (
                  <Cell
                    cellLabel={getCellLabel(puzzle, rowIndex, colIndex, activeDirection)}
                    cell={cell}
                    coordinate={coordinate}
                    entry={entries[rowIndex]?.[colIndex] ?? ""}
                    isActive={isActive}
                    isInActiveWord={isInActiveWord}
                    key={`${rowIndex}-${colIndex}`}
                    onSelect={(selectedCell) => {
                      if (isLetterCell(cell) && !isComplete) {
                        onSetActiveCell(selectedCell);
                        inputRef.current?.focus({ preventScroll: true });
                      }
                    }}
                    status={cellStatus[rowIndex]?.[colIndex] ?? null}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <label className="visually-hidden" htmlFor={entryInputId}>
        Crossword letter entry
      </label>
      <input
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        className="crossword__input visually-hidden"
        disabled={isComplete}
        id={entryInputId}
        inputMode="text"
        onChange={(event) => {
          const value = event.currentTarget.value.slice(-1);
          event.currentTarget.value = "";

          if (/^[a-z]$/i.test(value)) {
            onSetCell(value);
          }
        }}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        spellCheck={false}
        type="text"
      />
    </section>
  );
}
