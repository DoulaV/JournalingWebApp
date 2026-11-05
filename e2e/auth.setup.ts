import { test as setup, expect } from "@playwright/test";
import { resetUserData, signIn } from "./helpers";

setup("sign in", async ({ page }) => {
  await resetUserData();
  await signIn(page);
  await expect(page).toHaveURL(/\/today/);
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
