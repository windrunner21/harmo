import { expect, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/filter-bar.md says: links in a named nav, or buttons in
// a named group; each named by its label and count; one in force; cards of one
// width that wrap; and right to left, from the right.
const color = (page: Page, name: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("span");
    document.body.append(probe);
    probe.style.color = `var(${name})`;
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, name);

onEachPlayground("filter-bar", () => {
  test("links in a named nav, each named by its label and count, with one in force", async ({ page }) => {
    const container = await example(page, "filter-bar-default");
    const nav = container.getByRole("navigation", { name: "Task status" });
    const all = nav.getByRole("link", { name: "All 128" });
    const active = nav.getByRole("link", { name: "Active 37" });
    await expect(all).toHaveAttribute("aria-current", "true");
    await expect(active).not.toHaveAttribute("aria-current");
    await expect(active).toHaveAttribute("href", "?status=active");
  });

  test("the sizes, and the filter in force in the accent, with a heavier label", async ({ page }) => {
    const container = await example(page, "filter-bar-default");
    const [all, active] = await container.getByRole("link").all();
    const primary = await color(page, "--harmo-color-primary");
    await expect(all!).toHaveCSS("padding", "12px 16px");
    await expect(all!.locator(".hfilter-bar-label")).toHaveCSS("font-size", "14px");
    await expect(all!.locator(".hfilter-bar-count")).toHaveCSS("font-size", "20px");

    await expect(all!).toHaveCSS("border-top-color", primary);
    await expect(all!.locator(".hfilter-bar-label")).toHaveCSS("color", primary);
    await expect(all!.locator(".hfilter-bar-count")).toHaveCSS("color", primary);
    await expect(all!.locator(".hfilter-bar-label")).toHaveCSS("font-weight", "500");

    await expect(active!).toHaveCSS("border-top-color", await color(page, "--harmo-color-border"));
    await expect(active!.locator(".hfilter-bar-label")).toHaveCSS("font-weight", "400");
    await expect(active!.locator(".hfilter-bar-count")).toHaveCSS("color", await color(page, "--harmo-color-text"));
  });

  test("a click moves which is in force, and only one is", async ({ page }) => {
    const container = await example(page, "filter-bar-default");
    await container.getByRole("link", { name: /^Blocked/ }).click();
    await expect(container.getByRole("link", { name: /^Blocked/ })).toHaveAttribute("aria-current", "true");
    await expect(container.locator('[aria-current="true"]')).toHaveCount(1);
  });

  test("buttons in a named group, with a count of 0 shown, and aria-pressed moving", async ({ page }) => {
    const container = await example(page, "filter-bar-held-by-your-app");
    const group = container.getByRole("group", { name: "Whose tasks" });
    const mine = group.getByRole("button", { name: /^Mine/ });
    const none = group.getByRole("button", { name: "Unassigned 0" });
    await expect(mine).toHaveAttribute("aria-pressed", "true");
    await expect(none).toHaveAttribute("aria-pressed", "false");
    await none.click();
    await expect(none).toHaveAttribute("aria-pressed", "true");
    await expect(mine).toHaveAttribute("aria-pressed", "false");
  });

  test("a pressed button looks as a current link does, and moves with the choice", async ({ page }) => {
    const container = await example(page, "filter-bar-held-by-your-app");
    const mine = container.getByRole("button", { name: /^Mine/ });
    const team = container.getByRole("button", { name: /^My team/ });
    const primary = await color(page, "--harmo-color-primary");
    await expect(mine).toHaveCSS("border-top-color", primary);
    await expect(mine.locator(".hfilter-bar-label")).toHaveCSS("color", primary);
    await expect(mine.locator(".hfilter-bar-label")).toHaveCSS("font-weight", "500");
    await expect(team.locator(".hfilter-bar-label")).toHaveCSS("font-weight", "400");

    await team.click();
    await expect(team).toHaveCSS("border-top-color", primary);
    await expect(team.locator(".hfilter-bar-count")).toHaveCSS("color", primary);
    await expect(team.locator(".hfilter-bar-label")).toHaveCSS("font-weight", "500");
    await expect(mine.locator(".hfilter-bar-label")).toHaveCSS("font-weight", "400");
    await expect(mine.locator(".hfilter-bar-count")).toHaveCSS("color", await color(page, "--harmo-color-text"));
  });

  test("in a heavier parent, an inactive label stays normal weight, so the active one still stands out", async ({ page }) => {
    const container = await example(page, "filter-bar-default");
    await container.getByRole("navigation").evaluate((node: HTMLElement) => (node.style.fontWeight = "500"));
    await expect(container.getByRole("link").nth(1).locator(".hfilter-bar-label")).toHaveCSS("font-weight", "400");
    await expect(container.getByRole("link").first().locator(".hfilter-bar-label")).toHaveCSS("font-weight", "500");
  });

  test("disabled, a button is faded, not-allowed, and shows no hover", async ({ page }) => {
    const container = await example(page, "filter-bar-held-by-your-app");
    const team = container.getByRole("button", { name: /^My team/ });
    const border = await color(page, "--harmo-color-border");
    await team.evaluate((node: HTMLButtonElement) => (node.disabled = true));
    await expect(team).toHaveCSS("cursor", "not-allowed");
    expect(Number(await team.evaluate((node) => getComputedStyle(node).opacity))).toBeLessThan(1);
    await team.hover({ force: true });
    await expect(team).toHaveCSS("border-top-color", border);
  });

  test("the count follows the type token, and an app can override the active colors", async ({ page }) => {
    const container = await example(page, "filter-bar-default");
    await page.evaluate(() => {
      document.documentElement.style.setProperty("--harmo-font-size-lg", "1.5rem");
      const style = document.createElement("style");
      style.textContent = '[aria-current="true"] > .hfilter-bar-label { color: rgb(1, 2, 3); }';
      document.head.append(style);
    });
    await expect(container.getByRole("link").first().locator(".hfilter-bar-count")).toHaveCSS("font-size", "24px");
    await expect(container.getByRole("link").first().locator(".hfilter-bar-label")).toHaveCSS("color", "rgb(1, 2, 3)");
  });

  test("in a container narrower than a card, it shrinks to fit", async ({ page }) => {
    const container = await example(page, "filter-bar-default");
    const bar = container.getByRole("navigation");
    await bar.evaluate((node: HTMLElement) => (node.style.inlineSize = "96px"));
    const [box, card] = await boxes(bar, container.getByRole("link").first());
    expect(box.width).toBeCloseTo(96, 0);
    expect(card.width).toBeLessThanOrEqual(96.5);
    expect(await bar.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  });

  test("cards share a width on one row, and wrap on a narrow screen without overflowing", async ({ page }) => {
    const container = await example(page, "filter-bar-default");
    const cards = await boxes(...(await container.getByRole("link").all()));
    for (const card of cards) {
      expect(card.width).toBeCloseTo(cards[0]!.width, 0);
      expect(card.y).toBeCloseTo(cards[0]!.y, 0);
    }
    expect(cards[1]!.x - (cards[0]!.x + cards[0]!.width)).toBeCloseTo(8, 0);

    await page.setViewportSize({ width: 320, height: 800 });
    await example(page, "filter-bar-default");
    const narrow = await boxes(...(await container.getByRole("link").all()));
    expect(narrow[2]!.y).toBeGreaterThan(narrow[0]!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });

  test("a long label or count wraps inside its card", async ({ page }) => {
    const container = await example(page, "filter-bar-default");
    const card = container.getByRole("link").first();
    await card.locator(".hfilter-bar-label").evaluate((node) => (node.textContent = "A label far too long to fit on a single line at this width, withoutanybreakopportunityatallinit"));
    await card.locator(".hfilter-bar-count").evaluate((node) => (node.textContent = "1234567890123456789012345678901234567890"));
    expect(await card.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  });

  test("focused, it shows the ring", async ({ page }) => {
    const container = await example(page, "filter-bar-default");
    const link = container.getByRole("link").nth(1);
    await link.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-style", "solid");
  });

  test("right to left, the first filter is on the right, and its text starts there", async ({ page }) => {
    const container = await example(page, "filter-bar-right-to-left");
    const [first, second] = await boxes(...(await container.getByRole("link").all()));
    expect(first!.x).toBeGreaterThan(second!.x);
    const label = container.getByRole("link").first().locator(".hfilter-bar-label");
    const [card, text] = await boxes(container.getByRole("link").first(), label);
    expect(card.x + card.width - (text.x + text.width)).toBeCloseTo(17, 0);
  });

  test("in forced colors, the filter in force has a line inside its edge", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Only Chromium emulates forced colors");
    const container = await example(page, "filter-bar-default");
    await page.emulateMedia({ forcedColors: "active" });
    await expect(container.getByRole("link").first()).toHaveCSS("outline-style", "solid");
    await expect(container.getByRole("link").nth(1)).toHaveCSS("outline-style", "none");
  });
});
