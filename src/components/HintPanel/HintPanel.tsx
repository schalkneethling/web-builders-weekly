import { ConfirmActionButton } from "../ConfirmActionButton/ConfirmActionButton";

interface HintPanelProps {
  isComplete: boolean;
  onCheck: (scope: "word" | "puzzle") => void;
  onReveal: (scope: "cell" | "word" | "puzzle") => void;
}

export function HintPanel({ isComplete, onCheck, onReveal }: HintPanelProps) {
  return (
    <details className="hint-panel">
      <summary className="hint-panel__summary">Need a hint?</summary>
      <div className="hint-panel__content">
        <fieldset className="hint-panel__group">
          <legend className="hint-panel__legend visually-hidden">Check answers</legend>
          <button disabled={isComplete} onClick={() => onCheck("word")} type="button">
            Check word
          </button>
          <button disabled={isComplete} onClick={() => onCheck("puzzle")} type="button">
            Check puzzle
          </button>
        </fieldset>
        <fieldset className="hint-panel__group">
          <legend className="hint-panel__legend visually-hidden">Reveal answers</legend>
          <button disabled={isComplete} onClick={() => onReveal("cell")} type="button">
            Reveal cell
          </button>
          <button disabled={isComplete} onClick={() => onReveal("word")} type="button">
            Reveal word
          </button>
          <ConfirmActionButton
            confirmLabel="Reveal puzzle"
            description="This fills every answer in the grid and completes the puzzle."
            disabled={isComplete}
            onConfirm={() => onReveal("puzzle")}
            title="Reveal the full puzzle?"
          >
            Reveal puzzle
          </ConfirmActionButton>
        </fieldset>
      </div>
    </details>
  );
}
