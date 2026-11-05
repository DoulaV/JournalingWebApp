"use client";

import { useEffect } from "react";
import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { buttonClass } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const lang =
    typeof document !== "undefined" && document.documentElement.lang === "ar" ? "ar" : "en";
  const t = getDict(lang);
  return (
    <div role="alert" className="border-border bg-surface rounded-2xl border p-8 text-center">
      <h1 className="font-serif text-2xl font-semibold">{t.errors.pageTitle}</h1>
      <p className="text-muted mt-2">{t.errors.pageBody}</p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={reset} className={buttonClass("primary", "md")}>
          {t.common.retry}
        </button>
        <Link href="/today" className={buttonClass("secondary", "md")}>
          {t.errors.goToday}
        </Link>
      </div>
    </div>
  );
}
