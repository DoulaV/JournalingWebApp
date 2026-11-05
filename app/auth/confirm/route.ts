import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "@/lib/data/clients/server";
import { isAllowedEmail } from "@/lib/env";

// Magic link landing. Works with both email templates:
// - the custom template links here with ?token_hash=...&type=email
// - Supabase's default template goes through Supabase first and comes back
//   here with ?code=... (PKCE), which only works in the browser that asked
//   for the link.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  const supabase = await serverClient();

  let email: string | undefined;
  let ok = false;
  if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
    email = data.user?.email;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    email = data.user?.email;
  }

  if (ok && isAllowedEmail(email)) {
    return NextResponse.redirect(new URL("/today", origin));
  }
  if (ok) await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login?error=expired", origin));
}
