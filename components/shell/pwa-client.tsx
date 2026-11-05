"use client";

import { useEffect, useState } from "react";
import { flushPending } from "@/lib/sync";
import type { Dict } from "@/lib/i18n";

/** Registers the service worker, syncs offline drafts, and shows a calm offline note. */
export function PwaClient({ t }: { t: Dict }) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }
    const update = () => setOffline(!navigator.onLine);
    const online = () => {
      update();
      void flushPending();
    };
    update();
    void flushPending();
    window.addEventListener("online", online);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      role="status"
      className="no-print bg-text text-bg fixed inset-x-3 bottom-20 z-50 rounded-2xl px-4 py-3 text-center text-sm md:start-auto md:end-4 md:bottom-4 md:max-w-sm"
    >
      {t.common.offline}
    </div>
  );
}
