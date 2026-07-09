import { useRef } from "react";
import { SiteFooter } from "../components/SiteFooter/SiteFooter";
import { ClueEditor } from "./components/ClueEditor";
import { EditorGrid } from "./components/EditorGrid";
import { EditorToolbar } from "./components/EditorToolbar";
import { ValidationPanel } from "./components/ValidationPanel";
import { useEditorDraft } from "./useEditorDraft";

export function EditorApp() {
  const editor = useEditorDraft();
  const editEntryRef = useRef<((id: string) => void) | null>(null);

  return (
    <main className="editor-app" id="main-content" tabIndex={-1}>
      <EditorToolbar
        canExport={Boolean(editor.compileResult.puzzle)}
        onContinueEditing={editor.continueEditing}
        onCopyIndexSnippet={editor.copyIndexSnippet}
        onExportJson={editor.exportPuzzleJson}
        onExportSource={editor.exportSource}
        onImportFile={editor.handleImportFile}
        onMarkReady={editor.markReady}
        onNew={editor.resetDraft}
        onPreviewInPlayer={editor.previewInPlayer}
        onClearStoredPreview={editor.clearStoredPreview}
        onSetGridSize={editor.setGridSize}
        onSetMeta={editor.setMeta}
        storedPreviewId={editor.storedPreviewId}
        state={editor.state}
      />

      <div className="editor-app__workspace">
        <div className="editor-app__primary">
          <EditorGrid
            editEntryRef={editEntryRef}
            onAddEntry={editor.addEntry}
            onUpdateEntry={editor.updateEntry}
            state={editor.state}
          />
          <ValidationPanel compileResult={editor.compileResult} />
        </div>

        <ClueEditor
          onEditEntry={(id) => editEntryRef.current?.(id)}
          onRemoveEntry={editor.removeEntry}
          state={editor.state}
        />
      </div>

      <SiteFooter />
    </main>
  );
}
