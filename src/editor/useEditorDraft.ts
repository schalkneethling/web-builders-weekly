import { useEffect, useState } from "react";
import { parseSource, serializeSource } from "../authoring";
import type { Puzzle } from "../types/puzzle";
import {
  createPreviewPlayerUrl,
  clearPuzzlePreview,
  getStoredPreviewId,
  writePuzzlePreview,
} from "../utils/puzzlePreview";
import {
  compileEditorState,
  createEmptyEditorState,
  createEntryId,
  draftToEditorState,
  entriesToDraft,
  puzzleToEditorState,
  type EditorState,
  type EditorWordEntry,
} from "./types";

function downloadFile(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function useEditorDraft(initialState = createEmptyEditorState()) {
  const [state, setState] = useState<EditorState>(initialState);
  const [compileResult, setCompileResult] = useState(() => compileEditorState(initialState));
  const [storedPreviewId, setStoredPreviewId] = useState(() => getStoredPreviewId());

  function refreshStoredPreviewId() {
    setStoredPreviewId(getStoredPreviewId());
  }

  useEffect(() => {
    setCompileResult(compileEditorState(state));
  }, [state]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.storageArea !== localStorage) {
        return;
      }

      refreshStoredPreviewId();
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function updateState(updater: (current: EditorState) => EditorState) {
    setState((current) => updater(current));
  }

  function setMeta(field: "id" | "date" | "theme", value: string) {
    updateState((current) => {
      const next = { ...current, [field]: value };

      if (field === "date" && !current.id) {
        next.id = value;
      }

      if (field === "id" && !current.date) {
        next.date = value;
      }

      return next;
    });
  }

  function setGridSize(rows: number, cols: number) {
    updateState((current) => ({
      ...current,
      rows,
      cols,
      entries: current.entries.filter((entry) => {
        const endRow =
          entry.direction === "across" ? entry.row : entry.row + entry.answer.length - 1;
        const endCol =
          entry.direction === "across" ? entry.col + entry.answer.length - 1 : entry.col;

        return endRow < rows && endCol < cols;
      }),
      isReady: false,
    }));
  }

  function addEntry(entry: Omit<EditorWordEntry, "id">) {
    updateState((current) => ({
      ...current,
      entries: [...current.entries, { ...entry, id: createEntryId() }],
      isReady: false,
    }));
  }

  function updateEntry(id: string, entry: Omit<EditorWordEntry, "id">) {
    updateState((current) => ({
      ...current,
      entries: current.entries.map((existing) =>
        existing.id === id ? { ...entry, id } : existing,
      ),
      isReady: false,
    }));
  }

  function removeEntry(id: string) {
    updateState((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== id),
      isReady: false,
    }));
  }

  function markReady() {
    updateState((current) => ({
      ...current,
      isReady: true,
    }));
  }

  function continueEditing() {
    updateState((current) => ({
      ...current,
      isReady: false,
    }));
  }

  function resetDraft() {
    clearPuzzlePreview();
    refreshStoredPreviewId();
    setState(createEmptyEditorState(state.rows, state.cols));
  }

  function clearStoredPreview() {
    clearPuzzlePreview();
    refreshStoredPreviewId();
  }

  function exportPuzzleJson() {
    if (!compileResult.puzzle) {
      return;
    }

    downloadFile(
      `${state.id || "puzzle"}.json`,
      `${JSON.stringify(compileResult.puzzle, null, 2)}\n`,
      "application/json",
    );
  }

  function exportSource() {
    downloadFile(
      `${state.id || "puzzle"}.wbw`,
      serializeSource(entriesToDraft(state)),
      "text/plain",
    );
  }

  function copyIndexSnippet() {
    if (!compileResult.puzzle) {
      return;
    }

    const snippet = JSON.stringify(
      {
        id: compileResult.puzzle.id,
        date: compileResult.puzzle.date,
        theme: compileResult.puzzle.theme,
      },
      null,
      2,
    );

    void navigator.clipboard.writeText(snippet);
  }

  function previewInPlayer() {
    if (!compileResult.puzzle) {
      return;
    }

    if (!writePuzzlePreview(compileResult.puzzle)) {
      window.alert("Unable to store a preview for this puzzle in this browser.");
      return;
    }

    refreshStoredPreviewId();
    window.open(createPreviewPlayerUrl(compileResult.puzzle.id), "_blank", "noopener,noreferrer");
  }

  async function handleImportFile(file: File) {
    const text = await file.text();

    if (file.name.endsWith(".json")) {
      setState(puzzleToEditorState(JSON.parse(text) as Puzzle));
      return;
    }

    setState(draftToEditorState(parseSource(text)));
  }

  return {
    state,
    compileResult,
    storedPreviewId,
    addEntry,
    updateEntry,
    removeEntry,
    markReady,
    continueEditing,
    resetDraft,
    setMeta,
    setGridSize,
    exportPuzzleJson,
    exportSource,
    copyIndexSnippet,
    handleImportFile,
    previewInPlayer,
    clearStoredPreview,
  };
}

export type { EditorCell, EditorState, EditorWordEntry } from "./types";
