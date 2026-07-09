import { useEffect, useRef, useState, type RefObject } from "react";
import {
  findEntryAtCell,
  getCellLetterMap,
  getSelectionRange,
  validateEntryPlacement,
  type EditorCell,
  type EditorState,
  type EditorWordEntry,
} from "../types";
import type { Direction } from "../../types/puzzle";
import { WordEntryDialog } from "./WordEntryDialog";

function getCellFromPointerEvent(event: React.PointerEvent): EditorCell | null {
  const element = document.elementFromPoint(event.clientX, event.clientY);

  if (!(element instanceof Element)) {
    return null;
  }

  const cellElement = element.closest("[data-grid-row][data-grid-col]");

  if (!cellElement) {
    return null;
  }

  const row = Number(cellElement.getAttribute("data-grid-row"));
  const col = Number(cellElement.getAttribute("data-grid-col"));

  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    return null;
  }

  return { row, col };
}

interface EditorGridProps {
  state: EditorState;
  editEntryRef: RefObject<((id: string) => void) | null>;
  onAddEntry: (entry: Omit<EditorWordEntry, "id">) => void;
  onUpdateEntry: (id: string, entry: Omit<EditorWordEntry, "id">) => void;
}

interface DialogState {
  mode: "create" | "edit";
  entryId?: string;
  row: number;
  col: number;
  direction: Direction;
  length: number;
  number: number;
  clue: string;
  answer: string;
}

function getNextClueNumber(entries: EditorWordEntry[]): number {
  if (entries.length === 0) {
    return 1;
  }

  return Math.max(...entries.map((entry) => entry.number)) + 1;
}

