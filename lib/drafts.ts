"use client";

// Offline-first drafts. Every keystroke lands in IndexedDB first, then syncs to
// the server. If the server is unreachable the draft stays pending and is
// flushed when the browser comes back online. Text is never dropped.

import { createStore, del, entries as idbEntries, get, set } from "idb-keyval";
import type { EmotionInput, Ritual } from "@/lib/data/types";

export interface Draft {
  date: string;
  title?: string;
  body?: unknown;
  bodyText?: string;
  emotions?: EmotionInput[];
  moodValence?: number | null;
  tagIds?: string[];
  ritual?: Ritual;
  promptId?: string | null;
  /** When this draft was first started (ms). Lets a late sync count for the right day. */
  createdAt: number;
  updatedAt: number;
  synced: boolean;
}

let store: ReturnType<typeof createStore> | null = null;
function db() {
  if (typeof indexedDB === "undefined") return null;
  store ??= createStore("journal-drafts", "drafts");
  return store;
}

export async function getDraft(date: string): Promise<Draft | undefined> {
  const s = db();
  if (!s) return undefined;
  try {
    return await get<Draft>(date, s);
  } catch {
    return undefined;
  }
}

export async function putDraft(date: string, patch: Partial<Draft>): Promise<Draft> {
  const s = db();
  const prev = s ? await getDraft(date) : undefined;
  const now = Date.now();
  const next: Draft = {
    ...prev,
    ...patch,
    date,
    createdAt: prev?.createdAt ?? patch.createdAt ?? now,
    updatedAt: now,
    synced: false,
  };
  if (s) await set(date, next, s);
  return next;
}

export async function markSynced(date: string, updatedAt: number) {
  const s = db();
  if (!s) return;
  const cur = await getDraft(date);
  // Only mark synced if nothing changed while the request was in flight.
  // Metadata (feelings, tags) is dropped once persisted so later text-only syncs
  // never overwrite changes made elsewhere.
  if (cur && cur.updatedAt === updatedAt) {
    const { emotions: _e, moodValence: _m, tagIds: _t, ritual: _r, promptId: _p, ...rest } = cur;
    void _e; void _m; void _t; void _r; void _p;
    await set(date, { ...rest, synced: true }, s);
  }
}

export async function removeDraft(date: string) {
  const s = db();
  if (s) await del(date, s);
}

export async function pendingDrafts(): Promise<Draft[]> {
  const s = db();
  if (!s) return [];
  const all = await idbEntries<string, Draft>(s);
  return all.map(([, d]) => d).filter((d) => !d.synced);
}
