import type { Metadata } from "next";
import { getProfile } from "@/lib/data/profile";
import { listTags } from "@/lib/data/tags";
import { searchEntries } from "@/lib/data/search";
import { getDict, fmt } from "@/lib/i18n";
import { EMOTIONS } from "@/lib/emotions";
import { tagLabel } from "@/lib/tags";
import { EntryCard } from "@/components/ui/entry-card";

export const metadata: Metadata = { title: "Search" };

type SP = {
  q?: string;
  tag?: string;
  core?: string;
  from?: string;
  to?: string;
  photo?: string;
  audio?: string;
};

const input = "block min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-base";

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const profile = await getProfile();
  const lang = profile.language;
  const t = getDict(lang);
  const tags = await listTags();
  const active = Boolean(sp.q || sp.tag || sp.core || sp.from || sp.to || sp.photo || sp.audio);
  const results = active
    ? await searchEntries({ ...sp, photo: sp.photo === "1", audio: sp.audio === "1" })
    : [];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">{t.search.title}</h1>
      <form
        role="search"
        className="border-border bg-surface space-y-4 rounded-2xl border p-4"
        action="/search"
      >
        <div className="flex gap-2">
          <label htmlFor="q" className="sr-only">
            {t.search.placeholder}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={sp.q}
            placeholder={t.search.placeholder}
            dir="auto"
            className={input}
          />
          <button
            type="submit"
            className="bg-accent text-accent-text min-h-11 shrink-0 rounded-full px-5"
          >
            {t.search.submit}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="tag" className="mb-1 block text-sm font-medium">
              {t.search.tag}
            </label>
            <select id="tag" name="tag" defaultValue={sp.tag ?? ""} className={input}>
              <option value="">{t.search.any}</option>
              {tags.map((tg) => (
                <option key={tg.id} value={tg.id}>
                  {tagLabel(tg.name, lang)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="core" className="mb-1 block text-sm font-medium">
              {t.search.core}
            </label>
            <select id="core" name="core" defaultValue={sp.core ?? ""} className={input}>
              <option value="">{t.search.any}</option>
              {EMOTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label[lang]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="from" className="mb-1 block text-sm font-medium">
              {t.search.from}
            </label>
            <input id="from" name="from" type="date" defaultValue={sp.from} className={input} />
          </div>
          <div>
            <label htmlFor="to" className="mb-1 block text-sm font-medium">
              {t.search.to}
            </label>
            <input id="to" name="to" type="date" defaultValue={sp.to} className={input} />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex min-h-10 items-center gap-2">
            <input
              type="checkbox"
              name="photo"
              value="1"
              defaultChecked={sp.photo === "1"}
              className="size-5 accent-[var(--accent)]"
            />
            {t.search.hasPhoto}
          </label>
          <label className="flex min-h-10 items-center gap-2">
            <input
              type="checkbox"
              name="audio"
              value="1"
              defaultChecked={sp.audio === "1"}
              className="size-5 accent-[var(--accent)]"
            />
            {t.search.hasAudio}
          </label>
        </div>
      </form>

      {!active ? (
        <p className="text-muted">{t.search.hint}</p>
      ) : results.length === 0 ? (
        <p className="border-border text-muted rounded-2xl border border-dashed p-6 text-center">
          {t.search.noResults}
        </p>
      ) : (
        <section aria-live="polite" className="space-y-3">
          <p className="text-muted text-sm">{fmt(t.search.results, { n: results.length })}</p>
          <ul className="space-y-3">
            {results.map((e) => (
              <li key={e.id}>
                <EntryCard entry={e} lang={lang} t={t} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
