"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dict } from "@/lib/i18n";
import { cn } from "@/lib/cn";

type IconName = "today" | "calendar" | "entries" | "search" | "insights" | "letters" | "settings";

const paths: Record<IconName, string> = {
  today: "M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z",
  calendar:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  entries: "M4 6h16M4 12h16M4 18h10",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
  insights: "M3 3v18h18M7 15l4-4 3 3 5-6",
  letters: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 2-10 7L2 6",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("size-6", className)}
    >
      <path d={paths[name]} />
    </svg>
  );
}

const MOBILE: IconName[] = ["today", "calendar", "insights", "settings"];
const DESKTOP: IconName[] = [
  "today",
  "calendar",
  "entries",
  "search",
  "insights",
  "letters",
  "settings",
];

export function Nav({ t }: { t: Dict }) {
  const pathname = usePathname();
  const active = (n: IconName) =>
    pathname === `/${n}` ||
    pathname.startsWith(`/${n}/`) ||
    (n === "entries" && pathname.startsWith("/entry/"));

  return (
    <>
      <nav
        aria-label={t.nav.main}
        className="no-print border-border bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {MOBILE.map((n) => (
            <li key={n}>
              <Link
                href={`/${n}`}
                aria-current={active(n) ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-xs",
                  active(n) ? "text-accent" : "text-muted",
                )}
              >
                <Icon name={n} />
                {t.nav[n]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav
        aria-label={t.nav.main}
        className="no-print border-border sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-e p-5 md:flex"
      >
        <Link href="/today" className="mb-6 px-3 font-serif text-xl font-semibold">
          {t.appName}
        </Link>
        {DESKTOP.map((n) => (
          <Link
            key={n}
            href={`/${n}`}
            aria-current={active(n) ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px]",
              active(n) ? "bg-accent-soft text-text font-medium" : "text-muted hover:bg-surface-2",
            )}
          >
            <Icon name={n} className="size-5" />
            {t.nav[n]}
          </Link>
        ))}
      </nav>
    </>
  );
}

/** Secondary links shown at the top of mobile pages that aren't in the bottom bar. */
export function MobileQuickLinks({ t }: { t: Dict }) {
  const items: IconName[] = ["entries", "search", "letters"];
  return (
    <div className="no-print -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 md:hidden">
      {items.map((n) => (
        <Link
          key={n}
          href={`/${n}`}
          className="border-border flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm"
        >
          <Icon name={n} className="size-4" />
          {t.nav[n]}
        </Link>
      ))}
    </div>
  );
}
