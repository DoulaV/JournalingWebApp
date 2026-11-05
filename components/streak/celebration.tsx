"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { markMilestonesSeenAction } from "@/app/(app)/actions";
import { fmt, getDict } from "@/lib/i18n";
import type { Lang } from "@/lib/emotions";
import { rewardFor, rewardLabel } from "@/lib/rewards";
import { buttonClass } from "@/components/ui/button";

/** A calm milestone moment: a soft glow and a few words. No confetti. */
export function Celebration({ milestone, lang }: { milestone: number; lang: Lang }) {
  const t = getDict(lang);
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDialogElement>(null);
  const reward = rewardFor(milestone);

  useEffect(() => {
    if (open && ref.current && !ref.current.open) ref.current.showModal();
  }, [open]);

  function close() {
    setOpen(false);
    ref.current?.close();
    void markMilestonesSeenAction();
  }

  if (!open) return null;
  return (
    <dialog
      ref={ref}
      onCancel={close}
      aria-labelledby="celebrate-title"
      className="m-auto w-[min(26rem,calc(100%-2rem))] rounded-3xl border border-border bg-surface p-8 text-center text-text backdrop:bg-black/30"
    >
      <div aria-hidden className="animate-bloom animate-halo mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-accent-soft font-serif text-3xl">
        {milestone}
      </div>
      <h2 id="celebrate-title" className="font-serif text-2xl font-semibold">
        {fmt(t.rewards.celebrate, { n: milestone })}
      </h2>
      <p className="mt-2 text-muted">{fmt(t.streak.milestone, { n: milestone })}</p>
      {reward && <p className="mt-4">{fmt(t.rewards.celebrateBody, { reward: rewardLabel(reward.id, t.rewards) })}</p>}
      <div className="mt-6 flex flex-col gap-2">
        {reward && (
          <Link href={reward.href} onClick={close} className={buttonClass("primary", "lg")}>
            {rewardLabel(reward.id, t.rewards)}
          </Link>
        )}
        <button type="button" onClick={close} className={buttonClass(reward ? "ghost" : "primary", "lg")}>
          {t.common.close}
        </button>
      </div>
    </dialog>
  );
}
