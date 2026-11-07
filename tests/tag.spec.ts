import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/tag.md says of the remove button, on the Tag page: a
// 16px button with a 12px cross, 2px after the text, with a 24px target.
onEachPlayground("tag", () => {
  test("the remove button is 16px with a 12px cross, 2px after the text, and its target is 24px", async ({ page }) => {
    const container = await example(page, "tag-with-a-remove-button");
    const button = container.getByRole("button", { name: "Remove Billing" });
    const [tag, own, cross] = await boxes(container.locator(".htag").first(), button, button.locator("svg"));
    expect(own.width).toBeCloseTo(16, 0);
    expect(own.height).toBeCloseTo(16, 0);
    expect(cross.width).toBeCloseTo(12, 0);
    expect(tag.x + tag.width - (own.x + own.width)).toBeCloseTo(3, 0);

    // 4px past the button on each side is still the button.
    const hits = await button.evaluate((_, [x, y]) => {
      const at = (dx: number, dy: number) => !!document.elementFromPoint(x! + dx, y! + dy)?.closest(".htag-remove");
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
});
