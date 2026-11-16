import { expect, type Locator } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/icons.md says about the static chevron: it points
// toward the end of the line, data-direction="back" toward its start, and
// right-to-left text mirrors both; .hchevron pulls it in on both sides, so
// its gap to the text matches other icons'. Only CSS decides it, so it's
// tested on the HTML playground.

// Whether the drawn chevron points right: what's on screen where a
// right-pointing one has its tip, 15.2 of its 24 units across, at the middle,
// is the drawing.
const pointsRight = (icon: Locator) =>
  icon.evaluate((svg) => {
    const box = svg.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + (box.width * 15.2) / 24, box.y + box.height / 2);
    return hit?.localName === "path";
  });

onEachPlayground("icons", () => {
  test("forward points toward the end of the line and back toward its start, in left-to-right and right-to-left text", { tag: "@css" }, async ({ page }) => {
    const ltr = await example(page, "icons-direction");
    expect(await pointsRight(ltr.getByRole("button", { name: "Next month" }).locator(".hchevron")), "forward").toBe(true);
    expect(await pointsRight(ltr.getByRole("button", { name: "Previous month" }).locator(".hchevron")), "back").toBe(false);

    const rtl = await example(page, "icons-right-to-left");
    expect(await pointsRight(rtl.getByRole("button", { name: "الشهر التالي" }).locator(".hchevron")), "forward, right to left").toBe(false);
    expect(await pointsRight(rtl.getByRole("button", { name: "الشهر السابق" }).locator(".hchevron")), "back, right to left").toBe(true);
    expect(await pointsRight(rtl.getByRole("link").locator(".hchevron")), "a link's, right to left").toBe(false);
  });

  test(".hchevron pulls the chevron in by 0.1875em, so its gap to the text is that much narrower than without it", { tag: "@css" }, async ({ page }) => {
    const links = (await example(page, "icons-static-chevron")).getByRole("link");
    const measure = (link: Locator) =>
      link.evaluate((node) => {
        const range = document.createRange();
        range.selectNodeContents(node.firstChild!);
        const text = range.getBoundingClientRect();
        return {
          gap: node.querySelector("svg")!.getBoundingClientRect().x - (text.x + text.width),
          em: parseFloat(getComputedStyle(node).fontSize),
        };
      });
    const [pulled, plain] = [await measure(links.nth(0)), await measure(links.nth(1))];
    expect(plain.gap - pulled.gap).toBeCloseTo(pulled.em * 0.1875, 0);
  });
});
