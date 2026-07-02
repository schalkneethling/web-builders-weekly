import { useEffect } from "react";

interface CompletionConfettiProps {
  celebrate: boolean;
}

const burstDelayMs = 250;

export function CompletionConfetti({ celebrate }: CompletionConfettiProps) {
  useEffect(() => {
    if (!celebrate) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches) {
      return;
    }

    let isMounted = true;
    const timers: number[] = [];

    async function celebrateCompletion() {
      const { default: confetti } = await import("@hiseb/confetti");

      if (!isMounted) {
        return;
      }

      const positions = [
        { x: window.innerWidth * 0.5, y: window.innerHeight * 0.26 },
        { x: window.innerWidth * 0.25, y: window.innerHeight * 0.34 },
        { x: window.innerWidth * 0.75, y: window.innerHeight * 0.34 },
      ];

      positions.forEach((position, index) => {
        timers.push(
          window.setTimeout(() => {
            confetti({
              position,
              count: 120,
              size: 1.18,
              velocity: 260,
              fade: false,
            });
          }, index * burstDelayMs),
        );
      });
    }

    void celebrateCompletion();

    return () => {
      isMounted = false;

      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [celebrate]);

  return null;
}
