import { getDict } from "@/lib/i18n";
import { getPrefs } from "@/lib/data/prefs";

export const metadata = { title: "Offline" };

export default async function OfflinePage() {
  const { lang } = await getPrefs();
  const t = getDict(lang);
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 text-center">
      <div aria-hidden className="mx-auto mb-6 size-12 rounded-2xl bg-accent-soft" />
      <h1 className="font-serif text-2xl font-semibold">{t.offlinePage.title}</h1>
      <p className="mt-3 text-muted">{t.offlinePage.body}</p>
    </main>
  );
}
