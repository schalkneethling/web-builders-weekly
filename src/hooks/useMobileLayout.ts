import { useEffect, useState } from "react";

const MOBILE_LAYOUT_QUERY = "(width < 56rem)";

export function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof globalThis.matchMedia === "function"
      ? globalThis.matchMedia(MOBILE_LAYOUT_QUERY).matches
      : false,
  );

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia?.(MOBILE_LAYOUT_QUERY);

    if (!mediaQuery) {
      return;
    }

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isMobile;
}
