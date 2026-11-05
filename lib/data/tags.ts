import "server-only";
import { serverClient } from "./clients/server";
import { requireUser } from "./auth";
import type { Tag } from "./types";

export async function listTags(): Promise<Tag[]> {
  await requireUser();
  const supabase = await serverClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, is_default, created_at")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((t) => ({ id: t.id, name: t.name, isDefault: t.is_default }));
}

export async function createTag(name: string): Promise<Tag> {
  const user = await requireUser();
  const supabase = await serverClient();
  const clean = name.trim().toLowerCase().slice(0, 40);
  if (!clean) throw new Error("Empty tag");
  const { data, error } = await supabase
    .from("tags")
    .upsert({ user_id: user.id, name: clean }, { onConflict: "user_id,name" })
    .select("id, name, is_default")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create tag");
  return { id: data.id, name: data.name, isDefault: data.is_default };
}

export async function deleteTag(id: string) {
  await requireUser();
  const supabase = await serverClient();
  await supabase.from("tags").delete().eq("id", id).eq("is_default", false);
}
