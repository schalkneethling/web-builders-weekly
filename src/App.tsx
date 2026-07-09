import { useEffect, useRef, useState } from "react";
import { CompletionBanner } from "./components/CompletionBanner/CompletionBanner";
import { CluePanel } from "./components/CluePanel/CluePanel";
import { CrosswordGrid } from "./components/CrosswordGrid/CrosswordGrid";
import { HintPanel } from "./components/HintPanel/HintPanel";
import { PersistenceNotice } from "./components/PersistenceNotice/PersistenceNotice";
import { PuzzleHeader } from "./components/PuzzleHeader/PuzzleHeader";
import { PuzzleArchive } from "./components/PuzzleArchive/PuzzleArchive";
import { SiteFooter } from "./components/SiteFooter/SiteFooter";
import { SocialShare } from "./components/SocialShare/SocialShare";
import { MobileClueBar } from "./components/MobileClueBar/MobileClueBar";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { useClueHighlight } from "./hooks/useClueHighlight";
import { usePuzzle } from "./hooks/usePuzzle";
import { isPreviewMode } from "./utils/puzzlePreview";

export function App() {
  const puzzleState = usePuzzle();
  const [shouldCelebrateCompletion, setShouldCelebrateCompletion] = useState(false);
  const hasCompletedPuzzle = useRef(false);
  const activeClue = useClueHighlight(
    puzzleState.puzzle,
    puzzleState.activeCell,
    puzzleState.activeDirection,
  );

  useEffect(() => {
    if (puzzleState.isComplete && !hasCompletedPuzzle.current) {
      if (puzzleState.announcement === "Puzzle completed. Nicely solved.") {
        setShouldCelebrateCompletion(true);
      }

      hasCompletedPuzzle.current = true;
      return;
    }

    if (!puzzleState.isComplete) {
      hasCompletedPuzzle.current = false;
      setShouldCelebrateCompletion(false);
    }
  }, [puzzleState.announcement, puzzleState.isComplete]);

  if (puzzleState.isLoading) {
    return (
      <main className="app app--loading" id="main-content" tabIndex={-1}>
        <div className="loading-shell" role="status">
          <span className="visually-hidden">Loading puzzle</span>
          <span className="loading-shell__bar" />
          <span className="loading-shell__grid" />
        </div>
        <SiteFooter />
      </main>
    );
  }

  if (puzzleState.error || !puzzleState.puzzle) {
    return (
      <main className="app" id="main-content" tabIndex={-1}>
        <section className="error-panel" aria-labelledby="error-title">
          <h1 id="error-title">Puzzle unavailable</h1>
          <p>{puzzleState.error ?? "Unable to load this week's crossword."}</p>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="app" id="main-content" tabIndex={-1}>
      <PuzzleHeader puzzle={puzzleState.puzzle} />
      {isPreviewMode() ? null : (
        <PersistenceNotice canPersistProgress={puzzleState.canPersistProgress} />
      )}
      <CompletionBanner
        key={String(puzzleState.isComplete)}
        celebrate={shouldCelebrateCompletion}
        isComplete={puzzleState.isComplete}
      />
      <div className="app__workspace">
        <div className="app__play-area">
          <CrosswordGrid
            activeClue={activeClue}
            activeDirection={puzzleState.activeDirection}
            cellStatus={puzzleState.cellStatus}
            entries={puzzleState.entries}
            isComplete={puzzleState.isComplete}
            onClearCell={puzzleState.actions.clearCell}
            onMoveFocus={puzzleState.actions.moveFocus}
            onNextClue={puzzleState.actions.nextClue}
            onSetActiveCell={puzzleState.actions.setActiveCell}
            onSetCell={puzzleState.actions.setCell}
            onToggleDirection={puzzleState.actions.toggleDirection}
            puzzle={puzzleState.puzzle}
            activeCell={puzzleState.activeCell}
          />
          <SocialShare
            cellStatus={puzzleState.cellStatus}
            entries={puzzleState.entries}
            isComplete={puzzleState.isComplete}
            puzzle={puzzleState.puzzle}
            stats={puzzleState.stats}
          />
          <Toolbar
            onClearAllProgress={puzzleState.actions.clearAllProgress}
            onClearCurrentProgress={puzzleState.actions.clearCurrentProgress}
          />
        </div>
        <div className="app__side-area">
          <CluePanel
            activeClue={activeClue}
            onFocusClue={puzzleState.actions.focusClue}
            puzzle={puzzleState.puzzle}
          />
          <HintPanel
            isComplete={puzzleState.isComplete}
            onCheck={puzzleState.actions.check}
            onReveal={puzzleState.actions.reveal}
          />
          <PuzzleArchive
            currentPuzzleId={puzzleState.puzzle.id}
            puzzleIndex={puzzleState.puzzleIndex}
          />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {puzzleState.announcement}
      </p>
      <MobileClueBar activeClue={activeClue} onNextClue={puzzleState.actions.nextClue} />
      <SiteFooter />
    </main>
  );
}
