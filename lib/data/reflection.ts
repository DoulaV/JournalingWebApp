import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "./auth";
import { getProfileRow } from "./profile";
import { entriesInRange } from "./entries";
import { serverClient } from "./clients/server";
import { features, serverEnv } from "@/lib/env";
import { localDate, startOfWeek } from "@/lib/dates";
import { breadcrumb } from "@/lib/emotions";

// Optional AI weekly reflection. Off by default, runs only when the user taps
// "Reflect on my week", and only if they enabled it in Settings. This is the
// only place entry text leaves for an AI service.

const SYSTEM = `You help one person reflect on their own private journal from the past week.
Write a short, gentle reflection in the same language the entries are mostly written in (Arabic or English).
Offer 2 or 3 themes you notice, each in one or two sentences, then 3 open questions they might sit with.
Stay curious and warm. Do not diagnose, label conditions, or give clinical or medical advice, and do not tell them what to do.
If something in the entries suggests they may be unsafe, gently mention that talking to someone they trust or a professional can help.
Use plain text with short headings. Never use em dashes.`;

export type ReflectionResult =
  { ok: true; text: string } | { ok: false; reason: "disabled" | "empty" | "declined" | "error" };

export async function reflectOnWeek(): Promise<ReflectionResult> {
  const user = await requireUser();
  const profile = await getProfileRow();
  if (!profile.ai_reflection_enabled || !features.aiReflectionAvailable())
    return { ok: false, reason: "disabled" };

  const today = localDate(new Date(), profile.timezone);
  const weekStart = startOfWeek(today);
  const entries = await entriesInRange(weekStart, today);
  if (entries.length === 0) return { ok: false, reason: "empty" };

  const lang = profile.language === "ar" ? "ar" : "en";
  const journal = entries
    .map((e) => {
      const feelings = e.emotions
        .map((em) => `${breadcrumb(em, lang).join(" > ")} (${em.intensity}/5)`)
        .join(", ");
      return `## ${e.date}\nFeelings: ${feelings || "not named"}\n${e.title ? `${e.title}\n` : ""}${e.bodyText}`;
    })
    .join("\n\n");

  const client = new Anthropic({ apiKey: serverEnv().anthropicApiKey });
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [
        { role: "user", content: `Here are my journal entries from this week:\n\n${journal}` },
      ],
    });
    if (response.stop_reason === "refusal") return { ok: false, reason: "declined" };
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .replaceAll(String.fromCharCode(0x2014), ", ")
      .trim();
    if (!text) return { ok: false, reason: "error" };

    const supabase = await serverClient();
    await supabase
      .from("ai_reflections")
      .insert({ user_id: user.id, week_start: weekStart, content: text });
    return { ok: true, text };
  } catch (e) {
    if (e instanceof Anthropic.APIError) console.error("reflection failed", e.status);
    else console.error("reflection failed");
    return { ok: false, reason: "error" };
  }
}
