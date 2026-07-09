import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ActiveClue } from "../../types/puzzle";
import { useMobileLayout } from "../../hooks/useMobileLayout";
import { useVisualViewportInset } from "../../hooks/useVisualViewportInset";

interface MobileClueBarProps {
  activeClue: ActiveClue | null;
  onNextClue: (offset: 1 | -1) => void;
}

function formatClueText(activeClue: ActiveClue) {
  return `${activeClue.clue.number} ${activeClue.direction}: ${activeClue.clue.clue}`;
}

export function MobileClueBar({ activeClue, onNextClue }: MobileClueBarProps) {
  const isMobile = useMobileLayout();

  useVisualViewportInset();

  if (!isMobile) {
    return null;
  }

  return (
    <div
      aria-labelledby="mobile-clue-bar-label"
      className={["mobile-clue-bar", activeClue ? "mobile-clue-bar--visible" : ""]
        .filter(Boolean)
        .join(" ")}
      id="active-clue"
      role="region"
    >
      <button className="mobile-clue-bar__nav" onClick={() => onNextClue(-1)} type="button">
        <ChevronLeft aria-hidden="true" size={20} strokeWidth={2.5} />
        <span className="visually-hidden">Previous clue</span>
      </button>
      <p className="mobile-clue-bar__text" id="mobile-clue-bar-label">
        {activeClue ? formatClueText(activeClue) : "Choose a cell to see its clue."}
      </p>
      <button className="mobile-clue-bar__nav" onClick={() => onNextClue(1)} type="button">
        <ChevronRight aria-hidden="true" size={20} strokeWidth={2.5} />
        <span className="visually-hidden">Next clue</span>
      </button>
    </div>
  );
}
