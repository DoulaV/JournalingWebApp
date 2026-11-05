import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { unzipSync, strFromU8 } from "fflate";
import AxeBuilder from "@axe-core/playwright";
import { admin, dubaiToday, resetUserData, seedEntries, addDaysStr } from "./helpers";

test.describe("hardening", () => {
  test("PIN lock hides everything until the right PIN", async ({ page, context }) => {
    const userId = await resetUserData();
    await seedEntries(userId, [
      { date: dubaiToday(), text: "A very private thought.", core: "sad" },
    ]);
    await page.goto("/settings");
    await page.getByLabel("PIN (4 to 6 digits)").fill("2468");
    await page.getByRole("button", { name: "Set PIN" }).click();
    await expect(page.getByText("PIN saved.")).toBeVisible();

    // Simulate the inactivity timeout: the unlock cookie expires.
    await context.clearCookies({ name: "jl_unlock" });
    const res = await page.goto("/today");
    expect(await res!.text()).not.toContain("A very private thought.");
    await expect(page.getByTestId("lock-screen")).toBeVisible();

    await page.getByLabel("Enter your PIN").fill("1111");
    await page.getByRole("button", { name: "Unlock" }).click();
    await expect(page.getByText("That PIN didn't match.")).toBeVisible();
    await page.getByLabel("Enter your PIN").fill("2468");
    await page.getByRole("button", { name: "Unlock" }).click();
    await expect(page.getByText("A very private thought.")).toBeVisible();

    const { data } = await admin()
      .from("profiles")
      .select("pin_hash")
      .eq("user_id", userId)
      .single();
    expect(data!.pin_hash).toMatch(/^scrypt\$/);
    expect(data!.pin_hash).not.toContain("2468");
    await admin().from("profiles").update({ pin_hash: null }).eq("user_id", userId);
  });

  test("exports JSON and a Markdown zip", async ({ page, request }) => {
    const userId = await resetUserData();
    await seedEntries(userId, [
      {
        date: addDaysStr(dubaiToday(), -1),
        text: "Exported thoughts.",
        core: "happy",
        middle: "proud",
        tags: ["work"],
      },
      { date: dubaiToday(), text: "يوم هادئ.", core: "bad", middle: "tired" },
    ]);
    await page.goto("/settings");
    const json = await page.request.get("/api/export/json");
    expect(json.headers()["content-disposition"]).toContain("journal-");
    const data = await json.json();
    expect(data.entries).toHaveLength(2);
    expect(JSON.stringify(data)).not.toContain("pin_hash");

    const zip = await page.request.get("/api/export/markdown");
    const files = unzipSync(new Uint8Array(await zip.body()));
    const md = strFromU8(files[`entries/${addDaysStr(dubaiToday(), -1)}.md`]);
    expect(md).toContain('feelings: ["Happy > Proud (3/5)"]');
    expect(md).toContain("Exported thoughts.");
    expect(strFromU8(files[`entries/${dubaiToday()}.md`])).toContain("يوم هادئ.");

    expect(
      (await request.get("/api/export/json", { headers: { cookie: "" } })).status(),
    ).toBeLessThan(500);
  });

  test("weekly backup keeps 8 copies and restores into an empty journal", async ({ request }) => {
    const userId = await resetUserData();
    await seedEntries(userId, [
      {
        date: addDaysStr(dubaiToday(), -2),
        text: "Backed up day one.",
        core: "happy",
        tags: ["family"],
      },
      { date: addDaysStr(dubaiToday(), -1), text: "Backed up day two.", core: "sad" },
    ]);
    const a = admin();
    const old = await a.storage.from("backups").list(userId);
    if (old.data?.length)
      await a.storage.from("backups").remove(old.data.map((f) => `${userId}/${f.name}`));
    const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` };
    for (let i = 0; i < 9; i++)
      expect((await request.get("/api/cron/backup", { headers })).status()).toBe(200);
    const { data: files } = await a.storage.from("backups").list(userId);
    expect(files!.filter((f) => f.name.startsWith("backup-"))).toHaveLength(8);

    await a.from("entries").delete().eq("user_id", userId);
    const out = execFileSync("node", ["scripts/restore.mjs", "--latest"], { encoding: "utf8" });
    expect(out).toContain("Restored 2 entries");
    const { data: restored } = await a
      .from("entries")
      .select("body_text, entry_tags(tag_id)")
      .eq("user_id", userId)
      .order("entry_date");
    expect(restored!.map((r) => r.body_text)).toEqual(["Backed up day one.", "Backed up day two."]);
    expect(restored![0].entry_tags).toHaveLength(1);
    fs.mkdirSync("test-results", { recursive: true });
  });

  test("AI reflection is off by default and clearly labeled", async ({ page }) => {
    const userId = await resetUserData();
    await seedEntries(userId, [{ date: dubaiToday(), text: "Something.", core: "happy" }]);
    await page.goto("/insights");
    await expect(
      page.getByText("AI reflection is off. You can turn it on in Settings."),
    ).toBeVisible();
    await page.goto("/settings");
    await expect(page.getByText(/send a week of entries to Anthropic/)).toBeVisible();
    await expect(page.getByRole("switch", { name: /AI weekly reflection/ })).not.toBeChecked();
  });

  for (const path of [
    "/today",
    "/calendar",
    "/calendar?view=year",
    "/entries",
    "/search?q=day",
    "/insights",
    "/letters",
    "/milestones",
    "/settings",
  ]) {
    test(`no serious accessibility issues on ${path}`, async ({ page }) => {
      const userId = await resetUserData();
      await seedEntries(userId, [
        { date: addDaysStr(dubaiToday(), -1), text: "A calm day.", core: "happy", tags: ["self"] },
        { date: dubaiToday(), text: "Today was fine.", core: "bad" },
      ]);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(
        serious.map(
          (v) =>
            `${v.id}: ${v.nodes
              .map((n) => n.target.join(" "))
              .slice(0, 3)
              .join(", ")}`,
        ),
      ).toEqual([]);
    });
  }
});
