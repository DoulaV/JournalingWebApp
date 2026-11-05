"use client";

import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { reflectAction } from "./actions";

export function ReflectCard({
  t,
  enabled,
  hasEntries,
}: {
  t: Dict;
  enabled: boolean;
  hasEntries: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) return <p className="text-muted text-sm">{t.insights.reflectOff}</p>;
  if (!hasEntries) return <p className="text-muted text-sm">{t.insights.noEntriesWeek}</p>;

  return (
    <div className="border-border space-y-3 border-t pt-3">
      <p className="text-muted text-sm">{t.insights.reflectHint}</p>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const r = await reflectAction();
          setBusy(false);
          if (r.ok) setText(r.text);
          else setError(t.common.errorShort);
        }}
      >
        {busy ? t.insights.reflecting : t.insights.reflect}
      </Button>
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
      {text && (
        <div className="bg-surface-2 rounded-xl p-4" aria-live="polite">
          <h3 className="mb-2 font-medium">{t.insights.reflectionTitle}</h3>
          <div className="space-y-2 font-serif whitespace-pre-wrap" dir="auto">
            {text}
          </div>
          <p className="text-muted mt-3 text-xs">{t.insights.reflectionNote}</p>
        </div>
      )}
    </div>
  );
}
