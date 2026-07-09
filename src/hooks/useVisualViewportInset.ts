import { useEffect } from "react";

const VISUAL_VIEWPORT_INSET_PROPERTY = "--visual-viewport-inset-block-end";

function updateVisualViewportInset() {
  const viewport = window.visualViewport;

  if (!viewport) {
    return;
  }

  const insetBlockEnd = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);

  document.documentElement.style.setProperty(VISUAL_VIEWPORT_INSET_PROPERTY, `${insetBlockEnd}px`);
}

export function useVisualViewportInset() {
  useEffect(() => {
    const viewport = window.visualViewport;

    if (!viewport) {
      return;
    }

    updateVisualViewportInset();
    viewport.addEventListener("resize", updateVisualViewportInset);
    viewport.addEventListener("scroll", updateVisualViewportInset);

    return () => {
      viewport.removeEventListener("resize", updateVisualViewportInset);
      viewport.removeEventListener("scroll", updateVisualViewportInset);
      document.documentElement.style.removeProperty(VISUAL_VIEWPORT_INSET_PROPERTY);
    };
  }, []);
}
