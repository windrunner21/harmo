import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/badge.md says: a 20px pill of 12px semibold numbers,
// red, the accent, or gray, or an 8px dot; past 99, 99+; on a Button, on its
// top corner at the end, 6px over its edge, ringed, hidden from screen
// readers while the button's name says the count; one that arrives after the
// page has loaded settles in, and one there as it loads doesn't. Its look is
// CSS's, tested on the HTML playground.
onEachPlayground("badge", () => {
  test("a count is a 20px pill of 12px semibold numbers, and past 99 says 99+", async ({ page }) => {
    const badges = (await example(page, "badge-default")).locator(".hbadge");
    await expect(badges).toHaveText(["3", "12", "99+"]);
    const first = badges.first();
    await expect(first).toHaveCSS("height", "20px");
    await expect(first).toHaveCSS("min-width", "20px");
    await expect(first).toHaveCSS("font-size", "12px");
    await expect(first).toHaveCSS("font-weight", "600");
    await expect(first).toHaveCSS("font-variant-numeric", "tabular-nums");
  });

  test("red, the accent, or gray; a dot is 8px, with no number", { tag: "@css" }, async ({ page }) => {
    const badges = (await example(page, "badge-variants")).locator(".hbadge");
    const color = (index: number) => badges.nth(index).evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(new Set([await color(0), await color(1), await color(2)]).size).toBe(3);
    const dot = badges.nth(3);
    await expect(dot).toHaveText("");
    await expect(dot).toHaveCSS("width", "8px");
    await expect(dot).toHaveCSS("height", "8px");
  });

  test("on a button, it sits on the top corner at the end, 6px over the edge, ringed, and the name says the count", async ({ page }) => {
    const container = await example(page, "badge-on-a-button");
    const button = container.getByRole("button", { name: "Messages, 3 unread" });
    const badge = button.locator(".hbadge");
    await expect(badge).toHaveAttribute("aria-hidden", "true");
    const [box, corner] = await Promise.all([button.boundingBox(), badge.boundingBox()]);
    expect(Math.round(corner!.y - box!.y)).toBe(-6);
    expect(Math.round(box!.x + box!.width - (corner!.x + corner!.width))).toBe(-6);
    await expect(badge).toHaveCSS("outline-width", "2px");
    await expect(container.getByRole("button", { name: "Tickets, 12 open" }).locator(".hbadge")).toHaveAttribute("data-variant", "neutral");
  });

  test("one that arrives settles in, and one there as the page loads doesn't", async ({ page }) => {
    await expect((await example(page, "badge-on-a-button")).locator(".hbadge[data-new]")).toHaveCount(0);
    const container = await example(page, "badge-as-it-arrives");
    const messages = container.getByRole("button", { name: /^Messages/ });
    await expect(messages.locator(".hbadge")).toHaveCount(0);
    await container.getByRole("button", { name: "Get a message" }).click();
    const badge = messages.locator(".hbadge");
    await expect(badge).toHaveText("1");
    await expect(badge).toHaveAttribute("data-new", "");
    await expect(messages).toHaveAccessibleName("Messages, 1 unread");
    await container.getByRole("button", { name: "Get a message" }).click();
    await expect(badge).toHaveText("2");
    await expect(messages).toHaveAccessibleName("Messages, 2 unread");
  });
});
