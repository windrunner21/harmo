import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, clickAt, colorOf, example, onEachPlayground, pointAt, ready, settled, test } from "./playgrounds.ts";

// What docs/components/dropdown-menu.md says: a trigger opens a menu of items,
// focus going to the first from the keys and to the menu from the pointer;
// the arrows, Home, End, and typing move focus, which the mouse moves too;
// choosing an item closes it, focus going back to the trigger; Escape closes
// it, and Tab closes it and moves on. What only CSS decides, such as its
// rows and colors, is tested on the HTML playground.
const focused = (page: Page) => page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");

const parts = async (page: Page, id: string, name: string) => {
  const container = await example(page, id);
  const trigger = container.getByRole("button", { name, exact: true });
  const menu = page.getByRole("menu", { name });
  return { container, trigger, menu };
};

const opened = async (menu: Locator) => {
  await expect(menu).toBeVisible();
  await settled(menu);
};

// Marks where Tab goes from the trigger while its menu is closed, so a test
// can check Tab from the open menu goes there too.
const markNextAfter = async (page: Page, trigger: Locator) => {
  await trigger.focus();
  await page.keyboard.press("Tab");
  await page.evaluate(() => document.activeElement?.setAttribute("data-test-next", ""));
  await trigger.focus();
  return page.locator("[data-test-next]");
};

