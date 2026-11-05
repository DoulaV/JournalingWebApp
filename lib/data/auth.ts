import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { serverClient } from "./clients/server";
import { isAllowedEmail } from "@/lib/env";
import { isUnlocked } from "@/lib/pin";

/** The signed-in owner, or null. Verified with the auth server, not just the cookie. */
export const getUser = cache(async () => {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user || !isAllowedEmail(user.email)) return null;
  return user;
});

/** True when a PIN is set and this browser has no valid unlock session. */
export const isLocked = cache(async (userId: string): Promise<boolean> => {
  const supabase = await serverClient();
  const { data } = await supabase
    .from("profiles")
    .select("pin_hash")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.pin_hash) return false;
  return !(await isUnlocked());
});

/** Signed-in owner, even while the PIN lock is active. Only for the lock screen itself. */
export async function requireUserAllowLocked() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Signed-in owner with the journal unlocked. Every page, server action and data
 * read goes through this, so a locked journal never returns entry content
 * (pages render in parallel with layouts, so a layout check alone isn't enough).
 */
export async function requireUser() {
  const user = await requireUserAllowLocked();
  if (await isLocked(user.id)) redirect("/lock");
  return user;
}

/** For route handlers: the unlocked owner or null. */
export async function getUnlockedUser() {
  const user = await getUser();
  if (!user || (await isLocked(user.id))) return null;
  return user;
}
