import Link from "next/link";
import { getPrefs } from "@/lib/data/prefs";
import { getDict } from "@/lib/i18n";
import { buttonClass } from "@/components/ui/button";

export default async function NotFound() {
  const { lang } = await getPrefs();
  const t = getDict(lang);
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 text-center">
      <h1 className="font-serif text-2xl font-semibold">{t.errors.notFound}</h1>
      <Link href="/today" className={buttonClass("primary", "md", "mx-auto mt-6")}>
        {t.errors.goToday}
      </Link>
    </main>
  );
}
