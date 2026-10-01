import { useCallback, useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export type SaveStatus = "saved" | "dirty" | "saving" | "local" | "error";

/** "local" means the value is safe on this device but still has to reach the server. */
export type SaveOutcome = "saved" | "local";

export function useAutosave(save: (value: string) => Promise<SaveOutcome>, delay = 800) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const pending = useRef<string | null>(null);
  const unsynced = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveRef = useRef(save);
  const online = useOnlineStatus();

  useEffect(() => {
    saveRef.current = save;
  });

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const value = pending.current ?? unsynced.current;
    if (value === null) return;
    pending.current = null;
    setStatus("saving");
    try {
      const outcome = await saveRef.current(value);
      unsynced.current = outcome === "local" ? value : null;
      if (pending.current !== null) setStatus("dirty");
      else setStatus(outcome === "local" ? "local" : "saved");
    } catch {
      pending.current ??= value;
      setStatus("error");
    }
  }, []);

  const schedule = useCallback(
    (value: string) => {
      pending.current = value;
      setStatus("dirty");
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [delay, flush],
  );

  useEffect(() => {
    if (online && unsynced.current !== null) void flush();
  }, [online, flush]);

  useEffect(
    () => () => {
      void flush();
    },
    [flush],
  );

  return { status, schedule, flush };
}
