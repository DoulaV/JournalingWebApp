import type { Metadata } from "next";
import { getPrefs } from "@/lib/data/prefs";
import { getDict } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { lang } = await getPrefs();
  const t = getDict(lang);
  const errorText =
    error === "private" ? t.login.private : error === "expired" ? t.login.linkExpired : undefined;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-10">
        <div aria-hidden className="bg-accent-soft mb-6 size-12 rounded-2xl" />
        <h1 className="font-serif text-3xl font-semibold">{t.login.title}</h1>
        <p className="text-muted mt-2">{t.login.subtitle}</p>
      </div>
      {errorText && (
        <p role="alert" className="bg-surface-2 mb-4 rounded-xl p-3 text-sm">
          {errorText}
        </p>
      )}
      <LoginForm t={t.login} />
    </main>
  );
}
