import { expect, test } from "@playwright/test";

test.describe("refresher course", () => {
  test("reaches the refresher from the gym and comes back", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Need a refresher?" }).click();

    await expect(page).toHaveURL(/refresher\.html$/);
    await expect(page.getByRole("heading", { level: 1, name: "Refresher" })).toBeVisible();

    await page.getByRole("navigation").getByRole("link", { name: "Back to the gym" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "BigO-Gym" })).toBeVisible();
  });

  test("opens with a Big-O primer covering the full answer set", async ({ page }) => {
    await page.goto("/refresher.html");
    const primer = page.locator(".refresher-primer");
    await expect(primer).toBeVisible();
    await expect(primer.getByRole("heading", { level: 2, name: "Big-O, briefly" })).toBeVisible();
    // One table row per complexity class in the gym's answer set.
    await expect(primer.locator("tbody tr")).toHaveCount(7);
    await expect(primer.getByText("O(n log n)")).toBeVisible();
    // Each class carries its spoken name.
    await expect(primer.getByText("linear time", { exact: true })).toBeVisible();
    await expect(primer.getByText("quadratic time")).toBeVisible();
    // The "look for loops" life-hack callout.
    const tip = primer.locator(".refresher-tip");
    await expect(
      tip.getByRole("heading", { level: 3, name: /where to look first/i }),
    ).toBeVisible();
    await expect(tip).toContainText(/loops are where time complexity comes from/i);
    await expect(tip).toContainText("O(1)");
    // The primer sits above the first shape card.
    const primerBox = await primer.boundingBox();
    const firstCardBox = await page.locator(".refresher-card").first().boundingBox();
    expect(primerBox!.y).toBeLessThan(firstCardBox!.y);
  });

  test("shows one card per catalogue shape, each with a before/after pair", async ({ page }) => {
    await page.goto("/refresher.html");
    const cards = page.locator(".refresher-card");
    await expect(cards).toHaveCount(8);
    // Every card: a heading, a giveaway, a fix, and two highlighted examples.
    for (const card of await cards.all()) {
      await expect(card.getByRole("heading", { level: 2 })).toBeVisible();
      await expect(card.getByText("Giveaway:")).toBeVisible();
      await expect(card.getByText("Fix:")).toBeVisible();
      await expect(card.locator("pre")).toHaveCount(2);
    }
    await expect(page.locator(".refresher-card .hljs-keyword").first()).toBeVisible();
    // Cards are separated by real breathing room, not touching borders.
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(second!.y - (first!.y + first!.height)).toBeGreaterThanOrEqual(16);
  });

  test("growing-call card counts the work only when the reader runs it", async ({ page }) => {
    await page.goto("/refresher.html");
    const card = page.locator("#growing-call-in-loop");
    const slider = card.getByRole("slider", { name: /input size/i });
    await expect(slider).toBeVisible();
    const results = card.locator(".demo-results");
    const output = card.locator("output");
    const runButton = card.getByRole("button", { name: "Run code" });

    // Nothing runs on load — the reader has to ask for it.
    await expect(results).toHaveCount(0);

    const setN = (value: number) =>
      slider.evaluate((el, v) => {
        (el as HTMLInputElement).value = String(v);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }, value);

    // n = 12 → pattern re-sums the prefix: 12·13/2 = 78 additions, the fix does 12.
    await setN(12);
    await expect(output).toHaveText("12");
    await runButton.click();
    await expect(results).toContainText("78");
    await expect(results).toContainText("12");

    // Changing n clears the stale counts until the reader runs it again.
    await setN(20);
    await expect(output).toHaveText("20");
    await expect(results).toHaveCount(0);

    // Larger n → the pattern's count balloons (20·21/2 = 210) while the fix
    // stays linear, so the gap widens.
    await runButton.click();
    await expect(results).toContainText("210");
    await expect(results).toContainText("20");
  });

  test("growing-call card can highlight the offending lines on demand", async ({ page }) => {
    await page.goto("/refresher.html");
    const card = page.locator("#growing-call-in-loop");
    const toggle = card.getByRole("button", { name: "Highlight problem code" });

    await expect(card.locator(".code-line-flagged")).toHaveCount(0);
    await toggle.click();
    await expect(card.locator(".code-line-flagged").first()).toBeVisible();

    // Toggling off clears the highlight again.
    await card.getByRole("button", { name: "Clear highlight" }).click();
    await expect(card.locator(".code-line-flagged")).toHaveCount(0);
  });

  test("reveal links to the actual shape's refresher card", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "O(n²)" }).check();
    await page.getByLabel("Which pattern is responsible?").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Reveal" }).click();

    await page.getByRole("link", { name: "Review this pattern in the refresher" }).click();
    await expect(page).toHaveURL(/refresher\.html#[a-z-]+$/);

    const hash = new URL(page.url()).hash.slice(1);
    const target = page.locator(`.refresher-card[id="${hash}"]`);
    await expect(target).toBeVisible();
    await expect(target).toBeInViewport();
  });

  test("stats shape names link to refresher cards", async ({ page }) => {
    await page.goto("/");
    const firstShapeLink = page.locator(".stats-table tbody a").first();
    await expect(firstShapeLink).toHaveAttribute("href", /refresher\.html#[a-z-]+$/);
  });

  test("gym progress survives a refresher round trip", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "O(n)", exact: true }).check();
    await page.getByLabel("Which pattern is responsible?").selectOption({ index: 2 });
    await page.getByRole("button", { name: "Reveal" }).click();

    await page.getByRole("link", { name: "Need a refresher?" }).click();
    await expect(page).toHaveURL(/refresher\.html$/);
    await page.getByRole("navigation").getByRole("link", { name: "Back to the gym" }).click();

    await expect(
      page.locator(".stats-table tbody tr td:first-of-type").filter({ hasText: /^1$/ }),
    ).toHaveCount(1);
  });
});
