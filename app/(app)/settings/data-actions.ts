"use server";

import { requireUser } from "@/lib/data/auth";
import { adminClient } from "@/lib/data/clients/server";
import { writeBackup } from "@/lib/data/export";

export async function backupNowAction(): Promise<{ ok: boolean }> {
  const user = await requireUser();
  try {
    await writeBackup(adminClient(), user.id);
    return { ok: true };
  } catch (e) {
    console.error("backup failed", e);
    return { ok: false };
  }
}
