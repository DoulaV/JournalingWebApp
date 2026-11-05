import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { serverClient } from "./clients/server";
import { isAllowedEmail } from "@/lib/env";

/** The signed-in owner, or null. Verified with the auth server, not just the cookie. */
export const getUser = cache(async () => {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user || !isAllowedEmail(user.email)) return null;
  return user;
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
