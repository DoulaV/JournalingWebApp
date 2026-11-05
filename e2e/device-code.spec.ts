import { test, expect } from "@playwright/test";
import { resetUserData } from "./helpers";

test("a sign-in code from Settings signs in another device without email", async ({
  page,
  browser,
}) => {
  await resetUserData();
  await page.goto("/settings");
  await page.getByRole("button", { name: "Show a sign-in code" }).click();
  const code = (await page.getByTestId("device-code").textContent())!.trim();
  expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

  // A fresh browser with no session, like the iPhone Home Screen app.
  const other = await browser.newContext({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 390, height: 844 },
  });
  const phone = await other.newPage();
  await phone.goto("/login");
  await phone.getByRole("button", { name: "Have a sign-in code?" }).click();
  await phone.getByLabel("Sign-in code").fill("WRONGCODE");
  await phone.getByRole("button", { name: "Sign in with code" }).click();
  await expect(phone.getByText("That code didn't work.")).toBeVisible();
  await phone.getByLabel("Sign-in code").fill(code.toLowerCase());
  await phone.getByRole("button", { name: "Sign in with code" }).click();
  await expect(phone).toHaveURL(/\/today/);
  await expect(phone.getByTestId("check-in")).toBeVisible();
  await other.close();
});
