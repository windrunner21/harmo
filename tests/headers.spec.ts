import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/patterns/headers.md says: a site's header shows its menu and
// actions, or, 640px wide or less, a menu button that slides them in under
// the bar, the menu scrolling over the actions at the foot; an app's header
// has its search at the start, its list opening under it, counts the unread
// notifications on the bell, in an accent Badge, and in its name, and Mark
// all as read clears them; its Create opens a menu of links, aligned to
// its end; a sign-in page's header has its logo and one action.
onEachPlayground("headers", () => {
  test("scrolled, a site's header turns from clear to frosted, and moves away going down", async ({ page }) => {
    const container = await example(page, "headers-site-header");
    const header = container.locator(".hheader");
    const frame = container.locator('[style*="overflow-y"]').first();
    await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await frame.evaluate((element) => element.scrollTo(0, 400));
    await expect(header).toHaveAttribute("data-scrolled", "");
    await expect(header).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(header).toHaveAttribute("data-hidden", "");
  });

  test("a site's header shows its menu and actions where there's room, and is clear over the hero until the page scrolls", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "headers-site-header");
    const header = container.locator(".hheader");
    await expect(header.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Order now" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Menu" })).toBeHidden();
    await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await header.getByRole("button", { name: "Recipes" }).hover();
    await expect(header.getByRole("link", { name: /This week's menu/ })).toBeVisible();
    await expect(header.getByRole("link", { name: /This week's menu|For a crowd|From our kitchen|By cuisine/ }).locator(".hnavigation-menu-icon")).toHaveCount(4);
  });

  test("on a phone, the menu button slides the menu and actions in under the bar, turning into a close; Escape closes it and gives focus back", async ({ page }) => {
    const container = await example(page, "headers-site-header-on-a-phone");
    const menu = container.getByRole("button", { name: "Menu" });
    const panel = container.locator(".hsite-header-panel");
    await expect(container.locator(".hheader-bar > .hnavigation-menu")).toBeHidden();
    await expect(panel).toBeHidden();
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Stores" })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Order now" })).toBeVisible();
    await panel.getByRole("link", { name: "Stores" }).focus();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();
    await expect(menu).toBeFocused();
  });

  test("the phone's menu fills what's under the bar, its actions side by side, each as wide", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "headers-site-header-on-a-phone");
    await container.getByRole("button", { name: "Menu" }).click();
    const panel = container.locator(".hsite-header-panel");
    await expect(panel).toHaveCSS("translate", "none");
    const [frame, header, box, signIn, order] = await Promise.all([
      container.locator('[style*="overflow-y"]').boundingBox(),
      container.locator(".hheader").boundingBox(),
      panel.boundingBox(),
      panel.getByRole("link", { name: "Sign in" }).boundingBox(),
      panel.getByRole("link", { name: "Order now" }).boundingBox(),
    ]);
    expect(Math.round(box!.x)).toBe(Math.round(header!.x));
    expect(Math.round(box!.width)).toBe(Math.round(header!.width));
    expect(Math.round(box!.y + box!.height)).toBe(Math.round(frame!.y + frame!.height - 1));
    expect(Math.round(signIn!.y)).toBe(Math.round(order!.y));
    expect(Math.round(signIn!.width)).toBe(Math.round(order!.width));
  });

  test("a long phone menu scrolls on its own, its actions staying at the foot", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "headers-site-header-on-a-phone");
    await container.getByRole("button", { name: "Menu" }).click();
    const panel = container.locator(".hsite-header-panel");
    const menu = panel.locator(".hsite-header-panel-menu");
    const order = panel.getByRole("link", { name: "Order now" });
    await expect(panel).toHaveCSS("translate", "none");
    const before = await order.boundingBox();
    await menu.getByRole("button", { name: "Recipes" }).click();
    await expect(menu.getByRole("link", { name: "For a crowd" })).toBeVisible();
    await expect.poll(() => menu.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    await menu.evaluate((element) => element.scrollTo(0, element.scrollHeight));
    await expect(menu.getByRole("link", { name: "Help" })).toBeInViewport();
    expect(await order.boundingBox()).toEqual(before);
  });

  test("an app's bell counts the unread, and Mark all as read clears them", async ({ page }) => {
    const container = await example(page, "headers-app-header");
    const bell = container.getByRole("button", { name: "Notifications, 2 unread" });
    await expect(bell.locator(".hbadge")).toHaveText("2");
    await bell.click();
    const popup = page.locator(".happ-header-notifications:popover-open");
    await expect(popup.getByRole("link")).toHaveCount(3);
    await expect(popup.getByRole("img", { name: "Unread" })).toHaveCount(2);
    await expect(popup.getByRole("img", { name: "Unread" }).first()).toHaveAttribute("data-variant", "accent");
    await popup.getByRole("button", { name: "Mark all as read" }).click();
    await expect(popup.getByRole("img", { name: "Unread" })).toHaveCount(0);
    await expect(popup.getByRole("button", { name: "Mark all as read" })).toHaveCount(0);
    await expect(container.getByRole("button", { name: "Notifications", exact: true }).locator(".hbadge")).toHaveCount(0);
    // It went, so focus went to the first notification, not nowhere.
    await expect(popup.getByRole("link").first()).toBeFocused();
  });

  test("Tab past the phone menu's last action closes it, so it never covers what has focus", async ({ page }) => {
    const container = await example(page, "headers-site-header-on-a-phone");
    const menu = container.getByRole("button", { name: "Menu" });
    const panel = container.locator(".hsite-header-panel");
    await menu.click();
    await expect(panel).toBeVisible();
    await panel.getByRole("link", { name: "Order now" }).focus();
    await page.keyboard.press("Tab");
    await expect(panel).toBeHidden();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  });

  test("a section left open in the closed phone menu doesn't keep the header from hiding", async ({ page }) => {
    const container = await example(page, "headers-site-header-on-a-phone");
    const header = container.locator(".hheader");
    const menu = container.getByRole("button", { name: "Menu" });
    const panel = container.locator(".hsite-header-panel");
    await menu.click();
    await panel.getByRole("button", { name: "Recipes" }).click();
    await expect(panel.getByRole("button", { name: "Recipes" })).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await menu.blur();
    await container.locator('[style*="overflow-y"]').first().evaluate((element) => element.scrollTo(0, 400));
    await expect(header).toHaveAttribute("data-hidden", "");
  });

  test("an app's search is at the start, and opens its list under it", async ({ page }) => {
    const container = await example(page, "headers-app-header");
    await expect(container.locator(".hheader-brand")).toHaveCount(0);
    await expect(container.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "#settings");
    await expect(container.getByRole("button", { name: /Notifications/ }).locator(".hbadge")).toHaveAttribute("data-variant", "accent");
    const search = container.getByRole("combobox", { name: "Search" });
    await expect(search).toHaveAttribute("placeholder", "Search");
    await search.click();
    const list = page.getByRole("listbox", { name: "Search" });
    await expect(list).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const [field, box] = await Promise.all([search.locator("..").boundingBox(), list.boundingBox()]);
    expect(box!.y).toBeGreaterThan(field!.y + field!.height);
  });

  test("an app's search opens with /", async ({ page }) => {
    const container = await example(page, "headers-app-header");
    const search = container.getByRole("combobox", { name: "Search" });
    const list = page.getByRole("listbox", { name: "Search" });
    await expect(search).toHaveAttribute("aria-keyshortcuts", "/");
    await expect(container.locator(".happ-header-search .hkbd")).toHaveText("/");
    await page.keyboard.press("/");
    await expect(search).toBeFocused();
    await expect(list).toBeVisible();
  });

  test("an app's Create is a 24px circle, 34px to press, opening a menu of links; it and the notifications line up with their button's end", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "headers-app-header");
    const frame = await container.locator(".happ-header").boundingBox();
    // Its hairline from the start, bordered, before anything has scrolled.
    await expect(container.locator(".happ-header")).toHaveAttribute("data-bordered", "");
    await expect(container.locator(".happ-header")).not.toHaveCSS("border-bottom-color", "rgba(0, 0, 0, 0)");
    const create = container.getByRole("button", { name: "Create" });
    const circle = await create.boundingBox();
    expect(Math.round(circle!.width)).toBe(24);
    expect(Math.round(circle!.height)).toBe(24);
    await expect(create).toHaveAttribute("data-shape", "circle");
    await expect(create).toHaveAttribute("data-size", "xsmall");
    await expect(create).toHaveAttribute("aria-haspopup", "menu");
    const reached = await create.evaluate((button) => {
      const box = button.getBoundingClientRect();
      return [[box.right + 4.5, box.bottom + 4.5], [box.left - 4.5, box.top - 4.5]].every(([x, y]) => document.elementFromPoint(x, y) === button) && document.elementFromPoint(box.right + 5.5, box.top + 12) !== button;
    });
    expect(reached).toBe(true);
    for (const [name, popup] of [
      ["Create", ".happ-header-create-menu"],
      [/Notifications/, ".happ-header-notifications"],
    ] as const) {
      const button = container.getByRole("button", { name });
      await button.click();
      const open = page.locator(`${popup}:popover-open`);
      await expect(open).toHaveCSS("opacity", "1");
      const [trigger, box] = await Promise.all([button.boundingBox(), open.boundingBox()]);
      expect(Math.round(box!.x + box!.width)).toBe(Math.round(trigger!.x + trigger!.width));
      expect(box!.x + box!.width).toBeLessThanOrEqual(frame!.x + frame!.width);
      if (name === "Create") await expect(page.getByRole("menu", { name: "Create" }).getByRole("menuitem")).toHaveText(["Order", "Customer", "Campaign"]);
      await page.keyboard.press("Escape");
      await expect(open).toHaveCount(0);
    }
  });

  test("a sign-in page's header has its logo, home, and one action, and scrolls away", async ({ page }) => {
    const container = await example(page, "headers-simple-header");
    const header = container.locator(".hheader");
    await expect(header.getByRole("link", { name: "Speedwagon" })).toHaveAttribute("href", "#top");
    await expect(header.getByRole("link", { name: "Need help?" })).toBeVisible();
    await expect(header).toHaveAttribute("data-scroll", "away");
    const before = await header.boundingBox();
    await container.locator('[style*="overflow-y"]').first().evaluate((element) => element.scrollTo(0, 100));
    await expect.poll(async () => Math.round(before!.y - (await header.boundingBox())!.y)).toBe(100);
  });
});
