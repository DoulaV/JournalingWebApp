"use client";

import { useEffect, useRef, useState } from "react";
import type { Attachment } from "@/lib/data/types";
import type { Dict } from "@/lib/i18n";
import { compressImage } from "@/lib/image";
import {
  addAttachmentAction,
  removeAttachmentAction,
  transcribeAction,
} from "@/app/(app)/attachment-actions";

interface Props {
  date: string;
  entryId: string | null;
  initial: Attachment[];
  t: Dict;
  onEntryId?: (id: string) => void;
  onTranscript?: (text: string) => void;
}

function pickAudioType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export function AttachmentBar({ date, initial, t, onTranscript }: Props) {
  const [items, setItems] = useState<Attachment[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const started = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => recorder.current?.stream.getTracks().forEach((tr) => tr.stop()), []);

  async function upload(blob: Blob, kind: "photo" | "audio", mimeType: string, duration?: number) {
    setError(null);
    setBusy(t.attachments.uploading);
    try {
      // Loaded on demand so the Supabase client isn't part of the first page load.
      const { browserClient } = await import("@/lib/data/clients/browser");
      const supabase = browserClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("signed out");
      const ext =
        kind === "photo"
          ? "jpg"
          : mimeType.includes("mp4")
            ? "m4a"
            : mimeType.includes("ogg")
              ? "ogg"
              : "webm";
      const path = `${data.user.id}/${date}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("attachments")
        .upload(path, blob, { contentType: mimeType });
      if (upErr) throw upErr;
      const att = await addAttachmentAction({
        date,
        kind,
        storagePath: path,
        mimeType,
        sizeBytes: blob.size,
        durationSeconds: duration ?? null,
      });
      if (!att) {
        await supabase.storage.from("attachments").remove([path]);
        setError(t.attachments.saveFirst);
        return;
      }
      setItems((xs) => [...xs, att]);
      if (kind === "audio") {
        setBusy(t.attachments.transcribing);
        const text = await transcribeAction(att.id);
        if (text) {
          setItems((xs) => xs.map((x) => (x.id === att.id ? { ...x, transcript: text } : x)));
          onTranscript?.(text);
        }
      }
    } catch {
      setError(t.common.errorShort);
    } finally {
      setBusy(null);
    }
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const blob = await compressImage(file).catch(() => file);
    await upload(blob, "photo", blob.type || "image/jpeg");
  }

  async function toggleRecording() {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickAudioType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        setRecording(false);
        const type = rec.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunks, { type });
        const seconds = Math.round((Date.now() - started.current) / 1000);
        if (blob.size) void upload(blob, "audio", type.split(";")[0], seconds);
      };
      recorder.current = rec;
      started.current = Date.now();
      rec.start();
      setRecording(true);
    } catch {
      setError(t.attachments.micDenied);
    }
  }

  async function remove(id: string) {
    setItems((xs) => xs.filter((x) => x.id !== id));
    await removeAttachmentAction(id);
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="border-border min-h-10 rounded-full border px-3 text-sm"
          disabled={Boolean(busy)}
        >
          {t.attachments.photo}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPhoto}
          aria-label={t.attachments.photo}
        />
        <button
          type="button"
          onClick={toggleRecording}
          aria-pressed={recording}
          className={`min-h-10 rounded-full border px-3 text-sm ${recording ? "border-danger text-danger" : "border-border"}`}
          disabled={Boolean(busy) && !recording}
        >
          {recording ? `● ${t.attachments.stop}` : t.attachments.voice}
        </button>
        {busy && (
          <span role="status" className="text-muted text-sm">
            {busy}
          </span>
        )}
        {error && (
          <span role="alert" className="text-danger text-sm">
            {error}
          </span>
        )}
      </div>
      {items.length > 0 && <AttachmentList items={items} t={t} onRemove={remove} />}
    </div>
  );
}

export function AttachmentList({
  items,
  t,
  onRemove,
}: {
  items: Attachment[];
  t: Dict;
  onRemove?: (id: string) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-3">
      {items.map((a) => (
        <li key={a.id} className="relative">
          {a.kind === "photo" ? (
            a.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.url}
                alt={t.attachments.photoAlt}
                className="h-24 w-24 rounded-xl object-cover"
                loading="lazy"
              />
            ) : (
              <span className="bg-surface-2 block h-24 w-24 rounded-xl" />
            )
          ) : (
            <div className="bg-surface-2 max-w-xs rounded-xl p-2">
              {a.url && <audio controls preload="none" src={a.url} className="h-10 max-w-full" />}
              {a.transcript && (
                <p className="text-muted mt-1 line-clamp-2 text-xs" dir="auto">
                  {a.transcript}
                </p>
              )}
            </div>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(a.id)}
              aria-label={t.attachments.remove}
              className="border-border bg-surface absolute -end-2 -top-2 flex size-8 items-center justify-center rounded-full border text-xs"
            >
              ✕
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
