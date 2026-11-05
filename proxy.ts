import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth", "/api/cron", "/offline"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const USER_ID_HEADER = "x-journal-user-id";
export const USER_EMAIL_HEADER = "x-journal-user-email";

export async function proxy(request: NextRequest) {
  // Never trust these from the client; only this proxy sets them after verifying the session.
  request.headers.delete(USER_ID_HEADER);
  request.headers.delete(USER_EMAIL_HEADER);
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refreshes the session if needed. Do not put code between client creation and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const allowed = (process.env.ALLOWED_EMAIL ?? "").trim().toLowerCase();

  if (user && (!allowed || user.email?.toLowerCase() !== allowed)) {
    // A session for anyone other than the journal owner is never accepted.
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?error=private";
    return NextResponse.redirect(url);
  }

  if (!user && !isPublic(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/today";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user) {
    // Pass the verified user to pages so they don't ask the auth server again.
    // Data access still uses the session cookie, so Row Level Security applies regardless.
    const headers = new Headers(request.headers);
    headers.set(USER_ID_HEADER, user.id);
    headers.set(USER_EMAIL_HEADER, user.email ?? "");
    const next = NextResponse.next({ request: { headers } });
    for (const c of response.cookies.getAll()) next.cookies.set(c);
    return next;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|sw.js|icons/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|woff2?)$).*)",
  ],
};
