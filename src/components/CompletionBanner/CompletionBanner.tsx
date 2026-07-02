import { X } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { AppPopover } from "../AppPopover/AppPopover";
import { CompletionConfetti } from "./CompletionConfetti";

interface CompletionBannerProps {
  celebrate: boolean;
  isComplete: boolean;
}

export function CompletionBanner({ celebrate, isComplete }: CompletionBannerProps) {
  const popoverId = useId();
  const [isDismissed, setIsDismissed] = useState(false);
  const handleToggle = useCallback((event: ToggleEvent) => {
    if (event.newState === "closed") {
      setIsDismissed(true);
    }
  }, []);

  if (!isComplete) {
    return null;
  }

  return (
    <>
      <CompletionConfetti celebrate={celebrate} />
      {!isDismissed ? (
        <AppPopover
          className="completion-banner"
          id={popoverId}
          onToggle={handleToggle}
          role="status"
          showOnMount
        >
          <div className="completion-banner__content">
            <h2 className="completion-banner__title">Solved</h2>
            <p>Nice work. This week’s crossword is complete.</p>
          </div>
          <button
            className="completion-banner__close"
            popoverTarget={popoverId}
            popoverTargetAction="hide"
            type="button"
          >
            <X aria-hidden="true" size={18} strokeWidth={2.4} />
            <span className="visually-hidden">Dismiss completion message</span>
          </button>
        </AppPopover>
      ) : null}
    </>
  );
}
