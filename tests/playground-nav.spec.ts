import { expect } from "@playwright/test";
import { onEachPlayground, playgrounds, test, url } from "./playgrounds.ts";

// The playgrounds' own navigation is Harmo's Sidebar: the overview and every
// group of the catalog, the page you're on marked; on a narrow screen, the
// menu button opens it as a sheet from the side. Both playgrounds build the
// same nav, from examples/playground.ts, so how it looks, which only CSS and
// the markup decide, is tested on the HTML playground.
onEachPlayground("button", () => {
  test("the nav is a Sidebar, with the page you're on marked", { tag: "@css" }, async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    const nav = page.getByRole("navigation", { name: "Components" });
    await expect(nav).toHaveClass(/hsidebar-nav/);
    await expect(nav.getByRole("link", { name: "Button", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("list", { name: "Forms" })).toBeVisible();
    await expect(page.locator(".play-menu-button")).toBeHidden();
    // Beside the page, under the header, as tall as the window below it.
    const box = await page.locator(".play-nav").boundingBox();
    expect(box?.width).toBeCloseTo(240, 0);
  });

  test("on a narrow screen, the menu button opens it as a sheet, and Escape closes it", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const sheet = page.locator(".play-nav");
    await expect(sheet).toBeHidden();
    await page.locator(".play-menu-button").click();
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("navigation", { name: "Components" }).getByRole("link", { name: "Overview" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });
});

// An example's code waits in a template until its panel opens, so a page
// doesn't lay out every highlighted token as it loads; then it shows.
for (const playground of playgrounds) {
  test.describe(playground, () => {
    test("an example's code fills its panel once it opens", async ({ page }) => {
      await page.goto(url(playground, "button"));
      const panel = page.locator(".play-code").first();
      const code = panel.locator("code");
      await expect(code).toBeEmpty();
      await panel.locator("summary").click();
      await expect(code).toContainText(playground === "html" ? 'class="hbutton"' : "<Button");
      await expect(panel.locator("template")).toHaveCount(0);
    });
  });
}
