import { test, expect } from "@playwright/test";
import { resetUserData, seedEntries, dubaiToday } from "./helpers";

test.describe("habit engine", () => {
  test("full three-ring picker with recents, intensity and up to three feelings", async ({ page }) => {
    const userId = await resetUserData({ emotion_depth_unlocked: 3 });
    await seedEntries(userId, [{ date: dubaiToday(-3), text: "Older day.", core: "angry", middle: "frustrated" }]);
    await page.goto("/today");

    // Recent row shows the most used feeling.
    await expect(page.getByRole("button", { name: "Frustrated" })).toBeVisible();

    // Core > middle > precise with breadcrumb and back.
    await page.getByRole("button", { name: "Fearful" }).click();
    await page.getByRole("button", { name: "Anxious" }).click();
    await expect(page.getByText("Fearful › Anxious")).toBeVisible();
    await expect(page.getByText("More precise (optional)")).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();
    await page.getByRole("button", { name: "Just Fearful" }).click();
    await expect(page.getByLabel("How strong is it?").first()).toBeVisible();

    // Second and third feelings, then the picker stops at three.
    await page.getByRole("button", { name: "+ Add another feeling" }).click();
    await page.getByRole("button", { name: "Frustrated" }).click();
    await page.getByRole("button", { name: "+ Add another feeling" }).click();
    await page.getByRole("button", { name: "Happy" }).click();
    await page.getByRole("button", { name: "Proud" }).click();
    await page.getByRole("button", { name: "Confident" }).click();
    await expect(page.getByText("Three feelings is plenty.")).toBeVisible();
    await page.getByLabel("How strong is it?").first().fill("5");

    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("What's behind this feeling?").fill("A big presentation went well.");
    await page.getByRole("button", { name: "Save check-in" }).click();
    await expect(page.getByTestId("checkin-saved")).toContainText("Happy › Proud › Confident");
    await expect(page.getByTestId("checkin-saved")).toContainText(/Fearful\s*· 5\/5/);
  });

  test("week one shows only the core ring", async ({ page }) => {
    await resetUserData();
    await page.goto("/today");
    await page.getByRole("button", { name: "Sad" }).click();
    await expect(page.getByRole("button", { name: "Lonely" })).toHaveCount(0);
    await expect(page.getByLabel("How strong is it?")).toBeVisible();
  });

  test("offline drafts save on the device and sync when back online", async ({ page, context }) => {
    const userId = await resetUserData();
    await seedEntries(userId, [{ date: dubaiToday(), text: "Started online.", core: "bad", middle: "tired" }]);
    await page.goto("/today");
    const editor = page.getByRole("textbox", { name: "Write whatever is on your mind." });
    await expect(editor).toContainText("Started online.");

    await context.setOffline(true);
    await editor.press("End");
    await editor.pressSequentially(" Written on the train with no signal.");
    await expect(page.getByRole("status").filter({ hasText: "Saved on this device" })).toBeVisible({ timeout: 15_000 });

    await context.setOffline(false);
    await expect(page.getByRole("status").filter({ hasText: /^Saved$/ })).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(editor).toContainText("Written on the train with no signal.");
  });

  test("streak counts history with a rest day used", async ({ page }) => {
    const userId = await resetUserData();
    const days = Array.from({ length: 7 }, (_, i) => ({ date: dubaiToday(-9 + i), text: `Day ${i + 1}.` }));
    await seedEntries(userId, [...days, { date: dubaiToday(-1), text: "Back again." }]);
    await page.goto("/today");
    // 7 days earn a rest day, the missed day uses it, yesterday continues: 8 days.
    await expect(page.getByTestId("streak-current")).toHaveText("8 days");
  });

  test("morning and evening rituals add their prompt to today's entry", async ({ page }) => {
    const userId = await resetUserData();
    await seedEntries(userId, [{ date: dubaiToday(), text: "Today so far.", core: "happy" }]);
    await page.goto("/today");
    await page.getByRole("button", { name: "Add evening reflection" }).click();
    const editor = page.getByRole("textbox", { name: "Write whatever is on your mind." });
    await expect(editor.locator("h2")).toHaveText("How did I actually feel today?");
    await editor.pressSequentially("Calmer than I expected.");
    await expect(page.getByRole("status").filter({ hasText: /^Saved$/ })).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(editor.locator("h2")).toHaveText("How did I actually feel today?");
  });

  test("cron endpoints require the secret", async ({ request }) => {
    expect((await request.get("/api/cron/reminders")).status()).toBe(401);
    const ok = await request.get("/api/cron/streaks", { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
    expect(ok.status()).toBe(200);
    const rem = await request.get("/api/cron/reminders", { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
    expect((await rem.json()).ok).toBe(true);
  });
});

test.describe("appearance and language", () => {
  test("dark mode, font size and Arabic UI with RTL", async ({ page }) => {
    await resetUserData();
    await page.goto("/settings");
    await page.getByText("Dark", { exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByLabel("Language").selectOption("ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("heading", { name: "الإعدادات", level: 1 })).toBeVisible();

    await page.goto("/today");
    await page.getByRole("button", { name: "حزين" }).click();
    await page.getByRole("button", { name: "التالي" }).click();
    await page.getByLabel("ما الذي يقف خلف هذا الشعور؟").fill("اشتقت إلى أهلي اليوم.");
    await page.getByRole("button", { name: "احفظ" }).click();
    await expect(page.getByTestId("checkin-saved")).toBeVisible();
    const hasHScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHScroll).toBe(false);
  });
});
