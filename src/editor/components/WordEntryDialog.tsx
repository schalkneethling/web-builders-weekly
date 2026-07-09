import { useId, useState } from "react";
import type { Direction } from "../../types/puzzle";

interface WordEntryDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  mode: "create" | "edit";
  length: number;
  direction: Direction;
  number: number;
  values: {
    number: number;
    direction: Direction;
    clue: string;
    answer: string;
  };
  validate: (values: {
    number: number;
    direction: Direction;
    clue: string;
    answer: string;
  }) => string[];
  onClose: () => void;
  onSubmit: (values: {
    number: number;
    direction: Direction;
    clue: string;
    answer: string;
  }) => void;
}

export function WordEntryDialog({
  dialogRef,
  mode,
  length,
  direction,
  number,
  values,
  validate,
  onClose,
  onSubmit,
}: WordEntryDialogProps) {
  const titleId = useId();
  const [formNumber, setFormNumber] = useState(number);
  const [formDirection, setFormDirection] = useState<Direction>(direction);
  const [formClue, setFormClue] = useState(values.clue);
  const [formAnswer, setFormAnswer] = useState(values.answer);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const formValues = {
    number: formNumber,
    direction: formDirection,
    clue: formClue,
    answer: formAnswer,
  };
  const errors = submitAttempted ? validate(formValues) : [];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(formValues);

    if (validationErrors.length > 0) {
      setSubmitAttempted(true);
      return;
    }

    onSubmit(formValues);
  }

  return (
    <dialog
      aria-labelledby={titleId}
      className="editor-word-dialog"
      onCancel={onClose}
      ref={dialogRef}
    >
      <form className="editor-word-dialog__form" method="dialog" onSubmit={handleSubmit}>
        <header className="editor-word-dialog__header">
          <h2 id={titleId}>{mode === "create" ? "Add word" : "Edit word"}</h2>
          <p>
            {length} cell{length === 1 ? "" : "s"} selected
          </p>
        </header>

        <div className="editor-word-dialog__fields">
          <label className="editor-field">
            <span>Number</span>
            <input
              min={1}
              onChange={(event) => setFormNumber(Number(event.target.value))}
              required
              type="number"
              value={formNumber}
            />
          </label>

          <label className="editor-field">
            <span>Direction</span>
            <select
              onChange={(event) => setFormDirection(event.target.value as Direction)}
              value={formDirection}
            >
              <option value="across">Across</option>
              <option value="down">Down</option>
            </select>
          </label>

          <label className="editor-field editor-field--wide">
            <span>Clue</span>
            <textarea
              onChange={(event) => setFormClue(event.target.value)}
              required
              rows={3}
              value={formClue}
            />
          </label>

          <label className="editor-field editor-field--wide">
            <span>Answer ({length} letters)</span>
            <input
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={length}
              onChange={(event) => setFormAnswer(event.target.value.toUpperCase())}
              pattern="[A-Za-z]+"
              required
              spellCheck={false}
              type="text"
              value={formAnswer}
            />
          </label>
        </div>

        {errors.length > 0 ? (
          <ul className="editor-word-dialog__errors">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}

        <footer className="editor-word-dialog__actions">
          <button className="editor-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="editor-button editor-button--primary" type="submit">
            {mode === "create" ? "Add word" : "Save word"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
