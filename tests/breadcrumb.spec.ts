import { expect, type Locator, type Page } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/breadcrumb.md says: links look like Links, with their
// hover color, the current page is set apart by its weight, and separators
// keep their size and color. Only CSS decides them, so they're tested on the
// HTML playground.
const restyle = async (page: Page, part: Locator) => {
  await page.addStyleTag({ content: ".site-part { color: rgb(1, 2, 3); }" });
  await part.evaluate((node) => node.classList.add("site-part"));
  await expect(part).toHaveCSS("color", "rgb(1, 2, 3)");
};

onEachPlayground("breadcrumb", () => {
  test("a link takes Link's hover color, as a theme sets it", { tag: "@css" }, async ({ page }) => {
    const trail = await example(page, "breadcrumb-trail");
    await page.evaluate(() => document.documentElement.style.setProperty("--harmo-link-hover-color-text", "rgb(200, 0, 0)"));
    const link = trail.getByRole("link", { name: "Settings" });
    await link.hover();
    await expect(link).toHaveCSS("color", "rgb(200, 0, 0)");
  });

  test("the current page is a step heavier than the links, so its weight tells it apart", { tag: "@css" }, async ({ page }) => {
    const trail = await example(page, "breadcrumb-trail");
    const weight = (variable: string) =>
      page.evaluate((variable) => {
        const probe = document.createElement("span");
        document.body.append(probe);
        probe.style.fontWeight = `var(${variable})`;
        const value = getComputedStyle(probe).fontWeight;
        probe.remove();
        return value;
      }, variable);
    await expect(trail.getByRole("link", { name: "Settings" })).toHaveCSS("font-weight", await weight("--harmo-font-weight-normal"));
    await expect(trail.locator('[aria-current="page"]')).toHaveCSS("font-weight", await weight("--harmo-font-weight-medium"));
  });

  test("a separator is 1.125em, in the secondary text color, and a class of the app's own restyles it", { tag: "@css" }, async ({ page }) => {
    const trail = await example(page, "breadcrumb-trail");
    const separator = trail.locator(".hbreadcrumb-separator").first();
    const secondary = await page.evaluate(() => {
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.style.color = "var(--harmo-color-text-secondary)";
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    });
    await expect(separator).toHaveCSS("color", secondary);
    const size = await separator.evaluate((node) => parseFloat(getComputedStyle(node).fontSize) * 1.125);
    await expect(separator).toHaveCSS("width", `${size}px`);

    await page.addStyleTag({ content: ".hbreadcrumb-separator { color: rgb(0, 0, 200); }" });
    await expect(separator).toHaveCSS("color", "rgb(0, 0, 200)");
  });

  test("one class of yours on the page you're on restyles it", { tag: "@css" }, async ({ page }) => {
    await restyle(page, (await example(page, "breadcrumb-trail")).locator("[aria-current='page']"));
  });
});
