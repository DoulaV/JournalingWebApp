"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { heartbeatAction, lockNowAction, unlockAction } from "@/app/(app)/lock-actions";
import type { Dict } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LockScreen({ t }: { t: Dict["lock"] }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await unlockAction(pin);
    setBusy(false);
    if (r.ok) {
      router.refresh();
    } else {
      setError(true);
      setPin("");
    }
  }

  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-xs flex-col justify-center px-6"
      data-testid="lock-screen"
    >
      <div aria-hidden className="mx-auto mb-6 size-12 rounded-2xl bg-accent-soft" />
      <h1 className="text-center font-serif text-2xl font-semibold">{t.title}</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <label htmlFor="pin" className="block text-center text-sm text-muted">
          {t.enterPin}
        </label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setError(false);
          }}
          autoFocus
          dir="ltr"
          className="block min-h-14 w-full rounded-2xl border border-border bg-surface text-center text-2xl tracking-[0.5em]"
        />
        {error && (
          <p role="alert" className="text-center text-sm text-danger">
            {t.wrong}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy || pin.length < 4}>
          {t.unlock}
        </Button>
      </form>
    </main>
  );
}

/** Extends the unlock window while the user is active, and locks after inactivity. */
export function ActivityWatcher({ timeoutMinutes }: { timeoutMinutes: number }) {
  const router = useRouter();
  const last = useRef(0);
  const lastBeat = useRef(0);

  useEffect(() => {
    last.current = Date.now();
    lastBeat.current = Date.now();
    const timeout = timeoutMinutes * 60_000;
    const onActivity = () => {
      last.current = Date.now();
      if (Date.now() - lastBeat.current > 60_000) {
        lastBeat.current = Date.now();
        void heartbeatAction().then((r) => r.locked && router.refresh());
      }
    };
    const check = async () => {
      if (Date.now() - last.current >= timeout) {
        await lockNowAction();
        router.refresh();
      }
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const onVis = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVis);
    const iv = setInterval(check, 15_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(iv);
    };
  }, [timeoutMinutes, router]);

  return null;
}
