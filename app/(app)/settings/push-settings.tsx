"use client";

import { useEffect, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { subscribePushAction, testPushAction, unsubscribePushAction } from "./push-actions";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

async function detectPushState(): Promise<State> {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return ios && !standalone ? "ios-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "on" : "off";
}

export function PushSettings({ t, configured, vapidPublicKey }: { t: Dict; configured: boolean; vapidPublicKey: string }) {
  const s = t.settings;
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void detectPushState().then(setState);
  }, []);

  async function enable() {
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState("denied");
        return;
      }
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      await subscribePushAction(JSON.parse(JSON.stringify(sub)), navigator.userAgent.slice(0, 80));
      setState("on");
    } catch {
      setMsg(t.common.errorShort);
    }
  }

  async function disable() {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await unsubscribePushAction(sub.endpoint);
      await sub.unsubscribe();
    }
    setState("off");
  }

  return (
    <div className="space-y-2 rounded-xl bg-surface-2 p-4 text-sm">
      {!configured ? (
        <p>{s.pushUnsupported}</p>
      ) : state === "ios-install" ? (
        <p>{s.pushIos}</p>
      ) : state === "unsupported" ? (
        <p>{s.pushUnsupported}</p>
      ) : state === "denied" ? (
        <p>{s.pushDenied}</p>
      ) : state === "on" ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="me-auto">{s.pushOn}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              const r = await testPushAction();
              setMsg(r.sent ? s.testSent : t.common.errorShort);
            }}
          >
            {s.testPush}
          </Button>
          <Button variant="ghost" size="sm" onClick={disable}>
            {t.common.off}
          </Button>
        </div>
      ) : state === "off" ? (
        <>
          <Button size="sm" onClick={enable}>
            {s.enablePush}
          </Button>
          <p className="text-muted">{s.pushIos}</p>
        </>
      ) : null}
      {msg && <p role="status">{msg}</p>}
    </div>
  );
}
