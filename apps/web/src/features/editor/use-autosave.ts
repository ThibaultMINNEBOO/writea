import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "saved" | "dirty" | "saving" | "error";

export function useAutosave(save: (value: string) => Promise<unknown>, delay = 800) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  });

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const value = pending.current;
    if (value === null) return;
    pending.current = null;
    setStatus("saving");
    try {
      await saveRef.current(value);
      setStatus(pending.current === null ? "saved" : "dirty");
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
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pending.current === null) return;
      void flush();
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      void flush();
    };
  }, [flush]);

  return { status, schedule, flush };
}
