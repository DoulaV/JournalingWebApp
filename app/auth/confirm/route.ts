import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "@/lib/data/clients/server";
import { isAllowedEmail } from "@/lib/env";

// Magic link landing. The email template links here with a token hash, which is
// verified server-side to create the session cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;

  if (tokenHash) {
    const supabase = await serverClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error && isAllowedEmail(data.user?.email)) {
      return NextResponse.redirect(new URL("/today", origin));
    }
    if (!error) await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/login?error=expired", origin));
}