export function EditorGrid({ state, editEntryRef, onAddEntry, onUpdateEntry }: EditorGridProps) {
  const [selectionStart, setSelectionStart] = useState<EditorCell | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<EditorCell | null>(null);
  const dragRef = useRef<{ start: EditorCell; end: EditorCell } | null>(null);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const letters = getCellLetterMap(state.entries);

  const selection =
    selectionStart && selectionEnd ? getSelectionRange(selectionStart, selectionEnd) : null;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (dialogState && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!dialogState && dialog.open) {
      dialog.close();
    }
  }, [dialogState]);

  function openCreateDialog(range: ReturnType<typeof getSelectionRange>) {
    if (!range.direction || range.cells.length < 2) {
      return;
    }

    setDialogState({
      mode: "create",
      row: range.start.row,
      col: range.start.col,
      direction: range.direction,
      length: range.cells.length,
      number: getNextClueNumber(state.entries),
      clue: "",
      answer: "",
    });
  }

  function openEditDialog(entry: EditorWordEntry) {
    setDialogState({
      mode: "edit",
      entryId: entry.id,
      row: entry.row,
      col: entry.col,
      direction: entry.direction,
      length: entry.answer.length,
      number: entry.number,
      clue: entry.clue,
      answer: entry.answer,
    });
  }

  editEntryRef.current = (id: string) => {
    const entry = state.entries.find((candidate) => candidate.id === id);

    if (entry) {
      openEditDialog(entry);
    }
  };

  function closeDialog() {
    setDialogState(null);
    setSelectionStart(null);
    setSelectionEnd(null);
  }

  function validateDialogValues(values: {
    number: number;
    direction: Direction;
    clue: string;
    answer: string;
  }): string[] {
    if (!dialogState) {
      return [];
    }

    const candidate = {
      id: dialogState.entryId,
      number: values.number,
      direction: values.direction,
      row: dialogState.row,
      col: dialogState.col,
      answer: values.answer.toUpperCase(),
      clue: values.clue.trim(),
    };

    const errors: string[] = [];

    if (!candidate.clue) {
      errors.push("Clue text is required.");
    }

    if (candidate.answer.length !== dialogState.length) {
      errors.push(`Answer must be exactly ${dialogState.length} letters for the selected cells.`);
    }

    errors.push(...validateEntryPlacement(state, candidate));

    return errors;
  }

  function handleDialogSubmit(values: {
    number: number;
    direction: Direction;
    clue: string;
    answer: string;
  }) {
    if (!dialogState) {
      return;
    }

    const candidate = {
      id: dialogState.entryId,
      number: values.number,
      direction: values.direction,
      row: dialogState.row,
      col: dialogState.col,
      answer: values.answer.toUpperCase(),
      clue: values.clue.trim(),
    };

    if (dialogState.mode === "edit" && dialogState.entryId) {
      onUpdateEntry(dialogState.entryId, candidate);
    } else {
      onAddEntry(candidate);
    }

    closeDialog();
  }

  function handleWrapPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const cell = getCellFromPointerEvent(event);

    if (!cell) {
      return;
    }

    const existingEntry = findEntryAtCell(state.entries, cell);

    if (existingEntry) {
      openEditDialog(existingEntry);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { start: cell, end: cell };
    setSelectionStart(cell);
    setSelectionEnd(cell);
  }

  function handleWrapPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) {
      return;
    }

    const cell = getCellFromPointerEvent(event);

    if (!cell) {
      return;
    }

    dragRef.current.end = cell;
    setSelectionEnd(cell);
  }

  function handleWrapPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const range = getSelectionRange(dragRef.current.start, dragRef.current.end);
    dragRef.current = null;

    if (range.cells.length >= 2 && range.direction) {
      openCreateDialog(range);
      return;
    }

    setSelectionStart(null);
    setSelectionEnd(null);
  }

  function isCellSelected(row: number, col: number): boolean {
    return Boolean(selection?.cells.some((cell) => cell.row === row && cell.col === col));
  }

  function getCellNumber(row: number, col: number): number | null {
    const entry = state.entries.find((candidate) => candidate.row === row && candidate.col === col);

    return entry?.number ?? null;
  }

  function getCellClasses(row: number, col: number): string {
    const key = `${row}:${col}`;
    const hasLetter = letters.has(key);
    const isSelected = isCellSelected(row, col);
    const isBlocked = state.isReady && !hasLetter;

    return [
      "editor-grid__cell",
      isBlocked ? "editor-grid__cell--blocked" : "",
      hasLetter ? "editor-grid__cell--filled" : "editor-grid__cell--empty",
      isSelected ? "editor-grid__cell--selected" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return (
    <section aria-labelledby="editor-grid-title" className="editor-grid-panel">
      <div className="editor-grid-panel__header">
        <h2 id="editor-grid-title">Grid</h2>
        <p>
          Drag across or down to highlight cells, then add the clue and answer. Tap a placed word to
          edit it.
        </p>
      </div>

      <div
        className="editor-grid-wrap"
        onPointerDown={handleWrapPointerDown}
        onPointerMove={handleWrapPointerMove}
        onPointerUp={handleWrapPointerUp}
      >
        <table
          className="editor-grid"
          style={{ "--editor-grid-size": state.cols } as React.CSSProperties}
        >
          <tbody className="editor-grid__body">
            {Array.from({ length: state.rows }, (_, rowIndex) => (
              <tr className="editor-grid__row" key={`row-${rowIndex}`}>
                {Array.from({ length: state.cols }, (_, colIndex) => {
                  const clueNumber = getCellNumber(rowIndex, colIndex);
                  const letter = letters.get(`${rowIndex}:${colIndex}`) ?? "";

                  return (
                    <td
                      className={getCellClasses(rowIndex, colIndex)}
                      data-grid-col={colIndex}
                      data-grid-row={rowIndex}
                      key={`${rowIndex}-${colIndex}`}
                    >
                      <button className="editor-grid__button" type="button">
                        {clueNumber ? (
                          <span className="editor-grid__number">{clueNumber}</span>
                        ) : null}
                        <span className="editor-grid__letter">{letter}</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialogState ? (
        <WordEntryDialog
          key={
            dialogState.entryId ??
            `create-${dialogState.row}-${dialogState.col}-${dialogState.direction}`
          }
          dialogRef={dialogRef}
          direction={dialogState.direction}
          length={dialogState.length}
          mode={dialogState.mode}
          number={dialogState.number}
          onClose={closeDialog}
          onSubmit={handleDialogSubmit}
          validate={validateDialogValues}
          values={{
            answer: dialogState.answer,
            clue: dialogState.clue,
            direction: dialogState.direction,
            number: dialogState.number,
          }}
        />
      ) : null}
    </section>
  );
}
