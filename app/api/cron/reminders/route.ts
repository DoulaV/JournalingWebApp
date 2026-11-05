import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron";
import { adminClient } from "@/lib/data/clients/server";
import { decideNotification, pickCopy } from "@/lib/reminders";
import { localDate } from "@/lib/dates";
import { sendToUser } from "@/lib/push";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Runs every 15 minutes. Sends at most one notification per user per run.
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = adminClient();
  const now = new Date();
  const { data: profiles, error } = await admin.from("profiles").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { user: string; kind: string | null; sent: number }[] = [];
  for (const p of profiles ?? []) {
    const today = localDate(now, p.timezone);
    const [{ count: wrote }, { data: letters }] = await Promise.all([
      admin.from("entries").select("id", { count: "exact", head: true }).eq("user_id", p.user_id).eq("entry_date", today),
      admin
        .from("future_letters")
        .select("id")
        .eq("user_id", p.user_id)
        .lte("sealed_until", today)
        .is("notified_at", null)
        .limit(5),
    ]);

    const decision = decideNotification({
      now,
      settings: {
        timeZone: p.timezone,
        remindersEnabled: p.reminders_enabled,
        reminderTime: p.reminder_time.slice(0, 5),
        nudgeEnabled: p.nudge_enabled,
        nudgeTime: p.nudge_time.slice(0, 5),
        morningReminderEnabled: p.morning_reminder_enabled,
        morningReminderTime: p.morning_reminder_time.slice(0, 5),
      },
      sent: { sentOn: p.notifications_sent_on, sentCount: p.notifications_sent_count, sentKinds: p.notifications_sent_kinds },
      wroteToday: (wrote ?? 0) > 0,
      letterReady: (letters ?? []).length > 0,
    });
    if (!decision) {
      results.push({ user: p.user_id, kind: null, sent: 0 });
      continue;
    }

    const t = getDict(p.language === "ar" ? "ar" : "en");
    const n = t.notifications;
    const anchor = p.reminder_anchor?.trim();
    const body =
      decision.kind === "letter"
        ? n.letter
        : decision.kind === "morning"
          ? pickCopy(n.morning, today)
          : decision.kind === "nudge"
            ? pickCopy(n.nudges, today)
            : `${pickCopy(n.reminders, today)}${anchor ? ` (${anchor})` : ""}`;

    const sent = await sendToUser(admin, p.user_id, {
      title: t.appName,
      body,
      url: decision.kind === "letter" ? "/letters" : "/today",
      tag: `journal-${decision.kind}`,
    });

    if (sent > 0) {
      await admin
        .from("profiles")
        .update({
          notifications_sent_on: decision.nextSent.sentOn,
          notifications_sent_count: decision.nextSent.sentCount,
          notifications_sent_kinds: decision.nextSent.sentKinds,
        })
        .eq("user_id", p.user_id);
      if (decision.kind === "letter") {
        await admin
          .from("future_letters")
          .update({ notified_at: now.toISOString() })
          .in(
            "id",
            (letters ?? []).map((l) => l.id),
          );
      }
    }
    results.push({ user: p.user_id, kind: decision.kind, sent });
  }
  return NextResponse.json({ ok: true, ranAt: now.toISOString(), results: results.map(({ kind, sent }) => ({ kind, sent })) });
}
