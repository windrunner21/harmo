import { expect, type Locator } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/tag-list.md says, on the Tag List page: one row that
// never wraps, the tags that fit, then "+N", named by the app, whose tooltip
// shows the rest on hover and keyboard focus; counted again as the width
// changes.
const shown = (list: Locator) => list.locator(":scope > li:not(.htag-list-more):visible");

onEachPlayground("tag-list", () => {
  test("the tags that fit, in one row, then +N for the rest, named by the app", async ({ page }) => {
    const container = await example(page, "tag-list-default");
    const list = container.locator(".htag-list");
    const count = list.locator(".htag-list-count");
    await expect(count).toBeVisible();
    const fitting = await shown(list).count();
    expect(fitting).toBeGreaterThan(0);
    expect(fitting).toBeLessThan(5);
    await expect(count).toHaveText(`+${5 - fitting}`);
    await expect(count).toHaveAccessibleName(`${5 - fitting} more`);

    const [row, first, more] = await boxes(list, shown(list).first(), count);
    expect(first.y).toBeCloseTo(more.y, 0);
    expect(more.x + more.width).toBeLessThanOrEqual(row.x + row.width + 0.5);
  });

  test("+N shows the rest on hover and on keyboard focus, and describes itself with them", async ({ page }) => {
    const container = await example(page, "tag-list-default");
    const list = container.locator(".htag-list");
    const fitting = await shown(list).count();
    const rest = ["Billing", "Onboarding", "Refund", "Partner", "Urgent"].slice(fitting);
    const count = list.locator(".htag-list-count");
    const tooltip = list.getByRole("tooltip");

    await count.hover();
    await expect(tooltip).toBeVisible();
    await expect(tooltip.locator(".htag")).toHaveText(rest);
    await expect(count).toHaveAccessibleDescription(rest.join(" "));

    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();
    await count.focus();
    await expect(tooltip).toBeVisible();
  });

  test("it counts again as the width changes, and shows every tag once they fit", async ({ page }) => {
    const container = await example(page, "tag-list-default");
    const list = container.locator(".htag-list");
    const before = await shown(list).count();
    const frame = await list.evaluate((node) => (node.parentElement as HTMLElement).style.inlineSize);
    const resize = (width: string) => list.evaluate((node, width) => ((node.parentElement as HTMLElement).style.inlineSize = width), width);
    await resize("60rem");
    await expect(shown(list)).toHaveCount(5);
    await expect(list.locator(".htag-list-more")).toBeHidden();
    await resize(frame);
    await expect(shown(list)).toHaveCount(before);
  });

  test("a press pins the tooltip open, as on a touch screen, until a press elsewhere or Escape", async ({ page }) => {
    const container = await example(page, "tag-list-default");
    const list = container.locator(".htag-list");
    const count = list.locator(".htag-list-count");
    const tooltip = list.getByRole("tooltip");
    // Pinned: shown, though the pointer has left and a press shows no
    // keyboard focus.
    await count.click();
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeVisible();
    await container.getByRole("heading").first().click();
    await expect(tooltip).toBeHidden();

    await count.click();
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
  });

  test("a hidden tag whose text changes shows the new text in the tooltip", async ({ page }, info) => {
    // In React, a tag changes by rendering, which counts again anyway.
    test.skip(!info.titlePath.includes("html"), "HTML only");
    const container = await example(page, "tag-list-default");
    const list = container.locator(".htag-list");
    await list.locator(":scope > li:not(.htag-list-more)").last().locator(".htag").evaluate((tag) => (tag.lastChild!.textContent = "Escalated"));
    await expect(list.locator(".htag-list-rest > .htag").last()).toHaveText("Escalated");
  });

  test("where even the first tag doesn't fit beside +N, only +N shows", async ({ page }) => {
    const container = await example(page, "tag-list-narrow");
    const list = container.locator(".htag-list");
    await expect(shown(list)).toHaveCount(0);
    await expect(list.locator(".htag-list-count")).toHaveText("+2");
  });
});
