import { NextResponse } from "next/server";
import { getUnlockedUser } from "@/lib/data/auth";
import { serverClient } from "@/lib/data/clients/server";
import { buildExport } from "@/lib/data/export";
import { isDateStr } from "@/lib/dates";

export async function GET(req: Request) {
  const user = await getUnlockedUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const data = await buildExport(await serverClient(), user.id, {
    from: isDateStr(from) ? from : undefined,
    to: isDateStr(to) ? to : undefined,
  });
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="journal-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
