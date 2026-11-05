import { test, expect } from "@playwright/test";
import { addDaysStr, dubaiToday, resetUserData, seedEntries } from "./helpers";

test.use({
  permissions: ["microphone"],
  launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] },
});

// A 1x1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("looking back", () => {
  test("calendar colors days, year heatmap, and on this day", async ({ page }) => {
    const userId = await resetUserData();
    const today = dubaiToday();
    const weekAgo = addDaysStr(today, -7);
    await seedEntries(userId, [
      {
        date: weekAgo,
        text: "A week ago I felt brave.",
        core: "happy",
        middle: "powerful",
        intensity: 5,
      },
      { date: addDaysStr(today, -2), text: "Grey and slow.", core: "sad", intensity: 2 },
    ]);

    await page.goto(`/calendar?m=${weekAgo.slice(0, 7)}`);
    const cell = page.getByTestId("month-view").locator(`a[href="/entry/${weekAgo}"] span`).first();
    await expect(cell).toHaveCSS("background-color", "rgb(239, 159, 39)");

    await page.getByRole("link", { name: "Year" }).click();
    await expect(page.getByTestId("year-view")).toBeVisible();
    await expect(page.getByTestId("year-view").locator(`span[title="${weekAgo}"]`)).toHaveCSS(
      "opacity",
      "1",
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    ).toBe(false);

    await page.goto("/today");
    await expect(page.getByRole("heading", { name: "On this day" })).toBeVisible();
    await expect(page.getByText("A week ago I felt brave.")).toBeVisible();
  });

  test("full-text search in English and Arabic with filters", async ({ page }) => {
    const userId = await resetUserData();
    const today = dubaiToday();
    await seedEntries(userId, [
      {
        date: addDaysStr(today, -3),
        text: "The meeting with my manager went well.",
        core: "happy",
        tags: ["work"],
      },
      {
        date: addDaysStr(today, -4),
        text: "تحدثت مع أمي طويلا عن الطفولة.",
        core: "sad",
        tags: ["family"],
      },
      {
        date: addDaysStr(today, -5),
        text: "Another meeting, more stress.",
        core: "fearful",
        tags: ["work"],
      },
    ]);

    await page.goto("/search");
    await page.getByRole("searchbox").fill("meeting");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByText("2 entries")).toBeVisible();

    await page.getByLabel("Feeling").selectOption({ label: "Fearful" });
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByText("1 entries")).toBeVisible();
    await expect(page.getByText("Another meeting, more stress.")).toBeVisible();

    await page.goto("/search?q=" + encodeURIComponent("أمي"));
    await expect(page.getByText("تحدثت مع أمي طويلا عن الطفولة.")).toBeVisible();

    await page.goto("/search?q=nothing-like-this");
    await expect(page.getByText("Nothing found.")).toBeVisible();
  });

  test("photos and voice notes attach to today's entry", async ({ page }) => {
    const userId = await resetUserData();
    await seedEntries(userId, [
      { date: dubaiToday(), text: "A walk by the water.", core: "happy" },
    ]);
    await page.goto("/today");

    await page
      .locator('input[type="file"]')
      .setInputFiles({ name: "sea.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByRole("img", { name: "Photo from this entry" })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Record voice note" }).click();
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /Stop recording/ }).click();
    await expect(page.locator("audio")).toHaveCount(1, { timeout: 15_000 });

    await page.reload();
    await expect(page.getByRole("img", { name: "Photo from this entry" })).toBeVisible();
    await expect(page.locator("audio")).toHaveCount(1);

    await page.goto("/search?photo=1&audio=1");
    await expect(page.getByText("A walk by the water.")).toBeVisible();
  });
});
