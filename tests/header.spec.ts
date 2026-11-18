import { expect, type Locator } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

const pageOf = (container: Locator) => container.locator('[style*="overflow-y"]');
const scrollTo = (page: Locator, top: number) => page.evaluate((node, top) => node.scrollTo({ top }), top);

// What docs/components/header.md says: it stays at the top as the page
// scrolls, with a hairline once it has; with data-scroll="hide", it hides as
// you scroll down, past its height, and comes back as you scroll up, or as
// focus comes into it; with "away", it scrolls away; with data-transparent,
// it's clear until the page scrolls.
onEachPlayground("header", () => {
  test("it stays at the top, and has the hairline once the page has scrolled", async ({ page }) => {
    const container = await example(page, "header-default");
    const header = container.locator(".hheader");
    await expect(header).not.toHaveAttribute("data-scrolled");
    await scrollTo(pageOf(container), 120);
    await expect(header).toHaveAttribute("data-scrolled", "");
    await scrollTo(pageOf(container), 0);
    await expect(header).not.toHaveAttribute("data-scrolled");
  });

  test("hiding, it goes as you scroll down past it, and comes back as you scroll up, or as focus comes into it", async ({ page }) => {
    const container = await example(page, "header-hides-as-you-scroll-down");
    const header = container.locator(".hheader");
    const scroller = pageOf(container);
    await scrollTo(scroller, 30);
    await expect(header).not.toHaveAttribute("data-hidden");
    await scrollTo(scroller, 200);
    await expect(header).toHaveAttribute("data-hidden", "");
    await scrollTo(scroller, 150);
    await expect(header).not.toHaveAttribute("data-hidden");
    await scrollTo(scroller, 260);
    await expect(header).toHaveAttribute("data-hidden", "");
    await header.getByRole("link", { name: "Shop" }).focus();
    await scrollTo(scroller, 320);
    await expect(header).not.toHaveAttribute("data-hidden");
  });

  test("hiding follows the scroll, and settles to whichever is nearer where it stops", async ({ page }) => {
    const container = await example(page, "header-hides-as-you-scroll-down");
    const header = container.locator(".hheader");
    const scroller = pageOf(container);
    await scrollTo(scroller, 200);
    await expect(header).toHaveAttribute("data-hidden", "");
    // Back 15px of its 55: still more hidden than shown, so it settles away.
    await scrollTo(scroller, 185);
    await expect(header).toHaveAttribute("data-hidden", "");
    await expect(header).not.toHaveAttribute("data-settling");
    // Back 40px: more shown, so it settles in view.
    await scrollTo(scroller, 145);
    await expect(header).not.toHaveAttribute("data-hidden");
    await expect(header).not.toHaveAttribute("data-settling");
    await expect.poll(() => header.evaluate((node) => getComputedStyle(node).translate)).toBe("none");
  });

  test("near the top, it stays where the scroll put it", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "header-hides-as-you-scroll-down");
    const header = container.locator(".hheader");
    await scrollTo(pageOf(container), 20);
    await expect.poll(() => header.evaluate((node) => getComputedStyle(node).translate)).toBe("0px -20px");
    await expect(header).not.toHaveAttribute("data-hidden");
  });

  test("the positions: staying at the top, moved away when hidden but not with focus, and scrolling away", { tag: "@css" }, async ({ page }) => {
    const stays = await example(page, "header-default");
    await scrollTo(pageOf(stays), 150);
    const [frame, bar] = await Promise.all([pageOf(stays).boundingBox(), stays.locator(".hheader").boundingBox()]);
    expect(Math.round(bar!.y)).toBe(Math.round(frame!.y + 1));

    const hides = await example(page, "header-hides-as-you-scroll-down");
    const header = hides.locator(".hheader");
    await scrollTo(pageOf(hides), 200);
    await expect(header).toHaveAttribute("data-hidden", "");
    await expect.poll(async () => (await header.evaluate((node) => getComputedStyle(node).translate))).toBe("0px -100%");
    await header.getByRole("link", { name: "Shop" }).focus();
    await expect.poll(async () => (await header.evaluate((node) => getComputedStyle(node).translate))).toBe("none");

    const away = await example(page, "header-scrolls-away");
    await scrollTo(pageOf(away), 150);
    const [awayFrame, awayBar] = await Promise.all([pageOf(away).boundingBox(), away.locator(".hheader").boundingBox()]);
    expect(awayBar!.y + awayBar!.height).toBeLessThan(awayFrame!.y);
  });

  test("clear over a hero until the page scrolls, then frosted", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "header-clear-over-a-hero");
    const header = container.locator(".hheader");
    await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await scrollTo(pageOf(container), 120);
    await expect(header).toHaveAttribute("data-scrolled", "");
    await expect(header).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  });
});