onEachPlayground("dropdown-menu", () => {
  test("its trigger says it opens a menu, which it names; the items are menu items, out of the Tab order", async ({ page }) => {
    const { trigger, menu } = await parts(page, "dropdown-menu-actions", "Actions");
    await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await opened(menu);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("menuitem")).toHaveText(["Edit", "Duplicate", "Share", "Delete"]);
    for (const item of await menu.getByRole("menuitem").all()) await expect(item).toHaveAttribute("tabindex", "-1");
    await expect(menu.getByRole("separator")).toHaveCount(1);
  });

  test("Enter opens it on the first item; the arrows move focus, stopping at the ends; Home and End; Escape closes it, focus back on the trigger", async ({ page }) => {
    const { trigger, menu } = await parts(page, "dropdown-menu-actions", "Actions");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await opened(menu);
    expect(await focused(page)).toBe("Edit");
    await page.keyboard.press("ArrowUp");
    expect(await focused(page)).toBe("Edit");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    expect(await focused(page)).toBe("Share");
    await page.keyboard.press("End");
    expect(await focused(page)).toBe("Delete");
    await page.keyboard.press("ArrowDown");
    expect(await focused(page)).toBe("Delete");
    await page.keyboard.press("Home");
    expect(await focused(page)).toBe("Edit");
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("↑ opens it on the last item, ↓ on the first; a letter goes to the item that starts with it", async ({ page }) => {
    const { trigger, menu } = await parts(page, "dropdown-menu-actions", "Actions");
    await trigger.focus();
    await page.keyboard.press("ArrowUp");
    await opened(menu);
    expect(await focused(page)).toBe("Delete");
    await page.keyboard.press("s");
    expect(await focused(page)).toBe("Share");
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await page.keyboard.press("ArrowDown");
    await opened(menu);
    expect(await focused(page)).toBe("Edit");
  });

  test("Enter on an item chooses it: its action runs, the menu closes, and focus goes back to the trigger", async ({ page }) => {
    const { container, trigger, menu } = await parts(page, "dropdown-menu-actions", "Actions");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await opened(menu);
    await page.keyboard.press("d");
    await page.keyboard.press("Enter");
    await expect(menu).toBeHidden();
    await expect(container.getByText("Chose Duplicate")).toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test("clicked, focus goes to the menu; the mouse moves focus over the items; a click chooses one", async ({ page }) => {
    const { container, trigger, menu } = await parts(page, "dropdown-menu-actions", "Actions");
    await trigger.click();
    await opened(menu);
    await expect(menu).toBeFocused();
    await pointAt(page, menu.getByRole("menuitem", { name: "Share" }));
    await expect(menu.getByRole("menuitem", { name: "Share" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    expect(await focused(page)).toBe("Delete");
    await clickAt(page, menu.getByRole("menuitem", { name: "Edit" }));
    await expect(menu).toBeHidden();
    await expect(container.getByText("Chose Edit")).toBeVisible();
  });

  test("Tab closes it and moves on from the trigger, to what Tab reaches from it", async ({ page }) => {
    const { trigger, menu } = await parts(page, "dropdown-menu-actions", "Actions");
    const next = await markNextAfter(page, trigger);
    await page.keyboard.press("Enter");
    await opened(menu);
    await page.keyboard.press("Tab");
    await expect(menu).toBeHidden();
    await expect(next).toBeFocused();
  });

  test("the keys pass by a disabled item", async ({ page }) => {
    const { container, trigger, menu } = await parts(page, "dropdown-menu-actions", "Actions");
    // By its class, as a closed menu's items aren't found by their role.
    await container
      .locator(".hdropdown-menu-item", { hasText: "Duplicate" })
      .evaluate((item) => ((item as HTMLButtonElement).disabled = true));
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(menu.getByRole("menuitem", { name: "Edit" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem", { name: "Share" })).toBeFocused();
    await page.keyboard.press("d");
    await expect(menu.getByRole("menuitem", { name: "Delete" })).toBeFocused();
  });

  test("Space follows a link, as Enter does, and closes it; a group is named by its label", async ({ page }) => {
    const { trigger, menu } = await parts(page, "dropdown-menu-groups", "More");
    await trigger.click();
    await opened(menu);
    await expect(menu.getByRole("group", { name: "Workspace" }).getByRole("menuitem")).toHaveText(["Settings", "Members", "Billing"]);
    await expect(menu.getByRole("group", { name: "Account" }).getByRole("menuitem")).toHaveText(["Profile", "Sign out"]);
    const members = menu.getByRole("menuitem", { name: "Members" });
    // The playground keeps a demo's links from leaving the page, so the
    // click is what's checked.
    await members.evaluate((link) =>
      link.addEventListener("click", () => link.setAttribute("data-clicked", ""), { once: true }),
    );
    await members.focus();
    await page.keyboard.press(" ");
    await expect(menu).toBeHidden();
    await expect(page.locator(".hdropdown-menu [data-clicked]")).toHaveCount(1);
  });

  test("pointed at, a submenu's item opens it 100ms later, focus staying on the item; resting on another item closes it 200ms later, unless the pointer reaches it first", async ({ page }) => {
    // Time stands still once the menu has opened, and moves only as told.
    await page.clock.install();
    await page.reload();
    await ready(page);
    const { trigger, menu } = await parts(page, "dropdown-menu-with-a-submenu", "Ticket");
    await trigger.click();
    await opened(menu);
    const share = menu.getByRole("menuitem", { name: "Share" });
    const sub = page.getByRole("menu", { name: "Share" });
    const center = async (element: Locator) => {
      const [box] = await boxes(element);
      return [box.x + box.width / 2, box.y + box.height / 2] as const;
    };
    const [shareX, shareY] = await center(share);
    const [editX, editY] = await center(menu.getByRole("menuitem", { name: "Edit" }));
    await page.clock.pauseAt(Date.now() + 1000);
    await page.mouse.move(shareX, shareY);
    await expect(share).toBeFocused();
    await page.clock.runFor(99);
    await expect(sub).toBeHidden();
    await page.clock.runFor(1);
    await expect(sub).toBeVisible();
    await expect(share).toHaveAttribute("aria-expanded", "true");
    await page.mouse.move(editX, editY);
    await page.clock.runFor(199);
    await expect(sub).toBeVisible();
    await page.clock.runFor(1);
    await expect(sub).toBeHidden();
    await expect(menu).toBeVisible();
    // Across Edit and on into the submenu before its 200ms are up: it stays.
    await page.mouse.move(shareX, shareY);
    await page.clock.runFor(100);
    await expect(sub).toBeVisible();
    const [emailX, emailY] = await center(sub.getByRole("menuitem", { name: "Email" }));
    await page.mouse.move(editX, editY);
    await page.clock.runFor(50);
    await page.mouse.move(emailX, emailY);
    await page.clock.runFor(500);
    await expect(sub).toBeVisible();
  });

  test("a submenu opened with → stays open though a hover's timer was running; Enter on its item, opened by hover, goes into it", async ({ page }) => {
    const { trigger, menu } = await parts(page, "dropdown-menu-with-a-submenu", "Ticket");
    await trigger.click();
    await opened(menu);
    const share = menu.getByRole("menuitem", { name: "Share" });
    const sub = page.getByRole("menu", { name: "Share" });
    const email = sub.getByRole("menuitem", { name: "Email" });
    // The pointer on Share starts its 100ms; → opens it at once.
    const [box] = await boxes(share);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.keyboard.press("ArrowRight");
    await expect(email).toBeFocused();
    await page.waitForTimeout(300);
    await expect(sub).toBeVisible();
    await expect(email).toBeFocused();
    // Back on Share, with the submenu open from the pointer: Enter goes in.
    await page.keyboard.press("ArrowLeft");
    await expect(share).toBeFocused();
    await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2);
    await expect(sub).toBeVisible();
    await expect(share).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(email).toBeFocused();
  });

  test("→ opens a submenu on its first item; ↓ moves in it; ← closes it, back on its item; Escape closes only it", async ({ page }) => {
    const { trigger, menu } = await parts(page, "dropdown-menu-with-a-submenu", "Ticket");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await opened(menu);
    await page.keyboard.press("ArrowDown");
    expect(await focused(page)).toBe("Share");
    const sub = page.getByRole("menu", { name: "Share" });
    const share = menu.getByRole("menuitem", { name: "Share" });
    // A submenu takes focus as it has opened, on its toggle event.
    await page.keyboard.press("ArrowRight");
    await expect(sub.getByRole("menuitem", { name: "Email" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(sub.getByRole("menuitem", { name: "Message" })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(sub).toBeHidden();
    await expect(share).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(sub.getByRole("menuitem", { name: "Email" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(sub).toBeHidden();
    await expect(menu).toBeVisible();
    await expect(share).toBeFocused();
  });

  test("choosing in a submenu closes both, focus back on the trigger; Tab in one closes both too, moving on from the trigger", async ({ page }) => {
    const { container, trigger, menu } = await parts(page, "dropdown-menu-with-a-submenu", "Ticket");
    const next = await markNextAfter(page, trigger);
    await page.keyboard.press("Enter");
    await opened(menu);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    const sub = page.getByRole("menu", { name: "Share" });
    await expect(sub.getByRole("menuitem", { name: "Email" })).toBeFocused();
    await page.keyboard.press("c");
    await expect(sub.getByRole("menuitem", { name: "Copy link" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(menu).toBeHidden();
    await expect(container.getByText("Chose Copy link")).toBeVisible();
    await expect(trigger).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await opened(menu);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    await expect(sub.getByRole("menuitem", { name: "Email" })).toBeFocused();
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.querySelectorAll(".hdropdown-menu:popover-open").length)).toBe(0);
    await expect(next).toBeFocused();
  });

  test("a submenu opens beside its item, 4px past the menu's edge, its first item level with it", { tag: "@css" }, async ({ page }) => {
    const { trigger, menu } = await parts(page, "dropdown-menu-with-a-submenu", "Ticket");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await opened(menu);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    const sub = page.getByRole("menu", { name: "Share" });
    await expect(sub.getByRole("menuitem", { name: "Email" })).toBeFocused();
    await opened(sub);
    const [outer, share, inner, email] = await boxes(menu, menu.getByRole("menuitem", { name: "Share" }), sub, sub.getByRole("menuitem", { name: "Email" }));
    expect(Math.round(inner.x - (outer.x + outer.width))).toBe(4);
    expect(Math.round(email.y)).toBe(Math.round(share.y));
    // Closing, pinned where it is, it fades without sliding.
    await page.keyboard.press("Escape");
    const closing = page.locator(".hdropdown-menu .hdropdown-menu[data-pinned]");
    await expect(closing).toHaveCount(1);
    expect(await closing.evaluate((element) => getComputedStyle(element).getPropertyValue("--hpopup-slide").trim())).toBe("0px");
  });

  test("its rows are 37px, the one with focus on the hover background; a destructive one is red", { tag: "@css" }, async ({ page }) => {
    const { trigger, menu } = await parts(page, "dropdown-menu-actions", "Actions");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await opened(menu);
    const edit = menu.getByRole("menuitem", { name: "Edit" });
    const [row] = await boxes(edit);
    expect(Math.round(row.height)).toBe(37);
    await expect(edit).toHaveCSS("background-color", await colorOf(page, "var(--harmo-color-background-hover)"));
    const remove = menu.getByRole("menuitem", { name: "Delete" });
    await expect(remove).toHaveCSS("color", await colorOf(page, "var(--harmo-color-danger)"));
    await page.keyboard.press("End");
    await expect(remove).toHaveCSS("background-color", await colorOf(page, "var(--harmo-color-danger-background)"));
    const [box] = await boxes(menu);
    expect(box.width).toBeGreaterThanOrEqual(128);
  });

  test("aligned to its end, its end lines up with its round, 24px trigger's", { tag: "@css" }, async ({ page }) => {
    const { trigger, menu } = await parts(page, "dropdown-menu-aligned-to-its-end", "Create");
    await trigger.click();
    await opened(menu);
    const [t, m] = await boxes(trigger, menu);
    expect(Math.round(t.width)).toBe(24);
    expect(m.x + m.width).toBeCloseTo(t.x + t.width, 0);
    await expect(menu.getByRole("menuitem")).toHaveText(["Order", "Customer", "Campaign"]);
  });
});
