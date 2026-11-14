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

  // Where a heading is in the box, measured in the same frame as the click.
  const followNow = (link: Locator, heading: string) =>
    link.evaluate((node, heading) => {
      const box = node.closest(".htoc")!.parentElement!;
      (node as HTMLElement).click();
      return document.getElementById(heading)!.getBoundingClientRect().top - box.getBoundingClientRect().top;
    }, heading);

  test("following a link in a box glides, and is at once with reduced motion", async ({ page }) => {
    const { links, scroller } = await parts(page);
    // A box that glides by itself must still go at once.
    await scroller.evaluate((n) => ((n as HTMLElement).style.scrollBehavior = "smooth"));
    expect(Math.abs(await followNow(links.nth(3), "budget"))).toBeGreaterThan(50);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(Math.abs(await followNow(links.nth(1), "milestones"))).toBeLessThan(2);
  });

  test("it scrolls to where the browser would, after scroll-margin-top and scroll-padding-top", async ({ page }) => {
    const { links, scroller, container } = await parts(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await container.locator("#risks").evaluate((n) => ((n as HTMLElement).style.scrollMarginTop = "30px"));
    await scroller.evaluate((n) => ((n as HTMLElement).style.scrollPaddingTop = "12px"));
    expect(await followNow(links.nth(2), "risks")).toBeCloseTo(42, 0);
  });

  test("a followed link moves focus to its heading, so Tab carries on from there", async ({ page }) => {
    const { links, container } = await parts(page);
    const heading = container.locator("#risks");
    await links.nth(2).focus();
    await page.keyboard.press("Enter");
    await expect(heading).toBeFocused();
    await expect(heading).toHaveAttribute("tabindex", "-1");
    await page.keyboard.press("Tab");
    await expect(heading).not.toBeFocused();
    await expect(heading).not.toHaveAttribute("tabindex");
    expect(await links.evaluateAll((all) => all.includes(document.activeElement as HTMLAnchorElement))).toBe(false);
  });

  test("following the same link again adds no entry to the history", async ({ page }) => {
    const { links } = await parts(page);
    const length = () => page.evaluate(() => history.length);
    await links.nth(2).click();
    const after = await length();
    await links.nth(2).click();
    await links.nth(2).click();
    expect(await length()).toBe(after);
  });

  test("a key that doesn't scroll leaves a followed link marked as the box glides", async ({ page }) => {
    const { links, nav } = await parts(page);
    await nav.evaluate((n) => {
      const seen: string[] = [];
      (window as unknown as { seen: string[] }).seen = seen;
      new MutationObserver(() => {
        const current = n.querySelector("[aria-current]")?.textContent ?? "";
        if (seen.at(-1) !== current) seen.push(current);
      }).observe(n, { subtree: true, attributes: true, attributeFilter: ["aria-current"] });
    });
    await links.nth(4).click();
    await page.keyboard.press("Shift");
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => (window as unknown as { seen: string[] }).seen)).toEqual(["Contacts"]);
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

    // Partway there, a moment after the next section is reached.
    const [from, to, partway] = await nav.evaluate(async (n) => {
      const marker = n.querySelector(".htoc-marker")!;
      const from = marker.getBoundingClientRect().top;
      const link = n.querySelectorAll<HTMLElement>(".htoc-link")[4]!;
      link.click();
      await new Promise((done) => setTimeout(done, 70));
      return [from, link.getBoundingClientRect().top, marker.getBoundingClientRect().top];
    });
    expect(partway).toBeGreaterThan(from + 1);
    expect(partway).toBeLessThan(to - 1);
  });

  test("the marker follows a link that changes height while the list doesn't", async ({ page }) => {
    const { nav, links, scroller } = await parts(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const long = "A heading long enough to take two lines in the list";
    await links.nth(3).evaluate((n, long) => (n.textContent = long), long);
    await scrollTo(scroller, 450);
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
    const height = await nav.locator(".htoc-list").evaluate((n) => (n as HTMLElement).offsetHeight);
    // One above the current link gains a line as one below loses its second.
    await nav.evaluate((n, long) => {
      const all = n.querySelectorAll(".htoc-link");
      all[0]!.textContent = long;
      all[3]!.textContent = "Budget";
    }, long);
    expect(await nav.locator(".htoc-list").evaluate((n) => (n as HTMLElement).offsetHeight)).toBe(height);
    await expect.poll(async () => {
      const [link, marker] = await boxes(links.nth(2), markerOf(nav));
      return Math.round(marker!.y - link!.y);
    }).toBe(0);
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
