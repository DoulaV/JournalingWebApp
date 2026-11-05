import { test, expect } from "@playwright/test";
import { resetUserData } from "./helpers";

test.describe("quick check-in", () => {
  test.beforeEach(async () => {
    await resetUserData();
  });

  test("journal a day end to end on a phone in under 60 seconds", async ({ page }) => {
    const started = Date.now();
    await page.goto("/today");
    await expect(page.getByTestId("check-in")).toBeVisible();

    await page.getByRole("button", { name: "Happy" }).click();
    await expect(page.getByLabel("How strong is it?")).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("What's behind this feeling?").fill("A slow breakfast with my family.");
    await page.getByRole("button", { name: "Family" }).click();
    await page.getByRole("button", { name: "Save check-in" }).click();

    await expect(page.getByTestId("checkin-saved")).toBeVisible();
    expect(Date.now() - started).toBeLessThan(60_000);

    await page.getByRole("button", { name: "Keep writing" }).click();
    const editor = page.getByRole("textbox", { name: "Write whatever is on your mind." });
    await expect(editor).toContainText("A slow breakfast with my family.");
    await editor.press("End");
    await editor.press("Enter");
    await editor.pressSequentially("كان الصباح هادئا وجميلا.");
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible({
      timeout: 15_000,
    });

    await page.reload();
    const ar = page.locator(".ProseMirror p", { hasText: "كان الصباح هادئا" });
    await expect(ar).toHaveAttribute("dir", "auto");
    await expect(page.getByTestId("streak-current")).toHaveText("1 day");
    await expect(page.getByTestId("prompt")).toBeVisible();
  });

  test("Not sure needs only a pleasant or unpleasant slider", async ({ page }) => {
    await page.goto("/today");
    await page.getByRole("button", { name: "Not sure" }).click();
    await expect(page.getByText("That's okay. How does it feel overall?")).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("What's behind this feeling?").fill("Hard to name today.");
    await page.getByRole("button", { name: "Save check-in" }).click();
    await expect(page.getByTestId("checkin-saved")).toBeVisible();
    await page.getByRole("button", { name: "Done for today" }).click();
    await page.reload();
    await expect(page.getByTestId("streak-current")).toHaveText("1 day");
  });
});
