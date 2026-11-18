import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/prose.md says: its own 1.5 lines; blocks 1em apart, a
// heading 1.625em from what's above it and 0.375em from what's under it, and
// list items 0.375em apart; headings in proportion; lists indented; code in a line on a tint,
// and in a block in a framed panel that scrolls sideways; a plain link looks
// as an underlined Link does. React's `text` formats paragraphs, lists, code,
// bold, and links, as elements, and only web and email addresses become
// links. The look is CSS's, tested on the HTML playground.
onEachPlayground("prose", () => {
  test("its own 1.5 lines, blocks 1em apart, list items 0.375em; code in a line on a tint, and a block of code in a framed panel that scrolls sideways", { tag: "@css" }, async ({ page }) => {
    const prose = (await example(page, "prose-default")).locator(".hprose");
    const base = parseFloat(await prose.evaluate((node) => getComputedStyle(node).fontSize));
    // Inside a container on the browser's default line height, it keeps its own.
    await prose.evaluate((node) => ((node.parentElement as HTMLElement).style.lineHeight = "normal"));
    await expect(prose).toHaveCSS("line-height", `${base * 1.5}px`);
    await expect(prose.locator("ul")).toHaveCSS("margin-top", `${base}px`);
    await expect(prose.locator("li").nth(1)).toHaveCSS("margin-top", `${base * 0.375}px`);
    // A block of code, whose text is smaller, is spaced in the text's em too.
    await expect(prose.locator("pre")).toHaveCSS("margin-top", `${base}px`);
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

  test("headings in proportion, further from what's above than from what's under; a quote set in from a line", { tag: "@css" }, async ({ page }) => {
    const prose = (await example(page, "prose-headings-and-quotes")).locator(".hprose");
    const base = parseFloat(await prose.evaluate((node) => getComputedStyle(node).fontSize));
    await expect(prose.locator("h3")).toHaveCSS("font-size", `${base * 1.125}px`);
    await expect(prose.locator("h3")).toHaveCSS("font-weight", "600");
    await expect(prose.locator("h4")).toHaveCSS("margin-top", `${base * 1.625}px`);
    await expect(prose.locator("h3")).toBeVisible();
    await expect(prose.locator("h3 + p")).toHaveCSS("margin-top", `${base * 0.375}px`);
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
