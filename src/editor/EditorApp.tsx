import { SiteFooter } from "../components/SiteFooter/SiteFooter";
import { ClueEditor } from "./components/ClueEditor";
import { EditorGrid } from "./components/EditorGrid";
import { EditorToolbar } from "./components/EditorToolbar";
import { ValidationPanel } from "./components/ValidationPanel";
import { useEditorDraft } from "./useEditorDraft";

export function EditorApp() {
  const editor = useEditorDraft();

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
            editingEntryId={editor.editingEntryId}
            onAddEntry={editor.addEntry}
            onClearEditingEntry={editor.clearEditingEntry}
            onUpdateEntry={editor.updateEntry}
            state={editor.state}
          />
          <ValidationPanel compileResult={editor.compileResult} />
        </div>

        <ClueEditor
          onEditEntry={editor.startEditingEntry}
          onRemoveEntry={editor.removeEntry}
          state={editor.state}
        />
      </div>

      <SiteFooter />
    </main>
  );
}
