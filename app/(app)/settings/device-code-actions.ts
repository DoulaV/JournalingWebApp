"use server";

import { requireUser } from "@/lib/data/auth";
import { currentSignInCode, formatCode } from "@/lib/device-code";

/** Only for the signed-in, unlocked owner. */
export async function showSignInCodeAction(): Promise<string> {
  await requireUser();
  return formatCode(currentSignInCode());
}
