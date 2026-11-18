import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/account-menu.md says: a button named by who's signed
// in opens a Dropdown Menu of what's theirs, its chevron turning; with
// profile, the menu starts with who's signed in; many accounts go in a
// submenu, scrolling with arrows; its avatar is 32px, and a long name is cut
// short with an ellipsis. Collapsed in a Sidebar, it's the avatar alone,
// tested on the Sidebar's page.
onEachPlayground("account-menu", () => {
  test("its button, named by who's signed in, opens their menu, which it names", async ({ page }) => {
    const container = await example(page, "account-menu-default");
    const button = container.getByRole("button", { name: "Imran Hajiyev Speedwagon" });
    await expect(button).toHaveAttribute("aria-haspopup", "menu");
    await button.click();
    const menu = page.getByRole("menu", { name: "Imran Hajiyev Speedwagon" });
    await expect(menu).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("group", { name: "Switch account" }).getByRole("menuitem")).toHaveText([
      "Joestar Group",
      "Stardust Travel",
    ]);
    await expect(menu.getByRole("menuitem")).toHaveText(["Settings", "Joestar Group", "Stardust Travel", "Profile", "Sign out"]);
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });

  test("with profile, the menu starts with who's signed in again, which the keys pass by", async ({ page }) => {
    const container = await example(page, "account-menu-profile");
    await container.getByRole("button", { name: "Imran Hajiyev Speedwagon" }).focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu", { name: "Imran Hajiyev Speedwagon" });
    await expect(menu.getByRole("menuitem", { name: "Settings" })).toBeFocused();
    await expect(menu.locator(".haccount-menu-profile .haccount-menu-name")).toHaveText("Imran Hajiyev");
    await expect(menu.locator(".haccount-menu-profile .haccount-menu-description")).toHaveText("Speedwagon");
    await expect(menu.locator(".haccount-menu-profile .havatar")).toBeVisible();
    await expect(menu.getByRole("menuitem")).toHaveText(["Settings", "Profile", "Sign out"]);
  });

  test("many accounts go in a submenu, at most 400px tall, every one reachable, scrolling with arrows", async ({ page }) => {
    const container = await example(page, "account-menu-many-accounts");
    await container.getByRole("button", { name: "Imran Hajiyev Speedwagon" }).focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu", { name: "Imran Hajiyev Speedwagon" });
    await expect(menu.getByRole("menuitem", { name: "Settings" })).toBeFocused();
    await expect(menu.locator(":scope > .hdropdown-menu-item")).toHaveText(["Settings", "Other accounts", "Imran Hajiyev", "Sign out"]);
    await page.keyboard.press("o");
    await expect(menu.getByRole("menuitem", { name: "Other accounts" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    const accounts = page.getByRole("menu", { name: "Other accounts" });
    // It takes focus as it has opened, on its toggle event.
    await expect(accounts.getByRole("menuitem", { name: "Joestar Group" })).toBeFocused();
    await expect(accounts.getByRole("menuitem")).toHaveCount(12);
    // The menu itself fits: no arrows.
    await expect(menu.locator(":scope > .hdropdown-menu-scroll:visible")).toHaveCount(0);
    const up = accounts.locator('.hdropdown-menu-scroll[data-direction="up"]');
    const down = accounts.locator('.hdropdown-menu-scroll[data-direction="down"]');
    await expect(up).toBeHidden();
    await expect(down).toBeVisible();
    await page.keyboard.press("End");
    const last = accounts.getByRole("menuitem", { name: "Sandman Couriers" });
    await expect(last).toBeFocused();
    await expect(down).toBeHidden();
    await expect(up).toBeVisible();
    // Inside the submenu's box and the window, where it's shown.
    const [box, item] = await boxes(accounts, last);
    // Rounded, as Firefox can measure it a hair over.
    expect(Math.round(box.height)).toBeLessThanOrEqual(400);
    expect(item.y).toBeGreaterThanOrEqual(box.y);
    expect(item.y + item.height).toBeLessThanOrEqual(box.y + box.height);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await page.keyboard.press("t");
    await expect(accounts.getByRole("menuitem", { name: "Trattoria Trussardi" })).toBeFocused();
  });

  test("on a phone, with no room beside the menu, the submenu opens over it, inside the window", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    const container = await example(page, "account-menu-many-accounts");
    await container.getByRole("button", { name: "Imran Hajiyev Speedwagon" }).focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu", { name: "Imran Hajiyev Speedwagon" });
    await expect(menu.getByRole("menuitem", { name: "Settings" })).toBeFocused();
    await page.keyboard.press("o");
    await page.keyboard.press("ArrowRight");
    const accounts = page.getByRole("menu", { name: "Other accounts" });
    await expect(accounts.getByRole("menuitem", { name: "Joestar Group" })).toBeFocused();
    await settled(accounts);
    const [box] = await boxes(accounts);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(700);
  });

  test("a 32px avatar, and the menu under the button, at least as wide", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "account-menu-default");
    const button = container.locator(".haccount-menu");
    const [avatar] = await boxes(button.locator(".havatar"));
    expect([Math.round(avatar.width), Math.round(avatar.height)]).toEqual([32, 32]);
    await button.click();
    const menu = container.locator(".hdropdown-menu");
    await expect(menu).toBeVisible();
    await settled(menu);
    const [trigger, opened] = await boxes(button, menu);
    expect(opened.y).toBeGreaterThan(trigger.y + trigger.height);
    expect(Math.round(opened.x)).toBe(Math.round(trigger.x));
    expect(opened.width).toBeGreaterThanOrEqual(trigger.width - 0.5);
  });

  test("a long name, and the line under it, are cut short with an ellipsis", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "account-menu-initials");
    for (const part of [".haccount-menu-name", ".haccount-menu-description"]) {
      const text = container.locator(part);
      await expect(text).toHaveCSS("text-overflow", "ellipsis");
      expect(await text.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    }
  });
});
