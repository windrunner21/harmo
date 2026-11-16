import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/status.md says, on the Status page: a dot 6px before
// the text; bordered, a pill as tall as a Tag beside it; text too long for
// its line wraps, and a word too long for it, such as an ID, breaks rather
// than spilling out. Only CSS decides it, so it's tested on the HTML
// playground.
onEachPlayground("status", () => {
  test("bordered, it's as tall as a tag beside it, with its edges in line, and 10px at the sides", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "status-next-to-a-tag");
    const bordered = container.locator('.hstatus[data-variant="bordered"]');
    const [tag, status] = await boxes(container.locator(".htag").first(), bordered);
    expect(status.height).toBeCloseTo(tag.height, 0);
    expect(status.y).toBeCloseTo(tag.y, 0);
    await expect(bordered).toHaveCSS("padding-left", "10px");
    await expect(bordered).toHaveCSS("padding-top", "2px");
  });

  test("its dot is 6px, --harmo-space-2xs, before the text", { tag: "@css" }, async ({ page }) => {
    const status = (await example(page, "status-statuses")).locator(".hstatus").first();
    await expect(status).toHaveCSS("column-gap", "6px");
    await page.evaluate(() => document.documentElement.style.setProperty("--harmo-space-2xs", "8px"));
    await expect(status).toHaveCSS("column-gap", "8px");
  });

  test("in a narrow space, a word too long for its line breaks rather than spilling out", { tag: "@css" }, async ({ page }) => {
    const status = (await example(page, "status-statuses")).locator(".hstatus").first();
    const end = await status.evaluate((node) => {
      const frame = document.createElement("div");
      frame.style.inlineSize = "100px";
      node.before(frame);
      frame.append(node);
      node.textContent = "run-7f3a9c2e41b8d0f5a6c3e9b2";
      return frame.getBoundingClientRect().right;
    });
    const [box] = await boxes(status);
    expect(box.x + box.width).toBeLessThanOrEqual(end + 0.5);
    expect(await status.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  });
});
