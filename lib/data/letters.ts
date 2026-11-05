import "server-only";
import { serverClient } from "./clients/server";
import { requireUser } from "./auth";

export interface LetterOverview {
  id: string;
  title: string;
  sealedUntil: string;
  openedAt: string | null;
  createdAt: string;
  isOpen: boolean;
}

export async function lettersOverview(): Promise<LetterOverview[]> {
  await requireUser();
  const supabase = await serverClient();
  const { data, error } = await supabase.rpc("letters_overview");
  if (error) throw new Error(error.message);
  return (data ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    sealedUntil: l.sealed_until,
    openedAt: l.opened_at,
    createdAt: l.created_at,
    isOpen: l.is_open,
  }));
}

/** Letters whose date has come but haven't been opened yet. */
export async function readyLetterCount(): Promise<number> {
  const list = await lettersOverview();
  return list.filter((l) => l.isOpen && !l.openedAt).length;
}

/** Only works once the open date has arrived (enforced by RLS). */
export async function openLetter(id: string) {
  await requireUser();
  const supabase = await serverClient();
  const { data } = await supabase.from("future_letters").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  if (!data.opened_at) {
    await supabase
      .from("future_letters")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", id);
  }
  return {
    id: data.id,
    title: data.title,
    body: data.body,
    sealedUntil: data.sealed_until,
    createdAt: data.created_at,
  };
}

export async function createLetter(input: { title: string; body: string; sealedUntil: string }) {
  const user = await requireUser();
  const supabase = await serverClient();
  const { error } = await supabase.from("future_letters").insert({
    user_id: user.id,
    title: input.title.slice(0, 200),
    body: input.body.slice(0, 50_000),
    sealed_until: input.sealedUntil,
  });
  if (error) throw new Error(error.message);
}

export async function deleteLetter(id: string) {
  await requireUser();
  const supabase = await serverClient();
  await supabase.from("future_letters").delete().eq("id", id);
}
