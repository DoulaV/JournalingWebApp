import { test, expect } from "@playwright/test";
import { EMAIL, ensureUser } from "./helpers";

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

async function latestLinkFor(email: string, after: number): Promise<string | null> {
  for (let i = 0; i < 20; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const json = (await res.json()) as { messages: { ID: string; Created: string }[] };
    const msg = json.messages.find((m) => Date.parse(m.Created) >= after - 2000);
    if (msg) {
      const full = (await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json()) as {
        HTML: string;
      };
      const m = full.HTML.match(/href="([^"]+auth\/confirm[^"]+)"/);
      if (m) return m[1].replace(/&amp;/g, "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

test.describe("sign in", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("magic link signs the owner in", async ({ page }) => {
    await ensureUser();
    const t0 = Date.now();
    await page.goto("/today");
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByRole("button", { name: "Email me a sign-in link" }).click();
    await expect(page.getByText("Check your email")).toBeVisible();
    const link = await latestLinkFor(EMAIL, t0);
    expect(link).toBeTruthy();
    await page.goto(link!);
    await expect(page).toHaveURL(/\/today/);
  });

  test("any other email is quietly refused and gets no email", async ({ page }) => {
    const other = `stranger-${Date.now()}@example.com`;
    const t0 = Date.now();
    await page.goto("/login");
    await page.getByLabel("Email").fill(other);
    await page.getByRole("button", { name: "Email me a sign-in link" }).click();
    await expect(page.getByText("Check your email")).toBeVisible();
    expect(await latestLinkFor(other, t0)).toBeNull();
  });
});
