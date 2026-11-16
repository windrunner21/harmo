import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/input.md says, on the Input page: the text starts 10px
// in, as every text field's does, and a search field has none of the
// browsers' own clear button or decorations. Where the text and a button
// beside it sit, which only CSS and the markup decide, is tested on the HTML
// playground.
onEachPlayground("input", () => {
  test("its text starts and ends 10px in from the border", { tag: "@css" }, async ({ page }) => {
    const input = (await example(page, "input-default")).getByLabel("Company");
    expect(await input.evaluate((node) => getComputedStyle(node).paddingLeft)).toBe("10px");
    expect(await input.evaluate((node) => getComputedStyle(node).paddingRight)).toBe("10px");
  });

  test("a search field has none of the browsers' own clear button or decorations", async ({ page }) => {
    const input = (await example(page, "input-types")).getByLabel("Search contacts");
    expect(await input.evaluate((node) => getComputedStyle(node).appearance)).toBe("none");
    await input.fill("Sam");
    const [box] = await boxes(input);
    const end = await input.evaluate(
      (node) => parseFloat(getComputedStyle(node).paddingRight) + parseFloat(getComputedStyle(node).borderRightWidth),
    );
    // Where Chromium and Safari draw their own clear button, which empties the
    // field when pressed.
    await page.mouse.click(box.x + box.width - end - 6, box.y + box.height / 2);
    await expect(input).toHaveValue("Sam");
  });

  test("next to a button, the input takes the room the button leaves, 10px from it", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "input-next-to-a-button");
    const [input, button] = await boxes(container.getByRole("searchbox"), container.getByRole("button", { name: "Search" }));
    expect(button.x - (input.x + input.width)).toBeCloseTo(10, 0);
  });
});
