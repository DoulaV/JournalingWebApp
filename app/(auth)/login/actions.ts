"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isValidSignInCode } from "@/lib/device-code";
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
    console.error("magic link failed", error.status, error.code, error.message);
    const limited =
      error.status === 429 ||
      /rate limit/i.test(error.message) ||
      error.code === "over_email_send_rate_limit";
    return { status: "error", message: limited ? "rateLimited" : "failed" };
  }
  return { status: "sent" };
}

export type CodeState = { status: "idle" | "error"; message?: string };

/** Sign in this browser with a short code shown on a device that is already signed in. */
export async function signInWithCode(_prev: CodeState, formData: FormData): Promise<CodeState> {
  const code = String(formData.get("code") ?? "");
  if (!isValidSignInCode(code)) {
    await new Promise((r) => setTimeout(r, 600));
    return { status: "error", message: "badCode" };
  }
  const email = serverEnv().allowedEmail;
  const admin = adminClient();
  await admin.rpc("sync_allowed_email", { p_email: email });
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) {
    console.error("code sign-in failed", error?.message);
    return { status: "error", message: "failed" };
  }
  const supabase = await serverClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: data.properties.hashed_token,
  });
  if (verifyError) {
    console.error("code sign-in verify failed", verifyError.message);
    return { status: "error", message: "failed" };
  }
  redirect("/today");
}
