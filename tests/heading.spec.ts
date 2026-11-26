import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/heading.md says: a page's title 33px on a 42px line,
// a heading 20px on a 26px line, both semibold and without margins; and a
// heading outside Prose is the size of Prose's h2, on the same line.
onEachPlayground("heading", () => {
  test("a title is 33px on a 42px line, and a heading 20px on a 26px line, both semibold, without margins", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "heading-default");
    const title = container.getByRole("heading", { level: 1, name: "Orders" });
    await expect(title).toHaveCSS("font-size", "33px");
    await expect(title).toHaveCSS("line-height", "42px");
    await expect(title).toHaveCSS("font-weight", "600");
    await expect(title).toHaveCSS("margin-block-start", "0px");
    const heading = container.getByRole("heading", { level: 2, name: "Today" });
    await expect(heading).toHaveCSS("font-size", "20px");
    await expect(heading).toHaveCSS("line-height", "26px");
    await expect(heading).toHaveCSS("font-weight", "600");
    await expect(heading).toHaveCSS("margin-block-end", "0px");
  });

  test("a heading outside Prose is the size of Prose's h2, on the same line", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "heading-beside-prose");
    const styleOf = (name: string) =>
      container.getByRole("heading", { name }).evaluate((node) => {
        const style = getComputedStyle(node);
        return [style.fontSize, style.lineHeight, style.fontWeight, style.fontFamily];
      });
    expect(await styleOf("Projects")).toEqual(await styleOf("Today"));
  });
});
