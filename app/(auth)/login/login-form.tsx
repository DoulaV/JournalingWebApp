"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { sendMagicLink, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { browserClient } from "@/lib/data/clients/browser";
import type { Dict } from "@/lib/i18n";

export function LoginForm({ t }: { t: Dict["login"] }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, {
    status: "idle",
  });
  const [passkeyError, setPasskeyError] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const router = useRouter();

  async function passkey() {
    setPasskeyError(false);
    setPasskeyBusy(true);
    const { error } = await browserClient().auth.signInWithPasskey();
    setPasskeyBusy(false);
    if (error) {
      setPasskeyError(true);
      return;
    }
    router.replace("/today");
    router.refresh();
  }

  if (state.status === "sent") {
    return (
      <p role="status" className="rounded-2xl border border-border bg-surface p-5">
        {t.sent}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-3">
        <label htmlFor="email" className="block text-sm font-medium">
          {t.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email webauthn"
          inputMode="email"
          dir="ltr"
          className="block min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
        />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? t.sending : t.sendLink}
        </Button>
        {state.status === "error" && (
          <p role="alert" className="text-sm text-danger">
            {t.failed}
          </p>
        )}
      </form>
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-px flex-1 bg-border" />
        {t.or}
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="secondary" size="lg" className="w-full" onClick={passkey} disabled={passkeyBusy}>
        {t.passkey}
      </Button>
      {passkeyError && (
        <p role="alert" className="text-sm text-danger">
          {t.failed}
        </p>
      )}
    </div>
  );
}
