import type { EditorState, EditorWordEntry } from "../types";

interface ClueEditorProps {
  state: EditorState;
  onEditEntry: (id: string) => void;
  onRemoveEntry: (id: string) => void;
}

function ClueSection({
  direction,
  entries,
  onEditEntry,
  onRemoveEntry,
}: {
  direction: "across" | "down";
  entries: EditorWordEntry[];
  onEditEntry: (id: string) => void;
  onRemoveEntry: (id: string) => void;
}) {
  const directionEntries = entries
    .filter((entry) => entry.direction === direction)
    .toSorted((first, second) => first.number - second.number);

  return (
    <section aria-labelledby={`editor-${direction}-title`} className="editor-clues__section">
      <h3 id={`editor-${direction}-title`}>{direction === "across" ? "Across" : "Down"}</h3>
      {directionEntries.length === 0 ? (
        <p className="editor-clues__empty">No {direction} words yet.</p>
      ) : (
        <ul className="editor-clues__list">
          {directionEntries.map((entry) => (
            <li className="editor-clues__item" key={entry.id}>
              <div className="editor-clues__label">
                <span className="editor-clues__number">{entry.number}</span>
                <span className="editor-clues__answer">
                  {entry.answer} · {entry.answer.length}
                </span>
              </div>
              <p className="editor-clues__text">{entry.clue || "No clue text yet."}</p>
              <div className="editor-clues__actions">
                <button
                  className="editor-button"
                  onClick={() => onEditEntry(entry.id)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="editor-button"
                  onClick={() => onRemoveEntry(entry.id)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ClueEditor({ state, onEditEntry, onRemoveEntry }: ClueEditorProps) {
  return (
    <section aria-labelledby="editor-clues-title" className="editor-clues">
      <div className="editor-clues__header">
        <h2 id="editor-clues-title">Words</h2>
        <p>Placed words appear here. Use the grid to add more, or edit from this list.</p>
      </div>

      <ClueSection
        direction="across"
        entries={state.entries}
        onEditEntry={onEditEntry}
        onRemoveEntry={onRemoveEntry}
      />
      <ClueSection
        direction="down"
        entries={state.entries}
        onEditEntry={onEditEntry}
        onRemoveEntry={onRemoveEntry}
      />
    </section>
  );
}
