import { test, expect } from "@playwright/test";
import { admin, ensureUser, resetUserData } from "./helpers";

/** A timezone where it is currently between 01:00 and 11:00, so yesterday is still open. */
function morningZone(): string {
  const zones = [
    "Pacific/Kiritimati",
    "Pacific/Auckland",
    "Asia/Tokyo",
    "Asia/Dubai",
    "Europe/London",
    "America/New_York",
    "America/Los_Angeles",
    "Pacific/Honolulu",
    "Pacific/Pago_Pago",
  ];
  for (const z of zones) {
    const h = Number(
      new Intl.DateTimeFormat("en-GB", { timeZone: z, hour: "2-digit", hourCycle: "h23" }).format(
        new Date(),
      ),
    );
    if (h >= 1 && h < 11) return z;
  }
  throw new Error("no morning zone found");
}

test.describe("starting today's entry", () => {
  test("the check-in explains how to start, and you can skip straight to writing", async ({
    page,
  }) => {
    await resetUserData();
    await page.goto("/today");
    await expect(page.getByText("Tap a feeling to start today's entry.")).toBeVisible();
    await page.getByRole("button", { name: "Skip feelings and just write" }).click();
    const editor = page.getByRole("textbox", { name: "Write whatever is on your mind." });
    await expect(editor).toBeVisible();
    await editor.click();
    await editor.pressSequentially("Just writing today, no labels.");
    await expect(page.getByRole("status").filter({ hasText: /^Saved$/ })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Add a feeling when you're ready")).toBeVisible();
    await page.reload();
    await expect(editor).toContainText("Just writing today, no labels.");
  });

  test("write for yesterday clearly switches to yesterday and saves there", async ({ page }) => {
    const zone = morningZone();
    const userId = await resetUserData({ timezone: zone });
    await page.goto("/today");
    await page.getByRole("link", { name: "Write for yesterday" }).click();
    await expect(page.getByTestId("backfill-banner")).toContainText(
      "You're writing yesterday's entry",
    );
    await page.getByRole("button", { name: "Happy", exact: true }).last().click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("What's behind this feeling?").fill("Catching up on yesterday.");
    await page.getByRole("button", { name: "Save check-in" }).click();
    await expect(page.getByTestId("checkin-saved")).toBeVisible();

    const yesterday = new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(
      new Date(Date.now() - 86_400_000),
    );
    const { data } = await admin()
      .from("entries")
      .select("entry_date, is_backfilled")
      .eq("user_id", userId);
    expect(data).toEqual([{ entry_date: yesterday, is_backfilled: true }]);

    await page.getByRole("link", { name: "Back to today" }).click();
    await expect(page.getByTestId("check-in")).toBeVisible();
    await expect(page.getByRole("link", { name: "Write for yesterday" })).toHaveCount(0);
    await ensureUser();
  });
});
