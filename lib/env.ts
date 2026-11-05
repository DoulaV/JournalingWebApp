// Central access to environment variables. Server-only values must never be
// imported into client components; they have no NEXT_PUBLIC_ prefix so Next.js
// will not inline them into the browser bundle anyway.

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
};

export function serverEnv() {
  return {
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    allowedEmail: (process.env.ALLOWED_EMAIL ?? "").trim().toLowerCase(),
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
    vapidSubject: process.env.VAPID_SUBJECT || "mailto:journal@example.com",
    cronSecret: process.env.CRON_SECRET ?? "",
    openaiApiKey: process.env.OPENAI_API_KEY ?? "",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  };
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  const allowed = serverEnv().allowedEmail;
  return Boolean(allowed) && (email ?? "").trim().toLowerCase() === allowed;
}

export const features = {
  transcriptionAvailable: () => Boolean(serverEnv().openaiApiKey),
  aiReflectionAvailable: () => Boolean(serverEnv().anthropicApiKey),
  pushAvailable: () => Boolean(publicEnv.vapidPublicKey && serverEnv().vapidPrivateKey),
};
