"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDraft, putDraft, type Draft } from "@/lib/drafts";
import { syncDraft } from "@/lib/sync";

export type SaveStatus = "idle" | "saving" | "saved" | "offline" | "error";

const IDLE_MS = 3000;

/** Debounced autosave: local draft immediately, server after 3 seconds idle, and on blur. */
export function useAutosave(date: string, onSaved?: (r: Extract<Awaited<ReturnType<typeof syncDraft>>, { ok: true }>) => void) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedCb = useRef(onSaved);
  useEffect(() => {
    savedCb.current = onSaved;
  }, [onSaved]);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const d = await getDraft(date);
    if (!d || d.synced) return;
    setStatus("saving");
    const r = await syncDraft(d);
    if (r.ok) {
      setStatus("saved");
      savedCb.current?.(r);
    } else setStatus(r.reason === "offline" ? "offline" : "error");
  }, [date]);

  const queue = useCallback(
    async (patch: Partial<Draft>, opts: { immediate?: boolean } = {}) => {
      await putDraft(date, patch);
      if (timer.current) clearTimeout(timer.current);
      if (opts.immediate) await flush();
      else timer.current = setTimeout(flush, IDLE_MS);
    },
    [date, flush],
  );

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const onOnline = () => void flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("online", onOnline);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flush]);

  return { status, queue, flush };
}
