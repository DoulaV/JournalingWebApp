import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chromium" });
const ctx = await browser.newContext({
  storageState: "e2e/.auth/user.json",
  viewport: { width: 390, height: 844 },
});
await ctx.grantPermissions(["notifications"], { origin: "http://localhost:3000" });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/settings");
const reg = await page.evaluate(async () => {
  const r = await navigator.serviceWorker.ready;
  return r.active?.scriptURL;
});
console.log("sw:", reg);
await page.getByRole("button", { name: "Turn on notifications on this device" }).click();
await page.waitForTimeout(4000);
console.log(
  "state:",
  await page.locator("text=Notifications are on for this device.").count(),
  await page.locator("[role=status]").allTextContents(),
);
const btn = page.getByRole("button", { name: "Send a test notification" });
if (await btn.count()) {
  await btn.click();
  await page.waitForTimeout(3000);
  console.log("after test:", await page.locator("[role=status]").allTextContents());
}
await browser.close();
