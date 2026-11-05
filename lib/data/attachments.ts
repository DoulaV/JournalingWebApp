import "server-only";
import { serverClient } from "./clients/server";
import { requireUser } from "./auth";
import { getProfileRow } from "./profile";
import type { Attachment, Entry } from "./types";
import { features, serverEnv } from "@/lib/env";

const BUCKET = "attachments";
const URL_TTL = 60 * 60; // 1 hour

export async function signAttachments<T extends Pick<Entry, "attachments">>(entries: T[]): Promise<T[]> {
  const all = entries.flatMap((e) => e.attachments);
  if (!all.length) return entries;
  const supabase = await serverClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(all.map((a) => a.storagePath), URL_TTL);
  const urls = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return entries.map((e) => ({
    ...e,
    attachments: e.attachments.map((a) => ({ ...a, url: urls.get(a.storagePath) ?? undefined })),
  }));
}

export async function addAttachment(input: {
  date: string;
  kind: "photo" | "audio";
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number | null;
}): Promise<Attachment | null> {
  const user = await requireUser();
  if (!input.storagePath.startsWith(`${user.id}/`)) throw new Error("Bad path");
  const supabase = await serverClient();
  const { data: entry } = await supabase.from("entries").select("id").eq("entry_date", input.date).maybeSingle();
  if (!entry) return null;
  const { data, error } = await supabase
    .from("attachments")
    .insert({
      user_id: user.id,
      entry_id: entry.id,
      kind: input.kind,
      storage_path: input.storagePath,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      duration_seconds: input.durationSeconds ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "insert failed");
  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(data.storage_path, URL_TTL);
  return {
    id: data.id,
    kind: data.kind as Attachment["kind"],
    storagePath: data.storage_path,
    mimeType: data.mime_type,
    transcript: null,
    durationSeconds: data.duration_seconds,
    url: signed?.signedUrl,
  };
}

export async function removeAttachment(id: string) {
  await requireUser();
  const supabase = await serverClient();
  const { data } = await supabase.from("attachments").select("storage_path").eq("id", id).maybeSingle();
  if (!data) return;
  await supabase.storage.from(BUCKET).remove([data.storage_path]);
  await supabase.from("attachments").delete().eq("id", id);
}

/** Transcribe an audio attachment with OpenAI Whisper, if enabled. Returns the transcript or null. */
export async function transcribeAttachment(id: string): Promise<string | null> {
  await requireUser();
  const profile = await getProfileRow();
  if (!profile.transcription_enabled || !features.transcriptionAvailable()) return null;
  const supabase = await serverClient();
  const { data: att } = await supabase.from("attachments").select("*").eq("id", id).maybeSingle();
  if (!att || att.kind !== "audio") return null;
  const { data: file } = await supabase.storage.from(BUCKET).download(att.storage_path);
  if (!file) return null;

  const form = new FormData();
  const ext = (att.mime_type ?? "audio/webm").includes("mp4") ? "m4a" : "webm";
  form.append("file", new File([file], `voice.${ext}`, { type: att.mime_type ?? "audio/webm" }));
  form.append("model", "whisper-1");
  form.append("language", profile.language);
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${serverEnv().openaiApiKey}` },
    body: form,
  });
  if (!res.ok) {
    console.error("whisper failed", res.status);
    return null;
  }
  const json = (await res.json()) as { text?: string };
  const text = (json.text ?? "").trim();
  if (text) await supabase.from("attachments").update({ transcript: text }).eq("id", id);
  return text || null;
}
