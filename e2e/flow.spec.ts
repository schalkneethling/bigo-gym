import { expect, test } from "@playwright/test";

test.describe("predict-then-reveal flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows a highlighted snippet and hides the answer until submit", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "BigO-Gym" })).toBeVisible();
    await expect(page.locator("pre.snippet code")).toBeVisible();
    // Real syntax highlighting, not a plain text dump.
    await expect(page.locator("pre.snippet .hljs-keyword").first()).toBeVisible();
    // Nothing revealed before a prediction is submitted.
    await expect(page.locator(".reveal")).toHaveCount(0);
    await expect(page.locator(".explanation")).toHaveCount(0);
  });

  test("requires both predictions before revealing", async ({ page }) => {
    await page.getByRole("button", { name: "Reveal" }).click();
    // Native form validation blocks the submit; still no reveal.
    await expect(page.locator(".reveal")).toHaveCount(0);
  });

  test("reveals complexity, shape, and explanation after a prediction", async ({ page }) => {
    await page.getByRole("radio", { name: "O(n²)" }).check();
    await page.getByLabel("Which pattern is responsible?").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Reveal" }).click();

    const reveal = page.locator(".reveal");
    await expect(reveal).toBeVisible();
    await expect(reveal.getByText("Actual complexity")).toBeVisible();
    await expect(reveal.getByText("Pattern", { exact: true })).toBeVisible();
    await expect(reveal.locator(".explanation")).not.toBeEmpty();
  });

  test("logs the attempt into per-shape stats and persists across reload", async ({ page }) => {
    const statsTable = page.locator(".stats-table");
    await expect(statsTable).toBeVisible();
    // Eight catalogue shapes, all listed even before any attempts.
    await expect(statsTable.locator("tbody tr")).toHaveCount(8);
    await expect(statsTable.locator("tbody .num").first()).toHaveText("0");

    await page.getByRole("radio", { name: "O(n)", exact: true }).check();
    await page.getByLabel("Which pattern is responsible?").selectOption({ index: 2 });
    await page.getByRole("button", { name: "Reveal" }).click();

    // Exactly one shape bucket now shows one attempt.
    const attemptCells = statsTable.locator("tbody tr td:first-of-type");
    await expect(attemptCells.filter({ hasText: /^1$/ })).toHaveCount(1);

    await page.reload();
    await expect(
      page.locator(".stats-table tbody tr td:first-of-type").filter({ hasText: /^1$/ }),
    ).toHaveCount(1);
  });

  test("moves to a fresh snippet with a cleared form", async ({ page }) => {
    const firstCode = await page.locator("pre.snippet code").innerText();

    await page.getByRole("radio", { name: "O(n log n)" }).check();
    await page.getByLabel("Which pattern is responsible?").selectOption({ index: 3 });
    await page.getByRole("button", { name: "Reveal" }).click();
    await page.getByRole("button", { name: "Next snippet" }).click();

    await expect(page.locator(".reveal")).toHaveCount(0);
    const secondCode = await page.locator("pre.snippet code").innerText();
    expect(secondCode).not.toBe(firstCode);
    // The form comes back unfilled.
    for (const radio of await page.getByRole("radio").all()) {
      await expect(radio).not.toBeChecked();
    }
    await expect(page.getByLabel("Which pattern is responsible?")).toHaveValue("");
  });
});
