import type { ActiveClue, Puzzle } from "../../types/puzzle";
import { ClueList } from "./ClueList";

interface CluePanelProps {
  activeClue: ActiveClue | null;
  puzzle: Puzzle;
  onFocusClue: (activeClue: ActiveClue) => void;
}

export function CluePanel({ activeClue, onFocusClue, puzzle }: CluePanelProps) {
  return (
    <aside className="clue-panel" aria-labelledby="clue-panel-title">
      <div className="clue-panel__header">
        <h2 className="clue-panel__title" id="clue-panel-title">
          Clues
        </h2>
        <p className="clue-panel__active" id="active-clue">
          {activeClue
            ? `${activeClue.clue.number} ${activeClue.direction}: ${activeClue.clue.clue}`
            : "Choose a cell to hear its clue."}
        </p>
      </div>
      <div className="clue-panel__lists">
        <ClueList
          activeClue={activeClue}
          clues={puzzle.clues.across}
          direction="across"
          onFocusClue={onFocusClue}
        />
        <ClueList
          activeClue={activeClue}
          clues={puzzle.clues.down}
          direction="down"
          onFocusClue={onFocusClue}
        />
      </div>
    </aside>
  );
}
