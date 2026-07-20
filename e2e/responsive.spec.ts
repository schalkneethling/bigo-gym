import { expect, test } from "@playwright/test";

// The mobile layout leans on fluid type and stacked content; the only thing
// allowed to scroll sideways is a data table inside its own .table-scroll
// wrapper. The page itself must never overflow horizontally.
const paths = ["/", "/refresher.html"];
const widths = [320, 390];

test.describe("responsive layout", () => {
  for (const width of widths) {
    for (const path of paths) {
      test(`no horizontal page overflow at ${width}px on ${path}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      });
    }
  }

  test("the primer table scrolls inside its wrapper, not the page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/refresher.html");

    const scroller = page.locator(".refresher-primer .table-scroll");
    const { sw, cw } = await scroller.evaluate((el) => ({
      sw: el.scrollWidth,
      cw: el.clientWidth,
    }));
    // The wide table overflows its own wrapper (so it can scroll)…
    expect(sw).toBeGreaterThan(cw);
    // …while the page itself stays within the viewport.
    const pageScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(pageScrollWidth).toBeLessThanOrEqual(390);
  });
});
