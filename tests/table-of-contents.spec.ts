import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/table-of-contents.md says: links to each heading that stay in
// view, with the section you've reached marked, the last one at the end, and a
// followed link kept until you scroll yourself.
const scrollTo = (scroller: Locator, top: number | "end") =>
  scroller.evaluate((n, top) => (n.scrollTop = top === "end" ? n.scrollHeight : (top as number)), top);

onEachPlayground("table-of-contents", () => {
  const parts = async (page: Page, id = "default") => {
    const container = await example(page, `table-of-contents-${id}`);
    const nav = container.locator(".htoc");
    return {
      container,
      nav,
      links: nav.locator(".htoc-link"),
      scroller: nav.locator("xpath=.."),
      content: nav.locator("xpath=following-sibling::div"),
    };
  };

  const marked = (links: Locator) => links.locator('xpath=self::*[@aria-current="location"]');

  test("a named navigation of links to each heading", async ({ page }) => {
    const { nav, links } = await parts(page);
    await expect(nav).toHaveAccessibleName("On this page");
    await expect(links).toHaveCount(5);
    await expect(links.first()).toHaveAttribute("href", "#overview");
  });

  test("the first section is marked to begin with, and only one at a time", async ({ page }) => {
    const { links } = await parts(page);
    await expect(links.first()).toHaveAttribute("aria-current", "location");
    await expect(marked(links)).toHaveCount(1);
  });

  test("scrolling marks the section reached", async ({ page }) => {
    const { links, scroller } = await parts(page);
    await scrollTo(scroller, 230);
    await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
    await expect(marked(links)).toHaveCount(1);
    await scrollTo(scroller, 450);
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
  });

  test("following a link scrolls to its section, by mouse or keyboard", async ({ page }) => {
    const { links, scroller, container } = await parts(page);
    await links.nth(2).click();
    const heading = container.locator("#risks");
    const top = async () => {
      const [view, target] = await boxes(scroller, heading);
      return Math.abs(target!.y - view!.y);
    };
    await expect.poll(top).toBeLessThan(2);
    expect(page.url()).toContain("#risks");
    await links.nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
    await expect.poll(() => boxes(scroller, container.locator("#milestones")).then(([v, t]) => Math.abs(t!.y - v!.y))).toBeLessThan(2);
  });

  test("in a scrolling box, following a link scrolls only the box", async ({ page }) => {
    const { links, scroller, container } = await parts(page);
    const before = await page.evaluate(() => window.scrollY);
    await links.nth(3).click();
    await expect.poll(() => boxes(scroller, container.locator("#budget")).then(([v, t]) => Math.abs(t!.y - v!.y))).toBeLessThan(2);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    expect(page.url()).toContain("#budget");
    await page.goBack();
    await expect.poll(() => page.url()).not.toContain("#budget");
    await expect(links.locator('xpath=self::*[@aria-current="location"]')).toHaveCount(1);
  });

  test("following a link in a box glides, and is at once with reduced motion", async ({ page }) => {
    const { links } = await parts(page);
    const seen = () =>
      page.evaluate(() => {
        const calls: string[] = [];
        (window as unknown as { calls: string[] }).calls = calls;
        const scrollBy = Element.prototype.scrollBy;
        Element.prototype.scrollBy = function (this: Element, ...args: unknown[]) {
          calls.push((args[0] as ScrollToOptions | undefined)?.behavior ?? "");
          return (scrollBy as (...a: unknown[]) => void).apply(this, args);
        } as typeof scrollBy;
      });
    const calls = () => page.evaluate(() => (window as unknown as { calls: string[] }).calls);
    await seen();
    await links.nth(2).click();
    await expect.poll(calls).toEqual(["smooth"]);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await links.nth(3).click();
    await expect.poll(calls).toEqual(["smooth", "auto"]);
  });

  test("the marker is on whichever side the line is", async ({ page }) => {
    for (const id of ["default", "at-the-end"]) {
      const { nav, links } = await parts(page, id);
      await expect(links.first()).toHaveAttribute("aria-current", "location");
      const [link] = await boxes(links.first());
      const marker = await settledBox(nav);
      if (id === "default") expect(marker.x + marker.width).toBeCloseTo(link!.x + link!.width, 0);
      else expect(marker.x).toBeCloseTo(link!.x, 0);
    }
  });

  test("an address with a section marks it, and Back follows along", async ({ page }) => {
    const { links } = await parts(page);
    await page.evaluate(() => (location.hash = "#budget"));
    await expect(links.nth(3)).toHaveAttribute("aria-current", "location");
    await page.evaluate(() => (location.hash = "#risks"));
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
    await page.goBack();
    await expect(links.nth(3)).toHaveAttribute("aria-current", "location");
  });

  test("a link opened elsewhere doesn't mark its section", async ({ page }) => {
    const { links } = await parts(page);
    const popup = page.context().waitForEvent("page", { timeout: 2000 }).catch(() => null);
    await links.nth(3).click({ modifiers: ["ControlOrMeta"] });
    (await popup)?.close();
    await expect(links.first()).toHaveAttribute("aria-current", "location");
    await expect(links.nth(3)).not.toHaveAttribute("aria-current");
  });

  test("it follows the page when the root has its own overflow rule", async ({ page }) => {
    const { links, scroller, container } = await parts(page);
    await page.addStyleTag({ content: "html { overflow-y: scroll; }" });
    await scroller.evaluate((n: HTMLElement) => {
      n.style.blockSize = "auto";
      n.style.overflowY = "visible";
    });
    // The playground has a scroll-padding, so this goes to the top by hand.
    await container.locator("#milestones").evaluate((n) => window.scrollBy(0, n.getBoundingClientRect().top - 2));
    await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
  });

  test("the marker moves when the content above changes height, without a scroll", async ({ page }) => {
    const { links, scroller, content } = await parts(page);
    await scroller.evaluate((n: HTMLElement) => (n.style.overflowAnchor = "none"));
    await scrollTo(scroller, 230);
    await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
    await content.locator("section").first().evaluate((n: HTMLElement) => (n.style.minBlockSize = "500px"));
    await expect(links.first()).toHaveAttribute("aria-current", "location");
  });

  test("a long list can be scrolled, and only follows when the section changes", async ({ page }) => {
    const { nav, scroller, links } = await parts(page);
    await expect(links.first()).toHaveAttribute("aria-current", "location");
    await nav.evaluate((n: HTMLElement) => {
      n.style.maxBlockSize = "60px";
      n.scrollTop = 80;
    });
    await scrollTo(scroller, 3);
    await page.waitForTimeout(100);
    expect(await nav.evaluate((n) => n.scrollTop)).toBeGreaterThan(40);
  });

  test("a heading that's gone doesn't stop the others", async ({ page }) => {
    const { container, links, scroller } = await parts(page);
    await container.locator("#overview").evaluate((n) => n.remove());
    await scrollTo(scroller, 450);
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
  });

  test("in an HTML page, an offset moves the line", async ({ page }) => {
    test.skip((await page.locator("[data-play-root]").count()) > 0, "React takes it as a prop");
    const { nav, links, scroller } = await parts(page);
    await nav.evaluate((n: HTMLElement) => (n.dataset.exampleOffset = "100"));
    await scrollTo(scroller, 150);
    await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
  });

  test("it's at the start by default, with its line facing the content", async ({ page }) => {
    const { nav, content, links } = await parts(page);
    const [list, words] = await boxes(nav, content);
    expect(list!.x + list!.width).toBeLessThanOrEqual(words!.x);
    await expect(links.first()).toHaveCSS("border-right-width", "1px");
    await expect(links.first()).toHaveCSS("border-left-width", "0px");
  });

  test("at the end, it's after the content with its line facing it", async ({ page }) => {
    const { nav, content, links } = await parts(page, "at-the-end");
    const [list, words] = await boxes(nav, content);
    expect(words!.x + words!.width).toBeLessThanOrEqual(list!.x);
    await expect(links.first()).toHaveCSS("border-left-width", "1px");
    await expect(links.first()).toHaveCSS("border-right-width", "0px");
  });

  test("the end marks the last section, which can't reach the top", async ({ page }) => {
    const { links, scroller } = await parts(page);
    await scrollTo(scroller, "end");
    await expect(links.last()).toHaveAttribute("aria-current", "location");
  });

  test("a followed link stays marked until you scroll yourself", async ({ page }) => {
    const { links, scroller } = await parts(page);
    await links.nth(2).click();
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
    await scrollTo(scroller, 0);
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
    await scroller.evaluate((n) => n.dispatchEvent(new WheelEvent("wheel", { bubbles: true })));
    await scrollTo(scroller, 5);
    await expect(links.first()).toHaveAttribute("aria-current", "location");
  });

  test("it stays in view as the page scrolls", async ({ page }) => {
    const { nav, scroller } = await parts(page);
    const [before] = await boxes(nav);
    await scrollTo(scroller, 400);
    await expect.poll(async () => (await boxes(nav))[0]!.y).toBeCloseTo(before!.y, 0);
  });

  // Where the marker is drawn, once it has stopped moving.
  const markerOf = (nav: Locator) => nav.locator(".htoc-marker");
  const settledBox = async (nav: Locator) => {
    await expect.poll(() => markerOf(nav).evaluate((n) => n.getAnimations().length)).toBe(0);
    return (await boxes(markerOf(nav)))[0]!;
  };

  test("the current link is in the accent, with the marker on the line beside it", async ({ page }) => {
    const { nav, links } = await parts(page);
    const primary = await page.evaluate(() => {
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.style.color = "var(--harmo-color-primary)";
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    });
    await expect(nav).toHaveAttribute("data-ready");
    await expect(links.first()).toHaveCSS("color", primary);
    await expect(markerOf(nav)).toHaveCSS("background-color", primary);
    await expect(markerOf(nav)).toHaveAttribute("aria-hidden", "true");
    const [link] = await boxes(links.first());
    const marker = await settledBox(nav);
    expect(marker.y).toBeCloseTo(link!.y, 0);
    expect(marker.height).toBeCloseTo(link!.height, 0);
    expect(marker.x + marker.width).toBeCloseTo(link!.x + link!.width, 0);
  });

  test("the marker slides to the section reached, and is placed at once on load", async ({ page }) => {
    const { nav, links, scroller } = await parts(page);
    await expect(nav).toHaveAttribute("data-ready");
    expect(await markerOf(nav).evaluate((n) => n.getAnimations().length)).toBe(0);
    await expect(markerOf(nav)).toHaveCSS("transition-property", "transform");
    await scrollTo(scroller, 450);
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
    const [link] = await boxes(links.nth(2));
    const marker = await settledBox(nav);
    expect(marker.y).toBeCloseTo(link!.y, 0);
  });

  test("with reduced motion, the marker moves at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { nav } = await parts(page);
    await expect(markerOf(nav)).toHaveCSS("transition-property", "none");
  });

  test("a level indents a heading under another", async ({ page }) => {
    const { links } = await parts(page, "with-sub-sections");
    const padding = (link: Locator) => link.evaluate((n) => parseFloat(getComputedStyle(n).paddingInlineStart));
    expect(await padding(links.nth(1))).toBeGreaterThan(await padding(links.nth(0)));
    expect(await padding(links.nth(5))).toBeGreaterThan(await padding(links.nth(4)));
  });

  test("right to left, the line and marker are on the right", async ({ page }) => {
    const { links } = await parts(page, "right-to-left");
    await expect(links.first()).toHaveAttribute("aria-current", "location");
    await expect(links.first()).toHaveCSS("border-right-width", "0px");
    await expect(links.first()).toHaveCSS("border-left-width", "1px");
    await expect(links.first()).not.toHaveCSS("border-left-color", "rgba(0, 0, 0, 0)");
  });

  test("a focus ring stays inside the link", async ({ page }) => {
    const { links } = await parts(page);
    await page.keyboard.press("Shift");
    await links.first().focus();
    await expect(links.first()).toHaveCSS("outline-style", "solid");
    await expect(links.first()).toHaveCSS("outline-offset", "-2px");
  });

  test("in forced colors, the marker is drawn in the system's colors", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Only Chromium emulates forced colors");
    const { nav } = await parts(page);
    await page.emulateMedia({ forcedColors: "active" });
    await expect(nav.locator(".htoc-marker")).toHaveCSS("forced-color-adjust", "none");
  });
});
