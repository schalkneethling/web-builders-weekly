import { useId, useState } from "react";
import type { EditorState } from "../types";

interface EditorToolbarProps {
  canExport: boolean;
  state: EditorState;
  onContinueEditing: () => void;
  onCopyIndexSnippet: () => void;
  onExportJson: () => void;
  onExportSource: () => void;
  onImportFile: (file: File) => Promise<void>;
  onMarkReady: () => void;
  onNew: () => void;
  onPreviewInPlayer: () => void;
  onClearStoredPreview: () => void;
  storedPreviewId: string | null;
  onSetGridSize: (rows: number, cols: number) => void;
  onSetMeta: (field: "id" | "date" | "theme", value: string) => void;
}

export function EditorToolbar({
  canExport,
  state,
  onContinueEditing,
  onCopyIndexSnippet,
  onExportJson,
  onExportSource,
  onImportFile,
  onMarkReady,
  onNew,
  onPreviewInPlayer,
  onClearStoredPreview,
  onSetGridSize,
  onSetMeta,
  storedPreviewId,
}: EditorToolbarProps) {
  const fileInputId = useId();
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  async function handleCopyIndexSnippet() {
    onCopyIndexSnippet();
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 2000);
  }

  return (
    <header className="editor-toolbar">
      <div className="editor-toolbar__intro">
        <p className="editor-toolbar__eyebrow">Web Builders Weekly</p>
        <h1>Puzzle editor</h1>
        <p className="editor-toolbar__lede">
          Drag across the grid to place words, then mark the puzzle ready to fill in blocked cells.
        </p>
      </div>

      <div className="editor-toolbar__meta">
        <label className="editor-field">
          <span>Id</span>
          <input
            onChange={(event) => onSetMeta("id", event.target.value)}
            placeholder="2026-07-10"
            type="text"
            value={state.id}
          />
        </label>
        <label className="editor-field">
          <span>Date</span>
          <input
            onChange={(event) => onSetMeta("date", event.target.value)}
            placeholder="2026-07-10"
            type="date"
            value={state.date}
          />
        </label>
        <label className="editor-field editor-field--wide">
          <span>Theme</span>
          <input
            onChange={(event) => onSetMeta("theme", event.target.value)}
            placeholder="Web Platform Friday"
            type="text"
            value={state.theme}
          />
        </label>
        <label className="editor-field">
          <span>Rows</span>
          <input
            min={3}
            onChange={(event) => onSetGridSize(Number(event.target.value), state.cols)}
            type="number"
            value={state.rows}
          />
        </label>
        <label className="editor-field">
          <span>Cols</span>
          <input
            min={3}
            onChange={(event) => onSetGridSize(state.rows, Number(event.target.value))}
            type="number"
            value={state.cols}
          />
        </label>
      </div>

      <div className="editor-toolbar__actions">
        <button className="editor-button" onClick={onNew} type="button">
          New puzzle
        </button>
        <label className="editor-button" htmlFor={fileInputId}>
          Import
        </label>
        <input
          accept=".json,.wbw,text/plain,application/json"
          className="visually-hidden"
          id={fileInputId}
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              void onImportFile(file);
            }

            event.target.value = "";
          }}
          type="file"
        />
        {state.isReady ? (
          <button className="editor-button" onClick={onContinueEditing} type="button">
            Continue editing
          </button>
        ) : (
          <button
            className="editor-button editor-button--primary"
            disabled={state.entries.length === 0}
            onClick={onMarkReady}
            type="button"
          >
            Mark puzzle ready
          </button>
        )}
        <button
          className="editor-button"
          disabled={!canExport}
          onClick={onExportSource}
          type="button"
        >
          Export .wbw
        </button>
        <button
          className="editor-button editor-button--primary"
          disabled={!canExport}
          onClick={onExportJson}
          type="button"
        >
          Download JSON
        </button>
        <button
          className="editor-button"
          disabled={!canExport}
          onClick={() => void handleCopyIndexSnippet()}
          type="button"
        >
          {copyState === "copied" ? "Index snippet copied" : "Copy index snippet"}
        </button>
        {canExport ? (
          <button
            className="editor-button editor-button--link"
            onClick={onPreviewInPlayer}
            type="button"
          >
            Preview in player
          </button>
        ) : null}
        {storedPreviewId ? (
          <button className="editor-button" onClick={onClearStoredPreview} type="button">
            Clear stored preview ({storedPreviewId})
          </button>
        ) : null}
      </div>
    </header>
  );
}
