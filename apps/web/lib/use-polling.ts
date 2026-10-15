import { useEffect, useRef } from "react";

export function usePolling(fn: () => void, intervalMs: number) {
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") fnRef.current();
    };
    fnRef.current();
    const intervalId = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [intervalMs]);
}
