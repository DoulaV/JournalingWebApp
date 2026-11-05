import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getUser } from "./auth";
import { serverClient } from "./clients/server";
import type { Lang } from "@/lib/emotions";

export interface Prefs {
  lang: Lang;
  theme: "system" | "light" | "dark";
  palette: string;
  fontSize: number;
}

/** Display preferences for the current viewer. Never redirects (used by the root layout). */
export const getPrefs = cache(async (): Promise<Prefs> => {
  const fallbackLang = (await cookies()).get("lang")?.value === "ar" ? "ar" : "en";
  const defaults: Prefs = { lang: fallbackLang, theme: "system", palette: "calm", fontSize: 19 };
  const user = await getUser();
  if (!user) return defaults;
  const supabase = await serverClient();
  const { data } = await supabase
    .from("profiles")
    .select("language, theme, palette, font_size")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return defaults;
  return {
    lang: data.language === "ar" ? "ar" : "en",
    theme: (data.theme as Prefs["theme"]) ?? "system",
    palette: data.palette,
    fontSize: data.font_size,
  };
});
