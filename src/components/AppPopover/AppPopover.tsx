import { useEffect, useRef, type ReactNode } from "react";

interface AppPopoverProps {
  children: ReactNode;
  className?: string;
  id: string;
  onToggle?: (event: ToggleEvent) => void;
  role?: "dialog" | "status";
  showOnMount?: boolean;
}

export function AppPopover({
  children,
  className,
  id,
  onToggle,
  role,
  showOnMount = false,
}: AppPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const onToggleRef = useRef(onToggle);
  const popoverClassName = className ? `app-popover ${className}` : "app-popover";

  onToggleRef.current = onToggle;

  useEffect(() => {
    const popover = popoverRef.current;

    if (!popover) {
      return;
    }

    function handleToggle(event: ToggleEvent) {
      onToggleRef.current?.(event);
    }

    popover.addEventListener("toggle", handleToggle);

    return () => {
      popover.removeEventListener("toggle", handleToggle);
    };
  }, []);

  useEffect(() => {
    if (!showOnMount) {
      return;
    }

    const popover = popoverRef.current;

    if (popover && !popover.matches(":popover-open")) {
      popover.showPopover();
    }
  }, [showOnMount]);

  return (
    <div className={popoverClassName} popover="" id={id} role={role} ref={popoverRef}>
      {children}
    </div>
  );
}
