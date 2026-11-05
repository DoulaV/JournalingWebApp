import { chromium } from "@playwright/test";
process.loadEnvFile(".env.local");
const browser = await chromium.launch({ channel: "chromium" });
const ctx = await browser.newContext({ storageState: "e2e/.auth/user.json" });
await ctx.grantPermissions(["notifications"], { origin: "http://localhost:3000" });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/settings");
const r = await page.evaluate(async (key) => {
  try {
    const reg = await navigator.serviceWorker.ready;
    const pad = "=".repeat((4 - (key.length % 4)) % 4);
    const raw = atob((key + pad).replace(/-/g, "+").replace(/_/g, "/"));
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, c => c.charCodeAt(0)) });
    return sub.endpoint;
  } catch (e) { return "ERR " + e.name + ": " + e.message; }
}, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
console.log(r);
await browser.close();
