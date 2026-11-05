import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "@/lib/data/clients/server";

export async function POST(request: NextRequest) {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.nextUrl.origin), { status: 303 });
}
