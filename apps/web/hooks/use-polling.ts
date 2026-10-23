import { useEffect, useRef } from "react";

export function usePolling(fn: () => void, intervalMs: number) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    const pollIfVisible = () => {
      if (document.visibilityState === "visible") fnRef.current();
    };

    fnRef.current();
    const intervalId = setInterval(pollIfVisible, intervalMs);
    document.addEventListener("visibilitychange", pollIfVisible);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", pollIfVisible);
    };
  }, [intervalMs]);
}
