import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/status.md says, on the Status page: text too long for
// its line wraps, and a word too long for it, such as an ID, breaks rather
// than spilling out.
onEachPlayground("status", () => {
  test("in a narrow space, a word too long for its line breaks rather than spilling out", async ({ page }) => {
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
