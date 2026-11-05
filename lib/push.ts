import "server-only";
import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./data/database.types";
import { publicEnv, serverEnv } from "./env";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

let configured = false;
function configure(): boolean {
  if (configured) return true;
  const env = serverEnv();
  if (!publicEnv.vapidPublicKey || !env.vapidPrivateKey) return false;
  webpush.setVapidDetails(env.vapidSubject, publicEnv.vapidPublicKey, env.vapidPrivateKey);
  configured = true;
  return true;
}

/**
 * Sends a notification to every device a user subscribed. Subscriptions the
 * push service reports as gone (404/410) are removed. Returns how many sends succeeded.
 */
export async function sendToUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  payload: PushPayload,
): Promise<number> {
  if (!configure()) return 0;
  const { data: subs } = await supabase.from("push_subscriptions").select("*").eq("user_id", userId);
  let ok = 0;
  for (const s of subs ?? []) {
    const keys = s.keys as { p256dh: string; auth: string };
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys }, JSON.stringify(payload), { TTL: 60 * 60 * 6, urgency: "normal" });
      ok += 1;
      await supabase.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", s.id);
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", s.id);
      } else {
        console.error("push failed", status);
      }
    }
  }
  return ok;
}
