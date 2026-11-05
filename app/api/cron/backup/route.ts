import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron";
import { adminClient } from "@/lib/data/clients/server";
import { writeBackup } from "@/lib/data/export";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Weekly: JSON backup of each journal into the private "backups" bucket, newest 8 kept.
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = adminClient();
  const { data: profiles, error } = await admin.from("profiles").select("user_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const paths: string[] = [];
  for (const p of profiles ?? []) paths.push(await writeBackup(admin, p.user_id));
  return NextResponse.json({ ok: true, backups: paths.length });
}
