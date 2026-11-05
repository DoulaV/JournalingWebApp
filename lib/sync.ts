"use client";

import { saveEntryAction, type SaveResult } from "@/app/(app)/actions";
import { markSynced, pendingDrafts, type Draft } from "@/lib/drafts";

export type SyncOutcome = SaveResult | { ok: false; reason: "offline" };

/** Push one draft to the server. Network failures leave it pending. */
export async function syncDraft(d: Draft): Promise<SyncOutcome> {
  if (typeof navigator !== "undefined" && !navigator.onLine)
    return { ok: false, reason: "offline" };
  try {
    const res = await saveEntryAction({
      date: d.date,
      title: d.title,
      body: d.body,
      bodyText: d.bodyText ?? "",
      emotions: d.emotions,
      moodValence: d.moodValence,
      tagIds: d.tagIds,
      ritual: d.ritual,
      promptId: d.promptId,
      clientCreatedAt: d.createdAt,
    });
    if (res.ok) await markSynced(d.date, d.updatedAt);
    return res;
  } catch {
    return { ok: false, reason: "offline" };
  }
}

let flushing = false;
export async function flushPending(): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  let n = 0;
  try {
    for (const d of await pendingDrafts()) {
      const r = await syncDraft(d);
      if (r.ok) n += 1;
      else if (r.reason === "offline") break;
    }
  } finally {
    flushing = false;
  }
  return n;
}
