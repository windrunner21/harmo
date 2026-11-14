import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/breadcrumb.md says: links look like Links, with their
// hover color, and separators keep their size and color.
onEachPlayground("breadcrumb", () => {
  test("a link takes Link's hover color, as a theme sets it", async ({ page }) => {
    const trail = await example(page, "breadcrumb-trail");
    await page.evaluate(() => document.documentElement.style.setProperty("--harmo-link-hover-color-text", "rgb(200, 0, 0)"));
    const link = trail.getByRole("link", { name: "Settings" });
    await link.hover();
    await expect(link).toHaveCSS("color", "rgb(200, 0, 0)");
  });

  test("a separator is 1.125em, in the secondary text color, and a class of the app's own restyles it", async ({ page }) => {
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
});
