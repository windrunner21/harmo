import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/tag.md says, on the Tag page: 2px 6px padding and
// 6px from the dot to the text, from the space scale; and of the remove
// button, a 16px button with a 12px cross, 2px after the text, with a 24px
// target.
onEachPlayground("tag", () => {
  test("its side padding and the dot's gap are --harmo-space-2xs, 6px; above and below, 2px", async ({ page }) => {
    const tag = (await example(page, "tag-with-a-color")).locator(".htag").first();
    await expect(tag).toHaveCSS("padding", "2px 6px");
    await expect(tag).toHaveCSS("column-gap", "6px");
    await page.evaluate(() => document.documentElement.style.setProperty("--harmo-space-2xs", "8px"));
    await expect(tag).toHaveCSS("padding", "2px 8px");
    await expect(tag).toHaveCSS("column-gap", "8px");
  });

  test("the remove button is 16px with a 12px cross, 2px after the text, and its target is 24px", async ({ page }) => {
    const container = await example(page, "tag-with-a-remove-button");
    const button = container.getByRole("button", { name: "Remove Billing" });
    const [tag, own, cross] = await boxes(container.locator(".htag").first(), button, button.locator("svg"));
    expect(own.width).toBeCloseTo(16, 0);
    expect(own.height).toBeCloseTo(16, 0);
    expect(cross.width).toBeCloseTo(12, 0);
    expect(tag.x + tag.width - (own.x + own.width)).toBeCloseTo(3, 0);

    // 2px from the end of the text itself.
    const textEnd = await container.locator(".htag").first().evaluate((node) => {
      const text = [...node.childNodes].find((child) => child.nodeType === Node.TEXT_NODE && child.textContent!.includes("Billing"))!;
      const start = text.textContent!.indexOf("Billing");
      const range = document.createRange();
      range.setStart(text, start);
      range.setEnd(text, start + "Billing".length);
      return range.getBoundingClientRect().right;
    });
    expect(own.x - textEnd).toBeCloseTo(2, 0);

    // 4px past the button on each side is still this button.
    const hits = await button.evaluate((self, [x, y]) => {
      const at = (dx: number, dy: number) => document.elementFromPoint(x! + dx, y! + dy)?.closest(".htag-remove") === self;
      return [at(-11.5, 0), at(11.5, 0), at(0, -11.5), at(0, 11.5)];
    }, [own.x + own.width / 2, own.y + own.height / 2]);
    expect(hits).toEqual([true, true, true, true]);
  });

  test("removing a tag by the keyboard moves focus to the next tag's button", async ({ page }) => {
    const container = await example(page, "tag-with-a-remove-button");
    await container.getByRole("button", { name: "Remove Billing" }).focus();
    await page.keyboard.press("Enter");
    await expect(container.locator(".htag")).toHaveText(["Onboarding", "Partner"]);
    await expect(container.getByRole("button", { name: "Remove Onboarding" })).toBeFocused();
  });

  test("removing the last tag by the keyboard moves focus to what the tags are in, not to the page", async ({ page }) => {
    const container = await example(page, "tag-with-a-remove-button");
    const holder = container.locator(".play-demo");
    await container.getByRole("button", { name: "Remove Billing" }).focus();
    for (let left = 2; left >= 0; left--) {
      await page.keyboard.press("Enter");
      await expect(container.locator(".htag")).toHaveCount(left);
    }
    await expect(holder).toBeFocused();
  });
});
