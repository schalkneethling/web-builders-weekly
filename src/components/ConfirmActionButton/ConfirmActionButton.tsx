import { X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { AppPopover } from "../AppPopover/AppPopover";

interface ConfirmActionButtonProps {
  cancelLabel?: string;
  children: ReactNode;
  confirmLabel: string;
  description: string;
  disabled?: boolean;
  onConfirm: () => void;
  title: string;
}

export function ConfirmActionButton({
  cancelLabel = "Cancel",
  children,
  confirmLabel,
  description,
  disabled = false,
  onConfirm,
  title,
}: ConfirmActionButtonProps) {
  const popoverId = useId();

  return (
    <>
      <button
        disabled={disabled}
        popoverTarget={popoverId}
        popoverTargetAction="toggle"
        type="button"
      >
        {children}
      </button>
      <AppPopover className="confirm-action" id={popoverId} role="dialog">
        <div className="confirm-action__content">
          <h2 className="confirm-action__title">{title}</h2>
          <p className="confirm-action__description">{description}</p>
        </div>
        <button
          className="confirm-action__icon-button"
          popoverTarget={popoverId}
          popoverTargetAction="hide"
          type="button"
        >
          <X aria-hidden="true" size={18} strokeWidth={2.4} />
          <span className="visually-hidden">Dismiss confirmation</span>
        </button>
        <div className="confirm-action__actions">
          <button
            className="confirm-action__secondary"
            popoverTarget={popoverId}
            popoverTargetAction="hide"
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="confirm-action__primary"
            popoverTarget={popoverId}
            popoverTargetAction="hide"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </AppPopover>
    </>
  );
}
