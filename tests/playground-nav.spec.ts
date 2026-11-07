import { expect } from "@playwright/test";
import { onEachPlayground, test } from "./playgrounds.ts";

// The playgrounds' own navigation is Harmo's Sidebar: the overview and every
// group of the catalog, the page you're on marked; on a narrow screen, the
// menu button opens it as a sheet from the side.
onEachPlayground("button", () => {
  test("the nav is a Sidebar, with the page you're on marked", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    const nav = page.getByRole("navigation", { name: "Components" });
    await expect(nav).toHaveClass(/hsidebar-nav/);
    await expect(nav.getByRole("link", { name: "Button" })).toHaveAttribute("aria-current", "page");
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
