"use client";

import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { createLetterAction } from "./actions";

export function LetterForm({
  t,
  minDate,
  defaultDate,
}: {
  t: Dict;
  minDate: string;
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="lg">
        {t.letters.write}
      </Button>
    );
  }

  return (
    <form
      className="border-border bg-surface space-y-3 rounded-2xl border p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await createLetterAction({ title, body, sealedUntil: date });
        setBusy(false);
        if (r.ok) {
          setOpen(false);
          setTitle("");
          setBody("");
          setMsg(null);
        } else setMsg(r.reason === "date" ? t.letters.mustBeFuture : t.common.errorShort);
      }}
    >
      <label className="block text-sm font-medium" htmlFor="letter-title">
        {t.letters.letterTitle}
      </label>
      <input
        id="letter-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        dir="auto"
        className="border-border bg-surface block min-h-11 w-full rounded-xl border px-3"
      />
      <label className="block text-sm font-medium" htmlFor="letter-body">
        {t.letters.body}
      </label>
      <textarea
        id="letter-body"
        required
        rows={8}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t.letters.bodyPlaceholder}
        dir="auto"
        className="entry-prose border-border bg-surface block w-full rounded-xl border p-3"
      />
      <label className="block text-sm font-medium" htmlFor="letter-date">
        {t.letters.openOn}
      </label>
      <input
        id="letter-date"
        type="date"
        min={minDate}
        required
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border-border bg-surface block min-h-11 rounded-xl border px-3"
      />
      {msg && (
        <p role="alert" className="text-danger text-sm">
          {msg}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy || !body.trim()}>
          {t.letters.seal}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          {t.common.cancel}
        </Button>
      </div>
    </form>
  );
}
