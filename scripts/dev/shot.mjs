import { chromium } from "@playwright/test";
const [, , url, out, w = "390", h = "844", extra = ""] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: +w, height: +h },
  deviceScaleFactor: 1,
  storageState: "e2e/.auth/user.json",
  timezoneId: "Asia/Dubai",
  colorScheme: extra.includes("dark") ? "dark" : "light",
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000" + url, { waitUntil: "networkidle" });
if (extra.includes("click:")) {
  await page
    .getByRole("button", { name: extra.split("click:")[1] })
    .first()
    .click();
  await page.waitForTimeout(400);
}
await page.screenshot({ path: out, fullPage: true });
await browser.close();
