import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/prose.md says: blocks 10px apart and a heading after
// one 16px; headings in proportion; lists indented; code in a line on a tint,
// and in a block in a framed panel that scrolls sideways; a plain link looks
// as an underlined Link does. React's `text` formats paragraphs, lists, code,
// bold, and links, as elements, and only web and email addresses become
// links. The look is CSS's, tested on the HTML playground.
onEachPlayground("prose", () => {
  test("blocks 10px apart; code in a line on a tint, and a block of code in a framed panel that scrolls sideways", { tag: "@css" }, async ({ page }) => {
    const prose = (await example(page, "prose-default")).locator(".hprose");
    await expect(prose.locator("ul")).toHaveCSS("margin-top", "10px");
    await expect(prose.locator("ul")).toHaveCSS("padding-inline-start", "24px");
    const code = prose.locator("p > code");
    await expect(code).toHaveCSS("font-family", /monospace/);
    await expect(code).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const block = prose.locator("pre");
    await expect(block).toHaveCSS("overflow-x", "auto");
    await expect(block).toHaveCSS("white-space", "pre");
    await expect(block).toHaveCSS("border-top-width", "1px");
    await expect(block).toHaveCSS("font-size", "13px");
    await expect(prose.locator("p > a")).toHaveCSS("text-decoration-line", "underline");
  });

  test("headings in proportion, a step further from what's above; a quote set in from a line", { tag: "@css" }, async ({ page }) => {
    const prose = (await example(page, "prose-headings-and-quotes")).locator(".hprose");
    const base = parseFloat(await prose.evaluate((node) => getComputedStyle(node).fontSize));
    await expect(prose.locator("h3")).toHaveCSS("font-size", `${base * 1.125}px`);
    await expect(prose.locator("h3")).toHaveCSS("font-weight", "600");
    await expect(prose.locator("h4")).toHaveCSS("margin-top", "16px");
    await expect(prose.locator("blockquote")).toHaveCSS("border-inline-start-width", "2px");
    await expect(prose.locator("blockquote")).toHaveCSS("padding-inline-start", "10px");
  });

  test("text is formatted as paragraphs, lists, bold, code, and links that open in a new tab", async ({ page }) => {
    const prose = (await example(page, "prose-from-text")).locator(".hprose");
    await expect(prose.locator(":scope > p")).toHaveCount(2);
    await expect(prose.locator("strong")).toHaveText("3 of 5 checks passed");
    await expect(prose.locator("ul > li")).toHaveText(["Response time: 4 minutes, down from 6.", "Satisfaction: 92%, up from 88%."]);
    await expect(prose.locator("code")).toHaveText("export --week");
    const link = prose.getByRole("link", { name: "full report" });
    await expect(link).toHaveAttribute("href", "https://example.com/reports/42");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
  });
});
