"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { adminClient, serverClient } from "@/lib/data/clients/server";
import { isAllowedEmail, publicEnv, serverEnv } from "@/lib/env";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string };

const schema = z.object({ email: z.email() });

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: String(formData.get("email") ?? "").trim() });
  if (!parsed.success) return { status: "error", message: "invalid" };
  const email = parsed.data.email.toLowerCase();

  // Same response either way, so the form doesn't reveal which email is allowed.
  if (!isAllowedEmail(email)) return { status: "sent" };

  // Keep the database allow-list in sync with ALLOWED_EMAIL.
  await adminClient().rpc("sync_allowed_email", { p_email: serverEnv().allowedEmail });

  const h = await headers();
  const origin = publicEnv.siteUrl || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm`, shouldCreateUser: true },
  });
  if (error) {
    console.error("magic link failed", error.message);
    return { status: "error", message: "failed" };
  }
  return { status: "sent" };
}
