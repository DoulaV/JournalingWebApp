import { test, expect } from "@playwright/test";
import https from "node:https";
import type http from "node:http";
import fs from "node:fs";
import crypto from "node:crypto";
import { admin, resetUserData } from "./helpers";

// A real browser push service can't be reached from headless test browsers, so
// this stands up a local endpoint and checks the server sends an encrypted,
// VAPID-signed notification when a reminder is due, and only once.
test("cron sends one due reminder through Web Push", async ({ request }) => {
  const userId = await resetUserData();
  const received: { headers: http.IncomingHttpHeaders; size: number }[] = [];
  const tls = { key: fs.readFileSync("e2e/fixtures/localhost.key"), cert: fs.readFileSync("e2e/fixtures/localhost.crt") };
  const server = https.createServer(tls, (req, res) => {
    let size = 0;
    req.on("data", (c: Buffer) => (size += c.length));
    req.on("end", () => {
      received.push({ headers: req.headers, size });
      res.writeHead(201).end();
    });
  });
  await new Promise<void>((r) => server.listen(9911, r));

  try {
    const ecdh = crypto.createECDH("prime256v1");
    ecdh.generateKeys();
    const a = admin();
    await a.from("push_subscriptions").delete().eq("user_id", userId);
    await a.from("push_subscriptions").insert({
      user_id: userId,
      endpoint: "https://localhost:9911/push/test-device",
      keys: { p256dh: ecdh.getPublicKey().toString("base64url"), auth: crypto.randomBytes(16).toString("base64url") },
      device_label: "test",
    });
    const now = new Date(Date.now() - 60_000);
    const hhmm = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
    await a
      .from("profiles")
      .update({
        reminders_enabled: true,
        reminder_time: hhmm,
        nudge_enabled: false,
        morning_reminder_enabled: false,
        notifications_sent_on: null,
        notifications_sent_count: 0,
        notifications_sent_kinds: null,
      })
      .eq("user_id", userId);

    const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` };
    const first = await (await request.get("/api/cron/reminders", { headers })).json();
    expect(first.results).toContainEqual({ kind: "reminder", sent: 1 });
    expect(received).toHaveLength(1);
    expect(received[0].headers["content-encoding"]).toBe("aes128gcm");
    expect(String(received[0].headers.authorization)).toMatch(/^vapid t=/);
    expect(received[0].size).toBeGreaterThan(50);

    const second = await (await request.get("/api/cron/reminders", { headers })).json();
    expect(second.results).toContainEqual({ kind: null, sent: 0 });
    expect(received).toHaveLength(1);
  } finally {
    await admin().from("push_subscriptions").delete().eq("user_id", userId);
    await admin().from("profiles").update({ reminders_enabled: false }).eq("user_id", userId);
    server.close();
  }
});
