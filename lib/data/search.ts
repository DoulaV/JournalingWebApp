import "server-only";
import { serverClient } from "./clients/server";
import { requireUser } from "./auth";
import { getEntriesByDates } from "./entries";
import type { Entry } from "./types";
import { isCoreId } from "@/lib/emotions";
import { isDateStr } from "@/lib/dates";

export interface SearchFilters {
  q?: string;
  tag?: string;
  core?: string;
  from?: string;
  to?: string;
  photo?: boolean;
  audio?: boolean;
}

const UUID = /^[0-9a-f-]{36}$/i;

export async function searchEntries(f: SearchFilters): Promise<Entry[]> {
  await requireUser();
  const supabase = await serverClient();
  const { data, error } = await supabase.rpc("search_entries", {
    p_query: f.q?.trim().slice(0, 200) || undefined,
    p_tag: f.tag && UUID.test(f.tag) ? f.tag : undefined,
    p_core: f.core && isCoreId(f.core) ? f.core : undefined,
    p_from: f.from && isDateStr(f.from) ? f.from : undefined,
    p_to: f.to && isDateStr(f.to) ? f.to : undefined,
    p_has_photo: Boolean(f.photo),
    p_has_audio: Boolean(f.audio),
    p_limit: 100,
  });
  if (error) throw new Error(error.message);
  const dates = (data ?? []).map((r) => r.entry_date);
  const full = await getEntriesByDates(dates);
  return full.sort((a, b) => (a.date < b.date ? 1 : -1));
}
