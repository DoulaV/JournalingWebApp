import { test, expect } from "@playwright/test";
import { addDaysStr, admin, dubaiToday, resetUserData, seedEntries } from "./helpers";

function history(days: number, endOffset = -1) {
  const end = dubaiToday(endOffset);
  return Array.from({ length: days }, (_, i) => {
    const date = addDaysStr(end, -(days - 1 - i));
    const hard = i % 3 === 0;
    return {
      date,
      text: hard ? `Work deadline stress on day ${i + 1}.` : `Dinner with family on day ${i + 1}.`,
      core: hard ? "fearful" : "happy",
      intensity: hard ? 4 : 3,
      tags: [hard ? "work" : "family"],
    };
  });
}

test.describe("insights and rewards", () => {
  test("charts, triggers and weekday patterns render from entries", async ({ page }) => {
    const userId = await resetUserData();
    await seedEntries(userId, history(20));
    await page.goto("/insights");
    await expect(page.getByRole("heading", { name: "Feelings over time" })).toBeVisible();
    await expect(page.locator(".recharts-bar-rectangle").first()).toBeVisible();
    await page.getByRole("button", { name: "Months" }).click();
    await expect(page.getByText(/Fearful \d+/).first()).toBeVisible();
    await expect(page.getByText("Your monthly recap unlocks after a 30-day streak.")).toBeVisible();
    await page.getByText("Show as table").click();
    await expect(page.getByRole("table")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    ).toBe(false);
  });

  test("a 7-day milestone is celebrated calmly and unlocks a theme", async ({ page }) => {
    const userId = await resetUserData();
    await seedEntries(userId, history(6));
    await page.goto("/today");
    // The "Recent" row also offers Happy; pick the core ring button.
    await page.getByRole("button", { name: "Happy", exact: true }).last().click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("What's behind this feeling?").fill("A full week of showing up.");
    await page.getByRole("button", { name: "Save check-in" }).click();
    await expect(page.getByTestId("checkin-saved")).toBeVisible();
    await page.reload();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("You've reached 7 days.");
    await expect(dialog).toContainText("New theme: Dusk");
    await dialog.getByRole("button", { name: "Close" }).click();
    await page.reload();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.goto("/settings");
    await page.getByText("Dusk", { exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-palette", "dusk");
  });

  test("monthly recap and letters unlock with a long streak, letters stay sealed", async ({
    page,
  }) => {
    const userId = await resetUserData();
    await seedEntries(userId, history(55));
    await page.goto("/insights");
    await expect(page.getByTestId("recap")).toContainText("Most common feelings");
    await expect(page.getByTestId("recap")).toContainText("Family");

    await page.goto("/letters");
    await page.getByRole("button", { name: "Write a letter" }).click();
    await page.getByLabel("Your letter").fill("Dear future me, I hope you kept going.");
    await page.getByLabel("Open on").fill(addDaysStr(dubaiToday(), 30));
    await page.getByRole("button", { name: "Seal letter" }).click();
    await expect(page.getByTestId("letter")).toContainText("Sealed until");
    await expect(page.getByText("Dear future me")).toHaveCount(0);

    // Time passes: the letter's date arrives and it can be opened.
    await admin()
      .from("future_letters")
      .update({ sealed_until: dubaiToday() })
      .eq("user_id", userId);
    await page.goto("/today");
    await expect(page.getByText("A letter from your past self is ready to open.")).toBeVisible();
    await page.getByRole("link", { name: "Open letter" }).click();
    await page.getByTestId("letter").getByRole("link").click();
    await expect(page.getByText("Dear future me, I hope you kept going.")).toBeVisible();
  });

  test("100 days shows day one next to today", async ({ page }) => {
    const userId = await resetUserData();
    await seedEntries(userId, history(101, 0));
    await page.goto("/milestones");
    await expect(page.getByRole("heading", { name: "Look how far you've come" })).toBeVisible();
    await expect(page.getByText("Day one")).toBeVisible();
    await expect(
      page
        .getByText("Dinner with family on day 2.")
        .or(page.getByText("Work deadline stress on day 1.")),
    ).toBeVisible();
  });

  test("therapy summary prints only the excerpts I choose", async ({ page }) => {
    const userId = await resetUserData();
    await seedEntries(userId, history(3, 0));
    await page.goto("/print/summary?period=week");
    await expect(page.getByTestId("summary")).toContainText("Feelings and intensity");
    const first = page
      .locator("li")
      .filter({ has: page.locator('input[type="checkbox"]') })
      .first();
    await first.locator('input[type="checkbox"]').check();
    await page.emulateMedia({ media: "print" });
    const visible = page
      .locator("li:visible")
      .filter({ has: page.locator('input[type="checkbox"]') });
    await expect(visible).toHaveCount(1);
  });
});
