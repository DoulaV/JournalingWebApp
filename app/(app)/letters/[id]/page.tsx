import { notFound } from "next/navigation";
import Link from "next/link";
import { openLetter } from "@/lib/data/letters";
import { getProfile } from "@/lib/data/profile";
import { formatDate } from "@/lib/dates";
import { getDict } from "@/lib/i18n";

export const metadata = { title: "Letter" };

export default async function LetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const profile = await getProfile();
  const t = getDict(profile.language);
  // RLS returns nothing while the letter is still sealed.
  const letter = await openLetter(id);
  if (!letter) notFound();
  return (
    <article className="animate-bloom space-y-4">
      <Link href="/letters" className="text-muted text-sm">
        <span aria-hidden className="inline-block rtl:rotate-180">
          ←
        </span>{" "}
        {t.letters.title}
      </Link>
      <p className="text-muted text-sm">
        {formatDate(letter.createdAt.slice(0, 10), profile.language, { year: "numeric" })}
      </p>
      {letter.title && (
        <h1 className="font-serif text-3xl font-semibold" dir="auto">
          {letter.title}
        </h1>
      )}
      <div
        className="entry-prose border-border bg-surface rounded-2xl border p-6 whitespace-pre-wrap"
        dir="auto"
      >
        {letter.body}
      </div>
    </article>
  );
}
