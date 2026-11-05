import { NextResponse } from "next/server";
import { zipSync, strToU8 } from "fflate";
import { getUnlockedUser } from "@/lib/data/auth";
import { serverClient } from "@/lib/data/clients/server";
import { buildExport } from "@/lib/data/export";
import { entryToMarkdown } from "@/lib/export-format";
import { isDateStr } from "@/lib/dates";

export const maxDuration = 60;

// One Markdown file per entry, attachments alongside, all in one zip.
export async function GET(req: Request) {
  const user = await getUnlockedUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const supabase = await serverClient();
  const data = await buildExport(supabase, user.id, {
    from: isDateStr(from) ? from : undefined,
    to: isDateStr(to) ? to : undefined,
  });
  const tagNames = new Map(data.tags.map((t) => [t.id, t.name]));
  const files: Record<string, Uint8Array> = {};

  for (const e of data.entries) {
    const names: string[] = [];
    for (const [i, a] of e.attachments.entries()) {
      const ext = a.storage_path.split(".").pop() ?? "bin";
      const name = `attachments/${e.entry_date}-${i + 1}.${ext}`;
      const { data: blob } = await supabase.storage.from("attachments").download(a.storage_path);
      if (blob) {
        files[name] = new Uint8Array(await blob.arrayBuffer());
        names.push(`../${name}`);
      }
    }
    files[`entries/${e.entry_date}.md`] = strToU8(entryToMarkdown(e, tagNames, names));
  }
  files["journal.json"] = strToU8(JSON.stringify(data, null, 2));
  files["README.md"] = strToU8(
    "# Journal export\n\nOne Markdown file per day in `entries/`, photos and voice notes in `attachments/`, and everything as JSON in `journal.json`.\n",
  );

  const zip = zipSync(files, { level: 6 });
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(Buffer.from(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="journal-${stamp}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
