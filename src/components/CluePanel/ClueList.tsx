import { useEffect, useRef } from "react";
import type { ActiveClue, Clue, Direction } from "../../types/puzzle";

interface ClueListProps {
  activeClue: ActiveClue | null;
  clues: Clue[];
  direction: Direction;
  onFocusClue: (activeClue: ActiveClue) => void;
}

export function ClueList({ activeClue, clues, direction, onFocusClue }: ClueListProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeClue]);

  return (
    <section className="clue-list" aria-labelledby={`${direction}-heading`}>
      <h3 className="clue-list__heading" id={`${direction}-heading`}>
        {direction}
      </h3>
      <ol className="clue-list__items">
        {clues.map((clue) => {
          const isActive =
            activeClue?.direction === direction && activeClue.clue.number === clue.number;

          return (
            <li className="clue-list__item" key={`${direction}-${clue.number}`}>
              <button
                aria-current={isActive ? "true" : undefined}
                className={`clue-list__button${isActive ? " clue-list__button--active" : ""}`}
                onClick={() => onFocusClue({ direction, clue })}
                ref={isActive ? activeRef : undefined}
                type="button"
              >
                <span className="clue-list__number">{clue.number}</span>
                <span>{clue.clue}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
