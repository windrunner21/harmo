import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/stat.md says, on the Stat page: a label that's a
// heading, the number, its caption, and a neutral trend; a hint that names
// its button; tooltips a press pins open; an action below; and tiles on a
// tray, as many to a row as fit.
onEachPlayground("stat", () => {
  test("a label that's a heading, the number, its caption, and a trend in the text color with its arrow hidden", async ({ page }) => {
    const stat = (await example(page, "stat-default")).locator(".hstat");
    await expect(stat.getByRole("heading", { level: 3, name: "New tickets" })).toBeVisible();
    await expect(stat.locator(".hstat-value")).toHaveText("128");
    await expect(stat.locator(".hstat-caption")).toHaveText("Compared to yesterday");
    const trend = stat.locator(".hstat-trend");
    await expect(trend).toHaveText("+12%");
    await expect(trend).toHaveAttribute("data-direction", "up");
    await expect(trend.locator("svg")).toHaveAttribute("aria-hidden", "true");
    const value = stat.locator(".hstat-value");
    await expect(trend).toHaveCSS("color", await value.evaluate((node) => getComputedStyle(node).color));

    // The trend at the end of the row.
    const [box, trendBox] = await boxes(stat, trend);
    expect(trendBox.x + trendBox.width).toBeCloseTo(box.x + box.width, 0);
  });

  test("the hint names its button, shows on hover and keyboard focus, and a press pins it open until a press elsewhere or Escape", async ({ page }) => {
    const stat = (await example(page, "stat-with-a-hint-and-an-action")).locator(".hstat");
    const hint = stat.getByRole("button", { name: "Tickets that aren't closed yet, across every channel." });
    const tooltip = stat.getByRole("tooltip");
    await expect(tooltip).toBeHidden();

    // At least the 24px WCAG asks of a target.
    const [target] = await boxes(hint);
    expect(target.width).toBeGreaterThanOrEqual(24);
    expect(target.height).toBeGreaterThanOrEqual(24);

    await hint.hover();
    await expect(tooltip).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();
    await hint.focus();
    await expect(tooltip).toBeVisible();
    await hint.blur();
    await expect(tooltip).toBeHidden();

    // Pinned: shown, though the pointer has left and a press shows no
    // keyboard focus.
    await hint.click();
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeVisible();
    await stat.locator(".hstat-value").click();
    await expect(tooltip).toBeHidden();

    await hint.click();
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
  });

  test("the action goes 16px below the caption", async ({ page }) => {
    const stat = (await example(page, "stat-with-a-hint-and-an-action")).locator(".hstat");
    const link = stat.getByRole("link", { name: "View tickets" });
    await expect(link).toHaveAttribute("href", "/tickets");
    const [caption, action] = await boxes(stat.locator(".hstat-caption"), stat.locator(".hstat-actions"));
    expect(action.y - (caption.y + caption.height)).toBeCloseTo(16, 0);
  });

  test("in a group, each Stat is a tile on a tray, as many to a row as fit, and each trend's tooltip says what it compares", async ({ page }) => {
    const group = (await example(page, "stat-in-a-group")).locator(".hstat-group");
    const tiles = group.locator(".hstat");
    await expect(tiles).toHaveCount(3);
    const background = (name: string) =>
      page.evaluate((name) => {
        const probe = document.createElement("span");
        document.body.append(probe);
        probe.style.backgroundColor = `var(${name})`;
        const color = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return color;
      }, name);
    await expect(group).toHaveCSS("background-color", await background("--harmo-color-background-secondary"));
    await expect(group).toHaveCSS("border-top-left-radius", "24px");
    await expect(tiles.first()).toHaveCSS("background-color", await background("--harmo-color-background"));

    const rows = async () => new Set((await boxes(...(await tiles.all()))).map((box) => Math.round(box.y))).size;
    expect(await rows()).toBe(1);

    // Numbers and captions line up across the row, though the second tile's
    // label, made long enough here, takes two lines, and the third has no
    // trend.
    await tiles.nth(1).locator(".hstat-label").evaluate((label) => (label.textContent = "First response time, in working hours"));
    expect(await tiles.nth(1).locator(".hstat-label").evaluate((label) => label.clientHeight)).toBeGreaterThanOrEqual(42);
    for (const part of [".hstat-value", ".hstat-caption"]) {
      const tops = (await boxes(...(await group.locator(part).all()))).map((box) => box.y);
      for (const top of tops) expect(top, part).toBeCloseTo(tops[0], 0);
    }
    // There, the label wraps rather than the trend moving: it stays on the
    // label's line.
    const [wrapped, beside] = await boxes(tiles.nth(1).locator(".hstat-label"), tiles.nth(1).locator(".hstat-trend"));
    expect(beside.y).toBeLessThan(wrapped.y + wrapped.height);

    const trend = group.getByRole("button", { name: "+12%" });
    await expect(trend).toHaveAccessibleDescription("Nov 1–7, 2026, compared with Oct 25–31, 2026.");
    await trend.click();
    await page.mouse.move(0, 0);
    await expect(group.getByRole("tooltip").first()).toBeVisible();
    await page.keyboard.press("Escape");

    // On a phone, one to a row.
    await page.setViewportSize({ width: 375, height: 800 });
    expect(await rows()).toBe(3);
  });

  test("in a narrow Stat with a long label and trend, the trend moves onto a line of its own, and nothing spills out", async ({ page }) => {
    const stat = (await example(page, "stat-with-a-hint-and-an-action")).locator(".hstat");
    await stat.evaluate((node: HTMLElement) => {
      node.style.inlineSize = "146px";
      node.querySelector(".hstat-label")!.textContent = "Average first response time";
      node.querySelector(".hstat-trend")!.lastChild!.textContent = "12% higher than the previous period";
    });
    const [box, label, hint, trend] = await boxes(stat, stat.locator(".hstat-label"), stat.locator(".hstat-hint"), stat.locator(".hstat-trend"));
    for (const part of [label, hint, trend]) {
      expect(part.x).toBeGreaterThanOrEqual(box.x - 5.5);
      expect(part.x + part.width).toBeLessThanOrEqual(box.x + box.width + 5.5);
    }
    expect(label.width).toBeGreaterThan(40);
    expect(trend.y).toBeGreaterThanOrEqual(label.y + label.height);
    expect(trend.x + trend.width).toBeCloseTo(box.x + box.width, 0);
  });

  test("right to left, the trend is at the left end of the row, and the action starts on the right", async ({ page }) => {
    const stat = (await example(page, "stat-right-to-left")).locator(".hstat");
    const [box, label, trend, action] = await boxes(
      stat,
      stat.locator(".hstat-label"),
      stat.locator(".hstat-trend"),
      stat.getByRole("link"),
    );
    expect(trend.x).toBeCloseTo(box.x, 0);
    expect(label.x + label.width).toBeCloseTo(box.x + box.width, 0);
    expect(action.x + action.width).toBeCloseTo(box.x + box.width, 0);
  });
});
