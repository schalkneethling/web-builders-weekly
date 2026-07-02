import { ConfirmActionButton } from "../ConfirmActionButton/ConfirmActionButton";

interface ToolbarProps {
  onClearAllProgress: () => void;
  onClearCurrentProgress: () => void;
}

export function Toolbar({ onClearAllProgress, onClearCurrentProgress }: ToolbarProps) {
  return (
    <div className="toolbar">
      <h2 className="toolbar__title">Manage History</h2>
      <fieldset className="toolbar__group">
        <legend className="toolbar__legend visually-hidden">Clear progress</legend>
        <ConfirmActionButton
          confirmLabel="Clear puzzle"
          description="This clears the saved entries and checks for the current puzzle only."
          onConfirm={onClearCurrentProgress}
          title="Clear this puzzle?"
        >
          Clear this puzzle
        </ConfirmActionButton>
        <ConfirmActionButton
          confirmLabel="Clear all"
          description="This clears saved entries and checks for every puzzle on this device."
          onConfirm={onClearAllProgress}
          title="Clear all progress?"
        >
          Clear all progress
        </ConfirmActionButton>
      </fieldset>
    </div>
  );
}
