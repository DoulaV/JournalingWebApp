"use server";

import { z } from "zod";
import { requireUser } from "@/lib/data/auth";
import { serverClient } from "@/lib/data/clients/server";
import { getProfileRow } from "@/lib/data/profile";
import { sendToUser } from "@/lib/push";
import { getDict } from "@/lib/i18n";

const subSchema = z.object({
  endpoint: z.url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export async function subscribePushAction(sub: unknown, deviceLabel: string) {
  const user = await requireUser();
  const parsed = subSchema.parse(sub);
  const supabase = await serverClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.endpoint,
      keys: parsed.keys,
      device_label: deviceLabel.slice(0, 80),
    },
    { onConflict: "endpoint" },
  );
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function unsubscribePushAction(endpoint: string) {
  await requireUser();
  const supabase = await serverClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

export async function testPushAction() {
  const user = await requireUser();
  const profile = await getProfileRow();
  const t = getDict(profile.language === "ar" ? "ar" : "en");
  const supabase = await serverClient();
  const sent = await sendToUser(supabase, user.id, {
    title: t.appName,
    body: t.notifications.test,
    url: "/today",
    tag: "test",
  });
  return { sent };
}
