import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron";
import { adminClient } from "@/lib/data/clients/server";
import { recomputeStreakFor } from "@/lib/data/streaks";

export const dynamic = "force-dynamic";

// Nightly: recompute every streak from history so missed days, freezes and
// resets are applied even when the app isn't opened.
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = adminClient();
  const { data: profiles, error } = await admin.from("profiles").select("user_id, timezone");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const now = new Date();
  let updated = 0;
  for (const p of profiles ?? []) {
    await recomputeStreakFor(admin, p.user_id, p.timezone, now);
    updated += 1;
  }
  return NextResponse.json({ ok: true, updated });
}
