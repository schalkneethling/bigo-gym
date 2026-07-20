import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility validation of the rendered DOM — the markup the Lit
 * components actually emit (form, native controls, table, live region), which
 * the static html-validate pass over the source files never sees. Scoped to
 * WCAG 2.0/2.1 A and AA, the levels this project targets.
 */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function audit(page: import("@playwright/test").Page) {
  return new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
}

test.describe("accessibility", () => {
  test("gym page, predict state has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("pre.snippet code")).toBeVisible();
    const results = await audit(page);
    expect(results.violations).toEqual([]);
  });

  test("gym page, reveal state has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "O(n²)" }).check();
    await page.getByLabel("Which pattern is responsible?").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Reveal" }).click();
    await expect(page.locator(".reveal")).toBeVisible();
    const results = await audit(page);
    expect(results.violations).toEqual([]);
  });

  test("refresher page has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/refresher.html");
    await expect(page.locator(".refresher-primer")).toBeVisible();
    const results = await audit(page);
    expect(results.violations).toEqual([]);
  });
});
